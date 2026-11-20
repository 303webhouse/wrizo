// BROWSERLESS CHECK for THE WRITING SETTINGS SAVED TO THE ACCOUNT (Fable, Nov 20, 12:15 pm: "the session's settings saved to the account. Mirror the device key
// wrizo-writing-settings into a `writing` fact in users.prefs, saved with the reorg switch OFF, as ARBOR's room is (add it to SWITCHLESS). Red-first: two devices, reload,
// every theme."). Nick's SAVED DATA ruling (Nov 19): everything a writer changes is saved to the ACCOUNT.
//
// THE REAL CODE, TWO (AND MORE) DEVICES, exactly as room-pref-saved.mjs does it: each device is its own copy of the app's modules (the persistence layer, the sync engine,
// reorg/prefsSaved.ts, store/writingSettings.ts and the bridge store/writingPref.ts), bundled with the esbuild that ships with vite, each with its OWN storage and timers; the
// SERVER is the real rules module over an in-memory store with the SQL's compare-and-swap contract; a fake clock makes every "at once" exact. The bridge is theme-blind (no
// module it loads reads the theme), so one run holds for every theme.
//   W1  a reload keeps her settings: the device key AND a `writing` fact in the existing prefs key, in the server's shape
//   W2  a second device: after a round it has her settings, and the server holds { writing: {...fields, at} }
//   W3  a change on that device reaches the first, and keeps the first's other settings
//   W4  two devices change at once: a DIFFERENT setting each keeps both (a stamp per setting), the SAME setting is settled by the later stamp on both
//   W5  a change made signed out reaches the account at sign-in, and does not overwrite her other settings with defaults
//   W6  a device with the reorg's switch ON reads the same settings
//   W7  a fresh account writes nothing: no fact, and the first-run seed (typewriter: true, what the default already is) is not an act
//   W8  an older device with settings but no fact: its settings reach the account after the first round (adoption), and a second fresh device gets them
//   W9  a value this build does not know is never applied, a newer build's extra field survives this build's own change
//   W10 sign-out forgets them: the settings are the defaults, the key and the copy are gone
//   W11 the reorg's OWN facts keep their switch: with it off, the split width writes no fact
//   W12 no new storage key: only wrizo-writing-settings and the existing prefs key
//   MUT1 the bridge deaf to the account (its subscribePrefs line removed): W2 goes RED
//   MUT2 no switchless fact ('writing' out of SWITCHLESS): W1 goes RED
//   MUT3 every call is an act (the unchanged-value guard removed): W7 goes RED
//   MUT4 sign-out not wired (the reset hook removed): W10 goes RED
// RED on the tree without src/store/writingPref.ts. Run (from apps/desktop): node scripts/harness/writing-audit/writing-pref-saved.mjs. Exit 1 on any failure.
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

const hasBridge = fs.existsSync(path.join(SRC, 'store/writingPref.ts'));
const hasSaved = fs.existsSync(path.join(SRC, 'reorg/prefsSaved.ts'));
console.log(`INFO tree: store/writingPref.ts ${hasBridge ? 'present' : 'ABSENT'}; reorg/prefsSaved.ts ${hasSaved ? 'present' : 'ABSENT'}`);

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
    hasSaved ? "export * as saved from './reorg/prefsSaved';" : '', hasSaved ? "export * as split from './reorg/split/splitStore';" : '', hasBridge ? "export * as bridge from './store/writingPref';" : '', "export * as ws from './store/writingSettings';", "export * as rk from './reorg/railSavedKey';"].join(NL);
  const built = await esbuild.build({ stdin: { contents: entry, resolveDir: SRC, sourcefile: 'entry-writing.ts', loader: 'ts' }, bundle: true, format: 'esm', write: false, platform: 'node', plugins: [stubApi, mutate], logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' } });
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
const WKEY = 'wrizo-writing-settings';
const set = async (d, patch) => { d.mod.ws.setWritingSettings(patch); await turns(); };
const cur = (d) => d.mod.ws.getWritingSettings();
const local = (tag) => { try { return JSON.parse(stores[tag]?.get(PREFS_KEY) ?? 'null'); } catch { return null; } };
const deviceKey = (tag) => { try { return JSON.parse(stores[tag]?.get(WKEY) ?? 'null'); } catch { return null; } };
const serverW = () => (db.prefs && db.prefs.writing) || null;
const same = (a, b, keys) => keys.every((k) => a[k] === b[k]);

if (!hasBridge || !hasSaved || !rules) {
  for (const n of ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12']) ok(false, `${n} no bridge (src/store/writingPref.ts): the settings stay on the device - another device or a fresh sign-in starts at the defaults`);
} else {
  // W7 first, on a fresh account: nothing is written
  const F = await loadDevice('F');
  await syncDev(F); await F.runTimers(); tick();
  F.mod.ws.setWritingSettings({ typewriter: true }); await turns(); await F.runTimers(); tick();
  ok(local('F') === null && db.prefs === null, `W7 a fresh account: no prefs copy (${JSON.stringify(local('F'))}), nothing on the server (${JSON.stringify(db.prefs)}); the first-run seed wrote the device key only (${JSON.stringify(deviceKey('F'))})`);

  // W1 a reload keeps her settings
  const A = await loadDevice('A');
  await set(A, { typewriter: false, progress: 'time', lineFadeLines: 5 }); tick();
  const kept = local('A');
  const A2 = await loadDevice('A2', 'A');
  ok(same(cur(A2), { typewriter: false, progress: 'time', lineFadeLines: 5 }, ['typewriter', 'progress', 'lineFadeLines']) && !!kept && !!kept.writing && kept.writing.typewriter === false && kept.writing.progress === 'time' && typeof kept.writing.at === 'string' && !!deviceKey('A') && deviceKey('A').typewriter === false,
    `W1 a reload keeps them: device ${JSON.stringify({ t: cur(A2).typewriter, p: cur(A2).progress, l: cur(A2).lineFadeLines })}; the copy holds ${JSON.stringify(kept && kept.writing)}`);

  // W2 a second device
  await syncDev(A2); await A2.runTimers(); tick();
  const B = await loadDevice('B');
  await syncDev(B); await B.runTimers(); tick();
  ok(same(cur(B), { typewriter: false, progress: 'time', lineFadeLines: 5 }, ['typewriter', 'progress', 'lineFadeLines']) && !!serverW() && serverW().progress === 'time' && serverW().typewriter === false,
    `W2 device B has A's settings after a round (${JSON.stringify({ t: cur(B).typewriter, p: cur(B).progress, l: cur(B).lineFadeLines })}); the server holds ${JSON.stringify(serverW())}`);

  // W3 a change on B reaches A, and A keeps its other settings
  await set(B, { timer: true }); tick(); await B.runTimers(); tick(); await round(A2);
  ok(cur(A2).timer === true && cur(A2).progress === 'time' && cur(A2).lineFadeLines === 5 && !!serverW() && serverW().timer === true && serverW().progress === 'time',
    `W3 B turns the timer on: A reads timer ${cur(A2).timer}, progress ${cur(A2).progress}, lineFadeLines ${cur(A2).lineFadeLines}; the server ${JSON.stringify(serverW())}`);

  // W4 two devices change at once: a DIFFERENT setting each keeps both; the SAME setting is settled by the later stamp
  await set(A2, { writingLine: 'top' }); tick(5);
  await set(B, { pageScroll: false }); tick();
  await round(A2); await round(B); await round(A2);
  const both = cur(A2).writingLine === 'top' && cur(A2).pageScroll === false && cur(B).writingLine === 'top' && cur(B).pageScroll === false && !!serverW() && serverW().writingLine === 'top' && serverW().pageScroll === false;
  await set(A2, { writingLine: 'center' }); tick(5);
  await set(B, { writingLine: 'bottom' }); tick();
  await round(A2); await round(B); await round(A2);
  ok(both && cur(A2).writingLine === 'bottom' && cur(B).writingLine === 'bottom' && !!serverW() && serverW().writingLine === 'bottom' && serverW().pageScroll === false,
    `W4 top on A and pageScroll off on B at once: both kept (${both}); then center on A and bottom on B a moment later: both read ${cur(A2).writingLine} / ${cur(B).writingLine}; the server ${serverW() && serverW().writingLine}, pageScroll ${serverW() && serverW().pageScroll}`);

  // W5 a change made signed out reaches the account at sign-in
  tick(60000);
  const C = await loadDevice('C');
  await set(C, { flicker: false }); tick();
  const before = clone(serverW());
  await syncDev(C); await C.runTimers(); tick();
  ok(before && before.flicker !== false && serverW() && serverW().flicker === false && serverW().progress === 'time', `W5 flicker off picked signed out reaches the account at sign-in: ${before && before.flicker} -> ${serverW() && serverW().flicker}`);

  // W6 a device with the reorg's switch ON reads the same settings
  const D = await loadDevice('D', 'D', { reorg: true });
  await syncDev(D); await D.runTimers(); tick();
  ok(cur(D).flicker === false && cur(D).progress === 'time', `W6 a device with ?reorg=1 reads the same settings (flicker ${cur(D).flicker}, progress ${cur(D).progress})`);

  // W8 an older device with settings but no fact
  db.prefs = null; tick(60000);
  stores.H = new Map([['writer-studio-journal-resync-v1', '1'], [WKEY, JSON.stringify({ progress: 'off', timer: true, typewriter: false })]]);
  const H = await loadDevice('H', 'H');
  await syncDev(H); await H.runTimers(); tick();
  const J = await loadDevice('J');
  await syncDev(J); await J.runTimers(); tick();
  ok(!!serverW() && serverW().progress === 'off' && serverW().timer === true && cur(J).progress === 'off' && cur(J).timer === true && cur(J).typewriter === false,
    `W8 an older device's settings reach the account at its first round (${JSON.stringify(serverW())}) and a fresh device gets them (${JSON.stringify({ p: cur(J).progress, t: cur(J).timer, tw: cur(J).typewriter })})`);

  // W9 an unknown value is never applied; a newer build's extra field survives
  db.prefs = { writing: { progress: 'purple', timer: 'yes', typewriter: false, futureThing: 7, at: new Date(fakeNow + 1000).toISOString() } }; tick(2000);
  const E = await loadDevice('E');
  await syncDev(E); await E.runTimers(); tick();
  const okBad = cur(E).progress === 'words' && cur(E).timer === false && cur(E).typewriter === false;
  await set(E, { pageScroll: false }); tick(); await E.runTimers(); tick();
  ok(okBad && !!serverW() && serverW().futureThing === 7 && serverW().pageScroll === false, `W9 an unknown value is not applied (progress ${cur(E).progress}, timer ${cur(E).timer}); a newer build's field survives a change (server ${JSON.stringify(serverW())})`);

  // W10 sign-out forgets them
  await set(E, { progress: 'time' }); tick();
  E.mod.rk.clearRailLocal(); await turns(); tick();
  const keyKept = !!(stores.E.get(WKEY));
  ok(cur(E).progress === 'words' && cur(E).pageScroll === true && !keyKept && local('E') === null, `W10 sign-out: defaults (${cur(E).progress}, pageScroll ${cur(E).pageScroll}), device key ${keyKept ? 'KEPT' : 'gone'}, copy ${JSON.stringify(local('E'))}`);

  // W11 the reorg's own facts keep their switch
  const G = await loadDevice('G');
  G.mod.split.setSplitWidth(0.7); await turns();
  ok(!(local('G') && local('G').split) && !(G.mod.saved.getPref('split')), `W11 with the reorg's switch off, the split width writes no fact (${JSON.stringify(local('G'))})`);

  // W12 no new storage key
  const keys = new Set(); for (const s of Object.values(stores)) for (const k of s.keys()) keys.add(k);
  const extra = [...keys].filter((k) => k !== PREFS_KEY && k !== WKEY && k !== 'writer-studio-journal-resync-v1' && !/^writer-studio-/.test(k));
  ok(extra.length === 0, `W12 the bridge writes only the device key (${WKEY}) and the existing prefs key (${PREFS_KEY}); other keys: ${JSON.stringify(extra)}`);
}

// ---- the mutants ----
const asMutant = async (m, run) => { MUTANT = { ...m, landed: false }; bundleCode = null; db.prefs = null; try { return { landed: false, ...(await run()), landedSrc: MUTANT.landed }; } finally { MUTANT = null; bundleCode = null; } };
if (hasBridge && hasSaved && rules) {
  const m1 = await asMutant({ file: 'src/store/writingPref.ts', from: 'subscribePrefs(apply);' + NL, to: NL }, async () => {
    const X = await loadDevice('M1a'); await set(X, { progress: 'time' }); tick(); await syncDev(X); await X.runTimers(); tick();
    const Y = await loadDevice('M1b'); await syncDev(Y); await Y.runTimers(); tick();
    return { w2: cur(Y).progress === 'time' && !!serverW(), y: cur(Y).progress };
  });
  ok(m1.landedSrc && !m1.w2, `MUT1 the bridge deaf to the account (LANDED: ${m1.landedSrc}): the second device reads progress ${m1.y} - W2's read goes RED`);
  const m2 = await asMutant({ file: 'src/reorg/prefsSaved.ts', from: "'writing'", to: "'writingX'" }, async () => {
    const X = await loadDevice('M2a'); await set(X, { progress: 'time' }); tick();
    return { w1: !!(local('M2a') && local('M2a').writing), copy: local('M2a') };
  });
  ok(m2.landedSrc && !m2.w1, `MUT2 no switchless fact (LANDED: ${m2.landedSrc}): the copy holds ${JSON.stringify(m2.copy)} - W1's read goes RED`);
  const m3 = await asMutant({ file: 'src/store/writingPref.ts', from: 'if (!changed.length) return;', to: '' }, async () => {
    const X = await loadDevice('M3a'); X.mod.ws.setWritingSettings({ typewriter: true }); await turns(); await X.runTimers(); tick();
    return { w7: local('M3a') === null, copy: local('M3a') };
  });
  ok(m3.landedSrc && !m3.w7, `MUT3 every call is an act (LANDED: ${m3.landedSrc}): a fresh device's seed leaves ${JSON.stringify(m3.copy)} - W7's read goes RED`);
  const m4 = await asMutant({ file: 'src/store/writingPref.ts', from: 'onRailReset(resetSettings);', to: '' }, async () => {
    const X = await loadDevice('M4a'); await set(X, { progress: 'time' }); tick(); X.mod.rk.clearRailLocal(); await turns();
    return { w10: cur(X).progress === 'words', p: cur(X).progress };
  });
  ok(m4.landedSrc && !m4.w10, `MUT4 sign-out not wired (LANDED: ${m4.landedSrc}): after sign-out progress is ${m4.p} - W10's read goes RED`);
}

console.log(`INFO requests: ${requests.length}`);
console.log(fails === 0 ? `\nWRITING-PREF-SAVED VERIFY: PASS (${checks} checks)` : `\nWRITING-PREF-SAVED VERIFY: FAIL - ${fails}/${checks} failed`);
process.exit(fails === 0 ? 0 : 1);
