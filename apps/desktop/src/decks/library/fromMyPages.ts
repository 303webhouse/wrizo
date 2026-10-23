import { deskTerm } from '../../store/deskLexicon';
import { getJournalEntry } from '../../store/persistence';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// W3 (Wrizors' game plan, wave 1; content decks/content.ts, from w3-deck-content.md section 2.7) - FROM MY PAGES, the reverse outline: look at what you already wrote and name what each part is doing.
// The writer PICKS pages, in their order (the wizard's own page step - a `kind: 'pages'` question, components/DeckWizard.tsx); the deck deals ONE CARD PER PAGE, in that order, each card titled
// with its page's title (or first words) and GRAFTED to that page (the card carries `graftTo`; the caller grafts it through the board - decks/engine.ts MaterializedDeal.grafts).
//
// IT SHOWS ONLY (Nick, Oct 23): nothing here writes a page, reorders a page or moves one - this file imports no store function but a READ (getJournalEntry), and a card's graft is the ordinary
// Grafts record the writer could make by hand. The card's body is empty and its question is "What does this part do for the whole?"; the "gaps" row of the doc (the Gaps readout, local) is
// W5's, not a card, and is not dealt.
//
// Answers: `pages` = the chosen entry ids joined by ',' (in the order picked). A deal with none deals nothing - the wizard never offers it.

const COLS = 3;
const W = colWidth(COLS);

const titleOf = (text: string | undefined): string => ((text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60) || deskTerm('boardThreadUntitled');

function layout(ids: string[]): DealtCardSpec[] {
  return ids.map((id, i) => ({
    key: `page-${i}`,
    ...guidedStep('from-my-pages', 'page', titleOf(getJournalEntry(id)?.text)),
    x: colX(i % COLS, COLS), y: rowY(Math.floor(i / COLS)), w: W, h: CARD_H,
    graftTo: id,
  }));
}

export const fromMyPagesDeck: DeckDefinition = {
  id: 'from-my-pages',
  room: 'every',
  nameTerm: 'deckNameFromMyPages',
  questions: [
    { id: 'pages', promptTerm: 'deckFromMyPagesQPrompt', options: [], kind: 'pages' },
  ],
  deal: (answers) => layout((answers.pages ?? '').split(',').filter(Boolean)),
};
