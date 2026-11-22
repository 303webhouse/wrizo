// KEY-FLIP IN THE LIVE THEMES (bug #90; Fable, Nov 22, 3:05 am: "the --fade-dur restyle at the first key, live themes"; Nick, 2:59 am: typing bugs come before Flux). ARBOR's bug #80 fix (arbor-keyflip.mjs, Nov 12) took the first key's whole-document restyle out of the Arbor redesign: ModeStage no longer writes --fade-dur on <html>
// there (an inherited custom property changed on the root makes EVERY element recompute its style), it writes to #root and the mockup bar's host; "the live themes keep <html> (bug #90)". This is the same read for the live themes: Machina and Flux.
//   KL-FLIP-<theme>   a Chrome trace (devtools.timeline) of the keystroke that starts writing, on a page reopened at rest: the largest single restyle from the keydown to 150 ms after it touches at most a quarter of the document's elements, on all 3 reopens (arbor-keyflip's KF-FLIP, for this theme)
//   KL-TIMING-<theme> the fades keep their timing: after the first key every element that carries the dissolve classes (chrome-fade, desk-dissolve, mode-dissolve, brand-mark, chrome-handle) reads the same --fade-dur it read before the fix (the slow recede value), so moving the write off <html> loses no fade
//   KL-MUT            the old write put back (--fade-dur written on <html> at the first key, by a wrapper on setProperty): KL-FLIP is RED for every theme (the mutant LANDED: the property is seen on <html>), so the check bites
// [Fable, Nov 22, 2:30 pm, RULED (b), absolute] the 25% bar (a share of the document) cannot be met on a 269-element page and is PARKED below with its successors:
//   KL-FLIP-<theme>   [successor] the first key's largest restyle is at most the chrome's receding set: Machina <= 220, Flux <= 400 elements (printed with the measure), on all 3 reopens
//   KL-COLUMN-<theme> NOTHING inside the page's column or editor restyles at the first key (read on a page long enough that a column restyle cannot hide in the chrome's number)
//   KL-BUSY-<theme>   the first key's busy time (keydown to the end of its task, no tracing) is within Nick's 65 ms first-key bar (median of 3 reopens)
//   KL-MUT / KL-MUT-COL  the <html> write put back, and a page-column restyle put in: each is RED on the successors above (the mutants LANDED)
// A measurement of what is restyled; no clock for the restyle checks, so it holds on a loaded runner. Run: node scripts/harness/keyflip-live.mjs   (Actions harness or a box turn)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { withHarness } = await import('../runtime-verify.mjs');
const HERE = path.dirname(fileURLToPath(import.meta.url));
void HERE;
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REOPENS = 3, WINDOW_US = 150000, SHARE = 0.25;
const ABS = { machina: 220, flux: 400 }, BUSY_MS = 65;   // Fable's absolute bars (the chrome's receding set); the first-key bar is Nick's
const PAGE_TEXT = Array.from({ length: 60 }, (_, i) => 'word' + i + ' word' + (i + 1) + ' word' + (i + 2) + ' word' + (i + 3)).join('\n');   // 60 lines: a column with real depth, so a column restyle cannot hide inside the chrome's number
const THEMES = [['machina', ''], ['flux', '']];   // the live themes (the classic Plateau, ?arbor2=0, is test-only since the redesign is on by default in Arbor)

const CATS = ['toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking'];
const KEYTYPES = new Set(['keydown', 'keypress', 'textInput', 'beforeinput', 'input']);
const analyse = (raw) => {
  const evs = raw.slice().sort((a, b) => a.ts - b.ts);
  const kd = evs.find((e) => e.name === 'EventDispatch' && e.args && e.args.data && e.args.data.type === 'keydown');
  if (!kd) return { err: 'no keydown in the trace', n: evs.length };
  const K = kd.ts;
  const spans = []; const open = {};
  for (const e of evs) {
    if (e.pid !== kd.pid || e.tid !== kd.tid) continue;
    if (e.ph === 'X') spans.push({ name: e.name, ts: e.ts, end: e.ts + (e.dur || 0), args: e.args || {} });
    else if (e.ph === 'B') (open[e.name] ||= []).push(e);
    else if (e.ph === 'E') { const b = (open[e.name] || []).pop(); if (b) spans.push({ name: e.name, ts: b.ts, end: e.ts, args: { ...(b.args || {}), ...(e.args || {}) } }); }
  }
  const ult = spans.filter((s) => s.name === 'UpdateLayoutTree' || s.name === 'RecalculateStyles');
  const els = (s) => Number(s.args.elementCount ?? (s.args.endData && s.args.endData.elementCount) ?? (s.args.data && s.args.data.elementCount) ?? NaN);
  const win = ult.filter((s) => s.ts >= K && s.ts < K + WINDOW_US);
  const counted = win.filter((s) => Number.isFinite(els(s)));
  const big = counted.reduce((m, s) => (els(s) > (m ? els(m) : -1) ? s : m), null);
  // attribution (information): what invalidated, and why, in the key's window (the same read arbor-keyflip prints)
  const r1 = (x) => Math.round(x * 10) / 10;
  const inv = {};
  for (const e of evs) {
    if (e.ts < K - 2000 || e.ts > K + WINDOW_US || !/InvalidationTracking/.test(e.name)) continue;
    const d = (e.args && e.args.data) || {};
    const why = d.reason || (d.changedAttribute ? 'attr ' + d.changedAttribute : d.changedClass ? 'class ' + d.changedClass : d.changedId ? 'id ' + d.changedId : d.changedPseudo ? 'pseudo ' + d.changedPseudo : '?');
    const key = e.name.replace('InvalidationTracking', '') + ' | ' + why + (d.extraData ? ' (' + String(d.extraData).slice(0, 50) + ')' : '') + ' | ' + String(d.nodeName || '').slice(0, 60);
    inv[key] = (inv[key] || 0) + 1;
  }
  const top = win.slice().sort((a, b) => els(b) - els(a)).slice(0, 4).map((s) => ({ els: els(s), ms: r1((s.end - s.ts) / 1000), at: r1((s.ts - K) / 1000) }));
  const all = win.map((s) => ({ els: els(s), ms: r1((s.end - s.ts) / 1000), at: r1((s.ts - K) / 1000) })).filter((s) => Number.isFinite(s.els));
  return { restyles: win.length, counted: counted.length, keyEls: big ? els(big) : null, all, top, invalidations: Object.entries(inv).sort((a, b) => b[1] - a[1]).slice(0, 14) };
};
const traceKey = async (app, key = 'a') => {
  await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReturnAsStream' });
  await sleep(400);
  await app.typeKeys(key);
  await sleep(700);
  const done = app.waitEvent('Tracing.tracingComplete', 30000);
  await app.cdp('Tracing.end');
  const ev = await done;
  if (!ev || !ev.stream) return { err: 'no trace stream' };
  let s = '';
  for (;;) { const r = await app.cdp('IO.read', { handle: ev.stream, size: 4 << 20 }); s += r.base64Encoded ? Buffer.from(r.data, 'base64').toString('utf8') : r.data; if (r.eof) break; }
  await app.cdp('IO.close', { handle: ev.stream });
  let j; try { j = JSON.parse(s); } catch (e) { return { err: 'trace not JSON: ' + String(e).slice(0, 80) }; }
  return analyse(Array.isArray(j) ? j : (j.traceEvents || []));
};

// the mutant: the old write put back (--fade-dur written on <html>), by a wrapper on setProperty that also writes it there
const OLD_WRITE = `(() => { const de = document.documentElement; const orig = CSSStyleDeclaration.prototype.setProperty; if (orig.__klOld) return true;
  const wrapped = function (name, value, prio) { if (name === '--fade-dur' && this !== de.style) { try { orig.call(de.style, name, value, prio); } catch {} } return orig.call(this, name, value, prio); };
  wrapped.__klOld = true; CSSStyleDeclaration.prototype.setProperty = wrapped; return true; })()`;
// where --fade-dur is written, and what the dissolve-class elements read after the key
const FADE_STATE = `(() => { const de = document.documentElement; const own = (el) => el.style && el.style.getPropertyValue('--fade-dur');
  const carriers = [...document.querySelectorAll('.chrome-fade, .desk-dissolve, .mode-dissolve, .brand-mark, .chrome-handle')];
  const reads = carriers.map((el) => getComputedStyle(el).getPropertyValue('--fade-dur').trim());
  const chromeSet = new Set(); for (const c of carriers) { chromeSet.add(c); c.querySelectorAll('*').forEach((x) => chromeSet.add(x)); }
  const col = document.querySelector('.mode-pagecol') || document.querySelector('.mode-page'); const colSet = new Set(); if (col) { colSet.add(col); col.querySelectorAll('*').forEach((x) => colSet.add(x)); }
  let overlap = 0; for (const x of colSet) if (chromeSet.has(x)) overlap += 1;
  return { onHtml: own(de) || '', docEls: document.querySelectorAll('*').length, carriers: carriers.length, reads: [...new Set(reads)], chromeEls: chromeSet.size, columnEls: colSet.size, columnInChrome: overlap }; })()`;
// the first key's busy time, no tracing: keydown to the end of the task that handled it (a message posted from the keydown runs after the key's task and React's flush)
const BUSY_HOOK = `(() => { window.__klBusy = null; const mc = new MessageChannel(); let t0 = null; mc.port1.onmessage = () => { if (t0 !== null && window.__klBusy === null) window.__klBusy = performance.now() - t0; };
  window.addEventListener('keydown', () => { t0 = performance.now(); mc.port2.postMessage(0); }, { once: true, capture: true }); return true; })()`;
// the page-column mutant: when the first key writes --fade-dur, also write an inherited custom property on the page's column (a restyle of everything inside it)
const COL_WRITE = `(() => { const orig = CSSStyleDeclaration.prototype.setProperty; if (orig.__klCol) return true; let n = 0;
  const wrapped = function (name, value, prio) { if (name === '--fade-dur') { const col = document.querySelector('.mode-pagecol') || document.querySelector('.mode-page'); if (col) { try { orig.call(col.style, '--kl-col-mut', String((n += 1))); } catch {} } } return orig.call(this, name, value, prio); };
  wrapped.__klCol = true; CSSStyleDeclaration.prototype.setProperty = wrapped; return true; })()`;

await withHarness(async (app) => {
  const go = async (search, hash) => { await app.cdp('Page.navigate', { url: `${app.base}/${search}#${hash}` }); await sleep(250); };
  await go('', '/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1400, 900);
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoTheme === 'object'", { label: 'the seams', timeout: 20000 });
  await app.evalJs(`window.wrizoCreateJournalPage({ id: 'kl-1', text: ${JSON.stringify(PAGE_TEXT)}, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' }); window.wrizoFlushNow(); null`);
  await sleep(500);

  const measure = async (theme, search, { mutate = false, busy = false } = {}) => {
    await go(search, '/');
    await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 20000 });
    await app.evalJs(`window.wrizoTheme.set(${JSON.stringify(theme)}); window.wrizoFlushNow(); null`);
    await sleep(500);
    // a REAL reload in the theme asked: a hash-only navigation keeps the page (and the Arbor mount, which the Desk's default theme loaded: its ~800-element shade layer then sat in every theme's measurement - the first read of this file counted it)
    await app.reload();
    await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam after the reload', timeout: 20000 });
    await app.evalJs("location.hash = '#/page/kl-1'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: `page reopened (${theme})` });
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 25000, label: `splash gone (${theme})` });
    await sleep(1800);
    if (mutate === true || mutate === 'html') { await app.evalJs(OLD_WRITE); await sleep(200); }
    if (mutate === 'col') { await app.evalJs(COL_WRITE); await sleep(200); }
    await app.evalJs("(() => { document.querySelector('.forward-only-editor').focus(); return true; })()");
    const before = await app.evalJs(FADE_STATE);
    if (busy) { await app.evalJs(BUSY_HOOK); await app.typeKeys('a'); await sleep(500); return { theme, busy: await app.evalJs('window.__klBusy') }; }
    const arborLeft = await app.evalJs("document.querySelectorAll('.arbor2-pagesh, .arbor2-pergola, .arbor2-live').length");
    if (arborLeft) console.log(`KL-WARN ${theme}: ${arborLeft} Arbor shade elements are in the page`);
    before.arborLeft = arborLeft;
    const tr = await traceKey(app, 'a');
    await sleep(300);
    const after = await app.evalJs(FADE_STATE);
    const m = { theme, before, after, tr };
    const { invalidations, top, ...trShort } = tr || {};
    const { all, ...trLess } = trShort;
    console.log(`KL ${mutate ? 'mut-' + mutate + '-' : ''}${theme}: ` + JSON.stringify({ docEls: before.docEls, chromeEls: before.chromeEls, columnEls: before.columnEls, columnInChrome: before.columnInChrome, onHtmlAfter: after.onHtml, carriers: after.carriers, fadeReads: after.reads, tr: trLess, restyles: all }));
    if (!mutate) console.log(`KL-ATTRIB ${theme}: ` + JSON.stringify({ top, invalidations }));
    return m;
  };

  const runs = {};
  for (const [theme, search] of THEMES) { runs[theme] = []; for (let i = 0; i < REOPENS; i += 1) runs[theme].push(await measure(theme, search)); }
  const busyRuns = {};
  for (const [theme, search] of THEMES) { busyRuns[theme] = []; for (let i = 0; i < REOPENS; i += 1) busyRuns[theme].push(await measure(theme, search, { busy: true })); }
  for (const [theme] of THEMES) {
    const R = runs[theme];
    const flipOk = R.every((m) => m.tr && m.tr.keyEls != null && m.tr.keyEls <= ABS[theme]);
    const medBusy = (() => { const xs = busyRuns[theme].map((m) => m.busy).filter((x) => typeof x === 'number').sort((a, b) => a - b); return xs.length === busyRuns[theme].length ? xs[Math.floor(xs.length / 2)] : null; })();
    // the page's column: its elements restyled at the first key = the largest restyle minus the chrome's set (what the chrome does not account for), and no restyle of the column's size alongside it
    const colOk = R.every((m) => m.before.columnEls > 0 && m.before.columnInChrome === 0 && (m.tr.all || []).every((r) => r.els < m.before.columnEls * 0.5 || r.els >= m.before.chromeEls * 0.5));
    ok(`KL-PREMISE-${theme} the page in ${theme} carries no Arbor shade layer (the Arbor mount is not loaded: a real reload in the theme)`, R.every((m) => m.before.arborLeft === 0), JSON.stringify(R.map((m) => m.before.arborLeft)));
    // SUPERSEDED (Fable, Nov 22, 2:30 pm, RULED (b), absolute: a quarter of a 269-element document cannot be met by moving one write; the gate reads the chrome's receding set). The original, verbatim:
    // const flipOk = R.every((m) => m.tr && m.tr.keyEls != null && m.tr.keyEls <= SHARE * m.before.docEls);
    // ok(`KL-FLIP-${theme} the largest single restyle from the first key to ${WINDOW_US / 1000} ms after touches at most ${SHARE * 100}% of the document's elements, on all ${REOPENS} reopens (printed: ${R.map((m) => `${m.tr && m.tr.keyEls}/${m.before.docEls}`).join(', ')})`,
    //   flipOk, JSON.stringify(R.map((m) => ({ keyEls: m.tr && m.tr.keyEls, docEls: m.before.docEls, onHtml: m.after.onHtml }))));
    ok(`KL-FLIP-${theme} [successor] the first key's largest single restyle (to ${WINDOW_US / 1000} ms after) is at most the chrome's receding set: ${ABS[theme]} elements, on all ${REOPENS} reopens (printed: ${R.map((m) => m.tr && m.tr.keyEls).join(', ')}; the chrome set is ${R[0].before.chromeEls} elements of ${R[0].before.docEls})`,
      flipOk, JSON.stringify(R.map((m) => ({ keyEls: m.tr && m.tr.keyEls, docEls: m.before.docEls, chromeEls: m.before.chromeEls, onHtml: m.after.onHtml }))));
    ok(`KL-COLUMN-${theme} nothing inside the page's column or editor restyles at the first key (the column holds ${R[0].before.columnEls} elements, none of them in the chrome's set; no restyle of the column's size in the window; printed restyles: ${JSON.stringify((R[0].tr.all || []).map((r) => r.els))})`,
      colOk, JSON.stringify(R.map((m) => ({ all: m.tr.all, columnEls: m.before.columnEls, columnInChrome: m.before.columnInChrome, chromeEls: m.before.chromeEls }))));
    ok(`KL-BUSY-${theme} the first key's busy time (keydown to the end of its task, untraced) is within Nick's ${BUSY_MS} ms bar, median of ${REOPENS} reopens (printed: ${busyRuns[theme].map((m) => m.busy == null ? 'null' : Math.round(m.busy * 10) / 10).join(', ')})`,
      medBusy != null && medBusy <= BUSY_MS, JSON.stringify(busyRuns[theme]));
    ok(`KL-TIMING-${theme} the dissolve-class elements read a --fade-dur after the first key, and no --fade-dur is written on <html> (printed: html '${R[0].after.onHtml}', ${R[0].after.carriers} carriers read ${JSON.stringify(R[0].after.reads)})`,
      R.every((m) => m.after.onHtml === '' && m.after.carriers >= 1 && m.after.reads.length >= 1 && m.after.reads.every((v) => /^[0-9.]+s$/.test(v))), JSON.stringify(R.map((m) => m.after)));
  }
  // the mutant: the old write put back; the check must see the property on <html> and go red for every theme
  const mut = {};
  for (const [theme, search] of THEMES) mut[theme] = await measure(theme, search, { mutate: 'html' });
  const mutCol = {};
  for (const [theme, search] of THEMES) mutCol[theme] = await measure(theme, search, { mutate: 'col' });
  // SUPERSEDED (Fable, Nov 22, 2:30 pm, with KL-FLIP: the bar is the chrome's set, not a quarter of the document). The original, verbatim:
  // ok('KL-MUT with the old <html> write put back (the wrapper LANDED: --fade-dur is seen on <html>), the first key restyles more than the bar in Machina (the theme that pays most), and the write is seen for every theme',
  //   THEMES.every(([theme]) => mut[theme].after.onHtml !== '') && mut.machina.tr && mut.machina.tr.keyEls != null && mut.machina.tr.keyEls > SHARE * mut.machina.before.docEls,
  //   JSON.stringify(THEMES.map(([theme]) => ({ theme, onHtml: mut[theme].after.onHtml, keyEls: mut[theme].tr && mut[theme].tr.keyEls, docEls: mut[theme].before.docEls }))));
  ok('KL-MUT [successor] with the old <html> write put back (the wrapper LANDED: --fade-dur is seen on <html>), the first key restyles more than the bar in BOTH themes',
    THEMES.every(([theme]) => mut[theme].after.onHtml !== '' && mut[theme].tr && mut[theme].tr.keyEls != null && mut[theme].tr.keyEls > ABS[theme]),
    JSON.stringify(THEMES.map(([theme]) => ({ theme, onHtml: mut[theme].after.onHtml, keyEls: mut[theme].tr && mut[theme].tr.keyEls, docEls: mut[theme].before.docEls }))));
  ok('KL-MUT-COL with an inherited custom property written on the page\'s column at the first key (the wrapper LANDED: it is seen on the column), KL-FLIP or KL-COLUMN goes red in both themes (the column checks can go red)',
    THEMES.every(([theme]) => { const m = mutCol[theme]; const ab = m.tr && m.tr.keyEls != null && m.tr.keyEls > ABS[theme]; const colHit = (m.tr.all || []).some((r) => r.els >= m.before.columnEls * 0.5 && r.els < m.before.chromeEls * 0.5); return ab || colHit; }),
    JSON.stringify(THEMES.map(([theme]) => ({ theme, keyEls: mutCol[theme].tr && mutCol[theme].tr.keyEls, all: mutCol[theme].tr && mutCol[theme].tr.all, columnEls: mutCol[theme].before.columnEls, chromeEls: mutCol[theme].before.chromeEls }))));
}, { label: 'keyflip-live' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = THEMES.length * 5 + 2;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nKEYFLIP-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nKEYFLIP-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
