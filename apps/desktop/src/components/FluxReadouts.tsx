import { useEffect, useRef, useState } from 'react';
import { effectiveAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { firstLine } from '../store/entryText';
import { coordReadout, docReadout, hintFor, shouldAcquire, trackReadout, type HintSurface } from '../store/fluxReadouts';
import { docNumberOf, trackOf } from '../store/place';
import { useTheme } from '../store/theme';
import type { JournalEntry } from '../types';

// FLUX V2 - THE PAGE FRAME'S READOUTS. Flux only (Arbor renders nothing). Mounted inside the lit page (ModeStage's `readouts` slot), absolutely positioned in the paper's own padding, so the page's
// rect never moves (PAGE IS PRIMARY). Three things: a frame ring (a faint grid on the page FRAME only, never under text) with four corner brackets; a header with the page's true reading
// (DOC nn // title, TRK n/m); and a hint line for the surface. Every string comes from store/fluxReadouts.ts. The whole set carries chrome-fade, so it recedes with the rest of the
// chrome while the writer types. The brackets close in ONCE when a page is opened (300 ms) - and stay still when motion is reduced or Ambiance is 0.
function motionAllowed(): boolean {
  return !prefersReducedMotion() && effectiveAmbianceDial() > 0;
}

export function FluxReadouts({ entry, surface }: { entry: JournalEntry | null; surface: HintSurface }) {
  const theme = useTheme();
  const id = entry ? entry.id : null;
  const last = useRef<string | null>(null);
  const [acquire, setAcquire] = useState(() => { last.current = id; return shouldAcquire(null, id) && motionAllowed(); });
  useEffect(() => {
    if (last.current === id) return;
    const go = shouldAcquire(last.current, id) && motionAllowed();
    last.current = id;
    setAcquire(go);
  }, [id]);
  if (theme !== 'flux' || !entry) return null;
  const doc = docNumberOf(entry);
  const trk = trackOf(entry);
  const title = firstLine(entry.text).slice(0, 48).trim() || 'Untitled';
  const hint = hintFor(surface);
  return (
    <div className="flux-readouts chrome-fade" data-flux-readouts="true" aria-hidden="true">
      <div className="flux-frame" />
      <div className="flux-brackets" data-acquire={acquire ? 'true' : 'false'} />
      <div className="flux-readout flux-readout-head">
        {doc != null && <span className="flux-readout-doc">{docReadout(doc, title)}</span>}
        {trk && <span className="flux-readout-trk">{trackReadout(trk.n, trk.m)}</span>}
      </div>
      {hint && <div className="flux-readout flux-readout-hint">{hint}</div>}
    </div>
  );
}

// FLUX V2 - the board's frame: the same grid ring and corner brackets the page wears, over the board's own canvas, and the board's own hint line. Flux only.
export function FluxBoardFrame() {
  const theme = useTheme();
  if (theme !== 'flux') return null;
  return (
    <div className="flux-readouts flux-board-frame chrome-fade" data-flux-board-frame="true" aria-hidden="true">
      <div className="flux-frame" />
      <div className="flux-brackets" data-acquire="false" />
      <div className="flux-readout flux-readout-hint">{hintFor('board')}</div>
    </div>
  );
}

// FLUX V2 - a node's true position: X ### · Y ### (thousandths of the board, clamped), on the card itself. Flux only; it never takes a click.
export function FluxCardCoord({ x, y }: { x: number; y: number }) {
  const theme = useTheme();
  if (theme !== 'flux') return null;
  return <div className="flux-card-coord" aria-hidden="true">{coordReadout(x, y)}</div>;
}
