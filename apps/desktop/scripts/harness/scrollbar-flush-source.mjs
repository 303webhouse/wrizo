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
const modeScrollMatch = css.match(/\.mode-scroll\{[^}]*\}/);
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
ok('T5: ONE mechanism - index.css carries NO ::-webkit-scrollbar rule (they are dead under Chromium >= 121 wherever the standard properties are set, and the `*` rule sets them everywhere)',
  webkitScrollbarRules.length === 0, JSON.stringify(webkitScrollbarRules));
ok('T5: ...and the standard mechanism IS present: the systemic `*` rule sets scrollbar-width:thin and a theme-token scrollbar-color',
  /\*\{\s*scrollbar-width: thin;\s*scrollbar-color: var\(--ink-border-strong\) transparent;\s*\}/.test(css), '');
ok('T5: ...and the paper-toned group (.mode-scroll, .desk-frame-scroll-cap, .board-canvas-wrap) and the card text keep their scrollbar-color',
  /\.mode-scroll, \.desk-frame-scroll-cap, \.board-canvas-wrap\{\s*scrollbar-color: var\(--ink-on-paper-low\) transparent;\s*\}/.test(css) && /\.board-text\{ scrollbar-color: var\(--ink-on-card-low\) transparent; \}/.test(css), '');

// MUTANT - the dead webkit width rule comes back (the old 8px) - T5 must go RED
{
  const mutated = (css + '\n::-webkit-scrollbar{ width:8px; height:8px; }\n').replace(/\/\*[\s\S]*?\*\//g, '');
  ok('MUTANT: the ::-webkit-scrollbar{width:8px} rule is re-added - T5 must go RED',
    mutated !== cssRules && (mutated.match(/::-webkit-scrollbar[\w-]*/g) || []).length > 0, '');
}

// MUTANT - revert to the exact pre-fix regression (the hardcoded literal ITEM 83 M3 silently broke)
{
  const mutated = css.replace(
    `margin-right:calc(-1 * ${SHARED_VAR} * var(--paper-scale));\n  padding-right:calc(${SHARED_VAR} * var(--paper-scale)); }`,
    `margin-right:calc(-38px * var(--paper-scale)); padding-right:calc(38px * var(--paper-scale)); }`,
  );
  const landed = mutated !== css;
  const mutatedMatch = mutated.match(/\.mode-scroll\{[^}]*\}/);
  const wentRed = landed && !(mutatedMatch?.[0].includes(SHARED_VAR));
  ok('MUTANT: .mode-scroll\'s cancellation reverts to the old hardcoded 38px literal (the exact ITEM-83-M3 regression) - T1 must go RED',
    wentRed, JSON.stringify({ landed }));
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nSCROLLBAR-FLUSH-SOURCE VERIFY: PASS (${checks.length} checks)` : `\nSCROLLBAR-FLUSH-SOURCE VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
