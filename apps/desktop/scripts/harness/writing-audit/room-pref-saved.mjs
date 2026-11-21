// BROWSERLESS CHECK for THE ROOM SAVED TO THE ACCOUNT (Fable, Nov 19, 11:20 pm: "The room choice (Automatic / Day / Night) is SAVED TO THE ACCOUNT, for Machina AND
// Arbor. Nick approved the room as account data on Nov 1 (room: clock|light|dark, unset = clock, synced), and tonight's rule covers it. Store it as a `room` fact in
// users.prefs (live with train B); build it for both themes on train B's main, red-first (two devices; reload). No fallback item.").
//
// THE ROOM'S ONE LANGUAGE is <html data-room>: both themes' Room rows (Arbor's Mood and Themes rows, Machina's Themes row and mockup bar) write it - light = Day,
// dark = Night, absent = Automatic (the clock) - and each theme's room module turns it into its room. So the account needs one bridge, theme-blind: data-room <->
// the fact `room: { value: 'clock' | 'light' | 'dark', at }` in the reorg's account preferences (src/reorg/prefsSaved.ts; server apps/server/src/prefs.ts).
//
// THE REAL CODE, TWO (AND MORE) DEVICES, as reorg-prefs-saved.mjs does it: each device is its own copy of the app's modules (the persistence layer, the sync engine,
// src/reorg/prefsSaved.ts and the bridge src/store/roomPref.ts), bundled with the esbuild that ships with vite, each with its OWN storage, <html>, MutationObserver,
// fetch and timers. The SERVER is the real rules module over an in-memory store with the SQL's compare-and-swap contract. A fake clock makes every "at once" exact.
// Every device runs with the reorg's switch OFF (no ?reorg=1) unless named: the room is not a reorg feature, so it must save with the switch off.
//
//   R1  a reload keeps her room: Night picked, the device reloads, <html data-room> is 'dark' at boot; the local copy is the existing prefs key in the server's shape
//   R2  a second device: after a round, device B's <html data-room> is A's, and the server holds { room: { value: 'dark', at } }
//   R3  Automatic is a choice too: B picks Automatic (data-room removed) -> the fact is { value: 'clock' } and A's data-room goes after a round
//   R4  two devices pick at once: the later stamp wins on both
//   R5  a pick made signed out reaches the account at sign-in (the path to the account)
//   R6  a device with the reorg's switch ON reads the same room (one fact, either switch)
//   R7  unset is the clock: a fresh account's device sets no data-room and writes nothing; an unknown value from the server is not applied
//   R8  the reorg's OWN facts keep their switch: with it off, setting the split width writes no fact
//   R9  no new storage key: the room writes only the existing prefs key
//   MUT1 the bridge deaf to the account (its subscribePrefs line removed, in memory): R2's second device stays at the clock - R2's read goes RED
//   MUT2 no switchless fact (SWITCHLESS emptied, in memory): with the switch off her pick is not kept - R1's read goes RED
// RED on the tree without src/store/roomPref.ts. Run (from apps/desktop): node scripts/harness/writing-audit/room-pref-saved.mjs. Exit 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', '..', 'src');
const SERVER_PREFS = path.resolve(here, '..', '..', '..', '..', 'server', 'src', 'prefs.ts');
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
const NL = String.fromCharCode(10);
const PREFS_KEY = 'wrizo-reorg-prefs';

let fails = 0;
let checks = 0;
const ok = (cond, msg) => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) fails += 1; };

const hasBridge = fs.existsSync(path.join(SRC, 'store/roomPref.ts'));
const hasSaved = fs.existsSync(path.join(SRC, 'reorg/prefsSaved.ts'));
console.log(`INFO tree: store/roomPref.ts ${hasBridge ? 'present' : 'ABSENT'}; reorg/prefsSaved.ts ${hasSaved ? 'present' : 'ABSENT'}`);

// ---- the clock ----
let fakeNow = Date.parse('2026-11-20T09:00:00.000Z');
const RealDate = Date;
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(fakeNow); } static now() { return fakeNow; } };
const tick = (ms = 1000) => { fakeNow += ms; };
const turns = async (n = 40) => { for (let i = 0; i < n; i += 1) await new Promise((r) => setImmediate(r)); };
const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const canon = (v) => {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  return JSON.stringify(v ?? null);
};

// ---- the server: the real rules over an in-memory store ----
const USER = 'user-1';
const db = { prefs: null };
const build = async (entry) => {
  const built = await esbuild.build({ entryPoints: [entry], bundle: true, format: 'esm', write: false, platform: 'node', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
};
const rules = fs.existsSync(SERVER_PREFS) ? await build(SERVER_PREFS) : null;
const prefsStore = {
  async getPrefs() { return clone(db.prefs); },
  async casPrefs(_u, base, next) { if (canon(db.prefs) !== canon(base)) return false; db.prefs = clone(next); return true; },
};
const reply = (r) => new Response(JSON.stringify(r.json ?? {}), { status: r.status, headers: { 'Content-Type': 'application/json' } });
const requests = [];
async function serve(tag, url, opts = {}) {
  const u = new URL(url, 'http://wrizo.test');
  const method = (opts.method || 'GET').toUpperCase();
  requests.push(`${tag} ${method} ${u.pathname}`);
  if (!rules) return new Response('{"error":"not found"}', { status: 404 });
  if (u.pathname === '/api/prefs' && method === 'GET') return reply(await rules.prefsGet(prefsStore, USER));
  if (u.pathname === '/api/prefs' && method === 'PUT') return reply(await rules.prefsPut(prefsStore, USER, JSON.parse(opts.body)));
  return new Response('{"error":"not found"}', { status: 404 });
}
globalThis.__apiSync = async () => ({ serverTime: new Date().toISOString(), pull: {} });

// ---- the devices ----
const stores = {};
const stubApi = { name: 'stub-api', setup(b) {
  b.onResolve({ filter: /(^|\/)api$/ }, (a) => (a.importer.includes(`${path.sep}store${path.sep}`) || a.importer.includes('/store/') ? { path: 'api-stub', namespace: 'stub-api' } : null));
  b.onLoad({ filter: /.*/, namespace: 'stub-api' }, () => ({ contents: 'export class SyncHttpError extends Error { constructor(status) { super("sync failed: " + status); this.status = status; } } export const apiSync = (p) => globalThis.__apiSync(p); export const postJson = async () => ({ ok: true, status: 200, json: async () => ({}) });', loader: 'js' }));
} };
let bundleCode = null;
// a mutant: one file's source changed in memory (the file on disk untouched); the next devices load it
let MUTANT = null;
const mutate = { name: 'mutate', setup(b) {
  b.onLoad({ filter: /\.(ts|tsx)$/ }, (a) => {
    if (!MUTANT || !a.path.split(path.sep).join('/').endsWith(MUTANT.file)) return null;
    const src = fs.readFileSync(a.path, 'utf8').split('\r\n').join(NL);
    MUTANT.landed = src.includes(MUTANT.from);
    return { contents: src.replace(MUTANT.from, MUTANT.to), loader: 'ts' };
  });
} };
async function bundle() {
  if (bundleCode) return bundleCode;
  const entry = ["export * as persist from './store/persistence';", "export { syncOnce } from './store/sync';",
    hasSaved ? "export * as saved from './reorg/prefsSaved';" : '', hasSaved ? "export * as split from './reorg/split/splitStore';" : '', hasBridge ? "export * as room from './store/roomPref';" : ''].join(NL);
  const built = await esbuild.build({ stdin: { contents: entry, resolveDir: SRC, sourcefile: 'entry-room.ts', loader: 'ts' }, bundle: true, format: 'esm', write: false, platform: 'node', plugins: [stubApi, mutate], logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' } });
  bundleCode = built.outputFiles[0].text;
  return bundleCode;
}
// <html>: an attribute map whose changes reach the device's MutationObservers (a microtask later, as in a browser), filtered by attributeFilter
function makeRoot() {
  const attrs = new Map();
  const observers = new Set();
  const changed = (name, oldValue) => { for (const o of observers) if (!o.filter || o.filter.includes(name)) queueMicrotask(() => o.fn([{ type: 'attributes', attributeName: name, oldValue, target: root }], o.self)); };
  const root = {
    getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null), hasAttribute: (k) => attrs.has(k),
    setAttribute: (k, v) => { const was = root.getAttribute(k); attrs.set(k, String(v)); if (was !== String(v)) changed(k, was); },
    removeAttribute: (k) => { const was = root.getAttribute(k); attrs.delete(k); if (was !== null) changed(k, was); },
    style: { setProperty() {}, removeProperty() {}, getPropertyValue() { return ''; } },
  };
  class MO { constructor(fn) { this.fn = fn; this.self = this; } observe(_t, opts) { this.filter = opts && opts.attributeFilter; observers.add(this); } disconnect() { observers.delete(this); } takeRecords() { return []; } }
  return { root, MO };
}
const devs = {};
async function loadDevice(tag, store = tag, { reorg = false } = {}) {
  if (!stores[store]) stores[store] = new Map([['writer-studio-journal-resync-v1', '1']]);
  const ls = stores[store];
  const timers = [];
  const listeners = {};
  const { root, MO } = makeRoot();
  const dev = {
    tag, timers, root, MutationObserver: MO,
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k), get length() { return ls.size; }, key: (i) => [...ls.keys()][i] ?? null },
    location: { search: reorg ? '?reorg=1' : '', hash: '', href: `http://wrizo.test/${reorg ? '?reorg=1' : ''}` },
    setTimeout: (fn, ms = 0) => { const t = { fn, ms, done: false }; timers.push(t); return t; },
    clearTimeout: (t) => { if (t) t.done = true; },
    fetch: (url, opts) => serve(tag, url, opts),
  };
  dev.window = { addEventListener: (t, f) => { (listeners[t] ||= []).push(f); }, removeEventListener() {}, setTimeout: dev.setTimeout, clearTimeout: dev.clearTimeout, localStorage: dev.localStorage, location: dev.location };
  dev.document = { addEventListener() {}, removeEventListener() {}, visibilityState: 'visible', documentElement: root, querySelector() { return null; } };
  globalThis.__dev = globalThis.__dev || {};
  globalThis.__dev[tag] = dev;
  const prelude = ['localStorage', 'location', 'window', 'document', 'setTimeout', 'clearTimeout', 'MutationObserver'].map((n) => `const ${n} = globalThis.__dev[${JSON.stringify(tag)}].${n};`).join(NL)
    + `${NL}const fetch = (u, o) => globalThis.__dev[${JSON.stringify(tag)}].fetch(u, o);${NL}`;
  const code = prelude + (await bundle()) + `${NL}// device ${tag}`;
  dev.mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  dev.runTimers = async () => { for (let pass = 0; pass < 5; pass += 1) { const due = timers.filter((t) => !t.done); if (!due.length) break; for (const t of due) { t.done = true; t.fn(); } await turns(); } };
  await turns();
  devs[tag] = dev;
  return dev;
}
const round = async (d) => { if (d.mod.saved) await d.mod.saved.syncPrefs(); await turns(); };
const syncDev = async (d) => { await d.mod.syncOnce(); await turns(); };
const pick = async (d, v) => { if (v === 'clock') d.root.removeAttribute('data-room'); else d.root.setAttribute('data-room', v); await turns(); };
const roomOn = (d) => d.root.getAttribute('data-room');
const local = (tag) => { try { return JSON.parse(stores[tag]?.get(PREFS_KEY) ?? 'null'); } catch { return null; } };
const serverRoom = () => (db.prefs && db.prefs.room) || null;

if (!hasBridge || !hasSaved || !rules) {
  for (const n of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9']) ok(false, `${n} no bridge (src/store/roomPref.ts): the room is in-session only - a reload or another device starts at the clock`);
} else {
  // R7 first, on a fresh account: unset is the clock, and nothing is written
  const F = await loadDevice('F');
  await syncDev(F); await F.runTimers(); tick();
  ok(roomOn(F) === null && local('F') === null && db.prefs === null, `R7 a fresh account: no data-room (${roomOn(F)}), no local copy (${JSON.stringify(local('F'))}), nothing on the server (${JSON.stringify(db.prefs)})`);

  // R1 a reload keeps her room
  const A = await loadDevice('A');
  await pick(A, 'dark'); tick();
  const kept = local('A');
  const A2 = await loadDevice('A2', 'A');
  ok(roomOn(A2) === 'dark' && !!kept && !!kept.room && kept.room.value === 'dark' && typeof kept.room.at === 'string',
    `R1 a reload keeps Night: data-room at boot ${roomOn(A2)}; the local copy holds ${JSON.stringify(kept)}`);

  // R2 a second device
  await syncDev(A2); await A2.runTimers(); tick();
  const B = await loadDevice('B');
  await syncDev(B); await B.runTimers(); tick();
  ok(roomOn(B) === 'dark' && !!serverRoom() && serverRoom().value === 'dark', `R2 device B has A's room after a round (data-room ${roomOn(B)}); the server holds ${JSON.stringify(serverRoom())}`);

  // R3 Automatic is a choice too
  await pick(B, 'clock'); tick(); await B.runTimers(); tick(); await round(A2);
  ok(serverRoom() && serverRoom().value === 'clock' && roomOn(A2) === null && roomOn(B) === null, `R3 B picks Automatic: the server holds ${JSON.stringify(serverRoom())}; A's data-room ${roomOn(A2)}`);

  // R4 two devices pick at once: the later stamp wins on both
  await pick(A2, 'light'); tick(5);
  await pick(B, 'dark'); tick();
  await round(A2); await round(B); await round(A2);
  ok(roomOn(A2) === 'dark' && roomOn(B) === 'dark' && serverRoom() && serverRoom().value === 'dark', `R4 Day on A, then Night on B a moment later: both read ${roomOn(A2)} / ${roomOn(B)}; the server ${JSON.stringify(serverRoom())}`);

  // R5 a pick made signed out reaches the account at sign-in
  tick(60000);
  const C = await loadDevice('C');
  await pick(C, 'light'); tick();
  const before = clone(serverRoom());
  await syncDev(C); await C.runTimers(); tick();
  ok(before && before.value === 'dark' && serverRoom() && serverRoom().value === 'light' && roomOn(C) === 'light', `R5 Day picked signed out reaches the account at sign-in: ${JSON.stringify(before)} -> ${JSON.stringify(serverRoom())}`);

  // R6 a device with the reorg's switch ON reads the same room
  const D = await loadDevice('D', 'D', { reorg: true });
  await syncDev(D); await D.runTimers(); tick();
  ok(roomOn(D) === 'light', `R6 a device with ?reorg=1 reads the same room (${roomOn(D)})`);

  // R7 an unknown value from the server is not applied
  db.prefs = { ...clone(db.prefs), room: { value: 'purple', at: new Date(fakeNow + 1000).toISOString() } }; tick(2000);
  const E = await loadDevice('E');
  await syncDev(E); await E.runTimers(); tick();
  ok(roomOn(E) !== 'purple' && (roomOn(E) === null), `R7 an unknown room from the server is not applied (data-room ${roomOn(E)})`);

  // R8 the reorg's own facts keep their switch
  const G = await loadDevice('G');
  G.mod.split.setSplitWidth(0.7); await turns();
  ok(!(local('G') && local('G').split) && !(G.mod.saved.getPref('split')), `R8 with the reorg's switch off, the split width writes no fact (${JSON.stringify(local('G'))})`);

  // R9 no new storage key
  const keys = new Set(); for (const s of Object.values(stores)) for (const k of s.keys()) keys.add(k);
  const extra = [...keys].filter((k) => k !== PREFS_KEY && k !== 'writer-studio-journal-resync-v1' && !/^writer-studio-/.test(k));
  ok(extra.length === 0, `R9 the room writes only the existing prefs key (${PREFS_KEY}); other keys: ${JSON.stringify(extra)}`);
}

// ---- the mutants ----
const asMutant = async (m, run) => { MUTANT = { ...m, landed: false }; bundleCode = null; db.prefs = null; try { return { landed: false, ...(await run()), landedSrc: MUTANT.landed }; } finally { MUTANT = null; bundleCode = null; } };
if (hasBridge && hasSaved && rules) {
  const m1 = await asMutant({ file: 'src/store/roomPref.ts', from: '  subscribePrefs(apply);' + NL, to: NL }, async () => {
    const X = await loadDevice('M1a'); await pick(X, 'dark'); tick(); await syncDev(X); await X.runTimers(); tick();
    const Y = await loadDevice('M1b'); await syncDev(Y); await Y.runTimers(); tick();
    return { r2: roomOn(Y) === 'dark' && !!serverRoom() && serverRoom().value === 'dark', y: roomOn(Y), server: clone(serverRoom()) };
  });
  ok(m1.landedSrc && !m1.r2, `MUT1 the bridge deaf to the account (LANDED: ${m1.landedSrc}): the second device reads ${m1.y} with the server at ${JSON.stringify(m1.server)} - R2's read goes RED`);
  const m2 = await asMutant({ file: 'src/reorg/prefsSaved.ts', from: "new Set(['room'])", to: 'new Set([])' }, async () => {
    const X = await loadDevice('M2a'); await pick(X, 'dark'); tick();
    const X2 = await loadDevice('M2b', 'M2a');
    return { r1: roomOn(X2) === 'dark', x2: roomOn(X2), copy: local('M2a') };
  });
  ok(m2.landedSrc && !m2.r1, `MUT2 no switchless fact (LANDED: ${m2.landedSrc}): after a reload the room is ${m2.x2}, the copy ${JSON.stringify(m2.copy)} - R1's read goes RED`);
}

console.log(`INFO requests: ${requests.length}`);
console.log(fails === 0 ? `\nROOM-PREF-SAVED VERIFY: PASS (${checks} checks)` : `\nROOM-PREF-SAVED VERIFY: FAIL - ${fails}/${checks} failed`);
process.exit(fails === 0 ? 0 : 1);
