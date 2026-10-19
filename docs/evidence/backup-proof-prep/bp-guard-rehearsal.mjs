// WRONG-DATABASE GUARD REHEARSAL (this desk; Fable Oct 18): a throwaway Postgres whose tables are NOT Wrizo's (no users, no journal_entries) stands in for "the wrong database".
// Checks, with the REAL helpers: (1) bp-counts prints EXACTLY one line, "wrong database, stopped", exits non-zero, writes no BP_OUT file, and leaks none of the stand-in's table names or counts;
// (2) a database with `users` but NOT `journal_entries` is also refused (both tables are required); (3) bp-restore on a dump of the wrong database prints only the guard line after its own restore line;
// (4) POSITIVE CONTROL: a database with both tables still passes. The stand-in tables carry made-up names ("zz_*") so a leak would be unmistakable.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PG_BIN = 'C:/Users/nickh/tools/pgsql/bin', HELP = process.env.HELP_DIR || 'C:/Users/nickh/.claude/backup-proof';   // HELP_DIR points the same checks at a MUTANT copy
const req = createRequire(pathToFileURL('C:/Users/nickh/wrizo-read/package.json').href);
const EmbeddedPostgres = req('embedded-postgres').default || req('embedded-postgres');
const pgmod = createRequire('C:/Users/nickh/writer-studio/apps/server/package.json')('pg');
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const PORT = await freePort(); const dir = mkdtempSync(join(tmpdir(), 'bp-guard-')); const out = mkdtempSync(join(tmpdir(), 'bp-guard-out-'));
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'postgres', port: PORT, persistent: false });
const results = []; const check = (name, pass, detail = '') => { results.push(pass); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  ' + detail : '')); };
const addr = (db) => `postgresql://postgres:postgres@127.0.0.1:${PORT}/${db}`;
const mk = async (db, ddl) => { const a = new pgmod.Client({ connectionString: addr('postgres') }); await a.connect(); await a.query(`create database ${db} encoding 'UTF8' template template0 lc_collate 'C' lc_ctype 'C'`); await a.end(); const c = new pgmod.Client({ connectionString: addr(db) }); await c.connect(); for (const q of ddl) await c.query(q); await c.end(); };
try {
  await pg.initialise(); await pg.start();
  await mk('wrongdb', ['create table zz_alpha (id int)', 'create table zz_beta (id int)', 'insert into zz_alpha select g from generate_series(1,4242) g', 'insert into zz_beta select g from generate_series(1,17) g']);
  await mk('halfdb', ['create table users (id int)', 'create table zz_gamma (id int)', 'insert into zz_gamma select g from generate_series(1,31337) g']);
  await mk('rightdb', ['create table users (id int)', 'create table journal_entries (id text)', 'insert into users select g from generate_series(1,3) g', "insert into journal_entries select 'e' || g from generate_series(1,9) g"]);
  const counts = (db, outFile) => spawnSync('node', [join(HELP, 'bp-counts.mjs')], { encoding: 'utf8', env: { ...process.env, PGADDR: addr(db), BP_OUT: outFile } });
  const leak = (s) => /zz_|4242|31337|totalRows|serverMajor|BPCOUNT/.test(s);
  // (1) the wrong database
  const f1 = join(out, 'wrong.json'); let r = counts('wrongdb', f1);
  check('G1 wrong database: bp-counts prints exactly "wrong database, stopped" and nothing else', r.stdout.trim() === 'wrong database, stopped' && r.stderr.trim() === '', JSON.stringify(r.stdout.trim()));
  check('G1 ...exits non-zero (3), so backup-proof.ps1 stops before any dump', r.status === 3, 'exit=' + r.status);
  check('G1 ...writes no counts file, and leaks none of the stand-in\'s table names or counts', !existsSync(f1) && !leak(r.stdout + r.stderr));
  // (2) users but no journal_entries
  const f2 = join(out, 'half.json'); r = counts('halfdb', f2);
  check('G2 only `users` present (no journal_entries): refused the same way', r.stdout.trim() === 'wrong database, stopped' && r.status === 3 && !existsSync(f2) && !leak(r.stdout), JSON.stringify(r.stdout.trim()) + ' exit=' + r.status);
  // (3) bp-restore on a dump of the wrong database
  const dump = join(out, 'wrong.dump'); const d = spawnSync(join(PG_BIN, 'pg_dump.exe'), ['-Fc', '-f', dump, addr('wrongdb')], { encoding: 'utf8' });
  const cj = join(out, 'c.json'); writeFileSync(cj, JSON.stringify({ serverMajor: 18, rows: [] }));
  r = spawnSync('node', [join(HELP, 'bp-restore.mjs')], { encoding: 'utf8', env: { ...process.env, PG_BIN, DUMP: dump, COUNTS_BEFORE: cj, COUNTS_AFTER: cj } });
  const lines = r.stdout.split('\n').map((l) => l.trim()).filter((l) => /^(BP|wrong database)/.test(l));
  check('G3 bp-restore on a dump of the wrong database: its output is the restore line and "wrong database, stopped" - no table, no count, no RESTORE-MATCH', d.status === 0 && lines.length === 2 && /^BPRESTORE pg_restore exit=0/.test(lines[0]) && lines[1] === 'wrong database, stopped' && !leak(lines.slice(1).join(' ')) && !/RESTORE-MATCH/.test(r.stdout), JSON.stringify(lines));
  check('G3 ...and it exits non-zero', r.status !== 0, 'exit=' + r.status);
  // (4) positive control
  const f4 = join(out, 'right.json'); r = counts('rightdb', f4);
  check('G4 POSITIVE CONTROL: a database with users AND journal_entries still counts normally', r.status === 0 && /BPCOUNT journal_entries 9 /.test(r.stdout) && /BPCOUNT users 3 /.test(r.stdout) && existsSync(f4), 'exit=' + r.status);
} catch (e) { console.log('GUARD-REHEARSAL-ERROR ' + String((e && e.message) || e).slice(0, 300)); results.push(false); }
finally { try { await pg.stop(); } catch {} try { rmSync(dir, { recursive: true, force: true }); rmSync(out, { recursive: true, force: true }); } catch {} }
const ok = results.length > 0 && results.every(Boolean);
console.log('GUARD-REHEARSAL ' + (ok ? 'PASS' : 'FAIL') + ' (' + results.filter(Boolean).length + '/' + results.length + ')'); process.exit(ok ? 0 : 1);
