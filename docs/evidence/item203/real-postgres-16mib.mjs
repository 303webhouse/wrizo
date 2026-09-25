// ITEM 203 (P3) - A 16 MiB jsonb PARAMETER, ON A REAL POSTGRES. Evidence, not a suite file.
//
// P3 lets /api/sync read a body up to 16 MiB so that ONE lone record (a dense ink page) can reach another device. The fake
// pool the instrument uses does not model what a database does with a 16 MiB jsonb value, so this file asks the real thing:
// does Postgres ACCEPT it through the real upsert, STORE it faithfully, and hand it BACK through the real pull - and what does
// each step cost in time and in the Node process's memory?
//
// It runs the REAL migrate.ts and the REAL sync.ts router (esbuild-bundled, `pool` swapped for a pg Pool) against a genuine
// Postgres binary - the `embedded-postgres` the wrizo-read repo carries (that dependency is why this is evidence and not a suite file).
//   Run: node docs/evidence/item203/real-postgres-16mib.mjs
import { mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const READ_REPO = process.env.WRIZO_READ_REPO || 'C:\\Users\\nickh\\wrizo-read';
const serverSrc = join(repo, 'apps/server/src');
const PORT = 54379, DB = 'w203';
const MiB = 1024 * 1024;
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };
const say = (s = '') => console.log(s);
const ms = () => Number(process.hrtime.bigint() / 1000000n);

const requireDesktop = createRequire(join(repo, 'apps/desktop/package.json'));
const esbuild = createRequire(requireDesktop.resolve('vite'))('esbuild');
const reqServer = createRequire(join(repo, 'apps/server/package.json'));
const pgPath = reqServer.resolve('pg');
const { Pool } = reqServer('pg');
const EmbeddedPostgres = (await import(pathToFileURL(createRequire(join(READ_REPO, 'package.json')).resolve('embedded-postgres')).href)).default;

const tmp = join(tmpdir(), 'wrizo-203-16mib');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(join(tmp, 'dist'), { recursive: true });
mkdirSync(join(tmp, 'migrations'), { recursive: true });
copyFileSync(join(repo, 'apps/server/migrations/001_init.sql'), join(tmp, 'migrations', '001_init.sql'));
writeFileSync(join(tmp, 'db.cjs'), `const { Pool } = require(${JSON.stringify(pgPath)}); exports.pool = new Pool({ connectionString: process.env.DATABASE_URL }); exports.pool.on('error', () => {});`);
writeFileSync(join(tmp, 'auth.cjs'), `exports.requireAuth = (_q, _s, next) => next();`);
const bundle = async (entry, out) => {
  await esbuild.build({
    entryPoints: [join(serverSrc, entry)], bundle: true, platform: 'node', format: 'cjs', outfile: join(tmp, 'dist', out), logLevel: 'silent', external: ['pg-native'],
    plugins: [{ name: 's', setup(b) {
      b.onResolve({ filter: /^\.\/db$/ }, () => ({ path: join(tmp, 'db.cjs') }));
      b.onResolve({ filter: /^\.\/auth$/ }, () => ({ path: join(tmp, 'auth.cjs') }));
    } }],
  });
  return createRequire(import.meta.url)(join(tmp, 'dist', out));
};

const pg = new EmbeddedPostgres({ databaseDir: join(tmp, 'data'), user: 'postgres', password: 'postgres', port: PORT, persistent: false });
await pg.initialise(); await pg.start(); await pg.createDatabase(DB);
process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/${DB}`;
const admin = new Pool({ connectionString: process.env.DATABASE_URL });
admin.on('error', () => {});
let exitCode = 1;
try {
  const swallowed = [];
  const realErr = console.error; console.error = (...a) => { swallowed.push(a.map(String).join(' ').slice(0, 200)); };
  await (await bundle('migrate.ts', 'migrate.cjs')).runMigrations();
  const router = (await bundle('sync.ts', 'sync.cjs')).syncRouter;
  const handler = router.stack.find((l) => l.route && l.route.path === '/sync' && l.route.methods.post).route.stack.slice(-1)[0].handle;
  const sync = (userId, body) => new Promise((res, rej) => handler({ session: { userId }, body }, { json: res }, rej));
  const { rows: [{ id: USER }] } = await admin.query(`insert into users (email, pass_hash) values ('a@b.c', 'x') returning id`);

  // A record whose strokes are as big as P3 lets ONE record be: the whole request body must fit in 16 MiB, so the envelope
  // and the record's other fields come out of it. Real-shaped points (x/y unrounded doubles, pressure to 3 places).
  const LIMIT = 16 * MiB;
  const pt = () => ({ x: (100 + Math.random() * 900) / 1234.5, y: (60 + Math.random() * 1300) / 1234.5, p: Math.round(Math.random() * 1000) / 1000 });
  const skeleton = (strokes) => ({ lastSyncAt: null, push: { journalEntries: [{ id: 'BIG', text: 'a 16 MiB ink page', pageType: 'page', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', strokes }] } });
  const envelope = JSON.stringify(skeleton([{ id: 's', points: [] }])).length;
  const perPoint = Buffer.byteLength(JSON.stringify(Array.from({ length: 20000 }, pt))) / 20000;      // MEASURED for these very points (pressure on every one), not assumed
  const n = Math.floor((LIMIT - envelope - 4096) / perPoint);
  const points = Array.from({ length: n }, pt);
  const body = skeleton([{ id: 's', points }]);
  const bodyBytes = Buffer.byteLength(JSON.stringify(body));
  say(`request body: ${(bodyBytes / MiB).toFixed(2)} MiB (${n.toLocaleString()} points) - under the ${LIMIT / MiB} MiB limit by ${((LIMIT - bodyBytes) / 1024).toFixed(0)} KiB`);
  check('the constructed request is a REAL near-limit body: 15.9+ MiB and under 16 MiB', bodyBytes > 15.9 * MiB && bodyBytes < LIMIT, `${(bodyBytes / MiB).toFixed(3)} MiB`);

  const rss0 = process.resourceUsage().maxRSS * 1024;
  const t0 = ms();
  await sync(USER, body);
  const upsertMs = ms() - t0;
  const rssAfterUpsert = process.resourceUsage().maxRSS * 1024;
  const row = (await admin.query(`select octet_length(strokes::text) as jsonb_text_bytes, pg_column_size(strokes) as stored_bytes, jsonb_array_length(strokes) as strokes_n, jsonb_array_length(strokes->0->'points') as points_n from journal_entries where id = 'BIG'`)).rows[0];
  say(`upsert: ${upsertMs} ms; node peak RSS ${(rss0 / MiB).toFixed(0)} -> ${(rssAfterUpsert / MiB).toFixed(0)} MiB; stored: ${(row.jsonb_text_bytes / MiB).toFixed(2)} MiB of jsonb text, ${(row.stored_bytes / MiB).toFixed(2)} MiB on disk (TOAST-compressed)`);
  check('THE UPSERT: the real ordinary upsert ACCEPTS a ~16 MiB jsonb parameter - no error, nothing swallowed', row && swallowed.length === 0, JSON.stringify({ swallowed }));
  check('...and STORES it faithfully: every point is there (jsonb, so the text form is normalised, but the count is exact)', Number(row.points_n) === n && Number(row.strokes_n) === 1, JSON.stringify({ storedPoints: Number(row.points_n), sent: n }));

  const t1 = ms();
  const pulled = await sync(USER, { lastSyncAt: null, push: {} });                    // a fresh device's FULL pull returns the record
  const pullMs = ms() - t1;
  const back = pulled.pull.journalEntries.find((e) => e.id === 'BIG');
  const responseBytes = Buffer.byteLength(JSON.stringify(pulled));
  const rssAfterPull = process.resourceUsage().maxRSS * 1024;
  say(`full pull: ${pullMs} ms; response ${(responseBytes / MiB).toFixed(2)} MiB; node peak RSS now ${(rssAfterPull / MiB).toFixed(0)} MiB`);
  check('THE PULL: the real pull hands it BACK through the real mapper, every point intact', !!back && back.strokes && back.strokes[0].points.length === n, JSON.stringify({ found: !!back, points: back && back.strokes && back.strokes[0].points.length }));
  check('THE OTHER DIRECTION, measured (S0 left it open): the full-pull RESPONSE for a fresh device that must fetch this one record is ~16 MiB in a single JSON body - one piece, uncapped, as feared. It WORKS; it is not small', responseBytes > 14 * MiB, `${(responseBytes / MiB).toFixed(2)} MiB in ${pullMs} ms`);

  // The same value, one MORE time as an UPDATE of the now-existing row (the ordinary on-conflict path, not an insert).
  const body2 = skeleton([{ id: 's', points: points.slice(0, n - 100) }]);
  body2.push.journalEntries[0].updatedAt = new Date().toISOString();
  const t2 = ms();
  await sync(USER, body2);
  const upd = (await admin.query(`select jsonb_array_length(strokes->0->'points') as points_n from journal_entries where id = 'BIG'`)).rows[0];
  check('AN UPDATE of the same 16 MiB row goes through the on-conflict path too (100 points erased -> the stored count follows)', Number(upd.points_n) === n - 100, `${ms() - t2} ms, stored ${upd.points_n}`);

  // The safety valve above the limit is Express's, not Postgres's - this run shows Postgres would have taken more, which is exactly why the app-level limit matters.
  const rssFinal = process.resourceUsage().maxRSS * 1024;
  say(`node process peak RSS over the whole run: ${(rssFinal / MiB).toFixed(0)} MiB (this process built the ${(bodyBytes / MiB).toFixed(0)} MiB body itself, so it is an UPPER bound for the handler's own share)`);
  console.error = realErr;
  const failed = results.filter((r) => !r.pass);
  console.log(`\nREAL POSTGRES (${(await admin.query('select version()')).rows[0].version.split(' ').slice(0, 2).join(' ')}): ${failed.length ? `${failed.length}/${results.length} FAILED` : `PASS (${results.length} checks)`}`);
  exitCode = failed.length ? 1 : 0;
} catch (e) {
  console.log('CHECK ERROR:', e && e.stack || e);
} finally {
  try { await admin.end(); } catch { /* */ }
  try { await pg.stop(); } catch { /* */ }
  process.exit(exitCode);
}
