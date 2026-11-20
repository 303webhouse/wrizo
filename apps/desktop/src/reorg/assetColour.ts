import { getJournalEntry, saveBoardBoxes, saveJournalEntry } from '../store/persistence';
import { liveBoxes } from '../store/boxTombstones';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import type { PageSettings } from '../types';
import type { GraftTarget } from '../store/grafts';
import { isColourSlot, type ColourSlot } from './colourSlots';

// COLOURS ON ASSETS (reorg plan 5.1, D4; Nick's saved-data sheet #14 "A", Nov 19; the slot ruling in ./colourSlots.ts). Behind ?reorg=1, Machina.
// A card's colour is its Box.color, inside the board's `boxes` jsonb, stamped with the box's own updatedAt (store/boxTombstones mergeBoxLists keeps
// the newer box, so the newer pick wins a merge by its own stamp). A board's or a doc's colour is its pageSettings.color, in the whole-blob
// page_settings jsonb, the same key a Part's colour uses (reorg plan tech §D3/D4), so a Part and its assets read as one thread. Schema change none.
// "No colour" REMOVES the key: absent is the one way to have none.

type WithColour = PageSettings & { color?: unknown };

/** The asset's slot, or null (no colour, a value that is not a slot, a gone card or page). */
export function assetColour(asset: GraftTarget): ColourSlot | null {
  const e = getJournalEntry(asset.entryId);
  if (!e) return null;
  if (asset.boxId) {
    const b = liveBoxes(e.boxes).find((x) => x.id === asset.boxId);
    return b && isColourSlot(b.color) ? b.color : null;
  }
  const c = (e.pageSettings as WithColour | undefined)?.color;
  return isColourSlot(c) ? c : null;
}

/** Store the slot (null: no colour). Writes nothing when it would change nothing; false when the asset is gone. */
export function setAssetColour(asset: GraftTarget, slot: ColourSlot | null): boolean {
  if (slot !== null && !isColourSlot(slot)) return false;
  const e = getJournalEntry(asset.entryId);
  if (!e) return false;
  if (asset.boxId) {
    // through the board's own write boundary (saveBoardBoxes): it takes the LIVE list and carries every tombstone and purge marker itself
    const live = liveBoxes(e.boxes);
    const card = live.find((x) => x.id === asset.boxId);
    if (!card) return false;
    if ((card.color ?? null) === slot) return true;
    const updatedAt = new Date().toISOString();
    saveBoardBoxes(asset.entryId, live.map((b) => {
      if (b.id !== asset.boxId) return b;
      const { color: _old, ...rest } = b;
      void _old;
      return slot === null ? { ...rest, updatedAt } : { ...rest, color: slot, updatedAt };
    }));
    return true;
  }
  const ps = e.pageSettings as WithColour | undefined;
  if ((ps?.color ?? null) === slot) return true;
  if (slot === null) {
    if (!ps || !('color' in ps)) return true;
    const { color: _gone, ...rest } = ps;
    void _gone;
    saveJournalEntry({ ...e, pageSettings: rest as PageSettings });
    return true;
  }
  saveJournalEntry({ ...e, pageSettings: { ...(ps ?? PAGE_SETTINGS_FALLBACK), color: slot } as PageSettings });
  return true;
}
