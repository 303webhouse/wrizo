# Note for Nick — 2026-08-04 (fix lane)

Written to be read on a phone. Plain language; the formal records are in
`docs/open-threads.md`.

---

## Where the build stands

**Already merged and live-ready (earlier today):** both P0s from your sitting.

- **Offline writing no longer gets stranded.** This was the bad one. The list of
  "things not yet sent to the server" lived only in memory, so *any* reload
  before reconnecting made those pages permanently unsendable — not delayed,
  **unsendable**. They sat on your disk looking perfectly normal, because every
  list in Wrizo reads local storage; nothing asks the server what pages exist.
  That's why it was silent. Fixed, and the page you lost is confirmed sitting in
  the production database.
- **Filing a page can no longer orphan it.** A bad drawer id used to be written
  straight onto the page, making it invisible to everything including export.
  Now it's refused, and a refusal writes nothing.

**Ready to merge now, waiting on your word:** branch **`fw2-offer`**.

- **The board's "Page →" button** used to dump you on the Wrizo landing page.
  Now it opens a new page linked back to the board you came from.
- **"New Page Card" on a board** used to create a card that vanished. Fixed.

Both settings of the full test suite are clean on it. Chat 1 has the merge offer
and merges on those stamps.

**Built but NOT verified — do not ship yet:** item 87 (New Page opens in Draft;
typewriter off on a fresh page). The code is written and type-checks, but the
shared test machine was booked by the deploy, so **its tests have never run
once**. It sits on branch `fw2-boards-and-defaults` in its own commit, clearly
marked. It needs one test window before it's shippable.

---

## What I found that you may want to know about

**Three of your reported symptoms turned out to be something other than what the
notes said.** I've recorded each rather than quietly fixing past them:

1. The recovered page **did not** come back in the Journal list — it's a "loose"
   page, which that list excludes by design. It came back on the Shelf. The
   recovery was real; the description was wrong.
2. The "lying toast" when filing a blank page **wasn't lying** — it was doing
   something worse. It was silently creating an empty page through a side door,
   which is exactly the litter the "born on the first word" rule exists to
   prevent.
3. "Plan may have minted a second board" **wasn't** what made board cards
   disappear. The real cause was the board editor overwriting its own freshly
   made card. *But* a genuine second-board bug does exist, separately — see
   below.

**Two decisions are waiting on you** (I deliberately didn't make them):

- **Item 97 — trashed plan boards.** If you trash a plan board, the page's
  pointer to it dangles, and the next "Plan →" mints a *second* board. The fix is
  small, but the choice isn't mine: should trashing restore the old board, or
  mint a fresh one and forget the old pointer? Product call.
- **Item 87's shape**, if you disagree with how I read "New Page lands in Draft."
  I built it so the *door* declares which mode it opens, which leaves your
  existing rule (the Write button on the front screen opens Free Write) exactly
  as it was. If you actually wanted *every* loose page to open in Draft, say so
  and it's a different, larger change.

---

## Two process notes worth your time

**A near-miss with the deploy tooling is still live.** Running any Railway
command from a worktree resolves to **a different product's production system**
(`fabulous-essence`), because the link map is keyed by folder and the worktrees
aren't in it — so it walks up to your home directory and finds the wrong link.
Deploys must run from `c:\Users\nickh\writer-studio` only, checked first. That's
now item 98 and a standing law. Nothing in this wave touched Railway.

**A test-suite habit that costs everyone time:** killing a suite mid-run leaves
orphaned browsers behind, and the next run — *any* lane's — refuses to start.
Cheaper to let a doomed run finish. Recorded, with the safe cleanup recipe.

---

## If you want to pick this up while travelling

- **To ship the board fixes:** merge `fw2-offer` (not `fw2-boards-and-defaults` —
  they differ by item 87's unverified code). Stamps are in
  `docs/wrizo-alpha/fw2-merge-offer-to-chat1.md`.
- **To finish item 87:** it needs one test-machine window — a falsification run
  plus both suite settings. Everything is written and waiting.
- **Still untouched from your sitting:** item 79 (markdown markers visible while
  styling applies). Not started.

Nothing is half-committed and nothing is lost: every branch is pushed.
