import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getJournalEntry, getProject, getProjects, saveJournalEntry, setProjectSprintText, createQuickSprintProject } from '../store/persistence';
import { firstLine, formatStamp } from '../store/entryText';
import type { JournalEntry as JournalEntryType } from '../types';

// J4 — the entry read view: full text, read-only, on a lit paper page.
// J2 — fills the reserved slot with pull-based routing (branch-copy: the entry's
//      text is never modified).
// J6 — light, optional emergent metadata: star, free-text tags, and a routed
//      marker (stamped when J2 routes the scrap). All additive, written via
//      saveJournalEntry, synced via the existing journalEntries path. The entry
//      text is still never touched — only metadata.

const SCRAP_HEADING = '— from the journal —';

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
  const [tagDraft, setTagDraft] = useState('');
  const [entry, setEntry] = useState<JournalEntryType | null>(() => (id ? getJournalEntry(id) : null));
  if (!entry) return <Navigate to="/journal" replace />;

  const projects = getProjects();
  const routedIds = entry.routedProjectIds ?? [];

  // Re-save the entry with a metadata patch and refresh local state (the text is
  // never part of the patch — metadata only).
  const patch = (changes: Partial<JournalEntryType>) => {
    const next = { ...entry, ...changes };
    saveJournalEntry(next);
    setEntry(getJournalEntry(entry.id));
  };

  const toggleStar = () => patch({ starred: !entry.starred });

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    const tags = entry.tags ?? [];
    if (!tags.includes(t)) patch({ tags: [...tags, t] });
    setTagDraft('');
  };
  const removeTag = (t: string) => patch({ tags: (entry.tags ?? []).filter(x => x !== t) });

  // Stamp the routed marker (unique project ids) — closes the double-route gap.
  const stampRouted = (projectId: string) => {
    if (routedIds.includes(projectId)) return entry;
    const next = { ...entry, routedProjectIds: [...routedIds, projectId] };
    saveJournalEntry(next);
    return next;
  };

  const sendToProject = (projectId: string) => {
    const project = getProject(projectId);
    if (!project) return;
    setProjectSprintText(projectId, appendScrap(project.sprintText || '', entry.text));
    stampRouted(projectId);
    navigate(`/project/${projectId}`);
  };

  const promoteToNew = () => {
    const project = createQuickSprintProject(entry.text, routedTitle(entry.text));
    stampRouted(project.id);
    navigate(`/project/${project.id}`);
  };

  const routedNames = routedIds.map(pid => getProject(pid)?.title).filter(Boolean) as string[];

  return (
    <div className="page" style={{ maxWidth: 720, paddingTop: '3rem' }}>
      <Link to="/journal" className="btn-quiet" style={{ display: 'inline-block', marginBottom: 24 }}>← The journal</Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="eyebrow" style={{ fontFamily: 'var(--font-mono)' }}>{formatStamp(entry.createdAt)}</div>
        <button
          type="button"
          className="btn-quiet entry-star"
          data-starred={entry.starred ? 'true' : 'false'}
          aria-pressed={!!entry.starred}
          onClick={toggleStar}
          style={{ color: entry.starred ? 'var(--brass)' : 'var(--text-low)' }}
        >
          {entry.starred ? '★ Starred' : '☆ Star'}
        </button>
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 24, letterSpacing: '-0.01em', color: 'var(--text-hi)', margin: '8px 0 16px' }}>
        {firstLine(entry.text).slice(0, 100)}
      </h1>

      {routedNames.length > 0 && (
        <div className="entry-routed" style={{ color: 'var(--text-mid)', fontSize: 13, marginBottom: 16 }}>
          Routed to {routedNames.join(', ')}.
        </div>
      )}

      <div
        className="paper-page entry-full"
        style={{
          maxWidth: '68ch', whiteSpace: 'pre-wrap',
          color: 'var(--ink-on-paper)', fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
        }}
      >
        {entry.text}
      </div>

      {/* Tags (J6): retroactive, free-text, optional. */}
      <div className="entry-tags" style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {(entry.tags ?? []).map(t => (
          <span key={t} className="entry-tag" data-tag={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ink-border)', color: 'var(--text-mid)', fontSize: 13 }}>
            {t}
            <button type="button" className="entry-tag-remove" aria-label={`Remove ${t}`} onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', padding: 0 }}>×</button>
          </span>
        ))}
        <input
          className="entry-tag-input"
          value={tagDraft}
          onChange={e => setTagDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Add a tag"
          style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ink-border)', background: 'var(--ink-800)', color: 'var(--text-hi)', fontFamily: 'var(--font-ui)', fontSize: 13, width: 120 }}
        />
        <button type="button" className="btn-quiet entry-tag-add" onClick={addTag}>Add</button>
      </div>

      {/* Routing slot (J2). One brass action; the picker is a transient
          selection. Projects already routed-to are flagged (J6). */}
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
              {projects.map(p => {
                const already = routedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="btn-quiet route-project"
                    data-project-id={p.id}
                    data-already={already ? 'true' : 'false'}
                    onClick={() => sendToProject(p.id)}
                  >
                    {p.title}{already ? ' · already sent' : ''}
                  </button>
                );
              })}
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
