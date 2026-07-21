// B3 S1 — the "Start Here" hint's own state (R6's own ruling, verbatim: "the
// first card in the sequence should subtly hint them to 'Start Here' on the
// board, but that nudge should go away once they complete any card").
//
// A client-local flag, keyed PER BOARD (not one bare shared id) — the exact
// "cross-surface 'celebrate once' state needs per-entity scoping" lesson
// this project has already learned once. Never schema: this rides
// localStorage, the SAME "device-local, pre-account, never server-
// persisted" shape store/firstRun.ts and store/tutorDisclosure.ts already
// use for exactly this class of one-time-ceremony flag — NOT the `boxes`
// jsonb array, so a dealt card's own record never carries this state (the
// "no back-reference in boxes" law stays whole). It also names nothing
// about the DECK itself (no deck id, no template identity) — only which
// CARD ids were just dealt, ordinary board-local bookkeeping in the same
// spirit as board-meta's own footerOn/canvasW/canvasH fields, just off the
// synced record entirely since it's disposable UI state, not authored data.
//
// One slot per board: the most recent deal's own first card wins. The fence
// (S1's own words): "edit = the writer's first change to a dealt card's
// content" — BoardEditor.tsx's own commitText calls noteDealtCardEdited on
// every genuine text commit; once cleared, `active` never re-arms itself
// (a card ceasing to be the newest ever again would require a fresh deal,
// which arms a brand-new hint deliberately, not a resurrection of the old
// one) — "once gone, never returns even if other cards are later edited."

const PREFIX = 'wrizo-deck-starthere-';

interface HintState { cardId: string; dealtIds: string[]; active: boolean }

function key(boardId: string): string { return PREFIX + boardId; }

function load(boardId: string): HintState | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key(boardId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.cardId !== 'string' || !Array.isArray(parsed.dealtIds)) return null;
    return parsed as HintState;
  } catch {
    return null;
  }
}

function save(boardId: string, state: HintState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key(boardId), JSON.stringify(state));
  } catch {
    // ignore — the hint is a nicety, never load-bearing
  }
}

// Called once, right when a deal happens (either door) — arms a fresh hint
// on THIS deal's own first card, superseding whatever the board's prior
// hint state was (a fresh deal is a fresh "orientation on an artifact the
// writer explicitly asked to be built" — R6's own disposition).
export function armStartHere(boardId: string, cardId: string, dealtIds: string[]): void {
  save(boardId, { cardId, dealtIds, active: true });
}

// The card id currently wearing the hint, or null (never armed, already
// dismissed, or this board has no dealt cards at all).
export function getStartHereCardId(boardId: string): string | null {
  const s = load(boardId);
  return s && s.active ? s.cardId : null;
}

// The writer's first genuine content edit to ANY card from the currently-
// armed deal — not just the hinted one (S1's own "not just that one card").
// A no-op if the hint isn't active, or the edited box isn't part of the
// currently-armed deal (editing an unrelated card never dismisses it).
export function noteDealtCardEdited(boardId: string, editedBoxId: string): void {
  const s = load(boardId);
  if (!s || !s.active) return;
  if (!s.dealtIds.includes(editedBoxId)) return;
  save(boardId, { ...s, active: false });
}
