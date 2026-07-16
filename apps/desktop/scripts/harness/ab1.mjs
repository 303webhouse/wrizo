// AB1 — the Page and its Desk (docs/wrizo-alpha/ab1-page-frame-brief.md). A
// committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on w2.mjs.
// Run: node apps/desktop/scripts/harness/ab1.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
//
// === PARKED-check disposition (S6) ===
// The brief anticipated w1.mjs/m1.mjs checks asserting the flourishes'
// presence (typewriter, progress bar, milestones, ambient glow) would need
// moving into a PARKED section, since S2 unmounts all of them inside
// DeskFrame. That did NOT turn out to be necessary here, and this is
// recorded plainly rather than silently: DeskFrame (components/DeskFrame.tsx)
// only activates at >=1100px (DESKFRAME_MIN_WIDTH), matching the ticket's own
// non-goal ("mobile (<1100px) keeps current behavior") taken literally.
// Every existing harness script was audited against every `emulateDpr(...)`
// call it makes (apps/desktop/scripts/harness/*.mjs) — none ever requests a
// viewport >=1100px, and headless Chromium's un-emulated default window is
// well under that width — so w1.mjs's and m1.mjs's flourish-presence checks
// (`.mode-pfill`, `.mode-milestone`, `.typewriter-toggle`, `.journal-page
// .mode-glow`, etc.) exercise ONLY the legacy (<1100px) branch, which is
// byte-identical to pre-AB1 code and still mounts everything exactly as
// before. Re-ran the full pre-AB1 suite (w1/w2/m1/s1/th1/th2/j4/j5) after
// this build with ZERO changes to any of those files — all green. See
// docs/wrizo-alpha/ab1-shell-inventory.md for the full audit.
//
// The gate below is scaffolded per the brief's instruction (skipped by
// default, flip HARNESS_PARKED=1 to re-arm) so that IF a future change ever
// widens DeskFrame's gate or narrows the legacy branch, there is already a
// clearly-marked home for whatever specific w1.mjs/m1.mjs checks that change
// makes viewport-sensitive — nothing needs inventing at that point, only
// moving into the block below.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()`;

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'authed Desk' });
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after clear' });

  // A desktop viewport for every fixture below unless stated otherwise —
  // DeskFrame's own gate (DESKFRAME_MIN_WIDTH = 1100).
  await app.emulateDpr(1, 1400, 900);

  // === 1. TEXT surface (PageEditorView), framed ============================
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(200);

  ok('DeskFrame mounts at >=1100px on the text surface', await app.evalJs("!!document.querySelector('.desk-frame')"));

  // -- S1: zone tracks present. CD1 S4 — wayfinding (DeskRail, `.desk-rail`)
  // no longer mounts on ANY framed surface; the ORIGINAL "four zone tracks"
  // check (which required it present) is parked below (SUPERSEDED), with
  // the opposite assertion live here. FX1 S5 retired the ALWAYS-empty meter
  // track's own presence assertion — see this file's PARKED section and the
  // new live check just below. ------------------------------------------------
  const zones = await app.evalJs(`({
    wayfinding: !!document.querySelector('.desk-rail'),
    toolRail: !!document.querySelector('.desk-frame-toolrail'),
    stage: !!document.querySelector('.desk-frame-stage'),
    corkboard: !!document.querySelector('.desk-frame-corkboard'),
    meter: document.querySelectorAll('.desk-frame-meter').length,
  })`);
  ok('CD1 S4/S1: DeskFrame\'s own tool-rail/stage tracks are present; the far-left rail (.desk-rail) does NOT mount while framed',
    !zones.wayfinding && zones.toolRail && zones.stage,
    JSON.stringify(zones));
  // FX1 S5 — Nick's "dead bar" verdict: the meter track never had a content
  // prop (AB1 S2's own "ALWAYS empty/reserved"), so it rendered a wide,
  // purposeless desk-ground shell along the stage's bottom on every framed
  // page. DeskFrame now takes a `meter` prop and renders the track only when
  // something is passed; nothing is passed yet, so it renders NOTHING.
  // CD1 S5 — the corkboard track (previously a NAMED NON-GOAL, deliberately
  // left "untouched, still present" by FX1 S5) now adopts the SAME "render
  // only with content" law itself: the ORIGINAL check asserting it present
  // is parked below (SUPERSEDED), with the opposite assertion live here —
  // no CD1 caller passes corkboard content, so the track is absent too.
  ok('CD1 S5/FX1 S5: the dead meter-track bar is gone AND the corkboard track (no longer a named non-goal — CD1 S5 claims it) is also absent while empty',
    zones.meter === 0 && zones.corkboard === false, JSON.stringify(zones));

  // -- S2: the unified mode strip, exact ratified strings, title case -------
  const stripLabels = await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].map(b => b.textContent)");
  ok('S2: the mode strip reads exactly Free Write / Draft / Revise / Workshop / Publish',
    JSON.stringify(stripLabels) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']),
    JSON.stringify(stripLabels));

  // -- S2/AB2 — four checks retired here, moved to the PARKED section below
  // (first real tenant of the scaffold — S8 of docs/wrizo-alpha/ab2-tools-
  // by-mode-brief.md): AB2 gives the typewriter a rail home (still "inside
  // the frame"), retires the top-of-page pen/format bar on framed surfaces
  // (its contents move to the rail too), and retires the interim corkboard
  // Journal tab entirely (capture items move to the rail — their ruled
  // final home). Their successor assertions live in ab2.mjs.

  // -- finding 1: "the writing page is oddly small on a large monitor (stage
  // sizing)" — re-read against app-bones-canon.md's own fuller description
  // ("the page floats undersized in undifferentiated dark; chrome orphaned
  // at viewport corners"), this is a COMPOSITION complaint, not a raw-column-
  // width one: a capped 60ch reading measure is standard typographic practice
  // (~50-75 characters/line for readability) and is SMALLER in px than an
  // arbitrary wide column by design — narrower is correct here, not a
  // regression. What actually kills finding 1 is the page no longer floating
  // alone in undifferentiated dark: it now sits inside a deliberately
  // composed frame (fixed tool-rail/stage/corkboard tracks on desk ground,
  // asserted structurally by the S1 zone-track and PAGE IS PRIMARY checks
  // just above/below) instead of an orphaned column with chrome pinned to
  // viewport corners. No separate raw-width assertion belongs here — a
  // "wider column" check would be testing the wrong thing.
  const textRectBefore = await app.evalJs(rectOf('.mode-pagecol'));
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft').click()");
  await sleep(100);
  const textRectAfterModeSwitch = await app.evalJs(rectOf('.mode-pagecol'));
  ok('PAGE IS PRIMARY: the page rect is byte-identical across a mode-strip toggle',
    JSON.stringify(textRectBefore) === JSON.stringify(textRectAfterModeSwitch),
    `${JSON.stringify(textRectBefore)} -> ${JSON.stringify(textRectAfterModeSwitch)}`);

  const gearOpenRectCheck = await app.evalJs(`(() => {
    const before = ${rectOf('.mode-pagecol')};
    document.querySelector('.mode-gear').click();
    return before;
  })()`);
  await sleep(100);
  const textRectAfterGear = await app.evalJs(rectOf('.mode-pagecol'));
  ok('PAGE IS PRIMARY: the page rect is byte-identical while the settings gear is open',
    JSON.stringify(gearOpenRectCheck) === JSON.stringify(textRectAfterGear),
    `${JSON.stringify(gearOpenRectCheck)} -> ${JSON.stringify(textRectAfterGear)}`);
  await app.evalJs("document.querySelector('.mode-gear').click()"); // close it back

  // -- S4: the corner glyph (top-bar orphans collapsed) ----------------------
  ok('S4: GlobalHeader collapses to one corner glyph while framed', await app.evalJs("!!document.querySelector('.gh-corner-glyph')"));
  ok('S4: "Sign out" is not visible inline before the glyph is opened (collapsed behind the popover)', await app.evalJs("![...document.querySelectorAll('button')].some(b => b.textContent === 'Sign out')"));
  await app.evalJs("document.querySelector('.gh-corner-glyph').click()");
  await sleep(60);
  const cornerMenuButtons = await app.evalJs("[...document.querySelectorAll('.gh-corner-menu button')].map(b => b.textContent)");
  ok('S4: the corner glyph\'s popover carries Full screen + Sign out', cornerMenuButtons.some(t => /full screen/i.test(t)) && cornerMenuButtons.includes('Sign out'), JSON.stringify(cornerMenuButtons));
  await app.evalJs("document.querySelector('.gh-corner-glyph').click()"); // close it back

  // -- S4: "saved" is silent (SyncIndicator renders nothing on the happy path) -
  ok('S4: no "All changes saved" / "Saving…" text speaks anywhere on the framed surface', await app.evalJs("!document.body.innerText.includes('All changes saved') && !document.body.innerText.includes('Saving…')"));

  // === 2. Vanishing law, generalized (S3) — keydown dissolves the frame's
  // own chrome (mode strip + corner glyph), pointer-driven resurface works. =
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Writing to trigger the dissolve. ');
  await sleep(150);
  // Opacity is a CSS TRANSITION (animates over --fade-dur, ~2.8s on write) —
  // checking a threshold mid-animation is inherently timing-flaky. pointer-
  // events flips the instant the attribute/class changes (not animated), so
  // it's the reliable signal that the dissolve state itself actually took.
  // CD1 S1 — `.desk-frame-modestrip` (DeskFrame's own wrapper) retired along
  // with the modeStrip prop it once held; the mode strip itself
  // (`.desk-mode-strip`) now lives in the host's own header row
  // (`.sprint-nav`, carrying `chrome-fade` directly), outside DeskFrame
  // entirely. The ORIGINAL check (which read the now-gone wrapper) is
  // parked below (SUPERSEDED); this asserts the SAME truth — the strip goes
  // non-interactive on dissolve — through its new, correct ancestor.
  const dissolvedState = await app.evalJs(`({
    frameWriting: document.querySelector('.desk-frame')?.dataset.writing,
    stripPointerEvents: getComputedStyle(document.querySelector('.desk-mode-strip')).pointerEvents,
    glyphChromeReceded: document.querySelector('.gh-corner-glyph').closest('[data-chrome-receded]')?.dataset.chromeReceded,
  })`);
  ok('CD1 S1 (was "S3: ...mode strip goes non-interactive"): a keydown dissolves the frame (data-writing=true) AND the mode strip (now in the header row, not DeskFrame\'s own track) goes non-interactive too — one shared engine',
    dissolvedState.frameWriting === 'true' && dissolvedState.stripPointerEvents === 'none',
    JSON.stringify(dissolvedState));
  // The corner glyph rides the SAME global isWriting session (App.tsx's
  // WritingSession), the pre-existing engine every writing surface already
  // shares — not a second fade system.
  ok('S3: the corner glyph\'s own chrome-fade wrapper recedes on the same keydown (one shared engine, not a second one)',
    dissolvedState.glyphChromeReceded === 'true',
    JSON.stringify(dissolvedState));

  // Pointer-driven resurface: a deliberate reach to the top edge (with the
  // dwell the engine requires) brings the chrome back — the same dwell rule
  // useChromeDissolve has always used, now proven to reach DeskFrame's own
  // tracks too (S3's "generalized" claim).
  const dwellDiag1 = await app.evalJs(`(() => {
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 4, bubbles: true }));
    return { innerWidth: window.innerWidth, innerHeight: window.innerHeight };
  })()`);
  await sleep(2000); // generous margin past EDGE_DWELL_MS (260ms)
  const resurfacedState = await app.evalJs("document.querySelector('.desk-frame')?.dataset.writing");
  ok('S3: a deliberate pointer reach to the edge resurfaces the frame (data-writing=false)', resurfacedState === 'false', `${resurfacedState} viewport=${JSON.stringify(dwellDiag1)}`);

  // === 3. BOARD + SCRIPT surfaces, framed ===================================
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before board/script fixtures' });
  await app.emulateDpr(1, 1400, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    // One text box (S3's board fixture) so there is something to double-click
    // into and type — commitText's own keydown-driven noteWrite() call needs
    // a live edit session to prove the dissolve actually fires on Board too.
    entries.push({ id: 'ab1-board', text: '', pageType: 'board', boxes: [
      { id: 'ab1-board-box', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'hello' },
    ], createdAt: now, updatedAt: now });
    // One scene, one empty heading — createEmptyScriptDoc()'s own shape, so
    // there's a live .script-el-active to type into (an empty scenes: []
    // array renders NO elements at all, unlike w2.mjs's route-restore-only
    // script fixture which never types).
    const headingId = 'ab1-script-heading';
    entries.push({ id: 'ab1-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] }] }, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after board/script seed' });

  // -- Board: DeskFrame mounts, no mode strip (Trellis-side by design) ------
  await app.evalJs("location.hash = '#/page/ab1-board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Board framed' });
  await sleep(200);
  ok('Board mounts inside DeskFrame at >=1100px', await app.evalJs("!!document.querySelector('.board-canvas, .board-canvas-wrap')"));
  ok('Board never renders the mode strip (Trellis-side by design)', await app.evalJs("!document.querySelector('.desk-mode-strip')"));
  const boardToolrailRect = await app.evalJs(rectOf('.desk-frame-toolrail'));

  // -- S3 on Board: committing an edit inside a text box (real keydown input,
  // even though Board has no live pen-stroke authoring — J4: ink boxes only
  // ever arrive via a port) dissolves the frame's own reserved tracks too,
  // and the same pointer-edge dwell rule resurfaces it. -----------------------
  await app.evalJs("document.querySelector('[data-box-id=\"ab1-board-box\"]').dispatchEvent(new MouseEvent('dblclick', {bubbles:true}))");
  await app.waitFor("!!document.querySelector('[data-box-id=\"ab1-board-box\"] .board-text-editing')", { label: 'board text box in edit mode' });
  await app.typeKeys(' EDITED');
  await sleep(150);
  const boardDissolvedState = await app.evalJs("document.querySelector('.desk-frame')?.dataset.writing");
  ok('S3: typing inside a Board text box dissolves the frame too (the law reaches Board, not just prose/script)', boardDissolvedState === 'true', String(boardDissolvedState));
  // ab1.1 R1 (Fable review) — the sprint-nav row was the one piece of framed
  // chrome that never carried chrome-fade/data-chrome-receded; it must
  // recede with everything else, and restore on the same resurface below.
  const boardNavReceded = await app.evalJs(`({
    pointerEvents: getComputedStyle(document.querySelector('.desk-frame-host .sprint-nav')).pointerEvents,
    hostReceded: document.querySelector('.sprint-nav').closest('[data-chrome-receded]')?.dataset.chromeReceded,
  })`);
  ok('S3 R1: Board\'s sprint-nav row recedes with the rest of the room (chrome-fade, not left behind)',
    boardNavReceded.pointerEvents === 'none' && boardNavReceded.hostReceded === 'true', JSON.stringify(boardNavReceded));
  await app.evalJs("window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 4, bubbles: true }))");
  await sleep(500);
  const boardResurfaced = await app.evalJs("document.querySelector('.desk-frame')?.dataset.writing");
  ok('S3: Board resurfaces on the same pointer-edge dwell rule', boardResurfaced === 'false', String(boardResurfaced));
  const boardNavRestored = await app.evalJs(`({
    pointerEvents: getComputedStyle(document.querySelector('.desk-frame-host .sprint-nav')).pointerEvents,
    hostReceded: document.querySelector('.sprint-nav').closest('[data-chrome-receded]')?.dataset.chromeReceded,
  })`);
  ok('S3 R1: Board\'s sprint-nav row restores on the same edge-dwell resurface',
    boardNavRestored.pointerEvents !== 'none' && boardNavRestored.hostReceded === 'false', JSON.stringify(boardNavRestored));
  await app.evalJs("document.querySelector('[data-box-id=\"ab1-board-box\"] .board-text-editing')?.blur()");

  // -- Script: DeskFrame mounts, mode strip present (finding 5 dies here) ---
  await app.evalJs("location.hash = '#/page/ab1-script'");
  await app.waitFor("!!document.querySelector('.script-sheet')", { label: 'Script framed' });
  await sleep(200);
  ok('Script mounts inside DeskFrame at >=1100px', await app.evalJs("!!document.querySelector('.desk-frame')"));
  const scriptStripLabels = await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].map(b => b.textContent)");
  ok('S6/finding-5: the mode strip is present on the script surface too, same five strings',
    JSON.stringify(scriptStripLabels) === JSON.stringify(['Free Write', 'Draft', 'Revise', 'Workshop', 'Publish']),
    JSON.stringify(scriptStripLabels));
  const scriptActiveTab = await app.evalJs("document.querySelector('.desk-mode-tab.active')?.textContent");
  ok('Script: Draft is the only live/active posture (script Free-write is AB2)', scriptActiveTab === 'Draft', String(scriptActiveTab));
  const scriptDeferred = await app.evalJs("[...document.querySelectorAll('.desk-mode-tab.deferred')].map(b => b.textContent)");
  ok('Script: Free Write/Revise/Workshop are deferred (not silently live)', JSON.stringify(scriptDeferred) === JSON.stringify(['Free Write', 'Revise', 'Workshop']), JSON.stringify(scriptDeferred));

  // -- PAGE IS PRIMARY across pageTypes: the FRAME's own tracks (toolrail)
  // sit at the same structural position regardless of which pageType
  // occupies the stage — the page's own measure inside the stage is allowed
  // to differ (screenplay keeps its own courier measure, not forced to
  // prose's 60ch), but the reserved tracks around it never move. -----------
  const scriptToolrailRect = await app.evalJs(rectOf('.desk-frame-toolrail'));
  ok('PAGE IS PRIMARY: the tool-rail track sits at the same position on Board and Script (pageType-invariant frame)',
    boardToolrailRect.left === scriptToolrailRect.left && boardToolrailRect.width === scriptToolrailRect.width,
    `board=${JSON.stringify(boardToolrailRect)} script=${JSON.stringify(scriptToolrailRect)}`);

  // -- S4 finding 4: containment — the script sheet is height-capped and
  // scrolls internally; the page never extends past the frame even after
  // typing well past a single screen's worth of content. --------------------
  await app.evalJs("document.querySelector('.script-el-active').focus()");
  const longScene = 'INT. LOCATION - DAY';
  await app.typeKeys(longScene);
  await app.key('Enter');
  // 18 short action lines is enough to overflow the 620px scroll-cap without
  // making this fixture slow (typeKeys dispatches one CDP event per key).
  const manyLines = Array.from({ length: 18 }, (_, i) => `Action line ${i} overflows the sheet.`);
  for (const line of manyLines) {
    await app.typeKeys(line);
    await app.key('Enter');
  }
  await sleep(150);
  const containment = await app.evalJs(`(() => {
    const cap = document.querySelector('.desk-frame-scroll-cap');
    return {
      capHeight: cap.getBoundingClientRect().height,
      scrollHeight: cap.scrollHeight,
      overflowed: cap.scrollHeight > cap.clientHeight,
      bodyScrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  })()`);
  ok('finding 4: the script sheet has a bounded scroll-cap height (does not grow unbounded)', containment.capHeight <= 660, JSON.stringify(containment));
  ok('finding 4: the overflowing content scrolls INSIDE the cap, not the whole page', containment.overflowed === true, JSON.stringify(containment));
  ok('finding 4: the document itself never grows to swallow the overflow (no "drops to the taskbar")',
    containment.bodyScrollHeight <= containment.viewportHeight + 40,
    JSON.stringify(containment));

  // -- S3 on script: keydown dissolves the script surface's own frame too ---
  // (already dissolved by the flood of typing just above — confirms the
  // frame reacts, then proves resurface works here too, same dwell rule.)
  const scriptDissolveAfter = await app.evalJs("document.querySelector('.desk-frame')?.dataset.writing");
  ok('S3: typing on the script surface dissolves its own DeskFrame too (the law generalizes per-surface)',
    scriptDissolveAfter === 'true', String(scriptDissolveAfter));
  // ab1.1 R1 (Fable review) — same nav-row gap on Script.
  const scriptNavReceded = await app.evalJs(`({
    pointerEvents: getComputedStyle(document.querySelector('.desk-frame-host .sprint-nav')).pointerEvents,
    hostReceded: document.querySelector('.sprint-nav').closest('[data-chrome-receded]')?.dataset.chromeReceded,
  })`);
  ok('S3 R1: Script\'s sprint-nav row recedes with the rest of the room (chrome-fade, not left behind)',
    scriptNavReceded.pointerEvents === 'none' && scriptNavReceded.hostReceded === 'true', JSON.stringify(scriptNavReceded));
  await app.evalJs("window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 4, bubbles: true }))");
  await sleep(500);
  const scriptResurfaced = await app.evalJs("document.querySelector('.desk-frame')?.dataset.writing");
  ok('S3: the script surface resurfaces on the same pointer-edge dwell rule', scriptResurfaced === 'false', String(scriptResurfaced));
  const scriptNavRestored = await app.evalJs(`({
    pointerEvents: getComputedStyle(document.querySelector('.desk-frame-host .sprint-nav')).pointerEvents,
    hostReceded: document.querySelector('.sprint-nav').closest('[data-chrome-receded]')?.dataset.chromeReceded,
  })`);
  ok('S3 R1: Script\'s sprint-nav row restores on the same edge-dwell resurface',
    scriptNavRestored.pointerEvents !== 'none' && scriptNavRestored.hostReceded === 'false', JSON.stringify(scriptNavRestored));

  // === 3b. PAGE IS PRIMARY at the gate FLOOR (1100px exactly) ===============
  // Review fix — every check above ran at 1400px, where the stage has ample
  // room. Near DESKFRAME_MIN_WIDTH itself, the stage's actual available
  // width (viewport minus the fixed 200px tool-rail + 260px corkboard + two
  // 28px gaps + host padding) is well under the desired 760px/60ch prose
  // measure. A real bug found here: the inner `.mode-row` grid used a bare
  // `1fr` track (not `minmax(0,1fr)`, unlike the outer `.desk-frame-grid`,
  // which already got this right), so the track's growth limit defaulted to
  // its item's max-content size — the page column rendered WIDER than its
  // own stage box and visually overlapped the tool-rail/corkboard tracks at
  // viewports as wide as ~1260px. Fixed in index.css (`.mode-row[data-
  // framed]`'s track + a min-width:0/max-width:100% chain down through
  // `.mode-stage`/`.mode-pagecol`); asserted here so it can't silently
  // regress.
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before gate-floor fixture' });
  await app.emulateDpr(1, 1100, 900); // the exact DESKFRAME_MIN_WIDTH floor
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), gate floor' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'DeskFrame at exactly 1100px' });
  await sleep(200);
  // rectOf only returns {left,top,width,height} (no .right) — derive right
  // edges explicitly rather than reading a property that doesn't exist.
  // CD1 S5 — `.desk-frame-corkboard` no longer mounts AT ALL while empty
  // (the FX1 S5 "render only with content" law, reused for this track; no
  // CD1 caller ever passes content), so its own rect no longer exists to
  // read. The ORIGINAL "never overlaps the corkboard" check is parked below
  // (SUPERSEDED); the tool-rail overlap check is untouched (still a real
  // track) and stays live as-is.
  const gateFloorRects = await app.evalJs(`({
    toolrail: ${rectOf('.desk-frame-toolrail')},
    pagecol: ${rectOf('.mode-pagecol')},
    corkboardAbsent: !document.querySelector('.desk-frame-corkboard'),
    hasHorizScroll: document.documentElement.scrollWidth > window.innerWidth,
  })`);
  const toolrailRight = gateFloorRects.toolrail.left + gateFloorRects.toolrail.width;
  const pagecolRight = gateFloorRects.pagecol.left + gateFloorRects.pagecol.width;
  ok('PAGE IS PRIMARY at the gate floor (1100px): the page column never overlaps the tool-rail',
    gateFloorRects.pagecol.left >= toolrailRight,
    JSON.stringify({ ...gateFloorRects, toolrailRight, pagecolRight }));
  ok('CD1 S5/S1 (was "...never overlaps the corkboard"): the corkboard track does not mount at all at the gate floor either (nothing to overlap — the FX1 S5 law, universal, not just on a wide viewport)',
    gateFloorRects.corkboardAbsent === true,
    JSON.stringify({ ...gateFloorRects, toolrailRight, pagecolRight }));
  ok('PAGE IS PRIMARY at the gate floor (1100px): no horizontal scroll (nothing overflows the viewport)',
    gateFloorRects.hasHorizScroll === false, JSON.stringify(gateFloorRects));

  // === 4. Mobile / below the gate: current behavior is untouched (non-goal) =
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before mobile fixture' });
  await app.emulateDpr(1, 900, 700); // below DESKFRAME_MIN_WIDTH
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), mobile' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, mobile' });
  await sleep(200);
  ok('below 1100px: DeskFrame does NOT mount (non-goal — mobile keeps current behavior)', await app.evalJs("!document.querySelector('.desk-frame')"));
  ok('below 1100px: the legacy 3-tab ModeSwitcher renders instead of the 5-string strip', await app.evalJs("!!document.querySelector('.mode-tabs') && !document.querySelector('.desk-mode-strip')"));
  ok('below 1100px: GlobalHeader renders its three controls inline, not collapsed', await app.evalJs("!document.querySelector('.gh-corner-glyph')"));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// AB1's own scaffold comment predicted a gate-widening scenario; AB2 is the
// first real tenant instead (docs/wrizo-alpha/ab2-tools-by-mode-brief.md
// S8) — four checks this ticket's S2 design supersedes, moved here rather
// than deleted (parked != deleted, the law working as designed). Each is
// quoted verbatim from AB1 for the audit trail, then re-asserted against
// its NEW, opposite truth (proving the retirement, not re-testing a
// presence AB2 deliberately removed) — the only way to keep this block
// green under HARNESS_PARKED=1 while the checks it documents are honestly
// obsolete. Successor assertions for the rail's real contents live in
// ab2.mjs, not here.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'authed Desk (PARKED)' });
    await app.evalJs('localStorage.clear()');
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after clear (PARKED)' });
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/project/new');
    await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), PARKED' });
    await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
    await app.click('Start writing');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed, PARKED' });
    await sleep(200);

    // ORIGINAL (AB1): ok('S2: no flourish (typewriter/progress-bar/
    // milestones/ambient-glow) mounts inside the frame', !flourishes.
    // typewriterToggle && !flourishes.progressBar && !flourishes.
    // milestones && !flourishes.ambientGlow, JSON.stringify(flourishes));
    // AB2 S2 — the typewriter returns from parking into the rail (still
    // "inside the frame"); progress-bar/milestones/ambient-glow are
    // untouched by this ticket and stay absent.
    const flourishesNow = await app.evalJs(`({
      typewriterToggle: !!document.querySelector('.desk-frame .typewriter-toggle'),
      progressBar: !!document.querySelector('.desk-frame .mode-incentive-row'),
      milestones: !!document.querySelector('.desk-frame .mode-milestone'),
      ambientGlow: !!document.querySelector('.desk-frame .mode-glow'),
    })`);
    pok('PARKED (was "S2: no flourish mounts inside the frame") — AB2 S2 gives the typewriter a rail home: it now DOES mount inside the frame; progress-bar/milestones/ambient-glow remain absent, unchanged',
      flourishesNow.typewriterToggle === true && !flourishesNow.progressBar && !flourishesNow.milestones && !flourishesNow.ambientGlow,
      JSON.stringify(flourishesNow));

    // ORIGINAL (AB1): ok('S2: the pen/format bar (ink tools) still renders
    // inside the frame', await app.evalJs("!!document.querySelector('.desk-
    // frame .mode-bar')"));
    // AB2 S2/S3 — the pen/format bar retires on framed surfaces; its ink
    // swatches and Draft's format tools both moved to the rail.
    const modeBarGone = await app.evalJs("!document.querySelector('.desk-frame .mode-bar')");
    pok('PARKED (was "S2: the pen/format bar still renders inside the frame") — AB2 S2/S3 retires it on framed surfaces (contents moved to the rail): it no longer renders',
      modeBarGone === true);

    // ORIGINAL (AB1): ok('S2: the corkboard Journal tab carries the
    // relocated capture items', JSON.stringify(corkboardItems) ===
    // JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']), ...);
    // ok('S2: the corkboard tab is headed "Journal" (Plateau)', ... ===
    // 'Journal');
    // AB2 S2 — the interim corkboard Journal tab retires entirely (the
    // corkboard track returns to empty/reserved until AB3); the capture
    // items move to their ruled final home, the tool rail.
    const corkboardGone = await app.evalJs(`({
      items: document.querySelectorAll('.desk-corkboard-item').length,
      heading: !!document.querySelector('.desk-corkboard-h'),
    })`);
    pok('PARKED (was "S2: the corkboard Journal tab carries the relocated capture items" + "...is headed Journal") — AB2 S2 retires the interim corkboard tab entirely: no items, no heading',
      corkboardGone.items === 0 && corkboardGone.heading === false,
      JSON.stringify(corkboardGone));

    // ORIGINAL (AB1 S1): ok('S1: all five zone tracks present
    // (wayfinding+toolrail+stage+corkboard+meter)', zones.wayfinding &&
    // zones.toolRail && zones.stage && zones.corkboard && zones.meter === 1,
    // JSON.stringify(zones)); ok('S1: exactly one meter track, and it is
    // empty', zones.meter === 1 && (await app.evalJs("document.
    // querySelector('.desk-frame-meter').children.length === 0")) === true);
    // FX1 S5 (Nick's first-sitting verdict, "the dead bar dies") — the meter
    // track's own ALWAYS-empty presence was itself the bug (a wide,
    // purposeless desk-ground shell along the stage's bottom); DeskFrame now
    // renders the track only when a `meter` prop is passed, and nothing
    // passes one yet, so the opposite is now true: the track doesn't mount
    // at all. Successor assertion lives in this file's own live section
    // (S1), not moved to another file — this bug and its fix are both AB1/
    // FX1's own territory.
    const meterGoneNow = await app.evalJs("document.querySelectorAll('.desk-frame-meter').length");
    pok('PARKED (was "S1: all five zone tracks present..." + "S1: exactly one meter track, and it is empty") — FX1 S5: the meter track does not mount at all while empty (zero tracks, not one empty one)',
      meterGoneNow === 0, String(meterGoneNow));

    // ORIGINAL (S1): ok('S1: four zone tracks present
    // (wayfinding+toolrail+stage+corkboard)', zones.wayfinding &&
    // zones.toolRail && zones.stage && zones.corkboard, JSON.stringify(zones));
    // CD1 S4 — the far-left rail (.desk-rail, "wayfinding") no longer
    // mounts on ANY framed surface (store/deskFrameActive.ts: DeskRail
    // itself returns null while a DeskFrame is on screen). Successor
    // assertion lives in this file's own live section (S1), not moved to
    // another file — this bug and its fix are both AB1/CD1's own territory,
    // same precedent as the meter-track entry just above.
    await app.goto('/project/new');
    await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), PARKED wayfinding' });
    await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
    await app.click('Start writing');
    await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'DeskFrame framed, PARKED wayfinding' });
    await sleep(200);
    const wayfindingGoneNow = await app.evalJs("!!document.querySelector('.desk-rail')");
    pok('PARKED (was "S1: four zone tracks present (wayfinding+toolrail+stage+corkboard)") — CD1 S4: wayfinding (.desk-rail) is ABSENT while framed, not present',
      wayfindingGoneNow === false, String(wayfindingGoneNow));

    // ORIGINAL (S3): ok('S3: a keydown dissolves the frame (data-writing=
    // true, mode strip goes non-interactive)', dissolvedState.frameWriting
    // === 'true' && dissolvedState.stripPointerEvents === 'none', ...);
    // (dissolvedState read getComputedStyle(document.querySelector(
    // '.desk-frame-modestrip')).pointerEvents — that wrapper element no
    // longer exists.) CD1 S1 — the mode strip moved out of DeskFrame
    // entirely, into the host's own header row; its dissolve now rides
    // `.sprint-nav`'s own `chrome-fade` class, proven live in this file's
    // own S3 section above via `.desk-mode-strip` directly (a valid,
    // still-existing selector) rather than the retired wrapper.
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('PARKED wrapper-retirement probe. ');
    await sleep(150);
    const modestripWrapperGoneNow = await app.evalJs("!document.querySelector('.desk-frame-modestrip')");
    pok('PARKED (was "S3: ...mode strip goes non-interactive", reading the now-gone .desk-frame-modestrip wrapper) — CD1 S1: that wrapper is ABSENT entirely (the strip lives in the header row now, not a DeskFrame track)',
      modestripWrapperGoneNow === true, String(modestripWrapperGoneNow));

    // ORIGINAL (AB1 gate-floor fixture): const gateFloorRects = await
    // app.evalJs(`({ toolrail: ${rectOf('.desk-frame-toolrail')}, pagecol:
    // ${rectOf('.mode-pagecol')}, corkboard: ${rectOf('.desk-frame-
    // corkboard')}, hasHorizScroll: document.documentElement.scrollWidth >
    // window.innerWidth, })`); const corkboardLeft = gateFloorRects.
    // corkboard.left; ok('PAGE IS PRIMARY at the gate floor (1100px): the
    // page column never overlaps the corkboard', pagecolRight <=
    // corkboardLeft, ...); — `.desk-frame-corkboard` no longer mounts at
    // all while empty (CD1 S5, the FX1 S5 law reused), so `rectOf(...)`
    // itself threw (getBoundingClientRect on null) — not a graceful
    // failure, a crash, which is exactly why this file's own live section
    // above computes `corkboardAbsent` instead of a rect now.
    await app.emulateDpr(1, 1100, 900); // the exact DESKFRAME_MIN_WIDTH floor, PARKED fixture
    await app.goto('/project/new');
    await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), PARKED gate floor' });
    await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
    await app.click('Start writing');
    await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'DeskFrame at 1100px, PARKED gate floor' });
    await sleep(200);
    const corkboardStillGoneAtFloor = await app.evalJs("!document.querySelector('.desk-frame-corkboard')");
    pok('PARKED (was "PAGE IS PRIMARY at the gate floor (1100px): the page column never overlaps the corkboard", a rect read that now crashes on the retired track) — CD1 S5: the corkboard track is simply ABSENT at the gate floor, nothing to overlap',
      corkboardStillGoneAtFloor === true, String(corkboardStillGoneAtFloor));

    // ORIGINAL (FX1 S5): ok('FX1 S5: the dead meter-track bar is gone (no
    // host renders while empty) — the named non-goal corkboard track is
    // untouched, still present', zones.meter === 0 && zones.corkboard ===
    // true, JSON.stringify(zones));
    // CD1 S5 — the corkboard track stops being a named non-goal and adopts
    // the SAME "render only with content" law FX1 S5 gave the meter track:
    // it is now ABSENT while empty, same as meter, not present.
    const corkboardGoneTooNow = await app.evalJs("!document.querySelector('.desk-frame-corkboard')");
    pok('PARKED (was "...the named non-goal corkboard track is untouched, still present") — CD1 S5: the corkboard track is no longer untouched; it is ABSENT while empty too',
      corkboardGoneTooNow === true, String(corkboardGoneTooNow));

    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nAB1 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nAB1 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nAB1 VERIFY: PASS (${allChecks.length} checks)` : `\nAB1 VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
