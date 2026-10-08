// B10.1 — DEFENCE IN DEPTH after the stale-tab incident (not reproducible in two box turns, so it ships as five defences).
//
//   1  THE STALE-CLIENT GUARD   the server reports its build; an older tab stops syncing, goes READ-ONLY and asks to reload.
//                               Web-only: Electron / file:// / cross-origin / dev tabs have no build and never go stale.
//   2  THE LANDING WAITS        a sign-in waits (capped) for the first whole-account pull before choosing resume vs new page.
//   3  FIRST-RUN PER ACCOUNT    register = first run; a sign-in is first run only after a COMPLETED pull of an EMPTY account.
//   4  startSync GENERATION     a sign-out during the boot sync installs no timer and no listeners afterwards.
//   5  THE SAFETY NET           a full pull that carried live pages but left none in the cache: one retry, then counts only.
//
// This file runs the REAL sync.ts, persistence.ts, firstRun.ts, staleClient.ts, clientBuild.ts and syncNotice.ts (bundled with
// esbuild against a fake browser) with ONE module replaced: api.ts, a controllable network. Nothing here needs a box turn.
// The live 177-row walk for items 2 and 3 is b101-walk.mjs (a box turn).
//
// Browserless. Run: node scripts/harness/b101.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const SERVER_SRC = path.resolve(DESKTOP, '..', 'server', 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
// esbuild is vite's dependency, not the desktop app's own: resolve it through vite, as logout-flush.mjs does.
const { build } = createRequire(require.resolve('vite'))('esbuild');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8').replace(/\r\n?/g, '\n');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- a timer/listener spy, installed once -----------------------------------------------------------------
const realSetInterval = globalThis.setInterval;
let intervalsInstalled = 0;
globalThis.setInterval = (fn, ms, ...rest) => { intervalsInstalled += 1; return realSetInterval(fn, ms, ...rest); };

// ---- a fresh module instance + fake browser per call -------------------------------------------------------
const STUB_API = `
export class SyncHttpError extends Error { constructor(status) { super('sync failed: ' + status); this.status = status; } }
export const net = { calls: [], responder: null, hold: false, pending: [] };
const empty = () => ({ serverTime: '2026-01-01T00:00:00.000Z', pull: { projects: [], storyPlans: [], sessions: [], drafts: [], drawers: [], journalEntries: [] } });
export function apiSync(payload) {
  net.calls.push(payload);
  if (net.hold) return new Promise((resolve, reject) => { net.pending.push({ payload, resolve, reject }); });
  try { return Promise.resolve(net.responder ? net.responder(payload, net.calls.length) : empty()); } catch (e) { return Promise.reject(e); }
}
`;
const MODULES = ['persistence', 'sync', 'firstRun', 'staleClient', 'clientBuild', 'syncNotice', 'currentUser', 'flushRegistry'];
let nonce = 0;
let previous = null;
const noCR = (t) => t.replace(/\r\n?/g, '\n');

async function load(overrides = {}, env = {}) {
  nonce += 1;
  // Retire the previous instance while ITS globals are still installed, then install the new ones only after the build.
  if (previous) { try { previous.sync.stopSync(); previous.persistence.resetLocalData(); } catch { /* best effort */ } previous = null; }
  const res = await build({
    stdin: { contents: `export const __nonce = ${nonce};\n` + MODULES.map((m) => `export * from './store/${m}';`).join('\n') + `\nexport { net } from 'stub-api';`, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    nodePaths: [path.join(DESKTOP, 'node_modules')],
    plugins: [{ name: 'ov', setup(b) {
      b.onResolve({ filter: /^stub-api$/ }, () => ({ path: 'stub-api', namespace: 'stub' }));
      b.onResolve({ filter: /\/api$/ }, (a) => (a.resolveDir.endsWith('store') ? { path: 'stub-api', namespace: 'stub' } : undefined));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: STUB_API, loader: 'js' }));
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const rel = path.relative(SRC, args.path).split('\\').join('/');
        const text = noCR(fs.readFileSync(args.path, 'utf8'));
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  const map = new Map();
  // The resync key set up front: the one-time journal backfill would otherwise schedule an extra sync and blur the counts.
  map.set('writer-studio-journal-resync-v1', '1');
  for (const [k, v] of Object.entries(env.storage ?? {})) map.set(k, v);
  const listenerLog = [];
  const scripts = env.scripts ?? ['./assets/index-OLDBUILD.js'];
  globalThis.window = { addEventListener: (t) => listenerLog.push('+' + t), removeEventListener: (t) => listenerLog.push('-' + t) };
  globalThis.document = {
    visibilityState: 'visible',
    addEventListener: (t) => listenerLog.push('+' + t), removeEventListener: (t) => listenerLog.push('-' + t),
    querySelectorAll: () => scripts.map((src) => ({ getAttribute: () => src })),
  };
  globalThis.location = env.location ?? { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: env.userAgent ?? 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
  };
  globalThis.__dropJournalApply = false;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
  previous = { sync: mod, persistence: mod };
  return { m: mod, map, net: mod.net, listenerLog };
}
const swap = (from, to) => (t) => { if (!t.includes(from)) throw new Error('mutation anchor missing: ' + JSON.stringify(from.slice(0, 90))); return t.replace(from, () => to); };

const EMPTY = () => ({ projects: [], storyPlans: [], sessions: [], drafts: [], drawers: [], journalEntries: [] });
const entry = (id, over = {}) => ({ id, text: 'words', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', source: 'page', origin: 'journal', ...over });
const sysBoard = (id) => entry(id, { pageType: 'board', boxes: [{ id: 'bm', kind: 'board-meta', systemKind: 'journal' }] });
const project = (id) => ({ id, title: 'P', type: 'creative', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
const reply = (over = {}) => ({ serverTime: '2026-01-02T00:00:00.000Z', pull: { ...EMPTY(), ...(over.pull ?? {}) }, ...(over.build ? { build: over.build } : {}) });
const user = { id: 'u1', email: 'a@b.c', name: 'A' };

// =============================================================================
// PART A — WHICH BUILD AM I? (clientBuild.ts) — the web-only exemptions, as pure logic.
// =============================================================================
async function partA(overrides = {}) {
  const { m } = await load(overrides);
  const web = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/', userAgent: 'Mozilla/5.0 Chrome/128' };
  return {
    web: m.parseClientBuild({ ...web, scriptSrcs: ['./assets/index-DkqE6EFm.js'] }),
    abs: m.parseClientBuild({ ...web, scriptSrcs: ['/assets/index-Abc_12-x.js?v=3'] }),
    file: m.parseClientBuild({ ...web, protocol: 'file:', origin: 'null', href: 'file:///C:/app/index.html', scriptSrcs: ['./assets/index-DkqE6EFm.js'] }),
    electron: m.parseClientBuild({ ...web, userAgent: 'Mozilla/5.0 Electron/31.0.0 Chrome/128', scriptSrcs: ['./assets/index-DkqE6EFm.js'] }),
    electronHttp: m.parseClientBuild({ ...web, protocol: 'http:', origin: 'http://localhost:5173', href: 'http://localhost:5173/#/', userAgent: 'Electron/31.0.0', scriptSrcs: ['./assets/index-DkqE6EFm.js'] }),
    crossOrigin: m.parseClientBuild({ ...web, scriptSrcs: ['https://cdn.other.test/assets/index-DkqE6EFm.js'] }),
    dev: m.parseClientBuild({ ...web, scriptSrcs: ['/src/main.tsx', '/@vite/client'] }),
    none: m.parseClientBuild({ ...web, scriptSrcs: [] }),
    chunkNotEntry: m.parseClientBuild({ ...web, scriptSrcs: ['./assets/vendor-ZZZ.js'] }),
    staleTable: [
      m.buildIsStale('index-A', 'index-B'), m.buildIsStale('index-A', 'index-A'),
      m.buildIsStale(null, 'index-B'), m.buildIsStale('index-A', undefined), m.buildIsStale('index-A', ''), m.buildIsStale('index-A', 7),
    ],
  };
}
{
  const a = await partA();
  ok('(A1) a web tab reads its build out of its entry script ("./assets/index-X.js" and an absolute one with a query)', a.web === 'index-DkqE6EFm' && a.abs === 'index-Abc_12-x', JSON.stringify({ web: a.web, abs: a.abs }));
  ok('(A2) ELECTRON is exempt: file:// has no build, and neither has Electron\'s http dev renderer (by its user-agent token)', a.file === null && a.electron === null && a.electronHttp === null, JSON.stringify({ file: a.file, electron: a.electron, electronHttp: a.electronHttp }));
  ok('(A3) a script from another origin, a dev tab (no hashed entry), no script and a non-entry chunk all yield NO build', a.crossOrigin === null && a.dev === null && a.none === null && a.chunkNotEntry === null, JSON.stringify(a));
  ok('(A4) stale means BOTH builds are known and they differ; an absent or malformed side never makes a tab stale',
    JSON.stringify(a.staleTable) === JSON.stringify([true, false, false, false, false, false]), JSON.stringify(a.staleTable));
}

// =============================================================================
// PART B — THE STALE GUARD against an old-build stub.
// =============================================================================
async function partB(overrides = {}, env = {}) {
  const { m, map, net, listenerLog } = await load(overrides, env);
  const out = {};
  m.setCurrentUser(user);
  // A dirty page makes the first request the COMBINED push+pull; with nothing dirty it is the final pull. Both paths check.
  if (env.dirty !== false) m.createJournalPage({ text: 'written before the news' });
  // the server's records must NOT be applied by a tab that is about to stop
  net.responder = () => reply({ build: env.serverBuild ?? 'index-NEWBUILD', pull: { journalEntries: [entry('remote-1'), entry('remote-2')] } });
  await m.startSync();
  out.stale = m.isStaleClient();
  out.liveEntries = m.getJournalEntries().length;
  out.remoteApplied = m.getJournalEntries().some((e) => e.id === 'remote-1');
  out.intervals = intervalsInstalled;
  out.callsAfterFirst = net.calls.length;
  await m.syncOnce(); await m.syncOnce(true);
  out.callsAfterMore = net.calls.length;
  await m.startSync();
  out.callsAfterRestart = net.calls.length;
  out.listeners = listenerLog.filter((x) => x === '+online' || x === '+visibilitychange').length;
  // READ-ONLY: a write made now stays in memory and never reaches storage until the explicit Reload.
  const before = map.get('writer-studio-journal-entries') ?? null;
  const page = m.createJournalPage({ text: 'typed in a stale tab' });
  m.flushNow();
  await sleep(400);
  out.heldWrite = (map.get('writer-studio-journal-entries') ?? null) === before;
  out.inMemory = m.getJournalEntries().some((e) => e.id === page.id);
  out.dirtyHeld = !map.has('writer-studio-dirty-v1') || !String(map.get('writer-studio-dirty-v1')).includes(page.id);
  m.flushForReload();
  out.reloadWrote = String(map.get('writer-studio-journal-entries') ?? '').includes(page.id);
  out.reloadDirty = String(map.get('writer-studio-dirty-v1') ?? '').includes(page.id);
  m.flushNow();
  return out;
}
const intervalsBefore = intervalsInstalled;
{
  intervalsInstalled = 0;
  const b = await partB();
  ok('(B1) a build mismatch marks the tab stale on the sync that reveals it', b.stale === true, JSON.stringify(b));
  ok('(B2) and the pull that carried the news is NOT applied (an old client never merges a newer server\'s records)', b.remoteApplied === false, JSON.stringify(b));
  const bClean = await partB({}, { dirty: false });
  ok('(B2b) the same on the other request shape: with nothing to push, the final pull checks the build too', bClean.stale === true && bClean.remoteApplied === false && bClean.callsAfterRestart === 1, JSON.stringify(bClean));
  ok('(B3) it stops: no further request goes out from sync, a forced pull or a restart, and no timer or listener is installed',
    b.callsAfterFirst === 1 && b.callsAfterMore === 1 && b.callsAfterRestart === 1 && b.intervals === 0 && b.listeners === 0, JSON.stringify(b));
  ok('(B4) READ-ONLY: a page typed into a stale tab stays in memory and its flush is HELD — storage is untouched (no clobbering the live tab)',
    b.inMemory === true && b.heldWrite === true && b.dirtyHeld === true, JSON.stringify(b));
  ok('(B5) the explicit Reload is the one write: flushForReload puts the page and its dirty mark on disk so the new build can send it',
    b.reloadWrote === true && b.reloadDirty === true, JSON.stringify(b));

  intervalsInstalled = 0;
  const same = await partB({}, { serverBuild: 'index-OLDBUILD' });
  ok('(B6) CONTROL: the SAME build keeps syncing — not stale, records applied, the timer installed, writes flow',
    same.stale === false && same.remoteApplied === true && same.intervals === 1 && same.heldWrite === false, JSON.stringify(same));
  intervalsInstalled = 0;
  const noScript = await partB({}, { scripts: [], serverBuild: 'index-NEWBUILD' });
  ok('(B7) CONTROL: a tab with NO known build (dev, tests) never goes stale, whatever the server reports',
    noScript.stale === false && noScript.remoteApplied === true, JSON.stringify(noScript));
  intervalsInstalled = 0;
  const electron = await partB({}, { userAgent: 'Mozilla/5.0 Electron/31.0.0 Chrome/128', serverBuild: 'index-NEWBUILD' });
  ok('(B8) CONTROL: Electron\'s renderer never goes stale even when its script name differs from the server\'s',
    electron.stale === false && electron.remoteApplied === true, JSON.stringify(electron));
}
intervalsInstalled = intervalsBefore;

// =============================================================================
// PART C — THE FIRST PULL IS PER SESSION, AND CAPPED.
// =============================================================================
async function partC(overrides = {}) {
  const { m, net } = await load(overrides, { scripts: [] });
  const out = {};
  m.setCurrentUser(user);
  net.hold = true;
  const started = m.startSync();
  out.doneBefore = m.firstPullDone();
  const capped = await m.whenFirstPulled(40);
  out.capped = capped;
  out.doneAfterCap = m.firstPullDone();
  // the cap above is spent on that session; a NEW session (sign-out, sign-in) gets its own wait - and its pull lands while a waiter is waiting
  const retired = net.pending[0];
  m.stopSync();
  retired.resolve(reply());                 // the retired session's answer arrives late and must change nothing
  await started;
  net.pending.length = 0;
  const started2 = m.startSync();
  const waiter = m.whenFirstPulled(2000);
  net.pending[0].resolve(reply({ pull: { journalEntries: [entry('a')] } }));
  await started2;
  out.pulled = await waiter;
  out.doneAfterPull = m.firstPullDone();
  out.alreadyDone = await m.whenFirstPulled(1);
  // (capped once per session: after the cap has been spent, a second wait answers at once)
  net.hold = true;
  m.stopSync(); net.pending.length = 0;
  const capSession = m.startSync();
  out.firstCap = await m.whenFirstPulled(40);
  const t1 = Date.now();
  out.secondCap = await m.whenFirstPulled(2000);
  out.secondCapMs = Date.now() - t1;
  net.pending[0].resolve(reply());
  await capSession;
  out.afterCapPulled = await m.whenFirstPulled(500);
  m.stopSync(); net.pending.length = 0;
  net.hold = true;
  // THE NEXT SESSION: sign out, sign in. Its pull must be its own.
  m.stopSync();
  out.doneAfterStop = m.firstPullDone();
  out.noSession = await m.whenFirstPulled(10);
  net.pending.length = 0;
  const second = m.startSync();
  out.secondStartsPending = m.firstPullDone() === false;
  const secondWaiter = m.whenFirstPulled(60);
  out.secondCapped = await secondWaiter;      // the first session's completed pull must not resolve this one
  net.pending[0].resolve(reply());
  await second;
  out.secondPulled = await m.whenFirstPulled(500);
  // a waiter caught by a sign-out is released as 'failed', never left hanging
  m.stopSync();
  net.pending.length = 0;
  const third = m.startSync();
  const caught = m.whenFirstPulled(5000);
  m.stopSync();
  out.caughtBySignOut = await Promise.race([caught, sleep(300).then(() => 'HUNG')]);
  net.pending[0]?.resolve(reply());
  await third;
  // a failed first pull is 'failed', and done stays false
  m.stopSync();
  net.pending.length = 0;
  const fourth = m.startSync();
  const failedWaiter = m.whenFirstPulled(2000);
  net.pending[0].reject(new Error('offline'));
  await fourth;
  out.failed = await failedWaiter;
  out.doneAfterFail = m.firstPullDone();
  m.stopSync();
  return out;
}
{
  const c = await partC();
  ok('(C1) before the pull lands the session is not done, and the wait gives up at its cap ("capped") without marking it done', c.doneBefore === false && c.capped === 'capped' && c.doneAfterCap === false, JSON.stringify(c));
  ok('(C2) when the pull lands the waiter resolves "pulled", the session is done, and a later wait answers at once', c.pulled === 'pulled' && c.doneAfterPull === true && c.alreadyDone === 'pulled', JSON.stringify(c));
  ok('(C3) PER SESSION: a sign-out ends it (not done, no session), and the next sign-in starts pending — it never resolves from the first session\'s pull',
    c.doneAfterStop === false && c.noSession === 'failed' && c.secondStartsPending === true && c.secondCapped === 'capped' && c.secondPulled === 'pulled', JSON.stringify(c));
  ok('(C3b) a writer waits for the cap ONCE per session: after it has been spent, a second wait answers "capped" at once - and a pull that lands later is still seen',
    c.firstCap === 'capped' && c.secondCap === 'capped' && c.secondCapMs < 200 && c.afterCapPulled === 'pulled', JSON.stringify(c));
  ok('(C4) a wait caught by a sign-out is released as "failed" (never left hanging)', c.caughtBySignOut === 'failed', JSON.stringify(c));
  ok('(C5) a failed first pull is "failed" and the session is NOT done', c.failed === 'failed' && c.doneAfterFail === false, JSON.stringify(c));
}

// =============================================================================
// PART D — FIRST RUN IS PER ACCOUNT.
// =============================================================================
async function partD(overrides = {}) {
  const out = {};
  async function session(opts) {
    const { m, net, map } = await load(overrides, { scripts: [], storage: opts.storage });
    if (opts.signedIn !== false) m.setCurrentUser(user);
    if (opts.pull === 'hold') net.hold = true;
    else if (opts.pull === 'fail') net.responder = () => { throw new Error('offline'); };
    else net.responder = () => reply({ pull: opts.pull ?? {} });
    if (opts.signedIn !== false) { const p = m.startSync(); if (opts.pull !== 'hold') await p; }
    if (opts.register) m.markRegistered();
    return { m, map };
  }
  const flag = (map) => map.get('wrizo-first-run-complete') ?? null;
  { const s = await session({ storage: { 'wrizo-first-run-complete': '1' }, pull: { journalEntries: [] } }); out.flagDone = await s.m.resolveFirstRun(); }
  { const s = await session({ signedIn: false }); out.signedOut = await s.m.resolveFirstRun(); }
  { const s = await session({ pull: 'hold' }); const t0 = Date.now(); out.pending = await s.m.resolveFirstRun(); out.pendingWaitedMs = Date.now() - t0; out.pendingFlag = flag(s.map); }
  { const s = await session({ pull: 'fail' }); out.failedPull = await s.m.resolveFirstRun(); out.failedFlag = flag(s.map); }
  { const s = await session({ pull: {} }); out.emptyAccount = await s.m.resolveFirstRun(); out.emptyFlag = flag(s.map); }
  { const s = await session({ pull: { journalEntries: [entry('e1')] } }); out.hasEntry = await s.m.resolveFirstRun(); out.hasEntryFlag = flag(s.map); }
  { const s = await session({ pull: { projects: [project('p1')] } }); out.hasProject = await s.m.resolveFirstRun(); out.hasProjectFlag = flag(s.map); }
  { const s = await session({ pull: { journalEntries: [sysBoard('sb1')] } }); out.onlySystem = await s.m.resolveFirstRun(); }
  { const s = await session({ pull: { journalEntries: [entry('d1', { deletedAt: '2026-01-02T00:00:00.000Z' })] } }); out.onlyDeleted = await s.m.resolveFirstRun(); out.onlyDeletedFlag = flag(s.map); }
  { const s = await session({ storage: { 'wrizo-first-run-complete': '1' }, pull: {}, register: true }); out.registerFlag = flag(s.map); out.registerOnUsedDevice = await s.m.resolveFirstRun(); }
  return out;
}
{
  const d = await partD();
  ok('(D1) a device whose flag is already set is never first run; a signed-out writer is decided by the flag alone (first run when unset)', d.flagDone === false && d.signedOut === true, JSON.stringify(d));
  ok('(D2) a sign-in whose first pull has NOT landed waits to the cap and is NOT first run — and does not set the flag',
    d.pending === false && d.pendingWaitedMs >= 2500 && d.pendingFlag === null, JSON.stringify({ pending: d.pending, ms: d.pendingWaitedMs, flag: d.pendingFlag }));
  ok('(D3) a FAILED first pull is NOT first run, and does not set the flag', d.failedPull === false && d.failedFlag === null, JSON.stringify({ r: d.failedPull, flag: d.failedFlag }));
  ok('(D4) a completed pull of an EMPTY account IS first run', d.emptyAccount === true && d.emptyFlag === null, JSON.stringify({ r: d.emptyAccount, flag: d.emptyFlag }));
  ok('(D5) any non-system entry (or any project) means NOT first run, and the flag is set so the gate cannot return',
    d.hasEntry === false && d.hasEntryFlag === '1' && d.hasProject === false && d.hasProjectFlag === '1', JSON.stringify(d));
  ok('(D6) a system board alone is not work (a brand-new account mints one) — still first run', d.onlySystem === true, JSON.stringify({ r: d.onlySystem }));
  ok('(D7) a SOFT-DELETED entry still counts as work: a writer who deleted everything is not new', d.onlyDeleted === false && d.onlyDeletedFlag === '1', JSON.stringify({ r: d.onlyDeleted, flag: d.onlyDeletedFlag }));
  ok('(D8) a successful REGISTER is a first run regardless of the local flag: it resets a used device\'s flag, and the empty new account gets the ritual',
    d.registerFlag === '0' && d.registerOnUsedDevice === true, JSON.stringify({ flag: d.registerFlag, r: d.registerOnUsedDevice }));
}

// =============================================================================
// PART E — startSync's GENERATION CHECK after its first await.
// =============================================================================
async function partE(overrides = {}) {
  const { m, net, listenerLog } = await load(overrides, { scripts: [] });
  const out = {};
  m.setCurrentUser(user);
  net.hold = true;
  intervalsInstalled = 0;
  const started = m.startSync();                 // the boot sync, still waiting on the network
  m.stopSync();                                   // the writer signs out meanwhile
  net.pending[0].resolve(reply());                // ...and the answer arrives
  await started;
  await sleep(30);
  out.intervals = intervalsInstalled;
  out.listeners = listenerLog.filter((x) => x === '+online' || x === '+visibilitychange').length;
  // the NEXT sign-in must get exactly one timer and one pair of listeners
  net.hold = false;
  net.responder = () => reply();
  intervalsInstalled = 0;
  listenerLog.length = 0;
  await m.startSync();
  out.nextIntervals = intervalsInstalled;
  out.nextListeners = listenerLog.filter((x) => x === '+online' || x === '+visibilitychange').length;
  m.stopSync();
  // CONTROL: no sign-out, the same timeline installs them
  net.hold = true;
  intervalsInstalled = 0;
  listenerLog.length = 0;
  const control = m.startSync();
  net.pending[net.pending.length - 1].resolve(reply());
  await control;
  out.controlIntervals = intervalsInstalled;
  out.controlListeners = listenerLog.filter((x) => x === '+online' || x === '+visibilitychange').length;
  m.stopSync();
  return out;
}
{
  const e = await partE();
  ok('(E1) a sign-out DURING the boot sync leaves no timer and no listeners behind when the answer arrives', e.intervals === 0 && e.listeners === 0, JSON.stringify(e));
  ok('(E2) and the next sign-in then gets exactly one timer and one pair of listeners (not two timers)', e.nextIntervals === 1 && e.nextListeners === 2, JSON.stringify(e));
  ok('(E3) CONTROL: with no sign-out the same timeline DOES install them', e.controlIntervals === 1 && e.controlListeners === 2, JSON.stringify(e));
}

// =============================================================================
// PART F — THE SAFETY NET: carried pages that never reached the cache.
// =============================================================================
const DROP_JOURNAL = swap(`changed = applyCollection('journalEntries', cache.journalEntries, remote.journalEntries) || changed;`,
  `if (!globalThis.__dropJournalApply) changed = applyCollection('journalEntries', cache.journalEntries, remote.journalEntries) || changed;`);
async function partF(overrides = {}) {
  const out = {};
  const run = async (tag, pullOf, dropFirst) => {
    const o = { ...overrides, 'store/persistence.ts': (t) => DROP_JOURNAL(overrides['store/persistence.ts'] ? overrides['store/persistence.ts'](t) : t) };
    const { m, net } = await load(o, { scripts: [] });
    m.setCurrentUser(user);
    globalThis.__dropJournalApply = dropFirst === 'always' || dropFirst === 'first';
    let n = 0;
    net.responder = (payload) => {
      n += 1;
      if (dropFirst === 'first' && n === 2) globalThis.__dropJournalApply = false;     // the retry is the second request
      return reply({ pull: pullOf });
    };
    await m.startSync();
    await sleep(120);
    const text = m.syncNoticeText(m.getSyncStatus(), [], [], false, false, false, true, (k) => ({ syncPullShort: 'sent {pulled} showing {live}' }[k] ?? k), m.getPullDiagnostic());
    const r = { calls: net.calls.length, fullPulls: net.calls.filter((c) => c.lastSyncAt === null).length, diag: m.getPullDiagnostic(), live: m.getJournalEntries().filter((e) => !m.getSystemKind(e)).length, text };
    m.stopSync();
    return r;
  };
  const three = { journalEntries: [entry('a'), entry('b'), entry('c')] };
  out.forced = await run('forced', three, 'always');
  out.retryFixes = await run('fixes', three, 'first');
  out.healthy = await run('healthy', three, 'never');
  out.deletedOnly = await run('deleted', { journalEntries: [entry('x', { deletedAt: '2026-01-02T00:00:00.000Z' })] }, 'always');
  out.systemOnly = await run('system', { journalEntries: [sysBoard('s1')] }, 'always');
  return out;
}
{
  const f = await partF();
  ok('(F1) FORCED EMPTY: a full pull carrying 3 live pages that never reach the cache is retried ONCE through a full pull, then recorded as counts only',
    f.forced.fullPulls === 2 && f.forced.calls === 2 && JSON.stringify(f.forced.diag) === JSON.stringify({ pulled: 3, live: 0 }), JSON.stringify(f.forced));
  ok('(F2) the sync notice carries the counts and nothing else', f.forced.text === 'sent 3 showing 0', JSON.stringify(f.forced.text));
  ok('(F3) when the retry fixes it there is no diagnostic and the pages are there', f.retryFixes.fullPulls === 2 && f.retryFixes.diag === null && f.retryFixes.live === 3, JSON.stringify(f.retryFixes));
  ok('(F4) CONTROL: a healthy pull makes ONE request and raises nothing', f.healthy.calls === 1 && f.healthy.diag === null && f.healthy.live === 3 && f.healthy.text === null, JSON.stringify(f.healthy));
  ok('(F5) a pull of only SOFT-DELETED pages, or only SYSTEM boards, is not a miss: no retry, no diagnostic',
    f.deletedOnly.calls === 1 && f.deletedOnly.diag === null && f.systemOnly.calls === 1 && f.systemOnly.diag === null, JSON.stringify({ d: f.deletedOnly, s: f.systemOnly }));
}

// =============================================================================
// PART G — THE BANNER, THE SERVER AND THE WIRING (source). These read the code that cannot run here.
// =============================================================================
{
  const app = read('App.tsx');
  const banner = read('components/StaleClientBanner.tsx');
  ok('(G1) the stale banner is mounted by App itself, beside the routes (every route and auth state), and is a portal outside #root',
    /<StaleClientBanner \/>/.test(app) && /createPortal\(/.test(banner) && /document\.body/.test(banner) && !/ChromeControls/.test(banner), '');
  ok('(G2) READ-ONLY: the app root is made inert while stale and restored after; the focused element is blurred',
    /getElementById\('root'\)/.test(banner) && /setAttribute\('inert', ''\)/.test(banner) && /removeAttribute\('inert'\)/.test(banner) && /\.blur\(\)/.test(banner), '');
  const reloadFn = banner.slice(banner.indexOf('const reload = () => {'), banner.indexOf('return createPortal'));
  ok('(G3) Reload runs flushAll(), then flushForReload(), then reloads — in that order',
    reloadFn.indexOf('flushAll()') > 0 && reloadFn.indexOf('flushForReload()') > reloadFn.indexOf('flushAll()') && reloadFn.indexOf('window.location.reload()') > reloadFn.indexOf('flushForReload()'), reloadFn);
  const pers = read('store/persistence.ts');
  ok('(G4) persistence holds BOTH its collection flush and its dirty-set write while stale, and only flushForReload lifts the hold',
    /function flush\(name: CollectionName\): void \{\n  if \(writesHeld\(\)\) return;/.test(pers) && /function persistDirty\(\): void \{\n  if \(writesHeld\(\)\) return;/.test(pers)
      && /export function flushForReload\(\): void \{\n  writesForced = true;/.test(pers), '');
  const sync = read('store/sync.ts');
  ok('(G5) sync checks the build on EVERY response path (push-only chunks, the combined push+pull, the final pull) before applying anything',
    (sync.match(/checkBuild\(/g) || []).length === 4 && /checkBuild\(resp\);\n        applyRemoteRecords/.test(sync) && /checkBuild\(resp\);\n      applyRemoteRecords/.test(sync) && /checkBuild\(r\);\n        cleanBatch/.test(sync), String((sync.match(/checkBuild\(/g) || []).length));
  ok('(G6) a stale tab never (re)starts sync and syncOnce is a no-op for it', /if \(running \|\| isStaleClient\(\)\) return;/.test(sync) && /if \(isStaleClient\(\)\) return 'stale';/.test(sync), '');
  const cb = read('store/clientBuild.ts');
  ok('(G7) the exemptions live in one place: non-http(s), Electron by user-agent, and non-same-origin scripts', /protocol !== 'http:' && env\.protocol !== 'https:'/.test(cb) && /Electron\\\//.test(cb) && /url\.origin !== env\.origin/.test(cb), '');
  const arrival = read('components/Arrival.tsx');
  ok('(G8) Arrival\'s sign-in waits for the first pull (capped) before opening, shows a quiet loading line, and the Write door asks resolveFirstRun',
    /onAuthed\(res\.user\); await openWhenLoaded\(true\);/.test(arrival) && /whenFirstPulled\(FIRST_PULL_CAP_MS\)/.test(arrival) && /Loading your pages/.test(arrival) && /await resolveFirstRun\(\)/.test(arrival), '');
  ok('(G9) a successful REGISTER marks the device first-run before it opens', /markRegistered\(\); onAuthed\(res\.user\); openAsAuthed\(\);/.test(arrival), '');
  const srvBuild = fs.readFileSync(path.join(SERVER_SRC, 'build.ts'), 'utf8').replace(/\r\n?/g, '\n');
  const srvSync = fs.readFileSync(path.join(SERVER_SRC, 'sync.ts'), 'utf8').replace(/\r\n?/g, '\n');
  const srvIndex = fs.readFileSync(path.join(SERVER_SRC, 'index.ts'), 'utf8').replace(/\r\n?/g, '\n');
  ok('(G10) the server reports its build in /api/sync and /healthz, and never refuses a request over it (report-only)',
    /build: getServerBuild\(\)/.test(srvSync) && /getServerBuild\(\)/.test(srvIndex) && !/status\(4\d\d\)[^;]*build/i.test(srvSync + srvIndex), '');
  // the server's parser, run for real (transpiled), against the real built index.html shape
  const ts = require('typescript');
  const js = ts.transpileModule(srvBuild, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', '__dirname', js)(mod, mod.exports, require, SERVER_SRC);
  const html = '<script type="module" crossorigin src="./assets/index-DkqE6EFm.js"></script><link rel="stylesheet" href="./assets/index-Dr0Nd_dd.css">';
  ok('(G11) the server\'s parser names the ENTRY bundle (not the css, not a chunk) in the shape Vite emits', mod.exports.parseBuild(html) === 'index-DkqE6EFm' && mod.exports.parseBuild('<script src="./assets/vendor-1.js">') === null, String(mod.exports.parseBuild(html)));
  ok('(G12) the SAME name the client reads: client parser and server parser agree on that html',
    (await partA()).web === mod.exports.parseBuild(html), '');
}

// =============================================================================
// MUTATIONS — each protection removed in turn; the proof must notice. (Each asserts that the mutation LANDED first.)
// =============================================================================
async function mutant(name, overrides, run, expectRed) {
  let landed = true;
  let res;
  try { res = await run(overrides); } catch (e) { if (/mutation anchor missing/.test(String(e))) landed = false; else res = { error: String(e) }; }
  if (!landed) { ok(`(M) ${name}: THE MUTATION LANDED`, false, 'anchor missing'); return; }
  ok(`(M) ${name}: the proof goes RED`, expectRed(res) === true, JSON.stringify(res).slice(0, 200));
}
await mutant('checkBuild removed from the combined push+pull path',
  { 'store/sync.ts': swap('        checkBuild(resp);\n        applyRemoteRecords', '        applyRemoteRecords') },
  (o) => partB(o), (r) => r.stale === false);
await mutant('checkBuild removed from the final-pull path',
  { 'store/sync.ts': swap('      checkBuild(resp);\n      applyRemoteRecords', '      applyRemoteRecords') },
  (o) => partB(o, { dirty: false }), (r) => r.stale === false);
await mutant('writesHeld() always false (a stale tab keeps writing)',
  { 'store/persistence.ts': swap('function writesHeld(): boolean { return isStaleClient() && !writesForced; }', 'function writesHeld(): boolean { return false; }') },
  (o) => partB(o), (r) => r.heldWrite === false);
await mutant('startSync loses its generation check',
  { 'store/sync.ts': swap('  if (gen !== generation) return;\n  if (result', '  if (result') },
  (o) => partE(o), (r) => r.intervals !== 0 || r.listeners !== 0);
await mutant('stopSync no longer retires the first-pull session',
  { 'store/sync.ts': swap("  if (firstPull) { firstPull.settle('failed'); firstPull = null; }\n", '') },
  (o) => partC(o), (r) => !(r.doneAfterStop === false && r.noSession === 'failed' && r.secondCapped === 'capped'));
await mutant('a capped wait is paid again at the next door',
  { 'store/sync.ts': swap("  if (fp.capped) return 'capped';\n", '') },
  (o) => partC(o), (r) => !(r.secondCapMs < 200));
await mutant('a capped/failed pull counts as first run',
  { 'store/firstRun.ts': swap('  if (!firstPullDone()) return false;\n  if (accountHasWork())', '  if (accountHasWork())') },
  (o) => partD(o), (r) => r.pending !== false || r.failedPull !== false);
await mutant('first run ignores the account (flag only)',
  { 'store/firstRun.ts': swap('  if (accountHasWork()) { setFirstRunComplete(true); return false; }\n', '') },
  (o) => partD(o), (r) => r.hasEntry !== false);
await mutant('register no longer resets the flag',
  { 'store/firstRun.ts': swap('export function markRegistered(): void {\n  setFirstRunComplete(false);\n}', 'export function markRegistered(): void {\n}') },
  (o) => partD(o), (r) => r.registerOnUsedDevice !== true);
await mutant('accountHasWork forgets projects',
  { 'store/persistence.ts': swap('cache.journalEntries.some(e => !getSystemKind(e)) || cache.projects.length > 0', 'cache.journalEntries.some(e => !getSystemKind(e))') },
  (o) => partD(o), (r) => r.hasProject !== false);
await mutant('the safety net never retries',
  { 'store/sync.ts': swap('    setTimeout(() => { if (gen === generation) void syncOnce(true); }, 0);\n    return;', '    return;') },
  (o) => partF(o), (r) => r.forced.fullPulls !== 2);
await mutant('the safety net counts system boards as pages',
  { 'store/sync.ts': swap("filter(e => !e.deletedAt && !getSystemKind(e)).length;\n  if (carried === 0)", 'filter(e => !e.deletedAt).length;\n  if (carried === 0)') },
  (o) => partF(o), (r) => r.systemOnly.calls !== 1);
await mutant('Electron exemption removed from the client build',
  { 'store/clientBuild.ts': swap("  if (/Electron\\//.test(env.userAgent || '')) return null;\n", '') },
  (o) => partA(o), (r) => r.electron !== null);
await mutant('same-origin check removed from the client build',
  { 'store/clientBuild.ts': swap('    if (url.origin !== env.origin) continue;\n', '') },
  (o) => partA(o), (r) => r.crossOrigin !== null);

// ---- verdict ---------------------------------------------------------------------------------------------
let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' | ' + String(c.detail).slice(0, 300)));
}
console.log(failed === 0 ? `\nB101: PASS (${checks.length} checks)` : `\nB101: FAIL — ${failed}/${checks.length}`);
process.exit(failed === 0 ? 0 : 1);
