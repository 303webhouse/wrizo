import type { Box } from '../types';
import type { ChildWord } from '../decks/types';
import { DECKS } from '../decks/library';
import { liveBoxes } from './boxTombstones';
import { deskTerm, type DeskTermId } from './deskLexicon';

// "ADD SCENES..." (brief Downloads\add-scenes-brief.md; Nick approved the design and the word table) - CHILD CARDS UNDER A STEP, as PURE model. A child is an ordinary text card that nests under its step with the EXISTING
// `parentId` (already synced, already read by Storyboard / Outline / the Walk's order): NO new data. It lives in the step's lane, is ordered right after the step (after any children it already has), is titled
// "<Word> n" continuing the numbering, and carries the word's question as `prompt` - W3's placeholder, shown in the empty body and never part of `text`. One level deep: a sub-step has no door. The WORD changes with the
// deck (the registry's optional `childWord`; the words themselves live in the lexicon). components/ScenesPopover.tsx asks "How many?"; the board calls addChildren on Add.

export const CHILD_MAX = 5;
export const CHILD_DEFAULT = 3;

/** The deck's word for its children ("scene", "beat", ...), or null: From my pages (and any deck that names none) has no door. */
export function childWordOf(deckId: string | undefined | null): ChildWord | null {
  if (!deckId) return null;
  return DECKS.find((d) => d.id === deckId)?.childWord ?? null;
}

/** The word for THIS card's door: only a top-level step dealt from a Deck that has a word, on a Deck board - not a sub-step (one level deep), not a plain card, a mirror or an ink card. */
export function sceneDoorFor(box: Pick<Box, 'kind' | 'parentId' | 'deckStep' | 'sourceEntryId'>, isDeck: boolean): ChildWord | null {
  if (!isDeck || box.kind !== 'text' || box.sourceEntryId) return null;
  if (!box.parentId && !!box.deckStep) return childWordOf(box.deckStep.deck);
  return null;
}

const questionTermFor = (deckId: string, word: ChildWord): DeskTermId => (deckId === 'feature-story' && word === 'section' ? 'kidQ_section_story' : (`kidQ_${word}` as DeskTermId));

/** The question a deck's child carries as its placeholder (Feature Story's section asks its own), or null when the deck has no word. */
export function childQuestionOf(deckId: string): string | null {
  const w = childWordOf(deckId);
  return w ? deskTerm(questionTermFor(deckId, w)) : null;
}

/** The child's title word for a deck ("Scene"), or null. */
export function childTitleOf(deckId: string): string | null {
  const w = childWordOf(deckId);
  return w ? deskTerm(`kidTitle_${w}` as DeskTermId) : null;
}

const asCount = (n: number): number => Math.min(CHILD_MAX, Math.max(1, Math.floor(Number.isFinite(n) ? n : CHILD_DEFAULT)));

/** ADD N CHILDREN under a step. Returns the new boxes and the new ids in order; a card that may not take children (a sub-step, a plain card, an unknown id) returns the SAME array and no ids. N is clamped to 1..5.
 *  Each child: kind text, parentId = the step, the step's laneId (no key when it has none), seq after the step's last child, title "<Word> n" CONTINUING (never repeating a title still on the board), `prompt` = the question,
 *  a place in Open beside the step. Pure: the input is untouched and every other card comes back as the same object. */
export function addChildren(boxes: Box[], parentId: string, n: number, o: { title: string; question: string; newId: () => string }): { boxes: Box[]; ids: string[] } {
  const live = liveBoxes(boxes);
  const parent = live.find((b) => b.id === parentId);
  if (!parent || parent.kind !== 'text' || parent.parentId || !parent.deckStep || parent.sourceEntryId) return { boxes, ids: [] };
  const count = asCount(n);
  const kids = live.filter((b) => b.parentId === parent.id && b.kind === 'text');
  const key = (b: Box): number => (b.seq != null ? b.seq : boxes.indexOf(b));
  const base = kids.length ? Math.max(...kids.map(key)) + 1 : 1;
  const numbered = kids.map((k) => { const m = new RegExp(`^${o.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (\\d+)`).exec((k.text ?? '').split('\n')[0]); return m ? Number(m[1]) : 0; });
  const start = Math.max(kids.length, ...numbered, 0);
  const maxZ = boxes.reduce((m, b) => Math.max(m, b.z), 0);
  const made: Box[] = [];
  for (let i = 0; i < count; i++) {
    const num = start + i + 1;
    made.push({
      id: o.newId(), kind: 'text',
      x: Math.min(Math.max(0, 1 - parent.w), parent.x + 0.03 * (i + 1)), y: parent.y + parent.h + 0.02 * (i + 1), w: parent.w, h: parent.h, z: maxZ + 1 + i,
      text: `${o.title} ${num}\n`, prompt: o.question,
      parentId: parent.id,
      ...(parent.laneId ? { laneId: parent.laneId } : {}),
      seq: base + i,
    });
  }
  return { boxes: [...boxes, ...made], ids: made.map((b) => b.id) };
}

export interface SubStepInfo { parentId: string; parentTitle: string; n: number; m: number; mainN: number; mainM: number }

/** Where a sub-step stands, for the Walk's readout ("MIDPOINT REVERSAL > SCENE 2 OF 3", Flux TRK 5.2/9): its parent, its number among the parent's children, and the parent's place among the MAIN steps. Null for a main step. */
export function subStepInfo(order: readonly Box[], boxId: string): SubStepInfo | null {
  const box = order.find((b) => b.id === boxId);
  if (!box || !box.parentId) return null;
  const parent = order.find((b) => b.id === box.parentId);
  if (!parent) return null;
  const sibs = order.filter((b) => b.parentId === box.parentId);
  const mains = order.filter((b) => !b.parentId);
  return { parentId: parent.id, parentTitle: (parent.text ?? '').split('\n')[0].trim(), n: sibs.findIndex((b) => b.id === boxId) + 1, m: sibs.length, mainN: mains.findIndex((b) => b.id === parent.id) + 1, mainM: mains.length };
}

/** The rail's groups: one per MAIN step, with its children's ids - the small marks hang from the parent's mark. */
export function railGroups(order: readonly Box[]): { id: string; kids: string[] }[] {
  const groups: { id: string; kids: string[] }[] = [];
  for (const b of order) {
    const last = groups[groups.length - 1];
    if (b.parentId && last && last.id === b.parentId) last.kids.push(b.id);
    else groups.push({ id: b.id, kids: [] });
  }
  return groups;
}
