# AB3 — the Drawer and the Homes · Fable's post-merge review · 2026-07-15

**Place at:** `docs/wrizo-alpha/ab3-review-fable.md` (CC commits this file in
the ab3.1 fold).
**Reviewed:** `86462eb` (S0) → `3477c1c` (S1–S6) → `ae2b773` (S7 partial) →
`f49a8bf` (S7) → `b9993a6` (self-merge, ff to main) → `b21304d` (ledger) —
full patches — plus `AddToSheet.tsx` read whole and the RULED canon read
whole, on merged `main`. The merge preceded this review; see the process
note.

## Verdict

**GREEN — zero product-code defects found.** My pass independently confirms
the build's and the internal review's: S0's mapping traced
parameter-by-parameter (21 columns/placeholders/params aligned, an
unconditional null↔undefined fixed point both sync directions), the
grandfather conditional exact, the doors exact, the Copy path safe by
construction. **REQUIRED — 5, all harness or docs, none code:** three
harness assertions closing the suite's negative space, two record-keeping
corrections. Fixes fold as **ab3.1**. Five interpretive calls ruled below —
four sustained (one with its justification replaced and a brief erratum),
the fifth (timer/progress furniture) ruled a named AB4 slice with the
design spec attached. Item 23 closes on the fold, my delta spot-check, and
Nick's device look.

## In plain words

The drawer holds and never moves — proven byte-identical across every flip,
the last ticket's lesson built in before the component existed. The homes
law is real: pages born through project doors are invisible to the Journal;
a journal page filed onward turns up truthfully in both places; a loose
page stays loose and nothing ever nudges it. The one schema change is
exactly as declared, safe in both sync directions, every old page
grandfathered untouched. I found no bugs — the first ticket where three
separate readers of the code all came back empty-handed. What I'm requiring
is that the test rig say out loud three things the code already does
quietly, and that two record-keeping lines tell the exact truth.

## Process note (recorded once, without drama)

AB3 is the arc's first schema ticket, and schema tickets carry **no
standing merge pre-authorization** — that rule predates this build and
survives it. The merge ran ahead of this review on Nick's go, and the
ledger's "per the AB1/AB2 precedent: merge is pre-authorized" line
over-generalizes a zero-schema precedent. No harm resulted — this review
found nothing the merge should have waited for — but the record must not
compound: R5 restates the rule where the ledger misstates it. Post-merge
review gating the close (the AB1 pattern) remains lawful; pre-authorized
schema merges are not a thing.

## Required (fold as ab3.1)

### R1 — the loose fixture's negative space (harness)
On `ab3.mjs`'s existing `freshLoosePage` fixture, assert: **(a)** the rail
carries none of the journal furniture — no `.desk-toolrail-inks`, no
`.desk-toolrail-forwardlock`, capture items empty. The code's
`journalFurniture` conditional correctly excludes `'loose'`, but nothing
asserts it: `'journal'`/null are covered in ab3.mjs, `'project'` in
ab2.mjs, `'loose'` nowhere. **(b)** No below-page metadata cluster on
PageEditor's framed surface — the brief's S3 named "JournalEntry's **and
PageEditor's**" clusters, and only JournalEntry's absence is asserted
anywhere. If PageEditor still renders one framed, this check finds it and
the fold removes it; if it doesn't, the law gains its missing guard.

### R2 — the forward-lock control's click (harness)
`ae2b773` lawfully swapped the default-flow mechanic test onto a
localStorage-driven reload, and its comment claims "ab3.mjs's own
journal-origin fixture proves the rail toggle itself still works" — it
doesn't: only the control's **presence** is asserted (the A2 check).
Presence is not function; the control's click handler could unwire and the
suite stays green. On the null-origin legacy fixture (where the control
mounts), click `.desk-toolrail-forwardlock`, assert `dataset.on` flips and
the `wrizo-forward-lock` key writes.

### R3 — the active pull's olive (harness)
The brief's invariants: "the drawer's active pull wears `--accent-rest`."
The CSS honors it, comment and all; no check guards it — the exact
regression class ab2.1's F3 existed for. Assert the computed border-color
of `.wz-drawer-pull.active` is not brass (`rgb(255, 152, 0)`) — the F3
pattern: a negative assert while olive stays a working value, graduating to
a positive olive assert when the Plateau token locks.

### R4 — one truthful comment (docs, in-file)
`ab3.mjs`'s A2 section comment says "an EXPLICIT project-origin typed page
correctly shows none of it" — that assertion lives in `ab2.mjs` (its
replaced live check and its parked successor), not in this section. Point
the comment at its sibling. A future reader must not believe coverage is
local when it isn't.

### R5 — the pre-auth line (docs, ledger + backlog)
Item 23 and the backlog both say "per the AB1/AB2 precedent: merge is
pre-authorized." Correct both to the truth: AB1/AB2's pre-authorization was
the zero-schema rule; AB3 merged ahead of Fable's review on Nick's go;
schema tickets carry no standing pre-authorization. One sentence each.

## Rulings (the five interpretive calls — decisions of record)

1. **Title / no rename pipe — SUSTAINED; the brief erred.** S2's "wires the
   existing rename" assumed a pipe J10 never built: no stored title field
   exists — the model titles a page by its first line. The build's derived
   title matches every existing display verbatim (JournalEntry's `<h1>` and
   PageFace render the identical expression), and inventing a title column
   would have violated S0's one-addition law. **Erratum on the brief's S2**
   (one sentence, the AB1-R2 pattern): the rename assumption withdrawn; a
   stored title, if ever wanted, is its own future schema question — noting
   my prior that a page naming itself by its first line is more Wrizo than
   a rename field.

2. **Drawer scope (JournalEntry + PageEditor only) — SUSTAINED, with a
   named carry.** The narrow reading was honest and flagged in the commit
   itself. Carry, binding: **the Drawer reaches ScriptEditor and
   BoardEditor in AB4** (their tracks still run pre-ticket ToolRail
   wiring), bundled with the standing `BoardEditor pageKind='prose'`
   cleanup already on the ledger. A screenplay deserves a Page face too —
   but not from a fix fold.

3. **`getNotebookPages()` not origin-aware — SUSTAINED; justification
   replaced; brief erratum.** The commit's stated ground ("keeps J5 green")
   is the wrong ground — harnesses serve canon, never the reverse; had the
   design demanded it, J5's assertions would have been parked per A4 like
   everything else. The right ground, now the record: **the one-order-
   surface principle.** A page's position is granted by exactly one
   surface — the Spread orders the loose notebook; a filed page's order
   belongs to its binder. Two order-masters over one page is incoherence (a
   Spread drag fighting a binder index). Canon Law 3's letter — "keeps its
   place in the Journal; the Journal forgets nothing" — is fully satisfied
   by what the build delivers: the listing, the count, the way back, and
   the drawer telling both truths. The **brief's** S5 enumeration ("list,
   notebook nav, counts") overspecified. **Erratum on the brief's S5** (one
   sentence): notebook nav — the Spread and its prev/next flip-through — is
   the loose notebook's own sequence; the Journal's memory is the list, the
   count, and the truthful drawer. **Nick-vetoable at the device look:**
   file a page, then flip through the notebook — if its absence from the
   flip-through *feels* like forgetting, this ruling reopens.

4. **Move/Copy/Port expanded to all pages — SUSTAINED; Copy verified safe
   by construction.** The worry a schema reviewer must retire: a copy
   inheriting `origin:'journal'` would forge Journal membership.
   `AddToSheet.tsx`, read whole: **COPIES never births an entry** — it
   appends text into an existing chapter or boxes onto an existing board;
   MOVES relocates the same row, origin riding untouched; LINKS marks
   routing on the source. No path in the Add-to grammar creates a page that
   could inherit a false provenance. The two-verb law holds at the code
   level.

5. **Timer + progress furniture — RULED: a named AB4 slice, spec below;
   not ab3.1, not dropped.** Law 2 names five pieces of returning journal
   furniture; three returned. Both agents rightly refused to improvise new
   UI inside a review-pressure fold — and a fix fold is the wrong
   birthplace for two new rail modules. Equally, the canon's promise
   doesn't lapse: the ratification rider binds M1's coverage-never-verdicts
   to exactly these pieces. **Spec for the AB4 brief (mine):** in the tools
   face's journal-furniture block, beneath the ink row — the **timer** as
   one quiet numeral line (elapsed, `--text-mid`, no controls beyond the
   session's existing start/stop wiring), the **progress** as a 2px
   hairline fill directly beneath it (session words against the writer's
   own quiet target where one exists; where none exists it does not
   render). No counts announced, no celebrations, no verdicts, nothing
   orange. Coverage, never verdicts. **Nick's veto point is the device
   look:** he sits with the drawer as-built — if the absence of timer and
   progress feels like loss, the slice is confirmed; if it feels like
   peace, he says so and Law 2 takes an amendment instead.

## Advisories (carry — none block)

- **A1 —** JournalEntry.tsx still runs its own local merge-write closure
  while PageEditor uses the new shared `patchJournalEntry` (built "so both
  hosts can't drift" — one host hasn't adopted it). Migrate
  opportunistically.
- **A2 —** `PageFaceSubject.kind` is the literal `'page'`; AB4 widens the
  union per amendment A1's design. Fine as built — noted so AB4's brief
  treats the widening as expected, not surgery.
- **A3 —** (standing, restated) F3's not-brass asserts graduate to positive
  olive when Plateau's token locks — R3's new check inherits the same
  graduation.

## Scrutiny list, item by item (the handoff's six + this session's two)

| Item | Finding |
|---|---|
| S0 migration + both sync directions (script-column precedent) | **HOLDS** — additive + idempotent; the type carries the law; upsert traced parameter-by-parameter, 21/21 aligned, `origin` 15th; conflict-set guarded by the same last-write-wins; null↔undefined fixed point both directions. |
| Drawer geometry floor from day one | **HOLDS, stronger than floor** — track rect asserted **byte-identical** across all six face states; `--drawer-width` tokenizes AB1's 200px with zero value change. |
| A1 subject wiring | **HOLDS** — `subject`-typed interface, the component reads nothing else; two-page harness proof; `describePageHome` shared by both hosts. |
| Origin per door + Journal-forgets-nothing | **HOLDS** — five doors stamped, including the notebook-insert door correctly `'journal'`; the lived both-truths flow drives the real Add-to sheet; project-born absence asserted with scoped selectors; loose asserted unfiled, un-nudged, unlisted. |
| Below-paper metadata: absent framed / byte-identical legacy | **HOLDS on JournalEntry** (both directions, exact legacy string). PageEditor's side unasserted → **R1(b)**. |
| Parked dispositions, A4 species named | **HOLDS, exemplary** — three SUPERSEDED, quoted verbatim + opposite reassertion, none dormant, both empty scaffolds documented. |
| Furniture-by-origin (this session's addition) | **Code HOLDS** (`origin == null \|\| origin === 'journal'` — the grandfather exact). Harness: null ✓ (ab3.mjs), project ✓ (ab2.mjs), loose → **R1(a)**. |
| `BoardEditor pageKind='prose'` (this session's carry) | Untouched this ticket, correctly out of scope → bundled into Ruling 2's AB4 carry. |

**Zero schema beyond S0:** confirmed at file level. **No new deps:**
confirmed — all house modules. **Substrate:** persistence gains new
functions and one read-predicate swap; editor core, sync engine, and the
autosave discipline untouched — the new `patchJournalEntry` strengthens the
discipline (full-spread merge-write; `origin` cannot be dropped by a star
or a tag). **Anti-solicitation:** code, harness, and copy all hold — loose
never nudged, empty states quiet, Peek disabled-quiet with no greyed
ceremony. **Olive/orange lanes:** hold in every new style (the star brass
only-when-starred — evental; the active pull olive; nothing orange at
rest) — R3 adds the missing guard. **Lexicon:** every new string rides
`deskLexicon`, with the Flux Journal→Log override kept coherent across
seams. **Vanishing law:** one engine, inherited, proven.

## Close conditions for ledger item 23

1. CC folds **ab3.1** (R1–R3 harness, R4 comment, R5 ledger + backlog
   lines, the two brief errata from Rulings 1 and 3, this file committed),
   re-runs the full suite, reports = pushes.
2. I spot-check the ab3.1 delta.
3. Nick's device look — **one sitting now serves AB1, AB2, and AB3:**
   finding 1's composition verdict (wide + near-floor), F3's olive rail
   (live since the ab2.1 deploy), the drawer's feel across every flip, the
   loose page's peace, Ruling 3's felt check (file a page, flip the
   notebook), Ruling 5's veto point (the timer/progress absence), and
   Peek's quiet stub. **Not deployed** — `railway up` on Nick's word first,
   or the look runs local; either is lawful, his call.

— Fable, 2026-07-15
