// REORG - the reorg's one switch (reorg-plan-tech.md section 3: "?reorg=1"; Fable cleared POLISH's rails plan Nov 14, live-feedback-nov14i.md).
// A URL query parameter only: no stored flag, no localStorage key. Read once at load, like flux3/flag.ts: the query sits before the hash route
// (/?reorg=1#/...), so in-app navigation never changes it. The rail itself is gated on this AND the theme being Machina (components/Cascade.tsx).
// THE SWITCH-OVER (Fable's ruling, Nov 20, 6:00 pm): ON by default. ?reorg=0 turns it off (tests only); ?reorg=1 still turns it on. With
// neither, it is on unless the harness driver served window.__wrizoReorgOff (scripts/runtime-verify.mjs, the driver pin: a harness file that
// does not ask for the reorg opens exactly as before the switch-over). Everything it draws, and both account syncs, still need Machina.
const asked: string | null = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('reorg') : null;
const pinnedOff: boolean = typeof window !== 'undefined' && (window as unknown as { __wrizoReorgOff?: boolean }).__wrizoReorgOff === true;
export const REORG: boolean = asked === '1' ? true : asked === '0' ? false : !pinnedOff;
