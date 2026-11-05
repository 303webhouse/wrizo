# Rulings: `apps/desktop/src/store/themeFonts.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[themeFonts §n]` points here.

## themeFonts §1

From `apps/desktop/src/store/themeFonts.ts`, line 3 at `7f1c6a84` (the comment that stays: "a theme's own faces load when the theme does, not at boot; the literal font imports live in store/themeFontFaces.ts (only main.tsx imports it), so the harnesses' esbuild loaders never resolve .woff2").

```ts
// A THEME'S OWN FACES, LOADED WHEN THE THEME IS (not at boot). Arbor and Flux import their faces eagerly in main.tsx; Machina's four slots (canon §4 /
// foundations §6: IBM Plex Mono for chrome labels, Plex Sans for content labels, Plex Serif and Atkinson Hyperlegible for prose) would be dead weight for
// every writer who never opens it - and item207-core's LOAD-ON-CHOOSE check holds the eager list where it is. So they load on first use of the theme,
// the same dynamic-import shape the font roster (store/fontRoster.ts) already uses; the bytes only travel when a writer is on Machina.
//
// WHERE THE LITERAL IMPORTS LIVE (the Oct 24 train-#6 fix): this module is reached from store/theme.ts, which the harnesses' store loaders bundle with esbuild - and a literal
// `import('@fontsource/ibm-plex-mono/500.css')` inside it made esbuild resolve the css and die on its .woff2 ("No loader for .woff2"), taking 9 files down at load. fontRoster
// never had that problem only because nothing those loaders bundle reaches it. So the literals sit in store/themeFontFaces.ts, which ONLY main.tsx imports, and REGISTER
// themselves here; this module is the registry + the first-use trigger and names no font package at all. Same load-on-choose behaviour: nothing is fetched until
// ensureThemeFonts('machina') runs (the theme's first use, or the picker card's first hover / focus), and the registration may arrive before or after that call.
```

## themeFonts §2

From `apps/desktop/src/store/themeFonts.ts`, line 33 at `7f1c6a84` (the comment that stays: "any theme that registered faces loads them with the theme; none is eager").

```ts
  // TOOLS #10 item 10: any theme that registered faces loads them with the theme (Flux's Titillium Web, Machina's set); a theme that registered none is a no-op. Arbor's EB Garamond, Flux's Titillium Web and Machina's set all load WITH their theme - none is eager.
```
