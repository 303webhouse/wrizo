import { withoutFontMarks } from './markRuns';

// the ONE word counter: text is read through withoutFontMarks first (a span's inner space would count); the server counts the same way (polish10-wordcount.mjs holds them equal) [wordCount §1]
export function wordCount(text: string): number {
  const t = withoutFontMarks(text ?? '').trim();
  return t ? t.split(/\s+/).length : 0;
}
