// ITEM 201 - S0. The design's SQL sketch (plan-168-delete-permanently @ 87eae9a, section 3) turned into SQL and
// RUN on a real Postgres, with the exact server edit set prototyped in a SCRATCH bundle. It changes nothing in
// apps/server: the edits are string transforms applied to a copy of sync.ts for this run only.
//
// The edit set under test (the whole entry half of the server):
//   E1  alter table journal_entries add column if not exists purged_at timestamptz         (the ONE column - nullable, no default)
//   E2  the ordinary upsert's WHERE gains  `and journal_entries.purged_at is null`         (monotone: a purged row is frozen)
//   E3  a record that carries purgedAt is routed to purgeJournalEntry(), not the ordinary upsert
//   E4  purgeJournalEntry(): ONE statement - insert a blank tombstone, or blank the existing row in place
//   E5  rowToJournalEntry maps purged_at -> purgedAt (SQL null -> JS undefined, never null)
//
// Like real-postgres-check.mjs for item 198 it needs a genuine Postgres binary; the embedded-postgres that the
// wrizo-read repo carries is used, so this is evidence of a run and is not wired into any suite.
//   Run: node docs/evidence/item201/s0-purge-sql-check.mjs
import { mkdirSync, writeFileSync, copyFileSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const READ_REPO = process.env.WRIZO_READ_REPO || 'C:\\Users\\nickh\\wrizo-read';
const serverSrc = join(repo, 'apps/server/src');
const PORT = 54378, DB = 'w201';
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };
const ms = (x) => new Date(x).getTime();

const requireDesktop = createRequire(join(repo, 'apps/desktop/package.json'));
const esbuild = createRequire(requireDesktop.resolve('vite'))('esbuild');
const reqServer = createRequire(join(repo, 'apps/server/package.json'));
const pgPath = reqServer.resolve('pg');
const { Pool } = reqServer('pg');
const EmbeddedPostgres = (await import(pathToFileURL(createRequire(join(READ_REPO, 'package.json')).resolve('embedded-postgres')).href)).default;

const tmp = join(tmpdir(), 'wrizo-201-s0');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(join(tmp, 'dist'), { recursive: true });
mkdirSync(join(tmp, 'migrations'), { recursive: true });
copyFileSync(join(repo, 'apps/server/migrations/001_init.sql'), join(tmp, 'migrations', '001_init.sql'));
writeFileSync(join(tmp, 'db.cjs'), `const { Pool } = require(${JSON.stringify(pgPath)}); exports.pool = new Pool({ connectionString: process.env.DATABASE_URL }); exports.pool.on('error', () => {});`);
writeFileSync(join(tmp, 'auth.cjs'), `exports.requireAuth = (_q, _s, next) => next();`);

const SYNC = readFileSync(join(serverSrc, 'sync.ts'), 'utf8').replace(/\r\n/g, '\n');
const MIGRATE = readFileSync(join(serverSrc, 'migrate.ts'), 'utf8').replace(/\r\n/g, '\n');

// ---- THE PROTOTYPE EDIT SET, as transforms of a copy ---------------------------------------------------------
// The columns a purge blanks. Derived below from the LIVE schema, not typed twice: the check asserts this list
// covers every column that is not identity or a stamp - the guard against the next column added to
// journal_entries (page_links, beside_links, ...) silently escaping the purge.
const BLANK_SQL = [
  "project_id = null", "text = ''", "session_id = null", "starred = null", "source = null", "shelved = false",
  "beat_id = null", "page_type = null", "order_index = null", "imported_at = null", "boxes = null", "script = null",
  "origin = null", "tutor = null", "tags = null", "routed_project_ids = null", "strokes = null",
  "plan_board_id = null", "page_settings = null",
];
const PURGE_FN = `
// ITEM 201 (prototype) - a purge is a TOMBSTONE, never an absence. One statement: insert a blank row for an id the
// server never saw (so a device that still holds it cannot INSERT it back), or blank the existing row in place.
async function purgeJournalEntry(userId: string, e: any): Promise<void> {
  const at = e.purgedAt;
  await pool.query(
    \`insert into journal_entries (id, user_id, text, created_at, updated_at, deleted_at, purged_at)
     values ($1, $2, '', $3, $4, $5, $5)
     on conflict (id) do update set
       ${BLANK_SQL.join(',\n       ')},
       deleted_at = coalesce(journal_entries.deleted_at, excluded.deleted_at),
       purged_at = coalesce(journal_entries.purged_at, excluded.purged_at),
       updated_at = greatest(journal_entries.updated_at, excluded.updated_at),
       synced_at = now()
     where journal_entries.user_id = excluded.user_id\`,
    [e.id, userId, e.createdAt, e.updatedAt, at],
  );
}
`;
const editSync = (s) => {
  const must = (t, a, b) => { if (t.split(a).length !== 2) throw new Error('EDIT DID NOT LAND: ' + a.slice(0, 70)); return t.replace(a, b); };
  s = must(s, "           and excluded.updated_at > journal_entries.updated_at`,", "           and journal_entries.purged_at is null\n           and excluded.updated_at > journal_entries.updated_at`,");                       // E2
  s = must(s, "async function upsertJournalEntries(userId: string, records: any[]): Promise<void> {\n  for (const e of records) {\n    if (!e?.id || !e?.updatedAt || !e?.createdAt) continue;\n",
              PURGE_FN + "\nasync function upsertJournalEntries(userId: string, records: any[]): Promise<void> {\n  for (const e of records) {\n    if (!e?.id || !e?.updatedAt || !e?.createdAt) continue;\n    if (e.purgedAt) { try { await purgeJournalEntry(userId, e); } catch (err) { console.error('[sync] journal_entry purge failed', e.id, err); } continue; }\n");   // E3+E4
  return s;
};
const readMapper = SYNC.match(/function rowToJournalEntry\(r: any\)[\s\S]*?\n}\n/);

const bundle = async (entryName, text, out) => {
  await esbuild.build({
    entryPoints: [join(serverSrc, entryName)], bundle: true, platform: 'node', format: 'cjs', outfile: join(tmp, 'dist', out), logLevel: 'silent', external: ['pg-native'],
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
  const swallowed = [];
  const realErr = console.error; console.error = (...a) => { swallowed.push(a.map(String).join(' ').slice(0, 220)); };

  // MAIN's real migration (198 included), then E1.
  await (await bundle('migrate.ts', MIGRATE, 'migrate.cjs')).runMigrations();
  await admin.query(`alter table journal_entries add column if not exists purged_at timestamptz`);
  await admin.query(`alter table journal_entries add column if not exists purged_at timestamptz`);   // idempotent on a second boot
  const col = (await admin.query(`select data_type, is_nullable, column_default from information_schema.columns where table_name='journal_entries' and column_name='purged_at'`)).rows[0];
  check('E1: purged_at is ONE nullable timestamptz with no default and no NOT NULL - additive, no backfill, idempotent (the page_settings / page_links recipe)',
    col && col.data_type === 'timestamp with time zone' && col.is_nullable === 'YES' && col.column_default === null, JSON.stringify(col));

  const newRouter = (await bundle('sync.ts', editSync(SYNC), 'sync-edited.cjs')).syncRouter;
  const handler = (router) => router.stack.find((l) => l.route && l.route.path === '/sync' && l.route.methods.post).route.stack.slice(-1)[0].handle;
  const sync = (userId, body) => new Promise((res, rej) => handler(newRouter)({ session: { userId }, body }, { json: res }, rej));
  const { rows: [{ id: USER }] } = await admin.query(`insert into users (email, pass_hash) values ('a@b.c', 'x') returning id`);
  const { rows: [{ id: OTHER }] } = await admin.query(`insert into users (email, pass_hash) values ('o@b.c', 'x') returning id`);
  const iso = (t) => new Date(t).toISOString();
  const t0 = Date.now();
  const rich = (id, over = {}) => ({ id, text: 'SECRET WORDS', createdAt: iso(t0 - 9e5), updatedAt: iso(t0 - 6e5), pageType: 'manuscript',
    boxes: [{ id: 'b1', kind: 'text', text: 'SECRET CARD' }], script: { v: 1, scenes: [] }, strokes: [{ p: 1 }], tags: ['t'], tutor: { x: 1 }, pageSettings: { kind: 'normal' },
    planBoardId: 'pb', routedProjectIds: ['r1'], projectId: 'proj', origin: 'journal', starred: true, source: 'page', ...over });

  await sync(USER, { lastSyncAt: null, push: { journalEntries: [rich('P1'), rich('P2'), rich('P3')] } });
  const cursorBeforePurge = (await sync(USER, { lastSyncAt: null, push: {} })).serverTime;

  // ---- THE LIVE COLUMN LIST vs THE BLANK LIST --------------------------------------------------------
  const allCols = (await admin.query(`select column_name from information_schema.columns where table_name='journal_entries' order by ordinal_position`)).rows.map((r) => r.column_name);
  const KEEP = ['id', 'user_id', 'created_at', 'updated_at', 'deleted_at', 'purged_at', 'synced_at'];
  const payload = allCols.filter((c) => !KEEP.includes(c)).sort();
  const blanked = BLANK_SQL.map((s) => s.split('=')[0].trim()).sort();
  check('THE LEAK GUARD: the purge blanks EVERY journal_entries column that is not identity or a stamp - derived from the live schema, so a column added later (page_links, beside_links...) that the purge forgot turns this red instead of leaking content',
    JSON.stringify(payload) === JSON.stringify(blanked), JSON.stringify({ liveColumnsNotIdentityOrStamp: payload, purgeBlanks: blanked, missing: payload.filter((c) => !blanked.includes(c)), extra: blanked.filter((c) => !payload.includes(c)) }));

  // ---- E4: purge an existing row -------------------------------------------------------------------------
  const purgeAt = iso(Date.now());
  await sync(USER, { lastSyncAt: null, push: { journalEntries: [rich('P1', { purgedAt: purgeAt, updatedAt: iso(Date.now()) })] } });
  const p1 = (await admin.query(`select * from journal_entries where id = 'P1'`)).rows[0];
  const nonNullPayload = payload.filter((c) => c !== 'text' && c !== 'shelved' && p1[c] !== null);
  check('E4 blanks in place: text is empty, every other payload column is null (shelved false), and NONE of the incoming content was kept - the client pushed a FULL record and the server ignored its content',
    p1.text === '' && nonNullPayload.length === 0 && p1.shelved === false, JSON.stringify({ text: p1.text, stillSet: nonNullPayload }));
  check('...and identity and stamps are kept: id, user_id, created_at survive; purged_at and deleted_at are set (the server set deleted_at itself); synced_at moved',
    p1.id === 'P1' && p1.user_id === USER && ms(p1.created_at) === t0 - 9e5 && ms(p1.purged_at) === ms(purgeAt) && ms(p1.deleted_at) === ms(purgeAt) && ms(p1.synced_at) > ms(cursorBeforePurge),
    JSON.stringify({ purged_at: p1.purged_at, deleted_at: p1.deleted_at, synced_at: p1.synced_at, cursorBeforePurge }));

  // ---- E4: purge an id the server NEVER saw ----------------------------------------------------------------
  await sync(USER, { lastSyncAt: null, push: { journalEntries: [rich('GHOST', { purgedAt: purgeAt })] } });
  const ghost = (await admin.query(`select id, text, purged_at, deleted_at, boxes from journal_entries where id = 'GHOST'`)).rows[0];
  check('E4 inserts a tombstone for an id the server never saw (a page created and purged offline) - so a device that still holds it cannot INSERT it back later',
    !!ghost && ghost.text === '' && ghost.boxes === null && !!ghost.purged_at && !!ghost.deleted_at, JSON.stringify(ghost));
  await sync(USER, { lastSyncAt: null, push: { journalEntries: [rich('GHOST', { updatedAt: iso(Date.now() + 5e3) })] } });
  const ghost2 = (await admin.query(`select text from journal_entries where id = 'GHOST'`)).rows[0];
  check('...and a later push of that id from a device that still holds it is REFUSED (the row stays blank)', ghost2.text === '', JSON.stringify(ghost2));

  // ---- E2 + the design's checks 2 and 4: a stale holder cannot revive it; the mark is monotone ----------------
  await sync(USER, { lastSyncAt: null, push: { journalEntries: [rich('P1', { text: 'REVIVED', updatedAt: iso(Date.now() + 60e3), deletedAt: undefined })] } });
  const p1b = (await admin.query(`select text, boxes, purged_at, deleted_at, updated_at from journal_entries where id = 'P1'`)).rows[0];
  check('E2 (design checks 2 and 4): a stale device pushing the WHOLE record with a NEWER updated_at and deleted_at cleared - a "restore" of a purged item - changes NOTHING: still blank, still purged, still deleted',
    p1b.text === '' && p1b.boxes === null && ms(p1b.purged_at) === ms(purgeAt) && !!p1b.deleted_at, JSON.stringify(p1b));
  await sync(USER, { lastSyncAt: null, push: { journalEntries: [rich('P1', { purgedAt: iso(Date.now() + 90e3), updatedAt: iso(Date.now() + 90e3) })] } });
  const p1c = (await admin.query(`select purged_at, deleted_at from journal_entries where id = 'P1'`)).rows[0];
  check('...and purging AGAIN cannot move the stamp: purged_at is monotone - the first purge time stays', ms(p1c.purged_at) === ms(purgeAt) && ms(p1c.deleted_at) === ms(purgeAt), JSON.stringify(p1c));

  // ---- the pull: an OLD cursor gets the tombstone ------------------------------------------------------------
  const pulled = await sync(USER, { lastSyncAt: cursorBeforePurge, push: {} });
  const t = pulled.pull.journalEntries.find((r) => r.id === 'P1');
  check('THE PULL (design check 1/3): a device whose cursor is older than the purge receives the tombstone - the ordinary pull, no new channel - as a record with blank content',
    !!t && t.text === '' && t.boxes === undefined && t.script === undefined, JSON.stringify({ found: !!t, text: t && t.text }));
  check('...but the CURRENT mapper does NOT carry the mark (E5 is a real edit): rowToJournalEntry drops purged_at - the client would see an ordinary blank deleted page, not a tombstone',
    t && t.purgedAt === undefined, JSON.stringify({ purgedAt: t && t.purgedAt }));
  check('...and the row it returns is a TOMBSTONE the client cannot tell from an emptied page today: deletedAt is set and nothing else says "purged"', !!t && !!t.deletedAt, JSON.stringify({ deletedAt: t && t.deletedAt }));

  // ---- ownership: one user cannot purge another's row --------------------------------------------------------
  await sync(OTHER, { lastSyncAt: null, push: { journalEntries: [rich('P2', { purgedAt: purgeAt })] } });
  const p2 = (await admin.query(`select text, purged_at, user_id from journal_entries where id = 'P2'`)).rows[0];
  check('OWNERSHIP: another user pushing a purge for an id that is not theirs changes nothing (the row keeps its content and its owner)', p2.text === 'SECRET WORDS' && p2.purged_at === null && p2.user_id === USER, JSON.stringify(p2));

  // ---- the untouched ordinary path -----------------------------------------------------------------------------
  await sync(USER, { lastSyncAt: null, push: { journalEntries: [rich('P3', { text: 'edited', updatedAt: iso(Date.now() + 1000) })] } });
  const p3 = (await admin.query(`select text, purged_at from journal_entries where id = 'P3'`)).rows[0];
  check('CONTROL: an ordinary edit to a page that was never purged still lands (E2 only freezes purged rows)', p3.text === 'edited' && p3.purged_at === null, JSON.stringify(p3));
  check('NOTHING was swallowed: no "[sync] ... failed" was logged by any of the above', swallowed.length === 0, JSON.stringify(swallowed));

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
