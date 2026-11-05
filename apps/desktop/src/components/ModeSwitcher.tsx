import { Fragment, useState } from 'react';
import type { EditorMode } from './ForwardOnlyEditor';
import { useLexicon } from '../store/themeLexicon';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';

// the legacy strip below the 1100px gate: internal keys stay journal/drafting; Revise renders only where the host opts in (reviseEnabled), so QuickSprint is unchanged; Draft's sub-label is 'mark'; labels come from the shared lexicon terms [ModeSwitcher §1]
interface ModeDef { key: string; term?: 'freewrite'; deskTerm?: DeskTermId; label: string; sub: string; live: boolean }
const MODES: ModeDef[] = [
  { key: 'journal', term: 'freewrite', label: 'Free write', sub: 'generate', live: true },
  { key: 'drafting', deskTerm: 'modeDraft', label: 'Draft', sub: 'mark', live: true },
  { key: 'revise', deskTerm: 'modeRevise', label: 'Revise', sub: 'dress', live: true },
  { key: 'formatting', deskTerm: 'railFormat', label: 'Format', sub: 'convention', live: false },
];

// A trailing action tab (Publish today; Workshop when built) — styled like a mode tab but a file
// action, not a posture. `deferred` greys it (coming soon).
export interface ActionTab { label: string; sub: string; onClick?: () => void; deferred?: boolean }

export function ModeSwitcher({ mode, onSwitch, actions = [], reviseEnabled = false }: { mode: EditorMode; onSwitch: (m: EditorMode) => void; actions?: ActionTab[]; reviseEnabled?: boolean }) {
  const [soon, setSoon] = useState<string | null>(null);
  const flashSoon = (label: string) => { setSoon(label); setTimeout(() => setSoon(null), 1800); };
  const { t: lex } = useLexicon();
  const { t: deskT } = useDeskLexicon();
  return (
    <div className="mode-tabs" role="tablist" aria-label="Writing mode">
      {MODES.filter(m => m.key !== 'revise' || reviseEnabled).map(m => {
        const label = m.term ? lex(m.term) : m.deskTerm ? deskT(m.deskTerm) : m.label;
        return (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={m.key === mode}
            aria-disabled={!m.live}
            className={`mode-tab${m.key === mode ? ' active' : ''}${m.live ? '' : ' deferred'}`}
            onClick={() => {
              if (m.live) onSwitch(m.key as EditorMode);
              else flashSoon(label);
            }}
          >
            <span className="mode-tab__label">{label}</span>
            <span className="mode-tab__sub">{m.sub}</span>
          </button>
        );
      })}
      {/* a separator before each action tab splits writing postures from delivery; visual only - actions still dispatch as actions [ModeSwitcher §2] */}
      {actions.map(a => (
        <Fragment key={a.label}>
          <span className="mode-tab-sep" aria-hidden="true" />
          <button
            type="button"
            className={`mode-tab mode-tab--action${a.deferred ? ' deferred' : ''}`}
            aria-disabled={a.deferred}
            onClick={() => { if (a.deferred) flashSoon(a.label); else a.onClick?.(); }}
          >
            <span className="mode-tab__label">{a.label}</span>
            <span className="mode-tab__sub">{a.sub}</span>
          </button>
        </Fragment>
      ))}
      {soon && <span className="mode-soon" role="status">{soon} — coming soon</span>}
    </div>
  );
}
