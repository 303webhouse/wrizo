import { useState } from 'react';
import { getDrawers, getProjects, getBinderPages, createBoardPage, pinPageToBoard } from '../store/persistence';
import { useLexicon } from '../store/themeLexicon';

// AB4 S2 — Pin's destination-first sheet. Rides the SAME drawer/project
// drill-down PortToBoardSheet.tsx already proved out (existing pipes, per
// the brief's own "the same Add-to grammar"), but the LEAF is a board
// picker (an existing board in the chosen project, or "+ New board")
// rather than a project-level destination — pinning targets one board's
// own `boxes`, not a project as a whole. No ink fork (Port's own "text
// only / text + ink" question doesn't apply here): a pin never copies
// content, so there is nothing to include or exclude — `pinPageToBoard`
// (store/persistence.ts) only ever adds a membership card carrying the
// entry's id, and never touches the referenced entry's own record.
type Level = { kind: 'root' } | { kind: 'project'; projectId: string; projectTitle: string };

export function PinToBoardSheet({ entryId, onClose }: { entryId: string; onClose: () => void }) {
  const { t: lex } = useLexicon();
  const [level, setLevel] = useState<Level>({ kind: 'root' });

  const choose = (boardId: string) => {
    pinPageToBoard(entryId, boardId);
    onClose();
  };

  const addBoard = (projectId: string) => {
    const board = createBoardPage(projectId);
    pinPageToBoard(entryId, board.id);
    onClose();
  };

  if (level.kind === 'root') {
    const drawers = getDrawers();
    const projects = getProjects();
    const drawerGroups = drawers
      .map(d => ({ drawer: d, projects: projects.filter(p => p.drawerId === d.id) }))
      .filter(g => g.projects.length > 0);
    const unsorted = projects.filter(p => !p.drawerId || !drawers.some(d => d.id === p.drawerId));
    return (
      <div className="board-sheet" role="dialog" aria-label={`Pin to a ${lex('board')}`}>
        <div className="board-sheet-inner">
          <div className="board-sheet-title">Pin to a {lex('board')}</div>
          <div className="dz-tree" style={{ maxWidth: '100%', margin: '0 0 8px' }}>
            {drawerGroups.map(({ drawer, projects: ps }) => (
              <div key={drawer.id} className="dz-group">
                <div className="eyebrow" style={{ margin: '10px 0 4px' }}>{drawer.name}</div>
                <div className="dz-items" style={{ borderTop: 'none' }}>
                  {ps.map(p => (
                    <button key={p.id} type="button" className="dz-row board-dest-row" onClick={() => setLevel({ kind: 'project', projectId: p.id, projectTitle: p.title })}>
                      <span className="dz-rowtitle">{p.title} ▸</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {unsorted.length > 0 && (
              <div className="dz-group">
                <div className="dz-items" style={{ borderTop: 'none' }}>
                  {unsorted.map(p => (
                    <button key={p.id} type="button" className="dz-row board-dest-row" onClick={() => setLevel({ kind: 'project', projectId: p.id, projectTitle: p.title })}>
                      <span className="dz-rowtitle">{p.title} ▸</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {drawerGroups.length === 0 && unsorted.length === 0 && (
              <div className="dz-empty">No projects yet — file this page into one first, then it can join a {lex('board').toLowerCase()}.</div>
            )}
          </div>
          <button type="button" className="btn-quiet" onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  }

  const boards = getBinderPages(level.projectId).filter(p => p.pageType === 'board');
  return (
    <div className="board-sheet" role="dialog" aria-label={`Pin to a ${lex('board')} in ${level.projectTitle}`}>
      <div className="board-sheet-inner">
        <div className="add-crumb" style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 14, fontSize: 13, color: 'var(--text-mid)' }}>
          <button type="button" className="btn-quiet" style={{ padding: 0 }} onClick={() => setLevel({ kind: 'root' })}>Pin to a {lex('board')}</button>
          <span style={{ color: 'var(--text-low)' }}>/</span>
          <span style={{ color: 'var(--text-hi)' }}>{level.projectTitle}</span>
        </div>
        {boards.length === 0 && <p style={{ color: 'var(--text-mid)', marginBottom: 12 }}>No {lex('board').toLowerCase()}s in this project yet.</p>}
        <div style={{ maxHeight: 220, overflow: 'auto' }}>
          {boards.map(b => (
            <button key={b.id} type="button" className="dz-row board-dest-row" onClick={() => choose(b.id)}>
              <span className="dz-rowtitle">{b.text.trim() ? b.text.trim().split('\n')[0].slice(0, 60) : 'Untitled board'}</span>
            </button>
          ))}
        </div>
        <button type="button" className="dz-more add-dest-row" style={{ marginTop: 12 }} onClick={() => addBoard(level.projectId)}>
          ＋ New {lex('board').toLowerCase()}
        </button>
        <button type="button" className="btn-quiet" onClick={onClose} style={{ marginTop: 16 }}>Cancel</button>
      </div>
    </div>
  );
}
