// LOGOUT FLUSH — flush, then decide, then wipe; and a belt for whatever still runs after the wipe.
//
// The late-writer audit found two ways a sign-out and an editor's debounce could disagree:
//   LOSS    an editor holds the last ~2 s of typing in memory. The sign-out's "is anything unsaved?" counts RECORDS,
//           so it cannot see that text, and the wipe takes it silently.
//   RESURRECTION  an editor's unmount flush runs AFTER the wipe. saveDraft is an upsert that CREATES its row, so a
//           draft reappears in the wiped cache, marked dirty, and the next account would push it.
//
// This file runs the REAL registry, the REAL persistence.ts (bundled with esbuild against a fake storage) and the REAL
// attemptSignOut together. The editors themselves are React and cannot run here; they are checked in source, and
// logout-flush-walk.mjs proves the live behaviour on a box turn.
//
// Browserless. Run: node scripts/harness/logout-flush.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
// esbuild is vite's dependency, not the desktop app's own: resolve it through vite, as item-storage-full.mjs does.
const { build } = createRequire(require.resolve('vite'))('esbuild');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

// ---- a fresh module instance + fake browser per call -------------------------------------------------------
let nonce = 0;
let previous = null;
const noCR = (t) => t.replace(/\r\n?/g, '\n');
async function load(overrides = {}) {
  nonce += 1;
  // ISOLATION. persistence.ts schedules a 300 ms debounced flush on every write and hydrates its cache from the global
  // localStorage at import. Two things used to let one scenario leak into the next, depending on how long esbuild took:
  // the fake storage was swapped in BEFORE the awaited build, so the previous instance's pending timer could write into
  // the NEW storage and the next instance hydrated its leftovers (a phantom dirty record). So: (1) cancel the previous
  // instance's timers while ITS storage is still the global one, and (2) install the fresh fake environment only after
  // the build, immediately before the import, with no await between.
  if (previous) { try { previous.resetLocalData(); } catch { /* best effort */ } previous = null; }
  const res = await build({
    // A real-code nonce: esbuild strips comments, so a comment-only difference would hand back the SAME bundle text.
    stdin: {
      contents: `export const __nonce = ${nonce};\n` + ['persistence', 'flushRegistry', 'logoutGuard', 'signedOutHere'].map((m) => `export * from './store/${m}';`).join('\n'),
      resolveDir: SRC, loader: 'ts',
    },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    plugins: [{ name: 'ov', setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const rel = path.relative(SRC, args.path).split('\\').join('/');
        const text = noCR(fs.readFileSync(args.path, 'utf8'));
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  const map = new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
  };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  const mod = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
  previous = mod;
  return { mod, map };
}
const swap = (from, to) => (t) => { if (!t.includes(from)) throw new Error('mutation anchor missing: ' + JSON.stringify(from.slice(0, 80))); return t.replace(from, () => to); };

// =============================================================================
// PART A — the registry.
// =============================================================================
{
  const { mod: m } = await load();
  const log = [];
  const offA = m.registerFlush(() => log.push('A'));
  const offB = m.registerFlush(() => { log.push('B'); throw new Error('B failed'); });
  const offC = m.registerFlush(() => log.push('C'));
  m.flushAll();
  ok('(A1) flushAll runs every registered flush, in registration order', JSON.stringify(log) === '["A","B","C"]', JSON.stringify(log));
  ok('(A2) one flush throwing does not stop the others (C ran after B threw)', log.includes('C'), JSON.stringify(log));
  log.length = 0; offB();
  m.flushAll();
  ok('(A3) an unregistered flush no longer runs', JSON.stringify(log) === '["A","C"]', JSON.stringify(log));
  offB();
  ok('(A4) unregistering twice is harmless', m.registeredFlushCount() === 2, String(m.registeredFlushCount()));
  const f = () => log.push('S');
  const off1 = m.registerFlush(f); const off2 = m.registerFlush(f);   // StrictMode: mount, unmount, mount
  off1();
  log.length = 0; m.flushAll();
  ok('(A5) the same function registered twice is two independent entries: removing one leaves the other', log.filter((x) => x === 'S').length === 1, JSON.stringify(log));
  off2(); offA(); offC();
  ok('(A6) with nothing registered, flushAll is a no-op', (() => { m.flushAll(); return m.registeredFlushCount() === 0; })(), '');
}

// =============================================================================
// PART B — the belt, against the REAL upsert.
// =============================================================================
{
  const { mod: m, map } = await load();
  m.saveDraft('d-open', 'written while signed in');
  ok('(B1) CONTROL: with the flag unset, saveDraft writes (the belt is invisible to a normal writer)',
    m.getDraft('d-open')?.text === 'written while signed in' && m.countDirtyRecords() === 1, String(m.countDirtyRecords()));

  m.markSignedOutHere();
  ok('(B2) the flag is set in storage', map.get('wz.signedOutHere') === '1', '');
  m.saveDraft('d-late', 'a late write after the sign-out');
  ok('(B3) with the flag set, saveDraft is a NO-OP: no row, no new dirty record', m.getDraft('d-late') === null && m.countDirtyRecords() === 1, String(m.countDirtyRecords()));
  m.saveProject({ id: 'p-late', title: 'late', type: 'creative', storyPlanId: null, createdAt: 'x', updatedAt: 'x' });
  ok('(B4) and so is every other record upsert (a project here)', m.getProjects().every((p) => p.id !== 'p-late') && m.countDirtyRecords() === 1, '');

  m.applyRemoteRecords({ drafts: [{ id: 'd-pulled', text: 'pulled', updatedAt: '2030-01-01T00:00:00.000Z' }] });
  ok('(B5) the belt does not touch PULLED records — those are the sync generation guard\'s job, not this one\'s',
    m.getDraft('d-pulled')?.text === 'pulled', '');

  m.clearSignedOutHere();
  m.saveDraft('d-after', 'written after signing back in');
  ok('(B6) clearing the flag (a sign-in) lifts the belt: writes work again', m.getDraft('d-after')?.text === 'written after signing back in', '');
}

// =============================================================================
// PART C — THE TWO FAILURES, end to end, with the REAL registry + persistence + attemptSignOut.
// A fake editor holds typed text in memory, exactly as the real ones do, and flushes through saveDraft.
// =============================================================================
function makeEditor(m, id) {
  const ed = { pending: '', saved: '', unmounted: false };
  ed.flush = () => { if (ed.pending !== ed.saved) { m.saveDraft(id, ed.pending); ed.saved = ed.pending; } };
  ed.unregister = m.registerFlush(ed.flush);
  // The real editors' unmount cleanup: flush once more, AFTER whatever the sign-out already did.
  ed.unmount = () => { ed.unregister(); ed.flush(); ed.unmounted = true; };
  return ed;
}
{
  // C1 — THE LOSS. The writer typed, then pressed Sign out inside the 2 s debounce.
  const { mod: m } = await load();
  const ed = makeEditor(m, 'd1');
  ed.pending = 'the last two seconds of typing';
  const withoutFlush = await m.attemptSignOut(() => Promise.resolve(), m.countDirtyRecords, 50);
  ok('(C1) THE LOSS, reproduced: with no flush first, the unsaved check sees NOTHING and would sign out (the typing is lost)',
    withoutFlush.kind === 'clear', JSON.stringify(withoutFlush));
}
{
  // C2 — THE FIX. flushAll first, then decide.
  const { mod: m } = await load();
  const ed = makeEditor(m, 'd1');
  ed.pending = 'the last two seconds of typing';
  m.flushAll();
  const decision = await m.attemptSignOut(() => Promise.resolve(), m.countDirtyRecords, 50);
  ok('(C2) flush, THEN decide: the pending text is now a dirty record, so the sign-out is BLOCKED with a count of 1',
    decision.kind === 'blocked' && decision.count === 1 && m.getDraft('d1')?.text === 'the last two seconds of typing', JSON.stringify(decision));
}
{
  // C3 — THE FORCE PATH. flushAll, wipe, then the editor unmounts: nothing is left to write.
  const { mod: m } = await load();
  const ed = makeEditor(m, 'd1');
  ed.pending = 'unsaved words';
  m.flushAll();                    // handleLogout: flushAll runs FIRST on both paths
  m.markSignedOutHere();           // ...then, once the sign-out completes, the flag
  m.resetLocalData();              // ...and the wipe
  ed.unmount();                    // the router reacts to the hash change LATER: the unmount flush runs after the wipe
  ok('(C3) after flush, wipe, unmount: the wiped device holds no draft and no dirty record (the unmount had nothing left to write)',
    m.getDraft('d1') === null && m.countDirtyRecords() === 0, String(m.countDirtyRecords()));
}
{
  // C4 — THE RESURRECTION, reproduced with BOTH protections removed: no flushAll, no belt.
  const { mod: m } = await load({ 'store/persistence.ts': swap('  if (isSignedOutHere()) return;\n', '') });
  const ed = makeEditor(m, 'd1');
  ed.pending = 'typed just before the sign-out';
  m.markSignedOutHere();
  m.resetLocalData();
  ed.unmount();
  ok('(C4) THE RESURRECTION, reproduced: with neither the flush nor the belt, the unmount recreates the draft in the wiped cache, DIRTY (the next account would push it)',
    m.getDraft('d1')?.text === 'typed just before the sign-out' && m.countDirtyRecords() === 1, String(m.countDirtyRecords()));
}
{
  // C5 — the belt ALONE (no flushAll) still stops the resurrection.
  const { mod: m } = await load();
  const ed = makeEditor(m, 'd1');
  ed.pending = 'typed just before the sign-out';
  m.markSignedOutHere();
  m.resetLocalData();
  ed.unmount();
  ok('(C5) THE BELT ALONE (no flush) stops the resurrection: the late unmount write is refused, no row, nothing dirty',
    m.getDraft('d1') === null && m.countDirtyRecords() === 0, String(m.countDirtyRecords()));
}

// =============================================================================
// PART D — the wiring, in source.
// =============================================================================
{
  const app = read('App.tsx');
  const hs = app.indexOf('const handleLogout');
  const body = app.slice(hs, app.indexOf('  // CD2 S3', hs));
  const flushAt = body.indexOf('flushAll();');
  const forceIf = body.indexOf('if (force !== true)');
  ok('(D1) handleLogout calls flushAll() BEFORE the force check, so it runs on BOTH the normal and the force path',
    flushAt > 0 && forceIf > 0 && flushAt < forceIf, JSON.stringify({ flushAt, forceIf }));
  ok('(D2) and before the unsaved decision, the server logout, the flag and the wipe',
    flushAt < body.indexOf('attemptSignOut(') && flushAt < body.indexOf('endServerSession(apiLogout)') && flushAt < body.indexOf('markSignedOutHere()') && flushAt < body.indexOf('resetLocalData()'), '');

  const wired = [
    ['PageEditor', 'pages/PageEditor.tsx', /const unregisterFlush = registerFlush\(flush\);/],
    ['QuickSprint', 'pages/QuickSprint.tsx', /const unregisterFlush = registerFlush\(flushDraft\);/],
    ['BeatWizard', 'pages/BeatWizard.tsx', /const unregisterFlush = registerFlush\(flushNotes\);/],
    ['BoardEditor', 'components/BoardEditor.tsx', /const unregisterFlush = registerFlush\(\(\) => \{[\s\S]*?saveBoardBoxes\(id, boxesRef\.current\);/],
  ];
  for (const [name, rel, re] of wired) {
    const src = read(rel);
    ok(`(D3-${name}) registers its flush, unregisters it in the same effect's cleanup, and imports the registry`,
      re.test(src) && /unregisterFlush\(\);\s*document\.removeEventListener/.test(src) && /import \{ registerFlush \} from '\.\.\/store\/flushRegistry';/.test(src), '');
  }
  const persist = read('store/persistence.ts');
  const upsertAt = persist.indexOf('function upsert<');
  const beltAt = persist.indexOf('if (isSignedOutHere()) return;', upsertAt);
  const stampAt = persist.indexOf('record.updatedAt = new Date().toISOString();', upsertAt);
  ok('(D4) the belt is the first thing upsert does — before it stamps, replaces, marks dirty or schedules anything',
    upsertAt > 0 && beltAt > upsertAt && beltAt < stampAt, JSON.stringify({ upsertAt, beltAt, stampAt }));
}

// =============================================================================
// PART E — the sheet's palette. The shared form classes read --wz-* tokens defined only under .wz-home; the sheet is outside it.
// =============================================================================
{
  const css = read('index.css').replace(/\r\n?/g, '\n');
  const tokensOf = (block) => Object.fromEntries([...block.matchAll(/(--wz-[a-z-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const blockAfter = (selectorStart) => { const i = css.indexOf(selectorStart); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
  const home = tokensOf(blockAfter('.wz-home {'));
  const sheet = tokensOf(blockAfter('.wz-logout-sheet {\n  --wz-ground'));
  const names = ['--wz-ground', '--wz-lift', '--wz-ink', '--wz-ink-dim', '--wz-whisper', '--wz-orange', '--wz-orange-line', '--wz-hint', '--wz-ui', '--wz-text'];
  ok('(E1) the logout sheet defines every home palette token the shared form classes read',
    names.every((n) => n in sheet), JSON.stringify(names.filter((n) => !(n in sheet))));
  ok('(E2) and each has EXACTLY the value .wz-home gives it (they cannot drift apart)',
    names.every((n) => home[n] !== undefined && home[n] === sheet[n]), JSON.stringify(names.filter((n) => home[n] !== sheet[n]).map((n) => [n, home[n], sheet[n]])));
  // MUTATION: change one value; E2's predicate must go red.
  const mutated = tokensOf(blockAfter('.wz-logout-sheet {\n  --wz-ground').replace('--wz-orange:#ff9800', '--wz-orange:#ff0000'));
  ok('(E3) MUTATION KILLED: with one token changed, E2\'s predicate goes red', !names.every((n) => home[n] === mutated[n]), '');
}

// =============================================================================
// MUTATIONS — each protection removed in turn; the proof must notice.
// =============================================================================
{
  // M1: the belt removed from upsert. B3 must go red (the late write lands).
  const { mod: m } = await load({ 'store/persistence.ts': swap('  if (isSignedOutHere()) return;\n', '') });
  m.markSignedOutHere();
  m.saveDraft('d-late', 'late');
  ok('(M1) MUTATION KILLED: with the belt removed, B3\'s predicate goes red (the late write lands)', m.getDraft('d-late')?.text === 'late', '');

  // M2: the registry's flushAll does nothing. C2 must go red (the pending text is never counted).
  const { mod: m2 } = await load({ 'store/flushRegistry.ts': swap('    try { entry.fn(); } catch { /* the editor\'s own flush failed; the rest still run */ }\n', '') });
  const ed = makeEditor(m2, 'd1');
  ed.pending = 'typed';
  m2.flushAll();
  const decision = await m2.attemptSignOut(() => Promise.resolve(), m2.countDirtyRecords, 50);
  ok('(M2) MUTATION KILLED: with flushAll made a no-op, C2\'s predicate goes red (the sign-out would clear past the pending text)',
    decision.kind === 'clear', JSON.stringify(decision));

  // M3: handleLogout without the flushAll call. D1 must go red.
  const app = read('App.tsx');
  const mutated = app.replace('      flushAll();\n', '').replace('      flushAll();\r\n', '');
  ok('(M3) MUTATION KILLED: without the flushAll() call in handleLogout, D1\'s predicate goes red',
    mutated !== app && !/flushAll\(\);/.test(mutated.slice(mutated.indexOf('const handleLogout'), mutated.indexOf('  // CD2 S3', mutated.indexOf('const handleLogout')))), '');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nLOGOUT-FLUSH VERIFY: PASS (${checks.length} checks) — live walk not run (box turn)`
  : `\nLOGOUT-FLUSH VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
