// ITEM 118 — the board interaction fix cluster (docs/open-threads.md's own
// "ITEM 118 — THE BOARD INTERACTION FIX CLUSTER" charter + its S0 passes 1
// and 2). A committed CDP verification scenario, per AGENTS.md's "Harness
// scenarios persist".
// Run: node scripts/harness/item118.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// SCOPE OF THIS FILE, AND WHY IT IS NARROW. S0 pass 1 drove (b) resize-once
// and (c) edge-vanish under a mouse on a one-text-card user board and NEITHER
// REPRODUCED; (e) unlink could not even be set up. Those three are PARKED
// UNBUILT awaiting a reproduction under Nick's own conditions — this file
// deliberately asserts NOTHING about them, because a harness that "passes"
// against a defect nobody can reproduce is worse than no harness at all.
// S0 pass 2 read defect (a) in source and split it three ways; exactly ONE of
// the three needs no ruling, and that one is what this file covers:
//
//   (a-ii) THE RESTING CARD NEVER CALLED THE DECORATION ENGINE. BoardTextBox
//   rendered `{initialText}` as a bare text node, so on the board itself
//   every markdown marker was literal and nothing was styled — bold and
//   italic included. Decoration only ever ran inside the opened popup.
//
// FX5 S6's own recorded verdict already governs this ("asterisks visible on a
// card is a bug, not a style choice — the popup shows words, not syntax"), and
// it applies with MORE force to the resting card than to the popup it was
// written for. The repair is the popup's own engine, called with a NULL caret:
// nothing is adjacent to nothing, so every marker collapses (`md-mark-hidden`)
// and the writer gets styled words.
//
// NOT COVERED, DELIBERATELY:
//   (a-i) underline has no renderer anywhere (page rail AND card dock ship a
//   U button; `applyFormat` writes `__word__`; no decorator case, no
//   `.md-underline` in CSS). Two lawful repairs point opposite ways — retire
//   the buttons, or give underline a renderer — so it is ROUTED TO FABLE and
//   NOT taken here. A fix lane does not unfreeze a standing design ruling.
//   (a-iii) B/I/U on an EMPTY selection emit bare `****` by design
//   (wrapSelection + reveal-adjacent-to-caret). Working as specified; the
//   specification is what reads as broken. A ruling, not a patch.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// fx4.mjs's own freshDesk/freshBoard shape, reused rather than reinvented.
// The raw-localStorage write here is lawful in THIS shape and only this one:
// an `app.reload()` follows it immediately, so the store's in-memory cache is
// built FROM the written bytes rather than racing them. (The seeding law that
// forbids raw collection writes is about a live cache overwriting a seed —
// there is no live cache here yet.)
const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshBoard = async (app, boardId, boxes, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: ${JSON.stringify(boardId)}, text: 'Item 118 Board', pageType: 'board', boxes: ${JSON.stringify(boxes)}, createdAt: now, origin: null });
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

await withHarness(async (app) => {
  // ==========================================================================
  // (a-ii) — the resting card renders through the decoration engine.
  // ==========================================================================
  const RAW = '**bold words** and *slanted* here';
  await freshBoard(app, 'i118-a2-board', [
    { id: 'i118-a2-card', kind: 'text', x: 0.05, y: 0.05, w: 0.35, h: 0.12, z: 1, text: RAW },
  ]);

  const resting = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="i118-a2-card"] .board-text');
    if (!el) return { missing: true };
    const marks = [...el.querySelectorAll('.md-mark')];
    return {
      missing: false,
      bold: !!el.querySelector('.md-bold'),
      italic: !!el.querySelector('.md-italic'),
      boldText: (el.querySelector('.md-bold') || {}).textContent || null,
      markCount: marks.length,
      allMarksHidden: marks.length > 0 && marks.every(m => m.classList.contains('md-mark-hidden')),
      textContent: el.textContent,
      renderedHeight: el.scrollHeight,
    };
  })()`);

  ok('(a-ii): a card sitting on the board renders its bold run through the SAME decoration engine the opened popup uses — not as a bare text node (BoardTextBox no longer returns {initialText} raw)',
    resting.bold, JSON.stringify(resting));

  ok('(a-ii): the italic run is styled on the resting card too — the whole shared inline pass reaches the board, not just the bold case',
    resting.italic, JSON.stringify(resting));

  ok('(a-ii): with NO caret on a resting card, EVERY marker collapses (md-mark-hidden) — the writer sees words, not syntax; this is the null-caret reading of reveal-adjacent-to-caret, not a second rendering register',
    resting.allMarksHidden, JSON.stringify(resting));

  // THE STORAGE INVARIANT. draftDecoration.ts's own header explains why the
  // marks are collapsed via font-size:0 rather than display:none — an
  // always-hidden marker vanishes from innerText and would silently strip the
  // markdown characters out of stored text. The resting card is read-only, so
  // it cannot strip anything itself; this check exists so that if anyone ever
  // "simplifies" the hiding to display:none, the failure lands HERE, loudly,
  // rather than in the writer's saved words.
  ok('(a-ii) STORAGE INVARIANT: decoration is presentation only — the card textContent still carries every markdown character, byte-for-byte, exactly as stored',
    resting.textContent === RAW, JSON.stringify({ got: resting.textContent, want: RAW }));

  // The one risk S0 pass 2 named and would not assume: cards auto-size from
  // the rendered DOM's scrollHeight, and collapsed marks are font-size:0, so
  // decorated text measures SHORTER than raw. The measure effect only ever
  // GROWS a card (`measuredPx - storedPx <= TOLERANCE` returns the box
  // unchanged), so no card can shrink under this change — but "reasoned" is
  // not "proven", so the height is read back and asserted directly.
  const geom = await app.evalJs(`(() => {
    const box = document.querySelector('[data-box-id="i118-a2-card"]');
    const r = box.getBoundingClientRect();
    const stored = (window.wrizoBoard() || []).find(b => b.id === 'i118-a2-card');
    return { renderedH: r.height, storedH: stored ? stored.h : null };
  })()`);
  ok('(a-ii) NO COLLAPSE: decorating the resting card does not shrink it — the auto-size effect only ever grows a card, so shorter measured text leaves the stored height alone',
    geom.renderedH > 0 && geom.storedH === 0.12, JSON.stringify(geom));

  // ==========================================================================
  // REGRESSION — the popup's own decoration is untouched by the above. The
  // resting card and the opened editor now share one engine; this proves the
  // shared call did not change the editor's behaviour (its caret is real, so
  // its markers still reveal adjacent to it — the opposite of the card).
  // ==========================================================================
  await app.evalJs('(() => { const el = document.querySelector(\'[data-box-id="i118-a2-card"]\'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()');
  await app.waitFor("!!document.querySelector('.board-popup')", { label: 'popup open' });
  await sleep(250);
  const popup = await app.evalJs(`(() => {
    const ed = document.querySelector('.board-popup-editor');
    return {
      bold: !!ed.querySelector('.md-bold'),
      italic: !!ed.querySelector('.md-italic'),
      text: ed.innerText,
    };
  })()`);
  ok('REGRESSION: the opened popup still decorates exactly as before — the resting card borrowing its engine did not disturb the editor register',
    popup.bold && popup.italic, JSON.stringify(popup));
});

// ============================================================================
// (c) EDGE ESCAPE — THE RIGHT EDGE, ON A POPULATED BOARD (S0 pass 3).
//
// S0 pass 1 drove ONE card on a default board and reported (c) NOT REPRODUCED.
// It was testing the wrong corner: the TOP-LEFT clamps (Math.max(0, …) has
// always been there), so a single top-left drag "proved" containment that does
// not exist on the other side. Under Nick's own stage — populated board, mouse
// — a card dragged right ended up hanging 750px PAST the canvas.
//
// THE TWO AXES ARE DIFFERENT BUGS AND ONLY ONE IS A BUG. The canvas HEIGHT is
// content-driven and grows to fit (measured: 1455 -> 2070px to contain a card
// dragged down), so downward travel needs only the far-away BOARD_MAX_Y cap
// FX17 S3 gave it. The WIDTH cannot grow — it is pageWidthPx — so a card past
// the right edge is outside a board that will never reach it. Both halves are
// asserted below, because a fix that stopped the card AND froze the growing
// board would be a regression wearing a fix's clothes.
// ============================================================================
await withHarness(async (app) => {
  const stage = [];
  let n = 0;
  for (let row = 0; row < 5; row++) for (let col = 0; col < 2; col++) {
    n += 1;
    stage.push({ id: `i118c-${n}`, kind: 'text', x: col === 0 ? 0.06 : 0.52, y: 0.04 + row * 0.18,
      w: 0.34, h: 0.13, z: n, text: `Card ${n}` });
  }
  stage.push({ id: 'i118c-right', kind: 'text', x: 0.60, y: 0.30, w: 0.30, h: 0.10, z: 22, text: 'Right traveller.' });
  stage.push({ id: 'i118c-down', kind: 'text', x: 0.10, y: 0.60, w: 0.30, h: 0.10, z: 23, text: 'Down traveller.' });
  stage.push({ id: 'i118c-link', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 30, connA: 'i118c-1', connB: 'i118c-2' });
  stage.push({ id: 'i118c-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasW: 1500, canvasH: 1100 });

  await freshBoard(app, 'i118c-board', stage);
  await app.evalJs(`
    window.__pt = function(el, type, x, y) {
      el.dispatchEvent(new PointerEvent(type, {clientX:x, clientY:y, pointerId:1, pointerType:'mouse',
        bubbles:true, cancelable:true, isPrimary:true, button:0, buttons: type==='pointerup'?0:1}));
    };
    window.__drag = function(id, dx, dy) {
      const el = document.querySelector('[data-box-id="' + id + '"]');
      const r = el.getBoundingClientRect();
      const x0 = r.left + r.width/2, y0 = r.top + r.height/2;
      window.__pt(el, 'pointerdown', x0, y0);
      for (let i=1;i<=12;i++) window.__pt(el, 'pointermove', x0 + dx*i/12, y0 + dy*i/12);
      window.__pt(el, 'pointerup', x0+dx, y0+dy);
    };
    window.__geo = function(id) {
      const c = document.querySelector('.board-canvas').getBoundingClientRect();
      const b = document.querySelector('[data-box-id="' + id + '"]').getBoundingClientRect();
      return { canvasW: Math.round(c.width), canvasH: Math.round(c.height),
               overRight: Math.round(b.right - c.right), overBottom: Math.round(b.bottom - c.bottom) };
    };
  `);
  await sleep(300);

  const xBefore = await app.evalJs("window.__geo('i118c-right')");
  await app.evalJs("window.__drag('i118c-right', 900, 0)");
  await sleep(600);
  const xAfter = await app.evalJs("window.__geo('i118c-right')");

  ok('(c): a card dragged hard RIGHT stops at the canvas edge instead of sliding past it — the hard stop FX17 S3 gave the bottom, now on the side that could not grow to compensate',
    xAfter.overRight <= 1, JSON.stringify({ xBefore, xAfter }));

  ok('(c): and the canvas did NOT silently widen to swallow the drag — the stop is a stop, not a board that grew sideways (width cannot grow; that is the whole reason the card had to be held)',
    xAfter.canvasW === xBefore.canvasW, JSON.stringify({ before: xBefore.canvasW, after: xAfter.canvasW }));

  const yBefore = await app.evalJs("window.__geo('i118c-down')");
  await app.evalJs("window.__drag('i118c-down', 0, 900)");
  await sleep(600);
  const yAfter = await app.evalJs("window.__geo('i118c-down')");

  ok('(c) NOT OVER-FIXED: dragging DOWN still grows the board, exactly as before — the vertical axis was never the defect, and a clamp that froze the growing canvas would be a regression wearing a fix\'s clothes',
    yAfter.canvasH > yBefore.canvasH, JSON.stringify({ before: yBefore.canvasH, after: yAfter.canvasH }));

  ok('(c) NOT OVER-FIXED: the downward card is still CONTAINED by the board it grew — it neither escapes nor gets pinned short of where the writer dropped it',
    yAfter.overBottom <= 1, JSON.stringify(yAfter));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `
ITEM118 VERIFY: PASS (${checks.length} checks)`
  : `
ITEM118 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
