// PARSER for Downloads\sample-account-content.md (v2). Pure: text in, a plain model out. It reads STRUCTURE only (sections, items, tables, page bodies); every
// decision about what an item BECOMES lives in build-world.mjs. Nothing here touches the app, a database or the network.
//
// Rules applied here (Fable's sample-seed-rules.md): 1 notes in parentheses are DATA, not text - whole-line italic notes `*( ... )*` are dropped from page bodies and a
// leading `(grafted page: X)` / `(page placed: X)` / `(grafted: X)` / `(opening paragraph, 14 pt)` marker is lifted off a card or paragraph and returned as data;
// 2 "the deck's prompt/question(s) stand" => an EMPTY card body (kind: 'empty').
export const CONTENT_MD5 = '4ed60fd143d74f0df5be6c61055c1df2';

const unTick = (s) => s.replace(/^`|`$/g, '');
const stripStars = (s) => s.replace(/^\*+|\*+$/g, '').trim();

/** `Title (a; b; tags: `x`, `y`; **starred**)` -> { title, attrs: [..], tags: [..], starred } from an item heading's text (the `[shows: ...]` tag is dropped). */
export function parseHeading(raw) {
  let h = raw.replace(/\s*`\[shows:.*$/, '').replace(/\s*\[shows:.*$/, '').trim();
  const out = { raw: h, title: '', attrs: [], tags: [], starred: false, notes: [] };
  // the parenthesised attribute group is the LAST top-level (...) in the heading
  const m = /^(.*?)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/.exec(h);
  let head = h; let group = '';
  if (m) { head = m[1]; group = m[2]; }
  const t = /`([^`]+)`/.exec(head) || /\*([^*]+)\*/.exec(head);
  out.title = t ? t[1].trim() : head.replace(/^(The (page|board)|Page:|Journal page,?)\s*/i, '').trim();
  for (const part of group.split(';').map((s) => s.trim()).filter(Boolean)) {
    if (/^tags:/i.test(part)) out.tags.push(...[...part.matchAll(/`([^`]+)`/g)].map((x) => x[1]));
    else if (/\*\*starred\*\*/i.test(part)) out.starred = true;
    else out.attrs.push(part.replace(/\*\*/g, ''));
  }
  if (/\*\*starred\*\*/i.test(group)) out.starred = true;
  return out;
}

/** A markdown table -> rows of cell strings (the separator row is dropped). */
export function parseTable(lines) {
  return lines.filter((l) => /^\|/.test(l)).map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())).filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
}

/** A card cell: lifts a leading `(grafted page: *X*)` style marker, flags "the deck's prompt stands". */
export function parseCardCell(cell) {
  let text = cell.trim();
  const marks = [];
  for (;;) {
    const m = /^\((grafted page|page placed|grafted|grafted from)\s*:\s*([^)]+?)\)\s*/i.exec(text);
    if (!m) break;
    marks.push({ kind: m[1].toLowerCase(), page: m[2].replace(/[*]/g, '').trim() });
    text = text.slice(m[0].length);
  }
  // a trailing marker: "... (page placed: *The kettle scene*)"
  for (;;) {
    const m = /\s*\((page placed|grafted page|grafted)\s*:\s*([^)]+?)\)\s*$/i.exec(text);
    if (!m) break;
    marks.push({ kind: m[1].toLowerCase(), page: m[2].replace(/[*]/g, '').trim() });
    text = text.slice(0, m.index);
  }
  if (/^\*?\s*the deck'?s (foundation )?(prompt|question)s?\b.*stands?/i.test(text.replace(/^\*+|\*+$/g, '').trim()) || /^\*the deck'?s .*stand/i.test(text)) return { kind: 'empty', text: '', marks };
  return { kind: 'text', text: text.trim(), marks };
}

/** Rows of a card table (`| # | title | State | text |`) -> [{ n, title, state, ...cell }]. */
export function parseCardRows(lines) {
  const rows = parseTable(lines);
  if (!rows.length) return [];
  const head = rows[0].map((c) => c.toLowerCase());
  const body = rows.slice(1);
  const iTitle = head.findIndex((c) => /title|card$/.test(c));
  const iState = head.findIndex((c) => c === 'state');
  const iText = head.findIndex((c) => /text/.test(c));
  return body.map((r) => {
    const cell = parseCardCell(r[iText] ?? '');
    const st = iState >= 0 ? stripStars(r[iState] ?? '').toLowerCase() : '';
    return { n: iState >= 0 ? r[0] : null, title: stripStars(r[iTitle] ?? ''), state: st, lit: st === 'lit', ...cell };
  });
}

/** A page body: blank-line separated paragraphs. Drops whole-line italic notes and the `**... word count:**` footers; keeps everything else byte-for-byte. */
export function cleanBody(lines) {
  const out = [];
  for (const l of lines) {
    if (/^\*\*[^*]*word count:?\*\*/i.test(l.trim())) continue;
    if (/^---+\s*$/.test(l)) continue;
    if (/^\*\(.*\)\*\s*$/.test(l.trim())) continue;            // a whole-line italic note: data, not text
    out.push(l.replace(/\s+$/, ''));
  }
  while (out.length && out[0] === '') out.shift();
  while (out.length && out[out.length - 1] === '') out.pop();
  return out;
}

/** Split the file into sections and items. */
export function parseContent(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const sections = [];
  let sec = null; let item = null;
  const push = () => { if (item && sec) sec.items.push(item); item = null; };
  lines.forEach((line, i) => {
    let m;
    if ((m = /^## (\d+)\.\s*(.*)$/.exec(line))) { push(); sec = { n: Number(m[1]), heading: m[2], items: [], pre: [] }; sections.push(sec); return; }
    if (!sec) return;
    if ((m = /^(#{3,4}) (.*)$/.exec(line))) { push(); item = { level: m[1].length, no: ((/^(\d+(?:\.\d+)?[a-z]?)\s/.exec(m[2])) || [])[1] ?? null, heading: m[2], line: i + 1, body: [] }; return; }
    if ((m = /^\*\*(Board|Boards?):?\s*`([^`]+)`.*$/.exec(line)) && /dealt from/i.test(line) && item) {
      // a sub-board inside a section (1.7, 3.8, 4.8): a bold line starts its own item
      push(); item = { level: 5, no: null, heading: line.replace(/^\*\*|\*\*.*$/g, '').replace(/\*\*/g, ''), rawLine: line, line: i + 1, body: [], sub: true }; return;
    }
    (item ? item.body : sec.pre).push(line);
  });
  push();
  return sections;
}
