import { useEffect, type ReactNode } from 'react';

// BG1 — the Beginnings (docs/wrizo-alpha/p1-wave.md §BG1, S3: "one grammar").
// ONE component, two surfaces: the empty board's row and the empty page's row
// share this file and one vanish rule. Doors, not tasks — nothing here counts,
// scores, checklists, or remembers; there is no completion state and no "get
// started" language anywhere in the row's vocabulary, by construction (the
// component takes labels and handlers, and has nowhere to put a badge).
//
// The vanish rule lives with the CALLER, deliberately, because both callers
// already own the one fact it turns on: the board renders the row only while
// its own render list is empty (`sorted.length === 0` / the projections' own
// `hasCards`), the page only while `wordCount(text) === 0` and the first
// keystroke hasn't fired. One rule — "render only while the surface is empty,
// unmount the instant it isn't" — expressed at the two places that can see
// emptiness, rather than a third copy of the emptiness test in here.
//
// The container is `pointer-events:none` (index.css) — the `.fl-invite` and
// rhizome precedent. This is load-bearing on the page: S2's law is that the
// row NEVER blocks typing, and the caret is live underneath it from the first
// frame. Only the doors themselves take the pointer back.

export type BeginningKey =
  | 'newCard' | 'newPageCard' | 'loadDeck' | 'connectPage' | 'newLane'
  | 'screenplay' | 'sprout' | 'plan';

export interface BeginningDoor {
  key: BeginningKey;
  label: string;
  onOpen: () => void;
}

// Quiet 16px line glyphs, stroked in currentColor so the door's own olive (and
// its hover) carries the icon with it — one color decision, not two.
const GLYPH: Record<BeginningKey, ReactNode> = {
  // A card.
  newCard: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="2.5" y="3.5" width="11" height="9" rx="1" />
      <path d="M8 6.2v3.6M6.2 8h3.6" />
    </svg>
  ),
  // A page (folded corner) — a card that IS a page.
  newPageCard: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M3.5 2h6l3 3v9h-9z" />
      <path d="M9.5 2v3h3" />
    </svg>
  ),
  // A stack — the deck.
  loadDeck: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <rect x="1.5" y="5.5" width="8.5" height="8" rx="1" />
      <path d="M4.5 5.5v-1a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1" />
    </svg>
  ),
  // A page, joined.
  connectPage: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="8.5" y="2" width="6" height="6" rx="1" />
      <circle cx="4" cy="12" r="2" />
      <path d="M5.5 10.5 8.5 7.5" />
    </svg>
  ),
  // Columns — lanes.
  newLane: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M2.5 2.8v10.4M8 2.8v10.4M13.5 2.8v10.4" />
    </svg>
  ),
  // A slug line over action over dialogue — the shape of a script on a page.
  screenplay: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M2.5 3.5h6M2.5 7h11M5.5 10.5h6M5.5 13h4" />
    </svg>
  ),
  // BG1 / P1 amendment 2 — the Sprout: a node on a lateral runner throwing a
  // shoot. The rhizome's own figure, as drawn: the runner travels sideways
  // (it does not begin at a root and it does not end), the node is a swelling
  // on it, and the shoot is what the node sends up.
  sprout: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12.5h14" />
      <circle cx="6" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M6 11C6 8.5 7 6.8 8.8 5.6" />
      <path d="M8.8 5.6c1-1.5 2.6-2 4-1.7-.2 1.9-1.7 3.2-4 1.7z" />
    </svg>
  ),
  // A board with cards on it — the plan.
  plan: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1" />
      <path d="M4 5.8h4M4 8.5h7M4 11.2h3" />
    </svg>
  ),
};

interface BeginningsRowProps {
  // 'board' centers the row on the empty canvas (where the retired one-line
  // pointer sat); 'projection' is the same row in STORYBOARD/OUTLINE, which
  // are ordinary flow blocks with no positioned ancestor; 'page' sets it
  // beside the live caret. One component, three placements — never three rows.
  surface: 'board' | 'projection' | 'page';
  doors: BeginningDoor[];
  // S2 — the page's row is also dismissed by Esc. The board's row has no Esc:
  // it is not covering anything, it IS the empty canvas, and dismissing it
  // would leave the dead end this ticket exists to remove.
  onDismiss?: () => void;
}

export function BeginningsRow({ surface, doors, onDismiss }: BeginningsRowProps) {
  useEffect(() => {
    if (!onDismiss) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  if (doors.length === 0) return null;
  return (
    <div className="wz-beginnings" data-beginnings={surface}>
      {doors.map(door => (
        <button
          key={door.key}
          type="button"
          className="wz-beginning"
          data-beginning={door.key}
          onClick={door.onOpen}
        >
          <span className="wz-beginning-glyph" aria-hidden="true">{GLYPH[door.key]}</span>
          <span className="wz-beginning-label">{door.label}</span>
        </button>
      ))}
    </div>
  );
}
