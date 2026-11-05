# Rulings: `apps/desktop/src/store/themeLexicon.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[themeLexicon §n]` points here.

## themeLexicon §1

From `apps/desktop/src/store/themeLexicon.ts`, line 15 at `e2898deb` (the comment that stays: "pluralization is not algorithmic: every term carries two forms, and an override may supply either").

```ts
// Fable's R1 (post-TH1 review) — English pluralization isn't algorithmic from
// a single canonical string (Drawer/Drawers is fine with +s, but a theme's
// own noun might not be), so every term carries two number forms rather than
// one string a caller mechanically pluralizes. A theme overriding a term may
// supply either form independently; the other falls through per-field.
```

## themeLexicon §2

From `apps/desktop/src/store/themeLexicon.ts`, line 30 at `e2898deb` (the comment that stays: ""Page" is grammatically plural here; Flux's override is untouched").

```ts
  // ITEM word-diet (Nick, Oct 13, review fix) — "Page" is always
  // grammatically plural (pages-rename bucket (a)); Flux's own override
  // below (Doc/Docs) is untouched.
```

## themeLexicon §3

From `apps/desktop/src/store/themeLexicon.ts`, line 69 at `e2898deb` (no comment stays: the code reads plainly).

```ts
    // theme-leftovers (Nick approved Oct 16) — "Overclock" retired for
    // "Wire In" (plural "Wire-ins"), Fable's own exact forms.
```

## themeLexicon §4

From `apps/desktop/src/store/themeLexicon.ts`, line 74 at `e2898deb` (the comment that stays: ""Uplink" keeps Flux's circuit register without colliding with the board-connection word "Link"").

```ts
    // ITEM arbor-quiet-brass — renamed from "Connect" (Fable's proposal, pending Nick's
    // word): the board-connection family (deskLexicon.ts) just took "Link" for Flux, and
    // this unrelated feature (Publish-to-web) collided with it under the same English
    // word. "Uplink" keeps Flux's own circuit register without the collision.
```

## themeLexicon §5

From `apps/desktop/src/store/themeLexicon.ts`, line 80 at `e2898deb` (the comment that stays: "Machina's register; not overridden on purpose: 'plan' (already Machina's word), 'script', and 'notebook' (Machina's Notebook is the journal word)").

```ts
  // MACHINA (Nick's words pass, Oct 21; docs/plans/machina-build.md §1c) - the corporate register. The locked map: Drawer -> Project, Set -> Folder, Pages -> Files,
  // Boards -> Plans, Box/card -> Block, Journal -> Notebook, Milestone -> Deliverable, Home -> HQ, Voice Wall -> Compliance, Publish -> Finalize, Free Write -> Sprint.
  // NOT overridden, on purpose: 'plan' (canonical "Plan"/"Plans" already IS Machina's word), 'script' (dual-natured, as for Flux), and 'notebook' - Machina's Notebook is the
  // JOURNAL word, so the canonical `notebook` term (a different concept) would read identically to `journal` under this theme; it keeps its canonical form until Nick names
  // a word for it (a hand-up item in the build report, not a guess). 'home' has no locked plural: HQ both ways (like Publish).
```
