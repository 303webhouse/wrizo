import { withoutFontMarks } from './markRuns';

// the ONE word counter: text is read through withoutFontMarks first (a span's inner space would count); the server counts the same way (polish10-wordcount.mjs holds them equal) [wordCount §1]
// #85: the page asks for its word count several times in one render (the instrument, the stage, the strip), each time over the whole page text; the answer for the text just counted is kept, so the repeats cost nothing (still one counter: this one)
let lastText: string | null = null;
let lastCount = 0;
export function wordCount(text: string): number {
  if (text === lastText) return lastCount;
  const t = withoutFontMarks(text ?? '').trim();
  const n = t ? t.split(/\s+/).length : 0;
  lastText = text;
  lastCount = n;
  return n;
}
