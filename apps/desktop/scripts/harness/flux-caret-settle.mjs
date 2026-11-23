// FLUX'S BLOCK CARET STANDS AT THE SELECTION AFTER A PAGE OPENS (Fable, Nov 23, 12:40 pm: "yours, red first; a must for Flux live if it shows on the join").
// The Front menu's frames (Nov 22) drew the caret at its load position, e.g. [477,447,h24] with the selection at [889,176,h17], in 5 of 6 frames; one wz-caret-moved put it right.
// This file opens a Doc the way the frames job does (the same stored prefs, the same fixture, no preview door) and reads the drawn caret against the selection, with no event sent.
//   CS1  at rest after the page opens, the caret stands at the selection, on every load at 1366 and 1920
//   CS2  the same with the Tools drawer opened after the load
// Run (repo root; Actions, or a box turn):  node apps/desktop/scripts/harness/flux-caret-settle.mjs
process.env.WS_REORG = '1';   // the table as it ships, not the driver's pin (runtime-verify serves __wrizoReorgOff otherwise)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HEIGHT = { 1366: 768, 1920: 1080 };
const LOADS = 4;
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";

// every place the caret is drawn while the page loads, with the zoom and the mode at that moment: printed for a stale load, so a red names its own moment
const CARET_LOG = "(() => { window.__cl = []; const snap = () => { const c = document.querySelector('.flux-block-caret'); const z = document.querySelector('.mode-pagecol'); const m = document.querySelector('.desk-mode-tab.active'); const r = c && c.getBoundingClientRect(); const k = [r ? Math.round(r.left) : '-', r ? Math.round(r.top) : '-', r ? Math.round(r.height) : '-', z ? (z.getAttribute('data-zoom') || 'nozoom') : 'nopage', m ? m.getAttribute('data-mode-key') : 'nomode'].join(' '); const L = window.__cl; if (!L.length || L[L.length - 1][1] !== k) L.push([Math.round(performance.now()), k]); }; new MutationObserver(snap).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'data-zoom', 'class'] }); })()";
const READ = "(() => { const c = document.querySelector('.flux-block-caret'); const r = c && c.getBoundingClientRect(); const s = getSelection(); let x = null; try { x = s && s.rangeCount ? s.getRangeAt(0).getClientRects()[0] : null; } catch { x = null; } const z = document.querySelector('.mode-pagecol'); return { caret: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.height)] : null, sel: x ? [Math.round(x.left), Math.round(x.top), Math.round(x.height)] : null, zoom: z ? z.getAttribute('data-zoom') : 'nopage', active: (document.activeElement && document.activeElement.className || '').toString().split(' ')[0] }; })()";
const stale = (v) => !v || !v.caret || !v.sel || Math.abs(v.caret[0] - v.sel[0]) > 2 || Math.abs(v.caret[1] - v.sel[1]) > 2 || Math.abs(v.caret[2] - v.sel[2]) > 3;

async function fresh(app, w) {
  await app.emulateDpr(1, w, HEIGHT[w]);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }))}); localStorage.setItem('wrizo-theme', 'flux'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.slice(-1) + '.000Z', source: 'page', ...extra });
    const brief = W.wrizoCreateProject('Brief');
    const parts = [['ff-1', 'Arrival', 'The harbour was quiet when she arrived. Nobody met her at the quay.'], ['ff-2', 'The town', 'By the second week the town had decided what she was.'], ['ff-3', 'The toll', 'The toll was paid in the spring.']];
    parts.forEach(([id, , text], i) => page(id, text, { origin: 'project', projectId: brief.id, orderIndex: i }));
    parts.forEach(([id, name]) => W.wrizoPatchEntry(id, { pageSettings: ${PS}, name, level: 0 } }));
    W.wrizoFlushNow();
    return null;
  })()`);
  await sleep(500);
}

async function load(app, id) {
  const { identifier } = await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: CARET_LOG });
  await app.evalJs(`history.replaceState(null, '', '/#/page/${id}')`);
  await app.reload();
  await app.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}

const rest = [], drawer = [];
await withHarness(async (app) => {
  // one seed for both widths: a second localStorage.clear() in the same browser never got its Top Drawer back (run 45245370945)
  await fresh(app, 1366);
  for (const w of [1366, 1920]) {
    await app.emulateDpr(1, w, HEIGHT[w]);
    for (let i = 0; i < LOADS; i += 1) {
      await load(app, 'ff-1');
      await sleep(1200);   // past every settle the page has: what is drawn now stays drawn
      const v = await app.evalJs(READ);
      const row = { w, i, ...v };
      if (stale(v)) row.log = await app.evalJs('(window.__cl || []).slice(-8)');
      rest.push(row);
      await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null");
      await sleep(900);
      const d = await app.evalJs(READ);
      const dRow = { w, i, ...d };
      if (stale(d)) dRow.log = await app.evalJs('(window.__cl || []).slice(-8)');
      drawer.push(dRow);
    }
  }
});

for (const r of [...rest, ...drawer].filter((x) => x.log)) console.log('INFO stale ' + JSON.stringify(r));
const N = LOADS * 2;
const bad = (L) => L.filter((v) => stale(v));
console.log(`INFO loads ${rest.length}; stale at rest ${bad(rest).length}; stale with the drawer ${bad(drawer).length}`);
ok(`CS1 at rest after the page opens the block caret stands at the selection, on all ${N} loads at 1366 and 1920`, rest.length === N && bad(rest).length === 0, bad(rest).slice(0, 3));
ok(`CS2 with the Tools drawer opened after the load it still does, on all ${N} loads`, drawer.length === N && bad(drawer).length === 0, bad(drawer).slice(0, 3));

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 2;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nFLUX-CARET-SETTLE VERIFY: PASS (${checks.length} checks)`
  : `\nFLUX-CARET-SETTLE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
