// CARD RESIZE AXIS (Nick, Oct 15 3:18am; Fable). "Dragging a card's corner sideways forces the cursor vertical and the card only grows downward" - on the Journal board's pins.
// Cause (read, not guessed): item 138's lock derived a page-pin's height from the width and read ONLY dx - so a sideways drag grew the tall card mostly downward, a vertical drag did nothing, and the
// corner ran away from the pointer. THE RULING: page-pin and board-pin cards KEEP their proportions (only the size changes), but THE AXIS THE POINTER MOVED MORE DRIVES THE SIZE (round 2: width += dx, or += dy / aspect, whichever is larger in magnitude, with its own sign) - so a sideways, a downward or a diagonal drag all scale the card and the corner stays under the pointer on the dominant axis; the cursor stays the diagonal arrow throughout;
// text and ink cards stay free; MIN_PIN_H and a min width floor it.
//
//   S  source pins (browserless, with mutants): the pin branch reads dy; the whole canvas wears the diagonal arrow while the corner is held
//   C1 drag RIGHT -> bigger, ratio unchanged (page card)      C2 drag DOWN -> bigger, ratio unchanged (before: nothing happened)
//   C3 a drag ALONG the diagonal -> the corner lands on the pointer (within 12px)     C4 a SIDEWAYS drag -> the right edge is under the pointer (140px right = +140px wide); C2 also pins the bottom edge under the pointer
//   C5 drag UP-LEFT -> smaller, ratio unchanged, both floors respected     C6 the same for a BOARD pin (wide): right -> bigger, down -> bigger, ratio unchanged
//   C9 an OLDER wide page card dragged right never gets narrower (the change is a delta from the start size)
//   C7 a TEXT card is still free on both axes (width and height move independently)
//   C8 the cursor is the diagonal arrow over the card text, over empty canvas and over the handle for the WHOLE gesture - and is released after (not stuck)
//
// Seeding goes through the app's seams; input is trusted CDP mouse events. Needs a box turn (withHarness refuses without WS_BOX_TURN).
// Run: WS_BOX_TURN=<token> node scripts/harness/card-resize-axis.mjs   (from apps/desktop, dist-web built)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
import { hittablePoint } from '../trusted-point.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const constOf = (file, name) => {
  const m = noCR(fs.readFileSync(path.join(SRC, file), 'utf8')).match(new RegExp(`^const ${name} = ([0-9.]+);`, 'm'));
  if (!m) throw new Error(`card-resize-axis: could not read ${name} out of ${file}`);
  return Number(m[1]);
};
const PAGE_ASPECT = constOf('store/persistence.ts', 'BOARD_PIN_H') / constOf('store/persistence.ts', 'BOARD_PIN_W');
const BOARD_ASPECT = constOf('store/persistence.ts', 'BOARD_CARD_H') / constOf('store/persistence.ts', 'BOARD_CARD_W');
const MIN_PIN_H = constOf('components/BoardEditor.tsx', 'MIN_PIN_H');
const MIN_PIN_W = constOf('components/BoardEditor.tsx', 'MIN_PIN_W');
const TOL = 0.03;

// ---- S: the source pins ---------------------------------------------------------------------------------------------------------------------------------------------------------------
const be = noCR(fs.readFileSync(path.join(SRC, 'components/BoardEditor.tsx'), 'utf8'));
const css = noCR(fs.readFileSync(path.join(SRC, 'index.css'), 'utf8'));
const pins = (b, c) => ({
  readsDy: /const dyFrac = \(e\.clientY - startY\) \/ pageWidthPx;\n(?:\s*\/\/[^\n]*\n)*\s*const byX = dx, byY = dyFrac \/ a;\n\s*const toward = resizeStart!\.w \+ \(Math\.abs\(byX\) >= Math\.abs\(byY\) \? byX : byY\);/.test(b),
  floors: /const w = Math\.max\(minW, MIN_PIN_H \/ a, toward\);\n\s*return \{ \.\.\.b, w, h: Math\.max\(MIN_PIN_H, w \* a\) \};/.test(b),
  flag: /canvas\.dataset\.resizing = 'true';/.test(b) && /delete canvas\.dataset\.resizing;\n\s*movingIds = \[\];/.test(b),
  arrow: /\.board-canvas\[data-resizing='true'\], \.board-canvas\[data-resizing='true'\] \*\{ cursor:nwse-resize !important; \}/.test(c),
});
{
  const p = pins(be, css);
  ok('S1: a page-pin resize reads BOTH dx and dy (the axis the pointer moved MORE drives the width: dx, or dy / aspect, whichever is larger in magnitude), the height follows at the kind\'s aspect, and MIN_PIN_H plus a min width floor it', p.readsDy && p.floors, JSON.stringify(p));
  ok('S2: the canvas carries data-resizing for the length of the gesture (set when the corner is taken, cleared when it ends) and CSS makes the whole canvas wear the diagonal arrow while it is set', p.flag && p.arrow, JSON.stringify(p));
  const m1 = be.replace('const byX = dx, byY = dyFrac / a;', 'const byX = dx, byY = 0;');
  const m2 = be.replace('Math.max(minW, MIN_PIN_H / a, toward)', 'Math.max(minW, toward)');
  const m3 = css.replace("cursor:nwse-resize !important;", 'cursor:default !important;');
  const m4 = be.replace("canvas.dataset.resizing = 'true';", '');
  ok('S (mutants): reading dx alone (the old lock), dropping the height floor, dropping the arrow, or never setting the flag each turn a pin RED (each mutation landed)',
    m1 !== be && !pins(m1, css).readsDy && m2 !== be && !pins(m2, css).floors && m3 !== css && !pins(be, m3).arrow && m4 !== be && !pins(m4, css).flag, '');
}

// ---- the box half ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
const freshDesk = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1400, 900);
};
const settle = async (app, expr, ms = 4000) => { const end = Date.now() + ms; let v = await app.evalJs(expr); while (v !== true && Date.now() < end) { await sleep(100); v = await app.evalJs(expr); } return v; };
let wallN = 0;
const wall = async (app) => {
  wallN += 1;
  const W = `cra-wall-${wallN}`, P = `cra-page-${wallN}`, N = `cra-nested-${wallN}`, O = `cra-old-${wallN}`;
  await freshDesk(app);
  const rows = [
    { id: W, text: 'Resize wall', origin: null, source: null, projectId: null, pageType: 'board',
      // Every card is placed ON SCREEN (the visible canvas is ~0.67 of its width tall at 1400x900) and clear of the others' growth - the first run's pins came from the pin seam's default slots, which sat
      // below the viewport (y 0.7 and 1.0), so the driver could not find a handle to take.
      boxes: [{ id: 'cra-text', kind: 'text', x: 0.62, y: 0.5, w: 0.22, h: 0.12, z: 9, text: 'A free text card' },
        { id: 'cra-oldpin', kind: 'page-pin', x: 0.45, y: 0.3, w: 0.28, h: 0.12, z: 8, entryId: O },    // an OLDER, wide page card (item 138's grandfathered shape)
        { id: 'cra-pagepin', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.16, h: 0.22, z: 5, entryId: P },  // a page card at its born silhouette
        { id: 'cra-boardpin', kind: 'page-pin', x: 0.55, y: 0.05, w: 0.32, h: 0.10, z: 6, entryId: N }] },   // a nested board's card at its born (wide) silhouette
    { id: P, text: 'Resize page', origin: null, source: null, projectId: null, pageType: 'manuscript' },
    { id: N, text: 'Resize nested board', origin: null, source: null, projectId: null, pageType: 'board', boxes: [] },
    { id: O, text: 'Resize old page', origin: null, source: null, projectId: null, pageType: 'manuscript' },
  ];
  for (const r of rows) await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(r)})`);
  await settle(app, `(() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').map(e => e.id); return ${JSON.stringify([W, P, N, O])}.every(id => es.includes(id)); })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed' });
  await app.evalJs('window.wrizoFlushNow()');
  await app.evalJs(`location.hash = '#/page/${W}'`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the wall' });
  await sleep(500);
  const boxes = (await app.evalJs('window.wrizoBoard()')) || [];
  return { pinned: true, page: boxes.find((x) => x.id === 'cra-pagepin'), board: boxes.find((x) => x.id === 'cra-boardpin'), text: boxes.find((x) => x.id === 'cra-text'), old: boxes.find((x) => x.id === 'cra-oldpin') };
};
const boxOf = async (app, id) => ((await app.evalJs('window.wrizoBoard()')) || []).find((b) => b.id === id);
const rectOf = (app, id) => app.evalJs(`(() => { const e = document.querySelector('[data-box-id="${id}"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);
const select = async (app, id) => {
  const p = await hittablePoint(app, `[data-box-id="${id}"]`);
  if (!p || !p.found) { ok(`DRIVER: a point inside ${id} is reachable by a real pointer`, false, JSON.stringify(p)); return false; }
  await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(60); await app.mouseUp(p.x, p.y); await sleep(500);
  return !!(await app.evalJs(`!!document.querySelector('[data-box-id="${id}"] .board-handle')`));
};
const handleAt = (app, id) => app.evalJs(`(() => { const h = document.querySelector('[data-box-id="${id}"] .board-handle'); if (!h) return null; const r = h.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
// a real corner drag: trusted press on the handle, stepped moves, release where the hand ends up
const drag = async (app, id, dx, dy, mid) => {
  const p = await handleAt(app, id);
  if (!p) { ok(`DRIVER: ${id} shows its corner handle`, false, 'absent'); return null; }
  await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y);
  // the hand stays inside the viewport (a far shrink would otherwise ask for a negative coordinate)
  const tx = Math.max(5, Math.round(p.x + dx)), ty = Math.max(5, Math.round(p.y + dy));
  const steps = 8;
  for (let i = 1; i <= steps; i += 1) { await app.mouseMove(Math.round(p.x + ((tx - p.x) * i) / steps), Math.round(p.y + ((ty - p.y) * i) / steps)); await sleep(20); if (mid && i === mid.at) await mid.fn(); }
  await app.mouseUp(tx, ty);
  await sleep(300);
  return p;
};
const ratio = (b) => b.h / b.w;

await withHarness(async (app) => {
  // ============================================================ C1 / C2 / C4 / C5: the page card
  let f = await wall(app);
  ok('fixture: a page card and a nested-board card are on the wall and ON SCREEN (seeded in the wall\'s own boxes), with a free text card', f.pinned && !!f.page && !!f.board && !!f.text, JSON.stringify({ pinned: f.pinned, page: !!f.page, board: !!f.board, text: !!f.text }));
  if (f.page && f.board && f.text) {
    if (await select(app, f.page.id)) {
      const b0 = await boxOf(app, f.page.id);
      const r0 = await rectOf(app, f.page.id);
      const dx = 120;
      const start = await drag(app, f.page.id, dx, 0);
      const b1 = await boxOf(app, f.page.id); const r1 = await rectOf(app, f.page.id);
      ok('C1: dragging the corner RIGHT makes the page card BIGGER (both axes grow) and its proportions do not change', b1.w > b0.w + 0.02 && b1.h > b0.h + 0.02 && Math.abs(ratio(b1) - PAGE_ASPECT) < TOL, JSON.stringify({ b0, b1, want: PAGE_ASPECT }));
      // C4: where the corner ended vs the pointer, against what the old dx-only lock would have done
      const end = { x: start.x + dx, y: start.y };
      ok('C4: after a SIDEWAYS drag the card\'s right edge is UNDER THE POINTER (within 3px) - 140px right is +140px wide: the axis the pointer moved more drives the size, so the corner keeps up with the hand on that axis', Math.abs(r1.r - end.x) <= 3, JSON.stringify({ edgeX: Math.round(r1.r), pointerX: end.x }));

      const p2 = await boxOf(app, f.page.id);
      await drag(app, f.page.id, 0, 120);
      const b2 = await boxOf(app, f.page.id);
      const r2 = await rectOf(app, f.page.id);
      ok('C2: dragging the corner DOWN makes the card BIGGER, its proportions do not change, and its bottom edge is UNDER THE POINTER (within 3px) - a vertical drag used to do nothing at all', b2.w > p2.w + 0.01 && b2.h > p2.h + 0.02 && Math.abs(ratio(b2) - PAGE_ASPECT) < TOL && Math.abs(r2.b - (r1.b + 120)) <= 3, JSON.stringify({ before: p2, after: b2, bottom: Math.round(r2.b), pointerY: Math.round(r1.b + 120) }));

      // C3: along the diagonal the corner lands on the pointer
      const r3 = await rectOf(app, f.page.id);
      const v = { x: 60, y: Math.round(60 * (r3.h / r3.w)) };
      const s3 = await drag(app, f.page.id, v.x, v.y);
      const r3b = await rectOf(app, f.page.id);
      ok('C3: a drag ALONG the card\'s own diagonal puts the corner on the pointer (within 12px) - the corner follows the hand', Math.hypot(r3b.r - (s3.x + v.x), r3b.b - (s3.y + v.y)) <= 12, JSON.stringify({ corner: { x: Math.round(r3b.r), y: Math.round(r3b.b) }, pointer: { x: s3.x + v.x, y: s3.y + v.y } }));

      // C5: shrink, both floors
      const before5 = await boxOf(app, f.page.id);
      await drag(app, f.page.id, -60, -60);
      const small = await boxOf(app, f.page.id);
      ok('C5: dragging UP-LEFT makes the card SMALLER, its proportions unchanged', small.w < before5.w - 0.01 && small.h < before5.h - 0.01 && Math.abs(ratio(small) - PAGE_ASPECT) < TOL, JSON.stringify({ before: before5, small }));
      await drag(app, f.page.id, -900, -900);
      const floor = await boxOf(app, f.page.id);
      ok('C5: dragged far past the floor it stops at MIN_PIN_H and the min width (neither crossed), and the proportions still hold', floor.h >= MIN_PIN_H - 0.0005 && floor.w >= MIN_PIN_W - 0.0005 && Math.abs(ratio(floor) - PAGE_ASPECT) < TOL, JSON.stringify({ floor, MIN_PIN_H, MIN_PIN_W }));
    }
  }

  // ============================================================ C6: the nested board's pin (wide) - the same rule
  f = await wall(app);
  if (f.board) {
    if (await select(app, f.board.id)) {
      const b0 = await boxOf(app, f.board.id);
      await drag(app, f.board.id, 120, 0);
      const b1 = await boxOf(app, f.board.id);
      ok('C6: a BOARD pin dragged RIGHT gets bigger, and stays WIDE at the board aspect', b1.w > b0.w + 0.02 && b1.h > b0.h + 0.005 && b1.w > b1.h && Math.abs(ratio(b1) - BOARD_ASPECT) < TOL, JSON.stringify({ b0, b1, want: BOARD_ASPECT }));
      await drag(app, f.board.id, 0, 90);
      const b2 = await boxOf(app, f.board.id);
      ok('C6: and dragged DOWN it gets bigger again at the same aspect (the vertical drag counts)', b2.w > b1.w + 0.005 && b2.h > b1.h + 0.003 && Math.abs(ratio(b2) - BOARD_ASPECT) < TOL, JSON.stringify({ b1, b2 }));
    }
  }

  // ============================================================ C7: a text card stays free   C8: the cursor, the whole gesture
  f = await wall(app);
  if (f.text && f.page) {
    if (await select(app, f.text.id)) {
      const t0 = await boxOf(app, f.text.id);
      await drag(app, f.text.id, 100, 0);
      const t1 = await boxOf(app, f.text.id);
      await drag(app, f.text.id, 0, 70);
      const t2 = await boxOf(app, f.text.id);
      ok('C7: a TEXT card is still free on both axes - a sideways drag changes only the width, a downward one only the height', t1.w > t0.w + 0.02 && Math.abs(t1.h - t0.h) < 0.004 && t2.h > t1.h + 0.02 && Math.abs(t2.w - t1.w) < 0.004, JSON.stringify({ t0, t1, t2 }));
    }
    if (f.old && await select(app, f.old.id)) {
      const o0 = await boxOf(app, f.old.id);
      await drag(app, f.old.id, 70, 0);
      const o1 = await boxOf(app, f.old.id);
      ok('C9: an OLDER, wide page card (0.28 x 0.12) dragged RIGHT never gets narrower - it takes its kind\'s shape at the first pixel (taller) and grows from there, so an outward drag always grows it', o1.w >= o0.w - 0.0005 && o1.h > o0.h + 0.02 && Math.abs(ratio(o1) - PAGE_ASPECT) < TOL, JSON.stringify({ o0, o1 }));
    }
    if (await select(app, f.page.id)) {
      const seen = [];
      const probe = (label) => app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const ids = ['${f.page.id}']; const out = {};
        const r = document.querySelector('[data-box-id="${f.page.id}"]').getBoundingClientRect();
        const body = document.elementFromPoint(Math.round(r.left + r.width / 3), Math.round(r.top + r.height / 3));
        out.body = body ? getComputedStyle(body).cursor : null; out.flag = c.dataset.resizing || null; out.label = '${label}'; return out; })()`);
      const p = await handleAt(app, f.page.id);
      await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y);
      for (let i = 1; i <= 4; i += 1) { await app.mouseMove(p.x + 25 * i, p.y + 8 * i); await sleep(20); }
      seen.push(await probe('mid-drag, card text'));
      // a point on EMPTY canvas, far from the card, then the cursor under it
      const ep = await app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const r = c.getBoundingClientRect();
        for (let y = r.bottom - 60; y > r.top + 300; y -= 25) for (let x = r.left + 60; x < r.right - 60; x += 25) if (document.elementFromPoint(x, y) === c) return { x: Math.round(x), y: Math.round(y) };
        return null; })()`);
      let emptyCursor = null;
      if (ep) { await app.mouseMove(ep.x, ep.y); await sleep(60); emptyCursor = await app.evalJs(`getComputedStyle(document.elementFromPoint(${ep.x}, ${ep.y})).cursor`); }
      const handleCursor = await app.evalJs(`getComputedStyle(document.querySelector('[data-box-id="${f.page.id}"] .board-handle')).cursor`);
      await app.mouseUp(ep ? ep.x : p.x + 100, ep ? ep.y : p.y + 32); await sleep(300);
      const after = await probe('after release');
      ok('C8: while the corner is HELD the cursor is the diagonal arrow over the card\'s own text, over empty canvas and over the handle - never the I-beam / default / vertical',
        seen[0].body === 'nwse-resize' && seen[0].flag === 'true' && emptyCursor === 'nwse-resize' && handleCursor === 'nwse-resize', JSON.stringify({ seen, emptyCursor, handleCursor, ep }));
      ok('C8: and it is RELEASED with the corner - the flag is gone and the card text no longer reads the diagonal arrow (nothing stuck)', after.flag === null && after.body !== 'nwse-resize', JSON.stringify(after));
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nCARD-RESIZE-AXIS VERIFY: PASS (${checks.length} checks)` : `\nCARD-RESIZE-AXIS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
