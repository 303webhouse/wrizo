// REORG - the reorg's one switch (reorg-plan-tech.md section 3: "?reorg=1"; Fable cleared POLISH's rails plan Nov 14, live-feedback-nov14i.md).
// A URL query parameter only: no stored flag, no localStorage key. Read once at load, like flux3/flag.ts: the query sits before the hash route
// (/?reorg=1#/...), so in-app navigation never changes it. The rail itself is gated on this AND the theme being Machina (components/Cascade.tsx).
// THE SWITCH-OVER (Fable's ruling, Nov 20, 6:00 pm): ON by default. ?reorg=0 turns it off (tests only); ?reorg=1 still turns it on. With
// neither, it is on unless the harness driver served window.__wrizoReorgOff (scripts/runtime-verify.mjs, the driver pin: a harness file that
// does not ask for the reorg opens exactly as before the switch-over). Everything it draws, and both account syncs, still need Machina.
const asked: string | null = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('reorg') : null;
const pinnedOff: boolean = typeof window !== 'undefined' && (window as unknown as { __wrizoReorgOff?: boolean }).__wrizoReorgOff === true;
// The default is a PAGE LOAD's: with no location (a Node read of the source: the c13 tables, a unit) there is no page load to default, so it reads off,
// exactly as before the switch-over (the lexicon's reorg words, read in Node by c13-10c, stay the canonical ones).
export const REORG: boolean = asked === '1' ? true : asked === '0' ? false : (typeof location !== 'undefined' && !pinnedOff);
// Fable, Nov 21, 9:40 pm: the switch-over turns the reorg on by default in MACHINA ONLY; Arbor and Flux keep ?reorg=1 until all six of their cells pass
// (reorg/themeGate.ts REORG_DEFAULT_ON and reorgFor read this): whether this page load ASKED for the reorg by name.
export const REORG_ASKED: boolean = asked === '1';

// THE SWITCH-OVER (Fable, Nov 21, 9:40 pm): the reorg is ON BY DEFAULT in Machina only. Arbor and Flux keep ?reorg=1 until all six of their cells pass. It lives HERE
// (this module imports nothing) so the lexicon's reorg words can ask it too (overrides/*Reorg.ts, themeLexicon); reorg/themeGate.ts re-exports it. Flip a theme here once
// all six of its cells pass. Every reader of the bare REORG outside this file and themeGate.ts is a harness hook or listed harmless (reorg-bare-switch-census.mjs).
// THE LAST ARBOR FLIP (Fable, Nov 22, 3:20 pm; Nick: Arbor goes default-on): all six plateau cells are on in reorg/themeGate.ts, so Arbor is ON by default too. Flux alone keeps ?reorg=1.
// THE LAST FLUX FLIP (Fable, Nov 23, 8:20 am; Nick: the full Flux redesign and reorg live): all six flux cells are on in reorg/themeGate.ts, so Flux is ON by default too.
export const REORG_DEFAULT_ON: Record<'machina' | 'plateau' | 'flux', boolean> = { machina: true, plateau: true, flux: true };

/** The reorg is on for this theme: the switch is on, and the theme is on by default or the page load asked for it (?reorg=1). */
export function reorgFor(theme: string | null | undefined): boolean {
  return REORG && (REORG_ASKED || ((REORG_DEFAULT_ON as Record<string, boolean | undefined>)[theme ?? ''] ?? false));
}

// SPRINT's prompts from the Consultant (FIX's queue item 6, Nov 21; reorg/backMenu/SprintFeedback.tsx, store/api.ts apiSprintPrompt). ON with the reorg (Nick ruled it ON, Nov 21, 1:10 am; Fable, 10:25 am), ?sprint=deck is the tests' way back. On, SPRINT's press asks the Consultant for one prompt under the strict rules; the local deck serves anyone it does not (no AI
// configured, the writer's own switch off (writingSettings.consultant), the budget spent, any failure) and sends nothing in the cases it can know ahead (the switch off, ?sprint=deck). Read once at load, like REORG. [Was: opt-in, ?sprint=consultant, default OFF, the deck for Monday.]
export const SPRINT_CONSULTANT: boolean = REORG && !(typeof location !== 'undefined' && new URLSearchParams(location.search).get('sprint') === 'deck');
