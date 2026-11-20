import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JournalEntry } from '../types';
import { useDeskLexicon } from '../store/deskLexicon';
import { flushNow, getJournalEntry, subscribe } from '../store/persistence';
import { routeForEntry } from '../store/routeForEntry';
import { partsOfDoc } from './partsSeam';

// THE FRONT MENU'S PARTS TAB, read-only (plan step 3.2; the prototype's frontMenu PARTS rows, frame P2-13A). Every Part of the Doc she is in,
// in her order (reorg/partsSeam.ts, INK's seam): its number, its name (or its first line), its words, the one she is on marked. A row opens
// that Part the way every list in the app opens a page (SectionsPopout's own act: save, then go), so the left rail's return chip brings her
// back. Read-only: nothing here renames, moves, adds or deletes (those are step 3.3 and later). A one-Part Doc lists its one Part ("Part 1",
// Fable's ruling A, Nov 14).

const fill = (s: string, vals: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));

export function PartsList({ entry, beforeLeave }: { entry: JournalEntry; beforeLeave?: () => void }) {
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  // follows the store (a rename in the top rail, a pull), never her keystrokes: the signature changes only with what the list draws
  useSyncExternalStore(subscribe, () => {
    const latest = getJournalEntry(entry.id) ?? entry;
    return partsOfDoc(latest).parts.map((p) => `${p.id}:${p.name}:${p.words}`).join('\u0001');
  });
  const latest = getJournalEntry(entry.id) ?? entry;
  const { doc, parts, here } = partsOfDoc(latest);
  const open = (id: string) => {
    if (id === latest.id) return;
    const target = getJournalEntry(id);
    if (!target) return;
    // the top rail's drop hands in the host's flush (her typing first); the Front menu's tab needs none (the press there blurs the editor)
    if (beforeLeave) beforeLeave(); else flushNow();
    navigate(routeForEntry(target));
  };
  return (
    <section className="reorg-parts" data-reorg-parts aria-label={fill(t('reorgPartsOf'), { name: doc.name || t('reorgUntitled') })}>
      <div className="reorg-parts-head">{t('reorgPartsHead')}</div>
      <ol className="reorg-parts-list">
        {parts.map((p) => {
          const on = p.n === here;
          return (
            <li key={p.id}>
              <button type="button" className={`reorg-parts-row${on ? ' is-here' : ''}`} data-part-row={p.id} aria-current={on ? 'true' : undefined}
                onClick={() => open(p.id)}>
                <span className="reorg-parts-num">{p.n}</span>
                <span className="reorg-parts-name">{parts.length > 1 ? (p.name || t('reorgUntitled')) : fill(t('reorgPartN'), { n: p.n })}</span>
                <span className="reorg-parts-words">{fill(t(p.words === 1 ? 'reorgWordsOne' : 'reorgWordsMany'), { n: p.words })}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
