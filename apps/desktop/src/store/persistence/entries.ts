import type { JournalEntry } from '../../types';
import { sortNotebook, notebookKey, midpoint, gapExhausted, respread } from '../pageOrder';
import { liveBoxes, isHiddenSelf } from '../boxTombstones';
import { cache, clone, durableSeam, generateId } from './core';
import { getProject } from './projects';
import { saveJournalEntry } from './journal';
import { isPairedPlanBoard, unpairPlanBoard } from './planPairing';
import { getSystemKind } from './systemBoards';
import { newPageSize } from '../../arbor2/newPageSize';   // ARBOR v2 MOCKUP r17 (see journal.ts)

export function getJournalEntries(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt)
    .map(clone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first
}

// E1.1 S3 — the READ-ONLY enumeration seam for soft-deleted pages, the one the
// "Everything" export's "## From the Trash" section reads. Every getter above
// is deletion-FILTERED on purpose ("gone means gone" everywhere in the live
// app); this is a deliberate, named exception — the same shape
// getJournalEntryIncludingDeleted (below) already established for the Trash
// Board's own cards, widened here to the whole soft-deleted set. It mirrors,
// EXACTLY, the Trash Board's own membership rule (qualifyingPagesFor's 'trash'
// branch, further below): every soft-deleted page, ANY origin/pageType,
// EXCLUDING system Boards (derived mirrors, never authored content). READ-ONLY
// in the strongest sense — it returns CLONES and never touches deletedAt or any
// row, so nothing on this path can resurrect or mutate a trashed page.
export function getDeletedEntries(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !!e.deletedAt && !e.purgedAt && getSystemKind(e) === undefined)   // DELETE FOR GOOD: a shell is not in Trash
    .map(clone);
}

// --- Pages & the Shelf (D2) -----------------------------------------------
// A page is a JournalEntry; its home is exactly one of three pools. These read
// the same cache, partitioned by (projectId, shelved). `setPageHome` is the one
// place that moves a page between homes, enforcing the exactly-one-home rule.

// AB3 S5 — the Journal-forgets-nothing predicate, shared by every Journal
// view (list, notebook nav). A page belongs to the Journal if it was BORN
// there (origin==='journal'), regardless of its current home (filed,
// shelved — "a filed journal page appears in both places"); a null-origin
// row (canon amendment A2, the grandfather clause) keeps EXACTLY today's
// rule (loose AND not shelved) — untouched by this ticket. A 'project'- or
// 'loose'-origin page never matches, even if projectId happens to be null
// (the loose-origin door produces exactly that shape on purpose).
//
// B2 S7 — the PINNED law amends the origin==='journal' branch only: dual
// membership retires. A journal-born page that gets FILED (projectId set)
// now LEAVES the Journal (this is the Places panel's own Home zone DoD:
// "a journal-born page filed to a drawer leaves the Journal Board; its
// origin never changes" — origin is provenance, untouched forever; THIS
// function is what decides current membership, and membership now tracks
// projectId too). The grandfather branch (null origin) and the explicit
// 'project'/'loose' branch are BOTH untouched — this is a one-line, one-
// branch amendment, not a rewrite. Every consumer (getJournalPages, the
// cascade's Journal panel + survey, the Journal Board's own reconcile via
// qualifyingPagesFor, JournalEntry.tsx's own membership line) picks up the
// amendment uniformly — "one truth, every surface," the SAME discipline
// qualifyingPagesFor's own header comment already names.
export function inJournalView(e: JournalEntry): boolean {
  if (e.origin === 'journal') return e.projectId == null;
  if (e.origin != null) return false; // explicit 'project' | 'loose' — never
  return e.projectId == null && !e.shelved; // A2 grandfather — untouched (legacy null-origin rows)
}

// The Journal stream — every page that belongs there (see inJournalView).
export function getJournalPages(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && inJournalView(e))
    .map(clone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// --- B2 — T3, the Shelf's law (this ticket's own brief, S1/S3) -----------
// A page belongs on the Shelf iff ALL hold: not deleted; not a system
// board; no project home; not journal-homed; and it appears as a page-pin
// card on ZERO user boards (membership is connection). Starred status is
// irrelevant — attention is not organization. This SUPERSEDES the legacy
// `shelved`-flag definition (getShelfPages, retired below) — the flag
// stays dormant in storage (zero schema; never dropped) but is never read
// by this law directly; T3 is derived from truth that already exists
// (origin, projectId, deletedAt, boxes), the same "dress, not collapse"
// discipline every system Board already stands on.

// Every board (any project, any drawer) currently carrying a page-pin card
// for `entryId` — "zero user-board pins" in T3's own words. System boards
// are excluded (their own cards are DERIVED, never real membership).
function isPinnedOnAnyUserBoard(entryId: string): boolean {
  return cache.journalEntries.some(e =>
    !e.deletedAt && e.pageType === 'board' && getSystemKind(e) === undefined
    && liveBoxes(e.boxes).some(b => b.kind === 'page-pin' && b.entryId === entryId));
}

// T3 itself — a single predicate, called by BOTH the Shelf Board's own
// reconcile (qualifyingPagesFor, below) and the Drawers panel's own "loose
// docs" group (S7 — "one definition, two consumers").
export function belongsOnShelf(e: JournalEntry): boolean {
  if (e.deletedAt) return false;
  if (getSystemKind(e) !== undefined) return false; // never a system board, including itself
  // BM1 S2 — a board that is currently a page's plan face is subordinate and
  // invisible (Page is Primary): it never clutters the Shelf WHILE PAIRED.
  // The instant its page is deleted, isPairedPlanBoard(e.id) goes false and it
  // falls into ordinary loose membership HERE — that IS the "orphans into
  // ordinary loose membership, nothing cascades" rule, made concrete by
  // derivation rather than a cascade write. For every grandfathered entry no
  // page carries a planBoardId, so this branch is a no-op — belongsOnShelf is
  // byte-behaviour-identical to today until a real pairing exists.
  if (isPairedPlanBoard(e.id)) return false;
  if (e.projectId != null) return false; // no project home
  if (inJournalView(e)) return false; // not journal-homed
  if (isPinnedOnAnyUserBoard(e.id)) return false; // zero user-board pins
  return true; // starred is irrelevant, per T3's own words
}

// The Shelf — every page T3 currently qualifies, most-recently-touched
// first (the old getShelfPages' own sort, kept — a plain read-order
// preference, not part of T3 itself).
export function getShelfEntries(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => belongsOnShelf(e))
    .map(clone)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// J1 — the loose Journal in NOTEBOOK order (ascending: oldest first, like a real
// notebook fills). Nav (prev/next) + the spread view (J3) walk this. The
// chronological list feed is unchanged (getJournalPages stays newest-first).
// AB3 — deliberately NOT origin-aware (unlike getJournalPages above). This
// powers the Spread's spatial drag-reorder grid (J1/J5), which needs a page
// to actually LEAVE when filed or shelved (J5's own harness asserts this:
// filing to the Shelf removes a page from the grid) — S5's "notebook nav"
// wording is about JournalEntry.tsx's own prev/next paging (still gated by
// the unchanged isLoose there), not the Spread's reorder surface. Untouched
// from pre-AB3 behavior for every row, journal-origin included.
// B1 — `pageType !== 'board'` is a new, defensive exclusion this ticket
// adds: every Board page before B1 always carried a projectId (this
// predicate's own `projectId == null` check already excluded it), so this
// filter's blind spot to boards specifically never mattered until a system
// Board could exist with no project at all. Without it, the Journal/Trash
// system Boards would wrongly surface as notebook pages (Spread's own
// reorder grid, JournalEntry's prev/next paging) — genuinely new territory,
// not a pre-existing gap this ticket happens to be fixing.
// B2 S3 — `!e.shelved` is replaced with `!belongsOnShelf(e)` (T3): the
// legacy flag is dormant now (never written — persistence.ts's own
// setPageHome), so a literal `!e.shelved` read would always be true and
// this filter would stop excluding ANYTHING, regressing "filing a page
// away removes it from the notebook grid" (J5's own harness DoD) for
// every origin. `belongsOnShelf` is the correct replacement, not merely a
// mechanical swap: a journal-origin page that gets un-filed CORRECTLY
// stays in the notebook (T3 excludes it — still journal-homed, per the
// pinned law), while a project-/loose-origin/grandfathered page that
// becomes un-filed-and-unpinned CORRECTLY leaves (T3 includes it — heads
// to the Shelf). Still deliberately NOT origin-aware beyond what T3 itself
// already is — untouched from pre-B2 behavior otherwise.
export function getNotebookPages(): JournalEntry[] {
  return sortNotebook(
    cache.journalEntries.filter(e => !e.deletedAt && e.projectId == null && !belongsOnShelf(e) && e.pageType !== 'board').map(clone),
  );
}

// AB3 S6 — the Drawers place face's contents: every page currently filed
// into ANY project (a flat, one-level list — no per-project drill-down).
export function getDrawerFiledPages(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && e.projectId != null)
    .map(clone)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// Re-spread every loose page onto clean, well-separated indexes (order preserved)
// — the insert path calls this only when a target midpoint gap is exhausted.
function normalizeNotebook(): JournalEntry[] {
  for (const { id, orderIndex } of respread(getNotebookPages())) {
    const live = cache.journalEntries.find(e => e.id === id);
    if (live) saveJournalEntry({ ...live, orderIndex });
  }
  return getNotebookPages();
}

// J3 — the ONE ordering implementation shared by every writer of `orderIndex`:
// createLoosePage (append/insert-blank, below) and setNotebookPosition (drag
// reorder, J3 Slice 2). Computes a fresh index placing a page immediately
// after `afterId`, normalizing the notebook first if that gap is exhausted.
// `afterId` is a three-state selector: omitted -> append at the end (the
// original createLoosePage contract, unchanged); `null` -> insert before the
// very first page (the drag-to-the-front target, which has no "after" id to
// name — the open end at the other side of `midpoint`); a page id -> insert
// immediately after that page. `excludeId` drops a page (the one being
// dragged) out of the notebook read BEFORE any gap is measured, so moving a
// page never measures a gap against its own current position.
function notebookIndexAfter(afterId?: string | null, excludeId?: string): number {
  let nb = getNotebookPages();
  if (excludeId) nb = nb.filter(p => p.id !== excludeId);

  if (afterId === null) {
    // Before the first page — the open end symmetric to "append at the end"
    // below; nothing precedes it, so there's no gap that can be exhausted.
    const firstKey = nb.length ? notebookKey(nb[0]) : undefined;
    return midpoint(undefined, firstKey);
  }

  const lastKey = nb.length ? notebookKey(nb[nb.length - 1]) : undefined;
  const i0 = afterId ? nb.findIndex(p => p.id === afterId) : -1;
  if (!afterId || i0 < 0) {
    return midpoint(lastKey, undefined); // append at the end
  }
  let i = i0;
  let cur = notebookKey(nb[i]);
  let nxt = i + 1 < nb.length ? notebookKey(nb[i + 1]) : undefined;
  if (nxt != null && gapExhausted(cur, nxt)) {
    nb = normalizeNotebook();
    if (excludeId) nb = nb.filter(p => p.id !== excludeId);
    i = nb.findIndex(p => p.id === afterId);
    cur = notebookKey(nb[i]);
    nxt = i + 1 < nb.length ? notebookKey(nb[i + 1]) : undefined;
  }
  return midpoint(cur, nxt);
}

// Create a blank loose Journal page placed in the notebook: at the END (afterId
// omitted), or immediately AFTER `afterId` (between it and its successor).
// Normalizes first if that gap is exhausted. Honor-discard (J1a) still cleans up
// an abandoned blank — no litter.
export function createLoosePage(afterId?: string): JournalEntry {
  const orderIndex = notebookIndexAfter(afterId);
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(), text: '', projectId: null, source: 'page',
    // AB3 S4 — a Journal-domain door (notebook insert): this page homes in
    // the Journal, same as createJournalPage/Catch.
    origin: 'journal',
    orderIndex, createdAt: now, updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// AB3 S4 — the Desk's start-writing / home-base door. A blank page with no
// project and no Journal membership: `loose` is a legitimate PERMANENT home
// (canon's "loose forever" clause) — never nudged to file, and this door
// never puts it in the Journal (S5's predicate keys off `origin`, not the
// projectId/shelved shape alone, so a loose-origin page is structurally
// identical to a Journal page yet correctly excluded from every Journal
// view). Opens at /page/:id (PageEditor) — not /journal/:id — so it never
// inherits JournalEntry's Journal-only furniture (notebook nav, the
// file-it-first prompt).
export function createLooseHomePage(): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text: '',
    projectId: null,
    source: 'page',
    origin: 'loose',
    createdAt: now,
    updatedAt: now,
  };
  newPageSize(entry);   // ARBOR v2 MOCKUP r17: a page born under the flag starts at 11 pt (../../arbor2/newPageSize.ts)
  saveJournalEntry(entry);
  return entry;
}

// AB3 S2 — a shared merge-write used by the Page face's star/tag mutations
// on both JournalEntry.tsx and PageEditor.tsx. `currentText` is the host's
// own live text ref/buffer, re-injected on every write so a star/tag toggle
// never clobbers a freshly-typed run the debounced autosave hasn't flushed
// yet (the same discipline JournalEntry.tsx's own `patch` closure already
// used — lifted here so PageEditor.tsx, which never had this, gets it too).
export function patchJournalEntry(id: string, currentText: string, changes: Partial<JournalEntry>): JournalEntry | null {
  const latest = getJournalEntry(id);
  if (!latest) return null;
  saveJournalEntry({ ...latest, text: currentText, ...changes });
  return getJournalEntry(id);
}

// J3 — persist a drag reorder (the spread view, Slice 2): place an existing
// loose page immediately after `afterId` (`null` = the very front, omitted =
// the very end). Rides `notebookIndexAfter` — the SAME helper `createLoosePage`
// uses — so there is exactly one ordering implementation, per the J3 invariant.
// Loose notebook pages only (filed/Shelf pages have no notebook order to move
// within); a no-op if `id` isn't a live loose page or the drop targets itself.
export function setNotebookPosition(id: string, afterId?: string | null): void {
  if (afterId === id) return;
  const entry = getJournalEntry(id);
  if (!entry || entry.projectId != null || entry.shelved) return;
  const orderIndex = notebookIndexAfter(afterId, id);
  saveJournalEntry({ ...entry, orderIndex });
}

// Test/inspection seam — the loose notebook in order (id + resolved key).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoNotebook?: unknown }).wrizoNotebook =
    () => getNotebookPages().map(p => ({ id: p.id, oi: p.orderIndex ?? null, key: notebookKey(p) }));
}

// Pages filed into a binder (projectId === binderId).
export function getBinderPages(binderId: string): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && e.projectId === binderId)
    .map(clone)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// move a page to a single home (binderId, 'shelf'/'loose', or 'journal'); 'shelf' and 'loose' both mean un-file - where it lands follows its origin; the legacy `shelved` flag is never written [persistence §24]
export type PageHomeResult = 'filed' | 'no-such-page' | 'no-such-binder';

export function setPageHome(pageId: string, target: string): PageHomeResult {
  // read the cache, not getJournalEntry: getJournalEntry falls through to the unborn slot, and saving that record births an empty page by a side door [persistence §25]
  const found = cache.journalEntries.find(e => e.id === pageId && !e.deletedAt);
  if (!found) return 'no-such-page';
  const entry = clone(found);
  if (target === 'shelf' || target === 'loose' || target === 'journal') {
    entry.projectId = null;
  } else {
    if (!getProject(target)) return 'no-such-binder';
    entry.projectId = target; // a binder id, now known to name a live binder
  }
  saveJournalEntry(entry);
  return 'filed';
}

// ITEM 88a — test/inspection seam, this file's own established pattern (the
// `window.wrizoPinPageToBoard = pinPageToBoard` line above, verbatim in shape).
// The guard exists precisely for a target no UI can offer — every surface builds
// its list from `getProjects()`, so a bogus binder id is unreachable by clicking
// and the refusal would otherwise be unassertable from a harness. Never read by
// app code.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoSetPageHome?: unknown }).wrizoSetPageHome = durableSeam(setPageHome);
}

// B2 S4 — the inverse of pinPageToBoard: uncheck in the Places panel's
// Boards zone removes ONLY that board's own card (the page, never — A16's
// own words, "checkboxes write ONLY membership"). Symmetric to pinPageToBoard
// (same board-must-be-a-live-board guard); idempotent (unpinning an
// already-absent card is a harmless no-op, matching pinPageToBoard's own
// "already pinned — idempotent" twin).
export function unpinPageFromBoard(entryId: string, boardEntryId: string): JournalEntry | null {
  const board = getJournalEntry(boardEntryId);
  if (!board || board.pageType !== 'board') return null;
  const existing = board.boxes ?? [];
  const next = existing.filter(b => !(b.kind === 'page-pin' && b.entryId === entryId && !isHiddenSelf(b)));   // a tombstoned pin stays in Trash
  if (next.length === existing.length) return board; // nothing to remove — idempotent
  saveJournalEntry({ ...board, boxes: next });
  return getJournalEntry(boardEntryId);
}

// B2 S4 — every live, non-system board the Places panel's Boards zone can
// offer ("every board the page COULD join... per existing pin law" — the
// SAME flat, any-project reach PinToBoardSheet.tsx's own drill-down already
// allows, just read flat here instead of drill-down-grouped). System boards
// are never listed (A16: their membership is derived, never a checkbox).
export function getAllUserBoards(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && e.pageType === 'board' && getSystemKind(e) === undefined)
    .map(clone)
    .sort((a, b) => a.id.localeCompare(b.id)); // stable, deterministic order
}

// PB1 — THE UNBORN SLOT. A surface the writer has opened but not yet written
// in has no row: "a page is born when it has a word; a board when it has a
// box." But every consumer of a page — the cascade, the Page face, the Tutor,
// describePageHome, the editors' own delegation — reads its subject through
// getJournalEntry, and two of them (useCascade's `subject.entry.id`,
// ModeStrip's required onPublish) are shared with surfaces far outside this
// ticket and may not be loosened for one feature. So the unborn surface keeps
// a record-SHAPED object here, in a slot of its own, and every reader works
// unchanged.
//
// The slot is deliberately NOT part of `cache`, and this is the whole reason
// PB1 works: `flush()` above serializes `cache[name]` WHOLESALE, so an unborn
// row placed in the cache would reach disk on the next flush of that
// collection — which every route change forces via flushNow() — and `upsert`
// would mark it dirty, so the sync loop would push it to the server too. A
// row in the slot touches neither. It is never serialized, never synced, never
// enumerated: getJournalEntries() and every derived view read `cache` alone,
// so an unborn page cannot appear in Places, the Journal, the Shelf, a board's
// pin list, or an export. That absence is structural, not a filter someone has
// to remember to write.
//
// Exactly one slot: only one surface is mounted at a time, and an unborn
// surface that is navigated away from is gone — nothing was stored, so there
// is nothing to clean up. Birth is `saveJournalEntry(...)` with the first
// content already in it, which puts the row in `cache` by the ordinary path;
// the slot is then cleared by its owner.
let unbornSlot: JournalEntry | null = null;

export function setUnbornEntry(entry: JournalEntry | null): void {
  unbornSlot = entry ? clone(entry) : null;
}

export function getUnbornEntry(): JournalEntry | null {
  return unbornSlot ? clone(unbornSlot) : null;
}

export function isUnborn(id: string): boolean {
  return unbornSlot != null && unbornSlot.id === id;
}

export function getJournalEntry(id: string): JournalEntry | null {
  const entry = cache.journalEntries.find(e => e.id === id);
  if (entry) return !entry.deletedAt ? clone(entry) : null;
  // Fall through to the unborn slot only when the store has no row: a real row
  // always wins, so birth (which writes the row) instantly stops this branch
  // from mattering, with no ordering hazard between the write and the clear.
  return unbornSlot && unbornSlot.id === id ? clone(unbornSlot) : null;
}

// a soft delete (a synced row travels its deletion, never a hard delete); every getter already filters deletedAt [persistence §26]
export function softDeleteEntry(id: string): void {
  const entry = getJournalEntry(id);
  if (!entry) return;
  // BM1 S2 — "deleting a plan board unpairs (page's planBoardId nulls, page
  // untouched)." Do this BEFORE marking deleted so the page's pointer is
  // cleaned up exactly once. Deleting a PAGE that owns a plan board needs no
  // action here: the board orphans automatically the instant this page carries
  // deletedAt (isPairedPlanBoard skips soft-deleted pages), and a later restore
  // re-pairs for free because the page's own planBoardId was never touched —
  // "nothing cascades, nothing is destroyed silently."
  if (entry.pageType === 'board' && isPairedPlanBoard(id)) unpairPlanBoard(id);
  entry.deletedAt = new Date().toISOString();
  saveJournalEntry(entry);
}
