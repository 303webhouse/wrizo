// MOBILE slice 1 - the phone's own queue, wired to the real store. A note counts as SENT only when THE ACCOUNT SAYS IT HOLDS ITS CARD: the account is asked, one yes or no, before anything is written and again after the push.
// The phone's own copy is not proof: the server keeps whichever copy of a Board is newer and drops an older push without a word, so a Board can read "synced" here and not hold the Card there.
// Nothing here runs on the desk: it is imported only by the companion's own entry.
import { applyRemoteRecords, getJournalEntries, getJournalEntry, saveJournalEntry } from '../store/persistence';
import { getSyncStatus, syncOnce } from '../store/sync';
import { apiSync } from '../store/api';
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

/** Does the account hold a Card with this id? One yes or no (GET /api/card-held/<id>): nothing of hers comes down. Anything but a plain answer rejects, so the note keeps waiting. */
async function accountHolds(id: string): Promise<boolean> {
  const res = await fetch('/api/card-held/' + encodeURIComponent(id), { credentials: 'include', cache: 'no-store' });
  if (!res.ok) throw new Error('could not ask the account');
  const held = ((await res.json()) as { held?: unknown }).held;
  if (typeof held !== 'boolean') throw new Error('no answer');
  return held;
}

/** This phone's own copy already has the Card: an earlier try wrote it here. */
const writtenHere = (id: string): boolean => getJournalEntries().some((e) => (e.boxes ?? []).some((b) => b.id === id));

/** Send one note. Rejects (and so leaves the note waiting) unless the account holds its Card at the end. */
export async function sendOne(note: WaitingNote): Promise<void> {
  await stillHers(note.account);
  const triedBefore = writtenHere(note.id);                       // written here on an earlier try, and never heard to have arrived
  await syncOnce();                                               // anything of hers still unsent goes first, and the desk's changes come down
  const held = await accountHolds(note.id);                       // throws with no signal, and then NOTHING is written on the phone
  if (held && !triedBefore) return;                               // the account has it already: never added again
  if (getSyncStatus() !== 'synced') throw new Error('not up to date yet');
  if (isSignedOutHere()) throw new Error('signed out');
  if (triedBefore) {
    // THE ONE TIME THE WHOLE ACCOUNT IS READ. A try that failed can leave this phone's copy behind the account's for good: the sync keeps an unsent copy over the account's and does not ask for that change again.
    // Saving over such a copy (this note now, or the next one) would bring a deleted Board back or undo a change made at the desk, so the account's copy is taken first.
    const truth = await apiSync({ lastSyncAt: null, push: {} });
    if (isSignedOutHere()) throw new Error('signed out');
    applyRemoteRecords(truth.pull);
  }
  if (held) return;                                               // taken on an earlier try whose answer was lost
  const d = deliverNote(note, UNFILED_HOME);
  if (d.result === 'held') throw new Error('no place to send it yet');   // stays waiting; the notes behind it still go
  if (d.result === 'already') {
    // the phone holds the Card and the account does not (a push that failed or was dropped as older): save the Board again so this push is the newer one
    const board = getJournalEntry(d.boardId);
    if (board) saveJournalEntry(board);
  }
  await syncOnce();
  if (!(await accountHolds(note.id))) throw new Error('not taken yet');
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
