import { generateId, saveJournalEntry, setUnbornEntry, pinPageToBoard } from './persistence';
import type { Box, JournalEntry } from '../types';

// PB1 — Born on the First Word (docs/wrizo-alpha/p1-wave.md §PB1, item 71;
// the specification is docs/wrizo-alpha/pb1-unborn-surface.md).
//
// THE DESCRIPTOR LIVES IN THE URL (Fable's ruling 1, 2026-07-26). A door that
// opens a blank surface no longer creates a row; it navigates to /page/new
// carrying what the door MEANT as query params. That is reload-safe by
// construction — reload re-reads the address and the door's meaning survives
// with no storage, no store row, and no fallback rule to invent. The address
// describes a door until the writer makes it a room.
//
// Nothing here writes anything until `birth`.

export type UnbornKind = 'prose' | 'board';
export type UnbornOrigin = 'loose' | 'journal';

export interface UnbornDescriptor {
  origin: UnbornOrigin;
  kind: UnbornKind;
  binderId: string | null;
  // ITEM 91 — the board this surface was opened FROM, to be pinned to at birth.
  // `birth()` has always accepted `opts.pinToBoardId`, and `UnbornSurface`
  // has always threaded it — but NO call site anywhere ever supplied it, so the
  // whole capability was dead code. It was unreachable for a structural reason,
  // not an oversight: the descriptor lives in the URL, and the descriptor had no
  // field for it, so a door had no way to SAY "born pinned here." This is that
  // field. It rides the address like every other part of the descriptor, so it
  // survives a reload with no storage and no store row — the same property that
  // makes the rest of PB1 reload-safe by construction.
  pinBoardId: string | null;
  // ITEM 104 — THE DOOR DECLARES THE ROOM'S KIND, not just its posture.
  //
  // `mode` (item 87) says which POSTURE a prose page opens in; this says what
  // KIND of document it is. Nick's verdict, verbatim: "Screenplay mode should be
  // auto-selected anyway when a user comes from a New Page where the
  // 'Screenplay' template icon was selected." That is the same seam items 91-92
  // established for the board pin and item 87 for the mode — the address
  // carrying what a page IS before it is born — extended one field further.
  //
  // Applying it is NOT a new carve-out of PB1. The ruled AMENDMENT to Fable's
  // ruling 2 already says Screenplay BIRTHS at zero words, "which is also why
  // there is no unborn script surface to hold" (see `requestScreenplay` in
  // PageEditor.tsx). A door declaring `structure=screenplay` therefore births on
  // arrival for exactly the reason the toggle does: choosing Screenplay is a
  // durable authorial commitment about what the document IS, not a decoration.
  // Every silent door keeps writing nothing, so PB1's own law is untouched.
  structure: 'prose' | 'screenplay' | null;
}

// A malformed or unknown descriptor degrades to a plain loose page rather than
// throwing. The address is a hint about a room that does not exist yet, so it
// can never be authoritative enough to fail on — and the writer stays on paper,
// which is the posture the whole product is built around.
export function readDescriptor(search: string): UnbornDescriptor {
  const q = new URLSearchParams(search);
  const origin = q.get('origin') === 'journal' ? 'journal' : 'loose';
  const kind = q.get('kind') === 'board' ? 'board' : 'prose';
  const binderId = q.get('binder');
  const pinBoardId = q.get('pin');
  const rawStructure = q.get('structure');
  return {
    origin,
    kind,
    binderId: binderId && binderId.trim() ? binderId : null,
    pinBoardId: pinBoardId && pinBoardId.trim() ? pinBoardId : null,
    // Anything unrecognised degrades to "no opinion", not to a guess — the
    // address is a hint about a room that does not exist yet.
    structure: rawStructure === 'screenplay' ? 'screenplay' : rawStructure === 'prose' ? 'prose' : null,
  };
}

export function unbornHref(d: Partial<UnbornDescriptor> = {}): string {
  const q = new URLSearchParams();
  if (d.origin && d.origin !== 'loose') q.set('origin', d.origin);
  if (d.kind && d.kind !== 'prose') q.set('kind', d.kind);
  if (d.binderId) q.set('binder', d.binderId);
  if (d.pinBoardId) q.set('pin', d.pinBoardId);
  if (d.structure && d.structure !== 'prose') q.set('structure', d.structure);
  const s = q.toString();
  return `/page/new${s ? `?${s}` : ''}`;
}

// The record-SHAPED object the unborn surface hands to its children. Identical
// in shape to what birth will write, so every consumer reads the same fields it
// always did — the only difference is that this one lives in the unborn slot
// (persistence.ts) instead of the cache, and is therefore never serialized,
// never synced, and never enumerated by any derived view.
export function unbornEntry(id: string, d: UnbornDescriptor, createdAt: string): JournalEntry {
  const base: JournalEntry = {
    id,
    text: '',
    projectId: d.binderId,
    source: 'page',
    origin: d.binderId ? undefined : d.origin,
    createdAt,
    updatedAt: createdAt,
  } as JournalEntry;
  if (d.kind === 'board') {
    base.pageType = 'board';
    base.boxes = [];
  }
  return base;
}

// BIRTH — one synchronous call, and the only place an unborn surface becomes a
// row. The content is passed IN and written in the SAME act: never
// create-empty-then-save, because the window between those two writes is
// exactly the keystroke of loss this ticket may not introduce. The row goes
// through the ordinary saveJournalEntry path, so the first word reaches disk
// under the existing debounced-flush guarantee (persistence.ts's own ~300ms,
// offline included), identical to every other write in the app.
//
// Triggers (Fable's ruling 2): the first word, or an act that creates a durable
// relationship — pairing, porting, pinning. Plus the ruled AMENDMENT: choosing
// Screenplay births, because it transforms the document rather than decorating
// it (see the amendment's own note in PageEditor).
export interface BirthContent {
  text?: string;
  boxes?: Box[];
  pageType?: JournalEntry['pageType'];
  script?: JournalEntry['script'];
}

export function birth(
  id: string,
  d: UnbornDescriptor,
  content: BirthContent,
  opts: { pinToBoardId?: string | null } = {},
): JournalEntry {
  const now = new Date().toISOString();
  const entry = unbornEntry(id, d, now);
  const born: JournalEntry = {
    ...entry,
    ...(content.text != null ? { text: content.text } : {}),
    ...(content.boxes != null ? { boxes: content.boxes } : {}),
    ...(content.pageType != null ? { pageType: content.pageType } : {}),
    ...(content.script != null ? { script: content.script } : {}),
    updatedAt: now,
  };
  saveJournalEntry(born);
  // Relationships that were part of the SAME act (ruling 2) are applied here,
  // so the row and its relationship are never observable apart.
  //
  // ITEM 91 — the descriptor is now a source for this, not just the explicit
  // opt. `opts.pinToBoardId` still wins when a caller passes it, but a door that
  // encoded the board in the ADDRESS no longer has to thread an option through
  // every intermediate component to be honoured: the four `birthWith` call sites
  // are untouched by this ticket and all four inherit the behaviour. That also
  // means the pin survives a reload of the unborn surface, because the address
  // does — a page opened from a board, left, and returned to is still born
  // pinned to that board.
  const pinTo = opts.pinToBoardId ?? d.pinBoardId;
  if (pinTo) pinPageToBoard(born.id, pinTo);
  // The store now has the row, so getJournalEntry resolves it from the cache
  // and the slot no longer matters; clearing it keeps the invariant "at most
  // one unborn surface, and only while it is genuinely unborn."
  setUnbornEntry(null);
  return born;
}

// A fresh id for an unborn surface. Minted up front so it is stable for the
// whole unborn session (per-page localStorage keys, React keys, the cascade's
// own subject id) and becomes the row's id at birth — the surface never
// changes identity underneath the writer.
export function mintUnbornId(): string {
  return generateId();
}
