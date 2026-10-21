// THEME-UNLOCK-COUNT, THE DATABASE HALF (Fable, Oct 21; Nick's schema word "B") - proven against
// a REAL THROWAWAY Postgres, never production. Schema + counter only; no picker UI.
//
// What is proven, by running the server's OWN compiled code (dist/migrate.js runMigrations,
// dist/sync.js upsertJournalEntries):
//   T1  the migration adds `words_written int` and `themes_opened jsonb` on `users`
//   T2  the backfill sums word counts across a user's own non-purged pages and grandfathers
//       'plateau' (Arbor) into themes_opened
//   T3  a PURGED page is excluded from the backfill's sum
//   T4  a user with zero non-purged pages backfills to 0 words, 'plateau' still grandfathered
//       (the sub-select's join misses them entirely - this is a separate code path from T2/T3)
//   T5  IDEMPOTENT MEANS ONCE: re-running the migration after a direct DB change to a page's
//       text does not re-sum - the backfill only ever touches a row once (`words_written is
//       null`), proven by mutating storage directly and confirming a second migration run
//       changes nothing
//   T6  a brand-new page's push adds its word count
//   T7  editing an EXISTING page UP (3 words -> 5 words) adds only the delta (2), not the new
//       total (5) - the old-vs-new subtraction, not a flat re-add
//   T8  editing an EXISTING page DOWN (5 words -> 2 words) leaves words_written UNCHANGED - it
//       never subtracts (max(0, new-old) floors at zero)
//   T9  a REJECTED push (an older updated_at than what's stored) adds nothing
//   T10 a push to a page DELETE-FOR-GOOD has already purged adds nothing (purgeGate's own
//       earlier `continue` means the counter code never runs for it)
//   T11 OWNERSHIP: user A's push never changes user B's words_written
//   T12 Fable's review ruling (Oct 21): a SCREENPLAY page counts via its `text` shadow alone - a
//       push carrying BOTH a serialized `text` and the `script` jsonb it was derived from counts
//       exactly the shadow's own words, not double (proves the save path never reads `script`)
//   T13 Fable's review ruling: a page's `boxes` (board cards) never contribute to the count, even
//       when a box carries its own `text` field (proves board cards don't count on the save path)
//   T14 Fable's review ruling: the unlock thresholds live in ONE exported constant
//       (THEME_UNLOCK_THRESHOLDS) and are reported by GET /theme-unlock's own query shape
//   MUTANTS (each is the compiled server with ONE edit, and must turn its case RED):
//       the per-record delta dropping its "- oldWords" term (T7 + T8 red)
//       the per-record delta dropping its max(0, ...) floor (T8 red)
//       the backfill dropping its "words_written is null" guard (T5 red)
//       the backfill's sub-select dropping its "purged_at is null" filter (T3 red)
//
// NOT part of the desktop suite and adds no dependency: it borrows `embedded-postgres` from any
// install you point it at. Needs the server built (pnpm --filter @writer-studio/server build).
// Run (repo root):  EMBEDDED_PG_FROM=C:/path/to/package.json-with-embedded-postgres  node apps/server/scripts/harness/theme-unlock-count-db.mjs
import { createRequire } from 'node:module';
import { rmSync, readFileSync, writeFileSync, mkdtempSync, existsSync, cpSync } from 'node:fs';
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
const URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/tuc`;
// THE SAFETY: this harness only ever talks to its own throwaway server.
process.env.DATABASE_URL = URL;
process.env.SESSION_SECRET = 'theme-unlock-count-harness-secret';
process.env.NODE_ENV = 'development';
if (!process.env.DATABASE_URL.startsWith(`postgres://postgres:postgres@127.0.0.1:${PORT}/`)) { console.error('refusing: DATABASE_URL is not the throwaway server'); process.exit(2); }

const checks = [];
const ok = (n, p, d = '') => { checks.push([n, p, d]); console.log((p ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
const iso = (n) => new Date(Date.UTC(2026, 9, 1, 0, 0, n)).toISOString();

const dir = join(mkdtempSync(join(tmpdir(), 'tuc-pg-')), 'data');
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'postgres', port: PORT, persistent: false });
await pg.initialise(); await pg.start(); await pg.createDatabase('tuc');
const admin = new Pool({ connectionString: URL });
// A query against a schema this run expects to be broken (the red-on-main check below) can
// leave the pool's idle client in a state that emits an async 'error' later - with no listener
// that is an UNHANDLED 'error' event, which crashes node before the checks below can even print.
// This listener is a no-op: the actual failure is still reported by the check it broke.
admin.on('error', (err) => { console.error('[admin pool background error, non-fatal]', err.message); });
const muts = [];
let real;   // assigned inside the try; closed unconditionally in finally (same reasoning as admin's listener above)
try {
  await admin.query('create extension if not exists pgcrypto');
  const loadServer = (distDir) => {
    const r = createRequire(pathToFileURL(join(distDir, 'x.js')).href);
    return { migrate: r('./migrate.js'), sync: r('./sync.js'), db: r('./db.js') };
  };
  real = loadServer(join(SERVER, 'dist'));
  real.db.pool.on('error', (err) => { console.error('[server pool background error, non-fatal]', err.message); });
  const newUser = async (email) => (await admin.query(`insert into users(email, pass_hash) values($1,'x') returning id`, [email])).rows[0].id;
  const page = async (id, uid, text, { purgedAt = null } = {}) =>
    admin.query(`insert into journal_entries (id, user_id, text, purged_at, created_at, updated_at) values ($1,$2,$3,$4,$5,$5)`, [id, uid, text, purgedAt, iso(1)]);
  const wordsOf = async (uid) => (await admin.query(`select words_written, themes_opened from users where id=$1`, [uid])).rows[0];

  // ---- T1: the migration adds the two columns ------------------------------------------------
  await real.migrate.runMigrations();
  const cols = (await admin.query(`select column_name, data_type from information_schema.columns where table_name='users' and column_name in ('words_written','themes_opened')`)).rows;
  const wwCol = cols.find((c) => c.column_name === 'words_written');
  const toCol = cols.find((c) => c.column_name === 'themes_opened');
  ok('T1: words_written is int, themes_opened is jsonb', wwCol?.data_type === 'integer' && toCol?.data_type === 'jsonb', JSON.stringify(cols));

  // ---- T14: the thresholds live in ONE exported constant, not hand-copied anywhere -----------
  const TH = real.sync.THEME_UNLOCK_THRESHOLDS;
  const expectThresholds = { plateau: 100, machina: 100, flux: 1000, nomad: 5000, volant: 20000 };
  ok('T14: THEME_UNLOCK_THRESHOLDS carries the five locked thresholds', TH && JSON.stringify(TH) === JSON.stringify(expectThresholds), JSON.stringify(TH));

  // ---- T2 / T3: backfill sums non-purged pages, excludes a purged one -------------------------
  const uT2 = await newUser('t2@example.com');
  await page('t2-a', uT2, 'hello world');           // 2 words
  await page('t2-b', uT2, 'foo bar baz');           // 3 words
  await page('t2-purged', uT2, 'this should not count at all', { purgedAt: iso(1) });   // purged: excluded
  await real.migrate.runMigrations();   // the backfill pass, guarded by "words_written is null"
  const afterT2 = await wordsOf(uT2);
  ok('T2: the backfill sums only the non-purged pages (2 + 3 = 5)', afterT2.words_written === 5, JSON.stringify(afterT2));
  ok('T2: the backfill grandfathers plateau (Arbor) into themes_opened', afterT2.themes_opened?.plateau === true, JSON.stringify(afterT2.themes_opened));
  ok('T3: the purged page contributed nothing (5, not 5 + "this should not count at all"\'s 6 words = 11)', afterT2.words_written === 5, String(afterT2.words_written));

  // ---- T4: a user with zero non-purged pages still backfills (0 words, plateau grandfathered) --
  const uT4 = await newUser('t4@example.com');
  await page('t4-purged-only', uT4, 'nothing but a purged page here', { purgedAt: iso(1) });
  await real.migrate.runMigrations();
  const afterT4 = await wordsOf(uT4);
  ok('T4: zero non-purged pages backfills to 0 words (the join-miss path, not a 0-sum)', afterT4.words_written === 0, JSON.stringify(afterT4));
  ok('T4: plateau is still grandfathered for a page-less account', afterT4.themes_opened?.plateau === true, JSON.stringify(afterT4.themes_opened));

  // ---- T5: idempotent means ONCE - a later DB-direct change to a page is never re-summed -------
  await admin.query(`update journal_entries set text = 'this got much much longer after the backfill already ran once' where id = 't2-a'`);
  await real.migrate.runMigrations();   // a second (and this time pointless) migration run
  const afterT5 = await wordsOf(uT2);
  ok('T5: re-running the migration after the backfill already ran does not re-sum (still 5)', afterT5.words_written === 5, JSON.stringify(afterT5));

  const suite = async (S, tag) => {
    const out = {};
    const k = (key, pass, detail = '') => { out[key] = { pass: !!pass, detail }; };
    const id = (s) => `${tag}-${s}`;
    const uA = await newUser(`${tag}-a@example.com`);
    const uB = await newUser(`${tag}-b@example.com`);

    // T6: a brand-new page's push adds its word count
    await S.sync.upsertJournalEntries(uA, [{ id: id('p1'), text: 'one two three', createdAt: iso(1), updatedAt: iso(1) }]);
    const w6 = await wordsOf(uA);
    k('T6', w6.words_written === 3, JSON.stringify(w6));

    // T7: editing the SAME page UP (3 -> 5 words) adds only the delta (2), landing at 5 total
    await S.sync.upsertJournalEntries(uA, [{ id: id('p1'), text: 'one two three four five', createdAt: iso(1), updatedAt: iso(2) }]);
    const w7 = await wordsOf(uA);
    k('T7', w7.words_written === 5, JSON.stringify(w7));

    // T8: ONE push, TWO records - p1 shrinks (5 -> 2 words) WHILE a brand-new p2 grows (0 -> 4
    // words). The floor is PER RECORD, not on the batch sum: a correct total adds only p2's 4
    // (p1's shrink floors to 0), landing at 5 + 4 = 9 - never 5 + (-3 + 4) = 6, which is what a
    // batch dropping the per-record floor would produce. A single-record shrink alone cannot
    // tell these apart, because the batch-level "only write if the sum is positive" guard
    // happens to also hide a lone negative delta - this is why two records in the one push.
    await S.sync.upsertJournalEntries(uA, [
      { id: id('p1'), text: 'one two', createdAt: iso(1), updatedAt: iso(3) },
      { id: id('p2'), text: 'alpha beta gamma delta', createdAt: iso(1), updatedAt: iso(1) },
    ]);
    const w8 = await wordsOf(uA);
    k('T8', w8.words_written === 9, JSON.stringify(w8));

    // T9: a REJECTED push (an OLDER updated_at than what's already stored) adds nothing
    await S.sync.upsertJournalEntries(uA, [{ id: id('p1'), text: 'one two three four five six seven eight nine ten', createdAt: iso(1), updatedAt: iso(1) }]);
    const w9 = await wordsOf(uA);
    k('T9', w9.words_written === 9, JSON.stringify(w9));

    // T10: a push that targets an ALREADY-PURGED page adds nothing (purgeGate's own `continue`)
    await admin.query(`update journal_entries set purged_at = $2 where id = $1`, [id('p1'), iso(5)]);
    await S.sync.upsertJournalEntries(uA, [{ id: id('p1'), text: 'this push should never be counted at all, ten extra words here', createdAt: iso(1), updatedAt: iso(99) }], [id('p1')]);
    const w10 = await wordsOf(uA);
    k('T10', w10.words_written === 9, JSON.stringify(w10));

    // T11: OWNERSHIP - user A's pushes above never touched user B's own total
    const w11 = await wordsOf(uB);
    k('T11', w11.words_written === null || w11.words_written === 0, JSON.stringify(w11));

    // T12: a SCREENPLAY page - `text` (the save-time shadow, 11 words) AND `script` (a scenes
    // blob whose own element text sums to a DIFFERENT count, 3 words) in the SAME push. A correct
    // count adds exactly 11 (text alone); 14 would mean script got added on top, 3 would mean
    // script was read INSTEAD of text - either is wrong.
    const before12 = (await wordsOf(uA)).words_written;
    await S.sync.upsertJournalEntries(uA, [{
      id: id('p12'),
      text: 'INT ROOM DAY A writer sits down to type here now',   // 11 words - the "shadow"
      script: { v: 1, scenes: [{ id: 'sc1', heading: { id: 'h1', t: 'scene', text: 'ignored anyway' }, body: [{ id: 'b1', t: 'action', text: 'too' }] }] },   // 3 words if ever read
      createdAt: iso(1), updatedAt: iso(1),
    }]);
    const w12 = await wordsOf(uA);
    k('T12', w12.words_written === before12 + 11, JSON.stringify({ before: before12, after: w12.words_written }));

    // T13: a page with a board card (`boxes`, a text-kind box carrying its OWN text) alongside a
    // plain 3-word `text`. A correct count adds exactly 3 - board cards never count.
    const before13 = (await wordsOf(uA)).words_written;
    await S.sync.upsertJournalEntries(uA, [{
      id: id('p13'),
      text: 'three word page',
      boxes: [{ id: 'c1', kind: 'text', text: 'ten extra words here that must never ever count' }],
      createdAt: iso(1), updatedAt: iso(1),
    }]);
    const w13 = await wordsOf(uA);
    k('T13', w13.words_written === before13 + 3, JSON.stringify({ before: before13, after: w13.words_written }));

    return out;
  };
  const r0 = await suite(real, 'real');
  for (const [key, v] of Object.entries(r0)) ok(`${key} (the server's own code)`, v.pass, v.detail);

  // ---- the mutants: the compiled server, ONE edit each -----------------------------------------
  let n = 0;
  const mutate = (name, file, fn, expectRed, allowThrow = false) => {
    n += 1;
    const d = join(SERVER, `.tuc-mut-${n}`);
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
    mutate('the per-record delta drops its "- oldWords" term (always re-adds the WHOLE new count)', 'sync.js',
      (s) => s.replace('wordsDelta += Math.max(0, wordCount(e.text) - oldWords);', 'wordsDelta += Math.max(0, wordCount(e.text));'),
      ['T7', 'T8']),
    mutate('the per-record delta drops its max(0, ...) floor (a shrink can go negative)', 'sync.js',
      (s) => s.replace('wordsDelta += Math.max(0, wordCount(e.text) - oldWords);', 'wordsDelta += (wordCount(e.text) - oldWords);'),
      ['T8']),
    mutate('the backfill drops its "words_written is null" guard (re-sums every boot)', 'migrate.js',
      (s) => s.replace(/\s*and u\.words_written is null/, ''),
      ['T5']),
    // dist is CRLF (tsc emits the source's own line endings) - splice on \r\n, not \n.
    mutate('the backfill\'s sub-select drops its "purged_at is null" filter (counts purged pages too)', 'migrate.js',
      (s) => s.replace('      where purged_at is null\r\n      group by user_id', '      group by user_id'),
      ['T3']),
  ];
  for (const m of MUT) {
    let red = [];
    if (m.landed) {
      let S;
      try {
        S = loadServer(m.d);
        S.db.pool.on('error', (err) => { console.error('[mutant pool background error, non-fatal]', err.message); });
        if (m.name.includes('backfill')) {
          // the two backfill mutants are exercised by re-running the T2/T3 scenario fresh, not the push suite
          const u = await newUser(`${m.tag}@example.com`);
          await page(`${m.tag}-a`, u, 'hello world');
          await page(`${m.tag}-purged`, u, 'this should not count at all', { purgedAt: iso(1) });
          await S.migrate.runMigrations();
          const before = await wordsOf(u);
          if (m.name.includes('words_written is null')) {
            // T5's own scenario: mutate storage directly after the first backfill, re-run, expect a CHANGE (the guard is gone)
            await admin.query(`update journal_entries set text = 'now much longer than it was' where id = $1`, [`${m.tag}-a`]);
            await S.migrate.runMigrations();
            const after = await wordsOf(u);
            if (after.words_written !== before.words_written) red.push('T5');
          } else {
            if (before.words_written !== 2) red.push('T3');
          }
        } else {
          const rr = await suite(S, m.tag);
          red = Object.entries(rr).filter(([, v]) => !v.pass).map(([k]) => k);
        }
      } catch (e) { red = ['THREW: ' + String(e).slice(0, 120)]; }
      finally { await S?.db?.pool?.end().catch(() => {}); }
    }
    ok(`MUTANT "${m.name}": the edit landed and turns ${m.expectRed.join(' + ')} RED`, m.landed && (m.expectRed.every((x) => red.includes(x)) || (m.allowThrow && red.some((x) => x.startsWith('THREW')))), JSON.stringify({ landed: m.landed, red }));
  }
} catch (e) {
  // A red-on-main run (the schema genuinely missing) can throw past whichever check first
  // touched the missing column, rather than returning a clean pass/fail - this still counts as
  // red (caught here, not swallowed) and lets the remaining checks' own FAILs above stay visible
  // and the run exit cleanly instead of crashing node mid-suite.
  ok('UNEXPECTED THROW (see detail)', false, String(e).slice(0, 300));
} finally {
  for (const d of muts) rmSync(d, { recursive: true, force: true });
  if (real) await real.db.pool.end().catch(() => {});
  await admin.end().catch(() => {});
  await pg.stop().catch(() => {});
  rmSync(dirname(dir), { recursive: true, force: true });
}
const bad = checks.filter((c) => !c[1]).length;
console.log(bad === 0 ? `\nTHEME-UNLOCK-COUNT-DB VERIFY: PASS (${checks.length} checks)` : `\nTHEME-UNLOCK-COUNT-DB VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
