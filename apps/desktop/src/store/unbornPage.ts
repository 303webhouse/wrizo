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
  // ITEM 87 (clause 1) — THE DOOR DECLARES THE ROOM IT OPENS.
  //
  // Nick's S3: "New Page lands in Draft." The obvious patch — flip PageEditor's
  // default so a loose page opens in Draft — would REVERSE a ruled default:
  // CD1 S8 (A7) deliberately opens loose-origin pages in Free Write to match the
  // front-door posture, and Arrival's own Write door depends on exactly that. A
  // New Page and the Write door produce the SAME loose-origin surface, so origin
  // alone cannot tell them apart; only the door knows which it is.
  //
  // So this is additive, and CD1 S8 stands unreversed: a door that means "a page
  // to work on" SAYS so, and everything that stays silent keeps today's
  // behaviour byte-for-byte. That is how a ruled default gets amended rather
  // than flipped (Fable's ruling 4). Null means "no opinion" — the existing
  // origin/pageType rule decides, untouched.
  mode: 'freewrite' | 'draft' | null;
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
  const rawMode = q.get('mode');
  return {
    origin,
    kind,
    binderId: binderId && binderId.trim() ? binderId : null,
    pinBoardId: pinBoardId && pinBoardId.trim() ? pinBoardId : null,
    // Anything unrecognised degrades to "no opinion", not to a guess — the
    // address is a hint about a room that does not exist yet.
    mode: rawMode === 'draft' ? 'draft' : rawMode === 'freewrite' ? 'freewrite' : null,
  };
}

export function unbornHref(d: Partial<UnbornDescriptor> = {}): string {
  const q = new URLSearchParams();
  if (d.origin && d.origin !== 'loose') q.set('origin', d.origin);
  if (d.kind && d.kind !== 'prose') q.set('kind', d.kind);
  if (d.binderId) q.set('binder', d.binderId);
  if (d.pinBoardId) q.set('pin', d.pinBoardId);
  if (d.mode) q.set('mode', d.mode);
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
