// THE TUTOR COLUMN'S GUARD, THE DATABASE HALF (Fable, Nov 21, 4:58 pm; reorg-plan-v2 section 5: "the `tutor` column on `projects` has no guard: a device on an older build that re-saves a project could blank its
// Consultant thread ... Same fix: send SQL NULL when absent, and `coalesce`"; proved here as INK proved the Doc column's) - against a REAL THROWAWAY Postgres, never production, by running the server's OWN compiled code
// (dist/migrate.js runMigrations, dist/sync.js upsertProjects).
//   T1 THE OLD-DEVICE GUARD: an upsert of a project with NO `tutor` key at all (what a build before TU5 sends), newer updated_at, against a row that already holds a Consultant thread, applies the edit (the title) and
//      leaves the thread INTACT
//   T2 a push WITH a thread replaces the stored one whole
//   T3 a thread the writer emptied ({ v: 1, facts: [] }, what the app writes - it never sends null) CLEARS the stored one: a real clear still wins
//   T4 a project that never had a thread is stored with SQL NULL (not the JSON null 'null'): the absent case sends a TRUE null
//   T5 an OLDER updated_at is ignored (last-writer-wins stands)
//   MUTANTS (the compiled server with ONE edit each): the plain `tutor = excluded.tutor` (T1 red), the coalesce kept but the absent case sent as the string 'null' via JSON.stringify(p.tutor ?? null) (T1 and T4 red), the column's update dropped (T2 red)
//
// NOT part of the desktop suite and adds no dependency: it borrows `embedded-postgres` from any install you point it at. Needs the server built (tsc -p apps/server).
// Run (repo root):  EMBEDDED_PG_FROM=C:/path/to/package.json-with-embedded-postgres  node apps/server/scripts/harness/tutor-guard-db.mjs
import { createRequire } from 'node:module';
import { rmSync, readFileSync, writeFileSync, mkdtempSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import net from 'node:net';

if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const SERVER = join(here, '..', '..');
if (!existsSync(join(SERVER, 'dist', 'sync.js'))) { console.error('Build the server first: tsc -p apps/server'); process.exit(2); }
const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const reqSrv = createRequire(pathToFileURL(join(SERVER, 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg');

// a FREE port, chosen by the OS - never a fixed one (another lane's scratch Postgres may be on the box)
const PORT = await new Promise((res, rej) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); s.on('error', rej); });
const URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/tguard`;
// THE SAFETY: this harness only ever talks to its own throwaway server. The server's env.ts reads DATABASE_URL at import; set it here, BEFORE anything is required, and refuse any other host.
process.env.DATABASE_URL = URL;
process.env.SESSION_SECRET = 'tutor-guard-harness-secret';
process.env.NODE_ENV = 'development';
if (!process.env.DATABASE_URL.startsWith(`postgres://postgres:postgres@127.0.0.1:${PORT}/`)) { console.error('refusing: DATABASE_URL is not the throwaway server'); process.exit(2); }

const checks = [];
const ok = (n, p, d = '') => { checks.push([n, p, d]); console.log((p ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
// jsonb stores object keys in its own order, so records are compared by VALUE
const canon = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));
const iso = (n) => new Date(Date.UTC(2026, 9, 1, 0, 0, n)).toISOString();

const dir = join(mkdtempSync(join(tmpdir(), 'tguard-pg-')), 'data');
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'postgres', port: PORT, persistent: false });
await pg.initialise(); await pg.start(); await pg.createDatabase('tguard');
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

  await real.migrate.runMigrations();
  const uid = (await admin.query(`insert into users(email, pass_hash) values('nick@example.com','x') returning id`)).rows[0].id;
  const row = (id) => admin.query('select * from projects where id=$1', [id]).then((r) => r.rows[0]);
  const THREAD = { v: 1, facts: [{ id: 'f1', text: 'The harbour is in the north.', createdAt: iso(2), updatedAt: iso(2) }], messages: [{ id: 'm1', role: 'user', text: 'Who is she?' }] };
  const rec = (id, o = {}) => ({ id, title: 'A project', type: 'creative', createdAt: iso(1), updatedAt: iso(10), ...o });
  const suite = async (S, tag) => {
    const out = {};
    const k = (key, pass, detail = '') => { out[key] = { pass: !!pass, detail }; };
    const id = (s) => `${tag}-${s}`;
    if (typeof S.sync.upsertProjects !== 'function') { for (const x of ['T1', 'T2', 'T3', 'T4', 'T5']) k(x, false, 'sync.upsertProjects is not exported'); return out; }
    // T2 first: a push with a thread stores it (and is the fixture for T1)
    await S.sync.upsertProjects(uid, [rec(id('p1'), { tutor: THREAD })]);
    const a2 = await row(id('p1'));
    k('T2', canon(a2.tutor) === canon(THREAD), canon(a2.tutor));
    // T1 an OLD-SHAPE push: NO tutor key at all, newer updated_at, an edited title
    const oldShape = rec(id('p1'), { title: 'Edited by an OLD device', updatedAt: iso(20) });
    if ('tutor' in oldShape) throw new Error('fixture: the old-shape record must have NO tutor key');
    await S.sync.upsertProjects(uid, [oldShape]);
    const a1 = await row(id('p1'));
    k('T1', a1.title === 'Edited by an OLD device' && canon(a1.tutor) === canon(THREAD), canon({ title: a1.title, tutor: a1.tutor }));
    // T3 a thread the writer emptied is a real clear
    const EMPTY = { v: 1, facts: [] };
    await S.sync.upsertProjects(uid, [rec(id('p1'), { updatedAt: iso(30), tutor: EMPTY })]);
    const a3 = await row(id('p1'));
    k('T3', canon(a3.tutor) === canon(EMPTY), canon(a3.tutor));
    // T4 a project that never had a thread: SQL NULL, not the JSON null
    await S.sync.upsertProjects(uid, [rec(id('plain'))]);
    const a4 = await admin.query('select tutor is null as sql_null, tutor::text as txt from projects where id=$1', [id('plain')]).then((r) => r.rows[0]);
    k('T4', a4.sql_null === true, JSON.stringify(a4));
    // T5 an OLDER updated_at is ignored
    await S.sync.upsertProjects(uid, [rec(id('p1'), { updatedAt: iso(5), title: 'stale', tutor: THREAD })]);
    const a5 = await row(id('p1'));
    k('T5', a5.title === 'A project' && canon(a5.tutor) === canon(EMPTY), canon({ title: a5.title, tutor: a5.tutor }));   // T3's push set the title back to 'A project'; the STALE write changed neither field
    return out;
  };
  const r0 = await suite(real, 'real');
  for (const [key, v] of Object.entries(r0)) ok(`${key} (the server's own code)`, v.pass, v.detail);

  // ---- the mutants: the compiled server, ONE edit each
  let n = 0;
  const mutate = (name, file, fn, expectRed) => {
    n += 1;
    const d = join(SERVER, `.tutor-guard-mut-${n}`);
    muts.push(d);
    rmSync(d, { recursive: true, force: true });
    cpSync(join(SERVER, 'dist'), d, { recursive: true });
    const p = join(d, file);
    const src = readFileSync(p, 'utf8');
    const out = fn(src);
    writeFileSync(p, out);
    return { name, d, landed: out !== src, expectRed, tag: `m${n}` };
  };
  const MUT = [
    mutate('the guard is the plain "tutor = excluded.tutor"', 'sync.js', (s) => s.replace('tutor = coalesce(excluded.tutor, projects.tutor),', 'tutor = excluded.tutor,'), ['T1']),
    mutate("the absent case is sent as the string 'null' (JSON.stringify(p.tutor ?? null)), which ::jsonb makes a JSON null that coalesce keeps", 'sync.js', (s) => s.replace('p.tutor == null ? null : JSON.stringify(p.tutor)', 'JSON.stringify(p.tutor ?? null)'), ['T1', 'T4']),
    mutate("the column's update on conflict is dropped", 'sync.js', (s) => s.replace('tutor = coalesce(excluded.tutor, projects.tutor),', ''), ['T3']),
  ];
  for (const m of MUT) {
    let red = [];
    if (m.landed) {
      try { const S = loadServer(m.d); const rr = await suite(S, m.tag); red = Object.entries(rr).filter(([, v]) => !v.pass).map(([k2]) => k2); await S.db.pool.end(); }
      catch (e) { red = ['THREW: ' + String(e).slice(0, 120)]; }
    }
    ok(`MUTANT "${m.name}": the edit landed and turns ${m.expectRed.join(' + ')} RED`, m.landed && m.expectRed.every((x) => red.includes(x)), JSON.stringify({ landed: m.landed, red }));
  }
  await real.db.pool.end();
} finally {
  for (const d of muts) rmSync(d, { recursive: true, force: true });
  await admin.end().catch(() => {});
  await pg.stop().catch(() => {});
  rmSync(dirname(dir), { recursive: true, force: true });
}
const bad = checks.filter((c) => !c[1]).length;
console.log(bad === 0 ? `\nTUTOR-GUARD-DB VERIFY: PASS (${checks.length} checks)` : `\nTUTOR-GUARD-DB VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
