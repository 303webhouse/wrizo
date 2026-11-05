import type { JournalEntry } from '../../types';
import { cache, generateId } from './core';
import { saveJournalEntry } from './journal';
import { getJournalEntry, getJournalPages, getNotebookPages, getShelfEntries } from './entries';

// --- BM1 S2 — the page⇄board pairing --------------------------------------
// A 1:1 page⇄board relation. The POINTER lives on the page side only
// (planBoardId); the board's own record — origin, boxes, projectId — is never
// touched by pairing, so its derived Journal/Shelf/Trash membership is provably
// unaffected (the board's back-reference is DERIVED by scan, never stored).
// Every function here is a plain scan/merge over the existing cache — no new
// collection, no new sync path (the nullable text column rides journal_entries'
// own round-trip). `export function` declarations hoist, so belongsOnShelf
// (above) may call isPairedPlanBoard even though it is defined here, below it.

// Is this board currently the plan face of some LIVE page?
export function isPairedPlanBoard(boardId: string): boolean {
  return cache.journalEntries.some(e => !e.deletedAt && e.planBoardId === boardId);
}

// The live page a board is paired to (the owner of its plan face), or null.
export function getPairedPageId(boardId: string): string | null {
  const page = cache.journalEntries.find(e => !e.deletedAt && e.planBoardId === boardId);
  return page ? page.id : null;
}

// The plan board a page is paired to (if one has been born), or null. Reads
// `?? null` so callers see the brief's logical "planBoardId: null" for an
// unpaired page even though the field itself stays absent-not-falsy.
export function getPlanBoardId(pageId: string): string | null {
  return getJournalEntry(pageId)?.planBoardId ?? null;
}

// Lazy birth (S2): a page's plan board is created on its FIRST flip — never
// before, never automatically. Idempotent: a second call returns the SAME
// board. Born EMPTY (boxes: []) in OPEN mode, projectId null + origin 'loose',
// so it stays out of every derived view (Journal via origin; Shelf via
// isPairedPlanBoard; Notebook via pageType 'board') until its page is deleted,
// when it orphans into ordinary loose membership. Page is Primary — the plan
// face is subordinate, lazily born, never first. Callers flush the page's own
// unsaved text first (the door handlers do), so the pointer-set merge below
// never clobbers a freshly-typed run.
export function getOrCreatePlanBoard(pageId: string): JournalEntry | null {
  const page = getJournalEntry(pageId);
  if (!page || page.pageType === 'board') return null; // a board is never its own plan face
  if (page.planBoardId) {
    const existing = getJournalEntry(page.planBoardId);
    if (existing) return existing;
    // re-mint is the designed behaviour (a soft-deleted board lands here too), and the stale pointer is cleared at detection, not only by the conditional re-pair below [persistence §27]
    const stalePointerOwner = getJournalEntry(pageId);
    if (stalePointerOwner) {
      const { planBoardId: _stale, ...withoutPointer } = stalePointerOwner;
      saveJournalEntry(withoutPointer as JournalEntry);
    }
  }
  const now = new Date().toISOString();
  const board: JournalEntry = {
    id: generateId(),
    text: '',
    projectId: null,
    pageType: 'board',
    boxes: [],
    source: 'page',
    origin: 'loose',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(board);
  const latest = getJournalEntry(pageId);
  if (latest) saveJournalEntry({ ...latest, planBoardId: board.id });
  return getJournalEntry(board.id);
}

// Explicit pairing FROM the board side (S2): "pair this board with a page…".
// The ONLY way an EXISTING board gains a Write (page) face — never by
// inference. Enforces 1:1 at both ends and refuses to pair a board to a board.
export function pairBoardWithPage(boardId: string, pageId: string): boolean {
  const board = getJournalEntry(boardId);
  const page = getJournalEntry(pageId);
  if (!board || board.pageType !== 'board') return false;
  if (!page || page.pageType === 'board') return false;
  if (page.planBoardId) return false;           // page already paired (1:1)
  if (isPairedPlanBoard(boardId)) return false; // board already paired (1:1)
  saveJournalEntry({ ...page, planBoardId: boardId });
  return true;
}

// Unpair (S2). The page's planBoardId key is DELETED entirely (not set to
// null), restoring the page BYTE-IDENTICAL to its grandfathered shape — "the
// page is untouched," the absent-not-falsy discipline restoreEntry follows.
// The board itself is never touched here; the caller decides its fate.
export function unpairPlanBoard(boardId: string): void {
  const stale = cache.journalEntries.find(e => !e.deletedAt && e.planBoardId === boardId);
  if (!stale) return;
  const live = getJournalEntry(stale.id);
  if (!live) return;
  const { planBoardId: _drop, ...rest } = live;
  saveJournalEntry(rest as JournalEntry);
}

// Test/inspection seam — the pairing view (the wrizoBoard/wrizoNotebook
// convention). Lets bm1.mjs assert lazy birth / explicit pair / unpair / orphan
// without DOM.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoPairing?: unknown }).wrizoPairing = {
    planBoardId: getPlanBoardId,
    pairedPageId: getPairedPageId,
    isPaired: isPairedPlanBoard,
    birth: getOrCreatePlanBoard,
    pair: pairBoardWithPage,
    unpair: unpairPlanBoard,
  };
  // Derived-membership read seam (the wrizoNotebook precedent) — lets bm1.mjs
  // assert Journal/Shelf counts are unaffected by pairing, and that a plan
  // board stays off the Shelf while paired and orphans onto it once its page
  // is deleted.
  (window as unknown as { wrizoDerived?: unknown }).wrizoDerived = {
    journal: () => getJournalPages().map((e) => e.id),
    shelf: () => getShelfEntries().map((e) => e.id),
    notebook: () => getNotebookPages().map((e) => e.id),
  };
}
