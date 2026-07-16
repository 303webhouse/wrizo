# FX1 — the First Sitting · Fable's post-merge review · 2026-07-16

**Place at:** `docs/wrizo-alpha/fx1-review-fable.md` (CC commits on receipt).
**Reviewed:** `4a06b62` (S1–S6, census + behavioral proof), `29bdeda`
(parks, full patch), `397dbf3` (fx1.mjs, 25 checks, enumeration matches
the brief's S7 minimums), `72cb547` (the A4 fix, full patch), `5c97ec8`
(ledger), on merged `main`. Zero-schema confirmed at file level; merge
pre-authorization was lawful and correctly cited.

## Verdict

**GREEN — zero product-code defects. The redeploy gate is open;
Nick's word sends it.** Depth, honestly stated: S3's gate change and
every line of harness law were verified patch-by-patch; S1/S2/S4/S5/S6
were verified at census level (five files, exactly the five named, no
schema or sync surface touched) and behaviorally through fx1.mjs's 25
checks with the full suite green under both HARNESS_PARKED settings —
the build message corroborated at every point I could cross-check.

## Rulings and findings of record

1. **The Journal's centered-start skip — SUSTAINED.** Ink strokes carry
   absolute coordinates; shifting the Journal's text-block start would
   silently re-position every existing drawing, the logo included. The
   fade band and ramp still land there; the start-offset applies on
   ink-free surfaces. If Nick's sitting finds the inconsistency *felt*,
   the fix is a real ticket (stroke re-basing or a per-entry offset),
   never a tweak. Nick-vetoable at the sitting.
2. **The ab1 meter-track supersession — RATIFIED, and now precedent:**
   when a fix falsifies ANY live check, the A4 park law applies whether
   or not the brief enumerated that check. The parked entry quotes both
   originals verbatim and its successor even guards the corkboard
   non-goal. Exemplary.
3. **Double supersession — RATIFIED as house pattern.** An
   already-parked check that goes stale is still a check that must pass
   under HARNESS_PARKED=1; parked history accretes generations, all
   preserved in comments. ab2.mjs now carries two-generation records
   correctly.
4. **R1(a) was vacuous as I wrote it — my defect, not the build's.** A
   loose page opens in Draft by default (no pageType → the support-page
   rule), and a Draft rail carries none of this furniture regardless of
   origin — so my required check never exercised the origin gate until
   this fold made both fixtures click Free Write explicitly. **Standing
   lesson for every future harness spec: a check reading mode-dependent
   surfaces sets the mode explicitly; never assume a fixture's
   default.** And a design question surfaces for the committee docket:
   *which mode should a loose page open in?* (Draft today by
   inheritance; Free Write is arguably the home-base posture; the
   HB-arc's first-run forces Free Write — the committee reconciles.)
5. **The A4 discipline catch (`72cb547`) — the process worked.** The
   in-place edit was caught by the internal review before merge; the
   original check's history was restored verbatim, correctly
   species-tagged, and the stale mechanic comment was rewritten with
   the old rationale kept for the record. Noted without drama; the
   ledger's account is accurate.

## Advisory

th2 stands at two flake events (ab3.1's fold, FX1's first full-suite
run). A third within the month triggers the deflake micro-pass —
standing, as promised.

## Close conditions for ledger item 25

1. This file committed; ledger notes the review GREEN.
2. Redeploy on Nick's word (`railway up`, usual live confirms, deploy
   commit recorded).
3. Nick's next sitting: the six FX1 felt checks (typewriter feel,
   screenplay paper, forward lock everywhere, corners, dead bar gone,
   quiet rail) — plus the carried-over notebook felt-check and the
   olive rail read from items 21/23. One sitting can close three
   ledger items.

— Fable, 2026-07-16
