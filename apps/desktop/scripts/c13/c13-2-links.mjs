#!/usr/bin/env node
// #13 step 2 proof (docs/cleanup/deploy-13-brief.md): every path that docs/MAP.md or a docs/map/*.md page names exists.
// A path is any `backticked` token with a slash or a file extension, or a markdown link target. It resolves against, in order:
// the page's own folder (links only), the repo root, apps/desktop/, apps/desktop/src/, apps/desktop/scripts/(harness/), docs/.
//   node apps/desktop/scripts/c13/c13-2-links.mjs            the check (VERIFY: PASS / FAIL)
//   node apps/desktop/scripts/c13/c13-2-links.mjs --plant    the same check with one planted bad path: must FAIL
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const pages = ['docs/MAP.md', ...fs.readdirSync(path.join(ROOT, 'docs/map')).filter((f) => f.endsWith('.md')).map((f) => `docs/map/${f}`)];
const BASES = ['', 'apps/desktop', 'apps/desktop/src', 'apps/desktop/scripts', 'apps/desktop/scripts/harness', 'docs'];
const looksLikePath = (t) => /^[\w.@-]+(\/[\w.@*-]+)+\/?$/.test(t) || /^[\w.-]+\.(tsx?|mjs|js|css|md|json|txt|sql|ya?ml)$/.test(t);
const exists = (t, from) => {
  const clean = t.replace(/#.*$/, '').replace(/\/$/, '');
  const cands = [...(from ? [path.join(path.dirname(path.join(ROOT, from)), clean)] : []), ...BASES.map((b) => path.join(ROOT, b, clean))];
  return cands.some((c) => (clean.includes('*') ? fs.existsSync(path.dirname(c)) : fs.existsSync(c)));
};

let checked = 0;
const bad = [];
for (const p of pages) {
  let text = fs.readFileSync(path.join(ROOT, p), 'utf8');
  if (process.argv.includes('--plant') && p === 'docs/MAP.md') text += '\n`store/noSuchFile.ts`\n';
  for (const m of text.matchAll(/`([^`\s]+)`/g)) {
    if (!looksLikePath(m[1]) || m[1].startsWith('window.') || m[1].includes('<')) continue;
    checked++;
    if (!exists(m[1])) bad.push(`${p}: \`${m[1]}\``);
  }
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|#)/.test(m[1])) continue;
    checked++;
    if (!exists(m[1], p)) bad.push(`${p}: (${m[1]})`);
  }
}
console.log(`pages ${pages.length}; paths checked ${checked}; missing ${bad.length}`);
for (const b of bad) console.log('MISSING', b);
console.log(bad.length ? 'VERIFY: FAIL' : 'VERIFY: PASS');
process.exit(bad.length ? 1 : 0);
