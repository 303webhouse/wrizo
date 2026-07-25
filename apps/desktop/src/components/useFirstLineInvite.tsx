import { useCallback, useState } from 'react';
import { NUDGE_POOL } from '../store/idleNudges';

// F6 — the first-line invitation (opt-in). FX15 (the Quiet Page): the invitation
// SLEEPS by default. A fresh page says nothing until the writer asks — no affordance,
// no prompt, no chrome. The deck survives; only the unbidden OFFER retires. The writer
// reaches it ON REQUEST: `optIn()` is exposed for the page's on-request callers — BG1's
// "Sprout" door is the spark deck, which IS this same first-line-invite mechanism — and
// turns the invitation ON (device-local pref). Once on, one quiet prompt in the
// permission-giving register invites a first line to push against — never text that
// writes itself — with a permanent "don't offer again". Three prefs behind ONE
// device-local key (no schema, no sync — an invitation preference isn't worth a
// collection): 'off' (the default — silent), 'on' (opted in — the prompt shows on an
// empty page), 'never' (withdrawn — permanent). 'off' and 'never' both render nothing.
//
// Render-only: the node is a sibling ABOVE/OUTSIDE the editable DOM (the warm-start
// pattern), never selectable/serialized — saved bytes are identical whether it showed
// or not, and it can never become the writer's text (no accept, no tab-fill, no
// insertion — A13). The prompt is drawn from the local NUDGE_POOL (deck-drawn, never
// model-drawn — no send on page load, ever). The first keystroke dismisses it for this
// page via the SAME onForward/noteWrite seam warm-start + TTFK use; the pref is
// untouched — the writer's ink always wins the space.

const PREF_KEY = 'wrizo-first-line-invite'; // matches the mode-memory localStorage pattern
type InvitePref = 'off' | 'on' | 'never';

function readPref(): InvitePref {
  if (typeof localStorage === 'undefined') return 'off';
  const v = localStorage.getItem(PREF_KEY);
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
    try { localStorage.setItem(PREF_KEY, 'on'); } catch { /* device-local best-effort */ }
  }, []);

  const neverAgain = useCallback(() => {
    setPref('never');
    try { localStorage.setItem(PREF_KEY, 'never'); } catch { /* device-local best-effort */ }
  }, []);

  // FX15 — the invitation shows ONLY when the writer has opted in ('on'). 'off' (the
  // default) and 'never' both render nothing: a fresh page is silent until asked.
  const visible = !dismissed && pref === 'on' && isEmpty();

  const node: React.ReactNode = visible ? (
    <div className="fl-invite">
      <span className="fl-prompt" aria-hidden="true">{prompt}</span>
      <button type="button" className="fl-never" onClick={neverAgain}>don’t offer again</button>
    </div>
  ) : null;

  return { node, dismiss, optIn, visible };
}

// Test/inspection seam (the wrizoDeskLexicon / wrizoBoard convention) — exposes the
// invitation's prompt DECK so fx15.mjs can prove a rendered prompt is deck-drawn (a
// verbatim member of this local pool), never model-drawn. Never read by app code.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoFirstLineInvite?: unknown }).wrizoFirstLineInvite = { POOL: NUDGE_POOL };
}
