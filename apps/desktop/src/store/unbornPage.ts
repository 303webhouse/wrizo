import { generateId, getJournalEntry, saveJournalEntry, setUnbornEntry, pinPageToBoard } from './persistence';
import { graftTo } from './grafts';
import { liveBoxes } from './boxTombstones';
import type { Box, JournalEntry, PageTemplate } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import { getUserPageDefaults, bornPageSettings, NEW_PAGE_SIZE } from './pageDefaults';
import { landingToken, landingFromToken, type HelpLanding } from '../decks/helpMeChoose';

// born on the first word: the door's descriptor lives in the URL (/page/new + params), reload-safe by construction; nothing is written until `birth` [unbornPage §1]

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
  // the door declares the room's KIND (prose or screenplay); a screenplay door births on arrival, since choosing Screenplay is a commitment about what the document is [unbornPage §2]
  structure: 'prose' | 'screenplay' | null;
  // PAGE TEMPLATES (docs/plans/page-templates.md section 2) - the Outline, Title Page or Bibliography lens this page opens in. Rides the address like
  // every other part of the descriptor (reload-safe, no storage). Unlike Screenplay it does NOT birth the page: a template changes how the text is
  // DRAWN, not what kind of document it is, so PB1 holds - no row until the first word - and the setting is written with that first word.
  template: PageTemplate | null;
  // BIG PROJECTS step 2 - a PRESET on the Boards tab opens a new board with this deck's wizard already on its first question (components/BoardEditor.tsx reads it while the board is unborn). A deck id from decks/library; unknown
  // ids are harmless (the wizard finds no such deck and opens at the library). Rides the address like the rest of the descriptor, so nothing is stored.
  deck: string | null;
  // W4 (Help me choose) - the deck's OWN deal answers the librarian already settled (questionId:optionId pairs, comma-joined; e.g. `format:short-story`), so the wizard asks only what is left. Rides the address like `deck`;
  // nothing is stored, and an unknown or malformed value degrades to "no answers" (the deck simply asks).
  deckAnswers: string | null;
  // W2 - "WRITE THIS": the card on a board this page is being written FOR. It rides the address (`gb` board, `gc` card) like `pin` and `deck`, so a reload keeps the door's meaning with no storage, and nothing is
  // written until `birth` (the first keystroke): then the page and its graft to that card are one act. Null for every other door.
  graft: { boardId: string; boxId: string } | null;
  // TOOLS #9 - Q3's landing for a librarian pick (`land=open|walk|walk-help`): "everything" opens the dealt board as Open; "a little" the Walk with the first step's "?" open; "the shape" the Walk. A one-shot
  // hint read once while the board is unborn (components/BoardEditor.tsx onDeckDealt); rides the address like `deck`, nothing is stored; unknown -> null (the deck lands as it always did).
  landing: HelpLanding | null;
}

// A malformed or unknown descriptor degrades to a plain loose page rather than
// throwing. The address is a hint about a room that does not exist yet, so it
// can never be authoritative enough to fail on — and the writer stays on paper,
// which is the posture the whole product is built around.
// W4 - the deal answers as an address-safe string: `question:option` pairs joined by commas, each token [a-z0-9-] only.
const DA_TOKEN = /^[a-z0-9-]+$/;
function cleanDeckAnswers(raw: string | null): string | null {
  if (!raw) return null;
  const pairs = raw.split(',').map((p) => p.split(':')).filter((p) => p.length === 2 && DA_TOKEN.test(p[0]) && DA_TOKEN.test(p[1]));
  return pairs.length > 0 ? pairs.map((p) => p.join(':')).join(',') : null;
}
export function encodeDeckAnswers(answers: Record<string, string>): string | null {
  return cleanDeckAnswers(Object.entries(answers).map(([k, v]) => `${k}:${v}`).join(','));
}
export function decodeDeckAnswers(raw: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of (cleanDeckAnswers(raw) ?? '').split(',')) { const [k, v] = pair.split(':'); if (k && v) out[k] = v; }
  return out;
}

export function readDescriptor(search: string): UnbornDescriptor {
  const q = new URLSearchParams(search);
  const origin = q.get('origin') === 'journal' ? 'journal' : 'loose';
  const kind = q.get('kind') === 'board' ? 'board' : 'prose';
  const binderId = q.get('binder');
  const pinBoardId = q.get('pin');
  const rawStructure = q.get('structure');
  const rawTemplate = q.get('template');
  const rawDeck = q.get('deck');
  return {
    origin,
    kind,
    binderId: binderId && binderId.trim() ? binderId : null,
    pinBoardId: pinBoardId && pinBoardId.trim() ? pinBoardId : null,
    // Anything unrecognised degrades to "no opinion", not to a guess — the
    // address is a hint about a room that does not exist yet.
    structure: rawStructure === 'screenplay' ? 'screenplay' : rawStructure === 'prose' ? 'prose' : null,
    template: rawTemplate === 'outline' || rawTemplate === 'title' || rawTemplate === 'bibliography' ? rawTemplate : null,
    deck: rawDeck && rawDeck.trim() ? rawDeck.trim() : null,
    deckAnswers: cleanDeckAnswers(q.get('da')),
    graft: q.get('gb')?.trim() && q.get('gc')?.trim() ? { boardId: q.get('gb')!.trim(), boxId: q.get('gc')!.trim() } : null,
    landing: rawDeck && rawDeck.trim() ? landingFromToken(q.get('land')) : null,
  };
}

export function unbornHref(d: Partial<UnbornDescriptor> = {}): string {
  const q = new URLSearchParams();
  if (d.origin && d.origin !== 'loose') q.set('origin', d.origin);
  if (d.kind && d.kind !== 'prose') q.set('kind', d.kind);
  if (d.binderId) q.set('binder', d.binderId);
  if (d.pinBoardId) q.set('pin', d.pinBoardId);
  if (d.structure && d.structure !== 'prose') q.set('structure', d.structure);
  if (d.template) q.set('template', d.template);
  if (d.deck) q.set('deck', d.deck);
  if (d.deck && d.deckAnswers) q.set('da', d.deckAnswers);
  if (d.graft) { q.set('gb', d.graft.boardId); q.set('gc', d.graft.boxId); }
  if (d.deck && d.landing) q.set('land', landingToken(d.landing));
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
  // PAGE TEMPLATES - the lens is a page setting, so the unborn slot carries it (the lens can draw before the first word) and birth() keeps it
  // (it spreads this entry). A page with no settings starts from the writer's defaults or the app's floor, as patchPageSettings does.
  if (d.template) base.pageSettings = { ...(getUserPageDefaults() ?? PAGE_SETTINGS_FALLBACK), size: getUserPageDefaults()?.size ?? NEW_PAGE_SIZE, template: d.template };
  // a page is born at 11 pt: the unborn slot already carries it, so the page draws at 11 before the first word and birth() writes it with that word; a board has no page size [unbornPage §3]
  else if (d.kind === 'prose') base.pageSettings = bornPageSettings();
  return base;
}

// birth: one synchronous call, the only place an unborn surface becomes a row, with its content written in the same act (never create-empty-then-save) [unbornPage §4]
export interface BirthContent {
  text?: string;
  boxes?: Box[];
  pageType?: JournalEntry['pageType'];
  script?: JournalEntry['script'];
  // ink is content, so a first stroke births the page with its strokes in the same act [unbornPage §5]
  strokes?: JournalEntry['strokes'];
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
    ...(content.strokes != null ? { strokes: content.strokes } : {}),
    updatedAt: now,
  };
  saveJournalEntry(born);
  // relationships of the same act are applied here, so the row and its relationship are never observable apart; the pin can come from the address, so it survives a reload [unbornPage §6]
  const pinTo = opts.pinToBoardId ?? d.pinBoardId;
  // PW1 S3 — BOARD-SIDE: this page was opened FROM a board's own door (the
  // board is in the address), so the card belongs on that board's wall.
  if (pinTo) pinPageToBoard(born.id, pinTo, { display: true });
  // W2 - WRITE THIS: the page was opened FOR a card, so the card and the page are grafted in this same act (the record the board owns: store/grafts.ts graftTo). A card that has gone since the door was pressed is
  // simply not grafted - the page is the writer's words and stands on its own; a link to nothing is never made. The page opens in Free Write (this device remembers it past a reload).
  if (d.graft) {
    const board = getJournalEntry(d.graft.boardId);
    if (board && liveBoxes(board.boxes ?? []).some(b => b.id === d.graft!.boxId)) graftTo({ entryId: d.graft.boardId, boxId: d.graft.boxId }, { entryId: born.id });
    try { localStorage.setItem(`wrizo-mode-page-${born.id}`, 'journal'); } catch { /* blocked: the page opens in its default posture */ }
  }
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
