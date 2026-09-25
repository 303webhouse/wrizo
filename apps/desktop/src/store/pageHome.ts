import type { JournalEntry, Project } from '../types';
import { inJournalView, getProject } from './persistence';
import { deskTerm } from './deskLexicon';

// ITEM 163 — THE LOCATION LINE SAYS "IN", AND IT SAYS IT IN ONE PLACE.
//
// Nick read "BOARD #2 / TEST BOARD" as a subtitle, because a bare name is a
// subtitle: nothing in it says TEST BOARD is the DRAWER the board lives in.
// Ruled: **the second line takes the CAPTION FORM, "in TEST BOARD."**
// WIDENED to the canvas board-card, *"same swap, same lexicon term."*
//
// ⛔ AND IT IS ONE READER, WHICH IS 131(a)'s SHAPE — *fix the class.* Before
// this, the same fact was spelled THREE times in two files: `drawerNameFor`
// (the Plan panel's board ROW, bare), `drawerCaptionFor` (the zone's CAPTION,
// already "in <drawer>") and `boardDrawerLine` (the canvas BOARD-CARD, bare).
// Two of the three were already wrong and the third was already right, which is
// exactly what three copies of one rule produce. Fixing them in place would have
// left three copies to drift again, so they are now three callers of this.
//
// It is the same lesson PW1's own errata earned with `getBoardsConnecting`: one
// NAMED READER, never the same rule re-expressed at each call site.
//
// ⚠ THE SCOPE IS DRAWER-NAMING LINES ONLY (ratified). The other two forms this
// second line can take are NOT touched and must not be:
//   · `cascadePlanRelationOwn` — the page's OWN plan board. A relation, not a
//     location; prefixing it with "in" would make it a lie.
//   · `cascadePlanNoDrawer` ("Not in a drawer") — it says there is NO drawer, so
//     "in Not in a drawer" would be nonsense. A board with no drawer says so
//     rather than borrowing a name.
// A harness must assert those two BY NAME, or it could pass on their ABSENCE
// while claiming the swap was scoped.
export function boardDrawerLine(board: JournalEntry): string {
  const name = board.projectId ? (getProject(board.projectId)?.title || 'Untitled') : null;
  return name ? `${deskTerm('cascadePlanCaptionIn')} ${name}` : deskTerm('cascadePlanNoDrawer');
}

// AB3 S2/S5 — "Where it lives," told truthfully. Shared by the Page face on
// both JournalEntry.tsx and PageEditor.tsx so the two hosts can't drift.
// S5: a page's Journal membership is independent of its current home — a
// filed or shelved journal-origin page tells BOTH truths (the primary home
// line, plus "Also in the Journal."). The loose-origin door reads its own
// canon line verbatim ("Loose — belongs nowhere yet").
//
// AB4 S2 — `pinnedBoardTitles` (optional, defaults to none — every existing
// call site stays valid unchanged): one truthful membership line PER board
// the page is pinned to, via `deskTerm` (this is a plain function, not a
// hook, so it uses the same non-hook lexicon escape hatch CascadePanels.tsx's
// own `buildSurvey` already relies on — see deskLexicon.ts's header comment).
//
// B2 S3/S7 — a genuine defect found and fixed while retiring the `shelved`
// UI read/write: this function's OWN `entry.shelved` branch is retired
// (the flag is dormant now, never read here either — T3, not a flag,
// decides the Shelf), and its fallback for "no project, not the Journal"
// used to be an UNCONDITIONAL "In the Journal" — flatly wrong for a
// 'project'-origin page that has since been un-filed (reachable for the
// first time via S4's own Places panel, but latent before this ticket
// too: any "file to Shelf" act on a project-origin page already produced
// this exact shape, just papered over by `shelved` happening to read true
// in the one case the old UI could reach). The fix: fall through to
// inJournalView's OWN pinned-law verdict — one truth, not a second
// hand-rolled re-derivation of it — rather than special-casing origins by
// hand. Every existing call site (JournalEntry.tsx, PageEditor.tsx,
// BoardEditor.tsx, ScriptEditor.tsx) is untouched; only what this function
// itself decides changes.
export function describePageHome(entry: JournalEntry, project: Project | null, pinnedBoardTitles: string[] = []): { homeLabel: string; memberships: string[] } {
  let homeLabel: string;
  if (entry.projectId) {
    homeLabel = `In ${project?.title || 'Untitled'}`;
  } else if (inJournalView(entry)) {
    homeLabel = 'In the Journal';
  } else if (entry.origin === 'loose') {
    homeLabel = 'Loose — belongs nowhere yet';
  } else {
    // Not filed, not journal-homed, and not the loose-origin door either
    // (a 'project'-origin page un-filed, or a legacy grandfathered row
    // that used to read `shelved` true) — the honest fact is the same
    // "belongs nowhere yet" the loose door already uses; T3 (persistence.ts)
    // is what actually lands it on the Shelf at the next reconcile.
    homeLabel = 'Loose — belongs nowhere yet';
  }
  const memberships: string[] = [];
  if (inJournalView(entry) && homeLabel !== 'In the Journal') memberships.push('Also in the Journal.');
  for (const title of pinnedBoardTitles) memberships.push(`${deskTerm('pageFacePinnedTo')} ${title}.`);
  return { homeLabel, memberships };
}
