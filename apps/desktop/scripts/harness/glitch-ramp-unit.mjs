// GLITCH v2 - THE IDLE RAMP (the flourish spec draft 2 §1.1-1.2, ruled by Nick Nov 26): the stage table and the one-beat rules, read from the pure module
// src/flux3/glitchRamp.ts (no imports, so Node loads it as it is). Browserless.
//   R1  nothing for the first 30 s
//   R2  the four stages, as the table has them: beat spacing, words a beat, where, how often the screen glitches, its band, slip, split and time
//   R3  the ceiling holds from 15 minutes on
//   R4  a screen beat comes every 3rd, every 2nd, then every beat; its words leave with it (the band's own time), and a beat with no band holds 600 ms
//   R5  the flash law: at every stage two changes a beat stay under 3 a second
//   R6  the band's height: 6-12 px, up to 48 px, up to a quarter of the window
//   MUT the judges go RED on a 45 s gate and on beats faster than the law
// Run: node scripts/harness/glitch-ramp-unit.mjs (from apps/desktop).
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 500) : ''}`); };
const J = (v) => JSON.stringify(v);
let ramp = null;
try { ramp = await import('../../src/flux3/glitchRamp.ts'); } catch (e) { console.log(`no module: ${String(e && e.message).split('\n')[0].slice(0, 160)}`); }
const stage = (s) => (ramp ? ramp.stageAt(s) : undefined);
const pick = (g) => g && ({ every: g.everyMs, words: g.words.join('-'), reach: g.reach, screen: g.screenEvery, slip: g.slip, split: g.split, band: g.bandMs, drop: g.menuDrop });
const law = (everyMs) => 2000 / everyMs < 3;

ok('R1 nothing for the first 30 s', !!ramp && stage(0) === null && stage(29.9) === null && stage(30) !== null, J(pick(stage(30))));
ok('R2 the four stages as the table has them', !!ramp
  && J(pick(stage(30))) === J({ every: 2600, words: '1-1', reach: 'page', screen: 0, slip: 0, split: 0, band: 0, drop: 0 })
  && J(pick(stage(120))) === J({ every: 2000, words: '1-2', reach: 'chrome', screen: 3, slip: 2, split: 0, band: 120, drop: 0 })
  && J(pick(stage(300))) === J({ every: 1600, words: '2-3', reach: 'all', screen: 2, slip: 6, split: 1, band: 200, drop: 0 })
  && J(pick(stage(900))) === J({ every: 1200, words: '3-4', reach: 'all', screen: 1, slip: 16, split: 3, band: 300, drop: 4 }), J([30, 120, 300, 900].map((s) => pick(stage(s)))));
ok('R3 the ceiling holds from 15 minutes on', !!ramp && J(pick(stage(900))) === J(pick(stage(7200))) && J(pick(stage(899))) === J(pick(stage(300))), '');
const screens = (s, n) => Array.from({ length: n }, (_, i) => (ramp ? ramp.beatOf(stage(s), i) : null));
ok('R4 a screen beat comes every 3rd, every 2nd, then every beat; words leave with it, and a beat with no band holds 600 ms', !!ramp
  && J(screens(30, 4).map((b) => b.screen)) === J([false, false, false, false])
  && J(screens(120, 6).map((b) => b.screen)) === J([false, false, true, false, false, true])
  && J(screens(300, 4).map((b) => b.screen)) === J([false, true, false, true])
  && J(screens(900, 3).map((b) => b.screen)) === J([true, true, true])
  && screens(120, 3)[0].holdMs === 600 && screens(120, 3)[2].holdMs === 120 && screens(300, 2)[1].holdMs === 200 && screens(900, 1)[0].holdMs === 300, '');
ok('R5 the flash law: two changes a beat stay under 3 a second at every stage', !!ramp && [30, 120, 300, 900].every((s) => law(stage(s).everyMs)), '');
const H = (s, h, r) => (ramp ? ramp.bandHeight(stage(s), h, r) : null);
ok('R6 the band: 6-12 px, up to 48 px, up to a quarter of the window', !!ramp
  && H(30, 800, 0.5) === 0 && H(120, 800, 0) === 6 && H(120, 800, 0.999) === 12 && H(300, 800, 0.999) === 48 && H(300, 800, 0) >= 16 && H(900, 800, 0.999) === 200 && H(900, 800, 0) >= 48,
  J([H(120, 800, 0), H(120, 800, 0.999), H(300, 800, 0), H(300, 800, 0.999), H(900, 800, 0), H(900, 800, 0.999)]));
const oldGate = (s) => s >= 45;
ok('MUT the judges go RED on a 45 s gate and on beats faster than the law', oldGate(30) === false && !law(600) && law(1200), '');

const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nGLITCH-RAMP-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nGLITCH-RAMP-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
