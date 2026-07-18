// FX3 — the Proportions (docs/wrizo-alpha/fx3-proportions-brief.md). A
// committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on cd1.mjs's/fx2.mjs's own fixtures/patterns —
// `freshDesk` below is copied VERBATIM from fx2.mjs's CURRENT (post-merge)
// version, per this ticket's own explicit instruction to start from the
// correct pattern rather than repeat FX2's own early mistake (bootstrapping
// against the retired `.wz-desk` instead of `.wz-arrival`).
// Run: node apps/desktop/scripts/harness/fx3.mjs   (from the repo root, with
// dist-web freshly built via `pnpm run build:web`).
//
// S1 — the paper fills down: bottom edge within the 32-48px fence of the
// stage's own bottom, at 1280px AND 2200px (both reference widths, this
// project's own standing dual-width law) — prose AND script (S1's fix is
// one chain shared by both, mirroring S7's own "prose and screenplay share
// one fix" convention).
// S2 — the scale token: --paper-scale applied (>1) at a wide viewport
// (1920px+) and NOT (===1) at the 1280px laptop reference width.
// S3 — the typewriter's first-line offset lands in the new 30-35% band
// (not the old 45%), and the scroll/fade engages within a handful of lines
// of fresh typing rather than lagging.
// S4 — the top bar's computed rects read right-aligned (Done rightmost,
// visibly separated from the mode strip) — an explicit TRIAL per the
// brief; this check documents its OWN revert path in its own comment,
// matching index.css's.
// S5 — no gear node anywhere on the paper; the sliver foot carries exactly
// three icons and no literal "Typewriter" text node anywhere in the panel;
// the instruments panel opens, carries its three controls, and closes on
// a keystroke through the SAME vanishing engine (chrome-fade/desk-dissolve)
// the sliver panel itself already rides — no second dissolve mechanism.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom}; })()`;

// Copied VERBATIM from fx2.mjs's CURRENT freshDesk (itself byte-identical to
// cd1.mjs's own) — bootstraps against `.wz-arrival` (`.wz-desk` is retired),
// seeding `wrizo-first-run-complete` alongside every clear so HB1's
// first-run gate never interferes with these fixtures.
const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// A fresh, framed, project-origin (book chapter) prose page in Free Write —
// same fixture cd1.mjs/fx2.mjs use, at a caller-chosen viewport.
const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

// A fresh, framed script page — same fixture cd1.mjs uses.
const freshScriptPage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const headingId = 'fx3-script-heading';
    entries.push({ id: 'fx3-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] }] }, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after script seed' });
  await app.evalJs("location.hash = '#/page/fx3-script'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Script framed' });
  await sleep(250);
};

const openSliver = (app) => app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the paper fills down: the paper's own bottom edge (`.mode-page`
  // for prose, `.script-sheet` for script) sits within the 32-48px fence of
  // the STAGE's bottom (`.desk-frame-stage`), at both reference widths.
  // ==========================================================================
  for (const width of [1280, 2200]) {
    await freshProsePage(app, width, 900);
    const stage = await app.evalJs(rectOf('.desk-frame-stage'));
    const paper = await app.evalJs(rectOf('.mode-page'));
    const fence = stage.bottom - paper.bottom;
    ok(`S1 @ ${width}px (prose): the paper's bottom edge sits within the 32-48px fence of the stage's own bottom`,
      fence >= 30 && fence <= 50, JSON.stringify({ stageBottom: stage.bottom, paperBottom: paper.bottom, fence }));
    ok(`S1 @ ${width}px (prose): no dead band below the frame — the stage itself reaches near the viewport's own bottom`,
      900 - stage.bottom < 60, `stage.bottom=${stage.bottom} viewportHeight=900`);

    await freshScriptPage(app, width, 900);
    const stageScript = await app.evalJs(rectOf('.desk-frame-stage'));
    const sheet = await app.evalJs(rectOf('.script-sheet'));
    const fenceScript = stageScript.bottom - sheet.bottom;
    ok(`S1 @ ${width}px (script, S7 mirrors prose): the sheet's bottom edge sits within the same 32-48px fence`,
      fenceScript >= 30 && fenceScript <= 50, JSON.stringify({ stageBottom: stageScript.bottom, sheetBottom: sheet.bottom, fence: fenceScript }));
  }

  // ==========================================================================
  // S2 — the scale token: applied (>1) at a wide viewport, untouched (===1)
  // at the 1280px laptop reference width. Read live off the root, not
  // inferred from rendered pixels, so this check fails loudly on the token
  // itself if a future edit breaks the ramp, independent of any downstream
  // layout math.
  // ==========================================================================
  await freshProsePage(app, 1280, 900);
  const scaleLaptop = await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--paper-scale').trim()");
  ok('S2 @ 1280px (laptop): --paper-scale is NOT scaled up (1)', scaleLaptop === '1', scaleLaptop);

  await app.emulateDpr(1, 1920, 1000);
  await sleep(200);
  const scaleWide = await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--paper-scale').trim()");
  ok('S2 @ 1920px (wide): --paper-scale IS applied (>1)', parseFloat(scaleWide) > 1, scaleWide);

  // The measure itself must NOT change with the token — the SAME 60ch still
  // governs the paper's width band at scale (Law 1: the character count is
  // the constant, the pixel width is not). The pagecol's own font-size
  // scaling (index.css) is what keeps this true; assert the width band is
  // still bounded by 60ch-at-its-own-font-size, not a flat unscaled px cap.
  const measureCheck = await app.evalJs(`(() => {
    const pc = document.querySelector('.mode-pagecol');
    const r = pc.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(pc).fontSize);
    return { width: r.width, fontSize, chWidth: fontSize * 60 * 0.5 }; // rough sanity floor, not exact glyph metrics
  })()`);
  ok('S2 @ 1920px: the scaled pagecol\'s width still tracks its OWN (scaled) font-size — not a flat, unscaled pixel cap that would silently widen the measure',
    measureCheck.width > measureCheck.chWidth, JSON.stringify(measureCheck));

  // The sliver anchor and the goal-glow anchor stay flush with the paper's
  // own edge at scale — a real regression this build caught empirically
  // (a 61.5px gap at 2200px before the anchors' own ch-unit formulas were
  // taught to scale alongside .mode-pagecol's).
  await sleep(100);
  const anchorAlign = await app.evalJs(`(() => {
    const anchor = document.querySelector('.desk-frame-sliver-anchor').getBoundingClientRect();
    const glow = document.querySelector('.desk-frame-goalglow-anchor').getBoundingClientRect();
    const paper = document.querySelector('.mode-pagecol').getBoundingClientRect();
    return { anchorRight: anchor.right, glowLeft: glow.left, glowRight: glow.right, paperLeft: paper.left, paperRight: paper.right };
  })()`);
  ok('S2 @ 1920px: the sliver anchor stays flush with the SCALED paper\'s left edge (no drift introduced by the scale token)',
    Math.abs(anchorAlign.anchorRight - anchorAlign.paperLeft) < 1, JSON.stringify(anchorAlign));
  ok('S2 @ 1920px: the goal-glow anchor stays flush with the SCALED paper\'s box on both edges',
    Math.abs(anchorAlign.glowLeft - anchorAlign.paperLeft) < 1 && Math.abs(anchorAlign.glowRight - anchorAlign.paperRight) < 1,
    JSON.stringify(anchorAlign));

  await app.emulateDpr(1, 1400, 900);
  await sleep(150);

  // ==========================================================================
  // S3 — FX4 S1 SUPERSEDES this whole section: START_FRACTION retunes again
  // (0.29 -> 0.25) and the Journal carve-out this section's own closing
  // comment described RETIRES (Journal gains real start-offset behavior for
  // the first time). All three checks below are parked verbatim in this
  // file's own PARKED section; live successors (both reference widths + the
  // 1100 floor, prose/script/journal, plus the ink-coordinate byte-truth
  // proof) are in fx4.mjs's own S1 section.
  // ==========================================================================

  // (parked — see this file's PARKED section below)

  // ==========================================================================
  // S4 — top bar, right-aligned (TRIAL): the mode strip and the actions
  // cluster (ending in Done) both sit toward .sprint-nav's right edge, with
  // a visible gap between them — computed rects, not a class-presence
  // check. REVERT: index.css's own `.desk-frame-host .sprint-nav`/
  // `.desk-frame-host .sprint-actions` block names its one-block revert.
  // ==========================================================================
  const topBar = await app.evalJs(`(() => {
    const nav = document.querySelector('.chrome-top.sprint-nav');
    const strip = document.querySelector('.desk-mode-strip');
    const actions = document.querySelector('.sprint-actions');
    const buttons = [...actions.querySelectorAll('button')];
    const doneBtn = buttons.find(b => b.textContent.trim() === 'Done');
    const navRect = nav.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const doneRect = doneBtn.getBoundingClientRect();
    return {
      navRight: navRect.right, stripRight: stripRect.right, actionsLeft: actionsRect.left,
      actionsRight: actionsRect.right, doneRight: doneRect.right, doneLeft: doneRect.left,
      gapBetweenStripAndActions: actionsRect.left - stripRect.right,
    };
  })()`);
  ok('S4: Done is the rightmost element in the top bar (computed rect, not class presence)',
    Math.abs(topBar.doneRight - topBar.actionsRight) < 1, JSON.stringify(topBar));
  ok('S4: the mode strip sits toward the RIGHT of the top bar (close to the nav\'s own right edge), not flush left',
    topBar.navRight - topBar.stripRight < 260, JSON.stringify(topBar));
  ok('S4: there is a clear, visible gap between the mode strip and the actions cluster (not glued together)',
    topBar.gapBetweenStripAndActions >= 14 && topBar.gapBetweenStripAndActions < 120, JSON.stringify(topBar));

  // ==========================================================================
  // S5 — the paper sheds the gear entirely (prose AND script); no gear node
  // anywhere on the framed surface.
  // ==========================================================================
  const gearOnProse = await app.evalJs("document.querySelectorAll('.mode-gear').length");
  ok('S5: no .mode-gear node anywhere on a framed prose page (the paper sheds the gear entirely)', gearOnProse === 0, String(gearOnProse));

  // Successor to ab1.mjs's own retired "PAGE IS PRIMARY: the page rect is
  // byte-identical while the settings gear is open" (parked there,
  // SUPERSEDED — that check opened the paper's OWN `.mode-gear`, which no
  // longer exists). Same invariant, the gear's NEW address: opening it from
  // the sliver's foot must still never move the paper.
  await openSliver(app);
  await sleep(200);
  const pageRectBeforeGear = await app.evalJs(rectOf('.mode-pagecol'));
  await app.evalJs(`(() => {
    const row = document.querySelector('.wz-sliver-instruments-row');
    [...row.querySelectorAll('button')][1].click(); // typewriter, GEAR, instruments
  })()`);
  await sleep(150);
  const gearPanelOpen = await app.evalJs("!!document.querySelector('.wz-sliver-instruments .mode-settings')");
  const pageRectAfterGear = await app.evalJs(rectOf('.mode-pagecol'));
  ok('S5 (successor to ab1.mjs\'s parked "PAGE IS PRIMARY... gear is open"): the paper rect is byte-identical while the RELOCATED gear (sliver foot) is open',
    gearPanelOpen && JSON.stringify(pageRectBeforeGear) === JSON.stringify(pageRectAfterGear),
    JSON.stringify({ gearPanelOpen, pageRectBeforeGear, pageRectAfterGear }));
  // close the sliver back, hygiene for the next fixture
  await openSliver(app);
  await sleep(150);

  await freshScriptPage(app, 1400, 900);
  const gearOnScript = await app.evalJs("document.querySelectorAll('.mode-gear').length");
  ok('S5: no .mode-gear node anywhere on a framed script page either (S7 mirrors prose)', gearOnScript === 0, String(gearOnScript));

  // -- The sliver foot's new instruments row: exactly three icons, no
  // literal "Typewriter" text node anywhere in the panel (aria-label keeps
  // the word for assistive tech only). ----------------------------------
  await openSliver(app);
  await sleep(250);
  const footRow = await app.evalJs(`(() => {
    const row = document.querySelector('.wz-sliver-instruments-row');
    const panel = document.querySelector('.wz-sliver-panel');
    // A literal DOM TEXT NODE walk (not .textContent, which would also
    // match an aria-label attribute string if one leaked into visible
    // text some other way) — the brief's own "query for literal text
    // content, not just class presence."
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    let hasTypewriterTextNode = false;
    while (walker.nextNode()) { if (walker.currentNode.nodeValue.includes('Typewriter')) hasTypewriterTextNode = true; }
    return {
      iconCount: row ? row.querySelectorAll('button').length : -1,
      hasTypewriterTextNode,
      typewriterAriaLabelPresent: !!panel.querySelector('[aria-label*="Typewriter"]'),
    };
  })()`);
  ok('S5 (script): the sliver foot row is present with exactly THREE icons',
    footRow.iconCount === 3, JSON.stringify(footRow));
  ok('S5 (script): no literal "Typewriter" TEXT NODE anywhere in the sliver panel',
    !footRow.hasTypewriterTextNode, JSON.stringify(footRow));
  ok('S5 (script): the typewriter toggle\'s aria-label still carries the word, for assistive tech',
    footRow.typewriterAriaLabelPresent, JSON.stringify(footRow));

  // Repeat the same three assertions on prose (the brief names both
  // surfaces; S7's mirroring convention applies to S5 too).
  await freshProsePage(app, 1400, 900);
  await openSliver(app);
  await sleep(250);
  const footRowProse = await app.evalJs(`(() => {
    const row = document.querySelector('.wz-sliver-instruments-row');
    const panel = document.querySelector('.wz-sliver-panel');
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    let hasTypewriterTextNode = false;
    while (walker.nextNode()) { if (walker.currentNode.nodeValue.includes('Typewriter')) hasTypewriterTextNode = true; }
    return { iconCount: row ? row.querySelectorAll('button').length : -1, hasTypewriterTextNode };
  })()`);
  ok('S5 (prose): the sliver foot row is present with exactly THREE icons',
    footRowProse.iconCount === 3, JSON.stringify(footRowProse));
  ok('S5 (prose): no literal "Typewriter" TEXT NODE anywhere in the sliver panel',
    !footRowProse.hasTypewriterTextNode, JSON.stringify(footRowProse));

  // -- The instruments panel: opens, carries the three controls (on/off,
  // unit preference, target value), and closes on a keystroke through the
  // SAME vanishing engine the sliver panel itself already rides. ----------
  const opened = await app.evalJs(`(() => {
    const row = document.querySelector('.wz-sliver-instruments-row');
    const btns = [...row.querySelectorAll('button')];
    btns[2].click(); // typewriter, gear, INSTRUMENTS (third icon)
    return btns.length;
  })()`);
  await sleep(200);
  const instrumentsPanel = await app.evalJs(`(() => {
    const panel = document.querySelector('.wz-sliver-instruments-panel');
    if (!panel) return null;
    const segs = [...panel.querySelectorAll('.mode-seg')];
    return {
      present: true,
      segCount: segs.length, // on/off + unit preference
      hasNumberInput: !!panel.querySelector('input[type="number"]'),
      hasSetClear: !!panel.querySelector('.wz-sliver-goal-edit-commit') && !!panel.querySelector('.wz-sliver-goal-edit-clear'),
    };
  })()`);
  ok('S5: the instruments panel opens', !!instrumentsPanel && instrumentsPanel.present, JSON.stringify({ opened, instrumentsPanel }));
  ok('S5: the instruments panel carries the on/off control AND the unit-preference control (two Seg rows)',
    !!instrumentsPanel && instrumentsPanel.segCount === 2, JSON.stringify(instrumentsPanel));
  ok('S5: the instruments panel carries the target-value control (a number input, Set + Clear)',
    !!instrumentsPanel && instrumentsPanel.hasNumberInput && instrumentsPanel.hasSetClear, JSON.stringify(instrumentsPanel));

  // Closes on keystroke — the ONE vanishing engine (chrome-fade/desk-
  // dissolve), not a second bespoke close handler: the panel is a
  // DESCENDANT of .wz-sliver-panel (which already carries those classes),
  // so it dissolves in lockstep with the whole sliver, exactly like
  // cd1.mjs's own "a keystroke dissolves the OPEN sliver's panel" check.
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('dissolve probe');
  await sleep(150);
  // Matches cd1.mjs's own "a keystroke dissolves the OPEN sliver's panel"
  // check exactly: `pointer-events` flips the instant `data-writing` does
  // (a discrete CSS state, not transitioned), so a short sleep is enough —
  // `opacity` alone is what's animated over --fade-dur (1.2s) and racing a
  // numeric threshold against that transition is what the timing-flaky
  // first draft of this check did; pointer-events is the same functional
  // signal ("closed" = unreachable) without the race.
  const dissolveState = await app.evalJs(`({
    frameWriting: document.querySelector('.desk-frame')?.dataset.writing,
    panelPointerEvents: getComputedStyle(document.querySelector('.wz-sliver-panel')).pointerEvents,
  })`);
  ok('S5: the instruments panel closes (dissolves) on a keystroke, via the sliver panel\'s own existing chrome-fade/desk-dissolve mechanism',
    dissolveState.frameWriting === 'true' && dissolveState.panelPointerEvents === 'none',
    JSON.stringify(dissolveState));
  // ...and confirm it settles all the way to the ambient fade-min opacity
  // (not just mid-transition) once the transition has had time to finish —
  // this DOES want the longer wait, as an eventual-consistency check, not a
  // pass/fail race. Polled (not a single fixed sleep) since the exact
  // dissolve-trigger delay is an implementation detail of useChromeDissolve
  // this file shouldn't have to hand-tune a magic number against.
  let settledOpacity = '1';
  for (let i = 0; i < 20; i++) {
    settledOpacity = await app.evalJs("getComputedStyle(document.querySelector('.wz-sliver-panel')).opacity");
    if (parseFloat(settledOpacity) < 0.15) break;
    await sleep(200);
  }
  ok('S5: ...and settles to the ambient fade-min opacity once the transition finishes (not stuck mid-fade)',
    parseFloat(settledOpacity) < 0.15, settledOpacity);

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// FX4 S1 (2026-07-18) is the first tenant of this scaffold: START_FRACTION
// retunes again (0.29 -> 0.25) and the Journal carve-out this file's own
// S3 section documented RETIRES. Three checks parked below (SUPERSEDED
// species, quoted verbatim); live successors are in fx4.mjs's own S1
// section (both reference widths + the 1100 floor, prose/script/journal,
// plus the ink-coordinate byte-truth proof S1's own STOP-and-report clause
// demanded).
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    // ORIGINAL: await freshProsePage(app, 1280, 900); const startOffsetInfo
    // = await app.evalJs(`(() => { const stage = document.querySelector(
    // '.desk-frame-stage'); const scroll = document.querySelector(
    // '.mode-scroll'); const offsetPx = parseFloat(getComputedStyle(scroll)
    // .paddingTop) || 0; return { offsetPx, stageHeight: stage.clientHeight,
    // fraction: offsetPx / stage.clientHeight }; })()`); ok('S3: a fresh
    // page\'s first-line start offset lands in the 30-35% band of the stage
    // height (was ~45%)', startOffsetInfo.fraction >= 0.28 &&
    // startOffsetInfo.fraction <= 0.37, JSON.stringify(startOffsetInfo));
    // FX4 S1 — START_FRACTION moves from 0.29 to 0.25; the 30-35% band this
    // check asserted is itself superseded (0.25 raw measures ~24.97% by
    // this SAME raw-padding formula — below the old band by design). Live
    // successor in fx4.mjs's own S1 section, using the fx1.mjs-way VISUAL
    // rect measurement per the brief's own instruction, not this simpler
    // raw-padding formula.
    await freshProsePage(app, 1280, 900);
    const startOffsetInfo = await app.evalJs(`(() => {
      const stage = document.querySelector('.desk-frame-stage');
      const scroll = document.querySelector('.mode-scroll');
      const offsetPx = parseFloat(getComputedStyle(scroll).paddingTop) || 0;
      return { offsetPx, stageHeight: stage.clientHeight, fraction: offsetPx / stage.clientHeight };
    })()`);
    pok('PARKED (was "S3: a fresh page\'s first-line start offset lands in the 30-35% band of the stage height (was ~45%)") — FX4 S1: START_FRACTION retunes to 0.25 (a lower band); live successor in fx4.mjs\'s own S1 section',
      startOffsetInfo.fraction >= 0.20 && startOffsetInfo.fraction <= 0.30, JSON.stringify(startOffsetInfo));

    // ORIGINAL: await app.evalJs("document.querySelector(
    // '.forward-only-editor').focus()"); let scrolledAtLine = null; for
    // (let i = 1; i <= 8 && scrolledAtLine === null; i++) { await
    // app.typeKeys(`Line ${i} of test content...`); await sleep(120);
    // const scrolled = await app.evalJs("document.querySelector(
    // '.mode-scroll')?.dataset.scrolled"); if (scrolled === 'true')
    // scrolledAtLine = i; } ok('S3: the scroll/fade engages within the
    // first few lines of fresh typing (<=5), not lagging for a dozen',
    // scrolledAtLine !== null && scrolledAtLine <= 5, ...);
    // FX4 S1 — a lower start fraction means the SAME CONTAINER_HOLD_BAND
    // (unchanged this ticket) is crossed one line later than before (was
    // <=5, now measures at 6) — a direct, expected geometric consequence
    // of moving the start position higher, not a regression in the
    // engage-band tuning itself. Live successor in fx4.mjs's own S1
    // section with the updated (still tight) line-count fence.
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    let scrolledAtLine = null;
    for (let i = 1; i <= 8 && scrolledAtLine === null; i++) {
      await app.typeKeys(`Line ${i} of test content, long enough to fill most of the paper's width.\n`);
      await sleep(120);
      const scrolled = await app.evalJs("document.querySelector('.mode-scroll')?.dataset.scrolled");
      if (scrolled === 'true') scrolledAtLine = i;
    }
    pok('PARKED (was "S3: the scroll/fade engages within the first few lines of fresh typing (<=5), not lagging for a dozen") — FX4 S1: the lower start fraction pushes this to line 6; live successor in fx4.mjs\'s own S1 section',
      scrolledAtLine !== null && scrolledAtLine <= 6, `scrolledAtLine=${scrolledAtLine}`);

    // ORIGINAL: await freshScriptPage(app, 1280, 900); const
    // scriptStartOffsetInfo = await app.evalJs(`(() => { const stage = ...
    // const cap = document.querySelector('.desk-frame-scroll-cap'); const
    // offsetPx = parseFloat(getComputedStyle(cap).paddingTop) || 0; return
    // { offsetPx, stageHeight: stage.clientHeight, fraction: offsetPx /
    // stage.clientHeight }; })()`); ok('S3 (script...): a fresh script
    // page\'s first-line start offset lands in the 30-35% band too',
    // scriptStartOffsetInfo.fraction >= 0.28 && <= 0.37, ...);
    // FX4 S1 — same retune, script surface (S7's own mirroring convention).
    await freshScriptPage(app, 1280, 900);
    const scriptStartOffsetInfo = await app.evalJs(`(() => {
      const stage = document.querySelector('.desk-frame-stage');
      const cap = document.querySelector('.desk-frame-scroll-cap');
      const offsetPx = parseFloat(getComputedStyle(cap).paddingTop) || 0;
      return { offsetPx, stageHeight: stage.clientHeight, fraction: offsetPx / stage.clientHeight };
    })()`);
    pok('PARKED (was "S3 (script): a fresh script page\'s first-line start offset lands in the 30-35% band too") — FX4 S1: START_FRACTION retunes to 0.25; live successor in fx4.mjs\'s own S1 section',
      scriptStartOffsetInfo.fraction >= 0.20 && scriptStartOffsetInfo.fraction <= 0.30, JSON.stringify(scriptStartOffsetInfo));

    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX3 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nFX3 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecksFx3 = checks.concat(parkedChecks);
const pass = allChecksFx3.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX3 VERIFY: PASS (${allChecksFx3.length} checks)` : `\nFX3 VERIFY: FAIL — ${allChecksFx3.filter((c) => !c.pass).length}/${allChecksFx3.length} failed`);
process.exit(pass ? 0 : 1);
