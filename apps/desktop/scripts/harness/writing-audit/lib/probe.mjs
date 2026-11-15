// THE PAGE-SIDE READER (writing audit, session 1; brief §6.2 and §6.3). Installed into the page as window.__wa; it only READS (it never inserts a probe node, never moves the selection, never scrolls), except place(),
// which the audit calls to stage a starting caret before a step.
//
// WHERE THE CARET IS IN THE TEXT (§6.2). Not by the app's own helpers (store/caretOffset.ts is code under test): a Range from the editor's start to the selection's point, measured with Range.toString(),
// with the editor's zero-width end-of-file guard (U+200B) taken out - the same plain text the app means, counted by the browser's own range arithmetic.
//
// WHERE IT IS DRAWN (§6.3), in two pieces:
//   - `caret`: the rectangle the BROWSER gives the collapsed selection (the place its own native caret is painted); at an empty row, where a range has no rectangle, the row's start.
//   - `fluxCaret`: Flux paints its OWN block caret (.flux-block-caret, a fixed-position element placed from that same rectangle by FluxBlockCaret.tsx); its box is read as drawn.
// And `boxAt(p)` answers where the model says offset p SHOULD be drawn: the character's own rectangle (its left edge, or the previous character's right edge at a line's end, or an empty row's start), found by
// walking the row's text nodes - not from the selection. verify.mjs compares the three.
// Written as a function so `node --check` covers it and the harness injects `(${probeInstall})()`.
export function probeInstall() {
  if (window.__wa) return;
  const ZW = '\u200b';
  const strip = (s) => s.split(ZW).join('');
  const ed = () => document.querySelector(window.__wa_sel || '.forward-only-editor');
  const rowsOf = (e) => [...e.children].filter((c) => c.nodeType === 1 && c.tagName !== 'BR' && !(c.classList && c.classList.contains('md-eof-guard')));
  const textNodes = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const out = []; let n; while ((n = w.nextNode())) out.push(n); return out; };
  const plainOf = (e) => strip(e.textContent || '');
  const offsetOf = (e, node, off) => { const r = document.createRange(); r.setStart(e, 0); try { r.setEnd(node, off); } catch (x) { return null; } return strip(r.toString()).length; };
  const rawIndexAt = (t, k) => { let c = 0; for (let i = 0; i < t.data.length; i++) { if (c === k && t.data[i] !== ZW) return i; if (t.data[i] !== ZW) c++; } return t.data.length; };
  const box = (r) => (r ? { x: r.left, top: r.top, height: r.height, right: r.right, bottom: r.bottom } : null);
  const rr = (r) => (r ? { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) } : null);
  const padLeft = (el) => parseFloat(getComputedStyle(el).paddingLeft) || 0;
  const lineH = (el, r) => Math.min(r.height || 18, parseFloat(getComputedStyle(el).lineHeight) || r.height || 18);

  // GENERIC geometry, for an editor that is not the Draft page's row editor (Free Write, the card pop-up): plain offsets over the text nodes, characters measured by Range rectangles
  const gpoint = (e, p) => {
    let rem = p, last = null;
    for (const t of textNodes(e)) { const L = strip(t.data).length; if (L === 0) continue; last = t; if (rem <= L) return { node: t, off: rawIndexAt(t, rem) }; rem -= L; }
    return last ? { node: last, off: last.data.length } : { node: e, off: 0 };
  };
  const gchar = (e, i) => { const a = gpoint(e, i), b = gpoint(e, i + 1); const rg = document.createRange(); rg.setStart(a.node, a.off); rg.setEnd(b.node, b.off); const r = [...rg.getClientRects()].find((q) => q.height > 0) || rg.getBoundingClientRect(); return r; };
  // the CSS line height is the UNSCALED one: the Typewriter zooms the page (a transform), and rectangles are drawn scaled, so the measured pitch is the CSS value times the page's scale (#70: 27.2 px CSS, 43.5 px drawn, in Arbor and Machina)
  const scaleOf = (e) => { const w = e.offsetWidth; const r = e.getBoundingClientRect(); return w > 0 && r.width > 0 ? r.width / w : 1; };
  const lhOf = (e) => { const v = parseFloat(getComputedStyle(e).lineHeight); return (Number.isFinite(v) && v > 0 ? v : (parseFloat(getComputedStyle(e).fontSize) || 16) * 1.5) * scaleOf(e); };
  const gbox = (e, p) => {
    const text = plainOf(e), n = text.length, lines = text.split('\n');
    let line = 0, acc = 0;
    while (line < lines.length - 1 && p > acc + lines[line].length) { acc += lines[line].length + 1; line++; }
    const col = p - acc, len = lines[line].length, er = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (n === 0) return { via: 'g-empty', x: er.left + (parseFloat(cs.paddingLeft) || 0), top: er.top + (parseFloat(cs.paddingTop) || 0), height: lhOf(e), noY: false };
    if (len > 0 && col < len) { const r = gchar(e, p); return { via: 'g-char', x: r.left, top: r.top, height: r.height }; }
    if (len > 0) { const r = gchar(e, p - 1); return { via: 'g-prevchar', x: r.right, top: r.top, height: r.height }; }
    if (p < n) { const r = gchar(e, p); return { via: 'g-newline', x: r.left, top: r.top, height: r.height || lhOf(e) }; }
    const r = gchar(e, n - 1);               // an empty last line after a trailing newline: one line below the newline's own line, at that line's left edge
    let prevStart = n - 1; while (prevStart > 0 && text[prevStart - 1] !== '\n') prevStart--;
    const lead = gchar(e, prevStart);
    const lh = (lines.length >= 3 && lines[lines.length - 3] !== undefined) ? (() => { try { const a = gchar(e, Math.max(0, prevStart - 1 - (lines[lines.length - 3] || '').length)); return Math.abs(r.top - a.top) || lhOf(e); } catch (x) { return lhOf(e); } })() : lhOf(e);
    return { via: 'g-lastempty', x: lead.left, top: r.top + lh, height: r.height || lh };
  };

  // the DOM point for plain offset p, INSIDE the row that owns it (a line start is the row's first text node, not the newline between rows)
  const pointAt = (e, p) => {
    const text = plainOf(e), lines = text.split('\n');
    let line = 0, acc = 0;
    while (line < lines.length - 1 && p > acc + lines[line].length) { acc += lines[line].length + 1; line++; }
    const col = p - acc, rows = rowsOf(e);
    if (rows.length !== lines.length) return null;
    const row = rows[line], tns = textNodes(row);
    if (col === 0) { const t = tns.find((n) => strip(n.data).length > 0); return t ? { node: t, off: rawIndexAt(t, 0), row, line, col, len: lines[line].length } : { node: row, off: 0, row, line, col, len: 0 }; }
    let rem = col;
    for (const t of tns) { const L = strip(t.data).length; if (L > 0 && rem <= L) return { node: t, off: rawIndexAt(t, rem), row, line, col, len: lines[line].length }; rem -= L; }
    return { node: row, off: row.childNodes.length, row, line, col, len: lines[line].length };
  };

  // where the model says offset p should be drawn
  const boxAt = (p) => {
    const e = ed(); if (!e) return null;
    if (window.__wa_generic) return gbox(e, p);
    const pt = pointAt(e, p); if (!pt) return { via: 'rows-drift' };
    if (pt.len === 0) { const r = pt.row.getBoundingClientRect(); return { via: 'row', x: r.left + padLeft(pt.row), top: r.top, height: lineH(pt.row, r), noY: r.height < 4 }; }
    const rg = document.createRange();
    if (pt.col < pt.len) {
      const nx = pointAt(e, p + 1); if (!nx) return { via: 'rows-drift' };
      rg.setStart(pt.node, pt.off); rg.setEnd(nx.node, nx.off);
      const r = [...rg.getClientRects()].find((q) => q.height > 0) || rg.getBoundingClientRect();
      return { via: 'char', x: r.left, top: r.top, height: r.height };
    }
    const pv = pointAt(e, p - 1); if (!pv) return { via: 'rows-drift' };
    rg.setStart(pv.node, pv.off); rg.setEnd(pt.node, pt.off);
    const rects = [...rg.getClientRects()].filter((q) => q.height > 0), r = rects[rects.length - 1] || rg.getBoundingClientRect();
    return { via: 'prevchar', x: r.right, top: r.top, height: r.height };
  };

  // the rectangle the browser gives a collapsed selection; an empty row (no range rectangle) falls back to the row's start
  const caretRect = (e, sel) => {
    if (!sel.rangeCount || !sel.isCollapsed || !e.contains(sel.anchorNode)) return null;
    const rects = [...sel.getRangeAt(0).getClientRects()].filter((q) => q.height > 0);
    if (rects.length) return { via: 'range', x: rects[0].left, top: rects[0].top, height: rects[0].height };
    let el = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
    if (el === e) { const kids = rowsOf(e); el = kids[Math.min(kids.length - 1, Math.max(0, sel.anchorOffset))] || e; }
    while (el && el.parentElement !== e && el !== e) el = el.parentElement;
    if (!el || el === e) return { via: 'none' };
    const r = el.getBoundingClientRect();
    return { via: 'row', x: r.left + padLeft(el), top: r.top, height: lineH(el, r) };
  };

  const read = () => {
    const e = ed(), sel = getSelection(), root = document.documentElement;
    const page = document.querySelector('.mode-page') || document.querySelector('.board-popup'), scroller = document.querySelector('.mode-scroll');
    const out = { editor: !!e, theme: root.getAttribute('data-theme'), tone: root.getAttribute('data-page'), view: { w: innerWidth, h: innerHeight }, platform: navigator.userAgent.indexOf('Windows') >= 0 ? 'win' : 'linux' };
    if (!e) return out;
    out.text = plainOf(e);
    out.rawHasNbsp = (e.textContent || '').indexOf(' ') >= 0;
    const inEd = sel.rangeCount && e.contains(sel.anchorNode) && e.contains(sel.focusNode);
    out.anchor = inEd ? offsetOf(e, sel.anchorNode, sel.anchorOffset) : null;
    out.focus = inEd ? offsetOf(e, sel.focusNode, sel.focusOffset) : null;
    out.collapsed = !!sel.isCollapsed;
    out.selNode = sel.rangeCount && !inEd ? ((sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement) || {}).className || (sel.anchorNode && sel.anchorNode.nodeName) || 'none') : null;
    const ae = document.activeElement;
    out.focused = !!ae && (ae === e || e.contains(ae));
    out.active = ae ? (ae.tagName + (ae.className && typeof ae.className === 'string' ? '.' + ae.className.split(' ')[0] : '')) : null;
    out.caret = caretRect(e, sel);
    { const an = sel.anchorNode; const el = an && (an.nodeType === 1 ? an : an.parentElement); out.caretColor = el ? getComputedStyle(el).caretColor : null; out.armed = !!document.getElementById('wa-caret-color'); }
    const fc = document.querySelector('.flux-block-caret');
    out.fluxCaret = fc ? (() => { const r = fc.getBoundingClientRect(); return { x: r.left, top: r.top, height: r.height, width: r.width }; })() : null;
    out.page = page ? rr(page.getBoundingClientRect()) : null;
    out.sheet = scroller ? rr(scroller.getBoundingClientRect()) : null;   // the visible sheet the page text scrolls in
    out.editorRect = rr(e.getBoundingClientRect());
    out.scroll = { top: scroller ? scroller.scrollTop : null, win: window.scrollY, scrollerH: scroller ? scroller.scrollHeight : null, clientH: scroller ? scroller.clientHeight : null };
    out.rows = rowsOf(e).length;
    out.tw = scroller ? scroller.getAttribute('data-typewriter') : null;
    // where the selection sits in the DOM (a text node's first characters and offset, or the element and offset): the evidence for a caret that is in the right place by number and the wrong place on screen
    if (inEd) { const n = sel.focusNode; let row = n.nodeType === 1 ? n : n.parentElement; while (row && row.parentElement !== e && row !== e) row = row.parentElement; const rows = rowsOf(e); out.selPoint = (n.nodeType === 3 ? 'text ' + JSON.stringify(n.data.slice(0, 14)) : n.nodeName + (n.className ? '.' + String(n.className).split(' ')[0] : '')) + ' @' + sel.focusOffset + (row && row !== e ? ' in row ' + rows.indexOf(row) : ' (between rows)'); }
    return out;
  };

  // stage a starting selection (the only writer here): focus the editor, then set the two ends through the row-owned points
  const place = (a, f) => {
    const e = ed(); if (!e) return false;
    e.focus({ preventScroll: true });
    let pa = window.__wa_generic ? null : pointAt(e, a), pf = f === undefined || f === a ? pa : (window.__wa_generic ? null : pointAt(e, f));
    if (window.__wa_generic) { pa = gpoint(e, a); pf = f === undefined || f === a ? pa : gpoint(e, f); }
    if (!pa || !pf) return false;
    getSelection().setBaseAndExtent(pa.node, pa.off, pf.node, pf.off);
    return true;
  };
  // THE NATIVE CARET, SEEN. The rectangle the browser gives a collapsed range is NOT where it paints the caret (run 42918219726: after Enter at the end of a middle paragraph the range said the start of the row above while the
  // caret was painted at the page's right margin). So the native caret is found in a screenshot: every editor character's caret-color is forced to magenta (a style sheet in <head>, the editor's DOM untouched) and the
  // magenta pixels' bounding box is the caret. `scan` decodes the PNG in the page (a Blob and createImageBitmap, no fetch) and returns that box in CSS pixels (the viewport is emulated at dpr 1).
  const arm = () => {
    if (document.getElementById('wa-caret-color')) return true;
    const st = document.createElement('style'); st.id = 'wa-caret-color';
    st.textContent = 'html html .forward-only-editor, html html .forward-only-editor *, html html .board-popup-editor, html html .board-popup-editor *, html html input, html html textarea { caret-color: #ff00ff !important; }';
    document.head.appendChild(st); return true;
  };
  const decode = async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const cv = new OffscreenCanvas(bmp.width, bmp.height), g = cv.getContext('2d'); g.drawImage(bmp, 0, 0);
    return g.getImageData(0, 0, bmp.width, bmp.height);
  };
  const box2 = (x0, x1, y0, y1, n) => (n ? { x: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1, n } : null);
  // magenta (or magenta blended into the paper): red and blue both well above green
  const scan = async (b64) => {
    const { data, width, height } = await decode(b64);
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, n = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const i = (y * width + x) * 4; if (data[i] - data[i + 1] >= 70 && data[i + 2] - data[i + 1] >= 70) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    return box2(x0, x1, y0, y1, n);
  };
  // the caret by DIFFERENCE: the same frame with and without the selection; what changed is the caret (the fallback when the caret's colour cannot be forced)
  const diff = async (a64, b64) => {
    const A = await decode(a64), B = await decode(b64);
    if (A.width !== B.width || A.height !== B.height) return null;
    // only inside the editor: the page around it moves on its own (Machina's progress tick steps after an Enter, #70), and a tick is not a caret
    const E = ed(), ER = E ? E.getBoundingClientRect() : null;
    const gx0 = ER ? Math.max(0, Math.floor(ER.left) - 4) : 0, gx1 = ER ? Math.min(A.width - 1, Math.ceil(ER.right) + 4) : A.width - 1, gy0 = ER ? Math.max(0, Math.floor(ER.top) - 4) : 0, gy1 = ER ? Math.min(A.height - 1, Math.ceil(ER.bottom) + 4) : A.height - 1;
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, n = 0;
    for (let y = gy0; y <= gy1; y++) for (let x = gx0; x <= gx1; x++) { const i = (y * A.width + x) * 4; if (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]) > 90) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    return box2(x0, x1, y0, y1, n);
  };
  const clear = () => { getSelection().removeAllRanges(); return true; };
  // the layout-aware oracle's input (lib/geom.mjs): one entry per plain offset, where the model says that position is drawn
  const stops = () => {
    const e = ed(); if (!e) return null;
    const n = plainOf(e).length, out = [];
    for (let p = 0; p <= n; p++) { const b = boxAt(p); out.push(b && b.x !== undefined ? { p, x: b.x, top: b.top, height: b.height, via: b.via } : { p, via: (b && b.via) || 'none' }); }
    return out;
  };
  const dom = (n = 600) => { const e = ed(); return e ? e.innerHTML.slice(0, n) : null; };
  const surface = (sel, generic) => { window.__wa_sel = sel; window.__wa_generic = !!generic; return true; };
  window.__wa = { surface, read, boxAt, place, dom, arm, scan, diff, clear, stops };
}
