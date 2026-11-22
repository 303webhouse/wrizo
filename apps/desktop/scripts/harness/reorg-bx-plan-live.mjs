// BEFORE YOU EXPORT: "PLAN ROWS NEVER ATTACHED TO A PART", IN THE APP (reorg-plan-v2, INK queue; the stage menus, F4: "Doesn't block, but is announced: Plan rows never attached to a Part", each line a count she can click; train E is live,
// FIX's partOfRow). Machina, ?reorg=1, a Page of a made Doc, the publishing sheet open, the Back menu's Before You Export tab. The rules' half is reorg-bx-unit.mjs (PLAN); this proves what only the app can.
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": three pages -> three Parts, bp-1 "Opening" (its Plan is the board bp-own), bp-2 "Close", bp-3 "Epilogue" (no words). The board holds four cards: Alpha, Beta, Gamma, and a pinned
// page (bp-2). Alpha is attached to bp-1 (the board's own link record, the one "-> Part" makes); Beta and Gamma are not; the pin takes no Part and is never counted.
//   BP1  the tab says "2 Plan rows with no Part" (Beta and Gamma; Alpha has its Part, the pin is never counted), as a line she can press, BEFORE "1 Part with no words" (the stage menus' order); nothing blocks the export
//   BP2  pressing it opens the Plan tab (where each row has its "-> Part"); only the Back menu moves
//   BP3  the count follows the store while the tab is open: Beta gets its Part -> "1 Plan row with no Part"; Gamma hidden from this Page's Plan -> the line is gone and the empty-Part line stays
//   BP4  PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after the tab, the press and the changes; the editor is the same node
//   BP5  a page with no Plan (bp-2): no Plan-rows line
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-bx-plan-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const pin = (id, entryId, seq, y) => ({ id, kind: 'page-pin', x: 0.5, y, w: 0.3, h: 0.1, z: seq + 1, entryId, seq });
const NOTES = "(() => [...document.querySelectorAll('[data-back-export] [data-bx-note]')].map((b) => ({ kind: b.getAttribute('data-bx-note'), text: (b.textContent || '').trim() })))()";
const BLOCKED = "(() => !!document.querySelector('[data-back-export] [data-bx-block]'))()";
const link = (id, boxId, toEntry) => ({ id, aEntryId: 'bp-own', aBoxId: boxId, bEntryId: toEntry, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' });

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('bp-own', 'Plan board', { origin: 'loose', pageType: 'board', boxes: ${q([card('c1', 'Alpha', 0, 0.05), card('c2', 'Beta', 1, 0.2), card('c3', 'Gamma', 2, 0.35), pin('c4', 'bp-2', 3, 0.5)])} });
    page('bp-1', 'Opening words.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('bp-2', 'Closing words.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    page('bp-3', '', { origin: 'project', projectId: brief.id, orderIndex: 2 });
    W.wrizoPatchEntry('bp-1', { pageSettings: ${PS}, name: 'Opening', level: 0 }, planBoardId: 'bp-own' });
    W.wrizoPatchEntry('bp-2', { pageSettings: ${PS}, name: 'Close', level: 0 } });
    W.wrizoPatchEntry('bp-3', { pageSettings: ${PS}, name: 'Epilogue', level: 0 } });
    W.wrizoPatchEntry('bp-own', { pageLinks: ${q([link('l1', 'c1', 'bp-1')])} });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, w = 1366) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const sheet = async (app, on) => { await app.evalJs(on ? press('.reorg-top .desk-mode-tab[data-mode-key="publish"]') : press('[data-pub-back]')); await sleep(500); };
const drawer = async (app) => { if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); } };
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-tutor-tab-${id}')?.click(); null`); await sleep(450); };

await withHarness(async (app) => {
  await seed(app);
  await open(app, 'bp-1');
  await sheet(app, true); await drawer(app); await tab(app, 'export');
  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__bpMark = 1; " + PAGE);
  const n0 = await app.evalJs(NOTES), b0 = await app.evalJs(BLOCKED);
  ok('BP1 the tab says "2 Plan rows with no Part" (Beta and Gamma: Alpha has its Part, the pin is never counted) as a line she can press, BEFORE "1 Part with no words"; nothing blocks the export',
    Array.isArray(n0) && n0.map((n) => n.kind).join(',') === 'planRows,emptyParts' && n0[0].text === '2 Plan rows with no Part' && n0[1].text === '1 Part with no words' && b0 === false, { n0, b0 });

  await app.evalJs(press('[data-bx-note="planRows"]')); await sleep(500);
  const plan = await app.evalJs("(() => ({ tab: document.getElementById('wz-tutor-tab-plan')?.getAttribute('aria-selected'), include: !!document.querySelector('[data-plan-include]'), sheet: !!document.querySelector('[data-reorg-pub]') }))()");
  ok('BP2 pressing the line opens the Plan tab (the tab is selected, the Plan\'s own list is there); the sheet stays open', plan && plan.tab === 'true' && plan.include === true && plan.sheet === true, plan);

  await tab(app, 'export');
  // Beta gets its Part (the board's own record, as "-> Part" writes it), through the entry seam while the tab is open
  await app.evalJs(`(() => { window.wrizoPatchEntry('bp-own', { pageLinks: ${q([link('l1', 'c1', 'bp-1'), link('l2', 'c2', 'bp-2')])} }); window.wrizoFlushNow(); return null; })()`); await sleep(500);
  const n1 = await app.evalJs(NOTES);
  // Gamma hidden from this Page's Plan (hiddenPlanCards, the key the Plan tab's own hide writes)
  await app.evalJs("(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === 'bp-1'); window.wrizoPatchEntry('bp-1', { pageSettings: { ...e.pageSettings, hiddenPlanCards: ['c3'] } }); window.wrizoFlushNow(); return null; })()"); await sleep(500);
  const n2 = await app.evalJs(NOTES);
  ok('BP3 the count follows the store while the tab is open: Beta gets its Part -> "1 Plan row with no Part"; Gamma hidden from this Page\'s Plan -> the line is gone and the empty-Part line stays',
    Array.isArray(n1) && n1[0] && n1[0].text === '1 Plan row with no Part' && Array.isArray(n2) && n2.map((n) => n.kind).join(',') === 'emptyParts', { n1, n2 });

  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__bpMark");
  const geo = { w1366: mark === after && same };
  await open(app, 'bp-1', 1920);
  await sheet(app, true); await drawer(app); await tab(app, 'export');
  const m2 = await app.evalJs(PAGE);
  await app.evalJs("(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === 'bp-1'); window.wrizoPatchEntry('bp-1', { pageSettings: { ...e.pageSettings, hiddenPlanCards: [] } }); window.wrizoFlushNow(); return null; })()"); await sleep(500);
  await app.evalJs(press('[data-bx-note="planRows"]')); await sleep(400);
  geo.w1920 = m2 === (await app.evalJs(PAGE));
  ok('BP4 PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after the tab, the press and the changes; the editor is the same node', geo.w1366 && geo.w1920, { geo, mark, after, m2 });

  await open(app, 'bp-2');
  await sheet(app, true); await drawer(app); await tab(app, 'export');
  const n3 = await app.evalJs(NOTES);
  ok('BP5 a page with no Plan (bp-2): no Plan-rows line', Array.isArray(n3) && !n3.some((n) => n.kind === 'planRows'), n3);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 5;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-BX-PLAN-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-BX-PLAN-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
