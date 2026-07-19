import express, { type Request, type Response, type NextFunction } from 'express';
import { join, resolve } from 'path';
import { env } from './env';
import { runMigrations } from './migrate';
import { sessionMiddleware } from './session';
import { authRouter } from './auth';
import { syncRouter } from './sync';
import { tutorRouter } from './tutor';

const distWeb = resolve(__dirname, '../../desktop/dist-web');

const app = express();

// Trust Railway's proxy so secure cookies and req.ip work behind it.
if (env.isProd) {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '5mb' }));

// Health check — no DB, no session, always cheap.
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

app.use(sessionMiddleware);

app.use('/auth', authRouter);

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
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
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
