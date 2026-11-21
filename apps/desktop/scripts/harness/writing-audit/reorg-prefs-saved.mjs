// BROWSERLESS CHECK for the reorg's account preferences (FIX; Nick's SAVED DATA ruling, Nov 19, 4:05 pm: split side and width, the linked-assets toggle, the last search word and
// her own templates follow her to every device; Fable, Nov 19, 7:00 pm: "a NEW users.prefs jsonb column with its own GET/PUT, built the way 26b built users.rail and /api/rail, NOT
// inside rail: its PUT replaces the whole blob. Red-first, then swap splitStore.ts's two functions").
//
// THE REAL CODE, TWO (AND MORE) DEVICES, as reorg-rail-saved.mjs does it: each device is its own copy of the app's modules (src/reorg/prefsSaved.ts with src/reorg/split/splitStore.ts,
// the persistence layer and the sync engine), bundled with the esbuild that ships with vite, each with its OWN storage, window, fetch and timers. The SERVER is the real rules module
// (apps/server/src/prefs.ts: compare-and-swap, the shape, the size) over an in-memory store that keeps the SQL's contract (prefsRoutes.ts: `prefs is not distinct from $base::jsonb`,
// jsonb equality is semantic). A fake clock makes every "at once" exact. NOT covered here: the SQL itself (no Postgres on the box or on Actions); the rules it runs are this file's.
//
//   S1  the server's shape rule: a record that is not a map, a fact without a stamp, a bad fact name, more than 32 facts: 400; a good record: 200
//   S2  compare-and-swap: a PUT over a base that is no longer stored is 409 and writes nothing; over the right base it lands; two PUTs from one base, one lands
//   S3  a record over 128 KB is 413
//   S4  it is its OWN door: a prefs PUT never touches the rail's column, and a rail PUT never touches the prefs' (the rail's PUT replaces its whole blob; prefs must not ride in it)
//   P1  a reload keeps her split width (the local copy alone), in ONE key holding the record in the server's shape { split: { side, width, at } }
//   P2  a second device sees it after a round, and its splitStore reads the width (the account -> the store)
//   P3  two devices set DIFFERENT preferences at once (the split on A, the search word on B): both everywhere, one order of keys
//   P4  two devices set the SAME preference at once: the later stamp wins on both, and a tie settles by value, the same on both
//   P5  two devices' rounds interleave (GET, GET, PUT, PUT): the second PUT is refused 409, merged again, and nothing is lost
//   P6  sign-out clears the local copy and the memory
//   P7  switch off: no storage key, no prefs request (PARKED Nov 20: the room is saved with the switch off - successor P7b below, with its mutant)
//   P8  the wiring: an act made signed in reaches the server by itself one second later
//   P9  a width she has not set is the default (half); setting the width she already has writes nothing
//   U1-U3 the merge: same result from either side, merging twice changes nothing, a tie settles by value
// RED on the tree without src/reorg/prefsSaved.ts and apps/server/src/prefs.ts. Run: node scripts/harness/writing-audit/reorg-prefs-saved.mjs (from apps/desktop; on Actions via
// writing-audit.yml, script=reorg-prefs-saved.mjs). Exit 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', '..', 'src');
const SERVER_PREFS = path.resolve(here, '..', '..', '..', '..', 'server', 'src', 'prefs.ts');
const SERVER_RAIL = path.resolve(here, '..', '..', '..', '..', 'server', 'src', 'rail.ts');
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
const NL = String.fromCharCode(10);

let fails = 0;
let checks = 0;
const ok = (cond, msg) => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) fails += 1; };

const hasSaved = fs.existsSync(path.join(SRC, 'reorg/prefsSaved.ts'));
const hasServer = fs.existsSync(SERVER_PREFS);
console.log(`INFO tree: prefsSaved.ts ${hasSaved ? 'present' : 'ABSENT'}; server prefs.ts ${hasServer ? 'present' : 'ABSENT'}`);

// ---- the clock ---------------------------------------------------------------------------------------------------------
let fakeNow = Date.parse('2026-11-19T20:00:00.000Z');
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

// ---- the server: the real rules over an in-memory store ----------------------------------------------------------------
const USER = 'user-1';
const db = { prefs: null, rail: null, casFails: 0, prefsPuts: 0, railPuts: 0 };
let rules = null;
let railRules = null;
const build = async (entry) => {
  const built = await esbuild.build({ entryPoints: [entry], bundle: true, format: 'esm', write: false, platform: 'node', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
};
if (hasServer) rules = await build(SERVER_PREFS);
if (fs.existsSync(SERVER_RAIL)) railRules = await build(SERVER_RAIL);
const prefsStore = {
  async getPrefs() { return clone(db.prefs); },
  // `prefs is not distinct from $base::jsonb`: jsonb equality is semantic, so key order does not count
  async casPrefs(_u, base, next) { if (canon(db.prefs) !== canon(base)) { db.casFails += 1; return false; } db.prefs = clone(next); return true; },
};
const railStore = {
  async getRail() { return clone(db.rail); },
  async casRail(_u, base, next) { if (canon(db.rail) !== canon(base)) return false; db.rail = clone(next); return true; },
  async purgedDrawerIds() { return new Set(); },
  async getPicture() { return null; }, async putPicture() { return 'stored'; }, async pictureCount() { return 0; }, async deletePictureIfOlder() {},
};
const reply = (r) => new Response(JSON.stringify(r.json ?? {}), { status: r.status, headers: { 'Content-Type': 'application/json' } });
const requests = [];
async function serve(tag, url, opts = {}) {
  const u = new URL(url, 'http://wrizo.test');
  const method = (opts.method || 'GET').toUpperCase();
  requests.push(`${tag} ${method} ${u.pathname}`);
  if (!rules || db.down) return new Response('{"error":"not found"}', { status: 404 });
  if (u.pathname === '/api/prefs' && method === 'GET') return reply(await rules.prefsGet(prefsStore, USER));
  if (u.pathname === '/api/prefs' && method === 'PUT') { db.prefsPuts += 1; return reply(await rules.prefsPut(prefsStore, USER, JSON.parse(opts.body))); }
  return new Response('{"error":"not found"}', { status: 404 });
}
// the /sync double: nothing to push or pull here (the preferences are not part of /sync); it only lets a device's status reach 'synced'
globalThis.__apiSync = async () => ({ serverTime: new Date().toISOString(), pull: {} });

// ---- the devices -------------------------------------------------------------------------------------------------------
const stores = {};
const stubApi = { name: 'stub-api', setup(b) {
  b.onResolve({ filter: /(^|\/)api$/ }, (a) => (a.importer.includes(`${path.sep}store${path.sep}`) || a.importer.includes('/store/') ? { path: 'api-stub', namespace: 'stub-api' } : null));
  b.onLoad({ filter: /.*/, namespace: 'stub-api' }, () => ({ contents: 'export class SyncHttpError extends Error { constructor(status) { super("sync failed: " + status); this.status = status; } } export const apiSync = (p) => globalThis.__apiSync(p); export const postJson = async () => ({ ok: true, status: 200, json: async () => ({}) });', loader: 'js' }));
} };
let bundleCode = null;
// MUT-P7b (ARBOR, Nov 20): one source file changed in memory (the file on disk untouched) for the next devices loaded
let MUTANT = null;
const mutate = { name: 'mutate', setup(b) {
  b.onLoad({ filter: /\.ts$/ }, (a) => {
    if (!MUTANT || !a.path.split(path.sep).join('/').endsWith(MUTANT.file)) return null;
    const src = fs.readFileSync(a.path, 'utf8').split('\r\n').join(NL);
    MUTANT.landed = src.includes(MUTANT.from);
    return { contents: src.replace(MUTANT.from, MUTANT.to), loader: 'ts' };
  });
} };
async function bundle() {
  if (bundleCode) return bundleCode;
  const entry = ["export * as persist from './store/persistence';", "export { syncOnce } from './store/sync';", hasSaved ? "export * as saved from './reorg/prefsSaved';" : '', hasSaved ? "export * as split from './reorg/split/splitStore';" : ''].join(NL);
  const built = await esbuild.build({ stdin: { contents: entry, resolveDir: SRC, sourcefile: 'entry-prefs.ts', loader: 'ts' }, bundle: true, format: 'esm', write: false, platform: 'node', plugins: [stubApi, mutate], logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' } });
  bundleCode = built.outputFiles[0].text;
  return bundleCode;
}
const devs = {};
async function loadDevice(tag, store = tag, { reorg = true } = {}) {
  if (!stores[store]) stores[store] = new Map([['writer-studio-journal-resync-v1', '1']]);
  const ls = stores[store];
  const timers = [];
  const listeners = {};
  const dev = {
    tag, hold: null, gotPrefs: null, timers,
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k), get length() { return ls.size; }, key: (i) => [...ls.keys()][i] ?? null },
    location: { search: reorg ? '?reorg=1' : '', hash: '', href: `http://wrizo.test/${reorg ? '?reorg=1' : ''}` },
    setTimeout: (fn, ms = 0) => { const t = { fn, ms, done: false }; timers.push(t); return t; },
    clearTimeout: (t) => { if (t) t.done = true; },
    async fetch(url, opts) {
      const res = await serve(tag, url, opts);
      if (dev.hold && String(url).endsWith('/api/prefs') && (!opts || !opts.method || opts.method === 'GET')) { const h = dev.hold; dev.hold = null; if (dev.gotPrefs) dev.gotPrefs(); await h; }
      return res;
    },
  };
  dev.window = { addEventListener: (t, f) => { (listeners[t] ||= []).push(f); }, removeEventListener() {}, setTimeout: dev.setTimeout, clearTimeout: dev.clearTimeout, localStorage: dev.localStorage, location: dev.location };
  dev.document = { addEventListener() {}, removeEventListener() {}, visibilityState: 'visible', documentElement: { setAttribute() {}, getAttribute() { return null; } }, querySelector() { return null; } };
  globalThis.__dev = globalThis.__dev || {};
  globalThis.__dev[tag] = dev;
  const prelude = ['localStorage', 'location', 'window', 'document', 'setTimeout', 'clearTimeout'].map((n) => `const ${n} = globalThis.__dev[${JSON.stringify(tag)}].${n};`).join(NL)
    + `${NL}const fetch = (u, o) => globalThis.__dev[${JSON.stringify(tag)}].fetch(u, o);${NL}`;
  const code = prelude + (await bundle()) + `${NL}// device ${tag}`;
  dev.mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  dev.runTimers = async () => { for (let pass = 0; pass < 5; pass += 1) { const due = timers.filter((t) => !t.done); if (!due.length) break; for (const t of due) { t.done = true; t.fn(); } await turns(); } };
  devs[tag] = dev;
  return dev;
}
const round = async (d) => { if (d.mod.saved) await d.mod.saved.syncPrefs(); };
const syncDev = async (d) => { await d.mod.syncOnce(); d.timers.forEach((t) => { t.done = true; }); };
const widthOf = (d) => d.mod.split.getSplitWidth();
const factOf = (d, name) => d.mod.saved.getPref(name);
const local = (tag) => stores[tag]?.get('wrizo-reorg-prefs') ?? null;

// ---- S: the server's rules ---------------------------------------------------------------------------------------------
const at = (s) => `2026-11-19T21:00:${String(s).padStart(2, '0')}.000Z`;
if (!hasServer) {
  for (const n of ['S1 shape', 'S2 compare-and-swap', 'S3 size', 'S4 its own door']) ok(false, `${n}: no apps/server/src/prefs.ts`);
} else {
  const put = (prefs, base = null) => rules.prefsPut(prefsStore, USER, { prefs, base });
  db.prefs = null;
  const bad = [await put('x'), await put([1]), await put({ split: { side: 'right', width: 0.5 } }), await put({ 'Bad Name': { at: at(1) } }), await put({ split: 'x' }),
    await put(Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`f${i}`, { at: at(1) }])))];
  const good = await put({ split: { side: 'right', width: 0.4, at: at(1) } });
  ok(bad.every((r) => r.status === 400) && good.status === 200, `S1 shape: junk is 400 (${bad.map((r) => r.status).join(',')}), a good record 200 (${good.status})`);
  const v1 = clone(db.prefs);
  const stale = await put({ split: { side: 'right', width: 0.6, at: at(2) } }, { split: { side: 'right', width: 0.9, at: at(0) } });
  const noWrite = canon(db.prefs) === canon(v1);
  const right = await put({ split: { side: 'right', width: 0.6, at: at(2) } }, v1);
  const raced = [await put({ a: { at: at(3) } }, clone(db.prefs)), await put({ b: { at: at(3) } }, v1)];
  ok(stale.status === 409 && noWrite && right.status === 200 && raced[0].status === 200 && raced[1].status === 409, `S2 a stale base is 409 and writes nothing (${stale.status}, kept ${noWrite}); the right base lands (${right.status}); two PUTs from one base, one lands (${raced.map((r) => r.status).join(',')})`);
  const big = { templates: { at: at(4), items: ['x'.repeat(1024)].concat(Array.from({ length: 140 }, () => 'y'.repeat(1024))) } };
  const over = await put(big, clone(db.prefs));
  ok(over.status === 413, `S3 a record over 128 KB is refused: ${over.status}`);
  if (!railRules) ok(false, 'S4 no rail rules to compare with');
  else {
    db.prefs = null; db.rail = null;
    await put({ split: { side: 'right', width: 0.3, at: at(1) } });
    const rp = await railRules.railPut(railStore, USER, { rail: { pins: { d1: { order: 1, at: at(2) } } }, base: null });
    ok(db.rail && db.rail.pins && db.prefs && db.prefs.split && !db.rail.split && !db.prefs.pins && rp.status === 200, `S4 its own door: the rail's PUT left the prefs alone and the prefs' PUT left the rail alone (rail ${JSON.stringify(db.rail && Object.keys(db.rail))}, prefs ${JSON.stringify(db.prefs && Object.keys(db.prefs))})`);
  }
}
db.prefs = null; db.rail = null;

if (!hasSaved) {
  for (const n of ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'U1', 'U2', 'U3']) ok(false, `${n} no client (src/reorg/prefsSaved.ts): the split width lives in memory/on the device and nothing is asked of the server`);
} else {
  const A = await loadDevice('A');
  const B = await loadDevice('B');
  await syncDev(A); await syncDev(B); tick();

  // P9 - the default, and an act of the same value is no act
  const dflt = widthOf(A);
  await A.runTimers();
  ok(dflt === 0.5 && local('A') === null, `P9 a width she has never set is half (${dflt}), and reading it stores nothing (key ${local('A')})`);
  A.mod.split.setSplitWidth(0.62); tick();
  const had = local('A');
  A.mod.split.setSplitWidth(0.62);
  ok(local('A') === had && had !== null, 'P9 setting the width she already has writes nothing more');

  // P1 - a reload keeps it (no round)
  const A2 = await loadDevice('A2', 'A');
  const kept = JSON.parse(local('A') || 'null');
  ok(widthOf(A2) === 0.62 && kept && kept.split && kept.split.side === 'right' && kept.split.width === 0.62 && typeof kept.split.at === 'string' && Object.keys(kept).join() === 'split',
    `P1 a reload keeps the width (${widthOf(A2)}); the key holds the record in the server's shape (${local('A')})`);

  // P2 - a second device
  tick(); await round(A2); tick(); await round(B);
  ok(B.mod.saved.getPref('split')?.width === 0.62 && widthOf(B) === 0.62 && db.prefs && db.prefs.split && db.prefs.split.width === 0.62, `P2 device B has A's width after a round, and its splitStore reads it (${widthOf(B)}); the server holds it (${JSON.stringify(db.prefs && db.prefs.split && db.prefs.split.width)})`);

  // P3 - different preferences at once
  tick();
  A2.mod.saved.setPref('linkedAssets', { on: true });
  B.mod.saved.setPref('searchWord', { word: 'toll' });
  await round(A2); await round(B); await round(A2);
  ok(factOf(A2, 'searchWord')?.word === 'toll' && factOf(B, 'linkedAssets')?.on === true && factOf(A2, 'linkedAssets')?.on === true && factOf(B, 'searchWord')?.word === 'toll'
    && Object.keys(db.prefs).sort().join() === 'linkedAssets,searchWord,split', `P3 both preferences stand on both devices and the server (${Object.keys(db.prefs).sort().join()})`);
  ok(canon(A2.mod.saved.getSavedPrefs()) === canon(B.mod.saved.getSavedPrefs()), 'P3 both devices hold one record');

  // P4 - the same preference at once: the later stamp wins
  tick();
  A2.mod.split.setSplitWidth(0.3);
  tick(5);
  B.mod.split.setSplitWidth(0.7);
  await round(A2); await round(B); await round(A2);
  ok(widthOf(A2) === 0.7 && widthOf(B) === 0.7 && db.prefs.split.width === 0.7, `P4 the later act wins on both (A ${widthOf(A2)}, B ${widthOf(B)}, server ${db.prefs.split.width})`);
  // a tie (the same stamp): the larger value on both, whichever side it came from
  tick();
  A2.mod.saved.setPref('searchWord', { word: 'aaa' });
  const tieAt = factOf(A2, 'searchWord').at;
  const merged1 = A2.mod.saved.mergePrefs({ searchWord: { word: 'aaa', at: tieAt } }, { searchWord: { word: 'zzz', at: tieAt } });
  const merged2 = A2.mod.saved.mergePrefs({ searchWord: { word: 'zzz', at: tieAt } }, { searchWord: { word: 'aaa', at: tieAt } });
  ok(canon(merged1) === canon(merged2) && merged1.searchWord.word === 'zzz', `P4 a tie settles by value, the same from either side (${merged1.searchWord.word})`);

  // P5 - interleaved rounds: A GETs, B GETs and PUTs, then A PUTs over a base that is no longer there
  tick();
  A2.mod.saved.setPref('linkedAssets', { on: false });
  B.mod.saved.setPref('searchWord', { word: 'ledger' });
  tick();
  const fails0 = db.casFails;
  let release;
  A2.hold = new Promise((r) => { release = r; });
  const gotIt = new Promise((r) => { A2.gotPrefs = r; });
  const pa = round(A2);
  await gotIt;
  await round(B);
  A2.gotPrefs = null;
  release();
  await pa;
  ok(db.casFails > fails0, `P5 A's stale PUT was refused (409s: ${db.casFails - fails0})`);
  ok(db.prefs.linkedAssets.on === false && db.prefs.searchWord.word === 'ledger', `P5 the server holds both acts right after A's round, before B rounds again (nothing written over): ${JSON.stringify([db.prefs.linkedAssets.on, db.prefs.searchWord.word])}`);

  // P6 - sign-out takes it all
  B.mod.persist.resetLocalData();
  ok(!stores.B.has('wrizo-reorg-prefs') && Object.keys(B.mod.saved.getSavedPrefs()).length === 0 && widthOf(B) === 0.5, `P6 sign-out clears the local copy and the memory (key ${stores.B.has('wrizo-reorg-prefs') ? 'KEPT' : 'gone'}, facts ${Object.keys(B.mod.saved.getSavedPrefs()).length}, width ${widthOf(B)})`);

  // P7 - switch off
  // PARKED 2026-11-20 (ARBOR, arbor/room-pref). SUPERSEDED by Fable, Nov 19, 11:20 pm: "The room choice (Automatic / Day / Night) is SAVED TO THE ACCOUNT, for Machina
  // AND Arbor ... Store it as a `room` fact in users.prefs". The room is not a reorg feature, so prefsSaved.ts keeps it SWITCHLESS: a switch-off device must ask the account
  // for the room another device chose, so "no prefs request" can no longer hold (measured: 1 request, the GET of the round, on the room build). Original, verbatim:
  // {
  //   const O = await loadDevice('O', 'O', { reorg: false });
  //   await syncDev(O);
  //   O.mod.saved.setPref('split', { side: 'right', width: 0.4 }); O.mod.split.setSplitWidth(0.4);
  //   await O.runTimers(); await round(O);
  //   ok(!stores.O.has('wrizo-reorg-prefs') && !requests.some((r) => r.startsWith('O ')), `P7 switch off: no storage key, no prefs request (${requests.filter((r) => r.startsWith('O ')).length} requests)`);
  // }
  // SUCCESSOR P7b: switch off - no storage key (the account's reorg facts are never kept on the device), no reorg fact set, and the only prefs request a GET: the round
  // reads the account (for the room) and writes nothing, since she set nothing switchless. MUT-P7b: persist()'s switch-off filter removed (in memory): the account's reorg
  // facts land in the key and P7b goes RED. (The room itself: room-pref-saved.mjs.)
  const p7b = async (tag) => {
    const O = await loadDevice(tag, tag, { reorg: false });
    await syncDev(O);
    O.mod.saved.setPref('split', { side: 'right', width: 0.4 }); O.mod.split.setSplitWidth(0.4);
    await O.runTimers(); await round(O);
    const reqs = requests.filter((r) => r.startsWith(`${tag} `));
    return { key: stores[tag].has('wrizo-reorg-prefs'), reqs, pass: !stores[tag].has('wrizo-reorg-prefs') && reqs.length >= 1 && reqs.every((r) => r === `${tag} GET /api/prefs`) && !(db.prefs && db.prefs.split && db.prefs.split.width === 0.4) };
  };
  {
    const r = await p7b('O');
    ok(r.pass, `P7b switch off: no storage key (${r.key ? 'KEPT' : 'none'}), no reorg fact set, the only prefs requests GETs (${JSON.stringify(r.reqs)})`);
    MUTANT = { file: 'src/reorg/prefsSaved.ts', from: 'const mine: PrefsRecord = REORG ? prefs : {', to: 'const mine: PrefsRecord = true ? prefs : {', landed: false }; bundleCode = null;
    let m = null;
    try { m = await p7b('OM'); } finally { const landed = MUTANT.landed; MUTANT = null; bundleCode = null; m = m && { ...m, landed }; }
    ok(!!m && m.landed && !m.pass, `MUT-P7b persist()'s switch-off filter removed (LANDED: ${m && m.landed}): the key is ${m && m.key ? 'written' : 'absent'} - P7b's read goes RED`);
  }

  // P8 - the wiring
  {
    const W = await loadDevice('W');
    await W.mod.syncOnce();
    await W.runTimers(); tick();
    const puts0 = db.prefsPuts;
    W.mod.saved.setPref('templates', { items: ['mine'] });
    const queued = W.timers.filter((t) => !t.done).map((t) => t.ms);
    tick(1000);
    await W.runTimers();
    ok(queued.includes(1000) && db.prefsPuts > puts0 && db.prefs.templates && db.prefs.templates.items[0] === 'mine', `P8 a preference set signed in is on the server one second later (queued ${JSON.stringify(queued)}, PUTs ${db.prefsPuts - puts0})`);
  }

  // U - the merge itself
  {
    const { mergePrefs } = A2.mod.saved;
    const x = { split: { side: 'right', width: 0.3, at: at(1) }, searchWord: { word: 'a', at: at(5) } };
    const y = { split: { side: 'right', width: 0.8, at: at(2) }, linkedAssets: { on: true, at: at(1) }, searchWord: { word: 'b', at: at(5) } };
    const xy = mergePrefs(x, y);
    const yx = mergePrefs(y, x);
    ok(canon(xy) === canon(yx), 'U1 merge(a,b) equals merge(b,a)');
    ok(canon(mergePrefs(xy, xy)) === canon(xy) && canon(mergePrefs(xy, x)) === canon(xy) && canon(mergePrefs(xy, y)) === canon(xy), 'U2 merging again changes nothing');
    ok(xy.split.width === 0.8 && xy.searchWord.word === 'b' && xy.linkedAssets.on === true && mergePrefs({ split: { side: 'right', at: 'nonsense' }, ['Bad']: { at: at(1) } }, null).split === undefined, `U3 the later stamp wins (split ${xy.split.width}), a tie settles by value (word ${xy.searchWord.word}), junk is dropped`);
  }
}

console.log(`INFO checks ${checks}, failing ${fails}`);
console.log(`REORG-PREFS-SAVED: ${fails ? `FAIL - ${fails}` : 'PASS'}`);
process.exit(fails ? 1 : 0);
