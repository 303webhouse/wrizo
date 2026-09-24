# PW — RESTART NOTE

Written 2026-09-23, at Fable's instruction, after item 176's fourth pair reported.
Status at write time: **nothing running.** No browser, no suite, no granted box turn.

---

## 1 · ROLE

**PW is a BUILD lane.** I build to a written brief, in the briefed order, and I stop where
the brief says stop. I do not design, I do not widen scope, and I do not merge or deploy.

- **Fable** (design desk) rules on design and gives me my briefs and my rulings.
- **chat 1** (integration) merges my branches to main, issues box grants, and announces turns.
- **Nick** (founder) is the only word that ships, and the only word on anything he has
  reserved to himself.

What I produce: a branch pushed to origin, a stamped suite pair, an offer record, and a
ledger entry. **The main merge is never my act.**

---

## 2 · THE BOX (read this before touching anything)

> **A WORKTREE ISOLATES FILES, NOT THE BOX. One machine, one browser pool: a run from ANY
> tree is a run on the box.**

- **Box turns come by announcement. Never infer your turn from quiet.**
- **An instruction is not a grant; the file is the announcement.** A relayed token is checked
  against `C:\Users\nickh\.wrizo\box-turn.json` — never trusted for merely being present.
  The file outranks the relay's description of itself. Twice this arc a relay said "same
  token" or "a grant was written" when the file said otherwise; refusing was correct both
  times, and Fable confirmed the refusal.
- **Pre-flight zero or stop.** · **Push at pair start.** · **One harness is a run.**
- **Quiet during a stamping pair** — a build is a run.
- Verify with `node apps/desktop/scripts/box-turn.mjs show` and a `checkGrant()` dry-run.

---

## 3 · WORKTREES AND BRANCHES

All under `C:\Users\nickh\writer-studio\.claude\worktrees\`.

| Worktree | Branch | SHA | State |
|---|---|---|---|
| `pw1-boards-connected` | `pw1-boards-connected` | `57a0878` | **MERGED** to origin/main |
| `pw1-errata` | `pw1-errata` | `2426dd0` | **MERGED** to origin/main |
| `pw1-records` | `pw1-records` | `826f7ef` | records only |
| `pw2-nesting-transfer` | `pw2-nesting-transfer` | `d226e09` | **on origin, NOT merged** — offered |
| `item176-picker` | `item176-picker-says-board` | `292f661` | **on origin, NOT merged** — 4 reds |
| `exp1-connect` | `exp1-connect-text` | `fc8de60` | S0 only, **nothing committed, not on origin** |

`origin/main` at write time: **`1459c2a`**.

> A new worktree needs `pnpm install` before it can run a suite — `run-suite.mjs` refuses at
> its pre-run rebuild ("vite is not recognized"). Install and verify `build:web`
> **browserlessly, before** the box turn, or the discovery costs the slot.

---

## 4 · EVERY ITEM, WITH SHA AND STATE

### PW1 "Boards Connected" — `57a0878` — **DONE, merged**
Offer record: `docs/wrizo-alpha/pw1-boards-connected-offer-2026-09-08.md`.
Storage home ruled by Nick: `onCanvas?: boolean` riding the board's `boxes` jsonb, zero
schema. **ABSENCE MEANS DISPLAYED.**

### PW1 errata (item 131) — `2426dd0` — **DONE, merged**
Offer record: `docs/wrizo-alpha/pw1-errata-offer-2026-09-11.md`. Three founder-confirmed
errata: condition-boards excluded from both "Boards connected" and the Structure lens (via
the named reader `getBoardsConnecting`, not per-call-site filters); the false no-project lead
sentence removed; the crumb no longer truncates the location phrase into a false sentence.

### PW2 nesting + transfer (items 128 + 123 + 134 rider) — `d226e09` — **OFFERED, awaiting merge**
Offer record: `docs/wrizo-alpha/pw2-nesting-transfer-offer-2026-09-17.md`, including §6b's
stated known limit. Harness `pw2.mjs`, 24 checks.
Guard order in `pinPageToBoard` (order is load-bearing):
1. source exists (positive form of item 134 rider a)
2. not self
3. source is not a system kind
4. target exists and is a board
5. target is not a system kind
6. `wouldNestCycle` — **on every write**

`copyCardToBoard` uses a **whitelist, not a strip-list** — "a copy carries nothing by
default" — plus `copiedFromBoardId`. The spread-and-strip version leaked `sourceEntryId`
through a ported card and gave the copy a double-click that travelled.

### Item 176 — "a board in a candidate list SAYS it is a board" — `292f661` — **FOUR REDS, route to be redesigned**
Product side is **built and believed correct**: `ExistingPagePicker` rows now carry a kind
swatch plus a `wz-kindtag` word on board rows only (horizontal swatch = board, vertical =
page, Nick's own law reused). Scope held: the door's NAME is untouched — **PLAN DESK owns
the new door under item 144.**

**The harness cannot reach the door, and the reason is a product defect — see §7.**
Standing order now in force: *"A fourth red: stop patching the fixture and redesign the
check's route."* **Do not touch `item176.mjs` again.** The route is chat 1's and Fable's.

### Item 163 — the Boards Connected row's second line takes the caption form "in \<drawer\>"
**QUEUED**, widened to `boardDrawerLine` on the canvas board-card. Behind Experiment 1.

### Item 138 — RESIZE-ONLY + constrain-forward
**QUEUED**, last. Definition work done and ruled by Nick. Still owed at build time: the
entry-kind exclusion + its harness check, and the type rider on the birth shape.

### Experiment 1, TEXT SIDE — `exp1-connect-text` @ `fc8de60` — **S0, hard stop**
Brief: `plan-exp1-connect`. **The S0 is a hard stop — send Fable the storage shape before
writing anything.** I sent the first shape report; Fable's review came back and is §8.

---

## 5 · WHAT I WAIT ON, AND FROM WHOM

1. **chat 1 / Fable — item 176's redesigned route.** Four reds; I am forbidden to patch the
   fixture again. I have handed up a complete causal account (§7). Nothing from me until
   they rule.
2. **chat 1 — the merge of `pw2-nesting-transfer` @ `d226e09`.** Offered, on origin.
3. **Fable — the answer to Experiment 1's revised shape report** (§8). The store writes no
   real link until that answer lands.
4. **chat 1 — a box grant** for any run at all. Announcement, then the file.
5. **Nick — the word on any deploy.** Ships are batched, one deploy per batch.

**Gate (c) for Experiment 1, both halves:**
- Half 1 — **MET.** Nick's yes on the links column is on main, verbatim, at `a089bd2`
  ("Records: Nick's yes on the links column (verbatim)…").
- Half 2 — Fable's answer to my revised shape report. **Not yet met.**

---

## 6 · RULINGS I WORK UNDER

**Design / product**
- The three-space canon: surfaces / containers / displays. Shelf, Trash and Journal boards
  are **displays of a CONDITION, not places** — so they are excluded from "Boards connected"
  and from the Structure lens.
- `onCanvas?: boolean`, **absence means displayed**. Additive-optional `Box` fields ride the
  board's `boxes` jsonb — zero schema.
- A copy carries nothing by default: **whitelist, never strip-list.**
- Constrain-forward; RESIZE-ONLY is the definition of "touched" (item 138).
- Two sections and two thumbnail shapes, Nick verbatim: *"Yes, group them together but
  section off Boards from Pages clearly and use a different thumbnail (horizontal rectangles
  for Boards, vertical rectangles for Pages)."*
- **Do NOT widen into item 144's redesign.** PLAN DESK owns the new door.

**Experiment 1 — ruled**
- **The spelling is `page_links` (JS `pageLinks`)**, superseding the brief's `connections`.
  `store/anchors.ts` keeps its name. Links = anchors = `page_links`.
- Server half: **APPROVED** as reported, under the new name.
- **Match on the words as the writer sees them, markers stripped**; map back to raw offsets
  only to paint.
- **Nothing writes during a read.** `resolveAnchors` is pure.
- A link change is a page change.
- Per-item `updatedAt`/`deletedAt`: **state as a known limit in the offer, not guarded.**
- **EXP1-Q5 — YES**: links may overlap, and the rail lists everything covering a spot.
- **EXP1-Q6 — YES**: a spot-note shows a margin tick beside its paragraph.
  (Both were **ruled by Nick, not taken by silence** — on main, `b3fdeff`. They match the
  defaults Fable told me to build to, so no built work changes.)

**Craft laws earned the hard way (these are why the work is trustworthy)**
- **Sweep for what a change DOES, not what it renames** — and **re-sweep when the slice
  grows.** PW2's S0 swept S1 only; S2/S3 then broke three of my own PW1 checks.
- **A check built on a proxy dies the day the proxy and the rule part ways — assert the
  rule.** (`hasMenu === isMember` was a proxy; the successor opens each menu and counts.)
- **Select by name or attribute, never by index.** An index doesn't go red when the order
  changes — it goes **green about something else.** Audit inherited helper blocks: pw1's
  carried the index pattern into pw2.
- **A handle is the name the code uses, not the word the writer reads.**
- **Park verbatim, never edit**, with a `pok()` successor — and **audit the park count by
  execution, not by roster.**
- **A red check is not automatically a check to retire.** `item9192` went red and was
  **RIGHT** — the build had made the board's own "New page card" invisible. The fix belonged
  in the product (`opts?.display`), not the harness.
- **Bundle identity attributes a red.** Identical bundle bytes between a red leg and a green
  one prove the difference is environmental, not the product.
- **Both legs always run** (`;`, never `&&`) — they measure different populations.
- **A record that names the wrong tree certifies nothing.** Check the SHA in the preamble
  against the stamp before publishing.
- **Every commit the pair will certify must reach origin before the pair runs.**
- **An order-dependent read is a hidden input.**
- **A stale comment that contradicts the current code is an instruction to undo the fix.**
- **Special content (backticks, backslashes) goes through a FILE, never a shell.** This is
  why this note was written with a file tool.

---

## 7 · ITEM 176, PAIR 4 — THE FULL FINDING (hand this to whoever redesigns the route)

**Pair 4, tree `292f661`, bundle `index-wknxJPfU.js/586986b`** — `292f661` confirmed on
origin as `origin/item176-picker-says-board`.

- Default leg: `NOT CLEAN` — 90/92. `item176.mjs` FAIL 4/5; `item84.mjs` TIMEOUT.
- Parked leg: `NOT CLEAN` — 90/92. `item176.mjs` FAIL; `e1.mjs` FAIL 4/44.

### 7a · The 176 failure is a PRODUCT defect, not the fixture

My own wake-chrome explanation was **wrong, and the diagnostic overturned it**:

```
{"count":1,"rect":{"x":69,"y":137,"w":16,"h":34},"receded":"false","pe":"auto","vw":1280}
```

One grip, real rect, chrome **not** receded, pointer-events **auto**. The refusal is
measured, not inferred: `{"found":false,"why":"occluded","by":"wz-strip-item"}`.

**Why the z-indexes lie.** The grip is `z-index:2`; the strip is `z-index:1`. The grip
should win. It does not, because `.desk-frame-stage` carries **`isolation:isolate`**
(`apps/desktop/src/index.css:2792`). That seals a stacking context: the sliver anchor's
`z-index:5` and the grip's `z-index:2` are trapped **inside** it at the stage's own `auto`
level, while `.desk-frame-strip` is `position:absolute; z-index:1` and a **sibling of
`.desk-frame-stagecol`**. The strip therefore paints above the entire stage subtree.
**No z-index inside the stage can ever outrank it — the two numbers were never being
compared.**

**Why the grip sits so far left (the detail I had flagged unexplained).**
`.desk-frame-sliver-anchor--board` (`index.css:3134`) sets `--sliver-paper-pad: 0px`, where
the base rule borrows `.mode-page`'s `38px`. That collapses `--sliver-overflow` to zero and
pulls the anchor — and its right-anchored grip — hard left, onto the stage's own left edge.

```
grip   x 69 .. 85    (measured)
strip  x  0 .. 84    (left:-38.4px + --strip-width:84px)
→ 15 of 16px occluded; only the rightmost ~1px is reachable
```

**Consequence.** A real pointer resolves exactly as `elementFromPoint` does. On a board at
1280, **the sliver grip cannot be pressed** — it is painted under the strip and hit-tests to
it. This is **item 130's own class of defect, introduced by item 130's z-index fix**, and
invisible to every existing harness because they all reach the sliver with `.click()`, which
bypasses hit-testing. **Item 151's point-scanning driver is the first instrument that could
see it.** (Fable has already said the `item9192` finding of this kind becomes its own item
for TOOLS.)

**Scope, honestly bounded:** the **board** is measured. Prose and screenplay carry
`--sliver-paper-pad: 38px` and a smaller paper-half, which should push their anchors well
clear — **but I have not measured them and do not claim it.**

### 7b · The two non-176 entries, attributed

- **`item84.mjs` TIMEOUT (default only).** Its default log is **0 bytes** — it produced
  nothing. The **parked leg passed 57 checks on the identical bundle**. By bundle identity
  this is **environmental**, the same class as pair 1's `fx5`/`item83e` timeouts. Standing
  order: **report, do not re-run.**
- **`e1.mjs` FAIL 4/44 (parked only), PASS 41 in default, identical bundle.** All four
  failures are OFFLINE download checks, and the details name the cause outright:

  ```
  ["Bad Name (l-name).md.crdownload", "Ink Alongside Text (k-page).md",
   "Same Title (alpha6).md", "Same Title (beta66).md"]
  others: "[]"  /  {"aBytes":"","bBytes":""}  /  ""
  ```

  `.crdownload` is Chromium's **in-progress download** temp file, and the empty-list and
  empty-bytes details are the same race caught earlier. **e1's OFFLINE checks read the
  downloads directory before Chromium has finished writing it.** Not the product — it is
  e1's fixture, and the fix is the existing law: **wait on observable state (no
  `.crdownload` present AND non-zero bytes), never on elapsed time.** Owner: the E1
  "words out" lane. **I did not touch it.**

---

## 8 · EXPERIMENT 1 — THIS REVIEW'S OPEN ITEMS (owed to Fable, no build)

A **short revised report** is owed **before the store writes any real link**, under the
ruled `page_links` / `pageLinks` spelling:

- **(a) Targets for every kind** — enumerate them.
- **(b) The coordinate space.** Ruled: match on the words **as the writer sees them, markers
  stripped**; map back to raw offsets only to paint.
- **(c) A spot-note's anchor** — define it.
- **(d) Nothing writes during a read**; `resolveAnchors` is pure. Confirm.
- **(e) A link change is a page change.** Confirm the mechanism.
- **(f) Per-item `updatedAt`/`deletedAt`** — **state in the offer as a known limit, not
  guarded.**
- **(g) THE CLIENT-BOUNDARY CENSUS — STARTED, FAR FROM COMPLETE.** Census **every** place the
  app rebuilds, copies, restores or serializes a page field by field, and say what each does
  with `pageLinks`. My first grep returned only two hits —
  `persistence.ts:897` (`pageSettings: getUserPageDefaults() ?? undefined`) and
  `CascadePanels.tsx:491` (`saveJournalEntry({ ...entry, pageSettings: merged, updatedAt })`)
  — which is **candidates, not a population.** Remember the law: *a syntactic census is
  candidates, not a population*, and *audit each site before a mechanical rewrite.*

**My flag, accepted by Fable:** carried forward — see the brief.

**Build order after the S0 clears:** land `store/anchors.ts`'s **function signatures first**;
paint layer takes the **Custom Highlight API measurement**; at offer, the **round-trip test**.

**The server precedent is already measured** (read, not guessed):
- `apps/server/src/sync.ts` — 24-column insert, last `page_settings` at `$24::jsonb`; params
  end `JSON.stringify(e.pageSettings ?? null)`; read mapper
  `pageSettings: r.page_settings ?? undefined`; guard
  `where journal_entries.user_id = excluded.user_id and excluded.updated_at > journal_entries.updated_at`.
- `apps/server/src/migrate.ts:168` —
  `alter table journal_entries add column if not exists page_settings jsonb`.
- **The server drops unknown entry fields SILENTLY, both ways** — which is the whole reason
  the column had to be asked for.

---

## 9 · BOOT ORDER FOR THE NEXT SESSION

1. **Read this note. Then read the ledger delta on `origin/main`** — `git fetch`, then read
   `docs/open-threads.md` for anything after `1459c2a`. Main moves under you, and a ruling
   **enters through the record**, not through a relay.
2. **Confirm nothing is running.** No browser, no suite. `box-turn.mjs show` — **do not
   assume a turn from quiet.**
3. **Report in** and ask chat 1 for the current order. Do not pick your own next item.
4. **Do not re-run item 176's pair.** Four reds; §7 is handed up; the route is theirs to
   redesign.
5. **Experiment 1 is the live work, and it is READING, not running** — the revised report in
   §8, especially the **(g) census**, which must be finished properly rather than from the
   two hits I have.
6. Then, in Fable's stated order: **item 176's redesign → item 163 → item 138.**
   Experiment 1's build sits **after 176 and 163, ahead of 138**, and **starts only when both
   halves of gate (c) are met.**
7. **Nothing merges or deploys by my hand.** Branch, pair, offer, record — then hand it up.
