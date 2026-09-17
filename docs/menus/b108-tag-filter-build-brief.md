# ITEM 108 BUILD BRIEF — THE TAG FILTER, AND THE FOUNDATION EVERY TAG BRIEF STANDS ON
### PLAN desk · 2026-09-16 · decision-complete · **BUILDS FIRST — gates 143, 144, 145 and VW3**

**WORKTREE:** `.claude/worktrees/i108-filter` · **BRANCH:** `i108-filter` · **OFF:** `origin/main`
at build time. **Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — one machine, one browser pool. Read the box
> ordering on the ledger or ask chat 1 before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR**, line numbers a courtesy. Verified at `d53506f`.

**SOURCES:** `item108-tags-as-sorting-pass.md` · `siblings-and-highlight-pass.md` §3 ·
**`tag-colour-foundation.md` (binding on every slice here)** · `tag-controls-pass.md` TC1.

> **⚠ TAG COLOUR REVERSED, 2026-09-16 — read `tag-colour-foundation.md` §0 before any colour work.**
> Olive was ruled, then reversed by Nick to ORANGE, then refined: **`::selection` stays brass; a selected
> tag chip is orange (`--tag`); a matching word takes a LIGHTER orange fill (`--tag-fill`).** **Where-you-are
> markers are NOT tags and stay olive.** **And the overlap — a selection over a tagged word — is an OPEN
> acceptance test (§1 of the foundation): by the spec, an opaque selection hides the tag completely.**

---

## §0 · WHY THIS BUILDS FIRST — the gate map

```
            ┌─ 143 the tag controls   (needs: vocabulary, tokens, Box.tags for its Card mounting)
  108 ──────┼─ 144 the sibling row    (needs: vocabulary, ALL semantics, the filter component, tokens)
  (this)    ├─ 145 the term highlight (needs: active-tag state, vocabulary, tokens)
            └─ VW3 retires Spread.tsx (needs: this filter to exist — RULED CARRIED FORWARD)

  108's own mountings are gated by their HOSTS:
     board canvas ........ exists          → build now
     thumbnail side menu . PW2 builds it   → mount when PW2 has landed
     Shelf / Trash views . VW2 builds them → mount when VW2 has landed
```

**⚠ THE ORDERING THAT MUST NOT SLIP:** **S2 (the vocabulary reader) lands before VW3 deletes
`Spread.tsx`.** The only working tag computation in the product is inline at `Spread.tsx`; if VW3
builds first, the app's only tag filter and its only vocabulary die in one commit, with the successor
not yet written. **VW3's brief already names this gap as OPEN; this slice closes it.**

---

## S0 · SURVEY

**(a)** Confirm: `tags?: string[]` on `JournalEntry`; **no `tags` on `Box`**; `tagFilter`/`allTags` in
**exactly one file** (`Spread.tsx`); the tag writers `addTag`/`removeTag` in `PageEditor`,
`BoardEditor`, `ScriptEditor`, `JournalEntry`.
**(b) Record the GROUND of every surface this filter mounts on** — paper or dark chrome. **The orange
tokens need no per-ground redefinition** (`tag-colour-foundation.md` §5 — text flips to `--on-brass` on
both), **but the page is where the tag fill is faintest** (§4's trade), so the report names which
mountings sit on paper.
**(c)** Park discipline: anything rewritten in place is parked with its original quoted verbatim;
**audit the park COUNT** against this brief's claim.

---

## S1 · THE TAG TOKENS — orange, exactly as `tag-colour-foundation.md` §5 specifies

- **`--tag`** — a selected tag chip, **the brass step.** **`--tag-fill`** — a matching word's fill, **the
  lighter orange, hand-computed from brass** (t ≈ 0.35 → `#ffbc59`; **TAG-Q3 is Nick's**, report the value
  used).
- **Hand-computed, stored as named tokens — NEVER `color-mix()`.** The stylesheet states it has *"no
  color-mix()/filter precedent anywhere."*
- **One value per token, slotted per theme. No ground redefinition** — text on the fill flips to
  **`--on-brass`** on both grounds, the same flip `::selection` already makes.
- **Components write `var(--tag)` / `var(--tag-fill)` and nothing else** — no hex, no `--brass` directly.
- **⛔ `--tag-fill` MUST NEVER EQUAL `--brass`.** With tags and selection both orange, **intensity is the
  only thing separating them**, and it lives in this token pair.

## S2 · THE ONE VOCABULARY — `getTagVocabulary()` (name illustrative)

**A single named reader** over every live entry **and every card once S3 lands.** A derivation, never
a stored list. Zero schema.
**Why named, in the house's own ratified words:** *"a filter written at the call site is a rule that
must be remembered every time; a named reader is a rule that must be BYPASSED on purpose."* **Two
inline `new Set(flatMap(...))` computations are two lists that have not drifted yet** — the first
time one learns about card tags and the other does not, the filter offers a tag the controls cannot
see.
**"One list" means ONE SOURCE, not one rendering.** The filter shows **the tags present in the
current view**; the controls (143) show **the whole vocabulary**. **Same reader, different slice.**
**⛔ Lands before VW3 deletes `Spread.tsx`.**

## S3 · CARD TAGS — `Box.tags?: string[]`

**Additive optional field, the `onCanvas` pattern. Zero schema. Absence means untagged; nothing is
backfilled.**
**⚠ THE COPY SEMANTICS WAKE HERE.** Item 123's deferred clause — *"tags travel with the copy; threads
do not"* — **was blocked on this field.** On landing, **PW2's copy** (by whitelist, as ruled) **must
include `tags`**, and the copy tray's full sentence ships: *"A copy is a new card owned by the board it
lands on. Its tags come with it; its threads do not, and edits do not follow."* **Name this in the
offer so PW2's lane picks it up.**

---

## S4 · THE FILTER — one component, four mountings

**One implementation with a `scope` prop** — the 119-mirror pattern — mounted on: **the board canvas**
(now) · **the thumbnail side menu** (when PW2 lands) · **the Shelf and Trash views** (when VW2 lands) ·
**the sibling row** (144 mounts it). **Reuse the Spread's proven SHAPE** (derive the tags present →
chips → press to activate) — **⛔ BUT NOT ITS STYLING: see S6.**

**THE RULINGS, each binding:**
- **ALL — multiple active tags, intersection, never union** (Nick: *"All of them. It should be a kind
  of sorting mechanism"*). **Each tag added makes the set smaller.**
- **A LENS, NEVER MEMBERSHIP** (item 125). **No filter state writes. No filter state persists to
  storage** — it is a posture of looking, not a fact about the work.
- **The tag list is the tags present in THIS view** — Nick's *"a list of all available tags on that
  board."* Not the whole vocabulary.
- **Active tags are visible, in the order added, each droppable on its own; "clear all" is a
  separate, second act.** *A writer who added four tags and got nothing takes back the fourth, not
  all four.* The last step is always rightmost.
- **AN EMPTY RESULT STATES ITSELF IN WORDS**, naming the tags that produced it:
  *"Nothing on Characters carries all of #stark, #crypt and #lore."* **Under intersection emptying the
  set is a normal outcome; an empty view reads as breakage.** **No count** — the no-count law stands.

## S5 · ON A BOARD — HOLD (Nick: *"Hold confirmed"*)

**Cards the filter hides leave their positions EMPTY. Nothing moves. Nothing reflows.**
**Why, recorded so no one "improves" it into a reflow:** a reflowed board is complete, tidy and
smaller — **what a board looks like after you delete things.** *The holes are the honesty.* **And
only reflow can fail silently:** it owes an exact restore of every position; HOLD moved nothing, so
it owes nothing.
**A hidden card is not interactive** (no hit target in its empty place) **and is not "viewable text"**
for 145.

## S6 · THE AUDIT — INVERTED by the reversal (`tag-colour-foundation.md` §6)

- **A1 — `.spread-lens-chip[data-active="true"]` paints the active tag BRASS. ✅ KEEP IT.** *This brief
  once said to change it; the reversal made it correct.* **Carry the Spread's active-chip colour forward
  as the ruled one** — via `var(--tag)`, not the literal.
- **A2 / A3 — the brass-press classes are no longer hazards.**
- **A5 — the transient press flash stays orange. APPROVED (TAG-Q1).**
- **A6 — `button:focus-visible` stays brass. APPROVED (TAG-Q2).**
- **⚠ THE ONE NEW HAZARD:** a matching word painted in **`--brass`** instead of `--tag-fill` would be
  **indistinguishable from a selection** everywhere. S7 check 8 asserts against exactly that.

---

## S7 · THE HARNESS — `apps/desktop/scripts/harness/i108.mjs`

Standing laws: **drivers never assume existence** · **real pointer events**, never synthetic `click` ·
**seed through the seams** · **absolute worktree path**.

1. **ALL:** a fixture where tag A matches 3 cards and tag B matches 3, overlapping in 1 → activating
   both shows **exactly 1**. *A union would show 5; the check cannot pass by accident.*
2. **HOLD:** every visible card's rendered position is **identical** before and after filtering.
3. **Empty:** activating a disjoint pair renders **the sentence**, naming both tags — **and no empty
   container without it.**
4. **Drop one:** from three active tags, dropping the **middle** one leaves the other two active, in
   order.
5. **Nothing persists:** reload → no filter active; **no storage write** observed during filtering.
6. **The vocabulary is ONE reader** — a static assertion that no second `new Set(... tags ...)`
   computation exists outside it.
7. **`Box.tags` round-trips** and an untagged card stays untagged (no backfill).
8. **⚠ THE TAG FILL IS NEVER THE SELECTION'S BRASS** — assert `--tag-fill` resolves to a value
   **different from** `--brass`, and that no painted tag match uses `--brass`. *With both orange,
   intensity is the only separator; this check is where it is kept.* Active chips resolve from `--tag`.
9. **Tokens:** no tag element's computed colour is a literal outside `--tag`/`--tag-fill`.
10. Both `HARNESS_PARKED` settings CLEAN; **park count audited.**

---

## §CLOSE

1. S0 reported — **(b) the grounds, measured.**
2. **S1–S3 land before S4**; **S2 lands before VW3.**
3. `tsc` + `build:web` + selftest + full suite, **both settings**, green, independently re-run.
4. **Push the branch. Do not merge.** In the offer, **say which mountings shipped** (board canvas now;
   side menu and Shelf/Trash only if PW2/VW2 had landed) **and name S3's wake for PW2.**
5. **Not here:** the controls (143) · the sibling row (144) · the highlight (145) · Library.
6. **A FOUNDER SITTING IS OWED** — *the filter hid the right things, and an empty sort reads as a
   sort* are meaning claims no suite certifies.

**Nothing deploys on this lane's word.**
