// EACH THEME'S FLOURISH IS ON UNTIL SHE TURNS IT OFF (the flourish spec §7; Nick ruled it, Nov 26, 4:14 pm) - Arbor's Rhizome, Flux's Glitch, Machina's Run - and
// DISTRACTION FREE turns every one off. Saved to her account in users.prefs (reorg/prefsSaved.ts), two switchless facts:
//   flourishOff     { plateau?, machina?, flux? } - true once she turned that theme's off, false after she turned it back on; absent = on. One stamp per theme
//                   (fieldAt), so two devices turning off different themes both keep theirs.
//   distractionFree { on: true } - absent = off. (Its own switch, and what else it quiets, wait for the Wrizors' frames and Nick's yes.)
// The old shared progress style no longer decides whether a flourish shows. It is still written alongside for Arbor and Flux: Flux's own drawing reads it until
// Glitch v2 (FIX) reads these facts.
//
// TEST-ONLY PIN: window.__wrizoFlourishPin (scripts/runtime-verify.mjs, unless WS_FLOURISH=1) keeps the behaviour every older harness was written against - the
// shared style decides, Machina's Run is on, nothing here writes a fact.
import { useSyncExternalStore } from 'react';
import { getPref, setPref, subscribePrefs } from '../reorg/prefsSaved';
import { getWritingSettings, setWritingSettings, subscribeWritingSettings } from './writingSettings';
import type { ThemeId } from './theme';

export const FLOURISH_FACT = 'flourishOff';
export const DISTRACTION_FACT = 'distractionFree';

export const flourishPinned = (): boolean => typeof window !== 'undefined' && (window as unknown as { __wrizoFlourishPin?: boolean }).__wrizoFlourishPin === true;

export function distractionFree(): boolean { return !flourishPinned() && getPref(DISTRACTION_FACT)?.on === true; }
/** Her switch (Session's first row). Off is saved too, so it wins over an older "on" from another device. */
export function setDistractionFree(on: boolean): void { if (!flourishPinned()) setPref(DISTRACTION_FACT, { on }); }

/** Is this theme's flourish wanted (hers on, and not Distraction Free)? Whether it is DRAWN also depends on Progress and a goal. */
export function flourishWanted(theme: ThemeId): boolean {
  if (flourishPinned()) return theme === 'machina' ? true : getWritingSettings().progressStyle === 'rhizome';
  return !distractionFree() && getPref(FLOURISH_FACT)?.[theme] !== true;
}

/** Her act: this theme's flourish off or on. The other themes' choices stay as they are. */
export function setFlourishOff(theme: ThemeId, off: boolean): void {
  // Arbor's and Flux's older style follows, so what reads it still agrees (Machina draws one instrument and has no style)
  if (theme !== 'machina') setWritingSettings({ progressStyle: off ? 'bar' : 'rhizome' });
  if (flourishPinned()) return;
  const was = (getPref(FLOURISH_FACT) ?? { at: '' }) as Record<string, unknown>;
  const { at: _at, fieldAt, ...fields } = was;
  void _at;
  const stamps: Record<string, string> = { ...((fieldAt as Record<string, string>) ?? {}) };
  let t = Date.now();
  if (stamps[theme]) t = Math.max(t, Date.parse(stamps[theme]) + 1);   // two acts inside one millisecond still read in order
  stamps[theme] = new Date(t).toISOString();
  setPref(FLOURISH_FACT, { ...fields, [theme]: off, fieldAt: stamps });
}

// MACHINA'S WAY BACK is its own switch, "Use Theme Progress Tracker" (the spec: Machina keeps it): it reads on only while the Run is hers too, and turning it on
// brings the Run back. Arbor and Flux read and write the tracker setting alone, as before.
export const themeTrackerOn = (theme: ThemeId, tracker: boolean): boolean => tracker !== false && (theme !== 'machina' || flourishWanted('machina'));
export function setThemeTracker(theme: ThemeId, on: boolean): void {
  setWritingSettings({ themeTracker: on });
  if (on && theme === 'machina' && !flourishPinned() && getPref(FLOURISH_FACT)?.machina === true) setFlourishOff('machina', false);
}

const subscribe = (fn: () => void): (() => void) => {
  const a = subscribePrefs(fn), b = subscribeWritingSettings(fn);
  return () => { a(); b(); };
};

export function useDistractionFree(): boolean {
  return useSyncExternalStore(subscribe, distractionFree);
}

// <html data-distraction-free> while it is on: the sheets and the shared stillness reader (store/ambianceDial.ts) read it there
if (typeof document !== 'undefined') {
  const mark = (): void => { document.documentElement?.toggleAttribute?.('data-distraction-free', distractionFree()); };
  mark();
  subscribePrefs(mark);
}

export function useFlourish(theme: ThemeId): boolean {
  return useSyncExternalStore(subscribe, () => flourishWanted(theme));
}
