import type { Box } from '../../types';
import { boardStructure, flattenLane, isCardBox, withParent, withSeqOrder, type OutlineNode } from '../../store/boardStructure';
import { liveBoxes } from '../../store/boxTombstones';
import { outlineNumber, outlineTitleEdit, splitOutlineText } from '../../store/outlineRow';
import { withoutFontMarks } from '../../store/markRuns';
import { withCardText } from '../../store/textMarks';

// THE BACK MENU'S PLAN TAB (the reorg, phase 4.3, behind ?reorg=1 in Machina; reorg-plan.md section 9): "an ordered outline of the assets marked as
// Plan. Rows can be dragged, indented and renamed." The Plan IS the Page's own board's ordered view (Machina calls the Outline view "Plan"), so it
// reads and writes what that view already saves: the card's `seq` (the order), its `parentId` (the indent) and its text's first line (the name).
// NOTHING NEW IS SAVED - a board that has never been shaped here is shaped the same way in its own Plan view, and the other way round (Nick's ruling
// of Nov 19: "Plan order ... = PageLink (+ anchor) and board-meta"; the order is on the cards already, the board-meta holds only the lane registry).
// Pure, so every rule is proved without a browser (reorg-backmenu.mjs reads the same rows off the page).

export interface PlanRow {
  boxId: string;
  /** "5", "5.1": its place in the tree (outlineNumber). */
  number: string;
  depth: number;
  title: string;
  /** Its text after the first line, read-only beside the title (the Outline row's own rule). */
  body: string;
  /** A preset's grey prompt for this row (Box.planHint), or ''. */
  hint: string;
  /** This row's id and the ids of every row shown below it (its subsections): the Plan hides a prompt once a Part under the heading has words. */
  underIds: string[];
  isPin: boolean;
  isInk: boolean;
  canUp: boolean;
  canDown: boolean;
  canIndent: boolean;
  canOutdent: boolean;
}

/** A page's first line, as a Plan row names a pinned page (the Plan tab and the file that carries the Plan read the same name). */
export const titleOfText = (text: string | undefined): string => (withoutFontMarks(text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60);

const stampNow = (): string => new Date().toISOString();

/** The Plan's rows: every live card of the board that this Page has not hidden, in the board's own Outline order, indented as it is there. */
export function planRows(boxes: readonly Box[] | undefined | null, hidden: ReadonlySet<string>, pinTitle: (b: Box) => string = () => ''): PlanRow[] {
  const live = liveBoxes(boxes);
  const byId = new Map(live.map((b) => [b.id, b]));
  const out: PlanRow[] = [];
  const walk = (nodes: OutlineNode[], path: number[], depth: number) => {
    // the numbers count the rows that are SHOWN, so a hidden card leaves no gap
    const shown = nodes.filter((n) => !hidden.has(n.boxId));
    shown.forEach((n, i) => {
      const b = byId.get(n.boxId);
      if (!b) return;
      const here = [...path, i];
      const { title, body } = splitOutlineText(b.kind === 'text' ? b.text : b.kind === 'page-pin' ? pinTitle(b) : '');
      const row: PlanRow = {
        boxId: b.id, number: outlineNumber(here), depth, title, body, hint: b.planHint ?? '', underIds: [b.id], isPin: b.kind === 'page-pin', isInk: b.kind === 'ink',
        canUp: i > 0, canDown: i < shown.length - 1, canIndent: i > 0, canOutdent: depth > 0,
      };
      out.push(row);
      const from = out.length;
      walk(n.children, here, depth + 1);
      for (let k = from; k < out.length; k++) row.underIds.push(out[k].boxId);
    });
  };
  for (const lane of boardStructure(live).lanes) walk(lane.items, [], 0);
  return out;
}

/** The sibling groups of the tree, as ordered id lists keyed by parent ('' = the lane's top level, one key per lane). */
export function siblingsOf(boxes: Box[], id: string): { ids: string[]; parent: string | undefined; lane: string } | null {
  for (const lane of boardStructure(liveBoxes(boxes)).lanes) {
    const find = (nodes: OutlineNode[], parent: string | undefined): { ids: string[]; parent: string | undefined; lane: string } | null => {
      if (nodes.some((n) => n.boxId === id)) return { ids: nodes.map((n) => n.boxId), parent, lane: lane.id };
      for (const n of nodes) { const r = find(n.children, n.boxId); if (r) return r; }
      return null;
    };
    const r = find(lane.items, undefined);
    if (r) return r;
  }
  return null;
}

// every box that differs from its old self is stamped, so the newer act wins a sync merge (mergeBoxLists picks the greater changedAt per box)
export function stamped(before: Box[], after: Box[]): Box[] {
  const was = new Map(before.map((b) => [b.id, b]));
  const now = stampNow();
  // a card that only had its object rebuilt (a re-seq to the number it already had) keeps its own stamp: only a real change claims the merge
  const same = (a: Box, b: Box): boolean => {
    const ka = Object.keys(a) as (keyof Box)[];
    return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
  };
  return after.map((b) => { const old = was.get(b.id); return old === b || (old && same(old, b)) ? (old ?? b) : { ...b, updatedAt: now }; });
}

/** Move a row one place up (-1) or down (1) among its siblings. A refused move (the first or last) returns the SAME array. */
export function movePlanRow(boxes: Box[], id: string, dir: -1 | 1): Box[] {
  const sib = siblingsOf(boxes, id);
  if (!sib) return boxes;
  const at = sib.ids.indexOf(id);
  const to = at + dir;
  if (to < 0 || to >= sib.ids.length) return boxes;
  const order = sib.ids.slice();
  [order[at], order[to]] = [order[to], order[at]];
  return stamped(boxes, withSeqOrder(boxes, order));
}

/** Indent a row under the sibling above it (it becomes that row's LAST child). The first of its siblings cannot indent: the same array. */
export function indentPlanRow(boxes: Box[], id: string): Box[] {
  const sib = siblingsOf(boxes, id);
  if (!sib) return boxes;
  const at = sib.ids.indexOf(id);
  if (at <= 0) return boxes;
  const newParent = sib.ids[at - 1];
  const nested = withParent(boxes, id, newParent);
  if (nested === boxes) return boxes;
  // last among its new siblings: after every card already under that parent
  const under = siblingsOf(nested, id);
  if (!under) return stamped(boxes, nested);
  const order = under.ids.filter((x) => x !== id).concat(id);
  return stamped(boxes, withSeqOrder(nested, order));
}

/** Outdent a row to its parent's level, right after that parent. A top-level row cannot: the same array. */
export function outdentPlanRow(boxes: Box[], id: string): Box[] {
  const sib = siblingsOf(boxes, id);
  if (!sib || !sib.parent) return boxes;
  const parent = sib.parent;
  const grand = siblingsOf(boxes, parent);
  const lifted = withParent(boxes, id, grand ? grand.parent : undefined);
  const level = siblingsOf(lifted, id);
  if (!level) return stamped(boxes, lifted);
  const order = level.ids.filter((x) => x !== id);
  order.splice(order.indexOf(parent) + 1, 0, id);
  return stamped(boxes, withSeqOrder(lifted, order));
}

/** Rename a row: its text's first line changes, the rest stays exactly as it was. Null (write nothing) when the typed name is the name it has. */
export function renamePlanRow(boxes: Box[], id: string, typed: string): Box[] | null {
  const b = boxes.find((x) => x.id === id);
  if (!b || b.kind !== 'text') return null;
  const next = outlineTitleEdit(b.text, typed);
  if (next === null) return null;
  const now = stampNow();
  return boxes.map((x) => (x.id === id ? { ...withCardText(x, next), updatedAt: now } : x));
}

/** Add a card to the end of the Plan's top level: a text card the board's own Open view also shows (placed below the lowest card, as a new card is). */
export function addPlanRow(boxes: Box[], title: string, newId: () => string): Box[] {
  const clean = title.replace(/[\r\n]+/g, ' ').trim();
  if (!clean) return boxes;
  const cards = liveBoxes(boxes).filter(isCardBox);
  const maxZ = boxes.reduce((m, b) => Math.max(m, b.z), 0);
  const seqs = cards.map((c) => c.seq).filter((n): n is number => typeof n === 'number');
  const top = boardStructure(liveBoxes(boxes)).lanes[0]?.items ?? [];
  const nextSeq = Math.max(seqs.length ? Math.max(...seqs) : -1, top.length - 1) + 1;
  const lowest = cards.reduce((m, c) => Math.max(m, c.y + c.h), 0.05);
  const card: Box = { id: newId(), kind: 'text', x: 0.05, y: lowest + 0.02, w: 0.3, h: 0.12, z: maxZ + 1, text: clean, seq: nextSeq, updatedAt: stampNow() };
  return boxes.concat([card]);
}

/** The ids of a board's cards in Plan order (the pre-order walk), for a check that reads the order without the DOM. */
export function planOrder(boxes: readonly Box[] | undefined | null): string[] {
  return boardStructure(liveBoxes(boxes)).lanes.flatMap((l) => flattenLane(l));
}
