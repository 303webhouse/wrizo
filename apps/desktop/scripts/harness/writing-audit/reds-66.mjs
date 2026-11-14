// RED-FIRST CHECK for #66 (the invisible end marker eats Left): the page that ends in a newline holds a guard character (a zero-width marker) so the empty last line has somewhere to hold the caret. A Left from the end must move the caret one place - not
// spend itself stepping over the marker. L66a-h: Left from the end of 'abc\n', Left/Right pairs, two trailing newlines, Shift+Left, two lines, Ctrl+Left, Enter then Left (then a letter). Strict, Typewriter off, judged against the page's own model.
// Run: node scripts/harness/writing-audit/reds-66.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-66.mjs; strict). The card pop-up's twin is reds-66-card.mjs.
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'L66a,L66b,L66c,L66d,L66e,L66f,L66g,L66h';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['left66'], title: 'RED-66' });
