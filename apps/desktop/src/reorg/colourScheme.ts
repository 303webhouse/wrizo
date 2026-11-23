import { useEffect, useSyncExternalStore } from 'react';
import { flushNow, subscribe } from '../store/persistence';
import { colourSchemeOf, setDocSetting, COLOUR_SCHEMES, type ColourScheme } from './docSettings';
import { REORG } from './flag';

// COLOUR B, THE SCHEMES (Nick, Nov 21 3:30 pm: Default / Muted / Vivid on the slots A-F; the Wrizors' concept, claude/wrizors/part-colours-concept.md
// §1). A scheme recolours every slot at once and moves no Part's letter; what a Part or card stores is still its slot (or its own #RRGGBB).
// WHERE IT IS KEPT (Nick, 4:53 pm: "each Doc keeps its own scheme, saved with the account"; Fable 4:58 pm): the Doc's own settings,
// doc_settings.colourScheme, written through docSettings.ts's guard and merged with the Doc's other keys. A loose page has no Doc record, so it
// keeps Default. The scheme of the Doc on screen is put on <html> as data-colour-scheme (the page's top rail calls useSchemeOnPage), and
// styles/23-reorg-top.css draws each scheme's six in both rooms; Default is unset and draws exactly what it drew before.

export const SCHEMES = COLOUR_SCHEMES;
export type Scheme = ColourScheme;
const ATTR = 'data-colour-scheme';

/** The scheme of the Doc this Part belongs to, following the store (a change here or on another device after a pull). */
export function useDocScheme(entryId: string): Scheme {
  return useSyncExternalStore(subscribe, () => colourSchemeOf(entryId), () => colourSchemeOf(entryId));
}
/** Choose this Doc's scheme (the picker's SCHEME row): written to the Doc's settings with its other keys kept. False for a loose page. */
export function setDocScheme(entryId: string, s: Scheme): boolean {
  const done = setDocSetting(entryId, { colourScheme: s });
  if (done) flushNow();
  return done;
}
/** Mounted by the page's top rail: the Doc on screen draws its slots in its own scheme; leaving the page takes the mark away. */
export function useSchemeOnPage(entryId: string): void {
  const s = useDocScheme(entryId);
  useEffect(() => {
    const r = document.documentElement;
    if (s === 'default') r.removeAttribute(ATTR); else r.setAttribute(ATTR, s);
    return () => r.removeAttribute(ATTR);
  }, [s]);
}

// THE WORDS ON A COLOUR (concept §3): white or #151719, whichever measures higher against it; and the quiet-grey edge for a colour under 3:1 on
// its panel (the panel: Machina's G6 #23272B in the dark room, G0 #F4F5F6 in the light room; the edge: G3 #9AA1A8 dark, G4 #5E666E light).
const channel = (v: number): number => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export function luminance(hex: string): number {
  const m = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
  if (!m) return NaN;
  return 0.2126 * channel(parseInt(m[1], 16)) + 0.7152 * channel(parseInt(m[2], 16)) + 0.0722 * channel(parseInt(m[3], 16));
}
export function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export const INK_LIGHT = '#FFFFFF';
export const INK_DARK = '#151719';
export const PANEL = { dark: '#23272B', light: '#F4F5F6' } as const;
export const QUIET_EDGE = { dark: '#9AA1A8', light: '#5E666E' } as const;
/** The letter colour on a custom colour: white or #151719, whichever reads higher (any colour is kept; the words are made to read). */
export const inkOn = (hex: string): string => (contrast(hex, INK_LIGHT) >= contrast(hex, INK_DARK) ? INK_LIGHT : INK_DARK);
/** The tile's edge in a room: the colour itself, or the room's quiet grey when the colour stands under 3:1 on the room's panel. */
export const edgeIn = (hex: string, room: 'dark' | 'light'): string => (contrast(hex, PANEL[room]) < 3 ? QUIET_EDGE[room] : hex);
/** The inline variables a custom colour draws with (the tile, its letter, its edge in each room): read by 23-reorg-top.css. */
export function customVars(hex: string): Record<string, string> {
  return { '--part-hex': hex, '--part-hex-ink': inkOn(hex), '--part-hex-edge-dark': edgeIn(hex, 'dark'), '--part-hex-edge-light': edgeIn(hex, 'light') };
}

// the inspection seam (the wrizoSplit pattern), under the switch only
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoColourScheme?: unknown }).wrizoColourScheme = { of: colourSchemeOf, set: setDocScheme };
}
