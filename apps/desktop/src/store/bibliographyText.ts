import { stripMarkdownConventions } from './draftFormat';

// PAGE TEMPLATES, S1 (docs/plans/page-templates.md §1) - THE BIBLIOGRAPHY'S TEXT.
//
// A Bibliography page's `entry.text` is one entry per line (a line the editor soft-wraps is still one line). A title is
// `*italic*`, which the page dialect already supports, so the formatting needs no new syntax. The hanging indent and the gap
// between entries are the lens's CSS and are not in the text. This module is pure; it only decides what a downloaded file or a
// copy says.
//
// An exported file puts a blank line between entries: in Markdown consecutive lines would otherwise merge into one paragraph,
// and a `.txt` entry per paragraph reads as a list. Italics stay in `.md` and are stripped in `.txt` by the existing reader.

/** The entries: every non-blank line, in order. */
export function bibliographyEntries(text: string): string[] {
  return (text ?? '').split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim().length > 0);
}

export function bibliographyBody(text: string, form: 'plain' | 'formatted'): string {
  const entries = bibliographyEntries(text);
  return (form === 'plain' ? entries.map((e) => stripMarkdownConventions(e)) : entries).join('\n\n');
}
