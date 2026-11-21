import { useDeskLexicon } from '../../store/deskLexicon';
import { openSearch, type SearchFrom } from './searchStore';

// THE SEARCH DOOR IN A BACK MENU TAB (the prototype's searchDoor: "a search field sits in every Back menu tab; a click into it turns the whole menu
// into the search menu"). It takes no typing itself: the press opens the search (reorg/search/SearchMenu.tsx), which takes the menu's place with
// the caret in its own field. ASSETS opens it on This Project; PLAN and FEEDBACK on This Doc (reorg/search/searchStore.ts).
export function SearchField({ from }: { from: SearchFrom }) {
  const { t } = useDeskLexicon();
  const go = () => openSearch(from, true);
  return (
    <div className="reorg-search-door">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
      <input type="text" readOnly data-search-field aria-label={t('reorgSearch')} placeholder={t('reorgSearch')} onFocus={go} onClick={go} />
    </div>
  );
}
