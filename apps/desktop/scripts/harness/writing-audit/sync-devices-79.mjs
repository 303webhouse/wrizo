// BROWSERLESS CHECK for #79 (two devices, one page, both edited since they last synced: words lost). The real persistence layer and the real sync engine (src/store/sync.ts, bundled with the esbuild that ships with vite) run as TWO devices,
// each its own copy of the modules with its own browser storage, against a server double that follows the server's rule (a pushed record replaces the stored row only when its updated_at is strictly newer; a pull answers the rows changed
// since the device's cursor, the one it just pushed included). A fake clock makes the order of edits and syncs exact.
//   C1  both devices type a different line; A syncs first, then B (B's edit is the LATER one): both lines end up on the server and on both devices
//   C2  the same, B's edit is the EARLIER one (the server would refuse B's older push): both lines everywhere
//   C3  A deletes a line, B edits another: the delete and the edit both stand
//   C4  both change the same line: both whole versions are kept, nothing blended
//   C5  only A edited: B takes A's page as before (nothing merged, nothing lost)
//   C6  the merge bases are device-local and short-lived: none left once everything is synced; none after sign-out; the storage key is not part of any pushed record
//   C7  the bases are bounded (150 dirty pages keep at most 100)
//   C8  a page with no kept base is merged the old way: this device's text wins (the documented fall-back)
// RED on main (no merge: one side's words are gone in C1 to C4). Run: node scripts/harness/writing-audit/sync-devices-79.mjs (from apps/desktop; on Actions via writing-audit.yml, script=sync-devices-79.mjs). Exit 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', '..', 'src');
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
const NL = String.fromCharCode(10);

let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) fails += 1; };

// ---- the clock and the browser stand-ins -------------------------------------------------------------------------------
let fakeNow = Date.parse('2026-11-12T10:00:00.000Z');
const RealDate = Date;
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(fakeNow); } static now() { return fakeNow; } };
const tick = (ms = 1000) => { fakeNow += ms; };

const stores = { A: new Map(), B: new Map() };
let current = stores.A;
globalThis.localStorage = { getItem: (k) => (current.has(k) ? current.get(k) : null), setItem: (k, v) => current.set(k, String(v)), removeItem: (k) => current.delete(k), get length() { return current.size; }, key: (i) => [...current.keys()][i] ?? null };
const noop = { addEventListener() {}, removeEventListener() {} };
globalThis.window = { ...noop, setTimeout, clearTimeout, localStorage: globalThis.localStorage, location: { hash: '', href: 'http://x/' } };
globalThis.document = { ...noop, visibilityState: 'visible', documentElement: { setAttribute() {}, getAttribute() { return null; } } };
globalThis.navigator = globalThis.navigator || { userAgent: 'node' };

// ---- the server double -------------------------------------------------------------------------------------------------
const server = { rows: new Map() };
const clone = (x) => JSON.parse(JSON.stringify(x));
globalThis.__apiSync = async ({ lastSyncAt, push, pull }) => {
  const now = new Date().toISOString();
  for (const rec of (push && push.journalEntries) || []) { const cur = server.rows.get(rec.id); if (!cur || rec.updatedAt > cur.rec.updatedAt) server.rows.set(rec.id, { rec: clone(rec), syncedAt: now }); }
  const out = {};
  if (pull !== false) out.journalEntries = [...server.rows.values()].filter((r) => lastSyncAt === null || r.syncedAt > lastSyncAt).map((r) => clone(r.rec));
  return { serverTime: now, pull: out };
};

// ---- one bundle per device ---------------------------------------------------------------------------------------------
const hasBase = fs.existsSync(path.join(SRC, 'store/persistence/syncBase.ts'));
const stubApi = { name: 'stub-api', setup(b) {
  b.onResolve({ filter: /(^|\/)api$/ }, (a) => (a.importer.includes(`${path.sep}store${path.sep}`) || a.importer.includes('/store/') ? { path: 'api-stub', namespace: 'stub-api' } : null));
  b.onLoad({ filter: /.*/, namespace: 'stub-api' }, () => ({ contents: 'export class SyncHttpError extends Error { constructor(status) { super("sync failed: " + status); this.status = status; } } export const apiSync = (p) => globalThis.__apiSync(p); export const postJson = async () => ({ ok: true, json: async () => ({}) });', loader: 'js' }));
} };
async function loadDevice(tag) {
  current = stores[tag];
  const entry = ["export * as persist from './store/persistence';", "export { syncOnce } from './store/sync';", hasBase ? "export * as syncBase from './store/persistence/syncBase';" : ''].join(NL);
  const built = await esbuild.build({ stdin: { contents: entry, resolveDir: SRC, sourcefile: `entry-${tag}.ts`, loader: 'ts' }, bundle: true, format: 'esm', write: false, platform: 'node', plugins: [stubApi], logLevel: 'silent' });
  const code = built.outputFiles[0].text + `${NL}// device ${tag}`;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  return { tag, mod, run: async (fn) => { current = stores[tag]; return fn(mod); } };
}
const A = await loadDevice('A');
const B = await loadDevice('B');

// ---- helpers -----------------------------------------------------------------------------------------------------------
const page = (d, id) => d.run((m) => (m.persist.getJournalEntries().find((e) => e.id === id) || null));
const textOf = async (d, id) => { const p = await page(d, id); return p ? p.text : null; };
const edit = (d, id, fn) => d.run((m) => { const e = m.persist.getJournalEntries().find((x) => x.id === id); const next = { ...JSON.parse(JSON.stringify(e)), text: fn(e.text) }; m.persist.saveJournalEntry(next); m.persist.flushNow(); });
const sync = (d) => d.run(async (m) => { await m.syncOnce(); });
const serverText = (id) => (server.rows.get(id) ? server.rows.get(id).rec.text : null);
async function setup(id, text) {
  server.rows.clear(); tick(60000);
  const rec = { id, text, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), origin: 'journal', source: 'page' };
  server.rows.set(id, { rec, syncedAt: new Date().toISOString() });
  tick(); await sync(A); tick(); await sync(B); tick();
}
const has = (t, s) => typeof t === 'string' && t.includes(s);

// C1 - B's edit is the later one, A syncs first
{
  await setup('p1', ['Alpha.', 'Beta.', 'Gamma.'].join(NL));
  await edit(A, 'p1', (t) => t + NL + 'From A.'); tick(5000);
  await edit(B, 'p1', (t) => t + NL + 'From B.'); tick(5000);
  await sync(A); tick(); await sync(B); tick(); await sync(A); tick(); await sync(B);
  const s = serverText('p1'), a = await textOf(A, 'p1'), b = await textOf(B, 'p1');
  ok(has(s, 'From A.') && has(s, 'From B.'), `C1 the server holds both lines: ${JSON.stringify(s)}`);
  ok(has(a, 'From A.') && has(a, 'From B.'), `C1 device A holds both lines: ${JSON.stringify(a)}`);
  ok(has(b, 'From A.') && has(b, 'From B.'), `C1 device B holds both lines: ${JSON.stringify(b)}`);
  ok(s === a && a === b, 'C1 server, A and B settle on one text');
}
// C2 - B's edit is the EARLIER one (an older updated_at), B syncs after A
{
  await setup('p2', ['Alpha.', 'Beta.'].join(NL));
  await edit(B, 'p2', (t) => t + NL + 'From B.'); tick(5000);
  await edit(A, 'p2', (t) => t + NL + 'From A.'); tick(5000);
  await sync(A); tick(); await sync(B); tick(); await sync(A); tick(); await sync(B);
  const s = serverText('p2'), a = await textOf(A, 'p2'), b = await textOf(B, 'p2');
  ok(has(s, 'From A.') && has(s, 'From B.'), `C2 the server holds both lines: ${JSON.stringify(s)}`);
  ok(has(a, 'From B.') && has(b, 'From A.'), `C2 each device holds the other's line: A ${JSON.stringify(a)} B ${JSON.stringify(b)}`);
}
// C3 - A deletes a line, B edits another
{
  await setup('p3', ['One.', 'Two.', 'Three.'].join(NL));
  await edit(A, 'p3', () => ['One.', 'Three.'].join(NL)); tick(5000);
  await edit(B, 'p3', () => ['One.', 'Two.', 'Three, edited.'].join(NL)); tick(5000);
  await sync(A); tick(); await sync(B); tick(); await sync(A); tick(); await sync(B);
  const s = serverText('p3');
  ok(s === ['One.', 'Three, edited.'].join(NL), `C3 the delete and the edit both stand: ${JSON.stringify(s)}`);
}
// C4 - the same line changed on both
{
  await setup('p4', ['The quick fox.'].join(NL));
  await edit(A, 'p4', () => 'The fast fox.'); tick(5000);
  await edit(B, 'p4', () => 'The slow fox.'); tick(5000);
  await sync(A); tick(); await sync(B); tick(); await sync(A); tick(); await sync(B);
  const s = serverText('p4');
  ok(has(s, 'The fast fox.') && has(s, 'The slow fox.') && !has(s, 'The slow fast'), `C4 both whole versions are kept: ${JSON.stringify(s)}`);
}
// C5 - only A edited
{
  await setup('p5', ['One.', 'Two.'].join(NL));
  await edit(A, 'p5', (t) => t + NL + 'From A.'); tick(5000);
  await sync(A); tick(); await sync(B);
  ok((await textOf(B, 'p5')) === ['One.', 'Two.', 'From A.'].join(NL) && serverText('p5') === ['One.', 'Two.', 'From A.'].join(NL), 'C5 B takes A\'s page: nothing merged, nothing lost');
}
// C6 - the bases
if (!hasBase) { ok(false, 'C6 C7 C8 no sync base module (src/store/persistence/syncBase.ts): main has no merge'); }
else {
  await setup('p6', 'One.');
  await edit(B, 'p6', (t) => t + NL + 'B.'); tick();
  ok(((await B.run((m) => m.syncBase.syncBaseIds())).includes('p6')), 'C6 a page that goes dirty keeps its base');
  await sync(B); tick();
  ok(!((await B.run((m) => m.syncBase.syncBaseIds())).includes('p6')), 'C6 the base is dropped once the page is clean and synced');
  await edit(B, 'p6', (t) => t + NL + 'B2.'); tick();
  await B.run((m) => m.persist.resetLocalData());
  ok(((await B.run((m) => m.syncBase.syncBaseIds())).length === 0) && !stores.B.has('wrizo-sync-bases-v1'), 'C6 sign-out clears the bases and their storage key');
  const pushedKeys = JSON.stringify([...server.rows.values()]);
  ok(!pushedKeys.includes('sync-bases') && !pushedKeys.includes('syncBase'), 'C6 nothing of the bases is on the server');
  // C7 - bounded
  server.rows.clear();
  for (let i = 0; i < 150; i += 1) {
    const rec = { id: `bulk${i}`, text: `Line ${i}.`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), origin: 'journal', source: 'page' };
    server.rows.set(rec.id, { rec, syncedAt: new Date().toISOString() });
  }
  tick(); await sync(A); tick();
  for (let i = 0; i < 150; i += 1) await edit(A, `bulk${i}`, (t) => t + ' edited');
  const n = (await A.run((m) => m.syncBase.syncBaseIds())).length;
  ok(n > 0 && n <= 100, `C7 150 dirty pages keep ${n} bases (at most 100)`);
  // C8 - no base: the old rule
  await setup('p8', ['One.', 'Two.'].join(NL));
  await B.run((m) => { m.persist.saveJournalEntry({ ...JSON.parse(JSON.stringify(m.persist.getJournalEntries().find((e) => e.id === 'p8'))), text: ['One.', 'Two.', 'From B.'].join(NL) }); m.persist.flushNow(); m.syncBase.dropSyncBase('p8'); });
  tick(5000);
  await edit(A, 'p8', (t) => t + NL + 'From A.'); tick(5000);
  await sync(A); tick(); await sync(B);
  ok(serverText('p8') === ['One.', 'Two.', 'From B.'].join(NL), `C8 a page with no kept base: this device's text wins, as before: ${JSON.stringify(serverText('p8'))}`);
}
console.log(`SYNC-DEVICES-79: ${fails ? `FAIL - ${fails}` : 'PASS'}`);
process.exit(fails ? 1 : 0);
