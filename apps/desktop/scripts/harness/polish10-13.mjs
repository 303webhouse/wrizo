// POLISH #10 ITEM 13 (INK) - the Outline / Storyboard dress. BROWSERLESS (source) half; the live half is polish10-13-part2.mjs (a box turn).
//   13a  title and text run together ("FirstOne.") - ALREADY covered: it was DATA (the blur wrote the newline-less input over the card), fixed in #8 by outline-blur.mjs; the row input holds only the title and the text
//        sits beside it. Here: the text keeps a quiet gap of its own so the two can never touch whatever the title's width does (live: title right edge to text left edge >= 8 px, every skin).
//   13b  the board stage's left chevron tab (the Sliver's grip, 16 px wide, on the stage's left edge) sat over the Outline's first column (the row numbers): the Outline starts clear of it.
//   13c  the Storyboard's lane box (and its cards) have rounded corners: square, Nick's rule.
// Every check has a mutant, its landing asserted.   Run: node scripts/harness/polish10-13.mjs   (from apps/desktop; no box needed)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const readRaw = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// The LAST rule that sets `prop` for exactly this selector in the stylesheet (the cascade's winner when nothing out-ranks it): its value, or null.
function last(css, selector, prop) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let v = null;
  for (const m of css.matchAll(new RegExp(`(?:^|[}\\n,\\s])${esc}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, 'g'))) {
    const d = new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;}]+)`).exec(m[1]);
    if (d) v = d[1].trim();
  }
  return v;
}
const px = (v) => { const m = /^(-?[\d.]+)px$/.exec(v || ''); return m ? Number(m[1]) : v === '0' ? 0 : null; };
// padding-left from a `padding:` shorthand (1-4 values) or the longhand
function padLeft(css, selector) {
  const long = last(css, selector, 'padding-left');
  if (long) return px(long);
  const sh = last(css, selector, 'padding');
  if (!sh) return null;
  const p = sh.split(/\s+/);
  return px(p.length === 1 ? p[0] : p.length === 2 ? p[1] : p.length === 3 ? p[1] : p[3]);
}

function suite(css) {
  const R = {};
  const chk = (id, fn) => { try { const [pass, detail] = fn(); R[id] = { pass: !!pass, detail }; } catch (e) { R[id] = { pass: false, detail: String(e.message || e) }; } };
  chk('C1', () => { const r = last(css, '.board-lane', 'border-radius'); return [px(r) === 0, `the Storyboard lane box has square corners (border-radius ${r})`]; });
  chk('C2', () => { const r = last(css, '.board-sb-card', 'border-radius'); return [px(r) === 0, `the Storyboard cards inside it too (border-radius ${r})`]; });
  chk('B1', () => { const p = padLeft(css, '.board-outline'); return [p !== null && p >= 16, `the Outline starts at least the grip's 16 px from the stage's left edge (padding-left ${p}); the live half measures the clear gap`]; });
  chk('A1', () => { const m = last(css, '.board-outline-body', 'margin-left'); return [px(m) !== null && px(m) >= 8, `the row's text keeps its own gap from the title (margin-left ${m})`]; });
  chk('S1', () => { const g = last(css, '.wz-sliver-grip', 'width'); return [px(g) === 16, `the premise: the grip B1 clears is 16 px wide (${g}) - if it grows, B1's number grows with it`]; });
  return R;
}

const MUT = [
  { name: 'the lane box is rounded again', find: /(\.board-lane\{[^}]*?)border-radius:0;?/, to: '$1border-radius:6px;', red: ['C1'] },
  { name: 'the Storyboard cards are rounded again', find: /(\.board-sb-card\{[^}]*?)border-radius:0;?/, to: '$1border-radius:4px;', red: ['C2'] },
  { name: 'the Outline loses its clear of the grip', find: /\.board-outline\{ padding-left:\d+px; \}/, to: '', red: ['B1'] },
  { name: 'the row text loses its gap', find: /\.board-outline-body\{ margin-left:\d+px; \}/, to: '', red: ['A1'] },
];

const css0 = readRaw('index.css');
const res0 = suite(css0);
for (const [k, v] of Object.entries(res0)) ok(k, v.pass, v.detail);
let landed = 0, killed = 0;
for (const m of MUT) {
  const mutated = css0.replace(m.find, m.to);
  const did = mutated !== css0;
  const r = did ? suite(mutated) : {};
  const red = Object.entries(r).filter(([, v]) => !v.pass).map(([k]) => k);
  const dead = did && m.red.every((k) => red.includes(k));
  if (did) landed++;
  if (dead) killed++;
  ok(`mutant "${m.name}": landed and turns ${m.red.join('+')} RED`, dead, JSON.stringify({ did, red }));
}
ok(`all ${MUT.length} mutations landed and ${MUT.length} were killed`, landed === MUT.length && killed === MUT.length, `${landed} landed / ${killed} killed`);

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(`POLISH10-13 VERIFY: ${failed.length ? `FAIL - ${failed.length}/${checks.length}` : `PASS (${checks.length} checks)`}`);
process.exit(failed.length ? 1 : 0);
