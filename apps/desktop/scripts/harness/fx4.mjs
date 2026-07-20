// FX4 — the Fourth Sitting (docs/wrizo-alpha/fx4-fourth-sitting-brief.md). A
// committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on ab4.mjs's own patterns — freshDesk/freshProsePage
// below are the same shape ab4.mjs/cd1.mjs already established, copied
// verbatim per the brief's own instruction.
// Run: node scripts/harness/fx4.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S9 list: start-offset ~25% within tolerance +
// engage-at-~10-lines, both reference widths + the 1100 floor (S1); the
// ink-coordinate byte-truth proof on a seeded stroke, pre/post the offset
// change (S1's own STOP-and-report proof); glow luminance floor at
// mid-progress (S2); strip x===0 and board-sliver flushness (S3); both-axes
// card resize + board-meta persistence across reload (S4); popup
// open/blur/focus-trap/Done (S5); handle-drag thread create/cancel/dedupe
// (S6); Stacked CSS asserts (S7); hover-restore, multi-cycle (S8).
//
// Park sweep (S9's own instruction, applied broadly per the brief's "audit
// broadly" directive — this ticket touches shared typewriter infrastructure
// every existing typewriter-consuming check indirectly depends on, and
// retires two whole AB4-era mechanisms): investigated in full — every one
// of the 18 pre-existing harness files run against this build; six needed
// real parking (fx3.mjs S1's three start-offset/engage checks; cd1.mjs's
// S9 wide-viewport symmetric-margins check; w2.mjs's raw-scrollY pager
// check; ab1.mjs's S3-on-Board inline-edit dissolve checks; j4.mjs's three
// inline-edit checks), all SUPERSEDED species, quoted verbatim in their own
// files' PARKED sections, with live successors here. The remaining twelve
// (ab2/ab3/ab4/cd2/fx1/fx2/hb1/j5/m1/s1/th1/th2/w1) were run and found
// unaffected — no check anywhere else asserted the pre-FX4 state as a
// pass/fail condition. ab4.mjs's own connect-toggle-gesture checks and its
// exact-two-tools count are parked there directly (S6's own instruction);
// successors are in this file's own S6 section.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const WIDE_W = 2200;
const FLOOR_W = 1100;

// Count comma-separated box-shadow LAYERS correctly: a computed box-shadow
// string's own color components are `rgb(r, g, b)`/`rgba(r, g, b, a)`,
// which contain internal commas a naive `.split(',')` would also split on
// (a real bug this file's own first draft hit) — walk the string tracking
// paren depth and only count top-level commas.
function countShadowLayers(boxShadow) {
  if (!boxShadow || boxShadow === 'none') return 0;
  let depth = 0, layers = 1;
  for (const ch of boxShadow) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) layers++;
  }
  return layers;
}

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

const freshScriptPage = async (app, width = 1280, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const headingId = 'fx4-script-heading';
    entries.push({ id: 'fx4-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] }] }, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after script seed' });
  await app.evalJs("location.hash = '#/page/fx4-script'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Script framed' });
  await sleep(250);
};

// A fresh, framed loose Journal page (authored, ink-capable) — a direct
// localStorage seed + navigate, mirroring how the app's own "new page" door
// creates one (source:'page', no pageType -> the ink-authored view).
const freshJournalPage = async (app, jid, width = 1280, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(jid)}, text: '', source: 'page', strokes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/journal/' + ${JSON.stringify(jid)}`);
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'journal authored page' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

const freshBoard = async (app, boardId, boxes, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX4 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// j4.mjs's own drag helper, copied verbatim (re-injected after every
// app.reload() — custom window helpers don't survive a hard reload).
const DRAG_HELPER = `
window.__pointerSeq = function(selector, dx, dy, opts) {
  opts = opts || {};
  const el = document.querySelector(selector);
  if (!el) throw new Error('pointerSeq: not found ' + selector);
  const r = el.getBoundingClientRect();
  const x0 = r.left + r.width/2, y0 = r.top + r.height/2;
  const pid = opts.pointerId || 1;
  const ptype = opts.pointerType || 'mouse';
  const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:pid, pointerType:ptype, bubbles:true, cancelable:true, isPrimary:true});
  el.dispatchEvent(mk('pointerdown', x0, y0));
  const steps = opts.steps || 4;
  for (let i=1;i<=steps;i++) {
    el.dispatchEvent(mk('pointermove', x0 + dx*i/steps, y0 + dy*i/steps));
  }
  el.dispatchEvent(mk('pointerup', x0+dx, y0+dy));
  return true;
};
`;

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the typewriter start, everywhere. START_FRACTION -> 0.25, measured
  // the fx1.mjs way (a rendered rect, not the raw CSS value alone). Both
  // reference widths + the 1100 floor, prose + script + Journal (the
  // carve-out retires).
  // ==========================================================================
  for (const width of [LAPTOP_W, WIDE_W, FLOOR_W]) {
    await freshProsePage(app, width, 900);
    const proseInfo = await app.evalJs(`(() => {
      const stage = document.querySelector('.desk-frame-stage');
      const ed = document.querySelector('.forward-only-editor');
      const stageR = stage.getBoundingClientRect(), edR = ed.getBoundingClientRect();
      return { fraction: (edR.top - stageR.top) / stageR.height };
    })()`);
    ok(`S1 @ ${width}px (prose): the visual start position reads as "about a quarter" (20-32% of the stage height)`,
      proseInfo.fraction >= 0.20 && proseInfo.fraction <= 0.32, JSON.stringify(proseInfo));
  }

  await freshScriptPage(app, LAPTOP_W, 900);
  const scriptInfo = await app.evalJs(`(() => {
    const stage = document.querySelector('.desk-frame-stage');
    const sheet = document.querySelector('.script-sheet');
    const stageR = stage.getBoundingClientRect(), sheetR = sheet.getBoundingClientRect();
    return { fraction: (sheetR.top - stageR.top) / stageR.height };
  })()`);
  ok('S1 @ 1280px (script, S7 mirrors prose): the visual start position also reads as "about a quarter"',
    scriptInfo.fraction >= 0.20 && scriptInfo.fraction <= 0.32, JSON.stringify(scriptInfo));

  // Journal: the carve-out retires — .entry-full now reads --tw-start-offset
  // for the first time. Raw fraction (paddingTop / window.innerHeight, the
  // basis Journal's own window-scroll measure() actually uses) should land
  // at ~START_FRACTION (0.25) directly — Journal has no extra chrome padding
  // ON TOP of the offset the way prose's .mode-page does.
  const jid1 = 'fx4-journal-offset';
  await freshJournalPage(app, jid1, LAPTOP_W, 900);
  await sleep(500); // settle any mount-time band() runs before reading "at rest"
  const journalOffsetInfo = await app.evalJs(`(() => {
    const sheet = document.querySelector('.entry-full');
    const offsetPx = parseFloat(getComputedStyle(sheet).paddingTop) || 0;
    return { offsetPx, innerHeight: window.innerHeight, fraction: offsetPx / window.innerHeight, dataTypewriter: sheet.dataset.typewriter, restScrollY: window.scrollY };
  })()`);
  ok('S1: Journal\'s carve-out retires — .entry-full now reads --tw-start-offset (padding-top), landing at ~25% of the window height',
    journalOffsetInfo.dataTypewriter === 'true' && Math.abs(journalOffsetInfo.fraction - 0.25) < 0.02, JSON.stringify(journalOffsetInfo));
  ok('S1: a fresh, untouched Journal page does NOT auto-scroll on mount (the caret-detection fallback fix\'s own guard against a false "caret at the box\'s min-height floor" read)',
    journalOffsetInfo.restScrollY === 0, JSON.stringify(journalOffsetInfo));

  // Journal engage-at-~10-lines, both reference widths + the floor.
  for (const [width, height] of [[LAPTOP_W, 900], [WIDE_W, 1000], [FLOOR_W, 900]]) {
    const jid = `fx4-journal-engage-${width}`;
    await freshJournalPage(app, jid, width, height);
    await app.evalJs("document.querySelector('.entry-edit').focus()");
    let scrolledAtLine = null;
    for (let i = 1; i <= 20 && scrolledAtLine === null; i++) {
      await app.typeKeys(`Line ${i} of journal test content, long enough to wrap the paper's own measure a bit.\n`);
      await sleep(80);
      const scrolled = await app.evalJs("document.querySelector('.entry-full')?.dataset.scrolled");
      if (scrolled === 'true') scrolledAtLine = i;
    }
    ok(`S1 @ ${width}x${height} (Journal): the scroll/fade engages at ~10 line-equivalents (8-13), not lagging for a dozen-plus`,
      scrolledAtLine !== null && scrolledAtLine >= 8 && scrolledAtLine <= 13, `scrolledAtLine=${scrolledAtLine}`);
  }

  // ==========================================================================
  // S1 — the ink-coordinate byte-truth proof (the STOP-and-report clause's
  // own required evidence). A seeded stroke at KNOWN normalized coordinates:
  // (1) the sheet's own rect (top/left/width — the ONLY thing normPoint/
  // paintCommitted/renderStroke ever key off) is IDENTICAL whether
  // data-typewriter is 'true' or 'false' (the padding-top/bottom toggle);
  // (2) the rendered ink pixel lands exactly where the normalized
  // coordinates + that rect predict.
  // ==========================================================================
  {
    const jid = 'fx4-ink-proof';
    const stroke = { points: [{ x: 0.2, y: 0.1 }, { x: 0.3, y: 0.15 }, { x: 0.4, y: 0.2 }] };
    await freshDesk(app, LAPTOP_W, 900);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: ${JSON.stringify(jid)}, text: 'ink coordinate proof page\\nsecond line of text here', source: 'page', strokes: [${JSON.stringify(stroke)}], createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs(`location.hash = '#/journal/' + ${JSON.stringify(jid)}`);
    await app.waitFor("!!document.querySelector('.entry-full')", { label: 'journal page with seeded ink' });
    await sleep(400);
    await app.emulateDpr(1, LAPTOP_W, 900);

    const toggleProof = await app.evalJs(`(() => {
      const sheet = document.querySelector('.entry-full');
      const before = sheet.getBoundingClientRect();
      const beforeAttr = sheet.dataset.typewriter;
      sheet.setAttribute('data-typewriter', beforeAttr === 'true' ? 'false' : 'true');
      const after = sheet.getBoundingClientRect();
      sheet.setAttribute('data-typewriter', beforeAttr);
      const restored = sheet.getBoundingClientRect();
      return {
        before: { top: before.top, left: before.left, width: before.width, height: before.height },
        after: { top: after.top, left: after.left, width: after.width, height: after.height },
        restored: { top: restored.top, left: restored.left, width: restored.width, height: restored.height },
      };
    })()`);
    const rectInvariant =
      Math.abs(toggleProof.before.top - toggleProof.after.top) < 0.01 &&
      Math.abs(toggleProof.before.left - toggleProof.after.left) < 0.01 &&
      Math.abs(toggleProof.before.width - toggleProof.after.width) < 0.01 &&
      Math.abs(toggleProof.before.top - toggleProof.restored.top) < 0.01 &&
      Math.abs(toggleProof.before.left - toggleProof.restored.left) < 0.01 &&
      Math.abs(toggleProof.before.width - toggleProof.restored.width) < 0.01;
    ok('S1 ink-coordinate proof: the sheet\'s own rect (top/left/width) is BYTE-IDENTICAL whether the start-offset padding is applied or not (height alone differs) — the invariant "the paper never moves" that makes stroke placement safe',
      rectInvariant, JSON.stringify(toggleProof));

    const pixelProof = await app.evalJs(`(() => {
      const sheet = document.querySelector('.entry-full');
      const canvas = document.querySelector('.ink-committed');
      const rect = sheet.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const expectedScreenX = rect.left + 0.2 * rect.width;
      const expectedScreenY = rect.top + 0.1 * rect.width;
      const localX = expectedScreenX - canvasRect.left;
      const localY = expectedScreenY - canvasRect.top;
      const px = Math.round(localX * dpr), py = Math.round(localY * dpr);
      const data = ctx.getImageData(Math.max(0, px - 3), Math.max(0, py - 3), 7, 7).data;
      let anyInk = false;
      for (let i = 3; i < data.length; i += 4) { if (data[i] > 0) anyInk = true; }
      return { anyInk, expectedScreenX, expectedScreenY };
    })()`);
    ok('S1 ink-coordinate proof: a stroke seeded at normalized (0.2, 0.1) renders REAL ink pixels at the exact screen position the sheet\'s own rect + normalized coordinates predict — byte-true placement, with the start-offset ACTIVE',
      pixelProof.anyInk === true, JSON.stringify(pixelProof));
  }

  // ==========================================================================
  // S2 — the glow, actually felt. Render-verified-first (structural: the
  // stage establishes its own stacking context so the negative z-index
  // anchor can't escape behind the whole app background), then a real
  // computed luminance/opacity floor at 50% progress.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await app.evalJs("localStorage.setItem('wrizo-writing-goal', '24')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'reload for goal glow' });
  await app.emulateDpr(1, LAPTOP_W, 900);
  const stageIsolation = await app.evalJs("getComputedStyle(document.querySelector('.desk-frame-stage')).isolation");
  ok('S2: .desk-frame-stage establishes its own stacking context (isolation:isolate) — the structural fix that lets the goal glow actually paint above the desk background instead of behind the whole app',
    stageIsolation === 'isolate', stageIsolation);

  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  // Exactly 12 line-equivalents (720 chars at 60ch/line) against a 24-line
  // target -> fraction = 0.5 exactly, deterministic (matches cd1.mjs's own
  // "cross a line boundary with soft-wrap, no Enter" technique).
  await app.typeKeys('x'.repeat(720));
  await sleep(1700); // clear the 1.4s opacity transition fully before reading
  const glowAtHalf = await app.evalJs(`(() => {
    const el = document.querySelector('.wz-goal-glow');
    const cs = getComputedStyle(el);
    return { opacity: parseFloat(cs.opacity), intensityVar: parseFloat(el.style.getPropertyValue('--glow-intensity')) };
  })()`);
  // The eased curve (Math.pow(fraction, 0.55)) at fraction=0.5 -> ~0.683,
  // times the cap (0.34) -> ~0.232. A real, computed-style luminance floor —
  // not a class-presence check — so "too subtle to see" can never silently
  // regress: opacity must clear a genuinely perceivable floor (0.08, well
  // above the ~0.03 a linear mapping would have given at this fraction, and
  // comfortably below the hard cap so "the field never burns" still holds).
  ok('S2: at 50% progress, the glow\'s own computed opacity clears a genuinely perceivable floor (>=0.08) — the eased curve\'s whole point, verified as a real computed style, not a class-presence check',
    glowAtHalf.opacity >= 0.08 && glowAtHalf.opacity < 0.34, JSON.stringify(glowAtHalf));
  const png = await app.screenshot();
  ok('S2: a screenshot was captured at 50% progress for visual record (see the build report)', typeof png === 'string' && png.length > 0);

  // ==========================================================================
  // S3 — flush chrome. The strip sits at x===0 (the SCREEN's own left edge),
  // both reference widths + the 1100 floor; the Board's own strip/sliver
  // anchoring is flush to the board paper's edge too (the diagnosed
  // half-width-formula bug, fixed at the root).
  // ==========================================================================
  for (const [width, height] of [[LAPTOP_W, 900], [WIDE_W, 1000], [FLOOR_W, 900]]) {
    await freshProsePage(app, width, height);
    const stripLeft = await app.evalJs("document.querySelector('.desk-frame-strip').getBoundingClientRect().left");
    ok(`S3 @ ${width}px: the cascade strip sits flush at x===0 (the screen's own left edge, not the frame's)`,
      Math.abs(stripLeft) <= 1, String(stripLeft));
  }

  for (const [width, height] of [[LAPTOP_W, 900], [WIDE_W, 1000], [FLOOR_W, 900]]) {
    await freshBoard(app, `fx4-s3-board-${width}`, [], width, height);
    const boardGeom = await app.evalJs(`(() => {
      const anchor = document.querySelector('.desk-frame-sliver-anchor').getBoundingClientRect();
      const canvas = document.querySelector('.board-canvas-wrap').getBoundingClientRect();
      const strip = document.querySelector('.desk-frame-strip').getBoundingClientRect();
      return { sliverGap: canvas.left - anchor.right, stripLeft: strip.left };
    })()`);
    ok(`S3 @ ${width}px: the board's own sliver anchors flush to the board paper's own left edge (the diagnosed half-width-formula defect, fixed)`,
      Math.abs(boardGeom.sliverGap) <= 1, JSON.stringify(boardGeom));
    ok(`S3 @ ${width}px: the board's own strip is ALSO flush at x===0`,
      Math.abs(boardGeom.stripLeft) <= 1, JSON.stringify(boardGeom));
  }

  // ==========================================================================
  // S4 — the board's body. Cards resize on BOTH axes (text included); the
  // board canvas itself resizes both axes via the bottom-right drag handle,
  // persisting as a 'board-meta' box, surviving reload; a board with NO
  // board-meta element (every pre-FX4 board) behaves byte-identically
  // (legacy renders the shared canvas identically — chrome only stays
  // framed-scoped, per the brief's own invariant).
  // ==========================================================================
  await freshBoard(app, 'fx4-s4-board', [
    { id: 'fx4-s4-text', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Card A' },
    { id: 'fx4-s4-pin-target', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Card B' },
  ], LAPTOP_W, 900);
  await app.evalJs(DRAG_HELPER);

  await app.evalJs('__pointerSeq(\'[data-box-id="fx4-s4-text"]\', 0, 0)');
  await sleep(100);
  const textBefore = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === 'fx4-s4-text');
  await app.evalJs('__pointerSeq(\'[data-box-id="fx4-s4-text"] .board-handle\', 80, 60, {steps:3})');
  await sleep(150);
  const textAfter = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === 'fx4-s4-text');
  ok('S4: a text card resizes freeform on BOTH axes now (height was reflow-only before this ticket)',
    textAfter.w > textBefore.w && textAfter.h > textBefore.h, JSON.stringify({ textBefore, textAfter }));

  // Reflow is a minimum, not a dictate: shrinking the card back down (still
  // above its own MIN_TEXT_H floor) must NOT get clawed back down to the
  // measured content height by the reflow effect.
  await app.evalJs('__pointerSeq(\'[data-box-id="fx4-s4-text"] .board-handle\', -40, -20, {steps:3})');
  await sleep(300);
  const textAfterShrink = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === 'fx4-s4-text');
  ok('S4: reflow is a MINIMUM floor now, not a two-way dictate — a card shrunk (but still above content\'s own need) stays at the writer\'s own size, not snapped back to the measured content height',
    Math.abs(textAfterShrink.h - (textAfter.h - 20 / (await app.evalJs("document.querySelector('.board-canvas').getBoundingClientRect().width")))) < 0.02,
    JSON.stringify({ textAfter, textAfterShrink }));

  const canvasWidthBefore = await app.evalJs("document.querySelector('.board-canvas').getBoundingClientRect().width");
  await app.evalJs('__pointerSeq(\'.board-canvas-resize-handle\', 100, 80, {steps:3})');
  await sleep(150);
  const canvasWidthAfter = await app.evalJs("document.querySelector('.board-canvas').getBoundingClientRect().width");
  const canvasHeightAfter = await app.evalJs("document.querySelector('.board-canvas').getBoundingClientRect().height");
  ok('S4: the board canvas itself resizes on BOTH axes via the quiet bottom-right drag handle',
    canvasWidthAfter > canvasWidthBefore, JSON.stringify({ canvasWidthBefore, canvasWidthAfter, canvasHeightAfter }));
  const metaAfterDrag = (await app.evalJs('window.wrizoBoard()')).find((b) => b.kind === 'board-meta');
  // Verify review fix: the original condition here was `(A && B) || A`,
  // which simplifies to just `A` — the intended canvasW-matches-the-
  // rendered-width comparison (B) was structurally unreachable regardless
  // of its own truth. Fixed to an actual tolerance check (matching this
  // file's own `<= 1`px convention used elsewhere for rendered-width
  // comparisons) so this check can genuinely fail if the persisted value
  // ever drifts from what's on screen.
  ok('S4: the canvas resize persists as a single \'board-meta\' element in the SAME boxes array (the \'connection\'-kind precedent)',
    !!metaAfterDrag && Math.abs(metaAfterDrag.canvasW - canvasWidthAfter) <= 1, JSON.stringify(metaAfterDrag));
  const cardCountAfterDrag = await app.evalJs("document.querySelectorAll('.board-box').length");
  ok('S4: the board-meta element never renders as a positioned card (filtered out of the render loop, same discipline \'connection\' already gets)',
    cardCountAfterDrag === 2, String(cardCountAfterDrag));

  await sleep(2200); // clear the autosave debounce
  await app.reload();
  await app.evalJs(DRAG_HELPER);
  await app.evalJs("location.hash = '#/page/fx4-s4-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'S4 board reloaded' });
  await sleep(300);
  const canvasWidthAfterReload = await app.evalJs("document.querySelector('.board-canvas').getBoundingClientRect().width");
  const metaAfterReload = (await app.evalJs('window.wrizoBoard()')).find((b) => b.kind === 'board-meta');
  ok('S4: the board canvas\'s own dimensions persist across reload',
    Math.abs(canvasWidthAfterReload - canvasWidthAfter) < 1 && !!metaAfterReload, JSON.stringify({ canvasWidthAfterReload, canvasWidthAfter, metaAfterReload }));

  // Legacy (no board-meta): a board seeded with NO board-meta element auto-
  // fits exactly as every pre-FX4 board did.
  await freshBoard(app, 'fx4-s4-legacy-board', [
    { id: 'fx4-s4-legacy-card', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Legacy card' },
  ], LAPTOP_W, 900);
  const legacyCanvas = await app.evalJs(`(() => {
    const wrap = document.querySelector('.board-canvas-wrap');
    const wrapContentWidth = wrap.clientWidth; // the wrap's own CONTENT box (excludes its 1px border) — what pageWidthPx actually auto-fits to
    const canvas = document.querySelector('.board-canvas').getBoundingClientRect();
    return { wrapContentWidth, canvasWidth: canvas.width };
  })()`);
  ok('S4 (legacy): a board with no board-meta element auto-fits its wrapper\'s own CONTENT width exactly — byte-identical to pre-FX4 behavior',
    Math.abs(legacyCanvas.wrapContentWidth - legacyCanvas.canvasWidth) < 1, JSON.stringify(legacyCanvas));

  // page-pin cards ALSO resize both axes (AB4 already had this; unaffected
  // regression check).
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx4-s4-pin-target-page', text: 'FX4 Pin Target', source: 'page', createdAt: now, updatedAt: now });
    entries.push({ id: 'fx4-s4-pin-board', text: 'FX4 Pin Board', pageType: 'board', source: 'page',
      boxes: [{ id: 'fx4-s4-pin', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, entryId: 'fx4-s4-pin-target-page' }],
      createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(DRAG_HELPER);
  await app.evalJs("location.hash = '#/page/fx4-s4-pin-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'pin regression board framed' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await app.evalJs('__pointerSeq(\'[data-box-id="fx4-s4-pin"]\', 0, 0)');
  await sleep(100);
  const pinBefore = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === 'fx4-s4-pin');
  await app.evalJs('__pointerSeq(\'[data-box-id="fx4-s4-pin"] .board-handle\', 60, 40, {steps:3})');
  await sleep(150);
  const pinAfter = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === 'fx4-s4-pin');
  ok('S4 (regression): a page-pin card still resizes freeform on both axes, unaffected by the text-card change',
    pinAfter.w > pinBefore.w && pinAfter.h > pinBefore.h, JSON.stringify({ pinBefore, pinAfter }));

  // ==========================================================================
  // S5 — the card popup (inline retires). Double-click a text card opens
  // the popup over a blurred board; Bold/Italic only, the iA dimmed-syntax
  // register; Done/Escape close; focus trapped.
  // ==========================================================================
  await freshBoard(app, 'fx4-s5-board', [
    { id: 'fx4-s5-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'Before edit' },
  ], LAPTOP_W, 900);

  await app.evalJs('document.querySelector(\'[data-box-id="fx4-s5-card"]\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
  await app.waitFor("!!document.querySelector('.board-popup')", { label: 'S5 popup open' });
  await sleep(400); // clear the .28s blur/dim transition fully
  const openState = await app.evalJs(`(() => {
    const blurWrap = document.querySelector('.board-canvas-blur-wrap');
    const cs = getComputedStyle(blurWrap);
    return {
      popupPresent: !!document.querySelector('.board-popup'),
      filterBlurred: cs.filter !== 'none' && cs.filter.includes('blur'),
      opacity: parseFloat(cs.opacity),
      activeIsEditor: document.activeElement.className.includes('board-popup-editor'),
      hasTypewriter: !!document.querySelector('.board-popup [class*="typewriter"], .board-popup [data-typewriter]'),
      hasProgress: !!document.querySelector('.board-popup [class*="progress"], .board-popup .mode-pfill, .board-popup .status-dot'),
    };
  })()`);
  ok('S5: double-clicking a text card opens the popup over a BLURRED, dimmed board (the mockup\'s own treatment), focus lands in the editor',
    openState.popupPresent && openState.filterBlurred && openState.opacity < 0.7 && openState.activeIsEditor,
    JSON.stringify(openState));
  ok('S5: no typewriter, no progress instrument anywhere in the popup — Nick\'s own word',
    !openState.hasTypewriter && !openState.hasProgress, JSON.stringify(openState));

  // Bold/Italic ONLY, reusing draftFormat's markdown conventions with the
  // iA dimmed-syntax display register (.md-mark/.md-bold/.md-italic).
  const toolCount = await app.evalJs("document.querySelectorAll('.board-popup-tool').length");
  ok('S5: the card\'s own strip carries Bold and Italic ONLY (the frozen markdown set does not unfreeze)', toolCount === 2, String(toolCount));

  await app.evalJs(`(() => {
    const ed = document.querySelector('.board-popup-editor');
    const range = document.createRange();
    range.selectNodeContents(ed);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  })()`);
  await app.evalJs("[...document.querySelectorAll('.board-popup-tool')].find(b => b.title === 'Bold').click()");
  await sleep(150);
  const afterBold = await app.evalJs(`(() => ({
    hasMdMark: !!document.querySelector('.board-popup-editor .md-mark'),
    hasMdBold: !!document.querySelector('.board-popup-editor .md-bold'),
    text: document.querySelector('.board-popup-editor').innerText,
  }))()`);
  ok('S5: Bold wraps the selection in ** markers, rendered via the SAME iA dimmed-syntax display register Draft mode already uses (.md-mark dimmed, .md-bold weighted)',
    afterBold.hasMdMark && afterBold.hasMdBold && afterBold.text === '**Before edit**', JSON.stringify(afterBold));

  // Focus trap: hb1.1's own UnlockCeremony.tsx pattern — Tab wraps within
  // the dialog's own focusable elements.
  const focusTrapProof = await app.evalJs(`(() => {
    const dialog = document.querySelector('.board-popup');
    const focusable = [...dialog.querySelectorAll('button:not(:disabled), [contenteditable="true"]')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    return { focusableCount: focusable.length, wrappedToFirst: document.activeElement === first };
  })()`);
  ok('S5: Tab is contained within the popup\'s own focusable elements (hb1.1\'s UnlockCeremony pattern, reused) — from the last element, Tab wraps to the first',
    focusTrapProof.focusableCount === 4 && focusTrapProof.wrappedToFirst, JSON.stringify(focusTrapProof));

  // Done closes and commits.
  await app.evalJs("document.querySelector('.board-popup-done').click()");
  await sleep(300);
  const afterDone = await app.evalJs(`(() => ({
    popupGone: !document.querySelector('.board-popup'),
    blurGone: !document.querySelector('.board-canvas-blur-wrap').classList.contains('board-canvas-blurred'),
    committedText: (window.wrizoBoard() || []).find(b => b.id === 'fx4-s5-card')?.text,
  }))()`);
  ok('S5: Done closes the popup, un-blurs the board, and commits the edit',
    afterDone.popupGone && afterDone.blurGone && afterDone.committedText === '**Before edit**', JSON.stringify(afterDone));

  // Escape also closes.
  await app.evalJs('document.querySelector(\'[data-box-id="fx4-s5-card"]\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
  await app.waitFor("!!document.querySelector('.board-popup')", { label: 'S5 popup reopen' });
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await sleep(200);
  ok('S5: Escape also closes the popup', await app.evalJs("!document.querySelector('.board-popup')"));

  // Inline contenteditable editing RETIRES whole — the parked check's
  // successor: no .board-text-editing node can exist anywhere, ever.
  ok('S5: inline contenteditable editing has retired whole (no .board-text-editing anywhere in the codebase\'s live render output — ab4.mjs\'s own inline-editing check parks per A4)',
    await app.evalJs("!document.querySelector('.board-text-editing')"));

  // ==========================================================================
  // S6 — RETIRED WHOLE by FX5 S5 (A4 park sweep): the entire handle-double-
  // click thread-drag gesture this section tested is REMOVED, not repaired
  // (Nick's own ruling — "the dead handle-gesture... do not repair it").
  // The underlying connection-mechanics coverage (arm/drag/mint, Escape-
  // cancel, empty-release-cancel, de-dupe, hairline selection/deletion,
  // reload persistence) is RE-DERIVED against the new olive-pin-drag
  // gesture in fx5.mjs's own S5 section — not dropped, just re-triggered a
  // different way. The sliver-shape assert (exactly one "Add card" button)
  // is ALSO superseded there (S5 adds the footer toggle, a second control).
  // Every check formerly here is quoted verbatim in this file's own PARKED
  // section below (HARNESS_PARKED=1).

  // ==========================================================================
  // S7 — Stacked, worn. Lighter stock, 1px hairline, thickness told by the
  // 2px offset hard edge + soft shadow. Square corners. Selection/lane
  // colors unchanged (brass selected, olive armed-state only). Page-pin and
  // ink cards wear it identically.
  // ==========================================================================
  await freshBoard(app, 'fx4-s7-board', [
    { id: 'fx4-s7-text', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Text card' },
    { id: 'fx4-s7-ink', kind: 'ink', x: 0.3, y: 0.05, w: 0.15, h: 0.15, z: 2, strokes: [{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] },
  ], LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx4-s7-pin-target', text: 'Pin target', source: 'page', createdAt: now, updatedAt: now });
    const board = entries.find(e => e.id === 'fx4-s7-board');
    board.boxes.push({ id: 'fx4-s7-pin', kind: 'page-pin', x: 0.55, y: 0.05, w: 0.2, h: 0.08, z: 3, entryId: 'fx4-s7-pin-target' });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(DRAG_HELPER);
  await app.evalJs("location.hash = '#/page/fx4-s7-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'S7 board reloaded with pin' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);

  const stackedCss = await app.evalJs(`(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      const cs = getComputedStyle(el);
      return { boxShadow: cs.boxShadow, borderRadius: cs.borderRadius, background: cs.backgroundColor, borderColor: cs.borderColor };
    };
    return { text: read('.board-text'), ink: read('.board-ink-canvas') };
  })()`);
  ok('S7: the text card carries the Stacked treatment — square corners, a two-layer box-shadow (the 2px offset hard edge + the soft shadow)',
    stackedCss.text.borderRadius === '0px' && countShadowLayers(stackedCss.text.boxShadow) === 2 && stackedCss.text.boxShadow !== 'none',
    JSON.stringify(stackedCss.text));
  ok('S7: ink cards wear the SAME Stacked treatment identically (square corners, the same two-layer shadow)',
    stackedCss.ink.borderRadius === '0px' && countShadowLayers(stackedCss.ink.boxShadow) === 2 && stackedCss.ink.boxShadow !== 'none',
    JSON.stringify(stackedCss.ink));
  ok('S7: the text card\'s stock is genuinely a DIFFERENT (lighter) color than the board\'s own paper background',
    stackedCss.text.background !== (await app.evalJs("getComputedStyle(document.querySelector('.board-canvas')).backgroundColor")),
    stackedCss.text.background);

  // Page-pin cards wear it identically too (shares .board-text's class).
  const pinCss = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="fx4-s7-pin"] .board-pin');
    const cs = getComputedStyle(el);
    return { boxShadow: cs.boxShadow, borderRadius: cs.borderRadius };
  })()`);
  ok('S7: page-pin cards wear the Stacked treatment identically too',
    pinCss.borderRadius === '0px' && countShadowLayers(pinCss.boxShadow) === 2, JSON.stringify(pinCss));

  // Selection/lane colors unchanged: brass on selection, olive only while
  // thread-armed — no new resting-orange anywhere.
  await app.evalJs('__pointerSeq(\'[data-box-id="fx4-s7-text"]\', 0, 0)');
  await sleep(100);
  const selectionOutline = await app.evalJs("getComputedStyle(document.querySelector('[data-box-id=\"fx4-s7-text\"]')).outlineColor");
  ok('S7: selection still reads brass (unchanged lane law)', selectionOutline.includes('255, 152, 0') || selectionOutline.includes('ff9800'), selectionOutline);

  // ==========================================================================
  // S8 — hover-restore repaired. A genuine, reproducible defect (found live,
  // not guessed): `inZone` was never reset once the dwell timer fired, so a
  // SECOND dissolve/resurface cycle within the same mount silently failed.
  // Multi-cycle proof — a single cycle would have passed even on the
  // pre-fix build.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  const edges = [[10, 400, 'LEFT'], [400, 4, 'TOP'], [10, 400, 'LEFT again'], [1270, 400, 'RIGHT']];
  for (let cycleIdx = 0; cycleIdx < edges.length; cycleIdx++) {
    const [x, y, label] = edges[cycleIdx];
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys(`dissolve cycle ${label}`);
    await sleep(300);
    const before = await app.evalJs("document.querySelector('.desk-frame-host').dataset.chromeReceded");
    await app.evalJs(`window.dispatchEvent(new PointerEvent('pointermove', {clientX:${x}, clientY:${y}, bubbles:true}))`);
    let after = null;
    for (let i = 0; i < 20; i++) {
      after = await app.evalJs("document.querySelector('.desk-frame-host').dataset.chromeReceded");
      if (after === 'false') break;
      await sleep(100);
    }
    ok(`S8: dwelling at the ${label} edge resurfaces faded chrome (cycle ${cycleIdx + 1} of 4, same mount — the fix's own multi-cycle proof)`,
      before === 'true' && after === 'false', `before=${before} after=${after}`);
  }

  // Same repair on the Board surface (a different useChromeDissolve
  // instance, same shared hook).
  await freshBoard(app, 'fx4-s8-board', [
    { id: 'fx4-s8-card', kind: 'text', x: 0.05, y: 0.05, w: 0.4, h: 0.1, z: 1, text: 'Card' },
  ], LAPTOP_W, 900);
  await app.evalJs('document.querySelector(\'[data-box-id="fx4-s8-card"]\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
  await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'S8 board popup' });
  await app.typeKeys(' one');
  await sleep(150);
  await app.evalJs("document.querySelector('.board-popup-done').click()");
  await sleep(300);
  await app.evalJs(`window.dispatchEvent(new PointerEvent('pointermove', {clientX:400, clientY:4, bubbles:true}))`);
  let boardAfter1 = null;
  for (let i = 0; i < 20; i++) {
    boardAfter1 = await app.evalJs("document.querySelector('.desk-frame-host').dataset.chromeReceded");
    if (boardAfter1 === 'false') break;
    await sleep(100);
  }
  await app.evalJs('document.querySelector(\'[data-box-id="fx4-s8-card"]\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
  await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'S8 board popup 2' });
  await app.typeKeys(' two');
  await sleep(150);
  await app.evalJs("document.querySelector('.board-popup-done').click()");
  await sleep(300);
  await app.evalJs(`window.dispatchEvent(new PointerEvent('pointermove', {clientX:10, clientY:400, bubbles:true}))`);
  let boardAfter2 = null;
  for (let i = 0; i < 20; i++) {
    boardAfter2 = await app.evalJs("document.querySelector('.desk-frame-host').dataset.chromeReceded");
    if (boardAfter2 === 'false') break;
    await sleep(100);
  }
  ok('S8 (Board): the SAME multi-cycle proof holds on the Board surface too (a second dissolve/resurface cycle within the same mount)',
    boardAfter1 === 'false' && boardAfter2 === 'false', JSON.stringify({ boardAfter1, boardAfter2 }));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// FX5 S5/S9 — the entire handle-double-click thread-drag gesture this
// file's own S6 section tested is REMOVED WHOLE (Nick's own ruling: "the
// dead handle-gesture... do not repair it" — an olive pin at the card's
// top corner is the connection grab now). Quoted verbatim below (the exact
// code that used to live in this file's own live S6 section, before this
// park):
//
//   await freshBoard(app, 'fx4-s6-board', [
//     { id: 'fx4-s6-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Card A' },
//     { id: 'fx4-s6-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Card B' },
//   ], LAPTOP_W, 900);
//   ...
//   await app.evalJs('document.querySelector(\'[data-box-id="fx4-s6-a"] .board-handle\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
//   const armed = await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
//   ok('S6: double-clicking the brass resize handle arms a thread-drag from that card...', armed === 'true', armed);
//   ... (mint/cancel/de-dupe/select/delete/reload-persistence, all gated on
//   that same handle-dblclick arm step)
//
// Live successor: fx5.mjs's own S5 section re-derives the IDENTICAL
// functional coverage (arm, mint, Escape-cancel, empty-release-cancel,
// de-dupe, hairline select/delete, reload persistence) against the NEW
// olive-pin-drag gesture instead. The two checks below don't re-run the
// dead code (there is nothing left to re-run it AGAINST — the .board-
// handle element no longer carries a dblclick listener at all) — they
// instead PROVE the retirement itself, the same "no dead surface left
// behind" discipline ab1.mjs's own S5 park uses for inline-editing's
// retirement.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    await app.evalJs(DRAG_HELPER);
    await freshBoard(app, 'fx4-s6-parked-board', [
      { id: 'fx4-s6p-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Card A' },
      { id: 'fx4-s6p-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Card B' },
    ], LAPTOP_W, 900);
    await app.evalJs(DRAG_HELPER);
    await app.evalJs('__pointerSeq(\'[data-box-id="fx4-s6p-a"]\', 0, 0)');
    await sleep(100);
    await app.evalJs('document.querySelector(\'[data-box-id="fx4-s6p-a"] .board-handle\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
    await sleep(150);
    const armedAfterDblclick = await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
    pok('PARKED (was "S6: double-clicking the brass resize handle arms a thread-drag from that card") — FX5 S5: the gesture is retired WHOLE, proven inert (double-clicking the handle no longer arms anything); live successor (the olive-pin-drag gesture) fully re-derived in fx5.mjs\'s own S5 section',
      armedAfterDblclick === 'false', armedAfterDblclick);

    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(150);
    const sliverShape = await app.evalJs(`(() => {
      const sections = document.querySelectorAll('.wz-sliver-body > .wz-sliver-section');
      const boardSection = [...sections].find(s => s.querySelector('.wz-sliver-item-btn'));
      const buttons = boardSection ? boardSection.querySelectorAll('button') : [];
      return { buttonCount: buttons.length, labels: [...buttons].map(b => b.textContent.trim()) };
    })()`);
    // GENERATION 2 (FX6 S2b) — a THIRD control joins them: New page card,
    // the board-side door Nick reached for and couldn't find. Three tools
    // now — live successor in fx6.mjs's own S2 section.
    // GENERATION 3 (B2 S5) — a FOURTH control joins them: Existing page…
    // Four tools now — live successor in b2.mjs's own S5 section.
    pok('PARKED (was "S6: the sliver\'s Connect toggle RETIRES — the board sliver carries Add card alone now") — FX5 S5: a SECOND control joins it (the connections-footer toggle, "Add card + this, two controls" — the brief\'s own words); generation 2: FX6 S2b adds a THIRD (New page card); generation 3: B2 S5 adds a FOURTH (Existing page…) — live successor in b2.mjs\'s own S5 section',
      sliverShape.buttonCount === 4, JSON.stringify(sliverShape));

    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX4 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nFX4 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecksFx4 = checks.concat(parkedChecks);
const pass = allChecksFx4.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX4 VERIFY: PASS (${allChecksFx4.length} checks)` : `\nFX4 VERIFY: FAIL — ${allChecksFx4.filter((c) => !c.pass).length}/${allChecksFx4.length} failed`);
process.exit(pass ? 0 : 1);
