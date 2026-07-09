import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getProject, getProjects, importDraft } from '../store/persistence';
import type { JournalEntry } from '../types';

// VW — the Import door. A plain paste surface (a real <textarea> — intentionally
// non-generative: no forward-only, no modes, normal paste) for the writer's own
// work flowing IN. Lands as one binder page (manuscript or a support page) with
// provenance stamped, then behaves as a normal page. The door lives at the edge
// (ProjectHome / Drawers), never inside an editor or on the Desk. One page per
// import, any length (v1).

type ImportKind = Extract<NonNullable<JournalEntry['pageType']>, 'manuscript' | 'research' | 'note'>;
const KIND_CHOICES: { key: ImportKind; label: string; hint: string }[] = [
  { key: 'manuscript', label: 'Manuscript page', hint: 'a chapter or scene — the writing itself' },
  { key: 'research', label: 'Research', hint: 'a support page — sources, reference' },
  { key: 'note', label: 'Note', hint: 'a support page — a loose note' },
];

export function ImportDraft() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  // Binder-scoped (/project/:id/import) knows its target; the Drawers-level door
  // (/import) picks one first.
  const [binderId, setBinderId] = useState<string | null>(id ?? null);
  const [text, setText] = useState('');
  const [kind, setKind] = useState<ImportKind>('manuscript');

  const scopedBinder = id ? getProject(id) : null;
  if (id && !scopedBinder) return <Navigate to="/" replace />;

  const doImport = () => {
    if (!binderId || !text.trim()) return;
    const page = importDraft(binderId, kind, text);
    navigate(`/page/${page.id}`);
  };

  // Step 0 (Drawers door only): pick the binder to import into.
  if (!binderId) {
    const projects = getProjects();
    return (
      <div className="import-draft">
        <Link to="/drawers" className="btn-quiet import-back">&larr; Drawers</Link>
        <div className="eyebrow import-eyebrow">Import a draft</div>
        <h1 className="import-title">Which binder?</h1>
        <p className="import-sub">Your own work, flowing in. Pick where it lands.</p>
        <div className="import-binders">
          {projects.map(p => (
            <button key={p.id} type="button" className="import-binder" onClick={() => setBinderId(p.id)}>{p.title}</button>
          ))}
          {projects.length === 0 && <span className="import-empty">No binders yet — begin a project first.</span>}
        </div>
      </div>
    );
  }

  const targetTitle = getProject(binderId)?.title ?? 'this binder';

  return (
    <div className="import-draft">
      <Link to={id ? `/project/${id}` : '/drawers'} className="btn-quiet import-back">&larr; Back</Link>
      <div className="eyebrow import-eyebrow">Import a draft → {targetTitle}</div>
      <h1 className="import-title">Paste your draft</h1>
      <p className="import-sub">Your own work is always welcome in. Paste it below, choose where it lands, and it becomes a page you can keep writing.</p>

      <textarea
        className="import-textarea"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste your draft here…"
        aria-label="Draft to import"
        autoFocus
      />

      <div className="import-kinds" role="radiogroup" aria-label="Import as">
        {KIND_CHOICES.map(c => (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={kind === c.key}
            data-kind={c.key}
            className={`import-kind${kind === c.key ? ' sel' : ''}`}
            onClick={() => setKind(c.key)}
          >
            <span className="import-kind-label">{c.label}</span>
            <span className="import-kind-hint">{c.hint}</span>
          </button>
        ))}
      </div>

      <div className="import-actions">
        <button type="button" className="btn-brass import-go" disabled={!text.trim()} onClick={doImport}>Import as a page</button>
      </div>
    </div>
  );
}
