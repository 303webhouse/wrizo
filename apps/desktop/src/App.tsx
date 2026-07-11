import { useEffect, useReducer, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Desk } from './pages/Desk';
import { DrawersPage } from './pages/Drawers';
import { Shelf } from './pages/Shelf';
import { DeskRail } from './components/DeskRail';
import { CreateProject } from './pages/CreateProject';
import { ProjectHome } from './pages/ProjectHome';
import { StructureWizard } from './pages/StructureWizard';
import { BeatWizard } from './pages/BeatWizard';
import { StructureBoard } from './pages/StructureBoard';
import { QuickSprint } from './pages/QuickSprint';
import { Journal } from './pages/Journal';
import { Spread } from './pages/Spread';
import { JournalEntry } from './pages/JournalEntry';
import { PageEditor } from './pages/PageEditor';
import { ImportDraft } from './pages/ImportDraft';
import { HomeFlow } from './components/HomeFlow';
import { VoiceWallWhisper } from './components/VoiceWallWhisper';
import { WritingSessionProvider, useWritingSession } from './components/WritingSession';
import { subscribe, resetLocalData } from './store/persistence';
import { apiMe, apiLogout, type AuthUser } from './store/api';
import { setCurrentUser } from './store/currentUser';
import { startSync, stopSync, syncOnce, clearLastSyncAt, subscribeSyncStatus, type SyncStatus } from './store/sync';

type AuthState = 'loading' | 'anon' | 'authed';

function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>('pending');
  useEffect(() => subscribeSyncStatus(setStatus), []);
  const label = status === 'synced' ? 'All changes saved' : status === 'pending' ? 'Saving…' : 'Offline — saved here';
  return <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{label}</span>;
}

// Full-screen toggle (Fullscreen API). Works on desktop + Android and goes
// truly immersive in the installed PWA. iOS Safari doesn't support element
// fullscreen, so the button hides itself there (the iOS path is Add to Home
// Screen → standalone display).
function FullscreenToggle() {
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

// The global App frame (CW4). A WritingSession consumer: during active writing it
// recedes with the same fade as the sprint chrome, so the whole frame drops below
// the attention threshold (P8) and "All changes saved" returns only at rest. The
// ember handle and the forgiving intent/idle restore (shared writing-mode state)
// bring it back together with the sprint chrome — one frame settling, not two.
function GlobalHeader({ onLogout }: { onLogout: () => void }) {
  const { isWriting } = useWritingSession();
  // Desk-area nav (Journal/Shelf/Drawers/Library) now lives in the left DeskRail;
  // the header keeps only the session controls.
  return (
    <div
      className="chrome-fade"
      data-chrome-receded={isWriting ? 'true' : 'false'}
      style={{
        position: 'fixed', top: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.5rem 0.75rem',
      }}
    >
      <FullscreenToggle />
      <SyncIndicator />
      <button
        type="button"
        onClick={onLogout}
        style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
      >
        Sign out
      </button>
    </div>
  );
}

// B4 — one logo element, opacity by surface. Bottom-right on every authed
// surface: FULL on the home (Writing Desk), faded elsewhere as a quiet watermark.
function BrandMark() {
  const { pathname } = useLocation();
  const home = pathname === '/';
  return <img className={`brand-mark${home ? ' home' : ''}`} src="/brand/wrizo-logo.png" alt="" aria-hidden="true" />;
}

export function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  // Re-render the routed tree when the adapter cache changes (e.g. a sync pull).
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribe(forceRender), []);

  useEffect(() => {
    let active = true;
    apiMe().then((user) => {
      if (!active) return;
      if (user) {
        setCurrentUser(user);
        setAuthState('authed');
        void startSync();
      } else {
        setAuthState('anon');
      }
    });
    return () => {
      active = false;
      stopSync();
    };
  }, []);

  const handleAuthed = (user: AuthUser) => {
    setCurrentUser(user);
    setAuthState('authed');
    void startSync();
  };

  const handleLogout = async () => {
    await syncOnce().catch(() => {}); // best-effort final push
    await apiLogout();
    stopSync();
    clearLastSyncAt();
    resetLocalData();
    setCurrentUser(null);
    setAuthState('anon');
  };

  if (authState === 'loading') {
    return <div className="page" style={{ paddingTop: '5rem', color: 'var(--color-text-muted)' }}>Loading…</div>;
  }

  if (authState === 'anon') {
    return <HomeFlow onAuthed={handleAuthed} />;
  }

  return (
    <WritingSessionProvider>
      <HashRouter>
        <DeskRail />
        <GlobalHeader onLogout={handleLogout} />
        <BrandMark />
        <VoiceWallWhisper />
        <div className="app-main">
        <Routes>
        <Route path="/" element={<Desk />} />
        <Route path="/drawers" element={<DrawersPage />} />
        <Route path="/shelf" element={<Shelf />} />
        <Route path="/project/new" element={<CreateProject />} />
        <Route path="/project/:id" element={<ProjectHome />} />
        <Route path="/project/:id/import" element={<ImportDraft />} />
        <Route path="/import" element={<ImportDraft />} />
        <Route path="/project/:id/sprint" element={<QuickSprint />} />
        <Route path="/project/:id/wizard" element={<StructureWizard />} />
        <Route path="/project/:id/beat" element={<BeatWizard />} />
        <Route path="/project/:id/board" element={<StructureBoard />} />
        <Route path="/sprint" element={<QuickSprint />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/spread" element={<Spread />} />
        <Route path="/journal/:id" element={<JournalEntry />} />
        <Route path="/page/:id" element={<PageEditor />} />
        </Routes>
        </div>
      </HashRouter>
    </WritingSessionProvider>
  );
}
