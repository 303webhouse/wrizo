import { getPref, setPref, subscribePrefs } from '../reorg/prefsSaved';

// THE ROOM, SAVED TO THE ACCOUNT (Fable, Nov 19, 11:20 pm: "The room choice (Automatic / Day / Night) is SAVED TO THE ACCOUNT, for Machina AND Arbor. Nick approved the
// room as account data on Nov 1 (room: clock|light|dark, unset = clock, synced) ... Store it as a `room` fact in users.prefs ... No fallback item.").
// THE ROOM'S ONE LANGUAGE is <html data-room>: every Room row - Arbor's Mood and Themes rows, Machina's Themes row and mockup bar - writes it (light = Day, dark = Night,
// absent = Automatic, the clock), and each theme's own room module turns it into its room (arbor2/mount.tsx, machina2/room.ts). So this bridge is theme-blind:
//   at boot and whenever the account's record changes (another device's pick arrives in a round), the saved choice is written to data-room - before either theme's
//   room module reads it (main.tsx imports this before it loads them);
//   whenever data-room changes and differs from the saved choice, that is her pick: it becomes the fact `room: { value, at }` (reorg/prefsSaved.ts, one of its
//   SWITCHLESS facts: saved whatever the reorg's switch, kept in the existing prefs key in the server's shape, sent to the account a second later, merged by stamp).
// Unset is the clock: with no fact the attribute is left as it is, and a value this build does not know is never applied. Sign-out forgets the record and leaves the
// room she is in; the next load starts at the clock until the account answers.
export type RoomChoice = 'clock' | 'light' | 'dark';
export const ROOM_FACT = 'room';

/** The saved choice, or null when she has never chosen (or the value is not one this build knows). */
export function roomOfFact(f: unknown): RoomChoice | null {
  const v = f && typeof f === 'object' ? (f as { value?: unknown }).value : null;
  return v === 'clock' || v === 'light' || v === 'dark' ? v : null;
}
const choiceOfAttr = (v: string | null): RoomChoice => (v === 'light' || v === 'dark' ? v : 'clock');

if (typeof document !== 'undefined' && document.documentElement && typeof MutationObserver !== 'undefined') {
  const root = document.documentElement;
  const apply = (): void => {
    const c = roomOfFact(getPref(ROOM_FACT));
    if (c === null) return;
    const want = c === 'clock' ? null : c;
    if (root.getAttribute('data-room') === want) return;
    if (want) root.setAttribute('data-room', want); else root.removeAttribute('data-room');
  };
  apply();
  subscribePrefs(apply);
  // her pick: the attribute now differs from what is saved (the bridge's own write above matches the record, so it is never taken for one)
  new MutationObserver(() => {
    const c = choiceOfAttr(root.getAttribute('data-room'));
    if (roomOfFact(getPref(ROOM_FACT)) === c) return;
    setPref(ROOM_FACT, { value: c });
  }).observe(root, { attributes: true, attributeFilter: ['data-room'] });
}
