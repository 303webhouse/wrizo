import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJournalEntry, saveScriptDoc, flushNow, getDrawer, getProject } from '../store/persistence';
import { flattenScenes, groupIntoScenes, createEmptyScriptDoc, newElement } from '../store/scriptDoc';
import { serializeScriptDoc } from '../store/scriptText';
import { WIDTH_CH, INDENT_CH, RIGHT_ALIGN_TYPES, UPPERCASE_TYPES } from '../store/scriptMetrics';
import { ENTER_MAP, TAB_MAP, TYPE_CYCLE, cycleBackward } from '../store/scriptKeys';
import { computeAutocomplete, applyAutocomplete, type AutocompleteState } from '../store/scriptAutocomplete';
import { shouldPromoteToScene, applyAutoContd } from '../store/scriptSmartText';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';
import { copyText } from '../store/clipboard';
import { useSessionLog } from './useSessionLog';
import type { Scene, ScriptEl, ScriptElType, Project } from '../types';

// S1 — the Screenplay Room: a house-native block editor, one styled block per
// element, ONLY the active element a live contenteditable (the BoardTextBox
// single-live-editable pattern — seed once per edit session, keyed remount).
// The document is edited as a FLAT element array (far simpler than nested
// scene/body arrays mid-edit); a scene boundary is just "the next element
// with t==='scene'" — groupIntoScenes derives the persisted Scene[] shape at
// save time (store/scriptDoc.ts). Anti-Canva in its purest form: no styling
// toolbar, ever — format is semantic, driven entirely by the element type.

const AUTOSAVE_MS = 2000;

const GHOST_TEXT: Record<ScriptElType, string> = {
  scene: 'INT. LOCATION - DAY',
  action: 'Action.',
  character: 'CHARACTER',
  paren: '(beat)',
  dialogue: 'Dialogue.',
  transition: 'CUT TO:',
  shot: 'ANGLE ON',
  general: 'Note.',
};

// Chrome/Electron supports contentEditable="plaintext-only" (no nested HTML
// on paste/IME — exactly what a single-text-node element block wants); guard
// with a fallback to "true" for any environment that doesn't.
const PLAINTEXT_MODE: 'plaintext-only' | true = (() => {
  if (typeof document === 'undefined') return true;
  try {
    const d = document.createElement('div');
    (d as unknown as { contentEditable: string }).contentEditable = 'plaintext-only';
    return (d as unknown as { contentEditable: string }).contentEditable === 'plaintext-only' ? 'plaintext-only' : true;
  } catch {
    return true;
  }
})();

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// Shared geometry for both the active and static renders of an element — one
// function so the two can never drift from each other visually.
function elementStyle(t: ScriptElType): React.CSSProperties {
  const rightAlign = RIGHT_ALIGN_TYPES.has(t);
  return {
    maxWidth: `${WIDTH_CH[t]}ch`,
    marginLeft: rightAlign ? 'auto' : `${INDENT_CH[t]}ch`,
    marginRight: rightAlign ? 0 : undefined,
    textAlign: rightAlign ? 'right' : 'left',
    textTransform: UPPERCASE_TYPES.has(t) ? 'uppercase' : 'none',
  };
}

// -- caret helpers: a live element here is always a single text node (or
// none, when empty) — plaintext-only guarantees no nested markup. ----------
function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return 0;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

function setCaretOffset(el: HTMLElement, offset: number): void {
  const sel = window.getSelection();
  if (!sel) return;
  const textNode = el.firstChild;
  const range = document.createRange();
  if (!textNode) {
    range.setStart(el, 0);
  } else {
    const len = textNode.textContent?.length ?? 0;
    range.setStart(textNode, Math.max(0, Math.min(offset, len)));
  }
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Commit-processing for an element that's about to stop being active:
// auto (CONT'D) first (name-matching reads the raw typed case), then
// uppercase-on-commit for the types that display uppercase.
function commitElement(elements: ScriptEl[], index: number): ScriptEl[] {
  const el = elements[index];
  if (!el) return elements;
  let text = applyAutoContd(elements, index, el.text);
  if (UPPERCASE_TYPES.has(el.t)) text = text.toUpperCase();
  if (text === el.text) return elements;
  return elements.map((e, i) => (i === index ? { ...e, text } : e));
}

type CaretHint = 'start' | 'end' | number;

// -- the ONE live contenteditable block --------------------------------------
function ActiveScriptElement({
  el, caretHint, onInput, onKeyDown, elRef,
}: {
  el: ScriptEl;
  caretHint: CaretHint;
  onInput: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  elRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [seed] = useState(() => el.text);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    node.textContent = seed;
    node.focus();
    const offset = caretHint === 'start' ? 0 : caretHint === 'end' ? seed.length : caretHint;
    setCaretOffset(node, offset);

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
      onInput={() => onInput(nodeRef.current?.textContent ?? '')}
      onKeyDown={onKeyDown}
      style={elementStyle(el.t)}
    />
  );
}

function StaticScriptElement({ el, onActivate }: { el: ScriptEl; onActivate: (clientX: number, clientY: number) => void }) {
  return (
    <div
      className="script-el"
      data-type={el.t}
      onClick={e => onActivate(e.clientX, e.clientY)}
      style={{ ...elementStyle(el.t), cursor: 'text' }}
    >
      {el.text}
    </div>
  );
}

function AutocompletePopover({ state, index, indentCh }: { state: AutocompleteState; index: number; indentCh: number }) {
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

export function ScriptEditor({ id }: { id: string }) {
  const navigate = useNavigate();
  const initialEntry = getJournalEntry(id);
  const initialDoc = initialEntry?.script ?? createEmptyScriptDoc();

  const [elements, setElements] = useState<ScriptEl[]>(() => flattenScenes(initialDoc.scenes));
  const [activeIndex, setActiveIndex] = useState(0);
  const [caretHint, setCaretHint] = useState<CaretHint>('end');
  const [seedNonce, setSeedNonce] = useState(0);
  const [acIndex, setAcIndex] = useState(0);
  const [acDismissed, setAcDismissed] = useState<string | null>(null);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const scenesRef = useRef<Scene[]>(initialDoc.scenes);
  const lastSavedRef = useRef(elements);
  const activeElRef = useRef<HTMLDivElement | null>(null);

  const project: Project | null = initialEntry?.projectId ? getProject(initialEntry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;

  const activeEl = elements[activeIndex];
  const ac = activeEl ? computeAutocomplete(activeEl.t, activeEl.text, elements) : null;
  const acSig = ac ? `${activeIndex}:${ac.kind}:${ac.query}` : null;
  const acVisible = !!ac && acSig !== acDismissed;

  useEffect(() => { setAcIndex(0); }, [acSig]);

  // Autosave — debounced, through saveScriptDoc (doc + shadow in one write).
  useEffect(() => {
    if (elements === lastSavedRef.current) return;
    const h = setTimeout(() => {
      const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
      scenesRef.current = scenes;
      saveScriptDoc(id, { v: 1, scenes });
      lastSavedRef.current = elementsRef.current;
    }, AUTOSAVE_MS);
    return () => clearTimeout(h);
  }, [elements, id]);

  useEffect(() => {
    const doFlush = () => {
      if (elementsRef.current !== lastSavedRef.current) {
        const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
        scenesRef.current = scenes;
        saveScriptDoc(id, { v: 1, scenes });
        lastSavedRef.current = elementsRef.current;
      }
    };
    const onHide = () => { if (document.visibilityState === 'hidden') { doFlush(); flushNow(); } };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      doFlush();
      flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // F5 — TTFK for the Screenplay Room, same seam as every other surface.
  const noteSessionKeystroke = useSessionLog('script', {
    projectId: () => initialEntry?.projectId ?? null,
    words: () => elementsRef.current.reduce((n, e) => n + wordCount(e.text), 0),
  });
  const firedFirstKeystroke = useRef(false);
  const noteFirstKeystroke = () => { if (!firedFirstKeystroke.current) { firedFirstKeystroke.current = true; noteSessionKeystroke(); } };

  if (!initialEntry) return null;

  const moveActive = (nextIndex: number, hint: CaretHint) => {
    setActiveIndex(nextIndex);
    setCaretHint(hint);
    setSeedNonce(n => n + 1);
    setAcDismissed(null);
  };

  const retype = (nextType: ScriptElType) => {
    setElements(prev => prev.map((e, i) => (i === activeIndex ? { ...e, t: nextType } : e)));
  };

  const handleInput = (text: string) => {
    noteFirstKeystroke();
    setElements(prev => {
      const el = prev[activeIndex];
      if (!el) return prev;
      const promote = el.t === 'action' && shouldPromoteToScene(text);
      return prev.map((e, i) => (i === activeIndex ? { ...e, text, t: promote ? 'scene' : e.t } : e));
    });
    setAcDismissed(null);
  };

  const acceptAutocomplete = () => {
    if (!ac) return;
    const chosen = ac.options[acIndex] ?? ac.options[0];
    const newText = applyAutocomplete(activeEl.text, ac, chosen);
    setElements(prev => prev.map((e, i) => (i === activeIndex ? { ...e, text: newText } : e)));
    // Re-seed the live node directly too so the caret lands correctly without
    // waiting a render (the mount effect only seeds once per edit session).
    const node = activeElRef.current;
    if (node) { node.textContent = newText; setCaretOffset(node, newText.length); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (acVisible && ac) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAcIndex(i => (i + 1) % ac.options.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAcIndex(i => (i - 1 + ac.options.length) % ac.options.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); acceptAutocomplete(); return; }
      if (e.key === 'Escape') { e.preventDefault(); setAcDismissed(acSig); return; }
    }

    const node = activeElRef.current;
    // The live DOM is ground truth for "what's actually typed right now" —
    // React state (`activeEl.text`) is only guaranteed current as of the
    // last processed input event, and Enter's keydown can in principle be
    // dispatched before that update flushes (e.g. a fast synthetic-event
    // harness). Reading textContent directly sidesteps any staleness.
    const offset = node ? getCaretOffset(node) : 0;
    const text = node?.textContent ?? activeEl?.text ?? '';

    if (e.key === 'Enter') {
      e.preventDefault();
      if (text.trim().length === 0) {
        retype(ENTER_MAP[activeEl.t]);
        return;
      }
      const atEnd = offset >= text.length;
      const head = atEnd ? text : text.slice(0, offset);
      const tail = atEnd ? '' : text.slice(offset).trim();
      const nextType = ENTER_MAP[activeEl.t];
      const newEl = newElement(nextType, tail);
      setElements(prev => {
        const withHead = prev.map((el, i) => (i === activeIndex ? { ...el, text: head } : el));
        const committed = commitElement(withHead, activeIndex);
        const next = [...committed];
        next.splice(activeIndex + 1, 0, newEl);
        return next;
      });
      moveActive(activeIndex + 1, 'start');
      return;
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      retype(TAB_MAP[activeEl.t]);
      return;
    }
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      retype(cycleBackward(activeEl.t));
      return;
    }
    if ((e.ctrlKey || e.metaKey) && /^[1-8]$/.test(e.key)) {
      e.preventDefault();
      retype(TYPE_CYCLE[Number(e.key) - 1]);
      return;
    }
    if (e.key === 'Backspace' && offset === 0 && activeIndex > 0) {
      e.preventDefault();
      const prevIndex = activeIndex - 1;
      const boundary = elements[prevIndex]?.text.length ?? 0;
      setElements(prev => {
        // `text` (read above from the live DOM, not `prev[activeIndex].text`)
        // is ground truth for what's actually typed right now — same
        // reasoning as Enter's own DOM read (Fable A2).
        const merged = prev[prevIndex].text + text;
        const next = prev.map((el, i) => (i === prevIndex ? { ...el, text: merged } : el));
        next.splice(activeIndex, 1);
        return next;
      });
      moveActive(prevIndex, boundary);
      return;
    }
    if (e.key === 'ArrowUp' && offset === 0 && activeIndex > 0) {
      e.preventDefault();
      setElements(prev => commitElement(prev.map((el, i) => (i === activeIndex ? { ...el, text } : el)), activeIndex));
      moveActive(activeIndex - 1, 'end');
      return;
    }
    if (e.key === 'ArrowDown' && offset >= text.length && activeIndex < elements.length - 1) {
      e.preventDefault();
      setElements(prev => commitElement(prev.map((el, i) => (i === activeIndex ? { ...el, text } : el)), activeIndex));
      moveActive(activeIndex + 1, 'start');
      return;
    }
  };

  const activateAt = (index: number, clientX: number, clientY: number) => {
    if (index === activeIndex) return;
    const domText = activeElRef.current?.textContent;
    setElements(prev => commitElement(
      domText != null ? prev.map((el, i) => (i === activeIndex ? { ...el, text: domText } : el)) : prev,
      activeIndex,
    ));
    let hint: CaretHint = 'end';
    const caretApi = (document as unknown as { caretRangeFromPoint?: (x: number, y: number) => Range | null }).caretRangeFromPoint;
    if (caretApi) {
      try {
        const range = caretApi.call(document, clientX, clientY);
        if (range) hint = range.startOffset;
      } catch { /* best-effort */ }
    }
    moveActive(index, hint);
  };

  const copyScriptText = () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    copyText(serializeScriptDoc({ v: 1, scenes }));
  };

  const title = elements.find(e => e.t === 'scene')?.text.trim() || 'Untitled';
  const backTo = project ? `/project/${project.id}` : '/journal';

  return (
    <div className="page script-page" style={{ maxWidth: 1100, paddingTop: '2.5rem' }}>
      <div className="sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="sprint-crumb" aria-label="Location">
          {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
          {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
          <span className="crumb-here">{title}</span>
        </div>
        <div className="sprint-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-quiet script-copy" onClick={copyScriptText} title="Copy the script's plain text">Copy script text</button>
          <button type="button" className="btn-quiet" onClick={() => { flushNow(); navigate(backTo); }}>Done</button>
        </div>
      </div>

      <div style={{ height: 16 }} />

      {/* Draft law only (S1) — no ModeSwitcher/ModeStage on this surface; the
          Screenplay Room's forward-only mode (script Free-write) is S4. */}
      <div className="script-sheet" style={{ position: 'relative', maxWidth: '60ch' }}>
        {elements.map((el, i) => {
          const active = i === activeIndex;
          if (active) {
            return (
              <Fragment key={`${el.id}:${seedNonce}:wrap`}>
                <ActiveScriptElement
                  key={`${el.id}:${seedNonce}`}
                  el={el}
                  caretHint={caretHint}
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  elRef={activeElRef}
                />
                {/* Fable R1 — rendered as the active element's own flow-sibling
                    (not the sheet's last child) so its no-top/left absolute
                    position resolves to right beneath THIS block, wherever it
                    sits in the document, instead of the bottom of the sheet. */}
                {acVisible && ac && <AutocompletePopover state={ac} index={acIndex} indentCh={INDENT_CH[el.t]} />}
              </Fragment>
            );
          }
          return <StaticScriptElement key={el.id} el={el} onActivate={(x, y) => activateAt(i, x, y)} />;
        })}
      </div>
    </div>
  );
}
