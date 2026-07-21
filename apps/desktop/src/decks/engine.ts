import { generateId } from '../store/persistence';
import type { Box } from '../types';
import type { DeckDefinition, DeckAnswers } from './types';

// B3 S1 — the deck engine's own pure heart: turns a deck definition's
// declared card set (DealtCardSpec[], local `key`s only) into a real Box[]
// (real generateId()'d ids, real 'connection' threads), WITHOUT touching
// persistence at all. Zero schema, by construction: a dealt card is exactly
// `{ id, kind:'text', x, y, w, h, z, text }` — the SAME shape any hand-typed
// "Add card" box already has (BoardEditor.tsx's own onAddCard) — and owes
// NOTHING to its template afterward: no deckId, no definition id, no back-
// reference of any kind, on the card OR the thread. `title`/`body` resolve
// through deskTerm() here (the established non-hook lexicon escape hatch —
// see persistence.ts's own SYSTEM_BOARD_TITLE_TERM) so every dealt card's
// own words route through the SAME lexicon seam as any other chrome copy.
//
// Threads dedupe either direction (the SAME rule BoardEditor.tsx's own
// finishThreadDrag already applies to a hand-drawn thread) so two cards
// naming each other in `threadTo` mint exactly ONE connection, not two.
//
// This function is pure and does not persist — callers own the ONE actual
// mutation, and it is always the SAME boxes-array path any other card
// creation already uses (saveBoardBoxes for a brand-new board in
// CreateProject.tsx's own door; plain setBoxes, riding BoardEditor's own
// existing debounced autosave, for the Board's own "From a deck…" door —
// see that file's own onAddFromDeck for why: appending via a SEPARATE
// direct saveBoardBoxes call there would race BoardEditor's own in-memory,
// not-yet-flushed `boxes` state, the exact class of seed/flush race this
// project's own standing harness discipline warns against).
export interface MaterializedDeal {
  boxes: Box[];
  firstCardId: string;
  dealtIds: string[];
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
    return box;
  });

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
    firstCardId: idByKey.get(specs[0].key)!,
    dealtIds: cardBoxes.map(b => b.id),
  };
}
