import { useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent, ReactNode } from 'react';
import type { GraftRow, GraftTarget } from '../../store/grafts';
import type { DeskTermId } from '../../store/deskLexicon';
import type { AssetGroup, AssetItem } from './assetGroups';
import { writeAssetDrag } from '../assetConnect';
import { COLOUR_SLOTS, SLOT_WORD, slotLetter, type ColourSlot } from '../colourSlots';

/** A Part she can connect an asset to: the Doc's OTHER Parts, in her order, named as the Parts tab names them. */
export interface PartChoice { id: string; word: string }

// THE ASSETS TAB'S LIST (drawn by ConnectionsDrawerPanel under the reorg's `back` prop): one block per board, a head naming the board with its
// "Open the board" door, then the cards of it linked to this Page; then Pages linked directly. It owns no state and writes nothing: every act
// (remove a link, hide an own-board card, dock a linked card beside the page) is handed in, so today's undo line and its delete gate stay one thing.

interface Props {
  groups: readonly AssetGroup[];
  t: (term: DeskTermId) => string;
  kindWord: (kind: AssetItem['kind']) => string;
  /** Whether this page has a split screen at all (a prose page in Draft or Revise); false draws no button. */
  besideOffered: boolean;
  /** Why "Open beside" cannot be pressed right now (Free Writing; the Typewriter is on), as a sentence; null when it can. */
  besideNote: string | null;
  onRemove: (row: GraftRow) => void;
  onHide: (boxId: string, title: string) => void;
  onBeside: (entryId: string, boxId?: string) => void;
  onOpenBoard: (boardId: string) => void;
  /** AN ASSET ONTO A PART (reorg/assetConnect.ts): the Doc's other Parts for each row's "→ Part" (none: no button), and the act. Every row and
   *  board head is also a drag source the Parts tab takes. */
  parts: readonly PartChoice[];
  onToPart: (asset: GraftTarget, title: string, partId: string) => void;
  /** COLOURS ON ASSETS (reorg/assetColour.ts): each asset's slot (null: none), and the pick (null: "No colour"). The row draws the tag. */
  colourOf: (asset: GraftTarget) => ColourSlot | null;
  onColour: (asset: GraftTarget, slot: ColourSlot | null) => void;
}

export function AssetGroups({ groups, t, kindWord, besideOffered, besideNote, onRemove, onHide, onBeside, onOpenBoard, parts, onToPart, colourOf, onColour }: Props): ReactNode {
  // which row's "→ Part" list is open (one at a time); Escape closes it and gives the focus back to its button
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const btnRefs = useRef(new Map<string, HTMLButtonElement>());
  const closeMenu = (key: string) => { setMenuFor(null); btnRefs.current.get(key)?.focus(); };
  const dragFrom = (asset: GraftTarget) => (e: DragEvent) => { writeAssetDrag(e.dataTransfer, asset); };
  const toPart = (key: string, asset: GraftTarget, title: string) => parts.length > 0 && (
    <span className="wz-back-topart-wrap">
      <button type="button" className="wz-back-topart" data-to-part="" aria-haspopup="true" aria-expanded={menuFor === key ? 'true' : 'false'}
        aria-label={t('reorgToPartAria').replace('{title}', title)}
        ref={(el) => { if (el) btnRefs.current.set(key, el); else btnRefs.current.delete(key); }}
        onClick={() => setMenuFor((k) => (k === key ? null : key))}>{t('reorgToPart')}</button>
      {menuFor === key && (
        <span className="wz-back-topart-menu" data-to-part-menu="" role="group" aria-label={t('reorgToPartMenu')}
          onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(key); } }}>
          {parts.map((p, i) => (
            <button key={p.id} type="button" data-to-part-pick={p.id} autoFocus={i === 0}
              onClick={() => { setMenuFor(null); onToPart(asset, title, p.id); btnRefs.current.get(key)?.focus(); }}>{p.word}</button>
          ))}
        </span>
      )}
    </span>
  );
  // the tag: the letter first (the signal), the colour second; its name for a screen reader and on hover
  const tag = (s: ColourSlot) => <span className="wz-back-tag" data-colour-slot={s} title={t(SLOT_WORD[s])} aria-label={t(SLOT_WORD[s])}>{slotLetter(s)}</span>;
  const tagOf = (asset: GraftTarget) => { const s = colourOf(asset); return s ? tag(s) : null; };
  // "Colour": the six tags in order and "No colour"; the same one-open-at-a-time list as "→ Part" (key 'c:' + the row's key)
  const colour = (key: string, asset: GraftTarget, title: string) => {
    const k = `c:${key}`;
    const done = (s: ColourSlot | null) => { setMenuFor(null); onColour(asset, s); btnRefs.current.get(k)?.focus(); };
    return (
      <span className="wz-back-topart-wrap wz-back-colour-wrap">
        <button type="button" className="wz-back-topart wz-back-colour" data-asset-colour="" aria-haspopup="true" aria-expanded={menuFor === k ? 'true' : 'false'}
          aria-label={t('reorgColourAria').replace('{title}', title)}
          ref={(el) => { if (el) btnRefs.current.set(k, el); else btnRefs.current.delete(k); }}
          onClick={() => setMenuFor((m) => (m === k ? null : k))}>{t('reorgColour')}</button>
        {menuFor === k && (
          <span className="wz-back-topart-menu wz-back-colour-menu" data-asset-colour-menu="" role="group" aria-label={t('reorgColourMenu')}
            onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(k); } }}>
            {COLOUR_SLOTS.map((s, i) => (
              <button key={s} type="button" data-colour-pick={s} autoFocus={i === 0} aria-pressed={colourOf(asset) === s ? 'true' : 'false'} onClick={() => done(s)}>
                {tag(s)}<span className="wz-back-colour-name">{t(SLOT_WORD[s])}</span>
              </button>
            ))}
            <button type="button" data-colour-pick="" aria-pressed={colourOf(asset) === null ? 'true' : 'false'} onClick={() => done(null)}>{t('reorgColourNone')}</button>
          </span>
        )}
      </span>
    );
  };
  // THE TEAM B RESTYLE (slice 3, 1G): the broad kinds as icons (a Doc, a Board, a Card, which Machina calls a Block; a source reads as a Doc), the
  // word on hover and for a screen reader. No Graphic icon: there are no pictures yet.
  const kindIcon = (kind: AssetItem['kind'], word: string) => {
    const k = kind === 'source' ? 'page' : kind;
    return (
      <span className="wz-back-asset-kind" data-kind-icon={k} title={word}>
        <svg className="wz-back-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          {k === 'page' && <><path d="M3.5 1.5h6l3 3v10h-9z" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M5.5 7.5h5M5.5 10h5" stroke="currentColor" strokeWidth="1.2" /></>}
          {k === 'board' && <><rect x="1.5" y="2.5" width="13" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" /><rect x="4" y="5" width="3.5" height="3" fill="currentColor" /><rect x="9" y="8" width="3.5" height="3" fill="currentColor" /></>}
          {k === 'card' && <><rect x="2.5" y="4" width="11" height="8" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M4.5 7h7" stroke="currentColor" strokeWidth="1.2" /></>}
        </svg>
        <span className="wz-sr-only">{word}</span>
      </span>
    );
  };
  const beside = (entryId: string, boxId: string | undefined, title: string) => besideOffered && (
    // THE TEAM B RESTYLE (slice 3, 1F): an icon, a split screen with a ">" (it opens beside the page); its words on hover and for a screen reader
    <button type="button" className="wz-graft-dock wz-back-beside" data-back-beside="" disabled={!!besideNote} title={besideNote ?? t('reorgSplitOpen')}
      aria-label={`${t('reorgSplitOpen')}: ${title}`} onClick={() => onBeside(entryId, boxId)}>
      <svg className="wz-back-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        <rect x="1.5" y="2.5" width="13" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 2.5v11" stroke="currentColor" strokeWidth="1.2" /><path d="M10 6l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className="wz-sr-only">{t('reorgSplitOpen')}</span>
    </button>
  );
  const row = (it: AssetItem) => {
    const r = it.row;
    const asset: GraftTarget = r.boxId ? { entryId: r.entryId, boxId: r.boxId } : { entryId: r.entryId };
    return (
      <li key={it.key} className="wz-links-item wz-graft-row wz-back-asset" data-back-asset={it.key} data-asset-kind={it.kind} draggable onDragStart={dragFrom(asset)}
        data-link-via={r.via ?? (it.hideId ? 'plan' : undefined)} data-trashed={r.trashed ? 'true' : 'false'}
        data-graft-entry={r.entryId} {...(r.boxId ? { 'data-graft-box': r.boxId } : {})}>
        <span className={`wz-links-thumb wz-links-thumb--${it.kind === 'source' ? 'page' : it.kind}`} aria-hidden="true" />
        {tagOf(asset)}
        <span className="wz-links-label wz-graft-title" title={kindWord(it.kind)}>{r.title}</span>
        {kindIcon(it.kind, kindWord(it.kind))}
        {r.placeDiffers && r.place && <span className="wz-graft-place">{r.place}</span>}
        {beside(r.entryId, r.boxId, r.title)}
        {toPart(`a:${it.key}`, asset, r.title)}
        {colour(`a:${it.key}`, asset, r.title)}
        {it.hideId
          ? <button type="button" className="wz-links-x wz-graft-x" data-graft-hide="" aria-label={`${t('graftHideAria')}: ${r.title}`} onClick={() => onHide(it.hideId as string, r.title)}>×</button>
          : <button type="button" className="wz-links-x wz-graft-x" aria-label={`${t('linksRemoveAria')}: ${r.title}`} onClick={() => onRemove(r)}>×</button>}
      </li>
    );
  };
  return (
    <div className="wz-back-assets" data-back-assets="">
      {groups.map((grp) => {
        if (grp.kind === 'tags') {
          return (
            <div key={grp.key} className="wz-graft-group wz-back-group" data-graft-group="SharedTags" data-back-group="tags">
              <div className="wz-graft-gh">{t('graftSharedTags')}</div>
              <ul className="wz-links-list">
                {(grp.tags ?? []).map((r) => (
                  <li key={r.key} className="wz-graft-tagrow" data-graft-tag-entry={r.entryId}>
                    <span className="wz-graft-tagm">#{r.tag}</span>
                    <span className="wz-graft-title">{r.title}</span>
                    {r.placeDiffers && r.place && <span className="wz-graft-place">{r.place}</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        if (grp.kind === 'pages') {
          return (
            <div key={grp.key} className="wz-graft-group wz-back-group" data-back-group="pages">
              <div className="wz-graft-gh">{t('reorgAssetsLinkedDirectly')}</div>
              <ul className="wz-links-list" data-links-list="">{grp.items.map(row)}</ul>
            </div>
          );
        }
        return (
          <div key={grp.key} className="wz-graft-group wz-back-group" data-back-group="board" data-back-board={grp.boardId} data-back-own={grp.own ? 'true' : 'false'}>
            <div className="wz-graft-gh wz-back-boardhead" draggable onDragStart={dragFrom({ entryId: grp.boardId as string })}>
              {tagOf({ entryId: grp.boardId as string })}
              {kindIcon('board', kindWord('board'))}
              <span className="wz-back-boardname" data-back-board-name="">{grp.own ? `${t('reorgAssetsOwnBoard')} · ${grp.title}` : grp.title}</span>
              {beside(grp.boardId as string, undefined, grp.title)}
              {toPart(`b:${grp.key}`, { entryId: grp.boardId as string }, grp.title)}
              {colour(`b:${grp.key}`, { entryId: grp.boardId as string }, grp.title)}
              <button type="button" className="wz-back-openboard" data-back-open-board={grp.boardId} aria-label={`${t('reorgAssetsOpenBoard')}: ${grp.title}`}
                onClick={() => onOpenBoard(grp.boardId as string)}>{t('reorgAssetsOpenBoard')}</button>
              {grp.head && !grp.own && (
                <button type="button" className="wz-links-x wz-graft-x wz-back-headx" aria-label={`${t('linksRemoveAria')}: ${grp.title}`} onClick={() => onRemove(grp.head as GraftRow)}>×</button>
              )}
            </div>
            <ul className="wz-links-list" data-links-list="">{grp.items.map(row)}</ul>
          </div>
        );
      })}
    </div>
  );
}
