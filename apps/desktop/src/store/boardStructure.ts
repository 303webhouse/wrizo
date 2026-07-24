import type { Box } from '../types';

// BM1 S4 — THE PROJECTION SEAM (the ticket's non-negotiable).
//
// Decks are DATA, modes are PROJECTIONS: one board, three views
// (OPEN / STORYBOARD / OUTLINE). This module is the ONE structure description
// that STORYBOARD and OUTLINE both render — derived PURELY from the board's own
// box data, never per mode, never a fork. A deck never knows which projection
// draws it; a projection never owns its own copy of the structure. Because both
// modes read the SAME tree here, and the ORDER lives on the shared boxes (`seq`)
// rather than in any mode, "one ordering, three views — order is data, not
// per-mode" is true by construction.
//
// OPEN does NOT use this module at all: it draws every box by its own x/y/z,
// exactly as today, so the seven-deck library renders byte-identically in OPEN
// and every existing board is untouched. The structure fields (`seq`/`laneId`/
// `parentId` on cards, `lanes[]` on board-meta) are all additive-optional and
// absent on every existing box — a board that has never entered STORYBOARD or
// OUTLINE has an empty structure registry and yields exactly one default lane.
//
// Pure and side-effect-free. The `with*` helpers return a NEW boxes array (the
// caller owns the single setBoxes/save) and DELETE a key rather than write
// `undefined`, so un-assigning a field restores a card byte-identical.

// A content card — the structural unit. Connections (hairlines) and board-meta
// are never structural; ink/text/page-pin cards are.
export function isCardBox(b: Box): boolean {
  return b.kind === 'text' || b.kind === 'page-pin' || b.kind === 'ink';
}

export interface OutlineNode {
  boxId: string;
  children: OutlineNode[];
}

export interface StructureLane {
  id: string;           // a board-meta lane id, or '' for the default lane
  title: string;        // lane title from the registry, or '' for the default lane
  items: OutlineNode[]; // this lane's top-level nodes, in cross-mode order
}

export interface BoardStructure {
  lanes: StructureLane[];
}

// The cross-mode order value: explicit `seq` if the card has ever been ordered,
// else its own array index (a board never reordered keeps its authored/paint
// order, deterministically). Array index is always the final tiebreak so the
// sort is total and stable.
function orderedCards(cards: Box[]): Box[] {
  const idx = new Map<string, number>();
  cards.forEach((c, i) => idx.set(c.id, i));
  return cards.slice().sort((a, b) => {
    const oa = a.seq != null ? a.seq : idx.get(a.id)!;
    const ob = b.seq != null ? b.seq : idx.get(b.id)!;
    return oa - ob || idx.get(a.id)! - idx.get(b.id)!;
  });
}

// Build the nesting forest for one lane's cards from `parentId`, ordered by the
// cross-mode order at every level, cycle-guarded (a malformed parent loop can
// never hang the render — a card already visited on the path is dropped, never
// recursed). Genuine unbounded nesting — the Grammarian's floor (S7): sections
// (lanes) containing points (top level) containing sub-points (children), and
// deeper where the writer nests further.
function buildNodes(cards: Box[]): OutlineNode[] {
  const inLane = new Set(cards.map((c) => c.id));
  const childrenOf = new Map<string, Box[]>();
  const roots: Box[] = [];
  for (const c of cards) {
    const p = c.parentId;
    if (p && p !== c.id && inLane.has(p)) {
      const arr = childrenOf.get(p) ?? [];
      arr.push(c);
      childrenOf.set(p, arr);
    } else {
      roots.push(c); // no parent, self-parent, or parent outside this lane → top level
    }
  }
  const visited = new Set<string>();
  const build = (c: Box): OutlineNode => {
    visited.add(c.id);
    const kids = orderedCards(childrenOf.get(c.id) ?? []).filter((k) => !visited.has(k.id));
    return { boxId: c.id, children: kids.map(build) };
  };
  const out = orderedCards(roots).map(build);
  // FX11 S4(b) (BM1 review advisory 1) — the never-silently-missing law applies
  // to projections too. A pure cycle (A↔B: each is the other's in-lane child, so
  // NEITHER lands in `roots`) would otherwise leave both cards unreachable from
  // any root and silently DROPPED from the render. Promote any still-unvisited
  // card to a root and build it — defending data that arrives already-cyclic
  // from an older client via sync. (withParent's S4a guard stops a fresh cycle
  // ever being minted; this defends the pre-existing ones.)
  for (const c of orderedCards(cards)) {
    if (!visited.has(c.id)) out.push(build(c));
  }
  return out;
}

// THE structure description. Structureless board (no lane registry) → exactly
// ONE default lane holding every card (S6's floor). Structured board → the
// board-meta lane registry in its declared order, plus a trailing default lane
// only if some cards are unlaned (never an empty one).
export function boardStructure(boxes: Box[]): BoardStructure {
  const meta = boxes.find((b) => b.kind === 'board-meta');
  const registry = meta?.lanes ?? [];
  const cards = boxes.filter(isCardBox);

  if (registry.length === 0) {
    return { lanes: [{ id: '', title: '', items: buildNodes(cards) }] };
  }

  const laneSet = new Set(registry.map((l) => l.id));
  const lanes: StructureLane[] = registry.map((def) => ({
    id: def.id,
    title: def.title,
    items: buildNodes(cards.filter((c) => c.laneId === def.id)),
  }));
  const unlaned = cards.filter((c) => !c.laneId || !laneSet.has(c.laneId));
  if (unlaned.length > 0) {
    lanes.push({ id: '', title: '', items: buildNodes(unlaned) });
  }
  return { lanes };
}

// The pre-order flattening of a lane — STORYBOARD shows a lane as one ordered
// column of cards (nesting is OUTLINE's concern), but the ORDER is identical to
// OUTLINE's because both walk the same tree, same comparator.
export function flattenLane(lane: StructureLane): string[] {
  const out: string[] = [];
  const walk = (nodes: OutlineNode[]) => {
    for (const n of nodes) {
      out.push(n.boxId);
      walk(n.children);
    }
  };
  walk(lane.items);
  return out;
}

// --- pure mutation helpers (STORYBOARD/OUTLINE write these) ---------------

// Re-seq `orderedIds` to fresh integers in that order; cards not named keep
// their own seq. This is how a drag makes a new order the board's truth.
export function withSeqOrder(boxes: Box[], orderedIds: string[]): Box[] {
  const rank = new Map(orderedIds.map((id, i) => [id, i]));
  return boxes.map((b) => (rank.has(b.id) ? { ...b, seq: rank.get(b.id)! } : b));
}

// Move a card into a lane (`laneId` undefined → the default lane; deletes the
// key so the card is byte-identical to an unlaned one).
export function withLane(boxes: Box[], cardId: string, laneId: string | undefined): Box[] {
  return boxes.map((b) => {
    if (b.id !== cardId) return b;
    if (laneId) return { ...b, laneId };
    const { laneId: _drop, ...rest } = b;
    return rest as Box;
  });
}

// FX11 S4(a) (BM1 review advisory 1) — would setting cardId's parent to parentId
// close a cycle? It does iff parentId is a DESCENDANT of cardId — i.e. walking
// UP the parent chain from parentId reaches cardId. The `seen` guard keeps this
// terminating even on data that arrives already-cyclic (an older client, via
// sync): it stops rather than hangs.
function wouldCycle(boxes: Box[], cardId: string, parentId: string): boolean {
  const parentOf = new Map(boxes.map((b) => [b.id, b.parentId]));
  const seen = new Set<string>();
  let cur: string | undefined = parentId;
  while (cur) {
    if (cur === cardId) return true;
    if (seen.has(cur)) return false; // an existing upstream loop that does NOT pass through cardId
    seen.add(cur);
    cur = parentOf.get(cur);
  }
  return false;
}

// Nest a card under a parent (`parentId` undefined → top level; deletes the
// key). Refuses a self-parent AND (FX11 S4a) any ancestor-chain cycle — a
// refused nest is a clean no-op returning the boxes unchanged (the store's own
// refusal grammar). The render stays cycle-guarded regardless (S4b, buildNodes).
export function withParent(boxes: Box[], cardId: string, parentId: string | undefined): Box[] {
  if (parentId && parentId !== cardId && wouldCycle(boxes, cardId, parentId)) return boxes; // refused: no-op
  return boxes.map((b) => {
    if (b.id !== cardId) return b;
    if (parentId && parentId !== cardId) return { ...b, parentId };
    const { parentId: _drop, ...rest } = b;
    return rest as Box;
  });
}

// Set / replace the board's lane registry on board-meta (creating the meta box
// if the board has none yet), the FX4 board-meta precedent. Empty list clears
// it (the board goes structureless again).
export function withLanes(boxes: Box[], lanes: { id: string; title: string }[], newMetaId: () => string): Box[] {
  const existing = boxes.find((b) => b.kind === 'board-meta');
  if (existing) {
    return boxes.map((b) => (b.id === existing.id ? { ...b, lanes: lanes.length ? lanes : undefined } : b));
  }
  if (lanes.length === 0) return boxes;
  return [...boxes, { id: newMetaId(), kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, lanes }];
}

// Test/inspection seam (the wrizoBoard/wrizoPairing convention) — lets bm1.mjs
// assert single-sourced order across modes without DOM.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoStructure?: unknown }).wrizoStructure = {
    of: boardStructure,
    flattenLane,
    isCardBox,
  };
}
