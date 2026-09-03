import { useState } from 'react';
import type { EditorMode } from './ForwardOnlyEditor';
import { useDeskLexicon } from '../store/deskLexicon';

// AB1 S2 — the real unified mode strip, ratified exact strings (title case):
// Free Write · Draft · Revise · Workshop · Publish. Lives ABOVE the stage on
// every DeskFrame surface, including script (finding 5 dies here) — the
// three-tab ModeSwitcher.tsx it visually supersedes stays in the codebase
// unchanged for the surfaces DeskFrame doesn't yet own (QuickSprint, and
// every surface under the 1100px gate).
//
// ITEM 112-A — REVISE IS LIVE. Free Write, Draft and Revise are live
// EditorModes; Workshop remains deferred (flashes "coming soon"), and Publish
// opens the same stub dialog PageEditor already ships. Revise takes THE STRIP'S
// EXISTING SWITCH BEHAVIOUR and no new gesture: it is `onSwitch('revise')`, the
// identical call Draft makes, so the doorway is the mode's only new thing about
// entering. `flashSoon` stays — Workshop still uses it, and so does the
// freeWriteEnabled=false path below.
//
// `freeWriteEnabled=false` lets the script surface keep Draft as its only live
// posture (script Free-write is AB2, per the existing "Draft law only" comment
// in ScriptEditor.tsx) while still showing all five strings, per S6's "strip
// present on every surface including script."
//
// ITEM 112-A — `reviseEnabled` is the EXACT SAME LEVER for the exact same
// reason, and it exists because standing Revise up would otherwise have made
// the screenplay's own strip lie. ScriptEditor mounts this component with a
// no-op `onSwitch`, so a newly-live Revise tab there would have rendered as a
// real posture and done NOTHING when pressed — worse than the deferred tab it
// replaced. Screenplay is Draft-only by its own law (S1), and 112-A charters
// Revise on the PROSE PAGE alone, so the script surface passes false and keeps
// flashing coming-soon for Revise exactly as it already does for Free Write.
// Default true: the prose Page, this ticket's own surface, needs no opt-in.
export interface ModeStripProps {
  mode: EditorMode;
  onSwitch: (m: EditorMode) => void;
  onPublish: () => void;
  freeWriteEnabled?: boolean;
  reviseEnabled?: boolean;
}

export function ModeStrip({ mode, onSwitch, onPublish, freeWriteEnabled = true, reviseEnabled = true }: ModeStripProps) {
  const { t } = useDeskLexicon();
  const [soon, setSoon] = useState<string | null>(null);
  const flashSoon = (label: string) => { setSoon(label); setTimeout(() => setSoon(null), 1800); };

  const items: { key: string; label: string; live: boolean; active: boolean; onClick: () => void }[] = [
    {
      key: 'freewrite', label: t('modeFreeWrite'), live: freeWriteEnabled, active: mode === 'journal',
      onClick: () => (freeWriteEnabled ? onSwitch('journal') : flashSoon(t('modeFreeWrite'))),
    },
    {
      key: 'draft', label: t('modeDraft'), live: true, active: mode === 'drafting',
      onClick: () => onSwitch('drafting'),
    },
    {
      key: 'revise', label: t('modeRevise'), live: reviseEnabled, active: mode === 'revise',
      onClick: () => (reviseEnabled ? onSwitch('revise') : flashSoon(t('modeRevise'))),
    },
    { key: 'workshop', label: t('modeWorkshop'), live: false, active: false, onClick: () => flashSoon(t('modeWorkshop')) },
    { key: 'publish', label: t('modePublish'), live: true, active: false, onClick: onPublish },
  ];

  return (
    <div className="desk-mode-strip" role="tablist" aria-label="Writing mode">
      {items.map(it => (
        <button
          key={it.key}
          type="button"
          role="tab"
          /* ITEM 112-A — a CONTRACT MARKER, the same behaviour-free idiom
             Sliver.tsx's own `data-menus-dock`/`data-menus-handle` already
             establish, and here for the same reason: these labels come from
             useDeskLexicon and are THEMEABLE, so an acceptance instrument that
             bound to the word "Revise" would be testing a theme rather than the
             ruled invariant. Nothing styles this attribute. */
          data-mode-key={it.key}
          aria-selected={it.active}
          aria-disabled={!it.live}
          className={`desk-mode-tab${it.active ? ' active' : ''}${it.live ? '' : ' deferred'}`}
          onClick={it.onClick}
        >
          {it.label}
        </button>
      ))}
      {soon && <span className="desk-mode-soon" role="status">{soon} — coming soon</span>}
    </div>
  );
}
