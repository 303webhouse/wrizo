// BACKUP PROOF - RESTORE INTO A SCRATCH POSTGRES AND COMPARE COUNTS (this desk). Needs NO credential: it takes the dump FILE Nick's run wrote and the per-table counts that run saved.
// Starts a throwaway embedded Postgres (borrowed from wrizo-read, adds no dependency) on a free port in a temp dir, restores the dump with the client tools' pg_restore, counts every public table,
// compares with the production counts (before AND after the dump), prints ONLY: restore seconds, per-table counts side by side, and MATCH yes/no; then stops the scratch server and deletes its data directory.
// Run:  PG_BIN=C:/Users/nickh/tools/pgsql/bin DUMP=<file> COUNTS_BEFORE=<json> COUNTS_AFTER=<json> node <this file>      (EMBEDDED_PG_FROM defaults to wrizo-read's package.json)
import { createRequire } from 'node:module';
import { rmSync, readFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PG_BIN = process.env.PG_BIN, DUMP = process.env.DUMP;
const need = (v, n) => { if (!v) { console.error('missing ' + n); process.exit(2); } };
need(PG_BIN, 'PG_BIN'); need(DUMP, 'DUMP'); need(process.env.COUNTS_BEFORE, 'COUNTS_BEFORE'); need(process.env.COUNTS_AFTER, 'COUNTS_AFTER');
if (!existsSync(join(PG_BIN, 'pg_restore.exe')) || !existsSync(DUMP)) { console.error('pg_restore.exe or the dump file is missing'); process.exit(2); }
const from = process.env.EMBEDDED_PG_FROM || 'C:/Users/nickh/wrizo-read/package.json';
const req = createRequire(pathToFileURL(from).href);
const EmbeddedPostgres = req('embedded-postgres').default || req('embedded-postgres');
const reqSrv = createRequire('C:/Users/nickh/writer-studio/apps/server/package.json');
const pgmod = reqSrv('pg');
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const PORT = await freePort();
const dir = mkdtempSync(join(tmpdir(), 'bp-restore-'));
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'postgres', port: PORT, persistent: false });
let ok = false;
try {
  await pg.initialise(); await pg.start();
  // The scratch cluster defaults to WIN1252 on this machine; production holds UTF-8 text (curly quotes, dashes, emoji), so the scratch DATABASE is created UTF8 from template0 (a restore into WIN1252 could fail or mangle exactly what is being proved).
  { const admin = new pgmod.Client({ connectionString: `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres` }); await admin.connect(); await admin.query("create database restoreproof encoding 'UTF8' template template0 lc_collate 'C' lc_ctype 'C'"); await admin.end(); }
  const t0 = Date.now();
  const r = spawnSync(join(PG_BIN, 'pg_restore.exe'), ['--no-owner', '--no-acl', '--exit-on-error', '-d', `postgresql://postgres:postgres@127.0.0.1:${PORT}/restoreproof`, DUMP], { encoding: 'utf8' });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('BPRESTORE pg_restore exit=' + r.status + ' seconds=' + secs + ' dumpBytes=' + statSync(DUMP).size);
  if (r.status !== 0) console.log('BPRESTORE-STDERR ' + String(r.stderr || '').split('\n').slice(0, 6).join(' | ').slice(0, 600));
  const c = new pgmod.Client({ connectionString: `postgresql://postgres:postgres@127.0.0.1:${PORT}/restoreproof` });
  await c.connect();
  await c.query("set time zone 'UTC'");
  const t = await c.query("select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name");
  const got = {}, gotFp = {};
  for (const { table_name } of t.rows) {
    const q = '"public"."' + table_name.replace(/"/g, '""') + '"';
    got[table_name] = Number((await c.query('select count(*)::bigint as c from ' + q)).rows[0].c);
    gotFp[table_name] = (await c.query("select coalesce(md5(string_agg(md5(t::text), '' order by md5(t::text))), md5('')) as fp from " + q + " t")).rows[0].fp;
  }
  await c.end();
  const before = JSON.parse(readFileSync(process.env.COUNTS_BEFORE, 'utf8')), after = JSON.parse(readFileSync(process.env.COUNTS_AFTER, 'utf8'));
  const map = (j) => Object.fromEntries(j.rows.map((x) => [x.table, x.rows]));
  const fpMap = (j) => Object.fromEntries(j.rows.map((x) => [x.table, x.fp]));
  const B = map(before), A = map(after), BF = fpMap(before), AF = fpMap(after);
  const names = [...new Set([...Object.keys(B), ...Object.keys(A), ...Object.keys(got)])].sort();
  let allMatchAfter = true, allMatchBefore = true;
  for (const n of names) {
    const mA = got[n] === A[n] && gotFp[n] === AF[n], mB = got[n] === B[n] && gotFp[n] === BF[n];
    if (!mA) allMatchAfter = false; if (!mB) allMatchBefore = false;
    console.log(`BPROW ${n} production-before=${B[n] ?? '-'} production-after=${A[n] ?? '-'} restored=${got[n] ?? '-'} content=${gotFp[n] === AF[n] || gotFp[n] === BF[n] ? 'SAME' : 'DIFFERS'} ${mA ? 'MATCH' : (mB ? 'matches-before-only' : 'DIFFERS')}`);
  }
  ok = r.status === 0 && (allMatchAfter || allMatchBefore) && names.length > 0;
  console.log(`BPRESULT restoreExit=${r.status} tables=${names.length} matchAfter=${allMatchAfter} matchBefore=${allMatchBefore} => ${ok ? 'RESTORE-MATCH: YES' : 'RESTORE-MATCH: NO'}`);
} catch (e) { console.log('BPRESTORE-ERROR ' + String((e && e.message) || e).slice(0, 300)); }
finally { try { await pg.stop(); } catch { /* gone */ } try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ } }
process.exit(ok ? 0 : 1);
