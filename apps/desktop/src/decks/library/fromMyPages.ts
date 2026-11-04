import { deskTerm } from '../../store/deskLexicon';
import { getJournalEntry } from '../../store/persistence';
import { withoutFontMarks } from '../../store/markRuns';   // a card's title carries no font marks [fromMyPages §1]
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// FROM MY PAGES, the reverse outline: look at what you already wrote and name what each part is doing. The writer PICKS pages, in their order (the wizard's `kind: 'pages'` question, components/DeckWizard.tsx); the deck deals ONE CARD PER PAGE, in that order, each titled with its page's title (or first words) and GRAFTED to that page (`graftTo`; the caller grafts it through the board, decks/engine.ts MaterializedDeal.grafts). It only shows: nothing here writes, reorders or moves a page (the only store import is a READ, getJournalEntry), and a card's graft is the ordinary Grafts record a writer could make by hand. The card's body is empty, its question "What does this part do for the whole?"; the Gaps readout is not a card and is not dealt. Answers: `pages` = the chosen entry ids joined by ',' (in the order picked); a deal with none deals nothing, and the wizard never offers it. [fromMyPages §2]

const COLS = 3;
const W = colWidth(COLS);

const titleOf = (text: string | undefined): string => (withoutFontMarks(text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60) || deskTerm('boardThreadUntitled');

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
