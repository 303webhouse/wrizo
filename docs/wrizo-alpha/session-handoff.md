# Session handoff · 2026-07-14 (evening)

**Place at:** `docs/wrizo-alpha/session-handoff.md`. For the next Fable
session: this file plus the ledger IS your orientation — trust disk over
any memory summary, which may lag today by a full day of decisions.

## Who you are here

Fable — architecture/design/docs/review lead. Nick owns every merge word
and device verdict and relays between you and CC (Claude Code), who
builds. You review pushed branches via the GitHub read pipe (list_commits
→ get_commit stats → full_patch), write reviews to
`docs/wrizo-alpha/<ticket>-review-fable.md`, and put every durable thing
on disk. You have < a week at this tier; the week plan governs your time.

## Read, in this order

1. `docs/open-threads.md` — the ledger. Always first, every session.
2. `docs/wrizo-alpha/the-desk-design.md` — Nick's constitution answered.
   Part 1 is the product in plain words; the translation table maps his
   vocabulary (Page / Modes / Tools / Organizers / Structures / Themes)
   to the codebase. **His vocabulary is canonical. Every doc you write
   leads in plain language; code-speak goes in fenced sections** — this
   was direct feedback from Nick on 2026-07-14 and it binds you.
3. `docs/wrizo-alpha/app-bones-canon.md` — what rebuilds (shell), what
   carries (substrate), what parks (flourishes), the S25 verdicts.
4. `docs/wrizo-alpha/ab1-page-frame-brief.md` — what CC is building now.
5. `docs/wrizo-alpha/fable-week-plan.md` — your remaining ladder.
6. `AGENTS.md` — house laws. `docs/theme-foundations/theme-arc.md` — the
   five-territory doctrine (bones precede themes; that law is why AB
   exists).

## State at handoff

- **AB1 building autonomously** (branch `ab1-page-frame`, isolated
  worktree). Merge is pre-authorized by Nick; **close is not** — your
  first job is the post-merge review (compressed rhythm: full patch,
  R/A findings, fixes fold as ab1.1, ledger item 21 closes only after
  fold + Nick's device look). Scrutinize especially: the five-track
  grid's rect invariance on all three pageTypes, the vanishing law's
  blast radius, the parked-harness gating (`HARNESS_PARKED=1` — parked,
  never deleted), containment on the script surface, and that NOTHING
  flourish-shaped got mounted (clean word processor is the ruling).
- **J2/S25 fixes** pushed unmerged on `origin/j2-s25-fixes` (ledger item
  22) — gated solely on Nick's two-minute pen check (barrel-button
  behavior; target-tool icon interpretation). Merge on his word;
  "flip the icon logic" is a pre-specified one-line swap if he rules
  show-current.
- Everything pre-pivot is merged, deployed, and stable: 235+ harness
  checks run on every merge; substrate is proven (byte-exact prod
  round-trips) and is constitutionally untouchable this arc.

## Your remaining deliverables, in order (all to `docs/wrizo-alpha/`)

1. **AB1 review** (when the build lands — likely first thing).
2. **AB2 brief — the Tools by Mode.** Must carry the committee's
   recommendation on the one open architectural question: how formatted
   Draft text is stored. **Recorded prior from the outgoing session:**
   markdown-conventions-in-`entry.text` for v1 — zero schema, sync-free,
   with the lawful upgrade path to a structured jsonb column (the
   fragments-under-pages §2 checklist) if Draft outgrows it. Convene,
   test the prior, don't inherit it blindly. Keep the v1 tool set tiny
   and excellent: bold, italic, headings, spacing — not Word. Also in
   AB2: forward lock surfaced as a Free Write tool; the Structure picker
   (prose + screenplay; screenplay is the S1 element engine unchanged
   inside); copy-out relocated to Publish.
3. **Plateau foundations** (`plateau-foundations.md`) — the default
   theme never got its doc. Keep the shipped palette and "cozy desk"
   register; you may propose ideas earned by Plateau's arc position:
   territory #1, home, the room that holds you, the one the writer
   returns to. Small doc, tokens + register + orange discipline.
4. **AB3 brief — the Corkboard.** Plan tab with the current-beat pin,
   Pages tab with sort + open-beside (read-only reference page), Tutor
   tab. DoD is the two-action table in the Desk design, every row.
5. **The succession dossier** — the week's capstone; merge Rev 3 of the
   state-of-wrizo into it. Principle #1, Nick's words: **Wrizo shows,
   instead of tells, that writing is a process and becoming a writer is
   a process.** Process, progress, lines of flight — for ADHD writers
   and all writers. Test every feature against that sentence.

## Rulings of 2026-07-14 (in force, possibly ahead of your memory)

Mode strip strings, exact: **Free Write · Draft · Revise · Workshop ·
Publish** ("Format" dissolved into Draft's Structure picker). Module
names are theme-scoped vocabulary via `desk/strings.ts` — "Journal" is
Plateau's word for the capture module. Flourishes (typewriter, progress,
celebrations, milestones, glow) are parked-not-deleted; the frame
reserves their zones from day one. Plan-beside-page deferral: reversed.
S1's no-mode-strip law: superseded. Copy-out: canon-protected, lives in
Publish. Desktop/laptop/large-tablet first; mobile later.

## Laws that bite hardest

Ledger first, every session. Report = push; verify against code, never
reports alone. One brief per ticket. Propose-never-ship for config.
Chat-only = lost — everything durable goes to disk. Merge words and
device verdicts are Nick's alone; ratifications only by his recorded
delegation. Progress over perfection — with S0-style hard gates,
zero-schema, read-only projections, and token seams unconditional.

— Fable (outgoing session), 2026-07-14
