import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JournalEntry } from '../../types';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { getJournalEntry } from '../../store/persistence';
import { firstLine } from '../../store/entryText';
import { routeForEntry } from '../../store/routeForEntry';
import { useProjectName } from '../ReorgRail';
import { partsOfDoc } from '../partsSeam';
import { REACHES, runSearch, snippet, type Hit, type HitGroup, type Reach } from './searchFind';
import { closeSearch, openMore, setSearchCur, setSearchQ, setSearchReach, useSearch } from './searchStore';
import { useSearchMarks } from './searchMarks';

// THE SEARCH MENU (the reorg's search, reorg/search/searchFind.ts for what it finds): it takes the whole Back menu's place, the tab row gone (the
// prototype's searchMenu, frames P3-26A and P3-26A2). A way back (to the tab she came from, or Close), the field with its count, one row of
// scopes and a line saying what that scope looks in, then the finds under their heads. Out in a Project a Doc shows two rows and a line for the
// rest (the find she is on is never hidden). The widen line sits under the finds. Enter: the next find in this Doc (Shift+Enter the one before),
// into another Part when this one has no more. A find in another Part opens it as moving between Parts does; a find in another Doc, or on a
// Board, opens it with the return chip. Esc closes the search.

const REACH_WORD: Record<Reach, DeskTermId> = { doc: 'reorgSearchReachDoc', project: 'reorgSearchReachProject', all: 'reorgSearchReachAll' };
const LINE_WORD: Record<Reach, DeskTermId> = { doc: 'reorgSearchLineDoc', project: 'reorgSearchLineProject', all: 'reorgSearchLineAll' };
const fill = (s: string, vals: Record<string, string | number>): string => Object.entries(vals).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
/** the opening whose word the field has already selected: a later render on another page only puts the caret back */
let selectedFor = 0;

export function SearchMenu({ entry, open, backWord }: { entry: JournalEntry; open: boolean; backWord: string | null }) {
  const { t } = useDeskLexicon();
  const nameOf = useProjectName();
  const navigate = useNavigate();
  const s = useSearch();
  const field = useRef<HTMLInputElement>(null);
  const found = useMemo(() => runSearch(entry, s.q, s.reach), [entry, s.q, s.reach]);
  const all = useMemo(() => found.groups.flatMap((g) => g.rows), [found]);
  const cur: Hit | null = (s.cur ? all.find((h) => h.key === s.cur) ?? found.here.find((h) => h.key === s.cur) : null)
    ?? found.here.find((h) => h.entryId === entry.id) ?? null;
  useSearchMarks(found.q, cur && cur.entryId === entry.id && cur.boxId == null ? cur.at : null);

  // the field takes the caret once the Back menu is open; the word is selected once for each opening, so typing replaces it
  useEffect(() => {
    if (!open) return;
    const i = field.current;
    if (!i) return;
    i.focus();
    if (selectedFor !== s.opened) { selectedFor = s.opened; i.select(); } else i.setSelectionRange(i.value.length, i.value.length);
  }, [open, s.opened]);

  const partIds = useMemo(() => new Set(partsOfDoc(entry).parts.map((p) => p.id)), [entry]);
  const go = (h: Hit) => {
    setSearchCur(h.key);
    if (h.entryId === entry.id) return;
    const to = getJournalEntry(h.entryId);
    if (!to) return;
    if (partIds.has(h.entryId)) { navigate(routeForEntry(to)); return; }
    navigate(routeForEntry(to), { state: { fromBoardId: entry.id, fromBoardTitle: firstLine(entry.text ?? '').trim() || t('reorgUntitled') } });
  };
  const step = (dir: 1 | -1) => {
    const list = found.here;
    if (!list.length) return;
    const at = cur ? list.findIndex((h) => h.key === cur.key) : -1;
    go(at === -1 ? list[dir > 0 ? 0 : list.length - 1] : list[(at + dir + list.length) % list.length]);
  };
  const widen: Reach | null = found.reach === 'doc' ? (found.project != null ? 'project' : 'all') : found.reach === 'project' ? 'all' : null;
  const count = found.reach === 'doc' ? fill(t('reorgSearchInDoc'), { n: found.total })
    : found.reach === 'project' ? fill(t('reorgSearchInProject'), { n: found.total, project: nameOf(found.project) }) : fill(t('reorgSearchEverywhere'), { n: found.total });
  const words = s.q.trim();
  const quiet = words.length === 1 ? t('reorgSearchTwo') : !found.q ? `${t('reorgSearchType')} ${t(LINE_WORD[found.reach])}.` : !found.total ? fill(t('reorgSearchNone'), { q: found.q }) : null;

  const head = (g: HitGroup): string => {
    if (g.kind === 'top') return `${nameOf(g.id === 'unfiled' ? null : g.id)} · ${g.n}`;
    if (g.kind === 'part') return `${fill(t('reorgSearchPart'), { n: g.name })} · ${g.n}`;
    const name = g.name || t('reorgUntitled');
    return `${fill(t(g.kind === 'board' ? 'reorgSearchBoardHead' : 'reorgSearchDocHead'), { name })} · ${g.n}`;
  };
  const rowsOf = (g: HitGroup): { rows: Hit[]; more: number } => {
    if (g.kind !== 'doc' || s.more[g.id] || g.rows.length <= 2) return { rows: g.rows, more: 0 };
    const first = cur && g.rows.indexOf(cur) > 1 ? [cur] : [];
    return { rows: [...first, ...g.rows.filter((h) => !first.includes(h))].slice(0, 2), more: g.rows.length - 2 };
  };

  return (
    <section className="reorg-search" data-search-menu aria-label={t('reorgSearch')}>
      <div className="reorg-search-top">
        <button type="button" className="reorg-search-back" data-search-back onClick={() => closeSearch()}>{fill(t('reorgSearchBack'), { where: backWord ?? t('reorgSearchClose') })}</button>
        <span className="reorg-search-title">{t('reorgSearch')}</span>
      </div>
      <label className="reorg-search-field">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <input ref={field} type="text" data-search-q autoComplete="off" aria-label={t('reorgSearch')} placeholder={t('reorgSearch')} value={s.q}
          onChange={(e) => setSearchQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
            else if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
          }} />
        <span className="reorg-search-count" data-search-count>{found.q ? count : ''}</span>
      </label>
      <div className="reorg-search-scopes" role="group" aria-label={t('reorgSearchReachLabel')}>
        {REACHES.map((r) => (
          <button key={r} type="button" data-search-reach={r} aria-pressed={found.reach === r} disabled={r === 'project' && found.project == null}
            title={r === 'project' && found.project == null ? t('reorgSearchNoProject') : undefined} onClick={() => setSearchReach(r)}>{t(REACH_WORD[r])}</button>
        ))}
      </div>
      <div className="reorg-search-body">
        {quiet != null && <div className="reorg-search-quiet" data-search-line>{quiet}</div>}
        {found.groups.map((g) => {
          const { rows, more } = rowsOf(g);
          return (
            <div key={`${g.kind}-${g.id}`} className={`reorg-search-group${g.kind === 'top' ? ' is-top' : ''}`}>
              <div className="reorg-search-head" data-search-group={g.id} data-group-n={g.n} data-group-top={g.kind === 'top' ? 'true' : 'false'}>{head(g)}</div>
              {rows.map((h) => {
                const [before, word, after] = snippet(h.text, h.at, h.len);
                const here = !!cur && cur.key === h.key;
                return (
                  <button key={h.key} type="button" className="reorg-search-hit" data-search-hit data-hit-entry={h.entryId} data-hit-at={h.at} aria-current={here ? 'true' : undefined}
                    onClick={() => go(h)}>
                    {before}<mark>{word}</mark>{after}
                  </button>
                );
              })}
              {more > 0 && <button type="button" className="reorg-search-more" data-search-more onClick={() => openMore(g.id)}>{fill(t('reorgSearchMore'), { n: more })}</button>}
            </div>
          );
        })}
        {found.q && widen && (
          <button type="button" className="reorg-search-widen" data-search-widen onClick={() => setSearchReach(widen)}>{fill(t('reorgSearchWiden'), { reach: t(REACH_WORD[widen]) })}</button>
        )}
      </div>
    </section>
  );
}
