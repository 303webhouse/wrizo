# Rulings: `apps/desktop/src/store/themeIcons.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[themeIcons §n]` points here.

## themeIcons §1

From `apps/desktop/src/store/themeIcons.ts`, line 3 at `7f1c6a84` (the comment that stays: "the icon seam: theme -> icon id -> a 1-bit pixel map or SVG paths; no entry = null and the caller draws its own; Flux's maps are used exactly as drawn (flux-v2.mjs holds them byte-equal)").

```ts
// THE ICON SEAM (Flux v2, Fable Oct 21: "make the icon seam GENERIC"). theme -> icon id -> a 1-bit pixel map OR a set of SVG paths. A theme with no entry gets null and the caller draws its own
// icon (Arbor's stay where they are, in components/Cascade.tsx); TOOLS adds the Arbor and Machina sets here later. Used through components/ThemeIcon.tsx by the rail, the place block
// and the pop-out.
//
// FLUX: Fable's eight pixel maps (flux-icons-v2) and the INPUT glyph (icons-v3: an arrow into a socket, which replaces the Link chain), used EXACTLY - never redrawn. 16 x 16, '#' = on,
// square ends. The maps are also kept under docs/theme-foundations/flux/ and scripts/harness/flux-v2.mjs holds this table byte-equal to them.
```

## themeIcons §2

From `apps/desktop/src/store/themeIcons.ts`, line 183 at `7f1c6a84` (the comment that stays: "Machina's set, used exactly as drawn (rects written as the equivalent closed paths)").

```ts
  // MACHINA - Fable's corporate-instrument set (icons-v3, approved with the mockup cursor/machina-v1-mockup @ 360f3db3): a precise square-cut line, 24 x 24, stroke 1.25, square caps, miter joins.
  // Used EXACTLY as drawn - the mockup's <rect>s are written as the equivalent closed paths (same geometry) because the spec carries paths. The Notebook is the SPIRAL glyph (Fable's round-3 build
  // note, machina-build-brief.md), not the old ruled-ledger one still drawn in the mockup's own icon sheet. Slots: rack = Project, docs = Files, circuits = Plans, log = Notebook, config = Controls,
  // skin = Theme, trash = Trash, cartridge = Folder, input = Assets.
```
