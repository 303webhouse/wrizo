import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getJournalEntry, getProject, getProjects, setProjectSprintText, createQuickSprintProject } from '../store/persistence';
import { firstLine, formatStamp } from '../store/entryText';

// J4 — the entry read view: full text, read-only, on a lit paper page.
// J2 — fills the reserved primary-action slot with pull-based routing. The
// journal entry is NEVER modified (read-only); routing is a branch-copy: the
// scrap's text is added to a project's draft as an independent record. Since
// this codebase has no chapters/scenes (a project's prose is the single
// Project.sprintText string), "send to project" appends the scrap to that
// project's draft under a clear demarcation; "promote to a new project" creates
// a fresh project whose draft is the scrap.

const SCRAP_HEADING = '— from the journal —';

// The scrap demarcation. No leading separator when the target draft is blank.
function appendScrap(existing: string, entryText: string): string {
  const block = `${SCRAP_HEADING}\n${entryText}`;
  return existing.trim() ? `${existing}\n\n${block}` : block;
}

function routedTitle(text: string): string {
  return firstLine(text).slice(0, 80);
}

export function JournalEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const entry = id ? getJournalEntry(id) : null;
  if (!entry) return <Navigate to="/journal" replace />;

  const projects = getProjects();

  // Branch-copy into an existing project's draft. The journal entry is untouched.
  const sendToProject = (projectId: string) => {
    const project = getProject(projectId);
    if (!project) return;
    setProjectSprintText(projectId, appendScrap(project.sprintText || '', entry.text));
    navigate(`/project/${projectId}`);
  };

  // Promote into a brand-new project (reuses the quick-sprint creation path).
  const promoteToNew = () => {
    const project = createQuickSprintProject(entry.text, routedTitle(entry.text));
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="page" style={{ maxWidth: 720, paddingTop: '3rem' }}>
      <Link to="/journal" className="btn-quiet" style={{ display: 'inline-block', marginBottom: 24 }}>← The journal</Link>

      <div className="eyebrow" style={{ marginBottom: 8, fontFamily: 'var(--font-mono)' }}>{formatStamp(entry.createdAt)}</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 24, letterSpacing: '-0.01em', color: 'var(--text-hi)', marginBottom: 20 }}>
        {firstLine(entry.text).slice(0, 100)}
      </h1>

      <div
        className="paper-page entry-full"
        style={{
          maxWidth: '68ch', whiteSpace: 'pre-wrap',
          color: 'var(--ink-on-paper)', fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
        }}
      >
        {entry.text}
      </div>

      {/* Routing slot (J2). One brass action; the picker is a transient
          selection, not a competing persistent control. */}
      <div className="entry-action-slot" style={{ marginTop: 24 }}>
        {!picking ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-brass route-open" onClick={() => setPicking(true)}>
              Send to a project
            </button>
          </div>
        ) : (
          <div className="route-picker" style={{ border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)', background: 'var(--ink-900)', padding: '16px' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Send this page to…</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              {projects.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="btn-quiet route-project"
                  data-project-id={p.id}
                  onClick={() => sendToProject(p.id)}
                >
                  {p.title}
                </button>
              ))}
              {projects.length === 0 && (
                <span style={{ color: 'var(--text-low)', fontSize: 13 }}>No projects yet.</span>
              )}
              <button type="button" className="btn-quiet route-new" onClick={promoteToNew} style={{ marginTop: 8 }}>
                Promote to a new project
              </button>
              <button type="button" className="btn-quiet route-cancel" onClick={() => setPicking(false)} style={{ marginTop: 4, color: 'var(--text-low)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
