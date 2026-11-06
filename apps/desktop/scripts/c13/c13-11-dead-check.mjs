#!/usr/bin/env node
// #13 step 11: the DEAD list goes, and nothing else does. Browserless.
//
//   node apps/desktop/scripts/c13/c13-11-dead-check.mjs --base <rev> --selectors <selectors.json>
//
// The lists are docs/cleanup/c13-11-{files,exports,css}.txt (one entry per line). <selectors.json> is the step 5 selector report
// (c13-style-snapshot.mjs --out) taken at <base> on the box: which selectors matched an element on some screen in some skin.
//
// (D1) FILES: each listed file is in <base>'s src and gone now, and no src file imports it now.
// (D2) EXPORTS: each listed name is declared by some src file at <base>, by none now, and named by no src file now (comments stripped).
// (D3) CSS: each listed class is styled by some selector at <base>, by none now, and named in no .ts/.tsx text now.
// (D4) ONLY THOSE: every rule now, read as (its @-context, its selector, its body), is <base>'s rules with exactly the selectors that
//      name a listed class taken out: no other selector gone or added, and no body changed.
// (D5) THE SCREENS: no selector the report saw MATCH an element names a listed class; and the report saw each listed class (in some
//      unmatched selector), so a class it never looked at is not counted as proved.
// (D6) LIVENESS: a live class planted in the list is reported by D5; a live selector planted out of the CSS is reported by D4.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SRC = path.join(ROOT, 'apps/desktop/src');
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const base = arg('--base'), selPath = arg('--selectors');
if (!base || !selPath) { console.error('usage: --base <rev> --selectors <selectors.json>'); process.exit(2); }
const list = (n) => fs.readFileSync(path.join(ROOT, 'docs/cleanup', `c13-11-${n}.txt`), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
const FILES = list('files'), EXPORTS = list('exports'), CSS = list('css');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// both trees, as { rel: text }
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const NOW = Object.fromEntries(walk(SRC).filter((f) => /\.(ts|tsx|css)$/.test(f)).map((f) => [path.relative(SRC, f).replace(/\\/g, '/'), fs.readFileSync(f, 'utf8')]));
const baseNames = execFileSync('git', ['ls-tree', '-r', '--name-only', base, 'apps/desktop/src'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter((f) => /\.(ts|tsx|css)$/.test(f));
const BASE = Object.fromEntries(baseNames.map((f) => [f.slice('apps/desktop/src/'.length), execFileSync('git', ['show', `${base}:${f}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 })]));
const code = (tree) => Object.entries(tree).filter(([f]) => /\.tsx?$/.test(f));
const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

// (D1)
const importsOf = (rel) => { const stem = rel.replace(/\.(tsx?|css)$/, ''); const b = path.posix.basename(stem);
  return code(NOW).filter(([, t]) => new RegExp(`(from\\s*|import\\s*\\(\\s*|import\\s+)['"][^'"]*/${esc(b)}(\\.tsx?)?['"]`).test(t)).map(([f]) => f); };
const d1 = FILES.map((f) => ({ f, atBase: f in BASE, now: f in NOW, importers: importsOf(f) }));
ok(`D1 FILES: all ${FILES.length} listed files are in ${base}'s src, gone now, and imported by no src file`,
  d1.every((x) => x.atBase && !x.now && !x.importers.length), JSON.stringify(d1.filter((x) => !x.atBase || x.now || x.importers.length)));

// (D2)
const declRe = (n) => new RegExp(`export\\s+(?:async\\s+)?(?:function\\*?|const|let|var|class)\\s+${esc(n)}\\b`);
const nameRe = (n) => new RegExp(`(^|[^\\w$])${esc(n)}([^\\w$]|$)`);
const d2 = EXPORTS.map((n) => ({ n, atBase: code(BASE).some(([, t]) => declRe(n).test(t)), declNow: code(NOW).filter(([, t]) => declRe(n).test(t)).map(([f]) => f),
  namedNow: code(NOW).filter(([, t]) => nameRe(n).test(noComments(t))).map(([f]) => f) }));
ok(`D2 EXPORTS: all ${EXPORTS.length} listed exports are declared at ${base}, by no src file now, and named by none`,
  d2.every((x) => x.atBase && !x.declNow.length && !x.namedNow.length), JSON.stringify(d2.filter((x) => !x.atBase || x.declNow.length || x.namedNow.length)));

// the CSS read as rules: (@-context, selector, body), comments stripped, whitespace collapsed
function rulesOf(tree) {
  const out = [];
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const walkBody = (t, ctx, file) => {
    let i = 0;
    while (i < t.length) {
      const open = t.indexOf('{', i);
      if (open < 0) break;
      const head = t.slice(i, open);
      const semiAt = head.lastIndexOf(';');
      const h = norm(semiAt >= 0 ? head.slice(semiAt + 1) : head);
      let d = 0, j = open;
      for (; j < t.length; j++) { if (t[j] === '{') d++; else if (t[j] === '}') { d--; if (d === 0) break; } }
      const body = t.slice(open + 1, j);
      if (/^@(media|supports|container|layer)\b/.test(h)) walkBody(body, `${ctx}${h} > `, file);
      else if (/^@/.test(h)) out.push({ file, ctx, sel: h, body: norm(body) });
      else {
        let dd = 0, cur = ''; const parts = [];
        for (const c of h) { if (c === '(' || c === '[') dd++; if (c === ')' || c === ']') dd--; if (c === ',' && dd === 0) { parts.push(cur); cur = ''; } else cur += c; }
        parts.push(cur);
        for (const p of parts) out.push({ file, ctx, sel: norm(p), body: norm(body) });
      }
      i = j + 1;
    }
  };
  for (const [f, t] of Object.entries(tree)) if (f.endsWith('.css')) walkBody(t.replace(/\/\*[\s\S]*?\*\//g, ' '), '', f);
  return out;
}
const deadRe = (classes) => new RegExp(`\\.(?:${classes.map(esc).join('|')})(?![\\w-])`);
const baseRules = rulesOf(BASE), nowRules = rulesOf(NOW);

// (D3)
const styledAt = (rules, c) => rules.some((r) => deadRe([c]).test(r.sel));
const tsxNow = code(NOW).map(([, t]) => t).join('\n');
const d3 = CSS.map((c) => ({ c, atBase: styledAt(baseRules, c), now: styledAt(nowRules, c), named: new RegExp(`(^|[^\\w-])${esc(c)}([^\\w-]|$)`).test(tsxNow) }));
ok(`D3 CSS: all ${CSS.length} listed classes are styled at ${base}, styled by no selector now, and named in no .ts/.tsx text`,
  d3.every((x) => x.atBase && !x.now && !x.named), JSON.stringify(d3.filter((x) => !x.atBase || x.now || x.named)));

// (D4)
const key = (r) => `${r.file} | ${r.ctx}${r.sel} { ${r.body} }`;
const onlyThose = (classes, now) => {
  const re = deadRe(classes);
  const want = baseRules.filter((r) => /^@/.test(r.sel) || !re.test(r.sel)).map(key).sort();   // @keyframes / @font-face: untouched
  const got = now.map(key).sort();
  const w = new Map(); for (const k of want) w.set(k, (w.get(k) || 0) + 1);
  const g = new Map(); for (const k of got) g.set(k, (g.get(k) || 0) + 1);
  const missing = [...w].filter(([k, n]) => (g.get(k) || 0) < n).map(([k]) => k);
  const extra = [...g].filter(([k, n]) => (w.get(k) || 0) < n).map(([k]) => k);
  return { missing, extra, want: want.length, got: got.length, gone: baseRules.length - want.length };
};
const d4 = onlyThose(CSS, nowRules);
ok(`D4 ONLY THOSE: the CSS now is ${base}'s minus exactly the ${d4.gone} selectors that name a listed class (${d4.want} rule-selectors kept, every body unchanged)`,
  !d4.missing.length && !d4.extra.length, JSON.stringify({ missing: d4.missing.slice(0, 5), extra: d4.extra.slice(0, 5) }));

// (D5)
// the report's `matched` is a COUNT; the per-selector record (key: the selector with its @-context) carries each one's match count
const sel = JSON.parse(fs.readFileSync(selPath, 'utf8'));
if (!sel.perSelector || typeof sel.perSelector !== 'object') { console.error(`${selPath}: no perSelector record (not a step 5 selector report?)`); process.exit(2); }
const per = Object.entries(sel.perSelector);
const matched = per.filter(([, v]) => v.matched > 0).map(([k]) => k), unmatched = per.filter(([, v]) => !v.matched && !v.invalid).map(([k]) => k);
ok(`D5 premise: the report's own counts agree with its per-selector record (${sel.matched} matched, ${sel.unmatched.length} unmatched)`,
  matched.length === sel.matched && unmatched.length === sel.unmatched.length, `${matched.length}/${unmatched.length}`);
const screensOk = (classes) => {
  const hits = classes.map((c) => ({ c, matched: matched.filter((s) => deadRe([c]).test(s)) })).filter((x) => x.matched.length);
  const unseen = classes.filter((c) => !unmatched.some((s) => deadRe([c]).test(s)) && !matched.some((s) => deadRe([c]).test(s)));
  return { hits, unseen };
};
const d5 = screensOk(CSS);
ok(`D5 THE SCREENS: no selector that matched an element on any of the report's ${typeof sel.screens === 'number' ? sel.screens : '?'} screen readings names a listed class (${matched.length} matched, ${unmatched.length} unmatched)`,
  d5.hits.length === 0 && matched.length > 100, JSON.stringify(d5.hits.slice(0, 5)));
ok(`D5 coverage: the report saw every listed class (each named by some selector it tested)`, d5.unseen.length === 0, JSON.stringify(d5.unseen));

// (D6)
const live = ['forward-only-editor', 'desk-frame'].find((c) => matched.some((s) => deadRe([c]).test(s)));
const planted5 = screensOk([...CSS, live]);
ok(`D6 LIVENESS: a live class planted in the list ('${live}') is reported by D5`, !!live && planted5.hits.some((x) => x.c === live), JSON.stringify(planted5.hits.map((x) => x.c)));
const victim = nowRules.findIndex((r) => r.sel === '.forward-only-editor' || deadRe(['forward-only-editor']).test(r.sel));
const planted4 = onlyThose(CSS, nowRules.filter((_, i) => i !== victim));
ok('D6 LIVENESS: a live selector planted out of the CSS is reported by D4', victim >= 0 && planted4.missing.length === 1, JSON.stringify(planted4.missing));

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `\n        [${c.detail.slice(0, 1200)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nC13-11 DEAD CHECK: PASS (${checks.length} checks)` : `\nC13-11 DEAD CHECK: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
