import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getJournalEntry, saveScriptDoc, saveJournalEntry, patchJournalEntry, flushNow, getDrawer, getProject, getBoardsPinning } from '../store/persistence';
import { describePageHome } from '../store/pageHome';
import { flattenScenes, groupIntoScenes, createEmptyScriptDoc, newElement } from '../store/scriptDoc';
import { serializeScriptDoc, plainScriptWords } from '../store/scriptText';
import { WIDTH_CH, INDENT_CH, RIGHT_ALIGN_TYPES, UPPERCASE_TYPES } from '../store/scriptMetrics';
import { ENTER_MAP, TAB_MAP, TYPE_CYCLE, cycleBackward } from '../store/scriptKeys';
import { computeAutocomplete, applyAutocomplete, type AutocompleteState } from '../store/scriptAutocomplete';
import { shouldPromoteToScene, applyAutoContd } from '../store/scriptSmartText';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';
import { copyText } from '../store/clipboard';
import { useDeskLexicon } from '../store/deskLexicon';
import { useActionToast } from './ActionToast';
import { exportPageFiles, exportBinderDocument, exportEverythingDocument } from '../store/pageExport';
import { triggerDownload } from '../store/download';
import { useSessionLog } from './useSessionLog';
import { useWayBack } from './useWayBack';
import { useChromeDissolve } from './useChromeDissolve';
import { useTypewriterFade, CONTAINER_HOLD_BAND } from './useTypewriterFade';
import { useWritingSettings, seedTypewriterDefault, DRAFT_TYPEWRITER_LINE_THRESHOLD } from '../store/writingSettings';
import { countLineEquivalents } from '../store/lineEquivalents';
import { useLexicon } from '../store/themeLexicon';
import { DeskFrame, useDeskFrameViewport } from './DeskFrame';
import { ModeStrip } from './ModeStrip';
import { Sliver, type SliverContent } from './Sliver';
import { Tutor } from './Tutor';
import { GoalGlow } from './GoalGlow';
import { useCascade } from './Cascade';
import type { PageFaceSubject } from './PageFace';
import { PortToBoardSheet } from './PortToBoardSheet';
import { PinToBoardSheet } from './PinToBoardSheet';
import { isScriptEmpty } from '../store/structureConvert';
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
  const location = useLocation();
  const initialEntry = getJournalEntry(id);
  const initialDoc = initialEntry?.script ?? createEmptyScriptDoc();
  // AB1 S1/S2 — DeskFrame owns the viewport at >=1100px only; below that
  // this renders its exact pre-AB1 markup (findings 4 and 5 both live only
  // in the framed branch, since a <1100px script surface is untouched).
  const framed = useDeskFrameViewport();
  const [showPublish, setShowPublish] = useState(false);
  // E1 S2 — the same quiet confirmation line PageEditor.tsx's own Publish
  // dialog uses (ActionToast, reused — not a second pattern).
  const publishToast = useActionToast();
  const { t: dt } = useDeskLexicon();
  // AB2 S4 — the Structure picker's one-way warning (screenplay -> prose;
  // element types don't survive the trip). Switching an empty script is free.
  const [structureConfirm, setStructureConfirm] = useState(false);
  // AB2 S2 DoD — the typewriter option reaches the script surface's Draft
  // posture through the rail; its hold-band targets the SAME bounded
  // scroll-cap the containment fix (finding 4) already gives this surface,
  // so the two behaviors can't fight (container-mode useTypewriterFade, not
  // window-mode — see the `desk-frame-scroll-cap` ref below).
  const scrollCapRef = useRef<HTMLDivElement>(null);
  const writingSettings = useWritingSettings();
  useTypewriterFade({
    enabled: framed && writingSettings.typewriter,
    containerRef: scrollCapRef,
    editorSelector: '.script-el-active',
    // FX3 S3 — the container-mode retune (see useTypewriterFade.ts and
    // ModeStage.tsx's own matching call); Journal's window-scroll call is
    // untouched.
    holdBand: CONTAINER_HOLD_BAND,
  });
  // FX2 S2 — ScriptEditor has no `mode` concept at all; it's always
  // effectively Draft (the brief's own "ScriptEditor's always-drafting
  // posture"), so the Draft-open seed applies unconditionally here, unlike
  // PageEditor.tsx's `mode === 'drafting'` gate. `initialEntry?.text` is
  // the derived shadow persistence.ts's saveScriptDoc keeps in sync with
  // the ScriptDoc on every save (canon §2.4) — as of THIS mount it reflects
  // the doc's line count without needing to serialize `initialDoc` by hand.
  // Captured once via the effect's own closure (empty deps): this
  // component remounts per page (`key={id}`, PageEditor.tsx), so "once per
  // mount" already means "once per page-open," satisfying "mid-session
  // mode switches don't re-evaluate" the same way PageEditor.tsx's own
  // effect does.
  useEffect(() => {
    seedTypewriterDefault(countLineEquivalents(initialEntry?.text ?? '') < DRAFT_TYPEWRITER_LINE_THRESHOLD);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // AB1 S3 — the vanishing law, generalized to the script surface's own
  // DeskFrame chrome (the mode strip; the corner glyph via App.tsx's shared
  // isWriting session). Mounted unconditionally (rootRef omitted -> writes
  // --fade-dur onto <html>, same default every other caller relies on) but
  // only ever actually triggered when framed (see handleInput below) — below
  // the 1100px gate this never dissolves anything, matching pre-AB1
  // behavior exactly (script never had a dissolve engine before this).
  const scriptDissolve = useChromeDissolve({ surface: 'script', editorSelector: '.script-sheet' });

  // W2 — route + mount identity only (S1: element-level state — active index,
  // caret hint — is this surface's own thing; no scroll/caret capture here).
  useWayBack({ entryId: id });

  const [elements, setElements] = useState<ScriptEl[]>(() => flattenScenes(initialDoc.scenes));
  const [activeIndex, setActiveIndex] = useState(0);
  const [caretHint, setCaretHint] = useState<CaretHint>('end');
  const [seedNonce, setSeedNonce] = useState(0);
  const [acIndex, setAcIndex] = useState(0);
  const [acDismissed, setAcDismissed] = useState<string | null>(null);
  // CD1 S7 — the Page face's sending-verb sheets (mirrors PageEditor.tsx's
  // own wiring verbatim; the Screenplay Room never had a Page face before
  // this ticket — Move/Copy/Port-to-Board are genuinely new capability
  // here, same as they were for PageEditor in AB3). B2 S4 — Move/Copy
  // (`addOpen`, AddToSheet) RETIRES: superseded by the Places panel.
  const [portOpen, setPortOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false); // AB4 S2 — "Pin to a Board…" sheet

  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const scenesRef = useRef<Scene[]>(initialDoc.scenes);
  const lastSavedRef = useRef(elements);
  const activeElRef = useRef<HTMLDivElement | null>(null);

  const project: Project | null = initialEntry?.projectId ? getProject(initialEntry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;
  const { t: lex, tMany: lexMany } = useLexicon();

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

  // CD1 S7 — star/tag mutations, mirroring PageEditor.tsx's own
  // patch-based closures (shared via store/persistence.ts's
  // patchJournalEntry so neither host can drift on the "merge live text"
  // discipline). The script's own "live text" is its serialized doc, not
  // ForwardOnlyEditor's textRef — recomputed from the live element/scene
  // state at click-time so a Star tap right after typing can't clobber an
  // unflushed edit (AUTOSAVE_MS is 2000ms).
  const liveScriptText = () => serializeScriptDoc({ v: 1, scenes: groupIntoScenes(elementsRef.current, scenesRef.current) });
  const toggleStar = () => { patchJournalEntry(id, liveScriptText(), { starred: !initialEntry.starred }); flushNow(); };
  const addTag = (tag: string) => {
    const tags = initialEntry.tags ?? [];
    if (!tags.includes(tag)) patchJournalEntry(id, liveScriptText(), { tags: [...tags, tag] });
    flushNow();
  };
  const removeTag = (tag: string) => {
    patchJournalEntry(id, liveScriptText(), { tags: (initialEntry.tags ?? []).filter(t => t !== tag) });
    flushNow();
  };

  // AB4 S2 — every board currently pinning this page, for the truthful
  // "Also pinned to <board>." membership line(s).
  const pinnedBoardTitles = getBoardsPinning(initialEntry.id).map(b => b.title);
  const { homeLabel, memberships } = describePageHome(initialEntry, project, pinnedBoardTitles);
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry: initialEntry,
    homeLabel,
    memberships,
    footer: initialEntry.projectId == null ? 'Saved automatically — even if you never file it to a Drawer or the Shelf.' : undefined,
    onToggleStar: toggleStar,
    onAddTag: addTag,
    onRemoveTag: removeTag,
    onOpenPortToBoard: () => setPortOpen(true),
    onOpenPin: () => setPinOpen(true),
  };

  // CD2 S1/S5/S7 — the cascade, replacing the Drawer whole; mirrors the
  // prose wiring exactly (S7's own standing "mirror the wiring" convention).
  const cascade = useCascade({ subject: pageFaceSubject, project, navigate });

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
    if (framed) scriptDissolve.noteWrite(); // AB1 S3 — see the hook's mount comment above
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

  // copyScriptText is used by BOTH the legacy (<1100px) toolbar's own
  // pre-existing "Copy script text" button (which has no Publish dialog and
  // no toast mounted at all — untouched, per the "legacy unchanged"
  // invariant) AND the framed Publish dialog's "Copy Formatted" button.
  // Left exactly as it always was (fire-and-forget) so the legacy caller's
  // behavior is byte-identical; the framed dialog gets its own confirming
  // wrapper below instead of teaching this shared function about a toast
  // node that doesn't exist on the legacy branch.
  const copyScriptText = () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    copyText(serializeScriptDoc({ v: 1, scenes }));
  };

  // E1 S2 — the framed Publish dialog's own "Copy Formatted", which DOES
  // have a mounted toast: awaits copyText's own success/failure and says
  // so (the same fix/rationale as PageEditor.tsx's own doCopy).
  const publishCopyFormatted = async () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    const ok = await copyText(serializeScriptDoc({ v: 1, scenes }));
    publishToast.show(ok ? dt('publishCopyFormattedConfirm') : dt('publishCopyFailed'));
  };

  // AB2 S5 — "Copy My Words": the writer's own lines, screenplay convention
  // (uppercase sluglines, dialogue-block tightening) stripped back out. Only
  // ever rendered in the framed Publish dialog (no legacy equivalent
  // button exists), so it can safely await + confirm directly.
  const copyMyWords = async () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    const ok = await copyText(plainScriptWords({ v: 1, scenes }));
    publishToast.show(ok ? dt('publishCopyWordsConfirm') : dt('publishCopyFailed'));
  };

  // E1 S3 — the LIVE reconstructed doc (elementsRef/scenesRef), never a
  // stale persisted `entry.script` — matches what Copy already does above,
  // so a download the instant after typing can't lose the keystroke the
  // 2s autosave debounce hasn't flushed yet.
  const flushScriptNow = () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    scenesRef.current = scenes;
    saveScriptDoc(id, { v: 1, scenes });
    lastSavedRef.current = elementsRef.current;
    flushNow();
    return scenes;
  };
  const downloadThisPage = (format: 'md' | 'txt') => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    const liveEntry = { ...initialEntry, script: { v: 1 as const, scenes } };
    const files = exportPageFiles(liveEntry);
    const ok = triggerDownload(`${files.base}.${format}`, format === 'md' ? files.md : files.txt, format === 'md' ? 'text/markdown' : 'text/plain');
    publishToast.show(ok ? dt('publishDownloadConfirm') : dt('publishDownloadFailed'));
  };
  const downloadBinder = () => {
    flushScriptNow();
    if (!project) return;
    const { filename, content } = exportBinderDocument(project);
    const ok = triggerDownload(filename, content, 'text/markdown');
    publishToast.show(ok ? dt('publishDownloadConfirm') : dt('publishDownloadFailed'));
  };
  const downloadEverything = () => {
    flushScriptNow();
    const { filename, content } = exportEverythingDocument();
    const ok = triggerDownload(filename, content, 'text/markdown');
    publishToast.show(ok ? dt('publishDownloadConfirm') : dt('publishDownloadFailed'));
  };

  // AB2 S4 — Structure picker, screenplay -> prose. entry.text (the derived
  // shadow, kept current by every autosave above) IS the prose rendering;
  // adopt it verbatim. Element types do not survive — the one-way warning
  // this gates. Mechanical only: no AI, nothing here rewrites a word.
  const convertToProse = () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    const doc = { v: 1 as const, scenes };
    saveScriptDoc(id, doc); // flush the live doc + its shadow first
    const latest = getJournalEntry(id);
    if (!latest) return;
    saveJournalEntry({ ...latest, pageType: 'manuscript', script: undefined });
  };
  const requestProse = () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    if (isScriptEmpty({ v: 1, scenes })) { convertToProse(); return; }
    setStructureConfirm(true);
  };
  const onSwitchStructure = (next: 'prose' | 'screenplay') => {
    if (next === 'screenplay') return; // already screenplay — nothing to do here
    requestProse();
  };
  const sliverContent: SliverContent = {
    kind: 'draft',
    structure: 'screenplay',
    onSwitchStructure,
  };
  // CD1 S6 — the goal system's live text for this surface: the script's
  // elements read as lines (matches the deterministic hard-newline
  // splitting store/lineEquivalents.ts already does for prose — one
  // element per line is the script's own natural "line" unit).
  const goalText = elements.map(e => e.text).join('\n');

  const title = elements.find(e => e.t === 'scene')?.text.trim() || 'Untitled';
  const backTo = project ? `/project/${project.id}` : '/journal';
  // AB4 S4 — "way back guaranteed" for a page-pin card's double-click
  // travel (BoardEditor.tsx), the same `location.state` precedent PageEditor/
  // JournalEntry use (mirrored from F2's own warm-start signal). Framed-only.
  const fromBoard = (location.state as { fromBoardId?: string } | null)?.fromBoardId ?? null;

  // Draft law only (S1, still true below the AB1 gate) — the Screenplay
  // Room's forward-only mode (script Free-write) is AB2, not this ticket;
  // framed (S2) shows all five ModeStrip strings with Free Write/Revise/
  // Workshop deferred and Draft the only live posture.
  // FX1 S2 — the script sheet's own width is no longer a bare inline
  // maxWidth: it lives inside `.mode-pagecol` (mounted below, in the framed
  // branch only), the SAME paper geometry class/width band prose uses (Law
  // 1). Legacy (<1100px) is untouched — it never wrapped in mode-pagecol and
  // keeps this inline width exactly as before.
  const scriptSheet = (
    <div className="script-sheet" style={{ position: 'relative', maxWidth: framed ? undefined : '60ch' }}>
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
  );

  // CD1 S1/S7 — framed (>=1100px): the mode strip moves to this header row
  // (left-set; top-bar title/crumb retires — the Page face carries it now,
  // S7's new Drawer); ScriptEditor gains the drawer (Page + Places) and the
  // sliver (structure — script's hand tools), mirroring the prose wiring
  // exactly. AB1 S1/S2/S4's containment fix (finding 4) is unchanged —
  // .desk-frame-scroll-cap still gives the sheet a bounded height +
  // internal scroll. "Copy script text" leaves top chrome (S4, unchanged).
  if (framed) {
    return (
      <div className="desk-frame-host" data-chrome-receded={scriptDissolve.dissolved ? 'true' : 'false'}>
        {/* ab1.1 R1 (Fable review) — the nav row was the one piece of framed
            chrome that never recessed with the rest of the room. */}
        <div className="chrome-fade chrome-top sprint-nav">
          <ModeStrip mode="drafting" onSwitch={() => {}} onPublish={() => setShowPublish(true)} freeWriteEnabled={false} />
          <div className="sprint-actions">
            {/* cd1.1 (Fable review erratum) — the Pages/Plan flight toggle
                belongs beside Done on both hosts; a script page IS a "Pages"
                view (PageEditor.tsx's own toggle carries the same semantics). */}
            {project && (
              <div className="sprint-toggle" role="tablist" aria-label={`${lex('binder')} view`}>
                <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active" onClick={() => { flushNow(); navigate(`/project/${project.id}`); }}>{lexMany('page')}</button>
                <button type="button" role="tab" aria-selected="false" className="sprint-toggle-btn" onClick={() => { flushNow(); navigate(`/project/${project.id}/board`); }}>{lex('plan')}</button>
              </div>
            )}
            {fromBoard && (
              <button type="button" className="btn-quiet wz-back-to-board" onClick={() => { flushNow(); navigate(`/page/${fromBoard}`); }}>
                ‹ Back to the board
              </button>
            )}
            <button type="button" className="btn-quiet" onClick={() => { flushNow(); navigate(backTo); }}>Done</button>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <DeskFrame
          pageKind="screenplay"
          strip={cascade.strip}
          cascadeLayers={cascade.layers}
          sliver={<Sliver content={sliverContent} goalText={goalText} />}
          tutor={<Tutor entry={initialEntry} project={project} pageText={goalText} pageKind="screenplay" />}
          goalGlow={<GoalGlow text={goalText} />}
          dissolved={scriptDissolve.dissolved}
        >
          <div ref={scrollCapRef} className="desk-frame-scroll-cap" data-typewriter={writingSettings.typewriter ? 'true' : 'false'}>
            <div className="mode-pagecol">{scriptSheet}</div>
          </div>
        </DeskFrame>

        {portOpen && <PortToBoardSheet sourceIds={[id]} onClose={() => setPortOpen(false)} />}
        {pinOpen && <PinToBoardSheet entryId={id} onClose={() => setPinOpen(false)} />}

        {showPublish && (
          <div className="sprint-modal-backdrop" onClick={() => setShowPublish(false)}>
            <div className="sprint-modal card" role="dialog" aria-label="Publish" onClick={e => e.stopPropagation()}>
              <div className="card-title">Publish</div>
              {/* E1 S4 — download, real and unmissable, ABOVE the (still
                  true) coming-soon line. */}
              <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: '.02em', margin: '12px 0 6px' }}>{dt('publishDownloadTitle')}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <button type="button" className="btn-quiet publish-download-page-md" onClick={() => downloadThisPage('md')}>{dt('publishDownloadPageMd')}</button>
                <button type="button" className="btn-quiet publish-download-page-txt" onClick={() => downloadThisPage('txt')}>{dt('publishDownloadPageTxt')}</button>
                {project && <button type="button" className="btn-quiet publish-download-binder" onClick={downloadBinder}>{dt('publishDownloadBinder')}</button>}
                <button type="button" className="btn-quiet publish-download-everything" onClick={downloadEverything}>{dt('publishDownloadEverything')}</button>
              </div>
              {/* AB2 S5 — copy-out comes home to Publish; "the existing
                  copy-script-text rendering" is Copy Formatted verbatim. */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button type="button" className="btn-quiet publish-copy-words" onClick={copyMyWords}>Copy My Words</button>
                <button type="button" className="btn-quiet publish-copy-formatted" onClick={publishCopyFormatted}>Copy Formatted</button>
              </div>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '0 0 16px' }}>
                {dt('publishComingSoon')}
              </p>
              <button type="button" className="btn-quiet" onClick={() => setShowPublish(false)}>Close</button>
              {publishToast.node}
            </div>
          </div>
        )}

        {structureConfirm && (
          <div className="sprint-modal-backdrop structure-confirm-modal" onClick={() => setStructureConfirm(false)}>
            <div className="sprint-modal card" role="dialog" aria-label="Convert to Prose" onClick={e => e.stopPropagation()}>
              <div className="card-title">Convert to Prose?</div>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '8px 0 16px' }}>
                This is one-way: element types (scene/character/dialogue/…) will not survive the trip — only the
                plain text carries over, verbatim.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-quiet" onClick={() => setStructureConfirm(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn-brass structure-confirm-prose"
                  onClick={() => { setStructureConfirm(false); convertToProse(); }}
                >
                  Convert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
      {scriptSheet}
    </div>
  );
}
