import { readEscapes, readLead, readMarks, closeMark, type MarkRun } from '../store/markRuns';

// THE PAGE'S WORDS AS WEB MARKUP, FOR A FILE AND THE CLIPBOARD (Fable, Nov 20, 1:27 pm: "Export > Web (HTML)" and "Copy as Formatted"). Pure: no store, no React.
// The app's own on-screen markup (store/draftDecoration.ts) is built to be painted by the app's stylesheet (its marks are hidden by a class, its bold is a class), so it means nothing outside the
// app. This turns the page's conventions into plain semantic HTML that reads the same anywhere: the SAME readers the page paints from (store/markRuns.ts readLead, readMarks, readEscapes), so
// "2 * 3 * 4" stays as it shows, a typed `\*` is the character, and no marker is ever left in the text.
//   bold <strong>, italic <em>, underline <u>, strike <s>, superscript <sup>, subscript <sub>, a size span <span style="font-size:Npt">; # headings <h1>..<h6>; "> " a <blockquote>; "- " a <ul>; "><" and ">>" align;
//   ">| " a block indent; a leading tab a first-line indent; lines of one paragraph are joined by <br>; a blank line ends a paragraph.

const escH = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const OPEN: Record<string, string> = { bold: '<strong>', italic: '<em>', underline: '<u>', strike: '<s>', sup: '<sup>', sub: '<sub>' };
const CLOSE: Record<string, string> = { bold: '</strong>', italic: '</em>', underline: '</u>', strike: '</s>', sup: '</sup>', sub: '</sub>' };
const openTag = (r: MarkRun): string => (r.kind === 'font' ? (r.points != null ? `<span style="font-size:${r.points}pt">` : '<span>') : OPEN[r.kind]);
const closeTag = (r: MarkRun): string => (r.kind === 'font' ? '</span>' : CLOSE[r.kind]);

/** One line's words (its structure already taken off) as inline markup: the runs the reader accepts become tags; every marker and escape backslash is gone; everything else is escaped text. */
export function inlineHtml(rest: string): string {
  const runs = readMarks(rest);
  const opens = new Map<number, MarkRun>(), closes = new Map<number, MarkRun>();
  for (const r of runs) { opens.set(r.open, r); closes.set(r.close, r); }
  const escapes = new Set(readEscapes(rest));
  let out = '';
  for (let i = 0; i < rest.length;) {
    const c = closes.get(i);
    if (c) { out += closeTag(c); i += closeMark(c).length; continue; }
    const o = opens.get(i);
    if (o) { out += openTag(o); i += o.mark.length; continue; }
    if (!escapes.has(i)) out += escH(rest[i]);
    i += 1;
  }
  return out;
}

interface Block { kind: 'p' | 'h' | 'li'; key: string; quote: boolean; style: string; level: number; html: string; marker: string }

/** The page's text as web markup, block by block. Empty text: an empty string. */
export function markdownToHtml(text: string): string {
  const blocks: Block[] = [];
  let gap = true;   // a blank line (or the start) ends the paragraph before it
  for (const line of text.split('\n')) {
    const lead = readLead(line);
    const rest = line.slice(lead.length).replace(/\r$/, '');
    if (!rest.trim() && lead.tokens.every((t) => t.kind === 'tab')) { gap = true; continue; }
    let tabs = 0, block = 0, align = '', quote = false, level = 0, marker = '';
    let kind: Block['kind'] = 'p';
    for (const t of lead.tokens) {
      if (t.kind === 'tab') tabs += t.text.length;
      else if (t.kind === 'block') block += 1;
      else if (t.kind === 'align-center') align = 'center';
      else if (t.kind === 'align-right') align = 'right';
      else if (t.kind === 'quote') quote = true;
      else if (t.kind === 'heading') { kind = 'h'; level = Math.max(1, Math.min(6, t.text.trim().length)); }
      else if (t.kind === 'bullet' || t.kind === 'bullet-circle' || t.kind === 'bullet-square') { if (kind !== 'h') kind = 'li'; marker = t.kind === 'bullet-circle' ? 'circle' : t.kind === 'bullet-square' ? 'square' : ''; }
    }
    const style = [align ? `text-align:${align}` : '', block ? `margin-left:${block * 2}em` : '', tabs ? `text-indent:${tabs * 2}em` : '', marker ? `list-style-type:${marker}` : ''].filter(Boolean).join(';');
    const key = `${kind}|${quote ? 'q' : ''}|${style}|${kind === 'h' ? level : ''}`;
    const prev = blocks[blocks.length - 1];
    const html = inlineHtml(rest);
    // consecutive lines of one kind and one look are one paragraph (their lines joined by a break), one list, or one quote; a heading is always alone
    if (!gap && prev && prev.key === key && kind === 'p') prev.html += `<br>\n${html}`;
    else blocks.push({ kind, key, quote, style, level, html, marker });
    gap = false;
  }
  const out: string[] = [];
  const attr = (b: Block) => (b.style ? ` style="${b.style}"` : '');
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    let html: string;
    if (b.kind === 'h') html = `<h${b.level}${attr(b)}>${b.html}</h${b.level}>`;
    else if (b.kind === 'li') {
      const items = [b];
      while (blocks[i + 1] && blocks[i + 1].kind === 'li' && blocks[i + 1].key === b.key) items.push(blocks[++i]);
      html = `<ul${attr(b)}>${items.map((x) => `<li>${x.html}</li>`).join('')}</ul>`;
    } else html = `<p${attr(b)}>${b.html}</p>`;
    if (b.quote) {
      // quote lines of one look are one quote
      html = `<blockquote>${html}</blockquote>`;
    }
    out.push(html);
  }
  return out.join('\n');
}

/** Text that is not prose (a screenplay, a board's cards, a template page): its plain words, escaped, lines kept. */
export function plainToHtml(text: string): string {
  const t = text.replace(/\s+$/, '');
  return t ? `<p>${escH(t).split('\n').join('<br>\n')}</p>` : '';
}
