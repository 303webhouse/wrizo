// ARBOR v2 MOCKUP, r8 - THE ROOM (Nick's pick, via Fable, Oct 31: a separate Room setting). The room reads data-room when it is set
// (light = Day, dark = Night), else it follows data-page (the existing Page pref: dark = night, anything else = day). In session only.
// No imports, so the browserless unit (scripts/harness/arbor2-r8-unit.mjs) loads it as is.
export type Room = 'night' | 'day';

export const roomOf = (dataRoom: string | null, dataPage: string | null): Room =>
  dataRoom === 'light' ? 'day' : dataRoom === 'dark' ? 'night' : dataPage === 'dark' ? 'night' : 'day';
