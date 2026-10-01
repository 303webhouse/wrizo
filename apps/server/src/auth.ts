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

// ITEM 224, ROUND 2 — a fixed hash to compare against when no account
// matches the email, so sign-in runs the SAME ONE bcrypt.compare either
// way: an unknown email used to skip it entirely (`user ? compare(...) :
// false`), which is a timing tell an attacker can use to learn which
// emails have accounts. The dummy password is never a real one and never
// read back; only the hash's own cost matters, which matches real users'
// (BCRYPT_COST). Computed once at module load, not per request.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('item224-round2-timing-parity-only', BCRYPT_COST);

// ITEM 224, ROUND 2 — a per-ACCOUNT failed-login throttle, independent of
// the per-IP limiter below: that one is defeated by spreading attempts
// against ONE account across many IPs. INTERIM (in memory, no schema,
// resets on restart) — named as such, not the lasting shape. Keyed by the
// email actually attempted (whether or not it belongs to a real account —
// the lockout reply is identical either way, so this adds no new way to
// learn an email exists), pruned of every expired entry on each check so
// an attacker flooding many distinct emails cannot grow this past the
// window's own worth of recent activity.
const FAILED_LOGIN_MAX = 8;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const failedLogins = new Map<string, { count: number; windowStart: number }>();
function pruneFailedLogins(now: number): void {
  for (const [k, v] of failedLogins) {
    if (now - v.windowStart >= FAILED_LOGIN_WINDOW_MS) failedLogins.delete(k);
  }
}
function isLoginLocked(email: string): boolean {
  const now = Date.now();
  pruneFailedLogins(now);
  const entry = failedLogins.get(email);
  return !!entry && entry.count >= FAILED_LOGIN_MAX;
}
function recordFailedLogin(email: string): void {
  const now = Date.now();
  const entry = failedLogins.get(email);
  if (!entry || now - entry.windowStart >= FAILED_LOGIN_WINDOW_MS) {
    failedLogins.set(email, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}
function clearFailedLogins(email: string): void {
  failedLogins.delete(email);
}

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

// ITEM 224, ROUND 2 — public (no auth, nothing account-specific): lets the
// sign-up screen know WHETHER it should show the form at all, so a closed
// gate reads as "by invitation" from the first paint, never as a 503 the
// writer only discovers after filling in a form and pressing Create.
authRouter.get('/signup-status', (_req: Request, res: Response) => {
  res.json({ open: env.inviteCodes.length > 0 });
});

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
      // ITEM 224, ROUND 2 — a NEUTRAL reply: the previous wording ("an
      // account with that email already exists") confirmed the email's
      // registered to anyone who tried it, whether or not it was theirs.
      // Same status family as every other register refusal above (400) —
      // the status code itself no longer distinguishes this reason either.
      res.status(400).json({ error: 'Could not create an account with that information.' });
      return;
    }
    throw err;
  }
}));

authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  // ITEM 224, ROUND 2 — checked before the query/compare, so a locked
  // account's attempts cost the server nothing further.
  if (isLoginLocked(email)) {
    res.status(429).json({ error: 'Too many attempts. Try again later.' });
    return;
  }

  const { rows } = await pool.query<UserRow>(
    `select id, email, pass_hash, name from users where email = $1`,
    [email],
  );
  const user = rows[0];
  // ITEM 224, ROUND 2 — ALWAYS one compare, real hash or the fixed dummy
  // one — see DUMMY_PASSWORD_HASH's own comment for why.
  const ok = await bcrypt.compare(password, user ? user.pass_hash : DUMMY_PASSWORD_HASH);
  if (!ok || !user) {
    recordFailedLogin(email);
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  clearFailedLogins(email);
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
