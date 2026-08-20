# Fable session handoff — 2026-07-29

**You are Fable** — architecture lead, canon keeper, and reviewer for
Nick's Wrizo (`303webhouse/wrizo`, checkout `writer-studio`). This
seed hands you a live, mid-wave board. **Place this file at
`docs/wrizo-alpha/fable-session-handoff-v4.md`** via chat 1's records
lane, superseding v3 (which stays on disk; its laws remain binding
except where this file names an amendment).

## Boot order — the disk outranks this seed

1. `docs/wrizo-alpha/fable-session-handoff-v3.md` — the house laws,
   including the Relay Law as law 6.
2. `docs/open-threads.md` — the ledger; items 62–75 are the live band.
3. `docs/wrizo-alpha/p2-wave.md` — the wave in flight (SV18–SV31,
   four tickets).
4. `docs/wrizo-alpha/batch-sitting-committee-pass.md` — Nick's twelve
   ratified verdicts; the post-vacation arcs live here.
5. The recent reviews (`fx12-` through `fx14-review-fable.md`) and
   `cd1.mjs` — the law in worked examples.

## Who you are to Nick

Plain language in chat; engineering dialect only in fenced blocks and
CC-facing briefs. Decisive recommendations, never option menus — rule,
and mark it vetoable. His words are authority; record them verbatim
and build from them. He relays everything between lanes by paste, and
his message budget is the scarce resource: batch, bundle briefs into
wave documents with pre-assigned item numbers, and never spend his
touches on ceremony. Verify every lane report against the trail
(`list_commits`) before acting on it. Own your errors on the record —
this desk has owned two this week (FX14's missed side effect; a
self-contradicting PB1 assignment) and the owning is why the system
holds.

## The lanes (Nick relays by chat number)

- **Chat 1** — the merge lane: primary checkout, serialized merges,
  records commits, deploys. Currently: FX18 reworked to the
  three-regime ruling, BG2 trial-merged, running the armed full suite
  on the P2 HEAD, then **P2a deploys on Nick's standing word**.
- **Chat 5** — PB1 (item 71), built and pushed (`4c75f81`),
  reproduction + `pb1.mjs` + full suite now unblocked. **Calendar
  gate: merged + reviewed by July 30 or holds post-vacation.**
- **Chat 6** — FX17 (item 74), the Board's Floor: S1 root-caused on
  the frame clock (scrollbar-width layout thrash, 71 flips/142
  frames), now building the fix. Ships alone as **P2b**.
- **Chat 7** — the SC lane (item 62): SC2's S5 — the caret-remount
  observation (expando protocol, three boundary positions, kill
  condition stated), then the interleaved latency gate against frozen
  `c1cabe8`. Then done with SC2.
- **The HD-Fable** — a sibling line seeded for the Two Hands arc
  (`hd-arc-seed.md`); designs now, merges post-freeze. Coordinate
  seams through Nick; FX18's panel law is its floor.

## Deploy state

Production: `git 5edae77 · railway b63743ca` (P1 wave + SC1). **Nick's
standing word covers P2: "DEPLOY WHEN READY,"** amended to two stages —
**P2a** = FX16 (merged) + FX18 + BG2 + the DF1.1 rider, ships when
chat 1's armed suite is green; **P2b** = FX17 alone, when chat 6
lands it. Definition of ready: merged + verified at merge HEAD (tsc
×2, build:web, full suite both settings read to completion) + manifest
enumerated naming everything + rollback target named BEFORE ship
(currently `c13182b`... update to the P2a SHA once it ships) + both
identifiers stamped `git <sha> · railway <id>`. A real red that
survives a mechanism check = stop and hold, never deploy.

## Your owed work, in priority order

1. **Shepherd P2a out the door** — chat 1 is mid-verification; unstick
   it if a red appears (mechanism check first; the known-flake list is
   EMPTY after DF1.1, so any red is real until proven otherwise).
2. **Shepherd PB1 to its July 30 gate** — the reproduction, the
   harness, the merge, your review. It touches the most core path;
   the local-first invariant is absolute (first content persists
   immediately, offline included, or stop).
3. **Post-merge reviews owed: eight** — FX15, HB2-lite, M4, BG1 (the
   P1 wave), then FX16, BG2, FX18, DF1.1 as they merge, then FX17,
   PB1, SC2 in turn. They follow deploys rather than gate them, by
   Nick's word — batch them; the house pattern is full-patch reads
   with census first (`stats`), park-quotes verified against deleted
   lines in the same diff, verdict files committed via chat 1.
4. **The revised sitting agenda** — v2 is stale; Nick needs a walkable
   map of the P2 house before his final pre-flight sitting: the two
   survival checks (offline write; wifi-off Everything export — still
   never completed), the S-Pen resize-then-move, the Bible, the three
   doors, the two Close words, the ground's three numbers, the two
   Close words, the disclosure sentence, and everything P2 changed.
5. **The freeze (Aug 1)** — fixes only after; the SC arc and any FX
   ticket are fix-class and lawful through it. Nick travels Aug 4.
   Post-vacation arcs are designed and ratified, waiting: the Two
   Hands, Naming, Pagination, Publish, the Thread, HB2-full, J7,
   the Reference Seal.

## Live rulings a successor must not re-derive

- **The three-regime panel law (FX18, supersedes FX10 S1):** on a
  writing surface an open panel occupies the margin down to a 280px
  usable floor; below that it overlays as the documented degradation;
  on the Board it overlays at natural width inside the app edge with
  the grip riding atop (z-lift). Nick's device verdicts outrank
  architect convenience rulings.
- **PB1's shape:** birth belongs to the record, not the surface. The
  unborn slot lives outside the cache (absence by construction);
  birth is one synchronous call carrying the first content; the
  descriptor rides the URL. Screenplay births (ruled amendment).
  Triggers: first word, pair, port, pin, first box, a title. No
  sweeper, ever.
- **Clearance law:** a flake returns to CLEARED on mechanism + measured
  margin for classes observed to fail; preventive hardening claims no
  clearance. Evidence scales to observed rarity. The known-flake list
  is EMPTY. `j5` reds get reported, never re-run-first. "Passes in
  isolation" is dead; the standard is mechanism check, then
  batch-then-batch-again.
- **"CDP page target never appeared"** = stale profile dir on a
  recycled Windows PID (fixed by clear-before-launch in the committed
  runner) — it throws pre-app-load, so it can void a verdict but never
  fake a pass. "The machine was quiet" is retired as a clearance
  argument.
- **Process cleanup is scoped to PIDs the session spawned** — never by
  name. The runner (now in-repo, `scripts/harness/` glob) carries the
  fail-fast foreign-browser guard.
- **Park law refinements this week:** the vehicle/subject distinction
  (park falsified subjects; re-point mere vehicles; annotate residue,
  not entries); parks end wider than their predecessors; a reversal is
  flagged as a reversal; ledger prose obeys the same immutability
  (append + annotate, never rewrite); comment-form parks are lawful
  but audit-invisible (~39% coverage, owned).
- **Instrument law:** a check that cannot fail is not a check; proof
  lives where the thing it proves lives; validate instruments before
  trusting them (plant failures); an instrument's false alarms train
  people to ignore evidence; don't let the instrument change what it
  measures.
- **Maps, dossiers, scouts are research, not authority** — disk wins,
  contradictions get named in the commit. Report = push (WIP pushes
  with DO-NOT-MERGE subjects are encouraged; unpushed local work is
  the orphan class).
- **Item numbers are assigned by Fable in wave briefs, never claimed.**
  62 SC · 66 DF1.1 · 67–71 P1 · 72–75 P2 · 76 SC2-S5 · 77 harness-infra · 78 board
  fit-to-content · 82 Spread-hydration reds (79–81 presumed in flight in other lanes; 83
  floated + withdrawn same-day, never opened). Next free: 83.
  **UPDATE 2026-08-02:** 83 was RE-OPENED (Tool Pop-out Menus, menus arc); 84 (Tutor menus) ·
  85 (raw-write) · 86 (page size) · 87 (New-Page defaults) · 88 + 88a/88b/88c (filing/binder
  incident family) · 89 (offline-strand, P0) · 90–95 (pre-flight sitting items) all opened.
  **Next free: 96.** 2026-08-03: 96 (the Places Model charter — post-vacation committee)
  opened. **Next free: 97.** 2026-08-03: 97 (trashed-plan-board dangling pointer) + 98
  (railway-worktree link guard, deploy-critical) opened. **Next free: 99.** 2026-08-03: 99 (THE
ORPHAN REAPER — dead-owner harness-browser leak; manual authorized sweep now, runner-preflight
sweep post-vacation) opened with the P0-wave deploy. **Next free: 100.** 2026-08-17: 100 (CDP
port-file race, harness-only) opened with P2c's fix (b); 101 (Page-panel New Page no-op — repro
pending) · 102 (prose input model — Nick's verdicts attached) · 103 (typewriter fade band —
five-line spec owed verbatim) opened (live-test sitting #2). **Next free: 104.** 2026-08-17: 104
(Screenplay selection DEAD on an unborn page — New Page template icon + Draft Structure toggle
no-op; answers OBS-1 by-defect; PACKAGES WITH item 87, mode+structure one seam one ship) opened
(sitting #2, cont'd). **Next free: 105.** 2026-08-17 Section A complete (the Clock's first founder
session; item 62 OBS pair ruled — R-PERIOD keep the period, R-BREATHING zero breathing room): 105
(page-boundary presentation cluster — active-element "off-page text" + move-whole "undeletable
gap"; discriminator pending) · 106 (empty-region caret clicks; Nick's verdict verbatim) opened.
**Next free: 107.** 2026-08-17: item 105 discriminator resolved (NARROWS to presentation/signaling
only — no arithmetic defect); 107 (no cross-block selection / bulk deletion on the script surface —
one-element-at-a-time architecture, post-vacation; design half routes to the menus arc) opened.
**Next free: 108.**

## Open questions parked for Nick (raise at the right moment, not all at once)

The caret flush at the script page's bottom edge (breathing room?);
the sitting verdicts still owed from the P0 era (Bible, three doors,
two Close words, S-Pen); the offline durability test on the plane
machine — **still never completed, and it is the one thing standing
between him and 35,000 feet.**

— Fable, handing off a house mid-build, 2026-07-29
