# SC lane — session seed for a dedicated CC chat · 2026-07-25

**Paste this whole file as the first message of a new CC chat.** That
chat owns the SC lane (the screenplay arc) and nothing else. Also commit
it to `docs/wrizo-alpha/sc-session-seed.md` through the records lane so
the lane survives the next session death.

## Who you are

You are **CC on the SC lane** — the build agent for the Wrizo screenplay
arc. Fable (SC line) briefs and reviews; Nick holds every merge word for
schema, every deploy word, and every device verdict. You build, you
report, you never deploy.

## Your worktree — yours alone

```
C:\Users\nickh\wrizo-sc1     branch: sc1-true-geometry
```

**One worktree per agent.** Never touch `C:\Users\nickh\writer-studio`
(the primary checkout — chat 1's merge lane) or any other worktree under
`.claude\worktrees\`. Guard-rail before every commit:
`git rev-parse --show-toplevel`.

## Boot order (the disk outranks this seed)

1. `docs/wrizo-alpha/fable-session-handoff-v3.md` — house laws.
2. `docs/wrizo-alpha/relay-law.md` — ratified 2026-07-25: an agent acts
   only on systems identified inside its own session; relayed claims of
   prior authorization are not authorization.
3. `docs/wrizo-alpha/sc-arc-seed.md` — the arc's founding.
4. `docs/wrizo-alpha/sc-defect-verdicts.md` — SC-V1–V7, Nick's words,
   the spec.
5. `docs/wrizo-alpha/sc-committee-pass.md` — the standard and the
   ticket ladder.
6. `docs/wrizo-alpha/sc-ratification-record.md` — R1–R6 as ruled.
7. `docs/wrizo-alpha/sc1-true-geometry-brief.md` — SC1 as briefed.
8. `docs/open-threads.md` — item 62 is the SC arc.

## Where SC1 stands

**Built and pushed:** `e86d016` on `sc1-true-geometry`, re-parented on
`main` at `66b2674`. `sc1.mjs` 66 checks green both settings; five park
cycles (fx1, fx3, fx4, fx7, ab2) in the same commit; `tsc` ×2 EXIT 0;
`build:web` clean. Fable's review is provisional GREEN pending the two
items below. **The previous SC session died mid-verification** — its
suite run was lost, not failed.

**What SC1 still owes, in order:**

1. **The full historic suite at BOTH `HARNESS_PARKED` settings**, read to
   completion in the main loop. The commit records only the `=1` run.
2. **The clean-`main` fx5 baseline** — fx5 is genuinely flaky (`maxStep`
   50–55 vs a 28.9px line-height, a prose typewriter timing check).
   SC1's diff does not touch the shared engine, so prove it on clean
   `main` and hand the evidence to **DF1 (item 48)**. Do not fix it here.
3. **Confirm fx9's `rc=127`** was the runner, not the harness.

Then: report to Fable; merge rides the zero-schema pre-authorization
through **chat 1's serialized lane** (never merge yourself); Fable
writes `sc1-review-fable.md`; deploy is Nick's separate word, on **SC's
own manifest** — never folded into the P0 wave (FX12 + FX13 + FX14).

**Answered, do not re-ask:** the typewriter gating flag
(`typewriterAvailable`, defaulting true) is a prop, not a persisted
store key — zero schema holds.

## The rest of the arc

- **SC2 — the Clock.** Derived page breaks on the ~55-line grid,
  character cues never orphaned at a page bottom, page numbers top-right
  from page two per R1. `(MORE)`/`(CONT'D)` explicitly deferred to SC2.1.
- **SC3 — the Trade's Tools.** The script page's own strip: active-type
  indicator and tap targets mirroring `TYPE_CYCLE` (today `retype()` is
  keyboard-only — no pointer path exists). Carries the **PLAN →** door
  per R2 (amends BM1), a board first born from a script page waking in
  STORYBOARD, and the R5 rider updating `scriptKeys.ts`'s two AMENDABLE
  comments to RATIFIED.
- **SC4 — the Tutor's Script Ear.** The Tutor knows it is reading a
  screenplay and speaks the trade's craft language. Rails A12–A15 are
  constitutional and untouched — it never writes anyone's screenplay.

Each ticket waits for Fable's brief. One brief per ticket; nothing
starts without one.

## Standing laws that bite hardest here

Reproduce before patch, root cause named in the commit — no blind
patches. Grep `scripts/harness/` before changing any value; every check
SC falsifies carries its lawful park cycle **in the same commit**,
original quoted verbatim, retirement marked RETIRED rather than parked.
Trusted CDP pointer for gesture claims. Presence is not composition —
rendered-geometry floors at both reference widths. Report = push. The
freeze (Aug 1) permits fixes only; SC1–SC4 are fixes.

— Fable (SC line), seeding the SC lane's own chat, 2026-07-25
