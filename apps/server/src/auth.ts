import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from './db';
import { rateLimit } from './rateLimit';
import { asyncHandler } from './asyncHandler';
import { env } from './env';

const BCRYPT_COST = 12;
// ITEM 224 — a minimum for NEW and CHANGED passwords. Existing accounts keep
// working regardless of their own password's length (never re-validated at
// login) — this is a floor on what a writer can SET from here on, not a
// retroactive one.
const MIN_PASSWORD_LENGTH = 8;

// ITEM 224 — session fixation: issue a FRESH session id at the moment a
// session gains an identity (sign-in or account creation), rather than
// reusing whatever anonymous session id the browser already held. Wraps
// express-session's own callback-style `regenerate` as a Promise; nothing
// of value lives in the pre-auth session to carry forward.
function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

interface UserRow {
  id: string;
  email: string;
  pass_hash: string;
  name: string | null;
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
  const name = String(req.body?.name || '').trim().slice(0, 80) || null;
  // ITEM 224 — the invite code. Read and checked before anything expensive
  // (bcrypt, the DB) runs, so a bad or missing code costs the server nothing.
  const code = String(req.body?.code || '').trim();

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    return;
  }
  // ITEM 224 — sign-up by invite code, until launch. An EMPTY configured
  // list is a server misconfiguration (no codes were ever set), answered
  // honestly as "not open" rather than silently admitted — fails closed.
  if (env.inviteCodes.length === 0) {
    res.status(503).json({ error: 'Registration is not open right now' });
    return;
  }
  if (!env.inviteCodes.includes(code)) {
    res.status(403).json({ error: 'Invalid invite code' });
    return;
  }

  const passHash = await bcrypt.hash(password, BCRYPT_COST);
  try {
    const { rows } = await pool.query<UserRow>(
      `insert into users (email, pass_hash, name) values ($1, $2, $3) returning id, email, pass_hash, name`,
      [email, passHash, name],
    );
    const user = rows[0];
    await regenerateSession(req);
    req.session.userId = user.id;
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
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
    `select id, email, pass_hash, name from users where email = $1`,
    [email],
  );
  const user = rows[0];
  const ok = user ? await bcrypt.compare(password, user.pass_hash) : false;
  if (!ok || !user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  await regenerateSession(req);
  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name });
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
    `select id, email, pass_hash, name from users where id = $1`,
    [req.session.userId],
  );
  const user = rows[0];
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name });
}));
