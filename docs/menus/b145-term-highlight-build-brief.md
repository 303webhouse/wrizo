# ITEM 145 BUILD BRIEF — THE TERM HIGHLIGHT
### PLAN desk · 2026-09-16 · decision-complete · **GATED ON 108**

**WORKTREE:** `.claude/worktrees/i145-highlight` · **BRANCH:** `i145-highlight` · **OFF:**
`origin/main` **after 108 has merged.** **Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Verified at `d53506f`.

**SOURCES:** `siblings-and-highlight-pass.md` §2 · **`tag-colour-foundation.md` (binding)** · reference
renders `term-highlight-mock.html`, `tag-overlap-mock.html` (**the acceptance test**).

**⛔ GATE: 108 merged** — the highlight paints **the active tags**, and 108 owns the active-tag state,
the vocabulary and the tokens. *(Independent of 143 and 144.)*

---

## §0 · WHAT THIS IS

Nick: *"…when a tag is selected on any Surface, the term should be highlighted… if it appears anywhere
in the viewable text on any surface."*

**THE COLOUR, as finally ruled (`tag-colour-foundation.md` §0 — olive was ruled, then REVERSED by Nick, then
refined):** *"If the user highlights over an already-highlighted word, make the tagged word's highlight a few
shades lighter than brass, but still orange so the tag is still visible."* **`::selection` stays brass. A
matching word takes a LIGHTER ORANGE fill (`--tag-fill`).** **The colour rule was set aside by its author FOR
TAGS; where-you-are markers stay olive.**

**⛔ AND THIS BRIEF'S ACCEPTANCE TEST IS THE OVERLAP** — a selection over a tagged word, where the tag must
remain visible. **By the spec it currently cannot** (S2b). **That is an OPEN question with Nick, and this
brief does not build past it.**

---

## S0 · SURVEY — and one measurement that is a CONDITION of the ratification

**(a)** Confirm the register: **`store/draftDecoration.ts`** — `decorateEditorFor`,
`decorateMarkdownForCard`, `revealAtCaret` — driven by **`selectionchange`**, with call sites in
`BoardEditor.tsx` and `ForwardOnlyEditor.tsx`. Confirm **its rule 1** in its own comment: **a
non-collapsed selection is left alone**, because redecorating **rewrites the DOM**.

**(b) ⛔ MEASURE SUPPORT — Fable's condition on ratifying the API.** The CSS Custom Highlight API is
**a mechanism new to this codebase** (`CSS.highlights` / `::highlight()` appear nowhere in the tree).
**Measure, in the shells this app actually runs in, and record the result in the build report:**
- **the desktop shell** — `apps/desktop/package.json` pins **Electron 31.0.0**; **read the Chromium
  version it bundles and record it** *(expected to be well past the Chromium release that shipped the
  API — but expected is not measured)*
- **the web build** (`build:web`, deployed) — **there is no declared browser target** (no
  `browserslist`). **Record which browsers reaching the web build lack the API.** *Non-Chromium
  browsers are the uncertain population.*
- **the harness browser** — `runtime-verify.mjs` drives **Microsoft Edge** (Chromium).

**(c) State the absent behaviour PLAINLY in the build report — pick ONE and name it:**
- **(i) NO HIGHLIGHT** where the API is absent — the tag state still works; terms are simply not
  painted; **or**
- **(ii) A FALLBACK** — the register paints inside its own DOM rewrite and **obeys rule 1**: it
  repaints only when the selection is collapsed.
**Recommend (i).** A fallback reintroduces exactly the DOM rewrite the API was chosen to avoid, for a
minority population, on the one operation (typing in a live contenteditable) where a rewrite is most
dangerous. **No highlight is a missing enhancement; a bad rewrite is a corrupted caret.** *Nick or
Fable may prefer (ii); the brief builds whichever is stated, and S5 asserts it.*

---

## S1 · ONE REGISTER COMPUTES; THE HIGHLIGHT API PAINTS

**⛔ THE MECHANISM'S JUSTIFICATION — recorded here so nobody later "simplifies" it back to markup:**

> **`draftDecoration` refuses to redecorate during a non-collapsed selection, because redecorating
> rewrites the DOM, and a DOM rewrite under a live selection destroys it. A term highlight built as
> wrapper spans INSIDE that rewrite inherits the hazard — every tag press becomes a DOM rewrite of the
> writer's text. So the obvious road — "just wrap the matches in a span" — is CLOSED, and it is closed
> by the register's own rule, not by taste.**

**THEREFORE:**
- **The register (`draftDecoration`, on `selectionchange`) COMPUTES the ranges** — one signal, one
  computation. **No second decoration engine walks the contenteditable** — the ledger's own words:
  *"page and card TOGETHER: one register, one behaviour. Splitting the surfaces is what produced the
  divergence being cleaned up."*
- **`CSS.highlights` + `::highlight(tag-term)` PAINTS them.** **Painting touches no DOM** — it cannot
  disturb a selection, a caret offset, or the marker reveal the register already performs.
- **It is styled independently of `::selection`** — so the tag fill and the selection can be **different
  values**. **They are NOT different layers in the painter's favour** — see S2b.

## S2 · THE TREATMENT — measured (`tag-colour-foundation.md` §4)

**A LIGHTER-ORANGE BACKGROUND FILL, via `var(--tag-fill)`; text on it flips to `--on-brass` on both grounds**
— the same flip `::selection` already makes.
- **The fill is hand-derived from brass** (tinted toward white by *t*; **t ≈ 0.35 → `#ffbc59`**; **TAG-Q3 is
  Nick's**). Text on it: **10.75:1.**
- **Not weight** — font properties are not among those that apply to highlight pseudo-elements; a weight
  change would also reflow the paragraph under the caret.
- **Not underline** — **item 122 made underline a WRITER's mark.** *(This survives the reversal — it is why
  S2b's second channel, if any, is an OVERLINE.)*

**⚠ THE TRADE, carried into the report:** on the **page**, a lighter fill separates the tag from a selection
(**fill vs brass: 1.29:1 at t 0.35**) but sinks it into the paper (**fill vs paper: 1.43:1**); darker does the
reverse. **No *t* wins both.** **Outside the overlap, intensity is the ONLY thing telling a tag from a
selection.**

## S2b · ⛔ THE OVERLAP — the acceptance test, and why it is OPEN

**CSS Custom Highlight API §4.2.4, verbatim:** *"The highlight overlays of the custom highlights are
**below** those of the built-in highlight pseudo-elements in the stacking order."* **§4.2.5:** `priority`
orders custom highlights **among themselves only.**

**So `::highlight(tag-term)` ALWAYS paints under `::selection` — and item 122's selection is OPAQUE brass.**

**MEASURED** (`tag-colour-foundation.md` §1):
- **opaque (as shipped): tagged-under-selection vs plain-under-selection = 1.00:1 — the tag is INVISIBLE**,
  on page and card alike.
- **translucent selection does not rescue the page** (never better than **1.20:1**), and on the card it
  **drops selected plain text below 4.5:1 by α 0.70.**

**THEREFORE THE FILL CHANNEL CANNOT PASS THIS TEST.** **Nick holds the choice (Q-OV1).** The desk's lean is a
**second channel** — an orange **overline** on the tag, a decoration line that is *not* the writer's
underline.

**⛔ S0 MUST MEASURE, IN THE SHIPPING ENGINES (Electron 31's Chromium, and Edge), whether a LOWER custom
highlight's text-decoration survives an UPPER opaque `::selection`.** **This desk has not measured it and
will not assert it.** Record the answer in the build report:
- **if it survives** → build the overline as the second channel (pending Nick's word on Q-OV1);
- **if it does not** → **STOP. No CSS highlight can meet the requirement**, and the question returns to Nick
  as **a capability limit, not a design choice.** *Do not ship a fill-only highlight that silently fails the
  test this brief was written around.*

## S3 · SCOPE — "VIEWABLE TEXT" IS WHAT IS RENDERED, NOT A SEARCH

| surface | painted |
|---|---|
| page | the paper's rendered text |
| opened card | the card's text |
| **board** | **the text of cards DISPLAYED on the canvas and NOT hidden by 108's filter** — the board has **no text of its own** (item 124); **a member not shown is not viewable** (item 125) |
| thumbnails | **not painted** |

**Never** scrolls to a match · **never** counts matches · **never** reaches off-screen text. *Find is
the search; this is a lens over what is already in front of the writer.*

## S4 · MATCHING (TH-Q2, ruled)

**Case-insensitive, whole word or whole phrase.** `stark` paints *Stark* / *STARK* / *stark* and
**not** *starkly*. **Every active tag paints at once** (ALL). **Escape tag text before building the
pattern** — a tag is writer-typed and may contain regex metacharacters.

---

## S5 · THE HARNESS — `apps/desktop/scripts/harness/i145.mjs`

Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the
seams** · **absolute worktree path**.

### ⚠ THE CHECK THAT MUST NOT BE SKIPPED — and why a normal run cannot reach it

**The harness runs only in Edge — the one browser guaranteed to HAVE the API.** **So a normal run
can never exercise the absent path.** *That is item 130's shape exactly: the instrument answers the
question it was asked, and the question that mattered is never asked.* **So the harness REMOVES the
API on purpose** — an init script deletes `CSS.highlights` before the app loads — **and asserts S0(c)'s
STATED behaviour** (no highlight; or the fallback, obeying rule 1). **The harness asserts the stated
behaviour; it never assumes the API.**

1. **With the API:** an active tag paints its terms — **and the text nodes are byte-identical before
   and after painting** (no DOM rewrite). *The mock already proves this is measurable.*
2. **⚠ Without the API (removed by the harness):** the **stated** behaviour, asserted.
3. **Whole word:** `starkly` is **not** painted; `STARK` is.
4. **Metacharacters:** a tag containing `.` or `(` does not throw and matches literally.
5. **Board scope:** a card **hidden by the filter** is not painted; a **member not displayed** is not
   painted.
6. **Thumbnails are never painted.**
7. **Selection coexists:** select a painted term → **`::selection` is still brass**, the fill is still
   `--tag-fill`; **the selection survives** a tag press (the API path never destroys it).
7b. **⛔ THE OVERLAP, AS MEASURED IN S0** — a real selection over a tagged word, and the harness asserts
   **whatever S0 recorded**: the second channel visible under the selection, or (if S0 stopped the build)
   nothing ships. *A pixel read of the rendered overlap, not an assumption about the stacking order.*
8. **Colour:** the painted fill resolves from `--tag-fill`, **which must never equal `--brass`** — the
   only separator between a tag and a selection outside the overlap. Never a literal.
9. **One register:** a static assertion that no second decoration pass walks the contenteditable.
10. Both `HARNESS_PARKED` settings CLEAN; **park count audited.**

---

## §CLOSE

1. **S0(b)'s measurement, S0(c)'s stated absent behaviour, AND S2b's overlap measurement are IN THE BUILD
   REPORT** — the ratification is conditional on the first two, and **the build is conditional on the
   third.**
2. **Confirm the gate** — 108 merged.
3. Build S1–S5; `tsc` + `build:web` + selftest + full suite, **both settings**, green.
4. **Push the branch. Do not merge.**
5. **A FOUNDER SITTING IS OWED** — *the right words are painted, findably, and nothing the writer typed
   moved* are meaning claims.

**Nothing deploys on this lane's word.**
