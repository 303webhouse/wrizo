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
import { withHarness } from './runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, '..', 'dist-web', 'assets');
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
  ['211 rules', /^(snapCaret|stepLeft|stepRight|backspaceAt|deleteAt|replaceRange|nativeRange|enterAt|reabsorb|closersAt|lineAt|allRuns)(\$\d+)?$/],
  ['undo + em dash', /^(record|classifyEditKind|findEmDashTrigger|applyEmDash)(\$\d+)?$/],
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
  const html = el.innerHTML;
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

await withHarness(async (app) => {
  console.log(`bundle ${main.f}: React region lines ${REACT[0] + 1}-${REACT[1]} (react-dom from ${domAt + 1})`);
  const out = { bundle: main.f, reactLines: [REACT[0] + 1, REACT[1]], sizes: [] };
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
    out.sizes.push(row);
    console.log(JSON.stringify(row, null, 2));
  }
  const dir = join(here, '..', '..', '..', 'docs', 'evidence', 'latency');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'profile.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('\nTYPING LATENCY PROFILE written to docs/evidence/latency/profile.json');
});
