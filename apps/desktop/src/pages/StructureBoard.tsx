import { useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { getProject, getStoryPlanByProjectId, setCurrentBeat, setBeatStatus } from '../store/persistence';
import { getFramework } from '../store/frameworks';
import { useMilestoneCelebration } from '../components/WritingIncentives';
import type { MilestoneBeat } from '../store/milestones';

export function StructureBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = id ? getProject(id) : null;
  const [storyPlan, setStoryPlan] = useState(() => id ? getStoryPlanByProjectId(id) : null);
  const framework = storyPlan ? getFramework(storyPlan.frameworkId) : null;

  // M1 S4 — the same celebration grammar as the writing-surface circle-bar
  // (one grammar app-wide), reusing useMilestoneCelebration's mount-seeding
  // law directly: only a transition to 'complete' DURING this mount
  // celebrates, never a beat that was already done when the Board opened.
  // Called unconditionally (before the early return below) per the Rules of
  // Hooks — beatNote.status maps onto the shared empty/kindled/lit
  // vocabulary collapsed to just empty-vs-lit for this purpose ('started'
  // doesn't celebrate, so it's folded into 'empty' here).
  const celebrationInput: MilestoneBeat[] = (framework?.beats ?? []).map(beat => {
    const status = storyPlan?.beatNotes.find(bn => bn.beatId === beat.id)?.status;
    return { id: beat.id, label: beat.name, state: status === 'complete' ? 'lit' : 'empty' };
  });
  // Scoped by the StoryPlan's id, same as the writing-surface circle-bar —
  // beat ids are shared verbatim across every project on the same framework.
  // celebrationInput is already the full, unwindowed beat list, so it doubles
  // as the baseline lit set (no separate windowed/full split needed here).
  const celebrating = useMilestoneCelebration(celebrationInput, storyPlan?.id ?? '', celebrationInput.filter(b => b.state === 'lit').map(b => b.id));

  if (!project || !storyPlan || !framework) {
    return <Navigate to="/" replace />;
  }

  const refresh = () => setStoryPlan(getStoryPlanByProjectId(id!));

  const handleSetAsNext = (beatId: string) => {
    setCurrentBeat(storyPlan.id, beatId);
    refresh();
  };

  const handleOpen = (beatId: string) => {
    setCurrentBeat(storyPlan.id, beatId);
    navigate(`/project/${id}/beat`);
  };

  const handleToggleDone = (beatId: string, isDone: boolean, hasNotes: boolean) => {
    setBeatStatus(storyPlan.id, beatId, isDone ? (hasNotes ? 'started' : 'empty') : 'complete');
    refresh();
  };

  const currentBeat = framework.beats.find(b => b.id === storyPlan.currentBeatId);

  const beatsByAct = framework.beats.reduce((acc, beat) => {
    const act = beat.act || 0;
    if (!acc[act]) acc[act] = [];
    acc[act].push(beat);
    return acc;
  }, {} as Record<number, typeof framework.beats>);
  const acts = Object.keys(beatsByAct).map(Number).sort((a, b) => a - b);
  const hasActs = acts.some(a => a !== 0);

  const renderCard = (beat: typeof framework.beats[number]) => {
    const beatNote = storyPlan.beatNotes.find(bn => bn.beatId === beat.id);
    const status = beatNote?.status || 'empty';
    const notes = beatNote?.notes || [];
    const isCurrent = beat.id === storyPlan.currentBeatId;
    const isDone = status === 'complete';
    const dotClass = isDone ? 'status-dot--done' : status === 'started' ? 'status-dot--started' : 'status-dot--empty';
    const dotCelebrate = celebrating.has(beat.id) ? ' celebrate' : '';

    return (
      <div key={beat.id} className="card board-card" style={{ position: 'relative', marginBottom: 0 }}>
        {isCurrent && <div className="next-bookmark">NEXT</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8, marginBottom: '0.5rem' }}>
          <div className="card-title" style={{ fontSize: '1rem' }}>{beat.name}</div>
          <span className={`status-dot ${dotClass}${dotCelebrate}`} title={status} aria-label={status} style={{ marginTop: 6, flexShrink: 0 }} />
        </div>

        {notes.length > 0 ? (
          <ul style={{ paddingLeft: '1.25rem', margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-mid)' }}>
            {notes.slice(0, 3).map((note, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>
                {note.length > 60 ? note.substring(0, 60) + '…' : note}
              </li>
            ))}
            {notes.length > 3 && (
              <li style={{ color: 'var(--text-low)', fontStyle: 'italic' }}>+{notes.length - 3} more</li>
            )}
          </ul>
        ) : (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-low)', fontStyle: 'italic', marginBottom: '1rem' }}>
            No notes yet — one bullet is enough.
          </div>
        )}

        <button type="button" className="btn-ghost" style={{ width: '100%' }} onClick={() => handleOpen(beat.id)}>
          Open
        </button>

        <div className="board-card__reveal" style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'space-between' }}>
          {!isCurrent ? (
            <button type="button" className="btn-quiet" onClick={() => handleSetAsNext(beat.id)}>Set as next</button>
          ) : <span />}
          <button type="button" className="btn-quiet" onClick={() => handleToggleDone(beat.id, isDone, notes.length > 0)}>
            {isDone ? 'Reopen' : 'Mark done'}
          </button>
        </div>
      </div>
    );
  };

  const grid = (beats: typeof framework.beats) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
      {beats.map(renderCard)}
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <Link to={`/project/${id}`} className="btn-quiet" style={{ display: 'inline-block', marginBottom: '1rem', paddingLeft: 0 }}>
        &larr; Back to project
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{project.title}</h1>
        {currentBeat && (
          <Link to={`/project/${id}/beat`} className="btn-brass">Next beat: {currentBeat.name}</Link>
        )}
      </div>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>{framework.name}</p>

      {hasActs ? (
        acts.map(act => (
          <div key={act} style={{ marginBottom: '2.5rem' }}>
            {act > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <span className="eyebrow">Act {act}</span>
                <span style={{ flex: 1, height: 1, background: 'var(--ink-border)' }} />
              </div>
            )}
            {grid(beatsByAct[act])}
          </div>
        ))
      ) : (
        grid(framework.beats)
      )}
    </div>
  );
}
