#!/usr/bin/env node
// #13 step 6 (brief: "contiguous cut, global CSS"): index.css is cut at its own section banners into src/styles/, in the
// existing order, and becomes an ordered list of @imports. No rule moves relative to another. Browserless.
//
//   node apps/desktop/scripts/c13/c13-6-css-split.mjs split
//        cut index.css at the PARTS banners below; every cut must sit on its banner line at brace depth 0, outside a comment
//   node apps/desktop/scripts/c13/c13-6-css-split.mjs check --base <rev> [--plant swap|drop|edit|raw|helper]
//        (1) the joined source (scripts/global-css.mjs, what every source-reading script now reads) equals index.css at <rev>, byte for byte
//        (line endings aside); (2) no script under apps/desktop/scripts still reads src/index.css as a text, except the reads of an old
//        commit through git; --plant: the same check on a mutated input (two imports swapped, one dropped, one byte changed): must FAIL
//   node apps/desktop/scripts/c13/c13-6-css-split.mjs dist <a/dist-web> <b/dist-web> [--plant swap]
//        (3) the two builds are byte-identical: every file, its name (so its content hash) and its bytes; the global CSS asset is named.
//        --plant swap: b's global CSS asset with two of its rules swapped: must FAIL
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { globalCss, globalCssParts, srcText } from '../global-css.mjs';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SRC = path.join(ROOT, 'apps/desktop/src');
const arg = (n) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : null);

// [file, the first line of its section (1-based, at the split's base), the banner's title line, which must read so]
const PARTS = [
  ['01-tokens.css', 1, null],
  ['02-scrollbars.css', 343, 'FX7 S4'],
  ['03-theme-seam.css', 449, 'TH1'],
  ['04-flux.css', 488, 'TH2'],
  ['05-machina.css', 597, 'MACHINA'],
  ['06-flux-v2.css', 742, 'FLUX V2'],
  ['07-components.css', 1162, 'Component layer (D2)'],
  ['08-home.css', 1665, 'HOME port'],
  ['09-board-card.css', 1993, 'PW2 S2'],
  ['10-voice-wall.css', 2645, 'VW'],
  ['11-create-picker.css', 2706, 'F4'],
  ['12-studio-chrome.css', 2804, 'Writing studio chrome'],
  ['13-desk-frame.css', 3204, 'AB1'],
  ['14-ink-options.css', 4590, 'ITEM 121 I4'],
  ['15-boards-connected.css', 5550, 'PW1'],
  ['16-drawers-tree.css', 5965, 'Drawers tree'],
  ['17-pages-shelf.css', 6029, 'Pages & the Shelf'],
  ['18-desk-rail.css', 6048, 'Writing-screen redesign'],
  ['19-beginnings.css', 6656, 'BG1'],
  ['20-big-projects.css', 7174, 'BIG PROJECTS 1a'],
  ['21-help-me-choose.css', 7226, 'W4'],
];

// Brace depth and comment state at the start of every line.
function lineStates(text) {
  const states = [];
  let depth = 0, inComment = false, quote = null;
  states.push({ depth, inComment });
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inComment) { if (c === '*' && n === '/') { inComment = false; i++; } }
    else if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; }
    else if (c === '/' && n === '*') { inComment = true; i++; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === '{') depth++;
    else if (c === '}') depth--;
    if (c === '\n') states.push({ depth, inComment, quote });
  }
  return states;
}

function split() {
  const file = path.join(SRC, 'index.css');
  const text = fs.readFileSync(file, 'utf8');
  if (/^@import '\.\/styles\//m.test(text)) { console.log('index.css is already split'); process.exit(1); }
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  const states = lineStates(text);
  const fails = [];
  for (const [name, line, title] of PARTS) {
    const s = states[line - 1];
    if (s.depth !== 0 || s.inComment || s.quote) fails.push(`${name}: line ${line} is inside a block, comment or string`);
    if (title) {
      const banner = text.slice(starts[line - 1], starts[line + 1]);
      if (!/^\/\* *={5,}/.test(banner) || !banner.includes(title)) fails.push(`${name}: line ${line} is not the "${title}" banner`);
    }
  }
  if (fails.length) { fails.forEach((f) => console.log('FAIL', f)); process.exit(1); }
  fs.mkdirSync(path.join(SRC, 'styles'), { recursive: true });
  PARTS.forEach(([name, line], k) => {
    const end = k + 1 < PARTS.length ? starts[PARTS[k + 1][1] - 1] : text.length;
    fs.writeFileSync(path.join(SRC, 'styles', name), text.slice(starts[line - 1], end));
  });
  fs.writeFileSync(file, PARTS.map(([name]) => `@import './styles/${name}';${eol}`).join(''));
  console.log(`split: ${PARTS.length} files under src/styles/, index.css is ${PARTS.length} import lines`);
}

const noCR = (s) => s.replace(/\r\n/g, '\n');

function check() {
  const base = arg('base');
  const plant = arg('plant');
  if (!base) { console.log('check needs --base <rev> (the commit before the split)'); process.exit(1); }
  const before = noCR(execFileSync('git', ['show', `${base}:apps/desktop/src/index.css`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }));
  let parts = globalCssParts(SRC).map((p) => ({ ...p, text: fs.readFileSync(p.file, 'utf8') }));
  if (plant === 'swap') [parts[3], parts[4]] = [parts[4], parts[3]];
  if (plant === 'drop') parts.splice(9, 1);
  if (plant === 'edit') parts[12] = { ...parts[12], text: parts[12].text.replace(/padding:\s*/, 'padding: 1') };
  const now = noCR(parts.map((p) => p.text).join(''));
  const fails = [];
  if (!plant && noCR(globalCss(SRC)) !== now) fails.push('globalCss() does not read the parts in index.css order');
  // srcText is a drop-in for readFileSync(join(SRC, ...parts)): a read in several parts keeps every part (box turn, Nov 1: a
  // one-part srcText read th-machina-source's join(SRC, 'store', f) as the store/ folder, EISDIR)
  for (const parts of [['store', 'theme.ts'], ['components', 'Sliver.tsx'], ['main.tsx']]) {
    if (srcText(SRC, ...parts) !== fs.readFileSync(path.join(SRC, ...parts), 'utf8')) fails.push(`srcText(SRC, ${parts.join(', ')}) is not that file's text`);
  }
  if (srcText(SRC, 'index.css') !== globalCss(SRC)) fails.push("srcText(SRC, 'index.css') is not the joined text");
  if (now !== before) {
    let i = 0; while (i < now.length && now[i] === before[i]) i++;
    fails.push(`the joined source differs from index.css at ${base.slice(0, 8)} from line ${before.slice(0, i).split('\n').length}`);
  }
  // No script may read the split index.css as text: it now holds import lines only. A read of an OLD commit's index.css through
  // `git show <rev>:...` is history and stays.
  // A READER is a script whose code names index.css as a path (a quoted literal ending in index.css, outside a comment and outside a
  // `git show` of an old commit). Every reader must import scripts/global-css.mjs, must not readFileSync/readFile a line that names
  // index.css, and must not keep a raw readFileSync(join(SRC, ...)) helper, which would hand a caller the import list.
  const scripts = execFileSync('git', ['ls-files', 'apps/desktop/scripts'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter((f) => /\.mjs$/.test(f));
  const texts = new Map(scripts.filter((f) => !f.endsWith('c13/c13-6-css-split.mjs') && !f.endsWith('scripts/global-css.mjs'))
    .map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
  if (plant === 'raw') texts.set('apps/desktop/scripts/harness/planted.mjs', "import fs from 'node:fs';\nconst css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');\n");
  if (plant === 'helper') {
    const f = 'apps/desktop/scripts/harness/drawer-toggles.mjs';
    texts.set(f, texts.get(f).replace('srcText(SRC, rel)', "fs.readFileSync(path.join(SRC, rel), 'utf8')"));
  }
  const PATH_LIT = /['"`](?:[^'"`\n]*\/)?index\.css['"`]/;
  const readers = [], bad = [];
  for (const [f, s] of texts) {
    const code = s.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*)/.test(l) && !/git show/.test(l));
    if (!code.some((l) => PATH_LIT.test(l))) continue;
    readers.push(f);
    if (!/from '\.{1,2}\/global-css\.mjs'/.test(s)) bad.push(`${f}: names index.css but does not use global-css.mjs`);
    for (const l of code) if (/readFile(Sync)?\(/.test(l) && PATH_LIT.test(l)) bad.push(`${f}: reads index.css raw: ${l.trim().slice(0, 90)}`);
    if (/readFileSync\(\s*(path\.)?join\(\s*SRC\s*,/.test(s)) bad.push(`${f}: a raw readFileSync(join(SRC, ...)) read is left`);
  }
  if (bad.length) fails.push(`${bad.length} reader problems: ${bad.slice(0, 4).join(' | ')}`);
  console.log(`readers of index.css: ${readers.length}`);
  console.log(`parts ${parts.length}; joined ${now.length} chars vs ${before.length} at ${base.slice(0, 8)}; scripts scanned ${scripts.length}${plant ? `; PLANTED: ${plant}` : ''}`);
  for (const f of fails) console.log('FAIL', f);
  console.log(fails.length ? `SPLIT: FAIL (${fails.length})` : 'SPLIT: PASS (the joined source is index.css as it was; no script reads the import list as CSS)');
  process.exit(fails.length ? 1 : 0);
}

function dist() {
  const i = process.argv.indexOf('dist');
  const [a, b] = [process.argv[i + 1], process.argv[i + 2]];
  const plant = arg('plant');
  const list = (d) => {
    const out = new Map();
    const walk = (p) => { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const q = path.join(p, e.name); if (e.isDirectory()) walk(q); else out.set(path.relative(d, q).replace(/\\/g, '/'), fs.readFileSync(q)); } };
    walk(d);
    return out;
  };
  const A = list(a), B = list(b);
  const globalOf = (m) => [...m.keys()].find((k) => /^assets\/index-[^/]+\.css$/.test(k));
  if (plant === 'swap') {
    const k = globalOf(B), s = B.get(k).toString('utf8');
    const rules = s.split('}');
    [rules[10], rules[11]] = [rules[11], rules[10]];
    B.set(k, Buffer.from(rules.join('}')));
  }
  const fails = [];
  for (const k of new Set([...A.keys(), ...B.keys()])) {
    if (!A.has(k) || !B.has(k)) fails.push(`${k}: only in ${A.has(k) ? 'a' : 'b'}`);
    else if (!A.get(k).equals(B.get(k))) fails.push(`${k}: bytes differ`);
  }
  const g = globalOf(A);
  const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
  console.log(`a ${A.size} files, b ${B.size} files; global CSS a ${g} (${A.get(g)?.length} b, sha256 ${sha(A.get(g))}), b ${globalOf(B)}${plant ? `; PLANTED: ${plant}` : ''}`);
  for (const f of fails.slice(0, 10)) console.log('FAIL', f);
  console.log(fails.length ? `DIST: FAIL (${fails.length})` : 'DIST: PASS (every file in the two builds has the same name and the same bytes)');
  process.exit(fails.length ? 1 : 0);
}

({ split, check, dist }[process.argv[2]] ?? (() => { console.log('usage: split | check --base <rev> [--plant swap|drop|edit|raw|helper] | dist <a> <b> [--plant swap]'); process.exit(1); }))();
