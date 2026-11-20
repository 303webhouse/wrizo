import type { DeskTermId } from '../store/deskLexicon';

// THE COLOUR SLOTS (Fable's ruling, Nov 20, 1:27 pm: "store slots a–f, never a colour name or a hex, for Parts AND assets. Each theme draws its
// own six (Machina tags A–F = Outline, Pale, Blue, Yellow, Mid, Solid; Flux 01–06). Box.color and pageSettings.color hold the slot.").
// What is stored is only the slot; the theme draws it (Machina: the --reorg-tag-<slot>-fill / -ink / -edge tokens, 23-reorg-back.css). A stored
// value that is not a slot (a name or a hex written before the ruling) reads as no colour and is never written back.

export const COLOUR_SLOTS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;
export type ColourSlot = (typeof COLOUR_SLOTS)[number];

export const isColourSlot = (v: unknown): v is ColourSlot => typeof v === 'string' && (COLOUR_SLOTS as readonly string[]).includes(v);

/** The tag's letter, the signal (Nick, Nov 11: "a label first, the colour second"). */
export const slotLetter = (s: ColourSlot): string => s.toUpperCase();

/** Each slot's name in the lexicon (Machina: Nick's Outline, Pale, Blue, Yellow, Mid, Solid). */
export const SLOT_WORD: Record<ColourSlot, DeskTermId> = { a: 'reorgTagA', b: 'reorgTagB', c: 'reorgTagC', d: 'reorgTagD', e: 'reorgTagE', f: 'reorgTagF' };
