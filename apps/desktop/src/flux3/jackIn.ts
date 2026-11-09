// FLUX3 S4 - JACKED IN's session state (flux-redesign-spec.md draft 21 §6; flux-rulings-oct31.md q8).
// JACK IN is a MODE in the top bar, not a switch (Nick, Nov 9): in Flux, under ?flux3=1, the free-writing slot IS Jacked In (choosing it is entering it, and
// there is no way to turn it off inside it), BUILD (Draft) never offers it, and an Esc tap or F9 leaves it to BUILD on the same doc. So there is no
// "Jack In by default" switch and no overlay on the shared Typewriter field any more: the mode decides (fluxJackMode, read by ModeStage).
//   - jacked: whether a Flux Typewriter is running right now (FluxJackedIn writes it; the idle glitch and the burst edge read it). Nothing is saved.
import { useSyncExternalStore } from 'react';
import { FLUX3 } from './flag';

let jacked = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());
const subscribe = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };

export function getJacked(): boolean { return jacked; }
export function setJacked(on: boolean): void { if (jacked === on) return; jacked = on; emit(); }
export function useJacked(): boolean { return useSyncExternalStore(subscribe, getJacked, getJacked); }

/** Flux under the flag: the free-writing slot is Jacked In and Draft/BUILD is the plain page (the Typewriter toggles are not offered in either). */
export function fluxJackMode(theme: string): boolean { return FLUX3 && theme === 'flux'; }

/** FluxJackedIn asks its host page to leave Jacked In for BUILD on the same doc (an Esc tap, F9); the page editor owns the mode. */
export const LEAVE_JACK_EVENT = 'flux3-leave-jack';
