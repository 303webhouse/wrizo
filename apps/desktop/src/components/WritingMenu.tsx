import { useEffect, useRef } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import type { FormatAction } from '../store/draftFormat';

// ITEM 186 — WRIZO'S OWN MENU ON THE WRITING SURFACE.
//
// Nick's words: *"Is B-I-U included in the right-click menu? If not, it should
// be."* So this menu is **part of the app**, not part of Experiment 1: a
// right-click on the writing surface opens it **whatever the experiment switch
// says**. Styling is its base; the connect acts are an addition the switch makes.
//
// ⚠ THIS CHANGES EXPERIMENT 1's §0 CLAIM, and the change is the ruling's, not a
// side effect: **OFF is no longer "v1" — OFF is v1 PLUS THIS BASE MENU.** The
// harness asserts exactly that: with the switch off, the menu shows B/I/U and
// NO connect acts. Written here because a claim that moved silently is worse
// than one that never existed.
//
// (It began life as ConnectMenu, which carried the connect acts alone. That name
// would now be a lie about what the menu is, so the file is named for what it
// became.)
//
// ONE FORMATTER, TWO DOORS. The styling acts call the SAME function the strip
// calls — `PageEditor`'s `applyRailFormat` — rather than a second
// implementation. That is what makes FIX's 206 fixes (toggles, cross-paragraph,
// Ctrl+B/I/U) arrive at both doors without being applied twice, and it is why
// this component takes a handler and owns no formatting logic of its own.
//
// ⛔ STYLING IS ABSENT WHERE STYLING IS NOT ALLOWED — not disabled. `onFormat`
// is undefined on Free Write, because item 121 I6 retired styling from that
// surface on Nick's analog law ("no digital styling, no fonts, no formatting on
// that surface") BY ABSENCE. A greyed B here would be G3's locked door wearing
// paint, and would quietly undo that retirement. Note that relying on
// `applyRailFormat`'s own internal `mode !== 'drafting'` guard would NOT be
// enough: it would make the buttons inert, which is the very shape G3 forbids.
//
// ITEM 166 EXCEPTION (a): it opens AT THE POINTER and may lie over the page.
// `position: fixed`, so it sits in no layout track — the editor's rect cannot
// change because this opened, and the editor never unmounts. PAGE IS PRIMARY:
// rect no, unmount no, return not applicable (chrome, not a departure).
//
// ⛔ ABSENT, NOT GREYED, for the connect acts too. With no selection the acts
// that need WORDS are not rendered. What survives a bare caret is the one
// cursor-position act — "Note This", which makes a SPOT-NOTE (EXP1-Q6 exists
// because a caret note has no words to tint, so it has to be reachable).
// "Unlink" appears only when the spot is covered by a live link, and never as a
// bare "Remove": the verb carries which of the two it does.

export interface WritingMenuState {
  /** Viewport coordinates of the pointer that opened it. */
  x: number;
  y: number;
  /** Visible-text offsets of the selection; equal means a bare caret. */
  from: number;
  to: number;
  /** Ids of live links covering this spot — empty means nothing to unlink. */
  coveringLinkIds: string[];
}

export interface WritingMenuConnectActs {
  // ⚠ THEY TAKE THE CAPTURED OFFSETS, not a re-read. A menu item is a
  // non-editable element outside the contenteditable: pressing it COLLAPSES the
  // selection in Chromium, which is the whole reason the strip's format row
  // carries `onMouseDown preventDefault`. A re-read here would find a collapsed
  // selection and turn "Link to…" into a spot-note, silently. The authoritative
  // selection is the one that existed when the writer RIGHT-CLICKED.
  onLink: (from: number, to: number) => void;
  onNote: (from: number, to: number) => void;
  onMakeCard: (from: number, to: number) => void;
  onUnlink: (linkIds: string[]) => void;
}

export interface WritingMenuProps {
  state: WritingMenuState | null;
  onClose: () => void;
  /**
   * Present ONLY where styling is allowed (Draft today; whether Revise joins is
   * with Nick). Undefined on Free Write, which is what keeps B/I/U absent there
   * rather than inert.
   */
  onFormat?: (action: FormatAction) => void;
  /**
   * ITEM 186 — Cut and Copy. Present wherever the menu replaces a native one
   * that would have offered them; NO PASTE, because the paste rail owns that
   * door. They take the captured offsets for the same reason the connect acts do.
   */
  onClipboard?: (kind: 'cut' | 'copy', from: number, to: number) => void;
  /** Present ONLY when the experiment switch is on. */
  connect?: WritingMenuConnectActs;
}

/**
 * Whether the menu would have anything at all to show. The host asks BEFORE it
 * suppresses the native menu: a menu with no items must not open, and must not
 * take the browser's own menu away to show nothing. (Free Write with the switch
 * off is exactly that case today.)
 */
export function writingMenuHasItems(opts: { canStyle: boolean; connectOn: boolean; hasWords: boolean }): boolean {
  // Cut/Copy count as items, but only with WORDS — so a bare caret on Free Write
  // with the switch off still has nothing to show, and still falls through.
  return opts.canStyle || opts.connectOn || opts.hasWords;
}

export function WritingMenu({ state, onClose, onFormat, onClipboard, connect }: WritingMenuProps) {
  const { t: dt } = useDeskLexicon();
  const ref = useRef<HTMLDivElement>(null);

  // Dismissal: a press anywhere else, or Escape. Registered only while open, so
  // a closed menu adds no listeners to the page at all.
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

  // Focus the first item on open: a menu reachable only by right-click still has
  // to be operable by keyboard once it is open.
  useEffect(() => {
    if (!state) return;
    ref.current?.querySelector<HTMLButtonElement>('.dz-menu-item')?.focus();
  }, [state]);

  if (!state) return null;

  const hasWords = state.to > state.from;
  const canUnlink = state.coveringLinkIds.length > 0;
  const run = (fn: () => void) => () => { fn(); onClose(); };

  // Kept inside the viewport without moving the page: the menu shifts itself,
  // nothing shifts for it.
  const MAX_W = 220;
  const MAX_H = 260;
  const left = Math.max(4, Math.min(state.x, window.innerWidth - MAX_W - 4));
  const top = Math.max(4, Math.min(state.y, window.innerHeight - MAX_H - 4));

  return (
    <div
      ref={ref}
      className="dz-menu wz-writing-menu"
      /* ⛔ THE SAME GUARD THE STRIP'S FORMAT ROW CARRIES, and for the same
         measured reason: these buttons are OUTSIDE the contenteditable, so a
         press's mousedown would blur it and collapse the writer's selection
         before the click handler ran. Belt and braces beside the captured
         offsets — the acts no longer DEPEND on the selection surviving, but a
         surviving selection is what lets Cut and Copy act without the writer
         seeing their words flash deselected. */
      onMouseDown={e => e.preventDefault()}
      role="menu"
      aria-label={dt('menuWritingLabel')}
      /* position/right live in .wz-writing-menu; only the pointer's own
         coordinates are dynamic. */
      style={{ left, top, zIndex: 60, minWidth: 160 }}
    >
      {/* THE BASE: styling, in Nick's own order. Present whatever the switch
          says, and NOT gated on a selection — the strip's B/I/U are not either,
          and the formatter handles a bare caret by toggling there. */}
      {onFormat && (
        <>
          <button type="button" className="dz-menu-item" role="menuitem" onClick={run(() => onFormat('bold'))}>
            {dt('stylingBold')}
          </button>
          <button type="button" className="dz-menu-item" role="menuitem" onClick={run(() => onFormat('italic'))}>
            {dt('stylingItalic')}
          </button>
          <button type="button" className="dz-menu-item" role="menuitem" onClick={run(() => onFormat('underline'))}>
            {dt('stylingUnderline')}
          </button>
        </>
      )}

      {/* ITEM 186 — CUT and COPY, after B/I/U (PLAN DESK's brief). They are here
          because replacing the native menu would otherwise TAKE THEM AWAY ON THE
          WEB. NO PASTE: the paste rail owns that door.
          Both need WORDS, so both are absent on a bare caret — never greyed. */}
      {onClipboard && hasWords && (
        <>
          <button type="button" className="dz-menu-item" role="menuitem"
            onClick={run(() => onClipboard('cut', state.from, state.to))}>
            {dt('menuCut')}
          </button>
          <button type="button" className="dz-menu-item" role="menuitem"
            onClick={run(() => onClipboard('copy', state.from, state.to))}>
            {dt('menuCopy')}
          </button>
        </>
      )}

      {/* THE ADDITION: the connect acts, only when the switch is on. */}
      {connect && hasWords && (
        <button type="button" className="dz-menu-item" role="menuitem" onClick={run(() => connect.onLink(state.from, state.to))}>
          {dt('connectMenuLink')}
        </button>
      )}
      {connect && (
        <button type="button" className="dz-menu-item" role="menuitem" onClick={run(() => connect.onNote(state.from, state.to))}>
          {dt('connectMenuNoteThis')}
        </button>
      )}
      {connect && hasWords && (
        <button type="button" className="dz-menu-item" role="menuitem" onClick={run(() => connect.onMakeCard(state.from, state.to))}>
          {dt('connectMenuMakeCard')}
        </button>
      )}
      {connect && canUnlink && (
        <button type="button" className="dz-menu-item" role="menuitem"
          onClick={run(() => connect.onUnlink(state.coveringLinkIds))}>
          {dt('connectMenuUnlink')}
        </button>
      )}
    </div>
  );
}
