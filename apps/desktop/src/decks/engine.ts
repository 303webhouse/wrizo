import { generateId } from '../store/persistence';
import type { Box } from '../types';
import type { DeckDefinition, DeckAnswers } from './types';

// The deck engine's pure heart: turns a deck's declared card set (DealtCardSpec[], local `key`s only) into a real Box[] (generated ids, real 'connection' threads) without touching persistence. Zero schema: a dealt card has the same shape as a hand-typed "Add card" box and owes its template nothing, except that a guided step (a Tier 1 deck's dealt card) carries ONE pointer, `deckStep: { deck, step }`, and its question as `prompt`, both optional, written only here on a NEW deal. `spec.title`/`spec.body` arrive already resolved through deskTerm() (see decks/types.ts's DealtCardSpec). Threads dedupe either direction (as BoardEditor's finishThreadDrag does), so two cards naming each other mint ONE connection. Callers own the one mutation, always the ordinary boxes-array path (saveBoardBoxes for a new board; plain setBoxes on the Board, riding its debounced autosave, since a separate saveBoardBoxes there would race the unflushed in-memory boxes). [engine §1]
export interface MaterializedDeal {
  boxes: Box[];
  firstCardId: string;
  dealtIds: string[];
  // W3 - the cards that are grafted to a page (From my pages), in dealt order: the caller grafts them through the board once the cards are on it. Empty for every other deck.
  grafts: { boxId: string; entryId: string }[];
}

export function materializeDeck(deck: DeckDefinition, answers: DeckAnswers, existing: Box[]): MaterializedDeal {
  const specs = deck.deal(answers);
  const maxZ = existing.reduce((m, b) => Math.max(m, b.z), 0);
  const idByKey = new Map<string, string>();
  for (const spec of specs) idByKey.set(spec.key, generateId());

  const cardBoxes: Box[] = specs.map((spec, i) => {
    const id = idByKey.get(spec.key)!;
    const box: Box = {
      id, kind: 'text', x: spec.x, y: spec.y, w: spec.w, h: spec.h,
      z: maxZ + 1 + i,
      text: `${spec.title}\n${spec.body}`,
    };
    // W3 - a guided step's question and its step key ride along as the two optional additive box fields; a card dealt without them gets neither key (byte-identical to before).
    if (spec.prompt) box.prompt = spec.prompt;
    if (spec.deckStep) box.deckStep = spec.deckStep;
    return box;
  });

  const grafts: { boxId: string; entryId: string }[] = [];
  specs.forEach(spec => { if (spec.graftTo) grafts.push({ boxId: idByKey.get(spec.key)!, entryId: spec.graftTo }); });

  const threadBoxes: Box[] = [];
  const seenPairs = new Set<string>();
  let threadZ = maxZ + 1 + cardBoxes.length;
  for (const spec of specs) {
    if (!spec.threadTo || spec.threadTo.length === 0) continue;
    const fromId = idByKey.get(spec.key);
    if (!fromId) continue;
    for (const otherKey of spec.threadTo) {
      const toId = idByKey.get(otherKey);
      if (!toId || toId === fromId) continue;
      const pairKey = [fromId, toId].sort().join('|');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      threadBoxes.push({
        id: generateId(), kind: 'connection', x: 0, y: 0, w: 0, h: 0,
        z: threadZ++, connA: fromId, connB: toId,
      });
    }
  }

  return {
    boxes: [...cardBoxes, ...threadBoxes],
    firstCardId: specs.length > 0 ? idByKey.get(specs[0].key)! : '',   // W3: a deal of nothing (From my pages with no pages picked) is empty, not a crash
    dealtIds: cardBoxes.map(b => b.id),
    grafts,
  };
}
