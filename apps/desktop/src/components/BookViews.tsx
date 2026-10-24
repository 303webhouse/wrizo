import { useCallback, useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { decorateMarkdownForCard } from '../store/draftDecoration';
import { firstLine } from '../store/entryText';
import { WALK, walkStep, swipePlan, getWalkPos, setWalkPos, type SwipePlan } from '../store/walk';
import type { JournalEntry } from '../types';

// W1 - THE JOURNAL AS A BOOK (brief docs/guided-paths/w1-walk-brief.md; frames 04-flip, 04-thumbnails). A Book has two views, not four: FLIP - one page at a time with the Walk's own top-corner chevrons and the same
// pure-slide swipe (the J1 <- -> walk, now on the Walk's stage: it wears the Walk's classes, so it moves like the Walk and cannot drift from it) - and THUMBNAILS - a grid of tall pages with the current page in brass
// (the J3 spread's grid). The pages are the loose Journal in the writer's own order (persistence getNotebookPages, J1); a Book's pins are untouched - nothing here writes a page, a pin or an order.
// "Where the writer is" is the Walk's device-local memory (store/walk.ts getWalkPos), so Flip and Thumbnails agree on the current page.

export function BookFlip({ boardId, pages, onOpen, receded }: { boardId: string; pages: JournalEntry[]; onOpen: (page: JournalEntry) => void; receded: boolean }) {
  const { t } = useDeskLexicon();
  const [index, setIndex] = useState(() => { const id = getWalkPos(boardId); const i = id ? pages.findIndex((p) => p.id === id) : -1; return i >= 0 ? i : 0; });
  const cur = Math.min(index, Math.max(0, pages.length - 1));
  const page = pages[cur];
  const [leaving, setLeaving] = useState<{ text: string; plan: SwipePlan } | null>(null);
  const [incoming, setIncoming] = useState<SwipePlan | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => { if (page) setWalkPos(boardId, page.id); }, [boardId, page?.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const go = useCallback((dir: 1 | -1, to?: number) => {
    const next = to ?? walkStep(pages.length, cur, dir);
    if (next === cur || !page) return;
    const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const plan = swipePlan(next > cur ? 1 : -1, reduced);
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (plan.kind === 'slide') {
      setLeaving({ text: page.text, plan });
      setIncoming(plan);
      timer.current = window.setTimeout(() => { setLeaving(null); setIncoming(null); }, plan.ms + 30);
    } else { setLeaving(null); setIncoming(null); }
    setIndex(next);
  }, [pages.length, cur, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest?.('[contenteditable="true"], input, textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go]);

  if (!page) return <div className="walk walk-empty" data-walk data-book="flip"><div className="walk-doors"><span className="walk-note">{t('flipEmpty')}</span></div></div>;
  const html = (text: string) => ({ __html: decorateMarkdownForCard(text, null) });
  return (
    <div className="walk" data-walk data-book="flip">
      <div className="walk-stage">
        <div className="walk-frame" style={{ width: WALK.W }}>
          <button type="button" className="walk-nav" data-dir="prev" data-recede={receded ? 'true' : 'false'} aria-label={t('walkPrev')} aria-disabled={cur === 0} onClick={() => go(-1)}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" /></svg>
          </button>
          <button type="button" className="walk-nav" data-dir="next" data-recede={receded ? 'true' : 'false'} aria-label={t('walkNext')} aria-disabled={cur >= pages.length - 1} onClick={() => go(1)}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
          </button>
          <div className="walk-window">
            {leaving && <div className="walk-card walk-card-leaving" data-out={leaving.plan.outgoing} aria-hidden="true"><div className="board-popup-editor walk-static" dangerouslySetInnerHTML={html(leaving.text)} /></div>}
            <div key={page.id} className="walk-card" data-box-id={page.id} data-in={incoming ? incoming.incoming : undefined}>
              <div className="board-popup-editor walk-static" dangerouslySetInnerHTML={html(page.text)} />
            </div>
          </div>
        </div>
        <div className="walk-doors" role="group">
          <button type="button" className="walk-door" data-door="open" onClick={() => onOpen(page)}>{t('walkOpen')}</button>
        </div>
        <div className="walk-rail" role="list" aria-label={t('walkRail')}>
          {pages.map((pg, i) => (
            <button key={pg.id} type="button" role="listitem" className="walk-mark" data-state={i === cur ? 'current' : pg.text.trim() ? 'leaf' : 'seed'} data-current={i === cur ? 'true' : 'false'} aria-label={`${i + 1}`} onClick={() => go(i > cur ? 1 : -1, i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BookThumbs({ boardId, pages, onPick }: { boardId: string; pages: JournalEntry[]; onPick: (page: JournalEntry) => void }) {
  const { t } = useDeskLexicon();
  const currentId = getWalkPos(boardId) ?? pages[0]?.id;
  if (pages.length === 0) return <div className="walk walk-empty" data-walk data-book="thumbnails"><div className="walk-doors"><span className="walk-note">{t('flipEmpty')}</span></div></div>;
  return (
    <div className="book-thumbs" role="list" data-book="thumbnails">
      {pages.map((pg, i) => (
        <button key={pg.id} type="button" role="listitem" className="book-thumb" data-page-id={pg.id} data-current={pg.id === currentId ? 'true' : 'false'} onClick={() => onPick(pg)}>
          <span className="book-thumb-sheet" aria-hidden="true">{pg.text.trim().split('\n').slice(0, 7).join('\n')}</span>
          <span className="book-thumb-caption">{`${i + 1} · ${firstLine(pg.text).slice(0, 40)}`}</span>
        </button>
      ))}
    </div>
  );
}
