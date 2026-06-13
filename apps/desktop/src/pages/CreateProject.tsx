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

    navigate(`/project/${project.id}`);
  };

  return (
    <div className="page">
      <Link to="/" className="btn-quiet" style={{ display: 'inline-block', marginBottom: '1rem', paddingLeft: 0 }}>
        &larr; Back to launcher
      </Link>

      <div className="eyebrow" style={{ marginBottom: 8 }}>New project</div>
      <h1 className="page-title">What are you writing?</h1>

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
                borderColor: projectType === 'creative' ? 'var(--brass)' : 'var(--ink-border)',
                borderLeft: projectType === 'creative' ? '3px solid var(--brass)' : '1px solid var(--ink-border)',
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
              style={{ flex: 1, cursor: 'not-allowed', opacity: 0.6 }}
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
              <div className="card-description">Arriving in Stage 2</div>
            </label>
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="btn-brass" disabled={!title.trim()}>
            Continue
          </button>
          <Link to="/" className="btn-quiet">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
