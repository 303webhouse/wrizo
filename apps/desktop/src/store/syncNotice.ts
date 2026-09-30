// ITEM 203 (P5) + STORAGE-FULL STEP 1 - WHAT THE WRITER READS when sync (or this device's own storage) cannot do
// everything. Pure, so it is tested as text and not only as state.
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
// Priority (most urgent first) - unchanged in shape from step 1, now with the three-way split at the top:
//   * storage FAILED   - see (a)/(b)/(c) above; ahead of anything about the network, which is a separate question.
//   * offline           - the network round trip is not happening. Everything IS saved on this device.
//   * too large         - the network is FINE and everything else synced; ONE named page cannot travel in a request.
//   * storage NEAR FULL - nothing has failed yet; a one-time heads-up before it does, urging the same "stay online"
//                         act that would actually help if it does.
import type { SyncStatus, TooLargeRecord } from './sync';

export type SyncNoticeLexiconKey =
  | 'syncTooLargeOne' | 'syncTooLargeMany'
  | 'syncStorageFullPending' | 'syncStorageFullSynced' | 'syncStorageFullAnon'
  | 'syncStorageNearFull';

export function syncNoticeText(
  status: SyncStatus,
  tooLarge: readonly TooLargeRecord[],
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
  if (tooLarge.length > 0) {
    // A REPLACER FUNCTION, not a replacement string. String.prototype.replace gives `$&`, `$1`, `$'` and `$$` special meaning in a
    // replacement STRING, and the title is WHATEVER THE WRITER TYPED - a page called "Q&A $& notes" would have come out mangled (with
    // the template's own `{title}` spliced into it). A function's return value is taken literally.
    return tooLarge.length === 1
      ? t('syncTooLargeOne').replace('{title}', () => tooLarge[0].title)
      : t('syncTooLargeMany').replace('{n}', () => String(tooLarge.length));
  }
  if (storageNearFull) return t('syncStorageNearFull');
  return null;
}
