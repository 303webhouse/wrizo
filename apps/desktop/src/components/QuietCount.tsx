import { PageCount } from './PageCount';
import { wordCount } from '../store/wordCount';
import { useDeskLexicon } from '../store/deskLexicon';

// DISTRACTION FREE's one line under the page (the flourish spec §7.3, Nick: "Yes to all three"): her words and the page she is on, still text with no bar.
// The page part is the page count's own (one list for the marks, the count and the sound)
export function QuietCount({ text, entryId }: { text: string; entryId: string }) {
  const { t } = useDeskLexicon();
  const n = wordCount(text);
  return (
    <div className="desk-frame-instrument wz-quiet-count" data-style="count">
      <span className="wz-quiet-words">{(n === 1 ? t('quietWord') : t('quietWords')).replace('{n}', String(n))}</span>
      <span className="wz-pagecount-sep" aria-hidden="true"> · </span>
      <PageCount entryId={entryId} />
    </div>
  );
}
