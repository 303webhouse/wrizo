// ARBOR SHADE-GOING PROBE (a measurement, not a check; Fable, Nov 14, 8:24 pm: "make the going cheap: freeze the leaves, then fade the shade out as
// ONE flat, still picture"). Before changing the going, this reads what it does today in the start window, per reopen of arbor-keycost-attr's
// page in the day room (flag on): the time of key 1's keydown, the writing flip, each shade layer's data-live-off (the cut to the still picture)
// and data-asleep, measured in the page (MutationObserver, performance.now()); and the running animations (by layer) and their play state at
// +0, +50, +150, +400, +1000 and +3000 ms after key 1; plus key 1..3's times (rhizome-latency's meter). Prints KSG lines. Premises only.
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Number(process.env.KSG_ROUNDS || 10);
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARM = `(() => { if (window.__ksgOff) window.__ksgOff(); const K = window.__ksg = { keys: [], ev: [], snaps: [] }; let t0 = 0;
  const kd = () => { t0 = performance.now(); if (!K.k1) { K.k1 = t0; [0, 50, 150, 400, 1000, 3000].forEach((d) => setTimeout(() => {
    const by = {}; for (const a of document.getAnimations()) { const t = a.effect && a.effect.target; const L = !t || !t.closest ? 'other' : t.closest('.arbor2-pergola') ? 'room' : t.closest('.arbor2-pagesh[data-bitmap]') ? 'copy' : t.closest('.arbor2-pagesh') ? 'page' : t.closest('.arbor2-sun') ? 'sun' : t.closest('.wz-rhizome-field') ? 'rhizome' : 'other';
      const k = L + ':' + a.playState; by[k] = (by[k] || 0) + 1; }
    K.snaps.push({ d, at: performance.now() - K.k1, by }); }, d)); } };
  const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => K.keys.push({ t, ms: performance.now() - t }))); };
  const name = (el) => el === document.documentElement ? 'html' : el.classList.contains('arbor2-pergola') ? 'room' : el.hasAttribute('data-bitmap') ? 'copy' : el.classList.contains('arbor2-pagesh') ? 'page' : el.className;
  const mo = new MutationObserver((rs) => { const now = performance.now(); for (const m of rs) K.ev.push([now, name(m.target), m.attributeName, m.target.getAttribute(m.attributeName)]); });
  mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['data-wz-writing', 'data-live-off', 'data-asleep'] });
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  window.__ksgOff = () => { mo.disconnect(); document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
const READ = `(() => { const K = window.__ksg; const r = (x) => x == null ? null : Math.round(x * 10) / 10; const k1 = K.k1;
  return { keys: K.keys.map((k) => r(k.ms)), ev: K.ev.map((e) => [r(e[0] - k1), e[1], e[2], e[3]]), snaps: K.snaps.map((s) => ({ d: s.d, at: r(s.at), by: s.by })),
    arbor: document.documentElement.hasAttribute('data-arbor2'), room: document.documentElement.getAttribute('data-arbor2-room'), pergola: !!document.querySelector('.arbor2-pergola') }; })()`;

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
  const rows = [];
  for (let i = 0; i < ROUNDS; i += 1) {
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
    await js(`(() => { window.wrizoSetWritingGoal({ n: 8, unit: 'words' }); window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') }); })()`);
    await app.reload();
    await js(`location.hash = '#/page/' + ${JSON.stringify(pageHash)}`);
    await app.waitFor("!!document.querySelector('.wz-rhizome-field')", { label: 'page reopened' });
    await sleep(800 + 1600 * (i % 5));   // a spread of moments in the 16 s breeze, so some keys land mid-shiver
    await js("document.querySelector('.forward-only-editor').focus()");
    await js(ARM);
    for (let k = 0; k < 3; k += 1) { await app.typeKeys('a'); await sleep(25); }
    await sleep(3400);
    const r = await js(READ); rows.push(r);
    console.log('KSG ' + JSON.stringify({ round: i + 1, ...r }));
  }
  ok(`P1 an Arbor day page with the pergola at every reopen (${ROUNDS})`, rows.length === ROUNDS && rows.every((r) => r.arbor && r.room === 'day' && r.pergola), JSON.stringify(rows.map((r) => [r.arbor, r.room, r.pergola])));
  ok('P2 the writing flip was seen after key 1 on every reopen, and the six animation reads ran', rows.every((r) => r.ev.some((e) => e[2] === 'data-wz-writing' && e[3] === 'true') && r.snaps.length === 6), '');
  return checks;
}, { label: 'arbor-shadego-probe' });
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const pass = checks.length === 2 && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-SHADEGO-PROBE VERIFY: PASS (${checks.length} checks)` : `\nARBOR-SHADEGO-PROBE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
