// #82 - THE WORDS OF ANOTHER WINDOW, CARRIED INTO EACH STATE OF HER UNDO HISTORY. The other window's change is the one edit that turns `base` (the text this editor last agreed with the record on) into `theirs`:
// the span between their common start and common end. For one of her older states `t` it is made again where that span now sits (the offsets travel through the diff from `base` to `t`, store/textMerge.ts mapCaretThrough):
// inserted there, and the words they replaced are replaced when `t` still holds them. A three-way merge (mergeText) is the wrong tool for this: a word of hers that stands next to theirs is a CONFLICT to it, and it keeps both
// versions of the line, so an Undo of her last word would have written the whole page twice. Pure; the history it serves is store/textUndo.ts's.
import { mapCaretThrough } from './textMerge';

export function throughArrival(base: string, theirs: string): (t: string) => string {
  const m = Math.min(base.length, theirs.length);
  let p = 0;
  while (p < m && base.charCodeAt(p) === theirs.charCodeAt(p)) p += 1;
  let s = 0;
  while (s < m - p && base.charCodeAt(base.length - 1 - s) === theirs.charCodeAt(theirs.length - 1 - s)) s += 1;
  const del = base.slice(p, base.length - s);
  const ins = theirs.slice(p, theirs.length - s);
  return (t: string): string => {
    if (t === base) return theirs;
    const a = Math.max(0, Math.min(t.length, mapCaretThrough(base, t, p)));
    let b = a;
    if (del) {
      const e = Math.max(a, Math.min(t.length, mapCaretThrough(base, t, p + del.length)));
      if (t.slice(a, e) === del) b = e;   // the words they replaced are still there: replaced; else theirs go in beside what she made of them
    }
    return t.slice(0, a) + ins + t.slice(b);
  };
}
