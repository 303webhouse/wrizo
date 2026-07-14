import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDrawers, getProjects, getJournalEntry, portToBoard } from '../store/persistence';
import { useLexicon } from '../store/themeLexicon';

// J4 Slice 2 — the port's destination-first sheet. Shared by the loose
// journal page's single-page "Port to a Board…" and the Spread's multi-page
// "Port N pages…". One choice, ONLY when any selected page has ink — no
// per-page interrogation — then a quiet destination picker (existing
// binders, drawer-grouped, + "＋ New project").
export function PortToBoardSheet({ sourceIds, onClose }: { sourceIds: string[]; onClose: () => void }) {
  const navigate = useNavigate();
  const { t: lex, tMany: lexMany } = useLexicon();
  const anyInk = sourceIds.some(id => (getJournalEntry(id)?.strokes?.length ?? 0) > 0);
  const [includeInk, setIncludeInk] = useState<boolean | null>(anyInk ? null : false);

  const choose = (dest: string | 'new') => {
    const board = portToBoard(sourceIds, dest, includeInk === true);
    onClose();
    navigate(`/page/${board.id}`);
  };

  if (anyInk && includeInk === null) {
    return (
      <div className="board-sheet" role="dialog" aria-label={`Port to a ${lex('board')}`}>
        <div className="board-sheet-inner">
          <div className="board-sheet-title">Port {sourceIds.length > 1 ? `${sourceIds.length} ${lexMany('page').toLowerCase()}` : `this ${lex('page').toLowerCase()}`} to a {lex('board')}</div>
          <p style={{ color: 'var(--text-mid)', marginBottom: 16 }}>This selection has ink.</p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button type="button" className="btn-quiet" onClick={() => setIncludeInk(false)}>Text only</button>
            <button type="button" className="btn-brass" onClick={() => setIncludeInk(true)}>Text + ink</button>
          </div>
          <button type="button" className="btn-quiet" onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  }

  const drawers = getDrawers();
  const projects = getProjects();
  const drawerGroups = drawers
    .map(d => ({ drawer: d, projects: projects.filter(p => p.drawerId === d.id) }))
    .filter(g => g.projects.length > 0);
  const unsorted = projects.filter(p => !p.drawerId || !drawers.some(d => d.id === p.drawerId));

  return (
    <div className="board-sheet" role="dialog" aria-label={`Port to a ${lex('board')} — choose a destination`}>
      <div className="board-sheet-inner">
        <div className="board-sheet-title">Choose a destination</div>
        <button type="button" className="dz-more" onClick={() => choose('new')}>＋ New project</button>
        <div className="dz-tree" style={{ maxWidth: '100%', margin: '10px 0 0' }}>
          {drawerGroups.map(({ drawer, projects: ps }) => (
            <div key={drawer.id} className="dz-group">
              <div className="eyebrow" style={{ margin: '10px 0 4px' }}>{drawer.name}</div>
              <div className="dz-items" style={{ borderTop: 'none' }}>
                {ps.map(p => (
                  <button key={p.id} type="button" className="dz-row board-dest-row" onClick={() => choose(p.id)}>
                    <span className="dz-rowtitle">{p.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {unsorted.length > 0 && (
            <div className="dz-group">
              <div className="dz-items" style={{ borderTop: 'none' }}>
                {unsorted.map(p => (
                  <button key={p.id} type="button" className="dz-row board-dest-row" onClick={() => choose(p.id)}>
                    <span className="dz-rowtitle">{p.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {drawerGroups.length === 0 && unsorted.length === 0 && (
            <div className="dz-empty">No projects yet — "＋ New project" births one on the spot.</div>
          )}
        </div>
        <button type="button" className="btn-quiet" onClick={onClose} style={{ marginTop: 16 }}>Cancel</button>
      </div>
    </div>
  );
}
