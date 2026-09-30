// ITEM 198 - THE SQL, RUN ON A REAL POSTGRES. Evidence, not a suite file.
//
// sync-incremental-pull-proof.mjs interprets /sync's SQL FROM ITS TEXT with a fake pool - it cannot tell
// whether Postgres would PARSE the new statements, type `$3::int * interval '1 millisecond'`, accept
// `add column ... not null default now()` on a populated table, or give `now()` the meaning the in-flight
// window analysis rests on (the START of the writing transaction). This file asks the real thing.
//
// It runs the REAL migrate.ts and the REAL sync.ts router (esbuild-bundled, `pool` swapped for a pg Pool)
// against a genuine Postgres binary - the `embedded-postgres` that the wrizo-read repo already carries.
// That dependency lives in ANOTHER repo (c:\Users\nickh\wrizo-read), so this file is kept here as evidence
// of a run and is not wired into any suite. Run:  node docs/evidence/item198/real-postgres-check.mjs
//
// The OLD server is `git show 481894f:` of the two files as they stood before 198 (pinned - main moves), so the fault is
// reproduced on real SQL and the fix is measured against it in the same database.
import { mkdirSync, writeFileSync, copyFileSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const READ_REPO = process.env.WRIZO_READ_REPO || 'C:\\Users\\nickh\\wrizo-read';
const serverSrc = join(repo, 'apps/server/src');
const PORT = 54377, DB = 'w198';
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };
const sleep = (t) => new Promise((r) => setTimeout(r, t));
// node-pg hands back Date OBJECTS; Date.parse(DateObject) goes through String() and drops the milliseconds.
const ms = (x) => new Date(x).getTime();

const requireDesktop = createRequire(join(repo, 'apps/desktop/package.json'));
const esbuild = createRequire(requireDesktop.resolve('vite'))('esbuild');
const pgPath = createRequire(join(repo, 'apps/server/package.json')).resolve('pg');
const { Pool, Client } = createRequire(join(repo, 'apps/server/package.json'))('pg');
const EmbeddedPostgres = (await import(pathToFileURL(createRequire(join(READ_REPO, 'package.json')).resolve('embedded-postgres')).href)).default;

const tmp = join(tmpdir(), 'wrizo-198-real-pg');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(join(tmp, 'dist'), { recursive: true });
mkdirSync(join(tmp, 'migrations'), { recursive: true });
copyFileSync(join(repo, 'apps/server/migrations/001_init.sql'), join(tmp, 'migrations', '001_init.sql'));
// THE PRE-198 SERVER, PINNED. origin/main moves (198 itself is on it now), so the control is a fixed commit: 481894f,
// the base 198 was built on. The guard below refuses to run if that commit is not actually the old server.
const PRE_198 = '481894f';
const gitShow = (p) => execSync(`git show ${PRE_198}:apps/server/src/${p}`, { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 24 });
const OLD = { sync: gitShow('sync.ts'), migrate: gitShow('migrate.ts') };
const NEW = { sync: null, migrate: null };
const readNew = (p) => readFileSync(join(serverSrc, p), 'utf8');
NEW.sync = readNew('sync.ts'); NEW.migrate = readNew('migrate.ts');
if (!OLD.sync.includes('updated_at > $2') || OLD.sync.includes('synced_at')) throw new Error(`${PRE_198} is not the pre-198 server - the OLD control would be meaningless`);

writeFileSync(join(tmp, 'db.cjs'), `const { Pool } = require(${JSON.stringify(pgPath)}); exports.pool = new Pool({ connectionString: process.env.DATABASE_URL }); exports.pool.on('error', () => {});`);
writeFileSync(join(tmp, 'auth.cjs'), `exports.requireAuth = (_q, _s, next) => next();`);
const bundle = async (entryName, text, out) => {
  await esbuild.build({
    entryPoints: [join(serverSrc, entryName)], bundle: true, platform: 'node', format: 'cjs', outfile: join(tmp, 'dist', out), logLevel: 'silent',
    external: ['pg-native'],
    plugins: [{ name: 's', setup(b) {
      b.onResolve({ filter: /^\.\/db$/ }, () => ({ path: join(tmp, 'db.cjs') }));
      b.onResolve({ filter: /^\.\/auth$/ }, () => ({ path: join(tmp, 'auth.cjs') }));
      b.onLoad({ filter: new RegExp(entryName.replace('.', '\\.') + '$') }, () => ({ contents: text, loader: 'ts', resolveDir: serverSrc }));
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
  // Errors an upsert swallows (`console.error('[sync] ... failed')`) must not hide: spy on them.
  const swallowed = [];
  const realErr = console.error; console.error = (...a) => { swallowed.push(a.map(String).join(' ').slice(0, 200)); };

  // ---- 1. OLD schema, OLD server, real rows ------------------------------------------------------
  const oldMig = await bundle('migrate.ts', OLD.migrate, 'old-migrate.cjs');
  await oldMig.runMigrations();
  const oldRouter = (await bundle('sync.ts', OLD.sync, 'old-sync.cjs')).syncRouter;
  const newSyncMod = await bundle('sync.ts', NEW.sync, 'new-sync.cjs');
  const handler = (router) => router.stack.find((l) => l.route && l.route.path === '/sync' && l.route.methods.post).route.stack.slice(-1)[0].handle;
  const syncWith = (router, userId, body) => new Promise((res, rej) => handler(router)({ session: { userId }, body }, { json: res }, rej));
  const { rows: [{ id: USER }] } = await admin.query(`insert into users (email, pass_hash) values ('a@b.c', 'x') returning id`);
  const iso = (ms) => new Date(ms).toISOString();

  const bCursor0 = (await syncWith(oldRouter, USER, { lastSyncAt: null, push: {} })).serverTime;   // B's cursor before A pushes
  const stampedBefore = iso(ms(bCursor0) - 5 * 60_000);                                       // A edited 5 minutes before B's cursor
  const rec = { id: 'P', text: 'A OFFLINE EDIT', createdAt: stampedBefore, updatedAt: stampedBefore, pageType: 'page' };
  await syncWith(oldRouter, USER, { lastSyncAt: null, push: { journalEntries: [rec], projects: [{ id: 'PR', title: 't', type: 'creative', createdAt: stampedBefore, updatedAt: stampedBefore }] } });
  const oldPull = await syncWith(oldRouter, USER, { lastSyncAt: bCursor0, push: {} });
  check('OLD server (origin/main), REAL Postgres: an edit stamped 5 min before B\'s cursor and pushed after it is on the server and NOT returned to B\'s incremental pull - the fault, on real SQL',
    oldPull.pull.journalEntries.length === 0 && oldPull.pull.projects.length === 0, JSON.stringify({ journalReturned: oldPull.pull.journalEntries.length, projectsReturned: oldPull.pull.projects.length }));
  const stored = (await admin.query(`select id, text from journal_entries where id = 'P'`)).rows[0];
  check('...and the row IS on the server (only the incremental filter withheld it)', stored && stored.text === 'A OFFLINE EDIT', JSON.stringify(stored));

  // ---- 2. THE NEW migration on that POPULATED database ---------------------------------------------
  const before = Date.now();
  const newMig = await bundle('migrate.ts', NEW.migrate, 'new-migrate.cjs');
  await newMig.runMigrations();
  const TABLES = ['projects', 'story_plans', 'sessions_log', 'drafts', 'drawers', 'journal_entries'];
  const cols = (await admin.query(`select table_name, data_type, is_nullable, column_default from information_schema.columns where column_name = 'synced_at' and table_name = any($1)`, [TABLES])).rows;
  check('NEW migrate.ts on the populated DB: `synced_at timestamptz NOT NULL default now()` exists on all six tables',
    cols.length === 6 && cols.every((c) => c.data_type === 'timestamp with time zone' && c.is_nullable === 'NO' && /now\(\)/.test(c.column_default)), JSON.stringify(cols.map((c) => c.table_name).sort()));
  const idx = (await admin.query(`select indexname from pg_indexes where indexname like '%\\_user\\_synced'`)).rows.map((r) => r.indexname).sort();
  check('...and the six `<table>_user_synced` indexes exist', idx.length === 6, JSON.stringify(idx));
  const stamps1 = (await admin.query(`select id, synced_at from journal_entries union all select id, synced_at from projects order by id`)).rows;
  check('THE ONE-TIME COST: every EXISTING row got a synced_at NEWER than every cursor handed out before the migration (so each device\'s next pull is a full one)',
    stamps1.length === 2 && stamps1.every((r) => ms(r.synced_at) > ms(bCursor0)), JSON.stringify(stamps1.map((r) => ({ id: r.id, synced_at: r.synced_at }))));
  const healed = await syncWith(newSyncMod.syncRouter, USER, { lastSyncAt: bCursor0, push: {} });
  check('...and it HEALS: the row the OLD server never returned is returned by the very next pull with the same old cursor',
    healed.pull.journalEntries.some((r) => r.id === 'P') && healed.pull.projects.some((r) => r.id === 'PR'), JSON.stringify({ journal: healed.pull.journalEntries.length, projects: healed.pull.projects.length }));
  await newMig.runMigrations();
  const stamps2 = (await admin.query(`select id, synced_at from journal_entries union all select id, synced_at from projects order by id`)).rows;
  check('A second boot is a no-op: synced_at is unchanged (idempotent)', JSON.stringify(stamps1.map((r) => [r.id, ms(r.synced_at)])) === JSON.stringify(stamps2.map((r) => [r.id, ms(r.synced_at)])), '');

  // ---- 3. THE NEW server: K1 on real SQL, all six upserts on real SQL ------------------------------
  const R = newSyncMod.syncRouter;
  const cB = (await syncWith(R, USER, { lastSyncAt: null, push: {} })).serverTime;
  const old5 = iso(ms(cB) - 5 * 60_000);
  const clientLie = '2000-01-01T00:00:00.000Z';
  const push = {
    projects: [{ id: 'PR2', title: 't2', type: 'creative', createdAt: old5, updatedAt: old5, syncedAt: clientLie }],
    storyPlans: [{ id: 'SP', projectId: 'PR2', frameworkId: 'f', createdAt: old5, updatedAt: old5 }],
    sessions: [{ id: 'SE', updatedAt: old5, words: 3, durationSec: 4 }],
    drafts: [{ id: 'D', text: 'draft', updatedAt: old5 }],
    drawers: [{ id: 'DW', name: 'drawer', order: 1, createdAt: old5, updatedAt: old5 }],
    journalEntries: [{ id: 'P2', text: 'A OFFLINE EDIT', createdAt: old5, updatedAt: old5, pageType: 'page', synced_at: clientLie }],
  };
  await syncWith(R, USER, { lastSyncAt: null, push });
  check('NEW server, REAL Postgres: all six upserts execute (no swallowed "[sync] ... upsert failed")', swallowed.length === 0, JSON.stringify(swallowed));
  const pulled = await syncWith(R, USER, { lastSyncAt: cB, push: {} });
  const got = { projects: 'PR2', storyPlans: 'SP', sessions: 'SE', drafts: 'D', drawers: 'DW', journalEntries: 'P2' };
  check('K1 on real SQL, ALL SIX collections: rows stamped 5 min before B\'s cursor, pushed after it, ARE returned by B\'s incremental pull',
    Object.entries(got).every(([k, id]) => pulled.pull[k].some((r) => r.id === id)), JSON.stringify(Object.fromEntries(Object.entries(got).map(([k, id]) => [k, pulled.pull[k].some((r) => r.id === id)]))));
  const lie = (await admin.query(`select synced_at from journal_entries where id = 'P2'`)).rows[0].synced_at;
  check('THE STAMP IS THE SERVER\'S: a pushed record that carries its own syncedAt / synced_at is ignored - the row\'s synced_at is now(), not the client\'s value',
    ms(lie) > ms(cB) && ms(lie) > ms(clientLie), JSON.stringify({ synced_at: lie }));
  const up = await syncWith(R, USER, { lastSyncAt: null, push: { journalEntries: [{ id: 'P2', text: 'later', createdAt: old5, updatedAt: iso(ms(old5) + 1000), pageType: 'page' }] } });
  const lie2 = (await admin.query(`select synced_at, text from journal_entries where id = 'P2'`)).rows[0];
  check('ON CONFLICT: an accepted update moves synced_at forward; a REJECTED (older) write does not',
    ms(lie2.synced_at) > ms(lie) && lie2.text === 'later', JSON.stringify(lie2));
  await syncWith(R, USER, { lastSyncAt: null, push: { journalEntries: [{ id: 'P2', text: 'STALE', createdAt: old5, updatedAt: old5, pageType: 'page' }] } });
  const lie3 = (await admin.query(`select synced_at, text from journal_entries where id = 'P2'`)).rows[0];
  check('...(the LWW guard is untouched: a stale write neither changes the text nor bumps synced_at)', lie3.text === 'later' && ms(lie3.synced_at) === ms(lie2.synced_at), JSON.stringify(lie3));

  // ---- 3b. THE CURSOR IS POSTGRES'S OWN now() (the refinement) ---------------------------------------
  const dbBefore = (await admin.query(`select now() as t`)).rows[0].t;
  const cursorResp = await syncWith(R, USER, { lastSyncAt: null, push: {} });
  const dbAfter = (await admin.query(`select now() as t`)).rows[0].t;
  check('CURSOR FROM POSTGRES: serverTime is bracketed by two `select now()` reads taken around the call, and is a whole-millisecond ISO string',
    ms(cursorResp.serverTime) >= ms(dbBefore) - 1 && ms(cursorResp.serverTime) <= ms(dbAfter) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(cursorResp.serverTime),
    JSON.stringify({ before: dbBefore, serverTime: cursorResp.serverTime, after: dbAfter }));
  await syncWith(R, USER, { lastSyncAt: null, push: { drafts: [{ id: 'CUR', text: 'c', updatedAt: old5 }] } });
  const stampCur = (await admin.query(`select synced_at from drafts where id = 'CUR'`)).rows[0].synced_at;
  check('...and a row written AFTER that response is stamped by the same clock and is NEWER than the cursor it handed out (so the next pull returns it with no overlap needed)',
    ms(stampCur) >= ms(cursorResp.serverTime), JSON.stringify({ serverTime: cursorResp.serverTime, stamp: stampCur }));

  // ---- 4. THE IN-FLIGHT WINDOW, on real transaction semantics --------------------------------------
  // A writer opens a transaction and writes (its now() = the START of that transaction), and has NOT
  // committed when B's pull runs and takes its cursor. Then the writer commits.
  const w = new Client({ connectionString: process.env.DATABASE_URL }); await w.connect();
  await w.query('begin');
  await w.query(`insert into drafts (id, user_id, text, updated_at) values ('IF', $1, 'in flight', now()) on conflict (id) do update set text = excluded.text, synced_at = now()`, [USER]);
  const stampInFlight = (await w.query(`select now() as t`)).rows[0].t;                                  // txn start
  await sleep(400);
  const during = await syncWith(R, USER, { lastSyncAt: null, push: {} });                               // B pulls; uncommitted row invisible
  const cursorInFlight = during.serverTime;
  check('IN-FLIGHT (real transaction): B\'s pull does not see the uncommitted write, and B\'s cursor is LATER than the write\'s stamp (now() = the transaction START)',
    !during.pull.drafts.some((r) => r.id === 'IF') && ms(cursorInFlight) > ms(stampInFlight), JSON.stringify({ stamp: stampInFlight, cursor: cursorInFlight }));
  await w.query('commit'); await w.end();
  const after = await syncWith(R, USER, { lastSyncAt: cursorInFlight, push: {} });
  check('IN-FLIGHT: after the write commits, B\'s NEXT pull with that cursor returns it - the 10s overlap catches a stamp OLDER than the cursor',
    after.pull.drafts.some((r) => r.id === 'IF'), JSON.stringify({ returned: after.pull.drafts.map((r) => r.id) }));
  const noOverlap = (await admin.query(`select id from drafts where user_id = $1 and synced_at > $2::timestamptz`, [USER, cursorInFlight])).rows.map((r) => r.id);
  check('...and WITHOUT the overlap the same pull misses it (so the overlap is what does the work, on real SQL)', !noOverlap.includes('IF'), JSON.stringify({ withoutOverlap: noOverlap }));

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
