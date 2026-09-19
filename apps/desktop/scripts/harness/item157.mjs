// ITEM 157 — THE INK SHEET COVERS THE PAGE.
//
// Nick: "The ink is hard limited to a kind of text box, not the entire page
// surface like it should be." Founder-ruled: the sheet is the PAPER, not the
// text region. docs/menus/item157-s0-survey.md is the design; its §8 is what
// this file owes, and the legs below are numbered against it.
//
// THE THREE ROLES, and which one each leg measures:
//   basis   — the SHEET, UNCHANGED. Production carries ink stored against it
//             (items 121 and 126 shipped in Batch Three), so it must not move.
//   render  — the PAPER: the canvases are portalled into `.mode-page`.
//   capture — the PAPER: press, double-click and hover are heard there.
//
// EVERY POINTER IS TRUSTED (CDP Input). EVERY GESTURE GOES THROUGH A PROBE:
// before anything is dispatched, elementFromPoint is asked whether the point is
// on the paper and whether it is INSIDE the sheet. A margin leg whose press
// landed on the text column would pass for the wrong reason — the whole defect
// was that the column was the only place ink could go.
//
// COORDINATES: a stored point's x AND y are normalized by the SHEET's WIDTH
// (J8), origin at the sheet's top-left. Margin ink therefore stores x < 0,
// x > 1, y < 0, or y past the sheet's height. Every stored→screen conversion
// here does it the renderer's way, and the pixel sampler is checked against a
// control that must read EMPTY, so it cannot pass by reading everything as ink.
//
//   M0  the paper has margins outside the sheet — measured, the premise
//   M1  §8.1 a stroke in EACH margin (left, right, top, the run-out, the
//       paper's bottom edge) is stored outside the sheet and PAINTED there
//   M2  §8.1 and it PERSISTS — after a reload every one still paints
//   M3  §8.2 the canvas box IS the paper's box — three modes × two widths
//   M4  §8.3 the basis did not move — a stroke in the column stores the
//       coordinates item 121 stored and paints where the SHEET puts them
//   M5  §8.4 ink still scrolls with the text, in the column and the margin
//   M6  §8.5 margin ink is grabbable in Draft, moves, stops at the paper
//   M7  §8.6 the eraser's ring shows over a margin, and the erase rubs there
//   M8  §8.7 a scrollbar drag in INK scrolls and draws nothing (S0 §6)
//   M9  the rulings hold in the margin: Free Write TEXT and Draft draw nothing
//
// WHAT THIS FILE CANNOT PROVE, SAID UP FRONT: a stylus in the margin of a real
// tablet. The pen here is CDP's; the hand on glass is the sitting's gesture.
import { withHarness } from '../runtime-verify.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const W1 = 1366, H1 = 768;
const W2 = 1680, H2 = 1050;
const SHEET = '.wz-ink-sheet';
const PAPER = '.mode-page';
const CANVAS = '.mode-page .ink-committed';
const ACTIVE = '.mode-page .ink-active';
const RING = '.mode-page .ink-eraser-ring';
const EDITOR = '.forward-only-editor';
const MODES = [['Free Write', 'freewrite'], ['Draft', 'draft'], ['Revise', 'revise']];

const present = (app, sel) => app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`);
const where = (app) => app.evalJs(`({ hash: location.hash,
  editor: !!document.querySelector('${EDITOR}'), sheet: !!document.querySelector('${SHEET}'),
  paper: !!document.querySelector('${PAPER}'), canvas: !!document.querySelector('${CANVAS}'),
  ink: (document.querySelector('${PAPER}') || { getAttribute: () => null }).getAttribute('data-ink') })`);

const freshDesk = async (app, width = W1, height = H1) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// Through persistence.ts's own seam — the SAME call the real Catch door makes.
const freshPage = async (app, width = W1, height = H1) => {
  await freshDesk(app, width, height);
  const id = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(id)}`);
  await app.waitFor(`!!document.querySelector('${EDITOR}')`, { label: 'page mounted' });
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'DeskFrame mounted' });
  await sleep(300);
  return id;
};

// A page opens in DRAFT; modes are entered through the writer's own door. The
// re-persist after a switch lands ~1100ms later, hence the wait.
const toMode = async (app, key) => {
  const sel = `.desk-mode-tab[data-mode-key="${key}"]`;
  if (!(await present(app, sel))) { ok(`DRIVER: mode tab ${key} ABSENT`, false, JSON.stringify(await where(app))); return false; }
  await app.evalJs(`document.querySelector('${sel}').click()`);
  await sleep(1300);
  return true;
};

const setInstrument = async (app, which) => {
  await app.evalJs(`(() => {
    const b = [...document.querySelectorAll('.wz-ink-switch .wz-ink-switch-side')]
      .find(x => x.textContent.trim().toLowerCase() === ${JSON.stringify(which)});
    if (b) b.click();
  })()`);
  await sleep(250);
};

// A fresh page, in Free Write / INK — the one place a pointer draws.
const inkPage = async (app, width = W1, height = H1) => {
  const id = await freshPage(app, width, height);
  await toMode(app, 'freewrite');
  await app.waitFor("!!document.querySelector('.wz-ink-switch')", { label: 'Free Write switch' });
  await setInstrument(app, 'ink');
  await sleep(200);
  return id;
};

const strokesOf = (app, id) => app.evalJs(
  `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = l.find(x => x.id === ${JSON.stringify(id)}); return (e && e.strokes) || []; })()`);

// Storage is written on a debounce: poll for the count a gesture should
// produce — never read once and believe it (a probe that reads before the
// flush reports data loss against working code).
const settle = async (app, id, want, ms = 4000) => {
  for (let t = 0; t < ms; t += 100) {
    if ((await strokesOf(app, id)).length >= want) break;
    await sleep(100);
  }
  await sleep(150); // one more beat, so a surplus second write would be seen
  return strokesOf(app, id);
};

const midOf = (stroke) => stroke.points[Math.floor(stroke.points.length / 2)];
const bboxOf = (pts) => ({
  x0: Math.min(...pts.map(p => p.x)), x1: Math.max(...pts.map(p => p.x)),
  y0: Math.min(...pts.map(p => p.y)), y1: Math.max(...pts.map(p => p.y)),
});
const editorText = (app) => app.evalJs(`(document.querySelector('${EDITOR}') || { innerText: null }).innerText`);

// ONE READ of every box this file reasons about. `paper` is the paper's
// PADDING box, from its own geometry — the box the canvases fill by layout —
// so comparing it with the canvas still compares two independently measured
// boxes. `gutterLeft`/`bar` locate the scroller's scrollbar.
const GEOM = `(() => {
  const s = document.querySelector('${SHEET}'), p = document.querySelector('${PAPER}');
  const sc = document.querySelector('.mode-scroll'), c = document.querySelector('${CANVAS}');
  if (!s || !p || !sc) return null;
  const R = (el) => { const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  const pr = p.getBoundingClientRect(), scr = sc.getBoundingClientRect();
  return {
    sheet: R(s), scroller: R(sc), canvas: c ? R(c) : null,
    paper: { left: pr.left + p.clientLeft, top: pr.top + p.clientTop,
             right: pr.left + p.clientLeft + p.clientWidth, bottom: pr.top + p.clientTop + p.clientHeight },
    bar: sc.offsetWidth - sc.clientWidth - sc.clientLeft * 2,
    gutterLeft: scr.left + sc.clientLeft + sc.clientWidth,
    scrollTop: sc.scrollTop, maxScroll: Math.max(0, sc.scrollHeight - sc.clientHeight),
  }; })()`;
const geom = (app) => app.evalJs(GEOM);

// The PAGE's left/top edges in SHEET coordinates — the limit a move stops at.
const PAGE_EDGE = `(() => { const s = document.querySelector('${SHEET}').getBoundingClientRect();
  const p = document.querySelector('${PAPER}'); const r = p.getBoundingClientRect();
  const sc = document.querySelector('.mode-scroll'); const st = sc ? sc.scrollTop : 0;
  return { x0: (r.left + p.clientLeft - s.left) / s.width,
           y0: (r.top + p.clientTop - (s.top + st)) / s.width }; })()`;

const setScroll = async (app, v) => {
  await app.evalJs(`(() => { const sc = document.querySelector('.mode-scroll'); if (sc) sc.scrollTop = ${v}; })()`);
  await sleep(300); // the stratum repaints on the scroll event, rAF-coalesced
};

// THE PROBE. What is under this point, is it the paper, is it the sheet?
const probe = (app, x, y) => app.evalJs(`(() => { const el = document.elementFromPoint(${x}, ${y});
  return { el: el ? el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).join('.') : '') : null,
           onPaper: !!(el && el.closest('${PAPER}')), inSheet: !!(el && el.closest('${SHEET}')),
           isScroller: !!(el && el.classList && el.classList.contains('mode-scroll')) }; })()`);

// A trusted stroke or drag at CLIENT coordinates — button HELD through every
// move, the way a hand does it.
const drawAt = async (app, pts, pointerType = 'pen') => {
  const ev = (type, q) => app.cdp('Input.dispatchMouseEvent', {
    type, x: q.x, y: q.y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType,
    ...(pointerType === 'pen' ? { force: type === 'mouseReleased' ? 0 : 0.5 } : {}),
  });
  await ev('mousePressed', pts[0]);
  for (let i = 1; i < pts.length; i++) { await ev('mouseMoved', pts[i]); await sleep(12); }
  await ev('mouseReleased', pts[pts.length - 1]);
};
const segment = (x0, y0, x1, y1, n = 10) => Array.from({ length: n }, (_, i) => ({
  x: x0 + ((x1 - x0) * i) / (n - 1), y: y0 + ((y1 - y0) * i) / (n - 1) }));

// Draw only if BOTH ends are where the leg claims: on the paper, and inside or
// outside the sheet as stated. Otherwise a failed DRIVER check, and nothing.
const guardedDraw = async (app, label, pts, { pointerType = 'pen', inSheet = false } = {}) => {
  const a = await probe(app, pts[0].x, pts[0].y);
  const b = await probe(app, pts[pts.length - 1].x, pts[pts.length - 1].y);
  if (!(a.onPaper && b.onPaper && a.inSheet === inSheet && b.inSheet === inSheet)) {
    ok(`DRIVER: ${label} — the probe says this stroke would not land where the leg claims (on the paper, ${inSheet ? 'INSIDE' : 'OUTSIDE'} the sheet); nothing was dispatched`,
      false, JSON.stringify({ a, b, from: pts[0], to: pts[pts.length - 1] }));
    return false;
  }
  await drawAt(app, pts, pointerType);
  return true;
};

// Max alpha in a 9×9 patch of the COMMITTED canvas at a SCREEN point.
// -1: no canvas. -2: the point is outside the canvas — never read as "empty",
// so a negative check (=== 0) cannot pass by aiming off the canvas.
const alphaAtScreen = (app, x, y) => app.evalJs(`(() => {
  const c = document.querySelector('${CANVAS}'); if (!c) return -1;
  const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const cx = Math.round((${x} - r.left) * dpr), cy = Math.round((${y} - r.top) * dpr);
  if (cx < 0 || cy < 0 || cx >= c.width || cy >= c.height) return -2;
  const d = c.getContext('2d').getImageData(Math.max(0, cx - 4), Math.max(0, cy - 4), 9, 9).data;
  let m = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > m) m = d[i];
  return m; })()`);

// The screen point of a STORED point, the renderer's way: basis = the sheet,
// both axes over its width.
const screenOf = (app, np) => app.evalJs(`(() => { const s = document.querySelector('${SHEET}'); if (!s) return null;
  const r = s.getBoundingClientRect(); return { x: r.left + ${np.x} * r.width, y: r.top + ${np.y} * r.width }; })()`);
const outsideSheet = (g, p) => !!g && !!p
  && (p.x < g.sheet.left || p.x > g.sheet.right || p.y < g.sheet.top || p.y > g.sheet.bottom);

// Painted-pixel count over a whole canvas (the armed outline lives on ACTIVE).
const litPixels = (app, sel) => app.evalJs(`(() => { const c = document.querySelector('${sel}'); if (!c) return -1;
  if (!c.width || !c.height) return -2;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; })()`);

// A verification aid, never an assertion: the margins as a writer would see
// them, written OUTSIDE the tree (a tree write mid-pair marks the stamp dirty).
const SHOTS = path.join(tmpdir(), 'item157-shots');
const shot = async (app, name) => {
  try {
    mkdirSync(SHOTS, { recursive: true });
    const b64 = await app.screenshot();
    writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from(b64, 'base64'));
    return b64.length;
  } catch { return 0; }
};

await withHarness(async (app) => {
  // ==========================================================================
  // M0 — THE PREMISE: the paper has margins outside the sheet. If these were
  // zero, every margin leg below would be testing nothing.
  // ==========================================================================
  const mId = await inkPage(app, W1, H1);
  const g0 = await geom(app);
  const gaps = g0 && {
    left: g0.sheet.left - g0.paper.left,
    right: g0.gutterLeft - g0.sheet.right,
    top: g0.sheet.top - g0.paper.top,
  };
  ok('M0: the paper has margins OUTSIDE the sheet on the left, the right (up to the scrollbar) and the top — each at least 16px, measured. This is the region Nick\'s screenshot shows untouched; if it were zero, every margin leg below would test nothing',
    !!gaps && gaps.left >= 16 && gaps.right >= 16 && gaps.top >= 16, JSON.stringify({ gaps, bar: g0 && g0.bar }));
  ok('M0: and the stratum\'s canvas is mounted in Free Write / INK, on the paper (the precondition for every pixel read below)',
    !!(g0 && g0.canvas), JSON.stringify(await where(app)));
  if (!g0 || !g0.canvas) return checks;

  // ==========================================================================
  // M1 — §8.1: A STROKE IN EVERY MARGIN, stored outside the sheet and painted
  // there. Mixed instruments on purpose: the laptop's MOUSE is the primary
  // target (item 121), the PEN is the tablet's.
  // ==========================================================================
  const text0 = await editorText(app);
  let n = (await strokesOf(app, mId)).length;
  const legs = {};
  const marginLeg = async (key, label, pts, pointerType, isOutside, rule) => {
    const g = await geom(app);
    if (!(await guardedDraw(app, `M1 ${label}`, pts, { pointerType }))) return;
    const after = await settle(app, mId, n + 1);
    const added = after.length - n;
    n = after.length;
    const st = added > 0 ? after[after.length - 1] : null;
    const box = st ? bboxOf(st.points) : null;
    const sheetHw = g.sheet.height / g.sheet.width;
    ok(`M1 (${label}): a trusted ${pointerType.toUpperCase()} stroke drawn in the ${label} is STORED — exactly one new stroke — and every point of it lies outside the sheet (${rule}). Before item 157 this press never reached the ink at all: the sheet was the only thing listening`,
      added === 1 && !!box && isOutside(box, sheetHw), JSON.stringify({ added, box, sheetHw }));
    const sp = st ? await screenOf(app, midOf(st)) : null;
    const gNow = await geom(app);
    const alpha = sp ? await alphaAtScreen(app, sp.x, sp.y) : -3;
    ok(`M1 (${label}): and it is PAINTED there — non-zero alpha on the real canvas at the screen point the renderer's basis gives its stored mid-point, and that point lies OUTSIDE the sheet's box: ink on the paper, where the text column is not`,
      alpha > 0 && outsideSheet(gNow, sp), JSON.stringify({ alpha, sp, sheet: gNow && gNow.sheet }));
    if (st) legs[key] = { stroke: st, label };
  };

  const midY = (g0.paper.top + g0.paper.bottom) / 2;
  const leftX = (g0.paper.left + g0.sheet.left) / 2;
  const rightX = (g0.sheet.right + g0.gutterLeft) / 2;
  const topY = (g0.paper.top + g0.sheet.top) / 2;
  const colX0 = g0.sheet.left + g0.sheet.width * 0.3, colX1 = g0.sheet.left + g0.sheet.width * 0.6;

  await marginLeg('left', 'LEFT margin', segment(leftX, midY - 30, leftX, midY + 30), 'pen',
    (b) => b.x1 < 0, 'x below 0');
  await marginLeg('right', 'RIGHT margin', segment(rightX, midY - 30, rightX, midY + 30), 'mouse',
    (b) => b.x0 > 1, 'x above 1');
  await marginLeg('top', 'TOP margin', segment(colX0, topY, colX1, topY), 'pen',
    (b) => b.y1 < 0, 'y below 0');

  // The bottom: scroll to the end, where the scroller's 30vh run-out sits
  // below the sheet and the paper's own bottom padding sits below that.
  await setScroll(app, 1e6);
  const gE = await geom(app);
  const runGap = gE.scroller.bottom - gE.sheet.bottom;
  const edgeGap = gE.paper.bottom - gE.scroller.bottom;
  ok('M1 (bottom): scrolled to the end, the run-out below the sheet and the paper\'s bottom edge are both there to draw in (measured: run-out ≥ 40px, bottom padding ≥ 12px)',
    runGap >= 40 && edgeGap >= 12, JSON.stringify({ runGap, edgeGap, scrollTop: gE.scrollTop }));
  const runY = gE.sheet.bottom + Math.min(runGap / 2, 80);
  const edgeY = (gE.scroller.bottom + gE.paper.bottom) / 2;
  await marginLeg('runout', 'RUN-OUT below the text', segment(colX0, runY, colX1, runY), 'mouse',
    (b, hw) => b.y0 > hw, 'y past the sheet\'s height');
  await marginLeg('edge', 'paper\'s BOTTOM margin', segment(colX0, edgeY, colX1, edgeY), 'pen',
    (b, hw) => b.y0 > hw, 'y past the sheet\'s height');
  await shot(app, 'm1-bottom-scrolled');
  await setScroll(app, 0);
  await shot(app, 'm1-margins-top');

  // The sampler's CONTROL: the same read, aimed at an empty patch of margin
  // (the top-left corner — no leg drew there), must read ZERO. Without this,
  // a sampler that saw everything as ink would make every M1 render check pass.
  const ctl = await alphaAtScreen(app, leftX, topY);
  ok('M1 (control): the same sampler aimed at an EMPTY patch of margin (the top-left corner) reads exactly ZERO — so the non-zero reads above are ink, not a sampler that reads everything as painted',
    ctl === 0, JSON.stringify({ ctl, at: { x: leftX, y: topY } }));

  ok('M1: five margin strokes, one per leg — nothing lost, nothing doubled',
    Object.keys(legs).length === 5, JSON.stringify(Object.keys(legs)));
  ok('M1: and the page\'s TEXT is unchanged by every margin stroke — drawing on the paper around the column never reaches the column\'s words',
    (await editorText(app)) === text0, JSON.stringify({ same: (await editorText(app)) === text0 }));
  const sel1 = await app.evalJs("(window.getSelection() || { toString: () => '' }).toString()");
  ok('M1: and no text selection was started by any of them', sel1 === '', JSON.stringify({ sel1 }));

  // ==========================================================================
  // M2 — §8.1 "persists": a reload, then every margin stroke paints again.
  // ==========================================================================
  const stored2 = JSON.stringify(await strokesOf(app, mId));
  await app.reload();
  await app.emulateDpr(1, W1, H1);
  let reloaded = true;
  try { await app.waitFor(`!!document.querySelector('${CANVAS}')`, { label: 'canvas after reload' }); } catch { reloaded = false; }
  ok('M2: after a RELOAD the page and its paper-mounted canvas come back', reloaded, JSON.stringify(await where(app)));
  await sleep(800);
  ok('M2: and storage carries every margin stroke byte-identically — the reload read them back, it did not rewrite them',
    JSON.stringify(await strokesOf(app, mId)) === stored2, JSON.stringify({ len: stored2.length }));
  for (const key of ['left', 'right', 'top', 'runout', 'edge']) {
    const leg = legs[key];
    if (!leg) { ok(`M2 (${key}): (precondition) the M1 leg produced a stroke to look for`, false); continue; }
    if (key === 'runout' || key === 'edge') await setScroll(app, 1e6);
    const sp = await screenOf(app, midOf(leg.stroke));
    const g = await geom(app);
    const alpha = sp ? await alphaAtScreen(app, sp.x, sp.y) : -3;
    ok(`M2 (${leg.label}): after the reload it still PAINTS in the margin — non-zero alpha at its stored point's screen position, outside the sheet`,
      alpha > 0 && outsideSheet(g, sp), JSON.stringify({ alpha, sp }));
    if (key === 'runout' || key === 'edge') await setScroll(app, 0);
  }

  // ==========================================================================
  // M3 — §8.2: THE CANVAS BOX IS THE PAPER'S BOX — every mode, both widths.
  // ==========================================================================
  for (const [W, H] of [[W1, H1], [W2, H2]]) {
    await app.emulateDpr(1, W, H);
    await sleep(500);
    for (const [label, key] of MODES) {
      await toMode(app, key);
      const g = await geom(app);
      const near = (a, b) => a != null && b != null && Math.abs(a - b) <= 0.6;
      const onPaper = !!g && !!g.canvas && near(g.paper.left, g.canvas.left) && near(g.paper.right, g.canvas.right)
        && near(g.paper.top, g.canvas.top) && near(g.paper.bottom, g.canvas.bottom);
      const inside = !!g && !!g.canvas && g.sheet.left > g.canvas.left + 0.6 && g.sheet.right < g.canvas.right - 0.6;
      ok(`M3 (${W}, ${label}): the canvas box IS the paper's padding box on every edge (within 0.6px), and the sheet — still the basis — lies strictly inside it: the margins are the difference, and they are ink`,
        onPaper && inside, JSON.stringify(g && { paper: g.paper, canvas: g.canvas, sheet: g.sheet }));
    }
  }
  await app.emulateDpr(1, W1, H1);
  await sleep(400);

  // ==========================================================================
  // M4 — §8.3: THE BASIS DID NOT MOVE. Production carries ink stored against
  // the sheet; if the basis had moved, every one of those strokes would shift
  // on screen. A column stroke must store what item 121 stored (x within 0..1,
  // y from 0) and paint where the SHEET puts that — NOT where a paper basis
  // would. The two candidate points are asserted apart first, so the negative
  // cannot pass by coinciding with the positive.
  // ==========================================================================
  const bId = await inkPage(app, W1, H1);
  const gB = await geom(app);
  const bMidY = (gB.paper.top + gB.paper.bottom) / 2;
  const tickX = gB.sheet.left + gB.sheet.width * 0.05;
  let nB = (await strokesOf(app, bId)).length;
  await guardedDraw(app, 'M4 column tick', segment(tickX, bMidY - 20, tickX, bMidY + 20), { pointerType: 'pen', inSheet: true });
  const afterB = await settle(app, bId, nB + 1);
  const colStroke = afterB.length === nB + 1 ? afterB[afterB.length - 1] : null;
  nB = afterB.length;
  const colBox = colStroke ? bboxOf(colStroke.points) : null;
  ok('M4: a stroke drawn INSIDE the text column stores sheet-basis coordinates — x within 0..1, y from 0 — exactly what item 121 stored. Nothing about a column stroke changed',
    !!colBox && colBox.x0 >= 0 && colBox.x1 <= 1 && colBox.y0 >= 0, JSON.stringify(colBox));
  if (colStroke) {
    const m = midOf(colStroke);
    const gM = await geom(app);
    const viaSheet = await screenOf(app, m);
    const viaPaper = { x: gM.canvas.left + m.x * gM.canvas.width, y: gM.canvas.top + m.y * gM.canvas.width };
    const apart = Math.hypot(viaSheet.x - viaPaper.x, viaSheet.y - viaPaper.y);
    const aSheet = await alphaAtScreen(app, viaSheet.x, viaSheet.y);
    const aPaper = await alphaAtScreen(app, viaPaper.x, viaPaper.y);
    ok('M4: and it PAINTS where the SHEET basis puts its stored point (non-zero alpha there) and NOT where a paper basis would (exactly zero there, ≥ 12px away) — the stored ink of every writer in production renders where it did before item 157. Zero migration, measured',
      apart >= 12 && aSheet > 0 && aPaper === 0, JSON.stringify({ viaSheet, viaPaper, apart, aSheet, aPaper }));
  }

  // ==========================================================================
  // M5 — §8.4: INK STILL SCROLLS WITH THE TEXT. Item 121 bound the canvas to
  // the sheet for exactly this reason (S0 §3); item 157 keeps it by repainting
  // on scroll. Read by SCREEN position, independent of the renderer's formula.
  // ==========================================================================
  const mX = (gB.paper.left + gB.sheet.left) / 2;
  await guardedDraw(app, 'M5 margin tick', segment(mX, bMidY - 20, mX, bMidY + 20), { pointerType: 'pen' });
  const afterM5 = await settle(app, bId, nB + 1);
  const marStroke = afterM5.length === nB + 1 ? afterM5[afterM5.length - 1] : null;
  nB = afterM5.length;
  if (!colStroke || !marStroke) {
    ok('M5: (precondition) a column stroke and a margin stroke to scroll', false, JSON.stringify({ col: !!colStroke, mar: !!marStroke }));
  } else {
    const s0 = await geom(app);
    const colPt = await screenOf(app, midOf(colStroke));
    const marPt = await screenOf(app, midOf(marStroke));
    const ed0 = await app.evalJs(`document.querySelector('${EDITOR}').getBoundingClientRect().top`);
    const want = Math.min(120, s0.maxScroll);
    await setScroll(app, want);
    const s1 = await geom(app);
    const dS = s1.scrollTop - s0.scrollTop;
    const ed1 = await app.evalJs(`document.querySelector('${EDITOR}').getBoundingClientRect().top`);
    const dT = ed0 - ed1;
    ok('M5: the page scrolled by at least 60px and the TEXT moved by exactly the scroll delta (within 1px) — the reference the ink is measured against',
      dS >= 60 && Math.abs(dT - dS) < 1, JSON.stringify({ dS, dT, maxScroll: s0.maxScroll }));
    for (const [what, pt] of [['column', colPt], ['MARGIN', marPt]]) {
      const moved = await alphaAtScreen(app, pt.x, pt.y - dS);
      const stayed = await alphaAtScreen(app, pt.x, pt.y);
      ok(`M5 (${what} ink): it moved WITH the text — painted at its old screen point minus the scroll delta, and GONE from the old point. Not nailed to the viewport: item 121's own worry (S0 §3), kept${what === 'MARGIN' ? ' — and the margin scrolls with the page too, it is not a frame' : ''}`,
        moved > 0 && stayed === 0, JSON.stringify({ at: pt, dS, moved, stayed }));
    }
    await setScroll(app, 0);
  }

  // ==========================================================================
  // M6 — §8.5: MARGIN INK IS GRABBABLE IN DRAFT. The double-click is heard on
  // the paper now; converted against the sheet it gives x below 0, which
  // strokeAt already handled. And the move stops at the PAPER'S edge.
  // ==========================================================================
  const dId = await inkPage(app, W1, H1);
  const gD = await geom(app);
  const dMidY = (gD.paper.top + gD.paper.bottom) / 2;
  const dX = (gD.paper.left + gD.sheet.left) / 2;
  await guardedDraw(app, 'M6 margin tick', segment(dX, dMidY - 25, dX, dMidY + 25), { pointerType: 'pen' });
  const dStrokes = await settle(app, dId, 1);
  await toMode(app, 'draft');
  const dText0 = await editorText(app);
  const gD2 = await geom(app);
  // The miss path first: a bare margin arms NOTHING.
  const bare = { x: (gD2.sheet.right + gD2.gutterLeft) / 2, y: (gD2.paper.top + gD2.paper.bottom) / 2 };
  const pBare = await probe(app, bare.x, bare.y);
  if (pBare.onPaper && !pBare.inSheet) {
    await app.doubleClick(bare.x, bare.y);
    await sleep(350);
    const lit = await litPixels(app, ACTIVE);
    ok('M6: in Draft a double-click on a BARE margin arms NOTHING — no outline. The miss path is unchanged: hearing the paper does not make empty paper grabbable',
      lit === 0, JSON.stringify({ lit, pBare }));
  } else {
    ok('DRIVER: M6 bare-margin point is not bare margin — nothing dispatched', false, JSON.stringify({ pBare, bare }));
  }
  if (dStrokes.length !== 1) {
    ok('M6: (precondition) one margin stroke to grab', false, JSON.stringify({ n: dStrokes.length }));
  } else {
    const before6 = bboxOf(dStrokes[0].points);
    const sp = await screenOf(app, midOf(dStrokes[0]));
    const pInk = await probe(app, sp.x, sp.y);
    if (!(pInk.onPaper && !pInk.inSheet)) {
      ok('DRIVER: M6 margin-ink point is not in the margin — nothing dispatched', false, JSON.stringify({ pInk, sp }));
    } else {
      await app.doubleClick(sp.x, sp.y);
      await sleep(350);
      const lit = await litPixels(app, ACTIVE);
      ok('M6: in Draft a double-click ON MARGIN INK arms its group — the outline is painted. Before item 157 nothing outside the sheet could be heard, so ink there could never have been grabbed',
        lit > 0, JSON.stringify({ lit, pInk }));
      // A move right by 50px.
      await drawAt(app, segment(sp.x, sp.y, sp.x + 50, sp.y), 'mouse');
      await sleep(900);
      const mid6 = bboxOf((await strokesOf(app, dId))[0].points);
      const w6 = (await geom(app)).sheet.width;
      ok('M6: and a drag MOVES it — the stored group translates by the pointer\'s 50px of travel (within 0.004 of the sheet\'s width)',
        Math.abs((mid6.x0 - before6.x0) - 50 / w6) < 0.004, JSON.stringify({ before6, mid6, expect: 50 / w6 }));
      // Then shoved far left, past the paper — released INSIDE the viewport.
      const sp2 = await screenOf(app, midOf((await strokesOf(app, dId))[0]));
      const gD3 = await geom(app);
      await app.doubleClick(sp2.x, sp2.y);
      await sleep(350);
      const end = { x: Math.max(4, gD3.paper.left - 60), y: sp2.y };
      await drawAt(app, segment(sp2.x, sp2.y, end.x, end.y, 12), 'mouse');
      await sleep(900);
      const after6 = bboxOf((await strokesOf(app, dId))[0].points);
      const pg = await app.evalJs(PAGE_EDGE);
      ok('M6: shoved far left, past the paper, it STOPS AT THE PAPER\'S EDGE — x0 lands on the paper\'s left edge (within 0.003), never beyond. FX17\'s law, with the page as the limit',
        pg.x0 < 0 && Math.abs(after6.x0 - pg.x0) < 0.003 && after6.x0 >= pg.x0 - 1e-6, JSON.stringify({ pageEdge: pg, after6, end }));
    }
  }
  ok('M6: and Draft\'s TEXT is byte-identical across every double-click and move — the margin gesture never reached the words',
    (await editorText(app)) === dText0, JSON.stringify({ same: (await editorText(app)) === dText0 }));
  await app.key('Escape');
  await sleep(200);

  // ==========================================================================
  // M7 — §8.6: THE ERASER IN THE MARGIN. The ring used to live inside the
  // sheet, so it could never be seen over a margin; it lives on the paper now.
  // The eraser is armed by its own button, which is in the DOM whenever INK is
  // (item121.mjs S7 does the same) — no drawer opened, no geometry changed.
  // ==========================================================================
  const eId = await inkPage(app, W1, H1);
  const gR = await geom(app);
  const rMidY = (gR.paper.top + gR.paper.bottom) / 2;
  const rX = (gR.paper.left + gR.sheet.left) / 2;
  await guardedDraw(app, 'M7 margin tick', segment(rX, rMidY - 30, rX, rMidY + 30), { pointerType: 'pen' });
  const eStrokes = await settle(app, eId, 1);
  const eMid = eStrokes.length ? midOf(eStrokes[0]) : null;
  const eSp = eMid ? await screenOf(app, eMid) : null;
  const inked = eSp ? await alphaAtScreen(app, eSp.x, eSp.y) : -3;
  await app.evalJs("document.querySelector('.wz-ink-eraser')?.click()");
  await sleep(250);
  const pressed = await app.evalJs("document.querySelector('.wz-ink-eraser')?.getAttribute('aria-pressed') ?? null");
  ok('M7: (precondition) the margin tick is painted, and the eraser is ARMED — its button reads pressed',
    inked > 0 && pressed === 'true', JSON.stringify({ inked, pressed }));
  const hover = { x: rX, y: rMidY + 60 };
  const pHover = await probe(app, hover.x, hover.y);
  if (pHover.onPaper && !pHover.inSheet) {
    await app.mouseMove(hover.x + 6, hover.y - 6);
    await sleep(40);
    await app.mouseMove(hover.x, hover.y);
    await sleep(150);
    const ring = await app.evalJs(`(() => { const r = document.querySelector('${RING}'); if (!r) return null;
      const b = r.getBoundingClientRect();
      return { display: getComputedStyle(r).display, cx: b.left + b.width / 2, cy: b.top + b.height / 2, w: b.width }; })()`);
    ok('M7: with the eraser armed, the ring SHOWS OVER THE MARGIN — displayed, centred on the pointer within 1.5px, with the pointer outside the sheet. Item 121\'s ring was positioned inside the sheet and could never appear here',
      !!ring && ring.display !== 'none' && Math.abs(ring.cx - hover.x) <= 1.5 && Math.abs(ring.cy - hover.y) <= 1.5,
      JSON.stringify({ ring, hover, pHover }));
  } else {
    ok('DRIVER: M7 hover point is not in the margin — nothing dispatched', false, JSON.stringify({ pHover, hover }));
  }
  if (eSp) {
    await guardedDraw(app, 'M7 erase', segment(rX, rMidY - 34, rX, rMidY + 34), { pointerType: 'pen' });
    const e2 = await settle(app, eId, 2);
    const er = e2.length === 2 ? e2[1] : null;
    const erased = await alphaAtScreen(app, eSp.x, eSp.y);
    ok('M7: and a trusted ERASE along the margin tick RUBS IT OUT — alpha at the tick\'s own point drops, and the erase is stored as an eraser stroke lying in the margin (x below 0)',
      !!er && er.eraser === true && bboxOf(er.points).x1 < 0 && erased < inked,
      JSON.stringify({ inked, erased, eraser: er && er.eraser, box: er && bboxOf(er.points) }));
  }
  await app.evalJs("document.querySelector('.wz-ink-eraser')?.click()");
  await sleep(150);

  // ==========================================================================
  // M8 — §8.7: THE SCROLLBAR. The paper covers the scroller's scrollbar, which
  // the sheet never did, so a press there would begin a stroke unless the
  // capture path steps aside (S0 §6 — the hazard this fix would have created).
  // CONTROL FIRST: in TEXT, with no ink listener at all, the same drag must
  // scroll — otherwise the INK leg's result says nothing about the product.
  // ==========================================================================
  const sId = await freshPage(app, W1, H1);
  await toMode(app, 'freewrite');
  await app.waitFor("!!document.querySelector('.wz-ink-switch')", { label: 'Free Write switch' });
  await setInstrument(app, 'text');
  const gS = await geom(app);
  ok('M8: (premise) the scroller shows a scrollbar INSIDE the paper — measured gutter width, and it lies within the paper\'s box',
    gS.bar >= 4 && gS.gutterLeft + gS.bar <= gS.paper.right + 0.6, JSON.stringify({ bar: gS.bar, gutterLeft: gS.gutterLeft, paperRight: gS.paper.right }));
  const thumb = { x: gS.gutterLeft + gS.bar / 2, y: gS.scroller.top + 60 };
  const barDrag = async (label) => {
    const p = await probe(app, thumb.x, thumb.y);
    if (!p.isScroller) {
      ok(`DRIVER: M8 ${label} — the thumb point is not the scroller (so not its scrollbar); nothing dispatched`, false, JSON.stringify({ p, thumb }));
      return null;
    }
    await setScroll(app, 0);
    const a = (await geom(app)).scrollTop;
    await drawAt(app, segment(thumb.x, thumb.y, thumb.x, thumb.y + 80, 8), 'mouse');
    await sleep(300);
    return (await geom(app)).scrollTop - a;
  };
  const dText = await barDrag('TEXT control');
  ok('M8 (control): in Free Write / TEXT a trusted drag on the scrollbar thumb SCROLLS the page — the driver can move this scrollbar at all, so the INK leg below is a measurement',
    dText != null && dText > 0, JSON.stringify({ dText }));
  await setInstrument(app, 'ink');
  const n8 = (await strokesOf(app, sId)).length;
  const lit8 = await litPixels(app, CANVAS);
  const dInk = await barDrag('INK');
  await sleep(1200);
  const n8b = (await strokesOf(app, sId)).length;
  const lit8b = await litPixels(app, CANVAS);
  ok('M8: in Free Write / INK the same scrollbar drag STILL SCROLLS THE PAGE — the paper hears a press over the scrollbar and the capture path steps aside for it',
    dInk != null && dInk > 0, JSON.stringify({ dInk, dText }));
  ok('M8: and it DRAWS NOTHING — no stroke stored, not one pixel painted on the committed canvas',
    n8b === n8 && lit8b === lit8 && lit8 === 0, JSON.stringify({ n8, n8b, lit8, lit8b }));
  await setScroll(app, 0);

  // ==========================================================================
  // M9 — THE RULINGS HOLD IN THE MARGIN. Capture moved to the paper; the
  // permission model did not. Free Write TEXT is INERT (Fable, ruled) and
  // Draft is MOVABLE, never a pen — so neither may draw in a margin either.
  // ==========================================================================
  await setInstrument(app, 'text');
  const g9 = await geom(app);
  const y9 = (g9.paper.top + g9.paper.bottom) / 2;
  const x9 = (g9.paper.left + g9.sheet.left) / 2;
  const t9 = await editorText(app);
  const n9 = (await strokesOf(app, sId)).length;
  await guardedDraw(app, 'M9 FW/TEXT margin pen', segment(x9, y9 - 25, x9, y9 + 25), { pointerType: 'pen' });
  await sleep(1500);
  const n9a = (await strokesOf(app, sId)).length;
  ok('M9: in Free Write / TEXT a trusted PEN stroke in the margin creates NO stroke — the TEXT half stays INERT, as ruled; moving capture to the paper did not widen it',
    n9a === n9, JSON.stringify({ n9, n9a }));
  await toMode(app, 'draft');
  const g9d = await geom(app);
  const y9d = (g9d.paper.top + g9d.paper.bottom) / 2;
  const x9d = (g9d.paper.left + g9d.sheet.left) / 2;
  await guardedDraw(app, 'M9 Draft margin pen', segment(x9d, y9d - 25, x9d, y9d + 25), { pointerType: 'pen' });
  await guardedDraw(app, 'M9 Draft margin mouse', segment(x9d, y9d - 25, x9d, y9d + 25), { pointerType: 'mouse' });
  await sleep(1500);
  const n9b = (await strokesOf(app, sId)).length;
  ok('M9: in DRAFT neither a pen nor a mouse stroke in the margin draws — Draft\'s ink is movable, never a pen, in the margin as in the column',
    n9b === n9, JSON.stringify({ n9, n9b }));
  ok('M9: and the text is unchanged by both legs', (await editorText(app)) === t9, '');

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// item157.mjs is a brand-new file and parks NOTHING OF ITS OWN. Item 157's
// parks live in the files that own the assertions it falsified — item121.mjs
// (S1, S2) and item126.mjs (C1, C8, C8b) — each counted THERE by execution.
// The empty array is still emitted before the prose line, so the auditor reads
// zero off the run rather than taking it from this comment.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nITEM157 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; item157.mjs parks nothing of its own (item 157's parks are counted in item121.mjs and item126.mjs).`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM157 VERIFY: PASS (${checks.length} checks)` : `\nITEM157 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
