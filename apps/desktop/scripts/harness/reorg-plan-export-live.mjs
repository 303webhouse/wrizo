// INCLUDE THE PLAN IN WHAT GOES OUT, IN THE APP (reorg-plan-v2, INK queue item 5a; the stage menus, L4: "[ ] Include the Plan in what goes out, only if she ticks it"; Nick, Nov 20: it stays in the Back menu, with Plan).
// Machina, ?reorg=1, a Page of a made Doc, the publishing sheet open. The text's half is reorg-plan-export-unit.mjs; this proves what only the app can. The Plan is the OPEN page's own (the board its Plan tab shows).
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": two pages -> two Parts, pe-1 "Opening" (its own board pe-own holds three cards: Alpha, Beta, Gamma) and pe-2 "Close" (no board).
//   PE1  the Plan tab holds a checkbox "Include the Plan in what goes out", unticked, only while the sheet is open; with the sheet closed the tab has none
//   PE2  unticked, the Markdown file is as today (no Plan); ticked, it carries "## Plan" and the three rows, numbered, in her order, before the Parts; unticked again, it is as today
// SUPERSEDED, kept verbatim (Fable, Nov 21, 12:10 am: the tick is remembered per Doc, so it is no longer session-only and does store one thing):
//   PE3  the tick is the view's own state: opening it, ticking and exporting store NOTHING (every entry, board and page setting is byte-identical; no new localStorage key), and closing the sheet clears it
//   PE3  the tick is REMEMBERED per Doc (docSettings export.includePlan, beside the format): ticking stores exactly { export: { includePlan: true } } on the Doc's own record and nothing else (every entry and page setting byte-identical, no new localStorage key); closing the sheet and opening it again finds it ticked; unticking takes the key off and leaves docSettings {} (never null)
//   PE4  PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after the tick and the export; the editor is the same node
//   PE5  a page with no board (pe-2 opened): the checkbox is there but disabled, and says there is nothing to include; nothing is added to a file
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-plan-export-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const STORE = "(['writer-studio-journal-entries', 'writer-studio-projects'].map((k) => localStorage.getItem(k)))";
const KEYS = "Object.keys(localStorage).sort()";
const CATCH = "(() => { window.__pbBlobs = []; const B = window.__pbRealBlob || (window.__pbRealBlob = window.Blob); window.Blob = function (parts, o) { window.__pbBlobs.push({ text: parts.join(''), type: o && o.type, name: null }); return new B(parts, o); }; window.Blob.prototype = B.prototype; HTMLAnchorElement.prototype.click = function () { const l = window.__pbBlobs[window.__pbBlobs.length - 1]; if (l && !l.name) l.name = this.download; }; return true; })()";
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const DS = "(() => { const p = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').find((x) => x.title === 'Brief'); return p ? (p.docSettings === undefined ? 'absent' : p.docSettings) : 'noproject'; })()";
const BOX = "(() => { const b = document.querySelector('[data-plan-include]'); if (!b) return null; const i = b.querySelector('input[type=checkbox]'); return { checked: !!i && i.checked, disabled: !!i && i.disabled, text: (b.textContent || '').trim() }; })()";
const WANT_MD = '# Brief\n\n## Plan\n\n- 1 Alpha\n- 2 Beta\n- 3 Gamma\n\n## Opening\n\nOpening words.\n\n## Close\n\nClosing words.\n';
const AS_TODAY = '# Brief\n\n## Opening\n\nOpening words.\n\n## Close\n\nClosing words.\n';

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
    page('pe-own', 'Own board', { origin: 'loose', pageType: 'board', boxes: ${q([card('c1', 'Alpha', 0, 0.05), card('c2', 'Beta', 1, 0.2), card('c3', 'Gamma', 2, 0.35)])} });
    page('pe-1', 'Opening words.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('pe-2', 'Closing words.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    W.wrizoPatchEntry('pe-1', { pageSettings: ${PS}, name: 'Opening', level: 0 }, planBoardId: 'pe-own' });
    W.wrizoPatchEntry('pe-2', { pageSettings: ${PS}, name: 'Close', level: 0 } });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, w = 1366) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs('window.wrizoTheme.set(\'machina\'); null');
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-frame-host .sprint-nav') && !!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const sheet = async (app, on) => { await app.evalJs(on ? press('.reorg-top .desk-mode-tab[data-mode-key="publish"]') : press('[data-pub-back]')); await sleep(500); };
const drawer = async (app) => { if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); } };
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-tutor-tab-${id}')?.click(); null`); await sleep(400); };
const exportMd = async (app) => { await app.evalJs(CATCH); await app.evalJs('window.__pbBlobs.length = 0; null'); await app.evalJs(press('[data-pub-export="md"]')); await sleep(300); const b = await app.evalJs('window.__pbBlobs'); return b.length === 1 ? b[0].text : b; };

await withHarness(async (app) => {
  await seed(app);
  await open(app, 'pe-1');
  await drawer(app); await tab(app, 'plan');
  const closed = await app.evalJs(BOX);
  await sheet(app, true);
  await drawer(app); await tab(app, 'plan');
  const s0 = await app.evalJs(STORE), k0 = await app.evalJs(KEYS);
  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__peMark = 1; " + PAGE);
  const box0 = await app.evalJs(BOX);
  ok('PE1 the Plan tab holds a checkbox "Include the Plan in what goes out", unticked, only while the sheet is open',
    closed === null && !!box0 && box0.checked === false && box0.disabled === false && /Include the Plan/.test(box0.text), { closed, box0 });

  const off = await exportMd(app);
  await app.evalJs(press('[data-plan-include] input[type=checkbox]')); await sleep(400);
  const on = await exportMd(app);
  const box1 = await app.evalJs(BOX);
  await app.evalJs(press('[data-plan-include] input[type=checkbox]')); await sleep(400);
  const off2 = await exportMd(app);
  ok('PE2 unticked the Markdown file is as today; ticked it carries "## Plan" and the three rows, numbered, in her order, before the Parts; unticked again it is as today',
    off === AS_TODAY && on === WANT_MD && !!box1 && box1.checked === true && off2 === AS_TODAY, { off, on, box1, off2 });

  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__peMark");
  const tickSel = '[data-plan-include] input[type=checkbox]';
  const flushed = async () => { await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(300); };
  await flushed();
  const dsAfterUntick = await app.evalJs(DS);
  await app.evalJs(press(tickSel)); await sleep(400); await flushed();
  const dsOn = await app.evalJs(DS);
  const s1 = await app.evalJs(STORE), k1 = await app.evalJs(KEYS);
  await sheet(app, false); await sheet(app, true);
  await drawer(app); await tab(app, 'plan');
  const remembered = await app.evalJs(BOX);
  await app.evalJs(press(tickSel)); await sleep(400); await flushed();
  const dsEnd = await app.evalJs(DS);
  // ORIGINAL, SUPERSEDED (kept verbatim):
  // ok('PE3 the tick is the view\'s own state: ticking and exporting store nothing (entries and projects byte-identical, no new key), and closing the sheet clears it',
  //   JSON.stringify(s0) === JSON.stringify(s1) && JSON.stringify(k0) === JSON.stringify(k1) && !!cleared && cleared.checked === false, { storeSame: JSON.stringify(s0) === JSON.stringify(s1), keysSame: JSON.stringify(k0) === JSON.stringify(k1), cleared });
  ok('PE3 the tick is remembered per Doc: ticking stores exactly { export: { includePlan: true } } on the Doc\'s record and no entry changes (no new key); closing the sheet and opening it again finds it ticked; unticking leaves docSettings {} (never null)',
    JSON.stringify(dsAfterUntick) === '{}' && JSON.stringify(dsOn) === JSON.stringify({ export: { includePlan: true } }) && JSON.stringify(s0[0]) === JSON.stringify(s1[0]) && JSON.stringify(k0) === JSON.stringify(k1)
    && !!remembered && remembered.checked === true && JSON.stringify(dsEnd) === '{}' && !JSON.stringify(dsEnd).includes('null'), { dsAfterUntick, dsOn, entriesSame: JSON.stringify(s0[0]) === JSON.stringify(s1[0]), keysSame: JSON.stringify(k0) === JSON.stringify(k1), remembered, dsEnd });

  const geo = { w1366: mark === after && same };
  await open(app, 'pe-1', 1920);
  await sheet(app, true); await drawer(app); await tab(app, 'plan');
  const m2 = await app.evalJs(PAGE);
  await app.evalJs(press('[data-plan-include] input[type=checkbox]')); await sleep(300);
  await exportMd(app);
  geo.w1920 = m2 === (await app.evalJs(PAGE));
  ok('PE4 PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after the tick and the export; the editor is the same node', geo.w1366 && geo.w1920, { geo, mark, after, m2 });

  await open(app, 'pe-2');
  await sheet(app, true); await drawer(app); await tab(app, 'plan');
  const none = await app.evalJs(BOX);
  const file = await exportMd(app);
  ok('PE5 a page with no board: the checkbox is there but disabled, and says there is nothing to include; no Plan is added to a file',
    !!none && none.disabled === true && /nothing/i.test(none.text) && file === AS_TODAY, { none, file });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 5;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-PLAN-EXPORT-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-PLAN-EXPORT-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
