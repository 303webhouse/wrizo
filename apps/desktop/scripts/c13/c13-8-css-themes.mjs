#!/usr/bin/env node
// #13 step 8 (brief: "the theme regroup"): the Flux, Machina and Arbor rules that sit among component rules move into
// src/styles/themes/{flux,machina,arbor}.css, imported LAST. Moving a rule later changes its cascade order against every rule it
// jumps, so each candidate is checked against every later rule it would jump: a HAZARD is a later rule that is not scoped to
// another theme, shares a property (a shorthand and its longhands count), has a selector of EQUAL specificity and the same
// importance - there, source order alone decided the winner and the move would flip it. A rule with a hazard stays where it is,
// listed with its rivals (raising a specificity to move it anyway is Fable's call, rule by rule). Browserless.
//
//   node apps/desktop/scripts/c13/c13-8-css-themes.mjs census [--json <out>]   every candidate, MOVE or STAY with its rivals
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SRC = path.join(ROOT, 'apps/desktop/src');
// postcss is the build's own parser, reached through vite (no new dependency)
const fromVite = createRequire(createRequire(path.join(ROOT, 'apps/desktop/package.json')).resolve('vite/package.json'));
const postcss = fromVite('postcss');
const arg = (n) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : null);

export const THEME_FILES = new Set(['04-flux.css', '05-machina.css', '06-flux-v2.css']);
// Fable's ruling (b), Nov 2: these files keep each feature's theme dress inside its named zones (the guided paths, Scenes, W5, the
// Machina deck wizard and forms), and their harnesses read those zones whole, so a theme rule in them stays with its feature.
export const FEATURE_FILES = new Set(['18-desk-rail.css', '21-help-me-choose.css']);
const THEMES = { flux: 'flux', machina: 'machina', plateau: 'arbor' };

// the theme a selector is scoped to: a POSITIVE [data-theme=x] (not inside :not()), else null
export function themeOf(sel) {
  const stripped = sel.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, '');
  const m = [...stripped.matchAll(/\[data-theme\s*=\s*['"]?([a-z]+)['"]?\]/g)].map((x) => x[1]);
  const set = [...new Set(m)];
  return set.length === 1 ? set[0] : set.length ? 'mixed' : null;
}

// specificity [ids, classes+attrs+pseudo-classes, types+pseudo-elements]
export function specificity(sel) {
  let s = sel.trim();
  let ids = 0, cls = 0, typ = 0;
  // functional pseudo-classes: :where() is 0; :not/:is/:has take the most specific argument
  const fn = /:(where|not|is|has|matches)\(((?:[^()]|\([^()]*\))*)\)/;
  let m;
  while ((m = fn.exec(s))) {
    if (m[1] !== 'where') {
      const best = m[2].split(',').map(specificity).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0] || [0, 0, 0];
      ids += best[0]; cls += best[1]; typ += best[2];
    }
    s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length);
  }
  s = s.replace(/\[[^\]]*\]/g, () => { cls++; return ' '; });
  s = s.replace(/::[a-z-]+(\([^)]*\))?/gi, () => { typ++; return ' '; });
  s = s.replace(/:(before|after|first-line|first-letter)\b/gi, () => { typ++; return ' '; });
  s = s.replace(/:[a-z-]+(\([^)]*\))?/gi, () => { cls++; return ' '; });
  s = s.replace(/#[\w-]+/g, () => { ids++; return ' '; });
  s = s.replace(/\.[\w-]+/g, () => { cls++; return ' '; });
  s = s.replace(/(^|[\s>+~(])([a-z][\w-]*)/gi, (all, p) => { typ++; return p; });
  return [ids, cls, typ];
}
const eqSpec = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

const SHORT = { inset: ['top', 'right', 'bottom', 'left'], gap: ['row-gap', 'column-gap'], 'place-items': ['align-items', 'justify-items'],
  'place-content': ['align-content', 'justify-content'], 'place-self': ['align-self', 'justify-self'], font: ['line-height'], all: ['*'] };
export function overlaps(a, b) {
  if (a === b) return true;
  if (a.startsWith('--') || b.startsWith('--')) return false;
  if (a === 'all' || b === 'all') return true;
  if (a.startsWith(b + '-') || b.startsWith(a + '-')) return true;
  return (SHORT[a] || []).some((x) => b === x || b.startsWith(x + '-')) || (SHORT[b] || []).some((x) => a === x || a.startsWith(x + '-'));
}

export function importOrder() {
  const index = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
  return [...index.matchAll(/^@import '\.\/styles\/([a-z0-9/-]+\.css)';/gm)].map((m) => m[1]);
}

// every style rule in cascade order: { file, idx (global), node, sels, ctx, decls: [{prop, important}], theme }
export function rulesOf(texts) {
  const out = [];
  for (const [file, text] of texts) {
    const root = postcss.parse(text, { from: file });
    root.walkRules((node) => {
      let p = node.parent, ctx = [], inKeyframes = false;
      while (p && p.type !== 'root') { if (p.type === 'atrule') { ctx.unshift(`@${p.name} ${p.params}`); if (/keyframes$/.test(p.name)) inKeyframes = true; } p = p.parent; }
      if (inKeyframes) return;
      const sels = node.selectors;
      const themes = [...new Set(sels.map(themeOf))];
      const decls = [];
      node.each((d) => { if (d.type === 'decl') decls.push({ prop: d.prop.toLowerCase(), important: !!d.important }); });
      out.push({ file, idx: out.length, node, sels, ctx: ctx.join(' '), decls, theme: themes.length === 1 && themes[0] && themes[0] !== 'mixed' ? themes[0] : (themes.every((t) => t) ? 'mixed' : null) });
    });
  }
  return out;
}

// The subject (rightmost compound) of a selector: its classes, tag, id and pseudo-element.
export function subjectOf(sel) {
  let depth = 0, cut = 0;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (depth === 0 && /[\s>+~]/.test(c)) cut = i + 1;
  }
  const s = sel.slice(cut).replace(/:(not|is|where|has)\((?:[^()]|\([^()]*\))*\)/g, '');
  return {
    classes: [...s.matchAll(/\.([\w-]+)/g)].map((m) => m[1]),
    tag: (/^([a-z][\w-]*)/i.exec(s) || [])[1] || null,
    id: (/#([\w-]+)/.exec(s) || [])[1] || null,
    pseudo: ((/::?(before|after|placeholder|selection|marker|backdrop|-webkit-[\w-]+|-moz-[\w-]+|first-line|first-letter)\b/i.exec(s) || [])[1] || '').toLowerCase(),
  };
}

// Classes that may sit on ONE element: every className line of the TSX source, as a set (over-approximate on purpose).
let CO = null;
function coClasses() {
  if (CO) return CO;
  CO = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(SRC).filter((x) => /\.(tsx|ts)$/.test(x))) {
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) if (/className|classList|class=/.test(line)) CO.push(new Set(line.match(/[a-z][a-z0-9_-]*/gi) || []));
  }
  return CO;
}
// Could two selectors' subjects be the same box? Conservative wherever the source cannot rule it out.
export function maySameBox(x, y) {
  const a = subjectOf(x), b = subjectOf(y);
  if (a.pseudo !== b.pseudo) return false;
  if (a.id && b.id && a.id !== b.id) return false;
  if (a.tag && b.tag && a.tag.toLowerCase() !== b.tag.toLowerCase()) return false;
  if (!a.classes.length || !b.classes.length) return true;
  if (a.classes.some((c) => b.classes.includes(c))) return true;
  return coClasses().some((set) => a.classes.some((c) => set.has(c)) && b.classes.some((c) => set.has(c)));
}

export function census(texts) {
  const rules = rulesOf(texts);
  const cand = rules.filter((r) => r.theme && r.theme !== 'mixed' && THEMES[r.theme] && !THEME_FILES.has(r.file));
  for (const r of cand) {
    r.rivals = [];
    for (const q of rules) {
      if (q.idx <= r.idx || (cand.includes(q) && q.theme === r.theme)) continue;   // same-theme candidates keep their order
      if (q.theme && q.theme !== 'mixed' && q.theme !== r.theme) continue;          // scoped to another theme: never the same element
      const props = [];
      for (const a of r.decls) for (const b of q.decls) if (overlaps(a.prop, b.prop) && a.important === b.important) props.push(a.prop === b.prop ? a.prop : `${a.prop}~${b.prop}`);
      if (!props.length) continue;
      const pairs = r.sels.flatMap((x) => q.sels.filter((y) => eqSpec(specificity(x), specificity(y)) && maySameBox(x, y)).map((y) => `${x}  ~  ${y}`));
      if (pairs.length) r.rivals.push({ file: q.file, line: q.node.source.start.line, sel: q.sels.join(', ').slice(0, 120), props: [...new Set(props)], pair: pairs[0] });
    }
  }
  for (const r of cand) { r.feature = FEATURE_FILES.has(r.file); r.moves = !r.rivals.length && !r.feature; }
  return { rules, cand };
}

function runCensus() {
  const texts = importOrder().map((f) => [f, fs.readFileSync(path.join(SRC, 'styles', f), 'utf8')]);
  const { cand } = census(texts);
  const by = {};
  for (const r of cand) { const k = THEMES[r.theme]; by[k] ??= { move: 0, stay: 0 }; by[k][r.moves ? 'move' : 'stay']++; }
  console.log(`candidates ${cand.length}: ${Object.entries(by).map(([k, v]) => `${k} ${v.move + v.stay} (move ${v.move}, stay ${v.stay})`).join('; ')}`);
  for (const r of cand.filter((x) => x.rivals.length)) {
    console.log(`STAY ${r.file}:${r.node.source.start.line} ${r.sels.join(', ').slice(0, 110)}`);
    for (const q of r.rivals.slice(0, 3)) console.log(`     vs ${q.file}:${q.line} ${q.sel.slice(0, 90)}  [${q.props.join(' ')}]`);
  }
  const out = arg('json');
  if (out) fs.writeFileSync(out, JSON.stringify(cand.map((r) => ({ file: r.file, line: r.node.source.start.line, theme: THEMES[r.theme], sel: r.sels.join(', '), ctx: r.ctx, rivals: r.rivals })), null, 1));
}

const THEME_OUT = { flux: 'themes/flux.css', machina: 'themes/machina.css', arbor: 'themes/arbor.css' };
const HEAD = {
  flux: "/* Flux's rules that sat among the component rules, in their old order, imported after every component rule. A Flux rule that\n   source order alone let win against an equal-specificity rule after it stays where it was (docs/cleanup/c13-8-theme-stays.md). */\n",
  machina: "/* Machina's rules that sat among the component rules, in their old order, imported after every component rule. A Machina rule\n   that source order alone let win against an equal-specificity rule after it stays where it was (docs/cleanup/c13-8-theme-stays.md). */\n",
  arbor: "/* Arbor's rules that sat among the component rules, in their old order, imported after every component rule. */\n",
};
const STAYS = 'docs/cleanup/c13-8-theme-stays.md';

// A rule and the comment directly above it travel together; its at-rule chain is rebuilt around it in the theme file.
function wrap(node) {
  let text = node.toString().replace(/^\s+/, '');
  const prev = node.prev();
  const lead = prev && prev.type === 'comment' && !/^\s*=+/.test(prev.text) ? prev : null;
  if (lead) text = `${lead.toString().replace(/^\s+/, '')}\n${text}`;
  let p = node.parent;
  while (p && p.type !== 'root') { if (p.type === 'atrule') text = `@${p.name} ${p.params}{\n${text.replace(/^/gm, '  ')}\n}`; p = p.parent; }
  return { text, lead };
}

function runMove() {
  const order = importOrder();
  if (order.some((f) => f.startsWith('themes/'))) { console.log('the theme files are already imported'); process.exit(1); }
  const texts = order.map((f) => [f, fs.readFileSync(path.join(SRC, 'styles', f), 'utf8')]);
  const roots = new Map(texts.map(([f, t]) => [f, postcss.parse(t, { from: f })]));
  const { cand } = census([...roots].map(([f, root]) => [f, root.toString()]));
  // re-locate each candidate in the parses we will write back, by file and source line
  const byLine = new Map();
  for (const [f, root] of roots) root.walkRules((n) => byLine.set(`${f}:${n.source.start.line}:${n.source.start.column}`, n));
  const out = { flux: [], machina: [], arbor: [] };
  let moved = 0;
  for (const r of cand.filter((x) => x.moves)) {
    const n = byLine.get(`${r.file}:${r.node.source.start.line}:${r.node.source.start.column}`);
    if (!n) throw new Error(`lost ${r.file}:${r.node.source.start.line}`);
    const { text, lead } = wrap(n);
    out[THEMES[r.theme]].push(text);
    let p = n.parent;
    if (lead) lead.remove();
    n.remove();
    while (p && p.type === 'atrule' && !p.nodes.length) { const up = p.parent; p.remove(); p = up; }
    moved++;
  }
  for (const [f, root] of roots) {
    const eol = texts.find(([g]) => g === f)[1].includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(path.join(SRC, 'styles', f), root.toString().replace(/\r?\n/g, eol));
  }
  fs.mkdirSync(path.join(SRC, 'styles', 'themes'), { recursive: true });
  const eol = texts[0][1].includes('\r\n') ? '\r\n' : '\n';
  // only a theme with rules to move gets a file (and an import)
  const written = Object.entries(out).filter(([, list]) => list.length);
  for (const [k, list] of written) fs.writeFileSync(path.join(SRC, 'styles', THEME_OUT[k]), (HEAD[k] + '\n' + list.join('\n\n') + '\n').replace(/\r?\n/g, eol));
  const index = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
  fs.writeFileSync(path.join(SRC, 'index.css'), index + written.map(([k]) => `@import './styles/${THEME_OUT[k]}';${eol}`).join(''));
  const stays = cand.filter((x) => x.rivals.length);
  const kept = cand.filter((x) => !x.rivals.length && x.feature);
  fs.writeFileSync(path.join(ROOT, STAYS), [
    '# #13 step 8: the theme rules that stay where they are',
    '',
    'Each rule below is scoped to one theme and sits among the component rules, but a later rule of EQUAL specificity sets a',
    'property it also sets, on what may be the same box. There, source order alone decides which wins, so moving the theme rule',
    'into `src/styles/themes/` (imported last) would flip it. Raising a rule\'s specificity to move it anyway is a ruling, rule by rule.',
    '',
    '| Theme | Rule (file:line) | Its rival (file:line) | Shared properties |',
    '|---|---|---|---|',
    ...stays.flatMap((r) => r.rivals.map((q) => `| ${THEMES[r.theme]} | \`${r.sels.join(', ').replace(/\|/g, '\\|')}\` (${r.file}:${r.node.source.start.line}) | \`${q.sel.replace(/\|/g, '\\|')}\` (${q.file}:${q.line}) | ${q.props.join(', ')} |`)),
    '',
    '## Kept with their feature (Fable, ruling (b), Nov 2)',
    '',
    `${kept.length} more theme rules have no rival but stay where they are: \`18-desk-rail.css\` and \`21-help-me-choose.css\` keep each feature\'s`,
    'theme dress inside its named zones (the guided paths, Scenes, W5, the Machina deck wizard and forms), which their harnesses read whole.',
    '',
    ...[...new Set(kept.map((r) => r.file))].map((file) => `- \`${file}\`: ${kept.filter((r) => r.file === file).length} rules`),
    '',
  ].join('\n'));
  console.log(`moved ${moved} rules (flux ${out.flux.length}, machina ${out.machina.length}, arbor ${out.arbor.length}); ${stays.length} stay for a rival, ${kept.length} stay with their feature (${STAYS})`);
}

// The proof, against the commit before the move: (1) every style rule (its at-rule context and its text) and every comment is
// still there, as a multiset - nothing changed, added or lost; (2) the rules that stayed keep their relative order; (3) each theme
// file holds exactly the base's movable rules of its theme, in the base's order; (4) every rule that stayed in a component file is
// either a non-candidate or a candidate WITH a rival (so nothing that could have moved was left, and nothing hazardous moved).
function runCheck() {
  const base = arg('base');
  const plant = arg('plant');
  if (!base) { console.log('check needs --base <rev>'); process.exit(1); }
  const show = (f) => execFileSync('git', ['show', `${base}:apps/desktop/src/styles/${f}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  const baseIndex = execFileSync('git', ['show', `${base}:apps/desktop/src/index.css`], { cwd: ROOT, encoding: 'utf8' });
  const baseOrder = [...baseIndex.matchAll(/^@import '\.\/styles\/([a-z0-9/-]+\.css)';/gm)].map((m) => m[1]);
  const baseTexts = baseOrder.map((f) => [f, show(f)]);
  const { rules: baseRules, cand } = census(baseTexts);
  const nowOrder = importOrder();
  const nowTexts = nowOrder.map((f) => [f, fs.readFileSync(path.join(SRC, 'styles', f), 'utf8')]);
  if (plant === 'swap') { const t = nowTexts.find(([f]) => f === 'themes/flux.css'); const r = rulesOf([t]); const [a, b] = [r[3].node, r[4].node]; const ta = a.toString(), tb = b.toString(); t[1] = t[1].replace(ta, '\u0000').replace(tb, ta).replace('\u0000', tb); }
  if (plant === 'stay') { const s = cand.find((r) => r.rivals.length); const t = nowTexts.find(([f]) => f === `themes/${THEMES[s.theme]}.css`); t[1] += `\n${s.node.toString()}\n`; const c = nowTexts.find(([f]) => f === s.file); c[1] = c[1].replace(s.node.toString(), ''); }
  if (plant === 'edit') { const t = nowTexts.find(([f]) => f === 'themes/flux.css'); t[1] = t[1].replace(/:\s*([^;{}]+);/, (all, v) => `: ${v} ;`).replace(/(color:\s*)([^;]+);/, '$1red;'); }
  const nowRules = rulesOf(nowTexts);
  const key = (r) => `${r.ctx}|${r.node.toString().replace(/^\s+/, '').replace(/\s+/g, ' ')}`;
  const fails = [];
  // (1) rules and comments, as multisets
  const count = (list) => list.reduce((m, k) => m.set(k, (m.get(k) || 0) + 1), new Map());
  const diff = (a, b, what) => { for (const [k, n] of a) if ((b.get(k) || 0) !== n) fails.push(`${what} differs: ${k.slice(0, 110)}`); for (const [k] of b) if (!a.has(k)) fails.push(`${what} is new: ${k.slice(0, 110)}`); };
  diff(count(baseRules.map(key)), count(nowRules.map(key)), 'a rule');
  const comments = (texts) => texts.flatMap(([f, t]) => { const out = []; postcss.parse(t, { from: f }).walkComments((c) => { out.push(c.text.replace(/\s+/g, ' ')); }); return out; });
  const headless = (list) => list.filter((c) => !/^(Flux|Machina|Arbor)'s rules that sat among the component rules/.test(c));
  diff(count(headless(comments(baseTexts))), count(headless(comments(nowTexts))), 'a comment');
  // (2)-(4)
  const movable = new Set(cand.filter((r) => r.moves).map(key));
  const stayedBase = baseRules.filter((r) => !movable.has(key(r))).map(key);
  const stayedNow = nowRules.filter((r) => !r.file.startsWith('themes/')).map(key);
  if (stayedBase.join('\n') !== stayedNow.join('\n')) fails.push('the rules that stayed are not in their base order');
  for (const t of ['flux', 'machina', 'arbor']) {
    const want = cand.filter((r) => r.moves && THEMES[r.theme] === t).map(key);
    if (!want.length) { if (nowOrder.includes(`themes/${t}.css`)) fails.push(`themes/${t}.css exists with nothing to hold`); continue; }
    const got = nowRules.filter((r) => r.file === `themes/${t}.css`).map(key);
    if (want.join('\n') !== got.join('\n')) fails.push(`themes/${t}.css is not the base's movable ${t} rules in the base's order (${got.length} vs ${want.length})`);
  }
  const themeImports = nowOrder.filter((x) => x.startsWith('themes/'));
  if (!themeImports.length || nowOrder.slice(-themeImports.length).join() !== themeImports.join()) fails.push('the theme files are not imported last');
  console.log(`base ${base.slice(0, 8)}: ${baseRules.length} rules, ${cand.length} theme candidates, ${movable.size} movable, ${cand.length - movable.size} stay; now ${nowRules.length} rules${plant ? `; PLANTED: ${plant}` : ''}`);
  for (const f of fails.slice(0, 10)) console.log('FAIL', f);
  console.log(fails.length ? `THEMES: FAIL (${fails.length})` : 'THEMES: PASS (every rule and comment kept; the stayers in order; each theme file is its movable rules in order; no hazard moved)');
  process.exit(fails.length ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  ({ census: runCensus, move: runMove, check: runCheck }[process.argv[2]] ?? (() => { console.log('usage: census [--json out] | move | check --base <rev> [--plant swap|stay|edit]'); process.exit(1); }))();
}
