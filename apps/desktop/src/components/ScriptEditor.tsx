import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getJournalEntry, saveScriptDoc, saveJournalEntry, patchJournalEntry, flushNow, getDrawer, getProject, getBoardsConnecting } from '../store/persistence';
import { describePageHome } from '../store/pageHome';
import { flattenScenes, groupIntoScenes, createEmptyScriptDoc, newElement } from '../store/scriptDoc';
import { serializeScriptDoc, plainScriptWords } from '../store/scriptText';
import { INDENT_CH } from '../store/scriptMetrics';
import { lineLedger } from '../store/scriptLedger';
import { paginate, type Page } from '../store/scriptPaginate';
import { ENTER_MAP, TAB_MAP, TYPE_CYCLE, cycleBackward } from '../store/scriptKeys';
import { computeAutocomplete, applyAutocomplete } from '../store/scriptAutocomplete';
import { shouldPromoteToScene } from '../store/scriptSmartText';
import { copyText } from '../store/clipboard';
import { useDeskLexicon } from '../store/deskLexicon';
import { escapeFromEditor, ESC_HINT_ID } from '../store/escapeExit';
import { useActionToast } from './ActionToast';
import { exportPageFiles, exportBinderDocument, exportEverythingDocument } from '../store/pageExport';
import { triggerDownload } from '../store/download';
import { useSessionLog } from './useSessionLog';
import { useWayBack } from './useWayBack';
import { useChromeDissolve } from './useChromeDissolve';
import { useLexicon } from '../store/themeLexicon';
import { DeskFrame, useDeskFrameViewport } from './DeskFrame';
import { ModeStrip } from './ModeStrip';
import { Sliver, type SliverContent } from './Sliver';
import { Tutor } from './Tutor';
import { useSurfaceSelection } from './useSurfaceSelection';
import { GoalGlow } from './GoalGlow';
import { useCascade } from './Cascade';
import type { PageFaceSubject } from './PageFace';
import { PortToBoardSheet } from './PortToBoardSheet';
import { PinToBoardSheet } from './PinToBoardSheet';
import { isScriptEmpty } from '../store/structureConvert';
import { unbornHref } from '../store/unbornPage';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import { TEMPLATE_ORDER, type TemplateKey } from './TemplateSketch';
import { enterPageTypewriter, holdTypewriterPage } from '../store/writingSettings';   // PHASE 1 (S5) / typewriter-scope: per-page typewriter memory
import type { Scene, ScriptEl, ScriptElType, Project } from '../types';
import { LocationCrumb } from './LocationCrumb';
import { wordCount } from '../store/wordCount';
import { getCaretOffset, setCaretOffset } from './script/caret';
import { ActiveScriptElement, AutocompletePopover, type CaretHint, StaticScriptElement, commitElement, textOfPart } from './script/elements';

// S1 — the Screenplay Room: a house-native block editor, one styled block per
// element, ONLY the active element a live contenteditable (the BoardTextBox
// single-live-editable pattern — seed once per edit session, keyed remount).
// The document is edited as a FLAT element array (far simpler than nested
// scene/body arrays mid-edit); a scene boundary is just "the next element
// with t==='scene'" — groupIntoScenes derives the persisted Scene[] shape at
// save time (store/scriptDoc.ts). Anti-Canva in its purest form: no styling
// toolbar, ever — format is semantic, driven entirely by the element type.

const AUTOSAVE_MS = 2000;


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
  // the screenplay surface does not run the typewriter (useTypewriterFade is not called here); the scroll cap is the containment fix and stays [ScriptEditor §5]
  const scrollCapRef = useRef<HTMLDivElement>(null);
  // ITEM 84, TD4 — the selected stretch, read by this surface's owner exactly as
  // PageEditor reads its own, and handed to the Tutor as a plain read-only string.
  // A screenplay page IS a Draft page (this file mounts the Tutor with
  // mode="drafting" unconditionally), so the Draft roster renders here too and TD4
  // must have a real stretch to point at — a chip gated on a value this surface
  // never supplied would be permanently disabled, which is the one thing the
  // brief's transient gate is not. `true` rather than a mode test for the same
  // reason: there is no other mode to be in here.
  const scriptSelection = useSurfaceSelection('.script-sequence', true);
  // Screenplay pages follow prose Draft's per-page typewriter rule (read once at mount, written on every toggle); the stored value drives the toggle and the drawer, not a fade [ScriptEditor §6]
  useEffect(() => {
    enterPageTypewriter(id, !initialEntry?.script || isScriptEmpty(initialEntry.script));
    return holdTypewriterPage(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // no typewriter seed here (it writes the shared setting, and would flip prose's); the vanishing law reaches the script surface's own chrome, triggered only when framed [ScriptEditor §7]
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
  // SC2 S5 — where the writer's caret ACTUALLY is, as against `caretHint`, which
  // is where the last ACTIVATION put it. Keyed by element id + seedNonce so it
  // can only ever be spent on a remount of the very same edit session; a genuine
  // activation carries a different key and falls through to the hint.
  const liveCaret = useRef<{ key: string; offset: number } | null>(null);

  // SC2 S2b — the projection. Derived from `elements` and nothing else, so it is
  // recomputed exactly when the document changes and not when the caret hint,
  // the autocomplete index or a dialog's open flag does. (This is NOT S5's
  // memoization — that one is React.memo on the element components, and the
  // seam for it is the frozen style objects and the delegated activation
  // handler, both already in place above.)
  const pages: Page[] = useMemo(() => {
    const projected = paginate(lineLedger(elements));
    // A screenplay is never nought pages: an empty document is one blank sheet.
    return projected.length ? projected : [{ index: 0, placed: [], linesUsed: 0 }];
  }, [elements]);

  // Document index by element id. The projection preserves document order, so a
  // running counter would also work — but it would be a counter whose
  // correctness depended on the traversal order of two nested maps, and this
  // cannot be got wrong by a later edit.
  const docIndexById = useMemo(() => {
    const m = new Map<string, number>();
    elements.forEach((el, i) => { if (!m.has(el.id)) m.set(el.id, i); });
    return m;
  }, [elements]);

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
  const pinnedBoardTitles = getBoardsConnecting(initialEntry.id).map(b => b.title);
  const { homeLabel, memberships } = describePageHome(initialEntry, project, pinnedBoardTitles);
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry: initialEntry,
    homeLabel,
    memberships,
    footer: undefined,
    onToggleStar: toggleStar,
    onAddTag: addTag,
    onRemoveTag: removeTag,
    onOpenPortToBoard: () => setPortOpen(true),
    onOpenPin: () => setPinOpen(true),
  };

  // CD2 S1/S5/S7 — the cascade, replacing the Drawer whole; mirrors the
  // prose wiring exactly (S7's own standing "mirror the wiring" convention).
  const cascade = useCascade({ subject: pageFaceSubject, project, navigate });

  // ITEM 104 (THIRD) — SAME INVARIANT AS PageEditorView: every hook above, the
  // decision below. This guard used to sit ~40 lines up, ABOVE `useCascade`, so
  // a render where the page had gone missing produced one fewer hook than the
  // render before it and React threw "Rendered fewer hooks than expected".
  //
  // Found by a repo-wide census rather than by this crash: PageEditorView was
  // the surface that was reported, but ScriptEditor carried the identical fault
  // — and it is the room the doorway now sends writers INTO, so fixing only the
  // reported one would have moved the crash rather than removed it. (The census
  // found one other, `JournalEntryView`, on a surface that has been unrouted
  // since FX14; it is left alone and recorded rather than touched.)
  if (!initialEntry) return null;

  const moveActive = (nextIndex: number, hint: CaretHint) => {
    setActiveIndex(nextIndex);
    setCaretHint(hint);
    setSeedNonce(n => n + 1);
    setAcDismissed(null);
  };

  const noteCaret = () => {
    const node = activeElRef.current;
    const el = elements[activeIndex];
    if (!node || !el) return;
    liveCaret.current = { key: `${el.id}:${seedNonce}`, offset: getCaretOffset(node) };
  };

  const retype = (nextType: ScriptElType) => {
    setElements(prev => prev.map((e, i) => (i === activeIndex ? { ...e, t: nextType } : e)));
  };

  const handleInput = (text: string) => {
    noteFirstKeystroke();
    noteCaret();
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
    // A1 (accessibility audit): this surface takes Tab too (it cycles the element type), so it gets the page's exit - Esc moves
    // focus to the current mode tab, after the autocomplete above or any other open popup has closed first (store/escapeExit.ts).
    if (escapeFromEditor(e.nativeEvent, e.currentTarget)) return;

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
        // `text` is read from the live DOM, the ground truth of what is typed right now [ScriptEditor §9]
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

  // one delegated handler reads the DOCUMENT index off the DOM, so it cannot drift from the flat element array; a press below the last element activates it with the caret at its end [ScriptEditor §10]
  const activateLastAtEnd = () => {
    const last = elements.length - 1;
    if (last < 0) return;
    const domText = activeElRef.current?.textContent;
    setElements(prev => commitElement(
      domText != null ? prev.map((el, i) => (i === activeIndex ? { ...el, text: domText } : el)) : prev,
      activeIndex,
    ));
    moveActive(last, 'end');
  };
  const onSequenceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement | null)?.closest?.('.script-el[data-doc-index]');
    if (!target) {
      // presses anywhere else are unchanged: only a press on bare paper LOWER than the last element's bottom edge is handled here - never one on
      // the autocomplete list (it renders just below the active element, which may be the last) or any other control
      if ((e.target as HTMLElement | null)?.closest?.('.script-autocomplete, button, input, textarea, select, a, [role="option"], [role="listbox"]')) return;
      const els = e.currentTarget.querySelectorAll('.script-el[data-doc-index]');
      const lastEl = els.length ? (els[els.length - 1] as HTMLElement) : null;
      if (lastEl && e.clientY > lastEl.getBoundingClientRect().bottom) activateLastAtEnd();
      return;
    }
    const index = Number(target.getAttribute('data-doc-index'));
    if (!Number.isInteger(index) || index < 0 || index >= elements.length) return;
    activateAt(index, e.clientX, e.clientY);
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
  const applyTemplate = (key: TemplateKey) => {
    if (key === 'screenplay') return;
    const template = key === 'blank' ? undefined : key;
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    if (isScriptEmpty({ v: 1, scenes })) {
      saveScriptDoc(id, { v: 1 as const, scenes });
      const latest = getJournalEntry(id);
      if (!latest) return;
      saveJournalEntry({
        ...latest, pageType: 'manuscript', script: undefined,
        pageSettings: { ...(latest.pageSettings ?? PAGE_SETTINGS_FALLBACK), template },
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    flushScriptNow(); flushNow();
    const href = unbornHref({ origin: initialEntry?.origin === 'journal' ? 'journal' : 'loose', binderId: initialEntry?.projectId ?? null, template: template ?? null });
    navigate(href, { state: { fromBoardId: id, fromBoardTitle: (liveScriptText().trim().split('\n')[0] || 'Untitled').slice(0, 40), openedByTemplate: true } });
  };
  const onSwitchStructure = (next: 'prose' | 'screenplay') => {
    if (next === 'screenplay') return; // already screenplay — nothing to do here
    requestProse();
  };
  const sliverContent: SliverContent = {
    kind: 'draft',
    // this page's own id, so the Sliver's formatLocked and toggle read typewriterForPage, never the shared mirror [ScriptEditor §11]
    pageId: id,
    pageEmpty: !initialEntry?.script || isScriptEmpty(initialEntry.script),
    structure: 'screenplay',
    onSwitchStructure,
    // Screenplay is the current choice here (pressing it changes nothing); another template converts an EMPTY screenplay in place, and opens a new page from one with words [ScriptEditor §12]
    templates: TEMPLATE_ORDER.map((key) => ({
      key,
      label: dt(({ blank: 'templateBlank', screenplay: 'templateScreenplay', outline: 'templateOutline', title: 'templateTitlePage', bibliography: 'templateBibliography' } as const)[key]),
      selected: key === 'screenplay',
      onApply: () => applyTemplate(key),
    })),
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
  // PW1 S4(ii) — THE CHIP NAMES THE SURFACE ACTUALLY LEFT. `fromBoardTitle`
  // has been carried on this very state object since BoardEditor's own travel
  // (`state: { fromBoardId: id, fromBoardTitle: title }`) and was never read:
  // the chip said "Back to the board" to everyone. A writer who reached this
  // surface through the RAIL never stood on a board, and sending them somewhere
  // they have never been is the destination-blind verb the Card pass named as
  // the enemy (CA1). The title is a plain read; the fallback keeps every
  // pre-existing caller's wording byte-identical.
  const fromBoardTitle = (location.state as { fromBoardTitle?: string } | null)?.fromBoardTitle ?? null;
  // PAGE TEMPLATES - a template pick that opened this page sets this: the chip reads "Opened as a new page · Back" (the words never moved).
  const openedByTemplate = (location.state as { openedByTemplate?: boolean } | null)?.openedByTemplate === true;

  // Draft law only (S1, still true below the AB1 gate) — the Screenplay
  // Room's forward-only mode (script Free-write) is AB2, not this ticket;
  // framed (S2) shows all five ModeStrip strings with Free Write/Revise/
  // Workshop deferred and Draft the only live posture.
  // FX1 S2 — the script sheet's own width is no longer a bare inline
  // maxWidth: it lives inside `.mode-pagecol` (mounted below, in the framed
  // branch only), the SAME paper geometry class/width band prose uses (Law
  // 1). Legacy (<1100px) is untouched — it never wrapped in mode-pagecol and
  // keeps this inline width exactly as before.
  // SC1 S1 — and now legacy's inline width goes too. `maxWidth:'60ch'` capped
  // the sheet at the TEXT MEASURE (6.0in) where the page itself is 8.5in, so
  // the legacy paper was a page's measure with a page's margins crammed
  // inside it — the same "no page, only furniture" defect the framed branch
  // had, wearing an inline style instead of a missing one. The page's
  // geometry is single-sourced in `.script-sheet` now (index.css) and applies
  // to BOTH branches; an inline maxWidth here would be the one thing able to
  // override it. Legacy's markup shape is otherwise unchanged (no DeskFrame,
  // no `.mode-pagecol`, still `.script-page` — fx7.mjs S1's own assertion).
  //
  // SC2 S2b — THE SHEET SEQUENCE. The surface stops being one sheet that grows
  // and becomes a sequence of true 11in pages: `paginate(lineLedger(elements))`
  // projects the document into pages, and each page renders one `.script-sheet`.
  //
  // THE ELEMENTS ARRAY IS STILL THE EDIT MODEL; PAGES ARE ONLY A PROJECTION.
  // Nothing about pagination is stored, put in state, or persisted — it is
  // recomputed from `elements` and thrown away, which is what makes it unable to
  // drift (store a page array and the first edit above it makes every later page
  // a lie). It is also what makes the count viewport-invariant by construction:
  // no width, font or DOM measurement is an input to the arithmetic, so the same
  // document cannot paginate differently at 1100px and 2200px. A page count that
  // moves with the window is a clock that lies.
  //
  // Page NUMBERS are not here: they are S4's slice (R1), and nothing in SC2
  // shows an aggregate count anywhere.
  const scriptSheet = (
    <div className="script-sequence" onClick={onSequenceClick}>
      {/* A1: the Esc hint, said to a screen reader and never drawn. Rendered ONCE here, outside every `.script-sheet` and absolutely
          positioned, so it is never a sheet's first child (`.script-sheet > *:first-child` takes the page's top margin away) and never
          takes the sequence's flex gap. aria-describedby on the active element finds it by id. */}
      <span id={ESC_HINT_ID} className="wz-sr-only">{dt('pageEscHint')}</span>
      {pages.map((page) => (
        <div className="script-sheet" data-page-index={page.index} style={{ position: 'relative' }} key={page.index}>
          {/* the page number lives on the page artifact only (top margin, from page two, "2."), never a total anywhere; it is chrome outside the 54-line block, so it costs no counted line [ScriptEditor §13] */}
          {page.index > 0 && <div className="script-page-number">{page.index + 1}.</div>}
          {page.placed.map((p) => {
            const i = docIndexById.get(p.entry.id);
            const el = i === undefined ? undefined : elements[i];
            if (!el || i === undefined) return null;
            if (i === activeIndex) {
              // THE ONE LIVE BLOCK, AND ITS ONE STATED EXCEPTION. A
              // contenteditable cannot be cut in half, so an active element the
              // projection splits renders WHOLE on the page where it begins and
              // its continuation parts are skipped. The bound is exact and
              // small: it applies only while the caret is inside an ACTION
              // block longer than a full page (54 lines, ~3,200 characters),
              // and only to that one element. Everything else on every page,
              // and that element itself the moment the caret leaves it, renders
              // the projection exactly. Stated rather than hidden — the
              // alternative was to let pagination depend on where the caret is,
              // which would move the page count as the writer clicked around.
              if (p.continuedFrom) return null;
              return (
                <Fragment key={`${el.id}:${seedNonce}:wrap`}>
                  <ActiveScriptElement
                    key={`${el.id}:${seedNonce}`}
                    el={el}
                    docIndex={i}
                    sessionKey={`${el.id}:${seedNonce}`}
                    liveCaret={liveCaret}
                    noteCaret={noteCaret}
                    caretHint={caretHint}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    elRef={activeElRef}
                  />
                  {/* rendered as the active element's flow-sibling, so its absolute position resolves beneath this block wherever it sits [ScriptEditor §14] */}
                  {acVisible && ac && <AutocompletePopover state={ac} index={acIndex} indentCh={INDENT_CH[el.t]} />}
                </Fragment>
              );
            }
            return (
              <StaticScriptElement
                key={p.continuedFrom ? `${el.id}:@${p.lineOffset}` : el.id}
                el={el}
                text={textOfPart(el, p)}
                docIndex={i}
                continues={p.continues}
                continuedFrom={p.continuedFrom}
              />
            );
          })}
        </div>
      ))}
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
        {/* the nav row recedes with the rest of the framed chrome [ScriptEditor §15] */}
        <div className="chrome-fade chrome-top sprint-nav">
          {/* the address line: the same LocationCrumb the Page uses, in the board's row shape, so the framed surfaces cannot drift [ScriptEditor §16] */}
          <LocationCrumb entry={initialEntry} project={project} drawer={drawer} title={title} />
          {/* ITEM 112-A — `reviseEnabled={false}` for the SAME reason
              `freeWriteEnabled={false}` is already here: this surface is Draft
              law only (S1) and its `onSwitch` is a no-op, so a live Revise tab
              would be a posture that does nothing when pressed. Revise flashes
              coming-soon here, exactly as Free Write does. The screenplay
              surface is byte-identical to pre-112-A in every other respect. */}
          <ModeStrip mode="drafting" onSwitch={() => {}} onPublish={() => setShowPublish(true)} freeWriteEnabled={false} reviseEnabled={false} />
          <div className="sprint-actions">
            {/* the Pages/Plan toggle sits beside Done: a script page is a Pages view [ScriptEditor §17] */}
            {project && (
              <div className="sprint-toggle" role="tablist" aria-label={`${lex('binder')} view`}>
                {/* CD4 S2 — the elder "Plan" flight tab (→ the legacy StructureBoard) is
                    retired on the script page bar too, same as PageEditor's — the legacy
                    beats control is dormant everywhere (secondary access stays; data
                    grandfathered). The script bar carries no PLAN → door, so it now holds
                    just "Pages". */}
                <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active" onClick={() => { flushNow(); navigate(`/project/${project.id}`); }}>{lexMany('page')}</button>
              </div>
            )}
            {fromBoard && (
              <button type="button" className="btn-quiet wz-back-to-board" aria-label={openedByTemplate && fromBoardTitle ? `Back to ${fromBoardTitle}` : undefined} onClick={() => { flushNow(); navigate(`/page/${fromBoard}`); }}>
                {openedByTemplate ? `‹ ${dt('templateOpenedNewBack')}` : fromBoardTitle ? `‹ Back to ${fromBoardTitle}` : '‹ Back to the board'}
              </button>
            )}
          </div>
        </div>

        <div style={{ height: 16 }} />

        <DeskFrame
          pageKind="screenplay"
          strip={cascade.strip}
          cascadeLayers={cascade.layers}
          sliver={<Sliver content={sliverContent} goalText={goalText} />}
          tutor={<Tutor entry={initialEntry} project={project} pageText={goalText} pageKind="screenplay" mode="drafting" selectionText={scriptSelection} />}
          goalGlow={<GoalGlow text={goalText} />}
          dissolved={scriptDissolve.dissolved}
        >
          <div ref={scrollCapRef} className="desk-frame-scroll-cap" data-typewriter="false">
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
        </div>
      </div>

      <div style={{ height: 16 }} />

      {/* Draft law only (S1) — no ModeSwitcher/ModeStage on this surface; the
          Screenplay Room's forward-only mode (script Free-write) is S4. */}
      {scriptSheet}
    </div>
  );
}
