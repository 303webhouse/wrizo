// THE WORDS THAT GO OUT (reorg-plan-v2 #5 and #6, Fable Nov 20: "Publishing as a view" and "export the whole Doc or chosen Parts, in order, today's .md and .txt"; and, the same day at 1:27 pm,
// "Export > Web (HTML) beside Markdown and Plain Text").
// Pure: no store, no React. publishing.ts reads the Parts and hands them here; this file only lays them end to end.
//
//   - The Doc's order, always. The writer chooses WHICH Parts go out; she never re-orders them here (moving a Part is the Parts menu's job, and
//     it is the Doc's order that every reader of the Doc shares).
//   - Every Part's words exactly as today's per-page export gives them (exportPageFiles: md keeps the conventions, txt reads the words); html is the same words as the view
//     draws them, as web markup.
//   - Nothing is added but a title and a heading for a Part the WRITER named. An unnamed Part reads its own first words in the Parts list; as a
//     heading in a file it would only repeat itself, so it has none.
//   - A Part with no words and no name goes out as nothing.

export type PubFormat = 'md' | 'txt' | 'html';

/** One note a Part carries (reorg/footnotes.ts), already written for each format; `endnote` notes go to the Doc's end, the rest to the Part's end. */
export interface PubNote { label: string; endnote: boolean; md: string; txt: string; html: string }

export interface PubPart {
  id: string;
  /** the writer's own name for the Part; '' when she gave none */
  name: string;
  /** 0 to 2: how far under the Part above it sits (the level as DRAWN) */
  level: number;
  /** the Part's words as a .md file carries them */
  md: string;
  /** the Part's words as a .txt file carries them */
  txt: string;
  /** the Part's words as web markup (the page's own marks collapsed, as the view draws them) */
  html: string;
  /** the notes this Part carries; the words hold noteMarker(label) where each was cited. Absent: none (a Part with no notes goes out exactly as it always did) */
  notes?: readonly PubNote[];
}

export interface PubText {
  content: string;
  /** how many Parts went out */
  count: number;
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// FOOTNOTES AND ENDNOTES (Nick ruled A, Nov 21; reorg/footnotes.ts): the Part's words carry a private marker where a [^label] stood (the page's own label is only its own: two Parts may both have a [^1]), and this file numbers them
// for the Doc as it goes out - footnotes 1, 2, 3 in the order they are cited across the chosen Parts, endnotes i, ii, iii - then lays each footnote at its Part's end and every endnote at the Doc's end.
const NOTE_OPEN = '\u0001', NOTE_CLOSE = '\u0002';
/** The private marker a Part's words carry where `[^label]` stood. */
export const noteMarker = (label: string): string => NOTE_OPEN + label + NOTE_CLOSE;
const NOTE_MARKER = /\u0001([\w-]+)\u0002/g;
const roman = (n: number): string => { const T: Array<[number, string]> = [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]; let r = ''; let k = n; for (const [v, s] of T) while (k >= v) { r += s; k -= v; } return r; };

/** One Part's words with its markers numbered, and its notes as lines: `foot` for its own end, `end` for the Doc's end. `counters` run across the Parts; `first` remembers which labels already carry an id (web). */
function layNotes(p: PubPart, format: PubFormat, counters: { fn: number; en: number }, first: Set<string>): { body: string; foot: string[]; end: string[] } {
  const raw = format === 'md' ? p.md : format === 'html' ? p.html : p.txt;
  const notes = p.notes ?? [];
  if (notes.length === 0) return { body: raw, foot: [], end: [] };
  const nums = new Map<string, { n: number; end: boolean; note: PubNote }>();
  const give = (note: PubNote): void => {
    if (nums.has(note.label)) return;
    const end = note.endnote;
    const n = end ? ++counters.en : ++counters.fn;
    nums.set(note.label, { n, end, note });
  };
  for (const m of raw.matchAll(NOTE_MARKER)) { const note = notes.find((x) => x.label === m[1]); if (note) give(note); }
  for (const note of notes) give(note);
  const lab = (x: { n: number; end: boolean }): string => (x.end ? roman(x.n) : String(x.n));
  const body = raw.replace(NOTE_MARKER, (_m, l: string) => {
    const x = nums.get(l);
    if (!x) return '';
    const k = lab(x);
    if (format === 'md') return `[^${k}]`;
    if (format === 'txt') return `[${k}]`;
    const key = (x.end ? 'en' : 'fn') + k;
    const id = first.has(key) ? '' : ` id="${x.end ? 'enref' : 'fnref'}-${k}"`;
    first.add(key);
    return `<sup${id}><a href="#${x.end ? 'en' : 'fn'}-${k}">${k}</a></sup>`;
  });
  const foot: string[] = [], end: string[] = [];
  for (const x of [...nums.values()].sort((a, b) => a.n - b.n)) {
    const k = lab(x), nt = x.note;
    const line = format === 'md' ? `[^${k}]: ${nt.md}` : format === 'txt' ? `[${k}] ${nt.txt}`
      : `<p class="note" id="${x.end ? 'en' : 'fn'}-${k}"><sup>${k}</sup> ${nt.html} <a href="#${x.end ? 'enref' : 'fnref'}-${k}">\u21a9</a></p>`;
    (x.end ? end : foot).push(line);
  }
  return { body, foot, end };
}

/** The web page for a fragment: whole (doctype, charset, title), one plain readable style, nothing from the app. */
export function wrapHtml(title: string, body: string): string {
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${esc(title)}</title>\n<style>body{max-width:40em;margin:2.5em auto;padding:0 1.25em;font:1.1rem/1.65 Georgia,'Times New Roman',serif;color:#1b1d1f;background:#fff}h1,h2,h3,h4{line-height:1.25}p{margin:0 0 1em}</style>\n</head>\n<body>\n${body}</body>\n</html>\n`;
}

/** The Parts chosen, in the Doc's own order (`ids` null = every Part). The order of `ids` never matters. */
export function chosenParts(parts: readonly PubPart[], ids: readonly string[] | null): PubPart[] {
  if (!ids) return parts.slice();
  const want = new Set(ids);
  return parts.filter((p) => want.has(p.id));
}

/** THE PLAN, WHEN SHE TICKS "Include the Plan" (reorg-plan-v2 item 5a; stage menus L4): her own rows in her own order, as an outline. Opt-in: the caller passes it only when she has ticked it. */
export interface PubPlanRow { number: string; depth: number; title: string }
export interface PubPlan { label: string; rows: PubPlanRow[] }

function planBlock(plan: PubPlan, format: PubFormat): string {
  const rows = plan.rows;
  if (format === 'md') return rows.map((r) => `${'  '.repeat(r.depth)}- ${r.number} ${r.title}`).join('\n');
  if (format === 'html') return '<ul>\n' + rows.map((r) => `<li style="margin-left:${r.depth * 1.5}em">${esc(`${r.number} ${r.title}`)}</li>`).join('\n') + '\n</ul>';
  return rows.map((r) => `${'  '.repeat(r.depth)}${r.number} ${r.title}`).join('\n');
}

/** One file's text. `title` null: the Doc is one loose page, whose words are the whole document, so nothing is put above them. For html this is the fragment (wrapHtml makes the page).
 *  `plan`, when given with rows, goes after the title and before the first Part, under a heading of the Parts' own level; with no Part chosen nothing goes out, the Plan included. */
export function publicationText(title: string | null, parts: readonly PubPart[], format: PubFormat, ids: readonly string[] | null, plan?: PubPlan | null): PubText {
  const chosen = chosenParts(parts, ids);
  if (chosen.length === 0) return { content: '', count: 0 };
  const blocks: string[] = [];
  const base = title === null ? 1 : 2;
  const head = (name: string, level: number): string => (format === 'md' ? `${'#'.repeat(level)} ${name}` : format === 'html' ? `<h${level}>${esc(name)}</h${level}>` : name);
  if (title !== null) blocks.push(head(title, 1));
  if (plan && plan.rows.length > 0) blocks.push(head(plan.label, base), planBlock(plan, format));
  const counters = { fn: 0, en: 0 };
  const first = new Set<string>();
  const ends: string[] = [];
  for (const p of chosen) {
    const laid = layNotes(p, format, counters, first);
    const body = laid.body.replace(/\s+$/, '');
    ends.push(...laid.end);
    const name = p.name.trim();
    if (!body && !name && laid.foot.length === 0) continue;
    if (name) blocks.push(head(name, base + Math.max(0, Math.min(2, p.level))));
    if (body) blocks.push(body);
    if (laid.foot.length > 0) blocks.push(laid.foot.join('\n'));
  }
  if (ends.length > 0) blocks.push(ends.join('\n'));
  return { content: blocks.join(format === 'html' ? '\n' : '\n\n') + '\n', count: chosen.length };
}
