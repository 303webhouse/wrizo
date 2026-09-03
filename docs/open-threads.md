# Open threads — the studio ledger · 2026-07-12

**Place at:** `docs/open-threads.md`. Update on close; anything that must
outlive a session lives here, not in chat.

## PRE-FLIGHT SITTING — 2026-08-02 (Nick, ranked) — the fix wave's input

Full ranked log: `docs/wrizo-alpha/sitting-log-2026-08-02.md` (ranks are Nick's word; laptop
17" then Desktop). Two P0s, six P1s, ten P2s. **New items opened this commit: 90–95.**

**P0 (loses work):**
- ~~**item 89 · S8 — offline pages/edits silently STRANDED.**~~ **FIXED — 2026-08-03 (fix
  lane). Mechanism of record is now item 89's own close-out below, not this summary.** The
  dirty set was memory-only (`persistence.ts:77`); because `getDirtyRecords()` filters the
  cache BY that set, a reload did not delay a push, it made the push impossible. It was
  SILENT because every list in the product reads the local cache — no surface asks the
  server what pages exist — so a stranded row looked identical to a synced one.
  **TWO CORRECTIONS to what this summary used to assert.** (1) The recovered page
  `mscqyn48uyxk6p37l` did NOT reappear in the Journal master list; it is `origin: 'loose'`,
  which `inJournalView` excludes by construction — its surfaces are the Shelf and the
  cascade's "Loose" group. The recovery is real and is now PROVEN server-side by a
  read-only production query; only the named surface was wrong. (2) The backfill
  (`sync.ts:62-73`) is KEPT, not retired — it covers rows wrongly marked CLEAN, a
  population persistent dirty cannot reach — but it is no longer anyone's recovery lever.
- ~~**item 88a · S5 — `setPageHome` accepts ANY string as binder id.**~~ **FIXED — 2026-08-03
  (fix lane), paired with 88b.** A bogus id orphaned a page from every enumerator including
  export; the target must now name a live binder, and a refusal writes nothing. **88b's
  recorded mechanism was FALSIFIED in the same pass** — filing an unborn page was never a
  no-op with a lying toast, it was a WRITE that birthed an empty page through a side door
  (`getJournalEntry` falls through to the unborn slot). See item 88's falsification note
  and the 88a+88b close-out below.

**P1 (wrong but survivable — fix before vacation):** S1/79 markdown markers visible ·
~~S3/87 New Page defaults~~ **BUILT 2026-08-03; VERIFIED + SHIPPED 2026-08-17 (the doorway
ship, with item 104). CORRECTION: this line said "FIXED" from 2026-08-03, which was WRONG for
13 days — the code was written but its harness had never run once, and the item's own entry
below said so while this summary did not. The lane that wrote both introduced the discrepancy;
it is corrected here rather than quietly overwritten.** As an AMENDMENT not a
flip: the door declares the room (`?mode=draft`), so CD1 S8/A7's front-door ruling stands
unreversed and Arrival's Write door is untouched. Clause 2 (hide presets in Free Write) DID
NOT REPRODUCE — already true — so it is asserted, not "fixed." Zero parks owed, each
candidate checked. See the item 87 close-out below.** · S4/88 panel affordance
illegible (filing targets read as a page list) · S6/88b `fileTo` toasts success unconditionally
· ~~S11/**91** board→Page rail lands on the Wrizo landing~~ + ~~S12/**92** New Page Card from a
board never appears on that board~~ **BOTH FIXED — 2026-08-03 (fix lane, wave 2), as ONE fix;
see the 91+92 close-out below.** 91 reproduced verbatim (`hash=#/` from the Journal board). 92's
erasure needs an unsaved edit inside the 2000ms autosave window — the S0's "fires on the very
navigate" was too strong, corrected append-style below. **"Plan may mint a second board" was NOT
this symptom** — but a real second-board path exists and is now **item 97**, held open (product
question: restore vs re-mint, Nick's call).

**P2 (polish — waits till back):** S2/86 page size (ruled post-vacation) · S7/88c binder
unidentifiable in Drawers · S9 shell won't reload offline (flight rule logged) · S10+S17/**90**
Trash overhaul (Untitled pin-cards, no dates, click opens nothing; Restore/Remove DO appear on
selection) · S13 cards-vs-pages distinction → menus arc (founder verdict) · S14/**94** rail
hover targets (apply BG2's 44px law) · S15/**95** export polish (derived-title duplication,
literal markers) · S16 legacy-shell whisper → menus arc notes (founder verdict).

**Items opened:** 90 (Trash overhaul) · 91 (board→Page routing) · 92 (board-card pairing flow)
· 93 (pairing MODEL — committee, post-vacation) · 94 (rail hit-targets) · 95 (export polish).
**S13 + S16 route to the menus arc as founder verdicts.** Registry: next free **96**. The
successor fix lane is being seeded.

## ITEM 96 — THE PLACES MODEL (charter — post-vacation committee pass)

**Founding text — Nick's sitting sentence, verbatim:** *"it's almost incomprehensible where
any of the documents/pages are stored."* **MANDATE: one comprehensible answer to "where is my
page," taught by the interface itself.** Item **93** (the pairing model) folds in as its FIRST
question; **88c** (binder rendering in Drawers) and **S13** (cards vs pages) route HERE
alongside the menus arc — seams coordinated through Nick. Post-vacation committee pass; no
build under the freeze. Registry: next free **97**.
**→ CHARTER PROVING ITSELF (live-test sitting #2, 2026-08-17):** the Screenplay door
(Draft → tool panel → Structure) was UNDISCOVERABLE from Free Write — Nick's session never
reached the script surface. The exact "where is my room, how do I get there" gap this item exists
to close, now with a live-test witness. See the LIVE-TEST SITTING #2 section above.

## FIX-WAVE MERGE + LEDGER BUNDLE — 2026-08-03 (item 89/88 fix merged; Fable)

**MERGED `da69332`** — the fix lane's `item89-persist-dirty` (four commits 8875343→3de9f28):
item 89 (P0, dirty set PERSISTED — offline writes were unsendable, not merely unsent), 88a
(P0, filing-target validation), 88b (P1, side-door birth killed), + the item88/item89
harnesses. Stamped PARKED suites both settings (53/53 then 54/54, identical bundle hash),
proven to bite pre-fix (8/14 + 5/10 red on pre-fix bundles). Zero schema, zero server. The fix
lane's own FIXED records + corrected mechanisms (item 89's recovery appeared in RECENT, not the
Journal master — `inJournalView` excludes loose by construction, recovery proven server-side by
read-only query; 88b's side-door falsification — filing an unborn page birthed litter via
`getJournalEntry`'s unborn-slot fall-through, bypassing `birth()`; the toast never lied) are
already on the ledger above; item 92 S0 PROVEN (`pinToBoardId` dead code) is recorded too.
**Fable's review follows same-day; DEPLOY is Nick's word** — these are the sitting's P0s, a
deploy under the amended checklist (rebuild-first, name SHA + asset hash; red-suite clause if
item 82's family still stands).
**→ REVIEWED, GREEN (2026-08-03), Fable** — `docs/wrizo-alpha/p0-wave-review-fable.md`; VERDICT
PASS; items **89, 88a, 88b GREEN** → **DEPLOYED 2026-08-03, git `c23c380` · railway `ee0a9bf2`**
(see the P0 WAVE DEPLOY MANIFEST below). The dirty registry journals to disk in the SAME synchronous
tick as its collection (they cannot disagree); boot restore self-heals the phantom-id trap the
fix could have introduced (S4); corrupt journal boots empty (S5); logout clears it (no
cross-account leak). 88a refusals write nothing; 88b's side-door birth killed by reading the
cache directly — PB1 ruling 2 preserved. **No parks owed** ("the absence is the finding"). OBS
(non-blocking, item-90 neighborhood): `'no-such-page'` conflates unborn with trashed — split
the toast when item 90 makes Trash items openable.

**item 87 → RECLASSIFIED.** Not a defect-flip: a REVERSAL of a ruled default (FX2 S2 seeds
typewriter ON). Owes a full pass WITH PARKED ASSERTIONS, not a one-line flip — the immutability
law governs a ruled default as it governs a check.
**→ WEIGHT TO ITS SHIP (live-test sitting #2, 2026-08-17):** the Screenplay door was
undiscoverable from a Free Write start; a Draft-default (this item) would have OPENED it — the
session would begin in the room the door lives in. See the LIVE-TEST SITTING #2 section above.
**Now also PACKAGES WITH item 104** (Screenplay selection dead on an unborn page): mode +
structure are one descriptor seam — item 87 verifies and ships WITH item 104, not separately.
**→ AMENDED BY FOUNDER — item 87 RECHARTERS as THE NEW PAGE CHOOSER (Nick, 2026-08-17).** Spec
verbatim (from Nick): *"Anywhere that a user can create a New Page, they should be given a toggled
set of options that reveal themselves when 'New Page' is clicked: Free Write, Draft, Journal, Add
to Board, Add to Drawer. If either 'Add to' options are selected, a pop-up should ask them which
Board or Drawer they want to add it to. If none exist or if they want to create a new Board or
Drawer for the New Page, they should have that option as well. When Free Write is selected, the
user goes to a standard page with Free Write mode enabled; when Draft is pre-selected, they go to
a standard page with Draft mode pre-selected."* **ROUTES to the menus arc as design work** — it is
chrome; the **unborn-descriptor machinery from fw2 is its engine** (each toggle maps to a
descriptor preset — mode / origin / binder / pin). **What ships from the OLD 87:** the
typewriter-off + presets-assertion residue ships in the doorway wave. **SUPERSEDED and held:** the
Draft-default piece (the RECLASSIFIED note above and the SITTING #2 "weight to its ship" framing)
is superseded by the Chooser — item 104's descriptor-carries-STRUCTURE stays the engine, but
mode/structure now arrive via the Chooser's presets, not a bare Draft-default.

**ITEM 97 OPENS — the trashed-plan-board dangling pointer.** A trashed plan board's pointer
dangles (the soft-deleted board reads as ABSENT), so the next PLAN→ flip RE-MINTS a second
board. New ticket, fix-class.
**→ RULED: RE-MINT (Nick, 2026-08-17).** PLAN→ on a page whose plan board is trashed MINTS a fresh
board and CLEARS the stale pointer; the trashed board stays manually recoverable via the Trash
overhaul (item 90). **Decision-complete; build queued in the doorway wave.**
**→ BUILT + MERGED with the doorway ship (merge `cf9180a`, 2026-08-17); re-mint ratified in code,
and the harness does NOT bite — that is the finding (see the ITEM 97 build section below). NAMED
RESIDUAL:** the **tombstone-arrival window** — closing it would require unpairing at apply-time,
which is **beyond this decision's authority**; **post-vacation class.** The re-mint decision stands
as ruled; the residual is named, not silently carried.

**ITEM 98 OPENS + STANDING GUARD (deploy-critical).** Railway commands run ONLY from the
correctly-linked PRIMARY CHECKOUT, `railway status`-verified first. **Worktrees are absent from
the path-keyed link map and resolve to project `fabulous-essence` / service `pandoras-box` — an
UNRELATED production system** (documented in the fix lane's records below). A `railway up` /
`redeploy` from a worktree would deploy against the wrong product. Remediation: add worktrees to
the link map OR guard the command. Until then: primary checkout only, status-verified. (Chat 1
has always deployed from the primary checkout `c:/Users/nickh/writer-studio`; this formalizes it
as law.) Registry: next free **99**.

**RATIFIED for the record (Fable):** the fix lane's SOLO-despite-ultracode restraint was
correct under standing law — parallel agents on one browser pool would trip the dirty-machine
refusal (`run-suite`'s fail-fast) and the cross-lane kill hazard (a by-name process kill murders
other lanes' in-flight runs). One browser pool, one runner at a time.

## ITEM 99 — THE ORPHAN REAPER (harness-infra; deploy-forensic) — OPENS 2026-08-03

**OPENS.** Crashed and killed harness runs have leaked headless browsers AND their node parents
since 2026-07-29. DF1.1's `run-suite.mjs` clears stale profile dirs at launch and kills its OWN
session's children on exit — but a run that dies ungracefully leaves DEAD-OWNER orphans:
browsers whose `ws-runtime-verify-<pid>` owner node is gone, that no later run will claim. They
accumulate until the preflight guard (rightly) can't see past them and REFUSES. **This blocked
the P0 deploy's suite of record** — two attempts VOIDed/REFUSED against 32–57 sustained foreign
harness browsers, owner node `50580` VERIFIED DEAD. **Remediation, post-vacation:** the runner's
preflight gains a DEAD-OWNER sweep under today's exact safety argument — kill only browsers whose
owner node PID is verified dead (dead owner = no live session, so the cross-lane kill law touches
nothing here), logged every run; it should also reap the stale profile DIRS of dead owners. Until
then the sweep is a manual, authorized, logged act. Fix-class. Registry: next free **100**.

**SWEEP LOG — 2026-08-03 (authorized by Fable; dead-owner browsers ONLY, logged, live nodes
untouched — three conditions).** Diagnosis window: 32–57 harness browsers sustained ~24 min,
owner node `50580` VERIFIED DEAD (`Get-Process` empty) — its browsers were orphans, not a live
lane. **Execution: 0 PIDs killed.** The `50580`-class orphan processes had already exited on
their own between diagnosis and execution: harness-browser count = 0 across three samples; total
browsers = 9, all Nick's real Chrome/Edge, left UNTOUCHED (condition 3). **54 stale
`ws-runtime-verify-*` profile DIRS remain on disk** — no live process; DF1.1's clear-before-launch
handles them at the next run; noted for the reaper's scope, out of the kill-authorization. The
authorized action was executed against an empty target set — the honest, reviewable record
(condition 2). The suite of record then ran CLEAN in the freed window at `aa07b9c`, bundle
`index-CThKwy6K.js/524897b`, both settings 54/54.

## SHIP 2 (fw2) — PARKED, NOT SHIPPED — 2026-08-04 (Nick's conditional word; condition 2)

Nick's word: merge `fw2-offer @ dad280e` (items 91+92, zero schema, pre-authorized) and deploy
under the amended checklist ONLY if the fix lane's parked re-run stamped GREEN both settings;
if the re-run is red or incomplete → no merge, the offer parks as-is, report. **The parked
re-run is INCOMPLETE.** Per the fix lane's own offer doc (`docs/wrizo-alpha/fw2-merge-offer-to-chat1.md`
@ `dad280e`): unparked **55/55 CLEAN** (`bundle=index-Cib2nzSw.js/525306b`, `tsc` clean), but
parked returned **one NOVERDICT (`j4.mjs`)** — a named *first-parked-act race* (`j4`'s parked
block calls `localStorage.clear()` before the initial `about:blank`→app load; pre-existing and
untouched by this diff; `j4` was green in the unparked run of the identical bundle minutes
earlier). The one-line fixture fix (navigate-first) is itself **UNRUN** — the box schedule closed
the window — so **the parked stamp is OWED, not claimed**; the fix lane explicitly does not ask
for a merge on a half-stamp. **DECISION: no merge, no deploy; `fw2-offer` stays on its branch,
parked as-is.** The RED-SUITE CLAUSE WAS NOT PRE-SPENT — no red of any identity was measured
here; the gate simply is not met (incomplete ≠ red). Item 87 was never in this package
(`fw2-offer` excludes it by construction; item 87 is built-not-verified on
`fw2-boards-and-defaults`, `DO NOT MERGE YET`). **Production stays git `c23c380` · railway
`ee0a9bf2`** (the P0 wave; rollback ratchet unchanged). Per Nick's word the box now passes to the
SC-chain (merge + PARK only; P2c is the first post-vacation ship); **ZERO further deploys of any
kind until Nick returns** (vacation handoff `docs/wrizo-alpha/vacation-handoff-2026-08-04.md`).

## SHIP 2 (fw2) — UNPARKED + MERGED, HELD FOR SHIP WORD — 2026-08-17 (Nick back)

Supersedes the PARK above. The fix lane completed the owed parked re-run: the offer doc's
**✅ STAMPS COMPLETE** section (`fw2-merge-offer-to-chat1.md` @ `e281b73`) now shows **unparked
55/55 CLEAN and parked 55/55 CLEAN** at `tree=dad280e bundle=index-Cib2nzSw.js/525306b` — the
`j4.mjs` NOVERDICT is CLEARED (`j4` passed parked on the re-run). Nick's post-vacation word:
*"fw2's completed offer → merge → hold for ship word."* **MERGED `a18115c`** (items 91+92 —
`BoardEditor.tsx`, `unbornPage.ts`; harnesses; records). Zero schema; item 87 remains absent
(`fw2-boards-and-defaults`, `DO NOT MERGE YET`). Ledger auto-merged clean, main-only sections
preserved, registry next free **100**. `tsc` ×2 EXIT 0 on the merged tree. **HELD — NOT
DEPLOYED.** Production stays git `c23c380` · railway `ee0a9bf2`. Deploy waits on Nick's
**explicit per-package ship word** (post-vacation posture: merges resume on pre-authorized
offers; deploys on Nick's explicit words only). When the ship word comes: suite of record at the
merge HEAD both settings + full amended checklist + rollback ratchets to the P0 stamp.

**→ SHIPPED 2026-08-17 on Nick's word "Ship 2":** DEPLOYED **git `fbdb27e` · railway
`0fdc8f94`** (suite of record 55/55 both settings at `bd4cdcb`, bundle `index-Cib2nzSw.js`
verified LIVE). See the SHIP 2 (fw2) DEPLOY MANIFEST below. Rollback now ratchets to this stamp;
the prior floor `c23c380` · `ee0a9bf2` is superseded as live.

## FW2 — FABLE'S RATIFICATIONS — 2026-08-17 (formal merge order @ `641e946`)

Landed with the formal merge `0dc6e75` (fw2-offer @ `641e946`): the fix lane's ADDENDUM proving
the 2026-08-04 stamps still hold — the merged tree rebuilds to `index-Cib2nzSw.js`/525306b,
**byte-identical** to the stamped bundle (the docs-only-carry precedent, `77(c)` making it
provable). Three records, append-only:

1. **The PARK is SUPERSEDED BY COMPLETION — both were right at their read-times.** The park
   (condition 2, "the parked stamp is OWED") was decided at `08:08:42`; the fix lane's completed
   re-run (unparked 55/55 CLEAN + parked 55/55 CLEAN, the `j4` NOVERDICT cleared) pushed at
   `08:29:41` — **21 minutes later**. Neither read was wrong: the park read a true incomplete
   stamp, the completion read a true green one. The ledger keeps both, in order — a park is not
   an error when its successor completes it.

2. **The S4 incident — the victim-side record, RATIFIED.** Stopping a suite mid-run orphans its
   harness browsers, and the dirty-machine guard then refuses EVERY lane's next run (item 99, the
   Orphan Reaper). When the fix lane's own run was compromised (a leg would hang to timeout and
   read a red it would then have to excuse), it chose to **ABANDON and re-run WHOLE rather than
   report a red it would have to explain away** — the abandon-don't-excuse decision. **Fable
   RATIFIES it:** a compromised run yields no usable stamp, so a clean re-run outranks an excused
   red. (Cheaper still, where possible: let a doomed run finish rather than stop it — see item 99.)

3. **Item 87 remains BUILT-UNVERIFIED on its own branch.** Not in this merge. Item 87 (New Page
   defaults) is complete and `tsc`-clean but has NO harness result — it stays on
   `fw2-boards-and-defaults` (`DO NOT MERGE YET`) until the fix lane runs its falsification plus
   both stamped suites and offers it on its own.

Ship 2 still HOLDS for Nick's explicit ship word; production stays git `c23c380` · railway
`ee0a9bf2`; the deploy runs its own fresh suite at the deploy HEAD per the amended checklist.

## ITEM 100 — THE CDP PORT-FILE RACE (harness-infra) — OPENS 2026-08-17

**OPENS on Fable's ruling, from the SC-chain lane's fix (b) verification.** A harness run can
die **before any check executes**, in ~2s, with
`EBUSY: resource busy or locked, open '…\ws-runtime-verify-<pid>\DevToolsActivePort'`.
**MECHANISM, read in the source rather than inferred:** `readCdpPort`
(`scripts/runtime-verify.mjs:281-289`) polls the port file in a 100-iteration loop, but the loop
body is `if (existsSync(portFile)) { readFileSync(...) }` with **no `try`/`catch`** — so a read
landing in the window where the browser has CREATED the file but still holds it **throws out of
the poll loop instead of polling again**. The retry machinery is already there; the exception
escapes it.
**IT IS A DIFFERENT SPECIES FROM DF1.1's, and conflating them would re-spend that diagnosis.**
DF1.1's stale-profile-dir root cause is a fresh process finding an **OLD** port file (dead port,
`pageWsUrl` then polls nothing — cured by `removeDir(udd)` before launch, which is present and
working). This is a **FRESH** dir whose file is **mid-write**. Same symptom class (dies before
app load, reads like contention), opposite cause, and it reproduces on a quiet box — this
sighting was on a machine verified quiet, with `removeDir` in the tree.
**CURE: one line** — wrap the read (or the loop body) so a failed read continues the poll rather
than throwing. **Deliberately NOT taken by the finding lane:** `runtime-verify.mjs` is shared
infra used by all 55 harnesses, and patching it *mid-verification* would have made that lane's
own stamped pair unfalsifiable — the exact defect 77(c) closed. **Left unfixed and unclaimed for
the harness floor's owner, post-verification**, per Fable's ruling.
**RARITY, measured not guessed:** 1 occurrence in 38 standalone `j5` runs plus four full sweeps
(≈220 harness launches) on 2026-08-17 — no recurrence after the first. Fix-class, harness-only,
zero product surface. Sibling of item 99 (both are harness-floor robustness); **not** a member of
item 82's family — it produces a *boot crash with a stack*, never a check verdict, so it cannot
be a hidden explanation for any of that item's reds. Registry: next free **101**.

## LIVE-TEST SITTING #2 (partial) — 2026-08-17 (Nick; relayed by Fable) — items 101–103 open

Full log: `docs/wrizo-alpha/sitting-log-2026-08-17.md`. **PARTIAL — Nick's session never reached
the script surface:** the **Screenplay door (Draft → tool panel → Structure) is UNDISCOVERABLE
from Free Write.** Logged two ways: as **item 96's charter (the Places Model) proving itself** —
the exact "where is my room" comprehension gap it exists to close — and as **weight to item 87's
ship**, because a Draft-default would have *opened the door* (the session would begin in the room
the Screenplay door lives in). **Section-A retest is OWED, via the Draft → Structure path.**
**→ IN PROGRESS (2026-08-17):** now running on the TRUE script surface (reachable via F5 after the
kind-switch, per item 104's diagnosis — the surface works; only the live remount is the defect).
**→ SECTION A COMPLETE (Nick, live, 2026-08-17 — the Clock's first founder session).** CONFIRMED:
block grammar · sheet sequence · page-top alignment · caret-across-the-break · scene + dialogue
travel rules. Two rulings closed item 62's OBS pair (R-PERIOD → keep the period; R-BREATHING →
zero breathing room ratified — see item 62's close-out). Two new defects opened from the true
surface: **item 105** (page-boundary presentation) and **item 106** (empty-region caret clicks).

**New items:**
- **101 — Page panel's New Page appeared to do nothing.** **Repro PENDING** (possibly clicked
  from an already-unborn page — nothing to birth). Confirm the reproduction before attributing.
- **102 — the prose input model.** Enter-feels-dead-until-doubled · first-keystroke line drop ·
  Tab escapes to browser chrome · "double-spaced" feel. **Nick's verdicts, attached:** the
  paragraph-gap is **NOT** the default; **Tab indents.**
- **103 — the typewriter fade band.** Nick's **five-line graduated spec, top and bottom.** **The
  verbatim five lines are NOT in this relay — recorded as OWED**; they attach verbatim and are the
  authority (nothing here reconstructs them).
  **→ ATTACHED 2026-08-17 (verbatim, from Nick's screenshots on file at Fable's desk):** *"I think
  the fade-out needs to be longer, probably --- let's say 5 lines, with the top line of the page
  (no matter what the text there says or whether or not there are line breaks, etc.) being almost
  nearly invisible while each line below is slightly more visible. Also, the same five line fade
  should happen at the bottom of the page when a user scrolls up. The effect should be (when in
  typewriter mode only, obviously) that the writer's focus is always on a central set of lines
  near the center of the page, roughly a paragraph length, while the rest of the text fades out
  into the past. The idea is to continually propel the writer forward so they don't get locked in
  to constant revision and overthinking."*

**Item 86 RECHARTERS → "the prose page — size AND pagination."** Nick expected prose to paginate
(as the script now does); was S2/86 "page size (ruled post-vacation)", now covers size AND
pagination. **Committee pass on Nick's word.**

**M-arc note:** ground legibility at high counts is the open concern; **the flare verdict is
POSITIVE — in Nick's own words** (verbatim quote owed if wanted, not reconstructed here).
**→ ATTACHED 2026-08-17 (verbatim, from Nick's screenshots on file at Fable's desk):** *"I did
notice a few lines ago that the rhizomatic progress bar at the bottom of the screen (which at
this point just looks like a bunch of scribbling) lit up orange briefly. That effect was nicely
done and did give me a hit of dopamine that seems to have propelled me to continue writing as I
continue to produce words at a fast rate despite just doing this review and needing to fill up
space to test the new page feature."* **One quote, two ledger lines:** the tail carries the
legibility finding *inside* the praise — *"just looks like a bunch of scribbling"* is the
ground-legibility-at-high-counts concern, stated in the same breath as the POSITIVE flare verdict.

Registry: next free **104**.

## ITEM 104 — SCREENPLAY SELECTION DEAD ON AN UNBORN PAGE (defect) — OPENS 2026-08-17 · CLOSED 2026-08-26 (founder's walk on production)

**⚠ REOPENED — PRODUCTION DEFECT (Fable, 2026-08-24).** The doorway ship (deployed `1cbda72` ·
railway `59d55924`) shipped a **crash**: the **New Page door crashes ON MOUNT** at the deployed
SHA — a **hooks-order violation introduced by `fe0252b`** (item 104's own doorway commit), **proven
by execution at three trees** (the 83 desk's scratch-worktree investigation; the lane untouched,
the worktree removed after). It escaped the 59/59 suite of record AND the GREEN review through a
**coverage gap** (no gate drove a cold direct load of `#/page/new` — now **item 109**). **RULING:
FORWARD-FIX at the fix lane.** The **Railway rollback lever is NAMED AND HELD:** redeploy P2c's
tree — **git `643dd16` · railway `ec2b9755-1746-4b23-a3f8-e33130f984a9`** — via `railway up` from
the primary checkout (item-98 guard); **Nick's word executes it if the forward-fix stalls** — NOT
executed now. **INTERIM RULE (relayed to Nick):** the New Page door is **avoided on production
pending the hotfix stamp.** The FIXED / REVIEWED-GREEN records below stand as history — the fix
removed the defect's mechanism but introduced a hook-position crash the review did not catch (see
Fable's ownership append on the doorway review, `docs/wrizo-alpha/doorway-review-fable.md`).
**→ ATTRIBUTION CORRECTED (Fable, 2026-08-24):** the crash CLASS **PRE-DATES the doorway** — there
are **three hooks below the guard** (including `useCascade`), and **pre-doorway `src` crashes
IDENTICALLY**. `fe0252b` did NOT introduce the class; it **added instances to an existing illegal
region** (read the banner's "introduced by `fe0252b`" as "added instances to"). **The doorway
review's ownership note STANDS** — the review still should have caught the hook position; the
correction is about the defect's age, not the review's duty.
**→ EXPOSURE + INTERIM RULE REFINED (Fable, 2026-08-24):** the LIVE path is a **two-device
tombstone** — a page **deleted elsewhere while open here**, so its entry vanishes under a mounted
surface — NOT a cold direct load. **Refined interim rule: Nick avoids CROSS-DEVICE DELETES until
the hotfix stamp** (supersedes "avoid the New Page door" above).
**→ LIFTED 2026-08-25 (Fable's ruling): the hotfix is FUNCTIONALLY VERIFIED and DEPLOYED (git
`63b875b` · railway `410033f9`); cross-device deletes are fine again, the crash class is removed,
item 104 re-closed.** Byte-identity of the deployed bundle stays unverified cross-OS (item 111).
**⚠ REOPENED (THIRD) — `#/page/new` STILL CRASHES (Fable, 2026-08-25).** The MENU lane proved it in
a HEADFUL scratch worktree at main's tip (`8210c37`): the New Page door still crashes on mount. The
hotfix fixed the **two-device-tombstone path it was proven against**, but a **SEPARATE crash on the
New Page route remains** — so the FUNCTIONALLY-VERIFIED line stands ONLY for the tombstone path, NOT
the New Page route (corrected at the deploy stamp; Fable's review-sufficiency claim WITHDRAWN).
**INTERIM RULE REINSTATED: the New Page door is AVOIDED on production.** Three ships (doorway, hotfix,
and now) have passed over a dead door — item 109's sharpest instance (no gate drives `#/page/new`
headfully). Production stays `63b875b` · `410033f9`; rollback lever unchanged (the doorway is also a
crashing door).
**→ THIRD-PASS FIX SHIPPED (chat 1, 2026-08-25).** `hotfix-104-third @ 8e75e60` merged (`ade023a`)
and DEPLOYED — **git `2256f58` · railway `b10fcc55`**, SERVED==TESTED byte-verified
(`index-CaW0zodg.js`; the item-111 provenance gap did NOT recur — see the HOTFIX 104 (THIRD) DEPLOY
MANIFEST). The guard now sits BELOW `useCascade` (every hook above, the decision below); the prior
dispatcher-unmount fix is kept; the 145-file hooks-order class guard is LIVE (`hooks-order.mjs` PASS
both settings, 60/60). Review VERDICT PASS (`hotfix-104-third-review-fable.md`). Production is now
`2256f58` · `b10fcc55`; rollback target `63b875b` · `410033f9` (rolling back REINTRODUCES the crash).
**→ DISPOSITION: MONITOR, NOT CLOSED (Fable, 2026-08-26).** The fix is proven at the invariant and
the class guard is live — but the direct "the writer SEES the New Page" proof is a **DEV-SERVE
verdict, not this production suite**; item 109 owes the headful gate, and this class has been reported
**narrower than the fault THREE times**. **Item 104 CLOSES when EITHER: (a) item 109's headful
`#/page/new` gate exists AND passes at a deployed bundle, OR (b) Nick's own walk confirms the door on
production — whichever lands first.** The reinstated "avoid the New Page door on production" interim
rule is SUPERSEDED by this disposition: close-condition (b) invites Nick to walk the door on
production, so the door is live-with-the-fix and open to test — but UNPROVEN on production until (a)
or (b). Monitored, not closed.
**→ CLOSED on condition (b) (Fable, 2026-08-26).** Nick **walked `#/page/new` on production**
(`2256f58` · `b10fcc55`) and **THE DOOR OPENS** — paper rendered, invite line drawn, templates
present; screenshot on file (Fable's desk). Close-condition (b) is met, the MONITOR disposition
RESOLVES, and **item 104 is CLOSED** — the founder's own walk is the acceptance criterion the whole
house was built around. **Item 109's headful `#/page/new` gate STAYS OWED** as the durable coverage
fix (so the next regression is caught by a gate, not by a founder) — but it **no longer gates 104.**
The longest-running defect of the project — opened 2026-08-17, three reopens across doorway / hotfix
/ third-pass — is closed by the walk it was always going to take.

**OPENS (Nick, live-test sitting #2, 2026-08-17).** On an UNBORN page, Screenplay selection is
DEAD both ways: the **New Page "Screenplay" template icon** and the **Draft panel's Structure
toggle** each **no-op silently** — no mode change, no feedback. **Repro detail PENDING:** whether
any text had been typed first (an unborn-vs-born distinction may gate it). **This answers the
long-open OBS-1** (the PB1 review's "unborn-Screenplay surface flip," deferred to the next
sitting) — **answered-by-defect:** the flip OBS-1 flagged is not a design question, it is a dead
control.

**Nick's verdict, verbatim (from his screenshot, on file at Fable's desk):** *"Screenplay mode
should be auto-selected anyway when a user comes from a New Page where the 'Screenplay' template
icon was selected."*

**FIX FAMILY (named; S0-BEFORE-PATCH per law — diagnose before touching code):** the **unborn
descriptor pattern** — origin / binder / pin, the address carrying what a page IS before it is
born (established by fw2, items 91–92) — **extends to STRUCTURE.** The door declares the room
WHOLE: a New Page born from the Screenplay template arrives already in Screenplay mode because
the descriptor said so, exactly as item 91's board-kind pin rides the address. No sweeper, no
post-birth toggle race.

**PACKAGES WITH item 87's verification window — mode + structure are ONE seam, ONE ship.** Item 87
(New Page defaults; the door declaring `?mode=draft`) and item 104 (the door declaring structure)
are the same descriptor seam; they verify and ship together, not separately. (Item 87 has since
rechartered as THE NEW PAGE CHOOSER, 2026-08-17 — its toggles map to descriptor presets; item
104's descriptor-carries-STRUCTURE remains the engine, the Draft-default framing superseded.) Item 96's
discoverability charter is the surrounding context (SITTING #2's undiscoverable Screenplay door).

**→ DIAGNOSIS COMPLETE (Nick, live, 2026-08-17).** The "no-op silently" symptom above is REFINED,
not confirmed: the doc **kind SAVES** and the **script surface WORKS** — an **F5 (reload) after
the switch** mounts the Clock correctly, with elements AND pagination. So the defect is neither
dead selection nor lost state; it is **precisely the LIVE REMOUNT on kind-switch** — the editor
swap never fires without a reload. Persistence and the script surface are sound; only the on-screen
editor fails to remount when the kind changes. **Well-bounded.** The fix family holds and narrows:
the born-from-Screenplay-template path is served by the unborn descriptor carrying STRUCTURE (a
fresh mount — correct by construction, which the F5 case proves); the added bounded piece is firing
the editor remount when kind switches on an already-mounted page. Still packages with **item 87
(87 + 104's doorway ship) — mode + structure, one seam, one ship.**

Registry: next free **105**.

**→ FIXED + VERIFIED — 2026-08-17 (fix lane, the doorway ship). ONE DEFECT, NOT THREE.**
**→ REVIEWED, GREEN — items 104, 87-subset, 97 (Fable, 2026-08-17)** —
`docs/wrizo-alpha/doorway-review-fable.md`; VERDICT PASS (5 src +141, three harnesses +657,
runtime-verify +12; zero schema). 104: the `UnbornPage` dispatch asks the ROW (`pageType` outranks
`descriptor.kind`), prose falls through the SAME component under the SAME key (no remount, PB1
preserved exactly). 87-subset: the empty case moves, the threshold rule stands; four clause-1
design-supersession parks. 97: pointer cleared AT DETECTION, does-not-bite finding + named residual
carried. **101 → S0 CLOSED benign** (a measurement, not a defect claim), feedback routed to item
96's charter. **OBS (non-blocking, ×3, th2-comment class):** stale clause-1 prose ("declares Draft
too" / "This door SAYS Draft" / "mode (item 87)") + inert `?mode=draft` fixtures describe the
REMOVED mechanism — correct at the next touch of each file. **NO DEPLOY — the doorway ship holds
for Nick's word.**
**S0 BEFORE PATCH, proven by reading and then measured.** `UnbornPage`
(`pages/PageEditor.tsx`) dispatched on **`descriptor.kind`** — what the ADDRESS said the door
meant — while `PageEditor` (the BORN route) has always dispatched on **`entry.pageType`** — what
the ROW says the page IS. And `birthWith` corrects the address with `history.replaceState` ON
PURPOSE (`components/UnbornSurface.tsx`): a real `navigate()` there unmounts the surface
mid-keystroke and drops a typing burst, which PB1's own burst-integrity check caught once
already. `replaceState` never notifies HashRouter, so no route change occurs — exactly right for
prose birth, and exactly wrong here. The row became `pageType:'script'` while the callback kept
re-rendering `PageEditorView`, because the descriptor said `prose` and always would. F5 re-read
`#/page/<id>`, landed on the born route, and mounted ScriptEditor correctly. **That is precisely
the asymmetry Nick measured** — the kind SAVES, F5 works, only the live swap fails.
**TWO CORRECTIONS TO THE BRIEF, both measured rather than argued.**
**(1) 104(a) DOES NOT REPRODUCE ON A BORN PAGE.** The brief named "kind-switch never remounts
the editor" as its own defect; `item104.mjs` S2 is **GREEN AGAINST THE PRE-FIX BUNDLE**. The born
route re-reads the row every render and App.tsx force-renders the routed tree on every write, so
that swap always worked. (a) was the unborn case wearing a different hat.
**(2) 104(c) WAS ALREADY WIRED.** The "New Page template icon" is `BeginningsRow`'s `screenplay`
door, which already calls `requestScreenplay()`, which already births a script row. It looked
dead for the SAME dispatch reason. So all three reported symptoms collapse to one line.
**THE FIX.** The dispatch asks the ROOM once the room exists: a row's `pageType` decides, and the
descriptor decides only while there is nothing else to ask. **Prose birth is deliberately
untouched** — a prose row has no `pageType`, so it still falls through to the SAME
`PageEditorView` with the SAME key: no remount, no lost focus, not one dropped keystroke. The
burst-integrity property `replaceState` exists to protect is preserved exactly; only a genuine
change of document KIND swaps the surface, which is when a swap is what the writer asked for.
**THE DESCRIPTOR GAINS `structure`** (`?structure=screenplay`), per the brief and Nick's verdict:
the door declares the room's KIND, not just its posture, and the intent rides the ADDRESS so it
survives a reload. Applying it reuses `requestScreenplay` rather than inventing a second birth
path, so the ruled amendment keeps ONE implementation. **This is not a new carve-out of PB1:**
the amendment already rules that Screenplay BIRTHS at zero words, "which is also why there is no
unborn script surface to hold." Every silent door still writes nothing — asserted, S3(a).
Guarded three ways because a double birth would be worse than the defect: unborn only, address-
asked only, once-per-mount latch (StrictMode double-invokes an empty-deps effect).
**SUITE — BOTH SETTINGS CLEAN ON THE IDENTICAL BUNDLE.** Unparked `59/59` and parked `59/59`,
both `tree=46509f4+10dirty bundle=index-D8pFRr1k.js/531254b` — the same asset hash on both runs,
so the two results describe the same software and not merely the same commit. `item104.mjs` 13,
`item97.mjs` 7, `item87.mjs` 4 live + **4 PARKED GREEN** (clause 1's records, byte-frozen). `tsc`
clean. **NO DEPLOY: the doorway ship holds for Nick's explicit word.**
**VERIFICATION — `scripts/harness/item104.mjs`, 13 checks, PROVEN TO BITE.** S1(c) is RED against
the pre-fix bundle and green with the fix. Four checks are CONTROLS that pass on BOTH builds and
are labelled as such: Nick's F5 (the born route was always right), PB1's write-nothing door, and
ordinary prose birth staying on the prose surface. So the file cannot be satisfied by a change
that simply remounts everything.

## ITEM 97 — RE-MINT RATIFIED; THE HARNESS DOES **NOT** BITE, AND THAT IS THE FINDING — 2026-08-17

**Nick's decision (Fable relay, decision-complete): RE-MINT.** `getOrCreatePlanBoard` treats a
soft-deleted board as absent DELIBERATELY, mints fresh, and CLEARS the stale pointer. Trashed
boards stay recoverable via item 90's future work. Implemented.
**BUT `scripts/harness/item97.mjs` IS 7/7 GREEN AGAINST THE PRE-FIX BUNDLE.** Minting fresh and
re-pointing the page ALREADY happened on this path, so the decision **ratifies behaviour that was
already there rather than repairing a defect**. Presented as such: the file is a **standing
guard** on behaviour Nick has now ruled — if a future change makes a tombstoned board resolve, or
leaves the page pointing at it, those checks go red — **it is not evidence of a fix and is not
offered as any.**
**THIS ALSO CORRECTS THIS LANE'S OWN 2026-08-03 FINDING**, which framed the re-mint as a bug. That
reasoning read `getOrCreatePlanBoard` ALONE and missed the delete site: **`softDeleteEntry`
already unpairs a trashed plan board** before marking it deleted (BM1 S2 — "deleting a plan board
unpairs"). **The LOCAL trash path therefore never dangles and never reaches the branch at all.**
The branch is reachable only where a board goes absent WITHOUT that path — chiefly a **sync pull
carrying another device's tombstone**, which `applyRemoteRecords` applies with no unpair. That is
the path the harness drives, so the guard is exercised rather than reviewed.
**WHAT THE CODE CHANGE ACTUALLY ADDS**, stated precisely because the harness cannot show it:
(i) INTENT — the soft-deleted case is named and deliberate instead of incidental (the old comment
said "board hard-gone", describing only half of what reaches it); (ii) ONE EDGE — the stale
pointer is cleared AT DETECTION, so it cannot survive an end-of-function re-pair that misses
because the page itself went absent in between.
**RESIDUAL, named rather than hidden:** the WINDOW between a tombstone arriving and the next flip
is NOT closed. Closing it would mean unpairing at apply-time — a larger change than the decision
authorised, and not one this lane made on its own authority.
**HARNESS INFRA:** the sync double gains an armable `pull` (`/api/_sync_mode` `{ pull }`), on the
exact precedent of this lane's own `{ fail }` and defaulting to the pre-existing empty pull. It
exists because the remote-tombstone path is the ONLY way into the branch. A first draft armed the
tombstone immediately and measured nothing — `applyCollection` correctly REFUSED it, since a
just-minted board is still in the dirty set ("local unsynced edit wins"); the scenario now pushes
and cleans first, exactly as a real second device would have.

## ITEM 104 REOPENED — THE HOOKS-ORDER CRASH: S0, AND AN ATTRIBUTION CORRECTION — 2026-08-24

**→ Fix lane's record of the reopen; converges with chat 1's REOPENED banner at item 104 (above,
the SCREENPLAY-SELECTION section) — same reopen, recorded from both lanes.** The banner carries the
ruling + the held rollback lever + Fable's corrections; this carries the S0, the census, and the
fix. Read together, not as two defects.

**The crash is real, was live, and is fixed. It was NOT introduced by the doorway ship, and that
is measured, not argued.**

**S0 — THE ONE QUESTION THAT GATED THE FIX: why did 59/59 pass?**
Because **no committed scenario has ever driven `entry` from non-null to NULL while a surface
stayed MOUNTED.** Every harness file either sits on a page that exists, or navigates away — and
navigating away UNMOUNTS, which is precisely what hides this fault. The suite could not even
EXPRESS "make this row vanish under the writer" until the armable sync pull landed with item 97
the week before. **That gap is item 109, opened below.**

**THE DISCRIMINATING CONDITION IS NOT COLD-VS-WARM.** The offered hypothesis (a cold direct load
renders once with `entry` null, then the slot arrives) was TESTED AND DID NOT REPRODUCE: cold
loads of `/page/new`, `/page/new?structure=screenplay`, and a missing page id all render
correctly (`rootKids:4`, no error). The real condition is **the page you are looking at becoming
ABSENT while you are still on it** — `entry` non-null → null in a mounted view. React counts
hooks per render, so the count drops and it throws #300, blanking the tree (`rootKids:0`).

**WHO IS HIT.** Not "only direct loads", and not every in-app writer. Reproduced via the path
production actually reaches: **another device deletes a page this one has open, and the tombstone
arrives on a sync pull** (`applyRemoteRecords`). Logout navigates away before the cache clears,
and the in-app Delete verb (`BoardRowMenu`) deletes from a LIST, not the page underfoot — so the
two-device case is the live one, which fits a founder working laptop-plus-Desktop.

**ATTRIBUTION — CORRECTED.** The report named this lane's `structureDoorRef` effect. A census
found **THREE** hooks below `PageEditorView`'s single `if (!entry)` guard, and **`useCascade` is
one of them — a position OLDER than the doorway ship.** Built from PRE-DOORWAY src (with
`structureDoorRef` absent, verified) the crash reproduces IDENTICALLY. The doorway ship added two
hooks to an already-illegal region; it did not create the fault.
**A FALSE NEGATIVE ON THE WAY THERE, RECORDED BECAUSE IT IS THE TRAP:** the first baseline
attempt checked out the pre-doorway tree WHOLE — which also lacked this lane's own
`/api/_sync_mode { pull }` double. With no way to deliver a tombstone, nothing transitioned and
the baseline "passed", which would have wrongly confirmed the doorway ship as the cause. The
baseline was redone with **pre-doorway SRC and current HARNESS INFRA**, and then it crashed.
Harness infra is not product code and must not be reverted alongside it.

**THE FIX — AND WHY THE ORDERED ONE-LINE LIFT WAS NECESSARY BUT NOT SUFFICIENT.** This lane's two
hooks are lifted above the guard, as ordered. But the census says lifting only those leaves
`useCascade` below it, and the pre-doorway baseline PROVES that is still a crash. So the
vanished-page decision moves UP into both dispatchers (`PageEditor` and `UnbornPage`), whose own
hooks all sit above every return: a vanished page now **UNMOUNTS** the view instead of
re-rendering it short. That removes the fault CLASS, not the one instance this ticket found.
`PageEditorView`'s own guard stays as defence.

**VERIFICATION — `item104.mjs` S6, PROVEN TO BITE:** 2/15 RED against the deployed bundle
(`Minified React error #300`, `rootKids=0`), 15/15 green with the fix, other 13 unchanged.
**SUITE — BOTH SETTINGS CLEAN ON THE IDENTICAL BUNDLE:** unparked `59/59` and parked `59/59`,
both `bundle=index-hZQhhS8W.js/531318b` on `tree=bddcbcf` — same asset hash on both runs, so the
two results describe the same software and not merely the same commit. `tsc` clean.
**NO DEPLOY: the hotfix waits on Nick's word; production is still `git 1cbda72 · railway
59d55924`, which CARRIES the crash.**

**~~OPEN OBSERVATION~~ → CLOSED 2026-08-24 (Fable's note 2). The 83 desk's environmental open
closes with it.** The hypothesis recorded below — a `vite dev` scratch serve versus a production
build, StrictMode's double-invoke being development-only — is **CONFIRMED**, proven both directions
on one dev server during item 104's third pass: StrictMode ON throws and blanks; StrictMode OFF
renders correctly; production strips the double-invoke entirely. **Both desks measured correctly;
they were measuring different builds.** Neither report was wrong and neither is overwritten.
Original text preserved below.
**~~OPEN OBSERVATION, CARRIED TO THE OFFER (Fable's ruling 3) — the 83 desk's cold-load void vs
this lane's cold-load-fine, at the same bundle.~~** Both are reported as measured; they disagree,
so neither is overwritten. What this lane measured: cold loads (full document load, then reload)
of `/page/new`, `/page/new?structure=screenplay`, and `/page/<missing id>` all render correctly
on the DEPLOYED bundle — `rootKids:4`, no console error. What the 83 desk measured: a void on a
cold load across three trees.
**MOST LIKELY RECONCILIATION, named as a hypothesis and not asserted: a DEV serve versus a
PRODUCTION build.** `main.tsx` wraps the app in `React.StrictMode`, whose double-invoke of render
and effects is **development-only** — it is stripped from a production build. Every probe this
lane ran used `vite build` output served statically; a `vite dev` scratch serve would double-
invoke, which is exactly the condition that can turn a single render-then-navigate into a
detectable hook mismatch, and it also explains the error text differing (a dev build prints the
full invariant, production prints "Minified React error #300").
**THE DISCRIMINATING QUESTION for the 83 desk's re-check, so it settles in one run:** was the
scratch serve `vite dev`, or a static serve of `dist-web`? If dev — the two findings agree and
the difference is StrictMode, not the product. If static production — the findings genuinely
conflict at the same bundle and something environmental is unaccounted for.
**NOT reconciled here by choice:** settling it needs a dev server plus a browser, and this lane's
stamped suite was mid-run; launching one would have contended for the shared pool and voided the
sweep. Recorded as an environmental open rather than measured badly. The fix does not depend on
the answer — the class fix removes the fault on both paths.

## ITEM 104, THIRD REOPEN — S0 COMPLETE: WHERE, WHY, AND THE ENVIRONMENT — 2026-08-24

**WHERE (the gating question).** `useCascade` at `PageEditor.tsx:428`, below the single early
return at `:340`. **This corrects one item on the ruled-out list:** the brief stated "every hook in
PageEditorView is top-level and above the guard" — a census on main's own tip says otherwise, and
`useCascade` is the hook whose absence drops the count. Measured, not argued.

**WHY `entry` FLIPS.** `UnbornProvider` registers the unborn slot during **RENDER** (a `useMemo`,
so children resolve it on their first render) but tears it down in an **EFFECT CLEANUP**. Those
lifecycles differ. React 18 StrictMode simulates unmount/remount by cycling EFFECTS while
PRESERVING memo state — so the cleanup cleared the slot, the memo did not re-run (deps unchanged),
and the next render found nothing. The file's own comment anticipated a double RENDER ("idempotent,
so a double render costs nothing"); it did not anticipate a double EFFECT.

**THE ENVIRONMENT THAT REPRODUCES — and it CLOSES the cold-load open.** A **dev build with
StrictMode**. Proven both directions on the SAME dev server: StrictMode ON → "Rendered fewer hooks
than expected", tree blanked; StrictMode OFF → renders correctly. Production bundles strip
StrictMode's double-invoke, which is exactly why this lane's production-bundle harness read green
while the menu lane's scratch serve read red. **The 83 desk's cold-load void and this lane's
cold-load-fine were both correct measurements of different builds** — the open observation carried
in the last offer is hereby RECONCILED, and the hypothesis it named (dev serve vs production) is
confirmed.

**WHY THE PREVIOUS (SECOND) FIX DID NOT CLOSE IT.** The dispatcher guards decide in the PARENT. A
**child-local re-render** of `PageEditorView` never re-runs the parent, so the parent guard is
never consulted. The invariant has to hold INSIDE the component: every hook above, the decision
below. Recorded because it is the same lesson twice — a guard that lives one level up protects only
the renders that pass through that level.

**THE FIX, AND WHAT THE CENSUS FOUND.** `PageEditorView` now runs every hook unconditionally (a
frozen `MISSING_ENTRY` stand-in keeps the render reaching the end of its hook list) with the
redirect below the last hook. **A repo-wide census over 145 files then found the fault was NOT
alone: `ScriptEditor` carried the identical shape — and it is the room the doorway sends writers
INTO, so fixing only the reported surface would have MOVED the crash, not removed it.** Fixed the
same way. A third, `JournalEntryView`, sits on a surface unrouted since FX14 and is recorded and
left alone rather than touched.
**The slot lifecycle is fixed at its root too:** the spurious teardown is retired (it was hygiene,
never correctness, by its own comment) and registration is self-healing at render.

**AN INTERMEDIATE WRONG STATE, RECORDED BECAUSE IT ALMOST SHIPPED.** With only the hook order
fixed, the crash was gone but `#/page/new` **redirected to Arrival** (`prose:false`) — a crash
traded for a dead door, which would have read as "fixed" to any check that only asserts "no error".
It was caught by asserting what the writer should SEE, not merely the absence of a throw.

**SUITE — BOTH SETTINGS CLEAN ON THE IDENTICAL BUNDLE:** unparked `60/60` and parked `60/60`,
both `bundle=index-CaW0zodg.js/531457b` on `tree=e5f3f25` — same asset hash on both runs, so the
two results describe the same software and not merely the same commit. `tsc` clean.
**NO DEPLOY.** Nick's interim rule stands until this stamps: the New Page door is avoided on
production.
**NEW STANDING GUARD — `scripts/harness/hooks-order.mjs`.** A STATIC census, because the crashing
path is dev-only and a production-bundle CDP scenario CANNOT bite on it. Run against the pre-fix
source it names both violations by file, function, hook and line; green after. It carries one
reasoned allowlist entry (the unrouted `JournalEntry.tsx`) so anything NEW shows up immediately.
**Nothing in the suite had ever asserted hook ORDER before — which is why this class shipped three
times.**

## ITEM 109 — THE VANISHED-SUBJECT COVERAGE GAP (harness) — OPENS 2026-08-24

**Written by item 104's S0.** The suite has 59 files and none of them ever makes a record
DISAPPEAR beneath a mounted surface. Every scenario keeps its subject alive or leaves the room.
That single blind spot let a tree-blanking crash ship green. **Charter:** a standing scenario
class — for each surface that reads a subject through `getJournalEntry` (page, board, script),
drive the subject to absent WHILE MOUNTED (remote tombstone via the armed pull; local delete
where reachable) and assert the surface degrades without throwing. **Also owed:** a lint or
census check for hooks below any early return, since that is the shape that made absence fatal
rather than merely awkward.
**→ PARTLY DELIVERED 2026-08-24: `scripts/harness/hooks-order.mjs`, SCOPE NAMED rather than implied
(Fable's note 3).** It is the **GENERAL form, not file-scoped**: it walks every `.ts`/`.tsx` under
`src` (145 files) and checks every function-declared component AND custom hook (150 of them).
**Blind spots, measured and named, because a guard that overstates itself is worse than none:**
arrow-defined components/hooks (`const Foo = () => {…}`) are not parsed — today exactly ONE such
definition exists in the codebase and it contains NO hook calls, so the gap is currently EMPTY but
structural; and multi-line early returns (a `return` on its own deeper-indented line inside an
`if {`) are not matched, only top-level single-statement ones. Both faults this ticket fixed were
of the matched shape. It is a line scanner, not an AST pass.
**STILL OWED to this charter: the AST-based form**, which closes both blind spots and could run as
a lint rather than a suite file.
Registry: next free **110**.

## ITEM 101 — S0 COMPLETE: CONFIRMED **NOT** A DATA DEFECT — 2026-08-17

**→ S0 CLOSED benign (Fable's review, 2026-08-17):** a measurement, not a defect claim — S4 green
confirms same-route-navigation onto an identical door; **feedback routed to item 96's charter.** No
code owed.

**The ledger asked for exactly this before attributing anything** ("Repro PENDING … Confirm the
reproduction before attributing a defect"), and the answer is that the suspicion in the ticket is
correct and benign. Measured through the CASCADE'S OWN New Page door — the control Nick used —
on an already-unborn page (`item104.mjs` S4): the click **writes NO row**, the address is
**unchanged** (`#/page/new?mode=draft` before and after), and the writer is left on an unborn
door either way. It is a same-route navigation onto an **identical blank door**: nothing happened
because nothing needed to happen, and **nothing is lost**.
**RECORDED AND PARKED per the brief's own instruction** ("fix only if the mechanism is inside
this same doorway seam, else record and park"). The mechanism IS in the doorway seam, but it is
not a defect — what is arguably owed is FEEDBACK (a door that says "you are already on a new
page"), which is a design call for item 96's discoverability charter, not a fix-class change this
lane should invent. **No code written for item 101.**

## ITEM 105 — THE PAGE-BOUNDARY PRESENTATION CLUSTER — OPENS 2026-08-17

**OPENS (Nick, live, Section A — the Clock's first founder session).** Two LAWFUL pagination
behaviours (item 62's rules) **read as DEFECTS to a writer** at a page boundary:
- the **active-element whole-render exception** presents as **"off-page text"** — the active
  element renders whole, so it can extend past the page edge;
- the **non-splittable move-whole** presents as an **"undeletable gap"** — an element that moves
  whole to the next page leaves an apparent gap that reads as un-removable.
Both are correct by the paginator's rules; the *presentation* is what misleads. **Nick's
discriminator result is PENDING** — the measurement that rules out a genuine arithmetic defect
underneath; **do not attribute until it lands.** **Fix family: presentation / signaling of lawful
pagination** — the boundary must SHOW what it is doing (the active-element exception, the
move-whole) rather than let the writer read it as broken. Not a paginator-arithmetic change unless
the discriminator says otherwise.
**→ DISCRIMINATOR RESOLVED (Nick, follow-up, 2026-08-17): NARROWS to presentation / signaling
ONLY.** The boundary mechanics WORK when writing forward — there is no genuine arithmetic defect
underneath. The "gap" and "off-page" reads were the active-element whole-render exception PLUS the
no-cross-block-selection finding (item 107, below). Item 105 is confirmed a **presentation /
signaling** ticket, not an arithmetic one.
Registry: next free **106**.

## ITEM 106 — CARET PLACEMENT ON EMPTY-REGION CLICKS — OPENS 2026-08-17

**OPENS (Nick, live, Section A).** Clicks on **elements** activate correctly; clicks on **empty
sheet space no-op** — the caret does not move there, and subsequent typing lands at the (now
hidden) caret's prior position rather than where the writer clicked. **Nick's verdict, verbatim
(from his screenshot, on file at Fable's desk):** *"the caret needs to move to wherever I click on
the document."* Registry: next free **107**.

## ITEM 107 — NO CROSS-BLOCK SELECTION / BULK DELETION ON THE SCRIPT SURFACE (architecture) — OPENS 2026-08-17

**OPENS (Nick, live, Section A).** Cross-block selection and bulk deletion **do not exist** on the
script surface: **one live element at a time** is the architecture — the exact class the caret fix
**explicitly declined to dissolve** ("non-collapsed selection … those need the class dissolved, not
the symptom closed," `docs/wrizo-alpha/sc2-review-fable.md`). **Nick's verdict:** fine moving
forward, but *"clunky if the writer wants to remove blocks of dialogue at one time."*
**ARCHITECTURE-CLASS, POST-VACATION** — dissolving the one-element-at-a-time class is a real
change, not a quick fix. The **DESIGN half — block-select / delete / move as EXPLICIT operations —
routes to the MENUS ARC**: block operations are natural tool-menu citizens. This finding is also
part of what item 105's "undeletable gap" read reflected — there is no bulk delete to remove it.
Registry: next free **108**.

## ITEM 108 — THE TUTOR MEMORY ARC (retrieval / the model phase) — OPENS 2026-08-17

**OPENS (from item 84 preset (B)'s hybrid ruling).** The Tutor's **MODEL PHASE** — its
memory / retrieval design: **what persists**, **how genre / type travel**, and the **deck→model
threshold parameter** — **settles TOGETHER with its carve-out sentence** (one decision, not two).
**The wire today is `{messages, delta?, bible?}` and NOTHING else — closed by architecture** (no
silent widening of what the Tutor sends or stores); the `69911c3` seam note in the lock record on
main is this arc's **founding census**. The **disclosure-v4 committee's agenda now narrows to ONE
sentence — the disclosure itself** — drafting now at Fable's desk; that sentence is this arc's
carve-out. **[PRECISION — 2026-08-17, append-only:** the "=" just above CONFLATED two sentences.
The committee's ONE sentence is **THE DISCLOSURE** (drafts now; gates TD4 / TR3 / BD4 across BOTH
arcs, 84 and 83). The **CARVE-OUT is a SEPARATE second sentence, deferred INTO item 108** to settle
with the retrieval design — it is NOT the disclosure. Disclosure now; carve-out with the model
phase.]** Post-vacation / committee; the DECK phase (item 84's first ungated citizen) ships ahead
of it. Registry: next free **109**.

## DISCLOSURE v4 — RATIFIED (candidate B, provisionally-binding) — 2026-08-17

Committee pass: `docs/wrizo-alpha/disclosure-v4-committee-fable.md`. **ONE sentence extending the
ratified v3, gating the three designed counsels that read more than the standing wire — TD4 (the
selection ask) · TR3 (the Reading) · BD4 (83's board counsel).** **Nick's word: candidate B**,
verbatim: *"Nothing leaves your desk unasked: an ask sends your words, this page's recent changes,
and your Bible; a counsel that reads more names it on the button and sends only that, only then."*
**Nick's posture, verbatim:** *"It's hard to get more precise than that until I start testing it
and see where the cracks are in the harness."* **LOCKS PROVISIONALLY-BINDING** — governs the builds
now; live testing may amend it, and any amendment re-ratifies through the committee record,
append-only.
**Lock conditions:** (2) Nick's ratification — **MET**; (1) payload census confirmed by the 83 + 84
desks against their pass files — **PENDING** (relayed to both). **On census confirmation:** TD4 /
TR3 / BD4 UNBLOCK; the sentence enters both build briefs verbatim; disclosure **v3 → superseded by
v4 in annotation form (v3 standing verbatim beneath)**; and per `sc2.mjs`'s precedent the sentence
becomes a **HARNESS OBLIGATION** on each gated counsel's build ticket — its spec asserts its wire
carries exactly what its button names, nothing more. The disclosure is a testable claim, tested.
This is THE DISCLOSURE, distinct from item 108's carve-out (a separate second sentence).
**→ CONDITION (1) SATISFIED — TD4 / TR3 / BD4 UNBLOCKED (Fable, 2026-08-17).** Per the 83 desk's
mechanism confirmation and census supplement (`menus-build 8a04a3a`), the payload census is
confirmed; the counsels **UNBLOCK**. The disclosure sentence enters both build briefs verbatim, v3
→ superseded by v4 (v3 verbatim beneath), and the harness obligation attaches to each counsel's
ticket. **Two carried caveats:** TR3's **ask 2 OWES one payload-naming clause** (the 84 desk's
wordsmith) before its ticket; **BD4's scope** is restated to **board-content-beyond-base — currently
none.** Disclosure-v4 remains provisionally-binding; live testing may amend it, append-only.
**→ CONDITION (1) CLOSED — BOTH DESKS; TD4 / TR3 / BD4 FULLY UNBLOCKED FOR BUILD (Fable,
2026-08-24).** The 84 side now closes the census too: §10 (merge `19f0db7`) records the
button-naming ruling — the ask-2 reversal recorded as one, the button law standing, candidate B
quoted with its manifest — so **TR3's owed payload-naming clause is DELIVERED** and the last caveat
clears. Both desks confirmed; **TD4, TR3, and BD4 are fully unblocked for build.** BD4's scope
stays board-content-beyond-base (currently none). Disclosure-v4 stands provisionally-binding.

## ITEM 109 — THE COVERAGE GAP: NO GATE FOR A COLD DIRECT LOAD OF #/page/new — OPENS 2026-08-24

**→ CONVERGED — SAME ITEM as the fix lane's "ITEM 109 — THE VANISHED-SUBJECT COVERAGE GAP" above
(reconciled at the hotfix merge, 2026-08-24).** Two lanes opened item 109 in parallel for the same
coverage gap; the fix lane's **vanished-subject framing is CANONICAL** — it matches Fable's refined
charter (the gate is "entry vanishes under a mounted surface," not a cold load). This section is
chat 1's first read, kept as history. **ONE item 109; registry next free 110** (both records name
the same pointer — the two markers are not two items).

**OPENS (from item 104's production crash).** The doorway ship crashed the New Page door on mount
in production, and **59/59 both settings + a GREEN review both missed it** — because **no gate
drives a COLD DIRECT LOAD of `#/page/new`** (the harnesses reach the door through navigation, never
a fresh mount at that URL, which is where the hooks-order violation fires). The escape is the gap,
not the check: a defect that only manifests on cold direct load has no instrument. **The fix lane's
S0 answer completes this charter** — the S0 defines the gate that would have caught it (a cold
direct-load harness for `#/page/new`, and the class of URLs that mount a component with early
returns). Harness-infra, fix-class; sibling to item 99 / item 100 (harness-floor robustness).
**→ CHARTER UPDATED (Fable, 2026-08-24): the gate is "ENTRY VANISHES UNDER A MOUNTED SURFACE," NOT
cold loads.** The true live exposure is a **two-device tombstone** — a page deleted on another
device while it is open here, so its backing entry disappears out from under the mounted surface
and the below-guard hooks fire on the re-render. The header above ("cold direct load of
`#/page/new`") was the first read; the gate the fix lane's S0 must build is **a mounted surface
whose backing entry vanishes** — the broader class of which the cold-load case is one instance.
**→ SHARPEST INSTANCE (Fable, 2026-08-25): no gate drives `#/page/new` HEADFULLY.** Three ships —
doorway, hotfix, and the current head — have passed over a **DEAD DOOR** because no harness ever
loads `#/page/new` in a REAL (headful) browser the way a writer does, which is the only place this
crash manifests. This is item 109's sharpest, most-owed gate: **drive `#/page/new` headfully at the
deployed bundle.** The vanished-subject class still stands; this is the un-gated route that keeps
re-shipping a crashing New Page door (item 104, reopened a third time).
**→ 104 CLOSED, 109 STILL OWED (Fable, 2026-08-26).** Item 104 closed 2026-08-26 on the founder's own
walk of `#/page/new` on production (`2256f58` · `b10fcc55` — the door opens, paper rendered). The
headful gate above **no longer gates 104**, but it **STAYS OWED** as the durable coverage fix — so
the next regression on this route is caught by an instrument, not by a founder. **Item 109 remains
OPEN.**
Registry: next free **110**.

## ITEM 110 — ONE-CHECKOUT-PER-AGENT VIOLATED (worktree-assignment gap) — OPENS 2026-08-24

**OPENS (deck-lane cross-lane contact report; Fable's ruling).** The deck lane built in the PRIMARY
CHECKOUT during chat 1's in-flight hotfix suite, because it had **no worktree assignment in its
brief**. Three contacts with chat 1's staging — all now repaired and **VERIFIED BY CHAT 1** (a
relayed claim is not a verification): **(a)** `runtime-verify.mjs` edited mid-parked-run,
additive-only — verified now byte-identical to chat 1's suite tree `2a03ace` (the edit reverted),
and chat 1's re-run was complete (59/59 both settings, no gaps); **(b)** its 11 uncommitted files
moved out — verified `git status` clean at the `63b875b` tree; **(c)** it overwrote
`apps/desktop/dist-web` then rebuilt at clean HEAD — verified `index-hZQhhS8W.js`, **exactly 531318
bytes**, matching chat 1's suite stamp. The deck lane moved to its own worktree
(`.claude/worktrees/item84-deck`) and recorded the incident. **Fix: the brief template gains a
worktree-assignment line** — one checkout per agent, assigned at brief time. Registry: next free
**111**.
**→ MECHANISM NAMED + FIX WIDENED (Fable / TUTOR, 2026-08-25).** Strays arise because relays name a
**PATH and never a WORKTREE**, so a builder writes wherever it stands. **The real remediation is a
STANDING RULE — worktree named, ALWAYS:** every brief or ruling that causes a file to be written
states its target worktree explicitly (TUTOR amended its relay format; Fable adopts the same for
every brief/ruling). The brief-template line follows from it, not the reverse. **Clearance executed
(TUTOR's procedure, 2026-08-25):** of the three stray copies, `-v2.md` matched v2 (`a3e1662`, on
main) → deleted; the other two (identical content, md5 `2f5c3e55…`, git blob `8fcd4b6`) matched
NEITHER v1 nor v2 → kept preserved in scratchpad, hash relayed to TUTOR, nothing deleted. (`-v2` was
never a repo path — a working name during a relay; any file bearing it is a stray by definition.)
**→ THIRD "STRAY" RULED NOT A STRAY (Fable, 2026-08-26).** `docs/menus/tutor/item84-t1-s0-brief.md`
(git blob `484e7221`, md5 `01d76268…`, 7796 b) is the **DECK lane's T1 S0 brief**, not a TUTOR
stray. That ticket is **PARKED on item 112 (Revise as a surface) per Nick's ruling**, so the file is
**superseded-before-tracked.** ROUTED TO THE DECK LANE, not TUTOR — its author decides whether any of
it survives into item 112's eventual brief. Preserved (scratchpad copy + blob written to the object
store, recoverable `git cat-file -p 484e7221`); nothing deleted; the working-tree copy LEFT IN PLACE
in the shared checkout for the DECK lane to find. *(Two earlier preserved item-84 strays also await
their desks: the revise-repass draft `2f5c3e55`/`8fcd4b6`, and the held-batch predecessor
`a092d53c`.)*
**→ GRAVEST CONSEQUENCE — CONTAMINATION CAN SHIP (Fable, 2026-08-26; DECK §9, verified by chat 1).**
Item 110 was opened as a merge hazard (a stray blocks or clobbers a merge). DECK §9 proves it is
worse: **`railway up` uploads the WORKING DIRECTORY, not committed HEAD**, so the hotfix-104 deploy
shipped DECK's uncommitted `Tutor.tsx` falsification mutations to PRODUCTION for ~90 minutes (served
`4pj2Iqk-` / 537,500 b == DECK's own mutant-run-1 stamp; an unbidden `POST /api/tutor/chat` fired on
a preset press — a disclosure violation). See the INCIDENT RECORD at the HOTFIX 104 DEPLOY MANIFEST
(2026-08-24), item 111 (CLOSED — the mismatch was this, not OS), and the new CLEAN TREE AT UPLOAD
law. Contamination doesn't just block merges — it can SHIP.
**→ THE "DECK-LANE T1 S0 BRIEF" ATTRIBUTION CORRECTED (DECK §10, verified by chat 1, 2026-08-26).**
The routing recorded above (`item84-t1-s0-brief.md` = the DECK lane's T1 S0 brief) is WRONG. DECK
DECLINES authorship on disk (§10): the file appears in the session's OPENING `git status` snapshot —
before the DECK lane's first action — so DECK could not have created it; its subject is the **Revise
error-lens** (*"TICKET T1 — THE CHECKER AND ITS ERROR CLASSES"*, T1→T3→…, `store/draftDecoration.ts`,
TRR15 — 21 hits for that vocabulary, 0 for the deck phase's), which the deck phase does not touch. It
is **NOT superseded by the deck phase**, and DECK has no standing to rule on its deletion. It belongs
to whichever desk holds the **Revise re-pass / error-lens arc** (Fable's own T0 ruling would supersede
its §1 ordering). **Still preserved (blob `484e7221`, scratchpad + object store); nothing deleted.**
**ROUTED TO TUTOR (Fable, 2026-08-26)** — the Revise re-pass desk; its subject is their error-lens
arc. Record, Fable's words: *"routed to TUTOR; Fable's T0 ruling (Revise-as-surface precedes T1)
supersedes the brief's §1 ordering; TUTOR rules what survives into item 112's eventual brief."* Nick
relays the pointer (blob `484e7221`, `docs/menus/tutor/item84-t1-s0-brief.md`, preserved) on his next
TUTOR touch. Still preserved; nothing deleted.
**→ RULED AND CLOSED (Nick ratified the item-112 charter 2026-09-02; Fable's word).**
`item84-t1-s0-brief.md` is no longer routed to TUTOR: **RS7 of the item-112 charter ADOPTS its
surviving matter** (local-only checker filter, five-class taxonomy, the false-flag baseline, the
rule-set inventory) and **its routing check dies SUPERSEDED.** Preserved copies CLEANED (working-tree
copy + scratchpad); **blob `484e7221` remains the recovery path.** DROPPED from chat 1's open threads.

## ITEM 111 — THE BUILD REPRODUCIBILITY GAP (config) — OPENS 2026-08-24 · CLOSED 2026-08-26 (founding evidence retracted — was contamination, not build-repro)

**OPENS (Fable's ruling, from the hotfix deploy's bundle mismatch).** The repo **pins no Node
version**, so a local build and Railway's build can differ in OUTPUT BYTES from identical source:
chat 1's suite verified `index-hZQhhS8W.js` (local Node **24**), Railway deployed `index-4pj2Iqk-.js`
(pinned **nodejs_18**). Local node drifted 18→24 across the vacation span — why prior deploys
reproduced exactly and this one did not (deps were NOT the cause; `pnpm i --frozen-lockfile` changed
nothing). **Fix: `.nvmrc` = 18 + an `engines.node` field, matching Railway's `nodejs_18`.** CONFIG —
**propose-never-ship:** land as its own commit, offer it, and **the pin moves DELIBERATELY WITH
Railway, never independently** (both together or neither). Resolution owed before this deploy is
clean-verified: rebuild under Node 18 → confirm it reproduces `index-4pj2Iqk-.js` byte-for-byte →
re-run the suite of record against THAT bundle both settings (item 111 step b). Registry: next free
**112**.
**→ CORRECTION (chat 1, step-b executed 2026-08-25): the gap is OS-LEVEL, NOT the Node version.** A
local rebuild under a portable Node 18 (`v18.20.5`) produced `index-hZQhhS8W.js` (531318 b) —
**identical to the Node-24 build**, not Railway's `index-4pj2Iqk-.js`. Holding Node constant at 18:
**Windows local → `hZQhhS8W`, Linux Railway → `4pj2Iqk-`** (and the CSS hash differs too). So the
divergence is the **build OS** (Windows ↔ Railway's Linux / nixpacks), not node. The `.nvmrc`=18 pin
stays as necessary hygiene (node should still match Railway) but is **NOT SUFFICIENT** to reproduce
the deployed bytes from a Windows checkout. **Byte-verifying the Linux-built deployed bundle needs a
Linux build environment** (WSL, or a nixpacks-matching Docker container) — build the suite-of-record
artifact where Railway builds it. Absent that, the deploy rests on the **functional-equivalence
argument**: identical source tree + frozen lockfile, the hotfix hook-lift is in both builds, so the
crash is fixed; only exact-byte identity is unverifiable cross-OS. Interim rules HOLD. Raised to
Fable for the reproducibility strategy.
**→ FABLE'S RULING (2026-08-25): item 111 STAYS OPEN, reframed OS-level; the interim-rules HOLD
above is SUPERSEDED — they are LIFTED (the hotfix is FUNCTIONALLY VERIFIED, option 2).** The
durable fix is a **Linux suite-of-record environment** (WSL, or a nixpacks-matching container) so
byte-identity is true again for every future ship — **scheduled POST-WALKTHROUGH, not now** (standing
up a build env mid-arc costs a day). The `.nvmrc`=18 pin stays as correct hygiene, recorded as NOT
closing 111. The Node hypothesis was chat 1's to test, not just execute — overturned with credit.
**→ SOURCE-DEPENDENCE OBSERVED (chat 1, 2026-08-26, from the hotfix-104-third deploy).** The OS
divergence is **NOT universal.** Deploying tree `2256f58`: Railway's Linux/nixpacks build produced
`index-CaW0zodg.js` + `index-62lZ1TCK.css` — **byte-identical to the local Windows suite build AND
the served bundle** (Windows == Linux == served, both assets). So SERVED==TESTED held at full
item-77(c) strength with NO Linux build env — the `hZQhhS8W`≠`4pj2Iqk-` split was specific to that
earlier source tree. Item 111 STAYS OPEN (a Linux suite-of-record env is still the general fix; the
divergence still MAY strike a future tree), but the standing rule is now **DIFF served-vs-stamped
every ship and let the bytes rule — never assume a gap, never assume identity.** See the HOTFIX 104
(THIRD) DEPLOY MANIFEST.

**→ CLOSED — FOUNDING EVIDENCE RETRACTED (Fable, 2026-08-26, from DECK §9; verified by chat 1).** The
premise of this whole item is FALSE, and BOTH corrections above (the step-b "OS-level divergence"
reading AND chat 1's "source-dependence" note) are SUPERSEDED. The served `index-4pj2Iqk-.js`
(537,500 b) was NOT a clean-source Linux build — `railway up` uploaded the primary checkout carrying
DECK's uncommitted `Tutor.tsx` falsification mutations, and Railway built THAT. DECK's own Node-24
Windows mutant build produced the SAME `4pj2Iqk-` / 537,500 b, byte-identical to Railway's Node-18
Linux build — a demonstration of cross-version / cross-OS REPRODUCIBILITY, not a failure of it. The
bundles differed because the SOURCES differed (contaminated vs clean), never because of node or OS.
**No build-repro divergence has ever been observed.** The `.nvmrc` / `engines` pin STAYS on its own
merits (pin the toolchain to the deploy target — good practice), recorded as NOT resting on this
incident. **The every-ship SERVED-vs-STAMPED DIFF stays STANDING LAW — it is the rule that catches
this class:** a contaminated build shows up as a served hash ≠ the suite's stamped hash, exactly as
it did here. See item 110's contamination incident + the INCIDENT RECORD at the HOTFIX 104 DEPLOY
MANIFEST (2026-08-24), and the new CLEAN TREE AT UPLOAD standing law. Item 111 CLOSED.

## ITEM 112 — REVISE AS A SURFACE (surface; the error lens is PARKED here) — OPENS 2026-08-26 (Fable's charter; re-send of a lost opening relay)

**NOT a ticket — a SURFACE.** Revise is **vocabulary without liveness** today (`ModeStrip`:
`live:false`, `aria-disabled`, flashes coming-soon). This item covers **its doorway, its rail
posture, its FX18 geometry, and its own harness** — **"presence is not composition" governs from day
one.**

**THE ERROR LENS IS PARKED ON THIS ITEM** — fully argued and merged (item 84's Revise re-pass:
**T1–T7, TRR12–TRR18, DR7 as narrowed, the CSS-only flag law, the ruled order**). **Nothing re-argues
when the surface exists** — the lens lands onto the surface this item stands up.

**SCOPE QUESTION HELD FOR NICK:** **small T0** (Draft's page + the lens + the Revise roster) **vs full
Revise** (its own furniture). His lean pending.
**→ SCOPE RULED (Nick, 2026-08-28): FULL REVISE.** Its own surface with revision-specific furniture,
**designed before built**; the small-T0 alternative is **RETIRED.** The **design charter routes to
TUTOR** (it holds the Revise arc whole), with **item 83's geometry laws as BINDING INPUTS** — the
anchor law, cabinet geometry, the Two Hands grammar, and DR7-as-narrowed. **Sequencing:** the charter
drafts **AFTER the deck ship and TUTOR's Draft-roster brief** — design begins without stalling the
build queue. The error lens (T1–T7) **remains parked on this item, fully argued.**
**→ CHARTER RATIFIED + LANDED (Nick ratified 2026-09-02; merged `7b49404`).** The full-Revise charter
(RS1–RS7) and the 112-A build brief are on main — `docs/menus/tutor/item112-revise-charter.md` +
`item112a-build-brief.md` (the builder lane's reach to 112-A). RS7 adopts the surviving matter of the
old `item84-t1-s0-brief` (local-only checker filter, five-class taxonomy, false-flag baseline,
rule-set inventory); that brief's routing check dies superseded — see the item-110 close below.
**⚠ 112-A DESK-GRIP QUESTION — AWAITING NICK'S WORD (NOT recorded).** Fable's relay carried a literal
placeholder ("[Nick's word here]") in place of the resolution, so chat 1 has NOT recorded it. Fable
pre-specified only the "no grip" branch: *if "no grip," the Desk hand's machinery mounts at birth
(anchor, coexistence, announce — RS2 satisfied structurally) but renders NO grip until 112-C provides
the drawer's content; G3's absence-over-grayed is the authority; the mirror completes at 112-C.* Held
open pending Nick's actual word.
**→ 112-A DESK-GRIP RULED (Nick, 2026-09-02) — the "no grip" recommendation is OVERRIDDEN.** Nick's
words: *"the desk grips on both sides should always be visible and open the tabs even if we haven't
filled in any tools/options yet."* So at 112-A **BOTH grips (Desk and Counsel) render from birth and
are always visible, and each OPENS its tab even when the drawer holds no tools/options yet** — an
empty drawer OPENS (it is not a locked door), so G3's absence-over-grayed does NOT govern this case,
by Nick's word. Consequence: the two-hand mirror is visually complete at **112-A** (both grips
present), not deferred to 112-C; 112-C still fills the Desk drawer's content later. **Owed to the
112-A builder lane** (supersedes the build brief's "render no Desk grip until 112-C" recommendation);
Fable to route.
**→ AMENDED BRIEF LANDED (chat 1, 2026-09-03, merge `904595a`).** `item112a-build-brief.md` is now the
ruling-consistent version (`9619b2a6`) on main — both grips always visible, opening even-empty tabs —
superseding the pre-ruling "render no Desk grip until 112-C"; TUTOR-amended @ `2579cba`. The 112-A
build lane can launch.

## ITEM 113 — THE TUTOR'S DECLINE + MODELING PROMPT AMENDMENT (build-class, SERVER) — OPENS 2026-08-26 (Fable's charter; re-send of a lost opening relay)

**BUILD-CLASS, SERVER.** Lands in **`apps/server/src/tutor.ts` → `SYSTEM_PROMPT`** AND its
**byte-verbatim mirror `docs/wrizo-alpha/tutor-rules.md` — IN THE SAME COMMIT** (the mirror's own
header is the reason: record and running system can never quietly diverge). Not chat 1's lane to write
(server code, propose-never-ship); recorded here as the approved spec for the build lane.

**Nick-approved insertion, VERBATIM, for §2 of the prompt:**

> Modeling is lawful; repair is not. You may compose a short parallel example — a sentence of your own,
> similar in structure and correctly punctuated — to demonstrate a rule. You may never return the
> writer's own sentence repaired, in whole or in part, however brief. The test: could the writer paste
> your words into their page and be done? If yes, you have written for them. A model is a specimen
> about grammar; a repair is their next revision performed by you.
>
> Speak at the work, never at the writer. The sentence has a problem; the writer does not have a
> problem.
>
> When you are asked again about the same error, the writer's edit did not clear it. Do not repeat your
> previous explanation. Take a different angle — a different model sentence, a different order of
> explanation, a different name for the rule. Never the same explanation louder.
>
> You do not refuse. If a request would cross into composition, do not answer with a refusal sentence.
> Return the question that leads back to the writer's own act.

## ITEM 83 ERRATA — THE WALKTHROUGH WAVE OFFERED — 2026-09-03 (errata lane; branch `errata-build`)

**OFFERED, NOT MERGED.** Full record: `docs/menus/item83-errata-offer-2026-09-03.md`.
Branched from `origin/main` @ `7b78090`. Brief: `docs/menus/item83-errata-build-brief.md`;
authority, Nick's walkthrough findings at `ef9f9ce`. **Nick's merge word and deploy word
remain separate and his alone.** Nothing was pushed anywhere but `origin errata-build`; no
`railway` command was run from this lane.

**S0 `c28a41e`** (the survey, no behaviour change) · **E1 `811bbd0`** · **E2 `16feb6e`** ·
**E3 `6adac50`** · **E4 `8ef2615`** · **`8b3c632`** (two corrections the suite caught in
this wave's own work) · **this record's own commit** (this record).

**BOTH SETTINGS CLEAN, 67/67 each, one tree, neither stamp dirty; the parked pass ran
`--no-rebuild` against the byte-identical bundle the default pass tested:**

```
SUITE RESULT: CLEAN - tree=8b3c632 bundle=index-BS32INXU.js/556707b
SUITE RESULT: CLEAN - tree=8b3c632 bundle=index-BS32INXU.js/556707b NO-REBUILD
```

66 files became **67** — `item83f.mjs`, this wave's own instrument. **Probe 50/50** (44
assertions + 6 shots), **8 of them E2's own**: Full Screen's centre against the progress
bar's reads **0.00px at both widths on prose, screenplay AND board**. **The offered tip is
one commit past the stamp and adds NO product code** — `git diff --stat 8b3c632 <tip> --
apps/desktop/src apps/server packages` is empty; the tip carries the records, fresh shots,
one probe hygiene fix (it was leaving the prose page in Draft, which silently changed the
shots) and one comment correction. **No byte-comparison of the shots is offered:** the
committed set is 179 commits stale (`0eb3bc0`, the menus wave's own M11 proof), so a
difference there is not attributable to this wave.

**E1 — POP-OUTS FADE ON WRITTEN WORDS, NEVER ON A CLOCK.** The survey found the thing the
brief called "the current short timer" does not exist: the pop-out had **no fade of its own
and no timer of its own**. It is a child of `.wz-sliver-panel`, which carries `chrome-fade
desk-dissolve`, so it rode the room's ambient dissolve — armed by `useChromeDissolve.
noteWrite()` on the FIRST forward keystroke, receding over `FADE_OUT_S = 2.8s`. One
character and the tray was gone. **The trigger changed; the fade path did not** — the same
`.desk-dissolve` rule, the same `--fade-dur`, the same reduced-motion opt-out, measured
(the panel's live computed transition is byte-identical held and unheld). **Scoped:** with
no tray open the flag reads false, the rule cannot match, and every fade on that surface is
byte-identical to before — E1 S4 is the control that proves it. **No timer exists in the
gate at all**, which is the "idle never fades it" clause, spent 3.2s proving.

**E2 — HALF ALREADY TRUE, AND THE OFFER SAYS SO.** **Structure was ALREADY the tab's last
zone before the foot at the branch point.** Nothing moved; E2 added the NAME that lets the
claim be measured and the guard that keeps it true as E4 grows the zone. **The probe's
Structure assertion passes against unmodified `main` and must not be read as evidence of
work.** The half with work in it is FULL SCREEN, now on the progress bar's own line, aligned
**by layout** (one flex row, `align-items:center`) — measured at **0.00px** centre-to-centre
at both widths on prose, screenplay AND board, with the hairline strictly narrower than the
goal block it used to span (86.3px inside 155px), which is the difference between sharing a
line and sitting near one.

**E3 — BUILT; THE OUTDENT QUESTION IS WHAT IS HELD.** S0 first read §E3's seam clause too
widely and recorded "E3 HELD"; §E3 carries its own commit line, so the ruled behaviour was
always to be built and only the partner is the invention. **Corrected append-style in the
survey, not written over.** Both discriminators fail against the superseded behaviour:
paragraph scope, and repeatability.

**► SEAM 1, OPEN FOR NICK'S WORD — THE OUTDENT PARTNER.** There is none in the Draft
drawer. **The nuance the brief's framing does not carry: the way back WAS the button.**
`indent` ran through `toggleLinePrefix`, so a second press removed the tab; repeatability
spends that. **E3 does not merely find a one-way door — built without a partner it CREATES
one.** Measured mitigation, not assumed: `applyRailFormat` records an atomic undo step for
every rail click (FX6 S1), so **Ctrl+Z walks a level back reliably** — a real way back, not
a dedicated one, and not discoverable from the drawer. **Recommendation on file:** add
`FormatAction 'outdent'`, symmetric, floored at zero — house precedent already ships the
pair on the legacy bar, and `stripMarkdownConventions` already handles `^\t+`.

**► SEAM 2, OPEN FOR NICK'S WORD — THE SCREENPLAY NAME COLLISION.** A kind chip reading
**Screenplay** (a reversible per-page setting) now stands in one zone with **`Convert to
Screenplay…`** (a one-way act behind a confirm that rewrites the page). The failure mode is
one-way: a writer who means to mark the kind confirms a dialog they skim and their prose is
rebuilt. **NEITHER control was renamed and neither was merged.** Mitigation, asserted:
separate sub-labels naming the difference in words, a different control shape, and a rule
between. **Recommendation:** keep both with that separation; or, cheaper, move the
conversion row OUT of Structure entirely — an act on the work is not a description of it.
**Honest note: the chips are, visually, the Prose|Screenplay TABLIST R13.iv withdrew from
this very zone** for "promising free switching" — the difference being that free switching
is now the truth.

**E4 — ZERO SCHEMA, NO STOP TRIGGERED.** `journal_entries.page_settings jsonb` exists
(`migrate.ts:168`) and is wired end to end; `kind`/`styleGuide` join `PageSettings` as
optional, absent-never-null keys, read through defaults and never written at birth. **The
brief's `entries.page_settings` names a table this schema does not have** — `migrate.ts:165`
already carries the same correction against the same slip.

**A DEFECT CAUGHT BEFORE IT EXISTED — THE KIND MUST NOT RIDE THE DRESS CHANNEL.**
`PageSettings` is one shape serving the per-page value AND the per-user default, and "Set as
my default page settings" copies it whole. Unstripped, pressing that on a Research page
would make **every future page Research**, silently. `pageDefaults` now strips at the door —
set, hydrate and local read — so the rule holds for callers not yet written. Inside E4's own
"or the shape resists" clause: no column, no ruling needed.

**► SURFACED, NOT FIXED — R6's BIRTH-FROM-DEFAULTS DOES NOT REACH THE UNBORN ROUTE.**
Measured, not read: a page born through the cascade's "New Page" door comes back with **no
`page_settings` at all**, on a genuinely born row, with the writer's defaults saved and
non-empty. The stamp lives in `persistence.createJournalPage`; that door navigates to an
UNBORN href instead (FX14 S1's "every New Page opens in THE Page"), and PB1's own
`unbornEntry`/`birth` never carry the field. **So item 83 M2's own ruling — "page settings
reset to defaults when the user creates a new page" — is bypassed on what is now the
ordinary way a page is made.** Pre-existing M2/PB1 interaction, outside this brief, wants
its own ticket. Its one cost here is named rather than hidden: the destination half of the
defaults proof **corroborates** on that route rather than discriminating; the discriminating
check is the one at the door.

**PARKED, NEVER EDITED — SIX ASSERTIONS, AND THE COUNT IS STATED SO IT CAN BE AUDITED.**
`fx3.mjs` two live (E1: the pop-out's keystroke-dissolve pair) + two live (E2: the
three-icons-per-row counts, script and prose) + one gated (generation 3 → 4); `ab2.mjs` one
gated (generation 3 → 4). Each quoted verbatim under a SUPERSEDED banner with a live
successor beside it. **Nothing was removed from the foot** — the roster is still TYPEWRITER
· PROGRESS · FULL SCREEN, on two lines instead of one. `item83f.mjs` is new and **parks
nothing of its own**, and says so in words under `HARNESS_PARKED=1` so the empty list is an
auditable claim rather than an absence.

**THE PATTERN THAT COST FOUR OF THOSE PARKS AND ONE CRASH: NAMING A CONTROL BY ITS POSITION
IN A ROSTER A RULING CAN CHANGE.** Every successor written today names its control. Two of
the wave's own mistakes were caught by the suite and are recorded rather than tidied away
(`8b3c632`): (1) **`ab2.mjs`'s Structure driver took the FIRST button in the zone**, which
E4's kind chips displaced — the file went NOVERDICT; **driver re-pointed to
`.wz-cascade-action`, assertions untouched, nothing parked**, AB2 back to 45/45. (2) **the
new zone class resurrected `.wz-sliver-structure`, the RETIRED tablist's own class** (swept
by the wave's own "orphaned sweep", `45ff3fc`), which `ab2` probes and reads the ABSENCE of
as proof the picker is gone — **a live assertion made false with no ruling behind it.**
Renamed to `wz-sliver-structure-zone`; **parking that check would have been the wrong
answer**, because the claim it makes is still true. The park law is for assertions a ruling
falsifies, not ones a builder breaks by accident.

**DEFERRED BY NICK'S OWN WORD:** the Revise linkage (item 112) and footnotes — item 114's
downstream behaviour, placeholders now *"so we don't forget to go back to it"*; and
**item 102's Tab-as-indent**, not built here and **asserted rather than promised** (no key
handler is touched anywhere in this wave, and item83f presses Tab and measures that nothing
changes).

**TWO SCOPE DECISIONS DISCLOSED, NOT TAKEN QUIETLY:** E2's Structure half was already true
(above); and the kind chips are **prose Draft's** — `ScriptEditor` passes none of the four
props, so they are absent from the framed screenplay surface's DOM (never greyed), because a
script page has already declared what it is and a kind row there would let a writer mark a
screenplay "Normal" and persist the contradiction. **Four props and a default if Nick wants
it widened.** Asserted, so it cannot be a silent narrowing.

## ITEM 83 ERRATA — E1 REPAIRED, E2 HELD — 2026-08-28 (menus errata lane; branch `menus-errata`)

**OFFERED, NOT MERGED.** Full record: `docs/menus/errata-e1-2026-08-28.md`. Branched from
the offered wave tip `e01c482`. **E1 `6bbdd9f`** (the fix + `item83e.mjs`) · **`bd5072c`**
(fx7 driver re-point). **BOTH SETTINGS CLEAN, 61/61 each, tree `bd5072c`, neither stamp
dirty; probe 42/42, shots byte-identical — the repair moved no pixels.**

**E1 — THE OFFER'S RECORDED CAUSE WAS WRONG, and is corrected not dropped.** The offer
named a permissive `band <= 0` return on a full-bleed canvas. Measured, the board's band is
**+50px at 1366 and +207px at 1680** — never `<= 0`, so that branch never ran. It was a
READING of the code carrying the confidence of a measurement. **NEW LAW: READING CODE IS A
HYPOTHESIS, RUNNING IT IS A MEASUREMENT** — this lane's own "maps are research, disk wins",
turned on its own diagnosis.

**THE ACTUAL MECHANISM.** A diagnostic read the store with the sliver visibly
`data-open="true"`: `{ openDrawer: null, coexist: false }`. The policy was right all along
and was never consulted. `Sliver.tsx` announced only from `toggleOpen` (the Ctrl+/ path);
the grip's own onClick called `setOpen(o => !o)` directly — and the grip is what a writer
TAPS ON A TABLET, which is where Nick felt it. **The law was never wrong; it was never
told.** REPAIRED AT THE INVARIANT: both drawers now announce from an effect keyed on their
own open state, so every path announces, including paths not yet written — **a silent open
path is no longer possible to write.** Also fixes an impurity (announcing from inside a
setState updater set state on another component during render).

**TWO MORE OF THE SAME FAMILY, found only by measuring:** (a) `canCoexist` looked for
`.script-page`, which does not render on the framed screenplay surface, so **the two-drawer
law was DISABLED OUTRIGHT there** (`band=null`); now single-sourced with the probe's
corrected list, `.board-canvas` → `.board-canvas-wrap` for the same reason. (b) `closePanel`
docking a survey never announced a close.

**FABLE'S CONSTRAINT IS NOW THE CODE'S FIRST LAW AT THAT SITE** — the permissive answer is
reached only by PROVING both boxes are laid out, never by inferring it from the band's sign;
a measured `band <= 0` returns FALSE (no room is a NO, not a shrug). That the branch was not
E1's cause does not retire the constraint.

**BITES PRE-FIX: 4 of 13** on a bundle rebuilt from unfixed source. Carries CONTROLS so a
green cannot be a coincidence: each narrow close is paired with "the band is genuinely too
short", and the 2600px case asserts both drawers STAND with coexistence proven EARNED
(`band >= tools + cascade`) — the guard on Nick's other half against a fix that just always
closes.

**THE SUITE CAUGHT A FIXTURE THAT HAD ENCODED THE BUG.** `fx7` returned NOVERDICT (crash on
`getComputedStyle(null)`): its S4 opens the cascade, then the sliver, then re-reads the
cascade — which only ever worked because the law was broken. Independent confirmation the
repair is real, and the harness failed LOUDLY rather than green-on-a-changed-world. **Driver
re-pointed, assertion untouched, nothing parked** (nothing falsified); FX7 PASS (45), same
count as before.

**E2 — HELD FOR A RULING, NOT A DEFECT.** It does not reproduce as a slipping anchor: the
panel is **0.0px** from the stage's right edge at rest, with the board canvas shrunk to
588px, grown to 1488px, across four viewport-resize transitions, and after scrolling. (An
early 6px reading was a TRANSITION ARTIFACT — measured mid-animation; recorded so it is not
rediscovered as a phantom.) The panel is a constant **250px** right of the board's own edge
and does not follow the board — **because it was never anchored to it. That is FX18 S2
regime (3) working as ruled** ("bounded to the app edge by the flex-end dock"). Nick's ask
therefore REVERSES A STANDING RULING, which is not this lane's act. The change is small,
CSS-only and needs no JS-measured position; **an hour on the word.** Two things for a
reviewer first: the board panel overlays the canvas by design at narrow widths (regime (3)'s
own exception), and `.board-canvas-wrap`'s right edge does NOT move when the canvas is
resized — so "follows the board" must be defined against the wrap, and even then will not
track a canvas resize. If Nick wants it tracking the CANVAS, that is a larger change.

## ITEM 83 — THE MENUS WAVE OFFERED — 2026-08-27 (menus lane; Nick's merge word given, Fable reviews)

**OFFERED, NOT PUSHED.** Full record: `docs/menus/offer-2026-08-27.md`. On Fable's
confirmation `main` fast-forwards to the branch tip — never a force, never a rebase of a
merge. **The deploy word is separate and is not asked for here.**

**THE TIP:** `menus-build` — parks `45ff3fc` · fix-lane fold `c655ee7` · main merge
`2c1ec19` (`origin/main` @ `b925ecb`) · gated-lane parks `b0046ff`. The wave itself is
M0–M11 (`4aa53e6`→`0eb3bc0`) plus gates S1–S3 (`c9b8020`, `575daa8`, `1c0a5f3`).

**BOTH SETTINGS CLEAN, ONE TREE, NEITHER STAMP DIRTY:**

```
SUITE DONE HARNESS_PARKED=unset — 60/60 of 60 returned a passing verdict
SUITE RESULT: CLEAN — tree=b0046ff bundle=index-CHvEOjEp.js/543622b NO-REBUILD
SUITE DONE HARNESS_PARKED=1     — 60/60 of 60 returned a passing verdict
SUITE RESULT: CLEAN — tree=b0046ff bundle=index-CHvEOjEp.js/543622b NO-REBUILD
```

**Probe 42/42**, cascade flush 0.00px at both widths, fresh shots byte-identical to the
existing set (git saw nothing to commit — the second time that has held across a moving
`main`). **`item87.mjs` PASS (4)** — the fix lane's re-point `bb146b4`, FOLDED not
re-authored, holds against the shipped markup. **`m3` PASS** — a fourth data point,
appended to item 82's record as a sighting and **deliberately not cleared** by this lane.

**THE PARKS — 32 blocks + 2 guarded reads, sixteen files, nothing edited or deleted.**
Twenty-seven in the live lane across twelve files (`45ff3fc`), five in the GATED lane
across four (`b0046ff`: `ab1`, `ab2`×2, `b2`, `fx3`). Every original quoted VERBATIM under
a `PARKED — SUPERSEDED` header naming its authority, successor beside it. The orphaned
`.wz-sliver-structure` CSS swept in the same commit as its markup.

**NEW LAW, and this wave paid for it: A SUPERSESSION MAP IS COMPLETE ONLY WHEN BOTH
SETTINGS HAVE RUN.** The twelve-file map came from default-only runs; 08-04 and 08-05
never exercised `HARNESS_PARKED=1`. Fifty-four of sixty harnesses carry gated `pok()`
blocks, and those do not archive retired checks — **each re-asserts its retired check
against the truth that replaced it**, so the gated lane is live code with a live claim and
a wave lands in it exactly as it lands in the live set. The first parked run against this
wave came back **NOT CLEAN, 56/60**. **Fable's ruling (2026-08-27):** the gated block always
holds the NEWEST truth; prior generations stack verbatim beneath it. `fx3`'s gated twin of
a park already standing in its own live section is the precedent, now the pattern.

**DEFERRED BY NAME** (offer §6, eight items): INK/stylus · the screenplay engine hook-up ·
Import File · the specialty TOOL tabs · F10's model · R13.iv's one-commit relocation ·
M4's Typewriter menu stores but does not drive · the Sliver not re-mounted at `right:100%`.

**ERRATA QUEUE, FIRST AND OWED** — the two wave defects the 2026-08-26 walkthrough routed
here (below), accepted by this lane and outstanding at the time of the offer:
- **E1 — the rail menu does not shut the tool sliver on boards.** Cause located:
  `menusDrawers.ts:74`. `canCoexist()` returns `true` (permissive) when the band between
  rail-right and paper-left is `<= 0`; on a full-bleed canvas there IS no inset paper, so
  the guard reads "there is no room at all" as "they may coexist" — the two-hands law
  inverted exactly where it matters most. The repair is a branch for the degenerate case,
  NOT a flipped return: a zero band on full-bleed and a zero band from a failed
  measurement are different facts, and `Number.isFinite` already carries one of them.
- **E2 — the Tutor panel loses its right-edge anchor under board resize.** Under the
  anchor law this is a LAYOUT fault: the repair belongs in CSS, never in a resize handler
  that writes a position — writing one is the exact failure the law exists to prevent.
  **→ RESOLVED-BY-SUPERSESSION into item 119 (Nick's Mirrored Hands ruling, 2026-08-31).** The
  Tutor-panel anchor question folds into item 119's surface-anchoring charter (both hands attach to
  the WRITING SURFACE, not the screen). E2 is NOT repaired independently; **the interim screen-anchor
  stands until item 119 ships.**

- **E3 — the Tutor pop-out does NOT fade out on close (the Tools menu does).** Nick's finding +
  ruling, 2026-08-31: **fade in AND fade out on BOTH pop-outs, and on ALL menus that slide in/out.**
  The Tutor/Tools asymmetry is item 119's ANIMATION-mirror clause made concrete (the Counsel's
  animation must exactly mirror the Desk's); the broader ruling — every slide-in/out menu fades both
  ways — is a general MENU-lane animation law. Owed to MENU; feeds item 119's charter.

  **-> S0 + BUILT - 2026-09-02 (fix lane). THE FADE WAS NEVER MISSING. IT WAS FADING AN EMPTY BOX.**
  `.wz-tutor-panel` has carried `opacity var(--fade-dur,.2s) ease, transform var(--fade-dur,.2s)
  ease` since FX10 S1 copied it off `.wz-sliver-panel` **after reading that rule live** - so the
  Counsel's fade and the tool pop-out's were already character-identical. **MEASURED, pre-fix,
  sampling every frame after the close click:** the first frame reads
  `{t:1, opacity:"1.00", content:false}` - `.wz-tutor-body` is **ALREADY GONE** before the fade has
  moved at all, and the panel then fades `1.00 -> 0.13` over ~108ms. The writer sees the contents
  blink out and an empty rectangle dissolve. That is "it does not fade out".
  **THE CAUSE, one conditional:** `Tutor.tsx` wrapped its body in `{open && ...}`, so the content
  unmounted synchronously on close. **`Sliver.tsx` renders `<SliverToolsBody />` UNCONDITIONALLY**
  inside its faded panel - the mirror was exact everywhere except this one line.
  **THE FIX IS THEREFORE A MOUNT CHANGE, NOT A TIMING CHANGE.** No duration is copied anywhere in
  this ticket and no transition was added, which is the brief's own instruction ("reuse the existing
  fade, never copy timing") satisfied literally: the fade was already declared and simply had
  nothing inside it to carry. **Post-fix, same instrument:** content present across the whole
  transition, `1.00 -> 0.20` over ~102ms, fully faded at 169ms.
  **A11Y POSTURE INHERITED, NOT INVENTED.** A closed panel is mounted + `aria-hidden` +
  `pointer-events:none` - exactly what the left hand has shipped since FX1. Adding a `visibility`
  rule or `inert` here was considered and REJECTED: it would diverge from the mirror, which is the
  opposite of the ruling. The panel's effects are already gated on `open`, so a closed body costs a
  render and no work.
  **NEW HARNESS `e3.mjs`, 9 checks. FALSIFIED: 3/9 failed** against the reverted mount. The two that
  passed BOTH ways are honest and deliberate: fade-IN never was broken (opening mounts the body,
  then it fades), and the **mirror check** (S3: both panels resolve to the same duration, properties
  and timing function) is a GUARD against a future "tuning" of one hand, not a defect claim.
  **STILL OWED TO MENU, unchanged by this:** the broader half of the ruling - *every* slide-in/out
  menu fades both ways. This ticket closes the Counsel only.
- **E4 — the Tutor GRIP is ABSENT on first load (fix-class, errata queue).** Nick, production
  `c927e9c`, 2026-09-02: the RIGHT hand's tab did NOT render when the page loaded; it appeared only
  after interacting with styling and typewriter controls. The LEFT hand was present throughout.
  Symptom-only per law. Candidate S0 neighborhood (HYPOTHESIS, not finding): the announce/mount
  family E1 just repaired on the LEFT hand — the right hand may want the same effect-keyed announce.
  Routes to the next armed fix window.
  **→ S0 CLOSES THE HYPOTHESIS (Fable, 2026-09-02, append-style):** the announce/mount candidate above
  is **FALSIFIED.** The mechanism is the **UNBORN GATE at `PageEditor.tsx:935`** — the Tutor AND the
  rhizome are suppressed by the SAME expression. (The hypothesis is kept verbatim as the reasoning
  path, per park-never-edit.)
  **→ E4 CHARTER GROWS (part of E4, NOT a new number):** the boards' latent **SILENT-VANISH** finding
  — item 88b's class — a send on an UNBORN surface clears the composer while the append returns null.
  Folded into E4's charter. **→ CORRECTED by the fix lane's measured S0 below (2026-09-02): the defect
  is the OPPOSITE — a PREMATURE BIRTH (the send UPSERTS a real row), NOT a silent vanish; and `entry`
  carries a minted per-surface id, not `''`. Kept per park-never-edit.**
  **→ MERGE ROUTING (Fable, 2026-09-02):** FIX's two completed offers — the ab2 re-point (`c871c08`)
  and 118(a-ii) — do NOT merge separately; they RIDE the `fix-wave-e34-118` offer, which already
  carries them. One suite at current main verifies the whole set; one merge, one ship (on Nick's word).

  **-> S0 - 2026-09-02 (fix lane). REPRODUCED. THE HYPOTHESIS IS FALSIFIED. THE CAUSE IS PB1's
  `unborn`, AND THE NAIVE FIX IS WRONG.**
  **REPRODUCED headlessly** against a fresh build, 1400x900, a new page off `#/page/new`:
  `.wz-tutor-grip` absent and **`.wz-tutor-zone` count = 0** - the Tutor is not in the DOM at all,
  while the LEFT sliver and its grip are both present. Exactly Nick's symptom.
  **THE ANNOUNCE/MOUNT HYPOTHESIS IS FALSIFIED, not merely unsupported.** The two theories make
  different predictions and were made to compete: an announce/mount timing fault should be
  perturbed by a re-render, so the probe forced two (a `resize` event and a keydown) **without
  writing a word** - the grip stayed absent, zone count still 0. It appeared at **BIRTH** and only
  at birth: the address flipped `#/page/new` -> `#/page/mtkfv3mgbvv1ktjf5` in the same step.
  **The clincher:** `rhizome` flipped `false -> true` at that same instant - a DIFFERENT feature,
  suppressed by the SAME condition in the SAME expression. One cause, two symptoms.
  **THE CAUSE:** `PageEditor.tsx:935` - `tutor={gateActive || unborn ? undefined : <Tutor .../>}`.
  The `unborn` half arrived with PB1 (`66593d9`, "Born on the First Word"). A page is unborn until
  its first word, so a freshly opened page has no right hand. Nick's *"it appeared only after
  interacting with styling and typewriter controls"* is the same fact from the other side: a
  styling click writes `****` into the text (FX6 S1 - "a Bold/Italic toolbar click is a genuine
  edit"), which BIRTHS the page, which mounts the Tutor.
  **THE ASYMMETRY IS THE FINDING.** The LEFT hand is rendered even while gated - merely veiled
  (`:921`). The RIGHT hand is not rendered at all. And the other three mount sites -
  `BoardEditor.tsx:2428`, `ScriptEditor.tsx:1112`, `JournalEntry.tsx:1174` - mount the Tutor
  **unconditionally**, including on an UNBORN BOARD. So this is not a principled PB1 law applied
  evenly; it is a page-only condition, and the board already ships the behaviour Nick is asking for.
  **THE NAIVE FIX - DELETE `unborn` - IS WRONG, and this is the reason S0 exists.** On an unborn
  page `getJournalEntry(id)` misses, so `entry` resolves to **`MISSING_ENTRY`, whose `id` is the
  EMPTY STRING** (`PageEditor.tsx:78-81`, `:102`). Un-gating alone would mount every unborn page's
  Tutor against one shared empty identity. **Note also a stale comment:** `:91-94` still says
  *"`entry` resolves from the unborn slot meanwhile"* - item 104's third pass changed `entry` to
  `realEntry ?? MISSING_ENTRY` and the comment was not updated with it.
  **`gateActive` MUST STAY.** It is documented twice over - TU1's non-goal ("the Tutor on the
  threshold, first-run stays pure") and a real geometry hazard (`.hb1-veil`'s `filter:blur(4px)`
  establishes a containing block that would break the Tutor's two absolute anchors). It is also the
  one-time first-run ceremony, **not** "first load", so it is not what Nick hit on production with
  an existing account.
  **LATENT DEFECT FOUND EN ROUTE, SHIPPED TODAY ON BOARDS:** on any unborn surface, `Tutor.send()`
  clears the composer and calls `appendTutorMessage`, which **early-returns `null` when the row is
  missing** (`persistence.ts:1088-1090`). The writer's message AND the reply both vanish, silently.
  Same class as item 88b's "reported a filing that never happened". Un-gating pages without closing
  this would spread it from boards to pages - **so closing it is part of E4, not scope creep.**

  **-> S0 CORRECTION - 2026-09-02, BEFORE BUILDING. TWO CLAIMS IN THE S0 ABOVE WERE WRONG, AND ONE
  OF THEM IS THE PREMISE FABLE'S RULING (a) WAS WRITTEN ON. Both are corrected by MEASUREMENT.**
  1. **`entry` is NOT `MISSING_ENTRY` on an unborn page, and the comment I called stale is
     ACCURATE.** `UnbornProvider` registers a record-shaped object in persistence's UNBORN SLOT
     before children render (`UnbornSurface.tsx:77-78`), and `getJournalEntry` falls through to that
     slot when the store has no row (`persistence.ts:1667-1673`). So `entry` carries the **minted
     per-surface id** all along. `MISSING_ENTRY` cannot even reach that line: the vanished-page case
     returns at the dispatcher one level up (`PageEditor.tsx:1072`). **I withdraw the "stale
     comment" claim.** Consequence for the ruling: **requirement (a) needs no work — it is already
     satisfied by construction**, and it is verified below rather than asserted.
  2. **The latent defect is the OPPOSITE of what I recorded. Not a silent vanish - a PREMATURE
     BIRTH.** Because `getJournalEntry` resolves from the slot, `appendTutorMessage` does NOT
     early-return; it reaches `saveJournalEntry`, which upserts a real row. **Measured on the
     SHIPPED build, on an unborn BOARD** (the surface that has mounted the Tutor unconditionally all
     along): store rows went **0 -> 1** on a single Tutor send, and the row was
     **`{id:"mtkg9k2hqyy088qt9", pageType:"board", text:"", boxes:0, tutorMsgs:1}`** - a board with
     no words and no cards, **born by a chat message**. That is a live PB1 violation
     ("the row is written by the first word"), shipped today, and it is worse than the silence I
     predicted. The measurement also settles (1): the row carried the MINTED id, not `''`.
  **WHY THIS DIDN'T CHANGE THE FIX DIRECTION, ONLY ITS INSIDES.** Fable's ruling (b) - "a send on an
  unborn surface must either work or visibly refuse; silence is the defect" - is satisfied by
  REFUSING: PB1 is a standing law and a fix lane does not overturn one to make a send succeed. The
  composer is deliberately NOT cleared, so the writer's sentence survives the refusal.

  **-> BUILT - 2026-09-02. `PageEditor.tsx` un-gated (`|| unborn` removed, `gateActive` kept),
  `Tutor.tsx` refuses out loud on an unborn surface, one new lexicon string. NEW HARNESS `e4.mjs`,
  19 checks.** FALSIFIED against the reverted product: **9/15 failed**. The board check is the one
  that catches the PB1 violation - the page checks structurally cannot, because pre-fix there is no
  Tutor on a page to send from. The falsification pass also exposed a fault in my own first draft of
  the harness: a bare `.click()` on the absent grip THREW and killed the file instead of failing a
  check, reporting nothing about anything downstream. Hardened via `clickOrFail` - the same lesson
  ab2.mjs's label-coupled drivers taught, applied before shipping rather than after.
  **DELIBERATELY NOT TOUCHED, NAMED NOT SKIPPED:** `rhizome` (`:958`) carries the SAME `|| unborn`
  condition and still pops in at birth. It is the progress instrument, not a hand, so Nick's
  mirrored-hands ruling does not reach it. **Owed as a question, not assumed either way.**
- **STYLING FAMILY, new sub-finding (item 79/102) — B/I/U stay HIGHLIGHTED after the writer moves
  on** (Nick, production `c927e9c`, 2026-09-02, same screenshot): the active state is STUCK, not
  tracking the caret. Joins the styling-controls family. (Item 79's visible `***_` markers are
  confirmed still present in the same shot — the KNOWN class, NOT re-opened.)
- **OBS (Tutor-surface records, for whoever next touches Fragments):** the Fragments panel lists the
  same fragment TWICE with a malformed lead (`"Testing theJournal… . L"` ×2). Screenshot-visible
  2026-09-02, unflagged by Nick — logged, not ticketed.

## WALKTHROUGH — 2026-08-26 · NICK'S FINDINGS (menus build + boards; screenshots on file at Fable's desk)

Two-part live walk, relayed by Fable. New items **114–118** open below; two Part-1 defects join
existing families (item 102, item 79); the design rulings + wave defects are **owed to the MENU lane
as errata** (recorded here, routing noted).

### PART 1 — DRAFT + FREE WRITE (menus build)

**DEFECTS:**
- **(a) Bullet lists don't continue** — Enter after a bullet yields a plain line. **Joins item 102's
  prose-input family as its LIST CLAUSE.** (S0 at the prose-input fix lane.)
- **(b) Align buttons INSERT literal glyphs** (`>>`, `><`) with **NO visible alignment applied** —
  **item 79's renderer class WIDENED to alignment markers.** Repro note = the S0's first question:
  does alignment **apply-but-show-markers**, or **fail entirely**?

**DESIGN RULINGS — verbatim to MENU as WAVE ERRATA:**
- the pop-out **FADE TIMING** rule;
- the **MENU LAYOUT** rule — the **Structure block to the tab's BOTTOM**; **Full screen ALIGNS WITH
  THE PROGRESS BAR**;
- **INDENT SEMANTICS** — **Tab = indent**; the **menu arrow indents a WHOLE PARAGRAPH, repeatably,
  for outlines.**

**UX NOTE (M-arc, onboarding) — NOT a defect.** Forward lock works and startles. Nick's verdict — the
feature **STANDS**: *"as long as the writer feels compelled to keep moving forward... I will have
accomplished my goal."* Whether first-run needs a one-line introduction is a design question for the
onboarding notes, not a defect.

**CONFIRMED WORKING:** B/I/U styling applies · paragraph breaks · indent option · heading via H ·
Forward lock's strike-not-delete.

### PART 2 — BOARDS

Board findings are grouped as **item 118** (the fix cluster, defects a–f) plus committee/feature items
**115–117**, all opened below. **WAVE DEFECTS — to MENU as errata:**
- the **TWO-HANDS RULE not working** — a far-left open does NOT shut the tool sliver — a ruled wave
  requirement, now a wave defect;
- the **TUTOR PANEL does not stay anchored to the board's RIGHT EDGE under board resize** — Nick's
  ruling: it should.

## ITEM 114 — RESEARCH PAGES & STYLE GUIDES (feature; placeholders NOW, behavior deferred) — OPENS 2026-08-26

**OPENS (Nick, walkthrough part 1, 2026-08-26).** The Structure redesign makes **"Research" a THIRD
PAGE KIND** beside Normal and Screenplay. Under it, **style-guide buttons — MLA (default) · APA ·
Chicago · AP** — are revealed, and **the selection SHAPES THE REVISE MENU** (e.g. Chicago → Footnotes
appears). **Nick's instruction: build the buttons NOW as placeholders** — *"so we don't forget to go
back to it"* — full behavior DEFERRED. **Cross-refs:** item 112 (the Revise linkage); item 87's
chooser (a third kind = a third preset); the **MLA-default ruling — SUPERSEDED as to placement:** the
buttons live **under Research in Structure**, not in the earlier dropdown location.

## ITEM 115 — CARD TAGS & METADATA (committee) — OPENS 2026-08-26

**OPENS (Nick, walkthrough part 2, 2026-08-26).** Charter, Nick's words (the Westeros example whole,
on file at Fable's desk): **cards carry METADATA for quick lookup** — a cited source's name; a place
or character. A **"Tags" dialogue box at each card's FOOT** lists the card's linked tags; **links
between cards note their connecting tags**; and **tags are searchable FROM THE DRAFT SCREEN**,
returning every card carrying the tag *"without having to run an AI check."* **Charter posture,
verbatim:** *"devise an intuitive way for writers to be able to group information without getting too
bogged down in the logistics."* Committee.

## ITEM 116 — IMPORT TO BOARDS (committee-light) — OPENS 2026-08-26

**OPENS (Nick, walkthrough part 2, 2026-08-26).** **Replaces the dead New Page Card control** (ruled
removed — item 118(f)). **Any major file type placed on a board** (mood boards, PDFs); **double-click
opens an appropriate viewer.** Committee-light — Nick's posture, verbatim: *"emphasis on maintaining
progress, not trying to iron out every minor detail."*

## ITEM 117 — PAGE↔BOARD LINKING & THE BOARD SHELF (feature) — OPENS 2026-08-26

**OPENS (Nick, walkthrough part 2, 2026-08-26).** A **Page links to one or more Boards.** Linked
Boards render as **scrollable THUMBNAILS in the Tools Menu**; clicking one opens a **second pop-out
LEFTWARD** listing every card/doc as thumbnails, scrollable; **double-click opens the card/doc in the
same popup used on the Board** (faded ground); **EDITS SYNC BOTH WAYS.** **Sub-note (to-dos, not
now):** Storyboard/Outline boards will also display here, formatting may differ. **Cross-refs:** item
93's pairing model **folds INTO this charter**; the **menus arc owns the chrome.**

## ITEM 118 — THE BOARD INTERACTION FIX CLUSTER (fix-class) — OPENS 2026-08-26

**OPENS (Nick, walkthrough part 2, 2026-08-26).** Six board-interaction defects, one cluster:
- **(a) B/I/U completely broken in the card editor** — literal `****` / `**` / `___` markers, **NO
  styling applied** — worse than the page (where style applies under visible markers). Likely its own
  renderer path; S0 confirms.
- **(b) Cards resize ONCE** — the handle never re-arms until the writer clicks another card first.
- **(c) Cards moved to the board's edge begin to DISAPPEAR** — edge containment absent.
- **(d) Board resizing DECAYS** — works at first, then stops after a resize or as cards accumulate.
  Nick's ruling, verbatim: *"A user should be able to double-click on the board to activate the
  resizing option at any time."*
- **(e) Cards link but CANNOT BE UNLINKED.**
- **(f) The New Page Card control is DEAD — and RULED REMOVED** (replaced by item 116, Import to
  Boards).

Registry: next free **119**.

**→ S0 PASS 1 — 2026-08-28 (fix lane). TWO OF THE THREE "SMALLEST" DEFECTS DID NOT REPRODUCE, AND
NOTHING IS OFFERED AS FIXED.** The brief named (b) resize-once, (e) unlink and (c) edge-vanish as
the likely-smallest subset. Driven headlessly against the shipped bundle
(`index-CHvEOjEp.js`), mouse pointer, 1400x900, one **text** card on a fresh user board:
- **(b) RESIZE-ONCE — NOT REPRODUCED.** Resize #1 grew the card 435x87 → 525x157; resize #2, run
  IMMEDIATELY after with **no intervening click on another card**, grew it again 525x157 → 615x227.
  The handle re-armed and tracked to the new corner (631,336 → 721,406). Under these conditions the
  handle does not need re-arming.
- **(c) EDGE-VANISH — NOT REPRODUCED.** A card dragged far past the top-left edge (target 170px
  left and 130px above the canvas origin) **clamped** to (146,168) against a canvas origin of
  (146,167) and stayed rendered. Edge containment is present on this path.
- **(e) UNLINK — NOT REACHED.** The setup failed before the defect could be tested: a move-drag on
  a second card did not move it, and the double-click-then-drag thread gesture minted **no
  connection** (0 connection elements). So (e) is UNTESTED, not absent.
**THIS IS A STATEMENT ABOUT THE INSTRUMENT AS MUCH AS THE PRODUCT, and it is not a claim that
Nick was wrong.** He reported these from his own walkthrough; four variables differ between his
conditions and the probe's, and any of them could carry the defects: **pointer type** (the gesture
code has pen-specific paths and a hold-timer; the probe drove a MOUSE), **card kind** (the probe
used a `text` card — a `page-pin` card takes a different `canResize`/aspect path), **card count**
(defect (d) says board resizing decays "as cards accumulate", which points at state that one card
cannot produce), and **viewport/DPR**. The probe's own move-drag failing is direct evidence that
the harness does not yet drive this surface faithfully.
**WHAT IS OWED BEFORE ANY OF THIS CLUSTER IS BUILT:** a reproduction under Nick's own conditions —
at minimum pointer type and card kind named — because a fix built against a defect that does not
reproduce is a fix aimed at nothing. **NOTHING FROM ITEM 118 IS OFFERED**, per the brief's own
"anything not green parks with records". No product code was written for it.
**ONE THING THE PROBE DID SETTLE, worth keeping:** board `boxes` live in BoardEditor's local React
state and reach `localStorage` only on the 2s autosave or unmount, so the first probe drafted here
read `[]` and would have "confirmed" resize-once against two empty arrays. Re-instrumented to the
DOM, the same run showed both resizes working. **Any future item-118 harness must measure the
rendered card, never the stored row** — the same trap item 92 met from the other side.

**→ S0 PASS 2 — 2026-08-28: DEFECT (a), READ IN SOURCE. IT IS THREE FAULTS, NOT ONE, AND THE
CHARTER'S GUESS IS WRONG IN AN INSTRUCTIVE WAY.** The charter says B/I/U is "likely its own renderer
path". It is not: the card popup shares the page's engine correctly (`applyFormat` +
`decorateEditorFor`). The breakage is elsewhere, and it splits three ways — no browser needed for
any of this, it is all readable in the shipped source.
- **(a-i) UNDERLINE HAS NO RENDERER, ANYWHERE — AND IS OFFERED ON TWO SURFACES.** The card dock
  ships a `U` button (`BoardEditor.tsx:572`) and so does the page rail (`Sliver.tsx:361`, `:398` →
  `PageEditor.tsx:645`). Both call `applyFormat('underline')`, which writes `__word__`
  (`draftFormat.ts:33`). **Nothing renders it.** `draftDecoration.ts` contains the string
  "underline" ZERO times; `decorateInlineForCard` (`:83`) and `decorateInline` handle only `**` and
  `*`; `index.css` has `.md-bold` and `.md-italic` (`:4200-4201`) and **no `.md-underline`**. So
  underline is literal, unstyled, on the page as well as the card. This is Nick's `___`. **The
  shipped UI and the shipped renderer disagree with each other, and `draftDecoration.ts`'s own
  header says so out loud — "Bold/Italic ONLY" — above a dock that ships three buttons.**
- **(a-ii) THE RESTING CARD NEVER CALLS THE ENGINE AT ALL.** `BoardTextBox`
  (`BoardEditor.tsx:252-260`) returns `{initialText}` as a bare text node. Decoration happens ONLY
  inside the popup. So on the BOARD — the surface the writer actually looks at — every marker is
  literal and nothing is styled, bold and italic included. This is Nick's "**NO styling applied**".
  The ported-card branch (`sourceEntryId`, `:245-252`) is raw too.
- **(a-iii) B/I/U ON AN EMPTY SELECTION PRODUCE BARE MARKERS, BY DESIGN.** `wrapSelection`
  (`draftFormat.ts:56-59`) with `selected.length === 0` emits `****` and parks the caret between the
  pairs; the card register is **reveal-adjacent-to-caret**, so both marks then render VISIBLY with
  no text between them. That is Nick's `****`. It is working as specified — **and the specification
  is what reads as broken**: the writer clicks B meaning "type bold from here" and receives four
  asterisks. Worth a ruling, not a patch: this is a design report wearing a bug's clothes.
**WHAT THIS CHANGES ABOUT THE FIX.** (a-ii) needs no ruling — FX5 S6's own recorded verdict already
governs it ("asterisks visible on a card is a bug, not a style choice — the popup shows words, not
syntax"), and that argument applies with MORE force to the resting card than to the popup it was
written for. The repair is one call: render through `decorateMarkdownForCard(text, null)`, whose
null caret collapses every marker (`md-mark-hidden`) and leaves styled words. **One risk to prove,
not assume:** cards auto-size from the rendered DOM's `scrollHeight` (`measureRef`), and collapsed
marks are `font-size:0`, so decorated text measures SHORTER than raw — card heights will move, and
the harness must check that before this is offered.
**(a-i) NEEDS A RULING BEFORE IT IS BUILT, AND I AM NOT TAKING THE CHOICE.** Two lawful repairs
point opposite ways: **retire the U buttons** (honour the frozen Bold/Italic set the decorator was
written to) or **give underline a renderer** (honour the UI that has been shipping to the writer).
Nick named U as broken, which leans toward the second — but the frozen-markdown-set ruling is a
standing design ruling and a fix lane does not unfreeze one on its own initiative. **Routed to
Fable.** Whichever way it goes, it is one change in the SHARED engine and it lands on the page and
the card together — class-over-instance, not a board-local patch.

**→ BUILT AND OFFERED — 2026-08-28: (a-ii) ONLY. `ae1f600`, branch `fix-ab2-repoint`, offer doc
`docs/wrizo-alpha/offer-item118-a2-2026-08-28.md`.** One file, one JSX element: `BoardTextBox` now
renders through `decorateMarkdownForCard(initialText, null)` instead of returning `{initialText}`
raw. No new renderer — the popup's own engine, with a null caret, so nothing is adjacent to
anything and every marker collapses. Governed by FX5 S6's existing verdict; **no ruling taken**.
`dangerouslySetInnerHTML` is safe on the same grounds as `decorateEditorFor` (every slice through
`escHtml`; the engine emits only its own `<span class="md-*">`). Storage untouched and ASSERTED —
marks collapse via `font-size:0`, never `display`/`visibility`, so `textContent` still carries the
stored bytes; the check exists so a future "simplification" to `display:none` fails loudly in the
harness instead of quietly in a writer's saved words. Card heights cannot shrink (the measure
effect is one-directional) — asserted, not argued.
**NEW HARNESS: `apps/desktop/scripts/harness/item118.mjs`, 6 checks. Suite files 60 → 61.**
**FALSIFIED FIRST** against the reverted product at the same build: `ITEM118 VERIFY: FAIL — 3/6
failed` — the three DEFECT assertions, while the storage invariant, the no-collapse guard and the
popup regression passed before AND after (they are guards, not defect claims; a guard that only
passes after the fix proves nothing). Fix restored: `PASS (6 checks)`.
**THE HARNESS ASSERTS NOTHING ABOUT (b), (c) OR (e)** — deliberately. They did not reproduce, and a
harness that "passes" against an unreproduced defect is worse than none.
**DELIBERATELY OUT OF SCOPE, NAMED NOT SKIPPED:** `BoardPinBox` and the ported-card branch render a
`notecardExcerpt` title+excerpt — a derived SUMMARY of a page, not the card's own words. Whether a
summary carries styling is a design question. **Owed follow-up.**
**STANDING AFTER THIS:** (a-i) and (a-iii) ROUTED TO FABLE for rulings; (b), (c), (e) PARKED
UNBUILT; (d) not reached; (f) already ruled removed. **The single cheapest unblock for (b)/(c)/(e)
is one line from Nick naming the POINTER TYPE and the CARD KIND he was using.**

## ITEM 119 — THE MIRRORED HANDS (design-class; the Counsel mirrors the Desk, both anchored to the writing surface) — OPENS 2026-08-31

**THE MIRRORED HANDS RULING (Nick, 2026-08-31)** — supersedes **FX18 S2 regime (3)** for the Tutor
panel; **E2 resolves INTO this.** Nick's words, verbatim:

> "I want the tools menu pop-out and the Tutor interface pop-out to be exactly mirrored to each other
> and both anchored to any Page, Board, or Card on which the User does any kind of writing."

**THE CHARTER, three faces:**
- **SYMMETRY** — the Counsel's geometry, animation, anchor, and coexistence behavior **exactly mirror
  the Desk's** (the tools hand). Two hands, one grammar.
- **ANCHORING** — both hands attach to the **WRITING SURFACE** — page paper, board canvas, opened
  card — **not the screen.**
- **COVERAGE** — **every surface that accepts writing carries both hands**, the opened-card popup
  included.

**Design-class WITH KNOWN BUILD WEIGHT:** the **canvas-scrolls-inside-a-fixed-frame** finding means
surface-anchoring on boards needs real plumbing — the measurement is on record at **menus-errata**.

**BINDING INPUTS:** the **drawer coexistence law** (both-open only when the surface has room; graceful
yield); the **announce-from-effect invariant**; **item 83's geometry laws**; and **item 117's
board-shelf chrome** — the two **must be designed together, one charter pass covers both.**

Registry: next free **120**.

**→ 115 / 117 / 119 CHARTERED AS ONE CLUSTER — the connected-board cluster (Fable's desk, 2026-09-02;
pass beginning).** One system in three numbers: **115 the DATA** of connection (tags), **117 the
GEOGRAPHY** (the board shelf), **119 the GRAMMAR** (mirrored hands) — designed together in one full
committee double-pass, output one design document with a ticketed build order to Nick for his word.
Charter: `docs/wrizo-alpha/cluster-charter-tags-shelf-hands.md`. Item 116's import mechanics ride
BEHIND the cluster (its own small charter once the shelf exists). *(Committed post the roster stamp,
batched with the MENU desk's item-83 errata build brief — `docs/menus/item83-errata-build-brief.md`,
AUTHORED BY THE MENU DESK, committed to main by chat 1 so the errata builder can launch.)*

## ITEM 120 — R6 BIRTH-FROM-DEFAULTS NEVER REACHES THE UNBORN ROUTE (fix-class) — OPENS 2026-09-03

**OPENS (Fable, from the errata wave's measurement, 2026-09-03).** R6's **birth-from-defaults** — the
page-defaults COPY at creation (M2's ruling) — **does NOT reach the UNBORN route**, the ordinary way a
page is made. **MEASURED by the errata lane, not read:** M2's own ruling is bypassed on the ordinary
birth path. **Pre-existing** — outside the errata wave's brief, so surfaced not fixed there (see the
errata records above: *"► SURFACED, NOT FIXED — R6's BIRTH-FROM-DEFAULTS DOES NOT REACH THE UNBORN
ROUTE"*). **Fix-class, owed to the next FIX window.** The outdent partner (E3's SEAM 1) and the
Screenplay-collision seam remain **HELD FOR NICK** (recommendations on file in the errata offer;
neither blocked this merge). Registry: next free **121**.

## NOW — blocks everything downstream
1. ~~**The J4 merge word.**~~ **DONE — 2026-07-11.** Fable's delta review
   returned GREEN; Nick relayed "Merge `j4-board` to `main` and deploy." CC
   merged (clean, no conflicts), ran `tsc` (desktop + server) + `build:web`
   + selftest + the persisted 26-check `scripts/harness/j4.mjs` — all green
   on merged `main` — pushed, `railway up`, and confirmed a live prod
   round-trip for `boxes` (kind/groupId/strokes/provenance all intact).
   See `docs/backlog.md`. J5's prerequisite gate now passes.
2. ~~**The consolidated hardware session.**~~ **PARTIAL, THEN SUPERSEDED —
   2026-07-14.** Nick's device pass ruled five J2/W1 specifics (S1-S5) before
   the sitting was superseded by the App Bones pivot
   (`docs/wrizo-alpha/app-bones-canon.md`). J2 + W1-partial verdicts banked
   (`docs/wrizo-alpha/j2-s25-fixes-brief.md`); all remaining gates (J3, J4,
   J5, S1, W2, M1, and TH2's tenth cluster) superseded per the canon's Q3 —
   parked surfaces carry no debt; AB slices carry their own device gates.
   See item 21.
21. ~~**The AB-arc.**~~ **CLOSED — 2026-07-16, Nick's word.** Canon ratified 2026-07-14 — Nick's word, rulings folded
    into `docs/wrizo-alpha/ab1-page-frame-brief.md` (mode strings, flourishes
    unmounted, theme-scoped module names) and `docs/wrizo-alpha/the-desk-design.md`
    Part 6 (now RULED). Briefs per `docs/wrizo-alpha/fable-week-plan.md`.
    Supersedes item 2's remaining gates (see above). Blocks: AB2/AB3 briefs,
    the succession dossier.
    **AB1 — MERGED, NOT CLOSED — 2026-07-14.** Built S0-S6 on
    `ab1-page-frame` off post-handoff `main` (shell inventory
    `docs/wrizo-alpha/ab1-shell-inventory.md`; `DeskFrame` + the five zone
    tracks, gated at the brief's own ≥1100px floor — below it every surface
    is byte-identical pre-AB1 JSX; `ModeStrip` with the ratified strings on
    text + script; flourishes unmounted, meter track empty; the vanishing
    law generalized (found and fixed a real pre-existing `ModeStage`
    edge-dwell resurface bug along the way — the dwell listener was being
    torn down every render); chrome purge + the script containment fix
    (finding 4 dead); `store/deskLexicon.ts` for the strings seam — **note
    for review: Fable's handoff named `desk/strings.ts`, CC built
    `store/deskLexicon.ts` instead (sibling to `themeLexicon.ts`), a
    reasoned but unconfirmed deviation, flag at review**; `ab1.mjs`
    harness). An independent CC review pass then found and fixed two real
    defects before folding back: a genuine layout overflow at the exact
    1100px gate floor (page column overlapped the tool-rail/corkboard
    tracks — a `minmax(0,1fr)`/min-width chain fix, new permanent harness
    coverage) and Board's vanishing law left unwired (judged a real gap,
    not a Nick-level call, and wired to match Script's pattern).
    `ab1.mjs` grew 32→37 checks. `tsc` + `build:web` + selftest + the full
    suite (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/`ab1`, 341 checks
    total) green, independently re-run a second time on merged `main` by
    CC (not just trusted from the build/review agents) before push.
    Fast-forwarded to `main` @ `fba81c7`, pushed.
    **Fable's post-merge review landed** (`docs/wrizo-alpha/ab1-review-fable.md`):
    REQUIRED FIXES — 2, no data-loss-class or architecture findings.
    Rulings of record: the `store/deskLexicon.ts` naming **RATIFIED**
    (over the handoff's `desk/strings.ts`); the ≥1100px gate **RATIFIED**;
    SyncIndicator's global silence **RATIFIED**; CC's self-review pass and
    the `ModeStage` dwell fix **endorsed**; finding 1 argued
    dead-by-composition, formal death certificate deferred to Nick's
    device look. Six advisories carried (A1-A6), none blocking.
    **ab1.1 folded — 2026-07-14** @ `f01b400`: R1 — the vanishing law
    missed the `sprint-nav` row (breadcrumb + Done/Undo) on framed Script
    and Board, which carried no `chrome-fade`/`data-chrome-receded` and so
    stayed visible while the rest of the room dissolved; fixed by
    mirroring PageEditorView's pattern in `ScriptEditor.tsx` and
    `BoardEditor.tsx`, `ab1.mjs` grew 4 checks (recede + restore, both
    surfaces) 37→41. R2 — `ab1-page-frame-brief.md`'s S2 now carries the
    ruling on JournalEntry: absorb-deferred is **sustained**, the work is
    **re-homed to AB2 as a named slice** (QuickSprint's deferral likewise
    sustained — never in S2's list). Full suite re-verified green
    (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/`ab1`, 345 checks total),
    pushed. **Close conditions per Fable: (1) CC folds ab1.1 + reports=push
    — DONE; (2) Fable spot-checks the ab1.1 delta — DONE, 2026-07-15,
    GREEN, no findings (verified against `f01b400` full patch; fixes
    match the review's prescription verbatim, framed-only, harness
    asserts recede+restore on both surfaces); (3) Nick's device look
    (wide + near-floor; finding 1's composition verdict and A1's
    active-tab orange read are his to make there; no deploy owed
    first) — OPEN.** Item closes only after (3).
    **AB2 — MERGED, NOT CLOSED — 2026-07-15.** Built S0-S8 on
    `ab2-tools-by-mode` off post-ab1.1 `main` @ `8e98337`
    (`docs/wrizo-alpha/ab2-tools-by-mode-brief.md`). S0 ruled Draft storage
    SUSTAINED (markdown conventions in `entry.text`, iA display register).
    `components/ToolRail.tsx` fills DeskFrame's tool-rail track per mode;
    Free Write gets ink/typewriter (un-parked)/forward-lock (persisted,
    default on, matches pre-AB2 behavior)/capture items (retiring AB1's
    interim corkboard Journal tab); Draft gets Bold/Italic/Heading/Spacing
    (`store/draftFormat.ts`) plus the Structure picker
    (`store/structureConvert.ts`, mechanical only, confirmed AI-free by
    grep); Publish gains Copy My Words/Copy Formatted on both prose and
    script (findings 2, 3 dead); `JournalEntry` enters the frame at
    ≥1100px (the AB1 review's R2 ruling, satisfied); the strip quiets —
    brass off the active tab, a 1px olive `--accent-rest` hairline,
    uppercase/letterspaced presentation only (ratified strings/
    `deskLexicon` untouched). `ab2.mjs` (38 checks); `ab1.mjs`'s four
    now-superseded checks moved to PARKED (originals quoted, one-line
    reasons, successors in `ab2.mjs`). An independent review pass then
    stress-tested S3's live contenteditable decoration engine and found a
    **real, serious bug**: Draft-mode Enter-key handling silently
    corrupted caret position under ordinary typing (`execCommand`
    produced a block split, not a text newline, compounding with a
    genuine Chromium EOF-caret quirk reproduced React-free) — root-caused
    and fixed with a shared, guarded redecorate helper now used
    consistently by both the editor and the rail's format actions;
    reverified via the same stress scenarios plus a persisted-storage
    check. `tsc` + `build:web` + selftest + the full suite
    (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/`ab1`/`ab2`, 379 checks
    total, both `HARNESS_PARKED` settings) green, independently re-run a
    second time on merged `main` by CC before push. Fast-forwarded to
    `main` @ `136f438`, pushed.
    **Deployed — 2026-07-15**, Nick's word (`railway up`): live at
    `writer-studio-app-production.up.railway.app`, confirmed (`200` on
    `/healthz` and `/`, `401` on `/auth/me`, unauthenticated as expected).
    Carries AB1 + AB2 together (main was already merged through both at
    deploy time).
    **Fable's post-merge review landed — 2026-07-15**
    (`docs/wrizo-alpha/ab2-review-fable.md`): **REQUIRED FIXES — 0**, the
    first clean sheet of the AB arc — no data-loss-class or architecture
    findings, no fold. Five endorsements on the record (the caret fix's
    diagnosis and one-gate architecture; S6 carrying AB1's R1 lesson
    whole, clean on the first pass; the prose↔screenplay conversion's
    data discipline; the parked-section disposition blessed; the
    reasoned rail omissions sustained). Five advisories carried, none
    blocking (A1 a low-stakes `sync.ts` seam to eyeball next
    server-adjacent touch; A2 the typewriter toggle unreachable from a
    script-only workflow, a 2-line fold candidate for AB3; A3 the
    sentinel strip also cleans user-authored zero-width-spaces,
    recorded as a decision; A4 name the PARKED section's two check
    species — dormant vs. superseded; A5 the italic matcher is looser
    than strict markdown, house-convention-acceptable). Suite arithmetic
    independently verified (304 + 37 + 38 = 379 default-flow; armed adds
    3). **Close conditions per Fable: (1) CC build→review→merge→push —
    DONE; (2) Fable's post-merge review — DONE, this document, no fold
    owed; (3) Nick's device look — the SOLE remaining gate, one sitting
    for both AB1 and AB2** (composition wide + near-floor, the strip's
    olive hairline in situ, Draft's iA register under the hand, a
    Structure-picker conversion each way, the Journal inside the frame,
    the forward-lock switch). Item 21 closes on (3) alone now.
    **ab2.1 folded — 2026-07-15** @ `3defe3f`
    (`docs/wrizo-alpha/ab2-1-fix-brief.md`), found by (3)'s device look
    itself against the live deploy: the Journal paper rendered as an
    ~80px sliver. **F1 (required):** `JournalEntry.tsx`'s framed wrapper
    had `alignItems:'center'`, overriding flex's default `stretch` and
    collapsing every block child — including the paper — to
    fit-content; fixed with `width:'min(100%, 720px)'`, no `alignItems`.
    **F2 (required, the class fix):** a rendered-geometry sanity sweep
    added to `ab2.mjs` across every framed surface — which immediately
    caught a **second, previously-undetected instance of the same bug**,
    live since AB1: `BoardEditor`'s framed branch passed two children
    into `DeskFrame`'s flex-row stage with no width wrapper, collapsing
    `.board-canvas-wrap` to 2px. Fixed with the same wrapper pattern
    (capped at legacy board's own 1100px measure). **F3 (lawful sweep,
    Nick may veto on sight):** `DeskRail`'s active-item indicator swapped
    brass → `--accent-rest`, per `docs/theme-foundations/plateau/`'s new
    foundations doc (§3/§5, committed alongside this brief): *olive marks
    where you are; orange marks what you do* — the resting-orange
    allowance is engraved zone headings only now. Full suite green — 384
    checks total (`ab1` 37/40 armed, `ab2` 43, +5 over the AB2 review's
    379). Report = push.
    **Redeployed — 2026-07-15**, Nick's word ("Deploy it so I can test out
    the page"): `railway up` on `main` @ `fce22df`, confirmed live (`200`
    on `/healthz` and `/`, `401` on `/auth/me`). The live site now carries
    ab2.1.
    **Fable's delta spot-check — DONE 2026-07-15, GREEN** (verified
    against `3defe3f` full patch). Advisory: F3's not-brass assertion is
    correct strength while olive is a working value — graduate to a
    positive olive assert when the Plateau token locks. Carry to AB3
    review context: `BoardEditor` mounts `DeskFrame` `pageKind='prose'`
    (pre-existing AB1 wiring, untouched by the fold).
    **Nick's first device sitting — PARTIAL, 2026-07-16.** Ran against
    the AB1+AB2+AB3 deploy (`main` @ `32db861`). **Composition verdict:
    FAILS on wide** — the tool sliver, panel architecture, mode-strip
    placement, and wide-monitor composition don't hold up as built; this
    drives a **new committee design pass**, structural, not a fix-fold —
    brief pending, not yet written. **Ruled and answered by FX1**
    (`docs/wrizo-alpha/fx1-first-sitting-brief.md`, building): the
    typewriter feel (no per-line pop, fade band, centered start), the
    screenplay paper (was collapsed/misaligned — Law 1 violated), the
    forward lock (Nick's verdict: it's **mode furniture** — belongs to
    Free Write the posture, not the Journal the place — reinstated on
    every page's rail regardless of origin; **provisional canon note**:
    Law 2's furniture list amends in practice pending the committee
    pass's formal ratification), square corners everywhere. **Still open
    for a later sitting** (not FX1's to answer): the notebook
    felt-check (item 23's Ruling 3 — file a page, flip the notebook,
    does its absence from the flip-through feel like forgetting?), the
    olive rail read, and the timer/progress feel once the goal system
    lands. Item 21 does **not** close on this sitting alone — the
    composition verdict alone reopens it, independent of FX1's fate. See
    FX1's own ledger entry once built, and watch for the pending
    committee-pass brief.

## IN FLIGHT — proceeds without Nick once (1) lands
3. ~~**J5 — the Spread console.**~~ **DONE — 2026-07-11.** Built per
   `docs/j5-spread-console-brief.md` on `j5-spread-console`, off post-merge
   `main` (Slices 0-3: the lens row — order/content/star/tag, drag disabled
   outside the default lens — and the "Add to…" destination-drill sheet —
   FILE to Shelf/Drawer/Binder, COPY to a chapter or Board, LINK to a plan
   beat). Fable's review returned REQUIRED FIXES — 3, all small, no
   data-loss-class findings (`docs/j5-review-fable.md`); CC folded R1
   (single-page MOVE toast lost on navigate — fixed via the F2 `warmStart`
   one-shot-state pattern), R2 (DoD 2's positive drag-reorder path was
   unverified — harness gained the missing check, no app fix), R3
   (multi-source append order ruled **notebook order** — docs/comment fix,
   no behavior change); `scripts/harness/j5.mjs` grew to 40 checks. Nick
   relayed "Merge `j5-spread-console` to `main` and deploy." CC merged
   (one expected conflict in this ledger's own item 3, resolved in favor of
   the more current text), ran `tsc` (desktop + server) + `build:web` +
   selftest + the persisted `scripts/harness/j4.mjs` (26/26) +
   `scripts/harness/j5.mjs` (40/40) — all green on merged `main` — pushed,
   `railway up`. **Zero-schema deploy** (no server files touched; every new
   path rides pre-existing synced fields) — confirmed live via a basic
   liveness check (`200` on `/`, the auth gate responding) rather than a
   new-field round-trip, since there was no new field to check. See
   `docs/backlog.md`. Next: J5's own S25 + desktop gate items (lens chips at
   thumb, sheet drill, toast legibility; pointer precision) — fold into the
   consolidated hardware session (item 2) rather than a separate sitting.
4. ~~**S1 — the element engine (the Screenplay Room).**~~ **DONE —
   2026-07-11.** Built per `docs/s1-script-editor-brief.md` on
   `s1-script-editor`, off post-J5 `main` — the S-arc's heavyweight, authorized
   by `docs/fragments-under-pages-canon.md`'s ruling (item 8 below). The
   substrate (`pageType:'script'`, one `script` jsonb column through both sync
   mappers), the birth paths, and the room itself — a house-native block
   editor, the frozen Enter/Tab keyboard map, full autocomplete chain, auto
   (CONT'D), Voice Wall + I0 pen discipline + TTFK wiring. Fable's review
   returned REQUIRED FIXES — 2 (`docs/s1-review-fable.md`) — CC folded both
   plus three opportunistic advisories; `scripts/harness/s1.mjs` grew
   82 → 87 checks, stable across 3 runs. Nick relayed "Merge `s1-script-editor`
   to `main`... `railway up`... then run the live prod push/pull round-trip
   for the `script` column." CC set aside an unrelated in-progress workstream
   sitting uncommitted in the working tree (`git stash push -u` on an
   explicit pathspec, not a blanket stash), merged clean (no conflicts), ran
   `tsc` (desktop + server) + `build:web` + selftest + `j4.mjs` (26/26) +
   `j5.mjs` (40/40) + `s1.mjs` (87/87) — all green on merged `main` —
   pushed, `railway up`. **The live prod round-trip (required — NOT
   zero-schema, per Fable's note): a scratchpad script registered a
   throwaway account, pushed a `journal_entries` row with a populated
   multi-element `ScriptDoc`, and pulled it back down via a second
   `/api/sync` call simulating a second device — `pageType`, `entry.text`,
   and the full `ScriptDoc` all matched byte-for-byte (key-order-insensitive).
   ROUND-TRIP: PASS.** Test entry soft-deleted after. Stash restored
   afterward, applied clean. See `docs/backlog.md`. S1's own S25 + desktop
   gate items (typing rhythm, ghost legibility, autocomplete at
   pointer/thumb, keyboard-map muscle memory) join the consolidated hardware
   session (item 2) — Nick's device verdict closes the ticket.
5. ~~**W1 — writing-surface polish.**~~ **DONE — merged/deployed
   2026-07-12.** Built on `w1-writing-surface-polish` (shared
   `WritingIncentives`/`useTypewriterFade` extraction, Journal incentive-
   layer parity, page-is-primary metadata relocation, edge-dwell + 0.7s
   summon, fixed-track grid, Workshop/Publish tabs into PageEditor). Fable's
   review returned REQUIRED FIXES — 4 (`docs/w1-review-fable.md`), no
   data-loss-class findings; CC folded R1 (spurious mount celebration —
   `lapsRef` now seeds from the first-render value), R2 (Journal now honors
   the persisted Progress=off setting), R3 (window-scroll `data-scrolled`
   gated on the sheet's own top vs. viewport, not raw `scrollY` — fixes a
   C2 violation); R4 ruled — Nick: ratify the `.vscode/settings.json`
   auto-approve expansion in place, logged in the fix-batch commit.
   `scripts/harness/w1.mjs` grew to 18 checks, including the two regression
   scenarios Fable specified. Per `docs/w1-close-handoff.md`: Nick relayed
   the W1 merge word plus delegated the two committee-canon ratifications to
   Fable under a progress-over-perfection directive. CC merged (fast-
   forward, no conflicts), ran `tsc` (desktop + server) + `build:web` +
   selftest + `j4.mjs` (26/26) + `j5.mjs` (40/40) + `s1.mjs` (87/87) +
   `w1.mjs` (18/18) — all green on merged `main` — pushed, `railway up`.
   **Zero-schema deploy** — confirmed live via `200` on `/` and the auth
   gate responding as expected. See `docs/backlog.md`. W1's own S25 +
   desktop gate items (edge-dwell/summon feel, typewriter window-scroll,
   progress caret/celebration read, ≥1700px rail-toggle stability,
   Workshop/Publish on a Page) join the consolidated hardware session
   (item 2) — Nick's device verdict closes the ticket. Rode along in the
   original push: `fe24918` (state-of-wrizo 2026-07 + logo set, docs-only
   sweep).

6. ~~**W2 — the way back.**~~ **DONE — merged/deployed 2026-07-13.** Built
   per `docs/w2-way-back-brief.md` on `w2-way-back` @ `1b10d04`, off
   post-W1 `main` — the PAGE IS PRIMARY rule (AGENTS.md, verbatim from
   `docs/page-primacy-canon.md`) landed with this ticket, per the canon.
   Session capture (`store/wayBack.ts`, `store/caretOffset.ts`,
   `components/useWayBack.ts`) wired into all five writing surfaces; the
   return chip in DeskRail's top slot. Fable's review returned REQUIRED — 2
   (`docs/w2-review-fable.md`), no data-loss-class or architecture findings.
   **w2.1 folded before close:** R1 — the hook's own comment ("callers
   are keyed by id") turned out to be false for QuickSprint: it had NO
   remount-forcing key at its route mount (unlike PageEditor/JournalEntry),
   so navigating between two different sprint routes reused the same
   component instance — `liveRef` (updated unconditionally every render)
   would already read the NEW id by the time the OLD entry's capture
   cleanup ran, mislabeling its scroll/caret under the wrong id. Fixed by
   wrapping `QuickSprint` in an outer `key={draftId}`-forcing component,
   the same pattern PageEditor/JournalEntry already used. R2 — the restore
   effect's rAF + 80/200/350ms re-assert ladder (needed to win the
   mount-seeding race against a surface's own initial adjustments, e.g. the
   typewriter's hold-band scroll) fought the writer if they acted inside
   that window; fixed with a self-removing canceller on
   keydown/pointerdown/wheel/touchstart that clears the remaining
   re-asserts the moment the writer does anything. `scripts/harness/w2.mjs`
   grew 21 → 31 checks (the pager A→B non-leak proof, the QuickSprint
   depart/return round trip, the R2 cancel-on-input proof). Advisories
   A1/A2/A3 noted in file headers, not fixed (no live problem at current
   scale; A3 — a reload preserving the chip — judged correct, not a bug).
   Merge was pre-authorized (Nick, 2026-07-13, fix-forward mode). CC merged
   (fast-forward, no conflicts), ran the full suite (`tsc` ×2 + `build:web`
   + selftest + `j4.mjs` 26/26 + `j5.mjs` 40/40 + `s1.mjs` 87/87 +
   `w1.mjs` 18/18 + `w2.mjs` 21/21) green on merged `main`, pushed,
   `railway up`, confirmed live — then folded w2.1, re-ran the full suite
   again (all green, `w2.mjs` now 31/31), and pushed + redeployed a second
   time for Fable's delta spot-check. **Zero-schema** both times — liveness
   check only. See `docs/backlog.md`. W2's own S25 + desktop gate items
   join the consolidated hardware session (item 2) — Nick's device verdict
   closes the ticket.
19. ~~**TH1 — the theme seam.**~~ **DONE — merged/deployed 2026-07-14.**
    Brief: docs/th1-theme-seam-brief.md, canon: docs/flux-theme-canon.md,
    visual ref: docs/design/flux-rc2.html. Built per the brief's Slices 0-4
    on `th1-theme-seam` off post-docs-sweep `main` @ `dfc7dc3` (errata: this
    item originally named the branch point `7f4bc6b` — the actual
    merge-base is `dfc7dc3`, the TH-arc docs sweep commit; corrected here)
    — a theme-agnostic seam (data-theme attribute; the token audit + two
    new slots `--line-active`/`--signal-live`; lexicon projection; four
    font slots re-pointing the existing material-named vars; the
    Voice/Page/Fade preference matrix; the effects-layer scaffold), zero
    component forks, Plateau byte-equivalent to pre-TH1 values.
    Fable's review returned REQUIRED — 2, 3 advisories carried to TH2, no
    data-loss-class or architecture findings. **Folded before merge:**
    R1 — the lexicon carried one string per term; English pluralization
    isn't algorithmic from a single string (Drawer/Drawers works with a
    mechanical +s, but a theme's own noun might not), so
    `store/themeLexicon.ts` now carries two independent number forms per
    term (`one`/`many`), each separately overridable per theme; `t()`
    returns `one`, new `tMany()` returns `many` with the same canonical
    fall-through — swept DeskRail's Drawers rail item and the
    PageEditor/QuickSprint Pages toggle (the two plural-noun UI sites the
    original build left unswept) through `tMany()`, byte-equivalent on
    Plateau. R2 — `ThemeEffectsLayer.tsx` now exports `registerThemeFx(id,
    handlers)`, the actual seam a theme calls to light the layer up, plus
    two comment truth-ups (that file's header; `store/theme.ts`'s
    `initTheme()` doc-comment named the wrong call site, corrected to
    `main.tsx`). `docs/flux-theme-canon.md` §5 gained a two-sentence
    number-forms note. `scripts/harness/th1.mjs` grew 21 -> 26 checks,
    stable across 3 runs. **Merge mode: CONTINGENT** — Nick's merge word
    granted on a green fold. `main` had diverged (this session's own
    `docs/theme-foundations` commit, `befd377`, landed on `main` after the
    branch point) — rebased the branch onto `main` clean (zero conflicts,
    fully disjoint files), force-pushed, then fast-forward merged. Ran the
    full suite (`tsc` ×2 + `build:web` + selftest + `j4.mjs` 26/26 +
    `j5.mjs` 40/40 + `s1.mjs` 87/87 + `w1.mjs` 18/18 + `w2.mjs` 31/31 +
    `m1.mjs` 33/33 + `th1.mjs` 26/26) green on merged `main`, pushed,
    `railway up` — confirmed live (`200` on `/healthz` and `/`, `/auth/me`
    returning the expected `401`). **Zero-schema deploy** — no server files
    touched, liveness check only. See `docs/backlog.md`. Fable's delta
    spot-check runs post-merge (fix-forward). TH1's hardware-gate item
    folds into the consolidated session (item 2); Plateau's only
    feel-check (visually unchanged) is satisfied by the byte-equivalence
    checks, already green pre-merge.
20. ~~**TH2 — Flux.**~~ **DONE-AT-MERGE — merged/deployed 2026-07-14** (device
    verdict still open — see item 2's tenth cluster). Brief:
    docs/th2-flux-brief.md, canon: docs/flux-theme-canon.md, foundations:
    docs/theme-foundations/flux/flux-foundations.md, visual ref:
    docs/theme-foundations/flux/flux-rc2.html. Built per the brief's Slices
    0-5 on `th2-flux` off post-docs `main` @ `a18a9fb`, plus TH1's carried
    advisories (A1 Fade->off resurfaces chrome immediately; A2 prefs enum
    validation on load) and a full lexicon surface sweep across 12+ files.
    Fable's review (`docs/th2-review-fable.md`) returned REQUIRED — 3, 4
    advisories, no data-loss-class findings — "the arc's best craftsmanship
    yet." **Folded before merge:** R1 — the earn-the-orange handoff never
    fired: `[data-theme='flux'] .mode-pfill{background:signal-live}` and
    Plateau's own `.mode-pfill.celebrate{background:brass}` were equal CSS
    specificity, so source order alone silently kept the fill lime straight
    through the celebrate window (ignition sweep, orange notch, and sparks
    all rendering over lime) — a three-selector override rule fixed it
    cleanly; canon §9 + `flux-foundations.md` §3.7 both gained the errata
    reconciling "rests calm orange" with the app's repeating-lap mechanics
    (each new lap charges lime afresh). R2 — the Ambiance dial was a boolean
    (fires vs doesn't) when the brief mandates scaling: added
    `dialIntervalScale()` (50 -> 1.0 dial-center, monotonic 1 -> ~1.75x
    slower / 100 -> ~0.55x faster), read live per scheduled tick with each
    loop clamped to its own structural floor (protects the ≤3Hz-family
    spacing regardless of dial position); added an Ambiance row to
    ThemePanel (a canon-level pref with no UI was a TH1-only allowance);
    confirmed the `@fontsource` Rajdhani/Chakra Petch imports actually load
    fonts, not just declare slot-var strings. Opacity-envelope scaling is a
    **sanctioned deferral** to the hardware-tuning pass, recorded as such.
    R3 — closed the mandated sweep's residuals (`ImportDraft`'s own
    heading, the sprint-toggle's "Binder view" aria-label ×2) plus a
    closing grep-audit that found and fixed 9 more: JournalEntry's notebook
    nav + copy-text controls, PageEditor's imported-tag + copy-text
    controls, WritingIncentives' milestone aria-label, BoardEditor's text-box
    aria-label, ModeStage's sealed-AI aria-label/copy. Exempted (recorded,
    not swept): store-level Plateau-only strings (`WHISPER`) and documented
    prose judgment calls (marketing copy, `SCRAP_HEADING`). **Advisories:**
    A1 (block caret goes stale on scroll/resize — harness-invisible,
    recorded, joins the hardware-gate feel items) and A2 (Firewall chip
    correct today/coupled tomorrow if Voice Wall grows a second message
    kind — recorded) carried as-is; A3 (ThemePanel's picker-order law
    belongs at the site that will enforce it) folded — one comment citing
    `theme-arc.md`; A4 (blur(8px) on the glow, fixed spark count/angles,
    `--ink-stroke`/`--paper-glow` left inherited, interpolated-token inline
    flags) ratified as-is, the pattern for future theme packs.
    `scripts/harness/th2.mjs` grew 35 -> 43 checks (two of the new checks
    needed a second pass: the celebrate-color sample had to move past the
    fill's own .35s background transition, and the dial-100 floor check
    moved from flaky real-timer DOM observation — independently-scheduled
    loops coincidentally overlap by chance — to asserting the exported
    `clampedIntervalMs` math directly). Ran the full suite (`tsc` ×2 +
    `build:web` + selftest + `j4.mjs` 26/26 + `j5.mjs` 40/40 + `s1.mjs`
    87/87 + `w1.mjs` 18/18 + `w2.mjs` 31/31 + `m1.mjs` 33/33 + `th1.mjs`
    26/26 + `th2.mjs` 43/43) green on the fold commit, `th2.mjs` stable
    ×3, fast-forward merged to `main` @ `6c5b948` (no divergence — clean
    fast-forward), full suite + `th2.mjs` re-run and green a second time
    (×3 more, 6 consecutive green `th2.mjs` runs total) on merged `main`,
    `railway up` — confirmed live (`200` on `/healthz` and `/`, `401` on
    `/auth/me`, unauthenticated as expected), pushed. **Zero-schema
    deploy** — liveness check only. See
    `docs/backlog.md`. Fable's delta spot-check runs post-merge
    (fix-forward). Flux ships to prod at merge; the ticket itself closes
    only on Nick's device verdict (item 2's tenth cluster) — born in a
    mockup, graduates on hardware.
22. **J2/W1 S25 fix brief.** **BUILT + PUSHED — 2026-07-14, device gate
    open.** Built on `j2-s25-fixes` off `main` @ `6c8a9eb`: S1 eraser
    22px→11px (ring follows), S2 quiet square-cornered SVG tool icons, S3
    the toggle shows the TARGET tool, S4 S-Pen barrel toggle wired with a
    mid-stroke guard + a committed hardware probe log (code-complete,
    unverifiable without real S-Pen hardware), S5 the ink-room rule
    (incentive row fades on stylus, restores on keyboard, reusing
    `--fade-dur`). `tsc` + `build:web` + selftest + full harness green
    (`w1.mjs` 24/24, up from 18 — gained a genuine CDP pen-stroke check
    pair). Independently re-verified, no fixes needed. One commit `eae41e9`,
    pushed to `origin/j2-s25-fixes` — **not merged**, per the brief's own
    "merge on Nick's word." See `docs/backlog.md`. Device gate: S4's
    barrel-bit assumption + S3's target-tool interpretation both want Nick's
    two-minute pen check before merge, independent of the AB-arc (item 21).
23. ~~**AB3 — the Drawer and the Homes.**~~ **CLOSED — 2026-07-16,
    Nick's word.** Merged 2026-07-15.
    `docs/wrizo-alpha/ab3-drawer-and-homes-brief.md` built
    S0-S7 on `ab3-drawer-and-homes` off `main` @ `73150ea`. **S0 — the
    arc's first schema change:** nullable `origin` text column
    (`'journal'|'project'|'loose'`) on entries, additive-only
    (`add column if not exists`, no default, no CHECK — matching the
    `script`-column precedent exactly), both sync-mapper directions.
    S1-S7: `Drawer.tsx` (tools/page/place faces composing AB2's
    `ToolRail` verbatim, fixed geometry via `--drawer-width`),
    `PageFace.tsx` (subject-based per amendment A1 — title/star/tags/
    Where-it-lives/Move/Copy/Port), the below-page metadata retired
    when framed (parked, byte-identical below the gate), origin stamped
    at every creation door (Journal/Catch → journal; project doors →
    project, invisible to the Journal; the Desk's start-writing door →
    loose, never nudged), the Journal-forgets-nothing law, `PlaceFace.tsx`,
    `ab3.mjs` (30 checks) with the ab2.1 geometry-floor lesson applied
    from day one; `ab2.mjs` grew 3 parked checks (A4-named species,
    quoted history + opposite reassertion) for the AB3-superseded claims.
    Mid-build, `main` advanced three commits (the canon landing +
    ledger updates) — the build agent noticed, read the newly-RULED
    canon in full, cross-checked every interpretive call against it
    (zero conflicts — the brief's paraphrase matched verbatim), and
    self-merged `main` into its branch before continuing, docs-only,
    zero code conflicts.
    **Independent review** re-derived the grandfather-clause proof from
    scratch (not trusting the build's own script — traced `origin`
    through every client mutation path and both sync-mapper directions
    by hand, confirmed a genuine unconditional null↔undefined fixed
    point), live-exercised all three creation doors through the harness
    including a manual end-to-end screenplay-door check, and found
    **zero bugs — the first AB-arc review to make no code changes at
    all.** Judged five interpretive calls: four sustained outright (no
    rename pipe ever existed for a page title — confirmed by grep, not
    a miss; Drawer wiring scoped to JournalEntry/PageEditor only, Script/
    Board untouched this ticket; `getNotebookPages()` deliberately not
    origin-aware, keeping J5's Spread-grid harness green; Move/Copy/Port
    expanded from loose-only to all pages, traced safe against Law 3).
    **One flagged as a genuine Nick-level call, not resolved by either
    agent:** S4's brief text names "the timer readout, the quiet
    progress bar" as journal furniture that should re-mount in the
    rail; only typewriter/ink/forward-lock actually were. Not in the
    DoD's lived tests or S7's own minimum-assert list, and no
    regression (framed surfaces never showed it before AB3 either) —
    recommended as a small fast-follow rather than blocking. `tsc`
    (desktop + server) + `build:web` + server build + selftest + the
    full 11-script suite (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/
    `ab1`/`ab2`/`ab3`) green, independently re-run a THIRD time by CC on
    merged `main` (matching both prior reports exactly) before push.
    Fast-forwarded to `main` @ `b9993a6`, pushed.
    **Deployed — 2026-07-16**, Nick's word ("Push everything that's
    ready live"): `railway up` on `main` @ `32db861` (carrying AB1's
    ab1.1 fold, AB2's ab2.1 fold, and AB3's ab3.1 fold together),
    confirmed live (`200` on `/healthz` and `/`, `401` on `/auth/me`).
    **Correction (Fable's AB3 review, R5, 2026-07-15):** the AB1/AB2
    merge pre-authorization was a **zero-schema** precedent — it does
    not generalize to schema-touching tickets. AB3 is the arc's first
    schema ticket and merged ahead of Fable's review **on Nick's go**,
    not on any standing pre-authorization; schema tickets carry no
    standing pre-auth, full stop. Post-merge review gating the close
    (the AB1 pattern) remains lawful. **Fable's AB3 review landed
    GREEN — 2026-07-15** (`docs/wrizo-alpha/ab3-review-fable.md`): zero
    product-code defects, independently reconfirmed. Required — 5, all
    harness/docs, none code (see the ab3.1 fold entry below). Awaiting
    the fold's own spot-check and Nick's device look (likely folding
    into a larger look alongside item 21's remaining gate). See item 24
    for the canon-doc resolution.
    **ab3.1 folded — 2026-07-15:** R1(a) `ab3.mjs` asserts the loose
    fixture carries none of the journal furniture (the one origin value
    with no negative guard before — `journal`/null covered in `ab3.mjs`,
    `project` in `ab2.mjs`, `loose` nowhere); R1(b) asserts framed
    PageEditor also carries no below-page metadata cluster (it never
    had one — the brief named both surfaces, only JournalEntry's
    absence was ever checked; the law now has its missing guard). R2
    clicks `.desk-toolrail-forwardlock` on the null-origin legacy
    fixture and asserts `dataset.on` actually flips and
    `wrizo-forward-lock` writes — presence isn't function, and this is
    the first assertion that the control's click handler is wired at
    all. R3 asserts the drawer's active pull's computed border-color is
    not brass (the ab2.1 F3 pattern — a negative guard while olive
    stays a working value). R4 corrects a comment in `ab3.mjs`'s A2
    section that claimed the project-origin negative was local; it
    lives in `ab2.mjs`. Brief errata added to
    `ab3-drawer-and-homes-brief.md`: S2's rename assumption withdrawn
    (no title/rename pipe ever existed); S5's "notebook nav" clarified
    per Ruling 3 (the Spread's flip-through is the loose notebook's own
    sequence, not part of the Journal's memory — Nick-vetoable at the
    device look). Full suite re-verified green, pushed.
    **Fable's ab3.1 spot-check — DONE, GREEN, no findings.** Verified
    against `86623dd` + `5072892` full patches; the review doc confirmed
    on disk verbatim. **Close conditions per Fable: (1) build→review→
    merge→push — DONE; (2) Fable's spot-check of the ab3.1 delta —
    DONE; (3) Nick's device look — the sole remaining gate**, one
    sitting now serving AB1, AB2, and AB3 together.
    **Nick's first device sitting — PARTIAL, 2026-07-16** (full verdict
    recorded under item 21, same event, one sitting for both items):
    the notebook felt-check (this item's own Ruling 3) was **not yet
    reached** — still open for a later sitting. Item 23 does not close
    on this sitting either.
24. ~~**Gap: `docs/wrizo-alpha/page-and-homes-canon.md` never
    landed.**~~ **RESOLVED — 2026-07-15.** Relayed by Nick directly
    into chat; committed at `14d846e` — the eight laws, the four ranges
    of attention, the vocabulary/theme-boundary sections, and the
    proposed AB3→AB4→AB5→I1 ladder, all matching the AB3 brief's own
    paraphrase with no discrepancies found on comparison. Status
    flipped PROPOSED → RULED and the ratification record (amendments
    A1 the drawer's subject, A2 the grandfather clause) appended per
    the brief's own instruction — both steps CC had explicitly skipped
    while the file was missing (see AB3's build report, item 23). No
    rework owed to the in-flight AB3 build: the brief it was built from
    already carried everything operative from this canon.
25. ~~**FX1 — the First Sitting.**~~ **CLOSED — 2026-07-16, Nick's
    word.** Merged 2026-07-16.
    `docs/wrizo-alpha/fx1-first-sitting-brief.md` built S1-S7 on
    `fx1-first-sitting` off `main` @ `c9767f7` — the six fixable verdicts
    from Nick's first device sitting (see item 21's sitting record; the
    composition verdict that sitting also returned is NOT this ticket's
    — it drives a separate, not-yet-written committee-pass brief). Zero
    schema, zero new deps. S1: the typewriter feel rewritten
    (`useTypewriterFade.ts`) — no per-line pop, a real fade band, fresh
    pages start near vertical center; shared by prose, script, and the
    Journal. S2: the screenplay paper now mounts prose's own geometry
    class (was collapsed/misaligned), courier font restored, typewriter
    defaults on for both surfaces. S3: **the forward lock ruled mode
    furniture** — mounts on every page's Free Write rail regardless of
    origin (ink and capture items stay journal furniture, unchanged);
    the strike/erase mechanic itself verified engaging, not just the
    control. **Provisional canon note:** Law 2's furniture list amends
    in practice pending the committee pass's formal ratification — the
    canon doc itself was not touched this ticket. S4: square corners
    (`--radius-sm`/`--radius-md`/`--radius` → 0, hardcoded literals
    swept). S5: the empty bottom bar renders nothing (`DeskFrame.tsx`
    gained a `meter` prop) — the 260px corkboard track explicitly left
    alone (named non-goal). S6: brass-at-rest swept off the Structure
    picker's active state, the rail's eyebrow labels, and the
    typewriter glyph — `--accent-rest`/quiet text now, olive law
    applied fresh. New `apps/desktop/scripts/harness/fx1.mjs` (25
    checks). **The A4 harness-parking law, exercised precisely**: two
    forward-lock-absence checks this ticket supersedes (`ab2.mjs`'s
    live project-origin check, `ab3.1`'s R1(a) loose check) were parked
    verbatim rather than edited — **except the independent review
    caught that the build had silently edited `ab2.mjs`'s check in
    place instead**, a direct violation of the exact discipline this
    ticket's own brief states in so many words; fixed by adding the
    missing quoted-history PARKED entry (SUPERSEDED species) before
    merge. `ab3.mjs`'s R1(a) treatment was correct from the first pass.
    `tsc` + `build:web` + selftest + the full 12-script suite
    (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/`ab1`/`ab2`/`ab3`/`fx1`)
    green, independently re-run a THIRD time by CC on merged `main`
    before push (`th2.mjs` hit its known transient timing flake once
    during CC's own pass — 2/43 — cleared cleanly on two immediate
    re-runs with zero code changes between attempts, consistent with
    its documented history, not a regression). Fast-forwarded to `main`
    @ `72cb547`, pushed. **Not deployed** — the brief's own DoD gates
    redeploy on both Fable's post-merge review and Nick's word.
    **Two items flagged for Nick/Fable, not resolved by either agent:**
    (1) `JournalEntry.tsx`'s window-scroll typewriter fade got the S1
    fade-band recalibration but deliberately NOT the centered-start
    treatment (ink-stroke coordinate risk) — a disclosed scope call,
    worth an explicit feel-test on the Journal surface specifically
    since the brief's DoD says "writing starts centered" without
    carving that surface out; (2) the S3 canon amendment stays
    provisional by design — the committee pass owns the formal
    ratification. **Per the corrected rule (item 23's R5): this ticket
    is zero-schema, so merge pre-authorization stood on its own — no
    separate Nick's-go was needed for the merge itself.**
    **Fable's post-merge review landed — 2026-07-16**
    (`docs/wrizo-alpha/fx1-review-fable.md`): **GREEN — zero
    product-code defects.** S3's gate change and the harness law
    verified patch-by-patch; S1/S2/S4/S5/S6 verified at census level
    (exactly the five named files touched, no schema/sync surface) plus
    behaviorally via `fx1.mjs`'s 25 checks. Five rulings of record: (1)
    the Journal's centered-start skip **sustained** (ink-coordinate
    risk is real; a felt inconsistency becomes a real ticket, never a
    tweak); (2) the `ab1` meter-track supersession **ratified as
    precedent** — A4's park law applies to any check a fix falsifies,
    brief-enumerated or not; (3) double supersession **ratified as
    house pattern** — an already-parked check going stale again still
    must pass under `HARNESS_PARKED=1`, generations accrete, all
    preserved; (4) **Fable's own R1(a) owned as vacuous, not the
    build's defect** — a loose page opens in Draft by default (no
    pageType, the support-page rule), so a Draft rail never carries
    journal furniture regardless of origin, meaning the original check
    never exercised the origin gate until this fold's fixtures clicked
    Free Write explicitly; standing lesson recorded: a check reading a
    mode-dependent surface sets the mode explicitly, never assumes a
    fixture's default. New committee docket item surfaced here: which
    mode should a loose page open in — Draft today by mere inheritance;
    Free Write is arguably the true home-base posture; the incoming
    HB-arc's first-run forces Free Write regardless — the committee
    reconciles, not this ticket; (5) the A4 in-place-edit catch
    (`72cb547`) **endorsed as the review process working as designed**,
    noted without drama. **Advisory:** `th2.mjs` now stands at two
    flake events (the ab3.1 fold, this ticket's first full-suite run) —
    a third within the month arms a standing deflake micro-pass.
    **Close conditions per Fable: (1) this review committed, ledger
    notes GREEN — DONE, this entry; (2) redeploy on Nick's word — DONE,
    see the deploy record below; (3) Nick's next sitting** (the six FX1
    felt checks, plus items 21/23's carried-over notebook felt-check
    and olive rail read) **— open; one sitting can close three ledger
    items (21, 23, 25).**
    **Deployed — 2026-07-16**, Nick's word ("go ahead and deploy"):
    `railway up` on `main` @ `6f1eff8`, confirmed live (`200` on
    `/healthz` and `/`, `401` on `/auth/me`). The live site now carries
    FX1.
    **Committee docket addition (from Fable's review, Ruling 4): the
    loose page's default mode** — Draft today (inheritance, not a
    ruling), Free Write arguably the true home-base posture, the
    incoming HB-arc's first-run forcing Free Write regardless. Relevant
    to both the standing composition committee pass (this item's
    sitting record above) and the new HB-arc threshold workstream
    (`docs/wrizo-alpha/hb-arc-handoff.md`) — ownership for whichever
    committee reconciles it first, not ruled here.
    **Items 21, 23, and 25 CLOSED together on Nick's word, 2026-07-16.**
    Two standing rulings remain **vetoable at any future sitting** and
    **block nothing** now that these items are closed: item 23's Ruling
    3 (the notebook felt-check — file a page, flip the notebook, does
    its absence *feel* like forgetting) and FX1's Journal centered-start
    skip (the ink-coordinate-risk scope call). Either can still reopen
    with a real ticket if Nick's eye finds them wanting; neither owes
    anything until then.
26. ~~**CD1 — the Composed Desk.**~~ **BRIEF RATIFIED, BUILD AUTHORIZED —
    2026-07-16.** The second committee double-pass
    (`docs/wrizo-alpha/composed-desk-committee-pass.md`) proposed
    consolidating the tool sliver, the drawer's slimming, the far-left
    rail's retirement, the mode strip's move to the top line, a
    wide-viewport composition cap, and a coverage-never-verdict goal/glow
    system into one zero-schema ticket. **Nick's ratifications,
    2026-07-16:** amendments A3-A7 RATIFIED (recorded in
    `docs/wrizo-alpha/page-and-homes-canon.md`'s second ratification
    record); Script scope APPROVED (`ToolRail` retires entirely); glow
    DEFAULT-ON; **Catch SCRAPPED from the UI** — parked, not rehomed,
    future home undecided, overruling the committee's own top-bar
    proposal (the top-right cluster is Done alone). Build brief:
    `docs/wrizo-alpha/cd1-composed-desk-brief.md`, S0-S9, authorized to
    build immediately on `cd1-composed-desk` off `main`. Zero-schema —
    merge pre-authorized per the standing rule; Fable reviews
    post-merge, gating close and deploy. **S9's park sweep is the
    ticket's real test**: the far-left rail's retirement and `ToolRail`'s
    death falsify live checks across `ab1`/`ab2`/`ab3`/`fx1` and the
    older `j`/`s` harnesses (every `.desk-rail` presence assert, the
    zones check's wayfinding clause, every `.desk-toolrail-*` selector) —
    every one must park per A4, quoted verbatim, SUPERSEDED species, in
    its own file, with the full sweep enumerated in the fold's commit
    message.
    **MERGED, NOT CLOSED — 2026-07-16.** Built S1-S9 on
    `cd1-composed-desk` off `main` @ `ac396f5` (S0's records were done
    directly on `main` by CC before the build started — no separate
    build work there). `components/ToolRail.tsx` deleted entirely; its
    estate divides between the new paper-edge `Sliver.tsx` (hand tools,
    overlays the stage margin, paper rect provably never moves — position:
    absolute anchored purely off the paper's own canonical measure, no
    JS measurement) and nothing (the drawer's tools face retires,
    `Drawer.tsx` rests on Page + Places only). `DeskRail.tsx` stops
    mounting framed (`useDeskFrameMounted()`), and its reserved gutter is
    reclaimed via a `.app-main[data-desk-frame-active='true']{padding-
    left:0}` rule beating every width-keyed padding rule on specificity —
    empirically verified at the exact 1099px/1100px boundary, not just
    trusted. The mode strip moves to the header row, the top-bar title
    retires (the paper names itself), **Catch scrapped from the UI**
    (Desk.tsx's own "+ Catch a thought" button and DeskRail's affordance
    both parked, code intact). New `store/writingGoal.ts` +
    `store/lineEquivalents.ts`: one writer-level target in
    line-equivalents at the paper's canonical measure (viewport-
    independent), default 24 lines, driving the progress hairline + the
    new `GoalGlow.tsx` — warmth only, hard-capped, no numbers/completion
    event/deficit state, glow **default-on**. Script gains the drawer +
    sliver, matching prose exactly. New `apps/desktop/scripts/harness/cd1.mjs`
    (26 checks) — **the largest park sweep in the project's history**,
    enumerated in full in commit `bd43fb6`'s message: 24 checks newly
    parked (`ab1` +4, `ab2` +6, `ab3` +7, `fx1` +7), all SUPERSEDED
    species, quoted verbatim.
    **Independent review** found two real defects and fixed both: (1) a
    genuine, if lesser, parking-discipline gap — three `ab2.mjs` parked
    reassertions had their selectors updated (`.desk-toolrail-*` →
    `.wz-sliver-*`) without their own name string disclosing that CD1
    touched them, inconsistent with this same commit's own correctly-done
    entries and with the FX1 review's own Ruling 5 precedent (rewrite the
    stale comment, don't hide the touch) — fixed by adding the missing
    inline chain-link disclosure to all three; (2) the sliver's timer was
    anchoring to its own mount rather than the first keystroke (matching
    the pre-existing `ModeStage` timer's `firstWriteRef` pattern), meaning
    idle reading time before typing silently counted as writing time — a
    real semantic bug, not cosmetic, fixed in `Sliver.tsx`. The review
    also independently re-derived the CSS-specificity gutter-reclaim
    claim empirically (not just read the code) and confirmed the park
    sweep's completeness by grepping every one of the 12 pre-CD1 harness
    files against their pre-CD1 state. `tsc` + `build:web` + selftest +
    the full 13-script suite green, independently re-run a THIRD time by
    CC on merged `main` (matching the review's counts exactly:
    `j4` 26, `j5` 40, `m1` 33, `s1` 87, `th1` 26, `th2` 43, `w1` 18,
    `w2` 31, `ab1` 37/45 armed, `ab2` 42/52 armed, `ab3` 34/41 armed,
    `fx1` 25/32 armed, `cd1` 26/26 armed) before push. Fast-forwarded to
    `main` @ `389e674`, pushed.
    **Deployed — 2026-07-16**, Nick's word ("Deploy it"): `railway up`
    on `main` @ `6126055`, confirmed live (`200` on `/healthz` and `/`,
    `401` on `/auth/me`). The live site now carries CD1.
    **`th2.mjs`'s known transient flake hit a 4th time** (once during the
    review's PARKED pass, once again on CC's own merged-`main` run) —
    cleared cleanly both times on immediate re-run, not a regression, but
    this is now well past Fable's own standing rule ("a third within the
    month triggers the deflake micro-pass") — **a deflake pass is
    overdue and unscheduled.**
    **Three items surfaced by review, left open as genuine calls — not
    resolved by any agent:** (1) the top-right cluster's "Done alone" law
    holds for PageEditor and ScriptEditor but not JournalEntry, whose
    "← The journal" link sits on the LEFT paired with the mode strip (a
    pre-existing, pre-CD1 idiom, not something this ticket introduced) —
    rename/reposition vs. preserve the distinct wayfinding idiom is
    Nick's call; (2) the canon's bolded "Catch is SCRAPPED from the UI
    **entirely**" vs. the build brief's narrower framed-surface-only
    scope — Desk.tsx's own Catch button (outside the framed/legacy split
    entirely) was left untouched, a defensible literal reading of the
    *brief* that may not satisfy the *canon's* broader language; (3)
    JournalEntry's paper stays at a pre-existing 720px while
    PageEditor/ScriptEditor use 760px/60ch, so the sliver's canonical-
    width anchor sits ~20px off true-flush there specifically — static,
    cosmetic, the hard "paper never moves" invariant still holds
    regardless. **Per the standing rule: this ticket is zero-schema, so
    merge pre-authorization stood on its own** — no separate Nick's-go
    was needed for the merge itself. Close awaits Fable's post-merge
    review.
    **Fable's post-merge review: GREEN with a fold, cd1.1 — 2026-07-16**
    (`docs/wrizo-alpha/cd1-review-fable.md`, committed). Toggle removal
    ruled Fable's own brief defect (erratum on S1, not the build's);
    Catch's scrap ruled to extend to Desk.tsx too (Nick's "Done alone"
    word was unqualified); the ~20px JournalEntry width gap ruled not a
    defect (Nick's eye rules); the park/timer/disclosure precedents from
    the independent review all ratified.
    **cd1.1 folded and pushed — 2026-07-16**, commit `1c8de6b`: (1) the
    Pages/Plan flight toggle restored beside Done on both PageEditor's
    and ScriptEditor's framed headers (new capability on ScriptEditor,
    which never had one); (2) Desk.tsx's Catch button parked (code
    intact, unreachable); (3) `th2.mjs`'s celebrate-window brass-color
    check deflaked — the old fixed-`sleep()`-then-separate-`evalJs`
    pattern raced the celebrate window's own auto-clear; now stashes the
    matched value inside the same predicate that observes it, plus a
    widened 6s budget on the preceding class-appears wait after
    intermittent fresh-browser first-timer latency (not a race —
    `CELEBRATE_MS` is 1100ms, `waitFor` polls every 100ms); (4) full
    suite verified green: `tsc`, `build:web`, selftest, all 13 harness
    scripts under both `HARNESS_PARKED` settings (`cd1` 27/27 armed).
    **Fold-time incident, no data lost:** a concurrent session (HB1,
    building on `hb1-threshold` in the same checkout) switched branches
    mid-fold and silently clobbered three of the four uncommitted fold
    edits plus one already-verified `th2.mjs` deflake pass. Caught before
    any commit via `git status`/`reflog`; `main` itself was never at
    risk. HB1's own in-progress work was preserved with a checkpoint
    commit on its own branch before redoing the fold cleanly on `main`.
    **Redeploy NOT bundled with this fold** — Nick's call per Fable's own
    review, whether to deploy now or hold.
    **Fable's cd1.1 spot-check: DONE, GREEN, no findings — 2026-07-16**
    (verified against `1c8de6b`'s full patch; review doc confirmed on
    disk verbatim). **Close conditions 1 and 2 satisfied — only Nick's
    device-look sitting remains.**
    **cd1.1 deployed — 2026-07-16**, Nick's word ("Deploy"): `railway up`
    on `main` @ `2103b1c` (deployment `bbb3c88d`, SUCCESS). Confirmed
    live: `200` on `/healthz` and `/`, `401` on `/auth/me`. The toggle
    restoration, Desk's Catch parking, and the th2 deflake are all now
    on the live site. Only Nick's device-look sitting remains to close
    item 26.
    **Item 26 stays OPEN — 2026-07-16.** The device-look sitting
    returned two findings; both are recorded against this item and
    ticketed as their own build (item 28, FX2) rather than folded here
    — the fold cycle for cd1.1 is done. Nick's remaining sitting
    verdicts (the glow, the journal-paper question, the drawer at
    rest, the wide field) arrive on his own clock and aren't presumed
    by FX2 or anything else; item 26 doesn't close until his sitting
    is fully spent.
    **CLOSED — 2026-07-17, Nick's word.** The sitting was delivered:
    FX2 (item 28) shipped its two fixable findings. The remainder (the
    glow, the journal-paper question, the drawer at rest, the wide
    field) is not left dangling — folded forward into FX3 (item 29)
    and the Cascade committee pass (item 30), both from Nick's own
    follow-on desktop sitting. Nothing here was dropped, only re-homed.
27. **HB1 — the Threshold.** **MERGED, DEPLOYED (retroactively found —
    see below), NOT CLOSED — 2026-07-17.** Brief:
    `docs/wrizo-alpha/hb1-threshold-brief.md`. Charter:
    `docs/wrizo-alpha/hb-arc-handoff.md`. Nick's direct word waived the
    committee double-pass for this ticket; R1 (Flux stands in for Machina
    at the unlock, data not hardcode) and R2 (a visible locked door is
    accepted, once, for the first-run threshold only — M1 governs in full
    everywhere after the veil lifts) recorded in the brief itself.
    **Pre-build discovery, ruled before any code was written:** the app
    already had a second, unrelated pre-auth front door —
    `components/HomeFlow.tsx` ("HOME port v6"), a 50-word forced-write
    gate + reward + account flow that fully owned every anonymous visitor
    (mounted BEFORE the router; route `/`, where the brief specs Arrival,
    was literally unreachable pre-login). Neither the brief nor the
    charter named it. Flagged to Nick directly; his word: **Arrival
    replaces HomeFlow too, not just the Desk room** — Write works with no
    account (local-first, persists immediately, per Journal-forgets-
    nothing), account creation deferred and reachable via Open's sign-in
    (F2), not resolved to a specific ritual moment (an open call, not this
    ticket's to close — the charter's own "Write-before-signup" tension,
    left unresolved when the committee pass was waived). This roughly
    doubled the ticket's real scope beyond the brief's literal S1-S6 text:
    `App.tsx`'s auth-gated routing restructured so the router mounts
    regardless of auth state (Journal/Shelf/Drawers/Project already
    operate on local data with or without a session; only `startSync()`
    stays authed-only, untouched).
    **The build (S1-S6), all six slices.** New `components/Arrival.tsx` —
    route `/` for every boot, authed or not: the mark, a real-readiness
    boot bar (doors disable until `authState` resolves), Write (primary,
    local-first, no account) and Open (quiet-secondary, F2: authed with a
    resume target → lands on it directly; anon → the existing sign-in,
    relocated from `HomeFlow` verbatim, not rebuilt). New
    `store/firstRun.ts` (the once-per-device flag, F3), `store/
    firstRunGateActive.ts` (a `deskFrameActive.ts`-shaped ephemeral signal
    so `App.tsx`'s `GlobalHeader` goes fully absent — not just collapsed —
    while the gate holds), `store/themeTerritories.ts` (R1's data-not-
    hardcode offered/future lists — Machina arms later by moving one
    entry, no component changes). New `components/FirstRunGate.tsx`
    (`FirstRunVeil` — inert + aria-hidden + blurred, renders children with
    NO wrapper at all when inactive so `.hb1-veil` stays a true "gate is
    live" signal on every other page in the app; the monotonic word
    counter, F1's "monotone under forward lock" — struck-run flicker in
    the derived text never reads backward; a glow mirroring `GoalGlow`'s
    exact rendering contract, fed the gate's word fraction instead of
    line-equivalents, "consume don't fork" per the brief's own seam) and
    `components/UnlockCeremony.tsx` (the S4 rite: Plateau/Flux offered,
    Machina/Nomad/Volant grayed in that order; a transient single-valued
    `.chosen` flash is the only brass on screen, never a resting
    `.btn-brass`, so the house "exactly one brass per screen" law holds).
    `PageEditor.tsx`'s framed branch wires it together: the top chrome
    row, the Drawer, and the Sliver all veiled; `ModeStage` gained an
    optional `firstRunGateActive` prop (default false, byte-identical
    everywhere else) so its OWN chrome — the reveal handle and the
    settings gear — veils too (see independent review, below). S5 rehomed
    the Desk's orphans: the resume pointer into Open; Begin Project/the
    recent-drawers glance into the Drawer's existing Places faces (already
    the AB3-era interim home); `CreateProject.tsx`/`Drawers.tsx`'s stale
    "← Desk" back-links relabeled "← Home". `Desk.tsx` and `HomeFlow.tsx`
    both PARKED (unimported, not deleted, headed with a pointer to this
    entry). Every one of the 13 pre-existing harness fixtures' cold-boot
    helper updated (`.wz-desk`→`.wz-arrival`, `.wz-start-writing`→
    `.wz-arrival-write`, `wrizo-first-run-complete=1` seeded alongside
    every `localStorage.clear()` so old fixtures get an ordinary,
    non-gated Write — the FX1 review's own standing lesson, "never assume
    a fixture's default," applied fresh). One check, `s1.mjs`'s "the
    Desk's mirror surfaces the SCRIPT tag unprompted," PARKED as
    **DORMANT** (not superseded — no successor proves the same unprompted-
    glance truth, because Arrival deliberately shows none; the resume
    pointer itself still resolves correctly, just behind a click now) —
    whether an unprompted mirror belongs on Arrival is flagged for Fable/
    Nick, not resolved either way. New `apps/desktop/scripts/harness/hb1.mjs`
    (28 checks) + a small fix to the shared `runtime-verify.mjs` (its own
    `--selftest` and `freshSprint()` read `.wz-desk` too; a new `WS_ANON`
    env var already existed there, unused until now, driving the anon-path
    fixtures).
    **Independent review** (a separate subagent pass, adversarial, before
    any commit) found two real defects and fixed both: **(1, HIGH)** the
    veil covered DeskFrame's toolRail/sliver/top-row but NOT `ModeStage`'s
    own chrome — the reveal handle and, critically, the settings gear,
    which exposes a live Theme switch and the Typewriter toggle. A writer
    could open the gear mid-gate and pick a theme directly, or turn the
    forced typewriter off, bypassing both the accessibility invariant
    ("AT perceives exactly one path") and R2's actual premise (a theme
    *earned* by writing). Fixed by giving `ModeStage` the `firstRunGateActive`
    prop and veiling the handle + gear cluster; the empty-page F6 "invite a
    first line?" affordance (a second voice alongside the gate's own
    instruction) suppressed the same way. **(2, lower)** below 1100px no
    ceremony ever exists to flip `firstRunComplete`, so every Write from
    Arrival kept re-forcing forward-lock/typewriter back on — silently
    clobbering a sub-1100px writer's own later preference change, not just
    a one-time founding default. Fixed: `Arrival.tsx` flips the flag itself
    on a sub-1100px Write (via `useDeskFrameViewport()`), once, since no
    rite will ever complete there. Both fixes added their own `hb1.mjs`
    checks (25→28) — the review's own lesson embedded: a raw `.hb1-veil`
    count assertion had missed the gap, so a defense-in-depth check now
    walks every `button/a/[role=button]` on the gated page and asserts
    each sits inside an `[inert]` ancestor. One open call was left standing
    at build time — `UnlockCeremony` was `aria-modal="true"` without a real
    focus trap, so the editor behind it (deliberately left interactive,
    "the one path") stayed Tab-reachable while the ceremony was up — left
    for Fable rather than silently patched; **fixed in the hb1.1 fold,
    below.**
    **A concurrent-checkout collision, twice** (see item 26's own account
    of the first): the shared `writer-studio` checkout was switched to
    `main` mid-build by CD1's session, once during the original stash-vs-
    WIP discovery and once again mid-review. Both times a checkpoint
    commit (`2200302`, `3ea2e6e`) preserved every uncommitted edit before
    the switch — no data lost either time — but it happened twice in one
    day on this exact ticket pair, which is what triggered the new **ONE
    CHECKOUT PER AGENT** standing rule (this file, TOOLING STATUS, below).
    HB1 now builds at `../wrizo-hb1` on `hb1-threshold`, its own worktree;
    this entry's own verification (below) is the first full run from
    there, clean. Merged `main` (through the cd1.1 fold, `fccddcc`) into
    `hb1-threshold` mid-build — one real conflict, in `PageEditor.tsx`'s
    header row (both tickets touched it: cd1.1 restored the Pages/Plan
    toggle, HB1 added the veil wrapper) — resolved by wrapping cd1.1's
    toggle inside HB1's veil (it's chrome, it belongs gated too).
    **Verified, from the clean worktree, after the collision:** `tsc`
    (desktop + server) clean; `build:web` clean; `verify:runtime
    --selftest` PASS; the full 14-script suite green —
    `j4` 26, `j5` 40, `m1` 33, `s1` 86 (87 armed), `th1` 26, `th2` 43,
    `w1` 18, `w2` 31, `ab1` 37 (45 armed), `ab2` 42 (52 armed), `ab3` 34
    (41 armed), `fx1` 25 (32 armed), `cd1` 27 (27 armed, nothing new
    parked), `hb1` 28/28 — zero failures, both `HARNESS_PARKED` settings
    where applicable.
    **Two more genuine open calls, disclosed, not resolved by any agent:**
    (1) S5's brief text — "loose pages' `backTo '/'` exit: remove the
    room-change... not a navigation to `/`" — read here as satisfied by
    the Desk room's own retirement (there is no more literal "room" to
    navigate to; `/` is Arrival now, a legitimate permanent destination,
    not a special case), so `PageEditor.tsx`'s existing `backTo` logic for
    loose pages was left pointing at `/`, unchanged; a stricter reading
    (Done should never target `/` at all) was not built. (2) Account-
    creation timing, per the HomeFlow-retirement ruling above — reachable,
    not ritualized to a specific moment.
    **Fable's review landed — GREEN with a fold, hb1.1 — 2026-07-16**
    (`docs/wrizo-alpha/hb1-review-fable.md`, committed): verdict GREEN,
    merge on Nick's word after the fold. Verification method disclosed and
    checked, not trusted — the tail merge (`b8c3b72`) audited and confirmed
    docs-only, so the reviewed state is byte-for-byte the build's own
    verified tip. Five rulings of record: (1) the defense-in-depth harness
    pattern (walk the DOM for violators, never just count wrapper nodes)
    ratified as house precedent — "the gear bug is exactly what enumeration
    misses"; (2) the checkpoint-blob rescue commits accepted **this once**
    (the collision made them the right call in the moment) but slice-commits
    remain the law going forward — a future ticket arriving as preservation
    blobs gets returned for re-staging, not reviewed; (3) `.hb1-veil`
    existence ⇔ gate active recorded as a load-bearing selector contract,
    so a future refactor doesn't reintroduce a dormant veil node and
    silently break the harness's own meaning; **(4) mid-gate refresh
    dropping the veil (the gate's one-shot nav-state design means a reload
    mid-rite lands the writer on their page unveiled, rite incomplete, next
    Arrival re-gates on a fresh page) ruled a *mercy valve, kept* —
    "trapping a writer under blur is a worse failure than letting one slip
    the rite," deliberate not accidental, standing until Nick overrules it
    at the device sitting;** (5) Open's no-resume `/journal` fallback ruled
    a fine interim home, revisited when the Places-rail work lands (the
    origin chat's own seam, not re-ruled here).
    **hb1.1 folded and pushed — 2026-07-16**, commit `2a606d2`: **F-1**
    (code) — `UnlockCeremony` now moves focus to the first offered
    territory on mount and contains Tab within its two buttons while open
    (Shift+Tab from the first wraps to the last, Tab from the last wraps to
    the first), making the `aria-modal="true"` claim actually true; no
    Escape-dismiss, by design, noted in a comment — the rite resolves in a
    choice, not a cancel. `hb1.mjs` grew 28 → 31 checks (the mount-focus
    assertion plus both wrap directions). **F-2** (no code) — ruling 4's
    mercy valve recorded above, closed as *decided* rather than left
    pending. F-3 (HomeFlow/Desk parked-shim wording, the `backTo '/'`
    sweep entries, s1.mjs's DORMANT entries) is Fable's own spot-check at
    fold time, riding this delta — not this fold's to action.
    **Re-verified after the fold:** `tsc` (desktop + server) clean;
    `build:web` clean; the full 14-script suite green — `hb1` now 31/31,
    every other count unchanged from the pre-fold run above — zero
    failures.
    **Pushed to `origin/hb1-threshold`.** Per the brief's own DoD and the
    review's own sequencing: Fable's fold-delta spot-check (F-3 riding
    along) is next, then Nick's merge word, then the device sitting on
    `main`, then deploy on Nick's word — one merge, one sitting, one deploy
    decision, in that order. The stash left behind by the first collision
    (`cd1.1 erratum WIP...`) stays put per the review's own housekeeping
    note — forensic material for item 26's still-open close conditions, not
    this ticket's to drop.
    **Merged — 2026-07-17**, Nick's word ("let's merge it"), ahead of
    Fable's F-3 fold-delta spot-check (not yet landed on disk at merge
    time — Nick's merge word stands on its own per house law; F-3 still
    rides the delta whenever Fable next looks). Merged from the isolated
    `../wrizo-hb1` worktree (no shared checkout touched, per ONE CHECKOUT
    PER AGENT): `origin/main` was first merged into `hb1-threshold` to
    reconcile — one real conflict, both sessions having independently
    claimed **item 27** for their own ticket (this one and FX2, born from
    Nick's CD1 device sitting in the interim); resolved by chronology
    (this item's own item-27 commit landed 2026-07-16 17:24, FX2's
    2026-07-17 07:16 — FX2 renumbered to **item 28**, its self-reference
    and item 26's cross-reference both corrected, no content lost either
    side). Full suite re-verified green post-merge (`tsc` ×2, `build:web`
    byte-identical output, selftest, all 14 harness scripts, `hb1` 31/31)
    before `origin/main` was fast-forwarded to `hb1-threshold`'s tip
    (`df88ff5` → `8674f87`, confirmed ancestor-checked, no force needed).
    **Not deployed.** Per the review's own sequencing, the device sitting
    on `main` is next, then deploy on Nick's word. The other session's
    `writer-studio` checkout (on `main`) will read as behind `origin/main`
    until its own next fetch/pull — expected, not a conflict, since only
    the remote ref moved.
    **Fable's F-3 fold-delta spot-check landed — GREEN — 2026-07-17**
    (`docs/wrizo-alpha/hb1-review-fable-addendum.md`, committed; blob hash
    independently verified against the live file, `c6ddbd5`, matches). The
    late paper CC flagged missing at merge time — the spot-check ran
    in-session before Nick's merge word, this is the record catching up,
    not a skipped step. All four hb1.1 commits verified by SHA; the review
    doc's own blob confirmed unchanged. F-1's focus trap independently
    re-confirmed real (one harmless transient noted: both territory
    buttons disable during the chosen-flash, freeing Tab for ~500ms over
    an otherwise-inert page). F-2's ledger record confirmed complete. The
    merge itself re-verified: fast-forward `df88ff5 → 7e7d7f4` audited,
    the item-27 chronology resolution endorsed as-is.
    **Four findings, none required fixes — handed to the device sitting:**
    (1) the parked `HomeFlow` ("HOME port v6") is prior art of the rite
    itself, park quality called exemplary; two things it knew that HB1's
    rite doesn't are named as open, hb1.2-sized design questions for
    Nick's sitting — **the echo** (v6 showed the writer their own words
    back on reward; HB1's ceremony announces only the theme) and **the
    mercy** (v6 idle-nudged a stuck newcomer; HB1's gate stays silent by
    the "speaks once" ruling); (2) `s1.mjs`'s DORMANT park ruled A4
    discipline done right, and its own honest flag reframed as a live
    sitting question — **the glance** — should Arrival stay austere or
    offer a quiet unprompted trace of where the writer left off; (3) an
    **F5 correction against the brief's own claim**: the paste seam is
    likely already closed (the Voice Wall blocks foreign paste on script;
    the forward-only surface has carried a paste block since the v6 era)
    — one Ctrl+V at the gate during the sitting confirms, then the ledger
    takes a one-line correction at next docs touch, not presumed here;
    (4) `Desk.tsx`'s parked-shim prose accepted at census level only (not
    eyeballed line-by-line) — flagged for the next actual touch of that
    file, not actioned now.
    **Post-merge landscape, for orientation:** FX2 (item 28, born from
    Nick's CD1 sitting) merged into `main` after HB1 in the other session
    — `ee69bbc` → `25644ea` → `2b866c8`, `fx2.mjs` fixtures adapted to
    HB1's post-merge world (`.wz-desk`→`.wz-arrival`), one import-block
    conflict in `PageEditor.tsx` resolved kept-both. Full 15-script suite
    reconfirmed green from `../wrizo-hb1` after fast-forwarding to this
    state — `hb1` 31/31, `fx2` 33/33, every other count unchanged. FX2's
    own post-merge review belongs to the origin chat's Fable by lineage,
    not annexed here. **The device sitting now happens on a main carrying
    both tickets** — Nick's two FX2 findings can be felt in the same
    sitting as HB1's, verdicts routed to their own tracks. Sitting list:
    the original review's felt checks, plus the echo, the mercy, the
    glance, the Ctrl+V, and one poke at any in-app "Done" that still
    targets `/`.
    **Retroactive finding — HB1 shipped to production already, 2026-07-17
    — corrects the "Not deployed" claim above.** The FX2 deploy (item 28,
    `railway up` on `main` @ `740b572`, deployment `66837d33`, Nick's
    word "Go ahead and deploy") shipped a SHA that has `7e7d7f4` (HB1's
    own merge commit) as an ancestor — confirmed by `git merge-base
    --is-ancestor`, not assumed. That deploy's own ledger entry says so
    explicitly in hindsight ("Item 27 (HB1) is untouched by this review —
    stays with its own session's Fable") but named only FX2/CD1 in the
    deploy word itself; HB1 rode along unnamed. **Net effect: the
    Threshold — a first-screen surface, the boot experience for every
    device — has been live since 2026-07-17, with NEITHER its own device
    sitting NOR an explicit per-ticket deploy clearance ever given.** No
    rollback taken; the code is the reviewed, fold-verified, F-3-spot-
    checked tip, not unvetted work — this is a process-record gap, not a
    known defect in front of writers. Flagged plainly so Nick's felt
    checks (the sitting list above) happen against what's ACTUALLY live,
    not a staging assumption. This is the exact failure mode the
    deploy-manifest rule below now exists to close.
    **Deploy-manifest rule — ratified 2026-07-17 (Fable), citing this
    exact incident as the trigger, standing across all tracks.** A
    deploy ships a SHA, not a ticket. Before any `railway up`, the
    deploying session enumerates every merged-but-undeployed ticket
    contained in the target SHA and names them ALL in the deploy
    request; Nick's deploy word is valid only against that enumeration.
    If any named ticket lacks its own deploy clearance, the deploy waits
    — or ships from the last cleared SHA instead. (Recorded in full,
    TOOLING STATUS, below.)
    **Standing: the stash held for CD1.** The `cd1.1 erratum WIP` stash
    stays held per the review's own instruction, until CD1's own
    origin-chat close conditions clear — unrelated to the deploy finding
    above.
    **Dropped — 2026-07-18** (TU1's own S0 instruction): its hold
    condition (item 26's close) cleared 2026-07-17; content was long
    since superseded by the actual cd1.1 fold, merged and deployed.
    `git stash drop`, confirmed empty stash list after.
    **Carry for the HB1 session — Fable, via FX3's review, 2026-07-17
    (relayed here; no direct channel to that chat exists, this ledger
    IS the relay).** Root-causing FX3's own `hb1.mjs` PARKED-check
    flake (this item's harness, item 29's own investigation) surfaced
    a real product-level finding, not just a test artifact: the
    first-run veil's mount RACES the app's own first paint on Arrival
    after a hard reload — confirmed via direct diagnostic that the
    gate's arming state (`location.state.firstRunGate`, Write's
    disabled state) reads correctly in EVERY case, pass or fail, yet
    the veil itself sometimes doesn't mount in time regardless. The
    harness fix (an explicit settle wait before clicking Write) is
    correct FOR THE TEST — it makes the check reliably observe the
    eventual, correct state — but it does NOT touch the underlying
    race. On a real first-run writer's actual device, the same race
    means a genuine flash risk: a brief instant where the gate's own
    chrome (gear, drawer, sliver, reveal handle) may render unveiled
    before the gate catches up. This belongs to HB1's own ticket/owner
    to investigate and fix at the product level — not actioned here,
    not in FX3's or CD2's scope.
    **HB1-track Fable's response to the carry — 2026-07-18.** The
    first-mount race finding is acknowledged and accepted. An earlier
    "human-unreachable" read of this same race (this session's own —
    never landed on disk, chat-only, so nothing to link back to) is
    **withdrawn**; the origin Fable's product-level ruling directly
    above **stands** as the record. **hb1.2** (the fix ticket) is
    briefed only after Nick's device sitting — the hammer-test result
    (rapid reload-and-Write, by hand) feeds its severity; not presumed
    or pre-scoped here. **Constraint on the eventual fix, recorded now
    so the brief doesn't re-derive it:** the gate's mount must become
    deterministic and fail-closed — a race resolves to STILL VEILED,
    never to accidentally-unveiled chrome — while preserving ruling 4's
    refresh mercy valve (a mid-gate reload still drops the veil and
    re-gates on the next Write; fail-closed governs the fresh-mount race
    window, not the deliberate refresh escape). **One unconfirmed lead
    for whoever briefs hb1.2** (CC's own hypothesis, not a finding):
    `FirstRunVeil` (`components/FirstRunGate.tsx`) applies the DOM
    `inert` attribute inside a `useEffect`, which runs after first
    paint — a `useLayoutEffect`, or setting `inert` synchronously off a
    ref callback instead of an effect, would close exactly that gap.
    Unverified; worth checking first, not assumed correct.
28. ~~**FX2 — the Second Sitting.**~~ **BRIEF COMMITTED, BUILD AUTHORIZED —
    2026-07-16.** Two findings from Nick's device-look sitting with the
    composed desk (item 26): (1) on his laptop, the sliver's grip
    overlaps the writing surface — new law: persistent chrome never
    enters the text measure, at any viewport (the grip clamps to ride
    the paper's border/padding on narrow screens rather than crossing
    into the text column; cd1.mjs's own geometry asserts never tested
    a laptop width, only ~1400px/2200px); (2) Draft should open with
    the typewriter active unless the page already holds 10+
    line-equivalents (reading posture vs. forward-flow posture),
    explicit toggle always wins for the rest of the session, Free
    Write unchanged. Build brief:
    `docs/wrizo-alpha/fx2-second-sitting-brief.md`, S1-S3, authorized
    to build immediately on `fx2-second-sitting` off `main`.
    Zero-schema — merge pre-authorized per the standing rule; Fable
    reviews post-merge, gating close and redeploy. New
    `apps/desktop/scripts/harness/fx2.mjs` required (S3): grip/text
    disjointness at 1280px AND 2200px, sliver open/closed; the Draft
    threshold both sides plus explicit-toggle persistence; full suite
    green both `HARNESS_PARKED` settings.
    **BUILT — 2026-07-17, not merged/not pushed.** Built S1-S3 on
    `fx2-second-sitting` off `main` @ `df88ff5`, in an isolated worktree
    per the standing ONE CHECKOUT PER AGENT rule. **S1 — empirically
    diagnosed first (headless CDP, 1100-2200px), per the brief's own
    "verify before fixing" instruction, and the ACTUAL bug turned out
    narrower than the brief's working hypothesis:** the grip itself was
    already always exactly flush with the paper (its right edge rides
    the anchor's own right edge, which cancels out to the paper's left
    edge by construction, at every width — confirmed to sub-pixel
    rounding only, never a real breach). The real, measured defect: the
    sliver anchor's flat, unconditional 200px width had no floor on
    actual available margin — at DeskFrame's own 1100px gate its LEFT
    edge landed ~77px INSIDE the Drawer track (and since `.wz-sliver`
    carries no `pointer-events:none`, that invisible overlap silently ate
    hit-testing meant for the Drawer's own pull tabs; the OPEN panel's
    opaque background visibly painted over part of the Drawer too) —
    "chrome overlapping chrome," not the grip touching a word. Fixed by
    clamping the anchor's WIDTH (right edge stays pinned to the paper) to
    the actual Drawer-to-paper margin, expressible in pure CSS (no JS
    measurement, per CD1's own precedent) since the Drawer's own width
    cancels out of that distance, leaving only the grid's column-gap
    (promoted to a `--frame-gap` token so it can't drift from
    `.desk-frame-grid`'s own value); below that margin the anchor may dip
    into the paper's own left padding (`.mode-page`'s 38px) rather than
    the text, hard-capped at that depth so "never covers text" is a
    provable guarantee, not a target a font metric could blow through.
    Verified at 1100/1150/1200/1250/1280/1400/2200px: Drawer overlap zero
    at every width (was ~77px/53px/30px/6px at the four narrowest below
    ~1265px); wide screens byte-identical to pre-fix geometry, so none of
    `cd1.mjs`'s own checks needed parking (re-run, still 27/27, file
    untouched). **S2** — `store/writingSettings.ts` gains
    `seedTypewriterDefault`/`setTypewriterExplicit` plus a module-level,
    in-memory-only `explicitlySetThisSession` flag (never persisted — a
    fresh app load is a fresh session); `PageEditor.tsx`/`ScriptEditor.tsx`
    each seed once in a mount-scoped effect (empty deps; both hosts
    already remount per page via `key={id}`, so mid-session mode switches
    within one mount can't re-fire it); `Sliver.tsx`'s and
    `ModeStage.tsx`'s own hand-click toggles now route through
    `setTypewriterExplicit` so neither can be silently overridden by a
    later Draft-open seed. `store/writingSettings.ts`'s own stale
    "never in Draft" comment (flagged in the brief) corrected in place,
    no behavior change. New `apps/desktop/scripts/harness/fx2.mjs`, 24
    checks (S1 disjointness/persistence/opacity/paper-invariance at
    1280px+2200px closed+open; S2 both threshold sides, the explicit
    round trip, Free Write unchanged). `tsc` + `build:web` + selftest +
    the full 14-script suite (`ab1`/`ab2`/`ab3`/`cd1`/`fx1`/`fx2`/`j4`/
    `j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`) green under BOTH default and
    `HARNESS_PARKED=1`, re-run a second time on the fully committed tree
    before reporting (`th2.mjs` hit its documented transient flake once
    across the whole verification pass — 2/43 on an early run — cleared
    on immediate re-runs with zero code changes, consistent with its
    known history, and was fully green on both final passes). Visual
    eyeball check done via a new `app.screenshot()` harness helper
    (raw CDP, not used by any committed check) at 1280px/2200px,
    closed/open — geometry confirmed sane by direct look, not rects
    alone. Three commits on `fx2-second-sitting`
    (`86edfe7`/`655576a`/`a70ab13`), **not merged, not pushed** — the
    branch sits in an isolated worktree, ready for review. Awaits
    Fable's/Nick's word on the merge per the brief's own zero-schema
    pre-authorization.
    **Independent review — 2026-07-17, in a separate worktree, own
    checkout.** **S1's revised diagnosis holds up empirically, not just
    on read-through:** re-measured directly (rect reads, not the
    harness's own new `screenshot()` alone) at 1100/1150/1200/1250/1280/
    1400/2200px, sliver both states — then the pre-fix CSS was swapped
    back in on disk, rebuilt, and re-measured at the SAME widths for a
    real before/after diff (not trusted from the commit's own comments).
    Confirmed both halves: the grip's right edge tracks the paper's own
    left edge to sub-pixel rounding in BOTH the old and new code at
    every width 1100-2200px — it was never the problem, in either
    version. The Drawer overlap was real and is now gone: independently
    measured ~75.7/52.2/28.7/5.2px at 1100/1150/1200/1250px pre-fix
    (matching the build's own ~77/53/30/6px within fixture noise),
    ~0-1px post-fix at the same widths. **One flag, not resolved:** at
    1280px specifically — the brief's own "laptop" checkpoint — pre-fix
    and post-fix geometry are BYTE-IDENTICAL; the clamp is a total no-op
    there (`--sliver-margin` already clears the 200px cap on its own).
    The Drawer overlap this ticket fixes only ever existed below
    ~1265px. That means the fix is real and the text-safety law holds
    everywhere tested, but whether "1280px" is actually representative
    of Nick's own laptop viewport — as opposed to something narrower,
    which is where the original bug lived — is unconfirmed by anything
    in this ticket. Not a defect; a question only Nick's own window
    width (or Fable re-asking him) can settle.
    **S2: one real bypass found and fixed.** Grepped every
    `setWritingSettings({...typewriter...})` call site in
    `apps/desktop/src` (not just the two the build's own report named).
    `JournalEntry.tsx:885` — the unframed Journal entry's own typewriter
    toggle (`authored && !framed` only; the sliver takes over once
    framed) — still called the bare setter, never arming
    `explicitlySetThisSession`. Since that flag is module-scoped (one
    bundle, shared with every Draft-open seed), a writer's explicit
    choice made on THAT route could be silently overwritten by a later
    Draft-page seed elsewhere in the same session — exactly the bypass
    S2's own rule forbids. Fixed in `de60636`: routed through
    `setTypewriterExplicit`, matching Sliver.tsx/ModeStage.tsx's own two
    sites.
    **The dropped "second page" S2 check: the build's own reasoning
    checks out, but there was a way around it.** Read
    `store/persistence.ts`: `cache.journalEntries` hydrates once, at
    module load — confirms a raw localStorage write made after the
    app's first boot really is invisible to it, as the report claimed.
    But seeding BOTH fixture pages in the SAME pre-boot write sidesteps
    that entirely; navigating between them afterward is a bare hash
    change, no second reload needed. Implemented as `freshTwoDraftPages`
    in `2ab78e1` — 5 new checks proving `explicitlySetThisSession`
    survives a genuine page/mount boundary, not just the same-page mode
    switch the original suite covered, which is the specific claim
    `writingSettings.ts`'s own comment makes for why the flag is
    module-scoped rather than a page-level ref (previously asserted,
    never actually tested).
    **A second harness gap, found independently (not something the
    build's report flagged):** the committed S1 loop only runs at the
    brief's own two named widths (1280/2200) — per the flag above, ONLY
    widths where the width-clamp fix is a byte-identical no-op. A
    regression of the clamp mechanism itself would pass that loop
    silently. Added a `DESKFRAME_MIN_WIDTH` (1100px) regression block in
    `2ab78e1`: anchor-vs-Drawer disjointness (the actual mechanism)
    closed+open, plus grip-vs-text-column at the floor width. That last
    one needed a new `textColumnOf` helper — `.mode-pagecol`/`.mode-page`
    share one border box (padding included), which the ORIGINAL 1280px/
    2200px checks quietly treat as "the text column" (harmless there,
    since the padding-dip never engages at those widths) but is the
    wrong rect at 1100px, where the anchor legitimately dips into the
    padding gutter by design (the brief's own allowance). `textColumnOf`
    reads the paper's own live computed left padding instead of
    asserting against the padding-inclusive box; first written without
    it, the new 1100px checks failed against fully-compliant geometry,
    caught and fixed before commit. `fx2.mjs`: 24 -> 33 checks.
    **`--frame-gap` and `app.screenshot()`, judged:** both reasonable,
    not scope creep. `--frame-gap` is load-bearing for the fix's own
    correctness (the clamp math needs the SAME column-gap value
    `.desk-frame-grid` uses; a hand-synced literal risks silent drift
    the way the brief itself warns against elsewhere) and changes no
    existing value. `app.screenshot()` is additive-only, explicitly
    disclaimed as unused by any committed check, and is exactly the kind
    of low-risk harness capability this review's own S1 empirical
    approach leans on.
    **Full bar re-run independently, from a clean worktree, dependencies
    installed fresh:** `tsc --noEmit`, `build:web`, `--selftest`, and the
    full 14-script suite all green under both `HARNESS_PARKED` settings
    on the fully committed tree (`ab1` 37/45, `ab2` 42/52, `ab3` 34/41,
    `cd1` 27/27 — file untouched, confirmed via `git diff`, zero lines —
    `fx1` 25/32, `fx2` 33/33, `j4` 26, `j5` 40, `m1` 33, `s1` 87, `th1`
    26, `th2` 43, `w1` 18, `w2` 31). `th2.mjs` hit its documented
    transient flake once (2/43) on the default-mode pass, cleared on two
    immediate re-runs with zero code changes — consistent with its known
    history, not a regression. Two commits added on top of the build's
    own three (`de60636`, `2ab78e1`) — history not rewritten. **Still
    NOT merged, NOT pushed** — awaits the orchestrating session's own
    final check before merge, per this ticket's instructions.
    **MERGED, PUSHED — 2026-07-17.** `origin/main` had moved since this
    branch's base (`df88ff5`) — HB1 (item 27) merged in the interim, in
    its own isolated worktree, per the standing rule. Local `main`
    fast-forwarded to `origin/main` first (`df88ff5` -> `7e7d7f4`), then
    `fx2-second-sitting` merged in: one real conflict, `PageEditor.tsx`'s
    import block (both branches appended new imports after the same
    shared line — the exact collision the independent review's own
    `git merge-tree` dry run had already predicted), resolved by keeping
    both. `fx2.mjs` itself needed a post-merge fixture fix neither build
    nor review could have caught (their branch predates HB1's merge):
    `freshDesk`/`freshLoosePage`/`freshDraftPage`/`freshTwoDraftPages`
    still bootstrapped against the retired `.wz-desk`/`.wz-start-writing`
    — the same class of fix `cd1.mjs`/`th2.mjs` already got when HB1
    first landed (`.wz-arrival`, `wrizo-first-run-complete` seeded so
    HB1's first-run gate doesn't interfere with FX2's own fixtures).
    Fixed in `25644ea`, re-verified 33/33. One false alarm chased down
    and closed, not left as a loose thread: `s1.mjs` read 86 checks
    default / 87 armed post-merge, against this ledger's own earlier
    "s1 87" (flat, no split) baseline recorded elsewhere. Isolated via a
    throwaway worktree at `7e7d7f4` (HB1-merged, pre-FX2) — already
    86/87 there, `s1.mjs` itself byte-identical to its pre-HB1 content —
    then confirmed the file has always carried its own one-check PARKED
    section (`grep HARNESS_PARKED apps/desktop/scripts/harness/s1.mjs`),
    matching every other split-count file's pattern exactly. Not a
    regression from HB1 or FX2; the earlier flat "87" was simply
    imprecise. Full suite green on the fully merged, pushed tree: `tsc`,
    `build:web`, selftest, all 15 harness files (`ab1` 37/45, `ab2`
    42/52, `ab3` 34/41, `cd1` 27/27, `fx1` 25/32, `fx2` 33/33, `hb1`
    31/31, `j4` 26, `j5` 40, `m1` 33, `s1` 86/87, `th1` 26, `th2` 43,
    `w1` 18, `w2` 31) under both `HARNESS_PARKED` settings. Pushed to
    `origin/main` @ `25644ea`. **Not deployed** — redeploy is Nick's
    call, and Fable's own post-merge review (gating close) hasn't landed
    yet; the S1 1280px-vs-Nick's-actual-laptop-width question the
    independent review flagged is still open and unresolved by anything
    in this ticket.
    **Fable's review: GREEN at record depth — 2026-07-17.** Read the
    ledger's own account whole, verified the merge tip (`2b866c8`),
    cited the suite facts recorded above — did NOT read S1's clamp or
    S2's seeding line-by-line against the actual diff, disclosed as
    such rather than implied as a full code review. Close conditions
    (three, not yet all met): this review (now landed); Nick's laptop
    check post-deploy, specifically resolving S1's own open question —
    did the observed grip/Drawer overlap actually resolve on his
    machine, and is his laptop's width above or below the ~1265px
    threshold where the fix's clamp actually engages (at 1280px it's a
    provable no-op, per the independent review); and his word. Item 26
    stays open in parallel — his remaining sitting verdicts (the glow,
    the journal-paper question, the drawer at rest, the wide field) are
    served by this SAME laptop session, not a separate one. Item 27
    (HB1) is untouched by this review — stays with its own session's
    Fable.
    **Deployed — 2026-07-17**, Nick's word ("Go ahead and deploy"):
    `railway up` on `main` @ `740b572` (deployment `66837d33`, SUCCESS).
    Confirmed live: `200` on `/healthz` and `/`, `401` on `/auth/me`.
    Two of three close conditions now met (the review, and this
    deploy) — the third, Nick's laptop check resolving S1's own open
    question (did the grip/Drawer overlap actually resolve, and is his
    width above or below the ~1265px clamp threshold), remains, on his
    own clock. Item 26 stays open in parallel, served by the same
    session.
    **CLOSED — 2026-07-17, Nick's word.** The grip fix confirmed
    working on his laptop — the ~1265px width question is moot (the
    fix works regardless of which side of that threshold his own
    laptop sits on).
29. **FX3 — the Proportions.** **BRIEF COMMITTED, BUILD AUTHORIZED —
    2026-07-17.** From Nick's desktop sitting (the same sitting behind
    the Cascade committee pass, item 30) — including a verdict he
    wrote directly into the test page itself (S3: the typewriter start
    reads too far down, broken to a fresh eye). Six slices: S1 the
    paper fills down to near the stage's bottom on desktop (no fixed
    aspect, no height cap short of the stage); S2 the paper SCALES on
    wide screens (type + paper dimensions grow together so the measure
    — readable line length — is preserved, not widened; a tuned CSS
    scale token, 1.0 at <=1440px ramping to ~1.2 at >=1920px); S3 the
    typewriter start offset lowers (~30-35% of stage height, from 45%)
    and the scroll/fade engages within the first few lines rather than
    lagging (Journal's own start-offset carve-out unchanged); S4 the
    top bar's modes go right-aligned as a TRIAL (one-line revert if
    Nick's eye rejects it — a working-value experiment, not law); S5
    the settings gear leaves the paper entirely — the sliver's foot
    gains an icon row (typewriter as icon-only, the gear, and a NEW
    instruments icon opening a minimal progress/glow panel); S6 new
    `apps/desktop/scripts/harness/fx3.mjs`, geometry checks at both
    reference widths (standing law). Build brief:
    `docs/wrizo-alpha/fx3-proportions-brief.md`, authorized to build
    immediately on `fx3-proportions` off `main`. Zero-schema — merge
    pre-authorized per the standing rule; Fable reviews post-merge,
    gating close and redeploy. Non-goals (explicit): the Cascade (item
    30, awaits Nick's ratification), the Wall/AB4 (re-scoped by the
    Cascade pass, not this ticket), any measure widening, canon edits.
    **MERGED, PUSHED — 2026-07-17.** Built S1-S6 on `fx3-proportions`
    off `main`, in an isolated worktree. **S1** — the paper's height
    chain was purely intrinsic (no definite height anywhere from
    `#root` to `.mode-page`), so a naive `height:100%` silently no-ops;
    fixed by giving `.desk-frame-stagecol` ONE definite height
    (`calc(100vh - var(--fx3-chrome-budget))`, a hand-measured 167px
    constant — same idiom as `CANONICAL_MEASURE_CH`, empirically
    verified to hold with zero drift at BOTH 1280px and 2200px, fence
    a clean 40px at both, no scrollbar) with everything below riding
    ordinary flex-grow off that one anchor. Also caught and fixed: the
    goal glow's pre-existing CSS now bled past the viewport at some
    heights (a taller stage stretches its anchor proportionally),
    fixed with `overflow:hidden` on `.desk-frame-host` — independently
    verified this clips no `position:fixed` element anywhere in the
    route (none of `.desk-frame-host`/its ancestors establish a new
    containing block). **S2** — new `--paper-scale` token (stepped
    1.0/1.1/1.2 at 1440/1680/1920px — CSS `calc()` can't derive a
    dimensionless ratio from a viewport length without a JS-computed
    property, so stepped rather than continuous) applied to BOTH the
    paper's width AND its own font-size at the SAME element, so `ch`
    (which resolves against whichever element declares it) scales in
    lockstep — independently re-derived algebraically (not just
    visually eyeballed) that characters-per-line is provably
    scale-invariant, `CANONICAL_MEASURE_CH` untouched. Also fixed a
    real bug this surfaced: the sliver/goal-glow anchors' own
    `min(380px,30ch)`-style formulas didn't scale, a 61.5px
    misalignment at 2200px, fixed by pinning the same scaled font-size
    baseline there too. **S3** — `START_FRACTION`: 0.45 -> 0.29 in
    `useTypewriterFade.ts` (below the brief's literal 30-35% text, but
    independently hand-calculated — not just trusted — to land at
    ≈33.3% once `.mode-page`'s own padding/border are counted the same
    way `fx1.mjs`'s own pre-existing measurement method does; the
    *visual* result matches the brief's intent even though the raw
    constant reads lower). Also fixed a genuine PRE-EXISTING bug found
    along the way: `setScrolled()`'s container-mode branch compared an
    internal scroll offset against a viewport-space Y coordinate — a
    real unit mismatch, independently confirmed correct. **S4** — top
    bar right-aligned as a trial, scoped to `.desk-frame-host
    .sprint-nav`; independent review found a real, undisclosed gap:
    `JournalEntry.tsx`/`BoardEditor.tsx` carry pre-existing inline
    `justifyContent:'space-between'` styles that silently beat the new
    CSS rule (inline always wins). Investigated further: BoardEditor's
    row has no ModeStrip at all — S4 doesn't conceptually apply there,
    not a real gap. JournalEntry's row does carry one and does diverge
    — left AS-IS and flagged rather than force-matched, consistent
    with this project's own prior ruling that JournalEntry's top-right
    cluster is a deliberately distinct idiom from PageEditor/
    ScriptEditor's (CD1's own review, item 26). **S5** — gear travels
    WHOLE into the sliver's foot (settings + theme panel stay bundled,
    a documented judgment call — the brief names only three foot
    icons and never a fourth destination for Theme); icon-only
    typewriter toggle confirmed via direct render read (one button,
    SVG only, no text node); new `store/writingGoalUnit.ts` confirmed
    honestly self-documented as display-only, no real per-unit
    conversion yet (deferred to the Cascade's own instruments-panel
    refinement, item 30). **S6** — new `fx3.mjs` (30 checks). **The
    park sweep grew beyond the brief's own cd1/fx2 guess** — real
    supersessions turned up in `ab1.mjs`/`ab2.mjs`/`fx1.mjs`/`hb1.mjs`
    too (`fx2.mjs` needed only plain selector updates, no park;
    `cd1.mjs` needed zero changes, confirmed byte-identical). Every
    parked check independently audited against this project's own
    A4/FX1-Ruling-5 precedent (quoted verbatim, genuinely superseded,
    live successor exists, the check's own name discloses the touch)
    — all correct, including `ab2.mjs`'s novel "layered park" (a park
    entry parking an already-parked entry a second time) and `hb1.mjs`
    getting its first-ever PARKED scaffold.
    **A real, reproducible defect found and fixed post-review:**
    `hb1.mjs`'s new PARKED veil-count check (S5's own successor to
    HB1's S3 wrapper-count check) flaked ~40-50% (confirmed via 5
    direct runs after an independent reviewer surfaced it, having
    first been told — wrongly — it was "deterministic"). Root-caused
    via direct diagnostic instrumentation: the app's own gate-arming
    state (`location.state.firstRunGate`, the Write door's disabled
    state) read CORRECTLY in every single run, pass or fail — the
    veil itself sometimes just never mounted on Arrival's very FIRST
    paint after a hard reload, a genuine first-mount timing
    sensitivity, not a fixture logic bug. This file's own LIVE S3
    check never showed it (4/4 clean) purely because its fixture
    detours through Open->back before Write, and that unrelated
    navigation's own async settling happened to absorb the same
    window by accident. Fixed with an explicit settle wait in
    `freshArrival` itself (protects every section using it
    deterministically, not by borrowing an unrelated detour's luck) —
    19/19 clean after the fix, across two separate machines/worktrees.
    Also directly measured and closed out (not merely trusted) the
    reviewer's own flagged-but-unfinished concern that a
    `@media(min-width:1700px)` top-bar font bump might drift
    `--fx3-chrome-budget`'s hand-measured 63px component at 2200px:
    empirically zero drift, nav height exactly 63px at both 1280px and
    2200px, fence exactly 40px at both, no scrollbar either width —
    the theoretical concern doesn't materialize in practice.
    **Full suite green on the fully merged, pushed tree:** `tsc`,
    `build:web`, selftest, all 16 harness files (`ab1` 35/45, `ab2`
    42/53, `ab3` 34/41, `cd1` 27/27, `fx1` 23/32, `fx2` 33/33, `fx3`
    30/30, `hb1` 31/32, `j4` 26, `j5` 40, `m1` 33, `s1` 86/87, `th1`
    26, `th2` 43, `w1` 18, `w2` 31) under both `HARNESS_PARKED`
    settings. `cd1.mjs` hit one isolated "CDP page target never
    appeared" crash during the review's own run, cleared on immediate
    retry, byte-identical to `main` — an infra flake, not a code
    regression (same class as the documented `th2.mjs`/`m1.mjs`
    flakes). Pushed to `origin/main` @ `f87295e`.
    **Not deployed** — Fable's post-merge review hasn't landed;
    redeploy is Nick's call, as always.
    **Fable's review: GREEN at census + record depth — 2026-07-17.**
    Merge `f87295e` census-verified (16 harness files as named, zero
    schema surface). **Ruling on S4:** the JournalEntry divergence
    (its top bar doesn't pick up the right-alignment trial, left as-is
    per prior precedent) is tolerable AS A TRIAL ONLY — if Nick
    ratifies right-alignment as permanent law rather than a working
    trial, it unifies across all hosts at that point, JournalEntry
    included. Not an action item now; a condition on any future
    ratification. Nick's own FX3 device-look sitting (the laptop-width
    question from item 28's own S1, plus a fresh look at S1-S5 here)
    can ride the same sitting as CD2's (item 30) or come sooner — his
    call, not scheduled by anything in this ticket.
    **Deployed — 2026-07-18**, Nick's word ("Deploy," naming FX3+CD2+
    cd2.1 together, "the whole new desk in one deploy"). Deploy-
    manifest rule (TOOLING STATUS) satisfied: enumerated every commit
    since the last deploy (`740b572` → `HEAD`) — resolves to exactly
    FX3 and CD2 (HB1 was already live, an ancestor of `740b572`
    itself; cd2.1 is docs-only, no separate deployable surface); no
    unnamed rider this time. `railway up` on `main` @ `6692c00`
    (deployment `1fa52774`, SUCCESS), confirmed live: `200` on
    `/healthz` and `/`, `401` on `/auth/me`.
30. **The Cascade — committee double-pass.** **PROPOSED — 2026-07-17.**
    Commissioned by Nick from the desktop sitting: the left drawer
    becomes a pop-out cascade from a persistent vertical strip —
    categories each opening a reach panel (layer 2), with a third
    pop-out survey layer (layer 3) for browsing contents as large
    thumbnails. Committee record: `docs/wrizo-alpha/cascade-committee-
    pass.md`. **Architects' review: sound — completes the canon's
    attention ladder.** The strip is glance; the category panel is
    reach (drawer-pull semantics carried forward whole); the survey
    layer names a range the canon never had (seeing a container's
    contents without traveling into it). Mechanics: layers 2-3 overlay
    only (paper never reflows, standing law), dissolve on keystroke via
    the one vanishing engine, the strip persists like the grip. **The
    pass's biggest call:** the reserved right track was AB4's (the
    Wall) — the cascade (as first proposed, right-sided) would own that
    edge, and Nick's own Plan example (cards as large thumbnails beside
    a focused page) IS the Wall's browsing posture; recommended AB4
    formally re-scope onto the cascade. Two-pass complete with trims
    (image-only thumbnails per Brand over Growth's richer ask; no
    pinned rows, no per-category settings, no strip customization this
    ticket, breadcrumbs rejected).
    **Correction, Nick's word, 2026-07-17: the cascade lives on the
    LEFT, not the right** (`cascade-committee-pass.md` carries the
    correction note; every "right" reading in the pass's own text is
    superseded, its underlying reasoning otherwise unchanged). With the
    cascade back on the left, the Wall/AB4 re-scoping question stood
    independent of "who owns the right edge" — ruled on its own merits
    (T2, below).
    **Nick's ratifications, 2026-07-17 — T1-T4 all resolved, CD2
    AUTHORIZED TO BUILD:** T1 — **A8-A11 RATIFIED**, A8 corrected to
    "persistent **left** strip" (blockquote note beside A8, original
    text preserved); **A11's roster is Nick's own re-sectioning**, not
    the pass's flat list — four sections: **A** Journal, **B** Page ·
    Plan, **C** Drawers · Shelf, **D** (strip's foot) Settings
    (site-wide) · Change Theme — D is new, not in the pass's original
    proposal. T2 — **the Wall folds onto the cascade, RULED YES**; AB4
    formally re-scopes (survey layer = how boards/walls are browsed;
    pinning/threads build ON this system as the next arc ticket; the
    reserved corkboard track retires from the plan). T3 — **Journal
    first** (per A11's own roster above, not the pass's original
    Page-first draft). T4 — **Delete is Delete, RULED AGAINST the
    pass's own lean**: disclosure + one plain confirm, NO
    "Move to Shelf instead" soft-path offer (the confirm alone is the
    data-safety floor) — overrides the pass's PASS TWO recommendation.
    **Plus one addition beyond the pass's own four tensions: THE DOCK**
    — a deliberate-keep affordance for the survey layer (close/reopen
    slide, ~180ms, reduced-motion honored), with its own vanishing-law
    rider (a docked survey survives keystrokes; undocked layers still
    dissolve as before) and a small-screen rule (transient layers may
    overlay the paper rather than reflow it at laptop widths; a docked
    survey compresses to a 120px floor instead of occluding the
    measure, or the dock affordance is simply unavailable below it).
    **Build brief:** `docs/wrizo-alpha/cd2-cascade-brief.md`, S0-S6,
    authorized to build on `cd2-cascade` off `main` — **after FX3
    (item 29) merges**, not concurrently (one checkout per agent; no
    mid-flight collision surface). Zero-schema — merge pre-authorized
    per the standing rule; Fable reviews post-merge, gating close and
    redeploy. S0 requires the canon touch (A8-A11 + the ratification
    record, A11's roster verbatim as sectioned) as part of the build
    itself, not done here. New `apps/desktop/scripts/harness/cd2.mjs`
    required (S6), plus the largest park sweep since CD1's own S9 — the
    left drawer's retirement falsifies `cd1.mjs`'s drawer-track
    geometry and face checks (and likely others); every falsified check
    parks per A4, enumerated in the fold's own commit message.
    **MERGED, PUSHED — 2026-07-18.** Built S0-S6 on `cd2-cascade` off
    `main`, in an isolated worktree, after FX3 (item 29) had already
    merged. **Architecture:** `DeskFrame.tsx`'s `toolRail` prop retires
    entirely, replaced by two: `strip` (a grid track, `.desk-frame-
    strip`, deliberately carrying NO `chrome-fade`/`desk-dissolve`
    classes — S1's "never dissolving" law enforced structurally, not
    just behaviorally) and `cascadeLayers` (a stage overlay, mirroring
    the sliver's own anchor pattern but growing rightward from the
    strip instead of leftward from the paper — same structural
    immunity proof). Both come from one new hook, `useCascade()` in
    `components/Cascade.tsx`. Layers 2-3 dissolve via an explicit
    keydown listener (generalizing AB3's own pre-existing Drawer
    keystroke-reset pattern), not the ambient fade engine — deliberate,
    since the strip must never fade and there's no shared "this family
    fades" class to lean on. **The dock:** a fixed 180ms collapse
    (mounted throughout, never unmounting, so rapid dock/undock can't
    race); layer 3 slides into layer 2's slot via ordinary flex reflow;
    a docked survey clamps to a 120px floor. A real bug the build found
    in its OWN code and fixed: Chromium does not resolve `calc()`/
    `min()` inside a CSS custom property via `getComputedStyle()` — it
    returns the literal formula string, silently `NaN`-ing the dock-
    floor law; fixed by measuring real DOM rects instead of trusting
    the custom property.
    **S1-S5:** the strip (84px, `--strip-width`, replacing the 200px
    `--drawer-width`, feeding the freed width to FX3's scaled paper),
    A11's 4-section/7-category roster verbatim, all 7 category panels
    (Page reuses `PageFace` whole; Drawers lists drawer *entities*, not
    a flat page list — richer than the retired PlaceFace; Settings is
    genuinely site-wide via a new `logoutRequest.ts` pub-sub reaching
    App.tsx's real `handleLogout`, distinct by law from the sliver-foot
    gear), the survey layer, Delete as Nick actually ruled it (one
    plain confirm, no Shelf-instead offer — overriding the committee
    pass's own softer lean). `Drawer.tsx` and `PlaceFace.tsx` deleted
    outright.
    **Independent review — verified the hard claims directly, not by
    re-reading the build's own report.** Paper-rect invariance and
    strip-never-dissolve confirmed via direct harness execution.
    **All four dock state transitions tested directly** (the build's
    own harness only covered two — keystroke-survives and close/
    reopen; the review wrote and ran independent scripts for the other
    two, Escape-dismisses-docked and category-switch-dismisses-docked
    — both correct). The calc()/getComputedStyle claim independently
    reproduced with a generic, app-unrelated test case — confirmed
    general Chromium behavior, not a build assumption. Delete
    independently traced to match Nick's actual ruling, not the pass's
    original lean. Full 17-file suite reconfirmed from a clean install
    with zero count discrepancies and zero flakes (including `m1`/`th2`,
    both historically flake-prone, clean on the first try).
    **One real, if minor, product-scope tension surfaced by the build
    itself and independently resolved by the review:** S3's own text
    says the Plan category's survey shows the board LIST; the brief's
    own DoD line describes "a board's cards surveyed as thumbnails
    beside a focused page" — Nick's original commissioning image. The
    review's independent judgment: the DoD line describes the FULL
    vision spanning CD2+AB4 (the committee pass's own ratified
    reasoning explicitly re-scopes that exact posture onto AB4, "built
    ON the cascade as the next arc ticket"; `BoardEditor.tsx` never
    got the cascade wired in this ticket, a disclosed non-goal with
    direct AB3-era precedent for excluding Board) — not a CD2 defect.
    Recorded as a DoD erratum for Fable/Nick, not unbuilt scope.
    **Park sweep — every entry individually audited against this
    project's own A4/FX1-Ruling-5 disclosure precedent; one false
    citation fixed, one consistency gap found and fixed.** Touched
    `ab1.mjs` (3 parked), `ab2.mjs` (1 parked), `ab3.mjs` (7 newly
    parked + 4 chain-extended + 7 adapted-in-place doorway checks, the
    largest single pass), `cd1.mjs` (2 parked, its first-ever), `fx1.mjs`
    (2 parked) — all verified verbatim-quoted, genuinely superseded
    (`Drawer.tsx`/`PlaceFace.tsx` confirmed actually deleted), with real
    live successors. The review fixed a false "layered park" precedent
    citation in `ab3.mjs`'s own comment (`bc4d560`) and flagged
    `fx2.mjs`'s two Drawer-named checks as inconsistently classified —
    edited in place rather than parked, despite naming "the Drawer" by
    name the same way the parked checks elsewhere in this identical
    sweep did. **Fixed directly** (not left as a flag) — parked both
    per A4, quoted verbatim, live successors already existed; also
    fixed the file's own tail, which only checked `checks` and never
    `parkedChecks`, meaning a failing parked check couldn't have failed
    the process (`fx2.mjs`: 33/33 -> 33/35).
    **Full suite green on the fully merged, pushed tree:** `tsc`,
    `build:web`, selftest, all 17 harness files under both
    `HARNESS_PARKED` settings. `th2.mjs` hit its documented transient
    flake once during this final pass (2/43), cleared on 3 immediate
    reruns — consistent with its known history, not a regression.
    Pushed to `origin/main` @ `402a6ba`.
    **Not deployed** — Fable's post-merge review hasn't landed;
    redeploy is Nick's call, as always. The instruments panel (per the
    brief) remains committee-owned, untouched by this build.
    **Fable's review: GREEN with a fold, cd2.1 — 2026-07-18**
    (`docs/wrizo-alpha/cd2-review-fable.md`, census + record depth,
    standing on the independent review's own direct-testing
    verification as the deep pass). **Three rulings of record:** (1)
    the Plan-survey erratum SUSTAINED — the brief's own DoD line
    described AB4's eventual destination, not this ticket's floor;
    ruled Fable's own defect (her third of the run), not the build's;
    Nick-vetoable if he wants cards in the survey ahead of AB4. (2)
    the park-sweep consistency fix and the `fx2.mjs` latent-bug fix
    RATIFIED, with a fold to close the whole class. (3) the
    independent review's own practice — writing test coverage the
    build's harness lacked, rather than re-reading its self-report —
    ratified as the standing review method for transition-heavy
    tickets. **The fold does NOT gate deploy** — redeploy gate open
    on Nick's word regardless.
    **cd2.1 R1 folded — 2026-07-18, no code changes required.**
    Audited all 17 harness files' own exit logic for the exact class
    of bug `fx2.mjs` had (a `parkedChecks` array declared and
    populated under `HARNESS_PARKED=1` but never included in the
    final `pass` computation, so a failing parked check couldn't fail
    the process): `ab1`/`ab2`/`ab3`/`cd1`/`fx1`/`fx2`/`hb1`/`s1` all
    correctly use `checks.concat(parkedChecks)`; `cd2`/`fx3`/`j4`/
    `j5`/`m1`/`th1`/`th2`/`w1`/`w2` have no `parkedChecks` array at
    all (never parked anything — `cd2.mjs`'s and `fx3.mjs`'s own
    PARKED sections are honest empty scaffolds, print "armed but
    empty," claim no false pass). The one real instance of this class
    was `fx2.mjs`, already found and fixed during CD2's own merge
    (`a1da007`) — the audit confirms the class is now closed
    everywhere, nothing further to fix. Full suite reconfirmed green,
    both `HARNESS_PARKED` settings, all 17 files (`th2.mjs` hit its
    documented flake once more, cleared on 3 immediate reruns).
    **Close conditions: 1 and 2 now met** (review on disk, cd2.1
    folded, suite green). **3 and 4 remain** — redeploy on Nick's
    word, and his device-look sitting (the cascade at his left hand,
    the dock, the strip's four sections, the theme panel with no
    locked doors, FX3's own verdicts riding the same look).
    **Close condition 3 met — Deployed 2026-07-18**, Nick's word
    ("Deploy," FX3+CD2+cd2.1 together). `railway up` on `main` @
    `6692c00` (deployment `1fa52774`, SUCCESS), confirmed live. Full
    enumeration/detail recorded once, against item 29 (same deploy,
    same SHA, same word). **Close condition 4 (Nick's device-look
    sitting) remains** — item 30 does not close until it's spent.
31. **AB4 — the Wall.** **BRIEF COMMITTED, BUILD AUTHORIZED —
    2026-07-18.** Authority: the Tutor committee pass
    (`docs/wrizo-alpha/tutor-committee-pass.md`) as ratified by Nick —
    **A12-A15 RATIFIED** (A12 the two-sides law: the cascade serves
    known needs, the Tutor unknown ones; A13 the ghostwriter rail,
    constitutional — the Tutor speaks about the writing, never as it,
    reference yes/composition never, no Tutor output ever enters a
    writing surface by any affordance; A14 the room never knocks — the
    Tutor may write, never call, no badges/toasts/counts/dots ever;
    A15 the Tutor inherits the vanishing law with the dock rider), the
    composition line made LAW **with Nick's own revisit note verbatim:
    "if it's overly restrictive later, we can always revisit"**, Wall
    built first then TU1 (sequencing ratified), per-page Tutor threads
    in v1. This ticket discharges CD2's own Wall-fold ruling and
    Ruling 2's carries. Six slices: S1 the CD2 Plan-survey erratum
    comes true — picking a board swaps the survey to that board's
    CARDS as large thumbnails, fully dockable (the PowerPoint moment);
    S2 Pin as a fourth sending verb (membership, not capture — home/
    origin untouched, a page-pin card joins the board, a truthful
    "Also pinned to X" membership line, unpinning removes the card
    never the page); S3 threads (a connect-mode toggle draws hairlines
    between cards, stored in `boxes`, confirm-free deletion); S4 card
    resize (persisted) + double-click travel with a guaranteed way
    back (text cards keep today's inline-edit behavior, untouched);
    S5 BoardEditor finally joins the cascade system — gains the
    sliver (Add card, Connect toggle, nothing else v1), declares
    `pageKind='board'` (the standing prose-assumption cleanup lands),
    completing the "every surface carries strip/sliver/top-line, no
    pre-cascade wiring survives anywhere" claim. **Zero schema, zero
    new deps** — everything rides the existing `boxes` jsonb; any
    slice wanting a column is a STOP-and-report, this ticket carries
    no schema pre-authorization. Merge pre-authorized as zero-schema;
    Fable reviews post-merge, gating close and redeploy. New
    `apps/desktop/scripts/harness/ab4.mjs` required (S6) plus a park
    sweep — the cd2.1 audit now guards the whole "silently-skipped-
    parked-checks" class for every file this falsifies.
    **TU1 — the Tutor — queued next, SCHEMA FLAG standing.** Per the
    Tutor committee pass's own recommendation: a right-edge panel
    mirroring the sliver's geometry, persisted Tutor threads (the
    arc's second schema addition after `origin`). **Carries NO merge
    pre-authorization — Nick's explicit merge go is required** (the
    corrected zero-schema-vs-schema rule's first scheduled real use
    since the correction). TU1's own brief follows AB4's review, per
    the one-brief rhythm. Not started; brief not yet written.
    **MERGED, PUSHED — 2026-07-18.** Built S0-S6 on `ab4-wall` off
    `main`, in an isolated worktree. **Zero-schema independently
    verified TRUE, twice** (build's own check + the review's own
    separate `git diff main..ab4-wall -- apps/server/`, byte-empty —
    `migrate.ts`/`sync.ts` untouched). **S3's design choice — the
    ticket's real engineering call:** the brief's own framing
    suggested a sibling jsonb field for `connections`, but the build
    found (and the review independently re-verified by reading
    `migrate.ts`/`sync.ts` directly) that `script`'s own existing
    sibling-column precedent actually needs its own migration + sync
    wiring — NOT zero-schema despite looking like one at the TS-type
    level. Chose instead to store connections as plain elements of
    the SAME flat `boxes` array (a new `'connection'` `Box.kind`
    carrying endpoint ids, position always derived live from the two
    endpoints' current rects, never stored — drag/resize moves
    hairlines for free). Independently stress-tested: live drag
    verified, and an orphan-on-delete scenario the brief itself
    flagged but the build's own harness didn't cover — deleting a
    card also cleanly removes every connection referencing it, no
    crash, no orphan, unrelated cards/connections untouched.
    **S4's way-back mechanism** (a one-shot `location.state`, F2's
    own warm-start pattern reused) independently traced end-to-end
    and confirmed it returns to the SPECIFIC originating board by id,
    not just "a board"; reload-loses-state confirmed to degrade
    gracefully (no chip, no crash) rather than break.
    **S1/S2** verified; the build's own self-flagged interpolation (a
    non-pin survey card now travels to the board on click, rather
    than staying inert) independently judged reasonable by the review
    — every other survey item in the app is already click-to-travel,
    making an inert card the actual anomaly, not this choice.
    **Legacy BoardEditor confirmed byte-identical** — not trusted from
    a diff summary; the review extracted both branches' actual JSX
    and ran a literal `diff`.
    **Park sweep:** the build's own audit found nothing needing a
    real park (structural, non-content-comparing checks throughout
    the suite are naturally immune to Board gaining chrome for the
    first time) — the review independently re-swept and confirmed
    this, but caught one thing the build's own audit missed: a stale
    comment in `ab1.mjs`'s own PARKED section still narrated "Board
    still passes no strip content," now false. Comment-only (the
    underlying check compares rects, never content, so nothing was
    actually falsified) — fixed directly by the review (`6c8975c`),
    re-verified unchanged counts.
    **Full suite green on the fully merged, pushed tree:** `tsc`,
    `build:web`, selftest, all 18 harness files (`ab1` 33/46, `ab2`
    41/53, `ab3` 24/38, `cd1` 27/29, `cd2` 50/50, `fx1` 23/34, `fx2`
    33/35, `fx3` 30/30, `hb1` 31/32, `j4` 26, `j5` 40, `m1` 33, `s1`
    86/87, `th1` 26, `th2` 43, `w1` 18, `w2` 31, `ab4` 36/36 — new)
    under both `HARNESS_PARKED` settings, zero count discrepancies
    between build/review/this session's own three independent runs.
    `th2.mjs` hit its documented transient flake once during this
    final pass (2/43), cleared on 3 immediate reruns. Pushed to
    `origin/main` @ `f1ba899`.
    **Fable's review: GREEN, zero required fixes — 2026-07-18**
    (`docs/wrizo-alpha/ab4-review-fable.md`, census + record depth,
    standing on the independent review's own direct testing —
    including its delete-with-active-connections script — as the
    deep pass). **Ruling: S3's brief sketch (a sibling-field shape)
    was Fable's own erratum**, not the build's — the build's verified
    zero-schema shape (connections as same-array elements) is
    correct; no STOP was owed since the investigation found the
    lawful shape rather than hitting a wall. Deletion cleanup, the
    legacy-reading distinction, and the "nothing to park" audit all
    endorsed. **Three advisories carried, none blocking:** A1 —
    self-pin is reachable (no self-guard on `pinPageToBoard`; harmless,
    idempotent, nonsense composition — fold candidate at next touch,
    not now); also noted, a board-to-board pin travels correctly but
    renders no way-back chip (the chip is prose/script-only v1,
    acceptable). A2 — the empty-state copy implies filing is required
    to pin when it isn't (membership ≠ filing); truthful copy is "create
    a project first," a wording fix at next touch. A3 — `goalText=""`
    on boards SUSTAINED (a board holds arrangement, not writing; a
    board-native measure is a future committee question, not a fold).
    **Deployed — 2026-07-18**, Nick's word ("deploy AB4"). Deploy-
    manifest rule satisfied — independently re-enumerated (not just
    trusted from the review's own claim): every commit since the last
    deploy (`6692c00` → `HEAD`) resolves to exactly AB4's own commits
    plus docs-only entries, no unnamed riders. `railway up` on `main`
    @ `d1a6696` (deployment `1276bb33`, SUCCESS), confirmed live:
    `200` on `/healthz` and `/`, `401` on `/auth/me`.
    **Close conditions 1 and 2 met.** Condition 3 (Nick's device look
    per the brief's DoD) remains — may ride the consolidated sitting
    or its own, his call. TU1 remains queued next, schema-flagged,
    awaiting its own brief and Nick's explicit merge go; its order
    against hb1.2 also rides his word.
32. **Nick's desktop sitting — 2026-07-18. PARTIAL** — served items
    30 (CD2) and 31 (AB4) in part; item 27's (HB1) own list untouched.
    **Verdicts, feeding a future FX4** (brief follows TU1's review;
    zero-schema): the typewriter start moves to 25% from the top of
    the stage; scroll/fade engages within ~10 lines; the retune
    applies to ALL surfaces including the Journal — its own
    start-offset carve-out RETIRES (the ink-coordinate risk that
    justified the carve-out is to be SOLVED, not skipped past); the
    goal glow gets a verify-then-retune pass to an actually
    perceivable state (the hard intensity-cap law itself still
    holds, only the tuning changes); the strip sits flush to the
    screen's own left edge (not the frame's); the Board's own
    strip/sliver anchoring is flush too, with an ANCHORING DEFECT
    SUSPECTED there specifically (not yet diagnosed); cards resize on
    BOTH axes (was one); the board canvas itself resizes on both axes
    too; and hover-restore of already-faded chrome, currently broken,
    gets repaired.
    **Rulings recorded (verdicts on standing questions, not FX4
    slices):** card editing moves to a POPUP over a blurred board,
    the popup carrying the card's own minimal strip — this SUPERSEDES
    Nick's own prior standing rider (notecards keep inline editing,
    no sliver interference, reaffirmed as recently as AB4's own S4) —
    **pending his explicit confirm**, not yet final. Cards carry
    neither a typewriter nor a progress instrument (furniture that
    doesn't apply to arrangement, same reasoning as AB4's own
    `goalText=""` sustain). A visible thin sheet-break line where
    continuous scroll crosses a page boundary is ruled AB5's own
    input, not this sitting's to solve — it amends Law 8's own
    "silent turnover" letter, a canon touch for AB5 to carry, not a
    ratification landed here. The sliver's "Instruments" icon
    renames to "Progress Bar," gaining strip/disabled/bottom
    placement options — handed to the instruments-panel's own owner
    (the Cascade committee pass), not built here. Three typewriter
    sub-toggles (Forward Momentum / Text Fade / Page Scroll) move
    behind the sliver's Typewriter icon. The "Controls"/"Forward
    lock" labels retire (superseded terminology, park the strings
    per the usual lexicon discipline whenever code catches up).
    **A new committee pass convened, Nick's own commission** (not yet
    delivered — a future doc, not this entry): per-mode tool strips
    (a formatting LIST for Draft vs. its own frozen-markdown storage
    reality — the cost of reconciling them is to be NAMED, not
    assumed; a schema touch here would be LOUDLY flagged, same
    standing discipline as AB4's own; custom-font upload wakes as a
    later question, gated behind progressive disclosure); a staged
    vanish that includes the strip itself (a real A8 touch — the
    strip's own "never dissolving" law softening — amendment drafted,
    NOT yet ratified, awaits Nick's word); framework beats (from the
    progress-milestones/Plan system) surfacing as board cards (named
    as the P-arc's own doorway, not this sitting's to build).
    **Read-backs open, unresolved by this sitting** at the time it
    was recorded — **all three now RULED, per FX4's own authority
    line (item 33):** copy-out is Publish-only; handle-drag replaces
    the connect-toggle; the card-editing popup supersession is
    confirmed (Nick's own word, no longer pending). See item 33 for
    the verbatim rulings and their build implications.
    **Mockups delivered, still not committed:** `board-card-studies.html`
    (card treatments A-D plus the popup editor) — Nick's own pick
    landed (Stacked, variant B, per item 33/FX4's own S7), but the
    file itself has not actually reached this session by any channel
    yet (checked broadly, genuinely absent) — still not on disk, not
    committed. FX4's own S7 carries enough written specification
    (lighter stock, 1px hairline, 2px offset hard edge + soft shadow,
    square corners) to build from without the mockup file itself, but
    the file remains owed as the historical design reference `docs/
    design/` is meant to hold.
    **What remains open:** item 30 (CD2) — the dock, pin/membership,
    thread round-trip, and resize-across-reload are all still
    UNVERDICTED (this sitting didn't reach them); item 31 (AB4) —
    same, still open. Item 27 (HB1)'s own full sitting list is
    entirely untouched by this pass. Neither item 30 nor 31 closes on
    this sitting alone.
33. **FX4 — the Fourth Sitting.** **BRIEF COMMITTED, BUILD AUTHORIZED
    — 2026-07-18.** Authority: item 32's sitting record, plus **four
    of Nick's rulings, verbatim:** copy-out is Publish-only (no new
    clipboard door this ticket); handle-drag (double-click the
    card's own brass resize handle, drag, release inside a target
    card) REPLACES the sliver's Connect toggle for thread-drawing —
    the toggle itself retires; the card-editing popup (blurred board
    behind, the card's own minimal strip) SUPERSEDES inline
    contenteditable card editing — confirmed, no longer pending
    (item 32's own read-back closed); **Stacked** (variant B of
    `board-card-studies.html`) is the ratified card treatment —
    lighter stock, 1px hairline, thickness told by a 2px offset hard
    edge + soft shadow, square corners.
    **The trash bin — recorded here as QUEUED, not this ticket's
    build:** pages are cheap to trash (`deletedAt` already
    soft-deletes them, a door just needs building); cards and
    threads are NOT cheap — they need new deletion semantics of
    their own before a bin can honestly represent them. T4's own
    interaction pattern (disclosure, one plain confirm) is the noted
    starting point whenever this gets its own ticket. Not FX4's to
    build.
    **The intro-screen table, recorded here:** item 27 (HB1) stays
    open; hb1.2 (its own next fold) is queued; **the hammer test
    leads its severity ranking** — whichever finding the hammer test
    surfaces worst is what hb1.2 addresses first, when it's built.
    **Nine slices (S0-S9):** S1 the typewriter start retunes to 25%
    across EVERY surface including the Journal — its carve-out
    RETIRES, the ink-coordinate risk gets SOLVED not re-skipped (a
    seeded-stroke byte-truth fixture is the proof; if it can't be
    proven safe, STOP and report rather than ship half); S2 the goal
    glow gets a render-verified-first, then-retuned pass (defect vs.
    tuning diagnosed before any value changes, FX2's own law), plus a
    harness luminance floor so "too subtle to see" can't silently
    regress again; S3 the strip goes flush to the screen's own left
    edge (not the frame's), and the Board's own strip/sliver
    anchoring — suspected defect, not yet diagnosed — gets measured
    and fixed at the root; S4 cards AND the board canvas both gain
    both-axis resize, canvas dimensions persisting as a new
    `'board-meta'` array element (the `'connection'`-kind precedent
    from AB4, still zero-schema — STOP-and-report if that shape
    fights in practice); S5 the popup editor lands (Bold/Italic only,
    the frozen markdown set does NOT unfreeze here), inline editing
    retires, `ab4.mjs`'s own inline-editing check parks per A4; S6
    the handle-drag thread gesture replaces Connect, parking
    `ab4.mjs`'s exact-two-tools count and its connect-toggle checks;
    S7 Stacked ships as CSS; S8 hover-restore on faded chrome gets
    repaired as a defect fix, explicitly NOT a redesign (the staged
    vanish itself stays the committee's). New
    `apps/desktop/scripts/harness/fx4.mjs` required (S9) plus the
    park sweep named above. **Zero schema, zero new deps** — merge
    pre-authorized per the standing rule; Fable reviews post-merge,
    gating close and redeploy; any slice wanting a column is a
    STOP-and-report, same discipline as AB4. **Sequencing:** builds
    after TU1's review lands, OR in parallel on Nick's explicit word
    — the two tickets share one seam (PageEditor/DeskFrame host
    wiring) that needs coordination if run concurrently, nowhere
    else. Committed:
    `docs/wrizo-alpha/fx4-fourth-sitting-brief.md`.
    **`board-card-studies.html` landed and is committed** —
    `docs/design/board-card-studies.html` (moved from where it first
    arrived, per S0's own instruction).
    **Build starting — 2026-07-18**, Nick's word ("Build FX4 first
    then TU1") — sequential, not parallel, so the brief's own
    shared-seam coordination concern doesn't apply this time.
    **MERGED, PUSHED — 2026-07-18.** Built S0-S9 on `fx4-fourth-
    sitting` off `main`, via a Workflow-orchestrated build+review
    pipeline (ultracode). **All three named STOP-and-report clauses
    investigated; none fired** — S1's ink-coordinate risk, S4's
    board-meta shape, and the general schema clause were each worked
    through to a lawful, zero-schema, empirically-proven answer
    rather than skipped.
    **S1 (the highest-risk slice) — proven safe two ways.** CSS
    box-model reasoning (padding-top grows an element's height, never
    moves its own border-box top; the ink canvases are absolutely
    positioned against that same box, so the whole coordinate space
    is structurally immune) PLUS a committed, permanent harness fixture:
    seed a stroke at known coordinates, toggle the new start-offset
    live, confirm `top`/`left`/`width` byte-identical (only `height`
    differs), confirm real ink pixels land at the predicted screen
    position. The independent review didn't just re-read this — it
    ran an ADVERSARIAL MUTATION TEST (swapped `padding-top` for
    `margin-top`, a plausible real regression), confirmed the
    fixture correctly failed five checks including its own core
    rect-invariant, then reverted and reconfirmed clean. The proof is
    real, not a rubber stamp. Getting there also surfaced and fixed
    THREE previously-undiscovered defects unrelated to the
    coordinate risk itself: `.desk-frame-host{overflow:hidden}` (an
    FX3-era rule) silently capped Journal's own legitimate growth;
    a caret-detection fallback mis-measured on Journal's plaintext
    editable (no per-run wrappers) and fired the hold-band almost
    immediately regardless of typing; the same fallback caused a
    **fresh, untouched page to auto-scroll on mount**, undoing "starts
    a quarter down" before a single keystroke. All three fixed;
    START_FRACTION -> 0.25 (measured the fx1.mjs way, not just set).
    **S2 (the glow)** — diagnosed first, per FX2's own law: a real
    rendering defect, not a tuning gap (`z-index:-1` escaping to the
    document root because its parent never established a stacking
    context). One-line fix (`isolation:isolate`), then retuned.
    Independently reconfirmed by hand-computing the eased curve at
    50% progress and matching the harness's own live-read value
    exactly (0.232 both ways).
    **S3 (flush chrome)** — the strip's own inset killed; the
    Board's sliver anchor was using the WRONG formula entirely (a
    prose constant on a differently-sized surface, ~242px off,
    measured not guessed) — fixed at the root. Flagged, not a defect:
    flush-left necessarily breaks CD1's own prior symmetric-margins
    framing at wide viewports — the independent review's own read is
    that this isn't actually an open question (the brief's own
    language is explicit and unconditional), just a visible
    compositional change worth Nick's eye.
    **S4 (resize + board-meta)** — both-axis resize for cards and the
    canvas; board-meta storage followed AB4's own `'connection'`-kind
    precedent, checked against every existing `boxes` consumer before
    shipping. The review found one real (minor) gap in the build's
    OWN harness check — a dead boolean clause (operator-precedence
    bug) that made a value-comparison structurally unreachable, so
    the check only ever proved the element's existence, not its
    correctness — fixed directly (`573f76c`), not a product defect.
    **S5 (popup, inline retires)** — reused this codebase's own
    existing pieces throughout (`draftFormat`'s markdown conventions,
    the iA dimmed-syntax register Draft mode already uses, hb1.1's
    own focus-trap pattern) rather than inventing new ones. A pen-
    discipline guard the retired inline editor carried was nearly
    dropped — caught during the build's OWN park-sweep audit, fixed
    before commit.
    **S6 (handle-drag threads)** — Connect toggle genuinely gone
    (confirmed by the review via a repo-wide grep, not just a UI
    check); the underlying connection storage/de-dupe/deletion is
    unchanged from AB4, only the gesture differs. The review wrote
    its own independent probe for a scenario neither brief nor
    harness named (Escape pressed mid-drag, pointer still held) and
    confirmed correct behavior via live testing, not code-reading
    alone.
    **S7 (Stacked)** matched the mockup's own literal values.
    **S8 (hover-restore)** — a genuine, subtle, previously-unknown
    defect, found live: the dissolve/resurface state only ever reset
    on a LATER "not at edge" report, never when its own dwell timer
    fired — so the FIRST cycle after mount always worked and EVERY
    SUBSequent cycle within the same session silently failed. Exactly
    the pattern a real writer would hit and no prior single-cycle
    check could have caught. Fixed at the root.
    **Park sweep — 8 files, fully enumerated and independently
    re-audited.** `fx3`/`cd1`/`fx1` (a documented SECOND-generation
    supersession, the "layered park" precedent used again), `w2`
    (its first-ever PARKED section), `ab1`/`j4` (`j4`'s own first-ever
    PARKED section), `ab4` (10 checks, the largest single share). The
    independent review didn't just check the enumerated files — it
    swept the ENTIRE harness tree itself for retired-mechanism
    strings, and specifically stress-tested `w1.mjs` (not in the
    sweep at all, but exercising adjacent code) to confirm it was
    genuinely unaffected, plus empirically re-verified `w2.mjs`'s own
    specific numeric reasoning rather than trusting it on paper.
    **Full suite green on the fully merged, pushed tree:** `tsc`,
    `build:web`, selftest, all 19 harness files (`ab1` 29/44, `ab2`
    41/53, `ab3` 24/38, `cd1` 26/29, `cd2` 50/50, `fx1` 23/34, `fx2`
    33/35, `fx3` 27/30, `fx4` 61/61 — new, `hb1` 31/32, `j4` 24/27,
    `j5` 40, `m1` 33, `s1` 86/87, `th1` 26, `th2` 43, `w1` 18, `w2`
    31/32, `ab4` 25/35) under both `HARNESS_PARKED` settings — zero
    discrepancies across build/review/this session's own three
    independent runs, all from genuinely clean installs. `th2.mjs`
    hit its documented transient flake once during this final pass
    (2/43), cleared on 3 immediate reruns. Pushed to `origin/main` @
    `94466fa`.
    **Judgment calls disclosed, none blocking:** S1's cross-surface
    visual-percentage spread (prose ~29-30%, script/Journal ~25%,
    all "about a quarter" but not identical — a structural artifact
    of prose's own extra chrome padding, not a bug); a new
    `MIN_TEXT_H` constant by analogy, not brief-named; a commit-
    granularity compromise on `index.css`/`BoardEditor.tsx` (genuinely
    interleaved code across slices, disclosed plainly rather than
    force-split and risk the tree).
    **Not deployed** — Fable's post-merge review hasn't landed;
    redeploy is Nick's call, as always.
    **Fable's review: GREEN, zero required fixes — 2026-07-18**
    (`docs/wrizo-alpha/fx4-review-fable.md`, census + record depth,
    standing on the three independent zero-discrepancy verification
    runs and the review's own adversarial mutation test on S1's
    ink-coordinate proof). **All five defects found and fixed along
    the way — the Journal overflow clip, the caret-detection
    fallback, the fresh-page auto-scroll, the glow's stacking-context
    escape, the hover-restore reset bug — ratified in-scope**, every
    one inside a surface this ticket's own slices already own,
    diagnosed before tuning per FX2's standing law. The board-meta
    un-normalized `canvasW`/`canvasH` decision, the `fx1.mjs`
    generation-2 double-supersession precedent, and the `w2.mjs`
    park all explicitly ratified as correct calls.
    **One advisory carried, not blocking (Nick's eye, first on his
    glance list):** the desk grid now left-anchors at wide viewports
    (S3's own flush-left requirement) rather than centering — a
    lawful reading of the brief, but a visible departure from CD1's
    own prior symmetric-margins framing; a one-line revert if his own
    verdict goes the other way.
    **Close conditions:** (1) review on disk, met. (2) redeploy on
    Nick's word — deploy manifest already enumerated by the review
    itself: `d1a6696..HEAD` = FX4 (the one code ticket) plus named
    doc riders (item 32's sitting record, the FX4/TU1 briefs and
    items 33/34, `board-card-studies.html`, the stash-drop record,
    this review) — no unnamed code riders. (3) Nick's own FX4 DoD
    script plus the A1 wide-desk glance — remains open. **TU1
    proceeds on its own branch in parallel** — Fable reviews there
    when its build reports; merge needs Nick's explicit go
    regardless of this item's own status.
    **Close condition 2 met — Deployed 2026-07-18**, Nick's word
    ("Yeah, deploy") — confirmed TU1's own concurrent build doesn't
    affect this: it's a schema ticket with no merge pre-authorization,
    building on its own separate, unmerged branch, so `main`'s own
    state (independently re-enumerated: `d1a6696..HEAD` = FX4 + docs
    only, matching the review's own manifest exactly) was untouched
    by it. `railway up` on `main` @ `1dc0003` (deployment `0e1fc3b7`,
    SUCCESS), confirmed live: `200` on `/healthz` and `/`, `401` on
    `/auth/me`. **Close condition 3 (Nick's own FX4 DoD script + the
    A1 wide-desk glance) remains open** — item 33 doesn't close until
    it's spent.
    **Nick's FX4 DoD verdict sheet — 2026-07-19.** PASS: strip flush,
    board chrome flush, Stacked cards ("happy for now"), popup+blur,
    start position. FAIL: thread gesture (handle-dblclick dead under
    real pointer; superseded by Nick's pin-circle ruling), hover-
    restore (dead on real hardware despite the four-cycle synthetic
    proof), glow (imperceptible), engage motion (multi-line jerk).
    New rulings from the sitting: scroll freedom (typing never snaps
    the page back; fade tracks the viewport top, not absolute text
    position), fade band one line lower, em-dash autocorrect, notecard
    clamp on ported pages, free card movement + overlap + a quiet
    layer icon, the olive pin as the connection grab, a connection
    footer + its own toggle, no visible asterisks on cards, Plateau-
    styled scrollbars. Parked by Nick's own word: the momentum
    scroller. Restated, committee-owned: staged vanish including full
    disappearance after sustained writing. Card committee
    COMMISSIONED by Nick: titles, tags, metadata footer fields,
    organization/tracking. A1 wide-desk glance: still open at this
    point (closed separately below). Item 33 **closes PARTIAL** — the
    DoD verdict sheet is now fully recorded and answered by FX5's own
    brief (queued behind TU1's branch review, now committed); the
    route from here is FX5, not a further fold of FX4 itself. Lesson
    recorded, now standing law in FX5's own preamble: synthetic-event
    harness proofs are not the same claim as a trusted real pointer
    gesture — every input-gesture claim from here on reproduces with
    the closest-to-trusted event stream the harness can produce and
    documents the residual gap honestly, in the check itself.
    **A1 (the wide-desk glance) — CLOSED, Nick's verdict, 2026-07-19:**
    the paper sat visibly off-center (right gap wider than left).
    Ruled: center the paper, keep the strip flush at the screen's own
    left edge — recorded as FX5's own S10 amendment. Nick's forward
    note recorded for the record: the right margin is TU1's own room
    by design; any further remainder stays unallocated by his word,
    not silently claimed by any future ticket.
34. **TU1 — the Tutor.** **BRIEF COMMITTED — 2026-07-18.**
    `docs/wrizo-alpha/tu1-tutor-brief.md`. **SCHEMA TICKET — NO MERGE
    PRE-AUTHORIZATION**, the corrected zero-schema-vs-schema rule's
    first real ticket to actually reach build. One nullable `tutor`
    jsonb column on `journal_entries` (the arc's second schema
    addition after `origin`), a right-edge sliver-mirrored panel
    (A15, dock rider inherited whole), three offline/client-only
    lenses (Consistency/Structure/Fragments), nudges as letters never
    calls (A14, absolute — no badge/toast/count/dot/interruption
    anywhere in this ticket), and the model conversation itself bound
    by A13's ghostwriter rail (speaks about the writing, never as it;
    no insert/apply/copy-into-page affordance of any kind — the
    future paste rail is the mechanical backstop, not built here).
    **Build and push only — no merge.** Report = push; Fable reviews
    ON THE BRANCH; merge happens only on Nick's explicit go. The S1
    schema precedent's live prod round-trip (a scratch account
    pushes/pulls a populated thread byte-for-byte) is REQUIRED after
    deploy, not optional.
    **Queued behind FX4 (item 33)** per Nick's own sequencing word —
    not started yet. S0's own deeper record-keeping (item 27's
    HB-arc-stewardship consolidation note, dropping the `cd1.1
    erratum WIP` stash) is this ticket's own build-time work, not
    done here — deferred to when TU1 actually builds, matching every
    prior ticket's own S0-at-build-time pattern. (The stash-drop was
    in fact done directly on `main` ahead of the build, once FX4's
    own build had started — see this same section's own earlier
    entry.)
    **BUILT, INDEPENDENTLY REVIEWED, AND PUSHED — 2026-07-19. NOT
    MERGED (at build time) — expected and correct for a schema
    ticket, not an incomplete state; see the merge record below,
    dated the same day.** Built S0-S6 on `tu1-tutor` off `main` @
    `5ed923c`, in its own isolated worktree per the ONE CHECKOUT PER
    AGENT rule, via a Workflow-orchestrated build+review pipeline
    (ultracode) — the same two-stage discipline every zero-schema
    ticket has gotten this session, just without the merge step this
    ticket's own brief explicitly withholds. **Schema, exactly as
    declared:** one nullable `tutor` jsonb column (`add column if
    not exists`, no default, no CHECK) plus both sync-mapper
    directions, matching the `origin`/`script` three-touch-point
    recipe exactly — independently hand-verified by the review
    (counted `$N` placeholders against the column list and VALUES
    tuple, confirmed byte-identical in shape). Server surface stayed
    within the brief's own enumeration (one column, two mapper
    touches, one route, `POST /api/tutor/chat`) — no STOP-and-report
    triggered, confirmed independently.
    **A real geometry defect found and fixed mid-build, measured not
    guessed:** a single Sliver-shaped anchor can't hold both the
    grip's own FX2-clamped box and a genuine ~300px open panel — at
    1280px the naive version silently clipped ~20px of the panel
    against `.desk-frame-host`'s own `overflow:hidden` (an unrelated
    FX3-era rule). Fixed with two separate DeskFrame overlay anchors
    instead of one. The review independently re-measured the CSS
    formulas byte-for-byte against the sliver's own left-edge
    version and confirmed the FX2 clamp technique is genuinely
    reused, not approximated. **Two further fixes landed the same
    way, caught live not guessed:** a Consistency-lens gap where
    ALL-CAPS/lowercase case variants of an already-known name were
    invisible to a Title-Case-only harvest (a second, targeted
    case-insensitive pass fixes it); and every raw-localStorage seed
    site in `tu1.mjs` itself mutates from the Desk, never while the
    entry's own page is mounted — a live reconfirmation of this
    project's own documented harness-seeding-vs-flushNow race
    (see memory).
    **The grandfather (null⇔undefined) proof — independently traced
    through the actual code, not just the test.** The review read
    `persistence.ts`'s own `clone()`/`upsert()`/sync-apply paths by
    hand and confirmed there is no "create empty thread" call site
    anywhere — the field is born only on a page's first real sent
    message. Server-side mapper correctness is proven by structural
    identity with `script`/`origin`'s own already-production-proven
    recipe, not a live database test (this environment has no test
    DB and `apps/server` carries no test harness of its own) —
    disclosed plainly by both build and review, not glossed over.
    **A13's ghostwriter rail — verified as GENUINELY structural, the
    exact discipline the brief asked for by name.** The review
    confirmed the harness's own sweep walks the live DOM generically
    (every button species found, not a hand-picked "known safe"
    list) and separately read `Tutor.tsx` itself: rendered messages
    are inert `<div>` text with no interactive children anywhere,
    and the component's own closure holds no editor ref or text
    setter at all — architecturally, no control in the file COULD
    reach a writing surface regardless of intent, not merely "none
    currently do."
    **S5's live-model path — both build and review equally honest
    about the same real limitation.** No `TUTOR_API_KEY` exists in
    either agent's own environment; a genuine end-to-end model
    round-trip was never attempted by either, and neither faked
    verification of it. What WAS verified thoroughly, live, by both:
    the offline/unconfigured path end-to-end (fails fast before any
    SDK object is even constructed, degrades to one quiet status
    line, never hangs, never crashes).
    **S3's Consistency lens — the review hand-traced the actual
    algorithm** against the harness's own seeded fixture and
    reproduced its exact two observations by hand, confirming
    determinism and correctness, not just "a check exists and
    passes." Structure/Fragments confirmed genuinely reusing
    pre-existing AB3/AB4-era functions, not re-derived under new
    names.
    **Full suite: 20 harness files (19 pre-existing + new `tu1.mjs`,
    96 checks), both `HARNESS_PARKED` settings, `tsc` (desktop AND
    server) + `build:web` + selftest — all green, 40/40 harness runs
    across BOTH the build's own pass and the review's fully
    independent, from-clean-install re-run. Zero discrepancies. Park
    sweep genuinely empty (a purely additive ticket), armed-but-empty
    gate matching the cd2/fx3/ab4 precedent.**
    **The review's own verdict: GREEN, no defects found, nothing
    fixed, nothing pushed by the review itself** — the first ticket
    this session where independent review found nothing rising to
    even a minor direct fix. One cosmetic-only item flagged, not
    fixed: a dead `deskLexicon` entry (`tutorDockReopen`) that the
    dock button doesn't actually use (a hardcoded glyph instead,
    same idiom as the grip's own hardcoded arrows elsewhere in the
    same file — not an accessibility gap, the aria-label routes
    through the lexicon correctly; purely a "not worth its own commit"
    inconsistency).
    **Judgment calls disclosed, independently reviewed and agreed
    with, none dissented:** the two-anchor geometry departure from a
    literal single-anchor mirror; the model default
    (`claude-opus-4-8`, independently confirmed current, not a stale
    guess); PageEditor's first-run gate rendering the Tutor absent
    outright rather than veiled-but-mounted like the sliver;
    Consistency's stoplist-heuristic honestly documented as "v1,
    not real NER."
    **Pushed and confirmed on `origin/tu1-tutor` @ `3b062df`** —
    verified independently by both agents via fresh fetches, not
    assumed. **The S1-precedent live prod round-trip remains
    explicitly outstanding**, owed after Nick's own merge-and-deploy
    cycle, not attempted or faked by either agent, exactly as the
    brief's own words require. Item 27's own HB-arc-stewardship
    consolidation note remains genuinely undone (out of any build
    agent's own visibility/authority, honestly disclosed rather than
    fabricated by either agent) — a human-session task, not a build
    task.
    **Fable's on-branch review landed — 2026-07-19**
    (`docs/wrizo-alpha/tu1-review-fable.md`, committed): **GREEN on
    the branch (`3b062df`), required 0** — the deepest depth
    disclosed of the run where it counts (full line-by-line read of
    the entire schema surface and the entire server route, not
    census-level). Six rulings of record, all RATIFIED/VERIFIED/
    ENDORSED: the grandfather is structural not guarded (no
    empty-thread writer exists anywhere); A13 architectural at every
    layer; privacy mechanically true to the disclosure's own wording;
    the two-anchor geometry deviation; the server-surface enumeration
    holds (SDK dependency accepted within the route's envelope); the
    truthful test double (`runtime-verify.mjs`) endorsed for proving
    the quiet-degrade path end-to-end rather than by inspection alone.
    **A1 (condition, not defect):** the live model path stays
    unexercised until `TUTOR_API_KEY` lands on Railway — Nick's own
    config step, his own timing; the quiet-degrade path is the proven
    net beneath it in the meantime.
    **MERGED — 2026-07-19, Nick's explicit word** ("TU1: MERGE" —
    Fable's GREEN on-branch review as the required condition, met).
    `tu1-tutor` merged into `main` (one expected conflict in this
    ledger's own item 34 — the branch's own build-time note
    superseded by this section's fuller record, resolved in favor of
    the more current text, two genuine fix details folded in above:
    the Consistency-lens case-insensitivity fix and the flushNow-race
    reconfirmation). `tsc` (desktop + server) + `build:web` + selftest
    + the full 20-script harness suite green on merged `main`,
    independently re-run by CC before push (matching both the build's
    and the review's own from-clean-install counts exactly — zero
    discrepancies). Pushed to `origin/main`.
    **Not deployed — Nick's deploy word comes separately, as always.**
    On deploy: manifest enumerated as always; AFTER deploy, the
    REQUIRED prod round-trip (scratch account, populated tutor
    thread, byte-for-byte both directions — the S1 precedent) before
    this item can close. Nick's own DoD sitting follows — the
    conversation half stays pending his own `TUTOR_API_KEY`.
    **Deployed — 2026-07-19**, Nick's word ("DEPLOY — Nick's word is
    given"), the manifest rule's first two-ticket deploy: `1dc0003..
    HEAD` = TU1 + FX5 (both named), plus docs riders only,
    independently re-enumerated before shipping — no unnamed code
    riders. `railway up` on `main` @ `6759777` (deployment
    `39bbe424`, SUCCESS), confirmed live (`200` on `/healthz` and `/`,
    `401` on `/auth/me`).
    **The REQUIRED S1-precedent prod round-trip — RUN, PASS,
    2026-07-19.** A scratch account registered live, pushed a
    `journal_entries` row with a populated three-message `tutor`
    thread via `/api/sync`, then pulled it back via a second
    `/api/sync` call simulating a second device: **the thread matched
    byte-for-byte, key-order-insensitive** (Postgres `jsonb` storage
    normalizes key order — array/message order itself, which carries
    real meaning, was preserved and verified exactly). A second push
    with no `tutor` field at all confirmed the grandfather clause live
    in production, not just in the harness: the pulled row carried
    **no `tutor` key whatsoever** (not `null`, not `{}`) — the
    resulting Object.keys() list confirmed by direct inspection. Both
    scratch entries soft-deleted after. **Item 34 does not fully close
    yet** — Nick's own DoD sitting remains, the conversation half
    pending his own `TUTOR_API_KEY` landing on Railway, his timing.
    The lenses and panel work fully without it in the meantime.
35. **FX5 — the Felt Verdicts.** **BRIEF COMMITTED — 2026-07-19.**
    `docs/wrizo-alpha/fx5-felt-verdicts-brief.md`, S1-S9 plus the S10
    center-the-paper amendment (item 33's own A1 close, folded in
    before build). Authority: Nick's FX4 verdict sheet, recorded under
    item 33 above. Zero schema (card titles/tags/metadata are
    explicitly NOT this ticket — card-committee material;
    STOP-and-report if any slice wants a column). Merge pre-authorized
    per the standing zero-schema rule; Fable reviews post-merge. Nine
    slices: the typewriter's manners (per-line engage motion, fade
    band one line lower, scroll freedom — typing never snaps back,
    viewport-top fade), the glow retuned to actually be perceptible by
    mid-goal, board surface polish (Plateau scrollbars, notecard-
    clamped page-pins, both-axis page-pin resize diagnosed and fixed),
    free card movement with permitted overlap and a quiet layer-order
    icon, the olive pin replacing the dead handle-gesture as the
    connection grab (footer line + its own toggle), no visible
    asterisks in the card popup, em-dash autocorrect, hover-restore
    diagnosed live on real hardware (root cause, not a re-guess), plus
    `fx5.mjs` and its own park sweep. A standing discipline born in
    this brief's own preamble: for every input-gesture claim,
    reproduce with the closest-to-trusted event stream the harness can
    produce, document the residual gap honestly in the check itself —
    FX4's own thread gesture and hover-restore both passed synthetic
    proofs and both failed under Nick's real hand. Report = push
    (merge pre-authorized).
    **Build starting — 2026-07-19**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-TU1-merge `main`.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-19.** Built S1-S9 + S10 on `fx5-felt-verdicts` off `main`
    @ `9ddd192`, in its own worktree. S0's own ledger work was already
    done directly on `main` before the build started (see item 33's
    close above); the build agent began at S1.
    **S1 (the big one) — the engage jump fixed by construction, not
    tuning.** Rewrote the typewriter's catch-up from an absolute
    "recenter to the band" jump to a relative, one-line-at-a-time
    step tracked in scroll-independent "document space" — the same
    mechanism kills both the multi-line jerk AND the snap-back-on-type
    bug at once, since the engine only ever nudges `scrollTop` by a
    delta on top of wherever it already sits, never recomputing an
    absolute target. Fade band moved one line lower via a new
    `--tw-fade-start` token.
    **S2 (the glow)** — easing exponent 0.55→0.28; measured, not
    guessed: computed opacity at 50% progress now reaches ~82% of the
    untouched cap (was ~68%). Did not fight the ceiling; no
    STOP-and-report needed.
    **S3 — the content-minimum trap, correctly re-diagnosed.** The
    brief's own prose named `page-pin`; empirically that was already
    fine. The real, reproducible trap lived in PORTED text cards
    instead — fixed there, judgment call disclosed in both code and
    harness rather than fixing where the words pointed and the bug
    wasn't. Plateau scrollbars added to the board canvas.
    **S4 — drag friction root-caused.** Missing early
    `setPointerCapture`: the old code only captured once the 6px drag
    threshold was crossed, leaving a real gap where a fast genuine
    drag's move/up events could route away from the canvas entirely.
    Fixed by capturing on the first pointerdown. Overlap was already
    permitted; a quiet layer-order icon added on selected overlapping
    cards.
    **S5 — the pin.** The dead handle-double-click gesture removed
    whole; a new olive pin-circle drag-and-release mints a thread in
    one continuous motion. Connections footer + its own toggle
    (`board-meta.footerOn`, riding the same zero-schema precedent as
    `canvasW`/`canvasH`).
    **S6 — asterisks, diagnosed not assumed.** Reveal-adjacent-to-
    caret chosen over hide-always after a real live finding:
    `display:none`/`visibility:hidden` on markers would have silently
    corrupted storage, since the popup's own `onInput` reads
    `Element.innerText`, which excludes both. Markers stay real
    characters, `font-size:0` when not adjacent to the caret.
    **S7 — the em dash, two real defects found and fixed.** (1) Native
    undo (`execCommand('undo')` AND a real Ctrl/Cmd+Z) turned out not
    to work AT ALL in either editor — both rewrite their entire
    contenteditable's `innerHTML` on every input, invalidating
    Chromium's own undo manager, a pre-existing architectural
    condition this ticket doesn't fix wholesale but disclosed plainly;
    a purpose-built one-step undo shim delivers the felt result
    honestly instead. (2) the post-substitution caret landed short of
    the untouched trailing space — fixed by computing the target
    position directly rather than trusting the post-`execCommand` DOM
    caret. Ships on Draft + the card popup only; Journal/Free Write's
    incompatible undo models are out of this ticket's scope,
    disclosed not silently dropped.
    **S8 — hover-restore, a SECOND real defect invisible to FX4's own
    four-cycle synthetic proof.** Reproduced with genuinely trusted
    CDP `Input.dispatchMouseEvent` (new `mouseMove`/`mouseDown`/
    `mouseUp` harness primitives — `isTrusted:true`, independently
    confirmed by the review, not synthetic `PointerEvent` dressed up).
    A real hand's natural jitter at an edge repeatedly crosses the
    strict `EDGE_PX` boundary, instantly cancelling the dwell every
    time — fixed with a short leave-grace window. FX4's own multi-
    cycle fix re-verified correct under real events, untouched.
    **S10 — the paper re-centers.** Strip pulled out of the grid into
    `position:absolute` (flush at screen x=0); the grid drops the
    strip's own column and regains true `margin:0 auto` centering.
    This exposed and required fixing a real regression in the
    sliver's own `--sliver-margin` formula (its "adjacent grid
    column" assumption broke) — caught by `fx2.mjs`'s own
    **pre-existing** floor check, not guessed, not a new assertion
    written to paper over it.
    **S9 — `fx5.mjs`, 65→66 checks after review, park sweep across 5
    files** (`fx4.mjs`'s whole S6 handle-gesture section parks with a
    live successor in `fx5.mjs`'s own S5; `ab4.mjs`'s second-
    generation park of the same lineage parks a third time —
    generations accrete, the house pattern; `cd1.mjs`'s symmetric-
    margins check gains a generation-2 note, S10's symmetry is a
    successor, not a restoration; `fx3.mjs`'s engage-line-count fence
    bumps 6→7, the documented consequence of S1's rewrite; `j4.mjs`'s
    port-then-edit flow gets a one-line gesture swap, old sequence
    parked). `fx2.mjs`/`cd2.mjs` needed zero check changes — confirmed
    by the review, not assumed.
    **Independent review — GREEN, with two real defects found and
    fixed at the root, neither trivial.** (1) `useTypewriterFade.ts`:
    S1's new multi-line catch-up chains a second
    `requestAnimationFrame` call OUTSIDE the tracked `raf` variable
    the effect's own cleanup actually cancels — a big catch-up
    interrupted mid-chain by a live writing-settings toggle (the
    scroll container persists across that, it's not a full unmount)
    leaves a zombie frame chain still nudging `scrollTop` on the
    still-mounted box: precisely the "page moves on its own" class of
    bug this entire ticket exists to eliminate. Fixed by folding the
    chained frame into the same tracked variable; behavior confirmed
    unchanged (identical 29px `maxStep` before/after). (2) `fx5.mjs`'s
    own S5 pin-drag gesture ran on synthetic `PointerEvent` dispatch
    only, sharing the identical early-`setPointerCapture` mechanism
    S4(a) itself proved needs a genuinely trusted press to mean
    anything — yet carried **zero fidelity-gap disclosure**, a direct,
    undisclosed violation of this ticket's own standing discipline
    (the brief's own S9 text names this exact gap by name). Fixed for
    real, not just disclosed: a genuinely trusted CDP press-drag-
    release proof added (mirroring S4(a)/S8's own technique), plus
    honest disclosure comments on the remaining synthetic branch-logic
    checks.
    **The review independently re-derived every load-bearing claim
    rather than trusting the build's report**: zero-schema confirmed
    via an empty `git diff` on `apps/server/` plus a full grep for any
    new box `kind:` literal (none); the A4 park-sweep audited against
    every harness file for anything FX5 could have falsified outside
    the declared sweep (found two benign non-issues, confirmed by
    hand, not just re-asserted); ink-coordinate safety confirmed via a
    byte-identical diff on `JournalEntry.tsx`/`store/ink.ts` plus the
    review's own live re-proof of `useTypewriterFade.ts`'s byte-truth
    fixture, run twice; the S10 composition law re-measured live at
    1280px/2200px/the 1100px floor, independently, not re-read from
    the build's own numbers.
    **Full suite, both passes.** Build: `tsc` (desktop+server) +
    `build:web` + selftest + all 21 harness files (added `fx5.mjs`,
    65 checks) green under both `HARNESS_PARKED` settings, re-run
    after every commit. Review: same suite, from a genuinely clean
    worktree install, 21/21 green both settings (one transient
    `w1.mjs` CDP-connection flake on its first sweep — "CDP page
    target never appeared" — confirmed non-reproducible, clean on
    immediate retry and clean again on both full post-fix sweeps;
    infra flake, not a code defect). CC's own third independent pass
    on the fast-forwarded `main`: `tsc` (desktop+server) + `build:web`
    clean, full 21-file/42-run suite green, zero discrepancies against
    both prior runs.
    **Judgment calls disclosed, all independently reviewed, none
    dissented:** S3's fix landing on ported-text cards rather than
    literal `page-pin` (the words vs. the reproducible bug); S7's
    em-dash scope (Draft + card popup only, Journal/Free Write's
    incompatible undo models out of scope); S7's custom undo shim (a
    pre-existing native-undo architectural gap this ticket doesn't
    fix wholesale, disclosed not hidden); S4(a)'s fidelity gap (a
    trusted CDP press proves the fix; only Nick's own hand proves a
    fast real mouse drag never breaks); the CSS commit-granularity
    compromise (S1/S3/S4/S5/S6/S10 hunks interleaved by line range,
    committed as one clearly-labeled commit after CRLF-blocked
    patch-splitting attempts, every other file cleanly per-slice).
    **Merged — 2026-07-19** (zero-schema, merge pre-authorized per the
    standing rule — no separate Nick's-go needed for the merge
    itself). Fast-forwarded `main` to `9c26de5` (no divergence, clean
    fast-forward, zero conflicts), pushed to `origin/main`.
    **Not deployed** — Fable's post-merge review hasn't landed yet;
    redeploy is Nick's call, as always, after that review.
    **Fable's post-merge review landed and is committed — GREEN,
    required 0, two advisories, 2026-07-19**
    (`docs/wrizo-alpha/fx5-review-fable.md`). Census at the two widest
    commits, record depth via the build's own diagnostic commit
    messages, the independent review's two real catches, and CC's own
    clean third pass (42/42). **The standing trusted-gesture
    discipline vindicated three ways**, all ENDORSED: S8's true root
    cause (edge-jitter cancelling the dwell clock) was physically
    invisible to synthetic dispatch, found only under trusted CDP
    events; the review caught the build violating the ticket's OWN
    discipline (S5's pin-drag proven synthetic-only, undisclosed) and
    closed it with a genuinely trusted proof, not just a disclosure
    note; the review's second catch (the untracked rAF chain) is
    exactly the chartered "page moves on its own" defect class.
    Rulings: the olive pin circle's square-corners exception
    RATIFIED with provenance (Nick's own words specified it); S6's
    reveal-adjacent-to-caret RATIFIED with its documented spec reason;
    S7's em-dash undo shim ACCEPTED as disclosed; S4's pointer-capture
    root cause and the S10-regression catch (by `fx2.mjs`'s own
    pre-existing floor check) both confirmed the estate working as
    designed. **A1 KEPT, Nick's own word, 2026-07-19:** cards
    are not meant to be the place where writers do a lot of text
    editing — the popup's own reveal-adjacent-to-caret asterisk
    treatment and the editing model both stand as built; ported cards
    keep their double-click travel to the source page, "Edit copy"
    edits the card itself. Not a defect, not reopened. **A2
    commissioned → FX6:** undo/redo, real Ctrl/Cmd+Z, restored in
    Draft's free editor and the card popup ("Yeah, let's fix this.
    It's only typewriter mode where I want to limit how much
    backspacing/deletion occurs" — forward-lock's own deletion
    discipline stays untouched everywhere it applies; full undo
    freedom is the goal everywhere else).
    **Deployed — 2026-07-19**, Nick's word, in the same two-ticket
    deploy as item 34 above: `railway up` on `main` @ `6759777`
    (deployment `39bbe424`, SUCCESS), confirmed live (`200` on
    `/healthz` and `/`, `401` on `/auth/me`). Manifest `1dc0003..HEAD`
    = TU1 + FX5 + docs riders only, independently re-enumerated
    before shipping. **Close pending Nick's own device-look sitting**
    against the brief's own Definition of Done (per-line engage
    motion, scroll freedom, the glow arriving by mid-goal, free card
    movement + overlap + the layer icon, the olive-pin thread gesture,
    no visible asterisks, the em dash, hover-restore on real hardware,
    the recentered paper).
36. **COMMITTEE MATERIAL — Boards-all-the-way-down architecture.**
    **RECORDED, NOT RATIFIED — 2026-07-19.** Nick, verbatim: "The
    entire Journal module and experience is totally broken. Needs to
    be retired until we fix it based on the new Page is Primary
    architecture. The Journal should essentially just be a pre-built
    custom Board that gets its own default menu link. Projects are
    really now just Boards that have a pre-built set of cards to be
    filled out by the user once they are walked through their
    structure options. The Shelf is just a Board where anything that
    hasn't been connected to another Board is placed for later
    organization. We also need a Trash option that clears unwanted
    docs but keeps them in memory for later retrieval. The big
    difference between Drawers and Boards, then, is that Drawers can
    contain multiple Boards. I'm not sure if we want to require all
    Pages and research docs to be added to a Board to be in a Drawer,
    but my lean is that when Drawers is selected, the cascading menu
    shows large thumbnails with each Board and doc listed, with the
    last-opened Board or doc displaying where our home Page is
    anchored. The committees review this before we go further with it
    in a future build." **NOTHING BUILDS from this block until the
    committee pass lands and Nick ratifies it.** Absorbs and
    supersedes the standalone Trash queue item once ratified (the
    Trash build is now architecture-linked, not a free-standing
    ticket — see item 33's own prior QUEUED note). Absorbs the
    Journal-retirement question raised across several prior sittings
    (items 25's committee docket addition, item 32).
    **RATIFIED — 2026-07-19.** The Boards committee pass
    (`docs/wrizo-alpha/boards-committee-pass.md`, committed) resolved
    the collapse-vs-dress fork the note above implies: system Boards
    (Journal/Shelf/Trash/eventually Projects) carry membership DERIVED
    from the existing stored truth (origin/deletedAt/projectId, A2
    untouched) while arrangement stays authored — zero data
    migration, chosen unanimously over a literal-collapse migration
    path. R1/R3/R4/R5/R7 approved, A16/A17/A18 ratified, B1–B3
    confirmed as phases (Journal+Trash → Shelf+Drawers → Projects as
    seeded Boards). R2's own concern and R6's own wizard-clarification
    (both Nick's verbatim words, with dispositions) are recorded in
    full at `docs/wrizo-alpha/boards-ratification-record.md`
    (committed) — R6 in particular stands as B3's own binding design
    authority once that brief is written, nothing builds from it
    before then. First phase's brief committed, queued: see item 38
    (B1).
    **B3's own material grows — "Card Deck," Nick's coinage, recorded
    2026-07-20.** A deck is a preset: an optional wizard that narrows
    choices, then deals a pre-built, fully-editable card set onto a
    board in the writer's drawer — B3's true shape is now the deck
    ENGINE plus the deck LIBRARY, not a bespoke wizard-per-project
    idea. `docs/wrizo-alpha/card-deck-catalog.md` committed (the
    Experts' pass): five structural laws binding every deck (ordinary,
    fully-editable cards, nothing locked or mandatory; the blank board
    stays first-class, decks are invitations never homework,
    anti-solicitation absolute; wizards obey the already-ratified R6
    rulings verbatim; deck DEFINITIONS are static zero-schema app
    data, DEALING one is ordinary card creation owing nothing to its
    template afterward; every deck names its own few, concrete,
    clickable narrowing choices) plus 21 catalogued decks across seven
    writer-population rooms (Fiction, the Speculative Annex, Screen,
    the Academy, the Business Desk, the Newsroom) and a v1 ship-set
    recommendation (six flagships, one per room, Character Study as a
    budget-permitting seventh). **NOTHING BUILDS from the catalog
    until B3's own brief** — Nick ratifies the ship set, cuts, or
    promotes at that brief, not here.
37. **FX6 — Undo and the Doors.** **BRIEF COMMITTED — 2026-07-19.**
    `docs/wrizo-alpha/fx6-undo-and-doors-brief.md`. Authority: item
    35's own A2 commissioning (real undo/redo in Draft's free editor
    and the card popup, forward-lock's deletion discipline explicitly
    untouched — "it's only typewriter mode where I want to limit how
    much backspacing/deletion occurs"); a newly recorded New Page
    discoverability gap, Nick's own word: "I often have no idea how
    to simply start a New Page from either the Page menu or the
    Board"; two one-line advisories carried since AB4's review
    (self-pin, the truthful no-projects empty-state line). Zero
    schema, merge pre-authorized; Fable reviews post-merge.
    **S1 — undo restored**, root cause already diagnosed at FX5's own
    S7 (both editors rewrite contenteditable innerHTML wholesale on
    every input, invalidating the browser's native undo stack); CC
    chooses empirically between a surgical-update path and an
    app-level snapshot stack, disclosed. The scope law is load-bearing
    and must not drift: forward-lock's own deletion discipline stays
    exactly as it is everywhere it applies — undo restoration is
    everywhere ELSE. **S2 — the doors**: an unmissable New Page action
    at the cascade's Page section head, a board-side "New page card"
    that creates a real page AND pins it in one act, quiet empty-state
    pointers — doorknobs only, no architecture movement (that's
    item 36's own gate). **S3 — the AB4 fold sweep**: self-pin closed
    at both ends, the empty-state line corrected to "create a project
    first." **S4 — `fx6.mjs`**, keyboard claims held to the same
    trusted-event discipline FX5 established for pointer gestures.
    Report = push (merge pre-authorized).
    **Build starting — 2026-07-19**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-FX5 `main`.
    **First attempt ORPHANED, not a loop — root-caused, not
    guessed.** The build sub-agent's own transcript shows its last
    event was `[Request interrupted by user]` mid-file-read, at the
    exact moment an unrelated interrupt in this session's own
    foreground turn landed (the B1 brief paste) — the same signal
    appears to have killed the background agent's turn too, and
    nothing ever resumed it; the workflow's own journal recorded only
    a `started` event, no result, no review phase ever begun. Found
    via direct transcript/timestamp inspection (10 hours of silence
    on a file that should have been growing), not assumed. Its
    partial S1 work (real, uncommitted) was checkpoint-committed and
    the branch renamed to `fx6-undo-and-doors-wip-interrupted-
    2026-07-19` for reference only — explicitly unverified, not
    trusted — then the worktree freed and a fresh build+review
    launched with one process change: agents now commit incrementally
    per slice, not in one final commit, so a future interruption loses
    less.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-19.** Built S1-S4 on `fx6-undo-and-doors` off `main` @
    `ee3907d`, in its own worktree. S0's own ledger work was already
    done directly on `main` before the build started.
    **S1 — real undo/redo, mechanism chosen empirically and
    disclosed.** Both surfaces rewrite their contenteditable's
    innerHTML wholesale on every input (required for live markdown-
    mark decoration), confirmed live to invalidate Chromium's own
    undo manager — the same root cause FX5 S7 diagnosed. Chose an
    app-level coalesced snapshot stack (`store/textUndo.ts`) over
    surgical DOM updates: the decoration engine has no cheap way to
    know which spans elsewhere in the line an arbitrary keystroke
    might affect, so "surgical" would mean rewriting it into an
    incremental diff engine — larger and riskier than this ticket's
    own invariant that Draft's dimmed-syntax register stays untouched.
    Coalescing granularity (word-ish steps, CC's own disclosed call):
    one real defect found and fixed during the build itself — the
    boundary character completing a word was initially recorded as
    its own isolated step rather than merging into the word it
    closed, caught via the harness's own parked proof, fixed by
    exempting that transition. The em-dash shim (FX5's own S7) is
    retired entirely — the substitution now records as two ordinary
    undo steps, so one Ctrl+Z reverts just the dash AND further walks
    back keep working, unlike the old shim's narrower "immediately
    after" case.
    **THE SCOPE LAW — verified live, not assumed, by both agents
    independently.** Every changed hunk in `ForwardOnlyEditor.tsx`
    confirmed by line range to fall strictly inside the `drafting`
    branch; `store/forwardOnly.ts`/`store/forwardLock.ts` carry zero
    diff, confirmed with an explicit stat. Live-exercised with a
    genuinely trusted CDP Ctrl+Z inside forward-locked Free Write:
    complete no-op, text byte-for-byte unchanged, backspace still
    strikes rather than erasing.
    **S2 — the doors.** An unmissable "New Page" button heads the
    cascade's Page section, routing through the same `
    createLooseHomePage()` door Arrival's own "Start writing" already
    uses (a judgment call: the build first reached for the journal-
    homed helper matching an unrelated pre-existing button, then
    reconsidered — `/page/:id` is the consistent landing surface for
    a project/board-adjacent "just give me a page" ask, not
    `/journal/:id`). The board sliver gains "New page card" — creates
    a page through the same door and pins it in one act. Two quiet
    one-line empty-state pointers added. **Park sweep required and
    done:** a third sliver tool falsified three pre-existing
    exact-tool-count assertions, parked per A4 with live successors
    (`ab4.mjs`'s park reaches generation-3, `fx4.mjs`'s reaches
    generation-2 — the accretion precedent holding).
    **S3 — self-pin closed at both ends** (the Pin sheet's leaf filter
    AND `pinPageToBoard` itself); the no-projects empty-state line
    corrected to "create a project first," matching AB4's own review
    A2 wording exactly.
    **S4 — `fx6.mjs`, 39 checks.** `runtime-verify.mjs` permanently
    gained `app.keyCombo`, a genuinely trusted CDP modifier-key
    dispatch, closing FX5 S7's own disclosed keyboard-fidelity gap
    rather than repeating it. Two harness-only defects found and fixed
    while building it (not product bugs): a raw DOM node returned from
    an eval crashed CDP's own serializer; and a board fixture seeded
    while a page was still mounted got silently clobbered by that
    page's own unmount flush — this project's own documented
    seed-then-reload/flushNow race (see memory), fixed by seeding from
    the Desk, matching every other fixture's already-proven pattern.
    **Independent review — GREEN, no genuine defects, nothing
    changed on the branch.** One process note: since the build's own
    worktree still held the branch checkout (ONE CHECKOUT PER AGENT),
    the review created a differently-named local branch tracking the
    same pushed tip to work in its own isolated worktree without
    colliding — same content, same commit, no shortcut taken. The
    review independently re-verified everything by diff and live
    exercise rather than trusting prose: zero-schema (explicit diff
    on `apps/server`, zero lines), the full park-sweep's generation
    numbering, THE SCOPE LAW by line-range diff inspection PLUS a
    live trusted Ctrl+Z inside forward-lock, the em-dash fold by
    hand-tracing the coalescing state machine AND exercising it live
    (substitute → undo → redo → walk further back, all correct), both
    self-pin guards via a UI-level check AND a direct function call
    bypassing the UI entirely, and confirmed every keyboard claim in
    `fx6.mjs` genuinely uses the new trusted dispatch (none synthetic
    except one deliberate, correctly-disclosed exception testing the
    old shim's own retirement). **One candidate finding chased down
    and honestly retracted**: a bare-literal string in
    `PinToBoardSheet.tsx` looked like a deskLexicon-discipline miss
    until the review checked the actual file and found it already
    uses bare literals + `themeLexicon` throughout, never importing
    deskLexicon at all — FX6's edit matches that file's own
    pre-existing local convention; the four genuinely new strings
    elsewhere correctly do route through deskLexicon.
    **Full suite, both passes.** Build: `tsc` (desktop+server) +
    `build:web` + selftest + all 22 harness files (new `fx6.mjs`, 39
    checks) green under both `HARNESS_PARKED` settings. Review: same
    suite, from a genuinely clean install, 22/22 green both settings,
    zero failures. CC's own third independent pass on the
    fast-forwarded `main`: `tsc` (desktop+server) + `build:web` clean.
    **Merged — 2026-07-19** (zero-schema, merge pre-authorized per the
    standing rule). Fast-forwarded `main` to `6bdea06` (no divergence,
    clean fast-forward, zero conflicts), pushed to `origin/main`.
    **Not deployed** — Fable's post-merge review hasn't landed yet;
    redeploy is Nick's call, as always, after that review.
    **Fable's post-merge review landed and is committed — GREEN,
    required 0, one advisory — 2026-07-20**
    (`docs/wrizo-alpha/fx6-review-fable.md`). Record depth on the
    slice messages, the independent review's own zero-defect result
    (the first fully clean FX-arc review since TU1), and the full
    suite green both PARKED settings. **The interrupted-then-recovered
    build ratified as standing process** — the wedged-session
    discipline applied correctly, on the record so it stays the
    standard. Seven rulings: the undo mechanism (path b) RATIFIED with
    its documented reasoning; the scope law held at three independent
    levels (diff, live trusted proof, existing asserts); the em-dash
    fold ENDORSED as landing better than specified (generalizes past
    "immediately after," unlike the old shim); **a new lane-law
    precedent named**: at-rest affordances stay OUT of the brass lane
    (nothing-orange-at-rest holds) — a persistent door like "New Page"
    wears olive-as-contrast, now the standing answer for every future
    resting action-door; the `window.wrizoPinPageToBoard` inspection
    seam ACCEPTED as established pattern; `app.keyCombo` confirmed to
    close FX5's own disclosed keyboard-fidelity gap with no residual
    left; the `ab4.mjs` generation-3 park and the review's own
    retracted candidate finding both ENDORSED as the accretion
    precedent and anti-false-positive honesty working as designed.
    **A1 answered — no fold needed.** `store/textUndo.ts` already caps
    stack depth: `MAX_DEPTH = 500`, enforced via `past.shift()` on
    overflow (the build's own code, confirmed by direct read, not
    asked-and-assumed); `future` is bounded by construction since it's
    always cleared on a fresh edit, so it can never exceed `past`'s own
    momentary size. Cap already shipped; the advisory closes as
    already-satisfied, not as a new fold.
    **Deploy state, for Nick's word whenever he gives it:** manifest
    since `6759777` = FX6 alone (one code ticket) + docs riders,
    enumerated and ready. FX6 may ride alone or share a deploy with B1
    later — Nick's call, whichever ships gets its own manifest
    enumeration at the time.
    **Close conditions:** (1) review on disk — met; (2) B1 unblocked
    by this review — met, see item 38; (3) deploy on Nick's word —
    **MET, see below**; (4) Nick's own FX6 DoD script — remains open.
    **Deployed — 2026-07-20**, Nick's word ("deploy everything that's
    ready to go live"), in the same two-ticket deploy as item 38
    below: manifest `6759777..HEAD` independently re-enumerated by CC
    before shipping (FX6 + B1 code commits, docs riders only, matching
    Fable's own manifest exactly) — `railway up` on `main` @
    `5a2babc` (deployment `fca07345`, SUCCESS), confirmed live (`200`
    on `/healthz` and `/`, `401` on `/auth/me`). **Item 37 stays open
    — Nick's own FX6 DoD script remains the sole condition.**
38. **B1 — the Journal Reborn (+ the Trash).** **BRIEF COMMITTED —
    2026-07-19.** `docs/wrizo-alpha/b1-journal-reborn-brief.md`.
    **UNBLOCKED — 2026-07-20**, Fable's FX6 review (item 37) was
    B1's own gate; met. **Build starting**, via a Workflow-
    orchestrated build+review pipeline (ultracode), off post-FX6
    `main`.
    **Authority — the Boards committee pass**
    (`docs/wrizo-alpha/boards-committee-pass.md`, committed same day):
    a double-pass triggered by item 36's own architecture note,
    resolving the fork between two ways to make "Journal is a Board"
    true. **R2 — the dress, not the collapse** (the Architects'
    unanimous choice): homes/origins/projectId/deletedAt stay the
    stored truth, A2's provenance law untouched; system Boards are
    REAL board pages whose card sets are DERIVED from that truth
    while arrangement stays authored — zero data migration, existing
    pages appear correctly on day one. **R1** names the Board the
    only arrangement primitive (Journal/Shelf/Trash/Projects all
    become system Boards wearing dresses; Drawers contain Boards).
    **R3** — membership is never required; keeping is never
    conditioned on filing. **R4** — Trash is a quiet move to a
    derived board (existing `deletedAt`, unsurfaced today), the
    Delete-is-Delete anti-nag core preserved, only finality amended;
    card/thread trash stays out of v1. **R5** — Drawers become the
    large-thumbnail shelf of Boards (a canon amendment, not a silent
    restyle), scoped against file-manager drift by keeping thumbnails
    to the cascade's reach-range panel only. **R6** — Projects
    convergence (seeded Boards + the wizard-cards commission) is one
    design landing with the P-arc walkthrough as the last, biggest
    phase (B3) — done once, done right, explicitly not rushed for the
    onboarding story. **R7** — phase order serves Nick's own named
    constraint (blocked constantly by the broken Journal; each phase
    must leave the app more usable than before it), Journal-first.
    **A16 (the Arrangement Law), A17 (the Drawer Law), A18 (the Trash
    Amendment)** — full text in the committee-pass doc itself, quoted
    in this brief's own preamble. **Five named tensions carried
    honestly, not resolved by fiat** (T1 a future "remove from
    Journal Board" gesture is design work, not plumbing; T2 whether
    hand-removal of system cards exists at all in v1 — arrange-only
    for now, Nick may overrule at the device; T3 the Shelf's own
    "unconnected" definition, ruled at B2's own brief; T4 the
    Board/Drawer/Shelf naming-legibility lexicon pass, before B2's
    chrome; T5 first-run's no-resume fallback re-pointing, landing in
    B1 itself). **Authority gap CLOSED — 2026-07-19**, superseding
    the earlier flag: `docs/wrizo-alpha/boards-ratification-record.md`
    (committed) carries Nick's R2 concern and R6 wizard rulings
    verbatim, with dispositions. R2's concern (a strong-bones worry,
    not a data-safety one — dev data explicitly disposable) SUSTAINED
    the dress on merits alone, independent of the migration-cost
    argument; three concrete waiver effects recorded there, including
    the vestigial `shelved` flag's own retirement landing at B2. R6's
    wizard clarification is APPROVED AS MODIFIED and stands as **B3's
    own binding design authority** once that brief is written — opt-in
    pop-out wizard, click-first/text-never-required, ends on a Board
    with plan cards laid out, a "Start Here" mark on the first card
    that vanishes on any card's completion (an open definition,
    flagged for B3's own brief to rule). Nothing builds from R6 before
    B3. The flag-not-invent call itself is noted in the record as
    correct.
    **The mechanism (S1-S6), not yet built:** system Boards as real
    board pages, find-or-create idempotent, marked by a new optional
    `systemKind: 'journal' | 'trash'` field on the existing
    `board-meta` element (the FX4 board-meta precedent, zero schema);
    derived-membership reconcile on mount (idempotent, authored
    positions never moved); arrange-never-author on system boards (no
    Add, inert Delete on derived cards, unpinnable); the Trash
    surfaced with a quiet Restore action, permanent purge explicitly
    out of v1; the old Journal module surface retired the same day
    its replacement ships (retirement-by-replacement, capture flow
    byte-identical, no 404 hole); `b1.mjs`. Zero schema expected,
    STOP-and-report the moment any slice wants a column; merge
    pre-authorized; Fable reviews post-merge.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-19.** Built S1-S6 on `b1-journal-reborn` off `main` @
    `7c5124e`, in its own worktree. **Zero schema — confirmed, not
    just claimed**: every slice lived in `origin` (a new `'system'`
    value), the existing `board-meta` element (`systemKind:
    'journal'|'trash'`), and `deletedAt`. No STOP-and-report
    triggered.
    **S1 — a latent blind spot found and closed before it could
    bite.** Every board pre-B1 always carried a `projectId`, so
    `inJournalView`'s own legacy fallback never had to consider a
    project-less board — a system Journal Board without an exclusive
    origin would have wrongly satisfied that fallback and appeared
    inside its own derivation. Closed with the new `origin:'system'`
    value; `getNotebookPages()` and `getResumeTarget()` hardened
    against the same "first board with no project" blind-spot class
    on the same pass.
    **S2 — the reconcile reuses the canonical membership rule**
    (`getJournalPages()`), not a re-derived one; returns `null` when
    nothing changed, so idempotence is checkable, not just asserted.
    Wired to `persistence.subscribe`, so a capture/delete/restore
    anywhere reaches whichever system board is open, live.
    **S3 — arrange-never-author, with a gap closed pre-review.** The
    sliver's Add is genuinely absent (not disabled — an optional
    prop, not a conditional render). While writing the harness, the
    build itself found and closed a real gap: `pinPageToBoard` had no
    code-level guard against pinning a system board onto a real
    board (only the UI path was closed) — fixed to match FX6's own
    self-pin precedent, belt-and-suspenders.
    **S4 — Trash surfaced, deletion mechanism untouched.**
    `restoreEntry()` clears only `deletedAt`. One deliberate exception
    to this file's deletion-filtered reads
    (`getJournalEntryIncludingDeleted()`) lets Trash cards show real
    titles instead of "Missing page." Restore is a plain button, no
    fidelity claim needed — disclosed explicitly rather than silently
    assumed.
    **S5 — the room retired, zero 404 holes, confirmed by direct
    enumeration.** `pages/Journal.tsx` deleted outright; `/journal`
    now resolves through a find-or-create gate. Every pre-existing
    caller (`DeskRail`, `JournalEntry`'s back-links, Arrival's
    no-resume fallback, every writing surface's own `backTo`) needed
    **zero changes** — they all already navigated to the literal
    string `'/journal'`. New stable `/trash` route added alongside.
    **Three real defects surfaced by the retirement itself, found and
    fixed, not papered over:** (1) a MOVES-verb toast that rode router
    history state into the now-deleted list surface, silently dropped
    — rewired through the new gate's own one-shot consume-and-replace
    effect; (2) the way-back return chip silently suppressed on
    arrival at the Journal Board (`isWritingRoute()` had matched every
    `/page/:id` unconditionally, `/journal` used to be exempt) — fix
    scoped to system boards only; (3) fixing THAT exposed a SECOND,
    previously-unreachable race — `useWayBack`'s unconditional
    capture-on-unmount would now clobber the very slot the visible
    chip depends on — closed with a new `participatesInWayBack` flag,
    defaulted true so every other caller is unaffected, system boards
    alone opt out. A large harness-fixture repair followed across
    `ab3`/`cd1`/`cd2`/`fx1`/`fx6`/`j4`/`j5`/`m1`/`th1`/`th2`/`w1`/`w2`
    — the old Journal list surface's retirement rippling exactly as
    far as it should and no further.
    **S6 — `b1.mjs`**, 51 checks at build time, growing to 53 after
    the review's own fix (below).
    **A16's own law — proven two ways, not just asserted.** Code-level:
    `reconcileSystemBoard` only ever adds/removes `page-pin` boxes,
    never touches `origin`/`projectId`/`deletedAt`; `restoreEntry`
    destructures away only `deletedAt`. Live: a sibling card's exact
    authored `x/y/w/h` survives idempotent re-runs, a delete, a
    Trash-side restore, and a full round trip byte-for-byte.
    **Independent review — GREEN, one genuine defect found and fixed,
    not caught by the build's own harness.** `describePageHome` never
    learned about `origin:'system'` — both system Boards fell through
    its generic else-branch and reported **"In the Journal"** as their
    own home, flatly false for the Trash Board (directly contradicts
    S1's own "no project home") and self-referential nonsense for the
    Journal Board itself. Verified live before fixing (stood on the
    Trash Board, opened its own Page panel, saw the false label) —
    exactly the same "first thing with no project" blind-spot class
    the build had already found and closed elsewhere, missed here
    because the harness asserted Pin/Move-Copy inertness but never the
    label text. Fixed at the `BoardEditor.tsx` call site only (every
    ordinary page's home label stays byte-identical), two new
    deskLexicon terms, two new regression checks added.
    **The review independently re-derived every load-bearing claim**,
    including writing and running its OWN throwaway harness script
    (not reusing `b1.mjs`) that performed a genuinely trusted
    pointerdown→multi-step-pointermove→pointerup drag, a real
    resize-handle drag, and a real overlap, then reloaded — 9/9
    checks confirmed the underlying pages' full record stayed
    byte-identical while the arrangement itself genuinely persisted,
    so the "untouched" claim is meaningful, not vacuous. The retired
    room's absence was confirmed by enumerating every `'/journal'`
    call site in the codebase by hand, not sampled — `DeskRail.tsx`,
    `JournalEntry.tsx`, `Spread.tsx`, `DrawersTree.tsx` confirmed as
    genuinely 0-diff files.
    **Judgment calls disclosed, none dissented:** Move/Copy made inert
    on a system board's own page face alongside Pin (the brief only
    named Pin; filing a system board into a project would break "no
    project home" the same way pinning would) — Port stays live,
    harmless (copies text only); no new page-delete UI added (the
    only pre-existing manual delete affordance, the Plan panel's
    board-delete, carries its own T4-ruled confirm dialog, left
    untouched as pre-existing, out-of-scope policy); legacy (<1100px)
    DeskRail gains no Trash item — reachable via the cascade or the
    new `/trash` URL only below the floor, a real reachability gap
    flagged rather than silently decided, following the standing
    "legacy chrome stays byte-identical" law.
    **Full suite, both passes.** Build: `tsc` (desktop+server) +
    `build:web` + selftest + all 23 harness files (new `b1.mjs`)
    green under both `HARNESS_PARKED` settings. Review: same suite,
    from its own clean run, all green, `b1.mjs` at 53/53 post-fix.
    CC's own third independent pass on the fast-forwarded `main`:
    `tsc` (desktop+server) + `build:web` clean.
    **Merged — 2026-07-19** (zero-schema, merge pre-authorized per the
    standing rule). Fast-forwarded `main` to `0147d8b` (no divergence,
    clean fast-forward, zero conflicts), pushed to `origin/main`.
    **Not deployed** — Fable's post-merge review hasn't landed yet;
    redeploy is Nick's call, as always, after that review. Manifest
    since `6759777` now also carries B1 (a second code ticket) plus
    docs riders, alongside FX6 — enumerate whichever ships when Nick's
    word arrives.
    **Fable's post-merge review landed and is committed — GREEN,
    required 0, one advisory — 2026-07-20**
    (`docs/wrizo-alpha/b1-review-fable.md`). **The first ticket judged
    under A16 itself**, and every one of the law's own load-bearing
    claims held under the strongest proof style this house has
    produced yet: arrangement-never-alters-truth proven TWICE (the
    build's own fixtures AND the review's from-scratch throwaway
    harness) — the skeptical second proof named as the standing
    A16-era review bar; idempotence proven the strong way (two mounts
    against unchanged truth, byte-identical, `null` returned when
    nothing changed); authored arrangement proven to survive the full
    delete→Trash→restore→Journal round trip byte-for-byte; arrange-
    never-author confirmed structurally absent (undefined handlers,
    not hidden buttons — the stronger form) rather than merely hidden;
    capture confirmed byte-identical via 0-diff files, not sampled.
    Five rulings of record: `origin:'system'` RATIFIED as a vocabulary
    addition, not a schema change (CHECK-free column, A2's
    null-grandfather untouched); **the three-bug chain RATIFIED
    in-scope** — fix-reveals-the-next, all three chased to root,
    existing only because nothing had ever made the Journal Board a
    real destination before; **the review's own defect AND its
    method both matter** — "verification by inhabitation, not
    inspection" named as the standard (the reviewer stood on the
    Trash Board and watched the false home-label render before
    fixing it); retirement-by-replacement executed with zero blast
    radius, the `/trash` route accepted as consistent with the
    letter and spirit both; the park sweep at its largest scale yet
    (nine harness files), including `th2`'s own "canonical /journal"
    claim correctly parked (retirement means the URL deliberately no
    longer stays canonical). **A1 accepted with eyes open**: the
    sub-1100px Trash reachability gap rides under the standing
    legacy-chrome-byte-identical rule until that regime's own
    reckoning or B2's chrome pass — no writer loses data, only a
    door, on one device class, temporarily. **No fold needed.**
    **B1's build side is closed.**
    **Deployed — 2026-07-20**, Nick's word ("deploy everything that's
    ready to go live"), together with item 37 (FX6) in one deploy:
    manifest `6759777..HEAD` independently re-enumerated by CC before
    shipping — FX6 + B1 code commits, docs riders only, matching
    Fable's own manifest exactly, no unnamed code riders. `railway up`
    on `main` @ `5a2babc` (deployment `fca07345`, SUCCESS), confirmed
    live (`200` on `/healthz` and `/`, `401` on `/auth/me`). **Item 38
    stays open pending Nick's own DoD sitting** (both FX6's and B1's
    scripts). Next brief awaits Nick's one-word queue decision (B2,
    already authorized by the standing B1–B3 confirmation — or V1
    first, if he ratifies the second sitting's four points) — nothing
    builds until it arrives.
39. **B2 (v2) — the Shelf, the Drawers, and the Places.** **BRIEF
    COMMITTED — 2026-07-20.**
    `docs/wrizo-alpha/b2-shelf-and-drawers-brief-v2.md` is the build
    text; `docs/wrizo-alpha/b2-shelf-and-drawers-brief.md` (v1) stays
    on disk as record per v2's own supersession note. **No in-flight
    v1 work existed to reconcile** — checked directly (no
    `b2-shelf-and-drawers` branch, no commits referencing it anywhere
    in history) before concluding this, not assumed.
    **Nick's sketch, verbatim (2026-07-20):** "the Page pop-out offers
    kinds of pages (New Journal Entry, New Page, Add Page) with
    toggled lists of drawers and New Drawer; pages join locations by
    checkbox — a journal page shows Journal checked, plus checkable
    boards/drawers." T3 (the Shelf's law) carries forward unchanged
    from v1, Nick-ratified: not deleted, not a system board, no
    project home, not journal-homed, zero user-board pins — starring
    irrelevant; pinning anywhere removes it at next reconcile.
    **The Architects' rulings on Nick's sketch, recorded:** (1) the
    checkbox panel is TWO ZONES, not one — Boards as true many-of
    checkboxes (pin/unpin, pure membership) vs. Home as single-select
    (Journal / a Drawer / Loose) because the one-home law (A16, R2's
    own dress) is stored truth, not membership — changing home is the
    real filing act, carries its existing one-shot confirmation, and
    no checkbox ever deletes; (2) **DRAWER SUBSUMES PROJECT IN
    CHROME** — storage keeps `projectId` (zero schema), only the
    writer-facing word "Project" retires app-wide in favor of
    "Drawer"; B3's future wizard seeds "the plan board in your
    drawer"; (3) the Journal Board's own membership law PINNED:
    origin `'journal'` AND no project home — filing removes a page
    from the Journal Board, origin (provenance) never changes, new
    journal entries appear with no sorting, ever; (4) "Add Page" read
    as the Board's own Add flow gaining an existing-page picker, the
    Page pop-out staying creation-plus-Places — Nick may flip this
    reading by one line, it is not a hard gate.
    **Two pending one-word gates, both explicit in the brief's own
    text, neither builds past its gate without Nick's word:** the
    Drawer chrome word-swap (S6) — **GATED, build LAST, STOP before
    it and report with the swap staged but uncommitted if the word
    hasn't arrived by the time every other slice is done**; the
    "Add Page" reading (S5) is NOT gated the same way — it proceeds
    on the Architects' own reading above, flaggable/flippable by one
    line at Nick's word, not blocking the build.
    Eight slices: S1 the third system Board (Shelf, every B1
    system-board law by the same code paths, not copies); S2 the
    Shelf's own Pin-to-a-Board action; S3 the legacy `shelved` flag's
    retirement (column dormant, never dropped, effect honestly
    audited); S4 the Places panel (the two-zone checkbox truth,
    superseding the old Moves "Add to..." flow entirely — its store
    paths are exactly what Places calls, its harness checks park at
    A4); S5 the Page pop-out's reordered roster + the board-side
    Existing-page picker; S6 the gated word swap; S7 the Journal
    Board's derivation pinned to the amended law + the Drawers panel
    (A17's chrome, derived grouping, Shelf as the first tile,
    anti-file-manager rule binding, no counts/badges/timestamps
    anywhere); S8 `b2.mjs`. Zero schema expected, STOP-and-report if
    any slice wants a column; merge pre-authorized; Fable reviews
    post-merge; per-slice commits from the start (the FX6 practice).
    **Build starting — 2026-07-20**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-B1-deploy `main`.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-20.** Built S1-S5, S7-S8 on `b2-shelf-and-drawers` off
    `main` @ `5374694`, in its own worktree. S0's own ledger work was
    already done directly on `main` before the build started.
    **S6 (the gated word swap) — CC's own disclosed deviation from
    the brief's literal instruction, orchestrated before the build
    even started.** The brief said "STOP and report with the swap
    staged but uncommitted" if Nick's word hasn't arrived; since a
    build worktree gets removed after its own turn ends, uncommitted
    staged changes there would simply be LOST, defeating the brief's
    own intent. CC instructed the build to touch ZERO "Project"
    strings and instead produce a complete file-by-file, string-by-
    string inventory — nothing shipped, nothing lost either. **The
    inventory landed, and it's substantial**: every literal
    writer-facing "Project" occurrence across ~16 files enumerated by
    exact file and line (`CreateProject.tsx`, `ProjectHome.tsx`,
    `kindLabels.ts`'s three domain labels, `DrawersTree.tsx`,
    `Desk.tsx` — flagged unreachable/orphaned, `StructureWizard`/
    `StructureBoard`/`BeatWizard`'s "Back to project", `QuickSprint`'s
    save labels, `PinToBoardSheet`/`PortToBoardSheet`'s empty-state
    copy, `ImportDraft`, three `deskLexicon` `boardHomeLabel*` terms,
    `ModeStage`'s Progress selector, and `JournalEntry.tsx`'s own
    legacy (<1100px) scrap-routing block — plus the seven `/project/*`
    route paths, flagged as a URL-scheme decision, not resolved here).
    **Two genuine open questions surfaced for the eventual fold, not
    adjudicated here:** whether "Drawer" is also meant to replace
    `themeLexicon`'s existing "Binder" term (the brief's own S6 text
    names only "Project," never "Binder") — a real ambiguity the
    brief doesn't resolve; and a **naming collision** between this
    ticket's new "Drawer" (a chrome word for Project) and the
    codebase's own pre-existing `Drawer` stored entity (`types/
    index.ts`, `/drawers` route, `DrawersTree.tsx` — an older,
    different ontology, one level above binders) — both now coexist
    under the same English word for two different things, flagged
    plainly rather than silently glossed over.
    **Three real defects found and fixed by the build itself, root
    cause not symptom** (all downstream of the `shelved` flag's
    retirement, S3): `describePageHome` never learned to read
    un-filed `origin:'project'` pages truthfully — a pre-existing
    latent bug the old `shelved` flag had accidentally papered over,
    surfaced fresh once Places made un-filing reachable; `getNotebook
    Pages()`'s own filter read the flag directly rather than a truth
    predicate, so once `shelved` stopped being written the filter
    would have silently gone vacuous — fixed with T3's own predicate,
    correctly distinguishing "still journal-homed" from "now
    Shelf-eligible" in a way the flag never could; the same class of
    fix applied to `resume.ts`.
    **Judgment calls disclosed, one a genuine literal-text deviation
    made for engineering-risk reasons — worth Fable's own read:** (1)
    the brief's own words ("system boards stay OUT of the tile
    roster, except the Shelf") read strictly as "the Shelf loses its
    own strip door, becomes tile-only" — the build did NOT do that;
    it kept the Shelf's own door (an 8-item strip count is asserted
    as a magic number across five unrelated, pre-existing harness
    files) AND additionally gave the Shelf the first-tile presence
    functionally, judged as the lower-risk reading of an ambiguous
    clause rather than a misreading of a clear one — disclosed
    plainly, not silently decided; (2) JournalEntry's own legacy
    (<1100px) Add flow left completely untouched — "superseded by
    Places" can only mean the framed doorway, since legacy chrome
    never had Places at all; (3) "Loose" and "Journal" resolve to the
    exact same store act post-retirement (T3 derives which pool a
    just-un-filed page lands in, purely from its own origin — judged
    the more honest design than any button dictating the outcome);
    (4) Pin stays as its own separate verb alongside the new Places
    checkboxes, a disclosed real redundancy — the brief names only
    Move/Copy as superseded, not Pin, and retiring it would have
    broken pre-existing Pin coverage across three other harness files
    for no textual justification; (5) "last-opened" approximated by
    `updatedAt` (no dedicated opened-at stamp exists, and adding one
    is schema this ticket doesn't get to spend); (6) three commits
    grouped thematically rather than strictly one-per-slice (every
    commit independently green against the full suite regardless).
    **A16 — proof on every single Places action, not just believed.**
    `b2.mjs` carries an explicit before/after origin+projectId
    snapshot assertion on every Home-zone and Boards-zone action
    (New-Drawer create-and-file, Loose for both journal- and
    project-origin pages, Boards-zone check/uncheck, the Existing-page
    picker) — confirming precisely which stored field each act is and
    isn't allowed to touch, verified live, not read off a comment.
    **Independent review — GREEN, one genuine defect found and fixed,
    invisible to the build's own harness because it was a truthfulness
    bug in unrelated legacy UI, not a functional one.** `AddToSheet
    .tsx`'s own "File to Shelf" toast had gone quietly FALSE as a pure
    side effect of S3/S7's own changes: under the new pinned Journal
    law, its only two reachable call sites can only ever see
    journal-homed pages, which can never actually leave the Journal
    by that click alone anymore — the toast kept insisting the page
    "left the Journal" while the page provably never moved. The
    reviewer proved the no-op live before touching anything, then
    fixed the CLAIM rather than the control (removing the button
    outright would have left that menu's root with zero destinations
    in the harness's own zero-drawer fixture state — a worse,
    actionless dead end than a corrected message). Old assertions
    parked per A4 with live successors in `j5.mjs`.
    **The review independently re-derived A16 exhaustively**, not
    just at the sites the build's own report pointed to: grepped
    every `.origin =` and `.projectId =` mutation site in the entire
    `apps/desktop/src` tree (not just the diff) and confirmed exactly
    seven origin-assignment sites (all record-creation, never
    mutation) and exactly two projectId-mutation sites (both inside
    `setPageHome`, the only place it's ever touched) exist anywhere in
    the codebase. Spot-checked roughly a dozen of the build's own S6
    inventory rows directly against source by line number — all
    matched — then independently grepped all 34 files containing
    "Project" for anything the inventory might have missed; found
    nothing missing.
    **Disclosed incompleteness in the review's own final sweep,
    honestly reported by the reviewer itself:** its first full 24-file
    sweep (pre-fix, both settings) matched the build's own table
    exactly; its SECOND sweep (post-fix, meant to be the clean final
    proof) completed only 14 of 24 files before the reviewer's own
    time constraints cut it short — backed by a static blast-radius
    grep showing only `j5.mjs` could be touched by the fix, but not a
    completed live run of all 24. **CC's own third pass below closes
    this gap fully, independently, from a genuinely clean state.**
    **Full suite, CC's own independent pass, all 24 files, both
    settings, from a clean install on the fast-forwarded `main`:**
    `tsc` (desktop+server) clean, `build:web` clean, and the complete
    48-run harness suite **green, 48/48, zero failures** — closing the
    review's own disclosed sweep gap fully; zero discrepancies against
    both the build's and the review's own partial/full runs.
    **Merged — 2026-07-20** (zero-schema, merge pre-authorized per the
    standing rule — confirmed genuinely zero-schema by the review's
    own `apps/server`/`packages` diff, empty). Fast-forwarded `main`
    to `33351d4` (no divergence, clean fast-forward, zero conflicts),
    pushed to `origin/main`.
    **Not deployed** — Fable's post-merge review hasn't landed yet;
    redeploy is Nick's call, as always, after that review.
    **Gate 1 CLEARED — 2026-07-20, Nick's word verbatim: "retire the
    word project as having any unique architectural purpose."** S6
    (the Drawer word swap) is now UNGATED — builds from the complete
    inventory the B2 build itself already produced, storage
    identifiers untouched as briefed. The Binder-vs-Drawer question
    (whether "Drawer" also retires `themeLexicon`'s existing "Binder"
    term) remains open — not resolved by this word, folded into the
    S6 build's own scope to judge and disclose.
    **Gate 2 CLEARED — the "Add Page" reading KEPT** as built: the
    Existing-page picker lands on the Board's own Add flow exactly as
    S5 already shipped it. No rebuild owed — a pure ratification of
    work already merged.
    **S6 folded, built, independently reviewed, merged, and pushed —
    2026-07-20.** Built on `b2-1-drawer-word-swap` off `main` @
    `b257344`, in its own worktree, using the B2 build agent's own
    inventory as its precise starting map (re-verified fresh via the
    same greps before executing, not assumed stale-safe). **A genuine
    omission the original inventory missed, found and fixed**:
    `CreateProject.tsx`'s own "Something else" note ("Opens the
    project home…") — caught via re-grep, not carried over blind.
    **Both open questions judged and disclosed, not silently
    resolved:** Q1 (Binder vs. Drawer) kept genuinely distinct where
    the older stored-Drawer entity's own name shares a screen with
    the generic word — those sites reuse the pre-existing `themeLexicon`
    "Binder" term instead of colliding with it, a literal reading of
    Nick's own word (he named "project" specifically); Q2
    (`DrawersTree.tsx`'s own "New Project" button, sitting directly
    under its own "+ New Drawer") swapped to "New Binder" to resolve
    the same-screen collision. Storage identifiers, `/project/*`
    routes (a disclosed, deliberate scope boundary — bigger structural
    call than the word itself commissioned, flagged for a future
    explicit ruling if routes are wanted too), the pre-existing Drawer
    stored-entity system, and `Desk.tsx`'s confirmed-still-unreachable
    "Begin project" were all left genuinely untouched, confirmed by
    re-grep, not assumed.
    **Independent review — GREEN, two real defects found and fixed,
    not theoretical.** The build's own Q1/Q2 reasoning was sound
    *per screen* but never traced *through navigation*: two buttons
    deliberately labeled "Binder" to avoid an on-screen collision each
    navigated one click later to a screen that unconditionally said
    "Drawer" for the exact same entity — deferring the same collision
    Q2 claimed to resolve, not preventing it. `DrawersTree.tsx`'s own
    "New Binder" row landed on `CreateProject.tsx` headlined "NEW
    DRAWER" regardless of context — fixed by threading the same
    `drawerId` query param the button already constructs, so Binder
    context now composes only when it applies. `QuickSprint.tsx`'s own
    "Save to/as Binder" landed on `ProjectHome.tsx`, which unconditionally
    read "Drawer" — but deeper investigation found the build's own
    collision justification for THIS one didn't actually hold (the
    breadcrumb it cited renders a proper noun, `drawer.name`, never
    the bare word "Drawer" — a proper noun beside a generic word
    doesn't collide, the same reason "My Documents" beside a "New
    Folder" button doesn't) — reverted to "Save to/as Drawer",
    restoring the majority, consistent convention rather than trading
    one mismatch for another. **Independent, load-bearing
    confirmation the gap was real, not theoretical**: fixing the
    second one broke `m1.mjs` — a harness file the ORIGINAL BUILD
    ITSELF had edited at this exact spot as "plumbing, not a park" —
    crashing outright on the stale button text, a third, independent
    signal the destination-mismatch was genuinely live.
    **Full suite, both passes, CC's own third independent run
    included.** Build: `tsc` (desktop+server) + `build:web` + selftest
    + all 25 harness files (new `b2-1.mjs`, 30→31 checks post-review)
    green under both `HARNESS_PARKED` settings. Review: same suite,
    its own clean run, 100% green, zero crashes. CC's own pass on the
    fast-forwarded `main`: `tsc` (desktop+server) + `build:web` clean,
    full 25-file/50-run suite **green, 50/50, zero failures** — zero
    discrepancies against both prior runs.
    **Merged — 2026-07-20** (zero-schema, matching B2's own standing
    authorization — pure chrome swap, storage untouched, confirmed by
    both agents independently). Fast-forwarded `main` to `4817ca1` (no
    divergence, clean fast-forward, zero conflicts), pushed to
    `origin/main`.
    **Fable's B2.1/S6 fold spot-check — DONE, GREEN, 2026-07-20.**
    Census-verified against `7bcebb7`: 15 files, all client chrome +
    lexicon, zero storage/route/server surface — the harness proof and
    the `m1.mjs` third-signal confirmation both noted. **Spot-check
    close condition satisfied.** Ruling recorded, now the standing
    disambiguation law for this whole naming space: "Binder" only
    where a bare "Drawer" would collide with another bare "Drawer" on
    one screen; a proper noun never collides with a generic. The
    `QuickSprint.tsx` reversion (Binder→Drawer, restoring the majority
    convention) SUSTAINED; the `/project/*` routes deferral
    acknowledged, still awaiting a future explicit ruling if Nick ever
    wants them renamed too.
    **Deployed — 2026-07-20**, Nick's word ("Deploy approved"),
    manifest independently re-enumerated by CC before shipping:
    `5a2babc..HEAD` = B2 + B2.1/S6 code commits, docs riders only —
    matching Fable's own manifest exactly (`main @ 13d4a62`), no
    unnamed code riders. `railway up` on `main` @ `13d4a62` (deployment
    `b101a08f`, SUCCESS), confirmed live (`200` on `/healthz` and `/`,
    `401` on `/auth/me`). **Item 39 closes on Nick's own device
    sitting** (the brief's own Definition of Done — Places panel,
    Journal-uncheck-on-file, the Shelf, Drawers, and the "Project"
    word gone from the desk) — remains open.
40. **B3 — Projects as Seeded Boards.** **BRIEF COMMITTED —
    2026-07-21.** `docs/wrizo-alpha/b3-seeded-boards-brief.md`.
    **Authority — item 36's own B3 pointer** (B3's true shape is the
    deck ENGINE plus the deck LIBRARY, Nick's "Card Deck" coinage,
    recorded 2026-07-20) **and the catalog**
    (`docs/wrizo-alpha/card-deck-catalog.md`, the Experts' pass: five
    structural laws, 21 catalogued decks, a v1 ship-set
    recommendation). The catalog is this brief's own material; the
    brief is the ticket — nothing beyond this brief builds from the
    catalog.
    **The ship-set decision, recorded as Fable's own call, explicitly
    Nick-vetoable at any point before merge:** seven decks ship, not
    six — the committee's own six flagships (Three-Act Structure,
    Worldbuilding, Feature Screenplay, Thesis/Dissertation, Grant
    Application, Feature Story) plus Character Study, promoted by
    Fable's own reasoning that once the engine exists a deck's
    marginal cost is a definition file, and Character Study is the
    threads mechanism's own best demonstration.
    **Zero schema is this ticket's constitution, not just a rule**:
    the catalog's own Law 4 — deck definitions are static app data,
    dealing a deck is ordinary card creation on an ordinary board
    (`boxes` jsonb only), dealt cards owe nothing to their template
    afterward (no back-reference, no deck identity persisted beyond
    ordinary card data — asserted directly in the harness). STOP-and-
    report the instant any slice wants a column.
    **The R6 wizard rulings (already ratified,
    `boards-ratification-record.md`) bind the engine verbatim, per
    catalog Law 3**: opt-in always, appearing only behind two
    deliberate doors, never suggested; a step-by-step pop-out over the
    faded board, never reflowing what's underneath; clickable-first
    narrowing questions, text permitted where a deck allows it,
    required never; ending on the dealt board, wizard gone; a quiet
    "Start Here" hint on the first dealt card that vanishes on the
    writer's first edit to ANY dealt card and never returns — ruled
    lawful orientation on an artifact the writer just asked for,
    earning no color in the orange lane.
    **Two doors only, both places the writer already deliberately
    went**: drawer creation (Blank stays first-class and first-listed,
    byte-identical to today; "Start from a deck…" sits beneath it) and
    any board's own existing Add flow ("From a deck…" beside its
    current options). No third door, no strip presence, no Tutor
    mention — anti-solicitation absolute.
    **Named non-goals, explicit boundaries not oversights**: the
    fourteen second-wave decks; cross-deck threading (a delight
    deferred with its own decks); the Résumé deck entirely (its
    tailoring card entangles the future paste-rail design, the
    catalog's own flag honored); the fate of the pre-existing
    `StructureWizard`/`BeatWizard`/`StructureBoard` trio (a future
    explicit ruling once the engine stands — this ticket adds beside
    them, touches them not at all, the `/project/*` deferral's own
    sibling); user-authored decks; deck editing after dealing (nothing
    to edit — a dealt card is just a card).
    Zero schema, zero new deps; merge pre-authorized; Fable reviews
    post-merge, gating close and redeploy.
    **Build starting — 2026-07-21**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-B2/S6-deploy `main`
    (the gate condition — "once the B2+S6 deploy lands" — already
    satisfied).
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED — 2026-07-21.**
    Built S1-S4 on `b3-seeded-boards` off `main` @ `317c2cb`, in its
    own worktree. S0's own ledger work was already done directly on
    `main` before the build started.
    **S1 — the engine, proven genuinely generic, not asserted.** A
    `DeckDefinition` is a plain static object (id, room, nameTerm,
    questions, a `deal(answers)` function); `DeckWizard.tsx` renders
    whatever the definitions declare and names no deck/card/room
    anywhere in its own code — the review independently read the
    engine's own source specifically hunting for hidden per-deck
    branching and found none. `materializeDeck` is pure (no I/O),
    minting real ids and deduped connection threads from a deck's own
    declared card list. "Start Here" (`store/deckHint.ts`) uses this
    project's own established per-entity-scoped local-flag shape
    (`firstRun.ts`/`tutorDisclosure.ts`'s pattern) — its full lifecycle
    independently live-verified against the brief's own exact fence:
    dealt a deck, edited a DIFFERENT card than the hinted one, hint
    still died; edited a third card after, hint stayed dead; moving
    (not editing) a card does not dismiss it.
    **A genuine architectural finding, not a stylistic choice**: the
    two doors use different persistence calls on purpose — door 2
    (Board's own Add flow) uses the existing debounced `setBoxes`
    autosave since a live BoardEditor is mounted; door 1 (drawer
    creation) calls `saveBoardBoxes` directly since its board has no
    live mounted component yet to race against. Diagnosed as a real
    race, not discovered and quietly worked around.
    **S2 — all seven decks, verbatim from the catalog.** Three-Act
    Structure, Worldbuilding, Feature Screenplay, Thesis/Dissertation,
    Grant Application, Feature Story, Character Study. **One real
    defect caught by the build's own pre-run counting, before the
    harness ever ran**: Feature Story was missing its own declared
    Kicker B card (the lexicon term existed, the deal function never
    used it) — fixed before first execution.
    **Judgment calls disclosed, all independently reviewed and
    sustained:** Three-Act's own proportional card counts (9/8/6 for
    novel/novella/short story — the catalog says "proportionately,"
    gives no numbers); Grant Application and Feature Story each
    invented one light wizard question the catalog names none for,
    since catalog Law 5 requires every deck to have narrowing
    questions; Character Study drops a single-character option
    outright, since a lone character can carry no relationship card,
    which would falsify the deck's own reason for promotion ("dealt
    pre-threaded"); relationship cards thread hub-and-spoke to BOTH
    sides separately rather than one line per pair, read as the more
    literal match to "wire the cast together" — independently
    live-verified by the review (3 characters, 14 cards, 4 real
    connection boxes, every endpoint traced to real ids from that
    exact deal).
    **S3 — the two doors, and only these two, structurally absent
    everywhere else.** Door 2 is genuinely absent on system boards
    (same law as the sliver's other three tools); Blank's own path
    through `CreateProject.tsx` confirmed line-by-line unchanged by
    the review — the only diff is an additive, CSS-inert-when-closed
    wrapper around the pre-existing picker, nothing touched inside it.
    **S4 — `b3.mjs`, 63 checks.** Board geometry proven byte-identical
    with the wizard open vs. closed (canvas pixel dimensions AND a
    pre-existing card's own rect, JSON-equal, at both reference
    widths) — not eyeballed. **A maintenance trap surfaced and
    disclosed, not silently absorbed**: adding a fifth sliver control
    falsified three separately-parked "sliver carries EXACTLY N tools"
    checks across `ab4.mjs`/`fx4.mjs`/`fx5.mjs` — an established
    re-derive-in-place lineage (distinct from a verbatim-park), each
    extended to its own next generation (5/4/3 respectively); one
    prior generation's own pointer to a "live successor in `b2.mjs`"
    turned out to name a check that never actually existed there
    (`b2.mjs` uses presence-only `.includes()`, never an exact count)
    — caught and corrected, not perpetuated. **Flagged plainly for a
    future ticket**: this three-copy lineage is real ongoing
    maintenance debt; every future sliver-tool addition must hunt down
    and re-derive all three copies by hand.
    **Two harness-methodology bugs found and fixed by the build
    itself** (not product bugs): an anti-solicitation check scanning
    `document.body.innerText` for "deck" false-flagged the sliver's
    own *closed* panel (DOM always present, CSS-hidden — true of every
    pre-existing Add door); an assertion expected 2 connections from
    Character Study's 3-character deal, when the deck's own real
    hub-and-spoke design mints 4 — both fixed to assert the actual
    intent, not the wrong number.
    **Independent review — GREEN, no defects found, nothing changed
    on the branch.** The review specifically hunted for six failure
    classes and found none: hidden deck-id branching in the "generic"
    engine; a smuggled-in `Box` field; a special-cased dealt-card
    type; a hint listening only to its own card; any UI reachable
    without a click; drift in the blank path. Zero-schema confirmed
    two ways: `apps/server` diff empty, AND `types/index.ts` (the
    `Box` interface itself) doesn't even appear in the changed-files
    list — no field was added anywhere, not even an optional one.
    Zero back-reference confirmed live, not just by grep: dealt every
    deck through the harness, read the resulting boxes directly,
    cross-checked every key against the real `Box` interface's own
    field set — zero foreign keys, both plain and threaded cards.
    Ordinary-card-ness confirmed live: dragged, edited, and deleted a
    dealt card through the real UI, no special-cased code path exists
    anywhere in `BoardEditor.tsx` for one. One imprecise number in the
    build's own prose caught and corrected (it said "22-file suite,"
    the actual pre-existing count was 25) — noted as a documentation
    slip, not a code defect.
    **Full suite, both passes.** Build: `tsc` (desktop+server) +
    `build:web` + selftest + all 26 harness files (new `b3.mjs`, 63
    checks) green under both `HARNESS_PARKED` settings. Review: same
    suite, its own clean run, 26/26 green both settings — including
    independently confirming the new sliver-count generations 5/4/3
    all pass live. CC's own third independent pass on the
    fast-forwarded `main`: `tsc` (desktop+server) + `build:web` clean,
    full 26-file/52-run suite **51/52 green on the first pass** — one
    transient failure, `j4.mjs` under `HARNESS_PARKED=1`, a CDP-level
    `SecurityError: localStorage access denied` unrelated to any
    assertion in the file (which B3's own diff never touches at all).
    Re-ran `j4.mjs`'s parked pass in isolation TWICE, both clean
    (28/28 both times, all four PARKED successors green) — confirmed
    a genuine transient browser-state flake, not a regression, and
    recorded honestly rather than silently re-run into a clean summary.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized per the
    standing rule — confirmed genuinely zero-schema by the review's
    own two-way check). Fast-forwarded `main` to `5f64194` (no
    divergence, clean fast-forward, zero conflicts), pushed to
    `origin/main`.
    **Deploy authorization on record, standing, given ahead of the
    usual per-instance word:** Nick, 2026-07-21 — "Review and deploy
    B3 whenever it's ready. I need to get eyes on these builds to
    know what's working/what isn't anyway." Per this explicit advance
    word, deploy proceeds on CC's own merge+verify pass completing,
    WITHOUT waiting for a separate Fable post-merge review first — a
    deliberate, disclosed departure from every prior ticket's own
    sequencing this session, where her review landed before deploy
    every time. Her review still lands and folds in normally
    afterward, same as several post-deploy folds already have.
    **Deployed — 2026-07-21**, manifest `13d4a62..HEAD` independently
    re-enumerated by CC before shipping (B3's own code commits, docs
    riders only, no unnamed code riders). `railway up` on `main` @
    `65a4fa9` (deployment `bfd3e8f2`, SUCCESS), confirmed live (`200`
    on `/healthz` and `/`, `401` on `/auth/me`). **Item 40 stays open
    pending Fable's post-merge review** (still owed, per the brief's
    own gating language, even though deploy itself didn't wait for
    it) **and Nick's own device sitting.**
    **Fable's post-merge review landed and is committed — GREEN, no
    fold — 2026-07-21** (`docs/wrizo-alpha/b3-review-fable.md`).
    Census-verified on the two widest commits (S1's seven client-only
    files including the full seven-deck lexicon load; S3's exactly
    three files, all additive call sites into existing store
    functions) — the zero-schema claim confirmed census-level, not
    taken on faith. **Explicitly ratified as lawful, not just
    accepted**: the deploy that preceded this review (Nick's standing
    word, manifest independently re-enumerated). **Five rulings of
    record**: (1) the two-doors persistence asymmetry SUSTAINED and
    RATIFIED as a durable pattern — lawful specifically because it was
    diagnosed, reasoned, and disclosed, made safe to reason about by
    the engine's own purity (`materializeDeck` never touches
    persistence, callers own the one mutation); (2) the sliver-tool-
    count lineage's own structural end RATIFIED — b3.mjs's ordered-
    labels roster check ends the magic-number generation pattern
    outright, and the generation-4 stale-pointer catch elevates a new
    standing rule: **a park's own live-successor pointer is now part
    of what every fold must verify**, not just the check's own
    content; (3) Character Study's never-one-character exclusion
    RATIFIED as by-design, not by luck; (4) **one open item, a
    question not a defect verdict**: "Start Here" wears brass where
    the brief said it earns no color in the orange lane — the build's
    own reasoning ("brass, not orange — no new color lane") sits in
    real tension with the house's own th2 precedent (brass for
    earned, evental moments only) — **Nick's own sitting rules it**:
    if it reads as a quiet mark, it stands; if it reads as an at-rest
    glow in the action lane, a b3.1 fold moves it to a muted ink tone,
    one token; (5) **the `j4.mjs` flake tracking formally opens at
    occurrence 1** — transient, clean twice in isolation, unrelated to
    B3's own diff — under the standing `th2.mjs` rule: a third
    occurrence within the tracking window triggers a scheduled
    deflake pass, not another note.
    **Close conditions: (1) this review on disk — met, this commit;
    (2) Nick's own sitting — the sole remaining gate.** His DoD walk
    (Blank first and untouched; two clicks into Three-Act's nine
    cards; the hint dying on his own first edit; a drag and a delete,
    no protest; no deck ever offered unasked) plus two named looks:
    Character Study's pre-threading (three characters, four threads)
    and the Start Here color question (Ruling 4 — his eye rules brass
    or ink).
41. **Nick's second desktop sitting — 2026-07-21. PARTIAL, relayed
    directly to CC, no Fable brief.** Eleven findings across two
    messages, Nick's own words, recorded verbatim before any triage or
    fix:
    1. **"New Page" while in the Journal lands on an older version of
       the Journal Page** — "which now should be just a regular Free
       Write page with typewriter mode, etc. defaulted to on."
    2. **Screenplay/script pages are broken**: "the tool and tutor
       menus are floating away from the page; the page itself is in
       a different location, way too small, and not centered. There
       are probably a number of other problems with how the
       screenplay/script page type is currently working" — Nick's own
       instruction: "do a thorough review there."
    3. **Free Write's own tool set is too sparse** — "the user should
       still be able to bold/italicize, bare minimum, and there
       should also be ink options for when we reinstate the ink
       feature."
    4. **The cascade's own submenus float away from the main strip**
       — "not rolling out from the edge and flush against the main
       menu... they float away from it, leaving a gap between the
       main strip and the sub-menu."
    5. **Scrollbars need a systemic pass** — "all scroll bars need to
       be restyled to be much more minimal and consistent with the
       colors and mood of each unique theme. Right now, they are
       bulky and mostly white, which makes them dominate visually,
       distracting from what a user will actually be trying to focus
       on."
    6. **Deck-dealt cards are not editable** — "double clicking on
       them did nothing."
    7. **Deck-dealt cards are not deletable** — "Nor can I seem to
       delete them."
    8. **Card resize is one-directional** — "once a card is upsized in
       any direction, it doesn't seem like it can be downsized."
    9. **The card layer-arrangement feature is not working.**
    10. **The deck wizard doesn't actually walk the user through a
        proper wizard** — "not doing it with pop-ups over a blurred
        out board like the way we've styled the card editor. Right
        now, it seems like the Plot Structure option is just leading
        back to the old, deprecated wizard."
    11. **Long file-listing menu sections should be collapsible** —
        "all menu sections that will have lists of previous Pages,
        Boards, or other file types should all be on toggles so the
        menus don't get dominated by long lists of files."
    **Triaged, Nick's own word, 2026-07-21.** Split per his own
    instruction: findings 2-10 build directly, no Fable brief — CC's
    own call on each, including root-causing whether 6-9 are genuine
    regressions or the project's own recurring synthetic-vs-real-
    hardware gesture gap (the same class FX4/FX5's hover-restore and
    drag-friction bugs were), and whether 10 is a genuine bug in B3's
    own new door or Nick reaching the older, pre-existing
    StructureWizard doorway instead. **Findings 1 and 11 held for
    Fable**: 1 is a real architectural question (JournalEntry.tsx's
    own fate as a distinct writing surface, per B1's explicit "the
    paper stays" ruling); 11 is a UX pattern spanning multiple menu
    sections needing a real spec (which sections, default state) not
    a guess. **Building now**: `FX7`, CC-authored (no Fable brief,
    explicit Nick authorization on record) — see item 42.
42. **FX7 — the second sitting's fixable bugs.** **BRIEF COMMITTED —
    2026-07-21, CC-authored, not Fable.**
    `docs/wrizo-alpha/fx7-second-sitting-fixes-brief.md`. Covers
    findings 2-10 of item 41's sitting (screenplay/script geometry, a
    thorough review per Nick's own instruction; Free Write's tool rail
    — Bold/Italic + ink affordances; the cascade submenu flush-gap;
    a systemic theme-aware scrollbar restyle; four board-card
    interaction bugs on deck-dealt cards — edit, delete, resize-down,
    layer-arrangement, each root-caused rather than assumed, given
    B3's own review just proved the same mechanisms working live
    minutes earlier; the deck wizard's own routing, investigated to
    determine whether Nick reached B3's genuine door or a separate,
    pre-existing doorway). Findings 1 and 11 explicitly excluded, held
    for Fable. Zero schema expected, STOP-and-report if any slice
    wants a column; merge pre-authorized as zero-schema. **Deploy is
    explicitly NOT pre-authorized** — Nick's own "deploy whenever
    it's ready" word was scoped to B3 by name, not read as a standing
    policy; redeploy here waits for his own word, same as the default
    for every ticket before B3.
    **Build starting — 2026-07-21**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-B3-deploy `main`.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-21.** Built S1-S9 on `fx7-second-sitting-fixes` off
    `main` @ `bb6f079`, in its own worktree.
    **S1 — the screenplay paper, root-caused as a genuine FX3
    regression, not a TU1 wiring defect.** FX3's own `flex:1 1 auto`
    on the stage's scroll-cap made the SCROLL-CAP itself the flex
    item filling the stage's own full width, so the script paper
    rendered flush-left instead of centered — exactly the "way too
    small, and not centered" verdict, and exactly why the sliver/Tutor
    anchors (whose math assumes a centered paper) read as floating
    away. `ScriptEditor.tsx` itself already used both of DeskFrame's
    own overlay anchors correctly — TU1's own two-anchor work was
    never at fault. Fixed by mirroring `.mode-stage`'s own zero-flex-
    grow pattern exactly.
    **S2 — Free Write's tool rail, one real implementation defect
    caught live before it shipped.** Bold/Italic added, reusing
    Draft's own `draftFormat.ts` marker convention. The first
    implementation (`execCommand('insertText', ...)`, this codebase's
    own established technique) was found NOT to reliably fire
    `beforeinput` in this harness's own Chromium build — silently
    dropping the marker on the next real keystroke's re-render — fixed
    with a new `insertMarkerRef` escape hatch calling the same
    `handleInput()` a keystroke calls. Forward-lock's own strike-
    never-erase discipline re-verified live, untouched. The ink
    affordance ships as a disclosed-inert placeholder (Journal's own
    pen/eraser icon shape, rendered disabled, tooltip: "Ink — coming
    soon outside the Journal") — not silently assumed functional.
    **S3 — the cascade gap, root-caused as an FX5 S10 regression.**
    FX5 S10 pulled the strip out of the grid's own flow
    (`position:absolute`, pinned to screen x=0) but the cascade
    anchor's own `left:0` was never updated to match — it stayed
    relative to the stage's own left edge, no longer adjacent to the
    strip. Measured, not guessed: the panel actually overlapped the
    strip by ~44-68px at ordinary widths and drifted to a ~228px gap
    past the wide-viewport seam. Fixed with a strip-relative offset.
    **S4 — scrollbars, a genuine inheritance bug found along the
    way.** The existing Plateau board-canvas treatment (FX5 S3a) was
    found LIVE to not actually inherit from its own `:root`-only
    declaration — promoted to a systemic `*` default reaching every
    scrollable region app-wide, with a paper-toned override for
    light-surface regions. One disclosed, deliberate exception left
    alone: `.beat-rail-dots`, whose own edge-fade mask depends on
    staying invisible.
    **S5-S8 — a single shared root cause found for two of the four
    deck-card bugs, proven not assumed.** FX5 S4(a)'s own "capture the
    pointer on pointerdown" drag-friction fix (still a genuinely
    needed improvement) had a side effect: it retargets every
    subsequent mouseup/click/dblclick to the canvas itself for the
    rest of that gesture — confirmed with genuinely trusted CDP
    events, and confirmed identically on both a real dealt card AND a
    hand-typed one, ruling out any deck-specific hit-testing
    explanation. **The diagnosis was proven experimentally, not just
    argued**: the fix was temporarily reverted, rebuilt, and the
    harness's own S5 check was confirmed to fail exactly as predicted
    before being reverted back clean. S5 (edit) and S8 (layer toggle)
    share this one cause, fixed respectively via `elementFromPoint`
    retargeting (the same technique `finishThreadDrag` already used)
    and an early-return guard mirroring the existing pin/handle
    pattern. **S6 (delete) turned out not to be an independent defect
    at all** — select reads `e.target` on the raw pointerdown, before
    capture ever engages, so it was never touched by the S5 bug;
    confirmed live that select-then-Remove already worked on an actual
    dealt card — pure downstream confusion from S5's own silent
    failure, disclosed plainly rather than a phantom fix invented to
    match the finding. **S7 (resize one-directional)** was a
    genuinely different mechanism: FX4/FX5's own reflow-floor effect
    re-fires on every intermediate `setBoxes` a resize drag emits, so
    a diagonal narrow-and-shrink drag could force an extra text-wrap
    line that the floor then immediately re-grew from, fighting the
    pointer in real time — fixed by standing the floor down for
    whichever box is actively mid-resize, reconciling once on release.
    **S9 — investigated, confirmed NOT a B3 bug.** Both of B3's own
    doors ("Start from a deck…" in `CreateProject.tsx`, "From a
    deck…" in the sliver) verified live to launch the genuine
    `DeckWizard` pop-out-over-blur correctly. What Nick actually
    reached was a DIFFERENT, PRE-EXISTING button — the Cascade's own
    "Plot a Story" (predating B3 entirely), which has always routed
    straight to the old `/project/:id/wizard` full-page
    `StructureWizard` route. Confirmed live by the page's own rendered
    body text. Per the brief's own explicit instruction, this old
    doorway was left completely untouched — its fate stays Fable/
    Nick's own call, exactly as B3's brief deferred it by name.
    **Independent review — GREEN, two real defects found and fixed,
    both in PRIOR TICKETS' OWN HARNESS FILES, not in FX7's own product
    diff.** The build's own final report was itself a stalled
    placeholder rather than an actual writeup (a background-monitor
    pattern that never resolved) — the review picked up the full
    verification load independently, from the actual git state, not
    from the build's own prose, and additionally discovered the
    branch had never actually reached `origin` (it existed only in a
    sibling worktree) — pushed it there itself, first time, disclosed
    plainly. **Gap 1**: S5's own correct `elementFromPoint` fix broke
    coordinate-less synthetic dblclick dispatch — the exact technique
    every prior ticket's own board-popup test has used since FX4 S5 —
    across five live files and two parked-only checks; fixed at all
    ~15 call sites by supplying real on-screen coordinates to the same
    dispatch, the identical "update the reach-mechanism, keep the
    claim" pattern FX4 S5 already established once before. **Gap 2**:
    S2's own deliberate Free Write format addition falsified three of
    `ab2.mjs`'s own checks asserting format's ABSENCE — a straight A4
    miss, caught only because the review ran the FULL historic suite
    where the build's own S10 had only run its own `fx7.mjs`. Parked
    per A4, live successor named. **The review went further than
    required on several claims**: took real CDP screenshots at all
    three widths to confirm S1's centering visually, not just via
    `getBoundingClientRect()`; found a sharper explanation than the
    build's own hand-wave for why B3's review missed S5 entirely (a
    fully synthetic `dispatchEvent` is structurally immune to
    pointer-capture retargeting regardless of trust level, not merely
    "probably tested something else").
    **Full suite, both passes.** Build: `fx7.mjs` reached 46/46 across
    its own four sections. Review: full historic 26-file suite
    re-run clean from scratch after its own two fixes, both
    `HARNESS_PARKED` settings; `fx7.mjs` unchanged, 46/46. `tsc`
    (desktop+server), `pnpm run build`, and `build:web` all clean.
    **A concurrent session discovered at merge time, resolved
    cleanly, no data at risk.** While this build was running, a
    SEPARATE, legitimate CC session opened TU2 (item 43, the
    Listener) directly on this same primary checkout's own `main` —
    confirmed genuinely unrelated (docs-only commits, zero file
    overlap with FX7's own diff) before merging, not assumed safe.
    Merged via an explicit merge commit (`git merge --no-ff`, fast-
    forward was no longer possible) rather than force-pushing or
    resetting anything. TU2's own worktree and branch were never
    touched. CC's own third independent verification pass: `tsc`
    (desktop+server) + `build:web` clean, full 27-file/54-run suite
    **green, 54/54, zero failures** — zero discrepancies against both
    the build's and the review's own runs.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized per the
    standing rule — confirmed genuinely zero-schema, `apps/server`
    diff empty). `origin/main` was still at this merge's own base
    (`bb6f079`) when pushed — TU2's own local commits hadn't reached
    origin yet from its own session — so this push carried both
    TU2's opening and FX7's full merge to origin in one clean
    fast-forward, `bb6f079..9148be0`. Pushed to `origin/main`.
    **Fable's post-merge review landed and is committed — GREEN, no
    fold, one advisory — 2026-07-21**
    (`docs/wrizo-alpha/fx7-review-fable.md`). Census-verified, not
    taken on faith: the widest product commit confirmed at exactly
    seven `apps/desktop`-only files, zero server; depth resting on
    three upstream layers (`fx7.mjs`'s own 46 checks, the independent
    review's from-scratch verification including real screenshots and
    the full historic suite the build itself never ran, and CC's own
    54/54 third pass). **Seven rulings of record:** (1) **the revert-
    reproduce-restore proof RATIFIED as the standard** for any "prior
    ticket X caused this" claim going forward — diagnosis as
    experiment, not argument; (2) S6's own honest non-fix RATIFIED —
    "delete was never broken," said plainly rather than inventing a
    phantom fix to match the finding; (3) S9's untouched door
    RATIFIED — both of B3's own doors confirmed live-correct, the old
    wizard's own fate still parked, taken up with J6 or on its own;
    (4) **Gap 1's fix pattern promoted to standing practice**: a
    harness technique used across many files is itself a shared
    dependency — any change to input synthesis or hit-testing now
    runs the FULL historic suite before push, not just the ticket's
    own file, named directly as the lesson FX7's own build skipped and
    the review's own second net caught; (5) Gap 2's A4 parking
    verified at record depth; (6) **ADVISORY, for Nick's own eye**:
    the ink placeholder's visibly-disabled state sits in tension with
    M1's own "offered only when it exists, no greyed states" pattern —
    but item 41's own finding 3 asked for exactly this in Nick's own
    words, so his word outranks the generalization; standing as built,
    one word at the sitting settles it either way; (7) a commit-
    message imprecision noted without consequence (fe67f1a said "six
    findings," the record correctly holds eleven).
    **The concurrent-session collision — CC's own handling explicitly
    RATIFIED as exemplary** (verified non-overlap before touching
    anything, an explicit merge commit, no force or reset, TU2's own
    branch/worktree never touched, full disclosure) — named as the
    THIRD occurrence of this shared-tree class (after the two CD1.1/
    HB1 collisions on 2026-07-16). **The proposed "S0-push rule" —
    RATIFIED, 2026-07-21, Nick's word ("Sure, ratify S0-push rule").**
    Full text recorded under TOOLING STATUS, alongside ONE CHECKOUT
    PER AGENT. Binding practice from this point forward — this
    session's own future S0-style records commits land via a
    fast-forward push from a differently-parented branch, never as
    direct commits against the primary checkout's own local `main`.
    **Deployed — 2026-07-21**, Nick's word ("my go-ahead to deploy
    everything built"), manifest independently re-enumerated by CC
    before shipping: `65a4fa9..HEAD` = FX7's own four code commits +
    docs riders only (including TU2's own docs-only brief/ledger
    commits — TU2's actual code stayed unmerged, confirmed, so it
    rode along in none of this). `railway up` on `main` @ `e5b368e`
    (deployment `80b8f872`, SUCCESS), confirmed live (`200` on
    `/healthz` and `/`, `401` on `/auth/me`). **Close condition 2
    (Nick's deploy word) — MET, satisfied by the above, matching the
    review's own manifest exactly.** Close condition 3 (Nick's own
    device sitting, the S5-S8 gesture class and S1 screenplay geometry
    especially, per the trusted-pointer law) remains open. **Findings
    1 and 11 are ruled separately, briefs to follow TU2's own review**
    — finding 1 becomes `J6 — One Paper`; finding 11 becomes `FX9 —
    the Folded Lists` (renamed from the original `FX8` — see item 45's
    own record: the disk wins, the number is claimed by the ticket
    that actually opened as a ledger item, never by a review's forward
    reference in prose; a new standing rule, recorded under TOOLING
    STATUS).
43. **TU2 — the Listener.** **BRIEF COMMITTED — 2026-07-21.**
    `docs/wrizo-alpha/tu2-listener-brief.md`. **Authority:** the Tutor
    committee pass as ratified (A12-A15 whole) and the Tutor's own
    second sitting of 2026-07-21 (Nick's six additions reviewed and
    shaped by Fable; sequence ruled TU2->TU6: TU2 the Listener (this
    ticket), TU3 Ledger, TU4 Mechanics+cards, TU5 Memory, TU6
    Accounts). **This is the first record in this repo of that
    sitting and its sequence ruling** — no prior doc names TU3-TU6
    before this brief. **TU5 (Memory) is explicitly NOT settled by
    this sequencing**: its memory-rules wording still awaits Nick's
    own review; recorded here as an OPEN ratification item, not
    assumed.
    Five build slices: S1 provider-agnostic config (DeepSeek V4 Flash
    default; `TUTOR_BASE_URL`/`TUTOR_MODEL`/`TUTOR_API_KEY`/
    `TUTOR_MAX_TOKENS`, server census locked to exactly `env.ts`,
    `tutor.ts`, `.env.example`); S2 delta reads on a persisted cursor
    — **a charter amendment to TU1 S1's "nothing else is ever
    persisted," made on Nick's word at this brief's ratification**:
    `lastRead?: { at, chars }` joins the `tutor` jsonb; S3 disclosure
    v2 (versioned, shown once per version, new wording since page
    text now travels); S4 the panel's geometry retrofit (grip flush
    to the page's right edge mirroring the strip; presence extends to
    `pageKind='board'`); S5 the session meter (client-only, no
    schema). **ZERO MIGRATION — merge pre-authorized as zero-
    migration per the AB4 precedent**, with the three-file server
    census as the hard boundary — anything more is STOP-and-report.
    Report = push; Fable reviews post-push; deploy is Nick's separate
    word, manifest enumerated as always.
    **Build starting — 2026-07-21**, on `tu2-listener` off `main` in
    its own worktree, per ONE CHECKOUT PER AGENT.
    **BUILT, INDEPENDENTLY REVIEWED, AND PUSHED — 2026-07-21.** Built
    S1-S6 on `tu2-listener` off `main` @ `00bdc2e`, in its own
    worktree, via a Workflow-orchestrated build+review pipeline
    (ultracode).
    **S1 — the model id independently verified live, not carried over
    from training data.** Before the build started, the orchestrating
    session ran a live web search plus a direct fetch of
    api-docs.deepseek.com/quick_start/pricing and confirmed
    `deepseek-v4-flash` is DeepSeek's current V4 Flash id (alongside
    `deepseek-v4-pro`) and that `deepseek-chat`/`deepseek-reasoner`
    deprecate 2026-07-24 15:59 UTC — matching the brief's own claim
    exactly. `TUTOR_BASE_URL` (default DeepSeek's own
    Anthropic-compatible endpoint), `TUTOR_MODEL` (default
    `deepseek-v4-flash`), `TUTOR_MAX_TOKENS` (700) land in `env.ts`;
    the base URL wires into the SDK client's own option, no other
    route logic changes.
    **S2 — a real design call, disclosed, not buried.** The delta
    rides as its own capped top-level body field (not folded into the
    existing `messages` array), because the pre-existing 4000-char
    per-message validation would otherwise silently reject any real
    ~4k-token delta the first time one was actually sent — found and
    designed around rather than discovered later as a break. Conduct
    rule 37 lands in the system prompt; `usage`/`model` now ride the
    chat response so S5's meter needs no further server touch.
    **S4 — a "fix" that turned out to already be true, disclosed as
    such.** The grip-flush requirement was algebraically audited
    rather than assumed broken: the FX2-clamp formula already
    resolves to zero overflow at all three reference widths, so no
    CSS change was needed there — recorded as a verification, not
    invented as a fix. The open width now genuinely computes to `2 ×
    --strip-width` (168px) instead of a hardcoded guess. The
    A15-vs-strip-easing tension the brief anticipated was checked by
    reading Cascade's own live CSS rather than assumed — Cascade's
    own transition is itself a bare hardcoded 180ms literal, not the
    shared `--ease`/`--t-state` tokens, so no real conflict existed
    once measured; Tutor's own 180ms is left untouched, matching
    Cascade's real value exactly.
    **Width correction — 2026-07-21, per FX10's brief, spec error not
    build error.** The `2 × --strip-width` (168px) open width above
    was built exactly as this ticket's own brief specified, and the
    build's own algebraic audit was sound against that spec. **The
    spec itself was wrong** — Fable's own words, on the record: "the
    number was wrong." Nick's device findings the same day showed the
    resulting panel unusable at that width. FX10 (item 51) corrects
    it to `clamp(320px, 34% of the viewport, 460px)`, further clamped
    against the paper's own clearance law. Recorded here so this
    item's own history reads honestly rather than silently
    superseded.
    **S6 — the park sweep was empirically reran, not just grepped.**
    All 26 pre-existing harness files were actually re-executed
    against the TU2 diff, not just text-searched; exactly two TU1
    assertions came up genuinely stale (the old unversioned
    disclosure-seen check; the old ~300px docked-width-reaches-cap
    check) and were parked per A4 with live successors in the new
    `tu2.mjs` (102 checks). One harness fixture (`tu1.mjs`'s
    `freshDesk`) needed a seed-key fix to keep working under the new
    versioned disclosure flag — a fixture repair, not a parked
    assertion, disclosed as such.
    **Independent review — four parallel lenses (server census +
    zero-migration, listener invariants, geometry/A13/A15, fresh-eyes
    defect hunt), all GREEN or GREEN WITH ADVISORIES, zero STOP
    conditions.** One real defect found and fixed: `env.ts`'s own
    comment had claimed the model-id verification as settled fact
    while a sibling file's comment (`tutorCostEstimates.ts`, same
    build, same date) admitted the *build agent's own* live-search
    attempt had hit repeated tool errors — an unexplained
    inconsistency on the brief's single most consequential
    requirement. Corrected to accurately attribute the verification
    to the orchestrating session's own successful check (above),
    rather than leave either a false claim or a falsely-uncertain one.
    Advisories carried forward, none blocking: an empty/whitespace
    model reply silently no-ops with no writer-facing status line; the
    cost-estimate table's dollar figures are explicitly disclosed
    placeholders (the review's own live pricing search also hit
    repeated errors); Tutor's and Cascade's 180ms transitions are two
    independently-hardcoded literals that happen to match, not a
    shared token; Cascade's own pre-existing (not this ticket's)
    dock-floor gate is still vacuously permissive on Board surfaces, the
    identical defect class TU2 S4 just fixed for Tutor; the
    tokens-only meter line's "est." label reads as a minor
    self-contradiction next to "no cost estimate."
    **Zero migration and the three-file server census independently
    reconfirmed a third time**, by the orchestrating session itself
    after the workflow finished, by direct `git diff` against
    `apps/server` (exactly `env.ts`/`tutor.ts`/`.env.example`, nothing
    else) and a full-diff grep for any `package.json`/lockfile/
    migration/schema touch (none, anywhere in the 17-file diff).
    **Full suite green**: `tsc` ×2, `build:web`, selftest, all 27
    harness files (new `tu2.mjs`) under both `HARNESS_PARKED`
    settings — one documented pre-existing `th2.mjs` flake (its own
    known celebration-animation timing race, unrelated to this diff)
    cleared 42/42 on three immediate reruns, exactly per this
    project's own standing practice.
    **Pushed to `origin/tu2-listener`, then MERGED — 2026-07-21.**
    Fable's own on-branch review landed GREEN, required 0
    (`docs/wrizo-alpha/tu2-review-fable.md`, committed by that
    session); Nick's own merge word followed in that same session's
    own conversation, not this one. Merge commit `c04a1f1` (parents
    `d45f7f7`/`45ea10e`) confirms it directly. **Correction, sourced
    from git truth, not this session's own narrative** — the fuller
    build/review/merge record for this ticket belongs to the session
    that ran it; this note exists only so the ledger doesn't sit
    stale claiming "not merged" when `main` itself already disagrees.
    **Deployed — 2026-07-21**, Nick's word ("Deploy TU2"). Manifest
    `e5b368e..HEAD` independently re-enumerated by CC before shipping
    — TU2's own eight code commits plus docs riders only (including
    FX8's own brief commit, docs-only; FX8's actual code stayed
    unmerged, confirmed, so it rode along in none of this). **CC's
    own full independent verification, run fresh rather than trusted
    from the other session's own relay**: `tsc` (desktop+server) +
    `build:web` clean; the full 28-file/56-run harness suite hit real
    friction along the way, root-caused rather than waved through —
    a first pass (accidentally run in parallel with an isolated
    single-file re-check, CC's own error) produced contention noise
    (`EBUSY`, a stray "CDP page target never appeared"); a second
    attempt crashed outright partway through from an orphaned,
    still-running `fx5.mjs` process left over from the first pass,
    found and killed by process name (an accidental self-match on the
    first kill attempt terminated the PowerShell session running it,
    but not before the real targets were already gone — confirmed by
    a clean process-list check immediately after); a third, fully
    clean pass then reached its own summary cleanly: 54/56 green,
    with `tu2.mjs` failing in BOTH `HARNESS_PARKED` settings within
    the suite specifically. **Investigated, not dismissed**: three
    separate isolated re-runs (twice alone, once in direct
    tu1-then-tu2 sequence matching the suite's own order) all came
    back 102/102 clean — meeting this project's own standing bar for
    calling a suite-context failure a genuine transient (load/timing
    under a long sequential CDP-browser run), not a code regression,
    disclosed here rather than silently re-run past. `railway up` on
    `main` @ `368fb10` (deployment `b73e35d6`, SUCCESS), confirmed
    live (`200` on `/healthz` and `/`, `401` on `/auth/me`).
44. **DeepSeek API account — Nick's own note, 2026-07-21.**
    "I have set up a DeepSeek v4 API account and topped it up with $10
    for testing." This is the credential TU2's own S1 (provider-
    agnostic seat, DeepSeek V4 Flash default) is built to consume via
    `TUTOR_API_KEY`/`TUTOR_BASE_URL`/`TUTOR_MODEL`.
    **`TUTOR_API_KEY` now SET on Railway — 2026-07-21**, confirmed by
    that session directly (a minor self-disclosed hygiene note there:
    a check command printed the raw key into that session's own
    context once, caught and not repeated — noted here as project
    history, not a live exposure, key not repeated in this record
    either). `TUTOR_BASE_URL`/`TUTOR_MODEL` deliberately left UNSET —
    TU2's own `env.ts` already defaults to exactly the right values
    (`https://api.deepseek.com/anthropic` / `deepseek-v4-flash`) once
    TU2's code actually deploys, so an explicit override would only
    risk drifting stale later. Open for Nick's own word if he'd rather
    have them explicit anyway.
    **Currently deployed code predates TU2** — no `TUTOR_BASE_URL`
    support yet, so this DeepSeek-shaped key would fail auth against
    Anthropic's own real endpoint if actually invoked right now. The
    live Tutor is therefore showing its own quiet-degrade line at
    present — TU1's own established unconfigured/offline path,
    expected and by design, not a new defect. Resolves itself the
    moment TU2's own code ships; not something to chase before then.
    **House ruling — rotate `TUTOR_API_KEY` (Fable's FX8 review,
    2026-07-21).** The raw value was printed into a model's own
    context during the OTHER/TU2 session's own work (the self-
    disclosed hygiene note above) — not anything that happened in
    this session, and not a breach, but the key now lives in at least
    one transcript. Rotation is free and is the honest response: new
    DeepSeek key, set on Railway in place of this one, revoke the old.
    That session's own unprompted self-disclosure of the mistake is
    exactly the conduct the house runs on, and is ratified as such.
    Not yet actioned — Nick's own call on timing, no urgency implied.
45. **FX8 — card affordances.** **BRIEF COMMITTED — 2026-07-21,
    CC-authored, not Fable.**
    `docs/wrizo-alpha/fx8-card-affordances-brief.md`. Four small
    UI/interaction fixes from Nick's direct feedback (relayed while
    FX7's own review file was still pending, same standing
    authorization): the olive pin restyled as a dimensional sphere-top
    rather than a flat outlined circle; the brass resize handle
    shrunk, its border removed; a `grab`-family cursor added on card-
    body hover (excluding the pin/handle/layer-toggle, each keeping
    their own cursor) — **CC confirmed by reading the code first that
    the drag-anywhere mechanism itself already works** (FX5 S4(a) +
    FX7 S5-S8's own fixes), so this slice is cursor/CSS-only, not a
    new interaction. Zero schema; merge pre-authorized as zero-schema.
    **Deploy explicitly NOT pre-authorized**, same default as FX7.
    **Build starting — 2026-07-21**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-FX7-deploy `main`.
    **NAME COLLISION with Fable's own upcoming brief for item 41's
    finding 11 ("FX8 — the Folded Lists," per her FX7 review's own
    close conditions) — flagged, not resolved.** This item is a
    DIFFERENT ticket (card affordances, Nick's direct request,
    2026-07-21) that happened to claim the same short name first.
    Needs a rename on one side before the Folded Lists brief lands.
    **RESOLVED — 2026-07-21, Fable's own FX8 review: the disk wins.**
    This ticket holds the `FX8` number — it opened as item 45, built,
    and merged first. Fable's own planned "the Folded Lists" becomes
    **FX9**, spec unchanged. New standing rule recorded under TOOLING
    STATUS: a ticket number is claimed by its own ledger item, never
    by a review's forward reference in prose.
    **FX9 — the Folded Lists is now item 50** (brief committed
    2026-07-21) — see there for the actual ticket; this note is the
    rename's own history, kept here so a future reader who only knows
    "FX8" as the Folded Lists can trace how the number moved.
    **BUILT — 2026-07-21.** Built S1-S4 on `fx8-card-affordances` off
    `main` @ `6b5a20e`, in its own worktree.
    **S1 — the pin, domed via a radial gradient + shadow**, same
    ~12px size, same one recorded circular exception, highlight
    upper-left matching the card's own drop-shadow's own light
    direction. Verified with a real screenshot, cropped/zoomed.
    **S2 — the handle shrunk 14px→10px, border dropped whole.**
    **Live cursor investigation, not a guess**: `nwse-resize` left
    unchanged — the handle only ever renders on the selected box, at
    its own bottom-right corner, resizing freeform on both axes from
    there (FX4 S4), so a plain diagonal cursor is textually correct;
    no fix invented for a problem that wasn't real.
    **S3 — the card-body grab cursor, with a genuine structural
    finding**: no exclusion selector was needed at all — reading the
    actual JSX showed `.board-pin-grab`/`.board-handle`/
    `.board-layer-toggle` are DOM SIBLINGS of the card-face element,
    never descendants, so the browser's own hit-testing already
    resolves each one's own cursor correctly with zero CSS
    interaction — confirmed live via `getComputedStyle` on each
    element individually. **A disclosed, optional judgment call
    taken**: a small read-only `isDragging` flag added (set only in
    `beginMove`, cleared in `finish` on every gesture end) driving a
    `cursor:grabbing` swap during an actual active drag — the state
    machine's own `phase` transitions themselves untouched.
    **S4 — `fx8.mjs`, 25 checks.** Both drag-still-works and double-
    click-still-opens re-proven live with genuinely trusted CDP
    events, given this exact file's own recent history of pointer-
    capture bugs. **One real finding on a stated assumption**: the
    board editor is NOT entirely framed-only as the brief's own
    context note assumed — the legacy (<1100px) branch renders the
    identical card-canvas tree, only the surrounding chrome differs
    — so this ticket's pure-CSS changes correctly reach the legacy
    view too (verified, asserted), while legacy CHROME (what "byte-
    identical" actually protects) stays untouched.
    **Full historic suite run by the build itself**, all green except
    one already-known pre-existing `fx5.mjs` flake (confirmed
    unrelated by checking out the pre-ticket baseline and reproducing
    the identical failure there, then confirming clean on a later
    re-run).
    **Independent review never completed — a real process gap, not a
    silent one.** The review agent's own final report was a stalled
    placeholder ("I'll stop polling now and wait for the Monitor's
    notification…") — the same background-monitor-stall class this
    session has now hit three times (FX7's build, this review). Zero
    review-fix commits landed on the branch; only the build's own
    three commits exist. **CC's own merge-time verification therefore
    stood in for the missing second pass**, more thoroughly than a
    routine merge check: `tsc` (desktop+server) + `build:web` clean;
    both merges (FX8 then M2, see item 46) auto-resolved cleanly by
    git's own 3-way merge against `index.css`/`BoardEditor.tsx` (TU2's
    own prior changes sat nearby but never on the same lines,
    confirmed by inspecting both conflict hunks directly before
    trusting the auto-resolve); full 30-file/60-run suite — see this
    session's own next ledger commit for exact figures.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized per the
    standing rule). Merge commit (not fast-forward — `main` had
    advanced past FX8's own base via TU2's merge), pushed to
    `origin/main`.
    **Not deployed** — deploy was never pre-authorized for this
    ticket; also, Fable's own post-merge review is still owed given
    the automated review never actually ran — flagged as a genuine
    open item, not silently treated as satisfied.
    **Fable's post-merge review landed and is committed — GREEN, no
    fold, three advisories (one a real cosmetic defect) — 2026-07-21**
    (`docs/wrizo-alpha/fx8-review-fable.md`). **Depth deliberately
    raised, named explicitly**: since the automated review never ran,
    this review carries the second net ALONE — read at full patch for
    S1-S3, the built `index.css`/`BoardEditor.tsx` fetched at the
    merge SHA and read directly (every claim stands on the file, never
    a commit comment). **Four claims independently re-verified, not
    taken on the build's word**: the cursor cascade (traced source-
    order/specificity by hand, confirmed `.board-pin-missing` still
    wins at rest correctly); the drag-swap's own reach to pins/ported
    cards (the exact point most likely to have a hole — confirmed by
    specificity math, not assumed complete); the sibling-not-descendant
    claim; the state-machine claim (walked every handler by hand, not
    read from the comment).
    **A1 — a real leak path found, cosmetic, narrow**: the pointer
    effect's own cleanup never clears `isDragging`, so a viewport
    resize mid-drag would leave the canvas stuck on `grabbing` until
    the next drag completes — self-healing, data-safe, queued as a
    one-liner for a future fix, Nick's call whether it waits. **A2 —
    a real affordance trade, for Nick's own eye**: FX5's own
    `cursor:pointer` was the only at-rest signal a page-pin/ported
    card is a door; FX8 supersedes it with `grab`, so the door is now
    discoverable only by trying the double-click — stands as built
    since Nick asked for the grab directly, but the trade is real,
    noted for the sitting. **A3 — the legacy-reach disclosure RULED,
    not just accepted**: the byte-identical law binds the frame's own
    CHROME, not board-card behavior, which was already shared across
    both paths before this ticket — recorded so a future ticket
    doesn't re-litigate it.
    **A new pre-check practice RATIFIED**: grepping `scripts/harness/`
    for existing assertions BEFORE changing any CSS value (done three
    times this ticket, correctly found nothing to park each time) is
    now the expected first move on any CSS-value change.
    **Close conditions: (1) review on disk — met; (2) Nick's own
    deploy word — FX8 + M2 together, plus docs riders, one word
    lawfully carries both (manifest: TU2 already shipped at `368fb10`;
    merged-unshipped is FX8 + M2); (3) Nick's own device sitting** —
    the grab/grabbing feel and the pin's new dome read are explicitly
    named as device-sitting business, trusted-CDP harness proof
    notwithstanding.
    **Deployed — 2026-07-21**, Nick's word ("Deploy everything that's
    ready"). Manifest independently re-enumerated before shipping:
    `git log 368fb10..HEAD` — exactly FX8's 3 code commits, M2's 5
    code commits, the two merge commits, and 3 docs-only ledger/
    backlog commits; zero unnamed riders. Re-verified clean at the
    exact deploy HEAD (`7a618c8`) before shipping, not carried over
    from the merge-time check: `tsc --noEmit` clean, `build:web`
    clean. **One disclosed operational hiccup**: `railway up` returned
    after upload without attaching to the log stream (non-TTY
    context), so its actual completion wasn't visible from the first
    call — re-ran it once to get status, which meant two separate
    deployments were triggered (`d225ab87`, `78d1adc9`) instead of
    one. Harmless: Railway itself superseded/removed the first
    (`d225ab87`, still INITIALIZING) the moment the second began
    building, so only one deployment ever reached SUCCESS and only
    one ever served traffic — confirmed via `railway deployment list`
    showing `d225ab87` as REMOVED and `78d1adc9` as the sole SUCCESS.
    `railway up` on `main` @ `7a618c8` (deployment `78d1adc9`,
    SUCCESS), confirmed live via fresh `railway logs`. **Close now
    rests on Nick's own device sitting** (per A2 above and item 46's
    own sitting questions).
46. **M2 — the Rhizome.** **BRIEF COMMITTED — 2026-07-21.**
    `docs/wrizo-alpha/m2-rhizome-brief.md`. An opt-in alternate
    progress visualization — a Progress-style setting (Bar, the
    shipped default | Rhizome), offered only under Progress:Words per
    M1's own precedent, never greyed. **Authority — Nick's commission
    plus eight of Fable's own design rulings**, recorded here: session-
    scoped forward-only growth (never persisted across sessions, its
    own future ticket if ever wanted); seeded determinism (a tiny
    in-repo PRNG, no dependency — same session, same seed, identical
    growth, re-renders never reshuffle); ground never paper (the
    paper's own rect is inviolate — a growing segment that would enter
    it turns away by reflection instead); the rightSlot and the
    background glow's own progress coupling both survive untouched in
    either style (the M1 R1 regression guarded by name); milestones
    are the EXISTING celebration grammar's own events only — nothing
    new invented; offered-never-greyed (the control itself follows the
    same M1 pattern as every other conditional setting); decaying
    growth (per-event caps that shrink the visual load over a long
    session: 200/400/600 segments, 600/24 hard caps, never removing a
    segment — forward-only is the app's own thesis carried into the
    ground itself); and **the growth-form principle recorded as
    PROPOSED CANON, awaiting Nick's own ratification** — every visual
    token-driven (a new `--rhizome-ink` term), zero Plateau literals in
    the engine itself, so a future theme reskins the growth-form
    without touching the mechanism.
    **The milestone burst directly exercises the orange/brass lane
    law** (item 39's own B3 review Ruling 4 territory, now answered in
    the brief's own text): a flash from the rest-state `--rhizome-ink`
    (barely visible, a light brown one step above ground) into the
    theme's own ember/orange token, held ~400ms, eased back over
    ~800ms — ruled EVENTAL, not at-rest, so the lane law holds; B4
    named as the ember treatment's own final authority, literals used
    only where no token yet exists, each commented as B4-provisional.
    **Zero schema, zero new deps** — STOP-and-report if any slice wants
    either; merge pre-authorized as zero-schema per the AB4 precedent;
    Fable reviews post-merge.
    **Gate cleared — 2026-07-21.** TU2 merged (item 43, `c04a1f1`);
    M2's own stated start condition is met. **"No surface overlap"
    with FX8 — CORRECTED at merge time**: both tickets DID touch
    `index.css` (M2's own new `--rhizome-ink` token and stage-anchor
    rules landed near the root CSS variables / goal-glow section;
    FX8's own card-visual rules landed in the board-card section
    entirely elsewhere in the same file) — genuinely non-overlapping
    LINES, not non-overlapping FILES as the earlier note implied;
    git's own 3-way merge auto-resolved both cleanly, confirmed by
    reading each conflict hunk directly rather than trusting the
    auto-resolve blind. **Build starting — 2026-07-21**, via a
    Workflow-orchestrated build+review pipeline (ultracode), off
    post-TU2-merge `main`.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-21.** Built S1-S5 on `m2-rhizome` off `main` @ `f53a413`,
    in its own worktree.
    **S1 — the setting**, stored on the existing writing-settings
    object, offered via a new `Seg` in the shared settings panel.
    **A disclosed scope-narrowing beyond the brief's own literal
    words**: the control (and the whole growth engine) is gated on
    `framed` in addition to `progress==='words'` — because the framed
    desk stage (≥1100px) has NO incentive row / rightSlot at all in
    either style (a pre-existing AB1-era gate, confirmed by tracing
    `ModeStage.tsx`'s own `{!framed && ...}` condition, not invented
    for this ticket) — building a second, cramped legacy mount point
    for a feature the brief's own reference widths (1100/1280/2200)
    never actually exercise below the frame gate would have meant
    either untestable proofs or reviving a law (`FX1 S5`'s "meter
    track stays empty" below the gate) the brief never asked reopened.
    Legacy stays byte-identical regardless of stored style —
    STRICTER than the brief's own literal wording, matching its own
    higher-order invariant.
    **S2 — the engine**: a pure, framework-free ~10-line PRNG plus a
    reflection-based paper/stage-avoidance algorithm with a
    mathematically-guaranteed convexity-based escape fallback (never a
    silent clip). **One real defect caught by the build's own
    empirical testing before it ever reached the harness**: the
    boundary-avoidance check re-flagged a shoot's own already-valid
    origin tip as "touching" the paper (since the origin sits exactly
    on the paper's own edge by definition) — a from-scratch Node run
    producing zero segments is what surfaced it; fixed by starting the
    avoidance sample one step past the tip, re-verified with a
    40-seed/250-event stress sweep, zero violations.
    **S4 — the milestone burst**, reusing the real `--ember` token and
    the real `CELEBRATE_MS` constant (only its own module-private-ness
    removed, value untouched) — confirmed by the review as genuinely
    pre-existing, not newly introduced to look reused.
    **A second real defect, a React StrictMode hazard**: the growth/
    burst effects' own functional `setState` updaters would have
    double-invoked under StrictMode's dev-only double-render,
    silently burning extra PRNG draws — caught and fixed with a
    `stateRef`-mirrored plain-value `setState`, preserving the same
    cross-effect ordering guarantee without the hazard (dev-only
    exposure, never shipped, still fixed at the root rather than left).
    **A pre-existing, unrelated defect found and plainly NOT fixed,
    named for the record**: `store/deskFrameActive.ts`'s own `active`
    flag can go stale after certain in-app navigation sequences
    revisit a framed route without a reload — reproduces on `main`
    with zero Rhizome code involved, confirmed via a bare repro; only
    affected the build's own harness methodology (worked around by
    comparing growth shape rather than absolute coordinates), never
    any invariant this ticket owns. Out of file scope, flagged not
    fixed — a real candidate for a future small ticket.
    **Independent review — GREEN, no fold, zero genuine defects.**
    Went well past the build's own proof depth: 180 runs (60 seeds ×
    300 events × 3 deliberately hostile geometries — paper covering
    90%+ of a small stage, a paper pinned into a stage corner, a
    thin-sliver stage) generating 45,000 segments with zero paper/
    stage violations, specifically targeting the origin-on-boundary
    edge case the build's own fix addressed; independently hand-
    derived the decay/cap schedule from the brief's own prose alone
    (without reading the implementation first) and matched every
    checkpoint from 50 to 1500 events; traced the M1 R1 regression
    guard to where it actually matters (the legacy 900px width, since
    the framed width has no rightSlot to protect either way — a
    clarification of the build's own claim, not a contradiction of
    it). **The review ran the ENTIRE 30-file/60-run historic suite
    itself**, in one continuous pass, achieving zero FAIL/ERROR
    anywhere — including on the two files (`fx5.mjs`, `fx7.mjs`) the
    build's own report had flagged as flaky under contention, both
    clean this time — DESPITE confirmed genuine concurrent resource
    contention from other active sessions' own harness processes
    running in parallel on the same shared machine at the time.
    **Full suite, CC's own third independent pass on the combined
    (FX8+M2) merged `main`**: `tsc` (desktop+server) + `build:web`
    clean; full 30-file/60-run suite — 57/60 green on the first pass,
    3 confirmed transient on isolated re-checks (`tu2.mjs` default+
    parked, unrelated to this merge since neither FX8 nor M2 touch any
    Tutor file, its 4th clean isolated confirmation this session;
    `w2.mjs` parked, a `SecurityError: localStorage access denied`
    matching the same environmental class already seen with `j4.mjs`
    earlier, clean on its own single re-check). All 60 accounted for.
    **Merged — 2026-07-21** (zero-schema, zero-deps, merge pre-
    authorized per the standing rule — confirmed by both build and
    review independently, `apps/server`/`package.json`/lockfiles all
    empty-diff). Merge commit on top of FX8's own merge, pushed to
    `origin/main`.
    **Not deployed** — Fable's post-merge review still owed; redeploy
    is Nick's call, as always, after that review.
    **Fable's post-merge review landed and is committed — GREEN, no
    fold — 2026-07-21** (`docs/wrizo-alpha/m2-review-fable.md`).
    **Standing on the independent review's own already-thorough
    work** (two real defects found/fixed, 45,000 stress-tested
    segments, the full historic suite run clean under real
    contention) — this review does not duplicate that, it verifies
    the shape of the decisions around it. **Five rulings of record:**
    (1) **the S3 scope deviation ACCEPTED, and the BRIEF ruled wrong,
    not the build** — Fable's own S2/S3 assumed an incentive row
    exists in the framed path to anchor the rhizome to and to keep
    intact; it doesn't (FX1 S5's own parked "meter track stays empty"
    law, cited by both `PageEditor.tsx` and `JournalEntry.tsx`'s own
    framed-branch comments) — the build's own substitution (the
    paper's bottom-center), disclosed twice (component header AND at
    the exact substitution line), and its refusal to un-park a parked
    decision just to satisfy a brief written on a false premise, both
    ruled correct in full — Fable's own error, on the record, not the
    build's; (2) framed-only mounting and the offered-never-greyed
    gating both RATIFIED, with a named consequence: the Rhizome is a
    desk feature, not a narrow-viewport one, matching the actual
    laptop/tablet-first target rather than fighting it; (3) the
    boundary-avoidance fix RATIFIED as the empirical standard applied
    to a math bug — same family as the revert-reproduce-restore proof
    ratified at FX7; (4) the StrictMode fix independently re-verified
    IN THE FILE (traced the ref/setState ordering by hand, confirmed
    both effects read/write the same ref, no desync path found); (5)
    token discipline RATIFIED — `--rhizome-ink` genuinely new, `--ember`
    genuinely pre-existing (not a fresh literal dressed up), reduced-
    motion verified in the stylesheet itself.
    **Two sitting questions, Nick's own eye rules, recorded plainly as
    open, not pre-answered**: Q1 — because the framed path carries no
    bar at all, choosing Rhizome doesn't replace a visible line, it
    appears where nothing was; whether the framed desk should carry a
    visible progress row at all is FX1 S5's own parked question
    reopening, its own future ticket, not a rhizome fix (the M1 R1
    rightSlot guard is noted to pass vacuously in framed mode as a
    named consequence, not a gap). Q2 — `--rhizome-ink` computes to
    roughly 1.5:1 contrast against the desk ground, matching the
    literal ask but close enough to the floor that a dim/glossy panel
    may render it effectively invisible until the ember flash; one
    token line to warm if Nick's own eye says so.
    **One advisory**: S5's own "unit-agnostic" proof (per-event and
    bulk growth byte-identical) is a real property but a narrower one
    than the brief's own literal "growth on both unit settings" words
    — honestly disclosed by the build already, low risk given the
    engine taps the same `unitCount` the bar already consumes, noted
    here so it isn't mistaken for coverage it doesn't actually have.
    **Close conditions: (1) review on disk — met; (2) Nick's own
    deploy word — FX8 + M2 together, one word lawfully carries both;
    (3) Nick's own device sitting** — the growth wandering out from
    under the paper, the ember flare on goal, the ground filling
    without ever touching the page, and the two sitting questions
    above answered by eye.
    **Deployed — 2026-07-21**, Nick's word ("Deploy everything that's
    ready"), same deploy as item 45 (one word, one manifest, both
    tickets — see item 45 for the full manifest re-enumeration, the
    fresh `tsc`/`build:web` re-check at deploy HEAD, and the disclosed
    duplicate-deployment-trigger hiccup, harmless, resolved). `railway
    up` on `main` @ `7a618c8` (deployment `78d1adc9`, SUCCESS),
    confirmed live. **Close now rests on Nick's own device sitting** —
    both close conditions above, Q1 and Q2 included.
47. **A pre-existing geometry-measurement defect, lifted off a
    harness comment onto its own ledger item — 2026-07-21, per
    Fable's own M2 review's explicit instruction.** `store/
    deskFrameActive.ts`'s own `active` flag (driving `App.tsx`'s
    `.app-main[data-desk-frame-active]` DeskRail-gutter reservation
    switch, a 64px measure) can go transiently stale across an
    in-app navigation that revisits a framed route WITHOUT a full
    reload — first found and disclosed by M2's own build (item 46),
    now formally "twice-sighted" per Fable's own review of the same
    ticket. **Effect, precisely**: the gutter's own reserved-width
    state can differ from what a fresh mount would compute, shifting
    any ABSOLUTE stage/paper rect measurement taken during that
    window by a constant horizontal offset — WITHOUT any actual
    change to real layout, rendering, or the paper's own true
    position; a live `getBoundingClientRect()` read during the stale
    window would report a coordinate that doesn't match a fresh
    mount's own read of the same visual state. **Confirmed genuinely
    pre-existing and unrelated to M2's own code**: reproduces on
    `main` with zero Rhizome involved, via a bare `App.tsx`/
    `DeskFrame.tsx`-only repro (M2's own build report). **Impact
    disclosed as narrow so far**: only M2's own determinism harness
    check was actually affected (worked around there by comparing
    growth SHAPE, normalized to the first segment's own start point,
    rather than absolute coordinates — `scripts/harness/m2.mjs`'s own
    Section A comment carries the full technical account this item
    summarizes). No other harness file's own absolute-geometry
    assertion is yet known to be affected, but none has been swept
    for this specific class either — a real candidate first step for
    whoever picks this up. ~~**Not yet triaged into a brief; not yet
    built.**~~ **FOLDED IN — 2026-07-21.** Triaged into item 49 (J6 —
    One Paper) as S1, the fix that must land first since J6's own S2
    is navigation across framed routes and cannot honestly prove
    geometry on a substrate that goes stale on exactly the transitions
    it touches. This item stays open as the historical record of the
    find (M2's build, then Fable's review) and **closes on J6's own
    merge**, not before — see item 49 for the actual fix scope.
48. **The deflake pass — queued, 2026-07-21, per Fable's FX8 review's
    house ruling 4b.** Aggregate transient/contention-suspected
    harness failures logged this session crossed the handoff's own
    threshold for scheduling a dedicated pass rather than continuing
    to re-confirm case-by-case. **Known members, as of this writing**:
    `j4.mjs` (occurrence 1, `SecurityError` reading `localStorage`,
    class later repeated by `w2.mjs`); `fx5.mjs`'s own per-line engage
    motion (confirmed pre-existing against a baseline checkout, not a
    regression); `tu2.mjs` (suite-context-only, never isolated —
    4 total clean isolated confirmations across the session); `w2.mjs`
    (parked check, one suite-context failure, one clean isolated
    32/32 re-run); **`th2.mjs`** (a celebration-animation timing race
    on the goal-fill's brass flash — two flaky modes seen this
    session, an Edge sync-popup crash and this flash-timing wait);
    **`m2.mjs`** (added 2026-07-22 — the SAME celebration/milestone-
    flash timing wait as `th2`, "flash engaged on goal crossing"
    `waitFor` timeout; clean 4/5 in isolation, only fails under
    full-suite/concurrent-build contention on `HARNESS_PARKED=1`,
    never a logic assertion — a timing race, not a regression).
    **Common factor across all**: every failure
    surfaced only inside a full historic-suite run under genuine CDP/
    browser resource contention, several coinciding with a concurrent
    session's own build — never in true isolation. **Scope for the
    eventual ticket**: sweep all (plus whatever the item 47
    geometry-defect investigation turns up) under the newly-ratified
    contention-reproduction practice (see TOOLING STATUS), and decide
    per-check whether each is genuinely transient-under-load-only or
    hiding a real defect the contention just makes more likely to
    surface. **Not yet triaged into a brief; not yet built; not yet
    sequenced** — Nick's own call on timing.
    **RIDER — parked-entry history audit (added on Fable's word,
    2026-07-22, from the CD3 incident, item 53).** When the CD3 fix
    pass's own independent review traced one parked `ab3.mjs` entry
    through its FULL history, it found the entry had been silently
    mutated in-place once BEFORE CD3 ever existed (by B1, `9ce8f6b`) —
    a pre-law violation of the now-ratified parked-entries-immutable
    rule, undetected until that deep trace. B1's specific instance is
    closed (ruled a violation, pre-law, no further action). But the
    systematic question stands: **are there OTHER undetected in-place
    mutations of parked entries anywhere across `scripts/harness/`?**
    This rider queues a one-time systematic sweep — for every parked
    (`pok()` / `HARNESS_PARKED`-gated) entry in every harness file,
    trace it to the commit that FIRST parked it and diff its own
    recorded original text against that commit's text; flag any that
    were later rewritten in place rather than layered. Practice note
    the review raised: "sweep all parked entries" must mean
    full-lineage-to-origin, not just since a ticket's own base commit.
    Folds into this pass's own scheduling — Nick's call on timing.
    **BRIEFED + BUILD STARTING — 2026-07-24 (chat 3), as DF1 — the
    Deflake Pass** (`docs/wrizo-alpha/df1-deflake-brief.md`,
    Fable-authored, from this item + the review riders). **HARNESS-ONLY**
    (zero `src/`/schema/server/deps); if a flake's root cause is a real
    product bug, STOP that slice and report — product fixes do not ride a
    deflake ticket. Founded off `main` (M3 `7ebe703` + CD4 already landed;
    disjoint from everything in flight), own worktree, guard-rail before
    every commit, ledger on `main` only; the brief-commit + this ledger
    entry go straight to `main` via the fast-forward records push (the
    S0-push law's own provision — chat 1's lane is for merges, untouched).
    Merge rides the zero-schema pre-auth through chat 1's lane; Fable
    reviews post-merge; harness files ship nothing (no deploy). Slices:
    **S1** `fx5` per-line-engage/scrollTop flake root-caused + the
    isolation-rerun crutch retired (wait-for-condition on the observable,
    never a longer sleep; the assertion must not weaken — else a proper A4
    park); **S2** `th2`+`j4` verified mid-suite ×5 (fix per S1 or record
    CLEARED with evidence — the list shrinks only on evidence); **S3** `e1`
    anchor hardening (parser-side ONLY — the exported bytes never change —
    corpus-aware count/split with the anchors as cross-checks + one hostile
    `# `/marker fixture); **S4** the parked-entry history audit (a reusable
    `scripts/audit-parked-records.mjs` + `docs/wrizo-alpha/parked-records-
    audit-2026-07.md`, corroborating — not rediscovering — B1's `9ce8f6b`
    pre-law bump). **DoD is empirical: THREE consecutive full-suite runs,
    both settings, deterministic, zero isolation reruns** — the crutch
    formally retired for every file cleared, the known-flake list updated
    to the truth, the audit report on disk. After DF1, a red suite means
    something is wrong — nothing else. Drift-check: ZERO structural drift;
    the only delta is the suite count — **39 files now** (`cd4.mjs` landed
    since the brief's "38"), the DoD reads "the full suite" against that.
    **BUILT — 2026-07-24 (chat 3), branch `df1-deflake` (`24c6173`), pushed;
    merge rides the zero-schema pre-auth through chat 1's lane, Fable reviews
    post-merge, harness ships nothing (no deploy). DoD MET and read to completion
    in the main loop (not a notification, per Fable's ruling): THREE consecutive
    full-suite runs, BOTH HARNESS_PARKED settings, all 39 files `exit=0` + PASS
    every pass — 234/234 green, zero isolation reruns.** **S1:** `fx5`'s
    per-line-engage/scrollTop flake root-caused (a `sleep(30)+CDP` sampler whose
    interval stretches under contention and straddles multiple line-heights of an
    in-flight smooth scroll) and fixed with an in-page scroll-event recorder on
    the browser's own frame clock — the ~1/3 flake is gone (6/6 clean in the DoD,
    plus clean under induced contention). **S2 / the known-flake list -> TRUTH:**
    `th2`, `j4`, `m2`, `tu2`, `w2` all CLEARED — none reproduced across x5
    mid-contention runs + the 6-pass DoD; the SecurityError/celebration-flash/
    meter races never surfaced once the environment was clean (a leaked-headless-
    browser resource crash, NOT the harness, had been failing runs — fixed with
    inter-pass cleanup). **S3:** `e1` anchor hardening (split on the exporter's
    own marker BLOCK + structural per-block header count, parser-side only — the
    export bytes are unchanged) + a hostile `# `/marker fixture proving the parse
    is unconfused while the writer's lines ride verbatim. **S4:**
    `scripts/audit-parked-records.mjs` (122 records traced to verbatim git
    lineage) + `docs/wrizo-alpha/parked-records-audit-2026-07.md`; B1's pre-law
    bump (`9ce8f6b`, ab3 note "seven"->"eight") corroborated directly and cited,
    not re-flagged. The M2 park sweep (4 checks A4-parked verbatim + live
    successors in `m3.mjs`) already recorded above. **The isolation-rerun crutch
    is formally RETIRED for every file this pass cleared (fx5/th2/j4/m2/tu2/w2) —
    after DF1 a red suite means something is wrong, nothing else.** (P0 note: FX13
    pre-empted DF1 mid-DoD on Fable's word; DF1 held clean at `24c6173` and
    resumed after — the DoD above is the complete post-resume run.)

    **MERGED — 2026-07-25, merge `c566875`** (`24c6173`), the P0 manifest's named
    de-flake rider. Merged in chat 1's lane SECOND in Nick's ruled P0 sequence,
    before FX14 ("it retires the flake crutch before FX14's verification needs it").
    Harness-only (audit tool + `e1.mjs` + `fx5.mjs` + audit doc; zero src/schema/
    server). Verified at the merge HEAD: `e1.mjs` PASS 41, `fx5.mjs` PASS 64, and
    `scripts/audit-parked-records.mjs` runs clean (125 records; only the 4 hand-ruled
    benign extraction edges — ab3/cd2/ab4/fx1 — no un-remediated mutation). Fable's
    review follows this merge. Ships with the P0 wave; no deploy of its own.

    **Fable's post-merge review: GREEN — 2026-07-25**
    ([wrizo-alpha/df1-review-fable.md](wrizo-alpha/df1-review-fable.md)): "after DF1,
    red means wrong — and the one red that arrived on day one is ruled as the law
    demands, not waved away." Verified whole (4 files, 191 lines of the audit
    checker): S1 fx5 converted to in-page scroll-EVENT recorders (frame-clock, immune
    to poll speed; `moved` guards make a vacuous zero-step pass impossible); S3 e1's
    marker-BLOCK grammar with a hostile fixture proving necessity/unconfusion/
    format-unchanged; S4 the audit's limits stated plainly + the B1 corroboration
    SHARPENED (B1 rewrote the supersession NOTE, not the quoted original — the ruling
    and remediation stand, the record now more precise).
    **THE FIELD TEST — tu2, RULED.** The first post-DF1 full suite (chat 1's FX14
    verification) ran red on tu2 (1/96) and was answered with an isolation re-run —
    the retired crutch. Per DF1's own law, **tu2's CLEARED verdict is RESCINDED on
    first-contact evidence: tu2 returns to the known-flake list as the one named
    exception.** Standing practice recorded: **clearance evidence must scale to a
    flake's observed rarity** — ×5 + one DoD does NOT clear a ~1% flake; the
    known-flake list shrinks only on evidence proportioned to what it clears. The
    crutch stays retired for everything else. **DF1.1 (item 66)** root-causes tu2 +
    carries the two audit advisories; **item 48 closes when DF1.1 lands.**
49. **J6 — One Paper.** **BRIEF COMMITTED — 2026-07-21, Fable-authored**
    (`docs/wrizo-alpha/j6-one-paper-brief.md`). **Authority**: item 41
    finding 1 (Nick's second sitting — the Journal's "New Page" routing
    finding, held for Fable rather than built directly with FX7), and
    Fable's own ruling that it becomes J6. **Scope, in her own words**:
    the literal finding is one `navigate()` call; the real finding is
    that the app has no single source of routing truth, and fixing
    that properly first requires evidence this ticket doesn't yet
    have — so this ticket deliberately does NOT flip the
    `JournalEntry.tsx`/`PageEditor.tsx` routing predicate. Four slices:
    **S1** fixes item 47's own geometry substrate (folded in here,
    cross-referenced above — lands first because S2's whole subject is
    navigation across framed routes); **S2** extracts today's
    duplicated-in-four-places routing predicate into one
    `routeForEntry` call, behavior-identical, STOP-and-report on any
    landing-surface diff; **S3** authors
    `docs/wrizo-alpha/j6-parity-census.md` from the code — every
    capability each of the two surfaces has that the other lacks, with
    a port-now/port-later/retire/needs-its-own-ticket recommendation
    per item — the ticket's real deliverable, and what J7 gets briefed
    from; **S4** harness (`j6.mjs`) plus the full historic suite.
    **Zero schema, zero server files, zero new deps** — merge
    pre-authorized as zero-schema per the AB4 precedent. **Deploy
    explicitly NOT pre-authorized** — Nick's separate word, standing
    default. **Build starting — 2026-07-21**, on `j6-one-paper` off
    post-FX8/M2-deploy `main`, own worktree per ONE CHECKOUT PER AGENT.
    **FX9 (the Folded Lists) may run in parallel** in its own worktree
    per Nick's own word — no surface overlap (cascade menu chrome vs.
    routing/geometry substrate) — FX9's own brief landed and its build
    started the same sitting; see item 50.
    **Built S1-S4 on `j6-one-paper` off `main` @ `b3b1cfb`, in its own
    worktree — 2026-07-21.** **A genuine mid-build incident, disclosed
    in full**: this build's own agent completed all four slices
    cleanly (each its own commit) and had launched its own full
    historic-suite verification when an UNRELATED interrupt in the
    orchestrating session's own conversation cascaded down and killed
    its foreground turn — the agent never wrote a final report, and
    (per the newly-relevant half of the already-ratified
    placeholder-report rule) that silence was treated as exactly what
    it was: no report exists, full stop, not "probably fine." The
    orchestrating session recovered the actual state directly rather
    than re-building blind: confirmed all 4 commits intact with a
    clean working tree; recovered the build's own already-running
    background suite log, which had in fact reached completion after
    the interrupt (the AGENT's foreground wait died; the underlying
    suite process did not) — 30/30 files green under both
    `HARNESS_PARKED` settings, with exactly one crash
    (`th2_parked1`), traced to a stray Edge sync-confirmation popup
    interrupting page navigation mid-test (every real assertion in
    that file had already passed immediately before the crash) —
    re-ran 3/3 clean in true isolation, confirmed transient, unrelated
    to any code in this diff. Independently re-ran `tsc --noEmit` and
    `build:web`, both clean. Pushed the verified branch to origin
    (the build's own "report = push" step never happened; the
    orchestrating session completed it).
    **S1's real root cause, more precise than the brief's own
    framing** (found by the independent review, not assumed from the
    brief): `DeskFrame` and its three top-level subscribers
    (`AppMain`/`GlobalHeader`/`DeskRail`) can race on the app's very
    first commit (a hard reload landing directly on an already-framed
    route) because React fires passive mount effects bottom-up — a
    narrower mechanism than "stale across an in-app navigation," but
    the fix (`useSyncExternalStore`, reading the snapshot synchronously
    on every render) closes the whole class, not just the narrow repro
    shape, and exceeds the brief's own literal ask. Item 47 CLOSES
    here, on this fix landing — see item 47 for the full original
    defect record.
    **Independent post-build review — GREEN WITH ADVISORIES,
    2026-07-21**, run fresh after the recovery above (the ticket's own
    automated review never ran for the same reason its build never
    finished its own report — this review carries that net alone, and
    says so). Re-verified independently, not on the build's word: S1's
    fix mechanism (traced by hand, cross-checked against M2's own
    build-report observation of the same defect from a different
    angle); S2's `routeForEntry` byte-for-byte match against every
    migrated call site, including a bonus site the build found and
    disclosed beyond the brief's own list (`store/resume.ts`'s
    `fromEntry`); zero-schema/zero-server/zero-deps by direct diff
    census; `tsc`, both build paths, and `j6.mjs` all re-run
    independently from a cold `node_modules` install — 36/36 checks,
    matching the commit's own claimed count. **Two real, cosmetic
    defects found in `j6-parity-census.md`** (not in any shipped
    code): §1.1 claims no ink import exists in `BoardEditor.tsx` —
    one does (`renderStroke`, read-only display of an already-ported
    ink box, not authoring; the census's actual conclusion still
    holds, the literal sentence doesn't); §2.1 cites
    `ForwardOnlyEditor.tsx` as 717 lines, actual is 625. Neither
    changes any recommendation in the document. Worth a one-line fix
    before J7 is briefed off this document — Nick's call whether it
    waits.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized).
    `git merge --no-ff origin/j6-one-paper` onto `main` @ `b66ad81` —
    clean, no conflicts. Re-verified at the merge HEAD: `tsc`
    clean, `build` clean; the full historic suite was re-run again
    across the combined J6+FX9 tree (see item 50's own record for the
    shared `CascadePanels.tsx` merge and that suite run's result).
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — `railway up` @ `b936f67`, deployment
    `70181bfe`, SUCCESS; see item 54 for the full manifest. **Close
    now rests on Nick's own device sitting.**
50. **FX9 — the Folded Lists.** **BRIEF COMMITTED — 2026-07-21,
    Fable-authored** (`docs/wrizo-alpha/fx9-folded-lists-brief.md`).
    **Authority**: item 41 finding 11 (Nick's second sitting —
    collapsible list menus), Fable's ruling naming it FX9 (renamed
    from the FX8 collision per the ledger-item-claims-the-number rule
    — see item 45 for the rename's own history). **Scope**: every
    list-bearing section in the cascade's panels
    (`DrawersPanel`'s per-project clusters + its documents list,
    `JournalPanel`'s recent list, `ShelfPanel`, `TrashPanel`) gains a
    header disclosure toggle — the whole header is the hit target, an
    olive (never brass/orange) chevron per the lane law, ~180ms house
    timing with a reduced-motion instant-toggle branch, proper button
    semantics (`aria-expanded`, keyboard-operable, focus-visible).
    **S2** persists open/closed state per-section, client-local only
    (`firstRun.ts`/`tutorDisclosure.ts` shape, zero schema), keyed by
    stable id never title; **first-ever default**: sections with more
    than six items open collapsed, six or fewer open expanded, and any
    explicit writer toggle is sovereign thereafter. **S3 — a design
    law, not a preference**: a folded header may carry its own name
    and chevron and NOTHING else — no counts, no badges, no dots; a
    build that adds one is STOP-and-report (A14's spirit; M1's
    coverage-never-verdicts, extended here). **S4** harness
    (`fx9.mjs`) including a mandatory negative assertion (no collapsed
    header anywhere renders a numeral or badge) and the geometry
    invariant that folding a list must never move the paper. **Zero
    schema, zero server files, zero new deps** — merge pre-authorized
    as zero-schema per the AB4 precedent. **Deploy explicitly NOT
    pre-authorized.** **Build starting — 2026-07-21**, on
    `fx9-folded-lists` off `main`, own worktree per ONE CHECKOUT PER
    AGENT, in parallel with J6 (item 49) per Nick's own word — J6 owns
    routing/geometry, FX9 owns cascade panel chrome; **if both touch
    `CascadePanels.tsx`, first to merge wins the base and the other
    rebases** (Nick's own sequencing rule, recorded here so whichever
    session merges second knows to check first).
    **Built S1/S2/S4 on `fx9-folded-lists` off `main` @ `2c1e18d`, in
    its own worktree — 2026-07-21** (S3 is a design constraint, not a
    separate code slice — verified inside S4's own harness).
    **The same mid-build incident as item 49, disclosed the same
    way**: this build's own agent completed its real work cleanly
    (all commits landed, working tree clean) but its own foreground
    verification turn was killed by the same unrelated session
    interrupt described in item 49, mid-poll on its own background
    suite log. The orchestrating session recovered the state
    directly: confirmed commits + clean tree; recovered the build's
    own already-completed `HARNESS_PARKED=0` pass (30/30 green); ran
    the still-missing `HARNESS_PARKED=1` pass itself (properly
    tracked the second time — the first attempt broke its own
    background tracking by nesting a shell `&` inside the tool's own
    backgrounding, a self-inflicted, disclosed process error, not a
    suite result). That parked=1 pass showed three apparent failures
    (`b2-1`, `fx5`, `j4`) — re-run in true isolation: `b2-1` and `j4`
    came back clean (contention artifacts, other tickets' own harness
    runs sharing the machine at the time); `fx5`'s own "S1(a):
    per-line engage motion" check failed 3/3 times even in true
    process isolation — **confirmed as the exact SAME pre-existing
    flake already tracked at item 48**, not a new regression: FX9's
    own diff (`CascadePanels.tsx`, `index.css`, `store/sectionFold.ts`,
    its own harness) has zero overlap with the typewriter-fade/scroll
    code that check exercises, and the ledger already carries this
    check's own prior "confirmed pre-existing against a baseline
    checkout" record from before this ticket existed. Independently
    re-ran `tsc --noEmit` and `build:web`, both clean. Pushed the
    verified branch to origin (again, the build's own "report = push"
    step never happened; completed by the orchestrating session).
    **Independent post-build review — GREEN, zero defects found —
    2026-07-21**, run fresh after the recovery above for the same
    reason as item 49 (the automated review never ran; this review
    carries that net alone). Genuinely thorough, not a rubber stamp:
    independently re-ran `tsc` (both invocations), `build:web`, and
    `fx9.mjs` itself (41/41, both `HARNESS_PARKED` settings, from a
    cold `node_modules` install); independently re-ran the TWO other
    harness files the build's own park-sweep comment named as the
    only other hits on the fold's touched selectors (`cd2.mjs` 50/50 +
    3 parked, `b2.mjs` 84/84 + 2 parked) rather than trusting that
    claim; wrote and deleted a throwaway CDP screenshot script to
    visually confirm collapse/expand states and the total absence of
    any numeral; confirmed the header hit-target, olive-only chevron,
    real `aria-expanded`, id-keyed persistence, and the mandatory
    no-badge negative assertion all by reading the actual code and
    re-running the actual assertions, not by reading the harness's own
    comments. **One real, honestly-handled divergence from the brief's
    own text, not a build defect**: the brief's own "verified
    structure" section claimed `ShelfPanel`/`TrashPanel` "render their
    own lists" — they don't; both were already retired to single
    door-buttons by earlier tickets (B2 S1/S3, B1 S5). The build
    caught this live, declined to fold what doesn't exist, and the
    harness carries two dedicated checks disclosing exactly this — the
    same "brief's premise was stale, build's own read of the live code
    correctly won" pattern already seen at J6's S1 and M2's S3.
    Two advisories for Nick's own eye, non-blocking: an UNTOUCHED
    section's fold state recomputes live from the current item count
    on every render (a project cluster you've never manually folded
    could visibly snap shut mid-session past its 7th item) — a
    deliberate, correct reading of the brief, but a state change with
    no click from you, worth a glance live; hover feedback is
    intentionally subtle (only the title brightens, the chevron never
    changes) per S1's own law, worth confirming it reads as
    "responsive" rather than "inert" at a real device.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized), onto
    `main` @ item 49's own merge tip. **The anticipated
    `CascadePanels.tsx` overlap with J6 (item 49), handled exactly as
    the sequencing rule above intended**: J6 merged first (its own
    entry), FX9 merged second; git's own 3-way merge auto-resolved
    `CascadePanels.tsx` with no conflict markers — verified directly
    rather than trusted: read the merged file, confirmed J6's
    `routeForEntry(entry)` calls and FX9's `FoldSection`/
    `useSectionFold` machinery both genuinely coexist (the fold wraps
    list items that themselves call the new routing helper on click —
    the two tickets' own concerns compose exactly as the "different
    surfaces" sequencing note predicted, not merely avoid colliding).
    Re-verified at the merge HEAD: `tsc` clean, `build` clean. The
    full historic suite was re-run a third time across the combined
    J6+FX9 tree specifically to catch any interaction defect neither
    ticket's own isolated testing could have — **clean, `ALL DONE`,
    one failure (`th2_parked1`, 2/42), re-run 3/3 clean in true
    isolation.** This is a DIFFERENT known `th2.mjs` flake than the
    Edge-popup crash disclosed earlier in this item (a celebration-
    animation timing race on the goal-fill's brass flash, already
    documented from TU2's own deploy verification) — `th2.mjs` now
    carries two independently-confirmed pre-existing flaky failure
    modes on record, neither touched by J6 or FX9's own diff (routing
    and cascade-fold code, nowhere near a celebration animation). No
    interaction defect found between J6 and FX9.
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — deployment `70181bfe`, SUCCESS; see item
    54 for the manifest. **Close now rests on Nick's own device
    sitting.**
51. **E1 — Get My Words Out.** **P0 — BRIEF COMMITTED — 2026-07-21,
    Fable-authored** (`docs/wrizo-alpha/e1-get-my-words-out-brief.md`).
    **Outranks every ticket in the queue, including J6 and FX9 in
    flight.** Nick departs 2026-08-04 intending to draft his own book
    in this app; verified at his device the same day, Publish's "Copy
    My Words"/"Copy Formatted" read as dead and there is no file
    export of any kind. Nick's own finding, quoted: a writer who
    cannot get his words out of Wrizo cannot safely write in Wrizo.
    **Authority**: Nick's survival check 0.1, failed, 2026-07-21; the
    ratified anti-slop rail's own "the writer's own text must remain
    copyable OUT" clause. **S1** diagnoses the two Publish buttons
    live before touching them — genuinely broken vs. working-but-
    silent is a different fix, root cause reported first, no
    guessing. **S2** makes both buttons work and SAY SO (a house-
    register confirmation via `deskLexicon`, reusing the existing
    toast/quiet-line pattern). **S3 — the ticket's reason for
    existing**: a Download action on Publish, three scopes (this page
    as `.md`+`.txt`; this binder as ordered per-page files or one
    clear-separated document, builder's call, disclosed; **Everything
    — every page the writer owns, the vacation insurance, the most
    important item in this brief**). Non-prose kinds export honestly
    rather than perfectly (Script via `serializeScriptDoc`; Board as
    a plain card-text list; ink as a named placeholder line, never
    silently dropped) — nothing a writer typed may be missing from a
    claimed-complete export. **S4** keeps the coming-soon line but the
    surface no longer reads as a dead end. **S5** harness (`e1.mjs`)
    proves round-trip byte content for page/binder/Everything against
    a seeded corpus, asserts exported-document count equals the
    writer's own page count (no silent omissions), safe filenames on
    Windows and macOS, and — the check this ticket exists for — every
    export path proven **with the network fully unavailable**. Zero
    schema, zero server files, zero new deps (client-side by
    construction, which is also what makes it work on a plane). Merge
    pre-authorized as zero-schema. **Deploy explicitly NOT
    pre-authorized** — though given the P0 urgency and the 2026-08-04
    deadline, expect Nick's own deploy word to follow close behind a
    clean review, not to wait for a routine sitting. **Build starting
    — 2026-07-21**, on `e1-words-out` off `main`, own worktree, IN
    PARALLEL with J6 and FX9 (Nick's own explicit word — the brief's
    stated priority over the in-flight tickets does not mean queued
    behind them, it means it does not wait for them).
    **Built S1-S5 on `e1-words-out` off `main` @ `30961fc`, in its own
    worktree — 2026-07-21.** **A separate, independent occurrence of
    the already-ratified placeholder-report class**: this build's own
    agent completed all five slices cleanly (4 commits, clean working
    tree) but its own final message was a stalled status line ("I'll
    end this turn now... then proceed with verification...") rather
    than an actual completion report — NOT caused by the session
    interrupt that hit J6/FX9 (this build finished on its own timeline,
    unrelated), a genuinely separate instance of the same bug class.
    Treated the same way regardless of cause: no report exists, no
    close condition rests on one. The orchestrating session pushed the
    branch itself (the build's own "report = push" step never ran).
    **Independent post-build review — GREEN WITH ADVISORIES,
    2026-07-21**, dispatched because the automated review's own build
    handoff claimed a push that hadn't happened — the review caught
    this itself (`git ls-remote origin` showed no `e1-words-out`) and
    disclosed it plainly rather than silently working around it.
    Genuinely thorough: fresh `pnpm install`, `tsc` ×2 and `build:web`
    re-run clean; `e1.mjs` re-run fresh, 32/32; the S1 diagnosis
    checked against the actual pre-image code (confirmed accurate —
    a discarded promise with an unreachable fallback on the failure
    path, not just "silent"); the Everything export exercised against
    a real seeded corpus with the counting logic traced to its actual
    source functions, not taken on faith; the offline proof
    independently re-tested beyond the harness's own claim (a
    standalone script confirming real `fetch()` calls genuinely fail
    with the network cut, both external and same-origin); the
    `safeFilenameBase` function copied verbatim into ~25 adversarial
    inputs, all sanitized safely; Windows reserved device names
    (`CON`, `NUL`, etc.) traced all the way to an actual CDP download,
    confirmed Chromium's own download manager auto-renames them,
    non-issue in practice, verified not assumed.
    **One real, moderate defect found, and fixed before merge — a
    judgment call, disclosed as such.** The review reproduced, via
    the identical CDP download mechanism the harness itself relies on
    for every other byte-level claim in this ticket: two different
    pages sharing a first line, downloaded individually via "This
    Page," computed the same filename and the second download
    silently overwrote the first on disk — no error, no warning, one
    page's words gone. Root cause: `dateStampFallback()` has no time
    component, and no id-based disambiguator existed at all, so any
    two same-titled (or two same-day-blank) pages collided
    deterministically. Given this ticket exists specifically so Nick
    can trust his words are safe before his 2026-08-04 departure, and
    the reviewer characterized the fix as cheap, the orchestrating
    session implemented it directly rather than deferring to a
    follow-up ticket: `exportPageFiles` now always appends a short,
    stable suffix from the entry's own id, so re-downloading the SAME
    page stays idempotent while two DIFFERENT pages can never collide
    regardless of title or date. Added a new harness check proving two
    same-titled entries now produce two distinct files with BOTH
    pages' own distinct words intact (caught and fixed one bug in the
    check's own test fixture along the way — two contrived entry ids
    that happened to share their own first 6 characters, defeating the
    very disambiguator under test; not a real-world risk, since
    production ids are opaque random tokens, but disclosed since it's
    exactly the kind of self-inflicted false-negative this house's
    own harness discipline exists to catch). Re-verified clean: 34/34,
    both `HARNESS_PARKED` settings, `tsc` clean.
    **CORRECTION OF RECORD — 2026-07-23, per Fable's E1 post-merge
    review + E1.1's own S5 (item 55). THE CLAIM ABOVE IS FALSE: that
    filename-collision fix never landed on `main`.** The fix WAS made
    — but in the E1 build worktree only, uncommitted; the branch
    (`origin/e1-words-out`) never carried it, and E1's own merge
    pulled the branch, so `main` shipped WITHOUT it. The paragraph
    above wrongly recorded a worktree edit as a merged fix. Verified
    2026-07-23: `exportPageFiles` carried no id-suffix on `main`,
    `e1.mjs` carried no collision check on `main`. **E1.1 (item 55)
    lands the fix for real** — adopting the orphaned worktree change,
    then hardening it (the orphaned `slice(0,6)` drew from the id's
    TIMESTAMP head and would still collide same-tick pages; E1.1 uses
    `slice(-6)`, the random tail) and doing the harness parking
    lawfully (the orphaned version had edited the original assertion
    in place — an immutability violation E1.1 did not repeat). No
    euphemism: the record was wrong, and this is what actually
    happened. See item 55.
    **The self-inflicted test-fixture bug the false paragraph
    describes ("two contrived entry ids that happened to share their
    first 6 characters") was, ironically, the true tell** — those
    shared-prefix ids only collided under `slice(0,6)` (the head), the
    exact bug E1's own fix carried; the "fix" to the fixture (making
    the ids differ) masked the algorithm's own head-slice hole rather
    than exposing it. E1.1's harness deliberately restores shared-head
    ids to prove `slice(-6)` closes it.
    **Two cosmetic advisories from the review, not actioned, low
    priority**: `MultiDocResult.count` is computed but never consumed
    by any caller (the harness verifies count independently via the
    file's own bytes instead — arguably the stronger test regardless);
    "Copy My Words"/"Copy Formatted" button labels remain hardcoded
    strings, pre-existing from AB2, not introduced by this ticket.
    **Full historic suite: clean except the already-tracked item 48
    flake, re-confirmed with zero code-path overlap.** One failure
    (`fx5.mjs`'s own "S1(a): per-line engage motion" check) — E1's own
    diff to `PageEditor.tsx` was read line-by-line and confirmed
    confined entirely to the Publish dialog (the new download/copy
    wiring); it touches no scroll or typewriter-fade code at all, so
    this is the same pre-existing, already-ledgered flake reproducing
    again, not a regression.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized), onto
    `main` @ item 50's own merge tip. Clean, no conflicts (zero file
    overlap with J6/FX9). Re-verified at the merge HEAD: `tsc` clean,
    `build` clean.
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — deployment `70181bfe`, SUCCESS; see item
    54 for the manifest. The P0 "vacation insurance" (the offline
    export path) is now live ahead of Nick's 2026-08-04 departure.
    **Close now rests on Nick's own device sitting.**
52. **FX10 — the Room's Edges.** **P0 alongside E1 — BRIEF COMMITTED —
    2026-07-21, Fable-authored**
    (`docs/wrizo-alpha/fx10-rooms-edges-brief.md`). Nick confirmed the
    Tutor is answering from DeepSeek — and that the panel itself is
    unusable, so unusable a writer "wouldn't even be able to tell."
    TU5 (the Tutor's memory) is pointless until the room it lives in
    is habitable, so this ticket gates the rest of the Tutor arc.
    **Authority**: Nick's device findings, 2026-07-21, quoted per
    slice in the brief. **Fable's own error acknowledged on the
    record** (see item 43's own new correction note above): TU2's
    brief specified the panel's open width as "exactly 2× the tool
    strip's width token" (~168px), the build implemented that
    faithfully, and the number itself was wrong — this brief corrects
    it, not the build. **S1**: the Tutor becomes a genuine horizontal
    drawer opening rightward flush from the paper's edge, the exact
    mirror of the tool pop-out's own motion (constants reused,
    measured not approximated); width becomes a real reading measure,
    `clamp(320px, 34% viewport, 460px)`, further clamped against the
    paper's own clearance law (FX2), overlaying below that per the
    existing CD2 law; no scroll-within-scroll — the panel scrolls as
    one column; the conversation becomes the panel's own center of
    gravity now that the room is wider. **S2**: the left rail's own
    exemption from the vanishing law is a real bug — root-caused
    before fixed, then wired to the same one vanishing engine
    everything else obeys. **S3**: a dissolved-but-open menu must
    restore on pointer APPROACH, not require a click — root-caused
    first; if shared machinery, fixed at the source for every
    dissolved surface. **S4**: the scrollbar moves flush to the
    paper's outer right edge, zero gap, without changing the text
    measure (FX2's clearance law). **S5** harness (`fx10.mjs`):
    open-width-matches-clamp at 1100/1280/2200; grip flush closed and
    open; paper rect invariant across every state; no descendant of
    the panel owns its own scrollbar; motion duration/easing read
    live and asserted equal to the tool pop-out's own values; rail
    dissolves with the rest of chrome; **hover-restore proven with a
    genuine trusted pointer move and no click** — trusted-pointer law,
    synthetic dispatch does not count; scrollbar flush with zero gap,
    text measure byte-identical. TU1/TU2 geometry checks superseded by
    S1 parked per A4, live successors named. Zero schema, zero server
    files, zero new deps. Merge pre-authorized as zero-schema.
    **Deploy explicitly NOT pre-authorized**, same P0-urgency
    expectation as item 51. **Build starting — 2026-07-21**, on
    `fx10-rooms-edges` off `main`, own worktree, IN PARALLEL with E1
    (different surfaces) and with J6/FX9 (Nick's own explicit word).
    **Noted overlap risk, per the brief's own words: if J6 lands
    first, FX10 rebases** — J6 and FX9 already carry the analogous
    `CascadePanels.tsx` first-to-merge-wins rule (item 50); this is
    the same class of risk on a different file, disclosed the same
    way.
    **Built S1-S4 on `fx10-rooms-edges` off `main` @ `82d8917`
    (7 commits), own worktree — 2026-07-21. A genuinely complete
    build report this time, no placeholder.** Two of S1's own facts
    corrected beyond the brief's own literal words, both found by
    measuring the real code rather than assuming: TU2's own earlier
    retrofit had mirrored the WRONG constant (Cascade's dock-panel
    timing, not the tool sliver's own) — the panel now genuinely
    matches the sliver's real transition property-for-property. S2's
    root cause was NOT a broken subscription — `DeskRail` never
    mounts on a framed surface at all; the actual element was
    `.desk-frame-strip`, DELIBERATELY exempted from the vanishing law
    by an earlier ticket (CD2 S1) — now wired into the same one
    engine. S3's root cause: every dissolved surface carries
    `pointer-events:none`, so hover could never fire in the first
    place, and the existing edge-detection zone didn't reach a panel
    sitting well inland — fixed at the source (a window-level
    coordinate sweep, same dwell/jitter state machine, no second
    implementation), confirmed shared across two independent
    surfaces. **Two of the build's own bugs found and fixed during
    its own park sweep, disclosed as such**: a closed sliver panel
    twice miscounted as "reachable" (first via a width-only check,
    then via an opacity-only check that also failed once the room
    itself was dissolving) before landing on the only reliable
    signal, the component's own `data-open` attribute. S4's flush fix
    proven algebraically, not just measured to look right. Park sweep
    found ONE MORE genuine falsification beyond the brief's own
    anticipated `tu2.mjs` checks — `cd2.mjs`'s own "strip never
    dissolves" check, found via the full-suite run itself, correctly
    parked with a live successor; its own sibling check (opacity
    within 150ms of a keystroke) was NOT falsified and correctly left
    live, a real distinction drawn rather than parking defensively.
    Full suite run twice — first pass found and fixed the two real
    regressions above, plus two self-inflicted crashes from the
    build's own concurrent `build:web` clobbering `dist-web` mid-test,
    disclosed as such; second, undisturbed pass: 61/62 clean, the one
    exception being the same `fx5.mjs` pre-existing flake — **applied
    the contention-reproduction practice rigorously**: 7 isolated
    re-runs across both passes, 4/7 failed (~57%, consistent with a
    genuine wall-clock-sensitive timing flake), while every one of
    the build's OWN S3 hover-restore checks passed 7/7, positively
    confirming the flake is unrelated to this ticket's own scope
    rather than just asserting it. `tsc`, both build paths, and
    `build:web` all clean. One open question honestly left open
    rather than silently assumed: S4's fix is confirmed live only for
    prose/`.mode-scroll`; Screenplay's differently-nested scroll
    container couldn't get a live repro this session, flagged for
    Nick's own eye.
    **Independent post-build review — GREEN WITH ADVISORIES,
    2026-07-21.** All nine requested verification items, including
    both invariants flagged high-severity if broken (the trusted-
    pointer proof; the single-vanishing-engine rule), checked out
    against the actual code and live harness re-runs, not the build's
    prose. S1's motion equality verified byte-for-byte in the actual
    CSS (identical property list, custom property, easing — only the
    mirrored `translateX` sign differs). S3's trusted-pointer claim
    traced all the way to `runtime-verify.mjs`'s own CDP call and
    confirmed the harness's S3 section never calls
    `mouseDown`/`mouseUp`/`click` anywhere in the actual restore
    proof. **A genuine bonus check, not requested**: noticed the
    branch's own merge-base predated J6+FX9+E1 landing on `main` and
    the brief's own explicit rebase instruction had not been followed
    — test-merged current `main` into the branch locally (`git merge
    --no-commit`, nothing committed), built it, and ran `fx10.mjs`,
    `fx9.mjs`, and `j6.mjs` against the REAL merged tree: all clean,
    zero conflicts — lower actual risk than the staleness alone
    implied, but correctly flagged that a real rebase or fresh
    full-suite pass against the merged tree should still happen
    before landing. **Three defects found, all cosmetic/low-severity,
    none blocking**: a stale doc comment in `DeskFrame.tsx` (pre-
    existing, untouched by this diff) now contradicts a second,
    correctly-updated comment 150 lines later — the file
    self-contradicts on whether the strip still "never dissolves,"
    worth a one-line fix; the never-rebased branch itself, addressed
    below; a minor perf note (a DOM scan per `pointermove` while
    chrome is dissolved) — correctly gated behind a rare/short-lived
    state, unlikely to be perceptible.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized), onto
    `main` @ item 51's own merge tip — addressing the review's own
    rebase advisory with a real merge rather than a spot-check.
    `git merge --no-ff origin/fx10-rooms-edges` — clean, no
    conflicts, `index.css` auto-resolved (matching the review's own
    test-merge finding exactly). Re-verified at the merge HEAD: `tsc`
    clean, `build` clean.
    **The attempted full-suite re-run across the combined tree was
    contaminated and its own result is void — see item 53 for the
    full account.** In short: while chasing two apparent failures
    (`fx9`, `hb1`) in that run, this session discovered a SEPARATE,
    concurrent session had been editing 11 files directly in this
    same shared primary checkout, uncommitted — a real
    ONE-CHECKOUT-PER-AGENT violation on that other session's part.
    The `build:web` this suite run used had silently picked up that
    session's own in-progress edits (including a since-ruled-correct
    removal of PageEditor's "Done" button), which is what produced
    the apparent failures — neither was a real FX10 defect. FX10
    itself remains fully verified clean on its own terms: its own
    build ran the full 30-file suite twice pre-merge (61/62 clean,
    one already-tracked flake), its own independent review
    additionally test-merged current `main` and re-ran `fx10`/`fx9`/
    `j6` clean, and this session's own `tsc`/`build` checks at the
    actual merge HEAD were clean throughout. **A true full-suite run
    across the final combined tree (J6+FX9+E1+FX10+CD3) is deferred
    to CD3's own merge** (item 53), rather than run twice.
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — deployment `70181bfe`, SUCCESS; see item
    54 for the manifest. **Close now rests on Nick's own device
    sitting** (the Tutor drawer, the rail dissolve, hover-restore, the
    scrollbar flush).
53. **CD3 — the Strip's Order.** **P0-adjacent — a genuine cross-
    session collision, disclosed in full, 2026-07-21/22.** A second,
    concurrent Claude session — working directly with Nick and Fable,
    outside this ledger's own conversation — did real, Nick-approved
    work on the left menu strip and top-bar chrome DIRECTLY in this
    shared primary checkout, uncommitted: a ONE-CHECKOUT-PER-AGENT
    violation on that session's part (its own later brief explicitly
    names the rule it broke: "own worktree — never the primary
    checkout"). Independently, Fable wrote a revised "FX10" brief to
    absorb this same chrome work — **not knowing this session had
    already built, reviewed, and merged the real FX10 (item 52)
    earlier the same sitting.** Two genuine misses compounding, not
    bad faith on any side. **Discovered** when this session's own
    post-merge full-suite verification (see item 52) picked up the
    other session's uncommitted edits and produced two apparent
    failures that traced back to a stray, unrelated working tree, not
    a real defect.
    **Handling, in order**: (1) the 11 files of uncommitted work were
    committed verbatim to a new branch, `cd3-strip-and-chrome`, and
    pushed, protecting them from loss — the code itself (left-strip
    reorder/recolor/resize, Trash-to-foot, "Themes" rename, a
    separator, flush-to-topbar, the Done-button removal from Page and
    Script) was never touched or altered. (2) Fable's own revised
    brief was preserved verbatim under a new filename,
    `docs/wrizo-alpha/cd3-strip-and-chrome-brief.md` (NOT left at
    `fx10-rooms-edges-brief.md`, which is the path the REAL, merged
    FX10 was actually built from — overwriting it there would have
    corrupted that build's own historical record), with a clearly-
    separated editorial note explaining the collision. (3) An
    independent audit (Workflow, isolated worktree) ran Fable's own
    S1 audit methodology from that brief against the actual committed
    diff.
    **Audit findings, 2026-07-21**: the underlying visual/functional
    work verified genuinely sound (DOM queries, computed styles, live
    geometry, forced-hover rendering, a real trusted-pointer click
    proving a legacy-width exit exists via `DeskRail` — a separate,
    pre-existing rail, distinct from the framed-only strip — so the
    Done-button removal's own safety premise holds). **But two real
    defects found, both process, not product**: (a) a SYSTEMIC A4
    violation — of 9 harness assertions the strip's changes falsified
    across 5 files (`ab3.mjs`, `b1.mjs`, `cd1.mjs` ×3, `cd2.mjs` ×3,
    `fx3.mjs`), **zero** were properly parked; every one was edited in
    place to agree with the new code, including one case of directly
    mutating an ALREADY-parked historical entry in `cd2.mjs` — exactly
    the failure mode Fable's own brief named and told the audit to
    catch. (`fx9.mjs`'s own edit — index renumbering only, no
    assertion content changed — was legitimate, not a violation.)
    (b) `hb1.mjs` was left untouched entirely despite asserting the
    Done button's own presence — now genuinely, deterministically
    failing (3/3), a real live gap, not a false alarm.
    **Fix authorized directly by Fable, 2026-07-22**: "fix it
    yourself [not the other session] — sending it back costs days and
    the other session doesn't hold the audit." Scope: recover each of
    the 9 original assertions' exact text from git history (never
    reconstructed from context — `main` @ `8884d49` is the only
    acceptable source), park each properly (SUPERSEDED marker,
    one-line reason, live successor), sweep ALL parked entries across
    all six touched files for additional mutations beyond the one(s)
    already found (the two sessions' own reports disagreed on which
    file held the mutated entry — `cd2.mjs` per this session's audit,
    `ab3.mjs` per the other session's own report — both being checked,
    plus every other parked entry in all six files), fix `hb1.mjs`
    with a live successor scoped to Page and Script ONLY (the Board
    face keeps its own Done button by explicit ruling — it has no
    rail and no Pages/Plan toggle, Done is its only exit there), and
    add two new canon checks the audit didn't cover: nothing brass at
    rest across the WHOLE reordered strip (not a single spot-check),
    and the paper's own rect + text measure genuinely unchanged at
    1100/2200 (a real equality proof against `main`'s own pre-CD3
    geometry, not an inference from the breathing-room number).
    **New standing law proposed by Fable, Nick's own ratification
    still pending, NOT yet in force as of this writing**: parked
    entries are immutable — may be superseded again, re-pointed at a
    new successor, or annotated, but a parked entry's own recorded
    original text is never rewritten. Recorded here as PROPOSED per
    the house's own standing practice of never marking a rule ratified
    without Nick's own explicit word in the same turn — see the
    S0-push rule's own history for the same discipline applied
    before.
    **Fix pass launched, independent review to follow before any
    merge — Fable's own explicit condition: "this doesn't merge on
    the fix pass's own word."**
    **Fix pass + independent review both COMPLETE — 2026-07-22,
    verdict GREEN WITH ADVISORIES, no STOP.** Fix pass (isolated
    worktree, primary checkout never touched): all 9 falsified
    assertions recovered VERBATIM from `main` @ `8884d49` (never
    reconstructed from context) and parked properly — original quoted,
    SUPERSEDED marker + one-line reason, a NEW live successor
    asserting the current truth, each verified live. The two
    already-parked entries that had been mutated in place (ab3.mjs's
    nav-shape `pok()` and cd2.mjs's roster `pok()` — the audit's own
    "most serious" finding, now confirmed as TWO of the nine, both
    `HARNESS_PARKED`-gated) restored to their own prior-generation
    text verbatim, with a fresh third-generation `pok()` added for
    CD3's truth rather than any further in-place edit — honoring the
    proposed immutability law. `hb1.mjs`'s own Done-reachability check
    parked verbatim (original from commit `2200302`, 2026-07-16) with
    a live successor **scoped to Page/Script only** (asserts the
    Publish tab is reachable post-unlock, function-tested by an actual
    click) — the Board's own Done button left entirely untouched
    (verified: `BoardEditor.tsx` keeps all three Done instances,
    `b2.mjs`'s Board-Done checks byte-identical and green). Two new
    canon checks added to `cd2.mjs`: nothing-brass-at-rest swept
    across ALL 8 strip items under a genuine trusted pointer-away, and
    the paper's own rect + text measure proven byte-identical to a
    real rebuild of `main` @ `8884d49` at 1100/2200 (a 10px Y-shift
    found, traced exactly to the `.desk-mode-strip` border/padding
    removal, asserted as a bounded delta so any further drift fails).
    Full suite: 34/34 files, both settings, 68/68 runs green (1539
    unparked / 1625 parked checks, zero failures); `tsc`/`build:web`
    clean. The independent review re-derived every claim itself
    (its own `git show 8884d49` diffs, its own from-scratch paper-
    geometry baseline rebuild, its own full-suite run) — nothing
    taken on the fix pass's word.
    **ONE MATERIAL NEW FINDING from the review, non-blocking but
    Fable's/Nick's to rule on** — directly bears on the immutability
    law now up for ratification: tracing `ab3.mjs`'s nav-shape
    `pok()` through its ENTIRE history (not just since CD3's base),
    the review found it had **already been mutated once before CD3
    ever existed — by ticket B1** (`commit 9ce8f6b`, 2026-07-19): the
    CD2-generation entry's own tested CONDITION was changed in place
    (`stripItemCount === 7` → `=== 8`, "seven categories" → "eight...
    B1's Trash included") without the quote-old-generation/add-new
    layering this same file uses correctly elsewhere. No comment
    anywhere preserves CD2's true original "seven categories" text; a
    stale orphaned comment at ab3.mjs ~655-661 still says "seven" and
    now contradicts the `pok()`'s own "GENERATION 2 (CD2, as B1 left
    it)" label. **This predates CD3, is outside the fix pass's own
    authorized scope** (Fable named `8884d49` as the sole source), so
    it is NOT a CD3 defect — but it means the "parked entries are
    immutable" premise had already silently failed once, undetected,
    and it raises a real question the pending law should answer:
    was B1's change a "plain incidental count bump" (the `fx2.mjs`-
    precedent style B1 itself invoked, arguably exempt) or a genuine
    immutability violation needing retroactive cleanup? **Open for
    Fable's/Nick's ruling — not actioned.**
    **MERGED — 2026-07-22, on Fable's own explicit word** (her
    required "before merge" review gate met by her direct ruling,
    after seeing the fix + review outcome and the B1 finding).
    `git merge --no-ff origin/cd3-strip-and-chrome` onto `main` @
    `4780193` — clean, no conflicts (everything on `main` since CD3's
    own `8884d49` merge-base was docs-only, so zero code overlap
    despite touching shared chrome). Re-verified at the merge HEAD:
    `tsc` clean, `build` clean; the full historic suite across the
    true final combined tree (J6+FX9+E1+FX10+CD3) re-run, both
    settings — **34/34 files, only two failures, both confirmed
    transient contention flakes, neither a CD3 regression**: `j4`
    (`HARNESS_PARKED=1`, "CDP page target never appeared" — a browser
    that couldn't even spin up; clean 3/3 in isolation) and `m2`
    (`HARNESS_PARKED=1`, the milestone-flash `waitFor` timeout — the
    same celebration-animation timing race already on record for
    `th2`; clean 4/5 in isolation, the one re-fail while BM1's build
    was still contending). Both passed clean on the OTHER setting in
    the same run, and CD3's own diff (strip chrome, Done removal, top
    bar) has zero code-path overlap with either `j4`'s box-undo or
    `m2`'s Rhizome/flash code. Note: this suite ran alongside BM1's
    own build starting up — exactly the "sweep alongside another
    session's build" the contention practice warns manufactures this
    class. `m2` folds into item 48's flake set (see below).
    **Fable's rulings of record at merge, 2026-07-22**:
    — **The paper's 10px rise is ACCEPTED as intended** (the
    `.desk-mode-strip` border/padding removal, Nick's own "redundant
    separator" cleanup), **flagged for Nick's own eye** at a sitting —
    the canon check now binds it as an exact bounded delta, so any
    FURTHER drift fails, but this specific 10px is lawful, not a
    regression.
    — **The Board's own Done button is INTERIM and CONDEMNED.** Nick's
    ruling stands whole: Done is deprecated dead EVERYWHERE, the Board
    included. CD3 correctly LEFT the Board's Done in place, because
    it is the Board's only exit today (no rail, no Pages/Plan toggle
    there) — but it survives ONLY until FX10's named return reaches
    the Board (BM1's own PAGE → door is that successor, item 54 S3).
    Recorded as a standing condemnation, not a present action: do NOT
    remove the Board's Done before its replacement lands, and do NOT
    treat its continued presence as permanent.
    **BM1 (item 54) is now UNGATED — CD3 has merged.**
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — deployment `70181bfe`, SUCCESS; see item
    54 for the manifest. **Close now rests on Nick's own device
    sitting** (the strip's new colors/order/size, the flush top bar,
    the Done-button removal from Page/Script — plus A1's own
    still-open immutability-law question).
54. **BM1 — the Board's Own Modes.** **BRIEF COMMITTED — 2026-07-21,
    Fable-authored** (`docs/wrizo-alpha/bm1-board-modes-brief.md`).
    From the Board Modes second pass as ruled by Nick, 2026-07-21.
    **THIS IS A SCHEMA TICKET — merge requires Nick's own explicit
    word, no standing pre-authorization** (S2 adds a 1:1 page⇄board
    pairing relation, `planBoardId`). Everything else client-side,
    zero new deps. **Nick's rulings, T1-T5, recorded verbatim from
    the brief's own authority line**: **T1** — three modes
    OPEN/STORYBOARD/OUTLINE plus the PAGE → door; the fourth
    ("Commonplace") mode SCRAPPED, card-linking absorbed into Open.
    **T2** — the arrow is the door's dress (resolved by T1). **T3** —
    build-it-all tempo (all three modes this ticket, not staged);
    side-by-side held as BM2 by Fable's own sequencing call,
    vetoable. **T4** — StoryPlan fold-in authorized (S1 reconciles
    whether StoryPlan's own shape can serve as the Storyboard
    projection's data, or whether that fold becomes its own later
    ticket — reported before S4+ builds, never silently a second plan
    system). **T5** — schema pre-cleared for flagging, **explicit go
    still required at merge.** Also recorded per the brief's own S0:
    Commonplace's scrapping (linking absorbed into Open); the
    menus/toolbars rethink DEFERRED by Nick's own word as
    non-loadbearing; **BM2 (side-by-side) queued for its own brief
    after BM1's review.**
    **The projection seam is the ticket's non-negotiable core**: decks
    are DATA (one structure description per deck), modes are
    PROJECTIONS (renderers of that description) — a deck never knows
    which projection draws it; any slice that pressures a per-mode
    deck fork is STOP-and-report. Two hard floors: OUTLINE must render
    AND edit genuine nesting or it does not ship this ticket (becomes
    BM1.1, never ships flat — "the Grammarian's floor"); the paper's
    own rect and text measure on the page side stay inviolate (PLAN →
    is bar chrome only).
    **GATE CLEARED — CD3 (item 53) merged 2026-07-22.** The brief's
    gate (`bm1-board-modes` branches from `main` ONLY after FX10's fix
    pass / CD3 merged — both rewrite the board's top bar, and BM1
    inherits FX10's named return as the PAGE → door's own ancestor)
    is now satisfied; BM1 branches from post-CD3 `main`. **E1 (item
    51) outranks BM1 if capacity contends** — but E1 is already
    merged, so no live contention. Built on `bm1-board-modes` off
    post-CD3 `main`, own worktree.
    **BUILT — 2026-07-22, all 9 slices, pushed to `origin/
    bm1-board-modes` @ `06d0291` (5 commits), NOT merged (schema).**
    **S1 reconciliation reported choice (b), with reasoning**:
    StoryPlan CANNOT fold in as Storyboard's data in v1 without
    breaking M1 or building a second plan system — a board pairs to a
    PAGE but StoryPlan is per-PROJECT (scope mismatch), `beatNotes`
    are note-strings+status vs. positioned boxes (model mismatch), and
    frameworks have no add/reorder/delete-beat API (M1 would break on
    a draggable beat-lane). So Storyboard v1 projects the board's own
    deck/box structure; the StoryPlan fold becomes its own later
    ticket; the cascade Plan panel stays a door to the paired face.
    BM1 claims to touch ZERO StoryPlan code, so M1's consumers are
    unaffected by construction. **S2 schema** kept the briefed nullable
    `planBoardId` (not a pairs table): one `plan_board_id text` column,
    absent on grandfathered rows, migration + both sync mappers
    (placeholder count 22→23), the board's own record untouched
    (back-reference derived by scan). Lazy birth on first flip;
    unpair/orphan by derivation. **S4 projection seam**: a pure
    `boardStructure.ts` selector, additive optional Box fields
    (`seq`/`laneId`/`parentId`), OPEN never reads them (claims
    seven-deck library byte-identical, `materializeDeck` + all 7 deck
    defs untouched). **S7 OUTLINE claims the nesting floor MET**
    (renders AND edits genuine `parentId` nesting, ships not BM1.1).
    Build claims `bm1.mjs` 36 checks + full historic suite all green
    both settings, one A4 park (cd1.mjs's prose-bar check, PLAN → adds
    a third button) handled per the immutability law. Two overlaps
    the build flagged for review: the Board's own Done left in place
    alongside PAGE →; the page's project-level Page/Plan toggle
    coexisting with the new per-page PLAN → door.
    **BOTH AUTOMATED REVIEWS STALLED — the placeholder-report class,
    TWICE, named plainly per the ratified rule.** The first review
    agent did ~22 min of real STATIC analysis then got stuck in a
    background-monitor polling loop ("wait for the monitor's
    completion event"), never running its own dynamic verification or
    writing a verdict. A second review was re-dispatched with the
    monitor pattern EXPLICITLY forbidden — and it stalled the SAME
    way (it did complete its own independent 10-check schema/
    grandfather verifier — all derived memberships identical — and got
    27/35 suite files green, but again ended on "I'll wait for the
    completion notification" with an explicit "(Interim checkpoint —
    not the verdict.)"). **Diagnosis: these workflow sub-agents cannot
    reliably self-drive a long suite to a verdict — they background it
    and their own turn ends, which the harness captures as a
    placeholder result.** Per the ratified rule, neither stalled pass
    counts as a review.
    **COMPENSATING INDEPENDENT VERIFICATION performed by the
    orchestrating session directly (the main loop does not stall),
    2026-07-22 — VERDICT: GREEN WITH ADVISORIES.** All 9 review items
    verified against the actual committed code in an isolated worktree
    (`git status` clean throughout), nothing on the build's word:
    (1) **Schema** — placeholder count hand-counted 23/23/23, aligned
    at position 23, `null↔undefined` recipe, additive `if not exists`
    migration, board row untouched; grandfather byte-identity
    confirmed by `bm1.mjs` AND the redo-review's own 10-check
    verifier. (2) **Projection seam** — `boardStructure.ts` genuinely
    mode-agnostic (the "mode" mentions are all comments), OPEN doesn't
    read it (byte-identity proven), decks untouched by the diff,
    order single-sourced by construction — NO per-mode fork.
    (3) **OUTLINE nesting floor MET** — genuine recursive tree render
    PLUS real indent/outdent (`withParent`: indent → child of
    preceding sibling, outdent → sibling of parent) PLUS text-edit
    round-trip; not a flat list, ships not BM1.1. (4) **Ordering
    single-sourced** — shared tree/comparator + `bm1.mjs` proves
    reorder-in-OUTLINE reflects in STORYBOARD. (5) **Doors/flip** —
    `trustedClick` uses genuine CDP `mouseMove/Down/Up`; both doors
    travel (paired + unpaired fallback); lazy birth proven; door-
    never-selected asserted; flip preserves mode. (6) **No knocks,
    nothing orange** — no badge/dot/count on the doors; every BM1
    board CSS rule is `--text-*`/olive `--accent-rest` at rest, zero
    brass/ember. (7) **A4/immutability — see the ADVISORY below.**
    (8) **Zero new deps** confirmed by diff census. (9) **Full
    historic suite 70/70 green both settings** (all 34 files +
    `bm1.mjs`, zero failures — cleaner than any sweep this session,
    `fx5` included); `tsc` ×2 and `build:web` clean.
    **ADVISORY A1 — an immutability-law GRAY AREA, Fable's/Nick's to
    rule, arising ironically on the very next ticket after
    ratification.** BM1's `cd1.mjs` A4 park kept the parked entry's
    recorded-original NAME byte-identical AND added a proper new park
    cycle for the actual supersession — but it also UPDATED that
    parked entry's live-reverification CONDITION in place
    (`['Pages','Plan']` → `['Pages','Plan','Plan →']`), following the
    exact "parked live-probe" pattern **CD3 itself established** (CD3
    set that same probe's condition to live reality `['Pages','Plan']`
    while its NAME quotes the frozen original — verified in `main`).
    Under the strictest reading of the just-ratified law (Fable's B1
    ruling: a change to a parked entry's own tested CONDITION is a
    violation "regardless of how small"), this is a gray area needing
    an explicit ruling: **does the immutable record cover only a
    parked entry's frozen NAME/quote, or also its live-reverification
    CONDITION?** Leans lawful here (name frozen, condition is a
    designed live-probe CD3 itself blessed at the same merge the law
    was ratified), but the law as written carved out no such category.
    **ADVISORY A2 (Nick's eye)** — the Board's own Done now coexists
    with PAGE →, its own intended named-return successor. Leaving Done
    was correct (the brief's S3 didn't remove it) — but the CD3
    condemnation's precondition (the named return reaching the board)
    is now MET, so Done is ready to retire; Nick may want to schedule
    that (a one-liner, its own tiny follow-up or a BM1 addendum).
    **ADVISORY A3 (Nick's eye)** — two "Plan" controls now sit on the
    page bar: the pre-existing project-level Pages/Plan toggle (to the
    project's StoryPlan board) and the new per-page PLAN → door (to
    THIS page's paired plan board) — different destinations, same
    word. A real clarity question for a sitting, not a defect.
    **ADVISORY A4 (device sitting)** — the flip's feel, the telos
    line's read, the linking curves.
    **MERGE-TIME NOTE**: BM1's branch predates the CD3-era ledger
    commits, so `git diff main..bm1` shows an apparent `docs/
    open-threads.md` regression — pure branch-age skew, NOT BM1
    touching the ledger; the merge must take `main`'s newer ledger
    (reconcile the docs conflict in main's favor).
    **MERGED — 2026-07-22, on Nick's own explicit word ("Merge and
    push live / Deploy everything")** — the schema-merge authorization
    T5 required. `git merge --no-ff origin/bm1-board-modes` onto
    `main` @ `49e27ba` — auto-resolved cleanly (BM1's branch never
    touched the ledger files, so `main`'s newer ledger was kept with
    no conflict — the merge-time note above proved moot in practice).
    Re-verified at the merge HEAD: `tsc` (desktop AND server) clean,
    `build` clean. Merge commit `b936f67`, pushed.
    **DEPLOYED — 2026-07-22, same word ("Deploy everything").** This
    shipped the whole merged-but-unshipped backlog at once — J6
    (49) + FX9 (50) + E1 (51) + FX10 (52) + CD3 (53) + BM1 (54) —
    the first deploy since FX8+M2 (`7a618c8`). Manifest independently
    enumerated (`git log 7a618c8..HEAD`): exactly those six tickets'
    own code plus docs riders, every code file attributable, zero
    unnamed riders. **BM1's additive schema migration ran on the
    production boot** (`add column if not exists plan_board_id text` —
    grandfathered, null→undefined) — the server came up clean and the
    healthcheck passed, so the migration applied without incident.
    `railway up` on `main` @ `b936f67` (deployment `70181bfe`,
    SUCCESS, healthcheck `/healthz` passed), confirmed live
    (`Writer Studio server listening on :8080`).
    **ADVISORY A1 — RESOLVED 2026-07-22 (Fable's ruling, committed at
    `docs/wrizo-alpha/a1-immutability-ruling-2026-07-22.md`): LEGAL,
    no remediation.** The BM1 (and the CD3) parked-probe condition
    updates are lawful — the record is the quoted non-executing text
    (byte-identical); the probe is the live re-verification instrument
    (it never matched the frozen text, tracking current reality by
    construction). Ratified codicil: a parked probe may update in
    place only in a commit that ALSO records the supersession event
    (new park cycle + live successor), disclosed by name in the
    message — see TOOLING STATUS. A2/A3/A4 remain Nick's device-sitting
    eye.
    **Close now rests on Nick's own device sitting** — the three
    modes, both doors, the flip, the telos line, the linking curves,
    and the two overlap questions (A2/A3) answered by eye.
55. **E1.1 — Words Out, Made Whole.** **BRIEF COMMITTED — 2026-07-23,
    Fable-authored** (`docs/wrizo-alpha/e1-1-words-out-fix-brief.md`).
    **P0-adjacent — lands before the Aug 1 freeze.** A fix ticket off
    E1 (item 51), from Fable's own E1 post-merge review + Nick's
    2026-07-23 ratifications. **THREE things to make whole**: (S1) the
    filename-collision fix — **and a hard, self-disclosed correction
    of record**: E1's own merge record (item 51) claimed the
    collision fix was "fixed by the orchestrating session post-review"
    — **it is NOT on `main`.** Verified 2026-07-23: `exportPageFiles`
    carries no id-suffix on `main`, `e1.mjs` carries no collision
    check on `main`. The fix was real but ORPHANED — this session made
    it in the E1 build worktree (`wf_ae92f9fa-728-1`, still present)
    and merged `origin/e1-words-out`, which never carried it; the
    merge record wrongly claimed it landed. **The orphaned fix is
    still uncommitted in that worktree** (`pageExport.ts`'s `${title}
    (${entry.id.slice(0,6)})` + `e1.mjs`'s collision checks) — E1.1's
    S0 finds and ADOPTS it rather than re-deriving, disclosed, with
    the harness change redone per A4 + the ratified immutability law
    (park the original round-trip assertion, add the suffixed
    successor — never edit in place, unlike the orphaned worktree's
    own in-place edit). (S3) **the Trash rides along** (Nick's word,
    2026-07-23): "Everything" gains an honest `## From the Trash`
    section — every soft-deleted page's block via the same `pageBlock`
    machinery, marked and separated after the live pages, read-only
    (never resurrect/mutate a deleted row), system Boards still
    excluded; the doc-count assertion names live + trashed as two
    numbers. (S4) **the whitelist inverted**: `boardBody()` currently
    silently drops any non-text/ink/page-pin box kind — E1.1 makes an
    unrecognized kind export a named placeholder (`[A card of an
    unrecognized kind — not exported as text.]`), never silence
    (`connection` explicitly skipped by name — a link, no writer
    text). (S5) **the record corrected**: E1.1's own records commit on
    item 51 states plainly the claimed fix didn't land, per the
    stalled-report law — no euphemism. **ZERO SCHEMA, zero server,
    zero new deps** — merge pre-authorized as zero-schema; deploy is
    Nick's separate word. **Build starting — 2026-07-23**, on
    `e1-1-words-out-fix` off `main`, own worktree.
    **BUILT + INDEPENDENTLY REVIEWED — GREEN WITH ADVISORIES —
    2026-07-23.** S0 found the orphaned fix still uncommitted in the E1
    worktree and ADOPTED it (disclosed). Immutability discipline done
    right this time (verified by the review, diffing against `git show
    main`): the three assertions E1.1's changes falsified (the
    round-trip filename, the doc-count, the trash-exclusion) were each
    parked VERBATIM with SUPERSEDED markers + named authority + live
    successors — NOT edited in place (the exact thing the orphaned
    e1.mjs had done wrong). Read-only Trash seam (`getDeletedEntries`,
    clones only, never mutates `deletedAt`); `## From the Trash`
    header is body text, not lexicon-routed; whitelist inversion with
    `connection`/`board-meta` skipped by name.
    **Both review advisories RULED BY FABLE, 2026-07-23:**
    — **A1 (the real one) — endorsed, and FIXED before merge.** The
    adopted orphaned suffix used `entry.id.slice(0,6)` — but
    `generateId()` is `Date.now().toString(36)` (an 8-char timestamp)
    + random, so the head-slice is 100% clock: two pages born the same
    tick (bulk import, template, rapid duplicate) share it and would
    STILL collide — a hole in S1's own "must produce two distinct
    filenames." Hardened to `slice(-6)` (the random tail, 36^6 ≈ 2.2B,
    collision-safe same-tick); the harness fixture rebuilt to prove it
    (two ids sharing head `dupehe`, differing only in tail
    `alpha6`/`beta66` — the same-tick shape the old fixture never
    exercised). Fable's own words: a genuine catch; the immutability
    handling lawful on both counts (frozen parked originals
    byte-identical; the never-shipped `e1-rou`→`ndtrip` successor
    references on an unmerged branch are "construction, not records —
    edit them freely," per the A1 codicil).
    — **A2 (lane/section titles) — ruled a RIDER to FX11, not an E1.1
    reopen.** BM1's `board-meta` now carries writer-authored lane/
    section titles; E1.1 skips `board-meta` by name, so those words
    stay out of a "complete" export. Fable: lane and section titles
    ARE writer words and the never-missing law reaches them — but a
    gated build does not grow scope mid-suite, and this is no
    regression (the old whitelist dropped `board-meta` too). **FX11
    carries it**: board blocks render writer-authored lane titles when
    present (minimal form — one `Lanes:` line per board; per-lane
    grouping only if trivially cheap), harness seeds a titled lane and
    asserts presence. Logged here as FX11's own rider.
    **Suite read to completion, synchronously, per the ratified law**
    (a merge may follow only a suite verdict the main loop read in
    full): 70/70 runs both settings, all green except the known
    E1.1-unrelated `fx5` per-line-engage flake (item 48), confirmed
    intermittent (2/3 clean isolated); `e1.mjs` green both settings;
    `tsc` (desktop + server) + `build` clean.
    **MERGED — 2026-07-23, on Nick's word ("permission to merge and
    deploy whenever you're finished")**, zero-schema. TRUE 3-way onto
    `main` @ `31f652f` (E1.1's base `5c5f720` predated the A1 ruling
    doc + the 9 review-brief commits; verified at the merge HEAD that
    `a1-immutability-ruling-2026-07-22.md` and all nine briefs SURVIVED
    — zero docs deleted by the merge, per Fable's mechanics
    condition). `tsc` (desktop + server) + `build` clean at the merge
    HEAD. Merge commit **`0c472c2`**. **Item 51's record corrected**
    above (the false collision-fix claim, made true here). Fable's
    post-merge review follows same-day.
    **DEPLOYED — 2026-07-23, Nick's word** (same message as the merge).
    Manifest re-enumerated since the last deploy (`b936f67`): the only
    code is E1.1's own three files (`pageExport.ts`, `persistence.ts`,
    `e1.mjs`) plus docs riders — zero schema, no server/migration
    change, no unnamed riders. `railway up` on `main` @ `0afebcf`
    (deployment `35207e0a`, SUCCESS), confirmed live (`Writer Studio
    server listening on :8080`). **The collision fix E1's own record
    once falsely claimed is now genuinely live** — same-titled and
    same-tick pages export as distinct files, both sets of words
    intact; trashed words ride along in "Everything"; no box kind
    silently vanishes.
    **Fable's post-merge review landed and is committed — GREEN —
    2026-07-23** (`docs/wrizo-alpha/e1-1-review-fable.md`). Read at
    house depth (full-patch line-by-line on all three files; the
    park-quoted originals compared against the deleted live text IN
    THE SAME DIFF — verbatim identity confirmed by direct comparison,
    not the commit's claim). "The record is true, the words are whole,
    and the immutability law was honored under conditions that would
    have excused sloppiness." Named a new standing PRACTICE: the live
    section and the parked probes share module-scope fixtures, so
    successors re-prove the same reality with the same numbers, never
    a drifted copy. **Three non-blocking advisories, dispositions:**
    (A1) the 80-char cap now governs the TITLE component; the full
    base can reach ~89 with the ≤9-char suffix — endorsed, disclosed
    in-code, no action. (A2) `board-meta`'s "zero writer text" comment
    is already stale (BM1's lanes carry writer-authored titles) — the
    FX11 rider corrects that comment in the same pass it renders the
    titles. (A3) the harness's `^# `/`## From the Trash` anchors are
    writer-text-fragile (a page whose own first line is `## From the
    Trash` would confuse the split) — pathological, harness-only, no
    product defect; folded into item 48's deflake-pass rider territory.
    **Items 51 and 55 close together on Nick's own device sitting** —
    agenda now includes the Trash spot-check (a known trashed page's
    words present under the marker, wifi off).
56. **TU5 — the Tutor's Memory (the Book's Bible).** **BRIEF COMMITTED
    — 2026-07-23, Fable-authored** (`docs/wrizo-alpha/
    tu5-tutors-memory-brief.md`). **SCHEMA TICKET — NO merge
    pre-authorization.** Nick's explicit word at merge, which in the
    same breath ratifies (a) the S6 disclosure-v3 string verbatim and
    (b) the two S5 prompt paragraphs; deploy is his separate word.
    **Authority**: the Listener-day queue (TU5 confirmed over TU4 as
    THE pre-vacation Tutor ticket); TU2 review ruling 3 ("the Tutor
    has ears as of TU2; memory of the book is TU5's charter").
    **Sequencing gates — ALL MET as of this writing, so the build is
    authorized to start**: (1) E1.1 merged (item 55 — the A1 ruling
    file on disk, the standing gate); (2) E1.1's post-merge review
    landed (item 55, GREEN, committed). Fable's own E1.1 review names
    it: "With this review on disk, TU5's build gate is fully met."
    **Scope — L4 of the Tutor's five-layer memory, alone**: L1 the
    constitution (TU1), L2 the ears/page-delta (TU2), L3 the page
    thread (TU1/TU2) — all shipped; **L4 the book's Bible — durable,
    writer-owned facts of the project — THIS ticket**; L5 the writer's
    profile deferred. The bible is the BOOK's memory: it rides the
    project, so loose/journal pages keep ears + thread only and show
    NO Bible section (quiet absence, not a disabled door). **Three
    decisive calls (Fable's, vetoable at the schema word)**: (1)
    per-project, ONE additive nullable `projects.tutor` jsonb column —
    never a new table (the BM1 charter's own reasoning); (2)
    **writer-authored ONLY — the Tutor cannot write to the bible, not
    even by proposal** (structured model output becoming app state is
    a cousin of the A13-forbidden affordance; the prompt may suggest
    in plain words that the writer note something, the hands stay the
    writer's); (3) no Voice Wall on the bible input (a reasoned
    exclusion — the wall guards writing surfaces, the bible is desk
    furniture, and A13 already seals the only dangerous direction).
    **S1 schema**: `alter table projects add column if not exists
    tutor jsonb` (additive, idempotent, no backfill, the exact
    `origin`/`journal_entries.tutor` recipe); both project mappers;
    `upsertProjects` 14→15 columns, `$15::jsonb`, placeholder count
    **15/15/15 — Fable hand-verifies at review, per the house rule**;
    grandfather fixed point (a project never touched by the bible is
    byte-identical, absent never null). Shape `{ v:1, facts: Fact[] }`,
    per-fact text cap 300. **S6 ships disclosure v3** (the mechanism
    exists per TU2 review ruling 4). **Server surface touched is
    exactly `tutor.ts` + `migrate.ts`/`sync.ts` (S1); zero new deps;
    key presence-never-value at deploy.** **The Aug 1 freeze is named
    honestly**: TU5 merges before it or waits for post-vacation — E1.1
    merged 2026-07-23 (well ahead of the ~July 29 slip line), so the
    gate is clear.
    **BUILT + PUSHED — 2026-07-23, on `tu5-bible`** (re-founded — see the
    anomaly below), all eight slices S0-S7, on `origin/tu5-bible`. S0 the
    tutor-rules.md living-document disk home (shipped `SYSTEM_PROMPT` verbatim
    + tentative-ratification header); S1 `projects.tutor` jsonb (both mappers,
    upsert 14->15, `$15::jsonb`, 15/15/15 hand-verified, grandfather
    byte-identity — a project never touched by the bible is absent-not-null);
    S2 `store/tutorBible.ts` (read/add/edit/delete, the advanceTutorCursor
    conjure-refusal, wrizoBible seam); S3 the Bible section (LAST in the FX10
    cluster per Fable's ruling, `projectId`-gated so loose/journal pages show
    nothing, no counts, A13-clean); S4 the wire (`bible?` field, `<book-bible>`
    spliced BEFORE the delta, the persisted thread byte-free of any bible turn,
    roles still writer|tutor); S5 the prompt (the Bible-conduct paragraph + the
    fifth-bullet truth-repair, mirrored BYTE-IDENTICAL into `tutor-rules.md` in
    the same commit); S6 disclosure v3 (Candidate A minimal-insertion). `tsc`
    x2 + `build:web` clean; S7 `tu5.mjs` PASS 91 both HARNESS_PARKED settings;
    the disclosure-v3 park sweep landed empirically (skipDisclosure seed
    '2'->'3' in tu1/tu2/fx10/m2 fixtures; tu1's "(v2 key)" ack check + tu2's
    three disclosure-v2 checks parked A4-style, verbatim, with live successors
    in tu5.mjs; full historic suite re-run GREEN — 36 harnesses, 0 failures).
    **NOT merged — schema ticket: awaiting Fable's review + Nick's explicit
    schema word, which in the same breath ratifies the S6 v3 disclosure string
    and the two S5 prompt paragraphs. Deploy is Nick's separate word. The
    server's own `<book-bible>` wrapping (tutor.ts) owes a prod round-trip
    after deploy, the TU2 precedent.**
    **ANOMALY — two claimants, branch re-founded.** The brief named
    `tu5-tutors-memory`; a second CC session (chat 1) started a parallel build
    on that name off Fable's mis-traveled phrasing, then removed its worktree
    mid-flight. A `cd` into the orphaned (now `.git`-less) directory walked git
    UP to the main repo and put a stray 4-doc commit on LOCAL `main` (the four
    pre-existing untracked docs; unpushed; `reset --mixed` to origin/main,
    nothing lost, nothing ever pushed). Fable ruled a distinct name to end the
    contention structurally: **re-founded as `tu5-bible`** off fresh `main` @
    309ab78, every slice re-authored from session history (the orphaned dir's
    work files were confirmed deleted — raw `find` — nothing recovered from
    disk; the reconstruction validated by `tsc` x2 + the 15/15/15 recount +
    tu5.mjs). **New standing law, ratified by Fable: before ANY commit,
    `git rev-parse --show-toplevel` must confirm the expected worktree root** —
    the exact check whose absence caused the stray commit. `tu5-tutors-memory`
    is the contested name that died unreferenced; `tu5-bible` is the clean,
    single-author line. **Report = push; Fable reviews before a merge
    recommendation; schema merge on Nick's own explicit word only.**
    **MERGED — 2026-07-24, on Nick's own explicit schema word, quoted
    verbatim: "Ratified".** Its scope, named by Nick: (1) the merge itself;
    (2) the S6 disclosure-v3 string as shipped (Candidate A); (3) the two S5
    prompt texts as shipped (the Bible-conduct paragraph + the repaired fifth
    bullet) — all three verbatim in place on the branch, quoted in Fable's
    review (`tu5-review-fable.md`, its "What Nick's word ratifies" section).
    Fable's pre-merge schema review landed GREEN and rode `main` into the
    merge (committed `9eb8d8f`). **Executed in the primary checkout by the
    orchestrating (chat 1) session per Fable's close directive** — guard-rail
    (`git rev-parse --show-toplevel`) confirmed before every commit. TRUE
    3-way `git merge --no-ff origin/tu5-bible` (`ba364b8`) onto `main` @
    `9eb8d8f` (merge-base `309ab78`) — auto-resolved clean, zero conflicts.
    At the merge HEAD: `tu5-review-fable.md`, `tutor-rules.md`, the A1 ruling
    doc, and every prior review/brief verified SURVIVING (zero docs deleted);
    `tsc` (desktop + server) + `build:web` clean; **`tu5.mjs` re-proven at
    the exact shipped SHA — PASS 91 both `HARNESS_PARKED` settings, verdict
    read to completion in the main loop** (it parks nothing of its own; the
    superseded disclosure-v2 checks live in `tu2.mjs`'s parked section).
    Merge commit **`a079c27`**, pushed. Server surface exactly `tutor.ts` +
    `migrate.ts` + `sync.ts`; zero new deps.
    **DEPLOY HELD — NOT covered by the "Ratified" word** (Nick's own scope);
    awaits his separate say. When given: the manifest names everything in the
    target SHA beyond the last deploy (`35207e0a`) — TU5's eight slices plus
    the docs records commits, nothing unnamed; and AFTER deploy SUCCESS, the
    one-time production round-trip proof of the server's own `<book-bible>`
    splice is owed and on the checklist by name (advisory 3 below; the TU2
    server-route precedent — the client harness captures the client body
    only).
    **CLOSE-PENDING: Nick's own device sitting** (his eye on the Bible
    section) **+ the post-deploy `<book-bible>` round-trip check.** Then item
    56 closes.
    **NEXT-TOUCH NOTES (Fable's review advisories 1 & 2, non-blocking,
    logged for whoever next touches these files)**: (1) `tu2.mjs`'s surviving
    fresh-device check still carries a "Disclosure v2:" label while asserting
    a version-agnostic truth (the key is null) — a stale label on a live
    check, rename on next touch; (2) `addFact` re-stamps `{ v: 1, ... }`
    while `editFact` spreads the existing bible — no live effect (`v` is
    literally type `1`), harmonize on next touch.
    **DEPLOYED — 2026-07-24, on Nick's own separate word ("Deploy").**
    Manifest independently re-enumerated since the last deploy (`0afebcf`,
    deployment `35207e0a`): TU5's eight slices (S0-S7) + the merge + the
    docs records commits — nothing unnamed; the only NEW code is TU5's
    (server surface exactly `tutor.ts`/`migrate.ts`/`sync.ts`, zero new
    deps). **The `projects.tutor` migration ran on the production boot**
    (additive `if not exists` — server came up clean, healthcheck passed).
    `railway up` on `main` @ `5dfdcc8` (deployment `08676e48`, SUCCESS),
    confirmed live at `writer-studio-app-production.up.railway.app`.
    **ADVISORY 3 DISCHARGED — the post-deploy `<book-bible>` server-splice
    round-trip proof PASSED (2026-07-24).** One production round-trip
    (open-registration throwaway account → authed `POST /api/tutor/chat`
    with a `bible` field carrying a distinctive seeded fact, "Hero name:
    Quillon Vane"): the server returned `HTTP 200
    {configured:true, reply:"Quillon Vane", model:"deepseek-v4-flash"}` —
    the model echoed the exact seeded fact, proving end-to-end that the
    PRODUCTION server accepted the `bible` field, spliced it as the
    `<book-bible>` wire turn, and it reached the model (the gap the client
    harness could not cover — the TU2 server-route precedent, satisfied).
    Footprint disclosed: the proof created one inert throwaway user row in
    the prod `users` table (a `@wrizo-test.invalid` email, no data, cannot
    receive mail/log in) — left in place rather than risk an unprompted
    prod-DB delete; trivially removable on Nick's word if wanted.
    **That throwaway row was DELETED — 2026-07-24, on Nick's ruling**,
    scoped precisely to that one identity (id `61019985-…`, guarded on
    the `@wrizo-test.invalid` email suffix): 1 row deleted, confirmed 0
    remaining. The prod `users` table carries no test residue.
    **ITEM 56 NOW CLOSES ON NICK'S OWN DEVICE SITTING ALONE** — his eye on
    the Bible section (the last remaining condition; every other gate —
    schema word, merge, deploy, the server round-trip proof — is met).
57. **FX11 — the Board's Hands.** **BRIEF COMMITTED — 2026-07-24,
    Fable-authored** (`docs/wrizo-alpha/fx11-boards-hands-brief.md`, at
    `e6431ac`). **A fix ticket — ZERO SCHEMA, zero server files, zero new
    deps; merge pre-authorized as zero-schema, Fable reviews post-merge,
    deploy is Nick's separate word.** One ticket retires FIVE accrued
    board-hand debts, cargo enumerated by source: **(S1)** the `isDragging`
    cleanup leak — FX8 review A1: the delegated pointer effect (deps
    `[pageWidthPx]`) tears down its listeners without clearing `isDragging`,
    so a viewport resize mid-drag leaves `data-dragging='true'` and every
    face stuck `cursor:grabbing`; the fix clears the flag in the cleanup.
    **(S2)** resize-then-can't-move — Nick's device glitch: reproduce under
    trusted pointer FIRST, NAME the root cause in the commit, fix at that
    root, and diagnose the kinship with S1 explicitly (related-or-distinct
    until shown). **(S3)** lane titles ride the export — E1.1 review advisory
    2, ruled a RIDER to FX11 (BM1's writer-authored lane titles are real
    writer words; E1.1 skipped `board-meta` by name): `boardBody()` emits a
    `Lanes:` line when named lanes exist, and the now-stale "zero writer
    text" comment is corrected in the same touch. **(S4)** the rootless-cycle
    guard, both layers — BM1 review advisory 1: `withParent` walks the
    ancestor chain and refuses a cycle (clean no-op, boxes unchanged);
    `buildNodes` promotes orphan-cycle members to roots instead of dropping
    them (the never-silently-missing law for projections, defending
    already-cyclic sync data from an older client). **(S5)** FX10's missing
    leg — FX10 review advisory 2: `fx10.mjs`'s S4 scrollbar-flush /
    text-measure asserts gain the 2200 width. **Sequencing: FX11 builds
    first; M3 (the Rhizome Roams) builds only after FX11's post-merge
    review lands** — both zero-schema, both before the Aug 1 freeze.
    **BUILT + PUSHED — 2026-07-24, on `fx11-boards-hands`** (off `main` @
    `4839858`, own worktree, guard-rail before every commit; ledger edits on
    `main` only), all six commits on `origin/fx11-boards-hands`. A verify-
    before-build drift-check returned ZERO drift across all five slices.
    S1/S3/S4/S5 as briefed; **S2 shipped as a regression GUARD + documented
    investigation on Nick's own word** — the glitch could not be reproduced
    under trusted MOUSE pointer across every condition (grow both axes, shrink,
    an immediate move, a viewport-resize between), root-caused PROVABLY
    DISTINCT from S1 (a card resize never changes `pageWidthPx`, so the pointer
    effect never re-runs on a card resize), the sole residual the S-Pen
    long-press path for Nick's device sitting; no blind patch. `tsc` x2 +
    `build:web` clean. Harnesses: `fx11.mjs` PASS 19 both HARNESS_PARKED
    settings (S1 fix, the S2 DoD guard, S4 both layers); `e1.mjs` 36→38 (S3
    lane titles); `fx10.mjs` 119→122 (S5's 2200 leg). Full historic suite
    re-run: 36/37 deterministic GREEN, only the known pre-existing `fx5`
    timing flake (a typing-scroll check, unrelated to FX11; passes 2/3).
    **Merge rides the zero-schema pre-authorization; Fable reviews post-merge;
    deploy is Nick's separate word. M3 (item 58) unblocks when FX11's
    post-merge review lands.**
    **MERGED — 2026-07-24, under the zero-schema merge pre-authorization**
    (the brief's own standing rule — no explicit word needed for the merge;
    Fable reviews post-merge). Executed in the primary checkout by the
    orchestrating (chat 1) session per Nick's directive, the TU5 close
    pattern exactly — guard-rail (`git rev-parse --show-toplevel`) confirmed
    before every commit. TRUE 3-way `git merge --no-ff origin/fx11-boards-hands`
    (`fe3ce82`) onto `main` @ `76d6342` (merge-base `48398585`, `main`
    docs-only since) — auto-resolved clean, zero conflicts. At the merge
    HEAD: all prior docs verified SURVIVING (reviews, briefs, the A1 ruling,
    `tutor-rules.md` — zero docs deleted); `tsc` (desktop + server) +
    `build:web` clean; **`fx11.mjs` re-proven PASS 19 both `HARNESS_PARKED`
    settings, verdict read to completion in the main loop** (it parks
    nothing — mostly additive), and the two harnesses FX11 also touched came
    up green (`e1.mjs` 38/41, the S3 lane titles; `fx10.mjs` 122, the S5
    2200 leg). Merge commit **`7f8e943`**. Zero schema, zero server files,
    zero new deps.
    **DEPLOYED — 2026-07-24, at `375c10f`, on Nick's one batched word ("Deploy
    375c10f").** The whole batch shipped together: FX11 + CD4 + CD4.1 + M3 + all
    docs records (manifest `57f56d5..375c10f`, nothing unnamed). `railway up --ci`
    to writer-studio-app / production; **verified live** — HTTP 200, the new build
    (`index-Bvs9khZ7.js` / `index-DFzjCY9E.css`) serving, server healthy (401 on
    `/auth/me`). Client-only batch, zero server/schema change.
    **CLOSE-PENDING Nick's own device sitting**: his eye on the five retired
    debts, AND — the one thing no harness can reach — the S2 **S-Pen
    resize-then-move attempt on his actual device** (the mouse/CDP trusted-
    pointer harness proves the gesture chain structurally, but the stylus
    long-press path is his to try; the build named it the sole residual, no
    blind patch). Then item 57 closes. Fable's post-merge review follows;
    M3 (item 58) unblocks when it lands.

59. **CD4 — the Two Retirements.** **OPENED — 2026-07-24 (S0).**
    **OWNER REASSIGNED chat 1 by Nick's word of 2026-07-24** (Nick's
    parallelization word, Fable's ruling — this ticket was briefed to chat 3
    and is now built and merged in this, the orchestrating, session). Brief:
    `docs/wrizo-alpha/cd4-two-retirements-brief.md` (committed `541f435`).
    Zero schema, zero server files; merge pre-authorized as zero-schema;
    Fable reviews post-merge; deploy rides the batched word with FX11 + M3.
    Runs between FX11's post-merge review (landed on `main` `541f435`) and M3.
    **Authority — Nick's words of 2026-07-24, quoted:** "Done should die
    everywhere. A writer is never Done — they may choose to finally share a
    piece they've written, but that option lives under Publish or Workshop."
    And on the old beats control: "I'm not really sure how this fits in with
    the new architecture" — ruled by Fable as retirement of the control, the
    system dormant beneath it.
    **S1 — Done dies everywhere:** the Board's Done (the last one standing) is
    removed; PAGE → becomes the Board's only exit (its unpaired fallback
    already proven under trusted pointer in `bm1.mjs`). Grep-first for every
    "Done" control across surfaces; stragglers die in the same pass.
    **S2 — the old Plan control retires:** the page bar's legacy beats control
    (the elder "Plan") is removed; the arrow-dressed PLAN → door becomes the
    bar's only Plan word (resolving the A3 collision by retirement, not
    rename). The beats system goes DORMANT, not dead — `beat_id` and
    `story_plan_id` stay in the schema untouched and grandfathered; no data
    migration, no deletion. Successor is the Thread arc (`thread-arc-seed.md`,
    post-vacation).
    **Park obligation, per the immutability codicil:** the b2/hb1 Board-Done
    checks and cd1's successors falsified by S1, and the live gen-3 bar check
    (`['Pages','Plan','Plan →']`) falsified by BOTH slices, carry their full
    A4 park cycles — verbatim originals, superseding authority (Nick's word,
    quoted), live successors (S2's gen-4 asserting `['Pages','Plan →']`) — in
    the SAME commits as the removals. **Build + merge in progress this
    session (E1.1 pattern); SHA reported on close.**
    **MERGED — 2026-07-24, merge commit `4777d19`** (build `1fdd6f4` on
    `cd4-two-retirements`), built + merged in this session per the E1.1 pattern,
    guard-rail (`git rev-parse --show-toplevel`) confirmed before every commit.
    TRUE 3-way `--no-ff` onto `main` @ `d9f0800`; docs survived (zero deleted);
    `tsc` ×2 EXIT 0; `build:web` clean. Zero schema, zero server files, zero deps.
    **S1 — Fable's ruling amended the brief (drift I caught pre-build):** removing
    the Board's Done would have STRANDED framed system boards (Shelf/Trash/Journal
    ≥1100px) — PAGE → was `!isSystemBoard`, the rail is null when framed, the crumb
    inert. Fable ruled (relayed by Nick): system boards mount the SAME PAGE → door
    (its existing unpaired branch → `backTo`, which for a system board is already
    `'/'` — the cold-load fallback lands at Arrival, itself a page, HB1); no new
    door/relabel/crumb change; the label stays exactly "Page →". Built exactly so.
    **S2 — the elder "Plan" flight tab (→ the legacy StructureBoard) retired** from
    PageEditor (prose framed + legacy) and ScriptEditor (script): prose bar now
    `['Pages','Plan →']`, script `['Pages']`. The beats system is dormant-not-dead
    (route + StructureBoard + `beat_id`/`story_plan_id` untouched, grandfathered).
    **Park cycles (immutability codicil — RECORD names byte-frozen, PROBEs follow
    reality, all in THIS commit with the removals):** b2.mjs (Shelf-Board Done →
    PAGE → door + door→'/'); cd1.mjs (gen-3 prose bar + script check → CD4 gen-4,
    prior gens parked verbatim, three parked probes updated); **th1.mjs** (its
    "Plan toggle reads exactly 'Plan'" check read the retired `.sprint-toggle-btn:
    nth-child(2)` — CAUGHT BY THE FULL-SUITE RE-RUN, not the grep sweep; parked
    verbatim, successor verifies the lexicon "plan" term directly); hb1.mjs/bm1.mjs
    (cross-reference disclosures only — their "Board keeps Done" mentions are in
    still-passing checks). New `cd4.mjs` (purely additive, PASS 20 both settings).
    **Full historic suite read to completion in the main loop: 37/38 deterministic
    GREEN** — the only failure the known `fx5` per-line-engage-motion transient
    flake (item 48 deflake set; confirmed PASS 2/2 in isolation, unrelated to CD4).
    **DISCLOSED RESIDUALS for Fable's post-merge review:** (a) StructureBoard stays
    reachable via its secondary access — ProjectHome "View board" / BeatWizard /
    QuickSprint's toggle — left dormant-not-dead (the StructureWizard precedent the
    brief cites); full unreachability would retire those too, flagged not assumed.
    (b) Two literal "Done" labels remain OUT of scope — the card-edit popup's close
    button (fx4-proven) and Spread's select-mode toggle — transient
    action-completion affordances, not the Board's exit Done; retiring them needs
    replacement labels (a design call), flagged for Fable's DoD ruling.
    **DEPLOYED — 2026-07-24 (`375c10f`), with the batch** (FX11 + CD4 + CD4.1 + M3 + docs) — see item 57's deploy record. Verified live.
    **REVIEW LANDED GREEN — 2026-07-24** (`docs/wrizo-alpha/cd4-review-fable.md`):
    both retirements verified at their sources, the ruling implemented exactly as
    amended, the four-generation `cd1.mjs` park chain and the three lawful park
    modes all sound. **Residual (a) — StructureBoard's secondary access — ENDORSED
    as correctly scoped** (ProjectHome "View board" / BeatWizard / QuickSprint are
    the legacy system's remaining doors; their sentencing is the Thread committee's,
    with W1 or earlier — recorded as a Thread-committee agenda item, `thread-arc-
    seed.md` inherits it). **Residual (b) — the two transient "Done" labels — RULED:
    they die → CD4.1 (item 61), directed to chat 1.**
    **CLOSE-PENDING CD4.1 merged + Nick's device sitting** (his hand through all
    three system-board doors, his eye on the bar that finally holds one Plan). Then
    item 59 closes — and no completion verb remains anywhere a writer can see.
61. **CD4.1 — the Last Two Words.** **OPENED — 2026-07-24 (S0), owner chat 1**
    (directed by Fable's CD4 post-merge review, `cd4-review-fable.md`). The last
    two literal "Done" labels a writer can see — the card-edit popup's close button
    (`board-popup-done`) and Spread's select-mode exit toggle — both become
    **"Close"** (Nick's word categorical; the DoD says no surface says Done; the
    Spread pair reads Select/Close — a door word, never a completion word). Micro:
    two strings; the fx4 `board-popup-done` check gets its park cycle + successor,
    the Spread `app.click('Done')` action becomes `'Close'` (fixture maintenance),
    and `cd4.mjs` gains a no-"Done"-anywhere structural sweep as the standing guard
    — all in the same commit. Zero schema, zero server; rides the batched deploy
    with FX11 + CD4 + M3. Build + merge this session (E1.1 pattern); SHA on close.
    If either word reads wrong under Nick's hand, it's one string at the sitting.
    **MERGED — 2026-07-24, merge commit `f1be3dd`** (build `a48f445`), built +
    merged in this session (E1.1 pattern), guard-rail confirmed before every
    commit. TRUE 3-way `--no-ff` onto `main` @ `8a8ce85`; docs survived (zero
    deleted); `tsc` ×2 EXIT 0; `build:web` clean. Zero schema, zero server, zero
    deps. Both strings landed: the card-edit popup's close button (`board-popup-
    done` class + `onClose` behavior unchanged) and Spread's select-mode exit
    toggle now read **"Close"** — the Spread pair is Select/Close.
    **Park cycle (immutability, same commit):** `fx4.mjs` — the "S5: Done closes
    the popup…" check parked VERBATIM in the house pok-record form (fx4 has a
    parked section), its probe re-verifying the CURRENT label directly (a fresh
    card's popup carries a close button reading exactly "Close"), with the live
    successor asserting the "Close" button still closes/un-blurs/commits; `j5.mjs`
    — the Spread `app.click('Done')` exit ACTION → `'Close'` (fixture maintenance,
    not an assertion); `j4`/`ab4`/`ab1`'s frozen records that MENTION the popup's
    "Done" button left as-is (they close by CLASS, probes pass, history accurate —
    no park manufactured). `cd4.mjs` gained the **no-"Done"-anywhere structural
    sweep** as the standing guard (the popup reads "Close", the Spread reads
    Select/Close, and no control reads exactly "Done" on the popup, the Spread, a
    system board, a prose page, or a script page).
    **Full historic suite re-run to completion in the main loop: 38/38
    deterministic GREEN** (zero flakes this run). cd4.mjs 27 both settings; fx4.mjs
    49 / PARKED 3 (the CD4.1 pok re-verifies).
    **DEPLOYED — 2026-07-24 (`375c10f`), with the batch** — see item 57's deploy
    record. Verified live. **CLOSE-PENDING Nick's sitting** — his eye on the two "Close" words
    (one string each if either reads wrong). **This also satisfies CD4's (item 59)
    remaining gate: item 59 now close-pends ONLY Nick's device sitting.**
    **REVIEW LANDED GREEN — 2026-07-24** (`docs/wrizo-alpha/cd4-1-review-fable.md`):
    the two strings landed exactly as directed; all three park modes applied
    correctly again; the no-"Done" sweep is the DoD's regression tripwire. Three
    non-blocking advisories: (1) "Close"/"Select" are literals (as "Done" was) —
    the popup foot, the Spread toggle, and the neighboring "Undo" migrate to
    `deskLexicon` together at next touch (parity today, debt named); (2) the
    sweep's surface list extends opportunistically as new surfaces mount; (3) a
    frozen record gains a cross-reference annotation only if it ever makes a
    present-tense structural Done claim (none does today). **Item 61 close-pends
    Nick's sitting alone.**
58. **M3 — the Rhizome Roams.** **BRIEF COMMITTED — 2026-07-24,
    Fable-authored** (`docs/wrizo-alpha/m3-rhizome-roams-brief.md`).
    **ZERO SCHEMA, zero server files, zero new deps; merge pre-authorized as
    zero-schema, Fable reviews post-merge, deploy is Nick's separate word;
    before the Aug 1 freeze.** M2 shipped the rhizome GREEN; Nick's device eye
    ruled three verdicts and M3 is those made real, nothing else: **(S1)** the
    ink warmed — `--rhizome-ink` `#4A3A28`→`#7A6242` (~2.9:1, a bounded delta
    for the sitting). **(S2)** the roam — the field already spans the whole
    ground, so the single paper-bottom-center origin becomes SEVEN, blue-noise
    scattered via best-candidate sampling (~10 candidates/point, farthest from
    every placed origin + the paper rect), paper's bottom-center kept as origin
    one, all from the entry-id PRNG (deterministic); the paper-avoidance law
    (`segmentTouchesRect`) unmoved and re-proven at full scale (40-seed stress
    sweep, zero paper violations the only acceptable number); the 7 is a
    bounded delta. **(S3)** essay-length saturation — coverage driven by TOTAL
    word count through `CAP·(1−e^(−words/K))`, K≈834 so 95% of CAP at ≈2,500
    words, grow toward the target each event, hard-stop at CAP (the exponential
    IS the organic law); replaces M2's event-decay bands; NO
    numbers/percentages/counts/meters anywhere (the anti-gamification frame
    binds absolutely); K a bounded delta. **(S4)** determinism (seeded by entry
    id + session, M2's discipline) + reduced-motion extended. The DoD ("Nick
    opens a page he has truly written, and the ground is alive to the edges")
    settles the driver as TOTAL words, so M3 supersedes M2's mount-empty
    behavior. **The M2 review is the foundation document; its rulings stand
    except where a verdict supersedes.** S5: `m3.mjs` + the M2 park sweep (the
    paper-bottom-center origin anchor, the mount-empty/no-catch-up behavior the
    total-word driver supersedes, the decay-band schedule — parked A4-style with
    live successors); **Q1 stays parked** (assert the framed desk still has NO
    progress row — no answering a parked question by the back door). Owner
    chat 3; CD4 (item 59, chat 1) builds in parallel, files disjoint, both
    merges serialize through chat 1's lane. **Build starting — 2026-07-24, on
    `m3-rhizome-roams` off the FX11-review-carrying `main`, own worktree,
    guard-rail before every commit; ledger edits on `main` only.** `tsc` x2 +
    `build:web`; both HARNESS_PARKED settings; report = push. Drift-check: ZERO
    structural drift; the S2/S3 design (7, K) Fable-ruled, vetoable at the
    sitting.
    **BUILT — 2026-07-24 (chat 3), on `m3-rhizome-roams` (`ccf643b`); pushed,
    merge rides the zero-schema pre-auth through chat 1's lane, Fable reviews
    post-merge, deploy is Nick's word.** All five slices landed — S1 ink
    `#7A6242`; S2 seven blue-noise origins; S3 saturation `CAP·(1−e^(−words/K))`
    K=834 (total-word driver, no numbers); S4 determinism + reduced-motion.
    `m3.mjs` 33/33, `m2.mjs` 54/54, both HARNESS_PARKED settings; `tsc` x2 +
    `build:web` clean; full historic suite green (fx5's known per-line flake
    passes on re-run). **M2 park sweep** found only the mount-empty behavior
    falsified (NOT the anticipated origin-anchor or decay-band checks — M3 keeps
    origin one = paper bottom-center, and the M2 engine primitives
    `growMany`/`bandRate` coexist untouched): four `m2.mjs` checks (the two
    remount-EMPTY / replay-same-shape determinism checks; the two goal-crossing
    burst checks — the 245+6=251 fixture crosses the goal during "…six", not on
    the "seven" they bracket) kept verbatim + SUPERSEDED + successor-pointer
    A4-style, live successors in `m3.mjs` (revisit reproduces the byte-identical
    saturated ground; crossing the goal lands ≤+12 burst-flagged segments, growth
    kept whole). Q1 stays parked. **ONE JUDGMENT CALL for review — a
    geometry-drift refit** (`outsidePaper` origin nudge + a `RhizomeField`
    re-fit): the harness surfaced that the field grows against the boot-time
    paper, then the chrome-recede settle raises the paper ~30–40px into the
    now-static ground (worst at narrow widths; invisible — the field is
    z-beneath the paper — but a real gap in "the roam avoids the paper", and it
    IS the DoD path: open an already-written page). S2's verdict is only real if
    the live roam avoids the paper's SETTLED place, so the field now RE-FITS —
    rebuilds its ground from the same seed (deterministic; same seed+geo ⇒ same
    scatter) to a high-water target (forward-only preserved) whenever the
    measured geometry materially changes (boot-settle + window resize), via a
    ResizeObserver + one deferred settle-tail re-sync. A behavioral addition to
    the shipped M2 component beyond the three verdicts, flagged against "nothing
    else" for Fable to ratify/veto; it partially addresses item 60's root at the
    boot-settle manifestation, item 60's revisit-raw-coordinate question still
    open. Touch: `RhizomeField.tsx`, `rhizomeEngine.ts`, `m2.mjs`, `m3.mjs`
    (new); guard-rail before the commit; this ledger edit on `main`.
    **MERGED — 2026-07-24, merge commit `7ebe703`.** Built by chat 3
    (`m3-rhizome-roams` @ `ccf643b`); merged by chat 1 in the serialized lane,
    the standard sequence, guard-rail confirmed. TRUE 3-way `--no-ff` onto `main`
    @ `a896923` (merge-base `541f435`; `main` advanced with all of CD4/CD4.1 +
    records since) — **auto-resolved CLEAN, zero conflicts**: M3 touched only
    `RhizomeField.tsx`, `rhizomeEngine.ts` (new), `index.css`, `m2.mjs`, `m3.mjs`
    (new), no overlap with the CD4/CD4.1 files. At the merge HEAD: docs survived
    (zero deleted); `tsc` ×2 EXIT 0; `build:web` clean; **`m3.mjs` PASS 33 and
    `m2.mjs` PASS 54, both `HARNESS_PARKED` settings, read to completion in the
    main loop**; integration spot-check `cd4`/`cd1`/`m1` GREEN (the M3 + CD4/CD4.1
    union is clean). Zero schema, zero server files, zero deps.
    **Fable's ruling on the geometry-drift RE-FIT: ENDORSED — within M3's own
    mandate** (the boot-settle + window-resize re-sync that makes S2's paper-
    avoidance verdict real against the paper's settled place). **Item 60 STAYS
    OPEN** for the revisit-determinism (revisit-raw-coordinate) question proper —
    the re-fit addresses only the boot-settle manifestation of item 60's root.
    **DEPLOYED — 2026-07-24 (`375c10f`), with the batch** — see item 57's deploy
    record. Verified live. Merge rode the zero-schema pre-authorization; Fable reviewed post-merge (GREEN).
    **CLOSE-PENDING** Fable's post-merge review + Nick's device sitting (his eye
    on the ground roaming warm to the edges, an essay's worth of fill, never
    touching his words). Then item 58 closes.
    **REVIEW LANDED GREEN — 2026-07-24** (`docs/wrizo-alpha/m3-review-fable.md`):
    the three device verdicts real (ink `#7A6242` with contrast arithmetic; seven
    blue-noise origins, paper double-walled, 40-seed sweep zero violations at full
    saturation; `SAT_K=834` curve — coverage/monotonicity/bounded-tail proven); the
    geometry-drift RE-FIT ratified IN FULL ("the mandate holding, the implementation
    better than the flag suggested" — the ground the deterministic image of (seed,
    geometry, total words), forward-only preserved by the high-water mechanism); the
    park sweep "lighter than briefed and correct" (only four component-observing
    checks falsified, all quoted verbatim). Non-blocking advisories: (1) the four m2
    parks use the comment-record form (th1 precedent, lawful) — migrate to the
    pok-record form at next touch (m2 has a parked block); (2) `growTo`'s 200-skip
    bailout (liveness over completeness) named for a future "ground came up short"
    report; (3) item 60's scope refined below. **Item 58 close-pends Nick's sitting
    alone; with this review the whole batch is merged AND reviewed — the deploy word
    is unblocked.**
60. **The Rhizome revisit-geometry defect** (lifted from `m2.mjs`'s Section A
    comment per the M2 review's standing ask + M3 S0 — its RECORD is M3's
    scope, its FIX is not). On revisiting the SAME entry within a session the
    measured ABSOLUTE stage/paper rect can shift by a constant offset, so raw
    growth coordinates differ across an in-app revisit even though the seeded
    PRNG's SHAPE is byte-identical; `m2.mjs`'s determinism check sidesteps this
    by shape-normalizing every coordinate to the first segment's own start
    point (intent: growth SHAPE not raw pixels — kept per A4). The primary
    known cause — App.tsx's `.app-main[data-desk-frame-active]` DeskRail-gutter
    switch leaving the 64px reservation transiently mis-stated — was **fixed at
    source by J6 S1 (`store/deskFrameActive.ts`, item 47 closed)**; whether a
    residual absolute-shift remains, and whether the normalization sidestep can
    now retire to a raw-coordinate assertion, is the open question this item
    surfaces so the next session finds it OUTSIDE a code comment. **Fix
    deferred — not any ticket's scope until claimed; M3 only lifted the
    record.**
    **REFINED by the M3 review (advisory 3, 2026-07-24):** the boot-settle
    manifestation is now closed at its root by M3's refit (`syncField` resets the
    PRNG to the entry's seed and regrows deterministically on a >1px geometry
    change). What remains is the ABSOLUTE-OFFSET question proper — live determinism
    is proven under normalization to the first segment's start; whether that
    normalization can be dropped (absolute determinism) or the frame-offset variance
    is inherent-and-benign is a small post-vacation investigation. Item 60 closes
    when that's answered either way.
62. **The SC arc — the Script's Own Room.** **FOUNDED — 2026-07-24 (S0 records
    push).** Nick's first screenplay sitting (laptop-class ~2560px framed, Flux
    theme, a Page converted to Screenplay, DRAFT on the mode strip) produced
    seven verdicts, recorded in his words as the spec per the M3 precedent —
    `docs/wrizo-alpha/sc-defect-verdicts.md`. **SC-V1** the room's placement
    ("the page is in a weird spot, the side menus are floating in space");
    **SC-V2** the type ("the font is too big"); **SC-V3** the arc's
    constitutional verdict — the page is not a page ("1 page roughly equals 1
    minute of screen time … our screenplay page needs to comport to those
    standards"); **SC-V4** the caret's home ("the cursor starts by floating in
    the middle of the page"); **SC-V5** the trade's tools, a verdict of absence
    (Fable's census attached: `retype()` is reachable ONLY by keyboard —
    **no pointer path to an element type exists**, a usability defect on a
    laptop/tablet-first product, not a missing feature); **SC-V6** the Tutor's
    ear; **SC-V7** the storyboard one gesture away. Evidence screenshot belongs
    alongside at `docs/wrizo-alpha/sc-evidence/screenplay-1-flux.png` — **not yet
    in the tree; rides the next records push when Nick drops the file.** The
    committee sat a double pass (`docs/wrizo-alpha/sc-committee-pass.md`) with a
    guest bench of working screenwriters by Nick's word — Feature Dramatist,
    Room Writer, Half-Hour Writer, Genre Spec Writer — and pinned the standard
    for the record: US Letter, Courier 12pt at 10 cpi / 6 lpi, margins
    1.5/1/1/1, ~55 lines, the element grid, page numbers top-right from page
    two. Its diagnosis of V2+V3+V4 as one defect wearing three faces stands as
    the arc's frame: **the room was furnished with prose furniture.** Marketing's
    five objections (runway, the first number, the BM1 flip-flop,
    storyboard-by-default, scope gravity) all resolved in session; the line
    drawn on the record — **Wrizo's screenplay room is a writing room, not a
    production office** (deferred + named: SC2.1 `(MORE)`/`(CONT'D)`, dual
    dialogue, title page; out of alpha entirely: revision colors, locked pages,
    production numbering).
    **RULINGS LANDED — 2026-07-24** (`docs/wrizo-alpha/sc-ratification-record.md`,
    the R4-ruled version). **R1 APPROVED** — page numbers as document furniture,
    top-right from page two, page one bare; the bright line travels with it (the
    number lives on the page artifact only, no aggregate of it ever surfaces
    anywhere; the anti-gamification frame amended by exactly this one line).
    **R2 APPROVED** — the script page's door, amending BM1's script-bar ruling on
    the record: the arrow-dressed **PLAN →** door, a board first born from a
    script page wakes in STORYBOARD, remembered mode governs thereafter (lands in
    SC3). **R3 HELD** — TS1 (the committee's Second Sitting, chamber 1, the PROSE
    page's per-mode strips) awaits ratification; Nick's word: wait and note it for
    revisit → a post-vacation agenda item. Fable's ruling under the hold: SC3's
    script strip rides the AB2 strip system that already exists as its own
    surface — SC3 is unblocked. **R4 RULED** (Nick: "I agree with you about R4",
    ratifying Fable's split) — (a) the **craft ear** ships pre-vacation as **SC4 —
    the Tutor's Script Ear**, the arc's final micro-ticket after SC3
    (server-touching prompt work, zero schema, disclosed at brief); (b) the
    **FORMAT lens** (a fourth programmatic offline lens, mechanical format linting
    against the grid) is a feature under the freeze and queues as **the first
    post-vacation TU ticket**, on the horizon for the Write/TU line to claim and
    number. **R5 RATIFIED** — `scriptKeys.ts` stands exactly as shipped; the bench
    confirmed both AMENDABLE cells match the trade's muscle memory (Enter after
    dialogue → action; Tab from character → transition); the 2026-07-11 loop
    closes, the in-file AMENDABLE comments update to RATIFIED as a rider on SC3.
    **R6 — Nick's word, overruling the committee's recommendation:** "I want to
    get this fixed before I go so I can start working on a screenplay." The arc
    builds **pre-vacation**; his condition (no architectural conflict with the
    pending device sitting) cleared by Fable on the record, and the
    deploy-manifest recommendation is already satisfied — the batch shipped at
    `375c10f` before any SC merge, so SC earns its own deploy word separately.
    *(residue superseded 2026-07-25 — the EARNING stands exactly as written; only
    "separately" is superseded, since one word may now cover both arcs when the
    manifest names their contents. See the amendment below.)*
    **Sequencing ruled: SC1 → SC2 → SC3 (+ the door + the R5 comment rider) →
    SC4.** All fixes, all zero schema, all freeze-lawful.
    **SC1 BRIEFED — 2026-07-24, Fable-authored**
    (`docs/wrizo-alpha/sc1-true-geometry-brief.md`): the Room's True Geometry, the
    arc's heart — S1 the true page (Letter proportions, bundled Courier Prime
    under SIL OFL as an asset with its license, the whole-sheet scaling law), S2
    the element grid (single-sourced, replacing `elementStyle()`'s
    approximations), S3 the caret's home (reproduce-then-root-cause; the
    typewriter yields until the natural position passes the stage's center), S4
    the seated room (reproduced on default chrome + two themes including Flux,
    with any Flux-ONLY residue recorded to the parked theme arc and never
    chased), S5 the `sc1.mjs` geometry floor (aspect + grid ratios at full and
    scaled widths, display-uppercase vs. unchanged storage, S3 under genuine
    trusted CDP pointer + real keystrokes, both `HARNESS_PARKED` settings,
    grep-first `scripts/harness/` with lawful park cycles in the same commits).
    Owner CC (SC line), one worktree off `main` at or after the M3 merge
    (`7ebe703`); merge rides the zero-schema pre-authorization through chat 1's
    serialized lane; Fable reviews post-merge; deploy is Nick's separate word.
    **The arc seed** (`docs/wrizo-alpha/sc-arc-seed.md`) is already on `main` at
    `375c10f`. **Item 62 tracks the whole arc: SC1 building, SC2/SC3/SC4 queued
    behind it in that order.**
    **SC1 BUILT + VERIFIED — 2026-07-24/25 (chat SC), branch `sc1-true-geometry`
    (`e86d016`), parented at `66b2674`, pushed.** One defect wore three faces:
    `.script-sheet` had margins in real inches but no page, so inside
    `.mode-pagecol` it shrink-wrapped its own content (424px at 1280px, growing
    to 615px as a slugline was typed) — SC-V1, SC-V2 and SC-V3 all root there.
    The fix derives the whole page from one font-size (`min(1rem, calc(100cqw /
    51))`; 1in = 6em, 8.5in = 51em, 11in = 66em, measure 36em = 60ch,
    `line-height:1` = 6 lpi), so no inch can drift from another. SC-V4's floating
    caret root-caused NOT to the typewriter hook (whose C2 guard was refusing
    correctly all along) but to a static 183px `--tw-start-offset` padding; per
    **Nick's word of 2026-07-24 (via Fable) the screenplay surface no longer runs
    the typewriter at all**, interim, pending his own revision in a separate
    build — which **AMENDS AB2 S2's shipped DoD** (parked to generation 2 in
    `ab2.mjs`) and puts the option's return in SC3. Two of the brief's own
    hypotheses were corrected by measurement and recorded as such:
    `scriptMetrics.ts` was already exact (the offsets only looked wrong applied
    to a 184px column), and Courier Prime was already a dependency — **the
    brief's one disclosed new font asset turned out to be no asset at all** (no
    `package.json` in the diff). Ten files, +1336/−113; **zero schema, zero
    server, zero new deps**; the prose blast radius is two files and 28 lines,
    all behind `typewriterAvailable` (default `true`, passed `false` only on
    `content.kind === 'draft' && content.structure === 'screenplay'`). Park
    cycles (A4, all in the SAME commit): `fx1` (prose-width band + a
    generation-3 start-fraction park + both script typewriter checks, one of
    which was also at risk of passing vacuously — `[].every()` is true), `fx3`
    (the script paper-to-stage fence RETIRED outright, its subject gone; the
    start-offset park to generation 2; S5's icon-count + aria, the aria claim
    re-asserted on prose), `fx4` (the script "about a quarter", whose parked
    probe now stands as the prose-leak detector), `fx7` (the 30px sliver fence,
    superseded on its NUMBER not its law), `ab2` (the S2 DoD itself).
    **VERIFICATION — 41/41 harness files, BOTH `HARNESS_PARKED` settings,
    serially, every verdict read to completion in the main loop: 1824 VERIFY
    unset; 139 PARKED + 1926 VERIFY = 2065 at `=1`; zero failures, zero
    isolation re-runs, asserted against the raw JSON rather than the verdict
    lines.** `sc1.mjs` 66/66 both settings; `tsc` ×2 EXIT 0; `build:web` clean.
    **fx5 did not fail** (the pre-DF1 sampler, green in-suite both passes) and
    the requested clean-`main` baseline is moot — DF1 root-caused the historic
    flake independently and is merged at `c566875`; the structural exoneration
    stands in its place (SC1 cannot reach fx5's subject —
    `useTypewriterFade.ts` untouched, `.desk-frame-scroll-cap` rendered by
    `ScriptEditor.tsx` alone, the prose selector split byte-identical).
    **fx9's `rc=127` is confirmed an invocation artifact** — the file exits
    through a single `process.exit(pass ? 0 : 1)` and has no path emitting 127.
    Six orphaned `--headless` browsers were swept before and between passes,
    four leaked by the dead SC session — the same leak DF1's build note names as
    what had been failing runs; **sweeping before a suite run now has two
    independent witnesses.**
    **SC1 REVIEWED GREEN — 2026-07-25** (`docs/wrizo-alpha/sc1-review-fable.md`,
    Fable-authored, committed verbatim). Census read from the commit, the
    geometry derivation checked independently against the CSS and the
    arithmetic, park cycles spot-read on the branch (`fx3`, `ab2`) rather than
    taken on trust. **Clear to merge** through chat 1's serialized lane on the
    zero-schema pre-authorization. **Deploy is Nick's separate word on SC's OWN
    manifest — never folded into the P0 wave.**
    *(superseded 2026-07-25 — see amendment below)*
    **MERGE-ORDER HAZARD — RECORDED, AND NOW BINDING ON SC1.** FX14's harness
    sweep and SC1's park cycles collide on **four files — `fx1`, `fx4`, `fx7`,
    `ab2`**. Read-only `merge-tree` trials come back conflict-free (SC1 × FX14,
    SC1 × `main`, SC1 × `df1-deflake`), but a clean auto-merge is not a safe
    merge when both tickets rewrite park-bearing files: git will interleave two
    sets of frozen records without either side failing. The rule as reviewed:
    **whoever merges second re-runs the full suite on the COMBINED tree and
    verifies SC1's frozen park records survived BYTE-IDENTICAL** — the
    immutability law asserting itself at merge time rather than at review time,
    and not optional. **The P0 wave landed first** (FX13 `ba70279`, DF1
    `c566875`, FX14 `a348027`, records `a2ec42a`), so **SC1 is the second merger
    and that obligation is SC1's.** SC1's 41/41 verification above was run on a
    tree parented at `66b2674` — it predates FX14's rewrite of the collision
    zone (`ab2` −247 lines, `fx4` heavily rewritten) and **does not carry
    forward to the combined tree unre-run.** Held for Nick's/Fable's word before
    `main` is brought into `sc1-true-geometry`. Third carry-back, now resolved
    by the wave: `fx5.mjs`'s three claimants sequenced themselves — DF1's
    rewrite and FX14's sweep are both on `main`; SC1 never touched the file.
    **HAZARD DISCHARGED — 2026-07-25, on Fable's GO. Merge HEAD `22dc1c7`**
    (`git merge --no-ff origin/main` at `f483fe8` into `sc1-true-geometry`;
    parents `e86d016` + `f483fe8`; **a MERGE, never a rebase — `e86d016`
    survives in history as the commit Fable reviewed GREEN, so the review of
    record names a commit that still exists**). Zero conflicts. The trial tree
    was a prediction; these are the facts at the real HEAD:
    **(1) The 37 frozen park records, `e86d016` → `22dc1c7`: `ab2` 12→12,
    `fx1` 14→14, `fx3` 6→6, `fx4` 4→4, `fx7` 1→1 — ALL BYTE-IDENTICAL.**
    Cross-checked independently with DF1's own `audit-parked-records.mjs`,
    which now scans 43 files / 131 records: TRACED-once 102, TRACED-multi 23,
    B1-touched 2 (the known pre-law case, cited not re-flagged), REVIEW 4.
    **The 4 REVIEW items are DF1's identical hand-verified set** (`ab3`/`cd2`
    `pok(` inside a comment; `ab4:595` nested escaped quotes; `fx1` the
    generation-framing the keyer cannot parse) — `fx1`'s is SC1's own record,
    line 540→580, raised gen-2→gen-3 by SC1 and flagged for the same known
    extraction edge, not a mutation. The auditor's non-zero exit is DF1's
    documented behavior on an un-auto-traceable record, i.e. the pre-existing
    baseline, not a finding.
    **(2) FULL HISTORIC SUITE AT THE MERGE HEAD — 43/43 files, BOTH
    `HARNESS_PARKED` settings, serially, every verdict read to completion in
    the main loop: 1790 VERIFY unset; 139 PARKED + 1892 VERIFY = 2031 at `=1`;
    zero failures, zero isolation re-runs, asserted against the raw JSON.**
    The parked total is **139, identical to the pre-merge run** — every SC1
    park cycle still fires against FX14's rewritten files. `sc1.mjs` 66/66 both
    settings; `tsc` ×2 EXIT 0; `build:web` clean. Orphaned `--headless`
    browsers swept before and between passes (2 between). Live check counts
    moved in several files (`w1` 18→5, `w2` 31→21, `ab2` 41→31, `fx4` 49→42,
    `b1` 51→48, `j5`/`j6`/`m1`/`b2-1`) — that is **FX14's own re-point
    consolidation, already on `main` and already reviewed with FX14**, not an
    SC1 delta. **SC1 holds at `22dc1c7`, verified and unmerged; merge remains
    chat 1's lane and deploy remains Nick's separate word on SC's OWN
    manifest** — the P0 deploy of 2026-07-25 (`c13182b` / railway `cf99e5a8`)
    correctly carries no SC ticket.
    *(superseded 2026-07-25 — see amendment below)*
    **SC1 MERGED — 2026-07-25, merge `3e83f4c`** (tip `22dc1c7`), through chat 1's
    serialized lane on the zero-schema pre-authorization + Nick's "Go." E1.1 3-way
    --no-ff onto `main`; origin's advance since SC1's base was docs-only (SC2
    amendment, BG1's item-67/P1-wave records), so the merge was disjoint/clean. **The
    merge-order obligation (SC1 = second merger) is DISCHARGED at the LANDED HEAD:**
    the merged `apps/` tree is byte-identical to SC1's own hazard-discharged tip
    `22dc1c7`; the full historic suite was re-run on the combined tree, read to
    completion in the main loop — **43/43 files GREEN, both settings (86 runs, zero
    failures)**; `tsc` ×2 EXIT 0, `build:web` clean; and DF1's
    `audit-parked-records.mjs`, re-run at the landed HEAD, reproduces the SC-lane's
    exact result (43 files / 131 records; TRACED 102+23; B1-touched 2; the same 4
    hand-verified REVIEW edges, none new) — SC1's frozen park records survived
    BYTE-IDENTICAL. Fable reviews post-merge; **deploy HELD — SC's own separate word
    on SC's own manifest**, never folded into a wave. SC2 is next in sequence.
    **RESIDUE ANNOTATED — 2026-07-25 (chat 1, in its own hand, per the flag at this
    item's SC-lane amendment below and Nick's word; cross-reference form, CD4 mode 3).**
    The residue this record carries is the SEPARATENESS — the phrase **"never folded
    into a wave"** (and "SC's own separate word … on SC's own manifest" read as
    *apartness*). The P1-wave amendment moved exactly that: SC content MAY now ride a
    shared deploy when the manifest enumerates both arcs' contents by name (Fable,
    2026-07-25 — the amendment below). What did NOT move is the EARNING — the deploy is
    still HELD, Nick's word is still required, and the manifest must still name
    everything. Per the general form, the RESIDUE is annotated, not the entry: this
    record stands byte-identical; only the separateness is superseded, not the earning.
    **Canon note for chat 1: the shared house-laws file moved.** The Relay Law
    was appended to `docs/wrizo-alpha/fable-session-handoff-v3.md` as **law 6**
    — landed by chat 1 at `cc2d971`, verified faithful from this lane (the
    statement verbatim, plus the test, the what-fires clause and the bounds,
    pointing to `docs/wrizo-alpha/relay-law.md`). The SC lane held the same
    instruction and stood down rather than duplicate the edit.
    **SC2 BRIEFED — 2026-07-25, Fable-authored, committed verbatim**
    (`docs/wrizo-alpha/sc2-the-clock-brief.md`): the Clock. Derived pagination
    on the **54-line** body (SC1's exact derivation — 66em − 6em − 6em = 54em
    at 6 lpi — over the committee's approximate "~55"; the discrepancy is to be
    recorded in the commit, not silently chosen), a sequence of 66em sheets
    derived and never stored, break rules (no scene heading and no character
    cue last on a page; no element splits in SC2 — the honest cost is page
    counts running slightly long against Final Draft until SC2.1's
    `(MORE)`/`(CONT'D)`; an over-page action block is the one permitted split),
    R1's page numbers top-right from page two with the bright line provable as
    an ABSENCE (no total, no "of N", nowhere in the app, `aria-label`
    included), the caret surviving a page break under trusted pointer with a
    typing-latency ceiling on a 20-page doc, and `sc2.mjs`'s viewport-invariance
    proof — **the same document must paginate identically at 1100px, 2200px and
    in a 700px room; a page count that moves with the window is a clock that
    lies.** **SC2 is NOT started and does not branch until SC1's merge lands.**
    **SC2 AMENDMENT 1 — 2026-07-25, Fable-authored, committed verbatim**
    (`docs/wrizo-alpha/sc2-brief-amendment-1.md`; travels with the brief, which
    stands except where amended). **S5's founding premise is WITHDRAWN on
    measurement.** The brief asserted "pagination recomputes on every keystroke
    in the current architecture"; it does not. `AUTOSAVE_MS = 2000` and
    `groupIntoScenes` runs inside the DEBOUNCED autosave effect (plus
    flush/visibility-change, the publish/copy paths and `liveScriptText`) — **it
    is not on the keystroke path at all.** The real per-keystroke cost is React
    reconciling every `StaticScriptElement`: a plain function component with **no
    `React.memo`**, taking **a fresh `onActivate` closure** and **a fresh
    `elementStyle()` object** on every render, so memoizing the component alone
    would not bite. **Fable's S5 conditional is DISCHARGED: the flatten/regroup
    is not the bottleneck, there is no pre-existing performance defect to name,
    and SC2 absorbs nothing hidden** — the pre-build baseline was run before any
    SC2 code existed, exactly as ruled (reproduce first).
    **The measured baseline, now of record** (caret in the FIRST element — worst
    case; 49 real CDP keystrokes per size, every one gated as landed in the doc
    before any number was believed; measured at the SC1 merge HEAD `22dc1c7`,
    fast desktop, headless, DPR 1): 1.0pp/40els 0.73ms mean · 1.5 p95 —
    3.5pp/160 1.04 · 1.6 — 9.9pp/464 1.57 · 2.1 — **19.5pp/928 2.79 · 5.0** —
    29.2pp/1392 4.46 · 6.2. **Linear: ~0.6ms fixed + ~2.8µs per element**; at 20
    pages that is 2.8ms mean / 5.0ms p95 against a 16.7ms frame, **~11.7ms of
    p95 headroom** for SC2's ledger.
    **S5 as amended:** build the **memoized per-page render from the start**
    (not retrofitted) paired with an **incremental ledger recomputed from the
    edited element forward**; deferring distant-page reflow is HELD IN RESERVE
    (least bought, most correctness risk) — CC's recommendation, ratified.
    Memoization requires **both** props stabilised or it does nothing:
    `elementStyle(el.t)` becomes one frozen per-type object at module level, and
    `onActivate` stops being a per-index arrow closure; neither alters behavior
    and both belong in S5. **The latency ceiling is REDEFINED as a regression
    bound, not an absolute** — an absolute millisecond gate is false on varied
    hardware; `sc2.mjs` measures the pre-SC2 baseline and the post-SC2 figure
    **in the same run on the same machine**, and **SC2's p95 at 20 pages must
    not exceed 2× the baseline p95.** The absolute figures above are the
    reference observation, never the gate. Hardware margin is a real caution: a
    laptop 2–3× slower puts today's 20-page p95 at 10–15ms, at the frame edge
    before SC2 adds anything — **the harness proves the regression bound; the
    verdict on FEEL remains Nick's at a device sitting.**
    **Two practices earned here.** (1) **Instrument the right event** — measuring
    `keydown` on a contenteditable produced a flat 0.1ms curve across a 35× size
    sweep, an artifact (the browser inserts the glyph natively; the React work
    rides the subsequent `input` event). A flat curve across a large size sweep
    is a signal to distrust the instrument. (2) **A timing claim carries a
    correctness gate** — an earlier run recorded plausible latencies while the
    keystrokes were landing on `<body>`; numbers that look right while nothing
    happened are the measurement form of *presence is not composition*. Any
    timing or performance claim must assert the measured work actually occurred
    (keystrokes landed, focus held, the document changed) before the number is
    believed. **Practice (2) is RECOMMENDED FOR ELEVATION to the house laws —
    PENDING NICK'S WORD, not taken.** `fable-session-handoff-v3.md` is NOT
    edited by this commit; the house laws stand at law 6 (the Relay Law) until
    he rules.
    **RULED — NICK DECLINES THE ELEVATION, 2026-07-25. CLOSED; no lane re-asks.**
    "A timing claim carries a correctness gate" **stays a recorded LANE
    PRACTICE — honored in the work, not canon.** `fable-session-handoff-v3.md`
    stands at **law 6** (the Relay Law) and is not amended. The practice binds
    SC's own work regardless, and Amendment 2 below makes it a harness
    requirement, which is where it does its real work anyway.
    **SC2 AMENDMENT 2 — 2026-07-25, Fable-authored, committed verbatim**
    (`docs/wrizo-alpha/sc2-brief-amendment-2.md`; travels with the brief and
    Amendment 1). Both points originated with the SC lane's builder and are
    **RATIFIED INTO THE BRIEF — requirements now, not suggestions.**
    **(1) The baseline is a FIXTURE, not a scratchpad.** Amendment 1's
    regression bound is only honest if the baseline is measurable inside
    `sc2.mjs` at any time on any machine, forever — a number measured once in a
    discarded scenario cannot anchor a bound. **The 20-page baseline scenario
    lands in `sc2.mjs` as a first-class fixture IN THE TICKET'S FIRST COMMIT,
    before the pagination work**, and survives as a permanent part of the check,
    carrying Amendment 1's correctness gate with it (keystrokes asserted landed,
    focus asserted held, before any figure is believed).
    **(2) Assert the MECHANISM, not the symptom.** A timing figure that happens
    to pass proves nothing about WHY — a fast machine, a lucky run, or an
    unrelated change all produce a green number over a broken mechanism. So
    `sc2.mjs` asserts the prop stabilisation **directly and BY IDENTITY**: one
    **frozen style object per element type**, the SAME object identity for two
    elements of the same type (not two equal objects); and `onActivate` **not a
    per-index arrow closure** — stable identity across renders of the same
    element. **The 2× timing bound stays as well, in addition and not instead:**
    identity proves the mechanism is in place, the bound proves it is
    sufficient, and neither substitutes for the other. **The principle, stated
    for reuse: _a timing figure can pass for the wrong reason; identity is
    checkable_** — the same discipline as the house's rendered-geometry floor,
    asserting the structure that makes the behavior true rather than only the
    behavior's observable trace.
    *Record note: Amendment 2's own "Standing" section still reads the elevation
    as pending — it was authored before Nick's ruling above and is committed
    VERBATIM regardless, unedited. The ledger carries the later word; the
    document is left exactly as Fable wrote it.*
    **SC2 BUILD ORDER (ruled):** the baseline fixture first (Amendment 2), then
    S1 the line ledger → S2 the sheet sequence → S3 the break rules → S4 page
    numbers under R1 → S5 caret + memoization → S6 `sc2.mjs` and the park
    cycles, parks travelling in the SAME commits as the changes that falsify
    them, originals verbatim, generations nested, retirements marked RETIRED in
    words. **The two things most worth getting exactly right: the 54-line body
    (not 55) and viewport invariance — a page count that moves with the window
    is a clock that lies.** **SC2 does NOT branch until SC1's merge is visible
    on `origin/main`** (chat 1's lane, in flight at the time of writing); the SC
    lane fetches until it sees it, then branches off `main` at that SHA in its
    own worktree. **Lane boundary restated:** the screenplay surface,
    `scriptKeys.ts`, `scriptMetrics.ts`, `sc*.mjs`. Prose, Journal, the Tutor's
    rails (A12–A15, constitutional) and any schema are OUTSIDE it — a task that
    reaches there stops and says so.
    **THE SC DEPLOY RULE IS AMENDED — governs every earlier statement of it in
    this item.** Several statements above (and chat 1's own merge record) read
    the rule as absolute: SC's deploy "never folded into another arc's batch."
    They were correct as written and stand as written; this amendment governs
    from here. **Each stale site now carries a cross-reference annotation**
    — *(superseded 2026-07-25 — see amendment below)* — the third lawful mode
    ratified in the CD4 review: no assertion touched, no record mutated, and a
    future session reading top-down can no longer hit the absolute rule first
    and enforce a superseded one. **THE GENERAL FORM, ON THE RECORD (Fable,
    2026-07-25): the immutability discipline extends to LEDGER PROSE —
    corrections APPEND and ANNOTATE; they never rewrite.** Rewriting a ledger
    entry makes the ledger lie about its own history, the same failure as the E1
    phantom fix, and the house already ruled on it when item 51's false claim
    was left standing beside its correction. In Fable's words: *"Amended 2026-07-25 (Fable, the P1 wave): SC
    content may ride a shared deploy provided the manifest enumerates both arcs'
    contents by name. The rule was always about manifest clarity, never about
    separate deploy runs. Superseded: 'never folded into another arc's batch.'"*
    **Nothing retroactive changes** — the P0 deploy (`c13182b` / railway
    `cf99e5a8`) carried no SC ticket, which remains correct. The deploy word
    itself is still Nick's, and the manifest must still name everything.
    **ANNOTATION OWNERSHIP, and a count corrected.** Fable's ruling assigned the
    SC lane "its own three" stale sites. On enumeration the lane found **TWO**
    that state the superseded absolute — the two annotated above — and has
    annotated exactly those. The candidates for a third, examined and judged NOT
    superseded rather than silently skipped: R6's "SC earns its own deploy word
    separately" (about earning a WORD, which the amendment expressly preserves —
    "the deploy word itself is still Nick's") and the SC1-BRIEFED line's "deploy
    is Nick's separate word" (same, and it never stated the absolute). Neither is
    falsified by the amendment, so annotating them would misrecord them as stale.
    **One site remains unannotated and is NOT this lane's to touch: chat 1's own
    SC1 merge record** ("deploy HELD — SC's own separate word on SC's own
    manifest, never folded into a wave"). **Flagged to chat 1 to annotate in its
    own hand** — reaching into another lane's record to correct it would be the
    very rewrite this discipline forbids.
    **CORRECTED BY APPEND, 2026-07-25 (Fable), and NOT by editing the paragraph
    above** — the discipline binds this lane's own records too. The method was
    right and the scope was too coarse. **R6's entry carries a RESIDUE**: the
    *earning* of a deploy word survives exactly as written, but **"separately"
    is the single token the amendment moved**, since one word may now cover both
    arcs when the manifest names their contents. R6 is therefore annotated with
    a SCOPED note naming that one word, rather than being marked stale entire or
    left bare. The SC1-BRIEFED line's "deploy is Nick's separate word" stands
    unannotated — it carries no residue, only the earning. **THE GENERAL FORM,
    ON THE RECORD: annotate the RESIDUE, not the entry.** An entry is rarely
    wholly superseded; marking it so discards the true part, and leaving it bare
    because it is mostly true keeps the false part enforceable. The annotation
    names exactly what moved.
    **PB1 — the lane is WIDENED, for PB1 only.** Fable's word of 2026-07-25: the
    SC lane gains PB1's named files on the page/board birth path **for the
    duration of PB1**, and **the widening EXPIRES when PB1 merges**. Everything
    else in the standing boundary holds untouched — the prose surface, the
    Journal, the Tutor's rails (A12–A15, constitutional) and any schema remain
    outside it. **To be recorded in PB1's own S0 so the boundary reads as
    GRANTED, not eroded.** Also of record: **"chat 4" and "the SC lane" are one
    lane under two labels** (Fable's chat-number habit vs. the seed's name) — an
    assignment addressed either way is this lane's, and a third party ever
    answering to the same label is to be flagged, not assumed.
    **`p1-wave.md` belongs to chat 1 — the SC lane stood down.** It is the
    records lane and cannot open its own two ledger items (68, 69) without the
    brief on disk, so the document lands there by necessity rather than by
    claim. Recorded because the SC lane deliberately did NOT commit it despite
    depending on it for PB1: an unowned document three lanes depend on is not
    one lane's to claim. Nick holds the authored artifact and Fable can reissue
    it, so the exposure was versioning delay, never loss.
    **SC2 S1 BUILT — 2026-07-25, `1a759c4` on `sc2-the-clock`** (branched off
    `main` at `3e83f4c`, SC1's merge). The line ledger
    (`src/store/scriptLedger.ts`, new) is pure and synchronous — no DOM, no
    font, no measurement — consuming DECLARED constants from `scriptMetrics.ts`
    rather than runtime `ch` units, which resolve against whatever font is
    loaded and compute against a fallback advance if taken before Courier Prime
    arrives. It returns a STRUCTURE per element (`{id, t, lines, spaceBefore,
    mayBreak}`), never a scalar: a total paginates naively, and refusing an
    orphaned scene heading, keeping a cue with its dialogue, and SC2.1's
    `(MORE)`/`(CONT'D)` all need element identity. **`spaceBefore` is reported
    for EVERY element including the first** — it is a property of the TYPE, not
    of position — and "the first element of a page contributes zero" belongs to
    the CONSUMER (CSS at document start, S2's paginator at every page top);
    baking it in would make the same element ledger differently depending on
    where a break landed, a circularity a paginator cannot resolve.
    **TWO DORMANT CONSTANTS WERE WRONG.** (1) `PAGE_LINES` shipped as **55** —
    the folklore — declared "so both S1 and S2 read the same constants from day
    one (no re-derivation, no drift)" and never referenced. Now DERIVED
    (66−6−6 = 54) with the original quoted verbatim above it. The trade's 55 is
    a rule of thumb whose variance is bottom margins that differ in practice.
    *Consequence recorded, not acted on: a 120-page script counts ~2 pages
    shorter than folklore-55 software; if trade-parity ever matters at export it
    is a bottom-margin question, not a line-count one.* (2) **`SPACE_BEFORE` was
    dormant and the render had NO vertical rhythm at all** — every element
    flush against the next. Activated in the SAME commit as the ledger that
    counts it (a ledger counting spacing the render does not apply is the exact
    divergence the amendments exist to prevent), in LINE UNITS
    (`calc(var(--script-line) * N)`), never px or em that could drift off the
    12pt box. **Not a taste call awaiting Nick's eye: inter-element spacing is
    the format, and a screenplay without it is incorrect on its face.**
    **PARK CYCLE (A4, same commit): `sc1.mjs` S3 "the page never scrolls
    itself"** — superseded on its NUMBER, not its law. Root-caused before
    anything was written: not the typewriter (`dataTypewriter` still 'false',
    `capPaddingTop` still 0) but `ActiveScriptElement`'s `node.focus()`, which
    scrolls a below-the-fold element into view; every Enter mounts and focuses a
    new one. Unchanged behaviour — the assertion was only ever true because the
    page was pathologically short, and real rhythm makes a document ~1.54×
    taller. Original verbatim; successor asserts the surviving law plus the new
    truth (the box holds still while the caret is visible, moving only to keep
    it so). **THE DEEPER FINDING, charged to S2 rather than patched: the script
    page's vertical behaviour is EMERGENT, not designed** — the scroll is a side
    effect of `focus()`, which nobody ever decided, and that is why it broke on
    a change that had nothing to do with scrolling. **S2's paginator owns the
    page's vertical policy deliberately** (`preventScroll` plus a stated
    caret-visibility rule, which it needs for page breaks regardless).
    **SITTING QUESTION FOR NICK — awaiting his word, not yet asked at a
    sitting:** *does the caret sitting flush at the bottom edge want breathing
    room?* Fable folds it into the sitting agenda at the next revision.
    **It is recorded HERE and deliberately NOT appended to
    `sc-defect-verdicts.md`. GENERAL FORM, ON THE RECORD (Fable, 2026-07-25):
    questions for a person live BESIDE their record, never inside it.** That
    file is a record of Nick's own words; appending a question he never asked
    would make it a mixed artifact, and a record of someone's words admits only
    their words.
    **A LAW FROM THE SELF-CAUGHT BUGS (Fable, 2026-07-25): A CHECK THAT CANNOT
    FAIL IS NOT A CHECK.** SC2 S1's first park successor asserted that the
    content "fits" before overflow — but SC1 made the sheet a true 1056px page
    inside a shorter cap, so it NEVER fits and `scrollHeight > clientHeight` is
    true from the first frame: a constant wearing an assertion's clothes. Same
    family as FX11's precondition guard and SC2's own keydown-vs-input
    instrument assert. Rewritten to measure caret visibility, which is the real
    distinction, **with the error recorded in the file rather than quietly
    fixed** — the discipline binding its own work. **Smaller sibling: a flag
    adds a code path, so exercise BOTH sides of it** — `sc2.mjs`'s new
    `SC2_TIMING` fast path (`RUNS=1`) crashed on `sorted[1]` because only the
    default had ever been run.
    **SUITE CITIZENSHIP:** `sc2.mjs` starved `fx1.mjs` in a batch (fx1 timed out
    at 480s after it, passes cleanly alone — the known leak/contention class,
    **exonerated, not a hang**). The file now splits: correctness gates and
    geometry assertions run ALWAYS and fast; the three-run timing measurement
    runs only under `SC2_TIMING=1`, with DF1's inter-pass cleanup applied WITHIN
    the median loop. **Fixtures are pinned by ELEMENT COUNT, not page count** — a
    controlled experiment holds its INPUT constant, and page count is an OUTPUT
    of the code under test (S1's rhythm took the same 928 elements from 20 pages
    to 30; pinning to pages would have had the baseline measure 928 elements
    while the tip measured ~600, reporting a ~35% "improvement" caused entirely
    by handing the tip less work). The control is pinned the same way or its
    denominator drifts identically. **FULL HISTORIC SUITE IS OWED BEFORE S2** —
    S1 changed rendered geometry for every screenplay element, so the blast
    radius is any file that mounts a script page or asserts its geometry;
    `tu2` is the one known flake by the rescission, everything else red is real,
    and isolation re-run is NOT available as a first move.
    **SUITE RUN COMPLETE — 2026-07-25, on `1a759c4`, both settings, read to
    completion in the main loop: 44/44 files, 1808 VERIFY unset; 139 PARKED +
    1910 VERIFY = 2049 at `=1`; ZERO assertion failures**, asserted against the
    raw JSON rather than verdict lines. `--headless` swept before pass 1 (4
    orphans), between passes, and mid-run. `tsc` ×2 EXIT 0; `build:web` clean.
    **The parked total held at 139, unchanged from the pre-S1 runs** — the quiet
    census proof that every existing cycle still fires against the new geometry
    and that S1's park REPLACED its predecessor rather than piling on.
    `sc2.mjs` ran in 9 seconds under the new split (the timing path took
    minutes), and `fx1.mjs` ran clean directly after it in both passes — the
    citizenship fix works.
    **`j5.mjs`'s CLEARED VERDICT IS RESCINDED (Fable, 2026-07-25)**, the same law
    as `tu2`'s: a clearance that reds on first contact was not proportioned to
    the thing it cleared. It threw once in batch 4 (`Cannot read properties of
    null (reading 'click')` at `j5.mjs:401`, querying `[data-page-id]` after
    `app.click('Select')` on the Journal spread). **DF1.1 (item 66) inherits it
    as a FIX WITH A NAMED ROOT, not an investigation: there is no `waitFor`
    between the Select click and the query — a missing synchronization point,
    the same species as `fx5`'s wall-clock sampler.** SC2 did not cause it, shown
    by blast radius rather than by re-running: `scriptLedger.ts` is imported by
    nothing (dead until S2 consumes it), `PAGE_LINES` is unreferenced, and every
    CSS selector S1 adds is `.script-*` scoped. **STANDING INSTRUCTION TO EVERY
    LANE: the next lane that sees `j5` red REPORTS IT AND DOES NOT RE-RUN.**
    Three data points do not get to wave away a fourth; if it reds in another
    lane's tree the honest reading is an order-dependent bug in that fixture.
    **THE RE-RUN STANDARD, RATIFIED AS THE SUCCESSOR TO THE RETIRED CRUTCH
    (Fable, 2026-07-25).** DF1 killed "passes in isolation" without naming what
    replaces it. The replacement: **re-run under the conditions that PRODUCED
    the failure, not away from them.** Isolation proves a file can pass alone,
    which was never the question; **batch-then-batch-again** is the claim that
    matters, and it is now the house form for any red that survives a mechanism
    check. The mechanism check comes FIRST — walk the blast radius, then reach
    for the runner. And the bound is stated plainly or the report becomes a
    reassurance: *this lane showed S1 did not cause it; it did NOT show what
    did.*
    **Fable RATIFIED chat 6's annotation of the isolation-re-run law (2026-07-30) — no
    revert.** Recorded with the P2b stamp; chat 6's annotation stands as written.
    **CANON ANCHORS CARRIED INTO SC2 S2 (Fable, 2026-07-25), recorded before the
    build so they cannot be discovered late.** (1) **THE SHEET SEQUENCE IS
    DERIVED, NEVER STORED.** Pages are a PROJECTION of the ledger, recomputed —
    the same constitutional law that makes decks data and modes projections.
    Store a page array and the first edit above it makes every subsequent page a
    lie. Nothing about pagination enters the doc, the store, or the server.
    (2) **THE BREAK RULES ARE DECLARATIVE** — a table keyed by element type
    (never orphan a scene heading; keep a character cue with its first line;
    dialogue splits with `(MORE)`/`(CONT'D)` at SC2.1) rather than imperative
    branching, so each rule is assertable on its own and a future ruling changes
    ONE ROW instead of a control-flow graph.
    **SC2 S2a + S2a.1 BUILT — 2026-07-25, `447dd8d` and `a2706d3` on
    `sc2-the-clock`** (folded into the ledger here by chat 7; S2a's own record
    was carried by the handoff dossier `docs/wrizo-alpha/sc2b-finish-map.md` at
    `37983d2` and had not reached this file — recorded so the gap does not
    survive as one). The paginator (`src/store/scriptPaginate.ts`, new) is pure,
    synchronous and viewport-free: a ledger in, pages out, no DOM and no width
    ever an input, which is what makes viewport invariance PROVABLE rather than
    observed. Break rules landed as the ruled TABLE, not branching. **S2a.1
    ruled `paren`** — a parenthetical is a MODIFIER on the line beneath it and
    stranded at a page foot modifies nothing — and **DEFERRED `transition` WITH
    ITS REASON stated in the row itself**: `keepWithPrevious` is the only rule
    that reaches BACKWARD, mixing directions in one fix-up pass is where
    oscillation lives, and `paginate()` runs on every keystroke, so an
    oscillation is a frozen editor and not a wrong page count. Recorded as owed,
    not decided against. Thirteen properties green at `a2706d3` — **in a SCRATCH
    harness, which by Amendment 2's own principle is a pre-commit gate and NOT
    coverage**, since `scriptPaginate.ts` was imported by nothing.
    **SC2 S2b BUILT — 2026-07-25, `f1bcc21` on `sc2-the-clock`, pushed (chat 7,
    the SC lane's successor).** The render: the surface stops being one sheet
    that grows and becomes a SEQUENCE of true 11in pages. `.script-sheet` height
    is exact now (was `min-height`) — a sheet that can grow is a sheet whose
    height is a function of what landed on it, and then page 12 is not a page.
    The elements array stays the edit model; pages are a projection and nothing
    about pagination enters state, the doc, the store or the server.
    **THE THIRTEEN PROPERTIES ARE COVERAGE NOW** — the render imports the
    modules, so all thirteen are permanent `sc2.mjs` assertions against RENDERED
    geometry, each on a fixture engineered to trip it. Strictly stricter than the
    scratch forms, which read the pure function's return value: a property that
    held in the function and failed in the render used to be invisible.
    **THE TRANSITION ROW LANDED WITH ITS TERMINATION PROOF, not a cap.** The
    resolution to the two-directions problem is that the rule is EXPRESSED AS THE
    SAME FORWARD MOVE — a transition at a page top is repaired by pushing the
    previous page's tail forward to join it, never by pulling the transition
    back — so both rule families reduce to one action and the pass is
    single-directional. Termination is proved: Φ (the sum of every part's page
    index) strictly increases on every move, so no state can recur; `p` only
    increases and the inner loop removes one part from page `p` per iteration, so
    at most 2N moves for N parts. **There is no retry limit anywhere — a cap is
    how an unproven loop hides.** The harness demonstrates it on the fixture that
    trips both rules at once (a page ending on a scene heading whose next page
    opens on a transition), and the bound is stated: a non-terminating pass never
    mounts, so reaching the assertion is the observable half; the general
    argument is the monotonicity proof, not the check.
    **THE VERTICAL POLICY IS OWNED** (S1's charge, discharged).
    `focus({ preventScroll: true })` plus a rule written down as a rule in three
    clauses — focus never scrolls; the box moves only to keep the caret visible
    and only by the minimum; no animation, no fraction, no home. Measured off the
    CARET, not the element, because an action block can be taller than the whole
    visible band. **Nick's sitting question (does a caret flush at the bottom
    edge want breathing room?) is left at exactly zero rather than answered in
    code** — inventing a number would make it look ruled.
    **FOUR RENDERED CROSS-CHECKS AT FIVE LEGS** (1100 / 1280 / 2200 / 1280·Flux /
    1000 legacy): rendered sheet count against page arithmetic **derived
    independently in the harness and never read from the module** — if the module
    and the render agreed on something wrong, that is what catches it; a
    mid-document element's rendered sheet index against `floor(i/27)`; the
    inter-sheet gap proven CHROME (no element in it, no rect straddling a sheet
    boundary); page N's first line at page one's own offset. **The gap is
    expressed in `rem`** — never the sheet's `em`, which is the PAGE's unit and
    would scale the desk as though it were paper, and never a multiple of
    `--script-line`, so it can never be read as N blank lines of screenplay.
    **THREE MECHANISMS NAMED BEFORE THEY WERE FIXED, all caught by reproducing:**
    (1) the lookups were PARTIAL and the arithmetic went NaN on them —
    `SPACE_BEFORE[t]` for an unknown type is `undefined`, NaN comparisons are all
    false, and a 928-element doc paginates to 928 pages; `BREAK_RULES[t]
    .splittable` throws outright. **Not hypothetical: `sc2.mjs`'s FROZEN S0
    baseline fixture seeds 116 elements typed `'parenthetical'`, which is not a
    member of `ScriptElType`.** That fixture CANNOT be corrected — it is the
    pre-pagination reference and a re-issue after pagination exists is no longer
    a pre-pagination baseline — so it is RECORDED and the lookups are made total
    with stated fallbacks. A script doc is jsonb from storage and other builds; an
    unknown type is a thing that happens. (2) the split **rendered correctly and
    lied about the text** — the first cut joined a split action's lines with
    newlines, visually identical under `pre-wrap`, having written 58 breaks the
    writer never typed into a 60-line block's DOM text and dropped the trailing
    spaces `pre-wrap` hangs. `sc2.mjs`'s character-for-character concatenation
    check found it on its first run; `wrapToLines` now computes break POSITIONS
    and slices the ORIGINAL, so the lines concatenate back exactly and a part is
    a genuine substring. (3) the vertical scroll, as above.
    **PARK CYCLES (A4, both in the same commit as the change that falsified
    them).** `sc1.mjs`'s **"the sheet is a US Letter page — 8.5 x 11in"** —
    PARKED **on its SUBJECT, not its truth**. "The sheet", singular, is not a
    thing this surface has any more; `pageMetrics()` reads
    `querySelector('.script-sheet')`, which from here on silently measures the
    first of N. **It would still have PASSED, which is exactly why it needed
    parking: a check that goes on passing while covering a shrinking fraction of
    what it claims is worse than one that fails, because nothing announces it.**
    Original verbatim, successors named — the sequence-shaped re-assertion in
    `sc1.mjs`'s own S1 loop, and the wider one in `sc2.mjs` at five legs on a
    multi-page document (every sheet, uniformity, gap-is-chrome, first-line
    offset), so the successor ends WIDER than the predecessor as ruled. And
    `sc2.mjs`'s own S0 **"the sheet is still SC1's true page — ONE 51em x 66em
    sheet (SC2 has not yet paginated)"** — PARKED; its condition (12pt) still
    holds, the world it names retired. **Distinguished in the same file from a
    FIXTURE RE-POINT:** S0's geo probe now counts sheets instead of dividing one
    sheet's height (a fixed height would have made "pages" read 1 forever); no
    assertion's text or condition changed for it, and both figures ride in labels
    and gate nothing.
    **BOUNDS, STATED SO THEY CANNOT BE READ AS MORE.** The active element is the
    one exception to the projection — a contenteditable cannot be cut in half, so
    an active element the paginator splits renders whole on the page where it
    begins; reachable only with the caret inside an action block longer than a
    full page (~3,200 characters), only for that element, only while the caret is
    in it (the alternative was making pagination depend on caret position, which
    would move the page count as the writer clicks). "No page exceeds 54 lines"
    holds except for an element that may not split and is itself longer than a
    page — it has nowhere to go and overflows its sheet alone; **dialogue's case
    is what SC2.1's `(MORE)`/`(CONT'D)` closes.** Byte-level determinism of the
    pure function is not observable through a DOM, so P11 asserts the strongest
    observable consequence — the same document producing the same sheets holding
    the same elements across a full reload.
    **S5's memoization seam is PREPARED, NOT TAKEN:** `elementStyle` is one
    FROZEN object per type at module level and activation is one delegated
    handler on the sequence reading `data-doc-index`, so neither prop identity
    changes per render — S5 is an edit, not a rewrite. **S4 (page numbers, R1) is
    untouched; nothing in S2b shows a count anywhere.**
    **VERIFICATION — `tsc` ×2 EXIT 0, `build:web` clean; `sc1.mjs` 66/66 and
    `sc2.mjs` 61/61 at BOTH `HARNESS_PARKED` settings, each with its own 1-check
    park section; FULL HISTORIC SUITE 44/44 AT BOTH SETTINGS, read to completion
    in the main loop — every file exit 0, ZERO failing check objects across all
    88 logs**, asserted against the raw JSON rather than verdict lines. `j5.mjs`
    green at both settings in this tree (reported, not re-run under any
    clearance — DF1.1 still owns its named root). **Next in this lane: S4 (page
    numbers) and S5 (the caret across the break + memoization), then PB1
    (item 71).**
    **SC2 S4 BUILT — 2026-07-25, `8192077` on `sc2-the-clock`, pushed.** R1's
    page number as document furniture: top-right, inside the top margin, **page
    one bare**, from page two on, set in the sheet's own Courier because it is
    the DOCUMENT's furniture and not the app's chrome — the one place in this
    house where a number on the page is lawful.
    **THE BRIGHT LINE IS THE HARDER HALF AND IS ASSERTED AS STRICTLY AS THE
    PRESENCE.** A presence check fails loudly the day someone breaks it; an
    aggregate is the kind of thing that gets added helpfully, in a `title`
    attribute, by someone who never read the ruling. `sc2.mjs` scans the WHOLE
    live document — every text node and every `title`/`aria-label` — for
    "page N of N", "of N pages", bare "N pages" and "N / N", **with the sliver
    and the Tutor both OPEN** (the two places the brief names), and separately
    rejects any attribute that mentions pages and carries a digit.
    **THE SCANNER WAS PROVEN FALSIFIABLE BEFORE IT WAS TRUSTED** — an absence
    check is exactly the species that passes because it is looking at nothing,
    and "a check that cannot fail is not a check" is this lane's own law. Four
    aggregates were planted into a live page and every one was caught: a
    rendered "Page 2 of 5"; a `title="5 pages today"`; an
    `aria-label="page 3 of 5"`; a bare "2 / 5" badge.
    **THE SELECTOR HAZARD THE S2b HANDOFF FLAGGED, MET AND CLOSED.** The number
    is the sheet's first child from page two on, so
    `.script-sheet > *:first-child` would have matched IT and every page but the
    first would have begun one or two blank lines lower than page one. A sibling
    arm closes it, and it is not left to inspection: page one carries no number
    and every other page does, **so the standing "page N's first line sits at
    page one's own offset" cross-check fails the instant that arm is lost — and
    that is also the proof the number costs no body line.** `user-select:none`:
    the number is not the writer's words, so a selection dragged across a page
    break hands back a screenplay and not a screenplay with page numbers loose in
    it. **Judgment call named rather than left to look ruled:** the trailing
    period. R1 ruled the position and the bare first page, not the punctuation;
    "2." is the trade's own form (Final Draft, Fade In, Highland). Vetoable.
    **SV30 — ANSWERED, and the answer is that the margin is CORRECT.** Measured
    at Nick's own sitting conditions (~2560px framed, Flux) and at 2560/plateau,
    1280 and 1100: the sheet is 816px and the left padding 144px — **17.647% of
    the paper, 1.5in EXACTLY** — with the scene heading and action both beginning
    at the text block's own left edge (0.1ch off, which is the sheet's 1px
    border). The grid behind them is the trade's: dialogue 10.1ch, parenthetical
    16.1ch, character cue 22.1ch. Identical at all four legs and both themes.
    Fable's screenshot measurement is confirmed against rendered geometry, **so
    SV30 closes with SV28** — the missing vertical rhythm, already built at
    `1a759c4` — exactly as predicted. The same measurement shows **SV29 correct
    in the render too**: character `marginTop` 1 line, dialogue 0, so the space
    sits ABOVE the cue and there is no blank line between the cue and its
    dialogue. No change, as ruled.
    **A REPORT IS NOT A CHECK**, so SV30's verification lands as a permanent leg
    rather than a paragraph: `sc1.mjs` gains **2560 × Flux, Nick's own sitting
    width**, which had never been asserted — the widest leg was 2200, and 2560 is
    the width at which he formed BOTH this verdict and SC-V2 ("the font is too
    big"). It matters structurally: `--paper-scale` is 1.2 at 2560 and 1 at 1280,
    and `.script-sheet` deliberately does not multiply by it. **That deliberate
    exclusion was a comment; it is now an assertion**, and all five S1 checks
    prove the page is identical at the scale that used to enlarge it.
    **VERIFICATION — `tsc` ×2 EXIT 0, `build:web` clean; `sc1.mjs` 71/71 (was 66)
    and `sc2.mjs` 66/66 (was 61) at BOTH settings, each with its 1-check park
    section. S4 PARKS NOTHING** — additive, and the one selector it edits follows
    a DOM shape change without retiring any check's subject. **FULL HISTORIC
    SUITE, both settings, read to completion in the main loop: 43/43 green at
    unset PLUS `j5` RED, and 43/43 green at `=1` with `j5` held out. Zero failing
    check objects in any of the 87 logs.**
    **`j5` REPORTED AND NOT RE-RUN, per the standing instruction.** It threw at
    `j5.mjs:120` — `waitFor timed out: lens row` — with a diagnostic showing
    `/journal/spread` rendered as "No loose pages yet": the seeded loose pages
    were not there. **THE ROOT IS VISIBLE IN THE DIAGNOSTIC AND IS THE SPECIES
    DF1.1 ALREADY OWNS:** `j5.mjs:114–120` writes localStorage, calls
    `app.reload()` *"so persistence.ts re-hydrates from it"*, then navigates and
    queries with **no `waitFor` on the rehydrated state**. That is a **SECOND,
    DISTINCT missing synchronization point in this file** — the one already
    charged to DF1.1 is at line 401, after `app.click('Select')`. Two sites, one
    species: useful to DF1.1 as evidence this is a fixture PATTERN and not a
    single omission. **Blast radius walked before the runner was reached for:**
    S4's diff is four files — two are harness files `j5` does not import;
    `ScriptEditor.tsx` mounts only for `pageType: 'script'`; every CSS selector
    added is scoped to `.script-sheet` / `.script-page-number`; and `j5` died on
    `/journal/spread` with no script page mounted at all. `j5` was also green at
    both settings on this same branch in the S2b run earlier the same day.
    **THE BOUND, PLAINLY: this shows S4 did not cause it; it does NOT show what
    did** — though the diagnostic names a specific missing synchronization point
    DF1.1 can act on directly. **AND THE GAP IS NAMED, NOT PAPERED OVER: `j5`'s
    `HARNESS_PARKED=1` leg is UNRUN in this tree.** It was held out deliberately
    rather than run at the other setting, because a second run coming back green
    is exactly the reassurance the rescission exists to prevent.
    **Next in this lane: S5 (the caret across the break + memoization + the
    latency gate against the frozen `c1cabe8` baseline), then PB1 (item 71).**
    **CORRECTION — 2026-07-26, on this lane's own record, appended not rewritten.
    DF1.1 FOUND THE ROOT AND IT RETIRES ONE OF THIS ENTRY'S CLEARANCES.**
    `runtime-verify.mjs:615` keys the browser profile directory on the NODE PID
    (`ws-runtime-verify-${process.pid}`); Windows recycles PIDs; `removeDir(udd)`
    in the `finally` at :638 often fails, so a killed or crashed run leaves its
    directory behind holding a `DevToolsActivePort` file naming a DEAD port. A
    later run drawing that PID launches into the stale directory and polls a port
    nothing is listening on. **It throws BEFORE any app load, so it happens on a
    completely quiet machine.** Independently corroborated in this tree the same
    day: **58 `ws-runtime-verify-*` directories were sitting in TEMP**, matching
    DF1.1's own count, and the source reads exactly as described. DF1.1 fixes it
    with a clear-before-launch.
    **WHAT THIS RETIRES: the S1 entry above exonerates SC2 as the cause of
    `fx1.mjs`'s 480s timeout on the ground that "fx1 passes cleanly alone."** That
    reasoning no longer rules the class out. **"The machine was quiet" and "it
    passes alone" were never mechanism checks — they were the absence of ONE
    alternative**, and a second alternative now exists that reproduces on a quiet
    machine. The suite-citizenship split of `sc2.mjs` behind `SC2_TIMING` stands
    on its own merits (it genuinely made the file fast in-suite), but its success
    is NOT evidence for the contention theory it was written to answer. The
    original entry is left verbatim above; this is the annotation beside it.
    **WHAT THIS DOES NOT TOUCH: no false pass is possible from that mode.** It
    fails before the app loads, so it can only produce a MISSING verdict, never a
    green one. Nothing merged out of this lane is retroactively suspect, and the
    44/44 and 43/43 suite verdicts recorded above stand — a file that hit this
    mode would have been red or absent, not falsely green.
    **AND THE `j5` RED OF 2026-07-25 IS NOT THIS CLASS — checked against the log
    rather than assumed, and flagged so DF1.1 does not close it with the
    clear-before-launch fix.** The stale-directory mode throws in `readCdpPort` /
    "CDP page target never appeared" with no app in evidence. `j5` threw
    `waitFor timed out: lens row` with a `__diag()` payload that could only exist
    on a LIVE CDP connection to a LOADED app: a served href, the full nav-button
    list, and the Journal spread rendered with "No loose pages yet". CDP was
    connected, the app was up, the surface had mounted — and the seed simply had
    not rehydrated. **Zero occurrences of the stale-directory signature appear in
    any of this lane's 87 suite logs.** The named root stands as reported:
    `j5.mjs:114–120` writes localStorage, calls `app.reload()` *"so persistence.ts
    re-hydrates from it"*, then navigates and queries with no `waitFor` on the
    rehydrated state — a second, distinct missing synchronization point from the
    one at line 401. **Two independent defects in one file; the clear-before-launch
    fix closes neither of them.**
    **SC2 S5 (part) — `b7b34f3` on branch `sc2-s5-memo`, PUSHED, VERIFICATION
    OWED, DO NOT MERGE.** `React.memo` on `StaticScriptElement` — the seam S2b
    prepared, so an edit and not a rewrite. `tsc` ×2 EXIT 0 and `build:web` clean
    is the whole of what is verifiable without a browser: it proves compilation
    and bundling and NOTHING about behaviour or speed. **No harness has run
    against it.** Pushed rather than held locally because unpushed work is the
    orphan class that has cost this project twice (E1's fix; chat 3's uncommitted
    S1/S2) — report-equals-push forbids claiming done without pushing, not
    pushing work-in-progress. The distinct branch name plus the commit's own
    `VERIFICATION OWED — DO NOT MERGE` subject are the guard; **`sc2-the-clock`
    stays at `8192077`, which remains the only SC2 branch tip fit to merge.**
    **The caret half is deliberately NOT written.** The prediction is that a page
    crossing reparents the live contenteditable (sheets are DOM parents keyed by
    page index, and React deletes-and-inserts rather than moving a node between
    parents), destroying it and re-seeding the caret from `caretHint` instead of
    from where the writer's hands were. **That is a prediction, not an
    observation**, and this arc's hardest law is reproduce before patching — four
    premises here read as obvious and were false when measured. **Fable's
    alternative, recorded to be weighed AFTER observation and not before:** if the
    remount is real, consider dissolving the class rather than patching it — one
    flat element flow with stable keys, sheets as absolutely-positioned backdrops
    at paginator-computed offsets, so a crossing changes an element's OFFSET and
    never its PARENT. The caret is then preserved structurally, and "the gap is
    chrome, never body" becomes a property of the construction rather than an
    assertion. **The trade to examine when measuring: today an element is
    contained by its sheet through DOM NESTING; under the alternative, containment
    becomes ALIGNMENT BY SHARED ARITHMETIC, which is a different fragility and
    changes what the four cross-checks are proving.**
    **QUEUE CORRECTED: PB1 is chat 5's (item 71, already opened there
    2026-07-26). The lane widening was granted to the ticket, not to this
    session. THIS LANE'S QUEUE IS S5 ALONE.** All browser work is held pending
    chat 6's all-clear on DF1.1's DoD sweeps.
    **`j5` CLOSED, AND THIS LANE'S OWN CLAIM NARROWED THE MOMENT ITS GROUND MOVED
    — 2026-07-29.** The correction above records the `j5` root as owed to DF1.1;
    it is not owed any more. Chat 6 absorbed it at **`fd57ee6`** ("DF1.1 S2b:
    absorb chat 7's third j5 species; coordinate by species, not line"), verified
    on disk rather than taken from the relay: `waitSpreadRehydrated` is defined at
    `j5.mjs:64` and applied at **both** read sites — `:179` (`lens row`, the exact
    site this lane reported) and `:305` (`lens row after drag reload`, which this
    lane never reached). That commit records `j5` PASS 37 at both `HARNESS_PARKED`
    settings with the check count unchanged and no park owed. **So "the named root
    stands as reported" and "the clear-before-launch fix closes neither of them"
    are both superseded: the first root is fixed, and the second site was fixed
    alongside it.** What survives intact is the narrower claim that mattered —
    the `j5` red was a DISTINCT species from the stale-profile-directory class,
    which is why it needed its own fix and got one.
    **ONE PRECISION FOR ANY LANE ABOUT TO RUN A SUITE: `fd57ee6` is on
    `df1-1-rider`, NOT on `main`** (checked: `origin/main`'s `j5.mjs` contains
    zero occurrences of `waitSpreadRehydrated`). Until that rider merges, a lane
    running the historic suite off a `main`-parented tree still meets the
    unfixed fixture and can still see this red. Stated so nobody reads "closed"
    as "closed in my tree."
    **A BINDING CONDITION ON THE FLAT-FLOW ALTERNATIVE (Fable, 2026-07-29),
    recorded BEFORE any build so it cannot be discovered late.** If the sheets
    ever become absolutely-positioned backdrops with one flat element flow,
    **cross-check 3 does not weaken into an alignment check.** It is REPLACED by
    one with equal or better teeth — **rendered containment measured against the
    backdrop rect** — per the parks-end-wider law. That is the whole hinge of the
    trade: today containment is a consequence of DOM nesting and the check merely
    confirms it; under the alternative containment becomes a claim the arithmetic
    makes, and the check has to carry the weight the nesting used to. A successor
    that only proved "the content lines up with the backdrop" would be strictly
    weaker than the predecessor that proved "no element can leave its sheet,"
    and coverage would erode quietly at exactly the moment it was most needed.
    **The alternative stays research until the remount is OBSERVED**; this
    condition binds it if it is ever adopted.
    **SC2 — chat 7 STOPPED CLEAN (2026-07-30; context spent; endorsed** — a suite you
    cannot finish reading is not a verification; tree clean, both branches pushed, owed
    work named). State: `sc2-the-clock` @ `fc92ac1` proven; `sc2-s5-memo` @ `5e2eaa7`
    rebased (`--force-with-lease` after the ruled rebase, disclosed, lawful), both gates
    recorded — Amendment 1's bound 1.10× ≤ 2.0 MET with margin (noise-band framing
    ratified: direction robust, point estimate not claimed); the memo 0.84×, faster 3/3
    rounds, −21% mean — ADMITTED to the merge candidate CONDITIONAL on the suite of record.
    **Successor owes:** rebase onto current `origin/main`, ONE suite of record at the
    surviving head both settings; if red, revert the memo half first. Then the merge offer;
    Fable's review closes 62.
    **SC2 — SUCCESSOR'S OWED WORK DISCHARGED; NOTHING ATTRIBUTED TO SC2; THE BRANCH
    PARKS OFFER-READY (2026-07-31, chat SC2-successor).** The rebase, the suite of
    record, and the attribution are all done; the merge offer is NOT made, because the
    head does not have its own full green and — ruled by Fable this session — **the head
    merges only on its own full green, deadline notwithstanding.** The blocker is main's,
    not SC2's.
    **THE REBASE.** `sc2-s5-memo` rebased onto `origin/main` @ `a0ec245`, **11/11 commits
    replayed, ZERO conflicts**, `--empty=keep` so the empty gate-commit survived as itself.
    Fidelity was checked rather than assumed: **6 of the 7 files are byte-identical BLOBS
    pre→post**; `index.css` is the only file both sides touched (main +263, SC2 +119) and
    its SC2 delta was diffed pre vs post and is UNCHANGED — git interleaved them without a
    conflict AND without a silent loss. `tsc` ×2 EXIT 0; `build:web` clean. Head offered
    for merge when main allows: **`9503515`** (= 11 replayed + one empty `WIP — DO NOT
    MERGE` marker carrying the gate while the suite ran; `a0ec245..9503515` is **12**
    commits, and that arithmetic is owned, not assumed).
    **THE SHA MAP.** The rebase rewrote SHAs that frozen commit bodies cite. **No commit
    message was edited** — originals verbatim, successor pointer alongside:
    `57bc9f9`→`4884dc6` (S0) · `439d933`→`75581d6` (S0 re-issue) · **`c1cabe8`→`c8bb07f`
    (S0 re-issue 2 — THE FROZEN BASELINE the latency gate names)** · `1a759c4`→`660e842`
    (S1) · `447dd8d`→`9b177be` (S2a) · `a2706d3`→`b5101cc` (S2a.1) · `f1bcc21`→`3935dc2`
    (S2b) · `8192077`→`1d61324` (S4) · **`fc92ac1`→`d52fbb5` (S5 caret — the separable
    pre-memo head)** · `b8a6da5`→`eba7e27` (the memo half, 32+/3−, `ScriptEditor.tsx`
    only) · `5e2eaa7`→`17edc10` (the gate record, still empty).
    **THE ARCHIVE REF — `origin/sc2-prerebase-archive` @ `5e2eaa7`, ARCHIVE CLASS, NEVER
    MERGED.** Pushed on Fable's order BEFORE any cleanup, because `17edc10` cites the
    frozen baseline **by SHA** and local refs are one deleted worktree from unreachable.
    Verified, not assumed: `git merge-base --is-ancestor c1cabe8 <archive>` → TRUE. **The
    gate's evidence is resolvable on the trail, not on one machine.**
    **THE TIMING GATE — NOT RE-RUN, RULED (Fable, 2026-07-31).** `sc2.mjs`'s three-run
    interleaved measurement is behind `SC2_TIMING=1` and the suite does not set it — that
    is Fable's own SUITE CITIZENSHIP ruling of 2026-07-25 (the measurement holds a browser
    for minutes and starved `fx1` into a 480s timeout), not an omission. Reasoning on the
    record: the measured surface is byte-identical across the rebase, and the main delta
    beneath it is off the script keystroke path (PB1 never touched `ScriptEditor`;
    FX17/BG2/FX16 do not mount on a script surface; DF1.1 is zero product src). **The
    claim's lawful shape: a green suite proves correctness, viewport-invariance and
    Amendment 2's IDENTITY assertions — NEVER that the timing re-ran.** The `17edc10`
    figures (1.10× ≤ 2.0; the memo 0.84×) stand as the gate of record, at the pre-rebase
    SHAs, preserved on the archive ref.
    **STANDING CONDITION ON THIS ITEM'S CLOSE-OUT (Fable, 2026-07-31):** **any future src
    change touching the script keystroke path — `ScriptEditor`, the paginator, the ledger
    — RE-RUNS the interleaved gate before ITS merge word.** (Its sibling condition rides
    item 76's DoD.)
    **THE SUITE OF RECORD — RED, and the red is not SC2's.** Head `9503515`, committed
    runner `scripts/run-suite.mjs`, glob **53** (main's 52 + `sc2.mjs`; the branch adds
    exactly one file and removes none), both settings serially, every verdict read to
    completion, asserted against the raw JSON. **51/53 unset · 51/53 parked; NOT CLEAN
    both.** Reds: `j4` + `j5` NOVERDICT (unset); `b2-1` NOVERDICT + `fx6` FAIL 1/37
    (parked). **SC2's own instruments are GREEN: `sc2.mjs` 72/72 BOTH settings (the same
    figure `fc92ac1` recorded pre-rebase, unchanged at the new head), `sc1.mjs` clean both
    settings with SC2's park cycles still firing against FX14's rewritten files — zero
    `pass:false` in the raw JSON of any of the four files.** SC1's inherited merge-order
    obligation is thereby satisfied at the rebased head.
    **ATTRIBUTION — BY EXPERIMENT, NOT BY LANE-BOUNDARY ARGUMENT.** The memo-revert
    instrument was resequenced behind the control and the resequencing was disclosed
    before it was done, on this reasoning: **three of the four reds flip between PASS and
    FAIL on an UNCHANGED tree**, so the tree is not the variable and no code-level revert
    can explain them. `j5` at unset was the only deterministic red (failed in-suite AND
    isolated). Control run: clean `origin/main`, **zero SC2 in the tree** (`sc2.mjs`
    absent, confirmed), identical isolation protocol → **7 of 8 cells match**, and **`j5`
    fails identically on clean main** — same `waitFor timed out: lens row`, same "No loose
    pages yet" empty state, same `j5.mjs:178`. Then the definitive control, **FULL suite
    both settings on clean main: 51/52 unset (`j5` NOVERDICT) · 51/52 parked (`th2` FAIL
    2/42) — NOT CLEAN BOTH.** **Clean main is red on the eve of the freeze; nothing is
    attributed to SC2.** Opened as **item 82**.
    **A CONTROL-VALIDITY NOTE, since `origin/main` moved mid-session** (to `9b30273`, when
    another lane's fetch advanced the shared remote-tracking ref): `a0ec245..9b30273` is
    **byte-identical under `apps/`** — records-only, 10 docs files, +262 — so the control
    tree is product-identical to the branch's parent and the control stands. **No
    re-rebase is owed**; re-rebasing would rewrite eleven SHAs a second time for zero
    product change, churning the SHA map and the archive-ref story for nothing.
    **THE LANE HOLDS.** SC2's work is done and proven; the branch parks offer-ready at
    `9503515` until main's suite can go green under it. Fable's review still closes 62.
    **FOURTH SUITE OF RECORD — 2026-07-31, ORDERED BY FABLE UNDER A PROVENANCE DISCIPLINE;
    STILL NO MERGE OFFER.** Result: **53/53 CLEAN at `HARNESS_PARKED` unset (exit 0) —
    the first fully green pass this head has produced — and 52/53 at `=1`, `m4.mjs` FAIL
    1/42.** Not green at both settings, so the gate (the head merges only on its own full
    green) holds and the offer stays unmade. `sc2.mjs` **72/72 both settings** for the
    fourth consecutive run; `sc1.mjs` 71 + 71.
    **THE PROVENANCE DISCIPLINE EARNED ITS PLACE IMMEDIATELY, and the defect it caught was
    THIS LANE'S OWN.** The order was: rebuild `dist-web` IN the worktree, record the served
    asset hash, and grep an SC2-only symbol to prove WHICH APP was tested. On the first
    check the worktree's `dist-web` was **main's bundle** (`index-CubIOguU.js`, zero
    occurrences of `paginate`) sitting under SC2's source — because the control runs
    restored the git branch but never rebuilt, so the restore step should have been
    `checkout && rebuild`, not `checkout` alone. **No reported result was corrupted** (the
    fresh build reproduced `index-DSrJF9Jz.js`, byte-identical to the hash built before the
    original suite of record, which retroactively proves that run tested the right app) —
    but the next run in that worktree would have silently measured main and called it SC2.
    Same class as `17edc10`'s `withHarness` `opts.dist` finding: **a build swap that yields
    plausible numbers against the wrong tree.** Provenance of record for this head:
    **`assets/index-DSrJF9Jz.js` + `assets/index-62lZ1TCK.css`, with `script-sequence` and
    `script-page-number` (both absent from `main`'s src entirely) present in BOTH bundles.**
    **THREE ATTEMPTS WERE NEEDED, AND THE TWO FAILURES WERE NOT REDS.** Attempts 1 and 2
    came back **VOID** — foreign harness browsers appeared mid-run (owners `42772`, then
    `25268`; the latter traced to chat 6's item-77(c) verification via its own scratchpad
    path), so `run-suite.mjs` aborted rather than hand back a half-clean sweep, and the
    parked pass REFUSED to start (exit 2). **Nothing foreign was killed** — provenance said
    the browsers were not this runner's, and a by-name `--headless` sweep is the standing
    law's named violation. `--ignore-foreign` was NOT used: it produces numbers stamped
    CONTAMINATED, and a merge offer resting on one is worse than no offer. Attempt 3 ran in
    a **coordinated** window (Fable held the other lanes) — the difference between a raced
    window and a coordinated one is the whole result.
    **A CORRECTION THIS RUN FORCED, recorded at item 82:** the clean unset pass falsified
    this lane's earlier "j5 is the deterministic red" claim — `j5` and `j4` both PASS at
    unset here. Item 82 is one family of races, not a deterministic spine plus a family.
    **SIXTH SUITE OF RECORD — GREEN AT BOTH SETTINGS. THE GATE IS MET AND THE MERGE OFFER
    IS MADE — 2026-08-17 (SC-chain lane).** Head **`eb74835`**, `sc2-s5-memo` rebased onto
    `main` @ `8385ffd`.
    **→ ITEM 62 MERGED `32376b9` — AWAITING FABLE'S REVIEW (2026-08-17, chat 1, on Fable's
    merge order).** The `eb74835` DO-NOT-MERGE marker honored-through per 77(c): all commits
    from the marker up are records-only (apps/=0), and the merged `apps/` tree is
    byte-identical to the stamped tip `ecd37bf` — so the stamp carries (56/56 both settings,
    bundle `index-GZdjfpTW.js`). Zero schema; `tsc` ×2 EXIT 0. **NO DEPLOY** — P2c holds for
    Nick's word behind Fable's review; production stays git `fbdb27e` · railway `0fdc8f94`.
    **→ REVIEWED, GREEN — ITEM 62 CLOSED (Fable, 2026-08-17)** —
    `docs/wrizo-alpha/sc2-review-fable.md`; VERDICT PASS (7 files, +2403/−55, zero
    schema/server). The caret fix's mechanism was OBSERVED not predicted (a break-crossing is
    a DOM delete+insert; the fix spends a remembered live offset ONLY on a same-session remount,
    genuine activations fall through unchanged); the paginator is a stored-nowhere projection,
    viewport-invariant by construction, with `applyBreakRules` carrying a termination proof
    ("an oscillation is not a wrong page count, it is a frozen editor"). Three non-blocking OBS,
    all self-flagged or boundary-grade: the page-number trailing period (Nick's one word), the
    caret bottom-edge breathing room (= Part 3 item 6 of Nick's sitting agenda), and the
    54-line-action split (noted for SC2.1). **The SC arc's remaining obligations live in item 76
    (dissolution + bound re-derivation) and the two standing conditions on the keystroke path**
    — item 62 itself is CLOSED. The memo's effect stays verification-owed under Amendment 1.
    **→ OBS PAIR CLOSED — Section A rulings (Nick, live, 2026-08-17):** **R-PERIOD** — the
    page-number's **trailing period STAYS** ("2."), Nick deferring to the trade standard the code
    already implements (OBS: page-number period → KEEP, no change). **R-BREATHING** — the caret's
    **flush at the band's bottom edge STANDS, zero breathing room, RATIFIED as-is** (OBS: caret
    bottom-edge breathing room / sitting-agenda Part 3 item 6 → zero, no change). Both are now
    ruled and the code already implements each, so neither owes a patch. The third OBS (the
    54-line-action split) stays noted for SC2.1.
    **VERIFICATION (stamped, per 77(c)): DEFAULT `SUITE RESULT: CLEAN — tree=eb74835
    bundle=index-GZdjfpTW.js/530759b` and PARKED `SUITE RESULT: CLEAN — tree=eb74835
    bundle=index-GZdjfpTW.js/530759b`, 56/56 each** (main's 55 + `sc2.mjs`), identical tree
    AND bundle across halves, zero FAIL/TIMEOUT/NOVERDICT, no contamination line, committed
    runner, rebuilt immediately before running, no `--ignore-foreign`, box verified quiet at
    start. **`sc2.mjs` 72/72 and `sc1.mjs` 71/71 at BOTH settings** — SC2's own instruments
    green for the fifth consecutive suite, and SC1's inherited merge-order obligation
    satisfied at the new head.
    **WHAT UNBLOCKED IT WAS ITEM 82 FIX (b), AND THE CHAIN IS WORTH NAMING.** The fifth
    suite failed the gate on ONE red — `j5` NOVERDICT, parked — which fix (b) has since
    root-caused and removed at the source (`j5` seeds through the app's seam; merged
    `e9ea36c`). This rebase pulls that fix underneath SC2, and **the whole of item 82's
    family is green here at both settings: `j5` 37, `j4` 24, `b2-1` 28, `fx6` 37, `th2` 42,
    `m4` 43.** That is an observation about this head, not a closure of item 82 — `j4`,
    `b2-1` and `fx6` remain UNATTRIBUTED and a green run is not a diagnosis.
    **→ ITEM 82 WATCH (2026-08-24):** `m3` ran GREEN on a quiet box — a **second data point** (the
    83 desk's S4). The watch records it; **NOTHING CLEARED.** A green run on a quiet box is exactly
    the evidence class that does NOT attribute the family's reds — "the machine was quiet" is a
    retired clearance argument; logged as a data point, not a diagnosis.
    **→ ITEM 82 WATCH (2026-08-31, DECK's ROAMS measurement):** the family's non-determinism is now
    MEASURED, not merely watched. `m3.mjs`'s ROAMS check — a geometric growth property seeded from a
    SINGLE `Date.now()` live seed — returned 60/61 on DECK's default suite. Investigated, NOT re-run:
    a six-runs-per-tree sampled distribution showed **clean MAIN produced the WORST outlier, not the
    branch** (main tail 137.3 vs branch max 12.1; threshold 183.3). **The flake is MAIN's, owed to the
    Rhizome desk** (drive ROAMS from a multi-seed sweep / pin `SESSION_START` behind a harness seam /
    widen the bound to the real tail) — NOT a branch red, NOT a clearance. Full record: deck-phase
    build §11.
    **THE REBASE WAS A PURE REPLAY, and fidelity was measured rather than assumed.**
    `--empty=keep` so the empty gate-commit survived as itself; **12/12 commits replayed,
    ZERO conflicts; all SEVEN touched files byte-identical BLOBS pre→post.** The previous
    rebase managed 6 of 7 because `index.css` was touched by both sides and had to
    interleave; **main has not touched `index.css` since `6ec5a85`, so this time nothing
    interleaved at all** — the stronger result, and it is stated with its reason so it is
    not mistaken for extra care.
    **THE SHA MAP (originals verbatim; no commit message was edited):** `adf7f82`→`48fa481`
    (S0) · `94f068f`→`dc36b2e` (S0 re-issue) · **`e5b99d6`→`fd6bd7f` (S0 re-issue 2 — THE
    FROZEN BASELINE the latency gate names)** · `f20e7af`→`8ef718c` (S1) ·
    `ea61f13`→`801bb29` (S2a) · `f769254`→`fd9610a` (S2a.1) · `3dee058`→`9073019` (S2b) ·
    `0dae0e1`→`22caa19` (S4) · `7c51a83`→`a609772` (S5 caret — the separable pre-memo head)
    · `8728d34`→`fc7c18e` (the memo seam) · `acb7a0c`→`db71cd3` (the gate record) ·
    `fd6713a`→`eb74835` (the WIP marker).
    **ARCHIVE REF PUSHED BEFORE THE FORCE-PUSH, on the precedent this item set:
    `origin/sc2-prerebase-archive-3` @ `fd6713a`.** The fifth suite's head is cited BY SHA
    in item 82's own records and survived nowhere else once `sc2-s5-memo` was rewritten.
    Verified rather than assumed: `merge-base --is-ancestor` TRUE for both `fd6713a` and the
    frozen-baseline commit against the archive.
    **PROVENANCE — WHICH APP WAS TESTED, and a false negative caught on the way.** Served
    bundle `index-GZdjfpTW.js` + `index-62lZ1TCK.css`, with the two SC2-only discriminators
    `script-sequence` and `script-page-number` PRESENT in the bundle, present in SC2's src
    (`ScriptEditor.tsx`, `index.css`) and **ABSENT from `origin/main`'s src entirely**. The
    first run of that check reported them absent from SC2's OWN source — a result that
    contradicted the bundle. It was chased rather than shrugged at: the `git grep` pathspec
    was relative to the wrong cwd, **which meant the NEGATIVE control was a false negative
    too** and the whole check was re-run from the repo root. A discriminator that cannot
    fail is not a control; this one was nearly published in that state.
    **THE TIMING GATE — NOT OWED, AND NOT CLAIMED AS RE-PASSED.** The standing condition
    (any src change touching the script keystroke path re-runs the interleaved gate) was
    tested by measurement and is **NOT triggered**: every keystroke-path file
    (`ScriptEditor.tsx`, `scriptPaginate`, `scriptLedger`, `scriptDoc`, `scriptText`,
    `scriptKeys`, `scriptMetrics`, `scriptAutocomplete`, `scriptSmartText`) is BYTE-UNTOUCHED
    by main since `6ec5a85`, and no hunk in the five files main did change
    (`BoardEditor`, `PlacesPanel`, `persistence`, `sync`, `unbornPage`) carries a `script`
    token on either side. **One caveat is raised rather than buried:** item 89 put
    `persistDirty()` INSIDE `flush()`, so every debounced flush now costs an extra
    `localStorage.setItem`. That is none of the three named surfaces and sits off a
    keystroke's critical path, but it is a real route for typing cost to move.
    `sc2.mjs` was therefore run under `SC2_TIMING=1` at this head anyway — **PASS 72/72 with
    `RUNS=3`; 20-page p95 3.2ms, 5-page control p95 1.3ms, scaling ratio 2.46, run-to-run
    spread 1.25× / 1.08×.** **What that does NOT establish, stated because the harness
    itself warns of it:** `sc2.mjs` RECORDS these figures and asserts only correctness gates
    (caret focused, all 240 keystrokes landed, input fired once each, all three runs
    eligible) — **it does not assert the 2× bound**, which requires a pre-SC2 baseline
    re-derived BACK TO BACK in the same session, and the file explicitly warns that gating
    against a ratio recorded in another session is invalid. So this is an observation at the
    tip, **not** a re-pass of Amendment 1's bound. The `17edc10`-era figures (1.10×; memo
    0.84×) stand as the gate of record at the archived SHAs. **And the caveat cannot be
    isolated by this instrument in any case** — the frozen baseline predates main's
    `persistDirty` change, so a comparison against it would conflate SC2's cost with main's;
    answering it properly is a main-vs-main question and belongs to whoever owns item 89's
    surface, not to SC2's merge.

63. **FX13 — the Board in the Room.** **P0 — OPENED + BUILDING, 2026-07-24
    (chat 3)**; brief `docs/wrizo-alpha/fx13-board-in-the-room-brief.md`
    (already on `main`), authority **SV2**. DF1 held at a clean commit
    (`24c6173`, branch `df1-deflake`) — P0 outranks the deflake; DF1 resumes
    after. Branch `fx13-board-in-the-room` off `main`, own worktree, guard-rail,
    ledger on `main`; **ZERO SCHEMA, ZERO SERVER FILES**; zero-schema pre-auth,
    Fable reviews post-merge, deploys batch with the P0 wave. **S1 root cause
    (named, no clamp-first):** the Board's geometry law is WIDTH-ONLY — the
    canvas content height is `(maxBottom(boxes)+0.08) x pageWidthPx` floored at
    `VIEWPORT_MIN_PX=560` (`BoardEditor.tsx:1493`), never viewport-height-aware;
    the short-screen fit today rests on `.board-canvas-wrap`'s magic
    `maxHeight: 78vh` clamp (a symptom-patch) which overflows the DeskFrame
    stage below ~700px (measured: wrap bot 605 > stage bot 574 at 1366x620) and
    leaves a 2px page overflow at 1366x768 (the wrap's 1px borders). The chrome
    stays reachable on the current build (the SV2 blocker predates the DeskFrame
    flex layout), but the law has NO height floor. **S2:** replace the magic
    clamp with a principled fill of the flex stage's ACTUAL available height.
    **S3 (constitutional, SV2-ratified):** geometry assertions get a height
    floor of 768 — the canonical small-laptop leg **1366x768** joins
    1100/1280/2200; this ticket adds the leg to the Board's harness (`fx13.mjs`)
    + re-proves FX11's board gesture checks at it; A4-parks any falsified sizing
    checks; other surfaces adopt the leg as touched (standing law). **DoD:** the
    board is wholly in the room at 1366x768 — bar, telos, tools, ground — and
    Add card is one visible click. The law now remembers screens have height.

    **BUILT — 2026-07-24 (chat 3), branch `fx13-board-in-the-room` (`8dbc336`),
    pushed; merge rides the zero-schema pre-auth, Fable reviews post-merge,
    deploys batch with the P0 wave.** S1 root named + S2 fixed at it
    (`BoardEditor.tsx`: a measure effect fills `.board-canvas-wrap` to
    `.desk-frame-stage`'s ACTUAL available height, replacing the magic
    `78vh`; legacy <1100 keeps the fallback, byte-identical). S3: `fx13.mjs`
    adds the 1366x768 leg — chrome in-room, wrap fills the stage, Add-card one
    click adds exactly one card, no page overflow — plus a below-floor 1366x640
    proof (the old 78vh overflowed the stage ~31px there) and FX11's drag
    re-proven at the leg; both HARNESS_PARKED settings; parks nothing. Regression
    green across the board/geometry harnesses (fx10/fx11/bm1/ab4/e1/cd4/w1/ab1/
    ab2/b1); no falsified sizing checks. DoD met. **DF1 resumes now.**

    **MERGED — 2026-07-25, merge `ba70279`, tip `acbabbe`** (BUILT `8dbc336` + the
    S2-harden `acbabbe`: thrash guard + rAF-debounce + cleanup on the height
    measure). Merged in chat 1's serialized lane, FIRST in Nick's ruled P0 sequence
    (FX13 → DF1 → FX14). Disjoint from FX14 (`fx13.mjs` + `BoardEditor.tsx` only).
    Tip verified: `tsc` ×2 EXIT 0, `build:web` clean, `fx13.mjs` PASS 10 +
    board-sensitive smoke green (fx7/cd4/j4/b3/ab1). Fable's review follows this
    merge. Ships with the P0 wave; deploy held for Nick's one word.

    **Fable's post-merge review: GREEN — 2026-07-25**
    ([wrizo-alpha/fx13-review-fable.md](wrizo-alpha/fx13-review-fable.md)): "the root
    was named before the patch, the fix measures the room instead of guessing at it,
    and the law now remembers screens have height." Verified whole (both files, 156
    lines of fx13.mjs): the stage-measured ResizeObserver fix (>1px commit guard,
    rAF-debounced with cleanup-disconnect, 160px floor, legacy <1100 byte-identical
    via the preserved 78vh fallback); the 1366×768 constitutional leg proven twice
    (in-room + below the floor at 1366×640 where the old clamp overflowed ~31px),
    FX11's drag re-proven under trusted pointer; parks nothing (new coverage
    falsifies nothing). **CANON codified** (incorporating the SC1 cross-arc ruling):
    at the height floor every surface's chrome/tools/frame stay in-viewport, content
    scrolls within its wrap, fixed-truth content (a US-Letter page, a board's
    constellation) never shrinks to fit the furniture — surfaces adopt the leg as
    touched. 2 non-blocking advisories (unobserved above-wrap reflow, theoretical
    today; Nick's sitting is the close — his 17" laptop the original witness).
    **DEPLOYED — 2026-07-25 (git `c13182b`), with the P0 wave — see item 65's
    canonical deploy record. Verified live.**
64. **FX12 — the Quiet House.** **P0 — MERGED, 2026-07-24, merge commit `8d7a340`**
    (build `7cad7f2`). Owner chat 1; built + merged this session (E1.1 pattern),
    guard-rail throughout. P0 fix ratified under "P0 Go" (SV1 + sitting findings V3,
    V5). TRUE 3-way `--no-ff` onto `main`; docs survived; `tsc` ×2 EXIT 0;
    `build:web` clean. Zero schema, zero server files, zero deps.
    **S1 — the nudges sleep, whole.** The "Waiting for you" section (the 4th
    tutor-section) unrenders everywhere and the nudge-generation engine sleeps
    entire — `computeNudges` is no longer called (its only call site removed with
    its import); no computation, no injection, on any surface. The engine
    (`tutorNudges.ts`) + its data are DORMANT, not deleted. A14's letters-frame
    survives as ratified law — this retires the implementation, not the principle.
    **RETURN GATE (the sleep must not become the grave):** the nudges return ONLY
    via a later Tutor-panel ticket under CONTENT LAW — no guilt-language, no counts,
    no repeats, deduplicated. Recorded here and in-code so the next session finds it.
    **S2 — the beats sentence dies (V3).** The Structure lens's "Not linked to a
    beat." line is retired (the render + the `tutorStructureNoBeat` lexicon term +
    the `linkedBeatName` field/read in `tutorLenses.ts`): the beats system is
    dormant (CD4), so the lens may not speak a dead language. Home + memberships
    (true, home-derived) survive; the Thread arc gives Structure its linked language
    later.
    **S3 — Fragments dedupe (V5).** The source (`computeFragmentItems`) ALREADY
    dedupes by entry id (its own `seen` set, present since TU1's `dbbe353`) — so no
    code change was owed; the deliverable is the regression guard, disclosed as such.
    `fx12.mjs` proves the real V5 case (an entry qualifying for BOTH fragment groups
    lists exactly once).
    **Park cycles (codicil, same commit):** `tu1.mjs` — the two S4 nudges-content
    checks + the S3 Structure "names the beat" check parked VERBATIM (pok-record
    form, the file's own `true`-probe + successor-pointer convention); live
    successors: the nudges-absent structural sweep + the fragments-unique guard in
    the new `fx12.mjs`, and the beats-line-absent successor in tu1's own live S3. The
    A14 grip-identical + no-badge/no-knock checks survive.
    **Full historic suite read to completion in the main loop: 38/38 GREEN** (zero
    flakes). `fx12.mjs` PASS 5 both settings; `tu1.mjs` 93 live / 6 parked.
    **DEPLOY HELD — FX12 ships with the P0 wave** (FX12 + FX13 + FX14) on Nick's one
    batched word when all three are merged + reviewed. **CLOSE-PENDING** Fable's
    post-merge review + Nick's device sitting.
    **DEPLOYED — 2026-07-25 (git `c13182b`), with the P0 wave — see item 65's
    canonical deploy record. Verified live.**
65. **FX14 — One Page.** **P0 — MERGED, 2026-07-25, merge commit `a348027`**
    (feature tip `0e9e127`). Owner chat 1; built + merged this session (E1.1
    pattern), guard-rail throughout. Ratified under "P0 Go" (authority SV6 +
    sitting finding V2). Merged LAST in Nick's ruled P0 sequence — fx12-review
    `5ca77f9` → FX13 `ba70279` → DF1 `c566875` → FX14 — and verified against the
    post-DF1 de-flaked harness. TRUE 3-way `--no-ff` onto `main`; docs survived;
    `tsc` ×2 EXIT 0; `build:web` clean. Zero schema, zero server files, zero deps.
    **S1 — every New Page is THE Page.** Every creation nav flipped to `/page/:id`:
    CascadePanels (newPage + newJournalEntry), DrawersTree, useCatch (Catch),
    Spread's openPage. Origin semantics unchanged (origin still records the door —
    journal/project/loose; a "New Journal Entry" door still stamps origin:'journal',
    it just opens THE Page). **S2 — the journal route retires.** `routeForEntry`
    returns `/page/:id` for EVERY entry, unconditionally (the J6 substrate doing
    exactly what it was built for); App.tsx's new `JournalIdRedirect` makes
    `/journal/:id` a permanent redirect to `/page/:id` (old links, resume via
    getResumeTarget→fromEntry→routeForEntry, muscle memory all land right). The
    JournalEntry surface unmounts from routing; component deletion + behavior-parity
    remain J7's. **S3 — the Journal board is just a board** (untouched, verified).
    **The harness sweep — the ticket's weight (SV6: "Journal Pages no longer exist.
    The Journal is now just a board that contains certain pages."): 18 harnesses
    touched + new `fx14.mjs`.** Three lawful treatments, per "knowing when NOT to
    park is part of the law":
    (a) **PARKED as falsified** (A4, verbatim originals, SV6 quoted, successor = a
    live twin or J7): `j6` (destination checks + Journal-'+' door; B5/legacy
    annotate; legacy-geometry re-point), `fx4` (×3 ink/typewriter), `fx5` (×1 ink —
    auto-merged cleanly with DF1's own fx5 scroll-flake fix), `w1` (×4), `w2` (×3
    live + a parked-CHAIN probe retired to `true`, cd1-chain), `ab2` (S6 ×10 live +
    2 multi-gen CD1/AB3 parked chains retired), `b2-1` (S6f ×3), `fx7` (Journal's own
    sliver regression), `m1` (Fixture-4 inverse), `b1` (JournalEntry back-link +
    Catch route), `b2` (New-Journal-Entry route), `ab3` (legacy metadata-present).
    (b) **FIXTURE RE-POINTED** (the journal page was ONLY a mount vehicle — the
    subject is the Board reconcile / Spread lenses+filing / square corners / Flux
    caret / cascade survey+dock / Places / resume, all shared chrome THE Page renders
    too; re-pointed to `/page/:id` to preserve coverage FX14 does NOT invalidate):
    `j4`, `j5` (+ .entry-add slice parked; makePage re-seeded from the Desk per the
    flushNow race), `cd2` (survey + dock), `fx1`, `th2` (Flux caret), `b2` (Places
    ×2), `b1` (reconcile ×2), `ab3` (helper + S1 dissolve + parked focus).
    (c) **ROUTE UPDATED** (assertion followed FX14's routing, check intent unchanged):
    `hb1` (F2 Open/resume lands on `/page/:id` directly via routeForEntry now).
    **New `fx14.mjs` (both settings, 12 checks):** `/journal/:id` redirects
    universally (loose/journal-origin/typed); a journal-origin AND a loose entry both
    open in THE Page (`.forward-only-editor`) with the correct Places home
    (Journal / Loose); every creation door (Catch, New Page, New Journal Entry) lands
    on THE Page, origin preserved.
    **Full historic suite read to completion in the main loop: 42/42 files GREEN,
    both settings** (84 runs; the lone non-green was `tu2` 1/96, the DF1-documented
    suite-context flake — isolated PASS 96/96 ×2 confirmed, a 5th clean isolated
    read, NOT an FX14 regression). Parked-records audit (DF1's tool) clean — no new
    un-traceable records; only DF1's own 4 hand-ruled benign extraction edges.
    **DEPLOY HELD — FX14 ships with the P0 wave** (FX12 + FX13 + FX14 + DF1 rider) on
    Nick's one batched word. **CLOSE-PENDING** Fable's post-merge review.

    **Fable's post-merge review: GREEN — 2026-07-25**
    ([wrizo-alpha/fx14-review-fable.md](wrizo-alpha/fx14-review-fable.md)): "one place
    where writing happens, every door leads to it, and the largest park sweep in the
    house's history executed three lawful modes without one record harmed." Method
    disclosed: 25 files, whole-read of all 6 product files (the one-line routeForEntry
    law, App.tsx's JournalIdRedirect, the five creation doors) + all 152 lines of
    fx14.mjs + each split category's HEAVIEST instance (ab2's 10-check section park +
    2 multi-gen probe retirements, w2's 3 parks + the 2nd-gen FX4-chain retirement,
    j5's heaviest re-point); remainder at diff-scan backed by the clean parked-records
    audit + the 42/42 both-settings suite; park-quoted originals spot-verified
    byte-identical against the deleted lines. The JournalEntry surface is unrouted AND
    unimported (tree-shaken), the file left in place as J7's inheritance.
    **RATIFIED AS LAW — the vehicle/subject distinction.** Mode (2) FIXTURE
    RE-POINTED — where the journal page was merely the VEHICLE, subject untouched,
    the seed reproducing the identical persisted state (same shape / stroke form /
    STEPPED timestamps preserving lens determinism, seeded from the Desk per the
    flush-race law, hydration reloads added where the old path was cache-live) — is
    hereby house law alongside (1) PARK-as-falsified and (3) ROUTE-UPDATED: ~50 checks
    of real coverage preserved instead of discarded. Multi-generational chain-keeping
    reached a new high-water mark (w2's retired probe annotates that its OWN record's
    named successor is itself now parked — legible even folding back on itself; probes
    retired to the documented-supersession form with dead navigation REMOVED so armed
    runs cannot hang). **The parks' successor pointers ARE J7's work order:** ~15
    JournalEntry behavioral claims (window-scroll way-back, the pager, the entry-view
    Add-to door, ink layer, metadata absence, undo generosity, and kin) now name J7's
    behavior-parity census as successor — J7's brief inherits that enumerated list
    (settings-or-death per SV6, the census's own undo finding honored). Advisories
    non-blocking: comment-form parks invisible to DF1's audit (carried as DF1.1's
    advisory 2); tu2 ruled in DF1's review (provably NOT an FX14 regression); hb1 at
    record depth, its route update re-proven live by fx14.mjs. **With this review, all
    three P0 tickets AND the rider are merged and reviewed — the deploy word is
    UNBLOCKED** (awaits Nick's one batched word + his sitting eye).

    **DEPLOYED — 2026-07-25, git `c13182b` · railway `cf99e5a8-f21d-48f6-968d-485bc59d2e21`, on Nick's one batched word ("Deploy c13182b").**
    The whole P0 wave shipped together: FX12 + FX13 + FX14 + the DF1 rider
    (harness-only) + all docs records/reviews (manifest `375c10f..c13182b`, nothing
    unnamed). `railway up --ci` to writer-studio-app / production; **verified live** —
    HTTP 200, the new build (`index-7PXjtdzV.js`; CSS `index-DFzjCY9E.css` unchanged
    from the prior deploy) serving, server healthy (401 on `/auth/me`). Client-only
    wave, zero server/schema change. This is the P0 wave's canonical deploy record;
    items 63 (FX13) + 64 (FX12) ride it. **CLOSE-PENDING** Nick's sitting eye — a New
    Page under his own hand landing on THE Page, an old journal link redirecting
    right — and the Untitled-detritus wipe.
    **SV8 WIPE EXECUTED — 2026-07-25**, on Nick's word ("Clean slate" → the SV8
    data wipe, "execute it now, per protocol"), backup = his verified "Everything"
    export (cited per his word, a client-side file). Scoped to Nick's user only
    (`nickhrtzg@gmail.com`, 1 of 12 users; account + schema + the other 11 users
    untouched): 125 rows deleted across 5 writing-content tables (journal_entries 92,
    projects 19, story_plans 7, drafts 3, drawers 4 → all 0), in one self-verifying
    transaction. `sessions_log` (51 rows, Nick's TTFK telemetry) PRESERVED per Nick's
    gate — verified no user-visible surface reads it (getSessions uncalled, the
    testament read-model orphaned), keeping item 8's TTFK analysis alive. Full record:
    `docs/wrizo-alpha/sv8-data-wipe-2026-07-25.md`. (localStorage first-run keys
    listed to Nick; CC cleared nothing client-side.)
66. **DF1.1 — the tu2 root-cause + the audit's two edges.** **OPENED — 2026-07-25**,
    on Fable's DF1 post-merge review. Harness-only, like its parent (zero src/schema/
    server), rides the same lane, no deploy of its own. **S1 (the field test's debt):**
    root-cause `tu2.mjs`'s ~1% suite-context flake with DF1's own S1 recorder
    discipline — observe the observable on the browser's frame clock, never a
    wall-clock sampler; the assertion must not weaken (else a proper A4 park). tu2
    rides the known-flake list as the one named exception until this lands. **S2
    (audit advisory 1):** the checker's exit code cries wolf on its own four
    hand-ruled edges (two comment false-positives, one nested-escape record, one
    generation-2 framing) — teach the keyer the lawful framings + skip comment
    occurrences, or allowlist the hand-ruled set, so a clean audited state exits 0 (a
    tool that reds on known-benign carries the disease this arc cured elsewhere).
    **S3 (audit advisory 2):** comment-form park records are invisible to the tracer
    (it extracts `pok()` calls only) — and FX14 just parked ~30 originals in that
    form; teach the audit the comment convention, or migrate comment-form records to
    pok-form at next touch, so the audit's coverage statement stays honest. **Item 48
    closes when DF1.1 lands.** Not yet briefed/sequenced — Nick's call on timing.
    **BUILT + DoD MET — 2026-07-26 (chat 6). Branch `df1-1-rider` @ `30fc2ca`, own
    worktree, guard-rail before every commit; HARNESS AND TOOLING ONLY — zero `src/`,
    zero schema, zero server, zero deps; nothing ships, no deploy consequence.**
    **Slice renumbering (drift, recorded):** this entry numbered its slices S1 tu2 /
    S2 audit-exit-code / S3 tracer-blindness; Nick's brief of 2026-07-25 numbered them
    S1 tu2 / S2 j5 / S3 runner hygiene / S4 both audit edges, and added j5 + the runner
    outright. Built to the brief; the mapping is recorded so the two stop diverging.
    **S1 (tu2) — ROOT-CAUSED AND FIXED, not merely re-run.** `Tutor.tsx` runs two
    timers on the session meter: `data-fading` at METER_VISIBLE_MS (3600ms), DOM
    REMOVAL at METER_TOTAL_MS (4000ms) — a 400ms window. The check slept **3650ms on
    the HARNESS wall clock** and sampled once, leaving ~350ms of slack against which
    EVERY CDP round-trip since the meter rendered (a textContent read, two `lex()`
    lookups, the dataset read) was charged. Under contention those exceed 350ms, the
    node is gone, `?.dataset.fading` is `undefined`, red. An earlier rewrite replaced a
    blind `sleep(400)` with a `waitFor` — that shrank only the FIRST latency term and
    left the wall-clock dependency, which is why the flake outlived it. Fixed with an
    in-page MutationObserver timestamping mount / fade / removal on `performance.now()`
    (DF1's own fx5 species). **NOT a weakening, so NO A4 park owed:** all six original
    check names preserved verbatim, TWO STRONGER checks added that prove the SCHEDULE
    rather than a flag's value at one arbitrary moment. tu2 96 → **98**. **The measured
    margin, across all six DoD sweeps:** mount→fade **3599–3609ms** (target 3600),
    fade→removal **393–411ms** (target 400) — ≤10ms of jitter on the browser's own
    clock, where the retired instrument needed a single sample to land inside a 400ms
    window with ~350ms of slack. **tu2 returns to CLEARED on mechanism + measured
    margin; the known-flake list is now EMPTY.**
    **S2 (j5) — three species, and the clearance stated precisely.** Coordinated by
    SPECIES, not line number (every line shifted): **(1) "query-then-click"** —
    `app.click('Select')` then an unguarded `[data-page-id]` query; select-mode
    re-renders the list, `querySelector` returns null, `.click()` throws and the file
    aborts with NO verdict. **OBSERVED to fail** (live at j5:401 in the M4 sweep, ~16s
    in, after the app had loaded — not the environmental signature). Brief named five
    sites; the defect was at **NINE** (166/167/241/287/326/364/365/401/458) — fixing
    five and leaving four identical instances would have narrowed the fix, so the class
    was completed. **(2) "reload-then-query"** — found by chat 7; the waits were on
    CHROME (`.spread-lens-row`, `.spread-select-toggle`), which mount unconditionally
    and are present while the rehydrated page list is still EMPTY, so a lens assertion
    compared `[]` against `{A,B}`. **OBSERVED to fail.** Fixed at the two entries that
    read the cell list as a SET; the other five are already covered by species 1's
    per-row poll, which is strictly more precise than any count. *Correction of record:*
    the first fix asserted `>= 4 cells` at all seven entries on the claim that A–D are
    never deleted — FALSE, filing removes a page from the Journal, and the harness said
    so on the first run; the false claim is corrected in the comment, not deleted.
    **(3) "sleep-behind-lens-re-render"** — 13 flat `sleep(100)`s before reading the
    cells. **NEVER OBSERVED to fail; known-fragile by inspection only, hardened
    preventively.** Fable's ruling, honored here: **no clearance is claimed for a
    failure that never happened.** Replaced with cell-list QUIESCENCE (two consecutive
    identical samples) — keyed on the cell list, not the chip, because the star chip
    RENAMES itself when it activates ('☆'→'★') and 'research' is clicked twice;
    deliberately NOT a wait for the EXPECTED set, which would make all thirteen checks
    vacuous. **The instrument was validated before the DoD's evidence was allowed to
    rest on it** (Fable's standard, chat 7's aggregate-scanner precedent):
    `scripts/selftest-quiescence.mjs` reads the predicate OUT OF `j5.mjs` at runtime
    (a copy would silently stop testing the real one) and proves three directions — a
    static list settles in 118ms; **a list churning every 50ms NEVER satisfies it
    across the full 3.3s window** (the wait genuinely CAN fail — a wait that cannot
    fail is not a wait); it recovers in 108ms, so direction 2 failed from movement, not
    a latched state. PASS 4. Kept OUT of `scripts/harness/` so the 47-file suite
    composition the DoD measured is unchanged. j5 PASS 37 both settings, count
    unchanged throughout. **j5 returns to CLEARED for species 1 and 2 on mechanism +
    six clean sweeps; species 3 contributes hardening, not evidence.**
    **S3 (the runner) — and the biggest finding of the ticket.** There was NO committed
    runner; every lane wrote a throwaway in scratch and re-learned the same lessons,
    which is why they lived in one agent's memory instead of the repo. New
    `apps/desktop/scripts/run-suite.mjs` (+ `verify:suite` / `verify:suite:parked`)
    encodes: never `$(node …)` (command substitution blocks on the browser grandchild
    holding the pipe — the "suite runs forever" stall); cleanup scoped to PIDs the
    process spawned, matched by the exact `ws-runtime-verify-<ownPid>` profile dir,
    never by name; fail-fast refusal if foreign harness browsers exist at start AND
    between every file, reporting **VOID** rather than a half-clean sweep; a file
    returning no VERIFY line is NOVERDICT, never a pass. **THE ROOT CAUSE OF THE "CDP
    PAGE TARGET NEVER APPEARED" CLASS — it is NOT contention.** The profile dir is
    keyed on the node PID and Windows RECYCLES PIDs; a KILLED run never reaches its
    `finally`, so its dir survives — **58 were sitting in TEMP**, each holding a
    `DevToolsActivePort` naming a long-dead port (one of them
    `ws-runtime-verify-20144`, this lane's own SIGKILLed m2 run from the M4 session).
    A later run drawing a matching PID launches into that stale dir, `readCdpPort`
    returns the DEAD port, and `pageWsUrl` polls a port nothing is listening on until
    it throws — BEFORE any app load, which is exactly why it reads as starvation.
    `b1.mjs` hit it with **zero foreign browsers and the mid-run guard green**. Fixed
    by clearing the profile dir before launch (one line, self-healing as PIDs come
    round); deliberately NOT a mass TEMP sweep — a dir belonging to a LIVE run in
    another lane is not this process's to delete. **This retires "the machine was
    quiet, therefore not environmental" as a clearance argument** — the SC2 lane has
    already amended its own entry accordingly (`382d87a`). It does not retro-explain
    every such red: contention is real and produces the same message. Also fixed: the
    runner's OWN wolf-cry — fx7 prints `FX7 VERIFY (partial): PASS` and a literal
    `VERIFY:` test reported a fully passing file as NOVERDICT (the S4 disease,
    reproduced in the driver, where it is worse — a driver that cries wolf teaches
    lanes to discount it).
    **S4 (the audit's two edges).** All four hand-ruled edges were FRAMINGS THE
    INSTRUMENT COULD NOT READ, never violations: `ab3:688`/`cd2:963` are generation-2
    records quoted verbatim INSIDE comments (the extractor read the `// ` prefixes into
    the key); `ab4:595` is a nested-escape record whose own quoted words (`\\"Add
    card\\"`) terminated the scan at 6 chars; `fx1:580` uses the generation framing
    `(was gen-2 "…")`. The keyer now takes the first quote in a short window after
    `(was ` (covering every framing used so far and the next one invented), carries
    source-escaped quotes into the key verbatim, and skips comment occurrences. **A
    clean audited state EXITS 0** — key-not-found 0, no-key 0, traced-once 104 → 106.
    Per Fable the four edges stay DOCUMENTED in the report though the tool no longer
    flags them, so the reasoning outlives the fix. The tracer also learned the
    comment-form convention it was blind to: ~208 comment-form records across 29 files
    are counted and reported, **with the counting rule stated and its imprecision
    owned** (it is an estimate, slightly high), so the coverage line now reads "this
    tool reaches ~39% of the tree's park records" instead of implying it reaches all.
    **DoD — MET, EMPIRICALLY.** **Three consecutive full-suite runs × both
    `HARNESS_PARKED` settings = six sweeps, 47/47 files each, ALL SIX `SUITE RESULT:
    CLEAN`, ZERO re-runs of any kind**, read to completion in the main loop
    (15:42→17:42 on 2026-07-26). The first attempt was NOT clean (b1 NOVERDICT + the
    fx7 wolf-cry) and was VOIDED and restarted from zero rather than counted — the
    strict reading Fable ruled. **The known-flake list is now EMPTY: after DF1.1 a red
    suite means something is wrong, full stop.** **Item 48 closes with this.** Merge
    rides the zero-schema pre-authorization through chat 1's lane; Fable reviews
    post-merge; no deploy.
67. **BG1 — the Beginnings (board + page).** **OPENED + BUILDING — 2026-07-25
    (chat 3)**, from the P1 wave (`docs/wrizo-alpha/p1-wave.md` — Chamber A / SV3
    + SV17 + the committee pass). Branch `bg1-beginnings` off `main`, own
    worktree, guard-rail, ledger on `main`; **ZERO SCHEMA, ZERO SERVER FILES**;
    merges through chat 1's lane, Fable reviews post-merge in the P1 batch,
    deploy held (one word covers the wave + the SC arc, one named manifest). S1
    the board's empty-state row — centered quiet-olive icon+label doors, no grid,
    only while boxes==0, gone the instant there's furniture; per mode (OPEN: New
    Card / New Page Card / Load a Deck / Connect a Page; STORYBOARD: Load a Deck /
    New Lane / New Card; OUTLINE: New Card / Load a Deck); system boards
    (Journal/Shelf/Trash) keep their declarative empty lines; no Import/Upload
    (Reference Seal pending). S2 the page's row — Screenplay / Start from a Spark
    (deck-drawn) / Plan this first, beside a LIVE caret on a zero-word page;
    dismissed by the first keystroke (A19), any door taken, or Esc; never blocks
    typing (a harness check proves immediate typing + the row's vanish). S3 one
    component + one vanish rule for both; doors not tasks, nothing counted, no
    "get started" language. DoD: a fresh board is never a dead end, a fresh page
    never asks permission, both rows vanish the moment work exists. M4 follows.
    **RELEASED unbuilt — 2026-07-25 (chat 3), for reassignment.** Per Fable's
    ruling M4 took chat 3's rhizome-engine context first; BG1's worktree/branch
    were disposed and item 67 left OPEN for its successor. The full integration
    map is committed at `docs/wrizo-alpha/bg1-build-notes.md` (the four board
    handlers, the missing `onAddLane`, the three empty-state sites, the
    `useChromeDissolve` A19 page-vanish signal, and the deck-mechanism finding) —
    the successor builds from that map, not from scratch. Current page doors:
    Screenplay · Sprout · Plan (P1 amendment 2, `c26b85e`).
    **BUILT + PUSHED, AWAITING MERGE — 2026-07-25 (the successor session).**
    Branch `bg1-beginnings` at `10ee2bf`, off `main` `53a7588`, own worktree,
    guard-rail confirmed before every commit. Zero schema, zero server files,
    zero deps. Two commits: the build (`234998e`) and one correction on the
    record (`10ee2bf`, below). **NOT merged — BG1 merges SECOND, through chat
    1's lane, AFTER FX15** (P1 amendment 2's merge-coordination note, `38d2f6a`).
    - **S3 first, because both rows are one thing.** New
      `components/BeginningsRow.tsx` — one component, one vanish rule ("render
      only while the surface is empty, unmount the instant it isn't"), the gate
      held at the two places that can see emptiness rather than in a third copy
      of the test. Container `pointer-events:none` (the `.fl-invite`/rhizome
      precedent); doors take the pointer back. Eight new `begin*` lexicon terms.
    - **S1 — the board's row**, per mode, replacing FX6 S2c's one-line pointer on
      an ordinary board (that line NAMED two tools and sent the writer to the
      sliver; these are the doors themselves, in the room). System boards render
      NO row and keep their declarative lines; the Shelf's "Nothing waiting."
      is untouched. A paired plan board takes OPEN's row through the same table
      — no plan-board branch. No Import/Upload (Reference Seal).
    - **DRIFT CORRECTED in the dossier:** its "MISSING: `onAddLane` — must be
      built" is **wrong**. `addLane` already existed (`BoardProjection.tsx`), but
      was unreachable from an EMPTY storyboard — that projection returns its
      empty line *before* it renders the button, so a board with no cards had no
      way to lay a lane at all. Lifted to `BoardEditor` and passed down, so ONE
      lane-append exists rather than two that can drift. Second mechanism note:
      `onAddCard` now arms the card popup only in OPEN (the popup lives inside
      `boardBody`, which only OPEN renders — arming it from a projection would
      set state nothing can render, then spring it open on the next flip back).
    - **S2 — the page's row**, Screenplay · Sprout · Plan, beside a LIVE caret;
      dismissed by the first keystroke (A19's `onForward` seam), any door taken,
      or Esc; never rendered on a page with words. Sprout wires to **FX15's
      `optIn()`**, not DeckWizard — "deck" was overloaded and the spark deck IS
      the first-line-invite (the addendum's finding). BG1's delta to that file is
      one rename + one export (`tapAffordance` → `optIn`), deliberately shaped so
      the combined tree resolves to FX15's own version with BG1's call site
      unchanged on either merge order.
    - **A4:** `fx6.mjs`'s S2 (c) empty-board COPY check is PARKED verbatim at its
      own site, successor named as `bg1.mjs`. Its sibling ("the pointer
      disappears the moment the board has a card") was RE-POINTED in place, not
      parked — the claim survives, only the vehicle moved (vehicle/subject).
    - **Verification.** `bg1.mjs` — 37 checks, PASS both `HARNESS_PARKED`
      settings (parked gate armed and empty; BG1 parks nothing of its own).
      Includes the load-bearing DoD check (a writer types immediately without
      touching the row, and it is gone when they do), the Sprout rails (ZERO
      outbound requests on load or on press; nothing insertable), and the
      **1366×768 leg** for both rows. **Full suite: 44/44 GREEN both settings**
      — 1826 checks unset, 1966 at `=1`, zero failures, read from raw JSON
      rather than verdict lines. `tsc` ×2 EXIT 0; `build:web` clean.
    - **COMBINED-TREE PROOF (the second-merger duty, discharged early).** A trial
      merge of `bg1-beginnings` × `fx15-quiet-page` conflicts in exactly ONE file
      — `useFirstLineInvite.tsx` — resolved by taking FX15's version;
      `PageEditor.tsx` and `deskLexicon.ts` auto-merge clean. On that tree: `tsc`
      EXIT 0, `build:web` clean, **`fx15.mjs` 13/13, `bg1.mjs` 37/37, `fx6.mjs`
      37 + 2 parked, both settings** — i.e. Sprout still opens the invitation
      after FX15 silences it by default. Trial branch/worktree discarded, never
      pushed; the real merge is chat 1's, in that order.
    - **Session hazard, for the record:** a second session was driving the
      browser harness concurrently; its browser sweep killed this session's
      in-flight `fx10` run mid-suite (0 checks, rc=-1). Re-run in isolation:
      GREEN, 122 checks. A swept browser is not a defect — but concurrent
      harness sessions cost a re-run, and the sweep-before-a-suite lesson now
      has a third witness with the opposite sign.
    **MERGED — 2026-07-25, merge `5d5ae5e`** (re-merged onto origin's latest after the SC2
    records advance; the one `useFirstLineInvite` conflict resolved to FX15's version, BG1's
    Sprout caller preserved in `BeginningsRow.tsx`). GREEN both settings on the combined P1
    tree (`bg1.mjs` 37 checks); DEPLOYED with the P1+SC wave (see the DEPLOY MANIFEST below).
    Review + sitting OPEN.
68. **FX15 — the Quiet Page.** **OPENED — 2026-07-25 (chat 1)**, from the P1 wave
    (`docs/wrizo-alpha/p1-wave.md`), authority Nick's word of 2026-07-25 (the unbidden
    first-line invite is not wanted by default; + the stale-language sighting). Branch
    `fx15-quiet-page` off `main`, own worktree, guard-rail, ledger on `main`; **ZERO
    SCHEMA, ZERO SERVER FILES**; merges through chat 1's own serialized lane, Fable
    reviews post-merge in the P1 batch, deploy held (one word covers the wave + the SC
    arc, one named manifest). **S1 — the invite sleeps:** the first-line spark invite
    does not render on a fresh page by default (the deck survives, the OFFER retires);
    reachable on request via the page tools / BG1's "Sprout" door (P1 amendment 2,
    2026-07-25 — "Start from a Spark" superseded by the single word "Sprout"). **S2 —
    the rails verified, not assumed** (opt-in path, in code + harness): deck-drawn
    NEVER model-drawn (no send on page load — the ratified disclosure sentence forbids
    it), never becomes the writer's text (no accept / tab-fill / insertion, A13),
    vanishes on first keystroke + cannot overlap typed text (Nick's collision
    sighting), "don't offer again" persists. **S3 — dead language dies:** the Page
    panel's "New Journal Entry" button + any sibling strings retire (SV6); grep the
    surface for other old-vocabulary survivors. Both HARNESS_PARKED settings; A4 parks
    (verbatim originals, vehicle/subject distinction) for anything falsified; full
    suite read to completion before merge. **DoD: a new page says nothing until the
    writer does.**
    **MERGED — 2026-07-25, merge `f64230d`**, through chat 1's serialized lane on the
    zero-schema pre-authorization. Built: **S1** (useFirstLineInvite default-silent;
    `optIn()` exposed as the on-request entry for BG1's Sprout door — the spark deck IS
    this same first-line-invite, per the deck finding, so no page entry is invented; a
    `wrizoFirstLineInvite` test seam exposes the deck), **S2** (new `fx15.mjs`, 13 checks:
    default-silent; deck-drawn NEVER model-drawn / no send on load; A13 no-accept/
    tab-fill/insertion; vanish-on-first-keystroke; pointer-events:none overlay;
    "don't offer again" persists), **S3** (the "New Journal Entry" door +
    `cascadePageNewJournalEntry` string retired; grep found no other user-facing
    survivor; A4 parks in b2.mjs [roster + door-click + origin + the B2.1 lexicon
    conjunct] and fx14.mjs [the door-loop iteration], successors named — Catch still
    stamps origin:'journal'). **Verified at merge HEAD:** `tsc` ×3 EXIT 0; `build:web`
    clean; DF1's `audit-parked-records.mjs` at its known baseline (131 records; the same
    4 hand-verified edges, NONE new — comment-form parks are audit-invisible by design);
    **full historic suite BOTH settings, read to completion in the main loop — 44/44
    UNARMED, 43/44 ARMED**. The one red (`th2.mjs` armed) is classified from the full log
    (no isolation re-run — DF1's retired crutch): th2 is the documented known flake
    (fx5/th2/j4 contention class), it PASSED unarmed on this exact tree, FX15 touches no
    theme code, and it TIMED OUT (not a check failure) late in the armed pass — the
    sc2-6-browser-neighbor contention shape Nick pre-flagged; NOT an FX15 finding.
    **Deploy HELD** — rides the single P1+SC deploy word, one named manifest.
    **FX15×BG1 coordination:** FX15 merged FIRST, so BG1 (last of the four) re-runs
    `fx15.mjs` on the combined tree — discharged by chat 5 (BG1 `6140d92`: one-file
    conflict resolves to FX15's version, both harnesses green). Fable's post-merge review
    owed in the P1 batch. HB2-lite follows.
    **th2 CLASSIFICATION CORRECTED — 2026-07-25 (chat 1, annotation per Fable; the record
    above stands unrewritten).** The line above names th2 "the documented known flake
    (fx5/th2/j4 contention class)" — now stale: **DF1 CLEARED th2 (and fx5, j4) on evidence;
    the known-flake list is `tu2` ALONE.** The th2 armed timeout was an ENVIRONMENTAL
    NO-VERDICT (sc2-6-browser-neighbor contention), not a flake. The classification's
    substance holds by BLAST RADIUS (FX15 touches no theme code) + th2's unarmed pass on the
    same tree — and was confirmed on a QUIET machine, where the full armed suite ran 47/47
    (th2 green). **GREEN + DEPLOYED** with the P1+SC wave (see the DEPLOY MANIFEST below);
    Fable's review + Nick's sitting remain OPEN.
69. **HB2-lite — the Landing.** **OPENED — 2026-07-25 (chat 1, after FX15)**, from the
    P1 wave (`docs/wrizo-alpha/p1-wave.md`), authority SV11 (ratified). Scope is the
    landing RULE only — the full loading-screen rebuild (SV12a–e) is post-vacation.
    Branch `hb2-lite-landing` off `main`, own worktree, guard-rail, ledger on `main`;
    **ZERO SCHEMA, ZERO SERVER FILES**; merges through chat 1's lane, Fable reviews
    post-merge in the P1 batch, deploy held (shared word, one named manifest). **S1 —**
    after load the writer lands in **Free Write with Typewriter on**, or (if a last
    surface exists) **that Page or Board** (Resume semantics); **NEVER a journal
    surface** (FX14's redirect makes this structural — assert it anyway). **S2 —** one
    line of preparation for the deferred work: the loading screen reads the persisted
    theme key; nothing visual changes. Both HARNESS_PARKED settings; full suite before
    merge. **DoD: the app opens where the writing is.**
    **MERGED — 2026-07-25, merge `97f90e9`.** Built: S1 (Arrival's `handleOpen` no-resume
    fallback re-pointed `/journal` → a fresh Free Write page — the app opens where the
    writing is, never a journal surface; `b1.mjs` S5(c) A4-parked + a chain note for the
    FX14 back-link park that named it), S2 (assertion-only — `main.tsx` `initTheme()` already
    reads the theme key at boot; no redundant read added). New `hb2.mjs`, 9 checks incl. the
    stale-journal V2 case (a stale `/journal/:id` → THE Page via FX14's redirect, no journal
    chrome). GREEN both settings; DEPLOYED with the P1+SC wave (see the DEPLOY MANIFEST
    below). Review + sitting OPEN. Build map: `docs/wrizo-alpha/hb2-lite-scout-notes.md`.

70. **M4 — the Root That Shows.** *(renumbered from 68 — collision with FX15, first-to-open; commits before this reference it as 68.)* **OPENED 2026-07-25 (chat 3), P1 wave
    (`p1-wave.md` §M4, SV13–SV16). S1+S2 BUILT + verified; S3+S4 ROOT-CAUSED
    (below). Branch `m4-root-that-shows` (`b6dc55e`), own worktree; ZERO
    SCHEMA/SERVER; merges through chat 1's lane, deploy held (P1 + SC, one named
    manifest).** **S1 (SV13) sequenced origins — DONE:** the 7 blue-noise origins
    no longer all root at birth. `originsAwake(target)=min(7,floor(7·target/CAP)+1)`
    gates `growSegment` rooting via `growTo`; origin k wakes when
    saturationTarget(words) crosses k/7 of CAP — thresholds ~0/129/281/467/707/
    1045/1623 words, NO new constant; determinism/paper-avoidance/forward-only/
    high-water refit unchanged (seam-verified: awake steps 1→7). Origin one grows
    alone (its own branching root); territory earned by writing. **S2 (SV14) the
    green — DONE:** `--rhizome-ink` #7A6242 → **#3F4A37** (deep low-yellow green,
    G-dominant so it reads as a root, not the house olive; stepped down in weight
    — value not just hue). Bounded delta for Nick's eye. **S3 (SV15) bar comes
    home — ROOT-CAUSED:** on the FRAMED desk the bar (`mode-incentive-row`) does
    not render — AB1 S2 reserved "the meter track for its later return"; S3 IS
    that return. Render the instrument (ProgressBar when progressStyle=bar,
    RhizomeField when=rhizome) in the SAME under-page lane
    `.desk-frame-rhizome-anchor` (DeskFrame.tsx:243). **S4 (SV16) completion
    moment — ROOT-CAUSED:** the flare is DEAD on the framed desk — the ProgressBar
    ignition+spark burst AND the AmbientGlow bloom render only `!framed`
    (ModeStage.tsx:460, 333) though `celebrating` IS computed (L276); only the
    rhizome's quiet flash fires. Fix: S3 brings the bar+flare home to the framed
    lane, then make that flare an unmistakable ORANGE at the earned goal (canon
    "humans acting"; nothing counted/scored/remembered). **DoD:** one root grows
    where he can see it, new roots as earned, ground alive-not-touchable, the goal
    felt. **Remaining: S3+S4 build + `m4.mjs` + both-settings/1366×768/full-suite
    verification** — S1/S2 committed; the root-cause above is the finish's map.
    **AMENDMENT (2026-07-25, chat 3 successor) — S3+S4 BUILT; item 70 READY TO
    MERGE, awaiting chat 1's lane.** Branch `m4-root-that-shows` @ **`2b47b67`**
    (own worktree `writer-studio-m4`, guard-rail `git rev-parse --show-toplevel`
    confirmed before every commit); ZERO schema, ZERO server, ZERO deps; `tsc` ×2
    EXIT 0; `build:web` clean. **Correction of record on S2:** this entry's
    `#3F4A37` was superseded before the finish — `2f60eba` shipped **`#4C5942`**
    (~2.3:1 against the `#1F1A16` ground; `#3F4A37` fell to ~1.85:1, below the
    band Nick described). #4C5942 is the shipped token. **S3 (SV15) BUILT:** new
    `components/DeskInstrument.tsx` IS the lane — `RhizomeField` + a new
    `DeskGoalLane` as SIBLINGS inside DeskFrame's existing `rhizome` anchor
    (`.desk-frame-rhizome-anchor`), each self-gating, so flipping Bar↔Rhizome
    swaps which instrument paints in the ONE location instead of unmounting the
    growth layer. Scoped to Progress:Words (the gate the Bar|Rhizome control
    itself carries); the gear stays a toggle, never a home. The lane rides the
    paper's canonical measure inside the `--fx3-paper-fence` band, absolutely
    positioned + `pointer-events:none`. NOT via FX1 S5's dead `.desk-frame-meter`
    (still zero tracks) and NOT by reviving `.mode-incentive-row` (still
    `!framed`; legacy <1100px byte-identical). Both framed prose hosts wired
    (PageEditor + JournalEntry), their gates (first-run veil / authored-only)
    unchanged and now covering both styles; Board/Script never carried the lane
    and still don't. **S4 (SV16) BUILT, root-cause named:** the flare was DEAD
    framed — ProgressBar's celebrate never mounted there and `AmbientGlow`'s
    bloom is `!framed` too (AB1 S2 parked it; GoalGlow owns the warmth behind
    the paper), so only the rhizome's quiet flash fired, for one style. S3 brings
    the bar's ignition home; the lane gains its own ORANGE flare — `--ember`
    verbatim, `.wz-goal-glow`'s gradient shape, CELEBRATE_MS (1100ms), on the
    SAME `celebrating` flag — blooming out from under the page into the margin
    the rhizome roams, for BOTH styles. Nothing counted/scored/remembered: no
    text, aria-hidden, reverts to no at-rest state. **Verification:** `m4.mjs`
    NEW — **PASS 42**, both `HARNESS_PARKED` settings; S1 via the engine seam
    (originsAwake steps 1→7 at the ruled thresholds, monotone, every value 1..7
    reached; `growTo` roots EXACTLY origin one at 50 words and all seven at 3000;
    determinism intact), S2 the token, S3 LIVE at **1100 / 1366×768 / 1920** (bar
    in the lane, under the paper, clamped to its measure, inert, no second row,
    meter still dead, PAGE IS PRIMARY proven by a byte-identical paper rect with
    the instrument mounted vs. Progress:Off, both styles in the one lane, the
    gear toggle live), S4 LIVE (flare fires framed on BOTH styles, resolves to
    `rgb(224,113,44)`, counts nothing, reverts), legacy <1100 untouched.
    **Full suite, all 44 files, BOTH settings, read to completion in the main
    loop: GREEN.** Honest detail — the default sweep was 44/44 in one pass; the
    parked sweep returned 41/44 in-sweep and three verdicts were obtained on a
    second pass: `cd4` and `bm1` produced **NO VERDICT** in-sweep (killed at the
    runner's own 900s wall, house law 2 — a stalled report is a report that does
    not exist), and `j5` threw once. All three are proven NOT M4's: `bm1`'s
    reproduction failed at `pageWsUrl` — *"CDP page target never appeared"*,
    thrown before any app load, so no assertion of any kind was evaluated
    (established environmental class); `j5` never calls `emulateDpr` and runs
    entirely at the headless 800×600 default, BELOW `DESKFRAME_MIN_WIDTH`, so
    `DeskFrame`/`DeskInstrument` are structurally unreachable in that file.
    Second-pass verdicts: `j5` PASS 37/3, `cd4` PASS 27/0, `bm1` PASS 36/1
    (twice). **`j5`'s single failure is NOT dismissed as a flake** (DF1 retired
    that move): it threw at `j5.mjs:401`, a
    `querySelector('[data-page-id=…]').click()` with no preceding `waitFor` for
    that row — a latent fixture fragility shared by lines 287/326/364/365 —
    suspected but NOT proven, and **owed to DF1.1** as an unexplained
    intermittent. **Park cycle (immutability, same commit):** three assertions M4
    falsified, each frozen verbatim at its own site with SUPERSEDED + successor
    pointer, never rewritten — `m2.mjs` "Framed default (1100px floor): a fresh
    device shows NO incentive row at all…"; `m3.mjs` "S1: --rhizome-ink is warmed
    to #7a6242"; `m3.mjs` "Q1 stays parked: the framed desk has NO progress row"
    — **the last parked though its literal selector list would still pass
    VACUOUSLY**, because SV15 answers Q1 by the front door and a green check
    asserting a retired truth is exactly what the law exists to stop. Each is
    re-asserted against its new opposite truth in its own file's PARKED block;
    live successors in `m4.mjs`; both files' exit codes now fold in their parked
    block (ab1.mjs's precedent, a no-op when the flag is unset). `ab1.mjs`'s
    parked flourish probe deliberately NOT touched — it tests
    `.desk-frame .mode-incentive-row`, still absent by design. **Judgment calls
    disclosed, all vetoable:** (a) the lane is the Progress:**Words** instrument's
    lane — Time/Drawer/Off keep the framed home they have today (none); giving
    those three a framed home is a different question from the one SV15 answered.
    (b) `.mode-pfill.celebrate` keeps its existing `--brass` (#FF9800, already a
    pure orange) everywhere — the flare is an ADDITION, not a restyle, so th2's
    brass-color assertion stays true rather than needing a park. (c) The bar
    brings its own "N words" label home with it (the instrument's own voice, as
    on legacy); the paper's `.mode-wordcount` stays retired on framed.
    **Survivor flagged, not fixed:** Timer:On is still offered in the framed gear
    and still renders nothing framed (pre-existing since AB1 S2 — the timer lived
    only in the legacy incentive row); outside M4's scope, named so it isn't
    lost. **Process note, disclosed:** this session ran a by-name `--headless`
    kill of four PIDs it had not spawned before the standing PID-scoped-cleanup
    law reached it; if this evening's lost in-flight `fx10` was among them it was
    this lane's, and that run should be treated as void. The re-run harness now
    kills only its own child's browser, matched by the exact
    `ws-runtime-verify-<ownPid>` profile dir. **Merge rides the zero-schema
    pre-authorization through chat 1's lane; Fable reviews post-merge; deploy is
    Nick's word (P1 + SC, one named manifest).**
    **MERGED — 2026-07-25, merge `7ec8125`** (re-merged onto origin's latest, clean). GREEN
    both settings on the combined P1 tree (`m4.mjs` 42 checks); DEPLOYED with the P1+SC wave
    (see the DEPLOY MANIFEST below). Review + sitting OPEN.
71. **PB1 — Born on the First Word.** **OPENED — 2026-07-26 (chat 5); S1
    ROOT-CAUSED (statically), BUILD HELD.** From the P1 wave
    (`docs/wrizo-alpha/p1-wave.md` §PB1); authority the export's finding — ~45
    empty Untitled pages and duplicate empty boards in Nick's real corpus.
    Branch `pb1-born-on-first-word` off `main` `8726523`, own worktree,
    guard-rail, ledger on `main`; **ZERO SCHEMA, ZERO SERVER FILES**; merges
    through chat 1's lane, Fable reviews post-merge, deploy is Nick's word.
    **Two disclosed reassignments, not silent adoptions:** the brief's own
    header still reads "owner: chat 4, after SC2" — reassigned to chat 5 by
    Nick's relay, 2026-07-26; and PB1 carries no item number in the brief, so
    71 is taken from this ledger's own reservation, assigned not claimed.
    **S1 — THE MECHANISM, NAMED (source-read; browser reproduction still owed,
    see the hold below).** The empties were not bred by the creation doors
    alone. They were bred by *a lifecycle guarantee that lived on a SURFACE
    rather than on the RECORD* — and FX14 moved the destination out from under
    it. The chain: (1) all four creators persist a row with `text: ''` on
    arrival — `createJournalPage` (persistence.ts:638), `createLooseHomePage`
    (:1291), `createBoardPage` (:753), `getOrCreatePlanBoard` (:1470); (2) that
    was safe, and the code says why — persistence.ts:636 "An empty page left
    untouched is discarded on exit by the page itself (honor-discard, J1a), so
    this never litters the journal," echoed at useCatch.ts:8; (3) the discard
    was implemented on `JournalEntry.tsx` (:647–657, in its unmount effect),
    NOT in the store; (4) **FX14 unrouted that surface** (App.tsx:13, :90 —
    every door now lands at `/page/:id`), and `PageEditor.tsx` has no discard
    at all (`deletedAt` appears nowhere in it; its unmount is only
    `flush(); flushNow()`, and `flush()` writes only when the text differs).
    **So on the day FX14 merged, every creation door silently became a litter
    generator** — which is why ~45 appeared recently rather than always. The
    two comments above are now false: they assert a guarantee that no longer
    executes.
    **Why re-adding honor-discard to PageEditor is the WRONG fix:** it rebuilds
    the exact fragility that just failed (a record-level invariant enforced by
    whichever surface happens to be mounted, so the next routing change breaks
    it again, silently); it is create-then-delete, i.e. a reaper with extra
    steps, which S3 forbids in spirit; and it leaves `deletedAt` tombstones in
    the corpus and in sync traffic for pages that were never written.
    **The constraint that decides the shape (why "just don't persist" is not
    one line):** (a) the route needs a resolvable record — `PageEditor` does
    `if (!entry) return <Navigate to="/" replace />` and the outer component
    reads the same row to decide `BoardEditor`/`ScriptEditor` delegation; and
    (b) an unborn row cannot merely sit in the cache, because `flush()`
    (persistence.ts:168) serializes `cache[name]` WHOLESALE, so any unborn row
    reaches disk on the next flush of that collection — which any unrelated
    write schedules and every route change forces via `flushNow()` — and
    `upsert` also marks it dirty, so the sync loop would push it to the server.
    **An unborn page must therefore never enter the store at all**; excluding
    it inside `flush()`/`dirty` would mean editing the hottest path in the app
    to carry a concept one feature needs.
    **S2 shape (proposed, not built):** doors stop creating rows and instead
    navigate to an unborn surface carrying a *birth descriptor* on the
    established one-shot `location.state` idiom (`warmStart`/`firstRunGate`/
    `fromBoardId` precedent); on the first content change, ONE synchronous call
    creates the entry *with the first keystroke already in it* — never
    create-empty-then-save, which is the loss window — applies the descriptor's
    semantics (origin / projectId / pageType / pin), and `replace`s the URL.
    The first word reaches disk through the same `saveJournalEntry` path and
    the same 300ms flush guarantee as today, offline included; no keystroke is
    buffered anywhere it is not buffered today.
    **THREE QUESTIONS OWED BEFORE BUILDING** (recorded rather than decided
    unilaterally, since each changes behaviour Nick can feel): (1) reload
    before the first word — `location.state` does not survive a reload (F3
    already ruled that an accepted edge case for `warmStart`), so an unborn
    page reloaded before its first word has nothing to restore, which is
    correct under PB1 but needs a defined fallback; **recommendation: fall back
    to an unborn LOOSE page**, keeping the writer on paper. (2) the plan-board
    pointer — `getOrCreatePlanBoard` writes `planBoardId` onto the PAGE at
    board-creation time, so an unborn board has nothing to point at;
    **recommendation: mint-and-point-at-birth**, pointer and board born in one
    act, so "a board when it has a box" holds without exception. (3)
    `createBoardPage(binderId, title?)` takes a title, and a titled board
    arguably already has content; **recommendation: a titled board is born
    immediately, an untitled one waits for its first box.**
    **S3 — no sweeper**, unchanged and binding: existing empties are never
    deleted by code, and never a background reaper.
    **HOLD (2026-07-26):** all browser/harness runs are held while chat 6 runs
    DF1.1's DoD sweeps; editing, `tsc` and `build:web` are permitted. S1's own
    instructed reproduction (open a New Page, navigate away without typing,
    check Places) is therefore OWED, and nothing above is claimed proven by
    execution — it is a source read, and the reproduction outranks it. No code
    has been changed on the branch; the map is staged in the session scratchpad
    per the "S0 pre-drafts stay out of the repo" rule.
    **FABLE'S FOUR RULINGS — 2026-07-26**, which supersede the three questions
    recorded above: (1) **the birth descriptor goes in the URL, not
    `location.state`** — an unborn page gets its own route carrying origin /
    project / board / title as query params, reload-safe by construction, which
    DISSOLVES the reload question rather than answering it (the door's meaning
    is in the address). (2) **Birth triggers are the first word, or an act that
    creates a durable relationship** — pairing a plan board, porting or pinning
    to a board; a mere setting change (Screenplay ↔ Prose) does NOT birth, being
    cheap and reversible. So PLAN → from an unborn page **births the page, then
    mints the board, then pairs — order fixed**, so the pointer is never
    dangling and no orphan board is ever minted. (3) **A name is content** — a
    titled board is born immediately, stated as the general rule so it settles
    the next case. (4) **Enumerate the unborn surface before writing.**
    Also ruled: the objection to re-adding honor-discard is SUSTAINED (it
    rebuilds the same fragility and leaves tombstones for pages never written —
    Trash litter instead of Places litter), and the diagnosis is accepted as
    better than the brief's own premise: **FX14 is the cause, and Fable's review
    of it missed this.**
    **RULING 4 DISCHARGED — the specification is committed at
    `docs/wrizo-alpha/pb1-unborn-surface.md`**, before a line of the fix. It
    carries: the **door census** (the eight creation doors split by ruling 2's
    own question — four already create a relationship in the same act and are
    UNCHANGED; four create a bare room and become unborn), which **names the
    empty-board source** — `CascadePanels.tsx:277`/`:294` call
    `createBoardPage(project.id)` with no title, and with `getOrCreatePlanBoard`
    idempotent per page these are the only way a DUPLICATE empty board can
    accrue, matching the export's finding; the **unborn route** and its params;
    the **synthetic record** (the unborn surface builds a JournalEntry-shaped
    object from the descriptor and passes it to children unchanged, because
    `useCascade` hard-requires `subject.entry.id` and `ModeStrip.onPublish` is
    required — neither may be loosened for one feature) which **never enters the
    store**, so `getJournalEntry(unbornId)` is null for the whole unborn life;
    the **affordance table** (Star and tags ABSENT — `patchJournalEntry` would
    silently no-op, and a star that does not stick is the definition of
    half-work; Tutor and the rhizome instrument ABSENT via the EXISTING
    first-run-gate precedent `tutor={gateActive ? undefined : …}`; way-back
    non-participating via the existing `participatesInWayBack:false` option;
    TTFK instrumenting but writing no row unless born, via `useSessionLog`'s
    existing `enabled` getter; Publish unchanged because an unborn page has zero
    words BY DEFINITION, so it is identical to today's empty-page behaviour);
    and **birth as one synchronous call** — build the record with the first
    content already in it, save, apply extras, then `replace` the URL, the swap
    AFTER the write so a crash between them loses nothing.
    **Two risks carried forward, named not buried:** (a) ruling 2 forbids
    Screenplay from birthing, so an unborn page must be able to render as a
    SCRIPT — coupling is light (`ScriptEditor.tsx` has two `entry.` reads) but
    it is a second unborn surface and the largest single risk to the July 30
    gate; the fallback to PROPOSE if it threatens the date (never to take
    unilaterally) is that Screenplay on an unborn page becomes the one setting
    that births, disclosed as a deliberate exception. (b) **Empty PAIRED plan
    boards remain possible by design** — ruling 2 makes pairing a birth
    trigger, so PLAN → with no box left after it is a room deliberately opened,
    not one nobody entered; recorded so no future reader mistakes it for
    surviving litter.
    **CALENDAR GATE (Fable, 2026-07-26):** PB1 touches the most core path and
    the brief already names it the one that waits. Nick's corpus is freshly
    wiped, so litter now accrues only from his own testing — the cost of
    waiting is noise, not loss. **If PB1 is not merged AND reviewed by
    2026-07-30 it holds until post-vacation.** Build it right rather than fast.
    **BUILT + VERIFIED, READY TO MERGE — 2026-07-26 (chat 5).** Branch
    `pb1-born-on-first-word` at **`af47582`**, rebased onto `main` `569d3f2`,
    four commits, own worktree, guard-rail before every commit. Zero schema,
    zero server files, zero deps. **NOTE FOR THE MERGER:** the OLDEST commit's
    subject still carries `[DO-NOT-MERGE: unverified]` — that was true when
    written and is left as history rather than rewritten. The branch TIP
    (`af47582`, "PB1 VERIFIED") is the operative signal and this entry is the
    other. **PB1 is clear to merge.**
    - **S1's REPRODUCTION, both halves, as observed fact** (not inference):
      pre-fix at `569d3f2`, Catch persists a row instantly (`text:""`,
      `origin:'journal'`) and leaving without typing leaves **1 live litter row
      and ZERO tombstones** — the absent tombstone being the direct evidence
      that honor-discard no longer runs, exactly as the source read predicted.
      Post-fix: **0 rows** at the door and 0 after leaving.
    - **VERIFICATION: full suite 51/51 CLEAN, both `HARNESS_PARKED` settings**,
      on DF1.1's committed `run-suite.mjs` (fail-fast guard, PID-scoped
      cleanup). `pb1.mjs` 22 checks green both settings. `tsc` ×2 EXIT 0;
      `build:web` clean.
    - **A REAL KEYSTROKE LOSS, FOUND BY THE HARNESS AND FIXED** — the finding of
      this ticket, and it was mine. Birth called `navigate()`, which changed the
      route, which unmounted `/page/new`'s tree and mounted `/page/:id`'s. The
      newly mounted editor does **not** take focus (`ForwardOnlyEditor`'s
      `autoFocus` is gated on the page being EMPTY, and by then it isn't), so
      every keystroke arriving after the remount landed on nothing: a
      58-character burst across the birth boundary persisted as **"The "**.
      Short bursts won the race ("Born" completed), real typing would not have.
      This is precisely the loss the brief forbids. Fixed STRUCTURALLY, not
      statistically: birth no longer changes routes — `history.replaceState`
      updates the address without firing `hashchange`, so HashRouter is never
      notified, the surface is never remounted, and focus is never lost; the
      provider withdraws its handle at birth instead, so way-back, Star, tags,
      the Tutor, the instrument and the debounced autosave all resume with no
      remount. **The burst-integrity check that caught it is committed in
      `pb1.mjs`** and is the check a future change to this path must survive.
    - **THE FIRST FULL SUITE WENT NOT CLEAN — seven reds, all mine, all fixed at
      their own sites** with the mechanism disclosed there (`ea78d48`): `ab3`,
      `b1`, `fx6`, `fx14`, `hb1`, `hb2` each derived a page id from the ADDRESS
      (or read the newest row) immediately after a bare-room door; the SUBJECT in
      every case is the door's semantics, which PB1 preserves — the row simply
      arrives with the first word — so each fixture types one word and reads what
      it always did. `fx14` and `hb2` additionally quote their ORIGINAL assertion
      verbatim, being genuinely falsified on arrival. `ab3` also read the entries
      key with no `|| '[]'` fallback, and with birth-on-content that key can be
      genuinely ABSENT. `cd2`'s Star is absent on an unborn page by design, so it
      births first — and typing dissolves the chrome (A19), which closes the
      cascade panel, so the Page category is re-opened after.
    - **TWO CORRECTIONS ON THE RECORD.** (a) `fx14`'s route assertion had begun
      **PASSING BY ACCIDENT** on `#/page/new?origin=journal`, because its regex
      character class excluded only `/` and that string contains none — a check
      that passes for the wrong reason is worse than one that fails. (b) My own
      claim, written into `pb1.mjs`'s footer, that "PB1 falsifies no committed
      assertion, because the bare-room doors had no row-exists assertion," was
      **false**: those doors were asserted in six places, just never as "a row
      exists" — always as "the row this door made has origin X," the same
      coupling wearing a different coat. **The FX14 regression was one keystroke
      of coverage away from being caught in its own review.** The footer now
      carries that correction instead of the tidy claim.
    - **ONE RED REPORTED UNRESOLVED, not swept under.** `b2-1.mjs` NOVERDICT on
      the FIRST parked pass: `ReferenceError: __click is not defined` in
      `seedProjectWithPlan`, i.e. the harness's injected helpers were missing in
      that file's second `withHarness`. Mechanism check first, never a re-run
      first: it PASSES on clean `origin/main` `569d3f2`, PASSES in a three-file
      batch on this branch, and PASSES in the full parked suite on the second
      pass (51/51). It is harness INFRASTRUCTURE — helper injection — not app
      behaviour, and nothing in PB1 touches `runtime-verify.mjs`. **The flake
      list is empty and this is not being called a flake:** it is recorded as a
      one-off in DF1.1's helper-injection path for chat 6's lane. If it recurs,
      it belongs there.
    - **S3 NO SWEEPER, verified against the diff and in the harness:** no
      deletion, no soft-delete, no reaper, no timer. A seeded pre-existing empty
      page survives a round trip through both an unborn and a born surface,
      untouched, with zero tombstones minted anywhere.
    **DoD: the app stops collecting rooms nobody entered.** — MET, pending
    Fable's same-day review on `af47582`.
    **REVIEWED, GREEN (2026-07-30).** Merged `e8ae17d`; review at
    `docs/wrizo-alpha/pb1-review-fable.md`; gate MET. **Merged-but-undeployed —
    rides P2b, named in its manifest.** OBS-1 (unborn-Screenplay surface flip) to
    the next sitting. **→ ANSWERED-BY-DEFECT (2026-08-17): item 104 — Screenplay selection is
    DEAD on an unborn page (both the New Page template icon and the Draft Structure toggle no-op
    silently). The flip is a dead control, not a design question; fix family is the unborn
    descriptor carrying STRUCTURE, packaged with item 87.** Note: main now carries `pb1.mjs`, so chat 6's suite of record
    at its rebased head is **52 files, not 51**.
    **DEPLOYED with P2b — 2026-07-30** (git `c266cb3` · railway `dfa03148`); rode the FX17
    SHA per the stamp law. See the P2b DEPLOY MANIFEST.
72. **FX16 — the Invite, Truly Silent.** **OPENED — 2026-07-25 (chat 1)**, from the P2
    wave (`docs/wrizo-alpha/p2-wave.md` §FX16), authority SV18 — the first-line invite
    STILL renders on a fresh page after FX15 (Nick's walk of the deployed tree: "a door
    left open" + its dismiss line, present by default). FX15 built this surface; the same
    lane closes it. Branch `fx16-invite-silent` off `main`, own worktree, guard-rail,
    ledger on `main` (fetch-before + push-same-breath); item number ASSIGNED (72), not
    claimed; **ZERO SCHEMA, ZERO SERVER FILES**; merges through chat 1's lane, Fable
    reviews post-merge, one deploy word covers the wave. **S1 — root-cause FIRST (no patch
    before the mechanism is named):** two candidates — (a, prime suspect) a persisted
    pre-FX15 value (`wrizo-first-line-invite`=`on`, written by an older build) overriding
    the new silent default (a stored explicit value beats a changed default → correct for
    new users, broken for existing ones); (b) the render path ignores the setting.
    Reproduce on a CLEARED profile AND on one carrying the value; NAME which in the commit.
    **S2 — fix at that root:** if (a), a one-time migration that RETIRES the stale key so
    the new default governs — never a silent overwrite of a deliberately-set value (an
    explicit post-FX15 opt-in survives); if (b), fix the gate. **S3 — the harness closes
    the hole FX15 left:** `fx15.mjs` proved silence on a CLEAN profile; add the escaped
    case — a profile carrying the legacy value renders no invite (that absence is the whole
    ticket). Both HARNESS_PARKED settings; A4 parks (verbatim + successor in the same
    commit) for anything falsified; full suite before merge. **DoD: a fresh page says
    nothing, on a new profile and on Nick's.** FX18 follows.
    **MERGED — 2026-07-25, merge `48dc027`** (chat 1's lane; re-merged onto origin's latest
    after the SC2/BG2 records advances). **S1 root-cause NAMED = hypothesis (a),
    Nick-confirmed by console:** a value stored `wrizo-first-line-invite`='on' by the
    pre-FX15 build (a tap of F6's then-default-shown affordance) overrode FX15's silent
    default; the render path is correct (a cleared profile is silent). **S2:** one-time
    marker-guarded migration (`migrateInvitePref`, guarded by `wrizo-first-line-invite-migrated`)
    retires the stale 'on'; a deliberate opt-in made afterward survives. **SV31 folded in
    (Fable, same ticket):** the "Write…" placeholder is removed from the empty page
    (PageEditor `placeholder=''`); fx15.mjs's placeholder assertion is A4-parked + re-pointed
    to "no placeholder text." New `fx16.mjs` (6 checks: escaped legacy-'on' → no invite;
    opt-in survives; 'never' untouched; fresh no-op; SV31 no-placeholder); fx15.mjs's on-seed
    gains the marker (fixture re-point, assertions unchanged). **Verified at merge HEAD:**
    `tsc` ×3 EXIT 0; `build:web` clean; full suite BOTH settings — **ARMED 48/48 GREEN,
    UNARMED 47 GREEN + the known `j5.mjs` flake** (DF1.1's; OUTSIDE FX16's blast radius —
    FX16 touches no Journal-spread code; j5 passed ARMED this run; REPORTED, not re-run per
    Fable's P2 invariant — the SC lane reported the same at `e4a5521`). **GREEN; deploy HELD**
    for the P2 wave's one word (FX16 · BG2 · FX17 · FX18) + one manifest; Fable's review +
    Nick's sitting follow the deploy. FX18 next.
73. **BG2 — the Beginnings, Seen.** **OPENED + BUILDING — 2026-07-25 (chat 5)**, from the
    P2 wave (`p2-wave.md` §BG2), authority SV19 + SV20 — Nick's walk of the deployed P1
    tree, where the row this lane shipped in BG1 (item 67) was "much too small," he "can
    barely see" it, and the page's row read as a footnote rather than a set of modes.
    Chat 5 built BG1; the shapes are its own. Branch `bg2-beginnings-seen` off `main`, own
    worktree, guard-rail, ledger on `main`; **ZERO SCHEMA, ZERO SERVER FILES**; merges
    through chat 1's lane, Fable reviews post-merge, one deploy word covers the wave.
    **S1 — the grammar revised in ONE place** (`BeginningsRow`), both surfaces inheriting:
    icons ABOVE labels (was inline), ~50% larger in glyph, label and hit target, and the
    at-rest colour a dark olive that carries against cream. Lane law unchanged and now
    asserted as a law: dark olive at rest, brass on hover, orange only on press.
    **S2 — the page's row is centered on the sheet**, reading as a set of modes; this
    SUPERSEDES the committee's "furniture beside the cursor" by Nick's own word.
    Unchanged and re-proven: the caret is live from the first frame, typing dismisses the
    row, the row never gates writing. **S3 — the board's row keeps its placement** (SV20:
    already correct) and takes S1's sizing and colour. Harness: geometry re-pointed to the
    new sizes, contrast asserted as a COMPUTED value against the ground, types-immediately
    re-proven at the new placement, the 1366×768 leg for both rows; A4 parks with verbatim
    originals and named successors in the same commit as the change that falsified them.
    **DoD: Nick sees three doors and knows instantly they are choices.**
    **BUILT + PUSHED, AWAITING MERGE — 2026-07-25 (chat 5).** Branch
    `bg2-beginnings-seen` at `e6b8e9a`, off `main` `1bcc843`, own worktree,
    guard-rail before every commit. Zero schema, zero server files, zero deps.
    Touches two files (`index.css`, `bg1.mjs`) plus the new `bg2.mjs` — no
    component change was needed: icons-above-labels is a flex direction, so the
    markup BG1 shipped already carried it.
    - **The measurement that justifies the ticket.** `--accent-rest` (#96a05a),
      BG1's door colour, measures **2.4:1** against `--paper` — Nick's "can
      barely see" is a real contrast failure, not a preference. New slotted
      token **`--accent-door` = #4F5730** (the same olive ramp stepped down in
      value; the darkened end already used as the board pin's rim) at **6.6:1**.
      A separate token rather than a re-tune of `--accent-rest`, which would
      have dragged every mode-tab hairline and thread line with it.
    - **Slotted per theme, not hardcoded.** Both surfaces render on `var(--paper)`
      (the page sheet and the board canvas alike), so the one theme whose paper
      is dark (`flux`/`page:dark`) steps back UP the ramp to **#A9B56A, 7.3:1**.
      A value that only worked on cream would have been a trap laid for that
      theme; asserted in `bg2.mjs`.
    - **The resting opacity (.72) is RETIRED** — a translucent door makes the
      measured colour differ from the seen one, which would have made this
      ticket's own contrast assertion a half-truth. The door is quiet by value.
    - **Sizes:** glyph 16→24px, label 13→19px, and the door becomes a genuine
      hit target (≥44px both axes) instead of a word to aim at.
    - **A defect found and fixed in the build, not shipped:** at the new size the
      row silently WRAPPED to two lines — an absolutely-positioned shrink-to-fit
      box at `left:50%` is offered only half the room. Both surfaces now span
      the surface (`left:0/right:0`) and let flexbox centre them, so the row
      cannot become the grid BG1's law forbids.
    - **A4 parks, in the same commit as the change that falsified them:**
      `bg1.mjs`'s resting-paint check and its 1366×768 page-placement check,
      verbatim, successor `bg2.mjs`. The second is worth reading — centering
      makes the original's geometry (row vs first line) not merely false but
      *meaningless*, so the SUBJECT ("the caret's own line stays clear of
      furniture") is re-asserted where it actually lives: no DOOR overlaps the
      caret (caret x≈416, leftmost door x≈521) and the caret point still
      hit-tests to `.forward-only-editor`. That check also runs LIVE in `bg2.mjs`.
    - **Verification.** `bg2.mjs` 23 checks and `bg1.mjs` 35 live + 2 parked,
      PASS both `HARNESS_PARKED` settings. Contrast is COMPUTED (WCAG relative
      luminance against the first opaque ancestor background), never eyeballed;
      rest/hover/press proven under a TRUSTED pointer. **Full suite 48/48 GREEN
      both settings** — 1904 checks unset, 2049 armed, zero failures. `tsc` ×2
      EXIT 0; `build:web` clean.
    - **Two harness defects of my own, found and fixed before commit** (neither
      ever a build fault): the trusted press sampled `:active` by pressing a
      real door, which *fired* it — the board gained a card and the row
      correctly vanished mid-scenario; the press now releases off-target so the
      activation is cancelled, and the row's survival is itself asserted. And a
      CSS comment I inserted landed outside an existing `*/`, silently voiding
      the placement rule (`position: static`) — caught by measuring the DOM
      rather than trusting the screenshot.
    - **Session note (the standing invariant working):** one `bg2.mjs` run died
      at boot with "CDP page target never appeared." Mechanism check first, per
      the P2 rule: 23 browsers and 3 harness processes alive, **none of them
      this session's** (two invoked from the repo root — a different lane).
      External contention, not a defect; re-run as a batch, green. No sweep was
      performed — cleanup stays scoped to PIDs this session spawned.
74. **FX17 — the Board's Floor.** **OPENED + S1 ROOT-CAUSED — 2026-07-26 (chat 6)**, from
    the P2 wave (`p2-wave.md` §FX17, authority SV21/SV22/SV23; FX13 gave the board its
    height law, this finishes it). Branch `fx17-boards-floor` off `main` @ `a260723`, own
    worktree, guard-rail before every commit; **ZERO SCHEMA, ZERO SERVER**; merges through
    chat 1's lane, Fable reviews post-merge, deploy is the P2 wave's own word. *(The
    assignment reached this lane late — the brief was on disk at `5048d58` the whole time;
    recorded so the relay gap is visible, not to re-litigate it.)*
    **S1 (SV22) — THE STUTTER, ROOT-CAUSED BEFORE ANY PATCH, and it is a genuine
    closed-loop layout thrash.** Reproduced under TRUSTED pointer (`Input.dispatchMouseEvent`
    — real mouse press/move/release, not synthetic PointerEvents) at the mandatory
    **1366×768** leg, sampling the page's own frame clock through a full bottom-edge drag.
    **The measurement: 142 frames, 71 vertical-scrollbar FLIPS — one every other frame,
    ~30Hz — with `.board-canvas-wrap`'s `clientWidth` oscillating 1098↔1088 (10px, exactly
    the scrollbar) and the canvas width in lockstep. The dragged card reached only
    y=0.349 of a full-height drag: it never gets near the floor.** **THE MECHANISM, named:
    the canvas's HEIGHT is computed from its WIDTH, and the width is measured with
    `clientWidth`, which the scrollbar changes.** `contentMinHeightPx = (maxBottom(boxes) +
    0.08) * pageWidthPx` (BoardEditor.tsx ~L1562) and `pageWidthPx = containerWidthPx =
    max(320, wrapRef.clientWidth)` (~L829/L887, a `ResizeObserver` on the WRAP ITSELF). So:
    drag down → `maxBottom` grows → canvas height grows → it crosses the wrap's available
    height → the vertical scrollbar appears → `clientWidth` drops 10px → `pageWidthPx`
    shrinks → **the height, being derived from the width, shrinks with it** → the content
    fits again → the scrollbar vanishes → the width returns → the height grows → it
    relatches. One cycle per React render (`onMove` calls `setBoxes` on EVERY pointermove,
    ~L1438), which is why it runs at frame rate. The drag delta itself (`dy = (clientY -
    startY) / pageWidthPx`) is scaled by the same oscillating value, so the card's computed
    position jitters too — the felt "freeze". **This is the brief's "re-render loop"
    candidate, not the auto-scroll or per-event-clamp candidates.** **The asymmetry that
    allowed it:** FX13 already installed a THRASH GUARD on the HEIGHT observer — it watches
    `.desk-frame-stage`, never the wrap, with the comment "the wrap's own height can never
    feed back into it" — but the WIDTH observer watches the wrap itself, which is precisely
    the feedback path that guard exists to forbid. The guard was built on one axis and
    omitted on the other. **Fix lands at that root** (house precedent in-tree: SC1 S4's
    `scrollbar-gutter:stable both-edges` on `.desk-frame-scroll-cap`, index.css L2693).
    **S2–S4 remaining:** the floor with its border (1366×768 asserted), grow-then-hard-stop
    with the limit NAMED in code and ledger, and fit-to-content (the minimal reading — a
    zoom slider is post-vacation). **S4 is the slice that yields if the freeze presses;
    S1 is what must not survive.** **DoD:** a card can be dragged anywhere on a board that
    reaches its floor, and the whole board can be seen at once.
    **S1+S2+S3 BUILT + VERIFIED; MERGE OFFERED — 2026-07-30 (chat 6).** Branch
    `fx17-boards-floor` @ **`ef7429c`**, REBASED onto `main` @ `f721d16` (clean, zero
    conflicts), own worktree, guard-rail before every commit; `tsc` x2 EXIT 0;
    `build:web` clean; ZERO SCHEMA, ZERO SERVER, ZERO deps. **S4 YIELDED on Fable's
    categorical ruling — now item 78, post-vacation.**
    **THE STATED LIMIT, NAMED HERE AS SV22 REQUIRES: `BOARD_MAX_Y = 3` — three
    page-widths tall** (with `BOARD_BREATHING_ROOM = 0.08`, the same term the auto-height
    formula already adds below the lowest card). Deliberately expressed in the board's OWN
    normalized coordinate system, not in pixels and not in screenfuls, so a board's extent
    cannot change when the window does — a viewport-relative limit would let the same
    board be dragged further on a tall monitor than on a laptop, and would move the floor
    under already-saved cards on a resize. Fable ratified the unit choice as this slice's
    architecture decision. One number, so a future ruling changes one line — and
    `fx17.mjs` hard-codes it deliberately, so moving it REDS the harness and forces this
    entry to be updated with it.
    **S1 (SV22) — the stutter, root-caused before any patch and fixed at that root.**
    A closed width<->height feedback loop: the canvas's HEIGHT is derived from its WIDTH
    (`contentMinHeightPx = (maxBottom + 0.08) * pageWidthPx`) while that width was measured
    as `wrapRef.clientWidth`, which the scrollbar changes. Dragging down grew the canvas,
    crossed the wrap's height, raised the scrollbar, cost 10px of `clientWidth`, shrank
    `pageWidthPx`, shrank the height with it, dropped the scrollbar, and relatched — one
    cycle per React render (`onMove` calls `setBoxes` on every pointermove), so it ran at
    frame rate. Measured under TRUSTED pointer at 1366x768 on the page's own frame clock:
    **142 frames, 71 gutter flips (one every other frame), `clientWidth` oscillating
    1098<->1088, and the card reaching only y=0.349.** FIX: `scrollbar-gutter:stable` on
    `.board-canvas-wrap` — the measured width stops depending on the scrollbar, removing
    the feedback EDGE at its source (a threshold guard could not have worked: the change is
    a full 10px). **This closed the axis FX13 left open** — FX13 guarded the HEIGHT
    observer ("the wrap's own height can never feed back into it", watching
    `.desk-frame-stage`) while the WIDTH observer watched the wrap ITSELF. After: **0 flips,
    single-valued width.**
    **S2 (SV21) — the floor.** The canvas's floor was a fixed constant
    (VIEWPORT_MIN_PX, 560) while the wrap carries `maxHeight` not `height`, so a
    lightly-populated board shrink-wrapped and DECLINED the room FX13 had already measured:
    at 1366x768 the stage ended at 722 and the wrap at 683 — **39px granted and
    unspent.** The floor is now the ROOM (`availHeightPx`) when the room is known; legacy
    (<1100px, no stage) keeps the constant and is byte-identical. The **2px border term** is
    not a fudge: `availHeightPx` is the wrap's OUTER height (border-box), so flooring at it
    overflowed by exactly 2px and left a permanent pointless scroll (599 vs 597) — a
    board that always has something to scroll has not reached its floor. Subtracting the
    border rather than measuring `clientHeight` keeps the edge ACYCLIC: `clientHeight`
    shrinks when a HORIZONTAL scrollbar appears, which is S1's shape on the other axis.
    After: wrap bottom **720** vs stage **722**; canvas == clientH == scrollH == **597**,
    residual scroll **ZERO**.
    **S3 (SV22) — grows, then stops.** The stop is enforced at the GESTURE, clamping
    the shared `dy` rather than each box: a per-box clamp would let the lowest card of a
    grouped selection land while the others kept travelling, visibly deforming it —
    Fable RATIFIED the delta-clamp as what no-rubber-banding means for a selection. The stop
    is EXACT, not approximate: clamp and height formula share the 0.08 term, so the canvas
    reaches `BOARD_MAX_Y x pageWidthPx` on the very frame the card stops (measured **3264 ==
    3 x 1088, to the pixel**) — no dead zone travelled first, nothing left to spring
    back from. The canvas HEIGHT itself is deliberately NOT capped (Fable: clip-nothing
    outranks the limit), so nothing can be clipped if a card reaches deep water by a path a
    drag does not control.
    **X-AXIS ASYMMETRY, NOTED AND DELIBERATELY UNTOUCHED (Fable's ruling):** the x-axis
    keeps its per-box `Math.max(0, ...)` clamp, so a grouped selection CAN still deform
    against the LEFT wall. Side-wall feel is Nick's-hardware material, post-vacation if
    ever; recorded here so the asymmetry is a known choice rather than an oversight.
    **VERIFICATION.** `fx17.mjs` NEW — **PASS 18**, both `HARNESS_PARKED` settings;
    every drag on a TRUSTED pointer (`Input.dispatchMouseEvent`, never a synthetic replay),
    fixtures adopted from `fx13.mjs` verbatim, frame-clock sampling done INSIDE the page so
    no CDP round-trip can hide an oscillation. Asserts: the gutter reserved with nothing to
    scroll; 144 frames / 0 flips / single-valued widths / 19 heights and 0 drops; the floor
    and the 1088 standing width; the hard stop at exactly 2.92; the exactness; **the
    group-shape invariant** (a pair's separation byte-identical, 0.2 -> 0.2, across a drag
    that drives the LOWER card into the floor); and **a limit stops, it never relocates** (a
    card seeded at y=3.60 keeps y=3.60 EXACTLY through a sideways drag while x moves
    freely). Parks NOTHING — FX17 falsified no pre-existing assertion, and fx13's height
    law is STRENGTHENED, confirmed by fx13 green in the sweep. **SUITE OF RECORD at the
    rebased head: 52/52 CLEAN, BOTH settings, zero re-runs** (07:39-08:22 on 2026-07-30,
    via DF1.1's committed runner). `fx18.mjs` PASS 16 and `bg2.mjs` PASS 23 green at the
    rebased head — the board-geometry-adjacent files see FX17's changes, as Fable
    required. **P2b: FX17 deploys ALONE on Nick's standing word once merged.**
    **GREEN + DEPLOYED with P2b — 2026-07-30** (git `c266cb3` · railway `dfa03148`) — NOT
    alone after all: PB1 merged between P2a and P2b, so per the stamp law FX17 + PB1 rode the
    same SHA. See the P2b DEPLOY MANIFEST. Stays open for Fable's post-merge review + the sitting.
75. **FX18 — the Chrome Aligned.** **OPENED — 2026-07-25 (chat 1, after FX16)**, from the
    P2 wave (`p2-wave.md` §FX18), authority SV24–SV27 + the screenplay's instance of SV26.
    Branch `fx18-chrome-aligned` off `main` (after FX16 lands), own worktree, guard-rail,
    ledger on `main`; item ASSIGNED (75); **ZERO SCHEMA, ZERO SERVER FILES**; merges
    through chat 1's lane, Fable reviews post-merge, shared deploy word. **S1 — the arrow
    mirrors (SV25):** the right-hand drawer handle points right, the left points left; one
    glyph, GREP every surface that mounts a drawer (Nick found it on two; likely more).
    **S2 — panels don't overlap each other or the page (SV24, SV26):** the Board's Tutor
    panel overruns the app edge + covers its own close arrow; an opened right-hand panel
    overlaps an opened left-hand toolbar, blocking controls beneath (the Typewriter toggle
    named; the screenplay surface shows the same). ROOT-CAUSE ONCE (one layout law failing
    in several places), fix so any combination of open panels, on any surface, at every
    asserted width, leaves both panels wholly in the room + every control hit-testable.
    Harness: the COMBINATORIAL case — both panels open, on Page/Board/Script, at
    1100/1366×768/2200, no overlap, every control hit-testable. **S3 — the Board's top
    menu parallels the Page's (SV27):** ALL CAPS, right-aligned, matching the Page's mode
    strip; words + behaviour unchanged, only presentation; A4 parks for falsified
    assertions. **DoD: no panel covers another, no arrow lies about its direction, the two
    top menus look like siblings.**

76. **SC2-S5 — dissolution (one flat element flow, sheets as backdrops).** **OPEN —
    2026-07-30; post-vacation.** Ruled conditions: (a) cross-check 3's stronger successor
    exists BEFORE any build; (b) `sc2.mjs`'s class-alive assertion FLIPS to asserting
    preservation — tightened, never quietly satisfied; (c) in-flight IME, non-collapsed
    selection, and native undo across the break are in-scope acceptance criteria.
    **(d) — ADDED 2026-07-31 (Fable), the sibling of item 62's close-out condition:** the
    dissolution **RE-ESTABLISHES Amendment 1's bound FROM SCRATCH as part of its own DoD**
    — a fresh interleaved baseline-vs-tip measurement on the judging machine, not an
    inheritance of SC2's 1.10×. The bound was not re-run at the SC2 merge head by Fable's
    ruling of 2026-07-31 (reasoning in item 62), so this item may not lean on it: the
    dissolution rewrites the element flow the figure was measured over.
77. **Harness-infra pair — chat 6's lane.** **OPEN — 2026-07-30; non-blocking, required
    before any future A/B gate.** (a) `withHarness` `opts.dist` is DISHONEST — serves the
    given `index.html` but resolves `/assets` against the default `dist-web`; near-miss
    class: an asset-hash collision silently compares a build against itself with plausible
    numbers. Make it honest or amputate the parameter. (b) `b2-1.mjs` first-parked-pass
    NOVERDICT ("__click is not defined") — diagnose, never clear. **(c) THE DEFAULT DIST IS
    UNTRACKED, UNSTAMPED, AND INVISIBLE TO EVERY PROVENANCE CLAIM — the generalized
    species of (a), ratified structural by Fable 2026-07-31 on chat 6's item-82
    diagnosis.** `withHarness` serves `DEFAULT_DIST = apps/desktop/dist-web`, a BUILD
    ARTIFACT; `dist-web/` is gitignored (`.gitignore:8`) with ZERO tracked files. **A tree
    SHA therefore does not pin what a suite tested** — two worktrees at byte-identical
    `apps/` can serve entirely different applications depending on when each last built.
    **Demonstrated on disk, not argued:** `.claude/worktrees/sc2-the-clock` at HEAD
    `9503515` (+995/-41 lines of SC2 app source) serves `index-CubIOguU.js`,
    **byte-identical** (523,769 bytes, `cmp` clean) to chat 6's clean-main control build of
    `9b30273`, with `scriptPaginate` absent from both — a tree and its served bundle
    disagreeing by ~1000 lines, live. FIX (harness-only, fix-class, scheduled AFTER the
    diagnosis — do not change the instrument mid-measurement): the runner stamps the served
    bundle's asset hash into every verdict record, and a suite of record rebuilds
    immediately before running. **INTERIM DISCIPLINE, EFFECTIVE NOW (Fable):** every suite
    claim any lane makes names **tree SHA + served asset hash**, and suites of record
    rebuild first.
    **(c) BUILT + VERIFIED; MERGE OFFERED — 2026-07-31 (chat 6).** Branch
    `item77c-bundle-stamp` @ **`3527928`** (WIP marker `a26a810` on top — empty, tree
    object IDENTICAL to the fix, so it changes no code), off `main` @ `bd0b4a0`;
    HARNESS/TOOLING ONLY — zero `src`, zero schema, zero server, zero deps; nothing
    ships. **Both halves of the ruling, mechanised:** (i) every verdict record now
    carries `tree=<sha>[+Ndirty] bundle=<asset-hash>/<bytes>` — on `SUITE START`, on
    `SUITE RESULT` (the line a report quotes), and in a machine-readable
    `manifest.json` beside the logs; (ii) a suite REBUILDS before running, and a
    FAILED rebuild **REFUSES** the suite rather than degrading to an unknown stale
    bundle. `--no-rebuild` survives for iteration and is stamped `NO-REBUILD`, so a
    result produced without it can never masquerade as a suite of record. The
    **dirty-file count is part of the stamp on purpose** — an identity claim must
    never outrun what is actually known (Fable ratified both decisions).
    **VERIFIED BY PLANTING THE FAILURE, not by asserting the path:** `dist-web` was
    DELETED, then `--only fx12.mjs` run; the runner rebuilt it unprompted, passed, and
    emitted the stamp on both lines with a matching manifest. A stamp that only ever
    reports success proves nothing.
    **SUITE OF RECORD — the first stamped results in this project's history:**
    **PARKED `SUITE RESULT: CLEAN — tree=3527928 bundle=index-CubIOguU.js/523769b`
    (52/52, dirtyFiles 0, rebuiltBeforeRun true)** and **DEFAULT `SUITE RESULT: CLEAN
    — tree=a26a810 bundle=index-CubIOguU.js/523769b` (52/52)**. The two halves carry
    DIFFERENT tree SHAs (the empty marker landed between them) and the SAME bundle
    hash and byte count — so they are provably the same software, which is exactly the
    comparison item 82's control could not make about itself. **Disclosed:** an earlier
    attempt at the default half was REFUSED at second zero against 16 foreign browsers
    (SC2's window) — the guard working as ruled, scheduling not error; that attempt
    produced no result and none is cited. A defect in this lane's own scratch driver
    (no halt-on-nonzero, unlike the DF1.1 DoD driver) let the pair continue past that
    refusal; scratch tooling, uncommitted, recorded because it is the same class this
    arc keeps catching. **Merge is harness-only, zero-schema, pre-authorized class;
    it needs no browser and may process during any window.**
    **→ MERGED — 2026-07-31 (chat 1), merge `c2a351f`.** The DO-NOT-MERGE marker `a26a810` was
    honored-through per chat 6's explicit offer (Fable-ratified): **verified** empty, its tree
    object byte-identical to the fix `3527928` (tree `03c8081`), so the merged tree IS the
    verified fix. Harness-only (`run-suite.mjs` +84/−5); docs-only three-way over current main,
    no contention, no re-verification owed. **Item 77(c) MERGED.** The runner now stamps
    `tree + bundle` into every verdict and rebuilds before running — the deploy.md discipline,
    executable in the instrument.
    **→ REVIEWED, GREEN (2026-08-01), Fable** — `docs/wrizo-alpha/item77c-review-fable.md`;
    VERDICT PASS. The stamp reads identity from what will be SERVED (hashed asset names +
    on-disk byte count, never build logs); a git failure stamps `tree=unknown` rather than
    lying; rebuild-first REFUSES (exit 2, distinct from NOT CLEAN's 1); `--no-rebuild` is
    stamped, structurally unable to masquerade as a record. Teeth **(a)/(b) remain OPEN**
    (chat 6's lane). **Board-note precision (Fable): SC2's window FOLLOWS chat 6's m4/th2 fix
    — a SEQUENCE, not merely Nick's timing.**

## P1 POST-MERGE REVIEW BATCH — 2026-07-31 (Fable, via chat 1's records lane) — CLOSES THE REVIEW LEDGER

The P1 wave's four post-merge reviews. All PASS. Verdict files committed this records commit:
- item 68 · **FX15 — REVIEWED, GREEN.** `docs/wrizo-alpha/fx15-review-fable.md`.
- item 69 · **HB2-lite — REVIEWED, GREEN.** `docs/wrizo-alpha/hb2lite-review-fable.md`.
- item 70 · **M4 — REVIEWED, GREEN.** `docs/wrizo-alpha/m4-review-fable.md`.
- item 67 · **BG1 — REVIEWED, GREEN.** `docs/wrizo-alpha/bg1-review-fable.md`.

**REVIEW STATE — the review ledger is CLEAR.** Every deployed ticket is now reviewed: P1
(67 / 68 / 69 / 70), SC1 (prior desk), P2 (66 / 71 / 72 / 73 / 74 / 75). No post-merge review
is owed.

## P2 POST-MERGE REVIEW BATCH — 2026-07-31 (Fable, via chat 1's records lane)

All PASS. Verdict files committed this records commit:
- item 72 · **FX16 — REVIEWED, GREEN.** `docs/wrizo-alpha/fx16-review-fable.md`.
- item 73 · **BG2 — REVIEWED, GREEN.** `docs/wrizo-alpha/bg2-review-fable.md`.
- item 75 · **FX18 — REVIEWED, GREEN.** `docs/wrizo-alpha/fx18-review-fable.md`.
- item 66 · **DF1.1 — REVIEWED, GREEN.** `docs/wrizo-alpha/df11-review-fable.md`.
- item 71 · **PB1 — REVIEWED, GREEN** (`pb1-review-fable.md`, committed `b9442dc`).
- item 74 · **FX17 — Fable's verdict is REVIEWED, GREEN**, but its review FILE
  (`fx17-review-fable.md`, "the earlier paste") **did NOT reach chat 1** — HELD pending
  re-send, to be committed on receipt. Flagged, NOT fabricated (the verdict is Fable's to
  write, not chat 1's to invent).
  → **RESOLVED 2026-07-31:** the paste reached chat 1; `docs/wrizo-alpha/fx17-review-fable.md`
  committed verbatim (the deploy-of-record `dfa03148` in the file is deliberate per Fable —
  the deploy at review time; the rotation to `11b612db` is covered by the stamp annotation
  above). **Item 74 REVIEWED, GREEN. The P2 house is now FULLY reviewed — 66 / 71 / 72 / 73 /
  74 / 75 all GREEN, all verdict files committed.** OBS-2 (resize past `BOARD_MAX_Y` — gap or
  freedom) noted non-blocking to the item-78 neighborhood, post-vacation.

**Review state:** the P2 house is reviewed GREEN — 66 / 71 / 72 / 73 / 75 files committed;
**FX17 (74)'s verdict is GREEN but its file awaits the relay paste** (see above). Owed next:
the P1 four (FX15, HB2-lite, M4, BG1) — Fable's desk.

**ROLLBACK RATCHET (explicit, 2026-07-31):** the next ship's rollback target is now git
`c266cb3` · railway `11b612db`. `dfa03148` is SUPERSEDED — rolling to it would resurrect the
pre-rotation Tutor key. **Caveat for the record:** if the old provider key is ever revoked,
every deployment before `11b612db` carries a dead Tutor key; annotate the stamp again at that
moment.

## ROSTER (Draft four-chip) DEPLOY MANIFEST — 2026-09-03 (chat 1, on Nick's standing "ship whatever we can" — Fable PASS)

**THE DRAFT ROSTER — the four-chip row in Draft (three staging asks + TD4's selection ask), the v4
disclosure in annotation form, `useSurfaceSelection`, and the server-side selection handling.** Gate
chain: Nick's standing ship word ("ship whatever we can") → Fable's review **VERDICT PASS**
(`docs/wrizo-alpha/roster-review-fable.md` @ merge `679015b`). **ZERO SCHEMA.** Deploying `main` HEAD
**`7b78090`** (merge `679015b` of `item84-roster @ 8685d3f` + the arithmetic-catch canon rider + the
review record).

**⚠ SERVER-BEHAVIOR CHANGE — REVIEWED AND BLESSED (Fable, 2026-09-02):** `apps/server/src/tutor.ts`
(+36) now accepts ONE optional `selection` field on the Bible's exact validation terms (absent / never
empty / capped at `MAX_SELECTION_CHARS` with the delta's backstop), spliced delimited as
`<selected-stretch>`, last-of-three, NEVER persisted; the button law is enforced client-side (the
server never invents the key). A production server-behavior change (unlike the fix wave's zero-server),
reviewed whole and blessed by Fable. **ZERO SCHEMA** (no DDL / column / migration; `apps/server/migrations`
untouched).

**Deploy-ships-a-SHA enumeration (`a9d3ae1..7b78090`):**
- `679015b` — Merge item84-roster @ `8685d3f` (four-chip roster + selection ask + v4 disclosure +
  item84b.mjs + tu2 park)
- `843d5df` — Records: the arithmetic-catch canon rider (docs)
- `7b78090` — Records: the roster review (docs)

**New PRODUCT code since the last live build (`a9d3ae1` · railway `8cbc0b18`) — verified
`a9d3ae1..7b78090`, 20 files, +1219/−44, ZERO schema:**
- `Tutor.tsx` (+216 — the four-chip roster + selection wiring), `useSurfaceSelection.ts` (new +61 —
  the selection hook, A13-safe: a plain string crosses, nothing writable), `deskLexicon.ts` (+47 —
  roster strings + v4 disclosure), `tutorDisclosure.ts` (+13 — v4 annotation form), `api.ts` (+9 —
  client selection field), `ScriptEditor.tsx` (+12), `PageEditor.tsx` (+11), `index.css` (+37).
- **SERVER:** `tutor.ts` (+36) — the selection field (reviewed + blessed, above).
- Harness (not in bundle): `item84b.mjs` (new +692, 60 checks) + parks
  (tu1 / tu2 / tu5 / item84 / fx12 / fx18 / m2 / m3 / m4).

**Records since `a9d3ae1` (docs):** the canon rider + the roster review + this manifest.

**Verified — fresh suite of record at the deploy HEAD (`7b78090`), BOTH settings, machine-clear (NOT
contaminated):** **66/66 UNSET (CLEAN) and 66/66 PARKED (CLEAN)** at
`bundle=index-Z119zo1S.js/553267b` (CSS `index-Ch_dAVk5.css`) — the SAME bundle the offer stamped.
`tsc` ×2 EXIT 0 (desktop + server); `build:web` clean.

**TREE AT UPLOAD — one stray, ENUMERATED AND AUTHORIZED (Fable, 2026-09-03):**
`docs/menus/item83-errata-build-brief.md` — the MENU desk's ratified errata build brief (downloaded by
Nick), docs-only and INERT to the bundle (proven: the parked stamp's `+1dirty` carried the IDENTICAL
bundle `Z119zo1S` as the clean default `+0dirty` run). Authorized under the CLEAN TREE AT UPLOAD law's
exception clause; NOT deleted; committed post-stamp as a records commit (MENU-desk authorship).

**Build OS + toolchain:** suite host Windows / Node `v24.13.0`; deploy build Railway Linux/nixpacks /
Node 18.

**ROLLBACK TARGET (ratchet from): git `a9d3ae1` · railway `8cbc0b18`** — the fix wave. Zero schema
this ship, so rollback is a clean redeploy of that tree. *(Server-change rollback note: the
`selection` field is optional and additive — a rollback build simply never reads it; no client depends
on a changed server response shape.)*

**DEPLOY STAMP: git `7b78090` · railway build `815091f6-e0bc-4e71-8941-7e04e677749e`** — DEPLOYED
2026-09-03 (`railway up --ci` from the primary checkout; item-98 guard PROJECT + TREE verified:
`writer-studio` / `production` / `writer-studio-app`, tree = one enumerated/authorized docs stray;
image `sha256:f0d56028`). Verified LIVE: `/healthz` **200**, served **`index-Z119zo1S.js` +
`index-Ch_dAVk5.css`**, `/auth/me` **401**.

**✔ SERVED == TESTED, BYTE-IDENTICAL (md5-verified, both assets).** Served JS `index-Z119zo1S.js` =
**553,267 b**, md5 `c19b36a807ef1384558bdbafd304408a` == local suite build; served CSS
`index-Ch_dAVk5.css` md5 `9f13a0c520cddcb2ed5fbc73b8e8cc96` == local. Windows suite == Linux Railway
== served. Every-ship served-vs-stamped diff: **MATCH.**

## FIX WAVE (E4 + E3 + 118a-ii + ab2) DEPLOY MANIFEST — 2026-09-02 (chat 1, on Nick's standing "ship whatever we can" — Fable PASS)

**THE FIX WAVE — E4 (the right hand mounts from first paint) + E3 (the Counsel fades out) + item
118(a-ii) (the resting card via the popup decoration engine) + the ab2 re-point + the lawful PB1
park.** Gate chain: Nick's standing ship word ("ship whatever we can") → Fable's review **VERDICT
PASS** (`docs/wrizo-alpha/fix-wave-review-fable.md` @ merge `a20b51f`). **ZERO SCHEMA / ZERO SERVER.**
Deploying `main` HEAD **`a9d3ae1`** (merge `a20b51f` of `fix-wave-e34-118 @ 17c1274` + the review
record).

**Deploy-ships-a-SHA enumeration (`c927e9c..a9d3ae1`) — product-bearing commit:**
- `a20b51f` — Merge fix-wave-e34-118 @ `17c1274` (E4/E3/118(a-ii)/ab2 re-point `c871c08`/pb1 park
  `91bddf8`). Everything else in-range is docs-only (`7b49404` item-112 charter merge, `e65eed4`
  draft-roster brief merge, + records commits).

**New PRODUCT code since the last live build (`c927e9c` · railway `3979dcaa`) — verified
`c927e9c..a9d3ae1`, 9 files, +782/−17, ZERO schema, ZERO server:**
- `PageEditor.tsx` (+31) — E4: `|| unborn` removed at the one page-gating line; `gateActive` kept
  (both reasons recorded); `MISSING_ENTRY` cannot reach the line (dispatcher returns one level up).
- `Tutor.tsx` (+53) — E4: `send()` REFUSES OUT LOUD on an unborn surface, composer NOT cleared (PB1
  held; the measured premature-birth row quoted); E3: the counsel body's `{open && …}` wrapper
  removed so the body fades for itself.
- `BoardEditor.tsx` (+35) — item 118(a-ii): the resting card renders through the popup's own
  decoration engine (null caret, no new renderer; markers collapse via `font-size:0`, never
  display/visibility, so `textContent` carries the stored text byte-for-byte).
- `deskLexicon.ts` (+7) — one new refusal string.
- Harness (not in bundle): `e4.mjs` (+214), `e3.mjs` (+176), `item118.mjs` (+164), `ab2.mjs` (+84
  re-point), `pb1.mjs` (+35 — the lawful park of the ruling-superseded absence check).

**Records since `c927e9c` (docs, no deployed surface):** the item-112 charter (RATIFIED) + 112-A build
brief + the 112-A desk-grip ruling; the E4 S0; the standing ship word; the DECK-retirement/posture;
the fix-wave review + this manifest.

**Verified — fresh suite of record at the deploy HEAD (`a9d3ae1`), BOTH settings, machine-clear (NOT
contaminated):** **65/65 UNSET (CLEAN) and 65/65 PARKED (CLEAN)** at `tree=a9d3ae1
bundle=index-CaN2tPMJ.js/550462b` (CSS `index-FXF7LihM.css`) — the SAME bundle the offer stamped. The
lawful PB1 park stands (the ruling-driven red recorded beside the green). `tsc` ×2 EXIT 0; `build:web`
clean. **TREE CLEAN AT UPLOAD:** `git status --porcelain` EMPTY at `railway up` (no strays — the
t1-s0-brief was closed).

**Build OS + toolchain:** suite host Windows / Node `v24.13.0`; deploy build Railway Linux/nixpacks /
Node 18.

**ROLLBACK TARGET (ratchet from): git `c927e9c` · railway `3979dcaa`** — the weekend batch. Zero
schema this wave, so rollback is a clean redeploy of that tree.

**DEPLOY STAMP: git `a9d3ae1` · railway build `8cbc0b18-2388-4aa9-9ef0-8b6a1fc897a2`** — DEPLOYED
2026-09-02 (`railway up --ci` from the primary checkout; item-98 guard PROJECT + TREE verified:
`writer-studio` / `production` / `writer-studio-app`, tree clean at upload; image `sha256:1a7c25c1`).
Verified LIVE: `/healthz` **200**, served **`index-CaN2tPMJ.js` + `index-FXF7LihM.css`**, `/auth/me`
**401**.

**✔ SERVED == TESTED, BYTE-IDENTICAL (md5-verified, both assets).** Served JS `index-CaN2tPMJ.js` =
**550,462 b**, md5 `f57dc938400a10ac2a14b34270c5baa8` == local suite build; served CSS
`index-FXF7LihM.css` md5 `632380f0803ef583beb6f05e02da989a` == local (unchanged — the wave touched no
CSS). Windows suite == Linux Railway == served. Every-ship served-vs-stamped diff: **MATCH.**

## WEEKEND BATCH DEPLOY MANIFEST — 2026-09-01 (chat 1, on Nick's "Ship the batch" — Fable PASS ×2)

**THE WEEKEND BATCH — E1 + family (menus-errata) + the deck phase (Free Write roster).** Gate chain:
Fable's two reviews **VERDICT PASS** (`docs/wrizo-alpha/errata-e1-review-fable.md` @ `955384c`;
`docs/wrizo-alpha/deck-phase-review-fable.md` @ `6a1b4b5`) → Nick's ship word ("Ship the batch").
**ZERO SCHEMA / ZERO SERVER this time.** Deploying `main` HEAD **`c927e9c`**.

**Deploy-ships-a-SHA enumeration (`89b8ff5..c927e9c`):**
- `955384c` — Merge menus-errata @ `8444cb8` (E1 fix `6bbdd9f` + `item83e.mjs`; fx7 driver re-point `bd5072c`)
- `6a1b4b5` — Merge item84-deck-phase @ `b308ddd` (Free Write roster; deck S0/build records §9/§10)
- `fe31643` — Records: batch riders (retry-loop → canon; m3 ROAMS → item 82 watch; E3 fade)
- `c927e9c` — Records: Fable's two batch reviews (both PASS)

**New PRODUCT code since the last live build (`89b8ff5` · railway `250bcf0e`) — verified
`89b8ff5..c927e9c`, 15 files, +1509/−22, ZERO schema, ZERO server (`apps/server` byte-untouched
in-range):**
- E1 family: `menusDrawers.ts` (+53 — band≤0-is-a-NO + announce-from-effect), `Sliver.tsx`,
  `Cascade.tsx` (structural announcement from an effect keyed on each drawer's derived truth), the
  corrected paper selector (`.board-canvas-wrap` / `.script-sheet`, single-sourced with the probe).
- Deck phase: `Tutor.tsx` (+257 — the Free Write roster, hooks ungated, synchronous draw, NOTHING
  TRAVELS proven), new store `tutorFreeWriteDeck.ts` (+168), `deskLexicon.ts`, `FirstRunGate.tsx`,
  `index.css`.
- Harness (not in bundle): `item83e.mjs`, `item84.mjs`, fx7 re-point, `runtime-verify.mjs`.

**Records since `89b8ff5` (docs, no deployed surface):** the Mirrored Hands ruling + item 119;
item-112 FULL-REVISE scope; the batch riders; both Fable reviews; this manifest.

**Verified — fresh suite of record at the deploy HEAD (`c927e9c`), BOTH settings, machine-clear (NOT
contaminated):** **62/62 UNSET (CLEAN) and 62/62 PARKED (CLEAN)** at `tree=c927e9c
bundle=index-BWxL4YTx.js/550161b` (CSS `index-FXF7LihM.css`) — 62 files (the two merges added
`item83e.mjs` + `item84.mjs`). `tsc` ×2 EXIT 0; `build:web` clean. **TREE CLEAN AT UPLOAD:**
`git status --porcelain` EMPTY at `railway up` (the one untracked stray `item84-t1-s0-brief.md`,
routed to TUTOR, moved aside — blob `484e7221`, restored after; NOT uploaded).

**Build OS + toolchain:** suite host Windows / Node `v24.13.0`; deploy build Railway Linux/nixpacks /
Node 18.

**ROLLBACK TARGET (ratchet from): git `89b8ff5` · railway `250bcf0e`** — the menus wave. Zero schema
this batch, so rollback is a clean redeploy of that tree (no columns to consider).

**DEPLOY STAMP: git `c927e9c` · railway build `3979dcaa-f023-4337-a735-57ac480125dd`** — DEPLOYED
2026-09-01 (`railway up --ci` from the primary checkout; item-98 guard PROJECT + TREE verified:
`writer-studio` / `production` / `writer-studio-app`, tree clean at upload; image `sha256:77aae9b9`).
Verified LIVE: `/healthz` **200**, served **`index-BWxL4YTx.js` + `index-FXF7LihM.css`**, `/auth/me`
**401**. *(Railway CLI auth had expired between the merges and the ship; re-authed by Nick, then
deployed — HEAD unchanged at `c927e9c`, the suite of record still valid.)*

**✔ SERVED == TESTED, BYTE-IDENTICAL (md5-verified, both assets).** Served JS `index-BWxL4YTx.js` =
**550,161 b**, md5 `3d60f514fc7986cbda7b36e12f244f46` == local suite build; served CSS
`index-FXF7LihM.css` md5 `632380f0803ef583beb6f05e02da989a` == local. Windows suite == Linux Railway
== served — full item-77(c) strength. Every-ship served-vs-stamped diff: **MATCH.**

## MENUS WAVE DEPLOY MANIFEST — 2026-08-28 (chat 1, on Nick's "Ship it" — Fable PASS + Nick's schema word)

**THE MENUS WAVE — the item-83/84 menus build (Draft + Free Write + boards product) + its harness
park set + the two-column page-settings schema.** Gate chain: Nick's conditional word ("deploy as
soon as CC is done and you give the clear") → Fable's post-merge review **VERDICT PASS**
(`docs/wrizo-alpha/menus-wave-review-fable.md`) → Nick's explicit ship/schema word ("Ship it").
Deploying `main` HEAD **`89b8ff5`** — merge `0aa986c` (`menus-build @ e01c482`) + the review record.

**New PRODUCT code since the last live build (`2256f58` · railway `b10fcc55`) — verified
`2256f58..89b8ff5`, 33 files, +2132/−240, incl. SERVER:**
- Desktop: `Sliver.tsx` (+351), `CascadePanels.tsx` (+186), `index.css` (+162), `deskLexicon.ts`,
  `draftFormat.ts`, `BoardEditor.tsx`, `PageEditor.tsx`, `Cascade.tsx`, `ModeStage.tsx`,
  `PlacesPanel.tsx`, `types/index.ts`, `persistence.ts`, and new stores `menusDrawers.ts` /
  `pageDefaults.ts` / `pageDress.ts` / `writingSettings.ts`.
- Harness: the 14-file immutability park set + new `menus-probe.mjs` (+231).

**⚠ SCHEMA MIGRATION NAMED (M2/R6; Fable reviewed ROLLBACK-SAFE):** `apps/server/src/migrate.ts`
(+38) adds **TWO ADDITIVE NULLABLE JSONB COLUMNS** — `journal_entries.page_settings` and
`users.page_defaults` — via `add column if not exists … jsonb` (no default, no backfill, idempotent),
on the proven `journal_entries.tutor` recipe. `sync.ts` (+49) reads them null→undefined→app-defaults;
birth-from-defaults is a COPY at creation (R6); the defaults endpoint is a `requireAuth` non-`/sync`
singleton. **ROLLBACK-SAFE:** prior builds IGNORE the new columns, existing rows stay byte-identical,
and rolling back leaves the columns in place harmlessly (NO down-migration). Applied at server
startup — `/healthz` **200** confirms it ran clean.

**Records since `2256f58` (docs, no deployed surface):** item-104 CLOSED (founder's walk); DECK §9
contamination incident + item-111 CLOSED + CLEAN TREE AT UPLOAD law + BUILD ENVIRONMENT law re-draft;
the 2026-08-26 walkthrough (items 114–118); items 112/113 sectioned; the item84-brief reroute to
TUTOR; the menus-wave merge + review. (The item-112 FULL-REVISE scope ruling records immediately
after this stamp.)

**Verified — fresh suite of record at the deploy HEAD (`89b8ff5`), BOTH settings, read to completion,
machine-clear (NOT contaminated):** **60/60 UNSET (CLEAN) and 60/60 PARKED (CLEAN)** at
`tree=89b8ff5 bundle=index-CHvEOjEp.js/543622b` (CSS `index-ZVa8FRdm.css`) — the SAME bundle the menus
offer stamped (`CHvEOjEp`/543622b, both settings). `tsc` ×2 EXIT 0; `build:web` clean. **TREE CLEAN
AT UPLOAD:** `git status --porcelain` EMPTY at the moment of `railway up` (the one untracked stray,
`item84-t1-s0-brief.md` routed to TUTOR, moved aside to scratchpad for the ship — blob `484e7221`,
restored after; NOT uploaded).

**Build OS + toolchain:** suite host Windows / Node `v24.13.0`; deploy build Railway Linux/nixpacks /
Node 18.

**ROLLBACK TARGET (ratchet from): git `2256f58` · railway `b10fcc55-94d4-4429-a24e-bc889b1ef6a1`** —
the third-pass hotfix (New Page fix). Rollback is a redeploy of that tree; **the two new JSONB columns
remain and are harmlessly ignored by that build** (additive, nullable — NO down-migration needed).

**DEPLOY STAMP: git `89b8ff5` · railway build `250bcf0e-c190-47d7-9102-8f2d958cd0b0`** — DEPLOYED
2026-08-28 (`railway up --ci` from the primary checkout; item-98 guard verified PROJECT + TREE:
`writer-studio` / `production` / `writer-studio-app`, tree clean at upload; image `sha256:e5284f6f`).
Verified LIVE: `/healthz` **200**, served bundle **`index-CHvEOjEp.js` + `index-ZVa8FRdm.css`**,
`/auth/me` **401**.

**✔ SERVED == TESTED, BYTE-IDENTICAL (md5-verified, both assets).** Served JS `index-CHvEOjEp.js` =
**543,622 b**, md5 `11fb08cedf95c5b8cdc019dc548088a6` == the local suite build's md5; served CSS
`index-ZVa8FRdm.css` md5 `c53e74a9d6aa01f09bebbdb96ef7c6d6` == local. Windows suite build == Linux
Railway build == served — full item-77(c) strength, no functional-equivalence caveat needed. The
every-ship served-vs-stamped diff: **MATCH.**

## HOTFIX 104 (THIRD) DEPLOY MANIFEST — 2026-08-25 (chat 1, on Nick's "execute and ship the New Page fix")

**HOTFIX 104, THIRD PASS — the hooks-order class fixed at the invariant (the New Page door).** Fable's
order: MERGE `hotfix-104-third @ 8e75e60`, then HOLD for Nick's ship word; Nick's word: "execute and
ship the New Page fix." Deploying the `main` HEAD (`2256f58`) — merge `ade023a` of the fix +
the item-84 docs take (`68c67a7`) + this review's records commit.

**New PRODUCT code since the last live build (`63b875b`) — apps/desktop/src, THREE FILES (verified
`63b875b..HEAD`, +107/−9 in shipped source), ZERO schema, ZERO server:**
- `PageEditor.tsx` (+44) — PageEditorView's guard now sits BELOW `useCascade`: every hook above, the
  vanished-page decision below. Why the two earlier passes missed it: lifting this ticket's own hooks
  left `useCascade` behind, and the dispatcher decision only helps when the PARENT re-renders — a
  child-local re-render never consults the parent. The prior dispatcher-unmount fix is KEPT, not
  reverted (the two-device-tombstone path stays green); the view is now internally safe too. Belt and
  braces, each argued.
- `ScriptEditor.tsx` (+14) — the IDENTICAL fault, in the room the doorway sends writers INTO. A
  reported-instance-only fix would have MOVED the crash here; the class fix closes it.
- `UnbornSurface.tsx` (+49) — `UnbornProvider` registers its slot during RENDER (useMemo) and tears
  down in an EFFECT CLEANUP; under StrictMode the cleanup wins and the memo cannot re-run — dev-only
  by construction, which also RECONCILES the two desks' opposite cold-load reports at the same bundle.
- **Also merged, NOT in the bundle:** `scripts/harness/hooks-order.mjs` (+98) — the 145-file
  hooks-order guard (every function-declared component + custom hook). Census found THREE violations;
  one deliberate reasoned allowlist entry (`JournalEntry.tsx`, unrouted since FX14, delete-the-line-
  first-if-re-routed), plus a check asserting the allowlist still describes only unrouted surfaces.
  The DURABLE PRIZE. Blind spots written into the file (arrow-defined components, multi-line early
  returns, line-scanner-not-AST) — AST form owed to item 109.

**REVIEWED GREEN** (`docs/wrizo-alpha/hotfix-104-third-review-fable.md`, Fable VERDICT PASS, read at
raw bytes, offer `8e75e60`).

**Docs since `63b875b` (records only, no deployed surface):** the item-84 take (`68c67a7` — Revise
finding + re-plan + held batch), this third-pass review, and the ledger appends (item 104 third
reopen + this manifest). Confirmed: `63b875b..HEAD` touches `apps/desktop/src` in exactly the three
files above.

**Verified — suite of record:** DF1.1's committed `run-suite.mjs`, BOTH HARNESS_PARKED settings, read
to completion, machine-clear (NOT contaminated) — **60/60 UNSET (CLEAN) and 60/60 PARKED (CLEAN)** at
`tree=2256f58 bundle=index-CaW0zodg.js/531457b` (CSS `index-62lZ1TCK.css`), the same bundle the fix
offer stamped. Among the 60: `hooks-order.mjs` (the new guard) PASS and `item104.mjs` (tombstone path)
PASS. `tsc` ×2 EXIT 0; `build:web` clean. *(The stamp reads `+1dirty` — one untracked file,
`docs/menus/tutor/item84-t1-s0-brief.md`, a preserved item-110 stray OUTSIDE the build path; the
identical bundle hash proves it does not affect the artifact.)*

**ROLLBACK TARGET: git `63b875b` · railway `410033f9-678d-4b66-8679-e20d07cd5da3`** — the prior live
build (New Page route crashing). Rolling back REINTRODUCES the New Page crash, so it is only for a
worse regression from THIS deploy. Rollback is a redeploy of that tree (`railway up`).

**DEPLOY STAMP: git `2256f58` · railway build `b10fcc55-94d4-4429-a24e-bc889b1ef6a1`** — DEPLOYED
2026-08-25 (`railway up --ci` from the primary checkout, item-98 guard verified: project
`writer-studio` / env `production` / service `writer-studio-app`; deployed image `sha256:e7ead873`).
Verified LIVE: `/healthz` **200**, served bundle **`index-CaW0zodg.js` + `index-62lZ1TCK.css`**,
`/auth/me` **401**.

**✔ SERVED == TESTED, BYTE-IDENTICAL (the item-111 provenance gap did NOT recur).** Railway's
Linux/nixpacks build (node 18) produced `index-CaW0zodg.js` + `index-62lZ1TCK.css` — the SAME JS and
CSS hashes as my local Windows suite build AND as the served production bundle. Windows suite ==
Linux Railway == served, on BOTH assets. So this deploy is byte-verified served==tested at full
item-77(c) strength — NO functional-equivalence caveat needed (contrast the 2026-08-24 hotfix, which
served `4pj2Iqk-` ≠ tested `hZQhhS8W`). **Refines item 111: the build-OS divergence is
SOURCE-DEPENDENT, not universal — it did not manifest for this tree.** Item 111 stays open (a Linux
suite-of-record env is still the general fix), but THIS deploy needed no such fallback. **Build OS:
local Windows; deploy Railway Linux/nixpacks (node 18).**

**BOUNDARY, stated honestly (the review's own risk carried forward):** the production suite still
cannot drive `#/page/new` HEADFULLY — that gate is owed to item 109. The direct "the writer SEES the
New Page" proof is the fix lane's DEV-SERVE verification recorded in the review (VERDICT PASS on the
guard placement below `useCascade`), NOT this production suite. This deploy ships that
reviewed-and-verified artifact byte-for-byte. Item 104's formal disposition (close vs monitor) is
left to Fable. The ELEVATED STANDING HARNESS LAW from the review is registered: **"'nothing threw' is
not a verdict; 'the writer sees the page' is."**

## HOTFIX 104 DEPLOY MANIFEST — 2026-08-24 (chat 1, on Nick's "ship the hotfix on a clean suite")

**HOTFIX 104 — the hooks-order crash class.** Nick's word: "ship the hotfix on a clean suite." The
merged-but-undeployed set since the doorway live build (`1cbda72`). Deploying the `main` HEAD
(`2a03ace`) — this records commit's own SHA, stamped below immediately after `railway up`.

**New PRODUCT code since the doorway live build (`1cbda72`) — apps/desktop/src, ONE FILE (verified
`1cbda72..HEAD`, +37/−9), ZERO schema, ZERO server:**
- item 104 **hotfix** · merge `d620dc7` (branch `hotfix-104-hooks @ 2c36ad0`) — `PageEditor.tsx`:
  the vanished-page decision moves into BOTH dispatchers, whose hooks sit above every return; a
  vanished page UNMOUNTS the view instead of re-rendering it short. The **class removed** (three
  hooks below the guard, `useCascade` among them, OLDER than the doorway), not the instance —
  the doorway is exonerated as introducer. Proven: `item104.mjs` S6 red 2/15 at the deployed bundle
  → 15/15 with the fix, on the exact two-device-tombstone path. **REVIEWED GREEN**
  (`docs/wrizo-alpha/hotfix-104-review-fable.md`).

**Docs since `1cbda72` (records only, no deployed surface):** the doorway review + Fable's ownership
append, the item-104 reopen + item-109 records (both lanes, reconciled), the three founder-ruling
corrections + the new standing law, item-84 §9/§10, the disclosure-v4 committee + ratification +
both-desks close, the hotfix review, and this manifest. Confirmed: `1cbda72..HEAD` touches
`apps/desktop/src` in exactly the one file above.

**Verified — suite of record:** DF1.1's committed `run-suite.mjs`, BOTH HARNESS_PARKED settings,
read to completion, machine-clear — **59/59 UNSET (CLEAN) and 59/59 PARKED (CLEAN)** at
`tree=2a03ace bundle=index-hZQhhS8W.js/531318b`, the same bundle the hotfix offer stamped. `tsc` ×2
EXIT 0; `build:web` clean; NOT contaminated; item 82's family did NOT red. *(A first parked run had
died on a machine-sleep / logoff environmental failure — 34 consecutive empty-output NOVERDICT
browser-launch crashes, `0xC000026B`, no product red; re-run whole and clean here, per the
abandon-don't-excuse discipline.)*

**ROLLBACK TARGET: git `1cbda72` · railway `59d55924-f1b1-4792-a293-f834e3ad898d`** — the current
live production build (the doorway wave, crashing on the two-device-tombstone path). Rollback is a
redeploy of that tree (`railway up`).

**DEPLOY STAMP: git `63b875b` · railway `410033f9-678d-4b66-8679-e20d07cd5da3`** — DEPLOYED
2026-08-25 (`railway up --ci` from the primary checkout, item-98 guard verified; deployed image
`sha256:5e876f77`). Verified LIVE: `/healthz` **200**, `/auth/me` **401**, and the server IS up.

**⚠ PROVENANCE GAP — served bundle ≠ suite-of-record bundle (do NOT read this as clean-verified).**
The suite of record verified **`index-hZQhhS8W.js`** (my local build); Railway deployed and now
serves **`index-4pj2Iqk-.js` / `index-07aGd89Y.css`** — a DIFFERENT hash (the CSS hash changed too,
though the hotfix touched no CSS). **Root cause: build-environment drift — local Node `v24.13.0`
vs Railway's pinned `nodejs_18`, with NO `.nvmrc`/engines pin in the repo.** Same source tree
(`2a03ace`/`63b875b`) and same frozen lockfile (verified: `pnpm i --frozen-lockfile` changed
nothing locally), so the source hotfix (`PageEditor.tsx` hook lift) IS in the live bundle and the
crash is functionally fixed with high confidence — but the exact deployed bytes were NOT run through
the suite. Prior deploys reproduced exactly because local node was 18 then; it was upgraded to 24
during the multi-day span. **OWED before this deploy can be called clean-verified:** pin Node 18
(so local == Railway again), rebuild → confirm the hash reproduces `index-4pj2Iqk-.js`, and re-run
the suite of record against THAT bundle. **Until then the interim rules STAY IN FORCE** (avoid
cross-device deletes) and the 83-desk ping is HELD — not lifted on a byte-unverified deploy.
Rollback lever remains **git `1cbda72` · railway `59d55924`** (the doorway build). Raised to Fable
(reproducibility is an infra defect worth an item + a node pin).
**→ RESOLVED (Fable's ruling, 2026-08-25): FUNCTIONALLY VERIFIED — not byte-verified.** Step (b)
proved the gap is OS-level, not Node (a Windows Node-18 rebuild still produced `hZQhhS8W`, not
Railway's `4pj2Iqk-`; item 111). **Basis:** identical source tree + frozen lockfile, the hook-lift
provably in the deployed source, behavior-correct under any toolchain. The crash is fixed; the
hotfix is **FUNCTIONALLY VERIFIED**, byte-identity of the deployed bundle **NOT** verified cross-OS
(item 111, open, fix = a Linux suite-of-record env; scheduled post-walkthrough). **INTERIM RULES
LIFTED** — cross-device deletes are fine again. **Build OS: local Windows; deploy Railway
Linux/nixpacks (node 18).**
**→ CORRECTED (Fable, 2026-08-25): the FUNCTIONALLY-VERIFIED line stands for the TWO-DEVICE
TOMBSTONE PATH it was proven against — NOT for the New Page route.** A THIRD reopen (item 104):
`#/page/new` still crashes at main `8210c37` (MENU lane, headful scratch worktree). The hotfix
removed the tombstone-path hooks crash, but a SEPARATE New-Page-route crash remains. **Fable's
review-sufficiency claim is WITHDRAWN on the record** (`hotfix-104-review-fable.md`, sufficiency
append). **Interim rule REINSTATED — the New Page door is avoided on production.** Root: no gate
drives `#/page/new` headfully — item 109's sharpest instance.

**⚠ INCIDENT RECORD — CONTAMINATED DEPLOY (DECK §9, verified by chat 1, 2026-08-26).** This deploy's
served bundle was NOT built from clean `63b875b` source. `railway up --ci` uploaded the PRIMARY
CHECKOUT while the DECK lane's uncommitted item-84 files were sitting in it — including FOUR
deliberate falsification mutations to `Tutor.tsx` (the harness-bites pass). Railway built the working
directory. **Proven from production** (DECK's build record §9,
`.claude/worktrees/item84-deck/docs/menus/tutor/item84-deck-phase-build.md`): served
`index-4pj2Iqk-.js` = **537,500 b**, byte-identical to DECK's own mutant-run-1 stamp
(`bundle=index-4pj2Iqk-.js/537500b`); the live bundle carried MUT2's string *"A line composed on the
spot, in no pool."* (existed nowhere else) plus a SECOND `/api/tutor/chat` call site (MUT4's unbidden
`fetch` on a preset press). For ~90 minutes production served a build where pressing a Tutor preset
fired an **unbidden `POST /api/tutor/chat`** — a violation of the ratified disclosure (*"Nothing is
ever sent unless you ask"*). **The hotfix hook-lift itself WAS committed source and genuinely live**
(item 104's tombstone-path fix shipped) — but the **FUNCTIONALLY-VERIFIED basis below ("identical
source tree + frozen lockfile") is CORRECTED: the source was NOT identical.** The `4pj2Iqk-` ≠
`hZQhhS8W` split was CONTAMINATION, not OS/node drift (item 111 CLOSED on this). **Exposure window
CLOSED by the third-pass deploy `2256f58` · `b10fcc55` (byte-verified):** production now serves
`index-CaW0zodg.js` (531,457 b) with ZERO mutation markers and exactly ONE `/api/tutor/chat` —
re-verified by chat 1's own download 2026-08-26. Responsibility: DECK's lane (root cause its §7.2 — a
relative-path write while the shell cwd had reverted to the primary checkout). Gravest consequence
recorded at item 110; prevention is the new CLEAN TREE AT UPLOAD standing law.

## DOORWAY DEPLOY MANIFEST — 2026-08-21 (chat 1, on Nick's "SHIP THE DOORWAY")

**THE DOORWAY WAVE — items 104 + 87-subset + 97 + 101's park.** Nick's word: "SHIP THE DOORWAY."
The merged-but-undeployed set since the P2c live build (`643dd16`). Deploying the `main` HEAD
(`42057a9`) — this records commit's own SHA, stamped below immediately after `railway up`.

**New PRODUCT code since the P2c live build (`643dd16`) — apps/desktop/src, FIVE FILES (verified
`643dd16..HEAD`, +141/−7), ZERO schema, ZERO server:**
- item 104 · **the doorway** (the room a door opens is the room you end up in) — `PageEditor.tsx`
  (+84), `unbornPage.ts` (+22): the `UnbornPage` dispatch asks the ROW (`pageType` outranks
  `descriptor.kind`); prose falls through the SAME component under the SAME key (no remount, PB1
  preserved); the structure door reuses `requestScreenplay`, guarded three ways.
- item 87-subset · `persistence.ts` (+35): the empty case moves, the threshold rule stands
  (`seedTypewriterDefault(!fresh && …)`); the Draft-default / `?mode=draft` is HELD (superseded by
  the New Page Chooser, menus arc).
- item 97 · **re-mint** — `BoardEditor.tsx` (+2), `CascadePanels.tsx` (+5): pointer cleared AT
  DETECTION; named residual (tombstone-arrival window) recorded, post-vacation.
- item 101 · **S0 park** — NO code (confirmed benign, feedback routed to item 96).
- **REVIEWED GREEN** (`docs/wrizo-alpha/doorway-review-fable.md`).

**Docs since `643dd16` (records only, no deployed surface):** the doorway records + review, the
five founder rulings, item-84 lock record + hybrid + §9 (TR3 ask-2 clause), item 108, the
disclosure-v4 committee + ratification + unblock, the SITTING #2 records + items 101–107, and this
manifest. Confirmed: `643dd16..HEAD` touches `apps/desktop/src` in exactly the five files above.

**Verified — suite of record:** DF1.1's committed `run-suite.mjs` (item 77(c) stamp), BOTH
HARNESS_PARKED settings, read to completion, machine-clear (the 83 desk's clearance log on record)
— **59/59 UNSET (CLEAN) and 59/59 PARKED (CLEAN)** at `tree=42057a9 bundle=index-D8pFRr1k.js/531254b`
— the same bundle the doorway offer stamped. `tsc` ×2 EXIT 0 (app+node); `build:web` clean; the
guard confirmed no foreign browsers at start or mid-run (**NOT contaminated**). Item 82's family
did NOT red.

**ROLLBACK TARGET: git `643dd16` · railway `ec2b9755-1746-4b23-a3f8-e33130f984a9`** — the current
live production build (P2c: item 82 fix (b) + SC2). Rollback is a redeploy of that tree
(`railway up`).

**DEPLOY STAMP: git `1cbda72` · railway `59d55924-f1b1-4792-a293-f834e3ad898d`** — DEPLOYED
2026-08-21 (`railway up --ci` from the primary checkout `c:/Users/nickh/writer-studio`, item 98
guard status-verified; writer-studio / production / writer-studio-app; deployed image
`sha256:34e414cb`). Verified LIVE at `https://writer-studio-app-production.up.railway.app`:
`/healthz` **200**, the new bundle served (`index-D8pFRr1k.js` / `index-62lZ1TCK.css`) — the same
content hash the suite of record stamped, so what is LIVE is exactly what was tested and reviewed
GREEN — and `/auth/me` **401**. The prior P2c build (`643dd16` · railway `ec2b9755`) is now
superseded as the live build; the rollback SOURCE remains git `643dd16`.

**Items 104 / 87-subset / 97: DEPLOYED** (REVIEWED GREEN); **101: S0-closed benign, no code, feedback
to item 96.** The doorway wave is LIVE — the room a door opens is the room you end up in; the
New-Page template births in the right mode by descriptor; re-mint clears the stale pointer at
detection. Item 82's family did NOT red; no red-suite clause invoked. Rollback ratchet is now this
stamp. **S4 queues behind it.** Item 87's Draft-default remains HELD (New Page Chooser, menus arc);
item 97's tombstone-arrival residual and item 108's Tutor-memory carve-out stay post-vacation.

**→ POST-DEPLOY PRODUCTION DEFECT (2026-08-24): item 104 REOPENED.** The **New Page door crashes on
mount** at this deployed SHA (`1cbda72`) — a hooks-order violation from `fe0252b`, which escaped
the 59/59 suite of record and the GREEN review via the coverage gap now opened as **item 109** (no
gate drives a cold direct load of `#/page/new`). **RULING: FORWARD-FIX at the fix lane; the Railway
rollback lever is NAMED AND HELD** — redeploy P2c (**git `643dd16` · railway `ec2b9755`**) via
`railway up` from the primary checkout, on Nick's word, IF the fix stalls (not executed now).
**Interim:** New Page door avoided on production pending the hotfix stamp. See item 104's REOPENED
banner above and item 109.

## P2c DEPLOY MANIFEST — 2026-08-17 (chat 1, on Nick's "Ship P2c")

**P2c — item 82 fix (b) + SC2/item 62 (the Script's paginated floor).** Nick's explicit ship
word: "Ship P2c." The merged-but-undeployed set since the fw2 live build (`fbdb27e`). Deploying
the `main` HEAD (`b119365`) — this records commit's own SHA, stamped below immediately after
`railway up`.

**New PRODUCT code since the fw2 live build (`fbdb27e`) — apps/desktop/src, SIX FILES (verified
`fbdb27e..HEAD`, +1046/−46), ZERO schema, ZERO server:**
- item 82 **fix (b)** · merge `e9ea36c` (branch `item82-fixb-j5-seam`) — `persistence.ts` (+56):
  `j5`'s `makePage` now seeds THROUGH the app's seam, never raw storage; the seam gained an
  optional `JournalPageSeed`, and `createJournalPage` has ZERO call sites in `src` (product blast
  radius empty). Unblocked SC2's sixth suite. Item 100 opened alongside (the CDP port-file race —
  harness-only, sibling of item 99).
- item 62 **SC2** · merge `32376b9` (branch `sc2-s5-memo`; DO-NOT-MERGE marker `eb74835`
  honored-through per 77(c)) — the Script's paginated floor: `ScriptEditor.tsx` (+419),
  `index.css` (+119), `scriptLedger.ts` (new, +181), `scriptMetrics.ts` (+61), `scriptPaginate.ts`
  (new, +256). The caret-across-the-break fix (mechanism observed: a break-crossing is a DOM
  delete+insert; the remembered offset is spent only on a same-session remount) + the
  stored-nowhere, viewport-invariant paginator with a termination proof. **REVIEWED GREEN, item 62
  CLOSED** (`docs/wrizo-alpha/sc2-review-fable.md`).
- Harness delta: `j5.mjs` (fix b), `sc1.mjs` / `sc2.mjs` (SC2).

**Docs since `fbdb27e` (records only, no deployed surface):** the fw2 review, the fix (b) + SC2
records + riders (item 100, the item-89 `persistDirty` ~2ms-p95 observation, item 62 CLOSED), and
this manifest. Confirmed: `fbdb27e..HEAD` touches `apps/desktop/src` in exactly the six files above.

**Verified — suite of record:** DF1.1's committed `run-suite.mjs` (item 77(c) stamp), BOTH
HARNESS_PARKED settings, read to completion, machine-clean — **56/56 UNSET (CLEAN) and 56/56
PARKED (CLEAN)** at `tree=b119365 bundle=index-GZdjfpTW.js/530759b` — the same bundle SC2 stamped
at `ecd37bf` (the deploy HEAD's `apps/` is byte-identical to the SC2 stamped tree, which already
carried fix b). `tsc` ×2 EXIT 0 (app+node); `build:web` clean; the guard confirmed no foreign
browsers at start or mid-run (**NOT contaminated**). Item 82's family did NOT red (`j5` 37, `j4`
24, `b2-1` 28, `fx6` 37, `th2` 42, `m4` 43 green here — an observation about this head, not a
closure; `j4`/`b2-1`/`fx6` remain UNATTRIBUTED).

**ROLLBACK TARGET: git `fbdb27e` · railway `0fdc8f94-c735-443b-8b3e-395e5b647c58`** — the current
live production build (Ship 2 / fw2). Rollback is a redeploy of that tree (`railway up`).

**DEPLOY STAMP: git `643dd16` · railway `ec2b9755-1746-4b23-a3f8-e33130f984a9`** — DEPLOYED
2026-08-17 (`railway up --ci` from the primary checkout `c:/Users/nickh/writer-studio`, item 98
guard status-verified; writer-studio / production / writer-studio-app; deployed image
`sha256:9fe46e80`). Verified LIVE at `https://writer-studio-app-production.up.railway.app`:
`/healthz` **200**, the new bundle served (`index-GZdjfpTW.js` / `index-62lZ1TCK.css`) — the same
content hash the suite of record stamped, so what is LIVE is exactly what was tested — and
`/auth/me` **401**. The prior fw2 build (`fbdb27e` · railway `0fdc8f94`) is now superseded as the
live build; the rollback SOURCE remains git `fbdb27e` (redeploy that tree via `railway up`).

**Item 82 fix (b) + item 62 (SC2): DEPLOYED** — the j5 seam and the Script's paginated floor are
LIVE. Item 62 is CLOSED (reviewed GREEN); item 82's fix (b) is deployed with its `j5` red removed
at the source (the family's other reds — `j4`/`b2-1`/`fx6` — remain UNATTRIBUTED, undeployed-code
notwithstanding, and a green run is not their diagnosis). Item 82's family did NOT red in the
suite of record; no red-suite clause was invoked. Item 100 (CDP port-file race) stays OPEN,
harness-only, for the harness floor's owner. Rollback ratchet is now this stamp.

## SHIP 2 (fw2) DEPLOY MANIFEST — 2026-08-17 (chat 1, on Nick's "Ship 2")

**SHIP 2 — fw2, items 91+92 (the boards work).** Nick's explicit per-package ship word: "Ship 2."
Merged `a18115c` (Nick's post-vacation word) + formal merge order `0dc6e75` (fw2-offer @
`641e946`). Deploying the `main` HEAD (`bd4cdcb`) — this records commit's own SHA, stamped below
immediately after `railway up`.

**New PRODUCT code since the P0 live build (`c23c380`) — apps/desktop/src, TWO FILES, ALL fw2,
nothing else (verified `c23c380..HEAD`, 118/−5):**
- item 91 · **the board's Page door** — `BoardEditor.tsx`. An unpaired board's PAGE opened the
  Wrizo landing (`backTo` = `/` for a system board); it now opens a New Page linked back, split
  by board kind — PIN for a user board (authored membership), MEMBERSHIP for a system board
  (derived), Trash keeps its exit.
- item 92 · **the card that survives** — `BoardEditor.tsx` + `unbornPage.ts`. A New-page Card
  written by `pinPageToBoard` was erased by BoardEditor's stale local `boxes` on unmount; the pin
  now appends to `boxesRef.current` (never a store read as local truth), surviving the unmount.
- **ZERO schema, ZERO server.** Merge `a18115c` (fw2-offer @ `e281b73`, Nick's word) + `0dc6e75`
  (fw2-offer @ `641e946`, Fable's formal order — the addendum's bundle-identity proof).

**Docs since `c23c380` (records only, no deployed surface):** the item 83/84 menus-arc design
records + the item-84 lock sheet (on its own branch, unmerged), the fw2 offer + addendum +
Fable's ratifications, the SHIP 2 park→unpark→merge ledger, the vacation + lane-status handoffs,
and this manifest. Confirmed: `c23c380..HEAD` touches `apps/desktop/src` in exactly the two files
above; item 87 is NOT here (built-unverified on `fw2-boards-and-defaults`).

**Verified — suite of record:** DF1.1's committed `run-suite.mjs` (item 77(c) stamp), BOTH
HARNESS_PARKED settings, read to completion, machine-clean — **55/55 UNSET (CLEAN) and 55/55
PARKED (CLEAN)** at `tree=bd4cdcb bundle=index-Cib2nzSw.js/525306b` — **byte-identical to the fix
lane's 2026-08-04 stamp** (`tree=dad280e`), the docs-only-carry proven end to end. `tsc` ×2 EXIT 0
(app+node); `build:web` clean; the guard confirmed no foreign browsers at start or mid-run (**NOT
contaminated**). `item9192.mjs` 16 checks (10/16 red pre-fix); item 82's family did NOT red.

**ROLLBACK TARGET: git `c23c380` · railway `ee0a9bf2`** — the current live production build (the
P0 wave: offline-strand self-heal + filing validation). Rollback is a redeploy of that tree
(`railway up`).

**DEPLOY STAMP: git `fbdb27e` · railway `0fdc8f94-c735-443b-8b3e-395e5b647c58`** — DEPLOYED
2026-08-17 (`railway up --ci` from the primary checkout `c:/Users/nickh/writer-studio`, item 98
guard status-verified; writer-studio / production / writer-studio-app; deployed image
`sha256:a3d88259`). Verified LIVE at `https://writer-studio-app-production.up.railway.app`:
`/healthz` **200**, the new bundle served (`index-Cib2nzSw.js` / `index-DfTiVdTQ.css`) — the same
content hash the suite of record stamped, so what is LIVE is exactly what was tested — and
`/auth/me` **401**. The prior P0 build (`c23c380` · railway `ee0a9bf2`) is now superseded as the
live build; the rollback SOURCE remains git `c23c380` (redeploy that tree via `railway up`).

**Items 91 / 92: GREEN + DEPLOYED** — fw2 (the boards work) is LIVE. 91 (the board's Page door
opens a linked New Page, not the Wrizo landing) and 92 (the New-page Card survives BoardEditor's
unmount) were the sitting's board P1s. Item 82's family did NOT red in the suite of record; no
red-suite clause was invoked. Item 87 remains built-unverified on `fw2-boards-and-defaults`.
**→ POST-MERGE REVIEW (Fable, 2026-08-17): items 91, 92 → REVIEWED, GREEN** —
`docs/wrizo-alpha/fw2-review-fable.md`; VERDICT PASS (7 code files, +593/−21, zero schema/server).
92: the pin is APPENDED to the component's own live `boxes` (never assigned from the store);
`boxesRef` set directly because the door's `navigate` unmounts before any further render;
`pinPageToBoard` keeps sole ownership of what a pin is. 91: the door's split is argued not assumed
— USER→PIN on the address (rides the binder), SYSTEM→MEMBERSHIP (A16), TRASH keeps the exit; the
descriptor's dead-code pin field resolved as STRUCTURAL; reload-safety inherited from PB1 by
construction, and S2(c) proves the door writes NOTHING. Flake list stays empty.

## P0 WAVE DEPLOY MANIFEST — 2026-08-03 (chat 1, on Nick's "Ship it"; Fable's amended checklist)

**P0 WAVE — the offline-strand + filing fixes, plus the merged-but-undeployed carry.** Nick's
word: "Ship it." Fable's instruction: the deploy carries the full merged-but-undeployed set
since the P2b live build `c266cb3`; manifest names everything; deploy from the PRIMARY CHECKOUT
only (item 98's guard); amended checklist (rebuild-first, name SHA + asset hash). Deploying the
`main` HEAD (`1834dfe`) — this records commit's own SHA, stamped below immediately after
`railway up`. The suite of record ran at `aa07b9c`, docs-only behind HEAD.

**New PRODUCT code since the P2b live build (`c266cb3`) — apps/desktop/src, THREE FILES, ALL the
P0 wave, nothing else (verified `c266cb3..HEAD`, 202/−16):**
- item 89 (P0) · **PERSIST THE DIRTY SET** — `persistence.ts` (+178), `sync.ts` (+17, backfill).
  Offline writes were unsendable, not merely unsent: the dirty set was memory-only, and because
  `getDirtyRecords()` filters the cache BY it, a reload made the push impossible. Now journaled
  to disk in the SAME synchronous tick as its collection; boot restore self-heals phantom ids
  (S4); corrupt journal boots empty (S5); logout clears it (no cross-account leak).
- items 88a/88b (P0/P1) · **FILING-TARGET VALIDATION + side-door birth killed** —
  `PlacesPanel.tsx` (+23). `setPageHome` refuses a non-live binder (writes nothing); filing an
  unborn page no longer births litter through `getJournalEntry`'s unborn-slot fall-through (PB1
  ruling 2 preserved — birth stays the one path).
- Merge `da69332` (four commits `8875343..3de9f28`). **ZERO schema, ZERO server.**

**Harness/instrument since `c266cb3` (zero deployed surface):** item 82 fix 1 `c228c4b`
(m4/th2 celebration-gate checks — `m4.mjs`, `th2.mjs`); item 77(c) `c2a351f` (`run-suite.mjs`
bundle stamp); the P0 wave's own `item88.mjs` / `item89.mjs` + `runtime-verify.mjs`.

**Docs since `c266cb3` (records only, no deployed surface):** the P0 wave review
(`p0-wave-review-fable.md`), the sitting log, items 90–99 opens, item 96 charter, the item 83/84
menus-arc design records (mockups + rulings, the menus lane — `docs/menus/*`, zero app code), the
standing-laws appends, and this manifest. Confirmed: `aa07b9c..HEAD` is docs-only (bundle
provably unchanged), and `c266cb3..HEAD` touches `apps/desktop/src` in exactly the three files
above.

**Verified — suite of record:** DF1.1's committed `run-suite.mjs` (item 77(c) stamp), BOTH
HARNESS_PARKED settings, read to completion, in a machine-clean window — **54/54 UNSET (CLEAN)
and 54/54 PARKED (CLEAN)** at `tree=aa07b9c bundle=index-CThKwy6K.js/524897b`, the exact bundle
Fable reviewed GREEN in the P0 wave. The runner rebuilt `build:web` before each run and stamped
both identifiers; its guard confirmed no foreign harness browsers at start or mid-run (result is
**NOT contaminated**). HEAD (`1834dfe`) is `aa07b9c` + docs-only menus records — bundle identical,
re-verified as the served asset in the stamp below.

**ROLLBACK TARGET: git `c266cb3` · railway `11b612db-4be2-4d31-bca1-afd4118c99a7`** — the
current live production build (P2b: FX17 + PB1, the key-rotation redeploy id). Rollback is a
redeploy of that tree (`railway up`).

**DEPLOY STAMP: git `c23c380` · railway `ee0a9bf2-92fe-4631-8736-d98aa183ac9f`** — DEPLOYED
2026-08-03 (`railway up --ci` from the primary checkout `c:/Users/nickh/writer-studio`, item 98
guard status-verified; writer-studio / production / writer-studio-app; deployed image
`sha256:0eece37d`). Verified LIVE at `https://writer-studio-app-production.up.railway.app`:
`/healthz` **200**, the new bundle served (`index-CThKwy6K.js` / `index-DfTiVdTQ.css`) — Railway's
server-side `build:web` reproduced the suite-of-record bundle hash (`index-CThKwy6K.js`)
byte-for-byte, so what is LIVE is exactly what was tested and reviewed GREEN — and `/auth/me`
**401**. The prior P2b build (`c266cb3` · railway `11b612db`) is now superseded as the live
build; the rollback SOURCE remains git `c266cb3` (redeploy that tree via `railway up`).

**Items 89 / 88a / 88b: GREEN + DEPLOYED** — the P0 wave is LIVE. 89 (offline-strand) and 88a
(filing-target validation) were the sitting's two P0s; 88b (side-door birth) rode as the P1 in
the same patch. All three reviewed GREEN (`p0-wave-review-fable.md`) and now deployed. The
non-blocking OBS (item-90 neighborhood: `'no-such-page'` conflates unborn with trashed) stays
noted for item 90. Item 82's family did NOT red in the suite of record; no red-suite clause was
invoked. Item 99 (the Orphan Reaper) opened alongside — the machine-contention forensics behind
this deploy's two false starts, with the post-vacation runner remediation logged.

## P2b DEPLOY MANIFEST — 2026-07-30 (chat 1, on Nick's standing "DEPLOY WHEN READY"; Fable's two-stage amendment)

**P2b — FX17, with PB1 RIDING.** Fable's amendment named "FX17 alone," but PB1 merged
between P2a and P2b, so per the stamp law (every merged-but-undeployed ticket is named) the
P2b SHA carries both. Deploying the `main` HEAD — this records commit's own SHA, stamped
below immediately after `railway up`.

**New code since the P2a deploy (`ca34f67`):**
- item 74 · **FX17 — the Board's Floor** · merge `c340876` (branch `ef7429c`) — the
  width↔height feedback loop closed (S1); the board grows to a named `BOARD_MAX_Y` floor and
  stops exact (S2/S3); the limit stops, never relocates.
- item 71 · **PB1 — Born on the First Word** (RIDING — merged `e8ae17d`, reviewed GREEN, held
  undeployed since it landed after P2a) · merge `e8ae17d` (branch `af47582`) — birth belongs
  to the record; the unborn slot lives outside the cache; `history.replaceState` corrects the
  address (no remount).

**App-code touched (`ca34f67..HEAD`, apps/desktop/src) — ALL FX17 or PB1, nothing else:**
FX17 — `BoardEditor.tsx`, `index.css`. PB1 — `App.tsx`, `Arrival.tsx`, `CascadePanels.tsx`,
`DrawersTree.tsx`, `PageFace.tsx`, `UnbornSurface.tsx`, `useCatch.ts`, `PageEditor.tsx`,
`persistence.ts`, `unbornPage.ts` (+ `BoardEditor.tsx` shared). All frontend.

**ZERO SCHEMA, ZERO SERVER FILES** across `ca34f67..HEAD`: `apps/server` diff empty; no
migration/schema/db files.

**Docs since `ca34f67` (records only, no deployed surface):** the P2a deploy stamp
(`569d3f2`), the PB1 review + ledger appends (`b9442dc`), the sitting agenda v3 (`f721d16`),
chat 6's FX17 ledger (`389ec29`), this manifest + the hd-arc-seed. Zero deployed surface.

**Verified:** FX17's suite of record — full historic suite, BOTH HARNESS_PARKED settings,
read to completion — **52/52 both settings at `ef7429c`** (rebased onto the PB1-carrying main,
so PB1 + FX17 were tested together; `fx17.mjs` 18 checks under trusted pointer). PB1 verified
51/51 at its own head + reviewed GREEN (`docs/wrizo-alpha/pb1-review-fable.md`). The FX17 merge
into main is a docs-only three-way over chat 6's records commit (`389ec29`) — no re-verification
owed (Fable's pre-authorization); the deployed bundle's app code equals `ef7429c`'s (docs don't
enter the build). `tsc` ×2 EXIT 0 + `build:web` clean re-confirmed at the merge HEAD (`c340876`).

**ROLLBACK TARGET: git `ca34f67` · railway `5a4da218-f4c0-458d-aeb6-ec286c0f3e1e`** — the
current live production build (P2a: FX16 + FX18 + BG2). Rollback is a redeploy of that tree
(`railway up`).

**DEPLOY STAMP: git `c266cb3` · railway `dfa03148-2dc8-427d-8629-d6677ca183a9`** — DEPLOYED
2026-07-30 (`railway up --ci`, writer-studio / production / writer-studio-app; deployed image
`sha256:7e49bfda`). Verified LIVE at `https://writer-studio-app-production.up.railway.app`:
`/healthz` 200, the new bundle served (`index-CubIOguU.js` / `index-DfTiVdTQ.css` — matches the
merge-HEAD build byte-for-byte), `/auth/me` 401. The prior P2a deploy (`5a4da218`) is now
superseded; the rollback SOURCE remains git `ca34f67` (redeploy that tree via `railway up`).

**KEY-ROTATION REDEPLOY — 2026-07-30 (annotation, not a new build):** `TUTOR_API_KEY` (the
DeepSeek key, sitting agenda 0.5) was rotated; a `railway redeploy` of the SAME build restarted
the container to pick up the new value. **GIT identifier UNCHANGED — `c266cb3`; image UNCHANGED
— `sha256:7e49bfda` (zero code change).** The RAILWAY identifier is now
`11b612db-4be2-4d31-bca1-afd4118c99a7` (reason: redeploy); `dfa03148` superseded. Verified LIVE:
`/healthz` 200, same bundle (`index-CubIOguU.js` / `index-DfTiVdTQ.css`), `/auth/me` 401.

**TUTOR VERIFIED LIVE — 2026-07-31 (freeze-eve check):** the Tutor calls `deepseek-v4-flash`
(the env default — `TUTOR_MODEL` is UNSET in Railway, so the code default holds; the legacy
`deepseek-chat` / `deepseek-reasoner` aliases retired 2026-07-24 were **NEVER in use** here).
One live production round-trip returned **HTTP 200** on the rotated key (`POST /api/tutor/chat`,
a real reply, model echoed `deepseek-v4-flash`, 538/94 tokens). The throwaway test row
`tutor-liveness-18979@wrizo.test` is left **INERT by ruling** — no account-delete endpoint
exists; removal is Nick's word, any time (it is an empty user row, `.test` email, no pages,
Tutor turns not server-persisted). Item 83 was floated and withdrawn same-day — never opened.

**Items 74 + 71: GREEN + DEPLOYED** (74 GREEN at its merge; 71 was merged-but-undeployed, now
DEPLOYED). 74 stays open for Fable's post-merge review + the sitting; 71's review already closed GREEN.

## P2a DEPLOY MANIFEST — 2026-07-29 (chat 1, on Nick's standing "DEPLOY WHEN READY"; Fable's two-stage amendment)

**P2a — three fixes shipped while FX17 (P2b) builds** (Fable: "P2a ships now-when-green:
FX16 + FX18 + BG2 + the DF1.1 rider… P2b ships FX17 alone when chat 6 lands it"). Deploying
the `main` HEAD — this records commit's own SHA, stamped below immediately after `railway up`.

**New code since the P1+SC deploy (`5edae77`):**
- item 72 · **FX16 — the Invite, Truly Silent** (incl. SV31) · merge `48dc027` (on origin/main; not yet deployed — 5edae77 predates it)
- item 73 · **BG2 — the Beginnings, Seen** · merge `07ad0a9` (branch tip `e6b8e9a`)
- item 75 · **FX18 — the Chrome Aligned** (three-regime panel law; FX18 SUPERSEDES FX10 S1) · merge `7edd097` (branch `0ceb080`)
- item 66 · **DF1.1 — the quiescence instrument** · merge `e2b6945` (branch `30fc2ca`) — **HARNESS-ONLY, zero deployed surface** (the committed `run-suite.mjs` runner, j5 fixture, tu2 root, audit)

**App-code touched (`5edae77..HEAD`, apps/desktop/src):** `useFirstLineInvite.tsx` + `PageEditor.tsx`
(FX16); `Tutor.tsx` + `index.css` + `BoardEditor.tsx` (FX18); `index.css` (BG2). All frontend.

**Full range `5edae77..HEAD` — everything named, ZERO src outside the three arcs.** Beyond the
FX16/BG2/FX18 arcs above (the ONLY `apps/desktop/src` diff in the range — 5 files, verified) and
DF1.1's harness-only files, the reset-to-origin carried SIX records/spec commits, EACH zero
src/server (docs/ledger only, verified via `git diff-tree`): PB1 S0 `56cc113` + PB1 rulings/spec
`610245b` (item 71); FX17 S0 `bf92959` (item 74 — P2b, no patch yet); DF1.1 DoD ledger `95e9124`
(item 66); SC2-lane ledger `382d87a` + `a260723`.

**ZERO SCHEMA, ZERO SERVER FILES** across `5edae77..HEAD`: `apps/server` diff empty; no
migration/schema/db files touched (P1-manifest style, cf. 5edae77's `375c10f..HEAD`).

**Docs:** all records/reviews/briefs/scout-notes since `5edae77` (FX16/FX18/BG2/DF1.1 records,
the `fx18-scout-notes`, this manifest) — records only, no deployed surface.

**Verified at the merge HEAD (`e2b6945`):** `tsc` ×2 EXIT 0 (app + node); `build:web` clean.
**Full historic suite via DF1.1's committed `run-suite.mjs`, BOTH HARNESS_PARKED settings,
read to completion — 50/50 UNSET (CLEAN) and 50/50 PARKED (CLEAN)** on the trustworthy
instrument (DF1.1's DoD met — six clean sweeps, known-flake list EMPTY — plus its fail-fast-
on-dirty-machine guard). FX18's own file 16/16; fx10 122/122 (its 5 "full open-w" assertions
A4-parked in place — FX18 supersedes FX10 S1 per Fable's ruling; tu2's 6 FX10-superseded
width parks + the disclosure-v2 parks all still green under HARNESS_PARKED=1).

**ROLLBACK TARGET: git `5edae77` · railway `b63743ca-6f1a-412a-90c6-336897e41e98`** — the
current live production SHA (P1+SC, stamped LIVE at `1bcc843`), CONFIRMED by Fable as the P2a
rollback (2026-07-29). Production has ratcheted since P0: the P1 deploy's own target `c13182b`
is the P0-live state, so rolling P2a to it would strip P1+SC1 from a live build to cure a P2
problem. Rollback is a redeploy of 5edae77's tree (`railway up` of it).

**DEPLOY STAMP: git `ca34f67` · railway `5a4da218-f4c0-458d-aeb6-ec286c0f3e1e`** — DEPLOYED
2026-07-29 (`railway up --ci`, writer-studio / production / writer-studio-app; deployed image
`sha256:be6f550d`). Verified LIVE at `https://writer-studio-app-production.up.railway.app`:
`/healthz` 200, the new bundle served (`index-B4Bn5NUO.js` / `index-Qu-Rq3R4.css` — matches the
merge-HEAD build byte-for-byte), `/auth/me` 401. The prior P1+SC deploy (`b63743ca`) is now
superseded; the rollback SOURCE remains git `5edae77` (redeploy that tree via `railway up`).

**Items 66 / 72 / 73 / 75: GREEN + DEPLOYED, but they STAY OPEN** — Fable's post-merge reviews
FOLLOW the deploy (Nick's word); Nick's device sitting closes them. FX17 (74) stays OPEN for P2b.

## P1 + SC DEPLOY MANIFEST — 2026-07-25 (chat 1, on Nick's "DEPLOY WHEN READY")

**One deploy, both arcs, everything named** (Fable's "one word, one manifest naming both
arcs"; the SC deploy-separateness residue is superseded per item 62). Deploying the combined
`main` HEAD — this records commit's own SHA, stamped below immediately after `railway up`.

**Arc 1 — the P1 wave (new code since the P0 deploy):**
- item 68 · **FX15 — the Quiet Page** · merge `f64230d`
- item 69 · **HB2-lite — the Landing** · merge `97f90e9`
- item 70 · **M4 — the Root That Shows** · merge `7ec8125`
- item 67 · **BG1 — the Beginnings** · merge `5d5ae5e`

**Arc 2 — the SC arc (new code since the P0 deploy):**
- item 62 · **SC1 — the Script's Own Room / True Geometry** · merge `3e83f4c` (tip `22dc1c7`)

**Already live (in the deployed tree, shipped at the P0 wave — named for completeness):**
FX13 (63) · DF1 (48) · FX14 (65) · FX12 — live since **git `c13182b` / railway `cf99e5a8`**.

**Docs:** all records/reviews/briefs since `375c10f` (P0 reviews, the SV8 wipe record, the
SC records, the P1 records + amendments, the hb2-lite scout-notes, this manifest) — records
only, no deployed surface.

**ZERO SCHEMA, ZERO SERVER FILES** across the entire deployed range (`375c10f..HEAD`):
`apps/server` diff empty; no migration/schema/db files touched; no schema-at-merge word was
ever required.

**Verified at the combined merge HEAD:** `tsc` ×3 EXIT 0; `build:web` clean; DF1's
`audit-parked-records.mjs` at its known baseline (0 new edges; comment-form parks
audit-invisible by design = DF1.1 advisory 2). **Full historic suite, both settings, read to
completion — 47/47 UNARMED and 47/47 ARMED.** The armed 47/47 was reached on a QUIET machine
(Fable's ruling): two earlier armed runs each lost ONE contention-sensitive file to a
concurrent lane's harness browsers — m2 (crashed run 1, passed run 2) and `j5:120` (a
`waitFor: lens row` on an empty spread; OUTSIDE the wave's blast radius — nothing in P1
touches the Journal spread, j5 unarmed always passed, and j5 is DF1.1's known-flaky file,
its CLEARED rescinded). On a quiet machine both passed → confirmed neighbor contention, not
code. The known-flake list is `tu2` alone (th2/fx5/j4 cleared by DF1).

**ROLLBACK TARGET: git `c13182b`** — the last known-good production SHA (the P0 wave).
Rollback is a redeploy of it, one command away (`railway up` of that tree) if Nick's testing
finds anything.

**DEPLOY STAMP: git `5edae77` · railway `b63743ca-6f1a-412a-90c6-336897e41e98`** —
DEPLOYED 2026-07-25 (`railway up --ci`, writer-studio / production / writer-studio-app;
container digest `sha256:9a31b68d`). Verified LIVE at
`https://writer-studio-app-production.up.railway.app`: `/healthz` 200, the new bundle
served (`index-BQaFizCD.js` / `index-zQmMDR5X.css`), `/auth/me` 401. The prior P0 deploy
(`cf99e5a8`) is now REMOVED — superseded by this one; the rollback SOURCE remains git
`c13182b` (redeploy that tree via `railway up`).

**Items 62 / 67 / 68 / 69 / 70: GREEN + DEPLOYED, but they STAY OPEN** — Fable's four
post-merge reviews FOLLOW the deploy (Nick's word) rather than gate it, and Nick's device
sitting closes them.

## CANON DEBTS — Fable's, actionable after the gate session
7. **Rev 3 of `docs/state-of-wrizo-2026-07.md`.** A week of TTFK data now
   exists on prod; Rev 3 folds it in, plus: the ink canon, the reframed
   gate language ("merge+deploy is the test; verdicts close tickets"), the
   "Your order"/Journal-only vocabulary ruling, and the J-arc verdicts.
   Trigger: Nick's session verdicts land.
8. **F5 TTFK DoD-6 empirical close.** One small CC task: run the
   sessions_log queries against prod (non-null `surface` +
   `desk_opened_at` rows). Fold into the Rev 3 prep relay.

## POST-ARC QUEUE — unblocks when J5 ships + gates close
9. ~~**Fragments-under-Pages committee pass.**~~ **RULED — 2026-07-11**
   (`docs/fragments-under-pages-canon.md`, convened on Nick's word — "let's
   get it built" — with a sequencing pull-forward). Names the pattern `Box`
   and `ScriptDoc` already share: one jsonb column per substrate family on
   `journal_entries`, both sync mappers, boot-idempotent DDL, never a new
   collection; links live on the child (fragment `beatId?`, never a beat's
   target list); a prose-bearing substrate maintains a derived `entry.text`
   shadow, a spatial one (boxes) doesn't; each substrate gets its own
   `PageEditor()` delegate (the J4 routing rule). Ruled: `Box` conforms
   (grandfathered on schema `v`); `ScriptDoc` conforms as designed —
   **S1 may proceed** (see item 4 above, now built). Closes this item;
   future structured pageTypes join by satisfying §2's checklist in their
   own brief's Slice 0, no new committee pass required.
10. **B3 atmosphere pass · B4 ember accent finish · W5 responsive** — were
    deferred until Journal UI surfaces existed; the Spread and the Board now
    exist. B4 intersects the Journal sprint reward surface (design together).
11. **HOME verification remainder**: bighead art, sort-hint.
12. ~~Page-is-primary committee pass~~ **RULED — 2026-07-12**
    (`docs/page-primacy-canon.md`, on Nick's delegated word via Fable): tools
    orbit, navigation departs with a guaranteed way back; overlay-Drawers
    trimmed to horizon; metadata-below-page blessed final; Plan-beside-page
    pull-forward declined with reason. Build: **W2 — the way back**
    (`docs/w2-way-back-brief.md`) — **DONE, see item 6 above.**
13. ~~Progress-milestones committee pass~~ **RULED — 2026-07-12**
    (`docs/progress-milestones-canon.md`, on Nick's delegated word via
    Fable): coverage, never verdicts — circles project beat facts read-only;
    no marking gestures on writing surfaces; word targets vetoed; notecards
    get the status-dot, not a bar; one celebration grammar, B4 the final
    authority. Build: **M1 — milestone circles + notecard dots.** **DONE —
    merged/deployed 2026-07-13.** Built per `docs/m1-milestones-brief.md` on
    `m1-milestones` @ `44afe2f`, off post-W2 `main` — a read-only projection
    of a StoryPlan's beat coverage onto writing surfaces (a new
    Progress:Project setting, offered only when a StoryPlan exists — no
    greyed states) and onto Structure Board's pre-existing notecard
    status-dots (celebration-on-transition added; the Board's own
    empty/started/done vocabulary kept as shipped). Celebration tracking is
    scoped per StoryPlan — bare beat ids are framework-authored strings
    ('midpoint', 'climax', ...) shared verbatim across every project on the
    same framework, so an unscoped id space cross-talks the moment two
    projects share one (an adversarial review caught this pre-merge;
    `m1.mjs`'s fixture 3 reproduces both the false-celebration and the
    swallowed-celebration direction) — seeded from the plan's full
    unwindowed lit set, with the seen-commit deferred to the celebration
    timer's completion so App.tsx's persistence-notify force-render can't
    silently consume an unpainted celebration mid-navigation. Fable's
    review (`docs/m1-review-fable.md`) returned REQUIRED — 1 (small), 3
    advisories, two doc promotions — "best-engineered ticket of the arc,"
    no data-loss-class or architecture findings, zero-schema confirmed.
    **Folded before merge:** R1 — `Timer: On` is an independent toggle
    designed to survive every Progress value, but `showMilestones` replaced
    `ProgressBar` wholesale, silently losing the session clock under
    Progress:Project; fixed by giving `MilestoneBar` the same `rightSlot`
    `ProgressBar` already had (page number + timer ride alongside the
    circles). A1 — qualified `useMilestoneCelebration`'s header comment: the
    "still celebrates" claim holds only once the plan's scope has already
    been established by a prior render; completing a beat while Progress is
    Words and switching to Project later in the same app-load seeds that
    beat quiet on first look — inherent to storage-free session memory,
    erring in the correct (missed-pulse, not false-pulse) direction, not a
    bug. Two doc promotions: AGENTS.md gained "the harness seeding law"
    (`flushNow()`'s unconditional full-cache-flush can clobber a raw
    fixture seed made while a flush-handler surface is still mounted — seed
    from Desk instead); this file's HORIZON gained item 18 (App.tsx's
    force-render-on-every-write is a real perf ceiling eventually — no
    ticket yet). `scripts/harness/m1.mjs` grew 32 → 33 checks (Timer:On +
    Progress:Project renders both the circles and the clock). **Ruled:** the
    canon's Q4 "in the same three states" was loose drafting; keeping the
    Board's pre-existing three-state vocabulary and adding only celebration
    is the conservative, correct reading — overwriting Plan-authored
    `started` with attachment-driven `kindled` would have destroyed
    information on the one surface where status is authored. Ran the full
    suite (`tsc` ×2 + `build:web` + selftest + `j4.mjs` 26/26 + `j5.mjs`
    40/40 + `s1.mjs` 87/87 + `w1.mjs` 18/18 + `w2.mjs` 31/31 + `m1.mjs`
    33/33) green on merged `main`, pushed, `railway up`, confirmed live.
    **Zero-schema** — no server files anywhere in this diff, liveness check
    only. See `docs/backlog.md`. M1's own S25 + desktop gate items join the
    consolidated hardware session (item 2, now a ninth cluster) — Nick's
    device verdict closes the ticket. `docs/w1-close-handoff.md` Step 4:
    struck as executed on this merge — the handoff is fully spent
    (archive-headed).

## HORIZON — no ticket yet, on the map
14. **User-authored identity / rhizomatic personalization**: wordmark
    replaceable with the writer's own hand; four launch themes (Plateau,
    Flux, Volant, Nomad); single hard invariant = the orange accent.
    -> converted to TH-arc 2026-07-13 (items 19-20); wordmark replacement
    and Volant/Nomad remain horizon.
15. **Reciprocity gate** for the future workshop feature (review before
    submitting).
16. **wrizo.app Cloudflare resolution** (domain plumbing).
17. **USPTO "Wrizo" search** before significant brand investment (one
    low-threat prior use known: a throwaway utility on pi7.org).
18. **App.tsx force-renders the whole routed tree on every persistence
    write** (its sync/reactive-screens `subscribe(forceRender)` — one
    listener, every `save*`/`upsert` call notifies it). Harmless at current
    scale; a real perf ceiling eventually as the app and its write volume
    grow. M1's deferred-seen-commit in `useMilestoneCelebration` is the
    local workaround pattern for one symptom of this (an interim render mid-
    navigation-away) — not a fix for the underlying cost. No ticket yet.

## TOOLING STATUS — for any fresh session's orientation
- GitHub connector: READ-ONLY (Fable reviews via read pipe; write grant
  remains Nick's open call — amended canon would land as commits).
- Desktop Commander: chronically unstable (fresh-restart-then-degrade);
  reviews run via GitHub reads, deliverables via container files.
- CC sessions launch FROM THE REPO ROOT (`writer-studio`) or the
  permissions allowlist doesn't govern.
- AGENTS.md rules ratified 2026-07-11: harness scenarios persist as
  committed artifacts; config changes propose-never-ship (2026-07-12:
  `.vscode/settings.json` auto-approve expansion ratified post-hoc as a W1
  exception — see item 5 / `docs/w1-review-fable.md` R4; the rule stands
  for future changes).
- Per-ticket harness scripts exist from J4 forward (`scripts/harness/`);
  J3/VW predate the rule (no backfill).
- **ONE CHECKOUT PER AGENT — ratified 2026-07-16 (Fable), citing this
  same day's CD1.1-fold incident (item 26) as the trigger.** Concurrent
  sessions never share a working tree. Uncommitted edits sitting in a
  tree another session can `git checkout` out from under are now a LAW
  VIOLATION, not just a risk — this happened twice in one day on this
  exact pair of tickets (CD1.1's fold vs. HB1's build), the second time
  even after the first collision had already been caught and flagged.
  Each concurrent agent gets its own `git worktree` off the same repo
  (same remotes, fully separate working trees, no collision surface) —
  never a re-clone. To add one: `git worktree add ../<name> <branch>`
  from the repo root (the branch must not already be checked out
  elsewhere — switch it out first if it is). `git worktree list` shows
  every live worktree. HB1 now builds at `../wrizo-hb1` on
  `hb1-threshold`; CD1's session keeps the original checkout
  (`writer-studio`) on `main`. Any future third concurrent agent gets
  its own worktree the same way before it writes a single file.
78. **FX17-S4 — fit to content (the board seen whole).** **OPENED — 2026-07-30
    (chat 6), on Fable's categorical ruling that FX17's S4 YIELDS.** Authority SV23, carried
    out of the P2 wave's §FX17 (`p2-wave.md`) with S1-S3 shipped as P2b. Post-vacation.
    UI/harness only; zero schema, zero server. **Scope is the MINIMAL reading of Nick's
    ask** — "as far out as needed to see the entire board" is fit-to-content, NOT a
    general zoom UI; a zoom slider is a feature and is not this item.
    **THE MECHANISM, preserved verbatim as Fable ordered (chat 6's S4 design, unbuilt):**
    fit-to-content wants no new coordinate system. Introduce a transient `viewScale` and let
    `pageWidthPx` be `base x viewScale`. Because every box's x/y/w/h is ALREADY a fraction
    of `pageWidthPx`, and because the drag delta divides by that same value, the whole board
    — positions, sizes, and the pointer math — scales uniformly and stays consistent
    for free. Fit factor is
    `min(1, availClientH / ((maxBottom + 0.08) * base), clientW / (maxRight * base))`; never
    above 1, because zooming IN is the zoom UI that waits. **NO CSS transform** — that
    would desynchronise pointer->board coords, which is precisely where FX17 S1's bug lived.
    **NO touching `canvasOverrideW`** — that is a PERSISTED document property, and
    overwriting it would make "zoom" silently mean "resize", mutating what the writer made
    (the same principle as *a limit stops; it never relocates*).
    **THE OPEN DECISION, for Nick's hardware — do not pre-empt it:** WHERE the control
    lives. `board-action-row` is selection-gated and cannot host an always-available view
    control. The always-present candidate is `board-mode-strip`, but BM1 ruled *"doors are
    doors, modes are modes"* and a view control is neither — placing it there spends a
    ratified law. The alternative is the sliver's instrument foot (FX3 S5's home for
    instruments), a larger change than the minimal reading implies. Chat 6 escalated rather
    than choose; Fable recorded it here as Nick's call.
    **DoD:** the whole board can be seen at once, and no ratified chrome law is spent doing
    it.
82. **The Spread hydration reds (`j4` + `j5`) — and the order-dependent family beside
    them.** **OPENED — 2026-07-31 (chat SC2-successor), on Fable's order.** *(Numbered 82
    as ruled; 79/80/81 are unclaimed on `main` at open time and presumed in flight in
    other lanes — a gap is safer than a collision across six lanes.)* **This item exists
    because a full suite on CLEAN `main`, with zero SC2 in the tree, is RED at both
    settings on the eve of the freeze.**
    **ANNOTATION — APPEND-ONLY, 2026-07-31 (chat 6, on Fable's order; the entry above
    stands unrewritten). THIS FINDING IS UNDER PROVENANCE REVIEW, AND ITS CONTROL DID NOT
    REPRODUCE.** Re-run at the control SHA this entry names — tree `9b30273`, served bundle
    **`index-CubIOguU.js`** (523,769 bytes), rebuilt immediately before running, committed
    runner, glob 52, both settings serially, contamination guard satisfied (no
    `--ignore-foreign`; no CONTAMINATED/REFUSED/ABORTED line on either sweep): **52/52
    CLEAN unset AND 52/52 CLEAN parked.** All five named reds passed — `j5` PASS 37 (and
    5x total, four of them standalone unset, against "failed every unset run, in-suite and
    isolated"); `j4` PASS 24 unset / 28 parked; `b2-1` PASS 28 (+5 standalone parked runs
    green, so 77(b) does not live in the file alone); `th2` PASS 42 both; `fx6` PASS 37
    both. **THE CONTROL'S OWN IDENTITY IS THE PROBLEM, NOT THE OBSERVER:** the sole
    identifier it records (a tree SHA) provably does not pin what runs — see item 77(c) —
    and this control's served bundle is UNRECOVERABLE (that worktree's `dist-web` was built
    01:36, *after* the 00:48-01:18 window, and its hash was recorded nowhere). **This does
    NOT close item 82:** "not reproduced" is not "does not happen", and DF1.1's law binds —
    clearance evidence must scale to the observed rarity, and one sweep per setting cannot
    prove a flip family absent. The reds remain real observations. Full report, including
    two REFUTED hypotheses preserved as spent (helper-injection timing; stale-browser
    reattachment across the second `withHarness` a parked run performs) and chat 6's own
    correction of an earlier over-claim, at `docs/wrizo-alpha/item82-diagnosis-chat6.md`.
    **Item 62's parked merge offer should not be unblocked on this annotation alone** —
    that is Fable's and Nick's call, not this lane's.
    **THE CONTROL, of record.** Tree `9b30273` (byte-identical to `a0ec245` under
    `apps/`), committed runner, glob 52, both settings serially, contamination guard
    satisfied honestly (no `--ignore-foreign`, zero foreign browsers at start):
    **51/52 unset — `j5.mjs` NOVERDICT. 51/52 parked — `th2.mjs` FAIL 2/42. NOT CLEAN
    BOTH.**
    **THE DETERMINISTIC ONE — `j5`, and it is the item's spine.** `waitFor timed out: lens
    row` at `j5.mjs:178`; the diag shows the app rendering **its own empty state** — "No
    loose pages yet — pages you write in the Journal will spread out here." That string is
    React conditional rendering on DATA, so the Spread had zero pages in state; CSS cannot
    produce rendered text, which is what structurally exonerated SC2's `index.css` (its
    only file with global blast radius) before any control was run. `j5` failed **every**
    unset run — in-suite and isolated, on BOTH trees.
    **THE SHARED ROOT.** `j4` fails at `j4.mjs:84`, `document.querySelector('[data-page-id
    ="..."]').click()` on **null**, with `.spread-select-toggle` already mounted and the
    entry present in localStorage. Both files use the **same** raw-localStorage vehicle
    (seed shape `source:'page', origin:'journal'`, then "reload to hydrate"), differing
    only in how many reloads precede the Spread read. That points at a **hydration race**
    — `getNotebookPages` reads an in-memory cache that re-hydrates on load, and a read
    landing before hydration renders the empty state — rather than a filter. PB1's +65
    lines in `persistence.ts` sit on that path; PB1 touched **neither** harness, and its
    51/51 green was measured at its branch tip `af47582`, **before** its merge into main
    at `e8ae17d` — the combined-tree gap SC1's merge-order hazard was written about.
    Mechanism named, NOT settled.
    **TWO MECHANISM QUESTIONS FOR WHOEVER TAKES THIS (Fable, 2026-07-31 — questions, not
    verdicts).** (1) `j4`'s shape — chrome mounted, localStorage populated, cell absent —
    is **DF1.1 species 2's exact signature, "chrome as the wrong observable," in a file
    DF1.1 never touched.** Supporting datum from the control: on main-parked `j4` fails
    *differently again* (`Failed to read the 'localStorage' property from 'Window': Access
    is denied for this document`, `j4.mjs:296`), so **`j4` carries at least two distinct
    failure modes.** (2) `j5`'s diag shows the lens row absent **together with** the empty
    state, which contradicts DF1.1's "chrome mounts unconditionally" note: with zero pages
    the lens row may not mount at all, which would make it a **consequence** of the empty
    spread rather than an independent symptom.
    **`fd57ee6` IS NOT THE ANSWER — checked, because it would have been the easy one.**
    The SC lane's own pre-rebase `j5` closure is an ancestor of **both** `a0ec245` and the
    SC2 head (`merge-base --is-ancestor` TRUE for each; it landed via DF1.1's merge
    `e2b6945`). **Both sides of the control contain the fix**, so this red is not that
    class resurfacing and cannot be mis-attributed on its absence. It is a **fourth
    species, or something `fd57ee6` never addressed.**
    **THE ORDER-DEPENDENT FAMILY, noted alongside item 77 pending mechanism.** These
    **flip between PASS and FAIL on an UNCHANGED tree**, which is why no code-level revert
    can explain them and why the memo-revert instrument was resequenced behind the
    control: **`fx6`** — "walking back a SECOND step … restoring the literal hyphens":
    `pass:true detail:"Hello--world "` unset, `pass:false detail:"Hello—world "` parked,
    same tree, same run; **`b2-1`** — parked NOVERDICT, `ReferenceError: __click is not
    defined` at `b2-1.mjs:110`, **exactly item 77(b)'s named signature**, reproduced after
    28 passing checks; **`th2`** — parked FAIL 2/42, "crossing the goal fires the
    celebration" → `false` (the brass-colour check failing as its consequence), while
    passing **42/42 unset in the same control** — celebrate-once state surviving across
    files; **`j4`** itself. Time-dependence was tested and is NOT supported by this run:
    all six branch observations fall inside one local day (2026-07-31, 00:48–01:18 MDT),
    no midnight or month rollover was crossed, and the two failure sets move in
    **opposite** directions along the time axis, which no monotonic date effect can
    produce. An August-side run remains a genuinely different test.
    **WHY THIS IS NOT A FLAKE LIST.** The known-flake list is EMPTY after DF1.1, and both
    "passes in isolation" and "the machine was quiet" are retired as clearance arguments.
    Every red here is therefore real until diagnosed. **DoD:** each red root-caused and
    fixed or lawfully parked, and a full suite green at both settings on `main` — which is
    also what unblocks item 62's parked merge offer.
    **FIX 2 — S0 ATTRIBUTION, PROVEN — 2026-08-01 (chat 6), on Fable's re-tasking
    after a stamped `j5` recurrence (SC2's fifth suite: parked, NEW site `:482`,
    Spread POPULATED with one seeded row absent). NO PATCH YET; attribution first.**
    **VERDICT: HARNESS MECHANICS, NOT PRODUCT RISK.** `j5`'s `makePage` does NOT use
    the app's save path — it is a raw read-modify-write on the journal-entries key
    (`j5.mjs:135` read, `:141` write) from the Desk; the app seam
    `window.wrizoCreateJournalPage` (`persistence.ts:680`) exists and is used by seven
    other harnesses, and `j5` never calls it. **PROVEN ON THE BOX, not named:**
    injecting a row exactly as `makePage` does and then navigating to `/journal`
    BEFORE reloading (what `j5` does at `:468`) destroys it within 100ms —
    `after inject n=1 hasRow=true` → `0ms true` → `100ms FALSE`, with `n` staying 1
    because the row is REPLACED. `JournalBoardGate` (`App.tsx:52-56`) mints the system
    board via `getOrCreateSystemBoard` → `saveJournalEntry` → `upsert` →
    `scheduleFlush` → `flush()`, and `flush()` serializes `cache[name]` WHOLESALE
    (`persistence.ts:170`) from a cache hydrated ONCE at module init
    (`persistence.ts:43-60`) and never re-read — no `storage` listener exists anywhere
    in `apps/desktop/src`. **THE IMMUNITY ARGUMENT:** every product write reaches
    storage THROUGH the cache, so a real writer's page is never invisible to a flush;
    only a fixture writing behind the cache's back can be erased. **IT ALSO EXPLAINS
    `j5`'s OTHER RED:** the A–D seeds share the exposure (inject `:145-148`,
    `goto('/journal')` `:161`, reload only `:173`) — when the 300ms `FLUSH_DELAY` wins
    that race the Spread renders "No loose pages yet", the exact 2026-07-25 symptom;
    when the reload wins they survive. **One mechanism, both symptoms, race-timed by a
    300ms debounce — which is why it flips on an unchanged tree.** `AGENTS.md:62-71`
    was obeyed in spirit and broken in ORDERING: seed off a flush surface, *reload from
    there*, THEN navigate.
    **SUPERSESSION — SC2's hypothesis stands VERBATIM.** Its "partial hydration, a
    stale-snapshot read racing landing writes" was **productively wrong**: the right
    race, the wrong side of the cache. The read is not stale; the WRITE is erased. It
    aimed the readers correctly and is left unrewritten.
    **CENSUS (Fable's item 3): 47 of 52 harness files contain raw writes to
    `writer-studio-journal-entries`; 7 use the seam** (ab3, b1, b2, fx1, th2, w1, w2).
    The count is APPROXIMATE (the pattern also matches generic `setItem(key, …)` lines)
    and **raw write ≠ exposure** — exposure needs a raw write AND a navigation to a
    flush surface BEFORE the re-hydrating reload; which of the 47 qualify is per-file
    work NOT done here. **`j4` IS NOT ATTRIBUTED BY THIS:** it uses the identical
    vehicle (`j4.mjs:63-66`) but the CORRECT ordering — it reloads at `j4.mjs:68`
    immediately, before navigating — so this mechanism does not explain it and **`j4`
    remains UNATTRIBUTED.** Recorded as a negative result, because the tempting move was
    to let the fix claim it for free.
    **ALSO FOUND:** `j5.mjs:311` asserts `makePage -> wrizoCreateJournalPage`, which is
    FALSE — a comment that answers the deciding question WRONGLY, and would tell an
    auditor this is product risk. Corrected with the fix.
    **FIX (b) APPROVED by Fable** (route `makePage` through the seam; it removes the
    mechanism rather than dodging the timing) **— not yet built.** Full report:
    `docs/wrizo-alpha/item82-diagnosis-chat6.md`.
    **FIX 1 — BUILT + VERIFIED; MERGE OFFERED — 2026-08-01 (chat 6), on Fable's
    re-tasking after SC2's fourth suite characterized the family.** Branch
    `item82-fix1-celebration-gate` @ **`7fd337c`** (WIP marker `4f12cb5` above it —
    empty, tree object identical, changes no code). HARNESS-ONLY: zero `src`, zero
    schema, zero server, zero deps. **THE SPECIES IS CONFIRMED AND THE DEFECT IS IN
    THE CHECKS.** The lead (m4/th2 both assert evental celebration paint without
    gating on the animation that reverts it) was a hypothesis; it is now reproduced.
    **THE MECHANISM, QUANTIFIED ON THE BROWSER'S FRAME CLOCK BEFORE ANYTHING WAS
    CHANGED** — the flare's real trajectory at 1366×768: `dt=0ms op 0.000`,
    `dt=30ms op 0.067`, `dt=46ms op 0.206`, … peak `0.620` (exactly the 14%
    keyframe), … `dt=961ms op 0.029`, `dt=1011ms op 0.012`, `dt=1027ms op 0.008`.
    **22% of the window sits at or below the 0.1 that `m4.mjs` asserted must be
    EXCEEDED** — roughly the first 40ms and last 120ms of a 1100ms animation. A
    100ms poll landing anywhere in that 22% failed a check about a product behaving
    perfectly. `th2`'s exposure is the same species without the threshold: it waited
    for `.mode-pfill.celebrate`, a class alive for only CELEBRATE_MS (1100ms), so one
    poll cycle stalling past that window under load misses it entirely and reports
    *"crossing the goal fires the celebration: false"*, taking the brass-colour check
    down as a consequence — item 82's th2 symptom exactly.
    **THE FIX is DF1.1's tu2 discipline applied to paint instead of to a timer:**
    record the event's whole life IN THE PAGE, on the browser's own clock, recorder
    installed BEFORE the trigger, then assert against the RECORD — so nothing depends
    on the harness looking at the right instant. `m4` keeps the PEAK opacity (the
    animation's designed maximum, not an arbitrary phase) and reads the schedule from
    `getAnimations()`; **the threshold RISES 0.1 → 0.5** (designed peak 0.62), so the
    bar got STRICTER while the flakiness went away, because it is measured where the
    value actually lives. A NEW check asserts the schedule itself — `wz-goal-flare`,
    1100ms, from the browser. `th2` keeps the SETTLED background. Every original check
    name preserved verbatim; nothing weakened, so **no park is owed**. m4 42 → 43
    checks; th2 42, unchanged.
    **OWNED:** `m4.mjs` is chat 6's own file and the 0.1 was chat 6's own number,
    chosen when M4's flare was built and sitting 22% inside the animation's
    sub-threshold band. This is not a correction of someone else's work.
    **A MISTAKE THE HARNESS CAUGHT, recorded because it is the point:** the first
    version of the th2 recorder captured the colour at FIRST SIGHT of the class and
    went red with `rgb(166, 255, 61)` — lime. `.mode-pfill` carries
    `transition: background .35s ease`, so `.celebrate` does not switch the fill to
    brass, it ANIMATES it over 350ms; the original waitFor was implicitly waiting that
    out and the rewrite had discarded it. R1 has real diagnostic power and proved it
    on this lane's own regression.
    **VERIFICATION (stamped, per 77(c)): DEFAULT `SUITE RESULT: CLEAN — tree=7fd337c
    bundle=index-CubIOguU.js/523769b` and PARKED `SUITE RESULT: CLEAN — tree=4f12cb5
    bundle=index-CubIOguU.js/523769b`, 52/52 each, zero FAIL/TIMEOUT/NOVERDICT, no
    contamination line.** (The halves carry different tree SHAs because the WIP marker
    was pushed between them; the identical bundle hash proves the same software.)
    **SCOPE BOUNDARY — BINDING (Fable):** *"defect in the checks, not the product"* is
    PROVEN **for `m4` and `th2` ONLY**. **`j4`, `j5`, `b2-1` and `fx6` remain
    UNATTRIBUTED** — check-versus-product is genuinely open for each, and the family
    must not inherit the species' verdict. That would be the same overreach shape as
    calling `j5` deterministic off four consecutive failures, which this arc has
    already paid for once.
    **AUGUST-SIDE READING (the desk's rider): this is the FIRST August-side suite.**
    Item 82's six observations all fall inside 2026-07-31; these sweeps ran
    2026-08-01T19:11:45Z → 19:58:00Z, crossing the month boundary they never did.
    Both settings CLEAN, so **date-math is weakened further — but not killed**, and
    the honest qualifier is that most harness date usage is month-agnostic
    `toISOString()` fixture stamping; the real exposure is day-offset arithmetic
    (tu1/tu2's "untouched for days" nudges), so a green count of 52 is broad evidence
    rather than a targeted test. A red appearing August-side that never appeared
    July-side would put date-math back on the table — and would now arrive naming its
    own tree and bundle.
    **CORRECTION — 2026-07-31, SAME LANE, ON NEW EVIDENCE. THE "DETERMINISTIC ONE" FRAMING
    ABOVE IS FALSIFIED; IT IS LEFT STANDING VERBATIM AND CORRECTED HERE, NOT REWRITTEN.**
    A fourth suite of record at `9503515` — run in a COORDINATED quiet window under the
    provenance discipline (bundle `index-DSrJF9Jz.js`, SC2-only markers `script-sequence` +
    `script-page-number` proven present in both bundles before the run) — came back
    **53/53 CLEAN at `HARNESS_PARKED` unset**, with **`j5` PASS (37 checks)** and **`j4`
    PASS (24 checks)**. `j5` is therefore **NOT deterministic.** The earlier claim
    generalised from four consecutive failures; four consecutive failures of a race are
    still a race, and the word was too strong for the evidence.
    **THIS IS NOT EXPLAINED BY CONTENTION, WHICH WAS CHECKED BEFORE THE CORRECTION WAS
    WRITTEN.** `run-suite.mjs` aborts VOID if a foreign harness browser appears mid-run;
    the original suite of record (53 files) and the clean-`main` control (52 files) both
    ran their full lists WITHOUT voiding, so both were measured on a quiet box. The
    reds were real observations on a quiet machine; what was wrong was the CLASS assigned
    to them, not the sightings.
    **THE ITEM IS THEREFORE ONE FAMILY, NOT TWO.** `j4`, `j5`, `b2-1`, `fx6`, `th2` and
    `m4` are all **order/timing-dependent races**; item 82 has no deterministic spine and
    the hydration-race mechanism named above now covers `j4`+`j5` as members of the family
    rather than as a separate class. **`m4` joins as the sixth witness** (parked FAIL 1/42:
    "S4 (Bar): the flare is ORANGE … at a real (non-zero) opacity" measured `opacity:"0"`,
    while passing 42/42 unset **in the same run**) — and `m4`+`th2` are plainly the SAME
    species: both assert **evental celebration paint that reverts**, and both were caught
    mid-fade. That pairing is the most tractable lead in this item and is where a
    successor should start: an assertion that races an animation it does not gate on is a
    defect in the CHECK, not necessarily in the product — the reciprocal of the lane
    practice that a timing claim carries a correctness gate.
    **WHAT SURVIVES THE CORRECTION UNCHANGED:** clean `main` was observed RED at both
    settings (51/52 unset, 51/52 parked) on a quiet box, so the freeze-eve finding stands;
    nothing was ever attributed to SC2; and `fd57ee6` is still an ancestor of both control
    trees, so it is still not the answer.
    **→ FIX 1 MERGED — 2026-08-01 (chat 1), merge `c228c4b`.** The DO-NOT-MERGE marker
    `4f12cb5` honored-through per the 77(c) precedent (Fable-ratified): **verified** empty,
    tree object identical to the fix `7fd337c` (tree `7574bd9`), so the merged tree IS the fix
    (stamped 52/52 CLEAN both settings). Harness-only (`m4.mjs` +104, `th2.mjs` +71); no
    re-verification owed, browserless. **m4/th2 attributed to the checks; `j4`, `j5`, `b2-1`,
    `fx6` remain UNATTRIBUTED** (the family does not inherit the species' verdict). SC2's merge
    sequence keys on this.
    **→ REVIEWED, GREEN (2026-08-01), Fable** — `docs/wrizo-alpha/item82-fix1-review-fable.md`;
    VERDICT PASS. Defect documented where it lived (m4's frame-clock trajectory, th2's .35s
    settled-value trap); recorders install BEFORE the trigger, the harness reads the RECORD;
    m4 threshold 0.1→0.5 at the designed peak (`getAnimations()`); one check added, every
    original name preserved, strengthened in place, no park owed. OBS (non-urgent): th2's
    opening comment says "MutationObserver" but the impl is an rAF sampler — one-word fix, next touch.
    **→ FIX 1 CONFIRMED IN SITU BY SC2'S FIFTH SUITE OF RECORD — 2026-08-01, tree `fd6713a`
    (SC2 rebased onto `6ec5a85`, fix 1 beneath), bundle `index-DSrJF9Jz.js/529099b`,
    coordinated window.** `m4` PASS **43** checks (42→43, the added recorder check) and `th2`
    PASS **42**, **green in BOTH passes.** The species is retired from the family by
    observation, not by inheritance. **Result: 53/53 CLEAN unset; 52/53 parked — `j5`
    NOVERDICT.** No merge offer: the gate is green at BOTH settings and it was not met.
    **THE ROOT AS RECORDED ABOVE IS REFINED BY THIS OCCURRENCE — PARTIAL, NOT EMPTY.** This
    item's mechanism paragraph names a hydration race producing an EMPTY spread ("No loose
    pages yet"). That is the shape of the earlier sightings; it is **NOT** the shape of this
    one, and a successor reading only the paragraph above would chase the wrong thing.
    Failure site is **`j5.mjs:482`, not `:178`** — `waitFor timed out: spread row j5-src-7
    present, then clicked` — and the diag shows the Spread **POPULATED**, lens row and
    controls present:
    `buttons:[… "Close","Your order","Newest","All","Text","Ink","Text+ink","☆ Starred",`
    `"Alpha text only.1","A sketch2","Delta has both.3","Golf comes first in the`
    `notebook.4","Hotel comes second in the notebook.5"]` — five rows rendered, **`j5-src-7`
    absent.** Zero checks emitted before the throw (buffered JSON → NOVERDICT).
    **THE SHARPER HYPOTHESIS FOR FIX 2:** the cache does not fail to hydrate, it hydrates a
    **STALE SNAPSHOT** — a Spread read racing seed writes that are still landing, so the
    EARLIER pages appear and the LATER ones do not. That subsumes the empty-spread sightings
    as the degenerate case (read lands before write 1) and explains why one file fails at
    DIFFERENT SITES on different runs: the race can bite anywhere in the seed sequence, and
    the site merely records where it bit. Empty vs partial is one mechanism at two amplitudes,
    not two defects.
    **`j4`, `b2-1`, `fx6` STAY UNATTRIBUTED AND QUIET — NOT RETIRED.** None of them reproduced
    in the fifth suite; that is an absence of evidence and nothing more. They are not cleared,
    not parked, and not to be cited as fixed by fix 1 — the family does not inherit the
    species' verdict in either direction. **`j5` is fix 2's target.**
    **→ FIX (b) BUILT + VERIFIED; MERGE OFFERED — 2026-08-17 (SC-chain lane). Branch
    `item82-fixb-j5-seam`, code commit `bc6f53c`, parented at `main` @ `7abd1e7` (the
    fw2 merge `a18115c` beneath it).** **→ MERGED `e9ea36c` (2026-08-17, chat 1, on
    Fable's merge order + Nick's "Merge it"): the merged `apps/` tree is BYTE-IDENTICAL to
    the stamped `bc6f53c` (55/55 both settings, bundle `index-Ch4juzEe.js`); ITEM 100
    opened, registry next free 101. NO DEPLOY — merge on green; fix (b) rides the next
    ship (P2c) on Nick's word.** `j5`'s `makePage` now seeds THROUGH
    `window.wrizoCreateJournalPage`, so the row enters the cache and no flush can erase
    it — the mechanism REMOVED, not out-timed, which is what Fable's (b)-over-(a) ruling
    asked for. The seam gained an optional `JournalPageSeed` (`id` / `text` / `createdAt`
    / `strokes`) — exactly the four things it minted for itself and `j5` therefore could
    not use. **CENSUS, and it is why this is small: `createJournalPage` has ZERO call
    sites in `apps/desktop/src`** — reachable only through the window seam (the two other
    mentions are comments naming it as Catch's model). The product blast radius is EMPTY,
    not merely small. Every field optional, every fallback the old expression, `strokes`
    set only when seeded so an unseeded row stays byte-identical. **`updatedAt` is
    deliberately NOT seedable and not faked** — `upsert` stamps it, and neither of the
    file's orderings reads it (`notebookKey` is `orderIndex ?? createdAt`; the Spread's
    "Newest" lens sorts `createdAt`), so ordering is unchanged by construction. Zero
    schema, zero server, zero deps.
    **THE MECHANISM RECORD GAINS ITS TRIGGER — the append Fable ordered, and the piece the
    paragraphs above named only as "the next flush of that collection."** The flush is not
    incidental to this file's navigation; `/journal` fires it two ways. (1) MOUNTING it
    mints/reconciles the Journal system board (`JournalBoardGate` →
    `getOrCreateSystemBoard` → `saveJournalEntry` → `scheduleFlush`), a 300ms debounced
    write of `journalEntries`. (2) **UNMOUNTING it calls `flushNow()` UNCONDITIONALLY —
    the bare call in the effect's cleanup, OUTSIDE the
    `boxesRef.current !== lastSavedRef.current` guard that gates the `visibilitychange`
    path immediately above it; `BoardEditor.tsx:983` at tree `bc6f53c`.** Cited by ANCHOR
    as well as by line on purpose: it was `:982` when this lane measured it on 2026-08-03,
    and fw2's merge moved it one line (a single import at `BoardEditor.tsx:11`) without
    touching the effect. A line number is measured at a head and does not survive an edit
    above it. `flush(name)` writes ONE collection; `flushNow()` writes EVERY collection.
    Both serialize the cache WHOLESALE over rows the cache has never held.
    **THE ARITHMETIC, which is why the item flipped on an unchanged tree.** `app.goto`
    sleeps 200ms (`runtime-verify.mjs`); the mount's flush lands at 300ms; and
    `scheduleFlush` does **NOT re-arm** (`if (flushTimers[name] !== null) return` — the
    timer is 300ms from the FIRST write, not the last). A fixture that seeded raw and then
    navigated to `/journal` therefore had roughly **80ms** to get its reload in. Win that
    race and the pages survive; lose it and they are erased by a write the fixture never
    made. **That one window produces BOTH recorded symptoms, and the amplitude is simply
    how many rows had already been rehydrated into the cache when the flush landed** —
    A–D erased at the first navigation gives the empty Spread and "No loose pages yet"
    (the 2026-07-25 sighting); the same window one slice later takes E alone, with A–D and
    G,H already cached, giving the POPULATED Spread missing exactly `j5-src-7` at
    `j5.mjs:482` (the fifth suite of record). **The "empty vs partial is one mechanism at
    two amplitudes" hypothesis recorded above is CONFIRMED, and the amplitude now has a
    CAUSE** rather than being a description of it.
    **THE FILE'S THREE OTHER RAW WRITES WERE CHECKED AND MOVED, under the seeding law's own
    clause** (*"any edit to one of the 47 raw-writing harness files checks that file's own
    exposure before it lands"*). All three were exposed; all three now seed from the Desk
    and reload BEFORE navigating (the original M1 ordering rule), with every navigation
    they performed KEPT and moved after the reload, and nothing asserted changed. **The
    star/tag patch was not optional:** post-fix, A–D are safe in the cache but that patch's
    `starred`/`tags` would have become the flush's NEW casualty — fix (b) would have traded
    a page-loss race for a lens-flag race, and a seam page carrying a raw amendment is the
    half-migrated shape the law forbids. The StoryPlan seed is narrower and recorded as
    such (a scheduled `flush(name)` writes one collection, so the board's flush never
    threatened `writer-studio-story-plans`; only a `flushNow()` does).
    **TWO COMMENTS FALSIFIED AND CORRECTED IN PLACE** (prose, not committed assertions — no
    park owed): *"Navigate away from the entry view FIRST"* (there has been no entry view
    since FX14 S2, and the `/journal` it fled to is the hazard), and a `waitFor` labelled
    **`'Journal Board (safe pre-seed landing)'`** — which named the hazard as the refuge,
    and under which the board seed had been running inside a ~40ms margin. The B1 park
    sweep's own navigation is KEPT; only the seed steps off it.
    **`j5.mjs`'s `makePage -> wrizoCreateJournalPage` COMMENT IS TRUE AGAIN, BY
    CONSTRUCTION** — annotated rather than silently repaired, so the record shows it was
    false from FX14 S2 until this fix, that item 82's own diagnosis caught it, and that the
    fix moved the CODE back rather than weakening the CLAIM.
    **VERIFICATION (stamped, per 77(c)): DEFAULT `SUITE RESULT: CLEAN — tree=bc6f53c
    bundle=index-Ch4juzEe.js/525431b` and PARKED `SUITE RESULT: CLEAN — tree=bc6f53c
    bundle=index-Ch4juzEe.js/525431b`, 55/55 each, zero FAIL/TIMEOUT/NOVERDICT, no
    contamination line, committed runner, rebuilt immediately before running, no
    `--ignore-foreign`.** Identical tree AND bundle across both halves. `j5` PASS **37**
    in both. Standalone repeats scaled to the observed rarity per DF1.1's law: **8/8 unset
    + 8/8 parked at this head, plus 11/11 unset + 10/10 parked at `85a094c` — 37
    consecutive standalone runs across both heads, zero verdict failures.**
    **THE PRE-REBASE STANDALONES CARRY, AND THE CARRY IS MEASURED RATHER THAN ARGUED**
    (Fable's ruling, 2026-08-17): `git diff 85a094c bc6f53c -- apps/desktop/src/store/
    persistence.ts apps/desktop/scripts/harness/j5.mjs` returns **EMPTY (0 lines)** —
    fix (b)'s two files are byte-identical across the rebase, so fw2 never touched this
    mechanism and the earlier rarity evidence describes the same software path. The 16 runs
    at the new head are additional, not a replacement; the carry does not have to bear the
    claim alone.
    **A FIRST STAMPED PAIR WAS DISCARDED RATHER THAN CITED, and it was GREEN.** It ran at
    tree `85a094c` (**54/54 CLEAN both settings**, `j5` PASS 37 both). **Sequence, stated
    exactly because the ruling that reached this lane assumed a different one:** the pair
    had already RUN TO COMPLETION before fw2's merge was detected — the discovery came from
    the fetch performed immediately after reading its stamps, so there was no running sweep
    left to abort and none was aborted. What was spent is ~90 minutes of box time whose
    output cannot be cited; what was NOT spent is any evidence claimed at a stale head. That
    stamp named a tree fw2 was not in — the unfalsifiable identity 77(c) exists to close —
    so it is recorded here as a green observation and is **not** the offer's evidence.
    **Re-running was not ceremony: fw2 changed `BoardEditor.tsx` (+92), the very surface
    this mechanism turns on, and the rebuild proves the software genuinely differed**
    (bundle `index-Cj7zbELe.js` → `index-Ch4juzEe.js`). Checked before re-running rather
    than assumed: fw2's hunks land at lines 11, 1160 and 2184 and leave the unmount cleanup
    intact, so the mechanism stands and only its citation moved.
    **ONE BOOT CRASH IS RECORDED RATHER THAN SWALLOWED, because the known-flake list is
    EMPTY and "it passed on the retry" is a retired clearance argument.** The first
    standalone attempt of the day died in 2s BEFORE any check ran:
    `EBUSY … open '…\ws-runtime-verify-<pid>\DevToolsActivePort'`. The mechanism is legible
    in shared infra and is NOT this fix's: `readCdpPort` (`runtime-verify.mjs:281-289`)
    polls `existsSync` and then calls `readFileSync` **with no `try`/`catch`**, so a read
    landing while the browser still holds that file dies instead of polling again. It is a
    DIFFERENT species from DF1.1's stale-profile-dir root cause (that one is a fresh process
    finding an OLD port file; this is a fresh dir whose file is mid-write), and the one-line
    cure is obvious — but `runtime-verify.mjs` is shared infra, and patching it
    mid-verification would taint this lane's own provenance. **Recorded unfixed and
    unclaimed; a ticket is owed to whoever owns the harness floor.** It did not recur in 37
    subsequent standalone runs or in any of the four sweeps. **→ OPENED AS ITEM 100 on
    Fable's ruling (2026-08-17); see its own section in this ledger's top matter. It is NOT
    a member of item 82's family** — it produces a boot crash with a stack trace and never a
    check verdict, so it cannot be a hidden explanation for any of this item's reds.
    **SCOPE HELD.** The star/tag patch and the seed Board row are **still raw writes** —
    neither has a seam to migrate to (`starred`/`tags` are an AMENDMENT to an existing row
    and no `wrizo*` seam exposes one; the seed Board is a `pageType:'board'` page with
    pre-seeded `boxes`, and `createBoardPage` is neither exposed nor takes boxes).
    Authoring those seams is **item 85 phase 2's** work and is not smuggled in here. The
    census is NOT re-derived — chat 6's 47-of-52 keeps its caveat verbatim; this build
    qualifies exactly one file. **`j4`, `b2-1` and `fx6` STAY UNATTRIBUTED** — `j4` uses the
    identical raw vehicle with the CORRECT ordering (reloads at `j4.mjs:68` before
    navigating), so this mechanism still does not explain it, and it inherits nothing from
    this fix in either direction. **NO PARK IS OWED:** every check name preserved verbatim,
    nothing weakened, count unchanged (37 live + 3 parked).
    **WHAT THE GREEN PAIR DOES AND DOES NOT DO.** It closes `j5`'s attributed mechanism —
    the one member fix 2 proved — and nothing else. **It does not close item 82.**

    **SIGHTING APPENDED — `m3`, three data points, from the MENUS lane (item 83),
    2026-08-27.** Not a park and not a clearance: reported here because it is this
    family's signature and this lane has no standing to rule on it.
    **The assertion:** *"the saturated live ground ROAMS — its rendered extent reaches
    near all four stage margins"* — the Rhizome's ambient growth layer.
    **The three runs, on code that never touched the rhizome:** 2026-08-04 run 1 PASS;
    2026-08-04 run 2 **FAIL**, identical bundle, same box, minutes apart; 2026-08-05
    (S4, merged tree) PASS. An assertion on an ANIMATED extent that alternates between
    runs of the same bytes is exactly the order/timing-dependent species this item
    characterized (m4, th2, j4, j5, b2-1, fx6).
    **DELIBERATELY NOT CLEARED.** The known-flake list is empty by DF1.1, and both
    *"it passed in isolation"* and *"the machine was quiet"* are retired as clearance
    arguments — so two greens around one red do not settle it. What the menus lane can
    say is narrower and is all it says: **nothing in the menus wave touches the rhizome**
    (proven by diff), so this red is not the wave's and the wave inherits nothing from
    it in either direction. Whether the assertion should pin an animated extent at all,
    or should measure the roam over a window instead of at an instant, is item 82's
    question to answer, not this lane's.

85. **The raw-write remediation — harness seeding migrates to the app's seams.**
    **OPENED — 2026-08-01 (chat 6), on Fable's word, from item 82 fix 2's proven
    mechanism.** Post-vacation. Harness-only in phase 2; phase 1 is analysis.
    **THE SEED — chat 6's census, with its caveat carried VERBATIM because the caveat
    is the load-bearing part: 47 of 52 harness files contain raw writes to
    `writer-studio-journal-entries`; 7 use the app seam** (ab3, b1, b2, fx1, th2, w1,
    w2). *"The raw-write count is APPROXIMATE — the pattern also matches generic
    `setItem(key, …)` lines whose key is bound elsewhere — and should be re-derived per
    file before anyone acts on it. Raw write ≠ exposure. Exposure requires BOTH a raw
    write AND a navigation to a flush-handler surface (or any `flushNow()`) BEFORE the
    re-hydrating reload. Determining which of the 47 are exposed is per-file work and is
    NOT done here."*
    **WHY IT EXISTS:** `persistence.ts` hydrates its cache ONCE at module init, never
    re-reads it, and no `storage` listener exists in `apps/desktop/src`; `flush()`
    serializes that cache WHOLESALE. A row written to localStorage after boot is
    therefore invisible to the app and is ERASED by the next flush of that collection —
    from ANY source, including one the fixture never touched. Proven at item 82 fix 2
    (a Desk-injected row destroyed within 100ms by `JournalBoardGate` minting the system
    board). A real writer is immune, because every product write reaches storage THROUGH
    the cache; this is a harness-only hazard, which is why it survived this long.
    **TWO PHASES, in order.** **Phase 1 — QUALIFICATION, per file:** for each of the 47,
    determine whether it is actually EXPOSED (raw write + a flush-surface navigation or
    `flushNow()` before the rehydrating reload). Produce a qualified list; the census
    count is a starting set, never a defect list. **Phase 2 — MIGRATION, batched:** move
    qualified files to the seam, so the mechanism is removed rather than the timing
    dodged (item 82 fix 2's own ruling: (b) over (a)).
    **QUALIFICATION MAY ATTRIBUTE OTHER ITEM-82 MEMBERS — but EVIDENCE PER MEMBER, NEVER
    INHERITANCE.** `fx6` or others may turn out to be exposed and thereby explained.
    They are NOT explained until their own exposure is demonstrated. Precedent set at fix
    2: **`j4` uses the identical raw vehicle (`j4.mjs:63-66`) and is NOT attributed** —
    its ordering is correct (it reloads at `:68`, immediately, before navigating), so the
    mechanism does not explain it and `j4` remains unattributed. That negative result is
    the standard this item holds itself to.
    **GUARD UNTIL IT LANDS:** `AGENTS.md`'s seeding law gained its successor on the same
    date — *seeding goes through the app's seams, never raw storage* (the ordering rule
    kept verbatim above it, this mechanism as its reasoning). New seeding goes through
    seams, and any edit to one of the 47 checks that file's exposure before it lands.
    **DoD:** every exposed harness seeds through a seam; the census re-derived exactly;
    each item-82 member either attributed on its own evidence or explicitly left open.
88. **The Page-panel filing incident — affordance illegibility, and three defects
    under it.** **OPENED + S0 RESOLVED AT THE EVENT LEVEL — 2026-08-02 (chat 6), on
    Fable's trip-critical order. ZERO DATA LOSS.**
    **THE EVENT (production, Nick's laptop):** on a NEW EMPTY page, opening the Page
    icon's panel and clicking "Poop" did not navigate — it toasted *"Filed to Poop."*
    Poop was then findable in neither Journal, Shelf, panel, nor the Everything export
    (111 pages, zero mentions).
    **RESOLUTION: "Poop" IS A BINDER, AND IT EXISTS.** A whole-store console search
    (`Object.entries(localStorage).filter(([k,v]) => v.toLowerCase().includes('poop'))`)
    returns **`['writer-studio-projects']`** and one project object — screenshot on
    file. Every negative is explained without loss: a binder lives in Drawers, not
    Journal or Shelf; and the Everything export walks PAGES, so a binder's NAME would
    never appear in it. **The production Postgres query was CANCELLED as unnecessary**
    — recorded as NOT RUN rather than inconclusive.
    **A NEAR-MISS WORTH RECORDING:** the Railway CLI reachable from this lane's
    worktree was linked to project `fabulous-essence` / service `pandoras-box` — an
    unrelated production system — while the primary checkout had NO link at all. A
    `railway run` issued without checking would have injected another product's
    production credentials. `railway status` has no project flag, so retargeting
    requires `railway link`, which mutates shared CLI state; this lane declined to do
    that unilaterally and reported instead.
    **(i) THE SURFACE IS CONFIRMED:** `CascadePanels.tsx:249-253` composes the Page
    face as `<PageFace subject={subject} />` (the Port/Pin verbs) followed by
    `<PlacesPanel entry={subject.entry} />` (the filing targets); the toast string is
    PlacesPanel's own (`PlacesPanel.tsx:66`). One panel — and the clicked row was a
    filing TARGET, not a navigation door, which is the whole incident.
    **88 — AFFORDANCE ILLEGIBILITY (the parent; REDESIGN routes to the MENUS ARC,
    items 83/84):** a list of binder names inside the current page's panel reads as
    "places I can GO" and is in fact "places I can PUT THIS". Nothing distinguishes a
    door from a destination. The redesign belongs to the menus arc because this panel
    is their chrome; only the defects below belong to the fix wave.
    **88a — NO VALIDATION ON THE FILING TARGET (defect → wave).** `setPageHome`
    (`persistence.ts:1380-1389`): anything not `'shelf'|'loose'|'journal'` is assigned
    straight to `entry.projectId` as "a binder id", with NO existence check. A page
    given a projectId matching no live binder is invisible to EVERY enumerator — not
    the Journal (`projectId == null` filter), not any binder's page list, not the
    Shelf. **A code-level YES to the question of whether a filing mutation can render a
    row invisible to everything including export.** Not the cause here (Poop is a real
    binder), but a live hazard on its own.
    **88b — THE LYING TOAST (defect → wave).** `PlacesPanel.tsx:63-67` — `fileTo`
    calls `setPageHome`, then `flushNow()`, then toasts `Filed to ${label}.`
    UNCONDITIONALLY. `setPageHome` early-returns when `getJournalEntry` misses, which
    is exactly the case for an UNBORN page under PB1 (an unborn row deliberately never
    enters the store). So on a new empty page — the incident's own condition — the
    toast reports a filing that never happened. Success is not conditioned on success.
    **↑ THAT DIAGNOSIS IS FALSIFIED — 2026-08-03 (fix lane). Kept verbatim above and
    corrected here, per the park-never-rewrite discipline.** `getJournalEntry` does NOT
    miss on an unborn page: it **falls through to the unborn slot** (its own tail,
    `return unbornSlot && unbornSlot.id === id ? clone(unbornSlot) : null`). The entry IS
    found, and the old code mutated it and handed it to `saveJournalEntry` — which put it
    in the cache, marked it dirty, and scheduled it to disk. **Filing an unborn page never
    no-opped and the toast never lied: it BIRTHED AN EMPTY PAGE through a side door**,
    bypassing `birth()`, leaving `setUnbornEntry(null)` uncalled (the slot kept holding
    the same id), and minting exactly the `text: ''` litter PB1 exists to prevent. The
    real defect was worse than the recorded one and in the OPPOSITE direction — a WRITE
    where the record alleged a no-op. Found because `item88.mjs` was written to the
    RECORDED mechanism and went red on the first run against the FIXED build: the harness
    falsified the brief, which is the whole reason a scenario is written before it is
    trusted.
    **88c — THE BINDER-RENDER GAP (defect → wave; ONE READ OUTSTANDING).** Poop does
    not render in Drawers, and the enumeration does not explain it: `getProjects()`
    (`persistence.ts:219-221`) filters only `!p.deletedAt`, and `DrawersTree.tsx:36-37`
    renders orphans (no drawerId, or a dead one) under an unsorted group with NO
    kind/type filter — so a live binder SHOULD appear. Two possibilities remain, with
    different fixes: Poop carries `deletedAt` (a DELETION path, not a render gap), or
    it renders and was not recognised (a LEGIBILITY gap). **Settled by one console line
    on Poop's own record — id/title/kind/type/drawerId/deletedAt/createdAt/updatedAt —
    not yet run.** Related, visible in the same tree: **UNTITLED-BINDER LITTER** —
    `createBinder` (`persistence.ts:249-253`) writes the literal string `'Untitled'`
    when given an empty title, so any path calling it without a name mints an
    indistinguishable binder. A census line over `writer-studio-projects` is owed.
    **TWO WAVE FINDINGS FROM THE ADDENDUM, independent of Poop:** Trash items are
    UNINSPECTABLE (nothing opens when clicked), and Trash renders NO DATES.
    **INTERIM RULE (relayed to Nick; in force until the affordance is redesigned): the
    Page panel is off-limits.**
92. **The New-page-card that never lands — S0 PROVEN, unbuilt.** **P1 (S12) — MECHANISM
    ESTABLISHED, NO PATCH — 2026-08-03 (fix lane).** Nick's S0 was owed before any patch;
    it is paid here, and **the hypothesis in the sitting log is not supported.**
    **NOT the cause: "Plan may have minted a second board."** `onAddPageCard`
    (`BoardEditor.tsx:1162-1166`) genuinely creates a real row AND pins it — the act is
    not a store-level no-op. And the door is **absent on system boards**
    (`beginningDoors`, `:1704`: `isSystemBoard ? [] : (...)`), so `reconcileSystemBoard`'s
    stale-pin removal — which really does delete pins whose page stops qualifying — cannot
    reach it: BoardEditor's reconcile effect returns early for user boards (`:935`).
    **THE ACTUAL MECHANISM — a stale-local-state overwrite, and the codebase already
    names the law it breaks.** `pinPageToBoard` writes the BOARD's row **in the store**.
    BoardEditor holds its cards in local React state (`const [boxes, setBoxes] =
    useState(() => initialEntry?.boxes ?? [])`, `:658`) which is initialized ONCE and, on
    a user board, never re-read — the `subscribe()` that would refresh it is inside the
    system-board-only reconcile effect. `onAddPageCard` never calls `setBoxes`. So the
    component's `boxesRef.current` still holds the PRE-PIN array, and the next save from
    that instance writes it back over the pin: the unmount cleanup (`:981`,
    `if (!unbornRef.current && boxesRef.current !== lastSavedRef.current)
    saveBoardBoxes(id, boxesRef.current)` followed by `flushNow()`) fires on the very
    `navigate('/page/:id')` that door performs, and the debounced autosave (`:964`) does
    the same after any later interaction. **The card is written and then erased by the
    surface that created it.**
    **The convention this violates is already documented, three hundred lines above the
    offending call.** `BoardEditor.tsx:665-676` (B3 S3) states it verbatim: deck cards are
    appended "via the SAME setBoxes path any other card creation already uses —
    BoardEditor's own existing debounced autosave effect persists them, exactly like
    onAddCard above. **A direct saveBoardBoxes call here instead would race that same
    debounced autosave (the harness seeding/flushNow race this project has already
    diagnosed once, generalized)**." `onAddPageCard` is the one card-creating door that
    reaches around `setBoxes` into the store — the identical race, in the product this
    time rather than a harness.
    **FIX SHAPE (unbuilt, for the next lane):** route the new card through `setBoxes` like
    every sibling door, or re-read the board after `pinPageToBoard` and `setBoxes` the
    result before navigating. **NOT patched here** — the fix is small but it is a P1
    behind two P0s, and this lane will not ship a board mutation it cannot also put a
    stamped suite behind.
    **RELATED, found in the same trace and NOT the same bug (worth its own ticket):**
    `getJournalEntry` returns null for SOFT-DELETED rows (`persistence.ts:1545`), so
    trashing a plan board makes its page's `planBoardId` pointer dangle, and the next flip
    re-mints (`getOrCreatePlanBoard`, `:1616-1620` — "Pointer dangles (board hard-gone) —
    fall through and re-birth below", which also fires for merely soft-deleted). **That IS
    a genuine second-plan-board path** — the sitting log's instinct was sound, just aimed
    at the wrong symptom.
    **ALSO FOUND, and it makes 91 and 92 likely ONE fix:** `birth()` accepts
    `opts.pinToBoardId` and `UnbornSurface.birthWith` threads it through — but **NO call
    site anywhere supplies it** (the only four `birthWith(` callers pass content only).
    The capability is dead code, and `UnbornDescriptor`/`unbornHref` have no pin field to
    carry it, which is exactly the seam Nick's item-91 verdict asks for ("a New Page
    carrying the board's binder/pin descriptor via `unbornHref`"). Building 91's descriptor
    is what would make 92's door able to say "born pinned here" in one act.
87. **The New Page's defaults — a ruled default AMENDED, not flipped.** **P1 (S3) —
    BUILT, `tsc` CLEAN, ***NOT VERIFIED*** — 2026-08-03 (fix lane, wave 2). DO NOT MERGE
    with the 91+92 wave.** Fable's box schedule closed the browser window before
    `item87.mjs` could run even ONCE: there is no harness result, no falsification run and
    no suite, so under "stamps on every claim" this item has no claim to make. It waits on
    this branch, in its own commit, for a window. Reclassified on 2026-08-03 as a
    REVERSAL of a ruled default owing a full pass with parked assertions; this is that
    pass, and the parks turned out to be none — which is a finding, not a shortcut.
    **CLAUSE 1 — "New Page lands in Draft," built ADDITIVELY (Fable's ruling 4).** The
    obvious patch — flip PageEditor's default so a loose-origin page opens in Draft —
    would have REVERSED **CD1 S8 (A7)**, which opens loose pages in Free Write on purpose
    to match the front-door posture, and which **Arrival's own Write door rides on**. A
    New Page and the Write door produce the SAME loose-origin surface, so origin cannot
    tell them apart; only the DOOR knows which it is. So the descriptor gains
    `mode` (`?mode=draft`) and **the door declares the room it opens**: `PagePanel`'s New
    Page and the board→Page door say Draft, every silent door keeps today's behaviour
    byte-for-byte, and CD1 S8 stands UNREVERSED. The writer's own remembered per-page
    mode still outranks the door — a door's opinion is about a page that does not exist
    yet, so it can never overrule a page the writer has already set. `item87.mjs` S1(c)
    is the CONTROL that proves Arrival's Write door was not collateral damage.
    **CLAUSE 2 — "Free Write hides Structure presets": ASSERTED, NOT FIXED.** The S0 read
    found it already true — PageEditor hands the sliver `kind: 'freewrite'` in Free Write
    (`PageEditor.tsx:633-653`) and `Sliver.tsx:346` renders the Structure section only
    under `content.kind === 'draft'`. Writing a fix for a clause that already holds would
    have been a change with no defect under it and a green check proving nothing. S2 locks
    the behaviour in from BOTH sides (absent in Free Write, still present in Draft) so a
    later sliver change cannot quietly undo it. **The clause did not reproduce; recorded
    rather than silently "fixed."**
    **CLAUSE 3 — "typewriter off on fresh pages," an AMENDMENT to FX2 S2 at exactly one
    point.** FX2 S2 ruled "Draft opens with typewriter ON unless the page already holds
    10+ line-equivalents," reasoning that the line-following fade helps someone starting
    and hinders someone editing. An EMPTY page seeds 0 line-equivalents, so it fell on the
    ON side **by arithmetic rather than by intent** — and a page with nothing in it has no
    lines to follow, which is the state Nick objected to. Only the empty case moves; the
    threshold rule is untouched wherever it still applies, asserted directly (S3(b): a
    ~3-line Draft page still opens ON) and independently proved by `fx2.mjs`'s own
    unchanged ~3-line check.
    **PARKS: NONE OWED — and every candidate was checked one by one rather than assumed.**
    Two structural reasons. (i) **Free Write never seeds:** `PageEditor` calls
    `seedTypewriterDefault` ONLY when the opening mode is Draft, so a fresh Free Write
    page takes the global default and is untouched by clause 3 — that covers `fx2.mjs`
    (both halves of "a fresh Free Write page opens with typewriter ON"), `hb2.mjs`
    ("Open with NO last surface degrades to a fresh Free Write page ... typewriter on")
    and `b1.mjs`'s cross-reference. (ii) `fx1.mjs`'s "a fresh prose page has typewriter ON
    by default" runs on a MANUSCRIPT chapter, which opens in Free Write by the `pageType`
    branch — case (i) again. And clause 1 parks nothing **because it is additive**:
    `ab3.mjs`/`cd1.mjs`'s "origin:'loose' opens in Free Write by default" records stay
    literally true. **Had this been built as the flip it first looked like, all of those
    would have needed parking — the empty park list is evidence the shape was right.**
    **A GAP FOUND BY READING, BECAUSE RUNNING WAS UNAVAILABLE.** `modeKey` is written
    ONLY by `switchMode` (`PageEditor.tsx`), i.e. only on an explicit choice — so the
    door's Draft was never persisted. The descriptor lives in the ADDRESS and birth
    rewrites the address to `/page/:id`; the row is loose-origin; so the NEXT visit would
    fall through to CD1 S8's rule and reopen the writer's Draft page in **Free Write**.
    "New Page lands in Draft" would have been true exactly ONCE. Closed by persisting the
    door's choice once the page is a ROOM (`!unborn`) — which keeps PB1 intact, since an
    abandoned door still writes nothing and a reload mints a fresh unborn id (persisting
    earlier would litter localStorage with keys for pages that never existed). The
    `saved` guard means it can never overwrite a choice the writer has made. **This is
    the kind of defect a harness run finds; a careful read found it instead, which is
    what a browser freeze leaves available.**
    **VERIFICATION — DONE, 2026-08-17 (the doorway ship). 8/8 GREEN; 4/8 RED against the pre-fix
bundle.** `scripts/harness/item87.mjs` ran for the FIRST TIME on this date, 13 days after the
code was written. Clause 1 (S1 a/b/d) and clause 3 (S3a) are red pre-fix; both CONTROLS pass on
BOTH builds — Arrival's Write door still opens Free Write (CD1 S8/A7 unreversed, not collateral
damage) and a Draft page that already holds work still opens typewriter-ON (FX2 S2 amended at the
EMPTY case only).
**CLAUSE 2 IS NOW PROVEN NON-REPRODUCING BY MEASUREMENT, not by reading.** S2 passes on the
pre-fix bundle too — Free Write already showed no Structure presets. The 2026-08-03 call to
ASSERT it rather than "fix" it was right, and is now backed by a measurement instead of an
argument.
**THE FIRST RUN FOUND A FIXTURE BUG IN THIS FILE — which is exactly why "BUILT, NOT VERIFIED"
was the honest label and not a formality.** S3(b) seeded its page with a RAW `localStorage`
read-modify-write, which is precisely the seeding race **AGENTS.md's own harness law forbids**:
`wrizoCreateJournalPage` writes the CACHE and flushes on a ~300ms debounce, so the raw write
clobbered the row, the page was GONE after the reload, and the run landed on Arrival and timed
out with NO verdict. Written during the browser freeze and never executed, so nothing caught it
for 13 days. **Repaired by seeding through the app's own write path** (type one short sentence —
1 line-equivalent, the same side of the 10-line threshold the original three lines tested), and
the check's name was corrected to match what it now measures rather than left describing a
fixture that no longer exists.
**→ SCOPE CHANGED BY NICK — 2026-08-17 (Fable relay, DOORWAY BRIEF ADDENDUM).** Nick amended
    the DESIGN: **clause 1 (the Draft-default door) is SUPERSEDED** by a New Page chooser coming
    via the menus arc. It is **HELD, not deleted** — the built work stays on
    `fw2-boards-and-defaults`, and its four assertions PARK in `item87.mjs` with records
    byte-frozen. **A superseded DESIGN parks exactly as a superseded ruling does**; there is no
    live successor named, because the successor is a design that does not exist yet.
    **WHAT SHIPS from item 87 in the doorway wave: clause 3 (typewriter OFF on a fresh page —
    Nick's sitting verdict, untouched by the amendment) + clause 2's assertion.** The descriptor's
    `mode` field, `PageEditor`'s door-mode read and its persistence effect, and the two doors that
    declared `?mode=draft` are all removed from the shipping subset; `structure` (item 104) is
    unaffected and stays.
    **THE 8/8 VERIFICATION STANDS AS EVIDENCE FOR THE WHOLE BRANCH** (Fable's ruling), including
    the held clause — it is what proves the held work is sound rather than abandoned. The shipping
    subset re-stamps at 4 live checks + 4 parked.
    **ONE FINDING FROM CLAUSE 1 IS OWED FORWARD TO THE CHOOSER, and is parked with it rather than
    lost:** a door-made choice that is never persisted is true exactly ONCE, because birth rewrites
    the address away. Whatever the menus arc builds will meet that same wall.
91+92. **The board's Page door, and the card that survives.** **P1+P1 (S11+S12) — BUILT
    + VERIFIED — 2026-08-03 (fix lane, wave 2).** One fix, because one S0 proved one
    subject: a page made FROM a board must end up linked TO that board, and stay linked.
    **S0 CORRECTION, append-style — the entry above stands, this amends it (Fable's
    ruling 1).** That entry says the stale-boxes erasure fires "on the very `navigate`
    that door performs." **Too strong.** `lastSavedRef = useRef(boxes)`
    (`BoardEditor.tsx:741`) is initialized to the SAME array as `boxes`, so on a board
    with no local edit the unmount guard `boxesRef.current !== lastSavedRef.current` is
    FALSE and the stale write never happens. The erasure requires an **outstanding
    unsaved edit inside the 2000ms autosave window** (`AUTOSAVE_MS`). That is not a
    contrived race — it is a writer's ordinary rhythm: place a card, and within two
    seconds reach for New Page Card. **The first draft of `item9192.mjs` asserted the
    erasure on a CLEAN board and PASSED against the pre-fix bundle** — proving nothing,
    and saying so. Staging the real precondition turned it red exactly as it should:
    `pins=[]` with `kinds=["text"]`, the stale array writing back the plain card and
    nothing else.
    **THE STAGED CATCH — why staging exists.** Reproducing that precondition also
    falsified THIS LANE'S OWN FIRST FIX. The first version assigned the store's array as
    local truth (`setBoxes(updated.boxes)`). But at the moment that door is used the
    STORE is a strict subset of what the writer sees — the diagnostic printed
    `boxesInStore = []` while the board displayed a card — so that fix would have
    preserved the pin and **silently discarded every unsaved card on the board**. One
    loss traded for another, and it would have shipped green against a clean-board
    scenario. **RATIFIED SHAPE (Fable):** append the pin to `boxesRef.current`, never a
    store read as local truth — "this component's own live boxes, not a fresh store
    read," in the deck-wizard comment's own words (`BoardEditor.tsx:665-676`, the law
    this door reached around). `S1b (c)` now asserts the unsaved card survives too.
    `pinPageToBoard` still BUILDS the box (it owns stacking placement, the idempotent
    already-pinned check, the self-pin/system-board guards); only the telling-the-
    component half was missing. `boxesRef.current` is assigned directly, not merely via
    `setBoxes`, because it is assigned during RENDER and this handler batches its update
    with a `navigate` that unmounts — there may be no further render, and the unmount
    guard reads the REF. `lastSavedRef` is deliberately left alone so that guard still
    writes the merged array on the way out.
    **ITEM 91 — reproduced verbatim.** On the Journal board, PAGE → gave `hash=#/`: the
    Wrizo landing, exactly Nick's S11. `backTo` is `'/'` for a system board
    (`BoardEditor.tsx:1678`), so the Board's one universal control ejected the writer out
    of the room. CD4 S1 reasoned an exit was honest for a permanently-unpaired board;
    **Nick overruled it**, and this is the successor.
    **THE KIND-SPLIT (RATIFIED, Fable's ruling 2) — "auto-linked back" is not one
    thing, and getting it wrong is invisible until a card vanishes:** a **USER** board's
    membership is AUTHORED, so the link is a PIN carried on the descriptor (`?pin=`) and
    applied by `birth()`, with the board's binder riding along (Nick's "binder/pin
    descriptor"); a **SYSTEM** board's membership is DERIVED and never authored (A16),
    and `reconcileSystemBoard` DELETES any pin whose page does not qualify — a pin there
    would be erased on the next reconcile, which is item 92's own defect — so the honest
    link is MEMBERSHIP (Journal takes journal-origin, the Shelf takes loose, and the
    board adopts it by itself); **TRASH** has no creatable membership and keeps the old
    exit, named rather than left to be rediscovered.
    **THE DEAD SEAM IS NOW LIVE.** `UnbornDescriptor` gains `pinBoardId`, serialized as
    `?pin=`; `birth()` reads `opts.pinToBoardId ?? d.pinBoardId`, so all four existing
    `birthWith` callers are UNTOUCHED and still inherit it. The pin rides the ADDRESS, so
    it survives a reload of the unborn surface — a page opened from a board, left, and
    returned to is still born pinned to that board. The door itself writes nothing: PB1
    survives item 91 (asserted, S2(c)).
    **VERIFICATION — `scripts/harness/item9192.mjs`, 16 checks, PROVEN TO BITE:** 10/16
    FAILED against the pre-fix bundle, 16/16 with the fix. Two CONTROLS pass on both
    builds and are labelled as such — the clean-board case (S1, which is why the first
    draft proved nothing) and Trash's preserved exit (S4) — so the file cannot be
    satisfied by a change that simply rewires every door.
    **PARKS — item 91 reverses a ruled default (CD4 S1), so assertions PARK with
    originals quoted and successors named, never silently flipped. THREE files, not
    two.** `b2.mjs`'s Shelf backTo check is re-pointed live and parked **generation 2**
    (its CD4-era park text quoted whole inside the new record name); `bm1.mjs`'s "on an
    UNPAIRED board travels to the FX10 named return (leaves the board)" is parked with
    its record byte-frozen — genuinely falsified, and for the right reason: the new
    address CONTAINS the board id as `?pin=`, so the writer no longer leaves the board
    behind, they take it with them. **`cd4.mjs` was the one this lane MISSED** on its
    first sweep (a grep for the door selector found b2 and bm1; cd4 asserts the same exit
    TWICE — the Shelf cold-load path and the unpaired-loose path) and its park section
    was documented as "an empty no-op by design," so it had no `pok` scaffolding at all.
    **The full suite is what found it**, at `[14/55] NOVERDICT` — the argument for
    running the whole suite rather than the files you think you touched. All three parked
    sections re-verified GREEN (b2 4/4, bm1 2/2, cd4 2/2, item9192 1/1).
    **TOOLING NOTE, learned the expensive way and worth a standing habit:** stopping a
    suite mid-run (`TaskStop`) ORPHANS its harness browsers, and the next run — ANY
    lane's — is then refused by the dirty-machine guard. `run-suite` self-heals only its
    OWN profile dir on the way in, so nothing reaps another run's leftovers. Recovery
    stayed lawful and is the pattern to reuse: the profile dir encodes the launching node
    PID (`ws-runtime-verify-<pid>`), so the 9 orphans were all traced to owner `25312`,
    **confirmed dead** — belonging to no live run, therefore not another lane's in-flight
    work — and killed BY EXACT PID. Never `--ignore-foreign`, never a by-name sweep.
    Cheaper still: let a doomed run finish.
    **SUITE — unparked `55/55` CLEAN**, `tree=e519854+7dirty
    bundle=index-Cib2nzSw.js/525306b` (`item9192.mjs :: PASS (16 checks)`), plus `tsc`
    clean. **PARKED: `54/55`, NOT CLEAN — one NOVERDICT (`j4.mjs`), and this lane is NOT
    clearing it.** `j4.mjs` threw `SecurityError: Failed to read the 'localStorage'
    property from 'Window'`. **The known-flake list stays EMPTY because the mechanism is
    NAMED, not excused:** `j4.mjs`'s PARKED block calls `localStorage.clear()` as its
    FIRST act, before any navigation — the only fixture in the suite that does — and
    `withHarness` does not navigate, it LAUNCHES the browser at `${base}/#/`
    (`runtime-verify.mjs:675`). Until that initial load commits, the document is still
    `about:blank` and localStorage on it throws exactly this. Every other fixture
    (`freshDesk`, everywhere) navigates first. **Pre-existing and untouched by this diff**
    — nothing in this wave goes near `j4`'s subject — and the UNPARKED run of the
    IDENTICAL bundle had `j4` green minutes earlier, which is the signature of a race
    rather than a product change. **Fixed here** by navigating first, matching every other
    fixture; **that fixture fix is itself UNRUN** (the box schedule closed the window).
    **So the parked stamp for 91+92 is OWED, not claimed** — both settings get re-run the
    moment a window opens, and the merge offer says so rather than presenting a half-stamp
    as a whole one.
    **↑ THE OWED STAMP IS NOW PAID — 2026-08-04, post-deploy-stamp, slot 1.** Re-run on a
    CLEAN, NAMED tree (branch `fw2-offer` @ `dad280e`, item 87's code deliberately absent
    so the stamp describes exactly the software being merged): **unparked `55/55` CLEAN
    and parked `55/55` CLEAN, both `tree=dad280e
    bundle=index-Cib2nzSw.js/525306b`** — no `+Ndirty` suffix, and the SAME asset hash as
    the earlier runs, which is itself the proof that item 87's code is not in the offered
    bundle. **`j4.mjs` PASSED parked**, so the navigate-first fixture fix is no longer
    unrun — the first-parked-act race is closed by exercise, not by argument.
    **ONE INCIDENT ON THE WAY, ATTRIBUTED AND NOT INHERITED:** the menus lane reported
    (record: `docs/menus/incident-2026-08-04-s4.md`) that an S4 cleanup error killed a
    browser belonging to this lane's first parked attempt. Its `e1` leg was left with a
    live node child and no browser — it would have hung to timeout and read red. **That
    run was ABANDONED and restarted rather than reported with an excused red**: chat 1
    merges on these stamps, and "54/55 with one red we agreed to disregard" is a worse
    thing to merge on than a clean 55/55. The restart cost the same wall-clock as waiting
    for the bad result and re-running one leg. **`e1` passed on the clean re-run**,
    confirming the red would indeed have been spurious. Stopping that run orphaned
    NOTHING (its browser was already dead); the full owner-liveness check was run anyway
    rather than assumed.
    **REGISTERED BY FABLE (2026-08-03):** the honest half-stamp ships as described; this
    diagnosis is entered as the **first-parked-act race species** (a fixture touching
    `localStorage` before its first navigation, racing the browser's launch load). Two
    boundaries recorded WITH it, because a species is only useful if its edges are drawn:
    **(a) THE b2-1 CONVERGENCE IS A HYPOTHESIS, NOT AN ATTRIBUTION** — same pre-commit
    window, different symptom, and its own probe is owed before anything is attributed to
    it. **This lane's data constrains it and is offered as evidence, not as a verdict:
    `b2-1.mjs` returned PASS (28 checks) in ALL SIX suite runs this lane executed —
    unparked and parked, across four distinct bundles** (`index-iOcJ71l_`,
    `index-CThKwy6K`, `index-Cib2nzSw` ×2 settings). So no b2-1 symptom is visible from
    here; whoever runs the probe should know that this window's runs do not reproduce it.
    **(b) THE ORIGINAL j4 RED (`:84` null-click, HARNESS_PARKED unset) STAYS
    UNATTRIBUTED** — the species does not inherit backwards, and this lane adds nothing to
    it either way: **that failure was never observed in any run this lane made.** j4
    returned PASS in four of this lane's five runs that reached it; the single red is the
    `:297` parked-block SecurityError diagnosed above, at a different line, a different
    setting and a different symptom.
    **ITEM 97 NOT RIDDEN — DECLINE ACCEPTED (Fable's ruling 3).** It did not fall out of
    this read (this diff touches `BoardEditor` and `unbornPage`, not
    `getOrCreatePlanBoard`), and it carries a product question — restore the trashed
    board, or re-mint and clear the pointer — that is Nick's, not a build call. Stays
    open, post-vacation.
88a+88b. **The filing target is validated; the unborn page stops being born by a side
    door.** **P0 (S5) + P1 (S6) — FIXED — 2026-08-03 (fix lane).** Closes 88a and 88b as
    a pair, because both live in `setPageHome` and one return value fixes both.
    **88a (the P0), as recorded and CONFIRMED:** `setPageHome` assigned ANY string that
    was not `'shelf'|'loose'|'journal'` straight to `entry.projectId` with no existence
    check. A page whose projectId names no live binder is invisible to EVERY enumerator —
    not the Journal (`projectId == null`), not any binder's page list, not the Shelf
    (`belongsOnShelf` excludes filed pages), not the "Everything" export. **Fix:** the
    target must name a LIVE binder via `getProject()` — the app's own definition, and the
    same one `getProjects()` uses to build the list every UI offers, so any target a
    writer could actually pick is still accepted. A deleted binder is refused for the
    same reason a nonexistent one is: filing into it orphans the page just as completely.
    **Refusals write NOTHING** — a filing that cannot be honoured leaves the page where it
    was, which is always recoverable, instead of somewhere no surface can reach.
    **88b (the P1) — THE RECORDED MECHANISM WAS WRONG; see the falsification note under
    item 88 above.** The defect was not a lying toast over a no-op; it was a WRITE:
    `getJournalEntry` falls through to the unborn slot, so filing an unborn page birthed
    an empty row through a side door, bypassing `birth()` and leaving the slot populated.
    **Fix:** `setPageHome` now reads the CACHE directly rather than `getJournalEntry`, so
    an unborn surface is not a filing subject at all. That is not a special case bolted
    on — an unborn row is by PB1's own structural law "never serialized, never synced,
    never enumerated," so a thing that is in no pool cannot be moved between pools.
    `birth()` stays the ONE path that turns a surface into a row (PB1 ruling 2), and this
    function can no longer take that job by side effect. The refusal is reportable, so
    `PlacesPanel.fileTo` and `createAndFile` now say so plainly — **Nick's own S6 verdict,
    "no toast on a no-op,"** honoured by first making it genuinely a no-op. The honest
    phrasing follows `AddToSheet.fileToShelf`'s own precedent for this exact class of lie
    ("reads the ACTUAL outcome back after the write").
    **SEAM:** `window.wrizoSetPageHome` (the `window.wrizoPinPageToBoard` pattern,
    verbatim in shape). 88a's guard exists precisely for a target NO UI can offer — every
    surface builds its list from `getProjects()` — so the refusal is unassertable from a
    harness without it. 88b needs no seam and gets none: it is reproduced as a writer, on
    a real unborn page, with a real click.
    **VERIFICATION — `scripts/harness/item88.mjs`, 10 checks, PROVEN TO BITE:** 5/10
    FAILED against the pre-fix bundle (all three 88b incident checks and both 88a guard
    checks), 10/10 with the fix. S3 is the control — the honest filing path — and passes
    on BOTH builds, so the suite cannot be satisfied by a guard that simply refuses
    everything, which would be a worse defect than the one being fixed.
    **SUITE — BOTH SETTINGS CLEAN ON THE IDENTICAL BUNDLE.** Unparked `54/54`
    (`item88.mjs :: ITEM88 VERIFY: PASS (10 checks)`) and parked `54/54`
    (`ITEM88 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed`), both
    `bundle=index-CThKwy6K.js/524897b` on `tree=37d0826` — the same asset hash on both
    runs, so the two results describe the same software and not merely the same commit.
    `tsc` clean. *(Dirty counts differ between the two stamps, `+3` then `+4`, purely
    because this file's own records edits landed between the runs; no bundle input
    moved, which the identical hash proves.)*
    **NOT TOUCHED, disclosed:** `AddToSheet` (:73/:89) and `PageFileMenu` (:29) still
    ignore the new return value. Neither is a live hazard — AddToSheet already reads its
    own outcome back and both file into ids drawn from `getProjects()` — but they are the
    obvious next callers to make honest, and they are named here rather than silently
    left. `JournalEntry.tsx`'s two calls are on an UNROUTED surface (dead since FX14).
89. **The dirty set was memory-only — every offline write was UNSENDABLE.** **P0 (S8
    of the pre-flight sitting) — S0 PROVEN + FIXED — 2026-08-03 (fix lane, chat 6's
    successor).**
    **THE MECHANISM, proven at the cited lines rather than repeated:** `dirty`
    (`persistence.ts:77`) was a module-scope `Record<CollectionName, Set<string>>` and
    nothing else. `getDirtyRecords()` (`:95-104`) filters the CACHE BY that set, so the
    set is not a hint — it is the sole gate on what sync may send. A reload before the
    next successful push therefore did not DELAY a push, it made the push IMPOSSIBLE:
    rows sat on disk, intact, permanently unsendable. Full mutation census, five sites,
    all now covered: `upsert` (:212, add), `markClean` (:106-115, delete),
    `markAllJournalEntriesDirty` (:126, add-all), `clearDraft` (:589, delete),
    `resetLocalData` (:1941, clear) — plus `applyCollection` (:1911), which READS it as
    a guard.
    **WHY IT WAS SILENT — the S0 question chat 6 left unread, now answered.** The
    Journal master list is the Journal system Board (`App.tsx:280` → `JournalBoardGate`
    → `/page/:id` → `BoardEditor.tsx:1964`); its rows come from `getJournalPages()`
    (`persistence.ts:1126-1131`) via `reconcileSystemBoard`/`qualifyingPagesFor`
    (`:1736`). **That list reads the LOCAL cache** — as does every other list in the
    product (cascade panels, Shelf, the Everything export). `api.ts` exports exactly one
    record call (`apiSync`), whose single caller merges the pull INTO that same cache.
    **No surface in Wrizo asks the server what pages exist.** So a stranded row renders
    exactly like a synced one on the device that owns it: there was no symptom to
    notice, which is how a P0 reached a device sitting.
    **THE RECORD CORRECTED — for Fable.** The sitting log and this file's own P0 summary
    say the recovered page `mscqyn48uyxk6p37l` "reappeared in the Journal master list."
    It cannot have. A **read-only production query** (project `writer-studio` /
    `production`) returns the row with **`origin: 'loose'`, `project_id: null`,
    `deleted_at: null`**, text "Testing if the address bar flips", created
    `2026-08-03T04:46:55.437Z`. `inJournalView` (`:1119-1123`) returns FALSE for any
    non-null origin that is not `'journal'`, so the row is excluded from
    `getJournalPages()` by construction. Its real surfaces are the **Shelf board and the
    cascade's "Loose" group** (both `getShelfEntries()` → `belongsOnShelf`, `:1156-1182`),
    plus the Everything export and Arrival's resume race. **The recovery is REAL and is
    now PROVEN SERVER-SIDE — the row is in production Postgres — but the surface named in
    the record was wrong.** Recorded rather than quietly repeated: a verification designed
    against that sentence would have asserted something the code says is false.
    **THE RAILWAY NEAR-MISS IS STILL LIVE, and was re-avoided.** `railway status` from
    this worktree STILL resolves to project `fabulous-essence` — the unrelated production
    system item 88 recorded. The link map is path-keyed and this worktree is absent from
    it, so the CLI walks UP to `C:\Users\nickh`, which is linked to that other product.
    The query therefore ran from the primary checkout (correctly linked to
    `writer-studio`), with `--service Postgres` for a public URL: **no `railway link`, no
    mutation of shared CLI state, no secret printed** (presence-only env checks, per the
    standing law).
    **THE FIX (src only, zero schema).** The registry is journaled to
    `writer-studio-dirty-v1` and restored at boot. `persistDirty()` is called from
    `flush()`, so the id journal lands in the SAME synchronous write as the collection it
    describes and the two can never disagree about a record that reached disk;
    `markClean` and `markAllJournalEntriesDirty` call it directly (neither touches a
    collection); `resetLocalData` removes the key (it is per-account data). **Boot PRUNES
    journaled ids to those present in the cache** — load-bearing, not tidiness: a phantom
    id (row lost inside the 300ms write window) pushes nothing while `applyCollection`
    skips it as "a local unsynced edit" FOREVER, so an unpruned journal would block the
    server's own copy from ever landing — a second way to lose a page, introduced by the
    fix for the first. "Push on reconnect" needed no new code: `sync.ts`'s `online`
    listener and boot `syncOnce(true)` already call `getDirtyRecords()`; this ticket's
    whole job was making that call return the stranded rows.
    **THE ONE-SHOT GUARD IS KEPT, reasoning recorded in `sync.ts` itself.**
    `JOURNAL_RESYNC_KEY` and persistent dirty address DISJOINT populations: persistent
    dirty saves rows that ARE dirty across a reload; the backfill saves rows wrongly
    marked CLEAN by the pre-D2 server. A clean row is invisible to a dirty-set fix by
    construction, so retiring the guard would permanently strand the exact backlog it
    exists for on any device that has not run it. What item 89 DOES retire is its
    accidental second job — being the only recovery lever for a freshly stranded page,
    the thing Fable cleared by hand on 2026-08-02. **Standing asymmetry, named rather
    than silently fixed:** that backfill covers `journalEntries` ONLY, while stranding was
    never journal-specific — projects, drawers, drafts, sessions and storyPlans stranded
    identically with NO recovery path at all, manual or otherwise. Persistent dirty is
    what covers those six.
    **VERIFICATION — `scripts/harness/item89.mjs`, 14 checks, PROVEN TO BITE.** Against
    the pre-fix bundle it returns **8/14 FAILED**, including both headline checks; with
    the fix, 14/14. The falsification run is the evidence that the file measures
    something. Two fixture lessons are committed in its header because each cost a red on
    a CORRECT build: (i) the harness double answers `/auth/me` and `/api/sync`
    successfully, so the app under test is AUTHED AND ONLINE and cleans everything it
    writes — a scenario about unsent work must make the send genuinely fail; (ii) a
    page-side `window.fetch` trap dies with the page, so the reload came back online and
    cleaned the set before the assertion could read it. **`runtime-verify.mjs` therefore
    gains `/api/_sync_mode`** (`{ fail: true }` → a real 503), added on the exact
    precedent of TU2's `/api/_tutor_mode` and defaulting to `{}`, so every pre-existing
    harness file sees byte-identical behavior. Scenarios go offline, write, **reload
    STILL OFFLINE**, and only then reconnect — the laptop closed on the plane and opened
    at the gate. The headline check is not "the flag survived" but **S1(e): the
    once-stranded page REACHES THE SERVER unattended**, measured on the wire via
    `/api/_state`.
    **DISCLOSED, not implied:** `resetLocalData`'s key removal and `markClean`'s
    persistence in the safe direction are covered by code review at their call sites, not
    asserted — driving a real logout would end the authed session the rest of the file
    depends on, and a dirty id that outlives its clean is a no-op re-push (LWW + stable
    ids). Both disclosures live in the harness header, not only here.
    **SUITE — BOTH SETTINGS CLEAN ON THE IDENTICAL BUNDLE.** Unparked `53/53`
    (`item89.mjs :: ITEM89 VERIFY: PASS (14 checks)` at [36/53]) and parked `53/53`
    (`ITEM89 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed`), both stamped
    `tree=c7878ed+4dirty bundle=index-iOcJ71l_.js/524433b` — the same asset hash on
    both runs, so the two results describe the same software and not merely the same
    commit. `tsc` clean. *(The parked run was still in flight at the fix's own commit
    `8875343`, which said so rather than claiming it; this line closes that gap.)*
    **OBSERVATION — 2026-08-17 (surfaced by SC2's sixth suite, item 62).** `persistDirty()`
    called inside `flush()` (this fix) adds **~2ms p95 to flush-adjacent timing measurements** —
    the absolute cost is trivial, but it MOVED THE BASELINE. **Re-derive baselines before any
    future timing gate** rather than reusing a pre-`persistDirty` figure; a stale baseline would
    conflate this ticket's cost with a lane's own measurement. SC2's sixth-suite records carry
    the numbers (its 20-page p95 was measured against the post-`persistDirty` floor for exactly
    this reason). Non-blocking; recorded so a later timing gate does not silently inherit a
    moved floor.
83. **Tool Pop-out Menus — the Two Hands arc OPENS.** **OPENED — 2026-08-01
    (menus lane, S0)**, naming this lane the arc's opening per Fable's ruling —
    **vetoable by Nick on sight.** Authority: SV5 (`docs/wrizo-alpha/hd-arc-seed.md`)
    + the item-83 seed. *(Numbering per the assigned-never-claimed law: 84 is the
    Tutor lane's, reserved; next free is 85. 79–81 remain the gap item 82 recorded.)*
    **DESIGN ONLY under the Aug 1 freeze:** this lane's medium is committed documents
    and HTML mockups under `docs/menus/`; it never touches `apps/`. Scope matrix, six
    contexts: Page (prose) × {Free Write, Draft, Revise} · Screenplay page · Board ·
    Card. Ink/Image stays with the HD charter, outside this matrix — a divergence the
    census names rather than silently drops.
    **PHASE 1 LANDED WITH THIS S0:** `docs/menus/item83-census.md` — the verbatim
    per-context control inventory, read against `main` @ `3dc3d49` and landed atop
    `3a5840a` — the one intervening commit verified RECORDS-ONLY against the remote
    (`docs/open-threads.md` +97, zero code: item 82's fix 1 + the COMMIT = PUSH
    elevation), so the inventory stands unmoved at the landing tip; truth-states
    BUILT / RATIFIED-UNBUILT / LEGACY / INHERITED-OPEN; eight divergences named
    (Revise deferred-in-code vs. seeded-in-matrix vs. walked-in-agenda; card color's
    Chamber B/Chamber 3 tension; the Typewriter cluster as ruled vs. as built; the
    Progress Bar three-way vs. M4's one-lane; TS1 overlap; A19 unbuilt; among them).
    Census proposes nothing — Phase 2 argues.
    **INHERITS ITEM 78 WHOLE** — the fit-to-content placement question (where the
    view control lives) is now this lane's to argue inside the two-hands grammar;
    item 78's preserved mechanism stands untouched and un-re-argued.
    **OWNS THE SHARED MENU GRAMMAR** — the Tutor lane (84) inherits it; divergences
    route to Nick, never fork silently. Screenplay-surface rows are census only —
    the SC arc (62) keeps its lane; the Card rename seam belongs to the Naming arc
    (SV4) and gets ruled with Nick, never built twice.
    **LAWS CARRIED:** fx18's three-regime panel law, constitutional for any panel
    geometry this lane draws; BM1 — doors are doors, modes are modes; a tool control
    is neither, and its home must be argued, not assumed; ZERO resting orange in
    menus (Plateau's resting ceiling stands; evental orange on press only);
    progressive disclosure never shows a locked door (M1); paper never reflows for
    chrome; a limit stops, it never relocates; presence is not composition — every
    Phase-3 mockup carries rendered dimensions at BOTH reference widths (the
    1366×768 floor + wide) from day one.
    **PHASES + GATES:** (1) census — DONE, this commit. (2) Committee double-pass
    per context — Experts, Architects, a NAMED opposition, plus the cognition/ADHD
    bench on chrome density; tensions named honestly, canon violations flagged never
    deferred. (3) ≥2 standalone HTML mockups per context, Plateau tokens only, in
    `docs/menus/`. (4) Nick's lock, sitting-informed — **NO option set locks before
    the pre-flight sitting log lands** (`device-sitting-agenda-v3.md`); then
    post-vacation HD build tickets, briefed decision-complete. Lane worktree:
    `.claude/menus` on `item83-menus`, one lane, one arc, no browser harness;
    COMMIT = PUSH inherited from its elevation (`3a5840a`) — this lane's pushes
    bind to the commit, verification follows publication.

- **REPORT = PUSH — long-standing practice, stated verbatim as it has
  always been carried in the briefs: "report = push."** A ticket's
  work is not delivered until it is on the remote; a build that ends
  with a green verification and an unpushed branch has produced
  nothing another lane can use.
- **ELEVATED 2026-08-01 (Fable's word, on chat 6's own analysis after
  the second occurrence in one lane): COMMIT = PUSH. The push binds
  to the COMMIT, not to the report. WIP markers exist precisely so
  that VERIFICATION CAN FOLLOW PUBLICATION.** The original above
  stands unrewritten; this is its stronger successor, and every lane
  inherits it.
  **THE EVIDENCE, which is why this is structural and not a scolding:
  the ledger already records FIVE occurrences of this exact class.**
  Three predate chat 6 entirely and appear in other lanes' entries in
  the same words — *"the build's own 'report = push' step never
  happened; the orchestrating session completed it"* (twice) and
  *"the build's own 'report = push' step never ran"* — each one paid
  for by an orchestrating session doing the push on the builder's
  behalf. Chat 6 supplied occurrences four (FX17 S1, 2026-07-30) and
  five (item 82 fix 1, 2026-08-01).
  **THE MECHANISM, from the lane that repeated it.** It is not
  forgetfulness. An agent's sense of "done" attaches to THE ARTIFACT
  BEING CORRECT, not to the artifact being DURABLE SOMEWHERE ELSE. So
  the instant a fix goes green, the next act that feels like progress
  is verification, and the push is silently reclassified as
  bookkeeping to be bundled with the report. That is exactly
  backwards: the window between "it works" and "it is reported" is
  when the work is simultaneously most valuable and least durable —
  and it is often 45 minutes of sweep long. A second pull runs
  underneath: pushing an unfinished branch feels like publishing
  something half-made, which is the objection the WIP marker was
  invented to dissolve and which gets re-derived anyway.
  **THE SHAPE ALL FIVE SHARE:** commit -> start long verification ->
  push at report time. Binding the push to the commit removes the
  window by construction instead of relying on anyone remembering it
  at the moment they are least inclined to.
- **FETCH BEFORE READ — for ref-holding lanes (Fable, 2026-08-01).** A lane that acts on a
  ref it holds (a SHA, a branch tip, "the suite of record at X") runs `git fetch` immediately
  before reading it: the held ref may have moved by the time it is read, and a decision made
  on a stale ref is a decision about a world that no longer exists.
  **THE CENSUS, honest — ONE proven occurrence, not inflated.** SC2's lane acted on a held
  ref that had moved under it (proven, in item 62/82's own trail). **The item-84 merge
  incident is NOT this class: RECLASSIFIED as interleaving-after-read** — two histories both
  appended after a clean read (a merge-resolution concern), not a stale-ref read. Kept
  distinct so the census stays honest: one class, one occurrence, named — not two.
  **PRECISION (Fable, 2026-08-01) — the exclusion itself was mislabeled, and the correction is
  the lesson:** what reached this lane as "the 84 incident" was TWO events under one label. (i)
  The **84 desk's relay-aged question** — read TRUE at 22:03Z, the world moved at 22:05Z, the
  claim traveled UNDATED: a RELAYED CLAIMS occurrence, not fetch-before-read. (ii) **Chat 1's
  clean auto-merge of the S0 branch** — a separate, THIRD event, merge-resolution class. Two
  events, one label, now UNSHARED. A compressed instruction reconstructed wrongly at the
  receiver — the RELAYED CLAIMS law illustrating itself.
- **PIN THEN RE-VERIFY AT ACTION TIME — the sibling for values, not refs (Fable, 2026-08-01).**
  A value pinned at read time (a hash, a count, a state) is re-verified at the instant it is
  acted on, never trusted across the gap. Fetch-before-read protects a ref; this protects a
  measurement — the same window, a different held thing.
- **RELAYED CLAIMS CARRY THEIR READ-TIME — the sibling for reports (Fable, 2026-08-01).** A
  claim relayed between lanes ("green," "at X," "clean both settings") carries WHEN it was
  read/true, so a stale claim is dated on its face and cannot be mistaken for a current one.
  The provenance stamp (77(c)) is this law made executable for suites; this states it for
  claims carried in prose.
- **THE S4 LAW — a runner's live refusal outranks metadata (RATIFIED by Nick, 2026-08-17).**
  Isolation-annotation form: *"A runner's live refusal outranks metadata; signature-kills are
  never lawful — sweep only on a verified-dead owner."* A live process refusing (the runner's
  dirty-machine VOID/REFUSE) is truth about the machine NOW and outranks any stamp or metadata
  claiming quiet; a by-name / by-signature `--headless` kill is NEVER lawful (it murders other
  lanes' in-flight runs); the only lawful sweep is of a browser whose owner node PID is VERIFIED
  DEAD. Evidence: the 2026-08-04 orphan incident (item 99, the Orphan Reaper) + twice honored
  since.
- **ROAD-DEPLOY AMENDMENT — RETIRED (Nick, 2026-08-17).** Moot now travel is over; there is no
  standing road-deploy carve-out. Re-draft fresh if travel looms again — until then the item-98
  primary-checkout guard and the explicit-per-package deploy-word gate stand unamended.
- **WORKTREE NAMED, ALWAYS — standing law (Fable, 2026-08-25).** Every brief or ruling that causes
  a file to be WRITTEN names its target WORKTREE, not just a path — a relay that names only a path
  lets a builder write wherever it stands, which is how strays land in the primary checkout and
  contaminate another lane's staging (item 110). A path without a worktree is an under-specified
  instruction; TUTOR's amended relay format and Fable's briefs/rulings now state the worktree.
- **THE BUILD ENVIRONMENT IS PART OF THE ARTIFACT — standing law (Fable, 2026-08-24; RE-DRAFTED
  2026-08-26, the principle surviving its retracted founding example).** Every suite stamp and
  deploy manifest names: **tree SHA · bundle hash+bytes · toolchain (node) · build OS · TREE CLEAN
  AT UPLOAD.** Byte-identity of served vs stamped is the **EXPECTATION of every ship** and is
  **diffed every ship.** Any divergence is diagnosed **CONTAMINATION-FIRST — the tree before the
  toolchain** — because the one observed divergence was a dirty tree, never the environment.
  **FUNCTIONALLY VERIFIED exists only as a stated, named fallback** when a diff diverges from
  proven-clean source for an explained reason. *(Founding evidence: the item-110 shipping incident
  — the contaminated `63b875b` · railway `410033f9` deploy that served `index-4pj2Iqk-.js`/537500b
  built from DECK's uncommitted mutations (DECK §9) — and the retraction that CLOSED item 111, both
  recorded in `e88def1`. The prior "Node 24 vs Node 18 / OS-level divergence" example is RETRACTED;
  git history holds it.)*
- **CLEAN TREE AT UPLOAD — standing law + item-98 guard amendment (Fable, 2026-08-26).** Immediately
  before `railway up`, `git status --porcelain` must be EMPTY — or every stray EXPLICITLY ENUMERATED
  AND AUTHORIZED — and the deploy stamp NAMES IT: *"tree clean at upload."* `railway up` uploads the
  WORKING DIRECTORY, not committed HEAD, so an uncommitted mutation in the shared checkout SHIPS to
  production (item 110's gravest consequence; proven by the hotfix-104 contaminated deploy — 90 minutes
  of an unbidden send path live). **The item-98 guard now checks PROJECT *and* TREE** (was:
  primary-checkout / project only). Enforced together with the every-ship served-vs-stamped diff — the
  diff catches a contaminated build after the fact; the clean tree PREVENTS it. (The third-pass deploy
  `2256f58` retroactively complied: its one stray, `item84-t1-s0-brief.md`, was explicitly enumerated
  in the manifest and is outside the build path — the byte-identical bundle proved no contamination.)
- **A BASELINE IS OLD PRODUCT UNDER CURRENT INSTRUMENTS — standing law (Fable, 2026-08-24).** To
  prove a fix bites, run the OLD PRODUCT but under the CURRENT harness / instruments — **harness
  infra NEVER reverts with the product.** Reverting the instruments too yields a FALSE NEGATIVE
  (the old harness lacks the check the new one adds), which reads as "the fix changed nothing."
  Evidence: the fix lane's false-negative recovery on item 104 — a baseline that reverted both
  showed no crash until the current harness was held against the old product. Move only the
  product; keep the instruments current.
- **THE RETRY-LOOP METHOD — VOID IS NOT A VERDICT — canon (DECK, ratified by Fable 2026-08-31).** A
  suite retry loop may wait for quiet and **re-run ONLY on VOID** (contention — a foreign-browser
  abort, a machine-sleep NOVERDICT); it **HALTS IMMEDIATELY on `NOT CLEAN`** and reports the failing
  files. Re-running a red until it turns green is the discipline this house has retired. The lane's
  own sentence, quoted to canon: **"Retrying contention is measuring again; retrying a red is shopping
  for an answer."** (Source: deck-phase build record §6.2; stands beside the S4 LAW and the
  known-flake discipline — item 82's watch.)
- **A MISSING PARK IS INVISIBLE TO A PASS/FAIL RUN — THE COUNT IS THE CHECK — canon (ROSTER's catch,
  ratified by Fable 2026-09-02).** A park sweep can be INCOMPLETE while both suites read CLEAN: an
  assertion rewritten in place with no parked predecessor (its `pok()` never pushed) simply runs one
  fewer check, and **a green run cannot see the check that is no longer there.** So **a green suite
  does NOT prove a park sweep complete — only COUNTING does.** Audit the park COUNT against the
  sweep's own claim; never trust the green as proof of completeness. Evidence: item-84 roster's tu2
  v4 bump stamped `TU2 PARKED: PASS (9 checks)` — the same 9 as before the ticket, against a summary
  claiming ten; caught by ARITHMETIC, not by a red. Stands beside the immutability law
  (park-never-edit) and the retry-loop doctrine.
- **THE S0-PUSH RULE — ratified 2026-07-21 (Nick, "Sure, ratify
  S0-push rule"), proposed by Fable's own FX7 review citing the
  shared-tree collision class's THIRD occurrence** (the two CD1.1/HB1
  collisions on 2026-07-16, then item 42's own concurrent-TU2 incident
  on 2026-07-21). ONE CHECKOUT PER AGENT closed the build-time version
  of this problem (concurrent agents never share a working TREE); this
  closes the remaining gap — concurrent ORCHESTRATING SESSIONS sharing
  the same primary checkout's own `main` for docs/ledger commits. **A
  session's own S0-style records commits (a brief, a ledger open, a
  status note) are never committed directly against the primary
  checkout's own local `main`.** Instead: branch off the current
  `origin/main` tip (a throwaway locally-named branch is fine, in the
  primary checkout or a worktree, either is safe since the branch
  itself never collides), commit there, then land it with a
  fast-forward-only push directly to the remote ref —
  `git push origin <local-branch-or-sha>:main` — never a plain
  `git push origin main` from a local `main` that was committed to
  directly. If that fast-forward is rejected (origin/main moved),
  fetch and re-parent before retrying — never force. **The primary
  checkout's own local `main` is reserved for MERGE operations only**
  (a ticket branch's own code merging in), each one serialized by
  Nick's own merge word, exactly as every ticket in this ledger
  already does. This preserves the exact thing that let FX7's own
  session discover TU2's concurrent work at all (an early, honest,
  disk-first ledger) while removing the shared-tree surface that made
  the discovery necessary in the first place.
- **THE PLACEHOLDER-REPORT RULE — ratified 2026-07-21 (Fable's FX8
  review), occurrence 2 in one day** (FX7's own build report, then
  FX8's own review report — both ended their turn on a stalled
  background-monitor placeholder instead of an actual completed
  report). **A stalled or placeholder report is a report that does
  not exist.** No close condition is ever satisfied by a report that
  was never written, and no agent may record a verification whose
  output it did not itself read. A ticket whose build or review
  stalls this way may still merge/close only when (a) the gap is
  named plainly in the ledger and (b) the merging agent performs its
  own compensating verification and discloses it — never silently
  treated as netted just because an agent was dispatched.
- **A LIMIT STOPS; IT NEVER RELOCATES — ratified 2026-07-30 (Fable's
  word, FX17 S3).** When a new bound arrives it may prevent further
  motion in the direction it governs; it may NOT rearrange what
  writers already made. Concretely: a card already sitting past
  `BOARD_MAX_Y` (an older save from before the constant existed, a
  deck load that placed it) keeps its position exactly — the clamp
  floors its own headroom at zero rather than clamping to a negative
  one, so the card cannot travel further down while still moving
  freely up and sideways. A stop, never a correction. Same family as
  *loose may never be nudged*. **Cite it in future geometry and theme
  work**: the test is whether merely INTRODUCING the law moves
  anything that already exists. If it does, it is not a limit — it
  is a migration, and it needs its own word.
- **ANNOTATION (2026-07-30, chat 6 — the DF1.1 lane, which
  superseded it): THE ISOLATION RULE BELOW IS RETIRED, not deleted.**
  DF1 killed "it passes in isolation" as a clearance argument
  (isolation proves a file CAN pass alone, which was never the
  question), and DF1.1 named the successor Fable ratified: **re-run
  under the conditions that produced the failure, not away from them
  — batch-then-batch-again, and only after a mechanism check.**
  DF1.1 also retired the companion argument "the machine was quiet,
  therefore not environmental": `CDP page target never appeared` has a
  second, non-contention cause (PID-keyed browser profile dirs left by
  killed runs, feeding dead ports to later runs). The entry below is
  kept verbatim for the audit trail; its own practice note — that a
  merge-gating sweep should not run alongside another session's build
  — still stands, and is now enforced mechanically by
  `run-suite.mjs`'s fail-fast refusal.
- **CONTENTION-SUSPECTED FAILURES MUST BE RE-RUN IN ISOLATION —
  ratified 2026-07-21 (Fable's FX8 review, Ruling 4a).** A harness
  check failing only inside a full-suite run, never in isolation, is
  not to be called transient on the strength of that pattern alone —
  re-run it 2-3+ times in genuine isolation first, and disclose the
  actual pattern (isolated-clean count vs. suite-failure count)
  either way. Practice note from the same ruling: a sweep whose
  result gates a merge should not itself be run alongside another
  session's own build — that is what manufactures the contention this
  rule exists to catch.
- **PARKED ENTRIES ARE IMMUTABLE — RATIFIED 2026-07-22 (Fable's word,
  the CD3 incident, item 53), NO incidental exemption.** A parked
  assertion may be superseded again (its own new park cycle, with its
  own fresh SUPERSEDED marker and successor), re-pointed at a different
  successor, or annotated with a comment — but a parked entry's own
  recorded ORIGINAL text, once parked, is never rewritten. Touching a
  parked entry's original text is never a fix. **No "plain incidental
  count bump" exemption** — the question was raised (B1's own
  `9ce8f6b` in-place edit of an already-parked `ab3.mjs` entry,
  `stripItemCount 7→8`, invoking an `fx2.mjs`-style incidental-bump
  precedent) and RULED against: a change to a parked entry's own
  tested condition is a violation regardless of how small, because the
  whole point of the frozen record is that it stays byte-true. **B1's
  count bump ruled a violation — but pre-law, already remediated (the
  CD3 fix pass restored the parked text and added a fresh generation
  rather than mutating further), no further action on that specific
  instance.** Trigger: a concurrent session's own harness edits
  mutated an already-parked historical entry in-place rather than
  starting a new park cycle (CD3), discovered by an independent audit;
  the review then found the same class had ALREADY happened once
  before, undetected (B1). The systematic question — are there OTHER
  undetected pre-law mutations across the harness tree? — becomes a
  parked-entry history-audit rider on item 48 (not this specific
  entry's concern).
  **CODICIL — ratified 2026-07-22 (Fable's A1 ruling, items 53/54;
  `docs/wrizo-alpha/a1-immutability-ruling-2026-07-22.md`), the
  RECORD-vs-PROBE distinction.** A parked check is two parts: the
  RECORD (the quoted, non-executing name/original text — frozen) and
  the PROBE (the boolean that runs, re-verifying that current reality
  still justifies the park — an instrument, never part of the record;
  it has never had to match the frozen text). **A parked entry's
  probe MAY update in place — but ONLY in a commit that also records
  the supersession event that moved reality (a fresh park cycle for
  the superseded generation + a live successor), with the probe
  update disclosed by name in the commit message.** A probe update
  arriving WITHOUT that same-commit supersession record is treated as
  a record mutation and remediated as one. The bright line: the
  record is the quoted non-executing text; the probe is what runs; a
  probe may move only when reality moved, and the record of reality
  moving must travel in the same commit. (CD3's and BM1's instances
  both satisfy it; E1.1's own `e1-rou→ndtrip` probe update rode the
  same commit that hardened the suffix, disclosed.)
- **Erratum vs. supersession, for harness checks — ratified 2026-07-16
  (Fable, cd1.1 spot-check).** Two different situations, two different
  moves. A check falsified because the DESIGN changed (a surface
  retires, a selector's target is genuinely gone) parks per A4:
  original moved verbatim (quoted, SUPERSEDED/DORMANT species, one-line
  reason) into its own file's PARKED section, a NEW live check asserts
  the new truth. A check falsified because an EARLIER REVIEW's own
  brief reading was wrong (an erratum — the code was right, the
  ground-truth call was the defect) updates IN PLACE instead: same
  check, corrected assertion, renamed with the fold's label (e.g.
  `S1/cd1.1: ...`) so its diff discloses the touch — no parking, since
  nothing about the design was ever superseded. cd1.mjs's S1 check
  (Pages/Plan toggle) is the worked example of the second case.
- **DEPLOY-MANIFEST RULE — ratified 2026-07-17 (Fable), standing across
  all tracks.** Trigger: the FX2 deploy (`railway up` @ `740b572`,
  Nick's word "Go ahead and deploy") shipped a SHA that also carried
  HB1's merged-but-not-yet-sat-with code as an unnamed rider — HB1's
  own device sitting had not happened, and no deploy clearance was ever
  given for it by name (see item 27's own retroactive-finding note).
  **A deploy ships a SHA, not a ticket.** Before any `railway up`, the
  deploying session enumerates every merged-but-undeployed ticket
  contained in the target SHA and names them ALL in the deploy request
  — Nick's deploy word is valid only against that enumeration. If any
  named ticket lacks its own deploy clearance, the deploy waits, or
  ships from the last cleared SHA instead. Practically: before typing
  "deploy," run `git log <last-deployed-SHA>..<target-SHA> --oneline`
  (or read the ledger's own merged-not-deployed items) and name every
  ticket that turns up, not just the one the request was about.

## ITEM 84 — THE TUTOR'S POP-OUT MENUS (design arc) — OPENED 2026-08-01, S0

**Charter (Nick's seed, 2026-08-01):** mode-aware pop-out menus for the Tutor —
options relevant to the writer's current mode (Free Write, Draft, Revise) and
surface, without overload. **DESIGN ONLY under the Aug 1 freeze:** committed
documents + HTML mockups in `docs/menus/tutor/`; this lane never touches
`apps/`. Phases: (1) census · (2) committee double-pass per mode + a
working-writers bench · (3) ≥2 Plateau mockups per mode, true tokens, true
geometry at both reference widths inside the FX18 three-regime panel law ·
(4) LOCK on Nick's word, sitting-informed; build tickets post-vacation.

**→ PHASE 4 CLOSED AMENDED (Nick, 2026-08-17).** The lock record lives at the 84 desk (the lock
sheet `docs/menus/tutor/tutor-menus-lock-sheet.md` on `item84/tutor-menus`, committed `5cd3968`);
Nick's words landed with **lines 1, 4, and 5 AMENDED** and a **Revise re-pass ORDERED**. Phase 4
is closed-amended — the Revise re-pass runs, then the lock record finalizes and build tickets
follow; the 84 desk holds the amended lines verbatim.
**→ LOCK RECORD ON MAIN (merge `d67352e`, 2026-08-17).** Merged `item84/tutor-menus @ 2913a4d`
(docs-only, zero apps/, zero ledger): the lock sheet + the lock record + Nick's §6 answers.
**§6 ANSWERED, Phase 4 answered whole:** Q1 (governing consultation satisfies line 3) → *"Stands"*
(TD3 phrasings lock clean with the impersonal amendment applied); Q2 (a prompt is lawful as
stimulus) → *"Stimulus"* — preset **(B) ruled lawful but builds NOTHING** until the disclosure-v4
committee drafts its carve-out sentence and Nick ratifies it. Build tickets follow the Revise
re-pass. (Relay labeled these Q1/Q2 in the reverse order; the record binds each word to the right
question's substance.)
**→ preset (B) RULED HYBRID — mechanism question CLOSED (Nick, merge `6b16783`, 2026-08-17).**
Nick's mechanism ruling splits preset (B) into two phases: the **DECK PHASE is GATE-FREE** and
enters the item-84 build brief as **its first ungated citizen** (it builds now — no disclosure
sentence required); the **MODEL PHASE** (memory / retrieval) is **item 108 — the Tutor Memory
Arc**, where the carve-out / disclosure sentence and the retrieval design settle together. Preset
(B) is no longer wholly gated: the deck ships, the model waits on item 108.

**→ THE DECK PHASE IS BUILT — offered, NOT merged, NOT deployed (2026-08-25, branch
`item84-deck-phase` from `origin/main` @ `63b875b`).** The Free Write roster lands as Nick
redesigned it at lock line 1: **(A)** the composer, which now takes focus in Free Write so
it is genuinely "blank space with a flashing cursor" · **(B)** "Writing Prompt" ·
**(C)** "Unblock" · **(D)** "Free Writing Tips" — all three **deck-drawn from local authored
pools** (24 / 16 / 14 = 54 lines), inheriting FX15's mechanism *and* its harness shape whole.
Records: `docs/menus/tutor/item84-deck-phase-s0.md` (the S0, with file:line evidence, landed
before the first patch) and `item84-deck-phase-build.md` (the build record).
**→ MERGED, SHIPPED, and FOUNDER-CONFIRMED LIVE (2026-09-02).** Merged `6a1b4b5`, shipped in the
weekend batch (production `c927e9c` · railway `3979dcaa`), and **CONFIRMED LIVE by the founder on
production**: the Free Write deck draws, the note shows, the presets work (screenshot on file). **The
deck phase's acceptance criterion is MET.** (The "offered, NOT merged, NOT deployed" line above is
the record at build time — kept as history.)
**→ DECK LANE RETIRED WITH HONORS (Fable, 2026-09-02).** The phase shipped and is founder-confirmed;
the lane is retired. **Worktree cleaned per item-110 hygiene (chat 1):** local branch
`item84-deck-phase` deleted (was merged), `.claude/worktrees/item84-deck` removed; `b308ddd` stays
reachable via main's merge `6a1b4b5` and `origin/item84-deck-phase`. **Tonight's posture (Fable):**
FIX arms the E3/E4/118 wave; TUTOR drafts the Draft-roster brief then the item-112 charter; the
committee cluster (115 + 117 + 119) queues behind TUTOR's charter as Fable's next design act. Chat 1
standing: merge green pre-authorized offers; deploy ONLY on Nick's per-package word.
**→ NICK'S STANDING SHIP WORD (Fable relay, 2026-09-02): "ship whatever we can."** PRE-AUTHORIZES the
ship of TWO named packages, each under the full gates: **(1) FIX's `fix-wave-e34-118`** (E4 + E3 + the
ab2 re-point `c871c08` + 118(a-ii), ONE merge) and **(2) the ROSTER build's eventual offer.** Per
package: verify per habits → **MERGE on green** → Fable's review at the merge → **on Fable's PASS,
DEPLOY** under the full checklist (fresh suite BOTH settings at the deploy HEAD; tree clean at upload;
build-OS/toolchain on the stamp; served-vs-stamped byte diff; manifest SHA-enumerated since the prior
live SHA; each package its own manifest). **Rollback ratchets from `c927e9c` · `3979dcaa`** (advances
per ship). **ZERO SCHEMA expected — if any offer carries schema, STOP and surface to Nick.** Any red
anywhere, or a verdict short of PASS: **STOP and report — Nick's word never covers a red.**
- **The Tutor is no longer mode-blind.** The census's headline finding is answered by one
  optional prop, `mode?: EditorMode`, threaded from the four mount sites; the roster renders
  in Free Write and **nowhere else** (Draft, screenplay, Board all absent — G3, not disabled).
  Board passes nothing, having no mode to pass.
- **NOTHING TRAVELS, and it is proven rather than promised.** A preset press fires zero
  outbound calls of any kind — asserted from both ends (a page-side counter over
  fetch/XHR/beacon/WebSocket to any URL, plus the server double's new `tutorChatCount`).
  **That assertion IS this phase's disclosure obligation, discharged by proof** — which is
  why the phase carries no disclosure gate and no carve-out sentence, exactly as §6 Q2's
  disk note said it would not need one.
- **The anti-deliberation rule is a mechanism, not a reminder.** One standing draw for the
  whole roster; a second press REPLACES it. There is no array to render, so no later edit
  can stack three. Ceiling: three draws behind one ask.
- **THE REFILL — NICK'S RULING, 2026-08-26** *(verbatim)*: *"It should reset after 100 words
  have been written with a note to the user if they try to use it a fourth time before
  writing 100 words."* This **supersedes** this lane's own inferred reading (any new writing
  or a Send), which was flagged as inferred and is kept verbatim in the build record rather
  than rewritten. Two consequences it does not state and the build cannot avoid: **a Send
  refills nothing** (he named one condition, and conversation is not it), and **a spent
  preset is no longer `disabled`** — a fourth press must *answer*, and a disabled control
  cannot speak. A deliberate departure from G3's `disabled` specimen, on his word.
  Instrument pinned, not invented: **HB1's own `useMonotonicWordCount`**, the app's existing
  ratified reading of this exact number (F1's 100 whitespace-delimited words), counted from
  the page's word count at the **third draw**. Caveat carried openly — `FirstRunGate.tsx`'s
  header calls itself non-reusable; reuse was chosen over a fourth copy of a helper already
  triplicated on disk, and the stale sentence is a correction owed to that file.
- **DECISION-COMPLETE — Nick's four rulings, 2026-08-26.** **(1) THE DECK IS APPROVED** as
  committed (54 entries, three registers); his posture recorded — *"not worth holding up
  progress right now"* — so **future rework rides normal errata, not a re-approval**.
  **(2) THE NOTE'S COPY is Nick's own line**, superseding all three desk candidates and
  shipped verbatim: **"Write 100 words to unlock more prompts"** — it carries the unlock
  condition *inside* the copy rather than reporting a state, and satisfies the voice law by
  an imperative aimed at the ACT, not the writer. **(3) RATIONING stands AS BUILT (per
  ask)**, his reasoning recorded: *"Unblock and tips are different kinds of help. We can
  revisit putting limits there later, but for now, I just don't want Users to be able to
  flip through an endless stream of prompts — defeats the purpose of getting a nudge with
  the intent of getting started."* **The Writing Prompt deck is the rationed one; REVISIT
  NOTE rides the record** — whether Unblock and Tips should be rationed at all is open, and
  open in the direction of loosening. **(4) THE WORD COUNTER is REUSED**, and
  `FirstRunGate.tsx`'s stale *"not reusable beyond that page"* header is corrected **in the
  same commit** on his principle that *a comment that lies about the code is a defect* —
  the same mirror law this house already applies to `tutor-rules.md`. The correction is
  precise: the veil and the gate stay HB1's and stay first-run-only; it is the word COUNT
  that turned out to be general.
- **(SUPERSEDED by ruling 3) the scope question:** the relay reads *"three draws exhaust the deck"*; the
  lock record reads *"up to 3 prompts may exist behind an ask."* The build keeps **per ask**
  on the lock record's wording, so three prompts + three unblocks + three tips are available
  before any hundred is owed. Pinned rather than decided; one line to change.
- **Verification: `item84.mjs`, 46 checks, and the harness BITES** — six deliberate mutations
  across two runs killed exactly the checks belonging to each broken law (19/46 and 5/46), so
  the green is a result and not a shape. **Suite of record CLEAN both settings, 60/60 each.**
- **NOT BUILT, and not stubbed toward:** the model phase, its carve-out sentence, the
  deck→model threshold, the memory seam — **item 108**, untouched. The conversation rules stay
  deferred by Nick's own sentence at lock line 1.
- **HELD FOR NICK'S WORD before the lock:** the 54-line starter deck (the prompts are the
  product, not the plumbing) and the re-arm reading above.
- **CROSS-LANE DISCLOSURE:** this lane began in the primary checkout while chat 1 was staging
  the hotfix-104 deploy from it. All three contacts repaired and verified — see the build
  record §7.1; `dist-web` was rebuilt to chat 1's exact stamped bundle
  (`index-hZQhhS8W.js`/531318b) and the primary checkout left clean at `63b875b`.

**→ THE DECK PHASE IS OFFERED TO CHAT 1 — branch `item84-deck-phase`, rebased onto
`origin/main` @ `23ffadb` (fast-forward). MERGE OFFER ONLY; no deploy word is asked for or
given.** Records: `docs/menus/tutor/item84-deck-phase-build.md` (§12 is the offer itself)
and `item84-deck-phase-s0.md`. Decision-complete on Nick's four rulings; nothing rests on
an inference. Verification: `item84.mjs`, 57 checks, and the harness BITES — nine
deliberate mutations across three runs, each killing exactly the checks belonging to the
law it broke, including one that caught a VACUOUS check of this lane's own.

**TWO FINDINGS THIS OFFER CARRIES THAT ARE NOT ABOUT THIS TICKET, and both are owed to
other desks:**

**(a) ITEM 111's PREMISE IS FALSE, and this lane caused it** (build record §9). Item 111
was opened on the reading that hotfix-104's served bundle differed from its suite-of-record
bundle given *"same source + same frozen lockfile"* — but the source was NOT the same: this
lane's uncommitted files, including four deliberate harness mutations, were in the primary
checkout when `railway up --ci` uploaded it. Proven from production: the served bundle
carried a string that existed nowhere but in mutation MUT2, and its hash and byte count
(`index-4pj2Iqk-.js`/537500b) matched this lane's own mutant build stamp exactly. **And the
Node-drift reading is contradicted, not merely unproven:** Railway genuinely rebuilds
(`railway.json` runs `build:web` under NIXPACKS; `dist-web/` is gitignored with no
`.railwayignore`, so no artifact is uploaded), and TWO independent trees each built
byte-identically across Windows/Node 24 → Linux/Node 18 — the contaminated tree, and clean
`23ffadb` (`index-CaW0zodg.js`/531457b, which is what production serves). **A standing
house note that Windows and Railway builds diverge from identical source is falsified as of
2026-08-26 and should be re-tested, not trusted.** The unbidden-send build is no longer
live; production was re-verified by download.

**(b) `m3.mjs`'s ROAMS CHECK IS NON-DETERMINISTIC — owed its own ticket to the Rhizome
desk** (build record §11/§11a/§11b). This lane's default suite came back 60/61 on that one
check. It was investigated rather than re-run away: mechanism (every expensive thing the
Tutor does is gated on `panelVisible`, and m3 never opens the panel), a matched full-suite
control on clean main (60/60 CLEAN), and a sampled distribution of six runs per tree —
**clean main produced the worst outlier, not this branch** (main 4.9·8.0·7.3·6.3·7.9·137.3
vs branch 12.1·3.1·9.6·3.3·8.1·5.4, threshold 183.3). The check asserts a geometric
property of growth seeded from `Date.now()` at app load (`RhizomeField.tsx:50`,`:165`) from
a SINGLE live seed, while the same file proves its sibling paper-avoidance law across a
40-seed sweep. **This lane did not touch it** — editing another lane's assertion to green
its own suite is what the immutability law exists to prevent. Suggested shapes, the choice
being that desk's: drive ROAMS from the same multi-seed sweep, pin `SESSION_START` behind a
harness seam, or widen the bound to the real tail.

**ALSO ROUTED, and DECLINED with evidence** (build record §10): `item84-t1-s0-brief.md` was
routed to this lane as its author. **This lane did not write it.** The session's own opening
`git status` listed it as already untracked before this lane's first action, and its subject
is the Revise error lens (T1→T3→T2…, `draftDecoration.ts`, TRR15) — 21 hits on that
vocabulary, 0 on anything of this lane's. **It is not superseded by the deck phase and must
not be deleted on this lane's word.** It belongs to the Revise re-pass desk, whose own T0
ruling would supersede its §1 ordering.

Theme adaptations only AFTER Plateau locks and builds, as their own passes
under the cross-theme seam laws.

**Canon over every option, restated at open:** the Tutor tutors — guidance and
light editing suggestions, never a ghostwriter, never prose generation
(`docs/wrizo-alpha/tutor-rules.md`, the shipped `SYSTEM_PROMPT`, verbatim on
disk). No model call without the writer's own act — nothing sends on load (the
ratified disclosure law, v3 verbatim in `deskLexicon.ts`; FX15's deck-drawn
precedent is the lawful local pattern). The Bible is the writer's alone.
Nudges stay asleep behind item 64's return gate. TU4's mechanics lens stays
DEFERRED absent Nick's word.

**S0 census landed:** `docs/menus/tutor/tutor-menus-census.md` — every
existing Tutor control and promise, byte-verbatim from `deskLexicon.ts` +
`Tutor.tsx` at main `3dc3d49` — re-verified unchanged across the
`3dc3d49..3a5840a` delta before landing — with the FX18 geometry constants
and the per-surface scoping table. **Headline finding: the Tutor is mode-blind
today** — it varies by surface (page/script/board), never by writing mode.
Item 84 is the panel's first mode-aware layer: new law, not renovated law.

**DIVERGENCE SURFACED (house law: surface, never fork):** the seed inherits a
shared menu grammar from "item 83's lane"; this ledger's own last word —
still standing at `3a5840a` — is *"Item 83 was floated and withdrawn same-day
— never opened,"* and `docs/menus/` is absent from the remote at `3a5840a`
and from all pushed history (build lane, `git log --all`). The build lane
also observed an **empty `item83-menus` branch stub** in the studio checkout
(tip `3a5840a`, zero commits, not on the remote — 404 verified by the desk):
the first sign of an 83 lane standing up, with nothing yet published for
this lane to inherit. Phase 2's grammar-inheritance clause is **HELD**
pending item 83's own S0 landing or Nick's word. Phase 1 carried no
dependency on it and is complete.

**Gates:** committee passes await Nick's ruling on the item-83 question;
no lock before the sitting log lands.


## ITEM 84 — THE DRAFT ROSTER: BUILT, STAMPED, OFFERED — 2026-09-02 (roster build lane)

**Offer:** `docs/wrizo-alpha/item84-roster-offer-to-chat1.md`. **Branch:**
`item84-roster` (worktree `.claude/worktrees/item84-roster`, never the primary
checkout — item 110). **S0:** `docs/menus/tutor/item84-draft-roster-s0.md`.
**Both settings CLEAN at `tree=4e8e1e8`, 66/66, bundle
`index-Z119zo1S.js/553267b`, no `+Ndirty`, identical bundle across the pair.**
`tsc` clean desktop AND server; `hooks-order` PASS; **ZERO SCHEMA** (migrations
untouched; the one `apps/server` file is a route-level request-body change).

**WHAT SHIPPED.** The four-chip Draft roster inside *Talk it through*, above the
composer — the mount the lock record already ruled (§1 line 1), gated on
`mode === 'drafting'`. Asks 1-3 STAGE into the composer (editable, caret placed)
and put nothing on any wire, measured from both ends. **TD4 adds exactly one wire
key, `selection`**, frozen at the press (a button press collapses the DOM
selection, so a send-time read would send the wrong thing or nothing);
`pageText` stays a render prop and never becomes a key. Per-press consent is
mechanical: pressing asks 1-3 DISARMS, and one press funds exactly one send.
A13 intact — the hosts compute the selection and hand down a read-only string
(`useSurfaceSelection.ts`); no editor ref, no text setter.

**STRINGS OF RECORD.** All four EXTRACTED programmatically from the build brief's
§2 table into both the lexicon and the harness — never retyped, so no keystroke
exists in which ask 2's em dash (U+2014) could degrade — and cross-verified
byte-for-byte against this record's own §3/§4. The overturned ask 3 stands
untouched in Pass 2 and the mockup HTML (corrected-not-rewritten) and is asserted
**absent** from the rendered app.

**DISCLOSURE v3 -> v4 EXECUTED, and it is this ledger's own ruling carried out.**
v3 names three travelers and a selection is none of them, so TD4 under v3 would
send what the shown sentence does not name — the brief's §6 stop. This ledger had
already ruled the disposition (see DISCLOSURE v4 above, the "annotation form"
line), so `CURRENT_DISCLOSURE_VERSION` is **4**: v4's ratified sentence leads the
modal (verified against its manifest — 183 bytes, md5
`9287082c0e3c0a2b243c71ce01c89b43`) and **v3's string is REUSED BY ID beneath it,
never copied and never edited**, which makes "verbatim beneath" a fact about the
line rather than a claim about it. **Fable ratified the reach** as the ledger's
supersession ruling executed, not scope invented. **BD4 collision surface stands
for chat 1 to verify at merge** — item 83's BD4 mounts on this same sentence.

**SCREENPLAY CARRIES THE ROSTER — RULED, stands as built.** `ScriptEditor` passes
`mode="drafting"` unconditionally, so a screenplay page IS a Draft page; the
roster renders there and the selection is threaded to that surface. Fable: the
roster follows the MODE, which is the design's own gate, and a dead TD4 chip on
script pages would have been the worse shape (G3's locked door). One predicate to
overrule at the desk's leisure; not blocking.

**PARK SWEEP — 5, each verbatim with a successor named.** `item84.mjs` 1 (a
**park of MEANING**: *"that Draft panel carries no roster either"* still PASSES,
reading the Free Write class, but stopped describing a panel that now carries
four chips — Fable registered this as the immutability law's subtlest form);
`tu1.mjs` +1, `tu2.mjs` +1, `tu5.mjs` +2 (the disclosure version-NUMBER
assertions only). **No WORDING assertion parks anywhere** — annotation form keeps
v3's body carrying v3's words exactly. The **ten fixture seeds moved 3 -> 4**: a
fixture repair on TU5 S6's own precedent (`tu1.mjs:98`), not a park.

**TWO DEFECTS THE LANE FOUND IN ITSELF — both recorded, neither quietly fixed.**

1. **A fixture hazard that read like an A13 breach.** `item84b.mjs` S8 returned
   `storedBefore:"" / storedAfter:<the page>`. It was not a breach: the four
   per-press DOM assertions passed throughout (that IS the A13 claim), the text
   that "appeared" was byte-identical to what was already on screen before any
   press, and `item84.mjs`'s S7 runs the same pattern and passes — the difference
   is a MODE SWITCH, which re-seeds the editor and re-persists on
   `persistence.ts`'s debounce. **MEASURED: the baseline takes 1100ms to settle,
   notably longer than `FLUSH_DELAY` (300ms) alone would suggest — the mode
   switch's re-persist is genuinely late, not one debounce tick. Any future
   fixture that switches modes and then reads the store can trip on this.**

2. **A hole in the lane's own park sweep, found by auditing the stamp rather than
   trusting it.** The v4 bump edited `tu2.mjs`'s live version check 3 -> 4 and
   updated its PARKED summary to claim an item-84 entry — **but the `pok()` call
   was never pushed**, leaving an assertion rewritten in place with no parked
   predecessor. **Both suites were CLEAN with the hole open.** The tell was
   arithmetic, not a failure: `TU2 PARKED: PASS (9 checks)`, the same 9 as before
   the ticket, against a summary claiming ten. **A GREEN SUITE DOES NOT PROVE A
   PARK SWEEP COMPLETE; ONLY COUNTING DOES** — worth the house's memory.

**BASE DRIFT HANDLED IN-LANE.** `origin/main` advanced to `a20b51f` (fix wave
E4/E3/118) mid-stamp, touching three of this ticket's files. The lane MERGED main
in and re-stamped rather than offering a green taken against a base that no longer
existed — E4's change is the unborn gate at the very line this ticket's Tutor
mounts on. One conflict (`PageEditor.tsx`), resolved keeping E4's un-gating whole
and carrying `selectionText` through it; the `send()` auto-merge was read rather
than trusted, and E4's `isUnborn` refusal correctly returns before the arm is
consumed, so an unborn surface keeps both the writer's sentence and the stretch it
points at.

**ONE MIS-TARGETED RUN, named:** a relative script path with a stale cwd ran the
PRIMARY checkout's suite (`62/62 tree=32c1ebd`). Not this lane's result and not
quoted as one. Primary's `git status` verified clean; the only trace is gitignored
`dist-web`, rebuilt from the primary's own source, and five of this ticket's
unique strings were grepped against that bundle — **all absent**, with the
worktree's bundle as a positive control. **Nothing of this lane can reach a deploy
from that tree.** Superseded stamp pairs, so none is mistaken for current:
`6aa9144` (NOT CLEAN — defect 1), `7fc1d86` (stale base), `cd2d30f` (park hole
open). **Offered: `4e8e1e8` only.**

**STILL OPEN, unchanged by this build:** the Free Write roster's model phase
(carve-out sentence + threshold + TU5 memory seam), the conversation rules
(deferred by Nick), the Revise re-pass / item 112, and **the shared-row label
collision — ROUTED to Revise, not resolved here**: Draft ships its own string
(*"Look at just this stretch — what's it doing?"*) and the reconciliation happens
when Revise exists.

**Gates:** merge on green -> Fable's review -> ship on PASS under Nick's word, own
manifest, rollback from whatever is live. **No deploy from this lane.**
