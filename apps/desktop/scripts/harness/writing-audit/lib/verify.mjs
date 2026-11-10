// THE VERDICT FOR ONE STEP (writing audit, session 1; brief §6). Pure: it takes what the model expects and what the page-side reader saw, and names every check that failed. No browser here, so
// model-unit.mjs proves it against synthetic reads (a caret at the page's corner, a moved page, a lost focus ...) without one - the reader's detectors are tested before the app is.
//   exp     { text, a, f }  the model's state after the step
//   box     the model's expected DRAWN place for exp.f (probe.boxAt): { via, x, top, height }
//   before  the reader's output just before the step; early / late: just after (two frames, then ~350 ms: the app's own delayed caret work lands in `late`)
//   errors  console errors/exceptions the page raised during the step
// The nine checks of §6 that session 1 covers: text, caret offset, drawn place, focus, page rect, view, console, plus `settled` (early == late: a caret that moves after the keystroke is bug 33's shape).
// Undo/redo and save/reload are checked by their own case kinds (s1-caret.mjs), not here.
export const TOL = { x: 3, y: 4, rect: 0.5, corner: 12 };

const near = (a, b, t) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= t;
const rectEq = (a, b) => !!a && !!b && near(a.x, b.x, TOL.rect) && near(a.y, b.y, TOL.rect) && near(a.w, b.w, TOL.rect) && near(a.h, b.h, TOL.rect);
const short = (s, n = 70) => { const j = JSON.stringify(s); return j.length > n ? j.slice(0, n) + '…"' : j; };
const rect = (r) => (r ? `${Math.round(r.x)},${Math.round(r.top ?? r.y)}` : 'none');

export function verify({ exp, box, before, early, late, errors = [], expect = {} }) {
  const fails = [], notes = [];
  const fail = (check, detail) => fails.push({ check, detail });
  if (!late || !late.editor) { fail('editor', 'the editor is not on the page'); return { fails, notes }; }

  // 1. TEXT: no lost, doubled or reordered characters, no stray paragraph. A non-breaking space the browser slipped in is noted, not failed (the saved text is what a reader sees).
  const lateText = (late.text || '').replace(/ /g, ' ');
  if (lateText !== exp.text) fail('text', `got ${short(late.text)} want ${short(exp.text)}`);
  else if (late.text !== exp.text) notes.push('nbsp: the page holds a non-breaking space where the model has a plain space');

  // 2. THE CARET'S PLACE IN THE TEXT (the selection, read by range arithmetic)
  if (late.anchor === null || late.focus === null) fail('caret', `the selection is not in the editor (it is in ${late.selNode ?? 'nothing'})`);
  else if (late.anchor !== exp.a || late.focus !== exp.f) fail('caret', `selection ${late.anchor}..${late.focus} want ${exp.a}..${exp.f}`);

  // 3. SETTLED: the keystroke's own result stays put (nothing moves the caret or the text 350 ms later)
  if (early && (early.anchor !== late.anchor || early.focus !== late.focus || early.text !== late.text)) {
    fail('settled', `after 2 frames: selection ${early.anchor}..${early.focus} text ${short((early.text || '').slice(0, 40))}; settled: ${late.anchor}..${late.focus} text ${short((late.text || '').slice(0, 40))}`);
  }

  // 4. THE CARET IS DRAWN WHERE THE TEXT SAYS (a collapsed caret in the editor). Flux paints its own block caret (an element: its box is the drawn place). Arbor and Machina use the browser's native caret, which is
  //    read from the PIXELS (late.px: the forced-magenta caret found in a screenshot, probe.mjs `scan`), because the rectangle a range reports is not where the caret is painted (run 42918219726).
  if (exp.a === exp.f && late.collapsed && late.focused) {
    const page = late.page, flux = late.theme === 'flux';
    const drawn = flux ? late.fluxCaret : late.px;
    const what = flux ? 'Flux block caret' : 'native caret (painted)';
    const at = late.selPoint ? ` [selection: ${late.selPoint}]` : '';
    if (!drawn) fail('drawn', flux ? `Flux: the block caret is not drawn (no .flux-block-caret) while the selection is a caret in the editor${at}` : `no caret is painted anywhere on screen (looked in ${late.pxTries ?? '?'} screenshots, by forced colour and by difference; computed caret-color ${late.caretColor}, forced-colour sheet in place: ${late.armed})${at}`);
    else if (!box || box.via === 'rows-drift') notes.push(`drawn place not checked: the page's rows (${late.rows}) are not one per line of the model`);
    else {
      const dx = drawn.x - box.x;
      // vertical: the centre of the drawn caret against the expected line (a caret is shorter than its line box, and sits inside it)
      const cy = drawn.top + (drawn.height || 0) / 2, ey = box.top + (box.height || 0) / 2, dy = cy - ey;
      const tolY = Math.max(TOL.y, (box.height || 0) * 0.45);
      const atPageCorner = !!page && drawn.x <= page.x + TOL.corner && drawn.top <= page.y + TOL.corner && !(Math.abs(dx) <= TOL.corner && Math.abs(dy) <= TOL.corner);
      const atViewCorner = drawn.x <= 2 && drawn.top <= 2 && !(Math.abs(dx) <= 2 && Math.abs(dy) <= 2);
      const offPage = !!page && (drawn.x < page.x - 2 || drawn.x > page.x + page.w + 2 || drawn.top < page.y - 2 || drawn.top > page.y + page.h + 2);
      if (atPageCorner || atViewCorner) fail('drawn', `${what} at the ${atViewCorner ? 'window' : 'page'}'s top-left corner (${rect(drawn)}) where the text puts it at ${rect(box)} (${box.via})${at}`);
      else if (offPage && !(Math.abs(dx) <= TOL.x && Math.abs(dy) <= tolY)) fail('drawn', `${what} off the page (${rect(drawn)}; page ${Math.round(page.x)},${Math.round(page.y)} ${Math.round(page.w)}x${Math.round(page.h)})${at}`);
      else if (Math.abs(dx) > TOL.x || Math.abs(dy) > tolY) fail('drawn', `${what} at ${rect(drawn)} but the text puts the caret at ${rect(box)} (${box.via}); off by ${dx.toFixed(1)}, ${dy.toFixed(1)}${at}`);
    }
  }

  // 5. FOCUS stays in the editor unless the step meant to move it
  if (!expect.blur && !late.focused) fail('focus', `focus left the editor (active element: ${late.active})`);

  // 6. THE PAGE HAS NOT MOVED (law 1: its rectangle is the same before and after)
  if (before && before.page && late.page && !rectEq(before.page, late.page)) fail('page', `the page's rect changed ${JSON.stringify(before.page)} -> ${JSON.stringify(late.page)}`);
  if (before && before.page && early && early.page && !rectEq(before.page, early.page)) fail('page', `the page's rect changed within 2 frames ${JSON.stringify(before.page)} -> ${JSON.stringify(early.page)}`);

  // 7. THE VIEW HAS NOT JUMPED (a short document never scrolls: the scroll changes only when the caret would leave the window)
  if (before && before.scroll && late.scroll && !expect.scroll) {
    if (before.scroll.top !== late.scroll.top || before.scroll.win !== late.scroll.win) fail('view', `scroll moved: scroller ${before.scroll.top} -> ${late.scroll.top} (scrollHeight ${late.scroll.scrollerH}, clientHeight ${late.scroll.clientH}), window ${before.scroll.win} -> ${late.scroll.win}; the caret is at ${late.px ? late.px.x + ',' + late.px.top : late.fluxCaret ? Math.round(late.fluxCaret.x) + ',' + Math.round(late.fluxCaret.top) : 'unseen'} in a page ${late.page ? Math.round(late.page.y) + '..' + Math.round(late.page.y + late.page.h) : '?'} tall`);
  }

  // 9. NO ERROR IN THE CONSOLE
  if (errors.length) fail('console', errors.slice(0, 2).map((e) => short(e, 120)).join(' | '));

  return { fails, notes };
}
