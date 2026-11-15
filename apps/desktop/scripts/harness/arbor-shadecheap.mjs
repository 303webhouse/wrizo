// ARBOR SHADE: A CHEAP GOING (a measurement; Fable, Nov 14, 8:24 pm: "freeze the leaves, then fade the shade out as ONE flat, still picture").
// Single runs on separate runners could not tell the variants apart (runner noise > the differences), so every arm here runs on ONE runner,
// interleaved, the arm order rotating each round. The variants are the stylesheet's own rules edited in place through the CSSOM after every reopen
// (deleteRule + insertRule: the same as the build change, not an override on top of it):
//   base      today's rules
//   A         the writing flip no longer restyles the leaves (the paused rule keeps the drift wrapper only)
//   B         the still picture painted at rest (opacity .004, its own layer), so the first key only changes a compositor opacity
//   AB        both
//   shadeoff  the Mood menu's "Day shadows" switch (data-arbor2-off~='shadows'), the floor
// Per round and arm: arbor-keycost-attr's page re-seeded to 7 words and reopened (day room, flag on), then the first 3 keys 25 ms apart (the start
// window) and 30 steady keys at 110 ms, each timed with rhizome-latency's meter. Prints KSC lines per arm and a summary. Premises only.
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Number(process.env.KSC_ROUNDS || 6);
const ARMS = ['base', 'A', 'B', 'AB', 'shadeoff'];
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const METER = `(() => { if (window.__kcOff) window.__kcOff(); window.__kc = []; let t0 = 0; const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => window.__kc.push(performance.now() - t))); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__kcOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
// the CSSOM edit: returns how many rules it replaced (the premise reads it)
const EDIT = (arm) => `(() => { const want = ${J(arm)}; let n = 0;
  const A_OLD = ":is(.arbor2-pergola-drift, .wz-leaf)", B_SEL = ".arbor2-pergola-drift > .arbor2-still";
  for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
    for (let i = rules.length - 1; i >= 0; i -= 1) { const r = rules[i]; if (!r.selectorText) continue;
      if (want.includes('A') && r.selectorText.includes("[data-wz-writing=\\"true\\"]") && r.selectorText.includes(A_OLD) && r.style.animationPlayState === 'paused') {
        const sel = r.selectorText.replace(A_OLD, '.arbor2-pergola-drift'); sh.deleteRule(i); sh.insertRule(sel + '{ animation-play-state: paused; }', i); n += 1; }
      else if (want.includes('B') && r.selectorText.endsWith(B_SEL) && !r.selectorText.includes('live-off') && r.style.opacity === '0') { r.style.opacity = '.004'; r.style.willChange = 'opacity'; n += 1; } } }
  return n; })()`;
const STATE = `(() => { const root = document.documentElement, pg = document.querySelector('.arbor2-pergola'), st = document.querySelector('.arbor2-pergola .arbor2-still');
  return { arbor: root.hasAttribute('data-arbor2'), room: root.getAttribute('data-arbor2-room'), off: root.getAttribute('data-arbor2-off'), pergola: pg ? getComputedStyle(pg).display : null,
    stillOpacity: st ? getComputedStyle(st).opacity : null }; })()`;

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
  const res = Object.fromEntries(ARMS.map((a) => [a, { start: [], k1: [], steady: [], edits: [], states: [] }]));
  for (let round = 0; round < ROUNDS; round += 1) {
    const order = [...ARMS.slice(round % ARMS.length), ...ARMS.slice(0, round % ARMS.length)];
    for (const arm of order) {
      await app.goto('/');
      await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
      await js(`(() => { window.wrizoSetWritingGoal({ n: 1000, unit: 'words' }); window.wrizoPatchEntry(${J(pageId)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') }); })()`);
      await app.reload();
      await js(`location.hash = '#/page/' + ${J(pageHash)}`);
      await app.waitFor("!!document.querySelector('.wz-rhizome-field')", { label: 'page reopened' });
      const n = arm === 'shadeoff' ? 0 : arm === 'base' ? 0 : await js(EDIT(arm));
      if (arm === 'shadeoff') await js("(() => { const r = document.documentElement; const s = new Set((r.getAttribute('data-arbor2-off') || '').split(' ').filter(Boolean)); s.add('shadows'); r.setAttribute('data-arbor2-off', [...s].join(' ')); return true; })()");
      await sleep(900);
      await js("document.querySelector('.forward-only-editor').focus()");
      res[arm].edits.push(n); res[arm].states.push(await js(STATE));
      await js(METER);
      for (let k = 0; k < 3; k += 1) { await app.typeKeys('a'); await sleep(25); }
      await sleep(400);
      const s = await js('window.__kc.slice()'); res[arm].start.push(...s); res[arm].k1.push(s[0]);
      await js(METER);
      const t0 = Date.now(); for (let k = 0; k < 30; k += 1) { await app.typeKeys('a'); const w = t0 + (k + 1) * 110 - Date.now(); if (w > 0) await sleep(w); }
      await sleep(300);
      res[arm].steady.push(...(await js('window.__kc.slice()')));
    }
  }
  const sum = (xs) => { const s = [...xs].sort((a, b) => a - b); const q = (p) => s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(s.length * p))] * 10) / 10 : null;
    return { n: s.length, mean: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length * 10) / 10 : null, p50: q(0.5), p90: q(0.9), max: q(1), over40: s.filter((x) => x > 40).length, over50: s.filter((x) => x > 50).length }; };
  for (const arm of ARMS) console.log('KSC ' + J({ arm, start: sum(res[arm].start), key1: sum(res[arm].k1), steady: sum(res[arm].steady), edits: res[arm].edits }));
  // premises: the arm held (A/AB replaced the leaves' rule, B/AB the still's; shadeoff the pergola hidden), the keys were measured
  const held = ARMS.every((a) => res[a].states.every((s) => s.arbor && s.room === 'day') && (a === 'shadeoff' ? res[a].states.every((s) => s.pergola === 'none') : res[a].states.every((s) => s.pergola !== 'none'))
    && (a === 'A' ? res[a].edits.every((x) => x >= 1) : a === 'B' ? res[a].edits.every((x) => x >= 1) && res[a].states.every((s) => s.stillOpacity === '0.004') : a === 'AB' ? res[a].edits.every((x) => x >= 2) && res[a].states.every((s) => s.stillOpacity === '0.004') : true)
    && (a === 'base' ? res[a].states.every((s) => s.stillOpacity === '0') : true));
  ok(`P1 every arm held at every reopen (${ROUNDS} rounds x ${ARMS.length} arms; A/AB replaced the leaves' paused rule, B/AB the still's opacity, shadeoff hid the pergola, base untouched)`, held,
    J(Object.fromEntries(ARMS.map((a) => [a, { edits: res[a].edits, still: res[a].states.map((s) => s.stillOpacity), pergola: res[a].states.map((s) => s.pergola) }]))));
  ok(`P2 every key was measured (${ROUNDS * 3} start and at least ${ROUNDS * 28} steady per arm)`, ARMS.every((a) => res[a].start.length === ROUNDS * 3 && res[a].steady.length >= ROUNDS * 28), J(ARMS.map((a) => [a, res[a].start.length, res[a].steady.length])));
  return checks;
}, { label: 'arbor-shadecheap' });
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const pass = checks.length === 2 && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-SHADECHEAP VERIFY: PASS (${checks.length} checks)` : `\nARBOR-SHADECHEAP VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
