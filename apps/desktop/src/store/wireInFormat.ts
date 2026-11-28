// #147 - BOLD, ITALIC AND UNDERLINE IN WIRE IN (Nick, Nov 27). Free Write's page is a list of runs, some struck (history, never prose). A mark goes into each unbroken stretch of her own words that the selection touches,
// so a struck run is never moved, marked or lost. Offsets are counted over the unstruck words, as the editor counts a selection. Pure: the formatter is handed in.
import type { Run } from '../types';
import type { FormatAction, FormatResult } from './draftFormat';

export function markSelection(content: Run[], start: number, end: number, action: FormatAction, apply: (text: string, s: number, e: number, a: FormatAction) => FormatResult): { content: Run[]; start: number; end: number } | null {
  if (action !== 'bold' && action !== 'italic' && action !== 'underline') return null;
  const from = Math.min(start, end), to = Math.max(start, end);
  const out: Run[] = [];
  let at = 0;            // her words before this stretch, as they stood
  let grown = 0;         // how much longer the words before it have become
  let newStart: number | null = null, newEnd: number | null = null;
  for (let i = 0; i < content.length;) {
    if (content[i].struck) { out.push(content[i]); i += 1; continue; }
    let j = i;
    let text = '';
    while (j < content.length && !content[j].struck) { text += content[j].text; j += 1; }
    const a = Math.max(from, at) - at, b = Math.min(to, at + text.length) - at;
    if (b > a) {
      const r = apply(text, a, b, action);
      if (r.text !== text) {
        if (newStart === null) newStart = at + grown + r.start;
        newEnd = at + grown + r.end;
        out.push({ ...content[i], text: r.text });
        grown += r.text.length - text.length;
        at += text.length;
        i = j;
        continue;
      }
    }
    for (let k = i; k < j; k += 1) out.push(content[k]);
    at += text.length;
    i = j;
  }
  return newStart === null || newEnd === null ? null : { content: out, start: newStart, end: newEnd };
}
