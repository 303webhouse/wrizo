import type { Box } from '../../types';
import { withSeqOrder } from '../../store/boardStructure';
import { splitOutlineText } from '../../store/outlineRow';
import { toggleCardMark, withCardText, type MarkKey } from '../../store/textMarks';
import { addPlanRow, siblingsOf, stamped } from '../backMenu/planOps';

// THE WALK'S WRITES, PURE (over a board's boxes). Each returns the SAME array when there is nothing to write, and stamps `updatedAt` on every card it changes so the newer act wins a sync merge.
// Rename, move up and move down are the Plan tab's own (planOps.ts): the walk and the Plan can never disagree.

const now = (): string => new Date().toISOString();
const one = (boxes: Box[], id: string, fn: (b: Box) => Box): Box[] => {
  const at = boxes.findIndex((b) => b.id === id && b.kind === 'text');
  if (at < 0) return boxes;
  const next = fn(boxes[at]);
  if (next === boxes[at]) return boxes;
  return boxes.map((b, i) => (i === at ? { ...next, updatedAt: now() } : b));
};

/** Her note on a step: the card's text under its name. The name is never touched; an empty note leaves the name alone. */
export function setStepNote(boxes: Box[], id: string, note: string): Box[] {
  return one(boxes, id, (b) => {
    const { title } = splitOutlineText(b.text);
    const text = note ? `${title}\n${note}` : title;
    return text === (b.text ?? '') ? b : withCardText(b, text);
  });
}

/** Bold, italic, underline or strike on [start, end) of her NOTE. */
export function toggleStepMark(boxes: Box[], id: string, start: number, end: number, key: MarkKey): Box[] {
  return one(boxes, id, (b) => {
    const from = splitOutlineText(b.text).title.length + 1;
    return toggleCardMark(b, from + start, from + end, key);
  });
}

/** "Skip" (only on a step with no note) and "Not skipped" (the key is REMOVED: there is one way to be not skipped). */
export function setStepSkipped(boxes: Box[], id: string, on: boolean): Box[] {
  const card = boxes.find((x) => x.id === id);
  if (!card) return boxes;
  if (on && splitOutlineText(card.text).body.trim()) return boxes;
  return one(boxes, id, (b) => {
    if (on === !!b.planSkipped) return b;
    if (on) return { ...b, planSkipped: true as const };
    const { planSkipped: _p, ...rest } = b; void _p;
    return rest as Box;
  });
}

/** A new step right after this one, under the same heading. */
export function addStepAfter(boxes: Box[], afterId: string, title: string, newId: () => string): Box[] {
  const after = boxes.find((b) => b.id === afterId);
  const sib = after ? siblingsOf(boxes, afterId) : null;
  if (!after || !sib) return boxes;
  const id = newId();
  const card: Box = {
    id, kind: 'text', x: after.x, y: after.y + after.h + 0.02, w: 0.3, h: 0.12, z: boxes.reduce((m, b) => Math.max(m, b.z), 0) + 1, text: title, updatedAt: now(),
    ...(after.parentId ? { parentId: after.parentId } : {}),
    ...(after.laneId ? { laneId: after.laneId } : {}),
  };
  const order = sib.ids.slice();
  order.splice(order.indexOf(afterId) + 1, 0, id);
  const all = boxes.concat([card]);
  return stamped(all, withSeqOrder(all, order));
}

/** "+ Add a step at the end": after the last step there is (under its heading); a Plan with no step gets an ordinary row. */
export function addStepAtEnd(boxes: Box[], title: string, newId: () => string, lastStepId: string | null): Box[] {
  return lastStepId ? addStepAfter(boxes, lastStepId, title, newId) : addPlanRow(boxes, title, newId);
}
