import { Fragment, useState } from 'react';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { setWritingSettings, useWritingSettings } from '../../store/writingSettings';
import { DEFAULT_GOAL_LINES, setWritingGoal, useWritingGoal, type GoalUnit } from '../../store/writingGoal';
import type { PageStage } from '../pageStage';
import { setDistractionFree, setFlourishOff, setThemeTracker, themeTrackerOn, useDistractionFree, useFlourish } from '../../store/flourish';
import { useTheme } from '../../store/theme';

// THE SESSION, SHARED (Fable, Nov 22, 1:40 am; the Arbor spec section 7: "the session as the LAST item of the rail's DOCS menu (Arbor: PAGES): theme tracker ·
// goal · timer · progress, from the settings already on main"). One group for every theme's docs menu: Machina's DOCS renders it
// (reorg/panels/DocsPanel.tsx), Arbor's PAGES mounts the same one behind reorgFor('plateau') (ARBOR dresses it). Closed each time it mounts (in-session state,
// nothing stored). Its rows follow the stage table below; each writes today's own saved setting (store/writingGoal.ts; the timer, Progress tracking and
// themeTracker in store/writingSettings.ts): nothing new is stored. A Board has no session (the host decides).

// The stage table (accepted as drawn, Nick's walk Nov 20), with the plain Progress Tracker's switch ('tracker', components/PlainTracker.tsx) FIRST: the Arbor spec
// section 7, shared across themes (Fable, Nov 22, 1:40 am): "Use theme progress tracker · the goal · the timer · progress".
export const SESSION_ROWS: Record<PageStage, ('goal' | 'counts' | 'timer' | 'progress' | 'tracker')[]> = {
  sprint: ['tracker', 'goal', 'counts', 'timer', 'progress'],
  build: ['tracker', 'goal', 'timer', 'progress'],
  edit: ['tracker', 'progress'],
};

function SessionToggle({ row, label, on, onPick, t, off }: { row: string; label: string; on: boolean; onPick: (on: boolean) => void; t: (k: DeskTermId) => string; off?: boolean }) {
  return (
    <div className="wz-reorg-default" data-session-row={row} data-session-quieted={off ? 'true' : undefined}>
      <span className="wz-reorg-default-label" id={`wz-reorg-session-${row}`}>{label}</span>
      <span className="wz-reorg-toggle" role="group" aria-labelledby={`wz-reorg-session-${row}`}>
        <button type="button" data-toggle="off" aria-pressed={!on} disabled={off} onClick={() => onPick(false)}>{t('reorgOff')}</button>
        <button type="button" data-toggle="on" aria-pressed={on} disabled={off} onClick={() => onPick(true)}>{t('reorgOn')}</button>
      </span>
    </div>
  );
}

// GLITCH v2 (the flourish spec §1.5, build notes): under the tracker's switch, the theme's meter style - Flux "Meter style · Bar | Glitch" and its Flicker; Arbor "Progress style · Bar | Rhizome".
// The style is her flourish on or off (store/flourish.ts); Flicker is today's saved switch. Machina keeps its tracker switch alone.
function FlourishRows({ t, off }: { t: (k: DeskTermId) => string; off?: boolean }) {
  const theme = useTheme();
  const settings = useWritingSettings();
  const flux = useFlourish('flux');
  const arbor = useFlourish('plateau');
  if (theme !== 'flux' && theme !== 'plateau') return null;
  const on = theme === 'flux' ? flux : arbor;
  return (
    <>
      <div className="wz-reorg-default" data-session-row="meterstyle" data-session-quieted={off ? 'true' : undefined}>
        <span className="wz-reorg-default-label" id="wz-reorg-session-meterstyle">{theme === 'flux' ? t('sessionMeterStyle') : t('progressStyleLabel')}</span>
        <span className="wz-reorg-toggle" role="group" aria-labelledby="wz-reorg-session-meterstyle">
          <button type="button" data-pick="bar" aria-pressed={!on} disabled={off} onClick={() => setFlourishOff(theme, true)}>{t('progressStyleBar')}</button>
          <button type="button" data-pick="flourish" aria-pressed={on} disabled={off} onClick={() => setFlourishOff(theme, false)}>{t('progressStyleRhizome')}</button>
        </span>
      </div>
      {theme === 'flux' && (
        <>
          <p className="wz-reorg-session-hint" data-session-hint="meterstyle">{on ? t('sessionGlitchHint') : t('sessionBarHint')}</p>
          <SessionToggle row="flicker" label={t('footMenuFlicker')} on={settings.flicker} onPick={(v) => setWritingSettings({ flicker: v })} t={t} off={off} />
          <p className="wz-reorg-session-hint" data-session-hint="flicker">{t('sessionFlickerHint')}</p>
        </>
      )}
    </>
  );
}

/** The Session: the last item of the rail's docs menu (Machina's DOCS; Arbor's PAGES mounts the same group, ARBOR dresses it), closed each time it mounts. */
export function SessionGroup({ stage }: { stage: PageStage }) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  const theme = useTheme();
  useFlourish('machina');   // the tracker row also says whether Machina's Run is hers (store/flourish.ts)
  const quiet = useDistractionFree();   // while it is on, the rows under it are greyed; each keeps her choice (the flourish spec §7.1)
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<GoalUnit>(() => goal?.unit ?? 'lines');
  const [draft, setDraft] = useState(() => String(goal?.n ?? DEFAULT_GOAL_LINES));
  // the goal's number is written as the goal box in the foot wrote it: a whole number above nothing, else the goal is cleared
  const commit = (u: GoalUnit = unit) => { const n = Number(draft); setWritingGoal(Number.isFinite(n) && n > 0 ? { n: Math.round(n), unit: u } : null); };
  // what it counts changes the stored goal only when there is one (a unit alone is not a goal)
  const pickUnit = (u: GoalUnit) => { setUnit(u); if (goal != null) commit(u); };
  return (
    <section className="wz-reorg-group" data-reorg-group="session" aria-label={t('reorgSession')}>
      <button type="button" className="wz-reorg-group-head wz-reorg-session-fold" data-session-fold aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{t('reorgSession')}</span>
      </button>
      {/* Distraction Free, the first row in every theme. It is not one of the stage table's rows, so it is not marked as one */}
      {open && (
        <div className="wz-reorg-default wz-session-quiet" data-session-df={quiet ? 'on' : 'off'}>
          <span className="wz-reorg-default-label" id="wz-reorg-session-quiet">{t('sessionQuiet')}</span>
          <span className="wz-reorg-toggle" role="group" aria-labelledby="wz-reorg-session-quiet" aria-describedby="wz-reorg-session-quiet-hint">
            <button type="button" data-toggle="off" aria-pressed={!quiet} onClick={() => setDistractionFree(false)}>{t('reorgOff')}</button>
            <button type="button" data-toggle="on" aria-pressed={quiet} onClick={() => setDistractionFree(true)}>{t('reorgOn')}</button>
          </span>
          <span className="wz-session-quiet-hint" id="wz-reorg-session-quiet-hint">{t('sessionQuietHint')}</span>
          {quiet && <span className="wz-session-quiet-hint" role="status">{t('sessionQuietOn')}</span>}
        </div>
      )}
      {open && SESSION_ROWS[stage].map((row) => {
        if (row === 'goal') return (
          <label key={row} className="wz-reorg-default" data-session-row="goal" data-session-quieted={quiet ? 'true' : undefined}>
            <span className="wz-reorg-default-label">{t('reorgSessionGoal')}</span>
            <input type="number" min={1} className="wz-reorg-session-goal" value={draft} aria-label={t('reorgSessionGoal')} disabled={quiet}
              onChange={(e) => setDraft(e.target.value)} onBlur={() => commit()}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} />
          </label>
        );
        if (row === 'counts') return (
          <div key={row} className="wz-reorg-default" data-session-row="counts" data-session-quieted={quiet ? 'true' : undefined}>
            <span className="wz-reorg-default-label" id="wz-reorg-session-counts">{t('reorgSessionCounts')}</span>
            <span className="wz-reorg-toggle" role="group" aria-labelledby="wz-reorg-session-counts">
              <button type="button" data-pick="lines" aria-pressed={unit === 'lines'} disabled={quiet} onClick={() => pickUnit('lines')}>{t('reorgSessionLines')}</button>
              <button type="button" data-pick="words" aria-pressed={unit === 'words'} disabled={quiet} onClick={() => pickUnit('words')}>{t('reorgSessionWords')}</button>
            </span>
          </div>
        );
        if (row === 'timer') return <SessionToggle key={row} row="timer" label={t('reorgSessionTimer')} on={settings.timer} onPick={(on) => setWritingSettings({ timer: on })} t={t} off={quiet} />;
        if (row === 'tracker') return <Fragment key={row}><SessionToggle row="tracker" label={t('plainTrackerSwitch')} on={themeTrackerOn(theme, settings.themeTracker)} onPick={(on) => setThemeTracker(theme, on)} t={t} off={quiet} /><FlourishRows t={t} off={quiet} /></Fragment>;
        return <SessionToggle key={row} row="progress" label={t('reorgSessionProgress')} on={settings.instrumentsOn} onPick={(on) => setWritingSettings({ instrumentsOn: on })} t={t} off={quiet} />;
      })}
    </section>
  );
}
