import type { StoredFace } from './page';

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

// ITEM 121 I1 — the instrument a stroke was drawn with. Three enums, all
// three OPTIONAL, and the absence of each is the whole migration story: an
// absent field reads as `pen · regular · the theme's default ink`, which is
// EXACTLY what every stroke drawn before this ticket already renders as. No
// backfill, no DDL, no data migration — see docs/menus/item121-s0-survey.md
// §2 for the proof that `strokes` is an existing jsonb column on the single
// page table, so growing the shape INSIDE the blob is invisible to Postgres.
export type StrokeTip = 'pen' | 'pencil' | 'marker';
export type StrokeNib = 'fine' | 'regular' | 'broad';
// ITEM 121 I1 — the ink is stored BY TOKEN NAME, never as a hex. Themes
// re-colour their inks; a stored hex would freeze one theme's palette into
// the page forever, so a page drawn under Plateau would keep Plateau's
// oxblood after a theme change instead of wearing the new theme's. The names
// are the Plateau inks the ink pass named (item83-ink-pass.md §0.5); the
// values live in index.css as --ink-walnut/-iron/-oxblood/-sea, and a theme
// pack re-points them the way it re-points every other token.
export type StrokeInk = 'walnut' | 'iron' | 'oxblood' | 'sea';

export interface Stroke {
  points: StrokePoint[];
  // J2 — an erase IS a stroke: same geometry, painted destination-out (ink.ts).
  // Additive/optional; absent on every ink stroke drawn before this ticket.
  eraser?: true;
  // ITEM 121 I1 — the instrument, stamped at capture from the drawer's current
  // pen. All three absent on every Journal stroke ever drawn, and on every
  // erase (an eraser ignores tip, nib and ink — J2's geometry is the whole of
  // it). Unknown values are not a hazard: store/ink.ts coerces anything it
  // does not recognise back to the defaults at PAINT time, so a row written by
  // a newer or older client can never mis-paint a page. That read-boundary
  // coercion is deliberately where validation lives — the server does not
  // re-validate a shape the client owns (apps/server/src/sync.ts's own stated
  // law for this whole jsonb column family), so this wave touches no server.
  tip?: StrokeTip;
  nib?: StrokeNib;
  ink?: StrokeInk;
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
  // a TEXT card's own face and size (the options live in the card's tool strip; the default is the everyday font). Additive inside `boxes` (jsonb), zero schema, and ABSENT on every card that never chose. [index §7]
  fontFace?: StoredFace;
  fontSize?: number;  // points; read through the default 11 (= today's card rendering)
  // A DEALT STEP IS A QUESTION, NOT TEXT. Two additive optional fields inside the board's `boxes` jsonb (zero schema: sync stores the blob whole, as with fontFace / seq / onCanvas), written ONLY by a NEW deal of a Tier 1 deck: prompt - the step's question, resolved at deal time (store/guided.ts, decks/content.ts). The card's PLACEHOLDER, shown while it has no body, never in `text`, so it is never exported, copied, counted, synced as body or read by the Tutor as the writer's words (harness guided-w3 pins that no reader names `.prompt`). A written card keeps the field and stops showing it; delete the words and the question returns. deckStep - which step of which deck this card was dealt as ({ deck: 'three-act', step: 'hook' }): the key the "?" reads its sentence and example by, and what the Walk and coverage read. The card owes the deck nothing else. [index §8]
  prompt?: string;
  deckStep?: { deck: string; step: string };
  // The writer marks a step FINISHED by hand. One additive optional field inside the board's `boxes` jsonb (zero schema: sync stores the blob whole, like seq / onCanvas / deckStep). `true` = lit; ABSENT = not lit (unmarking REMOVES the key, so there is one way to be unlit), unmarked from the same door. A statement of the writer's, never a measurement: it never counts toward coverage (kindled() ignores it), never completes a Deck and never celebrates (store/guided.ts withLit, store/deckRewards.ts). [index §9]
  lit?: boolean;
  // The writer sized this card by hand. One additive optional field inside the board's `boxes` jsonb (zero schema: sync stores the blob whole, like lit / seq / deckStep). `true` = hand-sized, the card KEEPS its size; ABSENT = auto, the card fits its content (grows and, once the writer has acted on it, shrinks). Set ONLY by a resize the writer performs on a text card; resizing back to its content height CLEARS it (the key is removed, so there is one way to be auto). Never set by a deal, a move, an edit or the reflow. [index §10]
  sizedByHand?: true;
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
  // MEMBERSHIP IS NOT DISPLAY. A 'page-pin' Box is the membership record; the card on the canvas is one display of it. This flag gates the canvas and nothing else: `getBoardsPinning` reads membership by the pin's PRESENCE and never consults it, so a withheld card is still a member of the board everywhere. ABSENCE MEANS DISPLAYED: boards arranged before this field read `undefined` as "on the canvas" (no backfill, no migration); only an explicit `false` withholds. New memberships write `false` explicitly (pinPageToBoard), since a position is the writer's act. The `footerOn` shape: an additive optional field inside the board's `boxes` jsonb; sync.ts maps the whole blob (`JSON.stringify(e.boxes ?? null)` / `r.boxes ?? undefined`) with no per-field enumeration, so it costs zero schema, migration or server change. [index §11]
  onCanvas?: boolean;   // kind 'page-pin' — absent/true: on the canvas; false: member only
  // A DELETED CARD IS A TOMBSTONE, NOT A REMOVAL. Three additive optional fields inside the board's `boxes` jsonb (zero schema: sync stores the blob whole): deletedAt - stamped when the card is sent to Trash; the box stays in `boxes`, hidden from every reader (store/boxTombstones.ts: liveBoxes), listed on the Trash board; Restore clears it. updatedAt - the per-box CHANGE TIME. Set when a card is deleted or restored; absent on every card that predates it. It alone decides which side of a merge wins. purgedAt - a permanent delete from Trash replaces the box with `{ id, kind, purgedAt }` + zeros. Final: a stale save cannot resurrect it. [index §12]
  deletedAt?: string;
  updatedAt?: string;
  purgedAt?: string;
  // BOARD CONTEXT MENU - a card on the TRASH board that stands for a tombstoned CARD (not a page): where it came from. Derived by the Trash board's reconcile, never authored; the face reads the
  // tombstoned source box. Absent on every real card.
  trashedFrom?: { boardId: string; boxId: string };
  // A COPY GETS ITS OWN FIELD. `sourceEntryId` means "this card MIRRORS that entry", and BoardEditor's double-click dispatch is built on it: a text card carrying it TRAVELS to its source instead of opening the edit popup. A copy is the opposite relationship, independent (edits do not follow), so reusing the mirror field would cost a copy the editing gesture. One field, one relationship: additive optional, the `onCanvas` pattern, zero schema (`Box` rides the board's `boxes` jsonb). Read for the lineage line only (text, no travel); the dispatch is untouched. [index §13]
  copiedFromBoardId?: string;   // kind 'text' | 'ink' — the board this card was COPIED from
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
  // TWO TRUE KINDS, Board and Book, as two optional additive fields on this board-meta box inside the board's `boxes` jsonb (the systemKind precedent: zero schema, no column, no migration, no server change). NOT named `kind`: Box.kind is the box discriminator ('text' / 'ink' / 'page-pin' / 'connection' / 'board-meta'). boardKind - 'board' | 'book'. Absent = a Board. The Journal's kind is DERIVED from systemKind and never stored on it; no other Book exists yet. homeView - the view the board opens in until the writer has chosen one on this device (the device-local "last shown as", store/boardMode.ts, beats it). Absent = the kind's default: a Board opens in Open, a Book in Flip. A Deck is a Board whose homeView is 'walk'. A value the kind does not have is ignored (store/boardKind.ts homeViewOf). It syncs (the whole boxes blob; last write wins): store/boardKind.ts withHomeView stamps this box's `updatedAt`, so the newer write wins the box-level merge (mergeBoxLists) rather than a tie going to whichever side won the entry. [index §14]
  boardKind?: 'board' | 'book';
  homeView?: 'open' | 'storyboard' | 'outline' | 'walk' | 'flip' | 'thumbnails';
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
  // linking is NOT a new shape: a card-to-card link is the EXISTING 'connection' box (connA/connB, an olive hairline BENEATH card faces, deletable, jsonb-in-`boxes`). FragmentLink is the rhizome ancestor; 'connection' is its board-side descendant. Open's thread gesture IS linking: no field added here. [index §15]
}
