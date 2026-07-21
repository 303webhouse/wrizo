# E1 — Get My Words Out · build brief · 2026-07-21

**Place at:** `docs/wrizo-alpha/e1-get-my-words-out-brief.md`.
**Branch:** `e1-words-out` off `main`, own worktree.
**Priority: P0 — this outranks every ticket in the queue, including J6
and FX9 in flight.** Nick departs 2026-08-04 intending to draft his own
book in this app. Verified at his device today: the Publish surface
offers "Copy My Words" and "Copy Formatted" and both read as dead, and
there is no file export of any kind. **A writer who cannot get his words
out of Wrizo cannot safely write in Wrizo.** Nothing else matters until
this passes.
**Authority:** Nick's survival check 0.1, failed, 2026-07-21; the
ratified anti-slop rail (paste-in is the target; the writer's own text
must remain copyable OUT — this ticket is that clause, honored).
**ZERO SCHEMA, ZERO SERVER FILES, ZERO NEW DEPS** — export is
client-side by construction, which is also what makes it work on a
plane. Merge pre-authorized as zero-schema; Fable reviews post-merge.
Report = push.

## S0 — records first
Ledger: open E1's item, P0, with Nick's own finding quoted. Commit this
brief.

## S1 — diagnose before changing anything
The two Publish buttons may be genuinely broken, or may be working
silently with no confirmation — **which is the same failure from the
writer's chair, but a different fix.** Determine which, live, and
report the root cause in the build report before touching them:
what each button's handler actually does, whether the Clipboard API
call succeeds, what it copies (current page? selection? nothing?), and
whether any confirmation is rendered. Do not guess. If they work, the
defect is silence and S2 is the whole fix; if they are broken, S2 fixes
both the mechanism and the silence.

## S2 — the copy path, working and legible
Both existing buttons work and **say so**: a brief confirmation in the
house register through `deskLexicon` (the toast/quiet-line pattern
already in the codebase — reuse, don't invent). "Copy My Words" = the
page's plain text. "Copy Formatted" = the same text with its formatting
conventions intact. Failure is reported honestly, never silently
swallowed. No new buttons in this slice.

## S3 — real file export, the ticket's reason for existing
A **Download** action on the Publish surface, offering three scopes and
writing actual files via a Blob download (no server, works offline):

- **This page** → one `.md` file, named from the page's first line
  (falling back to a date stamp), plus a `.txt` twin option.
- **This binder** → one `.md` file per page in the binder's own order,
  delivered as a folder-shaped set or a single concatenated document
  with clear page separators — builder's call, disclosed, whichever is
  simpler and more reliable.
- **Everything** → every page the writer owns: binders, the Journal,
  loose pages. **This is the vacation insurance and it is the most
  important item in this brief.** A single archive or a single
  concatenated document is acceptable; completeness beats elegance.

Non-prose page kinds export honestly rather than perfectly: a Script
page uses the existing `serializeScriptDoc`; a Board exports as a plain
list of its cards' text with their titles; ink exports as a named
placeholder line, never silently dropped. **Nothing a writer typed may
be missing from an export that claims to be complete** — if a kind
cannot be exported faithfully, the export says so in the file itself.

## S4 — the "coming soon" copy
Publish still says publishing options are coming — true, and it stays.
But the surface must no longer read as a dead end: the download actions
are real, present, and unmissable above the coming-soon line. Every
string through `deskLexicon`.

## S5 — harness (`e1.mjs`) + the bar
Copy: both buttons place the expected text on the clipboard and render
a confirmation; a forced clipboard failure surfaces an honest message
rather than silence. Export: a page with known content round-trips —
export it, read the produced file's bytes, assert the writer's exact
words are present and complete; the same for a binder of three pages
(order preserved, none missing); the same for **Everything** against a
seeded corpus containing a binder page, a journal page, a loose page, a
board, and a script — **assert the count of exported documents equals
the count of the writer's own pages**, no silent omissions. Filenames
are safe on Windows and macOS (no illegal characters, no collisions).
**Offline proof: every export path runs with the network fully
unavailable** — this is the check the ticket exists for. Geometry at
1100/1280/2200; legacy <1100 unchanged. Full suite green, both
`HARNESS_PARKED` settings. `tsc` ×2, `build:web`, selftest.

## Non-goals
Actual publishing destinations; `.docx`/`.pdf`/EPUB; import; cloud
backup; print styling; ink rendered as an image.

## Invariants
Client-side only — no server file, no network dependency, works on a
plane; zero schema; the writer's own words are never altered, truncated,
or reordered by an export; every string through `deskLexicon`;
both-reference-widths on geometry asserts; report = push.

## Definition of done
Nick clicks Download → Everything, and a file lands on his machine
containing every word he has ever written in Wrizo, readable in any
text editor, with the wifi off. He can leave for vacation knowing that
whatever happens to the app, the writing is his and it is out.

— Fable, from survival check 0.1, failed, 2026-07-21
