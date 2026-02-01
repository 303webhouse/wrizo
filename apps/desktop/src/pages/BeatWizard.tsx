import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { getProject, getStoryPlanByProjectId, updateBeatNotes, setCurrentBeat } from '../store/persistence';
import { getFramework } from '../store/frameworks';
import type { Beat } from '../types';

function isLikelySentence(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Check if line ends with sentence-ending punctuation
  const endsWithPunctuation = /[.!?]$/.test(trimmed);

  // Check if line starts with capital and has multiple words
  const startsWithCapital = /^[A-Z]/.test(trimmed);
  const wordCount = trimmed.split(/\s+/).length;

  // Check for common sentence patterns
  const hasSubjectVerb = /^(The|A|An|I|We|They|He|She|It|You|My|Your|His|Her|Their|This|That)\s+\w+/i.test(trimmed);

  // A line is likely a sentence if:
  // - It ends with punctuation AND has 5+ words
  // - OR it starts with capital, has subject-verb pattern, and has 4+ words
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

  useEffect(() => {
    if (currentBeatNote) {
      setNotesText(currentBeatNote.notes.join('\n'));
    } else {
      setNotesText('');
    }
    setHasAcknowledgedWarning(false);
    setSentenceWarnings([]);
  }, [currentBeatId]);

  useEffect(() => {
    const warnings = checkForSentences(notesText);
    setSentenceWarnings(warnings);
    if (warnings.length === 0) {
      setHasAcknowledgedWarning(false);
    }
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

  if (!project || !storyPlan || !framework) {
    return <Navigate to="/" replace />;
  }

  const handleSave = (showFeedback = false) => {
    if (!storyPlan || !currentBeatId) return;

    const notes = notesText.split('\n').map(line => line.trim()).filter(line => line);
    updateBeatNotes(storyPlan.id, currentBeatId, notes);

    // Refresh story plan from storage
    const refreshedPlan = getStoryPlanByProjectId(id!);
    setStoryPlan(refreshedPlan);

    if (showFeedback) {
      setSavedUntil(Date.now() + 12000);
    }
  };

  const handleNext = () => {
    handleSave();

    if (currentBeatIndex < framework.beats.length - 1) {
      const nextBeat = framework.beats[currentBeatIndex + 1];
      setCurrentBeat(storyPlan.id, nextBeat.id);
      const refreshedPlan = getStoryPlanByProjectId(id!);
      setStoryPlan(refreshedPlan);
    }
  };

  const handlePrevious = () => {
    handleSave();

    if (currentBeatIndex > 0) {
      const prevBeat = framework.beats[currentBeatIndex - 1];
      setCurrentBeat(storyPlan.id, prevBeat.id);
      const refreshedPlan = getStoryPlanByProjectId(id!);
      setStoryPlan(refreshedPlan);
    }
  };

  const handleGoToBoard = () => {
    handleSave();
    navigate(`/project/${id}/board`);
  };

  const canSave = sentenceWarnings.length === 0 || hasAcknowledgedWarning;
  const isLastBeat = currentBeatIndex === framework.beats.length - 1;
  const showSaved = savedUntil !== null;

  return (
    <div className="page">
      <Link to={`/project/${id}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Project
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Beat Wizard</h1>
        <button className="btn btn-secondary" onClick={handleGoToBoard} style={{ fontSize: '0.875rem' }}>
          Go to Structure Board
        </button>
      </div>

      <p className="page-subtitle">
        Beat {currentBeatIndex + 1} of {framework.beats.length} &middot; {framework.name}
      </p>

      {currentBeat && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title" style={{ marginBottom: '0.5rem' }}>
              {currentBeat.name}
              {currentBeat.act && <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>Act {currentBeat.act}</span>}
            </div>
            <div className="card-description">{currentBeat.prompt}</div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Your Notes
              <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                (bullets and fragments only)
              </span>
            </label>
            <textarea
              className="form-textarea"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="- First idea or fragment&#10;- Another thought&#10;- Key moment or detail"
              style={{ minHeight: '200px' }}
            />

            {sentenceWarnings.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div className="warning-text" style={{ marginBottom: '0.5rem' }}>
                  These lines look like full sentences. Beat notes should be bullets or fragments:
                </div>
                <div style={{ fontSize: '0.875rem', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                  {sentenceWarnings.map((line, i) => (
                    <div key={i} style={{ marginBottom: '0.25rem' }}>&ldquo;{line}&rdquo;</div>
                  ))}
                </div>
                {!hasAcknowledgedWarning && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setHasAcknowledgedWarning(true)}
                    style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}
                  >
                    Keep anyway
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handlePrevious}
              disabled={currentBeatIndex === 0}
            >
              &larr; Previous Beat
            </button>

            <button
              className="btn btn-primary"
              onClick={() => handleSave(true)}
              disabled={!canSave}
            >
              {showSaved ? 'Saved' : 'Save Notes'}
            </button>
            {showSaved && (
              <span style={{ marginLeft: '0.75rem', color: 'var(--color-success)', fontSize: '0.875rem' }}>
                Saved
              </span>
            )}

            {!isLastBeat ? (
              <button
                className="btn btn-secondary"
                onClick={handleNext}
                disabled={!canSave}
              >
                Next Beat &rarr;
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleGoToBoard}
                disabled={!canSave}
              >
                Finish &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>All Beats</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {framework.beats.map((beat, index) => {
            const beatNote = storyPlan.beatNotes.find(bn => bn.beatId === beat.id);
            const isActive = beat.id === currentBeatId;
            const hasNotes = beatNote && beatNote.notes.length > 0;

            return (
              <button
                key={beat.id}
                onClick={() => {
                  handleSave();
                  setCurrentBeat(storyPlan.id, beat.id);
                  const refreshedPlan = getStoryPlanByProjectId(id!);
                  setStoryPlan(refreshedPlan);
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isActive ? 'white' : hasNotes ? 'var(--color-success)' : 'var(--color-text-muted)',
                  border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {index + 1}. {beat.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
