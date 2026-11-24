import type { ScriptEl } from '../../types';

// SCRIPT #4: undo and redo across the whole script. Each line is its own short-lived editor, so the browser's undo stops at the edge of a line; this history holds the page's lines
// instead. It lives in memory for as long as the page is open and saves nothing. A step is a reference to the page's immutable line array, so a step costs one array of pointers.
//
// WHAT IS ONE STEP. A run of typing in one line, in one direction, with no pause and no caret move, is one step. Enter, Tab, a join, a retype and an autocomplete are one step each.
// The capitals and (CONT'D) a line takes on being left belong to the typing before them, so they are never a step of their own.

const MAX_STEPS = 300;
const TYPING_PAUSE_MS = 1000;

export interface ScriptSnap { elements: ScriptEl[]; activeId: string | null; caret: number }

export interface ScriptHistory {
  past: ScriptSnap[];
  present: ScriptSnap;
  future: ScriptSnap[];
  typing: { id: string; dir: number; at: number } | null;
}

export function createHistory(elements: ScriptEl[], activeId: string | null, caret: number): ScriptHistory {
  return { past: [], present: { elements, activeId, caret }, future: [], typing: null };
}

/** What a set of lines says, without their ids: two copies of a script compare equal when every line has the same type and words. */
export const linesKey = (elements: ScriptEl[]): string => elements.map((el) => `${el.t}\u0001${el.text}`).join('\u0002');

function advance(h: ScriptHistory, next: ScriptSnap): void {
  h.past.push(h.present);
  if (h.past.length > MAX_STEPS) h.past.shift();
  h.present = next;
  h.future = [];
}

// True when `next` holds the same lines, or differs only in the words of the line just left (what leaving a line does to it).
function sameOrCommitted(p: ScriptSnap, next: ScriptEl[], activeId: string | null): boolean {
  if (next.length !== p.elements.length) return false;
  for (let i = 0; i < next.length; i++) {
    const a = p.elements[i], b = next[i];
    if (a === b) continue;
    if (a.id !== b.id || a.t !== b.t) return false;
    if (a.text !== b.text && (a.id !== p.activeId || activeId === p.activeId)) return false;
  }
  return true;
}

/** The page's lines or active line changed. `typed` says this change came from a key typed into the live line, which is read without walking the script. */
export function noteChange(h: ScriptHistory, next: ScriptEl[], activeIndex: number, caret: number, typed: boolean, now: number): void {
  const p = h.present;
  const activeId = next[activeIndex]?.id ?? null;
  if (next === p.elements) { p.activeId = activeId; p.caret = caret; return; }
  if (typed) {
    const before = p.elements[activeIndex], after = next[activeIndex];
    const oneLine = next.length === p.elements.length && !!before && !!after && before.id === after.id && before.t === after.t;
    const delta = oneLine ? after.text.length - before.text.length : 0;
    const single = delta === 1 || delta === -1;
    const run = h.typing;
    if (single && run && run.id === after.id && run.dir === delta && now - run.at < TYPING_PAUSE_MS) {
      p.elements = next; p.activeId = activeId; p.caret = caret; run.at = now;
      return;
    }
    advance(h, { elements: next, activeId, caret });
    h.typing = single ? { id: after.id, dir: delta, at: now } : null;
    return;
  }
  h.typing = null;
  if (sameOrCommitted(p, next, activeId)) { p.elements = next; p.activeId = activeId; p.caret = caret; return; }
  advance(h, { elements: next, activeId, caret });
}

/** A key went down with the caret here. A caret that is not where the last typed key left it ends the run of typing. */
export function noteKeyCaret(h: ScriptHistory, activeId: string, offset: number): void {
  if (h.typing && (h.typing.id !== activeId || offset !== h.present.caret)) h.typing = null;
  h.present.activeId = activeId;
  h.present.caret = offset;
}

export function stepBack(h: ScriptHistory): ScriptSnap | null {
  const to = h.past.pop();
  if (!to) return null;
  h.future.push(h.present);
  h.present = to;
  h.typing = null;
  return to;
}

export function stepForward(h: ScriptHistory): ScriptSnap | null {
  const to = h.future.pop();
  if (!to) return null;
  h.past.push(h.present);
  h.present = to;
  h.typing = null;
  return to;
}
