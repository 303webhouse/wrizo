import { useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent, ReactNode } from 'react';
import type { GraftRow, GraftTarget } from '../../store/grafts';
import type { DeskTermId } from '../../store/deskLexicon';
import type { AssetGroup, AssetItem } from './assetGroups';
import { writeAssetDrag } from '../assetConnect';

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
}

export function AssetGroups({ groups, t, kindWord, besideOffered, besideNote, onRemove, onHide, onBeside, onOpenBoard, parts, onToPart }: Props): ReactNode {
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
  const beside = (entryId: string, boxId: string | undefined, title: string) => besideOffered && (
    <button type="button" className="wz-graft-dock wz-back-beside" data-back-beside="" disabled={!!besideNote} title={besideNote ?? undefined}
      aria-label={`${t('reorgSplitOpen')}: ${title}`} onClick={() => onBeside(entryId, boxId)}>{t('reorgSplitOpen')}</button>
  );
  const row = (it: AssetItem) => {
    const r = it.row;
    const asset: GraftTarget = r.boxId ? { entryId: r.entryId, boxId: r.boxId } : { entryId: r.entryId };
    return (
      <li key={it.key} className="wz-links-item wz-graft-row wz-back-asset" data-back-asset={it.key} data-asset-kind={it.kind} draggable onDragStart={dragFrom(asset)}
        data-link-via={r.via ?? (it.hideId ? 'plan' : undefined)} data-trashed={r.trashed ? 'true' : 'false'}
        data-graft-entry={r.entryId} {...(r.boxId ? { 'data-graft-box': r.boxId } : {})}>
        <span className={`wz-links-thumb wz-links-thumb--${it.kind === 'source' ? 'page' : it.kind}`} aria-hidden="true" />
        <span className="wz-links-label wz-graft-title" title={kindWord(it.kind)}>{r.title}</span>
        <span className="wz-back-asset-kind">{kindWord(it.kind)}</span>
        {r.placeDiffers && r.place && <span className="wz-graft-place">{r.place}</span>}
        {beside(r.entryId, r.boxId, r.title)}
        {toPart(`a:${it.key}`, asset, r.title)}
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
              <span className="wz-back-boardname" data-back-board-name="">{grp.own ? `${t('reorgAssetsOwnBoard')} · ${grp.title}` : grp.title}</span>
              {beside(grp.boardId as string, undefined, grp.title)}
              {toPart(`b:${grp.key}`, { entryId: grp.boardId as string }, grp.title)}
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
