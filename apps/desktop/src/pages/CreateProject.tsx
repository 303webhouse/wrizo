import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createBinder, createBinderPage } from '../store/persistence';
import type { BinderKind } from '../types';

// B1 Slice 2 — the create pipeline (skeleton). Pick a kind (Book/Story/
// Screenplay/Other) + title; optionally scoped to a drawer (?drawer=…, set by the
// in-drawer "Create New"). Book/Story open straight into a first chapter Page in
// the mode-aware editor; Screenplay/Other open the project home. `type` stays
// default creative (academic deferred). Refinement of this flow is later.

const KINDS: { key: BinderKind; label: string; desc: string }[] = [
  { key: 'book', label: 'Book', desc: 'Chapters of prose — a novel or nonfiction' },
  { key: 'story', label: 'Story', desc: 'Short fiction — scenes toward one arc' },
  { key: 'screenplay', label: 'Screenplay', desc: 'Script format (conventions coming)' },
  { key: 'other', label: 'Other', desc: 'Start blank and shape it as you go' },
];

export function CreateProject() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const drawerId = params.get('drawer') || undefined;
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<BinderKind>('book');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const project = createBinder(title.trim(), kind, drawerId);
    // Book / Story = Pages-only from the first keystroke: open a first chapter in
    // the mode-aware editor (never the project's sprintText body).
    if (kind === 'book' || kind === 'story') {
      const chapter = createBinderPage(project.id, 'manuscript');
      navigate(`/page/${chapter.id}`);
    } else {
      navigate(`/project/${project.id}`);
    }
  };

  return (
    <div className="page">
      <Link to="/" className="btn-quiet" style={{ display: 'inline-block', marginBottom: '1rem', paddingLeft: 0 }}>
        &larr; Back
      </Link>

      <div className="eyebrow" style={{ marginBottom: 8 }}>New project</div>
      <h1 className="page-title">What are you writing?</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your project…"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kind</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {KINDS.map(k => (
              <label
                key={k.key}
                className="card kind-card"
                data-kind={k.key}
                data-active={kind === k.key ? 'true' : 'false'}
                style={{
                  cursor: 'pointer',
                  borderColor: kind === k.key ? 'var(--brass)' : 'var(--ink-border)',
                  borderLeft: kind === k.key ? '3px solid var(--brass)' : '1px solid var(--ink-border)',
                }}
              >
                <input
                  type="radio"
                  name="kind"
                  value={k.key}
                  checked={kind === k.key}
                  onChange={() => setKind(k.key)}
                  style={{ display: 'none' }}
                />
                <div className="card-title">{k.label}</div>
                <div className="card-description">{k.desc}</div>
              </label>
            ))}
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="btn-brass" disabled={!title.trim()}>
            {kind === 'book' || kind === 'story' ? 'Start writing' : 'Create'}
          </button>
          <Link to="/" className="btn-quiet">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
