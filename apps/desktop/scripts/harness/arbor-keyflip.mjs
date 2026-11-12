// ARBOR KEY-FLIP (bug #80; Fable, Nov 12, 11:05 am: "from turn 6's evidence (slow keys only at the keystroke that starts writing, with the shade on):
// name the cause in the code and build a candidate fix on a branch from T2, with its checks on Actions. The box proves it in the next quiet slot,
// beside the unfixed tree.")
//
// THE CAUSE, read in the code against turn 6 (F:\wrizo-work\arbor-turn6-0939Z: every Arbor control key over 40 ms came at the keystroke that starts
// writing, none with both layers off; the long frames named the editor's beforeinput handler with 20-38 ms of FORCED style and layout):
//   1. arbor-v2.css: two night-room rules (the bars' resting dim, r20; the dimmed hooks' lettering, §6.2) end in a UNIVERSAL subject ("> *", " *")
//      under conditions that flip at that keystroke - data-wz-writing on the root, data-writing and data-chrome-receded on the stage and the frame.
//      A flip that reaches a universal subject restyles the whole subtree under the flipped element; on the root that is the whole document, both
//      live shade drawings and the rhizome included. Main has no such rule (the scan below: 0 on main, these 2 on T2).
//   2. pergola.ts: the writing observer read getComputedStyle(room.layer) in the key's own task, right after the flip, so that whole restyle ran
//      FORCED inside the beforeinput handler.
// THE FIX (this branch): the rules' conditions move onto the bar / the hook itself (a class subject) as a custom property, and what it holds reads
// that property through a style query - same conditions, same dim, same specificity; the pergola's read moves two frames after the key.
//
// THE CHECKS (Arbor day room unless named; shade and rhizome on; every measurement on a page reopened at rest, so its first key starts writing):
//   KF-PREMISE   the fixture is what turn 6 measured: the flag, the day room, the pergola shown, two live drawings, the rhizome field; the key flips
//                data-wz-writing INSIDE the key's own task; the trace read the key's tasks and restyles with element counts.
//   KF-FLIP      a Chrome trace (devtools.timeline) of the first key: the largest single restyle from the keydown to 150 ms after it touches at most
//                a quarter of the document's elements, on every one of 3 reopens.
//   MUT-KF-FLIP  T2's two rules put back verbatim into the running page (the fix's two style queries taken out): KF-FLIP is RED on every reopen.
//   KF-READ      no getComputedStyle on a shade layer inside the key's task; the pergola's read is seen, one frame or more after the flip (liveness).
//   MUT-KF-READ  T2's pattern rebuilt in the page (an observer of the flip that reads the shade layer's style at once): KF-READ is RED.
//   KF-LOOK-*    by NIGHT (where both rules apply), at rest and while writing: the computed opacity and colour of every element are the same with
//                the fix as with T2's rules put back (transitions off for the read); coverage: T2's rules change some element at rest.
//   MUT-KF-LOOK  the fix's two custom properties taken away: KF-LOOK-REST is RED.
//   KF-SCAN      no selector in src/**/*.css has a universal subject under a condition that flips at the key; the scanner finds T2's 2 (liveness).
// Information only: the same trace with the leaves' pause rule taken out, and with every Arbor rule keyed on the flip taken out (what is left).
//
// Run: node scripts/harness/arbor-keyflip.mjs (it pins ?arbor2=1&arbor2room=day itself; the night reads navigate with arbor2room=night).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.env.WS_URL_SEARCH) process.env.WS_URL_SEARCH = '?arbor2=1&arbor2room=day';
const { withHarness } = await import('../runtime-verify.mjs');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REOPENS = 3, WINDOW_US = 150000, SHARE = 0.25;

// T2's two rules (arbor-v2.css @ f7fe9e50, lines 400 and 404), verbatim
const OLD_RULES = [
  ":root[data-arbor2][data-theme='plateau'][data-arbor2-room='night']:not([data-wz-writing='true']) :is(.chrome-top.sprint-nav, .desk-frame-strip):not(.wz-sliver[data-open='true'] .wz-sliver-grip, .wz-tutor-grip[data-open='true']):not([data-chrome-receded='true'], [data-chrome-receded='true'] *, [data-writing='true'] *):not(:hover, :focus-within) > *{ opacity:var(--arbor2-dim); }",
  ":root[data-arbor2][data-theme='plateau'][data-arbor2-room='night']:not([data-wz-writing='true']):not([data-arbor2-lit]) :is(.chrome-fade, .desk-dissolve, .mode-dissolve):not(:is(.chrome-fade, .desk-dissolve, .mode-dissolve) *):not(.wz-sliver-panel, .wz-tutor-panel, .wz-cascade-panel):not(.wz-sliver[data-open='true'] .wz-sliver-grip, .wz-tutor-grip[data-open='true']):not([data-chrome-receded='true'], [data-chrome-receded='true'] *, [data-writing='true'] *):not(:hover, :focus-within) *{ color:var(--text-hi) !important; }",
];

// ---- KF-SCAN: universal subjects under a condition that flips at the keystroke that starts writing --------------------------------------------
const FLIP = /data-wz-writing|data-writing|data-chrome-receded/;
const splitTop = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') d += 1; if (ch === ')' || ch === ']') d -= 1; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const subjectOf = (sel) => { let d = 0, i = sel.length - 1; for (; i >= 0; i -= 1) { const ch = sel[i]; if (ch === ')' || ch === ']') d += 1; if (ch === '(' || ch === '[') d -= 1; if (d === 0 && /[\s>+~]/.test(ch)) break; } return sel.slice(i + 1).trim(); };
const scanCss = (css) => {
  const hits = [];
  const src = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const re = /([^{}]+)\{/g; let m;
  while ((m = re.exec(src))) {
    const raw = m[1].trim(); if (raw.startsWith('@')) continue;
    for (const sel of splitTop(raw)) { const s = sel.trim(); if (!FLIP.test(s)) continue; const subj = subjectOf(s); if (/^\*/.test(subj) && !/^\*[.#[]/.test(subj)) hits.push(s.slice(0, 120)); }
  }
  return hits;
};
const cssFiles = [];
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.css')) cssFiles.push(p); } };
walk(path.join(HERE, '..', '..', 'src'));
const scanHits = cssFiles.flatMap((f) => scanCss(fs.readFileSync(f, 'utf8')).map((h) => `${path.basename(f)}: ${h}`));
const oldHits = scanCss(OLD_RULES.join('\n'));

// ---- page-side pieces ---------------------------------------------------------------------------------------------------------------------------
// (its own read goes round the recorder: the instrument never reads a shade layer through the patched function)
const STATE = `(() => { const root = document.documentElement, pg = document.querySelector('.arbor2-pergola'), g = window.__kfOrig || window.getComputedStyle;
  return { arbor: root.hasAttribute('data-arbor2'), room: root.getAttribute('data-arbor2-room'), writing: root.getAttribute('data-wz-writing'),
    pergola: pg ? g.call(window, pg).display : null, live: document.querySelectorAll('.arbor2-live').length, field: !!document.querySelector('.wz-rhizome-field'),
    docEls: document.querySelectorAll('*').length, liveEls: document.querySelectorAll('.arbor2-live *').length,
    bundle: [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => s.indexOf('assets/index-') >= 0).join(',') }; })()`;
// the read recorder: every getComputedStyle on a shade layer, inside the key's task or after it; the flip's own moment and whether it came inside
// SUCCESSOR (Nov 12): every read and the flip also carry the FRAME they fell in (a rAF counter armed before the key). Actions run 43277044562 showed the
// inKey flag (cleared by a timeout after the input event) stays set across frames: the fix's read landed 11-55 ms after the flip and was filed inKey,
// where T2's pattern (the mutant) lands 1 ms after it. A read in the flip's own frame is the forced read; the fix's lands two frames later.
const RECORD = `(() => {
  const G = window.__kfg = { inKey: [], after: [], flips: [], reads: [] }; let inKey = false, frame = 0; const t0 = performance.now();
  const tick = () => { frame += 1; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  const orig = window.__kfOrig || window.getComputedStyle; window.__kfOrig = orig;
  window.getComputedStyle = function (el, ps) { try { if (el && el.matches && el.matches('.arbor2-pergola, .arbor2-pagesh')) { const t = Math.round(performance.now() - t0); (inKey ? G.inKey : G.after).push(t); G.reads.push({ t, frame }); } } catch (e) { /* the read goes on */ } return orig.call(window, el, ps); };
  addEventListener('keydown', () => { inKey = true; }, true);
  addEventListener('input', () => { setTimeout(() => { inKey = false; }, 0); }, true);
  new MutationObserver(() => { G.flips.push({ t: Math.round(performance.now() - t0), inKey, frame, on: document.documentElement.getAttribute('data-wz-writing') }); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-wz-writing'] });
  return true; })()`;
const READ_REC = `(() => window.__kfg)()`;
// MUT-KF-READ: T2's pattern, rebuilt - an observer of the flip that reads the shade layer's style at once
const OLD_READ = `(() => { new MutationObserver(() => { const l = document.querySelector('.arbor2-pergola'); if (l && document.documentElement.getAttribute('data-wz-writing') === 'true') getComputedStyle(l).transitionDuration; }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-wz-writing'] }); return true; })()`;
const NOTRANS = `(() => { const s = document.createElement('style'); s.textContent = '*, *::before, *::after { transition: none !important; animation-play-state: paused !important; }'; document.head.appendChild(s); return true; })()`;
const SNAP = `(() => { const r = []; const g = window.__kfOrig || getComputedStyle; for (const el of document.querySelectorAll('body *')) { const cs = g.call(window, el); r.push(cs.opacity + '|' + cs.color); } return r; })()`;
// the stylesheet edits, in the running page (the sheet that carries the fix)
const SWAP = (mode) => `((mode) => {
  const OLD = ${JSON.stringify(OLD_RULES)};
  // the sheet is found once by its marker and remembered for the page (Actions run 43277044562: once 'old' had taken the marker out, 'none' could
  // not find the sheet and changed nothing, so the coverage read compared T2's rules with themselves)
  let sh = window.__kfSheet || null;
  if (!sh) for (const s of document.styleSheets) { let rs; try { rs = s.cssRules; } catch (e) { continue; } for (const r of rs) { if (r.cssText && r.cssText.indexOf('--arbor2-bar-dim') >= 0) { sh = s; break; } } if (sh) break; }
  if (!sh) return { mode, err: 'the sheet carrying --arbor2-bar-dim was not found' };
  window.__kfSheet = sh;
  const isCont = (r) => typeof CSSContainerRule !== 'undefined' && r instanceof CSSContainerRule && /--arbor2-(bar-dim|hook-lt)/.test(r.conditionText || r.cssText);
  const isProp = (name) => (r) => r instanceof CSSStyleRule && r.style.getPropertyValue(name).trim() === 'on';
  const del = (pred) => { let n = 0; for (let i = sh.cssRules.length - 1; i >= 0; i -= 1) if (pred(sh.cssRules[i])) { sh.deleteRule(i); n += 1; } return n; };
  const unprop = (name) => { let n = 0; for (const r of [...sh.cssRules]) if (isProp(name)(r)) { r.style.removeProperty(name); n += 1; } return n; };
  const out = { mode };
  if (mode === 'old') {
    out.containers = 0; out.inserted = 0;
    for (let i = sh.cssRules.length - 1; i >= 0; i -= 1) { const r = sh.cssRules[i]; if (!isCont(r)) continue; const which = /bar-dim/.test(r.conditionText || r.cssText) ? 0 : 1; sh.deleteRule(i); out.containers += 1; sh.insertRule(OLD[which], i); out.inserted += 1; }
    out.barProp = del(isProp('--arbor2-bar-dim')); out.hookProp = unprop('--arbor2-hook-lt');
  } else if (mode === 'none') {
    out.containers = del(isCont); out.barProp = del(isProp('--arbor2-bar-dim')); out.hookProp = unprop('--arbor2-hook-lt');
    out.oldGone = del((r) => r instanceof CSSStyleRule && (r.style.getPropertyValue('opacity') || r.style.getPropertyValue('color')) && /data-wz-writing/.test(r.selectorText) && /\\*$/.test(r.selectorText.trim()));
  } else if (mode === 'mutlook') {
    out.barProp = del(isProp('--arbor2-bar-dim')); out.hookProp = unprop('--arbor2-hook-lt');
  } else if (mode === 'no938') {
    out.leafPause = del((r) => r instanceof CSSStyleRule && /data-wz-writing/.test(r.selectorText) && /wz-leaf/.test(r.selectorText));
  } else if (mode === 'nohas' || mode === 'nohasroot' || mode === 'nohasstage') {
    // information (run 43288120440 left a 1096-element restyle, twice in the key, on every variant, with ':has() on HTML / the stage' and
    // 'invalidates subtree | HTML' beside it): take Arbor's :has() rules out - all, those anchored on the root, those anchored lower (the stage)
    const arb = (r) => r instanceof CSSStyleRule && r.selectorText.indexOf(':has(') >= 0 && r.selectorText.indexOf('data-arbor2') >= 0;
    const onRoot = (r) => r.selectorText.split(' ')[0].indexOf(':has(') >= 0;
    out.deleted = del((r) => arb(r) && (mode === 'nohas' || (mode === 'nohasroot' ? onRoot(r) : !onRoot(r))));
  } else if (mode === 'floor') {
    out.flipRules = del((r) => r instanceof CSSStyleRule && /data-wz-writing|data-writing|data-chrome-receded/.test(r.selectorText)); out.containers = del(isCont);
  }
  return out;
})(${JSON.stringify(mode)})`;

// ---- the trace of one key ---------------------------------------------------------------------------------------------------------------------
// (+ the stack of each restyle and the invalidation tracking, Nov 12: Actions run 43277044562 left a 1096-element forced restyle in the key that is the
// same with the fix, with T2's rules and with every flip rule taken out - these two name what forces it and what it restyles)
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
  const inKey = (s) => keyTasks.some((t) => s.ts >= t.ts && s.end <= t.end);
  const win = ult.filter((s) => s.ts >= K && s.ts < K + WINDOW_US);
  const counted = win.filter((s) => Number.isFinite(els(s)));
  const big = counted.reduce((m, s) => (els(s) > (m ? els(m) : -1) ? s : m), null);
  const r1 = (x) => Math.round(x * 10) / 10;
  // attribution (information): each restyle's own stack (who forced it) and the invalidation reasons in the window (what it restyled, and why)
  const frames = (s) => { const st = (s.args.beginData && s.args.beginData.stackTrace) || (s.args.data && s.args.data.stackTrace) || null; return st ? st.slice(0, 4).map((f) => ({ fn: f.functionName || '?', url: String(f.url || ''), line: f.lineNumber, col: f.columnNumber })) : []; };
  const show = (s) => ({ els: els(s), ms: r1((s.end - s.ts) / 1000), at: r1((s.ts - K) / 1000), forced: inKey(s), stack: frames(s).map((f) => `${f.fn}@${f.url.split('/').pop()}:${f.line}:${f.col}`) });
  const inv = {};
  for (const e of evs) {
    if (e.ts < K - 2000 || e.ts > K + WINDOW_US || !/InvalidationTracking/.test(e.name)) continue;
    const d = (e.args && e.args.data) || {};
    const why = d.reason || (d.changedAttribute ? 'attr ' + d.changedAttribute : d.changedClass ? 'class ' + d.changedClass : d.changedId ? 'id ' + d.changedId : d.changedPseudo ? 'pseudo ' + d.changedPseudo : '?');
    const key = `${e.name.replace('InvalidationTracking', '')} | ${why}${d.extraData ? ' (' + String(d.extraData).slice(0, 40) + ')' : ''} | ${String(d.nodeName || '').slice(0, 70)}`;
    inv[key] = (inv[key] || 0) + 1;
  }
  // the raw invalidation events on the root, the body and the stage (who scheduled what, and when)
  const deep = evs.filter((e) => e.ts >= K - 2000 && e.ts <= K + WINDOW_US && /InvalidationTracking/.test(e.name) && !/^Layout/.test(e.name)
    && /^(HTML|BODY|DIV class='desk-frame-stage)/.test(String((e.args && e.args.data && e.args.data.nodeName) || '')))
    .slice(0, 16).map((e) => ({ n: e.name.replace('InvalidationTracking', ''), at: r1((e.ts - K) / 1000), d: JSON.stringify(e.args.data).slice(0, 700) }));
  const attrib = { deep, restyles: win.slice().sort((a, b) => els(b) - els(a)).slice(0, 6).map(show), invalidations: Object.entries(inv).sort((a, b) => b[1] - a[1]).slice(0, 18),
    forcedFrames: [...new Map(win.filter(inKey).flatMap(frames).map((f) => [`${f.url}:${f.line}:${f.col}`, f])).values()].slice(0, 6) };
  return { attrib, keyTasks: keyTasks.length, keyTaskMs: r1(keyTasks.reduce((a, t) => a + (t.end - t.ts), 0) / 1000), restyles: win.length, counted: counted.length,
    keyEls: big ? els(big) : null, keyElsMs: big ? r1((big.end - big.ts) / 1000) : null, keyElsForced: big ? inKey(big) : null,
    forcedEls: counted.filter(inKey).reduce((a, s) => a + els(s), 0), forcedMs: r1(win.filter(inKey).reduce((a, s) => a + (s.end - s.ts), 0) / 1000),
    sumEls: counted.reduce((a, s) => a + els(s), 0) };
};

const flipOk = (m) => !!m && !!m.tr && m.tr.keyEls != null && !!m.before && m.tr.keyEls <= SHARE * m.before.docEls;
const readOk = (m) => !!m && !!m.rec && m.rec.inKey.length === 0;
const readLive = (m) => !!m && !!m.rec && m.rec.after.length >= 1 && m.rec.flips.length >= 1 && m.rec.after[0] >= m.rec.flips[0].t + 8;
// the successors' readers: by FRAME - no shade read in the flip's own frame; at least one shade read seen in a later frame (the recorder is live)
const flipFrame = (m) => (m && m.rec && m.rec.flips.length ? m.rec.flips[0].frame : null);
const readOkB = (m) => flipFrame(m) != null && m.rec.reads.filter((r) => r.t >= m.rec.flips[0].t).every((r) => r.frame > flipFrame(m));
const readLiveB = (m) => flipFrame(m) != null && m.rec.reads.some((r) => r.t >= m.rec.flips[0].t && r.frame > flipFrame(m));

await withHarness(async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '').split('?')[0];
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  await app.reload();

  // reopen the page at rest (seeded through the seams), in the room asked
  const open = async (room) => {
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
    await app.evalJs(`(() => { window.wrizoSetWritingGoal({ n: 1000, unit: 'words' }); window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') }); return true; })()`);
    await app.reload();
    await app.cdp('Page.navigate', { url: `${app.base}/?arbor2=1&arbor2room=${room}#/page/${pageId}` });
    await app.waitFor("!!document.querySelector('.wz-rhizome-field') && !!document.querySelector('.forward-only-editor')", { timeout: 15000, label: `page reopened (${room})` });
    await sleep(1500);
  };
  const focus = () => app.evalJs("(() => { document.querySelector('.forward-only-editor').focus(); return true; })()");
  const traceKey = async () => {
    await app.cdp('Tracing.start', { traceConfig: { includedCategories: CATS, recordMode: 'recordContinuously' }, transferMode: 'ReturnAsStream' });
    await sleep(400);
    await app.typeKeys('a');
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
  const measure = async (label, { swap = null, oldRead = false } = {}) => {
    await open('day');
    const sw = swap ? await app.evalJs(SWAP(swap)) : null;
    if (swap) await sleep(500);
    await app.evalJs(RECORD);
    if (oldRead) await app.evalJs(OLD_READ);
    await focus();
    const before = await app.evalJs(STATE);
    const tr = await traceKey();
    const after = await app.evalJs(STATE);
    const rec = await app.evalJs(READ_REC);
    const { attrib, ...trShort } = tr || {};
    const m = { label, swap: sw, before, after, tr: trShort, rec };
    console.log(`KF ${label}: ` + JSON.stringify({ swap: sw, docEls: before.docEls, liveEls: before.liveEls, writing: after.writing, tr: trShort, reads: { inKey: rec.inKey, after: rec.after.slice(0, 3), frames: rec.reads.slice(0, 4), flips: rec.flips } }));
    if (attrib && /^info-nohas/.test(label)) console.log(`KF-ATTRIB ${label} restyles: ` + JSON.stringify(attrib.restyles));
    if (attrib && label === 'fix-1') console.log(`KF-ATTRIB ${label} deep: ` + JSON.stringify(attrib.deep));
    if (attrib && /^(fix-1|old-1|info-floor)$/.test(label)) {
      console.log(`KF-ATTRIB ${label} restyles: ` + JSON.stringify(attrib.restyles));
      console.log(`KF-ATTRIB ${label} invalidations: ` + JSON.stringify(attrib.invalidations));
      // the code at each frame that forced a restyle inside the key, read from the bundle the page loaded
      const code = attrib.forcedFrames.length ? await app.evalJs(`(async () => { const F = ${JSON.stringify(attrib.forcedFrames)}; const cache = {}; const out = []; for (const f of F) { try { if (!cache[f.url]) cache[f.url] = (await (await fetch(f.url)).text()).split('\\n'); const L = cache[f.url][f.line] || ''; out.push({ at: f.fn + ' ' + f.url.split('/').pop() + ':' + f.line + ':' + f.col, code: L.slice(Math.max(0, f.col - 160), f.col + 160) }); } catch (e) { out.push({ at: f.url, err: String(e) }); } } return out; })()`) : [];
      console.log(`KF-ATTRIB ${label} forcing code: ` + JSON.stringify(code));
    }
    return m;
  };

  const fix = [], old = [];
  for (let i = 1; i <= REOPENS; i += 1) { fix.push(await measure(`fix-${i}`)); old.push(await measure(`old-${i}`, { swap: 'old' })); }
  const mutRead = await measure('mut-read', { oldRead: true });
  const no938 = await measure('info-no-leaf-pause', { swap: 'no938' });
  const floor = await measure('info-floor', { swap: 'floor' });
  const noHas = [await measure('info-nohas', { swap: 'nohas' }), await measure('info-nohas-root', { swap: 'nohasroot' }), await measure('info-nohas-stage', { swap: 'nohasstage' })];

  // the look by night: at rest, then while writing
  const look = {};
  await open('night'); await app.evalJs(NOTRANS); await sleep(300);
  look.room = (await app.evalJs(STATE)).room;
  look.restFix = await app.evalJs(SNAP);
  await sleep(200); look.restFix2 = await app.evalJs(SNAP);
  look.swapOld = await app.evalJs(SWAP('old')); await sleep(200);
  look.restOld = await app.evalJs(SNAP);
  look.swapNone = await app.evalJs(SWAP('none')); await sleep(200);
  look.restNone = await app.evalJs(SNAP);
  await open('night'); await app.evalJs(NOTRANS); await sleep(300); await focus();
  await app.typeKeys('a'); await sleep(500);
  look.wState = await app.evalJs(STATE);
  look.writeFix = await app.evalJs(SNAP);
  await sleep(200); look.writeFix2 = await app.evalJs(SNAP);
  look.wSwapOld = await app.evalJs(SWAP('old')); await sleep(200);
  look.writeOld = await app.evalJs(SNAP);
  await open('night'); await app.evalJs(NOTRANS); await sleep(300);
  look.mSwap = await app.evalJs(SWAP('mutlook')); await sleep(200);
  look.restMut = await app.evalJs(SNAP);
  look.mSwapOld = await app.evalJs(SWAP('old')); await sleep(200);
  look.restMutOld = await app.evalJs(SNAP);
  // NOISE MASK: an element whose reading moved between two reads of the fix 200 ms apart (something animating it) is left out, and counted
  const diff = (a, b, mask) => (a && b && a.length === b.length ? a.reduce((n, x, i) => n + (x !== b[i] && !(mask && mask[i]) ? 1 : 0), 0) : null);
  const unstable = (a, b) => (a && b && a.length === b.length ? a.map((x, i) => x !== b[i]) : null);
  const mRest = unstable(look.restFix, look.restFix2), mWrite = unstable(look.writeFix, look.writeFix2);
  const L = { room: look.room, writing: look.wState.writing, n: look.restFix.length, unstableRest: mRest ? mRest.filter(Boolean).length : null, unstableWrite: mWrite ? mWrite.filter(Boolean).length : null,
    restFixVsOld: mRest ? diff(look.restFix, look.restOld, mRest) : null, coverage: mRest ? diff(look.restOld, look.restNone, mRest) : null,
    writeFixVsOld: mWrite ? diff(look.writeFix, look.writeOld, mWrite) : null, mutVsOld: diff(look.restMut, look.restMutOld), swaps: { old: look.swapOld, none: look.swapNone, wOld: look.wSwapOld, mut: look.mSwap, mOld: look.mSwapOld } };
  console.log('KF LOOK: ' + JSON.stringify(L));
  console.log('KF SCAN: ' + JSON.stringify({ files: cssFiles.length, hits: scanHits, oldHits: oldHits.length }));

  // ---- the checks ----
  const judged = [...fix, ...old, mutRead, no938, floor];   // the premise holds on these; the :has() reads are information only
  const all = [...judged, ...noHas];
  const premise = (m) => m.before.arbor && m.before.room === 'day' && m.before.pergola && m.before.pergola !== 'none' && m.before.live >= 2 && m.before.field
    && m.before.writing !== 'true' && m.after.writing === 'true' && m.tr && !m.tr.err && m.tr.keyTasks >= 1 && m.tr.counted >= 1
    && m.rec && m.rec.flips.length >= 1 && m.rec.flips[0].inKey === true && m.rec.flips[0].on === 'true';
  ok('KF-PREMISE every reopen: Arbor, day room, the pergola shown, 2+ live drawings, the rhizome field; at rest before the key and writing after it; the flip came INSIDE the key\'s own task; the trace read the key\'s tasks and counted restyles',
    judged.every(premise), JSON.stringify(judged.filter((m) => !premise(m)).map((m) => ({ label: m.label, before: m.before, after: m.after.writing, tr: m.tr, flips: m.rec && m.rec.flips }))));
  ok(`KF-SWAPS the page edits landed: T2's rules in place of the fix's 2 style queries (old), the leaves' pause rule out (info), the flip rules out (info)`,
    old.every((m) => m.swap && m.swap.containers === 2 && m.swap.inserted === 2 && m.swap.barProp === 1 && m.swap.hookProp === 1) && no938.swap.leafPause >= 1 && floor.swap.flipRules >= 1,
    JSON.stringify({ old: old.map((m) => m.swap), no938: no938.swap, floor: floor.swap }));
  ok(`KF-FLIP the largest single restyle from the keystroke that starts writing to ${WINDOW_US / 1000} ms after it touches at most ${SHARE * 100}% of the document's elements, on all ${REOPENS} reopens (printed: ${fix.map((m) => `${m.tr.keyEls}/${m.before.docEls}`).join(', ')})`,
    fix.every(flipOk), JSON.stringify(fix.map((m) => ({ tr: m.tr, docEls: m.before.docEls, liveEls: m.before.liveEls }))));
  ok(`MUT-KF-FLIP with T2's two rules put back in the running page, KF-FLIP is RED on all ${REOPENS} reopens (printed: ${old.map((m) => `${m.tr.keyEls}/${m.before.docEls}`).join(', ')})`,
    old.every((m) => m.tr && m.tr.keyEls != null && !flipOk(m)), JSON.stringify(old.map((m) => ({ tr: m.tr, docEls: m.before.docEls, liveEls: m.before.liveEls }))));
  // PARKED 2026-11-12 (SUPERSEDED by KF-READ-B - an instrument fault, Actions run 43277044562, both legs: the inKey flag is cleared by a timeout after the
  // input event and stayed set across frames, so the fix's read (11-55 ms after the flip, two frames on) was filed inKey; T2's pattern, rebuilt as the
  // mutant, lands 1 ms after the flip). Original, verbatim:
  // ok('KF-READ no getComputedStyle on a shade layer inside the key\'s task, on every fix reopen; and the pergola\'s own read IS seen, 8 ms or more after the flip (the recorder is live)',
  //   fix.every((m) => readOk(m) && readLive(m)), JSON.stringify(fix.map((m) => m.rec)));
  // ok('MUT-KF-READ T2\'s pattern rebuilt in the page (an observer of the flip reading the shade layer\'s style at once): KF-READ is RED', !readOk(mutRead), JSON.stringify(mutRead.rec));
  ok('KF-READ-B no getComputedStyle on a shade layer in the FRAME of the flip, on every fix reopen; and a shade read IS seen in a later frame (the recorder is live)',
    fix.every((m) => readOkB(m) && readLiveB(m)), JSON.stringify(fix.map((m) => ({ flips: m.rec.flips, reads: m.rec.reads }))));
  ok('MUT-KF-READ-B T2\'s pattern rebuilt in the page (an observer of the flip reading the shade layer\'s style at once): KF-READ-B is RED', !readOkB(mutRead), JSON.stringify({ flips: mutRead.rec.flips, reads: mutRead.rec.reads }));
  // PARKED 2026-11-12 (SUPERSEDED by KF-LOOK-REST-B - an instrument fault, Actions run 43277044562: the 'none' edit found its sheet by a marker that the
  // 'old' edit had already taken out, so it changed nothing and the coverage compared T2's rules with themselves (0); the mutant read 22). Original, verbatim:
  // ok(`KF-LOOK-REST by night at rest, every element's computed opacity and colour are the same with the fix as with T2's rules (${L.n} elements, ${L.restFixVsOld} differ); and T2's rules change ${L.coverage} of them (coverage, 1 or more)`,
  //   look.room === 'night' && L.n > 0 && L.restFixVsOld === 0 && L.coverage >= 1 && look.swapOld.containers === 2 && look.swapOld.inserted === 2, JSON.stringify(L));
  ok(`KF-LOOK-REST-B by night at rest, every element's computed opacity and colour are the same with the fix as with T2's rules (${L.n} elements, ${L.restFixVsOld} differ); and T2's two rules, taken out, change ${L.coverage} of them (coverage, 1 or more)`,
    look.room === 'night' && L.n > 0 && L.restFixVsOld === 0 && L.coverage >= 1 && look.swapOld.containers === 2 && look.swapOld.inserted === 2 && look.swapNone.oldGone === 2, JSON.stringify(L));
  ok(`KF-LOOK-WRITING by night while writing, the same with the fix as with T2's rules (${L.writeFixVsOld} differ)`,
    L.writing === 'true' && L.writeFixVsOld === 0 && look.wSwapOld.inserted === 2, JSON.stringify(L));
  ok(`MUT-KF-LOOK the fix's two custom properties taken away: KF-LOOK-REST(-B) is RED (${L.mutVsOld} elements differ from T2's rules)`,
    look.mSwap.barProp === 1 && look.mSwap.hookProp === 1 && L.mutVsOld >= 1, JSON.stringify(L));
  ok(`KF-SCAN no selector in src/**/*.css (${cssFiles.length} files) has a universal subject under a condition that flips at the key (${scanHits.length}); the scanner finds T2's ${oldHits.length} of 2 (liveness)`,
    cssFiles.length >= 5 && scanHits.length === 0 && oldHits.length === 2, JSON.stringify({ scanHits, oldHits }));
  console.log('KF READINGS: ' + JSON.stringify(all.map((m) => ({ label: m.label, keyEls: m.tr.keyEls, keyElsMs: m.tr.keyElsMs, forced: m.tr.keyElsForced, forcedEls: m.tr.forcedEls, forcedMs: m.tr.forcedMs, keyTaskMs: m.tr.keyTaskMs, docEls: m.before.docEls, liveEls: m.before.liveEls, readsInKey: m.rec.inKey.length }))));
  console.log('KF BUNDLE: ' + fix[0].before.bundle);
}, { label: 'arbor-keyflip' });

const WANT_CHECKS = 10;   // a check that never ran is a failure, never a quiet pass
const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const pass = checks.length === WANT_CHECKS && !failed.length;
console.log(pass ? `\nARBOR-KEYFLIP VERIFY: PASS (${checks.length} checks)` : `\nARBOR-KEYFLIP VERIFY: FAIL - ${failed.length}/${checks.length} failed${checks.length !== WANT_CHECKS ? ` (${checks.length} of ${WANT_CHECKS} checks ran)` : ''}`);
process.exit(pass ? 0 : 1);
