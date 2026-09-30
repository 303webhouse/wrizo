// ITEM 203 (P5) + STORAGE-FULL STEP 1 - WHAT THE WRITER READS when sync (or this device's own storage) cannot do
// everything. Pure, so it is tested as text and not only as state.
//
// Four different facts, in the order the writer needs to hear them (most urgent first) - and the words keep them apart:
//   * storage FAILED  - this device's own copy of the latest edit could NOT be written. The most urgent: it is an
//                        active data-loss risk right now, ahead of anything about the network (which is a separate
//                        question - see storageHealth.ts).
//   * offline          - the network round trip is not happening. Everything IS saved on this device. (Broader than
//                        "too large", so it wins while it is true.)
//   * too large        - the network is FINE and everything else synced; ONE named page cannot travel in a request.
//                        It is saved here and is not on the writer's other devices. It used to be reported as
//                        "Offline", which was a lie the writer could do nothing about.
//   * storage NEAR FULL - nothing has failed yet; a one-time heads-up before it does (storageHealth.ts's own "once").
import type { SyncStatus, TooLargeRecord } from './sync';

export type SyncNoticeLexiconKey = 'syncTooLargeOne' | 'syncTooLargeMany' | 'syncStorageFull' | 'syncStorageNearFull';

export function syncNoticeText(
  status: SyncStatus,
  tooLarge: readonly TooLargeRecord[],
  storageFailed: boolean,
  storageNearFull: boolean,
  t: (key: SyncNoticeLexiconKey) => string,
): string | null {
  if (storageFailed) return t('syncStorageFull');
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
