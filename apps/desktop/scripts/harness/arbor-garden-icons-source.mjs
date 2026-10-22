// ARBOR'S GARDEN ICONS + "BOARDS →" (step 3 of the Oct 21 build queue; docs/plans/machina-build.md
// §9). PLANNED AHEAD OF THE BUILD (Fable, Oct 22): the branch itself starts only once flux-v2
// merges (store/themeIcons.ts + components/ThemeIcon.tsx, the icon-swap registry this step reads
// from, live there - §9a), but this file's own half needs none of that. It proves the PRE-RENAME
// baseline the step 3 build will change, and the lexicon mechanism (CANONICAL/OVERRIDES) that
// mechanism's own correctness depends on - all of it already live on main today.
//
// THE CORRECTION THIS FILE EXISTS TO GUARD (machina-build.md §1c/§9b, Fable Oct 22): an earlier
// draft of the plan reasoned that once Arbor's own canonical "Plan →" renames to "Boards →",
// Machina's own mode tab would inherit that rename automatically (no override needed). That
// inference is WRONG - the approved, Nick-cleared build mockup (cursor/machina-v1-mockup @
// 360f3db3) shows Machina's own strip still reading "PLAN →" literally - so Machina needs an
// explicit `OVERRIDES.machina.pagePlanDoor = 'Plan'` entry, reinstating the pre-rename word ON
// TOP of a canonical rename, not an absence of one. An override sitting on top of a fresh rename
// is exactly the shape a careless CANONICAL-table edit silently breaks (delete the canonical row
// without checking who overrides it, and the override looks unaffected until read against the
// NEW value) - which is the specific hazard T1/T2 below exist to catch, now, before the rename.
//
// What is proven TODAY (browserless, no grant needed - pure source reads, same technique as
// typewriter-scope-source.mjs/item207-core.mjs):
//   T1 the canonical `pagePlanDoor` term is exactly 'Plan' today (the pre-rename baseline step 3
//      will change to 'Boards') - a drifted baseline would mean this plan's own "before" picture
//      is already stale, and nobody would rename what they read
//   T2 the "→" arrow is a DECORATIVE SIBLING SPAN in the component (`<span aria-hidden="true">
//      →</span>`), never concatenated into the lexicon string itself - confirms the rename step
//      only ever needs to touch the WORD ('Plan' -> 'Boards'), never an arrow-bearing string
//   T3 no OVERRIDES entry exists yet, under ANY theme, for `pagePlanDoor` - a pre-condition: if
//      one already existed (e.g. Flux quietly got one), Machina's planned override wouldn't be
//      the first and this plan's own assumption ("Machina is the first to need one") would need
//      re-checking before the rename lands
//   T4 the resolver itself (`deskTerm`) is exactly the documented CANONICAL/OVERRIDES pattern -
//      `OVERRIDES[resolved]?.[term] ?? CANONICAL[term]` - the mechanism Machina's own override
//      will ride, proven to exist in exactly this shape before the build depends on it
//   MUTANT (must turn T1 red): the canonical value is silently renamed early (someone jumps the
//      gun on the rename before Machina's own override is written) - proves T1 would actually
//      catch that sequencing mistake, not just happen to agree with today's source
//
// NOT proven here (waits on later steps, named so the gap isn't silent):
//   - Machina's own OVERRIDES.machina.pagePlanDoor = 'Plan' entry (Machina's ThemeId doesn't
//     exist in code yet - §5's own theme.ts row is step 4's own build, not this step's)
//   - the actual rename to 'Boards' (this step's own build, not prep)
//   - Arbor's nine garden SVG glyphs rendering through ThemeIcon (needs flux-v2's registry
//     merged - see the sibling CDP file, arbor-garden-icons.mjs, written but unrun for the same
//     reason)
//
// Run (from the repo root, no server/grant needed):
//   node apps/desktop/scripts/harness/arbor-garden-icons-source.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const SRC = join(DESKTOP, 'src');
const src = (rel) => readFileSync(join(SRC, rel), 'utf8').replace(/\r\n/g, '\n');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };

const lex = src('store/deskLexicon.ts');
const pe = src('pages/PageEditor.tsx');

// T1 - the pre-rename baseline
const canonicalMatch = lex.match(/pagePlanDoor:\s*'([^']*)',/);
ok('T1: the canonical pagePlanDoor term is exactly \'Plan\' today - the pre-rename baseline step 3 will change to \'Boards\'',
  canonicalMatch?.[1] === 'Plan', JSON.stringify(canonicalMatch?.[1] ?? null));

// T2 - the arrow is a decorative sibling, never concatenated into the string
const renderSites = [...pe.matchAll(/\{dt\('pagePlanDoor'\)\} <span aria-hidden="true">→<\/span>/g)];
ok('T2: every pagePlanDoor render site keeps the arrow as a decorative sibling span, never baked into the lexicon string (exactly 2 sites, PageEditor.tsx)',
  renderSites.length === 2, String(renderSites.length));
ok('T2: no lexicon string anywhere literally contains the arrow glyph concatenated onto "Plan" (confirms the rename only ever touches the word)',
  !/pagePlanDoor:\s*'[^']*→/.test(lex), '');

// T3 - no OVERRIDES entry exists yet for this key, under any theme
const overridesBlock = lex.slice(lex.indexOf('const OVERRIDES'));
ok('T3: no theme has an OVERRIDES entry for pagePlanDoor yet - Machina\'s planned override (machina-build.md §1c/§9b) would be the first',
  !/pagePlanDoor:/.test(overridesBlock), '');

// T4 - the resolver mechanism itself
ok('T4: the resolver is exactly the documented CANONICAL/OVERRIDES pattern (OVERRIDES[resolved]?.[term] ?? CANONICAL[term])',
  /return OVERRIDES\[resolved\]\?\.\[term\] \?\? CANONICAL\[term\];/.test(lex), '');

// MUTANT - the canonical value renamed early, out of sequence with Machina's own override
{
  const mutated = lex.replace("pagePlanDoor: 'Plan',", "pagePlanDoor: 'Boards',");
  const landed = mutated !== lex;
  const mutatedMatch = mutated.match(/pagePlanDoor:\s*'([^']*)',/);
  const wentRed = landed && mutatedMatch?.[1] !== 'Plan';
  ok('MUTANT: the canonical value is renamed early (jumping the rename ahead of Machina\'s own override) - T1 must go RED',
    wentRed, JSON.stringify({ landed, mutatedValue: mutatedMatch?.[1] ?? null }));
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nARBOR-GARDEN-ICONS-SOURCE VERIFY: PASS (${checks.length} checks)` : `\nARBOR-GARDEN-ICONS-SOURCE VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
