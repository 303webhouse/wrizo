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

  // 4. THE CARET IS DRAWN WHERE THE TEXT SAYS (a collapsed caret in the editor; Flux's own block caret too)
  if (exp.a === exp.f && late.collapsed && late.focused) {
    const page = late.page;
    const drawnNative = late.caret;
    const drawn = late.theme === 'flux' ? late.fluxCaret : late.caret;
    if (late.theme === 'flux' && !late.fluxCaret) fail('drawn', 'Flux: the block caret is not drawn (no .flux-block-caret) while the selection is a caret in the editor');
    if (!box || box.via === 'rows-drift') notes.push(`drawn place not checked: the page's rows (${late.rows}) are not one per line of the model`);
    else {
      const judge = (name, d) => {
        if (!d) { if (name === 'selection rect') fail('drawn', 'the selection gives no rectangle and no row to fall back to'); return; }
        const dx = d.x - box.x, dy = d.top - box.top;
        const atPageCorner = !!page && d.x <= page.x + TOL.corner && d.top <= page.y + TOL.corner && !(Math.abs(dx) <= TOL.corner && Math.abs(dy) <= TOL.corner);
        const atViewCorner = d.x <= 2 && d.top <= 2 && !(Math.abs(dx) <= 2 && Math.abs(dy) <= 2);
        const offPage = !!page && (d.x < page.x - 2 || d.x > page.x + page.w + 2 || d.top < page.y - 2 || d.top > page.y + page.h + 2);
        if (atPageCorner || atViewCorner) fail('drawn', `${name} at the ${atViewCorner ? 'window' : 'page'}'s top-left corner (${rect(d)}) where the text puts it at ${rect(box)} (${box.via})`);
        else if (offPage && !(Math.abs(dx) <= TOL.x && Math.abs(dy) <= TOL.y)) fail('drawn', `${name} off the page (${rect(d)}; page ${Math.round(page.x)},${Math.round(page.y)} ${Math.round(page.w)}x${Math.round(page.h)})`);
        else if (Math.abs(dx) > TOL.x || Math.abs(dy) > TOL.y) fail('drawn', `${name} at ${rect(d)} but the text puts the caret at ${rect(box)} (${box.via}); off by ${dx.toFixed(1)}, ${dy.toFixed(1)}`);
      };
      if (late.theme === 'flux') { judge('Flux block caret', drawn); if (drawnNative) judge('selection rect', drawnNative); }
      else judge('selection rect', drawn);
    }
  }

  // 5. FOCUS stays in the editor unless the step meant to move it
  if (!expect.blur && !late.focused) fail('focus', `focus left the editor (active element: ${late.active})`);

  // 6. THE PAGE HAS NOT MOVED (law 1: its rectangle is the same before and after)
  if (before && before.page && late.page && !rectEq(before.page, late.page)) fail('page', `the page's rect changed ${JSON.stringify(before.page)} -> ${JSON.stringify(late.page)}`);
  if (before && before.page && early && early.page && !rectEq(before.page, early.page)) fail('page', `the page's rect changed within 2 frames ${JSON.stringify(before.page)} -> ${JSON.stringify(early.page)}`);

  // 7. THE VIEW HAS NOT JUMPED (a short document never scrolls: the scroll changes only when the caret would leave the window)
  if (before && before.scroll && late.scroll && !expect.scroll) {
    if (before.scroll.top !== late.scroll.top || before.scroll.win !== late.scroll.win) fail('view', `scroll moved: scroller ${before.scroll.top} -> ${late.scroll.top}, window ${before.scroll.win} -> ${late.scroll.win}`);
  }

  // 9. NO ERROR IN THE CONSOLE
  if (errors.length) fail('console', errors.slice(0, 2).map((e) => short(e, 120)).join(' | '));

  return { fails, notes };
}
