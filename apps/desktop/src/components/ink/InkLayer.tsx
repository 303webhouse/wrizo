import { useEffect, useState } from 'react';
import type { InkStratum, InkStratumProps } from '../InkStratum';

// VISUAL 1a.1 - WHAT LOADS (Fable, Nov 25): the painter (InkStratum) loads where a page has saved ink; the stroke input loads on the first INK open (InkStratum asks for it); a page with
// no ink and no open INK loads neither. This is the part in the first download: until the painter is needed it draws the stratum's own blank layers, so the sheet's DOM is as it always was.
// (The committed canvas keeps `will-change: transform` while blank: without that layer the native caret was not painted on a Typewriter page - see InkStratum's paintCommitted.)
// Once needed, the painter stays for as long as the page does (its one-level Undo lives in it). A failed fetch leaves the blank layers and tries again on the next mode change.
let loaded: typeof InkStratum | null = null;

const FILL: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' };

export function InkLayer(props: InkStratumProps) {
  const wanted = props.strokes.length > 0 || props.permission === 'edit';
  const [needed, setNeeded] = useState(wanted);
  if (wanted && !needed) setNeeded(true);
  const [Painter, setPainter] = useState<typeof InkStratum | null>(() => loaded);

  // INK opened: fetch the stroke input ALONGSIDE the painter, not after it, so the gap before her first stroke can be drawn is one request, not two
  useEffect(() => {
    if (props.permission === 'edit') void import('./inkCapture').catch(() => {});
  }, [props.permission]);

  useEffect(() => {
    if (!needed || Painter) return;
    let alive = true;
    import('../InkStratum')
      .then((m) => { loaded = m.InkStratum; if (alive) setPainter(() => m.InkStratum); })
      .catch(() => { /* tried again when the permission changes */ });
    return () => { alive = false; };
  }, [needed, Painter, props.permission]);

  if (needed && Painter) return <Painter {...props} />;
  return (
    <>
      <canvas className="ink-canvas ink-committed wz-ink-stratum" aria-hidden="true" data-ink-permission={props.permission} width={1} height={1} style={{ ...FILL, willChange: 'transform' }} />
      <canvas className="ink-canvas ink-active" aria-hidden="true" width={1} height={1} style={FILL} />
    </>
  );
}
