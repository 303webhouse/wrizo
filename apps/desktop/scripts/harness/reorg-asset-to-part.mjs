// AN ASSET ONTO A PART (reorg plan 5.2, first slice; Fable's GO, Nov 20, 7:55 am "CONNECTIONS behind ?reorg=1"; 11:30 am "(3) The drag through
// graftTo with its date: right"). Machina only, behind ?reorg=1. She drags a row of the Back menu's Assets tab (a card, a board, a doc) onto a Part
// in the Front menu's Parts tab, or presses the row's "→ Part" and picks the Part: the asset is then connected to THAT Part.
//
// The write is the store's own graftTo with the Part as the subject: ONE PageLink (types/records.ts, the record that already rides the entry's
// page_links jsonb to the account, createdAt = the date the connection was made; schema change none, no new key), owned by the Part. Nothing
// else is written: no text, no box, no card, no board.
//
// The fixture (seeded through the app's own seams; WS_PLACE=1): a set she made, "Novel", in a Drawer: three Parts in her order, "Chapter one"
// (ap-1, the Part she is on, whose plan board is ap-own), "Chapter two" (ap-2), "Chapter three" (ap-3). ap-1 links a card of board ap-x (x1),
// the whole board ap-y and the doc ap-q.
//
// PREMISE D0  at 1920 both drawers stand open on ap-1: the Parts tab lists the three Parts (ap-1 here), the Assets tab lists x1, ap-y's head and
//             ap-q; every asset row and board head is draggable, every Part row is not
// DRAG   D1  dragging x1 onto "Chapter two" stores ONE new live PageLink on ap-2's own record { aEntryId ap-2, bEntryId ap-x, bBoxId x1 }, with
//            id, createdAt and updatedAt; nothing else stored changes but ap-2's stamp and its set's resume pointer; every text and box identical;
//            the drag carried the asset type and no text/plain (so a drop on the page can never type it)
//        D2  the Parts tab says so (role status) with Undo, naming the card and the Part; the page's column, paper and editor rects and the editor
//            node are the same before and after
//        D3  the same drop again writes nothing and says it is already connected
//        D4  a drop on the Part she is on writes nothing and says it is already connected (everything in her Assets tab already is)
//        D5  a drag that is not an asset (text/plain only) is not taken by a Part row (dragover not accepted) and its drop writes nothing
//        D6  Undo on the line takes the connection back (the record's deletedAt is set; no live link left on ap-2)
// KEYS   K1  each asset row and board head has a "→ Part" button; pressed, it lists the OTHER Parts in her order ("Chapter two", "Chapter three")
//            with aria-expanded true; Escape closes it and gives the focus back to the button
//        K2  picking "Chapter three" from ap-y's head stores ONE live PageLink on ap-3 { bEntryId ap-y, no box }; the Assets tab's line names both,
//            with Undo
//        K3  Undo takes it back (no live link left on ap-3)
// KEPT   R1  dragged again and reloaded: ap-2's record still holds the live link to x1, and on ap-2 the Assets tab lists "Xcard one"
// OFF    O1  switch off, Machina, the same page: no Parts tab, no "→ Part", and no row of the links pane is draggable
// WORDS  W1  every new word is a lexicon key (terms.ts, the canonical table, used in the source)
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-asset-to-part.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

const COLLECTIONS = "(() => { const out = {}; for (const k of ['writer-studio-projects', 'writer-studio-story-plans', 'writer-studio-sessions', 'writer-studio-drafts', 'writer-studio-journal-entries', 'writer-studio-drawers']) { if (localStorage.getItem(k) == null) continue; try { out[k] = JSON.parse(localStorage.getItem(k)); } catch { out[k] = localStorage.getItem(k); } } return out; })()";
function diffStores(a, b) {
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k], y = b[k];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    if (!Array.isArray(x) || !Array.isArray(y)) { out.push([k, '*', ['(whole value)']]); continue; }
    const byId = (arr) => new Map(arr.map((r) => [r && r.id, r]));
    const mx = byId(x), my = byId(y);
    for (const id of new Set([...mx.keys(), ...my.keys()])) {
      const r1 = mx.get(id), r2 = my.get(id);
      if (JSON.stringify(r1) === JSON.stringify(r2)) continue;
      if (!r1 || !r2) { out.push([k, id, [r1 ? '(removed)' : '(added)']]); continue; }
      out.push([k, id, [...new Set([...Object.keys(r1), ...Object.keys(r2)])].filter((kk) => JSON.stringify(r1[kk]) !== JSON.stringify(r2[kk]))]);
    }
  }
  return out;
}
// the owner's record (pageLinks + its stamp) and, at most, its set's F1 resume pointer (persistence/journal.ts stampPageActivity) - nothing else
const onlyLinked = (d, after, ownerId) => {
  const ent = d.filter((x) => x[0] === 'writer-studio-journal-entries');
  const rest = d.filter((x) => x[0] !== 'writer-studio-journal-entries');
  const owner = (after['writer-studio-journal-entries'] || []).find((e) => e.id === ownerId);
  const set = owner && owner.projectId ? (after['writer-studio-projects'] || []).find((p) => p.id === owner.projectId) : null;
  return ent.length === 1 && ent[0][1] === ownerId && ent[0][2].includes('pageLinks') && ent[0][2].every((k) => k === 'pageLinks' || k === 'updatedAt')
    && rest.every((x) => x[0] === 'writer-studio-projects' && !!set && x[1] === set.id && x[2].every((k) => ['updatedAt', 'lastActivityAt', 'lastActivityType', 'lastActivePageId'].includes(k)));
};
const words = (st) => Object.fromEntries((st['writer-studio-journal-entries'] || []).map((e) => [e.id, JSON.stringify([e.text ?? null, e.boxes ?? null, e.script ?? null])]));
const linksOf = (st, id) => (((st['writer-studio-journal-entries'] || []).find((e) => e.id === id) || {}).pageLinks || []);
const liveLinks = (st, id) => linksOf(st, id).filter((l) => !l.deletedAt);
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });

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
    page('ap-own', 'Own board', { origin: 'loose', pageType: 'board', boxes: ${q([card('a1', 'Alpha', 0, 0.05), card('a2', 'Beta', 1, 0.2)])} });
    page('ap-x', 'X board', { origin: 'loose', pageType: 'board', boxes: ${q([card('x1', 'Xcard one', 0, 0.05), card('x2', 'Xcard two', 1, 0.2)])} });
    page('ap-y', 'Y board', { origin: 'loose', pageType: 'board', boxes: [] });
    page('ap-q', 'A linked doc', { origin: 'loose' });
    page('ap-1', 'Chapter one', { origin: 'project', projectId: novel.id, orderIndex: 0 });
    page('ap-2', 'Chapter two', { origin: 'project', projectId: novel.id, orderIndex: 1 });
    page('ap-3', 'Chapter three', { origin: 'project', projectId: novel.id, orderIndex: 2 });
    W.wrizoPatchEntry('ap-1', { planBoardId: 'ap-own' });
    const l1 = W.wrizoAddPageLink('ap-1', { bEntryId: 'ap-x', bBoxId: 'x1' });
    const l2 = W.wrizoAddPageLink('ap-1', { bEntryId: 'ap-y' });
    const l3 = W.wrizoAddPageLink('ap-1', { bEntryId: 'ap-q' });
    W.wrizoFlushNow();
    return { novel: novel.id, drawer: drawer.id, links: !!(l1 && l2 && l3) };
  })()`);
}

async function openPage(app, id, { reorg = true } = {}) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip') && !!document.querySelector('.wz-sliver-grip')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  // the Back menu (right) first, then the Front menu (left): both stand open at 1920
  if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-tutor-tab-links')?.click(); null"); await sleep(350);
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(400);
}

const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const STATE = `(() => ({
  tools: document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true',
  back: document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true',
  parts: [...document.querySelectorAll('.wz-sliver [data-reorg-parts] [data-part-row]')].map((b) => ({ id: b.getAttribute('data-part-row'), name: (b.querySelector('.reorg-parts-name')?.textContent || '').trim(), here: b.getAttribute('aria-current') === 'true', drag: b.getAttribute('draggable') })),
  assets: [...document.querySelectorAll('[data-back-assets] [data-back-asset]')].map((li) => ({ entry: li.getAttribute('data-graft-entry'), box: li.getAttribute('data-graft-box'), title: (li.querySelector('.wz-graft-title')?.textContent || '').trim(), drag: li.getAttribute('draggable'), toPart: !!li.querySelector('[data-to-part]') })),
  heads: [...document.querySelectorAll('[data-back-assets] [data-back-board]')].map((g) => { const h = g.querySelector('.wz-back-boardhead'); return { board: g.getAttribute('data-back-board'), drag: h?.getAttribute('draggable') ?? null, toPart: !!h?.querySelector('[data-to-part]') }; }),
}))()`;
// a drag the way the browser hands it to the app: dragstart on the source fills a DataTransfer, dragover / drop on the target read it
const drag = (srcSel, partId) => `(() => {
  const src = document.querySelector(${q(srcSel)}); const tgt = document.querySelector('.wz-sliver [data-part-row=' + ${q(q(partId))} + ']');
  if (!src || !tgt) return { src: !!src, tgt: !!tgt };
  const dt = new DataTransfer();
  src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
  const types = [...dt.types];
  const over = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }); tgt.dispatchEvent(over);
  tgt.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  src.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
  return { src: true, tgt: true, types, accepted: over.defaultPrevented };
})()`;
const foreign = (partId) => `(() => {
  const tgt = document.querySelector('.wz-sliver [data-part-row=' + ${q(q(partId))} + ']'); if (!tgt) return null;
  const dt = new DataTransfer(); dt.setData('text/plain', 'a stray line of text');
  const over = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }); tgt.dispatchEvent(over);
  tgt.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  return { accepted: over.defaultPrevented };
})()`;
const LINE = "(() => { const l = document.querySelector('.wz-sliver [data-reorg-connect-line]'); return l ? { text: (l.querySelector('[data-line-text]')?.textContent || '').trim(), role: l.getAttribute('role'), undo: !!l.querySelector('[data-line-undo]') } : null; })()";
const PANEL_LINE = "(() => { const l = document.querySelector('[data-graft-undo]'); return l ? { text: (l.querySelector('span')?.textContent || '').trim(), undo: !!l.querySelector('button'), role: l.getAttribute('role') } : null; })()";
async function settle(app) { await sleep(300); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400); }
const X1 = '[data-back-assets] [data-back-asset][data-graft-box="x1"]';

await withHarness(async (app) => {
  const ids = await seed(app);

  // ---- PREMISE ---------------------------------------------------------------------------------------------------------------------------
  await openPage(app, 'ap-1');
  const st0 = await app.evalJs(STATE);
  const x1 = st0.assets.find((a) => a.box === 'x1');
  const q1 = st0.assets.find((a) => a.entry === 'ap-q');
  const y = st0.heads.find((h) => h.board === 'ap-y');
  ok('D0 at 1920 both drawers stand open on ap-1: three Parts (ap-1 here), the Assets tab lists x1, ap-y\'s head and ap-q; asset rows and heads draggable, Part rows not',
    ids.links && st0.tools && st0.back && st0.parts.map((p) => p.id).join(',') === 'ap-1,ap-2,ap-3' && st0.parts[0].here && !!x1 && !!q1 && !!y
      && st0.assets.every((a) => a.drag === 'true') && st0.heads.every((h) => h.drag === 'true') && st0.parts.every((p) => p.drag !== 'true'), { ids, st0 });

  // ---- DRAG ------------------------------------------------------------------------------------------------------------------------------
  await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__apMark = 1; return null; })()");
  const r0 = await app.evalJs(PAGE);
  const s0 = await app.evalJs(COLLECTIONS);
  const d1 = await app.evalJs(drag(X1, 'ap-2'));
  await settle(app);
  const s1 = await app.evalJs(COLLECTIONS);
  const diff1 = diffStores(s0, s1);
  const l1 = liveLinks(s1, 'ap-2');
  const rec = l1[0] || {};
  ok('D1 dragging x1 onto "Chapter two" stores ONE live PageLink on ap-2 { bEntryId ap-x, bBoxId x1 } with its date; nothing else but the stamps; texts and boxes identical; asset type, no text/plain',
    d1.accepted && d1.types.includes('application/x-wrizo-asset') && !d1.types.includes('text/plain') && l1.length === 1 && rec.aEntryId === 'ap-2' && rec.bEntryId === 'ap-x' && rec.bBoxId === 'x1' && !('aBoxId' in rec)
      && !!rec.id && !!rec.createdAt && !!rec.updatedAt && onlyLinked(diff1, s1, 'ap-2') && JSON.stringify(words(s0)) === JSON.stringify(words(s1)), { d1, l1, diff1 });
  const line2 = await app.evalJs(LINE);
  const r1 = await app.evalJs(PAGE);
  const same = await app.evalJs("!!(document.querySelector('.forward-only-editor') || {}).__apMark");
  ok('D2 the Parts tab says so (role status, Undo), naming the card and the Part; the page\'s rects and the editor node are the same',
    !!line2 && line2.role === 'status' && line2.undo && line2.text.includes('Xcard one') && line2.text.includes('Chapter two') && r0 === r1 && same, { line2, r0, r1, same });

  const s3a = await app.evalJs(COLLECTIONS);
  await app.evalJs(drag(X1, 'ap-2'));
  await settle(app);
  const s3b = await app.evalJs(COLLECTIONS);
  const line3 = await app.evalJs(LINE);
  ok('D3 the same drop again writes nothing and says it is already connected', diffStores(s3a, s3b).length === 0 && !!line3 && /already/i.test(line3.text) && !line3.undo, { d: diffStores(s3a, s3b), line3 });

  await app.evalJs(drag('[data-back-assets] [data-back-asset][data-graft-entry="ap-q"]', 'ap-1'));
  await settle(app);
  const s4 = await app.evalJs(COLLECTIONS);
  const line4 = await app.evalJs(LINE);
  ok('D4 a drop on the Part she is on writes nothing and says it is already connected', diffStores(s3b, s4).length === 0 && !!line4 && /already/i.test(line4.text) && line4.text.includes('Chapter one'), { d: diffStores(s3b, s4), line4 });

  const f5 = await app.evalJs(foreign('ap-3'));
  await settle(app);
  const s5 = await app.evalJs(COLLECTIONS);
  ok('D5 a drag that is not an asset (text/plain only) is not taken by a Part row and its drop writes nothing', !!f5 && !f5.accepted && diffStores(s4, s5).length === 0, { f5, d: diffStores(s4, s5) });

  // D6: Undo of a made connection (drag again onto ap-3 to get a line with Undo, then press it)
  await app.evalJs(drag(X1, 'ap-3'));
  await settle(app);
  const s6a = await app.evalJs(COLLECTIONS);
  const made6 = liveLinks(s6a, 'ap-3').length;
  await app.evalJs("document.querySelector('.wz-sliver [data-reorg-connect-line] [data-line-undo]')?.click(); null");
  await settle(app);
  const s6b = await app.evalJs(COLLECTIONS);
  ok('D6 Undo on the line takes the connection back (deletedAt set; no live link left on ap-3)',
    made6 === 1 && liveLinks(s6b, 'ap-3').length === 0 && linksOf(s6b, 'ap-3').some((l) => l.bBoxId === 'x1' && !!l.deletedAt) && !(await app.evalJs(LINE)), { made6, after: linksOf(s6b, 'ap-3') });

  // ---- KEYS ------------------------------------------------------------------------------------------------------------------------------
  const yBtn = "[data-back-assets] [data-back-board='ap-y'] .wz-back-boardhead [data-to-part]";
  await app.evalJs(`(() => { const b = document.querySelector(${q(yBtn)}); if (b) { b.focus(); b.click(); } return null; })()`);
  await sleep(300);
  const menu = await app.evalJs(`(() => { const b = document.querySelector(${q(yBtn)}); const m = document.querySelector('[data-to-part-menu]'); return { expanded: b?.getAttribute('aria-expanded'), items: m ? [...m.querySelectorAll('[data-to-part-pick]')].map((x) => ({ id: x.getAttribute('data-to-part-pick'), word: (x.textContent || '').trim() })) : null, focusIn: !!m && m.contains(document.activeElement) }; })()`);
  await app.evalJs("document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); null");
  await sleep(300);
  const esc = await app.evalJs(`(() => ({ menu: !!document.querySelector('[data-to-part-menu]'), focusBack: document.activeElement === document.querySelector(${q(yBtn)}) }))()`);
  ok('K1 every asset row and head has "→ Part"; pressed, it lists the OTHER Parts in her order, expanded, focus inside; Escape closes and gives the focus back',
    st0.assets.every((a) => a.toPart) && st0.heads.every((h) => h.toPart) && menu.expanded === 'true' && !!menu.items && menu.items.map((i) => i.id).join(',') === 'ap-2,ap-3'
      && menu.items[0].word === 'Chapter two' && menu.items[1].word === 'Chapter three' && menu.focusIn && !esc.menu && esc.focusBack, { st0: { assets: st0.assets, heads: st0.heads }, menu, esc });

  const k2a = await app.evalJs(COLLECTIONS);
  await app.evalJs(`(() => { document.querySelector(${q(yBtn)})?.click(); return null; })()`); await sleep(300);
  await app.evalJs("document.querySelector('[data-to-part-menu] [data-to-part-pick=\"ap-3\"]')?.click(); null");
  await settle(app);
  const k2b = await app.evalJs(COLLECTIONS);
  const lk = liveLinks(k2b, 'ap-3');
  const pl = await app.evalJs(PANEL_LINE);
  ok('K2 picking "Chapter three" from ap-y\'s head stores ONE live PageLink on ap-3 { bEntryId ap-y, no box }; the Assets tab\'s line names both, with Undo',
    lk.length === 1 && lk[0].bEntryId === 'ap-y' && !('bBoxId' in lk[0]) && !('aBoxId' in lk[0]) && !!lk[0].createdAt && onlyLinked(diffStores(k2a, k2b), k2b, 'ap-3')
      && !!pl && pl.undo && pl.text.includes('Y board') && pl.text.includes('Chapter three'), { lk, pl, d: diffStores(k2a, k2b) });
  await app.evalJs("document.querySelector('[data-graft-undo] button')?.click(); null");
  await settle(app);
  const k3 = await app.evalJs(COLLECTIONS);
  ok('K3 Undo takes it back (no live link left on ap-3)', liveLinks(k3, 'ap-3').length === 0 && linksOf(k3, 'ap-3').some((l) => l.bEntryId === 'ap-y' && !!l.deletedAt), linksOf(k3, 'ap-3'));

  // ---- KEPT ------------------------------------------------------------------------------------------------------------------------------
  await openPage(app, 'ap-2');
  const sR = await app.evalJs(COLLECTIONS);
  const stR = await app.evalJs(STATE);
  ok('R1 after a reload ap-2\'s record still holds the live link to x1, and on ap-2 the Assets tab lists "Xcard one"',
    liveLinks(sR, 'ap-2').length === 1 && liveLinks(sR, 'ap-2')[0].bBoxId === 'x1' && stR.assets.some((a) => a.box === 'x1' && a.title === 'Xcard one'), { links: liveLinks(sR, 'ap-2'), assets: stR.assets });

  // ---- OFF -------------------------------------------------------------------------------------------------------------------------------
  await openPage(app, 'ap-1', { reorg: false });
  const off = await app.evalJs("(() => ({ parts: !!document.querySelector('[data-reorg-parts], #wz-sliver-tab-parts'), toPart: !!document.querySelector('[data-to-part]'), draggable: document.querySelectorAll('.wz-links-pane [draggable=\"true\"]').length, rows: document.querySelectorAll('.wz-links-pane .wz-graft-row').length }))()");
  ok('O1 switch off, Machina, the same page: no Parts tab, no "→ Part", no row of the links pane draggable (the rows are drawn)', !off.parts && !off.toPart && off.draggable === 0 && off.rows > 0, off);
});

// ---- WORDS (source) --------------------------------------------------------------------------------------------------------------------
{
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const used = ['reorg/PartsList.tsx', 'reorg/backMenu/AssetGroupsList.tsx', 'components/ConnectionsDrawerPanel.tsx'].map((f) => fs.existsSync(path.join(SRC, f)) ? fs.readFileSync(path.join(SRC, f), 'utf8') : '').join('\n');
  const need = ['reorgToPart', 'reorgToPartAria', 'reorgToPartMenu', 'reorgConnectedLine', 'reorgAlreadyConnected', 'reorgConnectRefused'];
  const missing = need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !used.includes(`'${k}'`));
  ok('W1 every new word is a lexicon key (terms.ts, the canonical table, used in the source)', missing.length === 0, { missing });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 13;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ASSET-TO-PART VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ASSET-TO-PART VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
