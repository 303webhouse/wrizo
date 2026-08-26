// ITEM 84, THE DECK PHASE — the Tutor's Free Write roster, DECK-DRAWN.
//
// Nick's lock record (docs/menus/tutor/tutor-menus-lock-record.md §1 line 1) redesigned
// the Free Write roster to: (A) a blank composer with a cursor · (B) "Writing Prompt" ·
// (C) "Unblock" · (D) "Free Writing Tips". His §6 Q2 word — "Stimulus." — ruled a writing
// prompt lawful as a spur ("a prompt is a spur, not the writer's work"), and his mechanism
// ruling split (B) into two phases. THIS FILE IS THE DECK PHASE, and only the deck phase:
//
//   DECK-DRAWN, NEVER MODEL-DRAWN. Every line a preset renders is a verbatim member of one
//   of the local pools below. The draw is SYNCHRONOUS and LOCAL — there is no fetch, no
//   await, no model, and no wire act anywhere in this module. Because the draw is
//   synchronous and local, "nothing was sent" is a STRUCTURAL fact, not a policy: a
//   model-composed line could not be a pool member.
//
// The precedent is FX15's first-line invite, inherited whole — its pool + synchronous draw
// (components/useFirstLineInvite.tsx), its no-near-repeat ring (store/idleNudges.ts's
// pick()), its window inspection seam, and its harness assertion shape (fx15.mjs:113: "the
// rendered line is a verbatim member of the local NUDGE_POOL deck"). What FX15 could NOT
// give is the CONTENT: NUDGE_POOL is the in-page idle-nudge deck (bare sensory fragments
// tuned for a slip over the paper), the wrong register for a Tutor preset, and it holds
// nothing at all for Unblock or Free Writing Tips. These three pools are new and authored.
//
// NOT IN SCOPE, and deliberately unstubbed: the MODEL PHASE (item 108 — the Tutor Memory
// Arc), where the carve-out sentence, the deck->model threshold, and the retrieval design
// settle together. Nothing here reaches toward it. Because nothing travels, this phase
// needs no disclosure gate and no carve-out sentence at all.
//
// TWO STANDING LAWS BIND THE CONTENT BELOW:
//   * THE VOICE LAW (lock record §2) — impersonal, phrased at the work, never at the
//     writer. No "you", no "your", no first person, anywhere in these pools.
//   * TD1's FRAME — locate, diagnose, direct; never supply. Unblock and Free Writing Tips
//     are guidance ABOUT writing, never writing itself. A prompt is a spur toward the
//     writer's own page, never a piece of their work.
// And no genre assumptions: nothing below presumes fiction over memoir over essay, or any
// particular kind of story inside fiction.

export type FreeWritePresetId = 'writingPrompt' | 'unblock' | 'tips';

// (B) "Writing Prompt" — spurs. A situation, an image, a constraint: something to push
// against. Never a sentence of the writer's work, never an opening line to be adopted.
export const WRITING_PROMPT_POOL: readonly string[] = Object.freeze([
  'Two people want the same small object. Neither will say why.',
  'A room left in a hurry — and the one thing that stayed behind.',
  'A return, after a long absence, to a place where exactly one thing has changed.',
  'A promise made easily. The morning it comes due.',
  'The last hour before a departure.',
  'An apology that arrives years late.',
  'Someone knows a thing they have no way of knowing.',
  'The same afternoon, told twice, by two people who disagree about it.',
  'A door locked so long that no one remembers the reason.',
  'A skill learned from someone no longer here to correct it.',
  'The weather turns. A plan turns with it.',
  'A small theft, and the reason underneath it.',
  'A conversation carried entirely by what is not said.',
  'Something breaks, and is repaired badly on purpose.',
  'The first lie of a long friendship.',
  'An arrival nobody prepared for.',
  'A list found in the pocket of a borrowed coat.',
  'The moment someone stops asking.',
  'A place that is loud at night and silent at noon.',
  'An inheritance nobody wants.',
  'A journey interrupted one stop early.',
  'A secret kept to protect someone who no longer needs protecting.',
  'The hour after the crowd leaves.',
  'Two witnesses, one event, and a detail only one of them saw.',
]);

// (C) "Unblock" — locate, diagnose, direct. Each line names where a block usually sits and
// what act moves past it. None of them writes anything for anyone.
export const UNBLOCK_POOL: readonly string[] = Object.freeze([
  'A block usually sits one sentence back. Reread the last line written and name what it committed to.',
  'When a scene stalls, name what someone in it wants in the next sixty seconds. Motion follows want.',
  'A page that will not start is often starting in the wrong place. Try the moment just after.',
  'If the next sentence will not come, the paragraph may already be finished. Leave it; take the next one.',
  'Stuck often means a decision is being avoided. Name the decision — the prose sits downstream of it.',
  'Write it badly, on purpose, fast. A bad draft can be edited; a blank page cannot.',
  'Name what is physically in the room. Concrete detail restarts a stalled paragraph faster than more thinking does.',
  'When the middle resists, skip to the part that is already clear and come back with the momentum.',
  'A sentence rewritten five times is usually the wrong sentence. Cut it and continue past it.',
  'If every direction feels wrong, an unstated rule may be holding. Say the rule out loud, then break it.',
  'Silence on the page often means the scene carries no pressure. Add a deadline and watch what moves.',
  'Sometimes a block is finished thinking. Note what happens next in plain words, then draft from the notes.',
  'Ten minutes on a timer, no stopping. The only rule is that the hand keeps moving.',
  'When a voice will not come, ask what is being refused. Dialogue is usually built around the refusal.',
  'An opening that resists is often carrying too much explanation. Begin with an action; let the reader catch up.',
  'If the work feels flat, check whether anything is at risk. Stakes are what make the next sentence necessary.',
]);

// (D) "Free Writing Tips" — the practice itself, stated as craft. Guidance about how a
// freewrite works, never a line of one.
export const FREE_WRITING_TIPS_POOL: readonly string[] = Object.freeze([
  'Free writing works by outrunning the editor. Keep the hand moving and let the sentence be wrong.',
  'A freewrite has one rule: do not stop. Repetition counts as writing until the next thought arrives.',
  'Set a small span — ten minutes, one page — and finish it. A short session finished beats a long one abandoned.',
  'Spelling and punctuation can wait. Nothing in a freewrite is for a reader yet.',
  'When nothing comes, write down that nothing is coming, and keep going. The block usually breaks within three sentences.',
  'Freewriting is generation, not selection. The choosing happens later — on a different day, if possible.',
  'Start mid-thought. A first sentence written to be good is a first sentence written slowly.',
  'Read nothing back until the timer ends. Rereading invites the editor in early.',
  'A freewrite that wanders is working. The digression is often the material.',
  'Write toward whatever is being avoided. Discomfort marks where the energy is.',
  'A fixed hour does more for output than inspiration does. Habit is the whole technique.',
  'One usable line out of a full page is a good yield. The rest paid for it.',
  'Stop while there is still somewhere to go — mid-sentence, if possible. Tomorrow then starts at a run.',
  'A freewrite has no audience. What cannot be said elsewhere can be said here.',
]);

export const FREE_WRITE_POOLS: Readonly<Record<FreeWritePresetId, readonly string[]>> = Object.freeze({
  writingPrompt: WRITING_PROMPT_POOL,
  unblock: UNBLOCK_POOL,
  tips: FREE_WRITING_TIPS_POOL,
});

// NICK'S ANTI-DELIBERATION RULE, and it is a rule rather than a number. His words:
// "the Tutor could give up to three options, but only one should be given at a time. We
// don't want a user spending time debating which prompt to respond to — the goal in Free
// Write is to get writing without much deliberation."
//
// ONE AT A TIME is absolute and lives in the panel (a draw REPLACES the standing one; it
// never stacks). A build that renders three at once satisfies the count and defeats the
// purpose. DRAW_CEILING is the other half: three draws behind one ask, then that ask is
// spent until the writer moves on — because an unlimited reroll IS deliberation.
export const DRAW_CEILING = 3;

// NICK'S REFILL RULING, verbatim: "It should reset after 100 words have been written with
// a note to the user if they try to use it a fourth time before writing 100 words."
//
// This SUPERSEDES the deck phase's own first reading, which re-armed on any new writing or
// on a send. That reading was flagged in the S0 as inferred rather than invented, and this
// is the word it was waiting for — recorded as a supersession, not quietly swapped.
//
// Two consequences the build carries, both his and neither the desk's:
//   * A SEND NO LONGER RE-ARMS. He named exactly one refill condition, and conversation is
//     not it — which is the rule agreeing with its own reason: the goal in Free Write is to
//     get writing, and writing happens on the page.
//   * THE FOURTH PRESS IS NOT A DEAD BUTTON. It answers — with a note instead of a prompt.
//     So the preset stays pressable when spent; a `disabled` control could not speak.
export const REFILL_WORDS = 100;

// FX15's no-near-repeat draw (store/idleNudges.ts's pick(), same shape): pick uniformly
// from the members NOT recently drawn, falling back to the whole pool once the exclusion
// set would empty it. Synchronous, local, total — it cannot fail and it cannot send.
export function drawFrom(pool: readonly string[], recent: readonly string[]): string {
  const avoid = new Set(recent);
  const open = pool.filter((line) => !avoid.has(line));
  const from = open.length > 0 ? open : pool;
  return from[Math.floor(Math.random() * from.length)];
}

// How many recent draws a preset remembers before it will repeat itself — one short of the
// pool so a draw is always available, capped so the ring never grows without bound (the
// exact reasoning idleNudges.ts's own recentRef uses).
export function recentMemoryFor(pool: readonly string[]): number {
  return Math.min(pool.length - 1, 12);
}

// Test/inspection seam — the wrizoFirstLineInvite / wrizoDeskLexicon / wrizoBoard
// convention, exposing the DECKS so the harness can prove a rendered line is deck-drawn (a
// verbatim member of one of these local pools) and never model-drawn. Never read by app
// code. This is the enforcement half of the deck law: fx15.mjs:113's assertion shape,
// inherited whole and pointed at three pools instead of one.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoTutorFreeWriteDeck?: unknown }).wrizoTutorFreeWriteDeck = {
    POOLS: FREE_WRITE_POOLS,
    DRAW_CEILING,
    REFILL_WORDS,
  };
}
