// ARBOR'S CARET IS THE BROWSER'S OWN (NICK RULED, Nov 14, 8:15 pm, via Fable 8:24 pm: "The drawn caret is SCRAPPED: the browser's own caret, brass on
// the dark page, ink #241A10 on the light page"). The successor of frames/arbor2-r22.mjs r22-light-caret / r22-light-caret-blink and of
// arbor2-caret-latency.mjs (all parked: they pinned the drawn edged caret, src/arbor2/edgedCaret.tsx, now removed).
// Under the flag, Arbor (plateau), per page tone (light, dark), in Draft and in Free Write's Typewriter, by day and by night, the caret at the words' end:
//   C1 on the LIGHT page (Draft both rooms; Typewriter by day, where the paper stays) the native caret is the page ink #241A10 - rgb(36, 26, 16)
//   C2 on the DARK page (every case) the native caret is brass #FF9800 - rgb(255, 152, 0)
//   C3 Typewriter by night on the light page is page-less (the words on the room): not a light page; its native caret shows (not transparent)
//   C4 nowhere a drawn caret: no .arbor2-edged-caret element and no editor carrying data-arbor2-caret-active
// MUTANTS (each asserted LANDED, through the same reads): M1 the native caret hidden as the drawn caret hid it (caret-color transparent) - C1 goes red;
// M2 a drawn caret element put back - C4 goes red.
// The flag is carried in this file's own navigations (history.replaceState to /?arbor2=1 + hash, then reload: frames/arbor2-r22.mjs's go()), never in
// WS_URL_SEARCH. Seeding goes through the seams. Run: node scripts/harness/arbor-native-caret.mjs (apps/desktop, dist-web built).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const INK = 'rgb(36, 26, 16)', BRASS = 'rgb(255, 152, 0)';
const PAGEW = 'The morning light came in low across the table, and she began to write.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const READ = `(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return null; const root = document.documentElement;
  return { caret: getComputedStyle(ed).caretColor, ink: getComputedStyle(ed).color, drawn: document.querySelectorAll('.arbor2-edged-caret').length,
    active: document.querySelectorAll('[data-arbor2-caret-active]').length, flag: root.getAttribute('data-arbor2'), theme: root.getAttribute('data-theme'),
    tone: root.getAttribute('data-page'), room: root.getAttribute('data-arbor2-room'), zoom: !!ed.closest('.mode-pagecol[data-zoom="true"]'), focused: document.activeElement === ed }; })()`;
const caretEnd = "(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()";
const isLight = (m) => m.tone !== 'dark' && !(m.zoom && m.room === 'night');
// the verdict for one case, as the checks read it (the mutants run the same function)
const judge = (m) => {
  if (!m) return { c1: false, c2: false, c3: false, c4: false };
  const light = isLight(m);
  return { c1: !light || m.caret === INK, c2: m.tone !== 'dark' || m.caret === BRASS, c3: !(m.tone !== 'dark' && m.zoom && m.room === 'night') || !/rgba\(0, 0, 0, 0\)|transparent/.test(m.caret), c4: m.drawn === 0 && m.active === 0 };
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau');");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 15000 });
  const go = async (hash) => {
    await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${J(hash)})`); await app.reload();
    await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  };
  const mode = async (word) => { const hit = await app.evalJs(`(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === ${J(word)}); if (b) b.click(); return !!b; })()`); await sleep(1200); return hit; };
  const setRoom = async (room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${J(room === 'day' ? 'light' : 'dark')})`); await sleep(700); };
  const cases = [];
  for (const tone of ['light', 'dark']) {
    await app.evalJs(`localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'), page: ${J(tone)} }))`);
    for (const where of ['draft', 'free write']) {
      const id = `arbor-nc-${tone}-${where.replace(' ', '')}-${Math.random().toString(36).slice(2, 6)}`;
      await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
      await sleep(300); await go(`#/page/${id}`);
      const opened = await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 10000 });
      const moded = opened && await mode(where);
      if (where === 'free write') await waitSoft(app, "!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'typewriter zoom', timeout: 6000 });
      for (const room of ['day', 'night']) {
        await setRoom(room); await app.evalJs(caretEnd); await sleep(400);
        const m = await app.evalJs(READ);
        cases.push({ tone, where, room, opened, moded, m, v: judge(m) });
      }
    }
  }
  const tag = (c) => `${c.tone}/${c.where}/${c.room}`;
  const premise = cases.filter((c) => c.m && c.opened && c.moded && c.m.flag === 'true' && c.m.theme === 'plateau' && c.m.tone === c.tone && c.m.room === c.room && c.m.focused && c.m.zoom === (c.where === 'free write'));
  ok(`P every case stood where it claims (8: flag on, Arbor, the tone and room set, the editor focused, Typewriter zoomed only in Free Write): ${premise.length}/${cases.length}`, premise.length === 8 && cases.length === 8,
    J(cases.map((c) => [tag(c), c.opened, c.moded, c.m && [c.m.flag, c.m.theme, c.m.tone, c.m.room, c.m.zoom, c.m.focused]])));
  const lightCases = cases.filter((c) => c.m && isLight(c.m)), darkCases = cases.filter((c) => c.m && c.m.tone === 'dark'), nightTw = cases.filter((c) => c.m && c.m.tone !== 'dark' && c.m.zoom && c.m.room === 'night');
  ok(`C1 on the light page the caret is the browser's own in the page ink #241A10 (${lightCases.length} cases: Draft by day and night, Typewriter by day)`, lightCases.length === 3 && lightCases.every((c) => c.v.c1),
    J(lightCases.map((c) => [tag(c), c.m.caret, c.m.ink])));
  ok(`C2 on the dark page the caret is the browser's own in brass #FF9800 (${darkCases.length} cases)`, darkCases.length === 4 && darkCases.every((c) => c.v.c2), J(darkCases.map((c) => [tag(c), c.m.caret])));
  ok(`C3 Typewriter by night on the light page (page-less) shows its native caret (${nightTw.length} case)`, nightTw.length === 1 && nightTw.every((c) => c.v.c3), J(nightTw.map((c) => [tag(c), c.m.caret])));
  ok(`C4 no drawn caret anywhere (no .arbor2-edged-caret, no editor with data-arbor2-caret-active) in all ${cases.length} cases`, cases.length === 8 && cases.every((c) => c.v.c4), J(cases.map((c) => [tag(c), c.m && c.m.drawn, c.m && c.m.active])));

  // MUTANTS, on the last light Draft case's page: back to the light page, Draft, by day
  await app.evalJs(`localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'), page: 'light' }))`);
  const mid = `arbor-nc-mut-${Math.random().toString(36).slice(2, 6)}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: mid, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300); await go(`#/page/${mid}`); await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 10000 }); await mode('draft'); await setRoom('day');
  await app.evalJs(caretEnd); await sleep(300);
  const base = await app.evalJs(READ);
  await app.evalJs("(() => { const st = document.createElement('style'); st.id = 'nc-m1'; st.textContent = \"html:root[data-arbor2][data-theme='plateau'] body .mode-pagecol .mode-page .forward-only-editor.forward-only-editor.forward-only-editor{ caret-color:transparent !important; }\"; document.head.appendChild(st); return true; })()");
  await sleep(200); const m1 = await app.evalJs(READ);
  await app.evalJs("document.getElementById('nc-m1')?.remove()");
  ok(`M1 (mutant): the native caret hidden as the drawn caret hid it (LANDED: caret ${m1 && m1.caret}) - C1 goes red on the light page`,
    !!base && judge(base).c1 && !!m1 && /rgba\(0, 0, 0, 0\)|transparent/.test(m1.caret) && !judge(m1).c1, J({ base: base && base.caret, m1: m1 && m1.caret }));
  await app.evalJs("(() => { const d = document.createElement('div'); d.className = 'arbor2-edged-caret'; d.id = 'nc-m2'; document.body.appendChild(d); return true; })()");
  await sleep(100); const m2 = await app.evalJs(READ);
  await app.evalJs("document.getElementById('nc-m2')?.remove()");
  ok(`M2 (mutant): a drawn caret element put back (LANDED: ${m2 && m2.drawn} element) - C4 goes red`, !!m2 && m2.drawn === 1 && !judge(m2).c4, J({ drawn: m2 && m2.drawn }));
  return checks;
}, { label: 'arbor-native-caret' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-NATIVE-CARET PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 7;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-NATIVE-CARET VERIFY: PASS (${checks.length} checks)` : `\nARBOR-NATIVE-CARET VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
