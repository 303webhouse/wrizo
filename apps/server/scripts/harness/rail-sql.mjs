// THE RAIL'S SQL (reorg-rail-saved; Fable, Nov 18, 3:50 pm: "close the SQL gap before the train, without a workflow change"), proven against a
// REAL throwaway Postgres by running the server's OWN compiled code: dist/migrate.js runMigrations, dist/railRoutes.js sqlRailStore and
// purgeRailDrawer. The browserless check (apps/desktop/scripts/harness/writing-audit/reorg-rail-saved.mjs) proves the rules over an in-memory
// store; this file proves the store keeps the contract those rules rely on.
//
//   S1  the migration runs twice cleanly on an OLD-SHAPE database (users without rail, no box_pictures, a writer already there): rail is a
//       nullable jsonb with no default and her row reads null; box_pictures exists with its key (user_id, drawer_id); a second run changes nothing
//   S2  compare-and-swap: a null base writes over a null stored value; two writers on one base - one wins, the other gets false and changes
//       nothing; jsonb equality is by value (a base whose keys arrive in another order still matches); a stale null base is refused; a clear
//       stores SQL NULL, not a jsonb null
//   S3  purgeRailDrawer strips exactly that Project's pin and box (her other Projects, the Notebook and the view untouched), deletes exactly
//       its picture row, and touches no other account (the same drawer id under another writer keeps everything)
//   S4  putPicture with an older picked_at never overwrites a newer one (and says 'older'); a newer one replaces it; the bytes come back
//       byte for byte; deletePictureIfOlder spares a newer picture and deletes an older one
//   MUTANTS (the compiled server with ONE edit each, every one must turn its case RED): the rail column without "if not exists" (S1),
//   the CAS clause dropped (S2), the purge keeping the box (S3), the purge deleting every picture of the account (S3), putPicture without its
//   picked_at guard (S4), deletePictureIfOlder without its picked_at guard (S4).
//
// NOT part of the desktop suite and adds no dependency: it borrows `embedded-postgres` from any install you point it at (smoke-account-db.mjs's
// pattern). Never the production database: DATABASE_URL is set here to the throwaway server before any server code loads, and any other host is
// refused. Nothing printed carries an address.
// Needs the server built (pnpm --filter @writer-studio/server build). Run (repo root):
//   EMBEDDED_PG_FROM=C:/path/to/package.json-with-embedded-postgres  node apps/server/scripts/harness/rail-sql.mjs
import { createRequire } from 'node:module';
import { rmSync, readFileSync, writeFileSync, mkdtempSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import net from 'node:net';

if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const SERVER = join(here, '..', '..');
if (!existsSync(join(SERVER, 'dist', 'railRoutes.js'))) { console.error('Build the server first: pnpm --filter @writer-studio/server build'); process.exit(2); }
const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const reqSrv = createRequire(pathToFileURL(join(SERVER, 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg');

// a FREE port, chosen by the OS - never a fixed one (another lane's scratch Postgres may be on the box)
const PORT = await new Promise((res, rej) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); s.on('error', rej); });
const BASE = `postgres://postgres:postgres@127.0.0.1:${PORT}/`;
const urlOf = (db) => `${BASE}${db}`;
// THE SAFETY: the server's env.ts and db.js read DATABASE_URL when they load; every load below sets it to a throwaway database first
const pointAt = (db) => {
  process.env.DATABASE_URL = urlOf(db);
  if (!process.env.DATABASE_URL.startsWith(`postgres://postgres:postgres@127.0.0.1:${PORT}/`)) { console.error('refusing: DATABASE_URL is not the throwaway server'); process.exit(2); }
};
process.env.SESSION_SECRET = 'rail-sql-harness-secret';
process.env.NODE_ENV = 'development';

const checks = [];
const ok = (n, p, d = '') => { checks.push([n, p, d]); console.log((p ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
// jsonb stores object keys in its own order, so records are compared by VALUE
const canon = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));
const iso = (n) => new Date(Date.UTC(2026, 10, 18, 12, 0, n)).toISOString();

const dir = join(mkdtempSync(join(tmpdir(), 'rail-sql-pg-')), 'data');
// the database server's own log names where it listens: nothing of an address is printed (Fable: "no address in any output") - its lines go
// through this filter, which drops any line naming a host, a port or a connection string
const quiet = (m) => { const s = String(m); if (/127\.0\.0\.1|localhost|port \d|postgres:\/\/|::1/i.test(s)) return; process.stdout.write(s.endsWith('\n') ? s : s + '\n'); };
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'postgres', port: PORT, persistent: false, onLog: quiet, onError: quiet });
await pg.initialise(); await pg.start();
const muts = [];
const pools = [];
let dbCount = 0;
try {
  // load the server's compiled code from a directory (the real dist, or a copy with ONE edit), bound to a fresh database of its own
  const loadServer = async (distDir) => {
    dbCount += 1;
    const db = `rail${dbCount}`;
    await pg.createDatabase(db);
    pointAt(db);
    const r = createRequire(pathToFileURL(join(distDir, 'x.js')).href);
    const S = { migrate: r('./migrate.js'), routes: r('./railRoutes.js'), db: r('./db.js') };
    const admin = new Pool({ connectionString: urlOf(db) });
    pools.push(admin, S.db.pool);
    return { ...S, admin };
  };

  // the four cases; each returns { key: { pass, detail } }
  async function suite(S) {
    const out = {};
    const k = (key, pass, detail = '') => { out[key] = { pass: !!pass, detail }; };
    const { admin } = S;
    const store = S.routes.sqlRailStore;

    // ---- S1: an old-shape database, then the migration twice
    try {
      await admin.query('create extension if not exists pgcrypto');
      await S.migrate.runMigrations();
      await admin.query('drop table if exists box_pictures');
      await admin.query('alter table users drop column if exists rail');   // the shape today's production has
      const old = (await admin.query(`insert into users(email, pass_hash) values('old@example.com','x') returning id`)).rows[0].id;
      await S.migrate.runMigrations();
      await S.migrate.runMigrations();
      const col = (await admin.query(`select data_type, is_nullable, column_default from information_schema.columns where table_name='users' and column_name='rail'`)).rows;
      const her = (await admin.query('select rail from users where id=$1', [old])).rows[0];
      const pk = (await admin.query(`select a.attname from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey) where i.indrelid = 'box_pictures'::regclass and i.indisprimary order by a.attname`)).rows.map((x) => x.attname);
      k('S1', col.length === 1 && col[0].data_type === 'jsonb' && col[0].is_nullable === 'YES' && col[0].column_default === null && her && her.rail === null && JSON.stringify(pk) === JSON.stringify(['drawer_id', 'user_id']),
        JSON.stringify({ col, herRail: her && her.rail, pk }));
    } catch (e) { k('S1', false, 'THREW ' + String(e && e.message).slice(0, 140)); }

    const user = async (email) => (await admin.query(`insert into users(email, pass_hash) values($1,'x') returning id`, [email])).rows[0].id;
    const railOf = async (id) => (await admin.query('select rail, rail is null as sqlnull from users where id=$1', [id])).rows[0];

    // ---- S2: compare-and-swap
    try {
      const u = await user('cas@example.com');
      const A = { pins: { a: { order: 1, at: iso(1) } }, boxes: {} };
      const B = { pins: { a: { order: 1, at: iso(1) }, b: { order: 2, at: iso(2) } }, boxes: {} };
      const C = { pins: { a: { order: 1, at: iso(1) } }, boxes: { a: { letters: 'C', lettersAt: iso(3) } } };
      const first = await store.casRail(u, null, A);                     // null base over null stored
      const w1 = await store.casRail(u, A, B);                            // writer 1 on base A
      const w2 = await store.casRail(u, A, C);                            // writer 2 on the same base A
      const afterRace = (await railOf(u)).rail;
      const reordered = { boxes: {}, pins: { b: { at: iso(2), order: 2 }, a: { at: iso(1), order: 1 } } };   // B, keys in another order
      const byValue = await store.casRail(u, reordered, A);
      const staleNull = await store.casRail(u, null, C);                  // a device that last saw nothing
      const clear = await store.casRail(u, A, null);
      const cleared = await railOf(u);
      k('S2', first === true && w1 === true && w2 === false && canon(afterRace) === canon(B) && byValue === true && staleNull === false && clear === true && cleared.sqlnull === true,
        JSON.stringify({ first, w1, w2, afterRaceIsB: canon(afterRace) === canon(B), byValue, staleNull, clear, sqlNull: cleared.sqlnull }));
    } catch (e) { k('S2', false, 'THREW ' + String(e && e.message).slice(0, 140)); }

    // ---- S3: purgeRailDrawer
    try {
      const u = await user('purge@example.com');
      const other = await user('other@example.com');
      const R = { pins: { p1: { order: 1, at: iso(1) }, p2: { order: 2, at: iso(2) }, notebook: { order: 3, at: iso(3) } }, view: 'list', viewAt: iso(4),
        boxes: { p1: { letters: 'AB', lettersAt: iso(5) }, p2: { colour: '#41658A', colourAt: iso(6) } } };
      const O = { pins: { p1: { order: 1, at: iso(1) } }, boxes: { p1: { letters: 'ZZ', lettersAt: iso(1) } } };
      await store.casRail(u, null, R);
      await store.casRail(other, null, O);
      const pic = (n) => ({ sha: 'sha' + n, mime: 'image/webp', bytes: new Uint8Array([82, 73, 70, 70, n]), pickedAt: iso(n) });
      await store.putPicture(u, 'p1', pic(1)); await store.putPicture(u, 'p2', pic(2)); await store.putPicture(other, 'p1', pic(3));
      await S.routes.purgeRailDrawer(u, 'p1');
      const mine = (await railOf(u)).rail;
      const theirs = (await railOf(other)).rail;
      const pics = (await admin.query('select user_id = $1 as mine, drawer_id from box_pictures order by drawer_id, mine', [u])).rows.map((x) => `${x.mine ? 'mine' : 'other'}:${x.drawer_id}`);
      const want = { pins: { p2: R.pins.p2, notebook: R.pins.notebook }, view: 'list', viewAt: iso(4), boxes: { p2: R.boxes.p2 } };
      k('S3', canon(mine) === canon(want) && canon(theirs) === canon(O) && JSON.stringify(pics.sort()) === JSON.stringify(['mine:p2', 'other:p1']),
        JSON.stringify({ mineOk: canon(mine) === canon(want), theirsOk: canon(theirs) === canon(O), pics, mine }));
    } catch (e) { k('S3', false, 'THREW ' + String(e && e.message).slice(0, 140)); }

    // ---- S4: putPicture and deletePictureIfOlder against picked_at
    try {
      const u = await user('pics@example.com');
      const pic = (n, at) => ({ sha: 'sha' + n, mime: 'image/png', bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, n, 255, 0]), pickedAt: at });
      const r1 = await store.putPicture(u, 'd', pic(1, iso(20)));
      const r2 = await store.putPicture(u, 'd', pic(2, iso(10)));           // OLDER: must not win
      const afterOlder = await store.getPicture(u, 'd');
      const r3 = await store.putPicture(u, 'd', pic(3, iso(30)));           // newer: wins
      const afterNewer = await store.getPicture(u, 'd');
      await store.deletePictureIfOlder(u, 'd', iso(25));                    // a removal OLDER than the stored picture: spared
      const spared = await store.getPicture(u, 'd');
      await store.deletePictureIfOlder(u, 'd', iso(40));                    // a later removal: deleted
      const gone = await store.getPicture(u, 'd');
      const bytesBack = afterNewer && Buffer.from(afterNewer.bytes).equals(Buffer.from(pic(3, '').bytes));
      k('S4', r1 === 'stored' && r2 === 'older' && afterOlder && afterOlder.sha === 'sha1' && r3 === 'stored' && afterNewer.sha === 'sha3' && bytesBack && spared && spared.sha === 'sha3' && gone === null,
        JSON.stringify({ r1, r2, afterOlder: afterOlder && afterOlder.sha, r3, afterNewer: afterNewer && afterNewer.sha, bytesBack, spared: spared && spared.sha, gone: gone === null }));
    } catch (e) { k('S4', false, 'THREW ' + String(e && e.message).slice(0, 140)); }
    return out;
  }

  const real = await loadServer(join(SERVER, 'dist'));
  const r0 = await suite(real);
  for (const [key, v] of Object.entries(r0)) ok(`${key} (the server's own compiled code)`, v.pass, v.detail);

  // ---- the mutants: the compiled server, ONE edit each
  let n = 0;
  const mutate = (name, file, from, to, expectRed) => {
    n += 1;
    const d = join(SERVER, `.rail-sql-mut-${n}`);
    muts.push(d);
    rmSync(d, { recursive: true, force: true });
    cpSync(join(SERVER, 'dist'), d, { recursive: true });
    const p = join(d, file);
    const src = readFileSync(p, 'utf8');
    const count = src.split(from).length - 1;
    const out = count === 1 ? src.replace(from, to) : src;
    writeFileSync(p, out);
    return { name, d, landed: count === 1 && out !== src, expectRed };
  };
  const MUT = [
    mutate('the rail column is added WITHOUT "if not exists" (a second run must not throw)', 'migrate.js', 'alter table users add column if not exists rail jsonb', 'alter table users add column rail jsonb', ['S1']),
    mutate('the compare-and-swap clause is dropped (a blind write)', 'railRoutes.js', ' and rail is not distinct from $2::jsonb', ' and ($2::jsonb is null or true)', ['S2']),
    mutate('the purge keeps the Project\'s box', 'railRoutes.js', " #- array['boxes', $2]::text[] where id = $1", ' where id = $1', ['S3']),
    mutate('the purge deletes every picture of the account', 'railRoutes.js', 'delete from box_pictures where user_id = $1 and drawer_id = $2`', 'delete from box_pictures where user_id = $1 and $2::text is not null`', ['S3']),
    mutate('putPicture without its picked_at guard (an older picture overwrites)', 'railRoutes.js', 'where excluded.picked_at > box_pictures.picked_at', 'where true', ['S4']),
    mutate('deletePictureIfOlder without its picked_at guard (a newer picture is deleted)', 'railRoutes.js', ' and picked_at < $3::timestamptz', ' and $3::timestamptz is not null', ['S4']),
  ];
  for (const m of MUT) {
    let red = [];
    if (m.landed) {
      try { const S = await loadServer(m.d); const rr = await suite(S); red = Object.entries(rr).filter(([, v]) => !v.pass).map(([key]) => key); }
      catch (e) { red = ['THREW: ' + String(e && e.message).slice(0, 120)]; }
    }
    ok(`MUTANT "${m.name}": the edit landed and turns ${m.expectRed.join(' + ')} RED`, m.landed && m.expectRed.every((x) => red.includes(x)), JSON.stringify({ landed: m.landed, red }));
  }
} finally {
  for (const p of pools) await p.end().catch(() => {});
  for (const d of muts) rmSync(d, { recursive: true, force: true });
  await pg.stop().catch(() => {});
  rmSync(dirname(dir), { recursive: true, force: true });
}
const bad = checks.filter((c) => !c[1]).length;
console.log(bad === 0 ? `\nRAIL-SQL VERIFY: PASS (${checks.length} checks)` : `\nRAIL-SQL VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
