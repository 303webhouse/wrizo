#!/usr/bin/env node
// #13 step 9 (brief; Fable's comment ruling, Oct 29): the comment ruling applied to TS/TSX, one area at a time. A comment stays only if
// it explains WHY non-obvious code is as it is, citing its ruling id; ruling HISTORY (supersessions, parks, who said what and when)
// moves VERBATIM to docs/rulings/<area>-<Name>.md, under that id. Step 7's CSS tool, with the TypeScript parser finding the comments
// (so a "//" inside a string, a regex, a template or JSX text is never taken for one). Browserless.
//
//   node apps/desktop/scripts/c13/c13-9-ts-comments.mjs list <file...> [--all]
//        every history-marked comment block (or every block) of the files (paths under apps/desktop/src): key, hash, line, text
//   node apps/desktop/scripts/c13/c13-9-ts-comments.mjs apply <spec.json>
//        spec: [{ key, hash, why }]: each block (found by its hash, unique in its file) moves verbatim to docs/rulings/<area>-<Name>.md
//        as "## <Name> §<n>"; in the source it becomes "// <why> [<Name> §<n>]" (or the JSX / inline form), or goes when why is ""
//   node apps/desktop/scripts/c13/c13-9-ts-comments.mjs check --base <rev> <file...> [--plant drop|edit|code|cite|jsx]
//        the proof, beside the byte-identical bundle: (1) with comments aside, each file's tokens are the base's (no code moved);
//        (2) every comment block removed or rewritten since the base is in docs/rulings/, verbatim (a block multiset); (3) every
//        [<Name> §<n>] cited in a file resolves to a heading, and every heading is cited or says no comment stays; (4) no history
//        marker is left in a comment of the files. --plant: the same check on a mutated input: must FAIL.
//   node apps/desktop/scripts/c13/c13-9-ts-comments.mjs readers --base <rev> <file...>
//        the triage: every string and regex literal in scripts/**/*.mjs whose match count in a file differs from the base's: a
//        harness that reads comment text: listed by harness and line when its PRESENCE flips (--counts: when its count moves).
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const DESKTOP = path.join(ROOT, 'apps/desktop');
const SRC = 'apps/desktop/src';
const RULINGS = 'docs/rulings';
const ts = createRequire(path.join(DESKTOP, 'package.json'))('typescript');
const arg = (n) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : null);
const positional = () => { const out = []; const a = process.argv.slice(3); for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { if (!['all'].includes(a[i].slice(2))) i++; continue; } out.push(a[i]); } return out; };
const noCR = (s) => s.replace(/\r\n/g, '\n');
const hash = (s) => crypto.createHash('sha1').update(noCR(s)).digest('hex').slice(0, 10);
const nameOf = (f) => path.basename(f).replace(/\.tsx?$/, '');
const areaOf = (f) => f.split('/')[0].replace(/\.tsx?$/, '');   // components/BoardEditor.tsx -> components; App.tsx -> App

// Step 7's history markers, unchanged: a date, a name, a supersession or park, a ledger / box / item / commit reference. A ticket id
// alone (BG1 S2) is not history: it is the ruling id a why-comment cites.
export const HISTORY = /SUPERSEDED|PARKED|\bNick\b|\bFable\b|\bledger\b|\b20\d\d-\d\d-\d\d\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}\b|\bruled\b|\bruling\b|\bitem \d|\bbox (run|turn)\b|\bturn \d|\b(on|@) ?[0-9a-f]{7,8}\b/;
const CITE = /\[([A-Za-z0-9-]+) §(\d+)\]/g;

// Leaf tokens of a TS/TSX text, from the parser (JSDoc nodes aside: their text is comment)
function parse(file, text) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const leaves = [];
  const walk = (n) => {
    if (n.kind >= ts.SyntaxKind.FirstJSDocNode && n.kind <= ts.SyntaxKind.LastJSDocNode) return;
    const kids = n.getChildren(sf);
    if (!kids.length) { leaves.push(n); return; }
    for (const k of kids) walk(k);
  };
  walk(sf);
  return { sf, leaves };
}

// Comment blocks: { start, end, text, own, jsx }. A run of "//" comments on consecutive lines, each alone on its line, is one block;
// so is each "/* */". An own-line block's text starts at its line's start (its indentation is part of it, so every line is verbatim).
// A JSX comment {/* x */} is a block from "{" to "}".
function blocks(file, text) {
  const { leaves } = parse(file, text);
  const ranges = new Map();
  const jsxOf = new Map();   // comment pos -> [open brace, close brace] of an empty JsxExpression
  for (let i = 0; i < leaves.length; i++) {
    const l = leaves[i];
    if (l.kind === ts.SyntaxKind.JsxText) continue;
    // BOTH halves of the trivia: a leading range skips a comment on the same line as the code before it ("code; // x", and the
    // one-line {/* x */}), which only the trailing range of the token before it holds
    const p = l.parent;
    const emptyJsx = p && p.kind === ts.SyntaxKind.JsxExpression && !p.expression
      && (l.kind === ts.SyntaxKind.OpenBraceToken || l.kind === ts.SyntaxKind.CloseBraceToken);
    // ...but never when JSX text follows: that is text, and "// x" in it is words, not a comment
    const next = leaves[i + 1];
    const trailing = next && next.kind === ts.SyntaxKind.JsxText ? [] : ts.getTrailingCommentRanges(text, l.end) || [];
    for (const r of [...(ts.getLeadingCommentRanges(text, l.pos) || []), ...trailing]) {
      ranges.set(r.pos, r);
      if (emptyJsx && r.pos >= p.getStart() && r.end <= p.end) jsxOf.set(r.pos, [p.getStart(), p.end]);
    }
  }
  const lineStart = (at) => text.lastIndexOf('\n', at - 1) + 1;
  const lineEnd = (at) => { const e = text.indexOf('\n', at); return e < 0 ? text.length : e; };
  const out = [];
  for (const r of [...ranges.values()].sort((a, b) => a.pos - b.pos)) {
    let start = r.pos, end = r.end, jsx = false;
    if (jsxOf.has(r.pos)) {
      const [o, c] = jsxOf.get(r.pos);
      if (!text.slice(o + 1, r.pos).trim() && !text.slice(r.end, c - 1).trim()) { start = o; end = c; jsx = true; }
    }
    const ls = lineStart(start);
    const own = !text.slice(ls, start).trim();
    const prev = out[out.length - 1];
    const line = r.kind === ts.SyntaxKind.SingleLineCommentTrivia;
    if (line && own && prev && prev.line && prev.own && !prev.jsx && /^[ \t]*\r?\n[ \t]*$/.test(text.slice(prev.end, start))) { prev.end = end; prev.text = text.slice(prev.start, end); continue; }
    if (own) start = ls;
    out.push({ start, end, text: text.slice(start, end), own, jsx, line, tail: !!text.slice(end, lineEnd(end)).replace(/\r$/, '').trim() });
  }
  return out;
}
const lineOf = (text, at) => text.slice(0, at).split('\n').length;
const read = (f) => fs.readFileSync(path.join(ROOT, SRC, f), 'utf8');

function list() {
  const all = process.argv.includes('--all');
  let n = 0;
  for (const f of positional()) {
    const t = read(f);
    blocks(f, t).forEach((b, k) => {
      if (!all && !HISTORY.test(b.text)) return;
      n++;
      console.log(`=== ${f}#${k} ${hash(b.text)} L${lineOf(t, b.start)}${b.jsx ? ' jsx' : ''}${b.own ? '' : ' trailing'}\n${noCR(b.text)}`);
    });
  }
  console.log(`--- ${n} blocks`);
}

function apply() {
  const spec = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  const base = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const byFile = new Map();
  for (const e of spec) { const f = e.key.split('#')[0]; if (!byFile.has(f)) byFile.set(f, []); byFile.get(f).push(e); }
  for (const [f, entries] of byFile) {
    let t = read(f);
    const eol = t.includes('\r\n') ? '\r\n' : '\n';
    t = noCR(t);
    const bs = blocks(f, t);
    const name = nameOf(f);
    const rulingsFile = path.join(ROOT, RULINGS, `${areaOf(f)}-${name}.md`);
    const existing = fs.existsSync(rulingsFile) ? noCR(fs.readFileSync(rulingsFile, 'utf8')) : null;
    let nextId = existing ? Math.max(0, ...[...existing.matchAll(/^## [A-Za-z0-9-]+ §(\d+)$/gm)].map((m) => Number(m[1]))) + 1 : 1;
    // a hash is one block, unless the spec says `all` (the same tag repeated verbatim): then every copy moves, each its own entry
    const seen = new Set();
    const plan = entries.filter((e) => !seen.has(e.hash) && seen.add(e.hash)).flatMap((e) => {
      const hits = bs.filter((x) => hash(x.text) === e.hash);
      if (!hits.length || (hits.length > 1 && !e.all)) throw new Error(`${e.key}: ${hits.length} blocks in ${f} carry hash ${e.hash}${hits.length > 1 ? ' (mark it all:true to move every copy)' : ''}`);
      if (/\*\/|\n/.test(e.why)) throw new Error(`${e.key}: a why-line may not hold "*/" or a newline`);
      return hits.map((b) => ({ ...e, b, line: lineOf(t, b.start) }));
    }).sort((x, y) => x.b.start - y.b.start).map((p) => ({ ...p, id: nextId++ })).sort((x, y) => y.b.start - x.b.start);
    const md = [];
    for (const p of plan) {
      const cite = `${name} §${p.id}`;
      const b = p.b;
      let s = b.start, e = b.end;
      const indent = b.own ? b.text.match(/^[ \t]*/)[0] : '';
      if (p.why) {
        const body = `${p.why} [${cite}]`;
        const rep = b.jsx ? `{/* ${body} */}` : b.tail ? `/* ${body} */` : `// ${body}`;
        t = t.slice(0, s) + indent + rep + t.slice(e);
      } else if (b.own && !b.tail) {
        const le = t.indexOf('\n', e);
        e = le < 0 ? t.length : le + 1;
        t = t.slice(0, s) + t.slice(e);
      } else if (b.own) {
        t = t.slice(0, s) + indent + t.slice(e).replace(/^[ \t]+/, '');
      } else {
        s = s - (t.slice(0, s).match(/[ \t]*$/)[0].length);
        t = t.slice(0, s) + t.slice(e);
      }
      md.unshift(`## ${cite}\n\nFrom \`${SRC}/${f}\`, line ${p.line} at \`${base}\`${p.why ? ` (the comment that stays: "${p.why}")` : ' (no comment stays: the code reads plainly)'}.\n\n\`\`\`ts\n${noCR(b.text)}\n\`\`\`\n`);
    }
    fs.writeFileSync(path.join(ROOT, SRC, f), t.replace(/\n/g, eol));
    fs.mkdirSync(path.dirname(rulingsFile), { recursive: true });
    const head = existing ?? `# Rulings: \`${SRC}/${f}\`\n\nRuling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the\nsource that cites \`[${name} §n]\` points here.\n\n`;
    fs.writeFileSync(rulingsFile, head.replace(/\n*$/, '\n\n') + md.join('\n'));
    console.log(`${f}: ${plan.length} blocks moved (${plan.filter((p) => p.why).length} leave a why-line)`);
  }
}

// The code with comments aside: the leaf tokens, JSX text whitespace-collapsed, and the braces of an empty {/* */} dropped
function tokens(file, text) {
  const { leaves } = parse(file, text);
  const out = [];
  for (const l of leaves) {
    if (l.kind === ts.SyntaxKind.EndOfFileToken) continue;
    const p = l.parent;
    if ((l.kind === ts.SyntaxKind.OpenBraceToken || l.kind === ts.SyntaxKind.CloseBraceToken) && p && p.kind === ts.SyntaxKind.JsxExpression && !p.expression) continue;
    let s = l.getText();
    if (l.kind === ts.SyntaxKind.JsxText) { s = s.replace(/\s+/g, ' ').trim(); if (!s) continue; }
    out.push(s);
  }
  // adjacent JSX texts left apart by a dropped comment read as one
  return out;
}

function check() {
  const base = arg('base');
  const plant = arg('plant');
  const scope = positional();
  if (!base || !scope.length) { console.log('check needs --base <rev> and the files'); process.exit(1); }
  const show = (f) => noCR(execFileSync('git', ['show', `${base}:${SRC}/${f}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }));
  const fails = [];
  const rulingsTexts = scope.map((f) => `${areaOf(f)}-${nameOf(f)}.md`).filter((m, i, a) => a.indexOf(m) === i)
    .filter((m) => fs.existsSync(path.join(ROOT, RULINGS, m))).map((m) => [m, noCR(fs.readFileSync(path.join(ROOT, RULINGS, m), 'utf8'))]);
  const moved = new Map();
  const heads = new Map();
  for (const [f, s] of rulingsTexts) {
    for (const m of s.matchAll(/```ts\n([\s\S]*?)\n```/g)) moved.set(m[1], (moved.get(m[1]) || 0) + 1);
    for (const m of s.matchAll(/^## ([A-Za-z0-9-]+ §\d+)$/gm)) heads.set(m[1], f);
  }
  if (plant === 'drop') { const k = [...moved.keys()][0]; moved.set(k, moved.get(k) - 1); }
  const cited = new Map();
  let removedTotal = 0, nowBlocks = 0, planted = null;
  for (const f of scope) {
    let now = noCR(read(f));
    // a plant lands on the FIRST file it can change, and only there (a plant that lands nowhere is reported, never a quiet pass)
    if (plant && plant !== 'drop' && !planted) {
      const before = now;
      if (plant === 'code') now = now.replace(/return null;/, 'return undefined;');
      if (plant === 'cite') now = now.replace(new RegExp(CITE.source), '[Nowhere §999]');
      if (plant === 'edit') { const b = blocks(f, now).find((x) => !HISTORY.test(x.text) && x.text.length > 40); if (b) now = now.slice(0, b.start) + b.text.replace(/(\S) /, '$1  ') + now.slice(b.end); }
      if (plant === 'jsx') now = now.replace(/(\{\/\*[^]*?\*\/\})/, '$1{" "}');
      if (now !== before) planted = f;
    }
    const was = show(f);
    const ta = tokens(f, was).join('\u0001'), tb = tokens(f, now).join('\u0001');
    if (ta !== tb) {
      const A = ta.split('\u0001'), B = tb.split('\u0001');
      let i = 0; while (i < A.length && A[i] === B[i]) i++;
      fails.push(`${f}: the code itself changed (comments aside), first at token ${i}: was ${JSON.stringify(A.slice(i, i + 3))} now ${JSON.stringify(B.slice(i, i + 3))}`);
    }
    const nowSet = new Map();
    const nowB = blocks(f, now);
    for (const b of nowB) { nowBlocks++; nowSet.set(noCR(b.text), (nowSet.get(noCR(b.text)) || 0) + 1); }
    for (const b of blocks(f, was)) {
      const k = noCR(b.text);
      const left = nowSet.get(k) || 0;
      if (left > 0) { nowSet.set(k, left - 1); continue; }
      removedTotal++;
      const held = moved.get(k) || 0;
      if (held > 0) moved.set(k, held - 1);
      else fails.push(`${f}: a removed comment is not in docs/rulings verbatim: ${k.trim().slice(0, 70).replace(/\n/g, ' ')}`);
    }
    for (const b of nowB) {
      for (const m of b.text.matchAll(CITE)) cited.set(`${m[1]} §${m[2]}`, f);
      if (HISTORY.test(b.text)) fails.push(`${f}: a comment still carries history: ${b.text.trim().slice(0, 70).replace(/\n/g, ' ')}`);
    }
  }
  for (const [c, f] of cited) if (!heads.has(c)) fails.push(`${f}: cites [${c}], which no rulings file holds`);
  for (const [h, f] of heads) if (!cited.has(h) && !/no comment stays/.test(rulingsTexts.find(([n]) => n === f)[1].split(`## ${h}\n`)[1]?.split('\n## ')[0] || '')) fails.push(`${f}: ${h} is cited by no comment`);
  for (const [k, n] of moved) if (n > 0) fails.push(`a rulings entry holds a block no file lost: ${k.trim().slice(0, 70).replace(/\n/g, ' ')}`);
  if (plant && plant !== 'drop' && !planted) { console.log(`PLANT DID NOT LAND: no file in scope could take --plant ${plant}`); process.exit(2); }
  console.log(`files ${scope.length}; comment blocks now ${nowBlocks}; removed or rewritten ${removedTotal}; rulings files ${rulingsTexts.length}, entries ${heads.size}; cited ${cited.size}${plant ? `; PLANTED: ${plant}${planted ? ` in ${planted}` : ''}` : ''}`);
  for (const f of fails.slice(0, 12)) console.log('FAIL', f);
  console.log(fails.length ? `TS-COMMENTS: FAIL (${fails.length})` : 'TS-COMMENTS: PASS (the code is the base\'s with comments aside; every removed comment is in docs/rulings verbatim; every citation resolves)');
  process.exit(fails.length ? 1 : 0);
}

// Harness literals (strings, templates without substitutions, regexes) whose count in a file moved since the base
function readers() {
  const base = arg('base');
  const scope = positional();
  if (!base || !scope.length) { console.log('readers needs --base <rev> and the files'); process.exit(1); }
  const scripts = [];
  const walkDir = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules') walkDir(p); } else if (e.name.endsWith('.mjs')) scripts.push(p); } };
  walkDir(path.join(DESKTOP, 'scripts'));
  const lits = [];
  for (const p of scripts) {
    if (p.endsWith('c13-9-ts-comments.mjs')) continue;
    const text = fs.readFileSync(p, 'utf8');
    // a script that never names a file in scope cannot read it
    const names = scope.filter((f) => text.includes(nameOf(f)));
    if (!names.length) continue;
    const sf = ts.createSourceFile(p, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const visit = (n) => {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { if (n.text.length >= 6) lits.push({ p, line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, kind: 's', v: n.text, names }); }
      else if (n.kind === ts.SyntaxKind.RegularExpressionLiteral) { const m = n.text.match(/^\/([\s\S]*)\/([a-z]*)$/); try { lits.push({ p, line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, kind: 'r', v: new RegExp(m[1], m[2].replace(/[gy]/g, '') + 'g'), names }); } catch { /* a regex this engine refuses is not a reader */ } }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  const count = (t, l) => (l.kind === 's' ? t.split(l.v).length - 1 : (t.match(l.v) || []).length);
  let hits = 0;
  for (const f of scope) {
    const now = read(f), was = execFileSync('git', ['show', `${base}:${SRC}/${f}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    for (const l of lits) {
      if (!l.names.includes(f)) continue;
      // both line endings: a harness may read the CRLF working copy or normalise it
      const a = count(noCR(was), l), b = count(noCR(now), l);
      const crlf = (s) => noCR(s).replace(/\n/g, '\r\n');
      const a2 = count(crlf(was), l), b2 = count(crlf(now), l);
      // a harness asks includes() / test(): what can turn one red is PRESENCE flipping (--counts: any count that moved)
      const moved = process.argv.includes('--counts') ? a !== b || a2 !== b2 : (a > 0) !== (b > 0) || (a2 > 0) !== (b2 > 0);
      if (moved) { hits++; console.log(`READER ${path.relative(ROOT, l.p).replace(/\\/g, '/')}:${l.line} ${f}: ${l.kind === 's' ? JSON.stringify(l.v.slice(0, 80)) : String(l.v).slice(0, 80)} was ${a} now ${b}`); }
    }
  }
  console.log(`literals ${lits.length} from ${scripts.length} scripts; readers whose count moved: ${hits}`);
}

({ list, apply, check, readers }[process.argv[2]] ?? (() => { console.log('usage: list <file...> [--all] | apply <spec.json> | check --base <rev> <file...> [--plant drop|edit|code|cite|jsx] | readers --base <rev> <file...>'); process.exit(1); }))();
