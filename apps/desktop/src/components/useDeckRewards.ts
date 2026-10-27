import { useEffect, useRef, useState } from 'react';
import { effectiveAmbianceDial } from '../store/ambianceDial';
import { hasCelebrated, kindleMoments, markCelebrated } from '../store/deckRewards';
import { CELEBRATE_MS } from './WritingIncentives';

// W5 - THE TIMING OF THE REWARD MOMENTS. store/deckRewards.ts decides (pure); this hook only watches the Deck's kindled set across renders, asks that decision what fires, remembers it on this device, and holds the answer
// for CELEBRATE_MS - the celebration grammar's own constant (1.1 s) - so the dress (the stylesheet's W5 zone) can play. It runs ONLY on a Deck (`enabled`), so a writer who never opens one sees nothing new.
//
// THE BASELINE: the first frame is never a moment (the W1-R1 lesson: seed on mount, celebrate only transitions), and every step already begun when the Deck is opened is remembered as begun (silently), so deleting its words
// and retyping them is not a second first time. A Deck opened already complete is remembered as done. REDUCED MOTION / AMBIANCE 0 = THE STILL END STATE: the memory is written exactly the same, but no moment is held, so
// nothing plays - the leaf and the root line are simply there (they come from `data-kindled`, not from this hook).

export interface DeckRewardMoments { kindling: ReadonlySet<string>; deck: boolean }
const NONE: ReadonlySet<string> = new Set();

function motionAllowed(): boolean {
  return effectiveAmbianceDial() > 0;   // zero under reduced motion too (store/ambianceDial.ts)
}

export function useDeckRewards(boardId: string, enabled: boolean, stepIds: readonly string[], kindledIds: ReadonlySet<string>, mainIds?: readonly string[]): DeckRewardMoments {
  const [kindling, setKindling] = useState<ReadonlySet<string>>(NONE);
  const [deck, setDeck] = useState(false);
  const prev = useRef<{ board: string; set: ReadonlySet<string> } | null>(null);
  const kTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepKey = stepIds.join('|') + '#' + (mainIds ?? stepIds).join('|');
  const kindledKey = stepIds.filter((id) => kindledIds.has(id)).join('|');

  useEffect(() => {
    if (!enabled) { prev.current = null; return; }
    const before = prev.current && prev.current.board === boardId ? prev.current.set : null;
    const celebratedCards = new Set(stepIds.filter((id) => hasCelebrated('card', id)));
    const m = kindleMoments({ prev: before, next: kindledIds, stepIds, mainIds, celebratedCards, deckDone: hasCelebrated('deck', boardId) });
    for (const id of stepIds) if (kindledIds.has(id)) markCelebrated('card', id);
    const main = mainIds ?? stepIds;
    if ((m.deck || (before === null && main.length > 0 && main.every((id) => kindledIds.has(id))))) markCelebrated('deck', boardId);
    prev.current = { board: boardId, set: new Set(kindledIds) };
    if (!motionAllowed()) return;
    if (m.cards.length > 0) {
      setKindling(new Set(m.cards));
      if (kTimer.current) clearTimeout(kTimer.current);
      kTimer.current = setTimeout(() => setKindling(NONE), CELEBRATE_MS);
    }
    if (m.deck) {
      setDeck(true);
      if (dTimer.current) clearTimeout(dTimer.current);
      dTimer.current = setTimeout(() => setDeck(false), CELEBRATE_MS);
    }
  }, [boardId, enabled, stepKey, kindledKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (kTimer.current) clearTimeout(kTimer.current);
    if (dTimer.current) clearTimeout(dTimer.current);
  }, []);

  return { kindling, deck };
}
