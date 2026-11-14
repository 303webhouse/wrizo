// FLUX3 S4 - JACKED IN's session state (flux-redesign-spec.md draft 21 §6; flux-rulings-oct31.md q8).
// JACK IN is a MODE in the top bar, not a switch (Nick, Nov 9): in Flux, under ?flux3=1, the free-writing slot IS Jacked In (choosing it is entering it, and
// there is no way to turn it off inside it), BUILD (Draft) never offers it, and an Esc tap or F9 leaves it to BUILD on the same doc. So there is no
// "Jack In by default" switch and no overlay on the shared Typewriter field any more: the mode decides (fluxJackMode, read by ModeStage).
//   - jacked: whether a Flux Typewriter is running right now (FluxJackedIn writes it; the idle glitch and the burst edge read it). Nothing is saved.
import { useSyncExternalStore } from 'react';
// WIRE IN ON ITS OWN (Fable, Nov 12 6:50 pm): the flag no longer gates this mode. The Corridor is Flux's Typewriter for every writer in Flux; the redesign's other pieces stay behind ?flux3=1.

let jacked = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());
const subscribe = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };

export function getJacked(): boolean { return jacked; }
export function setJacked(on: boolean): void { if (jacked === on) return; jacked = on; emit(); }
export function useJacked(): boolean { return useSyncExternalStore(subscribe, getJacked, getJacked); }

/** Flux: the free-writing slot (Wire In) is the Corridor and Draft (TEXT today, BUILD later) is the plain page; the paper Typewriter is retired in Flux and its toggles are not offered (flux-wirein.css). No flag. */
export function fluxJackMode(theme: string): boolean { return theme === 'flux'; }

/** FluxJackedIn asks its host page to leave Jacked In for BUILD on the same doc (an Esc tap, F9); the page editor owns the mode. */
export const LEAVE_JACK_EVENT = 'flux3-leave-jack';

/** THE KEY THAT LEAVES, in one place. The handler (FluxJackedIn) and the exit line (FluxJackedHints) both read these, so the line names the key that actually leaves and stays true if the key changes.
 *  Escape is the primary (a TAP: a key held under ESC_TAP_MS); F9 is the backup for browsers that cannot lock Escape while full screen (a held Escape exits full screen there). */
export const LEAVE_KEY = 'Escape';
export const LEAVE_KEY_BACKUP = 'F9';
const KEY_LABEL: Record<string, string> = { Escape: 'Esc', F9: 'F9' };
export const keyLabel = (key: string): string => KEY_LABEL[key] ?? key;
/** The key the exit line names: Escape, except in a full-screen browser that cannot lock it (there a tap on Escape would not reach the page, so the backup is the honest one). */
export function leaveKeyNow(): string {
  const kb = (typeof navigator !== 'undefined' ? (navigator as unknown as { keyboard?: { lock?: unknown } }).keyboard : undefined);
  return typeof document !== 'undefined' && document.fullscreenElement && !kb?.lock ? LEAVE_KEY_BACKUP : LEAVE_KEY;
}
/** Leave Jacked In for BUILD on the same doc, caret at the end, full screen kept. The ONE function an Esc tap, F9 and the circled X all call. */
export function leaveJackedIn(): void { window.dispatchEvent(new CustomEvent(LEAVE_JACK_EVENT)); }

export const EXIT_LINE_MS = 3000;   // the entry line shows this long
export const EXIT_FADE_MS = 600;    // and fades over this
