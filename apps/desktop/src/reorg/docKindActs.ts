import type { PageSettings } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import { getJournalEntry, getProject, saveJournalEntry } from '../store/persistence';
import { getUserPageDefaults } from '../store/pageDefaults';
import { createEmptyScriptDoc } from '../store/scriptDoc';
import { serializeScriptDoc } from '../store/scriptText';
import { ensureDoc, newPart, partsOfDoc, renamePart, setPartTemplate } from './parts';
import { setDocSetting, styleGuideOf } from './docSettings';
import {
  PRESETS, followStyle, pageSetupFor, placeSpecial, planPreset, specialName, specialOf, specialTemplate,
  type DocStyle, type PageSetupPatch, type SpecialKind,
} from './docKinds';

// THE DOC'S KIND MENU, ITS ACTS (Fable, Nov 20, 4:15 pm; the approved draft claude/wrizors/kind-menu-presets-draft.md). The menu (reorg/DocKindMenu.tsx, ARBOR's shell) calls these three; each is built on the Parts layer (parts.ts) and the Doc's own
// column (docSettings.ts), and the words and rules they follow are docKinds.ts. THE LAWS: no act writes a word, ink or a card (they write names, templates, order, Page Setup keys and the Doc's record); no act moves a Part she
// already has (a new Part goes after hers, never in among them but where a Special Part belongs); and an act that finds its work already done writes nothing.

function patchSetup(entryId: string, setup: PageSetupPatch): boolean {
  const e = getJournalEntry(entryId);
  if (!e || e.pageType === 'script' || e.pageType === 'board') return false;
  const cur = (e.pageSettings ?? {}) as unknown as Record<string, unknown>;
  const want = setup as unknown as Record<string, unknown>;
  const changes = Object.keys(want).filter(k => JSON.stringify(cur[k]) !== JSON.stringify(want[k]));
  if (!changes.length) return false;
  const base = { ...(e.pageSettings ?? getUserPageDefaults() ?? PAGE_SETTINGS_FALLBACK) } as unknown as Record<string, unknown>;
  for (const k of changes) base[k] = JSON.parse(JSON.stringify(want[k]));
  saveJournalEntry({ ...e, pageSettings: base as unknown as PageSettings });
  return true;
}

const styleOf = (entryId: string): DocStyle => styleGuideOf(entryId) ?? 'none';

export type StyleResult = { ok: true; setUp: number; renamed: number } | { ok: false; reason: 'unknown' };
/**
 * STYLE GUIDE: the Doc's own style guide is saved to its record (None clears it); the Page Setup the style sets is written onto each of the Doc's Parts (None leaves the Doc's Page Setup untouched); a Part still wearing one of
 * the style guides' own words for the sources Part (Works Cited, References, Bibliography, Sources) takes this one's. It never re-words her text.
 */
export function applyStyleGuide(entryId: string, style: DocStyle): StyleResult {
  const e = getJournalEntry(entryId);
  if (!e) return { ok: false, reason: 'unknown' };
  setDocSetting(entryId, { styleGuide: style === 'none' ? null : style });
  const set = e.projectId ? getProject(e.projectId) : null;
  const made = !!set && partsOfDoc(set.id).some(p => p.id === entryId);
  const parts = made && set ? partsOfDoc(set.id) : [];
  const ids = made ? parts.map(p => p.id) : [entryId];
  const setup = pageSetupFor(style);
  let setUp = 0;
  if (setup) for (const id of ids) if (patchSetup(id, setup)) setUp += 1;
  let renamed = 0;
  for (const p of parts) {
    if (!p.named) continue;
    const next = followStyle(p.name, style);
    if (next !== p.name && renamePart(p.id, next)) renamed += 1;
  }
  return { ok: true, setUp, renamed };
}

export type SpecialResult = { ok: true; id: string; made: boolean } | { ok: false; reason: 'unknown' | 'no-doc' | 'no-sources' };
/** SPECIAL PART: one click adds the Part in its right place, named by the style guide, as a template where it is one (Title Page, Bibliography); a Part already there is found, not made twice. AP has no sources Part. */
export function addSpecialPart(entryId: string, kind: SpecialKind): SpecialResult {
  const e = getJournalEntry(entryId);
  if (!e) return { ok: false, reason: 'unknown' };
  const style = styleOf(entryId);
  const name = specialName(kind, style);
  if (name === null) return { ok: false, reason: 'no-sources' };
  const doc = ensureDoc(entryId);
  if (!doc.ok) return { ok: false, reason: 'no-doc' };
  const plan = placeSpecial(partsOfDoc(doc.docId).map(p => ({ id: p.id, name: p.named ? p.name : '', template: p.template })), kind);
  if (plan.existing) return { ok: true, id: plan.existing, made: false };
  const id = newPart(doc.docId, { afterId: plan.afterId, name, template: specialTemplate(kind), level: 0 });
  if (!id) return { ok: false, reason: 'no-doc' };
  const setup = pageSetupFor(style);
  if (setup) patchSetup(id, setup);
  return { ok: true, id, made: true };
}

export type PresetResult = { ok: true; made: string[]; reused: string | null } | { ok: false; reason: 'unknown' | 'no-doc' | 'unknown-preset' | 'wrong-kind' };
/**
 * PRESET: its Parts are added to the Doc, empty and named, and the style guide's Page Setup is set on them. In an empty Doc they BECOME the Doc (its one empty Part is the first); in a Doc with words they go AFTER hers,
 * and nothing of hers moves or changes. A screenplay preset is for a Screenplay Doc and a standard one for any other; the other way round is refused.
 */
export function applyPreset(entryId: string, presetId: string): PresetResult {
  const e = getJournalEntry(entryId);
  if (!e) return { ok: false, reason: 'unknown' };
  const preset = PRESETS.find(p => p.id === presetId);
  if (!preset) return { ok: false, reason: 'unknown-preset' };
  const doc = ensureDoc(entryId);
  if (!doc.ok) return { ok: false, reason: 'no-doc' };
  const isScreenplay = getProject(doc.docId)?.kind === 'screenplay' || e.pageType === 'script' || e.pageSettings?.kind === 'screenplay';
  if ((preset.kind === 'screenplay') !== isScreenplay) return { ok: false, reason: 'wrong-kind' };
  const style = styleOf(entryId);
  const plan = planPreset(preset, style, partsOfDoc(doc.docId).map(p => ({ id: p.id, name: p.named ? p.name : '', words: p.words, template: p.template })));
  const setup = preset.kind === 'standard' ? pageSetupFor(style) : null;
  const tplOf = (name: string) => { const s = specialOf({ id: '', name, template: null }); return s ? specialTemplate(s) : null; };
  const made: string[] = [];
  // a Screenplay Doc's new Parts are screenplay pages (an empty script each), as its own pages are
  const seed = () => { const script = createEmptyScriptDoc(); return preset.kind === 'screenplay' ? { script, text: serializeScriptDoc(script) } : undefined; };
  if (plan.reuse && plan.firstName) {
    renamePart(plan.reuse, plan.firstName);
    const t = tplOf(plan.firstName);
    if (t) setPartTemplate(plan.reuse, t);
    if (setup) patchSetup(plan.reuse, setup);
  }
  let prev = plan.after;
  for (const name of plan.add) {
    const id = newPart(doc.docId, { afterId: prev, name, template: tplOf(name), level: 0, seed: seed() });
    if (!id) break;
    if (setup) patchSetup(id, setup);
    made.push(id);
    prev = id;
  }
  return { ok: true, made, reused: plan.reuse };
}
