// ITEM 211 - THE EDITING RULES FOR MARKS THAT NEVER SHOW, as ONE controller both writing surfaces attach: the page
// (ForwardOnlyEditor's free-edit branch, where PR #7 built them inline) and the board card popup (BoardEditor's BoardCardPopup,
// which until now kept the interim reveal-at-marker rule because it had none of them). Moved here, not copied: two surfaces with
// two copies of these rules is the drift this codebase keeps paying for (the mark reader alone had five copies).
//
// The rules themselves are pure and live in store/hiddenMarks.ts. This file is the DOM half that drives them - what PR #7's
// ForwardOnlyEditor did, unchanged in behaviour:
//   - beforeinput captures the text and selection a NATIVE edit starts from; after the input, the edit is rebuilt from it so no lone
//     mark survives (replaceRange), and a space typed at a styled word's end steps out past its closing marks, which the next letter
//     takes back in (reabsorb).
//   - Enter is computed (enterAt): a run the caret is inside closes before the newline and reopens after it.
//   - the arrows move by visible characters; Backspace and Delete never take a lone hidden mark.
//   - a caret is snapped off hidden marks after every move; a CLICK keeps the side of a run's closing marks it landed on.
// IME composition stays native - never rebuilt. A paste is captured like typing (typed-literal). IN-APP-COPY-FORMAT: a copy or cut writes
// two formats - the plain characters for other apps, Wrizo's own markup beside them (store/clipboardFormat.ts) - and a cut then deletes
// through replaceRange, the same rule a native cut's input rebuild applied (it has to: once the clipboard is written, the browser deletes
// nothing).
import { backspaceAt, closersAt, deleteAt, enterAt, escapeTyped, nativeRange, reabsorb, replaceRange, snapCaret, snapCaretAfterClick, stepLeft, stepRight, wordBackspaceAt, wordDeleteAt, type EditResult } from './hiddenMarks';
import { extendSelection, placeCaret, selectionEnds } from './hiddenMarksDom';
import { copyPayload, pasteEdit, putOnClipboard, readEnvelope, WRIZO_MIME } from './clipboardFormat';
import { getSelectionOffsets } from './caretOffset';
import type { EditKind } from './textUndo';

export interface HiddenMarkHost {
  el: HTMLElement;
  /** The editor's plain text right now (the EOF guard removed). */
  plainNow(): string;
  /** True while text on screen is not the writer's yet: an IME composition, or an em-dash substitution in flight. */
  busy(): boolean;
  /** Record the edit in the surface's undo stack, report the text, and redecorate with the caret at `r.caret`. */
  commit(r: { text: string; caret: number }, kind: EditKind): void;
}

export interface HiddenMarkEditing {
  /** From the surface's beforeinput, before the DOM mutates. */
  beforeInput(e: InputEvent): void;
  /** Whether the pending native edit replaced a non-empty selection (such an edit is one atomic undo step). Read before repairInput. */
  pendingWasRange(): boolean;
  /** From the surface's input handler: the repaired text and caret, or null when the native edit stands as it is. */
  repairInput(after: string): { text: string; caret: number } | null;
  /** keydown: Enter. Returns true when it took the key. */
  enter(e: KeyboardEvent): boolean;
  /** keydown: the arrows, Backspace and Delete. Returns true when it took the key. */
  markKey(e: KeyboardEvent): boolean;
  /** selectionchange. */
  selectionChange(): void;
  /** Forget a pending edit (composition start, undo/redo, a programmatic rewrite). */
  reset(): void;
  /** IN-APP-COPY-FORMAT: a paste the Voice Wall has let through - Wrizo's own markup is pasted when its envelope can be trusted (true when
   *  it took the paste; false leaves the native paste, escaped on input). Call it only for a paste the wall allows. */
  paste(e: ClipboardEvent): boolean;
  /** TYPED-LITERAL: an IME composition is starting - remember the text and selection it starts from, so its committed text can be escaped
   *  at compositionend (call AFTER reset). */
  noteComposition(): void;
  /** Hold `mark` for the next text typed at `at` (a format press whose empty pair cannot be stored - an empty italic). */
  setPending(mark: string, at: number): void;
  /** card-held-italic: hold an EXIT from `mark` - the next text typed at `at` (directly before that run's closing mark) goes after the mark. */
  setPendingExit(mark: string, at: number): void;
  /** The mark held for the next text typed, and where - so the strip can light its button while it is held (or unlight it, for an exit). */
  pendingMark(): { mark: string; at: number; exit?: boolean } | null;
  detach(): void;
}

// The controller of each live editor, so a format press made OUTSIDE the editor's own closure (PageEditor's rail, the card's dock) can
// hand it a pending mark. A WeakMap, so a dismounted editor is not held alive.
const controllers = new WeakMap<HTMLElement, HiddenMarkEditing>();
export function hiddenMarkEditingFor(el: HTMLElement): HiddenMarkEditing | undefined { return controllers.get(el); }

export function attachHiddenMarkEditing(host: HiddenMarkHost): HiddenMarkEditing {
  const { el } = host;
  let beforeEdit: { text: string; start: number; end: number } | null = null;
  let exit: { closeAt: number; closers: string; wsEnd: number } | null = null;
  let pointerDown = false;
  let lastSnap = -1;
  // A caret a CLICK placed is honoured until the caret moves elsewhere: the selectionchange that follows must not re-snap it with the
  // keyboard rule and pull it back inside the run the writer clicked past (Nick's live bug, 2026-10-06).
  let clickPlaced = -1;
  // A mark a format press could not store as an empty pair (an empty italic is `**`, which reads as a lone bold marker): wrapped around
  // the next text typed at `at`, then forgotten. Moving the caret away forgets it too, so nothing is ever left on the page.
  // An EXIT (card-held-italic) is the same hold the other way round: the writer pressed a run's style off at its very end, so the next
  // text typed there lands after the run's closing mark instead of inside the run.
  let pending: { mark: string; at: number; exit?: boolean } | null = null;

  const commit = (r: EditResult | { text: string; caret: number }, kind: EditKind) => { exit = null; host.commit(r, kind); };

  const repairInput = (after: string): { text: string; caret: number } | null => {
    const before = beforeEdit;
    beforeEdit = null;
    if (!before) return null;
    const held = pending;
    pending = null;
    if (held && held.exit && before.start === before.end && before.start === held.at && after.length > before.text.length) {
      const n = after.length - before.text.length;
      const ins = after.slice(held.at, held.at + n);
      const ml = held.mark.length;
      if (after.slice(0, held.at) + after.slice(held.at + n) === before.text && !ins.includes('\n') && before.text.slice(held.at, held.at + ml) === held.mark) {
        const lit = escapeTyped(ins, before.text, held.at + ml);   // TYPED-LITERAL
        return { text: before.text.slice(0, held.at) + held.mark + lit + before.text.slice(held.at + ml), caret: held.at + ml + lit.length };
      }
      return null;
    }
    if (held && !held.exit && before.start === before.end && before.start === held.at && after.length > before.text.length) {
      const n = after.length - before.text.length;
      const ins = after.slice(held.at, held.at + n);
      // a space typed first cannot open a mark (the flanking rule), so the mark waits for the first non-space character
      if (/^[^\S\n]+$/.test(ins) && after.slice(0, held.at) + after.slice(held.at + n) === before.text) { pending = { mark: held.mark, at: held.at + n }; return null; }
      if (after.slice(0, held.at) + after.slice(held.at + n) === before.text && !ins.includes('\n')) {
        const lit = escapeTyped(ins, before.text, held.at);   // TYPED-LITERAL
        const text = before.text.slice(0, held.at) + held.mark + lit + held.mark + before.text.slice(held.at);
        return { text, caret: held.at + held.mark.length + lit.length };
      }
    }
    const T = before.text;
    let P = 0;
    const maxP = Math.min(T.length, after.length, before.start);
    while (P < maxP && T[P] === after[P]) P++;
    let S = 0;
    const maxS = Math.min(T.length - Math.max(P, before.end), after.length - P);
    while (S < maxS && T[T.length - 1 - S] === after[after.length - 1 - S]) S++;
    const ins = after.slice(P, after.length - S);
    let span = nativeRange(T, P, T.length - S);
    if (span.s === span.e && ins === '') return null;
    // SYNCHRONOUS SETTLING (Nick's ruling 2, Oct 16): a typed insertion at a collapsed caret lands where the caret SETTLES (rule 1, or
    // the click's own side), not wherever the browser held it - so whether the asynchronous settle on selectionchange ran before the key
    // no longer changes the text. The same keys give the same text at any speed.
    let settledMove = false;
    if (before.start === before.end && span.s === span.e && P === before.start) {
      const q = before.start === clickPlaced ? before.start : snapCaret(T, before.start);
      if (q !== before.start) { P = q; span = { s: q, e: q }; settledMove = true; }
    }
    // TYPED-LITERAL: the typed (or pasted) text, its formatting characters escaped for where it lands
    const lit = escapeTyped(ins, T, span.s);
    if (exit && lit === ins && !settledMove && before.start === before.end && P === exit.wsEnd && span.s === P && span.e === P) {
      if (ins.length === 1 && !/\s/.test(ins)) {
        const back = reabsorb(after, exit.closeAt, exit.closers, exit.wsEnd);
        exit = null;
        if (back) return back;
      } else if (/^[^\S\n]$/.test(ins)) {
        exit = { ...exit, wsEnd: exit.wsEnd + 1 };
        return null;
      } else exit = null;
    } else exit = null;
    const closers = before.start === before.end && /^[^\S\n]$/.test(ins) ? closersAt(T, P) : '';
    const r = replaceRange(T, span.s, span.e, lit);
    if (closers && r.text.slice(P, P + closers.length + 1) === closers + ins) exit = { closeAt: P, closers, wsEnd: P + closers.length + 1 };
    return r.text === after && !settledMove ? null : r;
  };

  const beforeInput = (e: InputEvent) => {
    const it = e.inputType || '';
    beforeEdit = null;
    // TYPED-LITERAL (Nick, Oct 16: pasted ** is literal too): a paste or drop is captured like typing, so its text is escaped on input
    if (host.busy() || e.isComposing || it === 'insertCompositionText') return;
    const o = getSelectionOffsets(el);
    if (!o) return;
    const text = host.plainNow();
    beforeEdit = { text, start: Math.min(o.start, text.length), end: Math.min(o.end, text.length) };
  };

  const enter = (e: KeyboardEvent): boolean => {
    if (e.key !== 'Enter' || e.isComposing) return false;
    e.preventDefault();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.getRangeAt(0).startContainer)) return true;
    const o = getSelectionOffsets(el);
    if (!o) return true;
    const text = host.plainNow();
    const r = enterAt(text, Math.min(o.start, text.length), Math.min(o.end, text.length));
    // Enter completes a line the same way a typed space completes a word: a 'boundary' step, closing whatever was open.
    commit(r, 'boundary');
    return true;
  };

  // The arrows move by visible characters, and Backspace and Delete never take a lone hidden mark. Modified arrows (word jumps) and
  // modified deletes stay native: the caret snap and the input rebuild cover them. Shift+Delete is the platform's cut on Windows.
  const markKey = (e: KeyboardEvent): boolean => {
    if (e.isComposing || host.busy()) return false;
    const k = e.key;
    if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Backspace' && k !== 'Delete') return false;
    // Word deletion (Ctrl+Backspace / Ctrl+Delete, and Alt on a Mac) is computed over the visible text (hiddenMarks.ts wordBackspaceAt).
    // Cmd+Backspace (delete to the line's start) and word-jump arrows stay native: the caret snap and the input rebuild cover them.
    const wordKey = (k === 'Backspace' || k === 'Delete') && !e.metaKey && !e.shiftKey && (e.ctrlKey !== e.altKey);
    if (wordKey) {
      const ends = selectionEnds(el);
      if (!ends || !ends.collapsed) return false;
      e.preventDefault();
      const text = host.plainNow();
      const r = k === 'Backspace' ? wordBackspaceAt(text, ends.focus) : wordDeleteAt(text, ends.focus);
      if (!r) return true;
      commit(r, 'atomic');
      return true;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (k === 'Delete' && e.shiftKey) return false;
    const ends = selectionEnds(el);
    if (!ends) return false;
    const text = host.plainNow();
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
      exit = null;
      const step = k === 'ArrowLeft' ? stepLeft : stepRight;
      if (e.shiftKey) { extendSelection(el, step(text, ends.focus)); return true; }
      if (!ends.collapsed) {
        const edge = k === 'ArrowLeft' ? Math.min(ends.anchor, ends.focus) : Math.max(ends.anchor, ends.focus);
        placeCaret(el, snapCaret(text, edge));
        return true;
      }
      placeCaret(el, step(text, ends.focus));
      return true;
    }
    if (!ends.collapsed) return false;
    e.preventDefault();
    const r = k === 'Backspace' ? backspaceAt(text, ends.focus) : deleteAt(text, ends.focus);
    if (!r) return true;
    commit(r, r.structural ? 'atomic' : 'delete');
    return true;
  };

  const snapCaretHere = (fromClick = false) => {
    if (pointerDown) return;
    const ends = selectionEnds(el);
    if (!ends || !ends.collapsed) return;
    const text = host.plainNow();
    const at = fromClick ? snapCaretAfterClick(text, ends.focus) : ends.focus === clickPlaced ? clickPlaced : snapCaret(text, ends.focus);
    clickPlaced = fromClick ? at : at === clickPlaced ? clickPlaced : -1;
    if (exit && at !== exit.wsEnd) exit = null;
    // one placement per offset: if the browser canonicalises the point we chose, the next selectionchange must not retry it
    if (at === ends.focus && at === lastSnap) return;
    lastSnap = at;
    placeCaret(el, at);
  };

  const selectionChange = () => {
    if (host.busy()) return;
    snapCaretHere();
    if (pending) { const ends = selectionEnds(el); if (!ends || !ends.collapsed || ends.focus !== pending.at) pending = null; }
  };
  const onPointerDown = () => { pointerDown = true; };
  const onPointerUp = () => {
    if (!pointerDown) return;
    pointerDown = false;
    if (!host.busy()) snapCaretHere(true);
  };
  el.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  // IN-APP-COPY-FORMAT: copy and cut. A collapsed selection, or one outside this editor, is left to the browser (it copies nothing).
  const onCopyOrCut = (e: ClipboardEvent) => {
    if (host.busy() || !e.clipboardData) return;
    const ends = selectionEnds(el);
    if (!ends || ends.collapsed) return;
    const text = host.plainNow();
    const s = Math.min(ends.anchor, ends.focus, text.length);
    const t = Math.min(Math.max(ends.anchor, ends.focus), text.length);
    if (s === t) return;
    e.preventDefault();
    putOnClipboard(e.clipboardData, copyPayload(text, s, t));
    if (e.type === 'cut') { beforeEdit = null; commit(replaceRange(text, s, t, ''), 'atomic'); }
  };
  el.addEventListener('copy', onCopyOrCut);
  el.addEventListener('cut', onCopyOrCut);

  const api: HiddenMarkEditing = {
    beforeInput,
    pendingWasRange: () => !!beforeEdit && beforeEdit.end > beforeEdit.start,
    paste: (e: ClipboardEvent): boolean => {
      if (host.busy() || !e.clipboardData) return false;
      const plain = e.clipboardData.getData('text/plain');
      const fragment = readEnvelope(e.clipboardData.getData(WRIZO_MIME), plain);
      if (fragment === null) return false;
      const o = getSelectionOffsets(el);
      if (!o) return false;
      e.preventDefault();
      beforeEdit = null;
      const text = host.plainNow();
      const r = pasteEdit(text, Math.min(o.start, text.length), Math.min(o.end, text.length), fragment, plain);
      commit({ text: r.text, caret: r.caret }, 'atomic');   // one undo step, as a format press is
      return true;
    },
    repairInput,
    enter,
    markKey,
    selectionChange,
    reset: () => { beforeEdit = null; exit = null; pending = null; },
    noteComposition: () => {
      const o = getSelectionOffsets(el);
      if (!o) { beforeEdit = null; return; }
      const text = host.plainNow();
      beforeEdit = { text, start: Math.min(o.start, text.length), end: Math.min(o.end, text.length) };
    },
    setPending: (mark: string, at: number) => { pending = { mark, at }; },
    setPendingExit: (mark: string, at: number) => { pending = { mark, at, exit: true }; },
    pendingMark: () => pending,
    detach: () => {
      controllers.delete(el);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('copy', onCopyOrCut);
      el.removeEventListener('cut', onCopyOrCut);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    },
  };
  controllers.set(el, api);
  return api;
}
