// SET-PASSWORD (apps/server/scripts/set-password.mjs) - the DATABASE half, proven against a REAL throwaway Postgres.
//
// The script's own file is the unit under test: its exported applyPasswordChange / normalizeEmail / passwordProblem run
// against a local embedded Postgres holding the real shapes (users; connect-pg-simple's `session` table). It proves the
// update, the session purge (only that account's), the no-such-account and guest branches, a database with no session table,
// and that the password change and the session delete are ONE transaction. The interactive prompt (hidden typing) needs a
// terminal and is NOT exercised here.
//
// NOT part of the desktop suite and adds no dependency: it borrows `embedded-postgres` from any install you point it at.
// Run (from the repo root):
//   EMBEDDED_PG_FROM=C:/path/to/a/package.json-with-embedded-postgres  node apps/server/scripts/harness/set-password-db.mjs
// (a scratch data directory is created under the OS temp dir and removed). exit 0 = every check passed.
import { createRequire } from 'node:module';
import { rmSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const here = dirname(fileURLToPath(import.meta.url));
const reqSrv = createRequire(pathToFileURL(join(here, '..', '..', 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg'); const bcrypt = reqSrv('bcryptjs');
const mod = await import(pathToFileURL(join(here, '..', 'set-password.mjs')).href);
const checks=[]; const ok=(n,p,d='')=>{checks.push([n,p,d]); console.log((p?'PASS ':'FAIL ')+n+(d?'  '+d:''));};
const dir = join(mkdtempSync(join(tmpdir(), 'setpw-pg-')), 'data');
const pg = new EmbeddedPostgres({ databaseDir: dir, user:'postgres', password:'postgres', port:54331, persistent:false });
await pg.initialise(); await pg.start(); await pg.createDatabase('t');
const pool = new Pool({ connectionString:'postgres://postgres:postgres@127.0.0.1:54331/t' });
try {
  await pool.query(`create extension if not exists pgcrypto`);
  await pool.query(`create table users(id uuid primary key default gen_random_uuid(), email text unique not null, pass_hash text not null, name text)`);
  // connect-pg-simple's own table shape
  await pool.query(`create table session(sid varchar not null primary key, sess json not null, expire timestamp(6) not null)`);
  const oldHash = await bcrypt.hash('oldpassword1', 4);
  const a = (await pool.query(`insert into users(email,pass_hash,name) values('nick@example.com',$1,'N') returning id`,[oldHash])).rows[0].id;
  const b = (await pool.query(`insert into users(email,pass_hash,name) values('other@example.com',$1,'O') returning id`,[oldHash])).rows[0].id;
  const sess=(uid)=>JSON.stringify({cookie:{},userId:uid});
  await pool.query(`insert into session values('s1',$1,now()+interval '1 day'),('s2',$1,now()+interval '1 day'),('s3',$2,now()+interval '1 day'),('s4',$3,now()+interval '1 day')`,[sess(a),sess(b),JSON.stringify({cookie:{}})]);
  // pure helpers
  ok('normalizeEmail trims and lowercases', mod.normalizeEmail('  Nick@Example.COM ')==='nick@example.com');
  ok('a 7-char password is refused, an 8-char one is accepted', mod.passwordProblem('1234567')!==null && mod.passwordProblem('12345678')===null);
  ok('the cost constants mirror passwordHash.ts (the one place auth.ts takes them from)', mod.BCRYPT_COST===12 && mod.MIN_PASSWORD_LENGTH===8 && /BCRYPT_COST = 12;/.test(readFileSync(join(here, '..', '..', 'src', 'passwordHash.ts'),'utf8')) && /MIN_PASSWORD_LENGTH = 8;/.test(readFileSync(join(here, '..', '..', 'src', 'passwordHash.ts'),'utf8')));
  // 1. happy path
  const newHash = await bcrypt.hash('brand-new-pass', 4);
  let c = await pool.connect(); const r1 = await mod.applyPasswordChange(c,'nick@example.com',newHash); c.release();
  ok('known email -> "updated"', r1==='updated', r1);
  const row = (await pool.query(`select pass_hash from users where id=$1`,[a])).rows[0];
  ok('the new password verifies and the old one no longer does', await bcrypt.compare('brand-new-pass',row.pass_hash) && !(await bcrypt.compare('oldpassword1',row.pass_hash)));
  const sa = (await pool.query(`select sid from session order by sid`)).rows.map(r=>r.sid);
  ok("that user's sessions are gone; another user's and an anonymous one remain", JSON.stringify(sa)===JSON.stringify(['s3','s4']), JSON.stringify(sa));
  const orow = (await pool.query(`select pass_hash from users where id=$1`,[b])).rows[0];
  ok("the other account's password is untouched", await bcrypt.compare('oldpassword1',orow.pass_hash));
  // 2. unknown email
  c = await pool.connect(); const r2 = await mod.applyPasswordChange(c,'nobody@example.com',newHash); c.release();
  const cnt = (await pool.query(`select count(*)::int n from session`)).rows[0].n;
  ok('unknown email -> "no such account" and nothing deleted', r2==='no such account' && cnt===2, `${r2} sessions=${cnt}`);
  // 3. guest guard appears only when the column exists
  await pool.query(`alter table users add column is_guest boolean not null default false`);
  await pool.query(`update users set is_guest=true where id=$1`,[b]);
  await pool.query(`insert into session values('s5',$1,now()+interval '1 day')`,[sess(b)]);
  c = await pool.connect(); const r3 = await mod.applyPasswordChange(c,'other@example.com',newHash); c.release();
  const grow = (await pool.query(`select pass_hash from users where id=$1`,[b])).rows[0];
  const s5 = (await pool.query(`select count(*)::int n from session where sid='s5'`)).rows[0].n;
  ok('a guest account is never changed (and its sessions stay) once is_guest exists', r3==='no such account' && await bcrypt.compare('oldpassword1',grow.pass_hash) && s5===1, r3);
  c = await pool.connect(); const r3b = await mod.applyPasswordChange(c,'nick@example.com',newHash); c.release();
  ok('a non-guest account still updates with the guard in place', r3b==='updated', r3b);
  // 4. no session table at all
  await pool.query(`drop table session`);
  c = await pool.connect(); const r4 = await mod.applyPasswordChange(c,'nick@example.com',newHash); c.release();
  ok('a database with no session table still updates', r4==='updated', r4);
  // 5. atomic: a failing delete rolls the password back
  await pool.query(`create table session(sid varchar primary key, sess text not null, expire timestamp)`); // sess->>'userId' on text errors
  await pool.query(`insert into session values('x','{}',now())`);
  const before = (await pool.query(`select pass_hash from users where email='nick@example.com'`)).rows[0].pass_hash;
  c = await pool.connect(); let threw=false; try { await mod.applyPasswordChange(c,'nick@example.com',await bcrypt.hash('zzzzzzzz1',4)); } catch { threw=true; } c.release();
  const after = (await pool.query(`select pass_hash from users where email='nick@example.com'`)).rows[0].pass_hash;
  ok('if ending sessions fails, the password change is rolled back too (one transaction)', threw && before===after);
} finally { await pool.end(); await pg.stop(); rmSync(dir,{recursive:true,force:true}); }
const bad = checks.filter(c=>!c[1]).length; console.log(bad? `SETPW TEST: FAIL (${bad}/${checks.length})` : `SETPW TEST: PASS (${checks.length} checks)`); process.exit(bad?1:0);
