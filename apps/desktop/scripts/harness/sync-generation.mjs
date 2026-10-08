// SYNC GENERATION — a sync that is still waiting on the network when the writer signs out must not,
// when its answer finally arrives, write anything into the wiped device or the next writer's account.
//
// The real syncOnce / stopSync (store/sync.ts, transpiled) run against a controllable network: the harness
// holds each apiSync promise and releases it when it chooses. Persistence is a recording stub, so "wrote
// records" means applyRemoteRecords / markClean / markAllJournalEntriesDirty were actually called.
//
// Browserless. Run: node scripts/harness/sync-generation.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const ts = require('typescript');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// The guest client's store exists only once it is merged; the guest checks (S6) run when it does.
const guestAvailable = fs.existsSync(path.join(SRC, 'store/guestState.ts'));
const ROOT = path.join(DESKTOP, '.sync-generation-harness-scratch');
fs.rmSync(ROOT, { recursive: true, force: true });
fs.mkdirSync(ROOT, { recursive: true });

// ---- browser-ish globals sync.ts touches -------------------------------------------------------------
const lsMap = new Map();
globalThis.localStorage = {
  getItem: (k) => (lsMap.has(k) ? lsMap.get(k) : null),
  setItem: (k, v) => lsMap.set(k, String(v)),
  removeItem: (k) => lsMap.delete(k),
};
const noopTarget = { addEventListener() {}, removeEventListener() {} };
globalThis.window = { ...noopTarget, setTimeout, clearTimeout };
globalThis.document = { ...noopTarget, visibilityState: 'visible' };

// A timer spy: sync.ts's backoff is a setTimeout. Anything scheduled while a stale run settles is a leak.
const realSetTimeout = globalThis.setTimeout;
const timersScheduled = [];
globalThis.setTimeout = (fn, ms, ...rest) => { timersScheduled.push(ms); return realSetTimeout(fn, ms, ...rest); };

const transpile = (text) => ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;

// One isolated copy of the sync client (its own stubs, its own module state) per variant.
async function loadClient(tag, syncSourceOverride) {
  const dir = path.join(ROOT, tag, 'store');
  fs.mkdirSync(dir, { recursive: true });
  const w = (name, text) => fs.writeFileSync(path.join(dir, name), text);
  w('persistence.mjs', [
    'export const calls = { applyRemote: 0, markClean: 0, backfill: 0 };',
    'export function getDirtyRecords() { return { projects: [{ id: "p1", title: "P", type: "creative", createdAt: "x", updatedAt: "x" }], storyPlans: [], sessions: [], drafts: [], journalEntries: [], drawers: [] }; }',
    'export function markClean() { calls.markClean += 1; }',
    'export function applyRemoteRecords() { calls.applyRemote += 1; }',
    'export function markAllJournalEntriesDirty() { calls.backfill += 1; }',
    // B10.1 - the safety net reads these two; this proof's pulls carry no journal entries.
    'export function getJournalEntries() { return []; }',
    'export function getSystemKind() { return undefined; }',
  ].join('\n'));
  w('entryText.mjs', 'export function boardName(t, f) { return (t || "").split("\\n")[0] || f; }');
  w('api.mjs', [
    'export class SyncHttpError extends Error { constructor(status, reason) { super("sync failed: " + status); this.status = status; this.reason = reason; } }',
    'export const pending = [];',
    'export function apiSync(payload) { return new Promise((resolve, reject) => { pending.push({ payload, resolve, reject }); }); }',
  ].join('\n'));
  // guestState exists only once the guest client is merged; sync.ts imports it then, and not before.
  const guestPath = path.join(SRC, 'store/guestState.ts');
  if (fs.existsSync(guestPath)) w('guestState.mjs', transpile(fs.readFileSync(guestPath, 'utf8')));
  w('storageHealth.mjs', transpile(fs.readFileSync(path.join(SRC, 'store/storageHealth.ts'), 'utf8')));
  // B10.1 - the stale-client guard's two leaf modules, the real files. No build is known here, so the guard never trips.
  w('clientBuild.mjs', transpile(fs.readFileSync(path.join(SRC, 'store/clientBuild.ts'), 'utf8')));
  w('staleClient.mjs', transpile(fs.readFileSync(path.join(SRC, 'store/staleClient.ts'), 'utf8')));
  const syncText = (syncSourceOverride ?? fs.readFileSync(path.join(SRC, 'store/sync.ts'), 'utf8'));
  const syncOut = transpile(syncText)
    .replace(/from (['"])\.\/(persistence|api|entryText|guestState|storageHealth|clientBuild|staleClient)\1/g, "from './$2.mjs'");
  w('sync.mjs', syncOut);
  const url = (n) => 'file://' + path.join(dir, n).replace(/\\/g, '/');
  const stamp = '?t=' + Date.now() + Math.random();
  const guest = fs.existsSync(guestPath) ? await import(url('guestState.mjs')) : null;
  return {
    guest,
    sync: await import(url('sync.mjs') + stamp),
    persistence: await import(url('persistence.mjs')),
    api: await import(url('api.mjs')),
  };
}

const flush = () => new Promise((r) => realSetTimeout(r, 25));
const response = (serverTime) => ({ serverTime, pull: { projects: [{ id: 'remote-A' }], storyPlans: [], sessions: [], drafts: [], journalEntries: [], drawers: [] } });
const lsSnapshot = () => JSON.stringify([...lsMap.entries()].sort());

// =============================================================================
// S1 — CONTROL: with no sign-out, a completed sync DOES write. The harness can see writes.
// =============================================================================
{
  const c = await loadClient('s1');
  const before = lsSnapshot();
  const run = c.sync.syncOnce();
  await flush();
  c.api.pending[0].resolve(response('2026-10-07T00:00:00.000Z'));
  await run;
  ok('(S1a) CONTROL: an ordinary sync applies the pull', c.persistence.calls.applyRemote === 1, JSON.stringify(c.persistence.calls));
  ok('(S1b) CONTROL: and acknowledges its push, and records the cursor',
    c.persistence.calls.markClean === 1 && lsSnapshot() !== before, JSON.stringify({ calls: c.persistence.calls }));
  ok('(S1c) CONTROL: and reports synced', c.sync.getSyncStatus() === 'synced', c.sync.getSyncStatus());
}

// =============================================================================
// S2 — A LATE PULL after a sign-out writes NOTHING.
// =============================================================================
async function lateSuccess(tag, source) {
  const c = await loadClient(tag, source);
  const before = lsSnapshot();
  const run = c.sync.syncOnce();
  await flush();
  c.sync.stopSync();                      // the sign-out (force) retires the stalled run
  const statusAfterStop = c.sync.getSyncStatus();
  c.api.pending[0].resolve(response('2026-10-07T01:00:00.000Z'));  // ...and then the network finally answers
  await run;
  await flush();
  return { c, before, statusAfterStop };
}
{
  const { c, before, statusAfterStop } = await lateSuccess('s2');
  ok('(S2a) a late pull after sign-out writes NO records into the wiped device', c.persistence.calls.applyRemote === 0, JSON.stringify(c.persistence.calls));
  ok('(S2b) nor acknowledges the push, nor re-flags the journal backfill', c.persistence.calls.markClean === 0 && c.persistence.calls.backfill === 0, JSON.stringify(c.persistence.calls));
  ok('(S2c) nor writes the cursor (lastSyncAt) back — storage is byte-for-byte what it was', lsSnapshot() === before, lsSnapshot());
  ok('(S2d) nor flips the status to "synced" (it stays where the sign-out left it)',
    c.sync.getSyncStatus() === statusAfterStop && c.sync.getSyncStatus() !== 'synced', c.sync.getSyncStatus());
}

// =============================================================================
// S3 — A LATE FAILURE after a sign-out schedules nothing and flips nothing.
// =============================================================================
{
  const c = await loadClient('s3');
  const run = c.sync.syncOnce();
  await flush();
  c.sync.stopSync();
  const statusAfterStop = c.sync.getSyncStatus();
  const timersBefore = timersScheduled.length;
  c.api.pending[0].reject(new Error('network died'));
  await run;
  await flush();
  ok('(S3a) a late failure schedules NO backoff retry (no timer set by the stale run)', timersScheduled.length === timersBefore, JSON.stringify(timersScheduled.slice(timersBefore)));
  ok('(S3b) and does not flip the status to "offline"', c.sync.getSyncStatus() === statusAfterStop && c.sync.getSyncStatus() !== 'offline', c.sync.getSyncStatus());
}

// =============================================================================
// S4 — A STALLED run does not block the NEXT session's first sync; and its late answer
// cannot disturb the new session's work.
// =============================================================================
{
  const c = await loadClient('s4');
  const stalled = c.sync.syncOnce();            // session A's sync, never answered (yet)
  await flush();
  c.sync.stopSync();                            // sign-out
  const sessionB = c.sync.syncOnce(true);       // the next writer signs in: their first full pull
  await flush();
  ok('(S4a) the next session\'s first sync actually goes out (the stalled request did not hold the flag)',
    c.api.pending.length === 2, String(c.api.pending.length));
  c.api.pending[1].resolve(response('2026-10-07T02:00:00.000Z'));
  await sessionB;
  ok('(S4b) and its result is applied normally', c.persistence.calls.applyRemote === 1, JSON.stringify(c.persistence.calls));
  const cursorAfterB = lsSnapshot();
  c.api.pending[0].resolve(response('2020-01-01T00:00:00.000Z'));   // session A's late, OLD answer
  await stalled;
  await flush();
  ok('(S4c) session A\'s late answer then changes nothing: no second apply, no cursor rewind',
    c.persistence.calls.applyRemote === 1 && lsSnapshot() === cursorAfterB, JSON.stringify(c.persistence.calls));
}

// =============================================================================
// S5 — A stale run's finally must not release a NEWER run's in-flight flag.
// =============================================================================
{
  const c = await loadClient('s5');
  const stalled = c.sync.syncOnce();
  await flush();
  c.sync.stopSync();
  const sessionB = c.sync.syncOnce(true);
  await flush();
  c.api.pending[0].resolve(response('2026-10-07T03:00:00.000Z'));   // A settles while B is still waiting
  await stalled;
  await flush();
  const callsBefore = c.api.pending.length;
  void c.sync.syncOnce();                                            // a third attempt while B is in flight
  await flush();
  ok('(S5) a stale run settling does not clear the newer run\'s flag: a concurrent sync is still refused',
    c.api.pending.length === callsBefore, JSON.stringify({ callsBefore, now: c.api.pending.length }));
  c.api.pending[1].resolve(response('2026-10-07T03:00:01.000Z'));
  await sessionB;
}

// =============================================================================
// STATIC — every await on the network is followed by the generation check.
// =============================================================================
const syncSrc = fs.readFileSync(path.join(SRC, 'store/sync.ts'), 'utf8');
{
  const awaits = [...syncSrc.matchAll(/await apiSync\(/g)].map((m) => m.index);
  const missing = awaits.filter((i) => !/live\(\);/.test(syncSrc.slice(i, i + 220)));
  ok('(T1) every `await apiSync(` is followed by live() before any write', awaits.length === 3 && missing.length === 0, JSON.stringify({ awaits: awaits.length, missing }));
  ok('(T2) stopSync bumps the generation and releases the in-flight flag',
    /export function stopSync\(\): void \{\s*running = false;[\s\S]*?generation \+= 1;\s*inFlight = false;/.test(syncSrc), '');
  // SUPERSEDED (B10.1: runSync reports its outcome) — by (T3b) below. Parked, not deleted: it pinned a BARE `return;`, and the catch now
  // returns the outcome ('stale' / 'failed') so startSync can tell a failed first pull from a good one.
  // Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(T3) the catch drops a stale run before it can set a status or schedule a backoff, and finally releases the flag only for the current generation',
    /catch \(e\) \{[\s\S]*?if \(e === STALE \|\| gen !== generation\) return;[\s\S]*?setStatus\('offline'\);[\s\S]*?scheduleBackoff\(\);/.test(syncSrc)
      && /if \(gen === generation\) inFlight = false;/.test(syncSrc), '');
  ok('(T3b) the catch still drops a stale run before it can set a status or schedule a backoff (now returning the outcome), and finally releases the flag only for the current generation',
    /catch \(e\) \{[\s\S]*?if \(e === STALE \|\| gen !== generation\) return 'stale';[\s\S]*?setStatus\('offline'\);[\s\S]*?scheduleBackoff\(\);/.test(syncSrc)
      && /if \(gen === generation\) inFlight = false;/.test(syncSrc), '');
  const lastAt = syncSrc.indexOf('setLastSyncAt(resp.serverTime)');
  ok('(T4) the cursor is written only after a final live() check', /live\(\);\s*setLastSyncAt\(resp\.serverTime\);/.test(syncSrc), String(lastAt));
}

// =============================================================================
// MUTATIONS — the tests must go red when the guard is taken away.
// =============================================================================
{
  // Mutate an LF-normalised copy of the source (the working copy may be CRLF).
  const lf = syncSrc.replace(/\r\n/g, '\n');
  const mutate = (from, to) => {
    if (lf.split(from).length !== 2) throw new Error('mutation anchor not found/unique: ' + from.slice(0, 60));
    return lf.replace(from, () => to);
  };
  // (M1) no generation bump on stop: the stale pull lands.
  const m1 = await lateSuccess('m1', mutate('  generation += 1;\n', ''));
  ok('(M1) MUTATION KILLED: without the generation bump in stopSync, the late pull DOES write records (so S2a is what stops it)',
    m1.c.persistence.calls.applyRemote === 1, JSON.stringify(m1.c.persistence.calls));

  // (M2) no check after the main apiSync: the stale pull lands even though the generation moved.
  const m2 = await lateSuccess('m2', mutate(
    '        resp = await apiSync({ lastSyncAt: cursor, push: payloadOf(chunks[0]) });\n        live();\n',
    '        resp = await apiSync({ lastSyncAt: cursor, push: payloadOf(chunks[0]) });\n'));
  ok('(M2) MUTATION KILLED: without the live() check after the main apiSync, the late pull DOES write records',
    m2.c.persistence.calls.applyRemote === 1, JSON.stringify(m2.c.persistence.calls));
}

// =============================================================================
// S6 — THE ORDER OF THE CATCH. A guest's 401 (guest_expired) calls stopSync(), which bumps the generation. If a STALE
// run (one from a session that already ended) reached that branch it would stop the NEW session's sync. The stale
// check must come first, so a stale run exits before it can.
// =============================================================================
if (guestAvailable) {
  const lateGuest401 = async (tag, source) => {
    const c = await loadClient(tag, source);
    const stalled = c.sync.syncOnce();                 // session A's sync, waiting
    await flush();
    c.sync.stopSync();                                 // A signs out
    const sessionB = c.sync.syncOnce(true);            // the next writer's first sync
    await flush();
    c.api.pending[0].reject(new c.api.SyncHttpError(401, 'guest_expired'));   // A's LATE guest-expired answer
    await stalled;
    await flush();
    const expiredAfterA = c.guest.isGuestExpired();
    c.api.pending[1].resolve(response('2026-10-07T04:00:00.000Z'));           // then B's answer arrives
    await sessionB;
    await flush();
    return { c, expiredAfterA, appliedB: c.persistence.calls.applyRemote };
  };
  const real = await lateGuest401('s6');
  ok('(S6a) a STALE run\'s late guest_expired does not mark the new session expired', real.expiredAfterA === false, String(real.expiredAfterA));
  ok('(S6b) and does not stop the new session\'s sync: its answer is still applied', real.appliedB === 1, String(real.appliedB));

  // The control: a CURRENT run that gets guest_expired still does what the guest branch is for.
  const cur = await loadClient('s6c');
  const run = cur.sync.syncOnce();
  await flush();
  cur.api.pending[0].reject(new cur.api.SyncHttpError(401, 'guest_expired'));
  await run;
  await flush();
  ok('(S6c) CONTROL: a CURRENT run getting guest_expired marks the guest expired (the branch still works)', cur.guest.isGuestExpired() === true, String(cur.guest.isGuestExpired()));

  // MUTATION: put the guest branch BEFORE the stale check. S6a and S6b must go red.
  const lf = syncSrc.replace(/\r\n/g, '\n');
  const staleLine = "    if (e === STALE || gen !== generation) return 'stale';\n";
  const guestStart = lf.indexOf("    if (e instanceof SyncHttpError && e.reason === 'guest_expired') {");
  const guestEnd = lf.indexOf('    }\n', lf.indexOf("return 'stale';", guestStart)) + 6;
  if (lf.split(staleLine).length !== 2 || guestStart < 0) throw new Error('S6 mutation anchors not found');
  const guestBlock = lf.slice(guestStart, guestEnd);
  const swapped = lf.replace(guestBlock, '').replace(staleLine, guestBlock + staleLine);
  const mut = await lateGuest401('s6m', swapped);
  ok('(S6d) MUTATION KILLED: with the guest branch ahead of the stale check, a stale guest 401 DOES mark the new session expired or stop its sync (so the order is what protects it)',
    mut.expiredAfterA === true || mut.appliedB === 0, JSON.stringify({ expiredAfterA: mut.expiredAfterA, appliedB: mut.appliedB }));
  const catchSrc = lf.slice(lf.indexOf('} catch (e) {', lf.indexOf('await apiSync(')), lf.indexOf('} finally {', lf.indexOf('await apiSync(')));
  ok('(S6e) in the shipped source the stale check comes before the guest branch', catchSrc.indexOf('e === STALE') > 0 && catchSrc.indexOf('e === STALE') < catchSrc.indexOf("e.reason === 'guest_expired'"), '');
}

globalThis.setTimeout = realSetTimeout;
fs.rmSync(ROOT, { recursive: true, force: true });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nSYNC-GENERATION VERIFY: PASS (${checks.length} checks)`
  : `\nSYNC-GENERATION VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
