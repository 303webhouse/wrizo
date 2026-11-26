// FLUX'S ALWAYS-ON GLITCH SWITCH (the flourish spec §4.1; Nick ruled option A, Nov 26): a small labelled switch in the meter lane beside the page count, next to
// what it controls. It flips Meter style GLITCH/BAR, the existing saved progress style ('rhizome' is Glitch). Pressing it keeps her focus in the page. The lane
// stands in a layer behind the writing column, so 13-desk-frame.css lifts that layer while it holds this switch (never in Wire In), or nothing could press it.
import { setWritingSettings, useWritingSettings } from '../store/writingSettings';
import { useDeskLexicon } from '../store/deskLexicon';

export function FluxGlitchSwitch() {
  const { t } = useDeskLexicon();
  const on = useWritingSettings().progressStyle === 'rhizome';
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={t('fluxGlitchSwitchName')} className="wz-glitch-switch" data-glitch-switch
      onMouseDown={(e) => e.preventDefault()} onClick={() => setWritingSettings({ progressStyle: on ? 'bar' : 'rhizome' })}>
      <span className="wz-glitch-switch-dot" aria-hidden="true" />
      <span aria-hidden="true">{t('fluxGlitchSwitch')}</span>
    </button>
  );
}
