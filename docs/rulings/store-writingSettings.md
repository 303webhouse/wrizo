# Rulings: `apps/desktop/src/store/writingSettings.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[writingSettings §n]` points here.

## writingSettings §1

From `apps/desktop/src/store/writingSettings.ts`, line 51 at `7f1c6a84` (the comment that stays: "the Typewriter menu's adjustments; every default reproduces today's behaviour, so an older stored blob resolves unchanged").

```ts
  // ITEM 83 M4 (R3) — THE TYPEWRITER MENU's own adjustments. Nick's ruling:
  // "the Typewriter toggle button should also include an option to open
  // additional Typewriter settings, which is where options like the 'Forward
  // Lock' and 'Line Fade' should be able to be turned on/off and adjusted
  // (Forward Lock should be customizable by number of words, number of
  // sentences, etc. Line Fade should be customizable by number of lines that
  // show, if the current line being written should be in the center of the
  // page or closer to the top or closer to the bottom)."
  //
  // NAMING, per F1's default: his latest words govern — "Forward Lock" and
  // "Line Fade", retiring Chamber 1's "Forward Momentum"/"Text Fade".
  //
  // Every default below reproduces TODAY's behaviour, so a device with a
  // pre-M4 stored blob (which has none of these keys) resolves through load()'s
  // `{ ...DEFAULTS, ...parsed }` merge to exactly what it does now.
```

## writingSettings §2

From `apps/desktop/src/store/writingSettings.ts`, line 157 at `7f1c6a84` (the comment that stays: "the typewriter is remembered per page on this device: a plain localStorage key per page, written on every toggle and read once at mount; no shared mirror, so one page's value never outlives its mount").

```ts
// PHASE 1 (S5) - THE TYPEWRITER IS REMEMBERED PER PAGE, on this device (Nick, Oct 11). This REPLACES two things, both gone: FX2 S2's line-count seed
// ("opens ON under 10 line-equivalents", with item 87's empty-page amendment) and its session-only `explicitlySetThisSession` flag. The pattern is item
// 112-A's `wrizo-mode-page-<id>`: a plain localStorage key per page, WRITTEN ON EVERY TOGGLE and READ ONCE AT MOUNT. No database, no schema, no server.
//
// SUPERSEDED (typewriter-scope, Fable Oct 21) - what follows used to read:
// "`typewriter` above stays the ONE global, persisted, live value every consumer reads; what is new is what puts a
// value INTO it when a page opens" - i.e. enterPageTypewriter MIRRORED this page's own resolved value into the one
// shared `typewriter` field on every mount. That mirror is what let one page's seed outlive its own mount: Draft and
// Screenplay both remount fresh per page (key={id}) and correctly reseed the mirror on their OWN open, but nothing
// stopped a DIFFERENT concurrent reader (or the brief window before the next page's own effect ran) from reading
// whatever the PREVIOUS page last wrote there - a new empty Screenplay page (Arbor default: on) could leave the
// shared mirror "on" for a Ctrl+B gate asking about an unrelated Draft page that never asked for Typewriter at all.
// Draft/Screenplay's per-page memory below (pageKey/readPageTypewriter/writePageTypewriter) was always correct; the
// bug was mirroring it into a field OTHER pages' readers could also see. `typewriterForPage` is the fix: the exact
// same resolution, as a PURE READ callers can ask for their OWN page directly, never through the shared mirror.
// FREE WRITE IS UNCHANGED: it never calls any of this, and its own toggle still only touches the shared `typewriter`
// field - by Nick's own standing ruling, Free Write has no per-page memory at all.
```

## writingSettings §3

From `apps/desktop/src/store/writingSettings.ts`, line 186 at `7f1c6a84` (the comment that stays: "the pure read every Draft/Screenplay consumer asks: this page's saved value, else the theme's default for an empty page, else off; no side effect").

```ts
/**
 * typewriter-scope (Fable Oct 21) - THE PURE READ every Draft/Screenplay
 * consumer should ask instead of the shared `typewriter` field: this page's
 * own saved value, else the theme's default for an empty page, else off.
 * Exactly enterPageTypewriter's own resolution, without the side effect of
 * writing anywhere - safe to call on every render, from any component that
 * already knows this page's id. `empty` only matters before this page has
 * ever saved a value (every call after its own first mount is answered by
 * `saved` alone).
 */
```

## writingSettings §4

From `apps/desktop/src/store/writingSettings.ts`, line 215 at `7f1c6a84` (the comment that stays: "once per page mount, opening into Draft: resolves and saves this page's own value, never mirrored into the shared field").

```ts
/** Once per page mount (PageEditor / ScriptEditor, when the page opens into Draft). `empty` = the page holds no
 *  text yet. Resolves and SAVES this page's own value (first open seeds its memory for every later typewriterForPage
 *  read) but no longer mirrors it into the shared `typewriter` field - see the SUPERSEDED comment above pageKey. */
```
