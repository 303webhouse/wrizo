import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getJournalEntry, getProject, getProjects, saveJournalEntry, setProjectSprintText, setPageHome, createQuickSprintProject, flushNow } from '../store/persistence';
import { firstLine, formatStamp } from '../store/entryText';
import { inkColor, renderStroke } from '../store/ink';
import { useChromeDissolve } from '../components/useChromeDissolve';
import { ChromeHandle } from '../components/WritingShell';
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
  const [picking, setPicking] = useState(false);
  const [tabPrompt, setTabPrompt] = useState(false); // B4 #11 — file-it-first prompt
  const [tagDraft, setTagDraft] = useState('');
  const [entry, setEntry] = useState<JournalEntryType | null>(() => (id ? getJournalEntry(id) : null));

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
    const paintActive = () => {
      const canvas = activeRef.current;
      const rect = captureRectRef.current;
      if (!canvas || !rect) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (activeStrokeRef.current) renderStroke(ctx, activeStrokeRef.current, rect.width, inkColor());
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
      if ((e.target as Element | null)?.closest?.('.ink-undo')) return;
      e.stopPropagation(); // keep the pen off the editable text node (no caret, no handwriting)
      noteWriteRef.current(); // recede the chrome on draw
      captureRectRef.current = sheet.getBoundingClientRect();
      const ac = activeRef.current;
      if (ac) syncCanvas(ac, captureRectRef.current.width, captureRectRef.current.height);
      drawingRef.current = true;
      activeStrokeRef.current = { points: [normPoint(e)] };
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
    const onUp = (e: PointerEvent) => {
      if (!drawingRef.current || e.pointerType !== 'pen') return;
      e.preventDefault();
      drawingRef.current = false;
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
      activeStrokeRef.current = null;
      try { sheet.releasePointerCapture(e.pointerId); } catch { /* */ }
      clearActive();
    };

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
    return () => {
      sheet.removeEventListener('pointerdown', onDown, opts);
      sheet.removeEventListener('pointermove', onMove, opts);
      sheet.removeEventListener('pointerup', onUp, opts);
      sheet.removeEventListener('pointercancel', onCancel, opts);
    };
  }, [id]);

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
      touchedRef.current = true;
      noteWriteRef.current(); // recede the chrome on write
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
    const onCut = (e: Event) => e.preventDefault(); // cut would remove text
    const onHide = () => { if (document.visibilityState === 'hidden') { flushText(); flushNow(); } };

    el.addEventListener('beforeinput', onBeforeInput as EventListener);
    el.addEventListener('input', onInput);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('cut', onCut);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      el.removeEventListener('beforeinput', onBeforeInput as EventListener);
      el.removeEventListener('input', onInput);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('cut', onCut);
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

  const authored = entry.source === 'page';
  const projects = getProjects();
  const routedIds = entry.routedProjectIds ?? [];
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

  return (
    <div ref={pageRef} className="page" data-chrome-receded={dissolved ? 'true' : 'false'} style={{ maxWidth: 720, paddingTop: '3rem' }}>
      <ChromeHandle onReveal={() => resurface(true)} />
      <Link to="/journal" className="btn-quiet chrome-fade" style={{ display: 'inline-block', marginBottom: 24 }}>← The journal</Link>

      <div className="chrome-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="eyebrow" style={{ fontFamily: 'var(--font-mono)' }}>
          {formatStamp(entry.createdAt)}{authored ? ' · a page' : ''}
        </div>
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

      {/* B4 #11 — the Journal is Free-Write capture: the page interface shows the
          modes with the non-Free-Write tabs GREYED. Clicking one prompts the user
          to file the entry (Drawer / Shelf) before it can be drafted or formatted.
          Only for loose entries (a filed page opens in the live page editor). */}
      {entry.projectId == null && (
        <div className="journal-modes chrome-fade">
          <div className="mode-tabs" role="tablist" aria-label="Mode">
            <button type="button" role="tab" aria-selected="true" className="mode-tab active">
              <span className="mode-tab__label">Free write</span>
              <span className="mode-tab__sub">capture</span>
            </button>
            {['Draft', 'Format', 'Workshop', 'Publish'].map(t => (
              <button key={t} type="button" role="tab" aria-selected="false" className="mode-tab deferred" onClick={() => setTabPrompt(true)}>
                <span className="mode-tab__label">{t}</span>
              </button>
            ))}
          </div>
          {tabPrompt && (
            <div className="journal-tab-prompt" role="status">
              <span>Move this to a Drawer or the Shelf to develop it past capture — drafting and formatting happen once a page is filed.</span>
              <button type="button" className="btn-quiet" onClick={() => { setPageHome(entry.id, 'shelf'); navigate('/shelf'); }}>Send to the Shelf</button>
            </div>
          )}
          <div className="journal-autosave-note">Saved automatically — even if you never file it to a Drawer or the Shelf.</div>
        </div>
      )}

      <h1 className="chrome-fade" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 24, letterSpacing: '-0.01em', color: 'var(--text-hi)', margin: '8px 0 16px' }}>
        {textEmpty ? (hasInk ? 'A sketch' : 'Untitled') : firstLine(entry.text).slice(0, 100)}
      </h1>

      {routedNames.length > 0 && (
        <div className="entry-routed chrome-fade" style={{ color: 'var(--text-mid)', fontSize: 13, marginBottom: 16 }}>
          Routed to {routedNames.join(', ')}.
        </div>
      )}

      <div
        ref={sheetRef}
        className="paper-page entry-full"
        style={{
          position: 'relative', maxWidth: '68ch', minHeight: '60vh', whiteSpace: 'pre-wrap', touchAction: 'pan-y',
          color: 'var(--ink-on-paper)', fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
        }}
      >
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
            aria-label="Journal page"
            spellCheck
            // touchAction:'none' suppresses OS stylus handwriting on the text
            // (J10.1) without disabling page/finger scroll on the container.
            style={{ outline: 'none', whiteSpace: 'pre-wrap', minHeight: '54vh', touchAction: 'none' }}
          />
        ) : (
          entry.text
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
              Send to a project
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
                <span style={{ color: 'var(--text-low)', fontSize: 13 }}>No projects yet.</span>
              )}
              <button type="button" className="btn-quiet route-new" onClick={promoteToNew} style={{ marginTop: 8 }}>
                Promote to a new project
              </button>
              <button type="button" className="btn-quiet route-cancel" onClick={() => setPicking(false)} style={{ marginTop: 4, color: 'var(--text-low)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      )}
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
