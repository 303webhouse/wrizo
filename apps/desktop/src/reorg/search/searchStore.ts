import { useSyncExternalStore } from 'react';
import { getPref, setPref } from '../prefsSaved';
import { MIN_LETTERS, type Hit, type Reach } from './searchFind';
import { canUndoReplace, forgetReplaces, replaceHits, undoReplace, type ReplaceSaid } from './replace';

// THE REORG'S SEARCH, its state (in memory, this session): whether it is open, where it was opened from, how far it looks, the word, the find she
// is on. It lives outside the Back menu because the search outlives a page: Enter into the next Part, or a find in another Doc, opens another page
// and the search is still open there. The one thing saved is the last search word (users.prefs' searchWord, Nick's SAVED DATA ruling, Nov 19;
// reorg/prefsSaved.ts already names the fact): kept when she leaves the search or goes to a find, and put back in the field the next time.

/** Where the search was opened: the top rail's door, or a Back menu tab's field (the tab's own id). */
export type SearchFrom = 'bar' | 'plan' | 'links' | 'tutor';

export interface SearchState {
  open: boolean;
  from: SearchFrom;
  /** was the Back menu open when the search took its place (null until the Back menu has said) */
  wasOpen: boolean | null;
  reach: Reach;
  q: string;
  /** the key of the find she is on, or null for "the first in the Part she is on" */
  cur: string | null;
  /** Doc groups opened past their first two rows */
  more: Record<string, boolean>;
  /** bumped by each opening: the menu selects the field's word once for each */
  opened: number;
  /** Find and Replace (reorg/search/replace.ts): its box open, the WITH word, what the last press said, whether there is a step to undo */
  replaceOpen: boolean;
  repl: string;
  said: ReplaceSaid | null;
  canUndo: boolean;
}

let state: SearchState = { open: false, from: 'bar', wasOpen: null, reach: 'doc', q: '', cur: null, more: {}, opened: 0, replaceOpen: false, repl: '', said: null, canUndo: false };
/** what the Back menu should go back to when the search closes: open (on the tab it was on) or shut */
let restoreOpen = false;
const subs = new Set<() => void>();
const set = (next: Partial<SearchState>) => { state = { ...state, ...next }; subs.forEach((fn) => fn()); };

function keepWord(): void {
  const word = state.q.trim();
  if (word.length >= MIN_LETTERS) setPref('searchWord', { word });
}

/** Open the search. ASSETS starts on This Project, where the assets are (the menu falls back to This Doc when she is in no Project); the top rail,
 *  PLAN and FEEDBACK start on This Doc (the prototype's openSearch). `wasOpen` is the Back menu's state when the field is in it (true); the top
 *  rail does not know it, so the Back menu says it when it sees the search open. */
export function openSearch(from: SearchFrom, wasOpen: boolean | null = null): void {
  if (state.open) { set({ opened: state.opened + 1 }); return; }
  const last = getPref('searchWord');
  set({ open: true, from, wasOpen, reach: from === 'links' ? 'project' : 'doc', q: typeof last?.word === 'string' ? last.word : '', cur: null, more: {}, opened: state.opened + 1 });
}
export function noteWasOpen(open: boolean): void { if (state.open && state.wasOpen === null) set({ wasOpen: open }); }
export function closeSearch(): void {
  if (!state.open) return;
  keepWord();
  restoreOpen = !!state.wasOpen;
  forgetReplaces();
  set({ open: false, wasOpen: null, q: '', cur: null, more: {}, replaceOpen: false, repl: '', said: null, canUndo: false });
}
/** what the Back menu goes back to after the search closed */
export const restoreAfterSearch = (): boolean => restoreOpen;
export const setSearchQ = (q: string): void => set({ q, cur: null, more: {}, said: null });
export const toggleReplace = (): void => set({ replaceOpen: !state.replaceOpen });
export const setReplaceWith = (repl: string): void => set({ repl });
/** replace these finds of this Doc with the WITH word: one press, one step to undo */
export function doReplace(hits: Hit[]): void {
  const said = replaceHits(hits, state.q.trim(), state.repl);
  keepWord();
  set({ said, cur: null, canUndo: canUndoReplace() });
}
export function doUndoReplace(): void { const said = undoReplace(); set({ said, cur: null, canUndo: canUndoReplace() }); }
export const setSearchReach = (reach: Reach): void => set({ reach, cur: null, more: {} });
export function setSearchCur(cur: string | null): void { keepWord(); set({ cur }); }
export const openMore = (id: string): void => set({ more: { ...state.more, [id]: true } });
export const getSearch = (): SearchState => state;

export function useSearch(): SearchState {
  return useSyncExternalStore((fn) => { subs.add(fn); return () => { subs.delete(fn); }; }, getSearch, getSearch);
}
