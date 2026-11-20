import { memo, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JournalEntry } from '../types';
import { useDeskLexicon } from '../store/deskLexicon';
import { getJournalEntry, subscribe } from '../store/persistence';
import { routeForEntry } from '../store/routeForEntry';
import { partsOfDoc, type PartRow } from './partsSeam';
import { REORG } from './flag';

// MOVING BETWEEN PARTS (Fable's add-on, Nov 19 3:55 pm; plan: "forward and back arrows that show with the scrollbar", Nick's idea; built to the
// prototype's page, docs/mockups/reorg/app.js arrowBtn and partFoot, frame P2-12D). Behind ?reorg=1 in Machina, on a Page.
//   PartArrows: two arrows capping the page's own scrollbar (.mode-scroll's; on a screenplay, .desk-frame-scroll-cap's, the arrows a direct
//   child of the script stage: Fable, Nov 19 7:55 pm, ask e), previous above and next below, disabled at either end. They sit in
//     the paper's overlay slot (ModeStage's `readouts`, absolutely placed inside .mode-page), measured from the scroller's own layout box, so
//     neither the paper, the column nor the editor moves (page primacy).
//   PartFoot: the quiet line at a Part's foot, after her words in the same scroll: "< 1 · name", "end of Part 2", "Next · 3 · name >". Only in
//     a Doc of more than one Part. It dissolves with the chrome while she writes.
// A move is the app's ordinary way to open a page: save her typing first (the host's flush), then go. Neither control writes anything.
// Both are memoized on the page's id and follow the store by a signature of what they draw (names and order, never the words), so her typing
// never renders them: window.wrizoPartMovesRenders counts, only under the switch.

const fill = (s: string, vals: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));

let renders = 0;
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoPartMovesRenders?: () => number }).wrizoPartMovesRenders = () => renders;
}

/** What the moves draw, as a string: which Part she is on, of how many, and the Parts on either side (id and name). Never her own Part's name:
 *  an unnamed Part reads its first line, so her typing would otherwise change it. */
function movesSig(id: string): string {
  const e = getJournalEntry(id);
  if (!e) return '';
  const p = partsOfDoc(e);
  const side = (x: PartRow | undefined) => (x ? `${x.id}:${x.name}` : '');
  return [p.here, p.parts.length, side(p.parts[p.here - 2]), side(p.parts[p.here])].join('\u0001');
}

function useParts(entry: JournalEntry): { parts: PartRow[]; here: number } {
  useSyncExternalStore(subscribe, () => movesSig(entry.id));
  renders += 1;
  const p = partsOfDoc(getJournalEntry(entry.id) ?? entry);
  return { parts: p.parts, here: p.here };
}

function useGo(beforeLeave: () => void): (id: string) => void {
  const navigate = useNavigate();
  return (id: string) => {
    const target = getJournalEntry(id);
    if (!target) return;
    beforeLeave();
    navigate(routeForEntry(target));
  };
}

const partLabel = (p: PartRow): string => (p.name ? `${p.n}, ${p.name}` : String(p.n));
// the paper's own press (ModeStage onPaperPress) must never see a move: it would put the caret in the editor as she leaves
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

interface MovesProps { entry: JournalEntry; beforeLeave: () => void }

function PartArrowsImpl({ entry, beforeLeave }: MovesProps) {
  const { t } = useDeskLexicon();
  const { parts, here } = useParts(entry);
  const go = useGo(beforeLeave);
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; height: number; right: number } | null>(null);
  // the scroller's own layout box inside the paper (offset* are layout pixels, untouched by the paper's scale), so the arrows cap its bar
  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    const scroll = host?.querySelector<HTMLElement>(':scope > .mode-scroll, :scope > .desk-frame-scroll-cap');
    if (!host || !scroll) return;
    const measure = () => {
      // a both-edges gutter (the screenplay's scroller) reserves the bar's width on the left too: the bar is the right-hand half
      const gutter = Math.max(0, scroll.offsetWidth - scroll.clientWidth);
      const bar = /both-edges/.test(getComputedStyle(scroll).scrollbarGutter || '') ? gutter / 2 : gutter;
      const right = host.clientWidth - (scroll.offsetLeft + scroll.offsetWidth) + bar / 2;
      setBox((b) => (b && b.top === scroll.offsetTop && b.height === scroll.offsetHeight && b.right === right ? b : { top: scroll.offsetTop, height: scroll.offsetHeight, right }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scroll);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);
  const prev = parts[here - 2];
  const next = parts[here];
  return (
    <div ref={ref} className="reorg-part-arrows" data-part-arrows style={box ? { top: box.top, height: box.height, right: box.right } : { visibility: 'hidden' }}
      onMouseDown={stop} onClick={stop}>
      <button type="button" className="reorg-part-arrow is-up" data-part-step="-1" disabled={!prev}
        aria-label={prev ? fill(t('reorgPartPrevTo'), { part: partLabel(prev) }) : t('reorgPartNoPrev')}
        title={prev ? fill(t('reorgPartPrevTo'), { part: partLabel(prev) }) : t('reorgPartNoPrev')}
        onClick={() => prev && go(prev.id)}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 7.5 6 4l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <button type="button" className="reorg-part-arrow is-down" data-part-step="1" disabled={!next}
        aria-label={next ? fill(t('reorgPartNextTo'), { part: partLabel(next) }) : t('reorgPartNoNext')}
        title={next ? fill(t('reorgPartNextTo'), { part: partLabel(next) }) : t('reorgPartNoNext')}
        onClick={() => next && go(next.id)}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
    </div>
  );
}
export const PartArrows = memo(PartArrowsImpl, (a, b) => a.entry.id === b.entry.id);

function PartFootImpl({ entry, beforeLeave }: MovesProps) {
  const { t } = useDeskLexicon();
  const { parts, here } = useParts(entry);
  const go = useGo(beforeLeave);
  if (parts.length < 2) return null;
  const prev = parts[here - 2];
  const next = parts[here];
  return (
    <div className="reorg-part-foot mode-dissolve" data-part-foot onMouseDown={stop} onClick={stop}>
      {prev ? (
        <button type="button" className="reorg-part-foot-go" data-part-go={prev.id} title={fill(t('reorgPartPrevTo'), { part: partLabel(prev) })} onClick={() => go(prev.id)}>
          <span aria-hidden="true">‹ </span>{prev.n}{prev.name ? ` · ${prev.name}` : ''}
        </button>
      ) : <span />}
      <span className="reorg-part-foot-end">{fill(t('reorgPartEnd'), { n: here })}</span>
      {next ? (
        <button type="button" className="reorg-part-foot-go is-next" data-part-go={next.id} title={fill(t('reorgPartNextTo'), { part: partLabel(next) })} onClick={() => go(next.id)}>
          {t('reorgPartNext')} · {next.n}{next.name ? ` · ${next.name}` : ''}<span aria-hidden="true"> ›</span>
        </button>
      ) : <span />}
    </div>
  );
}
export const PartFoot = memo(PartFootImpl, (a, b) => a.entry.id === b.entry.id);
