// THE LINK BADGE OPENS ASSETS AT ITS PART (the Team B restyle's Decision 2; Fable, Nov 20 9:45 pm: "it opens Assets at that Part; cover the
// case where Assets is already open, as ARBOR flagged"). A Part row's link badge (the count of its assets, ARBOR's restyle) is a button:
// pressed, the right drawer opens on ASSETS with that Part's group open and scrolled into view. Three ways in: the tab not drawn (FEEDBACK
// chosen, the Assets list mounts fresh), the tab drawn and open beside the Parts tab, and the tab drawn while the drawer is shut. The ask is
// held in memory for the moment of the press: nothing is saved. Machina, ?reorg=1.
//
// The fixture (seams only): a set "Novel", Parts wb-1..wb-3; wb-1 links forty docs (a list long enough that wb-2's group sits below the
// drawer's fold while wb-1's is open); wb-2 links the board wb-y whole (one asset); wb-3 none. She is on wb-1.
//
// BUTTON  B1  wb-2's badge is a button (type=button) that a press can reach (elementFromPoint finds it), keeping its words ("1 asset")
// FRESH   B2  from FEEDBACK with the drawer shut: pressing wb-2's badge opens the drawer on ASSETS with her Part (wb-1) and wb-2 open, wb-2's
//             group drawing the Y board's head, its head in the drawer's view (it was below the fold)
// OPEN    B3  with ASSETS open beside the Parts tab (only wb-1 open, wb-2 below the fold): the same press opens wb-2 in the SAME list (its node
//             kept: the case is the mounted one), wb-1 stays open, and wb-2's head is brought into view
// SHUT    B4  with ASSETS chosen but the drawer shut (the list still mounted, wb-2 closed again): the press opens the drawer and wb-2 in the
//             same list
// PAGE    P1  the page's rects and editor node are the same across B2's press (the press having landed)
// SOURCE  S1  the ask lives in reorg/backMenu/assetsFocus.ts and touches no storage
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-badge.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

// the Desk's bootstrap mints the Top Drawer the seed waits on (runtime-verify blocks it unless WS_PLACE=1, as reorg-b-assets does)
process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const LINKED = 40;
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const txt = (el) => `((${el})?.textContent || '').replace(/\\s+/g, ' ').trim()`;

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  return app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction');
    const novel = W.wrizoCreateProject('Novel'); W.wrizoSetProjectDrawer(novel.id, drawer.id);
    page('wb-y', 'Y board', { origin: 'loose', pageType: 'board', boxes: [] });
    page('wb-1', 'Chapter one', { origin: 'project', projectId: novel.id, orderIndex: 0 });
    page('wb-2', 'Chapter two', { origin: 'project', projectId: novel.id, orderIndex: 1 });
    page('wb-3', 'Chapter three', { origin: 'project', projectId: novel.id, orderIndex: 2 });
    let linked = 0;
    for (let i = 0; i < ${LINKED}; i++) { page('wb-d' + i, 'Linked doc ' + i, { origin: 'loose' }); if (W.wrizoAddPageLink('wb-1', { bEntryId: 'wb-d' + i })) linked++; }
    const l2 = W.wrizoAddPageLink('wb-2', { bEntryId: 'wb-y' });
    W.wrizoFlushNow();
    return { linked, l2: !!l2 };
  })()`);
}

// the page in BUILD, the Tutor drawer open on ASSETS, the Sliver open on PARTS (both stand at 1920 where they fit; the checks read what is drawn)
async function openBuild(app, id) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip') && !!document.querySelector('.wz-sliver-grip')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await app.waitFor("document.querySelector('.reorg-top [data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')", { timeout: 6000, label: 'BUILD' }).catch(() => {});
  await sleep(900);
}
const tutorOpen = "document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'";
async function openTutor(app, tab) {
  if (!(await app.evalJs(tutorOpen))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
  await app.evalJs(`document.getElementById('wz-tutor-tab-${tab}')?.click(); null`); await sleep(400);
}
async function shutTutor(app) {
  if (await app.evalJs(tutorOpen)) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
}
async function partsTab(app) {
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(400);
}
async function pressBadge(app, id) {
  await app.evalJs(`document.querySelector('.wz-sliver [data-reorg-parts] [data-part-assets="${id}"]')?.click(); null`); await sleep(900);
}
const GROUPS = `(() => [...document.querySelectorAll('[data-assets-part]')].map((g) => { const h = g.querySelector('[data-assets-part-toggle]');
  return { id: g.getAttribute('data-assets-part'), expanded: h ? h.getAttribute('aria-expanded') : null,
    heads: [...g.querySelectorAll('[data-back-board]')].map((b) => b.getAttribute('data-back-board')) }; }))()`;
// is a Part's group head inside its scroller's view? (the scroller: the nearest ancestor that scrolls and has more than it shows)
const VIEW = (id) => `(() => { const s = document.querySelector('[data-assets-part="${id}"]'); const h = s && s.querySelector('[data-assets-part-toggle]'); if (!h) return null;
  let sc = s.parentElement; while (sc && !(/auto|scroll/.test(getComputedStyle(sc).overflowY) && sc.scrollHeight > sc.clientHeight + 4)) sc = sc.parentElement;
  if (!sc) return { scroller: false };
  const a = h.getBoundingClientRect(), b = sc.getBoundingClientRect();
  return { scroller: true, cls: String(sc.className).slice(0, 40), top: Math.round(sc.scrollTop), inView: a.top >= b.top - 1 && a.bottom <= b.bottom + 1 }; })()`;
const STATE = `(() => ({ open: ${tutorOpen}, tab: document.getElementById('wz-tutor-tab-links')?.getAttribute('aria-selected') ?? null,
  marked: !!(document.querySelector('[data-back-parts]') || {}).__bgMark }))()`;
const mark = "(() => { const n = document.querySelector('[data-back-parts]'); if (n) n.__bgMark = 1; return !!n; })()";
const groupOf = (gs, id) => (gs || []).find((g) => g.id === id) || null;

await withHarness(async (app) => {
  const ids = await seed(app);
  await openBuild(app, 'wb-1');
  await partsTab(app);

  // ---- BUTTON ----------------------------------------------------------------------------------------------------------------------------
  const b1 = await app.evalJs(`(() => { const b = document.querySelector('.wz-sliver [data-reorg-parts] [data-part-assets="wb-2"]'); if (!b) return null;
    const r = b.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { tag: b.tagName, type: b.getAttribute('type'), label: b.getAttribute('aria-label'), words: ${txt('b')}, reach: !!hit && (hit === b || b.contains(hit)) }; })()`);
  ok('B1 wb-2\'s badge is a button (type=button) a press can reach, keeping its words ("1 asset")',
    !!b1 && b1.tag === 'BUTTON' && b1.type === 'button' && b1.reach && b1.label === '1 asset' && /\b1\b/.test(b1.words), { b1, ids });

  // ---- FRESH: FEEDBACK chosen, the drawer shut ----------------------------------------------------------------------------------------------
  const r0 = await app.evalJs(PAGE);
  await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__bgEd = 1; return null; })()");
  await openTutor(app, 'tutor'); await shutTutor(app); await partsTab(app);
  const pre2 = await app.evalJs(`(() => ({ open: ${tutorOpen}, list: !!document.querySelector('[data-back-parts]') }))()`);
  await pressBadge(app, 'wb-2');
  const s2 = await app.evalJs(STATE), g2 = await app.evalJs(GROUPS), v2 = await app.evalJs(VIEW('wb-2'));
  const r1 = await app.evalJs(PAGE);
  const same = await app.evalJs("!!(document.querySelector('.forward-only-editor') || {}).__bgEd");
  const w1b2 = groupOf(g2, 'wb-1'), w2b2 = groupOf(g2, 'wb-2');
  const landed2 = !!w2b2 && w2b2.expanded === 'true';
  ok('B2 from FEEDBACK with the drawer shut: the press opens the drawer on ASSETS with wb-1 and wb-2 open, wb-2 drawing the Y board, its head in view',
    ids.linked === LINKED && ids.l2 && !pre2.open && !pre2.list && s2.open && s2.tab === 'true' && !!w1b2 && w1b2.expanded === 'true'
      && landed2 && w2b2.heads.includes('wb-y') && !!v2 && v2.scroller && v2.inView, { pre2, s2, g2, v2 });

  // ---- OPEN: ASSETS open beside the Parts tab -------------------------------------------------------------------------------------------
  await openBuild(app, 'wb-1');
  await openTutor(app, 'links'); await partsTab(app);
  const g3a = await app.evalJs(GROUPS), v3a = await app.evalJs(VIEW('wb-2')), marked = await app.evalJs(mark);
  await pressBadge(app, 'wb-2');
  const s3 = await app.evalJs(STATE), g3 = await app.evalJs(GROUPS), v3 = await app.evalJs(VIEW('wb-2'));
  const w2b3a = groupOf(g3a, 'wb-2'), w1b3 = groupOf(g3, 'wb-1'), w2b3 = groupOf(g3, 'wb-2');
  ok('B3 with ASSETS open beside the Parts tab (wb-2 closed, below the fold): the press opens wb-2 in the SAME list, wb-1 stays open, wb-2\'s head brought into view',
    marked && !!w2b3a && w2b3a.expanded === 'false' && !!v3a && v3a.inView === false && s3.marked && s3.open && s3.tab === 'true'
      && !!w1b3 && w1b3.expanded === 'true' && !!w2b3 && w2b3.expanded === 'true' && w2b3.heads.includes('wb-y') && !!v3 && v3.scroller && v3.inView, { g3a, v3a, marked, s3, g3, v3 });

  // ---- SHUT: ASSETS chosen, the drawer shut, the list still mounted ------------------------------------------------------------------------
  await app.evalJs("document.querySelector('[data-assets-part=\"wb-2\"] [data-assets-part-toggle]')?.click(); null"); await sleep(350);
  await shutTutor(app); await partsTab(app);
  const pre4 = await app.evalJs(STATE), g4a = await app.evalJs(GROUPS);
  await pressBadge(app, 'wb-2');
  const s4 = await app.evalJs(STATE), g4 = await app.evalJs(GROUPS), v4 = await app.evalJs(VIEW('wb-2'));
  const w2b4a = groupOf(g4a, 'wb-2'), w2b4 = groupOf(g4, 'wb-2');
  ok('B4 with ASSETS chosen but the drawer shut (the list mounted, wb-2 closed again): the press opens the drawer and wb-2 in the same list',
    !pre4.open && pre4.marked && !!w2b4a && w2b4a.expanded === 'false' && s4.open && s4.tab === 'true' && s4.marked && !!w2b4 && w2b4.expanded === 'true'
      && !!v4 && v4.scroller && v4.inView, { pre4, g4a, s4, g4, v4 });

  // ---- PAGE ------------------------------------------------------------------------------------------------------------------------------
  // r0/r1 and the editor's mark straddle B2's press (one load: B3 and B4 reload the page)
  ok('P1 the page\'s rects are the same across the badge\'s press (the press having landed), the editor node kept through B2\'s',
    landed2 && r0 === r1 && !!r0 && same, { r0, r1, same });
});

// ---- SOURCE ----------------------------------------------------------------------------------------------------------------------------
{
  const f = path.join(SRC, 'reorg', 'backMenu', 'assetsFocus.ts');
  const s = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '') : null;
  ok('S1 the ask lives in reorg/backMenu/assetsFocus.ts and touches no storage', s != null && /export function focusAssetsPart\(/.test(s) && !/localStorage|sessionStorage|indexedDB|save[A-Z]\w*\(|persistence/.test(s), { exists: s != null });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 6;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-BADGE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-BADGE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
