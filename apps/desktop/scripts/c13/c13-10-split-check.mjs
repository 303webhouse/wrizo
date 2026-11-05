#!/usr/bin/env node
// #13 step 10 (the splits): the step check, browserless. A split moves code out of one module into new files and keeps the old
// path as the barrel; this proves the move changed no code.
//
//   node apps/desktop/scripts/c13/c13-10-split-check.mjs --base <rev> <from> <to...>     (paths relative to apps/desktop/src)
//
// (1) LINES: the non-blank, non-import lines of <from> at <base> are, as a multiset, exactly the non-blank, non-import lines of
//     <from> + <to...> now; a line that gained `export ` counts as itself. Nothing is added, dropped or edited.
// (2) SCOPE: no file under apps/desktop/src other than <from> and <to...> differs from <base>, so no import line outside the split changes.
// (3) BARREL: every name <from> exported at <base> it still exports.
// (4) CITES: every step 9 citation [<Name> §n] in <from> + <to...> is a heading of docs/rulings/<area of from>-<Name>.md.
// (5) LIVENESS: each check is run again on a planted input (a moved line edited, a moved line dropped, a stray src file, a citation
//     pointed nowhere, an export lost) and must FAIL; a check that cannot go red proves nothing.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SRC = 'apps/desktop/src';
const args = process.argv.slice(2);
const bi = args.indexOf('--base');
if (bi < 0 || !args[bi + 1]) { console.error('usage: --base <rev> <from> <to...>'); process.exit(2); }
const base = args[bi + 1];
const files = args.filter((_, i) => i !== bi && i !== bi + 1);
const [from, ...to] = files;
if (!from || to.length === 0) { console.error('usage: --base <rev> <from> <to...>'); process.exit(2); }

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
const atBase = (f) => git('show', `${base}:${SRC}/${f}`);
const now = (f) => fs.readFileSync(path.join(ROOT, SRC, f), 'utf8');

// the code lines of a text: no blanks, no import statements (a multi-line import is consumed to its `from '...'` line)
function codeLines(text) {
  const out = [];
  let inImport = false;
  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    const l = raw.replace(/\s+$/, '');
    if (inImport) { if (/from\s+['"][^'"]+['"];?$/.test(l)) inImport = false; continue; }
    if (/^import\s/.test(l)) { if (!/from\s+['"][^'"]+['"];?$/.test(l) && !/^import\s+['"]/.test(l)) inImport = true; continue; }
    if (/^export\s+(type\s+)?(\*|\{[^}]*\})(\s+as\s+\w+)?\s+from\s+['"][^'"]+['"];?$/.test(l)) continue;   // a barrel's re-export line is wiring, like an import
    if (l.trim() === '') continue;
    out.push(l.replace(/^export (?=(async )?(function|const|let|class|interface|type|enum)\b)/, ''));
  }
  return out;
}
const count = (lines) => { const m = new Map(); for (const l of lines) m.set(l, (m.get(l) || 0) + 1); return m; };
function lineDiff(before, after) {
  const a = count(before), b = count(after), missing = [], extra = [];
  for (const [l, n] of a) for (let k = (b.get(l) || 0); k < n; k++) missing.push(l);
  for (const [l, n] of b) for (let k = (a.get(l) || 0); k < n; k++) extra.push(l);
  return { missing, extra };
}
// a module's exported names; `export * from './x'` adds x's own (from the texts under test, else the tree as it is now)
const exportsOf = (text, file, texts, seen = new Set()) => {
  const s = new Set();
  for (const m of text.matchAll(/^export\s+\*\s+from\s+['"](\.[^'"]+)['"]/gm)) {
    const rel = path.posix.join(path.posix.dirname(file), m[1]);
    const hit = [`${rel}.ts`, `${rel}.tsx`, `${rel}/index.ts`].find((g) => texts.now[g] !== undefined || fs.existsSync(path.join(ROOT, SRC, g)));
    if (hit && !seen.has(hit)) { seen.add(hit); for (const n of exportsOf(texts.now[hit] ?? now(hit), hit, texts, seen)) s.add(n); }
  }
  for (const m of text.matchAll(/^export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm)) s.add(m[1]);
  for (const m of text.matchAll(/^export\s+(?:type\s+)?\{([^}]*)\}/gm)) for (const p of m[1].split(',')) { const n = p.trim().split(/\s+as\s+/).pop(); if (n) s.add(n); }
  return s;
};

// step 9's why-lines cite [<Name> §n]; the id names the rulings file of the module the code came from (its area + name), not the
// file the code now sits in, so a cite that moves into the split's new files still resolves there
const CITE = /\[([A-Za-z0-9-]+) §(\d+)\]/g;
const area = from.split('/')[0].replace(/\.tsx?$/, '');
const rulings = (name) => { const p = path.join(ROOT, 'docs/rulings', `${area}-${name}.md`); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };

function run({ texts, changed }) {
  const r = [];
  const before = codeLines(texts.base);
  const after = [from, ...to].flatMap((f) => codeLines(texts.now[f]));
  const d = lineDiff(before, after);
  const moved = to.reduce((n, f) => n + codeLines(texts.now[f]).length, 0);
  r.push({ name: 'LINES', pass: d.missing.length === 0 && d.extra.length === 0 && moved > 0,
    detail: `${before.length} code lines before, ${after.length} after, ${moved} now in ${to.join(', ')}; missing ${d.missing.length}, added ${d.extra.length}`,
    show: [...d.missing.slice(0, 5).map((l) => `- ${l.slice(0, 140)}`), ...d.extra.slice(0, 5).map((l) => `+ ${l.slice(0, 140)}`)] });
  const stray = changed.filter((f) => ![from, ...to].includes(f));
  r.push({ name: 'SCOPE', pass: stray.length === 0, detail: `${changed.length} src files differ from ${base}: ${changed.join(', ')}`, show: stray.map((f) => `stray: ${f}`) });
  const was = exportsOf(texts.base, from, { now: {} }), is = exportsOf(texts.now[from], from, texts);
  const lost = [...was].filter((n) => !is.has(n));
  r.push({ name: 'BARREL', pass: lost.length === 0, detail: `${from} exported ${was.size} names at ${base} and exports ${is.size} now`, show: lost.map((n) => `lost: ${n}`) });
  const cites = [from, ...to].flatMap((f) => [...texts.now[f].matchAll(CITE)].map((m) => ({ f, name: m[1], n: m[2] })));
  const unresolved = cites.filter((c) => !(rulings(c.name) ?? '').split(/\r?\n/).includes(`## ${c.name} §${c.n}`));
  r.push({ name: 'CITES', pass: unresolved.length === 0, detail: `${cites.length} [Name §n] citations in the split's files, each a heading in docs/rulings/${area}-<Name>.md`,
    show: unresolved.map((c) => `${c.f}: [${c.name} §${c.n}] resolves nowhere`) });
  return r;
}

const changed = git('diff', '--name-only', base, '--', SRC).split('\n').filter(Boolean).map((f) => f.slice(SRC.length + 1));
const untracked = git('ls-files', '--others', '--exclude-standard', '--', SRC).split('\n').filter(Boolean).map((f) => f.slice(SRC.length + 1));
const real = { texts: { base: atBase(from), now: Object.fromEntries([from, ...to].map((f) => [f, now(f)])) }, changed: [...new Set([...changed, ...untracked])].sort() };

const results = run(real);
for (const c of results) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}: ${c.detail}`);
  if (!c.pass) for (const s of c.show) console.log(`        ${s}`);
}

// liveness: each plant must turn its check red
const clone = () => JSON.parse(JSON.stringify(real));
const firstCode = (f) => real.texts.now[f].replace(/\r\n/g, '\n').split('\n').findIndex((l) => l.trim() && !/^import\s/.test(l));
const plants = [
  ['a moved line edited', 'LINES', (x) => { const f = to[0], ls = x.texts.now[f].split('\n'), i = firstCode(f); ls[i] = ls[i].replace(/(\S)(\s*)$/, '$1x$2'); x.texts.now[f] = ls.join('\n'); }],
  ['a moved line dropped', 'LINES', (x) => { const f = to[0], ls = x.texts.now[f].split('\n'), i = firstCode(f); ls.splice(i, 1); x.texts.now[f] = ls.join('\n'); }],
  ['a src file outside the split changed', 'SCOPE', (x) => { x.changed.push('pages/PageEditor.tsx'); }],
  ['a moved citation points nowhere', 'CITES', (x) => { const f = [...to, from].find((g) => new RegExp(CITE.source).test(x.texts.now[g])); if (f) x.texts.now[f] = x.texts.now[f].replace(/§(\d+)\]/, '§999]'); else x.texts.now[to[0]] += '\n// planted [Nowhere §999]'; }],
  ['the barrel loses an export', 'BARREL', (x) => {
    // the name's declaration loses `export`, in whichever file holds it now (the barrel itself, or a part it re-exports)
    const n = [...exportsOf(x.texts.base, from, { now: {} })][0], re = n && new RegExp(`^export (?=[^\\n]*\\b${n}\\b)`, 'm');
    const g = re && [from, ...to].find((h) => re.test(x.texts.now[h]));
    if (g) x.texts.now[g] = x.texts.now[g].replace(re, ''); else x.texts.base += '\nexport const __planted = 1;'; }],
];
const live = plants.map(([what, check, plant]) => { const x = clone(); plant(x); const c = run(x).find((y) => y.name === check); return { what, check, red: !c.pass }; });
for (const l of live) console.log(`${l.red ? 'PASS' : 'FAIL'}  LIVENESS: ${l.what} turns ${l.check} red`);

const all = [...results.map((c) => c.pass), ...live.map((l) => l.red)];
const passed = all.filter(Boolean).length;
console.log(passed === all.length ? `\nC13-10 SPLIT CHECK: PASS (${all.length} checks)` : `\nC13-10 SPLIT CHECK: FAIL - ${all.length - passed}/${all.length} failed`);
process.exit(passed === all.length ? 0 : 1);
