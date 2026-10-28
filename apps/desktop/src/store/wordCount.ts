import { withoutFontMarks } from './markRuns';

/** POLISH #10 item 4 (Fable, Oct 28): the ONE word counter of the app's desktop side. A style span's marks are not words - a span that carries both a face
 *  and a size writes `]{.font-lora .size-14}`, whose inner space would count as one - so the text is read through withoutFontMarks first. The server's
 *  sync counts the same way (apps/server/src/wordCount.ts); scripts/harness/polish10-wordcount.mjs holds the two equal. */
export function wordCount(text: string): number {
  const t = withoutFontMarks(text ?? '').trim();
  return t ? t.split(/\s+/).length : 0;
}
