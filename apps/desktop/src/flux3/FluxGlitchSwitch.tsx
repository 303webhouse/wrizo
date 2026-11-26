// FLUX'S ALWAYS-ON GLITCH SWITCH (the flourish spec §4.1; Nick ruled option A, Nov 26): a small labelled switch in the meter lane beside the page count, next to
// what it controls. It flips Meter style GLITCH/BAR, the existing saved progress style ('rhizome' is Glitch). Pressing it keeps her focus in the page.
//
// TWO ELEMENTS, ONE PLACE: the lane stands in a layer BEHIND the writing column (desk-frame-rhizome-anchor), so nothing in it can be pressed. A hidden copy keeps
// the switch's room in the lane beside the count; the real button is drawn on the stage, above the column and below the drawers, over that copy's rect. It takes no
// room there, so it never moves the page.
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { setWritingSettings, useWritingSettings } from '../store/writingSettings';
import { useDeskLexicon } from '../store/deskLexicon';

export function FluxGlitchSwitch() {
  const { t } = useDeskLexicon();
  const on = useWritingSettings().progressStyle === 'rhizome';
  const slot = useRef<HTMLSpanElement>(null);
  const [at, setAt] = useState<{ stage: HTMLElement; left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = slot.current;
    const stage = el?.closest<HTMLElement>('.desk-frame-stage');
    if (!el || !stage) { setAt(null); return undefined; }
    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
      const left = Math.round((r.left - s.left) * 10) / 10, top = Math.round((r.top - s.top) * 10) / 10;
      setAt((was) => (was && was.stage === stage && was.left === left && was.top === top ? was : { stage, left, top }));
    };
    const later = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    // the lane moves with the stage's size, with the count's own width, and with the split (a stage attribute, no size change)
    const sizes = new ResizeObserver(later);
    sizes.observe(stage);
    const lane = el.closest<HTMLElement>('.desk-frame-instrument');
    if (lane) sizes.observe(lane);
    const attrs = new MutationObserver(later);
    attrs.observe(stage, { attributes: true });
    if (lane) attrs.observe(lane, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', later);
    const settle = window.setTimeout(later, 400);   // the page count arrives once the page's breaks are laid out
    return () => { sizes.disconnect(); attrs.disconnect(); window.removeEventListener('resize', later); window.clearTimeout(settle); if (frame) cancelAnimationFrame(frame); };
  });

  const face = (
    <>
      <span className="wz-glitch-switch-dot" aria-hidden="true" />
      <span aria-hidden="true">{t('fluxGlitchSwitch')}</span>
    </>
  );
  return (
    <>
      <span ref={slot} className="wz-glitch-switch wz-glitch-switch--slot" aria-hidden="true">{face}</span>
      {at && createPortal(
        <button type="button" role="switch" aria-checked={on} aria-label={t('fluxGlitchSwitchName')} className="wz-glitch-switch wz-glitch-switch--live" data-glitch-switch
          style={{ left: at.left, top: at.top }}
          onMouseDown={(e) => e.preventDefault()} onClick={() => setWritingSettings({ progressStyle: on ? 'bar' : 'rhizome' })}>
          {face}
        </button>,
        at.stage,
      )}
    </>
  );
}
