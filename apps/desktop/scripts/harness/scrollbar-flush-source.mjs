// SCROLLBAR-FLUSH (Fable Oct 23: Nick, live on Flux — "the page scrollbar is bulky and floats
// INSIDE the page"; Arbor had the same glitch. Apply Nick's Oct 12 option B's own SPEC in every
// theme: thin, full height, on the page's edge, barely noticeable, never mid-page).
//
// ROOT CAUSE (confirmed by reading the source, not assumed): FX10 S4 (2026-07-21) made
// `.mode-scroll`'s own scrollbar render flush at the page's true outer edge by cancelling
// `.mode-page`'s right padding exactly — a negative margin plus an equal padding, both hardcoded
// to the literal `38px`, which WAS `.mode-page`'s own padding at the time. ITEM 83 M3 (R6,
// 2026-08-04, two weeks later) turned that padding into a per-page SETTING (PAGE SETUP's
// margins: narrow 26px / normal 38px / wide 58px, `--wz-page-pad-x`) but never touched FX10's
// own hardcoded cancellation — so a page set to anything but "normal" broke the cancellation
// (wide: 20px of gap still inboard of the true edge, exactly "floats inside the page"; narrow:
// overshoots by 12px). `normal` (the default) stayed byte-identical, which is why this went
// unnoticed until a writer changed the margin. `scrollbar-minimal`'s custom-overlay branch
// (`ThinScrollbar.tsx`, Nick's Oct 12 "option B" BY NAME) is irrelevant here — it is dead code,
// absent from main, abandoned mid-build for an unrelated bug (its own track's full-HEIGHT
// positioning, not this ticket's horizontal-flush one); this fix stays entirely inside the
// ALREADY-SHIPPED native-scrollbar system (FX7/FX10), just reading the SAME variable
// `.mode-page` itself reads instead of a stale literal.
//
// This file proves what needs no browser (pure source read, same technique as
// typewriter-scope-source.mjs/item207-core.mjs). The DOM-level proof (actual getBoundingClientRect
// positions, real scrollbar width, across all four theme/page-tone combinations and all three
// margin settings) is the sibling CDP file, scrollbar-flush.mjs — written, unrun (no box-turn
// grant held by this lane at write time).
//
// What is proven TODAY:
//   T1 `.mode-scroll`'s own cancellation reads `var(--wz-page-pad-x, 38px)` on BOTH its
//      margin-right and padding-right - not a hardcoded 38px literal (the actual regression)
//   T2 that is the EXACT SAME variable expression `.desk-frame-stage .mode-page`'s own padding
//      rule uses - proving both rules are now driven by one shared source, which is what makes
//      them structurally unable to drift apart again (the mechanism ITEM 83 M3 broke)
//   T3 the fallback value in both places is identical ('38px') - an undressed page (margins
//      unset) renders byte-identically to before this fix
//   T4 the fix is scoped to `.mode-scroll` alone - `.desk-frame-scroll-cap` (Screenplay's own
//      equivalent) is UNCHANGED by this ticket (confirmed: it never had FX10's flush treatment
//      at all - ScriptEditor.tsx never reads --wz-page-pad-x/dressVars, so PAGE SETUP's margins
//      control does not apply to script pages; a pre-existing, separate scope, not a regression
//      this ticket introduces or fixes - flagged, not silently expanded into)
//   MUTANT (must turn T1 red): `.mode-scroll`'s cancellation reverts to the old hardcoded
//      literal (the exact regression ITEM 83 M3 introduced) - proves T1 would actually catch it
//
// Run (from the repo root, no server/grant needed):
//   node apps/desktop/scripts/harness/scrollbar-flush-source.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const SRC = join(DESKTOP, 'src');
const src = (rel) => readFileSync(join(SRC, rel), 'utf8').replace(/\r\n/g, '\n');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };

const css = src('index.css');
const scriptEditor = src('components/ScriptEditor.tsx');

const SHARED_VAR = "var(--wz-page-pad-x, 38px)";

// T1 - .mode-scroll reads the shared variable, not a hardcoded literal
// (probe re-anchored to the rule's own line start: the page-scale exception below adds `.desk-frame-stage--prose .mode-scroll{...}` EARLIER in the file, and an unanchored match would read THAT rule - the claim T1 makes is unchanged)
const modeScrollMatch = css.match(/\n\.mode-scroll\{[^}]*\}/);
ok('T1: .mode-scroll\'s own margin-right cancellation reads the shared page-margin variable, not a hardcoded 38px literal',
  !!modeScrollMatch && modeScrollMatch[0].includes(`margin-right:calc(-1 * ${SHARED_VAR} * var(--paper-scale))`), modeScrollMatch?.[0] ?? null);
ok('T1: .mode-scroll\'s own padding-right re-application reads the SAME shared variable too (both halves of the cancellation, not just one)',
  !!modeScrollMatch && modeScrollMatch[0].includes(`padding-right:calc(${SHARED_VAR} * var(--paper-scale))`), modeScrollMatch?.[0] ?? null);

// T2 - the exact same expression .mode-page's own padding rule uses
const modePagePaddingMatch = css.match(/\.desk-frame-stage \.mode-page\{[^}]*padding:calc\([^;]*\);/s);
ok('T2: .desk-frame-stage .mode-page\'s own padding rule uses the EXACT SAME variable expression (var(--wz-page-pad-x, 38px)) - one shared source, not two independently-maintained numbers',
  !!modePagePaddingMatch && modePagePaddingMatch[0].includes(SHARED_VAR), modePagePaddingMatch?.[0] ?? null);

// T3 - the fallback is identical in both places (byte-identical pre-fix rendering when unset)
ok('T3: the fallback value is \'38px\' in both the page\'s own padding rule and .mode-scroll\'s cancellation - an undressed page is unaffected by this fix',
  SHARED_VAR.includes('38px') && (modeScrollMatch?.[0].match(/38px/g) || []).length >= 2, '');

// T4 - scope confirmation: .desk-frame-scroll-cap (Screenplay) never had this treatment, and this
// ticket does not add it (a pre-existing, separate gap, not expanded into).
ok('T4: ScriptEditor.tsx never reads --wz-page-pad-x/dressVars - PAGE SETUP\'s margins control does not apply to script pages, so .desk-frame-scroll-cap\'s own lack of a flush cancellation is a pre-existing, separate scope, untouched by this fix',
  !/wz-page-pad-x|dressVars/.test(scriptEditor), '');
const scrollCapMatch = css.match(/\.desk-frame-scroll-cap\{[^}]*\}/);
ok('T4: .desk-frame-scroll-cap\'s own rule is unchanged by this ticket (no margin-right/padding-right cancellation added)',
  !!scrollCapMatch && !/margin-right|padding-right/.test(scrollCapMatch[0]), scrollCapMatch?.[0] ?? null);

// T5 - ONE MECHANISM (Fable Oct 23, after the first box run was red 24/32): Chromium >= 121 (Electron 31 = Chromium 126) IGNORES
// ::-webkit-scrollbar on any element whose scrollbar-width/scrollbar-color is set, and the systemic `*` rule sets both on every
// element - so any ::-webkit-scrollbar rule in the app is dead code AND a second, lying source of truth (the old 8px rule was why
// the harness expected 8 and the bar rendered 10). The standard properties are the only mechanism; no webkit scrollbar selector
// may exist anywhere in index.css.
// (comments stripped first: the explanatory notes in index.css name the selector in prose; only RULES count)
const cssRules = css.replace(/\/\*[\s\S]*?\*\//g, '');
const webkitScrollbarRules = (cssRules.match(/::-webkit-scrollbar[\w-]*/g) || []);
// SUPERSEDED (Fable Oct 23, "at 3840 the page scrollbar scales up with the page", reading A): T5 used to say "ONE mechanism - index.css carries NO ::-webkit-scrollbar rule (they are dead
// under Chromium >= 121 wherever the standard properties are set, and the `*` rule sets them everywhere)". page-size paints the prose page with a transform, so the native `thin` bar paints at
// 10 x the scale; the standard properties cannot name a thickness, so ONE scoped exception is allowed (below). The original is quoted verbatim in the PARKED record at the foot of this file.
// The exception's block - everything inside @supports selector(::-webkit-scrollbar){ ... } - and the rules OUTSIDE it, which must still carry no webkit scrollbar selector at all:
const exceptionBlock = (/@supports selector\(::-webkit-scrollbar\)\{([\s\S]*?)\n\}/.exec(cssRules) || [, ''])[1];
const outsideException = cssRules.replace(/@supports selector\(::-webkit-scrollbar\)\{[\s\S]*?\n\}/, '');
const EXC = '.desk-frame-stage--prose .mode-scroll';
const exceptionRules = [...exceptionBlock.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2].trim()]);
const webkitSelectors = exceptionRules.map(([s]) => s).filter((s) => /::-webkit-scrollbar/.test(s));
ok('T5 [successor]: the webkit mechanism lives in EXACTLY ONE place - inside @supports selector(::-webkit-scrollbar){} (so Firefox keeps `thin`), and every ::-webkit-scrollbar selector there is on `.desk-frame-stage--prose .mode-scroll` - none anywhere else in index.css',
  exceptionBlock.length > 0 && !/::-webkit-scrollbar/.test(outsideException) && webkitSelectors.length === 3 && webkitSelectors.every((s) => s.startsWith(EXC + '::-webkit-scrollbar')), JSON.stringify({ outside: (outsideException.match(/::-webkit-scrollbar[\w-]*/g) || []), inside: webkitSelectors }));
const resetRule = exceptionRules.find(([s]) => s === EXC);
ok('T5 [successor]: the exception RESETS scrollbar-width and scrollbar-color to auto on that element (the pseudo rules are ignored wherever either is set - the dead-code trap this ticket\'s one-mechanism note records)',
  !!resetRule && /scrollbar-width:\s*auto/.test(resetRule[1]) && /scrollbar-color:\s*auto/.test(resetRule[1]), JSON.stringify(resetRule));
const barRule = exceptionRules.find(([s]) => s === EXC + '::-webkit-scrollbar');
const thumbRule = exceptionRules.find(([s]) => s === EXC + '::-webkit-scrollbar-thumb');
const zoomRule = exceptionRules.find(([s]) => s === ".desk-frame-stage--prose .mode-pagecol[data-zoom='true'] .mode-scroll");
// ORIGINAL (this file's own live T5 [successor] width check, scrollbar-flush's first build; parked verbatim):
// ok('T5 [successor]: the bar is 10px / the APPLIED scale, rounded to the nearest whole layout pixel (the engine truncates a fractional bar width: 10/1.74 = 5.74 painted 8.7px) (--wz-sb-k = --wz-k, times --wz-zoom while the column is zoomed - the expressions page-size\'s own transform rules use)',
//   !!barRule && /width:\s*round\(nearest, calc\(10px \/ var\(--wz-sb-k\)\), 1px\)/.test(barRule[1]) && !!resetRule && /--wz-sb-k:\s*var\(--wz-k, 1\)/.test(resetRule[1])
//   && !!zoomRule && /--wz-sb-k:\s*calc\(var\(--wz-k, 1\) \* var\(--wz-zoom, 1\.6\)\)/.test(zoomRule[1]), JSON.stringify({ barRule, zoomRule }));
// SUPERSEDED (Fable Oct 25, FIX's diagnosis of the line-break reds): a bar whose layout width changes with the scale takes a different bite out of the text column and reflows the lines. The bar's layout width is now a
// variable (--wz-sb-w = min(10px, round(nearest, 10px / --wz-sb-k, 1px))) and .mode-scroll takes a right padding of (10px - that width), so bar + padding is 10 layout px at every scale and zoom. The same 10px / applied-scale
// sense is kept (the variable carries the original expression, unchanged); what is new is the cap and the padding. Live successor below; the DOM half is scrollbar-flush.mjs COLUMN.
ok('T5 [r2 successor]: the bar is 10px / the APPLIED scale rounded to the nearest whole layout pixel, capped at 10 (--wz-sb-w), and the bar rule reads that variable; --wz-sb-k = --wz-k, times --wz-zoom while the column is zoomed',
  !!barRule && /width:\s*var\(--wz-sb-w\)/.test(barRule[1]) && !!resetRule && /--wz-sb-w:\s*min\(10px, round\(nearest, calc\(10px \/ var\(--wz-sb-k\)\), 1px\)\)/.test(resetRule[1]) && /--wz-sb-k:\s*var\(--wz-k, 1\)/.test(resetRule[1])
  && !!zoomRule && /--wz-sb-k:\s*calc\(var\(--wz-k, 1\) \* var\(--wz-zoom, 1\.6\)\)/.test(zoomRule[1]), JSON.stringify({ barRule, resetRule, zoomRule }));
// ORIGINAL (r2's first pairing check, e2adbfb7; parked verbatim): ok('T5 [r2 successor]: the PAIRING - .mode-scroll takes padding-right: calc(10px - var(--wz-sb-w)), so bar + padding is 10 layout px and the text column is one width at every scale and zoom',
//   !!resetRule && /padding-right:\s*calc\(10px - var\(--wz-sb-w\)\)/.test(resetRule[1]), JSON.stringify(resetRule));
// SUPERSEDED (r2.1, the box run of e2adbfb7): that form of the rule REPLACED the plain `.mode-scroll` rule's own padding-right (the page's pad-x, which cancels its negative right margin), so the text column grew by one
// page margin (fx10 S1 grip reds, COLUMN). The pairing ADDS to the cancellation: pad-x x paper-scale + (10px - the bar). Successor below.
const PAIR = /padding-right:\s*calc\(var\(--wz-page-pad-x, 38px\) \* var\(--paper-scale, 1\) \+ 10px - var\(--wz-sb-w\)\)/;
ok('T5 [r2.1 successor]: the PAIRING - .mode-scroll takes padding-right: calc(<the margin cancellation it already carries: pad-x x paper-scale> + 10px - var(--wz-sb-w)), so bar + the extra is 10 layout px and the text column is one width at every scale and zoom',
  !!resetRule && PAIR.test(resetRule[1]), JSON.stringify(resetRule));
ok('T5 [successor]: the thumb is a SQUARE (border-radius 0) in the paper-toned --ink-on-paper-low, the track clear',
  !!thumbRule && /background:\s*var\(--ink-on-paper-low\)/.test(thumbRule[1]) && /border-radius:\s*0/.test(thumbRule[1]) && exceptionRules.some(([s, b]) => s === EXC + '::-webkit-scrollbar-track' && /background:\s*transparent/.test(b)), JSON.stringify(thumbRule));
ok('T5: ...and the standard mechanism IS present: the systemic `*` rule sets scrollbar-width:thin and a theme-token scrollbar-color',
  /\*\{\s*scrollbar-width: thin;\s*scrollbar-color: var\(--ink-border-strong\) transparent;\s*\}/.test(css), '');
ok('T5: ...and the paper-toned group (.mode-scroll, .desk-frame-scroll-cap, .board-canvas-wrap) and the card text keep their scrollbar-color',
  /\.mode-scroll, \.desk-frame-scroll-cap, \.board-canvas-wrap\{\s*scrollbar-color: var\(--ink-on-paper-low\) transparent;\s*\}/.test(css) && /\.board-text\{ scrollbar-color: var\(--ink-on-card-low\) transparent; \}/.test(css), '');

// T6 - the board wrap paints the board surface, so the vertical bar (in its gutter) and the horizontal bar (below the canvas) sit on paper, not the dark desk ground
const wrapRule = css.match(/\n\.board-canvas-wrap\{ scrollbar-gutter:stable; background:var\(--paper\); \}/);
ok('T6: .board-canvas-wrap paints var(--paper) (the canvas\'s own surface) beside its stable gutter - the paper-toned thumb is not dark-on-dark', !!wrapRule, wrapRule ? 'found' : 'rule not found');
{
  const m = css.replace('background:var(--paper); }\n.board-canvas{', ' }\n.board-canvas{');
  ok('MUTANT: the wrap loses its paper background (the dark-gutter, invisible-in-Flux-light state) - T6 must go RED', m !== css && !/\n\.board-canvas-wrap\{ scrollbar-gutter:stable; background:var\(--paper\); \}/.test(m), '');
}

// MUTANT - the dead webkit width rule comes back (the old 8px), OUTSIDE the one exception - T5 [successor] must go RED
{
  const mutated = (css + '\n::-webkit-scrollbar{ width:8px; height:8px; }\n').replace(/\/\*[\s\S]*?\*\//g, '');
  const outside = mutated.replace(/@supports selector\(::-webkit-scrollbar\)\{[\s\S]*?\n\}/, '');
  ok('MUTANT: a ::-webkit-scrollbar{width:8px} rule is re-added OUTSIDE the exception - T5 [successor] must go RED (the mutation LANDED, and the real source has none outside)',
    mutated !== cssRules && /::-webkit-scrollbar/.test(outside) && !/::-webkit-scrollbar/.test(outsideException), '');
}
// MUTANTS of the exception itself - each rewrites the real CSS, asserts the mutation LANDED, and the successor's own predicate goes false
{
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
  const land = (from, to) => { const next = css.replace(from, to); return next === css ? null : strip(next); };
  const resetGone = land(`+ 10px - var(--wz-sb-w)); scrollbar-width:auto; scrollbar-color:auto; }`, `+ 10px - var(--wz-sb-w)); }`);
  const resetOf = (t) => { const b = (/@supports selector\(::-webkit-scrollbar\)\{([\s\S]*?)\n\}/.exec(t) || [, ''])[1]; const r = [...b.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((m) => m[1].trim() === EXC); return !!r && /scrollbar-width:\s*auto/.test(r[2]) && /scrollbar-color:\s*auto/.test(r[2]); };
  ok('MUTANT: the auto reset is removed from the exception (the pseudo rules would be dead under Chromium >= 121) - T5 [successor] must go RED (the mutation LANDED)', resetGone !== null && !resetOf(resetGone) && resetOf(cssRules), '');
  const unscaled = land('width:var(--wz-sb-w); }', 'width:10px; }');
  ok('MUTANT: the bar is a flat 10px of layout (the scaled-up bar of 3840 returns) - T5 [r2 successor] must go RED (the mutation LANDED)', unscaled !== null && !/width:\s*var\(--wz-sb-w\)/.test(unscaled) && /width:\s*var\(--wz-sb-w\)/.test(cssRules), '');
  const noPad = land(' + 10px - var(--wz-sb-w));', ');');
  ok('MUTANT: the (10px - the bar) extra is dropped from the padding (the text column takes a different bite at every scale again) - the PAIRING check must go RED (the mutation LANDED)', noPad !== null && !PAIR.test(noPad) && PAIR.test(cssRules), '');
  const replaced = land('padding-right:calc(var(--wz-page-pad-x, 38px) * var(--paper-scale, 1) + 10px - var(--wz-sb-w));', 'padding-right:calc(10px - var(--wz-sb-w));');
  ok('MUTANT: the padding REPLACES the margin cancellation (the first r2 form: the text column grew by a page margin) - the PAIRING check must go RED (the mutation LANDED)', replaced !== null && !PAIR.test(replaced) && PAIR.test(cssRules), '');
  const uncapped = land('--wz-sb-w: min(10px, round(nearest, calc(10px / var(--wz-sb-k)), 1px));', '--wz-sb-w: round(nearest, calc(10px / var(--wz-sb-k)), 1px);');
  ok('MUTANT: the 10px cap is dropped (below scale 1 the padding would have to go negative) - T5 [r2 successor] must go RED (the mutation LANDED)', uncapped !== null && !/--wz-sb-w:\s*min\(10px,/.test(uncapped) && /--wz-sb-w:\s*min\(10px,/.test(cssRules), '');
  const unwrapped = land('@supports selector(::-webkit-scrollbar){\n', '');
  ok('MUTANT: the @supports wrapper is dropped (Firefox would lose `thin`) - T5 [successor] must go RED (the mutation LANDED)', unwrapped !== null && !/@supports selector\(::-webkit-scrollbar\)/.test(unwrapped) && /@supports selector\(::-webkit-scrollbar\)/.test(cssRules), '');
  const noZoom = land("--wz-sb-k: calc(var(--wz-k, 1) * var(--wz-zoom, 1.6));", '--wz-sb-k: var(--wz-k, 1);');
  ok('MUTANT: the zoom multiplier is dropped (the bar would scale 1.6x while the page is zoomed) - T5 [successor] must go RED (the mutation LANDED)', noZoom !== null && !/--wz-sb-k:\s*calc\(var\(--wz-k, 1\) \* var\(--wz-zoom, 1\.6\)\)/.test(noZoom) && !!zoomRule, '');
}

// MUTANT - revert to the exact pre-fix regression (the hardcoded literal ITEM 83 M3 silently broke)
{
  const mutated = css.replace(
    `margin-right:calc(-1 * ${SHARED_VAR} * var(--paper-scale));\n  padding-right:calc(${SHARED_VAR} * var(--paper-scale)); }`,
    `margin-right:calc(-38px * var(--paper-scale)); padding-right:calc(38px * var(--paper-scale)); }`,
  );
  const landed = mutated !== css;
  // r2.1: anchored to the plain rule's own line start. The unanchored probe (`/\.mode-scroll\{[^}]*\}/`) found the FIRST `.mode-scroll{` in the file - the page-scale exception's rule, which has carried no shared variable
  // until the pairing - and so went "red" for the wrong rule (a blind pass); the pairing now reads the variable too, which exposed it.
  const mutatedMatch = mutated.match(/\n\.mode-scroll\{[^}]*\}/);
  const wentRed = landed && !(mutatedMatch?.[0].includes(SHARED_VAR));
  ok('MUTANT: .mode-scroll\'s cancellation reverts to the old hardcoded 38px literal (the exact ITEM-83-M3 regression) - T1 must go RED',
    wentRed, JSON.stringify({ landed }));
}

// PARKED (HARNESS_PARKED=1) - the retired claim, quoted verbatim, with the ruled truth as its condition (successor: T5 [successor])
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  pok('PARKED (was "T5: ONE mechanism - index.css carries NO ::-webkit-scrollbar rule (they are dead under Chromium >= 121 wherever the standard properties are set, and the `*` rule sets them everywhere)") - Fable Oct 23 (3840: the page bar scales with page-size\'s transform), reading A: ONE scoped exception on `.desk-frame-stage--prose .mode-scroll`, inside @supports selector(::-webkit-scrollbar); live successor: T5 [successor]',
    webkitScrollbarRules.length > 0 && webkitSelectors.length === 3 && !/::-webkit-scrollbar/.test(outsideException), JSON.stringify({ total: webkitScrollbarRules.length, outside: (outsideException.match(/::-webkit-scrollbar[\w-]*/g) || []).length }));
  pok('PARKED (was "T5 [successor]: the bar is 10px / the APPLIED scale, rounded to the nearest whole layout pixel (the engine truncates a fractional bar width: 10/1.74 = 5.74 painted 8.7px) (--wz-sb-k = --wz-k, times --wz-zoom while the column is zoomed - the expressions page-size\'s own transform rules use)" - the bar rule carried the width expression itself) - Fable Oct 25 (FIX\'s line-break diagnosis): the expression moved into --wz-sb-w, capped at 10px, with the bar rule reading the variable and a right padding of 10px less that width; live successors: T5 [r2 successor] x2',
    !!barRule && !/width:\s*round\(nearest/.test(barRule[1]) && /width:\s*var\(--wz-sb-w\)/.test(barRule[1]) && !!resetRule && /--wz-sb-w:\s*min\(10px, round\(nearest, calc\(10px \/ var\(--wz-sb-k\)\), 1px\)\)/.test(resetRule[1]), JSON.stringify({ barRule }));
  console.log(JSON.stringify(parkedChecks, null, 2));
  console.log(parkedChecks.every((c) => c.pass) ? `\nSCROLLBAR-FLUSH-SOURCE PARKED: PASS (${parkedChecks.length} checks) - this FILE parks 2: T5's no-webkit claim; T5's bar-width expression (item 3 r2)` : '\nSCROLLBAR-FLUSH-SOURCE PARKED: FAIL');
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nSCROLLBAR-FLUSH-SOURCE VERIFY: PASS (${checks.length} checks)` : `\nSCROLLBAR-FLUSH-SOURCE VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
