// MACHINA v2 MOCKUP - THE ROOM (Nick's pick, via Fable, Oct 31: a separate Room setting). In the mockup the room reads data-room when it is set,
// else it follows data-page (the existing Page pref). data-room is an attribute on <html> written only by the mockup panel's Room row: in session,
// nothing stored (saving it to the account comes with the ship brief). The CSS reads the resolved room, data-machina2-room (light | dark), so one
// selector serves both cases; the page's own values still read data-page.
// No imports, so the browserless unit (scripts/harness/machina2-unit.mjs) loads it as is.
export type Room = 'light' | 'dark';

/** The resolved room: data-room when set (light | dark), else the page tone (anything but 'light' is the dark room, as the base theme reads it). */
export function roomOf(dataRoom: string | null, dataPage: string | null): Room {
  if (dataRoom === 'light' || dataRoom === 'dark') return dataRoom;
  return dataPage === 'light' ? 'light' : 'dark';
}

function apply(): void {
  const r = document.documentElement;
  const want = roomOf(r.getAttribute('data-room'), r.getAttribute('data-page'));
  if (r.getAttribute('data-machina2-room') !== want) r.setAttribute('data-machina2-room', want);
}

/** The panel's Room row: a room, or null to follow the page again. */
export function setRoom(v: Room | null): void {
  const r = document.documentElement;
  if (v) r.setAttribute('data-room', v); else r.removeAttribute('data-room');
  apply();
}

/** { room, set }: the room in force and whether data-room chose it (false = it follows the page). */
export function readRoom(): { room: Room; set: boolean } {
  const r = document.documentElement;
  const d = r.getAttribute('data-room');
  return { room: roomOf(d, r.getAttribute('data-page')), set: d === 'light' || d === 'dark' };
}

/** Called by mount.tsx once the flag is on: resolves the room now and again whenever the page tone or data-room changes. */
export function initRoom(): void {
  apply();
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-page', 'data-room'] });
}
