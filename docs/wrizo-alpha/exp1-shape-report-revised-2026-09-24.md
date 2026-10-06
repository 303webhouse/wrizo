# EXPERIMENT 1 — THE REVISED SHAPE REPORT, (a)–(g)
### PW build lane · 2026-09-24 · owed to Fable before the store writes any real link

**TREE:** `exp1-connect-text` @ `4b5ec47`, on origin. **BASE:** `origin/main` @ `bf6c63d`.
**WORKTREE:** `.claude/worktrees/exp1-connect`. **NOTHING RUN ON THE BOX FOR THIS REPORT** — it is
reading, plus one browserless `tsc`.

**BUILT AND PUSHED ALREADY (Fable's order: "the server half is approved — write it now"):**
`f0ef92d` the six sites; `4b5ec47` a correction to my own comments, described in (f) and §X below.

**SPELLING, THROUGHOUT:** the column is **`page_links`**, JS **`pageLinks`** (Fable's ruling,
superseding the brief's `connections`). Links = anchors = `page_links`.

**DRIFT-CHECKED AGAINST DISK, NOT AGAINST MY RESTART NOTE.** Where the brief and my note disagreed,
the brief won — and it did disagree; see §X. `store/anchors.ts` **does not exist yet** (confirmed, not
assumed).

---

## (a) TARGETS FOR EVERY KIND — ENUMERATED

`Link.kind` is **`'source' | 'note' | 'card'`** (brief §2). Enumerated against what the code can
actually reach today:

| kind | fields that carry the target | what it resolves to | verified |
|---|---|---|---|
| `source` | `targetEntryId` | a **page** or a **board** — both are `journal_entries` rows; a board is an entry with `pageType: 'board'` | `getJournalEntry(id)` reaches both |
| `card` | `targetEntryId` **+** `targetBoxId` | a **Box** inside that board's `boxes` jsonb | `Box` rides `boxes`; `copyCardToBoard` already addresses a box by `(boardId, boxId)` |
| `note` | **no target**; `body` carries the note's own words | nothing outside the page | `body?: string` in the model |

A **chapter** needs no new field: `appendToChapter` (`persistence.ts:1693`) shows a chapter is itself a
journal entry, so it is reached by `targetEntryId` like any page.

**THREE GAPS I AM NOT FILLING BY MYSELF — they are enumeration questions, and enumeration is design:**

1. **A SOURCE THAT IS NOT IN THE APP HAS NO REPRESENTATION.** Nick's rail words are *"The external
   sources should be listed…"*, and his double-click list is *"if a card, the card popup. If a page, a
   full-sized, scrollable page, **etc.**"* The model has **no field** for a book, a URL or a citation
   that is not an entry — `body` exists only for `kind: 'note'`. Either "external" means *external to
   this page* (in which case the table above is complete and the word is safe), or a fourth target
   species is owed. **I read it as the former and did not build for the latter.** The "etc." is the
   part I cannot resolve from the text.
2. **`targetEntryId` CANNOT NAME A PROJECT, A DRAWER, A STORY PLAN OR A PLAN BEAT.** Item 191's right
   rail names *"sources, plans, resources, related chapters/boards/cards"* — **"plans"** is not a
   journal entry. Chapters, boards and cards are covered; plans are not.
3. **THE RAIL SORTS BY `kind` AND `tag`, AND NEITHER IS ON THE LINK.** Resting state is sortable by
   **recency · kind · tag**, and the grouping law means *a source appears under every tag it carries*.
   Recency is on the link (`createdAt`/`updatedAt`) and kind is `Link.kind`, but **tags belong to the
   TARGET**, so the rail must read the target's tags — an entry's `tags`, or a Box's. **That is a read,
   not a stored field**, and it is the reverse-question cost §2 already priced. Naming it so nobody
   denormalises tags onto the link.

---

## (b) THE COORDINATE SPACE — RULED, CONFIRMED, AND THE PIECE THAT DOES NOT EXIST

**The ruling:** match on the words **as the writer sees them, markers stripped**; map back to raw
offsets **only to paint**. **Confirmed as the right split** — the writer selected what they could see,
so the anchor's truth must be in seen-text coordinates, or a `**bold**` added later silently moves
every anchor after it.

**⚠ THE MAPPING DOES NOT EXIST, AND THE OBVIOUS REUSE CANNOT PROVIDE IT.**
`stripMarkdownConventions` (`store/draftFormat.ts:355`) **returns a string and nothing else.** It is a
chain of `String.replace` calls — per-line prefix strips (`^#{1,2}\s+`, `^>< |^>> `, `^> `, `^- `,
`^\t+`) then inline pair strips (`**`, `__`, `*`). **Positions are discarded.** So:

- **Matching** can use it as-is (string in, string out).
- **Painting cannot.** Painting needs `stripped offset → raw offset`, which means a **second,
  position-preserving stripper that emits both the stripped text and an index map.**
- **⛔ THE HAZARD, NAMED: TWO STRIPPERS THAT DISAGREE PUT THE TINT ON THE WRONG WORDS.** The order of
  those replaces is already load-bearing and documented as such (alignment before block-quote, longer
  mark before shorter). A parallel implementation that drifts by one rule mis-paints silently.
  **My recommendation: ONE position-preserving function, and `stripMarkdownConventions` becomes a
  wrapper that returns only its text** — so there is exactly one definition of "what the writer sees"
  and it cannot drift. That is the `getBoardsConnecting` lesson from PW1's own errata: **one named
  reader, never the same rule re-expressed at each call site.**

**AND THE SAME PROBLEM FOR `paraIndex`.** §1 rule 1 scopes a span within a paragraph, but **the model
has no paragraphs.** The canonical definition is `draftFormat.ts:145` — *"a paragraph is a run of
consecutive NON-BLANK lines"* — and it is **implemented inside that module and never exported.** If
anchors re-implement it, indent and anchoring will disagree about where a paragraph ends. **Owed: an
exported paragraph enumerator, reused by both.**

---

## (c) A SPOT-NOTE'S ANCHOR — DEFINED, AND ITS ONE REAL PROBLEM

A spot-note is a note taken **at a caret**, with **no selected words**. Ruled: it gets **a gutter tick
beside its paragraph** (EXP1-Q6, yes, Nick's own ruling), and **§6b forbids putting a character in the
text** to stand for it.

**⛔ AN EMPTY `quote` BREAKS §1b's RE-FINDING ORDER OUTRIGHT — this is the finding of this section.**
Steps 1–4 all key on `quote`. With `quote: ''`:
- step 1 "the exact quote at its recorded offset" — trivially true **at every offset**;
- step 4 "`quote` alone, **exactly one match**" — an empty string matches at every position, so the
  count is `length + 1`, never 1;
- step 5 therefore fires and **every spot-note is marked AMBIGUOUS the first time it is read.**

So a spot-note **cannot** share the span anchor's identity. **My definition, offered as a lean:**

> A spot-note's anchor carries **`quote: ''`** and is re-found by **its PARAGRAPH's identity, not its
> own**: `prefix` = up to 48 chars **before the caret within the paragraph**, `suffix` = up to 48 chars
> **after**. The match predicate is **`prefix` immediately followed by `suffix`** (nothing between),
> which is exactly §1b step 2 with an empty middle. `startHint` stays the caret's offset in the
> paragraph — a hint, never the truth. Steps 3 and 4 are **skipped** for a spot-note (a paragraph
> fingerprint is not meaningful "anywhere on the page"), so the order is **2 → 6**: found, or **LOST,
> kept and marked**, with its link still opening its target (§1 rule 4).

**THE RIVAL, IN ITS STRONGEST FORM, because it may be the better ruling:** anchor the spot-note to the
**whole paragraph's text** as the `quote` (a paragraph note, not a caret note). That is strictly more
robust to editing *inside* the paragraph — my prefix/suffix version goes LOST as soon as the writer
edits the words on either side of the caret, which for a note taken mid-draft may be often. **Its cost
is that the tick stops meaning "here" and starts meaning "this paragraph", and two notes taken at
different carets in one paragraph become indistinguishable.** Nick asked for a note at a spot; I am
building the spot reading. **But the fragility is real and unmeasured, and it is mine, not the
rival's — I have not measured how often a caret's surroundings survive a drafting session.**

**Either way, one thing is not a choice:** a spot-note must be **excluded from the ambiguity path**, or
it reports a false problem to the writer on every read.

---

## (d) NOTHING WRITES DURING A READ — CONFIRMED

**Confirmed, and it is already true on the server half as built:** `rowToJournalEntry` hands
`r.page_links` straight back and **resolves no anchor**. There is no server-side re-finding at all.

**Client side, `resolveAnchors` will be pure** — signature first, per the build order:

```ts
resolveAnchors(text: string, anchors: Anchor[]): ResolvedAnchor[]   // no writes, no store access
```

It takes text and anchors and returns resolutions. It **does not** take the store, **does not** call
`saveJournalEntry`, and **does not** mutate its input.

**THE ONE PLACE A WRITE-BACK IS GENUINELY WANTED, AND HOW IT STAYS LAWFUL.** §1b says a `moved` anchor
has *"hints updated"* — which is a write. It must **not** happen inside the read. **It rides an
ordinary page save**: the resolution is computed pure, the updated hints are held in memory, and they
reach storage only when something else already saves the page. **Consequence, stated rather than
hidden: until that next save, a moved anchor is re-found again on every read** — correct every time,
merely recomputed. That is the honest cost of purity, and it is cheap.

---

## (e) A LINK CHANGE IS A PAGE CHANGE — THE MECHANISM, CONFIRMED

Confirmed, and the mechanism needs **no new machinery** — which I verified rather than assumed:

1. A link edit calls **`saveJournalEntry(entry)`** like any other page edit.
2. `saveJournalEntry` → **`upsert('journalEntries', …, clone(entry))`** (`persistence.ts:720`) — the
   **only** write into the journal cache.
3. `upsert` sets **`record.updatedAt = now`**, replaces the record, **adds the id to `dirty`**, and
   schedules a flush. So a link change bumps the page's clock and marks the page unsynced, by
   construction.
4. The push sends whole records (`getDirtyRecords` → `clone`), the server's guard is
   `excluded.updated_at > journal_entries.updated_at`, and `page_links = excluded.page_links` rides it.

**Also confirmed, and worth having in writing: `stampPageActivity` fires for a link change on a filed
page** (`saveJournalEntry`'s own tail, `if (entry.projectId)`). A link is therefore page *activity* and
moves the project's resume pointer. **I believe that is correct — connecting a phrase is working on the
page — but it is a behaviour nobody has ruled, so it is named here rather than discovered later.**

---

## (f) PER-ITEM `updatedAt` / `deletedAt` — THE KNOWN LIMIT, STATED PRECISELY

**Ruled: state it in the offer, do not guard it.** Stated precisely, because I first wrote it down
backwards and the wrong version is worse than none:

- **The fields are PRESENT.** Every `Anchor` and every `Link` in the brief's model carries its own
  `createdAt`, `updatedAt` and optional `deletedAt`.
- **Nothing reads them.** Reconciliation happens at the **entry** level, on the entry's single
  `updated_at`, and `page_links` resolves **whole**.
- **So the limit is a missing MERGE, not a missing FIELD.** Two writers who edit **different** links on
  **one** page inside one sync window do not merge: the later `updated_at` replaces the entire column
  and the other writer's link is **gone, with no conflict reported**.
- **Soft-delete has the same shape:** a `deletedAt` on one link is just a value inside the column, so a
  concurrent edit elsewhere in the column can resurrect it.
- **Per-item reconciliation is exactly what Shape B's tables buy**, which is why the graduation ticket
  exists. At one writer per account — today's real case — the limit is unobservable.

---

## (g) THE CLIENT-BOUNDARY CENSUS — **AS A POPULATION**

My first pass was **two grep hits**, and I called it candidates. It was worse than that: **both hits
were safe**, so the grep had found no risk at all while looking like a census. Here is the population,
derived from the **mechanism** and read with the **TypeScript parser**.

### g.1 · THE MECHANISM THAT DECIDES EVERYTHING

```
saveJournalEntry(entry) -> upsert(...) -> collection[index] = record
```

**`upsert` REPLACES the stored record wholesale. It does not merge fields.** (`persistence.ts`, and it
is the **only** write into `cache.journalEntries` besides the sync pull.) Therefore:

> **THE ARGUMENT HANDED TO `saveJournalEntry` *IS* THE NEW PAGE. Any field the caller does not carry is
> GONE.** A caller that spreads (`{...entry, x}`) carries `pageLinks` for free. A caller that
> **enumerates** fields drops it silently.

So the population is not "places that mention a field" — it is **every call site of that one funnel.**

### g.2 · THE POPULATION: 50 CALL SITES, PARSED

| classification | count | verdict |
|---|---|---|
| **CARRIES** — argument spreads the entry | **33** | safe by construction |
| **DROPS** — object literal with no spread | **0** | — |
| **ENCLOSED** — argument is a variable/call, traced by hand | **17** | all safe; see below |
| **TOTAL** | **50** | across **8** files |

**ZERO sites drop a link.** Not by luck — by two house disciplines that were already in force:

- **Every "change one thing" site spreads:** `{...latest, text}`, `{...board, boxes}`,
  `{...entry, pageSettings, updatedAt}`, and 30 more.
- **Every "remove one field" site uses destructure-and-rest**, which carries the unknown remainder:
  `const { planBoardId: _drop, ...rest } = live` (`unpairPlanBoard`), the same in
  `getOrCreatePlanBoard`, and `const { deletedAt: _deletedAt, ...rest } = entry` (`restoreEntry`).
  **Written for `deletedAt`'s "absent, not merely falsy" grandfather rule, it protects `pageLinks` for
  free.**

**The 17 ENCLOSED, traced individually:** 10 are **births** (`createJournalPage`, `createBinderPage`,
`createBoardPage`, `createScriptPage`, `importDraft`, `createLoosePage`, `createLooseHomePage`,
`getOrCreateSystemBoard`, plus `HomeFlow.persistFirstEntry` and `QuickSprint.commitJournalEntry`) —
a page with no history **has no links to lose**, so naming no `pageLinks` is correct, not a leak.
3 are the **rest-destructures** above. 2 **mutate a fetched clone in place and save it whole**
(`setPageHome`, `softDeleteEntry`). 1 is a **newly minted board**. 1 is `unbornPage.birth()` — see g.4.

### g.3 · THE OTHER THREE PATHS, EACH VERIFIED WHOLE-OBJECT

The type's own comments promise byte-identity across **load / edit / save / sync**. Three of the four
are safe **by construction**, and I read each rather than trusting the comment:

- **LOAD** — `hydrate` = `JSON.parse(localStorage.getItem(key))`. Whole.
- **SAVE** — `flush` = `localStorage.setItem(key, JSON.stringify(cache[name]))`. Whole.
- **SYNC PUSH** — `getDirtyRecords` → `clone` (`JSON.parse(JSON.stringify(v))`) → `apiSync({push})`
  sends whole records. Whole.
- **SYNC PULL** — `applyCollection` does `collection[index] = clone(rec)`; **replacement, not a field
  merge.** Whole.

**EDIT is the only path where a field can be lost, and g.2 is that path enumerated.**

### g.4 · TWO REAL FINDINGS — the only places a link can actually go missing

**⚠ FINDING 1 — `BirthContent` IS A WHITELIST, SO A LINK MADE BEFORE BIRTH DIES AT BIRTH.**
`unbornPage.ts` `birth()` builds the row as `{...unbornEntry(...), ...overrides}` where the overrides
are drawn from **`BirthContent`, and only these five: `text`, `boxes`, `pageType`, `script`,
`strokes`.** The unborn entry itself is *"never serialized, never synced"* (its own comment).
**So: if a writer can select words on an unborn page and press *Note this*, that link exists only in
the unborn slot and is silently dropped the moment the page is born.**
This is a **design question, not a build decision**, and it is exactly the two-halves test: *"selecting
a phrase and pressing Note this requires no board, no project, no structure — the note exists because
the words do."* **An unborn page is the purest form of that claim.** Three readings, and I hold the
second:
1. Connect acts are **absent** on an unborn page (like the Tutor's composer, which refuses out loud under PB1).
2. **`pageLinks` joins `BirthContent`** and survives birth — additive, and it honours the pantser test.
3. A link **births the page** (a link is a first word). *I do not recommend this — it would let a page
   be born with nothing written on it, which is the exact fault PB1 exists to prevent.*

**⚠ FINDING 2 — EXPORT WILL OMIT LINKS SILENTLY, AGAINST THAT MODULE'S OWN STATED LAW.**
`store/pageExport.ts` only reads, so it **cannot lose a stored link** — but it is a *serialize* boundary
and (g) asks what it does with `pageLinks`. Today: **nothing, in silence.** That collides with the
module's own written rule, which it applies twice already:

> `INK_PLACEHOLDER` — *"The one honest placeholder for content this export cannot render as text —
> never silently dropped, always a named line in its place."*
> `UNKNOWN_KIND_PLACEHOLDER` — *"a future card species can never vanish silently from a
> claimed-complete export."*

**Links are page content this exporter cannot render as text.** By its own law they earn a named line,
not silence. **Owner is arguably E1 "words out", not me** — I have touched nothing there — but the
defect is created by *this* feature, so I am raising it rather than leaving it for the lane that did
not cause it. **Routing is Fable's.**

### g.5 · WHAT THIS CENSUS DOES NOT COVER — the honest bound

- **`apps/desktop/src` only.** The other app is `apps/server` (audited directly, being the work) — there
  is no third client.
- **The funnel census is exact** (parsed call sites of one named function). **The entry-shaped-literal
  census is not a population and I am not reporting it as one**: 83 literals, 24 enumerated, but the
  inclusion rule is a heuristic (≥3 known field names), so it is a **net for anything the funnel census
  would miss** — and it caught nothing the funnel census did not already cover.
- **Not run.** No harness, no browser, no box turn. The **round-trip test through the server double** is
  owed at offer, per the build order, and it is the only thing that can prove the six sites end to end.
  **`tsc --noEmit` clean is not that proof, and I am not offering it as such.**

---

## §X · WHERE MY OWN RESTART NOTE WAS WRONG — recorded, not quietly fixed

Caught by reading the brief while writing (a), **after** I had already committed and pushed. `4b5ec47`
is the correction; `f0ef92d`'s behaviour was right and unchanged.

1. I documented a **flat array** of links. The brief's shape is **one object with two arrays**,
   `{ anchors: Anchor[]; links: Link[] }`, joined by `Link.anchorId` — because **one anchor may carry
   several links** ("the source(s) linked", plural). A flat array cannot express that.
2. I gave `kind` as `'quote'|'claim'|'note'|'citation'`. **That is ITEM 193's vocabulary — a different
   arc item.** Experiment 1's is `'source'|'note'|'card'`.
3. I omitted `paraIndex`, `startHint` and **`status`** — which is the whole re-finding mechanism, and
   the one field §1b is *banded* about.
4. I stated (f) **backwards** — see (f).

**The lesson, in one line, because it is the same law I already hold and did not apply in time:**
*a map is research; disk wins* — **and the brief is disk.** I wrote a comment from my restart note and
verified it afterwards. The instrument also lied to me twice in this session and was corrected both
times rather than trusted: the counting script **failed on CRLF**, and the census scanner first counted
**a row shape written in a comment** and **a function body read as an object literal** — which is why
the final census is parsed, not grepped.

---

## WHAT I AM WAITING ON

1. **Fable's answer to this report** — the store writes no real link until it lands.
2. **(c)'s ruling** — spot-note anchor: my prefix/suffix lean, or the paragraph-quote rival. Either
   way, spot-notes must be excluded from the ambiguity path.
3. **(a)'s three enumeration gaps** — the "etc.", non-entry targets, and where the rail reads tags.
4. **g.4 finding 1** — unborn pages and `BirthContent`. I hold reading 2.
5. **g.4 finding 2** — routing the export placeholder.
6. **(b)'s owed pieces** — one position-preserving stripper, and an exported paragraph enumerator.
   Both are build work I can do on the word; neither is started.
7. **Chat 1 — the paint-layer measurement.** Said ready when (b) is ruled: **one** measurement serving
   **item 145 (the term highlight)** and Experiment 1. Box grant by announcement, never by quiet.
