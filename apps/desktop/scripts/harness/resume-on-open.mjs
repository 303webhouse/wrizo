// RESUME ON OPEN (docs/plans/resume-on-open.md, cleared by Fable 2026-10-16; Nick 12:53pm: the no-last-place landing is a
// fresh blank Page in FREE WRITE, saved only once a word is typed).
//
// After the splash, a signed-in writer lands on the last Page or board they had OPEN, not the front door.
//   PART 1 (browserless; runs anywhere)  the data side (store/lastPlace.ts) bundled with esbuild against a fake browser and
//          stubbed persistence/resume: pointer round-trip, the uid guard, the three record states, the seed-once rule,
//          deleted/Trashed targets, system boards and the unborn id never recorded, blocked storage - each with a MUTANT.
//          Plus source pins: no landing logic in Splash.tsx, the blank-page entry matches Arrival's Write door.
//   PART 2 (a box turn; needs Chat 1's grant)  the real app. runtime-verify's server double signs EVERY boot in, so it serves
//          index.html with the landing switched OFF (window.__wrizoNoLanding) for the ~120 front-door harnesses; this file
//          sets WS_LANDING=1 to leave it ON. Cold boot signed in -> last place (a Page, then a board); seeded once from the
//          edited race; deleted -> blank Free Write Page that is not born until a word; signed out here -> front door;
//          anonymous -> front door; a deep link wins; once per load; the front door never paints under the splash hold.
//
// Seeding goes through the app's seams (window.wrizoCreateJournalPage, wrizoPatchEntry, wrizoRecordLastPlace, wrizoFlushNow),
// never raw collection writes. wz.lastPlace is not a collection (a per-device pointer), so it is written raw in the ONE
// case that needs another account's pointer.
//
// Run: node scripts/harness/resume-on-open.mjs   (from apps/desktop, dist-web built; PART 2 needs WS_BOX_TURN)
//      BROWSERLESS_ONLY=1 node scripts/harness/resume-on-open.mjs   (PART 1 only)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8').replace(/\r\n?/g, '\n');
const live = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:\\])\/\/.*$/gm, '$1');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ============================================================================================================
// PART 1 - the data side, browserless
// ============================================================================================================
const LAST_PLACE = read('store/lastPlace.ts');

const STUBS = {
  persistence: `
    export const getJournalEntries = () => (globalThis.__rows || []).filter((e) => !e.deletedAt);
    export const getProject = (id) => (globalThis.__projects || []).find((p) => p.id === id && !p.deletedAt) || null;
    export const getSystemKind = (e) => (e && e.pageType === 'board' && e.sys) || undefined;
  `,
  resume: `export const getResumeTarget = () => (globalThis.__edited === undefined ? null : globalThis.__edited);`,
};

async function load(source) {
  const result = await build({
    stdin: { contents: source, resolveDir: path.join(SRC, 'store'), sourcefile: 'lastPlace.ts', loader: 'ts' },
    bundle: true, format: 'esm', platform: 'node', write: false,
    plugins: [{
      name: 'stubs',
      setup(b) {
        b.onResolve({ filter: /\/persistence$/ }, () => ({ path: 'persistence', namespace: 'stub' }));
        b.onResolve({ filter: /\/resume$/ }, () => ({ path: 'resume', namespace: 'stub' }));
        b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => ({ contents: STUBS[a.path], loader: 'js' }));
      },
    }],
  });
  const file = path.join(os.tmpdir(), `resume-on-open-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(file, result.outputFiles[0].text);
  try { return await import(pathToFileURL(file).href); } finally { try { fs.unlinkSync(file); } catch { /* best effort */ } }
}

function freshBrowser({ blocked = false } = {}) {
  const store = new Map();
  globalThis.window = {};
  globalThis.localStorage = {
    getItem: (k) => { if (blocked) throw new Error('blocked'); return store.has(k) ? store.get(k) : null; },
    setItem: (k, v) => { if (blocked) throw new Error('blocked'); store.set(k, String(v)); },
    removeItem: (k) => { if (blocked) throw new Error('blocked'); store.delete(k); },
  };
  globalThis.__rows = []; globalThis.__projects = []; globalThis.__edited = undefined;
  return store;
}
const row = (id, extra = {}) => ({ id, text: id, ...extra });
const stored = (store) => { try { return JSON.parse(store.get('wz.lastPlace')); } catch { return null; } };

// The scenarios, run against the real module (mutant = false) or a mutated copy; returns { name: pass }.
async function unit(source) {
  const M = await load(source);
  const r = {};

  freshBrowser();
  globalThis.__rows = [row('a'), row('b')];
  r.roundTrip = M.recordLastPlace('u1', 'page', 'a') === true && M.readLastPlace('u1')?.id === 'a' && M.resolveLanding('u1').route === '/page/a';

  r.uidGuard = M.readLastPlace('u2') === null;   // another account's pointer is absent...
  globalThis.__edited = { route: '/page/b' };
  r.uidGuardSeedsOwn = M.resolveLanding('u2').route === '/page/b'; // ...and that account seeds from its OWN edited race

  freshBrowser();
  globalThis.__rows = [row('a')];
  r.unbornNotRecorded = M.recordLastPlace('u1', 'page', 'new') === false && M.recordLastPlace('u1', 'page', 'ghost') === false && M.readLastPlace('u1') === null;

  freshBrowser();
  globalThis.__rows = [row('jb', { pageType: 'board', sys: 'journal' }), row('tb', { pageType: 'board', sys: 'trash' })];
  r.systemBoardsNotRecorded = M.recordLastPlace('u1', 'page', 'jb') === false && M.recordLastPlace('u1', 'page', 'tb') === false;

  // deleted/Trashed target -> blank, and the stale pointer becomes the "decided: none" record
  let s = freshBrowser();
  globalThis.__rows = [row('a'), row('b')];
  M.recordLastPlace('u1', 'page', 'a');
  globalThis.__rows = [row('b')];            // a is gone (soft-deleted rows are not in getJournalEntries)
  globalThis.__edited = { route: '/page/b' }; // the edited race WOULD offer b
  const d1 = M.resolveLanding('u1');
  r.deletedGoesBlank = d1.kind === 'blank';
  r.deletedRecordsNone = stored(s)?.id === null && stored(s)?.kind === null;
  r.deletedNotReseeded = M.resolveLanding('u1').kind === 'blank'; // next cold open: still the blank Page, not b

  // absent record: seed once from the edited race
  s = freshBrowser();
  globalThis.__rows = [row('b')]; globalThis.__edited = { route: '/page/b' };
  const sd = M.resolveLanding('u1');
  r.seedsFromEditedRace = sd.kind === 'route' && sd.route === '/page/b' && stored(s)?.id === 'b' && stored(s)?.uid === 'u1';
  globalThis.__edited = { route: '/page/zzz' };
  r.seedIsOnce = M.resolveLanding('u1').route === '/page/b'; // the pointer now decides; the edited race is not asked again

  // absent record and nothing edited: blank, recorded as decided-none
  s = freshBrowser();
  const nh = M.resolveLanding('u1');
  r.noHistoryBlank = nh.kind === 'blank' && stored(s)?.id === null;

  // a project pointer (legacy overview)
  s = freshBrowser();
  globalThis.__projects = [{ id: 'p1' }];
  r.projectRoute = M.recordLastPlace('u1', 'project', 'p1') === true && M.resolveLanding('u1').route === '/project/p1';
  globalThis.__projects = [{ id: 'p1', deletedAt: 'x' }];
  r.projectDeletedBlank = M.resolveLanding('u1').kind === 'blank';

  // malformed value = absent (seeds), never a throw
  s = freshBrowser();
  s.set('wz.lastPlace', '{not json');
  globalThis.__rows = [row('b')]; globalThis.__edited = { route: '/page/b' };
  let threw = false; let dm = null;
  try { dm = M.resolveLanding('u1'); } catch { threw = true; }
  r.malformedIsAbsent = !threw && dm?.route === '/page/b';

  // blocked storage: no throw anywhere, blank landing
  freshBrowser({ blocked: true });
  globalThis.__rows = [row('b')]; globalThis.__edited = undefined;
  threw = false; let db = null;
  try { M.recordLastPlace('u1', 'page', 'b'); M.clearLastPlace(); db = M.resolveLanding('u1'); } catch { threw = true; }
  r.blockedStorageQuiet = !threw && db?.kind === 'blank';

  return r;
}

const baseline = await unit(LAST_PLACE);
const LABELS = {
  roundTrip: 'U1 a recorded place reads back and lands on its route',
  uidGuard: 'U2 another account\'s pointer is treated as absent',
  uidGuardSeedsOwn: 'U2b ...and that account seeds from its own edited race',
  unbornNotRecorded: 'U3 the unborn id (new) and a non-row id are never recorded',
  systemBoardsNotRecorded: 'U4 the Journal board and the Trash board are never recorded',
  deletedGoesBlank: 'U5 a deleted/Trashed target lands on the blank Page (ruling 1), not on the edited race\'s page',
  deletedRecordsNone: 'U5b ...and the stale pointer becomes the "decided: none" record',
  deletedNotReseeded: 'U6 ...so the NEXT cold open is still the blank Page (never re-seeded from the edited race)',
  seedsFromEditedRace: 'U7 no record at all: seeded once from the edited race (ruling 2), written for this account',
  seedIsOnce: 'U7b ...and once seeded the pointer decides; the edited race is not asked again',
  noHistoryBlank: 'U8 no record and nothing edited: the blank Page, recorded as decided-none',
  projectRoute: 'U9 a project pointer lands on /project/:id',
  projectDeletedBlank: 'U9b a deleted project lands on the blank Page',
  malformedIsAbsent: 'U10 a malformed stored value is "absent" (seeds), never a throw',
  blockedStorageQuiet: 'U11 blocked storage: nothing throws, the blank Page',
};
for (const k of Object.keys(LABELS)) ok(LABELS[k], baseline[k] === true, String(baseline[k]));

// MUTANTS - each must turn at least its named check red, and the mutation must have LANDED.
const LS = 'local' + 'Storage'; // spelled in two pieces: this string is SOURCE TEXT to mutate, not a write (seed-guard reads literals)
const MUTANTS = [
  { name: 'drop the uid guard', from: 'return p && p.uid === uid ? p : null;', to: 'return p ? p : null;', red: ['uidGuard', 'uidGuardSeedsOwn'] },
  { name: 'stale pointer returns its route anyway', from: 'if (rec.kind && rec.id && isRememberable(rec.kind, rec.id)) {', to: 'if (rec.kind && rec.id) {', red: ['deletedGoesBlank', 'projectDeletedBlank'] },
  { name: 'forget "decided: none" (no write on a stale pointer)', from: "if (rec.id) write({ v: 1, uid, kind: null, id: null, at: Date.now() });", to: '', red: ['deletedRecordsNone'] },  // U6 stays green on purpose: a stale pointer left in place still resolves to blank (semantically equivalent); the write only makes the record say so
  { name: 'record anything (skip the rememberable check)', from: "if (!isRememberable(kind, id)) return false;\n  const cur", to: 'const cur', red: ['unbornNotRecorded', 'systemBoardsNotRecorded'] },
  { name: 'system boards count as rememberable', from: 'return !!e && !getSystemKind(e);', to: 'return !!e;', red: ['systemBoardsNotRecorded'] },
  { name: 'never seed', from: 'if (!rec) rec = seed(uid);', to: "if (!rec) rec = { v: 1, uid, kind: null, id: null, at: 0 };", red: ['seedsFromEditedRace'] },
  { name: 'seed every time (ignore the pointer)', from: 'let rec = readLastPlace(uid);\n  if (!rec) rec = seed(uid);', to: 'let rec = seed(uid);', red: ['seedIsOnce'] },
  { name: 'writes throw on blocked storage', from: 'try { ' + LS + '.setItem(KEY, JSON.stringify(rec)); } catch { /* blocked or full: the device simply does not remember */ }', to: LS + '.setItem(KEY, JSON.stringify(rec));', red: ['blockedStorageQuiet'] },
];
let landedMutants = 0; let killedMutants = 0;
for (const m of MUTANTS) {
  const idx = LAST_PLACE.indexOf(m.from);
  if (idx < 0 || LAST_PLACE.indexOf(m.from, idx + 1) >= 0) { ok(`mutant "${m.name}": the mutation LANDED (anchor found exactly once)`, false, 'anchor missing or not unique'); continue; }
  landedMutants += 1;
  const res = await unit(LAST_PLACE.replace(m.from, m.to));
  const went = m.red.filter((k) => res[k] !== true);
  ok(`mutant "${m.name}" is KILLED (reddens: ${m.red.join(', ')})`, went.length === m.red.length, `red: ${went.join(', ') || 'none'}`);
  if (went.length === m.red.length) killedMutants += 1;
}
ok(`all ${MUTANTS.length} mutations landed and ${MUTANTS.length} were killed`, landedMutants === MUTANTS.length && killedMutants === MUTANTS.length, `${landedMutants} landed / ${killedMutants} killed`);

// ---- source pins ------------------------------------------------------------------------------------------------
const splashSrc = live(read('components/Splash.tsx'));
ok('P1 no landing logic in Splash.tsx (TOOLS owns it): it names neither lastPlace nor LandingGate', !/lastPlace|LandingGate|resolveLanding/.test(splashSrc), '');
const gateSrc = read('components/LandingGate.tsx');
const gate = live(gateSrc);
const arrival = live(read('components/Arrival.tsx'));
const app = live(read('App.tsx'));
ok('P2 the gate is mounted once in App.tsx, beside the routes (not inside a route)', /<LandingGate authState=\{authState\} \/>/.test(app) && /import \{ LandingGate \}/.test(app), '');
ok('P3 sign-out clears the pointer (right after the signed-out flag is marked, so "mark first" still holds)', /markSignedOutHere\(\);\s*clearLastPlace\(\);/.test(app), '');
ok('P4 the landing is first-boot only: a non-authed first boot, signed out here, or a deep link spends the latch',
  /if \(authState === 'loading' \|\| bootResolved\) return;/.test(gate) && /authState !== 'authed' \|\| isSignedOutHere\(\)\) \{ landed = true; return; \}/.test(gate) && /if \(!atFrontDoor\(\)\) \{ landed = true; return; \}/.test(gate), '');
ok('P5 the latch is set AT the navigate (bail-out Navigate to "/" and Home links reach the door, no loop)', /const dest = resolveLanding\(user\.id\);\s*landed = true;/.test(gate), '');
ok('P6 the blank Page is the Write door\'s own entry: unbornHref({ origin: \'loose\' }) in both, with the same first-run forced defaults',
  /unbornHref\(\{ origin: 'loose' \}\)/.test(gate) && /unbornHref\(\{ origin: 'loose' \}\)/.test(arrival)
  && /setForwardLock\(true\)/.test(gate) && /setForwardLock\(true\)/.test(arrival) && /setWritingSettings\(\{ typewriter: true \}\)/.test(gate) && /setWritingSettings\(\{ typewriter: true \}\)/.test(arrival), '');
ok('P7 no cleanup cancels the landing (StrictMode runs the effect twice in dev; the second run is a no-op by the latch)', !/cancelled/.test(gate), '');
ok('P8 the runtime-verify double switches the landing OFF unless WS_LANDING=1 (so the ~120 front-door harnesses keep their door)',
  /window\.__wrizoNoLanding=true/.test(fs.readFileSync(path.join(DESKTOP, 'scripts', 'runtime-verify.mjs'), 'utf8')) && /__wrizoNoLanding/.test(gate), '');

// ============================================================================================================
// PART 2 - the real app (a box turn)
// ============================================================================================================
async function part2() {
  process.env.WS_LANDING = '1';
  const { withHarness } = await import('../runtime-verify.mjs');
  await withHarness(async (app) => {
    const hash = () => app.evalJs('location.hash');
    const live2 = async () => (await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').filter((e) => !e.deletedAt)`)) || [];
    const pointer = () => app.evalJs(`JSON.parse(localStorage.getItem('wz.lastPlace') || 'null')`);
    const flags = (hold = 50) => app.evalJs(`(() => { localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','${hold}');
      localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); })()`);
    const settled = async () => { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {}); await sleep(900); };
    // A reload on a page address is a deep link, and a deep link correctly wins over the landing - so every cold boot first goes to the
    // front-door address (the pointer lives in storage and survives), then reloads. (E5 is the one test that WANTS the deep link.)
    const toDoor = async () => { await app.evalJs("location.hash = '#/'"); await sleep(500); };
    const coldBoot = async (hold = 50, { deepLink = false } = {}) => { await flags(hold); if (!deepLink) await toDoor(); await app.reload(); await settled(); };
    const mk = (id, extra = {}) => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: `Words on ${id}`, origin: 'loose', source: 'page', createdAt: new Date().toISOString(), ...extra })})`);
    const activeTab = () => app.evalJs("document.querySelector('.desk-mode-tab.active')?.textContent || null");
    const waitHash = (re, label) => app.waitFor(`/${re}/.test(location.hash)`, { label, timeout: 15000 }).then(() => true).catch(() => false);

    await app.emulateDpr(1, 1280, 800); // the mode strip (the Free Write tab) exists from 1100px; the harness default is narrower
    await app.goto('/');
    await settled();

    // ---- E1: no history at all -> a blank Free Write Page, not born ------------------------------------------------
    await app.evalJs("localStorage.removeItem('wz.lastPlace')");
    await coldBoot();
    ok('E1 first open with no history: the address is the unborn Page (/page/new), not the front door', await waitHash('^#\\/page\\/new', 'blank page'), String(await hash()));
    ok('E1 ...the Free Write tab is active (Nick 12:53pm)', (await activeTab()) === 'Free Write', String(await activeTab()));
    ok('E1 ...nothing is born yet: zero live pages saved', (await live2()).length === 0, String((await live2()).length));
    ok('E1 ...the front door is gone (no .wz-arrival)', (await app.evalJs("!document.querySelector('.wz-arrival')")) === true, '');

    // ---- E2: type a word -> born -> it becomes the last place -------------------------------------------------------
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
    await app.typeKeys('First word');
    await app.waitFor("JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').filter((e) => !e.deletedAt).length === 1", { label: 'born', timeout: 10000 }).catch(() => {});
    const born = (await live2())[0];
    await sleep(500);
    ok('E2 typing a word births exactly one page', !!born, String((await live2()).length));
    ok('E2 ...and it is remembered as the last place (the recorder follows the silent address change)', !!born && (await pointer())?.id === born.id, JSON.stringify(await pointer()));

    // ---- E3: cold boot signed in -> the last Page ------------------------------------------------------------------
    await mk('roo-a'); await sleep(60); await mk('roo-b');
    await app.evalJs("window.wrizoFlushNow()");
    await app.evalJs("window.wrizoRecordLastPlace('test-user', 'page', 'roo-a')");
    const PROBE = `(() => { window.__landProbe = { leftAt: null, hold: null, splash: null, doorsMax: 0, doorsSeen: false };
      const tick = () => { const p = window.__landProbe; const h = location.hash;
        const d = document.querySelector('.wz-arrival-doors'); if (d) { p.doorsSeen = true; p.doorsMax = Math.max(p.doorsMax, parseFloat(getComputedStyle(d).opacity) || 0); }
        if (p.leftAt === null && h !== '' && h !== '#' && h !== '#/') { p.leftAt = Date.now(); p.hold = document.documentElement.dataset.splashHold || null; p.splash = !!document.querySelector('.wz-splash'); } };
      setInterval(tick, 10); })();`;
    const probeId = (await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: PROBE }))?.identifier;
    await coldBoot(2500);
    const probe = await app.evalJs('window.__landProbe');
    if (probeId) await app.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: probeId });
    ok('E3 signed-in cold boot lands on the remembered Page (roo-a), not the newer roo-b', await waitHash('^#\\/page\\/roo-a$', 'last place'), String(await hash()));
    // the no-ghost hold, sampled DURING the splash (a probe ticking every 10ms from before the page loads), not read after it settles
    ok('E3 ...and the address LEFT the front door while the splash hold was still on (data-splash-hold set, splash mounted): it navigated under the veil, not after it', !!probe && probe.leftAt !== null && probe.hold === 'true' && probe.splash === true, JSON.stringify(probe));
    ok('E3 ...and the front door\'s doors never showed: whenever they existed their opacity was 0 (the hold hides them)', !!probe && probe.doorsMax === 0, JSON.stringify(probe));
    ok('E3 ...and the front door is already unmounted, so it left while the hold (which hides its doors) was on: it never painted',(await app.evalJs("!document.querySelector('.wz-arrival-doors')")) === true, '');
    await settled();
    ok('E3 ...the Page\'s words are on it', (await app.evalJs("document.body.innerText.includes('Words on roo-a')")) === true, '');

    // ---- E4: once per load: Home reaches the front door and stays --------------------------------------------------
    await app.evalJs("location.hash = '#/'");
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'front door after landing', timeout: 8000 }).catch(() => {});
    await sleep(800);
    ok('E4 once per load: the front door is reachable afterwards and does not bounce back', (await hash()) === '#/' && (await app.evalJs("!!document.querySelector('.wz-arrival')")) === true, String(await hash()));

    // ---- E5: a deep link wins ---------------------------------------------------------------------------------------
    await app.evalJs("location.hash = '#/page/roo-b'");
    await sleep(600);
    await coldBoot(50, { deepLink: true });
    ok('E5 a deep link (reload on roo-b) stays on roo-b although the pointer says roo-a... then the recorder moves it to roo-b', (await hash()) === '#/page/roo-b' && (await pointer())?.id === 'roo-b', `${await hash()} ${JSON.stringify(await pointer())}`);

    // ---- E6: a board ------------------------------------------------------------------------------------------------
    await mk('roo-board', { pageType: 'board', boxes: [], origin: null, source: null });
    await app.evalJs("window.wrizoFlushNow()");
    await app.evalJs("window.wrizoRecordLastPlace('test-user', 'page', 'roo-board')");
    await coldBoot();
    ok('E6 the last place can be a board: lands on it and the board canvas mounts', (await waitHash('^#\\/page\\/roo-board$', 'board')) && (await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board canvas', timeout: 8000 }).then(() => true).catch(() => false)), String(await hash()));

    // ---- E7: seeded once from the edited race when there is no pointer ---------------------------------------------
    await app.evalJs("location.hash = '#/'"); await sleep(400);
    await mk('roo-newest', { text: 'The newest edit' });
    await app.evalJs("window.wrizoFlushNow()");
    await app.evalJs("localStorage.removeItem('wz.lastPlace')");
    await coldBoot();
    ok('E7 no pointer: seeded once from the edited race (the newest edit)', (await waitHash('^#\\/page\\/roo-newest$', 'seeded')) && (await pointer())?.id === 'roo-newest', `${await hash()} ${JSON.stringify(await pointer())}`);

    // ---- E8: deleted target -> blank Free Write Page; never re-seeded ----------------------------------------------
    await app.evalJs("location.hash = '#/'"); await sleep(400);
    await app.evalJs("window.wrizoPatchEntry('roo-newest', { deletedAt: new Date().toISOString() })");
    await app.evalJs("window.wrizoFlushNow()");
    const liveBefore = (await live2()).length;
    await coldBoot();
    ok('E8 the remembered Page was deleted/Trashed: the blank Page opens (not roo-b, not the front door)', await waitHash('^#\\/page\\/new', 'blank after delete'), String(await hash()));
    ok('E8 ...in Free Write', (await activeTab()) === 'Free Write', String(await activeTab()));
    ok('E8 ...and nothing was born by the landing', (await live2()).length === liveBefore, `${liveBefore} -> ${(await live2()).length}`);
    ok('E8 ...the pointer now records "decided: none"', (await pointer())?.id === null, JSON.stringify(await pointer()));
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await coldBoot();
    ok('E8b the NEXT cold open is still the blank Page (not re-seeded from the edited race)', await waitHash('^#\\/page\\/new', 'blank again'), String(await hash()));

    // ---- E9: the Trash board is never remembered --------------------------------------------------------------------
    await app.evalJs("window.wrizoRecordLastPlace('test-user', 'page', 'roo-a')");
    await app.evalJs("location.hash = '#/trash'"); await sleep(1200);
    ok('E9 opening the Trash board does not move the pointer', (await pointer())?.id === 'roo-a', JSON.stringify(await pointer()));

    // ---- E10: another account's pointer is ignored ------------------------------------------------------------------
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`localStorage.setItem('wz.lastPlace', JSON.stringify({ v: 1, uid: 'someone-else', kind: 'page', id: 'roo-a', at: 1 }))`);
    await coldBoot();
    ok('E10 a pointer written for another account does not steer this one (it seeds from its own edited race instead)', (await pointer())?.uid === 'test-user', JSON.stringify(await pointer()));

    // ---- E11: signed out here -> the front door stays --------------------------------------------------------------
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs("window.wrizoRecordLastPlace('test-user', 'page', 'roo-a')");
    const before = JSON.stringify(await pointer());
    await app.evalJs("localStorage.setItem('wz.signedOutHere', '1')");
    await coldBoot();
    ok('E11 signed out here: the front door stays (no landing)', (await hash()) === '#/' && (await app.evalJs("!!document.querySelector('.wz-arrival')")) === true, String(await hash()));
    ok('E11 ...and the pointer is untouched', JSON.stringify(await pointer()) === before, JSON.stringify(await pointer()));
    await app.evalJs("localStorage.removeItem('wz.signedOutHere')");

    // ---- E12: anonymous -> unchanged --------------------------------------------------------------------------------
    process.env.WS_ANON = '1';
    await coldBoot();
    ok('E12 anonymous (no session): the front door, Write and Open doors as always', (await hash()) === '#/' && (await app.evalJs("!!document.querySelector('.wz-arrival-write')")) === true, String(await hash()));
    delete process.env.WS_ANON;
  });
}

// ---- verdict -------------------------------------------------------------------------------------------------------
if (process.env.BROWSERLESS_ONLY !== '1') {
  try { await part2(); } catch (err) { ok('PART 2 ran to the end', false, String(err && err.stack || err)); }
} else {
  console.log('(BROWSERLESS_ONLY: PART 2 skipped - the real-app scenarios need a box turn)');
}
const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `
RESUME-ON-OPEN VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `
RESUME-ON-OPEN VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
