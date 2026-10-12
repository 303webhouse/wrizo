// THE DRAWER GHOST (Nick, Oct 10; live main). While writing, a faint "ghost" of the LEFT drawer's contents (TYPEFACE / FORMAT / TEMPLATES /
// PAGE KIND) showed with the drawer CLOSED: the writing dissolve (`.desk-frame[data-writing='true'] .desk-dissolve{opacity:var(--fade-min)}`,
// specificity 0,3,0) out-specified the closed panel's own `opacity:0` (0,1,0), so a closed panel was parked at the DIMMED level instead of
// hidden. The ruling: a closed drawer is hidden WHATEVER THE DISSOLVE SAYS.
//
// Browserless. It does not trust a spot-read of two selectors: it runs a small CSS CASCADE over the real index.css (specificity, source order,
// !important, @media prefers-reduced-motion) for an element that looks like each closed/open panel inside each dissolve context, and asserts what
// WINS. A control runs the same evaluator over the CSS of the commit BEFORE the fix and must see the ghost - otherwise the instrument is blind.
//
// Run: node scripts/harness/drawer-ghost.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const read = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const sh = (cmd) => { try { return execSync(cmd, { cwd: DESKTOP, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };

// ---- a small cascade: parse -> match -> specificity -> winner ------------------------------------------------------------------
function parseRules(css, reduced) {
  const text = noCR(css).replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = []; let order = 0;
  const walk = (src, inReduced) => {
    let i = 0;
    while (i < src.length) {
      const open = src.indexOf('{', i);
      if (open < 0) break;
      const head = src.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (j < src.length && depth > 0) { if (src[j] === '{') depth += 1; else if (src[j] === '}') depth -= 1; j += 1; }
      const body = src.slice(open + 1, j - 1);
      i = j;
      if (head.startsWith('@')) {
        if (/^@media/.test(head) && /prefers-reduced-motion\s*:\s*reduce/.test(head) && reduced) walk(body, true);
        continue;   // every other at-rule (other @media, @keyframes, @supports, @font-face) is outside the claim
      }
      const decls = new Map();
      for (const d of body.split(';')) {
        const k = d.indexOf(':'); if (k < 0) continue;
        const prop = d.slice(0, k).trim().toLowerCase(); let value = d.slice(k + 1).trim(); if (!prop) continue;
        const important = /!important\s*$/.test(value); value = value.replace(/\s*!important\s*$/, '');
        decls.set(prop, { value, important });
      }
      for (const sel of splitTop(head, ',')) rules.push({ sel: sel.trim(), decls, order: order++ });
    }
  };
  walk(text, false);
  return rules;
}
function splitTop(s, sep) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth += 1; else if (ch === ')' || ch === ']') depth -= 1;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
}
// a selector -> compounds, left to right (every combinator is read as "some ancestor" - a conservative approximation)
function compoundsOf(sel) {
  const parts = []; let depth = 0, cur = '';
  for (const ch of sel) {
    if (ch === '(' || ch === '[') depth += 1; else if (ch === ')' || ch === ']') depth -= 1;
    if (depth === 0 && (/\s/.test(ch) || ch === '>' || ch === '+' || ch === '~')) { if (cur) parts.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) parts.push(cur);
  return parts.map(parseCompound);
}
function parseCompound(c) {
  const m = { classes: [], attrs: [], nots: [], unsupported: false, a: 0, b: 0, c: 0 };
  let i = 0;
  while (i < c.length) {
    const ch = c[i];
    if (ch === '.') { const r = /^\.([\w-]+)/.exec(c.slice(i)); if (!r) { m.unsupported = true; break; } m.classes.push(r[1]); m.b += 1; i += r[0].length; }
    else if (ch === '#') { const r = /^#([\w-]+)/.exec(c.slice(i)); if (!r) { m.unsupported = true; break; } m.a += 1; i += r[0].length; }
    else if (ch === '[') {
      const end = c.indexOf(']', i); const r = /^\[\s*([\w-]+)\s*(?:=\s*(?:'([^']*)'|"([^"]*)"|([^\]\s]+)))?\s*\]$/.exec(c.slice(i, end + 1));
      if (!r) { m.unsupported = true; break; }
      m.attrs.push({ name: r[1], value: r[2] ?? r[3] ?? r[4] ?? null }); m.b += 1; i = end + 1;
    }
    else if (c.startsWith(':not(', i)) {
      let depth = 1, j = i + 5; while (j < c.length && depth > 0) { if (c[j] === '(') depth += 1; else if (c[j] === ')') depth -= 1; j += 1; }
      const inner = parseCompound(c.slice(i + 5, j - 1));
      if (inner.unsupported) { m.unsupported = true; break; }
      m.nots.push(inner); m.a += inner.a; m.b += inner.b; m.c += inner.c; i = j;
    }
    else if (ch === ':') { m.unsupported = true; break; }   // :hover, ::before, :where ... - never a drawer's resting state
    else if (ch === '*') i += 1;
    else { const r = /^[\w-]+/.exec(c.slice(i)); if (!r) { m.unsupported = true; break; } m.c += 1; i += r[0].length; }
  }
  return m;
}
const matches = (cm, el) => !cm.unsupported
  && cm.classes.every((k) => el.classes.includes(k))
  && cm.attrs.every((a) => (a.value === null ? el.attrs[a.name] !== undefined : el.attrs[a.name] === a.value))
  && cm.nots.every((n) => !matches(n, el));
function selectorMatches(comps, el, ancestors) {
  if (!comps.length) return false;
  if (!matches(comps[comps.length - 1], el)) return false;
  let ai = ancestors.length - 1;   // nearest ancestor first
  for (let k = comps.length - 2; k >= 0; k -= 1) {
    while (ai >= 0 && !matches(comps[k], ancestors[ai])) ai -= 1;
    if (ai < 0) return false;
    ai -= 1;
  }
  return true;
}
function cascade(rules, el, ancestors) {
  const won = {};
  for (const r of rules) {
    const comps = compoundsOf(r.sel);
    if (!selectorMatches(comps, el, ancestors)) continue;
    const spec = comps.reduce((s, c) => [s[0] + c.a, s[1] + c.b, s[2] + c.c], [0, 0, 0]);
    for (const [prop, d] of r.decls) {
      const rank = [d.important ? 1 : 0, ...spec, r.order];
      const cur = won[prop];
      if (!cur || cmp(rank, cur.rank) > 0) won[prop] = { value: d.value, rank, sel: r.sel };
    }
  }
  return won;
}
const cmp = (x, y) => { for (let i = 0; i < x.length; i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };

// ---- the elements: each panel as the app renders it, in each dissolve context --------------------------------------------------
const SLIVER_CLASSES = ['wz-sliver-panel', 'chrome-fade', 'desk-dissolve'];
const TUTOR_CLASSES = ['wz-tutor-panel'];
function panel(kind, open, hold = false) {
  const attrs = { 'data-open': open ? 'true' : 'false' };
  if (kind === 'sliver') attrs['data-popout-hold'] = hold ? 'true' : 'false'; else attrs['data-docked'] = 'false';
  return { classes: kind === 'sliver' ? SLIVER_CLASSES : TUTOR_CLASSES, attrs };
}
function chain(kind, open, ctx) {
  const a = [{ classes: ['desk-frame'], attrs: ctx.writing ? { 'data-writing': 'true' } : { 'data-writing': 'false' } }];
  if (ctx.receded) a.push({ classes: [], attrs: { 'data-chrome-receded': 'true' } });
  a.push(kind === 'sliver'
    ? { classes: ['desk-frame-sliver-anchor', 'wz-sliver'], attrs: { 'data-open': open ? 'true' : 'false' } }
    : { classes: ['desk-frame-tutor-anchor', 'wz-tutor-zone'], attrs: {} });
  return a;
}
const CONTEXTS = [
  { name: 'writing frame', writing: true, receded: false },
  { name: 'receded chrome', writing: false, receded: true },
  { name: 'writing AND receded', writing: true, receded: true },
  { name: 'neither (resting)', writing: false, receded: false },
];
function evalPanel(rules, kind, open, ctx, hold = false) {
  return cascade(rules, panel(kind, open, hold), chain(kind, open, ctx));
}

const css = read('index.css');
const rulesNow = parseRules(css, false), rulesReduced = parseRules(css, true);

// =============================================================================
// THE CONTROL - the evaluator must SEE the ghost on the CSS from before the fix (d2fcb381 = main when Nick reported it).
// =============================================================================
const BEFORE = 'd2fcb381';
const cssBefore = sh(`git show ${BEFORE}:apps/desktop/src/index.css`);
{
  if (cssBefore === null) ok('(G0) control: the pre-fix CSS is readable from git', false, `git show ${BEFORE} failed`);
  else {
    const r = parseRules(cssBefore, false);
    const w = evalPanel(r, 'sliver', false, CONTEXTS[0]);
    ok('(G0) CONTROL - on the pre-fix CSS the evaluator sees the ghost: a CLOSED left panel in a writing frame wins the DIMMED opacity (var(--fade-min,...)), not 0, and is not hidden',
      /fade-min/.test(w.opacity?.value ?? '') && w.visibility?.value !== 'hidden', JSON.stringify({ opacity: w.opacity, visibility: w.visibility }));
  }
}

// =============================================================================
// THE CLAIMS
// =============================================================================
function closedHidden(rules, kind) {
  const bad = [];
  for (const ctx of CONTEXTS) {
    const w = evalPanel(rules, kind, false, ctx);
    if (w.visibility?.value !== 'hidden') bad.push(`${ctx.name}: visibility=${w.visibility?.value}`);
    if (w.opacity?.value !== '0') bad.push(`${ctx.name}: opacity=${w.opacity?.value}`);
  }
  return bad;
}
function openUntouched(rules) {
  const bad = [];
  for (const kind of ['sliver', 'tutor']) {
    for (const ctx of CONTEXTS) {
      const w = evalPanel(rules, kind, true, ctx);
      if (w.visibility?.value === 'hidden') bad.push(`${kind} open in ${ctx.name}: hidden`);
    }
  }
  const rest = evalPanel(rules, 'sliver', true, CONTEXTS[3]);
  const writing = evalPanel(rules, 'sliver', true, CONTEXTS[0]);
  const held = evalPanel(rules, 'sliver', true, CONTEXTS[0], true);
  const tut = evalPanel(rules, 'tutor', true, CONTEXTS[0]);
  if (rest.opacity?.value !== '1') bad.push(`open at rest opacity=${rest.opacity?.value}`);
  if (!/fade-min/.test(writing.opacity?.value ?? '')) bad.push(`an open, un-held left drawer no longer dissolves while writing: opacity=${writing.opacity?.value}`);
  if (held.opacity?.value !== '1') bad.push(`the pop-out hold no longer holds an open drawer: opacity=${held.opacity?.value}`);
  if (tut.opacity?.value !== '1') bad.push(`an open Tutor changed: opacity=${tut.opacity?.value}`);
  return bad;
}
function closeFades(rules, reducedRules) {
  const out = {};
  for (const kind of ['sliver', 'tutor']) {
    const closed = evalPanel(rules, kind, false, CONTEXTS[0]).transition?.value ?? '';
    const opened = evalPanel(rules, kind, true, CONTEXTS[0]).transition?.value ?? '';
    const redC = evalPanel(reducedRules, kind, false, CONTEXTS[0]).transition?.value ?? '';
    const vis = /visibility\s+0s\s+linear\s+var\(--fade-dur,\s*\.2s\)/.test(closed);
    out[kind] = { closeKeepsFade: /opacity\s+var\(--fade-dur/.test(closed) && vis, openNotClipped: !/visibility/.test(opened), reducedNone: redC === 'none' };
  }
  return out;
}
const claims = (rules = rulesNow, reducedRules = rulesReduced) => ({
  sliverClosed: closedHidden(rules, 'sliver'), tutorClosed: closedHidden(rules, 'tutor'),
  open: openUntouched(rules), fade: closeFades(rules, reducedRules),
});
{
  const c = claims();
  ok('(G1) a CLOSED left drawer is hidden whatever the dissolve says: visibility:hidden AND opacity 0 in every context (writing frame, receded chrome, both, resting)', c.sliverClosed.length === 0, c.sliverClosed.join('; '));
  ok('(G2) the same for the right drawer (the Tutor): hidden and 0 in every context', c.tutorClosed.length === 0, c.tutorClosed.join('; '));
  ok('(G3) an OPEN drawer is untouched: never hidden; at rest opacity 1; the left drawer still dissolves while writing; the pop-out hold still holds it; the Tutor stays at 1', c.open.length === 0, c.open.join('; '));
  ok('(G4) the CLOSE still fades and the OPEN is not clipped: visibility flips only after the opacity transition (same --fade-dur), and an open panel declares no visibility transition',
    ['sliver', 'tutor'].every((k) => c.fade[k].closeKeepsFade && c.fade[k].openNotClipped), JSON.stringify(c.fade));
  ok('(G5) reduced motion: a closed drawer has NO transition (hidden at once), as the old opt-out had it', ['sliver', 'tutor'].every((k) => c.fade[k].reducedNone), JSON.stringify(c.fade));
}
{
  // the markup the CSS keys on: both panels write data-open as the string 'true' / 'false' from the same open state
  const sliver = read('components/Sliver.tsx'), tutor = read('components/Tutor.tsx');
  ok('(G6) the markup: both panels carry data-open={open ? \'true\' : \'false\'}, so the closed rule and the open rules see one state, and the left panel still carries the dissolve classes (the ghost\'s source)',
    /className="wz-sliver-panel chrome-fade desk-dissolve"[^>]*data-open=\{open \? 'true' : 'false'\}/.test(sliver) && /className="wz-tutor-panel"[^>]*data-open=\{open \? 'true' : 'false'\}/.test(tutor));
}

// =============================================================================
// MUTATIONS - each asserts it LANDED before the red is believed.
// =============================================================================
function mutate(text, from, to) { if (!text.includes(from)) throw new Error('mutation anchor missing: ' + from.slice(0, 60)); return text.replace(from, () => to); }
function mutant(name, mutated, expectRed) {
  let res; try { const c = mutated(); res = claims(parseRules(c, false), parseRules(c, true)); } catch (e) {
    if (/mutation anchor missing/.test(String(e))) { ok(`(M) ${name}: THE MUTATION LANDED`, false, 'anchor missing'); return; }
    res = { error: String(e) };
  }
  ok(`(M) ${name}: the proof goes RED`, expectRed(res) === true, JSON.stringify(res).slice(0, 160));
}
const FIX_HEAD = ".wz-sliver-panel:not([data-open='true']),\n.wz-tutor-panel:not([data-open='true']){\n  visibility:hidden;";
mutant('the closed panels are no longer visibility:hidden', () => mutate(css, FIX_HEAD, FIX_HEAD.replace('visibility:hidden;', 'visibility:visible;')), (c) => c.sliverClosed.length > 0 && c.tutorClosed.length > 0);
mutant('the explicit opacity:0 for the dissolve contexts is removed (visibility alone is not the claim)',
  () => mutate(css, "[data-chrome-receded='true'] .wz-tutor-panel:not([data-open='true']){ opacity:0; }", "[data-chrome-receded='true'] .wz-tutor-panel:not([data-open='true']){ opacity:.08; }"), (c) => c.tutorClosed.length > 0);
mutant('the left drawer\'s opacity override loses to the dissolve (drops below 0,3,0)',
  () => mutate(css, ".desk-frame[data-writing='true'] .wz-sliver-panel:not([data-open='true']),\n[data-chrome-receded='true'] .wz-sliver-panel:not([data-open='true']),", ".wz-sliver-panel:not([data-open='true']) + .never,\n.never2,"), (c) => c.sliverClosed.length > 0);
mutant('visibility flips at once (the close no longer fades)', () => mutate(css, 'visibility 0s linear var(--fade-dur,.2s);', 'visibility 0s linear 0s;'), (c) => !(c.fade.sliver.closeKeepsFade && c.fade.tutor.closeKeepsFade));
mutant('the hidden rule also catches an OPEN panel (drops the :not)', () => mutate(css, FIX_HEAD, FIX_HEAD.replace(".wz-sliver-panel:not([data-open='true']),", ".wz-sliver-panel,")), (c) => c.open.length > 0);
mutant('reduced motion keeps the delayed visibility transition', () => mutate(css, ".wz-sliver-panel:not([data-open='true']), .wz-tutor-panel:not([data-open='true']){ transition:none; }", ".wz-sliver-panel:not([data-open='true']), .wz-tutor-panel:not([data-open='true']){ }"), (c) => !(c.fade.sliver.reducedNone && c.fade.tutor.reducedNone));

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' | ' + String(c.detail).slice(0, 300)));
}
console.log(failed === 0 ? `\nDRAWER-GHOST VERIFY: PASS (${checks.length} checks)` : `\nDRAWER-GHOST VERIFY: FAIL — ${failed}/${checks.length}`);
process.exit(failed === 0 ? 0 : 1);
