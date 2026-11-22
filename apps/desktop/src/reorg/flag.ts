// REORG - the reorg's one switch (reorg-plan-tech.md section 3: "?reorg=1"; Fable cleared POLISH's rails plan Nov 14, live-feedback-nov14i.md).
// A URL query parameter only: no stored flag, no localStorage key. Read once at load, like flux3/flag.ts: the query sits before the hash route
// (/?reorg=1#/...), so in-app navigation never changes it. The rail itself is gated on this AND the theme being Machina (components/Cascade.tsx).
export const REORG: boolean = typeof location !== 'undefined' && new URLSearchParams(location.search).get('reorg') === '1';

// SPRINT's prompts from the Consultant (FIX's queue item 6, Nov 21; reorg/backMenu/SprintFeedback.tsx, store/api.ts apiSprintPrompt). ON with the reorg (Nick ruled it ON, Nov 21, 1:10 am; Fable, 10:25 am), ?sprint=deck is the tests' way back. On, SPRINT's press asks the Consultant for one prompt under the strict rules; the local deck serves anyone it does not (no AI
// configured, the writer's own switch off (writingSettings.consultant), the budget spent, any failure) and sends nothing in the cases it can know ahead (the switch off, ?sprint=deck). Read once at load, like REORG. [Was: opt-in, ?sprint=consultant, default OFF, the deck for Monday.]
export const SPRINT_CONSULTANT: boolean = REORG && !(typeof location !== 'undefined' && new URLSearchParams(location.search).get('sprint') === 'deck');
