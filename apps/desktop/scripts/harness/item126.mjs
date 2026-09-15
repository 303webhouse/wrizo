// ITEM 126 (121-B) B6 — INK ACROSS MODES: render, permission, and the move.
//
// EVERY POINTER IS TRUSTED — CDP Input.* via app.penStroke / app.mouseDown /
// app.doubleClick, never element.dispatchEvent(new PointerEvent(...)). On this
// file that is doubly load-bearing: the feature IS pointer routing, and the one
// clause Nick stated in his own words (text stays editable by cursor) can only
// be proven by a REAL double-click producing a REAL word selection.
//
// EVERY GESTURE GOES THROUGH A PROBE. A bare driver call on a missing node
// throws, aborts the FILE, and reports nothing — item 121's fx7 went NOVERDICT
// exactly that way. A driver can lie by dying as easily as by doing nothing.
//
// COORDINATES: a stored StrokePoint's x AND y are both normalized by the
// sheet's WIDTH (J8). Converting y by HEIGHT is the mistake that already cost
// this lane a check that passed for the wrong reason, so every screen/stored
// conversion here goes through one helper that does it the renderer's way.
//
// ── WHAT THIS FILE CANNOT PROVE, SAID UP FRONT ───────────────────────────
// A move by finger and by stylus on real glass is no more provable headless
// than item 121's palm rejection was. The gesture is asserted with trusted
// mouse and pen input; the tablet sitting remains the gate for the hand.
//
//   C1  render — the stratum mounts and anchors in ALL THREE modes.
//   C2  permission — the paper's data-ink agrees with the mode, every flip.
//   C3  Free Write / TEXT is INERT, and a double-click there arms NOTHING
//       (121-B §3.1, ruled: R15 stands — asserted as the NEGATIVE so the
//       ruling is proven rather than assumed).
//   C4  DRAFT   — renders, types, no drawing, word-select survives, ink arms.
//   C5  REVISE  — the same four, asserted SEPARATELY. Draft and Revise share
//       one editor path (freeEdit), which is exactly why one wrong gate would
//       pass one and fail the other.
//   C6  the move — persisted geometry translates; TEXT'S RECT IS UNMOVED and
//       the TEXT IS BYTE-IDENTICAL across an arm-and-move.
//   C7  the eraser clause — erases travel with their group.
//   C8  the clamp — a group cannot be pushed off the sheet (FX17's law).
//   C9  Escape releases; undo restores the pre-move geometry, one level.
//   C10 cross-mode — drawn in Free Write, present in Draft and Revise at
//       identical normalized geometry, and §7A's autosave regression re-run.
//   C11 the band does not grow, in any mode.
//   C12 zero network across every ink act, a MOVE included.
//   C13 shots, per mode, both widths.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const W1 = 1366, H1 = 768;
const W2 = 1680, H2 = 1050;
const SHEET = '.wz-ink-sheet';
const CANVAS = '.wz-ink-sheet .ink-committed';
const PAPER = '.mode-page';
const BAND = '.desk-frame-host .sprint-nav';
const EDITOR = '.forward-only-editor';

const rectOf = (sel) => `(() => { const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null; const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; })()`;

const present = (app, sel) => app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`);
const where = (app) => app.evalJs(`({ hash: location.hash,
  editor: !!document.querySelector('${EDITOR}'), sheet: !!document.querySelector('${SHEET}'),
  paper: !!document.querySelector('${PAPER}'), framed: !!document.querySelector('.desk-frame'),
  mode: (document.querySelector('.desk-mode-tab.active') || {}).textContent,
  ink: (document.querySelector('${PAPER}') || {}).getAttribute
       ? document.querySelector('${PAPER}').getAttribute('data-ink') : null })`);

const safePen = async (app, sel, points, label) => {
  if (!(await present(app, sel))) {
    ok(`DRIVER: ${label} — ${sel} ABSENT, no pen stroke dispatched`, false, JSON.stringify(await where(app)));
    return false;
  }
  await app.penStroke(sel, points);
  return true;
};

const freshDesk = async (app, width = W1, height = H1) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// Through persistence.ts's own seam — the SAME call the real Catch door makes.
// A hand-written localStorage row can be a shape the app would never produce,
// and then the fixture, not the feature, is what the run measures.
const freshPage = async (app, width = W1, height = H1) => {
  await freshDesk(app, width, height);
  const id = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(id)}`);
  await app.waitFor(`!!document.querySelector('${EDITOR}')`, { label: 'page mounted' });
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'DeskFrame mounted' });
  await sleep(300);
  return id;
};

// A page opens in DRAFT. Modes are entered through the writer's own door.
// The re-persist after a mode switch lands ~1100ms later, so anything that
// reads the store immediately after a switch reads a stale page.
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

const strokesOf = async (app, id) => app.evalJs(
  `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = l.find(x => x.id === ${JSON.stringify(id)}); return (e && e.strokes) || []; })()`);

// Screen point for a stored normalized point. BOTH axes over WIDTH — the
// renderer's own rule, and the one this lane has already got wrong once.
const screenOf = (app, np) => app.evalJs(`(() => {
  const el = document.querySelector('${SHEET}'); if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + ${np.x} * r.width, y: r.top + ${np.y} * r.width }; })()`);

const midOf = (stroke) => stroke.points[Math.floor(stroke.points.length / 2)];
const bboxOf = (pts) => ({
  x0: Math.min(...pts.map(p => p.x)), x1: Math.max(...pts.map(p => p.x)),
  y0: Math.min(...pts.map(p => p.y)), y1: Math.max(...pts.map(p => p.y)),
});
const arc = (n = 12, y = 0.22) => Array.from({ length: n }, (_, i) => {
  const t = i / (n - 1);
  return { x: 0.25 + 0.45 * t, y: y + 0.06 * Math.sin(Math.PI * t) };
});

// Draw one stroke in Free Write / INK and return the page id.
const pageWithInk = async (app, width = W1, height = H1) => {
  const id = await freshPage(app, width, height);
  await toMode(app, 'freewrite');
  await app.waitFor("!!document.querySelector('.wz-ink-switch')", { label: 'Free Write switch' });
  await setInstrument(app, 'ink');
  await safePen(app, SHEET, arc(), 'seed stroke');
  await sleep(700);
  return id;
};

await withHarness(async (app) => {
  // ==========================================================================
  // C1 — THE STRATUM RENDERS IN EVERY MODE, and anchors in every mode.
  // The founding fact of item 121 §7A was "Free Write only"; this is its
  // deliberate inversion, and it is the whole point of the ticket.
  // ==========================================================================
  const pageId = await pageWithInk(app, W1, H1);

  for (const [label, key] of [['Free Write', 'freewrite'], ['Draft', 'draft'], ['Revise', 'revise']]) {
    await toMode(app, key);
    const sheet = await app.evalJs(rectOf(SHEET));
    const canvas = await app.evalJs(rectOf(CANVAS));
    const near = (a, b) => a != null && b != null && Math.abs(a - b) <= 0.6;
    ok(`C1 (${label}): the stratum is MOUNTED — the ink is the PAGE'S, not Free Write's decoration (item 121 §7A said "Free Write only"; this is the inversion this ticket exists for)`,
      !!canvas, JSON.stringify({ canvas: !!canvas, mode: label }));
    ok(`C1 (${label}): and its canvas box IS the sheet's box on every edge (within 0.6px) — the anchor law holds in a mode that never had a canvas before`,
      !!sheet && !!canvas && near(sheet.left, canvas.left) && near(sheet.right, canvas.right)
        && near(sheet.top, canvas.top) && near(sheet.bottom, canvas.bottom),
      JSON.stringify({ sheet, canvas }));
  }

  // ==========================================================================
  // C2 — PERMISSION, read off the paper, agreeing with the mode every flip.
  // data-ink and data-instrument are SEPARATE attributes precisely so they can
  // be caught disagreeing; one overloaded attribute never could.
  // ==========================================================================
  const permAt = () => app.evalJs(`(() => { const p = document.querySelector('${PAPER}');
    return p ? { ink: p.getAttribute('data-ink'), instrument: p.getAttribute('data-instrument') } : null; })()`);

  await toMode(app, 'freewrite');
  await setInstrument(app, 'ink');
  const pFwInk = await permAt();
  await setInstrument(app, 'text');
  const pFwText = await permAt();
  await toMode(app, 'draft');
  const pDraft = await permAt();
  await toMode(app, 'revise');
  const pRevise = await permAt();

  ok('C2: Free Write / INK reads permission=edit and instrument=ink',
    pFwInk && pFwInk.ink === 'edit' && pFwInk.instrument === 'ink', JSON.stringify(pFwInk));
  ok('C2: Free Write / TEXT reads permission=inert and instrument=text — 121-B §3.1 ruled: the TEXT half stays INERT, R15 stands',
    pFwText && pFwText.ink === 'inert' && pFwText.instrument === 'text', JSON.stringify(pFwText));
  ok('C2: DRAFT reads permission=movable and carries NO instrument at all — a Draft page is not "in TEXT", it is a word processor with ink on it',
    pDraft && pDraft.ink === 'movable' && pDraft.instrument === null, JSON.stringify(pDraft));
  ok('C2: REVISE reads permission=movable and carries no instrument either',
    pRevise && pRevise.ink === 'movable' && pRevise.instrument === null, JSON.stringify(pRevise));

  // ==========================================================================
  // C3 — FREE WRITE / TEXT IS INERT, AND THE RULING IS PROVEN AS A NEGATIVE.
  // Fable, 2026-09-08: the TEXT half stays inert; the asymmetry is the reason,
  // not a hole — in Free Write the sketch pad is one press away, in Draft and
  // Revise there is no INK to switch to, which is why movable exists there.
  // A listener armed by "the writer is not drawing" would extend the gesture
  // here and reverse the ruling silently. THIS CHECK IS WHAT CATCHES THAT.
  // ==========================================================================
  await toMode(app, 'freewrite');
  await setInstrument(app, 'text');
  const inkNow = await strokesOf(app, pageId);
  const mid = inkNow.length ? midOf(inkNow[0]) : null;
  if (!mid) {
    ok('C3: (precondition) a seeded stroke exists to aim at', false, JSON.stringify({ count: inkNow.length }));
  } else {
    const pt = await screenOf(app, mid);
    await app.doubleClick(pt.x, pt.y);
    await sleep(400);
    const armedFw = await app.evalJs(`(() => {
      const c = document.querySelector('${SHEET} .ink-active');
      if (!c) return { canvas: false };
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let painted = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) painted++;
      return { canvas: true, outlinePixels: painted }; })()`);
    ok('C3: in Free Write / TEXT a trusted DOUBLE-CLICK ON INK arms NOTHING — no outline is drawn. This asserts the RULING as a negative, so a listener that armed on "not drawing" would be caught here rather than shipping',
      armedFw.canvas === true && armedFw.outlinePixels === 0, JSON.stringify(armedFw));
    const fwText = await app.evalJs(`(document.querySelector('${EDITOR}') || { innerText: null }).innerText`);
    await safePen(app, SHEET, [{ x: 0.3, y: 0.5 }, { x: 0.6, y: 0.5 }], 'pen in FW/TEXT');
    await sleep(600);
    const afterPenFw = await strokesOf(app, pageId);
    ok('C3: and a trusted PEN stroke in Free Write / TEXT still creates NO stroke — item 121\'s inertness is untouched by this ticket',
      afterPenFw.length === inkNow.length, JSON.stringify({ before: inkNow.length, after: afterPenFw.length }));
    const fwTextAfter = await app.evalJs(`(document.querySelector('${EDITOR}') || { innerText: null }).innerText`);
    ok('C3: and the page text is unchanged by both — the I0 seal still holds on this surface',
      fwText === fwTextAfter, JSON.stringify({ same: fwText === fwTextAfter }));
  }

  // ==========================================================================
  // C4 / C5 — DRAFT and REVISE, asserted SEPARATELY. They share one editor path
  // (freeEdit), which is exactly why a single wrong gate would pass one and
  // fail the other; a suite that tested only Draft would call that green.
  // ==========================================================================
  for (const [label, key] of [['DRAFT', 'draft'], ['REVISE', 'revise']]) {
    const id = await pageWithInk(app, W1, H1);
    await toMode(app, key);

    // (a) keystrokes type normally — the mode still does its own job.
    const beforeText = await app.evalJs(`(document.querySelector('${EDITOR}') || { innerText: '' }).innerText`);
    await app.evalJs(`document.querySelector('${EDITOR}')?.focus()`);
    await app.typeKeys('typed here');
    await sleep(500);
    const afterText = await app.evalJs(`(document.querySelector('${EDITOR}') || { innerText: '' }).innerText`);
    ok(`C4/C5 (${label}): a keystroke types normally — the stratum's arrival costs the mode nothing`,
      afterText.includes('typed here') && afterText !== beforeText, JSON.stringify({ afterText: afterText.slice(0, 40) }));

    // (b) no drawing: neither a pen nor a mouse drag makes a stroke here.
    const n0 = (await strokesOf(app, id)).length;
    await safePen(app, SHEET, [{ x: 0.3, y: 0.45 }, { x: 0.6, y: 0.45 }], `pen in ${label}`);
    await sleep(600);
    const nPen = (await strokesOf(app, id)).length;
    ok(`C4/C5 (${label}): a trusted PEN stroke creates NO stroke — ink is LOCKED here, not editable (Nick: "INK no longer becomes directly editable")`,
      nPen === n0, JSON.stringify({ before: n0, after: nPen }));
    const box = await app.evalJs(rectOf(SHEET));
    await app.mouseDown(box.left + box.width * 0.3, box.top + 120);
    for (let i = 1; i <= 6; i++) { await app.mouseMove(box.left + box.width * (0.3 + 0.05 * i), box.top + 120 + i * 2); await sleep(16); }
    await app.mouseUp(box.left + box.width * 0.6, box.top + 132);
    await sleep(600);
    const nMouse = (await strokesOf(app, id)).length;
    ok(`C4/C5 (${label}): and a trusted MOUSE drag over bare paper creates no stroke either`,
      nMouse === n0, JSON.stringify({ before: n0, after: nMouse }));

    // (c) THE CLAUSE NICK STATED HIMSELF: a double-click on BARE TEXT still
    // selects a word. The miss-path is the feature, not politeness.
    await app.evalJs("try { window.getSelection().removeAllRanges(); } catch (e) {}");
    const edRect = await app.evalJs(rectOf(EDITOR));
    await app.doubleClick(edRect.left + 30, edRect.top + 8);
    await sleep(350);
    const sel = await app.evalJs("(() => { const s = window.getSelection(); return s ? s.toString() : ''; })()");
    ok(`C4/C5 (${label}): a double-click on BARE TEXT still SELECTS A WORD — Nick's own clause ("text … only editable by standard in-line word processing led by a cursor") proven, and the clause an over-eager listener breaks first`,
      typeof sel === 'string' && sel.trim().length > 0, JSON.stringify({ selected: String(sel).slice(0, 30) }));

    // (d) a double-click on INK arms: the outline appears.
    const st = await strokesOf(app, id);
    const m = st.length ? midOf(st[0]) : null;
    if (!m) { ok(`C4/C5 (${label}): (precondition) a stroke to grab`, false, JSON.stringify({ n: st.length })); continue; }
    const p = await screenOf(app, m);
    await app.doubleClick(p.x, p.y);
    await sleep(400);
    const armed = await app.evalJs(`(() => { const c = document.querySelector('${SHEET} .ink-active');
      if (!c) return { canvas: false };
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
      return { canvas: true, outlinePixels: n }; })()`);
    ok(`C4/C5 (${label}): a double-click ON INK arms the group — the outline is painted`,
      armed.canvas === true && armed.outlinePixels > 0, JSON.stringify(armed));
  }

  // ==========================================================================
  // C6 — THE MOVE. Persisted geometry translates; the TEXT does not move, and
  // is byte-identical afterwards (the guard for the day reveal-on-click's
  // selectionchange listener stops being a no-op — arming clears the selection,
  // which pokes revealAtCaret).
  // ==========================================================================
  const moveId = await pageWithInk(app, W1, H1);
  await toMode(app, 'draft');
  await app.evalJs(`document.querySelector('${EDITOR}')?.focus()`);
  await app.typeKeys('the coat on the train');
  await sleep(2600); // past AUTOSAVE_MS
  const beforeStrokes = await strokesOf(app, moveId);
  const beforeBox = bboxOf(beforeStrokes[0].points);
  const textBefore = await app.evalJs(`(document.querySelector('${EDITOR}') || { innerText: '' }).innerText`);
  const edBefore = await app.evalJs(rectOf(EDITOR));

  const gp = await screenOf(app, midOf(beforeStrokes[0]));
  await app.doubleClick(gp.x, gp.y);
  await sleep(350);
  const sheetBox = await app.evalJs(rectOf(SHEET));
  const DX = Math.round(sheetBox.width * 0.12), DY = 40;
  await app.mouseDown(gp.x, gp.y);
  for (let i = 1; i <= 8; i++) { await app.mouseMove(gp.x + (DX * i) / 8, gp.y + (DY * i) / 8); await sleep(16); }
  await app.mouseUp(gp.x + DX, gp.y + DY);
  await sleep(900);

  const afterStrokes = await strokesOf(app, moveId);
  const afterBox = afterStrokes.length ? bboxOf(afterStrokes[0].points) : null;
  const expectDx = DX / sheetBox.width, expectDy = DY / sheetBox.width;
  const close = (a, b) => Math.abs(a - b) < 0.02;
  ok('C6: a trusted drag MOVES the stroke — the PERSISTED geometry translates by the drag delta on BOTH axes, in normalized-by-width units',
    !!afterBox && close(afterBox.x0 - beforeBox.x0, expectDx) && close(afterBox.y0 - beforeBox.y0, expectDy),
    JSON.stringify({ beforeBox, afterBox, expectDx, expectDy }));
  ok('C6: the stroke COUNT is unchanged — a move relocates ink, it never adds or drops any',
    afterStrokes.length === beforeStrokes.length, JSON.stringify({ before: beforeStrokes.length, after: afterStrokes.length }));

  const edAfter = await app.evalJs(rectOf(EDITOR));
  ok('C6: TEXT IS NEVER MOVABLE — the editor\'s rect is IDENTICAL across the move (Nick: "Text is not movable"). The ink slides over the words; the words do not budge',
    edBefore && edAfter && Math.abs(edBefore.left - edAfter.left) < 0.6 && Math.abs(edBefore.top - edAfter.top) < 0.6
      && Math.abs(edBefore.width - edAfter.width) < 0.6 && Math.abs(edBefore.height - edAfter.height) < 0.6,
    JSON.stringify({ edBefore, edAfter }));
  const textAfter = await app.evalJs(`(document.querySelector('${EDITOR}') || { innerText: '' }).innerText`);
  ok('C6: and the TEXT IS BYTE-IDENTICAL across the arm-and-move. Arming clears the DOM selection, which fires reveal-on-click\'s selectionchange listener (revealAtCaret); that is a no-op today because it returns at rangeCount 0, and THIS CHECK IS THE GUARD FOR THE DAY IT STOPS BEING ONE',
    textBefore === textAfter, JSON.stringify({ equal: textBefore === textAfter, len: textAfter.length }));

  // ==========================================================================
  // C9 — undo restores the pre-move geometry, one level.
  // ==========================================================================
  const undoPresent = await present(app, '.wz-ink-sheet .ink-undo');
  ok('C9: the undo affordance is offered in a movable mode — there is now a move to reverse',
    undoPresent === true);
  await app.evalJs("document.querySelector('.wz-ink-sheet .ink-undo')?.click()");
  await sleep(800);
  const undone = await strokesOf(app, moveId);
  const undoneBox = undone.length ? bboxOf(undone[0].points) : null;
  ok('C9: undo restores the PRE-MOVE geometry exactly — one level, and it reverses a MOVE (item 121\'s slice-the-last-stroke undo could not have expressed this, which is why it became a snapshot)',
    !!undoneBox && Math.abs(undoneBox.x0 - beforeBox.x0) < 1e-9 && Math.abs(undoneBox.y0 - beforeBox.y0) < 1e-9,
    JSON.stringify({ beforeBox, undoneBox }));

  // ==========================================================================
  // C7 — THE ERASER CLAUSE. An erase is a hole at a fixed place; if the ink
  // moves and its erases stay, the rubbed-out parts REAPPEAR at the old
  // position. Invisible to any check that only counts strokes — so this one
  // reads the erase's own stored geometry.
  // ==========================================================================
  const eraId = await pageWithInk(app, W1, H1);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(300);
  await app.evalJs("document.querySelector('.wz-ink-eraser')?.click()");
  await sleep(250);
  await safePen(app, SHEET, [{ x: 0.35, y: 0.24 }, { x: 0.5, y: 0.24 }], 'erase over the ink');
  await sleep(700);
  const withErase = await strokesOf(app, eraId);
  const eIdx = withErase.findIndex(s => s.eraser);
  ok('C7: (precondition) the page carries an ink stroke AND an erase stroke',
    eIdx >= 0 && withErase.some(s => !s.eraser), JSON.stringify({ n: withErase.length, eraserAt: eIdx }));
  if (eIdx >= 0) {
    const eBefore = bboxOf(withErase[eIdx].points);
    const iBefore = bboxOf(withErase.find(s => !s.eraser).points);
    await toMode(app, 'draft');
    const inkStroke = (await strokesOf(app, eraId)).find(s => !s.eraser);
    const ep = await screenOf(app, midOf(inkStroke));
    await app.doubleClick(ep.x, ep.y);
    await sleep(350);
    const sb = await app.evalJs(rectOf(SHEET));
    const edx = Math.round(sb.width * 0.10);
    await app.mouseDown(ep.x, ep.y);
    for (let i = 1; i <= 6; i++) { await app.mouseMove(ep.x + (edx * i) / 6, ep.y + (30 * i) / 6); await sleep(16); }
    await app.mouseUp(ep.x + edx, ep.y + 30);
    await sleep(900);
    const moved = await strokesOf(app, eraId);
    const eAfter = bboxOf(moved[eIdx].points);
    const iAfter = bboxOf(moved.find(s => !s.eraser).points);
    const dIx = iAfter.x0 - iBefore.x0, dEx = eAfter.x0 - eBefore.x0;
    const dIy = iAfter.y0 - iBefore.y0, dEy = eAfter.y0 - eBefore.y0;
    ok('C7: THE ERASE TRAVELS WITH ITS GROUP — it shifts by the SAME delta as the ink, on both axes. Left behind, the rubbed-out parts would REAPPEAR at the old position while the ink landed at the new one: the page would grow marks the writer had deliberately removed',
      Math.abs(dIx - dEx) < 1e-9 && Math.abs(dIy - dEy) < 1e-9 && Math.abs(dIx) > 0,
      JSON.stringify({ inkDelta: { x: dIx, y: dIy }, eraseDelta: { x: dEx, y: dEy } }));
  }

  // ==========================================================================
  // C8 — THE CLAMP. FX17's law applied to ink: a limit STOPS, never relocates.
  // ==========================================================================
  const clampId = await pageWithInk(app, W1, H1);
  await toMode(app, 'draft');
  const cs = await strokesOf(app, clampId);
  const cBefore = bboxOf(cs[0].points);
  const cp = await screenOf(app, midOf(cs[0]));
  await app.doubleClick(cp.x, cp.y);
  await sleep(350);
  const csb = await app.evalJs(rectOf(SHEET));
  // Shove hard left and up — far past the sheet's own edge.
  await app.mouseDown(cp.x, cp.y);
  for (let i = 1; i <= 10; i++) { await app.mouseMove(cp.x - (csb.width * i) / 10, cp.y - (400 * i) / 10); await sleep(16); }
  await app.mouseUp(cp.x - csb.width, cp.y - 400);
  await sleep(900);
  const clamped = await strokesOf(app, clampId);
  const cAfter = bboxOf(clamped[0].points);
  ok('C8: a group shoved past the sheet\'s edge STOPS at it — x never below 0, y never below 0 — and it still MOVED (FX17\'s law: a limit stops, it never relocates, and it never freezes the gesture outright)',
    cAfter.x0 >= -1e-9 && cAfter.y0 >= -1e-9 && cAfter.x0 < cBefore.x0,
    JSON.stringify({ cBefore, cAfter }));

  // ==========================================================================
  // C10 — CROSS-MODE, and §7A's autosave regression re-asserted rather than
  // trusted. A Draft save that dropped `strokes` would be data loss wearing the
  // same symptom as a render gap.
  // ==========================================================================
  const xId = await pageWithInk(app, W1, H1);
  const xFw = await strokesOf(app, xId);
  const xFwBox = bboxOf(xFw[0].points);
  await toMode(app, 'draft');
  await app.evalJs(`document.querySelector('${EDITOR}')?.focus()`);
  await app.typeKeys('drafting words');
  await sleep(2600);
  const xDraft = await strokesOf(app, xId);
  await toMode(app, 'revise');
  await app.evalJs(`document.querySelector('${EDITOR}')?.focus()`);
  await app.typeKeys(' revised');
  await sleep(2600);
  const xRevise = await strokesOf(app, xId);
  ok('C10: the stroke survives DRAFT\'s own autosave and REVISE\'s own autosave, carrying its tip/nib/ink — §7A\'s persistence half, re-measured on this tree rather than trusted from the last one',
    xDraft.length === xFw.length && xRevise.length === xFw.length
      && xRevise[0].tip === xFw[0].tip && xRevise[0].ink === xFw[0].ink,
    JSON.stringify({ fw: xFw.length, draft: xDraft.length, revise: xRevise.length, tip: xRevise[0] && xRevise[0].tip }));
  const xReviseBox = bboxOf(xRevise[0].points);
  ok('C10: and its normalized geometry is IDENTICAL across all three modes — the ink does not shift when the mode does',
    Math.abs(xReviseBox.x0 - xFwBox.x0) < 1e-9 && Math.abs(xReviseBox.y0 - xFwBox.y0) < 1e-9,
    JSON.stringify({ xFwBox, xReviseBox }));
  await app.reload();
  await app.waitFor(`!!document.querySelector('${EDITOR}')`, { label: 'after reload' });
  await sleep(500);
  const xReload = await strokesOf(app, xId);
  ok('C10: and it survives a RELOAD — the round trip goes through storage, which is the only thing that proves persistence rather than component state',
    xReload.length === xFw.length, JSON.stringify({ after: xReload.length }));

  // ==========================================================================
  // C11 — THE BAND DOES NOT GROW, in any mode. `.sprint-nav` is a WRAPPING flex
  // row, so a regression here is a whole row, not a few pixels.
  // ==========================================================================
  const bandId = await pageWithInk(app, W1, H1);
  void bandId;
  const heights = {};
  for (const [label, key] of [['freewrite', 'freewrite'], ['draft', 'draft'], ['revise', 'revise']]) {
    await toMode(app, key);
    const r = await app.evalJs(rectOf(BAND));
    heights[label] = r && r.height;
  }
  ok('C11: the band\'s height is the SAME in all three modes — the stratum\'s arrival in Draft and Revise costs the band nothing, and paper never reflows for chrome',
    heights.freewrite != null && Math.abs(heights.freewrite - heights.draft) < 0.6
      && Math.abs(heights.freewrite - heights.revise) < 0.6, JSON.stringify(heights));

  // ==========================================================================
  // C12 — ZERO NETWORK across every ink act, a MOVE included. The wave is
  // local-first; validation lives at the read boundary precisely so no server
  // is involved.
  // ==========================================================================
  await app.evalJs(`(() => {
    window.__wzNet = { fetch: 0, xhr: 0, beacon: 0 };
    const f = window.fetch;
    window.fetch = function (...a) { window.__wzNet.fetch++; return f.apply(this, a); };
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u, ...r) { window.__wzNet.xhr++; return open.call(this, m, u, ...r); };
    if (navigator.sendBeacon) { const b = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function (u, ...r) { window.__wzNet.beacon++; return b(u, ...r); }; }
  })()`);
  const netId = await strokesOf(app, xId);
  if (netId.length) {
    const np = await screenOf(app, midOf(netId[0]));
    await app.doubleClick(np.x, np.y);
    await sleep(300);
    await app.mouseDown(np.x, np.y);
    for (let i = 1; i <= 5; i++) { await app.mouseMove(np.x + 8 * i, np.y + 4 * i); await sleep(16); }
    await app.mouseUp(np.x + 40, np.y + 20);
    await sleep(800);
    await app.key('Escape');
    await sleep(200);
  }
  const net = await app.evalJs('window.__wzNet');
  ok('C12: ZERO NETWORK across arming, dragging, committing a move and releasing it — no fetch, no XHR, no beacon. The wave stays local-first, which is why I1 put validation at the read boundary instead of asking a server to reject enums',
    net && net.fetch === 0 && net.xhr === 0 && net.beacon === 0, JSON.stringify(net));

  // ==========================================================================
  // C13 — SHOTS, per mode, both widths.
  // ==========================================================================
  const shots = {};
  for (const [wl, width, height] of [['1366', W1, H1], ['1680', W2, H2]]) {
    const sid = await pageWithInk(app, width, height);
    void sid;
    for (const [label, key] of [['freewrite', 'freewrite'], ['draft', 'draft'], ['revise', 'revise']]) {
      await toMode(app, key);
      shots[`${label}-${wl}`] = (await app.screenshot()).length;
    }
  }
  ok('C13: shots captured — the page with ink in all three modes, at 1366 and 1680',
    Object.keys(shots).length === 6 && Object.values(shots).every(n => n > 1000), JSON.stringify(shots));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// item126.mjs is a brand-new file and parks NOTHING OF ITS OWN.
//
// ITEM 126 FALSIFIES NO LIVE ASSERTION ANYWHERE — established statically in
// docs/menus/item126-s0-survey.md §6 (no harness asserts the stratum's ABSENCE
// in any mode; item121.mjs S10 asserts the SWITCH is absent on Draft, which
// stays true and becomes more load-bearing) and CONFIRMED BY EXECUTION in this
// ticket's own stamped pair. The one artifact was a COMMENT, corrected in the
// same commit that falsified it.
//
// STATICALLY ZERO IS NOT MEASURED ZERO — this lane published "5 parks" on item
// 121 when the true count was 8, and the three it missed were invisible to a
// green UNPARKED run. The array below is emitted as JSON before the prose line
// so the count is read by the auditor rather than taken from this comment.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nITEM126 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; item126.mjs parks nothing of its own.`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM126 VERIFY: PASS (${checks.length} checks)` : `\nITEM126 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
