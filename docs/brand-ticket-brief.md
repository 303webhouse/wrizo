# Brand Ticket — Build Brief for CC

**Branch:** `brand-paint` off `main` / `m1-creative-flow` (clean tree, current).
**Size:** small. This is a **paint ticket** — names, fonts, colors. If you find yourself *moving or restructuring* elements, you've left scope.

## Mission
Make the app stop calling itself Ember. Apply the Wrizo brand's name, fonts, and accent **globally** — nothing structural.
1. De-confounds testing — the live writing arc (CW1/CW2/CW4) is invisible under an old brand that screams "nothing shipped."
2. Foundation HOME inherits — setting font + color tokens now means the HOME port consumes them.

## The one rule: paint, don't rebuild
Swap strings, fonts, color tokens. Do NOT touch launchpad layout, homepage, or any component structure. Same components, same layout — repainted.

## Scope — four changes
1. **Name: Ember → Wrizo.** Grep `Ember` across `apps/desktop/src` + `index.html`; replace UI-facing instances with Wrizo. Wordmark: replace the "Ember" text AND the "E" glyph in the header with the text **Wrizo** in Figtree. **No glyph.** Tab `<title>` → Wrizo. Do NOT rename package names (`@writer-studio/*`).
2. **Fonts.** Titles/UI/buttons/labels → **Figtree** (in package.json, wire the import). Body/writing surface/quoted words → **Crimson Pro** (`pnpm add`). Match existing `@fontsource-variable/*`. After add, grep installed CSS for `font-family:` for the exact family string. Set both in the global token layer. Remove Mulish/Newsreader/Courier Prime.
3. **Accent: #ff9800.** Set the accent token. Locked + invariant.
4. **Ground: #110600.** Base background → deep espresso.

## Out of scope
Launchpad/home layout, homepage, tagline "For humans writing", atmosphere/ember finish accents (B3/B4), responsive (W5), theme system, hand-drawn wordmark.

## Acceptance
- Nothing says "Ember"; header reads Wrizo in Figtree; tab title Wrizo.
- Titles/UI/buttons in Figtree; body + writing surface in Crimson Pro.
- Accent exactly #ff9800; ground #110600.
- Structurally unchanged.
- Build-log self-check: build emits `figtree-*` and `crimson-pro-*` woff2 and NO `mulish-*` / `newsreader-*` / `courier-prime-*`.
