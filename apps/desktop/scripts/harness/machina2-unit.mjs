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
// (r3 driver fix: room.ts no longer exports roomOf - the U6 checks that used it are parked below)
// import { roomOf } from '../../src/machina2/room.ts';
import * as r3 from '../../src/machina2/room.ts';   // U7 (r3)

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

// U6 (r2) THE ROOM: data-room when set, else the page tone (Nick's pick via Fable, Oct 31); the room's CSS reads the resolved room, the page's
// CSS the tone alone; in session only.
// PARKED 2026-11-01 (SUPERSEDED by Fable's ruling, Nov 1: "Room settled: Follow the clock / Always day / Always night (unset = clock,
// 07:00-19:00 local)" - unset, the room follows the clock, not the page). Original, verbatim:
// ok('U6 unset, the room follows the page (light -> light, dark -> dark, no tone -> dark, as the base theme reads it)',
//   roomOf(null, 'light') === 'light' && roomOf(null, 'dark') === 'dark' && roomOf(null, null) === 'dark', '');
// ok('U6 set, data-room wins over the page in all four mixes', roomOf('light', 'dark') === 'light' && roomOf('dark', 'light') === 'dark' && roomOf('light', 'light') === 'light' && roomOf('dark', 'dark') === 'dark', '');
// ok('U6 a stray data-room value is ignored (the page decides)', roomOf('day', 'light') === 'light' && roomOf('', 'dark') === 'dark', '');
// SUCCESSOR: U7 below (the choice, the clock, the wait for the writer).
const roomSrc = fs.readFileSync(new URL('../../src/machina2/room.ts', import.meta.url), 'utf8');
ok('U6 nothing in the room touches storage', !/localStorage|sessionStorage|indexedDB/.test(roomSrc), '');
const roomRules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);
const PAGE_VARS = /--(paper|paper-dim|paper-border|ink-on-paper|ink-on-paper-low)\s*:/;
const ROOM_VARS = /--(ink-950|chrome-surface|ink-900|ink-border|text-hi|text-mid|text-low|machina2-guide)\s*:/;
ok('U6 no rule keyed on the light ROOM sets a page value, and no rule keyed on the light PAGE sets a room value (so the four mixes are independent)',
  roomRules.every(([sel, body]) => !(/data-machina2-room='light'/.test(sel) && PAGE_VARS.test(body)) && !(/data-page='light'/.test(sel) && !/\.board-canvas/.test(sel) && ROOM_VARS.test(body))),
  JSON.stringify(roomRules.filter(([sel, body]) => (/data-machina2-room='light'/.test(sel) && PAGE_VARS.test(body)) || (/data-page='light'/.test(sel) && ROOM_VARS.test(body))).map(([s]) => s).slice(0, 3)));
// PARKED 2026-11-01 (SUPERSEDED by the Wrizors' note and Fable, Nov 1: "Drop Blue wash" - the wash rule this read is gone). Original, verbatim:
// ok('U6 no Machina room rule still reads the page tone for the room (the wash and the light room\'s hairline read the room)',
//   !/data-page='light'\]:not\(\[data-machina2-off~='wash'\]\)/.test(css) && /data-machina2-room='light'\]:not\(\[data-machina2-off~='wash'\]\)/.test(css), '');
// SUCCESSOR U6b: no rule reads the page tone for the ROOM's hairline (it reads the room), and no wash rule or wash switch remains.
ok('U6b the light room\'s hairline reads the room, and the blue wash is gone (no rule, no switch)',
  /data-machina2-room='light'\] \.mode-page\{ box-shadow/.test(css) && !/data-machina2-off~='wash'/.test(css) && !/rgba\(127, 160, 188/.test(css)
  && !/'wash'/.test(fs.readFileSync(new URL('../../src/machina2/switches.ts', import.meta.url), 'utf8')), '');

// U7 (r3) THE ROOM FOLLOWS THE CLOCK (Fable, Nov 1: "Follow the clock / Always day / Always night (unset = clock, 07:00-19:00 local) ...
// Machina switches only while the writer isn't typing"). The browser half is scripts/frames/machina2-r3.mjs.
const hm = (s) => r3.parseClock(s);
ok('U7 the choice from data-room: light = Always day, dark = Always night, anything else = Follow the clock',
  r3.choiceOf('light') === 'light' && r3.choiceOf('dark') === 'dark' && r3.choiceOf(null) === 'clock' && r3.choiceOf('day') === 'clock' && r3.choiceOf('') === 'clock', '');
ok('U7 the clock: light from 07:00 until 19:00 local, dark otherwise (the edges exact)',
  r3.clockRoom(hm('06:59:59')) === 'dark' && r3.clockRoom(hm('07:00')) === 'light' && r3.clockRoom(hm('12:00')) === 'light' && r3.clockRoom(hm('18:59:59')) === 'light' && r3.clockRoom(hm('19:00')) === 'dark' && r3.clockRoom(hm('00:00')) === 'dark', '');
ok('U7 a choice beats the clock; Follow the clock reads it', r3.wantRoom('light', hm('23:00')) === 'light' && r3.wantRoom('dark', hm('12:00')) === 'dark' && r3.wantRoom(null, hm('12:00')) === 'light' && r3.wantRoom(null, hm('23:00')) === 'dark', '');
ok('U7 the clock waits while the writer is typing (a key within IDLE_MS) and lands once they stop',
  r3.IDLE_MS === 5000 && r3.nextRoom('light', 'dark', false, 0) === 'light' && r3.nextRoom('light', 'dark', false, 4999) === 'light' && r3.nextRoom('light', 'dark', false, 5000) === 'dark' && r3.nextRoom('light', 'dark', false, Infinity) === 'dark', '');
ok('U7 a pick, and the first resolve, land at once even mid-typing', r3.nextRoom('light', 'dark', true, 0) === 'dark' && r3.nextRoom(null, 'dark', false, 0) === 'dark' && r3.nextRoom('dark', 'dark', false, 0) === 'dark', '');
const r3Src = fs.readFileSync(new URL('../../src/machina2/room.ts', import.meta.url), 'utf8') + fs.readFileSync(new URL('../../src/machina2/mount.tsx', import.meta.url), 'utf8');
// PARKED 2026-11-01 (SUPERSEDED by Fable, Nov 1, Machina r4: "the Room row = Automatic · Day · Night"). Original, verbatim:
// ok('U7 in session only, and the panel offers exactly Follow the clock / Always day / Always night', !/localStorage|sessionStorage|indexedDB/.test(r3Src) && /\[\['clock', 'Follow the clock'\], \['light', 'Always day'\], \['dark', 'Always night'\]\]/.test(r3Src) && !/follows Page/.test(r3Src), '');
// SUCCESSOR U7b: the same, with r4's words.
ok('U7b in session only, and the panel offers exactly Automatic / Day / Night', !/localStorage|sessionStorage|indexedDB/.test(r3Src) && /\[\['clock', 'Automatic'\], \['light', 'Day'\], \['dark', 'Night'\]\]/.test(r3Src) && !/follows Page/.test(r3Src), '');

// U8 (r4) THE KEYS AND THE DOORS (Fable, Nov 1: "Ctrl+/ stays the Controls drawer, so the command line takes the free key"; the Wrizors' doors).
const cmdSrc = fs.readFileSync(new URL('../../src/machina2/commandLine.tsx', import.meta.url), 'utf8');
const doorSrc = fs.readFileSync(new URL('../../src/machina2/doors.tsx', import.meta.url), 'utf8');
ok('U8 the command line opens on Ctrl/⌘ + . and no longer listens for / (the Controls drawer keeps Ctrl+/)',
  /e\.key === '\.'/.test(cmdSrc) && /e\.code === 'Period'/.test(cmdSrc) && !/k === '\/'/.test(cmdSrc) && !/e\.code === 'Slash'/.test(cmdSrc), '');
ok('U8 the legend names the chords that exist: the line (.), the link (K), the Controls drawer (/)',
  /\{MOD\}\.<\/kbd> line/.test(doorSrc) && /\{MOD\}K<\/kbd> link/.test(doorSrc) && /\{MOD\}\/<\/kbd> tools/.test(doorSrc) && /chord: `\$\{MOD\}\/`/.test(cmdSrc), '');
ok('U8 the doors press existing acts and store nothing', !/localStorage|sessionStorage|indexedDB/.test(doorSrc + fs.readFileSync(new URL('../../src/machina2/beside.tsx', import.meta.url), 'utf8') + fs.readFileSync(new URL('../../src/machina2/chrome.ts', import.meta.url), 'utf8')), '');
ok('U7 the room no longer reads the page tone', !/getAttribute\('data-page'\)/.test(fs.readFileSync(new URL('../../src/machina2/room.ts', import.meta.url), 'utf8')), '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nMACHINA2-UNIT: PASS (${checks.length} checks)` : `\nMACHINA2-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
