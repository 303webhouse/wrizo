// THE L METHOD (INK, Nov 9; Fable's ruling: L gets a SECOND reading, the main-thread cost per key, as rhizome-latency's B2/C2). One shared copy, so every theme's L judges the same way.
// It was written inline in flux3-s4c.mjs (the Corridor) and flux3-s4b-l1.mjs (the circuit ground); both now call this instead. A harness hands it three things: how to put a page in
// each arm (`prepare`), how to say the arm stood where it should (`stoodRight`), and the keys to type. The method does the rest.
//
//   ARMS      J is the subject (the feature on), C the control (the feature off), SIX interleaved rounds (the order flips each round; round 0 is a discarded warm-up), a fresh page
//             per arm per round. Interleaving puts the box's own drift into both arms alike.
//   READINGS  1. CLOCK: keydown -> the second animation frame after its `beforeinput`. Quantised by the frame clock; it does not see a few ms of main-thread cost (Actions, Nov 9: a 20 ms
//                busy-wait moved its median ~2 ms).
//             2. COST: per key, BUSY + FRAME. BUSY = keydown -> the end of the task that handled it (a message posted from the key's LAST event, `beforeinput`/`input` bubbling, runs only
//                after the key's own tasks; posted at keydown it could run between the keydown and beforeinput tasks and miss a cost after it). FRAME = the first rAF after the input ->
//                the end of that frame's rendering (a message posted from the rAF runs after style, layout and paint).
//   VERDICT   BOTH readings: J median <= C median + C's round-to-round spread of per-round medians, J p95 <= C p95 + C's spread of per-round p95s; the clock also has a ceiling
//             (no key over maxMs). The control's spread is the allowance, so the budget is the box's own noise, measured in the run.
//   PROOF     the method is proved on every run before it judges anything: (1) the control against itself is GREEN (L-METHOD-GREEN); (2) +5 ms and +10 ms of busy-wait added to every key
//             in arm J alone, on the CONTROL page (the feature off in both arms, so the only difference is the injected cost) must go RED on the COST reading, with the keys counted and
//             the arms standing right (L-MUT-5, L-MUT-10). A mutant that does not go RED means the method is blind, and the run fails.
//
// Use (from a harness; `ok` is the harness's own (name, pass, detail) recorder):
//   const L = makeL({ app, ev, sleep, prepare: async (arm, on) => stoodObject, stoodRight: (arm, on, stood) => boolean, cycle: 'text to type' });
//   await L.run(ok, { subject: 'Corridor' });            // GREEN, the subject, MUT-5, MUT-10   (onlyMethod: true skips the subject: the control-bracket run on main)
//   const r = await L.runArms(label, { extra: 0, on: true });   // one measurement, if a harness wants to judge differently
//
// `prepare(arm, on)` must leave the page ready to take keys (editor focused, caret at the end) and return anything that `stoodRight` can check. `on` is whether J has the feature (false
// for the control-against-itself and the mutants).
export const L_ROUNDS = 6, L_KEYS = 44, L_MIN_KEYS = 40, L_GAP = 90, L_MAX_MS = 100;

export const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
export const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);

// The meter, as page source. `extra` ms of busy-wait go in the key path (beforeinput capture, before the meter's own listeners) when the arm is J and a mutant is asked for.
export const meterSource = (extra) => `(() => { window.__lat = []; window.__ks = []; let t0 = 0, cur = null; if (window.__latOff) window.__latOff();
  const kd = () => { t0 = performance.now(); const k = { busy: null, frame: null, s0: t0 }; cur = k; window.__ks.push(k); };
  const inp = () => { const k = cur; if (!k || k.busy !== null || k.posted) return; k.posted = true; const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - k.s0; mc.port1.close(); }; mc.port2.postMessage(0); };
  const spin = () => { ${extra ? `const e = performance.now() + ${Number(extra)}; while (performance.now() < e) { /* the mutant: a slow key */ }` : ''} };
  const bi = () => { const t = t0, k = cur; requestAnimationFrame(() => { const r = performance.now(); const mc = new MessageChannel(); mc.port1.onmessage = () => { if (k) k.frame = performance.now() - r; mc.port1.close(); };
    mc.port2.postMessage(0); requestAnimationFrame(() => { window.__lat.push(performance.now() - t); }); }); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', spin, true); document.addEventListener('beforeinput', bi, true); document.addEventListener('beforeinput', inp, false); document.addEventListener('input', inp, false);
  window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', spin, true); document.removeEventListener('beforeinput', bi, true); document.removeEventListener('beforeinput', inp, false); document.removeEventListener('input', inp, false); }; return true; })()`;

export function makeL({ app, ev, sleep, prepare, stoodRight, cycle, rounds = L_ROUNDS, keys = L_KEYS, minKeys = L_MIN_KEYS, gap = L_GAP, maxMs = L_MAX_MS }) {
  const runArms = async (label, { extra = 0, on = true } = {}) => {
    const lat = { C: [], J: [] };
    let cursor = 0;
    for (let round = 0; round <= rounds; round += 1) {
      for (const arm of (round % 2 ? ['J', 'C'] : ['C', 'J'])) {
        const stood = await prepare(arm, arm === 'J' ? on : false);
        await ev(meterSource(arm === 'J' ? extra : 0));
        for (let i = 0; i < keys; i += 1) { await app.typeKeys(cycle[cursor % cycle.length]); cursor += 1; await sleep(gap); }
        await sleep(250);
        const got = await ev('window.__lat.slice()');
        const cost = (await ev('window.__ks.map((k) => (k.busy != null && k.frame != null ? k.busy + k.frame : null))')).filter((x) => x != null);
        if (round > 0) lat[arm].push({ lat: got, cost, stood });
      }
    }
    // one reading's verdict: the arm's median and p95 within the control's own round-to-round spread, and (clock only) no single key over the ceiling
    const judge = (f, ceiling) => {
      const cMeds = lat.C.map((r) => stat(r[f]).median), cP95s = lat.C.map((r) => stat(r[f]).p95);
      const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
      const C = stat(lat.C.flatMap((r) => r[f])), J = stat(lat.J.flatMap((r) => r[f]));
      const pass = J.median <= C.median + spreadMed && J.p95 <= C.p95 + spreadP95 && (ceiling == null || J.max <= ceiling);
      const line = `J median ${r1(J.median)} <= C ${r1(C.median)} + ${r1(spreadMed)}, J p95 ${r1(J.p95)} <= C ${r1(C.p95)} + ${r1(spreadP95)}${ceiling == null ? '' : `, J max ${r1(J.max)} <= ${ceiling}`}`;
      return { pass, line, C, J };
    };
    const enough = [...lat.C, ...lat.J].every((r) => r.lat.length >= minKeys && r.cost.length >= minKeys);
    const stood = lat.J.every((r) => stoodRight('J', on, r.stood)) && lat.C.every((r) => stoodRight('C', false, r.stood));
    const clock = judge('lat', maxMs), cost = judge('cost', null);
    // L's verdict = BOTH readings
    const pass = enough && stood && clock.pass && cost.pass;
    return { pass, line: `${label}: clock [${clock.line}] cost [${cost.line}]`, enough, stoodRight: stood, clock, cost, C: { clock: clock.C, cost: cost.C }, J: { clock: clock.J, cost: cost.J } };
  };

  // GREEN, the subject, then the two mutants. `ok` records (name, pass, detail).
  const run = async (ok, { subject = 'the feature', onlyMethod = false } = {}) => {
    const green = await runArms('the control against itself', { on: false });
    ok(`L-METHOD-GREEN the method passes the control against itself (the box's own noise): ${green.line}`, green.pass && green.enough && green.stoodRight, JSON.stringify({ C: green.C, J: green.J }));
    if (!onlyMethod) {
      const l = await runArms(subject, { on: true });
      ok(`L ${subject} adds no latency beyond the control's own spread, on BOTH readings (the frame clock and the main-thread cost per key): ${l.line}`, l.pass, JSON.stringify({ C: l.C, J: l.J }));
    }
    for (const extra of [5, 10]) {
      const m = await runArms(`control + ${extra} ms mutant`, { extra, on: false });
      ok(`L-MUT-${extra} the method calls a key that is ${extra} ms slower RED on the cost reading (the mutant landed: ${m.line})`, !m.cost.pass && m.enough && m.stoodRight, JSON.stringify({ C: m.C, J: m.J }));
    }
  };
  return { runArms, run };
}
