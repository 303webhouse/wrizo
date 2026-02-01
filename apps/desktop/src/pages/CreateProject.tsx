import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProject } from '../store/persistence';

export function CreateProject() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState<'creative' | 'academic'>('creative');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const project = createProject(title.trim(), projectType);

    if (projectType === 'creative') {
      navigate(`/project/${project.id}/wizard`);
    } else {
      navigate(`/project/${project.id}`);
    }
  };

  return (
    <div className="page">
      <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Launcher
      </Link>

      <h1 className="page-title">Create New Project</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Project Title
          </label>
          <input
            id="title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your project title..."
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Project Type</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label
              className="card"
              style={{
                flex: 1,
                cursor: 'pointer',
                borderColor: projectType === 'creative' ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              <input
                type="radio"
                name="projectType"
                value="creative"
                checked={projectType === 'creative'}
                onChange={() => setProjectType('creative')}
                style={{ display: 'none' }}
              />
              <div className="card-title">Creative</div>
              <div className="card-description">Fiction, screenplays, creative non-fiction</div>
            </label>

            <label
              className="card"
              style={{
                flex: 1,
                cursor: 'not-allowed',
                opacity: 0.5,
                borderColor: projectType === 'academic' ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              <input
                type="radio"
                name="projectType"
                value="academic"
                checked={projectType === 'academic'}
                disabled
                style={{ display: 'none' }}
              />
              <div className="card-title">Academic</div>
              <div className="card-description">Coming soon</div>
            </label>
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
            Continue
          </button>
          <Link to="/" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
