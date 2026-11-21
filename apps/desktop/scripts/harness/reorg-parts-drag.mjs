// DRAG TO MOVE, MERGE AND NEST PARTS (the reorg plan v2.1 §3b, ARBOR item 1; Fable, Nov 20 11:15 pm: "through INK's parts.ts acts; Machina, behind
// the switch; red first"). A Part's row in the Sliver's PARTS tab is dragged (HTML5, its own type, never the Assets tab's) and dropped on another row:
//   - the row's top quarter: MOVE above it; its bottom quarter: MOVE below it (and below its subsections). INK's movePart, the run with it.
//   - its middle, released at once: NEST under it (BUILD only, as the row menu's In / Out are BUILD's): placed after its run, one level under it
//     (INK's movePart then setPartLevel). A Part as deep as Parts go is refused, said in the row, and a release there writes nothing.
//   - its middle, HELD ~450ms (the dwell, item 144's guard for an act that changes words): MERGE into it, "Release to merge into <B>": the Part is
//     moved directly under it and joined onto it (INK's movePart then joinPart; the line under the tools offers Undo, INK's undoJoin). INK's
//     refusals (a Part that carries ink, cards, links or a thread; a script) are read BEFORE anything moves and said in the row.
// The target names the act while the drag is over it (data-drop + its words); the page never moves (overlay inside the drawer). Machina, ?reorg=1.
//
// The fixture (seams only; WS_PLACE=1): a set "Novel" in a Drawer, five Parts wb-1..wb-5 ("Chapter one." .. "Chapter five."), all at level 0;
// wb-2 links the doc wb-q (it carries a link: INK refuses to join it). She is on wb-1, BUILD, the Sliver open on PARTS, 1920x1080.
//
// DRAG    D1  BUILD: every row is draggable; SPRINT: no row is (the stage table: SPRINT is "New Part" only)
// MOVE    M1  wb-4 dropped on wb-2's top quarter: wb-2 shows "before" while over it; the order becomes 1,4,2,3,5; every text identical; she stays on wb-1
//         M2  wb-1 (the Part she is on) dropped on wb-5's bottom quarter: the order becomes 4,2,3,5,1; she stays on wb-1 (the same editor node)
// NEST    N1  wb-3 released at once on wb-2's middle: wb-2 shows "nest" naming itself; wb-3 sits right under wb-2 at level 1; every text identical
//         N2  wb-2 (with wb-3 under it) released on wb-5's middle: the run moves, wb-2 at level 1 under wb-5, wb-3 at level 2 (order 4,5,2,3,1)
//         N3  wb-4 released on wb-3's middle (wb-3 at level 2, as deep as Parts go): the row says why ("no") and nothing is written
// MERGE   G1  wb-3 HELD on wb-4's middle: wb-4 shows "merge" naming itself; released: wb-4's text is its own then wb-3's (INK's join, exactly), wb-3
//             is gone, the line under the tools offers Undo; Undo brings wb-3 and both texts back
//         G2  wb-2 (it carries a link) held on wb-4's middle: the row says INK's refusal ("no") and a release writes nothing
// STAGE   E1  EDIT: rows draggable; a release at once on a row's middle writes nothing (no nesting in EDIT)
// PAGE    P1  the page's rects (column, page, editor) and the editor node are the same across every drag of the BUILD sitting
// SOURCE  S1  PartsList's drag writes only through INK's acts (movePart, setPartLevel, joinPart), with its own drag type, the asset drop kept
// WORDS   W1  every new word is a lexicon key (terms.ts, the canonical table, used in the source)
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-parts-drag.mjs
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
const ALL = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'))";
const TEXTS = `Object.fromEntries(${ALL}.filter((e) => !e.deletedAt).map((e) => [e.id, e.text ?? '']))`;
// the Doc's live Parts in her order, with each one's STORED level (absent = 0)
const ORDER = (set) => `${ALL}.filter((e) => e.projectId === ${q(set)} && !e.deletedAt && e.pageType !== 'board').sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map((e) => e.id.replace('wb-', '') + (e.pageSettings?.level ? ':' + e.pageSettings.level : '')).join(',')`;
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const L = "document.querySelector('.wz-sliver [data-reorg-parts]')";
const ROW = (id) => `${L}?.querySelector('[data-part-row="${id}"]')`;
async function settle(app) { await sleep(300); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400); }

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
    page('wb-q', 'A linked doc', { origin: 'loose' });
    ['one', 'two', 'three', 'four', 'five'].forEach((w, i) => page('wb-' + (i + 1), 'Chapter ' + w + '.', { origin: 'project', projectId: novel.id, orderIndex: i }));
    const l2 = W.wrizoAddPageLink('wb-2', { bEntryId: 'wb-q' });
    W.wrizoFlushNow();
    return { novel: novel.id, link: !!l2 };
  })()`);
}

async function openAt(app, id, key) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  await stage(app, key);
}
async function stage(app, key) {
  await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${key}"]')?.click(); null`);
  await app.waitFor(`document.querySelector('.reorg-top [data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: key }).catch(() => {});
  await sleep(900);
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(400);
}

// a drag the way the browser hands it to the app (reorg-asset-to-part.mjs's idiom): dragstart on the source fills a DataTransfer; each dragover
// lands at a point on the target row (a fraction of its height, its middle across); the drop at the same point; dragend on the source
const begin = (src) => `(() => { const s = ${ROW(src)}; if (!s) return false; window.__partDt = new DataTransfer();
  s.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: window.__partDt })); return true; })()`;
const at = (tgt, frac, type) => `(() => { const t = ${ROW(tgt)}; if (!t || !window.__partDt) return null; const r = t.getBoundingClientRect();
  const ev = new DragEvent(${q(type)}, { bubbles: true, cancelable: true, dataTransfer: window.__partDt, clientX: r.left + r.width / 2, clientY: r.top + r.height * ${frac} });
  t.dispatchEvent(ev); return { prevented: ev.defaultPrevented }; })()`;
const end = (src) => `(() => { const s = ${ROW(src)} || ${L}; if (s && window.__partDt) s.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: window.__partDt })); window.__partDt = null; return null; })()`;
// what the target row says while the drag is over it
const says = (tgt) => `(() => { const li = ${L}?.querySelector('li[data-part-li="${tgt}"]'); if (!li) return null; const w = li.querySelector('[data-drop-label]');
  return { drop: li.getAttribute('data-drop'), words: w ? w.textContent.replace(/\\s+/g, ' ').trim() : null }; })()`;
/** drag src onto tgt at frac; dwell = ms held there before the release (two dragovers, dwell apart, as a held pointer sends them) */
async function drag(app, src, tgt, frac, dwell = 0) {
  const started = await app.evalJs(begin(src));
  const o1 = await app.evalJs(at(tgt, frac, 'dragover'));
  if (dwell) { await sleep(dwell); await app.evalJs(at(tgt, frac, 'dragover')); }
  await sleep(150);
  const shown = await app.evalJs(says(tgt));
  const d = await app.evalJs(at(tgt, frac, 'drop'));
  await app.evalJs(end(src));
  await settle(app);
  return { started, over: o1, shown, dropped: d };
}
const here = `(() => ${L}?.querySelector('[aria-current="true"]')?.getAttribute('data-part-row') ?? null)()`;
const markEditor = "(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__dragMark = 1; return !!n; })()";
const sameEditor = "!!(document.querySelector('.forward-only-editor') || {}).__dragMark";
const said = `(() => { const s = ${L}?.querySelector('[data-parts-said]'); return s ? { text: s.textContent.replace(/\\s+/g, ' ').trim(), undo: !!s.querySelector('[data-parts-undo]') } : null; })()`;

await withHarness(async (app) => {
  const ids = await seed(app);
  const set = ids.novel;
  await openAt(app, 'wb-1', 'draft');
  const r0 = await app.evalJs(PAGE);
  await app.evalJs(markEditor);
  const t0 = await app.evalJs(TEXTS);

  // ---- DRAG ------------------------------------------------------------------------------------------------------------------------------
  const dragBuild = await app.evalJs(`(() => [...(${L}?.querySelectorAll('[data-part-row]') || [])].map((b) => b.getAttribute('draggable')))()`);

  // ---- MOVE ------------------------------------------------------------------------------------------------------------------------------
  const m1 = await drag(app, 'wb-4', 'wb-2', 0.1);
  const o1 = await app.evalJs(ORDER(set));
  const t1 = await app.evalJs(TEXTS);
  ok('M1 wb-4 dropped on wb-2\'s top quarter: wb-2 shows "before"; the order becomes 1,4,2,3,5; every text identical; she stays on wb-1',
    ids.link && m1.started && m1.shown?.drop === 'before' && o1 === '1,4,2,3,5' && JSON.stringify(t1) === JSON.stringify(t0) && (await app.evalJs(here)) === 'wb-1', { m1, o1, ids });

  const m2 = await drag(app, 'wb-1', 'wb-5', 0.9);
  const o2 = await app.evalJs(ORDER(set));
  ok('M2 wb-1 (the Part she is on) dropped on wb-5\'s bottom quarter: the order becomes 4,2,3,5,1; she stays on wb-1, the same editor node',
    m2.shown?.drop === 'after' && o2 === '4,2,3,5,1' && (await app.evalJs(here)) === 'wb-1' && (await app.evalJs(sameEditor)), { m2, o2 });

  // ---- NEST ------------------------------------------------------------------------------------------------------------------------------
  const n1 = await drag(app, 'wb-3', 'wb-2', 0.5);
  const on1 = await app.evalJs(ORDER(set));
  ok('N1 wb-3 released at once on wb-2\'s middle: wb-2 shows "nest" naming itself; wb-3 sits right under wb-2 at level 1; every text identical',
    n1.shown?.drop === 'nest' && /Chapter two/.test(n1.shown?.words || '') && on1 === '4,2,3:1,5,1' && JSON.stringify(await app.evalJs(TEXTS)) === JSON.stringify(t0), { n1, on1 });

  const n2 = await drag(app, 'wb-2', 'wb-5', 0.5);
  const on2 = await app.evalJs(ORDER(set));
  ok('N2 wb-2 (with wb-3 under it) released on wb-5\'s middle: the run moves, wb-2 at level 1 under wb-5, wb-3 at level 2 (4,5,2:1,3:2,1)',
    n2.shown?.drop === 'nest' && on2 === '4,5,2:1,3:2,1', { n2, on2 });

  const before3 = await app.evalJs(ALL);
  const n3 = await drag(app, 'wb-4', 'wb-3', 0.5);
  const after3 = await app.evalJs(ALL);
  ok('N3 wb-4 released on wb-3\'s middle (wb-3 as deep as Parts go): the row says why ("no") and nothing is written',
    n3.shown?.drop === 'no' && !!n3.shown?.words && JSON.stringify(after3) === JSON.stringify(before3), { n3, same: JSON.stringify(after3) === JSON.stringify(before3) });

  // ---- MERGE -----------------------------------------------------------------------------------------------------------------------------
  const g1 = await drag(app, 'wb-3', 'wb-4', 0.5, 700);
  const tg = await app.evalJs(TEXTS);
  const og = await app.evalJs(ORDER(set));
  const line = await app.evalJs(said);
  await app.evalJs(`(() => { const u = ${L}?.querySelector('[data-parts-undo]'); if (u) u.click(); return null; })()`);
  await settle(app);
  const tu = await app.evalJs(TEXTS);
  ok('G1 wb-3 HELD on wb-4\'s middle: wb-4 shows "merge" naming itself; released, wb-4 reads its words then wb-3\'s, wb-3 is gone, the line offers Undo; Undo brings both back',
    g1.shown?.drop === 'merge' && /Chapter four/.test(g1.shown?.words || '') && tg['wb-4'] === 'Chapter four.Chapter three.' && !('wb-3' in tg) && !/(^|,)3/.test(og)
      && !!line && line.undo && tu['wb-4'] === 'Chapter four.' && tu['wb-3'] === 'Chapter three.', { g1, og, line, w4: tg['wb-4'], back: [tu['wb-3'], tu['wb-4']] });

  const beforeG2 = await app.evalJs(ALL);
  const g2 = await drag(app, 'wb-2', 'wb-4', 0.5, 700);
  const afterG2 = await app.evalJs(ALL);
  ok('G2 wb-2 (it carries a link) held on wb-4\'s middle: the row says INK\'s refusal ("no") and a release writes nothing',
    g2.shown?.drop === 'no' && !!g2.shown?.words && JSON.stringify(afterG2) === JSON.stringify(beforeG2), { g2, same: JSON.stringify(afterG2) === JSON.stringify(beforeG2) });

  // ---- PAGE ------------------------------------------------------------------------------------------------------------------------------
  const r1 = await app.evalJs(PAGE);
  ok('P1 the page\'s rects (column, page, editor) and the editor node are the same across every drag of the BUILD sitting',
    !!r0 && r0 === r1 && (await app.evalJs(sameEditor)), { r0, r1 });

  // ---- STAGES ----------------------------------------------------------------------------------------------------------------------------
  await stage(app, 'freewrite');
  const dragSprint = await app.evalJs(`(() => [...(${L}?.querySelectorAll('[data-part-row]') || [])].map((b) => b.getAttribute('draggable')))()`);
  ok('D1 BUILD: every row is draggable; SPRINT: no row is', !!dragBuild && dragBuild.length === 5 && dragBuild.every((d) => d === 'true')
    && !!dragSprint && dragSprint.length > 0 && dragSprint.every((d) => d !== 'true'), { dragBuild, dragSprint });

  await stage(app, 'revise');
  const dragEdit = await app.evalJs(`(() => [...(${L}?.querySelectorAll('[data-part-row]') || [])].map((b) => b.getAttribute('draggable')))()`);
  const beforeE = await app.evalJs(ALL);
  const e1 = await drag(app, 'wb-4', 'wb-1', 0.5);
  const afterE = await app.evalJs(ALL);
  ok('E1 EDIT: rows draggable; a release at once on a row\'s middle writes nothing (no nesting in EDIT)',
    !!dragEdit && dragEdit.length > 0 && dragEdit.every((d) => d === 'true') && e1.shown?.drop !== 'nest' && JSON.stringify(afterE) === JSON.stringify(beforeE), { dragEdit, e1 });
});

// ---- SOURCE + WORDS ----------------------------------------------------------------------------------------------------------------------
{
  const read = (f) => (fs.existsSync(path.join(SRC, f)) ? fs.readFileSync(path.join(SRC, f), 'utf8') : '');
  const list = read('reorg/PartsList.tsx');
  const drag = read('reorg/partDrag.ts');
  const both = list + '\n' + drag;
  const acts = ['movePart(', 'setPartLevel(', 'joinPart('].filter((a) => !both.includes(a));
  const own = /PART_DRAG\s*=\s*'([^']+)'/.exec(drag);
  const asset = read('reorg/assetConnect.ts');
  const assetType = /=\s*'(application\/[^']+|text\/[^']+)'/.exec(asset);
  ok('S1 the drag writes only through INK\'s acts (movePart, setPartLevel, joinPart), with its own drag type, the asset drop kept',
    !!drag && acts.length === 0 && !/saveJournalEntry|wrizoPatchEntry|localStorage/.test(both) && !!own && (!assetType || own[1] !== assetType[1]) && /isAssetDrag\(/.test(list),
    { drag: !!drag, acts, own: own && own[1], assetType: assetType && assetType[1] });

  const terms = read('store/lexicon/terms.ts');
  const canon = read('store/lexicon/canonical/chrome.ts');
  const need = ['reorgDragNest', 'reorgDragMerge', 'reorgDragNestNo', 'reorgDragMoved', 'reorgDragNested'];
  const missing = need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !both.includes(`'${k}'`));
  ok('W1 every new word is a lexicon key (terms.ts, the canonical table, used in the source)', missing.length === 0, { missing });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 12;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-PARTS-DRAG VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-PARTS-DRAG VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
