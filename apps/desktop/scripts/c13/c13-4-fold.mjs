#!/usr/bin/env node
// #13 step 4 (docs/cleanup/deploy-13-brief.md): the loose docs/*.md briefs and reviews move into docs/briefs/<arc>/ and docs/reviews/.
// Browserless. Docs only: references are rewritten in .md files and AGENTS.md; any other file that names a moved path stops the move.
//
//   node apps/desktop/scripts/c13/c13-4-fold.mjs apply                  git mv every manifest row, rewrite the links that point at them
//   node apps/desktop/scripts/c13/c13-4-fold.mjs check [--ref R] [--plant stale|edit]
//        the proof, against the tree at R (default HEAD): (1) every moved file's text equals its original except link targets and doc
//        paths; (2) no tracked file names an old path; (3) no link is broken that was not already broken at R. --plant: must FAIL.
//
// Not touched: the ledger (docs/open-threads.md, docs/ledger/) and docs/evidence/ keep the old paths as history.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
const MANIFEST = 'docs/cleanup/c13-4-moves.tsv';
const HISTORY = (f) => f === 'docs/open-threads.md' || f.startsWith('docs/ledger/') || f.startsWith('docs/evidence/');
const TEXT = /\.(md|ts|tsx|css|mjs|js|cjs|json|ya?ml|txt|html)$/;

const moves = () => fs.readFileSync(path.join(ROOT, MANIFEST), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#') && !l.startsWith('old\t'))
  .map((l) => { const [from, to] = l.split('\t'); return { from, to }; });
const posix = (p) => p.split(path.sep).join('/');
const LINK = /\]\(([^)\s]+)\)/g;
const DOCPATH = /\bdocs\/[A-Za-z0-9_.\/-]+\.md\b/g;

// A link target as the repo path it points at, from a file at `file` (repo-relative), or null when it is not a local link.
function target(file, t) {
  if (/^([a-z]+:|#|mailto:)/i.test(t)) return null;
  const clean = t.replace(/#.*$/, '');
  if (!clean) return null;
  return posix(path.normalize(path.join(path.dirname(file), clean)));
}
const relink = (fromFile, repoPath, anchor) => {
  let r = posix(path.relative(path.dirname(fromFile), repoPath));
  if (!r.startsWith('.')) r = r || path.basename(repoPath);
  return r + anchor;
};

function rewrite(text, file, newFile, map) {
  let out = text.replace(DOCPATH, (p) => map.get(p) ?? p);
  if (!/\.md$/.test(file)) return out;
  return out.replace(LINK, (m, t) => {
    const p = target(file, t);
    if (!p || !fs.existsSync(path.join(ROOT, p))) return m; // not local, or already broken: left as it is
    const np = map.get(p) ?? p;
    if (np === p && newFile === file) return m;
    return `](${relink(newFile, np, (t.match(/#.*$/) || [''])[0])})`;
  });
}

function apply() {
  const ms = moves();
  const map = new Map(ms.map((m) => [m.from, m.to]));
  const files = git('ls-files').split('\n').filter((f) => f && TEXT.test(f) && !HISTORY(f));
  // Docs only: a non-markdown file (other than AGENTS.md) that names a moved path stops everything.
  const blockers = files.filter((f) => !/\.md$/.test(f) && ms.some((m) => fs.readFileSync(path.join(ROOT, f), 'utf8').includes(m.from)));
  if (blockers.length) { console.log('STOP: non-doc files name a moved path:', blockers); process.exit(1); }
  const md = files.filter((f) => /\.md$/.test(f));
  const texts = new Map(md.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
  let touched = 0;
  for (const [f, text] of texts) {
    const nf = map.get(f) ?? f;
    const out = rewrite(text, f, nf, map);
    if (nf !== f) { fs.mkdirSync(path.dirname(path.join(ROOT, nf)), { recursive: true }); git('mv', f, nf); }
    if (out !== text) { fs.writeFileSync(path.join(ROOT, nf), out); touched++; }
  }
  console.log(`moved ${ms.length}; files whose links were rewritten ${touched}`);
}

const norm = (s) => s.replace(LINK, '](<link>)').replace(DOCPATH, '<doc>').replace(/\r\n/g, '\n');
function broken(read, list) {
  const out = new Set();
  for (const f of list.filter((f) => /\.md$/.test(f) && !HISTORY(f))) {
    for (const m of read(f).matchAll(LINK)) { const p = target(f, m[1]); if (p && !list.includes(p) && !fs.existsSync(path.join(ROOT, p))) out.add(`${f} -> ${m[1]}`); }
  }
  return out;
}

function check() {
  const a = process.argv;
  const ref = a.includes('--ref') ? a[a.indexOf('--ref') + 1] : 'HEAD';
  const plant = a.includes('--plant') ? a[a.indexOf('--plant') + 1] : null;
  const ms = moves();
  const fails = [];
  const now = git('ls-files').split('\n').filter((f) => f && TEXT.test(f));
  const read = (f) => {
    let s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (plant === 'stale' && f === 'docs/MAP.md') s += `\n[a stale link](${path.basename(ms[0].from)})\n`;
    if (plant === 'edit' && f === ms[0].to) s += '\nOne line the original never had.\n';
    return s;
  };
  // (1) moved text equals the original, links and doc paths aside.
  for (const m of ms) {
    if (!fs.existsSync(path.join(ROOT, m.to))) { fails.push(`missing: ${m.to}`); continue; }
    if (fs.existsSync(path.join(ROOT, m.from))) fails.push(`still at the old path: ${m.from}`);
    if (norm(read(m.to)) !== norm(git('show', `${ref}:${m.from}`))) fails.push(`text changed beyond links: ${m.to}`);
  }
  // (2) no live file names an old path (as docs/<old> or as a link that resolves to it).
  const olds = new Set(ms.map((m) => m.from));
  for (const f of now.filter((f) => !HISTORY(f))) {
    const s = read(f);
    for (const p of s.match(DOCPATH) ?? []) if (olds.has(p)) fails.push(`${f} names ${p}`);
    if (/\.md$/.test(f)) for (const l of s.matchAll(LINK)) { const p = target(f, l[1]); if (p && olds.has(p)) fails.push(`${f} links ${l[1]} (an old path)`); }
  }
  // (3) no new broken link.
  const before = git('ls-tree', '-r', '--name-only', ref).split('\n').filter(Boolean);
  const was = broken((f) => git('show', `${ref}:${f}`), before.filter((f) => /\.md$/.test(f) && !HISTORY(f)));
  const wasT = new Set([...was].map((x) => x.split(' -> ')[1]));
  for (const b of broken(read, now)) if (!wasT.has(b.split(' -> ')[1])) fails.push(`newly broken: ${b}`);
  console.log(`ref ${ref}; moves ${ms.length}; links already broken at ref ${was.size}${plant ? `; PLANTED: ${plant}` : ''}`);
  for (const f of fails.slice(0, 15)) console.log('FAIL', f);
  console.log(fails.length ? `VERIFY: FAIL (${fails.length})` : 'VERIFY: PASS');
  process.exit(fails.length ? 1 : 0);
}

({ apply, check }[process.argv[2]] ?? (() => { console.log('usage: apply | check [--ref R] [--plant stale|edit]'); process.exit(1); }))();
