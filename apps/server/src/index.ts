import express, { type Request, type Response, type NextFunction } from 'express';
import { join, resolve } from 'path';
import { env } from './env';
import { runMigrations } from './migrate';
import { sessionMiddleware } from './session';
import { authRouter, requireAuth } from './auth';
import { syncRouter } from './sync';
import { tutorRouter } from './tutor';
import { logError } from './logSafe';

const distWeb = resolve(__dirname, '../../desktop/dist-web');

const app = express();
// ITEM 224, ROUND 2 — don't name the framework. A single, free header that
// tells nothing useful to a writer and one more thing an attacker doesn't
// have to guess.
app.disable('x-powered-by');

// Trust Railway's proxy so secure cookies and req.ip work behind it.
if (env.isProd) {
  app.set('trust proxy', 1);
}

// ITEM 224 — basic response headers, on every response. No CSP yet (its own
// measured ticket) — these four are each a single, uncontroversial default
// with no app behaviour to break:
//   - nosniff: the browser never second-guesses a response's declared
//     Content-Type (blocks a classic MIME-sniffing-to-script vector).
//   - X-Frame-Options: DENY — this app is never meant to render inside
//     another site's frame (no embed feature exists).
//   - Referrer-Policy: only the origin crosses a navigation to another
//     site; the full path (which can carry a page id) never leaks.
//   - Strict-Transport-Security: tells a browser that has already reached
//     this host over HTTPS to never try plain HTTP again. Set ONLY in
//     production — Railway terminates TLS; local dev is plain HTTP, and a
//     browser ignores HSTS on a non-HTTPS response anyway, so this is
//     belt-and-suspenders, not load-bearing, in dev.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (env.isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ITEM 224, ROUND 2 — reject a state-changing request whose Origin isn't
// this app's own. The session cookie is already `sameSite: 'lax'`
// (session.ts), which blocks a cookie from riding a cross-site POST at
// all in a modern browser — this is a second, explicit line, for an older
// browser or any other path that first line doesn't cover. GET/HEAD/OPTIONS
// are exempt (nothing state-changing ever rides one in this app). An
// ABSENT Origin header fails OPEN — some legitimate same-origin requests
// and most non-browser clients never send one, and this app sets no CORS
// headers anywhere, so a cross-origin browser request already cannot read
// the response either way; a MISMATCHED Origin, which a forged cross-site
// request WILL carry, fails closed.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') { next(); return; }
  const origin = req.headers.origin;
  if (!origin) { next(); return; }
  const expected = `${req.protocol}://${req.get('host')}`;
  if (origin !== expected) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
});

// ITEM 203 - the limit is a NUMBER the error handler can hand back, and the client mirrors it (store/sync.ts).
// 'bytes' parses '5mb' as 5 * 1024 * 1024 = 5,242,880 - the boundary measured on this very middleware.
const BODY_LIMIT = '5mb';
const BODY_LIMIT_BYTES = 5 * 1024 * 1024;
// ITEM 203 (P3) - /api/sync ALONE may carry more, so ONE record over 5 MiB (a dense ink page) can finally reach another
// device. Measured, not guessed (docs/evidence/item203/):
//   * the EDGE is not the ceiling - production carried bodies up to 64 MiB to Express (proxy-ceiling-probe);
//   * the COST is ~7x the body in peak server memory (parse-cost-probe: 25 MiB -> ~195 MiB), because express.json buffers,
//     JSON.parse builds the tree, and the handler stringifies `strokes` again for the database parameter. 16 MiB is ~117 MiB
//     for the one request - and the client sends a body that big only for a LONE fat record (everything else is chunked to ~1 MB).
// So the larger limit is scoped and modest, and it is only ever granted to someone who has AUTHENTICATED: the parser for
// this route runs AFTER requireAuth (below), so an anonymous request is answered 401 without the server buffering a byte
// of it. (Before this, ANY anonymous POST made the server buffer and parse up to 5 MiB before it was refused - the probe
// that measured the edge relied on the refusal happening earlier than that.) Every other route keeps 5 MiB, before auth, as ever.
const SYNC_BODY_LIMIT = '16mb';
const SYNC_BODY_LIMIT_BYTES = 16 * 1024 * 1024;
const smallJson = express.json({ limit: BODY_LIMIT });
app.use((req: Request, res: Response, next: NextFunction) => (req.path === '/api/sync' ? next() : smallJson(req, res, next)));

// Health check — no DB, no session, always cheap.
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

app.use(sessionMiddleware);

app.use('/auth', authRouter);

// ITEM 203 (P3): authenticate FIRST, then read the larger body.
app.use('/api/sync', requireAuth, express.json({ limit: SYNC_BODY_LIMIT }));
app.use('/api', syncRouter);
// TU1 S5 — the Tutor's one new route (POST /api/tutor/chat).
app.use('/api', tutorRouter);

// Static app + SPA fallback. API/auth paths never fall through to index.html.
// (Express 5 rejects the bare '*' route pattern, so use a path-less middleware.)
//
// Caching: index.html MUST revalidate every load (no-cache) so a new deploy is
// picked up immediately — otherwise a stale index.html keeps pointing browsers
// at the previous content-hashed bundle. The /assets/* files are content-hashed
// (their name changes when the content does), so they're safe to cache forever.
app.use(express.static(distWeb, {
  setHeaders: (res: Response, filePath: string) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (/[\\/]assets[\\/]/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));
app.use((req: Request, res: Response) => {
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/healthz') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.setHeader('Cache-Control', 'no-cache'); // SPA fallback also serves index.html
  res.sendFile(join(distWeb, 'index.html'));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  // ITEM 203 (P1) - THIS HANDLER USED TO DISCARD err.status AND ANSWER 500 FOR EVERYTHING. body-parser raises
  // PayloadTooLargeError (status 413, type 'entity.too.large') for an over-limit push, and a 413 is exactly what a
  // client needs to tell 'this push is too big' from 'the server is down'. It is honoured now, with the limit in the
  // body. Any OTHER client error the framework marks `expose` (malformed JSON is a 400) keeps its own status too,
  // instead of masquerading as a server fault; everything else is still a logged 500.
  const e = err as { status?: number; statusCode?: number; type?: string; expose?: boolean };
  const status = e.status ?? e.statusCode;
  if (status === 413 || e.type === 'entity.too.large') {
    // eslint-disable-next-line no-console
    console.error('[server] refused a request body over the limit (413)');
    // the limit that applied to THIS request: /api/sync's is larger than everyone else's
    res.status(413).json({ error: 'payload too large', limitBytes: req.path === '/api/sync' ? SYNC_BODY_LIMIT_BYTES : BODY_LIMIT_BYTES });
    return;
  }
  if (typeof status === 'number' && status >= 400 && status < 500 && e.expose) {
    res.status(status).json({ error: 'bad request' });
    return;
  }
  logError('server', err);
  res.status(500).json({ error: 'Internal server error' });
});

runMigrations()
  .then(() => {
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Writer Studio server listening on :${env.port}`);
    });
  })
  .catch((err) => {
    logError('server-boot', err);
    process.exit(1);
  });
