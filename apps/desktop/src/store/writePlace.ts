import type { Box, JournalEntry } from '../types';
import { getJournalEntries, getSystemKind } from './persistence';
import { liveBoxes } from './boxTombstones';
import { isDeck } from './boardKind';
import { walkOrder } from './walk';
import { graftTo, isGrafted, placeLabelOf, stepLabel, type GraftMade, type GraftRow } from './grafts';
import { unbornHref } from './unbornPage';

// W2 - "WRITE THIS" / "PLACE A PAGE..." / "PLACE THIS..." (brief docs/guided-paths/w2-write-place-brief.md; frames 02 / 05). The model behind the Walk's two doors and the page's own "Place this...". SCHEMA CHANGE: NONE - a
// placement is the page <-> card graft that already exists (a page_links record: store/grafts.ts graftTo), and the address that carries a door's meaning to an unborn page is the URL (store/unbornPage.ts).
//
//  - WRITE THIS (on a step): the door is only a PLAN - an unborn address that names the card, plus the router state the page's return chip reads. Nothing is written by it. The page is born by the writer's first keystroke
//    (PB1), and in that same act (unbornPage.ts birth) it is grafted to the card; so pressing the door to see costs nothing and leaves nothing behind.
//  - PLACE A PAGE (on a step): the existing graft picker, filtered to pages (grafts.ts searchGraftables ... 'pages'); a press grafts.
//  - PLACE THIS (on a page): the steps of the Decks, each a "Deck · Step" row (`searchSteps`); a press places the page on that step (`placeThis`).
// NOTHING IS PLACED WITHOUT THE WRITER'S PRESS: no suggestion, no auto-place (the Tutor's "Where does this fit?" is W7).

const titleOfText = (text: string | undefined): string => ((text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60) || 'Untitled';
const isShell = (e: JournalEntry): boolean => !!(e as { purgedAt?: string }).purgedAt;

export interface WriteBoard { boardId: string; boardTitle: string; /** the Deck's own set (project id), if it has one */ setId: string | null; origin?: 'journal' | 'loose' | null }

/** What pressing "Write this" does: the unborn address (no row yet) and the router state the new page's return chip reads - the Deck's name, and the step it was born from ("Three-Act · Midpoint"). PURE: writes nothing.
 *  PLACE RULES: the page goes in the Deck's set when it has one (so, the same Drawer); a Deck with no set is in the Journal's place, and its page is a Journal page or a loose one by the Deck's own origin. */
export function planWriteThis(board: WriteBoard, card: Pick<Box, 'id' | 'text'>): { href: string; state: { fromBoardId: string; fromBoardTitle: string; fromCardId: string; fromStepLabel: string } } {
  const href = unbornHref({
    origin: board.setId ? 'loose' : board.origin === 'journal' ? 'journal' : 'loose',
    binderId: board.setId ?? null,
    graft: { boardId: board.boardId, boxId: card.id },
  });
  return { href, state: { fromBoardId: board.boardId, fromBoardTitle: board.boardTitle, fromCardId: card.id, fromStepLabel: stepLabel(board.boardTitle, titleOfText(card.text)) } };
}

/** The picker for "Place this...": every Deck's steps, from every place, as "Deck · Step" rows with their place label (shown only for another Drawer's), checked when this page already sits on that step.
 *  Plain boards' cards are not steps; a trashed Deck, a system board and a shell are never listed. Filters by deck, step or place, case-insensitively. */
export function searchSteps(query: string, pageId: string): GraftRow[] {
  const q = query.trim().toLowerCase();
  const subjectPlace = placeLabelOf(pageId);
  const out: GraftRow[] = [];
  const decks = getJournalEntries().filter((e) => e.pageType === 'board' && !getSystemKind(e) && !isShell(e) && isDeck(e)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const e of decks) {
    const deck = titleOfText(e.text);
    const place = placeLabelOf(e.id);
    for (const b of walkOrder(liveBoxes(e.boxes ?? []))) {
      if (!(b.text ?? '').trim()) continue;
      const title = stepLabel(deck, titleOfText(b.text));
      if (q && !title.toLowerCase().includes(q) && !place.toLowerCase().includes(q)) continue;
      out.push({ key: `step:${e.id}:${b.id}`, group: 'Cards', entryId: e.id, boxId: b.id, title, place, placeDiffers: place !== subjectPlace, checked: isGrafted({ entryId: pageId }, { entryId: e.id, boxId: b.id }) });
    }
  }
  return out;
}

/** A press on a step row: the page is grafted to that step's card (a record the page owns). Null when nothing was written (already placed, or the step is gone). */
export function placeThis(pageId: string, row: { entryId: string; boxId?: string }): GraftMade {
  return graftTo({ entryId: pageId }, { entryId: row.entryId, ...(row.boxId ? { boxId: row.boxId } : {}) });
}
