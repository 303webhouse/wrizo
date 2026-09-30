// PUB1 — "the Press opens at the size of what you're on" (R1, §3). This file
// is the DECISION only: a pure function from a plain description of where the
// writer is to a `PressScope`. It reads no store, no DOM, no router — the
// door handler (FIX's grant, after r3) is what will gather the inputs below
// from the real app and hand them here; that wiring is not this file's job.
//
// The rule, verbatim from §3:
//   - From a card, a loose page (Shelf or Journal) or a selection: opens on
//     just that piece. The running order collapses to it, "← whole binder"
//     beside it.
//   - From a page inside a binder: opens on the scope last used for THAT
//     binder ("Again"); with no history, the whole binder, that page
//     highlighted, "Just this" one tap away.
//   - A board, a script, the Journal (as a board of pages) and "everything"
//     are their own scopes (the readers list, §2) — each its OWN starting
//     point, never derived from "what you're on" the way a card/page/binder is.

export type PressScope =
  | { kind: 'card'; cardId: string; boardId: string }
  | { kind: 'selection'; entryId: string; text: string }
  | { kind: 'page'; entryId: string }
  | { kind: 'binder'; projectId: string; highlightEntryId?: string }
  | { kind: 'board'; entryId: string }
  | { kind: 'script'; entryId: string }
  | { kind: 'journal' }
  | { kind: 'everything' };

/** What the door handler will have on hand when the writer presses Publish —
 *  named plainly, not as a DOM read. `openKind` is what's actually open;
 *  `projectId` is that record's own binder home, null/undefined for a loose
 *  page. `lastUsedScopeForBinder` is the "Again" memory (`wrizo-press-prefs`,
 *  §2's own per-device-override pattern) — absent or null means no history. */
export interface PressOpenContext {
  openKind: 'card' | 'page' | 'board' | 'script';
  entryId: string;
  /** Present only when openKind is 'card'. */
  cardId?: string;
  /** The card's/page's own binder home; null/undefined for a loose page
   *  (Shelf or Journal) — the same "no home" shape persistence.ts's own
   *  `projectId` already uses everywhere else in this codebase. */
  projectId?: string | null;
  /** Present only when the writer pressed the chip that names a selection
   *  (item 84's TD4 precedent: a selection is an explicit act, never
   *  inferred from cursor position) — its own text, never re-read from the
   *  DOM by this file. */
  selectionText?: string;
  /** The Journal is a system board (SV6) — its own boolean, not inferred
   *  from projectId, since a loose page and a Journal page share the same
   *  "no binder" shape and must not resolve to the same scope. */
  isJournal?: boolean;
  lastUsedScopeForBinder?: PressScope | null;
}

export function resolvePressScope(ctx: PressOpenContext): PressScope {
  if (ctx.openKind === 'card') {
    if (!ctx.cardId) throw new RangeError('resolvePressScope: openKind "card" requires cardId');
    return { kind: 'card', cardId: ctx.cardId, boardId: ctx.entryId };
  }
  if (ctx.openKind === 'board') return { kind: 'board', entryId: ctx.entryId };
  if (ctx.openKind === 'script') return { kind: 'script', entryId: ctx.entryId };

  // openKind === 'page' from here down.
  if (ctx.selectionText != null) return { kind: 'selection', entryId: ctx.entryId, text: ctx.selectionText };
  if (ctx.isJournal) return { kind: 'journal' };
  if (ctx.projectId == null) return { kind: 'page', entryId: ctx.entryId };

  // A page inside a binder: "Again" if this binder has a remembered scope,
  // otherwise the whole binder with this page highlighted.
  if (ctx.lastUsedScopeForBinder) return ctx.lastUsedScopeForBinder;
  return { kind: 'binder', projectId: ctx.projectId, highlightEntryId: ctx.entryId };
}
