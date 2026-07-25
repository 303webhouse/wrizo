import { useCallback, useState } from 'react';
import { NUDGE_POOL } from '../store/idleNudges';

// F6 — the first-line invitation (opt-in). The arc removed every decision between
// the writer and the page; this offers a hand once they're ON it — one quiet
// prompt in the permission-giving register, an invitation to push against, never
// text that writes itself. Three states behind ONE device-local pref (no schema,
// no sync — an invitation preference isn't worth a collection); the invitation
// introduces itself, so consent is given in context and withdrawal is permanent.
//
// Render-only: the node is a sibling ABOVE/OUTSIDE the editable DOM (the warm-start
// pattern), never selectable/serialized — saved bytes are identical whether it
// showed or not. The first keystroke dismisses it for this page via the SAME
// onForward/noteWrite seam warm-start + TTFK use (its fourth consumer); the pref
// is untouched — the writer's ink always wins the space.

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
  node: React.ReactNode; // the affordance / invitation / null, positioned by the surface
  dismiss: () => void;   // first-keystroke seam — hide for this page (pref untouched)
  visible: boolean;      // whether something is showing (surfaces suppress their own chrome)
  request: () => void;   // BG1 — asked for, on this page only (see below)
}

export function useFirstLineInvite(isEmpty: () => boolean): FirstLineInvite {
  const [pref, setPref] = useState<InvitePref>(readPref);
  const [dismissed, setDismissed] = useState(false);
  const [prompt, setPrompt] = useState<string>(pickPrompt);
  // BG1 S2 — the Sprout door's own state. An invitation the writer ASKED for,
  // scoped to this page and this mount, deliberately NOT written to the pref:
  // FX15's law is that a new page says nothing until the writer does, and one
  // tap on a door is a request for a line here, not a standing consent to be
  // offered one forever. (Opting IN permanently is still the affordance's job,
  // `tapAffordance` below — one act, one meaning.)
  const [requested, setRequested] = useState(false);

  const dismiss = useCallback(() => setDismissed(true), []);

  // BG1 S2 — the Sprout door: draw a line NOW, for this page. Deck-drawn and
  // nothing else (NUDGE_POOL, a static local pool — no request leaves the
  // machine, on page load or on this click), and it can never become the
  // writer's text: the node below is render-only, outside the editable DOM,
  // with no accept, no tab-fill, no insertion (A13). An explicit request wins
  // over a 'never' pref by design — 'never' retires the unbidden OFFER, and a
  // door the writer just pressed is not an offer.
  const request = useCallback(() => {
    setPrompt(pickPrompt());
    setRequested(true);
  }, []);

  const tapAffordance = useCallback(() => {
    // The setting, discovered exactly where it matters: opting in shows the first
    // invitation immediately (a fresh prompt).
    setPrompt(pickPrompt());
    setPref('on');
    try { localStorage.setItem(PREF_KEY, 'on'); } catch { /* device-local best-effort */ }
  }, []);

  const neverAgain = useCallback(() => {
    setPref('never');
    try { localStorage.setItem(PREF_KEY, 'never'); } catch { /* device-local best-effort */ }
  }, []);

  // BG1 S2 — a requested line shows even under 'never' (see `request` above);
  // the first keystroke still wins over both, unchanged.
  const visible = !dismissed && (requested || pref !== 'never') && isEmpty();

  let node: React.ReactNode = null;
  if (visible && (requested || pref === 'on')) {
    node = (
      <div className="fl-invite">
        <span className="fl-prompt" aria-hidden="true">{prompt}</span>
        <button type="button" className="fl-never" onClick={neverAgain}>don’t offer again</button>
      </div>
    );
  } else if (visible && pref === 'off') {
    node = (
      <div className="fl-invite">
        <button type="button" className="fl-affordance" onClick={tapAffordance}>invite a first line?</button>
      </div>
    );
  }

  return { node, dismiss, visible, request };
}
