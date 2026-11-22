import type { DeskTermId } from '../store/deskLexicon';
import type { PartColor } from './parts';

// THE COLOUR SLOTS (Fable's ruling, Nov 20, 1:27 pm: "store slots a–f, never a colour name or a hex, for Parts AND assets. Each theme draws its
// own six (Machina tags A–F = Outline, Pale, Blue, Yellow, Mid, Solid; Flux 01–06). Box.color and pageSettings.color hold the slot.").
// ONE vocabulary: the slots are INK's PART_COLORS (reorg/parts.ts), re-exported here under the assets' names; this file adds only what the Assets
// tab draws (the letter, each slot's name). What is stored is only the slot; the theme draws it (Machina: the --reorg-tag-<slot>-fill / -ink /
// -edge tokens, 23-reorg-back.css).
export { PART_COLORS as COLOUR_SLOTS, isPartColor as isColourSlot, isHexColour, colourToStore, colorHex } from './parts';
// COLOUR B (Fable, Nov 21): beside the six slots a colour may be her own, exactly #RRGGBB (stored in capitals); the slots stay what a theme draws, a hex is drawn as it is (the picker's "Custom", ARBOR's).
export type ColourSlot = PartColor;

/** The tag's letter, the signal (Nick, Nov 11: "a label first, the colour second"). */
export const slotLetter = (s: ColourSlot): string => s.toUpperCase();

/** Each slot's name in the lexicon (Machina: Nick's Outline, Pale, Blue, Yellow, Mid, Solid). */
export const SLOT_WORD: Record<ColourSlot, DeskTermId> = { a: 'reorgTagA', b: 'reorgTagB', c: 'reorgTagC', d: 'reorgTagD', e: 'reorgTagE', f: 'reorgTagF' };
