// BIG PROJECTS STEP 3 - GRAFTS, CHECKED WITHOUT A BROWSER (docs/plans/big-projects.md step 3 + the graft-doors addendum; Nick approved the
// mockup cursor/graft-doors-mockup @ c4f34eb0; Fable cleared step 3 Oct 19, Q10 a checked picker row is inert). The app's REAL store
// (scripts/lib/client-node.mjs): store/grafts.ts on persistence.ts's own readers, one device, no server. The fixture is the mockup's own:
// "The Late Ferry" and "Short stories" Drawers, the Journal, an Unsorted binder, a trashed page and a purged one.
//   G1  the picker's search: Cards / Pages / Boards from EVERY place, each with its place label (Drawer name, "Unsorted", "Journal"); never the
//       subject itself, a built-in place, a trashed page or a shell; cards are the text cards of live boards, labelled with their board's place
//   G2  the search filters by title or place label, case-insensitively
//   G3  a pick on a PAGE makes exactly ONE page_links record owned by the page; the row is then checked; a second pick on it writes nothing;
//       a self-graft writes nothing
//   G4  a pick of a CARD from a page: the record's other end is that card on its board (bEntryId = the board, bBoxId = the card)
//   G5  a pick on a CARD subject (a board with a card selected): another card on the same board, or a page pinned on that board, is a
//       CONNECTION BOX (the one-truth rule) and writes no record; anything else is a record owned by the board with aBoxId = the card
//   G6  the panel's groups: Cards, Sources, Boards, Pages - imported documents and Research-kind pages under Sources, never Pages; links
//       either way round (owned by the subject, or by the other end); the place label shows only for another place
//   G7  Shared tags: every live entry that shares a tag with the subject, once, with the tag; never the subject, never a trashed page
//   G8  the plan board as ONE group: its live cards, N = the cards not hidden; hide writes pageSettings.hiddenPlanCards (keeping every other
//       setting) and leaves the card on its board; unhide restores; a stale id is pruned on read and never written back
//   G9  "Set as my default" never carries hiddenPlanCards (pageDefaults dressOnly)
//   G10 a board's paired page, for the top of its Grafts
//   G11 X then Undo: a removed graft's record is restored - the same record, live again
//   G12 a purged entry is never a row anywhere: not in the search, not in the groups
// Run (repo root): node apps/desktop/scripts/big-projects-3-check.mjs   (no browser, no box turn)
import { installClientGlobals, loadClientStore } from './lib/client-node.mjs';

installClientGlobals({ base: null, hostname: '127.0.0.1' });
// the lexicon names a built-in place by the theme on <html> (deskTerm -> resolveTheme); the node shim's document has no element, so give it one
// with no theme attribute (the default theme), here rather than in the shared shim
if (!globalThis.document.documentElement) globalThis.document.documentElement = { getAttribute: () => null, setAttribute: () => {}, removeAttribute: () => {}, dataset: {}, style: {} };
const S = await loadClientStore(['grafts', 'pageDefaults', 'boxTombstones']);
const P = S.persistence;
const G = S.grafts;
const D = S.pageDefaults;

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const stored = (id) => (JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === id) || null);
const links = (id) => ((P.getJournalEntry(id) || {}).pageLinks || []).filter((l) => !l.deletedAt);
const allLinkCount = () => P.getJournalEntries().reduce((n, e) => n + ((e.pageLinks || []).filter((l) => !l.deletedAt).length), 0);
const titles = (rows) => rows.map((r) => r.title).sort();
// source 'page': an authored page (an ABSENT source is a raw capture); origin null unless the row says 'journal'
const page = (text, extra = {}) => P.createJournalPage({ text, origin: null, source: 'page', ...extra });

// ---- the fixture (the mockup's)
const ferry = P.createDrawer('The Late Ferry');
const shorts = P.createDrawer('Short stories');
const manuscript = P.createBinder('Manuscript', 'book', ferry.id);
const shortsBinder = P.createBinder('Shorts', 'book', shorts.id);
const unsorted = P.createBinder('Loose binder', 'book');
const ch2 = page('Ch 2\nNobody on the quay', { projectId: manuscript.id });
const ch3 = page('Ch 3\nThe kettle clicks off', { projectId: manuscript.id });
const ch4 = page('Ch 4\nMorning', { projectId: manuscript.id });
const salt = page('Salt\nA short one', { projectId: shortsBinder.id });
const kettle = page('Kettle notes', { origin: 'journal' });
const ferryDream = page('Ferry dream', { origin: 'journal' });
const odd = page('Odd page', { projectId: unsorted.id });
const tides = page('Tides of the Estuary', { projectId: manuscript.id });
P.saveJournalEntry({ ...P.getJournalEntry(tides.id), importedAt: new Date().toISOString() });
const harbour = page('Harbour photo, 1962', { origin: 'journal' });
P.saveJournalEntry({ ...P.getJournalEntry(harbour.id), pageSettings: { ...(P.getJournalEntry(harbour.id).pageSettings || {}), kind: 'research' } });
const gone = page('Gone page', { projectId: manuscript.id });
P.softDeleteEntry(gone.id);
const shell = page('Purged page', { projectId: manuscript.id });
P.softDeleteEntry(shell.id); P.purgeEntry(shell.id);
const map = P.createBoardPage(manuscript.id, 'Chapter map');
P.saveBoardBoxes(map.id, [
  ...(P.getJournalEntry(map.id).boxes || []),
  { id: 'c1', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.1, z: 2, text: 'Mara at the window' },
  { id: 'c2', kind: 'text', x: 0.4, y: 0.05, w: 0.2, h: 0.1, z: 3, text: 'The blue cup' },
]);
P.pinPageToBoard(ch2.id, map.id, { display: true });
const ideas = P.createBoardPage(shortsBinder.id, 'Story ideas');
P.saveBoardBoxes(ideas.id, [...(P.getJournalEntry(ideas.id).boxes || []), { id: 's1', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 2, text: 'Salt - opening' }]);
const trashBoard = P.getOrCreateSystemBoard('trash');
const subjectPage = { entryId: ch3.id };

// ---- G1-G2: the search
{
  const r = G.searchGraftables('', subjectPage);
  const pages = titles(r.Pages), boards = titles(r.Boards), cards = titles(r.Cards);
  const label = (rows, t) => (rows.find((x) => x.title === t) || {}).place;
  const wantPages = ['Ch 2', 'Ch 4', 'Ferry dream', 'Harbour photo, 1962', 'Kettle notes', 'Odd page', 'Salt', 'Tides of the Estuary'];
  ok('G1: the search lists Cards / Pages / Boards from EVERY place - never the subject, a built-in place, a trashed page or a shell',
    JSON.stringify(pages) === JSON.stringify(wantPages) && JSON.stringify(boards) === JSON.stringify(['Chapter map', 'Story ideas'])
      && JSON.stringify(cards) === JSON.stringify(['Mara at the window', 'Salt - opening', 'The blue cup'])
      && ![...r.Pages, ...r.Boards].some((x) => x.entryId === trashBoard.id || x.entryId === ch3.id || x.entryId === gone.id || x.entryId === shell.id),
    JSON.stringify({ pages, boards, cards }));
  ok('G1: each row carries its place label - a Drawer\'s name, "Unsorted" for a binder with no Drawer, "Journal" for no home; a card wears its board\'s place',
    label(r.Pages, 'Ch 2') === 'The Late Ferry' && label(r.Pages, 'Salt') === 'Short stories' && label(r.Pages, 'Kettle notes') === 'Journal'
      && label(r.Pages, 'Odd page') === 'Unsorted' && label(r.Cards, 'Salt - opening') === 'Short stories' && label(r.Cards, 'The blue cup') === 'The Late Ferry'
      && label(r.Boards, 'Story ideas') === 'Short stories' && G.placeLabelOf(ch3.id) === 'The Late Ferry',
    JSON.stringify({ ch2: label(r.Pages, 'Ch 2'), salt: label(r.Pages, 'Salt'), kettle: label(r.Pages, 'Kettle notes'), odd: label(r.Pages, 'Odd page'), saltCard: label(r.Cards, 'Salt - opening') }));
  const q = G.searchGraftables('SALT', subjectPage);
  const q2 = G.searchGraftables('short stor', subjectPage);
  ok('G2: the search filters by title or by place label, case-insensitively',
    JSON.stringify(titles(q.Pages)) === JSON.stringify(['Salt']) && JSON.stringify(titles(q.Cards)) === JSON.stringify(['Salt - opening']) && q.Boards.length === 0
      && JSON.stringify(titles(q2.Pages)) === JSON.stringify(['Salt']) && JSON.stringify(titles(q2.Boards)) === JSON.stringify(['Story ideas']),
    JSON.stringify({ salt: [titles(q.Pages), titles(q.Cards), titles(q.Boards)], shortStor: [titles(q2.Pages), titles(q2.Boards)] }));
}

// ---- G3-G4: a pick on a page
{
  const before = allLinkCount();
  const made = G.graftTo(subjectPage, { entryId: kettle.id });
  const owned = links(ch3.id).filter((l) => l.bEntryId === kettle.id && !l.bBoxId);
  const after = allLinkCount();
  const row = G.searchGraftables('', subjectPage).Pages.find((x) => x.entryId === kettle.id);
  const again = G.graftTo(subjectPage, { entryId: kettle.id });
  const self = G.graftTo(subjectPage, { entryId: ch3.id });
  ok('G3: a pick on a PAGE makes exactly ONE page_links record owned by the page; the row is then checked; a second pick on it, or a self-graft, writes nothing',
    !!made && made.made === 'link' && owned.length === 1 && owned[0].id === made.linkId && after === before + 1 && !!row && row.checked === true
      && again === null && self === null && allLinkCount() === after && G.isGrafted(subjectPage, { entryId: kettle.id }) === true,
    JSON.stringify({ made, owned: owned.length, before, after, checked: row && row.checked, again, self }));
  const card = G.graftTo(subjectPage, { entryId: map.id, boxId: 'c1' });
  const rec = links(ch3.id).find((l) => l.bEntryId === map.id && l.bBoxId === 'c1');
  ok('G4: a pick of a CARD from a page makes one record whose other end is that card on its board (bEntryId = the board, bBoxId = the card)',
    !!card && card.made === 'link' && !!rec && !rec.aBoxId && G.isGrafted(subjectPage, { entryId: map.id, boxId: 'c1' }) === true, JSON.stringify({ card, rec }));
}

// ---- G5: a card subject
{
  const subjectCard = { entryId: map.id, boxId: 'c1' };
  const before = allLinkCount();
  const sameBoard = G.graftTo(subjectCard, { entryId: map.id, boxId: 'c2' });
  const pinned = G.graftTo(subjectCard, { entryId: ch2.id });
  const pinBox = (P.getJournalEntry(map.id).boxes || []).find((b) => b.kind === 'page-pin' && b.entryId === ch2.id);
  const mid = allLinkCount();
  const elsewhere = G.graftTo(subjectCard, { entryId: salt.id });
  const rec = links(map.id).find((l) => l.bEntryId === salt.id);
  const self = G.graftTo(subjectCard, { entryId: map.id, boxId: 'c1' });
  ok('G5: on a CARD subject, another card on the same board or a page pinned on that board is a CONNECTION BOX (the one-truth rule, no record); anything else is a record owned by the board with aBoxId = the card; the card itself is refused',
    !!sameBoard && sameBoard.made === 'connection' && sameBoard.a === 'c1' && sameBoard.b === 'c2' && !!pinned && pinned.made === 'connection' && !!pinBox && pinned.b === pinBox.id
      && mid === before && !!elsewhere && elsewhere.made === 'link' && !!rec && rec.aBoxId === 'c1' && self === null,
    JSON.stringify({ sameBoard, pinned, pin: pinBox && pinBox.id, before, mid, elsewhere, rec: rec && { aBoxId: rec.aBoxId } }));
  const r = G.searchGraftables('', subjectCard);
  ok('G5: the search for a card subject never lists the card itself', !r.Cards.some((x) => x.entryId === map.id && x.boxId === 'c1') && r.Cards.some((x) => x.boxId === 'c2'), JSON.stringify(titles(r.Cards)));
}

// ---- G6-G7: the groups and shared tags
{
  G.graftTo(subjectPage, { entryId: tides.id });
  G.graftTo(subjectPage, { entryId: harbour.id });
  G.graftTo(subjectPage, { entryId: ideas.id });
  P.addPageLink(salt.id, { bEntryId: ch3.id });          // owned by the OTHER end: still a graft of Ch 3
  const g = G.graftsOf(subjectPage);
  const pl = (rows, t) => rows.find((x) => x.title === t) || {};
  ok('G6: the groups - Cards (the card), Sources (the imported document and the Research page, never under Pages), Boards, Pages (both ways round)',
    JSON.stringify(titles(g.Cards)) === JSON.stringify(['Mara at the window']) && JSON.stringify(titles(g.Sources)) === JSON.stringify(['Harbour photo, 1962', 'Tides of the Estuary'])
      && JSON.stringify(titles(g.Boards)) === JSON.stringify(['Story ideas']) && JSON.stringify(titles(g.Pages)) === JSON.stringify(['Kettle notes', 'Salt']),
    JSON.stringify({ cards: titles(g.Cards), sources: titles(g.Sources), boards: titles(g.Boards), pages: titles(g.Pages) }));
  ok('G6: the faint place label is only for ANOTHER place - Mara and Tides (The Late Ferry, like Ch 3) carry none; Kettle notes (Journal), Salt and Story ideas (Short stories) do',
    pl(g.Cards, 'Mara at the window').placeDiffers === false && pl(g.Sources, 'Tides of the Estuary').placeDiffers === false
      && pl(g.Pages, 'Kettle notes').placeDiffers === true && pl(g.Pages, 'Kettle notes').place === 'Journal' && pl(g.Pages, 'Salt').placeDiffers === true
      && pl(g.Boards, 'Story ideas').placeDiffers === true,
    JSON.stringify(g.Pages.map((x) => [x.title, x.place, x.placeDiffers])));
  P.patchJournalEntry(ch3.id, P.getJournalEntry(ch3.id).text, { tags: ['ferry', 'revised'] });
  P.patchJournalEntry(ch4.id, P.getJournalEntry(ch4.id).text, { tags: ['revised'] });
  P.patchJournalEntry(ferryDream.id, P.getJournalEntry(ferryDream.id).text, { tags: ['ferry', 'revised'] });
  P.saveJournalEntry({ ...P.getJournalEntryIncludingDeleted(gone.id), tags: ['ferry'] });
  const t = G.graftsOf(subjectPage).sharedTags;
  ok('G7: Shared tags - each live entry sharing a tag with the subject, ONCE, with the tag; never the subject; never a trashed page',
    JSON.stringify(t.map((x) => x.title).sort()) === JSON.stringify(['Ch 4', 'Ferry dream']) && t.every((x) => typeof x.tag === 'string' && x.tag.length > 0)
      && (t.find((x) => x.title === 'Ch 4') || {}).tag === 'revised' && (t.find((x) => x.title === 'Ferry dream') || {}).placeDiffers === true,
    JSON.stringify(t));
}

// ---- G8-G10: the plan board, defaults, the paired page
{
  const plan = P.getOrCreatePlanBoard(ch3.id);
  P.saveBoardBoxes(plan.id, [...(P.getJournalEntry(plan.id).boxes || []),
    { id: 'p1', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 2, text: 'Cups at the sink' },
    { id: 'p2', kind: 'text', x: 0.4, y: 0.1, w: 0.2, h: 0.1, z: 3, text: 'The ferry light' },
    { id: 'p3', kind: 'text', x: 0.1, y: 0.4, w: 0.2, h: 0.1, z: 4, text: 'The ledger' }]);
  P.saveJournalEntry({ ...P.getJournalEntry(ch3.id), pageSettings: { ...(P.getJournalEntry(ch3.id).pageSettings || {}), size: 14 } });
  const g0 = G.planGroupOf(ch3.id);
  G.hidePlanCard(ch3.id, 'p2');
  P.flushNow();
  const s1 = stored(ch3.id);
  const g1 = G.planGroupOf(ch3.id);
  const stillOnBoard = S.boxTombstones.liveBoxes(P.getJournalEntry(plan.id).boxes).some((b) => b.id === 'p2');
  ok('G8: the plan board is ONE group - its live cards, N counts the ones not hidden; hide writes pageSettings.hiddenPlanCards and keeps every other setting; the card stays on its board',
    !!g0 && g0.boardId === plan.id && g0.count === 3 && JSON.stringify(g0.cards.map((c) => c.title)) === JSON.stringify(['Cups at the sink', 'The ferry light', 'The ledger'])
      && !!g1 && g1.count === 2 && !g1.cards.some((c) => c.boxId === 'p2') && !!s1 && JSON.stringify(s1.pageSettings && s1.pageSettings.hiddenPlanCards) === JSON.stringify(['p2'])
      && s1.pageSettings.size === 14 && stillOnBoard,
    JSON.stringify({ g0, g1, hidden: s1 && s1.pageSettings && s1.pageSettings.hiddenPlanCards, size: s1 && s1.pageSettings && s1.pageSettings.size, stillOnBoard }));
  G.unhidePlanCard(ch3.id, 'p2');
  P.flushNow();
  const g2 = G.planGroupOf(ch3.id);
  P.saveJournalEntry({ ...P.getJournalEntry(ch3.id), pageSettings: { ...P.getJournalEntry(ch3.id).pageSettings, hiddenPlanCards: ['ghost', 'p3'] } });
  P.flushNow();
  const beforeRead = JSON.stringify(stored(ch3.id).pageSettings.hiddenPlanCards);
  const g3 = G.planGroupOf(ch3.id);
  P.flushNow();
  ok('G8: unhide restores the card; a stale id (a card that is gone) is pruned on read and never written back',
    !!g2 && g2.count === 3 && !(stored(ch3.id).pageSettings.hiddenPlanCards || []).includes('p2') && !!g3 && g3.count === 2
      && JSON.stringify(stored(ch3.id).pageSettings.hiddenPlanCards) === beforeRead,
    JSON.stringify({ g2: g2 && g2.count, g3: g3 && g3.count, stored: stored(ch3.id).pageSettings.hiddenPlanCards }));
  D.setUserPageDefaults({ ...P.getJournalEntry(ch3.id).pageSettings, hiddenPlanCards: ['p1'] });
  const def = D.getUserPageDefaults();
  ok('G9: "Set as my default" never carries hiddenPlanCards (dressOnly strips it, as it strips kind, styleGuide and template)',
    !!def && !('hiddenPlanCards' in def) && def.size === 14, JSON.stringify(def));
  const paired = G.pairedPageRow(plan.id);
  ok('G10: a board\'s paired page, for the top of its Grafts (the plan relation, not a graft)', !!paired && paired.entryId === ch3.id && paired.title === 'Ch 3', JSON.stringify(paired));
}

// ---- G11-G12: X then Undo; shells
{
  const rec = links(ch3.id).find((l) => l.bEntryId === kettle.id);
  if (!rec) ok('G11 fixture: the Kettle notes graft from G3 exists to remove', false, 'no record');
  else {
    P.removePageLink(rec.id);
    const removed = !G.isGrafted(subjectPage, { entryId: kettle.id });
    const back = G.restorePageLink(rec.id);
    const again = links(ch3.id).find((l) => l.bEntryId === kettle.id);
    ok('G11: X then Undo - the same record is live again (one record, no duplicate)',
      removed && back === true && !!again && again.id === rec.id && links(ch3.id).filter((l) => l.bEntryId === kettle.id).length === 1, JSON.stringify({ removed, back, again: again && again.id, was: rec.id }));
  }
  G.graftTo(subjectPage, { entryId: odd.id });
  P.softDeleteEntry(odd.id); P.purgeEntry(odd.id);
  const g = G.graftsOf(subjectPage);
  const r = G.searchGraftables('', subjectPage);
  const all = [...g.Cards, ...g.Sources, ...g.Boards, ...g.Pages, ...r.Cards, ...r.Pages, ...r.Boards];
  ok('G12: a purged entry is never a row - not in the search, not in the groups', !all.some((x) => x.entryId === odd.id || x.entryId === shell.id) && all.length > 0, JSON.stringify(all.length));
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 500)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nBIG-PROJECTS-3-CHECK VERIFY: PASS (${checks.length} checks)` : `\nBIG-PROJECTS-3-CHECK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
