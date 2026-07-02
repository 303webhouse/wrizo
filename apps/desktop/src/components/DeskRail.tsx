import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWritingSession } from './WritingSession';
import { useCatch } from './useCatch';

// Writing-screen redesign (Slice 2) — the slim left rail of desk-area LOCATIONS,
// replacing D1/D2's top-bar nav. Global nav and a WritingSession reader: it
// carries the dissolve class, so a keystroke recedes it with the rest of the
// navigation layer (edge / Esc / tap-off summons it back). Library is greyed
// (stub for later); the rest are live. On the Desk (its own full-screen world)
// the rail sits behind the overlay, exactly as the old header nav did.

interface RailItem { key: string; label: string; glyph: string; to: string; live: boolean }
const ITEMS: RailItem[] = [
  { key: 'journal', label: 'Journal', glyph: '❧', to: '/journal', live: true },
  { key: 'shelf', label: 'Shelf', glyph: '▤', to: '/shelf', live: true },
  { key: 'drawers', label: 'Drawers', glyph: '▥', to: '/drawers', live: true },
  { key: 'library', label: 'Library', glyph: '▣', to: '/library', live: false },
];

export function DeskRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isWriting } = useWritingSession();
  const doCatch = useCatch();

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
        return (
          <button
            key={it.key}
            type="button"
            className={`desk-rail-item${active ? ' active' : ''}${it.live ? '' : ' deferred'}`}
            aria-current={active ? 'page' : undefined}
            aria-disabled={!it.live}
            title={it.live ? it.label : `${it.label} — coming soon`}
            onClick={() => { if (it.live) navigate(it.to); }}
          >
            <span className="desk-rail-glyph" aria-hidden="true">{it.glyph}</span>
            <span className="desk-rail-label">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
