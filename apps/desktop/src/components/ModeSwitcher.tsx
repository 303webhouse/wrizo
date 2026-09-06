import { Fragment, useState } from 'react';
import type { EditorMode } from './ForwardOnlyEditor';
import { useLexicon } from '../store/themeLexicon';

// Mode switcher (writing-screen redesign). Top-bar tabs with stage sub-labels;
// active tab filled brass. Internal keys stay journal/drafting so the editor +
// persisted mode keep working; only the labels changed. Free write = forward-only
// (idea generation, AI sealed); Draft = free edit. Format is greyed. File actions
// (Workshop / Publish) render inline as trailing tabs in the same strip.
//
// TH2 lexicon sweep — this is the SHARED component PageEditor/QuickSprint
// mount (JournalEntry has its own separate tab row, already swept in TH1);
// 'Free write' lived only here, un-lexiconed, so those two surfaces' tabs
// were never actually themed despite both files importing useLexicon.
// ITEM 112-A — BOTH SIDES MUST AGREE (brief §2). ModeStrip (the framed strip)
// makes Revise live; this strip is the same truth below the 1100px gate, and
// leaving it out would have produced a state it could not express: a page whose
// PER-PAGE mode persisted as 'revise' and then loaded narrow would render this
// row with NO TAB SELECTED AT ALL.
//
// GATED, because this component is shared and 112-A charters ONE surface. It is
// mounted by the unframed Page (PageEditor.tsx) AND by QuickSprint — a scratch
// surface with its own separate mode key, no DeskFrame, no hands, and no charter
// naming it. So Revise renders here only when the host opts in (`reviseEnabled`),
// exactly the lever ModeStrip already uses for Free Write on the script surface.
// QuickSprint passes nothing and is byte-identical to pre-112-A.
//
// THE SUB-LABEL — SETTLED 2026-09-05 (Fable's ruling): DRAFT MARKS, REVISE
// DRESSES. Draft's sub read 'revise', written when revise was a STAGE of Draft
// rather than a room of its own; 112-A made Revise a room and left the word
// behind, pointing at a door that had moved. It now reads 'mark', from the
// charter's own organizing sentence — "Free Write produces, Draft marks, Revise
// dresses" — the same sentence Revise's 'dress' already came from. The
// stop-and-surface raised in docs/menus/tutor/item112a-s0.md is answered.
//
// THIS TABLE IS SHARED, and the change therefore reaches BOTH of its mounts —
// PageEditor's strip below the 1100px gate AND QuickSprint's. That is deliberate
// and it is the honest outcome: the word was equally wrong on both, and Draft
// marks on every surface that has a Draft. QuickSprint.tsx itself is untouched
// (it passes no props into this and renders no Revise tab, since `reviseEnabled`
// defaults false), so what changes there is one word of a sub-label and nothing
// else. Recorded because "one line" and "reaches two surfaces" are both true and
// only one of them is obvious.
interface ModeDef { key: string; term?: 'freewrite'; label: string; sub: string; live: boolean }
const MODES: ModeDef[] = [
  { key: 'journal', term: 'freewrite', label: 'Free write', sub: 'generate', live: true },
  { key: 'drafting', label: 'Draft', sub: 'mark', live: true },
  { key: 'revise', label: 'Revise', sub: 'dress', live: true },
  { key: 'formatting', label: 'Format', sub: 'convention', live: false },
];

// A trailing action tab (Workshop / Publish) — styled like a mode tab but a file
// action, not a posture. `deferred` greys it (coming soon).
export interface ActionTab { label: string; sub: string; onClick?: () => void; deferred?: boolean }

export function ModeSwitcher({ mode, onSwitch, actions = [], reviseEnabled = false }: { mode: EditorMode; onSwitch: (m: EditorMode) => void; actions?: ActionTab[]; reviseEnabled?: boolean }) {
  const [soon, setSoon] = useState<string | null>(null);
  const flashSoon = (label: string) => { setSoon(label); setTimeout(() => setSoon(null), 1800); };
  const { t: lex } = useLexicon();
  return (
    <div className="mode-tabs" role="tablist" aria-label="Writing mode">
      {MODES.filter(m => m.key !== 'revise' || reviseEnabled).map(m => {
        const label = m.term ? lex(m.term) : m.label;
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
      {/* A separator before each action tab splits the strip into three sections:
          writing (postures) | workshop | delivery. Visual only — the actions still
          dispatch as actions, not postures. */}
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
