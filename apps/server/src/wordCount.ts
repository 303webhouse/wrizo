// The server's word count (users.words_written, the theme thresholds). POLISH #10 item 4 (Fable, Oct 28): a style span's marks are not words. A span that
// carries both a face and a size writes `]{.font-lora .size-14}` - its inner space would count as one - so every closing mark is taken out before counting.
// This holds the same count as the desktop's store/wordCount.ts (withoutFontMarks, then whitespace-run tokens); scripts/harness/polish10-wordcount.mjs runs
// the two over one corpus and fails if they differ. (The apps share no module, so the grammar is stated here once more: store/markRuns.ts FONT_CLASS / SIZE_CLASS.)
const CLASS = String.raw`\.font-[a-z0-9]+(?:-[a-z0-9]+)*|\.size-\d{1,3}(?:\.5)?`;
const CLOSE_MARK = new RegExp(String.raw`(?<![\x5c])\]\{(?:${CLASS})(?: (?:${CLASS}))?\}`, 'g');

export function wordCount(text: unknown): number {
  const m = (typeof text === 'string' ? text : '').replace(CLOSE_MARK, '').trim().match(/\S+/g);
  return m ? m.length : 0;
}
