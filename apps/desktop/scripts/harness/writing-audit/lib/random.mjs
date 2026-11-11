// THE RANDOM WRITER (writing audit, session 3; brief §7 pass B): a seeded generator performs long random sequences of a writer's actions on the Page editor in Draft, against the SAME reference model, reader and
// verdict as the scripted passes (model.mjs, verify.mjs, geom.mjs). FINDS AND REPORTS; FIXES NOTHING.
//   - FAST steps (every step): real trusted keys / mouse, two frames, then text, caret place, focus, page rect, console (and Flux's block caret, an element). FULL steps (after every Enter, every 12th step, the last step)
//     add the settle wait and the PAINTED native caret read from pixels (the expensive check), so a sequence of 150 steps costs about half a minute, not ten.
//   - KNOWN BUGS are recognised by signature (F1 the caret painted at the right margin on an empty middle line, F2 Flux's caret jumping up after Enter on an empty line, F5 Flux's block caret at a soft-wrap boundary,
//     N1 Up skipping a visual line, N3 Flux's Down from an empty line, and the platform-dependent word keys): the model is RESYNCED to what the page did and the sequence carries on, so one known bug does not end every run.
//     They are counted, not shrunk. Anything else ends the sequence, is SHRUNK (ddmin over the steps before it, replayed from a fresh page) and reported with its seed.
//   - A seed is `base + i`: every sequence replays exactly (the same words, the same keys, the same choices), and the report names it.
// Knobs (env): WA_THEME WA_FLAG WA_TONE WA_W WA_H (as the other passes), WA_GROUPS=n<count>s<seedBase> (default n60s1), WA_BUDGET_MIN (stop starting sequences after this many minutes; default 80), WA_OUT
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './driver.mjs';
import { Model, stepLabel } from './model.mjs';
import { verify } from './verify.mjs';
import { visualLines, lineOf, vertical, homeEnd, hit } from './geom.mjs';

// ---- the generator ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const WORDS = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'writes', 'a', 'long', 'sentence', 'about', 'rain', 'light', 'morning', 'coffee', 'window', 'story', 'she', 'said', 'nothing', 'until', 'night', 'fell', 'on', 'the', 'harbor', 'town'];
const PUNCT = ['.', ',', '?', '!'];
const K = (key, o = {}) => ({ k: 'key', key, ...o });
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// weighted choice of the next step, from the INTENDED model (text, caret) so a long unbroken run does not grow past ~700 characters or ~14 lines
export function genStep(r, m) {
  const n = m.text.length, lines = m.text.split('\n').length;
  const big = n > 700 || lines > 14;
  const table = [
    [big ? 4 : 30, () => ({ k: 'type', s: pick(r, WORDS) + (r() < 0.8 ? ' ' : '') })],
    [4, () => ({ k: 'type', s: pick(r, 'abcdefghijklmnopqrstuvwxyz'.split('')) })],
    [3, () => ({ k: 'type', s: pick(r, PUNCT) })],
    [big ? 2 : 11, () => K('Enter')],
    [2, () => K('Enter', { shift: true })],
    [14, () => K('Backspace')],
    [6, () => K('Delete')],
    [6, () => K('ArrowLeft')], [6, () => K('ArrowRight')],
    [3, () => K('ArrowLeft', { shift: true })], [3, () => K('ArrowRight', { shift: true })],
    [3, () => K('Home', { geo: 'home' })], [3, () => K('End', { geo: 'end' })],
    [2, () => K('Home', { ctrl: true })], [2, () => K('End', { ctrl: true })],
    [4, () => K('ArrowUp', { geo: 'up' })], [4, () => K('ArrowDown', { geo: 'down' })],
    [3, () => ({ k: 'click', rand: r() })],
    [1, () => K('a', { ctrl: true })],
    [1, () => K('ArrowLeft', { ctrl: true })], [1, () => K('ArrowRight', { ctrl: true })], [1, () => K('Backspace', { ctrl: true })],
  ];
  const total = table.reduce((s, [w]) => s + w, 0);
  let x = r() * total;
  for (const [w, f] of table) { x -= w; if (x < 0) return f(); }
  return K('Enter');
}

export function startState(r) {
  if (r() < 0.5) return { text: '', at: 0 };
  const paras = 1 + Math.floor(r() * 3);
  const text = Array.from({ length: paras }, () => Array.from({ length: 3 + Math.floor(r() * 8) }, () => pick(r, WORDS)).join(' ')).join('\n');
  return { text, at: Math.floor(r() * (text.length + 1)) };
}

// ---- classification of a failure: known bug, or new -------------------------------------------------------------------------------------------------------------------------------------------
export function classify(theme, st, v, late, exp) {
  const checks = v.fails.map((f) => f.check);
  const detail = v.fails.map((f) => f.detail).join(' | ');
  if (st.ctrl && /Arrow|Backspace|Delete/.test(st.key || '')) return 'oracle:word';
  if (checks.length && checks.every((c) => c === 'page')) return 'T1';
  if (checks.length && checks.every((c) => c === 'drawn') && /\(between rows\)/.test(detail)) return 'F1';
  if (theme === 'flux' && st.k === 'key' && st.key === 'Enter' && checks.includes('caret') && late.focus !== null && late.focus < exp.f) return 'F2';
  if (theme === 'flux' && checks.length && checks.every((c) => c === 'drawn') && /Flux block caret/.test(detail)) return 'F5';
  if (st.geo === 'up' && checks.includes('caret') && !checks.includes('text')) return 'N1';
  if (theme === 'flux' && st.geo === 'down' && checks.includes('caret') && !checks.includes('text')) return 'N3';
  return 'new';
}

// ---- main -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export async function main({ title }) {
  const env = process.env;
  const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
  if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
  const g = /^n(\d+)s(\d+)$/.exec(env.WA_GROUPS || '') || [null, '60', '1'];
  const NSEQ = Number(g[1]), SEEDBASE = Number(g[2]);
  const BUDGET_MS = Number(env.WA_BUDGET_MIN || 75) * 60000;
  const STEPS = Number(env.WA_STEPS || 150);
  const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
  const tagHash = [...TAG].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);
  if (cfg.out) fs.mkdirSync(cfg.out, { recursive: true });
  const out = (s) => console.log(s);
  const known = {}, unknown = [], seqLog = [], t1 = [], seenSig = new Set();
  let shrunkCount = 0;
  let stepsRun = 0, seqRun = 0, t0 = Date.now(), seed0 = 0;

  async function attachPixels(d, r) {
    if (r.theme === 'flux' || !r.editor || !r.collapsed || !r.focused) return;
    const px = await d.pixelCaret(); r.px = px; r.pxTries = px ? px.tries : 12;
  }
  // one step against the model; `full` adds the settle wait and the painted caret
  async function execStep(d, m, st, goal, full) {
    const theme = cfg.theme;
    const before = await d.read();
    const needStops = st.geo || st.k === 'click';
    const stops = needStops ? await d.stops() : null;
    const lns = stops ? visualLines(stops) : null;
    const n = m.text.length;
    const exp = m.clone();
    let act, anyF = null, resolved = st;
    if (st.geo === 'up' || st.geo === 'down') {
      if (!goal.keep || goal.x == null) goal.x = stops[before.focus] && stops[before.focus].x;
      anyF = vertical(lns, before.focus, goal.x, st.geo, n); act = () => d.key(st.key, st);
    } else if (st.geo === 'home' || st.geo === 'end') {
      anyF = homeEnd(lns, before.focus, st.key, m.text); act = () => d.key(st.key, st);
    } else if (st.k === 'click') {
      let q;
      if (st.q !== undefined && stops[st.q] && stops[st.q].x !== undefined) q = st.q;
      else {
        const usable = lns.filter((L) => L.top > 0 && L.top < before.view.h - 40);
        const L = usable[Math.floor((st.rand ?? 0.5) * usable.length)] || lns[0];
        q = L.ps[Math.floor((((st.rand ?? 0.5) * 997) % 1) * L.ps.length)];
      }
      const li = lineOf(lns, q);
      const s = stops[q]; const x = s.x + 0.6, y = s.top + (s.height || 18) / 2;
      resolved = { k: 'click', q };
      anyF = hit(lns, li, x); act = () => d.click(x, y, 1);
    } else if (st.k === 'mutate') { act = () => d.ev(st.js); }
    else { exp.apply(st); act = () => d.perform(st); }
    const e0 = d.errors.length;
    await act();
    let early, late;
    if (full) {
      await d.frames(); early = await d.read(); await sleep(350); late = await d.read();
      if (late.tw) { await d.still(); late = await d.read(); }
      await attachPixels(d, late);
    } else { await d.frames(); late = await d.read(); early = late; }
    if (anyF) { const p = anyF.includes(late.focus) ? late.focus : anyF[0]; exp.f = p; exp.a = st.shift ? m.a : p; }
    const wantDrawn = full || theme === 'flux';
    const box = wantDrawn && exp.collapsed ? await d.box(exp.f) : null;
    const v = verify({ exp: exp.snapshot(), box, before, early, late, errors: d.errors.slice(e0), expect: { noDrawn: !wantDrawn, noPage: !full && !!(before.tw || late.tw) } });
    { const li0 = lns ? lineOf(lns, before.focus) : -1; const jumped = (st.geo === 'up' && li0 === 0) || (st.geo === 'down' && lns && li0 === lns.length - 1); goal.keep = (st.geo === 'up' || st.geo === 'down') && !jumped; }
    return { exp, v, late, resolved, anyF };
  }

  // run one sequence: `gen` (seeded) or a fixed `steps` list (a replay); returns the first NEW failure, with the steps that led to it
  async function runSeq(d, { seed, start, steps: fixed, limit }) {
    seed0 = seed;
    const r = mulberry32(seed);
    await d.openPage(start.text, 'drafting', {});
    const placed = await d.place(start.at);
    let m = new Model(start.text, start.at, start.at, 'linux');
    const r0 = await d.read(); m.platform = r0.platform;
    const trace = [], counts = {};
    const goal = { x: null, keep: false };
    const total = fixed ? fixed.length : limit;
    if (!placed) return { setup: true, trace, counts };
    for (let i = 0; i < total; i++) {
      const st = fixed ? fixed[i] : genStep(r, m);
      const stNext = st;
      const full = fixed ? fixed.fullAt && fixed.fullAt.has(i) : (i === total - 1 || i % 12 === 11 || (st.k === 'key' && st.key === 'Enter'));
      let res;
      try { res = await execStep(d, m, stNext, goal, !!full); }
      catch (e) { return { trace, counts, fail: { i, st, class: 'harness', fails: [{ check: 'harness', detail: String((e && e.message) || e).slice(0, 200) }] } }; }
      trace.push(res.resolved);
      stepsRun++;
      if (res.v.fails.length) {
        const cls = classify(cfg.theme, st, res.v, res.late, res.exp);
        if (cls === 'new') return { trace, counts, fail: { i, st: res.resolved, class: cls, fails: res.v.fails, late: { text: res.late.text, anchor: res.late.anchor, focus: res.late.focus, selPoint: res.late.selPoint }, expected: res.exp.snapshot() } };
        counts[cls] = (counts[cls] || 0) + 1;
        if (cls === 'T1' && t1.length < 12) t1.push({ seed: seed0, step: i + 1, label: stepLabel(res.resolved), detail: res.v.fails[0].detail.slice(0, 260), textLen: res.exp.text.length, lines: res.exp.text.split('\n').length });
        // resync to what the page did, and carry on
        const L = res.late;
        if (L.anchor !== null && L.focus !== null && typeof L.text === 'string') m = new Model(L.text, L.anchor, L.focus, m.platform);
        else { m = res.exp; await d.place(m.f); }
        goal.keep = false;
        continue;
      }
      m = res.exp;
    }
    return { trace, counts };
  }

  // ddmin over the steps (the failing one stays last): the shortest list that still fails with the same primary check
  async function shrink(d, start, trace, failIdx, primary) {
    let steps = trace.slice(0, failIdx + 1);
    const failsAgain = async (list) => {
      const withFull = Object.assign([...list], { fullAt: new Set(primary === 'drawn' ? list.map((_, i) => i) : [list.length - 1]) });
      const res = await runSeq(d, { seed: 1, start, steps: withFull });
      return !!(res.fail && res.fail.class === 'new' && res.fail.fails.some((f) => f.check === primary) && res.fail.i === list.length - 1);
    };
    let replays = 0, chunk = Math.max(1, Math.floor((steps.length - 1) / 2));
    while (chunk >= 1 && replays < 25) {
      let removed = false;
      for (let s = 0; s + chunk <= steps.length - 1 && replays < 25; ) {
        const cand = [...steps.slice(0, s), ...steps.slice(s + chunk)];
        replays++;
        if (cand.length && await failsAgain(cand)) { steps = cand; removed = true; } else s += chunk;
      }
      if (!removed) chunk = Math.floor(chunk / 2);
    }
    return { steps, replays };
  }

  const label = (st) => (st.k === 'click' ? `click at offset ${st.q ?? '?'}` : st.k === 'mutate' ? 'MUTANT: ' + st.name : stepLabel(st));
  try {
    await withHarness(async (app) => {
      const d = makeDriver(app, cfg);
      out(`WRITING AUDIT ${title} [${TAG}] n=${NSEQ} seedBase=${SEEDBASE} steps=${STEPS} budget=${BUDGET_MS / 60000}min (${new Date().toISOString()})`);
      await d.boot();
      await d.openPage('probe', 'drafting', {});
      const first = await d.read();
      out(`PREMISE  the room: theme=${first.theme} tone=${first.tone} editor=${first.editor} view=${first.view && first.view.w}x${first.view && first.view.h} platform=${first.platform} typewriter=${first.tw}`);
      // LIVENESS: a writer that cannot fail proves nothing. An injected corruption in the middle of a short fixed sequence must be caught by the random writer's own steps and shrunk to the corruption alone.
      {
        const lstart = { text: 'abc def', at: 7 };
        const mutant = { k: 'mutate', name: 'a stray character appended behind the editor', js: "(() => { const w = document.createTreeWalker(document.querySelector('.forward-only-editor'), NodeFilter.SHOW_TEXT); const n = w.nextNode(); n.data = n.data + 'Z'; })()" };
        const steps = [{ k: 'type', s: 'hello ' }, K('Enter'), { k: 'type', s: 'x' }, mutant, K('Backspace')];
        const res = await runSeq(d, { seed: 1, start: lstart, steps });
        const caught = !!(res.fail && res.fail.class === 'new' && res.fail.fails.some((f) => f.check === 'text') && res.fail.i === 3);
        let small = null;
        if (caught) { const sh = await shrink(d, lstart, res.trace, res.fail.i, 'text'); small = sh.steps; }
        const okLive = caught && small && small.length === 1 && small[0].k === 'mutate';
        out(`${okLive ? 'PASS' : 'FAIL'}  R-random the random writer catches an injected corruption at step 4 and shrinks it to ${small ? small.length : '?'} step(s) (caught=${caught})`);
        if (!okLive) process.exitCode = 1;
      }
      for (let i = 0; i < NSEQ; i++) {
        if (Date.now() - t0 > BUDGET_MS) { out(`BUDGET  stopped before sequence ${i + 1}: the ${BUDGET_MS / 60000}-minute budget is spent`); break; }
        const seed = ((tagHash ^ Math.imul(SEEDBASE, 7919)) + i * 104729) | 0;
        const start = startState(mulberry32(seed ^ 0x5bd1e995));
        const res = await runSeq(d, { seed, start, limit: STEPS });
        seqRun++;
        for (const [k, v] of Object.entries(res.counts)) known[k] = (known[k] || 0) + v;
        if (res.setup) { out(`SKIP  seq ${i + 1} seed ${seed}: the start could not be staged`); continue; }
        if (res.fail) {
          const f = res.fail;
          const primary = f.fails[0].check;
          out(`FAIL  seq ${i + 1} seed ${seed} [${TAG}]: step ${f.i + 1} (${label(f.st)}): ${f.fails.map((x) => `${x.check} - ${x.detail}`).join(' || ').slice(0, 520)}`);
          let sh = null;
          const sig = `${primary}|${f.st.key || f.st.k}`;
          if (f.class === 'new' && !seenSig.has(sig) && shrunkCount < 3) { seenSig.add(sig); shrunkCount++; sh = await shrink(d, start, res.trace, f.i, primary); out(`      shrunk ${f.i + 1} -> ${sh.steps.length} steps in ${sh.replays} replays: start ${JSON.stringify(start.text.slice(0, 60))} caret ${start.at}; ${sh.steps.map(label).join(' > ')}`); }
          unknown.push({ seed, start, failStep: f.i + 1, fails: f.fails, got: f.late, expected: f.expected, steps: res.trace.slice(0, f.i + 1).map(label), shrunk: sh && sh.steps.map(label), replays: sh && sh.replays });
        } else out(`PASS  seq ${i + 1} seed ${seed} [${TAG}]: ${STEPS} steps${Object.keys(res.counts).length ? '  known: ' + Object.entries(res.counts).map(([k, v]) => `${k}x${v}`).join(' ') : ''}`);
        seqLog.push({ i: i + 1, seed, fail: !!res.fail, counts: res.counts });
      }
    });
  } catch (err) { out(`FAIL  the run reached its end  [${String((err && err.stack) || err).split('\n').slice(0, 4).join(' | ')}]`); process.exitCode = 1; }
  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, `random-${TAG.replace(/\//g, '-')}.json`), JSON.stringify({ tag: TAG, cfg, seeds: { base: SEEDBASE, tagHash }, sequences: seqRun, steps: stepsRun, minutes: mins, known, t1Examples: t1, unknown, seqLog }, null, 1));
  out(`\nRANDOM WRITER [${TAG}]: ${seqRun} sequences, ${stepsRun} steps in ${mins} min; known bugs seen (resynced): ${JSON.stringify(known)}; T1 (page rect moves within two frames) examples kept: ${t1.length}; NEW failures: ${unknown.length}${unknown.length ? ' (seeds ' + unknown.map((u) => u.seed).join(', ') + ')' : ''}`);
  process.exit(process.exitCode || 0);
}
