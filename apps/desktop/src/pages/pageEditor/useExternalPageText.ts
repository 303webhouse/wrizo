import { useEffect, type MutableRefObject } from 'react';
import { getJournalEntry, subscribe } from '../../store/persistence';
import { mergeText } from '../../store/textMerge';
import { announceKeptBoth } from '../../store/mergeNotice';

// #76 PART 1 - an open page with NOTHING UNSAVED takes the words another window saved, at once. The store tells every screen when a record changed (store/persistence/syncApply.ts applyOtherWindowWrite, from the browser's `storage` event);
// here the open page compares its record's text with what THIS editor last saved or loaded (lastSavedRef) and what it shows now (textRef):
//   - the same as either: nothing new (or this window's own save): nothing to do;
//   - different, and this editor has nothing unsaved (shows exactly what it last saved): the other window's words are adopted;
//   - different, and this editor HAS unsaved words (#76 part 3, KEEP BOTH): the two are merged (store/textMerge.ts) with what this editor last saved or loaded as the starting text, so the other window's words come in, this window's
//     unsaved words stay, and neither is dropped; the merged page is saved with the editor's next save, and the page says so once.
export function useExternalPageText({ id, unbornRef, textRef, lastSavedRef, adopt }: {
  id: string;
  unbornRef: MutableRefObject<unknown>;
  textRef: MutableRefObject<string>;
  lastSavedRef: MutableRefObject<string>;
  adopt: (next: string, how: { lastSaved: string; mapCaret?: (offset: number) => number }) => void;
}) {
  useEffect(() => subscribe(() => {
    if (unbornRef.current) return;
    const latest = getJournalEntry(id);
    if (!latest) return;
    const theirs = latest.text ?? '';
    if (theirs === lastSavedRef.current || theirs === textRef.current) return;
    if (textRef.current === lastSavedRef.current) { adopt(theirs, { lastSaved: theirs }); return; }
    const r = mergeText(lastSavedRef.current, textRef.current, theirs);
    adopt(r.text, { lastSaved: theirs, mapCaret: r.mapCaret });
    if (r.merged) announceKeptBoth(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [id]);
}
