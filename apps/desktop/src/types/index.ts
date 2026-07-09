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

// Fragment substrate (DM1) — the keystone data model. Creative writing is a
// graph of fragments, not one string: one privileged ordered path (the spine)
// plus branches and loose fragments, joined by links — a rhizome as a data
// structure. Forward-only lives here: text is appended, runs are struck (never
// erased), fragments are reordered (never deleted). `Project.sprintText` becomes
// a derived mirror of the unstruck spine; fragments are the source of truth.
// Invisible substrate in v0.1 — no UI reads it until CW2.

// An append-only span of text. Strikethrough is the only "delete": a struck run
// stays in `content` (visible, recoverable) but drops out of derived prose.
export interface Run {
  text: string;
  struck: boolean;
}

// A rhizome side-edge — a bridge or magnetized join between two fragments.
export interface FragmentLink {
  targetId: string;
  kind: 'bridge' | 'magnetized';
  strength?: number;
}

export interface Fragment {
  id: string;
  projectId: string;
  content: Run[];            // append-only runs; characters are never deleted, runs are struck
  role: 'spine' | 'branch' | 'loose';
  spineOrder?: number;       // sparse/float index for cheap reorder (spine role only)
  parentId?: string;         // the spine fragment this branches from (branch role only)
  parentFragmentId?: string; // nullable; theme→principle→point nesting (Trellis, v0.2). One level in v0.1
  links: FragmentLink[];     // rhizome side-edges (bridges / magnetized joins)
  clusterId?: string;        // emergent grouping for Gather mode (v0.2); label-capable
  createdAt: string;
  updatedAt: string;
  // NOTE: `heat` (recency + edit-density) is DERIVED at read time, never stored.
}

// Drawer (Drawers D1) — the top of the Drawers IA, a browsable level OVER the
// existing Projects. A Project carries an optional `drawerId`; projects without
// one (or pointing at a soft-deleted drawer) render under a virtual "Unsorted"
// group, not a real Drawer row. Soft-deleted + sync-eligible like every other
// collection. Deliberately minimal: the Binder/Page/Shelf taxonomy is decided
// separately and must not be re-migrated for.
export interface Drawer {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Binder kind (B1 → F4) — the project's form / "what are you writing". Distinct
// from `type` (the domain: creative | academic | professional). Sets the project's
// shape (and later its structure scaffold + Format conventions, deferred). Absent
// on legacy projects → treated as Other / untyped. "Binder" stays backstage; the
// UI shows the project's name, never the label. F4 grows the picker into three
// domains of honest per-domain forms; `story` is reused under the "Short fiction"
// label (no redundant storage value). One shared label map (store/kindLabels.ts)
// feeds both the picker and the mirror card so they can never drift.
export type BinderKind =
  | 'book' | 'story' | 'screenplay'          // creative
  | 'essay' | 'thesis' | 'paper'             // academic
  | 'article' | 'report' | 'proposal'        // professional
  | 'other';

export interface Project {
  id: string;
  title: string;
  type: 'creative' | 'academic' | 'professional';
  kind?: BinderKind;
  storyPlanId: string | null;
  sprintText?: string;
  // Drawers D1 — the Drawer this project lives in. Absent → "Unsorted".
  drawerId?: string;
  // Creative-mode source of truth (DM1) — replaces sprintText's role. sprintText
  // is kept as a derived mirror (concat of unstruck spine runs) so the existing
  // UI and sync keep working untouched. Absent on legacy projects until migrated.
  fragments?: Fragment[];
  createdAt: string;
  updatedAt: string;
  // Resume data (A3) — stamped by the adapter on sprint/beat writes. F1 adds
  // 'page': binder Pages (B1) stamp the parent on every save, and `lastActivePageId`
  // records which Page was last edited so resume can reopen the exact chapter.
  lastActivityAt?: string;
  lastActivityType?: 'sprint' | 'beat' | 'page';
  lastActivePageId?: string;
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
  // Pages & Shelf (D2). A page's home is exactly one of three: in a Binder
  // (projectId set), on the Shelf (projectId null AND shelved), or in the Journal
  // (projectId null AND shelved falsy). `shelved` keeps Journal and Shelf as
  // distinct pools without a migration — existing entries default to the Journal.
  shelved?: boolean;
  // The Page↔Beat seam (Foundation 3) — which plot slot a page belongs to. Laid
  // now so a page can know its beat; the Plan-jump UI is a later brief.
  beatId?: string;
  // Page type (B1) — what a page IS within a project: `manuscript` (the writing
  // — chapters/scenes) vs support pages (character/worldbuilding/research/note).
  // Absent → untyped (legacy filed pages, loose journal pages). Story Structure is
  // NOT a page type — it's the project's Plan (StoryPlan/StructureBoard).
  pageType?: 'manuscript' | 'character' | 'worldbuilding' | 'research' | 'note';
  // Provenance (VW — the Voice Wall / Import door). Set when a page is born from
  // the Import-a-draft flow (the writer's own work flowing in). Metadata only —
  // the page behaves as a normal page; the header shows a quiet "Imported" tag.
  importedAt?: string;
}

// Writing-session instrumentation (A9 → F5). One row per writing session on a
// real surface. `firstKeystrokeAt` is the north-star (TTFK); F5 finally records it
// on the paths that matter — the PageEditor and authored journal pages, not just
// QuickSprint. `surface` discriminates the funnel; `deskOpenedAt` is the one-shot
// Desk→ink funnel stamp (Desk mount → the next recording session). Measurement
// only: no UI reads these. `projectId` carries the binder for a page session.
export interface SessionLog {
  id: string;
  projectId: string | null;
  startedAt: string;
  firstKeystrokeAt: string | null;
  endedAt: string | null;
  words: number;
  durationSec: number;
  // F5 — the funnel discriminator + the Desk→ink stamp. Both sync (two new
  // sessions_log columns). Absent on legacy sprint rows (no backfill).
  surface?: 'page' | 'journal' | 'sprint';
  deskOpenedAt?: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface WizardAnswers {
  genre?: string;
  length?: string;
  characterFocus?: string;
  pacing?: string;
}
