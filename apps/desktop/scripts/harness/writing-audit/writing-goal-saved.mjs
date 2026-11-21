// BROWSERLESS CHECK for THE WRITING GOAL SAVED TO THE ACCOUNT (Fable, Nov 20, 5:15 pm: "the writing GOAL (n and unit) lives only in the device key wrizo-writing-goal-lines; ... put the goal on
// the account the same way, a switchless fact in users.prefs with field stamps, not a new column. Red first."), and THE THEME-TRACKER SWITCH's key in the writing fact (Fable, 5:25 pm:
// "POLISH's 'Use Theme Progress Tracker' switch is saved in writingSettings. Add its key to writingPref.ts's valid-value table so it syncs with the writing fact").
//
// THE REAL CODE, TWO (AND MORE) DEVICES, as writing-pref-saved.mjs does it (each device its own copy of the modules, the real server rules over an in-memory store, a fake clock).
// The goal's bridge (store/writingGoalPref.ts) is two things: module code (the apply from the account, the adoption, the sign-out) and ONE hook, useWritingGoalMirror(), mounted in
// App.tsx, whose effect calls observeGoal(goal) whenever the goal changes. A node check has no React, so a device's "effect" is the call to observeGoal with the value the goal
// just took (what the hook's effect does); W0 reads the two source lines that tie the hook to that call and to App.tsx, and MUT5/MUT6 break each.
//   G1  a reload keeps her goal: the device key AND a `goal` fact { n, unit } in the existing prefs key, in the server's shape
//   G2  a second device: after a round it has her goal in its own key, and the server holds { goal: { n, unit, at } }
//   G3  clearing is a choice too: B clears the goal (the key is the empty string) -> the fact is { off: true } and A's goal is cleared after a round
//   G4  two devices set it at once: the later stamp wins on both
//   G5  a goal set signed out reaches the account at sign-in
//   G6  a device with the reorg's switch ON reads the same goal
//   G7  a fresh account writes nothing: the shipped default (24 lines) is not an act, no fact, no prefs copy
//   G8  an older device with a goal of its own and no fact: it reaches the account at the first round (adoption), a fresh device gets it; a device holding only the default adopts nothing
//   G9  a value this build does not know (n -5, unit 'furlongs', a string) is never applied
//   G10 sign-out forgets it: the default again, the copy gone, and the next account's device adopts nothing
//   G11 no new storage key: only the goal's own device key and the existing prefs key
//   W13 (the theme-tracker switch, in the writing fact) `themeTracker` is a setting: true by default, false travels to a second device, a value that is not a boolean is never applied
//   W0  App.tsx mounts useWritingGoalMirror() and the hook's effect calls observeGoal
//   MUT1 the bridge deaf to the account (subscribePrefs(apply) removed): G2 goes RED
//   MUT2 no switchless fact ('goal' out of SWITCHLESS): G1 goes RED
//   MUT3 every observation is an act (the unchanged guard removed): G7 goes RED
//   MUT4 sign-out not wired: G10 goes RED
//   MUT5 the hook's effect does not call observeGoal: W0 goes RED
//   MUT6 `themeTracker` out of the valid-value table: W13 goes RED
// RED on the tree without src/store/writingGoalPref.ts. Run (from apps/desktop): node scripts/harness/writing-audit/writing-goal-saved.mjs. Exit 1 on any failure.
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

const hasBridge = fs.existsSync(path.join(SRC, 'store/writingGoalPref.ts'));
const hasSaved = fs.existsSync(path.join(SRC, 'reorg/prefsSaved.ts'));
console.log(`INFO tree: store/writingGoalPref.ts ${hasBridge ? 'present' : 'ABSENT'}; reorg/prefsSaved.ts ${hasSaved ? 'present' : 'ABSENT'}`);

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
    hasSaved ? "export * as saved from './reorg/prefsSaved';" : '', hasSaved ? "export * as split from './reorg/split/splitStore';" : '', hasBridge ? "export * as gb from './store/writingGoalPref';" : '', "export * as goal from './store/writingGoal';", "export * as rk from './reorg/railSavedKey';"].join(NL);
  const built = await esbuild.build({ stdin: { contents: entry, resolveDir: SRC, sourcefile: 'entry-goal.ts', loader: 'ts' }, bundle: true, format: 'esm', write: false, platform: 'node', plugins: [stubApi, mutate], logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' } });
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
const GKEY = 'wrizo-writing-goal-lines';
const WKEY = 'wrizo-writing-settings';
const DEFAULT = { n: 24, unit: 'lines' };
// the device's goal as the app reads it (store/writingGoal.ts load()): never set = the default, '' = cleared, JSON = the goal
const goalOf = (tag) => { const raw = stores[tag]?.get(GKEY); if (raw === undefined) return clone(DEFAULT); if (raw === '') return null; try { const v = JSON.parse(raw); return { n: v.n, unit: v.unit }; } catch { return clone(DEFAULT); } };
const eq = (a, b) => canon(a) === canon(b);
// a device's "effect": the hook calls observeGoal with the goal it just read (boot, and after every change)
const mount = async (d) => { d.mod.gb.observeGoal(goalOf(d.store)); await turns(); };
const setGoal = async (d, g) => { d.mod.goal.setWritingGoal(g); d.mod.gb.observeGoal(g); await turns(); };
const local = (tag) => { try { return JSON.parse(stores[tag]?.get(PREFS_KEY) ?? 'null'); } catch { return null; } };
const serverG = () => (db.prefs && db.prefs.goal) || null;
const plain = (f) => (f ? { n: f.n, unit: f.unit, off: f.off } : f);
const dev = async (tag, store = tag, o = {}) => { const d = await loadDevice(tag, store, o); d.store = store; await mount(d); return d; };

if (!hasBridge || !hasSaved || !rules) {
  for (const n of ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11']) ok(false, `${n} no bridge (src/store/writingGoalPref.ts): the goal stays on the device - another device or a fresh sign-in starts at 24 lines`);
} else {
  // G7 first, on a fresh account
  const F = await dev('F');
  await syncDev(F); await F.runTimers(); tick();
  ok(local('F') === null && db.prefs === null && stores.F.get(GKEY) === undefined, `G7 a fresh account: no prefs copy (${JSON.stringify(local('F'))}), nothing on the server (${JSON.stringify(db.prefs)}), no goal key (${stores.F.get(GKEY)})`);

  // G1 a reload keeps her goal
  const A = await dev('A');
  await setGoal(A, { n: 300, unit: 'words' }); tick();
  const kept = local('A');
  const A2 = await dev('A2', 'A');
  ok(eq(goalOf('A'), { n: 300, unit: 'words' }) && !!kept && !!kept.goal && kept.goal.n === 300 && kept.goal.unit === 'words' && typeof kept.goal.at === 'string',
    `G1 a reload keeps it: device ${JSON.stringify(goalOf('A'))}; the copy holds ${JSON.stringify(kept && kept.goal)}`);

  // G2 a second device
  await syncDev(A2); await A2.runTimers(); tick();
  const B = await dev('B');
  await syncDev(B); await B.runTimers(); tick();
  ok(eq(goalOf('B'), { n: 300, unit: 'words' }) && !!serverG() && serverG().n === 300 && serverG().unit === 'words',
    `G2 device B has A's goal after a round (${JSON.stringify(goalOf('B'))}); the server holds ${JSON.stringify(serverG())}`);

  // G3 clearing is a choice too
  await setGoal(B, null); tick(); await B.runTimers(); tick(); await round(A2);
  ok(!!serverG() && serverG().off === true && goalOf('A') === null && goalOf('B') === null, `G3 B clears it: the server holds ${JSON.stringify(serverG())}; A's goal ${JSON.stringify(goalOf('A'))}`);

  // G4 two devices set it at once
  await setGoal(A2, { n: 100, unit: 'lines' }); tick(5);
  await setGoal(B, { n: 500, unit: 'words' }); tick();
  await round(A2); await round(B); await round(A2);
  ok(eq(goalOf('A'), { n: 500, unit: 'words' }) && eq(goalOf('B'), { n: 500, unit: 'words' }) && !!serverG() && serverG().n === 500, `G4 100 lines on A, then 500 words on B a moment later: both read ${JSON.stringify(goalOf('A'))} / ${JSON.stringify(goalOf('B'))}; the server ${JSON.stringify(plain(serverG()))}`);

  // G5 a goal set signed out reaches the account at sign-in
  tick(60000);
  const C = await dev('C');
  await setGoal(C, { n: 40, unit: 'lines' }); tick();
  const before = clone(serverG());
  await syncDev(C); await C.runTimers(); tick();
  ok(!!before && before.n === 500 && !!serverG() && serverG().n === 40 && serverG().unit === 'lines', `G5 a goal set signed out reaches the account at sign-in: ${JSON.stringify(plain(before))} -> ${JSON.stringify(plain(serverG()))}`);

  // G6 a device with the reorg's switch ON
  const D = await dev('D', 'D', { reorg: true });
  await syncDev(D); await D.runTimers(); tick();
  ok(eq(goalOf('D'), { n: 40, unit: 'lines' }), `G6 a device with ?reorg=1 reads the same goal (${JSON.stringify(goalOf('D'))})`);

  // G8 an older device with a goal of its own and no fact; a device holding only the default adopts nothing
  db.prefs = null; tick(60000);
  stores.H = new Map([['writer-studio-journal-resync-v1', '1'], [GKEY, JSON.stringify({ n: 750, unit: 'words' })]]);
  const H = await dev('H', 'H');
  await syncDev(H); await H.runTimers(); tick();
  const J = await dev('J');
  await syncDev(J); await J.runTimers(); tick();
  const afterH = clone(serverG());
  db.prefs = null; tick(60000);
  stores.K = new Map([['writer-studio-journal-resync-v1', '1'], [GKEY, JSON.stringify({ n: 24, unit: 'lines' })]]);
  const K = await dev('K', 'K');
  await syncDev(K); await K.runTimers(); tick();
  ok(!!afterH && afterH.n === 750 && afterH.unit === 'words' && eq(goalOf('J'), { n: 750, unit: 'words' }) && db.prefs === null,
    `G8 an older device's goal reaches the account at its first round (${JSON.stringify(plain(afterH))}) and a fresh device gets it (${JSON.stringify(goalOf('J'))}); a device holding only the default adopts nothing (server ${JSON.stringify(db.prefs)})`);

  // G9 a value this build does not know is never applied
  const stamp = () => new Date(fakeNow + 1000).toISOString();
  db.prefs = { goal: { n: -5, unit: 'furlongs', at: stamp() } }; tick(2000);
  const E = await dev('E');
  await syncDev(E); await E.runTimers(); tick();
  const e1 = goalOf('E');
  db.prefs = { goal: { n: '12', unit: 'words', at: new Date(fakeNow + 1000).toISOString() } }; tick(2000);
  const E2 = await dev('E2');
  await syncDev(E2); await E2.runTimers(); tick();
  ok(eq(e1, DEFAULT) && eq(goalOf('E2'), DEFAULT), `G9 an unknown fact is not applied (n -5 / 'furlongs': ${JSON.stringify(e1)}; n '12': ${JSON.stringify(goalOf('E2'))})`);

  // G10 sign-out forgets it
  db.prefs = null; tick(60000);
  const S = await dev('S');
  await setGoal(S, { n: 99, unit: 'words' }); tick();
  S.mod.rk.clearRailLocal(); await turns(); tick();
  const S2 = await dev('S2', 'S');
  await syncDev(S2); await S2.runTimers(); tick();
  ok(eq(goalOf('S'), DEFAULT) && local('S') === null && db.prefs === null, `G10 sign-out: the default (${JSON.stringify(goalOf('S'))}), copy ${JSON.stringify(local('S'))}; the next account's device adopted nothing (server ${JSON.stringify(db.prefs)})`);

  // G11 no new storage key
  const keys = new Set(); for (const s of Object.values(stores)) for (const k of s.keys()) keys.add(k);
  const extra = [...keys].filter((k) => k !== PREFS_KEY && k !== GKEY && k !== 'writer-studio-journal-resync-v1' && !/^writer-studio-/.test(k));
  ok(extra.length === 0, `G11 the bridge writes only the goal's device key (${GKEY}) and the existing prefs key (${PREFS_KEY}); other keys: ${JSON.stringify(extra)}`);
}

// W13 the theme-tracker switch rides the writing fact (reads the settings module through the writing bridge, which this check does not load: the settings module alone is enough to see the key exists)
{
  const ws = fs.readFileSync(path.join(SRC, 'store/writingSettings.ts'), 'utf8');
  const wp = fs.existsSync(path.join(SRC, 'store/writingPref.ts')) ? fs.readFileSync(path.join(SRC, 'store/writingPref.ts'), 'utf8') : '';
  const inInterface = /themeTracker: boolean;/.test(ws);
  const inDefaults = /themeTracker: true,/.test(ws);
  const inValid = /themeTracker: isBool,/.test(wp);
  ok(inInterface && inDefaults && inValid, `W13 themeTracker is a setting (the interface ${inInterface}, true in DEFAULTS ${inDefaults}) and in the writing bridge's valid-value table (${inValid})`);
}

// W0 the hook is mounted and its effect observes
{
  const app = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf8');
  const gp = hasBridge ? fs.readFileSync(path.join(SRC, 'store/writingGoalPref.ts'), 'utf8') : '';
  const mounted = /useWritingGoalMirror\(\);/.test(app) && /from '\.\/store\/writingGoalPref'/.test(app);
  const observes = /export function useWritingGoalMirror\(\)[\s\S]*useEffect\(\(\) => \{ observeGoal\(goal\); \}, \[goal\]\)/.test(gp);
  ok(mounted && observes, `W0 App.tsx mounts useWritingGoalMirror() (${mounted}) and its effect calls observeGoal on every goal change (${observes})`);
}

// ---- the mutants ----
const asMutant = async (m, run) => { MUTANT = { ...m, landed: false }; bundleCode = null; db.prefs = null; try { return { landed: false, ...(await run()), landedSrc: MUTANT.landed }; } finally { MUTANT = null; bundleCode = null; } };
if (hasBridge && hasSaved && rules) {
  const m1 = await asMutant({ file: 'src/store/writingGoalPref.ts', from: 'subscribePrefs(apply);' + NL, to: NL }, async () => {
    const X = await dev('M1a'); await setGoal(X, { n: 7, unit: 'words' }); tick(); await syncDev(X); await X.runTimers(); tick();
    const Y = await dev('M1b'); await syncDev(Y); await Y.runTimers(); tick();
    return { g2: eq(goalOf('M1b'), { n: 7, unit: 'words' }), y: goalOf('M1b') };
  });
  ok(m1.landedSrc && !m1.g2, `MUT1 the bridge deaf to the account (LANDED: ${m1.landedSrc}): the second device reads ${JSON.stringify(m1.y)} - G2's read goes RED`);
  const m2 = await asMutant({ file: 'src/reorg/prefsSaved.ts', from: "'goal'", to: "'goalX'" }, async () => {
    const X = await dev('M2a'); await setGoal(X, { n: 7, unit: 'words' }); tick();
    return { g1: !!(local('M2a') && local('M2a').goal), copy: local('M2a') };
  });
  ok(m2.landedSrc && !m2.g1, `MUT2 no switchless fact (LANDED: ${m2.landedSrc}): the copy holds ${JSON.stringify(m2.copy)} - G1's read goes RED`);
  const m3 = await asMutant({ file: 'src/store/writingGoalPref.ts', from: 'if (c === base) return;', to: '' }, async () => {
    const X = await dev('M3a'); X.mod.gb.observeGoal(clone(DEFAULT)); await turns(); await X.runTimers(); tick();
    return { g7: local('M3a') === null, copy: local('M3a') };
  });
  ok(m3.landedSrc && !m3.g7, `MUT3 every observation is an act (LANDED: ${m3.landedSrc}): a fresh device's default leaves ${JSON.stringify(m3.copy)} - G7's read goes RED`);
  const m4 = await asMutant({ file: 'src/store/writingGoalPref.ts', from: 'onRailReset(resetGoal);', to: '' }, async () => {
    const X = await dev('M4a'); await setGoal(X, { n: 99, unit: 'words' }); tick(); X.mod.rk.clearRailLocal(); await turns();
    return { g10: eq(goalOf('M4a'), DEFAULT), g: goalOf('M4a') };
  });
  ok(m4.landedSrc && !m4.g10, `MUT4 sign-out not wired (LANDED: ${m4.landedSrc}): after sign-out the goal is ${JSON.stringify(m4.g)} - G10's read goes RED`);
  const gp = fs.readFileSync(path.join(SRC, 'store/writingGoalPref.ts'), 'utf8');
  const mutated = gp.replace('observeGoal(goal);', '');
  ok(mutated !== gp && !/useEffect\(\(\) => \{ observeGoal\(goal\); \}, \[goal\]\)/.test(mutated), `MUT5 the hook's effect does not call observeGoal (LANDED: ${mutated !== gp}) - W0's read goes RED`);
  const wp = fs.readFileSync(path.join(SRC, 'store/writingPref.ts'), 'utf8');
  const wpm = wp.replace('themeTracker: isBool,', '');
  ok(wpm !== wp && !/themeTracker: isBool,/.test(wpm), `MUT6 themeTracker out of the valid-value table (LANDED: ${wpm !== wp}) - W13's read goes RED`);
}

console.log(`INFO requests: ${requests.length}`);
console.log(fails === 0 ? `\nWRITING-GOAL-SAVED VERIFY: PASS (${checks} checks)` : `\nWRITING-GOAL-SAVED VERIFY: FAIL - ${fails}/${checks} failed`);
process.exit(fails === 0 ? 0 : 1);
