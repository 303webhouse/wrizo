// REORG - the reorg's one switch (reorg-plan-tech.md section 3: "?reorg=1"; Fable cleared POLISH's rails plan Nov 14, live-feedback-nov14i.md).
// A URL query parameter only: no stored flag, no localStorage key. Read once at load, like flux3/flag.ts: the query sits before the hash route
// (/?reorg=1#/...), so in-app navigation never changes it. The rail itself is gated on this AND the theme being Machina (components/Cascade.tsx).
export const REORG: boolean = typeof location !== 'undefined' && new URLSearchParams(location.search).get('reorg') === '1';

// SPRINT's prompts from the Consultant (FIX's queue item 6, Nov 21; reorg/backMenu/SprintFeedback.tsx, store/api.ts apiSprintPrompt). Its own opt-in beside the reorg's: ?sprint=consultant. Off (the default), SPRINT's press draws from the local deck
// and sends nothing (Nick, Nov 20, 4:15 pm: the deck ships for Monday); on, it asks the Consultant for one prompt under the strict rules and falls back to the deck on any failure. Read once at load, like REORG.
export const SPRINT_CONSULTANT: boolean = REORG && typeof location !== 'undefined' && new URLSearchParams(location.search).get('sprint') === 'consultant';
