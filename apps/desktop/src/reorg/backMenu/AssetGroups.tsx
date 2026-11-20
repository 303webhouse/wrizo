import type { ReactNode } from 'react';
import type { GraftRow } from '../../store/grafts';
import type { DeskTermId } from '../../store/deskLexicon';
import type { AssetGroup, AssetItem } from './assetGroups';

// THE ASSETS TAB'S LIST (drawn by ConnectionsDrawerPanel under the reorg's `back` prop): one block per board, a head naming the board with its
// "Open the board" door, then the cards of it linked to this Page; then Pages linked directly. It owns no state and writes nothing: every act
// (remove a link, hide an own-board card, dock a linked card beside the page) is handed in, so today's undo line and its delete gate stay one thing.

interface Props {
  groups: readonly AssetGroup[];
  t: (term: DeskTermId) => string;
  kindWord: (kind: AssetItem['kind']) => string;
  /** Whether the page can dock a linked card or Doc beside it (not on a board). */
  canDock: boolean;
  onRemove: (row: GraftRow) => void;
  onHide: (boxId: string, title: string) => void;
  onDock: (row: GraftRow) => void;
  onOpenBoard: (boardId: string) => void;
}

export function AssetGroups({ groups, t, kindWord, canDock, onRemove, onHide, onDock, onOpenBoard }: Props): ReactNode {
  const row = (it: AssetItem) => {
    const r = it.row;
    return (
      <li key={it.key} className="wz-links-item wz-graft-row wz-back-asset" data-back-asset={it.key} data-asset-kind={it.kind}
        data-link-via={r.via ?? (it.hideId ? 'plan' : undefined)} data-trashed={r.trashed ? 'true' : 'false'}
        data-graft-entry={r.entryId} {...(r.boxId ? { 'data-graft-box': r.boxId } : {})}>
        <span className={`wz-links-thumb wz-links-thumb--${it.kind === 'source' ? 'page' : it.kind}`} aria-hidden="true" />
        <span className="wz-links-label wz-graft-title" title={kindWord(it.kind)}>{r.title}</span>
        <span className="wz-back-asset-kind">{kindWord(it.kind)}</span>
        {r.placeDiffers && r.place && <span className="wz-graft-place">{r.place}</span>}
        {canDock && it.kind !== 'board' && (
          <button type="button" className="wz-graft-dock" aria-label={`${t('graftDockAria')}: ${r.title}`} onClick={() => onDock(r)}>{t('graftDock')}</button>
        )}
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
            <div className="wz-graft-gh wz-back-boardhead">
              <span className="wz-back-boardname" data-back-board-name="">{grp.own ? `${t('reorgAssetsOwnBoard')} · ${grp.title}` : grp.title}</span>
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
