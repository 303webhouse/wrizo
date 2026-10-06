import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
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

// ITEM 224, ROUND 3 (URGENT, Fable 2026-10-01) — a per-ACCOUNT failed-login
// THROTTLE, independent of the per-IP limiter below: that one is defeated
// by spreading attempts against ONE account across many IPs. INTERIM (in
// memory, no schema, resets on restart) — named as such, not the lasting
// shape. Keyed by the email actually attempted (whether or not it belongs
// to a real account — the throttled reply is identical either way, so this
// adds no new way to learn an email exists).
//
// REVISED FROM ROUND 2's hard lockout, same day: NEVER AN INDEFINITE LOCK.
// After 8 failures, an attempt SLOWS to at most one per minute — it never
// stops outright, so the account's own owner, typing the right password,
// gets back in on their very next attempt once a minute has passed, not
// after waiting out a fixed window. The count itself clears after 15
// QUIET minutes — no attempt of ANY kind, throttled or not, for that long
// — not a fixed timer from the 8th failure: an attacker who keeps trying
// (even once a minute) keeps the window alive exactly because they are
// still not quiet.
const FAILED_LOGIN_THRESHOLD = 8;
const THROTTLE_INTERVAL_MS = 60 * 1000;       // once throttled: at most one attempt per minute
const QUIET_CLEAR_MS = 15 * 60 * 1000;        // 15 minutes with NO attempt clears the count
const failedLogins = new Map<string, { count: number; lastAttemptAt: number }>();
function pruneFailedLogins(now: number): void {
  for (const [k, v] of failedLogins) {
    if (now - v.lastAttemptAt >= QUIET_CLEAR_MS) failedLogins.delete(k);
  }
}
// Checked BEFORE the real password check. true = refuse THIS attempt
// without touching the database or bcrypt; false = let it through (either
// under the threshold, or a full throttle interval has passed since the
// last attempt — exactly one attempt gets in per interval, never zero).
function isLoginThrottled(email: string): boolean {
  const now = Date.now();
  pruneFailedLogins(now);
  const entry = failedLogins.get(email);
  if (!entry || entry.count < FAILED_LOGIN_THRESHOLD) return false;
  if (now - entry.lastAttemptAt < THROTTLE_INTERVAL_MS) {
    // Being refused is itself an attempt for "quiet" purposes — it must
    // NOT let the 15-minute clock expire out from under an attacker who is
    // still actively (if slowly) trying.
    entry.lastAttemptAt = now;
    return true;
  }
  return false;
}
function recordFailedLogin(email: string): void {
  const now = Date.now();
  const entry = failedLogins.get(email);
  if (!entry || now - entry.lastAttemptAt >= QUIET_CLEAR_MS) {
    failedLogins.set(email, { count: 1, lastAttemptAt: now });
  } else {
    entry.count += 1;
    entry.lastAttemptAt = now;
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

// GUEST LOGIN (item 225) — a guest's clock. 30 days from creation or from the
// last authenticated sync (sync.ts stamps it, at most hourly); after that the
// guest may still CLAIM for GUEST_GRACE_MS and nothing else.
export const GUEST_GRACE_MS = 14 * 24 * 60 * 60 * 1000;

// A guest link's token is stored only as its SHA-256 hex — the raw token is
// shown once (the minting script) and never written anywhere else.
export function hashGuestToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Guard for /api/* routes: 401 unless a session user exists. A GUEST session
// also has its account row checked here — lazily, on the request that needs it,
// with no timer — so an expired guest is refused on its very next call.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (!req.session.guest) {
    next();
    return;
  }
  const { rows } = await pool.query<{ is_guest: boolean; guest_expires_at: Date | null }>(
    `select is_guest, guest_expires_at from users where id = $1`,
    [req.session.userId],
  );
  const row = rows[0];
  if (!row || !row.is_guest) {
    // Claimed (or removed) since this session was opened: an ordinary session now.
    req.session.guest = false;
    next();
    return;
  }
  if (!row.guest_expires_at || Date.now() > row.guest_expires_at.getTime()) {
    res.status(401).json({ error: 'This guest account has expired.', reason: 'guest_expired' });
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

  // ITEM 224, ROUND 3 — checked before the query/compare, so a throttled
  // attempt costs the server nothing further. Never a flat refusal: once a
  // full THROTTLE_INTERVAL_MS has passed, the very next attempt is let
  // through on its own merits.
  if (isLoginThrottled(email)) {
    res.status(429).json({ error: 'Too many attempts. Try again in a moment.' });
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

// GUEST LOGIN (item 225) — one link, one account. The link's token maps to a
// users row the minting script created; opening the link again reopens THAT
// account's session (a tester who loses their browser keeps their work), it
// never mints a second one. Sits under this router's per-IP auth limiter.
authRouter.post('/guest', asyncHandler(async (req: Request, res: Response) => {
  const token = String(req.body?.token || '');
  if (!token) {
    res.status(403).json({ error: 'This guest link is not valid.' });
    return;
  }
  const { rows } = await pool.query<{ id: string; email: string; name: string | null; is_guest: boolean; guest_expires_at: Date | null }>(
    `select u.id, u.email, u.name, u.is_guest, u.guest_expires_at
       from guest_links g join users u on u.id = g.user_id
      where g.token_hash = $1`,
    [hashGuestToken(token)],
  );
  const row = rows[0];
  if (!row || !row.is_guest) {
    res.status(403).json({ error: 'This guest link is not valid.' });
    return;
  }
  await regenerateSession(req);
  req.session.userId = row.id;
  req.session.guest = true;
  res.json({ id: row.id, email: row.email, name: row.name, guest: true, expiresAt: row.guest_expires_at });
}));

// GUEST LOGIN (item 225) — a guest keeps everything by becoming a full account
// in place: the SAME users row gets a real email and password, so no work moves.
// Allowed any time before expiry, and for GUEST_GRACE_MS after it. Rules match
// /register exactly (presence, MIN_PASSWORD_LENGTH); the session is regenerated.
authRouter.post('/claim', asyncHandler(async (req: Request, res: Response) => {
  if (!req.session.userId || !req.session.guest) {
    res.status(401).json({ error: 'Not a guest session' });
    return;
  }
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const name = String(req.body?.name || '').trim().slice(0, 80) || null;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    return;
  }
  const { rows: current } = await pool.query<{ is_guest: boolean; guest_expires_at: Date | null }>(
    `select is_guest, guest_expires_at from users where id = $1`,
    [req.session.userId],
  );
  const row = current[0];
  if (!row || !row.is_guest) {
    req.session.guest = false;
    res.status(401).json({ error: 'Not a guest session' });
    return;
  }
  if (!row.guest_expires_at || Date.now() > row.guest_expires_at.getTime() + GUEST_GRACE_MS) {
    res.status(401).json({ error: 'This guest account has expired.', reason: 'guest_expired' });
    return;
  }
  const passHash = await bcrypt.hash(password, BCRYPT_COST);
  try {
    const { rows } = await pool.query<UserRow>(
      `update users
          set email = $2, pass_hash = $3, name = coalesce($4, name),
              is_guest = false, guest_expires_at = null
        where id = $1 and is_guest
        returning id, email, pass_hash, name`,
      [req.session.userId, email, passHash, name],
    );
    const user = rows[0];
    if (!user) {
      res.status(401).json({ error: 'Not a guest session' });
      return;
    }
    await regenerateSession(req);
    req.session.userId = user.id;
    req.session.guest = false;
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err: any) {
    if (err?.code === '23505') {
      // Same neutral refusal /register gives — a claim must not confirm an email is taken.
      res.status(400).json({ error: 'Could not create an account with that information.' });
      return;
    }
    throw err;
  }
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
