# Lexicon

**What lives here:** every word the desk shows, and its per-theme overrides.
**Owner (proposal):** whoever adds a word; POLISH audits. **Back to** [MAP](../MAP.md).

## Entry files
- `store/deskLexicon.ts`: the `DeskTermId` union (about 900 keys), `CANONICAL` (the default words), `OVERRIDES` per theme, and the accessors (`deskTerm`).
- `store/themeLexicon.ts`: theme-territory words.

## Seams and hooks
`window.wrizoDeskLexicon`, `window.wrizoLexicon`.

## Full pair
No. A word change takes the default leg, unless it ships with a layout change.

## Covering harnesses (start here)
`flux-v2.mjs`, `th-machina-source.mjs`, `guided-w1.mjs`, `guided-w3.mjs`, `b2.mjs`, `th1.mjs`.

## Known traps
- **Law 5: theme words only via the lexicon.** A new on-screen word gets a `DeskTermId`, a canonical word, and an override where a theme differs.
- **The typecheck proves completeness:** `CANONICAL` is a `Record<DeskTermId, …>`, so a missing word fails `tsc`.
- **About 90 keys are named by no file** (map §2); deck and help keys are built at runtime, so they are only candidates until the step 5 probe looks.
