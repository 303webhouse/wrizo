import type { DeskTermId } from '../store/lexicon/terms';
import { flushNow, getJournalEntry } from '../store/persistence';
import { applyPreset, applyStyleGuide } from './docKindActs';
import { ensureDoc, partsOfDoc } from './parts';
import { PLAN_PRESETS } from './backMenu/planPresets';
import { loadPlanPreset } from './backMenu/planPresetLoad';
import type { GuidePick } from './presetGuide';

// THE GUIDE'S START (PRESETS-B, Nov 25; the brief's rule 3). Start does what PICKING that preset does today (docKindActs.ts applyPreset), plus at most one live Plan load (the PLAN tab's own loader, planPresetLoad.ts), plus the style guide
// through the live style-guide path (applyStyleGuide) when she gave one. Nothing is saved beyond what those three already save: the Guide itself writes nothing, and "Blank" writes nothing at all.
// The Doc must already be born (the host makes it, of the kind the pick needs: presetGuide.ts kindOf): this act only fills it. It returns the Part the Doc opens on (its first), for the host to open with the caret in it.
export type GuideStartResult = { ok: true; firstPartId: string; made: number; planRows: number } | { ok: false; reason: 'unknown' | 'no-doc' | 'wrong-kind' | 'unknown-structure' };

export function startGuide(entryId: string, p: GuidePick, t: (k: DeskTermId) => string): GuideStartResult {
  if (!getJournalEntry(entryId)) return { ok: false, reason: 'unknown' };
  const doc = ensureDoc(entryId);
  if (!doc.ok) return { ok: false, reason: 'no-doc' };
  const structure = p.structure ? PLAN_PRESETS.find((x) => x.id === p.structure) : undefined;
  if (p.structure && !structure) return { ok: false, reason: 'unknown-structure' };
  if (p.preset) {
    const got = applyPreset(entryId, p.preset);
    if (!got.ok) return { ok: false, reason: (got as { reason: string }).reason === 'wrong-kind' ? 'wrong-kind' : 'no-doc' };
  }
  if (p.style) applyStyleGuide(entryId, p.style);
  const first = partsOfDoc(doc.docId)[0]?.id ?? entryId;
  let planRows = 0;
  if (structure) { if (loadPlanPreset(first, structure, t)) planRows = structure.rows.length; }
  flushNow();
  return { ok: true, firstPartId: first, made: p.preset ? partsOfDoc(doc.docId).length : 0, planRows };
}
