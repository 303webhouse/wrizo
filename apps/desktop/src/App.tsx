import { useEffect, useReducer, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Arrival } from './components/Arrival';
import { DrawersPage } from './pages/Drawers';
import { DeskRail } from './components/DeskRail';
import { CreateProject } from './pages/CreateProject';
import { ProjectHome } from './pages/ProjectHome';
import { StructureWizard } from './pages/StructureWizard';
import { BeatWizard } from './pages/BeatWizard';
import { StructureBoard } from './pages/StructureBoard';
import { QuickSprint } from './pages/QuickSprint';
import { Spread } from './pages/Spread';
// FX14 S2 — JournalEntry no longer routed (the /journal/:id redirect below replaces
// it); the component + behavior-parity are J7's, so the file is left in place, unimported.
import { PageEditor, UnbornPage } from './pages/PageEditor';
import { ImportDraft } from './pages/ImportDraft';
import { VoiceWallWhisper } from './components/VoiceWallWhisper';
import { ThemeEffectsLayer } from './components/ThemeEffectsLayer';
import { Splash } from './components/Splash';
import { FluxBlockCaret } from './components/FluxBlockCaret';
import { WritingSessionProvider, useWritingSession } from './components/WritingSession';
import { subscribe, resetLocalData, getOrCreateSystemBoard, countDirtyRecords, getDirtyRecords } from './store/persistence';
import { apiMe, apiLogout, type AuthUser } from './store/api';
import { setCurrentUser } from './store/currentUser';
import { installBeforeUnloadGuard } from './store/beforeUnloadGuard';
import { startSync, stopSync, syncOnce, clearLastSyncAt, getRejectedRecords } from './store/sync';
import { useDeskFrameMounted } from './store/deskFrameActive';
import { useFirstRunGateActive } from './store/firstRunGateActive';
import { onLogoutRequested } from './store/logoutRequest';
import { showLogoutBlock, clearLogoutBlock, attemptSignOut, getSigningOut, setSigningOut, endServerSession, bootDecision } from './store/logoutGuard';
import { useSigningOut } from './store/useSigningOut';
import { flushAll } from './store/flushRegistry';
import { LogoutBlockedSheet } from './components/LogoutBlockedSheet';
import { StaleClientBanner } from './components/StaleClientBanner';
import { isSignedOutHere, markSignedOutHere, clearSignedOutHere } from './store/signedOutHere';
import { SyncIndicator, FullscreenToggle } from './components/ChromeControls';

// B1 S5 — the old Journal module surface (pages/Journal.tsx, the list/home
// experience) RETIRES here, the same day its replacement ships
// (retirement-by-replacement, never a hole): '/journal' now exists SOLELY
// to bridge every existing link/bookmark/typed-URL that still points at it
// to the Journal Board. Every caller in this codebase already navigates to
// the literal string '/journal' (DeskRail's own nav item, the cascade's
// "Open the Journal" button, Arrival's no-resume fallback, every writing
// surface's own "no project" backTo) — none of THOSE call sites change;
// only what this one route renders does, so legacy (<1100px) chrome stays
// byte-identical (DeskRail is untouched) and every door still works.
// find-or-create is idempotent (persistence.ts's own S1 guarantee), so
// landing here twice, from two different old links, always resolves to the
// SAME Board.
//
// A genuine defect found live while fixing this ticket's own harness suite
// (j5.mjs): JournalEntry.tsx's single-page "Add to…" MOVES verb carries its
// one-shot confirmation toast as router history state (`{ actionToast }`),
// consumed by whichever component mounts next at '/journal' — Journal.tsx
// used to read it; the Board never has. Passed through here (`state={
// location.state}`) so BoardEditor.tsx's own new one-shot consume (this
// ticket's own fix, mirroring Journal.tsx's exact retired pattern) still
// sees it after the bridge.
function JournalBoardGate() {
  const location = useLocation();
  const board = getOrCreateSystemBoard('journal');
  return <Navigate to={`/page/${board.id}`} replace state={location.state} />;
}

// B1 S4/S5 — the Trash Board's own stable, bookmark-able URL. Nothing pre-
// existing ever pointed here (the Trash didn't exist before B1), so this
// isn't a bridge like JournalBoardGate — it's a new door, reachable at any
// width via a typed/bookmarked URL even though the cascade's own "Open the
// Trash" button (its primary door, CascadePanels.tsx) is framed-only, the
// same way every cascade category already is. DeskRail (<1100px chrome)
// deliberately gains no matching item — the standing "legacy chrome stays
// byte-identical" law — so this route exists for direct navigation, not a
// second nav affordance.
function TrashBoardGate() {
  const board = getOrCreateSystemBoard('trash');
  return <Navigate to={`/page/${board.id}`} replace />;
}

// B2 S1/S3 — the Shelf Board's own stable, bookmark-able URL, the SAME
// bridge shape TrashBoardGate established (find-or-create, idempotent, no
// router state to carry through). '/shelf' pre-dates this ticket (the old
// pages/Shelf.tsx, the `shelved`-flag list — now RETIRED whole, S3's own
// mandate, since the Shelf is derived (T3) and never filed-into) — DeskRail
// (<1100px chrome) keeps its own unchanged 'shelf' nav item pointing at
// this SAME literal string, so legacy stays byte-identical and every old
// link/bookmark still resolves, exactly as JournalBoardGate proved for
// '/journal' in B1.
function ShelfBoardGate() {
  const board = getOrCreateSystemBoard('shelf');
  return <Navigate to={`/page/${board.id}`} replace />;
}

// FX14 S2 (SV6, ratified: "Journal Pages no longer exist. The Journal is now just a
// board that contains certain pages.") — the /journal/:id route retires to a
// PERMANENT redirect: every entry opens in THE Page interface now (routeForEntry
// returns /page/:id for all). Old links, resume paths, and muscle memory (any
// /journal/:id) all land right at /page/:id. The JournalEntry surface unmounts from
// routing; its component deletion + the behavior-parity work are J7's (accelerated,
// next after the P0 wave). The same bridge shape the system-board gates use.
function JournalIdRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/page/${id}`} replace />;
}

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
  const signingOut = useSigningOut();
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
              {authed && <button type="button" onClick={onLogout} disabled={signingOut}>{signingOut ? 'Signing out\u2026' : 'Sign out'}</button>}
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
              disabled={signingOut}
              style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {signingOut ? 'Signing out\u2026' : 'Sign out'}
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
// SIGNED OUT HERE (Nick, 2026-10-06) — a device that signed out goes to sign-in and stays there. Any route except
// the door itself, and the guest link (its token rides in the hash, so it must not be redirected away), is sent
// back to '/'. It waits for the boot check, so a signed-in device is never bounced.
function SignedOutRouteGuard({ authState }: { authState: AuthState }) {
  const { pathname } = useLocation();
  // 'loading' counts: with the flag set a load can only end 'anon' (bootDecision ends any surviving session), so
  // redirecting at once avoids a flash of the old route. A device that is authed is never bounced.
  if (authState === 'authed' || !isSignedOutHere()) return null;
  if (pathname === '/' || pathname === '/guest') return null;
  return <Navigate to="/" replace />;
}

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
  // STORAGE-FULL STEP 1 (Fable's byte review, item 3) — installed once for the whole session (App.tsx mounts
  // regardless of route or auth state), not tied to SyncIndicator's own mount, which the sync notice is rendered
  // from in more than one place. See beforeUnloadGuard.ts for the reasoning and the Electron exclusion.
  useEffect(() => installBeforeUnloadGuard(), []);

  useEffect(() => {
    let active = true;
    apiMe().then((user) => {
      if (!active) return;
      if (bootDecision(!!user, isSignedOutHere()) === 'end-session') {
        // A session left on a device that signed out (its server logout hung, or never ran): end it — capped, so a
        // hung server cannot keep boot on "loading" — and show the sign-in screen. The flag stays until a sign-in,
        // so every later load retries this if it still did not take.
        void endServerSession(apiLogout).then(() => setAuthState('anon'));
        return;
      }
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
    clearSignedOutHere();
    setCurrentUser(user);
    setAuthState('authed');
    void startSync();
  };

  // LOGOUT SAFETY — never wipe this device while the account is missing writing. One last push is tried; if ANY record
  // is still dirty (offline, pending, or rejected by the server) the sign-out is REFUSED: the session, the data and
  // the sync all stay, and the writer is told why. `force` is the second step, reached only through the sheet's
  // explicit confirm. The signed-out flag is set only on a completed sign-out.
  // `force` must be exactly true: a click event handed in by accident is truthy and would skip the safety.
  // THE TIME LIMIT — "Signing out…" shows at once and a second click is ignored while one is under way. The final
  // push is capped (LOGOUT_PUSH_CAP_MS, ~8 s): finished, failed or stalled, the decision is the unsaved count, so a
  // stalled push ends at the sheet and never signs out silently past unsaved work.
  const handleLogout = async (force: boolean = false) => {
    if (getSigningOut()) return;
    setSigningOut(true);
    try {
      // FLUSH, THEN DECIDE, THEN WIPE — on BOTH paths. Every editor's pending text moves into its record first, so the
      // unsaved count below sees it, and the unmount that follows the wipe has nothing left to write back.
      flushAll();
      if (force !== true) {
        const attempt = await attemptSignOut(() => syncOnce(), countDirtyRecords);
        if (attempt.kind === 'blocked') {
          // Names the records the account refused, and only those that are still unsaved.
          const dirtyIds = new Set(Object.values(getDirtyRecords()).flat().map((r) => (r as { id: string }).id));
          showLogoutBlock({
            count: attempt.count,
            rejectedTitles: getRejectedRecords().filter((r) => dirtyIds.has(r.id)).map((r) => r.title),
          });
          return;
        }
      }
      clearLogoutBlock();
      // Capped (~5 s): a hung server logout must not leave "Signing out…" up. On a timeout the sign-out finishes on
      // this device below, and the boot cleanup ends the server session on the next load.
      await endServerSession(apiLogout);
      // Mark first: even if the local reset below fails, this device stays on the sign-in screen.
      markSignedOutHere();
      window.location.hash = '#/';
      stopSync();
      clearLastSyncAt();
      resetLocalData();
      setCurrentUser(null);
      setAuthState('anon');
    } finally {
      setSigningOut(false);
    }
  };

  // CD2 S3 — the Cascade's Settings category (deep inside a framed page host)
  // fires store/logoutRequest.ts's request instead of owning a second logout
  // sequence; this is the one subscriber, running the SAME handleLogout the
  // corner-cluster button already calls.
  useEffect(() => onLogoutRequested((force) => { void handleLogout(force); }), []);

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
        <GlobalHeader onLogout={() => { void handleLogout(); }} authed={authState === 'authed'} />
        <BrandMark />
        {/* Item 187 — the splash. Mounted at app root rather than on a route:
            it belongs to the app OPENING, not to '/' (and Fable's ruling is
            every open, not first-run-only). It renders once per app load, is
            pointer-events:none throughout, and blurs whatever is genuinely
            mounted behind it — which at boot is Arrival, the Threshold. */}
        <Splash />
        <VoiceWallWhisper />
        <ThemeEffectsLayer />
        <FluxBlockCaret />
        <SignedOutRouteGuard authState={authState} />
        {/* LOGOUT SAFETY — an overlay beside the routes, never inside one: it cannot unmount the page. */}
        <LogoutBlockedSheet />
        {/* B10.1 - the stale-client banner: App level, every route and auth state; a portal, so it displaces nothing. */}
        <StaleClientBanner />
        <AppMain>
        <Routes>
        <Route path="/" element={<Arrival authState={authState} onAuthed={handleAuthed} />} />
        <Route path="/drawers" element={<DrawersPage />} />
        <Route path="/shelf" element={<ShelfBoardGate />} />
        <Route path="/project/new" element={<CreateProject />} />
        <Route path="/project/:id" element={<ProjectHome />} />
        <Route path="/project/:id/import" element={<ImportDraft />} />
        <Route path="/import" element={<ImportDraft />} />
        <Route path="/project/:id/sprint" element={<QuickSprint />} />
        <Route path="/project/:id/wizard" element={<StructureWizard />} />
        <Route path="/project/:id/beat" element={<BeatWizard />} />
        <Route path="/project/:id/board" element={<StructureBoard />} />
        <Route path="/sprint" element={<QuickSprint />} />
        <Route path="/journal" element={<JournalBoardGate />} />
        <Route path="/trash" element={<TrashBoardGate />} />
        <Route path="/journal/spread" element={<Spread />} />
        <Route path="/journal/:id" element={<JournalIdRedirect />} />
        {/* PB1 (item 71) — the unborn surface. Declared BEFORE /page/:id so the
            literal segment wins the match; a blank-surface door lands here
            with its descriptor in the query string and creates no row. */}
        <Route path="/page/new" element={<UnbornPage />} />
        <Route path="/page/:id" element={<PageEditor />} />
        </Routes>
        </AppMain>
      </HashRouter>
    </WritingSessionProvider>
  );
}
