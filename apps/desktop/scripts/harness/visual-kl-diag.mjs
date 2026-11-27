// A DIAGNOSTIC, not a check and never merged: what makes the first key's restyle grow with the INK tab (keyflip-live, L12's pair 45904509397). It always "fails", so its numbers reach the run's log.
// It reuses keyflip-live's own trace reader, Machina only, and takes rules out of the live page's stylesheets, one group at a time.
const { withHarness } = await import('../runtime-verify.mjs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WINDOW_US = 150000;
const PAGE_TEXT = 'word0 word1 word2 word3 word4 word5 word6';
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

const FADE_STATE = `(() => { const de = document.documentElement; const own = (el) => el.style && el.style.getPropertyValue('--fade-dur');
  const carriers = [...document.querySelectorAll('.chrome-fade, .desk-dissolve, .mode-dissolve, .brand-mark, .chrome-handle')];
  const reads = carriers.map((el) => getComputedStyle(el).getPropertyValue('--fade-dur').trim());
  const chromeSet = new Set(); for (const c of carriers) { chromeSet.add(c); c.querySelectorAll('*').forEach((x) => chromeSet.add(x)); }
  const col = document.querySelector('.mode-pagecol') || document.querySelector('.mode-page'); const colSet = new Set(); if (col) { colSet.add(col); col.querySelectorAll('*').forEach((x) => colSet.add(x)); }
  let overlap = 0; for (const x of colSet) if (chromeSet.has(x)) overlap += 1;
  return { onHtml: own(de) || '', docEls: document.querySelectorAll('*').length, carriers: carriers.length, reads: [...new Set(reads)], chromeEls: chromeSet.size, columnEls: colSet.size, columnInChrome: overlap }; })()`;

// take out every style rule whose selector matches; returns how many went
const DROP = (re) => `(() => { const re = new RegExp(${JSON.stringify(re)}); let n = 0; const walk = (owner) => { let list; try { list = owner.cssRules; } catch { return; } for (let i = list.length - 1; i >= 0; i -= 1) { const r = list[i]; if (r.selectorText !== undefined) { if (re.test(r.selectorText)) { owner.deleteRule(i); n += 1; } } else if (r.cssRules) walk(r); else if (r.styleSheet) walk(r.styleSheet); } }; for (const s of document.styleSheets) walk(s); return n; })()`;
const VARIANTS = [['asis', null], ['nohas', 'has[(].*(wz-board-ink-sheet|wz-ink-tab)'], ['noink', 'wz-ink|ink-undo|wz-board-ink'], ['asis2', null]];
const out = [];
let invLine = '', shape = '', err = '';
try { await withHarness(async (app) => {
  const go = async (search, hash) => { await app.cdp('Page.navigate', { url: `${app.base}/${search}#${hash}` }); await sleep(250); };
  await go('', '/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1400, 900);
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoTheme === 'object'", { label: 'the seams', timeout: 20000 });
  await app.evalJs(`window.wrizoCreateJournalPage({ id: 'kl-1', text: ${JSON.stringify(PAGE_TEXT)}, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' }); window.wrizoFlushNow(); null`);
  await sleep(500);
  for (const [name, re] of VARIANTS) {
    await go('', '/');
    await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'theme seam', timeout: 20000 });
    await app.evalJs("window.wrizoTheme.set('machina'); window.wrizoFlushNow(); null");
    await sleep(500);
    await app.reload();
    await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'theme seam after reload', timeout: 20000 });
    await app.evalJs("location.hash = '#/page/kl-1'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: 'page' });
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 25000, label: 'splash gone' });
    await sleep(1800);
    const dropped = re ? await app.evalJs(DROP(re)) : 0;
    if (re) await sleep(600);
    await app.evalJs("(() => { document.querySelector('.forward-only-editor').focus(); return true; })()");
    const before = await app.evalJs(FADE_STATE);
    const tr = await traceKey(app, 'a');
    out.push(`${name}${re ? `(-${dropped})` : ''} key=${tr.keyEls} doc=${before.docEls} chrome=${before.chromeEls} col=${before.columnEls}`);
    if (name === 'asis') {
      invLine = (tr.invalidations || []).slice(0, 5).map(([k, v]) => `${v}x ${k.replace(/Invalidation\w*/g, '').slice(0, 90)}`).join(' ;; ');
      shape = await app.evalJs("(() => { const n = (s) => document.querySelectorAll(s + ' *').length; return `stage=${document.querySelector('.mode-tabs, .desk-mode-tab.active')?.textContent || '?'} sliver=${n('.wz-sliver-panel')} inksheet=${n('.wz-ink-sheet')} canvas=${document.querySelectorAll('canvas').length} mode=${document.querySelector('.mode-page')?.getAttribute('data-ink')}`; })()");
    }
  }
}, { label: 'visual-kl-diag' }); } catch (e) { err = ' ERR ' + String((e && e.message) || e).replace(/\s+/g, ' ').slice(0, 300); }
console.log(`\nVISUAL KL DIAG VERIFY: FAIL - ${out.join(' | ')} || ${shape} || ${invLine}${err}`);
process.exit(1);
