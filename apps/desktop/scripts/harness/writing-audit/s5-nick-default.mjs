// WRITING AUDIT, Nick's literal flows (Fable, Nov 11): an empty page in Draft, Typewriter default: Enter+Up, Enter+Left, Enter+Backspace, Enter+letter, a line + Enter + Up, a line + Enter + Enter + Up; the TRACE lines say where the
// caret is drawn after every key and where the next letter lands; a frame is saved for each red. FINDS AND REPORTS; FIXES NOTHING.
// Run: node scripts/harness/writing-audit/s5-nick-default.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s5-nick-default.mjs)
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'default';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['nick'], title: 'S5-NICK-DEFAULT' });
