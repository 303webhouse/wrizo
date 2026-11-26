import type { Box, TextMark } from '../types';
import { splitOutlineText } from './outlineRow';

// BOLD, ITALIC, UNDERLINE AND STRIKE ON A CARD'S NOTE (Nick ruled yes, Nov 25, 7:07 pm; Fable's placement): the card's `text` stays PLAIN, so export, counts, copy and the Tutor read it as they always have; the marks sit beside it in
// `textMarks`, ranges of offsets into `text`, inside the board's own `boxes` jsonb (no column). ABSENT on every card that has none. Editing the text keeps a mark on its words, and a mark over deleted text goes with it.
// Pure: no store, no document. An old client that drops the field loses the marks and never a word.

export type MarkKey = 'b' | 'i' | 'u' | 's';
export const MARK_KEYS: readonly MarkKey[] = ['b', 'i', 'u', 's'];

/** Ranges from per-character flags: neighbours with the same marks join; unmarked stretches are left out. */
function compress(flags: number[]): TextMark[] {
  const out: TextMark[] = [];
  for (let i = 0; i < flags.length;) {
    let j = i + 1;
    while (j < flags.length && flags[j] === flags[i]) j++;
    if (flags[i]) {
      const m: TextMark = { start: i, end: j };
      MARK_KEYS.forEach((k, bit) => { if (flags[i] & (1 << bit)) m[k] = true; });
      out.push(m);
    }
    i = j;
  }
  return out;
}
function spread(marks: readonly TextMark[] | undefined, length: number): number[] {
  const flags = new Array<number>(length).fill(0);
  for (const m of marks ?? []) {
    for (let i = Math.max(0, m.start); i < Math.min(length, m.end); i++) MARK_KEYS.forEach((k, bit) => { if (m[k]) flags[i] |= 1 << bit; });
  }
  return flags;
}
const withMarks = (box: Box, marks: TextMark[]): Box => {
  const out: Box = { ...box };
  if (marks.length) out.textMarks = marks; else delete out.textMarks;
  return out;
};

/** Whether every character of [start, end) already wears the mark. */
export function rangeHas(marks: readonly TextMark[] | undefined, start: number, end: number, key: MarkKey): boolean {
  if (end <= start) return false;
  const bit = 1 << MARK_KEYS.indexOf(key);
  return spread(marks, end).slice(start, end).every((f) => (f & bit) !== 0);
}

/** Put the mark on [start, end) of the card's text, or take it off when all of it already has it. The text is not touched. */
export function toggleCardMark(box: Box, start: number, end: number, key: MarkKey): Box {
  const length = (box.text ?? '').length;
  const from = Math.max(0, Math.min(start, end)), to = Math.min(length, Math.max(start, end));
  if (to <= from) return box;
  const bit = 1 << MARK_KEYS.indexOf(key);
  const flags = spread(box.textMarks, length);
  const off = rangeHas(box.textMarks, from, to, key);
  for (let i = from; i < to; i++) flags[i] = off ? flags[i] & ~bit : flags[i] | bit;
  return withMarks(box, compress(flags));
}

/** The marks of `oldText` carried onto `newText`: the one stretch that changed is found from both ends. Text typed inside a marked word joins the mark; text typed right before or after it does not. */
export function remapMarks(oldText: string, newText: string, marks: readonly TextMark[]): TextMark[] {
  let from = 0;
  while (from < oldText.length && from < newText.length && oldText[from] === newText[from]) from++;
  let tail = 0;
  while (tail < oldText.length - from && tail < newText.length - from && oldText[oldText.length - 1 - tail] === newText[newText.length - 1 - tail]) tail++;
  const oldEnd = oldText.length - tail, newEnd = newText.length - tail, delta = newText.length - oldText.length;
  const startAt = (x: number) => (x < from ? x : x >= oldEnd ? x + delta : newEnd);
  const endAt = (x: number) => (x <= from ? x : x >= oldEnd ? x + delta : from);
  return marks.map((m) => ({ ...m, start: startAt(m.start), end: endAt(m.end) })).filter((m) => m.end > m.start);
}

/** A card with new text: its marks stay on their words, and a card that gains a note is no longer "skipped". EVERY place that changes a card's text goes through here. */
export function withCardText(box: Box, next: string): Box {
  const out = box.textMarks ? withMarks(box, remapMarks(box.text ?? '', next, box.textMarks)) : { ...box };
  out.text = next;
  if (splitOutlineText(next).body.trim()) delete out.planSkipped;
  return out;
}

const escape = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TAG: Record<MarkKey, string> = { b: 'strong', i: 'em', u: 'u', s: 's' };

/** The text drawn with its marks. Its textContent is the stored text, character for character; anything that looks like markup stays text. */
export function markedHtml(text: string, marks: readonly TextMark[] | undefined): string {
  const cuts = new Set([0, text.length]);
  for (const m of marks ?? []) { cuts.add(Math.max(0, Math.min(text.length, m.start))); cuts.add(Math.max(0, Math.min(text.length, m.end))); }
  const at = [...cuts].sort((a, b) => a - b);
  let out = '';
  for (let i = 0; i + 1 < at.length; i++) {
    const keys = MARK_KEYS.filter((k) => (marks ?? []).some((m) => m[k] && m.start <= at[i] && m.end >= at[i + 1]));
    out += keys.map((k) => `<${TAG[k]}>`).join('') + escape(text.slice(at[i], at[i + 1])) + keys.slice().reverse().map((k) => `</${TAG[k]}>`).join('');
  }
  return out;
}
