// MOBILE slice 1 (MOBILE-B, Nov 23) - NOTES THAT WAIT, AND A NOTE IS NEVER ADDED TWICE. RED FIRST: written before src/mobile/ exists, so every check below fails until the two modules are built.
// The contract these checks fix (names are the lane's own; nothing here is a word a writer sees):
//   src/mobile/noteQueue.ts   createNoteQueue({ storage, account }) -> { make(text, to), waiting(), flush(send) }   and   wipeAllWaiting(storage)
//       make() gives the note its id AT WRITE TIME, on the phone, and keeps it in `storage` at once (so a reload keeps it).
//       flush(send) sends oldest first; a send that rejects leaves the note waiting and stops the run (no signal); a send that resolves removes it.
//       wipeAllWaiting(storage) is sign-out: nothing of any account's waiting notes is left in storage.
//   src/mobile/addNote.ts     addNote(note) -> 'added' | 'already'   (a Card on a Board, whose id IS the note's id)
//   WQ-WAIT      a note written with no signal waits, survives a reload (a new queue over the same storage), sends once when the signal returns, and is gone from storage after
//   WQ-ID        the id is made when she writes it, is the same after a reload, and two notes with the same words are two notes (two ids)
//   WQ-ORDER     the waiting notes go oldest first
//   WQ-LOST-ACK  the server took the note but the answer was lost: the note stays waiting, is sent again, and the Board still holds ONE Card for it
//   WQ-TWICE     the same note arriving twice makes ONE Card (id = the note's id); a Card she deleted in between is not brought back by the second arrival
//   WQ-HERS      sign-out leaves nothing in storage; and another account on the same phone never sees, and never sends, her waiting note
//   WQ-ONLY      only a note she wrote and has not sent is kept: a sent note leaves no copy behind, and nothing but notes is kept
// NOT here yet (waiting on MOBILE's kit and on Fable's word on the Mobile Board's marker, see the report): the Mobile Board's make-and-find, a Doc's Assets as the place, the screens, the 1099/1101 px checks.
// Browserless. Run: node scripts/harness/mobile-notes-unit.mjs   (from apps/desktop)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const SRC = (p) => new URL('../../src/' + p, import.meta.url);
const lf = (s) => s.split('\r\n').join('\n');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

// ---- stand-ins: a phone's storage, and the in-memory board store (every write logged) --------------------------------------------------------------
function makeStorage() {
  const m = new Map();
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
}
function makeBoards() {
  const S = { rows: [], clock: 0 };
  const iso = () => new Date(Date.UTC(2026, 10, 23, 0, 0, S.clock++)).toISOString();
  const api = {
    getJournalEntry: (id) => { const r = S.rows.find((x) => x.id === id && !x.deletedAt); return r ? clone(r) : null; },
    saveJournalEntry: (e) => { const row = clone(e); row.updatedAt = iso(); const i = S.rows.findIndex((x) => x.id === row.id); if (i >= 0) S.rows[i] = row; else S.rows.push(row); },
    generateId: () => 'g' + (S.clock++),
    getSystemKind: () => undefined,
  };
  return { S, api };
}
const tomb = (b) => ({ ...b, deletedAt: '2026-11-23T00:00:00.000Z' });
const liveCards = (S, boardId) => ((S.rows.find((r) => r.id === boardId) || {}).boxes || []).filter((b) => b.kind === 'text' && !b.deletedAt && !b.purgedAt);

// ---- load a real source file, transpiled, its imports stubbed (an unstubbed import is a failure, never a crash) ------------------------------------------
function load(rel, mods) {
  const url = SRC(rel);
  if (!fs.existsSync(url)) return { missing: true };
  const out = ts.transpileModule(lf(fs.readFileSync(url, 'utf8')), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  try { new Function('require', 'exports', 'module', out)((p) => { if (!(p in mods)) throw new Error('unstubbed import ' + p); return mods[p]; }, module.exports, module); } catch (e) { return { error: String(e && e.message || e) }; }
  return { M: module.exports };
}
const tombstones = { isTombstoned: (b) => !!b.deletedAt, isHiddenSelf: (b) => !!(b.deletedAt || b.purgedAt), liveBoxes: (b) => (b ?? []).filter((x) => !x.deletedAt && !x.purgedAt) };
const loadQueue = () => load('mobile/noteQueue.ts', {});
const loadAdd = (api) => load('mobile/addNote.ts', { '../store/persistence': api, '../store/persistence/core': api, '../store/persistence/journal': api, '../store/persistence/entries': api, '../store/boxTombstones': tombstones });
const why = (L) => (L.missing ? 'the module does not exist yet' : L.error ? 'would not load: ' + L.error : '');
const rejects = async (p) => { try { await p; return false; } catch { return true; } };

const BOARD = 'board1';
const seedBoard = (api) => api.saveJournalEntry({ id: BOARD, text: 'Ideas', projectId: null, pageType: 'board', boxes: [], source: 'page', createdAt: '2026-11-23T00:00:00.000Z', updatedAt: '2026-11-23T00:00:00.000Z' });
const to = { kind: 'board', id: BOARD };

async function main() {
  const Q = loadQueue();
  const qwhy = why(Q);
  const mk = (storage, account = 'main') => Q.M.createNoteQueue({ storage, account });

  // WQ-WAIT
  if (qwhy) ok('WQ-WAIT a note written with no signal waits, survives a reload, sends once when the signal returns, and is gone after', false, 'src/mobile/noteQueue.ts: ' + qwhy);
  else {
    const st = makeStorage(); const sent = [];
    const q1 = mk(st); q1.make('call the printer', to);
    const failed = await rejects(q1.flush(async () => { throw new Error('offline'); }));
    const q2 = mk(st);   // a reload: a new queue over the same storage
    const stillThere = q2.waiting().length === 1 && q2.waiting()[0].text === 'call the printer';
    await q2.flush(async (n) => { sent.push(n.id); });
    const q3 = mk(st);
    ok('WQ-WAIT a note written with no signal waits, survives a reload, sends once when the signal returns, and is gone after',
      stillThere && sent.length === 1 && q3.waiting().length === 0 && st.length === 0, `stillThere=${stillThere} sent=${sent.length} left=${q3.waiting().length} storageKeys=${st.length} (offline flush ${failed ? 'rejected' : 'resolved'})`);
  }

  // WQ-ID, WQ-ORDER
  if (qwhy) { ok('WQ-ID the id is made when she writes it, stays the same after a reload, and two notes with the same words are two notes', false, 'noteQueue.ts: ' + qwhy); ok('WQ-ORDER the waiting notes go oldest first', false, 'noteQueue.ts: ' + qwhy); }
  else {
    const st = makeStorage(); const q = mk(st);
    const a = q.make('same words', to); const b = q.make('same words', to); const c = q.make('third', to);
    const after = mk(st).waiting();
    ok('WQ-ID the id is made when she writes it, stays the same after a reload, and two notes with the same words are two notes',
      typeof a.id === 'string' && a.id.length >= 8 && a.id !== b.id && after[0].id === a.id && after[1].id === b.id, `ids ${a.id} / ${b.id} / after reload ${after.map((n) => n.id).join(',')}`);
    const order = []; await mk(st).flush(async (n) => { order.push(n.text + ':' + n.id); });
    ok('WQ-ORDER the waiting notes go oldest first', order.length === 3 && order[0].startsWith('same words') && order[2].startsWith('third') && order[0] === 'same words:' + a.id && order[1] === 'same words:' + b.id, order.join(' | '));
    void c;
  }

  // WQ-TWICE, WQ-LOST-ACK
  {
    const { S, api } = makeBoards(); seedBoard(api);
    const A = loadAdd(api); const awhy = why(A);
    if (awhy) { ok('WQ-TWICE the same note arriving twice makes ONE Card, and a Card she deleted in between is not brought back', false, 'src/mobile/addNote.ts: ' + awhy); }
    else {
      const note = { id: 'n-aaa-111', text: 'a thought on the walk', madeAt: '2026-11-23T01:00:00.000Z', to };
      const r1 = A.M.addNote(note); const r2 = A.M.addNote(note);
      const one = liveCards(S, BOARD).filter((b) => b.id === note.id);
      const firstOk = r1 === 'added' && r2 === 'already' && one.length === 1 && one[0].text === note.text && (S.rows[0].boxes || []).filter((b) => b.id === note.id).length === 1;
      // deleted between the two arrivals: the id is still on the board as a tombstone; the second arrival must not make it live again
      const { S: S2, api: api2 } = makeBoards(); seedBoard(api2); const A2 = loadAdd(api2);
      A2.M.addNote(note); const row = S2.rows[0]; row.boxes = row.boxes.map((b) => (b.id === note.id ? tomb(b) : b));
      const r3 = A2.M.addNote(note);
      const resurrected = liveCards(S2, BOARD).some((b) => b.id === note.id) || S2.rows[0].boxes.filter((b) => b.id === note.id).length !== 1;
      // and a purged marker (deleted for good) is the same
      const { S: S3, api: api3 } = makeBoards(); seedBoard(api3); const A3 = loadAdd(api3);
      A3.M.addNote(note); S3.rows[0].boxes = S3.rows[0].boxes.map((b) => (b.id === note.id ? { id: b.id, kind: b.kind, x: 0, y: 0, w: 0, h: 0, z: 0, purgedAt: '2026-11-23T00:00:00.000Z' } : b));
      A3.M.addNote(note);
      const purgedBack = liveCards(S3, BOARD).some((b) => b.id === note.id);
      ok('WQ-TWICE the same note arriving twice makes ONE Card, and a Card she deleted in between is not brought back', firstOk && r3 === 'already' && !resurrected && !purgedBack,
        `first=${r1}/${r2} liveCopies=${one.length} afterDelete=${r3} resurrected=${resurrected} afterPurge=${purgedBack ? 'back' : 'stays gone'}`);
    }
    // WQ-LOST-ACK: the queue and the board together
    if (qwhy || awhy) ok('WQ-LOST-ACK the server took the note but the answer was lost: it is sent again and the Board still holds ONE Card', false, qwhy ? 'noteQueue.ts: ' + qwhy : 'addNote.ts: ' + awhy);
    else {
      const { S: S4, api: api4 } = makeBoards(); seedBoard(api4); const A4 = loadAdd(api4);
      const st = makeStorage(); const q = mk(st); const n = q.make('lost answer', to);
      let calls = 0;
      const lossy = async (note) => { calls += 1; A4.M.addNote(note); if (calls === 1) throw new Error('signal dropped after the server took it'); };
      await rejects(q.flush(lossy));
      const heldAfterDrop = mk(st).waiting().length === 1;
      await mk(st).flush(lossy);
      ok('WQ-LOST-ACK the server took the note but the answer was lost: it is sent again and the Board still holds ONE Card',
        heldAfterDrop && calls === 2 && liveCards(S4, BOARD).length === 1 && liveCards(S4, BOARD)[0].id === n.id && mk(st).waiting().length === 0, `heldAfterDrop=${heldAfterDrop} sends=${calls} cards=${liveCards(S4, BOARD).length}`);
    }
  }

  // WQ-INDEPENDENT (Fable, Nov 24: each waiting note sends on its own; one never blocks the rest)
  if (qwhy) ok('WQ-INDEPENDENT a note that cannot be sent never blocks the notes behind it, and is still waiting afterwards', false, 'noteQueue.ts: ' + qwhy);
  else {
    const st = makeStorage(); const q = mk(st);
    const a = q.make('first', to); const b = q.make('second (fails)', to); const c = q.make('third', to);
    const got = [];
    const r1 = await q.flush(async (n) => { if (n.id === b.id) throw new Error('refused'); got.push(n.id); });
    const stillB = mk(st).waiting().map((n) => n.id);
    const r2 = await mk(st).flush(async (n) => { got.push(n.id); });
    ok('WQ-INDEPENDENT a note that cannot be sent never blocks the notes behind it, and is still waiting afterwards',
      got.join() === [a.id, c.id, b.id].join() && stillB.length === 1 && stillB[0] === b.id && r1.sent === 2 && r1.left === 1 && r2.left === 0 && mk(st).waiting().length === 0,
      `first run sent ${r1.sent}, left ${r1.left}; waiting after = ${stillB.length}; second run sent ${r2.sent}; order ${got.length}`);
  }

  // WQ-GONE / WQ-HELD (Fable, Nov 24: a note whose Board is gone goes where an unfiled phone note goes, and is never lost)
  {
    const mkHome = (api, S) => { const made = []; return { made, find: () => { const b = S.rows.find((r) => r.id === 'mobile1' && !r.deletedAt); return b ? b.id : null; }, make: () => { api.saveJournalEntry({ id: 'mobile1', text: 'Mobile', projectId: null, pageType: 'board', boxes: [], source: 'page', createdAt: '2026-11-23T00:00:00.000Z', updatedAt: '2026-11-23T00:00:00.000Z' }); made.push('mobile1'); return 'mobile1'; } }; };
    const { S, api } = makeBoards(); seedBoard(api);
    const A = loadAdd(api); const awhy = why(A);
    if (awhy || typeof (A.M || {}).deliverNote !== 'function') {
      const detail = awhy ? 'addNote.ts: ' + awhy : 'addNote.ts has no deliverNote yet';
      ok('WQ-GONE a note whose Board is gone lands once on the home of unfiled phone notes, and is not added twice', false, detail);
      ok('WQ-HELD with no home to go to, a note whose Board is gone is held (never lost) and the notes behind it still send', false, detail);
    } else {
      const note = { id: 'n-gone-1', text: 'the board went away', madeAt: '2026-11-23T02:00:00.000Z', to };
      S.rows.find((r) => r.id === BOARD).deletedAt = '2026-11-23T01:00:00.000Z';
      const home = mkHome(api, S);
      const d1 = A.M.deliverNote(note, home); const d2 = A.M.deliverNote(note, home);
      const cardsOnHome = liveCards(S, 'mobile1').filter((b) => b.id === note.id);
      ok('WQ-GONE a note whose Board is gone lands once on the home of unfiled phone notes, and is not added twice',
        d1.result === 'added' && d1.boardId === 'mobile1' && d2.result === 'already' && cardsOnHome.length === 1 && cardsOnHome[0].text === note.text && home.made.length === 1,
        `first=${d1.result}@${d1.boardId} second=${d2.result} cards=${cardsOnHome.length} homesMade=${home.made.length}`);
      // held: no home available; and through the queue, the next note (to a Board that exists) still goes
      const { S: S2, api: api2 } = makeBoards(); seedBoard(api2); api2.saveJournalEntry({ id: 'good', text: 'Good', projectId: null, pageType: 'board', boxes: [], source: 'page', createdAt: 'x', updatedAt: 'x' });
      const A2 = loadAdd(api2); S2.rows.find((r) => r.id === BOARD).deletedAt = '2026-11-23T01:00:00.000Z';
      const st = makeStorage(); const q = mk(st);
      const lost = q.make('stranded', to); const fine = q.make('fine', { kind: 'board', id: 'good' });
      await q.flush(async (n) => { const d = A2.M.deliverNote(n, null); if (d.result === 'held') throw new Error('held'); });
      const waitingIds = mk(st).waiting().map((n) => n.id);
      ok('WQ-HELD with no home to go to, a note whose Board is gone is held (never lost) and the notes behind it still send',
        waitingIds.length === 1 && waitingIds[0] === lost.id && liveCards(S2, 'good').some((b) => b.id === fine.id) && !S2.rows.some((r) => (r.boxes || []).some((b) => b.id === lost.id)),
        `waiting=${waitingIds.length} (the stranded one: ${waitingIds[0] === lost.id}) fineLanded=${liveCards(S2, 'good').some((b) => b.id === fine.id)}`);
    }
  }

  // WQ-DOCPLACE (Fable, Nov 24: choosing a Doc offers THAT Doc's own connected Boards; one -> the note lands there; several -> she picks; none -> "this Doc has no Board yet" and she picks a Board or leaves it unfiled; never a per-Doc Mobile Board)
  {
    const rows = [
      { id: 'b-filed', pageType: 'board', projectId: 'docA', text: 'Filed in A', updatedAt: '2026-11-23T05:00:00.000Z', boxes: [] },
      { id: 'b-linked', pageType: 'board', projectId: null, text: 'Linked to A', updatedAt: '2026-11-23T06:00:00.000Z', boxes: [] },
      { id: 'b-card-only', pageType: 'board', projectId: null, text: 'Only one card of it is an asset', updatedAt: '2026-11-23T04:00:00.000Z', boxes: [] },
      { id: 'b-plan', pageType: 'board', projectId: 'docA', text: 'A plan face', updatedAt: '2026-11-23T07:00:00.000Z', boxes: [] },
      { id: 'b-sys', pageType: 'board', projectId: 'docA', text: 'Journal', origin: 'system', updatedAt: '2026-11-23T07:30:00.000Z', boxes: [{ id: 'm', kind: 'board-meta', systemKind: 'journal', x: 0, y: 0, w: 0, h: 0, z: 0 }] },
      { id: 'b-dead', pageType: 'board', projectId: 'docA', text: 'Deleted', deletedAt: '2026-11-23T01:00:00.000Z', updatedAt: '2026-11-23T08:00:00.000Z', boxes: [] },
      { id: 'b-other', pageType: 'board', projectId: 'docB', text: 'Filed in B', updatedAt: '2026-11-23T09:00:00.000Z', boxes: [] },
      { id: 'page1', pageType: 'manuscript', projectId: 'docA', text: 'A part', updatedAt: '2026-11-23T03:00:00.000Z', planBoardId: 'b-plan' },
    ];
    const projects = { docA: { id: 'docA', docSettings: { assets: [{ entryId: 'b-linked', at: 'x' }, { entryId: 'b-card-only', boxId: 'c1', at: 'x' }, { entryId: 'page1', at: 'x' }] } }, docB: { id: 'docB' }, docEmpty: { id: 'docEmpty', docSettings: {} } };
    const persistence = { getJournalEntries: () => rows.filter((r) => !r.deletedAt), getProject: (id) => projects[id] ?? null, getSystemKind: (e) => (e.boxes || []).find((b) => b.kind === 'board-meta')?.systemKind, isPairedPlanBoard: (id) => rows.some((r) => r.planBoardId === id) };
    const D = load('mobile/docBoards.ts', { '../store/persistence': persistence });
    if (D.missing || D.error || typeof D.M.placesOfDoc !== 'function') ok('WQ-DOCPLACE a Doc offers its own connected Boards: one lands, several are picked from, none says so', false, 'src/mobile/docBoards.ts: ' + (D.missing ? 'the module does not exist yet' : D.error || 'no placesOfDoc'));
    else {
      const many = D.M.placesOfDoc('docA');
      const one = D.M.placesOfDoc('docB');
      const none = D.M.placesOfDoc('docEmpty');
      const ghost = D.M.placesOfDoc('nope');
      const ids = (many.boards || []).map((b) => b.id);
      ok('WQ-DOCPLACE a Doc offers its own connected Boards: one lands, several are picked from, none says so',
        many.kind === 'many' && ids.join() === 'b-linked,b-filed' && one.kind === 'one' && one.board.id === 'b-other' && none.kind === 'none' && ghost.kind === 'none',
        `A -> ${many.kind}[${ids.join(',')}] (the plan face, the system board, the deleted one, the one-card asset and the page are not offered); B -> ${one.kind}; empty -> ${none.kind}; unknown -> ${ghost.kind}`);
    }
  }

  // WQ-HERS, WQ-ONLY
  if (qwhy) { ok('WQ-HERS sign-out leaves nothing in storage; another account never sees or sends her waiting note', false, 'noteQueue.ts: ' + qwhy); ok('WQ-ONLY only her own unsent notes are kept, and nothing but notes', false, 'noteQueue.ts: ' + qwhy); }
  else {
    const st = makeStorage(); st.setItem('unrelated.setting', 'kept');
    const main = mk(st, 'main'); main.make('only mine', to);
    // another account signs in on the same phone BEFORE any sign-out (a shared phone, a missed sign-out): sees nothing, sends nothing
    const sample = mk(st, 'sample'); const sentBySample = [];
    await sample.flush(async (n) => { sentBySample.push(n.id); });
    const seesNone = sample.waiting().length === 0 && sentBySample.length === 0;
    const mainStill = mk(st, 'main').waiting().length === 1;
    // sign-out wipes every waiting note, of any account, and touches nothing else
    Q.M.wipeAllWaiting(st);
    const gone = mk(st, 'main').waiting().length === 0 && mk(st, 'sample').waiting().length === 0;
    const onlyOther = [...st.m.keys()].every((k) => k === 'unrelated.setting');
    ok('WQ-HERS sign-out leaves nothing in storage; another account never sees or sends her waiting note', seesNone && mainStill && gone && onlyOther,
      `otherSees=${sample.waiting().length} otherSent=${sentBySample.length} hers=${mainStill ? 'kept until sign-out' : 'lost early'} afterSignOut=${gone ? 'none' : 'left'} stray keys=${[...st.m.keys()].filter((k) => k !== 'unrelated.setting').join(',') || 'none'}`);
    const st2 = makeStorage(); const q = mk(st2); q.make('one', to); q.make('two', to);
    await q.flush(async () => {});
    const noCopy = [...st2.m.values()].every((v) => !/one|two/.test(v));
    const st3 = makeStorage(); mk(st3).make('secret-ish words', to);
    const kinds = [...st3.m.keys()];
    ok('WQ-ONLY only her own unsent notes are kept, and nothing but notes', noCopy && st2.length === 0 && kinds.length === 1, `after send: keys=${st2.length}, copy=${noCopy ? 'none' : 'left'}; one waiting note uses ${kinds.length} key(s)`);
  }

  const bad = checks.filter((c) => !c.pass);
  for (const c of checks) console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.detail ? '  [' + c.detail + ']' : ''));
  console.log(`\n${checks.length - bad.length}/${checks.length} pass`);
  process.exit(bad.length ? 1 : 0);
}
main().catch((e) => { console.log('FAIL the check itself did not finish: ' + (e && e.message || e)); process.exit(1); });
