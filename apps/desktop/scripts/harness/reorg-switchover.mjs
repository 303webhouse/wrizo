// THE SWITCH-OVER (Fable's ruling, Nov 20, 6:00 pm; build order Nov 20, 11:15 pm: "reorg ON by default in Machina, ?reorg=0 off; rail and
// prefs sync gated on Machina; the driver pin with reorg=0, no assertion edits"). The reorg is ON with no switch in the URL; ?reorg=0 turns it
// off (tests only); everything it draws still needs Machina, and so do the two account syncs (reorg/railSaved.ts, reorg/prefsSaved.ts).
// Arbor and Flux draw nothing of it. THE DRIVER PIN: a harness file that does not ask for the reorg (no ?reorg=1 in its URL) is served
// window.__wrizoReorgOff and so opens Machina exactly as it did before the switch-over; a file asks for the default by WS_REORG=1 (this one).
//
// The fixture (seams only): one loose page sw-1.
//
// ON      O1  Machina, no switch in the URL (WS_REORG=1: no pin): the reorg's top rail is drawn on the page
// OFF     O2  the same build with ?reorg=0: no reorg element anywhere (O1 having been on)
// THEMES  O3  Arbor and Flux, no switch in the URL: no reorg element anywhere (O1 having been on)
// SYNC    S1  the preferences sync is Machina's: in Arbor a preference set writes no local copy and a round calls no server; the same acts in
//             Machina write the copy and call /api/prefs
//         S2  the rail's sync is Machina's too: railSaved.ts's local write (persist) and its server round (syncRail) both start on the Machina
//             gate, as prefsSaved.ts's persist, setPref and syncPrefs do
// PIN     P1  without WS_REORG the driver serves window.__wrizoReorgOff: Machina with no switch draws no reorg element; with ?reorg=1 the
//             top rail is drawn (a file that asks still gets it)
// SOURCE  N1  the switch is read from the URL and the driver's flag only: no stored flag, no storage key
//         [S1 and S2 successors, train H: main's switchless prefs (the room, writing and goal facts are saved and synced in every theme) leave a REORG fact
//         Machina's: in Arbor it is neither written to the copy nor kept, the round may still run for the switchless facts; the gates read the table]
// RULING  R2  (Fable, Nov 21, 9:40 pm: default-on in Machina ONLY; Arbor and Flux keep ?reorg=1 until all six of their cells pass) every reader of the table outside
//             a hook asks reorgFor (Tutor's back and split, BoardEditor's Plan presets); no bare `REORG && themeHas(` is left (the hook's own ruling: reorg-theme-gate-unit)
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-switchover.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
import { srcText } from '../global-css.mjs';

process.env.WS_REORG = '1';   // this file tests the default itself: the driver's pin is lifted, and put back for P1
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srcBoard = () => srcText(SRC, 'components/BoardEditor.tsx');   // a split file is read as its module and its parts, joined (the 10g readers rule)
const src = (f) => { const p = path.join(SRC, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
// every element the reorg draws carries a reorg- class (the top rail, the rail, the Parts list, the Back menu's pieces)
const REORG_ELS = "(() => { const els = [...document.querySelectorAll('[class*=\"reorg-\"]')]; return { n: els.length, top: !!document.querySelector('.reorg-top'), first: els.slice(0, 4).map((e) => String(e.className).slice(0, 40)) }; })()";

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  return app.evalJs(`(() => { const e = window.wrizoCreateJournalPage({ id: 'sw-1', text: 'A page for the switch-over', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' }); window.wrizoFlushNow(); return !!e; })()`);
}

async function openIn(app, theme, query) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set(${JSON.stringify(theme)}); null`);
  await app.evalJs(`history.replaceState(null, '', '/${query}#/page/sw-1'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `the page in ${theme} ${query || '(no switch)'}`, timeout: 15000 }).catch(() => {});
  await sleep(1200);
  return app.evalJs(REORG_ELS);
}

// the preferences seam, with the page's fetch counted for /api/prefs (the real fetch wrapped once per page load)
const PREFS_ACTS = (probe) => `(async () => {
  const W = window; const P = W.wrizoPrefs; if (!P) return { seam: false };
  if (!W.__swFetch) { const real = W.fetch.bind(W); W.__swCalls = 0; W.fetch = (u, o) => { if (String(u).includes('/api/prefs')) W.__swCalls++; return real(u, o); }; W.__swFetch = 1; }
  const before = localStorage.getItem('wrizo-reorg-prefs'); const calls0 = W.__swCalls;
  P.set('switchProbe', { v: ${JSON.stringify(probe)} });
  try { await P.sync(); } catch { /* a server without the route: the count is what is read */ }
  await new Promise((r) => setTimeout(r, 300));
  const after = localStorage.getItem('wrizo-reorg-prefs');
  return { seam: true, wrote: after !== before && after != null && after.includes(${JSON.stringify(probe)}), calls: W.__swCalls - calls0, kept: !!P.pref('switchProbe') };
})()`;

await withHarness(async (app) => {
  const seeded = await seed(app);

  // ---- ON / OFF / THEMES -----------------------------------------------------------------------------------------------------------------
  const on = await openIn(app, 'machina', '');
  ok('O1 Machina with no switch in the URL: the reorg\'s top rail is drawn on the page', seeded && on.top && on.n > 0, { seeded, on });
  const off = await openIn(app, 'machina', '?reorg=0');
  ok('O2 the same build with ?reorg=0: no reorg element anywhere (O1 having been on)', on.top && off.n === 0, { on: on.n, off });
  const arbor = await openIn(app, 'plateau', '');
  const flux = await openIn(app, 'flux', '');
  ok('O3 Arbor and Flux with no switch in the URL: no reorg element anywhere (O1 having been on)', on.top && arbor.n === 0 && flux.n === 0, { arbor, flux });

  // ---- SYNC ------------------------------------------------------------------------------------------------------------------------------
  await openIn(app, 'plateau', '');
  const inArbor = await app.evalJs(PREFS_ACTS('arbor-probe'));
  await app.evalJs("window.wrizoTheme.set('machina'); null"); await sleep(600);
  const inMachina = await app.evalJs(PREFS_ACTS('machina-probe'));
  // SUPERSEDED (train H's switchless prefs: the room, writing and goal facts are saved and synced in every theme, so a round in Arbor DOES call the server, for
  // them; merged by POLISH with the switch-over, Nov 21). The original, verbatim:
  // ok('S1 the preferences sync is Machina\'s: in Arbor a set writes no local copy and a round calls no server; in Machina the same acts write the copy and call /api/prefs',
  //   inArbor.seam && !inArbor.wrote && inArbor.calls === 0 && inMachina.seam && inMachina.wrote && inMachina.calls > 0, { inArbor, inMachina });
  // [successor] a REORG fact is Machina's: in Arbor it is neither written to the copy nor kept; in Machina it is written, kept and synced
  ok('S1 [successor] a reorg fact is Machina\'s: in Arbor a set writes no local copy and keeps nothing (a round may still run, for the switchless facts); in Machina it is written, kept and sent to /api/prefs',
    inArbor.seam && !inArbor.wrote && !inArbor.kept && inMachina.seam && inMachina.wrote && inMachina.kept && inMachina.calls > 0, { inArbor, inMachina });

  // ---- PIN -------------------------------------------------------------------------------------------------------------------------------
  delete process.env.WS_REORG;
  const pinned = await openIn(app, 'machina', '');
  const served = await app.evalJs("fetch('/').then((r) => r.text()).then((t) => t.includes('window.__wrizoReorgOff=true'))");
  const asked = await openIn(app, 'machina', '?reorg=1');
  ok('P1 without WS_REORG the driver serves window.__wrizoReorgOff: Machina with no switch draws no reorg element; with ?reorg=1 the top rail is drawn',
    served === true && pinned.n === 0 && asked.top, { served, pinned, asked });
});

// ---- SOURCE ----------------------------------------------------------------------------------------------------------------------------
{
  const strip = (s) => s.replace(/\/\/.*$/gm, '');
  const rail = strip(src('reorg/railSaved.ts')), prefs = strip(src('reorg/prefsSaved.ts'));
  const gated = (s, head) => new RegExp(`${head}\\{\\s*if \\(!reorgInMachina\\(\\)\\) return;`).test(s);
  // SUPERSEDED (train H's switchless prefs: prefsSaved's persist, setPref and syncPrefs run for the room, writing and goal facts in every theme, so they no longer
  // START on the gate; a reorg fact passes it inside them). The original, verbatim:
  // const r = { railPersist: gated(rail, 'function persist\\(\\): void '), railSync: gated(rail, 'export async function syncRail\\(\\): Promise<void> '),
  //   prefsPersist: gated(prefs, 'function persist\\(\\): void '), prefsSync: gated(prefs, 'export async function syncPrefs\\(\\): Promise<void> '),
  //   prefsSet: /export function setPref\(name: string, value: Record<string, unknown>\): void \{\s*if \(!reorgInMachina\(\) \|\| !FACT_RE\.test\(name\)\) return;/.test(prefs) };
  // ok('S2 the rail\'s sync is Machina\'s too: railSaved persist and syncRail start on the Machina gate, as prefsSaved persist, setPref and syncPrefs do', Object.values(r).every(Boolean), r);
  // [successor] the rail starts on the gate as before; prefsSaved lets a reorg fact through only on it: allowed(), the copy it keeps, and the round after sign-in
  const r2 = { railPersist: gated(rail, 'function persist\\(\\): void '), railSync: gated(rail, 'export async function syncRail\\(\\): Promise<void> '),
    prefsAllowed: /const allowed = \(name: string\): boolean => reorgInMachina\(\) \|\| SWITCHLESS\.has\(name\);/.test(prefs),
    prefsSet: /export function setPref\(name: string, value: Record<string, unknown>\): void \{\s*if \(!allowed\(name\) \|\| !FACT_RE\.test\(name\)\) return;/.test(prefs),
    prefsCopy: /const mine: PrefsRecord = reorgInMachina\(\) \? prefs :/.test(prefs), prefsRound: /if \(!reorgInMachina\(\) && roundsThisSignIn > 0\) return;/.test(prefs),
    noBareSwitch: !/[^.\w]REORG \? prefs|!REORG && roundsThisSignIn|=> REORG \|\|/.test(prefs) };
  ok('S2 [successor] the rail\'s sync starts on the gate; prefsSaved lets a reorg fact through only on it (allowed, the copy, the round after sign-in), never on the bare switch', Object.values(r2).every(Boolean), r2);
  const flag = strip(src('reorg/flag.ts'));
  ok('N1 the switch is read from the URL and the driver\'s flag only: no stored flag, no storage key',
    /__wrizoReorgOff/.test(flag) && /get\('reorg'\)/.test(flag) && !/localStorage|sessionStorage|indexedDB/.test(flag), { flag: flag.trim().slice(-400) });
  const tutor = strip(src('components/Tutor.tsx')), board = strip(srcBoard()), gate = strip(src('reorg/themeGate.ts')), fluxWords = strip(src('store/lexicon/overrides/fluxReorg.ts')), flagSrc = strip(src('reorg/flag.ts'));
  const r3 = { tutorBack: tutor.includes("reorgFor(tutorTheme) && themeHas('back', tutorTheme)"), tutorSplit: tutor.includes("reorgFor(tutorTheme) && themeHas('split', tutorTheme)"),
    planPresets: board.includes("reorgFor(theme) && themeHas('back', theme)"), noBare: !/REORG && themeHas\(/.test(tutor) && !/REORG && themeHas\(/.test(board),
    defaults: /REORG_DEFAULT_ON: Record<ThemeId, boolean> = \{ machina: true, plateau: false, flux: false \}/.test(gate), hook: gate.includes('return reorgFor(t) && themeHas(piece, t);'),
    fluxWordsAsked: /REORG_ASKED \? \{ flux: \{ \.\.\.LIVE\.flux, \.\.\.FLUX_REORG_WORDS \} \} : LIVE;/.test(fluxWords) && !/\bREORG \? \{ flux:/.test(fluxWords),
    pageLoadDefault: /: \(typeof location !== 'undefined' && !pinnedOff\);/.test(flagSrc) };
  ok('R2 (the switch-over ruling) every table reader outside a hook asks reorgFor (Tutor back and split, the Plan presets), none asks the bare switch; Machina alone is on by default (Flux\'s reorg words too: they come with the ask); the default is a page load\'s (a read with no location sees it off)', Object.values(r3).every(Boolean), r3);
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 8;   // 7 + R2 (Fable, Nov 21, 9:40 pm)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-SWITCHOVER VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-SWITCHOVER VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
