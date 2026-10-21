import { useEffect, useRef } from 'react';
import { getCurrentUser } from '../store/currentUser';
import { isSignedOutHere } from '../store/signedOutHere';
import { firstPullDone, whenFirstPulled } from '../store/sync';
import { FIRST_PULL_CAP_MS } from '../store/firstRun';
import { ensureTopDrawer } from '../store/place';

// BIG PROJECTS 1a - TOP DRAWER, ONCE. A brand-new account gets a Drawer named Top Drawer and its one set, so there is always a "where you are".
// Mounted once beside the routes; renders nothing and owns no layout. It runs only after the FIRST WHOLE-ACCOUNT PULL has landed (otherwise a
// returning writer on a fresh device would look like a new account and be handed a second Top Drawer), never on a device that signed out here,
// and never when the first pull fails or never lands - the next boot tries again. ensureTopDrawer itself refuses for any account that has ever
// had a Drawer row (a deleted one and a delete-for-good shell both count) and writes ids that carry the user id, so two devices that bootstrap
// before they sync write the same rows.
//
// Test-only: scripts/runtime-verify.mjs serves index.html with window.__wrizoNoBootstrap set (its server double signs every boot in, and ~150
// harnesses seed their own accounts). Nothing in the product sets it; scripts/harness/big-projects-1a.mjs is the one scenario that leaves it off.
function switchedOff(): boolean {
  return (window as unknown as { __wrizoNoBootstrap?: boolean }).__wrizoNoBootstrap === true;
}

const POLL_MS = 2000;
const POLL_TRIES = 30;

export function PlaceBootstrap({ authState }: { authState: 'loading' | 'anon' | 'authed' }) {
  const started = useRef(false);
  useEffect(() => {
    if (authState !== 'authed' || started.current) return;
    if (switchedOff() || isSignedOutHere()) return;
    const user = getCurrentUser();
    if (!user) return;
    started.current = true;
    let cancelled = false;
    void (async () => {
      try { await whenFirstPulled(FIRST_PULL_CAP_MS); } catch { /* a failed wait is read below as "not pulled" */ }
      for (let i = 0; i < POLL_TRIES && !cancelled && !firstPullDone(); i += 1) await new Promise(r => setTimeout(r, POLL_MS));
      if (cancelled || !firstPullDone()) return;
      ensureTopDrawer(user.id);
    })();
    return () => { cancelled = true; started.current = false; };
  }, [authState]);
  return null;
}
