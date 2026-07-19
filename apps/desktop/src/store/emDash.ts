import { rangeFromPlainOffsets } from './caretOffset';

// FX5 S7 — the em dash, Word's own convention: two or three hyphens
// immediately followed by a word and a trailing space become a single em
// dash the instant that space lands (e.g. "Hello--world " -> "Hello—world
// "). Scoped to Draft mode's own free-editing contenteditable
// (ForwardOnlyEditor.tsx's `drafting` branch) and the card popup
// (BoardCardPopup.tsx) ONLY — a deliberate, disclosed scope decision, not
// an oversight: "one undo step reverts to the literal hyphens" only means
// something on a surface with genuine, uninterrupted native undo. Journal
// (JournalEntry.tsx) and Free Write (ForwardOnlyEditor.tsx's `journal`
// mode) both carry their OWN custom editing models — Journal groups edits
// into BURST-based undo snapshots (`lastActionRef`, keyed by an idle gap,
// not by keystroke), and Free Write has no undo concept at all (backspace
// STRIKES, forward-only, never reverses) — grafting a single, isolated
// "undo step" onto either would need much larger, out-of-scope surgery on
// those surfaces' own undo semantics. Draft mode and the card popup both
// rely on nothing but the browser's own native contenteditable undo
// (confirmed by reading both files — neither installs a keydown handler
// for Ctrl/Cmd+Z or any burst-snapshot system of its own), which is
// exactly what makes the execCommand technique below reliable there.
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
 * Returns whether the substitution ran, and the ORIGINAL hyphen text
 * (needed by the one-step undo shim below — see this module's own header
 * comment for why NEITHER execCommand nor a real Ctrl/Cmd+Z ends up
 * undo-able here, and why a small custom shim is necessary at all). */
export function applyEmDash(el: HTMLElement, start: number, end: number): { applied: boolean; hyphens: string } {
  const range = rangeFromPlainOffsets(el, start, end);
  if (!range) return { applied: false, hyphens: '' };
  const hyphens = range.toString();
  const sel = window.getSelection();
  if (!sel) return { applied: false, hyphens: '' };
  sel.removeAllRanges();
  sel.addRange(range);
  const applied = document.execCommand('insertText', false, EM_DASH);
  return { applied, hyphens };
}

// FX5 S7 — "one undo step reverts to the literal hyphens": found live (not
// assumed) that this does NOT work via either execCommand('undo') or a
// genuinely trusted Ctrl/Cmd+Z keystroke, on EITHER surface this ships on.
// Root cause: BOTH ForwardOnlyEditor.tsx's drafting branch AND
// BoardCardPopup.tsx redecorate their ENTIRE contenteditable's innerHTML
// (decorateEditorFor, draftDecoration.ts) on every single input, including
// the em-dash substitution's own synthetic input event — a raw `innerHTML`
// property write is invisible to Chromium's undo manager and, worse,
// invalidates whatever DOM nodes it WAS tracking from the genuine native
// keystroke that preceded it, so its own next "undo" is a silent no-op
// against the CURRENT (script-replaced) DOM. This is a pre-existing
// property of the whole editor (predates this ticket, not something FX5
// can safely rewrite wholesale) — confirmed live: `execCommand('undo')`
// returns `true` (claims success) yet the visible text never changes, on
// ordinary typing too, not just this substitution. The fix: a small,
// purpose-built "undo just the last em-dash" shim, not a claim that native
// undo works here — see ForwardOnlyEditor.tsx's/BoardCardPopup.tsx's own
// keydown handlers for where this gets wired to Ctrl/Cmd+Z, scoped to
// "immediately after, before any OTHER edit" (their own onInput clears the
// pending state on every edit that ISN'T this substitution).
/** Reverts a single em-dash character (at `offset`) back to its original
 * literal `hyphens`, via the SAME execCommand technique (kept symmetric
 * with the forward substitution, though — per this module's own header —
 * neither one is what makes the ONE-STEP feel work; the caller's own
 * pending-state tracking is). */
export function revertEmDash(el: HTMLElement, offset: number, hyphens: string): boolean {
  const range = rangeFromPlainOffsets(el, offset, offset + 1); // the single em-dash character
  if (!range) return false;
  const sel = window.getSelection();
  if (!sel) return false;
  sel.removeAllRanges();
  sel.addRange(range);
  return document.execCommand('insertText', false, hyphens);
}
