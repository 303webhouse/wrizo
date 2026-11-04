# Rulings: `apps/desktop/src/store/syncNotice.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[syncNotice §n]` points here.

## syncNotice §1

From `apps/desktop/src/store/syncNotice.ts`, line 1 at `f079d49e` (the comment that stays: "what the writer reads when sync or local storage cannot do everything: pure, tested as text; each storage state says what is true and the one act that prevents loss, in plain words").

```ts
// ITEM 203 (P5) + STORAGE-FULL STEP 1 + ITEM 224(a) - WHAT THE WRITER READS when sync (or this device's own storage) cannot
// do everything. Pure, so it is tested as text and not only as state.
//
// THE WORDS SAY WHAT'S TRUE AND THE ONE ACT THAT PREVENTS LOSS (Fable's byte review, item 2) — a storage failure is
// not one fact, it is one of three, and the act that helps differs by which:
//   (a) failed, changes NOT yet in the account (offline, or a push not yet landed) — the memory holding them is the
//       only copy anywhere; the one act is staying open and online until they land.
//   (b) failed, EVERYTHING already pushed — nothing is at risk any more; the words say so plainly rather than
//       repeat an alarm that no longer applies, and name what this device specifically can no longer do (keep its
//       own copy).
//   (c) failed, SIGNED OUT (F2's local-first writing with no account) — there is no account for anything to reach;
//       nothing else anywhere holds a copy, so the one act is downloading one now.
// PLAIN WORDS, NO ALARM WORDS — no "warning", "critical", "error", capitals or punctuation doing the alarming; the
// facts themselves carry the weight.
//
// Priority (most urgent first):
//   * storage FAILED   - see (a)/(b)/(c) above; ahead of anything about the network, which is a separate question.
//   * offline           - the network round trip is not happening. Everything IS saved on this device.
//   * too large         - the network is FINE and everything else synced; ONE named page cannot travel in a request.
//   * rejected          - (ITEM 224(a)) the network is fine and the push succeeded, but the server could not STORE one or
//                         more named records. It stays dirty and keeps trying — never silently marked clean and lost.
//                         A different fact from "too large": nothing about its size is the problem.
//   * storage NEAR FULL - nothing has failed yet; a one-time heads-up before it does. Signed in, it urges the "stay
//                         online" act that would actually help if it fails; signed out there is no account for
//                         staying online to help reach, so it reads the same as (c) does — nothing else anywhere
//                         holds a copy, so download one now, before it fails rather than after.
```
