// MOBILE slice 1 - the phone's own queue, wired to the real store. A waiting note is SENT when its Card is on the Board in her own cache (addNote: the id is the note's, so a second send adds nothing) AND the account has taken it
// (a sync that leaves the Board clean). A send that cannot say both rejects, and the note stays waiting. Nothing here runs on the desk: it is imported only by the companion's own entry.
import { getDirtyRecords } from '../store/persistence';
import { syncOnce } from '../store/sync';
import { getCurrentUser } from '../store/currentUser';
import { deliverNote } from './addNote';
import { UNFILED_HOME } from './mobileBoard';
import { createNoteQueue, wipeAllWaiting, type QueueStorage, type WaitingNote, type NoteTarget } from './noteQueue';

const storage = (): QueueStorage | null => { try { return window.localStorage; } catch { return null; } };

/** The signed-in account's queue, or null (no account, or no storage: nothing is kept for nobody). */
export function queueForSignedIn() {
  const s = storage();
  const user = getCurrentUser();
  return s && user ? createNoteQueue({ storage: s, account: user.id }) : null;
}

/** Send one note: its Card into her cache (never twice; a note whose Board is gone goes where an unfiled phone note goes), then one sync; resolves only when the Board it landed on is clean on the account. */
export async function sendOne(note: WaitingNote): Promise<void> {
  const d = deliverNote(note, UNFILED_HOME);
  if (d.result === 'held') throw new Error('no place to send it yet');   // stays waiting; the notes behind it still go
  await syncOnce();
  const dirty = getDirtyRecords().journalEntries ?? [];
  if (dirty.some((e: { id: string }) => e.id === d.boardId)) throw new Error('not taken yet');
}

/** Write a note (kept at once), then try to send it. Returns the note, still waiting if the signal is not there. */
export async function writeNote(text: string, to: NoteTarget): Promise<WaitingNote | null> {
  const q = queueForSignedIn();
  if (!q) return null;
  const note = q.make(text, to);
  if (note) void q.flush(sendOne);
  return note;
}

/** Try every waiting note again (the signal came back, or she opened the companion). */
export function sendWaiting(): Promise<unknown> {
  const q = queueForSignedIn();
  return q ? q.flush(sendOne) : Promise.resolve();
}

export function waitingNotes(): WaitingNote[] {
  return queueForSignedIn()?.waiting() ?? [];
}

/** Sign-out and a different account signing in: nothing waits on this phone any more. */
export function wipeWaitingNotes(): void {
  const s = storage();
  if (s) wipeAllWaiting(s);
}
