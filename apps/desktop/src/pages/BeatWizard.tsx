import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { getProject, getStoryPlanByProjectId, updateBeatNotes, setCurrentBeat, flushNow } from '../store/persistence';
import { getFramework } from '../store/frameworks';

const AUTOSAVE_MS = 2000;
const SAVED_STAMP_MS = 2000;

function isLikelySentence(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const endsWithPunctuation = /[.!?]$/.test(trimmed);
  const startsWithCapital = /^[A-Z]/.test(trimmed);
  const wordCount = trimmed.split(/\s+/).length;
  const hasSubjectVerb = /^(The|A|An|I|We|They|He|She|It|You|My|Your|His|Her|Their|This|That)\s+\w+/i.test(trimmed);
  if (endsWithPunctuation && wordCount >= 5) return true;
  if (startsWithCapital && hasSubjectVerb && wordCount >= 4 && endsWithPunctuation) return true;
  return false;
}

function checkForSentences(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.filter(isLikelySentence);
}

export function BeatWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = id ? getProject(id) : null;
  const [storyPlan, setStoryPlan] = useState(() => id ? getStoryPlanByProjectId(id) : null);
  const framework = storyPlan ? getFramework(storyPlan.frameworkId) : null;

  const [notesText, setNotesText] = useState('');
  const [sentenceWarnings, setSentenceWarnings] = useState<string[]>([]);
  const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false);
  const [savedUntil, setSavedUntil] = useState<number | null>(null);

  const currentBeatId = storyPlan?.currentBeatId;
  const currentBeat = framework?.beats.find(b => b.id === currentBeatId);
  const currentBeatIndex = framework?.beats.findIndex(b => b.id === currentBeatId) ?? -1;
  const currentBeatNote = storyPlan?.beatNotes.find(bn => bn.beatId === currentBeatId);

  // Autosave bookkeeping (A1).
  const notesTextRef = useRef('');
  notesTextRef.current = notesText;
  const storyPlanIdRef = useRef(storyPlan?.id);
  storyPlanIdRef.current = storyPlan?.id;
  const currentBeatIdRef = useRef(currentBeatId);
  currentBeatIdRef.current = currentBeatId;
  const lastSavedNotesRef = useRef('');

  useEffect(() => {
    const joined = currentBeatNote ? currentBeatNote.notes.join('\n') : '';
    setNotesText(joined);
    lastSavedNotesRef.current = joined;
    setHasAcknowledgedWarning(false);
    setSentenceWarnings([]);
  }, [currentBeatId]);

  useEffect(() => {
    const warnings = checkForSentences(notesText);
    setSentenceWarnings(warnings);
    if (warnings.length === 0) setHasAcknowledgedWarning(false);
  }, [notesText]);

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

  // Persist notes if changed, then force pending writes to disk (A1).
  const flushNotes = () => {
    const text = notesTextRef.current;
    const planId = storyPlanIdRef.current;
    const beatId = currentBeatIdRef.current;
    if (planId && beatId && text !== lastSavedNotesRef.current) {
      const notes = text.split('\n').map(line => line.trim()).filter(line => line);
      updateBeatNotes(planId, beatId, notes);
      lastSavedNotesRef.current = text;
    }
    flushNow();
  };

  useEffect(() => {
    if (!currentBeatId || notesText === lastSavedNotesRef.current) return;
    const planId = storyPlan?.id;
    if (!planId) return;
    const handle = setTimeout(() => {
      const notes = notesText.split('\n').map(line => line.trim()).filter(line => line);
      updateBeatNotes(planId, currentBeatId, notes);
      lastSavedNotesRef.current = notesText;
      setSavedUntil(Date.now() + SAVED_STAMP_MS);
    }, AUTOSAVE_MS);
    return () => clearTimeout(handle);
  }, [notesText, currentBeatId, storyPlan]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushNotes();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      flushNotes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!project || !storyPlan || !framework) {
    return <Navigate to="/" replace />;
  }

  const handleSave = (showFeedback = false) => {
    if (!storyPlan || !currentBeatId) return;
    const notes = notesText.split('\n').map(line => line.trim()).filter(line => line);
    updateBeatNotes(storyPlan.id, currentBeatId, notes);
    lastSavedNotesRef.current = notesText;
    setStoryPlan(getStoryPlanByProjectId(id!));
    if (showFeedback) setSavedUntil(Date.now() + SAVED_STAMP_MS);
  };

  const jumpToBeat = (beatId: string) => {
    handleSave();
    setCurrentBeat(storyPlan.id, beatId);
    setStoryPlan(getStoryPlanByProjectId(id!));
  };

  const handleNext = () => {
    handleSave();
    if (currentBeatIndex < framework.beats.length - 1) {
      jumpToBeat(framework.beats[currentBeatIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    handleSave();
    if (currentBeatIndex > 0) {
      jumpToBeat(framework.beats[currentBeatIndex - 1].id);
    }
  };

  const handleGoToBoard = () => {
    handleSave();
    navigate(`/project/${id}/board`);
  };

  const isLastBeat = currentBeatIndex === framework.beats.length - 1;
  const showSaved = savedUntil !== null;
  const showWarning = sentenceWarnings.length > 0 && !hasAcknowledgedWarning;

  // Brass rail fill reaches the furthest started/complete beat.
  const furthest = framework.beats.reduce((acc, beat, i) => {
    const st = storyPlan.beatNotes.find(b => b.beatId === beat.id)?.status;
    return st === 'started' || st === 'complete' ? i : acc;
  }, 0);
  const fillPct = framework.beats.length > 1 ? (furthest / (framework.beats.length - 1)) * 100 : 0;

  return (
    <div className="page">
      <Link to={`/project/${id}`} className="btn-quiet" style={{ display: 'inline-block', marginBottom: '1rem', paddingLeft: 0 }}>
        &larr; Back to project
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div className="eyebrow">
          Beat {currentBeatIndex + 1} of {framework.beats.length}
          {currentBeat?.act ? ` · Act ${currentBeat.act}` : ''} · {framework.name}
        </div>
        <button type="button" className="btn-quiet" onClick={handleGoToBoard}>Go to board</button>
      </div>

      {currentBeat && (
        <>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>{currentBeat.name}</h1>
          <p style={{ color: 'var(--text-mid)', fontSize: 15, lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {currentBeat.prompt}
          </p>

          <div className="form-group">
            <label className="form-label">
              Your notes
              <span style={{ fontWeight: 'normal', color: 'var(--text-mid)', marginLeft: '0.5rem', fontSize: 13 }}>
                Bullets and fragments — sentences are for the page.
              </span>
            </label>
            <textarea
              className="form-textarea"
              value={notesText}
              onChange={e => setNotesText(e.target.value)}
              onBlur={flushNotes}
              placeholder="- First idea or fragment&#10;- Another thought&#10;- Key moment or detail"
              style={{ minHeight: 200, background: 'var(--ink-800)', fontFamily: 'var(--font-ui)', fontSize: 15 }}
            />
            {showWarning && (
              <div className="nudge-slip" style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 8 }}>
                  These read like finished sentences. Save them for the draft, or keep them here:
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                  {sentenceWarnings.map((line, i) => (
                    <div key={i}>&ldquo;{line}&rdquo;</div>
                  ))}
                </div>
                <button type="button" className="btn-quiet" style={{ marginTop: 8 }} onClick={() => setHasAcknowledgedWarning(true)}>
                  Keep anyway
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <button type="button" className="btn-ghost" onClick={handlePrevious} disabled={currentBeatIndex === 0}>
              &larr; Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`saved-stamp${showSaved ? '' : ' saved-stamp--hidden'}`}>Saved</span>
              <button type="button" className="btn-brass" onClick={() => handleSave(true)}>Save notes</button>
            </div>
            {!isLastBeat ? (
              <button type="button" className="btn-ghost" onClick={handleNext}>Next beat &rarr;</button>
            ) : (
              <button type="button" className="btn-ghost" onClick={handleGoToBoard}>Finish &rarr; Board</button>
            )}
          </div>
        </>
      )}

      {/* Beat rail — ink-line with one status dot per beat. */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ position: 'relative', padding: '0 6px' }}>
          <div className="ink-line" style={{ position: 'absolute', top: 4, left: 6, right: 6 }}>
            <div className="ink-line__fill" style={{ width: `${fillPct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {framework.beats.map(beat => {
              const status = storyPlan.beatNotes.find(b => b.beatId === beat.id)?.status || 'empty';
              const isCurrent = beat.id === currentBeatId;
              const dotClass = status === 'complete' ? 'status-dot--done' : status === 'started' ? 'status-dot--started' : 'status-dot--empty';
              return (
                <button
                  key={beat.id}
                  type="button"
                  title={beat.name}
                  aria-label={`${beat.name} — ${status}`}
                  onClick={() => jumpToBeat(beat.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <span
                    className={`status-dot ${dotClass}`}
                    style={isCurrent ? { boxShadow: '0 0 0 2px var(--brass)' } : undefined}
                  />
                </button>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, color: 'var(--text-mid)', fontSize: 13 }}>
            {currentBeat?.name}
          </div>
        </div>
      </div>
    </div>
  );
}
