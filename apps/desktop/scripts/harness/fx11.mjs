// FX11 — the Board's Hands (docs/wrizo-alpha/fx11-boards-hands-brief.md).
// Committed CDP verification scenario. Fixtures/technique adopted from
// fx7.mjs/fx8.mjs/bm1.mjs verbatim (the "don't re-derive fixtures" law): live
// box reads via window.wrizoBoard(), rounded trusted-pointer coords, the
// board-mode tabs + projection DOM, the wrizoStructure seam.
// Run: node scripts/harness/fx11.mjs  (from apps/desktop, dist-web freshly built).
//
// Covers: S1 (the isDragging cleanup leak — a viewport resize MID-DRAG now
// clears data-dragging, proving the [pageWidthPx]-effect cleanup fix); S2 (the
// resize-then-move regression GUARD — see the S2 investigation note below); S4
// (the rootless-cycle guard, both layers — withParent refuses an A↔B nest
// through the seam; buildNodes promotes a pre-existing orphan cycle so every
// card still renders in STORYBOARD/OUTLINE, OPEN unaffected). S3's checks live
// in e1.mjs (the export harness); S5's are the 2200 leg added to fx10.mjs.
//
// S2 INVESTIGATION (reproduce-before-patch, the E1 S1 discipline, ruled shipped
// as a guard on Nick's own word): under trusted CDP MOUSE pointer, resize-then-
// move was reproduced across every condition — grow both axes, shrink, an
// immediate (~0ms) move, and a viewport resize BETWEEN the resize and the move
// (which DOES re-run the pointer effect) — and it MOVES the card every time, with
// a control clean-move to prove the technique. Root cause named: a CARD resize
// provably never changes pageWidthPx (setCanvasOverrideW fires ONLY from the
// canvas handle, BoardEditor.tsx onCanvasHandleMove — never from a card resize),
// so the delegated pointer effect never re-runs on a card resize → this is
// PROVABLY DISTINCT from S1 (whose leak requires the effect to re-run). The one
// path a mouse harness cannot exercise is the touch/pen long-press-to-move (the
// board's own touch/pen branch, BoardEditor.tsx ~1338), Nick's S-Pen tablet —
// exactly the "real-hand reliability rests on Nick's own hand" case FX5 S4's
// precedent documents. No blind patch; the checks below GUARD the DoD ("a card
// resized is a card still movable") and Nick's device sitting is the real check.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100, LAPTOP_W = 1280, LEGACY_W = 1000;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};
const freshBoard = async (app, boardId, boxes, width = LAPTOP_W, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX11 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas') || !!document.querySelector('.board-projection')", { label: 'board mounted' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.getBoundingClientRect().toJSON() : null; })()`);
const clickAt = async (app, x, y) => { await app.mouseDown(Math.round(x), Math.round(y)); await sleep(30); await app.mouseUp(Math.round(x), Math.round(y)); };
const liveBox = (app, id) => app.evalJs(`window.wrizoBoard().find(b => b.id === ${JSON.stringify(id)}) ?? null`);
const canvasDragging = (app) => app.evalJs("document.querySelector('.board-canvas')?.dataset.dragging ?? null");
const bodyCursor = (app, id) => app.evalJs(`(() => { const el = document.querySelector('[data-box-id="${id}"] .board-text'); return el ? getComputedStyle(el).cursor : null; })()`);

const selectCard = async (app, id) => {
  const r = await rectOf(app, `[data-box-id="${id}"]`);
  await clickAt(app, r.x + r.width / 2, r.y + 15);
  await sleep(180);
};
const resizeBy = async (app, steps, settle = 320) => {
  const h = await rectOf(app, '.board-handle');
  const hx = Math.round(h.x + h.width / 2), hy = Math.round(h.y + h.height / 2);
  await app.mouseDown(hx, hy); await sleep(30);
  for (const [dx, dy] of steps) { await app.mouseMove(hx + dx, hy + dy); await sleep(45); }
  const last = steps[steps.length - 1];
  await app.mouseUp(hx + last[0], hy + last[1]); await sleep(settle);
};
const moveBody = async (app, id) => {
  const r = await rectOf(app, `[data-box-id="${id}"]`);
  const mx = Math.round(r.x + r.width / 2), my = Math.round(r.y + r.height / 2);
  await app.mouseDown(mx, my); await sleep(30);
  for (const [dx, dy] of [[25, 20], [60, 45], [100, 75]]) { await app.mouseMove(mx + dx, my + dy); await sleep(45); }
  await app.mouseUp(mx + 100, my + 75); await sleep(320);
};
const resurface = async (app) => { await app.mouseMove(200, 6); await sleep(120); await app.mouseMove(200, 30); await sleep(220); };
const switchMode = async (app, mode) => { await resurface(app); const r = await rectOf(app, `.board-mode-tab[data-board-mode-tab="${mode}"]`); if (r) { await clickAt(app, (r.left + r.right) / 2, (r.top + r.bottom) / 2); } await sleep(340); };

await withHarness(async (app) => {
  // ── S1 — the isDragging cleanup leak: a viewport resize MID-DRAG clears it ──
  {
    const BID = 'fx11-s1-board', CID = 'fx11-s1-card';
    await freshBoard(app, BID, [{ id: CID, kind: 'text', x: 0.15, y: 0.15, w: 0.25, h: 0.18, z: 1, text: 'Drag me' }], LAPTOP_W, 900);
    ok('S1: data-dragging is false at rest', (await canvasDragging(app)) === 'false', String(await canvasDragging(app)));
    await selectCard(app, CID);
    // Begin a genuine drag and HOLD (no release).
    const r = await rectOf(app, `[data-box-id="${CID}"]`);
    const mx = Math.round(r.x + r.width / 2), my = Math.round(r.y + r.height / 2);
    await app.mouseDown(mx, my); await sleep(30);
    await app.mouseMove(mx + 20, my + 15); await sleep(40);
    await app.mouseMove(mx + 45, my + 32); await sleep(60);
    ok('S1: mid-drag (button held, past threshold) data-dragging flips true', (await canvasDragging(app)) === 'true', String(await canvasDragging(app)));
    const cursorMid = await bodyCursor(app, CID);
    const wrapBefore = await app.evalJs("document.querySelector('.board-canvas-wrap')?.clientWidth ?? null");
    // Now change the VIEWPORT width mid-drag → the wrap's clientWidth changes →
    // containerWidthPx → pageWidthPx → the [pageWidthPx] pointer effect re-runs,
    // its cleanup fires. BEFORE the fix this left isDragging true (data-dragging
    // stuck, cursors stuck grabbing); the fix clears the flag in the cleanup.
    // Narrow (still >= the 1100 framed floor so the board stays mounted) — a
    // narrow reliably shrinks the framed page column, hence the wrap.
    await app.emulateDpr(1, FLOOR_W, 900); await sleep(350);
    const wrapAfter = await app.evalJs("document.querySelector('.board-canvas-wrap')?.clientWidth ?? null");
    ok('S1: the viewport change actually moved the wrap width (so pageWidthPx changed and the effect had to re-run — the precondition this check depends on)',
      wrapBefore !== null && wrapAfter !== null && Math.abs(wrapAfter - wrapBefore) > 5, JSON.stringify({ wrapBefore, wrapAfter }));
    ok('S1 FIX: a viewport resize mid-drag re-runs the effect and its cleanup CLEARS the flag — data-dragging is back to false (no ghost grip)',
      (await canvasDragging(app)) === 'false', JSON.stringify({ after: await canvasDragging(app), cursorMid, wrapBefore, wrapAfter }));
    ok('S1 FIX: the card-body cursor is no longer stuck grabbing after the mid-drag viewport change',
      (await bodyCursor(app, CID)) !== 'grabbing', String(await bodyCursor(app, CID)));
    await app.mouseUp(mx + 45, my + 32); await sleep(150); // release the still-held pointer
  }

  // ── S2 — the regression GUARD: a card resized is a card still movable ──────
  // (grow + shrink, two cards, both axes via the corner handle, 1280 framed +
  // a legacy sanity). See the S2 INVESTIGATION note in this file's header.
  for (const [label, width] of [['1280 framed', LAPTOP_W], ['legacy (<1100)', LEGACY_W]]) {
    const BID = `fx11-s2-${width}`;
    await freshBoard(app, BID, [
      { id: 'grow', kind: 'text', x: 0.1, y: 0.12, w: 0.2, h: 0.14, z: 1, text: 'Grow then move' },
      { id: 'shrink', kind: 'text', x: 0.55, y: 0.12, w: 0.3, h: 0.24, z: 1, text: 'Shrink then move\nmore body text to keep a floor' },
    ], width, 900);

    // Card 1: GROW (both axes), release, then move.
    await selectCard(app, 'grow');
    const g0 = await liveBox(app, 'grow');
    await resizeBy(app, [[45, 30], [95, 70], [140, 100]]);
    const g1 = await liveBox(app, 'grow');
    ok(`S2 @${label}: the grow-resize grew the card (both axes)`, g1.w > g0.w + 0.005 && g1.h > g0.h + 0.005, JSON.stringify({ w: [g0.w, g1.w], h: [g0.h, g1.h] }));
    await moveBody(app, 'grow');
    const g2 = await liveBox(app, 'grow');
    ok(`S2 @${label}: DoD — after a GROW resize+release the card is still MOVABLE (x/y changed)`,
      Math.abs(g2.x - g1.x) > 0.005 || Math.abs(g2.y - g1.y) > 0.005, JSON.stringify({ x: [g1.x, g2.x], y: [g1.y, g2.y] }));

    // Card 2: SHRINK (both axes), release, then move.
    await selectCard(app, 'shrink');
    const s0 = await liveBox(app, 'shrink');
    await resizeBy(app, [[-30, -25], [-70, -55], [-110, -85]]);
    const s1 = await liveBox(app, 'shrink');
    ok(`S2 @${label}: the shrink-resize shrank the card (at least one axis, honouring the content floor)`, s1.w < s0.w - 0.003 || s1.h < s0.h - 0.003, JSON.stringify({ w: [s0.w, s1.w], h: [s0.h, s1.h] }));
    await moveBody(app, 'shrink');
    const s2 = await liveBox(app, 'shrink');
    ok(`S2 @${label}: DoD — after a SHRINK resize+release the card is still MOVABLE (x/y changed)`,
      Math.abs(s2.x - s1.x) > 0.005 || Math.abs(s2.y - s1.y) > 0.005, JSON.stringify({ x: [s1.x, s2.x], y: [s1.y, s2.y] }));
  }

  // ── S4(a) — withParent refuses an A↔B cycle through the seam ───────────────
  {
    await freshBoard(app, 'fx11-s4a', [
      { id: 'A', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'A' },
      { id: 'B', kind: 'text', x: 0.1, y: 0.3, w: 0.3, h: 0.1, z: 2, text: 'B' },
    ], LAPTOP_W, 900);
    const res = await app.evalJs(`(() => {
      const S = window.wrizoStructure;
      const boxes = window.wrizoBoard();
      const step1 = S.withParent(boxes, 'A', 'B');           // A under B — lawful
      const aUnderB = step1.find(b => b.id === 'A').parentId === 'B';
      const step2 = S.withParent(step1, 'B', 'A');           // B under A — would close A↔B → refused
      const refusedNoop = step2 === step1;                    // clean no-op: same array reference
      const bStillRoot = !step2.find(b => b.id === 'B').parentId;
      const aStillUnderB = step2.find(b => b.id === 'A').parentId === 'B';
      return { aUnderB, refusedNoop, bStillRoot, aStillUnderB };
    })()`);
    ok('S4a: the lawful nest (A under B) is applied', res.aUnderB, JSON.stringify(res));
    ok('S4a: the cycle-closing nest (B under A) is REFUSED — a clean no-op returning the boxes unchanged (same reference), structure intact',
      res.refusedNoop && res.bStillRoot && res.aStillUnderB, JSON.stringify(res));
  }

  // ── S4(b) — buildNodes promotes a pre-existing orphan cycle ────────────────
  // Seed A↔B directly in box data (an older already-cyclic client via sync):
  // each is the other's in-lane child, so NEITHER is a root. Without promotion
  // both vanish from the projections; with it, every card still renders.
  {
    await freshBoard(app, 'fx11-s4b', [
      { id: 'A', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'Card A', parentId: 'B' },
      { id: 'B', kind: 'text', x: 0.1, y: 0.3, w: 0.3, h: 0.1, z: 2, text: 'Card B', parentId: 'A' },
    ], LAPTOP_W, 900);
    // OPEN (default) — the free-card render never uses buildNodes; both present.
    ok('S4b OPEN: both cyclic cards render as free cards (OPEN never projects)',
      (await app.evalJs("!!document.querySelector('[data-box-id=\"A\"]')")) && (await app.evalJs("!!document.querySelector('[data-box-id=\"B\"]')")));
    // Structure seam: both cards appear in the built structure (promoted).
    const inStructure = await app.evalJs(`(() => {
      const S = window.wrizoStructure; const st = S.of(window.wrizoBoard());
      const ids = st.lanes.flatMap(l => S.flattenLane(l));
      return { hasA: ids.includes('A'), hasB: ids.includes('B'), count: ids.length };
    })()`);
    ok('S4b: buildNodes PROMOTES both orphan-cycle members — both A and B appear in the projected structure, neither silently dropped',
      inStructure.hasA && inStructure.hasB, JSON.stringify(inStructure));
    // STORYBOARD + OUTLINE actually render both rows.
    await switchMode(app, 'storyboard');
    const sb = await app.evalJs(`(() => { const p = document.querySelector('[data-board-projection="storyboard"]'); const t = p ? p.textContent : ''; return { present: !!p, hasA: t.includes('Card A'), hasB: t.includes('Card B') }; })()`);
    ok('S4b STORYBOARD: both cards render (promotion holds in the flattened view)', sb.present && sb.hasA && sb.hasB, JSON.stringify(sb));
    await switchMode(app, 'outline');
    const ol = await app.evalJs(`(() => ({ present: !!document.querySelector('[data-board-projection="outline"]'), rowA: !!document.querySelector('[data-outline-row="A"]'), rowB: !!document.querySelector('[data-outline-row="B"]') }))()`);
    ok('S4b OUTLINE: both cards render as rows (promotion holds in the nested view)', ol.present && ol.rowA && ol.rowB, JSON.stringify(ol));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1. FX11 is additive; nothing parked. ==
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nFX11 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; FX11 is a fix ticket, mostly additive, and falsifies no pre-existing assertion (fx10.mjs S5 is a live-section addition, not a park).');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX11 VERIFY: PASS (${checks.length} checks)` : `\nFX11 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
