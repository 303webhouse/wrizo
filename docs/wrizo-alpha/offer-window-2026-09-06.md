# THE WINDOW — ITEM 118 (c) · THE OUTDENT PARTNER · 118's PARKS
## THE OFFER — two fixes built, two defects parked lawfully, one re-classed

**Lane:** FIX · **Branch:** `fix-item113` · **Worktree:** `writer-studio-fx17`
**Base:** `origin/main` @ `7d7f06f` · **Tip offered:** `0bb9371`
**Date:** 2026-09-05 · **Standing:** OFFERED. Merges under the hold.

**ITEM 113 IS A SEPARATE PACKAGE, ALREADY OFFERED** on this same branch
(`docs/wrizo-alpha/offer-item113-2026-09-05.md`, stamped 70/70 both settings at
`8b4380d`). It is named here only so the branch's contents are not a surprise:
this offer covers the two commits that follow it.

**ZERO schema. ZERO server** (113 carries the only server change, in its own
package). **All of it ships with the post-walk package on Nick's word.**

---

## §1 · WHAT IS OFFERED

| SHA | what it landed |
|-----|----------------|
| `829fbc7` | **item 118 (c)** the right-edge hard stop · **the outdent partner** · `outdent.mjs` |
| `0afff88` | **`ab2.mjs` generation-4 park** — the ruled roster is TWELVE (a ruling-driven red) |
| `00feda1` | **underline gets a renderer**, page and card together · `underline.mjs` |
| `0bb9371` | ledger: (c) built, **(b) parked with its stage**, **(e) re-classed to C4**, the **B/I/U S0** |

**Six product files**, all client: `BoardEditor.tsx`, `draftFormat.ts`,
`deskLexicon.ts`, `Sliver.tsx`, `draftDecoration.ts`, `index.css`.
Suite files **70 → 72**; `item118.mjs` **6 → 10** checks, `outdent.mjs` **9**
new, `underline.mjs` **7** new.

---

## §2 · ITEM 118 (c) — AND WHY PASS 1 WAS WRONG

**S0 pass 1 reported (c) NOT REPRODUCED. That was a wrong answer, and the
reason is worth more than the fix.** It drove one card on a default board and
dragged it toward the **top-left** — the corner that has always clamped
(`Math.max(0, …)`). A top-left drag therefore "proved" a containment that does
not exist on the other side.

Under Nick's own stage — ~10 text cards in two columns, linked pairs, cards at
the edges, board pre-resized, **mouse** — a card dragged 900px right ended up
hanging **750px past the canvas**, canvas width unchanged at 1500.

**THE TWO AXES ARE DIFFERENT STORIES, and I nearly filed them as one.** The
first populated run printed `past canvas right/bottom: true` and it would have
been easy to call that "the edges leak". Re-measuring per axis, with the canvas
re-read *after* each drag:

| axis | canvas | card | verdict |
|---|---|---|---|
| right | width **unchanged** 1500 (cannot grow) | **+750px past** the edge | **DEFECT** |
| bottom | height **grew 1455 → 2070** to fit | contained (`overBottom -120`) | **working as designed** |

The canvas height is content-driven; the width is `pageWidthPx` and cannot
grow. So a card past the right edge sits outside a board that will never reach
it — permanently clipped and gone from view. That is Nick's *"cards moved to
the board's edge begin to DISAPPEAR."* **Had the two been reported as one bug,
the fix would have frozen the growing canvas** — a regression wearing a fix's
clothes.

**The repair is FX17 S3's own shape, applied to the axis it skipped.** That
slice gave the BOTTOM a shared-delta hard stop and named the gap in its own
first sentence — *"the way the x-axis's own `Math.max(0, …)` does"* — leaving
sideways travel with a lower bound and no upper one. The new clamp is bounded
on the **shared delta** (so a multi-card selection holds its shape instead of
deforming as its rightmost card lands) and **floored at 0** (so a card already
past the edge — an older save, a deck load — is never yanked back the instant
it is touched). A stop, never a correction. Measured after: **750px → 0**.

**Two of the four new checks assert the fix did NOT over-reach**: the board must
still grow downward, and the downward card must still be contained.

---

## §3 · THE OUTDENT PARTNER

`FormatAction` gains `'outdent'`; `outdentParagraphs` is the exact decrement of
`indentParagraphs`, on F3's leading-tab convention — the level IS the tab count.

**"Exact decrement" is made STRUCTURAL rather than aspirational.** The
selection-to-paragraph expansion is lifted into a shared `paragraphScope()`
helper that **both** functions call. Had they computed scope separately, one
could later learn a rule the other did not and the pair would stop being a pair
**without anything failing**.

**Floored at zero PER LINE, not per press:** a line with no leading tab is
returned untouched rather than borrowing from a neighbour, so a paragraph whose
lines sit at different levels flattens toward zero without any line going
negative or losing real text.

**The caret clamp is the one place this is not a pure sign flip**, and the code
says so: a caret parked before a tab lands at its own line's new start, never
on the previous line's.

**GLYPH — a judgment call, ruled.** The legacy bar's outdent is `⇤`, but **`⇤`
is already Align left's mark in this very drawer**. A control wearing another
control's mark in the same panel is a defect however correct its behaviour, so
the partner takes `←`, mirroring Indent's own `→`. **ORDER:** before Indent —
the legacy bar's own ordering, and the direction this drawer's alignment row
already reads.

**`outdent.mjs` covers THE PAIR, not just the new half.** E3's indent shipped
with **no harness anywhere** — nothing in the harness directory matched
`indent`, `draftIndent` or `indentParagraphs`. The round-trip checks are the
first coverage that control has ever had.

---

## §4 · WHAT IS PARKED, AND WHAT RE-CLASSED

**(b) RESIZE-ONCE — PARKED: NOT REPRODUCED UNDER FOUNDER CONDITIONS, stage
recorded.** Driven under Nick's full stage in three shapes — a plain card twice,
a **linked** card twice, and a card resized after two prior resizes. Every
shape: handle re-armed, second resize grew the card. The stage is on the ledger
so Nick's live re-test starts from a known setup rather than from scratch.

**A NEAR-MISS WORTH RECORDING, because it would have been a false positive.**
The first populated run reported *"NO HANDLE after select"* for all three
shapes — which reads exactly like (b) reproducing. It was my probe:
`BoardEditor` sets `selectedId` on **pointerdown**, and I was dispatching a
plain `click`. Real pointer events showed the handle arming every time. **A
driver can lie by dying OR by doing nothing**, and this one did the second.

**(e) UNLINK — RE-CLASSED TO A DESIGN ADD, routed to the cluster pass's C4. No
new item number. Nothing built.** Measured: clicking a thread selects it
(`data-selected="true"`), **`Delete`/`Backspace` removes it** (3 → 2
connections), and there are **zero affordances** — no button, no menu item,
nothing anywhere naming unlink, `buttonsInsideSvg: 0`. So the **mechanism
exists and the affordance does not**: Nick's "cards link but cannot be
unlinked" is accurate from the writer's side, because there is no way to
discover it. `Delete`/`Backspace` is recorded as **the existing exit**, so C4's
work is *"make the gesture visible,"* not *"build removal."*

**The same gap seen from two sides:** the connections `<svg>` is
`aria-hidden="true"`. Threads are invisible to assistive technology **and**
undiscoverable to sighted writers.

**(d) BOARD-RESIZE DECAY — still not reached.** Out of this window's scope.

---

## §4a · UNDERLINE — AND THE S0 THAT INVERTED NICK'S REQUEST

Nick's ship word: *"Can we please get the bold, italic, and underlining buttons
fixed with this ship. It seems like an easy fix."* S0 first, because "easy" is a
hypothesis. **It did not hold — though not for the reason anyone expected.**

**The hazard test passed decisively, and its controls prove the instrument.**
The live page editor derives STORED text from `el.innerText` on every keystroke,
so a marker hidden the wrong way would silently strip markdown out of a writer's
saved words. Item 118 (a-ii) proved nothing about this — it collapsed markers on
a **read-only** card that never round-trips. Measured in a bare contenteditable:

| technique | `innerText` | markers |
|---|---|---|
| `font-size:0; opacity:0` (shipped) | `"**word** tail"` | **survive** |
| `display:none` (forbidden) | `"word"` | **lost** |
| `visibility:hidden` (forbidden) | `"word"` | **lost** |

**But the surface Nick was using does not decorate at all.**
`ForwardOnlyEditor` forks on `freeEdit = mode === 'drafting' || mode ===
'revise'`: Draft and Revise render through `decorateMarkdown`; **Free Write
renders raw `.fo-run` spans**. That is why markers show at **full ink** there
rather than at Draft's dimmed `.md-mark{opacity:.38}`.

**He is pinned to Free Write by construction, not inference:** the active-state
(`data-on`/`aria-pressed`) exists ONLY on the Free Write rail; the Draft rail
passes `{ onFormat: applyRailFormat }` with no highlight state at all. **A stuck
highlight is impossible on Draft.**

**BUILT: underline only** — a `__` case in both inline passes plus
`.md-underline`. Matched before `*` on the same earliest-opening rule `**`
already uses; a **single** `_` is not a marker in this convention, which leaves
`snake_case`, `file_names` and mid-word emphasis untouched.

**SAID PLAINLY: underline changes nothing Nick saw**, because it lands on
Draft/Revise and cards and his surface does not decorate. **That is no longer a
gap to close, though — it is a surface being retired.** Nick's analog law
removes B/I/U from Free Write entirely (**item 121**, replaced by a Text/Ink
toggle, design at MENU), so the Free Write half of the marker fault is **MOOT,
not deferred**. The next window's B/I/U job is **Draft only** — the half this
S0 already measured as contained.

**REPORTED, NOT BUILT, and queued:** the Draft live-page marker collapse
(required by ruling; the hazard finding governs the method, not the
requirement), and the bracket-open active state — both now Draft-only.

---

## §5 · FALSIFICATION

| harness | against the reverted product |
|---|---|
| `item118.mjs` | **1/10 failed** — exactly the (c) escape check |
| `outdent.mjs` | **13/14 failed** — the survivor is S2's indent half, which already worked |
| `underline.mjs` | **3/7 failed** — exactly the three defect assertions |

`underline.mjs`'s four guards (bold and italic still render, the storage
invariant, `snake_case` left alone, an unpaired `__` losing nothing) passed in
**both** directions — the same discipline as above.

**THE PARKED RUN EARNED ITS KEEP TWICE IN THIS WAVE.** Unparked read **71/71
CLEAN** while the parked half sat at **70/71**: PB1 caught E4 reversing an
absence claim, and `ab2.mjs` caught this window's outdent changing the ruled
roster count from ELEVEN to TWELVE. **A wave stamped only unparked would have
shipped both silently.** The ab2 original is quoted byte-for-byte inside
generation 4, its superseding authority named and `outdent.mjs`'s S1 checks
named as successors. **The ELEVEN was never wrong; it was complete for its
moment** — and what the check actually claims (exact roster, ruled order, no
silent addition, no Structure picker) is unchanged and re-made at current
membership.

`item118.mjs`'s three no-over-reach guards passed in **both** directions,
deliberately: they are guards, and **a guard that only goes green after the fix
proves nothing**.

**The outdent falsification first ABORTED instead of reporting** — a bare
`.click()` on the absent Outdent button threw and killed the file, reporting
nothing about the round-trip, the levels or the floor. **Fourth sighting of
that class in this lane** (ab2's label-coupled drivers, e4's absent grip, this,
plus the silent pointerdown variant in §4). `press()` now probes, records a
failed check naming the absent selector, and returns — so the run stays legible
exactly when it matters most.

---

## §6 · THE STAMP

| setting | result | stamp |
|---------|--------|-------|
| `HARNESS_PARKED` unset | **72/72 CLEAN** | `tree=0bb9371 bundle=index-BLrJjBEZ.js/558459b` |
| `HARNESS_PARKED=1` | **72/72 CLEAN** | `tree=0bb9371 bundle=index-BLrJjBEZ.js/558459b` |

`item118.mjs` 10 · `outdent.mjs` 9 · `tutor-mirror.mjs` 5, all green in both
settings. Machine clear; the runner invoked by **absolute worktree path**, per
the standing guard.
