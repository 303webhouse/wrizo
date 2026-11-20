import { useMemo, useSyncExternalStore } from 'react';
import type { JournalEntry } from '../types';
import { useDeskLexicon } from '../store/deskLexicon';
import { subscribe } from '../store/persistence';
import { movePart, runOf } from './parts';
import { publicationList, publicationSignature } from './publishing';
import { togglePick, usePickOff } from './publishPick';

// THE FRONT MENU IN FINALIZE (Fable, Nov 20, 1:27 pm: "In FINALIZE, the TEXT/INK tabs are greyed with a note, and PARTS only re-orders and ticks"; the prototype's FINALIZE offers "Tick Parts in or out"
// and "Order what goes out"). Only while the publishing view is open. The tick is session state shared with the view (publishPick.ts: saved nowhere); the order is the Doc's own order, written by
// the same movePart every move uses (orderIndex and level only, never a word), so what the view shows is what goes out, and the same order is there when she goes back to writing.

const fill = (s: string, vals: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));

export function PublishParts({ entry }: { entry: JournalEntry }) {
  const { t } = useDeskLexicon();
  const sig = useSyncExternalStore(subscribe, () => publicationSignature(entry.id));
  const list = useMemo(() => publicationList(entry.id), [entry.id, sig]);   // eslint-disable-line react-hooks/exhaustive-deps
  const off = usePickOff(entry.id);
  const { docId, rows } = list;
  const levels = rows.map((r) => r.level);
  return (
    <section className="reorg-parts reorg-pubparts" data-reorg-pubparts aria-label={t('reorgPubPartsLabel')}>
      <p className="reorg-pubparts-note" data-pubparts-note>{t('reorgPubFrozen')}</p>
      {rows.length < 2 || !docId ? (
        <p className="reorg-pubparts-one">{t('reorgPubOnePart')}</p>
      ) : (
        <>
          <div className="reorg-parts-head">{t('reorgPubPartsHint')}</div>
          <ol className="reorg-parts-list">
            {rows.map((r, i) => {
              const [s] = runOf(levels, i);
              const canUp = s > 0, canDown = (() => { const [, end] = runOf(levels, i); return end < rows.length; })();
              const on = !off.has(r.id);
              return (
                <li key={r.id} className="reorg-pubparts-row" data-pubparts-row={r.id} data-in={on ? 'true' : 'false'} style={{ paddingLeft: r.level * 14 }}>
                  <input type="checkbox" checked={on} onChange={() => togglePick(entry.id, r.id)} aria-label={fill(t('reorgPubTick'), { n: r.n })} data-pubparts-tick />
                  <span className="reorg-pubparts-name"><span className="reorg-pubparts-n">{r.n}.</span> {r.heading || t('reorgUntitled')}</span>
                  <button type="button" className="reorg-pubparts-move" data-pubparts-up disabled={!canUp} aria-label={fill(t('reorgPubUp'), { n: r.n })} title={fill(t('reorgPubUp'), { n: r.n })}
                    onClick={() => movePart(docId, r.id, i - 1)}>{'↑'}</button>
                  <button type="button" className="reorg-pubparts-move" data-pubparts-down disabled={!canDown} aria-label={fill(t('reorgPubDown'), { n: r.n })} title={fill(t('reorgPubDown'), { n: r.n })}
                    onClick={() => movePart(docId, r.id, i + 1)}>{'↓'}</button>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
