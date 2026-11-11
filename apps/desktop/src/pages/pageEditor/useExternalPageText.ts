import { useEffect, type MutableRefObject } from 'react';
import { getJournalEntry, subscribe } from '../../store/persistence';

// #76 PART 1 - an open page with NOTHING UNSAVED takes the words another window saved, at once. The store tells every screen when a record changed (store/persistence/syncApply.ts applyOtherWindowWrite, from the browser's `storage` event);
// here the open page compares its record's text with what THIS editor last saved or loaded (lastSavedRef) and what it shows now (textRef):
//   - the same as either: nothing new (or this window's own save): nothing to do;
//   - different, and this editor has nothing unsaved (shows exactly what it last saved): the other window's words are adopted;
//   - different, and this editor HAS unsaved words: left alone here (part 3 keeps both).
export function useExternalPageText({ id, unbornRef, textRef, lastSavedRef, adopt }: {
  id: string;
  unbornRef: MutableRefObject<unknown>;
  textRef: MutableRefObject<string>;
  lastSavedRef: MutableRefObject<string>;
  adopt: (next: string) => void;
}) {
  useEffect(() => subscribe(() => {
    if (unbornRef.current) return;
    const latest = getJournalEntry(id);
    if (!latest) return;
    const theirs = latest.text ?? '';
    if (theirs === lastSavedRef.current || theirs === textRef.current) return;
    if (textRef.current !== lastSavedRef.current) return;
    adopt(theirs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [id]);
}
