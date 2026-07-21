import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { flushNow, getDrawer, getJournalEntry, getProject, saveJournalEntry, patchJournalEntry, getBoardsPinning, inJournalView } from '../store/persistence';
import { describePageHome } from '../store/pageHome';
import { firstLine } from '../store/entryText';
import { ForwardOnlyEditor, type EditorMode } from '../components/ForwardOnlyEditor';
import { ModeSwitcher } from '../components/ModeSwitcher';
import { ModeStage, PEN_INKS } from '../components/ModeStage';
import { useWarmStart } from '../components/useWarmStart';
import { useSessionLog } from '../components/useSessionLog';
import { useFirstLineInvite } from '../components/useFirstLineInvite';
import { useWayBack } from '../components/useWayBack';
import { setCaretOffset, getSelectionOffsets } from '../store/caretOffset';
import { projectMilestones } from '../store/milestones';
import { copyText } from '../store/clipboard';
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
import { RhizomeField } from '../components/RhizomeField';
import { useCascade } from '../components/Cascade';
import type { PageFaceSubject } from '../components/PageFace';
import { PortToBoardSheet } from '../components/PortToBoardSheet';
import { PinToBoardSheet } from '../components/PinToBoardSheet';
import { useForwardLock, setForwardLock } from '../store/forwardLock';
import { applyFormat, stripMarkdownConventions, FORMAT_MARK, type FormatAction } from '../store/draftFormat';
import { decorateEditorFor } from '../store/draftDecoration';
import { getRegisteredUndoStack } from '../store/textUndo';
import { proseTextToScriptDoc, isProseEmpty } from '../store/structureConvert';
import { serializeScriptDoc } from '../store/scriptText';
import { getFirstRunComplete, setFirstRunComplete } from '../store/firstRun';
import { setFirstRunGateActive } from '../store/firstRunGateActive';
import { useMonotonicWordCount, FirstRunVeil, FirstRunGateBanner, FirstRunGlow } from '../components/FirstRunGate';
import { UnlockCeremony } from '../components/UnlockCeremony';
import type { ThemeId } from '../store/theme';
import { seedTypewriterDefault, DRAFT_TYPEWRITER_LINE_THRESHOLD } from '../store/writingSettings';
import { countLineEquivalents } from '../store/lineEquivalents';

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

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function PageEditorView({ id }: { id: string }) {
  const navigate = useNavigate();
  const { t: lex, tMany: lexMany } = useLexicon();
  const { t: dt } = useDeskLexicon();
  // AB1 S1 — DeskFrame owns the viewport at >=1100px only; below that this
  // component's legacy JSX (byte-identical to pre-AB1) renders instead. See
  // docs/wrizo-alpha/ab1-shell-inventory.md.
  const framed = useDeskFrameViewport();
  const entry = getJournalEntry(id);
  const project = entry?.projectId ? getProject(entry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;
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
  const modeKey = `wrizo-mode-page-${id}`;
  const [mode, setMode] = useState<EditorMode>(() => {
    const saved = localStorage.getItem(modeKey);
    if (saved === 'journal' || saved === 'drafting') return saved;
    return entry?.pageType === 'manuscript' || entry?.origin === 'loose' ? 'journal' : 'drafting';
  });

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
  const forwardLock = useForwardLock();
  // FX7 S2 — Free Write's own Bold/Italic two-press bracket state (open =
  // the leading marker has been inserted, awaiting its closing press). See
  // applyFreeWriteFormat below for why this can't just reuse Draft's
  // selection-wrap (`applyRailFormat`) — forward-only has no mid-text caret.
  const [freeWriteMarks, setFreeWriteMarks] = useState({ bold: false, italic: false });
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
  const lastSavedRef = useRef(initialText);
  const editorRef = useRef<HTMLDivElement>(null);
  // FX7 S2 — Free Write's own rail-driven marker insertion escape hatch
  // (ForwardOnlyEditor.tsx's own Props comment has the full "why not
  // execCommand" writeup).
  const freeWriteInsertRef = useRef<((text: string) => void) | null>(null);
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
  });

  // F6 — the first-line invitation on a truly empty page (entry.text.length === 0).
  const invite = useFirstLineInvite(() => textRef.current.length === 0);

  // FX2 S2 — Draft-open typewriter default, captured once at mount (the
  // same "captured once" idiom as warmRef above, and Sliver.tsx's own
  // initialGoalTextRef). `mode` and `initialText` here are read inside the
  // effect's OWN closure (empty deps), so they're each frozen at their
  // FIRST-RENDER value — the effective mode AT OPEN, before any switchMode()
  // click could change it, and the page's text as it stood at that same
  // mount. This component remounts per page (`key={id}` below), so "once
  // per mount" already means "once per page-open": a later Draft <-> Free
  // Write mode switch within the SAME mount can never re-run this effect,
  // satisfying "mid-session mode switches don't re-evaluate" for free,
  // without a separate guard ref. Free Write is untouched — no call here
  // when the page opens into 'journal'.
  useEffect(() => {
    if (mode === 'drafting') {
      seedTypewriterDefault(countLineEquivalents(initialText) < DRAFT_TYPEWRITER_LINE_THRESHOLD);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // W2 — the way back. Scroll lives on ModeStage's internal .mode-scroll box
  // (surfaceRef is the .mode-page ancestor the host already owns); caret
  // lives on the ForwardOnlyEditor host div (editorRef). Mode itself is
  // already restored independently via the per-page localStorage key above —
  // this hook doesn't need to touch it.
  useWayBack({
    entryId: id,
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
  const flush = () => {
    const latest = getJournalEntry(id);
    if (latest && latest.text !== textRef.current) {
      saveJournalEntry({ ...latest, text: textRef.current });
      lastSavedRef.current = textRef.current;
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
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flush();
      flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!entry) return <Navigate to="/" replace />;

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
  const pageTitle = text.trim() ? firstLine(text).slice(0, 40) : 'Untitled';

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
  const pinnedBoardTitles = getBoardsPinning(entry.id).map(b => b.title);
  const { homeLabel, memberships } = describePageHome(entry, project, pinnedBoardTitles);
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry,
    homeLabel,
    memberships,
    footer: entry.projectId == null ? 'Saved automatically — even if you never file it to a Drawer or the Shelf.' : undefined,
    onToggleStar: toggleStar,
    onAddTag: addTag,
    onRemoveTag: removeTag,
    onOpenPortToBoard: () => setPortOpen(true),
    onOpenPin: () => setPinOpen(true),
  };

  // CD2 S1/S5 — the cascade, replacing the Drawer whole. One hook call
  // shares state between the strip (a DeskFrame grid track) and the
  // reach/survey layers (a DeskFrame stage overlay) — see Cascade.tsx's own
  // header comment for why a hook, not a component, is the right shape
  // here.
  const cascade = useCascade({ subject: pageFaceSubject, project, navigate });

  // The editor's own render-prop body — identical between the legacy and the
  // AB1-framed ModeStage instance, factored out so the two branches below
  // can't drift.
  const editorBody = ({ noteWrite, penColor }: { noteWrite: () => void; penColor?: string }) => (
    <div ref={warmWrapRef} style={{ position: 'relative', width: '100%', minHeight: '100%' }}>
      <ForwardOnlyEditor
        key={`${id}-${mode}`}
        ref={editorRef}
        initialText={modeSeed}
        mode={mode}
        autoFocus={initialText.trim() === ''}
        onChange={setText}
        onForward={() => { noteWrite(); warm.release(); noteSessionKeystroke(); invite.dismiss(); }}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); flush(); }}
        placeholder={invite.visible ? '' : 'Write…'}
        ariaLabel="Page writing surface"
        penColor={penColor}
        forwardLock={mode === 'journal' ? forwardLock : true}
        insertMarkerRef={freeWriteInsertRef}
        style={{
          width: '100%', minHeight: '100%', color: 'var(--ink-on-paper)',
          fontFamily: 'var(--font-prose)',
          // FX3 S2 — scales with --paper-scale (index.css) so the editor's
          // own rendered type grows in lockstep with the paper (Law 1: the
          // measure, not the pixel width, is the constant). Reaches the
          // actual contenteditable node via inheritance, not directly
          // (ForwardOnlyEditor spreads this `style` onto the outer
          // `.forward-only-editor-wrap`, not the `.forward-only-editor`
          // node itself — font-size is an inherited property, so this
          // still works).
          fontSize: 'calc(17px * var(--paper-scale))', lineHeight: 1.7,
        }}
      />
      {/* HB1 S3 — the gate's instruction is the threshold's one sanctioned
          utterance; the first-line invite (F6) would speak a second one on
          this exact (empty) page. gateActive is only ever true when framed
          (F4), so this never touches the legacy branch's behavior. */}
      {gateActive ? null : invite.node}
      {warm.rect && (
        <div
          aria-hidden="true"
          className={`wz-warm${warm.settled ? ' wz-warm--settled' : ''}`}
          style={{ position: 'absolute', top: warm.rect.top, left: warm.rect.left, width: warm.rect.width, height: warm.rect.height }}
        />
      )}
    </div>
  );

  // AB2 S3 — the rail's Bold/Italic/Heading/Spacing tools, operating on
  // entry.text directly (S0's ruling: markdown conventions, no separate
  // rich-text state). Reads the editor's current selection via the SAME
  // linear-offset technique the rest of this codebase uses for caret math
  // (store/caretOffset.ts), applies the transform (store/draftFormat.ts),
  // then imperatively re-decorates the DOM through the SAME guarded helper
  // ForwardOnlyEditor's own native listener uses on every keystroke
  // (store/draftDecoration.ts's decorateEditorFor) — not a bare
  // `el.innerHTML = decorateMarkdown(...)`, which would reintroduce the
  // Chromium trailing-newline-at-EOF caret quirk that helper guards against
  // (reachable here too: Spacing at the very end of the page inserts a
  // trailing blank line, landing the caret exactly in that state) — so a
  // rail click and a keystroke leave the surface in the identical state.
  const applyRailFormat = (action: FormatAction) => {
    const el = editorRef.current;
    if (!el || mode !== 'drafting') return;
    el.focus();
    const sel = getSelectionOffsets(el) ?? { start: textRef.current.length, end: textRef.current.length };
    const result = applyFormat(textRef.current, sel.start, sel.end, action);
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
    decorateEditorFor(el, result.text, result.start, setCaretOffset);
  };

  // FX7 S2 — Free Write's own Bold/Italic. Forward-only's data model
  // (ForwardOnlyEditor.tsx's Run[], always-append-at-the-tail — see that
  // file's own header comment) has no arbitrary selection/replace concept
  // the way Draft's applyRailFormat above does, so wrapSelection's
  // "replace the selected range" approach doesn't fit here. Instead this
  // reuses draftFormat.ts's OWN marker convention (FORMAT_MARK) as a literal
  // INSERTION at the tail, via document.execCommand('insertText', ...) —
  // the SAME programmatic-contenteditable-edit technique already
  // established in this codebase (store/emDash.ts's own applyEmDash). That
  // fires a genuine 'beforeinput' (inputType: insertText) event, which
  // ForwardOnlyEditor's own journal-mode listener (its `onBeforeInput`)
  // routes through its OWN handleInput() — the EXACT SAME path a real
  // keystroke takes. This is why it's structurally safe with respect to
  // forward-lock's deletion discipline (verified live, not merely assumed —
  // scripts/harness/fx7.mjs's own S2 section): nothing here ever calls
  // handleBackspace/eraseTail/strikeStep, and the inserted marker
  // characters become ordinary Runs — struck (never erased) by a later
  // backspace, exactly like any other typed character.
  //
  // Toggle behavior: forward-only can't place a caret mid-text to wrap a
  // selection after the fact, so Bold/Italic behave as a two-press bracket
  // instead — press once to open (insert the leading marker, arm the rail
  // button), press again to close (insert the trailing marker, disarm). The
  // writer's own typing lands between the two clicks — the same "type **
  // yourself" markdown-by-hand convention, just a rail shortcut for the
  // same literal characters a keystroke would produce.
  //
  // Root-caused live (not assumed): the first implementation called
  // `document.execCommand('insertText', ...)` — this codebase's own
  // established technique for a programmatic contenteditable edit
  // (store/emDash.ts's applyEmDash) — but execCommand turned out NOT to
  // reliably fire a `beforeinput` event ForwardOnlyEditor's own journal-
  // mode listener could intercept in this harness's own Chromium build; it
  // mutated the DOM directly instead, leaving the Run model unaware, so the
  // very next real keystroke's own re-render (built from the still-stale
  // model) silently wiped the inserted marker. Fixed by calling
  // ForwardOnlyEditor's own `insertMarkerRef` escape hatch instead — the
  // component's own `handleInput`, the EXACT function a real keystroke
  // calls, with no event-dispatch reliability gap at all.
  const applyFreeWriteFormat = (action: 'bold' | 'italic') => {
    if (mode !== 'journal') return;
    const insert = freeWriteInsertRef.current;
    if (!insert) return;
    editorRef.current?.focus();
    insert(FORMAT_MARK[action]);
    setFreeWriteMarks(prev => ({ ...prev, [action]: !prev[action] }));
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

  // AB3 S4 — Journal furniture (ink/capture items) stays conditional on the
  // page's ORIGIN, not the editor's Free-Write MODE alone: a project- or
  // loose-origin page in Free Write mode gets none of it — only a
  // journal-origin page does. Canon amendment A2 (the grandfather clause): a
  // null-origin row (every page that existed before this ticket) behaves
  // EXACTLY as today, where mode alone decided it — so null reads as
  // "journal-equivalent" here, and only an EXPLICIT non-journal origin
  // ('project' | 'loose') suppresses the furniture.
  //
  // FX1 S3 (Nick's first-sitting verdict, provisional canon note) — the
  // forward lock SPLITS off this gate: it belongs to Free Write the
  // POSTURE, not the Journal the PLACE, so it now mounts on every page's
  // Free Write rail regardless of origin. Ink and capture items are
  // unchanged — still journal furniture, still origin-gated. This amends
  // Law 2's furniture list in practice (forward lock is mode furniture, not
  // journal furniture) pending Nick's feel-test and the committee pass's
  // formal canon-doc amendment; the canon doc itself is untouched this
  // ticket. The MECHANIC (ForwardOnlyEditor's `forwardLock` prop below) was
  // never origin-gated — only this rail control was — so no change was
  // needed there for loose/project pages to actually strike/erase per the
  // persisted setting.
  const journalFurniture = entry.origin == null || entry.origin === 'journal';

  const sliverContent: SliverContent = !framed
    ? { kind: 'empty' }
    : mode === 'journal'
      ? {
          kind: 'freewrite',
          ink: journalFurniture ? { penColor, inks: PEN_INKS, onChoosePen: setPenColor } : undefined,
          forwardLock: { on: forwardLock, onToggle: setForwardLock },
          // FX7 S2 — Bold/Italic + the ink-tool placeholder, unconditional
          // on origin (like forwardLock above, per FX1 S3's own "belongs to
          // Free Write the POSTURE, not the Journal the PLACE" precedent) —
          // this is exactly the sparse-rail complaint (Nick's own words) on
          // an ordinary (project/loose-origin) Free Write page, where
          // journalFurniture is false and the rail carried almost nothing.
          format: { onFormat: applyFreeWriteFormat, boldOn: freeWriteMarks.bold, italicOn: freeWriteMarks.italic },
          inkToolPlaceholder: true,
          captureItems: journalFurniture ? CAPTURE_ITEMS : [],
        }
      : {
          kind: 'draft',
          structure: 'prose',
          onSwitchStructure,
          format: { onFormat: applyRailFormat },
        };

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

  const publishDialog = showPublish && (
    <div className="sprint-modal-backdrop" onClick={() => setShowPublish(false)}>
      <div className="sprint-modal card" role="dialog" aria-label={lex('publish')} onClick={e => e.stopPropagation()}>
        <div className="card-title">{lex('publish')}</div>
        <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '8px 0 16px' }}>
          Publishing options — tailored to this work's type, destination, and format — are coming soon.
        </p>
        {/* E1 S3 — the Download action. S4 (a follow-up commit) moves this
            section, and the paragraph above, so Download reads unmissable
            ABOVE the coming-soon line — left in its original reading order
            here, this slice's own scope is the mechanism, not the layout. */}
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

  // CD1 S1 — the framed (>=1100px) composition. The mode strip moves up
  // into this header row (left-set, engraved register via its own CSS);
  // the top-bar title retires (the crumb/breadcrumb it duplicated — the
  // Page face already carries the same title + "where it lives" chain via
  // describePageHome, S3). "Copy page text" already left top chrome
  // entirely in AB1/AB2 (S4) — its future home is a later ticket's Publish
  // surface.
  //
  // cd1.1 (Fable review erratum) — S1's brief read "Done alone" as scrapping
  // the Pages/Plan toggle too; that was Fable's own defect, not the build's.
  // "Done alone" meant no title and no Catch, never no doorways — the
  // toggle belongs beside Done here (and on ScriptEditor's own framed
  // header, which never had one before this ticket).
  if (framed) {
    return (
      <div ref={pageRef} className="desk-frame-host" data-chrome-receded={receded ? 'true' : 'false'}>
        <FirstRunVeil active={gateActive}>
          <div className="chrome-fade chrome-top sprint-nav">
            <ModeStrip mode={mode} onSwitch={switchMode} onPublish={() => setShowPublish(true)} />
            <div className="sprint-actions">
              {project && (
                <div className="sprint-toggle" role="tablist" aria-label={`${lex('binder')} view`}>
                  <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}`); }}>{lexMany('page')}</button>
                  <button type="button" role="tab" aria-selected="false" className="sprint-toggle-btn" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}/board`); }}>{lex('plan')}</button>
                </div>
              )}
              {fromBoard && (
                <button type="button" className="btn-quiet wz-back-to-board" onClick={() => { flush(); flushNow(); navigate(`/page/${fromBoard}`); }}>
                  ‹ Back to the board
                </button>
              )}
              <button type="button" className="btn-quiet" onClick={() => { flush(); flushNow(); navigate(backTo); }}>Done</button>
            </div>
          </div>
        </FirstRunVeil>

        <div style={{ height: 16 }} />

        <DeskFrame
          pageKind="prose"
          strip={<FirstRunVeil active={gateActive}>{cascade.strip}</FirstRunVeil>}
          cascadeLayers={<FirstRunVeil active={gateActive}>{cascade.layers}</FirstRunVeil>}
          sliver={<FirstRunVeil active={gateActive}><Sliver content={sliverContent} goalText={text} hasMilestones={!!milestones && milestones.beats.length > 0} /></FirstRunVeil>}
          // TU1 non-goal, verbatim: "the Tutor on the threshold (first-run
          // stays pure)" — absent outright while the gate holds, not merely
          // veiled-but-mounted like the sliver above. This also sidesteps a
          // real geometry hazard FirstRunVeil's own wrapper would otherwise
          // create: `.hb1-veil[data-veiled='true']`'s `filter:blur(4px)`
          // establishes a NEW containing block for `position:absolute`
          // descendants (per the CSS spec, same as `transform` would), which
          // would silently break the Tutor's two anchors' percentage math
          // (they need `.desk-frame-stage` as their containing block, per
          // Tutor.tsx's own header comment) — Sliver never hits this because
          // DeskFrame.tsx provides ITS anchor div outside the veil; the
          // Tutor provides its own anchors internally, so a veil wrapper
          // here would swallow them both.
          tutor={gateActive ? undefined : <Tutor entry={entry} project={project} pageText={text} pageKind="prose" />}
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
          rhizome={gateActive ? undefined : <RhizomeField unitCount={wordCount(text)} seedKey={entry.id} paperRef={surfaceRef} />}
          dissolved={receded}
        >
          <ModeStage
            mode={mode}
            words={wordCount(text)}
            surfaceRef={surfaceRef}
            focused={focused}
            onDissolveChange={setReceded}
            chromeRootRef={pageRef}
            milestones={milestones}
            penColor={penColor}
            framed
            firstRunGateActive={gateActive}
          >
            {editorBody}
          </ModeStage>
        </DeskFrame>

        {gateActive && <FirstRunGateBanner words={gateWords} target={FIRST_RUN_WORD_TARGET} />}
        {gateReached && <UnlockCeremony onChoose={handleChooseTheme} />}

        {publishDialog}
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

        <ModeSwitcher
          mode={mode}
          onSwitch={switchMode}
          actions={[
            { label: 'Workshop', sub: 'coming soon', deferred: true },
            { label: lex('publish'), sub: 'export', onClick: () => setShowPublish(true) },
          ]}
        />

        <div className="sprint-actions">
          {project && (
            <div className="sprint-toggle" role="tablist" aria-label={`${lex('binder')} view`}>
              <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}`); }}>{lexMany('page')}</button>
              <button type="button" role="tab" aria-selected="false" className="sprint-toggle-btn" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}/board`); }}>{lex('plan')}</button>
            </div>
          )}
          <button type="button" className="btn-quiet page-copy" onClick={() => copyText(textRef.current)} title={`Copy the clean ${lex('page').toLowerCase()} text`}>Copy {lex('page').toLowerCase()} text</button>
          <button type="button" className="btn-quiet" onClick={() => { flush(); flushNow(); navigate(backTo); }}>Done</button>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <ModeStage
        mode={mode}
        words={wordCount(text)}
        surfaceRef={surfaceRef}
        focused={focused}
        onDissolveChange={setReceded}
        chromeRootRef={pageRef}
        milestones={milestones}
      >
        {editorBody}
      </ModeStage>

      {publishDialog}
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
  return <PageEditorView key={id} id={id} />;
}
