import { useEffect, useState } from 'react';
import {
  getDrawers, getProjects, getProject, getJournalEntry, setPageHome,
  fileToNewBinder, getBinderPages, getStoryPlanByProjectId,
  appendToChapter, attachToPlanBeat, appendToBoard,
} from '../store/persistence';
import { getFramework } from '../store/frameworks';
import { firstLine } from '../store/entryText';
import { useLexicon } from '../store/themeLexicon';
import type { JournalEntry } from '../types';

// J5 Slices 2+3 — the "Add to…" sheet: a destination-first drill-down
// (Root -> Drawer -> Binder), with a crumbline for backing out. Every leaf
// carries its verb tag (the two-verb law): FILE = MOVES, ADD = COPIES, the
// one exception (plan-attach) = LINKS.

function pageTitle(p: JournalEntry): string {
  return p.text.trim() ? firstLine(p.text).slice(0, 60) : 'Untitled';
}

function VerbTag({ verb }: { verb: 'MOVES' | 'COPIES' | 'LINKS' }) {
  return <span className="add-verb-tag" data-verb={verb}>{verb}</span>;
}

type Level =
  | { kind: 'root' }
  | { kind: 'drawer'; drawerId: string; drawerName: string }
  | { kind: 'binder'; binderId: string; binderName: string };

type Verb = 'MOVES' | 'COPIES' | 'LINKS';

export function AddToSheet({ sourceIds, onClose, onDone }: { sourceIds: string[]; onClose: () => void; onDone: (message: string, verb: Verb) => void }) {
  const { t: lex, tMany: lexMany } = useLexicon();
  const [path, setPath] = useState<Level[]>([{ kind: 'root' }]);
  const [pendingBoard, setPendingBoard] = useState<{ id: string; title: string } | null>(null);
  const n = sourceIds.length;
  const anyInk = sourceIds.some(id => (getJournalEntry(id)?.strokes?.length ?? 0) > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const current = path[path.length - 1];
  const push = (level: Level) => setPath(p => [...p, level]);
  const popTo = (i: number) => setPath(p => p.slice(0, i + 1));

  const crumbLabel = (lvl: Level) => (lvl.kind === 'root' ? 'Add to…' : lvl.kind === 'drawer' ? lvl.drawerName : lvl.binderName);

  const pageWord = (count: number) => (count === 1 ? lex('page') : lexMany('page')).toLowerCase();

  const fileToShelf = () => {
    for (const id of sourceIds) setPageHome(id, 'shelf');
    onDone(`Filed ${n} ${pageWord(n)} to the ${lex('shelf')} — moved; it left the ${lex('journal')}.`, 'MOVES');
  };

  const fileStandalone = (drawerId?: string) => {
    const binder = fileToNewBinder(sourceIds, drawerId);
    onDone(`Filed ${n} ${pageWord(n)} to ${binder.title || 'Untitled'} — moved; it left the ${lex('journal')}.`, 'MOVES');
  };

  const fileHere = (binderId: string) => {
    for (const id of sourceIds) setPageHome(id, binderId);
    const binder = getProject(binderId);
    onDone(`Filed ${n} ${pageWord(n)} to ${binder?.title || 'Untitled'} — moved; it left the ${lex('journal')}.`, 'MOVES');
  };

  const doAppendChapter = (chapter: JournalEntry) => {
    appendToChapter(sourceIds, chapter.id);
    onDone(`Copied — appended to "${pageTitle(chapter)}". The originals stay in the ${lex('journal')}.`, 'COPIES');
  };

  const doAttachPlan = (binderId: string, beatId: string, beatName: string) => {
    attachToPlanBeat(sourceIds, binderId, beatId);
    onDone(`Linked — marked routed to "${beatName}"; the ${lex('page').toLowerCase()} stays in the ${lex('journal')}.`, 'LINKS');
  };

  const doBoardAppend = (boardId: string, title: string, includeInk: boolean) => {
    appendToBoard(sourceIds, boardId, includeInk);
    onDone(`Copied — added to the "${title}" ${lex('board')}. The originals stay in the ${lex('journal')}.`, 'COPIES');
  };

  const clickBoard = (b: JournalEntry) => {
    if (!anyInk) { doBoardAppend(b.id, pageTitle(b), false); return; }
    setPendingBoard({ id: b.id, title: pageTitle(b) });
  };

  const Crumb = (
    <div className="add-crumb" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14, fontSize: 13, color: 'var(--text-mid)' }}>
      {path.map((lvl, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <span style={{ color: 'var(--text-low)' }}>/</span>}
          {i === path.length - 1
            ? <span style={{ color: 'var(--text-hi)' }}>{crumbLabel(lvl)}</span>
            : <button type="button" className="btn-quiet" style={{ padding: 0 }} onClick={() => popTo(i)}>{crumbLabel(lvl)}</button>}
        </span>
      ))}
    </div>
  );

  if (pendingBoard) {
    return (
      <div className="board-sheet" role="dialog" aria-label={`Add onto ${lex('board')} — ${pendingBoard.title}`}>
        <div className="board-sheet-inner">
          <div className="board-sheet-title">Add onto {lex('board')} — {pendingBoard.title}</div>
          <p style={{ color: 'var(--text-mid)', marginBottom: 16 }}>This selection has ink.</p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button type="button" className="btn-quiet" onClick={() => doBoardAppend(pendingBoard.id, pendingBoard.title, false)}>Text only</button>
            <button type="button" className="btn-brass" onClick={() => doBoardAppend(pendingBoard.id, pendingBoard.title, true)}>Text + ink</button>
          </div>
          <button type="button" className="btn-quiet" onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  }

  let body: React.ReactNode;

  if (current.kind === 'root') {
    const drawers = getDrawers();
    body = (
      <>
        <button type="button" className="dz-more add-dest-row" onClick={fileToShelf}>
          The {lex('shelf')} <VerbTag verb="MOVES" />
        </button>
        {drawers.map(d => (
          <button key={d.id} type="button" className="dz-row board-dest-row" onClick={() => push({ kind: 'drawer', drawerId: d.id, drawerName: d.name })}>
            <span className="dz-rowtitle">{d.name} ▸</span>
          </button>
        ))}
      </>
    );
  } else if (current.kind === 'drawer') {
    const binders = getProjects().filter(p => p.drawerId === current.drawerId);
    body = (
      <>
        {binders.length === 0 && <p style={{ color: 'var(--text-mid)', marginBottom: 12 }}>No projects in this drawer yet.</p>}
        {binders.map(b => (
          <button key={b.id} type="button" className="dz-row board-dest-row" onClick={() => push({ kind: 'binder', binderId: b.id, binderName: b.title })}>
            <span className="dz-rowtitle">{b.title} ▸</span>
          </button>
        ))}
        <button type="button" className="dz-more add-dest-row" onClick={() => fileStandalone(current.drawerId)}>
          ＋ Standalone document here <VerbTag verb="MOVES" />
        </button>
      </>
    );
  } else {
    const binderId = current.binderId;
    const pages = getBinderPages(binderId);
    const chapters = pages.filter(p => p.pageType === 'manuscript');
    const boards = pages.filter(p => p.pageType === 'board');
    const plan = getStoryPlanByProjectId(binderId);
    const framework = plan ? getFramework(plan.frameworkId) : null;
    body = (
      <>
        <button type="button" className="dz-more add-dest-row" onClick={() => fileHere(binderId)}>
          File here as a new {lex('page').toLowerCase()} <VerbTag verb="MOVES" />
        </button>
        {chapters.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Append to a chapter</div>
            {anyInk && (
              <p className="add-ink-notice" style={{ color: 'var(--text-mid)', fontSize: 13, marginBottom: 8 }}>
                chapter and plan take text only — ink reaches a project only via a Board.
              </p>
            )}
            <div style={{ maxHeight: 160, overflow: 'auto' }}>
              {chapters.map(c => (
                <button key={c.id} type="button" className="dz-row board-dest-row" onClick={() => doAppendChapter(c)}>
                  <span className="dz-rowtitle">Append to {pageTitle(c)}</span> <VerbTag verb="COPIES" />
                </button>
              ))}
            </div>
          </div>
        )}
        {plan && framework && (
          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Attach to the {lex('plan').toLowerCase()}</div>
            <div style={{ maxHeight: 160, overflow: 'auto' }}>
              {framework.beats.map(beat => (
                <button key={beat.id} type="button" className="dz-row board-dest-row" onClick={() => doAttachPlan(binderId, beat.id, beat.name)}>
                  <span className="dz-rowtitle">{beat.name}</span> <VerbTag verb="LINKS" />
                </button>
              ))}
            </div>
          </div>
        )}
        {boards.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Add onto a {lex('board')}</div>
            <div style={{ maxHeight: 160, overflow: 'auto' }}>
              {boards.map(b => (
                <button key={b.id} type="button" className="dz-row board-dest-row" onClick={() => clickBoard(b)}>
                  <span className="dz-rowtitle">Add onto {lex('board')} — {pageTitle(b)}</span> <VerbTag verb="COPIES" />
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="board-sheet" role="dialog" aria-label="Add to…">
      <div className="board-sheet-inner">
        {Crumb}
        {body}
        <button type="button" className="btn-quiet" onClick={onClose} style={{ marginTop: 16 }}>Cancel</button>
      </div>
    </div>
  );
}
