# FX14 — One Page · P0 fix brief · 2026-07-24

**Place at:** `docs/wrizo-alpha/fx14-one-page-brief.md`.
**Owner: chat 1, after FX12** (serial in your lane; disjoint from
FX13). Branch `fx14-one-page`, own worktree; guard-rail; ledger on
`main`. **ZERO SCHEMA, ZERO SERVER FILES.** Zero-schema
pre-authorization; Fable reviews post-merge; deploys batch with the P0
wave.
**Authority:** SV6, ratified: "Journal Pages no longer exist. The
Journal is now just a board that contains certain pages. Nothing about
it should be unique other than what settings happened to be turned
on/off." Plus sitting finding V2 (a loose page rendering with Journal
chrome), which this closes at the root.

## S1 — every New Page is THE Page

Every New Page path — the doors, the wizard, the board's page-card
births, all of them — creates a page that opens in THE Page interface.
Grep the creation paths whole; none may route to the journal surface.
Origin semantics unchanged (`origin` still records the door the writer
came through — journal, project, loose); origin is a HOME, not a
surface.

## S2 — the journal route retires

`routeForEntry` returns `/page/:id` for every entry, unconditionally —
the one function, one line, the J6 substrate doing exactly what it was
built for. `/journal/:id` becomes a permanent redirect to `/page/:id`
(old links, resume paths, and muscle memory all land right). The
JournalEntry surface unmounts from routing; component deletion and the
behavior-parity work remain J7's (accelerated: next in line after the
P0 wave, its census already written — every Journal-unique behavior
becomes a setting or dies there, per Nick's sentence, with the
census's own finding honored: the Journal's more-forgiving undo is a
candidate to KEEP as the default, not lose).

## S3 — the Journal board is just a board

The Journal system board's derived membership, door, and empty state
are untouched — it was already right. Verify nothing in this ticket
disturbs it.

## Harness

This falsifies real routing law — the park sweep is the ticket's
weight: `j6.mjs`'s destination checks asserting `/journal/:id`
(including the guard's legacy catch-all) get full A4 park cycles,
verbatim, supersession = SV6 quoted, live successors asserting
`/page/:id` universally + the redirect proven under real navigation;
JournalEntry-surface checks in other harnesses parked as falsified or
annotated as historical per the load-bearing/passing-mention line.
New checks: every creation door lands on the Page interface (trusted
pointer where the door is a gesture); a journal-origin entry and a
loose entry both open in the Page interface with correct home labels;
`/journal/:id` redirects. Both settings; grep-first; the cd1-chain
discipline for anything multi-generational.

## Definition of done

There is one place where writing happens, and every door in the house
leads to it. The Journal is a shelf of pages, not a second room. And
no writer ever again lands somewhere that argues with where they came
from.

— Fable, from SV6 + V2, for chat 1
