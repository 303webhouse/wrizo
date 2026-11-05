# Rulings: `apps/desktop/src/components/HomeFlow.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[HomeFlow §n]` points here.

## HomeFlow §1

From `apps/desktop/src/components/HomeFlow.tsx`, line 10 at `7f1c6a84` (the comment that stays: "unreachable from any UI: App.tsx no longer imports this; Arrival.tsx carries its sign-in fields and calls").

```ts
// PARKED — HB1, 2026-07-16 (docs/wrizo-alpha/hb1-threshold-brief.md).
// App.tsx no longer imports this component; components/Arrival.tsx replaces
// its whole job (landing, the write gate, the reward, sign-in/account) —
// Nick's ruling on an overlap this ticket's own brief didn't name, surfaced
// before any code was written (see Arrival.tsx's header comment). Park,
// don't delete: the account/sign-in form fields and apiLogin/apiRegister
// wiring were relocated to Arrival verbatim, not rebuilt; this file's own
// forced-write-gate mechanics (WORD_GOAL=50, the bloom, ForwardOnlyEditor as
// the gate surface, deferred persistence until account creation) are
// superseded by HB1's F1/F3 (100 words, the real Free Write surface,
// persisted immediately, no account required) and unreachable from any UI.
//
// Original header comment, preserved below for context:
// HOME port (v6) — the warm-dark front door. Landing → forced first-write gate →
// reward → account, seated on the existing forward-only prose surface (CW2). The
// gate writes NO editor logic of its own: it mounts <ForwardOnlyEditor>, so the
// runway, strikethrough, the struck-words-drop-from-derived-prose rule, the
// paste block, and IME/tablet exposure all come for free. The word the reward
// echoes and the entry we persist are the clean DERIVED text (struck excluded),
// which is exactly what the editor reports up via onChange.
//
// Visuals/copy/motion are ported from apps/desktop/scratch/wrizo-home-v6.html
// (the feel source of truth); styles live scoped under .wz-home in index.css.
//
// Deferred (flagged for review, NOT built here):
//  - Gate idle-nudges: the re-tuned nudge cadence lives in QuickSprint; mounting
//    it here needs that system extracted into a shared hook. Follow-up.
//  - The v6 "launch"/Desk launchpad as the authed home (replaces SessionLauncher).
//  - Auth model: invite dropped (Wrizo is open — the writing-gate is the filter).
//    Account collects email + password for now; passwordless / email-first is a
//    later backend lift (backlog).
```
