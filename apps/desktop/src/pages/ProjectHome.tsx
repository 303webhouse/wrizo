import { useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { getProject, getStoryPlanByProjectId, getBinderPages, createBinderPage, createScriptPage, saveProject } from '../store/persistence';
import { getFramework } from '../store/frameworks';
import { firstLine } from '../store/entryText';
import { domainLabel } from '../store/kindLabels';
import { PageFileMenu } from '../components/PageFileMenu';
import { useLexicon } from '../store/themeLexicon';
import type { JournalEntry } from '../types';

// S1 — 'script' rides the same generic type-picker as the support types (any
// binder may hold a script page, not only Screenplay-kind ones), but a script
// page needs its OWN seeded ScriptDoc (createScriptPage), not a blank
// createBinderPage entry — see addSupport below. It also renders in its own
// "Scripts" section (atop Manuscript), never under Support pages.
const SUPPORT_TYPES: { key: NonNullable<JournalEntry['pageType']>; label: string }[] = [
  { key: 'character', label: 'Character' },
  { key: 'worldbuilding', label: 'Worldbuilding' },
  { key: 'research', label: 'Research' },
  { key: 'note', label: 'Note' },
  { key: 'script', label: 'Script' },
];

// Open a binder page: typed pages (manuscript/support, B1) use the mode-aware
// page editor; legacy untyped filed pages keep the authored journal editor.
function pageRoute(p: JournalEntry): string {
  return p.pageType ? `/page/${p.id}` : `/journal/${p.id}`;
}

export function ProjectHome() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: lex, tMany: lexMany } = useLexicon();
  const [addingSupport, setAddingSupport] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const project = id ? getProject(id) : null;
  const storyPlan = id ? getStoryPlanByProjectId(id) : null;
  const framework = storyPlan ? getFramework(storyPlan.frameworkId) : null;

  if (!project || !id) {
    return <Navigate to="/" replace />;
  }

  const beatNotes = storyPlan?.beatNotes || [];
  const touchedBeats = beatNotes.filter(bn => bn.status === 'started' || bn.status === 'complete').length;
  const doneBeats = beatNotes.filter(bn => bn.status === 'complete').length;
  const totalBeats = beatNotes.length;
  const hasSprint = !!project.sprintText?.trim();
  const currentBeat = framework?.beats.find(b => b.id === storyPlan?.currentBeatId);
  // Pages in this binder (B1). Manuscript pages are the writing (chapters/scenes);
  // script pages (S1) are a sibling of Manuscript, grouped atop it; support pages
  // (character/worldbuilding/research/note) are grouped apart. Legacy untyped
  // pages (D2 filed) ride along under support. The Plan (StoryPlan) is NOT a
  // page — it's reached via the board.
  const pages = getBinderPages(id).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const chapters = pages.filter(p => p.pageType === 'manuscript');
  const scripts = pages.filter(p => p.pageType === 'script');
  const support = pages.filter(p => p.pageType !== 'manuscript' && p.pageType !== 'script');

  const newChapter = () => navigate(`/page/${createBinderPage(id, 'manuscript').id}`);
  const newScript = () => navigate(`/page/${createScriptPage(id).id}`);
  // S1 — a script page needs its own seeded ScriptDoc; the generic
  // createBinderPage would leave `entry.script` undefined.
  const addSupport = (type: NonNullable<JournalEntry['pageType']>) =>
    navigate(`/page/${(type === 'script' ? createScriptPage(id) : createBinderPage(id, type)).id}`);

  // F4 Slice 5 — title-later's other half: rename "Untitled" (or anything) inline
  // from the place the writer naturally sees it. Enter/blur commits via saveProject
  // (the crumb + mirror card reflect it on the next render); Escape cancels.
  const startRename = () => { setTitleDraft(project.title); setEditingTitle(true); };
  const commitRename = () => {
    const next = titleDraft.trim();
    if (next && next !== project.title) saveProject({ ...project, title: next });
    setEditingTitle(false);
  };

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
        {domainLabel(project.type)}
      </div>
      {editingTitle ? (
        <input
          className="page-title project-rename"
          autoFocus
          value={titleDraft}
          onChange={e => setTitleDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
            else if (e.key === 'Escape') { setEditingTitle(false); }
          }}
          aria-label="Project title"
          style={{ marginBottom: '1.5rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--brass)', color: 'var(--text-hi)', outline: 'none', width: '100%', maxWidth: '100%', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}
        />
      ) : (
        <h1 className="page-title project-title-editable" style={{ marginBottom: '1.5rem', cursor: 'text' }} title="Click to rename" onClick={startRename}>{project.title}</h1>
      )}

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

      {/* S1 — Scripts: the Screenplay Room's pages, grouped atop Manuscript.
          Any binder may hold one (TV episodes are sibling script pages); the
          Screenplay kind just defaults to one from birth. Rendered only when
          the binder actually has one, so every non-screenplay project's home
          looks exactly as it did before S1. */}
      {scripts.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Scripts</div>
          <div className="dz-tree" style={{ maxWidth: '100%', margin: 0 }}>
            <div className="dz-group">
              <div className="dz-items" style={{ borderTop: 'none' }}>
                {scripts.map((p, i) => (
                  <div key={p.id} className="dz-row" style={{ paddingLeft: 6 }}>
                    <Link to={pageRoute(p)} className="dz-rowtitle" style={{ textDecoration: 'none' }}>
                      {p.text.trim() ? firstLine(p.text).slice(0, 80) : `Script ${i + 1}`}
                    </Link>
                    <PageFileMenu page={p} label="move…" />
                  </div>
                ))}
                <button type="button" className="dz-more" onClick={newScript}>+ New script page</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manuscript (B1) — the writing: chapters / scenes, ordered. */}
      <div style={{ marginTop: '1.5rem' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Manuscript</div>
        <div className="dz-tree" style={{ maxWidth: '100%', margin: 0 }}>
          <div className="dz-group">
            <div className="dz-items" style={{ borderTop: 'none' }}>
              {chapters.length === 0 && <div className="dz-empty">No chapters yet.</div>}
              {chapters.map((p, i) => (
                <div key={p.id} className="dz-row" style={{ paddingLeft: 6 }}>
                  <Link to={pageRoute(p)} className="dz-rowtitle" style={{ textDecoration: 'none' }}>
                    {p.text.trim() ? firstLine(p.text).slice(0, 80) : `Chapter ${i + 1}`}
                  </Link>
                  <PageFileMenu page={p} label="move…" />
                </div>
              ))}
              <button type="button" className="dz-more" onClick={newChapter}>+ New chapter</button>
              {/* VW — the Import door at the binder edge (never inside an editor). */}
              <button type="button" className="dz-more" onClick={() => navigate(`/project/${id}/import`)}>↓ Import a draft</button>
            </div>
          </div>
        </div>
      </div>

      {/* Support pages (B1) — character / worldbuilding / research / note. */}
      <div style={{ marginTop: '1.25rem' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Support {lexMany('page').toLowerCase()}</div>
        <div className="dz-tree" style={{ maxWidth: '100%', margin: 0 }}>
          <div className="dz-group">
            <div className="dz-items" style={{ borderTop: 'none' }}>
              {support.length === 0 && <div className="dz-empty">No support {lexMany('page').toLowerCase()} yet.</div>}
              {support.map(p => (
                <div key={p.id} className="dz-row" style={{ paddingLeft: 6 }}>
                  <Link to={pageRoute(p)} className="dz-rowtitle" style={{ textDecoration: 'none' }}>
                    {p.pageType && <span className="dz-count" style={{ marginRight: 8, textTransform: 'capitalize' }}>{p.pageType}</span>}
                    {p.text.trim() ? firstLine(p.text).slice(0, 70) : 'Untitled'}
                  </Link>
                  {/* J4 — Boards are binder-only in v1; Shelf/Journal homes for them are a logged non-goal. */}
                  {p.pageType !== 'board' && <PageFileMenu page={p} label="move…" />}
                </div>
              ))}
              {addingSupport ? (
                <div className="dz-row" style={{ paddingLeft: 6, gap: 6, flexWrap: 'wrap' }}>
                  {SUPPORT_TYPES.map(t => (
                    <button key={t.key} type="button" className="dz-more" style={{ margin: 0 }} onClick={() => addSupport(t.key)}>{t.label}</button>
                  ))}
                  <button type="button" className="dz-more" style={{ margin: 0, color: 'var(--text-low)' }} onClick={() => setAddingSupport(false)}>cancel</button>
                </div>
              ) : (
                <button type="button" className="dz-more" onClick={() => setAddingSupport(true)}>+ Add support {lex('page').toLowerCase()}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
