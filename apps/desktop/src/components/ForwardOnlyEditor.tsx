import { forwardRef, useEffect, useReducer, useRef } from 'react';
import type { Run } from '../types';
import { append, appendStruck, derivedText, isBoundary, seedContent, strikeLastUnstruck } from '../store/forwardOnly';

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

interface Props {
  initialText: string;
  onChange: (derived: string) => void;
  onForward?: () => void;      // fired on a forward keystroke (e.g. ambient warmth, first-keystroke stamp)
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export const ForwardOnlyEditor = forwardRef<HTMLDivElement, Props>(function ForwardOnlyEditor(
  { initialText, onChange, onForward, onFocus, onBlur, autoFocus, placeholder, ariaLabel, style },
  ref,
) {
  // content (committed runs) + word (uncommitted active word) are the model.
  // Refs are the truth read by the input handlers (no stale closures); state
  // mirrors them for rendering. force() re-renders on a model change.
  const contentRef = useRef<Run[]>(seedContent(initialText));
  const wordRef = useRef('');
  const nudgeRef = useRef<string | null>(null);
  const bsRef = useRef(0);        // consecutive backspaces since the last forward key
  const removedRef = useRef<string | null>(null); // letter vanished by the 1st backspace
  const noopRef = useRef(0);      // consecutive ineffective ("locked") backspaces
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
    removedRef.current = null;
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

  // The locked backspace runway:
  //   1st  → vanish the active word's last char (pre-commit; touches no Run)
  //   2nd  → flush the active word as a struck Run (restoring the vanished
  //          letter so the whole word shows struck); empty buffer → strike the
  //          last unstruck Run instead
  //   3rd  → strike the previous unstruck Run
  //   4th+ → locked, no-op; 3 consecutive no-ops show the keep-writing nudge
  const handleBackspace = () => {
    bsRef.current += 1;
    const n = bsRef.current;
    const c = contentRef.current;
    const w = wordRef.current;
    let did = false;

    if (n === 1) {
      if (w.length > 0) { removedRef.current = w.slice(-1); wordRef.current = w.slice(0, -1); did = true; }
    } else if (n === 2) {
      if (w.length > 0 || removedRef.current) {
        const full = w + (removedRef.current ?? ''); // restore the vanished letter → whole word struck
        removedRef.current = null;
        contentRef.current = appendStruck(c, full);
        wordRef.current = '';
        did = true;
      } else {
        const r = strikeLastUnstruck(c);
        if (r.changed) { contentRef.current = r.content; did = true; }
      }
    } else if (n === 3) {
      const r = strikeLastUnstruck(c);
      if (r.changed) { contentRef.current = r.content; did = true; }
    }

    if (did) {
      noopRef.current = 0;
      if (nudgeRef.current) nudgeRef.current = null;
    } else {
      noopRef.current += 1;
      if (noopRef.current >= 3) nudgeRef.current = KEEP_WRITING;
    }
    changed();
  };

  // Native listeners (not React synthetic) so input is captured identically on
  // hardware and soft/tablet keyboards. preventDefault on every input keeps the
  // browser from ever mutating the DOM — React owns the rendered content.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const onBeforeInput = (e: InputEvent) => {
      e.preventDefault();
      const it = e.inputType || '';
      if (it === 'insertFromPaste' || it === 'insertFromDrop') return; // foreign-voice wall: block external paste
      if (it.startsWith('delete')) {
        if (it.toLowerCase().includes('forward')) return; // no forward erasure
        handleBackspace();
        return;
      }
      if (it.startsWith('insert')) {
        const data = e.data ?? ((it === 'insertParagraph' || it === 'insertLineBreak') ? '\n' : '');
        if (data) handleInput(data);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // Hardware keyboard backspace fires keydown; preventDefault here stops the
      // native edit, so beforeinput won't also fire (no double). Soft keyboards
      // that skip keydown are caught by the beforeinput delete branch above.
      if (e.key === 'Backspace') { e.preventDefault(); handleBackspace(); }
    };
    const block = (e: Event) => e.preventDefault(); // cut/copy-out are not this surface's concern; block

    el.addEventListener('beforeinput', onBeforeInput as EventListener);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('paste', block);
    el.addEventListener('cut', block);
    return () => {
      el.removeEventListener('beforeinput', onBeforeInput as EventListener);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('paste', block);
      el.removeEventListener('cut', block);
    };
    // handlers read refs only, so a once-attached listener stays correct
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autofocus on mount (A8) — and emit the seed once so the host's draftText is
  // in sync from the first paint.
  useEffect(() => {
    if (autoFocus) hostRef.current?.focus();
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

  // The host renders ONLY editable content — when empty it has no children, so
  // the browser can place a caret (non-editable child nodes there would leave
  // no valid insertion point). Placeholder + nudge are overlays in the wrapper,
  // never inside the editable.
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
        style={{ flex: 1, minHeight: 0, outline: 'none', whiteSpace: 'pre-wrap', cursor: 'text' }}
      >
        {!isEmpty && content.map((run, i) => (
          <span key={i} className={run.struck ? 'fo-run fo-struck' : 'fo-run'}>{run.text}</span>
        ))}
        {!isEmpty && <span className="fo-word">{word}</span>}
      </div>
      {isEmpty && placeholder && (
        <div className="fo-placeholder" aria-hidden="true">{placeholder}</div>
      )}
      {nudge && (
        <div className="fo-nudge" aria-live="polite">{nudge}</div>
      )}
    </div>
  );
});
