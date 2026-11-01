// ARBOR v2 MOCKUP, ROUND r9 - BROWSERLESS half (Node >= 22.18, type stripping): node scripts/harness/arbor2-r9-unit.mjs. No browser, no box turn.
// The browser half is scripts/frames/arbor2-r9.mjs (INK's frames job). Fable, Nov 1: "Room settled: Follow the clock / Always day / Always
// night (unset = clock, 07:00-19:00 local) ... Arbor crossfades over ~20 min (a cut under reduced motion)".
//   C1  the choice: data-room light = Always day, dark = Always night, absent (or anything else) = Follow the clock
//   C2  the clock: day 07:00-19:00 local; the fade is 20 minutes centred on the hour (half way at 07:00 and 19:00); reduced motion = a cut
//   C3  a pick lands at once (0 or 1 at any hour)
//   C4  the blend: same-shaped values mix; differently shaped values are left to the room's rule (null)
//   C5  the crossover: inside the fade, where the two letterings read alike on the fading ground
//   C6  in session only: nothing touches storage; the Room row offers exactly the three choices
import fs from 'node:fs';
import { choiceOf, dataRoomOf, clockDayness, dayness, mixValue, parseColour, crossover, contrast, mixColour, parseClock, LETTERING } from '../../src/arbor2/room.ts';

const checks = [];
const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
const hm = (s) => parseClock(s);

ok('C1 the choice from data-room', choiceOf('light') === 'day' && choiceOf('dark') === 'night' && choiceOf(null) === 'clock' && choiceOf('day') === 'clock' && choiceOf('') === 'clock', '');
ok('C1 the value each choice writes', dataRoomOf('day') === 'light' && dataRoomOf('night') === 'dark' && dataRoomOf('clock') === null, '');
const C = (s, r = false) => clockDayness(hm(s), r);
ok('C2 night before 06:50 and after 19:10, day from 07:10 to 18:50', C('00:00') === 0 && C('06:50') === 0 && C('07:10') === 1 && C('12:00') === 1 && C('18:50') === 1 && C('19:10') === 0 && C('23:59') === 0,
  JSON.stringify(['00:00', '06:50', '07:10', '12:00', '18:50', '19:10', '23:59'].map((s) => C(s))));
ok('C2 half way at the hour, morning and evening', C('07:00') === 0.5 && C('19:00') === 0.5, `${C('07:00')} ${C('19:00')}`);
const morning = Array.from({ length: 21 }, (_, i) => clockDayness(410 + i, false));
ok('C2 the morning fade rises at every minute 06:50 -> 07:10 and lasts 20 minutes', morning.every((v, i) => i === 0 || v > morning[i - 1]) && morning[0] === 0 && morning[20] === 1, JSON.stringify(morning.map((v) => Math.round(v * 100) / 100)));
const evening = Array.from({ length: 21 }, (_, i) => clockDayness(1130 + i, false));
ok('C2 the evening fade falls at every minute 18:50 -> 19:10', evening.every((v, i) => i === 0 || v < evening[i - 1]) && evening[0] === 1 && evening[20] === 0, '');
ok('C2 reduced motion: a cut at the hour (no value between 0 and 1 at any minute of the day)',
  Array.from({ length: 1440 }, (_, i) => clockDayness(i, true)).every((v) => v === 0 || v === 1) && C('06:59:59', true) === 0 && C('07:00', true) === 1 && C('18:59:59', true) === 1 && C('19:00', true) === 0, '');
ok('C3 a pick lands at once, at any hour (mid-fade included)', dayness('light', hm('07:00'), false) === 1 && dayness('dark', hm('07:00'), false) === 0 && dayness('light', hm('23:00'), false) === 1 && dayness('dark', hm('12:00'), false) === 0 && dayness(null, hm('07:00'), false) === 0.5, '');
ok('C4 colours mix (hex)', mixValue('#000000', '#FFFFFF', 0.5) === '#808080' && mixValue('#120A06', '#F1EAD8', 0) === '#120A06' && mixValue('#120A06', '#F1EAD8', 1) === '#F1EAD8', String(mixValue('#000000', '#FFFFFF', 0.5)));
ok('C4 numbers and "r,g,b" triples mix', mixValue('.26', '.7', 0.5) === '0.48' && mixValue('212,162,78', '255,236,190', 0.5) === '233.5,199,134', `${mixValue('.26', '.7', 0.5)} ${mixValue('212,162,78', '255,236,190', 0.5)}`);
const gN = 'radial-gradient(135% 95% at 50% -8%, #2E1D0E 0%, #20140B 38%, #170E08 70%, #120A06 100%)', gD = 'radial-gradient(135% 95% at 50% -8%, #F8F3E6 0%, #F5EFE0 38%, #F1EAD8 70%, #F1EAD8 100%)';
ok('C4 the lamp glow mixes stop by stop; its geometry is untouched', mixValue(gN, gD, 0) === gN.replace(/-8%/, '-8%') && /^radial-gradient\(135% 95% at 50% -8%, #[0-9A-F]{6} 0%, #[0-9A-F]{6} 38%, #[0-9A-F]{6} 70%, #[0-9A-F]{6} 100%\)$/.test(mixValue(gN, gD, 0.5) || ''), String(mixValue(gN, gD, 0.5)));
ok('C4 different shapes are left to the room (null)', mixValue('0 0 0 1px #D2D6DA', '0 4px 20px rgba(0,0,0,.4), 0 0 0 1px #000', 0.5) === null && mixValue('none', '#FFFFFF', 0.5) === null, '');
const P = (h) => parseColour(h);
const x = crossover(P('#120A06'), P('#F1EAD8'), P('#EFE4CB'), P('#33401F'));
const g = mixColour(P('#120A06'), P('#F1EAD8'), x);
ok('C5 the crossover lies inside the fade, where the two letterings read alike', x > 0.05 && x < 0.95 && Math.abs(contrast(P('#EFE4CB'), g) - contrast(P('#33401F'), g)) < 0.01, `t=${x.toFixed(3)} cream ${contrast(P('#EFE4CB'), g).toFixed(2)} olive ${contrast(P('#33401F'), g).toFixed(2)}`);
ok('C5 the lettering and the surfaces it sits on switch rather than blend', ['--arbor-letter', '--text-low', '--ink-900', '--ink-800'].every((n) => LETTERING.includes(n)) && !LETTERING.includes('--ink-950'), '');
const src = ['../../src/arbor2/room.ts', '../../src/arbor2/mount.tsx'].map((p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8')).join('\n');
ok('C6 nothing in the room or the mount touches storage', !/localStorage|sessionStorage|indexedDB/.test(src), '');
// PARKED 2026-11-01 (SUPERSEDED by the Wrizors' note, Nov 1, spec §2e: "Room ▸ By the clock · Day · Night" - the shorter words). Original, verbatim:
// ok('C6 the Room row offers exactly Follow the clock / Always day / Always night, in the Mood menu', /\[\['clock', 'Follow the clock'\], \['day', 'Always day'\], \['night', 'Always night'\]\]/.test(src) && /<RoomRow \/>/.test(src) && !/follows Page/.test(src), '');
// SUCCESSOR C6b: the same, with r10's words.
ok('C6b the Room row offers exactly By the clock / Day / Night, in the Mood menu', /\[\['clock', 'By the clock'\], \['day', 'Day'\], \['night', 'Night'\]\]/.test(src) && /<RoomRow \/>/.test(src) && !/follows Page/.test(src), '');
ok('C6 the room no longer reads the page tone', !/getAttribute\('data-page'\)/.test(src.split('function RoomRow')[0]), '');
ok('C2 the clock moves the room on its own, and reduced motion is read live', /setInterval\(applyRoom/.test(src) && /prefers-reduced-motion: reduce/.test(src) && /addEventListener\?\.\('change', applyRoom\)/.test(src), '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-R9-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-R9-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
