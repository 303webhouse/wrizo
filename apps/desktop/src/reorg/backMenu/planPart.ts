import { cache } from '../../store/persistence/core';
import { getProject, isAutoSet } from '../../store/persistence';
import { unbornHref } from '../../store/unbornPage';
import { wordCount } from '../../store/wordCount';   // the ONE word counter (the Parts list's own)

// "-> PART" FROM A PLAN ROW (Fable, Nov 20; reorg-plan-v2.md section 3 item 2: "with the tick once that Part has words; reuses 'page born from a step'").
// The model behind the Plan tab's door (BackPlan.tsx), with no screen in it. NOTHING NEW IS SAVED:
//   - the door is W2's "Write this" aimed at the Doc: an UNBORN address (store/unbornPage.ts) naming the Doc, the board, the card and the name the Part will carry; pressing it writes
//     nothing, her first word births the Part as the Doc's last Part (a page in the Doc's set, named in pageSettings.name, a key a Part already has) and in that same act the board's own
//     link record is made (graftTo: aBoxId = the card, bEntryId = the Part), so the row and its Part are never seen apart;
//   - the row's Part is READ from that record: a live page of THIS Doc that the card's record points at. A card linked (from Assets) to a page that is not a Part of this Doc is not a Part
//     of the row;
//   - the TICK is the Part's words (> 0), read at draw, never written. An emptied Part loses its tick, and a Part with only spaces never earns one.

export interface RowPart { id: string; written: boolean }

/** The Doc (a set she made) the page belongs to, or null when the page is loose or in a set the app made (the door then makes it a Doc of its own first: reorg/parts.ts ensureDoc). Read from the cache, never cloned. */
export function docOfPage(pageId: string): string | null {
  const page = cache.journalEntries.find((e) => e.id === pageId && !e.deletedAt);
  const set = page?.projectId ? getProject(page.projectId) : null;
  return set && !isAutoSet(set) ? set.id : null;
}

/** The Part a Plan row points at, if it has one: the first live page of `docId` that the board's own record for this card names. */
export function partOfRow(boardId: string | null, boxId: string, docId: string | null): RowPart | null {
  if (!boardId || !docId) return null;
  const board = cache.journalEntries.find((e) => e.id === boardId && !e.deletedAt);
  for (const l of board?.pageLinks ?? []) {
    if (l.deletedAt || l.aBoxId !== boxId || l.bBoxId) continue;
    const p = cache.journalEntries.find((e) => e.id === l.bEntryId && !e.deletedAt);
    if (!p || p.pageType === 'board' || p.projectId !== docId) continue;
    return { id: p.id, written: wordCount(p.text ?? '') > 0 };   // SCRIPT #5: a screenplay's text is its lines, so a written screenplay Part earns the tick too
  }
  return null;
}

/** The address the "-> Part" door opens: a fresh page in the Doc, for this card, named for the row. Nothing is written by following it until her first word, except from a screenplay (SCRIPT #5): the Part is a screenplay too, and a screenplay is born on arrival. */
export function toPartHref(docId: string, boardId: string, boxId: string, name: string, structure: 'screenplay' | null = null, inText = false): string {
  return unbornHref({ binderId: docId, graft: { boardId, boxId }, partName: name, structure, openText: inText });
}
