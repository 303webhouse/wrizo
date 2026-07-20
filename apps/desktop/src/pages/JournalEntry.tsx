import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getJournalEntry, getProject, getProjects, saveJournalEntry, setProjectSprintText, setPageHome, createQuickSprintProject, getNotebookPages, createLoosePage, flushNow, getBoardsPinning } from '../store/persistence';
import { describePageHome } from '../store/pageHome';
import { firstLine, formatStamp } from '../store/entryText';
import { inkColor, renderStroke, ERASER_WIDTH } from '../store/ink';
import { useChromeDissolve } from '../components/useChromeDissolve';
import { useWarmStart } from '../components/useWarmStart';
import { useSessionLog } from '../components/useSessionLog';
import { useFirstLineInvite } from '../components/useFirstLineInvite';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';
import { copyText } from '../store/clipboard';
import { ChromeHandle } from '../components/WritingShell';
import { PortToBoardSheet } from '../components/PortToBoardSheet';
import { AddToSheet } from '../components/AddToSheet';
import { PinToBoardSheet } from '../components/PinToBoardSheet';
import { useActionToast } from '../components/ActionToast';
import { AmbientGlow, ProgressBar, TypewriterToggle, useGoalProgress, WORD_GOAL } from '../components/WritingIncentives';
import { useTypewriterFade, JOURNAL_HOLD_BAND } from '../components/useTypewriterFade';
import { useWayBack } from '../components/useWayBack';
import { setCaretOffset } from '../store/caretOffset';
import { useWritingSettings, setTypewriterExplicit } from '../store/writingSettings';
import { useLexicon } from '../store/themeLexicon';
// B2.1 S6 — a deliberate SECOND lexicon import beside the file's own
// established themeLexicon usage (lex('journal')/lex('page') below): the
// legacy (<1100px) scrap-routing block's "Project" strings retire to
// "Drawer" (no stored-Drawer entity is rendered anywhere in this block —
// getProjects() here is a flat, ungrouped list, unlike PinToBoardSheet/
// PortToBoardSheet's drawer-grouped pickers), matching the SAME word this
// exact block already used one line above it (the pre-existing "even if
// you never file it to a Drawer or the Shelf" autosave note, untouched —
// not in this fold's gated list). deskLexicon, not themeLexicon, because
// "Drawer" the chrome word is deskLexicon's own vocabulary (themeLexicon's
// 'drawer' term names a different, older entity and has no Flux override
// for this newer sense).
import { useDeskLexicon } from '../store/deskLexicon';
import { DeskFrame, useDeskFrameViewport } from '../components/DeskFrame';
import { ModeStrip } from '../components/ModeStrip';
import { Sliver, CAPTURE_ITEMS, type SliverContent } from '../components/Sliver';
import { Tutor } from '../components/Tutor';
import { GoalGlow } from '../components/GoalGlow';
import { useCascade } from '../components/Cascade';
import type { PageFaceSubject } from '../components/PageFace';
import type { JournalEntry as JournalEntryType, Stroke, StrokePoint } from '../types';

// J4 — the entry read view: full text, read-only, on a lit paper page.
// J2 — fills the reserved slot with pull-based routing (branch-copy: the entry's
//      text is never modified).
// J6 — light, optional emergent metadata: star, free-text tags, and a routed
//      marker (stamped when J2 routes the scrap). All additive, written via
//      saveJournalEntry, synced via the existing journalEntries path.
// J9 — a stylus ink layer over the sheet: pen-only (palm/finger rejected),
//      strokes captured device-independently and persisted to entry.strokes
//      (J8). All painting goes through ink.ts/renderStroke; one pen.
// J10 — directly-authored pages (source: 'page'): the sheet becomes editable
//      text with no-take-backs permanence (forward-only typing, no erasure),
//      a debounced autosave to entry.text, and a unified one-level undo that
//      covers the last action whether a typed run or an ink stroke. Captures
//      (finished sprints) keep J9's read-only text + ink annotation, unchanged.

const SCRAP_HEADING = '— from the journal —';
const AUTOSAVE_MS = 2000;   // matches QuickSprint's debounced draft autosave
const BURST_GAP_MS = 1500;  // idle gap that starts a new typing run (undo unit)

function appendScrap(existing: string, entryText: string): string {
  const block = `${SCRAP_HEADING}\n${entryText}`;
  return existing.trim() ? `${existing}\n\n${block}` : block;
}

function routedTitle(text: string): string {
  return firstLine(text).slice(0, 80);
}

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// --- ink layer (J9) -------------------------------------------------------
// Size a canvas's backing store to its CSS box scaled by devicePixelRatio so
// lines stay crisp, and put the 2D context into CSS-pixel space.
function syncCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// Paint all committed strokes. Denormalizes by the sheet's current width, so a
// page drawn at one width keeps its ink in place when the text reflows at
// another (the J9 sheet-model tradeoff — ink anchors to the sheet, not words).
// On an authored page the sheet grows with the text; the ResizeObserver re-runs
// this so existing strokes re-render correctly at the new height.
function paintCommitted(canvas: HTMLCanvasElement | null, sheet: HTMLElement | null, strokes: Stroke[]): void {
  if (!canvas || !sheet) return;
  const rect = sheet.getBoundingClientRect();
  const ctx = syncCanvas(canvas, rect.width, rect.height);
  if (!ctx) return;
  ctx.clearRect(0, 0, rect.width, rect.height);
  const color = inkColor();
  for (const s of strokes) renderStroke(ctx, s, rect.width, color);
}

// Put the caret at the end of a contenteditable (after seeding text or undo).
function placeCaretEnd(el: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

// The last reversible action — a typing run (its pre-run text) or an ink stroke.
type LastAction = { type: 'text'; before: string } | { type: 'stroke' } | null;

function JournalEntryView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: lex } = useLexicon();
  const { t: deskT } = useDeskLexicon();
  const [picking, setPicking] = useState(false);
  const [portOpen, setPortOpen] = useState(false); // J4 — "Port to a Board…" sheet
  const [addOpen, setAddOpen] = useState(false); // J5 — "Add to…" sheet (single-page flow)
  const [pinOpen, setPinOpen] = useState(false); // AB4 S2 — "Pin to a Board…" sheet
  const toast = useActionToast();
  const [tabPrompt, setTabPrompt] = useState(false); // B4 #11 — file-it-first prompt
  const [tagDraft, setTagDraft] = useState('');
  const [entry, setEntry] = useState<JournalEntryType | null>(() => (id ? getJournalEntry(id) : null));
  // AB2 S6 — the R2 ruling (ab1-review-fable.md): the Journal's page enters
  // the frame. >=1100px only; below the gate this is byte-identical legacy
  // JSX (the AB1 pattern exactly), which is also why the existing
  // JournalEntry-flavored harness checks stay green untouched.
  const framed = useDeskFrameViewport();

  // Chrome recede on write/draw (same engine as the sprint/page surfaces): typing
  // or drawing dissolves the surrounding menus + text; the sheet + ink never fade.
  // The sheet (.entry-full) is the "editor", so taps/strokes on it don't summon
  // the chrome back (only an edge / Esc / tap-off does). Drives WritingSession, so
  // the global header + DeskRail recede in step.
  const pageRef = useRef<HTMLDivElement | null>(null);
  const { dissolved, noteWrite, resurface } = useChromeDissolve({ surface: 'journal', editorSelector: '.entry-full', rootRef: pageRef });
  const noteWriteRef = useRef<() => void>(() => {});
  noteWriteRef.current = noteWrite;

  // All hooks run before the early return below so hook order is stable.
  // Ink (J9): strokes held in state (seeded from the entry) as the render/undo
  // source of truth. Text (J10): pageTextRef is the single source of truth for
  // the entry's text in this component — every write merges it, so metadata
  // (star/tags/route) and ink writes never clobber freshly-typed text.
  const [strokes, setStrokes] = useState<Stroke[]>(() => (id ? getJournalEntry(id)?.strokes ?? [] : []));
  const [canUndo, setCanUndo] = useState(false); // one-level undo: only the last action
  // J2 — pen/eraser toggle. Session-scoped: a freshly opened page always arms the
  // pen. Mirrored to a ref so the pointer-handler effect (mounted once per `id`)
  // reads the live value without a stale closure (same pattern as noteWriteRef).
  const [eraserArmed, setEraserArmed] = useState(false);
  const eraserArmedRef = useRef(false);
  eraserArmedRef.current = eraserArmed;
  const ringRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const committedRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef<HTMLCanvasElement | null>(null);
  const editRef = useRef<HTMLDivElement | null>(null);
  const strokesRef = useRef<Stroke[]>(strokes);
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const captureRectRef = useRef<DOMRect | null>(null);
  const authoredRef = useRef<boolean>(id ? getJournalEntry(id)?.source === 'page' : false);
  const pageTextRef = useRef<string>(id ? getJournalEntry(id)?.text ?? '' : '');
  const lastActionRef = useRef<LastAction>(null);
  const lastTextMsRef = useRef(0);
  const touchedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Warm start (F2) — only lands on an authored page (editRef is null on a
  // read-only capture, so the hook no-ops there). Measured over the last
  // paragraph, released on the first forward keystroke (onInput) or after 6s.
  const location = useLocation();
  const warmRef = useRef(!!(location.state as { warmStart?: boolean } | null)?.warmStart);
  // AB4 S4 — "way back guaranteed" for a page-pin card's double-click
  // travel (BoardEditor.tsx). Mirrors F2's own warm-start precedent above:
  // a one-shot signal riding `navigate(..., { state })`, read once at
  // render (not stripped — unlike warmStart's one-time glow, a stable
  // navigational affordance is fine to persist across in-session back/
  // forward). Framed-only (this ticket's whole cascade/sliver system is)
  // — legacy (<1100px) stays byte-identical, no chip there.
  const fromBoard = (location.state as { fromBoardId?: string } | null)?.fromBoardId ?? null;
  const warm = useWarmStart(warmRef.current, editRef, sheetRef);
  const warmReleaseRef = useRef<() => void>(() => {});
  warmReleaseRef.current = warm.release;

  // F5 — TTFK session, only for an authored page (a read-only capture that's
  // merely viewed stays out of the funnel). firstKeystroke rides onInput below.
  const noteSessionKeystroke = useSessionLog('journal', {
    projectId: () => (id ? getJournalEntry(id)?.projectId ?? null : null),
    words: () => { const t = pageTextRef.current.trim(); return t ? t.split(/\s+/).length : 0; },
    enabled: () => authoredRef.current,
  });
  const sessionKsRef = useRef<() => void>(() => {});
  sessionKsRef.current = noteSessionKeystroke;

  // F6 — the first-line invitation. Truly empty = authored AND no text AND zero ink
  // (DoD 4: an ink-only page is NOT empty — no invitation over ink). A read-only
  // capture reports not-empty (authoredRef false), so nothing renders there.
  const invite = useFirstLineInvite(() => authoredRef.current && pageTextRef.current.length === 0 && strokesRef.current.length === 0);
  const inviteDismissRef = useRef<() => void>(() => {});
  inviteDismissRef.current = invite.dismiss;

  // W2 — the way back. Authored pages only (a read-only capture has no
  // writing session to depart from — no-op via the authoredRef guards below,
  // matching F5/F6's own gating pattern). This surface window-scrolls (the
  // ink layer can't sit in a fixed-height box — see useTypewriterFade), so
  // scroll capture/restore reads/writes window.scrollY, not a container.
  useWayBack({
    entryId: id ?? '',
    useWindowScroll: true,
    editorEl: () => (authoredRef.current ? editRef.current : null),
    applyScrollY: y => { if (authoredRef.current) window.scrollTo(0, y); },
    applyCaret: offset => { if (authoredRef.current && editRef.current) setCaretOffset(editRef.current, offset); },
  });

  // Incentive layer (glow + progress bar + typewriter) — brought to parity with
  // the mode-aware editor (ModeStage). Authored pages only; a read-only capture
  // is a finished artifact, not a writing session in progress. `words` is a
  // real state (not just the ref) so the bar/glow re-render live as you type.
  const writingSettings = useWritingSettings();
  const [words, setWords] = useState(() => wordCount(pageTextRef.current));
  // CD1 S6 — the goal system's own live text (store/lineEquivalents.ts
  // needs the raw text, not a word count). `pageTextRef` already tracks
  // this on every keystroke but is a ref (no re-render); this small sibling
  // state gives the sliver's goal foot + the glow something reactive to
  // read, mirroring `words`' own pattern immediately above.
  const [goalText, setGoalText] = useState(() => pageTextRef.current);
  const authored = authoredRef.current;
  const glowM = Math.pow(Math.min(1, words / WORD_GOAL), 0.55);
  const { frac: lapFrac, celebrating } = useGoalProgress(words, WORD_GOAL);
  const typewriterOn = authored && writingSettings.typewriter;
  // FX4 S1 — the Journal carve-out retires: this call now passes its own
  // tuned holdBand (JOURNAL_HOLD_BAND) instead of inheriting the shared
  // TYPEWRITER_BAND unchanged, and the sheet (sheetRef/.entry-full) gains
  // real start-offset behavior for the first time via index.css's new
  // `.entry-full[data-typewriter='true']{ padding-top:var(--tw-start-offset) }`
  // rule — see that rule's own comment, and useTypewriterFade.ts's S1
  // comment, for the full ink-coordinate safety proof (the sheet's own
  // getBoundingClientRect() top/left/width — the ONLY thing normPoint/
  // paintCommitted/renderStroke ever key off — is provably unmoved by its
  // own padding-top; only its height grows, exactly like this sheet already
  // does at its BOTTOM edge as text is typed).
  useTypewriterFade({ enabled: typewriterOn, containerRef: sheetRef, editorSelector: '.entry-edit', useWindowScroll: true, holdBand: JOURNAL_HOLD_BAND });

  // J1 — walk the notebook with the ← / → keys (loose pages only), NEVER while an
  // editable has focus or mid-IME (the F3 shortcut-guard pattern). Self-contained
  // so it needs no prev/next in deps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      const cur = id ? getJournalEntry(id) : null;
      if (!cur || cur.projectId != null || cur.shelved) return; // loose notebook only
      const nb = getNotebookPages();
      const i = nb.findIndex(p => p.id === id);
      if (i < 0) return;
      const target = e.key === 'ArrowLeft' ? nb[i - 1] : nb[i + 1];
      if (target) { e.preventDefault(); navigate(`/journal/${target.id}`); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, navigate]);

  // Repaint committed ink on mount and whenever the stroke set changes. Nothing
  // here is gated behind a motion flag — nothing animates; this is a static
  // repaint, so reduced-motion needs no branch.
  useEffect(() => {
    strokesRef.current = strokes;
    paintCommitted(committedRef.current, sheetRef.current, strokes);
  }, [strokes]);

  // Keep ink positioned when the sheet's width OR height changes (as authored
  // text grows the sheet, existing strokes re-render at the new size).
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => paintCommitted(committedRef.current, sheetRef.current, strokesRef.current));
    ro.observe(sheet);
    return () => ro.disconnect();
  }, []);

  // Pen-only capture (J9). Listeners live on the sheet (not the pass-through
  // canvas) and are non-passive so a pen move can preventDefault scroll.
  // Touch/mouse are ignored here and fall through — a resting palm registers as
  // touch, so it's rejected for free. A pen never types; a key never inks.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !id) return;

    const normPoint = (e: PointerEvent): StrokePoint => {
      const rect = captureRectRef.current ?? sheet.getBoundingClientRect();
      const w = rect.width || 1;
      const point: StrokePoint = { x: (e.clientX - rect.left) / w, y: (e.clientY - rect.top) / w };
      if (e.pressure > 0) point.p = Math.round(e.pressure * 1000) / 1000;
      return point;
    };
    // J2 — "rubbing, not stamping": committedRef and activeRef are separate
    // canvases, so painting destination-out onto the empty, per-frame-cleared
    // active canvas would erase nothing visible. An in-progress erase stroke
    // instead paints straight onto the COMMITTED canvas each move (no clear —
    // destination-out only removes, so redrawing the accumulated path is
    // idempotent); onUp's full paintCommitted repaint then reproduces the same
    // result, and onCancel repaints from strokesRef to undo any live rub-out.
    const paintActive = () => {
      const stroke = activeStrokeRef.current;
      const rect = captureRectRef.current;
      if (!stroke || !rect) return;
      if (stroke.eraser) {
        const ctx = committedRef.current?.getContext('2d');
        if (ctx) renderStroke(ctx, stroke, rect.width, inkColor());
        return;
      }
      const canvas = activeRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, rect.width, rect.height);
      renderStroke(ctx, stroke, rect.width, inkColor());
    };
    const clearActive = () => {
      const canvas = activeRef.current;
      const rect = captureRectRef.current;
      if (!canvas || !rect) return;
      canvas.getContext('2d')?.clearRect(0, 0, rect.width, rect.height);
    };
    // Persist strokes, merging the live text so a pending typed run is never
    // lost (text from pageTextRef; on a capture it equals the stored text).
    const persist = (next: Stroke[]) => {
      const latest = getJournalEntry(id);
      if (!latest) return;
      saveJournalEntry({ ...latest, text: pageTextRef.current, strokes: next });
      setEntry(getJournalEntry(id));
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'pen') return; // palm/finger/mouse fall through (and to text on authored pages)
      if ((e.target as Element | null)?.closest?.('.ink-undo, .ink-tool-toggle')) return;
      e.stopPropagation(); // keep the pen off the editable text node (no caret, no handwriting)
      // I0 Slice 2 hardening (Samsung S25 / Chrome S-Pen). `touch-action:none` +
      // capture-phase preventDefault stopped OS handwriting on older builds but a
      // OneUI/Chrome update now converts the stroke to text anyway (Samsung's
      // "handwriting to text" watches the FOCUSED editable, largely independent of
      // touch-action/JS-default). So for the duration of a pen stroke we make the
      // editable a NON-target: blur it and drop contenteditable, restored on lift.
      // With no focused editable to convert into, the recognizer has nowhere to
      // insert; the stroke goes to the ink canvas only. Finger typing resumes on
      // the next tap (a tap re-focuses and places the caret). Captures have no
      // editable — this is a no-op there.
      const edit = editRef.current;
      if (edit) { try { edit.blur(); } catch { /* */ } edit.setAttribute('contenteditable', 'false'); }
      // A short pen stroke over existing text was starting a TEXT SELECTION (which
      // yanks the writer out of drawing). Clear any live selection and forbid
      // selection on the sheet for the duration of the stroke; restored on lift.
      try { window.getSelection()?.removeAllRanges(); } catch { /* */ }
      sheet.style.setProperty('user-select', 'none');
      sheet.style.setProperty('-webkit-user-select', 'none');
      noteWriteRef.current(); // recede the chrome on draw
      captureRectRef.current = sheet.getBoundingClientRect();
      const ac = activeRef.current;
      if (ac) syncCanvas(ac, captureRectRef.current.width, captureRectRef.current.height);
      drawingRef.current = true;
      // J2 — the toggle is the guaranteed path; a hardware eraser tip is a bonus
      // signal on top of it. Per the Pointer Events spec the eraser end reports
      // pointerType 'pen' with the eraser-button bit (32) set in `buttons` — no
      // platform is known to report a distinct pointerType for it. The actual
      // per-device matrix (what a given stylus/OS/browser combo really sends) is
      // the S25 hardware pass's job to document, not something headless can see.
      const hwErase = (e.buttons & 32) !== 0;
      const stroke: Stroke = { points: [normPoint(e)] };
      if (eraserArmedRef.current || hwErase) stroke.eraser = true;
      activeStrokeRef.current = stroke;
      try { sheet.setPointerCapture(e.pointerId); } catch { /* capture is best-effort */ }
      e.preventDefault();
      paintActive();
    };
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current || e.pointerType !== 'pen') return;
      e.preventDefault();
      activeStrokeRef.current?.points.push(normPoint(e));
      paintActive();
    };
    // Restore the editable after a stroke (it stays BLURRED — the writer taps to
    // resume typing — so re-enabling it can't hand the recognizer a focused target).
    const restoreEditable = () => {
      const edit = editRef.current;
      if (edit) edit.setAttribute('contenteditable', 'plaintext-only');
      sheet.style.removeProperty('user-select');
      sheet.style.removeProperty('-webkit-user-select');
    };
    const onUp = (e: PointerEvent) => {
      if (!drawingRef.current || e.pointerType !== 'pen') return;
      e.preventDefault();
      drawingRef.current = false;
      restoreEditable();
      const stroke = activeStrokeRef.current;
      activeStrokeRef.current = null;
      try { sheet.releasePointerCapture(e.pointerId); } catch { /* */ }
      if (stroke && stroke.points.length > 0) {
        const next = [...strokesRef.current, stroke];
        strokesRef.current = next;
        paintCommitted(committedRef.current, sheet, next); // paint now to avoid a 1-frame gap
        clearActive();
        setStrokes(next);
        lastActionRef.current = { type: 'stroke' }; // a stroke is now the last action (undo target)
        setCanUndo(true);
        touchedRef.current = true;
        persist(next);
      } else {
        clearActive();
      }
    };
    const onCancel = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      restoreEditable();
      const wasErasing = activeStrokeRef.current?.eraser;
      activeStrokeRef.current = null;
      try { sheet.releasePointerCapture(e.pointerId); } catch { /* */ }
      clearActive();
      // J2 — a cancelled erase already rubbed pixels straight onto the committed
      // canvas (paintActive) with no corresponding entry in strokesRef; repaint
      // from the authoritative array to undo the stray in-progress rub-out.
      if (wasErasing) paintCommitted(committedRef.current, sheet, strokesRef.current);
    };

    // J2 — ring preview: a quiet ERASER_WIDTH-diameter ring follows the pen while
    // the eraser is armed, so aim is possible before touching down. Render-only:
    // a bubble-phase, passive listener that never intercepts input or changes
    // capture behavior; positioned imperatively (not React state) to avoid a
    // render on every pointermove. Tracks hover where the device reports it, and
    // continues to track during an active stroke too (same listener).
    const onHover = (e: PointerEvent) => {
      const ring = ringRef.current;
      if (!ring) return;
      if (!eraserArmedRef.current || e.pointerType !== 'pen') { ring.style.display = 'none'; return; }
      const rect = sheet.getBoundingClientRect();
      ring.style.display = 'block';
      ring.style.left = `${e.clientX - rect.left}px`;
      ring.style.top = `${e.clientY - rect.top}px`;
    };
    const onLeave = () => { const ring = ringRef.current; if (ring) ring.style.display = 'none'; };

    // CAPTURE phase (fix-journal-ink): on an authored page the editable text node
    // is the pen's event TARGET, so a bubble-phase listener fired AFTER it — and OS
    // stylus handwriting (which converts the pen to text) had already won at the
    // target. Listening in the capture phase lets the sheet intercept a pen FIRST
    // and preventDefault the handwriting/default action, so the stroke goes to the
    // ink canvas, never the text field. Non-pen (finger/mouse) still falls through
    // (onDown returns without preventDefault), so caret/typing are unaffected.
    const opts = { passive: false, capture: true } as const;
    sheet.addEventListener('pointerdown', onDown, opts);
    sheet.addEventListener('pointermove', onMove, opts);
    sheet.addEventListener('pointerup', onUp, opts);
    sheet.addEventListener('pointercancel', onCancel, opts);
    // Ring preview: ordinary bubble-phase + passive — it only reads position,
    // never blocks or redirects anything the capture-phase listeners above do.
    const hoverOpts = { passive: true } as const;
    sheet.addEventListener('pointermove', onHover, hoverOpts);
    sheet.addEventListener('pointerleave', onLeave, hoverOpts);
    return () => {
      sheet.removeEventListener('pointerdown', onDown, opts);
      sheet.removeEventListener('pointermove', onMove, opts);
      sheet.removeEventListener('pointerup', onUp, opts);
      sheet.removeEventListener('pointercancel', onCancel, opts);
      sheet.removeEventListener('pointermove', onHover);
      sheet.removeEventListener('pointerleave', onLeave);
    };
  }, [id]);

  // J2 — hide the ring immediately on disarm (not just on the next pointermove).
  useEffect(() => {
    if (!eraserArmed && ringRef.current) ringRef.current.style.display = 'none';
  }, [eraserArmed]);

  // Authored-page text editing (J10). Captures skip this entirely (read-only
  // text). On an authored page: seed + focus the editable sheet, enforce
  // forward-only permanence (no Backspace/Delete/cut/select-then-replace),
  // autosave to entry.text, and on exit discard an empty never-touched page.
  useEffect(() => {
    const el = editRef.current;
    if (!authoredRef.current || !el || !id) return;

    el.setAttribute('contenteditable', 'plaintext-only'); // plain text only
    // Suppress OS stylus handwriting-to-text on the editable region (J10.1).
    // Chromium treats handwriting as a direct-manipulation action governed by
    // touch-action; pan-y permits it (which is why pen-move preventDefault
    // stops scroll but not handwriting). touch-action:none on the editable
    // removes it so the pen reaches the app's canvas-ink handlers and no text
    // is inserted — set imperatively here alongside the style for belt-and-
    // suspenders. Finger scroll stays on the page/sheet container (taps still
    // place the caret; only finger-DRAG over the text no longer pans). The
    // handwriting attribute is an early proposal — harmless if unsupported.
    el.style.touchAction = 'none';
    el.setAttribute('handwriting', 'false');
    el.innerText = pageTextRef.current;
    el.focus();
    placeCaretEnd(el);

    const flushText = () => {
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
      const latest = getJournalEntry(id);
      if (latest && latest.text !== pageTextRef.current) {
        saveJournalEntry({ ...latest, text: pageTextRef.current });
        setEntry(getJournalEntry(id));
      }
    };
    const scheduleSave = () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(flushText, AUTOSAVE_MS);
    };

    // Word-level deletion. Backspace removes the whole word before the caret,
    // Delete the whole word after — one word per press, any length, using the
    // browser's native word boundaries (Ctrl+Backspace semantics, caret-aware).
    // Performed via the Range API so it bypasses the beforeinput delete-rail
    // below; there is no single-character path. Repeated presses walk back word
    // by word. Not wired into undo — the looping-arrow still reverses the last
    // typed run or ink stroke, unchanged.
    const deleteWord = (direction: 'backward' | 'forward') => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (sel.isCollapsed) {
        if (typeof sel.modify !== 'function') return; // no word API → stay forward-only (no deletion)
        sel.modify('extend', direction, 'word');
      }
      if (sel.isCollapsed) return; // caret already at a boundary → nothing to remove
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      pageTextRef.current = el.innerText;
      setWords(wordCount(el.innerText));
      touchedRef.current = true;
      scheduleSave();
    };

    // Permanence rail: typing is forward-only and selections can't be replaced;
    // erasure is intercepted and routed to word-granular deletion (never a
    // single character).
    const onBeforeInput = (e: InputEvent) => {
      const it = e.inputType || '';
      if (it.startsWith('delete')) {
        e.preventDefault(); // cancel the native (often single-character) deletion
        deleteWord(it.toLowerCase().includes('forward') ? 'forward' : 'backward');
        return;
      }
      // Voice Wall (VW): external prose pasted/dropped into this prose surface
      // imports a foreign voice — block it and whisper once. (The J10 editable was
      // a hole in the wall until now.) Slice 4: own ink passes silently, routed
      // through execCommand('insertText') — the same native path plain typing
      // uses here (this surface has no separate append function; onInput reads
      // el.innerText either way), so autosave/caret/onInput all fire as normal.
      if (it === 'insertFromPaste' || it === 'insertFromDrop') {
        const text = extractIncomingText(e);
        if (shadowAllows(text)) {
          e.preventDefault();
          // An allowed own-ink paste over a live selection would otherwise
          // REPLACE it via execCommand — select-then-replace through the
          // back door, violating the surface's forward-only law. Collapse
          // to end first so the paste always appends, never replaces.
          const activeSel = window.getSelection();
          if (activeSel && !activeSel.isCollapsed) activeSel.collapseToEnd();
          document.execCommand('insertText', false, text);
          return;
        }
        e.preventDefault(); notePasteBlocked(); return;
      }
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) { e.preventDefault(); return; } // no select-then-replace
      // Allowed forward insertion — set the typing-run boundary using the
      // pre-change text (available now, before the DOM mutates). Undo reverses
      // the whole current burst, not one character.
      const now = Date.now();
      const la = lastActionRef.current;
      const idle = now - lastTextMsRef.current > BURST_GAP_MS;
      if (!la || la.type !== 'text' || idle) {
        lastActionRef.current = { type: 'text', before: el.innerText };
        setCanUndo(true);
      }
      lastTextMsRef.current = now;
      touchedRef.current = true;
    };
    const onInput = () => {
      pageTextRef.current = el.innerText;
      setWords(wordCount(el.innerText));
      setGoalText(el.innerText);
      touchedRef.current = true;
      noteWriteRef.current(); // recede the chrome on write
      warmReleaseRef.current(); // release the warm-start glow on the first forward keystroke
      sessionKsRef.current(); // stamp TTFK on the first content keystroke (F5)
      inviteDismissRef.current(); // dismiss the first-line invitation for this page (F6)
      scheduleSave();
    };
    // Hardware-keyboard path: a plain Backspace/Delete fires keydown (and would
    // otherwise delete one character). Cancel it and delete a whole word. The
    // preventDefault stops the native edit, so beforeinput won't also fire for
    // this press — no double deletion. (Soft keyboards that skip keydown are
    // handled by the beforeinput branch above.)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') { e.preventDefault(); deleteWord('backward'); }
      else if (e.key === 'Delete') { e.preventDefault(); deleteWord('forward'); }
    };
    const onCut = (e: Event) => e.preventDefault(); // cut would remove text (copy-out is NOT blocked)
    const onPasteDrop = (e: Event) => { // VW: foreign-voice wall (Slice 4: own ink passes silently)
      const text = extractIncomingText(e);
      if (shadowAllows(text)) {
        e.preventDefault();
        const activeSel = window.getSelection(); // collapse first: an allowed
        if (activeSel && !activeSel.isCollapsed) activeSel.collapseToEnd(); // paste must append, never replace a selection
        document.execCommand('insertText', false, text);
        return;
      }
      e.preventDefault(); notePasteBlocked();
    };
    const onHide = () => { if (document.visibilityState === 'hidden') { flushText(); flushNow(); } };

    el.addEventListener('beforeinput', onBeforeInput as EventListener);
    el.addEventListener('input', onInput);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('cut', onCut);
    el.addEventListener('paste', onPasteDrop);
    el.addEventListener('drop', onPasteDrop);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      el.removeEventListener('beforeinput', onBeforeInput as EventListener);
      el.removeEventListener('input', onInput);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('cut', onCut);
      el.removeEventListener('paste', onPasteDrop);
      el.removeEventListener('drop', onPasteDrop);
      document.removeEventListener('visibilitychange', onHide);
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
      // New-page lifecycle: discard an empty, never-touched page rather than
      // litter the journal with a blank entry (honor-discard, J1a). Otherwise
      // flush any pending text edit before teardown.
      const latest = getJournalEntry(id);
      if (!latest) return;
      if (!touchedRef.current && !pageTextRef.current.trim() && strokesRef.current.length === 0) {
        saveJournalEntry({ ...latest, deletedAt: new Date().toISOString() });
      } else if (latest.text !== pageTextRef.current) {
        saveJournalEntry({ ...latest, text: pageTextRef.current });
      }
      flushNow();
    };
  }, [id]);

  if (!entry) return <Navigate to="/journal" replace />;
  // F1 route hygiene — a TYPED page (a binder chapter/support page, B1) is owned by
  // the mode-aware editor; never open it in the ink-authored view. Legacy untyped
  // filed pages stay here (ink preservation is load-bearing).
  if (entry.pageType != null) return <Navigate to={`/page/${entry.id}`} replace />;

  const projects = getProjects();
  const routedIds = entry.routedProjectIds ?? [];

  // J1 — notebook navigation, loose Journal pages only (filed + Shelf show none).
  const isLoose = entry.projectId == null && !entry.shelved;
  const notebook = isLoose ? getNotebookPages() : [];
  const nbIndex = isLoose ? notebook.findIndex(p => p.id === entry.id) : -1;
  const prevPage = nbIndex > 0 ? notebook[nbIndex - 1] : null;
  const nextPage = nbIndex >= 0 && nbIndex < notebook.length - 1 ? notebook[nbIndex + 1] : null;
  const openLoose = (afterId?: string) => navigate(`/journal/${createLoosePage(afterId).id}`);
  // J12: an entry can carry ink and/or text. A drawing-only entry (no text) has
  // nothing to route — its prose would be empty — so the routing action is
  // hidden; ink stays in the journal. A mixed entry routes its text as usual.
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  const textEmpty = !entry.text.trim();

  // Every write merges the live text (pageTextRef) so star/tags/routing never
  // clobber a freshly-typed run that the debounced autosave hasn't flushed yet.
  const patch = (changes: Partial<JournalEntryType>) => {
    const latest = getJournalEntry(entry.id) ?? entry;
    saveJournalEntry({ ...latest, text: pageTextRef.current, ...changes });
    setEntry(getJournalEntry(entry.id));
  };

  const toggleStar = () => patch({ starred: !entry.starred });

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    const tags = entry.tags ?? [];
    if (!tags.includes(t)) patch({ tags: [...tags, t] });
    setTagDraft('');
  };
  const removeTag = (t: string) => patch({ tags: (entry.tags ?? []).filter(x => x !== t) });

  // Stamp the routed marker (unique project ids) — closes the double-route gap.
  const stampRouted = (projectId: string) => {
    if (routedIds.includes(projectId)) return;
    patch({ routedProjectIds: [...routedIds, projectId] });
  };

  const sendToProject = (projectId: string) => {
    const project = getProject(projectId);
    if (!project) return;
    setProjectSprintText(projectId, appendScrap(project.sprintText || '', pageTextRef.current));
    stampRouted(projectId);
    navigate(`/project/${projectId}`);
  };

  const promoteToNew = () => {
    const text = pageTextRef.current;
    const project = createQuickSprintProject(text, routedTitle(text));
    stampRouted(project.id);
    navigate(`/project/${project.id}`);
  };

  const routedNames = routedIds.map(pid => getProject(pid)?.title).filter(Boolean) as string[];

  // AB3 S2 — the Page face's subject (canon amendment A1: the face describes
  // the thing under the writer's attention; `subject`, not `currentPage`, so
  // AB4 plugs in a different subject kind without surgery here). S3: this is
  // what supersedes the below-page metadata cluster on framed surfaces.
  const homeProject = entry.projectId ? getProject(entry.projectId) : null;
  // AB4 S2 — every board currently pinning this page, for the truthful
  // "Also pinned to <board>." membership line(s).
  const pinnedBoardTitles = getBoardsPinning(entry.id).map(b => b.title);
  const { homeLabel, memberships } = describePageHome(entry, homeProject, pinnedBoardTitles);
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry,
    homeLabel,
    memberships,
    // The saved-silently line — its only appearance anywhere once framed.
    footer: entry.projectId == null ? 'Saved automatically — even if you never file it to a Drawer or the Shelf.' : undefined,
    onToggleStar: toggleStar,
    onAddTag: addTag,
    onRemoveTag: removeTag,
    onOpenPortToBoard: () => setPortOpen(true),
    onOpenPin: () => setPinOpen(true),
  };

  // CD2 S1/S5 — the cascade, replacing the Drawer whole (see Cascade.tsx's
  // own header comment for why this is a hook, not a component).
  const cascade = useCascade({ subject: pageFaceSubject, project: homeProject, navigate });

  // Unified undo: one quiet step, the last action only (a typed run or a
  // stroke). Not a history stack — once consumed, nothing is undoable until a
  // new action. A text run restores the pre-run text; a stroke drops the last.
  const undo = () => {
    const la = lastActionRef.current;
    if (!la) return;
    if (la.type === 'stroke') {
      const next = strokesRef.current.slice(0, -1);
      strokesRef.current = next;
      setStrokes(next);
      const latest = getJournalEntry(entry.id);
      if (latest) {
        saveJournalEntry({ ...latest, text: pageTextRef.current, strokes: next });
        setEntry(getJournalEntry(entry.id));
      }
    } else {
      pageTextRef.current = la.before;
      setWords(wordCount(la.before));
      setGoalText(la.before);
      const el = editRef.current;
      if (el) { el.innerText = la.before; placeCaretEnd(el); }
      const latest = getJournalEntry(entry.id);
      if (latest) {
        saveJournalEntry({ ...latest, text: la.before });
        setEntry(getJournalEntry(entry.id));
      }
    }
    lastActionRef.current = null;
    setCanUndo(false);
  };

  // AB2 S6 — the shared writing-surface body (ink layer, editable sheet,
  // incentive layer, and every below-the-page metadata cluster), factored
  // out so the framed and legacy returns below can't drift from each other
  // (the same reason PageEditor.tsx's `editorBody` exists). Only the OUTER
  // shell — wayfinding, the mode strip / legacy tab row, the frame itself —
  // forks on `framed`; the sheet and everything about THIS document stay
  // byte-identical either way, including their DOM position (PAGE IS
  // PRIMARY: the metadata/star band keeps its below-the-page position
  // inside the stage column, framed or not).
  const pageBody = (
    <>
      {/* THE WRITING SURFACE — primary, prominent, centered. The ambient glow
          sits behind it (authored pages only — a read-only capture isn't a
          session in progress; framed — DeskFrame's own meter/glow tracks stay
          empty/reserved this ticket, matching ModeStage's own framed gate). */}
      <div style={{ position: 'relative' }}>
        {authored && !framed && <AmbientGlow m={glowM} />}
        <div
          ref={sheetRef}
          className="paper-page entry-full"
          data-typewriter={typewriterOn ? 'true' : 'false'}
          style={{
            position: 'relative', maxWidth: '68ch', minHeight: '60vh', whiteSpace: 'pre-wrap', touchAction: 'pan-y',
            color: 'var(--ink-on-paper)', fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
          }}
        >
        {/* Typewriter fade (B2, window-scroll variant — see useTypewriterFade.ts).
            A sticky gradient pinned to the viewport top, opacity gated by
            data-scrolled (set on this sheet) so a fresh/short page's first line
            stays full opacity (C2). Purely visual; the actual hold/jolt
            auto-scroll is the hook above. */}
        {typewriterOn && <div aria-hidden="true" className="entry-typewriter-fade" />}
        {/* On an authored page the text is an editable plaintext sheet, matching
            the read view's metrics exactly so the ink canvas stays aligned. On a
            capture it stays read-only text (J9). The contenteditable is set/read
            imperatively (uncontrolled) so React re-renders never reset the caret. */}
        {authored ? (
          <div
            ref={editRef}
            className="entry-edit"
            role="textbox"
            aria-multiline="true"
            aria-label={`${lex('journal')} ${lex('page').toLowerCase()}`}
            spellCheck
            // touchAction:'none' suppresses OS stylus handwriting on the text
            // (J10.1) without disabling page/finger scroll on the container.
            style={{ outline: 'none', whiteSpace: 'pre-wrap', minHeight: '54vh', touchAction: 'none' }}
          />
        ) : (
          entry.text
        )}
        {/* First-line invitation (F6) — render-only, a sibling outside the editable
            node; never selectable/serialized. Only on a truly empty authored page. */}
        {invite.node}
        {/* Warm-start glow (F2) — render-only overlay over the last paragraph;
            never inside the editable node. Under the ink canvases (later siblings). */}
        {warm.rect && (
          <div
            aria-hidden="true"
            className={`wz-warm${warm.settled ? ' wz-warm--settled' : ''}`}
            style={{ position: 'absolute', top: warm.rect.top, left: warm.rect.left, width: warm.rect.width, height: warm.rect.height }}
          />
        )}
        {/* Ink overlay (J9). Both canvases cover the sheet exactly and never
            intercept input (pointer-events:none) — the pen is routed by the
            sheet's own listeners; text stays editable/selectable underneath. */}
        <canvas
          ref={committedRef}
          className="ink-canvas ink-committed"
          aria-hidden="true"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: 'inherit' }}
        />
        <canvas
          ref={activeRef}
          className="ink-canvas ink-active"
          aria-hidden="true"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: 'inherit' }}
        />
        {/* J2 — eraser ring preview: quiet-but-visible, ERASER_WIDTH diameter,
            centered on the pen. Hidden by default; shown/positioned imperatively
            (see onHover above) so it never triggers a React render on move. */}
        <div
          ref={ringRef}
          className="ink-eraser-ring"
          aria-hidden="true"
          style={{
            position: 'absolute', display: 'none', width: ERASER_WIDTH, height: ERASER_WIDTH,
            marginLeft: -ERASER_WIDTH / 2, marginTop: -ERASER_WIDTH / 2, borderRadius: '50%',
            border: '1.5px solid var(--ink-on-paper-low)', pointerEvents: 'none',
          }}
        />
        {/* J2 — pen/eraser toggle: two states. Deliberately NOT chrome-fade — it's
            a tool control the writer needs mid-draw (exactly when chrome is
            receded), not passive chrome. Session-scoped (pen by default on open). */}
        <button
          type="button"
          className="btn-quiet ink-tool-toggle"
          onClick={() => setEraserArmed(a => !a)}
          aria-pressed={eraserArmed}
          aria-label={eraserArmed ? 'Eraser armed — tap for pen' : 'Pen armed — tap for eraser'}
          title={eraserArmed ? 'Eraser' : 'Pen'}
          style={{
            position: 'absolute', top: 8, right: canUndo ? 40 : 10, lineHeight: 1, fontSize: 16,
            color: eraserArmed ? 'var(--brass)' : 'var(--ink-on-paper-low)', background: 'transparent',
            border: 'none', cursor: 'pointer', padding: 4,
          }}
        >
          {eraserArmed ? '⬚' : '✎'}
        </button>
        {canUndo && (
          <button
            type="button"
            className="btn-quiet ink-undo"
            onClick={undo}
            aria-label="Undo last action"
            title="Undo last action"
            style={{ position: 'absolute', top: 8, right: 10, lineHeight: 1, fontSize: 16, color: 'var(--ink-on-paper-low)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            ↺
          </button>
        )}
        </div>
      </div>

      {/* Incentive layer — progress bar + typewriter toggle. Authored pages
          only; stays visible while writing (never carries chrome-fade). The
          bar honors the persisted Progress setting (Fable W1-R2) — a writer
          who turned it off elsewhere has no gear on this route to undo it,
          so the setting must be respected here too. Only Words applies on
          the Journal (no session-timer readout on this surface); Time stays
          ModeStage-only for now. The typewriter toggle is independent and
          always shown regardless of the progress metric.
          AB2 S2/S6 — framed: this whole row stays unmounted (ModeStage's own
          established framed gate, generalized here) — the typewriter toggle
          moves to the sliver (CD1: components/Sliver.tsx), and the meter
          track stays empty/reserved this ticket, matching every other
          DeskFrame surface. */}
      {authored && !framed && (
        <div className="mode-incentive-row">
          {writingSettings.progress !== 'off' && (
            <ProgressBar
              frac={lapFrac}
              celebrating={celebrating}
              label={`${words} word${words === 1 ? '' : 's'}`}
              metricLabel="words"
            />
          )}
          {/* FX2 S2 fold — this is a THIRD toggle click-site the branch's own
              S2 pass missed: unframed Journal entries render this row (see
              the framed-gate comment above) with their own bare setter,
              which never armed `explicitlySetThisSession`
              (store/writingSettings.ts). That let an explicit choice made
              here be silently overwritten by a later Draft-open seed on a
              different page within the SAME session — exactly the bypass
              S2 says must never happen. Routed through setTypewriterExplicit
              like Sliver.tsx/ModeStage.tsx's own two sites. */}
          <TypewriterToggle on={writingSettings.typewriter} onToggle={() => setTypewriterExplicit(!writingSettings.typewriter)} />
        </div>
      )}

      {/* AB3 S3 — the space under the paper becomes desk again: this whole
          metadata cluster (title, timestamp, actions, star, routing status,
          tags, the routing action, the autosave note) unmounts on framed
          surfaces — superseded by the Page face (S2), parked not deleted.
          Below the gate, byte-identical legacy. */}
      {!framed && (
      <>
      <h1 className="chrome-fade" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22, letterSpacing: '-0.01em', color: 'var(--text-hi)', margin: '24px 0 14px' }}>
        {textEmpty ? (hasInk ? 'A sketch' : 'Untitled') : firstLine(entry.text).slice(0, 100)}
      </h1>

      <div className="chrome-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="eyebrow" style={{ fontFamily: 'var(--font-mono)' }}>
          {formatStamp(entry.createdAt)}{authored ? ' · a page' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Copy-out is sacred (VW) — clean page text, one tap, no long-press. */}
          <button type="button" className="btn-quiet entry-copy" onClick={() => copyText(pageTextRef.current)} title={`Copy the ${lex('page').toLowerCase()} text`}>Copy {lex('page').toLowerCase()} text</button>
          {/* J4 Slice 2 — the port, single-page flow. Loose pages only. */}
          {isLoose && (
            <button type="button" className="btn-quiet entry-port" onClick={() => setPortOpen(true)}>Port to a Board…</button>
          )}
          {/* J5 Slice 2/3 — "Add to…", single-page flow. Loose pages only. */}
          {isLoose && (
            <button type="button" className="btn-quiet entry-add" onClick={() => setAddOpen(true)}>Add to…</button>
          )}
          <button
            type="button"
            className="btn-quiet entry-star"
            data-starred={entry.starred ? 'true' : 'false'}
            aria-pressed={!!entry.starred}
            onClick={toggleStar}
            style={{ color: entry.starred ? 'var(--brass)' : 'var(--text-low)' }}
          >
            {entry.starred ? '★ Starred' : '☆ Star'}
          </button>
        </div>
      </div>

      {entry.projectId == null && (
        <div className="journal-autosave-note chrome-fade">Saved automatically — even if you never file it to a Drawer or the Shelf.</div>
      )}

      {routedNames.length > 0 && (
        <div className="entry-routed chrome-fade" style={{ color: 'var(--text-mid)', fontSize: 13, marginTop: 16 }}>
          Routed to {routedNames.join(', ')}.
        </div>
      )}

      {/* Tags (J6): retroactive, free-text, optional. */}
      <div className="entry-tags chrome-fade" style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {(entry.tags ?? []).map(t => (
          <span key={t} className="entry-tag" data-tag={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ink-border)', color: 'var(--text-mid)', fontSize: 13 }}>
            {t}
            <button type="button" className="entry-tag-remove" aria-label={`Remove ${t}`} onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', padding: 0 }}>×</button>
          </span>
        ))}
        <input
          className="entry-tag-input"
          value={tagDraft}
          onChange={e => setTagDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Add a tag"
          style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ink-border)', background: 'var(--ink-800)', color: 'var(--text-hi)', fontFamily: 'var(--font-ui)', fontSize: 13, width: 120 }}
        />
        <button type="button" className="btn-quiet entry-tag-add" onClick={addTag}>Add</button>
      </div>

      {/* Routing slot (J2). One brass action; the picker is a transient
          selection. Projects already routed-to are flagged (J6). Hidden for a
          drawing-only entry (J12) — there's no prose to send; ink stays here. */}
      {!textEmpty && (
      <div className="entry-action-slot chrome-fade" style={{ marginTop: 24 }}>
        {!picking ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-brass route-open" onClick={() => setPicking(true)}>
              {deskT('journalRouteSendToDrawer')}
            </button>
          </div>
        ) : (
          <div className="route-picker" style={{ border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)', background: 'var(--ink-900)', padding: '16px' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Send this page to…</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              {projects.map(p => {
                const already = routedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="btn-quiet route-project"
                    data-project-id={p.id}
                    data-already={already ? 'true' : 'false'}
                    onClick={() => sendToProject(p.id)}
                  >
                    {p.title}{already ? ' · already sent' : ''}
                  </button>
                );
              })}
              {projects.length === 0 && (
                <span style={{ color: 'var(--text-low)', fontSize: 13 }}>{deskT('journalRouteEmptyDrawers')}</span>
              )}
              <button type="button" className="btn-quiet route-new" onClick={promoteToNew} style={{ marginTop: 8 }}>
                {deskT('journalRoutePromoteDrawer')}
              </button>
              <button type="button" className="btn-quiet route-cancel" onClick={() => setPicking(false)} style={{ marginTop: 4, color: 'var(--text-low)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      )}
      </>
      )}
    </>
  );

  // AB2 S1/S6 — the "capture" (Free Write) tool-rail content: the SAME
  // Spark deck / Fragments / Send → Drawer items AB1 parked in the interim
  // corkboard tab, at their ruled final home. No ink swatches here (this
  // surface has no typed-text pen — the ink layer above is hand-drawn
  // strokes, a single fixed color, not a palette); no forward-lock switch
  // here either (S2 ties that explicitly to ForwardOnlyEditor's propulsion,
  // which this surface's own word-granular deletion rail does not use).
  const sliverContent: SliverContent = { kind: 'freewrite', captureItems: CAPTURE_ITEMS };

  const modalsAndToast = (
    <>
      {portOpen && <PortToBoardSheet sourceIds={[entry.id]} onClose={() => setPortOpen(false)} />}
      {addOpen && (
        <AddToSheet
          sourceIds={[entry.id]}
          onClose={() => setAddOpen(false)}
          onDone={(message, verb) => {
            setAddOpen(false);
            // A MOVE takes the page out of the Journal — this loose-page view
            // no longer applies to it, so follow it out. COPY/LINK leave the
            // page exactly here, so the local toast shows normally. A MOVE's
            // toast can't: this view unmounts on navigate, taking the toast
            // node with it (Fable R1) — hand the message to the Journal list
            // as one-shot nav state instead (the F2 `warmStart`
            // consume-on-arrival pattern; the list clears the state on
            // arrival so a refresh never re-shows it).
            if (verb === 'MOVES') navigate('/journal', { state: { actionToast: message } });
            else toast.show(message);
          }}
        />
      )}
      {pinOpen && <PinToBoardSheet entryId={entry.id} onClose={() => setPinOpen(false)} />}
      {toast.node}
    </>
  );

  // CD1 S1 — the Journal's own composed frame gains the same top-line
  // treatment: the mode strip moves up into this header row, left-set,
  // beside "← The journal" (this surface's own equivalent of Done — kept
  // as its own established wording, not renamed, since it's semantically
  // distinct: "leave THIS page for the Journal list" vs. the generic
  // Done elsewhere). The notebook-paging chip stays at the right (real
  // page-to-page navigation, not a title/orphan) — flagged for a
  // reviewer's symmetry check against PageEditor's own Pages/Plan-toggle
  // removal (see that file's own S1 comment).
  // FX4 S1 — `desk-frame-host--journal` reverts the host's own
  // `overflow:hidden` (index.css, added by FX3 S1 to trim the goal glow's
  // few-pixel bleed at extreme viewport heights) for THIS surface only.
  // Found live while implementing this ticket's own engage-at-~10-lines
  // requirement: Journal is the one DeskFrame host whose content is
  // SUPPOSED to grow past the viewport routinely (window-scroll mode, ink
  // anchored to the sheet's own growing height — see this file's top
  // comment) — prose/script never hit this because their own stage is a
  // bounded box with INTERNAL scroll (.mode-scroll/.desk-frame-scroll-cap),
  // so their content never actually overflows .desk-frame-host's box
  // except by the glow's own trimmed few pixels. overflow:hidden doesn't
  // discriminate: it clipped ANY overflow, including Journal's own
  // legitimate page growth — confirmed empirically (a seeded page whose
  // true content height exceeded the viewport reported a scrollHeight
  // short of its own descendants' actual bottom edge, and window.scrollY
  // stayed permanently 0 no matter how much was typed, since the DOCUMENT
  // itself never grew past the viewport). Without this fix S1's own
  // engage-at-~10-lines requirement cannot function on Journal at all for
  // any page long enough to need it — this is not the ink-coordinate risk
  // (ink stays byte-true either way), but a separate, blocking
  // precondition discovered delivering this same slice.
  if (framed) {
    return (
      <div ref={pageRef} className="desk-frame-host desk-frame-host--journal" data-chrome-receded={dissolved ? 'true' : 'false'}>
        <ChromeHandle onReveal={() => resurface(true)} />
        <div className="chrome-fade chrome-top sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/journal" className="btn-quiet" style={{ display: 'inline-block' }}>← The journal</Link>
            {fromBoard && (
              <button type="button" className="btn-quiet wz-back-to-board" onClick={() => { flushNow(); navigate(`/page/${fromBoard}`); }}>
                ‹ Back to the board
              </button>
            )}
            <ModeStrip mode="journal" onSwitch={() => setTabPrompt(true)} onPublish={() => setTabPrompt(true)} />
          </div>
          {isLoose && (
            <nav className="journal-nav" aria-label={lex('journal')}>
              <button type="button" className="journal-nav-btn" disabled={!prevPage} aria-label={`Previous ${lex('page').toLowerCase()}`}
                onClick={() => prevPage && navigate(`/journal/${prevPage.id}`)}>‹</button>
              <span className="journal-nav-pos">{nbIndex + 1} / {notebook.length}</span>
              {nextPage ? (
                <button type="button" className="journal-nav-btn" aria-label={`Next ${lex('page').toLowerCase()}`}
                  onClick={() => navigate(`/journal/${nextPage.id}`)}>›</button>
              ) : (
                <button type="button" className="journal-nav-btn journal-nav-add" aria-label={`New ${lex('page').toLowerCase()} at the end`}
                  onClick={() => openLoose()}>+</button>
              )}
              {nextPage && (
                <button type="button" className="journal-nav-insert" aria-label={`Insert a ${lex('page').toLowerCase()} here`}
                  onClick={() => openLoose(entry.id)}>+ insert</button>
              )}
            </nav>
          )}
        </div>

        {tabPrompt && (
          <div className="journal-tab-prompt chrome-fade" role="status">
            <span>Move this to a Drawer or the Shelf to develop it past capture — drafting and formatting happen once a page is filed.</span>
            <button type="button" className="btn-quiet" onClick={() => { setPageHome(entry.id, 'shelf'); navigate('/shelf'); }}>Send to the Shelf</button>
          </div>
        )}

        <div style={{ height: 16 }} />

        <DeskFrame
          pageKind="prose"
          strip={cascade.strip}
          cascadeLayers={cascade.layers}
          sliver={<Sliver content={sliverContent} goalText={goalText} />}
          tutor={<Tutor entry={entry} project={homeProject} pageText={goalText} pageKind="prose" />}
          goalGlow={<GoalGlow text={goalText} />}
          dissolved={dissolved}
        >
          {/* .desk-frame-stage is a `display:flex` row expecting ONE child
              (PageEditorView/ScriptEditor each pass a single element).
              pageBody is a Fragment (metadata band, tags, routing slot are
              all top-level siblings) — spreading those directly as flex
              items would lay them out in a ROW instead of stacked, which is
              exactly the bug this wrapper prevents (own block-flow column,
              independent of the stage's own flex context).
              ab2.1 F1 — no alignItems here: the default `stretch` is load-
              bearing. `alignItems:'center'` (the original AB2 S6 patch)
              collapsed every block child, including the paper itself, to
              fit-content width — legacy's block-flow stretch inside a
              maxWidth:720 host had no framed-side replacement. `width:
              min(100%, 720px)` restores that same bounded-but-full-width
              context; the stage row's own `justify-content:center` centers
              the column, matching the legacy 720px measure exactly. */}
          <div style={{ width: 'min(100%, 720px)', display: 'flex', flexDirection: 'column' }}>
            {pageBody}
          </div>
        </DeskFrame>

        {modalsAndToast}
      </div>
    );
  }

  return (
    <div ref={pageRef} className="page journal-page" data-chrome-receded={dissolved ? 'true' : 'false'} style={{ maxWidth: 720, paddingTop: '3rem' }}>
      <ChromeHandle onReveal={() => resurface(true)} />

      {/* PAGE IS PRIMARY: only wayfinding (back / notebook paging) and the
          document-type tabs sit above the writing surface. Everything about
          THIS document — timestamp, actions, star, tags, routing, autosave
          status — lives below the surface now (see the metadata cluster near
          the end of this component). */}
      <div className="journal-top chrome-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <Link to="/journal" className="btn-quiet" style={{ display: 'inline-block' }}>← The journal</Link>
        {/* J1 — walk the notebook (loose pages only). The forward arrow becomes
            "+" at the end (append + open); "+ insert" drops a page between this
            one and the next. */}
        {isLoose && (
          <nav className="journal-nav" aria-label={lex('journal')}>
            <button type="button" className="journal-nav-btn" disabled={!prevPage} aria-label={`Previous ${lex('page').toLowerCase()}`}
              onClick={() => prevPage && navigate(`/journal/${prevPage.id}`)}>‹</button>
            <span className="journal-nav-pos">{nbIndex + 1} / {notebook.length}</span>
            {nextPage ? (
              <button type="button" className="journal-nav-btn" aria-label={`Next ${lex('page').toLowerCase()}`}
                onClick={() => navigate(`/journal/${nextPage.id}`)}>›</button>
            ) : (
              <button type="button" className="journal-nav-btn journal-nav-add" aria-label={`New ${lex('page').toLowerCase()} at the end`}
                onClick={() => openLoose()}>+</button>
            )}
            {nextPage && (
              <button type="button" className="journal-nav-insert" aria-label={`Insert a ${lex('page').toLowerCase()} here`}
                onClick={() => openLoose(entry.id)}>+ insert</button>
            )}
          </nav>
        )}
      </div>

      {/* B4 #11 — the Journal is Free-Write capture: the page interface shows the
          modes with the non-Free-Write tabs GREYED. Clicking one prompts the user
          to file the entry (Drawer / Shelf) before it can be drafted or formatted.
          Only for loose entries (a filed page opens in the live page editor).
          AB3 S4 — the file-it-first prompt survives HERE and only here: a
          loose-origin page (the Desk's home-base door) is never nudged to
          file, even if it somehow renders on this surface (anti-solicitation
          is a hard invariant, not a preference). */}
      {entry.projectId == null && entry.origin !== 'loose' && (
        <div className="journal-modes chrome-fade">
          <div className="mode-tabs" role="tablist" aria-label="Mode">
            <button type="button" role="tab" aria-selected="true" className="mode-tab active">
              <span className="mode-tab__label">{lex('freewrite')}</span>
              <span className="mode-tab__sub">capture</span>
            </button>
            {['Draft', 'Format', 'Workshop', lex('publish')].map(label => (
              <button key={label} type="button" role="tab" aria-selected="false" className="mode-tab deferred" onClick={() => setTabPrompt(true)}>
                <span className="mode-tab__label">{label}</span>
              </button>
            ))}
          </div>
          {tabPrompt && (
            <div className="journal-tab-prompt" role="status">
              <span>Move this to a Drawer or the Shelf to develop it past capture — drafting and formatting happen once a page is filed.</span>
              <button type="button" className="btn-quiet" onClick={() => { setPageHome(entry.id, 'shelf'); navigate('/shelf'); }}>Send to the Shelf</button>
            </div>
          )}
        </div>
      )}

      {pageBody}
      {modalsAndToast}
    </div>
  );
}

// Remount the view per entry id. React Router reuses the component instance on
// a param-only change (/journal/A -> /journal/B), which would leave the view's
// per-entry refs (authored?, the text buffer, strokes) seeded from the previous
// entry — and an authored page's buffer could then clobber a capture's text on
// the next write. Keying by id forces a clean remount, so "seed once on mount"
// always holds. (In the UI you reach entries via the list, which already
// remounts; this also makes direct entry->entry navigation correct.)
export function JournalEntry() {
  const { id } = useParams<{ id: string }>();
  return <JournalEntryView key={id ?? 'new'} />;
}
