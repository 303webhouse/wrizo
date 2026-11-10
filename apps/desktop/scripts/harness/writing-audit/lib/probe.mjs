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
  const ed = () => document.querySelector('.forward-only-editor');
  const rowsOf = (e) => [...e.children].filter((c) => c.nodeType === 1 && c.tagName !== 'BR' && !(c.classList && c.classList.contains('md-eof-guard')));
  const textNodes = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const out = []; let n; while ((n = w.nextNode())) out.push(n); return out; };
  const plainOf = (e) => strip(e.textContent || '');
  const offsetOf = (e, node, off) => { const r = document.createRange(); r.setStart(e, 0); try { r.setEnd(node, off); } catch (x) { return null; } return strip(r.toString()).length; };
  const rawIndexAt = (t, k) => { let c = 0; for (let i = 0; i < t.data.length; i++) { if (c === k && t.data[i] !== ZW) return i; if (t.data[i] !== ZW) c++; } return t.data.length; };
  const box = (r) => (r ? { x: r.left, top: r.top, height: r.height, right: r.right, bottom: r.bottom } : null);
  const rr = (r) => (r ? { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) } : null);
  const padLeft = (el) => parseFloat(getComputedStyle(el).paddingLeft) || 0;
  const lineH = (el, r) => Math.min(r.height || 18, parseFloat(getComputedStyle(el).lineHeight) || r.height || 18);

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
    const pt = pointAt(e, p); if (!pt) return { via: 'rows-drift' };
    if (pt.len === 0) { const r = pt.row.getBoundingClientRect(); return { via: 'row', x: r.left + padLeft(pt.row), top: r.top, height: lineH(pt.row, r) }; }
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
    const page = document.querySelector('.mode-page'), scroller = document.querySelector('.mode-scroll');
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
    const fc = document.querySelector('.flux-block-caret');
    out.fluxCaret = fc ? (() => { const r = fc.getBoundingClientRect(); return { x: r.left, top: r.top, height: r.height, width: r.width }; })() : null;
    out.page = page ? rr(page.getBoundingClientRect()) : null;
    out.editorRect = rr(e.getBoundingClientRect());
    out.scroll = { top: scroller ? scroller.scrollTop : null, win: window.scrollY, scrollerH: scroller ? scroller.scrollHeight : null, clientH: scroller ? scroller.clientHeight : null };
    out.rows = rowsOf(e).length;
    // where the selection sits in the DOM (a text node's first characters and offset, or the element and offset): the evidence for a caret that is in the right place by number and the wrong place on screen
    if (inEd) { const n = sel.focusNode; let row = n.nodeType === 1 ? n : n.parentElement; while (row && row.parentElement !== e && row !== e) row = row.parentElement; const rows = rowsOf(e); out.selPoint = (n.nodeType === 3 ? 'text ' + JSON.stringify(n.data.slice(0, 14)) : n.nodeName + (n.className ? '.' + String(n.className).split(' ')[0] : '')) + ' @' + sel.focusOffset + (row && row !== e ? ' in row ' + rows.indexOf(row) : ' (between rows)'); }
    return out;
  };

  // stage a starting selection (the only writer here): focus the editor, then set the two ends through the row-owned points
  const place = (a, f) => {
    const e = ed(); if (!e) return false;
    e.focus({ preventScroll: true });
    const pa = pointAt(e, a), pf = f === undefined || f === a ? pa : pointAt(e, f);
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
    st.textContent = 'html html .forward-only-editor, html html .forward-only-editor * { caret-color: #ff00ff !important; }';
    document.head.appendChild(st); return true;
  };
  const scan = async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const cv = new OffscreenCanvas(bmp.width, bmp.height), g = cv.getContext('2d'); g.drawImage(bmp, 0, 0);
    const { data, width, height } = g.getImageData(0, 0, bmp.width, bmp.height);
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, n = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const i = (y * width + x) * 4; if (data[i] >= 190 && data[i + 2] >= 190 && data[i + 1] <= 110) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    return n ? { x: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1, n } : null;
  };
  const dom = (n = 600) => { const e = ed(); return e ? e.innerHTML.slice(0, n) : null; };
  window.__wa = { read, boxAt, place, dom, arm, scan };
}
