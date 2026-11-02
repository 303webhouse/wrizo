# Themes

**What lives here:** the skins (Arbor = `plateau`, Flux, Machina with its cool and neutral casts), the tokens, fonts, and theme effects.
**Owner (proposal):** POLISH, plus the theme lanes (ARBOR, Machina). **Back to** [MAP](../MAP.md).

## Entry files
- `index.css`: an ordered list of `@import`s of `styles/*.css` (#13 step 6), and the build inlines them in that order: `:root` tokens first ([`styles/01-tokens.css`](../../apps/desktop/src/styles/01-tokens.css)), then the theme blocks, then the component sections. A script reads the global CSS as one text through `scripts/global-css.mjs`, never `index.css` itself.
- `store/theme.ts` (the theme in force), `store/themeCast.ts` (`data-cast`, Machina's neutral cast), `store/themePrefs.ts`.
- `store/themeFontFaces.ts`, `store/themeFonts.ts`, `store/fontRoster.ts`, `store/fluxThemeFx.ts`, `components/ThemeEffectsLayer.tsx`.

## Seams and hooks
`window.wrizoTheme`, `window.wrizoCast`, `window.wrizoThemePrefs`, `window.wrizoThemeFx`, `window.wrizoFluxFx`, `window.wrizoAmbiance`.

## Full pair
`index.css` and `styles/` are global CSS: any change to them runs the full pair.

## Covering harnesses (start here)
`th1.mjs`, `th2.mjs`, `th-machina.mjs`, `th-machina-source.mjs`, `flux-v2.mjs`, `flux-v2-part2.mjs`, `machina-deckwizard.mjs`, `splash.mjs`.

## Known traps
- **Laws 1–3 hold in every skin:** the page identical, card geometry identical, each theme implied rather than literal, contrast ≥ 13.9 / 4.5 / 7 (page text / labels / names).
- **"Square edges, no shadows" is retired** (Nick, Nov 1). A cross-theme check that still asserts it is parked verbatim with a record. A theme's own look (Machina's square edges) stays checked in that theme.
- **Arbor's new CSS lives in its own file** (arbor-v2.css, on the unmerged arbor/mockup branches; not on main yet). Cleanup steps never touch it.
- **Machina has two casts.** Set `data-cast` as well as `data-theme` when you measure it.
- **Theme words go through the lexicon** (law 5), never through CSS `content` or hard-coded strings ([lexicon](lexicon.md)).