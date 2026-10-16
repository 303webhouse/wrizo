import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../store/currentUser';
import { isSignedOutHere } from '../store/signedOutHere';
import { accountHasWork } from '../store/persistence';
import { firstPullDone, whenFirstPulled } from '../store/sync';
import { resolveFirstRun, setFirstRunComplete, FIRST_PULL_CAP_MS } from '../store/firstRun';
import { setForwardLock } from '../store/forwardLock';
import { setWritingSettings } from '../store/writingSettings';
import { unbornHref } from '../store/unbornPage';
import { recordLastPlace, resolveLanding, type PlaceKind } from '../store/lastPlace';
import { useDeskFrameViewport } from './DeskFrame';

// RESUME ON OPEN (docs/plans/resume-on-open.md). Two jobs, one invisible component, mounted once beside the
// routes. It renders nothing and owns no layout.
//
//  1. THE RECORDER — remembers the Page or board the writer has OPEN (store/lastPlace.ts). It reads the address
//     itself on every render rather than useLocation: an unborn page is born by a history.replaceState that never
//     notifies the router (PB1), so the address is the only thing that always tells the truth. App re-renders on
//     every store change, which is exactly when a page is born.
//  2. THE LANDING — on the FIRST resolved boot only, a signed-in writer at the bare front-door address goes to the
//     last place instead of the door. No last place, or it was deleted/Trashed: a fresh blank Page in Free Write,
//     saved only once a word is typed (the Write door's own entry). Signed out here, anonymous, a deep link, or a
//     sign-in done at the door afterwards: untouched. Once per load, set AT the navigate, so the many
//     `<Navigate to="/">` bail-outs and the in-app Home links reach the front door afterwards, never a loop.
//
// NOT IN Splash.tsx (TOOLS owns it). The only coupling is the one that already exists: the splash waits on
// `authState`, and the front door stays hidden under `data-splash-hold`. This navigates the moment `authed` and the
// first pull allow, which is while the hold is still on, so the door never paints (the splash is the veil over the
// landed page). Waiting for the hold to end first would flash the door for a frame — a new ghost.

type AuthState = 'loading' | 'anon' | 'authed';

let bootResolved = false;   // the first non-loading authState has been seen (module-level: once per app load)
let landed = false;         // the landing has been spent (or ruled out) for this load

// Test-only: scripts/runtime-verify.mjs serves index.html with this set (its server double signs every boot in, and ~120
// harnesses start at the front door). Nothing in the product sets it; resume-on-open.mjs is the one scenario that leaves it off.
function landingSwitchedOff(): boolean {
  return (window as unknown as { __wrizoNoLanding?: boolean }).__wrizoNoLanding === true;
}

function atFrontDoor(): boolean {
  const h = window.location.hash;
  return h === '' || h === '#' || h === '#/';
}

function placeInAddress(): { kind: PlaceKind; id: string } | null {
  const m = /^#\/(page|project)\/([^/?#]+)/.exec(window.location.hash);
  return m ? { kind: m[1] as PlaceKind, id: decodeURIComponent(m[2]) } : null;
}

export function LandingGate({ authState }: { authState: AuthState }) {
  const navigate = useNavigate();
  const framed = useDeskFrameViewport();
  const framedRef = useRef(framed);
  framedRef.current = framed;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // 1. THE RECORDER — every render, cheap: the in-memory comparison inside recordLastPlace avoids a write per render.
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    const p = placeInAddress();
    if (p) recordLastPlace(user.id, p.kind, p.id);
  });

  // 2. THE LANDING — decided on the first resolved boot, and only then.
  useEffect(() => {
    if (authState === 'loading' || bootResolved) return;
    bootResolved = true;
    // Anonymous, or a device that signed out here: the front door stays. A sign-in done at the door LATER is the door's
    // own business (Arrival navigates itself), and bootResolved is already spent, so nothing here races it.
    if (landingSwitchedOff()) { landed = true; return; }
    if (authState !== 'authed' || isSignedOutHere()) { landed = true; return; }
    if (!atFrontDoor()) { landed = true; return; } // a deep link / reload on a page is already where it should be
    const user = getCurrentUser();
    if (!user) { landed = true; return; }
    void (async () => {
      // B10.1, as Open does it: a returning writer on a fresh cache must not be sent to "nothing yet" before their
      // pages arrive. Waits only when the cache is empty and the pull has not landed; capped.
      if (!firstPullDone() && !accountHasWork()) await whenFirstPulled(FIRST_PULL_CAP_MS);
      // The writer got somewhere on their own while we waited (Open, Write, a link): theirs wins.
      if (landed || !atFrontDoor() || isSignedOutHere()) { landed = true; return; }
      const dest = resolveLanding(user.id);
      landed = true;
      if (dest.kind === 'route') {
        navigateRef.current(dest.route, { replace: true, state: { warmStart: true } });
        return;
      }
      // The blank Page: EXACTLY the Write door's entry (components/Arrival.tsx writeDoor) — a loose page, Free Write,
      // no row until the first word. The first-run forced defaults ride along for a brand-new account.
      const firstRun = await resolveFirstRun();
      if (firstRun) {
        setForwardLock(true);
        setWritingSettings({ typewriter: true });
        if (!framedRef.current) setFirstRunComplete(true);
      }
      if (!atFrontDoor()) return;
      navigateRef.current(unbornHref({ origin: 'loose' }), { replace: true, ...(firstRun ? { state: { firstRunGate: true } } : {}) });
    })();
    // No cleanup on purpose: StrictMode runs this effect twice in dev, and bootResolved already makes the second run
    // a no-op, so cancelling the first would cancel the only landing. The guards after the await (landed, atFrontDoor)
    // are what yield to a writer who got somewhere on their own.
  }, [authState]);

  return null;
}

// Test seam: lets a harness reload-free reset the once-per-load latches. Never read by app code.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoLandingState?: unknown }).wrizoLandingState = () => ({ bootResolved, landed });
}
