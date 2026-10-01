// ITEM 224 — server hardening. Browserless proofs against the REAL route
// handlers (apps/server/src/auth.ts, tutor.ts, index.ts), each falsified
// first: every claim below is also run against an IN-MEMORY-MUTATED copy of
// the same source text (the real file on disk is never touched — the
// mutation lives only in a string held in this process) to confirm the
// check is load-bearing, not a dead branch that happened to agree.
//
// No real Postgres exists in this build environment (same constraint
// tu1.mjs/tu2.mjs's own headers already document for the Tutor route) — a
// FAKE `./db` pool is substituted, built directly from auth.ts's own three
// SQL statements (insert into users…, select … where email, select … where
// id), never a re-implementation of auth.ts's logic itself. Session is a
// plain stub object (`regenerate` reassigns an `id` field) — the real
// express-session middleware is not exercised; what IS exercised is every
// line auth.ts itself runs once a session object exists.
//
// Run: node scripts/harness/item224-server-hardening.mjs   (from
// apps/server, after pnpm install).
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

const tmp = path.join(SERVER, '.item224-harness-scratch');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

// ---- the fake db, built from auth.ts's own three real SQL statements -----
function makeFakeDb() {
  const usersById = new Map();
  const usersByEmail = new Map();
  let nextId = 1;
  return {
    calls: [],
    async query(sql, params = []) {
      this.calls.push(sql.trim().split('\n')[0]);
      const s = sql.trim();
      if (/^insert into users/i.test(s)) {
        const [email, pass_hash, name] = params;
        if (usersByEmail.has(email)) { const e = new Error('duplicate key'); e.code = '23505'; throw e; }
        const row = { id: `user-${nextId++}`, email, pass_hash, name };
        usersByEmail.set(email, row);
        usersById.set(row.id, row);
        return { rows: [row] };
      }
      if (/^select .* from users where email/i.test(s)) {
        const row = usersByEmail.get(params[0]);
        return { rows: row ? [row] : [] };
      }
      if (/^select .* from users where id/i.test(s)) {
        const row = usersById.get(params[0]);
        return { rows: row ? [row] : [] };
      }
      throw new Error('FakeDb: unhandled query shape: ' + s);
    },
    seedUser: async (email, password) => {
      const pass_hash = await bcrypt.hash(password, 4); // low cost — this is a test double, not a security boundary
      const row = { id: `user-${nextId++}`, email, pass_hash, name: null };
      usersByEmail.set(email, row);
      usersById.set(row.id, row);
      return row;
    },
  };
}

function makeSession() {
  const s = { id: crypto.randomUUID(), userId: undefined };
  s.regenerate = (cb) => { s.id = crypto.randomUUID(); cb(null); };
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

// ---- loader: auth.ts (optionally with an in-memory-mutated source) -------
function stripTypes(tsSource) {
  return ts.transpileModule(tsSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
}
function writeExt(rel, jsText) {
  const dest = path.join(tmp, rel.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, jsText);
  return dest;
}
function resetEnv(inviteCodesCsv, dailyBudget) {
  process.env.INVITE_CODES = inviteCodesCsv;
  process.env.TUTOR_DAILY_BUDGET = String(dailyBudget);
  process.env.SESSION_SECRET = 'harness-secret';
  process.env.DATABASE_URL = 'postgres://unused/unused';
  process.env.TUTOR_API_KEY = 'harness-key-not-real';
  process.env.TUTOR_BASE_URL = 'http://127.0.0.1:1/unreachable';
}
function clearCache() {
  for (const p of Object.keys(require.cache)) {
    if (p.startsWith(tmp)) delete require.cache[p];
  }
}
let fakeDb;
function loadAuth({ authSourceOverride } = {}) {
  clearCache();
  fakeDb = makeFakeDb();
  writeExt('env.ts', stripTypes(fs.readFileSync(path.join(SRC, 'env.ts'), 'utf8')));
  writeExt('asyncHandler.ts', stripTypes(fs.readFileSync(path.join(SRC, 'asyncHandler.ts'), 'utf8')));
  fs.writeFileSync(path.join(tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
  const dbDest = path.join(tmp, 'db.js');
  fs.writeFileSync(dbDest, ''); // placeholder; real export installed via require.cache injection below
  const authSrc = authSourceOverride ?? fs.readFileSync(path.join(SRC, 'auth.ts'), 'utf8');
  const authDest = writeExt('auth.ts', stripTypes(authSrc));
  // Inject the fake pool directly into the module cache for './db' BEFORE
  // auth.js's own require('./db') runs, so no file-based stub is needed.
  require.cache[dbDest] = { id: dbDest, filename: dbDest, loaded: true, exports: { pool: fakeDb } };
  const { authRouter } = require(authDest);
  return authRouter;
}
function loadTutor({ tutorSourceOverride } = {}) {
  clearCache();
  writeExt('env.ts', stripTypes(fs.readFileSync(path.join(SRC, 'env.ts'), 'utf8')));
  writeExt('asyncHandler.ts', stripTypes(fs.readFileSync(path.join(SRC, 'asyncHandler.ts'), 'utf8')));
  fs.writeFileSync(path.join(tmp, 'auth.js'), 'exports.requireAuth = (req, res, next) => next();\r\n');
  fs.writeFileSync(path.join(tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
  const tutorSrc = tutorSourceOverride ?? fs.readFileSync(path.join(SRC, 'tutor.ts'), 'utf8');
  const dest = writeExt('tutor.ts', stripTypes(tutorSrc));
  const { tutorRouter } = require(dest);
  return tutorRouter;
}
// asyncHandler's own wrapper is `(req,res,next) => { fn(req,res,next).catch(next); }`
// — it returns SYNCHRONOUSLY the instant it kicks `fn` off, before any of
// fn's own awaits (bcrypt, the fake db, session.regenerate) land. Awaiting
// that call directly would read `res` prematurely, a real race this harness
// hit on its first run (a slower path, e.g. bcrypt's genuine cost, simply
// hadn't finished). So this resolves on the REAL completion signal instead:
// whichever of res.json() or the error-forwarding `next(err)` actually fires.
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

// =============================================================================
// (a) SIGN-UP BY INVITE CODE — fails closed when unconfigured; rejects a
// wrong code; accepts a right one. All against the REAL /auth/register
// handler.
// =============================================================================
{
  resetEnv('', 50);
  const router = loadAuth();
  const closedResult = await callRoute(router, '/register', 'post', { email: 'a@example.com', password: 'longenough1', name: 'A', code: 'anything' });
  ok('(a) CLOSED: no INVITE_CODES configured -> 503 "Registration is not open right now", and the database is NEVER touched (fails before the expensive path)',
    closedResult.status === 503 && closedResult.body?.error === 'Registration is not open right now' && fakeDb.calls.length === 0,
    JSON.stringify({ status: closedResult.status, body: closedResult.body, dbCalls: fakeDb.calls }));

  resetEnv('ABC123,xyz-999', 50);
  const router2 = loadAuth();
  const wrongResult = await callRoute(router2, '/register', 'post', { email: 'b@example.com', password: 'longenough1', name: 'B', code: 'wrong-code' });
  ok('(a) WRONG CODE: a configured list rejects a non-matching code with 403, DB still untouched',
    wrongResult.status === 403 && wrongResult.body?.error === 'Invalid invite code' && fakeDb.calls.length === 0,
    JSON.stringify({ status: wrongResult.status, dbCalls: fakeDb.calls }));

  const rightResult = await callRoute(router2, '/register', 'post', { email: 'c@example.com', password: 'longenough1', name: 'C', code: 'xyz-999' });
  ok('(a) RIGHT CODE: the second configured code succeeds (201) and DOES reach the database',
    rightResult.status === 201 && fakeDb.calls.some((c) => /insert into users/i.test(c)),
    JSON.stringify({ status: rightResult.status, body: rightResult.body }));

  // FALSIFIED: an in-memory mutation that deletes the invite-code check —
  // the WRONG-CODE case above must turn green-for-the-wrong-reason (no
  // longer 403) once the check is actually gone, proving it was load-
  // bearing, not a branch nothing could reach.
  const realAuthSrc = fs.readFileSync(path.join(SRC, 'auth.ts'), 'utf8');
  const mutatedAnchor = "  if (!env.inviteCodes.includes(code)) {\r\n    res.status(403).json({ error: 'Invalid invite code' });\r\n    return;\r\n  }\r\n";
  if (!realAuthSrc.includes(mutatedAnchor)) throw new Error('(a) mutation anchor not found in the real auth.ts — the check may have moved; update this harness');
  const mutatedSrc = realAuthSrc.replace(mutatedAnchor, '');
  resetEnv('ABC123,xyz-999', 50);
  const mutatedRouter = loadAuth({ authSourceOverride: mutatedSrc });
  const mutantResult = await callRoute(mutatedRouter, '/register', 'post', { email: 'mutant@example.com', password: 'longenough1', name: 'M', code: 'wrong-code' });
  ok('(a) MUTATION KILLED: with the invite-code check removed (in memory only — the real file is untouched), the SAME wrong-code request now succeeds (201) instead of 403 — confirms the real check is what blocks it',
    mutantResult.status === 201, JSON.stringify(mutantResult));
}

// =============================================================================
// (d) MINIMUM PASSWORD LENGTH (8) for new/changed passwords; existing
// accounts are never re-validated.
// =============================================================================
{
  resetEnv('ABC123', 50);
  const router = loadAuth();
  const short = await callRoute(router, '/register', 'post', { email: 'short@example.com', password: '1234567', name: null, code: 'ABC123' });
  ok('(d) a 7-character password is REFUSED (400) before the database is touched',
    short.status === 400 && /at least 8 characters/.test(short.body?.error ?? '') && fakeDb.calls.length === 0,
    JSON.stringify({ status: short.status, body: short.body, dbCalls: fakeDb.calls }));
  const exact = await callRoute(router, '/register', 'post', { email: 'exact8@example.com', password: '12345678', name: null, code: 'ABC123' });
  ok('(d) an exactly-8-character password clears the length check (the boundary itself, not just "long enough")',
    exact.status === 201, JSON.stringify(exact));

  const authSrcForLogin = fs.readFileSync(path.join(SRC, 'auth.ts'), 'utf8');
  const loginBlockMatch = authSrcForLogin.match(/authRouter\.post\('\/login',[\s\S]*?\}\)\);/);
  ok('(d) EXISTING PASSWORDS UNAFFECTED: /login\'s own handler contains no length check at all (source-level — it never re-validates a stored password\'s length, so an old short password keeps working)',
    !!loginBlockMatch && !/MIN_PASSWORD_LENGTH|password\.length/.test(loginBlockMatch[0]), '');

  // FALSIFIED: delete the length check in memory; the 7-char case must stop
  // being refused for this reason.
  const mutAnchor = `  if (password.length < MIN_PASSWORD_LENGTH) {\r\n    res.status(400).json({ error: \`Password must be at least \${MIN_PASSWORD_LENGTH} characters\` });\r\n    return;\r\n  }\r\n`;
  if (!authSrcForLogin.includes(mutAnchor)) throw new Error('(d) mutation anchor not found — update this harness');
  resetEnv('ABC123', 50);
  const mutRouter = loadAuth({ authSourceOverride: authSrcForLogin.replace(mutAnchor, '') });
  const mutShort = await callRoute(mutRouter, '/register', 'post', { email: 'mut-short@example.com', password: '1234567', name: null, code: 'ABC123' });
  ok('(d) MUTATION KILLED: with the length check removed, the SAME 7-character password now succeeds (201) — confirms the real check is what refuses it',
    mutShort.status === 201, JSON.stringify(mutShort));
}

// =============================================================================
// (c) SESSION REGENERATION at sign-in AND account creation.
// =============================================================================
{
  resetEnv('ABC123', 50);
  const router = loadAuth();
  const sess1 = makeSession();
  const idBefore1 = sess1.id;
  const reg = await callRoute(router, '/register', 'post', { email: 'sess-reg@example.com', password: 'longenough1', name: null, code: 'ABC123' }, sess1);
  ok('(c) REGISTER: a fresh session id is issued (not the pre-auth id) AND userId is set, in that order being provable by both having happened',
    reg.status === 201 && reg.session.id !== idBefore1 && typeof reg.session.userId === 'string',
    JSON.stringify({ idBefore: idBefore1, idAfter: reg.session.id, userId: reg.session.userId }));

  await fakeDb.seedUser('sess-login@example.com', 'correct-password1');
  const sess2 = makeSession();
  const idBefore2 = sess2.id;
  const login = await callRoute(router, '/login', 'post', { email: 'sess-login@example.com', password: 'correct-password1' }, sess2);
  ok('(c) LOGIN: a fresh session id is issued on a SUCCESSFUL sign-in',
    login.status === 200 && login.session.id !== idBefore2, JSON.stringify({ idBefore: idBefore2, idAfter: login.session.id }));

  const sess3 = makeSession();
  const idBefore3 = sess3.id;
  const badLogin = await callRoute(router, '/login', 'post', { email: 'sess-login@example.com', password: 'WRONG' }, sess3);
  ok('(c) A FAILED sign-in regenerates NOTHING — the session id is untouched and userId stays unset (regenerate only follows a genuine success)',
    badLogin.status === 401 && sess3.id === idBefore3 && sess3.userId === undefined, JSON.stringify({ status: badLogin.status, idBefore: idBefore3, idAfter: sess3.id }));

  // FALSIFIED: remove the login regenerate call in memory.
  const realSrc = fs.readFileSync(path.join(SRC, 'auth.ts'), 'utf8');
  const loginRegenAnchor = '  await regenerateSession(req);\r\n  req.session.userId = user.id;\r\n  res.json({ id: user.id, email: user.email, name: user.name });\r\n}));';
  if (!realSrc.includes(loginRegenAnchor)) throw new Error('(c) login mutation anchor not found — update this harness');
  resetEnv('ABC123', 50);
  const mutRouter = loadAuth({ authSourceOverride: realSrc.replace(loginRegenAnchor, "  req.session.userId = user.id;\r\n  res.json({ id: user.id, email: user.email, name: user.name });\r\n}));") });
  await fakeDb.seedUser('mut-login@example.com', 'correct-password1');
  const mutSess = makeSession();
  const mutIdBefore = mutSess.id;
  const mutLogin = await callRoute(mutRouter, '/login', 'post', { email: 'mut-login@example.com', password: 'correct-password1' }, mutSess);
  ok('(c) MUTATION KILLED: with the login regenerate call removed, a successful sign-in now keeps the SAME pre-auth session id — confirms the real call is what changes it',
    mutLogin.status === 200 && mutSess.id === mutIdBefore, JSON.stringify({ idBefore: mutIdBefore, idAfter: mutSess.id }));
}

// =============================================================================
// (b) PER-PERSON DAILY TUTOR BUDGET, on top of the existing per-IP limit.
// =============================================================================
{
  resetEnv('ABC123', 2); // a tiny budget — 2/day — so the test doesn't need 50 real calls
  const router = loadTutor();
  const msg = (n) => Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? 'writer' : 'tutor', text: `m${i}` }));
  const r1 = await callRoute(router, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'budget-user-1' });
  const r2 = await callRoute(router, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'budget-user-1' });
  const r3 = await callRoute(router, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'budget-user-1' });
  ok('(b) the first TWO sends (the configured budget) for one person both clear the budget gate (never 429 for THIS reason)',
    r1.status !== 429 && r2.status !== 429, JSON.stringify({ r1: r1.status, r2: r2.status }));
  ok('(b) the THIRD send for the SAME person, same day, is refused: 429 "Daily Tutor limit reached — try again tomorrow."',
    r3.status === 429 && r3.body?.error === 'Daily Tutor limit reached — try again tomorrow.', JSON.stringify(r3));

  const otherUser = await callRoute(router, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'budget-user-2' });
  ok('(b) a DIFFERENT person, same moment, has their OWN separate budget — not 429 (per-person, not a shared/global counter)',
    otherUser.status !== 429, JSON.stringify(otherUser));

  // FALSIFIED: make the budget check always pass.
  const realTutorSrc = fs.readFileSync(path.join(SRC, 'tutor.ts'), 'utf8');
  const budgetAnchor = "  if (!consumeTutorBudget(req.session.userId!)) {\r\n    res.status(429).json({ error: 'Daily Tutor limit reached — try again tomorrow.' });\r\n    return;\r\n  }\r\n";
  if (!realTutorSrc.includes(budgetAnchor)) throw new Error('(b) mutation anchor not found — update this harness');
  resetEnv('ABC123', 2);
  const mutRouter = loadTutor({ tutorSourceOverride: realTutorSrc.replace(budgetAnchor, '') });
  const m1 = await callRoute(mutRouter, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'mutant-user' });
  const m2 = await callRoute(mutRouter, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'mutant-user' });
  const m3 = await callRoute(mutRouter, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'mutant-user' });
  ok('(b) MUTATION KILLED: with the budget check removed, a THIRD send for the same person in the same day is no longer 429 — confirms the real check is what refuses it',
    m1.status !== 429 && m2.status !== 429 && m3.status !== 429, JSON.stringify({ m1: m1.status, m2: m2.status, m3: m3.status }));
}

// =============================================================================
// (e) BASIC HEADERS — nosniff, X-Frame-Options, Referrer-Policy, HSTS
// (prod-only). Extracted verbatim from index.ts's own middleware (the full
// app cannot be booted here — it calls runMigrations() against a real
// Postgres and then app.listen() at module scope, the same constraint
// TU-family harnesses already document for this route). Types stripped
// mechanically (the same transform tsc itself performs), nothing re-typed
// by hand.
// =============================================================================
{
  const indexSrc = fs.readFileSync(path.join(SRC, 'index.ts'), 'utf8');
  const middlewareMatch = indexSrc.match(/app\.use\(\(_req: Request, res: Response, next: NextFunction\) => \{\r?\n([\s\S]*?)\r?\n\}\);/);
  if (!middlewareMatch) throw new Error('(e) could not find the security-headers middleware in index.ts — update this harness');
  function makeHeaderMiddleware(body, isProd) {
    // `env` is referenced free inside the extracted body (index.ts's own
    // closure over its module-level `env` import) — bound here with a
    // one-line stand-in carrying only the field this middleware reads.
    const src = `const env = { isProd: ${isProd} };\nfunction mw(_req, res, next) {\n${body}\n}\nmodule.exports = { mw };\n`;
    const dest = path.join(tmp, `headers-${isProd}-${Math.random().toString(36).slice(2)}.js`);
    fs.writeFileSync(dest, stripTypes(src));
    delete require.cache[dest];
    return require(dest).mw;
  }
  function recordHeaders(mw) {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; } };
    let nextCalled = false;
    mw({}, res, () => { nextCalled = true; });
    return { headers: res.headers, nextCalled };
  }

  const dev = recordHeaders(makeHeaderMiddleware(middlewareMatch[1], false));
  ok('(e) nosniff is set on every response',
    dev.headers['X-Content-Type-Options'] === 'nosniff', JSON.stringify(dev.headers));
  ok('(e) X-Frame-Options: DENY is set on every response',
    dev.headers['X-Frame-Options'] === 'DENY', JSON.stringify(dev.headers));
  ok('(e) Referrer-Policy is set to a cross-origin-safe default',
    dev.headers['Referrer-Policy'] === 'strict-origin-when-cross-origin', JSON.stringify(dev.headers));
  ok('(e) HSTS is ABSENT in development (no HTTPS to assert) — not a bug, the stated scope',
    dev.headers['Strict-Transport-Security'] === undefined, JSON.stringify(dev.headers));
  ok('(e) the chain always calls next() — this middleware never ends the response itself',
    dev.nextCalled === true, '');
  ok('(e) no Content-Security-Policy header is set — explicitly out of THIS ticket\'s scope (its own measured ticket, per the ruling)',
    dev.headers['Content-Security-Policy'] === undefined, JSON.stringify(dev.headers));

  const prod = recordHeaders(makeHeaderMiddleware(middlewareMatch[1], true));
  ok('(e) HSTS IS present in production, with includeSubDomains and a real max-age',
    /^max-age=\d+; includeSubDomains$/.test(prod.headers['Strict-Transport-Security'] ?? ''), JSON.stringify(prod.headers));

  // FALSIFIED: drop the nosniff line from the extracted body (in memory).
  const mutatedBody = middlewareMatch[1].replace(/\s*res\.setHeader\('X-Content-Type-Options', 'nosniff'\);\r?\n/, '\n');
  if (mutatedBody === middlewareMatch[1]) throw new Error('(e) nosniff mutation did not change the body — anchor text moved; update this harness');
  const mutDev = recordHeaders(makeHeaderMiddleware(mutatedBody, false));
  ok('(e) MUTATION KILLED: with the nosniff line removed, the header is genuinely absent — confirms the check reads the real header, not a hardcoded pass',
    mutDev.headers['X-Content-Type-Options'] === undefined, JSON.stringify(mutDev.headers));
}

fs.rmSync(tmp, { recursive: true, force: true });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nITEM224 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: item 224 is new, falsifying no earlier check.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM224 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM224 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
