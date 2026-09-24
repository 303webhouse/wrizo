import { useEffect, useRef } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';

// EXPERIMENT 1 §3 — THE RIGHT-CLICK MENU'S CONNECT ACTS.
//
// Nick's list, in his order: styling · Make a card · Link · Note This · Remove.
// THIS SLICE CARRIES THE CONNECT ACTS ONLY (Fable's ruling): "Link to…",
// "Note This", "Make a card", "Unlink". STYLING STAYS WHERE IT IS TODAY and
// joins this menu in item 186's own build — moving it here would change v1
// behaviour, and §0's acceptance claim is that with the switch OFF the app IS
// v1. This component is additive and never renders unless the flag is on.
//
// ITEM 166 EXCEPTION (a): this opens AT THE POINTER and MAY LIE OVER THE PAGE.
// That is sanctioned, and it is also why it must not displace anything — PAGE IS
// PRIMARY. It is `position: fixed`, so it takes the page out of no layout track:
// the editor's bounding rect cannot change because this exists, and the editor
// never unmounts. Self-check: rect no, unmount no, return not applicable (the
// menu is chrome, not a departure).
//
// ⛔ ABSENT, NOT GREYED (the house law). With no selection the acts that need
// WORDS are not rendered at all — no disabled buttons. What survives a bare
// caret is the CURSOR-POSITION act, and there is exactly one: "Note This",
// which makes a SPOT-NOTE. That is not an invention — EXP1-Q6 exists precisely
// because "a note taken at a caret has no words to tint", so a caret note has
// to be reachable, and this is the door it is reachable through.
//
// ⛔ AND "Unlink" IS OFFERED ONLY WHEN THERE IS SOMETHING TO UNLINK. It appears
// when the pointer's spot is covered by at least one live link. Never a bare
// "Remove": the verb says which of the two it does, because REMOVE UNLINKS AND
// NEVER DELETES.

export interface ConnectMenuState {
  /** Viewport coordinates of the pointer that opened it. */
  x: number;
  y: number;
  /** Visible-text offsets of the writer's selection; equal means a bare caret. */
  from: number;
  to: number;
  /** Ids of live links covering this spot — empty means nothing to unlink. */
  coveringLinkIds: string[];
}

export interface ConnectMenuProps {
  state: ConnectMenuState | null;
  onClose: () => void;
  onLinkTo: (s: ConnectMenuState) => void;
  onNoteThis: (s: ConnectMenuState) => void;
  onMakeCard: (s: ConnectMenuState) => void;
  onUnlink: (s: ConnectMenuState) => void;
}

export function ConnectMenu({ state, onClose, onLinkTo, onNoteThis, onMakeCard, onUnlink }: ConnectMenuProps) {
  const { t: dt } = useDeskLexicon();
  const ref = useRef<HTMLDivElement>(null);

  // Dismissal: a press anywhere else, or Escape. Both are registered only while
  // the menu is open, so an absent menu adds no listeners to the page at all.
  useEffect(() => {
    if (!state) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && e.target instanceof Node && ref.current.contains(e.target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    // `capture` so a press that would otherwise land on the page closes the menu
    // first and does not also move the caret out from under the act.
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [state, onClose]);

  // Focus the first item when it opens, so the menu is reachable by keyboard and
  // not only by pointer — a menu that can only be opened by right-click still has
  // to be operable once open.
  useEffect(() => {
    if (!state) return;
    const first = ref.current?.querySelector<HTMLButtonElement>('.dz-menu-item');
    first?.focus();
  }, [state]);

  if (!state) return null;

  const hasWords = state.to > state.from;
  const canUnlink = state.coveringLinkIds.length > 0;
  const act = (fn: (s: ConnectMenuState) => void) => () => { fn(state); onClose(); };

  // Kept inside the viewport without moving the page: the menu shifts itself,
  // nothing else shifts for it.
  const MAX_W = 220;
  const MAX_H = 180;
  const left = Math.max(4, Math.min(state.x, window.innerWidth - MAX_W - 4));
  const top = Math.max(4, Math.min(state.y, window.innerHeight - MAX_H - 4));

  return (
    <div
      ref={ref}
      className="dz-menu wz-connect-menu"
      role="menu"
      aria-label={dt('connectMenuLabel')}
      /* position/right live in .wz-connect-menu; only the pointer's own
         coordinates are dynamic. */
      style={{ left, top, zIndex: 60, minWidth: 160 }}
    >
      {/* The acts that need WORDS. Absent on a bare caret, never greyed. */}
      {hasWords && (
        <button type="button" className="dz-menu-item" role="menuitem" onClick={act(onLinkTo)}>
          {dt('connectMenuLink')}
        </button>
      )}
      {/* Note This is the one act a bare caret keeps — it makes a spot-note. */}
      <button type="button" className="dz-menu-item" role="menuitem" onClick={act(onNoteThis)}>
        {dt('connectMenuNoteThis')}
      </button>
      {hasWords && (
        <button type="button" className="dz-menu-item" role="menuitem" onClick={act(onMakeCard)}>
          {dt('connectMenuMakeCard')}
        </button>
      )}
      {canUnlink && (
        <button type="button" className="dz-menu-item" role="menuitem" onClick={act(onUnlink)}>
          {dt('connectMenuUnlink')}
        </button>
      )}
    </div>
  );
}
