import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { createQuickSprintProject, getProject, setProjectSprintText } from '../store/persistence';

const DRAFT_KEY_PREFIX = 'writer-studio-quick-sprint-draft';
const PRESETS = [5, 10, 20];

const NUDGES = [
  'Who wants what right now?',
  'What changes today if they fail?',
  'What risk are they avoiding?',
  'Use only concrete actions for the next paragraph.',
  'Cut one sentence and replace it with a sharper verb.',
];

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getDraftKey(projectId?: string): string {
  return projectId ? `${DRAFT_KEY_PREFIX}-${projectId}` : DRAFT_KEY_PREFIX;
}

export function QuickSprint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = id ? getProject(id) : null;
  const draftKey = getDraftKey(id);
  const [presetMinutes, setPresetMinutes] = useState(10);
  const [customMinutes, setCustomMinutes] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [endedByTimer, setEndedByTimer] = useState(false);
  const [draftText, setDraftText] = useState(() => {
    if (project?.sprintText) return project.sprintText;
    return localStorage.getItem(draftKey) || '';
  });
  const [savedUntil, setSavedUntil] = useState<number | null>(null);
  const [currentNudge, setCurrentNudge] = useState('');
  const [nudgesUsed, setNudgesUsed] = useState(0);
  const [showIdleHint, setShowIdleHint] = useState(false);

  useEffect(() => {
    if (!isRunning || isFinishing || remainingSeconds === null) return;
    const tick = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null) return null;
        if (current <= 1) {
          clearInterval(tick);
          setIsRunning(false);
          setEndedByTimer(true);
          setIsFinishing(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [isRunning, isFinishing, remainingSeconds]);

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

  useEffect(() => {
    if (project?.sprintText) {
      setDraftText(project.sprintText);
      return;
    }
    setDraftText(localStorage.getItem(draftKey) || '');
  }, [project?.sprintText, draftKey]);

  useEffect(() => {
    setShowIdleHint(false);
    const timeout = setTimeout(() => {
      setShowIdleHint(true);
    }, 60000);
    return () => clearTimeout(timeout);
  }, [draftText]);

  const selectPreset = (minutes: number) => {
    setPresetMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setIsRunning(true);
    setEndedByTimer(false);
    setIsFinishing(false);
  };

  const handleCustomTimer = () => {
    const minutes = Number(customMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    setPresetMinutes(minutes);
    setRemainingSeconds(Math.round(minutes * 60));
    setIsRunning(true);
    setEndedByTimer(false);
    setIsFinishing(false);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(draftKey, draftText);
    if (id) {
      setProjectSprintText(id, draftText);
    }
    setSavedUntil(Date.now() + 12000);
  };

  const handleGetNudge = () => {
    if (nudgesUsed >= 3) return;
    setCurrentNudge(NUDGES[nudgesUsed % NUDGES.length]);
    setNudgesUsed((count) => count + 1);
  };

  const handleFinish = () => {
    setIsRunning(false);
    setIsFinishing(true);
  };

  const handleDiscard = () => {
    localStorage.removeItem(draftKey);
    navigate(id ? `/project/${id}` : '/');
  };

  const handleSaveAsProject = () => {
    if (id) {
      setProjectSprintText(id, draftText);
      localStorage.removeItem(draftKey);
      navigate(`/project/${id}`);
      return;
    }
    const project = createQuickSprintProject(draftText);
    localStorage.removeItem(draftKey);
    navigate(`/project/${project.id}`);
  };

  if (id && !project) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page">
      <Link
        to={id ? `/project/${id}` : '/'}
        style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}
      >
        &larr; Back to {id ? 'Project' : 'Launcher'}
      </Link>

      <h1 className="page-title" style={{ marginBottom: '0.75rem' }}>Quick Sprint</h1>
      <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
        Pick a timer, write fast, then save or discard.
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PRESETS.map((minutes) => (
              <button
                key={minutes}
                className={presetMinutes === minutes ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => selectPreset(minutes)}
                style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
              >
                {minutes} min
              </button>
            ))}
            <input
              type="number"
              min={1}
              step={1}
              className="form-input"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="Custom min"
              style={{ width: '110px', padding: '0.5rem 0.6rem' }}
            />
            <button className="btn btn-secondary" onClick={handleCustomTimer} style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}>
              Set Timer
            </button>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, minWidth: '90px', textAlign: 'right' }}>
            {remainingSeconds === null ? '--:--' : formatClock(remainingSeconds)}
          </div>
        </div>
        <div className="card-description" style={{ marginTop: '0.75rem' }}>
          Timer is optional. Start one when you want, or just write.
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Nudge</div>
        <div className="card-description" style={{ marginBottom: '0.75rem' }}>
          {currentNudge || 'Need a push? Ask for one nudge when you need it.'}
        </div>
        <button className="btn btn-secondary" onClick={handleGetNudge} disabled={nudgesUsed >= 3}>
          Get Nudge
        </button>
        {showIdleHint && nudgesUsed < 3 && (
          <div className="card-description" style={{ marginTop: '0.5rem' }}>
            No typing for a minute. Tap Get Nudge for a prompt.
          </div>
        )}
        {nudgesUsed >= 3 && (
          <div className="warning-text">
            You've used 3 nudges - write for 3 minutes before asking for more.
          </div>
        )}
      </div>

      <textarea
        className="form-textarea"
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        placeholder="Write without stopping..."
        style={{ minHeight: '320px' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={handleSaveDraft}>
          {savedUntil ? 'Saved' : 'Save'}
        </button>
        <button className="btn btn-primary" onClick={handleFinish}>
          Finish
        </button>
        {savedUntil && <span style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>Saved</span>}
      </div>

      {isFinishing && (
        <div className="card" style={{ marginTop: '1.5rem', borderColor: 'var(--color-primary)' }}>
          <div className="card-title" style={{ marginBottom: '0.5rem' }}>
            {endedByTimer ? 'Time is up.' : 'Sprint finished.'}
          </div>
          <div className="card-description" style={{ marginBottom: '1rem' }}>
            {id ? 'Save this sprint to your project or discard it.' : 'Save this sprint as a project or discard it.'}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleSaveAsProject}>
              {id ? 'Save to Project' : 'Save as Project'}
            </button>
            <button className="btn btn-secondary" onClick={handleDiscard}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
