# Rulings: `apps/desktop/src/store/themeFontFaces.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[themeFontFaces §n]` points here.

## themeFontFaces §1

From `apps/desktop/src/store/themeFontFaces.ts`, line 16 at `e2898deb` (the comment that stays: "Machina's default writing face loads with the theme").

```ts
  // TOOLS #10 item 10 - Machina's default writing face (Source Sans 3) loads with the theme.
```

## themeFontFaces §2

From `apps/desktop/src/store/themeFontFaces.ts`, line 21 at `e2898deb` (the comment that stays: "Arbor's default writing face (EB Garamond) loads with the theme, never eagerly; Arbor's theme id is 'plateau'").

```ts
// ARBOR'S default writing face (TOOLS #10 item 10): EB Garamond, loaded with the theme like the others - never eagerly (the eager list does not grow). Arbor's theme id is 'plateau'.
```

## themeFontFaces §3

From `apps/desktop/src/store/themeFontFaces.ts`, line 27 at `e2898deb` (the comment that stays: "Flux's default writing face (Titillium Web) loads with the theme").

```ts
// FLUX'S default writing face (TOOLS #10 item 10): Titillium Web, loaded with the theme (Flux's chrome faces stay eager in main.tsx). Same lazy shape as Machina's.
```
