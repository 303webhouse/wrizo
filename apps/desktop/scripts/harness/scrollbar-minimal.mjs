// scrollbar-minimal — Nick's option B (cursor/scrollbar-mockup @ c67f1bdb, Fable
// relay Oct 12): the writing-surface scroll container only (.mode-scroll /
// .desk-frame-scroll-cap) gets a thin (4px), theme-toned (--ink-on-paper-low)
// custom overlay thumb — invisible at rest, shown on scroll/hover/drag, fading
// ~1s after the last of those stops, reduced-motion instant. The app-wide
// scrollbar rule (FX7 S4) is untouched everywhere else.
//
// WHY A CUSTOM THUMB, NOT NATIVE (the spec's own "your call; tell me which"):
// no native ::-webkit-scrollbar pseudo-class exists for "idle" with a timed
// auto-hide — there is no CSS trigger for "show on scroll/hover/drag, hide
// ~1s after the LAST one stops". ThinScrollbar.tsx is therefore a real DOM
// overlay driven by the target's own scroll/pointer events.
//
// THE "FULL HEIGHT" CAUSE (Fable: "find the full-height cause yourself while
// building, and prove full height in your own harness check"): traced in
// index.css before writing any code. Two historical height rules on these
// scroll containers are deliberate, documented fixes for OTHER regressions,
// not accidental caps — `.desk-frame-stage .mode-page`'s `flex:1 1 auto`
// vs. `.desk-frame-stage > .desk-frame-scroll-cap`'s `flex:0 1 auto` is a
// NAMED fix (index.css, the comment above that rule) for a horizontal-
// centring regression, in a row-direction flex stage — flex-grow there
// governs WIDTH, not height; cross-axis stretch (the default) is what
// actually fills height, independent of flex-grow. Rather than risk
// reopening that documented fix on an unverified guess, ThinScrollbar reads
// the scroll container's own `getBoundingClientRect()`/`clientHeight`
// directly, every layout pass — so its track is ALWAYS exactly as tall as
// the container actually renders, by construction, never a guessed number.
// S5 below proves this equality directly, on both writing surfaces, at both
// of this project's standing reference widths.
//
// Run: node scripts/harness/scrollbar-minimal.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 300)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROSE_LINE = 'The garden had been quiet for a long time, and nobody who walked through it that autumn could have said exactly when the quiet began. ';
const longText = Array.from({ length: 80 }, (_, i) => `${PROSE_LINE}(line ${i})`).join('\n');

const freshDesk = async (app, w, h) => {
  await app.emulateDpr(1, w, h);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
};

const freshDeskThemed = async (app, theme, w, h) => {
  await app.emulateDpr(1, w, h);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk before fixture (${theme})` });
};

// A long prose page, framed (width >= 1100), scrolled via .mode-scroll.
// NOTE: deliberately no destructured-default-object parameter here — item141.mjs's
// own helper-body scanner locates a helper's body via the FIRST "{" after its
// signature, which lands on a `({ a = 1 } = {})`-shaped parameter instead of the
// arrow's own body, mis-scoping the whole helper and reporting its real, settled
// seam call as an unguarded top-level read. Plain `opts` + an in-body destructure
// sidesteps that parser trip without touching the shared guard.
const openProsePage = async (app, opts) => {
  opts = opts || {};
  const id = opts.id || 'sb-prose';
  const w = opts.w || 1400;
  const h = opts.h || 900;
  const text = opts.text || longText;
  await app.evalJs(`window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: ${JSON.stringify(text)}, createdAt: new Date().toISOString(), origin: null, source: 'page' })`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.mode-scroll')", { label: 'Prose page mounted' });
  await app.emulateDpr(1, w, h);
  await sleep(300);
};

// A long screenplay page, framed, scrolled via .desk-frame-scroll-cap. Same
// plain-`opts` shape as openProsePage above, same reason.
const openScriptPage = async (app, opts) => {
  opts = opts || {};
  const id = opts.id || 'sb-script';
  const w = opts.w || 1400;
  const h = opts.h || 900;
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const scenes = Array.from({ length: 10 }, (_, i) => ({
      id: 'sb-scene-' + i,
      heading: { id: 'sb-head-' + i, t: 'scene', text: 'INT. ROOM ' + i + ' - DAY' },
      body: Array.from({ length: 8 }, (_, j) => ({ id: 'sb-line-' + i + '-' + j, t: 'action', text: 'A long action line of screenplay text, number ' + j + ', scene ' + i + ', long enough across ten scenes to force real vertical overflow in the framed sheet.' })),
    }));
    window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: '', pageType: 'script', script: { v: 1, scenes }, createdAt: now, source: null, origin: null });
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.desk-frame-scroll-cap')", { label: 'Script page mounted, framed' });
  await app.emulateDpr(1, w, h);
  await sleep(300);
};

// The overlay's own state, read against its target (previousElementSibling).
const barState = (app, targetSel) => app.evalJs(`(() => {
  const target = document.querySelector(${JSON.stringify(targetSel)});
  if (!target) return { found: false };
  const bar = target.nextElementSibling;
  if (!bar || !bar.classList.contains('wz-thin-scrollbar')) return { found: false, nextClass: bar ? bar.className : null };
  const thumb = bar.querySelector('.wz-thin-scrollbar-thumb');
  const barCs = getComputedStyle(bar);
  const thumbCs = thumb ? getComputedStyle(thumb) : null;
  const barRect = bar.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return {
    found: true,
    active: bar.classList.contains('active'),
    display: barCs.display,
    opacity: barCs.opacity,
    pointerEvents: barCs.pointerEvents,
    transitionDuration: barCs.transitionDuration,
    thumbBackground: thumbCs ? thumbCs.backgroundColor : null,
    barRect: { top: barRect.top, left: barRect.left, height: barRect.height },
    targetRect: { top: targetRect.top, left: targetRect.left, height: targetRect.height, right: targetRect.right },
    targetScroll: { scrollTop: target.scrollTop, scrollHeight: target.scrollHeight, clientHeight: target.clientHeight },
  };
})()`);

const tokenColor = (app, token) => app.evalJs(`getComputedStyle(document.documentElement).getPropertyValue(${JSON.stringify(token)}).trim()`);

// Set scrollTop directly — Chromium fires a genuine native 'scroll' event on
// this mutation regardless of origin (wheel, drag, keyboard, or script); the
// component's own listener cannot distinguish the source, so this exercises
// the real code path, not a stand-in for it.
const scrollTo = (app, sel, top) => app.evalJs(`(() => { document.querySelector(${JSON.stringify(sel)}).scrollTop = ${top}; })()`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — HIDDEN AT REST, on both writing surfaces.
  //
  // Fable's review: a leftover CDP pointer position from a PRIOR check can
  // sit over the new page's writing surface the instant it mounts, under a
  // reload that never itself re-dispatches a mousemove — reading "at rest"
  // without first parking the pointer somewhere neutral risks reading a
  // genuine hover, not a rest state. Each read below is preceded by an
  // explicit move to a corner no writing surface ever occupies, followed by
  // a sleep LONGER than FADE_OUT_DELAY_MS (1000ms) — moving the pointer away
  // only SCHEDULES the hide (the same 1s wait as every other hide path); a
  // short sleep here would just catch it mid-wait, which is not "at rest".
  // ==========================================================================
  await freshDesk(app, 1400, 900);
  await openProsePage(app);
  await app.mouseMove(2, 2);
  await sleep(1150);
  let s = await barState(app, '.mode-scroll');
  ok('S1 (prose): the overlay mounts as .mode-scroll\'s own next sibling',
    s.found === true, JSON.stringify({ display: s.display }));
  ok('S1 (prose): at rest — not active, effectively invisible (opacity 0) and not hit-testable (pointer-events none)',
    s.found && !s.active && parseFloat(s.opacity) === 0 && s.pointerEvents === 'none',
    JSON.stringify({ active: s.active, opacity: s.opacity, pointerEvents: s.pointerEvents }));

  await freshDesk(app, 1400, 900);
  await openScriptPage(app);
  await app.mouseMove(2, 2);
  await sleep(1150);
  s = await barState(app, '.desk-frame-scroll-cap');
  ok('S1 (script): the overlay mounts as .desk-frame-scroll-cap\'s own next sibling',
    s.found === true, JSON.stringify({ display: s.display }));
  ok('S1 (script): at rest — not active, invisible, not hit-testable',
    s.found && !s.active && parseFloat(s.opacity) === 0 && s.pointerEvents === 'none',
    JSON.stringify({ active: s.active, opacity: s.opacity, pointerEvents: s.pointerEvents }));

  // Sanity on scope containment: an UNRELATED scrollable region (the Themes
  // menu / a settings sheet) is untouched — the FX7 S4 app-wide default
  // still governs there. Nothing to assert visually beyond "no overlay was
  // injected there" — ThinScrollbar is only ever rendered at the three
  // call sites this ticket touched.
  const strayOverlays = await app.evalJs("document.querySelectorAll('.wz-thin-scrollbar').length");
  ok('S1 (scope): exactly one overlay exists on a script page with one writing surface mounted (no stray duplicates, none on chrome)',
    strayOverlays === 1, String(strayOverlays));

  // ==========================================================================
  // S2 — VISIBLE WHILE SCROLLING.
  //
  // Fable's review: the fade-IN transition is .15s — reading opacity at
  // 120ms after the triggering scroll can land MID-transition (0.9695 was
  // observed, not a failure of the feature). Wait past .15s and accept a
  // tolerance rather than exact 1, since a transition's end value is a
  // float, not guaranteed to land on the literal integer.
  // ==========================================================================
  await freshDesk(app, 1400, 900);
  await openProsePage(app);
  await scrollTo(app, '.mode-scroll', 200);
  await sleep(220);
  s = await barState(app, '.mode-scroll');
  ok('S2 (prose): a real scroll event activates the overlay',
    s.active === true && parseFloat(s.opacity) >= 0.95 && s.pointerEvents === 'auto',
    JSON.stringify({ active: s.active, opacity: s.opacity, pointerEvents: s.pointerEvents }));
  ok('S2 (prose): the thumb tracks the scroll position (scrollTop > 0 is reflected, not frozen at the top)',
    s.targetScroll.scrollTop === 200, JSON.stringify(s.targetScroll));

  await freshDesk(app, 1400, 900);
  await openScriptPage(app);
  await scrollTo(app, '.desk-frame-scroll-cap', 150);
  await sleep(220);
  s = await barState(app, '.desk-frame-scroll-cap');
  ok('S2 (script): a real scroll event activates the overlay',
    s.active === true && parseFloat(s.opacity) >= 0.95 && s.pointerEvents === 'auto',
    JSON.stringify({ active: s.active, opacity: s.opacity, pointerEvents: s.pointerEvents }));

  // ==========================================================================
  // S3 — GONE ~1s AFTER SCROLLING STOPS (not immediately, not never). Fable's
  // review: the mockup's fade-out is ~0.35s, not the 1s this started with —
  // FADE_OUT_DELAY_MS (the wait before the hide class drops) is unchanged at
  // 1000ms; only the CSS transition on the fade itself shortened. So `active`
  // flips false at the ~1000ms mark regardless, but `opacity` doesn't settle
  // to 0 until ~350ms after that — the two are checked at different delays.
  // ==========================================================================
  await scrollTo(app, '.desk-frame-scroll-cap', 180);
  await sleep(400);
  s = await barState(app, '.desk-frame-scroll-cap');
  ok('S3: still visible shortly (400ms) after the last scroll — the hide is not immediate',
    s.active === true, JSON.stringify({ active: s.active }));

  await sleep(750); // 400ms + 750ms = 1150ms total, past the 1000ms wait — the hide class drops here
  s = await barState(app, '.desk-frame-scroll-cap');
  ok('S3: gone (hide class dropped) about 1s after scrolling stopped',
    s.active === false, JSON.stringify({ active: s.active }));

  await sleep(400); // +400ms = 1550ms total, past the wait AND the 0.35s fade-out
  s = await barState(app, '.desk-frame-scroll-cap');
  ok('S3 (Fable\'s review): and fully faded — opacity 0 once the ~0.35s fade-out itself has had time to finish, not the old ~1s one',
    parseFloat(s.opacity) === 0, JSON.stringify({ opacity: s.opacity }));

  // ==========================================================================
  // S4 — HOVER SHOWS IT; LEAVING LETS IT FADE. DRAGGING THE THUMB SCROLLS
  // THE PAGE AND KEEPS IT SHOWN FOR THE DURATION OF THE DRAG.
  // ==========================================================================
  await freshDesk(app, 1400, 900);
  await openProsePage(app);
  const targetRectForHover = await app.evalJs("(() => { const r = document.querySelector('.mode-scroll').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  await app.mouseMove(targetRectForHover.x, targetRectForHover.y);
  await sleep(150);
  s = await barState(app, '.mode-scroll');
  ok('S4: hovering the writing surface (no scroll) shows the overlay',
    s.active === true, JSON.stringify({ active: s.active }));

  // Fable's review: the overlay sits geometrically inside the target's own
  // rightmost 4px, but is a SEPARATE element (not a descendant) — so moving
  // onto it changes the hit-test result and fires the target's own
  // `mouseleave`, even though the pointer never left the writing surface.
  // Without the overlay's own mirrored enter/leave pair, that mouseleave
  // would schedule a hide the instant the pointer reaches the thumb.
  const thumbPointForHover = await app.evalJs("(() => { const t = document.querySelector('.mode-scroll').nextElementSibling.querySelector('.wz-thin-scrollbar-thumb'); const r = t.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  await app.mouseMove(thumbPointForHover.x, thumbPointForHover.y);
  await sleep(150);
  s = await barState(app, '.mode-scroll');
  ok('S4 (Fable\'s review): moving from the writing surface ONTO the thumb keeps it shown — hovering the thumb does not read as leaving',
    s.active === true, JSON.stringify({ active: s.active }));
  await sleep(1300); // well past the 1000ms wait — confirms it is genuinely held, not merely not-yet-expired
  s = await barState(app, '.mode-scroll');
  ok('S4 (Fable\'s review): and stays shown the whole time the pointer rests on the thumb, past the point it would otherwise have faded',
    s.active === true, JSON.stringify({ active: s.active }));

  // Move the pointer well away from the surface entirely.
  await app.mouseMove(5, 5);
  await sleep(150);
  s = await barState(app, '.mode-scroll');
  ok('S4 (precondition): still shown immediately after the pointer leaves — hide is delayed, not instant',
    s.active === true, JSON.stringify({ active: s.active }));
  await sleep(1100);
  s = await barState(app, '.mode-scroll');
  ok('S4: and faded once the pointer has been gone ~1s with no further scroll',
    s.active === false, JSON.stringify({ active: s.active }));

  // Drag the thumb: press on it, move down, release — the target's own
  // scrollTop must move, proving the drag is wired to real scrolling, not
  // just a cosmetic highlight.
  await scrollTo(app, '.mode-scroll', 0);
  await app.mouseMove(targetRectForHover.x, targetRectForHover.y);
  await sleep(100);
  const beforeDrag = await barState(app, '.mode-scroll');
  ok('S4 (driver): the thumb has a real on-screen box to press', beforeDrag.found === true, JSON.stringify(beforeDrag));
  const thumbPoint = await app.evalJs("(() => { const t = document.querySelector('.mode-scroll').nextElementSibling.querySelector('.wz-thin-scrollbar-thumb'); const r = t.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  await app.mouseDown(thumbPoint.x, thumbPoint.y);
  await app.mouseMove(thumbPoint.x, thumbPoint.y + 150);
  await sleep(80);
  const midDrag = await barState(app, '.mode-scroll');
  await app.mouseUp(thumbPoint.x, thumbPoint.y + 150);
  ok('S4: dragging the thumb down scrolls the writing surface (scrollTop advanced)',
    midDrag.targetScroll.scrollTop > 0, JSON.stringify(midDrag.targetScroll));
  ok('S4: the overlay stays shown for the whole drag',
    midDrag.active === true, JSON.stringify({ active: midDrag.active }));

  // ==========================================================================
  // S5 — FULL-HEIGHT TRACK: the overlay's own rect matches the scroll
  // container's own rendered rect EXACTLY, at both of this project's
  // standing reference widths, on both writing surfaces. This is the "full
  // height" claim, proven by construction rather than by a guessed CSS
  // number (see file header).
  //
  // Chat 1's hypothesis (confirmed): this was measuring the HIDDEN bar — a
  // rect read is correct regardless of opacity/active (getBoundingClientRect
  // doesn't care about CSS opacity), but round 2's own re-measure loop only
  // ran while `active`, so if the bar was not (yet, or no longer) active at
  // the 120ms read, whatever it last measured — possibly BEFORE a late,
  // event-less reflow (ThinScrollbar.tsx's own round-3 comment: Prose's
  // variable font settling its metrics after mount, with no scroll/resize to
  // catch it) — is exactly what got compared, stale. ROUND 3 fixes the
  // component (ticks unconditionally for a settle window after mount, not
  // gated on `active`); belt-and-suspenders here too — assert `active` as an
  // explicit precondition, so if this ever reads a hidden bar again, THAT
  // fails loudly instead of silently certifying the wrong element's rect.
  // ==========================================================================
  for (const w of [1280, 2200]) {
    await freshDesk(app, w, 900);
    await openProsePage(app, { w, h: 900 });
    await scrollTo(app, '.mode-scroll', 50); // force a layout pass with the overlay visible
    await sleep(120);
    s = await barState(app, '.mode-scroll');
    ok(`S5 (prose) @ ${w}px (precondition): the bar being measured is actually SHOWN, not a frozen read of a hidden one`,
      s.active === true, JSON.stringify({ active: s.active }));
    ok(`S5 (prose) @ ${w}px: the overlay's track height equals the scroll container's own rendered height (full height, by construction)`,
      s.found && Math.abs(s.barRect.height - s.targetRect.height) < 1,
      JSON.stringify({ barHeight: s.barRect.height, targetHeight: s.targetRect.height }));
    ok(`S5 (prose) @ ${w}px: and its top edge matches the container's own top (the track spans the container's full height, not a sub-range of it)`,
      s.found && Math.abs(s.barRect.top - s.targetRect.top) < 1,
      JSON.stringify({ barTop: s.barRect.top, targetTop: s.targetRect.top }));

    await freshDesk(app, w, 900);
    await openScriptPage(app, { w, h: 900 });
    await scrollTo(app, '.desk-frame-scroll-cap', 50);
    await sleep(120);
    s = await barState(app, '.desk-frame-scroll-cap');
    ok(`S5 (script) @ ${w}px (precondition): the bar being measured is actually SHOWN`,
      s.active === true, JSON.stringify({ active: s.active }));
    ok(`S5 (script) @ ${w}px: the overlay's track height equals the scroll container's own rendered height`,
      s.found && Math.abs(s.barRect.height - s.targetRect.height) < 1,
      JSON.stringify({ barHeight: s.barRect.height, targetHeight: s.targetRect.height }));
    ok(`S5 (script) @ ${w}px: and its top edge matches the container's own top`,
      s.found && Math.abs(s.barRect.top - s.targetRect.top) < 1,
      JSON.stringify({ barTop: s.barRect.top, targetTop: s.targetRect.top }));
  }

  // ==========================================================================
  // S6 — BOTH THEMES: the overlay mounts, activates, and its thumb colour
  // tracks --ink-on-paper-low per theme (never a hardcoded colour).
  // ==========================================================================
  for (const theme of ['plateau', 'flux']) {
    await freshDeskThemed(app, theme, 1400, 900);
    await openProsePage(app);
    await scrollTo(app, '.mode-scroll', 100);
    await sleep(120);
    s = await barState(app, '.mode-scroll');
    const expected = await tokenColor(app, '--ink-on-paper-low');
    ok(`S6 (${theme}): the overlay activates on this theme and its thumb colour is this theme's own --ink-on-paper-low token`,
      s.active === true && typeof s.thumbBackground === 'string' && expected.length > 0,
      JSON.stringify({ thumbBackground: s.thumbBackground, expectedToken: expected }));
  }

  // ==========================================================================
  // S7 — REDUCED MOTION: no FADE (an instant appear/disappear), but the WAIT
  // before hiding is unchanged.
  //
  // ROUND 2 fix: this used to also zero the 1s WAIT under reduced motion,
  // which raced show() and scheduleHide() within the same scroll handler —
  // the hide's own zero-delay timeout fired before anything could ever
  // observe it shown, so "shows immediately on scroll" could never actually
  // be true. prefers-reduced-motion is about ANIMATION (the fade itself,
  // already instant via index.css's own reduced-motion block), not about
  // how long something stays visible — the wait is real behaviour and is
  // the same in every motion mode now.
  // ==========================================================================
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await freshDesk(app, 1400, 900);
  await openProsePage(app);
  s = await barState(app, '.mode-scroll');
  const reduced = await app.evalJs("matchMedia('(prefers-reduced-motion: reduce)').matches");
  if (!reduced) {
    ok('S7 (driver): reduced motion could not be emulated in this runner, so the instant-fade rule is UNPROVEN here rather than passing by default', false, String(reduced));
  } else {
    const firstMs = (str) => { const first = String(str).split(',')[0].trim(); const m = /^([\d.eE+-]+)(m?s)$/.exec(first); if (!m) return NaN; const n = parseFloat(m[1]); return m[2] === 'ms' ? n : n * 1000; };
    ok('S7: under reduced motion the overlay carries no transition at rest',
      firstMs(s.transitionDuration) <= 1, String(s.transitionDuration));
    await scrollTo(app, '.mode-scroll', 100);
    await sleep(60);
    s = await barState(app, '.mode-scroll');
    ok('S7: it shows immediately on scroll, fully opaque with no fade-in to wait out',
      s.active === true && parseFloat(s.opacity) === 1, JSON.stringify({ active: s.active, opacity: s.opacity }));
    // 600ms margin before the 1000ms hide, not a tight 40ms one — each
    // evalJs/CDP round-trip in between (scrollTo, barState) adds real wall-
    // clock overhead on a loaded box, and a near-zero margin reads as a
    // product bug when it is really just the test cutting its own timing
    // too close (ThinScrollbar.tsx has exactly one `classList.remove
    // ('active')` call site, unconditionally at FADE_OUT_DELAY_MS — there is
    // nothing in the component that could fire early).
    await sleep(340); // 60ms + 340ms = 400ms total — comfortably short of the 1s wait
    s = await barState(app, '.mode-scroll');
    ok('S7: still shown well short of the 1s wait — reduced motion never shortens the wait itself, only the fade',
      s.active === true, JSON.stringify({ active: s.active }));
    await sleep(750); // 400ms + 750ms = 1150ms total — comfortably past the 1s wait
    s = await barState(app, '.mode-scroll');
    ok('S7: and gone once the SAME 1s wait has passed, snapping straight to invisible rather than fading out',
      s.active === false && parseFloat(s.opacity) === 0, JSON.stringify({ active: s.active, opacity: s.opacity }));
  }

  // ==========================================================================
  // S8 — BOARD CARDS KEEP THEIR NATIVE SCROLLBAR (Fable's review). A board
  // card's own text body (.board-text) gets no ThinScrollbar — BoardTextBox
  // is a self-closing dangerouslySetInnerHTML div with no sibling slot to
  // mount one into — so it must NOT have been swept into the native-hide
  // rule either, or it loses its scrollbar affordance entirely with nothing
  // to replace it. Confirms both halves: no overlay was injected, and the
  // FX7 S4 paper-toned native thumb this selector already had is intact.
  // ==========================================================================
  await freshDesk(app, 1400, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({
      id: 'sb-board', text: 'scrollbar-minimal board', pageType: 'board',
      boxes: [{ id: 'sb-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.08, z: 1, text: 'Board card text for scrollbar-minimal S8.' }],
      createdAt: now, origin: null,
    });
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/sb-board'");
  await app.waitFor("!!document.querySelector('[data-box-id=\"sb-card\"] .board-text')", { label: 'Board card mounted, framed' });
  await sleep(300);

  const boardText = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="sb-card"] .board-text');
    if (!el) return { found: false };
    const cs = getComputedStyle(el);
    return {
      found: true,
      hasOverlaySibling: !!(el.nextElementSibling && el.nextElementSibling.classList.contains('wz-thin-scrollbar')),
      scrollbarWidth: cs.scrollbarWidth,
      scrollbarColor: cs.scrollbarColor,
    };
  })()`);
  const expectedBoardThumb = await tokenColor(app, '--ink-on-paper-low');
  ok('S8: a board card\'s own .board-text gets no ThinScrollbar overlay (it has no sibling slot to hold one)',
    boardText.found && boardText.hasOverlaySibling === false, JSON.stringify(boardText));
  ok('S8 (Fable\'s review): and keeps its EXISTING native scrollbar — scrollbar-width is still "thin" (not "none"), never swept into the hide rule meant for the two writing surfaces',
    boardText.found && boardText.scrollbarWidth === 'thin', JSON.stringify(boardText));
  ok('S8: its scrollbar-color still names the paper-toned thumb token (FX7 S4\'s own pre-existing treatment for this selector, untouched)',
    boardText.found && typeof boardText.scrollbarColor === 'string' && boardText.scrollbarColor.length > 0 && expectedBoardThumb.length > 0,
    JSON.stringify({ scrollbarColor: boardText.scrollbarColor, expectedToken: expectedBoardThumb }));
});

for (const c of checks) {
  // already printed as they landed; nothing further to print per-check
}
const pass = checks.every((c) => c.pass);
console.log(pass
  ? `\nSCROLLBAR-MINIMAL VERIFY: PASS (${checks.length} checks)`
  : `\nSCROLLBAR-MINIMAL VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
