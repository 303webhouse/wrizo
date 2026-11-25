// VISUAL slice 1a - the page side of the INK checks. One source of truth: the harness files evaluate this text in the page, and a lane can
// import it from the dev server ( await import('/scripts/harness/visual-ink/page.js') ). It assigns window.__vi and does nothing else.
// Strokes drawn here are SYNTHETIC pointer events (the app does not ask isTrusted); the harness files draw trusted ones of their own too.
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const q = (s) => document.querySelector(s);
  const all = (s) => [...document.querySelectorAll(s)];
  const click = async (s, ms = 220) => { const el = typeof s === 'string' ? q(s) : s; if (el) el.click(); await sleep(ms); return !!el; };
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
  const rect = (s) => { const el = q(s); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), height: Math.round(r.height) }; };
  const J = (v) => JSON.stringify(v);

  const entry = (id) => (JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).find((e) => e.id === id) || null;
  const strokesOf = (id) => (entry(id) && entry(id).strokes) || [];
  const flush = async () => { if (window.wrizoFlushNow) window.wrizoFlushNow(); await sleep(150); };

  // A stroke across the sheet at fractions of its width (x) and of the visible paper (y).
  const draw = async (pts, id = 7) => {
    const sheet = q('.wz-ink-sheet');
    if (!sheet) return false;
    const r = sheet.getBoundingClientRect();
    const at = (p) => ({ clientX: r.left + p.x * r.width, clientY: r.top + p.y * Math.min(r.height, window.innerHeight - r.top) });
    const ev = (type, p, buttons) => new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: 'mouse', button: 0, buttons, pressure: buttons ? 0.5 : 0, ...at(p) });
    sheet.dispatchEvent(ev('pointerdown', pts[0], 1));
    for (const p of pts.slice(1)) { sheet.dispatchEvent(ev('pointermove', p, 1)); await sleep(8); }
    sheet.dispatchEvent(ev('pointerup', pts[pts.length - 1], 0));
    await sleep(250);
    await flush();
    return true;
  };

  const openDrawer = async () => { const g = q('.wz-sliver-grip'); if (g && g.getAttribute('aria-expanded') !== 'true') await click(g, 450); };
  // (Arbor's classic drawer calls its text tab Format)
  const instrument = async (which) => { await click(q('#wz-sliver-tab-' + which) || (which === 'text' ? q('#wz-sliver-tab-format') : null), 450); };

  // A fresh Free Write page, opened on the INK tab. Needs the classic drawer (?reorg=0): in the reorg Free Write has no Front menu.
  const freePage = async (theme) => {
    location.hash = '#/';
    await sleep(500);
    if (theme && window.wrizoTheme) window.wrizoTheme.set(theme);
    const id = window.wrizoCreateJournalPage().id;
    location.hash = '#/page/' + id;
    for (let i = 0; i < 60 && !q('.forward-only-editor'); i++) await sleep(100);
    await sleep(500);
    await click('.desk-mode-tab[data-mode-key="freewrite"]', 700);
    return id;
  };

  const rows = () => all('.wz-ink-studio-body [data-ink-row]').map((b) => b.getAttribute('data-ink-row'));
  const arrow = (s) => text(q(s + ' .wz-ink-arrow'));
  const studioOpen = () => q('.wz-ink-studio') && q('.wz-ink-studio').getAttribute('aria-expanded') === 'true';
  const setStudio = async (open) => { if (!!studioOpen() !== open) await click('.wz-ink-studio'); };
  const rowOpen = () => { const b = q('.wz-ink-studio-body [data-ink-row][aria-expanded="true"]'); return b ? b.getAttribute('data-ink-row') : null; };
  const openRow = async (name) => { await setStudio(true); const now = rowOpen(); if (now && now !== name) await click(`[data-ink-row="${now}"]`); if (rowOpen() !== name) await click(`[data-ink-row="${name}"]`); };

  // the panel's box against the sheet's (the page's) and the stage's, and the face against the panel
  const fit = async (label) => {
    const panel = q('.wz-sliver-panel');
    const out = { label, panel: rect('.wz-sliver-panel'), page: rect('.mode-page'), stage: rect('.desk-frame-stage'), pageScrolls: null, face: null };
    if (!panel || !out.page) return out;
    panel.scrollTop = 99999; await sleep(120);
    out.face = rect('.wz-ink-face');
    out.pageScrolls = panel.scrollHeight - panel.clientHeight;
    panel.scrollTop = 0; await sleep(60);
    return out;
  };
  // NEVER TALLER THAN THE SHEET is a rule about height: the Typewriter holds the writing line mid-screen, so on Free Write the paper's top is not where the drawer starts. Height against the sheet's, and the box inside the stage.
  const fits = (f) => !!f.panel && !!f.page && !!f.stage && !!f.face && f.panel.height <= f.page.height + 1 && f.panel.top >= f.stage.top - 1 && f.panel.bottom <= f.stage.bottom + 1 && f.face.top >= f.panel.top - 1 && f.face.bottom <= f.panel.bottom + 1;

  /** The shape of the INK tab (slice 1a.1). Expects a Free Write page with the drawer open on INK. Returns [{ name, pass, detail }]. */
  const shape = async (id) => {
    const out = [];
    const ok = (name, pass, detail) => out.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : J(detail) });

    const lines = all('.wz-ink-face .wz-ink-face-line');
    const l1 = lines[0], l2 = lines[1];
    ok('F1: the face is two lines - line one the brush in her hand (a button, with its arrow) and the size between a minus and a plus; line two the four inks and the eraser',
      lines.length === 2 && l1 && text(l1.querySelector('.wz-ink-brush .wz-ink-brush-word')) === 'Pen' && text(l1.querySelector('.wz-ink-brush .wz-ink-arrow')) === '▾'
        && !!l1.querySelector('.wz-ink-size-down') && !!l1.querySelector('.wz-ink-size-up') && text(l1.querySelector('.wz-ink-size-value')) === 'Regular'
        && l2 && l2.querySelectorAll('.wz-sliver-inks .wz-ink-swatch').length === 4 && l2.querySelectorAll('.wz-ink-eraser').length === 1,
      { lines: lines.length, l1: text(l1), swatches: all('.wz-sliver-inks .wz-ink-swatch').length });
    ok('F2: Studio is one door under the face, closed at the start, its arrow down, and nothing stands open below it',
      !!q('.wz-ink-studio') && !studioOpen() && arrow('.wz-ink-studio') === '▾' && !q('.wz-ink-studio-body') && all('.wz-ink-tips, .wz-ink-nibs').length === 0,
      { door: text(q('.wz-ink-studio')), body: !!q('.wz-ink-studio-body') });
    ok('F3: the old TIP / NIB / INK zones are gone - the face stands in their place',
      !all('.wz-sliver-body .wz-sliver-h').some((h) => /^(tip|nib|ink)$/i.test(h.textContent.trim())), all('.wz-sliver-body .wz-sliver-h').map(text));

    await setStudio(true);
    ok('F4: Studio opens DOWN onto the built rows only - DRAW: Brushes, Colour - each one word and one icon, arrows down, the door\'s arrow up',
      studioOpen() && arrow('.wz-ink-studio') === '▴' && J(rows()) === J(['brushes', 'colour']) && text(q('.wz-ink-studio-body .wz-ink-group')) === 'Draw'
        && all('.wz-ink-studio-body [data-ink-row]').every((b) => b.querySelector('svg') && text(b.querySelector('.wz-ink-arrow')) === '▾')
        && rect('.wz-ink-studio-body').top >= rect('.wz-ink-studio').bottom - 1,
      { rows: rows(), group: text(q('.wz-ink-studio-body .wz-ink-group')) });
    ok('F5: no unbuilt row is shown, and nothing is greyed as coming soon',
      !!q('.wz-ink-studio-body') && !/effects|shapes|frames|lettering|pictures|select|layers|guides|export|soon/i.test(q('.wz-ink-studio-body').textContent) && all('.wz-ink-tab [disabled]:not(.wz-ink-size-down):not(.wz-ink-size-up)').length === 0,
      text(q('.wz-ink-studio-body')));

    await openRow('brushes');
    const tips = all('.wz-ink-row-body .wz-ink-tips .wz-ink-tip').map((b) => b.getAttribute('aria-label'));
    const nibs = all('.wz-ink-row-body .wz-ink-nibs .wz-ink-nib').map((b) => text(b));
    ok('F6: opening Brushes folds the other rows away: only Brushes stands (arrow up) with the three brushes and the three sizes',
      J(rows()) === J(['brushes']) && rowOpen() === 'brushes' && arrow('[data-ink-row="brushes"]') === '▴' && J(tips) === J(['Pen', 'Pencil', 'Marker']) && J(nibs) === J(['Fine', 'Regular', 'Broad']),
      { rows: rows(), tips, nibs });
    await click('[data-ink-row="brushes"]');
    ok('F7: pressing the open row\'s name folds it and brings the list back', J(rows()) === J(['brushes', 'colour']) && rowOpen() === null && !q('.wz-ink-row-body'), { rows: rows() });
    await openRow('colour');
    const inks = all('.wz-ink-row-body .wz-ink-colours .wz-ink-colour').map((b) => b.getAttribute('aria-label'));
    ok('F8: opening Colour folds Brushes away and shows the theme\'s four inks by name', J(rows()) === J(['colour']) && J(inks) === J(['Walnut', 'Iron', 'Oxblood', 'Sea']), { rows: rows(), inks });
    await setStudio(false);
    ok('F9: pressing Studio folds everything', !studioOpen() && !q('.wz-ink-studio-body') && arrow('.wz-ink-studio') === '▾', text(q('.wz-ink-tab')));

    // the brush in her hand
    const before = strokesOf(id).length;
    await click('.wz-ink-brush');
    const listed = () => all('.wz-ink-recent [data-recent-tip]').map((b) => b.getAttribute('data-recent-tip'));
    const first = listed();
    await click('.wz-ink-recent [data-recent-tip="pencil"]');
    const shut = !q('.wz-ink-recent');
    const word = text(q('.wz-ink-brush .wz-ink-brush-word'));
    await draw([{ x: 0.2, y: 0.3 }, { x: 0.4, y: 0.34 }, { x: 0.6, y: 0.3 }]);
    const s1 = strokesOf(id)[before];
    ok('F10: the brush button opens a short list; picking Pencil closes it, the face says Pencil, and the next stroke is drawn with it',
      first.length === 3 && shut && word === 'Pencil' && !!s1 && s1.tip === 'pencil', { first, word, stroke: s1 && { tip: s1.tip, nib: s1.nib, ink: s1.ink } });
    await click('.wz-ink-brush'); await click('.wz-ink-recent [data-recent-tip="marker"]'); await click('.wz-ink-brush');
    const order = listed();
    await click('.wz-ink-brush');
    ok('F11: the list holds her last brushes, newest first', J(order) === J(['marker', 'pencil', 'pen']) && !q('.wz-ink-recent'), { order });

    await click('.wz-ink-size-up');
    const upWord = text(q('.wz-ink-size-value'));
    const upOff = q('.wz-ink-size-up') && q('.wz-ink-size-up').disabled;
    await draw([{ x: 0.2, y: 0.42 }, { x: 0.5, y: 0.44 }]);
    const s2 = strokesOf(id)[before + 1];
    await click('.wz-ink-size-down'); await click('.wz-ink-size-down');
    const downWord = text(q('.wz-ink-size-value'));
    const downOff = q('.wz-ink-size-down') && q('.wz-ink-size-down').disabled;
    await click('.wz-ink-size-up');
    ok('F12: the size steps with minus and plus (Fine, Regular, Broad), stops at each end, and the stroke takes it',
      upWord === 'Broad' && upOff === true && downWord === 'Fine' && downOff === true && !!s2 && s2.nib === 'broad' && s2.tip === 'marker', { upWord, downWord, stroke: s2 && { tip: s2.tip, nib: s2.nib } });

    await click('.wz-sliver-inks .wz-ink-swatch[aria-label="Oxblood"]');
    await draw([{ x: 0.2, y: 0.5 }, { x: 0.5, y: 0.52 }]);
    const s3 = strokesOf(id)[before + 2];
    await click('.wz-ink-eraser');
    const armed = q('.wz-ink-eraser') && q('.wz-ink-eraser').getAttribute('aria-pressed');
    await draw([{ x: 0.3, y: 0.46 }, { x: 0.3, y: 0.56 }]);
    const s4 = strokesOf(id)[before + 3];
    await click('.wz-ink-eraser');
    ok('F13: the face\'s ink and eraser work: an oxblood stroke, then an erasing stroke', !!s3 && s3.ink === 'oxblood' && armed === 'true' && !!s4 && s4.eraser === true, { s3: s3 && s3.ink, armed, s4: s4 && s4.eraser });

    // as she left it, for this sitting
    await openRow('colour');
    await instrument('text');
    const gone = !q('.wz-ink-tab');
    await instrument('ink');
    ok('F14: Studio stays as she left it while she is here (TEXT and back to INK), and the tab is not in TEXT at all', gone && studioOpen() && rowOpen() === 'colour', { gone, open: studioOpen(), row: rowOpen() });

    const door = q('.wz-ink-studio');
    const rowBtns = all('.wz-ink-studio-body [data-ink-row]');
    ok('F15: a keyboard reaches the door and the rows: real buttons, in the tab order', !!door && door.tagName === 'BUTTON' && door.tabIndex >= 0 && rowBtns.length > 0 && rowBtns.every((b) => b.tagName === 'BUTTON' && b.tabIndex >= 0), { rows: rowBtns.length });
    await setStudio(false);
    return out;
  };

  /** VISUAL check 3: never taller than the sheet, closed and with every row open in turn, and the face never scrolls away. */
  const height = async () => {
    const reads = [];
    await setStudio(false); reads.push(await fit('closed'));
    await setStudio(true); reads.push(await fit('studio'));
    await openRow('brushes'); reads.push(await fit('brushes'));
    await openRow('colour'); reads.push(await fit('colour'));
    await setStudio(false);
    // two lines means two lines: with the longest brush word in her hand, the brush and the size share line one, the inks and the eraser share line two, and nothing is clipped
    await click('.wz-ink-brush'); await click('.wz-ink-recent [data-recent-tip="marker"]');
    const brush = rect('.wz-ink-brush'), size = rect('.wz-ink-size'), sw = rect('.wz-ink-swatch'), er = rect('.wz-ink-eraser'), panel = rect('.wz-sliver-panel');
    const share = (a, b) => !!a && !!b && a.top < b.bottom && b.top < a.bottom;
    const apart = (a, b) => !!a && !!b && a.right <= b.left + 0.5;
    const inside = (a) => !!a && !!panel && a.left >= panel.left && a.right <= panel.right;
    return [
      { name: `H1 (${window.innerWidth}x${window.innerHeight}): the tab is never taller than its sheet and the face never scrolls away, closed, open, and with each row open`, pass: reads.every(fits), detail: J(reads) },
      { name: `H2 (${window.innerWidth}x${window.innerHeight}): the face is two lines and no more - brush and size side by side, inks and eraser side by side, nothing overlapping, nothing past the drawer`,
        pass: share(brush, size) && apart(brush, size) && share(sw, er) && inside(brush) && inside(size) && inside(sw) && inside(er) && all('.wz-ink-swatch').every((e) => share(sw, e.getBoundingClientRect())),
        detail: J({ brush, size, sw, er, panel }) },
    ];
  };

  const LOADS = { painter: /\/InkStratum[.\-]/, tab: /\/InkTab[.\-]/, capture: /\/inkCapture[.\-]/ };
  /** What has been fetched of the ink code on this page load (script requests, counted by name). */
  const loads = () => {
    const names = performance.getEntriesByType('resource').map((e) => e.name.split('?')[0]).filter((n) => /\.(js|ts|tsx|mjs)$/.test(n));
    const out = {};
    for (const [k, re] of Object.entries(LOADS)) out[k] = names.filter((n) => re.test(n)).length;
    return out;
  };

  window.__vi = { sleep, q, all, click, text, rect, strokesOf, flush, draw, openDrawer, instrument, freePage, setStudio, openRow, rowOpen, rows, fit, fits, shape, height, loads };
})();
