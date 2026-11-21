import { useSyncExternalStore } from 'react';
import { getPageBreaks, subscribePageBreaks } from '../store/pageBreaks';
import { useDeskLexicon } from '../store/deskLexicon';

// PAGE BREAKS - the count (the Wrizors' spec draft 3, section 3): the page the caret is on, out of the Doc's pages, read from the one list the
// marks and the page-turn sound read, so they can never disagree. Page 1 of 1 shows too. Words from the lexicon: Arbor "p. 2 of 3", Flux
// "PG 2/3", Machina "page 2 of 3". Absent until this page's list exists (a list never outlives its page) [PageCount §1]
// `entryId` absent: the open page's list, whichever it is (the Run strip, which is drawn only beside a writing page)
export function PageCount({ entryId, className }: { entryId?: string | null; className?: string }) {
  const { t } = useDeskLexicon();
  const st = useSyncExternalStore(subscribePageBreaks, getPageBreaks);
  if (st.version === 0 || (entryId === undefined ? st.id === null : st.id !== entryId)) return null;
  const text = t('pageOfPages').replace('{n}', String(st.page)).replace('{m}', String(st.total));
  return <span className={`wz-pagecount${className ? ' ' + className : ''}`} data-page-n={st.page} data-page-m={st.total}>{text}</span>;
}
