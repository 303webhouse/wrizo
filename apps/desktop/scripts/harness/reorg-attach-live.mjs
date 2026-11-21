// ATTACH ASSETS TO WHAT GOES OUT, IN THE APP (reorg-plan-v2, INK queue item 5b; the stage menus, A4: "Assets can be attached to the exported Doc, but only if she chooses, never by default. It sits here, in the Back menu", Nick).
// Machina, ?reorg=1, a Page of a made Doc, the publishing sheet open. The text's half is reorg-attach-unit.mjs (and the Before You Export count, reorg-bx-unit.mjs); this proves what only the app can.
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": two pages -> two Parts, at-1 "Opening" and at-2 "Close"; the Doc's own assets (POLISH's docSettings `assets`, through window.wrizoDocSettings.addAsset), in this order:
//   a page "Field notes" (at-note), a board "Source board" (at-board, cards Alpha and Beta), and ONE CARD of that board, "Alpha" (at-board + c1).
//   AT1  the Assets tab holds the list "Attach to what goes out" only while the sheet is open (none with it closed); it lists the three assets in the order they joined the Doc, and NONE is ticked (never by default)
//   AT2  nothing ticked: the Markdown file is as today (no Assets); tick the page: the file carries "## Assets", "### Field notes" and its words, AFTER the Parts; untick it: as today again
//   AT3  the card goes out as itself (its own words, not the whole board); the board goes out whole; ticked together they go out in the order they joined the Doc, not the order she ticked them
//   AT4  Before You Export reminds her what is going out: "1 Asset attached", then "3 Assets attached", and nothing while none is ticked; it never counts as something in the way
// SUPERSEDED, kept verbatim (Fable, Nov 21, 1:15 pm: the ticks are remembered per Doc, like Include the Plan, so they are no longer session-only and do store one thing):
//   AT5  the ticks are the sheet's own state: ticking and exporting store NOTHING (every entry and the Doc's record byte-identical, no new localStorage key), and closing the sheet and opening it again finds none ticked
//   AT5  the ticks are REMEMBERED per Doc: ticking stores exactly { export: { attach: [the keys, in the order the list shows them] } } on the Doc's own record (the assets key beside it untouched) and no entry changes (no new
//        localStorage key); closing the sheet and opening it again finds them ticked; unticking the last leaves no attach key (never [] and never null)
//   AT6  PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after the ticks and the export; the editor is the same node
//   AT7  an asset that is gone is not offered and not attached (the card tombstoned on its board); a page ticked earlier is still ticked on the next opening; and with the switch off, or in a theme where the reorg is not drawn, no list stands
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-attach-live.mjs
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
const EXP = "(() => { const p = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').find((x) => x.title === 'Brief'); const d = p && p.docSettings ? p.docSettings : {}; return { export: d.export === undefined ? 'absent' : d.export, assets: Array.isArray(d.assets) ? d.assets.length : 'absent' }; })()";
const CATCH = "(() => { window.__pbBlobs = []; const B = window.__pbRealBlob || (window.__pbRealBlob = window.Blob); window.Blob = function (parts, o) { window.__pbBlobs.push({ text: parts.join(''), type: o && o.type, name: null }); return new B(parts, o); }; window.Blob.prototype = B.prototype; HTMLAnchorElement.prototype.click = function () { const l = window.__pbBlobs[window.__pbBlobs.length - 1]; if (l && !l.name) l.name = this.download; }; return true; })()";
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const LIST = "(() => { const l = document.querySelector('[data-attach-list]'); if (!l) return null; return [...l.querySelectorAll('[data-attach]')].map((r) => ({ key: r.getAttribute('data-attach'), title: (r.textContent || '').trim(), on: !!r.querySelector('input').checked })); })()";
const BXLINE = "(() => { const b = document.querySelector('[data-bx-attached]'); return b ? (b.textContent || '').trim() : null; })()";
const BXBLOCK = "(() => !!document.querySelector('[data-back-export] [data-bx-block]'))()";
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
    page('at-note', 'Field notes\\nThe rain came late.', { origin: 'loose' });
    page('at-board', 'Source board', { origin: 'loose', pageType: 'board', boxes: ${q([card('c1', 'Alpha', 0, 0.05), card('c2', 'Beta', 1, 0.2)])} });
    page('at-1', 'Opening words.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('at-2', 'Closing words.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    W.wrizoPatchEntry('at-1', { pageSettings: ${PS}, name: 'Opening', level: 0 } });
    W.wrizoPatchEntry('at-2', { pageSettings: ${PS}, name: 'Close', level: 0 } });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, w = 1366, query = 'reorg=1&arbor2=0', theme = 'machina') {
  await app.emulateDpr(1, w, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '/?${query}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
// the Doc's own assets, through the product's seam (window.wrizoDocSettings is there only under ?reorg=1), then flushed before anything reloads
const addAssets = async (app) => {
  await app.evalJs("(() => { const D = window.wrizoDocSettings; D.addAsset('at-1', { entryId: 'at-note' }); D.addAsset('at-1', { entryId: 'at-board' }); D.addAsset('at-1', { entryId: 'at-board', boxId: 'c1' }); window.wrizoFlushNow(); return null; })()");
  await sleep(500);
};
const sheet = async (app, on) => { await app.evalJs(on ? press('.reorg-top .desk-mode-tab[data-mode-key="publish"]') : press('[data-pub-back]')); await sleep(500); };
const drawer = async (app) => { if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); } };
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-tutor-tab-${id}')?.click(); null`); await sleep(450); };
const exportMd = async (app) => { await app.evalJs(CATCH); await app.evalJs('window.__pbBlobs.length = 0; null'); await app.evalJs(press('[data-pub-export="md"]')); await sleep(300); const b = await app.evalJs('window.__pbBlobs'); return b.length === 1 ? b[0].text : b; };
const tickBy = (key) => press(`[data-attach="${key}"] input[type=checkbox]`);
const K_NOTE = 'at-note|', K_BOARD = 'at-board|', K_CARD = 'at-board|c1';

await withHarness(async (app) => {
  await seed(app);
  await open(app, 'at-1');
  await addAssets(app);
  await drawer(app); await tab(app, 'links');
  const closed = await app.evalJs(LIST);
  await sheet(app, true);
  await drawer(app); await tab(app, 'links');
  const l0 = await app.evalJs(LIST);
  ok('AT1 the Assets tab holds "Attach to what goes out" only while the sheet is open; it lists the three assets in the order they joined the Doc, and none is ticked',
    closed === null && Array.isArray(l0) && l0.length === 3 && l0.map((r) => r.key).join(',') === [K_NOTE, K_BOARD, K_CARD].join(',')
    && l0.map((r) => r.title).join('|') === 'Field notes|Source board|Alpha' && l0.every((r) => r.on === false), { closed, l0 });

  const s0 = await app.evalJs(STORE), k0 = await app.evalJs(KEYS);
  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__atMark = 1; " + PAGE);
  const off = await exportMd(app);
  await app.evalJs(tickBy(K_NOTE)); await sleep(300);
  const withNote = await exportMd(app);
  await app.evalJs(tickBy(K_NOTE)); await sleep(300);
  const off2 = await exportMd(app);
  ok('AT2 nothing ticked: the Markdown file is as today; the page ticked: it carries "## Assets", "### Field notes" and its words AFTER the Parts; unticked again: as today',
    off === AS_TODAY && typeof withNote === 'string' && withNote.startsWith(AS_TODAY + '\n## Assets\n\n### Field notes\n\n') && withNote.includes('The rain came late.') && !withNote.includes('Alpha') && off2 === AS_TODAY, { off, withNote, off2 });

  await app.evalJs(tickBy(K_CARD)); await sleep(250);
  const cardOnly = await exportMd(app);
  await app.evalJs(tickBy(K_CARD)); await sleep(250);
  await app.evalJs(tickBy(K_BOARD)); await sleep(250);
  const boardOnly = await exportMd(app);
  await app.evalJs(tickBy(K_BOARD)); await sleep(250);
  // ticked in the OPPOSITE order to the one they joined the Doc in
  await app.evalJs(tickBy(K_CARD)); await sleep(200); await app.evalJs(tickBy(K_NOTE)); await sleep(250);
  const both = await exportMd(app);
  const iNote = typeof both === 'string' ? both.indexOf('### Field notes') : -1, iCard = typeof both === 'string' ? both.indexOf('### Alpha') : -1;
  ok('AT3 the card goes out as itself (its own words, not the whole board), the board goes out whole, and ticked together they go out in the order they joined the Doc',
    typeof cardOnly === 'string' && cardOnly.includes('### Alpha') && !cardOnly.includes('Beta') && !cardOnly.includes('### Source board')
    && typeof boardOnly === 'string' && boardOnly.includes('### Source board') && boardOnly.includes('Alpha') && boardOnly.includes('Beta')
    && iNote > 0 && iCard > iNote, { cardOnly, boardOnly, both, iNote, iCard });

  // BEFORE YOU EXPORT: the reminder (both ticked now: the page and the card)
  await tab(app, 'export');
  const two = await app.evalJs(BXLINE), blocked2 = await app.evalJs(BXBLOCK);
  await tab(app, 'links');
  await app.evalJs(tickBy(K_BOARD)); await sleep(250);
  await tab(app, 'export');
  const three = await app.evalJs(BXLINE);
  await tab(app, 'links');
  for (const k of [K_NOTE, K_BOARD, K_CARD]) { await app.evalJs(tickBy(k)); await sleep(150); }
  await tab(app, 'export');
  const none = await app.evalJs(BXLINE);
  ok('AT4 Before You Export reminds her what is going out: "2 Assets attached", then "3 Assets attached", and nothing while none is ticked; it is never something in the way',
    /^2 Assets attached$/.test(two || '') && /^3 Assets attached$/.test(three || '') && none === null && blocked2 === false, { two, three, none, blocked2 });

  // ORIGINAL AT5, SUPERSEDED (Nov 21, 1:15 pm), kept verbatim:
  //   await tab(app, 'links');
  //   await app.evalJs(tickBy(K_NOTE)); await sleep(250);
  //   await exportMd(app);
  //   const s1 = await app.evalJs(STORE), k1 = await app.evalJs(KEYS);
  //   await app.evalJs(tickBy(K_NOTE)); await sleep(150);
  //   await app.evalJs(tickBy(K_BOARD)); await sleep(250);
  //   await sheet(app, false); await sheet(app, true);
  //   await drawer(app); await tab(app, 'links');
  //   const reopened = await app.evalJs(LIST);
  //   ok('AT5 the ticks are the sheet\'s own state: ticking and exporting store nothing (entries and projects byte-identical, no new key), and closing the sheet and opening it again finds none ticked',
  //     JSON.stringify(s0) === JSON.stringify(s1) && JSON.stringify(k0) === JSON.stringify(k1) && Array.isArray(reopened) && reopened.length === 3 && reopened.every((r) => r.on === false),
  //     { storeSame: JSON.stringify(s0) === JSON.stringify(s1), keysSame: JSON.stringify(k0) === JSON.stringify(k1), reopened });


  const flushed = async () => { await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(350); };
  await tab(app, 'links');
  await app.evalJs(tickBy(K_NOTE)); await sleep(250);
  await exportMd(app); await flushed();
  const ex1 = await app.evalJs(EXP);
  const s1 = await app.evalJs(STORE), k1 = await app.evalJs(KEYS);
  await app.evalJs(tickBy(K_BOARD)); await sleep(250); await flushed();
  const ex2 = await app.evalJs(EXP);
  await sheet(app, false); await sheet(app, true);
  await drawer(app); await tab(app, 'links');
  const reopened = await app.evalJs(LIST);
  await app.evalJs(tickBy(K_NOTE)); await sleep(200); await app.evalJs(tickBy(K_BOARD)); await sleep(250); await flushed();
  const ex3 = await app.evalJs(EXP);
  const dump = JSON.stringify(ex3);
  ok('AT5 the ticks are REMEMBERED per Doc: ticking stores exactly { export: { attach: [...] } } in the list\'s order on the Doc\'s record (assets untouched) and no entry changes (no new key); closing the sheet and opening it again finds them ticked; unticking the last leaves no attach key (never [] and never null)',
    JSON.stringify(ex1) === JSON.stringify({ export: { attach: [K_NOTE] }, assets: 3 }) && JSON.stringify(ex2) === JSON.stringify({ export: { attach: [K_NOTE, K_BOARD] }, assets: 3 })
    && JSON.stringify(s0[0]) === JSON.stringify(s1[0]) && JSON.stringify(k0) === JSON.stringify(k1)
    && Array.isArray(reopened) && reopened.map((r) => r.on).join(',') === 'true,true,false'
    && ex3.export === 'absent' && ex3.assets === 3 && !dump.includes('null') && !dump.includes('[]'),
    { ex1, ex2, ex3, entriesSame: JSON.stringify(s0[0]) === JSON.stringify(s1[0]), keysSame: JSON.stringify(k0) === JSON.stringify(k1), reopened });

  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__atMark");
  const geo = { w1366: mark === after && same };
  await open(app, 'at-1', 1920);
  await sheet(app, true); await drawer(app); await tab(app, 'links');
  const m2 = await app.evalJs(PAGE);
  await app.evalJs(tickBy(K_NOTE)); await sleep(300);
  await exportMd(app);
  geo.w1920 = m2 === (await app.evalJs(PAGE));
  ok('AT6 PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after the ticks and the export; the editor is the same node', geo.w1366 && geo.w1920, { geo, mark, after, m2 });

  // a card gone from its board is neither offered nor attached: tombstone c1 through the entry seam (deletedAt stamps it in place), then read the list again
  await app.evalJs("(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === 'at-board'); window.wrizoPatchEntry('at-board', { boxes: (e.boxes || []).map((b) => b.id === 'c1' ? { ...b, deletedAt: '2026-04-02T00:00:00.000Z' } : b) }); window.wrizoFlushNow(); return null; })()");
  await sleep(500);
  await open(app, 'at-1');
  await sheet(app, true); await drawer(app); await tab(app, 'links');
  const gone = await app.evalJs(LIST);
  // the page ticked in AT6 is remembered: it is already ticked on this opening (nothing to press)
  const goneFile = await exportMd(app);
  await open(app, 'at-1', 1366, 'arbor2=0');
  const switchOff = await app.evalJs("document.querySelector('[data-attach-list]') === null && document.querySelector('[data-reorg-pub]') === null");
  await open(app, 'at-1', 1366, 'reorg=1&arbor2=0', 'plateau');
  const plateau = await app.evalJs("document.querySelector('[data-attach-list]') === null");
  ok('AT7 an asset that is gone (the card tombstoned on its board) is not offered and not attached; with the switch off, or in a theme that does not draw the reorg, no list stands',
    Array.isArray(gone) && gone.map((r) => r.key).join(',') === [K_NOTE, K_BOARD].join(',') && typeof goneFile === 'string' && goneFile.includes('### Field notes') && !goneFile.includes('### Alpha')
    && switchOff === true && plateau === true, { gone, goneFile, switchOff, plateau });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 7;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ATTACH-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ATTACH-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
