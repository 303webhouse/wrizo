import type { DocSettings, JournalEntry, Project, StyleGuide } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import { getJournalEntry, getProject, isAutoSet, saveJournalEntry, saveProject } from '../store/persistence';
import { getUserPageDefaults } from '../store/pageDefaults';
import { REORG } from './flag';

// A DOC'S OWN SETTINGS (Fable, Nov 20; Nick ruled: "build the Doc-wide settings column"). A setting that belongs to the whole Doc (its style guide, how it goes out) lives in the Doc's OWN record, the projects
// row's `docSettings` (one nullable jsonb column, the `tutor` recipe: types/records.ts, server migrate.ts and sync.ts), and never in whichever Part happens to be first.
//   - Saved to the ACCOUNT and synced with the project, like every other thing she changes. Every key is ABSENT until she chooses (never null; the last key removed removes docSettings itself), so a Doc that never
//     chose syncs byte-identically to today. A key this client does not know (a newer client's) is carried through every write.
//   - A made Doc (a set the writer made) is the Doc. A LOOSE page (the app's own set, one Part) is its own Doc: the shared set it sits in is never written; its style guide is the key a page already has
//     (pageSettings.styleGuide), and it has no export setting to keep (refused, not stored).
//   - READ: a made Doc's own style guide wins for every Part; with none on the Doc, the Part's own page says (what a page held before the column), else none.
// Writes go through the store's own saves (saveProject / saveJournalEntry); nothing here touches a word, an order or a name.

export const STYLE_GUIDES = ['mla', 'apa', 'chicago', 'ap'] as const;
export const isStyleGuide = (v: unknown): v is StyleGuide => typeof v === 'string' && (STYLE_GUIDES as readonly string[]).includes(v);
const EXPORT_FORMATS = ['md', 'txt', 'html'] as const;
const isExportFormat = (v: unknown): v is 'md' | 'txt' | 'html' => typeof v === 'string' && (EXPORT_FORMATS as readonly string[]).includes(v);

/** What a write may carry. `null` (or 'none' for the style guide) clears the key; absent leaves it alone. */
export interface DocSettingsPatch { styleGuide?: StyleGuide | 'none' | null; export?: { format?: 'md' | 'txt' | 'html' } | null }

/** The set she made that this page is a Part of; null for a loose page (the app's own set, or none). */
function madeDocOf(entry: JournalEntry): Project | null {
  const set = entry.projectId ? getProject(entry.projectId) : null;
  return set && !isAutoSet(set) ? set : null;
}

/** The Doc's own settings as stored (an empty object when it chose none). A loose page has none of its own here. */
export function docSettingsOf(entryId: string): DocSettings {
  const e = getJournalEntry(entryId);
  const set = e ? madeDocOf(e) : null;
  return set && set.docSettings ? { ...set.docSettings } : {};
}

/** The style guide this Part is under: its Doc's own, else the page's own, else none. */
export function styleGuideOf(entryId: string): StyleGuide | null {
  const e = getJournalEntry(entryId);
  if (!e) return null;
  const set = madeDocOf(e);
  if (set && isStyleGuide(set.docSettings?.styleGuide)) return set.docSettings.styleGuide;
  return isStyleGuide(e.pageSettings?.styleGuide) ? e.pageSettings.styleGuide : null;
}

const isClear = (v: unknown): boolean => v === null || v === 'none';

/** Write the Doc's settings for the Doc this Part belongs to. Returns whether anything was written: a refused value (nothing written), a Part with no such Doc, or the same value again, is false. */
export function setDocSetting(entryId: string, patch: DocSettingsPatch): boolean {
  const e = getJournalEntry(entryId);
  if (!e) return false;
  // validate first: one bad value writes nothing at all
  if ('styleGuide' in patch && !isClear(patch.styleGuide) && !isStyleGuide(patch.styleGuide)) return false;
  if ('export' in patch && patch.export !== null && patch.export !== undefined && patch.export.format !== undefined && !isExportFormat(patch.export.format)) return false;
  const set = madeDocOf(e);
  if (!set) {
    // a loose page is its own Doc: its style guide is the key a page already has; it has no export setting
    if (patch.export !== undefined && patch.export !== null) return false;
    if (!('styleGuide' in patch)) return false;
    const cur = e.pageSettings?.styleGuide;
    const next = isClear(patch.styleGuide) ? undefined : (patch.styleGuide as StyleGuide);
    if (cur === next || (cur === undefined && next === undefined)) return false;
    const base = { ...(e.pageSettings ?? getUserPageDefaults() ?? PAGE_SETTINGS_FALLBACK) } as Record<string, unknown>;
    if (next === undefined) delete base.styleGuide; else base.styleGuide = next;
    saveJournalEntry({ ...e, pageSettings: base as unknown as JournalEntry['pageSettings'] });
    return true;
  }
  const cur = (set.docSettings ?? {}) as Record<string, unknown>;
  const next: Record<string, unknown> = { ...cur };
  if ('styleGuide' in patch) { if (isClear(patch.styleGuide)) delete next.styleGuide; else next.styleGuide = patch.styleGuide; }
  if ('export' in patch) {
    if (patch.export === null) delete next.export;
    else if (patch.export !== undefined) next.export = { ...(cur.export as object | undefined), ...patch.export };
  }
  if (JSON.stringify(next) === JSON.stringify(cur)) return false;
  const row = { ...set } as Project & Record<string, unknown>;
  if (Object.keys(next).length === 0) delete row.docSettings; else row.docSettings = next as DocSettings;
  saveProject(row);
  return true;
}

// the harness's door, present only under the reorg switch
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoDocSettings?: unknown }).wrizoDocSettings = { of: docSettingsOf, styleGuideOf, set: setDocSetting };
}
