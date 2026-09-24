import express, { type Request, type Response, type NextFunction } from 'express';
import { join, resolve } from 'path';
import { env } from './env';
import { runMigrations } from './migrate';
import { sessionMiddleware } from './session';
import { authRouter, requireAuth } from './auth';
import { syncRouter } from './sync';
import { tutorRouter } from './tutor';

const distWeb = resolve(__dirname, '../../desktop/dist-web');

const app = express();

// Trust Railway's proxy so secure cookies and req.ip work behind it.
if (env.isProd) {
  app.set('trust proxy', 1);
}

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
  // eslint-disable-next-line no-console
  console.error('[server error]', err);
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
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  });
