import { useEffect, useReducer, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Arrival } from './components/Arrival';
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
import { VoiceWallWhisper } from './components/VoiceWallWhisper';
import { ThemeEffectsLayer } from './components/ThemeEffectsLayer';
import { FluxBlockCaret } from './components/FluxBlockCaret';
import { WritingSessionProvider, useWritingSession } from './components/WritingSession';
import { subscribe, resetLocalData } from './store/persistence';
import { apiMe, apiLogout, type AuthUser } from './store/api';
import { setCurrentUser } from './store/currentUser';
import { startSync, stopSync, syncOnce, clearLastSyncAt } from './store/sync';
import { useDeskFrameMounted } from './store/deskFrameActive';
import { useFirstRunGateActive } from './store/firstRunGateActive';
import { onLogoutRequested } from './store/logoutRequest';
import { SyncIndicator, FullscreenToggle } from './components/ChromeControls';

// CD1 S4 — `.app-main`'s reserved gutter (index.css, historically
// `padding-left:64px` for DeskRail's fixed-position column) collapses
// exactly when DeskRail itself stops mounting (store/deskFrameActive.ts —
// the SAME "is a DeskFrame on screen" signal DeskRail.tsx now reads to
// return null). Reading the hook here, at the router's own top level, and
// writing it out as a data attribute keeps the two opposite-but-paired
// effects (rail disappears / gutter reclaimed) driven by ONE flag instead
// of two independently-derived booleans that could drift out of step.
function AppMain({ children }: { children: React.ReactNode }) {
  const deskFrameActive = useDeskFrameMounted();
  return (
    <div className="app-main" data-desk-frame-active={deskFrameActive ? 'true' : 'false'}>
      {children}
    </div>
  );
}

type AuthState = 'loading' | 'anon' | 'authed';

// The global App frame (CW4). A WritingSession consumer: during active writing it
// recedes with the same fade as the sprint chrome, so the whole frame drops below
// the attention threshold (P8) and "All changes saved" returns only at rest. The
// ember handle and the forgiving intent/idle restore (shared writing-mode state)
// bring it back together with the sprint chrome — one frame settling, not two.
function GlobalHeader({ onLogout, authed }: { onLogout: () => void; authed: boolean }) {
  const { isWriting } = useWritingSession();
  // AB1 S4 — "top-bar orphans collapse to one corner glyph + gear." While a
  // DeskFrame is mounted (store/deskFrameActive.ts), these three previously
  // independent controls collapse behind one glyph + popover instead of
  // sitting inline; every other route (Journal, Shelf, Drawers, QuickSprint,
  // any writing surface below the 1100px gate) renders exactly as it always
  // has — this flag is false there.
  const deskFrameActive = useDeskFrameMounted();
  // HB1 S3 — the veil's accessibility invariant covers every piece of
  // chrome, not just the component that renders it: while the first-run
  // gate holds, this corner cluster (including Sign out) goes away
  // entirely rather than merely collapsing, so there is exactly one
  // reachable control on the whole surface.
  const gateActive = useFirstRunGateActive();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { if (!deskFrameActive) setMenuOpen(false); }, [deskFrameActive]);

  if (gateActive) return null;

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
      {deskFrameActive ? (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="gh-corner-glyph"
            aria-label="Desk menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="gh-corner-menu" role="menu">
              <FullscreenToggle />
              <SyncIndicator />
              {authed && <button type="button" onClick={onLogout}>Sign out</button>}
            </div>
          )}
        </div>
      ) : (
        <>
          <FullscreenToggle />
          <SyncIndicator />
          {authed && (
            <button
              type="button"
              onClick={onLogout}
              style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign out
            </button>
          )}
        </>
      )}
    </div>
  );
}

// B4 — one logo element, opacity by surface: a faint bottom-right watermark
// everywhere. HB1 — absent at '/' now: Arrival mounts its own mark (the
// route's former "full on the home" variant retired with the Desk room it
// belonged to, per the AB1-era comment this one replaces).
function BrandMark() {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  return <img className="brand-mark" src="/brand/wrizo-logo.png" alt="" aria-hidden="true" />;
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

  // CD2 S3 — the Cascade's Settings category (deep inside a framed page host)
  // fires store/logoutRequest.ts's request instead of owning a second logout
  // sequence; this is the one subscriber, running the SAME handleLogout the
  // corner-cluster button already calls.
  useEffect(() => onLogoutRequested(() => { void handleLogout(); }), []);

  // HB1 — the router now mounts regardless of auth state. Arrival (route
  // '/') is both the boot screen and the front door: Write works local-first
  // with no account (F2), so there is no reason to gate the rest of the app
  // — Journal/Shelf/Drawers/Project all already operate on local data with
  // or without a session; only startSync() above is genuinely authed-only,
  // and that's untouched. This retires the old `authState === 'anon' →
  // HomeFlow` short-circuit and the plain-text loading screen — Arrival's
  // own boot bar (authState threaded through as a prop) carries both jobs
  // now, per Nick's ruling on the HomeFlow/Arrival overlap (see
  // components/Arrival.tsx's header comment).
  return (
    <WritingSessionProvider>
      <HashRouter>
        <DeskRail />
        <GlobalHeader onLogout={handleLogout} authed={authState === 'authed'} />
        <BrandMark />
        <VoiceWallWhisper />
        <ThemeEffectsLayer />
        <FluxBlockCaret />
        <AppMain>
        <Routes>
        <Route path="/" element={<Arrival authState={authState} onAuthed={handleAuthed} />} />
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
        </AppMain>
      </HashRouter>
    </WritingSessionProvider>
  );
}
