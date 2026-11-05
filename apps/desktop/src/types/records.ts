import type { Stroke, Box } from './board';
import type { PageSettings } from './page';
import type { TutorThread, TutorBible } from './tutor';
import type { ScriptDoc } from './script';

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
  // DELETE FOR GOOD: the server always had deleted_at for plans; the client names it now, with purgedAt (see Drawer.purgedAt)
  deletedAt?: string;
  purgedAt?: string;
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
  // DELETE FOR GOOD: set when this record was deleted for good - the row is then a shell (no words), kept so nothing can bring it back
  purgedAt?: string;
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
  // TU5 S1 — the book's Bible (L4 of the Tutor's memory): durable writer-owned
  // facts, ONE additive nullable jsonb column on `projects` (the exact
  // `journal_entries.tutor` recipe, project-side). Optional for the grandfather
  // fixed point — a project never touched by the bible has no `tutor` at all
  // (absent, never null) and syncs byte-identically to today. Writer-authored
  // only; see TutorBible / Fact below.
  tutor?: TutorBible;
  // Soft delete — rows that must sync are never hard-deleted (see storage adapter / sync).
  deletedAt?: string;
  purgedAt?: string;   // DELETE FOR GOOD (see Drawer.purgedAt)
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

// Journal entry (J1) — a permanent, timestamped record of a completed sprint's
// text. Unlike a Draft (the volatile in-flight buffer, overwritten by the next
// sprint), a Journal entry is never cleared: it is the complete chronological
// substrate from which projects are later cultivated (J2). `projectId` records
// the sprint's context at completion — null for a scratch sprint — and is never
// rewritten afterward (the project gets its own working copy; the entry stays
// whole). `sessionId` links the A9 session row when the sprint was also saved.
// Soft-deleted and sync-eligible by inheriting the adapter machinery exactly.
// CONNECTOR-B - ONE LINK between two things a board's own `boxes` cannot join: an end that is an ENTRY (a page or a board), or a card on ANOTHER board. A same-board card <-> card link is NOT one of these - it is a
// 'connection' box inside the board's boxes, forever. Stored ONCE, on the entry where the writer started the link (the owner, aEntryId); the reverse is read by scanning the cache. `deletedAt` is a tombstone: a delete is a write,
// so it syncs and cannot resurrect. Rides the entry as the additive jsonb array `page_links` (server: migrate.ts / sync.ts); an entry with none has NO `pageLinks` key at all.
export interface PageLink {
  id: string;              // stable, never reused
  aEntryId: string;        // ALWAYS the entry that OWNS this record (the one whose pageLinks holds it)
  aBoxId?: string;         // a card on entry A (A is a board and this end is a card)
  bEntryId: string;        // the other end: a page or a board
  bBoxId?: string;         // a card on entry B
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface JournalEntry {
  id: string;
  text: string; // same serialization Quick Sprint writes to the drafts buffer
  projectId: string | null;
  sessionId?: string;
  createdAt: string; // set once on commit, never mutated
  updatedAt: string;
  deletedAt?: string;
  purgedAt?: string;   // DELETE FOR GOOD (see Drawer.purgedAt)
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
  // J4 — 'board' is the Board species (a canvas of positioned boxes; see
  // `boxes` below). Still not Story Structure — that stays the project's Plan.
  // S1 — 'script' is the Screenplay Room's page species (a ScriptDoc of
  // scenes; see below). Still not Story Structure — that stays the Plan.
  pageType?: 'manuscript' | 'character' | 'worldbuilding' | 'research' | 'note' | 'board' | 'script';
  // Notebook order (J1) — the loose Journal's explicit page order. Additive/
  // optional (the J6 pattern): absent → the page keeps its chronological place
  // (sort falls back to `epoch(createdAt)`), so there is no backfill or migration.
  // A sparse float (the `spineOrder` pattern) so insert-between is a midpoint.
  // Scope: the loose Journal only — binder pages + the Shelf keep their orderings.
  orderIndex?: number;
  // Provenance (VW — the Voice Wall / Import door). Set when a page is born from
  // the Import-a-draft flow (the writer's own work flowing in). Metadata only —
  // the page behaves as a normal page; the header shows a quiet "Imported" tag.
  importedAt?: string;
  // J4 — the Board's positioned content, when pageType === 'board'. A JSON
  // column exactly like strokes; absent on every non-Board page (no backfill).
  boxes?: Box[];
  // S1 — the Screenplay Room's document, when pageType === 'script'. A JSON
  // column exactly like boxes; absent on every non-script page (no backfill).
  script?: ScriptDoc;
  // TU1 S1 — the Tutor's per-page conversation thread. A JSON column
  // exactly like script/boxes; absent on every page with no thread (no
  // backfill — see the TutorThread interface above for the full
  // grandfather reasoning). Any page can carry one, regardless of pageType.
  tutor?: TutorThread;
  // AB3 S0 — the provenance law (canon amendment A2, the grandfather clause).
  // Which door a page was born through: 'journal' (Journal/Catch — homes in
  // the Journal), 'project' (a project door — homes in that project, the
  // Journal never sees it), 'loose' (the Desk's start-writing/home-base door
  // — homes nowhere, and starting there never files it). Undefined/null on
  // every existing row means "behave exactly as today" — no backfill, no
  // re-homing; this field governs creation from AB3 forward only.
  // B1 S1 — 'system' joins the union: a system Board's own origin (the
  // Journal Board, the Trash Board). Reuses this SAME existing column (zero
  // schema, a plain text field server-side, no CHECK constraint) rather than
  // inventing a new provenance seam. Load-bearing, not decorative: without an
  // explicit exclusive origin, a projectId-null/non-shelved system Board
  // would otherwise satisfy inJournalView's own legacy fallback branch below
  // (every board before this ticket always carried a projectId, so that
  // fallback's blind spot never mattered until a board could exist WITHOUT
  // one) — it would wrongly appear IN the Journal it is meant to represent,
  // and reconcile would then try to pin the Journal Board onto itself.
  // 'system' short-circuits inJournalView's `e.origin != null` branch to
  // `false`, closing that hole with no change to inJournalView's own code.
  origin?: 'journal' | 'project' | 'loose' | 'system';
  // BM1 S2 — the page⇄board pairing (THE schema addition of this ticket). A
  // page (this entry) points at its 1:1 plan Board by id; the Board's own
  // record — origin, boxes, everything — is UNTOUCHED (the back-reference is
  // derived by scan, never stored on the board), so derived Journal/Shelf/
  // Trash membership is provably unaffected by pairing. Additive, optional,
  // one nullable text column (`plan_board_id`) — the EXACT `origin`/`beatId`/
  // `script` recipe: SQL null ↔ JS undefined, absent (not `null`) on every
  // grandfathered row, so an unpaired entry is BYTE-IDENTICAL to today in
  // every non-BM1 load/edit/save/sync path (bm1.mjs proves it). The brief's
  // "reads planBoardId: null" is the logical/nullable-column reading —
  // consumers read `entry.planBoardId ?? null`; the field itself stays
  // absent-not-falsy (this file's own TutorThread grandfather discipline).
  // Lazy birth: set ONLY on a page's FIRST flip (persistence.getOrCreatePlanBoard);
  // unpair/orphan DELETE the key entirely (never set it to null), restoring
  // full byte-identity — "the page is untouched." Chosen over a `pairs` table
  // deliberately: a table would be a whole new synced collection (cache slot,
  // dirty set, server table, both mappers) — strictly MORE blast radius, not
  // cleaner (see the build report's S2 shape decision).
  planBoardId?: string;
  // ITEM 83 M2 (R6) — the page's own sheet dress, set from the writer's
  // defaults at birth and edited from the Page drawer's PAGE SETUP zone.
  // Optional and absent (never null) on every page never dressed — the same
  // grandfather fixed point planBoardId/tutor/origin keep, so an untouched
  // page reads undefined and the app's own PAGE_SETTINGS_FALLBACK governs.
  pageSettings?: PageSettings;
  // CONNECTOR-B - this entry's own link records (see PageLink). Absent on every entry that never had one.
  pageLinks?: PageLink[];
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
  // S1 — 'script' joins the funnel for the Screenplay Room, same seam.
  surface?: 'page' | 'journal' | 'sprint' | 'script';
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
