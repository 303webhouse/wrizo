# Rulings: `apps/desktop/src/components/HelpButton.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[HelpButton §n]` points here.

## HelpButton §1

From `apps/desktop/src/components/HelpButton.tsx`, line 5 at `ded4321b` (the comment that stays: "a "?" separate from DrawerNote: it opens the one shared HelpPop overlay in the --help token, never brass; its accessible name is built from the label beside it").

```ts
// HELP BUTTONS (Nick approved Oct 12, cursor/help-buttons @ d4d1c835;
// docs/mockups/help-buttons/index.html is the approved reference). The "?"
// trigger — a SEPARATE component from DrawerNote.tsx on purpose: DrawerNote's
// own "?" goes brass when open (the exact thing this ticket's token rule
// forbids) and opens a per-instance position:absolute pop; this one opens
// the ONE shared HelpPop.tsx overlay instead (mounted once, like
// ContextMenuHost.tsx), styled from the --help token, never brass.
//
// `subjectLabel` is whatever themed word already renders beside this button
// (e.g. the Sliver's own t('railTemplates')) — the accessible name is built
// from it ("What is Templates?"), so it is always in step with whatever the
// writer is actually reading, in either theme, without a second lexicon
// lookup of its own (the mockup's own aria-label pattern, carried over).
```
