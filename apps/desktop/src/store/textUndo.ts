// FX6 S1 — real undo/redo for Draft mode's own free-editing contenteditable
// (ForwardOnlyEditor.tsx's `drafting` branch) and the card popup
// (BoardEditor.tsx's BoardCardPopup). NOT wired into Journal/Free Write
// (ForwardOnlyEditor.tsx's `journal` branch) — see THE SCOPE LAW below.
//
// ROOT CAUSE (diagnosed empirically, FX5 S7, confirmed again while building
// this ticket): both surfaces redecorate their entire contenteditable's
// innerHTML on every single input (store/draftDecoration.ts's
// decorateEditorFor — `el.innerHTML = decorate(plain) + ...`), which is
// required for the live markdown-mark decoration (bold/italic/heading spans
// that can appear or move ANYWHERE in the line on any keystroke — there is
// no cheap "did decoration change nearby" check that would let a normal
// keystroke skip the rewrite). A raw `innerHTML` property write is invisible
// to Chromium's own undo manager and, worse, invalidates whatever DOM nodes
// it WAS tracking from the keystroke that preceded it — confirmed live:
// `execCommand('undo')` and a genuinely trusted Ctrl/Cmd+Z alike both
// silently do nothing on this editor, on ordinary typing, not just the
// em-dash substitution FX5 S7 first found this on.
//
// CHOICE OF MECHANISM (the brief's own two lawful paths, decided
// empirically, not by default):
//   (a) surgical DOM updates that preserve native undo — REJECTED. It would
//       mean the decoration pass could never again touch nodes outside the
//       exact characters that changed, which the SAME markdown-mark engine
//       above structurally can't guarantee (typing the second `*` of a
//       pair, or a character that completes/breaks a heading match,
//       re-decorates a span that isn't adjacent to the caret at all). Making
//       that surgical would mean rewriting draftDecoration.ts's whole
//       rendering strategy into an incremental diff/patch engine — a much
//       larger, far riskier change, with no proven precedent anywhere else
//       in this codebase, for a ticket whose own invariants insist Draft's
//       dimmed-syntax register stay untouched.
//   (b) an app-level snapshot/coalesced undo stack, wired to the SAME
//       Ctrl/Cmd+Z (and Shift+Z / Ctrl+Y for redo) keystrokes a writer would
//       actually press — CHOSEN. It needs zero changes to
//       draftDecoration.ts (redecorate-on-every-input keeps working exactly
//       as before), reuses the SAME decorateEditorFor/readEditorPlainText
//       plumbing every other programmatic edit in these two files already
//       goes through (Enter, IME commit, rail format actions), and gives
//       full, disclosed control over coalescing granularity and the
//       em-dash-shim fold (below) — a purpose-built module this codebase
//       already has direct precedent for (store/emDash.ts's own one-step
//       shim was exactly this shape, just narrower).
//
// COALESCING GRANULARITY (CC's own call, disclosed): "word-ish" — a run of
// plain character inserts coalesces into ONE undo step until a boundary
// (a space/tab/newline completes the word — the SAME `isBoundary` character
// class forward-only's own runway uses, store/forwardOnly.ts), a genuine
// pause in typing (>600ms — long enough that a writer pausing mid-thought
// reads as a new step, short enough that ordinary fast typing never splits
// mid-word), or a change in EDIT KIND (typing then deleting, or vice versa,
// always opens a fresh step — undoing a delete should never also silently
// undo the insert before it). Consecutive deletes (holding Backspace)
// coalesce the same word-ish way. A discrete, self-contained edit — paste,
// a rail Bold/Italic click, an IME-composed insertion, the em-dash
// substitution itself — is ALWAYS its own isolated step (never coalesced
// with whatever came before or after), matching how a writer actually
// perceives those as one deliberate action.
//
// THE EM-DASH SHIM FOLDS IN HERE (FX5 S7's own one-off `lastEmDash`/
// `revertEmDash` tracking retires — see store/emDash.ts's own updated
// header comment): the substitution's own pre- and post-text are recorded
// as two record() calls (a 'boundary' closing the word that was just
// typed, immediately followed by an 'atomic' step for the swap itself) —
// so the substitution is ALWAYS its own isolated undo step, and ONE
// Ctrl/Cmd+Z immediately after an autocorrect reverts JUST the dash,
// never a bigger chunk of the preceding typing, and never a double-undo
// seam (there is exactly one group boundary between "hyphens" and "em
// dash"). Unlike the old shim, this is no longer scoped to "immediately
// after, before any other edit" — it's simply the next entry on a REAL,
// walkable stack, so it still reverts correctly even if the writer kept
// typing first (Ctrl/Cmd+Z just walks back through everything in order,
// exactly as a writer would expect from real undo).
//
// THE SCOPE LAW (the brief's own sentence): this module is wired into
// EXACTLY two places — ForwardOnlyEditor.tsx's `drafting` branch and
// BoardEditor.tsx's BoardCardPopup — and nowhere else. Free Write
// (ForwardOnlyEditor.tsx's `journal` branch, forwardLock on OR off) never
// imports this file at all: its own handleBackspace/strikeStep model
// (store/forwardOnly.ts) is a completely separate code path that this
// ticket does not touch, so forward-lock's deletion discipline — struck,
// never erased, escalating runway — stays byte-identical, and undo simply
// has no code path to reach it. Verified live, not assumed: apps/desktop/
// scripts/harness/fx6.mjs's own S1 section presses Ctrl/Cmd+Z inside a
// forward-locked Free Write surface and asserts nothing changes.

export type EditKind = 'char' | 'boundary' | 'delete' | 'atomic';

export interface TextSnapshot {
  text: string;
  caret: number | null;
}

// A genuine pause always opens a fresh undo step, regardless of kind.
const COALESCE_IDLE_MS = 600;
// Generous but bounded — a very long single session can't grow this
// unboundedly; far more than any felt-test session will ever need.
const MAX_DEPTH = 500;

export interface TextUndoStack {
  /** Record that the editor now reads `next`, having just made an edit of
   * `kind`. Coalesces into the currently-open step when `kind` matches the
   * step in progress and neither a boundary/atomic edit nor an idle gap
   * closed it first; otherwise opens a new step (pushing the PRIOR state
   * onto the undo history). Always clears the redo history — a fresh edit
   * after an undo abandons whatever was undone, same as every other editor. */
  record(next: TextSnapshot, kind: EditKind): void;
  /** Pop one step back, or null if there's nothing to undo. */
  undo(): TextSnapshot | null;
  /** Redo one step forward, or null if there's nothing to redo. */
  redo(): TextSnapshot | null;
  /** True if undo()/redo() would currently do something — for callers that
   * want to preventDefault only when there's genuinely something to do
   * (not required by any current caller, but a cheap, honest capability). */
  canUndo(): boolean;
  canRedo(): boolean;
}

export function createTextUndoStack(initial: TextSnapshot): TextUndoStack {
  let current: TextSnapshot = initial;
  const past: TextSnapshot[] = [];
  const future: TextSnapshot[] = [];
  // The very first edit always opens a fresh step (nothing to coalesce
  // into yet).
  let pendingBoundary = true;
  let lastKind: EditKind | null = null;
  let lastEditAt = 0;

  return {
    record(next, kind) {
      const now = Date.now();
      const idle = lastEditAt !== 0 && now - lastEditAt > COALESCE_IDLE_MS;
      // A 'boundary' character completing a run of 'char' inserts is the
      // ONE kind-transition that does NOT open a new step on its own — it's
      // the natural close of the word that preceded it (e.g. the space at
      // the end of "hello world " belongs WITH "world", not as its own
      // single-character step). Every other transition (delete<->char,
      // delete<->boundary, anything into/out of 'atomic') still opens one,
      // same as an idle gap or an already-pending boundary/atomic close.
      const boundaryClosesRun = lastKind === 'char' && kind === 'boundary';
      const opensNewStep = kind === 'atomic' || pendingBoundary || idle ||
        (lastKind !== kind && !boundaryClosesRun);
      if (opensNewStep) {
        past.push(current);
        if (past.length > MAX_DEPTH) past.shift();
      }
      current = next;
      future.length = 0;
      lastEditAt = now;
      lastKind = kind;
      // 'boundary' (a just-completed word/line) and 'atomic' (a discrete,
      // self-contained edit) both CLOSE the step they just extended — the
      // NEXT edit, whatever it is, starts fresh. 'char'/'delete' runs stay
      // open (continue coalescing) until something closes them.
      pendingBoundary = kind === 'boundary' || kind === 'atomic';
    },
    undo() {
      if (past.length === 0) return null;
      future.push(current);
      current = past.pop()!;
      pendingBoundary = true;
      lastKind = null;
      return current;
    },
    redo() {
      if (future.length === 0) return null;
      past.push(current);
      current = future.pop()!;
      pendingBoundary = true;
      lastKind = null;
      return current;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
}

// Classify a native contenteditable edit from its beforeinput `inputType` +
// `data`, for the two callers above (both capture this at beforeinput, the
// same "before the DOM mutates" discipline FX5 S7's own `justTypedSpace`
// flag already established, so it can never be fooled by a later edit that
// happens to leave a matching pattern behind). A multi-character
// `insertText` (autofill/spellcheck-replace — a real keystroke stream never
// produces one; the harness's own typeKeys dispatches one character per
// event) is classified 'atomic' rather than 'char': it wasn't typed
// keystroke-by-keystroke, so it shouldn't silently coalesce into a
// keystroke-by-keystroke word group.
export function classifyEditKind(inputType: string, data: string | null): EditKind {
  if (inputType === 'insertText') {
    const d = data ?? '';
    if (d.length !== 1) return 'atomic';
    return d === ' ' || d === '\t' ? 'boundary' : 'char';
  }
  if (inputType.startsWith('delete')) return 'delete';
  return 'atomic'; // paste, drop, IME insert, spellcheck replace, anything else unrecognized
}

// ForwardOnlyEditor.tsx owns its undo stack inside a private mount-effect
// closure (the same shape store/emDash.ts's own `lastEmDash` used) — but
// PageEditor.tsx's applyRailFormat (a Bold/Italic rail click) lives OUTSIDE
// that closure, in the PARENT component, and needs to record an atomic step
// into the SAME stack a keystroke would. A WeakMap keyed by the live host
// element (the exact node both `editorRef.current` in PageEditor.tsx and
// `el` inside ForwardOnlyEditor's own effect already both point at) is the
// established shape for "an imperative capability that travels alongside an
// already-shared DOM ref" without widening ForwardOnlyEditor's own ref type
// (which several existing callers already use as a bare HTMLDivElement —
// useWayBack, getSelectionOffsets, setCaretOffset). Entries are removed on
// unmount for tidiness; WeakMap would otherwise still let them be collected
// once the element itself is, so this is a courtesy, not a correctness
// requirement. BoardEditor.tsx's BoardCardPopup does NOT need this — its
// own applyBoardFormat lives in the SAME component as the mount effect, so
// a plain useRef there is simpler and sufficient (no cross-component reach
// required).
const registry = new WeakMap<HTMLElement, TextUndoStack>();

export function registerUndoStack(el: HTMLElement, stack: TextUndoStack): void {
  registry.set(el, stack);
}

export function unregisterUndoStack(el: HTMLElement): void {
  registry.delete(el);
}

export function getRegisteredUndoStack(el: HTMLElement): TextUndoStack | undefined {
  return registry.get(el);
}
