import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { flushNow, getDrawer, getJournalEntry, getProject, saveJournalEntry, patchJournalEntry, getBoardsConnecting, inJournalView, getOrCreatePlanBoard } from '../store/persistence';
import { setPageDress } from '../store/pageDress';
import { pageTypeStyle, ensureFaceLoaded } from '../store/fontRoster';
import { PAGE_SIZE_DEFAULT, PAGE_PT_FALLBACK } from '../store/fontSize';
import { describePageHome } from '../store/pageHome';
import { LocationCrumb } from '../components/LocationCrumb';
import { FluxReadouts } from '../components/FluxReadouts';
import { firstLine } from '../store/entryText';
import { ForwardOnlyEditor, type EditorMode } from '../components/ForwardOnlyEditor';
import { useSurfaceSelection } from '../components/useSurfaceSelection';
import { ModeSwitcher } from '../components/ModeSwitcher';
import { ModeStage, PEN_INKS } from '../components/ModeStage';
import { InkStratum, type InkPen, type InkPermission } from '../components/InkStratum';
import { INK_DEFAULT_PEN } from '../store/ink';
import { useWarmStart } from '../components/useWarmStart';
import { useSessionLog } from '../components/useSessionLog';
import { UnbornProvider, useUnborn } from '../components/UnbornSurface';
import { unbornHref } from '../store/unbornPage';
import { TEMPLATE_ORDER, type TemplateKey } from '../components/TemplateSketch';
import { outlineNextRowPrefix, outlineShift } from '../store/outlineText';
import { isTitlePageText } from '../store/titlePage';
import { TitlePageSheet } from '../components/TitlePageSheet';
import { useWayBack } from '../components/useWayBack';
import { setCaretOffset, setSelectionOffsets, getCaretOffset, getSelectionOffsets, rangeFromPlainOffsets } from '../store/caretOffset';
import type { Stroke } from '../types';
import { projectMilestones } from '../store/milestones';
import { copyText } from '../store/clipboard';
import { buildPageActions } from '../store/pageActions';
import { BoardEditor } from '../components/BoardEditor';
import { ScriptEditor } from '../components/ScriptEditor';
import { useLexicon } from '../store/themeLexicon';
import { useDeskLexicon } from '../store/deskLexicon';
import { useActionToast } from '../components/ActionToast';
import { exportPageFiles, exportBinderDocument, exportEverythingDocument } from '../store/pageExport';
import { triggerDownload } from '../store/download';
import { DeskFrame, useDeskFrameViewport } from '../components/DeskFrame';
import { ModeStrip } from '../components/ModeStrip';
import { Sliver, CAPTURE_ITEMS, type SliverContent } from '../components/Sliver';
import { Tutor } from '../components/Tutor';
import { GoalGlow } from '../components/GoalGlow';
import { DeskInstrument } from '../components/DeskInstrument';
import { useCascade } from '../components/Cascade';
import type { PageFaceSubject } from '../components/PageFace';
import type { JournalEntry, PageKindSetting, PageSettings, StoredFace, StyleGuide } from '../types';
import { PAGE_KIND_DEFAULT, PAGE_SETTINGS_FALLBACK, STYLE_GUIDE_DEFAULT } from '../types';
import { PortToBoardSheet } from '../components/PortToBoardSheet';
import { PinToBoardSheet } from '../components/PinToBoardSheet';
import { useForwardLock, setForwardLock } from '../store/forwardLock';
import { applyFormat, marksAt, headingLevelAt, stripMarkdownConventions, applyFontPick, fontFaceAt, clearFontSpans, applySizePick, fontSizeAt, clearSizeSpans, type FormatAction } from '../store/draftFormat';
import { hiddenMarkEditingFor } from '../store/hiddenMarksEditing';
import { createTabChord, type TabAct } from '../store/tabChord';
import { escapeFromEditor, ESC_HINT_ID } from '../store/escapeExit';
import { BLOCK_TOKEN, MARK_OF, type MarkKind } from '../store/markRuns';
// card-held-italic: the strip's button for a held mark, read off the ONE reader's own table (`**` -> bold, `*` -> italic, ...)
const MARK_KIND: Record<string, MarkKind> = Object.fromEntries(Object.entries(MARK_OF).map(([k, m]) => [m, k as MarkKind]));
import { decorateEditorFor, decorateMarkdownForCard, readEditorPlainText } from '../store/draftDecoration';
import { editorPlainText, writeRows } from '../store/lineRows';
import { getRegisteredUndoStack } from '../store/textUndo';
import { proseTextToScriptDoc, isProseEmpty } from '../store/structureConvert';
import { serializeScriptDoc } from '../store/scriptText';
import { getFirstRunComplete, setFirstRunComplete } from '../store/firstRun';
import { setFirstRunGateActive } from '../store/firstRunGateActive';
import { useMonotonicWordCount, FirstRunVeil, FirstRunGateBanner, FirstRunGlow } from '../components/FirstRunGate';
import { UnlockCeremony } from '../components/UnlockCeremony';
import type { ThemeId } from '../store/theme';
import { enterPageTypewriter, holdTypewriterPage, typewriterForPage } from '../store/writingSettings';   // PHASE 1 (S5) / typewriter-scope: per-page typewriter memory
import { countLineEquivalents } from '../store/lineEquivalents';

import { registerFlush } from '../store/flushRegistry';
import { celebrateReturnChip } from '../store/deckRewards';
import { wordCount } from '../store/wordCount';

/** W5 - the glow for a page born from a step: a STABLE ref callback (one function for the module), so a re-render never re-fires it; celebrateReturnChip itself is once-per-element. */
const glowStepChip = (el: HTMLElement | null): void => { if (el) celebrateReturnChip(el); };

// HB1 F1 — the gate's fixed instrument: 100 whitespace-delimited words.
const FIRST_RUN_WORD_TARGET = 100;

// B1 Slice 3 — the manuscript page editor. A binder Page (a JournalEntry with
// projectId set) opens in the mode-aware editor (Free write / Draft / Format),
// operating on the PAGE's text — never the project's single `sprintText` body.
// This is what makes "write a book" work without touching the legacy body-vs-page
// debt: new Books/Stories live entirely as project + chapter Pages.
//
// The mode-aware editor (ModeStage + ForwardOnlyEditor) is generic — it takes
// initialText + reports clean derived text up — so the page just autosaves that
// to entry.text. Switching modes re-seeds with the current CLEAN text (struck
// runs excluded), exactly as the sprint surface does.

const AUTOSAVE_MS = 2000;


// ITEM 104 (THIRD) — a stable stand-in for a page that is not there.
//
// It exists ONLY so the render can reach the end of its hook list. Nothing it
// contains is ever shown: the guard below `useCascade` returns a redirect before
// any of it paints. It is frozen so a stray write announces itself loudly
// instead of silently mutating a shared object.
const MISSING_ENTRY = Object.freeze({
  id: '', text: '', projectId: null, source: 'page',
  createdAt: '1970-01-01T00:00:00.000Z', updatedAt: '1970-01-01T00:00:00.000Z',
}) as unknown as JournalEntry;

function PageEditorView({ id }: { id: string }) {
  const navigate = useNavigate();
  const { t: lex, tMany: lexMany } = useLexicon();
  const { t: dt } = useDeskLexicon();
  // AB1 S1 — DeskFrame owns the viewport at >=1100px only; below that this
  // component's legacy JSX (byte-identical to pre-AB1) renders instead. See
  // docs/wrizo-alpha/ab1-shell-inventory.md.
  const framed = useDeskFrameViewport();
  // non-null only while this surface has no row yet; every use below reads "if this page is still unborn", so the born path is the ordinary one, and `entry` resolves from the unborn slot meanwhile [PageEditor §1]
  const unborn = useUnborn(id);
  // ITEM 104 (THIRD) — `entry` MUST NOT be able to change this component's HOOK
  // COUNT. `realEntry` is the truth; `entry` is a never-null stand-in so every
  // hook below runs unconditionally, and the vanished-page decision happens
  // AFTER the last hook (see the guard below `useCascade`). See that guard for
  // the full mechanism.
  const realEntry = getJournalEntry(id);
  const entry = realEntry ?? MISSING_ENTRY;
  const project = entry?.projectId ? getProject(entry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;
  // ITEM 83 M3 (R6) — publish THIS page's dress so the sheet wears it (the
  // paper is the preview). Cleared on unmount so a page with no settings can
  // never inherit the last page's margins — an undressed page must render
  // exactly as it did before M3, and a stale dress would break that quietly.
  useEffect(() => {
    setPageDress(entry?.pageSettings ?? null);
    return () => setPageDress(null);
  }, [entry?.id, entry?.pageSettings]);
  // ITEM 207 — the page's own face and size. Both are ABSENT on a page that never chose, and then `typeStyle` is
  // empty and the editor's style below is the one it always had (byte-identical). A face other than the eager three
  // is fetched when a page that uses it OPENS (here) or when the writer chooses it (the Type control).
  const pageFace = entry?.pageSettings?.face;
  const typeStyle = pageTypeStyle(pageFace, entry?.pageSettings?.size);
  useEffect(() => { void ensureFaceLoaded(pageFace?.name); }, [pageFace?.name]);
  // M1 — null on any plan-less project (Journal pages never reach this
  // surface at all); ModeStage silently degrades Progress:Project to Words
  // when this is null, per the canon's no-greyed-states rule.
  const milestones = projectMilestones(id);

  // Per-page last-used mode. Default: a manuscript chapter opens in Free
  // write (forward-only generation); other untyped support pages open in
  // Draft (free edit). CD1 S8 (A7) — a LOOSE-origin page (the Desk's
  // start-writing/home-base door, origin==='loose' only — no pageType is
  // ever stamped there) ALSO opens in Free Write, matching the front-door
  // posture; this is deliberately narrower than "any untyped page" — a
  // filed-but-untyped support page (origin 'journal'/'project'/null) still
  // opens in Draft, unchanged.
  // ITEM 112-A (§2's S0 check, answered and recorded in
  // docs/menus/tutor/item112a-s0.md) — MODE PERSISTS PER PAGE, under this key,
  // written on every switch and read once at mount behind the allowlist below.
  // Revise is ADMITTED TO THAT RULE and given no rule of its own: no new key, no
  // new default, no new lifetime. The allowlist is the whole mechanism, and that
  // is exactly why it had to change — a stored 'revise' not named here falls
  // through to the DEFAULT, so Revise would have silently forgotten itself on
  // every reload while Draft remembered. The default expression is untouched:
  // nothing opens INTO Revise, which is the brief's "no new entry point" holding
  // — a writer reaches Revise by the strip, and only ever returns to it because
  // they themselves left the page in it.
  const modeKey = `wrizo-mode-page-${id}`;
  const [mode, setMode] = useState<EditorMode>(() => {
    const saved = localStorage.getItem(modeKey);
    if (saved === 'journal' || saved === 'drafting' || saved === 'revise') return saved;
    // W2: a page opened by "Write this" is written FOR a card, in Free Write (birth() leaves the device its own `journal` mark, so a reload agrees)
    return entry?.pageType === 'manuscript' || entry?.origin === 'loose' || unborn?.descriptor.graft ? 'journal' : 'drafting';
  });

  // ITEM 84, TD4 — the selected stretch, read HERE (this surface's owner) and
  // handed to the Tutor as a plain read-only string. The panel gets text, never a
  // reference: A13 says it may hold no editor ref and no text setter, and the
  // build brief's §5 names the prop as the lawful shape. Gated on Draft because
  // that is the only mode whose roster can ask about a selection — Free Write
  // does no listening at all, and a selection drag fires per character.
  const draftSelection = useSurfaceSelection('.forward-only-editor', mode === 'drafting');


  const initialText = entry?.text ?? '';
  const [text, setText] = useState(initialText);
  const [modeSeed, setModeSeed] = useState(initialText);
  const [receded, setReceded] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showPublish, setShowPublish] = useState(false); // Publish stub dialog (matches QuickSprint)
  // E1 S2 — Publish's own quiet confirmation line (the existing ActionToast
  // pattern, reused per the brief's own "don't invent a new one" instruction).
  const publishToast = useActionToast();
  // AB2 S2 — ink color, lifted out of ModeStage so the sliver (CD1:
  // components/Sliver.tsx, a DeskFrame sibling) can control it; ModeStage
  // falls back to its own internal state when this isn't passed
  // (unframed/below-the-gate, untouched).
  const [penColor, setPenColor] = useState(PEN_INKS[0]);

  // Free Write is a typewriter for text and a sketch pad for drawing; `instrument` is which one the page is now. TEXT by default and not persisted (session-scoped): a page that remembered INK would open unable to type. [PageEditor §2]
  const [instrument, setInstrument] = useState<'text' | 'ink'>('text');
  // The page's ink, seeded from the row. Held in state (not read from `entry`
  // each render) for the same reason the Journal holds it: the stratum owns
  // the paint loop and a re-seed mid-stroke would fight it.
  const [strokes, setStrokes] = useState<Stroke[]>(() => getJournalEntry(id)?.strokes ?? []);
  // I4 — the drawer's "current pen", last-used, session-scoped like the mode.
  const [inkPen, setInkPen] = useState<InkPen>(INK_DEFAULT_PEN);
  const [eraserArmed, setEraserArmed] = useState(false);
  const inkSheetRef = useRef<HTMLDivElement>(null);

  // what this mode lets the writer do to the page's ink, derived from mode and instrument, never stored: Free Write is `edit` in INK and `inert` in TEXT; Draft and Revise are `movable`. The ternary reaches `movable` only past `mode === 'journal'`, so Free Write can never acquire it by accident. [PageEditor §3]
  const inkPermission: InkPermission =
    mode === 'journal' ? (instrument === 'ink' ? 'edit' : 'inert') : 'movable';

  // persist strokes, merging the LIVE text so a pending typed run is never clobbered (Free Write's text autosave is debounced). An unborn page has no row and a stroke is content: the row is written WITH the ink in one synchronous act (`birthWith`), never created empty first; an ink-only page is not empty. [PageEditor §4]
  const persistStrokes = (next: Stroke[]) => {
    setStrokes(next);
    if (unbornRef.current) {
      if (next.length === 0) return; // nothing drawn, nothing to be born for
      unbornRef.current.birthWith({ text: textRef.current, strokes: next });
      return;
    }
    const latest = getJournalEntry(id);
    if (!latest) return;
    saveJournalEntry({ ...latest, text: textRef.current, strokes: next });
  };

  // Entering INK puts the typewriter down: the editable is blurred, so the
  // caret is visibly dormant and keystrokes have nowhere to type. Leaving INK
  // does NOT auto-focus — the writer taps to resume, which is the same
  // "restored but blurred" rule the Journal's own stroke hardening uses, and
  // it keeps a mode flip from stealing focus out from under a click.
  useEffect(() => {
    if (instrument !== 'ink') return;
    const el = inkSheetRef.current?.querySelector<HTMLElement>('.forward-only-editor');
    try { el?.blur(); } catch { /* */ }
    try { window.getSelection()?.removeAllRanges(); } catch { /* */ }
  }, [instrument]);
  const forwardLock = useForwardLock();
  // ITEM 121 I6 (R15) — Free Write's Bold/Italic/Underline bracket state and
  // `applyFreeWriteFormat` are GONE with the STYLING zone that drove them.
  // The mechanism they used (Draft's FORMAT_MARK conventions and
  // ForwardOnlyEditor's `insertMarkerRef` escape hatch) is Draft's and stays;
  // only this surface's door onto it closes. See Sliver.tsx's I6 comment.
  // AB2 S4 — the Structure picker's one-time confirmation (prose page with
  // words -> screenplay). Switching an empty page is free (no modal).
  const [structureConfirm, setStructureConfirm] = useState(false);
  // AB3 S2 — the Page face's sending verbs. Genuinely new capability here
  // (PageEditor never had Move/Copy or Port-to-Board before this ticket —
  // "everything about a page" now includes typed/filed pages too, not just
  // the Journal's own authored surface). B2 S4 — Move/Copy (`addOpen`,
  // AddToSheet) RETIRES: superseded by the Places panel.
  const [portOpen, setPortOpen] = useState(false);
  // AB4 S2 — Pin, the fourth sending verb.
  const [pinOpen, setPinOpen] = useState(false);

  const textRef = useRef(text);
  textRef.current = text;
  // PB1 — the live unborn handle, read from inside effect closures (flush, the
  // unmount teardown) that would otherwise capture a stale `unborn` from the
  // render in which they were created. Nulls itself at birth, so every guard
  // below stops applying the instant the row exists.
  const unbornRef = useRef(unborn);
  unbornRef.current = unborn;
  const lastSavedRef = useRef(initialText);
  const editorRef = useRef<HTMLDivElement>(null);
  // TOOLS #14-r3: the size box's HELD highlight (see holdSizeSelection below). A hook, so it lives up here with the others, above the vanished-page early return - r2 put it below that return (hooks-order-ast red)
  const heldSelRef = useRef<{ start: number; end: number } | null>(null);
  // ITEM 122 — the Draft rail's active state. Read from the DOM caret rather
  // than threaded through a new prop: `editorRef` is already the editor's own
  // host div here (the same one `applyCaret` writes through), and
  // `getCaretOffset` is the shared reader every other caret path uses, so this
  // adds no plumbing and cannot disagree with the caret the formatter acts on.
  const [draftMarks, setDraftMarks] = useState({ bold: false, italic: false, underline: false, strike: false });
  // the caret line's heading level, and where the small floating +/- sits while a heading is selected [PageEditor §5]
  const [headingLevel, setHeadingLevel] = useState<number | null>(null);
  const [headingPop, setHeadingPop] = useState<{ x: number; y: number } | null>(null);
  // FONT-SPAN: whether words are highlighted on the page, and their face - the Typeface section's scope and brass read it
  const [fontSel, setFontSel] = useState<{ has: boolean; face: string | null | 'mixed'; size: number | null | 'mixed' }>({ has: false, face: null, size: null });   // and its size [PageEditor §6]
  // ITEM 121 I6 — FX7 S2's rail-driven marker-insertion escape hatch is gone
  // with the STYLING zone that was its only caller. ForwardOnlyEditor's
  // `insertMarkerRef` PROP is deliberately left standing: it is that shared
  // component's own seam, not this surface's chrome, and reaching into a
  // component three other hosts render to delete an API nobody currently
  // passes is past what R15 chartered. Disclosed in the offer as a now-unused
  // seam rather than swept on this lane's authority.
  // ITEM 158 — THE SEAM ITEM 121 LEFT STANDING FINALLY HAS A CALLER. The note
  // above records `insertMarkerRef` as a now-unused prop kept because it is
  // ForwardOnlyEditor's own seam rather than this surface's chrome. Free
  // Write's Tab is its first legitimate user: the editor sets it to its OWN
  // input path in forward-only mode (and to null in Draft), so a tab inserted
  // through it travels exactly the road a typed character does — persisted,
  // undone and decorated by the same machinery, with no second write path.
  const insertMarkerRef = useRef<((text: string) => void) | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Warm start (F2) — captured once at mount (the hook strips the one-shot state).
  const location = useLocation();
  const warmRef = useRef(!!(location.state as { warmStart?: boolean } | null)?.warmStart);
  const warmWrapRef = useRef<HTMLDivElement>(null);
  const warm = useWarmStart(warmRef.current, editorRef, warmWrapRef);

  // HB1 S2/S3 — the first-run gate. Captured once at mount, the exact same
  // one-shot-navigation-state pattern as warmRef above (components/
  // Arrival.tsx's Write door sets this only on the page it just created,
  // only during first run) — never re-armed by a later reload of this same
  // page (location.state doesn't survive a reload; F3 rules that as an
  // accepted edge case, not a resume feature this ticket builds) and never
  // true on any OTHER page. F4 — framed (>=1100px) only; below the gate the
  // ref may be true but nothing ever reads it (legacy JSX stays untouched).
  const firstRunGateRequested = useRef(
    !!(location.state as { firstRunGate?: boolean } | null)?.firstRunGate && !getFirstRunComplete(),
  );
  const [gateUnlocked, setGateUnlocked] = useState(false);
  // ITEM 122 — recompute on `selectionchange`, which is the ONLY event that
  // fires for every way a caret can move: typing, clicking, arrow keys, and the
  // programmatic moves the formatter itself makes. Listening to keyup or click
  // instead would leave the buttons lying after any of the others — which is
  // precisely the "stuck highlight" complaint this item exists to answer, and
  // it would be embarrassing to reintroduce it while fixing it.
  useEffect(() => {
    if (mode !== 'drafting') return;
    // The heading line the floating +/- sits beside, as plain offsets from the last full recompute. A scroll changes nothing the recompute derives, so it only re-places the pop, while one is shown, at most once a frame (the full recompute reads the whole page's innerText, and the typewriter scrolls on every line). [PageEditor §7]
    let popLine: { ls: number; le: number } | null = null;
    let raf = 0;
    const place = (ls: number, le: number) => {
      const el = editorRef.current;
      if (!el) return;
      const lineRange = rangeFromPlainOffsets(el, ls, le);
      const rects = lineRange ? [...lineRange.getClientRects()].filter(r => r.width > 0) : [];
      if (rects.length === 0) { setHeadingPop(null); return; }
      const last = rects[rects.length - 1];
      const col = el.getBoundingClientRect();
      const POP_W = 56;
      setHeadingPop(last.right + 8 + POP_W <= col.right
        ? { x: Math.round(last.right + 8), y: Math.round(last.top + (last.height - 24) / 2) }
        : { x: Math.round(col.left - POP_W - 8), y: Math.round(rects[0].top + (rects[0].height - 24) / 2) });
    };
    const recompute = () => {
      const el = editorRef.current;
      if (!el) return;
      const offset = getCaretOffset(el);
      const plain = editorPlainText(el);   // TYPING-LATENCY: the rows' shadow text (today's innerText read when it cannot be trusted)
      const lit = offset == null ? { bold: false, italic: false, underline: false, strike: false } : marksAt(plain, offset);
      // A held italic (an empty italic is not stored - store/draftFormat.ts) lights I while the caret is where it will be typed.
      const held = hiddenMarkEditingFor(el)?.pendingMark();
      if (held && !held.exit && held.mark === '*' && offset === held.at) lit.italic = true;
      // card-held-italic: a style pressed OFF at its run's end is unlit while the caret waits there (the next letter will be plain)
      if (held && held.exit && offset === held.at) { const k = MARK_KIND[held.mark]; if (k) lit[k] = false; }
      setDraftMarks(lit);
      const level = offset == null ? null : headingLevelAt(plain, offset);
      setHeadingLevel(level);
      // FONT-SPAN: a highlight on the page, and the face of its words (the same selectionchange that lights B and I)
      {
        const fs = window.getSelection();
        const ranged = !!fs && fs.rangeCount > 0 && !fs.isCollapsed && !!fs.anchorNode && !!fs.focusNode && el.contains(fs.anchorNode) && el.contains(fs.focusNode);
        const fo = ranged ? getSelectionOffsets(el) : null;
        const lo = fo ? Math.min(fo.start, fo.end, plain.length) : 0;
        const hi = fo ? Math.min(Math.max(fo.start, fo.end), plain.length) : 0;
        const next = fo && hi > lo ? { has: true, face: fontFaceAt(plain, lo, hi), size: fontSizeAt(plain, lo, hi) } : { has: false, face: null, size: null };
        setFontSel((prev) => (prev.has === next.has && prev.face === next.face && prev.size === next.size ? prev : next));
      }
      // The floating +/-: shown only while a selection sits on a heading line, placed where it never covers a word (past the heading's last line, else in the column's left margin); a fixed overlay, so the page never moves. [PageEditor §8]
      const sel = window.getSelection();
      const o = level !== null && sel && !sel.isCollapsed ? getSelectionOffsets(el) : null;
      if (!o) { popLine = null; setHeadingPop(null); return; }
      const ls = plain.lastIndexOf('\n', Math.max(0, o.start - 1)) + 1;
      let le = plain.indexOf('\n', o.start);
      if (le === -1) le = plain.length;
      popLine = { ls, le };
      place(ls, le);
    };
    // A scroll anywhere (the page's own scroller included): no recompute - only the shown pop is re-placed, once per frame.
    const onScroll = () => {
      if (!popLine || raf) return;
      raf = requestAnimationFrame(() => { raf = 0; if (popLine) place(popLine.ls, popLine.le); });
    };
    document.addEventListener('selectionchange', recompute);
    window.addEventListener('scroll', onScroll, true);
    recompute();
    return () => {
      document.removeEventListener('selectionchange', recompute);
      window.removeEventListener('scroll', onScroll, true);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mode, text]);

  const gateActive = framed && firstRunGateRequested.current && !gateUnlocked;
  const gateWords = useMonotonicWordCount(text, gateActive);
  const gateReached = gateActive && gateWords >= FIRST_RUN_WORD_TARGET;

  useEffect(() => {
    setFirstRunGateActive(gateActive);
    return () => setFirstRunGateActive(false);
  }, [gateActive]);

  const handleChooseTheme = (themeId: ThemeId) => {
    void themeId; // setTheme already applied by UnlockCeremony itself
    setFirstRunComplete(true);
    setGateUnlocked(true);
  };

  // F5 — TTFK session for this chapter/support page. projectId carries the binder;
  // firstKeystroke rides the same onForward seam as the warm release below.
  const noteSessionKeystroke = useSessionLog('page', {
    projectId: () => entry?.projectId ?? null,
    words: () => wordCount(textRef.current),
    // PB1 — a page that was never born leaves no session row: telemetry for a
    // room nobody entered is its own litter. The keystroke that BIRTHS the page
    // is still measured, because by the time this getter runs at teardown the
    // page has a row and `unbornRef` has nulled itself.
    enabled: () => !unbornRef.current,
  });

  // the Draft-open typewriter is decided once at mount (empty deps freeze `mode` and `initialText`; the component remounts per page, so a mode switch within one mount never re-runs it); an EMPTY page opens with the typewriter OFF, having no lines to follow [PageEditor §9]
  const typewriterEnteredRef = useRef(false);   // PHASE 1 (S5): has this mount read the page's typewriter memory yet?
  useEffect(() => {
    if (mode === 'drafting') { enterPageTypewriter(id, initialText.trim().length === 0); typewriterEnteredRef.current = true; }   // PHASE 1 (S5): read once at mount; replaces the line-count seed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {   // PHASE 1 (S5): a toggle on this Draft page writes ITS memory; a page opened in Free Write reads it the FIRST time it reaches Draft
    if (mode !== 'drafting') return undefined;
    if (!typewriterEnteredRef.current) { typewriterEnteredRef.current = true; enterPageTypewriter(id, textRef.current.trim().length === 0); }
    return holdTypewriterPage(id);
  }, [mode, id]);

  // W2 — the way back. Scroll lives on ModeStage's internal .mode-scroll box
  // (surfaceRef is the .mode-page ancestor the host already owns); caret
  // lives on the ForwardOnlyEditor host div (editorRef). Mode itself is
  // already restored independently via the per-page localStorage key above —
  // this hook doesn't need to touch it.
  useWayBack({
    entryId: id,
    // PB1 — an unborn page is not a place to be returned to: it has no row, so
    // a return chip pointing at it would resolve to nothing. Reuses the option
    // B1 already added for system boards rather than inventing a second way to
    // opt out.
    participatesInWayBack: !unborn,
    mode,
    scrollEl: () => surfaceRef.current?.querySelector<HTMLElement>('.mode-scroll') ?? null,
    editorEl: () => editorRef.current,
    applyScrollY: y => { const el = surfaceRef.current?.querySelector<HTMLElement>('.mode-scroll'); if (el) el.scrollTop = y; },
    applyCaret: offset => { if (editorRef.current) setCaretOffset(editorRef.current, offset); },
  });

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    setModeSeed(textRef.current); // carry the current clean text into the new mode
    setMode(next);
    localStorage.setItem(modeKey, next);
  };

  // Persist the page text to its JournalEntry (debounced), merging the latest
  // record so other metadata is never clobbered.
  // PB1 — an unborn page has no row to merge into, and must not gain one here:
  // birth is `onTextChange` below, which is SYNCHRONOUS and carries the first
  // word with it. If this ran on an unborn page it would write an empty row on
  // the debounce and re-create the litter this ticket removes.
  const flush = () => {
    if (unbornRef.current) return;
    const latest = getJournalEntry(id);
    if (latest && latest.text !== textRef.current) {
      saveJournalEntry({ ...latest, text: textRef.current });
      lastSavedRef.current = textRef.current;
    }
  };

  // PB1 — THE FIRST WORD. The birth trigger, and the one place the local-first
  // invariant is at stake: the row is written WITH this text in the same
  // synchronous call (store/unbornPage.ts's `birth`), never created empty and
  // filled in afterwards. So the first keystroke reaches disk on exactly the
  // path and the schedule every later keystroke does — the existing debounced
  // flush, offline included — and there is no window in which it exists only in
  // memory that did not already exist for every other keystroke in the app.
  //
  // Fires on the first NON-EMPTY text: a keystroke that leaves the page empty
  // (typing a space then deleting it, an IME composition that resolves to
  // nothing) has produced no word, and a page is born when it has a word.
  const onTextChange = (next: string) => {
    setText(next);
    if (unbornRef.current && next.trim()) {
      lastSavedRef.current = next;
      unbornRef.current.birthWith({ text: next });
    }
  };

  useEffect(() => {
    if (text === lastSavedRef.current) return;
    const h = setTimeout(flush, AUTOSAVE_MS);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, id]);

  // Flush on tab hide / unmount.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') { flush(); flushNow(); } };
    document.addEventListener('visibilitychange', onHide);
    // LOGOUT FLUSH — a sign-out flushes this page's pending text first, so it is counted as unsaved.
    const unregisterFlush = registerFlush(flush);
    return () => {
      unregisterFlush();
      document.removeEventListener('visibilitychange', onHide);
      flush();
      flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This hook sits ABOVE the early return below (the hooks-order guards enforce it); its body reads `applyFormatAt`, defined below, safely, since an effect runs after render, and its deps carry `!!realEntry` so the listener attaches once the editor mounts. Tab indents through draftFormat's own indent (a leading tab), the same formatter as the rail's arrows, so a key and a click cannot drift apart. It is a state machine (store/tabChord.ts): each Tab tap is one more first-line level, Shift+Tab one back, Tab held + 1 one whole-paragraph level per press; a tap applies on release, and a quick Tab-then-1 types its 1. Draft and Revise act everywhere; Free Write is forward-only, so it acts on a BLANK line only and never outdents. Capturing Tab costs a keyboard-only writer Tab-out; Escape leaves the surface (store/escapeExit.ts). While an Outline is in Draft it owns Tab and this machine stands aside (a ref, read at press time). [PageEditor §10]
  const outlineKeysRef = useRef(false);
  outlineKeysRef.current = mode === 'drafting' && realEntry?.pageSettings?.template === 'outline';
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const blankHere = (): boolean => {
      const caret = getCaretOffset(el);
      if (caret == null) return false;
      const t = textRef.current;
      const lineStart = t.lastIndexOf('\n', Math.max(0, caret - 1)) + 1;
      const lineEnd = t.indexOf('\n', caret);
      return t.slice(lineStart, lineEnd === -1 ? t.length : lineEnd).trim().length === 0;   // words already here: the tab would land behind the caret
    };
    const chord = createTabChord((shift) => mode !== 'journal' || (!shift && blankHere()));
    const perform = (act: TabAct) => {
      if (mode === 'drafting' || mode === 'revise') { applyFormatAt(act); return; }
      if (mode !== 'journal') return;
      if (act === 'outdent' || act === 'block-outdent') return;   // an outdent is a deletion; forward-only forbids it
      if (!blankHere()) return;
      insertMarkerRef.current?.(act === 'block-indent' ? BLOCK_TOKEN : '\t');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // A1 (accessibility audit): Tab indents here, so Esc is the way OUT - to the current mode tab, after any open popup has
      // closed on its own Esc (store/escapeExit.ts). Every mode, the same key.
      if (escapeFromEditor(e, el)) return;
      if (outlineKeysRef.current && !typewriterForPage(id, textRef.current.trim().length === 0)) return;   // PAGE TEMPLATES: the Outline's own Tab (onLensKey) acts instead; typewriter-scope: THIS page's own value, never the shared mirror
      const step = chord.keydown(e);
      if (step.preventDefault) e.preventDefault();
      step.acts.forEach(perform);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (outlineKeysRef.current && !typewriterForPage(id, textRef.current.trim().length === 0)) return;
      const step = chord.keyup(e);
      if (step.preventDefault) e.preventDefault();
      step.acts.forEach(perform);
    };
    const onBlur = () => chord.reset();
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('blur', onBlur);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('blur', onBlur);
      window.removeEventListener('keyup', onKeyUp, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, !!realEntry]);

  // ITEM 104 HOTFIX — THESE TWO HOOKS LIVE ABOVE THE GUARD BELOW, DELIBERATELY.
  //
  // React counts hooks per render. Any hook below an early return runs a
  // DIFFERENT number of times depending on whether that return fired, and the
  // moment `entry` flips the count changes and React throws #300 ("rendered
  // fewer hooks than expected") — blanking the tree. The effect body still
  // reads `requestScreenplay`, defined far below: safe, because an effect body
  // runs AFTER the render function has finished, by which time that const is
  // initialised. Only the REGISTRATION has to be unconditional, and now it is.
  const structureDoorRef = useRef(false);
  useEffect(() => {
    if (structureDoorRef.current) return;
    if (!unbornRef.current) return;
    if (unbornRef.current.descriptor.structure !== 'screenplay') return;
    structureDoorRef.current = true;
    requestScreenplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Exit lands where the page lives: its binder, the Journal if journal-
  // homed, else the Shelf (B2 S3 — the legacy `shelved` flag retires from
  // this read too: T3/inJournalView's own pinned-law verdict decides now,
  // not the dormant flag — a project-origin page un-filed via Places, or a
  // legacy grandfathered row, both correctly land here instead of the
  // Journal). AB3 — a loose-origin page (the Desk's home-base door) homes
  // NOWHERE, not the Journal (it was never nudged there) — Done returns to
  // the Desk instead.
  const backTo = project ? `/project/${project.id}` : inJournalView(entry) ? '/journal' : entry.origin === 'loose' ? '/' : '/shelf';
  // AB4 S4 — "way back guaranteed" for a page-pin card's double-click
  // travel (BoardEditor.tsx). Mirrors F2's warm-start precedent (above,
  // `location.state`) — a one-shot navigation signal, read once at render
  // and NOT stripped (a stable navigational chip, unlike warmStart's
  // one-time glow, is fine to persist across in-session back/forward).
  // Framed-only, matching the invariant that legacy (<1100px) stays
  // byte-identical — only the `if (framed)` branch below reads this.
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
  // W2 - a page born by "Write this" came from a STEP: the same chip, naming the Deck, with the step on its title ("Three-Act · Midpoint"); the way back is the Deck's own memory (its view and its place in the Walk - device-local) and the
  // way-back slot (the caret in the card). `fromStepLabel` is also what marks the chip as the step's, for the W5 glow.
  const fromStepLabel = (location.state as { fromStepLabel?: string } | null)?.fromStepLabel ?? null;
  // PAGE TEMPLATES - set by a template pick that opened THIS page (the words never moved): the chip then reads "Opened as a new page · Back".
  const openedByTemplate = (location.state as { openedByTemplate?: boolean } | null)?.openedByTemplate === true;
  const pageTitle = text.trim() ? firstLine(text).slice(0, 40) : 'Untitled';

  // the durable-relationship doors: pairing, porting and pinning outlive the visit, so they birth the page FIRST and then act on the real row, as one act: no dangling pointer, no orphan [PageEditor §11]
  const withBirth = (act: (pageId: string) => void) => () => {
    if (unbornRef.current) { const born = unbornRef.current.birthWith({ text: textRef.current }); act(born.id); return; }
    act(id);
  };

  // PLAN → : births the page, then mints the board, then pairs. Ruling 2's own
  // fixed order — getOrCreatePlanBoard writes planBoardId back onto the PAGE,
  // so the page must exist before the board is minted or the pointer would have
  // nothing to live on.
  const openPlanBoard = withBirth((pageId) => {
    flush(); flushNow();
    const board = getOrCreatePlanBoard(pageId);
    if (board) navigate(`/page/${board.id}`);
  });

  // AB3 S2 — star/tag mutations, new capability on this surface (mirrors
  // JournalEntry.tsx's own patch-based closures, now shared via
  // patchJournalEntry so both hosts can't drift on the "merge live text"
  // discipline).
  const toggleStar = () => { patchJournalEntry(id, textRef.current, { starred: !entry.starred }); flushNow(); };
  const addTag = (tag: string) => {
    const tags = entry.tags ?? [];
    if (!tags.includes(tag)) patchJournalEntry(id, textRef.current, { tags: [...tags, tag] });
    flushNow();
  };
  const removeTag = (tag: string) => {
    patchJournalEntry(id, textRef.current, { tags: (entry.tags ?? []).filter(t => t !== tag) });
    flushNow();
  };

  // AB3 S2 — the Page face's subject (canon amendment A1). `entry` here is
  // the render-time snapshot (re-fetched on every getJournalEntry(id) call
  // elsewhere in this component); star/tag edits above trigger the same
  // persistence-change re-render every other write in this app already
  // relies on (App.tsx's reactive-screens subscription), so the face reads
  // fresh values on the next render without any extra plumbing here.
  // AB4 S2 — every board currently pinning this page, for the truthful
  // "Also pinned to <board>." membership line(s).
  const pinnedBoardTitles = getBoardsConnecting(entry.id).map(b => b.title);
  const { homeLabel, memberships } = describePageHome(entry, project, pinnedBoardTitles);
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry,
    homeLabel,
    memberships,
    // the framed Page panel has no footer line [PageEditor §12]
    footer: undefined,
    // PB1 — ABSENT while unborn. patchJournalEntry resolves nothing to merge
    // into for a page with no row, so these would silently no-op: a star that
    // does not stick is the definition of half-work. They return the moment the
    // page has a word.
    onToggleStar: unborn ? undefined : toggleStar,
    onAddTag: unborn ? undefined : addTag,
    onRemoveTag: unborn ? undefined : removeTag,
    // ITEM 133 (A) — the name is reachable, and reaching it lands the caret at
    // the END of the first line: the writer arrives where they would type to
    // change the title, not at character zero where a keystroke would push the
    // name rightwards. Guarded on the editor actually being mounted, so the
    // gesture is offered only when there is a caret to place.
    onReachName: () => {
      const el = editorRef.current;
      if (!el) return;
      const firstLineEnd = (textRef.current.split('\n')[0] ?? '').length;
      el.focus();
      // PLACE THE CARET AFTER THE SURFACE SETTLES, not in the same tick as
      // the focus. `focus()` lets the editor run its OWN caret placement,
      // which collapses to the container's END (see ForwardOnlyEditor's note
      // on the trailing-newline-at-EOF state) — and that placement lands
      // AFTER a synchronous setCaretOffset, silently overwriting it.
      // MEASURED, NOT GUESSED: the harness read offset 35 on a 16-character
      // first line, which is the end of the whole text. This is the same law
      // that governs reading — a probe reads the settled state — applied to
      // WRITING: do not place a caret into a surface still arranging itself.
      requestAnimationFrame(() => {
        if (editorRef.current) setCaretOffset(editorRef.current, firstLineEnd);
      });
    },
    onOpenPortToBoard: withBirth(() => setPortOpen(true)),
    onOpenPin: withBirth(() => setPinOpen(true)),
  };

  // CD2 S1/S5 — the cascade, replacing the Drawer whole. One hook call
  // shares state between the strip (a DeskFrame grid track) and the
  // reach/survey layers (a DeskFrame stage overlay) — see Cascade.tsx's own
  // header comment for why a hook, not a component, is the right shape
  // here.
  const cascade = useCascade({ subject: pageFaceSubject, project, navigate });

  // ITEM 104 (THIRD) — THE GUARD LIVES BELOW THE LAST HOOK, DELIBERATELY.
  //
  // React counts hooks per render. While this check sat ABOVE `useCascade`, a
  // render in which `entry` was missing produced ONE FEWER HOOK than the render
  // before it, and React threw "Rendered fewer hooks than expected" — blanking
  // the tree. Two earlier passes did not close it: lifting this ticket's own two
  // hooks left `useCascade` behind, and moving the decision into the DISPATCHERS
  // only helps when the PARENT re-renders — a child-local re-render of this
  // component never re-runs the parent, so the parent guard is not consulted.
  // The invariant has to hold HERE: every hook above, the decision below.
  //
  // WHAT MADE `entry` VANISH, measured: `UnbornProvider` registers the unborn
  // slot during RENDER (a `useMemo`, so children see it on their first render)
  // but tears it down in an EFFECT CLEANUP. Those lifecycles differ. React 18
  // StrictMode simulates unmount/remount by cycling EFFECTS while PRESERVING
  // memo state — so the cleanup clears the slot, the memo does not re-run, and
  // the next render finds nothing. That is why this reproduces on a DEV serve
  // and not on a production bundle (StrictMode's double-invoke is dev-only),
  // which is also what reconciled the two desks' disagreeing cold-load reports.
  // The slot lifecycle is worth fixing on its own; this guard makes the crash
  // impossible either way.
  if (!realEntry) return <Navigate to="/" replace />;

  // The template picker (Sliver, Templates; Draft and later strips, never Free Write): Blank, Screenplay, Outline, Title Page, Bibliography. The host owns the act: an EMPTY page (no words, no ink) takes the choice in place; a page WITH words or ink never moves, and the choice opens a NEW page in the same home, whose chip reads "Opened as a new page · Back". Pressing the current choice changes nothing. A template is a lens set through patchPageSettings, as `kind` is; on an unborn page it rides the address. [PageEditor §13]
  const currentTemplate: TemplateKey = entry.pageSettings?.template ?? 'blank';
  const openTemplatePage = (template: Exclude<TemplateKey, 'blank' | 'screenplay'> | null, structure: 'screenplay' | null = null) => {
    flush(); flushNow();
    const href = unbornHref({
      origin: entry.origin === 'journal' ? 'journal' : 'loose',
      binderId: entry.projectId ?? null,
      structure,
      template,
    });
    navigate(href, { state: { fromBoardId: id, fromBoardTitle: pageTitle, openedByTemplate: true } });
  };
  const applyTemplate = (key: TemplateKey) => {
    if (key === currentTemplate) return;
    const empty = wordCount(textRef.current) === 0 && !(entry.strokes && entry.strokes.length > 0);
    if (key === 'screenplay') { if (empty) requestScreenplay(); else openTemplatePage(null, 'screenplay'); return; }
    const template = key === 'blank' ? null : key;
    if (!empty) { openTemplatePage(template); return; }
    if (unbornRef.current) { navigate(unbornHref({ ...unbornRef.current.descriptor, template }), { replace: true }); return; }
    patchPageSettings({ template: template ?? undefined });
  };
  const TEMPLATE_TERM = { blank: 'templateBlank', screenplay: 'templateScreenplay', outline: 'templateOutline', title: 'templateTitlePage', bibliography: 'templateBibliography' } as const;
  const pageTemplates = TEMPLATE_ORDER.map((key) => ({ key, label: dt(TEMPLATE_TERM[key]), selected: key === currentTemplate, onApply: () => applyTemplate(key) }));

  // The editor's own render-prop body — identical between the legacy and the
  // AB1-framed ModeStage instance, factored out so the two branches below
  // can't drift.
  const editorBody = ({ noteWrite, penColor }: { noteWrite: () => void; penColor?: string }) => (
    <div
      /* ITEM 121 I2 — THIS DIV IS THE SHEET. It is the scroller's own content
         wrapper: already position:relative, already full width, and it GROWS
         with the editor, so an absolutely positioned canvas at inset:0 covers
         the whole scrollable page and scrolls WITH the text as one sheet.
         `.mode-page` could not serve — it is a fixed-height window
         (min(60vh,580px), overflow:hidden) whose inner `.mode-scroll` does the
         scrolling, so a canvas there would nail the ink to the viewport and
         let screen two's ink land on screen one's. See InkStratum.tsx's own
         header and item121-s0-survey.md §3. */
      ref={el => { warmWrapRef.current = el; inkSheetRef.current = el; }}
      className="wz-ink-sheet"
      style={{ position: 'relative', width: '100%', minHeight: '100%' }}
    >
      {titleSheet ? (
        <TitlePageSheet
          key={`${id}-title`}
          text={text}
          autoFocus={initialText.trim() === ''}
          onChange={onTextChange}
          onForward={() => { noteWrite(); warm.release(); noteSessionKeystroke(); }}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); flush(); }}
        />
      ) : (
      <ForwardOnlyEditor
        key={`${id}-${mode}`}
        ref={editorRef}
        insertMarkerRef={insertMarkerRef}
        initialText={modeSeed}
        mode={mode}
        autoFocus={initialText.trim() === ''}
        onChange={onTextChange}
        onFormatKey={mode === 'drafting' ? applyRailFormat : undefined}
        lens={lensActive}
        onLensKey={applyLensKey}
        onForward={() => { noteWrite(); warm.release(); noteSessionKeystroke(); }}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); flush(); }}
        placeholder=""
        ariaLabel="Page writing surface"
        ariaDescribedBy={ESC_HINT_ID}
        penColor={penColor}
        forwardLock={mode === 'journal' ? forwardLock : true}
        style={{
          width: '100%', minHeight: '100%', color: 'var(--ink-on-paper)',
          fontFamily: typeStyle.fontFamily ?? 'var(--font-prose)',
          // scales with --paper-scale so the editor's type grows with the paper (the measure is the constant, not the pixel width); it reaches the contenteditable by inheritance (ForwardOnlyEditor spreads this style on its outer wrap). A page's default is 12 real points in page units (index.css --wz-pt). [PageEditor §14]
          fontSize: typeStyle.fontSize ?? `calc(${PAGE_SIZE_DEFAULT} * var(--wz-pt, ${PAGE_PT_FALLBACK}))`, lineHeight: 1.7,
        }}
      />
      )}
      {/* A1: said to a screen reader, never drawn (1px, clipped) - so it cannot move or resize the page. AFTER the editor, never
          the sheet's first child, so no first-child rule can ever take it for the page. */}
      <span id={ESC_HINT_ID} className="wz-sr-only">{dt('pageEscHint')}</span>
      {warm.rect && (
        <div
          aria-hidden="true"
          className={`wz-warm${warm.settled ? ' wz-warm--settled' : ''}`}
          style={{ position: 'absolute', top: warm.rect.top, left: warm.rect.left, width: warm.rect.width, height: warm.rect.height }}
        />
      )}
      {/* the ink stratum paints OVER the text (a later sibling: ink under type would be hidden). It renders in every mode, since the ink is the page's, framed only (below 1100px the page keeps its pre-ink terms). Mode varies permission, not presence (`inkPermission`); both canvases stay pointer-events:none and routing belongs to the sheet. [PageEditor §15] */}
      {framed && (
        <InkStratum
          permission={inkPermission}
          sheetRef={inkSheetRef}
          strokes={strokes}
          onCommit={persistStrokes}
          pen={inkPen}
          eraserArmed={eraserArmed}
        />
      )}
    </div>
  );

  // The rail's Bold/Italic/Heading/Spacing tools act on entry.text directly (markdown conventions, no separate rich-text state): read the selection by linear offset (store/caretOffset.ts), transform (store/draftFormat.ts), then re-decorate through ForwardOnlyEditor's own guarded helper (decorateEditorFor), never a bare innerHTML write, which would bring back Chromium's trailing-newline caret quirk; a rail click and a keystroke leave the same state. One implementation, two gates: `applyRailFormat`'s `mode !== 'drafting'` guard keeps a leaked Revise rail inert, so each caller brings its own scope (the rail Draft-only, Tab in Draft and Revise). [PageEditor §16]
  const applyFormatAt = (action: FormatAction) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = getSelectionOffsets(el) ?? { start: textRef.current.length, end: textRef.current.length };
    const result = applyFormat(textRef.current, sel.start, sel.end, action);
    // A pending mark (an empty italic cannot be stored as `**`): nothing is written; the editor wraps the next text typed here.
    // card-held-italic: the style pressed off at its run's end - nothing is written; the editor types what comes next outside the run
    if (result.exitPending) {
      hiddenMarkEditingFor(el)?.setPendingExit(result.exitPending, result.start);
      const k = MARK_KIND[result.exitPending];
      if (k) setDraftMarks(m => ({ ...m, [k]: false }));
      return;
    }
    if (result.pending) {
      hiddenMarkEditingFor(el)?.setPending(result.pending, result.start);
      // light the button now: the press moved no caret, so no selectionchange will recompute it
      if (result.pending === '*') setDraftMarks(m => ({ ...m, italic: true }));
      return;
    }
    // FX6 S1 — a rail Bold/Italic/Heading/Spacing click is a genuine edit
    // that bypasses the contenteditable's own input events entirely (a
    // direct programmatic decorate, same as this function always did) — so
    // it must record its OWN atomic step into ForwardOnlyEditor's own undo
    // stack (registered on this SAME `el`, store/textUndo.ts's own
    // registry — see that file's header comment for why a click here
    // can't just close over a local ref, unlike BoardCardPopup's own
    // applyBoardFormat), or the click would be invisible to undo entirely.
    // Always atomic: a format toggle never coalesces with anything else.
    getRegisteredUndoStack(el)?.record({ text: result.text, caret: result.start }, 'atomic');
    setText(result.text);
    // STEP 2: a marked SELECTION stays selected (so the same press can undo itself), and while a range is selected no marker
    // pair is revealed - the reveal belongs to a caret.
    const collapsed = result.end <= result.start;
    // TYPING-LATENCY: on the rows only the changed lines are rewritten (store/lineRows.ts), with the same reveal rule
    if (!writeRows(el, result.text, result.start, collapsed ? result.start : null)) decorateEditorFor(el, result.text, result.start, setCaretOffset, t => decorateMarkdownForCard(t, collapsed ? result.start : null));
    if (!collapsed) setSelectionOffsets(el, result.start, result.end);
  };
  // a face for the HIGHLIGHTED words only, by a format press's road: one atomic undo step, the same decorator, the highlight left on the same words [PageEditor §17]
  const applyFontAt = (slug: string | null) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = getSelectionOffsets(el);
    if (!sel || sel.start === sel.end) return;
    const cur = textRef.current;
    const result = applyFontPick(cur, Math.min(sel.start, cur.length), Math.min(sel.end, cur.length), slug);
    if (result.text !== cur) {
      getRegisteredUndoStack(el)?.record({ text: result.text, caret: result.start }, 'atomic');
      setText(result.text);
      // through the rows, as a format press is: a bare decorateEditorFor replaced the rows' DOM behind the row model's back, so the highlight and the face were lost [PageEditor §18]
      if (!writeRows(el, result.text, result.start, null)) decorateEditorFor(el, result.text, result.start, setCaretOffset, t => decorateMarkdownForCard(t, null));
    }
    setSelectionOffsets(el, result.start, result.end);
    setFontSel({ has: true, face: fontFaceAt(result.text, result.start, result.end), size: fontSizeAt(result.text, result.start, result.end) });
  };
  // a size for the HIGHLIGHTED words only, by the face's road (one atomic undo step, through the rows); the size box holds the highlight while it has focus (a text field takes the page's selection), so a typed size reaches the words that were highlighted [PageEditor §19]
  const holdSizeSelection = (): boolean => { const el = editorRef.current; const s = el ? getSelectionOffsets(el) : null; if (!s || s.start === s.end) return false; heldSelRef.current = s; return true; };
  const applySizeAt = (points: number) => {
    const el = editorRef.current;
    if (!el) return;
    // the held highlight is read BEFORE the editor takes focus back: that focus blurs the size box, and its blur lets the held range go
    const held = heldSelRef.current;
    el.focus();
    const sel = held ?? getSelectionOffsets(el);
    if (!sel || sel.start === sel.end) return;
    const cur = textRef.current;
    const result = applySizePick(cur, Math.min(sel.start, cur.length), Math.min(sel.end, cur.length), points);
    if (result.text !== cur) {
      getRegisteredUndoStack(el)?.record({ text: result.text, caret: result.start }, 'atomic');
      setText(result.text);
      if (!writeRows(el, result.text, result.start, null)) decorateEditorFor(el, result.text, result.start, setCaretOffset, t => decorateMarkdownForCard(t, null));
    }
    setSelectionOffsets(el, result.start, result.end);
    setFontSel({ has: true, face: fontFaceAt(result.text, result.start, result.end), size: fontSizeAt(result.text, result.start, result.end) });
  };
  // the whole-document SIZE pick: the spans' sizes go (the faces stay), one undo step, through the rows [PageEditor §20]
  const clearSizeSpansOnPage = () => {
    const el = editorRef.current;
    if (!el || (mode !== 'drafting' && mode !== 'revise')) return;
    const cur = textRef.current;
    const next = clearSizeSpans(cur);
    if (next === cur) return;
    const caret = Math.min(getCaretOffset(el) ?? next.length, next.length);
    getRegisteredUndoStack(el)?.record({ text: next, caret }, 'atomic');
    setText(next);
    if (!writeRows(el, next, caret, null)) decorateEditorFor(el, next, caret, setCaretOffset, t => decorateMarkdownForCard(t, null));
  };
  const clearFontSpansOnPage = () => {
    const el = editorRef.current;
    if (!el || (mode !== 'drafting' && mode !== 'revise')) return;
    const cur = textRef.current;
    const next = clearFontSpans(cur);
    if (next === cur) return;
    const caret = Math.min(getCaretOffset(el) ?? next.length, next.length);
    getRegisteredUndoStack(el)?.record({ text: next, caret }, 'atomic');
    setText(next);
    // TYPING-LATENCY x FONT-SPAN: through the rows (the same repair as applyFontAt's)
    if (!writeRows(el, next, caret, null)) decorateEditorFor(el, next, caret, setCaretOffset, t => decorateMarkdownForCard(t, null));
  };
  // PAGE TEMPLATES - THE LENS (docs/plans/page-templates.md section 1). An Outline or a Bibliography is the page's ordinary text drawn through one more wrapper
  // (store/draftDecoration.ts lensHtml, in the one decoration funnel); it applies in Draft and Revise, never in Free Write's forward-only runway. The Outline also
  // owns three keys in Draft: Tab / Shift+Tab change the level of the rows the selection touches (clamped, store/outlineText.ts), Enter opens the next row at the
  // same level. Each is ONE atomic undo step, written through the same road a format press takes. Typewriter still blocks them, as it blocks the Format group.
  // The Title Page is not a lens on the flowing editor: in Draft its five fields are a small structured editor over the same text (components/TitlePageSheet.tsx),
  // mounted only while the text parses as a Title Page (otherwise the page draws as plain Draft text and nothing is lost). Free Write and Revise draw the text plain.
  const titleSheet = mode === 'drafting' && entry.pageSettings?.template === 'title' && isTitlePageText(text);
  const lensActive: 'outline' | 'bibliography' | null = mode !== 'journal' && (entry.pageSettings?.template === 'outline' || entry.pageSettings?.template === 'bibliography') ? entry.pageSettings.template : null;
  const applyLensKey = (e: KeyboardEvent): boolean => {
    if (lensActive !== 'outline' || mode !== 'drafting' || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return false;
    if (e.key !== 'Tab' && !(e.key === 'Enter' && !e.shiftKey)) return false;
    if (typewriterForPage(id, textRef.current.trim().length === 0)) return false;   // typewriter-scope: THIS page's own value
    const el = editorRef.current;
    if (!el) return false;
    const sel = getSelectionOffsets(el);
    if (!sel) return false;
    const cur = textRef.current;
    const start = Math.min(sel.start, cur.length);
    const end = Math.min(sel.end, cur.length);
    let result: { text: string; start: number; end: number };
    if (e.key === 'Tab') {
      result = outlineShift(cur, start, end, e.shiftKey ? -1 : 1);
    } else {
      const prefix = outlineNextRowPrefix(cur, start);
      const caret = start + 1 + prefix.length;
      result = { text: cur.slice(0, start) + '\n' + prefix + cur.slice(end), start: caret, end: caret };
    }
    e.preventDefault();
    if (result.text !== cur) {
      getRegisteredUndoStack(el)?.record({ text: result.text, caret: result.start }, 'atomic');
      setText(result.text);
      // TYPING-LATENCY: on the rows only the changed lines are rewritten (store/lineRows.ts), and the Outline's numbers are re-derived in the same write (applyOutlineLens)
      if (!writeRows(el, result.text, result.start, null)) decorateEditorFor(el, result.text, result.start, setCaretOffset, t => decorateMarkdownForCard(t, null));
      if (result.end > result.start) setSelectionOffsets(el, result.start, result.end);
    }
    return true;
  };
  const applyRailFormat = (action: FormatAction) => {
    if (mode !== 'drafting') return;   // 112-A's guard, unchanged in scope
    if (typewriterForPage(id, textRef.current.trim().length === 0)) return;   // PHASE 1 (S4) / typewriter-scope: Format is greyed while THIS page's own Typewriter is on, and its shortcuts (Ctrl/Cmd+B/I/U) are blocked with it
    applyFormatAt(action);
  };



  // AB2 S4 — the Structure picker. Prose -> Screenplay: free on an empty
  // page, one plain confirmation otherwise (mechanical mapping only, no AI —
  // store/structureConvert.ts). Screenplay -> Prose has no code path here
  // (this surface only ever renders prose); ScriptEditor.tsx owns that
  // direction's one-way warning.
  const convertToScreenplay = () => {
    const latest = getJournalEntry(id);
    if (!latest) return;
    const doc = proseTextToScriptDoc(latest.text);
    saveJournalEntry({ ...latest, pageType: 'script', script: doc, text: serializeScriptDoc(doc) });
  };
  const requestScreenplay = () => {
    // Screenplay BIRTHS, at zero words: it transforms the surface rather than decorating it, a durable commitment about what the document is (closer to pairing a board than to toggling a setting), so there is no unborn script surface to hold [PageEditor §21]
    if (unbornRef.current) {
      const doc = proseTextToScriptDoc('');
      unbornRef.current.birthWith({ pageType: 'script', script: doc, text: serializeScriptDoc(doc) });
      return;
    }
    flush(); flushNow();
    const latest = getJournalEntry(id);
    if (!latest) return;
    if (isProseEmpty(latest.text)) { convertToScreenplay(); return; }
    setStructureConfirm(true);
  };
  const onSwitchStructure = (next: 'prose' | 'screenplay') => {
    if (next === 'prose') return; // already prose — nothing to do on this surface
    requestScreenplay();
  };

  // A door that declared Screenplay opens the screenplay room, through `requestScreenplay` (one birth path). Guarded three ways, since a double birth would be worse than the defect: only while UNBORN (`unbornRef.current`), only when the address asked, and only once per mount (the ref latch survives StrictMode's double-invoke). [PageEditor §22]


  // Journal furniture (ink, capture items) is gated on the page's ORIGIN, not the mode alone: a null-origin row (older pages) reads as journal-equivalent, and only an explicit 'project' | 'loose' origin suppresses it. The forward lock is not furniture: it belongs to Free Write the posture, so it mounts on every page's Free Write rail (ForwardOnlyEditor's `forwardLock` was never origin-gated). [PageEditor §23]
  const journalFurniture = entry.origin == null || entry.origin === 'journal';

  // the one funnel for this page's page_settings, mirroring CascadePanels' PageSetupZone.patch exactly, including its `?? PAGE_SETTINGS_FALLBACK` base: one merge policy per jsonb column, and the values written are the ones the app already renders [PageEditor §24]
  const patchPageSettings = (next: Partial<PageSettings>) => {
    const base = entry.pageSettings ?? PAGE_SETTINGS_FALLBACK;
    saveJournalEntry({ ...entry, pageSettings: { ...base, ...next }, updatedAt: new Date().toISOString() });
  };

  // "Default": drop the page's own face; a page that never chose one is left as it is (no write) [PageEditor §25]
  const clearPageFace = () => {
    const cur = entry.pageSettings;
    if (!cur || cur.face === undefined) return;
    const { face: _dropped, ...rest } = cur;
    saveJournalEntry({ ...entry, pageSettings: rest, updatedAt: new Date().toISOString() });
  };

  // the Type control's props, one funnel into page_settings: `size` reads through the page default and is written as points; a face is written whole. `scoped` gives the section its two scopes and the roster as a list (Draft only: Free Write and Revise carry no styling tools, so a pick there is the whole page's). [PageEditor §26]
  const typeMember = (form: 'small' | 'full', scoped = false) => ({
    form,
    face: pageFace,
    size: entry.pageSettings?.size ?? PAGE_SIZE_DEFAULT,   // a page with no size of its own reads 12 real points (a page born now carries its 11); cards keep 11 [PageEditor §27]
    // `undefined` is "Default": the stored face is cleared (no stored face = the theme's default), after the same whole-page span clear a face pick does [PageEditor §28]
    onPickFace: (face: StoredFace | undefined) => { clearFontSpansOnPage(); if (face) patchPageSettings({ face }); else clearPageFace(); },
    onSize: (size: number) => { clearSizeSpansOnPage(); patchPageSettings({ size }); },   // the whole page's size: its spans' sizes go [PageEditor §29]
    scope: scoped ? { has: fontSel.has, face: fontSel.face, wholeLabel: dt('typeScopeWholeDocument'), onPickSelection: applyFontAt, size: fontSel.size, onSizeSelection: applySizeAt, holdSelection: holdSizeSelection, releaseSelection: () => { heldSelRef.current = null; } } : undefined,
  });

  const sliverContent: SliverContent = !framed
    ? { kind: 'empty' }
    : mode === 'journal'
      ? {
          kind: 'freewrite',
          // PHASE 1 - the drawer's TEXT | INK tab row is the ONE control for this instrument (the band's switch is retired).
          // Display wiring only: nothing here touches the typing path.
          instrument: { value: instrument, onChange: setInstrument },
          forwardLock: { on: forwardLock, onToggle: setForwardLock },
          // ITEM 207 - the smallest form (a face button and -/+, no number). Absent in INK: a pen page has no typeface.
          type: instrument === 'ink' ? undefined : typeMember('small'),
          // ITEM 121 I4 — THE INK OPTIONS, PASSED ONLY IN INK. This `undefined`
          // in TEXT is the whole of "absent, never greyed": the Sliver renders
          // the zone only when the member is present, so in TEXT there is
          // nothing in the DOM to grey out. A typewriter has no nibs.
          inkOptions: instrument === 'ink'
            ? {
                pen: inkPen,
                onPick: next => setInkPen(p => ({ ...p, ...next })),
                eraserArmed,
                onToggleEraser: () => setEraserArmed(a => !a),
              }
            : undefined,
          // ITEM 121 I6 (R15) — `ink` (the old text-colour swatches) and
          // `format` (STYLING's B/I/U) BOTH LEAVE this arm. See Sliver.tsx's
          // own comments at the two mounts for the full reasoning; the short
          // form is that Free Write does not decorate, and colouring the
          // typewriter's text was the same class of thing as bolding it.
          // `applyFreeWriteFormat` and `freeWriteMarks` go with them.
          captureItems: journalFurniture ? CAPTURE_ITEMS : [],
        }
      : mode === 'drafting'
        ? {
            kind: 'draft',
            // typewriter-scope: THIS page's own id/emptiness, so Sliver's own
            // formatLocked read (SliverToolsBody) can ask typewriterForPage
            // directly instead of the shared `typewriter` mirror.
            pageId: id,
            pageEmpty: textRef.current.trim().length === 0,
            structure: 'prose',
            onSwitchStructure,
            type: typeMember('full', true),
            format: {
              onFormat: applyRailFormat,
              boldOn: draftMarks.bold, italicOn: draftMarks.italic,
              underlineOn: draftMarks.underline, strikeOn: draftMarks.strike,
              headingLevel,
            },
            // read through the default, never written at birth: a page that never chose has no `kind` key, reads 'normal', and stays byte-identical on disk [PageEditor §30]
            pageKind: entry.pageSettings?.kind ?? PAGE_KIND_DEFAULT,
            onPickKind: kind => patchPageSettings({ kind }),
            styleGuide: entry.pageSettings?.styleGuide ?? STYLE_GUIDE_DEFAULT,
            onPickStyleGuide: styleGuide => patchPageSettings({ styleGuide }),
            templates: pageTemplates,
            // PHASE 1 - the Actions section: Tags, Copy, Delete, Header/Footer, wired from this page's own handlers (store/pageActions.ts).
            actions: unborn ? undefined : buildPageActions({ entry, copy: () => { void doCopy('words'); }, addTag, removeTag, patchPageSettings, navigate }),
          }
        // Revise's own drawer, and this branch is load-bearing: without it Revise fell to Draft's branch and got Draft's Structure control and format rail, live-looking but inert (`applyRailFormat` returns outside Draft). Its tenant is the Type control, full form; the drawer's standing furniture (goal block, instruments row) stays on every surface. [PageEditor §31]
        : { kind: 'revise', type: typeMember('full') };

  const structureConfirmDialog = structureConfirm && (
    <div className="sprint-modal-backdrop structure-confirm-modal" onClick={() => setStructureConfirm(false)}>
      <div className="sprint-modal card" role="dialog" aria-label="Convert to Screenplay" onClick={e => e.stopPropagation()}>
        <div className="card-title">Convert to Screenplay?</div>
        <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '8px 0 16px' }}>
          Each paragraph becomes an action line in a fresh script. Mechanical only — no AI — your words move verbatim.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-quiet" onClick={() => setStructureConfirm(false)}>Cancel</button>
          <button
            type="button"
            className="btn-brass structure-confirm-screenplay"
            onClick={() => { setStructureConfirm(false); convertToScreenplay(); }}
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );

  // E1 S2 — both Copy buttons now AWAIT copyText's own success/failure
  // (store/clipboard.ts's S1 fix) and say so, through the house's existing
  // ActionToast quiet-line pattern. S1's own live diagnosis (harness
  // reproduction, see the build report): a genuinely trusted click already
  // lands the right text on the OS clipboard today — the defect was total
  // silence, never brokenness — but a genuine failure (forced live too) was
  // previously an unhandled promise rejection with zero fallback and zero
  // surfaced message, which this fix also closes.
  const doCopy = async (which: 'words' | 'formatted') => {
    const payload = which === 'words' ? stripMarkdownConventions(textRef.current) : textRef.current;
    const ok = await copyText(payload);
    publishToast.show(ok ? dt(which === 'words' ? 'publishCopyWordsConfirm' : 'publishCopyFormattedConfirm') : dt('publishCopyFailed'));
  };

  // E1 S3 — "This Page" reads straight off the LIVE textRef (never a stale
  // persisted copy), so a download the instant after typing can't lose the
  // keystroke the debounced autosave hasn't flushed yet — the same
  // discipline Copy already relies on.
  const downloadThisPage = (format: 'md' | 'txt') => {
    const files = exportPageFiles({ ...entry, text: textRef.current });
    const ok = triggerDownload(`${files.base}.${format}`, format === 'md' ? files.md : files.txt, format === 'md' ? 'text/markdown' : 'text/plain');
    publishToast.show(ok ? dt('publishDownloadConfirm') : dt('publishDownloadFailed'));
  };

  // "This Binder"/"Everything" read PERSISTED storage across many pages, not
  // just this one — flush this page's own live text through first so a
  // download fired right after typing can't miss it.
  const downloadBinder = () => {
    flush(); flushNow();
    if (!project) return;
    const { filename, content } = exportBinderDocument(project);
    const ok = triggerDownload(filename, content, 'text/markdown');
    publishToast.show(ok ? dt('publishDownloadConfirm') : dt('publishDownloadFailed'));
  };

  const downloadEverything = () => {
    flush(); flushNow();
    const { filename, content } = exportEverythingDocument();
    const ok = triggerDownload(filename, content, 'text/markdown');
    publishToast.show(ok ? dt('publishDownloadConfirm') : dt('publishDownloadFailed'));
  };

  // HEADINGS - the floating +/- beside a SELECTED heading (see the selectionchange effect for where it sits and why). Draft only, the
  // one mode with styling tools; mousedown is prevented so the selection the writer made survives the press.
  const headingPopEl = mode === 'drafting' && headingPop && headingLevel !== null ? (
    <div className="wz-heading-pop" role="group" aria-label={dt('draftHeading')} style={{ left: headingPop.x, top: headingPop.y }} onMouseDown={e => e.preventDefault()}>
      <button type="button" className="wz-heading-pop-btn" title={dt('draftHeadingDown')} aria-label={dt('draftHeadingDown')} onClick={() => applyRailFormat('heading-down')}>&minus;</button>
      <button type="button" className="wz-heading-pop-btn" title={dt('draftHeadingUp')} aria-label={dt('draftHeadingUp')} onClick={() => applyRailFormat('heading-up')}>+</button>
    </div>
  ) : null;
  const publishDialog = showPublish && (
    <div className="sprint-modal-backdrop" onClick={() => setShowPublish(false)}>
      <div className="sprint-modal card" role="dialog" aria-label={lex('publish')} onClick={e => e.stopPropagation()}>
        <div className="card-title">{lex('publish')}</div>
        {/* E1 S4 — the download actions are real, present, and unmissable
            ABOVE the (still true) coming-soon line — the surface no longer
            reads as a dead end. */}
        <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: '.02em', margin: '12px 0 6px' }}>{dt('publishDownloadTitle')}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn-quiet publish-download-page-md" onClick={() => downloadThisPage('md')}>{dt('publishDownloadPageMd')}</button>
          <button type="button" className="btn-quiet publish-download-page-txt" onClick={() => downloadThisPage('txt')}>{dt('publishDownloadPageTxt')}</button>
          {project && <button type="button" className="btn-quiet publish-download-binder" onClick={downloadBinder}>{dt('publishDownloadBinder')}</button>}
          <button type="button" className="btn-quiet publish-download-everything" onClick={downloadEverything}>{dt('publishDownloadEverything')}</button>
        </div>
        {/* AB2 S5 — copy-out comes home to Publish (findings 2/3 of record die
            here). "Copy My Words" strips the markdown conventions back to
            honest plain text; "Copy Formatted" copies entry.text as stored —
            the conventions travel, markdown is the portable format. */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button type="button" className="btn-quiet publish-copy-words" onClick={() => doCopy('words')}>Copy My Words</button>
          <button type="button" className="btn-quiet publish-copy-formatted" onClick={() => doCopy('formatted')}>Copy Formatted</button>
        </div>
        <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '0 0 16px' }}>
          {dt('publishComingSoon')}
        </p>
        <button type="button" className="btn-quiet" onClick={() => setShowPublish(false)}>Close</button>
        {publishToast.node}
      </div>
    </div>
  );

  // AB3 S2 — the Page face's sending verbs, mounted once here (framed only —
  // the legacy/unframed branch below the gate stays byte-identical, no Page
  // face there).
  const pageFaceSheets = (
    <>
      {portOpen && <PortToBoardSheet sourceIds={[entry.id]} onClose={() => setPortOpen(false)} />}
      {pinOpen && <PinToBoardSheet entryId={entry.id} onClose={() => setPinOpen(false)} />}
    </>
  );

  // the framed (>=1100px) composition: the mode strip sits in this header row and the top-bar title retires (the Page face carries the title and where it lives, via describePageHome). "Done alone" means no title and no Catch, never no doorways: the Pages/Plan toggle stays beside Done, as on ScriptEditor's framed header. [PageEditor §32]
  if (framed) {
    return (
      <div ref={pageRef} className="desk-frame-host" data-chrome-receded={receded ? 'true' : 'false'}>
        <FirstRunVeil active={gateActive}>
          <div className="chrome-fade chrome-top sprint-nav">
            {/* the address: crumb (marginRight:auto) · strip · actions, the shape the Board uses [PageEditor §33] */}
            <LocationCrumb entry={entry} project={project} drawer={drawer} title={pageTitle} />
            {/* ITEM 121 I3 — the TEXT | INK switch, in the band, immediately
                before the mode strip. R15/mockup B seat it "beside the location
                line"; the framed band has none (CD1 S1 retired the crumb, and
                the Page face carries the where-it-lives chain now), so what
                ports is its position RELATIVE to the strip — the one landmark
                the mockup and the live band share. FREE WRITE ONLY: Draft and
                Revise are not sketch pads, and a switch offering an instrument
                the surface does not have would be the locked door wearing
                paint. Absent, never disabled. */}
            {/* PHASE 1: the TEXT | INK choice is the first tab of the left drawer; the band no longer carries a second switch for it. */}
            <ModeStrip
              mode={mode}
              onSwitch={switchMode}
              onPublish={() => setShowPublish(true)}
              end={(
                <button type="button" className="btn-quiet page-plan-door" data-page-plan-door onClick={openPlanBoard}>
                  {dt('pagePlanDoor')} <span aria-hidden="true">→</span>
                </button>
              )}
            />
            {(project || fromBoard) && <div className="sprint-actions">
              {project && (
                <div className="sprint-toggle" role="tablist" aria-label={`${lex('binder')} view`}>
                  {/* CD4 S2 — the elder "Plan" flight tab (→ the legacy StructureBoard) is
                      retired; the arrow-dressed PLAN → door below is the bar's only Plan
                      word now. The legacy board stays reachable via its secondary access
                      (ProjectHome "View board" / BeatWizard / QuickSprint) — dormant-not-
                      dead, the StructureWizard precedent; beat_id/story_plan_id grandfathered. */}
                  <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}`); }}>{lexMany('page')}</button>
                </div>
              )}
              {fromBoard && (
                /* W5 - a page born from a step (data-return-chip="step"): ONE glow on the chip as the page opens (store/deckRewards.ts celebrateReturnChip: once per element, still under reduced motion / Ambiance 0). */
                <button type="button" ref={fromStepLabel ? glowStepChip : undefined} className="btn-quiet wz-back-to-board" data-return-chip={fromStepLabel ? 'step' : undefined} title={fromStepLabel ?? undefined}
                  aria-label={openedByTemplate && fromBoardTitle ? `Back to ${fromBoardTitle}` : undefined} onClick={() => { flush(); flushNow(); navigate(`/page/${fromBoard}`); }}>
                  {openedByTemplate ? `‹ ${dt('templateOpenedNewBack')}` : fromBoardTitle ? `‹ Back to ${fromBoardTitle}` : '‹ Back to the board'}
                </button>
              )}
            </div>}
          </div>
        </FirstRunVeil>

        <div style={{ height: 16 }} />

        <DeskFrame
          pageKind="prose"
          strip={<FirstRunVeil active={gateActive}>{cascade.strip}</FirstRunVeil>}
          cascadeLayers={<FirstRunVeil active={gateActive}>{cascade.layers}</FirstRunVeil>}
          sliver={<FirstRunVeil active={gateActive}><Sliver content={sliverContent} goalText={text} hasMilestones={!!milestones && milestones.beats.length > 0} /></FirstRunVeil>}
          // The Tutor is absent while the first-run gate holds (first run stays pure), not veiled-but-mounted: the veil's filter:blur would make a new containing block and break the Tutor's two absolute anchors (they need .desk-frame-stage). Otherwise the right hand mounts from first paint, unborn pages included, as BoardEditor, ScriptEditor and JournalEntry do; `entry` already carries the minted per-surface id (UnbornProvider registers it before children render), and Tutor.send() refuses on an unborn surface. [PageEditor §34]
          tutor={gateActive ? undefined : <Tutor entry={entry} project={project} pageText={text} pageKind="prose" mode={mode} selectionText={draftSelection} />}
          // HB1 S3 — the SAME progress-fraction seam GoalGlow already
          // defines (FirstRunGate.tsx's FirstRunGlow mirrors its rendering
          // contract exactly), fed the gate's own word fraction instead of
          // GoalGlow's line-equivalents one while the gate holds; the real
          // GoalGlow resumes the instant it doesn't (it renders nothing
          // anyway, absent a writer-set goal — first run never sets one).
          goalGlow={(gateActive || gateReached)
            ? <FirstRunGlow fraction={gateWords / FIRST_RUN_WORD_TARGET} />
            : <GoalGlow text={text} />}
          // M2 S2 — the Rhizome's own growth layer. Absent outright while the
          // first-run gate holds (the SAME "the threshold stays pure" law
          // TU1's own non-goal put on the Tutor above — an ambient, entirely
          // optional flourish has no place competing with the one-time
          // ceremony). RhizomeField.tsx itself no-ops (renders nothing) when
          // the writer hasn't actually chosen Rhizome, so mounting it
          // unconditionally past the gate costs nothing on the shipped
          // Bar-default path.
          // M4 S3/S4 — this lane now carries the whole progress INSTRUMENT,
          // not just the growth layer: DeskInstrument.tsx renders the
          // rhizome OR the bar (two styles, one location, SV15) plus the
          // goal flare (SV16). The gate rule above is unchanged and now
          // covers both styles — the threshold stays pure either way.
          rhizome={gateActive || unborn ? undefined : <DeskInstrument unitCount={wordCount(text)} text={text} seedKey={entry.id} paperRef={surfaceRef} glitch />}
          dissolved={receded}
        >
          <ModeStage
            mode={mode}
            words={wordCount(text)}
            pageId={id}
            surfaceRef={surfaceRef}
            focused={focused}
            onDissolveChange={setReceded}
            chromeRootRef={pageRef}
            milestones={milestones}
            penColor={penColor}
            /* ITEM 121 I3 — the paper wears the instrument, so the change is
               visible ON THE PAGE (the caret sleeps) and not only in the
               switch. Undefined outside Free Write, which keeps the attribute
               off Draft's and Revise's paper entirely. */
            instrument={mode === 'journal' ? instrument : undefined}
            /* ITEM 126 B2 — the ink's permission, beside (never merged into) the
               instrument: a Draft page is not "in TEXT", it is a word processor
               with ink on it. */
            inkPermission={inkPermission}
            readouts={unborn ? undefined : <FluxReadouts entry={realEntry ?? null} surface={mode === 'journal' ? 'wireIn' : 'prose'} />}
            framed
            firstRunGateActive={gateActive}
          >
            {editorBody}
          </ModeStage>
        </DeskFrame>

        {gateActive && <FirstRunGateBanner words={gateWords} target={FIRST_RUN_WORD_TARGET} />}
        {gateReached && <UnlockCeremony onChoose={handleChooseTheme} />}

        {publishDialog}
        {headingPopEl}
        {structureConfirmDialog}
        {pageFaceSheets}
      </div>
    );
  }

  return (
    <div ref={pageRef} className="page" data-chrome-receded={receded ? 'true' : 'false'} style={{ maxWidth: 1100, paddingTop: '2.5rem' }}>
      <div className="chrome-fade chrome-top sprint-nav">
        <div className="sprint-crumb" aria-label="Location">
          {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
          {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
          <span className="crumb-here">{pageTitle}</span>
          {entry.importedAt && <span className="page-imported-tag" title={`Imported into this ${lex('binder').toLowerCase()}`}>Imported</span>}
        </div>

        {/* ITEM 112-A — the unframed Page's strip agrees with the framed one
            (brief §2, "both sides must agree"). Opt-in rather than default,
            so QuickSprint — which shares this component, keeps its own separate
            mode key, and is named nowhere in this charter — is untouched. */}
        <ModeSwitcher
          mode={mode}
          onSwitch={switchMode}
          reviseEnabled
          actions={[
            // the Workshop tab is hidden until built [PageEditor §35]
            { label: lex('publish'), sub: 'export', onClick: () => setShowPublish(true) },
          ]}
        />

        <div className="sprint-actions">
          {/* W2 - below the frame gate the chip exists ONLY for a page born from a step ("Write this" on a phone: the Walk is a Deck's only view there, so the way back must be one tap too); every other legacy route stays byte-identical. */}
          {fromBoard && fromStepLabel && (
            <button type="button" ref={glowStepChip} className="btn-quiet wz-back-to-board" data-return-chip="step" title={fromStepLabel} onClick={() => { flush(); flushNow(); navigate(`/page/${fromBoard}`); }}>
              {fromBoardTitle ? `‹ Back to ${fromBoardTitle}` : '‹ Back to the board'}
            </button>
          )}
          {project && (
            <div className="sprint-toggle" role="tablist" aria-label={`${lex('binder')} view`}>
              {/* CD4 S2 — elder "Plan" flight tab (→ legacy StructureBoard) retired; the
                  PLAN → door below is the bar's only Plan word now (legacy path mirror). */}
              <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}`); }}>{lexMany('page')}</button>
            </div>
          )}
          {/* the noun is cut: name the act, not the object ("pages text" is not English) [PageEditor §36] */}
          <button type="button" className="btn-quiet page-copy" onClick={() => copyText(textRef.current)} title="Copy the clean text">Copy text</button>
          {/* BM1 S3 — the PLAN → door, the mirror of the board's PAGE → door, at
              the end of the page's bar (same arrow grammar). First click on an
              unpaired page BIRTHS the plan board (S2's lazy rule — never before,
              never automatically) and flips to it; later clicks resolve to the
              same board. No knock, no badge, no dot (A14). Bar chrome only — the
              paper's rect and text measure are never touched (S8). */}
          <button type="button" className="btn-quiet page-plan-door" data-page-plan-door onClick={openPlanBoard}>{dt('pagePlanDoor')} <span aria-hidden="true">→</span></button>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <ModeStage
        mode={mode}
        words={wordCount(text)}
        pageId={id}
        surfaceRef={surfaceRef}
        focused={focused}
        onDissolveChange={setReceded}
        chromeRootRef={pageRef}
        milestones={milestones}
      >
        {editorBody}
      </ModeStage>

      {publishDialog}
      {headingPopEl}
    </div>
  );
}

// Key by id so per-page refs/state re-seed cleanly on page→page navigation.
// J4 — /page/:id stays the one typed-page route; a pageType:'board' entry
// delegates to the BoardEditor here, before either component's hooks run.
// S1 — pageType:'script' delegates to ScriptEditor the same way. Below
// AB1's 1100px gate this is still Draft law only: neither delegate mounts
// ModeSwitcher/ModeStage there (a Board is Trellis-side by design; a script
// page ships Draft-only). At >=1100px each delegate owns its own DeskFrame
// instead (AB1 S1/S2) — Board still never gets a mode strip; Script does
// (Draft live, Free Write/Revise/Workshop deferred — script Free-write
// itself is still AB2).
export function PageEditor() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  const entry = getJournalEntry(id);
  if (entry?.pageType === 'board') return <BoardEditor key={id} id={id} />;
  if (entry?.pageType === 'script') return <ScriptEditor key={id} id={id} />;
  // ITEM 104 HOTFIX — THE VANISHED-PAGE DECISION BELONGS HERE, NOT INSIDE THE
  // VIEW. PageEditorView still carries `useCascade` BELOW its own `if (!entry)`
  // guard (a pre-existing position, older than the doorway ship), so if that
  // view is left mounted while `entry` flips to null it re-renders with fewer
  // hooks and React throws #300, blanking the whole tree. Deciding one level up
  // — in a dispatcher whose own hooks all sit above every return — makes the
  // vanished page UNMOUNT the view instead of re-rendering it, which removes
  // the fault CLASS rather than the one instance this ticket found.
  //
  // Reachable in production: another device deletes a page this one has open,
  // and the tombstone arrives on a sync pull. Reproduced, and red pre-fix.
  if (!entry) return <Navigate to="/" replace />;
  return <PageEditorView key={id} id={id} />;
}

// /page/new, the unborn surface: a door that opens a blank surface creates no row; it lands here carrying what it meant as query params (the address is reload-safe by construction). The dispatch is the same as /page/:id's, reading the same getJournalEntry, which resolves the unborn slot. There is no unborn script surface: choosing Screenplay births, so a script page has a row by the time ScriptEditor mounts. [PageEditor §37]
export function UnbornPage() {
  return (
    <UnbornProvider>
      {(id, descriptor) => {
        // The row outranks the door once it exists: `birthWith` corrects the address with history.replaceState on purpose (a navigate() would unmount mid-keystroke), which never notifies HashRouter, so the descriptor alone would keep a born screenplay row on PageEditorView. The door's intent decides only while there is no row. A prose row has no pageType, so it keeps the same PageEditorView and key: no remount, no dropped keystroke. [PageEditor §38]
        const row = getJournalEntry(id);
        const kind = row?.pageType ?? (descriptor.kind === 'board' ? 'board' : undefined);
        if (kind === 'script') return <ScriptEditor key={id} id={id} />;
        if (kind === 'board') return <BoardEditor key={id} id={id} />;
        // ITEM 104 HOTFIX — the same vanished-page decision as the born route
        // above. On this route `row` is normally the unborn slot, so null here
        // is genuinely exceptional; unmounting is still the right answer, and
        // it keeps both dispatchers honest about the same rule.
        if (!row) return <Navigate to="/" replace />;
        return <PageEditorView key={id} id={id} />;
      }}
    </UnbornProvider>
  );
}
