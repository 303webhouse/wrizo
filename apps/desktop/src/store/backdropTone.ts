// THE SPLASH'S ASSET CHOICE — MEASURED, NOT MAPPED (Fable's ruling, 2026-09-22).
//
// Nick's sketch ships twice: cream linework for a DARK backdrop, warm ink for
// a LIGHT one. Something has to choose. The obvious instrument — a
// `data-theme` → asset map — is the wrong one, and S0 measured why:
//
//   · BOTH registered themes are dark-ground (plateau #110600 "deep espresso",
//     flux #04141A). A literal map would never select the light asset at all.
//   · The light/dark axis that DOES exist, `data-page`, governs the PAPER, not
//     the chrome the splash floats over — a different surface.
//   · theme.ts's own comment anticipates Volant, Nomad and Machina. A map goes
//     stale the moment one lands, and the failure mode is CREAM INK ON A CREAM
//     GROUND: invisible art, which no "did the element mount" check can see.
//
// So this measures the backdrop instead, and the measurement follows any theme
// anyone adds later without being told about it.
//
// HOW, and why it is a real measurement rather than a token read: the app's
// ground is not a plain colour anywhere you could simply look it up —
// `html` carries a HARDCODED `#110600` (not the themed token), and `body`
// paints `var(--lamp-glow)` over it, a GRADIENT, so `body`'s own
// `background-color` computes to transparent. Reading either one alone would
// be reading the wrong thing confidently. Instead: ask the page what is
// actually at the point the emblem will cover, and walk up from there until a
// genuinely painted surface answers.
//
// `document.elementFromPoint` is the same primitive item 130/151 settled on
// for "what is really there" — and it composes with the splash's own design:
// the overlay is `pointer-events:none` (so it never blocks writing), which is
// exactly what makes it invisible to hit-testing, so this reads THROUGH it to
// the app underneath without having to unmount or hide anything first.

export type BackdropTone = 'dark' | 'light';

/** The WCAG relative luminance of an sRGB triple (0..255 each). */
function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * THE CROSSOVER, not a midpoint. 0.179 is the luminance at which contrast
 * against black and contrast against white are equal — i.e. the exact point
 * where light-on-dark stops being the more legible choice and dark-on-light
 * starts. A naive 0.5 would call a mid-grey "dark" and print cream on it.
 */
const CROSSOVER = 0.179;

function parseCss(colour: string): { r: number; g: number; b: number; a: number } | null {
  // getComputedStyle always resolves to rgb()/rgba() in every engine this app
  // runs on, so this parses that one shape rather than pretending to be a
  // general CSS colour parser it would be lying about being.
  const m = colour.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return null;
  const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}

/**
 * The first ancestor that genuinely paints something. A background that is
 * mostly see-through is not what the eye reads as "the backdrop", so anything
 * under half-opaque is stepped over rather than averaged — averaging would
 * invent a colour that is on screen nowhere.
 */
function paintedBackgroundOf(start: Element | null): { r: number; g: number; b: number } | null {
  let el: Element | null = start;
  while (el) {
    const parsed = parseCss(getComputedStyle(el).backgroundColor);
    if (parsed && parsed.a >= 0.5) return parsed;
    el = el.parentElement;
  }
  return null;
}

/**
 * Measure the tone behind a point (the viewport centre by default — where the
 * emblem sits). Falls back, in order, to the themed ground token and then to
 * the root background, so a headless or mid-paint call still answers with
 * something true rather than throwing.
 */
export function measureBackdropTone(x?: number, y?: number): BackdropTone {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') return 'dark';

  const cx = x ?? Math.round(window.innerWidth / 2);
  const cy = y ?? Math.round(window.innerHeight / 2);

  let painted = paintedBackgroundOf(document.elementFromPoint(cx, cy));

  if (!painted) {
    // The themed ground token — themed, unlike `html`'s hardcoded literal, so
    // it is the better of the two fallbacks and is tried first.
    const token = getComputedStyle(document.documentElement).getPropertyValue('--ink-950').trim();
    painted = token ? parseCss(token) ?? hexToRgb(token) : null;
  }
  if (!painted) painted = paintedBackgroundOf(document.documentElement);

  // Nothing answered at all: the app's ground has been dark in every theme it
  // has ever shipped, so cream linework is the safe default — the one that
  // fails visible rather than invisible.
  if (!painted) return 'dark';

  return relativeLuminance(painted.r, painted.g, painted.b) < CROSSOVER ? 'dark' : 'light';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Test/inspection seam — the wrizoTheme/wrizoVocab pattern. */
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoBackdropTone?: unknown }).wrizoBackdropTone = {
    measure: measureBackdropTone,
    luminance: relativeLuminance,
    CROSSOVER,
  };
}
