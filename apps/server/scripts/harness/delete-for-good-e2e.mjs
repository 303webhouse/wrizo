// DELETE FOR GOOD - THE TWO-DEVICE TEST, end to end (plan docs/plans/delete-for-good.md, cleared Oct 18; Fable's change 2: "a refused
// non-purge push must be acknowledged so the client clears its dirty flag and stops retrying - prove it in the two-device test").
// A REAL THROWAWAY Postgres (embedded-postgres, borrowed from an install you point at - never production), the REAL compiled server over HTTP,
// and the app's REAL client store running as separate devices (dfg-device.mjs: each its own storage and session cookie):
//   E1  device A writes a page; device B pulls it
//   E2  B edits it offline, its clock an hour FAST (an old edit carrying a newer stamp than anything - the resurrection case)
//   E3  A sends it to Trash and deletes it for good, and syncs
//   E4  the server holds a SHELL: purged_at set and every content column cleared
//   E5  B syncs: its push is REFUSED and ACKNOWLEDGED (acknowledgedPurged names it, rejected does not); the server row is still the shell; B
//       holds the shell, not its edit, and its dirty flag is clear
//   E6  B syncs again: it does NOT push the page again (it stopped retrying)
//   E7  a third device signing in fresh never lists the page anywhere
//   E8  the server clears content ITSELF: a purge record pushed WITH words stores none of them
//   E9  a purged binder: its row a shell, its scratch draft emptied, its sessions kept with no binder pointer (Q2)
//   E10 another account cannot purge this one's page
//   E11 the migration is idempotent: a second boot adds no second purged_at column
//   E12 connector-b's page_links (ledger 107): a purge tombstones the link another page holds to it - on the server and on device B - and the
//       purged row keeps no links of its own
//   (ledger 107, E5's race: B is REALLY offline from E2 to E5 - dfg-device's offline switch - and E5 judges only what B pushed after it
//   came back: the app's own background sync had pushed the "offline" edit before the purge, so there was nothing to refuse)
//   MUTANTS - the compiled server with ONE edit each, every one must turn a case RED: no refusal of a non-purge push onto a shell (E5 red),
//   the refusal reported as REJECTED instead of acknowledged (E5 red: the server says rejected), no server-side clearing (E8 red), the shell
//   keeping its page_links (E12 red)
// Needs: the server built (pnpm --filter @writer-studio/server build) and EMBEDDED_PG_FROM=<a package.json whose install has embedded-postgres>.
// Run (repo root): EMBEDDED_PG_FROM=C:/Users/nickh/wrizo-read/package.json node apps/server/scripts/harness/delete-for-good-e2e.mjs
import { createRequire } from 'node:module';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fork, spawn } from 'node:child_process';
import net from 'node:net';

if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const SERVER = join(here, '..', '..');
const DIST = join(SERVER, 'dist');
if (!existsSync(join(DIST, 'index.js'))) { console.error('Build the server first: pnpm --filter @writer-studio/server build'); process.exit(2); }
const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const reqSrv = createRequire(pathToFileURL(join(SERVER, 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg');
const freePort = () => new Promise((res, rej) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); s.on('error', rej); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PG_PORT = await freePort();
const DB_URL = `postgres://postgres:postgres@127.0.0.1:${PG_PORT}/dfg`;
if (!DB_URL.startsWith('postgres://postgres:postgres@127.0.0.1:')) { console.error('refusing: not the throwaway server'); process.exit(2); }
const pgDir = join(mkdtempSync(join(tmpdir(), 'dfg-pg-')), 'data');
const pg = new EmbeddedPostgres({ databaseDir: pgDir, user: 'postgres', password: 'postgres', port: PG_PORT, persistent: false });
await pg.initialise(); await pg.start(); await pg.createDatabase('dfg');
const admin = new Pool({ connectionString: DB_URL });
await admin.query('create extension if not exists pgcrypto');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 500)}]` : ''}`); };

// ---- the server, from a dist directory (the real one, or a mutant copy)
const startServer = async (distDir) => {
  const port = await freePort();
  const proc = spawn(process.execPath, [join(distDir, 'index.js')], {
    env: { ...process.env, DATABASE_URL: DB_URL, SESSION_SECRET: 'dfg-e2e-secret', PORT: String(port), NODE_ENV: 'development', INVITE_CODES: 'dfg-code', TUTOR_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = ''; proc.stdout.on('data', (d) => { log += d; }); proc.stderr.on('data', (d) => { log += d; });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`${base}/healthz`); if (r.ok) return { proc, base, log: () => log }; } catch { /* booting */ } await sleep(200); }
  proc.kill(); throw new Error('the server did not come up: ' + log.slice(-800));
};
const register = async (base, email) => {
  const r = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'correct horse battery', code: 'dfg-code' }) });
  return r.ok || r.status === 409;
};
// a device: a child process with the client store; call(cmd, args) -> its answer
const device = (base) => new Promise((resolve, reject) => {
  const child = fork(join(here, 'dfg-device.mjs'), [], { env: { ...process.env, DFG_BASE: base }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
  let err = ''; child.stderr.on('data', (d) => { err += d; });
  let seq = 0; const waiting = new Map();
  child.on('message', (m) => {
    if (m.ready) { resolve({ call: (cmd, args) => new Promise((res, rej) => { const s = ++seq; waiting.set(s, { res, rej }); child.send({ seq: s, cmd, args }); }), kill: () => child.kill() }); return; }
    const w = waiting.get(m.seq); if (!w) return; waiting.delete(m.seq);
    if (m.ok) w.res(m.out); else w.rej(new Error(m.error));
  });
  child.on('exit', (code) => { if (code) reject(new Error(`device exited ${code}: ${err.slice(-800)}`)); });
});
const row = (table, id) => admin.query(`select * from ${table} where id = $1`, [id]).then((r) => r.rows[0] || null);

// ---- the scenario, against a server built from `distDir`; returns the case results by key (so mutants can be judged by the same cases)
const scenario = async (distDir, tag, { quiet = false } = {}) => {
  const out = {};
  const k = (key, name, pass, detail) => { out[key] = !!pass; if (!quiet) ok(`${key}: ${name}`, pass, detail); };
  const srv = await startServer(distDir);
  const devs = [];
  try {
    const email = `nick-${tag}@example.com`;
    await register(srv.base, email);
    const A = await device(srv.base); devs.push(A);
    const B = await device(srv.base); devs.push(B);
    await A.call('login', { email, password: 'correct horse battery' });
    await B.call('login', { email, password: 'correct horse battery' });
    // E1
    const { id } = await A.call('createPage', { text: 'the words that must go' });
    await A.call('sync', { full: true });
    await B.call('sync', { full: true });
    const b1 = await B.call('state', { id });
    k('E1', 'device A writes a page and device B pulls it', b1.live && b1.stored && b1.stored.text === 'the words that must go', JSON.stringify(b1.stored && b1.stored.text));
    // E2
    await B.call('offline', { on: true });
    await B.call('skew', { ms: 60 * 60 * 1000 });
    await B.call('edit', { id, text: 'B wrote this offline, clock an hour fast' });
    const b2 = await B.call('state', { id });
    k('E2', 'B edits it offline with a fast clock - the edit is dirty and stamped later than anything else', (b2.dirty.journalEntries || []).includes(id), JSON.stringify(b2.dirty));
    // E3
    await A.call('softDelete', { id });
    const purged = await A.call('purge', { id });
    await A.call('sync');
    // E4
    const r4 = await row('journal_entries', id);
    k('E4', 'A deletes it for good: the server holds a SHELL - purged_at set, every content column cleared',
      purged.done && !!r4 && !!r4.purged_at && r4.text === '' && r4.boxes == null && r4.strokes == null && r4.tutor == null && r4.project_id == null,
      JSON.stringify({ purged, server: r4 && { purged_at: r4.purged_at, text: r4.text, boxes: r4.boxes }, aState: await A.call('state', { id }) }));
    // E5 - B comes back online; only what it pushes from here on is judged
    const mark = (await B.call('state', { id })).wire.length;
    await B.call('offline', { on: false });
    await B.call('sync');
    const b5 = await B.call('state', { id });
    const since = b5.wire.slice(mark);
    const last = since[since.length - 1] || {};
    const pushedIt = since.some((w) => (w.pushed.journalEntries || []).includes(id));
    const acked = since.some((w) => w.ack && (w.ack.journalEntries || []).includes(id));
    const rejected = since.some((w) => w.rejected && (w.rejected.journalEntries || []).includes(id));
    const r5 = await row('journal_entries', id);
    k('E5', 'B syncs: its push (fast clock and all) is REFUSED and ACKNOWLEDGED, never rejected; the server row is still the shell; B now holds the shell and its dirty flag is clear',
      pushedIt && acked && !rejected && !!r5 && !!r5.purged_at && r5.text === '' && !b5.live && !b5.inTrash && !!b5.stored && !!b5.stored.purgedAt && !(b5.dirty.journalEntries || []).includes(id),
      JSON.stringify({ pushedIt, acked, rejected, serverText: r5 && r5.text, bLive: b5.live, mark, since: since.length, last }));
    // E6
    const before = b5.wire.filter((w) => (w.pushed.journalEntries || []).includes(id)).length;
    await B.call('sync'); await B.call('sync');
    const b6 = await B.call('state', { id });
    const after = b6.wire.filter((w) => (w.pushed.journalEntries || []).includes(id)).length;
    // (B also pushes the page back once on its first sync - the journal backfill - so `before` counts that too; the claim is NO push after the acknowledgement)
    k('E6', 'after the acknowledgement B syncs twice more and never pushes the page again - it stopped retrying', before >= 1 && after === before, JSON.stringify({ before, after }));
    // E7
    const C = await device(srv.base); devs.push(C);
    await C.call('login', { email, password: 'correct horse battery' });
    await C.call('sync', { full: true });
    const c7 = await C.call('state', { id });
    k('E7', 'a third device, signing in fresh, never lists the page - not live, not in Trash', !c7.live && !c7.inTrash, JSON.stringify(c7.stored));
    // E8 - a purge record pushed WITH words (a raw session, as no client would)
    const login = await fetch(`${srv.base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'correct horse battery' }) });
    const cookie = (login.headers.getSetCookie ? login.headers.getSetCookie() : []).map((c) => c.split(';')[0]).join('; ');
    const now = new Date().toISOString();
    const qid = `raw-${tag}`;
    const push = (rec) => fetch(`${srv.base}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ lastSyncAt: null, push: { journalEntries: [rec] }, pull: false }) });
    await push({ id: qid, text: 'live words', createdAt: now, updatedAt: now });
    const later = new Date(Date.now() + 1000).toISOString();
    await push({ id: qid, text: 'secret words a purge should never keep', boxes: [{ id: 'x', kind: 'text', text: 'secret' }], createdAt: now, updatedAt: later, deletedAt: later, purgedAt: later });
    const r8 = await row('journal_entries', qid);
    k('E8', 'the server clears content ITSELF: a purge pushed WITH words and boxes stores none of them', !!r8 && !!r8.purged_at && r8.text === '' && r8.boxes == null, JSON.stringify(r8 && { text: r8.text, boxes: r8.boxes }));
    // E9 - a purged binder
    const { id: bid } = await A.call('createBinderWithWork', { title: 'A binder to go' });
    await A.call('sync');
    const purgedB = await A.call('purgeBinder', { id: bid });
    await A.call('sync');
    const p9 = await row('projects', bid);
    const d9 = await row('drafts', bid);
    const s9 = (await admin.query('select project_id from sessions_log where id = $1', [`sess-${bid}`])).rows[0];
    k('E9', 'a purged binder: its row a shell (title cleared), its scratch draft emptied, its session row kept with no binder pointer (Q2)',
      purgedB.done && !!p9 && !!p9.purged_at && p9.title === '' && (!d9 || d9.text === '') && !!s9 && s9.project_id == null, JSON.stringify({ p9: p9 && { title: p9.title, purged_at: p9.purged_at }, d9: d9 && d9.text, s9 }));
    // E10 - another account cannot purge this one's page
    const { id: keep } = await A.call('createPage', { text: 'nobody else can delete me' });
    await A.call('sync');
    const other = `other-${tag}@example.com`;
    await register(srv.base, other);
    const l2 = await fetch(`${srv.base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: other, password: 'correct horse battery' }) });
    const c2 = (l2.headers.getSetCookie ? l2.headers.getSetCookie() : []).map((c) => c.split(';')[0]).join('; ');
    const t = new Date(Date.now() + 5000).toISOString();
    await fetch(`${srv.base}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: c2 }, body: JSON.stringify({ lastSyncAt: null, push: { journalEntries: [{ id: keep, createdAt: t, updatedAt: t, deletedAt: t, purgedAt: t }] }, pull: false }) });
    const r10 = await row('journal_entries', keep);
    k('E10', 'another account pushing a purge for this page\'s id changes nothing', !!r10 && !r10.purged_at && r10.text === 'nobody else can delete me', JSON.stringify(r10 && { text: r10.text, purged_at: r10.purged_at }));
    // E12 - connector-b's page_links (plan section 4; ledger 107)
    const { id: lt } = await A.call('createPage', { text: 'a linked page that goes' });
    const { id: lo } = await A.call('createPage', { text: 'a page that links to it' });
    const toIt = await A.call('addLink', { owner: lo, target: lt });
    // the page that goes owns a link too - to a THIRD page (addPageLink is idempotent in either direction: a link back to lo would only return toIt)
    const { id: lx } = await A.call('createPage', { text: 'a third page' });
    const fromIt = await A.call('addLink', { owner: lt, target: lx });
    await A.call('sync');
    await B.call('sync');
    const bBefore = (await B.call('links', { id: lo })).links.find((l) => l.id === toIt.id);
    const rtBefore = await row('journal_entries', lt);
    await A.call('softDelete', { id: lt });
    await A.call('purge', { id: lt });
    await A.call('sync');
    const rT = await row('journal_entries', lt);
    const rO = await row('journal_entries', lo);
    const serverRec = ((rO && rO.page_links) || []).find((l) => l.id === toIt.id);
    await B.call('sync');
    const bAfter = (await B.call('links', { id: lo })).links.find((l) => l.id === toIt.id);
    k('E12', 'connector-b\'s page_links: a purge tombstones the link another page holds to it - on the SERVER and on device B - and the purged row keeps no links of its own',
      !!toIt.id && !!fromIt.id && fromIt.id !== toIt.id && !!bBefore && !bBefore.deletedAt && !!rtBefore && Array.isArray(rtBefore.page_links) && rtBefore.page_links.length === 1
        && !!rT && !!rT.purged_at && rT.page_links == null && !!serverRec && !!serverRec.deletedAt && !!bAfter && !!bAfter.deletedAt,
      JSON.stringify({ bBefore: !!bBefore, before: rtBefore && rtBefore.page_links, purgedRowLinks: rT && rT.page_links, serverRec, bAfter }));
  } finally {
    for (const d of devs) d.kill();
    srv.proc.kill();
    await sleep(300);
  }
  return out;
};

const muts = [];
try {
  const real = await scenario(DIST, 'real');
  // E11 - a second boot (the server ran its migrations once already above; boot it again) adds nothing
  const again = await startServer(DIST); again.proc.kill(); await sleep(300);
  const cols = (await admin.query(`select table_name, count(*)::int n from information_schema.columns where column_name = 'purged_at' group by table_name order by table_name`)).rows;
  ok('E11: the migration is idempotent - after a second boot each of the four tables has exactly ONE purged_at column',
    JSON.stringify(cols) === JSON.stringify([{ table_name: 'drawers', n: 1 }, { table_name: 'journal_entries', n: 1 }, { table_name: 'projects', n: 1 }, { table_name: 'story_plans', n: 1 }]), JSON.stringify(cols));
  void real;

  // ---- MUTANTS: the compiled server with ONE edit each (a copy beside the real dist, so its requires resolve the same)
  const MUTANTS = [
    { name: 'no refusal onto a shell', mustRed: 'E5', file: 'sync.js', from: 'if (existingPurged && !incomingPurge)', to: 'if (false && existingPurged && !incomingPurge)' },
    // a refusal turned into a REJECTION (the write throws, as a failed insert does): the device still converges - the same sync's pull brings
    // the shell, and a pulled purge wins - but the server has told it the record was REJECTED, which the app shows the writer as an unsaved
    // record. E5's "never rejected" is its case; the no-retry-without-a-pull claim is the browserless P15's.
    { name: 'the refusal REJECTED, not acknowledged', mustRed: 'E5', file: 'sync.js', from: 'acked.push(rec.id);', to: "throw new Error('refused onto a shell');" },
    { name: 'no server-side clearing', mustRed: 'E8', file: 'sync.js', from: "const SHELL_TEXT = '';", to: 'const SHELL_TEXT = null;' },
    { name: 'the shell keeps its page_links', mustRed: 'E12', file: 'sync.js', from: 'page_settings = null, page_links = null,', to: 'page_settings = null,' },
  ];
  for (const m of MUTANTS) {
    const dir = join(SERVER, `.dfg-mutant-${process.pid}`);
    rmSync(dir, { recursive: true, force: true });
    cpSync(DIST, dir, { recursive: true });
    const file = join(dir, m.file);
    const src = readFileSync(file, 'utf8');
    const landed = src.includes(m.from);
    if (landed) writeFileSync(file, src.split(m.from).join(m.to));
    try {
      const res = landed ? await scenario(dir, `m${muts.length}`, { quiet: true }) : {};
      muts.push({ name: m.name, landed, red: landed && res[m.mustRed] === false });
    } catch (e) {
      muts.push({ name: m.name, landed, red: false, crash: String(e && e.message).slice(0, 200) });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  for (const m of muts) ok(`MUTANT (${m.name}): the edit LANDED and turned its case RED`, m.landed && m.red, JSON.stringify(m));
} finally {
  await admin.end();
  await pg.stop();
  rmSync(dirname(pgDir), { recursive: true, force: true });
}
const failed = checks.filter((c) => !c.pass).length;
console.log(failed === 0 ? `\nDELETE-FOR-GOOD-E2E VERIFY: PASS (${checks.length} checks)` : `\nDELETE-FOR-GOOD-E2E VERIFY: FAIL - ${failed}/${checks.length} failed`);
process.exit(failed === 0 ? 0 : 1);
