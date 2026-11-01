// ARBOR v2 MOCKUP, r9 - THE ROOM FOLLOWS THE CLOCK (Nick's pick, via Fable, Nov 1: "Follow the clock / Always day / Always night"; unset =
// the clock, day 07:00-19:00 local). The Mood menu's Room row writes data-room: light = Always day, dark = Always night, absent = Follow the
// clock. In session only, nothing stored (saving it comes with the ship brief).
// THE CROSSFADE (Arbor only): following the clock, the room fades over FADE_MIN minutes centred on 07:00 and 19:00 (06:50-07:10, 18:50-19:10),
// so at the hour it is half way. Under reduced motion it is a cut at the hour. A pick (Always day / Always night / back to the clock) is the
// writer's own act and lands at once.
// No imports, so the browserless unit (scripts/harness/arbor2-r9-unit.mjs) loads it as is.
export type Room = 'night' | 'day';
export type Choice = 'clock' | 'day' | 'night';

export const DAY_START = 7 * 60;    // 07:00, minutes after midnight
export const DAY_END = 19 * 60;     // 19:00
export const FADE_MIN = 20;

/** The Room row's choice from data-room: light = Always day, dark = Always night, anything else = Follow the clock. */
export const choiceOf = (dataRoom: string | null): Choice => (dataRoom === 'light' ? 'day' : dataRoom === 'dark' ? 'night' : 'clock');
/** The data-room value a choice writes (null = remove it). */
export const dataRoomOf = (c: Choice): string | null => (c === 'day' ? 'light' : c === 'night' ? 'dark' : null);

const smooth = (x: number): number => x * x * (3 - 2 * x);

/** How far into the day the clock's room is: 0 = night, 1 = day. `minutes` is local time after midnight (fractions allowed). */
export function clockDayness(minutes: number, reduced: boolean): number {
  const m = ((minutes % 1440) + 1440) % 1440;
  if (reduced) return m >= DAY_START && m < DAY_END ? 1 : 0;
  const h = FADE_MIN / 2;
  if (m <= DAY_START - h || m >= DAY_END + h) return 0;
  if (m >= DAY_START + h && m <= DAY_END - h) return 1;
  if (m < DAY_START + h) return smooth((m - (DAY_START - h)) / FADE_MIN);
  return 1 - smooth((m - (DAY_END - h)) / FADE_MIN);
}

/** The room's dayness for a data-room value at a time: a pick is 0 or 1 at once; the clock fades. */
export const dayness = (dataRoom: string | null, minutes: number, reduced: boolean): number => {
  const c = choiceOf(dataRoom);
  return c === 'day' ? 1 : c === 'night' ? 0 : clockDayness(minutes, reduced);
};

// ---- colour arithmetic (for the crossfade's blended tokens) ----
type RGBA = { r: number; g: number; b: number; a: number };
const TOKEN = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|-?\d*\.?\d+/g;

export function parseColour(s: string): RGBA | null {
  const t = s.trim();
  if (t[0] === '#') {
    let h = t.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  const m = t.match(/^rgba?\(([^)]*)\)$/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (p.length < 3 || p.some((x) => Number.isNaN(x))) return null;
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}
const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0').toUpperCase();
export function formatColour(c: RGBA): string {
  return c.a >= 1 ? `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}` : `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Math.round(c.a * 1000) / 1000})`;
}
export const mixColour = (a: RGBA, b: RGBA, t: number): RGBA => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: a.a + (b.a - a.a) * t });

/** Blend two computed custom-property values of the same shape (colours, numbers, "r,g,b" triples, gradients whose stops line up).
 *  Returns null when the shapes differ: that token is left to the room's own rule, which changes at the crossover. */
export function mixValue(a: string, b: string, t: number): string | null {
  const ta = a.match(TOKEN) ?? [], tb = b.match(TOKEN) ?? [];
  if (a.replace(TOKEN, '\u0000') !== b.replace(TOKEN, '\u0000') || ta.length !== tb.length) return null;
  let i = 0, bad = false;
  const out = a.replace(TOKEN, (x) => {
    const y = tb[i++];
    const ca = parseColour(x), cb = parseColour(y);
    if (ca && cb) return formatColour(mixColour(ca, cb, t));
    if (ca || cb) { bad = true; return x; }
    const v = Number(x) + (Number(y) - Number(x)) * t;
    return String(Math.round(v * 1000) / 1000);
  });
  return bad ? null : out;
}

const lum = (c: RGBA) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
export const contrast = (x: RGBA, y: RGBA) => { const a = lum(x), b = lum(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };

/** THE CROSSOVER: the dayness at which the night's lettering and the day's read alike on the fading ground. The lettering, the surfaces that
 *  carry text and the room's own rules change there, in one step; the ground, its glow, the pool and the hairlines fade. */
export function crossover(groundNight: RGBA, groundDay: RGBA, letterNight: RGBA, letterDay: RGBA): number {
  const diff = (t: number) => { const g = mixColour(groundNight, groundDay, t); return contrast(letterNight, g) - contrast(letterDay, g); };
  let lo = 0, hi = 1;
  if (diff(lo) * diff(hi) > 0) return 0.5;
  for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (diff(lo) * diff(mid) <= 0) hi = mid; else lo = mid; }
  return (lo + hi) / 2;
}

/** The lettering set: tokens that SWITCH at the crossover rather than blend (text colours, and the surfaces text sits on). */
export const LETTERING = ['--arbor-letter', '--text-hi', '--text-mid', '--text-low', '--accent-rest', '--help', '--help-hi', '--arbor-guide', '--ink-900', '--ink-800'];

/** "HH:MM" or "HH:MM:SS" -> minutes after midnight (null when it does not parse). */
export function parseClock(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const h = +m[1], mi = +m[2], se = m[3] ? +m[3] : 0;
  if (h > 23 || mi > 59 || se > 59) return null;
  return h * 60 + mi + se / 60;
}
