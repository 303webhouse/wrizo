# FIX — RESTART NOTE
*Written 2026-09-23 at a clean stop. Nothing of mine was running when this was
saved. Supersedes any earlier copy of this file.*

---

## 1 · ROLE

**FIX is the build lane.** It takes founder-reported defects and ruled items,
proves what is actually wrong before changing anything, builds the fix, proves
the fix with a harness that can be made to fail, and offers the branch. It does
not merge to main, does not deploy, and does not rewrite origin refs — **chat 1
merges; Nick's word ships.**

**How FIX works, in the order it always goes:**

1. **S0 FIRST, always.** Read the live code before believing any brief. Report
   findings *before* building when the S0 changes the shape of the job.
2. **Build.** One subject, one branch, one offer.
3. **Write the check so it can FAIL.** Watch it red against the old code, then
   green. A check that has never failed is not evidence.
4. **Mutate, one per claim.** If deleting a guard leaves the suite green, the
   check is testing a different guard, not that one.
5. **A sitting when a person's eye is the instrument** — a harness that scrolls
   its target into view cannot see what a writer cannot reach.
6. **Offer in the house form**, with what is *not* done named in it.

---

## 2 · WORKTREE AND BOX

- **Worktree:** `C:\Users\nickh\writer-studio-fx17` — FIX builds here, never in
  the primary checkout `C:\Users\nickh\writer-studio` (that is another lane's
  deploy staging).
- **Repo:** `303webhouse/wrizo`. **Currently on branch** `item158-tab-indent`,
  tree clean.
- **THE BOX IS ONE MACHINE, ONE BROWSER POOL.** Turns come by **announcement
  from chat 1**, never from a quiet process table.
- **Item 140 — the grant is a FILE:** `C:\Users\nickh\.wrizo\box-turn.json`,
  holding `{lane, token, time}`. `withHarness` refuses unless `WS_BOX_TURN`
  **matches** it. Read the token from the file and export it; never print it.
  **At the time of writing the grant names `PW2`** (their 176 pair was live:
  16 browsers, 2 runners — theirs, not mine).
- **During a stamping pair the box stays quiet** — no builds, no installs.
- **Pre-flight must read 0 browsers / 0 runners.** If anything is live and the
  turn is yours, **stop and report** rather than waiting it out.

---

## 3 · EVERY ITEM, WITH SHA AND STATE

`origin/main` was **`fc8de60`** when this note was written.

| item | branch | SHA | state |
|---|---|---|---|
| **170** opening a page | `item170-open-a-page` | `c1cf8d0` | **MERGED into main.** Stamped 92/92 both legs at `41414e5`. Done. |
| **164** open-from-Plan → Outline | `item164-verdict` | `e050ed6` | **OFFERED, docs only.** Verdict: Q6 stickiness working, default correct, *not a bug*. Marked superseded by item 172. Awaiting chat 1's merge. |
| **159** card Styling dock | `item159-card-styling-dock` | `4911b83` | **BUILT, NOT RUN.** Needs a box turn: run `item159.mjs` (8 checks), falsify S1/S3 against the old code, then the pair. |
| **158** Tab indents | `item158-tab-indent` | `0a36a7b` | **BUILT, NOT RUN, ACCEPTED by Fable.** Needs a box turn: run `item158.mjs` (11 checks), falsify Tab-moves-focus against the old code, then the pair. |
| **160** Remove off the board | — | — | **NOT STARTED.** S0 done (below). Deliberately not begun, to stop cleanly. |
| **184** retire Convert to Screenplay | — | — | **NOT STARTED.** S0 done and fully ruled (below). |
| **136** stored `title` | — | — | **NOT STARTED.** S0 done and accepted. **STOPS for Nick's word on its column before anything is written.** |

Both 159 and 158 are **pushed**; nothing of FIX's exists only on local disk.
Each branch has exactly **1 own commit** over main (`git rev-list --count
origin/main..<branch>`).

---

## 4 · WHAT I WAIT ON, AND FROM WHOM

| waiting on | from | for |
|---|---|---|
| **A box turn** | **chat 1** | after PW's 176 pair: **159 first, then 158**, each with its falsification run against the old code, then its pair |
| **A box turn for 160** | **chat 1** | once its browserless half is built — tell chat 1 when it is ready |
| **Merge of 164, 159, 158, and 160/184 when offered** | **chat 1** | FIX never merges to main |
| **Nick's word on 136's column** | **Nick** (via Fable) | 136 stops before anything is written |
| **Nick's veto points on 170** | **Nick** | the three-row viewport reading, boards excluded from the list, and the noun heading "Open Pages" against S13's precedent — all recorded in 170's offer |

**Also outstanding, not mine to do:** two stale frames in
`C:\Users\nickh\Downloads` — `item170-1-your-pages-on-a-page.png` and
`item170-2-place-on-this-board.png` — predate the OPEN PAGES rename and were
file-locked when the current pair was written. **They should be deleted so
nobody approves the wrong frame.** Current frames:
`item170-1-open-pages-on-a-page.png`, `item170-2-open-pages-place-on-board.png`.

---

## 5 · RULINGS I WORK UNDER

### 160 — Remove off the board surface (ruled, ready to build)
- **Remove leaves the board surface entirely**; deletion becomes drag-to-trash
  and a right-click menu under **item 168**. 160 removes without replacing, and
  **leaves a named successor comment**.
- **WIDENED:** the action row must **never shift the board for ANY verb** —
  pick overlay or reserved height; **the harness asserts the board's rect is
  unchanged on selection.** *(This is a geometry claim: it must be MEASURED, so
  it is the part that waits for a browser.)*
- **INTERIM, ratified by Nick ("Interim is fine"):** **Remove lives in the
  card's own popup until 168 lands.** **Do not ship a build with no card
  deletion.**
- **Harness plan (b), ratified:** keep `removeSelected`, expose it on the
  existing `window.wrizoBoard` seam **wrapped in `durableSeam`** (it writes),
  and re-route the **seven driver sites** through it — `ab4:251`, `b1:356`,
  `b1:433`, `b2:336`, `b3:287`, `j4:270`. **Park only** `fx7:598`'s
  presence assertion, which is genuinely falsified.
- **S0 finding to carry:** the button is *not* what pushes the board down —
  **the ROW is** (`boardActionRow`, normal flow, `marginBottom:10`, rendered
  whenever any card is selected). Removing only the button leaves an empty row
  still shifting the board. The row also carries Ungroup, Edit copy, Restore and
  Pin to a Board.

### 184 — Retire Convert to Screenplay (ruled in full)
Nick: *"I think it's fine to expect a user to select into writing a screenplay
before they start one. If they want to 'convert' something they've already
written, they can always copy and paste it into a screenplay surface."*
- **Conversion retires ENTIRELY**, the non-empty clause included:
  `requestScreenplay`'s non-empty branch and its modal, `convertToProse` and its
  one-way warning, the Sliver's Structure row, and both lexicon terms
  (`draftConvertToScreenplay`, `draftConvertToProse`).
- **ORDER IS SAFETY:** the **New Page Screenplay door lands in the SAME COMMIT
  or before** — never after. There must be no build in which a loose screenplay
  cannot be made. The door is one line: `unbornHref({ structure: 'screenplay' })`
  — **item 104's birth path is already built and merely lacks a door** (no
  caller passes `structure: 'screenplay'` today).
- **Keep the `birthWith` path:** a blank, never-written page choosing Screenplay
  counts as choosing *before* starting.
- **Every existing converted page keeps working.** A converted page is
  `pageType:'script'` + `script` + the `text` shadow, and is
  **indistinguishable** from one born a screenplay — there is no "converted"
  marker. Retiring the *act* touches `ScriptEditor`, `scriptDoc.ts`,
  `scriptText.ts`, the field, and the server column **not at all**.
- **Harness: parks, not deletions.** `ab2.mjs` — two live label assertions
  ("Convert to Screenplay…", "Convert to Prose…") plus conversion used as a
  *driver* to reach the script surface (re-route to a born script page or park).
  `item83f.mjs` — E4's `actText` assertion and the framed-screenplay scope note.
  `item87.mjs` — **a stale comment: a correction, not a park.**
- **MEASURE THE STRUCTURE ZONE FIRST:** if the conversion row is the zone's only
  content on a prose page, removing it removes the zone — **report how many ab2
  assertions move with the zone before cutting.**

### 136 — stored `title` (S0 accepted; STOPS for Nick)
- `title?: string` on `JournalEntry`. **No migration:** the server uses
  **idempotent boot-time column adds** (`alter table journal_entries add column
  if not exists title text` — the tenth such line), not versioned files.
- **Sync: two server-side whitelists**, both must be edited or the field is
  silently dropped in both directions — `rowToJournalEntry`, the insert column
  list + placeholder, the `on conflict` set, and the params array. The client
  pushes whole records and needs nothing.
- **The null↔undefined fixed point is load-bearing:** SQL null → JS `undefined`,
  never `null`, never `''` — it is what keeps an untitled page byte-identical.
- **Discard rule (Fable-level, flagged for Nick):** an empty commit **unsets**
  title and the stand-in returns; whitespace-only trims to empty and inherits
  it; the stand-in is `boardName()` generalised — **one function, pages and
  boards, first non-empty line trimmed at 60**.
- **State one known limit rather than guarding it:** a pre-136 tab pushing a
  record after the deploy **nulls its title**.
- **Item 172** adds a board TYPE field (Default | Book | Bibliography). If
  136's S0 says it is a column, it **rides 136's migration wave as a second
  add-column — one schema batch**.
- **OWED PARK at 136's landing:** `item133.mjs`'s S4 checks — the title editor
  supersedes 133's caret-to-first-line gesture.

### Standing laws (earned, not inherited)
- **Push the branch when the pair BEGINS**, not when it ends — a turn that puts
  nothing on origin reads as a turn never taken.
- **One subject, one branch, one offer.** Never build on an already-merged
  branch. Test it with `git rev-list --count origin/main..HEAD`: **0** means no
  unmerged work of its own (reset to main and build); **>0** means genuine work.
  *Do not use `merge-base --is-ancestor` — it false-refuses a fresh branch.*
- **A red halts, even when it is not yours.** Diagnose and attribute; never
  re-roll. **Bundle identity is the attribution's spine** — identical
  `bundle=<asset>/<bytes>` between a red run and a green control proves the
  difference is environmental, not the product.
- **Stamp the MERGED tree.** Fetch, merge current `origin/main`, then pair.
- **Both legs always run** (`;`, never `&&`) — they measure different
  populations.
- **A probe reads the SETTLED state** — after the flush, after the transition,
  after the bundle has evaluated.
- **Real pointer events always.** A page-side `.click()` sails through chrome
  the product has made `pointer-events:none`; a real pointer cannot. Move the
  mouse first, as a writer does.
- **Select by NAME, never by index** (`data-category="page"`, `data-box-id`).
- **Harness assertions: PARK, never edit.** Keep the original verbatim, mark it
  SUPERSEDED, name the successor.
- **Seed through the seam** (`window.wrizoCreateJournalPage`), never raw
  `localStorage`. **`updatedAt` is not seedable** — drive a real edit instead.
- **Special content goes through a FILE** written with a file tool. A shell
  heredoc collapses `\\n` and eats backticks — it bit three times in one
  session, once silently.
- **Mutation-test only committed work**, assert the mutation LANDED, and
  **restore with `git checkout -- <file>`**, never by writing back a text-mode
  read (it rewrites line endings and dirties the tree).
- **Never count from a view you cut.** Count programmatically over the full
  enumeration.

---

## 6 · BOOT ORDER

1. **Read this file.** Then `cd C:\Users\nickh\writer-studio-fx17` and confirm:
   `git rev-parse --show-toplevel`, `git status --porcelain` (expect clean),
   `git fetch origin`, `git rev-parse --short origin/main`.
2. **Check what is live before anything else:** harness browsers and
   run-suite/harness node processes, and the grant file's `lane`. **If the grant
   is not FIX, the box is not yours** — build browserlessly only.
3. **Re-check each branch's own-commit count** against the table in §3; main
   moves constantly, and items may have merged since.
4. **Then, in order: 159 → 158** (each: falsification run against the old code,
   then the pair, then the offer) **→ 160** (browserless half now; geometry when
   a browser is available; tell chat 1 when ready) **→ 184** (door in the same
   commit or before) **→ 136** (stops for Nick's word on its column).
5. **Report to Fable**, in the house form, with what is not done named in it.

**Ask chat 1 for the turn; never take it from a quiet process table.**
