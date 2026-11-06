#!/usr/bin/env node
// #13 step 4d (Fable, Nov 1): the markdown links that were already broken before #13 (all in docs/menus/) were written from the
// repo root, so from docs/menus/ they miss their ../../ prefix. Browserless.
//
//   node apps/desktop/scripts/c13/c13-4d-links.mjs fix     write docs/cleanup/c13-4d-broken-links.tsv (every broken link, its fix) and
//        rewrite each link whose target exists from the repo root; a link whose target exists from neither place is listed, never touched
//   node apps/desktop/scripts/c13/c13-4d-links.mjs check [--plant unfix|ghost]
//        the proof: (1) no live .md file has a local link to a missing target; (2) every row of the list now reads its fixed form and the
//        file's link at that spot resolves; --plant: the same check on a mutated input: must FAIL.
//        #13 step 11: a row whose target step 11 deleted may read a permanent GitHub link to that file and anchor at a commit that holds
//        it; --plant perma: such a link pointed at a commit that does not hold it: must FAIL.
// Live = tracked .md files outside the ledger (docs/open-threads.md, docs/ledger/) and docs/evidence/, which keep old paths as history.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const LIST = 'docs/cleanup/c13-4d-broken-links.tsv';
const LINK = /\]\(([^)\s]+)\)/g;
const live = () => execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
  .filter((f) => /\.md$/.test(f) && f !== 'docs/open-threads.md' && !f.startsWith('docs/ledger/') && !f.startsWith('docs/evidence/'));
const local = (t) => !/^([a-z]+:|#)/i.test(t) && t.replace(/#.*$/, '') !== '';
const resolves = (file, t) => fs.existsSync(path.join(ROOT, path.dirname(file), t.replace(/#.*$/, '')));

function broken(texts) {
  const rows = [];
  for (const [f, s] of texts) for (const m of s.matchAll(LINK)) if (local(m[1]) && !resolves(f, m[1])) rows.push({ file: f, link: m[1] });
  return rows;
}

function fix() {
  const files = live();
  const texts = new Map(files.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
  const rows = broken(texts);
  const out = [];
  for (const r of rows) {
    const fromRoot = fs.existsSync(path.join(ROOT, r.link.replace(/#.*$/, '')));
    const up = path.posix.relative(path.posix.dirname(r.file), '') || '.';
    out.push({ ...r, fixed: fromRoot ? `${up}/${r.link}` : '' });
  }
  for (const [f] of texts) {
    const mine = out.filter((r) => r.file === f && r.fixed);
    if (!mine.length) continue;
    const map = new Map(mine.map((r) => [r.link, r.fixed]));
    const s = texts.get(f).replace(LINK, (all, t) => (map.has(t) && !resolves(f, t) ? `](${map.get(t)})` : all));
    fs.writeFileSync(path.join(ROOT, f), s);
  }
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  fs.writeFileSync(path.join(ROOT, LIST), [
    `# #13 step 4d: local markdown links broken at ${head.slice(0, 8)} (before this step), each rewritten from the repo root to the file's own folder.`,
    '# A row with an empty "fixed" had a target that exists from neither place and was left as written.',
    'file\tlink\tfixed',
    ...out.map((r) => `${r.file}\t${r.link}\t${r.fixed}`),
  ].join('\n') + '\n');
  console.log(`fix: ${out.length} broken, ${out.filter((r) => r.fixed).length} rewritten, ${out.filter((r) => !r.fixed).length} left (no target anywhere)`);
}

function check() {
  const plant = process.argv.includes('--plant') ? process.argv[process.argv.indexOf('--plant') + 1] : null;
  const rows = fs.readFileSync(path.join(ROOT, LIST), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#') && !l.startsWith('file\t'))
    .map((l) => { const [file, link, fixed] = l.split('\t'); return { file, link, fixed }; });
  const texts = new Map(live().map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
  // unfix: one fixed link loses its prefix again (the bug this step removes); ghost: a new link to a file that does not exist
  if (plant === 'unfix') { const r = rows.find((x) => x.fixed); texts.set(r.file, texts.get(r.file).replace(`](${r.fixed})`, `](${r.link})`)); }
  if (plant === 'ghost') texts.set('docs/MAP.md', texts.get('docs/MAP.md') + '\n[gone](map/never-was.md)\n');
  const fails = broken(texts).map((r) => `broken: ${r.file} -> ${r.link}`);
  // ---- PARKED - SUPERSEDED by #13 step 11 (deletes dead source files a listed row's fixed link points at). Kept VERBATIM and no longer run:
  // for (const r of rows) {
  //   if (!r.fixed) { fails.push(`left unfixed: ${r.file} -> ${r.link}`); continue; }
  //   const s = texts.get(r.file) ?? '';
  //   if (!s.includes(`](${r.fixed})`) || !resolves(r.file, r.fixed)) fails.push(`not fixed: ${r.file} -> ${r.fixed}`);
  // }
  // successor: the same rule, but a row whose fixed target is a file #13 step 11 DELETED (docs/cleanup/c13-11-files.txt) may instead read a
  // permanent link to that same file and anchor at a commit where git holds it (the doc's line anchors stay true there, and claim (1)
  // still forbids any broken local link). A permanent link to a commit that does NOT hold the file fails (--plant perma).
  const gone11 = fs.existsSync(path.join(ROOT, 'docs/cleanup/c13-11-files.txt'))
    ? fs.readFileSync(path.join(ROOT, 'docs/cleanup/c13-11-files.txt'), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => `apps/desktop/src/${l}`)
    : [];
  const holds = (sha, p) => { try { execFileSync('git', ['cat-file', '-e', `${sha}:${p}`], { cwd: ROOT, stdio: 'ignore' }); return true; } catch { return false; } };
  if (plant === 'perma') {
    const f = [...texts.keys()].find((k) => /\]\(https:\/\/github\.com\/303webhouse\/wrizo\/blob\/[0-9a-f]{40}\//.test(texts.get(k)));
    if (f) texts.set(f, texts.get(f).replace(/(\]\(https:\/\/github\.com\/303webhouse\/wrizo\/blob\/)[0-9a-f]{40}\//, `$1${'0'.repeat(40)}/`));
  }
  let permanent = 0;
  for (const r of rows) {
    if (!r.fixed) { fails.push(`left unfixed: ${r.file} -> ${r.link}`); continue; }
    const s = texts.get(r.file) ?? '';
    if (s.includes(`](${r.fixed})`) && resolves(r.file, r.fixed)) continue;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(r.file), r.fixed.replace(/#.*$/, '')));
    const anchor = (/#.*$/.exec(r.fixed) || [''])[0];
    const perma = gone11.includes(target)
      ? [...s.matchAll(/\]\(https:\/\/github\.com\/303webhouse\/wrizo\/blob\/([0-9a-f]{40})\/([^)#\s]+)(#[^)\s]*)?\)/g)].find((m) => m[2] === target && (m[3] || '') === anchor && holds(m[1], target))
      : null;
    if (perma) { permanent++; continue; }
    fails.push(`not fixed: ${r.file} -> ${r.fixed}`);
  }
  if (permanent) console.log(`rows read as a permanent link to a file #13 step 11 deleted: ${permanent}`);
  console.log(`list ${rows.length}; live .md files ${texts.size}${plant ? `; PLANTED: ${plant}` : ''}`);
  for (const f of fails.slice(0, 10)) console.log('FAIL', f);
  console.log(fails.length ? `LINKS: FAIL (${fails.length})` : 'LINKS: PASS (no live markdown link points at a missing file)');
  process.exit(fails.length ? 1 : 0);
}

({ fix, check }[process.argv[2]] ?? (() => { console.log('usage: fix | check [--plant unfix|ghost]'); process.exit(1); }))();
