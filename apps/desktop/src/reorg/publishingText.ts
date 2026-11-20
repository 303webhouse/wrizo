// THE WORDS THAT GO OUT (reorg-plan-v2 #5 and #6, Fable Nov 20: "Publishing as a view" and "export the whole Doc or chosen Parts, in order, today's .md and .txt").
// Pure: no store, no React. publishing.ts reads the Parts and hands them here; this file only lays them end to end.
//
//   - The Doc's order, always. The writer chooses WHICH Parts go out; she never re-orders them here (moving a Part is the Parts menu's job, and
//     it is the Doc's order that every reader of the Doc shares).
//   - Every Part's words exactly as today's per-page export gives them (exportPageFiles: md keeps the conventions, txt reads the words).
//   - Nothing is added but a title and a heading for a Part the WRITER named. An unnamed Part reads its own first words in the Parts list; as a
//     heading in a file it would only repeat itself, so it has none.
//   - A Part with no words and no name goes out as nothing.

export type PubFormat = 'md' | 'txt';

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
}

export interface PubText {
  content: string;
  /** how many Parts went out */
  count: number;
}

/** The Parts chosen, in the Doc's own order (`ids` null = every Part). The order of `ids` never matters. */
export function chosenParts(parts: readonly PubPart[], ids: readonly string[] | null): PubPart[] {
  if (!ids) return parts.slice();
  const want = new Set(ids);
  return parts.filter((p) => want.has(p.id));
}

/** One file's text. `title` null: the Doc is one loose page, whose words are the whole document, so nothing is put above them. */
export function publicationText(title: string | null, parts: readonly PubPart[], format: PubFormat, ids: readonly string[] | null): PubText {
  const chosen = chosenParts(parts, ids);
  if (chosen.length === 0) return { content: '', count: 0 };
  const blocks: string[] = [];
  const base = title === null ? 1 : 2;
  if (title !== null) blocks.push(format === 'md' ? `# ${title}` : title);
  for (const p of chosen) {
    const body = (format === 'md' ? p.md : p.txt).replace(/\s+$/, '');
    const name = p.name.trim();
    if (!body && !name) continue;
    if (name) blocks.push(format === 'md' ? `${'#'.repeat(base + Math.max(0, Math.min(2, p.level)))} ${name}` : name);
    if (body) blocks.push(body);
  }
  return { content: blocks.join('\n\n') + '\n', count: chosen.length };
}
