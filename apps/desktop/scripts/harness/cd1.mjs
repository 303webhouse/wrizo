// CD1 — the Composed Desk (docs/wrizo-alpha/cd1-composed-desk-brief.md). A
// committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on fx1.mjs/ab3.mjs.
// Run: node apps/desktop/scripts/harness/cd1.mjs   (from the repo root, with
// dist-web freshly built via `pnpm run build:web`).
//
// S9's own park sweep (the rail's retirement + ToolRail's death falsifying
// checks across ab1/ab2/ab3/fx1) is NOT re-litigated here — every falsified
// check across those four files was parked (SUPERSEDED species, quoted
// verbatim) with a live successor in its OWN file, per the A4 convention.
// This file carries only CD1's OWN new-surface minimum asserts (S9's own
// list): geometry, the top line, the sliver, the glow, the loose-fixture
// default, and ToolRail's total absence.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()`;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// A fresh, framed, project-origin (book chapter) prose page in Free Write.
const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

// The Desk's start-writing / home-base door: a loose page, homing nowhere.
// S8 (A7) makes this open in Free Write BY DEFAULT — no explicit mode
// switch here (that IS what this file's own S8 check proves), unlike
// fx1.mjs's/ab3.mjs's own loose fixtures (which predate S8 and still
// switch explicitly for their own, unrelated, S3 rail-content purposes).
const freshLoosePage = async (app) => {
  await freshDesk(app);
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed (loose)' });
  await sleep(400);
};

// A fresh, framed script page.
const freshScriptPage = async (app) => {
  await freshDesk(app);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const headingId = 'cd1-script-heading';
    entries.push({ id: 'cd1-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] }] }, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after script seed' });
  await app.evalJs("location.hash = '#/page/cd1-script'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Script framed' });
  await sleep(250);
};

const openSliver = (app) => app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");

await withHarness(async (app) => {
  // ==========================================================================
  // S9 geometry — the paper's rect is byte-identical closed/open/dissolved.
  // ==========================================================================
  await freshProsePage(app);

  const paperClosed = await app.evalJs(rectOf('.mode-pagecol'));
  await openSliver(app);
  await sleep(200);
  const paperOpen = await app.evalJs(rectOf('.mode-pagecol'));
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('dissolve probe');
  await sleep(150);
  const paperDissolved = await app.evalJs(rectOf('.mode-pagecol'));
  ok('S9 geometry: the paper rect is byte-identical with the sliver closed, open, and dissolved (the hard invariant — an overlay, never a track)',
    JSON.stringify(paperClosed) === JSON.stringify(paperOpen) && JSON.stringify(paperOpen) === JSON.stringify(paperDissolved),
    JSON.stringify({ paperClosed, paperOpen, paperDissolved }));

  // -- S3 re-floored: the drawer track's rect is byte-identical across
  // Page/Places (the two remaining faces only). ------------------------------
  const trackPage = await app.evalJs(rectOf('.desk-frame-toolrail'));
  await app.evalJs("document.querySelector('.wz-drawer-pull-place[data-place=\"journal\"]').click()");
  await sleep(220);
  const trackPlace = await app.evalJs(rectOf('.desk-frame-toolrail'));
  ok('S3 re-floored: the drawer track rect is byte-identical across Page <-> Places (the only two remaining faces)',
    JSON.stringify(trackPage) === JSON.stringify(trackPlace), JSON.stringify({ trackPage, trackPlace }));
  await app.evalJs("document.querySelector('.wz-drawer-pull-place[data-place=\"journal\"]').click()"); // toggle back to page

  // ==========================================================================
  // S9 geometry — frame centered, symmetric outer margins at a wide viewport.
  // ==========================================================================
  await app.emulateDpr(1, 2200, 1000);
  await sleep(250);
  const wideMargins = await app.evalJs(`(() => {
    const grid = document.querySelector('.desk-frame-grid').getBoundingClientRect();
    return { left: grid.left, right: window.innerWidth - grid.right, viewport: window.innerWidth };
  })()`);
  ok('S5: the composed frame centers with symmetric outer margins at a wide viewport (>=2200px)',
    Math.abs(wideMargins.left - wideMargins.right) <= 2, JSON.stringify(wideMargins));
  const wideFrameWidth = await app.evalJs("document.querySelector('.desk-frame-grid').getBoundingClientRect().width");
  ok('S5: the composed frame caps at (or under) --frame-max (1720px) rather than stretching edge to edge',
    wideFrameWidth <= 1720 + 2, String(wideFrameWidth));
  await app.emulateDpr(1, 1400, 900);
  await sleep(200);

  // ==========================================================================
  // S4 — the far-left rail retires framed; the reclaimed space actually
  // reaches the composed frame (not a dead gap).
  // ==========================================================================
  const railAndGutter = await app.evalJs(`({
    railAbsent: !document.querySelector('.desk-rail'),
    appMainPaddingLeft: getComputedStyle(document.querySelector('.app-main')).paddingLeft,
    hostLeftEdge: document.querySelector('.desk-frame-host').getBoundingClientRect().left,
  })`);
  ok('S4: DeskRail (.desk-rail) does not mount while framed, AND .app-main\'s reserved gutter collapses to 0 (the space actually reaches the frame, not a dead gap)',
    railAndGutter.railAbsent && railAndGutter.appMainPaddingLeft === '0px' && railAndGutter.hostLeftEdge <= 1,
    JSON.stringify(railAndGutter));

  // ==========================================================================
  // S1 — the top line: exact engraved labels, left-set; no title node; Done
  // present alone; no Catch affordance anywhere framed.
  // ==========================================================================
  const topLine = await app.evalJs(`({
    stripLabels: [...document.querySelectorAll('.desk-mode-strip .desk-mode-tab')].map(b => b.textContent),
    stripInHeader: !!document.querySelector('.chrome-top .desk-mode-strip'),
    noCrumb: !document.querySelector('.sprint-crumb'),
    actionButtons: [...document.querySelectorAll('.sprint-actions button')].map(b => b.textContent.trim()),
    catchAnywhere: !!document.querySelector('.desk-rail-catch, .wz-catch') || document.body.innerText.includes('Catch a thought'),
  })`);
  ok('S1: the top line reads the exact ratified strings, left-set inside the header row',
    JSON.stringify(topLine.stripLabels) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']) && topLine.stripInHeader,
    JSON.stringify(topLine.stripLabels));
  ok('S1: no title/breadcrumb node in the header (the paper names itself; the Page face carries it)',
    topLine.noCrumb, JSON.stringify(topLine));
  ok('S1/cd1.1: the right corner holds Done plus the Pages/Plan flight doorway on a project-origin page — no Catch anywhere on this framed surface',
    JSON.stringify(topLine.actionButtons) === JSON.stringify(['Pages', 'Plan', 'Done']) && !topLine.catchAnywhere,
    JSON.stringify(topLine));

  // ==========================================================================
  // S2 — the sliver: grip present on prose; opening it carries Draft's
  // format tools (spot-check).
  // ==========================================================================
  ok('S2: the sliver grip is present on a framed prose page', await app.evalJs("!!document.querySelector('.wz-sliver-grip')"));
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft').click()");
  await sleep(150);
  const draftSpotCheck = await app.evalJs("!!document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Bold\"]')");
  ok('S2: opening the sliver in Draft carries the format tools (Bold present) — moved whole from ToolRail',
    draftSpotCheck, String(draftSpotCheck));

  // Grip persists through a dissolve; the panel itself recedes with the room.
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('grip persistence probe');
  await sleep(150);
  const gripPersistence = await app.evalJs(`({
    gripVisible: !!document.querySelector('.wz-sliver-grip'),
    gripOpacity: getComputedStyle(document.querySelector('.wz-sliver-grip')).opacity,
    gripPointerEvents: getComputedStyle(document.querySelector('.wz-sliver-grip')).pointerEvents,
    panelPointerEvents: getComputedStyle(document.querySelector('.wz-sliver-panel')).pointerEvents,
    frameWriting: document.querySelector('.desk-frame')?.dataset.writing,
  })`);
  ok('S2: a keystroke dissolves the OPEN sliver\'s panel (the one vanishing engine) while the grip itself persists (never chrome-fade)',
    gripPersistence.frameWriting === 'true' && gripPersistence.panelPointerEvents === 'none'
      && gripPersistence.gripVisible && gripPersistence.gripOpacity !== '0' && gripPersistence.gripPointerEvents !== 'none',
    JSON.stringify(gripPersistence));

  // ==========================================================================
  // S2 — the sliver on script too (grip present on prose AND script).
  // ==========================================================================
  await freshScriptPage(app);
  ok('S2: the sliver grip is present on a framed script page too (S7 mirrors prose)', await app.evalJs("!!document.querySelector('.wz-sliver-grip')"));
  await openSliver(app);
  await sleep(200);
  const scriptStructureCheck = await app.evalJs("!!document.querySelector('.wz-sliver-structure')");
  ok('S2/S7: opening the sliver on script carries the structure picker (script\'s own hand tool)', scriptStructureCheck, String(scriptStructureCheck));

  // ==========================================================================
  // S7 — ScriptEditor gains the drawer too (Page + Places), mirroring prose.
  // ==========================================================================
  const scriptDrawer = await app.evalJs(`({
    pagePullPresent: !!document.querySelector('.wz-drawer-pull-page'),
    placesPresent: document.querySelectorAll('.wz-drawer-pull-place').length === 3,
    restFace: document.querySelector('.wz-drawer-face')?.dataset.face,
  })`);
  ok('S7: ScriptEditor mounts the SAME drawer as prose (Page pull + 3 Places, resting on Page)',
    scriptDrawer.pagePullPresent && scriptDrawer.placesPresent && scriptDrawer.restFace === 'page',
    JSON.stringify(scriptDrawer));

  // ==========================================================================
  // S1/cd1.1 — ScriptEditor's header also carries the Pages/Plan flight
  // toggle beside Done, on a real project-origin screenplay (the actual
  // screenplay-creation door, not the script fixture above, which is loose).
  // ==========================================================================
  await freshDesk(app);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"screenplay\"]')", { label: 'CreateProject picker (screenplay)' });
  await app.evalJs("document.querySelector('[data-kind=\"screenplay\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'screenplay project lands' });
  await sleep(200);
  const scriptActionButtons = await app.evalJs("[...document.querySelectorAll('.sprint-actions button')].map(b => b.textContent.trim())");
  ok('S1/cd1.1: ScriptEditor\'s header also carries the Pages/Plan flight toggle beside Done on a project-origin screenplay',
    JSON.stringify(scriptActionButtons) === JSON.stringify(['Pages', 'Plan', 'Done']), JSON.stringify(scriptActionButtons));

  // ==========================================================================
  // S8 (A7) — a loose page opens in Free Write on first mount, no explicit
  // switch (the FX1 review lesson: set/verify the mode explicitly, never
  // assume a default — this check IS that verification, for THIS default).
  // ==========================================================================
  await freshLoosePage(app);
  const looseModeOnMount = await app.evalJs("document.querySelector('.desk-mode-tab.active')?.textContent");
  ok('S8 (A7): a fresh loose-origin page\'s active mode tab is Free Write on first mount (no click needed)',
    looseModeOnMount === 'Free Write', String(looseModeOnMount));

  // -- S2, spot-check: forward lock present in Free Write on this loose
  // fixture (mode furniture, per A4, everywhere — moved whole to the sliver).
  await openSliver(app);
  await sleep(200);
  const looseForwardLock = await app.evalJs("!!document.querySelector('.wz-sliver-forwardlock')");
  ok('S2: opening the sliver on the loose fixture (Free Write) carries the forward lock (mode furniture, A4)', looseForwardLock, String(looseForwardLock));

  // ==========================================================================
  // S6 — the goal system: default target ships, progress hairline + glow are
  // present with intensity between 0 and the cap on partial progress.
  // ==========================================================================
  const goalDefault = await app.evalJs("localStorage.getItem('wrizo-writing-goal-lines')");
  ok('S6: a default writer-level target ships (24 line-equivalents) — never set, but read as the default',
    goalDefault === null, String(goalDefault));

  const goalBlockPresent = await app.evalJs(`({
    goalBlock: !!document.querySelector('.wz-sliver-goal'),
    hairline: !!document.querySelector('.wz-sliver-goal-hairline'),
    glow: !!document.querySelector('.wz-goal-glow'),
  })`);
  ok('S6: the goal block (progress hairline, sliver foot) AND the glow are present when a target exists (the shipped default)',
    goalBlockPresent.goalBlock && goalBlockPresent.hairline && goalBlockPresent.glow, JSON.stringify(goalBlockPresent));

  // Small target so a few typed lines cross a meaningful fraction quickly.
  await app.evalJs("localStorage.setItem('wrizo-writing-goal-lines', '2')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'loose page reloaded, target=2' });
  await sleep(300);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('a'); // one short hard-newline-free line: 1 of 2 target lines -> partial
  await sleep(150);
  const glowPartial = await app.evalJs(`(() => {
    const el = document.querySelector('.wz-goal-glow');
    const cap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--goal-glow-cap'));
    const intensity = parseFloat(el.style.getPropertyValue('--glow-intensity'));
    return { intensity, cap };
  })()`);
  ok('S6: with the default target, partial progress yields the glow element with an intensity var strictly between 0 and the cap',
    glowPartial.intensity > 0 && glowPartial.intensity < glowPartial.cap, JSON.stringify(glowPartial));

  // Cross into a second SOFT-WRAPPED line (no Enter — Free Write's own
  // Run-model Enter handling is a separate, more complex mechanic this
  // check doesn't need to exercise): 60 more characters brings the single
  // unbroken run past CANONICAL_MEASURE_CH (60ch), so lines becomes
  // ceil(61/60)=2 === target (2) -> fraction 1.0, deterministically.
  const bodyNodesBefore = await app.evalJs("document.querySelectorAll('*').length");
  await app.typeKeys('x'.repeat(60));
  await sleep(300);
  const glowFull = await app.evalJs(`(() => {
    const el = document.querySelector('.wz-goal-glow');
    const cap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--goal-glow-cap'));
    const intensity = parseFloat(el.style.getPropertyValue('--glow-intensity'));
    return { intensity, cap };
  })()`);
  const bodyNodesAfter = await app.evalJs("document.querySelectorAll('*').length");
  const noArrivalDom = await app.evalJs("!document.querySelector('.action-toast') && !document.querySelector('[class*=\"celebrat\"]') && !document.querySelector('[class*=\"toast\"]')");
  ok('S6: simulating full progress — intensity reaches exactly the cap (fullness is the only arrival)',
    Math.abs(glowFull.intensity - glowFull.cap) < 0.005, JSON.stringify(glowFull));
  ok('S6: no new toast/celebration DOM appears at arrival (no announced numbers, no completion event)',
    noArrivalDom, `nodesBefore=${bodyNodesBefore} nodesAfter=${bodyNodesAfter}`);

  // Clearing the goal disables every instrument. Reopen the sliver first —
  // the reload above remounted it closed by default.
  await openSliver(app);
  await sleep(200);
  await app.evalJs("document.querySelector('.wz-sliver-goal-edit')?.click()");
  await sleep(100);
  await app.evalJs("document.querySelector('.wz-sliver-goal-edit-clear')?.click()");
  await sleep(200);
  const clearedState = await app.evalJs(`({
    hairlineGone: !document.querySelector('.wz-sliver-goal-hairline'),
    glowGone: !document.querySelector('.wz-goal-glow'),
    storage: localStorage.getItem('wrizo-writing-goal-lines'),
  })`);
  ok('S6: clearing the goal disables every instrument (hairline AND glow both gone)',
    clearedState.hairlineGone && clearedState.glowGone && clearedState.storage === '', JSON.stringify(clearedState));

  // ==========================================================================
  // S7/S9 — ToolRail is dead: zero .desk-toolrail nodes anywhere framed
  // (prose, script, loose — every surface this suite has visited).
  // ==========================================================================
  const toolRailGoneEverywhere = await app.evalJs("document.querySelectorAll('[class*=\"desk-toolrail\"]').length");
  ok('S7/S9: zero .desk-toolrail-* nodes anywhere on this (loose, framed) surface', toolRailGoneEverywhere === 0, String(toolRailGoneEverywhere));

  await freshProsePage(app);
  const toolRailGoneProse = await app.evalJs("document.querySelectorAll('[class*=\"desk-toolrail\"]').length");
  ok('S7/S9: zero .desk-toolrail-* nodes on a framed prose surface', toolRailGoneProse === 0, String(toolRailGoneProse));

  await freshScriptPage(app);
  const toolRailGoneScript = await app.evalJs("document.querySelectorAll('[class*=\"desk-toolrail\"]').length");
  ok('S7/S9: zero .desk-toolrail-* nodes on a framed script surface', toolRailGoneScript === 0, String(toolRailGoneScript));

  // -- Legacy (<1100px) stays completely untouched — DeskRail mounts, the
  // sliver/drawer-Page-rest concepts don't apply (no DeskFrame at all). -----
  await app.emulateDpr(1, 900, 900);
  await sleep(200);
  const legacyUntouched = await app.evalJs(`({
    deskFrameGone: !document.querySelector('.desk-frame'),
    railPresent: !!document.querySelector('.desk-rail'),
    appMainPadding: getComputedStyle(document.querySelector('.app-main')).paddingLeft,
  })`);
  ok('Invariant: legacy (<1100px) is completely untouched — DeskFrame does not mount, DeskRail is back, the gutter is reserved again',
    legacyUntouched.deskFrameGone && legacyUntouched.railPresent && legacyUntouched.appMainPadding !== '0px',
    JSON.stringify(legacyUntouched));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// cd1.mjs is a brand-new file; it parks nothing of its own (every check
// above reflects this ticket's live, current design). The park sweep this
// ticket's own S9 requires — every check ToolRail's death and the rail's
// retirement falsified — lives in EACH superseded check's own file
// (ab1.mjs, ab2.mjs, ab3.mjs, fx1.mjs), per the A4 convention: a file parks
// what supersedes ITS OWN checks. This scaffold exists so a future ticket
// that supersedes any of THIS file's checks has a documented home, matching
// every other harness file's own pattern.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nCD1 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of cd1.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nCD1 VERIFY: PASS (${checks.length} checks)` : `\nCD1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
