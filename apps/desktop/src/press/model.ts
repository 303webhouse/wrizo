// PUB1 — the Press's own model. Publish lives entirely in apps/desktop/src/
// press/ (R2, docs/publish/pub-committee-pass.md §2): no other lane's file is
// edited to build it, and this file holds PURE TYPES only — no React, no
// store, no I/O. `PressDoc` is what every reader (press/select/, one per
// container) produces and every writer (press/render/, one per format)
// consumes; nothing between those two stages touches the writer's own
// records again.
//
// R6 (every file Publish makes names what it left out) lives on `omissions`
// here, not as an afterthought bolted onto Render — a reader that skips
// something (unmarked ink, a Board's connection card, an unbuilt Book-board)
// records WHY at the point it skips it, so no writer has to reconstruct that
// reasoning later.

/** Front/back matter role pages: generated (a title page) or authored (an
 *  ordinary binder page whose first line matched a role word, §2). */
export type MatterRole =
  | 'title' | 'copyright' | 'dedication' | 'epigraph' | 'foreword' | 'preface'
  | 'afterword' | 'acknowledgments' | 'about-the-author' | 'notes'
  | 'bibliography';

export interface Matter {
  role: MatterRole;
  /** true for a title/copyright page the Press builds itself; false for an
   *  authored role page (Dedication, Foreword, …) read from the writer's own
   *  words, verbatim (§2: "the words always live in pages"). */
  generated: boolean;
  blocks: Block[];
}

/** A run of inline marks within one line — the shape FIX's markRuns.ts
 *  produces (readMarks); Publish never re-derives this, only carries it
 *  (§2, "Marks: one reader, never two"). Left untyped here (unknown) until
 *  PUB2 imports markRuns.ts and can name the real shape — a placeholder that
 *  is honest about not being load-bearing yet, never a guessed shape a later
 *  ticket would have to migrate away from. */
export type MarkRun = unknown;

export type Block =
  | { kind: 'line'; sourceLine: number; runs: MarkRun[]; indent?: number; align?: 'left' | 'center' | 'right'; quote?: boolean; bullet?: boolean }
  | { kind: 'heading'; sourceLine: number; level: 1 | 2 | 3; text: string }
  | { kind: 'script'; sourceLine: number; sceneId: string }
  // Hand-drawn ink: never rendered as text (E1's own settled answer — a
  // named placeholder, never silently dropped, and never invented prose).
  | { kind: 'figure'; sourceLine: number; note: string }
  // Something Select could not read at all (an unbuilt Book-board, an
  // unknown box kind) — the placeholder itself IS the omission's record.
  | { kind: 'placeholder'; sourceLine: number; note: string }
  // The back-matter slot contract, §2 — filled by whatever registers for
  // this role (today: a Bibliography-role page verbatim; later: Records/
  // Citation's own provider). Publish only lays out what it is handed.
  | { kind: 'slot'; role: 'bibliography' | 'notes' };

export interface Chapter {
  /** The record this chapter was read from — a page id, a board lane id,
   *  or a card id; whatever Select's own reader for that container used. */
  sourceId: string;
  navTitle: string;
  /** 'from-body': line 1 was a `#` heading and became this chapter's own
   *  heading, leaving the body (chapter headings never duplicate words).
   *  'numbered': the Edition numbers it, the way it numbers pages.
   *  'none': no heading at all (a card, a short piece). */
  heading: 'from-body' | 'numbered' | 'none';
  blocks: Block[];
}

export interface Part {
  /** Absent for a binder with no parts (most binders) — a Part exists only
   *  when the container actually has them: a Board's own lanes become
   *  Parts, outline depth becomes heading level (§2). */
  title?: string;
  chapters: Chapter[];
}

/** What Select could not carry into the model, and why — R6's own record,
 *  read verbatim by Render's "this file left out…" line. Never invented
 *  after the fact; each reader appends its own as it skips something. */
export interface Omission {
  sourceId: string;
  reason: string;
}

export interface PressMeta {
  title: string;
  /** binder title; pen name or account name (never the email); contact
   *  block (manuscript editions only); word count — assembled by the
   *  generated title-page Matter, not stored twice here. This field only
   *  carries what more than one Matter/Render step needs in common. */
  penName: string | null;
  wordCount: number;
  scope: import('./select/scope').PressScope;
}

export interface PressDoc {
  v: 1;
  meta: PressMeta;
  front: Matter[];
  body: Part[];
  back: Matter[];
  omissions: Omission[];
}
