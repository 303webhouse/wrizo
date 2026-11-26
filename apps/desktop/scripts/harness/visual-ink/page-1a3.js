// VISUAL 1a.3 - ink where the plan says: the whole tab on a Board, the short set on a Page in BUILD and EDIT. The page side; load page.js first. The reorg's own surfaces (the live
// defaults: no ?reorg=0). Assigns window.__vi3. Strokes here are synthetic pointer events; visual-1a3.mjs types and draws with trusted ones as well.
(() => {
  const v = () => window.__vi;
  const q = (s) => document.querySelector(s);
  const all = (s) => [...document.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const J = (x) => JSON.stringify(x);
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
  const entry = (id) => { if (window.wrizoFlushNow) window.wrizoFlushNow(); return (JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).find((e) => e.id === id) || null; };
  const until = async (fn, ms = 6000) => { for (let i = 0; i < ms / 100; i++) { if (fn()) return true; await sleep(100); } return false; };
  // Arbor draws its tabs as folder tabs beside the drawer, outside .wz-sliver; its first tab is Format
  const tabs = () => all('[id^="wz-sliver-tab-"]').map((t) => t.id.replace('wz-sliver-tab-', '').replace('format', 'text'));
  const tab = async (name) => { const t = q('#wz-sliver-tab-' + name) || (name === 'text' ? q('#wz-sliver-tab-format') : null); if (t) t.click(); await sleep(450); return !!t; };
  const stage = async (mode) => { await v().click(`.desk-mode-tab[data-mode-key="${mode}"]`, 900); };

  /** A Doc page open in BUILD with the Front menu out. */
  const buildPage = async (theme, words = '') => {
    location.hash = '#/';
    await sleep(500);
    if (theme && window.wrizoTheme) window.wrizoTheme.set(theme);
    const id = window.wrizoCreateJournalPage(words ? { text: words } : undefined).id;
    location.hash = '#/page/' + id;
    await until(() => !!q('.forward-only-editor'));
    await sleep(500);
    await stage('draft');
    await v().openDrawer();
    return id;
  };

  const paper = () => (q('.mode-page') ? q('.mode-page').getAttribute('data-instrument') : null);
  const rows = () => all('.wz-ink-studio-body [data-ink-row]').map((b) => b.getAttribute('data-ink-row'));

  /** P1-P8: the Page in BUILD and EDIT. Expects a BUILD page with words, drawer out. */
  const pageSet = async (id) => {
    const out = [];
    const ok = (name, pass, detail) => out.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : J(detail) });
    const before = entry(id).text;

    ok('P1: BUILD\'s Front menu has an INK tab between the first and the last', J(tabs()) === J(['text', 'ink', 'parts']), tabs());
    await tab('ink');
    await until(() => !!q('.wz-ink-face'));
    await sleep(500);
    ok('P2: the INK tab shows the face and a closed Studio, and the paper is in ink', !!q('.wz-ink-face') && !!q('.wz-ink-studio') && q('.wz-ink-studio').getAttribute('aria-expanded') === 'false' && paper() === 'ink', { paper: paper() });
    await v().setStudio(true);
    const door = q('.wz-ink-studio-body .wz-ink-door');
    const bodyText = text(q('.wz-ink-studio-body'));
    ok('P3: Studio on a Page holds only built rows of the short set (Brushes, Colour) and the "Draw on a Board" door at its foot; no Effects, Frames, Pictures, Layers or Guides',
      J(rows()) === J(['brushes', 'colour']) && !!door && /^Draw on a Board/.test(text(door)) && door === q('.wz-ink-studio-body').lastElementChild && !/effects|frames|pictures|layers|guides|shapes|lettering|select|export/i.test(bodyText), { rows: rows(), bodyText });
    await v().openRow('brushes');
    ok('P4: with a row open the door folds away with the other rows', !q('.wz-ink-studio-body .wz-ink-door') && J(rows()) === J(['brushes']), { rows: rows() });
    await v().setStudio(false);

    const n = (entry(id).strokes || []).length;
    await v().draw([{ x: 0.3, y: 0.5 }, { x: 0.5, y: 0.52 }, { x: 0.7, y: 0.5 }]);
    const after = entry(id);
    ok('P5: a stroke drawn in BUILD is stored on the page, and her words are exactly as they were', (after.strokes || []).length === n + 1 && after.text === before, { strokes: (after.strokes || []).length, same: after.text === before });

    await tab('text');
    ok('P6: back on the first tab the paper is out of ink and the INK tab is gone from the drawer', paper() !== 'ink' && !q('.wz-ink-face'), { paper: paper() });

    await tab('ink');
    await sleep(300);
    await stage('revise');
    await v().openDrawer();
    ok('P7: changing stage puts the pen down: EDIT opens in words, with its own INK tab', paper() !== 'ink' && J(tabs()) === J(['text', 'ink', 'parts']), { paper: paper(), tabs: tabs() });
    await tab('ink');
    await until(() => !!q('.wz-ink-face'));
    const inEdit = !!q('.wz-ink-face') && paper() === 'ink';
    await stage('freewrite');
    ok('P8: SPRINT draws no Front menu and never keeps the pen (no way to be stuck in ink)', inEdit && !q('.wz-sliver') && paper() !== 'ink', { inEdit, sliver: !!q('.wz-sliver'), paper: paper() });
    await stage('draft');
    await v().openDrawer();
    ok('P9: and BUILD comes back in words', paper() !== 'ink' && !q('.wz-ink-face'), { paper: paper() });
    return out;
  };

  /** P10-P11 (run in a narrow window, where one panel yields to another): a BUILD page in ink. Another panel taking the drawer's place puts the pen down; her own close keeps it. */
  const yields = async (id) => {
    const out = [];
    const ok = (name, pass, detail) => out.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : J(detail) });
    const grip = () => q('.wz-sliver-grip');
    const open = () => grip() && grip().getAttribute('aria-expanded') === 'true';
    await v().openDrawer();
    await tab('ink');
    await until(() => !!q('.wz-ink-face'));
    await sleep(400);
    grip().click();
    await sleep(700);
    ok('P11: closing the drawer herself keeps the pen (as Free Write), the grip showing it', !open() && paper() === 'ink' && !!q('.wz-sliver-grip-mark[data-instrument="ink"]'), { open: open(), paper: paper() });
    grip().click();
    await sleep(700);
    const docs = all('.desk-frame-strip button').find((b) => b.textContent.trim() === 'Docs');
    if (docs) docs.click();
    await sleep(1200);
    ok('P10: another panel taking the drawer\'s place puts the pen down - she is never left in ink with no menu, typing into nothing', !!docs && !open() && paper() !== 'ink', { docs: !!docs, open: open(), paper: paper() });
    return out;
  };

  /** A page with no ink, INK never opened: nothing of the ink code, and the drawer looks as it did but for the tab. */
  const cold = () => v().loads();

  /** "Draw on a Board" from a BUILD page: this Doc's Board opens with INK out; returns the Board's id. */
  const throughTheDoor = async () => {
    await tab('ink');
    await until(() => !!q('.wz-ink-studio'));
    await v().setStudio(true);
    const door = q('.wz-ink-studio-body .wz-ink-door');
    if (!door) return null;
    door.click();
    await until(() => !!q('.board-canvas'));
    await sleep(900);
    return location.hash.split('/page/')[1] || null;
  };

  /** B1-B8: the Board. Expects an ordinary Board open on its canvas. */
  const boardSet = async (boardId) => {
    const out = [];
    const ok = (name, pass, detail) => out.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : J(detail) });
    await v().openDrawer();
    ok('B1: a Board\'s drawer has two tabs, its own and INK', tabs().length === 2 && tabs()[1] === 'ink', tabs());
    await tab('ink');
    await until(() => !!q('.wz-ink-face') && !!q('.wz-board-ink-sheet'));
    await sleep(700);
    await v().setStudio(true);
    ok('B2: the INK tab on a Board is the face and the whole Studio that is built (Brushes, Colour), with no "Draw on a Board" door', J(rows()) === J(['brushes', 'colour']) && !q('.wz-ink-door'), { rows: rows() });
    await v().setStudio(false);

    const sheet = q('.wz-board-ink-sheet'), canvas = q('.board-canvas');
    if (!sheet || !canvas) { ok('B3-B7: the Board has a drawing layer to draw on', false, { sheet: !!sheet, canvas: !!canvas }); return out; }
    const sr = sheet.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
    ok('B3: the drawing layer covers the Board exactly', Math.abs(sr.width - cr.width) < 1 && Math.abs(sr.height - cr.height) < 1 && Math.abs(sr.left - cr.left) < 1, { sheet: [sr.width, sr.height], canvas: [cr.width, cr.height] });

    const boxes = () => (entry(boardId) && entry(boardId).boxes || []).length;
    const had = boxes();
    const ev = (type, x, y, buttons) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 9, pointerType: 'mouse', button: 0, buttons, clientX: cr.left + x, clientY: cr.top + y });
    sheet.dispatchEvent(ev('pointerdown', 60, 60, 1));
    for (let i = 1; i < 10; i++) { sheet.dispatchEvent(ev('pointermove', 60 + i * 18, 60 + i * 6, 1)); await sleep(10); }
    sheet.dispatchEvent(ev('pointerup', 222, 114, 0));
    await sleep(700);
    const e = entry(boardId);
    const s = (e.strokes || [])[0];
    ok('B4: a stroke on the Board is stored in the Board\'s own strokes, normalised by the Board\'s width as its cards are, and it made no card',
      (e.strokes || []).length === 1 && !!s && Math.abs(s.points[0].x - 60 / cr.width) < 0.01 && Math.abs(s.points[0].y - 60 / cr.width) < 0.01 && boxes() === had, { strokes: (e.strokes || []).length, first: s && s.points[0], boxes: [had, boxes()] });

    const painted = () => { const c = sheet.querySelector('.ink-committed'); if (!c || c.width < 2) return 0; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; };
    ok('B5: and it is painted on the Board', painted() > 20, { painted: painted() });

    // the face is whole and on top of whatever is under it (Arbor's Board keeps its width, so the drawer lies over it there)
    await v().setStudio(false);
    const faceBox = q('.wz-ink-face').getBoundingClientRect();
    const hit = [[0.1, 0.25], [0.9, 0.25], [0.1, 0.8], [0.9, 0.8]].map(([fx, fy]) => { const el = document.elementFromPoint(faceBox.left + faceBox.width * fx, faceBox.top + faceBox.height * fy); return !!el && !!el.closest('.wz-ink-face'); });
    ok('B8: on a Board the face is whole - at least 160 px wide, and nothing lies over it', faceBox.width >= 160 && hit.every(Boolean), { width: Math.round(faceBox.width), hit });

    const wrap = q('.board-canvas-wrap').getBoundingClientRect(), panel = q('.wz-sliver-panel').getBoundingClientRect();
    ok('B6: the tab is never taller than the Board it opens from (it follows the Board\'s own height)', panel.height <= wrap.height + 1, { panel: panel.height, board: wrap.height });

    await tab('text');
    const inert = getComputedStyle(q('.wz-board-ink-sheet')).pointerEvents;
    ok('B7: off INK the drawing stays on show and takes no pointer, so cards are hers to work again', inert === 'none' && painted() > 20, { inert, painted: painted() });
    return out;
  };

  /** After Back from a Board reached by the door: that Board stands beside the page, and the drawing she just made is on it. */
  const beside = (boardId) => {
    const asset = q('.wz-split-asset');
    const c = asset && asset.querySelector('.wz-board-own-ink');
    let painted = 0;
    if (c && c.width > 1) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) painted++; }
    return { split: !!asset && asset.getAttribute('data-split-asset') === boardId, painted, empty: !!(asset && asset.querySelector('.wz-split-board-empty')), focused: !!document.activeElement && document.activeElement.classList.contains('forward-only-editor') };
  };
  /** Draw across the Board that is open. */
  const drawOnBoard = async () => {
    const sheet = q('.wz-board-ink-sheet');
    if (!sheet) return false;
    const r = sheet.getBoundingClientRect();
    const ev = (t, x, y, b) => new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 3, pointerType: 'mouse', button: 0, buttons: b, clientX: r.left + x, clientY: r.top + y });
    sheet.dispatchEvent(ev('pointerdown', 50, 50, 1));
    for (let i = 1; i < 8; i++) { sheet.dispatchEvent(ev('pointermove', 50 + i * 20, 50 + i * 10, 1)); await sleep(10); }
    sheet.dispatchEvent(ev('pointerup', 190, 120, 0));
    await sleep(600);
    return true;
  };
  const back = async () => { const b = all('button').find((x) => x.textContent.trim() === 'Back'); if (b) b.click(); await sleep(2500); return !!b; };

  const readBoard = (boardId) => { const e = entry(boardId); return { strokes: (e && e.strokes || []).length, boxes: (e && e.boxes || []).length, painted: (() => { const c = q('.wz-board-ink-sheet .ink-committed'); return c ? [c.width, c.height] : null; })() }; };

  window.__vi3 = { yields, beside, drawOnBoard, back, buildPage, pageSet, boardSet, throughTheDoor, readBoard, cold, tabs, tab, stage, paper, entry, until };
})();
