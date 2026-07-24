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
  // TU5 S1 — the book's Bible (L4 of the Tutor's memory): durable writer-owned
  // facts, ONE additive nullable jsonb column on `projects` (the exact
  // `journal_entries.tutor` recipe, project-side). Optional for the grandfather
  // fixed point — a project never touched by the bible has no `tutor` at all
  // (absent, never null) and syncs byte-identically to today. Writer-authored
  // only; see TutorBible / Fact below.
  tutor?: TutorBible;
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
  // J2 — an erase IS a stroke: same geometry, painted destination-out (ink.ts).
  // Additive/optional; absent on every ink stroke drawn before this ticket.
  eraser?: true;
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
}

// J4 — a Board's positioned content unit (I2/I3 realized): the first
// fragments-under-Pages instance, designed fragment-compatible on purpose.
// x/y/w/h are normalized to the page WIDTH (a single width unit), so a box
// transforms losslessly at any viewport; z is stacking order (new = max+1).
// `groupId` links a locked text+ink pair minted by a port — Ungroup frees
// them. Provenance (`sourceEntryId`/`portedAt`) records where a box came
// from; the Journal original it was copied from is never touched.
//
// AB4 S2 — 'page-pin': a MEMBERSHIP card, not a copy. Carries `entryId`
// (the referenced JournalEntry) and nothing else content-wise — its title/
// excerpt are always read live from the referenced entry at render time
// (BoardEditor's `BoardPinBox`), never captured, so the card can never go
// stale and the source page is never touched by pin/unpin. x/y/w/h/z behave
// exactly like a text/ink box (draggable, corner-resizable).
//
// AB4 S3 — 'connection': a hairline between two OTHER boxes, stored as a
// plain element of this SAME array rather than a new top-level field or a
// restructured `boxes` shape (see BoardEditor.tsx's own header comment for
// the zero-schema reasoning: a sibling field on JournalEntry would need a
// real new `alter table` column in this codebase's per-field-jsonb-column
// architecture, disqualifying it; wrapping `boxes` itself into
// `{items,connections}` would touch every existing box-reading call site
// AND the sync layer's column list — this is the lowest-blast-radius
// zero-schema shape). `connA`/`connB` are the two endpoint box ids;
// x/y/w/h/z are unused (always 0) — a connection's on-screen position is
// ALWAYS derived live from its endpoints' current rects, never stored, so
// moving/resizing a card drags its hairlines with it for free. Filtered out
// of every position-based board computation (maxBottom, the pointer/box
// hit-test, the text-reflow measure effect) by kind, the same discipline
// that already separates 'text' from 'ink' handling below.
//
// FX4 S4 — 'board-meta': the SAME zero-schema precedent, one more time, for
// the board canvas's own persisted (user-dragged) pixel dimensions.
// Considered and rejected: a sibling field on JournalEntry (same disqualifier
// as 'connection' — a real new column); a property on some existing box
// (there is no natural "owner" card — canvas size isn't any one card's own
// attribute). Follows 'connection's own shape exactly: x/y/w/h/z stay
// unused (always 0), so it costs NOTHING extra in maxBottom/the pointer
// hit-test/the text-reflow measure effect — those already treat an all-zero
// box as inert, no new filtering needed there. It DOES need its own filter
// in the POSITIONED-CARD render loop (alongside 'connection'), the same one
// line 'connection' already required — checked against every existing
// boxes-array consumer before committing to this shape (BoardEditor.tsx's
// own header comment records the full audit). `canvasW`/`canvasH` are
// deliberately NOT normalized like every other box's x/y/w/h (which are
// fractions of the page width) — the canvas's own size is what x/y/w/h
// normalize AGAINST, so normalizing it against itself is circular; these
// are plain persisted CSS pixels, at most one 'board-meta' box per board
// (BoardEditor.tsx enforces this by always updating the existing one, never
// pushing a second).
export interface Box {
  id: string;
  kind: 'text' | 'ink' | 'page-pin' | 'connection' | 'board-meta';
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  groupId?: string;
  text?: string;      // kind 'text'
  strokes?: Stroke[];  // kind 'ink' (incl. erases) — re-normalized to the box on port
  sourceEntryId?: string;
  portedAt?: string;
  entryId?: string;    // kind 'page-pin' — the referenced JournalEntry's id
  connA?: string;      // kind 'connection' — the first endpoint box id
  connB?: string;      // kind 'connection' — the second endpoint box id
  canvasW?: number;    // kind 'board-meta' — the canvas's own persisted width, CSS px (NOT normalized)
  canvasH?: number;    // kind 'board-meta' — the canvas's own persisted height, CSS px (NOT normalized)
  // FX5 S5 — the connections-footer's own per-board visibility toggle,
  // riding 'board-meta' the SAME way canvasW/canvasH do (the established
  // precedent, one more time): undefined/missing means "on" (every board's
  // default, including one that predates this field entirely) — only an
  // explicit `false` hides the footer line. Not normalized (it's a flag,
  // not a coordinate); costs nothing extra anywhere board-meta was already
  // filtered out of position-based computations.
  footerOn?: boolean;
  // B1 S1 — A system Board is a REAL board page (pageType 'board'), created
  // find-or-create idempotently on first approach, marked by a new optional
  // field on the existing 'board-meta' element in its own boxes: systemKind:
  // 'journal' | 'trash' (the FX4 board-meta precedent — additive optional
  // Box field, zero schema). System Boards: have no project home; never
  // appear as cards on any system Board (exclusion asserted); never appear
  // in the Pin sheet's board leaves (no project → already excluded; assert
  // it anyway); sync like any page (arrangement persists across devices by
  // the existing boxes round-trip).
  // B2 S1 — 'shelf' joins the union: the third system Board, by the SAME
  // code paths B1 laid down (idempotent find-or-create, derived membership,
  // authored arrangement sacred). Its own membership law is T3 (this
  // ticket's brief), not inJournalView/deletedAt — see persistence.ts's own
  // qualifyingPagesFor.
  systemKind?: 'journal' | 'trash' | 'shelf';
  // BM1 S4 — the projection seam's persisted structure. Decks are DATA, modes
  // are PROJECTIONS: one board, three views (OPEN/STORYBOARD/OUTLINE). The
  // ORDER and the SECTIONING are the board's own truth, single-sourced across
  // all three modes — so they live HERE, on the shared box data, never per
  // mode and never on a per-mode fork (S4's non-negotiable). All three are the
  // established additive-optional-Box-field precedent (FX4 'board-meta',
  // AB4 'connection'): absent on every existing box, so OPEN renders and
  // serializes BYTE-IDENTICALLY (the OPEN renderer never reads these — it
  // draws by x/y/z exactly as today), and the seven-deck library is untouched.
  //   `seq`     — cross-mode sequential order among siblings (sparse float, the
  //               `spineOrder`/`orderIndex` pattern). Absent → fall back to the
  //               box array's own order. STORYBOARD/OUTLINE drag WRITES this;
  //               all three modes READ it. This is what "one ordering, three
  //               views" means concretely.
  //   `laneId`  — which STORYBOARD lane / OUTLINE top-level section a card
  //               belongs to. Absent → the default (single) lane, so a
  //               structureless board gets exactly one lane (S6's floor).
  //   `parentId`— OUTLINE nesting: the card this one nests UNDER (a point under
  //               a section, a sub-point under a point). Absent → top-level in
  //               its lane. Genuine, unbounded nesting (cycle-guarded in
  //               store/boardStructure.ts) — the Grammarian's floor, S7.
  seq?: number;
  laneId?: string;
  parentId?: string;
  // BM1 S4 — the lane registry, riding 'board-meta' the SAME way canvasW/
  // canvasH/footerOn/systemKind already do (the FX4 precedent, once more):
  // ordered {id,title} pairs naming a board's STORYBOARD lanes / OUTLINE
  // sections. Absent/empty → the board is structureless (one default lane).
  // Titles route through deskLexicon at the call site, never raw here.
  lanes?: { id: string; title: string }[];
  // BM1 S5 — linking is NOT a new shape: a card→card link is the EXISTING
  // 'connection' box (AB4 S3 — connA/connB, drawn as an olive hairline BENEATH
  // card faces, deletable, zero-migration jsonb-in-`boxes`). FragmentLink is
  // the rhizome ancestor; 'connection' is its board-side descendant, already
  // shipped. "Linking absorbed into Open" (Nick's scrapping of Commonplace)
  // means: OPEN's existing thread gesture IS v1 linking — no field added here.
}

// TU1 S1 — the Tutor's per-page conversation thread (fragments-under-Pages
// citizen #3, the `script`/`boxes` recipe once more: one nullable jsonb
// column on `journal_entries`, additive only — `add column if not exists
// tutor jsonb`, no default, no CHECK — matching the `origin`/`script`
// precedent exactly, both sync-mapper directions (sync.ts's rowToJournalEntry
// / upsertJournalEntries). It holds ONE thing: the writer<->Tutor exchange
// for THIS page. Nothing else is ever persisted here — S3's lens results
// (Consistency/Structure/Fragments observations) and S4's nudges are
// DERIVED, recomputed fresh on every approach, never stored (the sheet
// law's own instinct — a page's jsonb columns hold authored/generated
// content, never a cache of a computation that can be re-run) applied to
// the Tutor's room. Grandfather clause: null <-> undefined must be a fixed
// point through every client mutation path (persistence.ts's
// getTutorThread/saveTutorThread) and both sync-mapper directions — a
// legacy page with no thread behaves byte-identically to today, forever
// (absent, not an empty {messages:[]} — a subtly different, wrong
// "grandfathered" state the ticket's own harness proves against). `role`
// is 'writer' | 'tutor' (never a third value — no system-message leakage
// into the persisted thread; the system prompt binding the Tutor to A13's
// ghostwriter rail lives server-side only, per-request, never stored).
//
// TU2 S2 — a charter amendment to this comment's own "Nothing else is
// ever persisted here," made on Nick's word at the TU2 brief's
// ratification, 2026-07-21 (the brief's own text: "Amend TutorThread...
// the tutor jsonb may now also carry lastRead?: { at: string; chars:
// number } — a charter amendment to TU1 S1's 'nothing else is ever
// persisted,' made on Nick's word at this brief's ratification"): the
// listener's cursor, marking how much of the page's text the Tutor has
// already read. This is NOT a lens result and NOT a nudge (both of those
// stay DERIVED, recomputed fresh, never stored, exactly as above) — it is
// a small, genuinely-authored fact about the conversation's own history:
// where it last looked. `lastRead` is optional for the same grandfather
// reason `tutor` itself is optional on JournalEntry: a thread predating
// TU2, or a thread whose writer has not sent a message since TU2 shipped,
// has no cursor yet, and the absence of `lastRead` on an otherwise-real
// thread means "read from the start" (TU2 S2's own grandfather clause),
// never "read nothing." It advances ONLY via persistence.ts's own
// advanceTutorCursor, ONLY on a successful reply (a failed call advances
// nothing), and ONLY on a thread that already exists — a page that has
// never talked to the Tutor still cannot gain ANY persisted tutor state,
// cursor included; that fixed point is untouched by this amendment.
export interface TutorMessage {
  id: string;
  role: 'writer' | 'tutor';
  text: string;
  at: string; // ISO timestamp
}

export interface TutorThread {
  messages: TutorMessage[];
  lastRead?: { at: string; chars: number };
}

// TU5 S1 — the book's Bible (L4 of the Tutor's five-layer memory): durable,
// writer-owned facts of the project. Rides `projects` as ONE additive nullable
// jsonb column (`add column if not exists tutor jsonb` — the exact
// `origin`/`journal_entries.tutor` recipe, project-side this time), never a new
// table (a table is a whole new synced collection — the BM1 charter's own
// reasoning). WRITER-AUTHORED ONLY: the Tutor cannot write here, not even by
// proposal (structured model output becoming app state is a cousin of the
// affordance A13 forbids). `source` is an enum of one today so L5-era
// provenance never needs a migration. Grandfather clause, identical to
// TutorThread's above: null <-> undefined is a fixed point through every store
// mutation and both sync mappers — a project never touched by the bible is
// byte-identical to today (absent, never a literal null or an empty
// { v:1, facts:[] }). A fact is a line, not a page: its 300-char cap is the
// store's policy (tutorBible.ts), never enforced in this shape.
export interface Fact {
  id: string;
  text: string;
  source: 'writer';
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface TutorBible {
  v: 1;
  facts: Fact[];
}

// S1 — the Screenplay Room's document (fragments-under-Pages citizen #2, ruled
// conformant in `docs/fragments-under-pages-canon.md` §3). One styled block per
// element; a Scene is the addressable unit (its heading + body elements are
// fragments OF the scene, but links/ports always point at the Scene, never an
// element). `dual`/`struck`/`number`/`omitted`/`beatId` are reserved-not-built —
// present here, never written by S1's UI.
export type ScriptElType = 'scene' | 'action' | 'character' | 'paren' | 'dialogue' | 'transition' | 'shot' | 'general';

export interface ScriptEl {
  id: string;
  t: ScriptElType;
  text: string;
  dual?: 'L' | 'R';   // reserved — S5 (dual dialogue)
  struck?: boolean;   // reserved — S4 (script Free-write)
}

export interface Scene {
  id: string;             // == heading.id (stable across saves; see scriptDoc.ts)
  heading: ScriptEl;
  body: ScriptEl[];
  number?: string;        // reserved — production suite
  omitted?: boolean;      // reserved — production suite
  beatId?: string;        // reserved — the structure spine's P3 (fragment-granular seam)
}

export interface TitlePageFields {
  title?: string;
  byline?: string;
  contact?: string;
}

export interface ScriptDoc {
  v: 1;
  title?: TitlePageFields; // dormant until S2
  scenes: Scene[];
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
