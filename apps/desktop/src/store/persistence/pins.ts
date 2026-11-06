import type { JournalEntry, Box } from '../../types';
import { liveBoxes, isHiddenSelf } from '../boxTombstones';
import { cache, durableSeam, generateId } from './core';
import { createBinder } from './projects';
import { saveJournalEntry } from './journal';
import { BOARD_GROUP_GAP, BOARD_INK_MAX_W, BOARD_INK_MIN_W, BOARD_STACK_GAP, BOARD_TEXT_W, MAX_PORTED_TEXT_H, createBoardPage, estimateTextBoxHeight, renormalizeStrokesForBox } from './boards';
import { getJournalEntry } from './entries';
import { getSystemKind } from './systemBoards';

// Port loose Journal pages onto a Board (J4 Slice 2 — I2 realized): COPY,
// never move — source pages are byte-untouched. Each source page becomes a
// text box and/or an ink box (when includeInk and it has strokes), stacked
// vertically in selection order; when a page has BOTH, they share a fresh
// groupId (the locked group — "ink locked to the text"). A text-empty page
// ports ink-only; an ink-empty page ports text-only; a page with neither
// contributes nothing. Provenance travels on every box.
function buildPortedBoxes(sourceIds: string[], includeInk: boolean, startY: number, startZ: number): Box[] {
  const now = new Date().toISOString();
  const boxes: Box[] = [];
  let y = startY;
  let z = startZ;
  for (const sourceId of sourceIds) {
    const source = getJournalEntry(sourceId);
    if (!source) continue;
    const hasText = !!source.text.trim();
    const hasInk = includeInk && (source.strokes?.length ?? 0) > 0;
    if (!hasText && !hasInk) continue;
    const groupId = hasText && hasInk ? generateId() : undefined;
    if (hasText) {
      // FX5 S3 — capped at MAX_PORTED_TEXT_H (see that constant's own
      // comment): a ported card's face now shows a bounded excerpt, not
      // the full source text, so its height should read as a notecard
      // from the very first paint, not the OLD full-content estimate.
      const h = Math.min(estimateTextBoxHeight(source.text), MAX_PORTED_TEXT_H);
      boxes.push({ id: generateId(), kind: 'text', x: 0.05, y, w: BOARD_TEXT_W, h, z: z++, groupId, text: source.text, sourceEntryId: source.id, portedAt: now });
      y += h + BOARD_GROUP_GAP;
    }
    if (hasInk) {
      const { strokes, aspect, bboxW } = renormalizeStrokesForBox(source.strokes!);
      const w = Math.min(Math.max(bboxW, BOARD_INK_MIN_W), BOARD_INK_MAX_W);
      const h = w * aspect;
      boxes.push({ id: generateId(), kind: 'ink', x: 0.05, y, w, h, z: z++, groupId, strokes, sourceEntryId: source.id, portedAt: now });
      y += h;
    }
    y += BOARD_STACK_GAP;
  }
  return boxes;
}

// `dest: 'new'` births an Untitled binder (kind 'other', F4's law) on the
// spot and creates a fresh Board inside it. `dest: <binderId>` creates a
// fresh Board in that existing binder.
export function portToBoard(sourceIds: string[], dest: string | 'new', includeInk: boolean): JournalEntry {
  const binderId = dest === 'new' ? createBinder('', 'other').id : dest;
  const boxes = buildPortedBoxes(sourceIds, includeInk, 0.06, 1);
  const board = createBoardPage(binderId);
  saveJournalEntry({ ...board, boxes });
  return getJournalEntry(board.id)!;
}

// J5 Slice 3 — the port's other destination: an EXISTING Board. New locked
// groups append BELOW current content (start y = max box bottom + spacing,
// the same stacking `portToBoard` uses for a fresh Board) rather than
// replacing anything; z continues past the board's current max.
export function appendToBoard(sourceIds: string[], boardEntryId: string, includeInk: boolean): JournalEntry | null {
  const board = getJournalEntry(boardEntryId);
  if (!board || board.pageType !== 'board') return null;
  const existing = board.boxes ?? [];
  const liveNow = liveBoxes(existing);   // tombstones do not take up room
  const startY = liveNow.reduce((m, b) => Math.max(m, b.y + b.h), 0) + BOARD_STACK_GAP;
  const startZ = liveNow.reduce((m, b) => Math.max(m, b.z), 0) + 1;
  const newBoxes = buildPortedBoxes(sourceIds, includeInk, startY, startZ);
  saveJournalEntry({ ...board, boxes: [...existing, ...newBoxes] });
  return getJournalEntry(boardEntryId);
}


// the containment graph (a board contains a board through a page-pin) and its ONE walker; every recursive reader uses it, and the `seen` set is mandatory: a graph can arrive already cyclic, and a walk without it hangs [persistence §10]

/** Every board that transitively CONTAINS `boardId`. Terminates on cyclic data. */
export function boardAncestors(boardId: string): Set<string> {
  const seen = new Set<string>();
  const stack: string[] = [boardId];
  while (stack.length) {
    const cur = stack.pop() as string;
    for (const parent of getBoardsConnecting(cur)) {
      if (seen.has(parent.id)) continue;
      seen.add(parent.id);
      stack.push(parent.id);
    }
  }
  return seen;
}

// Would placing `sourceId` INTO `targetBoardId` close a cycle? It does iff the
// target already sits inside the source — i.e. walking UP from the target
// reaches the source.
//
// ⚠ THIS RUNS AT EVERY MEMBERSHIP WRITE, NEVER ONLY THE FIRST, and that is the
// build law rather than an optimisation note. A membership that is lawful when
// made becomes a cycle LATER, when its parent nests somewhere new — so a
// first-write-only guard is precisely a guard that misses the case it exists
// for. Every write re-walks.

// PW2 S2 — THE NEST CHAIN, ordered outermost-first, for the board's crumb.
//
// `boardAncestors` answers a SET question ("is X above me"), which is what the
// guard needs. An address needs a PATH, so this is the ordered sibling — the
// same edges, the same `seen` termination, one walk per level.
//
// ⚠ A BOARD MAY HAVE SEVERAL PARENTS, and an address is one line, so this walks
// ONE path: the first parent at each level, in `getBoardsConnecting`'s own
// stable order. That is a deliberate narrowing and not an oversight — the crumb
// answers "a way back", not "every way back", and the Plan panel's BOARDS
// CONNECTED zone is where the full parent set is listed. Picking the first
// keeps the line one line at any depth, which is the test a recursive
// container has to pass.
//
// The `seen` set is again mandatory rather than tidy: on data that arrives
// already cyclic this returns a finite chain instead of looping forever. A
// crumb that hangs the surface is a worse failure than a crumb that is short.
export function boardNestChain(boardId: string): { id: string; title: string }[] {
  const chain: { id: string; title: string }[] = [];
  const seen = new Set<string>([boardId]);
  let cur = boardId;
  for (;;) {
    const parent = getBoardsConnecting(cur).find(p => !seen.has(p.id));
    if (!parent) break;
    seen.add(parent.id);
    chain.push(parent);
    cur = parent.id;
  }
  return chain.reverse(); // outermost first — an address reads from the outside in
}

export function wouldNestCycle(sourceId: string, targetBoardId: string): boolean {
  if (sourceId === targetBoardId) return true; // self — held by the built guard too
  return boardAncestors(targetBoardId).has(sourceId);
}

// a page-pin is membership, not capture: it references an entry by id and never touches its record; page-pins are TALL, at the rail thumbnail's page ratio and nearly the old footprint [persistence §11]
const BOARD_PIN_W = 0.16;
const BOARD_PIN_H = 0.22;
// a board is wider than tall wherever it appears (more horizontal than the page-pin, so the shape reads at a glance) [persistence §12]
const BOARD_CARD_W = 0.32;
const BOARD_CARD_H = 0.10;

// the silhouette is a keyed record, so a caller must NAME which kind it places; it keys on the ENTRY kind, never the box kind (a board's card is a page-pin box too) [persistence §13]
export interface PinSilhouette { w: number; h: number }
const PIN_SILHOUETTE: { page: PinSilhouette; board: PinSilhouette } = {
  page: { w: BOARD_PIN_W, h: BOARD_PIN_H },    // vertical — a page
  board: { w: BOARD_CARD_W, h: BOARD_CARD_H }, // horizontal — a board
};

/** The birth shape for a card pinning `entry`. Keyed on the ENTRY's kind. */
export function pinSilhouetteFor(entry: Pick<JournalEntry, 'pageType'> | null | undefined): PinSilhouette {
  return entry?.pageType === 'board' ? PIN_SILHOUETTE.board : PIN_SILHOUETTE.page;
}

// the aspect a pinning card is locked to once the writer resizes it: constrain forward, never snap - never on load or a move [persistence §14]
export function pinAspectFor(entry: Pick<JournalEntry, 'pageType'> | null | undefined): number {
  const s = pinSilhouetteFor(entry);
  return s.h / s.w;
}

// `display` splits the two acts: page-side (the default) makes a membership without placing it; board-side places it, since the writer authored that arrangement [persistence §15]
export function pinPageToBoard(entryId: string, boardEntryId: string, opts?: { display?: boolean }): JournalEntry | null {
  // the membership guard: only two sites create a page-pin, and the derived one never routes here, so this simply refuses what a writer may not author; the source must resolve to a live, pinnable entry (a positive check) [persistence §16]
  const source = getJournalEntry(entryId);
  if (!source) return null;
  // (the built source-side system guard follows below, unchanged)
  // FX6 S3 (a1, ab4-review's own advisory) — self-pin closed at THIS end
  // too (belt and suspenders alongside PinToBoardSheet.tsx's own leaf
  // exclusion): a board can never pin itself to itself, even via a direct
  // call that bypasses the sheet's own UI.
  if (entryId === boardEntryId) return null;
  // B1 S3 — "may NOT ... pin the system Board anywhere," closed at THIS end
  // too, the SAME belt-and-suspenders shape as the self-pin guard right
  // above: BoardEditor.tsx's own onOpenPin no-op already makes this
  // unreachable through the UI (the sheet never opens on a system Board's
  // own Page face), but this guard is what actually holds if some OTHER
  // call site ever pins entryId onto a DIFFERENT board directly.
  if (getSystemKind(source)) return null; // (reads LAW 1's resolved row — one fetch, one truth)
  const board = getJournalEntry(boardEntryId);
  if (!board || board.pageType !== 'board') return null;
  // ── LAW 2 · THE TARGET IS A BOARD THE WRITER MAY AUTHOR ONTO ──────────────
  // The built guard above checks `getSystemKind` on the SOURCE only, and that
  // asymmetry was never intentional — it was simply the half B1 needed. A
  // condition board's membership is DERIVED (`reconcileSystemBoard` from
  // `qualifyingPagesFor`, in reaction to loose/deleted/in-journal-view); it is
  // never authored. So an authored write onto one would be a hand-placed card
  // in a list the app recomputes — erased at the next reconcile, and wrong in
  // the meantime. Refused here, at the same seam, for the same reason the
  // source side is.
  if (getSystemKind(board)) return null;
  // ── LAW 3 · NO CYCLE. Item 128's first invariant ──────────────────────────
  // "A board cannot be placed inside itself, or inside a board it already
  // contains." Walked on EVERY write (see `wouldNestCycle`), because a
  // membership lawful when made becomes a cycle later when its parent moves.
  // A cycle presents as a hang or a blown stack far from the pin that caused
  // it: trivial to prevent, expensive to find.
  if (wouldNestCycle(entryId, boardEntryId)) return null;
  const existing = board.boxes ?? [];
  if (liveBoxes(existing).some(b => b.kind === 'page-pin' && b.entryId === entryId)) return board; // already pinned — idempotent (a tombstoned pin is NOT a membership)
  const startY = liveBoxes(existing).reduce((m, b) => Math.max(m, b.y + b.h), 0) + BOARD_STACK_GAP;
  const startZ = existing.reduce((m, b) => Math.max(m, b.z), 0) + 1;
  // a new membership is NOT displayed until the writer places it: onCanvas:false is written explicitly (absence means displayed); the seat still computes for a later Display; the silhouette comes from the entry [persistence §17]
  const silhouette = pinSilhouetteFor(source);
  const pin: Box = { id: generateId(), kind: 'page-pin', x: 0.05, y: startY,
    w: silhouette.w, h: silhouette.h,
    z: startZ, entryId, onCanvas: opts?.display === true };
  saveJournalEntry({ ...board, boxes: [...existing, pin] });
  return getJournalEntry(boardEntryId);
}

// the display act: sets a membership's canvas flag, `at` being the drag's landing point; a no-op when the membership does not exist (it never creates one) [persistence §18]
export function setPinDisplayed(boardEntryId: string, entryId: string, displayed: boolean, at?: { x: number; y: number }): JournalEntry | null {
  const board = getJournalEntry(boardEntryId);
  if (!board || board.pageType !== 'board') return null;
  const boxes = board.boxes ?? [];
  const idx = boxes.findIndex(b => b.kind === 'page-pin' && b.entryId === entryId && !isHiddenSelf(b));
  if (idx < 0) return null;
  const topZ = boxes.reduce((m, b) => Math.max(m, b.z), 0) + 1;
  const next = boxes.slice();
  next[idx] = { ...next[idx], onCanvas: displayed, ...(at ? { x: at.x, y: at.y, z: topZ } : {}) };
  saveJournalEntry({ ...board, boxes: next });
  return getJournalEntry(boardEntryId);
}

// PW1 S3 — test/inspection seam, the wrizoPinPageToBoard neighbour below's own
// established shape. The harness must be able to write a pin in the PRE-EXISTING
// grandfathered shape (no flag at all) to prove absence still means displayed.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoSetPinDisplayed?: unknown }).wrizoSetPinDisplayed = durableSeam(setPinDisplayed);
}


// card transfer, copy only: a NEW box with a NEW id on the target board, source untouched, so edits cannot follow; threads do not travel (their endpoints are box ids on one board); a Box has no tags to carry [persistence §19]
const COPY_OFFSET = 0.02;

/**
 * Copy one board-owned card onto another board. Returns the new box, or null
 * if the act is refused (a missing source, a non-copyable row kind, or a
 * target a writer may not author onto).
 */
export function copyCardToBoard(sourceBoardId: string, boxId: string, targetBoardId: string): Box | null {
  const source = getJournalEntry(sourceBoardId);
  const target = getJournalEntry(targetBoardId);
  if (!source || !target || target.pageType !== 'board') return null;
  // The same target law S1 established for memberships: a condition board's
  // contents are DERIVED, so a hand-placed copy there would be erased at the
  // next reconcile. One rule about what a writer may author onto, two acts.
  if (getSystemKind(target)) return null;
  const box = liveBoxes(source.boxes).find(b => b.id === boxId);   // a deleted (tombstoned) card cannot be copied
  if (!box) return null;
  // COPY APPLIES TO BOARD-OWNED CONTENT ONLY. A page-pin and a board-card are
  // MEMBERSHIPS, not content — "copying" one would just be a second membership,
  // which the Places checkbox already makes — and a connection is a thread,
  // which cannot travel. The verbs teach this at the row (CA1); this refuses it
  // at the seam, so the two cannot drift.
  if (box.kind !== 'text' && box.kind !== 'ink') return null;

  const existing = target.boxes ?? [];
  const startY = liveBoxes(existing).reduce((m, b) => Math.max(m, b.y + b.h), 0) + COPY_OFFSET;
  const startZ = liveBoxes(existing).reduce((m, b) => Math.max(m, b.z), 0) + 1;
  // the copy is built from a WHITELIST, not spread-and-strip: a new Box field travels only when someone says so (a strip list let sourceEntryId through) [persistence §20]
  const copy: Box = {
    id: generateId(),
    kind: box.kind,
    x: 0.05, y: startY, z: startZ,
    w: box.w, h: box.h,
    ...(box.text !== undefined ? { text: box.text } : {}),
    ...(box.strokes !== undefined ? { strokes: box.strokes } : {}),
    ...(box.fontFace !== undefined ? { fontFace: box.fontFace } : {}),
    ...(box.fontSize !== undefined ? { fontSize: box.fontSize } : {}),
    copiedFromBoardId: sourceBoardId,
  };
  saveJournalEntry({ ...target, boxes: [...existing, copy] });
  return copy;
}

// Test/inspection seam — this file's own `wrizoPinPageToBoard` convention.
if (typeof window !== 'undefined') {
  // Wrapped in `durableSeam` — main's rule, found at this merge: EVERY mutating
  // seam flushes, enforced by seed-guard.mjs. This seam was written before that
  // rule reached the branch, so it merged in clean and WRONG: a fixture that
  // copies and then navigates would lose the write to the debounce — the
  // NOVERDICT that killed 36 of 80 files on one leg.
  (window as unknown as { wrizoCopyCardToBoard?: unknown }).wrizoCopyCardToBoard = durableSeam(copyCardToBoard);
}

// FX6 S4 — test/inspection seam (this file's own established pattern —
// see setNotebookPosition's own `window.wrizoNotebook` neighbor above):
// PinToBoardSheet.tsx's own leaf exclusion already makes a self-pin
// unreachable through the UI, so the ONLY way to prove pinPageToBoard's
// OWN guard (the "belt" half of "belt and suspenders") actually holds —
// rather than merely reading the source and trusting it — is a direct
// call, bypassing the sheet entirely. Exposed unconditionally (module
// load, not component-mount-scoped), the SAME shape wrizoDeskLexicon uses.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoPinPageToBoard?: unknown }).wrizoPinPageToBoard = durableSeam(pinPageToBoard);
}

// the RAW structural scan (condition boards included): which boards carry a page-pin for this entry - for "connected" use getBoardsConnecting [persistence §21]
export function getBoardsPinning(entryId: string): { id: string; title: string }[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && e.pageType === 'board' && liveBoxes(e.boxes).some(b => b.kind === 'page-pin' && b.entryId === entryId))
    .map(e => ({ id: e.id, title: e.text.trim() ? e.text.trim().split('\n')[0].slice(0, 60) : 'Untitled board' }));
}

// the connection reader: getBoardsPinning minus the condition boards (Shelf, Trash, Journal display a condition, not a connection); the only form that may feed a list claiming the writer connected something [persistence §22]
export function getBoardsConnecting(entryId: string): { id: string; title: string }[] {
  return getBoardsPinning(entryId).filter(b => getSystemKind(getJournalEntry(b.id)) === undefined);
}
