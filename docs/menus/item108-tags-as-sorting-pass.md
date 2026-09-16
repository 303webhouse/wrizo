# ITEM 108 — TAGS AS SORTING · committee pass
### PLAN desk · 2026-09-16 · **RULED IN PART — Nick's four, 2026-09-16**

> **NICK, VERBATIM:** *"1. Hold confirmed  2. Since Cards can be made into any size, have Card
> thumbnails match the proportion of each card individually.  3. Accepted  4. Skip it, but one
> small change to the Card tools menu: […] These options should exist for every tool strip menu
> (Page, Card, Board)"*
>
> **RECORDED (mapping per Fable's relay):** **Q-1 HOLD** · **Q-3 card thumbnails mirror each card's
> own proportion** — the thumbnail law is **amended** in the item-134 charter pass, not excepted ·
> **Q-4 the source-list shape ACCEPTED** · **Mockup C SKIPPED** · **his "one small change" is a new
> subject — THE TAG CONTROLS — with its own pass and its own number** (`tag-controls-pass.md`).
>
> **⚠ Q-2 IS UNANSWERED.** His four map to Q-1, Q-3, Q-4 and the mockup; **nothing in them answers
> Q-2 (one tag at a time, or several).** It is **left open, not inferred** — the pass's
> recommendation (**one**) stands as the default until he rules it. *A question a relay did not
> answer is not a question answered.*

**NICK'S CHARTER GOVERNS AND IS QUOTED IN FULL IN THE RELAY.** The sentence this pass is
measured against: *"pull up character info or a type of research… while they're on a Page,
Board, or Card."*

---

## §0 · GROUND TRUTH — re-measured at `8caa689`, not taken on trust

Fable's measurements, confirmed independently before designing:

| claim | verdict |
|---|---|
| `tags?: string[]` on `JournalEntry` | **CONFIRMED** (`types/index.ts:214`) |
| **`Box` has NO tags field** | **CONFIRMED** — zero occurrences inside the interface |
| tag filter exists in **exactly one place** | **CONFIRMED** — `git grep tagFilter\|allTags` hits **one file**, `Spread.tsx` |
| that surface is the one **VW3 retires** | **CONFIRMED** |

**Added by this desk:** tags are **written** from three faces — `PageEditor`, `BoardEditor`,
`ScriptEditor` (`addTag`/`removeTag` → `patchJournalEntry`). **So tags can be made in three
places and used in one — and that one is being deleted.** *The capability is not
under-designed; it is under-consumed.*

**FIRST CONSEQUENCE, already discharged:** VW3's brief now carries the tag filter as **RULED
CARRIED FORWARD** — its own clause commit, with the sequencing gap named so the filter cannot
vanish between two individually-correct tickets.

---

## §1 · THE FILTER — one grammar, four surfaces

**THE LAW:** **the tag list is the tags present in THIS view, clicked to narrow it.** Nick's own
words — *"a list of all available tags on that board."* **Not a global vocabulary**, not a
taxonomy, not a manager. *A tag list that shows tags you cannot see anything of is a filing
cabinet; the cluster pass already ruled the corkboard must not become one.*

**T1 · ONE COMPONENT, FOUR MOUNTINGS.** The board canvas · the thumbnail side menu (Q3/Q4) ·
the Shelf and Trash views (VW2) · the Library later. **One implementation with a `scope` prop**,
the 119-mirror pattern, so the grammar cannot drift into four dialects. **Reuse the Spread's own
shape**, which is built and proven: `allTags` derived from what the view holds → chips → one
active at a time → clearable. **Do not invent a second filter grammar; re-home the one that
works.**

**T2 · A LENS, NEVER MEMBERSHIP (item 125 holds).** Filtering changes **what is displayed**,
never **what belongs**. Nothing about a filter writes, and **no filter state persists to
storage** — it is a posture of looking, not a fact about the work.

**T3 · AND THE WRITER MUST NEVER READ HIDING AS REMOVING.** *(Fable's warning, answered.)* The
reassurance is carried by **three things that cost nothing**: the pressed chip stays visibly
active; a **clear affordance is always present while a filter is on**; and — on a board —
**§2's holes.** **No count is added.** The no-count law stands; the writer knows they filtered
**because they pressed it**, and an ambient "6 of 20" would buy nothing the active chip does not
already say.

**T4 · ONE TAG AT A TIME.** The Spread's behaviour, kept deliberately. **Multi-tag intersection
is a query language**, and a query language is the taxonomy creep the cluster pass made law
against: *"no tag types, no colours, no required tags, no hierarchy."* **If Nick wants AND
later, it returns as its own question with its own evidence.**

---

## §2 · WHAT FILTERING DOES TO A BOARD — the fork Nick must see

A board is an **arrangement**. Hiding half the cards leaves holes.

**CANDIDATE HOLD (Fable's lean, and this desk's, for a second reason):** the remaining cards
**stay exactly where the writer put them**. Gaps appear.
**CANDIDATE REFLOW:** the survivors close up into a dense grid.

**THE ARGUMENT FABLE ALREADY MADE:** the arrangement is the writer's, and a lens is not a
rearrangement.

**THE SECOND ARGUMENT, which is this desk's contribution — and it inverts the obvious:**

> **THE HOLES ARE THE HONESTY.**

A board with gaps says *"things are hidden here."* **A reflowed board says *"this is all there
is"*** — it looks complete, tidy, and smaller. **Reflow is the layout that reads most like
deletion, which is precisely the misreading T3 exists to prevent.** The apparently-friendlier
option is the dishonest one.

**AND REFLOW OWES A GUARANTEE HOLD DOES NOT.** Reflow must restore **every card to its exact
prior position** when the filter clears. Hold restores nothing because it moved nothing.
**A view that relocates a writer's arrangement and promises to put it back is a data-shaped risk
wearing a view's clothes** — and the failure is silent, permanent, and discovered late.

**Recommend HOLD. Both are rendered in mockup B so Nick rules on the paper.**

---

## §3 · CARD TAGS — the new capability, and C4's answer

**T5 · CARDS BECOME TAGGABLE.** `tags?: string[]` as an **additive optional field on `Box`** —
the `canvasW`/`footerOn`/`systemKind`/`onCanvas` pattern. **Zero schema.** Absence means
untagged; nothing is backfilled.

**T6 · THE GESTURE IS ALREADY RULED — it does not need inventing.** **R13.v:** *"The Tools
sliver belongs to the OPENED CARD: styling (B/I/…) and probably linking/tagging"* — and **F10's
default was IN.** **So tagging lives in the opened card's tools**, beside Styling, where a writer
who is reading a card already has their hand. *No new door, no new surface, no new gesture.*

**T7 · A CARD'S FACE STAYS ITS WORDS.** **Tags never render on the canvas face.** They are seen
in **the opened card** and in **a thumbnail row's second line** — the slot PW10 already governs.
**CA6 binds:** *no page furniture grows on a card.* A wall of three-word cards wearing chip rows
is the "dressed-up stickies" the Card pass's own opposition warned about.
**And the writer does not need them on the face, because §1 is how you see tags at scale:**
press `#stark` and the others go quiet. *The filter is the visualisation.*

**T8 · SUCCESSOR NAMED.** On landing, **item 123's deferred clause wakes** — *"tags travel with
the copy; threads do not"* — and **the copy tray's full sentence ships**: *"A copy is a new card
owned by the board it lands on. Its tags come with it; its threads do not, and edits do not
follow."* **Item 108/T5 is that clause's blocker, and this is its release.**

---

## §4 · THE RETRIEVAL GESTURE — what the mockups must earn

> *"pull up character info or a type of research while they're on a Page, Board, or Card"*

**This is not the filter.** The filter narrows **what is already in front of you**. Nick is
asking to reach **what is not** — **without leaving the surface**.

**T9 · IT IS ALREADY RULED WHERE IT LIVES, and the composition is the design.** Three standing
rulings meet here and produce the whole gesture with **no new concept**:

1. **Q19, ratified:** **THE RAIL TRAVELS; THE COUNSEL READS.** Retrieval-without-leaving **is
   reading**. **So it is the Counsel's, not the rail's.** *The rail would take you there; the
   point is not to go.*
2. **FN2:** Find already sits **directly beneath the composer**, in the Counsel.
3. **PW5:** **a card opens where you are; a page is travelled to.**

**THE GESTURE, therefore:**

```
  on a Page (or Board, or Card) — open the Counsel
    Talk it through            [composer]
    SEARCH YOUR WRITING        [Find]
    #character #stark #crypt   [the tags in your writing]   ← T10
    ─────
    results, as thumbnails                                   ← FN4: never the message stream
```

**Press `#character` → results. Press a result → THE CARD OPENS OVER YOUR PAGE.** The caret has
not moved. **Esc closes it.**

**The arithmetic:** **Counsel · tag · result = 3 presses out, 1 back, and the writer never left
the page.** That is Nick's *"minimum amount of setup and action taken"*, and **none of it is new
grammar** — it is three ruled behaviours composing.

**T10 · THE TAG ROW IS FIND'S VOCABULARY, NOT A SECOND CONTROL.** The chips sit **beneath Find**,
in the same region, and **a chip press IS a find** — the same act, pre-spelled. *It is not a
third control in a row FN designed to be unmistakable (FN's own open question); it is the search
box's shortcut bar.*

**T11 · RESULTS ARE THUMBNAILS, and the thumbnail law governs — with one gap.** Boards **wide**,
pages **tall** (ruled 2026-09-13). **⚠ A CARD'S SILHOUETTE IS UNRULED.** The item-134 mockups
drew cards as landscape panels and boards as landscape-with-a-doubled-edge — legible, but cards
and boards then share an orientation while pages stand apart. **Nick ruled two of three shapes
explicitly; the third is open and is Q-3 below.**

---

## §5 · FIND — the placeholder, and the scope collision

**T12 · THE PLACEHOLDER IS NICK'S, EXACTLY: `SEARCH YOUR WRITING`.** **This supersedes FN5's
recommended `Find in this project…`** — and the supersession is total, because FN5's wording
encoded a *project* scope that Nick has now ruled away.

**T13 · SCOPE: EVERYTHING THE WRITER HAS WRITTEN, ANYWHERE. NEVER PROJECT-SCOPED.** FN's open
question — *"whether Find's scope is the project or the whole desk"* — **is answered: the whole
desk, and beyond it.** The desk's own recommendation there (*"fixed at project scope for the
first cut"*) is **overruled by the founder**, and rightly: a writer searching *their writing*
does not hold a project boundary in their head.

### ⚠ T14 · THE COLLISION — named, with FN8's own protocol invoked

**FN1 is Nick's ruling and it is harness-enforced:** *"FIND IS A LOCAL INSTRUMENT AND ITS PRESS
SENDS NOTHING. Zero network on press, **proven by falsification**."*

**Nick now:** *"The search should check anything the user has written anywhere in the app,
**including when we get to the social media app**."*

**A social app's corpus is not local.** Taken together and naively, these cannot both hold.
**And FN8 wrote the procedure for exactly this moment:** *"If a future ticket proposes making
Find 'smarter,' that is a proposal to break FN1 and returns to Nick by name."*

**THE DESK'S ANSWER — a shape that satisfies the new scope WITHOUT breaking FN1 today:**

> **THE CORPUS IS A LIST OF SOURCES, AND EACH SOURCE DECLARES WHETHER IT IS LOCAL.**
> **Today there is exactly one source: this desk, local.** FN1 holds **unconditionally for local
> sources** — zero network on press, still proven by falsification.
> **A non-local source is a separate, consented channel** — the *exact* pattern FN8 already
> ruled for the Tutor's tag awareness (*"a different, consented channel with its own button
> naming"*). **It never rides this row silently.**

**Why this is the right shape and not a dodge:** Fable's constraint was *"the design must not
assume the corpus is local or finite… the shape must accept new sources without redesign."* **A
source list accepts the social app by adding a row. It does not require FN1 to be weakened
now — and when the day comes, the decision is a visible, consented act, which is what FN8
demanded.** **The break is deferred, not smuggled.**

**ROUTED BY NAME, as FN8 requires: Q-4 below.**

**T15 · TUTOR'S USE OF TAGS IS UNTOUCHED.** FN8's two-channel separation stands whole. **This
pass designs sorting and retrieval; the Tutor's tag awareness remains its own consented
channel** and is not routed through Find.

---

## §6 · QUESTIONS FOR NICK

**Q-1 · RULED — *“Hold confirmed.”*** Cards hold position under a filter; **the holes are
honest.** ~~Holes, or reflow? **Recommend HOLD**~~ — the arrangement is yours,
**and the holes are the honesty**: a reflowed board reads as *"this is all there is."* Mockup B.
**Q-2 · ⚠ STILL OPEN — not answered in his four.** One tag at a time, or several? **Recommend
one**, which stands as the default until he rules. Several is a query language, and the
cluster pass ruled against taxonomy creep. Returns with evidence if you want it.
**Q-3 · RULED — *“have Card thumbnails match the proportion of each card individually.”*** A card
has no canonical shape because the writer chose it, so its thumbnail shows what was made. **The
thumbnail law is amended in the item-134 charter pass.** ~~What is a card?~~ Today's
mockups draw it landscape, which makes it share an orientation with boards. *(A small square is
the obvious third shape, but this desk will not choose it for you after you ruled the other
two.)*
**Q-4 · RULED — *“Accepted.”*** The source-list shape stands: **FN1 holds unconditionally while
one local source exists; a remote source arrives later as a consented channel.** ~~Find's reach,
routed by name per FN8~~ — routed, and ruled. The desk proposes **sources, one of
them local today**, so FN1's zero-network guarantee survives intact and the social app arrives
later as a consented source rather than a quiet exception. **Confirm the shape, or rule that
Find may reach the network when the time comes.**
**Q-5 · Registry.** Fable asks whether the **card-tags half needs its own number** — chat 1's
call. This pass keeps it as §3 of 108 and flags the split.

---

## §7 · MOCKUPS

**A · `item108-mock-retrieval.html`** — **the gesture, and the one that must be earned.** From a
page mid-sentence: Counsel → `#character` → a result → **the card opens over the page**. Live.
**B · `item108-mock-board-filter.html`** — **the fork**, both candidates at one scale: hold
versus reflow, on a populated board, so Q-1 is ruled on the paper.
**~~C · `item108-mock-card-tags.html`~~ — SKIPPED on Nick's word (*“Skip it”*).** Its subject,
tagging in the opened card, is superseded by **the tag controls** (`tag-controls-pass.md`).

**A FOUNDER SITTING IS OWED before any of this is called done.** Every surface here is
meaning-carrying — *the tags present are the right tags; the filter hid nothing it should have
kept; the results are the writer's own words.* **A suite certifies behaviour; a sitting
certifies meaning**, and 131(a) passed 33 checks with the wrong members in the list.

**Nothing locks.** — the PLAN desk
