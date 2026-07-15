# Fable session handoff · written 2026-07-15 (the vision session)

You are Fable — architecture lead, design lead, review lead, canon
keeper. CC builds; Nick rules. This handoff boots you to where the last
session ended. **Trust disk over memory; trust this file over both
until you've read the disk.**

## Boot order (read before any work)

1. `docs/open-threads.md` — the ledger, always first.
2. `docs/wrizo-alpha/page-and-homes-canon.md` — the new governing
   ruling: eight laws, four ranges, RULED 2026-07-15 with a
   ratification record (two amendments: A1 drawer-subject, A2
   grandfather clause). It absorbed and superseded
   gaze-and-flight-canon.md.
3. `docs/wrizo-alpha/ab3-drawer-and-homes-brief.md` — what CC is
   building when you wake.
4. `docs/wrizo-alpha/the-desk-design.md` + `app-bones-canon.md` — the
   frame's constitution (note: the canon in #2 now governs where they
   conflict — the Journal-as-default assumption is dead).
5. `docs/theme-foundations/plateau-foundations.md` — the olive, the
   engraved register, the orange law, the casts pass (§7, recorded not
   armed). **Verify on boot that CC actually committed this file and
   the ab2/ab3 docs** — the last session delivered several documents
   through relay and did not re-verify every landing.
6. `AGENTS.md` — house laws and the committee roster.
7. The reviews as needed: `ab1-review-fable.md`, `ab2-review-fable.md`.

## What the last session did (2026-07-14 → 15)

AB1 reviewed (2 required fixes; ab1.1 folded and verified). AB2
briefed, built, reviewed — the arc's first zero-required verdict — then
Nick's device look against the live deploy found a real one the same
day: the Journal paper collapsed to an ~80px sliver (a lost width
context). The ab2.1 fold fixed it, and the new geometry-floor harness
sweep immediately caught a second identical collapse on Board, invisible
since AB1. **Lesson now law: presence is not composition; every new
surface gets a rendered-geometry floor from day one.** Deployed once
(AB1+AB2); **ab2.1 is merged but NOT redeployed** — that word is still
Nick's. Plateau foundations were authored on Nick's word (the Shire
clause; olive locked #96a05a as `--accent-rest`; the engraved strip;
casts pass recorded). Then Nick's vision arc ran across five messages
and two interactive mockups, and it consolidated into the
page-and-homes canon: one Page (Page = Document), provenance sets the
home, membership not capture, one drawer that flips, the wall and its
threads, the two-class measure law, assembly at Publish, and the sheet
law (the scroll dies; sheets are derived, never stored). Ratified by
double pass; AB3 briefed.

## Your first job: the AB3 post-merge review (compressed rhythm)

Full patches, verify against code never reports, findings R/A, fixes
fold as ab3.1. Scrutiny list:

- **The drawer's geometry floor** — one fixed rect across every face
  flip (tools/page/places), asserted in ab3.mjs, and true in the code.
- **The origin column** — the ticket's single declared schema
  addition: read the migration AND both sync mapper directions
  (rowToEntry / upsertEntry — the S1 `script` precedent); nulls must
  behave exactly as today (amendment A2).
- **Origin per door** — journal/catch → journal; project doors →
  project and the Journal never lists it; home base → loose, and the
  loose page is never nudged (load-bearing clause).
- **The Journal forgets nothing** — journal-born pages filed onward
  list in both places; the drawer tells both truths; no list badges.
- **Metadata retirement** — parked not deleted; legacy below the gate
  byte-identical; the saved-silently line exists only as the drawer's
  footer.
- **Places faces** — dissolve on keydown, one level deep, quiet, the
  honest room door; Peek is a quiet stub (real in AB4).
- **A1 wiring** — the Page face reads a `subject`, not a hardcoded
  current page, so AB4's wall plugs in without surgery.
- Suite arithmetic and the parked-species dispositions (name the two
  species per the AB2 review's A4).

## Open gates on Nick (do not nag; they ride along)

- **Item 21 device look** (AB1+AB2; six items, one sitting) — likely
  now folds into a larger look after AB3 lands; his call.
- **The redeploy word** — ab2.1 (and AB3 when merged) are not live
  until he says `railway up`.
- **Item 22** — the J2/S25 pen fixes still sit on their branch waiting
  for his two-minute S-Pen check.

## Binding communication laws (from Nick directly; do not relearn these
## the hard way)

Nick has an English/Professional Writing degree and deep humanities
interests; some HTML/CSS; no SWE background. **Plain language always in
chat** — analogies, examples, mockups; engineering dialect goes in
fenced blocks and CC-facing briefs only. His native register is the
project's own design language (editorial, theatrical, architectural,
Deleuzian) — translate into it, don't simplify at it. Decisive calls
over option menus; scannable bold micro-leads; own mistakes in one
clause and move. When transcribing his rulings, read back with a
correctable assumption (a "capitalized" once meant engraved caps, not
Title Case — flag your reading, let him flip it in a word). He responds
extremely well to clickable HTML mockups; build them for anything
visual.

## Tool learnings

- GitHub connector is **read-only at the credential level** — Nick's
  verbal write grant was exercised once and the key didn't turn (403).
  Deliverables go through container files; CC commits on relay. If Nick
  wants direct Fable writes, he must re-authorize the connector with
  write scope in settings.
- Review pipe: `list_commits` (small perPage) → `get_commit`
  `detail:stats` → `full_patch` on the risky commits only. Never pull
  `index.css` whole.
- The in-chat visualizer MCP timed out mid-session and stayed down;
  the proven fallback is standalone HTML files (interactive, one file,
  Plateau tokens hardcoded) — Nick opens them in a browser.

## The ladder ahead (proposed in the canon; Nick rules order)

**AB4 — the Wall** (Law 5 + the measure law's cards + the pinned-card
glance + the flight doorways + Peek's real open-beside). **AB5 — the
Sheets** (Law 8; the riders in the ratification record are binding:
turn latency, silence, keyboard nav, O(sheet) editing cost). **I1 —
the image pass** (storage/sync design first; then walls; then Publish
assembly). Then the detail pass (drawer progressive disclosure; the
menu-casing open question in the foundations §5), the Plateau casts
pass (§7), Machina foundations someday. The succession dossier
obligation from the week plan is partially discharged by this handoff;
the dossier proper (merging state-of-wrizo Rev 3) remains on the
ladder if the week continues.

## House laws, one breath

One brief per ticket, reviewed before the next begins. Report = push.
Verify against code, never reports. Chat-only = lost — durable things
go to disk through CC. Merge words and device verdicts are Nick's
alone. Anti-solicitation everywhere. Propose-never-ship for config.
The paper never changes.

— Fable, end of session, 2026-07-15
