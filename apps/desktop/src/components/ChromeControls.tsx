import { useEffect, useState } from 'react';
import { subscribeSyncStatus, type SyncStatus } from '../store/sync';

// CD2 S3 — SyncIndicator/FullscreenToggle, MOVED here verbatim from App.tsx
// (their original home) so BOTH App.tsx's own corner cluster AND the
// Cascade's Settings category panel (site-wide account/session settings,
// "what exists today — invent nothing") can mount the exact same two
// controls without a circular import: App.tsx renders JournalEntry/
// PageEditor/ScriptEditor, which mount components/Cascade.tsx, which needs
// these two components — importing them back FROM App.tsx would create
// App.tsx -> JournalEntry.tsx -> Cascade.tsx -> App.tsx. This shared,
// lower-level module breaks the cycle; behavior is byte-identical to the
// pre-CD2 versions, moved, not rewritten.

// AB1 S4 — "make 'saved' silent (only a save failure should speak)," the
// constitution's own words (the-desk-design.md Part 1: "Saving is assumed").
// 'synced' and 'pending' are the assumed-working states and now render
// nothing; only 'offline' (the closest this app has to a save failure —
// local data is fine, but the remote round-trip isn't happening) still
// speaks. Applied globally (not gated to DeskFrame) since it's a
// constitutional rule, not a frame-specific one, and only ever REMOVES a
// benign status string — no harness asserts its old always-on text.
export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>('pending');
  useEffect(() => subscribeSyncStatus(setStatus), []);
  if (status !== 'offline') return null;
  return <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Offline — saved here</span>;
}

// Full-screen toggle (Fullscreen API). Works on desktop + Android and goes
// truly immersive in the installed PWA. iOS Safari doesn't support element
// fullscreen, so the button hides itself there (the iOS path is Add to Home
// Screen → standalone display).
export function FullscreenToggle() {
  // Use the real Fullscreen API where available (desktop + Android Chrome). iOS
  // Safari doesn't support element fullscreen, so there it falls back to an in-app
  // immersive mode — hide the rail/header/watermark and fill the dynamic viewport
  // — so "full screen" still maximizes the page on mobile. (True OS fullscreen on
  // iOS Safari isn't possible from the web; Add-to-Home-Screen standalone is.)
  const [apiSupported] = useState(() => {
    if (typeof document === 'undefined') return false;
    const el = document.documentElement as any;
    return !!(el.requestFullscreen || el.webkitRequestFullscreen);
  });
  const [isFs, setIsFs] = useState(false);
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const doc = document as any;
      setIsFs(!!(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange as EventListener);
    };
  }, []);

  const toggle = () => {
    if (apiSupported) {
      const doc = document as any;
      const el = document.documentElement as any;
      const current = document.fullscreenElement || doc.webkitFullscreenElement;
      try {
        if (current) {
          const exit = document.exitFullscreen || doc.webkitExitFullscreen;
          if (exit) exit.call(document);
        } else {
          const req = el.requestFullscreen || el.webkitRequestFullscreen;
          const p = req && req.call(el);
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      } catch {
        // denied — never block the app
      }
    } else {
      // iOS / unsupported: in-app immersive maximize.
      setImmersive(v => {
        const next = !v;
        document.documentElement.classList.toggle('app-immersive', next);
        return next;
      });
    }
  };

  const active = apiSupported ? isFs : immersive;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? 'Exit full screen' : 'Enter full screen'}
      style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
    >
      {active ? 'Exit full screen' : 'Full screen'}
    </button>
  );
}
