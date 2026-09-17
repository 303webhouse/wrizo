# THE TAG COLOUR — the shared foundation for 108 · 143 · 144 · 145
### PLAN desk · 2026-09-16 · every tag brief cites this document
### *(formerly `tag-olive-foundation.md` — renamed because a file called "olive" that specifies orange is a trap)*

---

## §0 · THE RULINGS, IN ORDER — a founder's reversal, recorded as one

**1 · TH-Q1 — OLIVE.** *"Let's make the tags and the tag highlights the olive green color so that
orange stays connected to the User producing writing or making choices/progress."*
**→ SUPERSEDED by 2.**

**2 · REVERSED — ORANGE.** *"1. Approved 2. Approved. 3. Eh, I've changed my mind. When a user selects
a tag, let's just make the tag orange and use orange ('brass') as the background highlight for each
matching word."*
**→ the brass-fill half REFINED by 3.**

**3 · THE FORK, RULED (B).** *"If the user highlights over an already-highlighted word, make the tagged
word's highlight a few shades lighter than brass, but still orange so the tag is still visible."*
**`::selection` STAYS BRASS, unmoved. The tag's fill is a LIGHTER ORANGE.** Where a selection covers
a tagged word, **the tagged word must remain visible beneath it** — **the design's acceptance test.**

**Also ruled:** **TAG-Q1 approved** — the transient press flash on tag controls stays orange.
**TAG-Q2 approved** — the app-wide brass keyboard-focus outline is left alone.

### THE PLAIN RECORD, so a later reader sees a reversal and not a drift

**The stylesheet's colour rule — *"olive marks where you are; orange marks what you do"* — was put in
front of its author at the first place it would bend. He held it once (ruling 1). He has now set it
aside, for tags, by his own word (ruling 2).** That is a founder's decision, not an erosion.

**⚠ AND THE SCOPE OF THE REVERSAL IS TAGS — NOTHING ELSE.** The rule still governs every
**where-you-are marker** in the app. **The sibling row's current-tab marker (144), the mode strip's
active tab, open-drawer states — all stay olive.** *A reader who takes "tags went orange" as "the olive
rule is retired" will repaint half the app. It was not retired; it was excepted, for one kind of
thing, by the person who wrote it.*

**The olive design (§7) is kept whole, marked superseded twice**, with its measured reasoning intact.

---

## §1 · ⛔ THE OVERLAP — the acceptance test, and the spec fact that decides it

**CSS Custom Highlight API, §4.2.4, verbatim:**
> *"The highlight overlays of the custom highlights are **below** those of the built-in highlight
> pseudo-elements in the stacking order"*

**§4.2.5:** `priority` orders custom highlights **among themselves only.** **No priority lifts a
custom highlight above `::selection`.**

**Item 122 ships `::selection{ background: var(--brass) }` — fully OPAQUE `#FF9800`.**
**Therefore a tag's fill is painted UNDERNEATH a selection, and an opaque selection covers it
completely.**

**MEASURED** (`orange-contrast.py`, calibrated against the house's own figures — 2.41 and 6.58):
*"separation" = contrast between [selection over a tagged word] and [selection over a plain word] —
i.e. can the writer still see which selected words are tagged.*

| selection | page separation | page: selected plain text | card separation | card: selected plain text |
|---|---|---|---|---|
| **opaque (as shipped)** | **1.00:1 — INVISIBLE** | 8.32:1 | **1.00:1 — INVISIBLE** | 8.32:1 |
| α 0.85 | 1.05:1 | 9.03:1 | 1.38:1 | 6.25:1 |
| α 0.70 | 1.10:1 | 9.86:1 | 1.97:1 | **4.56:1** |
| α 0.55 | 1.16:1 | 10.77:1 | 2.89:1 | **3.21:1 — fails** |
| α 0.45 | 1.20:1 | 11.48:1 | 3.75:1 | **2.55:1 — fails** |

*(tag fill `#ffbc59`, t = 0.35)*

**READ IT PLAINLY:**
- **As ruled and as shipped, the tag is invisible under a selection.** Ruling (B) **fails its own
  acceptance test** — not by styling, by the spec.
- **Making the selection translucent does not rescue it on the PAGE**, where writing happens: brass
  over cream and brass over light orange are both light oranges, and the separation never passes
  **1.20:1**.
- **On the dark CARD it separates** — but **selected plain text drops below 4.5:1 by α 0.70.**
- **The fill channel is exhausted.** Two orange fills on a light ground cannot be told apart through a
  third orange fill on top.

---

## §2 · FABLE'S READING, AND WHY THE NARROW READING CANNOT BE BUILT

**Nick's sentence scopes the lightening to the overlap.** *This is Fable's reading of a founder
sentence, not his text:* **the tag's fill is the lighter orange ALWAYS.** Taken narrowly — brass
everywhere, lighter only under a selection — tag matches and selected text would be **identical
everywhere except the overlap**, inverting the reason he gave.

**This desk adds a second reason, and it is mechanical:** **the narrow reading has no CSS hook at
all.** There is no selector for *"the part of a highlight that a selection covers,"* and a script
that computed the intersection would paint it **as another custom highlight — which the spec places
beneath the selection again.** **The only region where the narrow reading differs from Fable's is the
region the spec guarantees is hidden.** *So the narrow reading is not only inverted; it is
unbuildable.* **Both are mocked side by side** (`tag-overlap-mock.html`). **Nick confirms or
corrects.**

---

## §3 · WHAT COULD PASS THE TEST — handed up, not decided

| option | what it does | verdict |
|---|---|---|
| **(i) A SECOND CHANNEL** | the tag also carries an orange **decoration** — an **overline**, deliberately *not* the writer's underline (item 122) | **the only channel the selection's background does not own.** **⚠ Whether a LOWER highlight's decoration survives an UPPER selection is an ENGINE detail this desk has NOT measured** and will not assert. The mock tests it live: **select text over a tagged word in your browser.** |
| (ii) translucent selection | brass at α < 1 | **fails on the page** (≤ 1.20:1); **breaks selected text on cards**; and changes item 122's shipped opacity, which (B) said stays unmoved |
| (iii) accept it | the tag is hidden while selected; the active chip still says the tag is on | **contradicts (B)'s explicit requirement** |
| (iv) revisit (A) | move selection off brass | **does NOT solve the overlap** — *any* opaque selection hides *any* custom highlight. (A) only changes things **outside** the overlap, separating by hue instead of intensity |

**LEAN: (i), CONTINGENT ON THE ENGINE MEASUREMENT.** **If the shipping engines hide a lower highlight's
decoration under a selection too, then no CSS highlight can meet the requirement at all** — and the
question returns to Nick as **a capability limit, not a design choice.** *This desk would rather say
that now than let a brief promise it.*

**Q-OV1 — Nick:** after selecting over a tagged word in the mock — (i), (iii), or something else?

---

## §4 · THE TREATMENT, AND THE ONE TRADE THAT CANNOT BE TUNED AWAY

- **A selected tag chip is ORANGE** — Nick: *"make the tag orange."*
- **A matching word takes the LIGHTER ORANGE as a background fill.**
- **Text on the fill flips to `--on-brass` (dark) on both grounds** — *the same flip `::selection`
  already makes*, so a tagged word reads the same way a selected one does, one step lighter.

**THE LIGHTER ORANGE — hand-derived from brass** (brass tinted toward white by *t*):

| t | fill | text on fill | **fill vs brass** | fill vs paper | fill vs card |
|---|---|---|---|---|---|
| 0.25 | `#ffb240` | 9.98:1 | 1.20:1 | 1.54:1 | 10.58:1 |
| **0.35** | **`#ffbc59`** | **10.75:1** | **1.29:1** | **1.43:1** | **11.39:1** |
| 0.45 | `#ffc673` | 11.59:1 | 1.39:1 | 1.33:1 | 12.28:1 |
| 0.55 | `#ffd18c` | 12.59:1 | 1.51:1 | 1.22:1 | 13.34:1 |

**⚠ THE TRADE, stated rather than tuned:** on the **page**, **lighter separates the tag from a
selection (fill vs brass ↑) but sinks it into the paper (fill vs paper ↓).** **Darker does the
opposite.** **There is no *t* that wins both** — *"fill vs brass" is ruling (B)'s ONLY separator
outside the overlap, and it tops out near 1.5:1.* **On the card, every step is vivid.**
**Recommend t ≈ 0.35. TAG-Q3's slider returns with these values** (`tag-overlap-mock.html`).

---

## §5 · THE TOKENS — one derivation, one name, now orange

**The house's derivation precedent holds:** the stylesheet has *"no `color-mix()`/filter precedent
anywhere"* and hand-computes its steps. **So:**

```
--tag        the selected tag chip — the brass step
--tag-fill   the matching-word fill — the lighter step, hand-computed from brass (t per §4)
```

- **Components write `var(--tag)` and `var(--tag-fill)` and nothing else.** No hex, no `--brass`
  directly.
- **No ground redefinition is needed this time** — text flips to dark on both grounds, and **no darker
  paper step exists that does not collide with the selection** (§4's trade). **One value per token,
  slotted per theme.**
- **`--tag-fill` MUST NEVER EQUAL `--brass`.** With both now orange, **intensity is the only thing
  separating a tag from a selection** — the token pair is where that separation lives, and a theme that
  sets them equal erases it silently.

---

## §6 · THE AUDIT — INVERTED

| # | where | olive-era verdict | **now** |
|---|---|---|---|
| **A1** | `.spread-lens-chip[data-active="true"]` → brass | *"change it"* | **✅ CORRECT AS IT IS — carry it forward.** The Spread's brass active chip is now the ruled colour. **108's instruction flips from "change this" to "keep this."** |
| A2 | `.wz-page-setup-chip:active` → brass press | trap | **no longer a hazard** — on-colour |
| A3 | `.wz-place-page-row:active` → brass press | trap | **no longer a hazard** — on-colour |
| A4 | `.wz-field:focus` → orange border | trap | **no longer a hazard** for a tag input |
| A5 | G5's transient press flash | keep (lean) | **✅ APPROVED — TAG-Q1** |
| A6 | `button:focus-visible` → brass | keep (lean) | **✅ APPROVED — TAG-Q2** |

**⚠ THE INVERSION CREATES ONE NEW HAZARD, and it replaces every old one.** The olive-era harness
assertion was *"no tag state is brass."* **It flips to: "the tag fill is `--tag-fill` and is NEVER the
selection's brass."** **A tag match painted in `--brass` would be indistinguishable from a selection
everywhere** — the exact failure (B) exists to prevent. **Assert the two values DIFFER.**

**⚠ AND WHERE-YOU-ARE MARKERS ARE NOT TAGS.** The sibling row's current tab stays **olive** (§0).

---

## §7 · THE OLIVE DESIGN — SUPERSEDED TWICE, KEPT WHOLE

*(Ruling 1, superseded by ruling 2, whose fill was refined by ruling 3. The reasoning is preserved
because it is still the measured account of why olive TEXT and an olive UNDERLINE fail on this
app's paper — facts that did not change when the colour did.)*

**The olive treatment, as it stood:** an olive **fill**, text unchanged — because **olive text on paper
is 2.41:1** (Nick's own *"can barely see"*, SV19/SV20), **weight is impossible** through
`::highlight()` (font properties are not among the properties that apply to highlight pseudo-elements),
and **underline was rejected on MEANING** (item 122 made underline a writer's mark). **Paper used the
door step `#4F5730`; the card used the rest step `#96a05a`; `--tag`/`--tag-fill` were redefined in the
paper scope.** Mock: `tag-olive-treatment-mock.html` (superseded; kept as record).

**Two findings from that work SURVIVE the reversal and bind the orange design too:**
- **Underline is still the writer's mark** — which is why §3's second channel is an **overline**.
- **Weight is still impossible** through the API.

---

**Nothing locks.** — the PLAN desk
