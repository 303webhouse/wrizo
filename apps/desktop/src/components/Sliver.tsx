import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { useWritingSettings, setWritingSettings, setTypewriterExplicit } from '../store/writingSettings';
import { useWritingGoal, setWritingGoal, DEFAULT_GOAL_LINES } from '../store/writingGoal';
import { useGoalUnit, setGoalUnit, type GoalUnit } from '../store/writingGoalUnit';
import { countLineEquivalents } from '../store/lineEquivalents';
import { TypewriterToggle } from './WritingIncentives';
// FX3 S5 — the writing-settings gear leaves the paper entirely and moves to
// the sliver's own foot (below); rather than duplicate SettingsPanel/
// ThemePanel/Seg/GearIcon's JSX here, they're exported from ModeStage.tsx
// (their original home — gear/theme selection stays exactly the same
// mechanism, just reached from a new place) and reused verbatim, with a
// scoped CSS override (index.css's `.wz-sliver-instruments .mode-settings`)
// repositioning their popover to sit inline in the sliver's own scrolling
// panel instead of ModeStage's absolute stage-corner placement.
import { SettingsPanel, ThemePanel, Seg, GearIcon } from './ModeStage';
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
    }
  // AB4 S5 — the Board's own hand tool(s). FX4 S6 — the Connect toggle
  // RETIRES (replaced by BoardEditor.tsx's own handle-drag thread gesture:
  // double-click the selected card's resize handle, drag, release inside a
  // target card); the sliver carries Add card alone now. Everything else
  // in the sliver (the goal foot, the instruments row) is shared furniture
  // every framed surface already carries — this union member only ever
  // governs SliverToolsBody's own per-mode section, same as
  // 'freewrite'/'draft' above.
  | {
      kind: 'board';
      // B1 S3 — both optional now: on a system Board, BoardEditor.tsx
      // passes neither at all — "the sliver's Add action must be absent on
      // system boards," an absence in the DOM, not merely an inert click
      // (Delete on a derived card gets that inert-click treatment instead;
      // Add gets this one). Undefined, never a no-op function, is the
      // signal SliverToolsBody below reads to skip rendering each button.
      onAddCard?: () => void;
      // FX6 S2b — "New page card": a real page, created AND pinned to this
      // board in one act (BoardEditor.tsx's own onAddPageCard) — the
      // board-side door Nick reached for and couldn't find.
      onAddPageCard?: () => void;
      // B2 S5 — "Existing page…": beside FX6's New page card, a quiet
      // picker that PINS a chosen EXISTING page onto this board (membership,
      // never filing — see ExistingPagePicker.tsx's own header comment).
      // Same absent-not-disabled law as the two Add controls above: on a
      // system Board, BoardEditor.tsx passes none of the three at all.
      onAddExistingPage?: () => void;
      // B3 S3 — door 2: "From a deck…", beside the Board's own existing Add
      // options. Same absent-not-disabled law: BoardEditor.tsx passes this
      // only on an ordinary (non-system) Board.
      onAddFromDeck?: () => void;
      // FX5 S5 — the connections-footer's own per-board visibility toggle,
      // the sliver's THIRD board control ("Add card + this, two controls"
      // — the brief's own words, now three with FX6's own addition).
      footer: { on: boolean; onToggle: (on: boolean) => void };
    };

export interface SliverProps {
  content: SliverContent;
  // The page's current raw text, for the goal block's line-equivalents
  // progress (store/lineEquivalents.ts) — viewport-independent, computed
  // fresh on every render (cheap: a handful of string splits).
  goalText: string;
  // FX3 S5 — threaded through from the host (PageEditor.tsx has its own
  // `milestones` already; ScriptEditor.tsx has no milestones concept at all
  // and simply never passes this) so the relocated gear's Progress:Project
  // option can apply the SAME "no greyed states" silent-degrade rule
  // ModeStage.tsx's own gear always has (M1, canon Q3) — absent/false reads
  // as "no plan to project," exactly like a plan-less project already did.
  hasMilestones?: boolean;
}

export function Sliver({ content, goalText, hasMilestones }: SliverProps) {
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
        {/* FX3 S5 — the foot's new instruments row, beneath the goal block.
            Nested inside THIS panel (which already carries chrome-fade
            desk-dissolve) so its own open gear/instruments popovers dissolve
            on a keystroke through the exact same ambient mechanism, with no
            separate close-on-keystroke logic of its own (S6's "one
            vanishing engine" requirement — see the panel's own header
            comment on the dissolve law). */}
        <SliverInstrumentRow hasMilestones={hasMilestones} target={target} />
      </div>
    </div>
  );
}

function SliverToolsBody({ content }: { content: SliverContent }) {
  const { t } = useDeskLexicon();

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

      {/* FX3 S5 — the typewriter toggle (formerly here, with the READING
          label + "Typewriter" text) moved DOWN to the foot's new
          instruments row (SliverInstrumentRow, below SliverGoalFoot) as an
          icon-only control — not duplicated, moved: this section is gone,
          not merely relabeled. aria-label keeps the word for assistive tech
          (TypewriterToggle's own aria-label, WritingIncentives.tsx,
          unchanged) even though no visible text remains anywhere. */}

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

      {/* AB4 S5 / FX4 S6 — the board's own hand tool: Add card alone now
          (the Connect toggle retired — see this file's own SliverContent
          comment).
          B1 S3 — on a system Board, BoardEditor.tsx passes neither
          onAddCard nor onAddPageCard at all: both buttons below are
          genuinely absent from the DOM there, not merely disabled. */}
      {content.kind === 'board' && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('railBoard')}</div>
          {content.onAddCard && (
            <button type="button" className="wz-sliver-item wz-sliver-item-btn" onClick={content.onAddCard}>
              {t('boardAddCard')}
            </button>
          )}
          {/* FX6 S2b — the board-side New Page door: a real page, created
              AND pinned to this board in one act. */}
          {content.onAddPageCard && (
            <button type="button" className="wz-sliver-item wz-sliver-item-btn" onClick={content.onAddPageCard}>
              {t('boardNewPageCard')}
            </button>
          )}
          {/* B2 S5 — "Existing page…", beside New page card. */}
          {content.onAddExistingPage && (
            <button type="button" className="wz-sliver-item wz-sliver-item-btn" onClick={content.onAddExistingPage}>
              {t('boardAddExistingPage')}
            </button>
          )}
          {/* B3 S3 — door 2: "From a deck…", opening the deck library as a
              pop-out over this board (DeckWizard.tsx). */}
          {content.onAddFromDeck && (
            <button type="button" className="wz-sliver-item wz-sliver-item-btn" onClick={content.onAddFromDeck}>
              {t('deckWizardFromDeck')}
            </button>
          )}
          {/* FX5 S5 — the footer toggle, the sliver's third board control. */}
          <SliverToggle
            label={t('boardFooterToggle')}
            on={content.footer.on}
            onToggle={() => content.footer.onToggle(!content.footer.on)}
            className="wz-sliver-board-footer"
          />
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
  // FX3 S5 — the instruments panel's own on/off (SliverInstrumentRow,
  // below), an ADDITIONAL gate on the hairline alongside the existing
  // target-null check — see GoalGlow.tsx's matching comment for the same
  // "additive, not a replacement" reasoning (clearing the target already
  // hides this; this just lets a writer hide it without losing the number).
  const settings = useWritingSettings();
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

      {target != null && settings.instrumentsOn && (
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

// FX3 S5 — the sliver foot's new quiet icon row, beneath the goal block:
// (1) the typewriter toggle, ICON ONLY (moved here from SliverToolsBody's
// old "READING" section — see that removal's own comment); (2) the
// writing-settings gear, relocated whole from the paper (ModeStage.tsx no
// longer mounts it when framed) — SettingsPanel AND ThemePanel travel
// together behind the SAME gear click, exactly as they did there, rather
// than splitting the theme switcher off to some new, brief-unspecified
// home (the brief's own "don't leave an orphaned half-gear if you split
// them" — the safest reading, given the foot row's three icons are already
// spoken for and nothing in S5 names a fourth place for Theme, is to move
// the gear WHOLE); (3) a new instruments icon (a minimal, working-value
// panel — store/writingGoalUnit.ts's own header comment has the "committee
// pass refines this" caveat in full). All three buttons are `--text-mid`/
// olive at rest (`.wz-sliver-instruments-btn`, index.css) — brass appears
// only on hover, matching the sliver's own pre-existing law elsewhere.
function SliverInstrumentRow({ hasMilestones, target }: { hasMilestones?: boolean; target: number | null }) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();
  const [gearOpen, setGearOpen] = useState(false);
  const [instrumentsOpen, setInstrumentsOpen] = useState(false);

  return (
    <div className="wz-sliver-instruments">
      <div className="wz-sliver-instruments-row">
        <TypewriterToggle on={settings.typewriter} onToggle={() => setTypewriterExplicit(!settings.typewriter)} />
        <button
          type="button"
          className="wz-sliver-instruments-btn"
          aria-label="Writing settings"
          aria-expanded={gearOpen}
          onClick={() => { setGearOpen(o => !o); setInstrumentsOpen(false); }}
        >
          <GearIcon />
        </button>
        <button
          type="button"
          className="wz-sliver-instruments-btn"
          aria-label={t('sliverInstruments')}
          title={t('sliverInstruments')}
          aria-expanded={instrumentsOpen}
          onClick={() => { setInstrumentsOpen(o => !o); setGearOpen(false); }}
        >
          <InstrumentsIcon />
        </button>
      </div>
      {gearOpen && (
        <SettingsPanel
          settings={{ progress: settings.progress, fadeDepth: settings.fadeDepth, timer: settings.timer, typewriter: settings.typewriter }}
          hasMilestones={hasMilestones}
        />
      )}
      {gearOpen && <ThemePanel />}
      {instrumentsOpen && <InstrumentsPanel target={target} />}
    </div>
  );
}

// The instruments panel — S5's own working-value list, verbatim: on/off,
// unit preference (words/lines/time), target value. Reuses .mode-settings'
// look (via Seg/the shared class, index.css scopes its position when
// nested here) and the SAME goal edit affordance SliverGoalFoot's inline
// edit already uses (store/writingGoal.ts) — this is a second surface onto
// the SAME target, not an independent value.
function InstrumentsPanel({ target }: { target: number | null }) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();
  const unit = useGoalUnit();
  const [draft, setDraft] = useState(() => String(target ?? DEFAULT_GOAL_LINES));

  const commit = () => {
    const n = Number(draft);
    setWritingGoal(Number.isFinite(n) && n > 0 ? Math.round(n) : null);
  };
  const clear = () => setWritingGoal(null);

  const unitOpts: [string, string][] = [['lines', 'Lines'], ['words', 'Words'], ['time', 'Time']];

  return (
    <div className="mode-settings wz-sliver-instruments-panel" role="menu">
      <h4>{t('sliverInstruments')}</h4>
      <Seg
        label={t('sliverInstrumentsShow')}
        value={settings.instrumentsOn ? 'on' : 'off'}
        opts={[['on', 'On'], ['off', 'Off']]}
        onPick={v => setWritingSettings({ instrumentsOn: v === 'on' })}
      />
      <Seg
        label={t('sliverInstrumentsUnit')}
        value={unit}
        opts={unitOpts}
        onPick={v => setGoalUnit(v as GoalUnit)}
      />
      <div className="wz-sliver-goal-edit-row">
        <input
          className="wz-sliver-goal-edit-input"
          type="number"
          min={1}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        />
        <button type="button" className="wz-sliver-goal-edit-commit" onClick={commit}>{t('goalSet')}</button>
        <button type="button" className="wz-sliver-goal-edit-clear" onClick={clear}>{t('goalClear')}</button>
      </div>
      {/* Honest working-value note (store/writingGoalUnit.ts's own header
          comment has the full reasoning) — the unit above doesn't yet
          change how the target number itself is computed; it only labels
          it. The committee pass is the ticket that will wire real
          per-unit conversion. */}
      <div className="mode-settings-hint">
        {target != null ? `${t('goalLabel')}: ${target} ${unit === 'lines' ? t('goalUnitLines') : unit}` : t('goalEdit')}
      </div>
    </div>
  );
}

function InstrumentsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="4" x2="5" y2="20" />
      <circle cx="5" cy="9" r="2.2" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <circle cx="12" cy="15" r="2.2" />
      <line x1="19" y1="4" x2="19" y2="20" />
      <circle cx="19" cy="7" r="2.2" />
    </svg>
  );
}
