import { useRef, useState } from 'react';
import type { DeskTermId } from '../../store/lexicon/terms';
import { PLAN_PRESETS, type PlanPreset } from './planPresets';
import { STRUCTURE_NOTES } from '../presetNotes';
import { PresetNoteButton } from '../PresetNote';
import { CompareStructures } from './CompareStructures';

// THE PRESETS CONTROL (planPresets.ts), one for both places a starting shape can be loaded: the Back menu's PLAN tab (BackPlan.tsx) and a Board's Plan (Outline) view (BoardProjection.tsx). A button that opens the
// three presets by name; a press loads one and closes the list. Whatever loads is the caller's (it writes the rows: planPresetOps.ts presetBoxes).
export function PresetsMenu({ t, disabled, onPick }: { t: (k: DeskTermId) => string; disabled?: boolean; onPick: (preset: PlanPreset) => void }) {
  const [open, setOpen] = useState(false);
  const [comparing, setComparing] = useState(false);   // Compare Structures (item 18): a view of two structures in place of the list; it writes nothing
  const compareBtn = useRef<HTMLButtonElement>(null);
  return (
    <div className="wz-back-plan-presets" data-plan-presets-menu="">
      <button type="button" className="wz-back-plan-btn wz-back-plan-part" data-plan-presets="" aria-expanded={open} aria-haspopup="true" disabled={disabled} aria-label={t('reorgPlanPresetsLabel')} onClick={() => setOpen((o) => !o)}>{t('reorgPlanPresets')}</button>
      {open && comparing && (
        <CompareStructures t={t} onPick={(p) => { setComparing(false); setOpen(false); onPick(p); }} onClose={() => { setComparing(false); window.setTimeout(() => compareBtn.current?.focus(), 0); }} />
      )}
      {open && !comparing && (
        <ul className="wz-back-plan-preset-list" data-plan-preset-list="">
          {PLAN_PRESETS.map((p) => {
            const note = STRUCTURE_NOTES[p.id];   // the new structures carry a "?" (presetNotes.ts); the live three stay as they were
            return <li key={p.id}><button type="button" className="wz-back-plan-btn wz-back-plan-part" data-plan-preset={p.id} onClick={() => { setOpen(false); onPick(p); }}>{t(p.name)}</button>{note && <PresetNoteButton id={p.id} name={t(p.name)} note={note} />}</li>;
          })}
          {/* COMPARE STRUCTURES (PRESETS-B item 18; the words are PROPOSED): the foot of the list. */}
          <li><button type="button" ref={compareBtn} className="wz-back-plan-btn wz-back-plan-part" data-plan-compare="" onClick={() => setComparing(true)}>{t('reorgCompare')}</button></li>
        </ul>
      )}
    </div>
  );
}
