import { threeActDeck } from './threeAct';
import { worldbuildingDeck } from './worldbuilding';
import { featureScreenplayDeck } from './featureScreenplay';
import { thesisDeck } from './thesis';
import { grantDeck } from './grant';
import { featureStoryDeck } from './featureStory';
import { characterStudyDeck } from './characterStudy';
import type { DeckDefinition, DeckRoom } from '../types';

// B3 S2 — the v1 ship set: the committee's six flagships plus Character
// Study, promoted on Fable's own call (item 36) as the threads
// demonstration. Nick ratifies/cuts/re-promotes by a word (this brief's own
// wording) — this array is the ONE place that decision lives; every door
// (CreateProject.tsx, BoardEditor.tsx) reads it, never a hand-copied list.
export const DECKS: DeckDefinition[] = [
  threeActDeck,
  worldbuildingDeck,
  featureScreenplayDeck,
  thesisDeck,
  grantDeck,
  featureStoryDeck,
  characterStudyDeck,
];

// The catalog's own room order (fiction -> speculative -> screen -> academy
// -> business -> newsroom) — the library's own grouped-by-room roster reads
// in this fixed order regardless of DECKS' own array order above.
export const ROOM_ORDER: DeckRoom[] = ['fiction', 'speculative', 'screen', 'academy', 'business', 'newsroom'];

export function decksByRoom(decks: DeckDefinition[] = DECKS): Map<DeckRoom, DeckDefinition[]> {
  const map = new Map<DeckRoom, DeckDefinition[]>();
  for (const room of ROOM_ORDER) map.set(room, []);
  for (const deck of decks) {
    const list = map.get(deck.room);
    if (list) list.push(deck);
  }
  return map;
}

// b3.mjs's own test/inspection seam — the SAME convention window.wrizoBoard
// (BoardEditor.tsx) / window.wrizoDeskLexicon (deskLexicon.ts) already
// establish. `dealCount`/`defaultAnswers` let the harness's own "definitions
// sweep" (S4) run all seven decks and confirm each deals its declared card
// count with ZERO DOM interaction — cheap, loop-friendly, exactly the
// brief's own words. Never used by product code itself.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoDecks?: unknown }).wrizoDecks = {
    ids: () => DECKS.map(d => d.id),
    defaultAnswers: (deckId: string): Record<string, string> => {
      const deck = DECKS.find(d => d.id === deckId);
      if (!deck) return {};
      const answers: Record<string, string> = {};
      for (const q of deck.questions) answers[q.id] = q.options[0].id;
      return answers;
    },
    dealCount: (deckId: string, answers: Record<string, string>): number => {
      const deck = DECKS.find(d => d.id === deckId);
      return deck ? deck.deal(answers).length : -1;
    },
  };
}
