import { Link } from 'react-router-dom';
import { getProjects } from '../store/persistence';

export function SessionLauncher() {
  const projects = getProjects();

  return (
    <div className="page" style={{ paddingTop: '4rem' }}>
      <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        Writer Studio
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
        <Link to="/project/new" className="btn btn-primary" style={{ padding: '1.25rem 2rem', fontSize: '1.1rem' }}>
          Create New Project
        </Link>

        <Link to="/sprint" className="btn btn-secondary" style={{ padding: '1.25rem 2rem', fontSize: '1.1rem' }}>
          Start Writing (Quick Sprint)
        </Link>

        <button className="btn btn-secondary" style={{ padding: '1.25rem 2rem', fontSize: '1.1rem' }} disabled>
          Open Existing Project (Coming Soon)
        </button>
      </div>

      {projects.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>Recent Projects</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '400px', margin: '0 auto' }}>
            {projects.slice(0, 5).map(project => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card-title">{project.title}</div>
                <div className="card-description">
                  {project.type === 'creative' ? 'Creative Project' : 'Academic Project'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
