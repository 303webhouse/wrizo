import { useEffect, useState } from 'react';

// ITEM 84, TD4 — THE SELECTION SEAM, and the whole reason it is a HOST-side hook
// rather than something the Tutor does for itself.
//
// A13 is architectural: the Tutor holds no editor reference and no text setter,
// and tu1.mjs asserts that structurally rather than by enumerating which buttons
// happen to be harmless. The build brief draws the line for this ticket in one
// sentence — "a read-only selection value may reach the component as a prop; a
// reference to the editor may not" — so the surface's OWNER reads the selection
// and hands down a plain string. What crosses into Tutor.tsx is text. Nothing
// that could write anywhere crosses at all.
//
// WHAT THIS KEEPS, AND WHEN IT LETS GO. The rule is deliberately asymmetric,
// because pressing a button collapses the page's DOM selection and a naive
// listener would therefore clear the stretch at the exact instant the writer
// asked about it:
//
//   * a NON-EMPTY selection with BOTH ends inside the surface is stored. Both
//     ends, not one: a selection that starts on the page and ends outside it is
//     not "just this stretch", and TD4's wire may carry nothing wider than what
//     its button names.
//   * a COLLAPSED selection whose caret sits inside the surface CLEARS it — that
//     is the writer deliberately putting the selection down, on the page, which
//     is the one gesture that means "no longer pointing at that."
//   * anything else — rangeCount 0, a caret in the Tutor's own composer, focus
//     moving to a chip — LEAVES THE STORED VALUE ALONE. This is the case that
//     makes the chip pressable at all.
//
// `active` gates the listener entirely (never a conditional hook — the hook is
// unconditional, its EFFECT is gated) so a surface that has no use for a
// selection does no work at all: Free Write mounts no Draft roster, and a
// selection drag fires `selectionchange` per character.
export function useSurfaceSelection(surfaceSelector: string, active: boolean): string {
  const [selectionText, setSelectionText] = useState('');

  useEffect(() => {
    if (!active) return;
    const onSelectionChange = () => {
      const surface = document.querySelector(surfaceSelector);
      if (!surface) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return; // cleared by a focus move, not by the writer
      const { anchorNode, focusNode } = sel;
      if (!anchorNode || !focusNode) return;
      const bothInside = surface.contains(anchorNode) && surface.contains(focusNode);
      if (!bothInside) return;               // outside the paper: not ours to read, not ours to clear
      const text = sel.isCollapsed ? '' : sel.toString();
      // React bails on an identical value, so a drag across a word that keeps
      // resolving to the same string costs no render.
      setSelectionText(text);
    };
    document.addEventListener('selectionchange', onSelectionChange);
    onSelectionChange(); // adopt whatever already stands when the gate opens
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [surfaceSelector, active]);

  // A closed gate reports nothing rather than a stale stretch: TD4 must be
  // disabled-visible the moment its surface stops offering a selection.
  return active ? selectionText : '';
}
