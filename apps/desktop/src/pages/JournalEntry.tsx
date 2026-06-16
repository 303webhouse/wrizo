import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getJournalEntry, getProject, getProjects, saveJournalEntry, setProjectSprintText, createQuickSprintProject } from '../store/persistence';
import { firstLine, formatStamp } from '../store/entryText';
import { inkColor, renderStroke } from '../store/ink';
import type { JournalEntry as JournalEntryType, Stroke, StrokePoint } from '../types';

// J4 — the entry read view: full text, read-only, on a lit paper page.
// J2 — fills the reserved slot with pull-based routing (branch-copy: the entry's
//      text is never modified).
// J6 — light, optional emergent metadata: star, free-text tags, and a routed
//      marker (stamped when J2 routes the scrap). All additive, written via
//      saveJournalEntry, synced via the existing journalEntries path. The entry
//      text is still never touched — only metadata.
// J9 — a stylus ink layer over the sheet: pen-only (palm/finger rejected),
//      strokes captured device-independently and persisted to entry.strokes
//      (J8). Like J6, additive — the typed text stays read-only and untouched.
//      All painting goes through ink.ts/renderStroke; one pen, one quiet undo.

const SCRAP_HEADING = '— from the journal —';

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
function paintCommitted(canvas: HTMLCanvasElement | null, sheet: HTMLElement | null, strokes: Stroke[]): void {
  if (!canvas || !sheet) return;
  const rect = sheet.getBoundingClientRect();
  const ctx = syncCanvas(canvas, rect.width, rect.height);
  if (!ctx) return;
  ctx.clearRect(0, 0, rect.width, rect.height);
  const color = inkColor();
  for (const s of strokes) renderStroke(ctx, s, rect.width, color);
}

export function JournalEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [entry, setEntry] = useState<JournalEntryType | null>(() => (id ? getJournalEntry(id) : null));

  // Ink layer (J9). Strokes are held in component state (seeded from the entry)
  // as the render/undo source of truth, kept in sync with storage. All hooks
  // run before the early return below so hook order is stable.
  const [strokes, setStrokes] = useState<Stroke[]>(() => (id ? getJournalEntry(id)?.strokes ?? [] : []));
  const [freshUndo, setFreshUndo] = useState(false); // one-level undo: only the newest stroke is undoable
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const committedRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>(strokes);
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const captureRectRef = useRef<DOMRect | null>(null);

  // Repaint committed ink on mount and whenever the stroke set changes. Nothing
  // here is gated behind a motion flag — reduced-motion needs no branch because
  // nothing animates; this is just a static repaint.
  useEffect(() => {
    strokesRef.current = strokes;
    paintCommitted(committedRef.current, sheetRef.current, strokes);
  }, [strokes]);

  // Keep ink positioned when the sheet's width changes (re-render denormalizes
  // to the new width). Reads the latest strokes via the ref.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => paintCommitted(committedRef.current, sheetRef.current, strokesRef.current));
    ro.observe(sheet);
    return () => ro.disconnect();
  }, []);

  // Pen-only capture. Listeners live on the sheet (not the pass-through canvas)
  // and are non-passive so a pen move can preventDefault scroll. Touch/mouse are
  // ignored here and, because the canvas never intercepts input, fall through to
  // normal scroll/selection — a resting palm registers as touch, so it's
  // rejected for free.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !id) return;

    // Canvas-local coords normalized by the sheet WIDTH on both axes, so the
    // drawing stays aspect-correct (a circle stays a circle) at any width.
    const normPoint = (e: PointerEvent): StrokePoint => {
      const rect = captureRectRef.current ?? sheet.getBoundingClientRect();
      const w = rect.width || 1;
      const point: StrokePoint = { x: (e.clientX - rect.left) / w, y: (e.clientY - rect.top) / w };
      if (e.pressure > 0) point.p = Math.round(e.pressure * 1000) / 1000; // absent when the device reports none
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
    // Persist via the star/tags pattern; entry.text is never in the patch.
    const persist = (next: Stroke[]) => {
      const latest = getJournalEntry(id);
      if (!latest) return;
      saveJournalEntry({ ...latest, strokes: next });
      setEntry(getJournalEntry(id));
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'pen') return; // palm/finger/mouse fall through to the page
      if ((e.target as Element | null)?.closest?.('.ink-undo')) return; // a pen tap on undo isn't a stroke
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
      e.preventDefault(); // suppress scroll for the pen only
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
        setFreshUndo(true);
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

    sheet.addEventListener('pointerdown', onDown, { passive: false });
    sheet.addEventListener('pointermove', onMove, { passive: false });
    sheet.addEventListener('pointerup', onUp, { passive: false });
    sheet.addEventListener('pointercancel', onCancel, { passive: false });
    return () => {
      sheet.removeEventListener('pointerdown', onDown);
      sheet.removeEventListener('pointermove', onMove);
      sheet.removeEventListener('pointerup', onUp);
      sheet.removeEventListener('pointercancel', onCancel);
    };
  }, [id]);

  if (!entry) return <Navigate to="/journal" replace />;

  const projects = getProjects();
  const routedIds = entry.routedProjectIds ?? [];

  // Re-save the entry with a metadata patch and refresh local state (the text is
  // never part of the patch — metadata only).
  const patch = (changes: Partial<JournalEntryType>) => {
    const next = { ...entry, ...changes };
    saveJournalEntry(next);
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
    if (routedIds.includes(projectId)) return entry;
    const next = { ...entry, routedProjectIds: [...routedIds, projectId] };
    saveJournalEntry(next);
    return next;
  };

  const sendToProject = (projectId: string) => {
    const project = getProject(projectId);
    if (!project) return;
    setProjectSprintText(projectId, appendScrap(project.sprintText || '', entry.text));
    stampRouted(projectId);
    navigate(`/project/${projectId}`);
  };

  const promoteToNew = () => {
    const project = createQuickSprintProject(entry.text, routedTitle(entry.text));
    stampRouted(project.id);
    navigate(`/project/${project.id}`);
  };

  const routedNames = routedIds.map(pid => getProject(pid)?.title).filter(Boolean) as string[];

  // Undo: one quiet step, the newest stroke only. Not a history stack — once
  // freshUndo is consumed, nothing is undoable until a new stroke is drawn.
  const undo = () => {
    if (!freshUndo) return;
    const next = strokesRef.current.slice(0, -1);
    strokesRef.current = next;
    setStrokes(next);
    setFreshUndo(false);
    const latest = getJournalEntry(entry.id);
    if (latest) {
      saveJournalEntry({ ...latest, strokes: next });
      setEntry(getJournalEntry(entry.id));
    }
  };

  return (
    <div className="page" style={{ maxWidth: 720, paddingTop: '3rem' }}>
      <Link to="/journal" className="btn-quiet" style={{ display: 'inline-block', marginBottom: 24 }}>← The journal</Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="eyebrow" style={{ fontFamily: 'var(--font-mono)' }}>{formatStamp(entry.createdAt)}</div>
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

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 24, letterSpacing: '-0.01em', color: 'var(--text-hi)', margin: '8px 0 16px' }}>
        {firstLine(entry.text).slice(0, 100)}
      </h1>

      {routedNames.length > 0 && (
        <div className="entry-routed" style={{ color: 'var(--text-mid)', fontSize: 13, marginBottom: 16 }}>
          Routed to {routedNames.join(', ')}.
        </div>
      )}

      <div
        ref={sheetRef}
        className="paper-page entry-full"
        style={{
          position: 'relative', maxWidth: '68ch', whiteSpace: 'pre-wrap', touchAction: 'pan-y',
          color: 'var(--ink-on-paper)', fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
        }}
      >
        {entry.text}
        {/* Ink overlay (J9). Both canvases cover the sheet exactly and never
            intercept input (pointer-events:none) — the pen is routed by the
            sheet's own listeners; text stays selectable/scrollable underneath.
            A second canvas paints the in-progress stroke so committed strokes
            aren't repainted every move. */}
        <canvas
          ref={committedRef}
          className="ink-canvas ink-committed"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit' }}
        />
        <canvas
          ref={activeRef}
          className="ink-canvas ink-active"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit' }}
        />
        {freshUndo && (
          <button
            type="button"
            className="btn-quiet ink-undo"
            onClick={undo}
            aria-label="Undo last stroke"
            title="Undo last stroke"
            style={{ position: 'absolute', top: 8, right: 10, lineHeight: 1, fontSize: 16, color: 'var(--ink-on-paper-low)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            ↺
          </button>
        )}
      </div>

      {/* Tags (J6): retroactive, free-text, optional. */}
      <div className="entry-tags" style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
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
          selection. Projects already routed-to are flagged (J6). */}
      <div className="entry-action-slot" style={{ marginTop: 24 }}>
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
    </div>
  );
}
