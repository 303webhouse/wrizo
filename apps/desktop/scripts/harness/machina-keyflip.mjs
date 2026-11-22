// MACHINA KEY-FLIP (Fable, Nov 22, 2:58 am, URGENT: "live in Machina on train H: 23-reorg-top.css lines 197-198, [data-theme='machina'] ::highlight(wz-search) and
// -cur, have the shape INK just proved costs a keystroke restyle of ~46% of the page in Arbor (a ::highlight() has a universal subject; a root-attribute ancestor makes
// the whole page depend on the root, and the first key flips data-wz-writing). Not gated by the reorg: every Machina writer."). arbor-keyflip.mjs's method, in Machina:
// a Chrome trace (devtools.timeline) of the FIRST key on a page reopened at rest; the largest single restyle from the keydown to 150 ms after it must touch at most a
// quarter of the document's elements. No reorg switch in the URL (the driver pins it off): the rules are global, so every Machina writer pays them.
//   MKF-PREMISE   Machina, the page mounted, the first key flips data-wz-writing on the root inside the trace, and the trace read the key and its restyles
//   MKF-FLIP      the first key, a letter: the largest restyle touches at most 25% of the document's elements, on every one of 3 reopens
//   MKF-FLIP-SP   the same for a Space as the first key (it commits the word and rebuilds the committed runs), on every one of 2 reopens
//   MKF-LOOK      the search's highlights still paint in Machina: ::highlight(wz-search) and ::highlight(wz-search-cur) compute to Machina's colours
//   [Fable, Nov 22, 9:35 am, RULED A] MKF-FLIP and -SP read as successors: the first key's restyle at most HALF of the same key with the old rules put back
//                 (the highlight's share removed); the 25% bar is parked and prints as INFO MKF-GATE-90, INK's --fade-dur gate (#90)
//   MUT-MKF-FLIP  the two old rules ([data-theme='machina'] ::highlight(...)) put back into the running page: MKF-FLIP is RED (the reader can go red)
// Run: node scripts/harness/machina-keyflip.mjs (from apps/desktop; a box turn or Actions).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const REOPENS = 3, SP_REOPENS = 2, WINDOW_US = 150000, SHARE = 0.25;
const OLD_RULES = "[data-theme='machina'] ::highlight(wz-search){ background-color:rgba(246, 236, 190, .6); }\n[data-theme='machina'] ::highlight(wz-search-cur){ background-color:rgba(232, 196, 92, .85); color:#1C1C1C; }";

// arbor-keyflip.mjs's trace categories and analysis (the same reader, so the two checks measure the same thing)
const CATS = ['toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'disabled-by-default-devtools.timeline.invalidationTracking'];
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
  const tasks = spans.filter((s) => /^(ThreadControllerImpl::RunTask|RunTask)$/.test(s.name));
  const disp = spans.filter((s) => s.name === 'EventDispatch' && s.args.data && KEYTYPES.has(s.args.data.type) && s.ts >= K);
  const keyTasks = tasks.filter((t) => disp.some((d) => d.ts >= t.ts && d.end <= t.end));
  const ult = spans.filter((s) => s.name === 'UpdateLayoutTree' || s.name === 'RecalculateStyles');
  const els = (s) => Number(s.args.elementCount ?? (s.args.endData && s.args.endData.elementCount) ?? (s.args.data && s.args.data.elementCount) ?? NaN);
  const win = ult.filter((s) => s.ts >= K && s.ts < K + WINDOW_US);
  const counted = win.filter((s) => Number.isFinite(els(s)));
  const big = counted.reduce((m, s) => (els(s) > (m ? els(m) : -1) ? s : m), null);
  // INFO (no check; arbor-keyflip's attribution): what the first key invalidated and why, and the largest restyles, to name a cause the highlight fix did not take out
  const inv = {};
  for (const e of evs) {
    if (e.ts < K - 2000 || e.ts > K + WINDOW_US || !/InvalidationTracking/.test(e.name)) continue;
    const d = (e.args && e.args.data) || {};
    const why = d.reason || (d.changedAttribute ? 'attr ' + d.changedAttribute : d.changedClass ? 'class ' + d.changedClass : d.changedId ? 'id ' + d.changedId : d.changedPseudo ? 'pseudo ' + d.changedPseudo : '?');
    const k = `${e.name.replace('InvalidationTracking', '')} | ${why}${d.extraData ? ' (' + String(d.extraData).slice(0, 60) + ')' : ''} | ${String(d.nodeName || '').slice(0, 70)}`;
    inv[k] = (inv[k] || 0) + 1;
  }
  const deep = evs.filter((e) => e.ts >= K - 2000 && e.ts <= K + WINDOW_US && /InvalidationTracking/.test(e.name) && !/^Layout/.test(e.name) && /^(HTML|BODY)/.test(String((e.args && e.args.data && e.args.data.nodeName) || '')))
    .slice(0, 12).map((e) => ({ n: e.name.replace('InvalidationTracking', ''), at: Math.round((e.ts - K) / 100) / 10, d: JSON.stringify(e.args.data).slice(0, 500) }));
  const top = win.filter((s) => Number.isFinite(els(s))).sort((a, b) => els(b) - els(a)).slice(0, 5).map((s) => ({ els: els(s), at: Math.round((s.ts - K) / 100) / 10 }));
  return { keyTasks: keyTasks.length, restyles: win.length, counted: counted.length, keyEls: big ? els(big) : null, keyElsMs: big ? Math.round((big.end - big.ts) / 100) / 10 : null,
    attrib: { top, invalidations: Object.entries(inv).sort((a, b) => b[1] - a[1]).slice(0, 20), deep } };
};
const STATE = "(() => ({ theme: document.documentElement.getAttribute('data-theme'), writing: document.documentElement.getAttribute('data-wz-writing'), docEls: document.getElementsByTagName('*').length, editor: !!document.querySelector('.forward-only-editor') }))()";
const LOOK = `(() => { const row = document.querySelector('.forward-only-editor .wz-row') || document.querySelector('.forward-only-editor'); if (!row) return null;
  const a = getComputedStyle(row, '::highlight(wz-search)'), b = getComputedStyle(row, '::highlight(wz-search-cur)');
  return { hit: a.backgroundColor, cur: b.backgroundColor, curInk: b.color }; })()`;
const inject = (css) => `(() => { const s = document.createElement('style'); s.setAttribute('data-mkf-mut', ''); s.textContent = ${JSON.stringify(css)}; document.head.appendChild(s); return true; })()`;
const flipOk = (m) => !!m && !!m.tr && m.tr.keyEls != null && !!m.before && m.tr.keyEls <= SHARE * m.before.docEls;

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await ev("window.wrizoTheme.set('machina'); null");
  await ev(`(() => { window.wrizoCreateJournalPage({ id: 'mkf-1', text: ${JSON.stringify(Array.from({ length: 40 }, (_, i) => 'word' + i).join(' '))}, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' }); window.wrizoFlushNow(); return null; })()`);

  // reopen the page at rest (the first key starts writing), Machina, no reorg switch in the URL
  const open = async () => {
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before reopen', timeout: 15000 }).catch(() => {});
    await ev("history.replaceState(null, '', '/#/page/mkf-1'); null");
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' });
    await splashGone();
    await sleep(1500);
  };
  const traceKey = async (key) => {
    await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReturnAsStream' });
    await sleep(400);
    await app.typeKeys(key);
    await sleep(700);
    const done = app.waitEvent('Tracing.tracingComplete', 30000);
    await app.cdp('Tracing.end');
    const e = await done;
    if (!e || !e.stream) return { err: 'no trace stream' };
    let s = '';
    for (;;) { const r = await app.cdp('IO.read', { handle: e.stream, size: 4 << 20 }); s += r.base64Encoded ? Buffer.from(r.data, 'base64').toString('utf8') : r.data; if (r.eof) break; }
    await app.cdp('IO.close', { handle: e.stream });
    let j; try { j = JSON.parse(s); } catch (x) { return { err: 'trace not JSON: ' + String(x).slice(0, 80) }; }
    return analyse(Array.isArray(j) ? j : (j.traceEvents || []));
  };
  const measure = async (label, { key = 'a', mut = false } = {}) => {
    await open();
    if (mut) { await ev(inject(OLD_RULES)); await sleep(400); }
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    const before = await ev(STATE);
    const tr = await traceKey(key);
    const after = await ev(STATE);
    const m = { label, before, after, tr };
    const { attrib, ...trShort } = tr || {};
    console.log(`MKF ${label}: ` + JSON.stringify({ docEls: before.docEls, share: tr && tr.keyEls != null ? Math.round((tr.keyEls / before.docEls) * 1000) / 10 + '%' : null, before: before.writing, after: after.writing, tr: trShort }));
    if (attrib && (label === 'letter-1' || label === 'mut-old-rules')) console.log(`MKF-ATTRIB ${label}: ` + JSON.stringify(attrib));
    return m;
  };

  const fix = []; for (let i = 1; i <= REOPENS; i += 1) fix.push(await measure(`letter-${i}`));
  const sp = []; for (let i = 1; i <= SP_REOPENS; i += 1) sp.push(await measure(`space-${i}`, { key: ' ' }));
  const mut = await measure('mut-old-rules', { mut: true });
  await open();
  const look = await ev(LOOK);

  const f0 = fix[0];
  ok('MKF-PREMISE Machina, the page mounted, the first key flips data-wz-writing on the root inside the trace, and the trace read the key and its restyles',
    !!f0 && f0.before.theme === 'machina' && f0.before.editor && f0.before.writing === null && f0.after.writing === 'true' && !!f0.tr && f0.tr.keyTasks >= 1 && f0.tr.counted >= 1, f0);
  // SUPERSEDED (Fable, Nov 22, 9:35 am, RULED A: the highlight fix ships on "the highlight's share removed"; the 25% bar is INK's #90 GATE: the --fade-dur write on
  // <html> (useChromeDissolve at the first key; bug #80 moved it for Arbor, #90 kept it on the live themes, now GO everywhere) is the rest, and INK's fix must take this
  // file to the 25% bar: restore these two lines live in that fix's commit). Measured on Actions 45010127592: 316 element styles against a 269-element document. The
  // originals, verbatim (their reading still prints below as INFO MKF-GATE-90 on every run):
  // ok(`MKF-FLIP the first key (a letter): the largest restyle touches at most ${SHARE * 100}% of the document's elements, on every one of ${REOPENS} reopens`, fix.every(flipOk),
  //   fix.map((m) => ({ keyEls: m.tr && m.tr.keyEls, docEls: m.before && m.before.docEls })));
  // ok(`MKF-FLIP-SP the same for a Space as the first key, on every one of ${SP_REOPENS} reopens`, sp.every(flipOk), sp.map((m) => ({ keyEls: m.tr && m.tr.keyEls, docEls: m.before && m.before.docEls })));
  console.log(`INFO MKF-GATE-90 (INK's --fade-dur gate, the 25% bar): letter ${fix.every(flipOk) ? 'MET' : 'NOT MET'}, space ${sp.every(flipOk) ? 'MET' : 'NOT MET'} ` + JSON.stringify([...fix, ...sp].map((m) => ({ keyEls: m.tr && m.tr.keyEls, docEls: m.before && m.before.docEls }))));
  // [successors] the highlight's share removed: on every reopen the first key's largest restyle is at most half of the same key with the two old rules put back
  // (the red: 976 element styles; the fix: 316; old rules back: 976)
  const base = mut && mut.tr && mut.tr.keyEls;
  const shareOk = (m) => !!m && !!m.tr && m.tr.keyEls != null && base != null && m.tr.keyEls <= 0.5 * base;
  ok(`MKF-FLIP [successor] the first key (a letter), every one of ${REOPENS} reopens: its largest restyle is at most half of the same key with the old highlight rules put back (the highlight's share removed)`,
    base != null && fix.every(shareOk), { base, fix: fix.map((m) => m.tr && m.tr.keyEls) });
  ok(`MKF-FLIP-SP [successor] the same for a Space as the first key, every one of ${SP_REOPENS} reopens`, base != null && sp.every(shareOk), { base, sp: sp.map((m) => m.tr && m.tr.keyEls) });
  ok('MKF-LOOK the search\'s highlights still paint in Machina: wz-search rgba(246, 236, 190, 0.6), wz-search-cur rgba(232, 196, 92, 0.85) with ink rgb(28, 28, 28)',
    !!look && look.hit === 'rgba(246, 236, 190, 0.6)' && look.cur === 'rgba(232, 196, 92, 0.85)' && look.curInk === 'rgb(28, 28, 28)', look);
  // SUPERSEDED (with MKF-FLIP, Fable, Nov 22, 9:35 am): its reading moves to the successor's terms. The original, verbatim:
  // ok('MUT-MKF-FLIP the two old rules put back into the running page: MKF-FLIP is RED (the reader can go red)', !!mut && !!mut.tr && mut.tr.keyEls != null && !flipOk(mut),
  //   { keyEls: mut && mut.tr && mut.tr.keyEls, docEls: mut && mut.before && mut.before.docEls });
  // [successor] the old rules put back really cost the page: the restyle with them is at least twice the fix's own (so the successor's half is a real margin, not noise)
  ok('MUT-MKF-FLIP [successor] the two old rules put back into the running page restyle at least twice as many elements as the fix does (the successor reads a real difference)',
    base != null && fix.every((m) => m.tr && m.tr.keyEls != null && base >= 2 * m.tr.keyEls), { base, fix: fix.map((m) => m.tr && m.tr.keyEls) });
});

const EXPECTED = 5;
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 1500)}`); if (!c.pass) bad += 1; }
if (checks.length !== EXPECTED) bad = Math.max(bad, 1);
console.log(bad ? `\nMACHINA-KEYFLIP VERIFY: FAIL - ${bad}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}` : `\nMACHINA-KEYFLIP VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
