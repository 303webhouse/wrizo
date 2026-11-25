// BOARD ZOOM FOR ARBOR AND MACHINA (ARBOR, Nov 24; Fable's orders, ARBOR item 1; Nick: "in to 4x and out"). The full Board in Arbor (plateau) and Machina gets FLUX'S CAMERA (flux3/useFluxCamera.ts,
// flux-zoom-1) as it is: one scale for the whole canvas by a transform (nothing reflows, the frame never moves), between the same limits (4.00 in; out to the board's longer side at 60% of the stage's
// shorter side, 0.10 .. 1.00), on the same hands (Ctrl/Cmd + wheel about the pointer, Ctrl + = / - one x1.25 notch about the centre, Ctrl + 0 true size, the two-finger pinch about its midpoint),
// and NOTHING SAVED (the session keeps a board's scale when she leaves and comes back; a reload reads 1.00). The board's pointer maths already carries the scale (getBoardScale, 1 everywhere else).
// THE BAR: out, the readout, in, laid OVER the frame's lower-left corner (an overlay: it takes no room, so neither the frame nor any card moves). The readout is the way home (a click is Ctrl + 0).
// Its words are the lexicon's existing keys (Zoom, Zoom Out, Zoom In, Reset zoom (Ctrl + 0)); the figure is each theme's own: Arbor a whole percent, Machina two decimals and a times sign.
// Flux keeps its own (the Schema mounts the camera under ?flux3=1), so this is gated to the two themes and never mounts twice.
import type { RefObject } from 'react';
import { useTheme } from '../store/theme';
import { useAmbianceDial } from '../store/ambianceDial';
import { useDeskLexicon } from '../store/deskLexicon';
import { ZOOM_NOTCH, useBoardScale, zoomHome, zoomStep } from '../flux3/boardZoom';
import { useFluxCamera } from '../flux3/useFluxCamera';

interface Props {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  /** The board's id: a different board is a different camera (the session's scale for it, else 1.00). */
  boardId: string;
  /** Above every card (each card stands at its stored z), as Flux's footer stands. */
  zTop: number;
}

export function BoardZoom(props: Props) {
  const theme = useTheme();
  const on = theme === 'plateau' || theme === 'machina';
  return on ? <Camera {...props} machina={theme === 'machina'} /> : null;
}

function Camera({ wrapRef, canvasRef, boardId, zTop, machina }: Props & { machina: boolean }) {
  const dial = useAmbianceDial();
  const { t } = useDeskLexicon();
  const s = useBoardScale();
  useFluxCamera({ wrapRef, canvasRef, boardId, active: true, motion: dial > 0 });
  const figure = machina ? `${s.toFixed(2)}×` : `${Math.round(s * 100)}%`;
  // the bar takes its own presses only: a press on it never reaches the board (no card made, no selection dropped)
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <div className="board-zoom" data-board-zoom="" role="group" aria-label={t('flux3ReadZoom')} style={{ zIndex: zTop }} onPointerDown={stop} onMouseDown={stop} onDoubleClick={stop}>
      <button type="button" data-board-zoom-act="out" aria-label={t('reorgSplitZoomOut')} title={t('reorgSplitZoomOut')} onClick={() => zoomStep(1 / ZOOM_NOTCH)}>−</button>
      <button type="button" data-board-zoom-act="home" title={t('flux3ZoomReset')} aria-label={t('flux3ZoomReset')} data-board-zoom-scale={s} onClick={() => zoomHome()}>{figure}</button>
      <button type="button" data-board-zoom-act="in" aria-label={t('reorgSplitZoomIn')} title={t('reorgSplitZoomIn')} onClick={() => zoomStep(ZOOM_NOTCH)}>+</button>
    </div>
  );
}
