// the "Start Here" hint's state: device-local, keyed per board, naming only the dealt card ids - never in `boxes`, never synced [deckHint §1]

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
