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

// ---- the second pass (Nov 12, Actions run 43295952339 named two more whole-document restyles inside the key) ----------------------------------
// T2's rule at arbor-v2.css:642, verbatim: a universal subject under a :has() (Chrome: "Invalidation set invalidates subtree | HTML", this selector)
const OLD_HAS = ":root[data-arbor2][data-theme='plateau'] .desk-frame-stage:not(:has(.mode-pagecol[data-zoom='true'])) .wz-tutor-panel > *{ direction:ltr; }";
// KF-SCAN-HAS: the same scan, for a universal subject under a :has() anywhere in the selector
const HAS = /:has\(/;
const scanCssBy = (css, re) => {
  const hits = [];
  const src = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const rx = /([^{}]+)\{/g; let m;
  while ((m = rx.exec(src))) {
    const raw = m[1].trim(); if (raw.startsWith('@')) continue;
    for (const sel of splitTop(raw)) { const s = sel.trim(); if (!re.test(s)) continue; const subj = subjectOf(s); if (/^\*/.test(subj) && !/^\*[.#[]/.test(subj)) hits.push(s.slice(0, 120)); }
  }
  return hits;
};
const hasHits = cssFiles.flatMap((f) => scanCssBy(fs.readFileSync(f, 'utf8'), HAS).map((h) => `${path.basename(f)}: ${h}`));
const oldHasHits = scanCssBy(OLD_HAS, HAS);
// KF-SPEC: each rule the fix rewrote keeps T2's specificity. A selector's specificity [ids, classes/attributes/pseudo-classes, types]; :is/:not/:has
// take their most specific argument, :where none, a pseudo-element counts as a type
const cmp3 = (x, y) => (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]);
const spec = (s) => {
  let a = 0, b = 0, c = 0, i = 0;
  const word = () => { while (i < s.length && /[\w-]/.test(s[i])) i += 1; };
  while (i < s.length) {
    const ch = s[i];
    if (ch === '#') { a += 1; i += 1; word(); }
    else if (ch === '.') { b += 1; i += 1; word(); }
    else if (ch === '[') { b += 1; let d = 1; i += 1; while (i < s.length && d) { if (s[i] === '[') d += 1; if (s[i] === ']') d -= 1; i += 1; } }
    else if (ch === ':' && s[i + 1] === ':') { c += 1; i += 2; word(); }
    else if (ch === ':') {
      i += 1; const st = i; word(); const name = s.slice(st, i);
      if (s[i] === '(') {
        let d = 1, j = i + 1; while (j < s.length && d) { if (s[j] === '(') d += 1; if (s[j] === ')') d -= 1; j += 1; }
        const inner = s.slice(i + 1, j - 1); i = j;
        if (name === 'where') continue;
        if (['is', 'not', 'has', 'matches'].includes(name)) { const m = splitTop(inner).map((x) => spec(x.trim().replace(/^[>+~]\s*/, ''))).reduce((best, x) => (cmp3(x, best) > 0 ? x : best), [0, 0, 0]); a += m[0]; b += m[1]; c += m[2]; }
        else b += 1;
      } else b += 1;
    }
    else if (/[a-zA-Z]/.test(ch)) { c += 1; word(); }
    else i += 1;
  }
  return [a, b, c];
};
const selOf = (rule) => rule.slice(0, rule.lastIndexOf('{')).trim();
const ARBOR_CSS = fs.readFileSync(path.join(HERE, '..', '..', 'src', 'styles', 'arbor-v2.css'), 'utf8');
const inQuery = (name) => { const i = ARBOR_CSS.indexOf(`@container style(${name}: on){`); if (i < 0) return null; const rest = ARBOR_CSS.slice(ARBOR_CSS.indexOf('{', i) + 1); return rest.slice(0, rest.indexOf('{')).trim(); };
const SPEC_PAIRS = [['the bars\' dim', selOf(OLD_RULES[0]), inQuery('--arbor2-bar-dim')], ['the hooks\' lettering', selOf(OLD_RULES[1]), inQuery('--arbor2-hook-lt')], ['the Tutor drawer\'s direction', selOf(OLD_HAS), inQuery('--arbor2-tutor-rtl')]]
  .map(([what, was, now]) => ({ what, was: spec(was), now: now ? spec(now) : null, nowSel: now ? now.slice(0, 90) : null }));
// the calculator's own liveness: known values, and one [data-arbor2] fewer must read lower
const SPEC_SELF = [
  JSON.stringify(spec(":root[data-arbor2][data-theme='plateau'] .desk-frame-stage:not(:has(.mode-pagecol[data-zoom='true'])) .wz-tutor-panel > *")) === '[0,7,0]',
  JSON.stringify(spec('div#a.b:hover::before :where(.x) :is(.c, #d)')) === '[2,2,2]',
  cmp3(spec(":root[data-arbor2][data-theme='plateau'] .wz-tutor-panel > *"), spec(":root[data-arbor2][data-arbor2][data-theme='plateau'] .wz-tutor-panel > *")) < 0,
];

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
const SNAP = `(() => { const r = []; const g = window.__kfOrig || getComputedStyle; for (const el of document.querySelectorAll('body *')) { const cs = g.call(window, el); r.push(cs.opacity + '|' + cs.color + '|' + cs.direction); } return r; })()`;   // (+ direction, Nov 12: the Tutor drawer's rule)
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
  } else if (mode === 'oldhas') {
    // T2's rule 642 in place of the fix's Tutor-drawer style query (the inserted rule is remembered, for 'unins')
    const OLD_HAS = ${JSON.stringify(OLD_HAS)};
    window.__kfIns = window.__kfIns || []; out.containers = 0; out.inserted = 0;
    for (let i = sh.cssRules.length - 1; i >= 0; i -= 1) { const r = sh.cssRules[i]; if (!(typeof CSSContainerRule !== 'undefined' && r instanceof CSSContainerRule && /--arbor2-tutor-rtl/.test(r.conditionText || r.cssText))) continue; sh.deleteRule(i); out.containers += 1; sh.insertRule(OLD_HAS, i); window.__kfIns.push(sh.cssRules[i]); out.inserted += 1; }
    out.tutorProp = unprop('--arbor2-tutor-rtl');
  } else if (mode === 'unins') {
    let n = 0; for (const r of window.__kfIns || []) { const i = [...sh.cssRules].indexOf(r); if (i >= 0) { sh.deleteRule(i); n += 1; } } window.__kfIns = []; out.removed = n;
  } else if (mode === 'mutlookhas') {
    out.tutorProp = unprop('--arbor2-tutor-rtl');
  } else if (mode === 'nofade') {
    // the fix's --fade-dur on the shade layers taken out (MUT-KF-FLIP-FADE)
    out.deleted = del((r) => r instanceof CSSStyleRule && r.style.getPropertyValue('--fade-dur').trim() !== '' && /arbor2-pergola/.test(r.selectorText) && /arbor2-pagesh/.test(r.selectorText));
  } else if (mode === 'mutlookhasB') {
    // MUT-KF-LOOK-HAS-B: the Tutor panel's custom property overridden by an INSERTED rule (a rule insertion re-styles the page, as every other edit
    // here; run 43299418991 showed a declaration removed through the CSSOM left the drawer's child where it was)
    sh.insertRule(':root:root:root:root:root:root:root:root:root .wz-tutor-panel{ --arbor2-tutor-rtl: off; }', sh.cssRules.length); out.inserted = 1;
  } else if (mode === 'notutorq') {
    // MUT-KF-LOOK-HAS-DYN: the Tutor drawer's style query taken out
    out.containers = del((r) => typeof CSSContainerRule !== 'undefined' && r instanceof CSSContainerRule && /--arbor2-tutor-rtl/.test(r.conditionText || r.cssText));
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
  const measure = async (label, { swap = null, oldRead = false, pre = null } = {}) => {
    await open('day');
    const sw = swap ? await app.evalJs(SWAP(swap)) : null;
    if (swap) await sleep(500);
    await app.evalJs(RECORD);
    if (oldRead) await app.evalJs(OLD_READ);
    if (pre) { await app.evalJs(pre); await sleep(400); }
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
  // the second pass's mutants: T2's rule 642 put back; the shade layers' own --fade-dur taken out
  const mutHas = await measure('mut-has', { swap: 'oldhas' });
  const mutFade = await measure('mut-fade', { swap: 'nofade' });
  // information (the third pass, Nov 12): run 43299418991 left ONE whole-document restyle (1099, forced by the editor's caret effect) right after the
  // dissolve hook writes --fade-dur on <html>. What would take it out: (a) the live shade drawings out of style work before the key (data-live-off,
  // the product's own cut), (b) the <html> --fade-dur write held back
  const preLive = await measure('info-prelive', { pre: "(() => { document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh').forEach((l) => l.setAttribute('data-live-off', 'true')); return true; })()" });
  const noRootFade = await measure('info-noroot-fade', { pre: "(() => { const de = document.documentElement; const orig = CSSStyleDeclaration.prototype.setProperty; CSSStyleDeclaration.prototype.setProperty = function (n, v, p) { if (this === de.style && n === '--fade-dur') { window.__kfHeld = (window.__kfHeld || 0) + 1; return; } return orig.call(this, n, v, p); }; return true; })()" });
  const heldFade = await app.evalJs('window.__kfHeld || 0');
  for (const m of [preLive, noRootFade]) console.log(`KF-ATTRIB ${m.label} restyles: ` + JSON.stringify((m.tr && m.tr.keyEls) != null ? { keyEls: m.tr.keyEls, forcedEls: m.tr.forcedEls, forcedMs: m.tr.forcedMs, keyTaskMs: m.tr.keyTaskMs } : m.tr));
  console.log(`KF-ATTRIB info-noroot-fade: --fade-dur writes on <html> held back: ${heldFade}`);

  // the Tutor drawer's direction (day room; the rule is not the night's): the fix against T2's rule 642, its coverage, and the mutant
  // (Nov 12, run 43304604030: this fixture's page opens IN the Typewriter zoom - data-zoom='true' at rest - where rule 642 does not apply, so every
  // Tutor-drawer read before this was blind. Each read now starts with the zoom OFF as the product sets it (ModeStage: data-zoom absent), waits, and
  // reads the panel and its child, so the premise - the rule applies - is proven on the read itself)
  const SETZ = (on) => `(() => { const c = document.querySelector('.mode-pagecol'); if (!c) return { err: 'no .mode-pagecol' }; if (${on}) c.setAttribute('data-zoom', 'true'); else c.removeAttribute('data-zoom'); return true; })()`;
  const PANEL = `(() => { const c = document.querySelector('.mode-pagecol'); const p = document.querySelector('.wz-tutor-panel'); const k = p && p.firstElementChild; return { zoom: c ? c.getAttribute('data-zoom') : 'no pagecol', panel: p ? getComputedStyle(p).direction : null, kid: k ? getComputedStyle(k).direction : null }; })()`;
  const openUnzoomed = async () => { await open('day'); await app.evalJs(NOTRANS); await app.evalJs(SETZ(false)); await sleep(300); return app.evalJs(PANEL); };
  const lh = {};
  lh.z1 = await openUnzoomed();
  lh.fix = await app.evalJs(SNAP); await sleep(200); lh.fix2 = await app.evalJs(SNAP); lh.kFix = await app.evalJs(PANEL);
  lh.swapOld = await app.evalJs(SWAP('oldhas')); await sleep(200);
  lh.old = await app.evalJs(SNAP); lh.kOld = await app.evalJs(PANEL);
  lh.swapUn = await app.evalJs(SWAP('unins')); await sleep(200);
  lh.none = await app.evalJs(SNAP); lh.kNone = await app.evalJs(PANEL);
  lh.z2 = await openUnzoomed();
  lh.swapMut = await app.evalJs(SWAP('mutlookhas')); await sleep(200);
  lh.mut = await app.evalJs(SNAP);
  lh.swapMutOld = await app.evalJs(SWAP('oldhas')); await sleep(200);
  lh.mutOld = await app.evalJs(SNAP);
  lh.panelKids = await app.evalJs("document.querySelectorAll('.wz-tutor-panel > *').length");
  // MUT-KF-LOOK-HAS-B/C: the panel's property overridden by an inserted rule, against T2's rule
  lh.z3 = await openUnzoomed();
  lh.swapMutB = await app.evalJs(SWAP('mutlookhasB')); await sleep(200);
  lh.mutB = await app.evalJs(SNAP); lh.kMutB = await app.evalJs(PANEL);
  lh.swapMutBOld = await app.evalJs(SWAP('oldhas')); await sleep(200);
  lh.mutBOld = await app.evalJs(SNAP);
  // KF-LOOK-HAS-DYN(-B): the product's own transition - the Typewriter zoom on, then off (data-zoom on .mode-pagecol, which the :has() reads) - and the
  // drawer comes back exactly as it was: the style query follows the panel's property both ways (its mutant: the query taken out)
  // (each element's name, in SNAP's order, so a reading that moves across the cycle is named - run 43310873472 reported "1 differ" unnamed)
  const NAMES = `(() => [...document.querySelectorAll('body *')].map((el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/ +/).slice(0, 3).join('.') : '')))()`;
  const dyn = async (mut, swap = null) => {
    const d = { z: await openUnzoomed() };
    d.mut = mut ? await app.evalJs(SWAP('notutorq')) : null;
    d.swap = swap ? await app.evalJs(SWAP(swap)) : null; await sleep(200);
    d.a = await app.evalJs(SNAP); d.at = await app.evalJs(PANEL);
    d.on = await app.evalJs(SETZ(true)); await sleep(300);
    d.onRead = await app.evalJs(PANEL);
    d.off = await app.evalJs(SETZ(false)); await sleep(300);
    d.b = await app.evalJs(SNAP); d.bt = await app.evalJs(PANEL);
    d.names = await app.evalJs(NAMES);
    d.moved = d.a && d.b && d.names && d.a.length === d.b.length && d.names.length === d.a.length
      ? d.a.map((x, i) => (x !== d.b[i] ? `${d.names[i]}: ${x} -> ${d.b[i]}` : null)).filter(Boolean) : null;
    return d;
  };
  lh.dyn = await dyn(false);
  lh.dynMut = await dyn(true);
  lh.dynOld = await dyn(false, 'oldhas');   // the same cycle under T2's rule 642 (KF-LOOK-HAS-DYN-C)

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
  const mH = unstable(lh.fix, lh.fix2);
  const LH = { n: lh.fix.length, unstable: mH ? mH.filter(Boolean).length : null, panelKids: lh.panelKids, fixVsOld: mH ? diff(lh.fix, lh.old, mH) : null, coverage: mH ? diff(lh.old, lh.none, mH) : null,
    mutVsOld: diff(lh.mut, lh.mutOld), swaps: { old: lh.swapOld, un: lh.swapUn, mut: lh.swapMut, mutOld: lh.swapMutOld } };
  console.log('KF LOOK-HAS: ' + JSON.stringify(LH));
  console.log('KF SCAN-HAS: ' + JSON.stringify({ hits: hasHits, oldHits: oldHasHits.length }) + ' | KF SPEC: ' + JSON.stringify({ pairs: SPEC_PAIRS, self: SPEC_SELF }));

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
  // ---- the second pass (Nov 12): T2's rule 642 (a universal subject under a :has()) and the --fade-dur write's reach into the shade ----
  // PARKED 2026-11-12 (SUPERSEDED by KF-SWAPS-3 - Actions run 43299418991: the shade layers' own --fade-dur did not stop the <html> write's restyle
  // (1099 elements with it, 1095 without: an inherited custom property re-styles the subtree under a changed parent even where a child sets its own);
  // the rule is taken out of the fix, so mut-fade's edit has nothing to take out). Original, verbatim:
  // ok(`KF-SWAPS-2 the second pass's page edits landed: T2's rule 642 in place of the Tutor drawer's style query (mut-has, and both look reads), the shade layers' --fade-dur taken out (mut-fade)`,
  //   mutHas.swap && mutHas.swap.containers === 1 && mutHas.swap.inserted === 1 && mutHas.swap.tutorProp === 1 && mutFade.swap && mutFade.swap.deleted === 1
  //     && lh.swapOld.inserted === 1 && lh.swapUn.removed === 1 && lh.swapMut.tutorProp === 1 && lh.swapMutOld.inserted === 1,
  //   JSON.stringify({ mutHas: mutHas.swap, mutFade: mutFade.swap, look: LH.swaps }));
  ok(`KF-SWAPS-3 the page edits landed: T2's rule 642 in place of the Tutor drawer's style query (mut-has, the look reads), the override inserted (MUT-KF-LOOK-HAS-B), the query taken out (the zoom mutant)`,
    mutHas.swap && mutHas.swap.containers === 1 && mutHas.swap.inserted === 1 && mutHas.swap.tutorProp === 1
      && lh.swapOld.inserted === 1 && lh.swapUn.removed === 1 && lh.swapMutB.inserted === 1 && lh.swapMutBOld.inserted === 1 && lh.dynMut.mut && lh.dynMut.mut.containers === 1,
    JSON.stringify({ mutHas: mutHas.swap, look: LH.swaps, mutB: lh.swapMutB, mutBOld: lh.swapMutBOld, dynMut: lh.dynMut.mut }));
  ok(`MUT-KF-FLIP-HAS with T2's rule 642 put back in the running page, KF-FLIP is RED (printed: ${mutHas.tr.keyEls}/${mutHas.before.docEls})`,
    mutHas.tr && mutHas.tr.keyEls != null && !flipOk(mutHas), JSON.stringify({ tr: mutHas.tr, docEls: mutHas.before.docEls }));
  // PARKED 2026-11-12 (SUPERSEDED, no successor - its premise is falsified, Actions run 43299418991: the shade layers' own --fade-dur did not stop the
  // restyle (fix 1099, mutant 1095), so the rule it guarded is taken out of the fix). Original, verbatim:
  // ok(`MUT-KF-FLIP-FADE with the shade layers' own --fade-dur taken out, KF-FLIP is RED (printed: ${mutFade.tr.keyEls}/${mutFade.before.docEls})`,
  //   mutFade.tr && mutFade.tr.keyEls != null && !flipOk(mutFade), JSON.stringify({ tr: mutFade.tr, docEls: mutFade.before.docEls }));
  // PARKED 2026-11-12 (SUPERSEDED by KF-LOOK-HAS-B - BLIND, Actions run 43304604030: the fixture's page opens in the Typewriter zoom (data-zoom='true'),
  // where rule 642 does not apply, so the fix and T2 agreed by default; its "coverage 1" was not the drawer's child, which read ltr in every state).
  // Original, verbatim:
  // ok(`KF-LOOK-HAS every element's computed opacity, colour and direction are the same with the fix as with T2's rule 642 (${LH.n} elements, ${LH.fixVsOld} differ); and T2's rule, taken out, changes ${LH.coverage} of them (coverage, 1 or more; ${LH.panelKids} in the Tutor drawer)`,
  //   LH.n > 0 && LH.fixVsOld === 0 && LH.coverage >= 1, JSON.stringify(LH));
  const kidOf = (r) => (r && r.kid) || null;
  ok(`KF-LOOK-HAS-B with the zoom OFF (the panel reads ${lh.z1 && lh.z1.panel}): every element's computed opacity, colour and direction are the same with the fix as with T2's rule 642 (${LH.n} elements, ${LH.fixVsOld} differ); and T2's rule, taken out, changes ${LH.coverage} of them, the drawer's child among them (${kidOf(lh.kOld)} -> ${kidOf(lh.kNone)})`,
    !!lh.z1 && lh.z1.panel === 'rtl' && lh.z1.zoom === null && LH.n > 0 && LH.fixVsOld === 0 && LH.coverage >= 1 && kidOf(lh.kFix) === 'ltr' && kidOf(lh.kOld) === 'ltr' && kidOf(lh.kNone) === 'rtl',
    JSON.stringify({ z1: lh.z1, kFix: lh.kFix, kOld: lh.kOld, kNone: lh.kNone, LH }));
  // PARKED 2026-11-12 (SUPERSEDED by MUT-KF-LOOK-HAS-B - an instrument fault, Actions run 43299418991: the property removed through the CSSOM
  // (removeProperty on the rule) left the drawer's child as it was, 0 differ; a rule insertion is the edit every other read here uses). Original, verbatim:
  // ok(`MUT-KF-LOOK-HAS the Tutor drawer's custom property taken away: KF-LOOK-HAS is RED (${LH.mutVsOld} elements differ from T2's rule)`,
  //   lh.swapMut.tutorProp === 1 && LH.mutVsOld >= 1, JSON.stringify(LH));
  const mutBDiff = diff(lh.mutB, lh.mutBOld);
  // PARKED 2026-11-12 (SUPERSEDED by MUT-KF-LOOK-HAS-C - BLIND, run 43304604030: read in the zoom, where the rule does not apply). Original, verbatim:
  // ok(`MUT-KF-LOOK-HAS-B the Tutor panel's custom property overridden (an inserted rule): KF-LOOK-HAS is RED (${mutBDiff} elements differ from T2's rule)`,
  //   lh.swapMutB.inserted === 1 && mutBDiff >= 1, JSON.stringify({ mutBDiff, mutB: lh.swapMutB }));
  ok(`MUT-KF-LOOK-HAS-C with the zoom OFF (the panel reads ${lh.z3 && lh.z3.panel}), the Tutor panel's custom property overridden (an inserted rule): KF-LOOK-HAS-B is RED (${mutBDiff} elements differ from T2's rule; the drawer's child reads ${kidOf(lh.kMutB)})`,
    !!lh.z3 && lh.z3.panel === 'rtl' && lh.swapMutB.inserted === 1 && mutBDiff >= 1 && kidOf(lh.kMutB) === 'rtl', JSON.stringify({ z3: lh.z3, mutBDiff, kMutB: lh.kMutB, mutB: lh.swapMutB }));
  const dynOk = (d) => !!d && d.at && d.at.panel === 'rtl' && d.onRead && d.onRead.zoom === 'true' && d.onRead.panel !== 'rtl' && d.bt && d.bt.panel === 'rtl' && diff(d.a, d.b) === 0;
  // PARKED 2026-11-12 (SUPERSEDED by KF-LOOK-HAS-DYN-B and its mutant - BLIND, run 43304604030: the "off" restored the zoom the page OPENED in,
  // data-zoom='true', so the panel never read rtl and the child read ltr in every state). Original, verbatim:
  // ok(`KF-LOOK-HAS-DYN the Typewriter zoom on, then off: the panel turns (rtl -> ${lh.dyn.onRead && lh.dyn.onRead.panel} -> ${lh.dyn.bt && lh.dyn.bt.panel}) and every element reads as it did before (${diff(lh.dyn.a, lh.dyn.b)} differ; the drawer's child ${lh.dyn.at && lh.dyn.at.kid} -> ${lh.dyn.bt && lh.dyn.bt.kid})`,
  //   dynOk(lh.dyn), JSON.stringify({ at: lh.dyn.at, onRead: lh.dyn.onRead, bt: lh.dyn.bt, diff: diff(lh.dyn.a, lh.dyn.b) }));
  // ok(`MUT-KF-LOOK-HAS-DYN with the drawer's style query taken out, KF-LOOK-HAS-DYN's reading changes: the child reads ${lh.dynMut.bt && lh.dynMut.bt.kid} after the zoom (the fix reads ${lh.dyn.bt && lh.dyn.bt.kid})`,
  //   !!lh.dynMut.bt && !!lh.dyn.bt && lh.dynMut.bt.kid !== lh.dyn.bt.kid, JSON.stringify({ dynMut: { at: lh.dynMut.at, bt: lh.dynMut.bt }, fix: lh.dyn.bt }));
  const dynOkB = (d) => dynOk(d) && kidOf(d.at) === 'ltr' && kidOf(d.bt) === 'ltr' && d.at.zoom === null && d.bt.zoom === null;
  // PARKED 2026-11-12 (SUPERSEDED by KF-LOOK-HAS-DYN-C and its mutant - Actions run 43310873472: the panel and the drawer's child behaved (rtl -> ltr
  // -> rtl; ltr -> ltr), but "every element reads as it did before" read 1 differ, unnamed: a premise wider than the fix - the zoom cycle itself can
  // move an element that rule 642 never touches. The successor names what moves and requires the SAME to move under T2's rule). Original, verbatim:
  // ok(`KF-LOOK-HAS-DYN-B from the zoom OFF, the Typewriter zoom on, then off: the panel turns (${lh.dyn.at && lh.dyn.at.panel} -> ${lh.dyn.onRead && lh.dyn.onRead.panel} -> ${lh.dyn.bt && lh.dyn.bt.panel}), the drawer's child holds ltr (${kidOf(lh.dyn.at)} -> ${kidOf(lh.dyn.bt)}) and every element reads as it did before (${diff(lh.dyn.a, lh.dyn.b)} differ)`,
  //   dynOkB(lh.dyn), JSON.stringify({ at: lh.dyn.at, onRead: lh.dyn.onRead, bt: lh.dyn.bt, diff: diff(lh.dyn.a, lh.dyn.b) }));
  // ok(`MUT-KF-LOOK-HAS-DYN-B with the drawer's style query taken out, KF-LOOK-HAS-DYN-B is RED (the child reads ${kidOf(lh.dynMut.at)} -> ${kidOf(lh.dynMut.bt)})`,
  //   !!lh.dynMut.mut && lh.dynMut.mut.containers === 1 && !dynOkB(lh.dynMut), JSON.stringify({ dynMut: { mut: lh.dynMut.mut, at: lh.dynMut.at, bt: lh.dynMut.bt } }));
  // the reading that moves across the cycle, by name (index-free: the two pages are separate documents)
  const movedSet = (d) => (d && d.moved ? [...new Set(d.moved)].sort() : null);
  const sameMoved = (d, ref) => !!movedSet(d) && !!movedSet(ref) && JSON.stringify(movedSet(d)) === JSON.stringify(movedSet(ref));
  const panelOk = (d) => !!d && d.at && d.at.zoom === null && d.at.panel === 'rtl' && d.onRead && d.onRead.zoom === 'true' && d.onRead.panel !== 'rtl' && d.bt && d.bt.zoom === null && d.bt.panel === 'rtl'
    && kidOf(d.at) === 'ltr' && kidOf(d.bt) === 'ltr';
  ok(`KF-LOOK-HAS-DYN-C from the zoom OFF, the Typewriter zoom on, then off: the panel turns (${lh.dyn.at && lh.dyn.at.panel} -> ${lh.dyn.onRead && lh.dyn.onRead.panel} -> ${lh.dyn.bt && lh.dyn.bt.panel}), the drawer's child holds ltr (${kidOf(lh.dyn.at)} -> ${kidOf(lh.dyn.bt)}), and what moves across the cycle is what moves under T2's rule 642 (fix: ${JSON.stringify(movedSet(lh.dyn))}; T2: ${JSON.stringify(movedSet(lh.dynOld))})`,
    panelOk(lh.dyn) && panelOk(lh.dynOld) && lh.dynOld.swap && lh.dynOld.swap.inserted === 1 && sameMoved(lh.dyn, lh.dynOld),
    JSON.stringify({ fix: { at: lh.dyn.at, onRead: lh.dyn.onRead, bt: lh.dyn.bt, moved: lh.dyn.moved }, t2: { swap: lh.dynOld.swap, at: lh.dynOld.at, bt: lh.dynOld.bt, moved: lh.dynOld.moved } }));
  ok(`MUT-KF-LOOK-HAS-DYN-C with the drawer's style query taken out, KF-LOOK-HAS-DYN-C is RED (the child reads ${kidOf(lh.dynMut.at)} -> ${kidOf(lh.dynMut.bt)})`,
    !!lh.dynMut.mut && lh.dynMut.mut.containers === 1 && !(panelOk(lh.dynMut) && sameMoved(lh.dynMut, lh.dynOld)), JSON.stringify({ dynMut: { mut: lh.dynMut.mut, at: lh.dynMut.at, bt: lh.dynMut.bt, moved: lh.dynMut.moved } }));
  ok(`KF-SCAN-HAS no selector in src/**/*.css has a universal subject under a :has() (${hasHits.length}); the scanner finds T2's rule 642 (${oldHasHits.length} of 1, liveness)`,
    hasHits.length === 0 && oldHasHits.length === 1, JSON.stringify({ hasHits, oldHasHits }));
  ok(`KF-SPEC every rule the fix rewrote keeps T2's specificity (${SPEC_PAIRS.map((p) => `${p.what} ${JSON.stringify(p.was)} -> ${JSON.stringify(p.now)}`).join('; ')}); the calculator reads known values and sees one attribute fewer (liveness)`,
    SPEC_PAIRS.every((p) => p.now && cmp3(p.was, p.now) === 0) && SPEC_SELF.every(Boolean), JSON.stringify({ SPEC_PAIRS, SPEC_SELF }));
  console.log('KF READINGS: ' + JSON.stringify([...all, mutHas, mutFade, preLive, noRootFade].map((m) => ({ label: m.label, keyEls: m.tr.keyEls, keyElsMs: m.tr.keyElsMs, forced: m.tr.keyElsForced, forcedEls: m.tr.forcedEls, forcedMs: m.tr.forcedMs, keyTaskMs: m.tr.keyTaskMs, docEls: m.before.docEls, liveEls: m.before.liveEls, readsInKey: m.rec.inKey.length }))));
  console.log('KF BUNDLE: ' + fix[0].before.bundle);
}, { label: 'arbor-keyflip' });

const WANT_CHECKS = 18;   // a check that never ran is a failure, never a quiet pass (10, + 7 for the second pass, + 1 for the third, Nov 12)
const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const pass = checks.length === WANT_CHECKS && !failed.length;
console.log(pass ? `\nARBOR-KEYFLIP VERIFY: PASS (${checks.length} checks)` : `\nARBOR-KEYFLIP VERIFY: FAIL - ${failed.length}/${checks.length} failed${checks.length !== WANT_CHECKS ? ` (${checks.length} of ${WANT_CHECKS} checks ran)` : ''}`);
process.exit(pass ? 0 : 1);
