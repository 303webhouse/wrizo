import type { JournalEntry, Project } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import { getJournalEntries, getJournalEntry, getProject, getSystemKind, isAutoSet, isPairedPlanBoard, saveJournalEntry } from '../store/persistence';
import { compareSections } from '../store/place';
import { firstLine } from '../store/entryText';
import { wordCount } from '../store/wordCount';

// THE PARTS SEAM (agreed with INK, Nov 19): INK builds the sections data in reorg/parts.ts and exports exactly these two functions with these
// signatures; until it lands, this file is the stand-in, and then it becomes one line re-exporting INK's. Everything that reads Parts (the top
// rail, the Front menu's Parts list) imports from here and from nowhere else.
//
// The stand-in's rule is today's read-time rule (railData.ts): a set she made is one Doc and its pages are its Parts, in her order
// (compareSections); any other page is a one-Part Doc. A Part's name is pageSettings.name (Nick's ruling, Nov 19: saved with the account; the
// existing whole-blob page_settings column carries it, schema change none); a Part with no name reads its first line (the Sep 12 rule).

export interface PartRow { id: string; n: number; name: string; named: boolean; words: number }
export interface DocParts { doc: { id: string; name: string; set: Project | null }; parts: PartRow[]; here: number }

const live = (e: JournalEntry): boolean => !e.deletedAt && !e.purgedAt && !getSystemKind(e) && !isPairedPlanBoard(e.id) && e.pageType !== 'board';

function partOf(e: JournalEntry, n: number): PartRow {
  const stored = e.pageSettings?.name?.trim() ?? '';
  return { id: e.id, n, name: stored || firstLine(e.text ?? '').trim(), named: !!stored, words: wordCount(e.text ?? '') };
}

/** The Doc the entry is a Part of, its Parts in her order, and which one the entry is (1-based). A name may be '' (an empty page): the reader
 *  draws its own word for that. */
export function partsOfDoc(entry: JournalEntry): DocParts {
  const set = entry.projectId ? getProject(entry.projectId) : null;
  if (set && !isAutoSet(set)) {
    const pages = getJournalEntries().filter((e) => e.projectId === set.id && live(e)).sort(compareSections);
    const at = pages.findIndex((e) => e.id === entry.id);
    if (at >= 0) return { doc: { id: set.id, name: set.title, set }, parts: pages.map((e, i) => partOf(e, i + 1)), here: at + 1 };
  }
  const only = partOf(entry, 1);
  return { doc: { id: entry.id, name: only.name, set: null }, parts: [only], here: 1 };
}

/** Name a Part: pageSettings.name, through the store's own write. An empty name removes the key (never '' or null); the same name is no write.
 *  A page that never chose its settings is given the app's floor beside the name, as a template is (ScriptEditor, grafts.ts): its dress reads
 *  the same. The host flushes the open page's typing first, so the text written back is the newest. */
export function renamePart(id: string, name: string): void {
  const latest = getJournalEntry(id);
  if (!latest) return;
  const next = name.trim();
  const had = latest.pageSettings?.name;
  if ((had ?? '') === next) return;
  if (!next) {
    if (!latest.pageSettings || had === undefined) return;
    const { name: _gone, ...rest } = latest.pageSettings;
    void _gone;
    saveJournalEntry({ ...latest, pageSettings: rest });
    return;
  }
  saveJournalEntry({ ...latest, pageSettings: { ...(latest.pageSettings ?? PAGE_SETTINGS_FALLBACK), name: next } });
}
