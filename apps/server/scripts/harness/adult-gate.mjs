// THE SERVER'S 18+ GATE (Fable, Nov 18). POST /auth/register refuses a sign-up unless the request body carries
// adult === true (the boolean, nothing that merely looks like it): 400 with the plain code 'adult_required', which the
// client maps to its existing authAdultRequired line, and NO user row. The flag is checked and dropped: nothing about it
// is stored (no column, no field, no extra insert parameter).
//
// Before this, only the browser's tick stood between a visitor and an account; any other caller of the route skipped it.
//
//   G1  a body with no adult field: 400 'adult_required', the database never touched, no user row
//   G2  every value that is not the boolean true (false, 'true', 1, 'yes', null, {}): the same refusal, no row
//   G3  the gate answers first: a short password, a wrong code or a closed sign-up still reads 'adult_required'
//   G4  adult: true with a right code: 201 and exactly one row; the insert carries 3 parameters, no adult value, and
//       the reply carries only id / email / name
//   G5  nothing stored, by source: migrate.ts names no adult column and auth.ts's insert statement is unchanged
//   MUT the gate removed (in memory; the file on disk is untouched): G1's request creates an account. Asserted to land.
//
// Pattern: item224-server-hardening.mjs. The REAL auth.ts, types stripped, over a fake ./db built from auth.ts's own
// SQL; no Postgres needed, since "no row" is read off the fake's own table, and every query it is sent is counted.
// Run from apps/server: node scripts/harness/adult-gate.mjs. Prints ADULT-GATE VERIFY: PASS|FAIL.
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

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// The scratch has to sit inside apps/server so the stripped modules resolve express / bcryptjs from its node_modules.
const tmp = path.join(SERVER, '.adult-gate-scratch');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

function makeFakeDb() {
  const users = new Map();
  let nextId = 1;
  return {
    calls: [],
    inserts: [],
    users,
    async query(sql, params = []) {
      const s = sql.trim();
      this.calls.push(s.split('\n')[0]);
      if (/^insert into users/i.test(s)) {
        this.inserts.push({ sql: s, params });
        const [email, pass_hash, name] = params;
        if (users.has(email)) { const e = new Error('duplicate key'); e.code = '23505'; throw e; }
        const row = { id: `user-${nextId++}`, email, pass_hash, name };
        users.set(email, row);
        return { rows: [row] };
      }
      throw new Error('FakeDb: unhandled query shape: ' + s);
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
const stripTypes = (src) => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
function writeExt(rel, jsText) {
  const dest = path.join(tmp, rel.replace(/\.ts$/, '.js'));
  fs.writeFileSync(dest, jsText);
  return dest;
}
function resetEnv(inviteCodesCsv) {
  process.env.INVITE_CODES = inviteCodesCsv;
  process.env.TUTOR_DAILY_BUDGET = '50';
  process.env.TUTOR_GLOBAL_DAILY_BUDGET = '10000';
  process.env.TUTOR_DISABLED = '0';
  process.env.SESSION_SECRET = 'harness-secret';
  process.env.DATABASE_URL = 'postgres://unused/unused';
  process.env.TUTOR_API_KEY = 'harness-key-not-real';
  process.env.TUTOR_BASE_URL = 'http://127.0.0.1:1/unreachable';
}
let fakeDb;
function loadAuth(authSrc, inviteCodesCsv = 'ABC123') {
  resetEnv(inviteCodesCsv);
  for (const p of Object.keys(require.cache)) if (p.startsWith(tmp)) delete require.cache[p];
  fakeDb = makeFakeDb();
  for (const f of ['env.ts', 'asyncHandler.ts', 'passwordHash.ts']) writeExt(f, stripTypes(fs.readFileSync(path.join(SRC, f), 'utf8')));
  fs.writeFileSync(path.join(tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
  const dbDest = path.join(tmp, 'db.js');
  fs.writeFileSync(dbDest, '');
  const authDest = writeExt('auth.ts', stripTypes(authSrc));
  require.cache[dbDest] = { id: dbDest, filename: dbDest, loaded: true, exports: { pool: fakeDb } };
  return require(authDest).authRouter;
}
// Resolves on the handler's real completion (res.json, or next(err)), as item224's callRoute does.
function callRoute(router, routePath, body) {
  const req = { body, session: makeSession() };
  return new Promise((resolve, reject) => {
    const res = { statusCode: 200 };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { resolve({ status: res.statusCode, body: b }); return res; };
    let handler;
    try { handler = findHandler(router, routePath, 'post'); } catch (e) { reject(e); return; }
    handler(req, res, (err) => { if (err) resolve({ status: 599, body: { thrown: String(err) } }); });
  });
}

const REFUSED = (r) => r.status === 400 && r.body?.error === 'adult_required';
const GOOD = { password: 'longenough1', name: 'G', code: 'ABC123' };
const realAuth = fs.readFileSync(path.join(SRC, 'auth.ts'), 'utf8');

try {
  // ---- G1: no adult field at all ----
  {
    const router = loadAuth(realAuth);
    const r = await callRoute(router, '/register', { email: 'g1@example.com', ...GOOD });
    ok('G1 no adult field: 400 adult_required, the database never touched, no user row',
      REFUSED(r) && fakeDb.calls.length === 0 && fakeDb.users.size === 0,
      JSON.stringify({ status: r.status, body: r.body, dbCalls: fakeDb.calls.length, rows: fakeDb.users.size }));
  }

  // ---- G2: everything that is not the boolean true ----
  {
    const router = loadAuth(realAuth);
    const values = [false, 'true', 1, 'yes', null, {}];
    const seen = [];
    for (const [i, adult] of values.entries()) {
      const r = await callRoute(router, '/register', { email: `g2-${i}@example.com`, ...GOOD, adult });
      seen.push({ adult, status: r.status, error: r.body?.error, refused: REFUSED(r) });
    }
    ok(`G2 each of ${values.length} not-true values (false, 'true', 1, 'yes', null, {}) is refused the same way and makes no row`,
      seen.length === values.length && seen.every((s) => s.refused) && fakeDb.calls.length === 0 && fakeDb.users.size === 0,
      JSON.stringify({ seen, dbCalls: fakeDb.calls.length, rows: fakeDb.users.size }));
  }

  // ---- G3: the gate answers before every other refusal ----
  {
    const router = loadAuth(realAuth);
    const shortPw = await callRoute(router, '/register', { email: 'g3a@example.com', password: '1234567', code: 'ABC123' });
    const wrongCode = await callRoute(router, '/register', { email: 'g3b@example.com', password: 'longenough1', code: 'wrong' });
    const noEmail = await callRoute(router, '/register', { password: 'longenough1', code: 'ABC123' });
    const closedRouter = loadAuth(realAuth, '');
    const closed = await callRoute(closedRouter, '/register', { email: 'g3c@example.com', ...GOOD });
    const all = { shortPw, wrongCode, noEmail, closed };
    ok('G3 the gate answers first: a short password, a wrong code, a missing email and a closed sign-up all read adult_required without adult',
      Object.values(all).every(REFUSED), JSON.stringify(Object.fromEntries(Object.entries(all).map(([k, r]) => [k, [r.status, r.body?.error]]))));
  }

  // ---- G4: adult true makes exactly one row and stores nothing about the flag ----
  {
    const router = loadAuth(realAuth);
    const r = await callRoute(router, '/register', { email: 'g4@example.com', ...GOOD, adult: true });
    const ins = fakeDb.inserts[0];
    const replyKeys = Object.keys(r.body || {}).sort().join(',');
    ok('G4 adult: true with a right code: 201, one row; the insert carries 3 parameters and no adult value; the reply only id/email/name',
      r.status === 201 && fakeDb.users.size === 1 && fakeDb.inserts.length === 1
        && ins.params.length === 3 && !ins.params.includes(true) && !/adult/i.test(ins.sql) && replyKeys === 'email,id,name',
      JSON.stringify({ status: r.status, rows: fakeDb.users.size, inserts: fakeDb.inserts.length, params: ins?.params.length, replyKeys }));
  }

  // ---- G5: nothing stored, by source ----
  {
    const migrate = fs.readFileSync(path.join(SRC, 'migrate.ts'), 'utf8');
    const insertLine = 'insert into users (email, pass_hash, name) values ($1, $2, $3) returning id, email, pass_hash, name';
    const insertCount = realAuth.split('insert into users').length - 1;
    ok('G5 nothing stored: migrate.ts names no adult column; auth.ts has its one insert, unchanged',
      !/adult/i.test(migrate) && insertCount === 1 && realAuth.includes(insertLine),
      JSON.stringify({ migrateAdult: /adult/i.test(migrate), insertCount, insertUnchanged: realAuth.includes(insertLine) }));
  }

  // ---- MUT: the gate removed; G1's request must then create an account ----
  {
    const eol = realAuth.includes('\r\n') ? '\r\n' : '\n';
    const anchor = ["  if (req.body?.adult !== true) {", "    res.status(400).json({ error: 'adult_required' });", '    return;', '  }', ''].join(eol);
    const found = realAuth.split(anchor).length - 1;
    let detail = { found };
    let killed = false;
    if (found === 1) {
      const mutant = realAuth.replace(anchor, '');
      const landed = mutant !== realAuth && !mutant.includes("'adult_required'");
      const router = loadAuth(mutant);
      const r = await callRoute(router, '/register', { email: 'g1@example.com', ...GOOD });
      const g1Red = !(REFUSED(r) && fakeDb.calls.length === 0 && fakeDb.users.size === 0);
      killed = landed && g1Red && r.status === 201 && fakeDb.users.size === 1;
      detail = { found, landed, status: r.status, rows: fakeDb.users.size, g1Red };
    }
    ok('MUT the gate removed (in memory, landed once): G1 goes RED, and the same request makes an account (201, one row)',
      killed, JSON.stringify(detail));
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + c.detail}`);
const pass = checks.length === 6 && checks.every((c) => c.pass);
console.log(pass
  ? `\nADULT-GATE VERIFY: PASS (${checks.length} checks)`
  : `\nADULT-GATE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
