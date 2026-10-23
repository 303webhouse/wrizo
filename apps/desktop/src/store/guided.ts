import type { Box } from '../types';
import { graftsOf } from './grafts';
import { sectionsOf, type Place } from './place';
import { firstLine } from './entryText';

// W3 (guided paths) - the PURE reading of a dealt step. A card's text is `Title\nbody`; a dealt Tier 1 card is `Title\n` (an EMPTY body) and carries its question as `prompt`
// (types/index.ts). Everything here reads the box; nothing writes. The placeholder is never part of `text`, so nothing that reads the writer's words can ever see it.

/** The card's title line and its body (everything after the first newline). A card with no newline has an empty body. */
export function splitCard(text: string | undefined): { title: string; body: string } {
  const t = text ?? '';
  const nl = t.indexOf('\n');
  return nl < 0 ? { title: t, body: '' } : { title: t.slice(0, nl), body: t.slice(nl + 1) };
}

/** True when the card's body holds no words (whitespace only). */
export function bodyIsEmpty(text: string | undefined): boolean {
  return splitCard(text).body.trim() === '';
}

/** The question to show as this card's placeholder, or null: only a hand-dealt TEXT card that carries a prompt, is not a ported mirror, and has no body yet. */
export function promptToShow(box: Pick<Box, 'kind' | 'text' | 'prompt' | 'sourceEntryId'>): string | null {
  if (box.kind !== 'text' || box.sourceEntryId || !box.prompt) return null;
  return bodyIsEmpty(box.text) ? box.prompt : null;
}

/** Coverage, the body half: the card holds the writer's words. */
export function hasWriterText(box: Pick<Box, 'text'>): boolean {
  return !bodyIsEmpty(box.text);
}

/** KINDLED (no UI yet - W1's Walk and W5's coverage read it): a card is kindled when its body has the writer's text OR the card has a graft to a page. A graft to another CARD does not
 *  count - it is a connection, not a page the writer wrote. `boardId` is the board the card lives on; `boxes` (optional) is that board's live boxes, as graftsOf takes them. */
export function kindled(boardId: string, box: Pick<Box, 'id' | 'text'>, boxes?: readonly Box[]): boolean {
  if (hasWriterText(box)) return true;
  const g = graftsOf({ entryId: boardId, boxId: box.id }, boxes);
  return g.Pages.length + g.Sources.length + g.Boards.length > 0;
}

/** FROM MY PAGES' picker (Fable, Oct 23): the pages of the writer's CURRENT PLACE - the pages the Pages pop-out lists for it, in the writer's own order: this Drawer's pages (every set in it), or the
 *  Journal's when the writer is in the Journal. Not the board's own set: a NEW board has no pages yet, and the preset that opens it has to work. Boards, system boards and plan faces are never listed. */
export function pagesOfPlace(place: Pick<Place, 'kind' | 'id'>): { id: string; title: string }[] {
  return sectionsOf(place, 'pages').flatMap(g => g.items).map(e => ({ id: e.id, title: firstLine(e.text) }));
}
