// FLUX3 S4 - JACKED IN's session state (flux-rulings-oct31.md q8; Fable's S4 ruling D: the switch is IN-SESSION now; one shared users.switches
// store is built once, in Arbor's ship, and Flux uses it at its own ship). Nothing here is saved: a reload starts over with the default on.
//   - jackInDefault: "Jack In by default" (the spec's §10 switch). On, entering Free Write in Flux opens it Jacked In. Default ON (Nick: "opens in
//     Jacked In by default unless turned off").
//   - jacked: whether a Flux Typewriter is running right now (FluxJackedIn writes it; the idle glitch and the burst edge read it).
import { useSyncExternalStore } from 'react';

let jackInDefault = true;
let jacked = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());
const subscribe = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };

export function getJackInDefault(): boolean { return jackInDefault; }
export function setJackInDefault(on: boolean): void { if (jackInDefault === on) return; jackInDefault = on; emit(); }
export function useJackInDefault(): boolean { return useSyncExternalStore(subscribe, getJackInDefault, getJackInDefault); }

export function getJacked(): boolean { return jacked; }
export function setJacked(on: boolean): void { if (jacked === on) return; jacked = on; emit(); }
export function useJacked(): boolean { return useSyncExternalStore(subscribe, getJacked, getJacked); }
