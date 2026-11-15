// FLUX3-LATENCY-GATE (bug #47, Fable, Nov 10: flux3-latency's TIMING lines become box-only). BROWSERLESS: it needs no box turn and no browser.
// The probe (flux3-latency.mjs) reads the clock of the machine it runs on; its fifth miss was 0.4 ms on a hosted runner. The rule: a TIMING line (L, P3b, the L half of
// MUT-b) gates on the box and is information on a hosted runner (it prints what it measured and what it would have said, and gates nothing); every other line gates on both.
//   G1  on the box a failing timing measure FAILS the line and a passing one passes it (the timing lines still gate on the box)
//   G2  on Actions a failing timing measure does NOT fail the line, is marked information and still reports what it measured (it gates nothing there)
//   G3  the machine is read from GITHUB_ACTIONS === 'true' (unset, 'false' and '' are the box)
//   G4  the routing in the probe: L and P3b go through timing(); P1, P2, P2b, P4, P5, P6, D2, MUT premise, MUT-b and B still go through ok() (they gate everywhere);
//       MUT-b's L half is skipped on Actions only (ON_BOX)
//   G5  the probe imports the gate from lib/timing-gate.mjs and calls timingGate(ON_BOX, pass)
// Mutants (each must land and turn its check RED): the gate ignores the machine and always informs (G1); it always gates (G2); the machine test is dropped so Actions reads as
// the box (G3); L is routed back through ok() (G4); D2 is routed through timing() (G4: it would stop gating on Actions); MUT-b loses its ON_BOX test (G4).
// Run: node scripts/harness/flux3-latency-gate.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(HERE, '..', 'lib');
const GATE_SRC = readFileSync(path.join(LIB, 'timing-gate.mjs'), 'utf8');
const PROBE_SRC = readFileSync(path.join(HERE, 'flux3-latency.mjs'), 'utf8').replace(/\r\n/g, '\n');

async function run(label, gateSrc, probeSrc) {
  const out = [];
  const ok = (name, pass, detail = '') => out.push({ name: `[${label}] ${name}`, pass: !!pass, detail });
  const file = path.join(LIB, `.timing-gate-${label}.mjs`);
  writeFileSync(file, gateSrc);
  try {
    const m = await import(pathToFileURL(file).href + `?v=${label}`);
    const box = [m.timingGate(true, false), m.timingGate(true, true)];
    ok('G1 on the box a failing timing measure fails the line and a passing one passes', box[0].pass === false && box[0].info === false && box[1].pass === true && box[1].info === false, JSON.stringify(box));
    const act = [m.timingGate(false, false), m.timingGate(false, true)];
    ok('G2 on Actions a failing timing measure does not fail the line: marked information, and the measure is still reported', act[0].pass === true && act[0].info === true && act[0].actual === false && act[1].pass === true && act[1].info === true && act[1].actual === true, JSON.stringify(act));
    ok('G3 the machine is read from GITHUB_ACTIONS === "true" (unset, "false" and "" are the box)', m.isOnBox({}) === true && m.isOnBox({ GITHUB_ACTIONS: 'false' }) === true && m.isOnBox({ GITHUB_ACTIONS: '' }) === true && m.isOnBox({ GITHUB_ACTIONS: 'true' }) === false, '');
  } finally { rmSync(file, { force: true }); }
  // the routing in the probe (source pins; the probe cannot run here)
  const call = (re) => (probeSrc.match(re) || []).length;
  const timingCalls = call(/^\s*timing\(`/gm);
  const gatedOk = ['P1 ', 'P2 ', 'P2b ', 'P4 ', 'P5 ', 'P6 ', 'D2', 'MUT premise', 'MUT-b ', 'B the build'].every((n) => new RegExp('^\\s*ok\\(`' + n.replace(/[-]/g, '\\-')).test(probeSrc) || probeSrc.split('\n').some((l) => l.trim().startsWith('ok(`' + n) || l.trim().startsWith("ok('" + n)));
  ok('G4 L and P3b go through timing(); every other line still gates through ok(); MUT-b\'s L half is skipped on Actions only',
    timingCalls === 2 && /^\s*timing\(`L\$\{MUTANT_RUN/m.test(probeSrc) && /^\s*timing\(`P3b /m.test(probeSrc) && !/^\s*ok\(`L\$\{MUTANT_RUN/m.test(probeSrc) && !/^\s*ok\(`P3b /m.test(probeSrc) && gatedOk && /mLanded && \(ON_BOX \? !\(m\.lat && m\.layerDamp\) : !m\.layerDamp\)/.test(probeSrc),
    JSON.stringify({ timingCalls, gatedOk }));
  ok('G5 the probe imports the gate from lib/timing-gate.mjs and calls timingGate(ON_BOX, pass)', /from '\.\.\/lib\/timing-gate\.mjs'/.test(probeSrc) && /const ON_BOX = isOnBox\(\)/.test(probeSrc) && /timingGate\(ON_BOX, pass\)/.test(probeSrc), '');
  return out;
}

const all = [...await run('real', GATE_SRC, PROBE_SRC)];
const MUT = [
  { name: 'the gate ignores the machine and always informs', gate: [/export const timingGate = .*/, 'export const timingGate = (onBox, pass) => ({ pass: true, info: !onBox, actual: !!pass });'], red: 'G1' },
  { name: 'the gate always gates', gate: [/export const timingGate = .*/, 'export const timingGate = (onBox, pass) => ({ pass: !!pass, info: false, actual: !!pass });'], red: 'G2' },
  { name: 'the machine test is dropped (Actions reads as the box)', gate: [/export const isOnBox = .*/, 'export const isOnBox = () => true;'], red: 'G3' },
  { name: 'L is routed back through ok()', probe: ['  timing(`L${MUTANT_RUN ?', '  ok(`L${MUTANT_RUN ?'], red: 'G4' },
  { name: 'D2 is routed through timing()', probe: ['  ok(`D2${MUTANT_RUN ?', '  timing(`D2${MUTANT_RUN ?'], red: 'G4' },
  { name: 'MUT-b loses its ON_BOX test', probe: ['mLanded && (ON_BOX ? !(m.lat && m.layerDamp) : !m.layerDamp)', 'mLanded && !(m.lat && m.layerDamp)'], red: 'G4' },
];
for (const [i, mu] of MUT.entries()) {
  const g = mu.gate ? GATE_SRC.replace(mu.gate[0], mu.gate[1]) : GATE_SRC;
  const p = mu.probe ? PROBE_SRC.replace(mu.probe[0], mu.probe[1]) : PROBE_SRC;
  const landed = mu.gate ? g !== GATE_SRC : p !== PROBE_SRC;
  const res = await run('m' + i, g, p);
  const red = res.filter((c) => !c.pass).map((c) => c.name.match(/G\d/)[0]);
  all.push({ name: `mutant "${mu.name}": landed and turns ${mu.red} RED`, pass: landed && red.includes(mu.red), detail: `landed=${landed} red=${red.join(',') || 'none'}` });
}

const failed = all.filter((c) => !c.pass);
for (const c of all) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-LATENCY-GATE VERIFY: FAIL - ${failed.length}/${all.length} failed` : `\nFLUX3-LATENCY-GATE VERIFY: PASS (${all.length} checks)`);
process.exit(failed.length ? 1 : 0);
