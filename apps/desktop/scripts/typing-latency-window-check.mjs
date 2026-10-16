// TYPING-LATENCY - THE WINDOW'S EQUIVALENCE CHECK (browserless). store/hiddenMarks.ts now runs every editing rule on a window of whole
// lines around the edit instead of the whole text. That is only a speed-up if it changes NOTHING: for every rule, the windowed result
// must be byte-identical to the whole-text result - text, caret and the structural flag. This bundles the real module with esbuild
// (the repo's own copy, nothing installed) and compares the two on seeded random pages built from the real vocabulary (bold, italic,
// underline, strike, the lead tokens, tabs, headings, empty lines), long enough that the window is always in play, at random edit
// points - line starts and ends included, where the window's margins matter.
// Run: node apps/desktop/scripts/typing-latency-window-check.mjs [cases]   (no browser, no box turn)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const pnpmDir = join(root, 'node_modules', '.pnpm');
const esbuildPkg = readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d));
const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
if (!esbuildBin || !existsSync(esbuildBin)) { console.log('TYPING-LATENCY WINDOW VERIFY: FAIL - esbuild not found under node_modules/.pnpm'); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'wz-window-'));
const out = join(tmp, 'hiddenMarks.mjs');
execFileSync(process.execPath, [esbuildBin, join(here, '..', 'src', 'store', 'hiddenMarks.ts'), '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`], { stdio: 'pipe' });
const hm = await import(pathToFileURL(out).href);
rmSync(tmp, { recursive: true, force: true });

const CASES = Number(process.argv[2]) || 4000;
// mulberry32 (a first run's LCG never once picked replaceRange - its low bits cycle; the coverage guard below now fails on that)
let seed = 20261014;
const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const WORDS = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'door', 'opened', 'x', 'quiet', 'river'];
const word = () => {
  const w = pick(WORDS);
  const r = rnd();
  if (r < 0.10) return `**${w}**`;
  if (r < 0.18) return `*${w}*`;
  if (r < 0.24) return `__${w}__`;
  if (r < 0.28) return `~~${w}~~`;
  if (r < 0.31) return `***${w}***`;
  if (r < 0.33) return '**';           // a lone or empty-pair mark
  if (r < 0.35) return '*';
  // TYPING-LATENCY x FONT-SPAN (ledger 79): font spans - two DIFFERENT marks (`[` and `]{.font-<slug>}`), one holding emphasis, and a
  // bare bracket - so the window is proven to read a font span exactly as the whole text does
  if (r < 0.39) return `[${w} ${pick(WORDS)}]{.font-courier-prime}`;
  if (r < 0.41) return `[**${w}**]{.font-atkinson-hyperlegible}`;
  if (r < 0.42) return `[${w}]`;
  return w;
};
const line = () => {
  const r = rnd();
  if (r < 0.12) return '';
  let lead = '';
  const l = rnd();
  if (l < 0.10) lead = '- ';
  else if (l < 0.14) lead = '-+ ';
  else if (l < 0.18) lead = '> ';
  else if (l < 0.21) lead = '>< ';
  else if (l < 0.24) lead = '# ';
  else if (l < 0.27) lead = '## ';
  else if (l < 0.31) lead = '\t';
  else if (l < 0.33) lead = '\t- ';
  const n = 1 + Math.floor(rnd() * 14);
  return lead + Array.from({ length: n }, word).join(' ');
};
const page = () => {
  const lines = [];
  let len = 0;
  while (len < 6000 + rnd() * 6000) { const l = line(); lines.push(l); len += l.length + 1; }
  if (rnd() < 0.2) lines.push('');     // a page that ends in a newline
  return lines.join('\n');
};
const point = (text) => {
  const r = rnd();
  if (r < 0.25) { const starts = [0]; for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1); return pick(starts); }
  if (r < 0.45) { const ends = []; for (let i = 0; i < text.length; i++) if (text[i] === '\n') ends.push(i); ends.push(text.length); return pick(ends); }
  return Math.floor(rnd() * (text.length + 1));
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const RULES = ['replaceRange', 'backspaceAt', 'deleteAt', 'wordBackspaceAt', 'wordDeleteAt', 'enterAt'];
const fails = [];
const tally = {};
let changed = 0;
for (let c = 0; c < CASES; c++) {
  const text = page();
  const p = point(text);
  const q = rnd() < 0.5 ? p : Math.min(text.length, p + Math.floor(rnd() * 400));
  const rule = RULES[c % RULES.length];   // round-robin: every rule gets its share
  const ins = pick(['a', ' ', 'word', '', '\n', 'two\nlines', '*']);
  const args = rule === 'replaceRange' ? [text, p, q, ins] : rule === 'enterAt' ? [text, p, q] : [text, p];
  let w, u;
  try { w = hm[rule](...args); } catch (e) { w = { threw: String(e) }; }
  try { u = hm.__unwindowed[rule](...args); } catch (e) { u = { threw: String(e) }; }
  tally[rule] = (tally[rule] || 0) + 1;
  if (u && u.text !== undefined && u.text !== text) changed++;
  if (!same(w, u)) fails.push({ rule, p, q, ins, windowed: w && { caret: w.caret, structural: w.structural, len: w.text && w.text.length }, whole: u && { caret: u.caret, structural: u.structural, len: u.text && u.text.length } });
}
// the premise: the pages are long enough that the window is in play (a short page skips it, and would prove nothing)
const premise = page().length > 4000;
// coverage, printed and enforced: every rule ran its share, and most cases really edited the page (a rule that returns null or the
// text unchanged on every case would be 'equal' and prove nothing)
const covered = RULES.every((r) => (tally[r] || 0) >= Math.floor(CASES / RULES.length));
const editedEnough = changed >= CASES * 0.5;
console.log(JSON.stringify({ cases: CASES, perRule: tally, casesThatChangedTheText: changed, failures: fails.length, firstFailures: fails.slice(0, 5) }, null, 2));
const pass = premise && covered && editedEnough && fails.length === 0;
console.log(pass ? `\nTYPING-LATENCY WINDOW VERIFY: PASS (${CASES} cases, windowed == whole-text on every rule)` : `\nTYPING-LATENCY WINDOW VERIFY: FAIL - ${fails.length}/${CASES} differ${premise ? '' : ' (premise: pages too short for the window)'}${covered ? '' : ' (coverage: a rule ran short)'}${editedEnough ? '' : ' (coverage: too few cases edited the text)'}`);
process.exit(pass ? 0 : 1);
