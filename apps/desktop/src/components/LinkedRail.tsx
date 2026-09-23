// ITEM 190 — zone 5's own content, §8's "B — THE RAIL SIDE" (TOOLS):
// "the Linked list (filter · sort · group-by-tag) · open (both popups) ·
// remove/unlink." Reads `store/anchors.ts` (PW's) through its own exported
// functions only — `pageConnections` for the resting-state list, `unlink`
// for remove — and never reaches past that seam into `PageLinks`'s stored
// shape directly (§8's own law: "B reads it and never writes through it").
//
// SCOPE, honestly bounded:
// - §5's SELECTED STATE ("click a linked span -> only its source(s)") is
//   not wired here. Detecting which span was clicked is the painted-mark
//   mechanism (§6c, `CSS.highlights`), PW's own side of §8's split, and
//   it isn't built on this branch yet. This file renders the RESTING
//   state only — "everything this page is connected to."
// - The 'page' vs 'source' vs 'imported doc' split Nick asked for has no
//   field to derive it from today (see `store/linkedRail.ts`'s own
//   `RailKind` comment for the full reasoning) — every non-board entry
//   target reports as 'page' here, not a guess at the finer three-way
//   split.
// - OPEN for a card target navigates to its board, not a card popup.
//   `BoardCardPopup` (components/BoardEditor.tsx) is a local, unexported
//   function there — reusing it means BoardEditor.tsx exporting it (or a
//   rail-appropriate preview of its own), which is out of this build's
//   own scope. Named here rather than silently degraded without saying so.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJournalEntry } from '../store/persistence';
import { pageConnections, unlink } from '../store/anchors';
import { resolveLink, sortRail, groupByTag, type RailSort, type ResolvedLink } from '../store/linkedRail';
import { routeForEntry } from '../store/routeForEntry';
import { useDeskLexicon } from '../store/deskLexicon';

const KIND_LABEL: Record<ResolvedLink['kind'], string> = {
  page: 'Page', board: 'Board', card: 'Card', note: 'Note',
};

function LinkedRailRow({ item, onOpen, onRemove }: { item: ResolvedLink; onOpen: () => void; onRemove: () => void }) {
  return (
    <div className="wz-linked-rail-item">
      <button type="button" className="wz-tutor-frag-item wz-linked-rail-item-open" onDoubleClick={onOpen} title={item.label}>
        <span className="wz-linked-rail-item-kind">{KIND_LABEL[item.kind]}</span>
        <span className="wz-linked-rail-item-label">{item.label}</span>
      </button>
      {/* §3/§5's own wording law: the control says which of the two things
          it does — "Remove this link", never a bare "Remove". Unlink only;
          the target and the anchor both survive (anchors.ts's own unlink,
          Nick's word). */}
      <button type="button" className="wz-tutor-dock-btn wz-linked-rail-item-remove" aria-label={`Remove this link — ${item.label}`} onClick={onRemove}>
        ×
      </button>
    </div>
  );
}

export function LinkedRailBody({ entryId }: { entryId: string }) {
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  const [sort, setSort] = useState<RailSort | 'tag'>('recency');
  // Bumped after every unlink to force a fresh read — this component does
  // not assume the Tutor's own `entry` prop re-renders on a link change
  // (it might not, depending on how far up the tree that prop is memoized),
  // so it re-reads the one page it owns directly instead of trusting that.
  const [tick, setTick] = useState(0);

  // `tick` is never read — `setTick` below exists only to force this
  // component to re-render, and the read on the next line is unmemoized,
  // so it picks up the fresh entry on every render regardless. Kept as a
  // real state value (not a ref) so the re-render is the thing React
  // itself schedules, not a side effect this file has to manage by hand.
  void tick;
  const entry = getJournalEntry(entryId);
  const resolved = entry ? pageConnections(entry.pageLinks).map(resolveLink) : [];

  const openTarget = (item: ResolvedLink) => {
    if (item.kind === 'page' || item.kind === 'board') {
      if (item.entry) navigate(routeForEntry(item.entry));
      return;
    }
    if (item.kind === 'card') {
      if (item.boardEntry) navigate(routeForEntry(item.boardEntry));
      return;
    }
    // 'note' — the writer's own words, already shown as the row's label;
    // nothing external to open.
  };

  const removeLink = (item: ResolvedLink) => {
    unlink(entryId, item.link.id);
    setTick(x => x + 1);
  };

  return (
    <div className="wz-linked-rail" aria-label={t('zoneLinked')}>
      {resolved.length === 0 ? (
        <div className="wz-tutor-empty">{t('zoneLinkedWaiting')}</div>
      ) : (
        <>
          {/* §5 — "sortable by recency, kind, and tag." Text-scale, matching
              the tab bar's own chrome one level up (Tutor.tsx's
              `.wz-tutor-tab`) rather than a third button style. */}
          <div className="wz-tutor-tabs wz-linked-rail-sort" role="tablist" aria-label={t('zoneLinkedSort')}>
            <button type="button" id="wz-linked-sort-recency" role="tab" aria-selected={sort === 'recency'} className={`wz-tutor-tab${sort === 'recency' ? ' active' : ''}`} onClick={() => setSort('recency')}>{t('zoneLinkedSortRecency')}</button>
            <button type="button" id="wz-linked-sort-kind" role="tab" aria-selected={sort === 'kind'} className={`wz-tutor-tab${sort === 'kind' ? ' active' : ''}`} onClick={() => setSort('kind')}>{t('zoneLinkedSortKind')}</button>
            <button type="button" id="wz-linked-sort-tag" role="tab" aria-selected={sort === 'tag'} className={`wz-tutor-tab${sort === 'tag' ? ' active' : ''}`} onClick={() => setSort('tag')}>{t('zoneLinkedSortTag')}</button>
          </div>

          {sort === 'tag' ? (
            groupByTag(resolved).length === 0
              ? <div className="wz-tutor-empty">{t('zoneLinkedNoTags')}</div>
              : groupByTag(resolved).map(group => (
                <div className="wz-tutor-section" key={group.tag}>
                  <div className="wz-tutor-h">{group.tag}</div>
                  {group.items.map(item => (
                    <LinkedRailRow key={item.link.id} item={item} onOpen={() => openTarget(item)} onRemove={() => removeLink(item)} />
                  ))}
                </div>
              ))
          ) : (
            <div className="wz-tutor-section">
              {sortRail(resolved, sort).map(item => (
                <LinkedRailRow key={item.link.id} item={item} onOpen={() => openTarget(item)} onRemove={() => removeLink(item)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
