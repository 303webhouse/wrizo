# Themes

**What lives here:** the skins (Arbor = `plateau`, Flux, Machina with its cool and neutral casts), the tokens, fonts, and theme effects.
**Owner (proposal):** POLISH, plus the theme lanes (ARBOR, Machina). **Back to** [MAP](../MAP.md).

## Entry files
- `index.css`: all styling. `:root` tokens first, then the theme blocks, then the component sections. (#13 steps 6–8 split it into a styles folder.)
- `store/theme.ts` (the theme in force), `store/themeCast.ts` (`data-cast`, Machina's neutral cast), `store/themePrefs.ts`.
- `store/themeFontFaces.ts`, `store/themeFonts.ts`, `store/fontRoster.ts`, `store/fluxThemeFx.ts`, `components/ThemeEffectsLayer.tsx`.

## Seams and hooks
`window.wrizoTheme`, `window.wrizoCast`, `window.wrizoThemePrefs`, `window.wrizoThemeFx`, `window.wrizoFluxFx`, `window.wrizoAmbiance`.

## Full pair
`index.css` is global CSS: any change to it runs the full pair.

## Covering harnesses (start here)
`th1.mjs`, `th2.mjs`, `th-machina.mjs`, `th-machina-source.mjs`, `flux-v2.mjs`, `flux-v2-part2.mjs`, `machina-deckwizard.mjs`, `splash.mjs`.

## Known traps
- **Laws 1–3 are checked in every skin:** the page identical, card geometry identical, square edges, no shadows, contrast 13.9 / 4.5 / 7.
- **Arbor's new CSS lives in its own file** (arbor-v2.css, on the unmerged arbor/mockup branches; not on main yet). Cleanup steps never touch it.
- **Machina has two casts.** Set `data-cast` as well as `data-theme` when you measure it.
- **Theme words go through the lexicon** (law 5), never through CSS `content` or hard-coded strings ([lexicon](lexicon.md)).