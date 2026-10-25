// POLISH #10, FIX items 17 + 18 (Nick's live test of #7, Oct 25):
//   17  IN FLUX THE ORANGE CARET FOLLOWS ENTER AT ONCE. Today after Enter the native caret is on the new line but the orange block stays behind until the
//       next keystroke - then the text jumps down and the block catches up. In the normal view and the zoom: no lag, no jump.
//   18  ONE CARET ONLY: where a theme draws its own caret (Flux's orange block), the native caret is hidden while the block is mounted.
// RED-FIRST, on page-size-r3 @ 243cf8f0.
//
// Flux, a Draft page with text, 1366x768, the normal view and the zoom; the writer at the end of the text:
//   C17-AT    within two frames of a trusted Enter, the orange block stands on the NEW line (its middle inside the new row's box)
//   C17-HOLD  and the next keystroke moves nothing: the page's text does not jump (the first visible line's top moves by <= 2px), because the line Enter
//             made was already paid for - and the block stays on that line
//   C18       while the block is mounted, the editor's caret is transparent (one caret)
// Mutants (normal view): MC17 the block nudged 40px up after Enter - C17-AT fails; MC18 a caret colour forced back on - C18 fails.
// Each red reading carries what the instrument saw (the block, the row, the selection's anchor), so a red run is also the diagnosis.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-caret.mjs (apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const TEXT = 'The rope was already there, and the well took the bucket back colder still.\nWhatever is worth carrying is already with you, and the rest the wind can have.\nWe left the map on the stone.';
const enter = async (app) => { const p = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' };
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', ...p }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p }); };
// the block, the caret's row (the line the native caret is on), the selection's anchor - read after two animation frames
const PROBE = `(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => {
  const b = document.querySelector('.flux-block-caret'); const ed = document.querySelector('.forward-only-editor'); const s = getSelection();
  const a = s && s.rangeCount ? s.anchorNode : null; const ae = a && (a.nodeType === 1 ? a : a.parentElement);
  const row = ae && (ae.closest('.wz-row') || (ae.matches && ae.matches('.forward-only-editor') ? ae.children[Math.max(0, Math.min(s.anchorOffset, ae.children.length - 1))] : null));
  const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top * 10) / 10, bottom: Math.round(r.bottom * 10) / 10, left: Math.round(r.left), height: Math.round(r.height * 10) / 10 }; };
  const rg = document.createRange(); rg.selectNodeContents(ed); const lines = [...rg.getClientRects()].filter((q) => q.height >= 4).map((q) => Math.round(q.top * 10) / 10);
  res({ block: R(b), row: R(row), rows: ed.querySelectorAll(':scope > .wz-row').length, anchor: a ? { node: a.nodeType === 3 ? 'text' : a.nodeName, offset: s.anchorOffset } : null,
    firstLine: lines.length ? Math.min(...lines) : null, caretColor: getComputedStyle(ed).caretColor, zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null });
}))))()`;
const onRow = (g) => !!g && !!g.block && !!g.row && (g.block.top + g.block.height / 2) >= g.row.top - 1 && (g.block.top + g.block.height / 2) <= g.row.bottom + 1;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-theme','flux')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  ok('fixture: Flux applied', (await app.evalJs("document.documentElement.getAttribute('data-theme')")) === 'flux');
  for (const zoom of [false, true]) {
    const view = zoom ? 'zoom' : 'normal';
    const id = `p10c-${view}`;
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: TEXT, createdAt: new Date().toISOString(), origin: null, source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${id}', '${zoom ? 'on' : 'off'}')`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: id, timeout: 10000 }))) { ok(`${view} fixture: the page opened`, false, ''); continue; }
    await sleep(900);
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
    await app.typeKeys(' And'); await sleep(900);
    const g0 = await app.evalJs(PROBE);
    ok(`Flux ${view} (premise): the page is in the ${view} view, the block is mounted on the writer's line`, !!g0 && (g0.zoom === 'true') === zoom && onRow(g0), J(g0));
    ok(`Flux ${view} C18: while the block is mounted the native caret is transparent - ONE caret`, !!g0 && !!g0.block && /rgba\(0, 0, 0, 0\)|transparent/.test(g0.caretColor), J({ caretColor: g0 && g0.caretColor }));
    await enter(app);
    const g1 = await app.evalJs(PROBE);
    ok(`Flux ${view} C17-AT: within two frames of Enter the orange block stands on the NEW line (its middle inside the new row)`,
      !!g1 && !!g0 && g1.rows === g0.rows + 1 && onRow(g1) && g1.block.top > g0.block.top + 4, J({ before: g0 && { block: g0.block, rows: g0.rows }, after: g1 }));
    await sleep(900);
    const g2 = await app.evalJs(PROBE);
    await app.typeKeys('x'); await sleep(900);
    const g3 = await app.evalJs(PROBE);
    ok(`Flux ${view} C17-HOLD: the next keystroke moves nothing - the text does not jump (first visible line ${g2 && g2.firstLine} -> ${g3 && g3.firstLine}) and the block stays on its line`,
      !!g2 && !!g3 && g2.firstLine != null && Math.abs(g3.firstLine - g2.firstLine) <= 2 && !!g2.block && !!g3.block && Math.abs(g3.block.top - g2.block.top) <= 2, J({ g2, g3 }));
    if (!zoom) {
      // MC17: the block nudged 40px up just after Enter - C17-AT must fail
      await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'p10c-m17'; s.textContent = '.flux-block-caret{ translate: 0 -40px !important; }'; document.head.appendChild(s); return true; })()");
      await enter(app);
      const gm = await app.evalJs(PROBE);
      await app.evalJs("document.getElementById('p10c-m17')?.remove()");
      ok(`MC17 (mutant): with the block nudged 40px up after Enter (LANDED: block middle ${gm && gm.block && Math.round(gm.block.top + gm.block.height / 2)} vs row ${gm && gm.row && gm.row.top}-${gm && gm.row && gm.row.bottom}), C17-AT fails`,
        !!gm && !onRow(gm), J(gm));
      // MC18: a caret colour forced back on - C18 must fail
      await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'p10c-m18'; s.textContent = '.forward-only-editor{ caret-color: rgb(255, 0, 0) !important; }'; document.head.appendChild(s); return true; })()");
      const cm = await app.evalJs("getComputedStyle(document.querySelector('.forward-only-editor')).caretColor");
      await app.evalJs("document.getElementById('p10c-m18')?.remove()");
      ok(`MC18 (mutant): with a caret colour forced back on (LANDED: ${cm}), C18 fails`, cm === 'rgb(255, 0, 0)' && !/rgba\(0, 0, 0, 0\)|transparent/.test(cm), cm);
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 700)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-CARET PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-CARET VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-CARET VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
