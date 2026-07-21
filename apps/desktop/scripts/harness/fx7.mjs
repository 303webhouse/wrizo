// FX7 — the Second Sitting's Fixable Bugs (docs/wrizo-alpha/fx7-second-
// sitting-fixes-brief.md). A committed CDP verification scenario (per this
// project's own "harness scenarios persist" convention), modeled on
// fx6.mjs's own structure — freshDesk/freshProsePage/freshBoard/
// openPageCategory/openSliver below are the same shape those files already
// established, copied verbatim per this project's own standing instruction
// not to re-derive them.
// Run: node scripts/harness/fx7.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S1-S9 list: the screenplay/script page's own
// framed geometry (paper centered, sliver+Tutor both flush, both reference
// widths + the 1100 floor + a wide 2200px check past --frame-max) (S1);
// Bold/Italic + the ink-tool placeholder on Free Write's own rail, with a
// live re-proof that forward-lock's strike-never-erase deletion discipline
// stays untouched (S2); the cascade's own submenu sitting flush against the
// strip, zero gap, at every width including past --frame-max (S3); the
// systemic scrollbar restyle (S4); the four deck-card interaction bugs,
// root-caused against BOTH a deck-dealt card AND an ordinary board card,
// through genuinely trusted CDP pointer/click events (S5-S8); the deck
// wizard's own routing — which door Nick actually reached (S9).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const WIDE_W = 2200;
const FLOOR_W = 1100;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

const freshScriptPage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"screenplay\"]')", { label: 'CreateProject picker (screenplay)' });
  await app.evalJs("document.querySelector('[data-kind=\"screenplay\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.script-sheet')", { label: 'ScriptEditor mounted, framed' });
  await sleep(250);
};

const freshBoard = async (app, boardId, boxes, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX7 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// ab3.mjs's own openPageCategory helper, copied verbatim: index 1 in the
// strip is the Page category (SECTION_A: journal[0]; SECTION_B: page[1],
// plan[2]). IDEMPOTENT (checks first) — a second call on an already-open
// Page category would otherwise TOGGLE IT CLOSED (Cascade.tsx's own
// same-category-click-closes rule).
const openPageCategory = async (app) => {
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (openPageCategory)' });
  const alreadyOpen = await app.evalJs("!!document.querySelector('.wz-pageface-title')");
  if (alreadyOpen) return;
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open (openPageCategory)' });
};

const openSliver = (app) => app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");

// A GENERIC rect-reader (toJSON — DOMRect doesn't survive CDP's
// returnByValue serialization otherwise).
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.getBoundingClientRect().toJSON() : null; })()`);

// A genuinely trusted single click (mouseDown + mouseUp, real CDP Input
// events) at a fixed point — the S5-S8 shared discipline's own baseline
// gesture, distinct from a double-click.
const clickAt = async (app, x, y) => { await app.mouseDown(x, y); await sleep(30); await app.mouseUp(x, y); };

// S5-S9 — reaches an ACTUAL dealt board through B3's own real door
// (CreateProject.tsx's "Start from a deck…" -> DeckWizard -> Character
// Study, two-character answer — the SAME live path Nick himself walked),
// never a manually-seeded boxes array — the brief's own "an ACTUAL dealt
// card, not a manually-created one" instruction, since materializeDeck's
// own layout/overlap behavior is specifically what's under test.
const dealtBoard = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('button')", { label: 'CreateProject picker (deck door)' });
  await app.click('Start from a deck…');
  await sleep(200);
  await app.waitFor("!!document.querySelector('[data-deck-id=\"character-study\"]')", { label: 'deck library open' });
  await app.evalJs("document.querySelector('[data-deck-id=\"character-study\"]').click()");
  await sleep(200);
  await app.waitFor("document.querySelectorAll('.deck-wizard-option-btn').length > 0", { label: 'deck question open' });
  await app.evalJs("document.querySelectorAll('.deck-wizard-option-btn')[0].click()"); // 'two' characters
  await sleep(400);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'dealt board mounted' });
  await sleep(400);
  await app.emulateDpr(1, width, height);
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the screenplay/script page's own framed geometry, thorough review.
  // Root-caused live (index.css's own FX7 S1 comment on `.desk-frame-stage >
  // .desk-frame-scroll-cap` has the full derivation): FX3's own
  // `flex:1 1 auto` made the SCROLL-CAP (not `.mode-pagecol`) the flex item
  // that filled the stage's full main-axis width, so the paper rendered
  // flush against the scroll-cap's own left edge instead of centered within
  // it — exactly Nick's "way too small, and not centered" verdict, and
  // exactly why the sliver/tutor anchors (whose own CSS math assumes a
  // centered paper) then "float away from the page." A genuine FX3
  // regression, not a TU1 two-anchor wiring defect — ScriptEditor.tsx
  // already passes BOTH DeskFrame overlay anchors (sliver AND tutor)
  // correctly; confirmed by measuring the mounted page's own rects below,
  // not by reasoning on the CSS alone.
  // ==========================================================================
  for (const w of [FLOOR_W, LAPTOP_W, WIDE_W]) {
    await freshScriptPage(app, w, 900);
    const [stage, pagecol, sliverAnchor, tutorAnchor] = await Promise.all(
      ['.desk-frame-stage', '.mode-pagecol', '.desk-frame-sliver-anchor', '.desk-frame-tutor-anchor'].map(s => rectOf(app, s)),
    );
    const stageCx = stage.left + stage.width / 2;
    const pagecolCx = pagecol.left + pagecol.width / 2;
    ok(`S1 @${w}px: the script paper (.mode-pagecol) is genuinely centered in the stage — |center delta| < 1px`,
      Math.abs(stageCx - pagecolCx) < 1, JSON.stringify({ stageCx, pagecolCx }));
    ok(`S1 @${w}px: the paper never overflows the stage on either side (both reference widths + the 1100 floor)`,
      pagecol.left >= stage.left - 0.5 && pagecol.right <= stage.right + 0.5,
      JSON.stringify({ stage, pagecol }));
    // The sliver anchor's own right edge rides the paper's own left edge
    // (FX2 S1's law, mirrored verbatim from the prose surface); the tutor
    // anchor's own left edge rides the paper's own right edge (TU1 S2) —
    // both anchors flush to the NOW-correctly-centered paper, confirming
    // ScriptEditor.tsx genuinely uses BOTH DeskFrame overlay anchors, not
    // just one, and that neither "floats away" from the paper anymore.
    ok(`S1 @${w}px: the sliver anchor's own right edge is flush against the paper's own left edge (within the documented paper-padding dip, never beyond it)`,
      Math.abs(sliverAnchor.right - pagecol.left) <= 30, JSON.stringify({ sliverAnchorRight: sliverAnchor.right, pagecolLeft: pagecol.left }));
    ok(`S1 @${w}px: the Tutor's own grip anchor is flush against the paper's own right edge (within the documented paper-padding dip)`,
      Math.abs(tutorAnchor.left - pagecol.right) <= 30, JSON.stringify({ tutorAnchorLeft: tutorAnchor.left, pagecolRight: pagecol.right }));
  }
  // Legacy (<1100px) stays byte-identical — DeskFrame never mounts there at
  // all (the same AB1 gate every other framed surface obeys), so the
  // script page's pre-AB1 markup (maxWidth:'60ch' inline, no .mode-pagecol)
  // is untouched by this fix; a plain mount-shape check confirms the
  // legacy branch, not the framed one, is what's live below the gate.
  await freshDesk(app, 900, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"screenplay\"]')", { label: 'CreateProject picker (screenplay, legacy)' });
  await app.evalJs("document.querySelector('[data-kind=\"screenplay\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.script-sheet')", { label: 'ScriptEditor mounted, legacy' });
  await sleep(250);
  const legacyShape = await app.evalJs(`(() => ({
    hasDeskFrame: !!document.querySelector('.desk-frame'),
    hasModePagecol: !!document.querySelector('.mode-pagecol'),
    hasScriptPage: !!document.querySelector('.script-page'),
  }))()`);
  ok('S1: legacy (<1100px) stays byte-identical — no DeskFrame, no .mode-pagecol, the exact pre-AB1 .script-page markup',
    !legacyShape.hasDeskFrame && !legacyShape.hasModePagecol && legacyShape.hasScriptPage, JSON.stringify(legacyShape));

  // ==========================================================================
  // S2 — Free Write's own tool rail: Bold/Italic (reusing draftFormat.ts's
  // own FORMAT_MARK convention, not a second mechanism) + the ink-tool
  // placeholder (Journal's own toggle/icon shape, mirrored — disclosed
  // inert). Root-caused live (not merely built-then-assumed): the first
  // implementation used document.execCommand('insertText', ...) — this
  // codebase's own established programmatic-contenteditable-edit technique
  // — but that turned out NOT to reliably fire a `beforeinput` event this
  // editor's own journal-mode listener could intercept in this harness's
  // own Chromium build, silently bypassing the Run model and DROPPING the
  // inserted marker the moment a real keystroke's own re-render landed
  // (reproduced directly below, PARKED as its own disclosed regression
  // proof — see the PARKED section at the foot of this file). Fixed via
  // ForwardOnlyEditor's own new `insertMarkerRef` escape hatch instead
  // (calls the SAME `handleInput` a real keystroke calls).
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  // A fresh manuscript chapter opens in Free Write (mode='journal') by
  // default — no mode click needed.
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Free Write fixture' });
  await openSliver(app);
  await sleep(200);
  const railSections = await app.evalJs("[...document.querySelectorAll('.wz-sliver-h')].map(h => h.textContent)");
  ok('S2: Free Write\'s own rail carries a Format section (Bold/Italic) — previously entirely absent on an ordinary (project-origin) Free Write page',
    railSections.includes('Format'), JSON.stringify(railSections));
  const inkToolShape = await app.evalJs(`(() => {
    const btn = document.querySelector('.wz-sliver-ink-tool-toggle');
    return btn ? { present: true, disabled: btn.disabled, ariaDisabled: btn.getAttribute('aria-disabled') } : { present: false };
  })()`);
  ok('S2: Free Write\'s own rail carries the ink-tool toggle, mirrored from Journal\'s own pen/eraser icon shape — DISCLOSED INERT (disabled/aria-disabled), never pretending to be functional outside the true Journal surface',
    inkToolShape.present && inkToolShape.disabled === true && inkToolShape.ariaDisabled === 'true', JSON.stringify(inkToolShape));

  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Hello world');
  await sleep(200);
  await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Bold\"]').click()");
  await sleep(200);
  await app.typeKeys('bold text');
  await sleep(200);
  await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Bold\"]').click()");
  await sleep(200);
  const boldText = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S2: Bold\'s two-press bracket genuinely survives a real keystroke run typed BETWEEN the two clicks (the exact case the execCommand approach silently lost) — both ** markers present around the typed text',
    boldText === 'Hello world**bold text**', boldText);

  await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Italic\"]').click()");
  await sleep(150);
  await app.typeKeys('em');
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Italic\"]').click()");
  await sleep(150);
  const italicText = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S2: Italic\'s own bracket works too, immediately chained after Bold\'s own closing marker',
    italicText === 'Hello world**bold text***em*', italicText);

  // Forward-lock's own deletion discipline, re-verified live in this same
  // pass (S2's own "verify, don't assume" instruction): a real Backspace
  // after all this rail-driven insertion still STRIKES (never erases) —
  // the marker insertion never touched handleBackspace/eraseTail/
  // strikeStep at all.
  await app.key('Backspace');
  await sleep(150);
  const afterBackspace = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  const struckPresent = await app.evalJs("!!document.querySelector('.forward-only-editor .fo-struck')");
  ok('S2: forward-lock\'s deletion discipline is UNTOUCHED by the rail-driven marker insertion — a real Backspace still STRIKES (struck span present, text unchanged), never erases',
    afterBackspace === italicText && struckPresent === true, JSON.stringify({ afterBackspace, struckPresent }));

  // Journal's OWN sliver stays exactly as it was — no leaked Format/ink-
  // tool-placeholder section (this new capability is opt-in per host, and
  // JournalEntry.tsx's own sliverContent deliberately never sets it, since
  // its own real ink tool already lives on the sheet).
  await app.evalJs("location.hash = '#/journal/' + window.wrizoCreateJournalPage().id");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'JournalEntry framed (S2 regression)' });
  await sleep(250);
  await openSliver(app);
  await sleep(150);
  const journalRail = await app.evalJs(`(() => ({
    sections: [...document.querySelectorAll('.wz-sliver-h')].map(h => h.textContent),
    inkToolPresent: !!document.querySelector('.wz-sliver-ink-tool-toggle'),
    realOnSheetToggle: !!document.querySelector('.ink-tool-toggle'),
  }))()`);
  ok('S2 regression: the TRUE Journal surface\'s own sliver is untouched — no Format section, no ink-tool placeholder leaked in, and its own REAL on-sheet pen/eraser toggle is still present',
    !journalRail.sections.includes('Format') && !journalRail.inkToolPresent && journalRail.realOnSheetToggle,
    JSON.stringify(journalRail));

  // ==========================================================================
  // S3 — the cascade's own submenus, flush against the strip. Root-caused
  // live (index.css's own FX7 S3 comment on `.desk-frame-cascade-anchor`
  // has the full derivation): FX5 S10 pulled the strip clean out of the
  // grid's own flow (position:absolute, pinned to the screen's own left
  // edge) but this anchor's own `left:0` was never updated to match — it
  // stayed relative to the STAGE's own left edge, which (post-S10) no
  // longer coincides with the strip's own right edge at all. Measured, not
  // guessed: before the fix, the panel actually OVERLAPPED the strip by
  // ~44-68px (occluding its own icons) at ordinary widths, and drifted to
  // a ~228px gap past the --frame-max seam — both symptoms of the SAME
  // "left:0 no longer means what it used to" defect, not two separate bugs.
  // ==========================================================================
  for (const w of [FLOOR_W, LAPTOP_W, WIDE_W]) {
    await freshProsePage(app, w, 900);
    await openPageCategory(app);
    await sleep(150);
    const [strip, panel] = await Promise.all([rectOf(app, '.desk-frame-strip'), rectOf(app, '.wz-cascade-panel')]);
    const frameGap = await app.evalJs("parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--frame-gap'))");
    const gap = panel.left - strip.right;
    ok(`S3 @${w}px: the cascade panel sits genuinely FLUSH against the strip's own right edge — gap equals exactly --frame-gap (${frameGap}px), never an overlap and never a wider drift`,
      Math.abs(gap - frameGap) < 1, JSON.stringify({ gap, frameGap, strip, panel }));
    ok(`S3 @${w}px: no overlap — the panel's own left edge never sits before the strip's own right edge`,
      panel.left >= strip.right, JSON.stringify({ panelLeft: panel.left, stripRight: strip.right }));
  }
  // The Plan category's own survey (layer 3, a DIFFERENT cascade panel
  // component) rides the SAME anchor — one fix, both layers, confirmed
  // live rather than assumed from "they share a CSS rule" alone.
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()"); // close Page
  await sleep(150);
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][2].click()"); // open Plan
  await app.waitFor("!!document.querySelector('.wz-cascade-panel')", { label: 'Plan panel open (S3 survey check)' });
  await sleep(150);
  const [stripForSurvey, planPanel] = await Promise.all([rectOf(app, '.desk-frame-strip'), rectOf(app, '.wz-cascade-panel')]);
  const frameGapNow = await app.evalJs("parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--frame-gap'))");
  ok('S3: the Plan category\'s own panel (a distinct cascade tenant) is ALSO flush against the strip — confirms the fix lives on the shared anchor, not a one-off per-panel patch',
    Math.abs((planPanel.left - stripForSurvey.right) - frameGapNow) < 1, JSON.stringify({ planPanel, stripForSurvey }));

  // ==========================================================================
  // S4 — the systemic theme-aware scrollbar restyle. Extends the Plateau
  // board-canvas treatment (FX5 S3(a), `.board-canvas-wrap`) app-wide via a
  // single `*` rule (found live, not assumed, that `scrollbar-width` did
  // NOT actually inherit from a `:root`-only declaration in this project's
  // own Chromium build — `*` sidesteps that quirk entirely), plus a scoped
  // paper-toned override for the three light-surface scroll regions
  // (.mode-scroll/.desk-frame-scroll-cap/.board-text) so the thumb reads
  // legibly against the LIGHT paper rather than inheriting dark-chrome
  // tokens tuned for the desk ground.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await app.click('Draft');
  await sleep(200);
  const modeScrollStyle = await app.evalJs(`(() => {
    const cs = getComputedStyle(document.querySelector('.mode-scroll'));
    return { scrollbarWidth: cs.scrollbarWidth, scrollbarColor: cs.scrollbarColor };
  })()`);
  const inkOnPaperLow = await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--ink-on-paper-low').trim()");
  ok('S4: the page/script editor content area (.mode-scroll — used to hide its scrollbar ENTIRELY) now carries the minimal, THIN, paper-toned treatment instead of the bulky OS default',
    modeScrollStyle.scrollbarWidth === 'thin' && modeScrollStyle.scrollbarColor.includes('rgba(0, 0, 0, 0)'),
    JSON.stringify({ modeScrollStyle, inkOnPaperLow }));

  await openPageCategory(app);
  await sleep(150);
  const cascadePanelStyle = await app.evalJs(`(() => {
    const cs = getComputedStyle(document.querySelector('.wz-cascade-panel'));
    return { scrollbarWidth: cs.scrollbarWidth, scrollbarColor: cs.scrollbarColor };
  })()`);
  const inkBorderStrong = await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--ink-border-strong').trim()");
  ok('S4: a cascade panel (explicitly named in the brief) carries the minimal thin scrollbar, themed via the dark-chrome token pair (--ink-border-strong)',
    cascadePanelStyle.scrollbarWidth === 'thin', JSON.stringify({ cascadePanelStyle, inkBorderStrong }));

  await openSliver(app);
  await sleep(150);
  const sliverPanelStyle = await app.evalJs("getComputedStyle(document.querySelector('.wz-sliver-panel')).scrollbarWidth");
  ok('S4: the sliver panel ALSO carries the minimal thin scrollbar — the systemic default reaches it with no per-class opt-in needed',
    sliverPanelStyle === 'thin', sliverPanelStyle);

  // Theme-awareness: switching to Flux re-resolves the SAME custom
  // properties to Flux's own values, live, no separate scrollbar rule
  // needed per theme.
  await app.evalJs("document.documentElement.setAttribute('data-theme','flux')");
  await sleep(100);
  const fluxCascadeColor = await app.evalJs("getComputedStyle(document.querySelector('.wz-cascade-panel')).scrollbarColor");
  const fluxInkBorderStrong = await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--ink-border-strong').trim()");
  ok('S4: Flux resolves its OWN scrollbar color (a different --ink-border-strong value) with zero theme-specific scrollbar CSS of its own — genuinely "consistent with the colors and mood of each unique theme"',
    fluxInkBorderStrong !== inkBorderStrong && fluxCascadeColor.includes(hexToRgbFragment(fluxInkBorderStrong)),
    JSON.stringify({ fluxInkBorderStrong, inkBorderStrong, fluxCascadeColor }));
  await app.evalJs("document.documentElement.removeAttribute('data-theme')");

  // The one deliberate, disclosed exception: `.beat-rail-dots` (a
  // horizontal, edge-fade-masked rail) keeps its own scrollbar fully
  // hidden — never "bulky" to begin with, and the fade mask depends on it
  // staying invisible. Confirmed it still overrides the new systemic
  // default rather than silently losing its own local rule to `*`.
  await freshDesk(app, LAPTOP_W, 900);
  const beatRailPresent = await app.evalJs("!!document.querySelector('.beat-rail-dots')");
  if (beatRailPresent) {
    const beatRailStyle = await app.evalJs("getComputedStyle(document.querySelector('.beat-rail-dots')).scrollbarWidth");
    ok('S4 (disclosed exception): .beat-rail-dots keeps its own local scrollbar-width:none override — the systemic `*` default never wins there (specificity: a class beats a universal selector)',
      beatRailStyle === 'none', beatRailStyle);
  }

  // ==========================================================================
  // S5-S8 — the four deck-card interaction bugs. The shared discipline: B3's
  // own independent review live-tested edit/move/delete via genuinely
  // trusted CDP pointer events and found them working — so each of these is
  // root-caused, not assumed a simple regression. All four turned out to
  // share ONE genuine code regression (not a harness fidelity gap: every
  // check below uses app.doubleClick/mouseDown/mouseUp/mouseMove, isTrusted
  // CDP events, and reproduces on BOTH a real dealt card and a hand-typed
  // one) — FX5 S4(a)'s own "capture the pointer immediately on pointerdown"
  // drag-friction fix (a genuine, still-needed improvement for real drags)
  // has the side effect of retargeting every subsequent mouseup/click/
  // dblclick to `.board-canvas` itself for the REST of that gesture — so any
  // handler reading `e.target` (rather than doing a fresh hit-test) sees the
  // canvas, never the card or control the writer actually pressed. B3's own
  // review most likely exercised move (drag) and delete (a card, once
  // SELECTED — which resolves correctly, since selection reads `e.target`
  // on the FIRST pointerdown, before capture ever engages) — not a genuine
  // native dblclick specifically, which is the one gesture this regression
  // silently breaks.
  // ==========================================================================

  // --- S5: not editable -----------------------------------------------------
  await dealtBoard(app, LAPTOP_W, 900);
  const firstDealt = await app.evalJs(`(() => {
    const el = document.querySelector('.board-box[data-kind="text"]');
    const r = el.getBoundingClientRect();
    return { id: el.dataset.boxId, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 20) };
  })()`);
  await app.doubleClick(firstDealt.x, firstDealt.y);
  await sleep(300);
  const dealtPopupOpen = await app.evalJs("!!document.querySelector('.board-popup')");
  ok('S5 ROOT-CAUSED: a genuinely trusted double-click on an ACTUAL dealt card (materializeDeck\'s own layout, real "Start from a deck…" door) now opens the edit popup — was a genuine code regression (FX5 S4(a)\'s own immediate-capture-on-pointerdown fix retargeting the native dblclick\'s own e.target to .board-canvas), fixed via document.elementFromPoint in the onDoubleClick handler (the SAME technique this file\'s own finishThreadDrag already used) — not a harness fidelity gap: this is isTrusted:true CDP input throughout',
    dealtPopupOpen, JSON.stringify(firstDealt));
  if (dealtPopupOpen) {
    const popupText = await app.evalJs("document.querySelector('.board-popup-editor')?.innerText");
    ok('S5: the opened popup genuinely shows THIS card\'s own dealt text (title + body, materializeDeck\'s own "title\\nbody" shape), not empty/wrong content',
      typeof popupText === 'string' && popupText.length > 0, popupText);
    await app.evalJs("document.querySelector('.board-popup-done')?.click()");
    await sleep(200);
  }
  // Universality check (S5's own instruction: "determine whether this
  // affects every board card or specifically deck-dealt ones") — an
  // ORDINARY hand-typed card, same defect, same fix, confirming this was
  // never deck-specific at all.
  await freshBoard(app, 'fx7-s5-hand', [
    { id: 'fx7-s5-hand-card', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'Hand Title\nHand body text' },
  ], LAPTOP_W, 900);
  const handRect = await rectOf(app, '[data-box-id="fx7-s5-hand-card"]');
  await app.doubleClick(Math.round(handRect.x + handRect.width / 2), Math.round(handRect.y + handRect.height / 2));
  await sleep(300);
  const handPopupOpen = await app.evalJs("!!document.querySelector('.board-popup')");
  ok('S5 universality: an ORDINARY hand-typed card has the IDENTICAL defect and the IDENTICAL fix — confirms this was never deck-specific (materializeDeck\'s own layout/overlap was a red herring, not the cause)',
    handPopupOpen, String(handPopupOpen));
  if (handPopupOpen) await app.evalJs("document.querySelector('.board-popup-done')?.click()");

  // --- S6: not deletable -----------------------------------------------------
  // Root-caused live: single-click SELECT resolves `e.target` on the FIRST
  // pointerdown (before pointer capture ever engages), so it was NEVER
  // affected by the S5 regression — and the board-action-row's own "Remove"
  // button lives OUTSIDE `.board-canvas` entirely (never captured at all).
  // Confirmed: select-then-Remove already worked correctly, on an ACTUAL
  // dealt card, with no code change needed here — S6 reads as "broken"
  // purely as S5's own downstream symptom (double-click, the obvious first
  // instinct, silently failed; the separate select+Remove path was
  // apparently never discovered). Disclosed plainly, not papered over: this
  // is the one of the four that needed NO fix of its own.
  await dealtBoard(app, LAPTOP_W, 900);
  const toRemove = await app.evalJs(`(() => {
    const el = document.querySelector('.board-box[data-kind="text"]');
    const r = el.getBoundingClientRect();
    return { id: el.dataset.boxId, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 20) };
  })()`);
  await clickAt(app, toRemove.x, toRemove.y);
  await sleep(200);
  const selectedShape = await app.evalJs(`document.querySelector('[data-box-id="${toRemove.id}"]').dataset.selected`);
  ok('S6 ROOT-CAUSED (not a code defect — S5\'s own downstream symptom, disclosed plainly): a single genuinely trusted click SELECTS a dealt card correctly — selection was never touched by the S5 regression at all',
    selectedShape === 'true', selectedShape);
  const removeBtnRect = await app.evalJs(`(() => {
    const btns = [...document.querySelectorAll('.board-action-row button')];
    const btn = btns.find(b => b.textContent === 'Remove');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  })()`);
  ok('S6: the board-action-row\'s own Remove button is present once a dealt card is selected', !!removeBtnRect, JSON.stringify(removeBtnRect));
  if (removeBtnRect) {
    const countBefore = await app.evalJs('window.wrizoBoard().length');
    await clickAt(app, removeBtnRect.x, removeBtnRect.y);
    await sleep(400);
    const stillThere = await app.evalJs(`!!document.querySelector('[data-box-id="${toRemove.id}"]')`);
    const countAfter = await app.evalJs('window.wrizoBoard()?.length');
    ok('S6: clicking Remove genuinely deletes the ACTUAL dealt card (and its own thread, if any) — already fully functional, confirmed live on the real door, not assumed from the hand-typed baseline alone',
      !stillThere && countAfter < countBefore, JSON.stringify({ stillThere, countBefore, countAfter }));
  }

  // --- S7: resize one-directional --------------------------------------------
  // Root-caused live (step-by-step mid-drag reads, not just start/end):
  // FX4 S4/FX5 S3's own reflow-as-minimum floor (a text box's stored `h`
  // only ever grows to fit content, never shrinks) re-measures on EVERY
  // intermediate box change — including every setBoxes call a resize drag's
  // own onMove fires WHILE STILL HELD. A diagonal drag narrows width at the
  // same time it shrinks height; narrowing can force the SAME text to wrap
  // an extra line, which the reflow-floor effect then immediately re-grows
  // `h` from, mid-drag — fighting the writer's own pointer in real time.
  // Fixed with activeResizeIdRef (BoardEditor.tsx): the reflow-floor effect
  // now stands down for whichever box is ACTIVELY being resized, only
  // reconciling once, cleanly, the instant the drag ends — the content-
  // minimum floor still applies (verified below: an aggressive narrow+tiny-
  // height drag still correctly grows back to fit on release, content never
  // clipped), it just no longer fights every intermediate frame.
  await dealtBoard(app, LAPTOP_W, 900);
  const resizeBox = await app.evalJs(`(() => {
    const el = document.querySelector('.board-box[data-kind="text"]');
    const r = el.getBoundingClientRect();
    return { id: el.dataset.boxId, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 20) };
  })()`);
  await clickAt(app, resizeBox.x, resizeBox.y);
  await sleep(200);
  let handle = await rectOf(app, '.board-handle');
  let hx = Math.round(handle.x + handle.width / 2), hy = Math.round(handle.y + handle.height / 2);
  // Upsize first (matches Nick's own "once a card is upsized" wording).
  await app.mouseDown(hx, hy);
  await sleep(30);
  for (const [dx, dy] of [[50, 35], [110, 80], [180, 130]]) { await app.mouseMove(hx + dx, hy + dy); await sleep(40); }
  await app.mouseUp(hx + 180, hy + 130);
  await sleep(300);
  const afterUpsize = await app.evalJs(`window.wrizoBoard().find(b => b.id === "${resizeBox.id}")`);

  const resizeBox2 = await rectOf(app, `[data-box-id="${resizeBox.id}"]`);
  await clickAt(app, Math.round(resizeBox2.x + resizeBox2.width / 2), Math.round(resizeBox2.y + 15));
  await sleep(200);
  handle = await rectOf(app, '.board-handle');
  hx = Math.round(handle.x + handle.width / 2); hy = Math.round(handle.y + handle.height / 2);
  const trace = [];
  await app.mouseDown(hx, hy);
  await sleep(30);
  for (const [dx, dy] of [[-20, -15], [-50, -35], [-90, -60], [-140, -95]]) {
    await app.mouseMove(hx + dx, hy + dy);
    await sleep(60);
    const mid = await app.evalJs(`window.wrizoBoard().find(b => b.id === "${resizeBox.id}")`);
    trace.push(mid.h);
  }
  await app.mouseUp(hx - 140, hy - 95);
  await sleep(400);
  const afterDownsize = await app.evalJs(`window.wrizoBoard().find(b => b.id === "${resizeBox.id}")`);
  const monotonic = trace.every((h, i) => i === 0 || h <= trace[i - 1] + 0.0005);
  ok('S7 ROOT-CAUSED: dragging the resize handle to shrink a dealt card is MONOTONIC — height never reverses direction mid-drag (the reflow-floor effect no longer fights the pointer in real time)',
    monotonic, JSON.stringify(trace));
  ok('S7: the card genuinely ends up smaller than after the upsize, in BOTH dimensions — downsize actually works now, matching Nick\'s own DoD ("upsizes then downsizes a card freely")',
    afterDownsize.w < afterUpsize.w && afterDownsize.h < afterUpsize.h, JSON.stringify({ afterUpsize, afterDownsize }));
  // The content-minimum floor STILL applies on release (never regressed to
  // "clip the writer's own words") — an aggressive narrow+tiny-height drag.
  const resizeBox3 = await rectOf(app, `[data-box-id="${resizeBox.id}"]`);
  await clickAt(app, Math.round(resizeBox3.x + resizeBox3.width / 2), Math.round(resizeBox3.y + 15));
  await sleep(200);
  handle = await rectOf(app, '.board-handle');
  hx = Math.round(handle.x + handle.width / 2); hy = Math.round(handle.y + handle.height / 2);
  await app.mouseDown(hx, hy);
  await sleep(30);
  for (const [dx, dy] of [[-100, -5], [-200, -10], [-280, -15]]) { await app.mouseMove(hx + dx, hy + dy); await sleep(50); }
  await app.mouseUp(hx - 280, hy - 15);
  await sleep(400);
  const faceMetrics = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="${resizeBox.id}"] .board-text');
    return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
  })()`);
  ok('S7 invariant preserved: the content-minimum floor still applies on RELEASE — an aggressive narrow+tiny-height drag never clips the card\'s own text (scrollHeight <= clientHeight)',
    faceMetrics.scrollHeight <= faceMetrics.clientHeight + 3, JSON.stringify(faceMetrics));

  // --- S8: layer-arrangement (z-order) not working ---------------------------
  // Root-caused live (the SAME event-retargeting regression as S5): the
  // layer-toggle button's own onMouseDown{stopPropagation} fires on the
  // MOUSEDOWN compatibility event — too late, since .board-canvas's own
  // NATIVE pointerdown listener (which sets capture) always runs first and
  // never special-cased this control. Confirmed live: pointerdown/mousedown
  // correctly targeted .board-layer-toggle, but mouseup/click BOTH
  // retargeted to .board-canvas — z never changed. Fixed with an early
  // return in onDown (mirrors the EXISTING .board-pin-grab/.board-handle
  // pattern already in that same function) so a press on the toggle never
  // starts a canvas-level drag/capture at all.
  await freshBoard(app, 'fx7-s8-board', [
    { id: 'fx7-s8-card-1', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'Card One\nBody one' },
    { id: 'fx7-s8-card-2', kind: 'text', x: 0.15, y: 0.13, w: 0.3, h: 0.1, z: 2, text: 'Card Two overlapping\nBody two' },
  ], LAPTOP_W, 900);
  const c2 = await rectOf(app, '[data-box-id="fx7-s8-card-2"]');
  await clickAt(app, Math.round(c2.x + c2.width / 2), Math.round(c2.y + 15));
  await sleep(200);
  const toggleShape = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="fx7-s8-card-2"]');
    const btn = document.querySelector('.board-layer-toggle');
    return { overlapping: el?.dataset.overlapping, togglePresent: !!btn };
  })()`);
  ok('S8: a selected, genuinely overlapping card gets the quiet layer-order icon (FX5 S4(c))',
    toggleShape.overlapping === 'true' && toggleShape.togglePresent, JSON.stringify(toggleShape));
  const toggleRect = await rectOf(app, '.board-layer-toggle');
  const zBefore = await app.evalJs('window.wrizoBoard().find(b => b.id === "fx7-s8-card-2").z');
  await clickAt(app, Math.round(toggleRect.x + toggleRect.width / 2), Math.round(toggleRect.y + toggleRect.height / 2));
  await sleep(400);
  const zAfter = await app.evalJs('window.wrizoBoard()?.find(b => b.id === "fx7-s8-card-2")?.z');
  ok('S8 ROOT-CAUSED: clicking the layer-order icon genuinely changes AND persists the card\'s own z — was retargeted to .board-canvas (the SAME class of bug as S5), fixed with an onDown early-return mirroring the existing .board-pin-grab/.board-handle pattern',
    zAfter !== zBefore, JSON.stringify({ zBefore, zAfter }));
  // Persists across a reload (genuinely written to storage, not just local state).
  await app.reload();
  await app.evalJs("location.hash = '#/page/fx7-s8-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'S8 board reframed after reload' });
  await sleep(400);
  const zPersisted = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e=>e.id==='fx7-s8-board')?.boxes.find(b=>b.id==='fx7-s8-card-2')?.z`);
  ok('S8: the new z-order persists to storage across a reload', zPersisted === zAfter, JSON.stringify({ zAfter, zPersisted }));

  return checks;
});

// A minimal hex->rgb-fragment helper for a loose substring match against a
// computed `rgb(r, g, b)` string (avoids a full color-parsing dependency).
function hexToRgbFragment(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX7 VERIFY (partial): PASS (${checks.length} checks)` : `\nFX7 VERIFY (partial): FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
