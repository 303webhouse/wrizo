import { rangeFromPlainOffsets } from './caretOffset';

// FX5 S7 — the em dash, Word's own convention: two or three hyphens
// immediately followed by a word and a trailing space become a single em
// dash the instant that space lands (e.g. "Hello--world " -> "Hello—world
// "). Scoped to Draft mode's own free-editing contenteditable
// (ForwardOnlyEditor.tsx's `drafting` branch) and the card popup
// (BoardEditor.tsx's BoardCardPopup) ONLY — a deliberate, disclosed scope
// decision, not an oversight: Journal (JournalEntry.tsx) and Free Write
// (ForwardOnlyEditor.tsx's `journal` mode) both carry their OWN custom
// editing models — Journal groups edits into BURST-based undo snapshots
// (`lastActionRef`, keyed by an idle gap, not by keystroke), and Free
// Write has no undo concept at all (backspace STRIKES, forward-only, never
// reverses) — grafting the em dash onto either would need much larger,
// out-of-scope surgery on those surfaces' own editing semantics.
//
// FX6 S1 — the one-step "undo just the substitution" shim that used to
// live in this module (a `revertEmDash` function, called from a purpose-
// built Ctrl/Cmd+Z keydown handler in each of the two files above) is
// RETIRED. Real, walkable undo/redo now covers both surfaces (store/
// textUndo.ts — see that file's own header comment for the full root-cause
// diagnosis and mechanism choice); the substitution below simply records
// as two ordinary steps on that general stack (a 'boundary' step for the
// word+space just typed, immediately followed by an 'atomic' step for the
// swap itself — see ForwardOnlyEditor.tsx's/BoardEditor.tsx's own onInput
// comments for exactly where), so "one Ctrl/Cmd+Z after an autocorrect
// reverts just the dash" now falls out of the general mechanism instead of
// a special-cased shim — no separate revert function needed.
const EM_DASH = '—';

// 2-3 hyphens, not preceded by another hyphen (so a 4+ hyphen run never
// partially misfires on its own trailing 2-3), immediately followed by
// one-or-more letters, immediately followed by the space that was JUST
// typed (the trigger — anchored to the very end of `before`, the text with
// that trailing space already dropped).
const TRIGGER = /(?:^|[^-])(-{2,3})(\p{L}+)$/u;

export interface EmDashTrigger { start: number; end: number }

/** Given the FULL plain text read immediately after a space was typed
 * (caret sits right after that space), returns the [start,end) plain-text
 * offset of the hyphen run to replace, or null if the trigger doesn't match
 * right before the caret. Pure and total — no DOM, easy to unit-probe. */
export function findEmDashTrigger(plain: string, caret: number | null): EmDashTrigger | null {
  if (caret === null || caret < 3 || plain[caret - 1] !== ' ') return null;
  const before = plain.slice(0, caret - 1); // drop the trailing space itself
  const m = before.match(TRIGGER);
  if (!m) return null;
  const hyphens = m[1];
  const word = m[2];
  const end = before.length; // the match is anchored to $ (the end of `before`)
  const start = end - word.length - hyphens.length;
  return { start, end: start + hyphens.length };
}

/** Selects `el`'s own plain-text [start,end) hyphen range and replaces it
 * with a single em dash via execCommand('insertText', ...) — the SAME
 * technique JournalEntry.tsx's own voice-wall paste-replace already
 * established in this codebase for a programmatic contenteditable edit.
 * Returns whether the substitution ran. FX6 S1 — this used to also return
 * the original hyphen text for a bespoke revert function that lived in
 * this module (see this file's own header comment); the caller now
 * records the substitution's own pre-image (the full `plain` text it
 * already had in hand) directly on the general undo stack instead, so
 * there's nothing left here that needs the isolated hyphen substring. */
export function applyEmDash(el: HTMLElement, start: number, end: number): { applied: boolean } {
  const range = rangeFromPlainOffsets(el, start, end);
  if (!range) return { applied: false };
  const sel = window.getSelection();
  if (!sel) return { applied: false };
  sel.removeAllRanges();
  sel.addRange(range);
  const applied = document.execCommand('insertText', false, EM_DASH);
  return { applied };
}

// FX5 S7 root cause (still true, still why store/textUndo.ts exists at
// all): found live, not assumed — neither execCommand('undo') nor a
// genuinely trusted Ctrl/Cmd+Z keystroke ends up undo-able on either
// surface this ships on. BOTH ForwardOnlyEditor.tsx's drafting branch AND
// BoardEditor.tsx's BoardCardPopup redecorate their ENTIRE
// contenteditable's innerHTML (decorateEditorFor, draftDecoration.ts) on
// every single input, including the em-dash substitution's own synthetic
// input event — a raw `innerHTML` property write is invisible to
// Chromium's undo manager and, worse, invalidates whatever DOM nodes it
// WAS tracking from the genuine native keystroke that preceded it, so its
// own next "undo" is a silent no-op against the CURRENT (script-replaced)
// DOM. This is a pre-existing property of the whole editor (predates FX5,
// not something either ticket could safely rewrite wholesale) — confirmed
// live: `execCommand('undo')` returns `true` (claims success) yet the
// visible text never changes, on ordinary typing too, not just this
// substitution.
