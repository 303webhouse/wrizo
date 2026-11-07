import type { JournalEntry, Box, Stroke } from '../../types';
import { getUserPageDefaults, bornPageSettings } from '../pageDefaults';
import { cache, clone, durableSeam, generateId, upsert } from './core';
import { getProject, saveProject } from './projects';
import { getJournalEntry } from './entries';
import { newPageSize } from '../../arbor2/newPageSize';   // ARBOR v2 MOCKUP r17 (kept on r20's rebase: main's TOOLS #14 covers the unborn page; these two birth paths keep the mockup's rule)

// --- Journal (J1) ---------------------------------------------------------
// A completed sprint commits its text to a permanent Journal entry. This is an
// ADDITIONAL, permanent write — not a replacement for the volatile drafts buffer
// (A1, in-flight crash protection) nor for project/scene save behavior. The
// resulting working-copy-plus-record double-storage is intentional: it protects
// the words. Entries are the substrate later tickets cultivate into projects
// (J2) and browse (J4); commit logic lives in the Quick Sprint completion path.

export function saveJournalEntry(entry: JournalEntry): void {
  upsert('journalEntries', cache.journalEntries, clone(entry));
  // F1 — resume stamping: a binder Page edit bumps its parent project's resume
  // pointer. ONE seam catches PageEditor autosave, legacy filed-page edits via
  // JournalEntry, and filing via setPageHome. Loose pages (no projectId) skip.
  if (entry.projectId) stampPageActivity(entry.projectId, entry.id);
}

// Stamp a project's resume pointer to a just-edited Page (F1). Skips silently if
// the project is missing or soft-deleted (getProject returns null). Every-save
// stamping mirrors the sprint pattern (setProjectSprintText) — no new cadence.
function stampPageActivity(projectId: string, pageId: string): void {
  const project = getProject(projectId);
  if (!project) return;
  project.lastActivityAt = new Date().toISOString();
  project.lastActivityType = 'page';
  project.lastActivePageId = pageId;
  saveProject(project);
}

// creates a blank page (source: 'page'); the blank-surface doors no longer call this - they open an unborn surface; it serves callers that create a page and a durable relationship in one act [persistence §6]
export interface JournalPageSeed {
  id?: string;
  text?: string;
  createdAt?: string;
  strokes?: Stroke[];
  // ITEM 129 — the four fields a real fixture needs, added because the seam
  // could not express one. A harness seeding a LOOSE BOARD (the shape bm1's S2
  // orphan check requires) could reach it only by writing raw localStorage,
  // and a raw write is destroyed by the very next product write in the run:
  // every product write serialises the WHOLE in-memory cache back over
  // storage, and the cache never contained the raw row. Measured, and
  // deterministic: raw-seed a row, call this function once, and the raw row is
  // gone — no timing signature, so no settle poll could ever have caught it.
  //
  // `origin` matters more than it looks: it is set ONLY at birth (nothing in
  // the app ever writes it afterwards), and `belongsOnShelf` excludes anything
  // journal-homed. So a seam that could not seed `origin: 'loose'` could not
  // produce a Shelf-eligible page AT ALL, which is exactly why bm1 was still
  // reaching past the seam.
  //
  // Every one of these is applied ONLY when supplied, so an unseeded call
  // writes the byte-identical row it always did — the same discipline
  // `strokes` already established below. Product code passes no seed at all.
  // ITEM 85-C — `null` is meaningful here and is NOT the same as omitting the
  // property. Omitting it leaves this function's default (`origin: 'journal'`);
  // passing null seeds a row with NO origin field at all.
  //
  // That distinction is the difference between migrating 55 files and rewriting
  // them. MEASURED: 52 of the 67 rows the first migration wave seeds carry no
  // origin, across 27 of its 32 files. Born through the seam without this, every
  // one of them would silently become journal-homed — and absent is genuinely
  // not 'journal': PageEditor's `journalFurniture` treats them alike, but
  // `origin === 'journal'` at line ~1407 and unbornPage's `d.origin && ...` both
  // discriminate. A migration must change HOW a row is written, never WHAT the
  // row is; the guard cannot see that difference, so it would have surfaced as
  // suite reds blamed on the migration rather than on a semantic rewrite.
  //
  // The store already persists originless rows — it is the pre-AB3 grandfather
  // shape ab3/b2 test by name — so this widens the door, not the house.
  origin?: JournalEntry['origin'] | null;
  // ITEM 85-C — `source` takes null for the SAME reason origin does, and I
  // learned it the same way twice. This function hardcodes source:'page', and
  // a row that OMITS source is a raw CAPTURE: tutorLenses' computeFragmentItems
  // is literally `all.filter(e => e.source !== 'page')`. So a capture fixture
  // born through the seam silently stops being a capture.
  //
  // I had measured `source` and called it a phantom — "all 32 files that name
  // it write 'page'". That measured the files that NAME the key and never the
  // rows that OMIT it, which is the identical mistake the origin default was.
  // The absence of a key is a value; counting the key's presence cannot see it.
  // fx12's S3 caught it: countPlain 0.
  source?: 'page' | null;
  pageType?: JournalEntry['pageType'];
  projectId?: string | null;
  boxes?: Box[];
  // ITEM 85-C — six more, measured rather than guessed. Each is a field some
  // fixture in the 55-file migration seeds today by writing raw localStorage,
  // counted across all 156 raw writes: `script` (10 files), `starred` (2), and
  // `deletedAt`/`shelved`/`tags`/`orderIndex` (1 each).
  //
  // WHAT IS DELIBERATELY ABSENT, because measuring said so: `source`. It looked
  // like the single biggest gap — 32 files name it — until the VALUES were
  // read, and all 32 write `source: 'page'`, which is exactly what this
  // function already sets. Counting keys would have put a phantom at the top of
  // the list. A key is not a blocker; a value is.
  //
  // AND `updatedAt`, WHICH WAS HERE AND IS NOW GONE. It was admitted for one
  // reason — b2.mjs needed a row whose `createdAt` and `updatedAt` differ — and
  // it never worked: `upsert` stamps `updatedAt` from the wall clock on every
  // write, so a seeded value is overwritten before it reaches storage. The
  // field appeared to work only because the seam returned the object it had
  // been handed rather than the row that was stored, which is the write-path
  // lie this item's own law names. b2 now establishes recency by TOUCHING
  // (`wrizoTouchInOrder`), which is a real order rather than an asserted one,
  // so the sole justification for the key is gone and the key goes with it.
  // An accepted key that is silently discarded is the same lie at the door:
  // it lets a fixture believe it wrote something it did not.
  //
  // Every one of these already rides `saveJournalEntry`, which upserts the
  // whole row — so this widens the door, never the house: no field here is new
  // store capability, and nothing about what the app persists changes.
  script?: JournalEntry['script'];
  starred?: boolean;
  tags?: string[];
  deletedAt?: string;
  shelved?: boolean;
  orderIndex?: number;
}

export function createJournalPage(seed?: JournalPageSeed): JournalEntry {
  const now = new Date().toISOString();
  const createdAt = seed?.createdAt ?? now;
  const entry: JournalEntry = {
    id: seed?.id ?? generateId(),
    text: seed?.text ?? '',
    projectId: null,
    source: 'page',
    // AB3 S4 — the Journal/Catch door: this page homes in the Journal.
    origin: 'journal',
    // birth from defaults: a COPY taken at birth, so a later change to the defaults never re-dresses written pages; a page the app itself births (no seed) is born at 11 pt, a seeded call (the harness seam, a fixture) as it asks - the writer's defaults or nothing [persistence §7]
    pageSettings: seed ? (getUserPageDefaults() ?? undefined) : bornPageSettings(),
    createdAt,
    updatedAt: createdAt,
  };
  // Set only when seeded, so an unseeded page's row is byte-identical to the
  // one this function wrote before fix (b) — `strokes` is absent, not empty.
  if (seed?.strokes) entry.strokes = seed.strokes;
  // ITEM 129 — same discipline, four more fields. Presence-checked
  // individually rather than spread, so a caller supplying none of them gets
  // the identical row this function has always written, and a caller
  // supplying one does not silently acquire the others' defaults.
  // ITEM 85-C — null means "seed a row with no origin field", which is a row
  // shape the store already holds and this seam previously could not produce.
  if (seed?.origin !== undefined) {
    if (seed.origin === null) delete entry.origin;
    else entry.origin = seed.origin;
  }
  // Same rule, same reason: null means "no source field", which is what makes a
  // row a raw capture rather than an authored page.
  if (seed?.source !== undefined) {
    if (seed.source === null) delete entry.source;
    else entry.source = seed.source;
  }
  if (seed?.pageType !== undefined) entry.pageType = seed.pageType;
  if (seed?.projectId !== undefined) entry.projectId = seed.projectId;
  if (seed?.boxes !== undefined) entry.boxes = seed.boxes;
  // ITEM 85-C — the same presence-check discipline, seven more fields. Applied
  // individually rather than spread, so an unseeded call still writes the
  // byte-identical row this function has always written, and a caller supplying
  // one does not silently acquire the others' defaults.
  if (seed?.script !== undefined) entry.script = seed.script;
  if (seed?.starred !== undefined) entry.starred = seed.starred;
  if (seed?.tags !== undefined) entry.tags = seed.tags;
  if (seed?.deletedAt !== undefined) entry.deletedAt = seed.deletedAt;
  if (seed?.shelved !== undefined) entry.shelved = seed.shelved;
  if (seed?.orderIndex !== undefined) entry.orderIndex = seed.orderIndex;
  // NO `updatedAt` ASSIGNMENT, DELIBERATELY. It was here, and it was a lie:
  // `saveJournalEntry` below reaches `upsert`, which stamps `updatedAt` from
  // the wall clock unconditionally, so whatever was assigned here never
  // survived the very next line. A fixture needing rows in a recency order
  // touches them through `wrizoTouchInOrder`, which makes the order real.
  newPageSize(entry);   // ARBOR v2 MOCKUP r17: a page born under the flag starts at 11 pt (../../arbor2/newPageSize.ts)
  saveJournalEntry(entry);
  return entry;
}

// test/inspection seam: a direct path to a fresh journal-origin page for fixtures; the seed may carry origin, pageType, projectId and boxes [persistence §8]
if (typeof window !== 'undefined') {
  // ITEM 85-C — THE SEAM FLUSHES; THE FUNCTION IT WRAPS DOES NOT.
  //
  // MEASURED, at the cost of a stamped leg: 36 of 80 files died as NOVERDICT
  // when wave 1 first ran, every one a file this migration had touched. The
  // cause is the single behavioural difference between a raw write and a seam
  // write, which item85c.mjs's own header names and the migration then failed
  // to absorb: the raw write was SYNCHRONOUS, this one is DEBOUNCED
  // (`scheduleFlush`, 300ms). A fixture that seeds and immediately reloads
  // discards the page — and the cache holding the row — before the timer fires.
  // The row was never in storage, so the surface never mounted.
  //
  // The fix belongs HERE rather than at 37 call sites: a test seam whose write
  // may or may not have landed is a seam that hands every caller the same
  // footgun, and the next migrated file would rediscover it. Product code calls
  // `createJournalPage` DIRECTLY and never through `window`, so the app's own
  // debounced cadence is untouched — this makes the SEAM durable, not the
  // store eager.
  // ITEM 85-C — RETURNS WHAT WAS STORED. createJournalPage hands back the object
  // it built, but saveJournalEntry passes a CLONE to upsert, which stamps
  // `updatedAt` on that clone — so the caller's copy keeps the value it asked
  // for and storage holds another. Re-reading closes it. (The full reasoning is
  // at `stored` in the seam block below.)
  (window as unknown as { wrizoCreateJournalPage?: unknown }).wrizoCreateJournalPage =
    durableSeam((seed?: JournalPageSeed) => {
      const born = createJournalPage(seed);
      return getJournalEntry(born.id) ?? born;
    });
}

// Create a typed page inside a Binder (B1) — a JournalEntry parented to the
// project, with a pageType (manuscript chapter/scene, or a support page). New
// Books/Stories are project + chapter Pages; this is how a chapter is born.
export function createBinderPage(binderId: string, pageType: NonNullable<JournalEntry['pageType']>): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text: '',
    projectId: binderId,
    pageType,
    source: 'page',
    // AB3 S4 — a project door: this page homes in the project; the Journal
    // never sees it (no journal listing, no journal count).
    origin: 'project',
    pageSettings: bornPageSettings(),   // TOOLS #14: born at 11 pt
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}
