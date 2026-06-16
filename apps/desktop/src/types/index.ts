export interface Beat {
  id: string;
  name: string;
  order: number;
  prompt: string;
  act?: number;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  tags: string[];
  beats: Beat[];
}

export interface BeatNote {
  beatId: string;
  notes: string[];
  status: 'empty' | 'started' | 'complete';
}

export interface StoryPlan {
  id: string;
  projectId: string;
  frameworkId: string;
  beatNotes: BeatNote[];
  currentBeatId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  type: 'creative' | 'academic';
  storyPlanId: string | null;
  sprintText?: string;
  createdAt: string;
  updatedAt: string;
  // Resume data (A3) — stamped by the adapter on sprint/beat writes.
  lastActivityAt?: string;
  lastActivityType?: 'sprint' | 'beat';
  // Soft delete — rows that must sync are never hard-deleted (see storage adapter / sync).
  deletedAt?: string;
}

// Autosaved writing buffer (A1). One record per writing surface, keyed by
// `projectId ?? 'scratch'`. The committed text still lives on Project.sprintText
// / BeatNote.notes; a draft is the unsaved work-in-progress that must survive a
// crash or tab close.
export interface Draft {
  id: string; // projectId or 'scratch'
  text: string;
  updatedAt: string;
}

// Ink on a journal page (J8) — pure geometry, no style. A journal entry can
// carry hand-drawn strokes alongside its text; the entry's text is never
// touched, so J4 search, J2 routing, and the entryText helpers keep working.
// One pen: colour and width are render-time constants (J9), never stored per
// stroke. Coordinates are device-independent (normalized by the sheet at
// capture time, J9's call) so a page drawn on a tablet renders faithfully on a
// laptop or phone. Plain serializable data — no functions or handles — so
// strokes cache, queue, sync, and soft-delete exactly like the rest of the
// record (whole-record write; saveJournalEntry needs no change).
export interface StrokePoint {
  x: number;
  y: number;
  p?: number; // pressure 0..1; absent when the device reports none
}

export interface Stroke {
  points: StrokePoint[];
}

// Journal entry (J1) — a permanent, timestamped record of a completed sprint's
// text. Unlike a Draft (the volatile in-flight buffer, overwritten by the next
// sprint), a Journal entry is never cleared: it is the complete chronological
// substrate from which projects are later cultivated (J2). `projectId` records
// the sprint's context at completion — null for a scratch sprint — and is never
// rewritten afterward (the project gets its own working copy; the entry stays
// whole). `sessionId` links the A9 session row when the sprint was also saved.
// Soft-deleted and sync-eligible by inheriting the adapter machinery exactly.
export interface JournalEntry {
  id: string;
  text: string; // same serialization Quick Sprint writes to the drafts buffer
  projectId: string | null;
  sessionId?: string;
  createdAt: string; // set once on commit, never mutated
  updatedAt: string;
  deletedAt?: string;
  // Emergent organization (J6) — light, optional, never forced. All additive and
  // synced via the existing journalEntries path; the entry's text is never
  // touched. `routedProjectIds` records which projects a scrap has been
  // cultivated into (J2 stamps it), closing the double-route gap.
  starred?: boolean;
  tags?: string[];
  routedProjectIds?: string[];
  // Hand-drawn ink (J8) — additive and optional; absent on every existing entry
  // and on sprint-finish captures (which stay text-only). The capture surface
  // (J9) reads/writes this field; this ticket fixes only the shape.
  strokes?: Stroke[];
  // Authored-page marker (J10) — additive, absent on captures. A capture (a
  // finished sprint) keeps read-only text + ink annotation; an authored page is
  // a blank sheet opened to write on directly (editable text + ink). The J6
  // additive pattern: rides existing persistence/sync, never touches text.
  source?: 'page';
}

// Writing-session instrumentation (A9). The collection is wired through the
// storage adapter now so sync (W2) has it; recording logic lands with A9.
export interface SessionLog {
  id: string;
  projectId: string | null;
  startedAt: string;
  firstKeystrokeAt: string | null;
  endedAt: string | null;
  words: number;
  durationSec: number;
  updatedAt: string;
  deletedAt?: string;
}

export interface WizardAnswers {
  genre?: string;
  length?: string;
  characterFocus?: string;
  pacing?: string;
}
