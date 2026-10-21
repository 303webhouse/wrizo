import { useCallback, useState } from 'react';
import { NUDGE_POOL } from '../store/idleNudges';
import { getCurrentUser } from '../store/currentUser';

// F6 — the first-line invitation (opt-in). FX15 (the Quiet Page): the invitation
// SLEEPS by default. A fresh page says nothing until the writer asks — no affordance,
// no prompt, no chrome. The deck survives; only the unbidden OFFER retires. The writer
// reaches it ON REQUEST: `optIn()` is exposed for the page's on-request callers — BG1's
// "Sprout" door is the spark deck, which IS this same first-line-invite mechanism — and
// turns the invitation ON (a device-local pref, SCOPED per account — see
// SPROUT-INVITE-SCOPE below). Once on, one quiet prompt in the permission-giving
// register invites a first line to push against — never text that writes itself —
// with a permanent "don't offer again". Three prefs (no schema, no sync — an
// invitation preference isn't worth a collection): 'off' (the default — silent), 'on'
// (opted in — the prompt shows on an empty page), 'never' (withdrawn — permanent).
// 'off' and 'never' both render nothing.
//
// Render-only: the node is a sibling ABOVE/OUTSIDE the editable DOM (the warm-start
// pattern), never selectable/serialized — saved bytes are identical whether it showed
// or not, and it can never become the writer's text (no accept, no tab-fill, no
// insertion — A13). The prompt is drawn from the local NUDGE_POOL (deck-drawn, never
// model-drawn — no send on page load, ever). The first keystroke dismisses it for this
// page via the SAME onForward/noteWrite seam warm-start + TTFK use; the pref is
// untouched — the writer's ink always wins the space.
//
// SPROUT-INVITE-SCOPE (the page-readiness survey's item 1, Oct 21) — THE ACTUAL BUG: this
// pref used to live behind ONE bare device-wide key, so on a shared device Account A's
// opt-in (or permanent "don't offer again") silently governed Account B's first blank
// page too, the moment B signed in. `prefKeyFor` below suffixes the key with the signed-
// in writer's own id (`:<userId>`); signed out (local-first, no account) keeps the bare
// key exactly as before — there is only one writer on the device in that case, so nothing
// to scope against. `migrateToScopedKey` does a ONE-TIME move of whatever the bare key
// already held onto the FIRST account that ever signs in after this ships (consuming the
// bare key, so nobody after that first account inherits it) — the same
// "existing stored value governs" principle FX16's own `migrateStaleOn` already uses.
export const PREF_KEY_BASE = 'wrizo-first-line-invite'; // matches the mode-memory localStorage pattern
export const MIGRATED_KEY = 'wrizo-first-line-invite-migrated'; // FX16 — one-time retirement of the pre-FX15 'on'
type InvitePref = 'off' | 'on' | 'never';

// Exported (not just module-private) so a browserless harness can bundle this file and prove
// the scoping/migration logic directly, without rendering the hook or a DOM — the same
// test-seam convention as this file's own `window.wrizoFirstLineInvite` below. Never imported
// by app code outside this file.
export function prefKeyFor(userId: string | null | undefined): string {
  return userId ? `${PREF_KEY_BASE}:${userId}` : PREF_KEY_BASE;
}

// FX16 (SV18) — the invite still rendered on EXISTING devices after FX15, because a value
// stored 'on' by the pre-FX15 build overrode FX15's new silent default (a stored explicit
// value beats a changed default). That 'on' came from tapping the then-default-shown
// "invite a first line?" affordance (F6), which FX15 retired. This one-time, marker-guarded
// migration retires that stale 'on' so the new default (silent) governs — for a fresh
// profile it is a no-op. It runs ONCE: a DELIBERATE opt-in made AFTER it (BG1's "Sprout"
// door → optIn, which sets 'on' with the marker already present) survives untouched, so it
// is never a silent overwrite of a choice the writer made under FX15's own terms. 'never'
// (an explicit withdrawal) is left alone. Always runs against the BARE key: the pre-FX15
// build predates per-account scoping entirely, so a stale value from it can only ever be
// sitting on the bare key, never on a `:<userId>` key that didn't exist yet.
export function migrateStaleOn(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return;                                       // already migrated — leave later opt-ins alone
    if (localStorage.getItem(PREF_KEY_BASE) === 'on') localStorage.removeItem(PREF_KEY_BASE);  // stale pre-FX15 'on' → the new default (off/silent)
    localStorage.setItem(MIGRATED_KEY, '1');
  } catch { /* device-local best-effort */ }
}

// SPROUT-INVITE-SCOPE — a one-time move of the bare key's value onto the signed-in writer's
// OWN key, run after migrateStaleOn (so what's left on the bare key, if anything, is never
// the retired pre-FX15 artifact). Self-limiting with no extra marker needed: moving the value
// REMOVES the bare key, so there is nothing left to move the next time any writer signs in on
// this device — the first account to sign in after this ships is the only one that ever
// inherits the device's pre-scoping history.
export function migrateToScopedKey(userId: string | null | undefined): void {
  if (typeof localStorage === 'undefined' || !userId) return;
  try {
    const scopedKey = prefKeyFor(userId);
    const bare = localStorage.getItem(PREF_KEY_BASE);
    if (bare != null && localStorage.getItem(scopedKey) == null) {
      localStorage.setItem(scopedKey, bare);
      localStorage.removeItem(PREF_KEY_BASE);
    }
  } catch { /* device-local best-effort */ }
}

export function readPref(): InvitePref {
  if (typeof localStorage === 'undefined') return 'off';
  const userId = getCurrentUser()?.id ?? null;
  migrateStaleOn();            // FX16 — retire a pre-FX15 stale 'on' once, before anything else
  migrateToScopedKey(userId);  // SPROUT-INVITE-SCOPE — then move the bare key to this account, once
  const v = localStorage.getItem(prefKeyFor(userId));
  return v === 'on' || v === 'never' ? v : 'off';
}

function pickPrompt(): string {
  return NUDGE_POOL[Math.floor(Math.random() * NUDGE_POOL.length)];
}

export interface FirstLineInvite {
  node: React.ReactNode; // the invitation / null, positioned by the surface
  dismiss: () => void;   // first-keystroke seam — hide for this page (pref untouched)
  optIn: () => void;     // FX15 — the on-request entry (e.g. BG1's "Sprout" door): turn the invitation ON
  visible: boolean;      // whether the prompt is showing (surfaces suppress their own chrome)
  // SPROUT-INVITE-SCOPE — true only while the pref is still 'off' (nothing decided yet). An
  // on-request door (Sprout) reads this to stop offering a choice already made: once 'on' or
  // 'never', there is nothing left to opt into. Not completion state for BG1's row itself (the
  // row stays stateless per Nick's Oct 8 ruling) — this is the invite's OWN pref, which already
  // existed before BG1 ever read it.
  canOffer: boolean;
}

export function useFirstLineInvite(isEmpty: () => boolean): FirstLineInvite {
  const [pref, setPref] = useState<InvitePref>(readPref);
  const [dismissed, setDismissed] = useState(false);
  const [prompt, setPrompt] = useState<string>(pickPrompt);

  const dismiss = useCallback(() => setDismissed(true), []);

  const optIn = useCallback(() => {
    // The setting, requested exactly where it matters: opting in shows the first
    // invitation immediately (a fresh prompt) and persists 'on' for later empty pages.
    setPrompt(pickPrompt());
    setPref('on');
    try { localStorage.setItem(prefKeyFor(getCurrentUser()?.id ?? null), 'on'); } catch { /* device-local best-effort */ }
  }, []);

  const neverAgain = useCallback(() => {
    setPref('never');
    try { localStorage.setItem(prefKeyFor(getCurrentUser()?.id ?? null), 'never'); } catch { /* device-local best-effort */ }
  }, []);

  // FX15 — the invitation shows ONLY when the writer has opted in ('on'). 'off' (the
  // default) and 'never' both render nothing: a fresh page is silent until asked.
  const visible = !dismissed && pref === 'on' && isEmpty();
  const canOffer = pref === 'off';

  const node: React.ReactNode = visible ? (
    <div className="fl-invite">
      <span className="fl-prompt" aria-hidden="true">{prompt}</span>
      <button type="button" className="fl-never" onClick={neverAgain}>don’t offer again</button>
    </div>
  ) : null;

  return { node, dismiss, optIn, visible, canOffer };
}

// Test/inspection seam (the wrizoDeskLexicon / wrizoBoard convention) — exposes the
// invitation's prompt DECK so fx15.mjs can prove a rendered prompt is deck-drawn (a
// verbatim member of this local pool), never model-drawn. Never read by app code.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoFirstLineInvite?: unknown }).wrizoFirstLineInvite = { POOL: NUDGE_POOL };
}
