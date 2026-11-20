// CONNECT DOC'S WRITE (POLISH; Fable's GO, Nov 19 6:05 pm, ask (d): "Connect Doc's write as a PageLink between the Board and each Doc (Nick:
// saved with the account), red-first"). Machina only, behind ?reorg=1; the top rail's Connect Doc list (reorg/TopRail.tsx, reorg-top-rail.mjs).
//
// The write is ONE PageLink (types/records.ts, the CONNECTOR-B record that already rides the entry's page_links jsonb to the account: schema
// change none, no new key), owned by the Board, to the Doc's first Part in her order (a Doc is its Parts; a set she made has no entry of its
// own), a card at neither end, made by the store's own addPageLink. The Board's place then reads every Doc a card-less link joins to it,
// whichever end owns the record (a page's own Graft to the Board counts the same).
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer and its app-made set):
//   Top Drawer   its app-made set: a page "Notes on the ledgers" (a one-Part Doc)
//   Grants       a set she made, "Budget": three pages and a board -> one Doc of three Parts; the board serves Budget
//                a set she made of boards only, "Moodboards": "Mood board" (no Doc) and "Pin board", which a loose page has grafted (page-owned)
//   one loose page (Unfiled), "A loose page"
//
// LIST   X0  on a Board with no Doc, Connect Doc lists one row per Doc (Budget once, not three times), none marked connected, then "A new doc"
// WRITE  X1  picking Budget stores ONE new live PageLink on the Board's own record: { aEntryId: the Board, bEntryId: Budget's first Part }, no
//            card at either end, ids and stamps present; nothing else stored changes but the store's own stamps (the Board's updatedAt, its
//            set's F1 resume pointer); every entry's text and boxes are byte-identical
//        X2  she stays on the Board: the same address, the same board node, the list closed; the place reads "Board · Budget" and Connect Doc
//            is the "+" box
//        X3  reopened, Budget reads "connected" and is aria-disabled; picking it again writes nothing
//        X4  picking a one-Part Doc ("Notes on the ledgers") adds a second link, to that page; the place reads "Board · 2 docs"
//        X5  after a reload the place still reads "Board · 2 docs" and the Board's stored record holds exactly the two live links
// HELD   X6  PARKED Nov 20 (SUPERSEDED - "A new doc" opens a new empty page and writes the link at its first word: Fable, Nov 19 7:55 pm, ask (a)). Original: "A new doc" writes nothing and says why (a page is born when it has a word, PB1)
// NEW    X6b "A new doc" opens a new EMPTY page carrying the Board in its address (sb=); no page is stored at the press (PB1), and at most
//            the empty set the left rail's rule makes on the click for a Project holding only sets she made (railData newTargetOf)
//        N1  her first word births the page into that new set, and in the same act the Board owns ONE new card-less PageLink to it;
//            nothing else stored changes but the store's own stamps
//        N2  back on the Board, the place reads "Board · 3 docs", and the list marks the new page's Doc connected
// READ   X7  a Board a page has grafted (the page owns the record) reads that page's Doc: "Board · A loose page", and the list marks it connected
//        X8  a Board not yet kept (the unborn slot: no card) is not born by a side door: a pick writes nothing and says to add a card first
//        N3  and on that Board "A new doc" opens nothing and writes nothing, and says the same
// OFF    X9  switch off on the connected Board: no top rail, no Connect Doc; the Board is drawn
// WORDS  W1  PARKED Nov 20 (SUPERSEDED - "A new doc" opens a new empty page and writes the link at its first word: Fable, Nov 19 7:55 pm, ask (a)). Original: every new word is a lexicon key (terms.ts and the canonical table), and the retired
//            "held" line for a pick is gone
//        W1b every new word is a lexicon key, and both retired "held" lines (a pick, "A new doc") are gone
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-connect-doc.mjs
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
// the Board's record (pageLinks + its stamp) and, at most, its set's F1 resume pointer (persistence/journal.ts stampPageActivity: every entry
// write in a set stamps it) - nothing else
const onlyBoardLinked = (d, after, boardId) => {
  const ent = d.filter((x) => x[0] === 'writer-studio-journal-entries');
  const rest = d.filter((x) => x[0] !== 'writer-studio-journal-entries');
  const board = (after['writer-studio-journal-entries'] || []).find((e) => e.id === boardId);
  const set = board && board.projectId ? (after['writer-studio-projects'] || []).find((p) => p.id === board.projectId) : null;
  return ent.length === 1 && ent[0][1] === boardId && ent[0][2].includes('pageLinks') && ent[0][2].every((k) => k === 'pageLinks' || k === 'updatedAt')
    && rest.every((x) => x[0] === 'writer-studio-projects' && !!set && x[1] === set.id && x[2].every((k) => ['updatedAt', 'lastActivityAt', 'lastActivityType', 'lastActivePageId'].includes(k)));
};
const words = (st) => Object.fromEntries((st['writer-studio-journal-entries'] || []).map((e) => [e.id, JSON.stringify([e.text ?? null, e.boxes ?? null, e.script ?? null])]));
const liveLinks = (st, id) => (((st['writer-studio-journal-entries'] || []).find((e) => e.id === id) || {}).pageLinks || []).filter((l) => !l.deletedAt);

let ids = null;
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const top = await app.evalJs("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id); return { drawer: d.id, set: p && p.id }; })()");
  const made = await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const budget = W.wrizoCreateProject('Budget'); W.wrizoSetProjectDrawer(budget.id, grants.id);
    const moods = W.wrizoCreateProject('Moodboards'); W.wrizoSetProjectDrawer(moods.id, grants.id);
    page('cd-top-1', 'Notes on the ledgers', { origin: 'project', projectId: ${q(top.set)}, orderIndex: 0 });
    page('cd-g-1', 'Budget one', { origin: 'project', projectId: budget.id, orderIndex: 0 });
    page('cd-g-2', 'Budget two', { origin: 'project', projectId: budget.id, orderIndex: 1 });
    page('cd-g-3', 'Budget three', { origin: 'project', projectId: budget.id, orderIndex: 2 });
    page('cd-g-b', 'Budget board', { origin: 'project', projectId: budget.id, pageType: 'board', boxes: [] });
    page('cd-m-b', 'Mood board', { origin: 'project', projectId: moods.id, pageType: 'board', boxes: [] });
    page('cd-x-b', 'Pin board', { origin: 'project', projectId: moods.id, pageType: 'board', boxes: [] });
    page('cd-l-1', 'A loose page', { origin: 'loose' });
    const graft = W.wrizoAddPageLink('cd-l-1', { bEntryId: 'cd-x-b' });
    W.wrizoFlushNow();
    return { grants: grants.id, budget: budget.id, moods: moods.id, graft: !!graft };
  })()`);
  ids = { topDrawer: top.drawer, topSet: top.set, ...made };
}

async function open(app, reorg, hash, theme = 'machina') {
  await app.emulateDpr(1, 1366, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#${hash}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-frame-host .sprint-nav') && !!document.querySelector('.desk-frame-strip')", { label: `the surface ${hash}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}

const PLACE = "(() => { const p = document.querySelector('.reorg-top [data-top-place]'); const c = document.querySelector('.reorg-top [data-top-connect]'); return { place: p ? (p.textContent || '').replace(/\\s+/g, ' ').trim() : null, connect: c ? { text: (c.textContent || '').trim(), icon: c.classList.contains('is-icon') } : null }; })()";
const LIST = "(() => { const l = document.querySelector('[data-top-connect-list]'); if (!l) return null; return [...l.querySelectorAll('[data-connect-row]')].map((b) => ({ kind: b.getAttribute('data-connect-row'), name: ((b.querySelector('.reorg-top-drop-name') || b).textContent || '').replace(/\\s+/g, ' ').trim(), on: b.getAttribute('aria-disabled') === 'true', meta: ((b.querySelector('.reorg-top-drop-meta') || {}).textContent || '').trim() })); })()";
const toggle = "document.querySelector('.reorg-top [data-top-connect]')?.click(); null";
// select a row by its name, never by its index (the list is recent-first: an index goes green about something else)
const pickByName = (name) => `(() => { const b = [...document.querySelectorAll('[data-top-connect-list] [data-connect-row="doc"]')].find((x) => ((x.querySelector('.reorg-top-drop-name') || x).textContent || '').replace(/\\s+/g, ' ').trim() === ${q(name)}); if (!b) return false; b.click(); return true; })()`;
const said = "document.querySelector('[data-top-connect-said]')?.textContent?.trim() ?? null";
async function settle(app) { await sleep(300); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400); }

await withHarness(async (app) => {
  await seed(app);

  // ---- LIST ------------------------------------------------------------------------------------------------------------------------------
  await open(app, true, '/page/cd-m-b');
  const p0 = await app.evalJs(PLACE);
  await app.evalJs(toggle); await sleep(400);
  const l0 = await app.evalJs(LIST);
  const docRows = (l0 || []).filter((r) => r.kind === 'doc');
  ok('X0 on a Board with no Doc, Connect Doc lists one row per Doc (Budget once), none connected, then "A new doc"',
    p0.place === 'Board · no doc yet' && !!l0 && docRows.filter((r) => r.name === 'Budget').length === 1 && !docRows.some((r) => /^Budget (one|two|three)$/.test(r.name))
      && docRows.some((r) => r.name === 'Notes on the ledgers') && docRows.every((r) => !r.on) && l0[l0.length - 1].kind === 'new', { p0, l0, graftSeeded: ids.graft });

  // ---- WRITE -----------------------------------------------------------------------------------------------------------------------------
  await app.evalJs("(() => { const n = document.querySelector('.desk-frame-host'); if (n) n.__cdMark = 1; return null; })()");
  const hash0 = await app.evalJs('location.hash');
  const s0 = await app.evalJs(COLLECTIONS);
  const picked = await app.evalJs(pickByName('Budget'));
  await settle(app);
  const s1 = await app.evalJs(COLLECTIONS);
  const d1 = diffStores(s0, s1);
  const links1 = liveLinks(s1, 'cd-m-b');
  const rec = links1[0] || {};
  ok('X1 picking Budget stores ONE PageLink on the Board\'s own record, to Budget\'s first Part, no card at either end; nothing else but the store\'s stamps; every text and box identical',
    picked && links1.length === 1 && rec.aEntryId === 'cd-m-b' && rec.bEntryId === 'cd-g-1' && !('aBoxId' in rec) && !('bBoxId' in rec) && !!rec.id && !!rec.createdAt && !!rec.updatedAt
      && onlyBoardLinked(d1, s1, 'cd-m-b') && JSON.stringify(words(s0)) === JSON.stringify(words(s1)), { picked, links1, d1 });

  const stay = await app.evalJs(`(() => ({ hash: location.hash, same: !!(document.querySelector('.desk-frame-host') || {}).__cdMark, list: !!document.querySelector('[data-top-connect-list]') }))()`);
  const p1 = await app.evalJs(PLACE);
  ok('X2 she stays on the Board (same address, same node, list closed); the place reads "Board · Budget" and Connect Doc is the "+" box',
    stay.hash === hash0 && stay.same && !stay.list && p1.place === 'Board · Budget' && !!p1.connect && p1.connect.icon && p1.connect.text === '+', { stay, hash0, p1 });

  await app.evalJs(toggle); await sleep(400);
  const l2 = await app.evalJs(LIST);
  const budgetRow = (l2 || []).find((r) => r.kind === 'doc' && r.name === 'Budget');
  const s2a = await app.evalJs(COLLECTIONS);
  await app.evalJs(pickByName('Budget'));
  await settle(app);
  const s2b = await app.evalJs(COLLECTIONS);
  ok('X3 reopened, Budget reads "connected" and is aria-disabled; picking it again writes nothing',
    !!budgetRow && budgetRow.on && budgetRow.meta === 'connected' && diffStores(s2a, s2b).length === 0, { budgetRow, d: diffStores(s2a, s2b) });

  const picked4 = await app.evalJs(pickByName('Notes on the ledgers'));
  await settle(app);
  const s4 = await app.evalJs(COLLECTIONS);
  const links4 = liveLinks(s4, 'cd-m-b');
  const p4 = await app.evalJs(PLACE);
  ok('X4 a one-Part Doc ("Notes on the ledgers") adds a second link, to that page; the place reads "Board · 2 docs"',
    picked4 && links4.length === 2 && links4.some((l) => l.bEntryId === 'cd-top-1' && !l.aBoxId && !l.bBoxId) && onlyBoardLinked(diffStores(s2b, s4), s4, 'cd-m-b') && p4.place === 'Board · 2 docs', { picked4, links4, p4 });

  await open(app, true, '/page/cd-m-b');
  const p5 = await app.evalJs(PLACE);
  const s5 = await app.evalJs(COLLECTIONS);
  const links5 = liveLinks(s5, 'cd-m-b');
  ok('X5 after a reload the place still reads "Board · 2 docs" and the Board\'s stored record holds exactly the two live links',
    p5.place === 'Board · 2 docs' && links5.length === 2 && links5.map((l) => l.bEntryId).sort().join(',') === 'cd-g-1,cd-top-1', { p5, links5 });

  // PARKED Nov 20 (SUPERSEDED - "A new doc" opens a new empty page and writes the link at its first word: Fable, Nov 19 7:55 pm, ask (a)). Original, verbatim:
  // // ---- HELD ------------------------------------------------------------------------------------------------------------------------------
  // await app.evalJs(toggle); await sleep(400);
  // const s6a = await app.evalJs(COLLECTIONS);
  // await app.evalJs("document.querySelector('[data-top-connect-list] [data-connect-row=\"new\"]')?.click(); null");
  // await settle(app);
  // const said6 = await app.evalJs(said);
  // const s6b = await app.evalJs(COLLECTIONS);
  // ok('X6 "A new doc" writes nothing and says so (a page is born when it has a word)', !!said6 && diffStores(s6a, s6b).length === 0, { said6, d: diffStores(s6a, s6b) });

  // ---- A NEW DOC ---------------------------------------------------------------------------------------------------------------------------
  await app.evalJs(toggle); await sleep(400);
  const s6a = await app.evalJs(COLLECTIONS);
  await app.evalJs("document.querySelector('[data-top-connect-list] [data-connect-row=\"new\"]')?.click(); null");
  await app.waitFor("location.hash.indexOf('/page/new') >= 0 && !!document.querySelector('.forward-only-editor')", { timeout: 8000, label: 'the new page' }).catch(() => {});
  await sleep(700);
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400);
  const hash6 = await app.evalJs('location.hash');
  const s6b = await app.evalJs(COLLECTIONS);
  const d6 = diffStores(s6a, s6b);
  const newSets = d6.filter((x) => x[0] === 'writer-studio-projects' && x[2][0] === '(added)');
  const madeSet = newSets.length === 1 ? (s6b['writer-studio-projects'] || []).find((p) => p.id === newSets[0][1]) : null;
  ok('X6b "A new doc" opens a new empty page carrying the Board (sb=); no page stored at the press, at most the rail\'s empty set in the Board\'s Project',
    /\/page\/new\?/.test(hash6) && /[?&]sb=cd-m-b(&|$)/.test(hash6) && d6.every((x) => x[0] === 'writer-studio-projects' && x[2][0] === '(added)') && newSets.length <= 1
      && (!madeSet || (madeSet.drawerId === ids.grants && new RegExp('binder=' + madeSet.id).test(hash6))), { hash6, d6, madeSet });

  // her first word, as the left rail's speed check types: a trusted click into the editor, then real keys
  const spot6 = await app.evalJs("(() => { const r = document.querySelector('.forward-only-editor')?.getBoundingClientRect(); return r ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + Math.min(30, r.height / 2)) } : null; })()");
  if (spot6) { await app.mouseDown(spot6.x, spot6.y); await app.mouseUp(spot6.x, spot6.y); }
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null"); await sleep(300);
  for (const ch of 'Fresh pages') { await app.typeKeys(ch); await sleep(50); }
  const bornQ = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).find((e) => /^Fresh pages/.test(e.text || '') && !e.deletedAt)";
  await app.waitFor(`!!${bornQ}`, { timeout: 8000, label: 'the page born' }).catch(() => {});
  await settle(app); await sleep(600);
  const s6c = await app.evalJs(COLLECTIONS);
  const born = (s6c['writer-studio-journal-entries'] || []).find((e) => /^Fresh pages/.test(e.text || '') && !e.deletedAt) || null;
  const links6 = liveLinks(s6c, 'cd-m-b');
  const toBorn = born ? links6.filter((l) => l.bEntryId === born.id) : [];
  const d6c = diffStores(s6b, s6c);
  const others = d6c.filter((x) => !(x[0] === 'writer-studio-journal-entries' && born && x[1] === born.id) && !(x[0] === 'writer-studio-journal-entries' && x[1] === 'cd-m-b' && x[2].every((k) => k === 'pageLinks' || k === 'updatedAt'))
    && !(x[0] === 'writer-studio-projects' && x[2].every((k) => ['updatedAt', 'lastActivityAt', 'lastActivityType', 'lastActivePageId'].includes(k))));
  ok('N1 her first word births the page in that set, and the Board owns ONE new card-less PageLink to it; nothing else but the store\'s stamps',
    !!born && (!madeSet || born.projectId === madeSet.id) && links6.length === 3 && toBorn.length === 1 && toBorn[0].aEntryId === 'cd-m-b' && !('aBoxId' in toBorn[0]) && !('bBoxId' in toBorn[0])
      && others.length === 0 && Object.entries(words(s6b)).every(([id, w]) => words(s6c)[id] === w), { born: born && { id: born.id, projectId: born.projectId, text: born.text }, links6, others });

  await open(app, true, '/page/cd-m-b');
  const p6 = await app.evalJs(PLACE);
  await app.evalJs(toggle); await sleep(400);
  const l6 = await app.evalJs(LIST);
  const freshRow = (l6 || []).find((r) => r.kind === 'doc' && /^Fresh pages/.test(r.name));
  ok('N2 back on the Board the place reads "Board · 3 docs", and the list marks the new page\'s Doc connected', p6.place === 'Board · 3 docs' && !!freshRow && freshRow.on, { p6, freshRow });
  await app.evalJs(toggle); await sleep(200);

  // ---- READ ------------------------------------------------------------------------------------------------------------------------------
  await open(app, true, '/page/cd-x-b');
  const p7 = await app.evalJs(PLACE);
  await app.evalJs(toggle); await sleep(400);
  const l7 = await app.evalJs(LIST);
  const loose = (l7 || []).find((r) => r.kind === 'doc' && r.name === 'A loose page');
  ok('X7 a Board a page has grafted (the page owns the record) reads that page\'s Doc, and the list marks it connected',
    ids.graft && p7.place === 'Board · A loose page' && !!loose && loose.on, { graft: ids.graft, p7, loose });

  // ---- UNBORN ----------------------------------------------------------------------------------------------------------------------------
  await open(app, true, '/page/new?kind=board&origin=loose');
  const s8a = await app.evalJs(COLLECTIONS);
  const hasConnect = await app.evalJs("!!document.querySelector('.reorg-top [data-top-connect]')");
  await app.evalJs(toggle); await sleep(400);
  const picked8 = await app.evalJs(pickByName('Budget'));
  await settle(app);
  const said8 = await app.evalJs(said);
  const s8b = await app.evalJs(COLLECTIONS);
  ok('X8 a Board not yet kept (no card) is not born by a side door: a pick writes nothing and says to add a card first',
    hasConnect && picked8 && !!said8 && /card/i.test(said8) && diffStores(s8a, s8b).length === 0, { hasConnect, picked8, said8, d: diffStores(s8a, s8b) });
  const hash8 = await app.evalJs('location.hash');
  await app.evalJs("(() => { const s = document.querySelector('[data-top-connect-said]'); if (s) s.textContent = ''; return null; })()");
  await app.evalJs("document.querySelector('[data-top-connect-list] [data-connect-row=\"new\"]')?.click(); null");
  await settle(app);
  const n3 = { hash: await app.evalJs('location.hash'), said: await app.evalJs(said), d: diffStores(s8b, await app.evalJs(COLLECTIONS)) };
  ok('N3 on a Board not yet kept, "A new doc" opens nothing and writes nothing, and says to add a card first', n3.hash === hash8 && !!n3.said && /card/i.test(n3.said) && n3.d.length === 0, { hash8, n3 });

  // ---- OFF -------------------------------------------------------------------------------------------------------------------------------
  await open(app, false, '/page/cd-m-b');
  const off = await app.evalJs("(() => ({ top: !!document.querySelector('.reorg-top'), connect: !!document.querySelector('[data-top-connect]'), board: !!document.querySelector('.board-editor, [data-board-root], .board-canvas, .board-mode-strip') }))()");
  ok('X9 switch off on the connected Board: no top rail, no Connect Doc; the Board is drawn', !off.top && !off.connect && off.board, off);
});

// ---- WORDS (source) --------------------------------------------------------------------------------------------------------------------
{
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const top = fs.readFileSync(path.join(SRC, 'reorg', 'TopRail.tsx'), 'utf8');
  const need = ['reorgTopConnectOn', 'reorgTopConnectUnborn', 'reorgTopConnectNewHeld'];
  const missing = need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !top.includes(`t('${k}')`));
  const retired = ['reorgTopConnectHeld'].filter((k) => terms.includes(`'${k}'`) || canon.includes(`${k}:`) || top.includes(`'${k}'`));
  // PARKED Nov 20 (SUPERSEDED - "A new doc" opens a new empty page and writes the link at its first word: Fable, Nov 19 7:55 pm, ask (a)). Original, verbatim:
  // ok('W1 every new word is a lexicon key (terms.ts, the canonical table, used by the top rail), and the retired "held" line for a pick is gone', missing.length === 0 && retired.length === 0, { missing, retired });
  const needB = ['reorgTopConnectOn', 'reorgTopConnectUnborn', 'reorgTopConnectNew'];
  const missingB = needB.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !top.includes(`t('${k}')`));
  const retiredB = ['reorgTopConnectHeld', 'reorgTopConnectNewHeld'].filter((k) => terms.includes(`'${k}'`) || canon.includes(`${k}:`) || top.includes(`'${k}'`));
  ok('W1b every new word is a lexicon key, and both retired "held" lines (a pick, "A new doc") are gone', missingB.length === 0 && retiredB.length === 0, { missingB, retiredB });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 14;   // 11 - X6, W1 (parked) + X6b, N1, N2, N3, W1b
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-CONNECT-DOC VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-CONNECT-DOC VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
