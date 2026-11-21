import type { JournalEntry, Project } from '../types';
import { getJournalEntry, getProject, isAutoSet } from '../store/persistence';
import { firstLine } from '../store/entryText';
import { wordCount } from '../store/wordCount';
import { isPartColor, partsOfDoc as inkPartsOfDoc, renamePart as inkRenamePart, type PartColor, type PartLevel } from './parts';

// THE PARTS SEAM (agreed with INK, Nov 19): everything that reads Parts (the top rail, the Front menu's Parts list, the moves between Parts)
// imports from here and from nowhere else. Since train D this file is the ADAPTER over INK's layer (reorg/parts.ts), which owns the model and
// every write: a set she made is one Doc and its live non-board pages are its Parts, in her order, with their levels and colours; any other
// page (a page in an app-made set, a loose page, a Journal page) is a one-Part Doc. A Part's name is pageSettings.name (Nick's ruling, Nov 19:
// saved with the account); a Part with no name reads its first words (INK's rule), and one with no words reads '' so the reader draws its own
// word for it (reorgUntitled), never an English literal.

export interface PartRow {
  id: string;
  n: number;
  name: string;
  named: boolean;
  words: number;
  /** 0 to 2, as drawn (INK's effectiveLevels). */
  level: PartLevel;
  /** A token name from PART_COLORS, or null. */
  color: PartColor | null;
  /** A screenplay Part lists, moves and colours, but has no plain text to split or join. */
  kind: 'text' | 'script';
}
export interface DocParts { doc: { id: string; name: string; set: Project | null }; parts: PartRow[]; here: number }

/** The Doc the entry is a Part of, its Parts in her order, and which one the entry is (1-based). A name may be '' (an empty page): the reader
 *  draws its own word for that. */
export function partsOfDoc(entry: JournalEntry): DocParts {
  const set = entry.projectId ? getProject(entry.projectId) : null;
  if (set && !isAutoSet(set)) {
    const parts = inkPartsOfDoc(set.id);
    const at = parts.findIndex((p) => p.id === entry.id);
    if (at >= 0) {
      return {
        doc: { id: set.id, name: set.title, set },
        parts: parts.map((p) => ({ id: p.id, n: p.index + 1, name: p.named || p.words > 0 ? p.name : '', named: p.named, words: p.words, level: p.level, color: p.color, kind: p.kind })),
        here: at + 1,
      };
    }
  }
  // a one-Part Doc: the entry alone, read the way INK reads a Part's name (its own, else its first line)
  const stored = (entry.pageSettings as { name?: unknown } | undefined)?.name;
  const own = typeof stored === 'string' ? stored.trim() : '';
  const text = entry.pageType === 'script' ? '' : (entry.text ?? '');
  const c = (entry.pageSettings as { color?: unknown } | undefined)?.color;
  const only: PartRow = { id: entry.id, n: 1, name: own || firstLine(text).trim(), named: !!own, words: wordCount(text), level: 0, color: isPartColor(c) ? c : null, kind: entry.pageType === 'script' ? 'script' : 'text' };
  return { doc: { id: entry.id, name: only.name, set: null }, parts: [only], here: 1 };
}

/** Name a Part (INK's write: pageSettings.name; blank removes it; the same name is no write). The host flushes the open page's typing first. */
export function renamePart(id: string, name: string): void {
  if (!getJournalEntry(id)) return;
  inkRenamePart(id, name);
}
