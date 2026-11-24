import { useState } from 'react';
import type { DeskTermId } from '../../store/lexicon/terms';
import { PLAN_PRESETS, type PlanPreset } from './planPresets';
import { STRUCTURE_NOTES } from '../presetNotes';
import { PresetNoteButton } from '../PresetNote';

// THE PRESETS CONTROL (planPresets.ts), one for both places a starting shape can be loaded: the Back menu's PLAN tab (BackPlan.tsx) and a Board's Plan (Outline) view (BoardProjection.tsx). A button that opens the
// three presets by name; a press loads one and closes the list. Whatever loads is the caller's (it writes the rows: planPresetOps.ts presetBoxes).
export function PresetsMenu({ t, disabled, onPick }: { t: (k: DeskTermId) => string; disabled?: boolean; onPick: (preset: PlanPreset) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="wz-back-plan-presets" data-plan-presets-menu="">
      <button type="button" className="wz-back-plan-btn wz-back-plan-part" data-plan-presets="" aria-expanded={open} aria-haspopup="true" disabled={disabled} aria-label={t('reorgPlanPresetsLabel')} onClick={() => setOpen((o) => !o)}>{t('reorgPlanPresets')}</button>
      {open && (
        <ul className="wz-back-plan-preset-list" data-plan-preset-list="">
          {PLAN_PRESETS.map((p) => {
            const note = STRUCTURE_NOTES[p.id];   // the new structures carry a "?" (presetNotes.ts); the live three stay as they were
            return <li key={p.id}><button type="button" className="wz-back-plan-btn wz-back-plan-part" data-plan-preset={p.id} onClick={() => { setOpen(false); onPick(p); }}>{t(p.name)}</button>{note && <PresetNoteButton id={p.id} name={t(p.name)} note={note} />}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
