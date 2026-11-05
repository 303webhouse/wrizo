import type { JournalEntry, ScriptDoc, TutorThread, TutorMessage } from '../../types';
import { serializeScriptDoc } from '../scriptText';
import { createEmptyScriptDoc } from '../scriptDoc';
import { generateId } from './core';
import { saveJournalEntry } from './journal';
import { getJournalEntry } from './entries';

// --- S1 — the Screenplay Room's document (fragments-canon §2) -------------
// One jsonb column, exactly the `boxes` recipe. `getScriptDoc` is a plain
// read; `saveScriptDoc` writes the doc AND its derived `entry.text` shadow in
// ONE call (canon §2.4) — resume, the mirror card, and future search read
// the shadow, never the jsonb directly.

export function getScriptDoc(entryId: string): ScriptDoc | null {
  return getJournalEntry(entryId)?.script ?? null;
}

export function saveScriptDoc(entryId: string, doc: ScriptDoc): void {
  const latest = getJournalEntry(entryId);
  if (!latest) return;
  saveJournalEntry({ ...latest, script: doc, text: serializeScriptDoc(doc) });
}

// --- TU1 S1 — the Tutor's per-page conversation thread --------------------
// One jsonb column, the exact `script`/`boxes` recipe once more. A plain
// read (getTutorThread); appendTutorMessage is the ONLY writer — there is
// no "create an empty thread" call anywhere in this file, deliberately: a
// page that has never talked to the Tutor must never gain a persisted
// `{ messages: [] }` (a subtly different, wrong "grandfathered" state from
// genuinely absent) — the thread is born on its first real message and not
// one keystroke sooner. Any page can carry one, independent of pageType.

export function getTutorThread(entryId: string): TutorThread | null {
  return getJournalEntry(entryId)?.tutor ?? null;
}

export function appendTutorMessage(entryId: string, message: TutorMessage): TutorThread | null {
  const latest = getJournalEntry(entryId);
  if (!latest) return null;
  // TU2 S2 — spread the existing thread first, THEN override `messages`:
  // this function predates the `lastRead` cursor field, and the original
  // `{ messages: [...] }` reconstruction here would silently zero the
  // cursor on every append (writer AND tutor replies both call this) —
  // the exact opposite of "advances only on a successful send." Spreading
  // `latest.tutor` (a no-op when it's undefined) is the whole fix.
  const thread: TutorThread = { ...latest.tutor, messages: [...(latest.tutor?.messages ?? []), message] };
  saveJournalEntry({ ...latest, tutor: thread });
  return thread;
}

// TU2 S2 — the listener's cursor. Advances `lastRead` ONLY (never touches
// `messages`) and ONLY on a thread that already exists: a cursor can only
// ever advance after at least one message has already been sent (this
// file's own getTutorThread/appendTutorMessage invariant that a thread is
// born on its first real message, never sooner), so there is no "create a
// thread just to seed a cursor" path here — a no-op on a never-messaged
// page, mirroring appendTutorMessage's own refusal to conjure a thread
// out of nothing. `at` is an ordinary `new Date()` read — real wall-clock
// time, no fixture/harness indirection needed here (this runs only from
// live application code, on a real successful reply).
export function advanceTutorCursor(entryId: string, chars: number): void {
  const latest = getJournalEntry(entryId);
  if (!latest?.tutor) return;
  const thread: TutorThread = { ...latest.tutor, lastRead: { at: new Date().toISOString(), chars } };
  saveJournalEntry({ ...latest, tutor: thread });
}

// Create a Script page (S1 Slice 2) — a binder page with pageType:'script'
// and a fresh one-scene ScriptDoc, mirroring createBoardPage's shape exactly.
// `entry.text` is seeded from the (empty) doc's own shadow, not a separate
// title field — F4's title-later law, reused rather than inventing a second
// naming convention.
export function createScriptPage(binderId: string): JournalEntry {
  const now = new Date().toISOString();
  const doc = createEmptyScriptDoc();
  const entry: JournalEntry = {
    id: generateId(),
    text: serializeScriptDoc(doc),
    projectId: binderId,
    pageType: 'script',
    script: doc,
    source: 'page',
    // AB3 S4 — a project door (new screenplay from a project): homes in the
    // project; the Journal never sees it.
    origin: 'project',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}
