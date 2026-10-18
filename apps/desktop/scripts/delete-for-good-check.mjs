// DELETE FOR GOOD - THE CLIENT, CHECKED WITHOUT A BROWSER (plan docs/plans/delete-for-good.md, cleared Oct 18 with Fable's two changes).
// The app's REAL store modules (scripts/lib/client-node.mjs), one device, no server:
//   P1-P2   purge only from Trash; a purged page leaves Trash and every reader, as a shell (id + times, no words), marked to sync
//   P3      EVERY reader skips a shell - the readers are listed and each is asked (a guard that names what it covers)
//   P4-P7   the references: pins and their connectors purge-marked, plan pairing undone both ways, a binder's last page cleared, a purged
//           binder's live pages re-homed loose, its scratch draft emptied and its sessions unpointed
//   P8      Empty Trash: every trashed page, board and card, and the count it reports
//   P9-P10  a purge from elsewhere beats a local unsynced edit and clears its dirty flag - pulled, or ACKNOWLEDGED by the server (change 2)
//   P11-P13 THE GATE (change 1): a bare call to window.wrizoDelete refuses and changes nothing; the test unlock works only on a local host;
//           the confirmation unlocks only with the exact phrase AND trusted input, and only in memory (a reload forgets it)
//   P14     a page purged elsewhere is announced (the quiet line's signal, Q3)
//   P15     the sync loop applies the server's acknowledgement: the refused record's dirty flag clears and it is not pushed again
// Run: node apps/desktop/scripts/delete-for-good-check.mjs   (no browser, no box turn)
import { installClientGlobals, loadClientStore } from './lib/client-node.mjs';

installClientGlobals({ base: null, hostname: 'writer.example.com' });
const S = await loadClientStore(['boxTombstones']);
const P = S.persistence;
const G = S.destructiveGate;
const D = () => globalThis.wrizoDelete;

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const iso = () => new Date().toISOString();
const dirtyIds = () => { const d = P.getDirtyRecords(); return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, (v || []).map((r) => r.id)])); };
const isDirty = (coll, id) => (dirtyIds()[coll] || []).includes(id);
const stored = (id) => (JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === id) || null);
const flush = () => P.flushNow();
const trashPage = (text, extra = {}) => { const e = P.createJournalPage({ text, ...extra }); P.softDeleteEntry(e.id); return e.id; };

// ---- P1-P2: only from Trash; the shell
{
  const live = P.createJournalPage({ text: 'still live' });
  const refused = P.purgeEntry(live.id);
  const id = trashPage('in the trash');
  const done = P.purgeEntry(id);
  flush();
  const rec = stored(id);
  ok('P1: purge REFUSES a live page (Trash first, always) and accepts a trashed one', refused === false && P.getJournalEntry(live.id) && done === true, JSON.stringify({ refused, done }));
  ok('P2: the purged page is a SHELL - id, times, deletedAt, purgedAt, and no words, boxes, ink or tutor - marked to sync; it is gone from Trash',
    !!rec && !!rec.purgedAt && !!rec.deletedAt && !rec.text && !rec.boxes && !rec.strokes && !rec.tutor && isDirty('journalEntries', id)
      && !P.getDeletedEntries().some((e) => e.id === id), JSON.stringify(rec));
}

// ---- P3: every reader skips a shell
{
  const binder = P.createBinder('B', 'book');
  const page = P.createJournalPage({ text: 'binder page', projectId: binder.id });
  const loose = P.createJournalPage({ text: 'loose page' });
  P.softDeleteEntry(page.id); P.purgeEntry(page.id);
  P.softDeleteEntry(loose.id); P.purgeEntry(loose.id);
  const ids = new Set([page.id, loose.id]);
  const readers = {
    getJournalEntries: () => P.getJournalEntries(), getDeletedEntries: () => P.getDeletedEntries(), getJournalPages: () => P.getJournalPages(),
    getShelfEntries: () => P.getShelfEntries(), getNotebookPages: () => P.getNotebookPages(), getAllUserBoards: () => P.getAllUserBoards(),
    getDrawerFiledPages: () => P.getDrawerFiledPages(), getBinderPages: () => P.getBinderPages(binder.id),
    getJournalEntry: () => [P.getJournalEntry(page.id), P.getJournalEntry(loose.id)].filter(Boolean),
    getJournalEntryIncludingDeleted: () => [P.getJournalEntryIncludingDeleted(page.id), P.getJournalEntryIncludingDeleted(loose.id)].filter(Boolean),
  };
  const leaks = Object.entries(readers).filter(([, r]) => (r() || []).some((e) => e && ids.has(e.id))).map(([k]) => k);
  ok(`P3: no reader lists a purged page - ${Object.keys(readers).length} readers asked: ${Object.keys(readers).join(', ')}`, leaks.length === 0 && !!stored(page.id), JSON.stringify({ leaks }));
}

// ---- P4: pins and connectors
{
  const page = P.createJournalPage({ text: 'pinned page' });
  const board = P.createBoardPage(P.createBinder('Bd', 'book').id, 'A board');
  P.pinPageToBoard(page.id, board.id, { display: true });
  const withPin = P.getJournalEntry(board.id).boxes;
  const pin = withPin.find((b) => b.kind === 'page-pin' && b.entryId === page.id);
  const card = { id: 'card1', kind: 'text', x: 0.5, y: 0.1, w: 0.2, h: 0.08, z: 9, text: 'a card' };
  const conn = { id: 'conn1', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 10, connA: 'card1', connB: pin.id };
  P.saveBoardBoxes(board.id, [...withPin, card, conn]);
  P.softDeleteEntry(page.id); P.purgeEntry(page.id); flush();
  const after = stored(board.id).boxes;
  const pinAfter = after.find((b) => b.id === pin.id);
  const connAfter = after.find((b) => b.id === 'conn1');
  const live = S.boxTombstones.liveBoxes(after);
  ok('P4: purging a pinned page purge-marks its pin AND the connector to it on the board (no dangling link stored), keeps the card, and marks the board to sync',
    !!pinAfter && !!pinAfter.purgedAt && !!connAfter && !!connAfter.purgedAt && live.some((b) => b.id === 'card1') && !live.some((b) => b.id === pin.id || b.id === 'conn1') && isDirty('journalEntries', board.id),
    JSON.stringify({ pinAfter, connAfter }));
}

// ---- P5-P6: plan pairing, a binder's last page
{
  const page = P.createJournalPage({ text: 'paired page' });
  const board = P.getOrCreatePlanBoard(page.id);
  P.softDeleteEntry(page.id); const donePage = P.purgeEntry(page.id);
  const boardStillPaired = P.getPairedPageId(board.id);
  const page2 = P.createJournalPage({ text: 'second paired page' });
  const board2 = P.getOrCreatePlanBoard(page2.id);
  P.softDeleteEntry(board2.id); const doneBoard = P.purgeEntry(board2.id);
  ok('P5: purging a paired page leaves its plan board a plain board; purging a paired board clears the page\'s planBoardId',
    donePage === true && doneBoard === true && !!board && boardStillPaired === null && !!P.getJournalEntry(board.id) && !P.getJournalEntry(page2.id).planBoardId, JSON.stringify({ boardStillPaired, page2: P.getJournalEntry(page2.id).planBoardId }));
  const binder = P.createBinder('Book', 'book');
  const bp = P.createJournalPage({ text: 'chapter', projectId: binder.id });
  P.saveProject({ ...P.getProject(binder.id), lastActivePageId: bp.id, lastActivityType: 'page' });
  P.softDeleteEntry(bp.id); P.purgeEntry(bp.id);
  ok('P6: purging the page a binder last opened clears that pointer (resume falls back to its newest page)', P.getProject(binder.id).lastActivePageId == null, JSON.stringify(P.getProject(binder.id).lastActivePageId));
}

// ---- P7: a purged binder
{
  const binder = P.createBinder('Gone', 'book');
  const livePage = P.createJournalPage({ text: 'still wanted', projectId: binder.id });
  P.saveDraft(binder.id, 'scratch words');
  P.saveSession({ id: 's1', projectId: binder.id, startedAt: iso(), words: 10, durationSec: 60, updatedAt: iso() });
  const refusedLive = P.purgeProject(binder.id);
  P.softDeleteProject(binder.id);
  const done = P.purgeProject(binder.id);
  const page = P.getJournalEntry(livePage.id);
  const session = P.getSessions().find((x) => x.id === 's1');
  ok('P7: a purged binder - refused while live; then its LIVE pages are re-homed loose (never purged with it), its scratch draft emptied, its sessions kept with no binder pointer',
    refusedLive === false && done === true && !P.getProject(binder.id) && !!page && page.projectId == null && page.origin === 'loose'
      && (P.getDraft(binder.id) == null || P.getDraft(binder.id).text === '') && !!session && session.projectId == null,
    JSON.stringify({ refusedLive, done, page: page && { projectId: page.projectId, origin: page.origin }, draft: P.getDraft(binder.id), session }));
}

// ---- P8: Empty Trash
{
  const before = { pages: P.getDeletedEntries().length, cards: P.getTrashedCards().length };
  trashPage('trash one'); trashPage('trash two');
  const board = P.createBoardPage(P.createBinder('Cards', 'book').id, 'Card board');
  P.saveBoardBoxes(board.id, [{ id: 'tc1', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.08, z: 1, text: 'a trashed card' }]);
  P.stashDeletedBoxes(board.id, ['tc1']);
  const want = before.pages + 2 + before.cards + 1;
  const n = P.emptyTrash();
  ok('P8: Empty Trash deletes every trashed page, board and card for good, and reports how many', n === want && P.getDeletedEntries().length === 0 && P.getTrashedCards().length === 0,
    JSON.stringify({ n, want, left: { pages: P.getDeletedEntries().length, cards: P.getTrashedCards().length } }));
}

// ---- P9-P10: a purge from elsewhere beats a local unsynced edit
{
  const e = P.createJournalPage({ text: 'shared page' });
  flush();
  P.patchJournalEntry(e.id, 'shared page', { text: 'my unsynced edit' });
  const wasDirty = isDirty('journalEntries', e.id);
  P.applyRemoteRecords({ journalEntries: [{ id: e.id, createdAt: e.createdAt, updatedAt: iso(), deletedAt: iso(), purgedAt: iso(), text: '' }] });
  ok('P9: a PULLED purge wins over a local unsynced edit - the page is gone here too, and the edit is never pushed (its dirty flag cleared)',
    wasDirty && !P.getJournalEntry(e.id) && !isDirty('journalEntries', e.id) && !!stored(e.id) && !!stored(e.id).purgedAt && !stored(e.id).text, JSON.stringify(stored(e.id)));
  const f = P.createJournalPage({ text: 'refused page' });
  P.patchJournalEntry(f.id, 'refused page', { text: 'an edit the server refuses' });
  P.applyAcknowledgedPurged({ journalEntries: [f.id] });
  ok('P10: an ACKNOWLEDGED purge (the server refused this push because the row is purged) does the same - shell here, dirty flag cleared',
    !P.getJournalEntry(f.id) && !isDirty('journalEntries', f.id) && !!stored(f.id) && !!stored(f.id).purgedAt, JSON.stringify(stored(f.id)));
}

// ---- P11-P13: THE GATE
{
  const p = P.createJournalPage({ text: 'must survive a console call' });
  const count = P.getJournalEntries().length;
  let refusedSoft = null, refusedEmpty = null;
  try { D().softAll(); refusedSoft = false; } catch (e) { refusedSoft = /refused/i.test(String(e && e.message)); }
  try { D().emptyTrash(); refusedEmpty = false; } catch (e) { refusedEmpty = /refused/i.test(String(e && e.message)); }
  ok('P11: a BARE call to window.wrizoDelete refuses (no in-app confirmation in this page session) and changes nothing',
    refusedSoft === true && refusedEmpty === true && !!P.getJournalEntry(p.id) && P.getJournalEntries().length === count && G.isDestructiveUnlocked() === false,
    JSON.stringify({ refusedSoft, refusedEmpty, unlocked: G.isDestructiveUnlocked() }));
  const onProd = G.unlockDestructiveForTest();
  globalThis.location.hostname = '127.0.0.1';
  const onLocal = G.unlockDestructiveForTest();
  ok('P12: the harness\'s test unlock works ONLY on a local host (127.0.0.1 / localhost) - never on a deployed origin',
    onProd === false && onLocal === true && G.isDestructiveUnlocked() === true, JSON.stringify({ onProd, onLocal }));
}
{
  const G2 = (await loadClientStore()).destructiveGate;   // a fresh module: a fresh page session
  globalThis.location.hostname = 'writer.example.com';
  const req = G2.requestDestructiveConfirm({ title: 't', lines: [], phrase: 'DELETE EVERYTHING' });
  const untrusted = G2.submitDestructiveConfirm('DELETE EVERYTHING', false);
  const wrong = G2.submitDestructiveConfirm('delete everything', true);
  const lockedAfterBad = G2.isDestructiveUnlocked();
  const right = G2.submitDestructiveConfirm('DELETE EVERYTHING', true);
  const answered = await Promise.race([req, new Promise((r) => setTimeout(() => r('timeout'), 500))]);
  const persisted = JSON.stringify({ ...Object.fromEntries(Array.from({ length: localStorage.length }, (_, i) => [localStorage.key(i), 1])) }).toLowerCase();
  ok('P13: the confirmation unlocks ONLY with the exact phrase AND trusted (writer-made) input; it answers the request; and it lives in memory only (a reload forgets it)',
    untrusted === false && wrong === false && lockedAfterBad === false && right === true && answered === true && G2.isDestructiveUnlocked() === true
      && !/destruct|unlock|confirm/.test(persisted), JSON.stringify({ untrusted, wrong, right, answered }));
}

// ---- P14: announced
{
  const heard = [];
  const off = P.subscribePurgedElsewhere((ids) => heard.push(...ids));
  const e = P.createJournalPage({ text: 'open on this device' });
  P.applyRemoteRecords({ journalEntries: [{ id: e.id, createdAt: e.createdAt, updatedAt: iso(), deletedAt: iso(), purgedAt: iso(), text: '' }] });
  off();
  ok('P14: a page purged on another device is announced here (the open page leaves, with one quiet line - Q3)', heard.includes(e.id), JSON.stringify(heard));
}

// ---- P15: the sync loop and the server's acknowledgement
{
  const e = P.createJournalPage({ text: 'pushed after a purge elsewhere' });
  const realFetch = globalThis.fetch;
  const pushed = [];
  globalThis.fetch = async (url, opts = {}) => {
    const body = JSON.parse(opts.body || '{}');
    for (const r of (body.push && body.push.journalEntries) || []) pushed.push(r.id);
    const ack = (body.push && body.push.journalEntries || []).map((r) => r.id).filter((id) => id === e.id);
    return new Response(JSON.stringify({ pull: {}, rejected: {}, acknowledgedPurged: { journalEntries: ack }, serverTime: iso() }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    await S.sync.syncOnce();
    const firstPush = pushed.filter((x) => x === e.id).length;
    await S.sync.syncOnce();
    const total = pushed.filter((x) => x === e.id).length;
    ok('P15: the sync loop takes the server\'s acknowledgement - the record becomes a shell, its dirty flag clears, and the next sync does not push it again',
      firstPush === 1 && total === 1 && !P.getJournalEntry(e.id) && !isDirty('journalEntries', e.id), JSON.stringify({ firstPush, total }));
  } finally { globalThis.fetch = realFetch; }
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 400)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nDELETE-FOR-GOOD-CHECK VERIFY: PASS (${checks.length} checks)` : `\nDELETE-FOR-GOOD-CHECK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
