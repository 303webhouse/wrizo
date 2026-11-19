// PAGE BREAKS - THE WHOLE-LINE WALK (Fable, Nov 19, 2:20 pm, hand-up 6: "probe the whole-line walk first, on Actions, now"). A PROBE: nothing here
// changes the product. Readings only; one verdict line (PBL-PROBE: DONE | INCOMPLETE).
//   WHY. arbor-pagebreak-probe.mjs (run 44611610412): the shell measurer agreed with the live page break for break at 5k and 20k in every geometry,
//   but at 50k 27 of 155 breaks sat one line apart from page 100 on (~67,000 px down). That walk chained PIXEL positions read as viewport rects,
//   which Chromium maps in single-precision floats: at 65,536 px and beyond a float's step is 1/128 px and more, so a line's foot that lands a
//   hair from the page's foot can read either side of it.
//   THE WHOLE-LINE WALK decides nothing from a deep pixel. Each row (one logical line) gives its EXACT laid-out height (getComputedStyle height:
//   layout units, the same at any depth or scale) and its LINE COUNT (distinct line tops of its own text: a count, never a position). A page holds
//   whole lines while the sum of their pitches (row height / row lines) fits the page's text height; the break is the first character of the
//   first line that does not fit, found inside its row by the line INDEX of a character (local, rounded to the nearest pitch).
//   READ, on the shell (the editor's own class chain, off screen) against the live page: per row, the line count and the offsets where its lines
//   start; then the breaks of the two walks. At 1366 Draft 20k / 50k; Free Write with the Typewriter (zoomed, Nick's ruling: Free Write is always
//   the Typewriter) 20k / 50k, whose lines are read per logical line (no rows); 1920 Draft 50k; under the gate (1000) the shell alone.
// Run: on Actions (harness.yml, files=arbor-pagebreak-lines.mjs). A probe branch only; never merged.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`PBL ${name} ${JSON.stringify(data)}`);
const ED = '.mode-scroll .forward-only-editor';
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { if (i % 25 === 0) { out.push(`## Part ${i / 25}`); i++; continue; } if (i % 11 === 0) { out.push(''); i++; continue; }
  const len = 40 + (i % 90); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; }
  out[0] = 'zephyrquill ' + out[0]; return out.join('\n'); };

function pageLib() {
  const PB = (window.__pbl = window.__pbl || {});
  const R = document.createRange();
  const ZW = String.fromCharCode(0x200b), NL = String.fromCharCode(10);
  PB.nodes = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = [], starts = []; let p = 0, n; while ((n = w.nextNode())) { nodes.push(n); starts.push(p); p += n.data.length; } return { nodes, starts, total: p }; };
  PB.locate = (T, o) => { let lo = 0, hi = T.starts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (T.starts[m] <= o) lo = m; else hi = m - 1; } return [T.nodes[lo], o - T.starts[lo]]; };
  PB.rectAt = (T, o, end) => { const lim = end == null ? T.total : end; for (let k = 0; k < 40 && o + k < lim; k++) { const [n, off] = PB.locate(T, o + k); const ch = n.data[off]; if (ch === NL || ch === ZW) continue;
    R.setStart(n, off); R.setEnd(n, off + 1); const rs = R.getClientRects(); for (const q of rs) if (q.height >= 4) return q; } return null; };
  PB.chainOf = (ed) => { const out = []; for (let e = ed; e && e !== document.body; e = e.parentElement) { const data = {}; for (const a of e.attributes) if (a.name.startsWith('data-') && a.name !== 'data-zoom') data[a.name] = a.value;
      out.push({ tag: e.tagName.toLowerCase(), cls: e.getAttribute('class') || '', style: e.getAttribute('style') || '', data }); if (e.classList.contains('desk-frame-stage')) break; } return out.reverse(); };
  PB.buildShell = (chain, html) => {
    document.getElementById('pbl-shell')?.remove();
    let root = null, cur = null;
    chain.forEach((c, i) => { const el = document.createElement(c.tag); if (c.cls) el.setAttribute('class', c.cls); if (c.style) el.setAttribute('style', c.style); for (const k of Object.keys(c.data)) el.setAttribute(k, c.data[k]);
      if (i === 0) { root = el; el.id = 'pbl-shell'; el.setAttribute('aria-hidden', 'true'); Object.assign(el.style, { position: 'fixed', left: '-30000px', top: '0px', width: '1400px', height: '900px', visibility: 'hidden', pointerEvents: 'none', overflow: 'hidden' }); el.style.setProperty('--wz-k', '1'); el.style.setProperty('--wz-zoom', '1'); }
      if (cur) cur.appendChild(el); cur = el; });
    cur.removeAttribute('contenteditable'); cur.style.position = 'relative'; cur.innerHTML = html;
    document.body.appendChild(root); return cur;
  };
  // the lines of one unit: its text range [s, e) in T; distinct line tops (a count), and the local offsets where its lines start
  const linesOf = (T, s, e) => {
    if (e <= s) return { n: 1, starts: [0] };
    const [a, ao] = PB.locate(T, s); const [b, bo] = PB.locate(T, Math.max(s, e - 1)); R.setStart(a, ao); R.setEnd(b, Math.min(b.data.length, bo + 1));
    const tops = [...R.getClientRects()].filter((q) => q.height >= 4).map((q) => q.top).sort((x, y) => x - y);
    const lt = []; for (const t of tops) if (!lt.length || t - lt[lt.length - 1] > 3) lt.push(t);
    if (lt.length <= 1) return { n: 1, starts: [0] };
    const starts = [0];
    for (let k = 1; k < lt.length; k++) { let c = s, d = e; while (c < d) { const m = (c + d) >> 1; const q = PB.rectAt(T, m, e); if (q && q.top >= lt[k] - 3) d = m; else c = m + 1; } starts.push(c - s); }
    return { n: lt.length, starts };
  };
  // ROWS (Draft's editor, and the shell): height from the computed style (layout units), lines from the row's own text
  PB.unitsRows = (ed) => { const rows = [...ed.children].filter((r) => r.classList.contains('wz-row')); const out = []; let base = 0;
    for (const r of rows) { const T = PB.nodes(r); const L = linesOf(T, 0, T.total); out.push({ h: parseFloat(getComputedStyle(r).height) || 0, n: L.n, starts: L.starts, base, len: r.textContent.length }); base += r.textContent.length + 1; }
    return out; };
  // FREE WRITE (one flow, no rows): a unit per logical line, read as a range; heights are not read here (a range has no layout height), so the walk
  // takes each unit's pitch from the shell's row of the same index - what is compared is the WRAP (the count and where each line starts)
  PB.unitsFlow = (ed) => { const T = PB.nodes(ed); const raw = T.nodes.map((x) => x.data).join(''); const out = []; let s = 0; let clean = 0;
    for (;;) { let e = raw.indexOf(NL, s); const last = e < 0; if (last) e = raw.length; const L = linesOf(T, s, e); const seg = raw.slice(s, e); const zwBefore = (k) => seg.slice(0, k).split(ZW).length - 1;
      const cleanStarts = L.starts.map((k) => k - zwBefore(k)); const cleanLen = seg.split(ZW).join('').length;
      out.push({ h: null, n: L.n, starts: cleanStarts, base: clean, len: cleanLen }); clean += cleanLen + 1; if (last) break; s = e + 1; }
    // a trailing empty unit made only of the end-of-page guard
    if (out.length > 1 && out[out.length - 1].len === 0) out.pop();
    return out; };
  // THE WHOLE-LINE WALK: units -> breaks (clean offsets). pitchOf(i) defaults to the unit's own h / n.
  PB.walkLines = (units, H, pitchOf) => { const br = []; let used = 0, i = 0, j = 0; const EPS = 1e-6;
    while (i < units.length) { const u = units[i]; const p = pitchOf ? pitchOf(i) : u.h / u.n; const remain = (u.n - j) * p;
      if (used + remain <= H + EPS) { used += remain; i++; j = 0; continue; }
      let k = Math.floor((H - used) / p + EPS); if (k <= 0 && used === 0) k = 1;   // a line taller than the page still takes one
      const line = j + k;
      if (line >= u.n) { i++; j = 0; if (i < units.length) br.push(units[i].base); used = 0; continue; }   // (a guard: cannot happen while k < n - j)
      br.push(u.base + u.starts[line]); used = 0; j = line; }
    return br; };
  PB.cleanText = (ed, rows) => rows ? [...ed.children].filter((r) => r.classList.contains('wz-row')).map((r) => r.textContent).join(NL) : ed.textContent.split(ZW).join('');
  PB.snips = (text, br) => br.map((o) => text.slice(o, o + 28));
  return true;
}

await withHarness(async (app) => {
  const set = (w, h) => app.emulateDpr(1, w, h);
  await set(1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-writing-settings', JSON.stringify({ typewriter: true })); true");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  const lib = async () => app.evalJs(`(${pageLib.toString()})()`);
  await lib();
  const seeded = new Set();
  const open = async (words, mode) => {
    const id = `pbl-${mode}-${words}`; const seed = pageOf(words);
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
        scale: page && page.offsetWidth ? +(page.getBoundingClientRect().width / page.offsetWidth).toFixed(4) : null, w: innerWidth }; })()`);
    return { id, up: up && st.up, st };
  };
  const agree = (a, b) => { const n = Math.max(a.length, b.length); let same = 0; const diffs = []; for (let i = 0; i < n; i++) { if (a[i] === b[i]) same++; else diffs.push([i, a[i] ?? null, b[i] ?? null]); }
    return { same, of: n, counts: [a.length, b.length], diffs: diffs.length > 7 ? [...diffs.slice(0, 6), diffs[diffs.length - 1]] : diffs }; };
  // per-unit comparison: counts and line starts
  const unitsCmp = (A, B) => { let nSame = 0, sSame = 0; const bad = []; const N = Math.max(A.length, B.length);
    for (let i = 0; i < N; i++) { const a = A[i], b = B[i]; if (!a || !b) { bad.push([i, a ? a.n : null, b ? b.n : null]); continue; }
      if (a.n === b.n) nSame++; const ss = a.starts.length === b.starts.length && a.starts.every((v, k) => v === b.starts[k]); if (ss) sSame++; else if (bad.length < 6) bad.push([i, a.n, b.n, a.starts.slice(0, 4), b.starts.slice(0, 4)]); }
    return { units: [A.length, B.length], countSame: nSame, startsSame: sSame, bad }; };
  let H = null, CHAIN = null;
  const SHELL = {};   // words -> { units, breaks, snips }
  let complete = true;
  const shellOf = async (words, label) => {
    const r = await app.evalJs(`(() => { const P = window.__pbl; const ed = document.querySelector('${ED}'); const html = ed.innerHTML;
      const t0 = performance.now(); const sh = P.buildShell(${JSON.stringify(CHAIN)}, html); void sh.lastElementChild?.offsetTop; const t1 = performance.now();
      const U = P.unitsRows(sh); const t2 = performance.now(); const br = P.walkLines(U, ${H}); const t3 = performance.now(); const text = P.cleanText(sh, true);
      const out = { buildMs: +(t1 - t0).toFixed(1), unitsMs: +(t2 - t1).toFixed(1), walkMs: +(t3 - t2).toFixed(2), pages: br.length + 1, units: U, breaks: br, snips: P.snips(text, br) };
      document.getElementById('pbl-shell')?.remove(); return out; })()`);
    say(`shell-${label}`, { buildMs: r.buildMs, unitsMs: r.unitsMs, walkMs: r.walkMs, pages: r.pages, rows: r.units.length });
    return r;
  };

  // ---- 1366 Draft: the H and the chain, then 20k and 50k: the shell's units and breaks against the live page's
  for (const words of [20000, 50000]) {
    const d = await open(words, 'drafting'); say(`open-draft-1366-${words}`, d.st);
    if (!d.up) { complete = false; continue; }
    if (!H) { H = await app.evalJs(`(() => { const page = document.querySelector('${ED}').closest('.mode-page'); const ps = getComputedStyle(page); const li = parseFloat(ps.getPropertyValue('--wz-letter-in')) || (620 / 8.5);
      return +(11 * li - (parseFloat(ps.paddingTop) || 0) - (parseFloat(ps.paddingBottom) || 0)).toFixed(4); })()`); CHAIN = await app.evalJs(`window.__pbl.chainOf(document.querySelector('${ED}'))`); say('page', { H, chain: CHAIN.map((c) => c.cls) }); }
    const S = await shellOf(words, `1366-${words}`); SHELL[words] = S;
    const L = await app.evalJs(`(() => { const P = window.__pbl; const ed = document.querySelector('${ED}'); const t0 = performance.now(); const U = P.unitsRows(ed); const t1 = performance.now(); const br = P.walkLines(U, ${H});
      return { unitsMs: +(t1 - t0).toFixed(1), units: U, breaks: br, snips: P.snips(P.cleanText(ed, true), br), pages: br.length + 1 }; })()`);
    say(`draft-1366-${words}`, { liveUnitsMs: L.unitsMs, pages: [S.pages, L.pages], units: unitsCmp(S.units, L.units), breaks: agree(S.snips, L.snips),
      heightsSame: S.units.filter((u, i) => L.units[i] && u.h === L.units[i].h).length });
  }

  // ---- Free Write with the Typewriter (zoomed): the live flow's wrap per logical line against the shell's rows; breaks walked with the shell's pitches
  for (const words of [20000, 50000]) {
    const f = await open(words, 'journal'); say(`open-freewrite-${words}`, f.st);
    if (!f.up || !SHELL[words]) { complete = false; continue; }
    const S = SHELL[words];
    const L = await app.evalJs(`(() => { const P = window.__pbl; const ed = document.querySelector('${ED}'); const t0 = performance.now(); const U = P.unitsFlow(ed); const t1 = performance.now();
      const SU = ${JSON.stringify(S.units.map((u) => u.h / u.n))}; const br = P.walkLines(U, ${H}, (i) => SU[i] ?? SU[SU.length - 1]); const text = P.cleanText(ed, false);
      return { unitsMs: +(t1 - t0).toFixed(1), units: U, breaks: br, snips: P.snips(text, br), pages: br.length + 1 }; })()`);
    say(`freewrite-zoom-${words}`, { liveUnitsMs: L.unitsMs, pages: [S.pages, L.pages], units: unitsCmp(S.units, L.units), breaks: agree(S.snips, L.snips) });
  }

  // ---- 1920 Draft 50k, and under the gate (1000) the shell alone against 1366's shell
  for (const [w, h, tag] of [[1920, 1080, '1920'], [1000, 800, 'gate-1000']]) {
    await set(w, h); await sleep(1200);
    const d = await open(50000, 'drafting'); say(`open-draft-${tag}-50000`, d.st);
    if (!d.up || !SHELL[50000]) { complete = false; continue; }
    const S = await shellOf(50000, `${tag}-50000`);
    const out = { shellVs1366: agree(SHELL[50000].snips, S.snips), shellUnitsVs1366: unitsCmp(SHELL[50000].units, S.units) };
    if (tag === '1920') { const L = await app.evalJs(`(() => { const P = window.__pbl; const ed = document.querySelector('${ED}'); const U = P.unitsRows(ed); const br = P.walkLines(U, ${H}); return { units: U, snips: P.snips(P.cleanText(ed, true), br), pages: br.length + 1 }; })()`);
      out.liveVsShell = agree(S.snips, L.snips); out.liveUnits = unitsCmp(S.units, L.units); out.livePages = L.pages; }
    say(`draft-${tag}-50000`, out);
  }
  console.log(`PBL-PROBE: ${complete ? 'DONE' : 'INCOMPLETE'}`);
});
