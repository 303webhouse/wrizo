# E1 — Get My Words Out · Fable's post-merge review · 2026-07-23

**Ticket:** E1 (item 51), P0, the vacation insurance. Merged `47f2577`,
deployed in the six-ticket mega-deploy (`b936f67`, deployment `70181bfe`).
**Method:** house depth — merge census via stats (8 files, 908+/18−), then
`full_patch` line-by-line on every file: `pageExport.ts`, `download.ts`,
`clipboard.ts`, `deskLexicon.ts`, `e1.mjs` (all 454 lines), `PageEditor.tsx`,
`ScriptEditor.tsx`, `runtime-verify.mjs`. Commit trail on `main` walked
continuously from `8471d1d` (2026-07-21 21:59) to HEAD (`7f2bf8a`) — no gaps.

## Verdict: AMBER — every surface verified against the tree is GREEN; one material defect of RECORD. Remediation is small (E1.1) and must land before the Aug 1 freeze. E1's close stays open pending E1.1 + Nick's device verdict.

## THE FINDING — the claimed filename-collision fix is not on `main`

The merge commit's own message (and the item-51 records commit) state that
the independent review's one moderate finding — a filename collision on
"This Page" downloads that could silently overwrite one page's words with
another's — "was fixed by the orchestrating session post-review... a stable
per-entry-id filename suffix, plus a new harness check proving two
same-titled pages now produce distinct files with both sets of words
intact."

**Neither the fix nor the harness check exists in the merged tree:**

1. `exportPageFiles()` derives `base` from `firstLine(entry.text)` with a
   date fallback — no id suffix anywhere in `pageExport.ts`.
2. Both call sites (`PageEditor.downloadThisPage`,
   `ScriptEditor.downloadThisPage`) download `${files.base}.${format}`
   verbatim — no suffix appended there either.
3. `e1.mjs` contains no two-same-titled-pages check at all — and its
   round-trip check asserts the *unsuffixed* filename
   (`'Round Trip Title.md'`) exactly, which would **fail** if the described
   fix were present. The merged harness demonstrably predates the fix.
4. No subsequent commit on `main` between the E1 merge and HEAD touches
   these files for this purpose (trail walked commit-by-commit).

The likeliest explanations, in order: the fix was made in the working tree
and never committed (the same uncommitted-work class as the eleven-file
collision and today's untracked directories — **it may be sitting in the
primary checkout right now**); or it was committed to `e1-words-out` after
the merge ref was taken and never re-merged; or the record was written
ahead of work that an interrupt then swallowed. Whichever it is, the record
asserts a verification whose artifacts are absent — the exact divergence
the placeholder-report law exists to prevent, here on a P0 surface.

**Practical severity: moderate, bounded.** Only the "This Page" scope is
exposed, only when two pages share a first line, and only where the
download layer overwrites rather than uniquifies. "This Binder" and
"Everything" are single-document scopes and are unaffected — **Nick's
sitting can proceed as planned; the Everything test is untouched by this.**

**Remediation — E1.1, directed to CC:**
1. First, check the primary checkout and `e1-words-out` for the
   uncommitted/unmerged fix before writing anything new.
2. Land the fix as described in the merge record: a short stable
   per-entry-id suffix on the "This Page" base name, in `pageExport.ts`
   (one place, both call sites inherit).
3. Land the described harness check: two pages, identical first lines,
   both downloaded — assert two distinct files on disk, each carrying its
   own words intact. Update the existing round-trip filename assertion to
   the suffixed form via a proper park cycle (the CD3/BM1 pattern, per the
   A1 ruling).
4. One records commit correcting item 51: the original claim did not land;
   E1.1 lands it. Named plainly, per the stalled-report law.

## VERIFIED GREEN — read against the code, not the reports

**Zero server files, zero schema, zero new deps.** All eight files under
`apps/desktop/`. The brief's construction invariant holds: export cannot
have a network dependency because no network-touching code exists in it.

**The offline proof is real.** `Network.emulateNetworkConditions
({offline: true})` via raw CDP, `navigator.onLine === false` asserted, held
across every export scenario; downloads verified by reading the **actual
bytes** the browser's own download manager wrote to disk
(`Page.setDownloadBehavior`) — end-to-end, not a click interception.
`download.ts` is a pure Blob → object URL → anchor click; honest boolean
return; delayed URL revoke with a sound rationale.

**S1's diagnosis is a real root cause, not a patch.** The old `copyText`
fire-and-forgot the Clipboard promise (`void ...writeText`), so a genuine
async rejection became an unhandled rejection the caller could never see —
and the early `return` meant the execCommand fallback never ran either.
The defect from the writer's chair was silence on success; the latent hole
was silence on failure; both are closed. `copyText` now returns
`Promise<boolean>`; both Publish dialogs await it and speak through the
existing ActionToast; the legacy "Copy script text" button is deliberately
untouched (no toast node in that tree) with its own harness check proving
it still copies. Careful work.

**The completeness architecture is sound.** "Everything" enumerates
`getJournalEntries()` — the one home-agnostic enumeration in the codebase
— minus system boards (derived membership mirrors whose cards are
page-pins of pages already exported directly; zero unique words) minus
soft-deleted. The harness corpus seeds all five live kinds plus both
must-excludes and asserts the exported count equals the live-page count,
per-kind verbatim bodies, honest ink placeholders, pin-as-reference, and
both exclusions. Binder scope reproduces ProjectHome's own reading order
(creation order), proven against a deliberately shuffled fixture; every
page type filed to the binder is included. The single-document delivery is
a disclosed builder's call with a correct zero-deps rationale.

**The debounce window cannot eat words.** "This Page" reads the live
`textRef` / live-reconstructed script doc; Binder/Everything flush first.

**Filename safety:** the Windows-superset illegal set stripped, trailing
dot/space trimmed, 80-char cap, date-stamp fallback — harness-proven with
a hostile first line.

**Geometry:** the Download row proven at 1100/1280/2200; legacy <1100
chrome byte-identical, and the legacy host receives the **same** shared
dialog — the same insurance, not a lesser one — proven, with the sharing
correctly attributed to pre-ticket structure rather than claimed as new.

**The lexicon boundary is right and worth keeping as canon:** UI chrome
(buttons, toasts) routes through `deskLexicon`; the exported file's body
deliberately does not — a durable portable artifact is not themed UI
vocabulary (TU2 S2's own precedent, cited in-code). Endorsed.

## ADVISORIES — non-blocking

1. **Trash scope is an inherited default, not a ruled one.** "Everything"
   exports live pages only; soft-deleted words are excluded, and the
   harness asserts the exclusion. This matches the brief's enumeration
   ("every page the writer owns") but sits below the definition-of-done's
   strongest reading ("every word he has ever written"). **For Nick at the
   sitting:** is vacation insurance live-pages-only, or does Trash ride
   along? Fable's recommendation: include trashed pages under an honest
   `## From the Trash`-marked section — a writer's discards are still his
   words, and completeness beats elegance. His word either way; recorded
   as ruled scope, not default.
2. **`boardBody`'s kind whitelist fails closed the wrong way.** It exports
   text/ink/page-pin and silently drops anything else. The 'connection'
   kind carries no writer text — fine today — but a future text-bearing
   box kind would default to *silently dropped*, violating the
   never-missing law without a sound. Invert in E1.1: unknown kinds export
   a named placeholder line.
3. **The `/^# /m` page-count anchor is harness-fragile:** a writer's own
   body line beginning "# " would inflate the parsed count. Seeded corpus
   avoids it; real-world corpora may not. A hardening note for the deflake
   pass (item 48's rider territory), not a product defect.

## Close condition

E1.1 merged with the collision fix + its harness check + the corrected
item-51 record; Nick's device verdict on the sitting agenda's item one
(Everything, wifi off); the Trash-scope word recorded. Then item 51 closes.

— Fable
