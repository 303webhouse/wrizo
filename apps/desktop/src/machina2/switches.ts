// MACHINA v2 MOCKUP - the theme's per-feature switches (spec §11) and the Run's unit (spec §7), IN-SESSION ONLY (Fable ruling 7: storage is
// Nick's call, as Arbor's). Held in this module and mirrored onto <html> as attributes (data-machina2-off, data-machina2-run) for the CSS and
// for the components that read them; nothing reaches storage. No default is ruled: the mockup opens with every switch on and the Run in words.
// r4: the blue wash and its switch are gone (the Wrizors and Fable, Nov 1: "Drop Blue wash").
// No imports, so the browserless unit (scripts/harness/machina2-unit.mjs) loads it as is.
export type SwitchKey = 'command' | 'readout' | 'run' | 'asks' | 'legend';
export type RunUnit = 'words' | 'parts';

let off: SwitchKey[] = [];
let runUnit: RunUnit = 'words';
const listeners = new Set<() => void>();

function mirror(): void {
  if (typeof document === 'undefined') return;
  const r = document.documentElement;
  if (off.length) r.setAttribute('data-machina2-off', off.join(' ')); else r.removeAttribute('data-machina2-off');
  r.setAttribute('data-machina2-run', runUnit);
}

export function getSwitches(): { off: SwitchKey[]; runUnit: RunUnit } { return { off: [...off], runUnit }; }
export function isOn(k: SwitchKey): boolean { return !off.includes(k); }
export function getRunUnit(): RunUnit { return runUnit; }

/** setSwitch(key, on) turns a feature on or off; setSwitch('runUnit', unit) picks the Run's unit. In session only. */
export function setSwitch(k: SwitchKey | 'runUnit', v: boolean | RunUnit): void {
  if (k === 'runUnit') runUnit = v === 'parts' ? 'parts' : 'words';
  else off = v ? off.filter((x) => x !== k) : off.includes(k) ? off : [...off, k];
  mirror();
  listeners.forEach((fn) => fn());
}

export function subscribeSwitches(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }


/** Called by mount.tsx once the flag is on: only then are the attributes written (a component that merely imports this module writes nothing). */
export function initSwitches(): void { mirror(); }
