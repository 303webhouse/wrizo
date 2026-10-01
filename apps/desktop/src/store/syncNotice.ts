// ITEM 203 (P5) - WHAT THE WRITER READS when sync cannot do everything. Pure, so it is tested as text and not only as state.
//
// Three different facts, and the words keep them apart:
//   * 'offline'   - the network round trip is not happening. Everything is saved on this device. (It is the broader
//                   truth, so it wins while it is true.)
//   * too large   - the network is FINE and everything else synced; ONE named page cannot travel in a request. It is
//                   saved here and is not on the writer's other devices. It used to be reported as "Offline", which was
//                   a lie the writer could do nothing about.
//   * rejected (ITEM 224(a)) - the network is fine and the push itself succeeded, but the server could not STORE one
//                   or more named records (never silently marked clean and lost — it stays dirty and keeps trying).
//                   A different fact from "too large": nothing about its size is the problem.
import type { SyncStatus, TooLargeRecord, RejectedRecord } from './sync';

export function syncNoticeText(
  status: SyncStatus,
  tooLarge: readonly TooLargeRecord[],
  rejected: readonly RejectedRecord[],
  t: (key: 'syncTooLargeOne' | 'syncTooLargeMany' | 'syncRejectedOne' | 'syncRejectedMany') => string,
): string | null {
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
  return null;
}
