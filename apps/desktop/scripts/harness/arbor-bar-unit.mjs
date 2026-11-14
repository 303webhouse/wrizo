// ARBOR BAR (bug #80) - THE BAR FOR THE ARBOR REDESIGN, judged over a box turn's keycost runs. BROWSERLESS (reads arbor-keycost-attr.mjs output).
// Nick (Nov 14, 12:57 am, "Yes, accepted"; claude/live-feedback-nov14.md): "no key over 40 ms in steady typing; the keystroke that starts writing may
// take up to 65 ms." Nick (Nov 14, 10:33 am, "Yes, allowed"): the 65 ms allowance covers the key that starts writing AND a key typed within 50 ms
// after it; every later key holds 40 ms. Fable (Nov 14, 11:25 am): keys typed as the word goal is crossed are outside the bar; the check reports them,
// and on an Arbor tree they must not be worse than main's in the same turn. The 50 ms window is ONE named number (START_WINDOW_MS).
//
//   node scripts/harness/arbor-bar-unit.mjs                                   the self-tests only (a suite run: no turn folder)
//   node scripts/harness/arbor-bar-unit.mjs <turn folder> --candidate <arm>   judge a turn: runs are <arm>-<n>/arbor-keycost-attr.mjs.default.txt
//   ... --plant window0                                                       THE MUTANT: the window set to 0 (Nick's "no"); turn 8's fix must go red
//
// THE CLASSES (control keys = the fast, pre and long phases; the cross, hold and fade phases are the goal crossing):
//   START   the key that starts writing: the writing flip (data-wz-writing -> true) falls between its keydown and its second frame
//   WINDOW  a control key whose keydown is at most START_WINDOW_MS after the start key's keydown        -> both hold START_MS
//   STEADY  every other control key                                                                    -> holds STEADY_MS
//   CROSSING  reported; per Arbor arm, over-40 and over-50 counts no worse than the turn's main (non-Arbor) arm
// EXACT mode needs each key's keydown time and each burst's flips (the driver since arbor/bar-80, X4). Turn 8's records predate them: in FALLBACK mode
// a slow key's distance from the start key is bounded from its own events (the flip's offset) and the start key's (the burst's key 1, every burst
// opening on a reopened page); a key whose bounds straddle the window is UNPROVEN, never passed.
import fs from 'node:fs';
import path from 'node:path';

const STEADY_MS = 40;
const START_MS = 65;
const START_WINDOW_MS_RULED = 50;   // Nick, Nov 14, 10:33 am
const PLANT = (() => { const i = process.argv.indexOf('--plant'); return i > 0 ? process.argv[i + 1] : null; })();
const START_WINDOW_MS = PLANT === 'window0' ? 0 : START_WINDOW_MS_RULED;
const CONTROL = new Set(['fast', 'pre', 'long']);

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// ---- the judge: one arm's runs -> classified keys -----------------------------------------------------------------------------------------------
// run = { summary, slow, raw }  (the three ATTR lines of one keycost run)
function classify(runs, W) {
  const out = { start: [], window: [], steady: [], unproven: [], crossing: { n: 0, over40: 0, over50: 0 }, control: 0, starts: 0, mode: null, bursts: 0 };
  for (const run of runs) {
    const exact = run.raw.bursts.every((b) => Array.isArray(b.flips) && b.keys.every((k) => Number.isFinite(k.t)));
    out.mode = out.mode && out.mode !== (exact ? 'exact' : 'fallback') ? 'mixed' : (exact ? 'exact' : 'fallback');
    for (const b of run.raw.bursts) {
      out.bursts++;
      for (const k of b.keys) if (!CONTROL.has(k.phase)) { out.crossing.n++; if (k.ms > 40) out.crossing.over40++; if (k.ms > 50) out.crossing.over50++; }
      const ctl = b.keys.map((k, i) => ({ ...k, i: i + 1, burst: b.label, run: run.label })).filter((k) => CONTROL.has(k.phase));
      out.control += ctl.length;
      if (exact) {
        const starts = [];
        for (const f of b.flips) {
          let s = b.keys.findIndex((k) => k.t <= f && f <= k.t + k.ms);
          if (s < 0) { for (let i = 0; i < b.keys.length; i++) if (b.keys[i].t <= f) s = i; }
          if (s >= 0) starts.push(s + 1);
        }
        out.starts += starts.length;
        for (const k of ctl) {
          if (starts.includes(k.i)) { out.start.push(k); continue; }
          const near = starts.some((si) => { const d = k.t - b.keys[si - 1].t; return d > 0 && d <= W; });
          (near ? out.window : out.steady).push(k);
        }
      } else {
        // FALLBACK: only keys over 40 ms carry events (the slow list); a key at or under 40 ms passes every class
        out.starts += 1;   // every burst opens on a reopened page: key 1 starts writing
        const slow = run.slow.filter((x) => x.burst === b.label && CONTROL.has(x.phase));
        const flipOf = (x) => { const e = (x.events || []).find((v) => /writing=true/.test(String(v[1]))); return e ? e[0] : null; };
        const key1 = slow.find((x) => x.n === 1);
        const s1 = key1 && flipOf(key1) != null && flipOf(key1) >= 0 ? flipOf(key1) : null;   // the flip's offset after key 1's keydown, when key 1 was slow
        const ms1 = b.keys[0] ? b.keys[0].ms : null;
        for (const x of slow) {
          const k = { ...x, i: x.n, run: run.label };
          const f = flipOf(x);
          if (x.n === 1 && f != null && f >= 0) { out.start.push(k); continue; }
          if (f == null) { out.steady.push(k); continue; }          // no flip in the 400 ms before it: far past any window
          const lo = s1 != null ? s1 - f : -f, hi = s1 != null ? s1 - f : -f + (ms1 ?? Infinity);
          k.dist = s1 != null ? +(s1 - f).toFixed(1) : [+(-f).toFixed(1), +hi.toFixed(1)];
          if (lo > W) out.steady.push(k); else if (hi <= W) out.window.push(k); else out.unproven.push(k);
        }
      }
    }
  }
  return out;
}
function verdictOf(c, main) {
  const steadyOver = c.steady.filter((k) => k.ms > STEADY_MS), startOver = [...c.start, ...c.window].filter((k) => k.ms > START_MS);
  return {
    steadyOver, startOver, unproven: c.unproven.filter((k) => k.ms > STEADY_MS),
    crossingOk: !!main && c.crossing.over40 <= main.crossing.over40 && c.crossing.over50 <= main.crossing.over50,
    pass: steadyOver.length === 0 && startOver.length === 0 && c.unproven.filter((k) => k.ms > STEADY_MS).length === 0 && !!main && c.crossing.over40 <= main.crossing.over40 && c.crossing.over50 <= main.crossing.over50,
  };
}

// ---- the self-tests (always run): synthetic turns, each judged, each with the outcome it must give ----------------------------------------------
const key = (t, ms, phase = 'fast') => ({ t, ms, phase });
const synthRun = (label, bursts) => ({ label, summary: {}, slow: [], raw: { bursts: bursts.map((b, i) => ({ label: `b${i}`, ...b })) } });
const baseArbor = (mod = (x) => x) => [synthRun('a-1', [mod({ flips: [10], keys: [key(0, 60), key(45, 47), key(70, 30), key(95, 30), key(120, 30), key(200, 41, 'hold')] })])];
const baseMain = [synthRun('m-1', [{ flips: [10], keys: [key(0, 20), key(45, 20), key(70, 20), key(200, 45, 'hold'), key(230, 52, 'fade')] }])];
const judgeSynth = (arbor, W = START_WINDOW_MS_RULED) => verdictOf(classify(arbor, W), classify(baseMain, W));
const live = [
  ['L1 the ruled case passes: start 60 ms, key 2 at +45 ms taking 47 ms, steady keys at 30 ms, crossing no worse than main', judgeSynth(baseArbor()).pass === true],
  ['L2 a steady key at 40.1 ms goes red', judgeSynth(baseArbor((b) => ({ ...b, keys: b.keys.map((k, i) => (i === 3 ? { ...k, ms: 40.1 } : k)) }))).pass === false],
  ['L3 the start key at 65.1 ms goes red', judgeSynth(baseArbor((b) => ({ ...b, keys: b.keys.map((k, i) => (i === 0 ? { ...k, ms: 65.1 } : k)) }))).pass === false],
  ['L4 key 2 typed at +50.1 ms is steady and goes red at 47 ms; at +50.0 ms it is in the window and passes', judgeSynth(baseArbor((b) => ({ ...b, keys: b.keys.map((k, i) => (i === 1 ? { ...k, t: 50.1 } : k)) }))).pass === false && judgeSynth(baseArbor((b) => ({ ...b, keys: b.keys.map((k, i) => (i === 1 ? { ...k, t: 50 } : k)) }))).pass === true],
  ['L5 crossing worse than main goes red (one more crossing key over 40 ms than main)', judgeSynth(baseArbor((b) => ({ ...b, keys: [...b.keys, key(260, 44, 'fade'), key(290, 44, 'fade')] }))).pass === false],
  ['L6 the window at 0 (Nick\'s "no") turns the ruled case red', judgeSynth(baseArbor(), 0).pass === false],
  ['L7 fallback: key 2 with the flip 33 ms before it and key 1 slow (flip 10 ms after its keydown) is 43 ms after key 1 - in the window; with key 1 not slow (40 ms) its bounds 33-73 straddle 50 - UNPROVEN, never passed',
    (() => {
      const fb = (key1slow) => [{ label: 'f-1', summary: {}, raw: { bursts: [{ label: 'b0', keys: [{ ms: key1slow ? 45 : 40, phase: 'fast' }, { ms: 47, phase: 'fast' }, { ms: 30, phase: 'fast' }] }] },
        slow: [...(key1slow ? [{ burst: 'b0', phase: 'fast', n: 1, ms: 45, events: [[10, 'writing=true']] }] : []), { burst: 'b0', phase: 'fast', n: 2, ms: 47, events: [[-33, 'writing=true']] }] }];
      const a = classify(fb(true), START_WINDOW_MS_RULED), b = classify(fb(false), START_WINDOW_MS_RULED);
      return a.window.length === 1 && a.unproven.length === 0 && verdictOf(a, classify(baseMain, 50)).pass === true && b.unproven.length === 1 && verdictOf(b, classify(baseMain, 50)).pass === false;
    })()],
];
for (const [n, p] of live) ok(n, p);

// ---- a turn folder -------------------------------------------------------------------------------------------------------------------------------
const folder = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const candidate = (() => { const i = process.argv.indexOf('--candidate'); return i > 0 ? process.argv[i + 1] : null; })();
if (folder) {
  const arms = new Map();
  for (const d of fs.readdirSync(folder).filter((x) => /^[a-z0-9]+-\d+$/i.test(x)).sort()) {
    const f = path.join(folder, d, 'arbor-keycost-attr.mjs.default.txt');
    if (!fs.existsSync(f)) continue;
    const L = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    const line = (p) => { const x = L.find((l) => l.startsWith(p)); return x ? JSON.parse(x.slice(p.length)) : null; };
    const run = { label: d, summary: line('ATTR-SUMMARY: '), slow: line('ATTR-SLOW: ') || [], raw: line('ATTR-RAW: ') };
    if (!run.summary || !run.raw) continue;
    const arm = d.replace(/-\d+$/, '');
    if (!arms.has(arm)) arms.set(arm, []);
    arms.get(arm).push(run);
  }
  const mains = [...arms].filter(([, rs]) => rs.every((r) => r.summary.arbor === false));
  const main = mains.length === 1 ? classify(mains[0][1], START_WINDOW_MS) : null;
  console.log(`ARBOR-BAR: steady <= ${STEADY_MS} ms; start + window <= ${START_MS} ms; START_WINDOW_MS = ${START_WINDOW_MS}${PLANT ? ` (PLANTED: ${PLANT}; ruled ${START_WINDOW_MS_RULED})` : ''}; main arm: ${mains.length === 1 ? mains[0][0] : `none or several (${mains.map((m) => m[0]).join(',')})`}`);
  if (main) console.log(`  ${mains[0][0]}: ${mains[0][1].length} runs | crossing ${main.crossing.n} keys, >40 ${main.crossing.over40}, >50 ${main.crossing.over50}`);
  let cand = null;
  for (const [arm, rs] of arms) {
    if (!rs.every((r) => r.summary.arbor === true)) continue;
    const c = classify(rs, START_WINDOW_MS), v = verdictOf(c, main);
    const ms = (xs) => xs.map((k) => k.ms).sort((a, b) => b - a).join(',') || '-';
    console.log(`  ${arm}: ${rs.length} runs, ${c.mode} | writing starts ${c.starts} over ${c.bursts} bursts | control ${c.control} keys | start: slowest ${Math.max(0, ...c.start.map((k) => k.ms))}, over 65: ${ms(c.start.filter((k) => k.ms > START_MS))} | window: ${c.window.length} slow (${ms(c.window)}) | steady over 40: ${v.steadyOver.length} (${ms(v.steadyOver)}) | UNPROVEN ${v.unproven.length}${v.unproven.length ? ` (${v.unproven.map((k) => `${k.ms}@${k.run}/${k.burst} n${k.i} +${JSON.stringify(k.dist)}`).join(' ')})` : ''} | crossing >40 ${c.crossing.over40}, >50 ${c.crossing.over50} -> ${v.pass ? 'PASS' : 'FAIL'}`);
    if (arm === candidate) cand = { c, v, rs };
  }
  ok(`B0 the turn is judgeable: one main arm, the candidate "${candidate}" is an Arbor arm, and it wrote 10 writing starts per run`, !!main && !!cand && cand.c.starts === cand.rs.length * 10, `main ${!!main}, candidate ${!!cand}, starts ${cand && cand.c.starts}`);
  if (cand) {
    ok(`B1 steady typing holds ${STEADY_MS} ms: no control key outside the start window over ${STEADY_MS} ms (${cand.v.steadyOver.length})`, cand.v.steadyOver.length === 0, cand.v.steadyOver.map((k) => `${k.ms}@${k.run}/${k.burst} n${k.i}`).join(' '));
    ok(`B2 the key that starts writing, and a key typed within ${START_WINDOW_MS} ms after it, hold ${START_MS} ms (${cand.v.startOver.length} over)`, cand.v.startOver.length === 0, cand.v.startOver.map((k) => `${k.ms}@${k.run}/${k.burst} n${k.i}`).join(' '));
    ok(`B3 the goal crossing is no worse than main's in the same turn (>40: ${cand.c.crossing.over40} vs ${main ? main.crossing.over40 : '?'}; >50: ${cand.c.crossing.over50} vs ${main ? main.crossing.over50 : '?'})`, cand.v.crossingOk);
    ok(`B4 every slow key's class is known (UNPROVEN ${cand.v.unproven.length}: a key whose distance from the start key straddles the window is never passed)`, cand.v.unproven.length === 0, cand.v.unproven.map((k) => `${k.ms}@${k.run}/${k.burst} n${k.i} +${JSON.stringify(k.dist)}`).join(' '));
  }
}

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const WANT = live.length + (folder ? 5 : 0);
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-BAR-UNIT: PASS (${checks.length} checks)` : `\nARBOR-BAR-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran where ${WANT} were expected)` : ''}`);
process.exit(pass ? 0 : 1);
