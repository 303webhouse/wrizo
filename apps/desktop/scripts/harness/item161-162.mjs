// ITEMS 161 + 162 — the Tutor strip on the Board, and the rail's foot at the bottom of the screen.
// Run: node apps/desktop/scripts/harness/item161-162.mjs   (repo root, dist-web freshly built; needs a box turn).
//
// 161 (Nick, verbatim): "the Tutor strip menu on the Board (which you can see in the background), is
//   misaligned with the Board edge. When I open it, the pop-out menu overlaps the Board edge, including
//   even the clickable tab that opens it."   PLAN DESK's 166 guideline amendment, safeguard (1): "an
//   overlaying panel never covers the control that opened it".  Under that guideline the panel MAY overlay
//   the board (the board's margin is never wide enough for it — see docs/menus/item161-162-s0.md); what it may
//   not do is cover its own tab, and the page never moves.
// 162 (founder-ruled): "The theme and trash options should be all the way at the bottom of the screen, not
//   floating on the rail" — the VERY BOTTOM OF THE SCREEN.
//
// EVERY MEASUREMENT IS TAKEN FROM THE DOM'S OWN RECTS, never derived from the CSS under test (a check that
// computes "where it should be" from the implementation's own formula agrees with it by construction). The
// one constant restated here is the ruled panel width, clamp(320px, 34vw, 460px), from FX10 S1's ruling.
// Every press is a hit-tested `trustedDispatch` — the tab is "clickable" only if a real pointer reaches it.
import { withHarness } from '../runtime-verify.mjs';
import { hittablePointBy, trustedDispatch } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const intersects = (a, b) => !(a.right <= b.left + 0.5 || b.right <= a.left + 0.5 || a.bottom <= b.top + 0.5 || b.bottom <= a.top + 0.5);
const rectOf = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; })()`);
const press = (app, sel, what) => trustedDispatch(app, `document.querySelector(${JSON.stringify(sel)})`, what, { report: ok });
const openW = (w) => Math.max(320, Math.min(0.34 * w, 460)); // FX10 S1's ruling, restated (not read from the CSS under test)

const freshDesk = async (app, width, height) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};
const freshBoard = async (app, width, height) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => { const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'i161-board', text: 'Item 161 Board', pageType: 'board', createdAt: now, origin: null,
      boxes: [{ id: 'c1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'A card' }, { id: 'c2', kind: 'text', x: 0.5, y: 0.2, w: 0.3, h: 0.1, z: 2, text: 'Another card' }] }); })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/i161-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await app.emulateDpr(1, width, height);
  await sleep(350);
};
const freshPlainPage = async (app, width, height) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => { window.wrizoCreateJournalPage({ id: 'i162-page', text: 'A page', createdAt: new Date().toISOString(), origin: null }); })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/i162-page'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'page framed' });
  await app.emulateDpr(1, width, height);
  await sleep(350);
};

await withHarness(async (app) => {
  // ==========================================================================
  // 161 — the Tutor strip on the Board, at every tested width.
  // ==========================================================================
  for (const w of [1100, 1280, 1366, 1440, 1680, 1920, 2200]) {
    await freshBoard(app, w, 900);
    const wrap0 = await rectOf(app, '.board-canvas-wrap');
    const grip0 = await rectOf(app, '.wz-tutor-grip');
    ok(`161 @ ${w}: CLOSED — the tab is flush to the board's own edge (grip.left = board.right, ±1.5px) — "aligned with the Board edge"`,
      !!wrap0 && !!grip0 && Math.abs(grip0.left - wrap0.right) < 1.5, JSON.stringify({ gripLeft: grip0 && grip0.left, boardRight: wrap0 && wrap0.right }));
    ok(`161 @ ${w}: CLOSED — REPORT: the tab's vertical offset from the board's top edge (informational; a finding if it is not the designed 16px)`,
      true, JSON.stringify({ gripTop: grip0 && grip0.top, boardTop: wrap0 && wrap0.top, offset: grip0 && wrap0 ? Math.round((grip0.top - wrap0.top) * 10) / 10 : null }));

    if (!(await press(app, '.wz-tutor-grip', `the Tutor tab @ ${w} (closed -> open)`))) continue;
    await sleep(400);
    const grip = await rectOf(app, '.wz-tutor-grip');
    const panel = await rectOf(app, '.wz-tutor-panel');
    const wrap1 = await rectOf(app, '.board-canvas-wrap');
    const open = await app.evalJs("document.querySelector('.wz-tutor-grip')?.getAttribute('data-open')");
    ok(`161 @ ${w}: the press OPENED the panel (a real pointer reached the tab)`, open === 'true' && !!panel, String(open));
    if (!grip || !panel) continue;

    ok(`161 @ ${w}: OPEN — the panel does NOT cover its own tab (the two rects do not intersect) — Nick: "including even the clickable tab that opens it"`,
      !intersects(grip, panel), JSON.stringify({ grip, panel }));
    ok(`161 @ ${w}: OPEN — the tab is JOINED to the panel's near edge (grip.right = panel.left, ±1.5px), so it reads as the panel's own tab`,
      Math.abs(grip.right - panel.left) < 1.5, JSON.stringify({ gripRight: grip.right, panelLeft: panel.left }));
    const hit = await hittablePointBy(app, "document.querySelector('.wz-tutor-grip')");
    ok(`161 @ ${w}: OPEN — a REAL pointer reaches the tab (elementFromPoint at its own points resolves to it, not to the panel or the board)`,
      !!hit && hit.found === true, JSON.stringify(hit));
    ok(`161 @ ${w}: OPEN — the board's rect is BYTE-IDENTICAL to closed (page primacy: an overlaying panel never moves the board)`,
      JSON.stringify(wrap0) === JSON.stringify(wrap1), JSON.stringify({ closed: wrap0, open: wrap1 }));
    ok(`161 @ ${w}: OPEN — the tab and panel are wholly on screen (tab.left >= 0, panel.right <= ${w})`,
      grip.left >= 0 && panel.right <= w + 0.5, JSON.stringify({ gripLeft: grip.left, panelRight: panel.right }));
    ok(`161 @ ${w}: OPEN — the panel keeps its ruled width, clamp(320px, 34vw, 460px) = ${openW(w).toFixed(1)}px (±2)`,
      Math.abs(panel.width - openW(w)) < 2, JSON.stringify({ width: panel.width }));
    ok(`161 @ ${w}: REPORT — how far the open panel overlays the board (px; the guideline allows overlay where the margin cannot hold it; the tab is what must never be covered)`,
      true, JSON.stringify({ overlayPx: Math.max(0, Math.round((wrap1.right - panel.left) * 10) / 10), margin: Math.round((w - wrap1.right) * 10) / 10 }));

    // The tab is also the way BACK: a real press on it, with the panel open, closes the panel.
    if (await press(app, '.wz-tutor-grip', `the Tutor tab @ ${w} (open -> closed)`)) {
      await sleep(300);
      const closed = await app.evalJs("document.querySelector('.wz-tutor-grip')?.getAttribute('data-open')");
      const gripBack = await rectOf(app, '.wz-tutor-grip');
      ok(`161 @ ${w}: a real press on the open tab CLOSES the panel, and the tab returns flush to the board's edge`,
        closed === 'false' && Math.abs(gripBack.left - wrap0.right) < 1.5, JSON.stringify({ closed, gripLeft: gripBack.left, boardRight: wrap0.right }));
    }
  }

  // ==========================================================================
  // 162 — the rail's foot at the VERY BOTTOM OF THE SCREEN.
  // ==========================================================================
  const feet = [];
  for (const [surface, mount] of [['board', freshBoard], ['page', freshPlainPage]]) {
    for (const h of [768, 900, 1200]) {
      await mount(app, 1280, h);
      const strip = await rectOf(app, '.desk-frame-strip');
      const trash = await rectOf(app, '[data-category="trash"]');
      const theme = await rectOf(app, '[data-category="theme"]');
      const vh = await app.evalJs('innerHeight');
      ok(`162 @ 1280x${h}/${surface}: the strip reaches the BOTTOM OF THE SCREEN (strip.bottom = innerHeight, ±1.5px)`,
        !!strip && Math.abs(strip.bottom - vh) < 1.5, JSON.stringify({ stripBottom: strip && strip.bottom, innerHeight: vh }));
      const gap = trash ? vh - trash.bottom : null;
      ok(`162 @ 1280x${h}/${surface}: Trash sits at the very bottom of the screen (its bottom is within 24px of innerHeight — not floating mid-rail)`,
        gap != null && gap >= 0 && gap <= 24, JSON.stringify({ trashBottom: trash && trash.bottom, innerHeight: vh, gap }));
      ok(`162 @ 1280x${h}/${surface}: Themes sits ABOVE Trash in the foot (both pinned, in order)`, !!theme && !!trash && theme.bottom <= trash.top + 0.5, JSON.stringify({ theme, trash }));
      feet.push({ surface, h, gap });
      // Item 130 travels with it: every strip item is reachable by a REAL pointer.
      const items = await app.evalJs("Array.from(document.querySelectorAll('.wz-strip-item')).map(e => e.getAttribute('data-category'))");
      const blocked = [];
      for (const cat of items) {
        const p = await hittablePointBy(app, `document.querySelector('.wz-strip-item[data-category="${cat}"]')`);
        if (!p || !p.found) blocked.push(cat);
      }
      ok(`162 @ 1280x${h}/${surface}: item 130 holds — every one of the ${items.length} strip items is reachable by a real pointer (blocked: ${blocked.join(',') || 'none'})`, items.length > 0 && blocked.length === 0, JSON.stringify({ items, blocked }));
      const stripX = await app.evalJs("(() => { const e = document.querySelector('.desk-frame-strip'); const r = e.getBoundingClientRect(); return { left: r.left, width: r.width, token: getComputedStyle(document.documentElement).getPropertyValue('--strip-width').trim() }; })()");
      ok(`162 @ 1280x${h}/${surface}: the strip is still flush at x=0 and its width is unchanged (--strip-width) — the paper did not move`,
        Math.abs(stripX.left) < 0.5 && Math.abs(stripX.width - parseFloat(stripX.token)) < 1, JSON.stringify(stripX));
    }
  }
  const gaps = feet.map((f) => f.gap).filter((g) => g != null);
  ok('162: the pin HOLDS across heights — Trash\'s gap to the screen bottom is the SAME at 768, 900 and 1200 (±1px); a floating foot\'s gap grows with the window',
    gaps.length > 0 && Math.max(...gaps) - Math.min(...gaps) <= 1, JSON.stringify(feet));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1. ===============================
// This file is new and edits no prior assertion of its own. The assertions ITS CHANGE falsifies live in
// fx10.mjs (the board leg of S1's "grip-flush (open)", parked THERE with a successor, 3 checks). Park count
// in THIS file: 0, emitted anyway — park COUNT, not green.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nITEM161-162 PARKED: PASS (${parkedChecks.length} checks) — nothing parked in this file`);
}
const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM161-162 VERIFY: PASS (${allChecks.length} checks)` : `\nITEM161-162 VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
