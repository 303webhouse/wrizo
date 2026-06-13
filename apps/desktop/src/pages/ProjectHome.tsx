import { useParams, Link, Navigate } from 'react-router-dom';
import { getProject, getStoryPlanByProjectId } from '../store/persistence';
import { getFramework } from '../store/frameworks';

export function ProjectHome() {
  const { id } = useParams<{ id: string }>();
  const project = id ? getProject(id) : null;
  const storyPlan = id ? getStoryPlanByProjectId(id) : null;
  const framework = storyPlan ? getFramework(storyPlan.frameworkId) : null;

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const hasStoryPlan = !!storyPlan;
  const hasSprintText = !!project.sprintText?.trim();
  const beatNotes = storyPlan?.beatNotes || [];
  const touchedBeats = beatNotes.filter(bn => bn.status === 'started' || bn.status === 'complete').length;
  const doneBeats = beatNotes.filter(bn => bn.status === 'complete').length;
  const totalBeats = beatNotes.length;

  return (
    <div className="page">
      <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Launcher
      </Link>

      <h1 className="page-title">{project.title}</h1>
      <p className="page-subtitle">
        {project.type === 'creative' ? 'Creative Project' : 'Academic Project'}
      </p>

      {hasStoryPlan && framework && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-title">Story Structure</div>
          <div className="card-description" style={{ marginBottom: '1rem' }}>
            Using {framework.name} — {touchedBeats} of {totalBeats} beats touched · {doneBeats} done
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to={`/project/${id}/beat`} className="btn btn-primary">
              Continue Writing
            </Link>
            <Link to={`/project/${id}/board`} className="btn btn-secondary">
              View Structure Board
            </Link>
          </div>
        </div>
      )}

      {!hasStoryPlan && (
        <div className="card">
          <div className="card-title">Get Started</div>
          <div className="card-description" style={{ marginBottom: '1rem' }}>
            Choose a structure now or start writing and organize later.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to={`/project/${id}/wizard`} className="btn btn-primary">
              Start Structure Wizard
            </Link>
            <Link to={`/project/${id}/sprint`} className="btn btn-primary">
              Start Writing (Organize Later)
            </Link>
          </div>
        </div>
      )}

      {hasSprintText && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-title">Quick Sprint Draft</div>
          <div className="card-description" style={{ whiteSpace: 'pre-wrap' }}>
            {project.sprintText}
          </div>
        </div>
      )}
    </div>
  );
}
