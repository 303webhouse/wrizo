// IN-APP-COPY-FORMAT, THE COPY HALF (Nick's ruling, Oct 16; docs/in-app-copy-format-plan.md @ f2a9f956). A copy from a writing surface
// puts TWO formats on the clipboard: the plain characters for every other app, and Wrizo's own stored markup for Wrizo.
// RED-FIRST STUB: this is today's native copy - the raw stored slice, hidden marks and escapes included - so the check can go red on it.
export const WRIZO_MIME = 'application/x-wrizo-fragment';

export interface CopyPayload {
  /** The plain characters: no marks, no escapes, no structure tokens (what any other app receives). */
  plain: string;
  /** The stored markup of the selection, balanced (what Wrizo receives). */
  fragment: string;
}

export function copyPayload(text: string, s: number, e: number): CopyPayload {
  const raw = text.slice(Math.min(s, e), Math.max(s, e));
  return { plain: raw, fragment: raw };
}

/** The Wrizo envelope written under WRIZO_MIME: the fragment, with the plain text it was copied beside. */
export function writeEnvelope(p: CopyPayload): string {
  return JSON.stringify({ v: 1, text: p.fragment, plain: p.plain });
}
