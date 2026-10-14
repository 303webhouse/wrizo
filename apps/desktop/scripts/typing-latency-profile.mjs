// TYPING LATENCY - THE PROFILE. A MEASUREMENT, not a check: it prints numbers and passes nothing.
// Fable, 2026-10-06: "Profile at 20k and 50k: split one keystroke into innerText reads, the redecorate, React commit, and
// layout/paint. Name the biggest share." The probe beside it (typing-latency-probe.mjs, item211-card-port) measured the total:
// Draft, caret mid-page, keystroke median 327 ms at 20k words and 964 ms at 50k.
//
// ONE KEYSTROKE, FOUR CLOCKS, read over the same keys (real CDP key events, caret mid-page, Draft):
//   1. PHASES (wall time, in the page): keydown -> the end of the input handlers (the editor's own listener, React's flush that
//      follows it, and everything else up to a bubbling `input` listener on the document) -> the frame (requestAnimationFrame to a
//      message posted from it, which runs once style, layout and paint are done) -> the `selectionchange` handlers (the 211 snap, the
//      reveal, the strip's marks), which may land before or after that paint.
//   2. WRAPPERS (wall time, in the page), installed on the prototypes: every `innerText` read is split into the layout it forces
//      (an `offsetHeight` read first - layout the read would have forced anyway) and the serialisation; every Range.toString (the
//      caret-offset read) and every `innerHTML` write (the redecorate's parse) is timed. Counts per key.
//   3. CPU PROFILE (CDP sampling, 100 us), each sample owned by the nearest recognised frame up its stack: the wrappers above, the
//      redecorate's string build, the strip (marksAt/headingLevelAt), the caret walks, the 211 rules, React (render + commit, by line
//      range in the bundle - react-dom ships pre-minified, so it is found by its licence header, not by names), other app JS, GC,
//      and (program) - native work outside any JS frame, which is where the frame's own style/layout/paint lands.
//   4. A CONTROL: the first keys run with NO wrappers and NO profiler, so the instruments' own cost is visible beside the result.
//   5. THE LAYOUT SHAPE, decided by measurement rather than assumed. Today every plain line is bare text joined by a newline inside ONE
//      pre-wrap block, so the whole page is a single inline formatting context; a per-line DOM patch may still cost a whole-page
//      layout. Clones of the live editor (same classes, same inline style, the app's own decorated HTML, not editable), measured
//      for forced layout after: (A) today's whole-page innerHTML write; (B) a one-character change to a text node mid-page, in
//      today's single block - the floor for any per-line patch that keeps today's DOM; (C) the same change with each line its own
//      BLOCK row (line + its newline inside a display:block element - textContent byte-identical to today); (D) C's middle row
//      rewritten whole via innerHTML, which is what a per-line redecorate would do. 15 trials each, median.
//      And (A') - Fable's variant: today's whole-page path with no structural change, the ~5 innerText reads collapsed to 1 and
//      the two decorations to 1. Its DOM half is timed on a clone; its JS half is this run's CPU shares scaled to what A' keeps,
//      reported as `aPrime_estimate` - a COMPOSED ESTIMATE, never a measured keystroke. If it reaches the target it ships first.
// The bundle must be UNMINIFIED for (3) to name functions:
//   pnpm exec vite build --outDir dist-web --emptyOutDir --minify false
// and rebuilt normally afterwards (pnpm build:web). The script refuses a minified bundle rather than print anonymous buckets.
// Run on a granted box turn:  node scripts/typing-latency-profile.mjs   (from apps/desktop). Writes docs/evidence/latency/profile.json.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { withHarness } from './runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, '..', 'dist-web', 'assets');
// --build (typing-latency, 2026-10-13): make the UNMINIFIED dist-web itself, and restore the normal build afterwards in a finally,
// so the whole profile is one command from any worktree:  node apps/desktop/scripts/typing-latency-profile.mjs --build
const BUILD = process.argv.includes('--build');
if (BUILD) execSync('pnpm exec vite build --outDir dist-web --emptyOutDir --minify false', { cwd: join(here, '..'), stdio: 'pipe' });
const bundles = readdirSync(assets).filter((f) => f.endsWith('.js')).map((f) => ({ f, src: readFileSync(join(assets, f), 'utf8') }));
const main = bundles.find((b) => /function decorateMarkdownForCard\(/.test(b.src));
if (!main) {
  console.error('REFUSED: dist-web is minified (no `function decorateMarkdownForCard(`). Build with --minify false first (see the header).');
  process.exit(2);
}
// React's region in the bundle (0-based lines, as the CPU profile reports them): from the first React licence header to the first
// licence header after react-dom's. Printed, so a wrong region is visible rather than silently misfiling samples.
const lines = main.src.split('\n');
const firstReact = lines.findIndex((l) => l.includes('@license React'));
const domAt = lines.findIndex((l) => l.includes('react-dom.production.min.js'));
let reactEnd = lines.findIndex((l, i) => i > domAt && /@license/.test(l));
if (reactEnd < 0) reactEnd = lines.length;
if (firstReact < 0 || domAt < 0) { console.error('REFUSED: React region not found in the bundle.'); process.exit(2); }
const REACT = [firstReact, reactEnd];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const PARA = 'The writer keeps a **steady** pace through the *long* draft, and ~~nothing~~ __slows__ the page down at all.';
const pageOf = (words) => { const per = PARA.split(' ').length; return Array.from({ length: Math.ceil(words / per) }, () => PARA).join('\n'); };
const CONTROL_KEYS = 8;
const KEYS = 20;
const WARM = 2;
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const pct = (xs, p) => { const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b); return s.length ? r1(s[Math.min(s.length - 1, Math.floor(p * s.length))]) : null; };

// The nearest of these up a sample's stack owns it. Order is irrelevant - the walk is leaf-first, and the FIRST frame matching any
// owner decides. readMarks / readLead are deliberately not owners: they belong to whichever caller reached them (decorate or strip).
const OWNERS = [
  ['innerText (wrapper)', /^__wzInnerText$/],
  ['Range text (wrapper)', /^__wzRangeText$/],
  ['innerHTML parse (wrapper)', /^__wzInnerHTML$/],
  ['redecorate: string build', /^(decorateEditorFor|editorHtmlFor|decorateMarkdownForCard|decorateMarkdown|revealAtCaret)(\$\d+)?$/],
  ['readEditorPlainText (string)', /^readEditorPlainText(\$\d+)?$/],
  ['strip: marksAt/headingLevelAt', /^(marksAt|headingLevelAt)(\$\d+)?$/],
  ['caret walks', /^(domPointFor|setCaretOffset|getCaretOffset|rawOffsetOf|placeCaret|selectionEnds|extendSelection)(\$\d+)?$/],
  ['211 rules', /^(snapCaret|snapCaretAfterClick|stepLeft|stepRight|backspaceAt|deleteAt|wordBackspaceAt|wordDeleteAt|replaceRange|nativeRange|enterAt|reabsorb|closersAt|lineAt|allRuns)(\$\d+)?$/],
  ['the 211 controller', /^(plainNow|repairInput|beforeInput|selectionChange|markKey|pendingMark|setPending)(\$\d+)?$/],
  ['undo + em dash', /^(record|classifyEditKind|findEmDashTrigger|applyEmDash)(\$\d+)?$/],
  ['the rows (lineRows)', /^(writeRows|replaceRegion|readNativeEdit|noteNativeEdit|rowsOffsetOf|offsetBeforeTop|rowsPointFor|revealRowsAtCaret|recomputeStarts|lineOf|verifyRows|placeRowsCaret|mountRows|rowsCaretOffset|rowsSelectionOffsets|rowsSelectionEnds|rowsDomPoint|editorPlainText|writeRow)(\$\d+)?$/],
];

// Installed in the page. Plain function, serialised with toString, so nothing in it passes through a template literal's escapes.
function pageInstruments() {
  // calls: [start, kind, ms, ms2] for every wrapped call - filtered to each key's window in node, so work that runs BETWEEN keys
  // (the debounced save, a timer) is never charged to the key before it.
  const W = (window.__wz = { recs: [], calls: [], cur: null, wrapped: false });
  const now = () => performance.now();
  window.addEventListener('keydown', () => {
    W.cur = { t0: now(), inputEnd: null, raf: null, painted: null, selMs: 0, selN: 0, selEnd: null };
    W.recs.push(W.cur);
  }, true);
  document.addEventListener('input', () => {
    const c = W.cur; if (!c || c.inputEnd !== null) return;
    c.inputEnd = now();
    requestAnimationFrame(() => {
      c.raf = now();
      const ch = new MessageChannel();
      ch.port1.onmessage = () => { c.painted = now(); };
      ch.port2.postMessage(0);
    });
  });
  let selStart = null;
  window.addEventListener('selectionchange', () => { selStart = now(); }, true);
  document.addEventListener('selectionchange', () => {
    const c = W.cur; if (!c || selStart === null) return;
    const t = now(); c.selMs += t - selStart; c.selN += 1; c.selEnd = t; selStart = null;
  });
  W.wrap = () => {
    if (W.wrapped) return; W.wrapped = true;
    const it = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText');
    const __wzInnerText = function () {
      const a = now(); void this.offsetHeight; const b = now(); const v = it.get.call(this);
      W.calls.push([a, 'it', b - a, now() - b]);
      return v;
    };
    Object.defineProperty(HTMLElement.prototype, 'innerText', { configurable: true, set: it.set, get: __wzInnerText });
    const ih = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    const __wzInnerHTML = function (v) { const a = now(); ih.set.call(this, v); W.calls.push([a, 'ih', now() - a, 0]); };
    Object.defineProperty(Element.prototype, 'innerHTML', { configurable: true, get: ih.get, set: __wzInnerHTML });
    const rt = Range.prototype.toString;
    const __wzRangeText = function () { const a = now(); const v = rt.call(this); W.calls.push([a, 'rt', now() - a, 0]); return v; };
    Range.prototype.toString = __wzRangeText;
  };
}

// Installed in the page after the profile. Returns medians in ms.
function layoutShape() {
  const el = document.querySelector('.forward-only-editor');
  // the editor renders ROWS now (store/lineRows.ts): "today" is the ONE-BLOCK page rebuilt from them - the decorated lines joined by
  // newlines, then the EOF guard - which is exactly what the editor wrote before rows. (Without rows, its own innerHTML is that.)
  const html = (() => { const rs = [...el.children].filter((c) => c.classList.contains('wz-row')); if (!rs.length) return el.innerHTML;
    const g = el.querySelector('.md-eof-guard'); return rs.map((r) => r.innerHTML).join('\n') + (g ? g.outerHTML : ''); })();
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return Math.round(s[Math.floor(s.length / 2)] * 10) / 10; };
  const T = 15;
  const make = (inner) => {
    const c = el.cloneNode(false);
    c.removeAttribute('contenteditable'); c.removeAttribute('id'); c.removeAttribute('aria-describedby');
    c.innerHTML = inner;
    el.parentElement.insertBefore(c, el.nextSibling);
    void c.offsetHeight;
    return c;
  };
  const midText = (root) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const all = []; let n;
    while ((n = w.nextNode())) if (n.data.length > 8 && !(n.parentElement && n.parentElement.closest('.md-mark-hidden'))) all.push(n);
    return all[Math.floor(all.length / 2)];
  };
  const res = {};
  // A - today: the whole page rewritten, then laid out
  { const c = make(html); const set = [], lay = [];
    for (let i = 0; i < T; i += 1) { const a = performance.now(); c.innerHTML = html; const b = performance.now(); void c.offsetHeight; set.push(b - a); lay.push(performance.now() - b); }
    res.A_wholeReplace = { parse: med(set), layout: med(lay) }; c.remove(); }
  // A' (Fable, 2026-10-06) - today's whole-page path, no structural change, with the reads collapsed to ONE: a character lands,
  // one innerText read (the layout it forces, then the serialisation), the whole page rewritten, the frame's layout. The string
  // build, React and the caret walks are not DOM work and are added from this run's CPU profile, in node (aPrime_estimate).
  { const c = make(html); const l1 = [], ser = [], set = [], l2 = [], tot = [];
    for (let i = 0; i < T; i += 1) {
      const t = midText(c); t.data = t.data + 'a';
      const a = performance.now(); void c.offsetHeight; const b = performance.now(); void c.innerText; const d = performance.now();
      c.innerHTML = html; const e = performance.now(); void c.offsetHeight; const f = performance.now();
      l1.push(b - a); ser.push(d - b); set.push(e - d); l2.push(f - e); tot.push(f - a);
    }
    res.Aprime_domPath = { layoutBeforeRead: med(l1), serialise: med(ser), parse: med(set), layoutAfter: med(l2), total: med(tot) }; c.remove(); }
  // B - today's single block, one character changed mid-page
  { const c = make(html); const t = midText(c); const lay = [];
    for (let i = 0; i < T; i += 1) { t.data = t.data + 'a'; const b = performance.now(); void c.offsetHeight; lay.push(performance.now() - b); }
    res.B_singleBlock_oneChar = { layout: med(lay) }; c.remove(); }
  // C / D - block rows
  const lines = html.split('\n');
  const rows = lines.map((l, i) => `<div class="wz-probe-row" style="display:block">${l}${i < lines.length - 1 ? '\n' : ''}</div>`).join('');
  { const c = make(rows); const same = c.textContent === el.textContent; const t = midText(c); const lay = [];
    for (let i = 0; i < T; i += 1) { t.data = t.data + 'a'; const b = performance.now(); void c.offsetHeight; lay.push(performance.now() - b); }
    res.C_blockRows_oneChar = { layout: med(lay), textContentIdentical: same, rows: c.children.length,
      heightVsToday: Math.round(c.offsetHeight) + ' vs ' + Math.round(el.offsetHeight) };
    const row = c.children[Math.floor(c.children.length / 2)]; const rowHtml = row.innerHTML; const set = [], lay2 = [];
    for (let i = 0; i < T; i += 1) { const a = performance.now(); row.innerHTML = rowHtml; const b = performance.now(); void c.offsetHeight; set.push(b - a); lay2.push(performance.now() - b); }
    res.D_blockRows_rowRewrite = { parse: med(set), layout: med(lay2) };
    c.remove(); }
  return res;
}

// VARIANT E (Fable, 2026-10-13: plan step 1, measured before anything is built) - block rows WITH `contain: layout style` and
// `content-visibility: auto`, each block's `contain-intrinsic-size` ESTIMATED from its character count and the characters-per-line
// measured on fully laid-out rows (a prose "line" is a paragraph that wraps; one line-height would badly underestimate it).
// Measured with the real editor HIDDEN, so the clone IS the scroller's content and blocks off screen are genuinely skipped (a clone
// below a 160,000px editor would be skipped whole and measure nothing). Reports: one-character layout at a visible mid-page block;
// how many blocks the browser actually rendered; the estimate's drift (estimated total height vs the real total, the real total taken
// from the same rows fully laid out); and the SCROLL JUMP - a block three-quarters down, scrolled to by its estimated position,
// moves by how many px once it and its neighbours render.
async function variantE() {
  const el = document.querySelector('.forward-only-editor');
  const scroller = document.querySelector('.mode-scroll');
  if (!el || !scroller) return { missing: true };
  // the editor renders ROWS now (store/lineRows.ts): "today" is the ONE-BLOCK page rebuilt from them - the decorated lines joined by
  // newlines, then the EOF guard - which is exactly what the editor wrote before rows. (Without rows, its own innerHTML is that.)
  const html = (() => { const rs = [...el.children].filter((c) => c.classList.contains('wz-row')); if (!rs.length) return el.innerHTML;
    const g = el.querySelector('.md-eof-guard'); return rs.map((r) => r.innerHTML).join('\n') + (g ? g.outerHTML : ''); })();
  const lines = html.split('\n');
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return Math.round(s[Math.floor(s.length / 2)] * 10) / 10; };
  const lh = parseFloat(getComputedStyle(el).lineHeight) || 28;
  // The clones live in their OWN visible host, beside the (hidden) editor, and each clone's copied inline display is CLEARED:
  // cloneNode copies the editor's inline style, so a clone made after the editor was hidden inherited display:none and laid out at
  // zero (chat 1's run @ 14032189 read all zeros - FIX's bug, found by chat 1).
  const host = document.createElement('div');
  host.className = 'wz-probe-host';
  const mk = (style) => {
    const c = el.cloneNode(false);
    c.removeAttribute('contenteditable'); c.removeAttribute('id'); c.removeAttribute('aria-describedby');
    c.style.display = '';
    c.innerHTML = lines.map((l, i) => `<div class="wz-probe-row" style="display:block;${style(i)}">${l}${i < lines.length - 1 ? '\n' : ''}</div>`).join('');
    host.appendChild(c);
    return c;
  };
  const prevDisplay = el.style.display;
  el.parentElement.insertBefore(host, el.nextSibling);
  el.style.display = 'none';
  try {
    // 1. ground truth: the same rows, nothing skipped - each row's true height, and the characters per screen line
    const truth = mk(() => '');
    void truth.offsetHeight;
    const trueH = [...truth.children].map((r) => r.getBoundingClientRect().height);
    const trueTotal = Math.round(truth.getBoundingClientRect().height);
    const cpls = [];
    [...truth.children].forEach((r, i) => { const n = Math.round(trueH[i] / lh); const chars = (r.textContent || '').replace(/\n$/, '').length; if (n >= 2) cpls.push(chars / n); });
    const cplFallback = cpls.length === 0;   // no wrapped row measured: the estimate would be a guess - flagged, and the run fails on it
    const cpl = cpls.length ? med(cpls) : Math.max(20, Math.floor(el.clientWidth / (parseFloat(getComputedStyle(el).fontSize) * 0.5)));
    truth.remove();
    // 2. E: contain + content-visibility:auto + an estimated intrinsic size per block
    const est = (i) => { const chars = (lines[i].replace(/<[^>]*>/g, '').length); return Math.max(1, Math.ceil(chars / cpl)) * lh; };
    const c = mk((i) => `contain:layout style;content-visibility:auto;contain-intrinsic-size:auto ${est(i)}px`);
    await frame();
    const estTotal = Math.round(c.getBoundingClientRect().height);
    const mid = Math.floor(c.children.length / 2);
    c.children[mid].scrollIntoView({ block: 'center' });
    await frame();
    // CORRECTION (2026-10-14): this counts every block, because checkVisibility() of a content-visibility:auto element ITSELF is
    // true - only its contents are skipped. It is kept as recorded; variant G's G1 counts skipping from the browser's own
    // contentvisibilityautostatechange event instead.
    const rendered = [...c.children].filter((r) => r.getBoundingClientRect().height > 0 && getComputedStyle(r).contentVisibility === 'auto' && r.checkVisibility && r.checkVisibility({ contentVisibilityAuto: true })).length;
    const w = document.createTreeWalker(c.children[mid], NodeFilter.SHOW_TEXT); let t = null, n;
    while ((n = w.nextNode())) if (n.data.length > 8 && !(n.parentElement && n.parentElement.closest('.md-mark-hidden'))) { t = n; break; }
    const lay = [];
    if (t) for (let i = 0; i < 15; i += 1) { t.data = t.data + 'a'; const b = performance.now(); void c.offsetHeight; lay.push(performance.now() - b); }
    // 3. the scroll jump: go to a block three-quarters down by its ESTIMATED position, then let it and its neighbours render
    const far = c.children[Math.floor(c.children.length * 0.75)];
    const sb = scroller.getBoundingClientRect();
    scroller.scrollTop = scroller.scrollTop + (far.getBoundingClientRect().top - sb.top) - 100;
    const at0 = Math.round(far.getBoundingClientRect().top - sb.top);
    await frame(); await frame();
    const at1 = Math.round(far.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
    const estTotalAfter = Math.round(c.getBoundingClientRect().height);
    c.remove();
    return { blocks: lines.length, lineHeight: lh, charsPerLine: Math.round(cpl * 10) / 10, charsPerLineFallback: cplFallback, wrappedRowsMeasured: cpls.length,
      oneCharLayout_median: lay.length ? med(lay) : null, renderedBlocksAroundCaret: rendered,
      trueTotalPx: trueTotal, estimatedTotalPx: estTotal, driftPx: estTotal - trueTotal, driftPct: Math.round(((estTotal - trueTotal) / trueTotal) * 10000) / 100,
      scrollJumpPx: at1 - at0, estimatedTotalAfterScrollPx: estTotalAfter };
  } finally {
    host.remove();
    el.style.display = prevDisplay;
  }
}

// VARIANT F (typing-latency build, 2026-10-13) - the ROW SHAPE, measured before the DOM half is built. E's rows were display:BLOCK
// with each line's newline INSIDE its block: textContent stays byte-identical (C proved it), but by the innerText rules every block
// boundary is a required line break, so the editor's innerText - and the text a writer COPIES out of it - would gain a blank line
// at every row boundary. E never checked either. F is today's own `.md-line` shape (an INLINE-BLOCK, width 100%, the newline OUTSIDE
// it, between rows) with `contain: layout style`, which keeps innerText by construction. Each shape is compared against a visible
// clone of TODAY's editor on four identities (textContent, innerText, the select-all text, total height), and timed: one character
// changed in a mid-page row, then that one row's innerHTML rewritten. The real editor is hidden while the clones lay out, so a clone
// IS the scroller's content (the same host E uses).
async function variantF() {
  const el = document.querySelector('.forward-only-editor');
  if (!el) return { missing: true };
  // the editor renders ROWS now (store/lineRows.ts): "today" is the ONE-BLOCK page rebuilt from them - the decorated lines joined by
  // newlines, then the EOF guard - which is exactly what the editor wrote before rows. (Without rows, its own innerHTML is that.)
  const html = (() => { const rs = [...el.children].filter((c) => c.classList.contains('wz-row')); if (!rs.length) return el.innerHTML;
    const g = el.querySelector('.md-eof-guard'); return rs.map((r) => r.innerHTML).join('\n') + (g ? g.outerHTML : ''); })();
  const lines = html.split('\n');
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return xs.length ? Math.round(s[Math.floor(s.length / 2)] * 10) / 10 : null; };
  const host = document.createElement('div');
  host.className = 'wz-probe-host';
  const mk = (inner) => {
    const c = el.cloneNode(false);
    c.removeAttribute('contenteditable'); c.removeAttribute('id'); c.removeAttribute('aria-describedby');
    c.style.display = '';
    c.innerHTML = inner;
    host.appendChild(c);
    return c;
  };
  const selectAllText = (c) => {
    const sel = window.getSelection(); const r = document.createRange(); r.selectNodeContents(c);
    sel.removeAllRanges(); sel.addRange(r); const s = sel.toString(); sel.removeAllRanges(); return s;
  };
  const firstEditableText = (row) => {
    const w = document.createTreeWalker(row, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (n.data.length > 8 && !(n.parentElement && n.parentElement.closest('.md-mark-hidden'))) return n;
    return null;
  };
  const measure = (c, rowsOf, today) => {
    const rows = rowsOf(c);
    const out = {
      rows: rows.length,
      textContentIdentical: c.textContent === today.text,
      innerTextIdentical: c.innerText === today.inner,
      selectAllTextIdentical: selectAllText(c) === today.selectAll,
      heightPx: Math.round(c.getBoundingClientRect().height), heightVsToday: Math.round(c.getBoundingClientRect().height) - today.height,
    };
    // first lines of a difference, so a FALSE says where (the innerText rule predicts an extra '\n' at each row boundary)
    if (!out.innerTextIdentical) {
      const a = c.innerText, b = today.inner; let i = 0; while (i < a.length && a[i] === b[i]) i++;
      out.innerTextFirstDiff = { at: i, variant: JSON.stringify(a.slice(Math.max(0, i - 12), i + 12)), today: JSON.stringify(b.slice(Math.max(0, i - 12), i + 12)), lengthVariant: a.length, lengthToday: b.length };
    }
    const mid = rows[Math.floor(rows.length / 2)];
    const t = firstEditableText(mid);
    const lay = [];
    if (t) for (let i = 0; i < 15; i += 1) { t.data = t.data + 'a'; const b = performance.now(); void c.offsetHeight; lay.push(performance.now() - b); }
    out.oneCharLayout_median = med(lay);
    const rowHtml = mid.innerHTML; const set = [], lay2 = [];
    for (let i = 0; i < 15; i += 1) { const a = performance.now(); mid.innerHTML = rowHtml; const b = performance.now(); void c.offsetHeight; set.push(b - a); lay2.push(performance.now() - b); }
    out.rowRewrite = { parse: med(set), layout: med(lay2) };
    return out;
  };
  const prevDisplay = el.style.display;
  el.parentElement.insertBefore(host, el.nextSibling);
  el.style.display = 'none';
  try {
    // today, visible: the baseline every identity is checked against (the hidden editor's own innerText would be its textContent)
    const t0 = mk(html);
    void t0.offsetHeight;
    const today = { text: t0.textContent, inner: t0.innerText, selectAll: selectAllText(t0), height: Math.round(t0.getBoundingClientRect().height) };
    const bLay = [];
    { const t = firstEditableText(t0); if (t) for (let i = 0; i < 15; i += 1) { t.data = t.data + 'a'; const b = performance.now(); void t0.offsetHeight; bLay.push(performance.now() - b); } }
    t0.remove();
    // E's row shape (block, newline inside), with E's containment and no content-visibility (Fable: content-visibility skipped nothing)
    const cE = mk(lines.map((l, i) => `<div class="wz-probe-row" style="display:block;contain:layout style">${l}${i < lines.length - 1 ? '\n' : ''}</div>`).join(''));
    void cE.offsetHeight;
    const blockRows = measure(cE, (c) => [...c.children], today);
    cE.remove();
    // F: today's .md-line shape - inline-block, width 100%, newline between rows - with containment
    const fStyle = 'display:inline-block;width:100%;box-sizing:border-box;vertical-align:top;contain:layout style';
    const cF = mk(lines.map((l) => `<span class="wz-probe-row" style="${fStyle}">${l}</span>`).join('\n'));
    void cF.offsetHeight;
    const inlineBlockRows = measure(cF, (c) => [...c.children], today);
    cF.remove();
    return { lines: lines.length, today: { heightPx: today.height, oneCharLayout_median: med(bLay) }, E_blockRows: blockRows, F_inlineBlockRows: inlineBlockRows };
  } finally {
    host.remove();
    el.style.display = prevDisplay;
  }
}

// VARIANT G (Fable, 2026-10-14: "F wins ... but 108 ms is still twice the budget. Find what still lays out per keystroke with F.
// Content-visibility is now justified to try on F rows, with your character-count height estimate, if it measurably cuts the cost.")
// THE CORRECTION THIS STARTS FROM: E's "renderedBlocksAroundCaret" read every block (1112/2778) because it asked checkVisibility() of
// the content-visibility:auto ROW itself - which is always visible; only its CONTENTS are skipped. So the conclusion drawn from it
// ("content-visibility skipped nothing; containment alone did the work") was FIX's instrument error: F's own run measured containment
// alone at 108 ms, against E's 7.7 ms WITH content-visibility. Skipping is counted here from the browser's own signal, the
// `contentvisibilityautostatechange` event (`skipped` true/false per row), never from a geometry or visibility read.
// Three shapes, each F's rows in the same hidden-editor host F uses:
//   G1  F + content-visibility:auto, contain-intrinsic-size from the character-count estimate (E's method): one-char layout, rows
//       actually skipped, the estimate's drift, the scroll jump, and the four identities (copy must stay byte-identical);
//   G2  F with contain: inline-size added (a row's inline size never depends on its text): does the cost come from intrinsic sizing?
//   G3  F inside a host with contain: strict and a fixed size: is the cost in the rows, or in the ancestors' layout around them?
async function variantG() {
  const el = document.querySelector('.forward-only-editor');
  const scroller = document.querySelector('.mode-scroll');
  if (!el || !scroller) return { missing: true };
  // the page's rows as they are NOW (the product renders rows already); their inner HTML is the line, decorated
  const live = [...el.children].filter((c) => c.classList.contains('wz-row'));
  const lines = live.length ? live.map((r) => r.innerHTML) : el.innerHTML.split('\n');
  const guard = el.querySelector('.md-eof-guard') ? el.querySelector('.md-eof-guard').outerHTML : '';
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return xs.length ? Math.round(s[Math.floor(s.length / 2)] * 10) / 10 : null; };
  const lh = parseFloat(getComputedStyle(el).lineHeight) || 28;
  const F = 'display:inline-block;width:100%;box-sizing:border-box;vertical-align:top;';
  const host = document.createElement('div');
  host.className = 'wz-probe-host';
  const mk = (rowStyle, hostStyle = '') => {
    host.setAttribute('style', hostStyle);
    const c = el.cloneNode(false);
    c.removeAttribute('contenteditable'); c.removeAttribute('id'); c.removeAttribute('aria-describedby');
    c.style.display = '';
    c.innerHTML = lines.map((l, i) => `<span class="wz-probe-row" style="${F}${rowStyle(i)}">${l}</span>`).join('\n') + guard;
    host.appendChild(c);
    return c;
  };
  const selectAllText = (c) => { const sel = window.getSelection(); const r = document.createRange(); r.selectNodeContents(c); sel.removeAllRanges(); sel.addRange(r); const s = sel.toString(); sel.removeAllRanges(); return s; };
  const firstText = (row) => { const w = document.createTreeWalker(row, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.data.length > 8 && !(n.parentElement && n.parentElement.closest('.md-mark-hidden'))) return n; return null; };
  const oneChar = (c, row) => { const t = firstText(row); const lay = []; if (t) for (let i = 0; i < 15; i += 1) { t.data = t.data + 'a'; const b = performance.now(); void c.offsetHeight; lay.push(performance.now() - b); } return med(lay); };
  const prevDisplay = el.style.display;
  el.parentElement.insertBefore(host, el.nextSibling);
  el.style.display = 'none';
  try {
    // ground truth: F rows, nothing skipped - each row's true height, the characters per screen line, the identities' baseline
    const truth = mk(() => 'contain:layout style;');
    void truth.offsetHeight;
    const rowsT = [...truth.children].filter((r) => r.classList.contains('wz-probe-row'));
    const trueH = rowsT.map((r) => r.getBoundingClientRect().height);
    const trueTotal = Math.round(truth.getBoundingClientRect().height);
    const trueW = Math.round(truth.getBoundingClientRect().width);
    const base = { text: truth.textContent, inner: truth.innerText, selectAll: selectAllText(truth) };
    const cpls = [];
    rowsT.forEach((r, i) => { const n = Math.round(trueH[i] / lh); const chars = (r.textContent || '').length; if (n >= 2) cpls.push(chars / n); });
    const cpl = cpls.length ? med(cpls) : null;
    const F_oneChar = oneChar(truth, rowsT[Math.floor(rowsT.length / 2)]);
    truth.remove();
    const out = { lines: lines.length, lineHeight: lh, charsPerLine: cpl, wrappedRowsMeasured: cpls.length, trueTotalPx: trueTotal, F_containOnly_oneCharLayout: F_oneChar };
    // G1 - content-visibility on F rows, estimated sizes
    if (cpl) {
      const est = (i) => Math.max(1, Math.ceil((lines[i].replace(/<[^>]*>/g, '').length) / cpl)) * lh;
      const c = mk((i) => `contain:layout style;content-visibility:auto;contain-intrinsic-size:auto ${est(i)}px;`);
      const rows = [...c.children].filter((r) => r.classList.contains('wz-probe-row'));
      const skipped = new Map();
      rows.forEach((r, i) => r.addEventListener('contentvisibilityautostatechange', (e) => { skipped.set(i, !!e.skipped); }));
      await frame();
      const estTotal = Math.round(c.getBoundingClientRect().height);
      const mid = rows[Math.floor(rows.length / 2)];
      mid.scrollIntoView({ block: 'center' });
      await frame(); await frame();
      const skippedNow = [...skipped.values()].filter(Boolean).length;
      const g1one = oneChar(c, mid);
      const far = rows[Math.floor(rows.length * 0.75)];
      const sb = scroller.getBoundingClientRect();
      scroller.scrollTop = scroller.scrollTop + (far.getBoundingClientRect().top - sb.top) - 100;
      const at0 = Math.round(far.getBoundingClientRect().top - sb.top);
      await frame(); await frame();
      const at1 = Math.round(far.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
      out.G1_contentVisibility = { oneCharLayout_median: g1one, rowsSkipped: skippedNow, rowsWithState: skipped.size, rows: rows.length,
        estimatedTotalPx: estTotal, driftPx: estTotal - trueTotal, driftPct: Math.round(((estTotal - trueTotal) / trueTotal) * 10000) / 100, scrollJumpPx: at1 - at0,
        textContentIdentical: c.textContent === base.text, innerTextIdentical: c.innerText === base.inner, selectAllTextIdentical: selectAllText(c) === base.selectAll };
      c.remove();
    }
    // G2 - inline-size containment added
    { const c = mk(() => 'contain:inline-size layout style;'); void c.offsetHeight;
      const rows = [...c.children].filter((r) => r.classList.contains('wz-probe-row'));
      out.G2_inlineSize = { oneCharLayout_median: oneChar(c, rows[Math.floor(rows.length / 2)]), heightVsTruth: Math.round(c.getBoundingClientRect().height) - trueTotal,
        innerTextIdentical: c.innerText === base.inner };
      c.remove(); }
    // G3 - the same F rows inside a strictly contained, fixed-size host: the ancestors cannot be involved
    { const c = mk(() => 'contain:layout style;', `contain:strict;width:${trueW}px;height:${trueTotal}px;overflow:hidden;`); void c.offsetHeight;
      const rows = [...c.children].filter((r) => r.classList.contains('wz-probe-row'));
      out.G3_strictHost = { oneCharLayout_median: oneChar(c, rows[Math.floor(rows.length / 2)]) };
      c.remove(); }
    return out;
  } finally {
    host.remove();
    host.removeAttribute('style');
    el.style.display = prevDisplay;
  }
}

// THE KEYSTROKE TRACE (Fable, 2026-10-14: "Find what still lays out per keystroke"). Chrome's own timeline over real keystrokes in the
// REAL editor: per key (keydown to the next keydown), the time in each rendering phase, every Layout's dirty and total object counts
// (how much of the page each layout touched), and - for a layout JavaScript forced - the function that forced it (the build is
// unminified, so the names are the source's).
async function traceKeys(app, n, gap, sleep) {
  const events = [];
  const off = app.tap((m, p) => { if (m === 'Tracing.dataCollected' && p && p.value) for (const e of p.value) events.push(e); });
  await app.cdp('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack', transferMode: 'ReportEvents' });
  for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); await sleep(gap); }
  const done = app.waitEvent('Tracing.tracingComplete', 60000);
  await app.cdp('Tracing.end');
  await done;
  off();
  const keydowns = events.filter((e) => e.name === 'EventDispatch' && e.args && e.args.data && e.args.data.type === 'keydown').map((e) => e.ts).sort((a, b) => a - b);
  const PH = ['Layout', 'UpdateLayoutTree', 'PrePaint', 'Paint', 'Layerize', 'ParseHTML', 'FunctionCall', 'EventDispatch', 'RunMicrotasks'];
  const keys = keydowns.map((t0, k) => ({ t0, t1: keydowns[k + 1] ?? t0 + gap * 1000, ms: Object.fromEntries(PH.map((p) => [p, 0])), layouts: [] }));
  const keyOf = (ts) => keys.find((k) => ts >= k.t0 && ts < k.t1);
  // a phase arrives either as one complete event (ph X, with dur) or as a begin/end pair (B ... E on the same thread): both are read,
  // the pair folded into one event carrying the begin's args and the end's
  const flat = [];
  const open = new Map();
  for (const e of events) {
    if (!PH.includes(e.name)) continue;
    if (e.ph === 'X' && typeof e.dur === 'number') flat.push(e);
    else if (e.ph === 'B') { const key = e.tid + ':' + e.name; (open.get(key) || open.set(key, []).get(key)).push(e); }
    else if (e.ph === 'E') { const st = open.get(e.tid + ':' + e.name); const b = st && st.pop(); if (b) flat.push({ name: e.name, ts: b.ts, dur: e.ts - b.ts, args: { ...(b.args || {}), ...(e.args || {}) } }); }
  }
  for (const e of flat) {
    const k = keyOf(e.ts);
    if (!k) continue;
    k.ms[e.name] += e.dur / 1000;
    if (e.name === 'Layout') {
      const b = (e.args && e.args.beginData) || {};
      const st = b.stackTrace && b.stackTrace[0];
      k.layouts.push({ ms: Math.round(e.dur / 100) / 10, dirty: b.dirtyObjects ?? null, total: b.totalObjects ?? null, partial: b.partialLayout ?? null, forcedBy: st ? st.functionName || '(anonymous)' : null });
    }
  }
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return xs.length ? Math.round(s[Math.floor(s.length / 2)] * 10) / 10 : null; };
  const pct = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return xs.length ? Math.round(s[Math.min(s.length - 1, Math.floor(s.length * q))] * 10) / 10 : null; };
  const forced = {};
  for (const k of keys) for (const l of k.layouts) if (l.forcedBy) forced[l.forcedBy] = (forced[l.forcedBy] || 0) + 1;
  return {
    keys: keys.length, traceEvents: events.length,
    perKeyMedianMs: Object.fromEntries(PH.map((p) => [p, med(keys.map((k) => k.ms[p]))])),
    perKeyP95Ms: Object.fromEntries(PH.map((p) => [p, pct(keys.map((k) => k.ms[p]), 0.95)])),
    layoutsPerKey_median: med(keys.map((k) => k.layouts.length)),
    dirtyObjects_median: med(keys.flatMap((k) => k.layouts.map((l) => l.dirty).filter((x) => x !== null))),
    totalObjects_median: med(keys.flatMap((k) => k.layouts.map((l) => l.total).filter((x) => x !== null))),
    forcedLayoutsBy: forced,
    sampleKey: keys[Math.floor(keys.length / 2)] ? keys[Math.floor(keys.length / 2)].layouts : [],
  };
}

// THE AUTOSAVE MOMENT (Fable, 2026-10-13): the page saves AUTOSAVE_MS (2s) after the writer STOPS (each keystroke restarts the
// timer), then the store flushes (300ms) - a whole-page JSON write. Typed as a writer does - a 30-key burst, then a pause - with a
// long-task observer and the storage writes timed: does the save moment hitch, and by how much?
function armSaveWatch() {
  const W = (window.__save = { longTasks: [], setItems: [] });
  try { const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) W.longTasks.push([Math.round(e.startTime), Math.round(e.duration)]); }); po.observe({ entryTypes: ['longtask'] }); W.po = po; } catch { W.noObserver = true; }
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { const a = performance.now(); const r = set.call(this, k, v); W.setItems.push([Math.round(a), Math.round((performance.now() - a) * 10) / 10, k, String(v).length]); return r; };
  W.restore = () => { Storage.prototype.setItem = set; if (W.po) W.po.disconnect(); };
  return true;
}

try {
await withHarness(async (app) => {
  console.log(`bundle ${main.f}: React region lines ${REACT[0] + 1}-${REACT[1]} (react-dom from ${domAt + 1})`);
  const out = { bundle: main.f, reactLines: [REACT[0] + 1, REACT[1]], sizes: [] };
  const invalid = [];   // every measurement the guard refuses - the run FAILS on any of them
  for (const words of [20000, 50000]) {
    const gap = words >= 50000 ? 2200 : 900;
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'prof', text: pageOf(words), createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(800);
    await app.reload();
    await app.evalJs("location.hash = '#/page/prof'");
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page', timeout: 30000 });
    await sleep(1500);
    await app.click('Draft'); await sleep(3000);
    const chars = await app.evalJs(`document.querySelector('${ED}').textContent.length`);
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, acc = 0; const target = Math.floor(ed.textContent.length / 2);
      while ((n = w.nextNode())) { if (acc + n.data.length >= target && !(n.parentElement && n.parentElement.closest('.md-mark-hidden'))) { const r = document.createRange(); r.setStart(n, target - acc); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } acc += n.data.length; } return false; })()`);
    await sleep(gap);
    await app.evalJs(`(${pageInstruments.toString()})()`);

    // 4. the control: no wrappers, no profiler
    for (let i = 0; i < CONTROL_KEYS; i += 1) { await app.typeKeys('a'); await sleep(gap); }
    const control = (await app.evalJs('window.__wz.recs')).slice(WARM);
    // THE KEYSTROKE TRACE (Fable, 2026-10-14): what still lays out per key - before any wrapper or profiler is installed
    const keystrokeTrace = await traceKeys(app, 25, gap, sleep);

    // 1-3. instrumented
    await app.evalJs('window.__wz.recs = []; window.__wz.calls = []; window.__wz.wrap()');
    await app.cdp('Profiler.enable');
    await app.cdp('Profiler.setSamplingInterval', { interval: 100 });
    await app.cdp('Profiler.start');
    const anchor = await app.evalJs('performance.now()');
    for (let i = 0; i < KEYS + WARM; i += 1) { await app.typeKeys('a'); await sleep(gap); }
    const { profile } = await app.cdp('Profiler.stop');
    await app.cdp('Profiler.disable');
    const recs = (await app.evalJs('window.__wz.recs')).slice(WARM);
    const calls = await app.evalJs('window.__wz.calls');
    const typed = await app.evalJs(`document.querySelector('${ED}').textContent.length`);

    // THE AUTOSAVE MOMENT - its OWN phase (Fable, 2026-10-13), BEFORE the layout experiments, with the real editor visible and the
    // caret where the writer left it. A 30-key burst at ~10 keys/s, then a 6-second window from the last key: the page saves
    // AUTOSAVE_MS (2s) after the writer stops, then the store flushes. Every storage write is logged (key, size, when, how long) and
    // the longest stall (long task) is reported. The keys are proved LANDED (the page's text grew) - a burst into nothing is not a
    // measurement.
    const autosave = await (async () => {
      const lenBefore = await app.evalJs(`document.querySelector('${ED}').textContent.length`);
      const focused = await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const a = document.activeElement; return !!ed && (a === ed || ed.contains(a)); })()`);
      await app.evalJs(`(${armSaveWatch.toString()})()`);
      const tStart = await app.evalJs('performance.now()');
      for (let i = 0; i < 30; i += 1) { await app.typeKeys(i % 6 === 5 ? ' ' : 'e'); await sleep(100); }
      const tLast = await app.evalJs('performance.now()');
      await sleep(6000);
      const sv = await app.evalJs('(() => { const W = window.__save; W.restore(); return { longTasks: W.longTasks, setItems: W.setItems, noObserver: !!W.noObserver }; })()');
      const lenAfter = await app.evalJs(`document.querySelector('${ED}').textContent.length`);
      const writes = sv.setItems.filter((s) => s[0] >= tStart).map(([at, ms, key, chars]) => ({ msAfterLastKey: Math.round(at - tLast), key, chars, ms }));
      const after = sv.longTasks.filter((l) => l[0] >= tLast && l[0] <= tLast + 6000);
      const during = sv.longTasks.filter((l) => l[0] >= tStart && l[0] < tLast);
      return { editorFocused: focused, keysLanded: lenAfter - lenBefore, windowMs: 6000, observer: sv.noObserver ? 'unavailable' : 'longtask', writes,
        longestStallAfterLastKeyMs: after.length ? Math.max(...after.map((l) => l[1])) : 0, stallsAfterLastKey: after.map(([at, d]) => ({ msAfterLastKey: Math.round(at - tLast), ms: d })),
        longestStallDuringBurstMs: during.length ? Math.max(...during.map((l) => l[1])) : 0 };
    })();
    console.log(`AUTOSAVE @ ${words} words: keysLanded=${autosave.keysLanded} writes=${autosave.writes.length} ${autosave.writes.map((w) => `[${w.key} ${w.chars}ch ${w.ms}ms @+${w.msAfterLastKey}ms]`).join(' ')} longestStall=${autosave.longestStallAfterLastKeyMs}ms`);

    // per key, the window it owns: keydown to whichever ends last, its paint or its selectionchange work
    const wins = recs.map((r) => [r.t0, Math.max(r.painted ?? r.t0, r.selEnd ?? r.t0) + 2]);
    for (const [i, r] of recs.entries()) {
      const mine = calls.filter(([a]) => a >= wins[i][0] && a <= wins[i][1]);
      const sum = (k, j) => mine.filter((c) => c[1] === k).reduce((x, c) => x + c[j], 0);
      Object.assign(r, { itN: mine.filter((c) => c[1] === 'it').length, itLayout: sum('it', 2), itSerial: sum('it', 3),
        rtN: mine.filter((c) => c[1] === 'rt').length, rtMs: sum('rt', 2), ihN: mine.filter((c) => c[1] === 'ih').length, ihMs: sum('ih', 2) });
    }
    const outside = calls.filter(([a]) => !wins.some(([s, e]) => a >= s && a <= e)).length;
    const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    const parent = new Map();
    for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const owner = new Map();
    const ownerOf = (id) => {
      if (owner.has(id)) return owner.get(id);
      const leaf = byId.get(id).callFrame.functionName;
      let res = null;
      if (leaf === '(garbage collector)') res = 'GC';
      else if (leaf === '(program)') res = '(program): native, outside JS - style/layout/paint';
      else if (leaf === '(idle)') res = 'idle';
      else {
        let inReact = false, inApp = false;
        for (let cur = id; cur !== undefined; cur = parent.get(cur)) {
          const f = byId.get(cur).callFrame;
          const hit = OWNERS.find(([, re]) => re.test(f.functionName));
          if (hit) { res = hit[0]; break; }
          if (f.url && f.url.endsWith(main.f)) {
            if (f.lineNumber >= REACT[0] && f.lineNumber < REACT[1]) inReact = true; else if (!inReact) inApp = true;
          }
        }
        if (!res) res = inReact ? (inApp ? 'React: component render' : 'React: reconcile + commit') : inApp ? 'other app JS' : 'other';
      }
      owner.set(id, res);
      return res;
    };
    const cpu = {};
    let t = anchor * 1000; // microseconds on the page's performance.now clock (anchored at Profiler.start, error ~ one CDP round trip)
    for (let i = 0; i < profile.samples.length; i += 1) {
      t += profile.timeDeltas[i];
      const ms = t / 1000;
      if (!wins.some(([s, e]) => ms >= s && ms <= e)) continue;
      const k = ownerOf(profile.samples[i]);
      cpu[k] = (cpu[k] || 0) + (profile.timeDeltas[i] / 1000);
    }
    const n = recs.length;
    const cpuPerKey = Object.fromEntries(Object.entries(cpu).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, r1(v / n)]));

    const phase = (rs) => ({
      handlers: pct(rs.map((r) => r.inputEnd - r.t0), 0.5),
      toFrame: pct(rs.map((r) => r.raf - r.inputEnd), 0.5),
      frameStyleLayoutPaint: pct(rs.map((r) => r.painted - r.raf), 0.5),
      toFirstPaint: pct(rs.map((r) => r.painted - r.t0), 0.5),
      toFirstPaint_p95: pct(rs.map((r) => r.painted - r.t0), 0.95),
      selectionchange: pct(rs.map((r) => r.selMs), 0.5),
      selectionchangeAfterPaint: rs.filter((r) => r.selEnd !== null && r.selEnd > r.painted).length + '/' + rs.length,
      total: pct(rs.map((r) => Math.max(r.painted, r.selEnd ?? 0) - r.t0), 0.5),
      total_p95: pct(rs.map((r) => Math.max(r.painted, r.selEnd ?? 0) - r.t0), 0.95),
    });
    const med = (f) => pct(recs.map(f), 0.5);
    const shape = await app.evalJs(`(${layoutShape.toString()})()`);
    const row = {
      words, chars, wrappedCallsOutsideKeyWindows: outside, typedOk: typed === chars + CONTROL_KEYS + KEYS + WARM, keys: n,
      control_uninstrumented: phase(control),
      instrumented: phase(recs),
      wrappers_medianPerKey: {
        innerText_reads: med((r) => r.itN), innerText_forcedLayout: med((r) => r.itLayout), innerText_serialise: med((r) => r.itSerial),
        rangeText_reads: med((r) => r.rtN), rangeText: med((r) => r.rtMs),
        innerHTML_writes: med((r) => r.ihN), innerHTML_parse: med((r) => r.ihMs),
      },
      cpu_meanPerKey: cpuPerKey,
      layoutShape: shape,
    };
    // A' as a COMPOSED ESTIMATE, labelled so: the measured DOM path above, plus this run's own CPU shares scaled to what A' keeps -
    // ONE decoration (today: one on input + one compare-build per selectionchange), ONE readEditorPlainText and ONE caret-offset
    // read (today: one per innerText / Range read), and everything else kept whole: React, the caret walks, the 211 rules, undo,
    // GC and other app JS. Keeping the walks whole (some are selectionchange's) makes it an upper bound on those parts.
    {
      const c = (k) => cpu[k] ? cpu[k] / n : 0;
      const builds = 1 + (med((r) => r.selN) || 0);
      const reads = med((r) => r.itN) || 1;
      const rangeReads = med((r) => r.rtN) || 1;
      const parts = {
        domPath: shape.Aprime_domPath.total,
        decorateOnce: c('redecorate: string build') / builds,
        readPlainOnce: c('readEditorPlainText (string)') / reads,
        caretOffsetOnce: (med((r) => r.rtMs) || 0) / rangeReads,
        react: c('React: reconcile + commit') + c('React: component render'),
        kept: c('caret walks') + c('211 rules') + c('undo + em dash') + c('GC') + c('other app JS') + c('strip: marksAt/headingLevelAt'),
      };
      row.aPrime_estimate = { decorationsToday: builds, innerTextReadsToday: reads,
        ...Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, r1(v)])), total: r1(Object.values(parts).reduce((a, b) => a + b, 0)) };
    }
    // VARIANT E (plan step 1) - contain + content-visibility with per-block height estimates; layout, rendered blocks, drift, jump
    row.variantE = await app.evalJs(`(${variantE.toString()})()`);
    // VARIANT F (the row shape) - E's block rows against today's inline-block .md-line shape, on innerText / copy / height identity
    row.variantF = await app.evalJs(`(${variantF.toString()})()`);
    // VARIANT G (Fable, 2026-10-14) - content-visibility on F rows (skipping counted from the browser's own event), inline-size
    // containment, and a strictly contained host: where the remaining per-keystroke layout lives
    row.variantG = await app.evalJs(`(${variantG.toString()})()`);
    row.keystrokeTrace = keystrokeTrace;
    // ---- SUPERSEDED (Fable, 2026-10-13: chat 1's run @ 14032189 saw 0 writes - this ran AFTER variantE, which had hidden the
    // editor and moved the selection, so the burst's keys never reached the page). Kept verbatim, no longer run; the autosave is
    // now its OWN phase, before the layout experiments, with the real editor visible and the keys proved landed (above).
    //   await app.evalJs(`(${armSaveWatch.toString()})()`);
    //   for (let i = 0; i < 30; i += 1) { await app.typeKeys(i % 6 === 5 ? ' ' : 'e'); await sleep(100); }
    //   const tLast = await app.evalJs('performance.now()');
    //   await sleep(3500);
    //   ... row.autosave = { savedMsAfterLastKey, entriesWriteMs, entriesPayloadChars, writes, longestLongTaskAtSaveMs, ... };
    // ------------------------------------------------------------------
    row.autosave = autosave;
    // THE GUARD (Fable, 2026-10-13): a measurement of 0, or the characters-per-line fallback, is not a result - it FAILS the run.
    {
      const e = row.variantE || {};
      const why = [];
      if (e.missing) why.push('variantE: no editor or scroller');
      for (const k of ['blocks', 'lineHeight', 'charsPerLine', 'trueTotalPx', 'estimatedTotalPx', 'renderedBlocksAroundCaret']) if (!(e[k] > 0)) why.push(`variantE.${k}=${e[k]}`);
      if (!(e.oneCharLayout_median > 0)) why.push(`variantE.oneCharLayout_median=${e.oneCharLayout_median}`);
      if (e.charsPerLineFallback) why.push('variantE: the 20-characters-per-line fallback was used (no wrapped row measured)');
      const f = row.variantF || {};
      if (f.missing) why.push('variantF: no editor');
      for (const k of ['E_blockRows', 'F_inlineBlockRows']) {
        const v = f[k] || {};
        if (!(v.rows > 0)) why.push(`variantF.${k}.rows=${v.rows}`);
        if (!(v.oneCharLayout_median > 0)) why.push(`variantF.${k}.oneCharLayout_median=${v.oneCharLayout_median}`);
        if (!(v.heightPx > 0)) why.push(`variantF.${k}.heightPx=${v.heightPx}`);
      }
      if (!((f.today || {}).heightPx > 0)) why.push('variantF: today\'s clone laid out at zero height');
      const g = row.variantG || {};
      if (g.missing) why.push('variantG: no editor or scroller');
      if (!(g.wrappedRowsMeasured > 0)) why.push('variantG: no wrapped row measured (no characters-per-line, so no G1 estimate)');
      if (!(g.G1_contentVisibility && g.G1_contentVisibility.rowsWithState > 0)) why.push('variantG.G1: no row reported a content-visibility state (skipping unmeasured)');
      for (const k of ['G1_contentVisibility', 'G2_inlineSize', 'G3_strictHost']) if (!(g[k] && g[k].oneCharLayout_median > 0)) why.push(`variantG.${k}.oneCharLayout_median=${g[k] && g[k].oneCharLayout_median}`);
      if (!(g.F_containOnly_oneCharLayout > 0)) why.push(`variantG.F_containOnly_oneCharLayout=${g.F_containOnly_oneCharLayout}`);
      const tr = row.keystrokeTrace || {};
      if (!(tr.keys >= 20)) why.push(`keystrokeTrace: ${tr.keys} keys traced (25 typed)`);
      if (!(tr.perKeyMedianMs && tr.perKeyMedianMs.Layout > 0)) why.push('keystrokeTrace: no Layout time in the trace (a category or event-shape problem, not a result)');
      if (!(autosave.keysLanded > 0)) why.push(`autosave: the burst's keys did not land (keysLanded=${autosave.keysLanded})`);
      if (!(autosave.writes.length > 0)) why.push('autosave: no storage write in the 6s window');
      if (why.length) { row.INVALID = why; invalid.push(`${words} words: ${why.join('; ')}`); }
    }
    out.sizes.push(row);
    console.log(JSON.stringify(row, null, 2));
  }
  const dir = join(here, '..', '..', '..', 'docs', 'evidence', 'latency');
  mkdirSync(dir, { recursive: true });
  out.invalid = invalid;
  writeFileSync(join(dir, 'profile.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('\nTYPING LATENCY PROFILE written to docs/evidence/latency/profile.json');
  if (invalid.length) {
    console.log(`\nTYPING LATENCY PROFILE: INVALID - ${invalid.length} measurement(s) refused:\n  ${invalid.join('\n  ')}`);
    process.exitCode = 1;
  } else console.log('\nTYPING LATENCY PROFILE: VALID - no zero measurement, no characters-per-line fallback, the autosave keys landed and wrote');
}, { verifyRows: false });   // the shadow-vs-DOM check reads the whole page per render; it is not part of a writer's keystroke
} finally {
  if (BUILD) execSync('pnpm build:web', { cwd: join(here, '..'), stdio: 'pipe' });   // back to the normal (minified) build
}

