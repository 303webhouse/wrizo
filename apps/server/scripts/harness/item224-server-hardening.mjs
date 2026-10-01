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
function resetEnv(inviteCodesCsv, dailyBudget, { globalDailyBudget = 10000, disabled = false } = {}) {
  process.env.INVITE_CODES = inviteCodesCsv;
  process.env.TUTOR_DAILY_BUDGET = String(dailyBudget);
  process.env.TUTOR_GLOBAL_DAILY_BUDGET = String(globalDailyBudget);
  process.env.TUTOR_DISABLED = disabled ? '1' : '0';
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
function loadTutor({ tutorSourceOverride, realRateLimit = false } = {}) {
  clearCache();
  writeExt('env.ts', stripTypes(fs.readFileSync(path.join(SRC, 'env.ts'), 'utf8')));
  writeExt('asyncHandler.ts', stripTypes(fs.readFileSync(path.join(SRC, 'asyncHandler.ts'), 'utf8')));
  writeExt('logSafe.ts', stripTypes(fs.readFileSync(path.join(SRC, 'logSafe.ts'), 'utf8')));
  fs.writeFileSync(path.join(tmp, 'auth.js'), 'exports.requireAuth = (req, res, next) => next();\r\n');
  // ITEM 224, ROUND 2 — `realRateLimit` loads the ACTUAL rateLimit.ts (its
  // own keying/pruning is proved against tutor.ts's real `tutorRouter.use`
  // line further down, not only in isolation); the default keeps the
  // original pass-through stub for every check that isn't about rate
  // limiting at all.
  if (realRateLimit) {
    writeExt('rateLimit.ts', stripTypes(fs.readFileSync(path.join(SRC, 'rateLimit.ts'), 'utf8')));
  } else {
    fs.writeFileSync(path.join(tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
  }
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

// =============================================================================
// ROUND 2
// =============================================================================

// =============================================================================
// (1) "BY INVITATION" — GET /auth/signup-status, public, no auth.
// =============================================================================
{
  resetEnv('', 50);
  const closed = await callRoute(loadAuth(), '/signup-status', 'get', undefined);
  ok('(1) no codes configured -> { open: false }',
    closed.status === 200 && closed.body?.open === false, JSON.stringify(closed.body));

  resetEnv('X', 50);
  const open = await callRoute(loadAuth(), '/signup-status', 'get', undefined);
  ok('(1) codes configured -> { open: true }',
    open.status === 200 && open.body?.open === true, JSON.stringify(open.body));

  const realAuthSrc1 = fs.readFileSync(path.join(SRC, 'auth.ts'), 'utf8');
  const statusAnchor = "authRouter.get('/signup-status', (_req: Request, res: Response) => {\r\n  res.json({ open: env.inviteCodes.length > 0 });\r\n});";
  if (!realAuthSrc1.includes(statusAnchor)) throw new Error('(1) mutation anchor not found — update this harness');
  resetEnv('', 50);
  const mutatedStatusRouter = loadAuth({ authSourceOverride: realAuthSrc1.replace(statusAnchor, "authRouter.get('/signup-status', (_req: Request, res: Response) => {\r\n  res.json({ open: true });\r\n});") });
  const mutClosed = await callRoute(mutatedStatusRouter, '/signup-status', 'get', undefined);
  ok('(1) MUTATION KILLED: with the status route hardcoded to true, the no-codes case now reads open:true — confirms the real route reads env.inviteCodes',
    mutClosed.body?.open === true, JSON.stringify(mutClosed.body));
}

// =============================================================================
// (2a) THE TUTOR'S PER-MINUTE LIMIT, KEYED BY ACCOUNT. rateLimit.ts's own
// mechanism, proved in isolation first (its default IP-keying is untouched,
// a custom keyFn genuinely separates two accounts sharing one IP), then
// confirmed as what tutor.ts's own wiring line actually passes.
// =============================================================================
{
  function callLimiter(limiter, req) {
    return new Promise((resolve) => {
      const res = { statusCode: 200 };
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (b) => resolve({ status: res.statusCode, body: b, next: false });
      limiter(req, res, () => resolve({ status: 200, body: undefined, next: true }));
    });
  }
  clearCache();
  const { rateLimit: realRateLimit } = require(writeExt('rateLimit.ts', stripTypes(fs.readFileSync(path.join(SRC, 'rateLimit.ts'), 'utf8'))));

  const ipLimiter = realRateLimit(2, 60_000);
  const reqIpA = { ip: '1.1.1.1' };
  await callLimiter(ipLimiter, reqIpA); await callLimiter(ipLimiter, reqIpA);
  const ipThird = await callLimiter(ipLimiter, reqIpA);
  const ipOther = await callLimiter(ipLimiter, { ip: '2.2.2.2' });
  ok('(2a) default (no keyFn) behaviour is UNCHANGED: a 3rd request from the same IP within the window is blocked, a different IP is not',
    !ipThird.next && ipThird.status === 429 && ipOther.next, JSON.stringify({ ipThird, ipOther }));

  const acctLimiter = realRateLimit(2, 60_000, (req) => req.session.userId);
  const sameIp = '9.9.9.9';
  const reqAcct1 = { ip: sameIp, session: { userId: 'account-1' } };
  const reqAcct2 = { ip: sameIp, session: { userId: 'account-2' } }; // SAME ip, a DIFFERENT account
  await callLimiter(acctLimiter, reqAcct1); await callLimiter(acctLimiter, reqAcct1);
  const acct1Third = await callLimiter(acctLimiter, reqAcct1);
  const acct2First = await callLimiter(acctLimiter, reqAcct2);
  ok('(2a) ACCOUNT-KEYED: two different accounts sharing the SAME ip each get their OWN window — account-1 is exhausted, account-2 is not',
    !acct1Third.next && acct2First.next, JSON.stringify({ acct1Third, acct2First }));

  // FALSIFIED: a mutated rateLimit.ts that ignores the passed keyFn and
  // always keys by ip — account-2 (same ip) should now ALSO be blocked.
  const realRateLimitSrc = fs.readFileSync(path.join(SRC, 'rateLimit.ts'), 'utf8');
  const keyFnAnchor = 'const getKey = keyFn ?? ((req: Request) => req.ip || req.socket.remoteAddress || \'unknown\');';
  if (!realRateLimitSrc.includes(keyFnAnchor)) throw new Error('(2a) mutation anchor not found — update this harness');
  const mutatedKeyFnSrc = realRateLimitSrc.replace(keyFnAnchor, 'const getKey = (req: Request) => req.ip || req.socket.remoteAddress || \'unknown\';');
  clearCache();
  const { rateLimit: mutRateLimit } = require(writeExt('rateLimit.ts', stripTypes(mutatedKeyFnSrc)));
  const mutAcctLimiter = mutRateLimit(2, 60_000, (req) => req.session.userId);
  await callLimiter(mutAcctLimiter, reqAcct1); await callLimiter(mutAcctLimiter, reqAcct1);
  const mutAcct2First = await callLimiter(mutAcctLimiter, reqAcct2);
  ok('(2a) MUTATION KILLED: with the keyFn ignored (always keys by ip), account-2 now shares account-1\'s exhausted window on the same ip — confirms the real keyFn is what separates them',
    !mutAcct2First.next, JSON.stringify(mutAcct2First));

  ok('(2a) STRUCTURAL: tutor.ts\'s own wiring line actually passes an account keyFn (req.session.userId), not left at the IP default',
    fs.readFileSync(path.join(SRC, 'tutor.ts'), 'utf8').includes("tutorRouter.use(rateLimit(10, 60_000, (req) => req.session.userId!));"), '');

  ok('(2a) STRUCTURAL (memory): the pruning sweep (deleting every OTHER expired key, not just the one being checked) is present in the shipped file — not observable black-box, since a Map\'s get/set cost does not depend on its size at this scale',
    /for \(const \[k, v\] of hits\) \{\s*\r?\n\s*if \(now - v\.windowStart >= windowMs\) hits\.delete\(k\);\s*\r?\n\s*\}/.test(realRateLimitSrc), '');
}

// =============================================================================
// (2b) A GLOBAL DAILY CAP, across every account combined.
// =============================================================================
{
  resetEnv('X', 50, { globalDailyBudget: 2 });
  const router = loadTutor();
  const msg = (n) => Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? 'writer' : 'tutor', text: `m${i}` }));
  const g1 = await callRoute(router, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'global-user-1' });
  const g2 = await callRoute(router, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'global-user-2' });
  const g3 = await callRoute(router, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'global-user-3' });
  ok('(2b) the first TWO sends, from DIFFERENT accounts, clear the global gate',
    g1.status !== 429 && g2.status !== 429, JSON.stringify({ g1: g1.status, g2: g2.status }));
  ok('(2b) a THIRD distinct account — nowhere near their OWN 50/day budget — is refused by the GLOBAL cap, with its own distinct message',
    g3.status === 429 && /overall limit/.test(g3.body?.error ?? ''), JSON.stringify(g3));

  const realTutorSrc1 = fs.readFileSync(path.join(SRC, 'tutor.ts'), 'utf8');
  const globalAnchor = "  if (!consumeGlobalTutorBudget()) {\r\n    res.status(429).json({ error: 'The Tutor has reached today\\'s overall limit — try again tomorrow.' });\r\n    return;\r\n  }\r\n";
  if (!realTutorSrc1.includes(globalAnchor)) throw new Error('(2b) mutation anchor not found — update this harness');
  resetEnv('X', 50, { globalDailyBudget: 2 });
  const mutGlobalRouter = loadTutor({ tutorSourceOverride: realTutorSrc1.replace(globalAnchor, '') });
  await callRoute(mutGlobalRouter, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'mutant-global-1' });
  await callRoute(mutGlobalRouter, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'mutant-global-2' });
  const mutG3 = await callRoute(mutGlobalRouter, '/tutor/chat', 'post', { messages: msg(1) }, { userId: 'mutant-global-3' });
  ok('(2b) MUTATION KILLED: with the global check removed, a third distinct account is no longer refused — confirms the real check is what refuses it',
    mutG3.status !== 429, JSON.stringify(mutG3));
}

// =============================================================================
// (2c) THE KILL SWITCH — TUTOR_DISABLED=1 answers with the EXISTING
// "not configured" shape.
// =============================================================================
{
  resetEnv('X', 50, { disabled: true });
  const router = loadTutor();
  const r = await callRoute(router, '/tutor/chat', 'post', { messages: [{ role: 'writer', text: 'hi' }] }, { userId: 'kill-switch-user' });
  ok('(2c) TUTOR_DISABLED=1 answers { configured: false } — the SAME shape an unset API key already produces, no new error shape for the client to learn',
    r.status === 200 && r.body?.configured === false, JSON.stringify(r.body));

  const realTutorSrc2 = fs.readFileSync(path.join(SRC, 'tutor.ts'), 'utf8');
  const killAnchor = "  if (env.tutorDisabled) {\r\n    res.json({ configured: false });\r\n    return;\r\n  }\r\n";
  if (!realTutorSrc2.includes(killAnchor)) throw new Error('(2c) mutation anchor not found — update this harness');
  resetEnv('X', 50, { disabled: true });
  const mutKillRouter = loadTutor({ tutorSourceOverride: realTutorSrc2.replace(killAnchor, '') });
  const mutKill = await callRoute(mutKillRouter, '/tutor/chat', 'post', { messages: [{ role: 'writer', text: 'hi' }] }, { userId: 'mutant-kill-user' });
  ok('(2c) MUTATION KILLED: with the kill switch removed, TUTOR_DISABLED=1 no longer short-circuits — the request proceeds past it (a different response than the plain not-configured shape)',
    !(mutKill.status === 200 && mutKill.body?.configured === false && Object.keys(mutKill.body).length === 1), JSON.stringify(mutKill.body));
}

// =============================================================================
// (3a) ALWAYS ONE BCRYPT COMPARE — a known email and an unknown one run the
// exact same number of compares (1), closing the timing tell a skipped
// compare created. Proved by COUNTING calls (deterministic), never by
// measuring elapsed time (which would be flaky).
// =============================================================================
{
  resetEnv('X', 50);
  const router = loadAuth();
  await fakeDb.seedUser('known-timing@example.com', 'correct-password1');

  let compareCalls = 0;
  const realCompare = bcrypt.compare.bind(bcrypt);
  bcrypt.compare = async (...args) => { compareCalls++; return realCompare(...args); };
  let knownCalls, unknownCalls;
  try {
    compareCalls = 0;
    await callRoute(router, '/login', 'post', { email: 'known-timing@example.com', password: 'WRONG' });
    knownCalls = compareCalls;
    compareCalls = 0;
    await callRoute(router, '/login', 'post', { email: 'nobody-knows-this-one@example.com', password: 'whatever1' });
    unknownCalls = compareCalls;
  } finally {
    bcrypt.compare = realCompare;
  }
  ok('(3a) a login for a KNOWN email runs exactly one bcrypt.compare', knownCalls === 1, String(knownCalls));
  ok('(3a) a login for an UNKNOWN email ALSO runs exactly one bcrypt.compare, against the fixed dummy hash — previously this was skipped entirely (0 calls), the exact timing tell this closes',
    unknownCalls === 1, String(unknownCalls));

  const realAuthSrc2 = fs.readFileSync(path.join(SRC, 'auth.ts'), 'utf8');
  const alwaysCompareAnchor = '  const ok = await bcrypt.compare(password, user ? user.pass_hash : DUMMY_PASSWORD_HASH);\r\n';
  if (!realAuthSrc2.includes(alwaysCompareAnchor)) throw new Error('(3a) mutation anchor not found — update this harness');
  resetEnv('X', 50);
  const mutRouter = loadAuth({ authSourceOverride: realAuthSrc2.replace(alwaysCompareAnchor, '  const ok = user ? await bcrypt.compare(password, user.pass_hash) : false;\r\n') });
  let mutCalls = 0;
  const realCompare2 = bcrypt.compare.bind(bcrypt);
  bcrypt.compare = async (...args) => { mutCalls++; return realCompare2(...args); };
  try {
    await callRoute(mutRouter, '/login', 'post', { email: 'still-nobody@example.com', password: 'x' });
  } finally {
    bcrypt.compare = realCompare2;
  }
  ok('(3a) MUTATION KILLED: with the short-circuit restored, an unknown email calls bcrypt.compare ZERO times — confirms the real "always compare" line is what closes the gap',
    mutCalls === 0, String(mutCalls));
}

// =============================================================================
// (3b) A NEUTRAL REPLY when an email is already registered.
// =============================================================================
{
  resetEnv('X', 50);
  const router = loadAuth();
  const first = await callRoute(router, '/register', 'post', { email: 'dupe@example.com', password: 'longenough1', name: null, code: 'X' });
  const second = await callRoute(router, '/register', 'post', { email: 'dupe@example.com', password: 'anotherlongone1', name: null, code: 'X' });
  ok('(3b) the duplicate attempt is refused with a NEUTRAL message — it does not say "already exists," and shares the same 400 status family as every other register refusal',
    first.status === 201 && second.status === 400 && !/already exists/i.test(second.body?.error ?? ''),
    JSON.stringify({ first: first.status, second: second.status, body: second.body }));

  const realAuthSrc3 = fs.readFileSync(path.join(SRC, 'auth.ts'), 'utf8');
  const neutralAnchor = "      res.status(400).json({ error: 'Could not create an account with that information.' });\r\n";
  if (!realAuthSrc3.includes(neutralAnchor)) throw new Error('(3b) mutation anchor not found — update this harness');
  resetEnv('X', 50);
  const mutRouter2 = loadAuth({ authSourceOverride: realAuthSrc3.replace(neutralAnchor, "      res.status(409).json({ error: 'An account with that email already exists' });\r\n") });
  await callRoute(mutRouter2, '/register', 'post', { email: 'dupe2@example.com', password: 'longenough1', name: null, code: 'X' });
  const mutSecond = await callRoute(mutRouter2, '/register', 'post', { email: 'dupe2@example.com', password: 'anotherlongone1', name: null, code: 'X' });
  ok('(3b) MUTATION KILLED: with the old wording restored, a duplicate email is confirmed again (409, "already exists") — proves the neutral reply is what suppresses it',
    mutSecond.status === 409 && /already exists/i.test(mutSecond.body?.error ?? ''), JSON.stringify(mutSecond));
}

// =============================================================================
// (3c) A PER-ACCOUNT FAILED-LOGIN THROTTLE (interim), locking out even a
// CORRECT password once tripped — proving it counts prior FAILURES, not
// just continuing to reject.
// =============================================================================
{
  resetEnv('X', 50);
  const router = loadAuth();
  await fakeDb.seedUser('locked@example.com', 'the-real-password1');
  for (let i = 0; i < 8; i++) {
    await callRoute(router, '/login', 'post', { email: 'locked@example.com', password: 'wrong' });
  }
  const lockedOut = await callRoute(router, '/login', 'post', { email: 'locked@example.com', password: 'the-real-password1' });
  ok('(3c) after 8 failures, the 9th attempt is LOCKED OUT (429) even with the CORRECT password — the throttle counts prior failures, not whether this particular attempt would have succeeded',
    lockedOut.status === 429, JSON.stringify(lockedOut));

  await fakeDb.seedUser('never-failed@example.com', 'another-real-password1');
  const otherAccount = await callRoute(router, '/login', 'post', { email: 'never-failed@example.com', password: 'another-real-password1' });
  ok('(3c) a DIFFERENT account, with no prior failures, signs in normally — the throttle is per-account, not a global lockout',
    otherAccount.status === 200, JSON.stringify(otherAccount));

  const realAuthSrc4 = fs.readFileSync(path.join(SRC, 'auth.ts'), 'utf8');
  const lockAnchor = '  if (isLoginLocked(email)) {\r\n    res.status(429).json({ error: \'Too many attempts. Try again later.\' });\r\n    return;\r\n  }\r\n\r\n';
  if (!realAuthSrc4.includes(lockAnchor)) throw new Error('(3c) mutation anchor not found — update this harness');
  resetEnv('X', 50);
  const mutRouter3 = loadAuth({ authSourceOverride: realAuthSrc4.replace(lockAnchor, '') });
  await fakeDb.seedUser('mutant-locked@example.com', 'the-real-password1');
  for (let i = 0; i < 8; i++) {
    await callRoute(mutRouter3, '/login', 'post', { email: 'mutant-locked@example.com', password: 'wrong' });
  }
  const mutLockedOut = await callRoute(mutRouter3, '/login', 'post', { email: 'mutant-locked@example.com', password: 'the-real-password1' });
  ok('(3c) MUTATION KILLED: with the lockout check removed, the 9th attempt (correct password) now SUCCEEDS (200) — confirms the real check is what blocks it',
    mutLockedOut.status === 200, JSON.stringify(mutLockedOut));
}

// =============================================================================
// (4a) REJECT a state-changing request whose Origin isn't the app's own.
// Extracted verbatim from index.ts (the full app cannot boot here — see
// section (e)'s own header for why).
// =============================================================================
{
  const indexSrc2 = fs.readFileSync(path.join(SRC, 'index.ts'), 'utf8');
  const originMatch = indexSrc2.match(/app\.use\(\(req: Request, res: Response, next: NextFunction\) => \{\r?\n\s*if \(req\.method === 'GET'[\s\S]*?\r?\n\}\);/);
  if (!originMatch) throw new Error('(4a) could not find the origin-check middleware in index.ts — update this harness');
  function makeOriginMiddleware(body) {
    const src = `function mw(req, res, next) {\n${body}\n}\nmodule.exports = { mw };\n`;
    const dest = path.join(tmp, `origin-${Math.random().toString(36).slice(2)}.js`);
    fs.writeFileSync(dest, stripTypes(src));
    delete require.cache[dest];
    return require(dest).mw;
  }
  function runOrigin(mw, req) {
    return new Promise((resolve) => {
      const res = { statusCode: 200 };
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (b) => resolve({ status: res.statusCode, body: b, next: false });
      mw(req, res, () => resolve({ status: 200, body: undefined, next: true }));
    });
  }
  // The function body references req.protocol/req.get('host') directly —
  // fine as-is, this is just an object shape, not a TS type.
  const body = originMatch[0].replace(/^app\.use\(\(req: Request, res: Response, next: NextFunction\) => \{\r?\n/, '').replace(/\r?\n\}\);$/, '');
  const originMw = makeOriginMiddleware(body);

  const okOrigin = await runOrigin(originMw, { method: 'POST', headers: { origin: 'https://app.example.com' }, protocol: 'https', get: () => 'app.example.com' });
  ok('(4a) a POST whose Origin matches this app\'s own host clears the check',
    okOrigin.next === true, JSON.stringify(okOrigin));

  const forged = await runOrigin(originMw, { method: 'POST', headers: { origin: 'https://evil.example' }, protocol: 'https', get: () => 'app.example.com' });
  ok('(4a) a POST whose Origin does NOT match is REFUSED (403) — the shape a forged cross-site request actually carries',
    forged.status === 403 && forged.next === false, JSON.stringify(forged));

  const noOrigin = await runOrigin(originMw, { method: 'POST', headers: {}, protocol: 'https', get: () => 'app.example.com' });
  ok('(4a) a POST with NO Origin header fails OPEN — some legitimate clients never send one, and this app sets no CORS header for a cross-origin browser request to read anyway',
    noOrigin.next === true, JSON.stringify(noOrigin));

  const getExempt = await runOrigin(originMw, { method: 'GET', headers: { origin: 'https://evil.example' }, protocol: 'https', get: () => 'app.example.com' });
  ok('(4a) GET is exempt regardless of Origin — nothing state-changing ever rides one in this app',
    getExempt.next === true, JSON.stringify(getExempt));

  const mutatedOriginBody = body.replace(/if \(origin !== expected\) \{[\s\S]*?\n  \}\r?\n/, '');
  if (mutatedOriginBody === body) throw new Error('(4a) origin mutation did not change the body — anchor moved; update this harness');
  const mutOriginMw = makeOriginMiddleware(mutatedOriginBody);
  const mutForged = await runOrigin(mutOriginMw, { method: 'POST', headers: { origin: 'https://evil.example' }, protocol: 'https', get: () => 'app.example.com' });
  ok('(4a) MUTATION KILLED: with the mismatch check removed, the SAME forged Origin now clears — confirms the real check is what refuses it',
    mutForged.next === true, JSON.stringify(mutForged));
}

// =============================================================================
// (4b) app.disable('x-powered-by') — STRUCTURAL ONLY. Booting the real app to
// observe the header at runtime needs a live Postgres (migrations run at
// module scope before app.listen) — not available in this environment, the
// same constraint section (e) already documents. The call itself is a single
// line with no conditional logic to falsify independently of "is it there."
// =============================================================================
{
  const indexSrc3 = fs.readFileSync(path.join(SRC, 'index.ts'), 'utf8');
  const disableIdx = indexSrc3.indexOf("app.disable('x-powered-by');");
  const appCreateIdx = indexSrc3.indexOf('const app = express();');
  const firstRouteIdx = indexSrc3.indexOf("app.use('/auth'");
  ok('(4b) app.disable(\'x-powered-by\') is present, AFTER the app is created and BEFORE the first route is registered',
    disableIdx > appCreateIdx && disableIdx >= 0 && disableIdx < firstRouteIdx, JSON.stringify({ appCreateIdx, disableIdx, firstRouteIdx }));
}

// =============================================================================
// (5) LOGS — codes and record ids, never raw error objects or user values;
// dotenv quiet. Structural: the actual log LINES that print are a hygiene
// property with no distinct runtime behaviour this harness's stub req/res
// would observe differently (every code path here already resolves before
// any of these catch blocks could fire in the fake-db-driven tests above).
// =============================================================================
{
  const sources = {
    tutor: fs.readFileSync(path.join(SRC, 'tutor.ts'), 'utf8'),
    index: fs.readFileSync(path.join(SRC, 'index.ts'), 'utf8'),
    sync: fs.readFileSync(path.join(SRC, 'sync.ts'), 'utf8'),
  };
  const rawErrorLog = /console\.(error|log|warn)\([^)]*,\s*err\)/;
  for (const [name, src] of Object.entries(sources)) {
    ok(`(5) ${name}.ts has no remaining console.*(…, err) call printing a raw error object`,
      !rawErrorLog.test(src), '');
  }
  const logErrorCount = (sources.tutor.match(/logError\(/g) || []).length
    + (sources.index.match(/logError\(/g) || []).length
    + (sources.sync.match(/logError\(/g) || []).length;
  ok('(5) logError(...) is used at every one of the 9 sites this round touched (1 tutor.ts + 2 index.ts + 6 sync.ts)',
    logErrorCount === 9, String(logErrorCount));
  ok('(5) dotenv is configured quiet (env.ts)',
    /dotenv\.config\(\{[^}]*quiet:\s*true/.test(fs.readFileSync(path.join(SRC, 'env.ts'), 'utf8')), '');
}

// =============================================================================
// (6) docs/deploy.md — the sign-up gate line now names INVITE_CODES.
// =============================================================================
{
  const deploySrc = fs.readFileSync(path.join(SERVER, '..', '..', 'docs', 'deploy.md'), 'utf8');
  const bareOld = (deploySrc.match(/\bINVITE_CODE\b/g) || []).length;
  const renamed = (deploySrc.match(/\bINVITE_CODES\b/g) || []).length;
  ok('(6) docs/deploy.md names INVITE_CODES (3 sites) and the old singular INVITE_CODE no longer appears anywhere',
    bareOld === 0 && renamed === 3, JSON.stringify({ bareOld, renamed }));
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
