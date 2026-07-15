import { useNavigate } from 'react-router-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { getJournalPages, getShelfPages, getDrawerFiledPages } from '../store/persistence';
import { firstLine } from '../store/entryText';
import type { JournalEntry } from '../types';

// AB3 S6 — the Places faces: Journal, Shelf, and Drawers open as drawer
// faces while a page is mounted (rather than leaving the rail). Guardrails
// are law (enforced by the caller, Drawer.tsx): a keystroke dissolves the
// face back to the room; faces run one level deep (this is the only list —
// no per-item drill-down); no counts, no badges, no orange at rest (the
// active nav pull wears --accent-rest, never brass — see index.css).
export type PlaceKind = 'journal' | 'shelf' | 'drawers';

const ROOM_ROUTE: Record<PlaceKind, string> = {
  journal: '/journal',
  shelf: '/shelf',
  drawers: '/drawers',
};

function itemsFor(place: PlaceKind): JournalEntry[] {
  if (place === 'journal') return getJournalPages();
  if (place === 'shelf') return getShelfPages();
  return getDrawerFiledPages();
}

// Open (travel): an untyped page reads at /journal/:id (JournalEntry owns
// every pageType-less page); a typed page (manuscript/board/script/support)
// reads at /page/:id (PageEditor and its delegates) — the SAME split every
// other list in the app already uses (Shelf.tsx's own shelf-open button).
function routeFor(entry: JournalEntry): string {
  return entry.pageType != null ? `/page/${entry.id}` : `/journal/${entry.id}`;
}

function itemTitle(entry: JournalEntry): string {
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  if (!entry.text.trim()) return hasInk ? 'A sketch' : 'Untitled';
  return firstLine(entry.text).slice(0, 60);
}

export function PlaceFace({ place, onFileSend }: { place: PlaceKind; onFileSend: (entryId: string) => void }) {
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  const items = itemsFor(place);

  return (
    <div className="wz-placeface" data-place={place}>
      <div className="wz-placeface-list">
        {items.length === 0 && <div className="wz-placeface-empty">{t('placeFaceEmpty')}</div>}
        {items.map(entry => (
          <div key={entry.id} className="wz-placeface-item">
            <span className="wz-placeface-item-title">{itemTitle(entry)}</span>
            <span className="wz-placeface-item-verbs">
              <button
                type="button"
                className="wz-placeface-verb wz-placeface-verb-open"
                onClick={() => navigate(routeFor(entry))}
              >
                {t('placeFaceOpen')}
              </button>
              <button
                type="button"
                className="wz-placeface-verb wz-placeface-verb-file"
                onClick={() => onFileSend(entry.id)}
              >
                {t('placeFaceFileSend')}
              </button>
              {/* AB4's open-beside — a stub, "disabled-quiet with no greyed
                  ceremony" (no native `disabled`, so no browser greying;
                  aria-disabled + a no-op click communicate inertness). */}
              <button
                type="button"
                className="wz-placeface-verb wz-placeface-verb-peek"
                aria-disabled="true"
                title={t('placeFacePeekSoon')}
                onClick={e => e.preventDefault()}
              >
                {t('placeFacePeek')}
              </button>
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="wz-placeface-room" onClick={() => navigate(ROOM_ROUTE[place])}>
        {t('placeFaceGoToRoom')}
      </button>
    </div>
  );
}
