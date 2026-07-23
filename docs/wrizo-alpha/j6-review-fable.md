# J6 — One Paper · Fable's post-merge review · 2026-07-23

**Ticket:** J6 (item 50). Merged `eacb1ae`, deployed in the mega-deploy.
**Method:** the entire merge read — every product file, the 523-line
`j6.mjs` harness, and the 358-line parity census, line by line. Nothing
in this ticket was taken at record depth.

## Verdict: GREEN WITH ADVISORIES. The identity claim survives independent read; the census is honest and genuinely gates J7. Close pends Nick's sitting sweep (agenda item six) — J6 changed nothing to *feel*; anything that feels different is a defect, by the ticket's own definition.

## S1 — the geometry substrate (item 47's fix): verified, with the race understood

The old `useState`+`useEffect` subscription in `deskFrameActive.ts` had a
genuine missed-notification race: when the app's first-ever commit lands
directly on a framed route, React fires passive mount effects bottom-up,
so DeskFrame (deep) calls `setDeskFrameMounted(true)` before its shallow
subscribers (AppMain/GlobalHeader/DeskRail) have registered — the
notification fires into an empty set and is lost; the module flag is
right, the derived React state is stale, and nothing corrects it until
the next genuine flip. The reproduce-before-fix numbers are recorded in
the harness in full: `false`/`64px`/`left:364.3125` on a hard reload vs
`true`/`0px`/`332.3125` in-app — the ~32px paper shift, both directions
divergent. `useSyncExternalStore` is the correct primitive (synchronous
snapshot per render, post-commit re-check) and the fix makes the
"presence is not composition" floor structural rather than vigilant. The
harness proves byte-identical readings across four routes to the same
state (in-app, fresh-reload, page-to-page, second fresh-reload) at all
three widths, and proves legacy <1100 untouched (no DeskFrame, the 64px
gutter intact, the fix never engages below the gate).

## S2 — `routeForEntry` behavioral identity: HOLDS, with two equivalences verified and one disclosed refinement

The predicate is one function, 26 lines, and it is byte-for-byte today's
rule. Six call sites migrated (the sixth, `resume.ts`, found by grep
beyond the brief's own list — good). My verification of each:

1. **BoardEditor / CascadePanels / JournalEntry (guard + both chip pairs
   + keyboard walk) / resume** — the deleted inline predicates are
   literally identical to the function. Byte-equivalent.
2. **ProjectHome** — the old `pageRoute` used truthiness (`p.pageType ?`)
   where the function uses `!= null`. Equivalent over the actual type
   domain: `pageType` is a union of non-empty literals; no falsy-but-
   present value exists. Verified, recorded.
3. **Spread** — the one genuine refinement, disclosed in-code: the old
   unconditional `/journal/:id` sent a typed loose page through
   JournalEntry's redirect guard (a `replace` bounce) to the same final
   landing; the new call routes directly. **Destination-identical, one
   hop eliminated.** The not-found fallback preserves the old path
   exactly. I endorse it — and the ledger's "zero behavior" phrasing
   should be quoted as *destination-identical* for precision.

The harness proves the predicate at the canonical source (the seam, five
entry kinds) AND at every migrated site via **real navigation**, with the
FX7 S5 board-pin and FX5 S3 ported-card regression re-proofs, the
missing-target no-op guard, ProjectHome's reachable legacy-untyped-filed
catch-all landing at `/journal`, both New Page doors unregressed, and the
Spread edge landing directly at `/page`. **Calibration note, endorsed as
practice:** trusted CDP double-clicks where the *gesture* is the claim
(board travel); synthetic clicks where the *destination* is the claim
(link routing) — the trusted-proof law applied with judgment, not
ritual. The 5-line `m2.mjs` change is annotation only, correctly leaving
the check's intent untouched per A4.

## S3 — the parity census: honest, and it earns its gate

Read in full. It corrects its own brief (§3.1: `useChromeDissolve`/
`useTypewriterFade`/the incentive trio are *shared engines wired twice*,
not Journal exclusives — the real difference is a scroll-model branch
plus tuning), extends beyond the named list, records the genuinely
three-way undo finding (Journal's one-level undo is *more* forgiving than
PageEditor's Free Write, which has none by design), and separates
port-now / port-later / retire with reasons. §5's cost accounting is the
J7 brief's spine: ink has nowhere to go yet; two independent forward-only
implementations have already drifted; posture-flattening means picking
winners, not merging code. **J7 is properly gated.**

## ADVISORIES — non-blocking

1. **Queue the two port-now items as their own small tickets,
   post-vacation, ahead of J7:** §2.6 (Pages/Plan on a legacy filed
   untyped page — closes a today-reachable dead end) and §2.8 (a real
   Publish dialog on Journal — today, clicking Publish on a Journal entry
   does the same thing as clicking Draft, at every width, and a *framed*
   Journal entry has no copy affordance at all).
2. **The E1 intersection of §2.8, named plainly:** a writer's Journal
   words are safe — E1's "Everything" export reaches them from any
   `/page` Publish surface — but the Journal surface itself has no export
   door of its own. Not a vacation risk; a coherence debt for the §2.8
   ticket.
3. The ledger's identity claim gets the *destination-identical* wording
   (advisory 3 of the S2 section above) in the next records commit.

## Close condition

Nick's sitting sweep (one-paper feel across surfaces — nothing should
feel different) and the records-wording touch-up. Then item 50 closes,
and J7 waits, post-vacation, on the census it now owns.

— Fable
