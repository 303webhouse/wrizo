import express, { type Request, type Response, type NextFunction } from 'express';
import { join, resolve } from 'path';
import { env } from './env';
import { runMigrations } from './migrate';
import { sessionMiddleware } from './session';
import { authRouter } from './auth';
import { syncRouter } from './sync';

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

// Static app + SPA fallback. API/auth paths never fall through to index.html.
// (Express 5 rejects the bare '*' route pattern, so use a path-less middleware.)
app.use(express.static(distWeb));
app.use((req: Request, res: Response) => {
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/healthz') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
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
