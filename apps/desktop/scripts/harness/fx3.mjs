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

    // SC1 S1 (2026-07-24) — the ORIGINAL check ("the sheet's bottom edge sits
    // within the same 32-48px fence") is SUPERSEDED and parked verbatim in
    // this file's own PARKED section. Its whole premise was a script sheet
    // SHORTER than the stage, which FX3 then made fill down to a fence. A
    // screenplay page is 11 inches tall by law (docs/wrizo-alpha/
    // sc-committee-pass.md) — 1056px, taller than this 733px stage at every
    // ordinary viewport — so it deliberately OVERFLOWS and scrolls inside
    // `.desk-frame-scroll-cap`, and a fence between the paper's bottom and
    // the stage's cannot exist. Prose's own fence checks above are untouched.
    // The live successor asserts the law that replaced it: the page's height
    // is exactly 11in, and the `--fx3-paper-fence` margin FX3 established
    // still rides below the paper inside the scrolled column.
    await freshScriptPage(app, width, 900);
    const stageScript = await app.evalJs(rectOf('.desk-frame-stage'));
    const sheet = await app.evalJs(rectOf('.script-sheet'));
    const scriptPage = await app.evalJs(`(() => {
      const sh = document.querySelector('.script-sheet');
      const col = document.querySelector('.mode-pagecol');
      const r = sh.getBoundingClientRect(), c = col.getBoundingClientRect();
      return { heightPx: Math.round(r.height * 100) / 100, heightIn: Math.round((r.height / 96) * 1000) / 1000, fenceBelowPaper: Math.round(c.bottom - r.bottom) };
    })()`);
    ok(`SC1 S1 @ ${width}px (was "S1 (script): the sheet's bottom edge sits within the 32-48px fence"): the script sheet is a true 11in page — taller than the stage, scrolling inside the cap — with FX3's own fence still riding below it`,
      Math.abs(scriptPage.heightIn - 11) <= 0.02 && scriptPage.fenceBelowPaper >= 30 && scriptPage.fenceBelowPaper <= 50,
      JSON.stringify({ ...scriptPage, stageBottom: stageScript.bottom, sheetBottom: sheet.bottom }));
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
  // cluster (Done scrapped — now ending in the Pages/Plan toggle) both sit
  // toward .sprint-nav's right edge, with a visible gap between them —
  // computed rects, not a class-presence check. REVERT: index.css's own
  // `.desk-frame-host .sprint-nav`/`.desk-frame-host .sprint-actions` block
  // names its one-block revert.
  // ==========================================================================
  const topBar = await app.evalJs(`(() => {
    const nav = document.querySelector('.chrome-top.sprint-nav');
    const strip = document.querySelector('.desk-mode-strip');
    const actions = document.querySelector('.sprint-actions');
    const navRect = nav.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    return {
      navRight: navRect.right, stripRight: stripRect.right, actionsLeft: actionsRect.left,
      actionsRight: actionsRect.right,
      gapBetweenStripAndActions: actionsRect.left - stripRect.right,
    };
  })()`);
  // CD3 harness-discipline fix (2026-07-22) — successor of the ORIGINAL
  // check (quoted verbatim, PARKED below, A4): Done is scrapped from the
  // top bar (Nick's own ruling), so there is no more Done rect to measure
  // against — the actions cluster's own right edge is the new rightmost-
  // element proof instead (the Pages/Plan toggle, when present, is now the
  // rightmost control inside it).
  ok('CD3 successor of "S4: Done is the rightmost element in the top bar (computed rect, not class presence)": the actions cluster hugs the nav\'s own right edge, right-aligned (computed rect; Done scrapped, the Pages/Plan toggle is now the rightmost control)',
    topBar.navRight - topBar.actionsRight < 20, JSON.stringify(topBar));
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
  // SC1 S3, AMENDED 2026-07-24 (Nick's word, via Fable) — two of these three
  // are SUPERSEDED on the SCRIPT surface and parked verbatim in this file's
  // own PARKED section: the screenplay page does not run the typewriter, so
  // its option does not present itself, so the foot row carries TWO icons
  // there (gear, instruments) and there is no typewriter aria-label to find.
  // The middle check (no literal "Typewriter" text node) is untouched — it was
  // true before and is more true now. Prose keeps all three; the prose block
  // just below is where the surviving aria-label claim now lives.
  // ---- PARKED - SUPERSEDED by item 83 M8 (R12), 2026-08-25 ----------
  // Kept VERBATIM and no longer run. R12 returns the typewriter to the
  // screenplay surface by founder word, so the script foot carries THREE
  // instruments again (TYPEWRITER / PROGRESS / FULL SCREEN, R5's roster).
  //
  // ok('SC1 S3 (was "S5 (script): the sliver foot row is present with exactly THREE icons"): the script sliver\'s foot row carries exactly TWO icons — the typewriter\'s is withdrawn with the option itself; gear and instruments remain',
  // footRow.iconCount === 2, JSON.stringify(footRow));
  // ------------------------------------------------------------------
  ok('SC1 S3 [R12 successor]: the script slivers foot row carries THREE instruments again - R12 returns the typewriter to screenplay',
    footRow.iconCount === 3, JSON.stringify(footRow));
  ok('S5 (script): no literal "Typewriter" TEXT NODE anywhere in the sliver panel',
    !footRow.hasTypewriterTextNode, JSON.stringify(footRow));
  // ---- PARKED - SUPERSEDED by item 83 M8 (R12), 2026-08-25 ----------
  // Kept VERBATIM and no longer run. The affordance returns to screenplay
  // by R12, so it is present to assistive tech exactly as it is to the eye
  // - which is the symmetry this check always cared about.
  //
  // ok('SC1 S3 (was "S5 (script): the typewriter toggle\'s aria-label still carries the word, for assistive tech"): there is no typewriter aria-label on a script page because there is no toggle — the affordance is absent to assistive tech exactly as it is to the eye, never merely hidden from one of them',
  // !footRow.typewriterAriaLabelPresent, JSON.stringify(footRow));
  // ------------------------------------------------------------------
  ok('SC1 S3 [R12 successor]: the typewriter aria-label IS present on a script page - the affordance returns to both the eye and assistive tech together',
    footRow.typewriterAriaLabelPresent === true, JSON.stringify(footRow));

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
    return { iconCount: row ? row.querySelectorAll('button').length : -1, hasTypewriterTextNode, typewriterAriaLabelPresent: !!panel.querySelector('[aria-label*="Typewriter"]') };
  })()`);
  ok('S5 (prose): the sliver foot row is present with exactly THREE icons',
    footRowProse.iconCount === 3, JSON.stringify(footRowProse));
  ok('S5 (prose): no literal "Typewriter" TEXT NODE anywhere in the sliver panel',
    !footRowProse.hasTypewriterTextNode, JSON.stringify(footRowProse));
  // SC1 S3 — FX3 S5's aria-label claim survives whole; it just lives on the
  // surface that still HAS the toggle. Asserting it here is what keeps the
  // withdrawal script-only rather than an app-wide accessibility regression.
  ok('S5 (prose): the typewriter toggle\'s aria-label still carries the word, for assistive tech (unchanged by SC1 — prose keeps the option)',
    footRowProse.typewriterAriaLabelPresent, JSON.stringify(footRowProse));

  // -- The instruments panel: opens, carries the three controls (on/off,
  // unit preference, target value), and closes on a keystroke through the
  // SAME vanishing engine the sliver panel itself already rides. ----------
  // ---- PARKED - SUPERSEDED by item 83 M4 (R5), 2026-08-25 ------------
  // Kept VERBATIM and no longer run. This DRIVER reached the Instruments
  // panel by ordinal - the third icon in a TYPEWRITER / GEAR / INSTRUMENTS
  // foot. R5 retired both the gear and the Instruments panel, so the third
  // slot is now FULL SCREEN and this ordinal would fire the wrong control.
  // The successor names the button instead of counting to it.
  //
  // const opened = await app.evalJs(`(() => {
  //   const row = document.querySelector('.wz-sliver-instruments-row');
  //   const btns = [...row.querySelectorAll('button')];
  //   btns[2].click(); // typewriter, gear, INSTRUMENTS (third icon)
  //   return btns.length;
  // })()`);
  // ------------------------------------------------------------------
  const opened = await app.evalJs(`(() => {
    const row = document.querySelector('.wz-sliver-instruments-row');
    const btns = [...row.querySelectorAll('button')];
    const b = btns.find(x => (x.getAttribute('aria-label')||'') === 'Progress');
    if (b) b.click();
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
  // ---- PARKED - SUPERSEDED by item 83 M4 (R5), 2026-08-25 ------------
  // Kept VERBATIM and no longer run. Nick: 'I do not want a separate
  // Instruments toggle/menu. All of the options in it should be set in one
  // of the other settings options.' The panel is RETIRED WHOLE and its
  // roster - Show, Unit, Target - was ABSORBED into the foot's PROGRESS
  // instrument, so nothing it offered was lost: two surfaces onto one goal
  // became one. The successors assert the same three controls at their new
  // address.
  //
  // ok('S5: the instruments panel opens', !!instrumentsPanel && instrumentsPanel.present, JSON.stringify({ opened, instrumentsPanel }));
  // ok('S5: the instruments panel carries the on/off control AND the unit-preference control (two Seg rows)',
  // !!instrumentsPanel && instrumentsPanel.segCount === 2, JSON.stringify(instrumentsPanel));
  // ok('S5: the instruments panel carries the target-value control (a number input, Set + Clear)',
  // !!instrumentsPanel && instrumentsPanel.hasNumberInput && instrumentsPanel.hasSetClear, JSON.stringify(instrumentsPanel));
  // ------------------------------------------------------------------
  const progressPanel = await app.evalJs(`(() => {
    const panel = document.querySelector('.wz-sliver-instruments-panel');
    if (!panel) return { present: false };
    return { present: true, segCount: panel.querySelectorAll('.mode-crow').length,
             hasNumberInput: !!panel.querySelector('input[type=\"number\"]') };
  })()`);
  ok('S5 [R5 successor]: the PROGRESS instrument opens - the Instruments panel retired, its roster absorbed here',
    progressPanel.present === true, JSON.stringify(progressPanel));
  ok('S5 [R5 successor]: PROGRESS carries the absorbed controls - Show, Unit and the goal rows (Instruments own roster, re-homed)',
    progressPanel.present && progressPanel.segCount >= 2, JSON.stringify(progressPanel));
  ok('S5 [R5 successor]: PROGRESS carries the target-value control (a number input)',
    progressPanel.present && progressPanel.hasNumberInput === true, JSON.stringify(progressPanel));

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
// CD3 (2026-07-2X) adds a fourth: Done is scrapped from the top bar whole
// (Nick's own ruling) — the S4 "Done is the rightmost element" check's own
// subject no longer exists; live successor stays in this file's own live
// S4 section.
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
    //
    // GENERATION 2 (FX5 S1) — the engage MOTION is rewritten whole (S1's
    // own "never a multi-line recenter jump" law: relative, one-line-at-a-
    // time stepping, see useTypewriterFade.ts's own header comment), and
    // first-engage's own catch-up now applies via that SAME clamped path
    // rather than one unconditional absolute jump. The crossing CRITERION
    // itself (CONTAINER_HOLD_BAND, unchanged) still fires at the identical
    // geometric moment; measured live, the visible `data-scrolled` flip
    // lands one line later under the new stepped mechanics (6 -> 7) — a
    // tolerance-level engage-timing observation, not a regression in
    // WHERE the band sits (fx5.mjs's own S1 section asserts the per-line
    // motion's own shape directly, a stronger claim than this line-count
    // fence). Live successor there.
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    let scrolledAtLine = null;
    for (let i = 1; i <= 9 && scrolledAtLine === null; i++) {
      await app.typeKeys(`Line ${i} of test content, long enough to fill most of the paper's width.\n`);
      await sleep(120);
      const scrolled = await app.evalJs("document.querySelector('.mode-scroll')?.dataset.scrolled");
      if (scrolled === 'true') scrolledAtLine = i;
    }
    pok('PARKED (was "S3: the scroll/fade engages within the first few lines of fresh typing (<=5), not lagging for a dozen", generation 2: was FX4 S1\'s own re-derivation at <=6) — FX5 S1: the stepped engage motion lands this at line 7; live successor in fx5.mjs\'s own S1 section',
      scrolledAtLine !== null && scrolledAtLine <= 7, `scrolledAtLine=${scrolledAtLine}`);

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
    // SC1 S3 (2026-07-24) — GENERATION 2 of this park, by the standing
    // "double supersession" precedent (FX1's own post-merge review, Ruling 3:
    // an already-parked check going stale again still must pass under
    // HARNESS_PARKED=1; generations accrete, all preserved, the previous
    // generation's text quoted verbatim rather than edited in place). Nick's
    // SC-V4 verdict retires the premise entirely FOR SCRIPT: a screenplay
    // begins at the top of page one, so `.desk-frame-scroll-cap` stops
    // consuming `--tw-start-offset` and this padding is 0 by law, not tuning.
    // Prose keeps FX4's quarter (this file's own sibling park above, on
    // `.mode-scroll`, is untouched and still green). Live successor in
    // fx4.mjs's own S1 section.
    pok('PARKED, generation 2 (was "PARKED (was \'S3 (script): a fresh script page\'s first-line start offset lands in the 30-35% band too\') — FX4 S1: START_FRACTION retunes to 0.25") — SC1 S3: the script surface stops consuming --tw-start-offset altogether; page one begins at its top margin (SC-V4), so the offset is 0; live successor in fx4.mjs\'s own S1 section',
      scriptStartOffsetInfo.fraction >= 0 && scriptStartOffsetInfo.fraction <= 0.02, JSON.stringify(scriptStartOffsetInfo));

    // CD3 harness-discipline fix (2026-07-22) — a fourth tenant. ORIGINAL
    // (this file's own live S4 section, pre-CD3), quoted verbatim:
    //
    //   const topBarParked = await app.evalJs(`(() => {
    //     const nav = document.querySelector('.chrome-top.sprint-nav');
    //     const strip = document.querySelector('.desk-mode-strip');
    //     const actions = document.querySelector('.sprint-actions');
    //     const buttons = [...actions.querySelectorAll('button')];
    //     const doneBtn = buttons.find(b => b.textContent.trim() === 'Done');
    //     const navRect = nav.getBoundingClientRect();
    //     const stripRect = strip.getBoundingClientRect();
    //     const actionsRect = actions.getBoundingClientRect();
    //     const doneRect = doneBtn.getBoundingClientRect();
    //     return {
    //       navRight: navRect.right, stripRight: stripRect.right, actionsLeft: actionsRect.left,
    //       actionsRight: actionsRect.right, doneRight: doneRect.right, doneLeft: doneRect.left,
    //       gapBetweenStripAndActions: actionsRect.left - stripRect.right,
    //     };
    //   })()`);
    //   ok('S4: Done is the rightmost element in the top bar (computed
    //   rect, not class presence)', Math.abs(topBarParked.doneRight -
    //   topBarParked.actionsRight) < 1, JSON.stringify(topBarParked));
    //
    // CD3 — Done scrapped from the top bar whole (Nick's own ruling); there
    // is no Done rect left to measure at all — the check's own SUBJECT is
    // gone, not merely relocated. Re-proven here as "no Done button exists
    // in the actions cluster anymore" (the retirement itself), with the
    // surviving "rightmost element" claim carried by the actions cluster's
    // own right edge instead — live successor: this file's own live S4
    // section, above.
    await freshProsePage(app, 1280, 900);
    const topBarGoneParked = await app.evalJs(`(() => {
      const actions = document.querySelector('.sprint-actions');
      const doneBtn = [...actions.querySelectorAll('button')].find(b => b.textContent.trim() === 'Done');
      return { doneGone: !doneBtn };
    })()`);
    pok('PARKED (was "S4: Done is the rightmost element in the top bar (computed rect, not class presence)") — CD3: Done is scrapped from the top bar whole (no rect left to measure); live successor: this file\'s own live S4 section ("the actions cluster hugs the nav\'s own right edge")',
      topBarGoneParked.doneGone === true, JSON.stringify(topBarGoneParked));

    // ORIGINAL (this file's own live S1 section, pre-SC1, run once per
    // reference width): await freshScriptPage(app, width, 900); const
    // stageScript = await app.evalJs(rectOf('.desk-frame-stage')); const
    // sheet = await app.evalJs(rectOf('.script-sheet')); const fenceScript =
    // stageScript.bottom - sheet.bottom; ok(`S1 @ ${width}px (script, S7
    // mirrors prose): the sheet's bottom edge sits within the same 32-48px
    // fence`, fenceScript >= 30 && fenceScript <= 50, JSON.stringify({
    // stageBottom: stageScript.bottom, sheetBottom: sheet.bottom, fence:
    // fenceScript }));
    // SC1 S1 — SUPERSEDED, and this one is a retirement rather than a
    // retune: the check's SUBJECT is gone. It measured a script sheet that
    // fell SHORT of the stage's bottom and asserted FX3's fill-down brought
    // it to a 32-48px fence. A true screenplay page is 11in — taller than
    // the stage — so it overflows and scrolls, and there is no longer any
    // "distance from the sheet's bottom to the stage's bottom" that could be
    // a fence at all (the value is now ~-323px, i.e. the paper's bottom is
    // BELOW the fold, exactly as a real page in a small window is). What FX3
    // was really guarding — that the paper is not left floating short of its
    // room, with `--fx3-paper-fence` of breathing space below it — survives
    // against the COLUMN instead, and is what the live successor asserts.
    // Prose keeps the original fence check unchanged. Live successor in this
    // file's own live S1 section above.
    await freshScriptPage(app, 1280, 900);
    const scriptFenceParked = await app.evalJs(`(() => {
      const stage = document.querySelector('.desk-frame-stage').getBoundingClientRect();
      const sheet = document.querySelector('.script-sheet').getBoundingClientRect();
      const col = document.querySelector('.mode-pagecol').getBoundingClientRect();
      return {
        staleFence: Math.round(stage.bottom - sheet.bottom),
        sheetHeightIn: Math.round((sheet.height / 96) * 1000) / 1000,
        fenceBelowPaper: Math.round(col.bottom - sheet.bottom),
        overflowsStage: sheet.height > stage.height,
      };
    })()`);
    pok('PARKED (was "S1 (script, S7 mirrors prose): the sheet\'s bottom edge sits within the same 32-48px fence") — SC1 S1: an 11in page is TALLER than the stage and scrolls inside the cap, so a paper-bottom-to-stage-bottom fence no longer exists; the fence FX3 guarded now rides below the paper inside the column; live successor in this file\'s own live S1 section',
      scriptFenceParked.overflowsStage === true
        && Math.abs(scriptFenceParked.sheetHeightIn - 11) <= 0.02
        && scriptFenceParked.fenceBelowPaper >= 30 && scriptFenceParked.fenceBelowPaper <= 50,
      JSON.stringify(scriptFenceParked));

    // ORIGINAL (this file's own live S5 section, pre-SC1), both quoted
    // verbatim: ok('S5 (script): the sliver foot row is present with exactly
    // THREE icons', footRow.iconCount === 3, JSON.stringify(footRow)); and
    // ok('S5 (script): the typewriter toggle\'s aria-label still carries the
    // word, for assistive tech', footRow.typewriterAriaLabelPresent,
    // JSON.stringify(footRow));
    // SC1 S3, AMENDED 2026-07-24 (Nick's word) — SUPERSEDED by removal, on the
    // SCRIPT surface only: with the typewriter withdrawn from a screenplay
    // page its icon goes with it (three icons become two) and there is no
    // aria-label left to carry the word. FX3 S5's own intent — the option is
    // an ICON, never a visible text label, but assistive tech still hears the
    // word — is unchanged and now asserted on prose, where the toggle lives.
    // This probe re-proves both halves at once, so it doubles as the guard
    // that the withdrawal did not become an app-wide accessibility
    // regression. Live successors in this file's own live S5 section.
    await freshScriptPage(app, 1400, 900);
    await openSliver(app);
    await sleep(250);
    const scriptFootParked = await app.evalJs(`(() => {
      const row = document.querySelector('.wz-sliver-instruments-row');
      const panel = document.querySelector('.wz-sliver-panel');
      return { iconCount: row ? row.querySelectorAll('button').length : -1, aria: !!panel.querySelector('[aria-label*="Typewriter"]') };
    })()`);
    await freshProsePage(app, 1400, 900);
    await openSliver(app);
    await sleep(250);
    const proseFootParked = await app.evalJs(`(() => {
      const row = document.querySelector('.wz-sliver-instruments-row');
      const panel = document.querySelector('.wz-sliver-panel');
      return { iconCount: row ? row.querySelectorAll('button').length : -1, aria: !!panel.querySelector('[aria-label*="Typewriter"]') };
    })()`);
    // ---- PARKED — SUPERSEDED by item 83 M8 (R12), 2026-08-27 ------------
    // GENERATION 2, quoted VERBATIM and no longer asserted. It held Nick's
    // SC1 S3 word — the typewriter withdrawn from screenplay, so the script
    // foot carried TWO icons and no aria-label while prose kept three and
    // the label. R12 reverses the withdrawal by founder word and M8 gives
    // both surfaces the SAME universal foot. Generation 3 stands below.
    // This entry is the gated twin of the two live parks already standing
    // in this file's own S5 section; the twin needed the ruling of
    // 2026-08-27 to be found at all, because only the default setting had
    // ever been run against this wave.
    //
    // pok('PARKED (was "S5 (script): the sliver foot row is present with exactly THREE icons" + "S5 (script): the typewriter toggle\'s aria-label still carries the word, for assistive tech") — SC1 S3, Nick\'s word: the option is withdrawn from the screenplay surface, so script carries TWO icons and no aria-label; prose keeps three and the label',
    // scriptFootParked.iconCount === 2 && scriptFootParked.aria === false
    // && proseFootParked.iconCount === 3 && proseFootParked.aria === true,
    // JSON.stringify({ scriptFootParked, proseFootParked }));
    // ---------------------------------------------------------------------
    // GENERATION 3 (item 83 M8/R12) — the SAME symmetry claim generations 1
    // and 2 both made, and the one this check has always really been about:
    // that the eye and assistive tech are told the same story. They are —
    // and now they are told it on BOTH surfaces, not one.
    pok('PARKED, generation 3 (was SC1 S3 re-assertion: script two icons and no aria-label, prose three and the label) — item 83 M8/R12: the withdrawal is REVERSED by founder word; script and prose carry the identical three-instrument foot, and the aria-label is present on both',
      scriptFootParked.iconCount === 3 && scriptFootParked.aria === true
        && proseFootParked.iconCount === 3 && proseFootParked.aria === true,
      JSON.stringify({ scriptFootParked, proseFootParked }));

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
