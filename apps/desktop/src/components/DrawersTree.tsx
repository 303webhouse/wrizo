import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Drawer, Project } from '../types';
import {
  createDrawer, createJournalPage, getDrawers, getProjects, renameDrawer, setProjectDrawer, softDeleteDrawer,
} from '../store/persistence';

// Drawers D1 — the browsable Drawer → Binder(Project) tree that replaces the
// Desk's flat recent list. The top of the Drawers IA. A "Binder" is still the
// existing single-bodied Project (clicking opens ProjectHome); the Page level
// inside a Binder is D2. Projects with no (or a deleted) drawerId render under a
// virtual "Unsorted" group — never a real Drawer row, so we don't commit to a
// drawer name before the taxonomy settles. Mirrors nothing structurally new:
// every mutation goes through the existing persistence CRUD (synced, soft-delete).

const PAGE = 10; // reveal items in pages of 10 ("+ N more")

function activityMs(p: Project): number {
  return new Date(p.lastActivityAt || p.updatedAt).getTime();
}
// Most-recently-active first, then by title.
function byActivityThenTitle(a: Project, b: Project): number {
  return activityMs(b) - activityMs(a) || a.title.localeCompare(b.title);
}

export function DrawersTree() {
  const navigate = useNavigate();
  const drawers = getDrawers().sort((a, b) => a.order - b.order);
  const projects = getProjects();
  const liveDrawerIds = new Set(drawers.map(d => d.id));

  // A project is Unsorted if it has no drawer, or its drawer was soft-deleted.
  const unsorted = projects.filter(p => !p.drawerId || !liveDrawerIds.has(p.drawerId)).sort(byActivityThenTitle);
  const projectsOf = (id: string) => projects.filter(p => p.drawerId === id).sort(byActivityThenTitle);

  // UI state (survives the cache-change re-renders the mutations trigger).
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['unsorted']));
  const [shown, setShown] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);   // drawer id w/ rename·delete menu open
  const [moveFor, setMoveFor] = useState<string | null>(null);   // project id w/ move-to menu open
  const [createFor, setCreateFor] = useState<string | null>(null); // drawer id w/ "create new" menu open

  const isOpen = (id: string) => expanded.has(id);
  const toggle = (id: string) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const shownFor = (id: string) => shown[id] ?? PAGE;
  const revealMore = (id: string) => setShown(s => ({ ...s, [id]: shownFor(id) + PAGE }));

  const startNewDrawer = () => {
    const d = createDrawer('New Drawer');
    setExpanded(s => new Set(s).add(d.id));
    setEditingId(d.id);
    setEditingValue('New Drawer');
  };
  const startRename = (d: Drawer) => { setMenuFor(null); setEditingId(d.id); setEditingValue(d.name); };
  const commitRename = (id: string) => { renameDrawer(id, editingValue); setEditingId(null); };
  const remove = (d: Drawer) => { setMenuFor(null); softDeleteDrawer(d.id); };
  const move = (projectId: string, drawerId: string | null) => { setProjectDrawer(projectId, drawerId); setMoveFor(null); };

  const renderRow = (p: Project, currentDrawerId: string | null) => (
    <div className="dz-row" key={p.id}>
      <button type="button" className="dz-rowtitle" onClick={() => navigate(`/project/${p.id}`)}>
        {p.title || 'Untitled'}
      </button>
      <div className="dz-rowmove">
        <button type="button" className="dz-move" onClick={() => setMoveFor(f => (f === p.id ? null : p.id))}>move to…</button>
        {moveFor === p.id && (
          <div className="dz-menu" role="menu">
            {currentDrawerId !== null && (
              <button type="button" className="dz-menu-item" onClick={() => move(p.id, null)}>Unsorted</button>
            )}
            {drawers.filter(d => d.id !== currentDrawerId).map(d => (
              <button type="button" key={d.id} className="dz-menu-item" onClick={() => move(p.id, d.id)}>{d.name}</button>
            ))}
            {drawers.length === 0 && currentDrawerId === null && (
              <span className="dz-menu-empty">No drawers yet</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderItems = (groupId: string, items: Project[], currentDrawerId: string | null) => {
    const n = shownFor(groupId);
    return (
      <div className="dz-items">
        {items.length === 0 && <div className="dz-empty">empty</div>}
        {items.slice(0, n).map(p => renderRow(p, currentDrawerId))}
        {items.length > n && (
          <button type="button" className="dz-more" onClick={() => revealMore(groupId)}>+ {items.length - n} more</button>
        )}
      </div>
    );
  };

  return (
    <div className="dz-tree">
      <button type="button" className="dz-new" onClick={startNewDrawer}>+ New Drawer</button>

      {/* Unsorted — virtual group, always at the top; hidden only when empty. */}
      {unsorted.length > 0 && (
        <div className="dz-group">
          <div className="dz-grouphead">
            <button type="button" className="dz-toggle" onClick={() => toggle('unsorted')}>
              <span className="dz-caret">{isOpen('unsorted') ? '▾' : '▸'}</span>
              <span className="dz-name">Unsorted</span>
              <span className="dz-count">{unsorted.length}</span>
            </button>
          </div>
          {isOpen('unsorted') && renderItems('unsorted', unsorted, null)}
        </div>
      )}

      {/* Drawers, by order. */}
      {drawers.map(d => {
        const items = projectsOf(d.id);
        return (
          <div className="dz-group" key={d.id}>
            <div className="dz-grouphead">
              {editingId === d.id ? (
                <input
                  className="dz-rename"
                  autoFocus
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  onBlur={() => commitRename(d.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename(d.id);
                    else if (e.key === 'Escape') setEditingId(null);
                  }}
                />
              ) : (
                <button type="button" className="dz-toggle" onClick={() => toggle(d.id)}>
                  <span className="dz-caret">{isOpen(d.id) ? '▾' : '▸'}</span>
                  <span className="dz-name">{d.name}</span>
                  <span className="dz-count">{items.length}</span>
                </button>
              )}
              <div className="dz-rowmove">
                <button type="button" className="dz-menu-btn" aria-label="Drawer options" onClick={() => setMenuFor(f => (f === d.id ? null : d.id))}>⋯</button>
                {menuFor === d.id && (
                  <div className="dz-menu" role="menu">
                    <button type="button" className="dz-menu-item" onClick={() => startRename(d)}>Rename</button>
                    <button type="button" className="dz-menu-item dz-menu-danger" onClick={() => remove(d)}>Delete</button>
                  </div>
                )}
              </div>
            </div>
            {isOpen(d.id) && (
              <>
                {renderItems(d.id, items, d.id)}
                {/* In-drawer "Create New" (B1 #10) — New Page / New Project scoped
                    to this drawer (a project created here gets this drawerId). */}
                <div className="dz-createnew">
                  {createFor === d.id ? (
                    <>
                      <button type="button" className="dz-more" onClick={() => { setCreateFor(null); const e = createJournalPage(); navigate(`/journal/${e.id}`); }}>New Page</button>
                      <button type="button" className="dz-more" onClick={() => { setCreateFor(null); navigate(`/project/new?drawer=${d.id}`); }}>New Project</button>
                      <button type="button" className="dz-more dz-createnew-cancel" onClick={() => setCreateFor(null)}>cancel</button>
                    </>
                  ) : (
                    <button type="button" className="dz-more" onClick={() => setCreateFor(d.id)}>+ Create New</button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {drawers.length === 0 && unsorted.length === 0 && (
        <div className="dz-hint">No drawers yet. Make one to start organizing your work.</div>
      )}
    </div>
  );
}
