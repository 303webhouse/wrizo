# ITEM 207 — S0 (tools lane; branch `item207-fonts`, from origin/main @ f1d9bfe)
### Phase 1 (207a). Measured browserless from the bundled font files; the rendered re-measure is the harness's, on a box turn.

Design read: `item207-fonts-design.md` + the amendment (`plan-207-amend` @ d4415f3, on main). Instrument: `apps/desktop/scripts/font-metrics-s0.mjs` (a minimal WOFF/WOFF2 sfnt reader, no font library; validated by two known values: Courier Prime's mean advance reads exactly 0.600 em, and Tinos reads 0.397 against Times' known ~0.40).

## 1 · THE FINDING THAT SETTLES THE MEASURE LAW, BEFORE ANY DRIFT NUMBER
`.desk-frame-stage--prose .mode-pagecol { width: min(760px × scale, 60ch) }` — and that `ch` is the **zero of the column's own font, which is the CHROME font (`--font-ui` = Figtree; Rajdhani under one theme), not the prose face.** Verified: `body { font-family: var(--font-ui) }`, `.mode-pagecol` sets no `font-family`. So:
- **The paper's rect is already independent of the prose face.** Choosing a face cannot move the page — page primacy holds by construction, with no `size-adjust` needed for it and no `ch`-follows-face rival (the design's option 2) to weigh. **The design's fork "(1) rect invariant vs (2) width follows face" is closed by the code: it is (1), already.**
- At scale 1: column 612 px (Figtree '0' = 0.638 em × 16 × 60), text width ≈ 536 px after the paper's 38 px side padding. Scale 1.1 / 1.2 (≥1680 / ≥1920) multiplies width and font together, so characters per line does not change with viewport — the same numbers hold at 1100, 1280 and 1920.

## 2 · CHARS PER LINE, THE ROSTER (mean advance of 13,605 characters of real prose, 17 px, 536 px text width)
| face | mean advance (em) | x-height (em) | chars/line | vs today (Crimson Pro) |
|---|---|---|---|---|
| Crimson Pro (today) | 0.391 | 0.420 | **81** | 100% |
| EB Garamond | 0.374 | 0.400 | 84 | 105% |
| Times New Roman (via Tinos) | 0.397 | 0.459 | 80 | 99% |
| Lora | 0.458 | 0.500 | 69 | 85% |
| Source Serif 4 | 0.468 | 0.475 | 67 | 84% |
| Figtree | 0.432 | 0.500 | 73 | 90% |
| Atkinson Hyperlegible | 0.431 | 0.496 | 73 | 91% |
| Arial (via Arimo) | 0.435 | 0.528 | 73 | 90% |
| **Courier Prime — the worst case** | **0.600** | 0.451 | **53** | **65%** |

**Proportional faces: 84%–105% of today's line (67–84 characters).** **Courier Prime, reported separately as asked: 53 characters a line against 81 — a third fewer.** It is a monospace face; it is what the face does, and the paper does not move to hide it.

## 3 · A CONFLICT THE DESIGN DOES NOT SEE, HANDED UP WITH A LEAN
The merged design (§3) has each face carry a normalising `size-adjust` "so Regular looks the same size across faces". The amendment then makes the size number **literal printed points** (a writer following a style guide types 12). **Those two pull against each other for Times New Roman and Arial:** the x-heights above differ by up to 26% (Arial 0.528 em against Crimson's 0.420), and a normalising adjust would make "12 pt Arial" render smaller than Arial's real 12 pt — exactly the number a style-guide writer is checking.
- **LEAN: `sizeAdjust` is a per-face data field that DEFAULTS TO 1 (no adjustment)** — every face renders as designed, "11" is today's rendering for the default face, and a typed 12 is a real 12 in Times New Roman. The cost is the spread in section 2 and that Arial and Lora read visibly larger than Crimson at the same number, as they do in print.
- **The rival, in its strongest form — normalise on x-height:** it evens perceived size across faces (proportional line-length spread narrows to 94%–113%), and a writer swapping Crimson for Arial sees the same apparent size. **Its cost is that the number stops meaning what it says** for the two faces the writer chose *because* the number must be literal. **The unmeasured risk sits on the lean:** nobody has watched a writer switch faces and react to a size jump.
- **It is a one-field-per-face edit either way**, so the build does not wait on this; it ships with 1 and the table is the seam. Nick's word on "11" is already the literal one.

## 4 · WHAT THE CODE SAYS (drift-checked at f1d9bfe)
- **No face key exists** in `PageSettings`, `Box` or any store; the prose face today is `themePrefs.voice` (serif/sans → `--font-prose`) exactly as the design says. Prose renders at `17px × --paper-scale` in **two** places that must move together: `.paper-page` (`index.css:856`) and the editor's inline `fontSize: 'calc(17px * var(--paper-scale))'` (`PageEditor.tsx:723`).
- `dressOnly()` strips only `kind` and `styleGuide` and spreads the rest, so face and size flow into "set as my defaults" with no edit there.
- Mixed loaders confirmed: Crimson Pro and Figtree are `@fontsource-variable`; Courier Prime, Rajdhani, Chakra Petch are static. Variable packages installed for Lora, EB Garamond and Source Serif 4 (woff2 only); static for Atkinson Hyperlegible, Tinos, Arimo (both woff and woff2). All nine are OFL-1.1 (`package.json` licence field read for each new package).
- **New dependencies: six** (`lora`, `eb-garamond`, `source-serif-4` variable; `atkinson-hyperlegible`, `tinos`, `arimo` static) — the roster is the dependency list, as the design says.

## 5 · WHAT PHASE 1 BUILDS, IN ORDER (each step browserless-verifiable before the box)
1. Roster as a data table (nine faces; `named` source for Times/Arial with `local()`-first `src`; `sizeAdjust` default 1) + lexicon terms + the resolver (page's face → voice → theme).
2. Load-on-choose (dynamic CSS import per face; default stays eager) + a startup-bytes check that the eager list did not grow.
3. Size: the lattice as a pure function (`+` stops at 118, typed to 120, half-points, inert ends) + `px = 17 × (n/11) × scale` in both places.
4. The Type control: Free Write (face + ±, no number), Draft/Revise (face + ± + typeable number), card's strip (face + ±). Minimal-interface law made assertable (a control count per surface).
5. `pageSettings.face` / `.size`, `Box.fontFace` / `.fontSize`, and the census of every site that copies a `PageSettings` or rebuilds a `Box`.
6. `item207.mjs` harness: lattice by value, "11 = today" computed style, control counts, no font file for Times/Arial in the build output.

**Not in phase 1:** the "Add a font…" row, device fonts, uploads (207b/207c).
