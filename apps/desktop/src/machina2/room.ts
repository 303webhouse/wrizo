// MACHINA v2 MOCKUP, r3 - THE ROOM FOLLOWS THE CLOCK (Nick's pick, via Fable, Nov 1: "Follow the clock / Always day / Always night"; unset =
// the clock, day 07:00-19:00 local). data-room is an attribute on <html> written only by the mockup panel's Room row: light = Always day,
// dark = Always night, absent = Follow the clock. In session only, nothing stored (saving it comes with the ship brief). The CSS reads the room
// in force, data-machina2-room (light | dark); the page's own values still read data-page.
// MACHINA SWITCHES ONLY WHILE THE WRITER ISN'T TYPING: when the clock crosses 07:00 or 19:00 the change waits until no key has gone down for
// IDLE_MS, then lands in one step (no fade). A pick in the panel is the writer's own act and lands at once. data-machina2-room-due names the
// room that is waiting, while one is.
// No imports, so the browserless unit (scripts/harness/machina2-unit.mjs) loads it as is.
export type Room = 'light' | 'dark';
export type Choice = 'clock' | Room;

export const DAY_START = 7 * 60;    // 07:00, minutes after midnight
export const DAY_END = 19 * 60;     // 19:00
export const IDLE_MS = 5000;        // "not typing": no key down for this long

/** The panel's choice from data-room: light = Always day, dark = Always night, anything else = Follow the clock. */
export const choiceOf = (dataRoom: string | null): Choice => (dataRoom === 'light' || dataRoom === 'dark' ? dataRoom : 'clock');
/** The clock's room: light from 07:00 until 19:00 local, dark otherwise. */
export const clockRoom = (minutes: number): Room => { const m = ((minutes % 1440) + 1440) % 1440; return m >= DAY_START && m < DAY_END ? 'light' : 'dark'; };
/** The room the choice asks for at this time. */
export const wantRoom = (dataRoom: string | null, minutes: number): Room => { const c = choiceOf(dataRoom); return c === 'clock' ? clockRoom(minutes) : c; };
/** What to show now. A first resolve and an explicit pick land at once; the clock's change waits until the writer has not typed for IDLE_MS. */
export function nextRoom(current: Room | null, want: Room, explicit: boolean, msSinceKey: number): Room {
  if (current === null || explicit || current === want) return want;
  return msSinceKey >= IDLE_MS ? want : current;
}
/** "HH:MM" or "HH:MM:SS" -> minutes after midnight (null when it does not parse). */
export function parseClock(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const h = +m[1], mi = +m[2], se = m[3] ? +m[3] : 0;
  if (h > 23 || mi > 59 || se > 59) return null;
  return h * 60 + mi + se / 60;
}

let clockOverride: number | null = null;   // the harness's clock (window.machina2Clock), in memory; null = the real local clock
let lastKey = -Infinity;
const nowMinutes = () => { if (clockOverride !== null) return clockOverride; const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };

function apply(explicit: boolean): void {
  const r = document.documentElement;
  const cur = r.getAttribute('data-machina2-room');
  const want = wantRoom(r.getAttribute('data-room'), nowMinutes());
  const next = nextRoom(cur === 'light' || cur === 'dark' ? cur : null, want, explicit, performance.now() - lastKey);
  if (cur !== next) r.setAttribute('data-machina2-room', next);
  if (next !== want) { if (r.getAttribute('data-machina2-room-due') !== want) r.setAttribute('data-machina2-room-due', want); }
  else r.removeAttribute('data-machina2-room-due');
}

/** The panel's Room row: a choice ('clock' removes data-room). Lands at once. */
export function setRoom(c: Choice): void {
  const r = document.documentElement;
  if (c === 'clock') r.removeAttribute('data-room'); else r.setAttribute('data-room', c);
  apply(true);
}

/** { choice, room }: the panel's choice and the room in force. */
export function readRoom(): { choice: Choice; room: Room } {
  const r = document.documentElement;
  return { choice: choiceOf(r.getAttribute('data-room')), room: r.getAttribute('data-machina2-room') === 'light' ? 'light' : 'dark' };
}

/** Called by mount.tsx once the flag is on: resolves the room now, watches the keys (to know when the writer is typing) and the clock. */
export function initRoom(): void {
  apply(true);
  new MutationObserver(() => apply(true)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-room'] });   // a choice lands at once
  window.addEventListener('keydown', (e) => { if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) lastKey = performance.now(); }, true);
  window.addEventListener('input', () => { lastKey = performance.now(); }, true);   // dictation and IME composition type without a keydown
  setInterval(() => apply(false), 1000);
  // r5 (spec draft 9 §2f): a waiting change also lands "at the next File open, whichever comes first" - opening a page is an act of departure,
  // not typing, so the room in force catches up at once (a page route: #/page/<id>)
  window.addEventListener('hashchange', () => { if (/^#\/page\//.test(location.hash)) apply(true); });
  document.addEventListener('visibilitychange', () => apply(false));
  // THE HARNESS'S CLOCK (mockup only, in memory): window.machina2Clock('19:00') sets the time the room reads; machina2Clock(null) gives the
  // real clock back. It is the clock moving, not a pick, so it waits for the writer like the real clock does. A reload forgets it.
  (window as unknown as { machina2Clock?: (s: string | null) => string | null }).machina2Clock = (s) => {
    clockOverride = s === null ? null : parseClock(s);
    apply(false);
    return document.documentElement.getAttribute('data-machina2-room');
  };
}
