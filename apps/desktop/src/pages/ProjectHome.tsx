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
  const beatNotes = storyPlan?.beatNotes || [];
  const completedBeats = beatNotes.filter(bn => bn.status === 'started').length;
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
            Using {framework.name} ({completedBeats}/{totalBeats} beats with notes)
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
            Choose a story structure to organize your writing.
          </div>
          <Link to={`/project/${id}/wizard`} className="btn btn-primary">
            Start Structure Wizard
          </Link>
        </div>
      )}
    </div>
  );
}
