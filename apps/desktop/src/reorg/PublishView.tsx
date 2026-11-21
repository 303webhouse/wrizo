import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { subscribe } from '../store/persistence';
import { readPublication, downloadPublication, copyPublication, publicationSignature, publicationPlan, publicationAttach, type PubViewPart } from './publishing';
import { includePlanOf } from './docSettings';
import { attachedNow, closePick, includePlanNow, openPick, setPickOff, togglePick, usePickOff } from './publishPick';
import type { PubFormat } from './publishingText';

// PUBLISHING AS A VIEW (reorg-plan-v2 #5; the prototype's FINALIZE page, docs/mockups/reorg/app.js renderPage "whole", reorg.css .whole-part and .whole-label): the whole Doc as one read-only scroll,
// each Part under its heading, with what goes out and how at the foot. Behind ?reorg=1 in Machina, on a Page, and only after she presses Publish.
//
// PAGE IS PRIMARY: this is a sheet laid over the paper from the paper's own overlay slot (ModeStage's `readouts`), inside .mode-page, absolutely placed. The paper, the column and the editor do not move,
// resize or unmount; her caret, her scroll and her words are exactly where she left them. The way back is one tap: Back to writing, the Publish tab again, a stage tab, or Escape.
// It is a READ: it never writes the store (the ticks that choose what goes out are session state, publishPick.ts, shared with the Front menu's PARTS tab and saved nowhere), and it takes no typing.
// Out of it (Fable, Nov 20, 1:27 pm): Copy Text, Copy as Formatted, and Export > Markdown, Plain Text, Web (HTML).

const fill = (s: string, vals: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));
// a press on the sheet is never a press on the paper (ModeStage onPaperPress would put the caret into the editor under it)
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

interface Props { entryId: string; onClose: () => void }

function PublishViewImpl({ entryId, onClose }: Props) {
  const { t } = useDeskLexicon();
  // read as she opened it (the host flushed the open page's typing first, so this is the newest), and again only when the LIST changes (a Part moved from the Front menu): never on her words
  const sig = useSyncExternalStore(subscribe, () => publicationSignature(entryId));
  const doc = useMemo(() => readPublication(entryId), [entryId, sig]);   // eslint-disable-line react-hooks/exhaustive-deps
  const off = usePickOff(entryId);
  const [said, setSaid] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    openPick(entryId, includePlanOf(entryId));   // the "Include the Plan" tick is remembered per Doc (docSettings export.includePlan), so the sheet opens as she left it
    const was = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => { closePick(entryId); if (was && was.isConnected) was.focus({ preventScroll: true }); };
  }, [entryId]);
  if (!doc) return null;
  const many = doc.parts.length > 1;
  const chosen = doc.parts.filter((p) => !off.has(p.id)).map((p) => p.id);
  const ids = many ? chosen : null;
  const choose = (next: ReadonlySet<string>) => { setSaid(null); setPickOff(entryId, next); };
  const toggle = (id: string) => { setSaid(null); togglePick(entryId, id); };
  // the Plan goes only if she ticked "Include the Plan" in the Back menu's Plan tab (item 5a): read at the moment she presses, so it is the Plan as she left it
  const planNow = () => (includePlanNow(entryId) ? publicationPlan(entryId, t('reorgBackPlan'), t('reorgUntitled')) : null);
  // the assets go only if she ticked them in the Back menu's Assets tab (item 5b; stage menus A4): none by default, read at the moment she presses
  const attachNow = () => publicationAttach(entryId, t('drawerLinks'), t('reorgUntitled'), attachedNow(entryId));
  const go = (format: PubFormat) => setSaid(downloadPublication(doc, format, ids, planNow(), attachNow()) ? t('publishDownloadConfirm') : t('publishDownloadFailed'));
  const copy = async (kind: 'text' | 'formatted') => setSaid((await copyPublication(doc, kind, ids, planNow(), attachNow())) ? t('publishCopyWordsConfirm') : t('publishCopyFailed'));
  const none = many && chosen.length === 0;
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
              {p.empty ? <p className="reorg-pub-empty">{t('reorgPubEmptyPart')}</p> : <div className="reorg-pub-words" dangerouslySetInnerHTML={{ __html: p.view }} />}
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
        <span className="reorg-pub-break" aria-hidden="true" />
        <button type="button" className="reorg-pub-btn" data-pub-copy="text" disabled={none} onClick={() => { void copy('text'); }}>{t('reorgPubCopyText')}</button>
        <button type="button" className="reorg-pub-btn" data-pub-copy="formatted" disabled={none} onClick={() => { void copy('formatted'); }}>{t('reorgPubCopyFormatted')}</button>
        <span className="reorg-pub-exportlabel" data-pub-exportlabel>{t('reorgPubExport')} <span aria-hidden="true">{'▸'}</span></span>
        <button type="button" className="reorg-pub-btn" data-pub-export="md" disabled={none} onClick={() => go('md')}>{t('reorgPubMd')}</button>
        <button type="button" className="reorg-pub-btn" data-pub-export="txt" disabled={none} onClick={() => go('txt')}>{t('reorgPubTxt')}</button>
        <button type="button" className="reorg-pub-btn" data-pub-export="html" disabled={none} onClick={() => go('html')}>{t('reorgPubHtml')}</button>
      </div>
    </div>
  );
}

/** The sheet over the paper. Memoized on the page's id: her typing underneath never renders it. */
export const PublishView = memo(PublishViewImpl);
