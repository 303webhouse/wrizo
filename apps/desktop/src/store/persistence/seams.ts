import type { Project, BeatNote, JournalEntry } from '../../types';
import { cache, clone, durableSeam, flushNow } from './core';
import { createBinder, createProject, getProject, saveProject } from './projects';
import { createStoryPlan, getStoryPlan, setBeatStatus, setCurrentBeat } from './storyPlans';
import { getTrashedCards, purgeDeletedBox, restoreDeletedBox, stashDeletedBoxes } from './boards';
import { addPageLink, getLinkPeersOfCard, getPageLinksOf, getPageLinksTo, removePageLink, toggleEntryLink } from './links';
import { getJournalEntry, patchJournalEntry } from './entries';
import { createDrawer, getDrawer, renameDrawer, setProjectDrawer } from './drawers';
import { applyRemoteRecords } from './syncApply';

// the authoring seams (test/inspection only): every seam flushes before it returns (a write is debounced); carry `origin` and `source` explicitly - an omitted key is a different row [persistence §28]
if (typeof window !== 'undefined') {
  const seams = window as unknown as Record<string, unknown>;

  // EVERY SEAM BELOW FLUSHES, for the reason recorded at wrizoCreateJournalPage:
  // a debounced write that a fixture reloads past is a row that never existed,
  // and it cost 36 files in a stamped leg. `durable` is the one place that
  // guarantee lives, so no future seam can forget it and no call site has to
  // remember. Product code reaches none of these.
  const durable = <T>(value: T): T => { flushNow(); return value; };

  // a seam returns what was STORED, not what was asked: upsert stamps updatedAt on the clone it inserts, so every creating seam re-reads its row [persistence §29]
  const stored = <T>(row: T | null, reread: () => T | null): T | null => reread() ?? row;

  // Set fields on an EXISTING page. Wraps `patchJournalEntry`, passing the
  // row's own current text so a patch never clobbers it; a caller that means to
  // change the text passes it in `changes` and the spread inside wins.
  seams.wrizoPatchEntry = (id: string, changes: Partial<JournalEntry>) => {
    const latest = getJournalEntry(id);
    if (!latest) return null;
    return durable(patchJournalEntry(id, latest.text, changes));
  };

  // Flush on demand — the escape hatch for a fixture that writes through some
  // other product path and needs it landed before a reload.
  seams.wrizoFlushNow = () => flushNow();

  // BOARD CONTEXT MENU - the tombstone acts and their reads, for a fixture that must stash / restore / purge a card or read what is stored, through the product's own functions (never raw storage).
  seams.wrizoStashDeleted = (boardId: string, ids: string[]) => { const r = stashDeletedBoxes(boardId, ids); flushNow(); return r; };
  seams.wrizoRestoreDeleted = (boardId: string, boxId: string) => { const r = restoreDeletedBox(boardId, boxId); flushNow(); return r; };
  seams.wrizoPurgeDeleted = (boardId: string, boxId: string) => { const r = purgeDeletedBox(boardId, boxId); flushNow(); return r; };
  seams.wrizoTrashedCards = () => getTrashedCards();
  // CONNECTOR-B - the page-link acts and reads, for a fixture (through the product's own functions, never raw storage)
  seams.wrizoAddPageLink = (ownerId: string, end: { aBoxId?: string; bEntryId: string; bBoxId?: string }) => { const r = addPageLink(ownerId, end); flushNow(); return r; };
  seams.wrizoRemovePageLink = (linkId: string) => { const r = removePageLink(linkId); flushNow(); return r; };
  seams.wrizoToggleEntryLink = (boardId: string, boxId: string, entryId: string) => { const r = toggleEntryLink(boardId, boxId, entryId); flushNow(); return r; };
  seams.wrizoLinkPeers = (boardId: string, boxId: string) => getLinkPeersOfCard(boardId, boxId);
  seams.wrizoPageLinksOf = (entryId: string) => getPageLinksOf(entryId);
  seams.wrizoPageLinksTo = (entryId: string, boxId?: string) => getPageLinksTo(entryId, boxId);
  seams.wrizoStoredBoxes = (boardId: string) => clone(cache.journalEntries.find(e => e.id === boardId)?.boxes ?? []);
  seams.wrizoApplyRemoteBoard = (rec: JournalEntry) => { applyRemoteRecords({ journalEntries: [rec] }); flushNow(); return clone(cache.journalEntries.find(e => e.id === rec.id)?.boxes ?? []); };

  // ITEM 85-C — ESTABLISH RECENCY BY TOUCHING, NOT BY ASSERTING A TIMESTAMP.
  //
  // `upsert` stamps `updatedAt` on every write, so a seeded value never
  // survives: a fixture that spaced its rows a second apart to get deterministic
  // recency got seven rows sharing one millisecond instead, and fx9 rendered SIX
  // tiles for seven docs — the list collapses rows it cannot tell apart. The
  // failure presented as a COUNT, which is why it did not look like an ordering
  // bug at first.
  //
  // So the order is made REAL rather than fabricated: touch each row in the
  // intended sequence and let the store stamp them ascending. That is what the
  // dependent assertions actually claim ("last-opened anchors first"), and it
  // is now true rather than asserted of a timestamp nobody wrote.
  //
  // THE SEPARATION IS LOAD-BEARING, AND IT IS OBSERVED, NOT ASSUMED. `Date.now()`
  // has millisecond resolution and these writes are far faster than a
  // millisecond, so two touches can share a stamp and reproduce the very
  // collapse this exists to fix. The first shape of this code waited for the
  // clock with `while (Date.now() === tick) {}` — and the MINIFIER DELETED IT:
  // an empty body whose condition esbuild treats as side-effect-free is dead
  // code, so the built bundle re-stamped every row into one millisecond while
  // the source read as though it did not. A loop whose exit condition is the
  // STORED stamp cannot be elided, and it does not merely hope the clock moved:
  // it keeps writing until storage itself shows the row strictly later than the
  // one before it. The ascending order is then a fact read back, not an
  // intention expressed.
  seams.wrizoTouchInOrder = (ids: string[]) => {
    const out: (JournalEntry | null)[] = [];
    let previous = '';
    for (const id of ids) {
      let latest = getJournalEntry(id);
      if (!latest) { out.push(null); continue; }
      // Bounded so a store that refuses to advance fails visibly as a bad order
      // rather than hanging the page: the assertion, not the seam, reports it.
      for (let attempt = 0; attempt < 5000; attempt += 1) {
        patchJournalEntry(id, latest.text, {});
        latest = getJournalEntry(id) ?? latest;
        if (latest.updatedAt > previous) break;
      }
      previous = latest.updatedAt;
      out.push(latest);
    }
    flushNow();
    return out;
  };

  // NOTE the narrower union, which a typecheck caught and the build did not:
  // `Project['type']` has three members but `createProject` accepts two, so a
  // seam typed to the full union would promise a value the store path cannot
  // take. Widening `createProject` to accept the third would be house work, not
  // door work — so the seam mirrors the creator's own signature instead. It
  // costs nothing here: all 19 project rows across the 55 fixtures are
  // `type: 'creative'`, measured, and none needs the third.
  seams.wrizoCreateProject = (title: string, type: 'creative' | 'academic' = 'creative') => {
    const p = createProject(title, type);
    return durable(stored(p, () => getProject(p.id)));
  };

  // A project with a `kind` and an optional home drawer — the shape the Shelf
  // and Drawers fixtures need, and already the app's own Binder birth path.
  seams.wrizoCreateBinder = (title: string, kind: Project['kind'], drawerId?: string,
    type: Project['type'] = 'creative') => {
    const b = createBinder(title, kind, drawerId, type);
    return durable(stored(b, () => getProject(b.id)));
  };

  seams.wrizoPatchProject = durableSeam((id: string, changes: Partial<Project>) => {
    const project = getProject(id);
    if (!project) return null;
    saveProject({ ...project, ...changes });
    return getProject(id);
  });

  // Authors the plan AND stamps `project.storyPlanId` — because
  // `createStoryPlan` already does both. The fixtures that set that field by
  // hand were duplicating work the creator performs.
  seams.wrizoCreateStoryPlan = (projectId: string, frameworkId: string, beatIds: string[]) => {
    const plan = createStoryPlan(projectId, frameworkId, beatIds);
    return durable(stored(plan, () => getStoryPlan(plan.id)));
  };

  // ITEM 85-C — createStoryPlan always makes the FIRST beat current, and m1's
  // fixtures need a LATER one (their whole subject is a plan whose current beat
  // is not the opening one). The store already has setCurrentBeat, so this is a
  // wrapper over an existing path like every other seam here — not new capability.
  // ITEM 85-C — A SEAM REPORTS WHAT HAPPENED, AND "NOTHING HAPPENED" IS A THING
  // THAT HAPPENED.
  //
  // These three wrap store functions typed `void` that bail SILENTLY on a
  // missing row (`const plan = getStoryPlan(planId); if (!plan) return;`), so a
  // caller could not tell a completed write from a no-op: a fixture naming a
  // wrong id got no value, no error, and no way to know. That is the same class
  // as the echo lie above, failing by SILENCE instead of by echo — and a seam
  // that cannot report a no-op certifies it just as effectively.
  //
  // The verdict is computed HERE, in the seam, by re-reading the row and
  // checking the change actually TOOK — never by changing the store function's
  // signature, which would be a product-path change and would stop. Each
  // returns the stamped record on success and `false` when nothing happened.
  seams.wrizoSetCurrentBeat = (planId: string, beatId: string) => {
    setCurrentBeat(planId, beatId);
    const plan = getStoryPlan(planId);
    return durable(plan && plan.currentBeatId === beatId ? plan : false);
  };

  // Same reason: createStoryPlan makes every beat 'empty', and m1's fixtures need
  // one COMPLETE (a plan with progress behind its current beat). setBeatStatus is
  // the store's own path for it.
  // Two silent bail paths here, not one — a missing plan AND a missing beat
  // note — so the read-back checks the note's status rather than the plan's
  // existence, or a valid plan with a wrong beatId would report success.
  seams.wrizoSetBeatStatus = (planId: string, beatId: string, status: BeatNote['status']) => {
    setBeatStatus(planId, beatId, status);
    const plan = getStoryPlan(planId);
    const note = plan?.beatNotes.find((bn) => bn.beatId === beatId);
    return durable(plan && note && note.status === status ? plan : false);
  };

  seams.wrizoCreateDrawer = (name: string) => {
    const d = createDrawer(name);
    return durable(stored(d, () => getDrawer(d.id)));
  };

  // FLUX V2 harness seam: rename a drawer through the real path (renameDrawer), so a check can prove a renamed top drawer keeps its own name.
  seams.wrizoRenameDrawer = (id: string, name: string) => {
    renameDrawer(id, name);
    return durable(getDrawer(id)?.name === name.trim() ? getDrawer(id) : false);
  };

  // `setProjectDrawer` stores `drawerId ?? undefined`, so the read-back compares
  // against that same normalisation — asserting the stored shape, not the asked
  // one, which is the whole point of reading it back.
  seams.wrizoSetProjectDrawer = (projectId: string, drawerId: string | null) => {
    setProjectDrawer(projectId, drawerId);
    const project = getProject(projectId);
    const want = drawerId ?? undefined;
    return durable(project && project.drawerId === want ? project : false);
  };
}
