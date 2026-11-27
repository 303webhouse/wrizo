// MOBILE slice 1, item 3 - NOTES THAT WAIT (Nick, M7a: "a note made with no signal is kept on the phone and sent later"). Pure: no screen, no word, no store of Wrizo's own.
// Three laws (Fable, Nov 23):
//   1. A note is never added twice. Its id is made HERE, on the phone, when she writes it, and travels with the note for good; the place that receives it (addNote.ts) treats a second arrival of the same id as the same note.
//   2. A waiting note is hers alone: kept under her account's own key, stamped with her account, never read or sent by another account on the same phone, and wiped at sign-out (wipeAllWaiting).
//   3. Only her own unsent notes are kept. A sent note leaves no copy; nothing but notes is stored; an empty queue leaves no key behind.
// The queue lives in the phone's own storage only. It is never synced and never reaches the server except as the note being sent.

export type NoteTarget = { kind: 'board'; id: string } | { kind: 'assets'; id: string } | { kind: 'unfiled' };

export interface WaitingNote {
  id: string;            // made on the phone at write time; the Card's own id when it lands
  text: string;
  to: NoteTarget;
  madeAt: string;        // ISO
  account: string;       // whose note it is
}

/** The part of the browser's Storage the queue uses (so a check can hand it a stand-in). */
export interface QueueStorage {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
  key(i: number): string | null;
  readonly length: number;
}

export const WAITING_KEY_PREFIX = 'wrizo.mobile.waiting.';
/** The one other thing kept with the queue: which account the waiting notes are tagged with, so a phone with no signal still knows whose notes it holds. An id only; it goes with the notes at sign-out. */
export const ACCOUNT_POINTER_KEY = 'wrizo.mobile.account';

const keyOf = (account: string): string => WAITING_KEY_PREFIX + account;

function makeNoteId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return 'n-' + c.randomUUID();
  return 'n-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
}

function isNote(v: unknown): v is WaitingNote {
  const n = v as WaitingNote | null;
  return !!n && typeof n.id === 'string' && typeof n.text === 'string' && typeof n.madeAt === 'string' && typeof n.account === 'string' && !!n.to && typeof n.to === 'object';
}

export interface FlushResult { sent: number; left: number; stopped: boolean }

export function createNoteQueue({ storage, account }: { storage: QueueStorage; account: string }) {
  const key = keyOf(account);
  let running: Promise<FlushResult> | null = null;

  // Read fresh every time: a reload, a second tab and a flush all see the one truth in storage. Only this account's notes ever come back.
  const read = (): WaitingNote[] => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { notes?: unknown };
      return (Array.isArray(parsed.notes) ? parsed.notes : []).filter(isNote).filter((n) => n.account === account);
    } catch { return []; }
  };
  const write = (notes: WaitingNote[]): void => {
    if (notes.length === 0) { storage.removeItem(key); return; }
    storage.setItem(key, JSON.stringify({ v: 1, notes }));
  };

  /** She writes a note: it gets its id now and is kept at once (so a dropped signal or a reload cannot lose it). A blank note is not a note. */
  function make(text: string, to: NoteTarget): WaitingNote | null {
    if (!text.trim()) return null;
    const note: WaitingNote = { id: makeNoteId(), text, to, madeAt: new Date().toISOString(), account };
    write(read().concat([note]));
    return note;
  }

  /** Her unsent notes, oldest first. */
  const waiting = (): WaitingNote[] => read();

  /** Send what waits, oldest first. EACH NOTE SENDS ON ITS OWN (Fable, Nov 24): a note leaves the queue only after its own send resolves; one that rejects (no signal, a lost answer, no place to go yet) stays waiting
   *  and the run goes on to the next, so one note never blocks the rest. `stopped` says at least one stayed. One run at a time. */
  function flush(send: (note: WaitingNote) => Promise<void>): Promise<FlushResult> {
    if (running) return running;
    running = (async (): Promise<FlushResult> => {
      let sent = 0;
      let stopped = false;
      for (const note of read()) {
        try { await send(note); } catch { stopped = true; continue; }
        write(read().filter((n) => n.id !== note.id));
        sent += 1;
      }
      return { sent, left: read().length, stopped };
    })().finally(() => { running = null; });
    return running;
  }

  return { make, waiting, flush };
}

/** A different account is signed in: every waiting note that is not that account's goes (hers is kept). */
export function wipeWaitingExcept(storage: QueueStorage, account: string): void {
  const doomed: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const k = storage.key(i);
    if (k && k.startsWith(WAITING_KEY_PREFIX) && k !== keyOf(account)) doomed.push(k);
  }
  for (const k of doomed) storage.removeItem(k);
}

/** Sign-out: every waiting note on this phone, of any account, goes. Nothing else in storage is touched. */
export function wipeAllWaiting(storage: QueueStorage): void {
  const doomed: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const k = storage.key(i);
    if (k && k.startsWith(WAITING_KEY_PREFIX)) doomed.push(k);
  }
  for (const k of doomed) storage.removeItem(k);
  storage.removeItem(ACCOUNT_POINTER_KEY);
}
