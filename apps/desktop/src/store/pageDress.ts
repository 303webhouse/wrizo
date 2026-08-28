import { useSyncExternalStore } from 'react';
import { PAGE_SETTINGS_FALLBACK, type PageSettings } from '../types';

// ITEM 83 M3 (R6) — THE PAPER IS THE PREVIEW.
//
// PAGE SETUP's margins and line spacing must land on the writer's actual sheet
// as they choose them: no modal preview, no Apply, no committed-versus-draft
// state. A decision that is expensive to unmake will not be made.
//
// WHY A STORE RATHER THAN A PROP. The control lives in the cascade's PAGE face
// (CascadePanels.tsx, which holds the entry) and the sheet is rendered by
// ModeStage (which does not — it receives mode/words/refs, never the entry).
// Threading the entry down through ModeStage would touch every page host for a
// value only the paper's own CSS needs. This is the same tiny pub-sub shape as
// deskFrameActive.ts / menusDrawers.ts, and it carries ONE thing: the dress the
// visible sheet should wear right now.
//
// WHAT IT DOES NOT DO. Nothing here persists — the durable value is
// JournalEntry.pageSettings, written through saveJournalEntry by the control.
// This store is presentation only, so a stale value can never corrupt a page;
// worst case the sheet re-dresses on the next set.
//
// NUMBERS / HEADERS / FOOTERS are deliberately absent from the applied vars:
// F6's default makes them sheet furniture for print and export, with the
// screen page staying continuous. They are stored and exported, not painted.

let dress: PageSettings | null = null;
const listeners = new Set<() => void>();

export function setPageDress(next: PageSettings | null): void {
  dress = next;
  listeners.forEach(l => l());
}

/** The CSS custom properties the sheet wears. Kept here so the mapping from
 *  a semantic choice ('narrow') to a rendered measure lives in ONE place —
 *  the same one-source-of-truth discipline the anchor law enforces for
 *  geometry. index.css consumes these with its own values as the fallback,
 *  so a page with no dress renders exactly as it did before M3. */
export function dressVars(s: PageSettings | null): Record<string, string> {
  if (!s) return {};
  // A LENGTH, not a padding shorthand: the framed sheet multiplies its own
  // horizontal padding by --paper-scale (index.css), so handing it a finished
  // shorthand would silently drop that scaling at wide viewports — the exact
  // "two formulas for one number" failure this wave exists to remove. The var
  // carries only the base measure; CSS keeps ownership of the scale.
  const padX = s.margins === 'narrow' ? '26px' : s.margins === 'wide' ? '58px' : '38px';
  // lineHeight is a REAL property here rather than a custom property with a
  // fallback: `line-height: var(--x, 1.6)` in CSS would force 1.6 onto every
  // undressed page, overriding whatever it inherits today. Returning {} for an
  // undressed page sets nothing at all, which is the only way to guarantee
  // byte-identity with pre-M3 rendering.
  return { '--wz-page-pad-x': padX, lineHeight: String(s.lineSpacing) };
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
const getSnapshot = (): PageSettings | null => dress;

export function usePageDress(): PageSettings | null {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export { PAGE_SETTINGS_FALLBACK };
