// MOBILE slice 1 - the phone's own queue, wired to the real store. A note counts as SENT only when THE ACCOUNT SAYS IT HOLDS ITS CARD: the account is asked before anything is written and again after the push.
// The phone's own copy is not proof: the server keeps whichever copy of a Board is newer and drops an older push without a word, so a Board can read "synced" here and not hold the Card there.
// Nothing here runs on the desk: it is imported only by the companion's own entry.
import { applyRemoteRecords, getJournalEntry, saveJournalEntry } from '../store/persistence';
import { getSyncStatus, syncOnce } from '../store/sync';
import { apiSync, type SyncResponse } from '../store/api';
import { getCurrentUser } from '../store/currentUser';
import { isSignedOutHere } from '../store/signedOutHere';
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

/** The phone's session is still the account that wrote the note (another window may have signed out and another account in since). Rejects with no signal. */
async function stillHers(account: string): Promise<void> {
  if (isSignedOutHere()) throw new Error('signed out');
  const res = await fetch('/auth/me', { credentials: 'include' });
  if (!res.ok) throw new Error('not signed in');
  if (((await res.json()) as { id?: string }).id !== account) throw new Error('another account');
}

/** Does anything the account sent back hold a Card with this id, on any Board (live, deleted, or a Card deleted in place)? Then the note has arrived, and is never added again. */
const holds = (r: SyncResponse, id: string): boolean => (r.pull.journalEntries ?? []).some((e) => (e.boxes ?? []).some((b) => b.id === id));

/** Send one note. Rejects (and so leaves the note waiting) unless the account holds its Card at the end. */
export async function sendOne(note: WaitingNote): Promise<void> {
  await stillHers(note.account);
  await syncOnce();                                               // anything of hers still unsent goes first
  const truth = await apiSync({ lastSyncAt: null, push: {} });    // what the account holds NOW; throws with no signal, and then NOTHING is written on the phone
  if (holds(truth, note.id)) return;                              // taken on an earlier try whose answer was lost
  if (getSyncStatus() !== 'synced') throw new Error('not up to date yet');
  if (isSignedOutHere()) throw new Error('signed out');
  // The phone's copy takes the account's, so "which Board is Mobile" and "is that Board gone" are read from today's truth. This matters after a push that failed: the sync keeps this device's unsent copy over
  // the account's while it is unsent, so a Board deleted or changed at the desk meanwhile is taken here, before anything is saved over it (a Card already on the phone's copy is merged in, never dropped).
  applyRemoteRecords(truth.pull);
  const d = deliverNote(note, UNFILED_HOME);
  if (d.result === 'held') throw new Error('no place to send it yet');   // stays waiting; the notes behind it still go
  if (d.result === 'already') {
    // the phone holds the Card and the account does not (a push that failed or was dropped as older): save the Board again so this push is the newer one
    const board = getJournalEntry(d.boardId);
    if (board) saveJournalEntry(board);
  }
  await syncOnce();
  const after = await apiSync({ lastSyncAt: truth.serverTime, push: {} });
  if (!holds(after, note.id)) throw new Error('not taken yet');
}

/** Write a note (kept on the phone at once), then try to send it. Null: it could NOT be kept (no account or no storage), and the caller must keep her words on the screen. */
export function writeNote(text: string, to: NoteTarget): WaitingNote | null {
  const q = queueForSignedIn();
  if (!q) return null;
  let note: WaitingNote | null;
  try { note = q.make(text, to); } catch { return null; }   // storage full or refused
  if (note) void sendWaiting();
  return note;
}

// ONE run at a time for the whole companion (each call of createNoteQueue has its own guard, so it is kept here): a note written while a run is out is picked up by the run that follows it.
let running: Promise<unknown> | null = null;
let again = false;

/** Try every waiting note again (she wrote one, the signal came back, or she opened the companion). */
export function sendWaiting(): Promise<unknown> {
  if (running) { again = true; return running; }
  const q = queueForSignedIn();
  if (!q) return Promise.resolve();
  running = q.flush(sendOne).finally(() => {
    running = null;
    if (again) { again = false; void sendWaiting(); }
  });
  return running;
}

export function waitingNotes(): WaitingNote[] {
  return queueForSignedIn()?.waiting() ?? [];
}

/** Sign-out and a different account signing in: nothing waits on this phone any more. */
export function wipeWaitingNotes(): void {
  const s = storage();
  if (s) wipeAllWaiting(s);
}
