import { useState } from 'react';
import type { EditorMode } from './ForwardOnlyEditor';

// Mode switcher (mode-aware editor brief). Top-bar tabs: Journal · Drafting ·
// Formatting · Workshop with stage sub-labels; active filled brass. Switching is
// a LENS change on the same document (the consumer carries prose + caret across)
// — no navigation. Formatting/Workshop are greyed this milestone: visible but
// disabled; click → a brief "coming soon". Built to the prototype's structure
// (apps/desktop/scratch/wrizo-modes-hybrid.html).

interface ModeDef { key: string; label: string; sub: string; live: boolean }
const MODES: ModeDef[] = [
  { key: 'journal', label: 'Journal', sub: 'generate', live: true },
  { key: 'drafting', label: 'Drafting', sub: 'revise', live: true },
  { key: 'formatting', label: 'Formatting', sub: 'convention', live: false },
  { key: 'workshop', label: 'Workshop', sub: 'share', live: false },
];

export function ModeSwitcher({ mode, onSwitch }: { mode: EditorMode; onSwitch: (m: EditorMode) => void }) {
  const [soon, setSoon] = useState<string | null>(null);
  return (
    <div className="mode-tabs" role="tablist" aria-label="Writing mode">
      {MODES.map(m => (
        <button
          key={m.key}
          type="button"
          role="tab"
          aria-selected={m.key === mode}
          aria-disabled={!m.live}
          className={`mode-tab${m.key === mode ? ' active' : ''}${m.live ? '' : ' deferred'}`}
          onClick={() => {
            if (m.live) onSwitch(m.key as EditorMode);
            else { setSoon(m.label); setTimeout(() => setSoon(null), 1800); }
          }}
        >
          <span className="mode-tab__label">{m.label}</span>
          <span className="mode-tab__sub">{m.sub}</span>
        </button>
      ))}
      {soon && <span className="mode-soon" role="status">{soon} — coming soon</span>}
    </div>
  );
}
