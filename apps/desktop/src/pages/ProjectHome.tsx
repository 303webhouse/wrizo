import { useParams, Link, Navigate } from 'react-router-dom';
import { getProject, getStoryPlanByProjectId, getBinderPages } from '../store/persistence';
import { getFramework } from '../store/frameworks';
import { firstLine } from '../store/entryText';
import { PageFileMenu } from '../components/PageFileMenu';

export function ProjectHome() {
  const { id } = useParams<{ id: string }>();
  const project = id ? getProject(id) : null;
  const storyPlan = id ? getStoryPlanByProjectId(id) : null;
  const framework = storyPlan ? getFramework(storyPlan.frameworkId) : null;

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const beatNotes = storyPlan?.beatNotes || [];
  const touchedBeats = beatNotes.filter(bn => bn.status === 'started' || bn.status === 'complete').length;
  const doneBeats = beatNotes.filter(bn => bn.status === 'complete').length;
  const totalBeats = beatNotes.length;
  const hasSprint = !!project.sprintText?.trim();
  const currentBeat = framework?.beats.find(b => b.id === storyPlan?.currentBeatId);
  // Pages filed into this binder (D2). The main draft above stays the binder's
  // primary surface; these are additional documents filed from the Shelf/Journal.
  const pages = id ? getBinderPages(id) : [];

  // One brass action, computed from state.
  const primary = storyPlan && currentBeat
    ? { label: `Next beat: ${currentBeat.name}`, to: `/project/${id}/beat` }
    : hasSprint
      ? { label: 'Resume sprint', to: `/project/${id}/sprint` }
      : { label: 'Choose a structure', to: `/project/${id}/wizard` };

  const fillPct = totalBeats > 0 ? (touchedBeats / totalBeats) * 100 : 0;

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <Link to="/" className="btn-quiet" style={{ display: 'inline-block', marginBottom: '1rem', paddingLeft: 0 }}>
        &larr; Back to launcher
      </Link>

      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {project.type === 'creative' ? 'Creative project' : 'Academic project'}
      </div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>{project.title}</h1>

      <div style={{ marginBottom: '2rem' }}>
        {(hasSprint || touchedBeats > 0) && (
          <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--brass)' }}>↩ you last wrote here</div>
        )}
        <Link to={primary.to} className="btn-brass">{primary.label}</Link>
      </div>

      {storyPlan && framework && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <div className="card-title" style={{ fontSize: '1rem' }}>{framework.name}</div>
            <Link to={`/project/${id}/board`} className="btn-quiet">View board</Link>
          </div>
          <div style={{ color: 'var(--text-mid)', fontSize: 13, margin: '4px 0 12px' }}>
            {touchedBeats} of {totalBeats} beats touched · {doneBeats} done
          </div>
          <div className="ink-line">
            <div className="ink-line__fill" style={{ width: `${fillPct}%` }} />
          </div>
        </div>
      )}

      {!storyPlan && (
        <div className="card">
          <div className="card-title">Get started</div>
          <div className="card-description" style={{ marginBottom: '1rem' }}>
            Choose a structure now, or just start writing and organize later.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to={`/project/${id}/wizard`} className="btn-ghost">Choose a structure</Link>
            <Link to={`/project/${id}/sprint`} className="btn-ghost">Start writing</Link>
          </div>
        </div>
      )}

      {hasSprint && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Sprint draft</div>
          <div className="paper-page" style={{ position: 'relative', maxHeight: '11rem', overflow: 'hidden' }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{project.sprintText}</div>
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: '4rem',
              background: 'linear-gradient(to bottom, transparent, var(--paper))',
            }} />
          </div>
          <Link to={`/project/${id}/sprint`} className="btn-quiet" style={{ display: 'inline-block', marginTop: 8, paddingLeft: 0 }}>
            Open sprint
          </Link>
        </div>
      )}

      {/* Pages (D2) — documents filed into this binder, from the Shelf or Journal. */}
      {pages.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Pages</div>
          <div className="dz-tree" style={{ maxWidth: '100%', margin: 0 }}>
            <div className="dz-group">
              <div className="dz-items" style={{ borderTop: 'none' }}>
                {pages.map(p => (
                  <div key={p.id} className="dz-row" style={{ paddingLeft: 6 }}>
                    <Link to={`/journal/${p.id}`} className="dz-rowtitle" style={{ textDecoration: 'none' }}>
                      {p.text.trim() ? firstLine(p.text).slice(0, 80) : 'Untitled page'}
                    </Link>
                    <PageFileMenu page={p} label="move…" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
