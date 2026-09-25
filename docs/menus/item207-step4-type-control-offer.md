# ITEM 207 (207a) — STEP 4 BUILT: the Type control on Free Write, Draft, Revise and the card (tools lane; branch `item207-fonts`)
### Browserless proof green (44 checks, park count 0 in the new files; 3 parks in item112a.mjs). The rendered harness `item207.mjs` is written and syntax-checked — NOT RUN; it needs a box turn.

## The control — one component, the fewest marks (`components/TypeControl.tsx`)
His law ("as minimal as possible, same goes for all strip menus"), made concrete and asserted:
- **Free Write and a card:** ONE face button (its own name, set in its own face) and a `−` `+` pair. **Three buttons, no number, no caption.**
- **Draft and Revise:** the same, plus ONE number input between the steps — **three buttons and one input.** The input exists only under `form === 'full'`.
- **No heading and no helper text anywhere**; the names live in `aria-label`s (five new lexicon keys: `typeGroup / typeFace / typeSmaller / typeLarger / typeSize`).
- **The face button opens the roster in flow inside the drawer** (never a second floating panel); each row is set in its own face, the current one olive; choosing IS the preview (RV4). Escape and an outside press close it.
- **`+`/`−` are INERT at the ends** (`aria-disabled`, never removed); the number commits on Enter or blur, rounds to a half point, clamps 6–120, and a non-number snaps back to the previous value.
- **No "Add a font…" row** — it arrives with Route A (207b) and never reaches Free Write (his Q2). Buttons `preventDefault` on mousedown so a press never steals the caret.

## Where it is mounted
- **Sliver (the Desk drawer):** an optional `type` on the `freewrite` and `draft` arms, and a new `revise` arm — **Revise's drawer was empty by 112-A's ruling until "112-C fills it with 83's Type section"; this is that one tenant.** One section, no heading. Absent, never greyed, wherever the host passes none: **the screenplay editor passes none, and Free Write passes none in INK** (a pen page has no typeface).
- **`PageEditor`:** `typeMember('small'|'full')` writes through the page's existing `patchPageSettings` (the same funnel every page-level choice uses): `size` as points, `face` whole.
- **The card:** in the opened card's Styling dock (item 159's `board-popup-dock`), the small form. `Box.fontFace?` / `Box.fontSize?` are additive keys inside `boxes` — absent on every card that never chose. The canvas card and the popup editor scale through one CSS variable, `--card-type-k` (`.board-text` is now `calc(15px * var(--card-type-k, 1))`, the popup `16px`), so a card that never chose has **no style attribute and the same computed 15px / 16px**. A non-eager card face is fetched when the board opens.

## The census (step 5's site list) — done, and short
- **`PageSettings.face` / `.size`:** `page_settings` is a whole-blob jsonb mapper (`sync.ts` copies it whole), every writer spreads (`{ ...base, ...next }`), and `dressOnly()` strips only `kind` / `styleGuide` — so face and size flow through "set as my defaults" and into a new page's birth with **no edit at any site**. `sync.ts` / `migrate.ts` untouched (asserted).
- **`Box`:** every creation site (New card, deck deal, port) builds a fresh card, correctly in the everyday font. **The one site that copies a card is `copyCardToBoard`, which is a WHITELIST by its own ruling ("a copy carries nothing by default")** — I extended it on purpose with `fontFace` / `fontSize` (how a card reads, the way `w`/`h` are) and said so in its comment. Trash and Restore move whole rows.

## Parks — three, all in `item112a.mjs`, each verbatim
By behaviour, not by string: Revise's drawer now carries a tool section, so every check that counted its sections as zero is false. **S7 "the Desk drawer is empty OF TENANTS" (at 1100 and at 1366: two records) and S8 "NO TYPE SECTION and no inherited Draft rail render in Revise" (one).** Each keeps its full text in a `pok(...)` record naming ITEM 207 as the supersession, and each has a live SUCCESSOR beside it (exactly one tool section, and it is the Type control; the no-inherited-Draft-rail half of S8 stays asserted). The recorder was hoisted above the loop so the parks stand where the assertions stood. **Swept and NOT falsified:** item83f's "Structure is the last zone" (the Type section leads); item121's Free Write drawer checks (`heads` — the section has no heading; `anyDisabled` — no `aria-disabled="true"` at 11); the board-surface section counts (the board arm carries no `type`). The park block's own "parks 0" prose is corrected to 3.

## Owed on the box — `item207.mjs` (not run)
Per-surface control counts as rendered (3 buttons / 0 inputs; 3 / 1) · the roster as nine rows in order, each set in its own face · "11 = today" (the editor's two prior style strings, the computed 17px × scale, no key on disk) · the size buttons and the typed number through the limits · face choose writes `pageSettings.face` and fetches the CSS · Times New Roman stored `named` with `Tinos` · a dressed page renders identically in Free Write, Draft and Revise · the paper's rect byte-identical across all nine faces at 1100/1280/1920, and **the chars-per-line re-measure against S0's table, Courier Prime reported separately** · the card writes to that Box only and the other card is untouched.

## Unmeasured, named
- **The face button's label when nothing is chosen** reads the voice dial (Crimson Pro or Figtree); under the one theme whose sans voice is Chakra Petch it would name Figtree while the page wears Chakra Petch. A default-label edge, not a write.
- **Ported (excerpt) cards** do not take the card face/size on the canvas — only plain text cards do; their popup is not an editor for the excerpt. Say the word if they should.
- **The Type control mounts with Typewriter on** (177-Q3 struck by his words); I did not test the typewriter's own menu interplay, since the control lives in the drawer.

---
## BOX TURN RESULT (2026-09-25, grant `tools-195-207-20260925b`) — `item207.mjs` PASS 41/41 on BOTH legs (park count 0)
Run against a fresh `build:web` at `e011245` plus the harness fixes below. **The first two runs were red, and both reds were the DRIVER, not the product:** (1) the drawer-open probe read the control's presence, but a CLOSED drawer keeps its body mounted (aria-hidden, pointer-events none), so the grip was never pressed and 60-odd presses reported "occluded by wz-sliver" — fixed to read the panel's own `data-open`; (2) a first-line character count moves by a whole word (~8%), wider than the tolerance asserted — replaced with an average over the first 8 lines; and the card write is read only after polling the STORED row (the board editor saves on its own debounce; `flushNow` does not save the editor). The harness now prints each check as it lands and turns a thrown driver error into a failed check, so a mid-run death no longer takes the checks already made with it.

**Characters per line, re-measured in the real engine (average of 8 lines; relative to Crimson Pro):**

| face | @1100 | @1280 | @1920 | S0 predicted vs Crimson |
|---|---|---|---|---|
| Crimson Pro | 77.9 | 77.9 | 76.4 | 1.00 |
| EB Garamond | 82.6 | 82.6 | 80.3 | 1.05 |
| Times New Roman (installed here) | 76.4 | 76.4 | 75.8 | 0.99 |
| Lora | 64.3 | 64.3 | 64.3 | 0.85 (measured 0.83) |
| Source Serif 4 | 62.4 | 62.4 | 62.4 | 0.84 (measured 0.80) |
| Figtree | 66.5 | 66.5 | 68.0 | 0.90 |
| Atkinson Hyperlegible | 68.8 | 68.8 | 68.8 | 0.91 |
| Arial | 67.1 | 67.1 | 68.0 | 0.90 |
| **Courier Prime (worst case)** | **49.4** | **49.4** | **49.4** | 0.65 (measured 0.63) |

Every face is within 6% of S0's browserless prediction at all three widths (S0's method was sound), and **the paper's rect is byte-identical across all nine faces at 1100, 1280 and 1920** (page primacy, measured). Courier Prime holds about 63% of Crimson Pro's line — S0's "a third fewer", confirmed. The two variable serifs run ~3–4 points narrower than S0's default-instance reading, the direction expected of a variable font rendered at a real weight and optical size.

**Also run in this turn (both legs each):** `item195.mjs` **49/49 both legs, park count 0** (the pair Fable queued); and, because this branch edited it and swept two neighbours, `item112a.mjs` **55/55 both legs with `PARKED: PASS (3 checks)`** — the park count I claimed, measured, with the S7/S8 successors green — plus `item83f.mjs` 34/34 and `item121.mjs` 43/43 both legs (the swept-not-falsified claim, now proven by running them).
