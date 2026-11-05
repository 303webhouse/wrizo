# Rulings: `apps/desktop/src/store/tutorDisclosure.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[tutorDisclosure §n]` points here.

## tutorDisclosure §1

From `apps/desktop/src/store/tutorDisclosure.ts`, line 40 at `7f1c6a84` (the comment that stays: "bump this, and add a new body id, the day the disclosure's wording changes: a device with a lower seenVersion sees it once more, with no other change").

```ts
// Bump this — and add a new deskLexicon body id (`tutorDisclosureBodyV4`,
// etc.), per `tutorDisclosureBodyV3`'s own precedent — the day the
// disclosure's wording next changes. Nothing else in this file needs to
// change: every existing device's stored seenVersion is already less than
// whatever the new constant becomes, so the "show once more" behavior
// falls out of the comparison for free.
// TU5 S6 — bumped 2 -> 3 the day the Bible joined the travelers: v3's body
// (deskLexicon's `tutorDisclosureBodyV3`) names the writer's saved Bible facts
// alongside the question and the page delta. Every device with seenVersion < 3
// sees v3 exactly once — a v2-acknowledged device included — with no bespoke
// branch (the integer compare in `load()`/needsShowing below does it all).
// ITEM 84 (the Draft roster) — bumped 3 -> 4 the day TD4, the selection ask,
// became the first counsel to put bytes on the wire beyond the three v3
// enumerates. A selection is none of v3's three travelers: it can be text the
// Tutor has already read, or text outside the delta entirely, so TD4 shipped
// under v3 would send what the shown sentence does not name. v4 is Nick's
// ratified candidate B (2026-08-17, provisionally-binding) and it is what
// authorizes the shape — "a counsel that reads more names it on the button and
// sends only that, only then." Rendered in ANNOTATION FORM with v3 standing
// verbatim beneath it (open-threads.md's own ruling), so nothing v3 promised is
// withdrawn. Every device with seenVersion < 4 sees it exactly once, by the same
// integer compare as every bump before it — no version-specific branch.
```
