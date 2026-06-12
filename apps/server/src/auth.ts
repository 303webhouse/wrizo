import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from './db';
import { env } from './env';
import { rateLimit } from './rateLimit';
import { asyncHandler } from './asyncHandler';

const BCRYPT_COST = 12;

interface UserRow {
  id: string;
  email: string;
  pass_hash: string;
}

// Guard for /api/* routes: 401 unless a session user exists.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  next();
}

export const authRouter = Router();

// 20 requests / minute / IP across all auth endpoints.
authRouter.use(rateLimit(20, 60_000));

authRouter.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const inviteCode = String(req.body?.inviteCode || '');

  if (inviteCode !== env.inviteCode) {
    res.status(403).json({ error: 'Invalid invite code' });
    return;
  }
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const passHash = await bcrypt.hash(password, BCRYPT_COST);
  try {
    const { rows } = await pool.query<UserRow>(
      `insert into users (email, pass_hash) values ($1, $2) returning id, email, pass_hash`,
      [email, passHash],
    );
    const user = rows[0];
    req.session.userId = user.id;
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err: any) {
    if (err?.code === '23505') {
      res.status(409).json({ error: 'An account with that email already exists' });
      return;
    }
    throw err;
  }
}));

authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const { rows } = await pool.query<UserRow>(
    `select id, email, pass_hash from users where email = $1`,
    [email],
  );
  const user = rows[0];
  const ok = user ? await bcrypt.compare(password, user.pass_hash) : false;
  if (!ok || !user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email });
}));

authRouter.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

authRouter.get('/me', asyncHandler(async (req: Request, res: Response) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { rows } = await pool.query<UserRow>(
    `select id, email, pass_hash from users where id = $1`,
    [req.session.userId],
  );
  const user = rows[0];
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ id: user.id, email: user.email });
}));
