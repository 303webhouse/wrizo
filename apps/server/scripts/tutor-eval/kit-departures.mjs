// TUTOR-B — THE DELIBERATE DEPARTURES FROM THE KIT'S PROMPT WORDS (the first: Fable, Nov 23, 6:14 pm), held in ONE place as named edits to the kit's own text (prompts-v0.5.json stays the kit, word for word), so the checks that compare
// the shipped prompts with the kit (tutor-prompts.mjs, tutor-eval-runner.mjs, tutor-theme-wire.mjs, tutor-safety-marker.mjs) apply exactly these edits and nothing else can drift.
// (The earlier second departure, the CONTEXT line, is gone: the kit's v0.4 CONTEXT now carries those three rules, and the code ships the kit's words.)
//   the kit's SAFETY bullet says: "reply only with the fixed safety message supplied by Wrizo". The server ships the same bullet with a MARKER in place of that clause: the model replies with one fixed marker only, and the
//   server swaps any reply that holds the marker for Nick's exact words (the kit's section 8, approved Nov 23, 5:23 pm), which the model never writes and the reply guard never reads.
export const SAFETY_MARKER = '[[WRIZO-SAFETY]]';
export const KIT_SAFETY_CLAUSE = 'and reply only with the fixed safety message supplied by Wrizo.';
export const SHIPPED_SAFETY_CLAUSE = `and reply with this one marker only, nothing else: ${SAFETY_MARKER}`;

//   THE SECOND (TUTOR-B, Nov 25, #131, M4): the live run's replies quoted 9 and more of her words in a row, some without quotation marks, against "Quote at most 8 of her words to locate a place". The server
//   ships the same rule said so it cannot be read as "per pair of quotation marks".
export const KIT_QUOTE_RULE = 'Quote at most 8 of her words to locate a place.';
export const SHIPPED_QUOTE_RULE = 'Quote at most 8 of her words in a row to locate a place,\n   with or without quotation marks. For a longer sentence, quote only part of it.';

// the kit's blocks with the departures applied; throws if the kit's text no longer holds a place they edit
export function withDepartures(blocks) {
  if (!blocks.base.includes(KIT_SAFETY_CLAUSE)) throw new Error('the kit text no longer holds the place the departure edits');
  if (!blocks.base.includes(KIT_QUOTE_RULE)) throw new Error('the kit text no longer holds the place the departure edits');
  return { ...blocks, base: blocks.base.replace(KIT_SAFETY_CLAUSE, () => SHIPPED_SAFETY_CLAUSE).replace(KIT_QUOTE_RULE, () => SHIPPED_QUOTE_RULE) };
}
