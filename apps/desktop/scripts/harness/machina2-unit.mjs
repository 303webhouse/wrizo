// MACHINA v2 MOCKUP, ROUND r1 (spec draft 4) - BROWSERLESS half. Runs on Node >= 22.18 (type stripping): node scripts/harness/machina2-unit.mjs.
// No browser, no box turn. The browser half is scripts/frames/machina2.mjs (INK's frames job, -f themes=machina).
//
//   U1  the readout (§8.2): every figure a fact - words, ~pages at 250 a page, reading time at 230 wpm, "Part n of m", the goal's true remainder
//   U2  the parts unit (Fable ruling 3): a Part counts once it has any words
//   U3  the switches (§11): in session only; a component that merely imports them writes nothing to <html>
//   U4  every pair of §2's palette and the mockup's surfaces, computed: labels and quiet text >= 4.5:1, marks >= 3:1
//   U5  every rule in the Machina file is scoped under the flag (or is the mockup's own .machina2-* class)
import fs from 'node:fs';
import { readoutLine, pagesEstimate, readingTime, partsCovered, WORDS_PER_PAGE, WORDS_PER_MINUTE } from '../../src/machina2/readout.ts';
import * as sw from '../../src/machina2/switches.ts';

const checks = [];
const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

// U1
ok('U1 the constants are the spec\'s (250 words a page, 230 wpm)', WORDS_PER_PAGE === 250 && WORDS_PER_MINUTE === 230, '');
ok('U1 the spec\'s own example line', readoutLine(28, [1, 4], null, 0) === '28 words · ~0.1 pages · <1 min read · Part 1 of 4 · no goal set', readoutLine(28, [1, 4], null, 0));
ok('U1 a loose File shows no Part', readoutLine(28, null, null, 0) === '28 words · ~0.1 pages · <1 min read · no goal set', readoutLine(28, null, null, 0));
ok('U1 the goal\'s true remainder (2000-word goal, 28 written: 1,972 to goal)', /· 1,972 words to goal$/.test(readoutLine(28, null, { n: 2000, unit: 'words' }, 28)), readoutLine(28, null, { n: 2000, unit: 'words' }, 28));
ok('U1 a lap\'s remainder after a goal (1000-word goal, 1200 written: 800 to goal) and "goal met" exactly at it', /800 words to goal$/.test(readoutLine(1200, null, { n: 1000, unit: 'words' }, 1200)) && /goal met$/.test(readoutLine(1000, null, { n: 1000, unit: 'words' }, 1000)), '');
ok('U1 the estimates are labelled "~" (pages, minutes) and short reads say <1', pagesEstimate(500) === '~2.0 pages' && readingTime(100) === '<1 min read' && readingTime(690) === '~3 min read', JSON.stringify([pagesEstimate(500), readingTime(100), readingTime(690)]));
ok('U1 one word reads in the singular', readoutLine(1, null, null, 0).startsWith('1 word · '), readoutLine(1, null, null, 0));
// U2
ok('U2 a Part counts once it has any words (3 Parts, one empty: 2 of 3)', JSON.stringify(partsCovered([12, 0, 1])) === '[2,3]', JSON.stringify(partsCovered([12, 0, 1])));
// U3
ok('U3 importing the switches writes nothing (no document here; nothing thrown, every switch on, the Run in words)', sw.isOn('command') && sw.isOn('wash') && sw.getRunUnit() === 'words', JSON.stringify(sw.getSwitches()));
sw.setSwitch('readout', false); sw.setSwitch('runUnit', 'parts');
ok('U3 a switch turns off and the Run unit changes, in memory', !sw.isOn('readout') && sw.getRunUnit() === 'parts', JSON.stringify(sw.getSwitches()));
sw.setSwitch('readout', true); sw.setSwitch('runUnit', 'words');
const swSrc = fs.readFileSync(new URL('../../src/machina2/switches.ts', import.meta.url), 'utf8');
ok('U3 nothing in the switches touches storage', !/localStorage|sessionStorage|indexedDB/.test(swSrc), '');

// U4
const L = (h) => { const n = parseInt(h.slice(1), 16); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
const C = (a, b) => { const x = L(a), y = L(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };
const pairs = [
  // COOL light: room G1, panels G0, labels G5, quiet G4, guidance #3F6183
  ['cool light labels G5 on the room G1', '#3A4047', '#E6E8EA', 4.5], ['cool light labels G5 on panels G0', '#3A4047', '#F4F5F6', 4.5],
  ['cool light quiet G4 on the room G1', '#5E666E', '#E6E8EA', 4.5], ['cool light quiet G4 on panels G0', '#5E666E', '#F4F5F6', 4.5],
  ['cool light guidance text #3F6183 on the room', '#3F6183', '#E6E8EA', 4.5], ['cool light guidance text #3F6183 on panels', '#3F6183', '#F4F5F6', 4.5],
  ['light page ink #1C1C1C on #FBFBFA', '#1C1C1C', '#FBFBFA', 7], ['light page low ink G4 on #FBFBFA', '#5E666E', '#FBFBFA', 4.5],
  // COOL dark
  ['cool dark labels G1 on the room G7', '#E6E8EA', '#151719', 4.5], ['cool dark labels G1 on panels G6', '#E6E8EA', '#23272B', 4.5],
  ['cool dark quiet G3 on the room G7', '#9AA1A8', '#151719', 4.5], ['cool dark quiet G3 on panels G6', '#9AA1A8', '#23272B', 4.5],
  ['cool dark guidance #8FA3B8 on panels G6', '#8FA3B8', '#23272B', 4.5], ['dark page ink #E6E6E3 on #1A1B1D', '#E6E6E3', '#1A1B1D', 7], ['dark page low ink G3 on #1A1B1D', '#9AA1A8', '#1A1B1D', 4.5],
  // NEUTRAL
  ['neutral light labels #3B3833 on the room #E9E6E1', '#3B3833', '#E9E6E1', 4.5], ['neutral light quiet #5F5A53 on the room', '#5F5A53', '#E9E6E1', 4.5], ['neutral light quiet #5F5A53 on panels #F5F3EF', '#5F5A53', '#F5F3EF', 4.5],
  ['neutral light guidance #3F6183 on the room', '#3F6183', '#E9E6E1', 4.5],
  ['neutral dark labels #E6E2DB on the room #171614', '#E6E2DB', '#171614', 4.5], ['neutral dark quiet #A09A91 on panels #242220', '#A09A91', '#242220', 4.5], ['neutral dark guidance #8FA3B8 on panels #242220', '#8FA3B8', '#242220', 4.5],
  // THE BARS (both tones)
  ['COOL bar labels G1 on #1E262E', '#E6E8EA', '#1E262E', 4.5], ['COOL bar quiet G3 on #1E262E', '#9AA1A8', '#1E262E', 4.5], ['COOL bar guidance (Plan →, ?) #8FA3B8 on #1E262E', '#8FA3B8', '#1E262E', 4.5],
  ['NEUTRAL bar labels #E6E2DB on #201E1B', '#E6E2DB', '#201E1B', 4.5], ['NEUTRAL bar quiet #A09A91 on #201E1B', '#A09A91', '#201E1B', 4.5], ['NEUTRAL bar guidance #8FA3B8 on #201E1B', '#8FA3B8', '#201E1B', 4.5],
  // MARKS (graphics, 3:1): the brass underline on each surface it sits on, the blue mark outline
  ['brass underline on the dark bars', '#FF9800', '#1E262E', 3], ['brass underline on the dark panels', '#FF9800', '#23272B', 3],
  ['blue ask outline #7FA0BC on dark panels', '#7FA0BC', '#23272B', 3],
];
for (const [n, fg, bg, floor] of pairs) { const r = C(fg, bg); ok(`U4 ${n} = ${r}:1 (floor ${floor})`, r >= floor, String(r)); }
// measured, not used: the light room cannot carry brass as TEXT or as the only mark on a light panel - why "where you are" letters in the label colour
ok('U4 (measured, not used) brass text on the light room fails 4.5:1 (1.9) - why --accent-rest is the label colour, and brass only a mark on dark', C('#FF9800', '#E6E8EA') < 4.5, String(C('#FF9800', '#E6E8EA')));
ok('U4 (measured, not used) the blue mark #7FA0BC as TEXT on the light room fails 4.5:1 - why light guidance text is #3F6183', C('#7FA0BC', '#E6E8EA') < 4.5, String(C('#7FA0BC', '#E6E8EA')));

// U5
const css = fs.readFileSync(new URL('../../src/styles/machina-v2.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const topSplit = (sel) => { const out = []; let d = 0, cur = ''; for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const loose = []; let depth = 0, buf = '';
for (const ch of css) {
  if (ch === '{') { if (depth === 0) { const sel = buf.trim(); if (sel && !/^@/.test(sel)) for (const part of topSplit(sel)) { const s = part.trim(); if (s && !s.startsWith(':root[data-machina2]') && !s.startsWith(':root[data-wz-writing') && !/^\.machina2-/.test(s)) loose.push(s); } } depth++; buf = ''; }
  else if (ch === '}') { depth--; buf = ''; }
  else if (depth === 0) buf += ch;
}
ok('U5 every rule in the Machina file is scoped under the flag (or is the mockup\'s own .machina2-* class)', loose.length === 0, JSON.stringify(loose.slice(0, 4)));
ok('U5 no font CDN, no new face (Plex and Source Sans are the app\'s own)', !/@font-face|googleapis|gstatic|jsdelivr|unpkg/.test(css), '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nMACHINA2-UNIT: PASS (${checks.length} checks)` : `\nMACHINA2-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
