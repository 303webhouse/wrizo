import { forwardRef, useEffect, useReducer, useRef } from 'react';
import type { Run } from '../types';
import { append, derivedText, eraseTail, isBoundary, seedContent, strikeStep } from '../store/forwardOnly';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';
import { decorateEditorFor, decorateMarkdown, readEditorPlainText } from '../store/draftDecoration';
import { getCaretOffset as getPlainOffset, setCaretOffset as setPlainOffset } from '../store/caretOffset';
import { applyEmDash, findEmDashTrigger } from '../store/emDash';
import { classifyEditKind, createTextUndoStack, registerUndoStack, unregisterUndoStack, type EditKind } from '../store/textUndo';

// CW2 — the reusable forward-only writing surface. Keyboard-only input on the
// DM1 Run model: typing appends, backspace walks a short runway and then locks;
// nothing is ever erased (struck runs stay visible, drop from derived prose).
// Renders runs as DOM (not a textarea), so caret/focus are manual. Standalone
// and unbound to QuickSprint — the onboarding gate and the journal page adopt
// this same component.
//
// The pen is NOT handled here: per the locked product decision the stylus is a
// pure overlay drawn on top of the text, never touching Runs. Run.struck is
// keyboard-only.

const KEEP_WRITING = 'keep writing — you can shape it later';

// Mode-parameterized writing surface (mode-aware editor brief). ONE surface, two
// behaviours selected by `mode`:
//   journal  — forward-only runway (strike, never delete) + IME; the saved text
//              is the clean derived prose. (Today's behaviour, as-is.)
//   drafting — free editing (the runway is OFF): a plain contenteditable seeded
//              with the clean text; onChange reports its live textContent. Switch
//              modes by remounting with the current clean text (parent keys by
//              mode), so prose carries across and the caret lands at the end.
export type EditorMode = 'journal' | 'drafting';

interface Props {
  initialText: string;
  onChange: (derived: string) => void;
  mode?: EditorMode;
  onForward?: () => void;      // fired on a forward keystroke (e.g. ambient warmth, first-keystroke stamp)
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  penColor?: string;           // Journal pen ink (sets text + caret colour); from the pen bar
  // AB2 S2 — the forward lock, exposed in Free Write's tool rail
  // (store/forwardLock.ts). Only meaningful in journal mode (drafting is
  // always free-edit already). Default true matches today's shipped Free
  // Write behavior exactly: every backspace strikes via the existing runway.
  // false swaps to a REAL one-character erase (eraseTail) — still never a
  // select-then-replace, still never touches already-struck history.
  forwardLock?: boolean;
  style?: React.CSSProperties;
  // FX7 S2 — Free Write's own rail-driven marker insertion (Bold/Italic,
  // PageEditor.tsx's applyFreeWriteFormat). A plain ref escape hatch,
  // populated with THIS component's own `handleInput` below — the EXACT
  // function a real keystroke calls — so a rail click is genuinely
  // indistinguishable from typing those characters into the runway.
  // Deliberately NOT `document.execCommand('insertText', ...)`: found LIVE
  // (not assumed — this project's own "verify, don't assume" discipline)
  // that execCommand does NOT reliably fire a `beforeinput` event this
  // editor's own listener can intercept in this harness's own Chromium
  // build — it mutates the DOM directly instead, silently bypassing the
  // Run model entirely (contentRef/wordRef never learn about the inserted
  // text) — so the marker visibly appears for a moment, then the very NEXT
  // real keystroke's own re-render (built from the still-stale model)
  // silently wipes it. This ref sidesteps event dispatch altogether. Set
  // only outside `drafting` mode (Draft's own rail already has its own,
  // separate `applyRailFormat` mechanism, PageEditor.tsx).
  insertMarkerRef?: React.MutableRefObject<((text: string) => void) | null>;
}

export const ForwardOnlyEditor = forwardRef<HTMLDivElement, Props>(function ForwardOnlyEditor(
  { initialText, onChange, mode = 'journal', onForward, onFocus, onBlur, autoFocus, placeholder, ariaLabel, penColor, forwardLock = true, style, insertMarkerRef },
  ref,
) {
  const drafting = mode === 'drafting';
  // content (committed runs) + word (uncommitted active word) are the model.
  // Refs are the truth read by the input handlers (no stale closures); state
  // mirrors them for rendering. force() re-renders on a model change.
  const contentRef = useRef<Run[]>(seedContent(initialText));
  const wordRef = useRef('');
  const nudgeRef = useRef<string | null>(null);
  const bsRef = useRef(0);        // consecutive backspaces since the last forward key
  const noopRef = useRef(0);      // consecutive ineffective ("locked") backspaces
  const composingRef = useRef(false); // IME composition in progress (mobile soft keyboards)
  const skipCompEndRef = useRef(false); // ignore the stale compositionend a delete-abort triggers
  const [, force] = useReducer((n: number) => n + 1, 0);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onForwardRef = useRef(onForward);
  onForwardRef.current = onForward;
  // AB2 S2 — the native listeners below attach once ([] deps), so a toggle
  // flipped mid-session (the rail's forward-lock switch) must reach
  // handleBackspace through a ref, not the closed-over prop value.
  const forwardLockRef = useRef(forwardLock);
  forwardLockRef.current = forwardLock;

  const emit = () => onChangeRef.current(derivedText(contentRef.current) + wordRef.current);
  const changed = () => { force(); emit(); };

  // Any forward keystroke resets the backspace runway and clears the nudge.
  const resetRunway = () => {
    bsRef.current = 0;
    noopRef.current = 0;
    if (nudgeRef.current) { nudgeRef.current = null; }
  };

  const handleInput = (data: string) => {
    let c = contentRef.current;
    let w = wordRef.current;
    for (const ch of data) {
      if (isBoundary(ch)) { c = append(c, w + ch); w = ''; }
      else w += ch;
    }
    contentRef.current = c;
    wordRef.current = w;
    resetRunway();
    onForwardRef.current?.();
    changed();
  };

  // FX7 S2 — populate the rail's own insertion escape hatch (see this
  // file's own Props comment for the full "why not execCommand" writeup).
  // `handleInput` only ever touches refs/the stable `force` dispatch/ref-
  // held callbacks, so a closure captured once at mount stays correct
  // forever — no dependency on `mode`/`drafting` being current at CALL
  // time needed, only at mount (drafting never calls this ref at all,
  // PageEditor.tsx's own applyFreeWriteFormat guards on its own `mode`
  // state before ever touching it).
  useEffect(() => {
    if (!insertMarkerRef) return;
    insertMarkerRef.current = drafting ? null : handleInput;
    return () => { insertMarkerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The revised forward-only runway — every backspace STRIKES (never deletes),
  // escalating with consecutive presses (typing resets via resetRunway):
  //   1 char · 2 char · 3 rest-of-word · 4 prev-word · 5 rest-of-sentence · 6+ locked.
  // The active word is flushed into the runs on the first press so all strikes
  // operate on committed content; struck runs stay visible but drop from derived.
  // AB2 S2 — forwardLock===false swaps this whole escalation for a real,
  // one-character erase (eraseTail): no runway, no lock, no nudge — a
  // backspace behaves like backspace, per the rail's explicit switch.
  const handleBackspace = () => {
    if (wordRef.current.length > 0) {
      contentRef.current = append(contentRef.current, wordRef.current);
      wordRef.current = '';
    }
    if (forwardLockRef.current === false) {
      contentRef.current = eraseTail(contentRef.current, 1);
      changed();
      return;
    }
    bsRef.current += 1;
    const r = strikeStep(contentRef.current, bsRef.current);
    if (r.changed) {
      contentRef.current = r.content;
      noopRef.current = 0;
      if (nudgeRef.current) nudgeRef.current = null;
    } else {
      noopRef.current += 1;
      if (noopRef.current >= 2) nudgeRef.current = KEEP_WRITING; // a couple of locked presses
    }
    changed();
  };

  // Native listeners (not React synthetic) so input is captured identically on
  // hardware and soft/tablet keyboards. We preventDefault and let React own the
  // rendered content — EXCEPT during IME composition, where the browser must own
  // the composing text (preventDefault there makes mobile-typed text vanish). The
  // host renders via innerHTML, so the post-composition re-render cleanly replaces
  // the browser's draft nodes.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    // DRAFTING — free editing. No forward-only interception (the browser owns the
    // contenteditable; cut/delete are allowed here — this is the revise mode). But
    // the Voice Wall still stands: Draft is a prose surface, so paste/drop of
    // foreign prose is blocked + whispered (copy-out stays free).
    // AB2 S0/S3 — the iA register: every input re-decorates the plain text into
    // dimmed-mark/live-effect spans (store/draftDecoration.ts), imperatively
    // (bypassing React's own re-render) so it stays perfectly in step with the
    // native DOM the browser just mutated, then restores the caret at the SAME
    // linear offset (decoration only wraps existing characters in <span>s — it
    // never changes the character count, so the pre-decoration offset is still
    // valid post-decoration). Guarded off mid-IME-composition (composing text
    // must stay browser-owned, exactly like the journal path below) and off
    // whenever the selection isn't inside the host (nothing to restore).
    if (drafting) {
      let composingDraft = false;
      // FX5 S7 — the em-dash autocorrect's own trigger flag: only genuinely
      // set when the JUST-PROCESSED edit was a plain typed space (checked at
      // beforeinput, before the DOM mutates), never on a delete/paste/IME
      // commit that happens to leave the caret sitting after an old,
      // already-settled "--word " sequence elsewhere in the text. Without
      // this guard, onInput's own trigger check would fire on ANY edit that
      // exposes a matching pattern at the caret — including one the writer
      // didn't just type (e.g. deleting forward text that had been un-
      // corrected earlier via Undo).
      let justTypedSpace = false;
      // Reentrancy guard: applyEmDash's own execCommand fires a SECOND,
      // synchronous native 'input' event on `el` (confirmed — Chromium
      // dispatches input synchronously inside execCommand) — without this,
      // onInput would recurse into itself mid-substitution.
      let applyingEmDash = false;
      // FX6 S1 — the real, walkable undo/redo stack (store/textUndo.ts's
      // own header comment carries the full root-cause diagnosis — the
      // SAME per-keystroke innerHTML rewrite this file's own onInput does
      // below — the (a)-vs-(b) mechanism choice, the coalescing-granularity
      // reasoning, and how FX5 S7's own one-off `lastEmDash`/`revertEmDash`
      // shim folds into this — not repeated here). Registered on `el`
      // itself so PageEditor.tsx's applyRailFormat (a Bold/Italic rail
      // click, which lives OUTSIDE this closure, in the parent component)
      // can record an atomic step into the SAME stack a keystroke would.
      const undoStack = createTextUndoStack({ text: initialText, caret: initialText.length });
      registerUndoStack(el, undoStack);
      // Classified at beforeinput (before the DOM mutates — the SAME
      // discipline `justTypedSpace` above already uses), consumed by the
      // very next onInput call it precedes.
      let pendingKind: EditKind = 'atomic';
      // AB2 fix (post-build review) — see draftDecoration.ts's decorateEditorFor/
      // readEditorPlainText for the Chromium EOF-caret quirk this guards
      // against. Every write to el.innerHTML and every read of the live DOM
      // in this branch goes through those two shared helpers (also used by
      // PageEditor.tsx's rail format actions) so no path can drift back into
      // the unguarded bug.
      const redecorate = (plain: string, caret: number | null) => decorateEditorFor(el, plain, caret, setPlainOffset);
      const onInput = () => {
        if (applyingEmDash) return; // the substitution's own synthetic input event — already handled below
        const kind = pendingKind;
        const { plain, caret } = readEditorPlainText(el.innerText, getPlainOffset(el));
        onChangeRef.current(plain);
        onForwardRef.current?.();
        if (composingDraft) return; // FX6 S1 — composed text records as ONE atomic step, at compositionend below
        // FX5 S7 — the em dash (Word convention): "--word " -> "—word ",
        // via a SEPARATE execCommand substitution (store/emDash.ts) so
        // undo reverts it as its own step, distinct from the keystroke
        // that triggered it.
        const trigger = justTypedSpace ? findEmDashTrigger(plain, caret) : null;
        justTypedSpace = false;
        if (trigger) {
          applyingEmDash = true;
          const { applied } = applyEmDash(el, trigger.start, trigger.end);
          applyingEmDash = false;
          if (applied) {
            // FX6 S1 — the em-dash shim, folded into the real stack: the
            // word+space just typed closes as its OWN 'boundary' step
            // first (`plain`/`caret` here are the PRE-substitution text —
            // hyphens intact, trailing space included), then the
            // substitution itself records as a SEPARATE 'atomic' step on
            // top — always its own isolated group, so ONE Ctrl/Cmd+Z
            // reverts JUST the dash (back to `plain`, hyphens + space
            // intact), never a bigger chunk of the preceding typing, and
            // never a double-undo seam (see store/textUndo.ts's own header
            // comment for the full reasoning).
            undoStack.record({ text: plain, caret }, 'boundary');
            const after = readEditorPlainText(el.innerText, getPlainOffset(el));
            onChangeRef.current(after.plain);
            // FX5 S7 — found live, not assumed: execCommand('insertText',
            // ...) collapses the selection to right after the INSERTED em
            // dash — the untouched trailing space that triggered this (and
            // anything typed after it, for a fast typist) still sits AFTER
            // that point, unaffected by the substitution, so reading the
            // DOM's own post-command caret here would silently leave the
            // caret one-or-more characters short of where the writer's own
            // typing actually was, and the very next keystroke would land
            // mid-word instead of appending. The correct target is
            // computable directly from the ORIGINAL (pre-substitution)
            // caret: the hyphen run (trigger.end - trigger.start chars)
            // collapsed to exactly one em-dash character, so the original
            // caret simply shifts left by (hyphen count - 1).
            const afterCaret = caret - (trigger.end - trigger.start) + 1;
            undoStack.record({ text: after.plain, caret: afterCaret }, 'atomic');
            redecorate(after.plain, afterCaret);
            return;
          }
        }
        undoStack.record({ text: plain, caret }, kind);
        redecorate(plain, caret);
      };
      // FX6 S1 — the real undo/redo keybindings: Ctrl/Cmd+Z (undo),
      // Ctrl/Cmd+Shift+Z or Ctrl+Y (redo, both conventions honored — the
      // brief's own "Shift+Z or Ctrl+Y for redo"). Always preventDefault on
      // a recognized combo (even when the stack has nothing to do): native
      // undo is confirmed non-functional on this editor anyway (this
      // file's own header comment / store/textUndo.ts), so there is no
      // native behavior worth falling through to, and always owning the
      // keystroke keeps the mechanism's behavior fully predictable. Mid-
      // composition is left alone (isComposing) — an IME candidate window
      // may use these same keys for its own navigation.
      const onUndoRedoKeyDraft = (e: KeyboardEvent) => {
        if (e.isComposing) return;
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
        const key = e.key.toLowerCase();
        const wantsUndo = key === 'z' && !e.shiftKey;
        const wantsRedo = (key === 'z' && e.shiftKey) || key === 'y';
        if (!wantsUndo && !wantsRedo) return;
        e.preventDefault();
        const snap = wantsUndo ? undoStack.undo() : undoStack.redo();
        if (!snap) return;
        onChangeRef.current(snap.text);
        redecorate(snap.text, snap.caret);
      };
      // VW Slice 4 — own ink passes silently: simply don't preventDefault, and
      // the browser's native paste/drop proceeds (Draft owns its contenteditable).
      const onBeforeInputDraft = (e: InputEvent) => {
        const it = e.inputType || '';
        // FX5 S7 — the ONLY signal `onInput` trusts for "did the writer just
        // type a space": captured here, at beforeinput, before the DOM
        // mutates, so a delete/paste/IME-commit can never masquerade as one.
        justTypedSpace = it === 'insertText' && e.data === ' ';
        // FX6 S1 — classify the upcoming edit for the undo stack, the SAME
        // "capture before the DOM mutates" discipline as `justTypedSpace`
        // (store/textUndo.ts's own classifyEditKind — shared with
        // BoardEditor.tsx's BoardCardPopup so the two surfaces can't drift).
        pendingKind = classifyEditKind(it, e.data ?? null);
        if (it === 'insertFromPaste' || it === 'insertFromDrop') {
          if (shadowAllows(extractIncomingText(e))) return;
          e.preventDefault(); notePasteBlocked();
          return;
        }
      };
      // AB2 fix (post-build review) — Enter is intercepted at KEYDOWN with a
      // manual Range/Text-node insertion, replacing the original beforeinput
      // + execCommand('insertText', '\n') approach, which the harness's own
      // typeKeys driving proved BROKEN: Chrome's execCommand('insertText',
      // ...) does NOT insert a literal '\n' text character — it treats an
      // embedded newline as a paragraph command and splits in a
      // `<div><br></div>`, exactly the block-splitting the original comment
      // here said it was avoiding. The fix inserts a genuine single-
      // character Text node via the Range API (never a `<div>`), keeps the
      // caret INSIDE that text node before reading it back, then replicates
      // onInput's own redecorate pass manually (a Range mutation fires no
      // native 'input' event, the same reason onCompEndDraft below does its
      // own inline pass) — going through the same readEditorPlainText/
      // decorateEditorFor guard path as onInput, since this is exactly the
      // trailing-newline-at-EOF case that guard exists for. Composing (IME)
      // is left alone so an Enter that commits a composition candidate
      // isn't hijacked. keydown-level
      // preventDefault (not beforeinput) mirrors ScriptEditor.tsx's own
      // proven Enter-handling pattern elsewhere in this codebase.
      const onKeyDownDraft = (e: KeyboardEvent) => {
        if (e.key !== 'Enter' || e.isComposing) return;
        e.preventDefault();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!el.contains(range.startContainer)) return;
        range.deleteContents();
        const textNode = document.createTextNode('\n');
        range.insertNode(textNode);
        range.setStart(textNode, 1); // caret lands INSIDE the new text node (a valid text-node container)
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        const { plain, caret } = readEditorPlainText(el.innerText, getPlainOffset(el));
        // FX6 S1 — Enter completes a line the same way a typed space
        // completes a word: a 'boundary' step, closing whatever was open.
        undoStack.record({ text: plain, caret }, 'boundary');
        onChangeRef.current(plain);
        onForwardRef.current?.();
        redecorate(plain, caret);
      };
      const onCompStartDraft = () => { composingDraft = true; };
      const onCompEndDraft = () => {
        composingDraft = false;
        const { plain, caret } = readEditorPlainText(el.innerText, getPlainOffset(el));
        // FX6 S1 — an IME-composed insertion is one atomic undo step (no
        // per-candidate-update recording happens above — onInput returns
        // early while composingDraft is true, so the stack's own `current`
        // stays exactly where it was before composition began).
        undoStack.record({ text: plain, caret }, 'atomic');
        onChangeRef.current(plain);
        redecorate(plain, caret);
      };
      const blockPaste = (e: Event) => {
        if (shadowAllows(extractIncomingText(e))) return;
        e.preventDefault(); notePasteBlocked();
      };
      el.addEventListener('input', onInput);
      el.addEventListener('beforeinput', onBeforeInputDraft as EventListener);
      el.addEventListener('keydown', onKeyDownDraft);
      el.addEventListener('keydown', onUndoRedoKeyDraft);
      el.addEventListener('compositionstart', onCompStartDraft);
      el.addEventListener('compositionend', onCompEndDraft);
      el.addEventListener('paste', blockPaste);
      el.addEventListener('drop', blockPaste);
      return () => {
        el.removeEventListener('input', onInput);
        el.removeEventListener('beforeinput', onBeforeInputDraft as EventListener);
        el.removeEventListener('keydown', onKeyDownDraft);
        el.removeEventListener('keydown', onUndoRedoKeyDraft);
        el.removeEventListener('compositionstart', onCompStartDraft);
        el.removeEventListener('compositionend', onCompEndDraft);
        el.removeEventListener('paste', blockPaste);
        el.removeEventListener('drop', blockPaste);
        unregisterUndoStack(el);
      };
    }

    const onBeforeInput = (e: InputEvent) => {
      const it = e.inputType || '';
      // Backspace/delete ALWAYS strikes — even mid-composition. Mobile keyboards
      // "recompose" a word when you backspace into it; if we hand those deletes to
      // the browser (the composition path) the first letters get ERASED instead of
      // struck. So intercept deletes first: abort the (re)composition (the innerHTML
      // re-render wipes its draft node) and strike from our model.
      if (it.startsWith('delete')) {
        e.preventDefault();
        if (it.toLowerCase().includes('forward')) return; // no forward erasure
        if (composingRef.current || e.isComposing) skipCompEndRef.current = true;
        composingRef.current = false;
        handleBackspace();
        return;
      }
      // Inserts: hand off to the IME while composing (so typing/autocorrect work).
      if (composingRef.current || e.isComposing || it === 'insertCompositionText') return;
      e.preventDefault();
      if (it === 'insertFromPaste' || it === 'insertFromDrop') {
        // VW Slice 4 — own ink: route through the SAME append path typed input
        // uses (forward-only's law holds — text still enters at the runway tip).
        const text = extractIncomingText(e);
        if (shadowAllows(text)) { handleInput(text); return; }
        notePasteBlocked();
        return;
      }
      if (it.startsWith('insert')) {
        const data = e.data ?? ((it === 'insertParagraph' || it === 'insertLineBreak') ? '\n' : '');
        if (data) handleInput(data);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return; // don't intercept keys mid-composition
      // Hardware keyboard backspace fires keydown; preventDefault here stops the
      // native edit, so beforeinput won't also fire (no double). Soft keyboards
      // that skip keydown are caught by the beforeinput delete branch above.
      if (e.key === 'Backspace') { e.preventDefault(); handleBackspace(); }
    };
    const onCompStart = () => { composingRef.current = true; };
    const onCompEnd = (e: CompositionEvent) => {
      composingRef.current = false;
      if (skipCompEndRef.current) { skipCompEndRef.current = false; return; } // a delete aborted this composition
      const data = e.data || '';
      if (data) handleInput(data); // commit the finalized text; the re-render replaces the browser's draft
    };
    const block = (e: Event) => e.preventDefault(); // cut: block (removes committed text). Copy-out is NOT blocked.
    // Paste + drop are the foreign-voice wall — block AND whisper (belt-and-
    // suspenders alongside the beforeinput branch, for any browser that fires the
    // event without a beforeinput). The once-per-session gate dedups. Own ink
    // (VW Slice 4) still must preventDefault here — this surface's rendering is
    // fully model-owned (Run state -> innerHTML), so even an allowed paste is
    // routed through handleInput rather than a native DOM mutation.
    const blockPaste = (e: Event) => {
      e.preventDefault();
      const text = extractIncomingText(e);
      if (shadowAllows(text)) { handleInput(text); return; }
      notePasteBlocked();
    };

    el.addEventListener('beforeinput', onBeforeInput as EventListener);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('compositionstart', onCompStart);
    el.addEventListener('compositionend', onCompEnd as EventListener);
    el.addEventListener('paste', blockPaste);
    el.addEventListener('drop', blockPaste);
    el.addEventListener('cut', block);
    return () => {
      el.removeEventListener('beforeinput', onBeforeInput as EventListener);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('compositionstart', onCompStart);
      el.removeEventListener('compositionend', onCompEnd as EventListener);
      el.removeEventListener('paste', blockPaste);
      el.removeEventListener('drop', blockPaste);
      el.removeEventListener('cut', block);
    };
    // handlers read refs only, so a once-attached listener stays correct
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // I0 — pen discipline. Ink is SEALED IN THE JOURNAL; the ForwardOnlyEditor is a
  // NON-Journal surface (the sprint, the page in BOTH modes, the gate), so the
  // stylus must be INERT here: zero characters, zero OS handwriting recognition,
  // metaphor-coherent (typewriters ignore pens). Two mechanisms, the proven J10
  // pattern used to NEUTRALIZE rather than ink:
  //   (a) capture-phase pen-only pointer preventDefault — no caret, no default, so
  //       recognition never initiates from the pointer;
  //   (b) touch-action:none + the declarative handwriting opt-out — Chromium routes
  //       handwriting through touch-action (pointer preventDefault alone doesn't
  //       stop it), so `none` is what actually seals it.
  // Finger / mouse / keyboard are never intercepted (pen-only guard), so their
  // behavior is unchanged apart from touch-action (finger-drag over the editor no
  // longer pans — the same tradeoff the shipped Journal sheet already makes; the
  // scroll container `.mode-scroll` still owns finger scroll). Verified on hardware
  // (Nick's phone) before deploy — this bug class is hardware-invisible.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    el.style.touchAction = 'none';
    el.setAttribute('handwriting', 'false');
    const neutralizePen = (e: PointerEvent) => {
      if (e.pointerType !== 'pen') return; // finger / mouse fall through, byte-identical
      e.preventDefault();
      e.stopPropagation();
    };
    const opts = { passive: false, capture: true } as const;
    el.addEventListener('pointerdown', neutralizePen, opts);
    el.addEventListener('pointermove', neutralizePen, opts);
    el.addEventListener('pointerup', neutralizePen, opts);
    return () => {
      el.removeEventListener('pointerdown', neutralizePen, opts);
      el.removeEventListener('pointermove', neutralizePen, opts);
      el.removeEventListener('pointerup', neutralizePen, opts);
    };
  }, []);

  // Autofocus on mount (A8) — and emit the seed once so the host's draftText is
  // in sync from the first paint.
  useEffect(() => {
    if (autoFocus) hostRef.current?.focus();
    // Drafting mounts (incl. a mode switch) land the caret at the end of the
    // carried-over prose, once. Journal's per-render effect handles its caret.
    // AB2 fix (post-build review) — routed through decorateEditorFor rather
    // than a bare selectNodeContents/collapse(false): if the carried-over
    // prose itself ends with '\n' (e.g. a page whose stored text ends in a
    // blank line), collapsing straight to the container's end lands the
    // caret in exactly the trailing-newline-at-EOF state the Chromium quirk
    // (see draftDecoration.ts) corrupts on the very next keystroke.
    if (drafting) {
      const el = hostRef.current;
      if (el) decorateEditorFor(el, initialText, initialText.length, setPlainOffset);
    }
    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the browser's (invisible) caret at the end after every re-render.
  // React replaces the rendered text nodes on each change, which would otherwise
  // invalidate the selection and stop the next keystroke from firing input.
  // Forward-only ⇒ the insertion point is always the end. No deps: runs after
  // every render (cheap; only acts while the host is focused).
  useEffect(() => {
    const el = hostRef.current;
    if (!el || document.activeElement !== el) return;
    if (drafting) return;             // drafting is free-edit: the browser owns the caret
    if (composingRef.current) return; // never move the caret mid-composition
    // Empty surface: trust the browser's own focus caret (forcing a selection
    // into the empty/placeholder-only host parks it in a non-editable spot and
    // suppresses input). Only re-anchor once there's real content to land on.
    if (contentRef.current.length === 0 && wordRef.current.length === 0) return;
    const sel = window.getSelection();
    if (!sel) return;
    // Collapse to the end of the host (the live insertion point). The only
    // non-flow children (placeholder, nudge) are absolutely positioned and
    // rendered BEFORE the runs, so the last in-flow node is always the editable
    // word — keeping this a valid caret/insertion point.
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  });

  const setRefs = (node: HTMLDivElement | null) => {
    hostRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  const content = contentRef.current;
  const word = wordRef.current;
  const nudge = nudgeRef.current;
  const isEmpty = content.length === 0 && word.length === 0;

  // Render the editable content via innerHTML (not React child spans). Setting
  // innerHTML on each render fully REPLACES the DOM — which is what lets IME work:
  // the post-composition render wipes the browser's draft nodes, and React skips
  // the update entirely when the html string is unchanged (so an unrelated parent
  // re-render mid-composition can't clobber the composing text). When empty the
  // host has no children, so the browser can place a caret. Placeholder + nudge
  // are overlays in the wrapper, never inside the editable.
  // Drafting seeds the host with the carried-over clean text as plain content and
  // then lets the browser own it (the html below is stable across re-renders, so
  // React never re-sets innerHTML and never clobbers the free edits — the native
  // 'input' listener below re-decorates imperatively on every keystroke instead,
  // AB2 S0/S3's iA register). Journal renders its runs (struck spans stay
  // visible, drop from derived).
  const html = drafting
    ? decorateMarkdown(initialText)
    : isEmpty
      ? ''
      : content.map(run => `<span class="${run.struck ? 'fo-run fo-struck' : 'fo-run'}">${escHtml(run.text)}</span>`).join('')
        + `<span class="fo-word">${escHtml(word)}</span>`;

  return (
    <div className="forward-only-editor-wrap" style={{ position: 'relative', display: 'flex', flexDirection: 'column', ...style }}>
      <div
        ref={setRefs}
        className="forward-only-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel ?? 'Writing surface'}
        spellCheck={false}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{ flex: 1, minHeight: 0, outline: 'none', whiteSpace: 'pre-wrap', cursor: 'text', ...(penColor ? { color: penColor, caretColor: penColor } : null) }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isEmpty && placeholder && (
        <div className="fo-placeholder" aria-hidden="true">{placeholder}</div>
      )}
      {nudge && (
        <div className="fo-nudge" aria-live="polite">{nudge}</div>
      )}
    </div>
  );
});

function escHtml(s: string): string {
  return s.replace(/[&<>]/g, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
}
