import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { subscribe } from '../store/persistence';
import { getBoardActions } from '../store/boardSelection';
import { graftTo, isGrafted, searchGraftables, type GraftRow, type GraftSubject } from '../store/grafts';
import { placeThis, searchSteps } from '../store/writePlace';
import type { Box } from '../types';

// + Graft: Cards / Pages / Boards from any place, a check on anything already grafted; a place label only on a row from another place; a press on a checked row does nothing (the X ungrafts); a body-portalled overlay [GraftPicker §1]
export interface CameFrom { entryId: string; title: string; boxId?: string }

// `boxes` are the open board's live boxes; `beforePick` births a brand-new page before the graft; `mode` filters the picker (all, pages, steps) [GraftPicker §2]
export type PickerMode = 'all' | 'pages' | 'steps';
export function GraftPicker({ subject, boxes, anchor, cameFrom, onClose, beforePick, mode = 'all', title, onPicked }: { subject: GraftSubject; boxes?: readonly Box[]; anchor: HTMLElement | null; cameFrom: CameFrom | null; onClose: () => void; beforePick?: () => void; mode?: PickerMode; title?: string; onPicked?: () => void }) {
  const { t } = useDeskLexicon();
  const [query, setQuery] = useState('');
  const [, setTick] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  useEffect(() => {
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); } };
    const onDown = (e: PointerEvent) => {
      const n = e.target as Node | null;
      if (n && (boxRef.current?.contains(n) || anchor?.contains(n))) return;
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onDown, true);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey, true); window.removeEventListener('pointerdown', onDown, true); };
  }, [anchor, onClose]);
  // anchored under the control, kept on screen (the mockup's own placement)
  useLayoutEffect(() => {
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const el = boxRef.current;
    const w = el ? el.offsetWidth : 300, h = el ? el.offsetHeight : 400;
    let left = Math.max(8, Math.round(a.left - 4)), top = Math.round(a.bottom + 6);
    if (top + h > window.innerHeight - 8) top = Math.max(40, window.innerHeight - 8 - h);
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - 8 - w);
    setPos({ left, top });
  }, [anchor]);

  const res = mode === 'steps' ? { Cards: searchSteps(query, subject.entryId), Pages: [] as GraftRow[], Boards: [] as GraftRow[] } : searchGraftables(query, subject, boxes, mode === 'pages' ? 'pages' : undefined);
  const pick = (r: { entryId: string; boxId?: string }) => {
    beforePick?.();
    const target = { entryId: r.entryId, ...(r.boxId ? { boxId: r.boxId } : {}) };
    const made = mode === 'steps' ? placeThis(subject.entryId, target) : graftTo(subject, target, boxes);
    if (made && made.made === 'connection') getBoardActions()?.addConnection(made.a, made.b);
    if (made) onPicked?.();
    setTick((n) => n + 1);
  };
  const cameTarget = cameFrom ? { entryId: cameFrom.entryId, ...(cameFrom.boxId ? { boxId: cameFrom.boxId } : {}) } : null;
  const cameChecked = cameTarget ? isGrafted(subject, cameTarget, boxes) : false;
  const groups: Array<[GraftRow['group'], GraftRow[], string]> = mode === 'steps'
    ? [['Cards', res.Cards, '']]
    : [['Cards', res.Cards, t('graftGroupCards')], ['Pages', res.Pages, t('graftGroupPages')], ['Boards', res.Boards, t('graftGroupBoards')]];
  const heading = title ?? t('graftAdd');
  const searchWord = mode === 'pages' ? t('graftPlaceSearchPages') : mode === 'steps' ? t('graftPlaceSearchSteps') : t('graftSearch');

  // the portalled picker carries wz-tutor-zone, so a keystroke in its search is the drawer's, not "the writer resumed writing" [GraftPicker §3]
  return createPortal(
    <div ref={boxRef} className="wz-graft-picker wz-tutor-zone" data-graft-picker="" data-graft-mode={mode} role="dialog" aria-label={heading}
      style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}>
      <div className="wz-graft-picker-h">{heading}</div>
      <input ref={inputRef} className="wz-graft-search" data-graft-search="" type="search" placeholder={searchWord} aria-label={searchWord}
        value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      <div className="wz-graft-picker-body">
        {cameFrom && (
          <button type="button" className="wz-graft-came" data-graft-came="" aria-checked={cameChecked ? 'true' : 'false'}
            onClick={() => { if (!cameChecked && cameTarget) pick(cameTarget); }}>
            <span className="wz-graft-from">{t('graftCameFrom')}</span>
            <span className="wz-graft-title">{cameFrom.title}</span>
            <span className="wz-graft-ck" aria-hidden="true">{cameChecked ? '✓' : ''}</span>
          </button>
        )}
        {groups.map(([g, rows, label]) => rows.length > 0 && (
          <div key={g} className="wz-graft-pickgroup" data-graft-pickgroup={g}>
            {label && <div className="wz-graft-gh">{label}</div>}
            {rows.map((r) => (
              <button key={r.key} type="button" className="wz-graft-pick" role="menuitemcheckbox" data-graft-pick="" data-graft-group={g}
                data-graft-entry={r.entryId} {...(r.boxId ? { 'data-graft-box': r.boxId } : {})} aria-checked={r.checked ? 'true' : 'false'}
                onClick={() => { if (!r.checked) pick(r); }}>
                <span className={`wz-links-thumb wz-links-thumb--${g === 'Cards' ? 'card' : g === 'Boards' ? 'board' : 'page'}`} aria-hidden="true" />
                <span className="wz-graft-title">{r.title}</span>
                {r.placeDiffers && r.place && <span className="wz-graft-place">{r.place}</span>}
                <span className="wz-graft-ck" aria-hidden="true">{r.checked ? '✓' : ''}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
