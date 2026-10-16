import { useDeskLexicon } from '../store/deskLexicon';
import { useBoardSnapshot, getBoardActions } from '../store/boardSelection';
import { getLinkPeersOfCard, removePageLink, subscribe, type LinkPeer } from '../store/persistence';
import { requestDelete } from '../store/deleteGate';
import { useEffect, useState } from 'react';

// The right drawer's second pane - the GRAFTS tab (Flux: LINKS). Its name is the theme's word, read from the lexicon, never written here.
//
// CONNECTOR-B (Nick's approved connector mockup v6): with a board open and a card selected it lists that card's connected THUMBNAILS - every same-board connection and every page / board / card link
// (store/persistence.ts getLinkPeersOfCard: ONE union) - each with an X. The X asks first ("Remove graft?" / "Remove link?": the one dialog, without the "Don't ask me again" tick - an unlink is exempt from
// the asking setting and keeps its own confirm), then removes whichever record joins the pair: a connection box (through the board, which owns its own state) or a page-link tombstone.
// With no board open (a page), or no card selected, it is what it always was: the title and the quiet empty line.
export function ConnectionsDrawerPanel() {
  const { t } = useDeskLexicon();
  const snap = useBoardSnapshot();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);   // a link added or removed anywhere redraws the list

  const peers: LinkPeer[] = snap && snap.selectedId ? getLinkPeersOfCard(snap.boardId, snap.selectedId, snap.boxes) : [];
  const remove = (p: LinkPeer) => requestDelete(() => {
    if (p.via === 'card' && p.connId) getBoardActions()?.removeConnection(p.connId);
    else if (p.linkId) removePageLink(p.linkId);
  }, { title: t('linksRemoveTitle'), always: true, noDontAsk: true });
  const kindWord = (k: LinkPeer['kind']) => (k === 'page' ? t('linksKindPage') : k === 'board' ? t('linksKindBoard') : t('linksKindCard'));

  return (
    <div className="wz-links-pane" data-links-pane="">
      <div className="wz-tutor-h">{t('drawerLinks')}</div>
      {snap && !snap.selectedId && <div className="wz-tutor-empty" data-links-state="select">{t('linksSelectCard')}</div>}
      {snap && snap.selectedId && peers.length === 0 && <div className="wz-tutor-empty" data-links-state="none">{t('drawerLinksEmpty')}</div>}
      {!snap && <div className="wz-tutor-empty">{t('drawerLinksEmpty')}</div>}
      {peers.length > 0 && (
        <ul className="wz-links-list" data-links-list="">
          {peers.map((p) => (
            <li key={p.key} className="wz-links-item" data-link-key={p.key} data-link-via={p.via} data-link-kind={p.kind} data-trashed={p.trashed ? 'true' : 'false'}>
              <span className={`wz-links-thumb wz-links-thumb--${p.kind}`} aria-hidden="true" />
              <span className="wz-links-label" title={kindWord(p.kind)}>{p.label}</span>
              <button type="button" className="wz-links-x" aria-label={`${t('linksRemoveAria')}: ${p.label}`} onClick={() => remove(p)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
