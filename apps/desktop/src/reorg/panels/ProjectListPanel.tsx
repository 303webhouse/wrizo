import type { CascadeContext } from '../../components/cascade/shared';
import type { JournalEntry } from '../../types';
import { useDeskLexicon } from '../../store/deskLexicon';
import { firstLine } from '../../store/entryText';
import { unbornHref } from '../../store/unbornPage';
import { listOf, newTargetOf, type RailDoc } from '../railData';
import { useOpenList } from '../railMemory';
import { useProjectName } from '../ReorgRail';

// A PROJECT'S OWN LIST (step 3; Nick, Nov 14, 11:14 am: "every Project box opens that Project's own list"). Opened from the where-she-is box,
// from each pin and from each row of All projects. Its Docs by the read-time rule, then its Boards with no Doc. Until phase 3 brings the Parts
// list, a Doc with more than one Part shows its Parts (and a set's boards) as indented rows under it, so every page stays reachable (Fable,
// Nov 14). + New doc and + New board (Nick's second door for a Board) go through today's own route (an unborn page or board in the Project's
// set, made by the first keystroke). Opening a row is a departure with the return chip (the Cascade's travelFromCascade), and the rail comes
// back open on this same list. Nothing here writes, but for today's own lazy set on a New in a Project that has none.

function titleOf(e: JournalEntry, t: (k: 'reorgUntitled' | 'reorgUntitledBoard' | 'reorgSketch') => string): string {
  if (!e.text.trim()) return (e.strokes?.length ?? 0) > 0 ? t('reorgSketch') : e.pageType === 'board' ? t('reorgUntitledBoard') : t('reorgUntitled');
  return firstLine(e.text).slice(0, 60);
}

export function ProjectListHead() {
  const nameOf = useProjectName();
  const id = useOpenList();
  return <span className="wz-reorg-head-count wz-reorg-head-name" data-reorg-list-name="">{id ? nameOf(id) : ''}</span>;
}

export function ProjectListPanel({ subject, navigate, travelFromCascade }: CascadeContext) {
  const { t } = useDeskLexicon();
  const id = useOpenList();
  if (!id) return null;
  const list = listOf(id);
  const here = subject.entry.id;
  const fresh = (kind: 'doc' | 'board') => {
    const target = newTargetOf(id);
    if (!target) return;
    navigate(unbornHref(kind === 'board' ? { kind: 'board', ...target } : target));
  };
  const row = (e: JournalEntry, depth: 0 | 1, extra?: string | null, label?: string) => (
    <li key={e.id} className={`wz-reorg-list-row${depth ? ' wz-reorg-list-row--part' : ''}`} data-entry-id={e.id} data-depth={depth}
      data-kind={e.pageType === 'board' ? 'board' : 'page'} aria-current={e.id === here ? 'page' : undefined}>
      <button type="button" className="wz-reorg-list-open" onClick={() => navigate(`/page/${e.id}`)}>
        <span className="wz-reorg-list-title">{label ?? titleOf(e, t)}</span>
        {extra ? <span className="wz-reorg-list-meta" data-set-name="">{extra}</span> : null}
      </button>
    </li>
  );
  const doc = (d: RailDoc) => {
    const first = d.parts[0];
    // a set she made is one Doc under its own name; a one-Part Doc is its page
    const name = d.set ? d.set.title : titleOf(first, t);
    const many = d.parts.length > 1 || d.boards.length > 0;
    return (
      <li key={d.set ? d.set.id : first.id} className="wz-reorg-doc" data-reorg-doc={d.set ? d.set.id : first.id} data-parts={d.parts.length}>
        <ul className="wz-reorg-rows">
          {row(first, 0, null, name)}
          {many ? d.parts.map((p) => row(p, 1)) : null}
          {many ? d.boards.map((b) => row(b, 1)) : null}
        </ul>
      </li>
    );
  };
  return (
    <div className="wz-cascade-panel-body wz-reorg-list" data-reorg-list={id}>
      <div className="wz-reorg-list-new">
        <button type="button" className="wz-reorg-new" data-new="doc" onClick={() => fresh('doc')}><span aria-hidden="true">+</span> {t('reorgNewDoc')}</button>
        <button type="button" className="wz-reorg-new" data-new="board" onClick={() => fresh('board')}><span aria-hidden="true">+</span> {t('reorgNewBoard')}</button>
      </div>
      <section className="wz-reorg-group" data-reorg-group="docs" aria-label={t('reorgListDocs')}>
        <div className="wz-reorg-group-head">{t('reorgListDocs')} <span className="wz-reorg-group-count">{list.docs.length}</span></div>
        {list.docs.length ? <ul className="wz-reorg-rows">{list.docs.map(doc)}</ul> : <p className="wz-reorg-empty">{t('reorgListEmpty')}</p>}
      </section>
      {list.boards.length > 0 && (
        <section className="wz-reorg-group" data-reorg-group="boards" aria-label={t('reorgBoardsNoDoc')}>
          <div className="wz-reorg-group-head">{t('reorgBoardsNoDoc')} <span className="wz-reorg-group-count">{list.boards.length}</span></div>
          <ul className="wz-reorg-rows">{list.boards.map((b) => row(b.board, 0, b.setName))}</ul>
        </section>
      )}
    </div>
  );
}
