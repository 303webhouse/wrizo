import type { Project, JournalEntry } from '../../types';
import { generateId } from './core';
import { createBinder } from './projects';
import { saveJournalEntry } from './journal';
import { getJournalEntry, setPageHome } from './entries';

// J5 Slice 2 — the "＋ Standalone document here" leaf: file ALL selected
// pages into ONE new Untitled binder (kind 'other', F4's title-later law) in
// the given drawer. N pages -> one binder, not N. MOVES (rides setPageHome).
export function fileToNewBinder(sourceIds: string[], drawerId?: string): Project {
  const binder = createBinder('', 'other', drawerId);
  for (const id of sourceIds) setPageHome(id, binder.id);
  return binder;
}

// Append to <chapter> copies the pages' TEXT in notebook order, separated by a blank line; sources are never touched [persistence §23]
export function appendToChapter(sourceIds: string[], chapterId: string): void {
  const chapter = getJournalEntry(chapterId);
  if (!chapter) return;
  const blocks = sourceIds.map(id => getJournalEntry(id)?.text ?? '').filter(t => t.trim());
  if (blocks.length === 0) return;
  const appended = [chapter.text, ...blocks].filter(t => t.trim()).join('\n\n');
  saveJournalEntry({ ...chapter, text: appended });
}

// J5 Slice 3 — "Attach to the plan" (LINKS): sets beatId and appends the
// binder's project id to routedProjectIds on each selected entry. Nothing
// moves, nothing copies — the page stays exactly where it is.
export function attachToPlanBeat(sourceIds: string[], binderId: string, beatId: string): void {
  for (const id of sourceIds) {
    const entry = getJournalEntry(id);
    if (!entry) continue;
    const routed = entry.routedProjectIds ?? [];
    saveJournalEntry({
      ...entry,
      beatId,
      routedProjectIds: routed.includes(binderId) ? routed : [...routed, binderId],
    });
  }
}

// Import a draft (VW — the Voice Wall's door). The writer's own work flowing IN:
// a new binder page seeded with pasted text and stamped with provenance
// (`importedAt`). It behaves as a normal page thereafter (modes, filing, resume);
// the stamp is metadata only. Rides saveJournalEntry, so it stamps page activity
// (F1) and syncs like any page. One page per import, any length (v1).
export function importDraft(binderId: string, pageType: NonNullable<JournalEntry['pageType']>, text: string): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text,
    projectId: binderId,
    pageType,
    source: 'page',
    importedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}
