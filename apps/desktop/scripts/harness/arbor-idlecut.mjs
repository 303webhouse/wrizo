// ARBOR SHADE (b): THE STILL AT REST, MEASURED (Fable, Nov 14, 11:12 pm: "Meanwhile your (b) on Actions only, as a backup, not merged: the room shows
// its still picture whenever no leaf is mid-shiver. Measure key 1 at rest and during a shiver."). A measurement on a measurement build: pergola.ts
// on arbor/shade-idlecut shows the still picture outside the breeze's moving window, with two test hooks (window.__kpIdleCutOff = today's
// behaviour; window.__arbor2IdleTick = re-evaluate). On ONE runner, interleaved, the order rotating: arm on (b) and arm off (today), each with key 1
// typed AT REST (no leaf moving: the breeze clock 6-11 s into its 16 s cycle) and DURING A SHIVER (1.2-2.8 s in, the most leaves moving), on
// arbor-keycost-attr's page re-seeded and reopened in the day room (flag on). Keys 1-3, 25 ms apart, timed with rhizome-latency's meter; then 30
// steady keys at 110 ms. Premises: the arm held, the moment was hit, the layer stood as (b) says before the key (cut at rest when on).
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Number(process.env.KIC_ROUNDS || 5);
const CASES = [['on', 'rest'], ['off', 'rest'], ['on', 'shiver'], ['off', 'shiver']];
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const METER = `(() => { if (window.__kcOff) window.__kcOff(); window.__kc = []; let t0 = 0; const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => window.__kc.push(performance.now() - t))); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kcOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
const PHASE = `(() => { const g = document.querySelector('.arbor2-pergola .wz-leaf'); const a = g && g.getAnimations()[0]; if (!a || a.startTime == null) return null;
  return (((Number(document.timeline.currentTime) - Number(a.startTime)) % 16000) + 16000) % 16000; })()`;
const STATE = `(() => { const root = document.documentElement, pg = document.querySelector('.arbor2-pergola');
  return { arbor: root.hasAttribute('data-arbor2'), room: root.getAttribute('data-arbor2-room'), pergola: pg ? getComputedStyle(pg).display : null, liveOff: pg ? pg.getAttribute('data-live-off') : null,
    hook: typeof window.__arbor2IdleTick === 'function', off: !!window.__kpIdleCutOff }; })()`;

await withHarness(async (app) => {
  const js = (e) => app.evalJs(e);
  await app.goto('/');
  await js("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await js("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  const pageHash = (await js('location.hash')).replace(/^#\/page\//, '');
  const pageId = pageHash.split('?')[0];
  await js("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  await app.reload();
  const res = Object.fromEntries(CASES.map(([a, p]) => [`${a}/${p}`, { start: [], k1: [], steady: [], hit: [], states: [] }]));
  for (let round = 0; round < ROUNDS; round += 1) {
    const order = [...CASES.slice(round % CASES.length), ...CASES.slice(0, round % CASES.length)];
    for (const [arm, phase] of order) {
      const R = res[`${arm}/${phase}`];
      await app.goto('/');
      await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
      await js(`(() => { window.wrizoSetWritingGoal({ n: 1000, unit: 'words' }); window.wrizoPatchEntry(${J(pageId)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') }); })()`);
      await app.reload();
      await js(`location.hash = '#/page/' + ${J(pageHash)}`);
      await app.waitFor("!!document.querySelector('.wz-rhizome-field')", { label: 'page reopened' });
      await js(`(() => { window.__kpIdleCutOff = ${arm === 'off'}; if (window.__arbor2IdleTick) window.__arbor2IdleTick(); return true; })()`);
      await sleep(900);
      await js("document.querySelector('.forward-only-editor').focus()");
      // wait for the moment (at most one cycle and a bit)
      const [lo, hi] = phase === 'rest' ? [6000, 11000] : [1200, 2800];
      let ph = null; const t0 = Date.now();
      while (Date.now() - t0 < 18000) { ph = await js(PHASE); if (ph != null && ph >= lo && ph <= hi) break; await sleep(40); }
      await js(METER);
      const st = await js(STATE); R.states.push(st);
      const ph2 = await js(PHASE); R.hit.push(ph2 != null && ph2 >= lo - 100 && ph2 <= hi + 150 ? Math.round(ph2) : -1);
      for (let k = 0; k < 3; k += 1) { await app.typeKeys('a'); await sleep(25); }
      await sleep(400);
      const s = await js('window.__kc.slice()'); R.start.push(...s); R.k1.push(s[0]);
      await js(METER);
      const t1 = Date.now(); for (let k = 0; k < 30; k += 1) { await app.typeKeys('a'); const w = t1 + (k + 1) * 110 - Date.now(); if (w > 0) await sleep(w); }
      await sleep(300);
      R.steady.push(...(await js('window.__kc.slice()')));
    }
  }
  const sum = (xs) => { const s = [...xs].sort((a, b) => a - b); const q = (p) => s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(s.length * p))] * 10) / 10 : null;
    return { n: s.length, mean: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length * 10) / 10 : null, p50: q(0.5), p90: q(0.9), max: q(1), over40: s.filter((x) => x > 40).length, over50: s.filter((x) => x > 50).length }; };
  for (const k of Object.keys(res)) console.log('KIC ' + J({ case: k, start: sum(res[k].start), key1: sum(res[k].k1), steady: sum(res[k].steady), phases: res[k].hit, liveOffBefore: res[k].states.map((s) => s.liveOff) }));
  const held = Object.entries(res).every(([k, R]) => { const [arm, phase] = k.split('/'); return R.states.every((s) => s.arbor && s.room === 'day' && s.pergola !== 'none' && s.hook && s.off === (arm === 'off'))
    && R.hit.every((h) => h >= 0) && (arm === 'on' && phase === 'rest' ? R.states.every((s) => s.liveOff === 'true') : R.states.every((s) => s.liveOff !== 'true')); });
  ok(`P1 every case held (${ROUNDS} rounds x 4): the measurement build's hooks present, the arm set, the breeze moment hit, and before key 1 the room's live drawing cut ONLY in on/rest`, held,
    J(Object.fromEntries(Object.entries(res).map(([k, R]) => [k, { hit: R.hit, liveOff: R.states.map((s) => s.liveOff), off: R.states.map((s) => s.off) }]))));
  ok(`P2 every key measured (${ROUNDS * 3} start and at least ${ROUNDS * 28} steady per case)`, Object.values(res).every((R) => R.start.length === ROUNDS * 3 && R.steady.length >= ROUNDS * 28), '');
  return checks;
}, { label: 'arbor-idlecut' });
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const pass = checks.length === 2 && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-IDLECUT VERIFY: PASS (${checks.length} checks)` : `\nARBOR-IDLECUT VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
