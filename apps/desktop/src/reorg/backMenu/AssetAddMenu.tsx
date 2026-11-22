import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { DeskTermId } from '../../store/deskLexicon';
import { searchGraftables } from '../../store/grafts';

// THE ASSETS "+" (reorg-plan-v2 3b item 1; machina-team-b-revisions.md 1F: '"More" becomes "+", which opens the kinds she can connect: New Board ·
// Existing Board · New Doc · Existing Doc · Import'; Import stays out, a later bet). One "+" on the Assets head (the whole Doc) and one on each
// Part's head (that Part). New opens a new board or page, connected at its birth (store/unbornPage.ts `asset`); Existing opens a short list of
// boards or Docs to connect now, a check on each already connected (a press on a checked row does nothing). It draws inside the drawer, over the
// list, and never touches the page. Escape or a press outside closes it.

export type AddKind = 'new-board' | 'existing-board' | 'new-doc' | 'existing-doc';
const KINDS: ReadonlyArray<[AddKind, DeskTermId]> = [
  ['new-board', 'reorgAddNewBoard'], ['existing-board', 'reorgAddExistingBoard'], ['new-doc', 'reorgAddNewDoc'], ['existing-doc', 'reorgAddExistingDoc'],
];

export function AssetAddMenu({ target, label, t, subjectId, isPicked, onNew, onPick }: {
  /** 'doc' (the whole Doc) or a Part's id: its data attribute. */
  target: string;
  /** Its words, on hover and for a screen reader ("Add an Asset", "Add an Asset to Chapter one"). */
  label: string;
  t: (term: DeskTermId) => string;
  /** The entry the lists are read from (its place labels; a Part is never listed for itself). */
  subjectId: string;
  /** Whether this entry is already connected here (a check). */
  isPicked: (entryId: string) => boolean;
  onNew: (kind: 'board' | 'doc') => void;
  onPick: (entryId: string) => void;
}): ReactNode {
  const [stage, setStage] = useState<null | 'menu' | 'boards' | 'docs'>(null);
  const [query, setQuery] = useState('');
  const [, setTick] = useState(0);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const close = (refocus: boolean) => { setStage(null); setQuery(''); if (refocus) btnRef.current?.focus(); };
  useEffect(() => {
    if (!stage) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); } };
    const onDown = (e: PointerEvent) => { const n = e.target as Node | null; if (n && wrapRef.current?.contains(n)) return; close(false); };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onDown, true);
    return () => { window.removeEventListener('keydown', onKey, true); window.removeEventListener('pointerdown', onDown, true); };
  }, [stage]);   // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (kind: AddKind) => {
    if (kind === 'new-board' || kind === 'new-doc') { close(false); onNew(kind === 'new-board' ? 'board' : 'doc'); return; }
    setQuery('');
    setStage(kind === 'existing-board' ? 'boards' : 'docs');
  };
  const res = stage === 'boards' || stage === 'docs' ? searchGraftables(query, { entryId: subjectId }) : null;
  const rows = res ? (stage === 'boards' ? res.Boards : res.Pages) : [];
  const searchWord = stage === 'boards' ? t('reorgAddSearchBoards') : t('reorgAddSearchDocs');

  return (
    <span ref={wrapRef} className="wz-assets-add-wrap">
      <button ref={btnRef} type="button" className="wz-assets-add" data-assets-add={target} aria-label={label} title={label}
        aria-haspopup="true" aria-expanded={stage ? 'true' : 'false'} onClick={() => (stage ? close(false) : setStage('menu'))}>
        <span aria-hidden="true">+</span>
      </button>
      {stage === 'menu' && (
        <span className="wz-assets-add-pop" data-assets-add-menu="" role="menu" aria-label={t('reorgAddMenu')}>
          {KINDS.map(([kind, word], i) => (
            <button key={kind} type="button" role="menuitem" data-add-kind={kind} autoFocus={i === 0} onClick={() => choose(kind)}>{t(word)}</button>
          ))}
        </span>
      )}
      {(stage === 'boards' || stage === 'docs') && (
        <span className="wz-assets-add-pop wz-assets-picker" data-assets-picker={stage} role="dialog" aria-label={stage === 'boards' ? t('reorgAddExistingBoard') : t('reorgAddExistingDoc')}>
          <input className="wz-graft-search" data-assets-picker-search="" type="search" placeholder={searchWord} aria-label={searchWord} autoFocus
            value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          <span className="wz-assets-picker-body">
            {rows.length === 0 && <span className="wz-assets-picker-none">{t('reorgAddNone')}</span>}
            {rows.map((r) => {
              const on = isPicked(r.entryId);
              return (
                <button key={r.key} type="button" className="wz-graft-pick" role="menuitemcheckbox" data-assets-pick="" data-graft-entry={r.entryId} aria-checked={on ? 'true' : 'false'}
                  onClick={() => { if (!on) { onPick(r.entryId); setTick((n) => n + 1); } }}>
                  <span className={`wz-links-thumb wz-links-thumb--${stage === 'boards' ? 'board' : 'page'}`} aria-hidden="true" />
                  <span className="wz-graft-title">{r.title}</span>
                  {r.placeDiffers && r.place && <span className="wz-graft-place">{r.place}</span>}
                  <span className="wz-graft-ck" aria-hidden="true">{on ? '✓' : ''}</span>
                </button>
              );
            })}
          </span>
        </span>
      )}
    </span>
  );
}
