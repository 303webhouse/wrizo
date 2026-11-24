// THE TUTOR'S NOTES ON FILE, the server's rules (TUTOR build-list item 7, "Memory, step 1: notes on file"; rules-of-the-road.md section 8 and R13).
// Fable's ruled shape, Nov 23, 10:44 pm: its own server table, one row per note; kept only on her yes; she can see, edit and wipe them, and wipe truly deletes;
// only the server reads them for an ask; never sent to another writer.
//
//   KEPT ONLY ON HER YES.   The AI proposes a note; the proposal lives on her screen and nowhere else. The only way a row is ever written is POST /api/tutor/notes,
//                           and the screen sends that when she presses yes. So the server never saves a proposal on its own, and a note she says no to never existed.
//   SHE SEES, EDITS, WIPES.  GET lists every note she has; PATCH changes one; DELETE removes one; DELETE on the collection wipes them all. Every delete is a real
//                           SQL delete: no deleted_at, no archive, no copy (the table has no such column to hide behind).
//   ONLY THE SERVER READS.  `notesForAsk` is the one reader the Tutor's ask will use (step 2). It is a function, not a route: nothing in the router returns notes to
//                           anyone but the signed-in writer who owns them, and no route returns them in any other shape.
//   NEVER TO ANOTHER WRITER. Every statement in the SQL store (tutorNotesRoutes.ts) is scoped by `user_id = $1`, and $1 is always the session's own user id, never
//                           a value from the request. Another writer's note id answers 404, the same as an id that does not exist.
//
// No database here: the SQL is behind NotesStore, so these rules run unchanged in the browserless check (scripts/harness/tutor-notes.mjs) against an in-memory store.

export const NOTE_KINDS = ['tendency', 'interest', 'blocker', 'goal'] as const; // rules-of-the-road section 8: "her tendencies, interests, blockers and goals"
export type NoteKind = (typeof NOTE_KINDS)[number];
/** proposed = the AI proposed it and she pressed yes; interview = from the voluntary interview; own = she wrote it herself. */
export const NOTE_SOURCES = ['proposed', 'interview', 'own'] as const;
export type NoteSource = (typeof NOTE_SOURCES)[number];

export const NOTE_MAX_CHARS = 400;
export const NOTES_MAX_PER_WRITER = 100;

export interface Note { id: string; kind: NoteKind; text: string; source: NoteSource; createdAt: string; updatedAt: string }

export interface NotesStore {
  list(userId: string): Promise<Note[]>;
  count(userId: string): Promise<number>;
  insert(userId: string, n: { kind: NoteKind; text: string; source: NoteSource }): Promise<Note>;
  /** null when no such note belongs to this writer. */
  update(userId: string, id: string, patch: { kind?: NoteKind; text?: string }): Promise<Note | null>;
  /** True when a note of this writer's was deleted. */
  remove(userId: string, id: string): Promise<boolean>;
  /** Deletes every note of this writer's; returns how many. */
  wipe(userId: string): Promise<number>;
}

export interface Reply { status: number; json?: unknown }

const isMap = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BAD: Reply = { status: 400, json: { error: 'bad request' } };
const NOT_FOUND: Reply = { status: 404, json: { error: 'not found' } };

const isKind = (v: unknown): v is NoteKind => typeof v === 'string' && (NOTE_KINDS as readonly string[]).includes(v);
const isSource = (v: unknown): v is NoteSource => typeof v === 'string' && (NOTE_SOURCES as readonly string[]).includes(v);
/** A note's text: a string, trimmed, 1 to NOTE_MAX_CHARS characters. */
function cleanText(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length >= 1 && t.length <= NOTE_MAX_CHARS ? t : null;
}
/** Only these keys; anything else is refused, so a made-up client cannot park an extra field (or somebody else's user id) in a request. */
const onlyKeys = (b: Record<string, unknown>, allowed: string[]): boolean => Object.keys(b).every((k) => allowed.includes(k));

export async function notesList(store: NotesStore, userId: string): Promise<Reply> {
  return { status: 200, json: { notes: await store.list(userId) } };
}

/** Her yes. The one door a note comes in by. */
export async function notesAdd(store: NotesStore, userId: string, body: unknown): Promise<Reply> {
  if (!isMap(body) || !onlyKeys(body, ['kind', 'text', 'source'])) return BAD;
  const text = cleanText(body.text);
  if (!isKind(body.kind) || text === null || !isSource(body.source)) return BAD;
  if ((await store.count(userId)) >= NOTES_MAX_PER_WRITER) return { status: 409, json: { error: 'full', limit: NOTES_MAX_PER_WRITER } };
  return { status: 201, json: { note: await store.insert(userId, { kind: body.kind, text, source: body.source }) } };
}

export async function notesEdit(store: NotesStore, userId: string, id: unknown, body: unknown): Promise<Reply> {
  if (typeof id !== 'string' || !UUID_RE.test(id)) return NOT_FOUND;
  if (!isMap(body) || !onlyKeys(body, ['kind', 'text']) || Object.keys(body).length === 0) return BAD;
  const patch: { kind?: NoteKind; text?: string } = {};
  if ('kind' in body) { if (!isKind(body.kind)) return BAD; patch.kind = body.kind; }
  if ('text' in body) { const t = cleanText(body.text); if (t === null) return BAD; patch.text = t; }
  const note = await store.update(userId, id, patch);
  return note ? { status: 200, json: { note } } : NOT_FOUND;
}

export async function notesRemove(store: NotesStore, userId: string, id: unknown): Promise<Reply> {
  if (typeof id !== 'string' || !UUID_RE.test(id)) return NOT_FOUND;
  return (await store.remove(userId, id)) ? { status: 200, json: { deleted: 1 } } : NOT_FOUND;
}

/** Wipe: every note she has, truly deleted. */
export async function notesWipe(store: NotesStore, userId: string): Promise<Reply> {
  return { status: 200, json: { deleted: await store.wipe(userId) } };
}

/**
 * The ONE reader for an ask (step 2 wires it into the prompt's CONTEXT block). Server-side only: it is not behind any route. Returns her notes as plain lines,
 * "kind: text", oldest first, or [] when she has none (and the ask then says nothing of memory).
 */
export async function notesForAsk(store: NotesStore, userId: string): Promise<string[]> {
  return (await store.list(userId)).map((n) => `${n.kind}: ${n.text}`);
}
