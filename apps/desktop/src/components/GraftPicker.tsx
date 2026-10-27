import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { subscribe } from '../store/persistence';
import { getBoardActions } from '../store/boardSelection';
import { graftTo, isGrafted, searchGraftables, type GraftRow, type GraftSubject } from '../store/grafts';
import { placeThis, searchSteps } from '../store/writePlace';
import type { Box } from '../types';

// BIG PROJECTS STEP 3 (3b, 3d) - "+ Graft...": the picker (Nick's approved mockup, cursor/graft-doors-mockup @ c4f34eb0, frames graft-picker-page,
// graft-picker-board, picker-came-from). A search field, then Cards / Pages / Boards from ANY place, and a check mark on anything already grafted.
// RULING (Fable, Oct 21): a place label appears ONLY on a row from another Drawer or the Journal - a row from the subject's own place has none. A press on an unchecked row grafts it (store/grafts.ts graftTo: a page_links record owned by the subject, or - a
// card on the same board - a connection box made through the board); a press on a checked row does nothing (Q10: the X in the list is the only way
// to ungraft). "Came from <surface>" is the top row only when the page was just opened from a surface (the router state the Back chip reads):
// an offered row like any other - nothing is written when the page opens.
// An OVERLAY portalled to <body> and anchored under the "+ Graft..." control: it displaces nothing (page primacy). Esc or a press outside closes it.
// W2: `boxId` makes "Came from" a STEP ("Three-Act · Midpoint": a page born by "Write this" came from that card, and is already placed on it, so the row shows checked).
export interface CameFrom { entryId: string; title: string; boxId?: string }

// `boxes`: the open board's LIVE boxes (the editor's own, ahead of its autosave), handed down by the Grafts pane that already reads the board's snapshot.
// `beforePick`: on a brand-new page, the pane's birth of the page (ruling, Oct 21: a pick CREATES the page) - run before the graft is written.
// W2 - `mode`: 'all' is the Grafts "+ Graft..." picker (Cards / Pages / Boards); 'pages' is "Place a page..." (the same picker filtered to PAGES; "Came from" still first); 'steps' is the page's "Place this..." (the Decks' steps, as "Deck · Step"
// rows; a press places THIS page on that step). `title` is the door's own word. `onPicked` runs after a press that made a graft, so the opener can redraw (a card kindles).
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

  // `wz-tutor-zone` (ledger 131): the picker is portalled to <body>, so without the drawer's own marker class a keystroke in its search reads to
  // the Tutor drawer as "the writer resumed writing" and CLOSES the Grafts panel under it. With the marker it is part of the drawer's zone - the
  // mechanism Tutor.tsx's keydown listener already uses for both of its anchors.
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
