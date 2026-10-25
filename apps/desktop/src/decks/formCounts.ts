import type { DeckDefinition, DeckAnswers, DeckRoom } from './types';

// MACHINA FORMS (Fable's brief Oct 24; frames m7 / m8) - the deck library in Machina's dress. Two pieces of DATA the panel needs, both read from the real registry rather than typed in twice:
//   blockRangeLabel(deck)  the block count at the right of a row: a RANGE where the deal question changes it (Three-Act 6-9, Argumentative Essay 5-7), one number where it does not (Story Circle 8), nothing for a deck that
//                          deals a block per page the writer picks (From my pages). Computed from the deck's own deal() over every combination of its choice questions - so it can never drift from what the deal really makes.
//   FORMS_GROUPS           Machina's seven group labels, in the mockup's order, each with its decks in the mockup's order. The registry's rooms map onto them (a group's `room` is the room its decks live in; the label is the
//                          lexicon's - deckRoom* under Machina), and every registered deck appears exactly once.
// The ONE hand-set figure: Character Study reads "2-4 x" (two to four CHARACTERS, a count the writer chooses, not a block total) - the mockup's own wording for a deck whose size is a multiple of a number you pick.

/** every distinct block total the deck can deal, over all combinations of its CHOICE questions (a pages question is skipped: it has no fixed total) */
function totals(deck: DeckDefinition): number[] {
  const choice = deck.questions.filter((q) => q.kind !== 'pages');
  if (deck.questions.some((q) => q.kind === 'pages')) return [];
  let combos: DeckAnswers[] = [{}];
  for (const q of choice) combos = combos.flatMap((c) => q.options.map((o) => ({ ...c, [q.id]: o.id })));
  return [...new Set(combos.map((a) => deck.deal(a).length))].sort((x, y) => x - y);
}

const HAND_SET: Record<string, string> = { 'character-study': '2–4 ×' };

export function blockRangeLabel(deck: DeckDefinition): string {
  if (HAND_SET[deck.id]) return HAND_SET[deck.id];
  const t = totals(deck);
  if (t.length === 0) return '';
  return t[0] === t[t.length - 1] ? String(t[0]) : `${t[0]}–${t[t.length - 1]}`;
}

/** the lexicon key of a deck's cover line (W4's helpCover<Deck>) - the row's second column */
export const coverTermKey = (deckId: string): string => 'helpCover' + deckId.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

export interface FormsGroup { group: string; room: DeckRoom; decks: readonly string[] }

/** Machina's group labels (the `group` strings are the canonical English kickers; the panel reads the lexicon's deckRoom* words for display) and their decks, in the mockup's order. */
export const FORMS_GROUPS: readonly FormsGroup[] = [
  { group: 'FICTION', room: 'fiction', decks: ['three-act', 'hero-journey', 'story-circle', 'character-study', 'scene-sequel'] },
  { group: 'WORLD', room: 'speculative', decks: ['worldbuilding'] },
  { group: 'SCREEN', room: 'screen', decks: ['feature-screenplay'] },
  { group: 'ACADEMIC', room: 'academy', decks: ['thesis', 'argument-essay', 'research-paper'] },
  { group: 'BUSINESS', room: 'business', decks: ['grant', 'business-proposal'] },
  { group: 'NEWSROOM', room: 'newsroom', decks: ['feature-story'] },
  { group: 'YOUR FILES', room: 'every', decks: ['from-my-pages'] },
];
