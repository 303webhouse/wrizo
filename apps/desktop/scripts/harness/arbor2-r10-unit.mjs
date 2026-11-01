// ARBOR v2 MOCKUP, ROUND r10 - BROWSERLESS half (Node >= 22.18, type stripping): node scripts/harness/arbor2-r10-unit.mjs. No browser, no box turn.
// The browser half is scripts/frames/arbor2-r10.mjs (INK's frames job). The Wrizors' note, Nov 1 (wrizors-to-ARBOR-nov1b.md, md5 9272a1ff).
//   W1  the warm waypoint: the ground lands exactly on #D9C3A2 at the middle; the three stops meet their ends
//   W2  the lamp hands over to the sun: never both above 0, the lamp falling over the first half, the sun rising over the second
//   W3  the room switches at the middle (MID = 0.5), and the count's plate is the room's surface with the room's letter
import fs from 'node:fs';
import { parseColour, mixColour3, warmDelta, formatColour, lampShare, sunShare, MID, WARM_STOP, contrast } from '../../src/arbor2/room.ts';

const checks = [];
const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
const P = (h) => parseColour(h);
const gN = P('#120A06'), gD = P('#F1EAD8'), d = warmDelta(gN, gD);
const at = (t) => formatColour(mixColour3(gN, gD, t, d));
ok('W1 the ground is espresso at 0, the warm stop at .5, plaster at 1', at(0) === '#120A06' && at(0.5) === WARM_STOP && at(1) === '#F1EAD8', `${at(0)} ${at(0.5)} ${at(1)}`);
ok('W1 without a delta the mix is the straight one (r9\'s grey middle, for comparison)', formatColour(mixColour3(gN, gD, 0.5)) === '#827A6F', formatColour(mixColour3(gN, gD, 0.5)));
const warmEnough = Array.from({ length: 101 }, (_, i) => { const c = mixColour3(gN, gD, i / 100, d); return c.r - c.b; });
ok('W1 never cooler than espresso along the way (red above blue by >= 12 at every 1%)', warmEnough.every((x) => x >= 12), String(Math.min(...warmEnough)));
const steps = Array.from({ length: 201 }, (_, i) => i / 200);
ok('W2 never both: at every 0.5% the lamp\'s share or the sun\'s is 0', steps.every((t) => lampShare(t) === 0 || sunShare(t) === 0), '');
ok('W2 the lamp falls 1 -> 0 over the first half, the sun rises 0 -> 1 over the second', lampShare(0) === 1 && lampShare(0.25) === 0.5 && lampShare(0.5) === 0 && sunShare(0.5) === 0 && sunShare(0.75) === 0.5 && sunShare(1) === 1
  && steps.every((t, i) => i === 0 || (lampShare(t) <= lampShare(steps[i - 1]) && sunShare(t) >= sunShare(steps[i - 1]))), '');
ok('W3 the room switches at the middle', MID === 0.5, String(MID));
// the plate's two pairs (the count on the room's surface, in the room's letter): night cream on #1B120C, day olive on #E8DFC8 (r5's surfaces)
ok('W3 the count on its plate holds 4.5:1 on either side of the middle', contrast(P('#EFE4CB'), P('#1B120C')) >= 4.5 && contrast(P('#33401F'), P('#E8DFC8')) >= 4.5,
  `${contrast(P('#EFE4CB'), P('#1B120C')).toFixed(2)} / ${contrast(P('#33401F'), P('#E8DFC8')).toFixed(2)}`);
const css = fs.readFileSync(new URL('../../src/styles/arbor-v2.css', import.meta.url), 'utf8');
ok('W3 the plate is the instrument\'s own box on the room\'s surface, its labels in the room\'s letter', /\.desk-frame-instrument\{ background:var\(--ink-900\)/.test(css) && /:is\(\.mode-pmeta, \.mode-pmetric\)\{ color:var\(--arbor-letter\)/.test(css), '');
const mount = fs.readFileSync(new URL('../../src/arbor2/mount.tsx', import.meta.url), 'utf8');
ok('W3 the mount switches at MID and writes the pool from the handoff', /t >= MID \? 'day' : 'night'/.test(mount) && /poolAt\(t\)/.test(mount) && !/fadeCross/.test(mount), '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-R10-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-R10-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
