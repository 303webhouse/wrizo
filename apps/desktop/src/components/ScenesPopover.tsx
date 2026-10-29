import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { CHILD_DEFAULT, CHILD_MAX } from '../store/childSteps';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import type { ChildWord } from '../decks/types';
import type { Box } from '../types';

// "ADD SCENES..." - the small popover under the door (brief; mockup s1): the kicker ("ADD SCENES UNDER THIS STEP"), "How many scenes?", square chips 1-5 with 3 chosen, Add, and the note "They go right under <step>.".
// NOTHING IS CREATED UNTIL ADD: the chips only choose; Esc closes (and is the popover's alone: it is taken in the capture phase, so the Walk's own Esc - leave for the board - never fires from here). Every word comes in
// as a prop, already resolved through the lexicon for the deck's word and the theme. Square edges, no shadow, no motion; the stylesheet's SCENES zone dresses it.

export interface ScenesPopoverProps {
  kicker: string;
  question: string;
  note: string;
  addLabel: string;
  onAdd: (n: number) => void;
  onClose: () => void;
  /** The door it opens under. The popover is FIXED to the viewport beneath it (never in the flow, never part of a scroll container's overflow), so opening it cannot add a scrollbar or move the page: PAGE IS PRIMARY. */
  anchor?: HTMLElement | null;
  style?: CSSProperties;
}

export function ScenesPopover(p: ScenesPopoverProps) {
  const [n, setN] = useState<number>(CHILD_DEFAULT);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      if (!p.anchor) return;
      const r = p.anchor.getBoundingClientRect();
      const w = ref.current?.offsetWidth ?? 272;
      setPos({ left: Math.max(8, Math.min(window.innerWidth - w - 8, Math.round(r.left + r.width / 2 - w / 2))), top: Math.round(r.bottom + 6) });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [p.anchor]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      p.onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [p.onClose]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="scenes-pop" ref={ref} role="dialog" aria-label={p.kicker} style={{ ...p.style, ...(pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' as const }) }} data-scenes-pop="true">
      <div className="scenes-kicker">{p.kicker}</div>
      <div className="scenes-q">{p.question}</div>
      <div className="scenes-chips" role="group">
        {Array.from({ length: CHILD_MAX }, (_, i) => i + 1).map((k) => (
          <button key={k} type="button" className="scenes-chip" data-n={k} aria-pressed={k === n} onClick={() => setN(k)}>{k}</button>
        ))}
      </div>
      <div className="scenes-foot">
        <button type="button" className="scenes-add" onClick={() => p.onAdd(n)}>{p.addLabel}</button>
        <span className="scenes-note">{p.note}</span>
      </div>
    </div>
  );
}

/** The door in Storyboard and Outline (the card's own controls): the deck's word, and the same "How many?" popover under it. Only handed a top-level step of a Deck by the board. */
export function ScenesDoor({ box, word, onAdd }: { box: Box; word: ChildWord; onAdd: (box: Box, n: number) => void }) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement | null>(null);
  const plural = t(`kidPlural_${word}` as DeskTermId);
  return (
    <span className="scenes-door-wrap">
      <button type="button" ref={btn} className="btn-quiet board-scenes-door" data-door="scenes" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{t(`kidDoor_${word}` as DeskTermId)}</button>
      {open && (
        <ScenesPopover
          kicker={t('kidKicker').replace('{plural}', plural)}
          question={t('kidHowMany').replace('{plural}', plural)}
          note={t('kidNote').replace('{step}', (box.text ?? '').split('\n')[0].trim())}
          addLabel={t('kidAdd')}
          anchor={btn.current}
          onClose={() => setOpen(false)}
          onAdd={(n) => { setOpen(false); onAdd(box, n); }}
        />
      )}
    </span>
  );
}
