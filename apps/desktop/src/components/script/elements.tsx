import { memo, useEffect, useRef, useState } from 'react';
import { UPPERCASE_TYPES, widthChFor } from '../../store/scriptMetrics';
import { wrapToLines } from '../../store/scriptLedger';
import { type Placed } from '../../store/scriptPaginate';
import { type AutocompleteState } from '../../store/scriptAutocomplete';
import { applyAutoContd } from '../../store/scriptSmartText';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../../store/voiceWall';
import { ESC_HINT_ID } from '../../store/escapeExit';
import type { ScriptEl } from '../../types';
import { GHOST_TEXT, PLAINTEXT_MODE, elementStyle, elementStyleStatic } from './styles';
import { keepCaretVisible, setCaretOffset } from './caret';

// Commit-processing for an element that's about to stop being active:
// auto (CONT'D) first (name-matching reads the raw typed case), then
// uppercase-on-commit for the types that display uppercase.
export function commitElement(elements: ScriptEl[], index: number): ScriptEl[] {
  const el = elements[index];
  if (!el) return elements;
  let text = applyAutoContd(elements, index, el.text);
  if (UPPERCASE_TYPES.has(el.t)) text = text.toUpperCase();
  if (text === el.text) return elements;
  return elements.map((e, i) => (i === index ? { ...e, text } : e));
}

export type CaretHint = 'start' | 'end' | number;

// -- the ONE live contenteditable block --------------------------------------
export function ActiveScriptElement({
  el, caretHint, onInput, onKeyDown, elRef, docIndex, sessionKey, liveCaret, noteCaret,
}: {
  el: ScriptEl;
  caretHint: CaretHint;
  onInput: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  elRef: React.MutableRefObject<HTMLDivElement | null>;
  docIndex: number;
  sessionKey: string;
  liveCaret: React.MutableRefObject<{ key: string; offset: number } | null>;
  noteCaret: () => void;
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [seed] = useState(() => el.text);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    node.textContent = seed;
    // clause 1 of the vertical policy: focus never scrolls the page [ScriptEditor §3]
    node.focus({ preventScroll: true });
    // a page break remounts the active element (React deletes and re-inserts across sheets), so the same edit session restores the live caret offset over the stale hint [ScriptEditor §4]
    const remembered = liveCaret.current && liveCaret.current.key === sessionKey ? liveCaret.current.offset : null;
    const offset = remembered !== null
      ? Math.max(0, Math.min(remembered, seed.length))
      : caretHint === 'start' ? 0 : caretHint === 'end' ? seed.length : caretHint;
    setCaretOffset(node, offset);
    keepCaretVisible(node);

    // I0 pen discipline: the pen points, never types, never inks — the
    // recognizer hazard returns exactly at a live contenteditable and is
    // pre-empted here (BoardTextBox's pattern, verbatim).
    node.style.touchAction = 'none';
    node.setAttribute('handwriting', 'false');
    const neutralizePen = (e: PointerEvent) => {
      if (e.pointerType !== 'pen') return;
      e.preventDefault();
      e.stopPropagation();
    };
    const opts = { passive: false, capture: true } as const;
    node.addEventListener('pointerdown', neutralizePen, opts);
    node.addEventListener('pointermove', neutralizePen, opts);
    node.addEventListener('pointerup', neutralizePen, opts);

    // Voice Wall — foreign paste/drop blocked + whispered; an allowed
    // own-shadow paste proceeds natively (BoardTextBox's pattern, verbatim).
    const onBeforeInput = (e: InputEvent) => {
      const it = e.inputType || '';
      if (it === 'insertFromPaste' || it === 'insertFromDrop') {
        if (shadowAllows(extractIncomingText(e))) return;
        e.preventDefault();
        notePasteBlocked();
      }
    };
    const blockForeign = (e: Event) => {
      if (shadowAllows(extractIncomingText(e))) return;
      e.preventDefault();
      notePasteBlocked();
    };
    node.addEventListener('beforeinput', onBeforeInput as EventListener);
    node.addEventListener('paste', blockForeign);
    node.addEventListener('drop', blockForeign);

    return () => {
      node.removeEventListener('pointerdown', neutralizePen, opts);
      node.removeEventListener('pointermove', neutralizePen, opts);
      node.removeEventListener('pointerup', neutralizePen, opts);
      node.removeEventListener('beforeinput', onBeforeInput as EventListener);
      node.removeEventListener('paste', blockForeign);
      node.removeEventListener('drop', blockForeign);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={n => { nodeRef.current = n; elRef.current = n; }}
      className="script-el script-el-active"
      data-type={el.t}
      data-ghost={GHOST_TEXT[el.t]}
      contentEditable={PLAINTEXT_MODE}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={`Script ${el.t} — active`}
      aria-describedby={ESC_HINT_ID}
      onInput={() => onInput(nodeRef.current?.textContent ?? '')}
      onKeyDown={onKeyDown}
      onKeyUp={noteCaret}
      onMouseUp={noteCaret}
      style={elementStyle(el.t)}
      data-doc-index={docIndex}
    />
  );
}

// SC2 S2b — EVERY PROP IS NOW STABLE BY CONSTRUCTION, which is the whole point.
// `onActivate` used to be a fresh `(x, y) => activateAt(i, x, y)` closure per
// element per render — the second of the two things (with elementStyle's object)
// that would have made S5's React.memo a no-op. It is gone: activation is one
// delegated handler on the sequence, reading `data-doc-index` off the DOM, which
// is stable by construction rather than by discipline.
//
// `text` is a prop rather than `el.text` because a page break can cut an action
// block in half; for everything else it IS `el.text`, so identity is unchanged.
// `docIndex` is the DOCUMENT index — `activateAt` addresses the flat element
// array and must keep doing so; a page-local position would silently address
// the wrong element the moment a break moved above it.
//
// SC2 S5 — AND HERE THE SEAM IS TAKEN. `React.memo` is the whole change; S2b
// did the work that makes it bite, which is why this is an edit and not a
// rewrite. Every prop is compared by the default shallow equality and every one
// of them is stable when the element has not changed:
//   `el`        — `setElements` maps with `prev.map((e, i) => i === idx ? {...}
//                 : e)`, so an untouched element keeps its object identity;
//   `text`      — `el.text` by identity for anything unsplit (textOfPart
//                 returns it directly), a value-equal string for a split part;
//   `docIndex`  — a number, and only changes when something above is inserted
//                 or removed, which is exactly when this element must re-render;
//   the flags   — booleans.
// The style object is frozen per type at module level and the click handler is
// delegated to the sequence, so neither reintroduces a fresh identity per
// render. Those were the two things that would have made this a no-op.
//
// WHAT IT IS FOR, from the measurement rather than from intuition: sc2.mjs's S0
// header records that the per-keystroke cost is React reconciling EVERY
// StaticScriptElement, and that `groupIntoScenes` — the brief's original
// suspect — does not run per keystroke at all (AUTOSAVE_MS = 2000, debounced).
// A keystroke changes one element; with this, one element re-renders.
//
// !! VERIFICATION OWED AND NOT YET DONE !! The DIAGNOSIS is measured and on the
// record; the EFFECT of this fix is not. Amendment 1's gate is a regression
// bound judged by checking out the frozen baseline `c1cabe8` on the judging
// machine, measuring, and measuring the tip in the SAME session INTERLEAVED —
// and that is a browser run, held until the machine is quiet. Nothing here may
// be reported as an improvement until that number exists. Four premises in this
// arc read as obvious and were false when measured.
export const StaticScriptElement = memo(function StaticScriptElement({ el, text, docIndex, continues, continuedFrom }: {
  el: ScriptEl;
  text: string;
  docIndex: number;
  continues: boolean;
  continuedFrom: boolean;
}) {
  return (
    <div
      className="script-el"
      data-type={el.t}
      data-doc-index={docIndex}
      data-continues={continues ? 'true' : undefined}
      data-continued-from={continuedFrom ? 'true' : undefined}
      style={elementStyleStatic(el.t)}
    >
      {text}
    </div>
  );
});

// SC2 S2b — the writer's own text for ONE part of a placed element.
//
// For everything that is not split this returns `el.text` BY IDENTITY, so the
// overwhelmingly common case adds nothing at all — no allocation, no work, and
// the prop identity S5's memo will depend on is unchanged.
//
// For the one permitted split (an action block longer than a whole page) it cuts
// the text at exactly the line the paginator counted to, using the SAME wrap
// function the count came from. That is why `wrapToLines` exists: a second
// slicing routine would have been the obvious way to add this, and the obvious
// way to end up rendering a break the arithmetic did not place.
export function textOfPart(el: ScriptEl, p: Placed): string {
  if (!p.continues && !p.continuedFrom) return el.text;
  // join('') — never '\n'. The lines concatenate back to the writer's text
  // exactly (scriptLedger's own contract), so a part is a genuine SUBSTRING and
  // `pre-wrap` re-wraps it into the identical lines. Joining with '\n' also
  // renders correctly and is a lie about the text: it writes breaks the writer
  // never typed into the DOM.
  return wrapToLines(el.text, widthChFor(el.t)).slice(p.lineOffset, p.lineOffset + p.lines).join('');
}

export function AutocompletePopover({ state, index, indentCh }: { state: AutocompleteState; index: number; indentCh: number }) {
  return (
    <div className="script-autocomplete" role="listbox" aria-label="Script autocomplete" style={{ marginLeft: `${indentCh}ch` }}>
      {state.options.map((o, i) => (
        <div key={o} className="script-autocomplete-opt" data-highlighted={i === index ? 'true' : 'false'} role="option" aria-selected={i === index}>
          {o}
        </div>
      ))}
    </div>
  );
}
