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
// Only Free Write and Draft are live EditorModes today; Revise/Workshop are
// deferred (flash "coming soon" — the per-mode tool rails and the Revise
// posture itself are AB2 non-goals here); Publish opens the same stub dialog
// PageEditor already ships. `freeWriteEnabled=false` lets the script surface
// keep Draft as its only live posture (script Free-write is AB2, per the
// existing "Draft law only" comment in ScriptEditor.tsx) while still showing
// all five strings, per S6's "strip present on every surface including
// script."
export interface ModeStripProps {
  mode: EditorMode;
  onSwitch: (m: EditorMode) => void;
  onPublish: () => void;
  freeWriteEnabled?: boolean;
}

export function ModeStrip({ mode, onSwitch, onPublish, freeWriteEnabled = true }: ModeStripProps) {
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
    { key: 'revise', label: t('modeRevise'), live: false, active: false, onClick: () => flashSoon(t('modeRevise')) },
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
