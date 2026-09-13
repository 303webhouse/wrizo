# Batch One — review (Fable) — range 39eacae → aa18840

VERDICT: PASS. Range pulled as two trees and diffed locally: 69
files; 17 product files, exactly the list; apps/server 0 bytes; no
.sql, no migration — both zero claims verified independently.
THE TWO-LANE FILES, read whole. persistence.ts: the 85-C seams and
the erratum's reader occupy disjoint regions and share only the
cache and flushNow. Seams — JournalPageSeed widened by presence
check (explicit null = field ABSENT; seven fields applied only when
supplied, so an unseeded call still writes the byte-identical row);
wrizoCreateJournalPage and the eight new seams flush; every seam is
window-scoped and NO product file references any (grepped src/:
zero hits outside persistence.ts — planTrail's is a comment); the
one composition (wrizoPatchProject) is the same getProject+
saveProject setProjectDrawer performs, inside the wrapper rule as
flagged. Reader — getBoardsConnecting = getBoardsPinning minus
boards whose entry carries a systemKind; getSystemKind accepts
null/undefined and returns undefined, so the filter cannot throw;
the raw scan already excludes deletedAt boards. All seven
"connected" callers migrated (PlacesPanel, CascadePanels,
BoardEditor, ScriptEditor, JournalEntry, PageEditor, tutorLenses);
ExistingPagePicker keeps the raw scan for its structural question —
the split is exactly the erratum's. PageEditor.tsx / index.css:
disjoint regions, disjoint selectors, no behavioural coupling.
122's active state is a document selectionchange effect keyed on
mode+text, Draft only, reading the same caret reader the formatter
uses; the errata's share is one reader swap and two crumb rules —
.sprint-crumb is flex, so .crumb-here's ellipsis is live and
.wz-crumb-home never shrinks. Strike composes with underline via
text-decoration; ::selection paints from --brass/--on-brass;
.mode-tbtn[data-on='true'] was already styled, so the page's
buttons wear the card's look; the strip's z-index:1 census holds.
The deleted decorateMarkdown HAD a live caller (ForwardOnlyEditor),
re-pointed to decorateMarkdownForCard(text, null) — identical
line-level logic with markers collapsed, which is 122's own ruling;
the suite covers it.
OBS, none blocking: (1) HARNESS — "every seam flushes" is true of
the 85-C block and false of the file: wrizoPinPageToBoard,
wrizoSetPinDisplayed and wrizoSetPageHome sit above it unwrapped,
and their targets do not flush (checked). One class, three
instances → ERRATA wave 2. (2) RECORDS — phone ink is item 132 and
the ledger records the renumbering, but three sites still read
"item 131 (phone ink)": index.css's .mode-nib sweep comment,
ModeStage.tsx's nib comment, open-threads.md ~line 208. Comment-only;
next batch's records. (3) LIMIT, not defect — marksAt is inclusive
at both run edges and reads italic nested in bold as not italic;
within 122's ruling, revisited by reveal-on-click and item 79.
The combined state has never been measured: the deploy pair at the
batch HEAD is its first and only certification — a red there is a
diagnosis, not a retry.
— Fable, 2026-09-11
