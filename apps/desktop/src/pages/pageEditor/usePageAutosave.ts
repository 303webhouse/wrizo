import { useEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import { flushNow, getJournalEntry, saveJournalEntry } from '../../store/persistence';
import { registerFlush } from '../../store/flushRegistry';
import { type UnbornHandle } from '../../components/UnbornSurface';

const AUTOSAVE_MS = 2000;

export function usePageAutosave({ unbornRef, id, textRef, lastSavedRef, setText, text }: {
  unbornRef: MutableRefObject<UnbornHandle | null>;
  id: string;
  textRef: MutableRefObject<string>;
  lastSavedRef: MutableRefObject<string>;
  setText: Dispatch<SetStateAction<string>>;
  text: string;
}) {
  // Persist the page text to its JournalEntry (debounced), merging the latest
  // record so other metadata is never clobbered.
  // PB1 — an unborn page has no row to merge into, and must not gain one here:
  // birth is `onTextChange` below, which is SYNCHRONOUS and carries the first
  // word with it. If this ran on an unborn page it would write an empty row on
  // the debounce and re-create the litter this ticket removes.
  const flush = () => {
    if (unbornRef.current) return;
    const latest = getJournalEntry(id);
    if (latest && latest.text !== textRef.current) {
      saveJournalEntry({ ...latest, text: textRef.current });
      lastSavedRef.current = textRef.current;
    }
  };

  // PB1 — THE FIRST WORD. The birth trigger, and the one place the local-first
  // invariant is at stake: the row is written WITH this text in the same
  // synchronous call (store/unbornPage.ts's `birth`), never created empty and
  // filled in afterwards. So the first keystroke reaches disk on exactly the
  // path and the schedule every later keystroke does — the existing debounced
  // flush, offline included — and there is no window in which it exists only in
  // memory that did not already exist for every other keystroke in the app.
  //
  // Fires on the first NON-EMPTY text: a keystroke that leaves the page empty
  // (typing a space then deleting it, an IME composition that resolves to
  // nothing) has produced no word, and a page is born when it has a word.
  const onTextChange = (next: string) => {
    setText(next);
    if (unbornRef.current && next.trim()) {
      lastSavedRef.current = next;
      unbornRef.current.birthWith({ text: next });
    }
  };

  useEffect(() => {
    if (text === lastSavedRef.current) return;
    const h = setTimeout(flush, AUTOSAVE_MS);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, id]);

  // Flush on tab hide / unmount.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') { flush(); flushNow(); } };
    document.addEventListener('visibilitychange', onHide);
    // LOGOUT FLUSH — a sign-out flushes this page's pending text first, so it is counted as unsaved.
    const unregisterFlush = registerFlush(flush);
    return () => {
      unregisterFlush();
      document.removeEventListener('visibilitychange', onHide);
      flush();
      flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { flush, onTextChange };
}
