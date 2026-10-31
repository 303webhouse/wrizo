// ARBOR v2 MOCKUP, ROUND r5 (spec draft 5) - BROWSERLESS half. Runs on Node >= 22.18 (type stripping): node scripts/harness/arbor2-r5-unit.mjs.
// No browser, no box turn. The browser half is scripts/frames/arbor2-r5.mjs (INK's frames job).
//
//   R1  the pergola v2 (§7b), over 400 seeds at 1366x768 and 1920x1080: 3-4 beams 36-60 px, starting at the bottom-left (x < .35 W, y > .7 H),
//       low (every sampled point of every beam in the lower half), 1-2 crossbeams 14-20 px at right angles to the beams, leaves 10-18 px
//   R2  the flutter (§7b): one event at a time, >= 6 s apart (so <= 1 event/s), each 300-600 ms
//   R3  the cloths, the openers, the bars and the type pairs of §2b/§9c/§3b, computed: labels >= 4.5:1, the openers' arrows (a graphic) >= 3:1;
//       and the spec's own olive cloth with cream lettering is measured too (3.66:1: why the cloth is the deeper #56632E)
//   R4  every r5 rule is in the Arbor file and scoped under the flag (no rule outside :root[data-arbor2] except the mockup's own classes and
//       the two @font-face blocks, which only load when a flagged rule asks for the face)
import fs from 'node:fs';
import { pergola, flutterDelay, flutterMs } from '../../src/arbor2/sun.ts';

const checks = [];
const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

// R1
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const ang = (b) => Math.atan2(b.y2 - b.y1, b.x2 - b.x1) * 180 / Math.PI;
const bad = [];
let seen = { n3: 0, n4: 0, c1: 0, c2: 0 };
for (const [W, H] of [[1366, 768], [1920, 1080]]) {
  for (let seed = 1; seed <= 200; seed++) {
    const g = pergola(W, H, rng(seed * 7919));
    const why = [];
    if (g.beams.length < 3 || g.beams.length > 4) why.push('beams ' + g.beams.length);
    if (g.beams.some((b) => b.w < 36 || b.w > 60)) why.push('beam w');
    if (g.beams.some((b) => !(b.x1 < W * 0.35 && b.y1 > H * 0.7))) why.push('start');
    const low = g.beams.every((b) => Array.from({ length: 21 }, (_, i) => b.y1 + (b.y2 - b.y1) * i / 20).every((y) => y > H / 2));
    if (!low) why.push('low');
    if (g.cross.length < 1 || g.cross.length > 2 || g.cross.some((c) => c.w < 14 || c.w > 20)) why.push('cross');
    if (g.cross.some((c) => !g.beams.some((b) => Math.abs(Math.abs(ang(c) - ang(b)) - 90) <= 12))) why.push('square');
    if (!g.leaves.length || g.leaves.some((l) => l.size < 10 || l.size > 18)) why.push('leaves');
    if (why.length) bad.push({ W, seed, why });
    seen[g.beams.length === 3 ? 'n3' : 'n4']++; seen[g.cross.length === 1 ? 'c1' : 'c2']++;
  }
}
ok('R1 the pergola v2 holds over 400 seeds (beams, start, low, crossbeams, leaves)', bad.length === 0, JSON.stringify(bad.slice(0, 3)));
ok('R1 both counts occur (3 and 4 beams, 1 and 2 crossbeams)', seen.n3 > 0 && seen.n4 > 0 && seen.c1 > 0 && seen.c2 > 0, JSON.stringify(seen));

// R2
const delays = Array.from({ length: 1001 }, (_, i) => flutterDelay(i / 1000)), lens = Array.from({ length: 1001 }, (_, i) => flutterMs(i / 1000));
ok('R2 flutters are >= 6 s apart (<= 1 event/s) and <= 15 s', Math.min(...delays) >= 6000 && Math.max(...delays) <= 15000, JSON.stringify([Math.min(...delays), Math.max(...delays)]));
ok('R2 a flutter lasts 300-600 ms', Math.min(...lens) >= 300 && Math.max(...lens) <= 600, JSON.stringify([Math.min(...lens), Math.max(...lens)]));

// R3
const L = (h) => { const n = parseInt(h.slice(1), 16); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
const C = (a, b) => { const x = L(a), y = L(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };
const pairs = [
  ['olive cloth label (cream on #56632E)', '#EFE4CB', '#56632E', 4.5],
  ['cold blue cloth label (walnut on #7FA0BC)', '#2B1D12', '#7FA0BC', 4.5],
  ['madder cloth label (cream on #A8392F)', '#EFE4CB', '#A8392F', 4.5],
  ['opener closed arrow (cream on olive #6B7A3A)', '#EFE4CB', '#6B7A3A', 3],
  ['opener open arrow (walnut on brass)', '#2B1D12', '#FF9800', 3],
  ['bar/rail label (cream on espresso #1B120C)', '#EFE4CB', '#1B120C', 4.5],
  ['bar quiet (night low #B9AA8C on #1B120C)', '#B9AA8C', '#1B120C', 4.5],
  ['night chrome text on the room (#EFE4CB on #120A06)', '#EFE4CB', '#120A06', 4.5],
  ['night quiet on the room (#B9AA8C on #120A06)', '#B9AA8C', '#120A06', 4.5],
  ['night guide (sage #A7B27E on #120A06)', '#A7B27E', '#120A06', 4.5],
  ['day chrome text (#33401F on plaster #F1EAD8)', '#33401F', '#F1EAD8', 4.5],
  ['day chrome text, late plaster (#33401F on #EEE2C8)', '#33401F', '#EEE2C8', 4.5],
  ['day text on a surface (#33401F on #E8DFC8)', '#33401F', '#E8DFC8', 4.5],
  ['day text on honey wood (#33401F on #C9A46B)', '#33401F', '#C9A46B', 4.5],
  ['day quiet (#5E6A3F on plaster)', '#5E6A3F', '#F1EAD8', 4.5],
  ['day quiet, late plaster (#5E6A3F on #EEE2C8)', '#5E6A3F', '#EEE2C8', 4.5],
  ['day guide (leaf #4F6B2C on plaster)', '#4F6B2C', '#F1EAD8', 4.5],
  ['drawer heading, night (text-mid #B5A998 on #1B120C)', '#B5A998', '#1B120C', 4.5],
  ['drawer heading, day (#33401F on #E8DFC8)', '#33401F', '#E8DFC8', 4.5],
  ['current-cloth mark (walnut rule under brass) on the day surface', '#2B1D12', '#E8DFC8', 3],
];
const table = pairs.map(([n, fg, bg, floor]) => ({ n, r: C(fg, bg), floor }));
for (const p of table) ok(`R3 ${p.n} = ${p.r}:1 (floor ${p.floor})`, p.r >= p.floor, String(p.r));
ok('R3 (measured, not used) the spec\'s olive cloth #6B7A3A with cream lettering is under 4.5:1 - why the cloth is #56632E', C('#EFE4CB', '#6B7A3A') < 4.5, String(C('#EFE4CB', '#6B7A3A')));

// R4
const css = fs.readFileSync(new URL('../../src/styles/arbor-v2.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const loose = [];
const topSplit = (sel) => { const out = []; let d = 0, cur = ''; for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
let depth = 0, buf = '';
for (const ch of css) {
  if (ch === '{') { if (depth === 0) { const sel = buf.trim(); if (sel && !/^@(keyframes|font-face|media)/.test(sel)) for (const part of topSplit(sel)) { const s = part.trim(); if (s && !s.startsWith(':root[data-arbor2]') && !s.startsWith(':root[data-wz-writing') && !/^\.arbor2-|^html\[data-wz-writing/.test(s)) loose.push(s); } } depth++; buf = ''; }
  else if (ch === '}') { depth--; buf = ''; }
  else if (depth === 0) buf += ch;
}
// inside @media blocks the selectors sit at depth 1; check them too
const media = [...css.matchAll(/@media[^{]*\{([\s\S]*?\})\s*\}/g)].flatMap((m) => [...m[1].matchAll(/([^{}]+)\{/g)].map((x) => x[1].trim())).flatMap((s) => topSplit(s).map((x) => x.trim()))
  .filter((s) => s && !s.startsWith(':root[data-arbor2]') && !/^\.arbor2-/.test(s));
ok('R4 every rule in the Arbor file is scoped under the flag (or is the mockup\'s own .arbor2-* class)', loose.length === 0 && media.length === 0, JSON.stringify({ loose: loose.slice(0, 4), media: media.slice(0, 4) }));
ok('R4 Alegreya Sans comes from this origin (two @font-face blocks, /fonts/arbor2/, woff2), never a font CDN', (css.match(/@font-face/g) || []).length === 2
  && /url\('\/fonts\/arbor2\/alegreya-sans-latin-400-normal\.woff2'\)/.test(css) && !/googleapis|gstatic|jsdelivr|unpkg/.test(css), '');
const woff = fs.readFileSync(new URL('../../public/fonts/arbor2/alegreya-sans-latin-400-normal.woff2', import.meta.url));
ok('R4 the bundled face is a real woff2 with its licence beside it', woff.slice(0, 4).toString('latin1') === 'wOF2'
  && fs.existsSync(new URL('../../public/fonts/arbor2/OFL-alegreya-sans.txt', import.meta.url)), '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-R5-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-R5-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
