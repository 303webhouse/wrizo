import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  clearDraft, createQuickSprintProject, flushNow, getDraft, getProject,
  getStoryPlanByProjectId, saveDraft, setBeatStatus, setCurrentBeat, setProjectSprintText,
} from '../store/persistence';
import { getFramework } from '../store/frameworks';

const DRAFT_KEY_PREFIX = 'writer-studio-quick-sprint-draft';
const AUTOSAVE_MS = 2000;
const SAVED_STAMP_MS = 2000;
const PRESETS = [5, 10, 20];
const NUDGE_LIMIT = 3;
const NUDGE_RESET_SECONDS = 180;
const NUDGE_RESET_CHARS = 50;
const KEEP_GOING_SECONDS = 300;

const NUDGES = [
  'Who wants what right now?',
  'What changes today if they fail?',
  'What risk are they avoiding?',
  'Use only concrete actions for the next paragraph.',
  'Cut one sentence and replace it with a sharper verb.',
];

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
  byTimer: boolean;
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

  const [presetMinutes, setPresetMinutes] = useState(10);
  const [showCustom, setShowCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishStats, setFinishStats] = useState<FinishStats | null>(null);
  const [displayWords, setDisplayWords] = useState(0);
  const [draftText, setDraftText] = useState(() => {
    const draft = getDraft(draftId);
    if (draft) return draft.text;
    if (project?.sprintText) return project.sprintText;
    return localStorage.getItem(getDraftKey(id)) || '';
  });
  const [savedUntil, setSavedUntil] = useState<number | null>(null);
  const [currentNudge, setCurrentNudge] = useState('');
  const [nudgesUsed, setNudgesUsed] = useState(0);
  const [showIdleHint, setShowIdleHint] = useState(false);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [chromeHover, setChromeHover] = useState(false);
  const [beatOpen, setBeatOpen] = useState(true);
  const [markBeatDone, setMarkBeatDone] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftTextRef = useRef(draftText);
  draftTextRef.current = draftText;
  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;
  const lastSavedRef = useRef(draftText);
  const suppressFlushRef = useRef(false);
  const hasTypedRef = useRef(false);
  const sessionStartWordsRef = useRef(wordCount(draftText));
  const sprintStartMsRef = useRef<number | null>(null);
  const lastKeystrokeMsRef = useRef(0);
  const lockoutCharBaselineRef = useRef(0);
  const accumTypingSecRef = useRef(0);

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

  // Enter the finish moment. The textarea stays editable + focused behind the
  // card (A7) — never blurred or disabled, so no keystroke is lost at 0:00.
  const enterFinish = (byTimer: boolean) => {
    const words = Math.max(0, wordCount(draftTextRef.current) - sessionStartWordsRef.current);
    const minutes = sprintStartMsRef.current
      ? Math.max(1, Math.round((Date.now() - sprintStartMsRef.current) / 60000))
      : null;
    setFinishStats({ words, minutes, byTimer });
    setIsFinishing(true);
    setIsRunning(false);
  };

  // Timer tick.
  useEffect(() => {
    if (!isRunning || remainingSeconds === null) return;
    const tick = setInterval(() => {
      setRemainingSeconds(curr => (curr === null ? null : Math.max(0, curr - 1)));
    }, 1000);
    return () => clearInterval(tick);
  }, [isRunning, remainingSeconds]);

  // Timer reaches zero → finish card, but writing continues behind it (A7).
  useEffect(() => {
    if (isRunning && remainingSeconds === 0) {
      enterFinish(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isRunning]);

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
    textareaRef.current?.focus();
  }, []);

  // Idle hint: only after the first keystroke of the session; reset on typing (A8).
  useEffect(() => {
    if (!hasTypedRef.current) return;
    setShowIdleHint(false);
    const t = setTimeout(() => setShowIdleHint(true), 60000);
    return () => clearTimeout(t);
  }, [draftText]);

  // Nudge reset (A6): during lockout, accumulate active-typing seconds; once 180s
  // of writing AND 50+ chars have passed, quietly return the nudges.
  useEffect(() => {
    if (nudgesUsed < NUDGE_LIMIT) return;
    lockoutCharBaselineRef.current = draftTextRef.current.length;
    accumTypingSecRef.current = 0;
    const iv = setInterval(() => {
      if (Date.now() - lastKeystrokeMsRef.current <= 10000) {
        accumTypingSecRef.current += 1;
      }
      const charsTyped = draftTextRef.current.length - lockoutCharBaselineRef.current;
      if (accumTypingSecRef.current >= NUDGE_RESET_SECONDS && charsTyped >= NUDGE_RESET_CHARS) {
        setNudgesUsed(0);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [nudgesUsed]);

  const startTimer = (minutes: number) => {
    const secs = Math.round(minutes * 60);
    setPresetMinutes(minutes);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsRunning(true);
    setIsFinishing(false);
    setFinishStats(null);
    sprintStartMsRef.current = Date.now();
    sessionStartWordsRef.current = wordCount(draftTextRef.current);
    textareaRef.current?.focus();
  };

  const handleCustomTimer = () => {
    const minutes = Number(customMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    startTimer(minutes);
    setShowCustom(false);
  };

  const handleChange = (value: string) => {
    hasTypedRef.current = true;
    lastKeystrokeMsRef.current = Date.now();
    setDraftText(value);
  };

  const handleSaveDraft = () => {
    saveDraft(draftId, draftText);
    lastSavedRef.current = draftText;
    if (id) setProjectSprintText(id, draftText);
    markSaved();
  };

  const handleGetNudge = () => {
    if (nudgesUsed >= NUDGE_LIMIT) return;
    setCurrentNudge(NUDGES[nudgesUsed % NUDGES.length]);
    setNudgesUsed(count => count + 1);
  };

  const handleKeepGoing = () => {
    setRemainingSeconds(s => (s ?? 0) + KEEP_GOING_SECONDS);
    setTotalSeconds(s => (s ?? 0) + KEEP_GOING_SECONDS);
    setIsRunning(true);
    setIsFinishing(false);
    setFinishStats(null);
    if (sprintStartMsRef.current === null) sprintStartMsRef.current = Date.now();
    textareaRef.current?.focus();
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
    clearDraft(draftId);
    localStorage.removeItem(getDraftKey(id));
    navigate(id ? `/project/${id}` : '/');
  };

  const handleSaveToProject = () => {
    suppressFlushRef.current = true;
    advanceBeatIfMarked();
    if (id) {
      setProjectSprintText(id, draftText);
      clearDraft(draftId);
      localStorage.removeItem(getDraftKey(id));
      navigate(`/project/${id}`);
      return;
    }
    const created = createQuickSprintProject(draftText);
    clearDraft(draftId);
    localStorage.removeItem(getDraftKey(id));
    navigate(`/project/${created.id}`);
  };

  if (id && !project) {
    return <Navigate to="/" replace />;
  }

  const dimmed = textareaFocused && !chromeHover;
  const locked = nudgesUsed >= NUDGE_LIMIT;
  const fillPct = totalSeconds && remainingSeconds !== null ? (remainingSeconds / totalSeconds) * 100 : 0;
  const chromeHoverProps = {
    onMouseEnter: () => setChromeHover(true),
    onMouseLeave: () => setChromeHover(false),
  };

  const pill = (active: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
    padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    border: `1px solid ${active ? 'var(--brass)' : 'var(--ink-border)'}`,
    background: active ? 'rgba(212,162,78,0.12)' : 'transparent',
    color: active ? 'var(--brass)' : 'var(--text-mid)',
  });

  return (
    <div className="page" style={{ maxWidth: 820, paddingTop: '2.5rem' }}>
      {/* Top bar */}
      <div
        {...chromeHoverProps}
        style={{
          background: 'var(--ink-900)', borderRadius: 'var(--radius-md)',
          padding: '10px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          opacity: dimmed ? 0.7 : 1, transition: 'opacity var(--t-state) var(--ease)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map(m => (
            <button
              key={m}
              type="button"
              style={pill(presetMinutes === m && remainingSeconds !== null)}
              onClick={() => startTimer(m)}
            >
              {m} min
            </button>
          ))}
          <button type="button" style={pill(showCustom)} onClick={() => setShowCustom(v => !v)}>
            Custom
          </button>
          {showCustom && (
            <span style={{ display: 'inline-flex', gap: 6 }}>
              <input
                type="number"
                min={1}
                value={customMinutes}
                onChange={e => setCustomMinutes(e.target.value)}
                placeholder="min"
                style={{
                  width: 64, padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--ink-border)', background: 'var(--ink-800)',
                  color: 'var(--text-hi)', fontFamily: 'var(--font-ui)',
                }}
              />
              <button type="button" className="btn-quiet" onClick={handleCustomTimer}>Set</button>
            </span>
          )}
          <button type="button" className="btn-quiet" onClick={handleGetNudge} disabled={locked}>
            Take a nudge
          </button>
        </div>
        {remainingSeconds !== null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, lineHeight: 1, color: 'var(--text-hi)' }}>
            {formatClock(remainingSeconds)}
          </span>
        )}
      </div>
      {/* Timer hairline drains while running */}
      {remainingSeconds !== null && (
        <div className="hairline-timer" style={{ marginBottom: 16 }}>
          <div className="hairline-timer__fill" style={{ width: `${fillPct}%` }} />
        </div>
      )}
      {remainingSeconds === null && <div style={{ height: 16 }} />}

      {/* Beat context strip (A4) */}
      {currentBeat && (
        <div style={{
          border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)',
          background: 'var(--ink-900)', padding: '12px 16px', marginBottom: 16,
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

      {/* Nudge slip, tucked under the page's top edge */}
      {(currentNudge || (showIdleHint && !locked) || locked) && (
        <div className="nudge-slip" style={{ marginBottom: 12 }}>
          {locked
            ? 'Nudges return after a few minutes of writing.'
            : currentNudge
              ? currentNudge
              : 'A minute of quiet. A nudge is there if you want one.'}
        </div>
      )}

      {/* The page */}
      <div
        className="paper-page"
        style={{
          maxWidth: '68ch', margin: '0 auto', minHeight: '60vh', position: 'relative',
          boxShadow: textareaFocused
            ? '0 0 0 1px rgba(243,237,225,0.10), 0 6px 40px rgba(212,162,78,0.18), 0 2px 12px rgba(0,0,0,0.45)'
            : 'var(--paper-glow)',
          transition: 'box-shadow var(--t-state) var(--ease)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={draftText}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setTextareaFocused(true)}
          onBlur={() => { setTextareaFocused(false); flushDraft(); }}
          placeholder="Write without stopping…"
          style={{
            width: '100%', minHeight: '54vh', border: 'none', outline: 'none',
            background: 'transparent', resize: 'none', color: 'var(--ink-on-paper)',
            fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
          }}
        />
        <div style={{
          position: 'absolute', bottom: 12, right: 16,
          fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-on-paper-low)',
        }}>
          {wordCount(draftText)} words
        </div>
      </div>

      {/* Bottom bar (hidden during the finish moment so the card owns the brass) */}
      {!isFinishing && (
        <div
          {...chromeHoverProps}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, opacity: dimmed ? 0.7 : 1, transition: 'opacity var(--t-state) var(--ease)',
          }}
        >
          <span className={`saved-stamp${savedUntil ? '' : ' saved-stamp--hidden'}`}>Saved</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn-quiet" onClick={handleSaveDraft}>Save</button>
            <button type="button" className="btn-brass" onClick={() => enterFinish(false)}>Finish</button>
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
            {finishStats.byTimer ? 'Time.' : `${displayWords} words down.`}
          </div>
          {finishStats.byTimer && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>
              {displayWords} words in {finishStats.minutes} minutes
            </div>
          )}

          {currentBeat && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0', color: 'var(--text-mid)', cursor: 'pointer' }}>
              <input type="checkbox" checked={markBeatDone} onChange={e => setMarkBeatDone(e.target.checked)} />
              Mark {currentBeat.name} done
            </label>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <button type="button" className="btn-brass" onClick={handleKeepGoing}>Keep going (+5 min)</button>
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
    </div>
  );
}
