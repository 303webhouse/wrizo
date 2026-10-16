// PAGE LINKS, THE DATABASE HALF (connector-b; plan approved by Fable Oct 14) - proven against a REAL THROWAWAY Postgres, never production.
//
// What is proven (the plan's section 7), by running the server's OWN compiled code (dist/migrate.js runMigrations, dist/sync.js upsertJournalEntries + rowToJournalEntry):
//   D1 the migration is idempotent (run twice: nothing changes) and the column is jsonb with default '[]'
//   D2 an EXISTING row (one that predates the column) reads back as no links after the migration - metadata-only default, no backfill
//   D3 an entry's pageLinks round-trip: push -> stored jsonb -> pull mapper -> the same records
//   D4 THE OLD-CLIENT GUARD: an OLD-SHAPE upsert - a record with NO pageLinks key at all, byte-for-byte what today's client sends - against a row that already holds links leaves the links INTACT (and still applies the edit)
//   D5 a NEW client's push of [] CLEARS the links; D6 a push WITH links replaces them whole; D7 an OLDER updated_at write is ignored (last-writer-wins)
//   D8 an entry that never had links reads back with NO pageLinks key (never [] or null); D9 a brand-new entry pushed without the field is stored without links and reads the same
//   MUTANTS (each is the compiled server with ONE edit, and must turn its case RED): the plain "page_links = excluded.page_links" (D4 red), a dropped parameter (D3 red), a dropped mapper (D3 red)
//
// NOT part of the desktop suite and adds no dependency: it borrows `embedded-postgres` from any install you point it at. Needs the server built (pnpm --filter @writer-studio/server build).
// Run (repo root):  EMBEDDED_PG_FROM=C:/path/to/package.json-with-embedded-postgres  node apps/server/scripts/harness/page-links-db.mjs
import { createRequire } from 'node:module';
import { rmSync, readFileSync, writeFileSync, mkdtempSync, existsSync, cpSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import net from 'node:net';

if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const SERVER = join(here, '..', '..');
if (!existsSync(join(SERVER, 'dist', 'sync.js'))) { console.error('Build the server first: pnpm --filter @writer-studio/server build'); process.exit(2); }
const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const reqSrv = createRequire(pathToFileURL(join(SERVER, 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg');

// a FREE port, chosen by the OS - never a fixed one (another lane's scratch Postgres may be on the box)
const PORT = await new Promise((res, rej) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); s.on('error', rej); });
const URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/plinks`;
// THE SAFETY: this harness only ever talks to its own throwaway server. The server's env.ts reads DATABASE_URL at import; set it here, BEFORE anything is required, and refuse any other host.
process.env.DATABASE_URL = URL;
process.env.SESSION_SECRET = 'page-links-harness-secret';
process.env.NODE_ENV = 'development';
if (!process.env.DATABASE_URL.startsWith(`postgres://postgres:postgres@127.0.0.1:${PORT}/`)) { console.error('refusing: DATABASE_URL is not the throwaway server'); process.exit(2); }

const checks = [];
const ok = (n, p, d = '') => { checks.push([n, p, d]); console.log((p ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
// jsonb stores object keys in its own order, so records are compared by VALUE
const canon = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));
const iso = (n) => new Date(Date.UTC(2026, 9, 1, 0, 0, n)).toISOString();

const dir = join(mkdtempSync(join(tmpdir(), 'plinks-pg-')), 'data');
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'postgres', port: PORT, persistent: false });
await pg.initialise(); await pg.start(); await pg.createDatabase('plinks');
const admin = new Pool({ connectionString: URL });
const muts = [];
try {
  await admin.query('create extension if not exists pgcrypto');
  // load the server's compiled code from a directory (the real dist, or a copy with ONE edit)
  const loadServer = (distDir) => {
    const r = createRequire(pathToFileURL(join(distDir, 'x.js')).href);
    return { migrate: r('./migrate.js'), sync: r('./sync.js'), db: r('./db.js') };
  };
  const real = loadServer(join(SERVER, 'dist'));

  // ---- D2 first: a row that predates the column
  await real.migrate.runMigrations();
  await admin.query('alter table journal_entries drop column page_links');
  const uid = (await admin.query(`insert into users(email, pass_hash) values('nick@example.com','x') returning id`)).rows[0].id;
  await admin.query(`insert into journal_entries (id, user_id, text, created_at, updated_at) values ('old-row', $1, 'predates the column', $2, $2)`, [uid, iso(1)]);
  await real.migrate.runMigrations();       // adds the column back (and is the second run of the migration)
  const col = (await admin.query(`select data_type, column_default from information_schema.columns where table_name='journal_entries' and column_name='page_links'`)).rows[0];
  const oldRow = (await admin.query(`select page_links from journal_entries where id='old-row'`)).rows[0];
  ok('D1: the column is jsonb with default \'[]\'', col && col.data_type === 'jsonb' && /\[\]/.test(col.column_default || ''), JSON.stringify(col));
  ok('D2: an EXISTING row (one that predates the column) reads back as an empty array after the migration - metadata-only default, no backfill', Array.isArray(oldRow.page_links) && oldRow.page_links.length === 0 && real.sync.rowToJournalEntry((await admin.query(`select * from journal_entries where id='old-row'`)).rows[0]).pageLinks === undefined, JSON.stringify(oldRow));
  await real.migrate.runMigrations();       // a third run
  const cols = (await admin.query(`select count(*)::int n from information_schema.columns where table_name='journal_entries' and column_name='page_links'`)).rows[0].n;
  ok('D1: running the migration again changes nothing (idempotent): exactly one page_links column', cols === 1, String(cols));

  const LINKS = [{ id: 'L1', aEntryId: 'e1', aBoxId: 'c1', bEntryId: 'p1', createdAt: iso(2), updatedAt: iso(2) }, { id: 'L2', aEntryId: 'e1', aBoxId: 'c2', bEntryId: 'p2', createdAt: iso(3), updatedAt: iso(3), deletedAt: iso(4) }];
  const row = (id) => admin.query('select * from journal_entries where id=$1', [id]).then((r) => r.rows[0]);
  const rec = (id, o = {}) => ({ id, text: 'x', createdAt: iso(1), updatedAt: iso(10), ...o });
  const suite = async (S, tag) => {
    const out = {};
    const k = (key, pass, detail = '') => { out[key] = { pass: !!pass, detail }; };
    const id = (s) => `${tag}-${s}`;
    // D3 round trip
    await S.sync.upsertJournalEntries(uid, [rec(id('e1'), { pageLinks: LINKS })]);
    const back = S.sync.rowToJournalEntry(await row(id('e1')));
    k('D3', canon(back.pageLinks) === canon(LINKS), canon(back.pageLinks));
    // D4 OLD-SHAPE upsert (no pageLinks key at all), newer updated_at, edited text
    const oldShape = rec(id('e1'), { text: 'edited by an OLD client', updatedAt: iso(20) });
    if ('pageLinks' in oldShape) throw new Error('fixture: the old-shape record must have NO pageLinks key');
    await S.sync.upsertJournalEntries(uid, [oldShape]);
    const after4 = await row(id('e1'));
    k('D4', after4.text === 'edited by an OLD client' && canon(after4.page_links) === canon(LINKS), canon({ text: after4.text, links: after4.page_links }));
    // D5 new client clears with []
    await S.sync.upsertJournalEntries(uid, [rec(id('e1'), { updatedAt: iso(30), pageLinks: [] })]);
    const after5 = await row(id('e1'));
    k('D5', Array.isArray(after5.page_links) && after5.page_links.length === 0 && S.sync.rowToJournalEntry(after5).pageLinks === undefined, JSON.stringify(after5.page_links));
    // D6 a push WITH links replaces
    await S.sync.upsertJournalEntries(uid, [rec(id('e1'), { updatedAt: iso(40), pageLinks: [LINKS[0]] })]);
    const after6 = await row(id('e1'));
    k('D6', canon(after6.page_links) === canon([LINKS[0]]), canon(after6.page_links));
    // D7 an OLDER updated_at is ignored
    await S.sync.upsertJournalEntries(uid, [rec(id('e1'), { updatedAt: iso(5), pageLinks: LINKS, text: 'stale' })]);
    const after7 = await row(id('e1'));
    k('D7', canon(after7.page_links) === canon([LINKS[0]]) && after7.text === 'x', canon({ text: after7.text }));   // D6's push set the text to 'x'; the STALE write ('stale', older updated_at) changed neither
    // D8 / D9 an entry that never had links
    await S.sync.upsertJournalEntries(uid, [rec(id('plain'))]);
    const plain = S.sync.rowToJournalEntry(await row(id('plain')));
    k('D8', plain.pageLinks === undefined && !('pageLinks' in JSON.parse(JSON.stringify(plain))), String(plain.pageLinks));
    await S.sync.upsertJournalEntries(uid, [rec(id('plain'), { text: 'second push', updatedAt: iso(50) })]);
    const plain2 = await row(id('plain'));
    k('D9', plain2.text === 'second push' && S.sync.rowToJournalEntry(plain2).pageLinks === undefined, JSON.stringify(plain2.page_links));
    return out;
  };
  const r0 = await suite(real, 'real');
  for (const [key, v] of Object.entries(r0)) ok(`${key} (the server's own code)`, v.pass, v.detail);

  // ---- the mutants: the compiled server, ONE edit each
  let n = 0;
  const mutate = (name, file, fn, expectRed, allowThrow = false) => {
    n += 1;
    const d = join(SERVER, `.page-links-mut-${n}`);
    muts.push(d);
    rmSync(d, { recursive: true, force: true });
    cpSync(join(SERVER, 'dist'), d, { recursive: true });
    const p = join(d, file);
    const src = readFileSync(p, 'utf8');
    const out = fn(src);
    writeFileSync(p, out);
    return { name, d, landed: out !== src, expectRed, tag: `m${n}`, allowThrow };
  };
  const MUT = [
    mutate('the guard is the plain "page_links = excluded.page_links"', 'sync.js', (s) => s.replace(/page_links = case[\s\S]*?end,/, 'page_links = excluded.page_links,'), ['D4']),
    mutate('the parameter is dropped (the field never reaches the row: the bind fails or the links are lost)', 'sync.js', (s) => s.replace(', JSON.stringify(e.pageLinks ?? null)]', ']'), ['D3'], true),
    mutate('the read mapper is dropped (the field never comes back)', 'sync.js', (s) => s.replace(/pageLinks: Array\.isArray\(r\.page_links\)[^\n]*\n/, ''), ['D3']),
  ];
  for (const m of MUT) {
    let red = [];
    if (m.landed) {
      try { const S = loadServer(m.d); const rr = await suite(S, m.tag); red = Object.entries(rr).filter(([, v]) => !v.pass).map(([k]) => k); await S.db.pool.end(); }
      catch (e) { red = ['THREW: ' + String(e).slice(0, 120)]; }
    }
    ok(`MUTANT "${m.name}": the edit landed and turns ${m.expectRed.join(' + ')} RED`, m.landed && (m.expectRed.every((x) => red.includes(x)) || (m.allowThrow && red.some((x) => x.startsWith('THREW')))), JSON.stringify({ landed: m.landed, red }));
  }
  await real.db.pool.end();
} finally {
  for (const d of muts) rmSync(d, { recursive: true, force: true });
  await admin.end().catch(() => {});
  await pg.stop().catch(() => {});
  rmSync(dirname(dir), { recursive: true, force: true });
}
const bad = checks.filter((c) => !c[1]).length;
console.log(bad === 0 ? `\nPAGE-LINKS-DB VERIFY: PASS (${checks.length} checks)` : `\nPAGE-LINKS-DB VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
