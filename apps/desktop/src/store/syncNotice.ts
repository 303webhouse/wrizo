// what the writer reads when sync or local storage cannot do everything: pure, tested as text; each storage state says what is true and the one act that prevents loss, in plain words [syncNotice §1]
import type { SyncStatus, TooLargeRecord, RejectedRecord, PullDiagnostic } from './sync';

export type SyncNoticeLexiconKey =
  | 'syncTooLargeOne' | 'syncTooLargeMany'
  | 'syncRejectedOne' | 'syncRejectedMany' | 'syncPullShort'
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
  pullDiagnostic: PullDiagnostic | null = null,
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
  // B10.1 (SAFETY NET) - a whole-account pull carried pages that never reached the cache, even after a retry. Counts only.
  if (pullDiagnostic) {
    return t('syncPullShort')
      .replace('{pulled}', () => String(pullDiagnostic.pulled))
      .replace('{live}', () => String(pullDiagnostic.live));
  }
  if (storageNearFull) return signedIn ? t('syncStorageNearFull') : t('syncStorageNearFullAnon');
  return null;
}
