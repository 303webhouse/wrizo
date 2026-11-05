# Rulings: `apps/desktop/src/components/UnlockCeremony.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[UnlockCeremony §n]` points here.

## UnlockCeremony §1

From `apps/desktop/src/components/UnlockCeremony.tsx`, line 5 at `7f1c6a84` (the comment that stays: "the unlock ceremony, the one accepted visible locked door; orange fires only the instant a territory is chosen; focus moves in and Tab is contained, so aria-modal is true; no Escape - the rite resolves in a choice").

```ts
// HB1 S4 — the unlock ceremony. R2's carve-out: a visible locked door is
// accepted here, once, as the first-run rite's own reward — M1's "never a
// visible locked door" governs everywhere else, unchanged. Crossing 100
// words mounts this; choosing a territory applies the theme (existing
// mechanism, store/theme.ts), then closes — the veil lifts with it.
//
// Orange law: gate progress (FirstRunGate.tsx) stays quiet throughout; this
// is the ONE place orange fires — the instant a human actually chooses, not
// as resting decoration on either offered button (so it never becomes a
// second .btn-brass on the same screen — the ceremony's own `.chosen` class
// is a transient, single-valued flash, not the shared brass utility).
//
// hb1.1 F-1 (Fable review) — `aria-modal="true"` claimed an inert
// background while the editor behind stayed genuinely Tab-reachable (S3's
// "one path" invariant belongs to the GATE, not this dialog — the editor is
// deliberately left interactive, this dialog is the thing overlaying it).
// Focus moves to the first offered territory on mount and Tab is contained
// within the dialog's two buttons while it's open, so the aria-modal claim
// is actually true now. No Escape-dismiss, by design: the rite resolves in
// a choice, not a cancel — there is no prior state to back out to.
```
