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
import type { SyncStatus, TooLargeRecord, RejectedRecord } from './sync';

export type SyncNoticeLexiconKey =
  | 'syncTooLargeOne' | 'syncTooLargeMany'
  | 'syncRejectedOne' | 'syncRejectedMany'
  | 'syncStorageFullPending' | 'syncStorageFullSynced' | 'syncStorageFullAnon'
  | 'syncStorageNearFull' | 'syncStorageNearFullAnon';

export function syncNoticeText(
  status: SyncStatus,
  tooLarge: readonly TooLargeRecord[],
  rejected: readonly RejectedRecord[],
  storageFailed: boolean,
  storageNearFull: boolean,
  hasUnpushedDirty: boolean,
  signedIn: boolean,
  t: (key: SyncNoticeLexiconKey) => string,
): string | null {
  if (storageFailed) {
    if (!signedIn) return t('syncStorageFullAnon');            // (c) — nothing else could ever hold a copy
    return hasUnpushedDirty ? t('syncStorageFullPending')       // (a) — the account does not have this yet
      : t('syncStorageFullSynced');                             // (b) — the account already does
  }
  if (status === 'offline') return 'Offline — saved here';
  // A REPLACER FUNCTION, not a replacement string. String.prototype.replace gives `$&`, `$1`, `$'` and `$$` special meaning in a
  // replacement STRING, and the title is WHATEVER THE WRITER TYPED - a page called "Q&A $& notes" would have come out mangled (with
  // the template's own `{title}` spliced into it). A function's return value is taken literally.
  if (tooLarge.length > 0) {
    return tooLarge.length === 1
      ? t('syncTooLargeOne').replace('{title}', () => tooLarge[0].title)
      : t('syncTooLargeMany').replace('{n}', () => String(tooLarge.length));
  }
  if (rejected.length > 0) {
    return rejected.length === 1
      ? t('syncRejectedOne').replace('{title}', () => rejected[0].title)
      : t('syncRejectedMany').replace('{n}', () => String(rejected.length));
  }
  if (storageNearFull) return signedIn ? t('syncStorageNearFull') : t('syncStorageNearFullAnon');
  return null;
}
