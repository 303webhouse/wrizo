// BACKUP-PROOF REHEARSAL (this desk, NO production, NO credential): a throwaway embedded Postgres with a few small tables stands in for production. Runs the SAME three helpers Nick will run:
// counts (bp-counts.mjs) -> pg_dump -Fc (the new tools) -> counts again -> bp-restore.mjs (restore into a SECOND scratch server, compare). Prints the helpers' own output lines and whether the pipeline said MATCH.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PG_BIN = 'C:/Users/nickh/tools/pgsql/bin', HELP = 'C:/Users/nickh/.claude/backup-proof';
const req = createRequire(pathToFileURL('C:/Users/nickh/wrizo-read/package.json').href);
const EmbeddedPostgres = req('embedded-postgres').default || req('embedded-postgres');
const pgmod = createRequire('C:/Users/nickh/writer-studio/apps/server/package.json')('pg');
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const PORT = await freePort(); const dir = mkdtempSync(join(tmpdir(), 'bp-rehearsal-')); const out = mkdtempSync(join(tmpdir(), 'bp-rehearsal-out-'));
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'postgres', port: PORT, persistent: false });
let ok = false;
try {
  await pg.initialise(); await pg.start();
  { const admin = new pgmod.Client({ connectionString: `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres` }); await admin.connect(); await admin.query("create database src encoding 'UTF8' template template0 lc_collate 'C' lc_ctype 'C'"); await admin.end(); }
  const c = new pgmod.Client({ connectionString: `postgresql://postgres:postgres@127.0.0.1:${PORT}/src` }); await c.connect();
  await c.query('create table users (id serial primary key, email text not null)');
  await c.query('create table journal_entries (id text primary key, body text, updated_at timestamptz default now(), page_links jsonb default \'[]\')');
  await c.query('create table sessions (sid text primary key, uid int references users(id))');
  await c.query("insert into users (email) select 'u' || g || '@example.invalid' from generate_series(1,7) g");
  await c.query("insert into journal_entries (id, body) select 'e' || g, repeat('word ', 50) from generate_series(1,123) g");
  await c.query("insert into journal_entries (id, body) values ('u1', 'curly “quotes” — dash ’ 日本語 😀 emoji'), ('u2', 'café')");
  await c.query("insert into sessions select 's' || g, (g % 7) + 1 from generate_series(1,12) g");
  await c.end();
  const env = { ...process.env, PGADDR: `postgresql://postgres:postgres@127.0.0.1:${PORT}/src` };
  const run = (cmd, args, e) => spawnSync(cmd, args, { encoding: 'utf8', env: e || env });
  const before = join(out, 'before.json'), after = join(out, 'after.json'), dump = join(out, 'rehearsal.dump');
  let r = run('node', [join(HELP, 'bp-counts.mjs')], { ...env, BP_OUT: before }); console.log(r.stdout.trim().split('\n').map((l) => 'REH1 ' + l).join('\n'));
  const t0 = Date.now();
  r = run(join(PG_BIN, 'pg_dump.exe'), ['-Fc', '-f', dump, `postgresql://postgres:postgres@127.0.0.1:${PORT}/src`]);
  console.log('REH2 pg_dump exit=' + r.status + ' seconds=' + ((Date.now() - t0) / 1000).toFixed(1) + (r.status ? ' ' + String(r.stderr).slice(0, 200) : ''));
  r = run('node', [join(HELP, 'bp-counts.mjs')], { ...env, BP_OUT: after }); console.log(r.stdout.trim().split('\n').slice(-1).map((l) => 'REH3 ' + l).join('\n'));
  if (process.env.REH_TAMPER === '1') {   // NEGATIVE CONTROL: corrupt one table's saved fingerprint in BOTH count files - the pipeline must now say NO
    for (const f of [before, after]) { const j = JSON.parse(readFileSync(f, 'utf8')); j.rows.find((x) => x.table === 'journal_entries').fp = '0'.repeat(32); writeFileSync(f, JSON.stringify(j)); }
    console.log('REH-TAMPER fingerprints of journal_entries corrupted in the saved counts');
  }
  r = spawnSync('node', [join(HELP, 'bp-restore.mjs')], { encoding: 'utf8', env: { ...process.env, PG_BIN, DUMP: dump, COUNTS_BEFORE: before, COUNTS_AFTER: after } });
  console.log(r.stdout.trim().split('\n').map((l) => 'REH4 ' + l).join('\n')); if (r.stderr) console.log('REH4-ERR ' + r.stderr.slice(0, 300));
  ok = r.status === 0;
} catch (e) { console.log('REHEARSAL-ERROR ' + String((e && e.message) || e).slice(0, 300)); }
finally { try { await pg.stop(); } catch {} try { rmSync(dir, { recursive: true, force: true }); rmSync(out, { recursive: true, force: true }); } catch {} }
console.log('REHEARSAL ' + (ok ? 'PASS' : 'FAIL')); process.exit(ok ? 0 : 1);
