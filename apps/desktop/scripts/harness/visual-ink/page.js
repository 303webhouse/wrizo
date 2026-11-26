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
    // PARKED - SUPERSEDED by VISUAL 1a.2 (any size): the face's size is a number, no longer the nib's word. The original, verbatim:
    // ok('F1: the face is two lines - line one the brush in her hand (a button, with its arrow) and the size between a minus and a plus; line two the four inks and the eraser',
    //   lines.length === 2 && l1 && text(l1.querySelector('.wz-ink-brush .wz-ink-brush-word')) === 'Pen' && text(l1.querySelector('.wz-ink-brush .wz-ink-arrow')) === '▾'
    //     && !!l1.querySelector('.wz-ink-size-down') && !!l1.querySelector('.wz-ink-size-up') && text(l1.querySelector('.wz-ink-size-value')) === 'Regular'
    //     && l2 && l2.querySelectorAll('.wz-sliver-inks .wz-ink-swatch').length === 4 && l2.querySelectorAll('.wz-ink-eraser').length === 1,
    //   { lines: lines.length, l1: text(l1), swatches: all('.wz-sliver-inks .wz-ink-swatch').length });
    ok('F1 successor [1a.2]: the face is two lines - line one the brush in her hand (a button, with its arrow) and the size, a number, between a minus and a plus; line two the four inks, her last colour and the eraser',
      lines.length === 2 && l1 && text(l1.querySelector('.wz-ink-brush .wz-ink-brush-word')) === 'Pen' && text(l1.querySelector('.wz-ink-brush .wz-ink-arrow')) === '▾'
        && !!l1.querySelector('.wz-ink-size-down') && !!l1.querySelector('.wz-ink-size-up') && text(l1.querySelector('.wz-ink-size-value')) === '1.4 pt'
        && l2 && l2.querySelectorAll('.wz-sliver-inks .wz-ink-swatch').length === 4 && l2.querySelectorAll('.wz-ink-last').length === 1 && l2.querySelectorAll('.wz-ink-eraser').length === 1,
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

    // PARKED - SUPERSEDED by VISUAL 1a.2 (any size): minus and plus step a number, not the three nib words. The original, verbatim:
    // await click('.wz-ink-size-up');
    // const upWord = text(q('.wz-ink-size-value'));
    // const upOff = q('.wz-ink-size-up') && q('.wz-ink-size-up').disabled;
    // await draw([{ x: 0.2, y: 0.42 }, { x: 0.5, y: 0.44 }]);
    // const s2 = strokesOf(id)[before + 1];
    // await click('.wz-ink-size-down'); await click('.wz-ink-size-down');
    // const downWord = text(q('.wz-ink-size-value'));
    // const downOff = q('.wz-ink-size-down') && q('.wz-ink-size-down').disabled;
    // await click('.wz-ink-size-up');
    // ok('F12: the size steps with minus and plus (Fine, Regular, Broad), stops at each end, and the stroke takes it',
    //   upWord === 'Broad' && upOff === true && downWord === 'Fine' && downOff === true && !!s2 && s2.nib === 'broad' && s2.tip === 'marker', { upWord, downWord, stroke: s2 && { tip: s2.tip, nib: s2.nib } });
    const sizeText = () => text(q('.wz-ink-size-value'));
    const seen = [sizeText()];
    await click('.wz-ink-size-up'); seen.push(sizeText());
    await draw([{ x: 0.2, y: 0.42 }, { x: 0.5, y: 0.44 }]);
    const s2 = strokesOf(id)[before + 1];
    await click('.wz-ink-size-down'); seen.push(sizeText());
    await click('.wz-ink-size-down'); seen.push(sizeText());
    await click('.wz-ink-size-up'); seen.push(sizeText());
    ok('F12 successor [1a.2]: minus and plus step the size, shown as a number, and the stroke takes it (any size, with the nearest nib kept beside it)',
      J(seen) === J(['5.4 pt', '7 pt', '5.4 pt', '4 pt', '5.4 pt']) && !!s2 && s2.size === 7 && s2.nib === 'regular' && s2.tip === 'marker', { seen, stroke: s2 && { tip: s2.tip, nib: s2.nib, size: s2.size } });

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
    // a theme change (Flux's splash) can leave the page mid-change: measure once its height holds still
    for (let i = 0, was = -1; i < 40; i++) { const r = rect('.mode-page'); const now = r ? r.height : 0; if (now > 0 && now === was) break; was = now; await sleep(400); }
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

  // React's own inputs: the native setter, then the event it listens for
  const setValue = async (s, v) => {
    const el = q(s);
    if (!el) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(200);
    return true;
  };
  const brush = async (tip) => { await click('.wz-ink-brush'); await click(`.wz-ink-recent [data-recent-tip="${tip}"]`); };
  const last = (id) => { const s = strokesOf(id); return s[s.length - 1] || {}; };
  const pick = (s, k) => { const o = {}; for (const key of k) if (s[key] !== undefined) o[key] = s[key]; return o; };
  const line = (y) => [{ x: 0.2, y }, { x: 0.6, y }];

  /** 1a.2: any size, any colour, see-through. Expects a fresh Free Write page with the drawer open on INK. */
  const richer = async (id) => {
    const out = [];
    const ok = (name, pass, detail) => out.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : J(detail) });
    const FIELDS = ['tip', 'nib', 'ink', 'hex', 'size', 'alpha'];

    await draw(line(0.1));
    ok('R0: with nothing changed, a stroke is stored exactly as before this slice (tip, nib, ink - no new field)', J(pick(last(id), FIELDS)) === J({ tip: 'pen', nib: 'regular', ink: 'walnut' }), pick(last(id), FIELDS));

    await openRow('brushes');
    const sizeSlide = q('.wz-ink-size-slide'), clearSlide = q('.wz-ink-clear-slide');
    ok('R1: the Brushes row has Size and See-through sliders, real range inputs a keyboard reaches', !!sizeSlide && !!clearSlide && sizeSlide.type === 'range' && clearSlide.type === 'range' && sizeSlide.tabIndex >= 0 && clearSlide.tabIndex >= 0, text(q('.wz-ink-row-body')));
    await setValue('.wz-ink-size-slide', 17);
    const faceSize = text(q('.wz-ink-size-value'));
    await draw(line(0.18));
    ok('R2: any size - the slider sets 17, the face says so, and the stroke carries size 17 with the nearest nib', faceSize === '17 pt' && J(pick(last(id), FIELDS)) === J({ tip: 'pen', nib: 'broad', ink: 'walnut', size: 17 }), { faceSize, s: pick(last(id), FIELDS) });
    await setValue('.wz-ink-clear-slide', 60);
    await draw(line(0.26));
    ok('R3: see-through - at 60% the stroke carries alpha 0.4', last(id).alpha === 0.4 && last(id).size === 17, pick(last(id), FIELDS));

    await openRow('colour');
    await click('.wz-ink-row-body [data-colour-custom]');
    await setValue('.wz-ink-row-body [data-colour-hex]', 'red');
    const refused = q('.wz-ink-row-body [data-colour-use]') && q('.wz-ink-row-body [data-colour-use]').disabled;
    // the field opens holding '#': a code typed or pasted with its own '#', or with none, is the same colour
    const forgiven = [];
    for (const typed of ['##2f7d4f', '2f7d4f']) { await setValue('.wz-ink-row-body [data-colour-hex]', typed); forgiven.push(q('.wz-ink-row-body [data-colour-hex]').value); }
    ok('R4b: a code with a doubled or a missing # is read as the colour she meant', J(forgiven) === J(['#2f7d4f', '#2f7d4f']), forgiven);
    await setValue('.wz-ink-row-body [data-colour-hex]', '#2f7d4f');
    await click('.wz-ink-row-body [data-colour-use]');
    await draw(line(0.34));
    ok('R4: any colour - + Custom, a hex, Use: the stroke carries #2F7D4F and no named ink; a word that is not a colour cannot be used', refused === true && J(pick(last(id), FIELDS)) === J({ tip: 'pen', nib: 'broad', hex: '#2F7D4F', size: 17, alpha: 0.4 }), { refused, s: pick(last(id), FIELDS) });

    const dot = () => q('.wz-ink-last');
    const ringed = () => !!dot() && dot().classList.contains('active');
    const a = { last: dot() && dot().getAttribute('data-last'), ringed: ringed(), swatchRinged: all('.wz-ink-swatch.active').length };
    await click('.wz-sliver-inks .wz-ink-swatch[aria-label="Walnut"]');
    await draw(line(0.42));
    const b = { s: pick(last(id), FIELDS), ringed: ringed() };
    await click('.wz-ink-last');
    await draw(line(0.5));
    ok('R5: her last colour sits on the face: ringed while in use, still there after a desk ink, and one press brings it back', a.last === '#2F7D4F' && a.ringed && a.swatchRinged === 0 && b.s.ink === 'walnut' && b.s.hex === undefined && !b.ringed && last(id).hex === '#2F7D4F' && ringed(), { a, b, now: pick(last(id), FIELDS) });

    await setStudio(false);
    await brush('pencil');
    const fresh = text(q('.wz-ink-size-value'));
    await openRow('brushes');
    const freshClear = q('.wz-ink-clear-slide') && q('.wz-ink-clear-slide').value;
    await setValue('.wz-ink-size-slide', 6);
    await brush('pen');
    const penBack = [text(q('.wz-ink-size-value')), q('.wz-ink-clear-slide') && q('.wz-ink-clear-slide').value];
    await brush('pencil');
    const pencilBack = [text(q('.wz-ink-size-value')), q('.wz-ink-clear-slide') && q('.wz-ink-clear-slide').value];
    ok('R6: each brush keeps its own size and see-through while she is here', fresh === '1.15 pt' && freshClear === '0' && J(penBack) === J(['17 pt', '60']) && J(pencilBack) === J(['6 pt', '0']), { fresh, freshClear, penBack, pencilBack });
    await brush('pen');
    await setStudio(false);
    return out;
  };

  /** The painted colour at the middle of stored stroke `n` (a straight two-point line), from the committed canvas. */
  const pixel = (id, n) => {
    const st = strokesOf(id)[n], sheet = q('.wz-ink-sheet'), c = q('.ink-committed');
    if (!st || !sheet || !c) return null;
    const r = sheet.getBoundingClientRect(), k = sheet.offsetWidth ? r.width / sheet.offsetWidth : 1;
    const oy = (parseFloat(getComputedStyle(sheet).paddingTop) || 0) * k, dpr = window.devicePixelRatio || 1;
    const mx = (st.points[0].x + st.points[st.points.length - 1].x) / 2, my = (st.points[0].y + st.points[st.points.length - 1].y) / 2;
    // a few pixels ACROSS the line, the most covered one: a thin line that falls between two pixel rows reads half-covered on either
    const col = c.getContext('2d').getImageData(Math.round(mx * r.width * dpr), Math.round((oy + my * r.width) * dpr) - 3, 1, 7).data;
    let best = 0;
    for (let i = 4; i < col.length; i += 4) if (col[i + 3] > col[best + 3]) best = i;
    return [...col.slice(best, best + 4)];
  };
  const near = (a, b, by = 6) => !!a && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= by);
  const rgb = (css) => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.fillStyle = css; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data]; };
  const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /** After a reload: the new fields read back and paint. `n` is the see-through custom stroke's place in the list (R4). */
  const readBack = (id, n) => {
    const s = strokesOf(id)[n] || {};
    const px = pixel(id, n);
    return [{ name: 'R7: after a reload the stroke reads back with its size, colour and see-through, and paints in that colour, see-through', pass: s.hex === '#2F7D4F' && s.size === 17 && s.alpha === 0.4 && near(px, [47, 125, 79, 102]), detail: J({ s: pick(s, ['hex', 'size', 'alpha']), px }) }];
  };

  /** An old stroke (none of the new fields) and a stroke with junk in them both paint as before: solid, the desk's default ink. Seeded through the app's own seam, then reload, then call. */
  const OLD_AND_JUNK = [
    { points: [{ x: 0.2, y: 0.1 }, { x: 0.6, y: 0.1 }] },
    { points: [{ x: 0.2, y: 0.2 }, { x: 0.6, y: 0.2 }], size: 'huge', hex: 'red', alpha: 9 },
  ];
  const seedOld = async (id) => { window.wrizoPatchEntry(id, { strokes: OLD_AND_JUNK }); await sleep(100); };
  const oldPaints = (id) => {
    const want = rgb(token('--ink-stroke') || token('--ink-on-paper') || '#1A1206');
    const px = [pixel(id, 0), pixel(id, 1)];
    return [{ name: 'R8: an old stroke still paints as before, and unknown values in the new fields paint as the default (solid, the desk ink)', pass: px.every((p) => !!p && p[3] > 200 && near(p.slice(0, 3), want.slice(0, 3), 24)), detail: J({ px, want, stored: strokesOf(id).length }) }];
  };

  const LOADS = { painter: /\/InkStratum[.\-]/, tab: /\/InkTab[.\-]/, capture: /\/inkCapture[.\-]/ };
  /** What has been fetched of the ink code on this page load (script requests, counted by name). */
  const loads = () => {
    const names = performance.getEntriesByType('resource').map((e) => e.name.split('?')[0]).filter((n) => /\.(js|ts|tsx|mjs)$/.test(n));
    const out = {};
    for (const [k, re] of Object.entries(LOADS)) out[k] = names.filter((n) => re.test(n)).length;
    return out;
  };

  window.__vi = { richer, pixel, readBack, seedOld, oldPaints, setValue, brush, sleep, q, all, click, text, rect, strokesOf, flush, draw, openDrawer, instrument, freePage, setStudio, openRow, rowOpen, rows, fit, fits, shape, height, loads };
})();
