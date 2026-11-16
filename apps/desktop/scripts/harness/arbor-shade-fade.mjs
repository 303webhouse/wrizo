// ARBOR'S SHADE FADE (the ship brief, Nov 15, gate 5: "the shade's fade at 0, 1, 3 and 6 s as today, the 3 s return, and reduced motion as cuts";
// spec §19.4; Nick's ruled design, Nov 4/7: "leaves stop on the first key; the whole shade (room, page, menus) fades out over ~6 s while the vines
// fade in; on pause, vines out, shade back over ~3 s, breeze resumes"). Under the flag, the day room, a page reopened at rest:
//   F0 (premise) an Arbor day page with the pergola shown, the page's copy of the shade, and the vines field
//   F1 THE GOING: after the first key the room's shade and the page's copy read the 6 s ease curve at +0, +1, +3 and +6 s (each within 0.1 of
//      1 - ease(t / 6)); the vines rise to 1 by +6 s
//   F2 THE RETURN: after the chrome's return (Esc) the vines fall to 0 by +3 s and the shade comes back over ~3 s - partway at +1 s (0.15-0.85),
//      at 1 by +3 s
//   F3 REDUCED MOTION (prefers-reduced-motion: reduce, the browser's own emulation): the going and the return are cuts - the shade at 0 by +0.3 s
//      after the first key and back at 1 by +0.3 s after the return
//   M1 (mutant) the going shortened to 2 s (a test-only sheet, asserted LANDED): F1's read goes red at +3 s
// Opacity is read from the layers' computed style (the compositor's own value while a transition runs). The flag is carried in this file's own
// navigations (history.replaceState), never in WS_URL_SEARCH. Seeding goes through the seams.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const PAGEW = 'The morning light came in low across the table, and she began to write.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
// CSS 'ease' = cubic-bezier(.25, .1, .25, 1), solved for x by bisection
const ease = (x) => { const bx = (t) => 3 * (1 - t) * (1 - t) * t * 0.25 + 3 * (1 - t) * t * t * 0.25 + t * t * t, by = (t) => 3 * (1 - t) * (1 - t) * t * 0.1 + 3 * (1 - t) * t * t + t * t * t;
  if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; } return by((lo + hi) / 2); };
const READ = `(() => { const o = (q) => { const e = document.querySelector(q); return e ? Number(getComputedStyle(e).opacity) : null; };
  const root = document.documentElement;
  return { room: o('.arbor2-pergola'), page: o('.arbor2-pagesh:not([data-bitmap])'), vines: o(".wz-rhizome-field[data-vines='true']"), writing: root.getAttribute('data-wz-writing'),
    arbor: root.getAttribute('data-arbor2'), roomName: root.getAttribute('data-arbor2-room'), pergola: (() => { const p = document.querySelector('.arbor2-pergola'); return p ? getComputedStyle(p).display : null; })() }; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau');");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 15000 });
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  const openAtRest = async () => {
    const id = `arbor-sf-${Math.random().toString(36).slice(2, 7)}`;
    await app.evalJs(`window.wrizoSetWritingGoal({ n: 1000, unit: 'words' }); window.wrizoCreateJournalPage(${J({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(300);
    await app.evalJs(`history.replaceState(null, '', '/?arbor2=1&arbor2room=day#/page/${id}')`); await app.reload();
    await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
    await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector(\".wz-rhizome-field[data-vines='true']\")", { label: 'page with vines', timeout: 15000 });
    await sleep(2500);   // at rest: the shade at full strength
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  };
  // the going: reads at +0, +1, +3, +6 s after the first key
  const going = async () => { const t0 = Date.now(); await app.typeKeys('a'); const at = {}; for (const s of [0, 1, 3, 6]) { const w = t0 + s * 1000 - Date.now(); if (w > 0) await sleep(w); at[s] = await app.evalJs(READ); } return at; };
  // the return (Esc: the chrome's own return): reads at +0, +1, +3 s
  const back = async () => { const t0 = Date.now(); await app.key('Escape'); const at = {}; for (const s of [0, 1, 3]) { const w = t0 + s * 1000 - Date.now(); if (w > 0) await sleep(w); at[s] = await app.evalJs(READ); } return at; };
  const near = (v, want, tol = 0.1) => v != null && Math.abs(v - want) <= tol;
  const curve = (at, layer) => [0, 1, 3, 6].every((s) => near(at[s] && at[s][layer], 1 - ease(s / 6)));

  await openAtRest();
  const rest = await app.evalJs(READ);
  ok(`F0 (premise) an Arbor day page at rest: the pergola shown at full strength, the page's copy of the shade, and the vines field (${J({ room: rest.room, page: rest.page, vines: rest.vines })})`,
    rest.arbor === 'true' && rest.roomName === 'day' && rest.pergola !== 'none' && near(rest.room, 1, 0.02) && rest.page != null && rest.vines != null, J(rest));
  const g = await going();
  const want = Object.fromEntries([0, 1, 3, 6].map((s) => [s, Math.round((1 - ease(s / 6)) * 100) / 100]));
  ok(`F1 THE GOING: the room's shade and the page's copy read the 6 s ease at +0/+1/+3/+6 s (want ${J(want)}; room ${J([0, 1, 3, 6].map((s) => g[s] && g[s].room))}, page ${J([0, 1, 3, 6].map((s) => g[s] && g[s].page))}); the vines reach 1 by +6 s (${g[6] && g[6].vines})`,
    curve(g, 'room') && curve(g, 'page') && near(g[6] && g[6].vines, 1, 0.05) && g[0] && g[0].writing === 'true', J(g));
  const b = await back();
  ok(`F2 THE RETURN: after Esc the vines fall to 0 by +3 s (${J([0, 1, 3].map((s) => b[s] && b[s].vines))}) and the shade comes back over ~3 s - partway at +1 s, at 1 by +3 s (room ${J([0, 1, 3].map((s) => b[s] && b[s].room))})`,
    !!b[1] && b[1].writing !== 'true' && near(b[3] && b[3].vines, 0, 0.05) && b[1].room >= 0.15 && b[1].room <= 0.85 && near(b[3] && b[3].room, 1, 0.05), J(b));

  // M1: the going shortened to 2 s - F1's curve read must go red at +3 s
  await openAtRest();
  await app.evalJs("(() => { const st = document.createElement('style'); st.id = 'sf-m1'; st.textContent = \":root[data-arbor2][data-theme='plateau'][data-arbor2-room='day'][data-wz-writing='true'] :is(.arbor2-pergola, .arbor2-pagesh){ transition:opacity 2s ease !important; }\"; document.head.appendChild(st); return true; })()");
  const gm = await going();
  await app.evalJs("document.getElementById('sf-m1')?.remove()");
  ok(`M1 (mutant): the going shortened to 2 s (LANDED: the room at +3 s ${gm[3] && gm[3].room}) - F1's 6 s curve read goes RED`, !!gm[3] && gm[3].room != null && gm[3].room < 0.05 && !curve(gm, 'room'), J(gm));

  // F3: reduced motion - the going and the return are cuts
  await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await openAtRest();
  const r0 = await app.evalJs(READ);
  await app.typeKeys('a'); await sleep(300); const rg = await app.evalJs(READ);
  await app.key('Escape'); await sleep(300); const rb = await app.evalJs(READ);
  await app.cdp('Emulation.setEmulatedMedia', { features: [] });
  ok(`F3 REDUCED MOTION: the going and the return are cuts - the shade ${r0.room} at rest, ${rg.room} at +0.3 s after the first key, ${rb.room} at +0.3 s after the return`,
    near(r0.room, 1, 0.02) && near(rg.room, 0, 0.02) && near(rb.room, 1, 0.02) && rg.writing === 'true' && rb.writing !== 'true', J({ r0, rg, rb }));
  return checks;
}, { label: 'arbor-shade-fade' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-SHADE-FADE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 5;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-SHADE-FADE VERIFY: PASS (${checks.length} checks)` : `\nARBOR-SHADE-FADE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
