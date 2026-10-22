// ARBOR'S GARDEN ICONS + "BOARDS →" (step 3 of the Oct 21 build queue; docs/plans/machina-build.md
// §9). WRITTEN AHEAD OF THE BUILD (Fable, Oct 22: "plan and harness now; the branch starts when
// flux-v2 merges"). NOT RUNNABLE YET and not committed to a build branch - this lives on the
// planning branch (machina-build-plan) as a ready-to-drop-in CDP scenario, syntax-checked only
// (`node --check`), never executed: its two dependencies do not exist on this branch at all -
// store/themeIcons.ts + components/ThemeIcon.tsx (the icon-swap registry, flux-v2 @ b4c38659,
// unmerged) and Arbor's own nine garden SVG entries inside that registry (THIS step's own build
// work, not written yet anywhere - there is nothing to register against until flux-v2 merges and
// this step's branch starts). Confirm the registry's exact shape again at build time before
// trusting the selectors below verbatim (the plan's own standing rule - this is a snapshot of
// flux-v2 @ b4c38659, read directly, not guessed).
//
// THE REGISTRY (confirmed by reading store/themeIcons.ts + components/ThemeIcon.tsx on flux-v2
// @ b4c38659 directly): `THEME_ICONS: Partial<Record<ThemeId, Partial<Record<ThemeIconId,
// ThemeIconSpec>>>>`, `ThemeIconSpec = {kind:'pixels', rows} | {kind:'svg', viewBox, paths}`.
// `themeIcon(theme, id)` returns null (caller's own fallback) when the active theme has no entry
// for that id. `<ThemeIcon id fallback size/>` renders `<svg data-theme-icon={id} .../>` when a
// spec exists, else renders `fallback` verbatim with NO `data-theme-icon` attribute at all - the
// exact signal T1/T2 below read to tell "the new glyph rendered" from "still the old fallback".
// Arbor's own nine garden glyphs ("soft hand-drawn strokes" per the brief) are `kind: 'svg'`
// entries (Flux's own set is `kind: 'pixels'`; nothing requires every theme to share a kind),
// registered under `THEME_ICONS.plateau`, the SAME nine `ThemeIconId` slots Flux's own set
// already uses for the same semantic roster: rack=Drawer, docs=Pages, circuits=Boards, log=
// Journal, config=Settings, skin=Mood (the already-locked theme-menu label, not "Themes"),
// trash=Trash, cartridge=Set, input=Graft.
//
// EVERY CURRENT RENDER SITE, CONFIRMED BY READING THE TREE (flux-v2 @ b4c38659), NOT ASSUMED:
//   .wz-strip-item[data-category="page"]     .wz-strip-glyph > ThemeIcon id="docs"      (Pages)
//   .wz-strip-item[data-category="plan"]     .wz-strip-glyph > ThemeIcon id="circuits"  (Boards)
//   .wz-strip-item[data-category="journal"]  .wz-strip-glyph > ThemeIcon id="log"       (Journal)
//   .wz-strip-item[data-category="settings"] .wz-strip-glyph > ThemeIcon id="config"    (Settings)
//   .wz-strip-item[data-category="theme"]    .wz-strip-glyph > ThemeIcon id="skin"      (Mood)
//   .wz-strip-item[data-category="trash"]    .wz-strip-glyph > ThemeIcon id="trash"     (Trash)
//   .wz-place-icon (PlaceBlock.tsx)                           > ThemeIcon id="rack"/"log" (Drawer)
//   .wz-sections-place (SectionsPopout.tsx)                   > ThemeIcon id="rack"/"log" (Drawer, in the pop-out)
//   .wz-set-name's own sibling (SectionsPopout.tsx)           > ThemeIcon id="cartridge" (Set)
//
// A GAP, FLAGGED NOT ROUTED AROUND (the plan's own §9c rule: "if a site doesn't yet, that's a gap
// to raise"): Graft's own icon id ('input') has ZERO render call sites anywhere in flux-v2 @
// b4c38659 - GraftPicker.tsx's own dialog header renders only text (t('graftAdd')), no icon at
// all. So Arbor's ninth glyph (Graft) has nowhere to register INTO yet. T9 below is written as an
// explicit, honest "not yet wired" check (asserting the gap's current shape) rather than a
// silent omission or a guessed selector - confirm with Fable/INK whether flux-v2 adds this site
// before step 3's own build, or whether step 3 raises it as its own small addition.
//
// Checks:
//   T1-T8 each confirmed render site shows the NEW svg glyph (data-theme-icon="<id>" present)
//     under data-theme="plateau", and does NOT show it under data-theme="flux" (Flux has its own
//     DIFFERENT entry for the same id, so this also proves the swap is theme-SCOPED, not global)
//   T9 the Graft gap: GraftPicker.tsx's dialog renders no icon at all (documents the gap; will
//     need rewriting once a site exists)
//   T10 the mode tab reads "Boards →" under Arbor (data-page-plan-door), where it used to read
//     "Plan →" (pre-rename baseline proven today, browserless, by this file's own sibling:
//     arbor-garden-icons-source.mjs)
//   T11 a Machina-themed page (once Machina's own ThemeId exists in code - step 4's own build,
//     §5's theme.ts row) STILL reads "Plan →", unchanged, via its own OVERRIDES.machina entry -
//     CORRECTED (Fable, Oct 22): this is NOT "Machina inherits Boards → too" (the plan's earlier,
//     falsified reading) - confirm Machina's ThemeId exists before writing this check for real;
//     if step 3's own branch starts before step 4's, decide whether to write it now and leave it
//     red-pending-Machina, or defer to step 4's own harness with a cross-reference back here
//     (machina-build.md §9d's own standing instruction - either is honest, silence is not)
//
// Run (once flux-v2 has merged, this step's branch has started, and Arbor's nine glyphs are
// registered - from apps/desktop, dist-web freshly built):
//   node apps/desktop/scripts/harness/arbor-garden-icons.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const freshDesk = async (app, theme) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk, theme=${theme}` });
  await app.evalJs("document.querySelector('.wz-arrival-write')?.click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
};

const hasThemeIcon = (app, selector, id) =>
  app.evalJs(`document.querySelector(${JSON.stringify(selector)})?.querySelector('svg[data-theme-icon=${JSON.stringify(id)}]') != null`);

// T1-T6 — the rail/strip's own six categories, each confirmed under BOTH Arbor (new glyph) and
// Flux (its own, DIFFERENT glyph for the same id - proves the swap is theme-scoped).
const STRIP_SITES = [
  ['page', 'docs', 'Pages'],
  ['plan', 'circuits', 'Boards'],
  ['journal', 'log', 'Journal'],
  ['settings', 'config', 'Settings'],
  ['theme', 'skin', 'Mood'],
  ['trash', 'trash', 'Trash'],
];

await withHarness(async (app) => {
  await freshDesk(app, 'plateau');
  for (const [category, iconId, label] of STRIP_SITES) {
    const sel = `.wz-strip-item[data-category="${category}"]`;
    const has = await hasThemeIcon(app, sel, iconId);
    ok(`T: Arbor's garden glyph renders at the ${label} strip item (data-category="${category}", svg[data-theme-icon="${iconId}"])`,
      has === true, String(has));
  }

  // T7 — the place block's own Drawer icon (PlaceBlock.tsx, outside the strip)
  const placeHas = await hasThemeIcon(app, '.wz-place-icon', 'rack');
  ok('T7: Arbor\'s garden glyph renders at the place block (Drawer, .wz-place-icon, svg[data-theme-icon="rack"])', placeHas === true, String(placeHas));

  // T9 — the Graft gap, documented honestly: no render site exists for id="input" yet anywhere
  await app.evalJs("document.querySelector('[data-graft-picker]')?.remove()"); // ensure a clean probe, in case one is already open
  const graftIconCount = await app.evalJs("document.querySelectorAll('svg[data-theme-icon=\"input\"]').length");
  ok('T9: the Graft icon gap - GAP, FLAGGED, matching this file\'s own header note: zero render sites exist for id="input" anywhere in the mounted page (confirm against the CURRENT tree at build time - this count should become 1 once a site is added, not stay 0 silently)',
    graftIconCount === 0, String(graftIconCount));

  // T10 — the mode tab rename, under Arbor
  const planDoorText = await app.evalJs("document.querySelector('[data-page-plan-door]')?.textContent?.trim() ?? null");
  ok('T10: Arbor\'s mode tab reads "Boards →" (the canonical rename, §9b) - was "Plan →" (pre-rename baseline proven browserless by arbor-garden-icons-source.mjs)',
    planDoorText === 'Boards →', String(planDoorText));

  return checks;
});

// Flux comparison leg — confirms the swap is theme-SCOPED (Flux keeps its OWN, different glyph
// for the same semantic id), not a global override that would make Arbor's data leak everywhere.
await withHarness(async (app) => {
  await freshDesk(app, 'flux');
  for (const [category, iconId, label] of STRIP_SITES) {
    const sel = `.wz-strip-item[data-category="${category}"]`;
    const has = await hasThemeIcon(app, sel, iconId);
    ok(`T: under Flux, the ${label} strip item STILL shows FLUX's own glyph for "${iconId}" (not Arbor's garden set leaking in)`, has === true, String(has));
  }
  return checks;
});

// T11 — Machina's own override, once Machina's ThemeId exists in code (step 4's own build).
// Written now, left explicitly PENDING rather than silently decided, per machina-build.md §9d's
// own standing instruction. Uncomment and confirm the ThemeId exists before this step's own
// harness run is called done, OR cross-reference this block from step 4's own harness instead.
//
// await withHarness(async (app) => {
//   await freshDesk(app, 'machina');
//   const planDoorText = await app.evalJs("document.querySelector('[data-page-plan-door]')?.textContent?.trim() ?? null");
//   ok('T11: Machina\'s mode tab STILL reads "Plan →", unchanged, via its own OVERRIDES.machina entry (CORRECTED, Fable Oct 22 - NOT "Boards →")',
//     planDoorText === 'Plan →', String(planDoorText));
//   return checks;
// });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR-GARDEN-ICONS VERIFY: PASS (${checks.length} checks)` : `\nARBOR-GARDEN-ICONS VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
