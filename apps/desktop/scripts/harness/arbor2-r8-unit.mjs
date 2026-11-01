// ARBOR v2 MOCKUP, ROUND r8 - BROWSERLESS half (Node >= 22.18, type stripping): node scripts/harness/arbor2-r8-unit.mjs. No browser, no box turn.
// The browser half is scripts/frames/arbor2-r8.mjs (INK's frames job).
//   R1  the room reads data-room when set (light = Day, dark = Night), else the Page tone - all four mixes (Nick's pick, via Fable, Oct 31)
//   R2  in session only: nothing in the room or the mount touches storage
//   R3  the room's CSS reads data-arbor2-room and the page's CSS reads data-page - no rule keyed on the page sets a ROOM token
import fs from 'node:fs';
import { roomOf } from '../../src/arbor2/room.ts';

const checks = [];
const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

ok('R1 unset, the room follows the page (dark -> night, light -> day, no tone -> day)', roomOf(null, 'dark') === 'night' && roomOf(null, 'light') === 'day' && roomOf(null, null) === 'day', '');
ok('R1 set, data-room wins in all four mixes', roomOf('light', 'dark') === 'day' && roomOf('dark', 'light') === 'night' && roomOf('light', 'light') === 'day' && roomOf('dark', 'dark') === 'night', '');
ok('R1 a stray value is ignored (the page decides)', roomOf('day', 'dark') === 'night' && roomOf('', 'light') === 'day', '');
const src = ['../../src/arbor2/room.ts', '../../src/arbor2/mount.tsx'].map((p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8')).join('\n');
ok('R2 nothing in the room or the mount touches storage', !/localStorage|sessionStorage|indexedDB/.test(src), '');
ok('R2 the Room control writes data-room, and the old bar switch is gone (the control sits in the Mood menu)', /setAttribute\('data-room'/.test(src) && /function RoomRow/.test(src) && /<RoomRow \/>/.test(src) && !/<Seg label="Room"/.test(src), '');
const css = fs.readFileSync(new URL('../../src/styles/arbor-v2.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);
const ROOM_VARS = /--(ink-950|ink-900|ink-800|text-hi|text-mid|text-low|arbor-letter|rail-surface|chrome-surface)\s*:/;
const bad = rules.filter(([sel, body]) => /data-page=/.test(sel) && ROOM_VARS.test(body)).map(([s]) => s);
ok('R3 no rule keyed on the page tone sets a room token (so a dark page by day keeps the day room)', bad.length === 0, JSON.stringify(bad.slice(0, 3)));

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-R8-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-R8-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
