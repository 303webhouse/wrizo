// BEFORE YOU EXPORT, THE RULES (reorg-plan-v2, INK queue item 4; the stage menus, F4, Nick's ruling Nov 20: "the Wrizors' list"). PURE: no store, no DOM; the Back menu's tab (BeforeExport.tsx) feeds it what the
// publishing sheet shows and draws the answer. It reads, it never writes.
//   BLOCKS the export (only what makes it impossible): no Part ticked to go out. (The second block in the list, "for Send to Read: not signed in, or no connection", waits for Read: there is no Send to Read.)
//   ANNOUNCES, and never blocks (each line a count she can press to jump to it): the Parts that go out with no words.
// NOT BUILT, because the data they need does not exist yet (each waits on a ruling, none is faked here):
//   - possible grammar or spelling issues left: the page's check is the browser's own and no count of it can be read back;
//   - Plan rows never attached to a Part: no row is stored as attached to a Part yet (the "→ Part" act, FIX's);
//   - quotations with no source filled in: a quotation ("> ") has no place to hold a source (citations are a later bet);
// BUILT since: the assets she chose to attach (item 5b, A4) are a reminder of what is going out, a count beside the notes; they never block and never announce a problem.
// A line is added here when its data lands: `notes` is a list, in the stage menus' order, for that.

/** One Part as the publishing sheet draws it: the facts this reads. */
export interface BxPart { id: string; n: number; heading: string; empty: boolean }

export type BxBlock = { kind: 'noneTicked' };
export type BxNote = { kind: 'emptyParts'; count: number; partIds: string[] };
export interface BxResult { blocked: boolean; blocks: BxBlock[]; notes: BxNote[]; /** the assets she ticked to attach (a reminder, never a problem) */ attached: number }

/** `off` is the set of Parts ticked OUT. A Doc of one Part has no ticks (it always goes out); a Doc of none has nothing to block. */
export function beforeExport(parts: readonly BxPart[], off: ReadonlySet<string>, attached = 0): BxResult {
  const many = parts.length > 1;
  const going = many ? parts.filter((p) => !off.has(p.id)) : parts.slice();
  const blocks: BxBlock[] = [];
  if (parts.length > 1 && going.length === 0) blocks.push({ kind: 'noneTicked' });
  const notes: BxNote[] = [];
  // only the Parts that go out: an empty Part she ticked out is not in the way of anything
  const empties = going.filter((p) => p.empty);
  if (empties.length > 0) notes.push({ kind: 'emptyParts', count: empties.length, partIds: empties.map((p) => p.id) });
  const blocked = blocks.length > 0;
  return { blocked, blocks, notes, attached: blocks.length > 0 ? 0 : Math.max(0, Math.trunc(attached)) };
}
