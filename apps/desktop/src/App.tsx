import { useEffect, useReducer, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SessionLauncher } from './pages/SessionLauncher';
import { CreateProject } from './pages/CreateProject';
import { ProjectHome } from './pages/ProjectHome';
import { StructureWizard } from './pages/StructureWizard';
import { BeatWizard } from './pages/BeatWizard';
import { StructureBoard } from './pages/StructureBoard';
import { QuickSprint } from './pages/QuickSprint';
import { LoginScreen } from './components/LoginScreen';
import { subscribe, resetLocalData } from './store/persistence';
import { apiMe, apiLogout, type AuthUser } from './store/api';
import { startSync, stopSync, syncOnce, clearLastSyncAt, subscribeSyncStatus, type SyncStatus } from './store/sync';

type AuthState = 'loading' | 'anon' | 'authed';

function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>('pending');
  useEffect(() => subscribeSyncStatus(setStatus), []);
  const label = status === 'synced' ? 'All changes saved' : status === 'pending' ? 'Saving…' : 'Offline — saved here';
  return <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{label}</span>;
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

  const handleAuthed = (_user: AuthUser) => {
    setAuthState('authed');
    void startSync();
  };

  const handleLogout = async () => {
    await syncOnce().catch(() => {}); // best-effort final push
    await apiLogout();
    stopSync();
    clearLastSyncAt();
    resetLocalData();
    setAuthState('anon');
  };

  if (authState === 'loading') {
    return <div className="page" style={{ paddingTop: '5rem', color: 'var(--color-text-muted)' }}>Loading…</div>;
  }

  if (authState === 'anon') {
    return <LoginScreen onAuthed={handleAuthed} />;
  }

  return (
    <HashRouter>
      <div
        style={{
          position: 'fixed', top: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.5rem 0.75rem',
        }}
      >
        <SyncIndicator />
        <button
          type="button"
          onClick={handleLogout}
          style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Sign out
        </button>
      </div>
      <Routes>
        <Route path="/" element={<SessionLauncher />} />
        <Route path="/project/new" element={<CreateProject />} />
        <Route path="/project/:id" element={<ProjectHome />} />
        <Route path="/project/:id/sprint" element={<QuickSprint />} />
        <Route path="/project/:id/wizard" element={<StructureWizard />} />
        <Route path="/project/:id/beat" element={<BeatWizard />} />
        <Route path="/project/:id/board" element={<StructureBoard />} />
        <Route path="/sprint" element={<QuickSprint />} />
      </Routes>
    </HashRouter>
  );
}
