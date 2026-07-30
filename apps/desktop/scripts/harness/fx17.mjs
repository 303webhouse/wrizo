// FX17 — the Board's Floor (docs/wrizo-alpha/p2-wave.md §FX17, item 74;
// authority SV21/SV22/SV23). A committed CDP verification scenario.
// Run: node scripts/harness/fx17.mjs   (from apps/desktop, dist-web freshly
// built via `pnpm run build:web`).
//
// `freshBoard`/`rectOf`/`liveBox` are adopted from fx13.mjs VERBATIM — the
// standing "don't re-derive fixtures" law, and fx13 is this ticket's own
// predecessor (it gave the board its height law; FX17 finishes it).
//
// EVERY DRAG HERE USES A TRUSTED POINTER — Input.dispatchMouseEvent via
// app.mouseDown/mouseMove/mouseUp, i.e. real browser input events with
// isTrusted true — never element.dispatchEvent of a synthetic PointerEvent.
// The brief made this binding for S1, and it is not a formality: the defect
// this file locks down was a LAYOUT feedback loop driven by real event
// cadence, and fx5.mjs's own S4 note already records that a synthetic replay
// bypasses the hit-testing that pointer capture exists to stabilize.
//
// Covers S1–S3. S4 (fit-to-content) YIELDED by Fable's ruling and is item 78,
// post-vacation — deliberately unasserted here; a check for it would be
// asserting a thing that does not exist.
//
//   S1 the stutter — the gutter is genuinely reserved, and across a full
//      trusted bottom-edge drag the scrollbar NEVER flips, the wrap's
//      clientWidth holds ONE value, and the canvas height only ever grows.
//   S2 the floor — at 1366x768 the wrap reaches the stage bottom, the canvas
//      exactly fills the wrap's content box (zero residual scroll), the
//      standing width is 1088, and legacy (<1100px) keeps its constant floor.
//   S3 the stop — a card cannot be dragged past BOARD_MAX_Y; the canvas
//      reaches its limit on the SAME frame (exactness); a grouped selection
//      keeps its shape through the landing; and a card already below the
//      limit is never relocated by the limit's arrival.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LEG_W = 1366, LEG_H = 768;   // the canonical small-laptop leg (fx13's own)
const LEGACY_W = 1000;             // below DESKFRAME_MIN_WIDTH — the untouched path
const STANDING_WRAP_W = 1088;      // Fable's rider: with the gutter reserved this is
                                   // the wrap's standing clientWidth at LEG_W,
                                   // scrollbar or not. Assertions are written
                                   // against this, never the pre-FX17 1098.
// The STATED LIMIT, asserted literally on purpose. These mirror BoardEditor.tsx's
// BOARD_MAX_Y / BOARD_BREATHING_ROOM, which are module-private. Hard-coding them
// here is the point rather than a shortcut: SV22 requires the limit be named, so a
// future change to it must red this file and force the ledger to be updated with
// it. A harness that read the constant from the app could never notice it moved.
const BOARD_MAX_Y = 3;
const BREATHING = 0.08;
const MAX_CARD_BOTTOM = BOARD_MAX_Y - BREATHING;

// --- fx13.mjs's fixtures, verbatim ------------------------------------------
const freshBoard = async (app, boardId, boxes, width, height) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before board fixture' });
  await app.emulateDpr(1, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX17 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board mounted' });
  await sleep(350);
  await app.emulateDpr(1, width, height);
  await sleep(400);
};
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const b = el.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) }; })()`);
const liveBox = (app, id) => app.evalJs(`(window.wrizoBoard ? window.wrizoBoard().find(b => b.id === ${JSON.stringify(id)}) : null) ?? null`);

// --- FX17's own instrument --------------------------------------------------
// The frame-clock recorder. Every quantity in S1's claim is sampled INSIDE the
// page on requestAnimationFrame, so no CDP round-trip latency can hide an
// oscillation that happened between two harness-side reads. This is the same
// discipline DF1.1 S1 established for tu2's meter: observe the observable on the
// browser's clock, never sample it from outside.
const startRecorder = (app) => app.evalJs(`(() => {
  window.__fx17 = { s: [] };
  const wrap = document.querySelector('.board-canvas-wrap');
  const canvas = document.querySelector('.board-canvas');
  let stop = false;
  const tick = () => {
    if (stop) return;
    const r = canvas.getBoundingClientRect();
    window.__fx17.s.push({
      cw: wrap.clientWidth,
      gutter: wrap.offsetWidth - wrap.clientWidth,
      canvasW: Math.round(r.width),
      canvasH: Math.round(r.height),
      scrollH: wrap.scrollHeight,
      clientH: wrap.clientHeight,
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.__fx17.stop = () => { stop = true; };
  return true;
})()`);
const readRecorder = async (app) => {
  await app.evalJs('window.__fx17 && window.__fx17.stop()');
  const s = await app.evalJs('window.__fx17.s');
  let gutterFlips = 0, heightDrops = 0;
  for (let i = 1; i < s.length; i++) {
    if (s[i].gutter !== s[i - 1].gutter) gutterFlips++;
    if (s[i].canvasH < s[i - 1].canvasH) heightDrops++;
  }
  return {
    frames: s.length,
    gutterFlips,
    heightDrops,
    widths: [...new Set(s.map(x => x.cw))],
    canvasWidths: [...new Set(s.map(x => x.canvasW))],
    heights: [...new Set(s.map(x => x.canvasH))],
  };
};

// A trusted-pointer drag of a card by (dx, dy) client px, in hand-sized steps.
// Scrolls the card into view first when it sits below the fold, because a real
// pointer can only ever grab what is actually on screen.
const dragCard = async (app, boxId, dx, dy, steps = 24) => {
  await app.evalJs(`(() => {
    const wrap = document.querySelector('.board-canvas-wrap');
    const el = document.querySelector('[data-box-id=${JSON.stringify(boxId)}]');
    if (!el) return false;
    const r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    if (r.top < w.top + 40 || r.bottom > w.bottom - 40) wrap.scrollTop += (r.top - w.top) - 120;
    return true;
  })()`);
  await sleep(250);
  const p = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id=${JSON.stringify(boxId)}]');
    if (!el) return null; const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + Math.min(r.height / 2, 18)) };
  })()`);
  if (!p) return null;
  await app.mouseMove(p.x, p.y);
  await app.mouseDown(p.x, p.y);
  for (let i = 1; i <= steps; i++) {
    await app.mouseMove(Math.round(p.x + (dx * i) / steps), Math.round(p.y + (dy * i) / steps));
    await sleep(22);
  }
  await sleep(260);
  await app.mouseUp(Math.round(p.x + dx), Math.round(p.y + dy));
  await sleep(320);
  return p;
};

await withHarness(async (app) => {
  // ══ S1 — the stutter (SV22): the loop is gone, proven on the frame clock ══
  {
    await freshBoard(app, 'fx17-s1', [
      { id: 'c1', kind: 'text', x: 0.10, y: 0.10, w: 0.25, h: 0.12, text: 'drag me', z: 1 },
    ], LEG_W, LEG_H);

    // The fix's own mechanism, asserted directly: the gutter is RESERVED even
    // when there is nothing to scroll. This is what makes clientWidth constant,
    // and it is the difference between the loop existing and not existing.
    const atRest = await app.evalJs(`(() => {
      const w = document.querySelector('.board-canvas-wrap');
      return { gutter: w.offsetWidth - w.clientWidth, scrollable: w.scrollHeight - w.clientHeight, clientW: w.clientWidth };
    })()`);
    ok('S1: the scrollbar gutter is RESERVED even with nothing to scroll — the measured width no longer depends on whether a scrollbar is showing (the feedback edge is gone at its source)',
      atRest.gutter > 0 && atRest.scrollable <= 0, JSON.stringify(atRest));

    await startRecorder(app);
    const wrapBottom = (await rectOf(app, '.board-canvas-wrap')).b;
    const cardTop = (await rectOf(app, '[data-box-id="c1"]')).t;
    await dragCard(app, 'c1', 0, (wrapBottom - 8) - cardTop, 40);
    const r = await readRecorder(app);

    ok('S1: THE STUTTER IS GONE — across a full trusted-pointer drag to the bottom edge the scrollbar gutter NEVER flips (pre-fix: 71 flips in 142 frames, one every other frame)',
      r.frames > 40 && r.gutterFlips === 0, JSON.stringify({ frames: r.frames, gutterFlips: r.gutterFlips }));
    ok('S1: the wrap\'s clientWidth holds a SINGLE value throughout the drag (pre-fix it oscillated 1098<->1088, exactly the scrollbar\'s 10px)',
      r.widths.length === 1, JSON.stringify(r.widths));
    ok('S1: the canvas WIDTH holds a single value throughout the drag — nothing downstream of the width is being rescaled mid-gesture',
      r.canvasWidths.length === 1, JSON.stringify(r.canvasWidths));
    ok('S1: the canvas height is MONOTONE across the drag — it grows as the card descends and never once shrinks (a single drop would be the loop restarting)',
      r.heightDrops === 0 && r.heights.length > 1, JSON.stringify({ heightDrops: r.heightDrops, distinctHeights: r.heights.length }));
  }

  // ══ S2 — the floor (SV21), at the mandatory 1366x768 leg ═════════════════
  {
    await freshBoard(app, 'fx17-s2', [
      { id: 'c1', kind: 'text', x: 0.10, y: 0.10, w: 0.25, h: 0.12, text: 'one card', z: 1 },
    ], LEG_W, LEG_H);
    const g = await app.evalJs(`(() => {
      const wrap = document.querySelector('.board-canvas-wrap');
      const stage = document.querySelector('.desk-frame-stage');
      const canvas = document.querySelector('.board-canvas');
      return {
        stageBottom: Math.round(stage.getBoundingClientRect().bottom),
        wrapBottom: Math.round(wrap.getBoundingClientRect().bottom),
        clientW: wrap.clientWidth, clientH: wrap.clientHeight, scrollH: wrap.scrollHeight,
        canvasH: Math.round(canvas.getBoundingClientRect().height),
        viewportH: window.innerHeight,
      };
    })()`);
    ok(`S2 (1366x768): the wrap's standing clientWidth is ${STANDING_WRAP_W} — the gutter is reserved permanently, so this is the width with or without a scrollbar`,
      g.clientW === STANDING_WRAP_W, JSON.stringify({ clientW: g.clientW }));
    ok('S2 (1366x768): THE BOARD REACHES ITS FLOOR — the wrap now ends at the stage\'s own bottom (within the 2px of its deliberate border), where before FX17 it stopped 39px short and left granted room unspent',
      g.stageBottom - g.wrapBottom >= 0 && g.stageBottom - g.wrapBottom <= 3, JSON.stringify({ stageBottom: g.stageBottom, wrapBottom: g.wrapBottom, gap: g.stageBottom - g.wrapBottom }));
    ok('S2 (1366x768): the canvas fills the wrap\'s CONTENT box exactly — zero residual scroll on a lightly-populated board (the 2px border term). A board that always has something to scroll has not reached its floor',
      g.scrollH === g.clientH && g.canvasH === g.clientH, JSON.stringify({ canvasH: g.canvasH, clientH: g.clientH, scrollH: g.scrollH, residual: g.scrollH - g.clientH }));
    ok('S2 (1366x768): the whole wrap is still IN THE ROOM — FX13\'s law is unchanged and governs (chrome fits the room, content scrolls within its wrap)',
      g.wrapBottom <= g.viewportH, JSON.stringify({ wrapBottom: g.wrapBottom, viewportH: g.viewportH }));
  }

  // ── S2 — legacy (<1100px) is untouched: no DeskFrame, so no room to measure
  //    and the constant floor (VIEWPORT_MIN_PX, 560) still governs. This is the
  //    byte-identical path the change is explicitly gated out of.
  {
    await freshBoard(app, 'fx17-s2legacy', [
      { id: 'c1', kind: 'text', x: 0.10, y: 0.10, w: 0.25, h: 0.12, text: 'legacy', z: 1 },
    ], LEGACY_W, LEG_H);
    const l = await app.evalJs(`(() => {
      const canvas = document.querySelector('.board-canvas');
      return { framed: !!document.querySelector('.desk-frame-stage'), canvasH: canvas ? Math.round(canvas.getBoundingClientRect().height) : null };
    })()`);
    ok('S2 legacy (<1100px): no DeskFrame stage exists, so availHeightPx stays null and the canvas keeps its pre-FX17 constant floor of 560 — the untouched path, unconditionally',
      l.framed === false && l.canvasH === 560, JSON.stringify(l));
  }

  // ══ S3 — the stop, its exactness (SV22) ══════════════════════════════════
  // Seeded just ABOVE the limit so the crossing happens on THIS fixture's own
  // trusted drag — the same boundary-bracketing m3/m4 use for the word goal. A
  // card cannot be dragged 2900px in a 768px-tall window, so the fixture brings
  // the boundary to the pointer rather than the reverse.
  {
    const startY = 2.60, cardH = 0.12;
    await freshBoard(app, 'fx17-s3', [
      { id: 'c1', kind: 'text', x: 0.10, y: startY, w: 0.25, h: cardH, text: 'to the floor', z: 1 },
    ], LEG_W, LEG_H);
    await startRecorder(app);
    await dragCard(app, 'c1', 0, 420, 30);   // ~0.39 normalized: overshoots the limit
    const r = await readRecorder(app);
    const box = await liveBox(app, 'c1');
    const geo = await app.evalJs(`(() => {
      const canvas = document.querySelector('.board-canvas');
      const rc = canvas.getBoundingClientRect();
      return { canvasW: Math.round(rc.width), canvasH: Math.round(rc.height) };
    })()`);
    const bottom = box ? box.y + box.h : null;

    ok(`S3: THE HARD STOP — the card cannot be dragged past the stated limit: its bottom lands at or above BOARD_MAX_Y - ${BREATHING} = ${MAX_CARD_BOTTOM}, despite the pointer travelling well beyond it`,
      bottom != null && bottom <= MAX_CARD_BOTTOM + 0.005, JSON.stringify({ y: box && box.y, bottom, limit: MAX_CARD_BOTTOM }));
    ok('S3: the card actually TRAVELLED to the stop rather than being refused — it moved down from its seeded position and came to rest against the limit',
      box != null && box.y > startY, JSON.stringify({ from: startY, to: box && box.y }));
    ok(`S3: THE STOP IS EXACT — at the stop the canvas measures BOARD_MAX_Y x its own width (${BOARD_MAX_Y} x canvasW), because the clamp and the height formula share the same ${BREATHING} breathing term: the limit is reached on the very frame the card stops, with no dead zone travelled first and nothing to spring back from`,
      Math.abs(geo.canvasH - BOARD_MAX_Y * geo.canvasW) <= 3, JSON.stringify({ canvasH: geo.canvasH, expected: BOARD_MAX_Y * geo.canvasW, canvasW: geo.canvasW }));
    ok('S3: NO STUTTER AT THE STOP — the gutter never flips and the canvas height never shrinks while the card lands and holds against the limit (a rubber-band would show as a height drop here)',
      r.gutterFlips === 0 && r.heightDrops === 0, JSON.stringify({ frames: r.frames, gutterFlips: r.gutterFlips, heightDrops: r.heightDrops }));
  }

  // ══ S3 — the group-shape invariant ═══════════════════════════════════════
  // Two cards sharing a groupId move together (BoardEditor's groupMembers). The
  // clamp is applied to the shared delta precisely so the LOWEST card hitting the
  // floor cannot leave the others still travelling — the selection must not
  // deform as it lands. Asserted on the pair's own separation, which is the
  // quantity a per-box clamp would destroy.
  {
    await freshBoard(app, 'fx17-s3group', [
      { id: 'g1', kind: 'text', x: 0.10, y: 2.40, w: 0.22, h: 0.12, text: 'upper', z: 1, groupId: 'grp' },
      { id: 'g2', kind: 'text', x: 0.40, y: 2.60, w: 0.22, h: 0.12, text: 'lower', z: 2, groupId: 'grp' },
    ], LEG_W, LEG_H);
    const before = { a: (await liveBox(app, 'g1')).y, b: (await liveBox(app, 'g2')).y };
    await dragCard(app, 'g1', 0, 460, 30);   // grab the UPPER card; the lower one hits the floor first
    const after = { a: (await liveBox(app, 'g1')).y, b: (await liveBox(app, 'g2')).y };
    const sepBefore = Math.round((before.b - before.a) * 1e6) / 1e6;
    const sepAfter = Math.round((after.b - after.a) * 1e6) / 1e6;

    ok('S3: THE GROUP KEEPS ITS SHAPE through the landing — the pair\'s separation is byte-identical before and after a drag that drives the LOWER card into the floor. A per-box clamp would have let the upper card keep travelling and visibly deformed the selection',
      sepBefore === sepAfter, JSON.stringify({ sepBefore, sepAfter, before, after }));
    ok('S3: and the group genuinely LANDED — the lower card of the pair rests against the limit, so the shape invariant above was tested at the clamp and not merely in free space',
      after.b + 0.12 <= MAX_CARD_BOTTOM + 0.005 && after.b > before.b, JSON.stringify({ lowerBottom: after.b + 0.12, limit: MAX_CARD_BOTTOM }));
  }

  // ══ S3 — A LIMIT STOPS; IT NEVER RELOCATES (Fable's standing law) ═════════
  // A card can already sit below the limit without ever having been dragged
  // there — an older save from before the constant existed, or a deck load that
  // placed it. The arrival of a law must not rearrange what a writer already
  // made. Dragging such a card SIDEWAYS must leave its y exactly alone.
  {
    const deepY = 3.60;
    await freshBoard(app, 'fx17-s3deep', [
      { id: 'd1', kind: 'text', x: 0.10, y: deepY, w: 0.22, h: 0.12, text: 'already deep', z: 1 },
    ], LEG_W, LEG_H);
    const yBefore = (await liveBox(app, 'd1')).y;
    await dragCard(app, 'd1', 160, 0, 20);   // purely sideways
    const afterBox = await liveBox(app, 'd1');

    ok('S3: A LIMIT STOPS; IT NEVER RELOCATES — a card already sitting BELOW the limit (seeded at y=3.60, past BOARD_MAX_Y) keeps its y EXACTLY through a sideways drag. Clamping to a negative headroom would have yanked it upward the instant it was touched: a silent correction of the writer\'s layout, which is worse than the unbounded growth this slice replaced',
      afterBox != null && Math.abs(afterBox.y - yBefore) < 1e-9, JSON.stringify({ yBefore, yAfter: afterBox && afterBox.y }));
    ok('S3: and that card still MOVED sideways — the stop is confined to the one axis it governs; it did not freeze the gesture outright',
      afterBox != null && afterBox.x > 0.10, JSON.stringify({ x: afterBox && afterBox.x }));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// fx17.mjs is a brand-new file and parks NOTHING. FX17 falsified no pre-existing
// assertion: S1 and S3 are new behavior on a path nothing asserted, and S2's
// floor STRENGTHENS fx13.mjs's own height law rather than retiring any part of
// it — fx13's claims (the wrap fills the stage and does not overflow it;
// scrolling is reserved for content) were true before and are true now, and are
// re-proven live above at the same 1366x768 leg. Verified by running fx13.mjs
// green against this build, both settings, in the suite of record.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nFX17 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; fx17.mjs parks nothing (FX17 falsified no pre-existing assertion; fx13's height law is strengthened, not retired).`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX17 VERIFY: PASS (${checks.length} checks)` : `\nFX17 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
