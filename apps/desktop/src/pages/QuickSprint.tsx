import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  clearDraft, createQuickSprintProject, flushNow, generateId, getDraft, getDrawer, getJournalEntry, getProject,
  getStoryPlanByProjectId, saveDraft, saveJournalEntry, saveSession, setBeatStatus, setCurrentBeat,
  setProjectSprintText,
} from '../store/persistence';
import type { JournalEntry } from '../types';
import { getFramework } from '../store/frameworks';
import { startAmbient, type AmbientHandle } from '../store/ambient';
import { useIdleNudges } from '../store/idleNudges';
import { pickEchoLine } from '../store/entryText';
import { ForwardOnlyEditor, type EditorMode } from '../components/ForwardOnlyEditor';
import { ModeSwitcher } from '../components/ModeSwitcher';
import { ModeStage } from '../components/ModeStage';

const DRAFT_KEY_PREFIX = 'writer-studio-quick-sprint-draft';
const AUTOSAVE_MS = 2000;
const SAVED_STAMP_MS = 2000;
// Idle nudges (cadence + the canonical v6 pool) live in the shared
// useIdleNudges hook — the sprint and the HOME gate both mount it.

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function getDraftKey(projectId?: string): string {
  return projectId ? `${DRAFT_KEY_PREFIX}-${projectId}` : DRAFT_KEY_PREFIX;
}

function reducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface FinishStats {
  words: number;
  minutes: number | null;
}

export function QuickSprint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = id ? getProject(id) : null;
  const draftId = id ?? 'scratch';

  // Beat → sprint bridge (A4)
  const plan = id ? getStoryPlanByProjectId(id) : null;
  const framework = plan ? getFramework(plan.frameworkId) : null;
  const currentBeat = framework?.beats.find(b => b.id === plan?.currentBeatId) || null;
  const currentBeatNote = plan?.beatNotes.find(bn => bn.beatId === plan?.currentBeatId) || null;

  const [isFinishing, setIsFinishing] = useState(false);
  const [finishStats, setFinishStats] = useState<FinishStats | null>(null);
  const [displayWords, setDisplayWords] = useState(0);
  const [draftText, setDraftText] = useState(() => {
    const draft = getDraft(draftId);
    if (draft) return draft.text;
    if (project?.sprintText) return project.sprintText;
    return localStorage.getItem(getDraftKey(id)) || '';
  });
  // Seed text for the forward-only editor — same resolution as draftText's
  // initializer, recomputed per surface so the editor (keyed by draftId)
  // re-seeds when the sprint surface changes.
  const seedText = useMemo(() => {
    const draft = getDraft(draftId);
    if (draft) return draft.text;
    const proj = id ? getProject(id) : null;
    if (proj?.sprintText) return proj.sprintText;
    return localStorage.getItem(getDraftKey(id)) || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, draftId]);

  // Mode-aware editor — Free write = forward-only; Draft = free edit. Per-document
  // last-used mode persisted; default Free write for scratch scraps, Draft for
  // project pages. Switching is a lens change on the same doc (re-seed + remount).
  const modeKey = `wrizo-mode-${draftId}`;
  const [mode, setMode] = useState<EditorMode>(() => {
    const saved = localStorage.getItem(modeKey);
    if (saved === 'journal' || saved === 'drafting') return saved;
    return id ? 'drafting' : 'journal';
  });
  const [modeSeed, setModeSeed] = useState(seedText);
  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    setModeSeed(draftTextRef.current); // carry the current clean text into the new mode
    setMode(next);
    localStorage.setItem(modeKey, next);
  };

  const [savedUntil, setSavedUntil] = useState<number | null>(null);
  // Idle nudges via the shared hook — cadence resets on each keystroke (draftText),
  // active once the writer has started. handleGetNudge is the "Take a nudge" pull.
  const { nudge, shown: nudgeShown, pull: handleGetNudge } = useIdleNudges({
    active: draftText.trim().length > 0,
    activityKey: draftText,
  });
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [beatOpen, setBeatOpen] = useState(true);
  const [markBeatDone, setMarkBeatDone] = useState(false);
  const [soundOn, setSoundOn] = useState(false); // ambient sound bed (J5), off by default
  const [echoLine, setEchoLine] = useState<string | null>(null); // post-sprint echo (J7)
  const [showPublish, setShowPublish] = useState(false); // Publish stub dialog

  // Writing-screen redesign — the navigation layer (this row + the DeskRail + the
  // mode tabs) recedes while writing; ModeStage owns the dissolve engine and
  // reports its state up so the sprint's own chrome fades in step.
  const [receded, setReceded] = useState(false);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<AmbientHandle | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const draftTextRef = useRef(draftText);
  draftTextRef.current = draftText;
  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;
  const lastSavedRef = useRef(draftText);
  const suppressFlushRef = useRef(false);
  const sessionStartWordsRef = useRef(wordCount(draftText));
  const sprintStartMsRef = useRef<number | null>(null);
  // Session instrumentation (A9).
  const sessionStartedAtRef = useRef(new Date().toISOString());
  const firstKeystrokeAtRef = useRef<string | null>(null);
  // Journal entry committed for this sprint (J1). One entry per sprint: created on
  // the first completion, reused (text refreshed) if writing continues and it's
  // finished again — so a continuous session stays one entry.
  const journalEntryIdRef = useRef<string | null>(null);

  const markSaved = () => setSavedUntil(Date.now() + SAVED_STAMP_MS);

  // Persist the buffer if changed, then force pending writes to disk (A1).
  const flushDraft = () => {
    if (!suppressFlushRef.current) {
      const text = draftTextRef.current;
      if (text !== lastSavedRef.current) {
        saveDraft(draftIdRef.current, text);
        lastSavedRef.current = text;
      }
    }
    flushNow();
  };

  // Commit the current draft buffer to a permanent Journal entry (J1). Fired on
  // finish, before any Save/Discard choice — so the words are kept regardless of
  // where the working copy goes. Empty text never produces an entry.
  const commitJournalEntry = () => {
    const text = draftTextRef.current;
    if (!text.trim()) return;
    const existingId = journalEntryIdRef.current;
    if (existingId) {
      const existing = getJournalEntry(existingId);
      if (existing) {
        saveJournalEntry({ ...existing, text }); // same createdAt; updatedAt restamped
        return;
      }
    }
    const now = new Date().toISOString();
    const entry: JournalEntry = {
      id: generateId(),
      text,
      projectId: id ?? null, // provenance at completion; never rewritten on save
      createdAt: now,
      updatedAt: now,
    };
    journalEntryIdRef.current = entry.id;
    saveJournalEntry(entry);
  };

  // Enter the finish moment. The editor stays editable + focused behind the card
  // (A7) — never blurred or disabled, so no keystroke is lost. Finish is now a
  // quiet manual action (the countdown sprint timer was retired); the elapsed time
  // is measured from the first keystroke.
  const enterFinish = () => {
    commitJournalEntry();
    ambientRef.current?.resolve(); // J5: settle the drift; the payoff is the finish moment (J7)
    setEchoLine(pickEchoLine(draftTextRef.current)); // J7: reflect one of the writer's own lines (or none)
    const words = Math.max(0, wordCount(draftTextRef.current) - sessionStartWordsRef.current);
    const minutes = sprintStartMsRef.current
      ? Math.max(1, Math.round((Date.now() - sprintStartMsRef.current) / 60000))
      : null;
    setFinishStats({ words, minutes });
    setIsFinishing(true);
  };

  // Count up the word total over the one 420ms finish moment.
  useEffect(() => {
    if (!isFinishing || !finishStats) return;
    if (reducedMotion()) {
      setDisplayWords(finishStats.words);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 420);
      setDisplayWords(Math.round(p * finishStats.words));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isFinishing, finishStats]);

  useEffect(() => {
    if (!savedUntil) return;
    const remaining = savedUntil - Date.now();
    if (remaining <= 0) {
      setSavedUntil(null);
      return;
    }
    const timeout = setTimeout(() => setSavedUntil(null), remaining);
    return () => clearTimeout(timeout);
  }, [savedUntil]);

  // Load the right buffer when the surface changes (A1).
  useEffect(() => {
    const draft = getDraft(draftId);
    const proj = id ? getProject(id) : null;
    const loaded = draft ? draft.text : (proj?.sprintText || localStorage.getItem(getDraftKey(id)) || '');
    setDraftText(loaded);
    lastSavedRef.current = loaded;
    sessionStartWordsRef.current = wordCount(loaded);
    suppressFlushRef.current = false;
  }, [id, draftId]);

  // Debounced autosave (A1).
  useEffect(() => {
    if (draftText === lastSavedRef.current) return;
    const handle = setTimeout(() => {
      saveDraft(draftId, draftText);
      lastSavedRef.current = draftText;
      markSaved();
    }, AUTOSAVE_MS);
    return () => clearTimeout(handle);
  }, [draftText, draftId]);

  // Flush on tab hide / route change (A1).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushDraft();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      flushDraft();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autofocus the page on mount (A8).
  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  // Ambient felt-warmth drift (J5). Attaches to the writing surface; honors
  // reduced-motion internally (drift off, audio off). Torn down on unmount.
  useEffect(() => {
    if (!surfaceRef.current) return;
    const handle = startAmbient(surfaceRef.current);
    ambientRef.current = handle;
    return () => {
      handle.stop();
      ambientRef.current = null;
    };
  }, []);

  // Propagate the quiet sound toggle to the ambient bed (off by default).
  useEffect(() => {
    ambientRef.current?.setSoundEnabled(soundOn);
  }, [soundOn]);

  // The editor reports its derived text (unstruck spine prose) on every change —
  // strike included — and draftText mirrors it, so A1/J1/A9/finish/J7 keep
  // working off draftText unchanged.
  const handleEditorChange = (value: string) => setDraftText(value);
  // Forward keystrokes only (not strikes): the A8/A9 typing signals + J5 warmth.
  // The session clock starts on the first keystroke (no countdown box anymore).
  const handleForwardKeystroke = () => {
    if (sprintStartMsRef.current === null) sprintStartMsRef.current = Date.now();
    if (firstKeystrokeAtRef.current === null) firstKeystrokeAtRef.current = new Date().toISOString();
    ambientRef.current?.noteKeystroke(); // J5: feed the felt-warmth drift
  };

  // Record a writing-session row on save (A9). Returns the new id so the Journal
  // entry (J1) can be linked to its session.
  const recordSession = (projectId: string): string => {
    const now = new Date();
    const startedMs = new Date(sessionStartedAtRef.current).getTime();
    const sessionId = generateId();
    saveSession({
      id: sessionId,
      projectId,
      startedAt: sessionStartedAtRef.current,
      firstKeystrokeAt: firstKeystrokeAtRef.current,
      endedAt: now.toISOString(),
      words: Math.max(0, wordCount(draftTextRef.current) - sessionStartWordsRef.current),
      durationSec: Math.max(0, Math.round((now.getTime() - startedMs) / 1000)),
      surface: 'sprint', // F5 — new sprint sessions carry the funnel discriminator
      updatedAt: now.toISOString(),
    });
    return sessionId;
  };

  // Back-link the Journal entry committed at finish (J1) to its session row.
  const linkJournalSession = (sessionId: string) => {
    const entryId = journalEntryIdRef.current;
    if (!entryId) return;
    const entry = getJournalEntry(entryId);
    if (entry) saveJournalEntry({ ...entry, sessionId });
  };

  const handleSaveDraft = () => {
    saveDraft(draftId, draftText);
    lastSavedRef.current = draftText;
    if (id) setProjectSprintText(id, draftText);
    markSaved();
  };

  // The finish card's "keep writing" simply dismisses the card and returns focus
  // to the page (there's no countdown to extend anymore).
  const handleKeepWriting = () => {
    setIsFinishing(false);
    setFinishStats(null);
    editorRef.current?.focus();
  };

  const advanceBeatIfMarked = () => {
    if (!markBeatDone || !plan || !framework || !currentBeat) return;
    setBeatStatus(plan.id, currentBeat.id, 'complete');
    const beats = [...framework.beats].sort((a, b) => a.order - b.order);
    const idx = beats.findIndex(b => b.id === currentBeat.id);
    if (idx >= 0 && idx < beats.length - 1) {
      setCurrentBeat(plan.id, beats[idx + 1].id);
    }
  };

  const handleDiscard = () => {
    suppressFlushRef.current = true;
    // J1a: an explicit Discard overrides capture-by-default — soft-delete the
    // entry J1 committed at finish so the words truly leave the Journal.
    const entryId = journalEntryIdRef.current;
    if (entryId) {
      const entry = getJournalEntry(entryId);
      if (entry) saveJournalEntry({ ...entry, deletedAt: new Date().toISOString() });
    }
    clearDraft(draftId);
    localStorage.removeItem(getDraftKey(id));
    navigate(id ? `/project/${id}` : '/');
  };

  const handleSaveToProject = () => {
    suppressFlushRef.current = true;
    advanceBeatIfMarked();
    const projectId = id ?? createQuickSprintProject(draftText).id;
    if (id) setProjectSprintText(id, draftText);
    linkJournalSession(recordSession(projectId));
    clearDraft(draftId);
    localStorage.removeItem(getDraftKey(id));
    navigate(`/project/${projectId}`);
  };

  if (id && !project) {
    return <Navigate to="/" replace />;
  }

  // Breadcrumb: Drawer / Binder / Page (quiet, navigation layer).
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;
  const modeLabel = mode === 'drafting' ? 'Draft' : 'Free write';

  return (
    <div ref={pageRef} className="page" data-chrome-receded={receded ? 'true' : 'false'} style={{ maxWidth: 1100, paddingTop: '2.5rem' }}>
      {/* Navigation layer — breadcrumb · mode tabs · Pages/Plan · actions. Recedes
          on write (edge / Esc / tap-off summons it back). */}
      <div className="chrome-fade chrome-top sprint-nav">
        {/* Breadcrumb only for a binder file — the scratch "Journal / Scratch"
            is redundant with the Journal location in the left rail. */}
        {id && project && (
          <div className="sprint-crumb" aria-label="Location">
            {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
            <span className="crumb-item">{project.title}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-here">{modeLabel}</span>
          </div>
        )}

        {/* Postures + file actions (Workshop / Publish) inline in one strip. */}
        <ModeSwitcher
          mode={mode}
          onSwitch={switchMode}
          actions={[
            { label: 'Workshop', sub: 'coming soon', deferred: true },
            { label: 'Publish', sub: 'export', onClick: () => setShowPublish(true) },
          ]}
        />

        <div className="sprint-actions">
          {id && (
            <div className="sprint-toggle" role="tablist" aria-label="Binder view">
              <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active">Pages</button>
              <button type="button" role="tab" aria-selected="false" className="sprint-toggle-btn" onClick={() => navigate(`/project/${id}/board`)}>Plan</button>
            </div>
          )}
          <button type="button" className="btn-quiet sprint-nav-btn" onClick={handleGetNudge}>Take a nudge</button>
        </div>
      </div>

      {/* Beat context strip (A4) */}
      {currentBeat && (
        <div className="chrome-fade chrome-top" style={{
          border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)',
          background: 'var(--ink-900)', padding: '12px 16px', margin: '16px 0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="eyebrow">DRAFTING · {currentBeat.name}</div>
            <button type="button" className="btn-quiet" onClick={() => setBeatOpen(o => !o)}>
              {beatOpen ? 'Hide' : 'Show'}
            </button>
          </div>
          {beatOpen && currentBeatNote && currentBeatNote.notes.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-mid)', fontSize: 14 }}>
              {currentBeatNote.notes.map((note, i) => (
                <li key={i} style={{ marginBottom: 2 }}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!currentBeat && <div style={{ height: 16 }} />}

      {/* Nudge slip, tucked under the page's top edge. */}
      {nudge && (
        <div className="nudge-slip" data-shown={nudgeShown ? 'true' : 'false'} style={{ marginBottom: 12 }}>{nudge}</div>
      )}

      {/* The writing studio (ModeStage): rails / format-pen bar / glow / progress /
          optional timer / settings / typewriter, around the forward-only editor. */}
      <ModeStage
        mode={mode}
        words={wordCount(draftText)}
        surfaceRef={surfaceRef}
        focused={textareaFocused}
        onDissolveChange={setReceded}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(v => !v)}
        chromeRootRef={pageRef}
      >
        {({ noteWrite, penColor }) => (
          <ForwardOnlyEditor
            key={`${draftId}-${mode}`}
            ref={editorRef}
            initialText={modeSeed}
            mode={mode}
            onChange={handleEditorChange}
            onForward={() => { handleForwardKeystroke(); noteWrite(); }}
            onFocus={() => setTextareaFocused(true)}
            onBlur={() => { setTextareaFocused(false); flushDraft(); }}
            placeholder="Write without stopping…"
            ariaLabel="Sprint writing surface"
            penColor={penColor}
            style={{
              width: '100%', minHeight: '100%', color: 'var(--ink-on-paper)',
              fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
            }}
          />
        )}
      </ModeStage>

      {/* Bottom bar — quiet Save / Finish (a quiet action, not a box). */}
      {!isFinishing && (
        <div
          className="sprint-bottombar chrome-fade chrome-top"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16,
          }}
        >
          <span className={`saved-stamp${savedUntil ? '' : ' saved-stamp--hidden'}`}>Saved</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn-quiet" onClick={handleSaveDraft}>Save</button>
            <button type="button" className="btn-brass" onClick={enterFinish}>Finish</button>
          </div>
        </div>
      )}

      {/* Finish moment */}
      {isFinishing && finishStats && (
        <div
          className="card"
          style={{ marginTop: 16, animation: reducedMotion() ? undefined : 'finish-rise var(--t-moment) var(--ease)' }}
        >
          <div className="card-title">
            <span style={{ color: 'var(--ember)' }}>{displayWords}</span> words down.
          </div>
          {finishStats.minutes !== null && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>
              <span style={{ color: 'var(--ember)' }}>{displayWords}</span> words in {finishStats.minutes} minutes
            </div>
          )}

          {/* Post-sprint echo (J7): one of the writer's own lines, reflected back. */}
          {echoLine && (
            <div className="sprint-echo" style={{ marginTop: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>YOU WROTE</div>
              <div className="sprint-echo-line" style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic', fontSize: 17, lineHeight: 1.5, color: 'var(--text-hi)' }}>
                “{echoLine}”
              </div>
            </div>
          )}

          {currentBeat && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0', color: 'var(--text-mid)', cursor: 'pointer' }}>
              <input type="checkbox" checked={markBeatDone} onChange={e => setMarkBeatDone(e.target.checked)} />
              Mark {currentBeat.name} done
            </label>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" className="btn-brass" onClick={handleKeepWriting}>Keep writing</button>
            <button type="button" className="btn-ghost" onClick={handleSaveToProject}>
              {id ? 'Save to project' : 'Save as project'}
            </button>
            <span style={{ flex: 1 }} />
            <button type="button" className="btn-brick" onClick={handleDiscard} style={{ marginLeft: 'var(--space-4)' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Publish — stub dialog (options tailored to type/destination/format later). */}
      {showPublish && (
        <div className="sprint-modal-backdrop" onClick={() => setShowPublish(false)}>
          <div className="sprint-modal card" role="dialog" aria-label="Publish" onClick={e => e.stopPropagation()}>
            <div className="card-title">Publish</div>
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
