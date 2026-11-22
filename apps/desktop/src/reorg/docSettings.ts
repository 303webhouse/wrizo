import type { DocAsset, DocSettings, JournalEntry, Project, StyleGuide } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import { getJournalEntry, getProject, isAutoSet, saveJournalEntry, saveProject } from '../store/persistence';
import { getUserPageDefaults } from '../store/pageDefaults';
import { REORG } from './flag';

// A DOC'S OWN SETTINGS (Fable, Nov 20; Nick ruled: "build the Doc-wide settings column"). A setting that belongs to the whole Doc (its style guide, how it goes out) lives in the Doc's OWN record, the projects
// row's `docSettings` (one nullable jsonb column, the `tutor` recipe: types/records.ts, server migrate.ts and sync.ts), and never in whichever Part happens to be first.
//   - Saved to the ACCOUNT and synced with the project, like every other thing she changes. Every key is ABSENT until she chooses (never null); the last key removed leaves docSettings = {} (an empty record: a push
//     with no field at all, from an older device, is kept as stored by the server's coalesce, so a clear has to be written), and a Doc that never chose has no docSettings and syncs byte-identically to today. A key this client does not know (a newer client's) is carried through every write.
//   - A made Doc (a set the writer made) is the Doc. A LOOSE page (the app's own set, one Part) is its own Doc: the shared set it sits in is never written; its style guide is the key a page already has
//     (pageSettings.styleGuide), and it has no export setting to keep (refused, not stored).
//   - READ: a made Doc's own style guide wins for every Part; with none on the Doc, the Part's own page says (what a page held before the column), else none.
// Writes go through the store's own saves (saveProject / saveJournalEntry); nothing here touches a word, an order or a name.

export const STYLE_GUIDES = ['mla', 'apa', 'chicago', 'ap'] as const;
export const isStyleGuide = (v: unknown): v is StyleGuide => typeof v === 'string' && (STYLE_GUIDES as readonly string[]).includes(v);
const EXPORT_FORMATS = ['md', 'txt', 'html'] as const;
const isExportFormat = (v: unknown): v is 'md' | 'txt' | 'html' => typeof v === 'string' && (EXPORT_FORMATS as readonly string[]).includes(v);

/** What a write may carry. `null` (or 'none' for the style guide) clears the key; absent leaves it alone. */
export interface DocSettingsPatch { styleGuide?: StyleGuide | 'none' | null; export?: { format?: 'md' | 'txt' | 'html'; includePlan?: boolean | null; attach?: string[] | null } | null; colourScheme?: ColourScheme }

/** The key an asset of the Doc is ticked under for export (item 5b): its entry's id, then "|", then the card's id when it is one card of a board ("page-1|", "board-1|c1"). */
export const attachKey = (a: { entryId: string; boxId?: string }): string => a.entryId + '|' + (a.boxId ?? '');
const isAttachList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string' && x.length > 0);
// COLOUR B (Nick, Nov 21 4:53 pm: "each Doc keeps its own scheme, saved with the account"; Fable 4:58 pm: doc_settings.colourScheme = 'default' | 'muted' |
// 'vivid', written through this guard and MERGED with the Doc's other keys). A made Doc only: a loose page has no Doc record of its own, so it
// keeps Default (refused here, not stored).
export const COLOUR_SCHEMES = ['default', 'muted', 'vivid'] as const;
export type ColourScheme = (typeof COLOUR_SCHEMES)[number];
export const isColourScheme = (v: unknown): v is ColourScheme => typeof v === 'string' && (COLOUR_SCHEMES as readonly string[]).includes(v);
/** The scheme this Part's Doc draws in: the Doc's own, else Default (a loose page, a missing page, a stray value). */
export function colourSchemeOf(entryId: string): ColourScheme {
  const s = docSettingsOf(entryId).colourScheme;
  return isColourScheme(s) ? s : 'default';
}

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
  // the "Include the Plan" tick (Fable, Nov 21: remembered per Doc, beside the format): only true is stored; null takes the key off
  if ('export' in patch && patch.export && patch.export.includePlan !== undefined && patch.export.includePlan !== null && patch.export.includePlan !== true) return false;
  // the assets she attaches (item 5b, Fable, Nov 21: remembered per Doc, beside the format and the Plan tick): a list of the keys she ticked; null or an empty list takes the key off; anything else is refused
  if ('export' in patch && patch.export && patch.export.attach !== undefined && patch.export.attach !== null && !isAttachList(patch.export.attach)) return false;
  if ('colourScheme' in patch && !isColourScheme(patch.colourScheme)) return false;
  const set = madeDocOf(e);
  if (!set) {
    // a loose page is its own Doc: its style guide is the key a page already has; it has no export setting and no scheme of its own
    if (patch.export !== undefined && patch.export !== null) return false;
    if ('colourScheme' in patch) return false;
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
    else if (patch.export !== undefined) {
      const merged: Record<string, unknown> = { ...(cur.export as object | undefined), ...patch.export };
      if (merged.includePlan === null) delete merged.includePlan;
      if (merged.attach === null || (Array.isArray(merged.attach) && merged.attach.length === 0)) delete merged.attach;
      else if (Array.isArray(merged.attach)) merged.attach = [...new Set(merged.attach as string[])];
      if (Object.keys(merged).length === 0) delete next.export; else next.export = merged;
    }
  }
  if ('colourScheme' in patch && isColourScheme(patch.colourScheme)) next.colourScheme = patch.colourScheme;
  if (JSON.stringify(next) === JSON.stringify(cur)) return false;
  const row = { ...set } as Project & Record<string, unknown>;
  // the last key removed leaves {} on the record, never absence and never null: the server keeps what it has for a push that carries none (an older device), so a clear must say so
  row.docSettings = next as DocSettings;
  saveProject(row);
  return true;
}

/** Whether this Doc remembers "Include the Plan" as ticked: true only for a stored true on the Doc this page is a Part of (a loose page, a missing page and a malformed value read false). */
export function includePlanOf(entryId: string): boolean {
  return docSettingsOf(entryId).export?.includePlan === true;
}

/** The assets this Doc remembers as ticked to go out (the keys, in the order the Back menu lists them): the stored list for the Doc this page is a Part of; absent, malformed, a loose page and a missing page read as none. */
export function attachedOf(entryId: string): string[] {
  const a = docSettingsOf(entryId).export?.attach;
  return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
}

/** An asset leaves the Doc: its tick goes with it, so an asset added again later is not found ticked (never by default). */
function pruneAttach(entryId: string, key: string): void {
  const cur = attachedOf(entryId);
  if (!cur.includes(key)) return;
  setDocSetting(entryId, { export: { attach: cur.filter((k) => k !== key) } });
}

// THE DOC'S OWN ASSETS (Nick ruled A, Nov 20, 11:55 pm: "Doc-level assets YES. Home: the Doc's settings column, key `assets` = [{entryId, boxId?, at}]").
// A made Doc only: a loose page is its own Doc of one Part, so its assets are that page's own links (the caller grafts instead; refused here).
// Each asset once (an entry, or a card of a board); `at` is when it joined. The last one removed leaves the key absent (docSettings {} when nothing else).
const sameAsset = (a: { entryId: string; boxId?: string }, b: { entryId: string; boxId?: string }): boolean => a.entryId === b.entryId && (a.boxId ?? '') === (b.boxId ?? '');
const isDocAsset = (v: unknown): v is DocAsset => !!v && typeof (v as DocAsset).entryId === 'string' && !!(v as DocAsset).entryId && typeof (v as DocAsset).at === 'string'
  && ((v as DocAsset).boxId === undefined || typeof (v as DocAsset).boxId === 'string');

/** Whether this Part belongs to a Doc she made (one that can hold Doc-level assets). */
export function hasMadeDoc(entryId: string): boolean {
  const e = getJournalEntry(entryId);
  return !!e && !!madeDocOf(e);
}

/** The Doc's own assets, in the order they joined (an empty list for a loose page or a Doc with none). */
export function docAssetsOf(entryId: string): DocAsset[] {
  const a = docSettingsOf(entryId).assets;
  return Array.isArray(a) ? a.filter(isDocAsset).map((x) => ({ ...x })) : [];
}

function writeDocAssets(entryId: string, next: DocAsset[]): boolean {
  const e = getJournalEntry(entryId);
  const set = e ? madeDocOf(e) : null;
  if (!set) return false;
  const cur = (set.docSettings ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = { ...cur };
  if (next.length > 0) out.assets = next; else delete out.assets;
  if (JSON.stringify(out) === JSON.stringify(cur)) return false;
  saveProject({ ...set, docSettings: out as DocSettings });
  return true;
}

/** Connect an asset to the whole Doc this Part belongs to. False: a loose page, a missing asset, or one already there. */
export function addDocAsset(entryId: string, asset: { entryId: string; boxId?: string }): boolean {
  if (!asset.entryId || !getJournalEntry(asset.entryId)) return false;
  const list = docAssetsOf(entryId);
  if (list.some((a) => sameAsset(a, asset))) return false;
  return writeDocAssets(entryId, [...list, { entryId: asset.entryId, ...(asset.boxId ? { boxId: asset.boxId } : {}), at: new Date().toISOString() }]);
}

/** Take an asset off the Doc (its Parts' own links are untouched). */
export function removeDocAsset(entryId: string, asset: { entryId: string; boxId?: string }): boolean {
  const list = docAssetsOf(entryId);
  const next = list.filter((a) => !sameAsset(a, asset));
  if (next.length === list.length) return false;
  const done = writeDocAssets(entryId, next);
  if (done) pruneAttach(entryId, attachKey(asset));
  return done;
}

// the harness's door, present only under the reorg switch
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoDocSettings?: unknown }).wrizoDocSettings = { of: docSettingsOf, styleGuideOf, colourScheme: colourSchemeOf, set: setDocSetting, includePlan: includePlanOf, attached: attachedOf, assets: docAssetsOf, addAsset: addDocAsset, removeAsset: removeDocAsset };
}
