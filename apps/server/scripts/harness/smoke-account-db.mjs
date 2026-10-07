// SMOKE ACCOUNT (apps/server/scripts/create-smoke-account.mjs + smoke-login.mjs) - proven, not read.
//
// PART A runs the create/rotate script as a CHILD PROCESS (the way the owner runs it) against a REAL throwaway Postgres
// holding the real shapes (users; connect-pg-simple's `session`). PART B runs smoke-login.mjs against a local fake server that
// plays the production routes and records what it was sent.
//
// What is proven: the account is created with a random smoke-<hex>@wrizo.invalid email and a 24-character password; the stored
// hash verifies and is cost 12 (the same function sign-up uses - the SCRIPT imports it from the built dist/passwordHash.js);
// the secret file exists, holds the secret and (on Windows) carries ONE access entry - the current user's; NOTHING the script
// prints contains the email, the password, a hash or the database URL; a second run changes nothing; a failed insert leaves NO
// orphan credentials file; --rotate swaps the password, ends only that account's sessions and updates the file; a rotate for an
// account that is not in the database leaves the old file intact and no .new behind. smoke-login makes exactly ONE login
// attempt even when it fails (no retries), sends the site's Origin on every POST, sends a PULL-ONLY sync body, carries the
// cookie, and prints status codes without ever printing the email, password or cookie.
//
// NOT part of the desktop suite and adds no dependency: it borrows `embedded-postgres` from any install you point it at.
// Needs the server built (pnpm --filter @writer-studio/server build) so dist/passwordHash.js exists.
// Run (repo root):
//   EMBEDDED_PG_FROM=C:/path/to/package.json-with-embedded-postgres  node apps/server/scripts/harness/smoke-account-db.mjs
import { createRequire } from 'node:module';
import { rmSync, readFileSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { execFileSync, spawnSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { tmpdir, userInfo } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const SERVER = join(here, '..', '..');
if (!existsSync(join(SERVER, 'dist', 'passwordHash.js'))) { console.error('Build the server first: pnpm --filter @writer-studio/server build'); process.exit(2); }
const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const reqSrv = createRequire(pathToFileURL(join(SERVER, 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg'); const bcrypt = reqSrv('bcryptjs');
const CREATE = join(here, '..', 'create-smoke-account.mjs');
const SMOKE = join(here, '..', 'smoke-login.mjs');

const checks = [];
const ok = (n, p, d = '') => { checks.push([n, p, d]); console.log((p ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };

const work = mkdtempSync(join(tmpdir(), 'smoke-acct-'));
const pgDir = join(work, 'pg');
const PORT = 54332;
const DB_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/t`;
const run = (script, args, env) => spawnSync(process.execPath, [script, ...args], { env: { ...process.env, DATABASE_PUBLIC_URL: '', DATABASE_URL: '', ...env }, encoding: 'utf8', timeout: 120000 });
// Part B's fake server lives in THIS process, so the child must be spawned ASYNC (spawnSync would block the server that has to answer it).
const runAsync = (script, args, env) => new Promise((resolve) => {
  const c = spawn(process.execPath, [script, ...args], { env: { ...process.env, ...env } });
  let stdout = ''; let stderr = '';
  c.stdout.on('data', (d) => (stdout += d)); c.stderr.on('data', (d) => (stderr += d));
  c.on('close', (status, signal) => resolve({ status, signal, stdout, stderr }));
});
const leaks = (out, secrets) => secrets.filter((s) => s && out.includes(s));

const pg = new EmbeddedPostgres({ databaseDir: pgDir, user: 'postgres', password: 'postgres', port: PORT, persistent: false });
await pg.initialise(); await pg.start(); await pg.createDatabase('t');
const pool = new Pool({ connectionString: DB_URL });
try {
  await pool.query(`create extension if not exists pgcrypto`);
  await pool.query(`create table users(id uuid primary key default gen_random_uuid(), email text unique not null, pass_hash text not null, name text)`);
  await pool.query(`create table session(sid varchar not null primary key, sess json not null, expire timestamp(6) not null)`);

  // ---------------- PART A: create-smoke-account.mjs ----------------
  const file = join(work, 'smoke-account.json');
  const env = { DATABASE_URL: DB_URL, SMOKE_ACCOUNT_FILE: file };
  const r1 = run(CREATE, [], env);
  const out1 = (r1.stdout || '') + (r1.stderr || '');
  ok('create: exits 0 and says "created"', r1.status === 0 && /^created \(/.test(r1.stdout || ''), `status=${r1.status}`);
  const creds = JSON.parse(readFileSync(file, 'utf8'));
  ok('the file holds a smoke-<8 hex>@wrizo.invalid email and a 24-character password', /^smoke-[0-9a-f]{8}@wrizo\.invalid$/.test(creds.email) && creds.password.length === 24, `pwlen=${creds.password.length}`);
  const row = (await pool.query(`select email, pass_hash, name from users`)).rows;
  ok('exactly one users row, the smoke email, name "Smoke test (do not use)"', row.length === 1 && row[0].email === creds.email && row[0].name === 'Smoke test (do not use)');
  ok('the stored hash verifies the file\'s password and is bcrypt cost 12', await bcrypt.compare(creds.password, row[0].pass_hash) && bcrypt.getRounds(row[0].pass_hash) === 12, `rounds=${bcrypt.getRounds(row[0].pass_hash)}`);
  const dist = reqSrv(join(SERVER, 'dist', 'passwordHash.js'));
  ok('that cost is the app\'s own: a hash from dist/passwordHash.js has the same rounds', bcrypt.getRounds(await dist.hashPassword('x'.repeat(8))) === 12 && dist.BCRYPT_COST === 12);
  ok('nothing printed contains the email, the password, the hash or the database URL', leaks(out1, [creds.email, creds.password, row[0].pass_hash, DB_URL, 'postgres:postgres']).length === 0, JSON.stringify(leaks(out1, [creds.email, creds.password, row[0].pass_hash, DB_URL])));
  if (process.platform === 'win32') {
    const acl = execFileSync('icacls', [file], { encoding: 'utf8' });
    const aceLines = acl.split(/\r?\n/).filter((l) => /:\(/.test(l));
    const me = userInfo().username.toLowerCase();
    ok('Windows: the file carries ONE access entry, the current user\'s - no inherited Users/Everyone/SYSTEM', aceLines.length === 1 && aceLines[0].toLowerCase().includes(me) && !/everyone|builtin\\users|authenticated users|system/i.test(acl.replace(me, '')), aceLines.map((l) => l.replace(/^.*?(\S+:\(.*)$/, '$1')).join(' | ').replace(me, '<me>'));
  } else {
    ok('POSIX: the file is mode 600', (statSync(file).mode & 0o777) === 0o600);
  }
  const before = readFileSync(file, 'utf8');
  const r2 = run(CREATE, [], env);
  ok('a second run says "exists" and changes neither the file nor the table', r2.status === 0 && /^exists/.test(r2.stdout || '') && readFileSync(file, 'utf8') === before && (await pool.query(`select count(*)::int n from users`)).rows[0].n === 1);

  // a failed insert leaves no orphan credentials
  const file2 = join(work, 'orphan.json');
  const r3 = run(CREATE, [], { DATABASE_URL: `postgres://postgres:postgres@127.0.0.1:1/t`, SMOKE_ACCOUNT_FILE: file2 });
  const out3 = (r3.stdout || '') + (r3.stderr || '');
  ok('a failed connection exits non-zero, prints a short code, and leaves NO credentials file', r3.status !== 0 && !existsSync(file2) && /Nothing was changed/.test(out3) && leaks(out3, ['postgres:postgres', '127.0.0.1']).length === 0, out3.trim().slice(0, 80));

  // rotate: sessions end, only that account's
  const other = (await pool.query(`insert into users(email,pass_hash,name) values('someone@example.com',$1,'S') returning id`, [await bcrypt.hash('otherotherX1', 4)])).rows[0].id;
  const me = (await pool.query(`select id from users where email=$1`, [creds.email])).rows[0].id;
  const sess = (uid) => JSON.stringify({ cookie: {}, userId: uid });
  await pool.query(`insert into session values('a',$1,now()+interval '1 day'),('b',$1,now()+interval '1 day'),('c',$2,now()+interval '1 day')`, [sess(me), sess(other)]);
  const oldHash = row[0].pass_hash;
  const r4 = run(CREATE, ['--rotate'], env);
  const out4 = (r4.stdout || '') + (r4.stderr || '');
  const creds2 = JSON.parse(readFileSync(file, 'utf8'));
  const row2 = (await pool.query(`select pass_hash from users where email=$1`, [creds.email])).rows[0];
  ok('rotate: says "rotated"; same email, NEW password in the file; the new one verifies and the old does not', r4.status === 0 && /^rotated/.test(r4.stdout || '') && creds2.email === creds.email && creds2.password !== creds.password && await bcrypt.compare(creds2.password, row2.pass_hash) && !(await bcrypt.compare(creds.password, row2.pass_hash)) && row2.pass_hash !== oldHash);
  ok('rotate ended only that account\'s sessions (the other user\'s stays) and left no .new file', JSON.stringify((await pool.query(`select sid from session order by sid`)).rows.map((x) => x.sid)) === '["c"]' && !existsSync(file + '.new'));
  ok('rotate printed no secret', leaks(out4, [creds.email, creds.password, creds2.password, row2.pass_hash, DB_URL]).length === 0);
  // rotate for an account the database does not have: the old file stands
  await pool.query(`delete from users where email=$1`, [creds.email]);
  const keep = readFileSync(file, 'utf8');
  const r5 = run(CREATE, ['--rotate'], env);
  ok('rotate for an account not in the database: non-zero, old file intact, no .new left', r5.status !== 0 && readFileSync(file, 'utf8') === keep && !existsSync(file + '.new'), `status=${r5.status}`);

  // ---------------- PART B: smoke-login.mjs ----------------
  const SECRET = { email: 'smoke-deadbeef@wrizo.invalid', password: 'pw-for-the-fake-server-123456' };
  const COOKIE_VALUE = 'sessionTOKEN123456789';
  // The fake models the REAL server's session: login creates one, /auth/me is 200 only for a cookie naming a LIVE session,
  // and logout BOTH destroys the session (req.session.destroy) AND clears the cookie on the client (res.clearCookie) - the
  // clearing Set-Cookie is why a jar-only check proves nothing. mode 'nodestroy' keeps the clearing but SKIPS the destroy.
  const makeServer = (mode) => new Promise((resolve) => {
    const seen = { logins: 0, origins: [], syncBodies: [], meNoCookie: 0, meCalls: 0, replayMe: 0 };
    const live = new Set();
    const srv = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const sid = ((req.headers.cookie || '').match(/connect\.sid=([^;]*)/) || [])[1] || '';
        if (req.method === 'POST') seen.origins.push(req.headers.origin || '');
        if (req.url === '/auth/login') {
          seen.logins += 1;
          const b = JSON.parse(body || '{}');
          if (mode === 'badlogin' || b.email !== SECRET.email || b.password !== SECRET.password) { res.writeHead(401, { 'content-type': 'application/json' }); res.end('{"error":"Invalid email or password"}'); return; }
          live.add(COOKIE_VALUE);
          res.writeHead(200, { 'content-type': 'application/json', 'set-cookie': `connect.sid=${COOKIE_VALUE}; Path=/; HttpOnly` });
          res.end(JSON.stringify({ id: 'u1', email: SECRET.email, name: 'Smoke' }));
        } else if (req.url === '/auth/me') {
          seen.meCalls += 1;
          if (!sid) seen.meNoCookie += 1;
          if (sid === COOKIE_VALUE && seen.meCalls > 1 && !live.has(sid)) seen.replayMe += 1;
          const ok = live.has(sid);
          res.writeHead(ok ? 200 : 401, { 'content-type': 'application/json' }); res.end(ok ? '{"id":"u1"}' : '{"error":"Not authenticated"}');
        } else if (req.url === '/api/sync') {
          seen.syncBodies.push(body);
          res.writeHead(live.has(sid) ? 200 : 401, { 'content-type': 'application/json' }); res.end('{"users":[]}');
        } else if (req.url === '/auth/logout') {
          if (mode !== 'nodestroy') live.delete(sid); // 'nodestroy' = logout that skips session.destroy
          res.writeHead(204, { 'set-cookie': 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT' }); res.end();
        } else { res.writeHead(404); res.end(); }
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, seen, base: `http://127.0.0.1:${srv.address().port}` }));
  });
  const sfile = join(work, 'smoke-fake.json');
  writeFileSync(sfile, JSON.stringify(SECRET));
  const sOut = (r) => (r.stdout || '') + (r.stderr || '');

  let s = await makeServer('good');
  const g = await runAsync(SMOKE, ['--base', s.base], { SMOKE_ACCOUNT_FILE: sfile });
  s.srv.close();
  ok('smoke-login against a healthy server: PASS (6/6), exit 0', g.status === 0 && /SMOKE: PASS \(6\/6\)/.test(g.stdout || ''), `status=${g.status} sig=${g.signal} ` + (g.stdout || '').trim().split('\n').pop());
  ok('it makes exactly ONE login attempt', s.seen.logins === 1, String(s.seen.logins));
  ok('every POST carried the site\'s own Origin', s.seen.origins.length === 3 && s.seen.origins.every((o) => o === s.base), JSON.stringify(s.seen.origins));
  ok('the sync probe is PULL-ONLY: body is exactly {"lastSyncAt":null,"push":{}}', s.seen.syncBodies.length === 1 && s.seen.syncBodies[0] === '{"lastSyncAt":null,"push":{}}', s.seen.syncBodies[0]);
  ok('/auth/me was called 3 times: signed in, after logout with the (now empty) jar, and with the PRE-LOGOUT cookie replayed', s.seen.meCalls === 3, `meCalls=${s.seen.meCalls} noCookie=${s.seen.meNoCookie}`);
  ok('the replay really sent the old session id (a cookie-less /me happened only for the jar-emptied step)', s.seen.meNoCookie === 1 && s.seen.replayMe === 1, `noCookie=${s.seen.meNoCookie} replayOnDeadSession=${s.seen.replayMe}`);
  ok('smoke-login printed no email, password or cookie value', leaks(sOut(g), [SECRET.email, SECRET.password, COOKIE_VALUE, 'connect.sid']).length === 0);

  s = await makeServer('badlogin');
  const b = await runAsync(SMOKE, ['--base', s.base], { SMOKE_ACCOUNT_FILE: sfile });
  s.srv.close();
  ok('a rejected login: FAIL, exit 1, and STILL exactly one attempt (no retry), nothing after it is called', b.status === 1 && /SMOKE: FAIL/.test(b.stdout || '') && s.seen.logins === 1 && s.seen.syncBodies.length === 0, `logins=${s.seen.logins}`);
  ok('the failure output prints no secret', leaks(sOut(b), [SECRET.email, SECRET.password]).length === 0);

  // THE SERVER-SIDE PROOF: a logout that clears the cookie but SKIPS session.destroy. The jar step still sees 401 (empty
  // cookie), so ONLY the replayed pre-logout cookie can catch it.
  s = await makeServer('nodestroy');
  const k = await runAsync(SMOKE, ['--base', s.base], { SMOKE_ACCOUNT_FILE: sfile });
  s.srv.close();
  const kLines = (k.stdout || '').split('\n');
  ok('a logout that skips session.destroy FAILS the walk - and ONLY at the replayed-cookie step (the jar step passed)', k.status === 1 && kLines.some((l) => /^ok .*after logout, jar.*401/.test(l)) && kLines.some((l) => /^FAIL .*pre-logout cookie replayed.*200/.test(l)) && /SMOKE: FAIL \(5\/6/.test(k.stdout || ''), `status=${k.status} ` + kLines.slice(-3).join(' / '));

  // HTTPS ONLY: nothing is read or sent for a plain-http, non-loopback base - including look-alike loopback hostnames.
  for (const bad of ['http://example.com', 'http://127.0.0.1.evil.example', 'http://localhost.evil.example', 'ftp://127.0.0.1', 'not a url']) {
    const r = await runAsync(SMOKE, ['--base', bad], { SMOKE_ACCOUNT_FILE: sfile });
    ok(`--base ${bad} is refused (exit 2, "Refused", no secret printed)`, r.status === 2 && /Refused/.test(r.stderr || '') && leaks(sOut(r), [SECRET.email, SECRET.password]).length === 0, `status=${r.status}`);
  }
  const rOk = await makeServer('good');
  const rHttps = await runAsync(SMOKE, ['--base', rOk.base], { SMOKE_ACCOUNT_FILE: sfile });
  rOk.srv.close();
  ok('loopback http (127.0.0.1) is still accepted - the proof itself depends on it', rHttps.status === 0);
  const mod2 = await import(pathToFileURL(SMOKE).href);
  ok('assertSafeBase accepts https and loopback http, refuses the rest', (() => { try { mod2.assertSafeBase('https://writer-studio-app-production.up.railway.app'); mod2.assertSafeBase('http://localhost:3000'); mod2.assertSafeBase('http://[::1]:3000'); } catch { return false; } return ['http://example.com', 'http://0.0.0.0', 'file:///x'].every((u) => { try { mod2.assertSafeBase(u); return false; } catch { return true; } }); })());
} finally {
  await pool.end(); await pg.stop();
  try { rmSync(work, { recursive: true, force: true, maxRetries: 20, retryDelay: 300 }); } catch { /* a Windows handle on the scratch dir; it is under the OS temp dir */ }
}
const bad = checks.filter((c) => !c[1]).length;
console.log(bad ? `SMOKE-ACCOUNT TEST: FAIL (${bad}/${checks.length})` : `SMOKE-ACCOUNT TEST: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
