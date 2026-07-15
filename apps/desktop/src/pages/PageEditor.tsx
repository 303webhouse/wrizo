import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { flushNow, getDrawer, getJournalEntry, getProject, saveJournalEntry } from '../store/persistence';
import { firstLine } from '../store/entryText';
import { ForwardOnlyEditor, type EditorMode } from '../components/ForwardOnlyEditor';
import { ModeSwitcher } from '../components/ModeSwitcher';
import { ModeStage } from '../components/ModeStage';
import { useWarmStart } from '../components/useWarmStart';
import { useSessionLog } from '../components/useSessionLog';
import { useFirstLineInvite } from '../components/useFirstLineInvite';
import { useWayBack } from '../components/useWayBack';
import { setCaretOffset } from '../store/caretOffset';
import { projectMilestones } from '../store/milestones';
import { copyText } from '../store/clipboard';
import { BoardEditor } from '../components/BoardEditor';
import { ScriptEditor } from '../components/ScriptEditor';
import { useLexicon } from '../store/themeLexicon';

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
  const entry = getJournalEntry(id);
  const project = entry?.projectId ? getProject(entry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;
  // M1 — null on any plan-less project (Journal pages never reach this
  // surface at all); ModeStage silently degrades Progress:Project to Words
  // when this is null, per the canon's no-greyed-states rule.
  const milestones = projectMilestones(id);

  // Per-page last-used mode. Default: a manuscript chapter opens in Free write
  // (forward-only generation); support pages open in Draft (free edit).
  const modeKey = `wrizo-mode-page-${id}`;
  const [mode, setMode] = useState<EditorMode>(() => {
    const saved = localStorage.getItem(modeKey);
    if (saved === 'journal' || saved === 'drafting') return saved;
    return entry?.pageType === 'manuscript' ? 'journal' : 'drafting';
  });

  const initialText = entry?.text ?? '';
  const [text, setText] = useState(initialText);
  const [modeSeed, setModeSeed] = useState(initialText);
  const [receded, setReceded] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showPublish, setShowPublish] = useState(false); // Publish stub dialog (matches QuickSprint)

  const textRef = useRef(text);
  textRef.current = text;
  const lastSavedRef = useRef(initialText);
  const editorRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Warm start (F2) — captured once at mount (the hook strips the one-shot state).
  const location = useLocation();
  const warmRef = useRef(!!(location.state as { warmStart?: boolean } | null)?.warmStart);
  const warmWrapRef = useRef<HTMLDivElement>(null);
  const warm = useWarmStart(warmRef.current, editorRef, warmWrapRef);

  // F5 — TTFK session for this chapter/support page. projectId carries the binder;
  // firstKeystroke rides the same onForward seam as the warm release below.
  const noteSessionKeystroke = useSessionLog('page', {
    projectId: () => entry?.projectId ?? null,
    words: () => wordCount(textRef.current),
  });

  // F6 — the first-line invitation on a truly empty page (entry.text.length === 0).
  const invite = useFirstLineInvite(() => textRef.current.length === 0);

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

  // Exit lands where the page lives: its binder, the Shelf if shelved, else the
  // Journal (F2 papercut — a shelved typed page returned to /journal before).
  const backTo = project ? `/project/${project.id}` : entry.shelved ? '/shelf' : '/journal';
  const pageTitle = text.trim() ? firstLine(text).slice(0, 40) : 'Untitled';

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
        {({ noteWrite, penColor }) => (
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
              style={{
                width: '100%', minHeight: '100%', color: 'var(--ink-on-paper)',
                fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
              }}
            />
            {invite.node}
            {warm.rect && (
              <div
                aria-hidden="true"
                className={`wz-warm${warm.settled ? ' wz-warm--settled' : ''}`}
                style={{ position: 'absolute', top: warm.rect.top, left: warm.rect.left, width: warm.rect.width, height: warm.rect.height }}
              />
            )}
          </div>
        )}
      </ModeStage>

      {/* Publish — stub dialog (options tailored to type/destination/format later). */}
      {showPublish && (
        <div className="sprint-modal-backdrop" onClick={() => setShowPublish(false)}>
          <div className="sprint-modal card" role="dialog" aria-label={lex('publish')} onClick={e => e.stopPropagation()}>
            <div className="card-title">{lex('publish')}</div>
            <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '8px 0 16px' }}>
              Publishing options — tailored to this work's type, destination, and format — are coming soon.
            </p>
            <button type="button" className="btn-quiet" onClick={() => setShowPublish(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Key by id so per-page refs/state re-seed cleanly on page→page navigation.
// J4 — /page/:id stays the one typed-page route; a pageType:'board' entry
// delegates to the BoardEditor here, before either component's hooks run.
// S1 — pageType:'script' delegates to ScriptEditor the same way. Draft law
// only: neither delegate mounts ModeSwitcher/ModeStage (the mode strip stays
// PageEditorView's alone) — a Board is Trellis-side by design, and a script
// page ships Draft-only until S4 brings script Free-write.
export function PageEditor() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  const entry = getJournalEntry(id);
  if (entry?.pageType === 'board') return <BoardEditor key={id} id={id} />;
  if (entry?.pageType === 'script') return <ScriptEditor key={id} id={id} />;
  return <PageEditorView key={id} id={id} />;
}
