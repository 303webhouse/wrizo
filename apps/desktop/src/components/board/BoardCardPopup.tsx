import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSelectionOffsets, getCaretOffset, setCaretOffset, setSelectionOffsets } from '../../store/caretOffset';
import { applyFormat, formatShortcutAction, applyFontPick, fontFaceAt, clearFontSpans, applySizePick, fontSizeAt, clearSizeSpans, type FormatAction } from '../../store/draftFormat';
import { decorateEditorFor, decorateMarkdownForCard, readEditorPlainText, revealAtCaret } from '../../store/draftDecoration';
import { attachHiddenMarkEditing, hiddenMarkEditingFor } from '../../store/hiddenMarksEditing';
import { placeCaret } from '../../store/hiddenMarksDom';
import { applyEmDash, findEmDashTrigger } from '../../store/emDash';
import { classifyEditKind, createTextUndoStack, type EditKind, type TextUndoStack } from '../../store/textUndo';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../../store/voiceWall';
import { bodyIsEmpty } from '../../store/guided';
import { useLexicon } from '../../store/themeLexicon';
import { useDeskLexicon } from '../../store/deskLexicon';
import { cardTypeStyle } from '../../store/fontRoster';
import { SIZE_DEFAULT } from '../../store/fontSize';
import { TypeControl } from '../TypeControl';
import type { StoredFace } from '../../types';

// the card editor reuses Draft's engine (applyFormat, decorateMarkdown) on box.text, bold and italic only; Tab is trapped as in UnlockCeremony, and the paste wall stands [BoardEditor §9]
export function BoardCardPopup({
  initialText, onCommit, onClose, fontFace, fontSize, onType, prompt, inline, autoFocus,
}: {
  initialText: string;
  // INLINE: the Walk's card IS this editor, mounted in place (no portal, backdrop, dock or Esc - Esc belongs to the Walk); autoFocus puts the caret in the card on every step [BoardEditor §10]
  inline?: boolean;
  autoFocus?: boolean;
  // W3 - a dealt step's question, shown as the editor's placeholder while the body is empty (an attribute + CSS ::after, never text); the first keystroke into the body hides it.
  prompt?: string;
  onCommit: (text: string) => void;
  onClose: () => void;
  // ITEM 207 - the card's own face/size and the one funnel that writes them (BoardEditor.commitType).
  fontFace?: StoredFace;
  fontSize?: number;
  onType: (patch: { fontFace?: StoredFace; fontSize?: number }) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef(initialText);
  const { t: lex } = useLexicon();
  // ITEM 83 M9 — the desk lexicon, for the dock's own strings (§1.4: every
  // user-facing string is themable, never a literal in JSX).
  const { t: dt } = useDeskLexicon();
  // the styling dock starts closed (the Sliver's useState(false) at card scale); declared with the hooks, above any early return [BoardEditor §11]
  const [dockOpen, setDockOpen] = useState(false);
  // FONT-SPAN: whether words are highlighted in the card, and their face - the dock's Typeface scopes and brass read it; declared with the hooks [BoardEditor §12]
  const [fontSel, setFontSel] = useState<{ has: boolean; face: string | null | 'mixed'; size: number | null | 'mixed' }>({ has: false, face: null, size: null });   // and its size [BoardEditor §13]
  useEffect(() => {
    const onSel = () => {
      const el = elRef.current;
      if (!el) return;
      const fs = window.getSelection();
      const ranged = !!fs && fs.rangeCount > 0 && !fs.isCollapsed && !!fs.anchorNode && !!fs.focusNode && el.contains(fs.anchorNode) && el.contains(fs.focusNode);
      const fo = ranged ? getSelectionOffsets(el) : null;
      const cur = textRef.current;
      const lo = fo ? Math.min(fo.start, fo.end, cur.length) : 0;
      const hi = fo ? Math.min(Math.max(fo.start, fo.end), cur.length) : 0;
      const next = fo && hi > lo ? { has: true, face: fontFaceAt(cur, lo, hi), size: fontSizeAt(cur, lo, hi) } : { has: false, face: null, size: null };
      setFontSel((prev) => (prev.has === next.has && prev.face === next.face && prev.size === next.size ? prev : next));
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);
  // FX6 S1 — the real undo/redo stack (store/textUndo.ts's own header
  // comment carries the full mechanism-choice + coalescing-granularity +
  // em-dash-shim-fold reasoning, shared verbatim with ForwardOnlyEditor.
  // tsx's own drafting branch — not repeated here). A plain ref (not the
  // module's registry) since applyBoardFormat below lives in this SAME
  // component, unlike PageEditor.tsx's applyRailFormat which needed the
  // registry to reach across a component boundary.
  const undoStackRef = useRef<TextUndoStack | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    // W3 - the placeholder is an attribute pair read by CSS (.board-popup-editor[data-prompt][data-body-empty]::after): the question, and whether the body is empty right now.
    const syncPrompt = (plain: string) => {
      if (!prompt) return;
      el.setAttribute('data-prompt', prompt);
      el.setAttribute('data-body-empty', bodyIsEmpty(plain) ? 'true' : 'false');
    };
    syncPrompt(initialText);
    decorateEditorFor(el, initialText, initialText.length, setCaretOffset, text => decorateMarkdownForCard(text, initialText.length));
    if (!inline || autoFocus) el.focus();   // the Walk asks for it (autoFocus): the caret lands in the card on opening and on every step [BoardEditor §14]

    // I0 pen discipline (park-sweep audit finding — the retired inline
    // BoardTextBox editing branch carried this same guard; the popup's own
    // contenteditable is exactly as reachable by a stylus and needs the
    // identical protection, not a weaker one just because the surface
    // changed). The pen is a Board POINTER, never a typing/handwriting
    // surface, everywhere on this app — j4.mjs's own "pen on an editing
    // text box produces ZERO characters" check is the live proof, re-homed
    // to the popup (fx4.mjs's own S5 section).
    el.style.touchAction = 'none';
    el.setAttribute('handwriting', 'false');
    const neutralizePen = (e: PointerEvent) => {
      if (e.pointerType !== 'pen') return;
      e.preventDefault();
      e.stopPropagation();
    };
    const penOpts = { passive: false, capture: true } as const;
    el.addEventListener('pointerdown', neutralizePen, penOpts);
    el.addEventListener('pointermove', neutralizePen, penOpts);
    el.addEventListener('pointerup', neutralizePen, penOpts);

    let composing = false;
    // FX5 S7 — the em-dash trigger flag + the applyEmDash reentrancy guard,
    // the SAME pair ForwardOnlyEditor.tsx's own drafting branch uses (see
    // that file's own comment for the full "why beforeinput, why the
    // guard" reasoning — not repeated here).
    let justTypedSpace = false;
    let applyingEmDash = false;
    // FX6 S1 — the real, walkable undo/redo stack (store/textUndo.ts's own
    // header comment carries the full mechanism-choice + coalescing-
    // granularity + em-dash-shim-fold reasoning, the SAME shape
    // ForwardOnlyEditor.tsx's drafting branch uses — not repeated here).
    const undoStack = createTextUndoStack({ text: initialText, caret: initialText.length });
    undoStackRef.current = undoStack;
    // Classified at beforeinput (before the DOM mutates — the SAME
    // discipline `justTypedSpace` above already uses), consumed by the
    // very next onInput call it precedes.
    let pendingKind: EditKind = 'atomic';
    const redecorate = (plain: string, caret: number | null) => {
      decorateEditorFor(el, plain, caret, setCaretOffset, text => decorateMarkdownForCard(text, caret));
      // ITEM 211 - the caret lands on the visible side of a hidden mark (store/hiddenMarksDom.ts), as on the page
      if (caret !== null) placeCaret(el, caret);
    };
    const commit = (plain: string) => { textRef.current = plain; syncPrompt(plain); onCommit(plain); };
    // ITEM 211, THE CARD PORT - the page's editing rules for marks that never show, from the ONE controller the page uses
    // (store/hiddenMarksEditing.ts): edits rebuilt so no lone mark survives, Enter computed, arrows over visible characters,
    // Backspace and Delete that never take a lone hidden mark, and the caret snap (a click keeps the side of a run's closing marks).
    const plainNow = () => readEditorPlainText(el.innerText, null).plain;
    const marks = attachHiddenMarkEditing({
      el,
      plainNow,
      busy: () => composing || applyingEmDash,
      commit: (r, kind) => {
        undoStack.record({ text: r.text, caret: r.caret }, kind);
        commit(r.text);
        redecorate(r.text, r.caret);
      },
    });

    const onInput = () => {
      if (applyingEmDash) return;
      let kind = pendingKind;
      let { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));
      if (!composing) {
        const wasRange = marks.pendingWasRange();
        const r = marks.repairInput(plain);
        if (r) { plain = r.text; caret = r.caret; redecorate(plain, caret); }
        if (wasRange) kind = 'atomic';
      }
      commit(plain);
      if (composing) return; // FX6 S1 — composed text records as ONE atomic step, at compositionend below
      const trigger = justTypedSpace ? findEmDashTrigger(plain, caret) : null;
      justTypedSpace = false;
      if (trigger) {
        applyingEmDash = true;
        const { applied } = applyEmDash(el, trigger.start, trigger.end);
        applyingEmDash = false;
        if (applied) {
          // FX6 S1 — the em-dash shim, folded into the real stack: see
          // ForwardOnlyEditor.tsx's own onInput comment for the full
          // "boundary then atomic, why two record() calls" reasoning — the
          // SAME two-step shape, verbatim.
          undoStack.record({ text: plain, caret }, 'boundary');
          const after = readEditorPlainText(el.innerText, getCaretOffset(el));
          commit(after.plain);
          // FX5 S7 — see ForwardOnlyEditor.tsx's own onInput comment: the
          // post-execCommand DOM caret lands short of where the writer's
          // own typing actually was (right after the em dash, before the
          // untouched trailing space and anything typed past it) — the
          // ORIGINAL caret shifted left by (hyphen count - 1) is always
          // correct, computed directly rather than trusted from the DOM.
          const afterCaret = caret - (trigger.end - trigger.start) + 1;
          undoStack.record({ text: after.plain, caret: afterCaret }, 'atomic');
          redecorate(after.plain, afterCaret);
          return;
        }
      }
      undoStack.record({ text: plain, caret }, kind);
      redecorate(plain, caret);
    };
    // FX6 S1 — the real undo/redo keybindings, the SAME contract
    // ForwardOnlyEditor.tsx's own onUndoRedoKeyDraft uses (see that file's
    // own comment — not repeated here).
    // WRITING-SURFACE S0 STEP 2 - Ctrl/Cmd+B/I/U on the card, the same map and the same formatter as the dock's buttons.
    const onFormatKey = (e: KeyboardEvent) => {
      const action = formatShortcutAction(e);
      if (!action) return;
      e.preventDefault();
      applyBoardFormatRef.current(action);
    };
    const onUndoRedoKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      const wantsUndo = key === 'z' && !e.shiftKey;
      const wantsRedo = (key === 'z' && e.shiftKey) || key === 'y';
      if (!wantsUndo && !wantsRedo) return;
      e.preventDefault();
      const snap = wantsUndo ? undoStack.undo() : undoStack.redo();
      if (!snap) return;
      marks.reset();
      commit(snap.text);
      redecorate(snap.text, snap.caret);
    };
    // AB2's own proven fix for the Chromium trailing-newline-at-EOF caret
    // quirk (draftDecoration.ts's own header comment) — a literal Text-node
    // insertion via the Range API, not execCommand, which splits into a
    // <div> instead of inserting '\n'. Reused verbatim (ForwardOnlyEditor.
    // tsx's own onKeyDownDraft), adapted to this popup's own commit/
    // redecorate closures.
    const onKeyDown = (e: KeyboardEvent) => {
      // ITEM 211 - Enter is computed (store/hiddenMarks.ts enterAt): a run the caret is inside closes before the newline and opens
      // again after it, so neither line is left with one unpaired, visible mark. Recorded as a 'boundary' step (FX6 S1).
      marks.enter(e);
    };
    const onMarkKey = (e: KeyboardEvent) => { marks.markKey(e); };
    // TYPED-LITERAL: a composition's committed text is typed text too - captured at its start, escaped at its end
    const onCompStart = () => { marks.reset(); marks.noteComposition(); composing = true; };
    const onCompEnd = () => {
      composing = false;
      let { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));
      const lit = marks.repairInput(plain);
      if (lit) { plain = lit.text; caret = lit.caret; }
      // FX6 S1 — an IME-composed insertion is one atomic undo step (no
      // per-candidate-update recording happens above — onInput returns
      // early while `composing` is true).
      undoStack.record({ text: plain, caret }, 'atomic');
      commit(plain);
      redecorate(plain, caret);
    };
    const onBeforeInput = (e: InputEvent) => {
      const it = e.inputType || '';
      // FX5 S7 — captured before the DOM mutates, same discipline as
      // ForwardOnlyEditor.tsx's own onBeforeInputDraft: only a genuinely
      // just-typed space arms the em-dash trigger check in onInput.
      justTypedSpace = it === 'insertText' && e.data === ' ';
      // FX6 S1 — classify the upcoming edit for the undo stack (store/
      // textUndo.ts's own classifyEditKind — shared with ForwardOnlyEditor.
      // tsx so the two surfaces can't drift).
      pendingKind = classifyEditKind(it, e.data ?? null);
      marks.beforeInput(e);
      if (it === 'insertFromPaste' || it === 'insertFromDrop') {
        if (shadowAllows(extractIncomingText(e))) return; // own ink: native paste proceeds
        e.preventDefault();
        notePasteBlocked();
      }
    };
    const blockForeign = (e: Event) => {
      // IN-APP-COPY-FORMAT: own ink passes the wall; Wrizo's own markup is then pasted when its envelope can be trusted
      if (shadowAllows(extractIncomingText(e))) { if (e.type === 'paste') marks.paste(e as ClipboardEvent); return; }
      e.preventDefault();
      notePasteBlocked();
    };
    // REVEAL-ON-CLICK — this REPLACES the pair FX5 S6 built here (a keyup
    // against a NAV_KEYS list, plus a mouseup). FX5's diagnosis was right and
    // is preserved in revealAtCaret's own comment: a pure caret move fires no
    // 'input', so the reveal would otherwise show the PREVIOUS caret's
    // markers. What changes is the signal and the guards.
    //
    // THE SIGNAL: enumerating the paths that move a caret means the state
    // goes stale after whichever path nobody listed, and the list here was
    // already incomplete (Tab, PageUp/PageDown, a programmatic move, a
    // click-drag that ends outside the element). `selectionchange` fires for
    // all of them. Item 122 had already made this exact argument for Draft's
    // B/I/U button state; the decoration is the same problem.
    //
    // THE GUARDS, and why this is a fix and not just a swap: the old pair
    // redecorated UNCONDITIONALLY, and a redecorate restores a COLLAPSED
    // caret. So a mouseup ending a drag-selection collapsed that selection,
    // and shift+arrow could not extend one. revealAtCaret declines on a
    // non-collapsed selection, so selecting text on a card works.
    const onSelectionReveal = () => {
      if (composing || applyingEmDash) return;
      marks.selectionChange();
      revealAtCaret(el, getCaretOffset, setCaretOffset);
    };
    el.addEventListener('input', onInput);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('keydown', onMarkKey);
    el.addEventListener('keydown', onUndoRedoKey);
    el.addEventListener('keydown', onFormatKey);
    document.addEventListener('selectionchange', onSelectionReveal);
    el.addEventListener('compositionstart', onCompStart);
    el.addEventListener('compositionend', onCompEnd);
    el.addEventListener('beforeinput', onBeforeInput as EventListener);
    el.addEventListener('paste', blockForeign);
    el.addEventListener('drop', blockForeign);
    return () => {
      el.removeEventListener('pointerdown', neutralizePen, penOpts);
      el.removeEventListener('pointermove', neutralizePen, penOpts);
      el.removeEventListener('pointerup', neutralizePen, penOpts);
      el.removeEventListener('input', onInput);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('keydown', onMarkKey);
      el.removeEventListener('keydown', onUndoRedoKey);
      marks.detach();
      el.removeEventListener('keydown', onFormatKey);
      document.removeEventListener('selectionchange', onSelectionReveal);
      el.removeEventListener('compositionstart', onCompStart);
      el.removeEventListener('compositionend', onCompEnd);
      el.removeEventListener('beforeinput', onBeforeInput as EventListener);
      el.removeEventListener('paste', blockForeign);
      el.removeEventListener('drop', blockForeign);
      undoStackRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hb1.1's own focus-trap pattern (UnlockCeremony.tsx), reused verbatim:
  // Tab wraps within this dialog's own focusable elements while it's open.
  useEffect(() => {
    if (inline) return;   // W1: the Walk owns Esc and focus; there is no dialog to trap or close
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const dialogEl = dialogRef.current;
      if (!dialogEl) return;
      const focusable = [...dialogEl.querySelectorAll<HTMLElement>('button:not(:disabled), [contenteditable="true"]')];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const applyBoardFormatRef = useRef<(action: FormatAction) => void>(() => {});
  const applyBoardFormat = (action: FormatAction) => {
    const el = elRef.current;
    if (!el) return;
    el.focus();
    const sel = getSelectionOffsets(el) ?? { start: textRef.current.length, end: textRef.current.length };
    const result = applyFormat(textRef.current, sel.start, sel.end, action);
    // A pending mark (an empty italic cannot be stored as `**`): nothing is written; the editor wraps the next text typed here.
    if (result.pending) { hiddenMarkEditingFor(el)?.setPending(result.pending, result.start); return; }
    // card-held-italic: a style pressed off at its run's end - nothing is written; what is typed next lands outside the run
    if (result.exitPending) { hiddenMarkEditingFor(el)?.setPendingExit(result.exitPending, result.start); return; }
    // FX6 S1 — a Bold/Italic toolbar click is a genuine edit that bypasses
    // the contenteditable's own input events entirely — record its own
    // atomic step (see ForwardOnlyEditor.tsx's applyRailFormat/PageEditor.
    // tsx for the SAME reasoning) or the click would be invisible to undo.
    undoStackRef.current?.record({ text: result.text, caret: result.start }, 'atomic');
    textRef.current = result.text;
    onCommit(result.text);
    const collapsed = result.end <= result.start;
    decorateEditorFor(el, result.text, result.start, setCaretOffset, text => decorateMarkdownForCard(text, collapsed ? result.start : null));
    if (!collapsed) setSelectionOffsets(el, result.start, result.end);
  };

  applyBoardFormatRef.current = applyBoardFormat;

  // FONT-SPAN (docs/font-span-plan.md; the approved mockup's card scene): a face for the HIGHLIGHTED words of this card only - the
  // dock's own road, as applyBoardFormat: one atomic undo step, the card's text committed, the highlight left on the same words.
  const applyBoardFont = (slug: string | null) => {
    const el = elRef.current;
    if (!el) return;
    el.focus();
    const sel = getSelectionOffsets(el);
    if (!sel || sel.start === sel.end) return;
    const cur = textRef.current;
    const result = applyFontPick(cur, Math.min(sel.start, cur.length), Math.min(sel.end, cur.length), slug);
    if (result.text !== cur) {
      undoStackRef.current?.record({ text: result.text, caret: result.start }, 'atomic');
      textRef.current = result.text;
      onCommit(result.text);
      decorateEditorFor(el, result.text, result.start, setCaretOffset, text => decorateMarkdownForCard(text, null));
    }
    setSelectionOffsets(el, result.start, result.end);
    setFontSel({ has: true, face: fontFaceAt(result.text, result.start, result.end), size: fontSizeAt(result.text, result.start, result.end) });
  };
  // a size for the HIGHLIGHTED words of this card only - the face's own road; the dock's size box holds the highlight while it has focus (a text field takes the card's selection), so a typed size reaches the words that were highlighted [BoardEditor §15]
  const heldSelRef = useRef<{ start: number; end: number } | null>(null);
  const holdSizeSelection = (): boolean => { const el = elRef.current; const s = el ? getSelectionOffsets(el) : null; if (!s || s.start === s.end) return false; heldSelRef.current = s; return true; };
  const applyBoardSize = (points: number) => {
    const el = elRef.current;
    if (!el) return;
    // the held highlight is read BEFORE the editor takes focus back: that focus blurs the size box, and its blur lets the held range go
    const held = heldSelRef.current;
    el.focus();
    const sel = held ?? getSelectionOffsets(el);
    if (!sel || sel.start === sel.end) return;
    const cur = textRef.current;
    const result = applySizePick(cur, Math.min(sel.start, cur.length), Math.min(sel.end, cur.length), points);
    if (result.text !== cur) {
      undoStackRef.current?.record({ text: result.text, caret: result.start }, 'atomic');
      textRef.current = result.text;
      onCommit(result.text);
      decorateEditorFor(el, result.text, result.start, setCaretOffset, text => decorateMarkdownForCard(text, null));
    }
    setSelectionOffsets(el, result.start, result.end);
    setFontSel({ has: true, face: fontFaceAt(result.text, result.start, result.end), size: fontSizeAt(result.text, result.start, result.end) });
  };
  // the Whole card SIZE - the card's spans' sizes go (one undo step), then the card's size [BoardEditor §16]
  const pickWholeCardSize = (size: number) => {
    const el = elRef.current;
    const cur = textRef.current;
    const next = clearSizeSpans(cur);
    if (el && next !== cur) {
      const caret = Math.min(getCaretOffset(el) ?? next.length, next.length);
      undoStackRef.current?.record({ text: next, caret }, 'atomic');
      textRef.current = next;
      onCommit(next);
      decorateEditorFor(el, next, caret, setCaretOffset, text => decorateMarkdownForCard(text, null));
    }
    onType({ fontSize: size });
  };
  // FONT-SPAN: the Whole card pick - every word takes the card's new face, so the card's spans go (one undo step), then the face.
  const pickWholeCardFace = (face: StoredFace | undefined) => {   // undefined = "Default": the card's face is cleared (fontFace absent = the theme's default) [BoardEditor §17]
    const el = elRef.current;
    const cur = textRef.current;
    const next = clearFontSpans(cur);
    if (el && next !== cur) {
      const caret = Math.min(getCaretOffset(el) ?? next.length, next.length);
      undoStackRef.current?.record({ text: next, caret }, 'atomic');
      textRef.current = next;
      onCommit(next);
      decorateEditorFor(el, next, caret, setCaretOffset, text => decorateMarkdownForCard(text, null));
    }
    onType({ fontFace: face });
  };

  // the backdrop is portalled to <body>: inside .desk-frame-stage (isolation:isolate) its z-index ranked only within the stage, and the rail painted over it [BoardEditor §18]
  if (inline) {
    return (
      <div
        ref={elRef}
        className="board-popup-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={`${lex('board')} text box`}
        style={cardTypeStyle(fontFace, fontSize)}
      />
    );
  }
  return createPortal(
    <div className="board-popup-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="board-popup"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${lex('board').toLowerCase()} card`}
        onClick={e => e.stopPropagation()}
      >
        {/* ITEM 83 M9 (R13.v/R14) — THE OPENED CARD'S TOOLS DOCK.
            The card is the paper here, so the dock is a CHILD OF THE CARD at
            `right:100%` — its right edge IS the card's left edge, by layout,
            at every size. Same anchor law as the page's Tools drawer; nothing
            is scripted, so nothing can drift.
            R14, verbatim: "the opened card's side menu is centered to the
            card's size, whatever it is, and may extend vertically beyond the
            card's height when its options need the room — the dock is the
            card's companion, not its prisoner." So: translateY(-50%) centring,
            and no height tie to the card.
            CONTENTS: styling only. NO FOOT — R14 keeps Typewriter/Progress/
            Full Screen on page-writing surfaces, and a card is not one.
            Links/tags are F10's default (IN) but need a data model no ticket
            in this brief creates, so they are deferred by §0 rather than
            faked; nothing renders for them. */}
        {/* ITEM 159 — THE GRIP. `onMouseDown` is prevented for the same reason
            the dock's own is: a card's Bold acts on the EDITOR's selection, and
            a mousedown that moved focus would collapse the very selection the
            next click is about to style. */}
        <button
          type="button"
          className="board-popup-dock-grip"
          aria-label={dockOpen ? dt('stylingClose') : dt('stylingOpen')}
          title={dockOpen ? dt('stylingClose') : dt('stylingOpen')}
          aria-expanded={dockOpen}
          onMouseDown={e => e.preventDefault()}
          onClick={() => setDockOpen(o => !o)}
        >
          <span className="board-popup-dock-grip-glyph" aria-hidden="true">{dockOpen ? '\u203a' : '\u2039'}</span>
        </button>
        {dockOpen && (
        <div className="board-popup-dock" onMouseDown={e => { if (!(e.target instanceof Element && e.target.closest('input'))) e.preventDefault(); }}>   {/* TOOLS #14-r2: a press on the size box must reach it (it was swallowed here, so the box could never take focus); every other press keeps the card's caret */}
          <div className="board-popup-dock-h">{dt('stylingHeading')}</div>
          <button type="button" className="mode-tbtn board-popup-tool" title={dt('stylingBold')} onClick={() => applyBoardFormat('bold')}><b>B</b></button>
          <button type="button" className="mode-tbtn board-popup-tool" title={dt('stylingItalic')} onClick={() => applyBoardFormat('italic')}><i>I</i></button>
          <button type="button" className="mode-tbtn board-popup-tool" title={dt('stylingUnderline')} onClick={() => applyBoardFormat('underline')}><u>U</u></button>
          {/* ITEM 207 - the card's face and size: the smallest form (-/+, no number, no heading). FONT-SPAN: the face is chosen through
              the two scopes - Selection / Whole card - over the roster as a list (the approved mockup's card scene). */}
          <TypeControl form="small" face={fontFace} size={fontSize ?? SIZE_DEFAULT} onPickFace={pickWholeCardFace} onSize={pickWholeCardSize}
            scope={{ has: fontSel.has, face: fontSel.face, wholeLabel: dt('typeScopeWholeCard'), onPickSelection: applyBoardFont, size: fontSel.size, onSizeSelection: applyBoardSize, holdSelection: holdSizeSelection, releaseSelection: () => { heldSelRef.current = null; } }} />
        </div>
        )}
        <div className="board-popup-strip">
          <span className="eyebrow board-popup-eyebrow">Card</span>
          {/* the pop-up closes from an X at the strip's right end; it keeps the old Close button's class, board-popup-done, so every driver still finds it; Esc and the backdrop are unchanged [BoardEditor §19] */}
          <button type="button" className="board-popup-close board-popup-done" aria-label={dt('boardPopupClose')} title={dt('boardPopupClose')} onClick={onClose}>
            <span aria-hidden="true">{'\u00d7'}</span>
          </button>
        </div>
        <div
          ref={elRef}
          className="board-popup-editor"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={`${lex('board')} text box`}
          style={cardTypeStyle(fontFace, fontSize)}
        />
        {/* CD4.1's foot "Close" button retired by card-close-x: the X in the strip above
            is the close control now (it carries the class board-popup-done). */}
      </div>
    </div>,
    document.body,
  );
}
