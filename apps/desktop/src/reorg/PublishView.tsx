import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { readPublication, downloadPublication, type PubViewPart } from './publishing';
import type { PubFormat } from './publishingText';

// PUBLISHING AS A VIEW (reorg-plan-v2 #5; the prototype's FINALIZE page, docs/mockups/reorg/app.js renderPage "whole", reorg.css .whole-part and .whole-label): the whole Doc as one read-only scroll,
// each Part under its heading, with what goes out and the two files at the foot. Behind ?reorg=1 in Machina, on a Page, and only after she presses Publish.
//
// PAGE IS PRIMARY: this is a sheet laid over the paper from the paper's own overlay slot (ModeStage's `readouts`), inside .mode-page, absolutely placed. The paper, the column and the editor do not move,
// resize or unmount; her caret, her scroll and her words are exactly where she left them. The way back is one tap: Back to writing, the Publish tab again, a stage tab, or Escape.
// It is a READ: it never writes the store (the ticks that choose what goes out are this component's own state, saved nowhere), and it takes no typing.

const fill = (s: string, vals: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));
// a press on the sheet is never a press on the paper (ModeStage onPaperPress would put the caret into the editor under it)
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

interface Props { entryId: string; onClose: () => void }

function PublishViewImpl({ entryId, onClose }: Props) {
  const { t } = useDeskLexicon();
  // read once, as she opened it: the host flushed the open page's typing first, so this is the newest
  const doc = useMemo(() => readPublication(entryId), [entryId]);
  const [off, setOff] = useState<ReadonlySet<string>>(() => new Set());
  const [said, setSaid] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const was = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => { if (was && was.isConnected) was.focus({ preventScroll: true }); };
  }, []);
  if (!doc) return null;
  const many = doc.parts.length > 1;
  const chosen = doc.parts.filter((p) => !off.has(p.id)).map((p) => p.id);
  const choose = (next: ReadonlySet<string>) => { setSaid(null); setOff(next); };
  const toggle = (id: string) => choose((() => { const n = new Set(off); if (off.has(id)) n.delete(id); else n.add(id); return n; })());
  const go = (format: PubFormat) => setSaid(downloadPublication(doc, format, many ? chosen : null) ? t('publishDownloadConfirm') : t('publishDownloadFailed'));
  const head = (p: PubViewPart) => {
    if (!many && !p.name) return null;
    const label = many ? `${p.n}. ${p.heading}` : p.name;
    return p.level === 0 ? <h2 className="reorg-pub-head">{label}</h2> : p.level === 1 ? <h3 className="reorg-pub-head">{label}</h3> : <h4 className="reorg-pub-head">{label}</h4>;
  };
  return (
    <div ref={ref} className="reorg-pub" data-reorg-pub tabIndex={-1} role="region" aria-label={t('reorgPubLabel')}
      onClick={stop} onMouseDown={stop} onPointerDown={stop} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div className="reorg-pub-label"><span>{t('reorgPubLabel')}</span></div>
      <div className="reorg-pub-scroll" data-pub-scroll>
        {doc.title !== null && <h1 className="reorg-pub-title">{doc.title}</h1>}
        {doc.parts.map((p) => {
          const on = !off.has(p.id);
          return (
            <section key={p.id} className={`reorg-pub-part${on ? '' : ' is-off'}`} data-pub-part={p.id} data-pub-in={on ? 'true' : 'false'} data-level={p.level}>
              {many && (
                <label className="reorg-pub-tick">
                  <input type="checkbox" checked={on} onChange={() => toggle(p.id)} aria-label={fill(t('reorgPubTick'), { n: p.n })} />
                </label>
              )}
              {head(p)}
              {p.empty ? <p className="reorg-pub-empty">{t('reorgPubEmptyPart')}</p> : <div className="reorg-pub-words" dangerouslySetInnerHTML={{ __html: p.html }} />}
            </section>
          );
        })}
      </div>
      <div className="reorg-pub-foot">
        <button type="button" className="reorg-pub-btn" data-pub-back onClick={onClose}>{t('reorgPubBack')}</button>
        <span className="reorg-pub-count" data-pub-count>{many ? fill(t('reorgPubCount'), { n: chosen.length, total: doc.parts.length }) : ''}</span>
        <span className="reorg-pub-said" role="status" data-pub-said>{said ?? ''}</span>
        {many && (
          <>
            <button type="button" className="reorg-pub-btn is-quiet" data-pub-all onClick={() => choose(new Set())}>{t('reorgPubAll')}</button>
            <button type="button" className="reorg-pub-btn is-quiet" data-pub-none onClick={() => choose(new Set(doc.parts.map((p) => p.id)))}>{t('reorgPubNone')}</button>
          </>
        )}
        <button type="button" className="reorg-pub-btn" data-pub-export="md" disabled={many && chosen.length === 0} onClick={() => go('md')}>{t('reorgPubMd')}</button>
        <button type="button" className="reorg-pub-btn" data-pub-export="txt" disabled={many && chosen.length === 0} onClick={() => go('txt')}>{t('reorgPubTxt')}</button>
      </div>
    </div>
  );
}

/** The sheet over the paper. Memoized on the page's id: her typing underneath never renders it. */
export const PublishView = memo(PublishViewImpl);
