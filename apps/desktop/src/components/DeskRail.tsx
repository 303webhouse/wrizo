import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWritingSession } from './WritingSession';
import { useCatch } from './useCatch';
import { getWayBack, isWritingRoute, type WayBackSession } from '../store/wayBack';
import { getJournalEntry, getDraft } from '../store/persistence';
import { firstLine, snippet } from '../store/entryText';
import { useLexicon, type TermId } from '../store/themeLexicon';

// Writing-screen redesign (Slice 2) — the slim left rail of desk-area LOCATIONS,
// replacing D1/D2's top-bar nav. Global nav and a WritingSession reader: it
// carries the dissolve class, so a keystroke recedes it with the rest of the
// navigation layer (edge / Esc / tap-off summons it back). Library is greyed
// (stub for later); the rest are live. On the Desk (its own full-screen world)
// the rail sits behind the overlay, exactly as the old header nav did.

// TH1 Slice 1 — 'journal' and 'shelf' route through the lexicon's singular
// form; 'drawers' (R1 fold) through the plural form (tMany('drawer')) — the
// lexicon now carries both number forms, so the plural label sweeps too.
// 'library' isn't a canon §5 term at all (a separate future stub).
interface RailItem { key: string; term?: TermId; plural?: boolean; label: string; glyph: string; to: string; live: boolean }
const ITEMS: RailItem[] = [
  { key: 'journal', term: 'journal', label: 'Journal', glyph: '❧', to: '/journal', live: true },
  { key: 'shelf', term: 'shelf', label: 'Shelf', glyph: '▤', to: '/shelf', live: true },
  { key: 'drawers', term: 'drawer', plural: true, label: 'Drawers', glyph: '▥', to: '/drawers', live: true },
  { key: 'library', label: 'Library', glyph: '▣', to: '/library', live: false },
];

// W2 — resolve a way back's preview text across the two persistence shapes it
// can point at: a JournalEntry (PageEditor/JournalEntry surfaces) or a Draft
// (QuickSprint, which has no JournalEntry until a sprint finishes). Returns
// null if the underlying record no longer exists (or was soft-deleted) —
// the chip must never point at a dead entry.
function wayBackPreview(session: WayBackSession): string | null {
  const entry = getJournalEntry(session.entryId);
  if (entry) return entry.deletedAt ? null : snippet(firstLine(entry.text), 24);
  const draft = getDraft(session.entryId);
  return draft ? snippet(firstLine(draft.text), 24) : null;
}

export function DeskRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isWriting } = useWritingSession();
  const doCatch = useCatch();
  const { t: lex, tMany: lexMany } = useLexicon();

  // W2 — the return chip. Re-checked on every route change: a departure just
  // captured (or consumed) the slot as part of the same navigation, so
  // reading it fresh here on pathname change always reflects the current
  // truth. Never shown while already on a writing surface (departing FROM
  // one is the only way a way back exists) or once its entry is gone.
  const [wayBack, setWayBack] = useState<WayBackSession | null>(null);
  useEffect(() => {
    setWayBack(isWritingRoute(pathname) ? null : getWayBack());
  }, [pathname]);
  const wayBackLabel = wayBack ? wayBackPreview(wayBack) : null;

  // F3 Slice 3 — the `n` shortcut (Gmail-style). A single app-level listener,
  // active on every authed surface (the rail mounts once inside the router).
  // NEVER fires while an editable has focus or mid-IME-composition — a key that
  // types must never capture. Ctrl/Cmd+N is browser-reserved in the web build and
  // can't be intercepted, so a bare key on non-editing surfaces is the pattern.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'n' && e.key !== 'N') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      e.preventDefault();
      doCatch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doCatch]);

  return (
    <nav className="desk-rail chrome-fade" data-chrome-receded={isWriting ? 'true' : 'false'} aria-label="Desk areas">
      {wayBack && wayBackLabel && (
        <button
          type="button"
          className="desk-rail-item desk-rail-wayback"
          title={`Return to: ${wayBackLabel}`}
          aria-label={`Return to the ${lex('page').toLowerCase()}`}
          onClick={() => navigate(wayBack.route)}
        >
          <span className="desk-rail-glyph" aria-hidden="true">↩</span>
          <span className="desk-rail-label desk-rail-wayback-label">{wayBackLabel}</span>
        </button>
      )}
      <button
        type="button"
        className="desk-rail-item desk-rail-catch"
        title="Catch a thought (N)"
        onClick={doCatch}
      >
        <span className="desk-rail-glyph" aria-hidden="true">＋</span>
        <span className="desk-rail-label">Catch</span>
      </button>
      {ITEMS.map(it => {
        const active = pathname.startsWith(it.to);
        const label = it.term ? (it.plural ? lexMany(it.term) : lex(it.term)) : it.label;
        return (
          <button
            key={it.key}
            type="button"
            className={`desk-rail-item${active ? ' active' : ''}${it.live ? '' : ' deferred'}`}
            aria-current={active ? 'page' : undefined}
            aria-disabled={!it.live}
            title={it.live ? label : `${label} — coming soon`}
            onClick={() => { if (it.live) navigate(it.to); }}
          >
            <span className="desk-rail-glyph" aria-hidden="true">{it.glyph}</span>
            <span className="desk-rail-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
