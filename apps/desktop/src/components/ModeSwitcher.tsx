import { useState } from 'react';
import type { EditorMode } from './ForwardOnlyEditor';

// Mode switcher (writing-screen redesign). Top-bar tabs with stage sub-labels;
// active tab filled brass. Internal keys stay journal/drafting so the editor +
// persisted mode keep working; only the labels changed. Free write = forward-only
// (idea generation, AI sealed); Draft = free edit. Format is greyed. File actions
// (Workshop / Publish) render inline as trailing tabs in the same strip.

interface ModeDef { key: string; label: string; sub: string; live: boolean }
const MODES: ModeDef[] = [
  { key: 'journal', label: 'Free write', sub: 'generate', live: true },
  { key: 'drafting', label: 'Draft', sub: 'revise', live: true },
  { key: 'formatting', label: 'Format', sub: 'convention', live: false },
];

// A trailing action tab (Workshop / Publish) — styled like a mode tab but a file
// action, not a posture. `deferred` greys it (coming soon).
export interface ActionTab { label: string; sub: string; onClick?: () => void; deferred?: boolean }

export function ModeSwitcher({ mode, onSwitch, actions = [] }: { mode: EditorMode; onSwitch: (m: EditorMode) => void; actions?: ActionTab[] }) {
  const [soon, setSoon] = useState<string | null>(null);
  const flashSoon = (label: string) => { setSoon(label); setTimeout(() => setSoon(null), 1800); };
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
            else flashSoon(m.label);
          }}
        >
          <span className="mode-tab__label">{m.label}</span>
          <span className="mode-tab__sub">{m.sub}</span>
        </button>
      ))}
      {actions.map(a => (
        <button
          key={a.label}
          type="button"
          className={`mode-tab mode-tab--action${a.deferred ? ' deferred' : ''}`}
          aria-disabled={a.deferred}
          onClick={() => { if (a.deferred) flashSoon(a.label); else a.onClick?.(); }}
        >
          <span className="mode-tab__label">{a.label}</span>
          <span className="mode-tab__sub">{a.sub}</span>
        </button>
      ))}
      {soon && <span className="mode-soon" role="status">{soon} — coming soon</span>}
    </div>
  );
}
