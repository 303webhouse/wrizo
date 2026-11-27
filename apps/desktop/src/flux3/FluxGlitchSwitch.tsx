// FLUX'S ALWAYS-ON GLITCH SWITCH (the flourish spec §4.1; Nick ruled option A, Nov 26): a small labelled switch in the meter lane beside the page count, next to
// what it controls. It flips Flux's flourish (her flourishOff.flux, spec §7; store/flourish.ts) - Meter style GLITCH/BAR follows it. Pressing keeps her focus. The lane
// stands in a layer behind the writing column, so 13-desk-frame.css lifts that layer while it holds this switch (never in Wire In), or nothing could press it.
import { flourishPinned, setFlourishOff, useFlourish } from '../store/flourish';
import { useDeskLexicon } from '../store/deskLexicon';

export function FluxGlitchSwitch() {
  const { t } = useDeskLexicon();
  const on = useFlourish('flux');
  if (flourishPinned()) return null;   // older checks were written for the lane without it
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={t('fluxGlitchSwitchName')} className="wz-glitch-switch" data-glitch-switch
      onMouseDown={(e) => e.preventDefault()} onClick={() => setFlourishOff('flux', on)}>
      <span className="wz-glitch-switch-dot" aria-hidden="true" />
      <span aria-hidden="true">{t('fluxGlitchSwitch')}</span>
    </button>
  );
}
