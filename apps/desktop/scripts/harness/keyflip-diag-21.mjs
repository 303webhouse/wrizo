// THROWAWAY probe for #141 (never rides): keyflip-live's read, with what was waiting before the key
// KEY-FLIP IN THE LIVE THEMES (bug #90; Fable, Nov 22, 3:05 am: "the --fade-dur restyle at the first key, live themes"; Nick, 2:59 am: typing bugs come before Flux). ARBOR's bug #80 fix (arbor-keyflip.mjs, Nov 12) took the first key's whole-document restyle out of the Arbor redesign: ModeStage no longer writes --fade-dur on <html>
// there (an inherited custom property changed on the root makes EVERY element recompute its style), it writes to #root and the mockup bar's host; "the live themes keep <html> (bug #90)". This is the same read for the live themes: Machina and Flux.
//   KL-FLIP-<theme>   a Chrome trace (devtools.timeline) of the keystroke that starts writing, on a page reopened at rest: the largest single restyle from the keydown to 150 ms after it touches at most a quarter of the document's elements, on all 3 reopens (arbor-keyflip's KF-FLIP, for this theme)
//   KL-TIMING-<theme> the fades keep their timing: after the first key every element that carries the dissolve classes (chrome-fade, desk-dissolve, mode-dissolve, brand-mark, chrome-handle) reads the same --fade-dur it read before the fix (the slow recede value), so moving the write off <html> loses no fade
//   KL-MUT            the old write put back (--fade-dur written on <html> at the first key, by a wrapper on setProperty): KL-FLIP is RED for every theme (the mutant LANDED: the property is seen on <html>), so the check bites
// [Fable, Nov 22, 2:30 pm, RULED (b), absolute] the 25% bar (a share of the document) cannot be met on a 269-element page and is PARKED below with its successors:
//   KL-FLIP-<theme>   [successor] the first key's largest restyle is at most the chrome's receding set: Machina <= 220, Flux <= 400 elements (printed with the measure), on all 3 reopens
//   KL-COLUMN-<theme> NOTHING inside the page's column or editor restyles at the first key (read by CAUSE: a MutationObserver on the column, inside it and on its ancestors; the chrome's restyle swallows a count)
//   KL-BUSY-<theme>   the first key's busy time (keydown to the end of its task, no tracing) is within Nick's 65 ms first-key bar (median of 3 reopens)
//   KL-MUT / KL-MUT-COL  the <html> write put back, and a page-column restyle put in: each is RED on the successors above (the mutants LANDED)
//   KL-REACH-flux     Flux's --fade-dur sits on the elements that read it (useChromeDissolve.ts; Fable, Nov 23, 2:30 pm): after the first key, EVERY element styled by a rule that reads var(--fade-dur) carries the recede's value
//   KL-REACH-MUT      a reader the rule does not name reads no value, and KL-REACH's read goes red on it (the mutant LANDED)
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
const PAGE_TEXT = 'word0 word1 word2 word3 word4 word5 word6';   // the page the bars were measured on (Machina 210, Flux 387: Fable's 220 and 400); a longer page adds rows to the restyle and moves the printed numbers   // 60 lines: a column with real depth, so a column restyle cannot hide inside the chrome's number
// flux-keyflip-reorg.mjs (the Flux live join, Fable, Nov 23) runs this file on Flux alone, with the driver's reorg pin lifted
const FLUX_REORG = process.env.WS_KL_FLUX_REORG === '1';
// [the Flux pin, Fable Nov 23 2:30 pm: FLUX3 is on by default, so "off" must be asked with ?flux3=0] was: const THEMES = FLUX_REORG ? [['flux', '']] : [['machina', ''], ['flux', '']];   // the live themes (the classic Plateau, ?arbor2=0, is test-only since the redesign is on by default in Arbor)
const THEMES = FLUX_REORG ? [['flux', '']] : [['machina', ''], ['flux', '?flux3=0']];   // the live themes (the classic Plateau, ?arbor2=0, is test-only since the redesign is on by default in Arbor)

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
  const start = evs.length ? evs[0].ts : K;
  const pre = ult.filter((s) => s.ts < K).map((s) => ({ els: els(s), at: r1((s.ts - K) / 1000) }));
  const lastFlush = ult.filter((s) => s.ts < K).reduce((m, s) => Math.max(m, s.end), start);
  const pending = {};   // invalidations after the last restyle before the key: still waiting when the key lands
  for (const e of evs) { if (e.ts <= lastFlush || e.ts > K || !/InvalidationTracking/.test(e.name)) continue; const d = (e.args && e.args.data) || {}; const k = e.name.replace('InvalidationTracking', '') + ' | ' + (d.reason || d.changedClass || d.changedAttribute || d.changedPseudo || '?') + ' | ' + String(d.nodeName || '').slice(0, 50); pending[k] = (pending[k] || 0) + 1; }
  const ids = new Set(); for (const e of evs) { if (e.ts < K - 2000 || !big || e.ts > big.end || !/InvalidationTracking/.test(e.name)) continue; const d = (e.args && e.args.data) || {}; if (d.nodeId) ids.add(d.nodeId); }
  const full = {}; for (const e of evs) { if (e.ts < start || !big || e.ts > big.end || !/InvalidationTracking/.test(e.name)) continue; const d = (e.args && e.args.data) || {}; if (e.ts <= lastFlush) continue; const k = e.name.replace('InvalidationTracking', '') + '|' + (d.reason || d.changedAttribute || d.changedClass || d.changedPseudo || '?') + (d.extraData ? '(' + String(d.extraData).slice(0, 30) + ')' : '') + '|' + String(d.nodeName || '').slice(0, 44); full[k] = (full[k] || 0) + 1; }
  return { full: Object.entries(full), pre: pre.slice(-6), pending: Object.entries(pending).slice(0, 12), invalidated: ids.size, restyles: win.length, counted: counted.length, keyEls: big ? els(big) : null, all, top, invalidations: Object.entries(inv).sort((a, b) => b[1] - a[1]).slice(0, 14) };
};
const traceKey = async (app, key = 'a', flush = false) => {
  await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReturnAsStream' });
  await sleep(400);
  if (flush) { await app.evalJs('(() => { for (const e of document.querySelectorAll("*")) getComputedStyle(e).color; return true; })()'); }
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
// every element a rule that READS var(--fade-dur) styles, and the value it carries (a rule's pseudo-elements are read on their element)
const FADE_REACH = `(() => { const els = new Set(); const walk = (list) => { for (const r of list) { if (r.selectorText !== undefined) { if (r.style && r.style.cssText.includes('var(--fade-dur')) { try { document.querySelectorAll(r.selectorText.replace(/::?(before|after|first-line)/g, '')).forEach((e) => els.add(e)); } catch {} } } if (r.cssRules) walk(r.cssRules); } }; for (const s of document.styleSheets) { try { walk(s.cssRules); } catch {} }
  const name = (e) => e.tagName.toLowerCase() + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className || '').trim().split(/\\s+/).slice(0, 2).join('.'); const values = {}, bad = []; for (const e of els) { const v = getComputedStyle(e).getPropertyValue('--fade-dur').trim(); values[v || 'none'] = (values[v || 'none'] || 0) + 1; if (!/^[0-9.]+s$/.test(v)) bad.push(name(e)); } return { n: els.size, values, bad: [...new Set(bad)].slice(0, 12) }; })()`;
// the first key's busy time, no tracing: keydown to the end of the task that handled it (a message posted from the keydown runs after the key's task and React's flush)
const BUSY_HOOK = `(() => { window.__klBusy = null; const mc = new MessageChannel(); let t0 = null; mc.port1.onmessage = () => { if (t0 !== null && window.__klBusy === null) window.__klBusy = performance.now() - t0; };
  window.addEventListener('keydown', () => { t0 = performance.now(); mc.port2.postMessage(0); }, { once: true, capture: true }); return true; })()`;
// the page-column mutant: when the first key writes --fade-dur, also write an inherited custom property on the page's column (a restyle of everything inside it)
const COL_WRITE = `(() => { const orig = CSSStyleDeclaration.prototype.setProperty; if (orig.__klCol) return true; let n = 0;
  const wrapped = function (name, value, prio) { if (name === '--fade-dur') { const col = document.querySelector('.mode-pagecol') || document.querySelector('.mode-page'); if (col) { try { orig.call(col.style, '--kl-col-mut', String((n += 1))); } catch {} } } return orig.call(this, name, value, prio); };
  wrapped.__klCol = true; CSSStyleDeclaration.prototype.setProperty = wrapped; return true; })()`;

// what the first key changes on the page's column, inside it, and on every ancestor of it below <html> (an attribute whose value really changed: a style, a class, a data-*). An inherited custom property or a class on any of
// these restyles the column; this reads the CAUSE, which a count of restyled elements cannot (the column is a few dozen elements, and the chrome's restyle swallows the number)
const COL_OBS = `(() => { window.__klMut = []; const col = document.querySelector('.mode-pagecol') || document.querySelector('.mode-page'); if (!col) return false;
  const chain = []; for (let n = col.parentElement; n && n !== document.documentElement; n = n.parentElement) chain.push(n);
  const MO = new MutationObserver((rs) => { for (const r of rs) { const t = r.target; const where = t === col ? 'column' : col.contains(t) ? 'inside' : chain.includes(t) ? 'ancestor' : null; if (!where) continue;
    const now = String(t.getAttribute(r.attributeName) || ''); const old = String(r.oldValue || ''); if (now === old) continue;
    window.__klMut.push({ where, el: t.tagName.toLowerCase() + '.' + String(t.className && t.className.baseVal !== undefined ? t.className.baseVal : t.className).slice(0, 40), attr: r.attributeName, old: old.slice(0, 200), now: now.slice(0, 200) }); } });
  MO.observe(document.body, { attributes: true, attributeOldValue: true, subtree: true }); window.__klMO = MO; return true; })()`;

await withHarness(async (app) => {
  const go =async (search, hash) => { await app.cdp('Page.navigate', { url: `${app.base}/${search}#${hash}` }); await sleep(250); };
  await go('', '/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1400, 900);
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoTheme === 'object'", { label: 'the seams', timeout: 20000 });
  await app.evalJs(`window.wrizoCreateJournalPage({ id: 'kl-1', text: ${JSON.stringify(PAGE_TEXT)}, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' }); window.wrizoFlushNow(); null`);
  await sleep(500);

  const measure = async (theme, search, { mutate = false, busy = false, flush = false } = {}) => {
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
    await app.evalJs(COL_OBS);
    const state = await app.evalJs(`({ anims: document.getAnimations().filter((a) => a.playState !== 'finished').map((a) => (a.animationName || a.transitionProperty || 'script') + '@' + String(a.effect && a.effect.target && (a.effect.target.className.baseVal ?? a.effect.target.className)).split(' ')[0] + ':' + a.playState), sheets: document.styleSheets.length, fonts: document.fonts.status, now: new Date().toString().slice(0, 33), roots: [document.documentElement, document.body, document.getElementById('root')].map((e) => [...e.attributes].map((a) => a.name + '=' + a.value.slice(0, 80)).join(' ')), store: Object.keys(localStorage).sort().map((k) => k + '=' + String(localStorage.getItem(k)).slice(0, 90)), els: document.querySelectorAll('*').length, hidden: [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).display === 'none').length, focus: String(document.activeElement && document.activeElement.className).slice(0, 40) })`);
    const tr = await traceKey(app, 'a', flush);
    await sleep(300);
    const after = await app.evalJs(FADE_STATE);
    const reach = theme === 'flux' ? await app.evalJs(FADE_REACH) : null;
    const colMut = (await app.evalJs('window.__klMut || null')) || [];
    const m = { theme, before, after, tr, colMut, reach, state };
    console.log(`KL-COLMUT ${mutate ? 'mut-' + mutate + '-' : ''}${theme}: ` + JSON.stringify(colMut));
    const { invalidations, top, ...trShort } = tr || {};
    const { all, ...trLess } = trShort;
    console.log(`KL ${mutate ? 'mut-' + mutate + '-' : ''}${theme}: ` + JSON.stringify({ docEls: before.docEls, chromeEls: before.chromeEls, columnEls: before.columnEls, columnInChrome: before.columnInChrome, onHtmlAfter: after.onHtml, carriers: after.carriers, fadeReads: after.reads, tr: trLess, restyles: all }));
    if (!mutate) console.log(`KL-ATTRIB ${theme}: ` + JSON.stringify({ top, invalidations }));
    return m;
  };

  for (let i = 0; i < 2; i += 1) {
    for (const flush of [false]) {
      const m = await measure('machina', '', { flush });
      const t = m.tr || {};
      console.log(`DIAG ${flush ? 'flushed' : 'plain  '} ${i} keyEls=${t.keyEls} invalidated=${t.invalidated} ` + JSON.stringify({ pre: t.pre, pending: t.pending, state: m.state, restyles: (t.all || []).slice(0, 8).map((x) => [x.els, x.at]) }));
      if (i === 0 || t.keyEls > 220) console.log(`DIAGFULL ${t.keyEls} ` + JSON.stringify({ full: t.full, roots: m.state.roots, store: m.state.store, now: m.state.now }));
      ok(`DIAG ${flush ? 'flushed' : 'plain'} ${i} reads at most 220 (${t.keyEls})`, t.keyEls != null && t.keyEls <= 220, '');
    }
  }
});
const bad = checks.filter((c) => !c.pass).length;
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nKEYFLIP-DIAG PARKED: PASS (0 records)');
console.log(bad ? `\nKEYFLIP-DIAG VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nKEYFLIP-DIAG VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
