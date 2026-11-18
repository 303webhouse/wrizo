// HER NEXT KEY LANDS ON THE PAGE AFTER A PAUSE (Fable, Nov 18, 8:30 am, gate 7's question 2: "At pause + 3 s the DRAFT tab shows a brass focus ring.
// Does the app move focus off the page when she pauses, or did the frames driver put it there? If it's the app, it's a real bug: fix it before the
// ship, with a red-first check that her next key lands on the page."). On the redesign as it ships (no query), a page in Draft, by day:
//   P0 (premise) the page is writing after the first keys (data-wz-writing true) and the editor has the focus
//   F1 THE PAUSE: she stops - no key, no pointer - for the engine's whole wait (useChromeDissolve WAIT_MS 180 s) and the chrome comes back on its own;
//      the focus is still on the page, and her next key lands in it
//   M1 (mutant) the focus moved to the DRAFT tab during the pause (asserted LANDED): F1's read goes red
// INFORMATION (printed, not judged): Escape - "Press Escape to leave the page" - where the focus goes and where the next key lands (the gate-7 frame's
// driver pressed Escape to bring the chrome back); and the shade at the first key + 0.3 s (gate 7's question 3): every shade layer's opacity and what
// is drawn at the paper's centre.
// Navigation is this file's own (no query), so the harness's ?arbor2=0 pin does not apply. Seeding through the seams.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const PAGEW = 'The morning light came in low across the table, and she began to write.';
const FOCUS = "(() => { const a = document.activeElement, e = document.querySelector('.forward-only-editor'); return { onPage: !!e && a === e, active: a ? a.tagName.toLowerCase() + '.' + String(a.className || '').split(' ').slice(0, 2).join('.') + (a.textContent && a.textContent.length < 20 ? ' \"' + a.textContent.trim() + '\"' : '') : null, writing: document.documentElement.getAttribute('data-wz-writing'), text: e ? e.innerText : null }; })()";
const SHADE = `(() => { const o = (q) => [...document.querySelectorAll(q)].map((e) => Number(getComputedStyle(e).opacity)); const p = document.querySelector('.mode-page'); const r = p ? p.getBoundingClientRect() : null;
  const at = r ? document.elementsFromPoint(r.left + r.width / 2, r.top + r.height * 0.7).slice(0, 6).map((e) => e.tagName.toLowerCase() + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(' ').slice(0, 2).join('.')) : null;
  return { room: o('.arbor2-pergola'), page: o('.arbor2-pagesh:not([data-bitmap])'), copies: o('.arbor2-pagesh[data-bitmap]'), paper: p ? getComputedStyle(p).backgroundColor : null, atPaper: at, writing: document.documentElement.getAttribute('data-wz-writing') }; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  const open = async () => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
    await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
    await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 15000 });
    const id = `arbor-pf-${Math.random().toString(36).slice(2, 7)}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 15000 }); await sleep(900);
    await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
    await app.evalJs("document.documentElement.setAttribute('data-room', 'light'); true"); await sleep(800);
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
    await app.mouseMove(40, 700); await sleep(300);
  };
  // INFORMATION: the shade at the first key + 0.3 s
  await open();
  const rest = await app.evalJs(SHADE);
  await app.typeKeys('a'); await sleep(300);
  const k03 = await app.evalJs(SHADE);
  console.log('INFO SHADE ' + J({ rest, firstKeyPlus03: k03 }));

  // P0 + F1: the pause
  await open();
  for (let i = 0; i < 6; i += 1) { await app.typeKeys('w'); await sleep(110); }
  const p0 = await app.evalJs(FOCUS);
  ok(`P0 (premise) the page is writing after the first keys and the editor has the focus (${J(p0)})`, p0.onPage && p0.writing === 'true', J(p0));
  const t0 = Date.now(); while (Date.now() - t0 < 200000) { await sleep(1000); if ((await app.evalJs("document.documentElement.getAttribute('data-wz-writing')")) !== 'true') break; }
  const backAfter = Math.round((Date.now() - t0) / 1000);
  await sleep(3000);
  const f1 = await app.evalJs(FOCUS);
  await app.typeKeys('b'); await sleep(400);
  const f1b = await app.evalJs(FOCUS);
  ok(`F1 THE PAUSE: after ${backAfter} s with no input the chrome is back (writing ${f1.writing}); the focus is still on the page (${f1.active}) and her next key lands in it`,
    backAfter >= 170 && f1.writing !== 'true' && f1.onPage && /wwwwwwb$/.test((f1b.text || '').trim()), J({ backAfter, f1, after: f1b && f1b.text && f1b.text.slice(-12) }));

  // M1: the focus moved to the DRAFT tab during the pause - F1's read must go red
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.focus(); return !!b; })()"); await sleep(200);
  const m1 = await app.evalJs(FOCUS);
  await app.typeKeys('x'); await sleep(400);
  const m1b = await app.evalJs(FOCUS);
  ok(`M1 (mutant): the focus moved to the DRAFT tab (LANDED: ${m1.active}) - F1's read goes RED (the next key does not land on the page)`, !m1.onPage && !/bx$/.test((m1b.text || '').trim()), J({ m1, after: m1b && m1b.text && m1b.text.slice(-12) }));

  // INFORMATION: Escape - where the focus goes and where the next key lands
  await open();
  for (let i = 0; i < 6; i += 1) { await app.typeKeys('e'); await sleep(110); }
  await app.key('Escape'); await sleep(3000);
  const esc = await app.evalJs(FOCUS);
  await app.typeKeys('q'); await sleep(400);
  const escAfter = await app.evalJs(FOCUS);
  console.log('INFO ESCAPE ' + J({ afterEscape: esc, nextKeyText: escAfter && escAfter.text && escAfter.text.slice(-10), focusAfterKey: escAfter && escAfter.active }));
  return checks;
}, { label: 'arbor-pause-focus' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-PAUSE-FOCUS PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 3;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-PAUSE-FOCUS VERIFY: PASS (${checks.length} checks)` : `\nARBOR-PAUSE-FOCUS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
