// GUEST LOGIN (item 225) — the server half, browserless. Proves the real
// requireAuth, /auth/guest, /auth/claim, the Tutor's lifetime cap, and the
// activity stamp against a fake database that answers the exact SQL shapes the
// routes issue. The full app cannot boot here (no Postgres), so each module is
// transpiled from its own source and driven directly — the same technique the
// item 224 harness uses.
//
// What this does NOT prove: that the SQL runs on real Postgres (run it against a
// local cluster once guest_links is landed), and anything in a browser. Those are
// named, not implied.
//
// Run: node scripts/harness/guest-login.mjs   (from apps/server)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.resolve(here, '..', '..');
const SRC = path.join(SERVER, 'src');
const require = createRequire(path.join(SERVER, 'package.json'));
const ts = require('typescript');
const bcrypt = require('bcryptjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const tmp = path.join(SERVER, '.guest-login-harness-scratch');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

const DAY = 24 * 60 * 60 * 1000;
const sqlSrc = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

// ---- the fake db: answers the EXACT statements the guest routes issue --------
function makeFakeDb() {
  const usersById = new Map();
  const usersByEmail = new Map();
  const guestLinks = new Map(); // token_hash -> user_id
  const queries = [];
  const db = {
    queries,
    usersById,
    usersByEmail,
    guestLinks,
    async query(sql, params = []) {
      const s = sql.replace(/\s+/g, ' ').trim();
      queries.push({ sql: s, params });
      if (/^select is_guest, guest_expires_at from users where id/i.test(s)) {
        const u = usersById.get(params[0]);
        return { rows: u ? [{ is_guest: u.is_guest, guest_expires_at: u.guest_expires_at }] : [] };
      }
      if (/^select u\.id, u\.email, u\.name, u\.is_guest, u\.guest_expires_at from guest_links g join users u/i.test(s)) {
        const uid = guestLinks.get(params[0]);
        const u = uid && usersById.get(uid);
        return { rows: u ? [{ id: u.id, email: u.email, name: u.name, is_guest: u.is_guest, guest_expires_at: u.guest_expires_at }] : [] };
      }
      if (/^update users set email = \$2/i.test(s)) {
        const [id, email, pass_hash, name] = params;
        const u = usersById.get(id);
        if (!u || !u.is_guest) return { rows: [] };
        if ([...usersByEmail.keys()].includes(email)) { const e = new Error('duplicate key'); e.code = '23505'; throw e; }
        usersByEmail.delete(u.email);
        Object.assign(u, { email, pass_hash, name: name ?? u.name, is_guest: false, guest_expires_at: null });
        usersByEmail.set(email, u);
        return { rows: [{ id: u.id, email: u.email, pass_hash: u.pass_hash, name: u.name }] };
      }
      if (/^select tutor_turns_used as used from users where id/i.test(s)) {
        const u = usersById.get(params[0]);
        return { rows: u && u.is_guest ? [{ used: u.tutor_turns_used }] : [] };
      }
      if (/^update users set tutor_turns_used = tutor_turns_used \+ 1/i.test(s)) {
        const u = usersById.get(params[0]);
        if (u && u.is_guest) u.tutor_turns_used += 1;
        return { rows: [] };
      }
      if (/^update users set last_active_at = now\(\)/i.test(s)) {
        return { rows: [] };
      }
      throw new Error('FakeDb: unhandled query shape: ' + s);
    },
  };
  return db;
}
function seedGuest(db, { id = 'guest-1', expiresInMs = 10 * DAY, tutorUsed = 0, claimed = false } = {}) {
  const row = {
    id,
    email: `guest+${id}@guest.invalid`,
    pass_hash: 'unused',
    name: 'Tester',
    is_guest: !claimed,
    guest_expires_at: claimed ? null : new Date(Date.now() + expiresInMs),
    tutor_turns_used: tutorUsed,
  };
  db.usersById.set(id, row);
  return row;
}
function seedPlainUser(db, { id = 'plain-1', email = 'writer@example.com' } = {}) {
  const row = { id, email, pass_hash: 'unused', name: null, is_guest: false, guest_expires_at: null, tutor_turns_used: 0 };
  db.usersById.set(id, row);
  db.usersByEmail.set(email, row);
  return row;
}

function makeSession(extra = {}) {
  const s = { id: crypto.randomUUID(), ...extra };
  s.regenerate = (cb) => { s.id = crypto.randomUUID(); for (const k of Object.keys(s)) if (!['id', 'regenerate'].includes(k)) delete s[k]; cb(null); };
  return s;
}
function findHandler(router, routePath, method) {
  for (const layer of router.stack) {
    if (layer.route && layer.route.path === routePath && layer.route.methods[method]) {
      const stack = layer.route.stack;
      return stack[stack.length - 1].handle;
    }
  }
  throw new Error(`route not found: ${method.toUpperCase()} ${routePath}`);
}
async function callRoute(router, routePath, method, body, session) {
  const req = { body, session: session ?? makeSession() };
  return new Promise((resolve, reject) => {
    const res = { statusCode: 200, body: undefined };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.body = b; resolve({ status: res.statusCode, body: res.body, session: req.session }); return res; };
    let handler;
    try { handler = findHandler(router, routePath, method); } catch (e) { reject(e); return; }
    handler(req, res, (err) => {
      if (err) resolve({ status: 599, body: { thrown: String(err) }, session: req.session });
    });
  });
}

// ---- loaders -----------------------------------------------------------------
function stripTypes(tsSource) {
  return ts.transpileModule(tsSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
}
function writeExt(rel, jsText) {
  const dest = path.join(tmp, rel.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, jsText);
  return dest;
}
function clearCache() {
  for (const p of Object.keys(require.cache)) if (p.startsWith(tmp)) delete require.cache[p];
}
function resetEnv() {
  process.env.INVITE_CODES = 'x';
  process.env.TUTOR_DAILY_BUDGET = '1000';
  process.env.TUTOR_GLOBAL_DAILY_BUDGET = '10000';
  process.env.TUTOR_DISABLED = '0';
  process.env.SESSION_SECRET = 'harness-secret';
  process.env.DATABASE_URL = 'postgres://unused/unused';
  process.env.TUTOR_API_KEY = 'harness-key-not-real';
  process.env.TUTOR_BASE_URL = 'http://127.0.0.1:1/unreachable';
}
function installDb(db) {
  const dbDest = path.join(tmp, 'db.js');
  fs.writeFileSync(dbDest, '');
  require.cache[dbDest] = { id: dbDest, filename: dbDest, loaded: true, exports: { pool: db } };
}
function loadAuth(db, { authSourceOverride } = {}) {
  clearCache();
  resetEnv();
  writeExt('env.ts', stripTypes(sqlSrc('env.ts')));
  writeExt('asyncHandler.ts', stripTypes(sqlSrc('asyncHandler.ts')));
  fs.writeFileSync(path.join(tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
  installDb(db);
  const authSrc = authSourceOverride ?? sqlSrc('auth.ts');
  const dest = writeExt('auth.ts', stripTypes(authSrc));
  return require(dest);
}
function loadTutor(db) {
  clearCache();
  resetEnv();
  writeExt('env.ts', stripTypes(sqlSrc('env.ts')));
  writeExt('asyncHandler.ts', stripTypes(sqlSrc('asyncHandler.ts')));
  writeExt('logSafe.ts', stripTypes(sqlSrc('logSafe.ts')));
  fs.writeFileSync(path.join(tmp, 'auth.js'), 'exports.requireAuth = (req, res, next) => next();\r\n');
  fs.writeFileSync(path.join(tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
  installDb(db);
  const dest = writeExt('tutor.ts', stripTypes(sqlSrc('tutor.ts')));
  return require(dest).tutorRouter;
}

const { requireAuth, hashGuestToken, GUEST_GRACE_MS } = (() => {
  const db = makeFakeDb();
  return loadAuth(db);
})();

// Drives the REAL requireAuth export with a stub req/res/next.
async function runRequireAuth(db, session) {
  const { requireAuth: guard } = loadAuth(db);
  const req = { session };
  const res = { statusCode: 200, body: undefined, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  let nextCalled = false;
  await guard(req, res, () => { nextCalled = true; });
  return { status: res.statusCode, body: res.body, nextCalled, session };
}

// =============================================================================
// PART A — requireAuth: the guest clock, read lazily on the request that needs it.
// =============================================================================
{
  const db = makeFakeDb();
  seedPlainUser(db);
  const plain = await runRequireAuth(db, makeSession({ userId: 'plain-1' }));
  ok('(A1) an ordinary session passes straight through requireAuth', plain.nextCalled && db.queries.length === 0,
    JSON.stringify({ next: plain.nextCalled, queries: db.queries.length }));

  const none = await runRequireAuth(db, makeSession({}));
  ok('(A2) no session user is still a 401, unchanged', none.status === 401 && !none.nextCalled, JSON.stringify(none.body));

  const db2 = makeFakeDb();
  seedGuest(db2, { id: 'g-active', expiresInMs: 10 * DAY });
  const active = await runRequireAuth(db2, makeSession({ userId: 'g-active', guest: true }));
  ok('(A3) an ACTIVE guest session passes, after exactly one account read',
    active.nextCalled && db2.queries.length === 1, JSON.stringify({ next: active.nextCalled, queries: db2.queries.length }));

  const db3 = makeFakeDb();
  seedGuest(db3, { id: 'g-expired', expiresInMs: -1000 });
  const expired = await runRequireAuth(db3, makeSession({ userId: 'g-expired', guest: true }));
  ok('(A4) an EXPIRED guest is refused on its very next request, with reason guest_expired',
    expired.status === 401 && expired.body?.reason === 'guest_expired' && !expired.nextCalled, JSON.stringify(expired.body));

  const db4 = makeFakeDb();
  seedGuest(db4, { id: 'g-claimed', claimed: true });
  const claimed = await runRequireAuth(db4, makeSession({ userId: 'g-claimed', guest: true }));
  ok('(A5) a session whose account was claimed elsewhere becomes an ordinary session (guest flag cleared), not a refusal',
    claimed.nextCalled && claimed.session.guest === false, JSON.stringify({ next: claimed.nextCalled, guest: claimed.session.guest }));

  // Mutation: the expiry refusal removed. The expired-guest check (A4) must go red.
  const anchor = '  if (!row.guest_expires_at || Date.now() > row.guest_expires_at.getTime()) {';
  const authSrc = sqlSrc('auth.ts');
  if (!authSrc.includes(anchor)) throw new Error('mutation anchor not found — update this harness');
  const mutDb = makeFakeDb();
  seedGuest(mutDb, { id: 'g-mut', expiresInMs: -1000 });
  const { requireAuth: mutGuard } = loadAuth(mutDb, { authSourceOverride: authSrc.replace(anchor, '  if (false) {') });
  const mutRes = { statusCode: 200, body: undefined, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  let mutNext = false;
  await mutGuard({ session: makeSession({ userId: 'g-mut', guest: true }) }, mutRes, () => { mutNext = true; });
  ok('(A6) MUTATION KILLED: with the expiry refusal removed, an expired guest gets THROUGH — so A4 is what stops it',
    mutNext === true, JSON.stringify({ next: mutNext }));
}

// =============================================================================
// PART B — /auth/guest: one link, one account; the token is never stored raw.
// =============================================================================
{
  const db = makeFakeDb();
  seedGuest(db, { id: 'g-link', expiresInMs: 5 * DAY });
  const token = 'TOKEN-' + crypto.randomBytes(8).toString('hex');
  db.guestLinks.set(hashGuestToken(token), 'g-link');
  const router = loadAuth(db).authRouter;
  const session = makeSession();
  const before = session.id;
  const r = await callRoute(router, '/guest', 'post', { token }, session);
  ok('(B1) a valid guest link opens the account\'s session, marked as a guest',
    r.status === 200 && r.session.userId === 'g-link' && r.session.guest === true && r.body?.guest === true, JSON.stringify(r.body));
  ok('(B2) the session id is regenerated on the way in (no fixation)', r.session.id !== before, '');
  const lookup = db.queries.find((q) => /from guest_links/.test(q.sql));
  ok('(B3) the lookup is by the SHA-256 of the token — the raw token never reaches the database',
    lookup && lookup.params[0] === hashGuestToken(token) && !lookup.params.includes(token), JSON.stringify(lookup?.params));

  const again = await callRoute(router, '/guest', 'post', { token }, makeSession());
  ok('(B4) opening the same link again reopens THAT account (same id), never a second one',
    again.status === 200 && again.session.userId === 'g-link', JSON.stringify(again.body));

  const bad = await callRoute(router, '/guest', 'post', { token: 'nope' }, makeSession());
  ok('(B5) an unknown token is refused with 403', bad.status === 403, JSON.stringify(bad.body));
  const missing = await callRoute(router, '/guest', 'post', {}, makeSession());
  ok('(B6) a missing token is refused with 403', missing.status === 403, JSON.stringify(missing.body));

  seedGuest(db, { id: 'g-gone', claimed: true });
  db.guestLinks.set(hashGuestToken('claimed-token'), 'g-gone');
  const gone = await callRoute(router, '/guest', 'post', { token: 'claimed-token' }, makeSession());
  ok('(B7) a link whose account has already been claimed no longer opens anything (403)', gone.status === 403, JSON.stringify(gone.body));
}

// =============================================================================
// PART C — /auth/claim: the same row becomes a full account; grace is claim-only.
// =============================================================================
{
  const db = makeFakeDb();
  seedGuest(db, { id: 'c-1', expiresInMs: 3 * DAY });
  const router = loadAuth(db).authRouter;
  const notGuest = await callRoute(router, '/claim', 'post', { email: 'a@b.co', password: 'longenough' }, makeSession({ userId: 'x' }));
  ok('(C1) a session that is not a guest cannot claim (401)', notGuest.status === 401, JSON.stringify(notGuest.body));

  const session = makeSession({ userId: 'c-1', guest: true });
  const oldSessionId = session.id;
  const claim = await callRoute(router, '/claim', 'post', { email: '  Writer@Example.COM ', password: 'longenough', name: 'Ada' }, session);
  const row = db.usersById.get('c-1');
  ok('(C2) a guest claim returns 200, and the SAME row (same id) gains the email and clears the guest fields',
    claim.status === 200 && claim.body?.id === 'c-1' && row.email === 'writer@example.com' && row.is_guest === false && row.guest_expires_at === null,
    JSON.stringify({ status: claim.status, row: { email: row.email, is_guest: row.is_guest, exp: row.guest_expires_at } }));
  ok('(C3) the claimed session is regenerated and is no longer a guest session',
    claim.session.guest === false && claim.session.userId === 'c-1' && claim.session.id !== oldSessionId, JSON.stringify({ g: claim.session.guest }));
  ok('(C4) the claimed password is stored hashed, never as the raw text',
    row.pass_hash !== 'longenough' && await bcrypt.compare('longenough', row.pass_hash), '');

  const db2 = makeFakeDb();
  seedGuest(db2, { id: 'c-grace', expiresInMs: -3 * DAY });
  const router2 = loadAuth(db2).authRouter;
  const inGrace = await callRoute(router2, '/claim', 'post', { email: 'g@example.com', password: 'longenough' }, makeSession({ userId: 'c-grace', guest: true }));
  ok('(C5) an EXPIRED guest inside the 14-day grace may still claim (the claim-only grace)', inGrace.status === 200, JSON.stringify(inGrace.body));

  const db3 = makeFakeDb();
  seedGuest(db3, { id: 'c-late', expiresInMs: -(GUEST_GRACE_MS / DAY + 2) * DAY });
  const router3 = loadAuth(db3).authRouter;
  const late = await callRoute(router3, '/claim', 'post', { email: 'l@example.com', password: 'longenough' }, makeSession({ userId: 'c-late', guest: true }));
  ok('(C6) past the grace window, claim is refused with guest_expired', late.status === 401 && late.body?.reason === 'guest_expired', JSON.stringify(late.body));

  const shortPw = await callRoute(router, '/claim', 'post', { email: 'x@y.co', password: 'short' }, makeSession({ userId: 'c-2', guest: true }));
  ok('(C7) the password floor is the same MIN_PASSWORD_LENGTH /register enforces (8)', shortPw.status === 400 && /at least 8/.test(shortPw.body?.error || ''), JSON.stringify(shortPw.body));
  const noEmail = await callRoute(router, '/claim', 'post', { password: 'longenough' }, makeSession({ userId: 'c-2', guest: true }));
  ok('(C8) email is required, as on /register', noEmail.status === 400, JSON.stringify(noEmail.body));

  const db4 = makeFakeDb();
  seedPlainUser(db4, { id: 'taken', email: 'taken@example.com' });
  seedGuest(db4, { id: 'c-dup', expiresInMs: 3 * DAY });
  const router4 = loadAuth(db4).authRouter;
  const dup = await callRoute(router4, '/claim', 'post', { email: 'taken@example.com', password: 'longenough' }, makeSession({ userId: 'c-dup', guest: true }));
  ok('(C9) a claim onto an email already taken gets the NEUTRAL /register refusal (400), never a "that email exists" reply',
    dup.status === 400 && dup.body?.error === 'Could not create an account with that information.', JSON.stringify(dup.body));
  ok('(C10) and the guest row is untouched by the refused claim', db4.usersById.get('c-dup').is_guest === true, '');
}

// =============================================================================
// PART D — the Tutor's lifetime guest cap (75), counted only on success.
// =============================================================================
{
  const msgs = [{ role: 'writer', text: 'hello' }];
  const db = makeFakeDb();
  seedGuest(db, { id: 't-cap', tutorUsed: 75 });
  const router = loadTutor(db);
  const capped = await callRoute(router, '/tutor/chat', 'post', { messages: msgs }, makeSession({ userId: 't-cap', guest: true }));
  ok('(D1) a guest at the lifetime cap is refused (403) with the plain sentence, before any model call',
    capped.status === 403 && /used up/.test(capped.body?.error || ''), JSON.stringify(capped.body));
  ok('(D2) the capped refusal never reaches the model (no counter write, no model path)',
    !db.queries.some((q) => /tutor_turns_used = tutor_turns_used \+ 1/.test(q.sql)), '');

  const db2 = makeFakeDb();
  seedGuest(db2, { id: 't-under', tutorUsed: 74 });
  const router2 = loadTutor(db2);
  const under = await callRoute(router2, '/tutor/chat', 'post', { messages: msgs }, makeSession({ userId: 't-under', guest: true }));
  ok('(D3) a guest under the cap reaches the model path (the unreachable test endpoint answers 502)',
    under.status === 502, JSON.stringify(under.body));
  ok('(D4) a FAILED model call does not spend a turn — the counter stays at 74',
    db2.usersById.get('t-under').tutor_turns_used === 74, JSON.stringify(db2.usersById.get('t-under').tutor_turns_used));

  const db3 = makeFakeDb();
  seedPlainUser(db3, { id: 't-plain' });
  const router3 = loadTutor(db3);
  await callRoute(router3, '/tutor/chat', 'post', { messages: msgs }, makeSession({ userId: 't-plain' }));
  ok('(D5) an ordinary account never touches the guest counter', !db3.queries.some((q) => /tutor_turns_used/.test(q.sql)), '');

  const tutorSrc = sqlSrc('tutor.ts');
  const incIdx = tutorSrc.indexOf('tutor_turns_used = tutor_turns_used + 1');
  const replyIdx = tutorSrc.indexOf('      reply: text,');
  const capIdx = tutorSrc.indexOf('const GUEST_TUTOR_TURN_CAP = 75');
  const dailyIdx = tutorSrc.indexOf('consumeTutorBudget(req.session.userId!)');
  ok('(D6) the count sits in the success path, before the reply is sent, and the cap is checked before the daily budget',
    incIdx > 0 && incIdx < replyIdx && capIdx > 0 && capIdx < dailyIdx, JSON.stringify({ incIdx, replyIdx, capIdx, dailyIdx }));
}

// =============================================================================
// PART E — the activity stamp and the four columns: source-level, because the
// sync handler's own imports are the whole app. Named as such, not implied.
// =============================================================================
{
  const syncSrc = sqlSrc('sync.ts');
  const stampCall = syncSrc.indexOf('await stampActivity(userId);');
  const handlerIdx = syncSrc.indexOf("syncRouter.post('/sync'");
  ok('(E1) every authenticated /api/sync stamps activity, before any of its own work',
    stampCall > handlerIdx && handlerIdx > 0, JSON.stringify({ stampCall, handlerIdx }));
  ok('(E2) the stamp is gated to at most once an hour, and cannot extend an expired guest',
    /last_active_at < now\(\) - interval '1 hour'/.test(syncSrc) && /guest_expires_at > now\(\)/.test(syncSrc), '');
  ok('(E3) the expiry slides to now + 30 days, and only for a guest row',
    /case when is_guest then now\(\) \+ interval '30 days'/.test(syncSrc), '');
  ok('(E4) a failed stamp is logged and never fails the sync',
    /catch \(err\) \{\s*logError\('sync', err, \{ kind: 'activity' \}\);/.test(syncSrc), '');

  const migSrc = sqlSrc('migrate.ts');
  const cols = [
    'alter table users add column if not exists is_guest boolean not null default false',
    'alter table users add column if not exists guest_expires_at timestamptz',
    'alter table users add column if not exists last_active_at timestamptz',
    'alter table users add column if not exists tutor_turns_used integer not null default 0',
  ];
  ok('(E5) the four approved users columns are added inline in migrate.ts, exactly as approved',
    cols.every((c) => migSrc.includes(c)), JSON.stringify(cols.filter((c) => !migSrc.includes(c))));
  ok('(E6) migrate.ts does NOT create guest_links — its DDL waits for Nick\'s word',
    !/create table[^;]*guest_links/i.test(migSrc), '');
  const pendingPath = path.join(SERVER, 'migrations', 'pending', '002_guest_links.sql');
  ok('(E7) the guest_links DDL exists, parked under migrations/pending (not read by the boot path)',
    fs.existsSync(pendingPath) && /create table guest_links/.test(fs.readFileSync(pendingPath, 'utf8')), '');
}

fs.rmSync(tmp, { recursive: true, force: true });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nGUEST-LOGIN VERIFY: PASS (${checks.length} checks)`
  : `\nGUEST-LOGIN VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
