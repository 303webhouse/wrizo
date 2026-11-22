import { getJournalEntry, saveBoardBoxes } from '../store/persistence';
import { liveBoxes } from '../store/boxTombstones';
import type { GraftTarget } from '../store/grafts';
import { colorHex, colorSlot, colourToStore, setPartColor, type PartHex } from './parts';
import { isColourSlot, type ColourSlot } from './colourSlots';

// COLOURS ON ASSETS (reorg plan 5.1, D4; Nick's saved-data sheet #14 "A", Nov 19; the slot ruling in ./colourSlots.ts). Behind ?reorg=1, Machina.
// A card's colour is its Box.color, inside the board's `boxes` jsonb, stamped with the box's own updatedAt (store/boxTombstones mergeBoxLists keeps
// the newer box, so the newer pick wins a merge by its own stamp); a card never held a colour name, so only a slot reads as a colour. A board's or a
// doc's colour is its pageSettings.color, the SAME key a Part's colour uses, read and written by INK's reorg/parts.ts (colorSlot, setPartColor;
// agreed with INK, Nov 20: one writer of that key), so a Part and its assets read as one thread. Schema change none. "No colour" REMOVES the key.
// COLOUR B (Fable, Nov 21): the colour is a slot a-f OR exactly #RRGGBB (her own custom colour, in capitals), validated here and in parts.ts; anything else is refused. assetColour is the slot, assetHex the hex; a card never held an old
// colour name, so only a slot or a hex reads as a card's colour.

/** The asset's slot, or null (no colour, a value that is not a slot, a gone card or page). */
export function assetColour(asset: GraftTarget): ColourSlot | null {
  const e = getJournalEntry(asset.entryId);
  if (!e) return null;
  if (asset.boxId) {
    const b = liveBoxes(e.boxes).find((x) => x.id === asset.boxId);
    return b && isColourSlot(b.color) ? b.color : null;
  }
  return colorSlot(e.pageSettings?.color);
}

/** The asset's custom colour (#RRGGBB, capitals), or null (no colour, a slot, a value that is not exactly a hex, a gone card or page). */
export function assetHex(asset: GraftTarget): PartHex | null {
  const e = getJournalEntry(asset.entryId);
  if (!e) return null;
  if (asset.boxId) {
    const b = liveBoxes(e.boxes).find((x) => x.id === asset.boxId);
    return b ? colorHex(b.color) : null;
  }
  return colorHex(e.pageSettings?.color);
}

/** Store the colour: a slot, or exactly #RRGGBB (written in capitals); null: no colour. Anything else is refused. Writes nothing when it would change nothing; false when refused or the asset is gone. */
export function setAssetColour(asset: GraftTarget, colour: ColourSlot | PartHex | null): boolean {
  const value = colour === null ? null : colourToStore(colour);
  if (colour !== null && value === null) return false;
  const e = getJournalEntry(asset.entryId);
  if (!e) return false;
  if (!asset.boxId) { setPartColor(asset.entryId, value); return true; }
  // a card: through the board's own write boundary (saveBoardBoxes), which takes the LIVE list and carries every tombstone and purge marker itself
  const live = liveBoxes(e.boxes);
  const card = live.find((x) => x.id === asset.boxId);
  if (!card) return false;
  if ((card.color ?? null) === value) return true;
  const updatedAt = new Date().toISOString();
  saveBoardBoxes(asset.entryId, live.map((b) => {
    if (b.id !== asset.boxId) return b;
    const { color: _old, ...rest } = b;
    void _old;
    return value === null ? { ...rest, updatedAt } : { ...rest, color: value, updatedAt };
  }));
  return true;
}
