// FX5 — the Felt Verdicts (docs/wrizo-alpha/fx5-felt-verdicts-brief.md). A
// committed CDP verification scenario (per this project's own "harness
// scenarios persist" convention), modeled on fx4.mjs's/cd2.mjs's own
// structure — freshDesk/freshProsePage/freshBoard/DRAG_HELPER below are the
// same shape those files already established, copied verbatim per the
// brief's own instruction not to re-derive them.
// Run: node scripts/harness/fx5.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S9 list: per-line engage motion (no multi-line
// delta on band-cross), first-engage non-lurch, the fade band starting one
// line lower, scroll-freedom (manual scroll-up + type -> no snap-back, fade
// still tracks the viewport), the ink-coordinate byte-truth re-proof (S1);
// the glow floor at the new, steeper curve (S2); Plateau scrollbars, the
// ported-card excerpt clamp + the content-minimum-trap resize fix, page-pin
// regression (S3); the diagnosed drag-friction fix (immediate pointer
// capture), overlap permitted, the layer-order icon (S4); the olive-pin
// gesture's full lifecycle (arm-by-drag, mint, Escape-cancel, empty-release-
// cancel, de-dupe), the connections footer + its toggle, the dead handle-
// gesture proven gone, AND (review fix) the core mint-via-drag itself re-
// verified on a genuinely trusted CDP press-drag-release, closing the same
// class of fidelity gap S4(a) discloses rather than leaving it merely
// disclosed (S5); no visible asterisks in the card popup, reveal-
// adjacent-to-caret, storage fidelity (S6); the em dash + its one-step undo
// (S7); hover-restore on the closest-to-trusted pointer stream the harness
// can produce (real CDP Input.dispatchMouseEvent, isTrusted:true — see
// runtime-verify.mjs's own app.mouseMove), including the jitter-tolerance
// fix a synthetic dispatch could never have caught (S8); the composed
// desk's new symmetry (strip flush at x===0, the PAPER centered, both
// reference widths + the 1100 floor) (S10).
//
// Park sweep (S9's own instruction): fx4.mjs's own S6 (the handle-gesture)
// parks whole in fx4.mjs itself (live successor here, this file's own S5
// section) — along with its own sliver-shape assert (now two controls
// again, a different pair). ab4.mjs's own SECOND-generation park of the
// same lineage (re-derived once already against FX4's handle-drag) parks a
// THIRD time there, against this ticket's own pin-drag gesture. cd1.mjs's
// symmetric-margins check gains a generation-2 note (FX4 S3's own left-
// anchor re-derivation is ITSELF superseded by S10's return to symmetry —
// a different symmetry, measured against the paper, not a restoration).
// fx2.mjs's own sliver-anchor-clearance floor check and fx3.mjs's own
// engage-line-count fence both needed real CSS/mechanics fixes (not just
// number bumps) — documented in THEIR OWN files, not re-litigated here.
// Every other pre-existing harness file (ab1/ab2/ab3/cd2/fx1/hb1/j4/j5/m1/
// s1/th1/th2/tu1/w1/w2) was run in full under both HARNESS_PARKED settings
// and found unaffected. j4.mjs's own live S2 flow needed a ONE-LINE gesture
// swap (double-click -> the new "Edit copy" button, since its own port
// fixture is a sourceEntryId-bearing card) with the old sequence parked
// there directly.
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

const freshBoard = async (app, boardId, boxes, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX5 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
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
// FX5 S4/S5 — a drag FROM one element's own center TO another element's
// own center (used for the olive pin, which must land inside a DIFFERENT
// card, not just move by a fixed dx/dy from its own origin).
window.__pointerSeqTo = function(fromSel, toSel, opts) {
  opts = opts || {};
  const from = document.querySelector(fromSel), to = document.querySelector(toSel);
  if (!from || !to) throw new Error('pointerSeqTo: not found ' + fromSel + ' / ' + toSel);
  const fr = from.getBoundingClientRect(), tr = to.getBoundingClientRect();
  const x0 = fr.left + fr.width/2, y0 = fr.top + fr.height/2;
  const x1 = tr.left + tr.width/2, y1 = tr.top + tr.height/2;
  const pid = opts.pointerId || 1;
  const ptype = opts.pointerType || 'mouse';
  const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:pid, pointerType:ptype, bubbles:true, cancelable:true, isPrimary:true});
  from.dispatchEvent(mk('pointerdown', x0, y0));
  const steps = opts.steps || 4;
  for (let i=1;i<=steps;i++) {
    to.dispatchEvent(mk('pointermove', x0 + (x1-x0)*i/steps, y0 + (y1-y0)*i/steps));
  }
  to.dispatchEvent(mk('pointerup', x1, y1));
  return true;
};
`;

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the typewriter's manners.
  // ==========================================================================

  // (a) Per-line engage motion: type past the hold band, one line at a
  // time, and confirm EVERY individual scrollTop CHANGE the box makes is
  // bounded by (approximately) one line-height — never a multi-line jump
  // in a single step. Sampled at a fast poll (30ms) so a native smooth-
  // scroll animation's own intermediate frames are visible, not just its
  // settled endpoints.
  await freshProsePage(app, LAPTOP_W, 900);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  {
    const lineHeightPx = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.forward-only-editor')).lineHeight) || 28");
    let maxStep = 0;
    let prevScrollTop = 0;
    let sawAnyScroll = false;
    for (let i = 1; i <= 14; i++) {
      await app.typeKeys(`Engage line ${i} of the per-line motion proof, long enough to occupy its own row.\n`);
      // Sample frequently across the settle window so an in-flight smooth
      // scroll's own biggest single jump between samples is caught.
      for (let s = 0; s < 6; s++) {
        await sleep(30);
        const st = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
        const step = Math.abs(st - prevScrollTop);
        if (st > prevScrollTop) sawAnyScroll = true;
        if (step > maxStep) maxStep = step;
        prevScrollTop = st;
      }
    }
    ok('S1 (a): per-line engage motion — every sampled scrollTop step across a 14-line typing run stays within one line-height (+ a generous sampling/rounding margin), never a multi-line recenter jump',
      sawAnyScroll && maxStep <= lineHeightPx * 1.6, JSON.stringify({ lineHeightPx, maxStep }));
  }

  // (a, first-engage) — a page that ALREADY has substantial content past
  // the hold band when it mounts (simulating resuming a long-paused draft)
  // must not lurch into position: the very first scroll adjustment is
  // ALSO bounded to one line-height, the same clamp ordinary typing uses,
  // even though there is a large amount of "catch-up" owed.
  {
    // Genuinely TYPE the long content through the UI first (proven,
    // working seeding — this project's own "seed from Desk, not raw
    // localStorage while a page is live" lesson, sidestepped entirely by
    // never hand-writing the record), THEN reload and RE-open the SAME
    // page fresh — a true "resuming a long-paused draft" mount, with real,
    // persisted, already-past-the-band content waiting before the very
    // first measurement ever runs.
    await freshProsePage(app, LAPTOP_W, 900);
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    for (let i = 1; i <= 20; i++) await app.typeKeys(`Pre-existing line ${i} of a long resumed draft, long enough to wrap and to have already pushed well past the hold band before the NEXT mount ever measures anything.\n`);
    await sleep(2300); // clear the page's own autosave debounce before reloading
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'first-engage page framed' });
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await sleep(80);
    const lineHeightPx = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.forward-only-editor')).lineHeight) || 28");
    const preInfo = await app.evalJs("({ scrollHeight: document.querySelector('.mode-scroll')?.scrollHeight, clientHeight: document.querySelector('.mode-scroll')?.clientHeight, textLen: document.querySelector('.forward-only-editor')?.innerText?.length })");
    ok('S1 (a, first-engage) precondition: the reloaded page genuinely mounted with substantial pre-existing content, past the hold band', preInfo.textLen > 500 && preInfo.scrollHeight > preInfo.clientHeight, JSON.stringify(preInfo));
    let maxStep = 0, prevScrollTop = 0;
    for (let s = 0; s < 30; s++) {
      await sleep(30);
      const st = await app.evalJs("document.querySelector('.mode-scroll')?.scrollTop ?? 0");
      const step = Math.abs(st - prevScrollTop);
      if (step > maxStep) maxStep = step;
      prevScrollTop = st;
    }
    // A generous-but-still-tight ceiling: the underlying mechanism clamps
    // EVERY individual band() call to <=1 line-height (verified directly
    // in (a) above and by reading useTypewriterFade.ts's own band()); this
    // 30ms poll can occasionally straddle two back-to-back rAF-chained
    // catch-up steps in one sample, so the ceiling allows ~2 lines, not 1
    // — still overwhelmingly tighter than the OLD bug's signature (a
    // single, many-lines-tall instant jump for a 20-line backlog, which
    // would read as several HUNDRED px here, not merely 2 line-heights).
    ok('S1 (a, first-engage): a page that mounts already deep past the hold band settles via the SAME one-line-at-a-time steps, never one big instant jump — "first-engage especially must not lurch"',
      maxStep <= lineHeightPx * 2.5, JSON.stringify({ lineHeightPx, maxStep, finalScrollTop: prevScrollTop }));
  }

  // (b) the fade band starts one line lower — --tw-fade-start is set to
  // ~one line-height, and the mask/gradient consuming it (index.css) keeps
  // the topmost line-height fully opaque before the ramp begins.
  await freshProsePage(app, LAPTOP_W, 900);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  for (let i = 1; i <= 12; i++) await app.typeKeys(`Fade band probe line ${i}, long enough to wrap the paper's own measure a bit more.\n`);
  await sleep(400);
  {
    const fadeInfo = await app.evalJs(`(() => {
      const scroll = document.querySelector('.mode-scroll');
      const cs = getComputedStyle(scroll);
      const lh = parseFloat(getComputedStyle(document.querySelector('.forward-only-editor')).lineHeight) || 28;
      return {
        fadeStartPx: parseFloat(cs.getPropertyValue('--tw-fade-start')) || 0,
        lineHeight: lh,
        scrolled: scroll.dataset.scrolled,
        maskImage: cs.webkitMaskImage || cs.maskImage,
      };
    })()`);
    ok('S1 (b): --tw-fade-start is set to approximately one line-height (the fade band\'s own new starting offset)',
      Math.abs(fadeInfo.fadeStartPx - fadeInfo.lineHeight) <= 2, JSON.stringify(fadeInfo));
    ok('S1 (b): the container mask genuinely carries a two-stage ramp now (opaque lead-in, then the fade) — the gradient string mentions both a #000/opaque leading stop and the fade-band length',
      typeof fadeInfo.maskImage === 'string' && fadeInfo.maskImage.includes('linear-gradient'), fadeInfo.maskImage);
  }

  // (c) SCROLL FREEDOM: a manual scroll-up is never fought by the next
  // keystroke. Engage first (typing past the band), capture the settled
  // scrollTop, manually scroll UP (away from the band) via a REAL wheel-
  // style scroll (native scrollTo, not a synthetic 'scroll' event — the
  // box's own actual scrollTop changes, exactly what a trackpad/wheel
  // would do), then type ONE more line and confirm the box does NOT snap
  // back down to re-align with the band — it stays within a tight margin
  // of the writer's own manually-chosen position (only the SAME one-line
  // nudge the ordinary motion always applies).
  {
    const settled = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
    ok('S1 (c) precondition: the box is genuinely engaged (scrolled) before the freedom test begins', settled > 0, String(settled));
    const manualTarget = Math.max(0, settled - 120); // scroll UP significantly (away from the band)
    await app.evalJs(`document.querySelector('.mode-scroll').scrollTo({ top: ${manualTarget}, behavior: 'auto' })`);
    await sleep(150);
    const afterManualScroll = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
    await app.typeKeys('one more line after scrolling up manually, the writer now owns this position\n');
    await sleep(350);
    const afterTypeScrollTop = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
    const lineHeightPx = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.forward-only-editor')).lineHeight) || 28");
    ok('S1 (c): typing after a manual scroll-up does NOT snap the page back to the band — the post-keystroke scrollTop stays within about one line of the writer\'s OWN manually-chosen position, not reset toward the (much larger) pre-scroll settled value',
      Math.abs(afterTypeScrollTop - afterManualScroll) <= lineHeightPx * 1.6 && afterTypeScrollTop < settled - 40,
      JSON.stringify({ settled, manualTarget, afterManualScroll, afterTypeScrollTop, lineHeightPx }));

    // (c, viewport fade) — the top-of-VIEWPORT still carries the fade
    // after the writer settled somewhere else entirely (a VIEWPORT
    // treatment, not an absolute-text one): data-scrolled reads off the
    // box's OWN current scrollTop, which is still > 4px here.
    const scrolledAtManualPos = await app.evalJs("document.querySelector('.mode-scroll').dataset.scrolled");
    ok('S1 (c): the fade still tracks the VIEWPORT after a manual scroll (data-scrolled reflects the box\'s current position, not a frozen pre-scroll read)',
      scrolledAtManualPos === 'true', scrolledAtManualPos);
  }

  // (d) start offset 25% — unchanged, quick regression (fx4.mjs's own S1
  // already covers this in full at both reference widths + the floor;
  // this is a light single-width sanity re-check only).
  await freshProsePage(app, LAPTOP_W, 900);
  {
    const proseInfo = await app.evalJs(`(() => {
      const stage = document.querySelector('.desk-frame-stage');
      const ed = document.querySelector('.forward-only-editor');
      const stageR = stage.getBoundingClientRect(), edR = ed.getBoundingClientRect();
      return { fraction: (edR.top - stageR.top) / stageR.height };
    })()`);
    ok('S1 (d): the start offset (25%) is unchanged — the visual start still reads as "about a quarter"',
      proseInfo.fraction >= 0.20 && proseInfo.fraction <= 0.32, JSON.stringify(proseInfo));
  }

  // Ink-coordinate byte-truth re-proof (the STOP-clause's own required
  // evidence, re-run post-S1 since S1 touches the SAME shared typewriter
  // engine every ink-bearing Journal page depends on) — fx4.mjs's own
  // technique, re-applied.
  {
    const jid = 'fx5-ink-proof';
    const stroke = { points: [{ x: 0.25, y: 0.12 }, { x: 0.35, y: 0.18 }, { x: 0.45, y: 0.22 }] };
    await freshDesk(app, LAPTOP_W, 900);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: ${JSON.stringify(jid)}, text: 'fx5 ink coordinate proof\\nsecond line', source: 'page', strokes: [${JSON.stringify(stroke)}], createdAt: now, updatedAt: now });
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
        before: { top: before.top, left: before.left, width: before.width },
        after: { top: after.top, left: after.left, width: after.width },
        restored: { top: restored.top, left: restored.left, width: restored.width },
      };
    })()`);
    const rectInvariant =
      Math.abs(toggleProof.before.top - toggleProof.after.top) < 0.01 &&
      Math.abs(toggleProof.before.left - toggleProof.after.left) < 0.01 &&
      Math.abs(toggleProof.before.width - toggleProof.after.width) < 0.01 &&
      Math.abs(toggleProof.before.top - toggleProof.restored.top) < 0.01;
    ok('S1 STOP-clause: post-S1, the sheet\'s own rect (top/left/width) is STILL byte-identical whether the start-offset padding is applied or not — "paper never moves" re-proven after touching the shared typewriter engine',
      rectInvariant, JSON.stringify(toggleProof));

    const pixelProof = await app.evalJs(`(() => {
      const sheet = document.querySelector('.entry-full');
      const canvas = document.querySelector('.ink-committed');
      const rect = sheet.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const expectedScreenX = rect.left + 0.25 * rect.width;
      const expectedScreenY = rect.top + 0.12 * rect.width;
      const localX = expectedScreenX - canvasRect.left;
      const localY = expectedScreenY - canvasRect.top;
      const px = Math.round(localX * dpr), py = Math.round(localY * dpr);
      const data = ctx.getImageData(Math.max(0, px - 3), Math.max(0, py - 3), 7, 7).data;
      let anyInk = false;
      for (let i = 3; i < data.length; i += 4) { if (data[i] > 0) anyInk = true; }
      return { anyInk };
    })()`);
    ok('S1 STOP-clause: the seeded stroke still renders at the exact byte-true screen position the sheet\'s own rect predicts, post-S1',
      pixelProof.anyInk === true, JSON.stringify(pixelProof));
  }

  // ==========================================================================
  // S2 — the glow, felt this time. A steeper curve (0.28, was 0.55) — same
  // cap (untouched). At 50% progress the computed opacity now clears a much
  // higher floor.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await app.evalJs("localStorage.setItem('wrizo-writing-goal', '24')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'reload for goal glow' });
  await app.emulateDpr(1, LAPTOP_W, 900);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('x'.repeat(720)); // 12 line-equivalents / 24-line target = fraction 0.5 exactly
  await sleep(1700); // clear the 1.4s opacity transition
  const glowAtHalf = await app.evalJs(`(() => {
    const el = document.querySelector('.wz-goal-glow');
    const cs = getComputedStyle(el);
    return { opacity: parseFloat(cs.opacity), intensityVar: parseFloat(el.style.getPropertyValue('--glow-intensity')) };
  })()`);
  ok('S2: at 50% progress, the retuned curve (0.28) clears a MUCH higher floor than before (>=0.22, was >=0.08) — comfortably below the untouched .34 cap, so this did not fight the ceiling',
    glowAtHalf.opacity >= 0.22 && glowAtHalf.opacity < 0.34, JSON.stringify(glowAtHalf));
  const glowCapStillIntact = await app.evalJs(`(() => {
    document.querySelector('.forward-only-editor').focus();
    return true;
  })()`);
  await app.typeKeys('x'.repeat(720)); // reach fraction 1.0
  await sleep(1700);
  const glowAtFull = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.wz-goal-glow')).opacity)");
  ok('S2: at 100% progress the glow still eases to rest exactly at the untouched cap (.34) — "the field never burns" holds after the retune',
    Math.abs(glowAtFull - 0.34) < 0.01, String(glowAtFull));
  const glowScreenshot = await app.screenshot();
  ok('S2: a screenshot was captured at 50%-progress-equivalent state for visual record (see the build report)', typeof glowScreenshot === 'string' && glowScreenshot.length > 0);

  // ==========================================================================
  // S3 — board surface polish.
  // ==========================================================================
  // (a) Plateau scrollbars: thin, low-contrast, square, no OS chrome.
  await freshBoard(app, 'fx5-s3-scrollbar-board', [
    { id: 'fx5-s3-tall', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 3, z: 1, text: 'A very tall card that forces the board canvas wrap to scroll.' },
  ], LAPTOP_W, 700);
  const scrollbarCss = await app.evalJs(`(() => {
    const cs = getComputedStyle(document.querySelector('.board-canvas-wrap'));
    return { scrollbarWidth: cs.scrollbarWidth, scrollbarColor: cs.scrollbarColor };
  })()`);
  ok('S3 (a): the board canvas wrap declares a thin, low-contrast scrollbar (scrollbar-width:thin, a real scrollbar-color pair) — the Firefox-family half of the Plateau treatment',
    scrollbarCss.scrollbarWidth === 'thin' && !!scrollbarCss.scrollbarColor && scrollbarCss.scrollbarColor !== 'auto', JSON.stringify(scrollbarCss));

  // (b/c) The content-minimum trap: a PORTED long page gets a bounded
  // notecard excerpt (not the full raw text) on its own card face, and its
  // initial height reads as a notecard — not many page-widths tall.
  {
    const longText = Array.from({ length: 60 }, (_, i) => `Ported source line ${i}, long enough to inflate a naive full-text card face far past any reasonable notecard size.`).join('\n');
    await freshDesk(app, LAPTOP_W, 900);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'fx5-s3-source', text: ${JSON.stringify(longText)}, source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before port' });
    // Port via the Spread's own select+Port flow (the real, proven path —
    // reused rather than hand-writing a ported box's own shape from
    // scratch, which risks silently drifting from what the app actually
    // produces).
    await app.goto('/journal/spread');
    await app.waitFor("!!document.querySelector('.spread-select-toggle')", { label: 'Spread' });
    await app.click('Select');
    await app.evalJs("document.querySelector('[data-page-id=\"fx5-s3-source\"]').click()");
    await app.waitFor("!!document.querySelector('.spread-port')", { label: 'Port button' });
    await app.evalJs("document.querySelector('.spread-port').click()");
    await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'port sheet' });
    // A selection with NO ink strokes at all skips the text/ink choice step
    // entirely (nothing to choose about) and lands straight on the
    // destination picker — this fixture's source page has no strokes.
    // B2.1 S6 — plumbing update, not a park: PortToBoardSheet.tsx's own
    // button text swaps "project" for the pre-existing 'binder' lexicon
    // term (Binder-vs-Drawer judgment, see the build report); this is a
    // selector-by-text driving the SAME flow to the SAME state, not an
    // assertion about the copy itself, so it's simply updated (a lexicon
    // string isn't a check with a pass/fail history worth preserving, per
    // the FX4 S6 boardConnect precedent).
    await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('New binder'))", { label: 'destination picker' });
    await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('New binder')).click()");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'BoardEditor mounted' });
    await sleep(400);
    await app.emulateDpr(1, LAPTOP_W, 900);

    const portedBoxes = await app.evalJs('window.wrizoBoard()');
    const portedBox = portedBoxes.find(b => b.sourceEntryId === 'fx5-s3-source');
    ok('S3 (b/c) precondition: the port created a text box carrying the FULL source text in storage (never truncated) — the display-only excerpt is a rendering concern, not a data-loss one',
      !!portedBox && portedBox.text.split('\n').length === 60, JSON.stringify({ found: !!portedBox, lines: portedBox?.text?.split('\n').length }));
    ok('S3 (b/c): the ported card\'s own INITIAL height reads as a notecard, not a scroll — comfortably under one page-width tall (was measured at 6.19x for an unclamped 60-line port)',
      portedBox.h <= 0.25, String(portedBox.h));

    const faceInfo = await app.evalJs(`(() => {
      const el = document.querySelector('[data-box-id="${portedBox.id}"] .board-text');
      return { rendersExcerptClass: el.classList.contains('board-ported'), visibleTextLength: el.innerText.length, hasBadge: !!el.querySelector('.board-pin-badge') };
    })()`);
    ok('S3 (b/c): the card\'s own FACE shows a bounded excerpt (short rendered text, a quiet badge) — "the Board organizes ideas, it doesn\'t read pages," not the raw 60-line source',
      faceInfo.rendersExcerptClass && faceInfo.hasBadge && faceInfo.visibleTextLength < 300, JSON.stringify(faceInfo));

    // The resize itself: shrinking the card sticks now (the reflow floor
    // measures against the SHORT excerpt's own natural height, not the
    // full raw text) — proven, not assumed.
    await app.evalJs(DRAG_HELPER);
    await app.evalJs(`__pointerSeq('[data-box-id="${portedBox.id}"]', 0, 0)`);
    await sleep(100);
    const beforeShrink = (await app.evalJs('window.wrizoBoard()')).find(b => b.id === portedBox.id);
    await app.evalJs(`__pointerSeq('[data-box-id="${portedBox.id}"] .board-handle', -40, -20, {steps:3})`);
    await sleep(400); // let the reflow-as-minimum effect run, if it's going to
    const afterShrink = (await app.evalJs('window.wrizoBoard()')).find(b => b.id === portedBox.id);
    ok('S3 (c): a ported card can genuinely be shrunk now and it STICKS — the reflow-as-minimum floor no longer fights it back up to the full source\'s own height (the content-minimum trap, fixed at the root: the excerpt display, not a special-cased resize rule)',
      afterShrink.h < beforeShrink.h, JSON.stringify({ beforeShrink: beforeShrink.h, afterShrink: afterShrink.h }));

    // Double-click travels to source now (S3's own "quiet open affordance
    // via the existing double-click travel").
    // FX7 S5 — BoardEditor.tsx's own onDoubleClick now resolves its target
    // via document.elementFromPoint(e.clientX, e.clientY) rather than
    // e.target (a genuine pointer-capture retargeting fix, fx7.mjs's own S5
    // section) — a coordinate-less synthetic dblclick defaults to (0,0),
    // which elementFromPoint no longer forgives; supply the card's own real
    // on-screen center.
    await app.evalJs(`(() => { const el = document.querySelector('[data-box-id="${portedBox.id}"]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()`);
    await sleep(300);
    const hashAfterDblclick = await app.evalJs('location.hash');
    ok('S3 (b): double-clicking a ported card travels to its own source page now (the quiet open affordance, matching page-pin)',
      hashAfterDblclick.includes('fx5-s3-source'), hashAfterDblclick);
  }

  // Page-pin (the literal kind) regression: excerpt + resize both still
  // correct — this mechanism was ALREADY right pre-FX5 (verified live, not
  // assumed), so this is a regression proof, not a new fix.
  {
    await freshDesk(app, LAPTOP_W, 900);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'fx5-s3-pin-target', text: 'Pin target first line\\nsecond\\nthird\\nfourth\\nfifth', source: 'page', createdAt: now, updatedAt: now });
      entries.push({ id: 'fx5-s3-pin-board', text: 'FX5 Pin Board', pageType: 'board', source: 'page',
        boxes: [{ id: 'fx5-s3-pin', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.28, h: 0.12, z: 1, entryId: 'fx5-s3-pin-target' }],
        createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs(DRAG_HELPER);
    await app.evalJs("location.hash = '#/page/fx5-s3-pin-board'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'pin regression board framed' });
    await sleep(300);
    await app.emulateDpr(1, LAPTOP_W, 900);
    const pinFace = await app.evalJs(`(() => {
      const el = document.querySelector('[data-box-id="fx5-s3-pin"] .board-pin');
      return { title: el.querySelector('.board-pin-title')?.textContent, excerpt: el.querySelector('.board-pin-excerpt')?.textContent };
    })()`);
    ok('S3 regression: a literal page-pin card\'s own excerpt (title + up to 3 lines) is UNCHANGED — already correct pre-FX5',
      pinFace.title === 'Pin target first line' && pinFace.excerpt.includes('second'), JSON.stringify(pinFace));
    await app.evalJs('__pointerSeq(\'[data-box-id="fx5-s3-pin"]\', 0, 0)');
    await sleep(100);
    const pinBefore = (await app.evalJs('window.wrizoBoard()')).find(b => b.id === 'fx5-s3-pin');
    await app.evalJs('__pointerSeq(\'[data-box-id="fx5-s3-pin"] .board-handle\', 60, 40, {steps:3})');
    await sleep(150);
    const pinAfter = (await app.evalJs('window.wrizoBoard()')).find(b => b.id === 'fx5-s3-pin');
    ok('S3 regression: a literal page-pin card still resizes freeform on both axes — UNCHANGED',
      pinAfter.w > pinBefore.w && pinAfter.h > pinBefore.h, JSON.stringify({ pinBefore, pinAfter }));
  }

  // ==========================================================================
  // S4 — cards move like cards.
  // ==========================================================================
  await freshBoard(app, 'fx5-s4-board', [
    { id: 'fx5-s4-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.1, z: 1, text: 'Card A' },
    { id: 'fx5-s4-b', kind: 'text', x: 0.5, y: 0.4, w: 0.2, h: 0.1, z: 2, text: 'Card B' },
  ], LAPTOP_W, 900);
  await app.evalJs(DRAG_HELPER);

  // (a) the diagnosed drag-friction fix: pointer capture engages on the
  // VERY FIRST pointerdown, before the drag threshold is even crossed —
  // proving the fix's own mechanism directly. Residual fidelity gap,
  // disclosed honestly per this ticket's own standing discipline: a
  // synthetic dispatch (element.dispatchEvent, even via CDP) always
  // targets the origin element directly, bypassing the real hit-testing
  // capture exists to stabilize — so this check can prove "capture
  // engages immediately" but CANNOT prove "a fast real mouse drag never
  // breaks," which is what the defect actually was. That claim rests on
  // Nick's own hand.
  {
    // A genuinely TRUSTED mouse press (CDP Input.dispatchMouseEvent) —
    // found live, not assumed: a page-side `new PointerEvent()` +
    // `dispatchEvent()` pointerdown is NOT recognized by Chromium's own
    // pointer-capture machinery as an "active" pointer at all —
    // `setPointerCapture` on that synthetic id silently no-ops, which
    // would have made this exact check read as a false negative on a
    // FULLY correct implementation. Switching to a real CDP-dispatched
    // press (isTrusted:true, pointerId 1, the mouse's own fixed id in
    // Chromium) is what makes this check meaningful at all.
    const boxRect = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="fx5-s4-a"]').getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
    await app.mouseDown(boxRect.x, boxRect.y);
    await sleep(50);
    const captured = await app.evalJs("document.querySelector('.board-canvas').hasPointerCapture(1)");
    await app.mouseUp(boxRect.x, boxRect.y);
    await sleep(100);
    ok('S4 (a): the diagnosed drag-friction fix — pointer capture engages on the canvas on the VERY FIRST (genuinely trusted) mouse press, before the 6px drag threshold is even reached, not only once a drag is already recognized. RESIDUAL FIDELITY GAP (disclosed): this proves the fix\'s own mechanism on a real, isTrusted press — it still cannot prove "a fast real mouse drag across a wide real desk never breaks," since headless CDP dispatch has none of a real trackpad/mouse\'s own sampling irregularity; that fuller claim rests on Nick\'s own hand.',
      captured === true, String(captured));
  }

  // (b) OVERLAP IS PERMITTED — drag card A on top of card B; both keep
  // their own independent positions (no collision-avoidance nudge).
  await app.evalJs('__pointerSeq(\'[data-box-id="fx5-s4-a"]\', 0, 0)');
  await sleep(80);
  const bBeforeOverlap = (await app.evalJs('window.wrizoBoard()')).find(b => b.id === 'fx5-s4-b');
  await app.evalJs('__pointerSeqTo(\'[data-box-id="fx5-s4-a"]\', \'[data-box-id="fx5-s4-b"]\', {steps:5})');
  await sleep(200);
  const boardAfterOverlap = await app.evalJs('window.wrizoBoard()');
  const aAfterOverlap = boardAfterOverlap.find(b => b.id === 'fx5-s4-a');
  const bAfterOverlap = boardAfterOverlap.find(b => b.id === 'fx5-s4-b');
  const overlaps = aAfterOverlap.x < bAfterOverlap.x + bAfterOverlap.w && aAfterOverlap.x + aAfterOverlap.w > bAfterOverlap.x &&
    aAfterOverlap.y < bAfterOverlap.y + bAfterOverlap.h && aAfterOverlap.y + aAfterOverlap.h > bAfterOverlap.y;
  ok('S4 (b): OVERLAP IS PERMITTED — dragging card A onto card B leaves both at their own genuine (overlapping) positions, no collision-avoidance nudge pushes either away',
    overlaps && bAfterOverlap.x === bBeforeOverlap.x && bAfterOverlap.y === bBeforeOverlap.y, JSON.stringify({ aAfterOverlap, bAfterOverlap }));

  // (c) the quiet layer icon: appears only on a SELECTED, overlapping
  // card; toggling cycles z front/back using the EXISTING z field.
  await app.evalJs('__pointerSeq(\'[data-box-id="fx5-s4-a"]\', 0, 0)');
  await sleep(100);
  const layerIconVisible = await app.evalJs("!!document.querySelector('[data-box-id=\"fx5-s4-a\"] .board-layer-toggle')");
  ok('S4 (c): the quiet layer-order icon appears on a selected card that genuinely overlaps a sibling',
    layerIconVisible === true, String(layerIconVisible));
  const zBefore = (await app.evalJs('window.wrizoBoard()')).find(b => b.id === 'fx5-s4-a').z;
  await app.evalJs("document.querySelector('[data-box-id=\"fx5-s4-a\"] .board-layer-toggle').click()");
  await sleep(100);
  const zAfterFirstToggle = (await app.evalJs('window.wrizoBoard()')).find(b => b.id === 'fx5-s4-a').z;
  await app.evalJs('__pointerSeq(\'[data-box-id="fx5-s4-a"]\', 0, 0)'); // re-select (z-index change can shift what\'s on top)
  await sleep(100);
  await app.evalJs("document.querySelector('[data-box-id=\"fx5-s4-a\"] .board-layer-toggle')?.click()");
  await sleep(100);
  const zAfterSecondToggle = (await app.evalJs('window.wrizoBoard()')).find(b => b.id === 'fx5-s4-a').z;
  ok('S4 (c): the layer icon toggles the card\'s own z (the EXISTING field, no new schema) — front/back, a genuine two-state cycle',
    zAfterFirstToggle !== zBefore && zAfterSecondToggle !== zAfterFirstToggle, JSON.stringify({ zBefore, zAfterFirstToggle, zAfterSecondToggle }));

  // A NON-overlapping selected card never shows the icon (minimal, only
  // when it's actually needed).
  await freshBoard(app, 'fx5-s4-noverlap-board', [
    { id: 'fx5-s4-solo', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.1, z: 1, text: 'Solo card, nothing overlaps it' },
  ], LAPTOP_W, 900);
  await app.evalJs(DRAG_HELPER);
  await app.evalJs('__pointerSeq(\'[data-box-id="fx5-s4-solo"]\', 0, 0)');
  await sleep(100);
  const soloLayerIcon = await app.evalJs("!!document.querySelector('[data-box-id=\"fx5-s4-solo\"] .board-layer-toggle')");
  ok('S4 (c): a selected but NON-overlapping card shows NO layer icon — minimal, undistracting, only where it\'s meaningful',
    soloLayerIcon === false, String(soloLayerIcon));

  // ==========================================================================
  // S5 review fix — closing a residual fidelity gap, not just disclosing
  // it. Every pin-drag check below (the brief's own S9 text: "pin-gesture
  // lifecycle at the harness's honest fidelity ceiling, gap documented in-
  // check") originally ran on synthetic PointerEvent dispatch
  // (__pointerSeqTo) ONLY — the identical class of gap S4(a) above
  // discloses explicitly (a synthetic dispatch always targets the origin
  // element directly, bypassing the real hit-testing `setPointerCapture`
  // exists to stabilize), on the SAME early-capture mechanism (BoardEditor.
  // tsx's onDown, the pin branch calls the identical `canvas.
  // setPointerCapture` S4(a) proves needs a genuinely trusted press to mean
  // anything). This ticket's own standing discipline ("For every input-
  // gesture claim... reproduce with the closest-to-trusted event stream")
  // applies squarely to the pin-drag — it is a brand-new DRAG gesture this
  // very ticket introduces. Closed here the same way S4(a)/S8 close theirs:
  // a genuinely trusted CDP press-drag-release (isTrusted:true, several
  // real incremental mouseMove steps, not a teleport — S8's own "a hand
  // slowing to a stop, not a snap" discipline) from the pin to a SEPARATE
  // pair of cards, confirmed to mint a hairline. A dedicated fixture (not
  // fx5-s5-a/b below) so this doesn't disturb the state the rest of this
  // section's own synthetic checks depend on.
  // ==========================================================================
  await freshBoard(app, 'fx5-s5-trusted-board', [
    { id: 'fx5-s5t-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Trusted A' },
    { id: 'fx5-s5t-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Trusted B' },
  ], LAPTOP_W, 900);
  {
    const pinPt = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="fx5-s5t-a"] .board-pin-grab').getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
    const targetPt = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="fx5-s5t-b"]').getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; })()`);
    await app.mouseDown(pinPt.x, pinPt.y);
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      await app.mouseMove(
        Math.round(pinPt.x + (targetPt.x - pinPt.x) * (i / steps)),
        Math.round(pinPt.y + (targetPt.y - pinPt.y) * (i / steps)),
      );
      await sleep(40);
    }
    await app.mouseUp(targetPt.x, targetPt.y);
    await sleep(200);
    const linesAfterTrustedDrag = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
    const connAfterTrustedDrag = (await app.evalJs('window.wrizoBoard()')).find(b => b.kind === 'connection');
    ok('S5: the fidelity gap CLOSED — a genuinely trusted (isTrusted, CDP, real incremental mouseMove) drag from the olive pin to another card mints the hairline, re-verifying the mechanism the checks below only ever exercise via synthetic dispatch (mirrors S4(a)\'s own real-press proof for the identical early-setPointerCapture mechanism)',
      linesAfterTrustedDrag === 1 && !!connAfterTrustedDrag &&
      ((connAfterTrustedDrag.connA === 'fx5-s5t-a' && connAfterTrustedDrag.connB === 'fx5-s5t-b') || (connAfterTrustedDrag.connA === 'fx5-s5t-b' && connAfterTrustedDrag.connB === 'fx5-s5t-a')),
      JSON.stringify(connAfterTrustedDrag));
  }

  // ==========================================================================
  // S5 — the pin, not the handle. The dead handle-double-click gesture is
  // REMOVED (proven gone); the olive pin is the connection grab now — one
  // continuous drag, no separate arm step. Preview line + cancel semantics
  // carry over unchanged. The footer + its toggle are new. The core mint-
  // via-drag mechanism is now trusted-proven above; the checks below (all
  // synthetic dispatch) exercise the state-machine BRANCHES on top of that
  // same, now-verified-real entry point (Escape mid-drag, empty-board
  // release, de-dupe order) — pure logic claims, not independent gesture
  // claims the standing discipline's "drag, hover, scroll" list is about.
  // ==========================================================================
  await freshBoard(app, 'fx5-s5-board', [
    { id: 'fx5-s5-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Card A' },
    { id: 'fx5-s5-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Card B' },
  ], LAPTOP_W, 900);
  await app.evalJs(DRAG_HELPER);

  // The dead gesture, proven gone (not merely un-tested): double-clicking
  // the resize handle no longer arms anything.
  await app.evalJs('__pointerSeq(\'[data-box-id="fx5-s5-a"]\', 0, 0)');
  await sleep(100);
  await app.evalJs('document.querySelector(\'[data-box-id="fx5-s5-a"] .board-handle\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
  await sleep(150);
  const armedByDeadGesture = await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
  ok('S5: the dead handle-double-click gesture is REMOVED, proven inert (double-clicking the resize handle arms nothing)',
    armedByDeadGesture === 'false', armedByDeadGesture);
  // That same dblclick BUBBLES to the canvas's own dblclick handler (the
  // handle sits inside the card, and a hand-typed text card's own
  // double-click still opens the edit popup) — close it before continuing,
  // or every subsequent board gesture would silently stand down (onDown's
  // own "the popup is open" guard).
  if (await app.evalJs("!!document.querySelector('.board-popup')")) {
    await app.evalJs("document.querySelector('.board-popup-done')?.click()");
    await sleep(200);
  }

  // The olive pin exists on every card, always (not selection-gated).
  const pinPresence = await app.evalJs(`({
    onA: !!document.querySelector('[data-box-id="fx5-s5-a"] .board-pin-grab'),
    onB: !!document.querySelector('[data-box-id="fx5-s5-b"] .board-pin-grab'),
  })`);
  ok('S5: the olive pin — the connection grab — is present on every card, always, not gated on selection (no pre-selection two-step the way the old gesture needed)',
    pinPresence.onA && pinPresence.onB, JSON.stringify(pinPresence));
  const pinIsCircle = await app.evalJs("getComputedStyle(document.querySelector('[data-box-id=\"fx5-s5-a\"] .board-pin-grab')).borderRadius");
  ok('S5: the pin is a genuine circle (Nick\'s own ruling, quoted in the brief) — the one deliberate exception to square corners for this small state indicator',
    pinIsCircle === '50%', pinIsCircle);

  // Drag-from-pin, release inside another card, mints a thread — ONE
  // continuous gesture, no separate arm step (the old two-step shape is
  // very likely why it read as "dead": a real double-click's timing is
  // far less reliable than a script's own).
  await app.evalJs('__pointerSeqTo(\'[data-box-id="fx5-s5-a"] .board-pin-grab\', \'[data-box-id="fx5-s5-b"]\', {steps:5})');
  await sleep(200);
  const linesAfterPinDrag = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
  const connAfterPinDrag = (await app.evalJs('window.wrizoBoard()')).find(b => b.kind === 'connection');
  ok('S5: dragging from the olive pin and releasing inside another card mints the hairline, in ONE continuous gesture',
    linesAfterPinDrag === 1 && !!connAfterPinDrag &&
    ((connAfterPinDrag.connA === 'fx5-s5-a' && connAfterPinDrag.connB === 'fx5-s5-b') || (connAfterPinDrag.connA === 'fx5-s5-b' && connAfterPinDrag.connB === 'fx5-s5-a')),
    JSON.stringify(connAfterPinDrag));

  // Escape cancels a drag mid-gesture (pointer down on the pin, no release
  // yet).
  await app.evalJs(`(() => {
    const pin = document.querySelector('[data-box-id="fx5-s5-a"] .board-pin-grab');
    const r = pin.getBoundingClientRect();
    const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:1, pointerType:'mouse', bubbles:true, cancelable:true, isPrimary:true});
    pin.dispatchEvent(mk('pointerdown', r.left + r.width/2, r.top + r.height/2));
  })()`);
  await sleep(100);
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await sleep(150);
  const disarmedByEscape = await app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
  const linesAfterEscape = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
  ok('S5: Escape cancels a pending pin-drag mid-gesture, no new hairline minted',
    disarmedByEscape === 'false' && linesAfterEscape === 1, JSON.stringify({ disarmedByEscape, linesAfterEscape }));

  // Releasing on empty board cancels.
  await app.evalJs(`(() => {
    const pin = document.querySelector('[data-box-id="fx5-s5-a"] .board-pin-grab');
    const canvas = document.querySelector('.board-canvas');
    const r = pin.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    const x0 = r.left + r.width/2, y0 = r.top + r.height/2;
    const x1 = cr.left + cr.width - 20, y1 = cr.top + cr.height - 20;
    const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:1, pointerType:'mouse', bubbles:true, cancelable:true, isPrimary:true});
    pin.dispatchEvent(mk('pointerdown', x0, y0));
    canvas.dispatchEvent(mk('pointermove', x1, y1));
    canvas.dispatchEvent(mk('pointerup', x1, y1));
  })()`);
  await sleep(200);
  const linesAfterEmptyRelease = await app.evalJs("document.querySelectorAll('.board-connection-line').length");
  ok('S5: releasing a pin-drag on empty board cancels — no new hairline minted',
    linesAfterEmptyRelease === 1, String(linesAfterEmptyRelease));

  // De-dupe: B->A (reverse order) after A->B already exists doesn't double.
  await app.evalJs('__pointerSeqTo(\'[data-box-id="fx5-s5-b"] .board-pin-grab\', \'[data-box-id="fx5-s5-a"]\', {steps:5})');
  await sleep(200);
  const connCountAfterDedupe = (await app.evalJs('window.wrizoBoard()')).filter(b => b.kind === 'connection').length;
  ok('S5: de-dupe holds either order via the pin gesture too — attempting B->A after A->B already exists does not mint a second hairline',
    connCountAfterDedupe === 1, String(connCountAfterDedupe));

  // ==========================================================================
  // S5 — the connections footer + its per-board toggle.
  // ==========================================================================
  const footerLines = await app.evalJs(`({
    onA: document.querySelector('[data-box-id="fx5-s5-a"] .board-card-footer')?.textContent ?? null,
    onB: document.querySelector('[data-box-id="fx5-s5-b"] .board-card-footer')?.textContent ?? null,
  })`);
  ok('S5: a connected card carries ONE quiet footer line ("— thread: <other card\'s title/first words>") — on BOTH connected cards',
    !!footerLines.onA && footerLines.onA.includes('thread') && footerLines.onA.includes('Card B') &&
    !!footerLines.onB && footerLines.onB.includes('thread') && footerLines.onB.includes('Card A'),
    JSON.stringify(footerLines));

  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(150);
  // FX6 S2b — the board sliver's own "EXACTLY two hand tools" count check
  // used to live here; PARKED below (HARNESS_PARKED=1) — a third tool
  // (New page card) joins Add card + the footer toggle. Live successor:
  // fx6.mjs's own S2 section.
  const footerToggleBtn = "[...document.querySelectorAll('.wz-sliver-toggle')].find(b => b.textContent.includes('connections'))";
  await app.evalJs(`${footerToggleBtn}.click()`);
  await sleep(150);
  const footerAfterToggleOff = await app.evalJs("!!document.querySelector('[data-box-id=\"fx5-s5-a\"] .board-card-footer')");
  ok('S5: toggling the footer OFF hides it everywhere on the board',
    footerAfterToggleOff === false, String(footerAfterToggleOff));
  await app.evalJs(`${footerToggleBtn}.click()`);
  await sleep(150);
  const footerAfterToggleOn = await app.evalJs("!!document.querySelector('[data-box-id=\"fx5-s5-a\"] .board-card-footer')");
  ok('S5: toggling the footer back ON restores it',
    footerAfterToggleOn === true, String(footerAfterToggleOn));
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); // close

  // A LEGACY board (no board-meta at all, footerOn field never set)
  // defaults the footer ON — every pre-FX5 board's own connections become
  // visible immediately, no silent behavior change hidden behind a field
  // that doesn't exist yet.
  await freshBoard(app, 'fx5-s5-legacy-board', [
    { id: 'fx5-s5-legacy-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Legacy A' },
    { id: 'fx5-s5-legacy-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Legacy B' },
    { id: 'fx5-s5-legacy-conn', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 3, connA: 'fx5-s5-legacy-a', connB: 'fx5-s5-legacy-b' },
  ], LAPTOP_W, 900);
  const legacyFooterOn = await app.evalJs("!!document.querySelector('[data-box-id=\"fx5-s5-legacy-a\"] .board-card-footer')");
  ok('S5: a legacy board (no board-meta.footerOn field at all) defaults the footer to ON',
    legacyFooterOn === true, String(legacyFooterOn));

  // ==========================================================================
  // S6 — the popup shows words, not syntax. Bold/Italic markers hidden by
  // default; reveal-adjacent-to-caret (the brief's own named fallback,
  // chosen because always-hidden markers would silently corrupt storage —
  // see store/draftDecoration.ts's own header comment for the full
  // reasoning). Storage stays markdown, untouched. Draft's own dimmed-
  // syntax register untouched.
  // ==========================================================================
  await freshBoard(app, 'fx5-s6-board', [
    { id: 'fx5-s6-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'Start BOLD end' },
  ], LAPTOP_W, 900);
  // FX7 S5 — coordinate-carrying dblclick dispatch (this file's own S3
  // section, above, has the full root-cause writeup).
  await app.evalJs('(() => { const el = document.querySelector(\'[data-box-id="fx5-s6-card"]\'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()');
  await app.waitFor("!!document.querySelector('.board-popup')", { label: 'S6 popup open' });
  await sleep(200);
  // Select just the middle word ("BOLD", offsets 6-10) so there's genuine
  // text BEFORE and AFTER the bold run to move the caret away into.
  await app.evalJs(`(() => {
    const ed = document.querySelector('.board-popup-editor');
    const node = ed.firstChild;
    const range = document.createRange();
    range.setStart(node, 6);
    range.setEnd(node, 10);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  })()`);
  await app.evalJs("[...document.querySelectorAll('.board-popup-tool')].find(b => b.title === 'Bold').click()");
  await sleep(200);
  // Bold's own toolbar action lands the caret INSIDE the newly-wrapped run
  // by design (so a writer sees what they just did) — move it AWAY (Home,
  // into "Start ", clearly outside the bold run, then a real keyup so the
  // reveal-adjacent logic re-evaluates) before checking the "hidden by
  // default" state, which only means something once the caret is
  // demonstrably elsewhere.
  await app.evalJs(`(() => {
    const ed = document.querySelector('.board-popup-editor');
    const sel = window.getSelection();
    const r = document.createRange();
    r.setStart(ed, 0);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  })()`);
  await app.evalJs("document.querySelector('.board-popup-editor').dispatchEvent(new KeyboardEvent('keyup', { key: 'Home', bubbles: true }))");
  await sleep(150);
  const afterBold = await app.evalJs(`(() => {
    const ed = document.querySelector('.board-popup-editor');
    const marks = [...ed.querySelectorAll('.md-mark')];
    return {
      text: ed.innerText,
      allMarksHidden: marks.length > 0 && marks.every(m => m.classList.contains('md-mark-hidden')),
      hiddenMarkFontSize: marks[0] ? getComputedStyle(marks[0]).fontSize : null,
    };
  })()`);
  ok('S6: storage still holds the literal ** markers (draftFormat\'s own markdown convention, untouched) — the text content is "Start **BOLD** end"',
    afterBold.text === 'Start **BOLD** end', JSON.stringify(afterBold));
  ok('S6: with the caret moved AWAY from the bold run (into "Start "), the asterisks are visually hidden (font-size:0) — no visible asterisks on the card, Nick\'s own verdict',
    afterBold.allMarksHidden && afterBold.hiddenMarkFontSize === '0px', JSON.stringify(afterBold));

  // Reveal-adjacent-to-caret: move the caret INTO the bold run and confirm
  // its own markers become visible again.
  await app.evalJs(`(() => {
    const ed = document.querySelector('.board-popup-editor');
    const range = document.createRange();
    const walker = document.createTreeWalker(ed.querySelector('.md-bold'), NodeFilter.SHOW_TEXT);
    let n; let target = null;
    while ((n = walker.nextNode())) { if (n.data.trim()) { target = n; break; } }
    if (target) { range.setStart(target, 1); range.collapse(true); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
  })()`);
  await app.evalJs("document.querySelector('.board-popup-editor').dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }))");
  await sleep(150);
  const revealState = await app.evalJs(`(() => {
    const marks = [...document.querySelectorAll('.board-popup-editor .md-mark')];
    return { anyRevealed: marks.some(m => !m.classList.contains('md-mark-hidden')) };
  })()`);
  ok('S6: reveal-adjacent-to-caret — once the caret sits inside/beside the bold run, its OWN markers become visible again (a real, working escape hatch to see/edit the raw syntax, per the brief\'s own named fallback)',
    revealState.anyRevealed === true, JSON.stringify(revealState));

  // Draft mode's own dimmed-syntax register is untouched: .md-mark there
  // is NEVER given the -hidden class, still just opacity-dimmed.
  await app.evalJs("document.querySelector('.board-popup-done')?.click()");
  await sleep(300);
  await freshProsePage(app, LAPTOP_W, 900);
  await app.click('Draft');
  await sleep(200);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('**bold in draft**');
  await sleep(200);
  const draftMarkState = await app.evalJs(`(() => {
    const marks = [...document.querySelectorAll('.forward-only-editor .md-mark')];
    return { count: marks.length, anyHiddenClass: marks.some(m => m.classList.contains('md-mark-hidden')), opacity: marks[0] ? getComputedStyle(marks[0]).opacity : null };
  })()`);
  ok('S6: Draft mode\'s own dimmed-syntax register is genuinely UNTOUCHED — its .md-mark spans NEVER carry the card-only .md-mark-hidden class, still just dimmed (opacity ~0.38), asterisks stay visible there (this is a card-surface-only change)',
    draftMarkState.count > 0 && !draftMarkState.anyHiddenClass && Math.abs(parseFloat(draftMarkState.opacity) - 0.38) < 0.05,
    JSON.stringify(draftMarkState));

  // ==========================================================================
  // S7 — the em dash (Word convention): "--word " -> "—word ". Scoped to
  // Draft mode's own free-editing contenteditable and the card popup —
  // BOTH genuinely native-undo surfaces (see store/emDash.ts's own header
  // comment for why Journal/Free Write are deliberately excluded: both
  // carry their own custom/no undo system, incompatible with "one clean
  // undo step" without much larger, out-of-scope surgery).
  // ==========================================================================
  // A synthetic but property-faithful Ctrl+Z keydown — this ticket's own
  // custom one-step undo SHIM (store/emDash.ts's own header comment: native
  // browser undo, execCommand OR a real Ctrl/Cmd+Z alike, does NOT work in
  // either of these editors — found live, not assumed, and disclosed
  // plainly rather than papered over) reads the event's own ctrlKey/key
  // properties directly, not `isTrusted`, so this reproduces it faithfully.
  const ctrlZ = (sel) => app.evalJs(`document.querySelector('${sel}').dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }))`);

  await freshProsePage(app, LAPTOP_W, 900);
  await app.click('Draft');
  await sleep(200);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Hello--world ');
  await sleep(250);
  const afterEmDash = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S7: two hyphens between two words, finished by a trailing space, autocorrect to a single em dash — "Hello--world " -> "Hello—world "',
    afterEmDash.includes('Hello—world'), JSON.stringify(afterEmDash));

  // A genuine, live-diagnosed defect, found and fixed (not guessed): the
  // caret after the substitution must land AFTER the untouched trailing
  // space (where the writer's own typing naturally was), not short of it
  // (execCommand('insertText', em-dash) collapses the selection to right
  // after the INSERTED character alone, before that space and anything
  // typed past it for a fast typist) — continuing to type immediately
  // after the auto-correct must append normally, never insert mid-word.
  await app.typeKeys('continuing');
  await sleep(200);
  const afterContinuing = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S7: typing immediately after an em-dash auto-correct continues APPENDING normally — "Hello—world continuing", never landing mid-word ("Hello—wcontinuingorld ")',
    afterContinuing.includes('Hello—world continuing') && !afterContinuing.includes('continuingworld') && !/w.*continuing.*orld/.test(afterContinuing),
    JSON.stringify(afterContinuing));

  // ONE undo step reverts to the literal hyphens. NOTE (disclosed
  // honestly): native browser undo (execCommand('undo') AND a real
  // Ctrl/Cmd+Z alike) does NOT work in this editor at all, found live —
  // this codebase's own per-keystroke innerHTML rewrite (decorateEditorFor)
  // invalidates whatever Chromium's undo manager was tracking, for EVERY
  // edit, not just this one. The DoD is met via a small, purpose-built
  // "undo just the last em-dash" shim instead (store/emDash.ts), wired to
  // the SAME Ctrl/Cmd+Z keystroke a writer would actually press — the felt
  // result (one press, hyphens back) is identical; the mechanism under it
  // is custom, not native, and that is stated here plainly rather than
  // silently relied upon.
  //
  // The shim's own "immediately after, before any OTHER edit" scope means
  // the "continuing" word just typed above ALREADY invalidated it (a real,
  // deliberate consequence of that scope, not a bug) — so this undo test
  // runs against a FRESH substitution instead, on a clean new line.
  await app.typeKeys('\nSecond--try ');
  await sleep(250);
  const beforeUndo = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S7 precondition: a fresh em-dash substitution exists to undo ("Second—try")', beforeUndo.includes('Second—try'), beforeUndo);
  await ctrlZ('.forward-only-editor');
  await sleep(200);
  const afterOneUndo = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S7: ONE Ctrl/Cmd+Z reverts JUST the em-dash substitution, restoring the literal hyphens — "Second--try " again, not a bigger chunk of the preceding typing. (Native browser undo does not function in this editor at all — confirmed live — so this is a purpose-built shim, not native undo; disclosed, not hidden.)',
    afterOneUndo.includes('Second--try'), JSON.stringify(afterOneUndo));

  // FX6 S1 — "a second Ctrl+Z (nothing pending) is a harmless no-op" used
  // to be checked here; PARKED below (HARNESS_PARKED=1) — real, walkable
  // undo replaces the single-shot shim, so a second Ctrl+Z now legitimately
  // continues undoing further back. Live successor: fx6.mjs's own S1
  // section (the full walkable chain).

  // The revert's own caret naturally lands back at the EDIT SITE (right
  // after the restored hyphens), not the end of the document — correct,
  // expected undo behavior (matching Word: your cursor returns to where
  // the undone edit was). Move it to the true end before continuing so
  // the next probes append cleanly rather than inserting mid-document.
  const moveCaretToEnd = () => app.evalJs(`(() => {
    const el = document.querySelector('.forward-only-editor');
    el.focus();
    const sel = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
  })()`);
  await moveCaretToEnd();

  // Three hyphens also convert; four+ never do (the brief's own "two or
  // three" — a boundary this codebase's own TRIGGER regex enforces).
  await app.typeKeys(' Three---dashes ');
  await sleep(250);
  const afterThree = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S7: three hyphens ALSO convert to a single em dash',
    afterThree.includes('Three—dashes'), JSON.stringify(afterThree));

  await app.typeKeys('Four----dashes ');
  await sleep(250);
  const afterFour = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S7: four+ hyphens do NOT convert — "no other autocorrects ride along," and the brief\'s own "two or three" is a real boundary, not a soft aim',
    afterFour.includes('Four----dashes'), JSON.stringify(afterFour));

  // No other autocorrect rides along: an ordinary word boundary space
  // (no hyphens at all) triggers nothing extra.
  await app.typeKeys('ordinary words with no hyphens at all ');
  await sleep(250);
  const afterOrdinary = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S7: ordinary typing (no hyphen-letter-space pattern) is completely unaffected — no stray autocorrects ride along',
    afterOrdinary.includes('ordinary words with no hyphens at all'), JSON.stringify(afterOrdinary));

  // The SAME autocorrect (+ the same one-step undo shim) on the card popup.
  await freshBoard(app, 'fx5-s7-board', [
    { id: 'fx5-s7-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: '' },
  ], LAPTOP_W, 900);
  // FX7 S5 — coordinate-carrying dblclick dispatch (this file's own S3
  // section has the full root-cause writeup).
  await app.evalJs('(() => { const el = document.querySelector(\'[data-box-id="fx5-s7-card"]\'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()');
  await app.waitFor("!!document.querySelector('.board-popup')", { label: 'S7 popup open' });
  await sleep(200);
  await app.typeKeys('card--popup ');
  await sleep(250);
  const popupAfterEmDash = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  ok('S7: the SAME em-dash autocorrect fires in the card popup — "card--popup " -> "card—popup "',
    popupAfterEmDash.includes('card—popup'), JSON.stringify(popupAfterEmDash));
  await ctrlZ('.board-popup-editor');
  await sleep(200);
  const popupAfterUndo = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  ok('S7: one Ctrl/Cmd+Z in the card popup ALSO reverts just the substitution (the same purpose-built shim), restoring the literal hyphens',
    popupAfterUndo.includes('card--popup'), JSON.stringify(popupAfterUndo));

  // ==========================================================================
  // S8 — hover-restore, on real hardware. Reproduced with the closest-to-
  // trusted event stream the harness can produce (CDP Input.dispatchMouseEvent,
  // isTrusted:true — runtime-verify.mjs's own app.mouseMove/mouseDown/mouseUp),
  // not window.dispatchEvent(new PointerEvent(...)). A SECOND genuine defect,
  // invisible to FX4's own four synthetic cycles, found here: a real hand's
  // natural jitter at an edge repeatedly crossed the strict EDGE_PX boundary,
  // instantly cancelling the dwell every time — fixed with a short leave-
  // grace window (useChromeDissolve.ts). FX4's own multi-cycle fix (inZone
  // reset on timer fire) is re-verified here too, now via real events.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  const dissolvedState = () => app.evalJs("document.querySelector('.desk-frame-host').dataset.chromeReceded");

  // Clean approach (no jitter): a real, incremental trajectory to an edge,
  // then holding still, resurfaces.
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('warming up the chrome dissolve for a clean approach');
  await sleep(300);
  const cleanBefore = await dissolvedState();
  for (let i = 1; i <= 12; i++) { await app.mouseMove(Math.round(640 - 630 * (i / 12)), 400); await sleep(40); }
  let cleanAfter = null;
  for (let i = 0; i < 20 && cleanAfter !== 'false'; i++) { cleanAfter = await dissolvedState(); if (cleanAfter === 'false') break; await sleep(50); }
  ok('S8: a clean, real (isTrusted) incremental approach to an edge, then holding still, resurfaces faded chrome',
    cleanBefore === 'true' && cleanAfter === 'false', JSON.stringify({ cleanBefore, cleanAfter }));

  // THE diagnosed defect: a real hand at rest is not pixel-perfectly
  // still — a small oscillation across the strict edge boundary (found
  // live at ~3px, ~60ms apart) used to cancel the dwell every single time,
  // via genuinely trusted events a synthetic dispatch could never produce.
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(' cycle two warmup, now testing jitter tolerance');
  await sleep(300);
  const jitterBefore = await dissolvedState();
  for (let i = 1; i <= 8; i++) { await app.mouseMove(Math.round(640 + 630 * (i / 8)), 400); await sleep(40); }
  let jitterResurfaced = false;
  for (let i = 0; i < 30 && !jitterResurfaced; i++) {
    await app.mouseMove(i % 2 === 0 ? 1221 : 1227, 400); // oscillate a few px across the EDGE_PX=56 boundary at x=1224
    await sleep(60);
    if ((await dissolvedState()) === 'false') jitterResurfaced = true;
  }
  ok('S8: THE diagnosed defect, fixed — a real hand\'s own jitter at the edge (a ~3px oscillation crossing the strict boundary, isTrusted, via CDP) no longer cancels the dwell on every single crossing; the resurface still lands within the SAME dwell window (a short leave-grace absorbs the jitter without extending the wait). This is the check FX4\'s own four synthetic cycles could never have caught — a hand-written test never dispatches noisy coordinates.',
    jitterBefore === 'true' && jitterResurfaced === true, JSON.stringify({ jitterBefore, jitterResurfaced }));

  // A genuine departure (no return) BEFORE the dwell completes still
  // correctly cancels — the grace window must not become an infinite one.
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(' cycle three warmup, testing a genuine departure');
  await sleep(300);
  const departBefore = await dissolvedState();
  for (let i = 1; i <= 6; i++) { await app.mouseMove(Math.round(640 - 630 * (i / 6)), 400); await sleep(30); }
  await app.mouseMove(300, 400); // walk away immediately, well before the dwell would complete
  await sleep(500);
  const departAfter = await dissolvedState();
  ok('S8: a genuine departure BEFORE the dwell completes still correctly cancels — the jitter-tolerance grace window is short, not an unbounded one',
    departBefore === 'true' && departAfter === 'true', JSON.stringify({ departBefore, departAfter }));

  // FX4's own multi-cycle fix, re-verified on REAL trusted events (it
  // already worked, verified live rather than assumed unaffected).
  const edges = [[10, 400], [400, 4], [10, 400], [1270, 400]];
  let allCyclesOk = true;
  for (const [tx, ty] of edges) {
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys(' d');
    await sleep(250);
    const before = await dissolvedState();
    for (let i = 1; i <= 8; i++) { await app.mouseMove(Math.round(640 + (tx - 640) * (i / 8)), Math.round(400 + (ty - 400) * (i / 8))); await sleep(30); }
    let after = null;
    for (let i = 0; i < 20; i++) { after = await dissolvedState(); if (after === 'false') break; await sleep(50); }
    if (!(before === 'true' && after === 'false')) allCyclesOk = false;
  }
  ok('S8: FX4\'s own multi-cycle fix (inZone reset on timer fire) still holds under REAL trusted pointer events, re-verified rather than assumed unaffected by this ticket\'s own grace-window addition',
    allCyclesOk, String(allCyclesOk));

  // The sliver/tool fade Nick praised is untouched by the fix: the SAME
  // --fade-dur timing constants apply (FADE_OUT_S/QUICK_S/WAIT_MS/
  // FADE_IN_S untouched in useChromeDissolve.ts — this only reads the
  // computed custom property back, a light regression check).
  const fadeDur = await app.evalJs("getComputedStyle(document.querySelector('.desk-frame-host')).getPropertyValue('--fade-dur')");
  ok('S8: the sliver/tool fade\'s own timing (--fade-dur) is still being set (untouched by this fix — only the EDGE-DWELL jitter tolerance changed, not the fade durations themselves)',
    typeof fadeDur === 'string' && fadeDur.trim().length > 0, fadeDur);

  // ==========================================================================
  // S10 — center the paper. The strip stays flush at the screen's own left
  // edge; the PAPER returns to viewport center; leftover width falls
  // symmetrically around the paper (strip's own width excluded from the
  // symmetry measure) — at both reference widths + the 1100 floor.
  // ==========================================================================
  for (const [width, height] of [[LAPTOP_W, 900], [WIDE_W, 1000], [FLOOR_W, 900]]) {
    await freshProsePage(app, width, height);
    const info = await app.evalJs(`(() => {
      const strip = document.querySelector('.desk-frame-strip').getBoundingClientRect();
      const ed = document.querySelector('.forward-only-editor');
      const paper = (ed.closest('.mode-page') || ed).getBoundingClientRect();
      return { stripLeft: strip.left, leftGap: paper.left, rightGap: window.innerWidth - paper.right, viewport: window.innerWidth };
    })()`);
    ok(`S10 @ ${width}px: the strip sits flush at x===0 (the screen's own left edge, FX4 S3's win, untouched)`,
      Math.abs(info.stripLeft) <= 1, JSON.stringify(info));
    ok(`S10 @ ${width}px: the paper is TRUE-centered in the viewport — |left-paper-gap - right-paper-gap| within tolerance (the strip's own width excluded from the symmetry measure, per the brief's own words)`,
      Math.abs(info.leftGap - info.rightGap) <= 2, JSON.stringify(info));
  }

  // Legacy (<1100px) chrome stays byte-identical — DeskFrame doesn't mount
  // at all below the floor, so none of S10's own CSS applies there.
  await freshProsePage(app, 900, 900);
  const legacyInfo = await app.evalJs(`({
    deskFrameGone: !document.querySelector('.desk-frame'),
    stripGone: !document.querySelector('.desk-frame-strip'),
  })`);
  ok('S10: legacy (<1100px) chrome is untouched — no .desk-frame/.desk-frame-strip mount at all below the floor',
    legacyInfo.deskFrameGone && legacyInfo.stripGone, JSON.stringify(legacyInfo));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// FX6 S1/S2 supersede two of this file's own checks. Quoted verbatim below
// (the exact code that used to live in this file's own live sections,
// before this park):
//
//   S7 (live, before FX6): "A second Ctrl+Z (nothing pending anymore) is a
//   harmless no-op — proves this is genuinely "one step," not a repeatable
//   toggle."
//     await ctrlZ('.forward-only-editor');
//     const afterSecondUndo = await app.evalJs("...innerText");
//     ok('S7: a SECOND Ctrl/Cmd+Z (nothing pending) is a harmless no-op —
//       genuinely one step, not a repeatable toggle',
//       afterSecondUndo === afterOneUndo, ...);
//   FX6 S1 replaces the single-shot em-dash shim with a REAL, walkable
//   undo/redo stack (store/textUndo.ts) — a second Ctrl+Z no longer a
//   no-op: it legitimately continues undoing further back (this IS the
//   point of real undo — "Ctrl+Z's his way back out step by step," the
//   brief's own DoD wording). Live successor: fx6.mjs's own S1 section
//   covers the full walkable chain; the check below proves the OLD claim
//   ("no-op") is now false, the same "prove the retirement itself"
//   discipline fx4.mjs's own PARKED section established.
//
//   S5 (live, before FX6): "the board sliver carries EXACTLY two hand
//   tools now — Add card + the footer toggle."
//     const sliverBoardShape = await app.evalJs(`(() => { ... })()`);
//     ok('S5: the board sliver carries EXACTLY two hand tools now...',
//       sliverBoardShape.count === 2, ...);
//   FX6 S2b adds a THIRD tool (New page card) — the board-side door Nick
//   reached for and couldn't find. Live successor: fx6.mjs's own S2
//   section proves New page card's own presence + function; the check
//   below proves the OLD count ("exactly two") is now three.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    const ctrlZParked = (sel) => app.evalJs(`document.querySelector('${sel}').dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }))`);
    await freshProsePage(app, LAPTOP_W, 900);
    await app.click('Draft');
    await sleep(200);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('Alpha word. Second--try ');
    await sleep(250);
    await ctrlZParked('.forward-only-editor');
    await sleep(200);
    const afterOneUndo = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
    await ctrlZParked('.forward-only-editor');
    await sleep(200);
    const afterSecondUndo = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
    pok('PARKED (was "S7: a SECOND Ctrl/Cmd+Z (nothing pending) is a harmless no-op — genuinely one step, not a repeatable toggle") — FX6 S1: real, walkable undo/redo replaces the single-shot em-dash shim; a second Ctrl+Z now legitimately continues undoing further back (proven here: the text changes again, further than the first undo) — live successor: fx6.mjs\'s own S1 section',
      afterSecondUndo !== afterOneUndo, JSON.stringify({ afterOneUndo, afterSecondUndo }));

    await freshBoard(app, 'fx5-parked-s5-board', [
      { id: 'fx5p-s5-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Card A' },
      { id: 'fx5p-s5-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.08, z: 2, text: 'Card B' },
    ], LAPTOP_W, 900);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(150);
    const sliverBoardShape = await app.evalJs(`(() => {
      const sections = document.querySelectorAll('.wz-sliver-body > .wz-sliver-section');
      const boardSection = [...sections].find(s => s.querySelector('.wz-sliver-item-btn') || s.querySelector('.wz-sliver-toggle'));
      const buttons = boardSection ? boardSection.querySelectorAll('button') : [];
      return { count: buttons.length, labels: [...buttons].map(b => b.textContent.trim()) };
    })()`);
    // GENERATION 2 (B2 S5) — a FOURTH tool joins them: Existing page…
    // live successor: b2.mjs's own S5 section.
    // GENERATION 3 (B3 S3) — a FIFTH tool joins them: "From a deck…",
    // door 2's own affordance — live successor: b3.mjs's own S4 section
    // (an ordered-labels check, the shape this lineage settled on).
    pok('PARKED (was "S5: the board sliver carries EXACTLY two hand tools now — Add card + the footer toggle") — FX6 S2b: a THIRD tool joins them (New page card, the board-side door); generation 2: B2 S5 adds a FOURTH (Existing page…); generation 3: B3 S3 adds a FIFTH (From a deck…) — live successor: b3.mjs\'s own S4 section',
      sliverBoardShape.count === 5, JSON.stringify(sliverBoardShape));

    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX5 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nFX5 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX5 VERIFY: PASS (${checks.length} checks)` : `\nFX5 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
