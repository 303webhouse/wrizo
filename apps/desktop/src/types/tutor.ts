// The Tutor's per-page conversation thread: one nullable jsonb column on `journal_entries` (`tutor`, additive only, no default, no CHECK, like `origin`/`script`), mapped both ways in sync.ts (rowToJournalEntry / upsertJournalEntries). It holds the writer<->Tutor exchange for THIS page and its read cursor, nothing else: lens results and nudges are DERIVED, recomputed on every approach, never stored (a page's jsonb holds authored or generated content, never a cache of a computation that can be re-run). null <-> undefined is a fixed point through every client mutation path (persistence.ts's getTutorThread/saveTutorThread) and both sync directions: a page with no thread is absent, never an empty {messages:[]}. `role` is 'writer' | 'tutor' only; the system prompt binding the Tutor to the ghostwriter rail lives server-side, per request, never stored. `lastRead?: { at, chars }` is the listener's cursor, how much of the page's text the Tutor has read: a fact about the conversation, not a lens result or a nudge. It is optional because a thread with no cursor yet means "read from the start", never "read nothing"; it advances ONLY via persistence.ts's advanceTutorCursor, ONLY on a successful reply, and ONLY on a thread that already exists, so a page that never talked to the Tutor gains no persisted tutor state. [index §16]
export interface TutorMessage {
  id: string;
  role: 'writer' | 'tutor';
  text: string;
  at: string; // ISO timestamp
}

export interface TutorThread {
  messages: TutorMessage[];
  lastRead?: { at: string; chars: number };
}

// TU5 S1 — the book's Bible (L4 of the Tutor's five-layer memory): durable,
// writer-owned facts of the project. Rides `projects` as ONE additive nullable
// jsonb column (`add column if not exists tutor jsonb` — the exact
// `origin`/`journal_entries.tutor` recipe, project-side this time), never a new
// table (a table is a whole new synced collection — the BM1 charter's own
// reasoning). WRITER-AUTHORED ONLY: the Tutor cannot write here, not even by
// proposal (structured model output becoming app state is a cousin of the
// affordance A13 forbids). `source` is an enum of one today so L5-era
// provenance never needs a migration. Grandfather clause, identical to
// TutorThread's above: null <-> undefined is a fixed point through every store
// mutation and both sync mappers — a project never touched by the bible is
// byte-identical to today (absent, never a literal null or an empty
// { v:1, facts:[] }). A fact is a line, not a page: its 300-char cap is the
// store's policy (tutorBible.ts), never enforced in this shape.
export interface Fact {
  id: string;
  text: string;
  source: 'writer';
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface TutorBible {
  v: 1;
  facts: Fact[];
}
