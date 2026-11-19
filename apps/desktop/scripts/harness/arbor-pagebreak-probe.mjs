// PAGE BREAKS FOR PROSE - THE MEASUREMENT (Fable, Nov 19, 1:35 pm: "a proposal only (no product code) ... Measure, don't build"). A PROBE: nothing
// here changes the product; every piece of the candidate (the measurer, the break walk, the marks, the per-key work) is injected into the page by
// this file. Readings only, never a gate: it prints PB lines and one verdict line (PB-PROBE: DONE | INCOMPLETE).
//   THE CANDIDATE. A page is a letter page at the page's own dress: the text laid out in a hidden MEASURER of fixed geometry (the framed letter
//   page's text column at scale 1, its font, size and line height - read once from the framed page at 1366), one block per logical line,
//   never from the window. A break is the first line whose bottom passes the page's text height (11in less the .85in top and bottom margins,
//   at 620/8.5 px a page-inch). Breaks are clean-text offsets; a mark is drawn at the live position of that offset.
//   AGREEMENT (Fable's 1 and 3): the measurer's breaks against the LIVE page's own laid-out lines (a walk over the live editor's character
//   rects, scale-corrected), at 1366, at 1920, in Typewriter zoom, and under the 1100 px gate (1000).
//   COST (Fable's 2): at 5k / 20k / 50k words, Draft and Free Write, the key-to-frame of real CDP keys with no page-break work (base), with the
//   per-key work in the key's own frame (sync), and with the work held for a 400 ms pause (idle); the open cost of the measurer and of a walk.
//   DRAW NEAR THE SCREEN (Fable's 5): Draft at 20k and 50k with content-visibility:auto on the rows (injected) against without: key-to-frame,
//   a whole-page relayout, innerText against textContent, window.find of a word on the first line, and the accessibility tree's copy of it.
// Run: on Actions (harness.yml, files=arbor-pagebreak-probe.mjs). A probe branch only; never merged.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`PB ${name} ${JSON.stringify(data)}`);
const ED = '.mode-scroll .forward-only-editor';
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
// the seed: paragraphs of 40-130 words, a heading every 25th line and a blank line every 11th (so line heights vary), a unique word on line 1
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { if (i % 25 === 0) { out.push(`## Part ${i / 25}`); i++; continue; } if (i % 11 === 0) { out.push(''); i++; continue; }
  const len = 40 + (i % 90); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; }
  out[0] = 'zephyrquill ' + out[0]; return out.join('\n'); };
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? +s[Math.floor(s.length / 2)].toFixed(1) : null; };
const p90 = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * 0.9))].toFixed(1) : null; };
const mx = (a) => (a.length ? +Math.max(...a).toFixed(1) : null);
const AFTER = "new Promise((res) => requestAnimationFrame(() => setTimeout(() => res(performance.now() - window.__pbT0), 0)))";

// ---- the page-side candidate, injected whole (a function's source, so nothing is quoted by hand)
function pageLib() {
  const PB = (window.__pb = window.__pb || {});
  const R = document.createRange();
  PB.nodes = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = [], starts = []; let p = 0, n; while ((n = w.nextNode())) { nodes.push(n); starts.push(p); p += n.data.length; } return { nodes, starts, total: p }; };
  PB.locate = (T, o) => { let lo = 0, hi = T.starts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (T.starts[m] <= o) lo = m; else hi = m - 1; } return [T.nodes[lo], o - T.starts[lo]]; };
  // the first drawn character at or after o (a newline, a hidden mark or a zero-width guard draws no box of its own)
  PB.rectAt = (T, o) => { for (let k = 0; k < 40 && o + k < T.total; k++) { const [n, off] = PB.locate(T, o + k); const ch = n.data[off]; if (ch === '\n' || ch === '​') continue;
    R.setStart(n, off); R.setEnd(n, off + 1); const rs = R.getClientRects(); for (const q of rs) if (q.height >= 4) return q; } return null; };
  PB.textOf = (T) => T.nodes.map((n) => n.data).join('');
  // THE NAIVE WALK over any root's own laid-out lines (viewport rects, so scaled by the page's transform): the reference for agreement
  PB.walk = (root, H, scale) => {
    const T = PB.nodes(root); const first = PB.rectAt(T, 0); const out = []; if (!first) return { T, breaks: out };
    let pageTop = first.top, lo = 0; const Hs = H * scale;
    for (;;) {
      const target = pageTop + Hs + 0.5 * scale;
      let a = lo, b = T.total; while (a < b) { const m = (a + b) >> 1; const r = PB.rectAt(T, m); if (!r || r.bottom > target) b = m; else a = m + 1; }
      if (a >= T.total) break; const r = PB.rectAt(T, a); if (!r) break;
      const lineTop = r.top; let c = lo, d = a; while (c < d) { const m = (c + d) >> 1; const q = PB.rectAt(T, m); if (q && q.top >= lineTop - 1) d = m; else c = m + 1; }
      out.push(c); pageTop = lineTop; lo = c + 1; if (out.length > 3000) break;
    }
    return { T, breaks: out };
  };
  PB.snips = (T, breaks) => { const t = PB.textOf(T).split('​').join(''); const raw = PB.textOf(T); return breaks.map((o) => { const zw = raw.slice(0, o).split('​').length - 1; const c = o - zw; return t.slice(c, c + 40).replace(/^\n+/, '').slice(0, 28); }); };   // a break the walk lands on the paragraph's own newline is the same page start
  // THE MEASURER: one block per logical line at the framed page's text column, scale 1, off screen
  PB.build = (rowsHtml, geo) => {
    document.getElementById('pb-measurer')?.remove();
    const m = document.createElement('div'); m.id = 'pb-measurer'; m.setAttribute('aria-hidden', 'true');
    const st = { position: 'fixed', left: '-30000px', top: '0px', width: geo.w + 'px', visibility: 'hidden', pointerEvents: 'none', contain: 'layout style', whiteSpace: 'pre-wrap', margin: '0', padding: '0' };
    for (const k of Object.keys(geo.font)) st[k] = geo.font[k];
    Object.assign(m.style, st);
    // min-height 1lh: the live page's empty row has one line of height (boards-connected §7b), and so does a blank line in Free Write's flow
    m.innerHTML = rowsHtml.map((h) => `<div style="display:block;contain:layout style;min-height:1lh">${h}</div>`).join('');
    document.body.appendChild(m); PB.m = m; return m;
  };
  // THE MEASURER'S WALK: whole blocks are skipped by their heights; only a block that crosses a page's foot is searched by its characters
  PB.mwalk = (H, from) => {
    const m = PB.m; const blocks = m.children; const mTop = m.getBoundingClientRect().top; const out = from ? from.breaks.slice() : []; const tops = from ? from.tops.slice() : [];
    let i = from ? from.i : 0; let pageTop = from ? from.pageTop : 0; let lo = from ? from.lo : 0;
    if (!PB.starts || PB.starts.length !== blocks.length) { PB.starts = []; let p = 0; for (const b of blocks) { PB.starts.push(p); p += b.textContent.length + 1; } }
    // page one starts at its first character's box (as every later page does, and as the live walk does), not at the block's edge
    if (!from) { for (const b of blocks) { const r0 = PB.rectAt(PB.nodes(b), 0); if (r0) { pageTop = r0.top - mTop; break; } } }
    const N = blocks.length;
    for (;;) {
      const target = pageTop + H + 0.5;
      while (i < N && blocks[i].offsetTop + blocks[i].offsetHeight <= target) i++;
      if (i >= N) break;
      const b = blocks[i]; const T = PB.nodes(b); const loc = Math.max(0, lo - PB.starts[i]);
      let found = -1, lineTop = 0;
      if (T.total) {
        let a2 = loc, z = T.total; while (a2 < z) { const mm = (a2 + z) >> 1; const r = PB.rectAt(T, mm); if (!r || r.bottom - mTop > target) z = mm; else a2 = mm + 1; }
        const r = a2 < T.total ? PB.rectAt(T, a2) : null;
        if (r) { lineTop = r.top - mTop; let c = loc, d = a2; while (c < d) { const mm = (c + d) >> 1; const q = PB.rectAt(T, mm); if (q && q.top - mTop >= lineTop - 1) d = mm; else c = mm + 1; } found = c; }
      }
      if (found < 0) { found = 0; lineTop = b.offsetTop; }   // the block's first line is the page's first (an empty line, or a block taller than the rest)
      const g = PB.starts[i] + found; if (out.length && g <= out[out.length - 1]) { i++; continue; }
      out.push(g); tops.push(lineTop); pageTop = lineTop; lo = g + 1; if (out.length > 3000) break;
    }
    return { breaks: out, tops, i: Math.max(0, i), pageTop, lo };
  };
  PB.msnips = (breaks) => { const t = [...PB.m.children].map((b) => b.textContent).join('\n'); return breaks.map((o) => t.slice(o, o + 40).replace(/^\n+/, '').slice(0, 28)); };
  // THE PER-KEY WORK (the sync and idle arms): the measurer's last line takes the letter, its last page is walked again, and the last break's mark is
  // placed on the live page at that offset's character
  PB.work = (ch) => {
    const t0 = performance.now();
    const m = PB.m; const last = m.lastElementChild; let tn = last.lastChild; while (tn && tn.nodeType !== 3) tn = tn.lastChild || tn.previousSibling;
    if (tn && tn.nodeType === 3) tn.appendData(ch.length === 1 ? ch : ''); else last.appendChild(document.createTextNode(ch));
    const prev = PB.state; const k = prev.breaks.length - 1;
    const from = k >= 0 ? { breaks: prev.breaks.slice(0, k), tops: prev.tops.slice(0, k), i: Math.max(0, PB.blockOf(prev.breaks[k - 1] ?? 0)), pageTop: k > 0 ? prev.tops[k - 1] : 0, lo: k > 0 ? prev.breaks[k - 1] + 1 : 0 } : null;
    PB.state = PB.mwalk(PB.H, from);
    const t1 = performance.now();
    const ed = document.querySelector('.mode-scroll .forward-only-editor'); const wrap = ed.parentElement; const page = ed.closest('.mode-page');
    const scale = page.offsetWidth ? page.getBoundingClientRect().width / page.offsetWidth : 1;
    const o = PB.state.breaks[PB.state.breaks.length - 1];
    let placed = false;
    if (o != null) {
      let T, base = 0;
      const bi = PB.blockOf(o); const row = ed.querySelector(':scope > .wz-row') ? ed.children[bi] : null;
      if (row) { T = PB.nodes(row); base = PB.starts[bi]; } else T = PB.nodes(ed);
      const r = PB.rectAt(T, o - base);
      if (r) { let mk = PB.mark; if (!mk || !mk.isConnected) { mk = PB.mark = document.createElement('div'); mk.className = 'pb-mark'; mk.setAttribute('aria-hidden', 'true');
          Object.assign(mk.style, { position: 'absolute', left: '-14px', width: '6px', height: '6px', borderLeft: '1px solid currentColor', borderBottom: '1px solid currentColor', transform: 'rotate(-45deg)', opacity: '.5', pointerEvents: 'none' }); wrap.appendChild(mk); }
        mk.style.top = `${(r.top - wrap.getBoundingClientRect().top) / scale}px`; placed = true; }
    }
    const t2 = performance.now();
    (PB.workMs = PB.workMs || []).push(+(t2 - t0).toFixed(2)); (PB.measMs = PB.measMs || []).push(+(t1 - t0).toFixed(2)); PB.placed = placed;
  };
  PB.blockOf = (o) => { const s = PB.starts; let lo = 0, hi = s.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (s[m] <= o) lo = m; else hi = m - 1; } return lo; };
  if (!PB.keyHooked) { PB.keyHooked = true; PB.arm = 'base';
    document.addEventListener('keydown', (e) => { window.__pbT0 = performance.now(); const ch = e.key && e.key.length === 1 ? e.key : '';
      if (PB.arm === 'sync') requestAnimationFrame(() => PB.work(ch));
      else if (PB.arm === 'idle') { clearTimeout(PB.idleT); PB.pend = (PB.pend || '') + ch; PB.idleT = setTimeout(() => { const p = PB.pend; PB.pend = ''; PB.work(p); }, 400); } }, true); }
  return true;
}

await withHarness(async (app) => {
  const set = (w, h) => app.emulateDpr(1, w, h);
  await set(1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-writing-settings', JSON.stringify({ typewriter: false })); true");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  const lib = async () => app.evalJs(`(${pageLib.toString()})()`);
  await lib();
  const seeded = new Set();
  const open = async (words, mode, tag = '') => {
    const id = `pb-${mode}-${words}${tag}`; const seed = pageOf(words);
    if (!seeded.has(id)) { await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: seed, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`); seeded.add(id); }
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', '${mode}')`);
    await sleep(400);
    await app.evalJs("location.hash = '#/'"); await sleep(600);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    const up = await waitSoft(app, `!!document.querySelector('${ED}') && document.querySelector('${ED}').textContent.length > ${Math.min(seed.length - 5, 1000)}`, { label: `${words} words in ${mode}`, timeout: 40000 });
    await sleep(1800);
    await lib();
    const st = await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const page = ed && ed.closest('.mode-page'); const col = ed && ed.closest('.mode-pagecol');
      return { up: !!ed, framed: !!document.querySelector('.desk-frame-stage--prose'), zoom: col ? col.getAttribute('data-zoom') === 'true' : null, rows: ed ? ed.querySelectorAll(':scope > .wz-row').length : 0,
        scale: page && page.offsetWidth ? +(page.getBoundingClientRect().width / page.offsetWidth).toFixed(4) : null, edW: ed ? ed.clientWidth : null, w: innerWidth }; })()`);
    return { id, seed, up: up && st.up, st };
  };
  const caretEnd = async (mode) => {
    await app.evalJs(`document.querySelector('${ED}').focus()`); await sleep(200);
    if (mode === 'drafting') await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); let n = ed.lastElementChild || ed; const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t = null, x; while ((x = w.nextNode())) t = x;
      const s = getSelection(); const r = document.createRange(); if (t) r.setStart(t, t.data.length); else { r.selectNodeContents(n); r.collapse(false); } r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()`);
    await sleep(300);
  };
  // the framed letter page's geometry, read from the live page at 1366 (Draft, 5k): the measurer's column, font and the page's text height
  let GEO = null;
  const readGeo = async () => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const page = ed.closest('.mode-page'); const cs = getComputedStyle(ed); const ps = getComputedStyle(page);
    const li = parseFloat(ps.getPropertyValue('--wz-letter-in')) || (620 / 8.5); const pad = parseFloat(ps.paddingTop) || 0;
    const font = {}; for (const k of ['fontFamily', 'fontSize', 'lineHeight', 'letterSpacing', 'wordSpacing', 'fontWeight', 'fontStyle', 'tabSize', 'textRendering', 'fontKerning', 'fontFeatureSettings', 'fontVariantLigatures', 'overflowWrap', 'wordBreak', 'hyphens', 'textAlign', 'textIndent', 'fontStretch', 'fontOpticalSizing', 'fontVariationSettings']) font[k] = cs[k];
    const w = ed.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    return { w, font, li, pad, padB: parseFloat(ps.paddingBottom) || 0, H: +(11 * li - (parseFloat(ps.paddingTop) || 0) - (parseFloat(ps.paddingBottom) || 0)).toFixed(2), pageW: page.offsetWidth, pageH: page.offsetHeight }; })()`);
  const harvest = async () => app.evalJs(`[...document.querySelector('${ED}').children].filter((r) => r.classList.contains('wz-row')).map((r) => r.innerHTML)`);
  const buildM = async (rows) => app.evalJs(`(() => { const t0 = performance.now(); const m = window.__pb.build(${JSON.stringify(rows)}, ${JSON.stringify(GEO)}); const h = m.lastElementChild.offsetTop + m.lastElementChild.offsetHeight; const t1 = performance.now();
    window.__pb.H = ${GEO.H}; window.__pb.starts = null; const s = window.__pb.mwalk(${GEO.H}); const t2 = performance.now(); window.__pb.state = s;
    return { buildMs: +(t1 - t0).toFixed(1), walkMs: +(t2 - t1).toFixed(1), pages: s.breaks.length + 1, height: Math.round(h), blocks: m.children.length, snips: window.__pb.msnips(s.breaks) }; })()`);
  const liveWalk = async () => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const page = ed.closest('.mode-page'); const scale = page.offsetWidth ? page.getBoundingClientRect().width / page.offsetWidth : 1;
    const t0 = performance.now(); const r = window.__pb.walk(ed, ${GEO ? GEO.H : 678.35}, scale); const t1 = performance.now(); return { ms: +(t1 - t0).toFixed(1), pages: r.breaks.length + 1, scale: +scale.toFixed(4), snips: window.__pb.snips(r.T, r.breaks) }; })()`);
  // SUPERSEDED (run 44608549614): compared the raw 28 characters at each break, and a live break that lands on the paragraph's own newline read
  // "\nwords" against the measurer's "words" - the same page start counted as a difference (9 of 62 same at 20k). Kept for the record:
  // const agree = (a, b) => { const n = Math.max(a.length, b.length); let same = 0, firstDiff = -1; for (let i = 0; i < n; i++) { if (a[i] === b[i]) same++; else if (firstDiff < 0) firstDiff = i; } return { same, of: n, firstDiff, a: firstDiff >= 0 ? a[firstDiff] : null, b: firstDiff >= 0 ? b[firstDiff] : null }; };
  // successor: the snippets drop leading newlines (PB.snips / PB.msnips), and every difference is listed (index, both sides; the first 6 and the last)
  const agree = (a, b) => { const n = Math.max(a.length, b.length); let same = 0; const diffs = []; for (let i = 0; i < n; i++) { if (a[i] === b[i]) same++; else diffs.push([i, a[i] ?? null, b[i] ?? null]); }
    return { same, of: n, counts: [a.length, b.length], diffs: diffs.length > 7 ? [...diffs.slice(0, 6), diffs[diffs.length - 1]] : diffs, lastA: a[a.length - 1] ?? null, lastB: b[b.length - 1] ?? null }; };
  const keyMs = async (ch) => { await app.typeKeys(ch); return app.evalJs(AFTER); };
  const arm = async (name, n = 30) => {
    await app.evalJs(`(() => { const P = window.__pb; P.arm = '${name}'; P.workMs = []; P.measMs = []; clearTimeout(P.idleT); P.pend = ''; return true; })()`);
    for (let i = 0; i < 5; i++) await keyMs('abcde'[i]);
    await app.evalJs("(() => { window.__pb.workMs = []; window.__pb.measMs = []; return true; })()");
    const t = []; for (let i = 0; i < n; i++) t.push(await keyMs('klmnopqrst'[i % 10]));
    if (name === 'idle') await sleep(700);
    const w = await app.evalJs("(() => ({ work: window.__pb.workMs.slice(), meas: window.__pb.measMs.slice(), placed: !!window.__pb.placed }))()");
    await app.evalJs("(() => { window.__pb.arm = 'base'; return true; })()");
    return { arm: name, keys: t.length, med: med(t), p90: p90(t), max: mx(t), workN: w.work.length, workMed: med(w.work), workMax: mx(w.work), measMed: med(w.meas), placed: w.placed };
  };

  const AG = {};
  let complete = true;
  // ---- COST at 1366, and agreement at 1366 for every size
  for (const words of [5000, 20000, 50000]) {
    const d = await open(words, 'drafting');
    say(`open-draft-${words}`, d.st);
    if (!d.up) { complete = false; continue; }
    if (!GEO) { GEO = await readGeo(); say('geometry', GEO); }
    const rows = await harvest();
    const M = await buildM(rows);
    say(`measurer-${words}`, { buildMs: M.buildMs, walkMs: M.walkMs, pages: M.pages, height: M.height, blocks: M.blocks });
    AG[words] = M.snips;
    const L = await liveWalk();
    say(`live-draft-1366-${words}`, { ms: L.ms, pages: L.pages, scale: L.scale, agree: agree(M.snips, L.snips) });
    await caretEnd('drafting');
    const res = []; for (const a of ['base', 'sync', 'idle', 'base']) res.push(await arm(a));
    say(`keys-draft-${words}`, res);
    const f = await open(words, 'journal');
    say(`open-freewrite-${words}`, f.st);
    if (!f.up) { complete = false; continue; }
    await app.evalJs(`(() => { window.__pb.build(${JSON.stringify(rows)}, ${JSON.stringify(GEO)}); window.__pb.H = ${GEO.H}; window.__pb.starts = null; window.__pb.state = window.__pb.mwalk(${GEO.H}); return true; })()`);
    const LF = await liveWalk();
    say(`live-freewrite-1366-${words}`, { ms: LF.ms, pages: LF.pages, scale: LF.scale, agree: agree(M.snips, LF.snips) });
    await caretEnd('journal');
    const resF = []; for (const a of ['base', 'sync', 'idle', 'base']) resF.push(await arm(a));
    say(`keys-freewrite-${words}`, resF);
  }

  // ---- DRAW NEAR THE SCREEN: Draft at 20k and 50k, content-visibility:auto on the rows (injected) against without
  for (const words of [20000, 50000]) {
    const d = await open(words, 'drafting');
    if (!d.up) { complete = false; continue; }
    await caretEnd('drafting');
    const relayout = async () => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const ts = []; for (let i = 0; i < 3; i++) { const t0 = performance.now(); ed.style.width = '99%'; void ed.offsetHeight; ed.style.width = ''; void ed.offsetHeight; ts.push(performance.now() - t0); } return +Math.min(...ts).toFixed(1); })()`);
    const texts = async () => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); return { innerText: ed.innerText.length, textContent: ed.textContent.length }; })()`);
    const ax = async () => { try { const r = await Promise.race([app.cdp('Accessibility.getFullAXTree', {}), sleep(25000).then(() => null)]); if (!r) return 'timeout'; const ns = r.nodes || []; return ns.filter((n) => String(n.name && n.name.value || '').includes('zephyrquill')).length; } catch (e) { return 'error: ' + String(e && e.message || e).slice(0, 80); } };
    const findIt = async () => app.evalJs(`(() => { const s = getSelection(); const keep = s.rangeCount ? s.getRangeAt(0).cloneRange() : null; const hit = window.find('zephyrquill', false, false, true); const where = s.rangeCount ? s.getRangeAt(0).startContainer.parentElement?.className || 'text' : null; s.removeAllRanges(); if (keep) s.addRange(keep); return { hit, where }; })()`);
    const off = { relayoutMs: await relayout(), ...(await texts()) };
    const kOff = await arm('base');
    off.ax = words === 20000 ? await ax() : 'skipped at 50k';
    off.find = await findIt();
    await caretEnd('drafting');
    await app.evalJs("(() => { const st = document.createElement('style'); st.id = 'pb-cv'; st.textContent = '.forward-only-editor .wz-row{ content-visibility:auto; contain-intrinsic-block-size:auto 60px; }'; document.head.appendChild(st); return true; })()");
    await sleep(1500);
    const on = { relayoutMs: await relayout(), ...(await texts()) };
    const kOn = await arm('base');
    on.ax = words === 20000 ? await ax() : 'skipped at 50k';
    on.find = await findIt();
    await app.evalJs("(() => { document.getElementById('pb-cv')?.remove(); return true; })()");
    say(`near-screen-draft-${words}`, { off: { ...off, keys: kOff }, on: { ...on, keys: kOn } });
  }

  // ---- AGREEMENT at 20k: 1920, under the gate (1000), Typewriter zoom (Free Write with the Typewriter on)
  const rows20 = async () => { const d = await open(20000, 'drafting'); return d.up ? harvest() : null; };
  for (const [w, h, tag] of [[1920, 1080, '1920'], [1000, 800, 'gate-1000']]) {
    await set(w, h); await sleep(1200);
    const d = await open(20000, 'drafting');
    if (!d.up) { complete = false; say(`agree-${tag}`, { up: false }); continue; }
    const M = await buildM(await harvest());
    const L = await liveWalk();
    say(`agree-${tag}`, { st: d.st, measurerPages: M.pages, measurerVs1366: agree(AG[20000] || [], M.snips), live: { pages: L.pages, scale: L.scale, ms: L.ms }, liveVsMeasurer: agree(M.snips, L.snips) });
  }
  await set(1366, 768); await sleep(800);
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ typewriter: true })); true");
  await app.reload(); await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); await sleep(800);
  await lib();
  const rz = await rows20();
  if (rz) { await buildM(rz); }
  const fz = await open(20000, 'journal');
  if (fz.up && rz) {
    await app.evalJs(`(() => { window.__pb.build(${JSON.stringify(rz)}, ${JSON.stringify(GEO)}); window.__pb.H = ${GEO.H}; window.__pb.starts = null; window.__pb.state = window.__pb.mwalk(${GEO.H}); return true; })()`);
    const L = await liveWalk();
    say('agree-zoom-freewrite', { st: fz.st, live: { pages: L.pages, scale: L.scale, ms: L.ms }, liveVs1366Measurer: agree(AG[20000] || [], L.snips) });
  } else { complete = false; say('agree-zoom-freewrite', { up: false }); }
  console.log(`PB-PROBE: ${complete ? 'DONE' : 'INCOMPLETE'}`);
});
