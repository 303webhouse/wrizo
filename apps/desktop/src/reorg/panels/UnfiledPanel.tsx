import { useState, type ReactNode } from 'react';
import type { CascadeContext } from '../../components/cascade/shared';
import { openTrashBoard } from '../../components/cascade/shared';
import { AddToSheet } from '../../components/AddToSheet';
import type { JournalEntry } from '../../types';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { requestDelete } from '../../store/deleteGate';
import { firstLine } from '../../store/entryText';
import { softDeleteEntry } from '../../store/persistence';
import { wordCount } from '../../store/wordCount';
import { unfiledMembers } from '../railData';
import { useTheme } from '../../store/theme';

// UNFILED (step 6, frame R6): writing with no Project, and only that (Fable, Nov 14: the hidden Journal is the Notebook, a place of its own,
// listed last in All projects; never here, so a whole Journal never sits one press from the Trash). Each row: its title, its words and its
// date, and two acts that are today's own: File (the Add to… sheet, which files it into a Project) and Trash (today's delete, behind today's
// "ask before deleting" gate). The Trash itself is the row at the very foot (Nick, Nov 11, 2:31 pm), opening today's Trash; it carries no
// count, by today's law for the Trash ("a place, not a nag": TrashPanel, A18) - the frame's "3 items" is put to Fable.

const fill = (s: string, k: string, v: string | number): string => s.replace(`{${k}}`, String(v));

function titleOf(e: JournalEntry, t: (k: DeskTermId) => string): string {
  if (!e.text.trim()) return (e.strokes?.length ?? 0) > 0 ? t('reorgSketch') : e.pageType === 'board' ? t('reorgUntitledBoard') : t('reorgUntitled');
  return firstLine(e.text).slice(0, 60);
}

/** The pop-out head's count: how many entries Unfiled holds. */
export function UnfiledCount() {
  return <span className="wz-reorg-head-count" data-reorg-count="">{unfiledMembers().length}</span>;
}

export function UnfiledPanel({ subject, navigate, travelFromCascade }: CascadeContext) {
  const { t } = useDeskLexicon();
  const [filing, setFiling] = useState<string | null>(null);
  // FLUX: the two acts show their names (the Wrizors' rail pass 1, NIT 5: the first icon read as "add")
  const named = useTheme() === 'flux';
  const rows = unfiledMembers().slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  return (
    <div className="wz-cascade-panel-body wz-reorg-unfiled">
      <section className="wz-reorg-group" data-reorg-group="unfiled" aria-label={t('reorgNoProjectHeading')}>
        <div className="wz-reorg-group-head">{t('reorgNoProjectHeading')} · {rows.length}</div>
        {rows.length ? (
          <ul className="wz-reorg-rows">
            {rows.map((e) => {
              const title = titleOf(e, t);
              const words = wordCount(e.text);
              return (
                <li key={e.id} className="wz-reorg-list-row wz-reorg-unfiled-row" data-entry-id={e.id} aria-current={e.id === subject.entry.id ? 'page' : undefined}>
                  <button type="button" className="wz-reorg-list-open wz-reorg-two-line" onClick={() => travelFromCascade(e)}>
                    <span className="wz-reorg-list-title">{title}</span>
                    <span className="wz-reorg-row-meta">{fill(t(words === 1 ? 'reorgWordsOne' : 'reorgWordsMany'), 'n', words.toLocaleString('en-US'))} · {new Date(e.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </button>
                  <button type="button" className="wz-reorg-icon-btn" data-unfiled-file={e.id} aria-label={fill(t('reorgFile'), 'name', title)} title={fill(t('reorgFile'), 'name', title)} onClick={() => setFiling(e.id)}>{named ? t('reorgFileShort') : <FileIcon />}</button>
                  <button type="button" className="wz-reorg-icon-btn" data-unfiled-trash={e.id} aria-label={fill(t('reorgTrashOne'), 'name', title)} title={fill(t('reorgTrashOne'), 'name', title)}
                    onClick={() => requestDelete(() => { softDeleteEntry(e.id); })}>{named ? t('reorgTrash') : <TrashIcon />}</button>
                </li>
              );
            })}
          </ul>
        ) : <p className="wz-reorg-empty">{t('reorgUnfiledEmpty')}</p>}
      </section>
      <button type="button" className="wz-reorg-trash" data-reorg-trash="" onClick={() => openTrashBoard(navigate)}>
        <TrashIcon /> <span>{t('reorgTrash')}</span> <span aria-hidden="true" className="wz-reorg-trash-go">›</span>
      </button>
      {filing && <AddToSheet sourceIds={[filing]} onClose={() => setFiling(null)} onDone={() => setFiling(null)} />}
    </div>
  );
}

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">{children}</svg>
);
function FileIcon() { return svg(<><path d="M5 5h14v14H5z" /><path d="M12 9v6M9 12h6" /></>); }
function TrashIcon() { return svg(<><path d="M4.5 7h15" /><path d="M10 7V4.5h4V7" /><path d="M6.5 7l1 14h9l1-14" /></>); }
