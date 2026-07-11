import { forwardRef, useEffect, useReducer, useRef } from 'react';
import type { Run } from '../types';
import { append, derivedText, isBoundary, seedContent, strikeStep } from '../store/forwardOnly';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';

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
  style?: React.CSSProperties;
}

export const ForwardOnlyEditor = forwardRef<HTMLDivElement, Props>(function ForwardOnlyEditor(
  { initialText, onChange, mode = 'journal', onForward, onFocus, onBlur, autoFocus, placeholder, ariaLabel, penColor, style },
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

  // The revised forward-only runway — every backspace STRIKES (never deletes),
  // escalating with consecutive presses (typing resets via resetRunway):
  //   1 char · 2 char · 3 rest-of-word · 4 prev-word · 5 rest-of-sentence · 6+ locked.
  // The active word is flushed into the runs on the first press so all strikes
  // operate on committed content; struck runs stay visible but drop from derived.
  const handleBackspace = () => {
    if (wordRef.current.length > 0) {
      contentRef.current = append(contentRef.current, wordRef.current);
      wordRef.current = '';
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
    if (drafting) {
      const onInput = () => { onChangeRef.current(el.innerText); onForwardRef.current?.(); };
      // VW Slice 4 — own ink passes silently: simply don't preventDefault, and
      // the browser's native paste/drop proceeds (Draft owns its contenteditable).
      const onBeforeInputDraft = (e: InputEvent) => {
        const it = e.inputType || '';
        if (it === 'insertFromPaste' || it === 'insertFromDrop') {
          if (shadowAllows(extractIncomingText(e))) return;
          e.preventDefault(); notePasteBlocked();
        }
      };
      const blockPaste = (e: Event) => {
        if (shadowAllows(extractIncomingText(e))) return;
        e.preventDefault(); notePasteBlocked();
      };
      el.addEventListener('input', onInput);
      el.addEventListener('beforeinput', onBeforeInputDraft as EventListener);
      el.addEventListener('paste', blockPaste);
      el.addEventListener('drop', blockPaste);
      return () => {
        el.removeEventListener('input', onInput);
        el.removeEventListener('beforeinput', onBeforeInputDraft as EventListener);
        el.removeEventListener('paste', blockPaste);
        el.removeEventListener('drop', blockPaste);
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
    if (drafting) {
      const el = hostRef.current;
      if (el) {
        const sel = window.getSelection();
        if (sel) { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
      }
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
  // React never re-sets innerHTML and never clobbers the free edits). Journal
  // renders its runs (struck spans stay visible, drop from derived).
  const html = drafting
    ? escHtml(initialText)
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
