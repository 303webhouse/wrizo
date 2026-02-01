import { useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { getProject, getStoryPlanByProjectId, setCurrentBeat } from '../store/persistence';
import { getFramework } from '../store/frameworks';

export function StructureBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = id ? getProject(id) : null;
  const [storyPlan, setStoryPlan] = useState(() => id ? getStoryPlanByProjectId(id) : null);
  const framework = storyPlan ? getFramework(storyPlan.frameworkId) : null;

  if (!project || !storyPlan || !framework) {
    return <Navigate to="/" replace />;
  }

  const handleSetAsNextBeat = (beatId: string) => {
    setCurrentBeat(storyPlan.id, beatId);
    const refreshedPlan = getStoryPlanByProjectId(id!);
    setStoryPlan(refreshedPlan);
  };

  const handleGoToBeat = (beatId: string) => {
    setCurrentBeat(storyPlan.id, beatId);
    navigate(`/project/${id}/beat`);
  };

  // Group beats by act if available
  const beatsByAct = framework.beats.reduce((acc, beat) => {
    const act = beat.act || 0;
    if (!acc[act]) acc[act] = [];
    acc[act].push(beat);
    return acc;
  }, {} as Record<number, typeof framework.beats>);

  const acts = Object.keys(beatsByAct).map(Number).sort((a, b) => a - b);
  const hasActs = acts.some(a => a !== 0);

  return (
    <div className="page" style={{ maxWidth: '1000px' }}>
      <Link to={`/project/${id}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Project
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Structure Board</h1>
        <Link to={`/project/${id}/beat`} className="btn btn-primary">
          Continue Writing
        </Link>
      </div>

      <p className="page-subtitle">{framework.name} &middot; {project.title}</p>

      {hasActs ? (
        // Display by acts
        acts.map(act => (
          <div key={act} style={{ marginBottom: '2rem' }}>
            {act > 0 && (
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                Act {act}
              </h2>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {beatsByAct[act].map(beat => {
                const beatNote = storyPlan.beatNotes.find(bn => bn.beatId === beat.id);
                const status = beatNote?.status || 'empty';
                const isCurrentBeat = beat.id === storyPlan.currentBeatId;

                return (
                  <div
                    key={beat.id}
                    className="card"
                    style={{
                      borderColor: isCurrentBeat ? 'var(--color-primary)' : 'var(--color-border)',
                      position: 'relative',
                    }}
                  >
                    {isCurrentBeat && (
                      <div style={{
                        position: 'absolute',
                        top: '-0.5rem',
                        right: '0.75rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                      }}>
                        NEXT
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div className="card-title" style={{ fontSize: '1rem' }}>{beat.name}</div>
                      <span className={`status-${status}`} style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {status}
                      </span>
                    </div>

                    {beatNote && beatNote.notes.length > 0 ? (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                          {beatNote.notes.slice(0, 3).map((note, i) => (
                            <li key={i} style={{ marginBottom: '0.25rem' }}>
                              {note.length > 60 ? note.substring(0, 60) + '...' : note}
                            </li>
                          ))}
                          {beatNote.notes.length > 3 && (
                            <li style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              +{beatNote.notes.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
                        No notes yet
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                        onClick={() => handleGoToBeat(beat.id)}
                      >
                        Edit
                      </button>
                      {!isCurrentBeat && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                          onClick={() => handleSetAsNextBeat(beat.id)}
                        >
                          Set as Next
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        // Display flat list
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {framework.beats.map(beat => {
            const beatNote = storyPlan.beatNotes.find(bn => bn.beatId === beat.id);
            const status = beatNote?.status || 'empty';
            const isCurrentBeat = beat.id === storyPlan.currentBeatId;

            return (
              <div
                key={beat.id}
                className="card"
                style={{
                  borderColor: isCurrentBeat ? 'var(--color-primary)' : 'var(--color-border)',
                  position: 'relative',
                }}
              >
                {isCurrentBeat && (
                  <div style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '0.75rem',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                  }}>
                    NEXT
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div className="card-title" style={{ fontSize: '1rem' }}>{beat.name}</div>
                  <span className={`status-${status}`} style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    {status}
                  </span>
                </div>

                {beatNote && beatNote.notes.length > 0 ? (
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                      {beatNote.notes.slice(0, 3).map((note, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>
                          {note.length > 60 ? note.substring(0, 60) + '...' : note}
                        </li>
                      ))}
                      {beatNote.notes.length > 3 && (
                        <li style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          +{beatNote.notes.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
                    No notes yet
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                    onClick={() => handleGoToBeat(beat.id)}
                  >
                    Edit
                  </button>
                  {!isCurrentBeat && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                      onClick={() => handleSetAsNextBeat(beat.id)}
                    >
                      Set as Next
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
