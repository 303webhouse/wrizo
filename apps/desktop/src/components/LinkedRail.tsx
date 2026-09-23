// ITEM 190 — zone 5's own content, §8's "B — THE RAIL SIDE" (TOOLS):
// "the Linked list (filter · sort · group-by-tag) · open (both popups) ·
// remove/unlink." This file owns that surface's SHAPE; §5's full behaviour
// (resting/selected states, the by-tag grouping law, double-click-opens-
// popup, remove-is-unlink) is NOT built here yet — it is blocked on PW's
// `store/anchors.ts` (`resolveAnchors`, `getLinksForPage`,
// `getLinksForAnchor`), the one module §8 names as the seam this lane
// reads and never writes through. Building the list's own logic against a
// module that doesn't exist yet would mean mocking past that seam, which
// §8's own hazard note forbids ("if B needs a write, it asks A for a
// function rather than reaching past the seam" — reading past an absent
// one is the same hazard in the other direction).
//
// What IS built here, and is real: the tab's own honest empty/waiting
// state, so zone 5 has a body the moment the switch is on, rather than a
// blank tab panel. Swapping in the real list touches only this file — the
// tab bar, the switch, and Tutor.tsx's own mount point are unaffected.
import { useDeskLexicon } from '../store/deskLexicon';

export function LinkedRailBody({ entryId: _entryId }: { entryId: string }) {
  const { t } = useDeskLexicon();
  return (
    <div className="wz-linked-rail" aria-label={t('zoneLinked')}>
      {/* PW's revised report (relayed by Fable, 2026-09-24): link targets
          are entries and cards only; kinds a writer sees are sources,
          pages, cards, boards and imported docs (images: a separate,
          later item — the app has no way to hold a writer's own images
          today). The rail reads every label — including tags — from the
          TARGET at display time, never from the link. None of that is
          wired yet; this line states the waiting state honestly rather
          than rendering an empty list that looks finished. */}
      {/* .wz-tutor-empty — the exact quiet empty-state look this panel
          already uses elsewhere (the Consistency/Structure lenses' own
          "nothing yet" rows), reused rather than a new class for one
          line. */}
      <div className="wz-tutor-empty">{t('zoneLinkedWaiting')}</div>
    </div>
  );
}
