// The server's word count (users.words_written, the theme thresholds). POLISH #10 item 4 (Fable, Oct 28): a style span's marks are not words. A span that
// carries both a face and a size writes `]{.font-lora .size-14}` - its inner space would count as one - so every closing mark is taken out before counting.
// This holds the same count as the desktop's store/wordCount.ts (withoutFontMarks, then whitespace-run tokens); scripts/harness/polish10-wordcount.mjs runs
// the two over one corpus and fails if they differ. (The apps share no module, so the grammar is stated here once more: store/markRuns.ts FONT_CLASS / SIZE_CLASS.)
const CLASS = String.raw`\.font-[a-z0-9]+(?:-[a-z0-9]+)*|\.size-\d{1,3}(?:\.5)?`;
const CLOSE_MARK = new RegExp(String.raw`(?<![\x5c])\]\{(?:${CLASS})(?: (?:${CLASS}))?\}`, 'g');

// A footnote is not her words (Nick, Nov 21): the note lines at the END of the text ("[^1]: the note", blank lines between) and the [^1] markers are left out, as the desktop's
// reorg/footnotes.ts wordsOnly does (polish10-wordcount.mjs holds the two equal; the shape is stated here once more, the apps share no module).
const NOTE_LINE = /^\[\^[\w-]+\]: ?.*$/;
const MARKER = /(?<![\x5c])\[\^[\w-]+\]/g;
function withoutNotes(text: string): string {
  const lines = text.split('\n');
  let j = lines.length - 1;
  while (j >= 0 && (/^\s*$/.test(lines[j]) || NOTE_LINE.test(lines[j]))) j -= 1;
  let start = j + 1;
  while (start < lines.length && !NOTE_LINE.test(lines[start])) start += 1;
  if (start >= lines.length) return text;
  let end = start;
  while (end > 0 && /^\s*$/.test(lines[end - 1])) end -= 1;
  return lines.slice(0, end).join('\n');
}

export function wordCount(text: unknown): number {
  const m = withoutNotes((typeof text === 'string' ? text : '').replace(CLOSE_MARK, '')).replace(MARKER, '').trim().match(/\S+/g);
  return m ? m.length : 0;
}
