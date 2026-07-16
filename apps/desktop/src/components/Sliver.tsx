import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { useWritingSettings, setWritingSettings } from '../store/writingSettings';
import { useWritingGoal, setWritingGoal, DEFAULT_GOAL_LINES } from '../store/writingGoal';
import { countLineEquivalents } from '../store/lineEquivalents';
import { TypewriterToggle } from './WritingIncentives';
import type { FormatAction, StructureKind } from '../store/draftFormat';

// CD1 S2/S7 — the sliver. A slim grip riding the paper's left edge on every
// framed writing surface (prose AND script — S7 mirrors the wiring exactly).
// Supersedes AB2's ToolRail (retired whole, S7): its per-mode hand-tool
// content moves here VERBATIM (same JSX, same behavior, renamed classes
// only — `.desk-toolrail-*` -> `.wz-sliver-*`), and grows a NEW foot (S6):
// the goal block (timer numeral, the progress hairline, one inline edit).
//
// Geometry (S2's hard invariant): the sliver is mounted by DeskFrame.tsx as
// an ABSOLUTELY POSITIONED overlay anchored to the paper's own canonical
// width, inside `.desk-frame-stage` — never a grid/flex track of its own,
// so it structurally CANNOT move the paper's rect regardless of open/
// closed/dissolved state (see index.css's `.desk-frame-sliver-anchor`).
//
// Dissolve (S2: "the one vanishing engine — no second implementation"): the
// PANEL carries the same `chrome-fade desk-dissolve` classes every other
// DeskFrame track already carries, so it rides the SAME ambient
// `.desk-frame[data-writing='true'] .desk-dissolve` rule every other zone
// obeys — no useChromeDissolve call lives in this file. The GRIP never
// carries those classes, so it persists through a dissolve untouched,
// exactly like ChromeHandle's own "always-discoverable" dot elsewhere.
//
// Open/closed is this component's own local, uncontrolled state (nothing
// else needs to read or drive it) — toggled by clicking the grip or the
// keyboard shortcut documented beside deskLexicon.ts (Ctrl/Cmd+/ — an
// unclaimed modifier chord: 'n' is DeskRail's bare-key Catch shortcut,
// arrow keys are the Journal's notebook paging, Ctrl/Cmd+1-8 are the
// Screenplay Room's element retype chord; Ctrl//Cmd+/ collides with none of
// them and is a common "toggle panel" mnemonic elsewhere).
export const SLIVER_SHORTCUT_LABEL = 'Ctrl/Cmd+/';

export const CAPTURE_ITEMS = ['Spark deck', 'Fragments', 'Send → Drawer'] as const;

export type SliverContent =
  | { kind: 'empty' }
  | {
      kind: 'freewrite';
      ink?: {
        penColor: string;
        inks: readonly string[];
        onChoosePen: (ink: string) => void;
      };
      forwardLock?: {
        on: boolean;
        onToggle: (next: boolean) => void;
      };
      captureItems: readonly string[];
    }
  | {
      kind: 'draft';
      structure: StructureKind;
      onSwitchStructure: (next: StructureKind) => void;
      format?: { onFormat: (action: FormatAction) => void };
    };

export interface SliverProps {
  content: SliverContent;
  // The page's current raw text, for the goal block's line-equivalents
  // progress (store/lineEquivalents.ts) — viewport-independent, computed
  // fresh on every render (cheap: a handful of string splits).
  goalText: string;
}

export function Sliver({ content, goalText }: SliverProps) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();
  const target = useWritingGoal();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setOpen(o => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Review fix (post-CD1) — mirrors ModeStage's own pre-existing "opt-in
  // session timer" semantic (`firstWriteRef`: elapsed since the FIRST
  // KEYSTROKE, not since the surface mounted). The sliver had no keystroke
  // signal threaded to it, so the original cut anchored the clock to the
  // sliver's own mount instead — meaning it started counting the moment the
  // page loaded, even before the writer typed a single character (idle
  // reading time silently counted as "writing time"). goalText already
  // updates live on every keystroke (every host's own input handler feeds
  // it), so the first time it changes from its as-mounted value IS the
  // first-keystroke signal, with no new prop threading needed from the
  // three hosts. Captured once per Sliver mount (a fresh page = a fresh
  // clock), same as the pre-existing pattern.
  const initialGoalTextRef = useRef(goalText);
  const [firstWriteAt, setFirstWriteAt] = useState<number | null>(null);
  useEffect(() => {
    if (firstWriteAt === null && goalText !== initialGoalTextRef.current) {
      setFirstWriteAt(Date.now());
    }
  }, [goalText, firstWriteAt]);

  const lines = countLineEquivalents(goalText);
  const fraction = target != null && target > 0 ? Math.max(0, Math.min(1, lines / target)) : 0;

  return (
    <div className="wz-sliver" ref={rootRef} data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className="wz-sliver-grip"
        aria-expanded={open}
        aria-label={open ? t('sliverClose') : t('sliverOpen')}
        title={`${open ? t('sliverClose') : t('sliverOpen')} (${SLIVER_SHORTCUT_LABEL})`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="wz-sliver-grip-glyph" aria-hidden="true">{open ? '›' : '‹'}</span>
      </button>

      <div className="wz-sliver-panel chrome-fade desk-dissolve" aria-hidden={!open} data-open={open ? 'true' : 'false'}>
        <SliverToolsBody content={content} />
        <SliverGoalFoot target={target} lines={lines} fraction={fraction} timerOn={settings.timer} firstWriteAt={firstWriteAt} />
      </div>
    </div>
  );
}

function SliverToolsBody({ content }: { content: SliverContent }) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();

  if (content.kind === 'empty') return null;

  return (
    <div className="wz-sliver-body">
      {content.kind === 'freewrite' && content.ink && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('railInk')}</div>
          <div className="wz-sliver-inks">
            {content.ink.inks.map(ink => (
              <button
                key={ink}
                type="button"
                className={`mode-swatch${content.ink!.penColor === ink ? ' active' : ''}`}
                style={{ background: ink }}
                aria-label={`Ink ${ink}`}
                aria-pressed={content.ink!.penColor === ink}
                onClick={() => content.ink!.onChoosePen(ink)}
              />
            ))}
            <button type="button" className="mode-nib wz-sliver-nib" title="Nib styles — coming soon">nib · fine ▾</button>
          </div>
        </div>
      )}

      {content.kind === 'freewrite' && content.forwardLock && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('railControls')}</div>
          <SliverToggle
            label={t('railForwardLock')}
            on={content.forwardLock.on}
            onToggle={() => content.forwardLock!.onToggle(!content.forwardLock!.on)}
            className="wz-sliver-forwardlock"
          />
        </div>
      )}

      {/* Typewriter — Free Write and Draft both engage it (ModeStage's own
          typewriterOn gate). Reads/writes the SAME shared, persisted store
          ModeStage/JournalEntry already use — moved verbatim from ToolRail. */}
      <div className="wz-sliver-section">
        <div className="wz-sliver-h">{t('railReading')}</div>
        <div className="wz-sliver-typewriter">
          <TypewriterToggle on={settings.typewriter} onToggle={() => setWritingSettings({ typewriter: !settings.typewriter })} />
          <span className="wz-sliver-typewriter-label">{t('railTypewriter')}</span>
        </div>
      </div>

      {content.kind === 'draft' && content.format && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('railFormat')}</div>
          {/* onMouseDown preventDefault — a sliver button is OUTSIDE the
              contenteditable, so a normal click's mousedown would blur it
              and collapse whatever text was selected (moved verbatim). */}
          <div className="wz-sliver-format" onMouseDown={e => e.preventDefault()}>
            <button type="button" className="mode-tbtn" title="Bold" onClick={() => content.format!.onFormat('bold')}><b>B</b></button>
            <button type="button" className="mode-tbtn" title="Italic" onClick={() => content.format!.onFormat('italic')}><i>I</i></button>
            <button type="button" className="mode-tbtn" title="Heading" onClick={() => content.format!.onFormat('heading')}>H</button>
            <button type="button" className="mode-tbtn" title="Spacing" onClick={() => content.format!.onFormat('spacing')}>&para;</button>
          </div>
        </div>
      )}

      {content.kind === 'draft' && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('railStructure')}</div>
          <div className="wz-sliver-structure" role="tablist" aria-label={t('railStructure')}>
            <button
              type="button"
              role="tab"
              aria-selected={content.structure === 'prose'}
              className={`wz-sliver-structure-btn${content.structure === 'prose' ? ' active' : ''}`}
              onClick={() => content.onSwitchStructure('prose')}
            >
              {t('railStructureProse')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={content.structure === 'screenplay'}
              className={`wz-sliver-structure-btn${content.structure === 'screenplay' ? ' active' : ''}`}
              onClick={() => content.onSwitchStructure('screenplay')}
            >
              {t('railStructureScreenplay')}
            </button>
          </div>
        </div>
      )}

      {content.kind === 'freewrite' && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('corkboardJournalTab')}</div>
          {content.captureItems.map(it => <div key={it} className="wz-sliver-item">{it}</div>)}
        </div>
      )}
    </div>
  );
}

function SliverToggle({ label, on, onToggle, className }: { label: string; on: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      className={`wz-sliver-toggle${className ? ` ${className}` : ''}`}
      data-on={on ? 'true' : 'false'}
      aria-pressed={on}
      onClick={onToggle}
    >
      <span className="wz-sliver-toggle-label">{label}</span>
      <span className="wz-sliver-toggle-switch" aria-hidden="true" />
    </button>
  );
}

// CD1 S6 — the goal block, the sliver's foot. Timer (opt-in, the existing
// persisted `settings.timer` — a quiet numeral, `--text-mid`, mirroring the
// pre-existing session clock's own styling); the progress hairline (2px,
// present only when a target exists); one inline goal edit (a number input,
// Enter commits, an explicit Clear disables every instrument — the brief's
// own "clearing it disables every instrument" law). No numbers are
// announced beyond the writer's OWN edit affordance reading back the
// target itself — the hairline never labels itself with a fraction/percent,
// and nothing here fires an event or shows a toast on arrival.
//
// Review fix (post-CD1) — `firstWriteAt` (Sliver's own state, lifted so it
// survives this component's re-renders) anchors the clock to the first
// actual keystroke, not this component's mount: matches ModeStage's own
// pre-existing "elapsed since first keystroke" session-timer semantic
// exactly (the numeral still shows, reading 0:00, before the writer's
// first keystroke — same as that pattern always has — it just doesn't
// start ADVANCING until they do).
function SliverGoalFoot({ target, lines, fraction, timerOn, firstWriteAt }: { target: number | null; lines: number; fraction: number; timerOn: boolean; firstWriteAt: number | null }) {
  const { t } = useDeskLexicon();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => String(target ?? DEFAULT_GOAL_LINES));
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!timerOn || firstWriteAt == null) { setElapsedMs(0); return; }
    setElapsedMs(Date.now() - firstWriteAt);
    const i = setInterval(() => setElapsedMs(Date.now() - firstWriteAt), 1000);
    return () => clearInterval(i);
  }, [timerOn, firstWriteAt]);

  const commit = () => {
    const n = Number(draft);
    setWritingGoal(Number.isFinite(n) && n > 0 ? Math.round(n) : null);
    setEditing(false);
  };
  const clear = () => { setWritingGoal(null); setEditing(false); };

  const s = Math.floor(elapsedMs / 1000);
  const clock = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="wz-sliver-goal" data-target={target ?? ''} data-lines={lines}>
      {timerOn && <div className="wz-sliver-goal-timer">{clock}</div>}

      {target != null && (
        <div className="wz-sliver-goal-hairline" aria-hidden="true">
          <div className="wz-sliver-goal-hairline-fill" style={{ width: `${(fraction * 100).toFixed(1)}%` }} />
        </div>
      )}

      {editing ? (
        <div className="wz-sliver-goal-edit-row">
          <input
            className="wz-sliver-goal-edit-input"
            type="number"
            min={1}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { e.preventDefault(); setEditing(false); } }}
            autoFocus
          />
          <button type="button" className="wz-sliver-goal-edit-commit" onClick={commit}>{t('goalSet')}</button>
          <button type="button" className="wz-sliver-goal-edit-clear" onClick={clear}>{t('goalClear')}</button>
        </div>
      ) : (
        <button
          type="button"
          className="wz-sliver-goal-edit"
          onClick={() => { setDraft(String(target ?? DEFAULT_GOAL_LINES)); setEditing(true); }}
        >
          {target != null ? `${t('goalLabel')}: ${target} ${t('goalUnitLines')}` : t('goalEdit')}
        </button>
      )}
    </div>
  );
}
