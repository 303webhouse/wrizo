// FLUX3 S1 - THE SCHEMA LIVE VIEW (flux-rulings-oct31.md q1, q9, q11; the spec's §4): the board in Flux, behind ?flux3=1. The Schema is a SKIN of
// the existing board engine: the cards stay the board's own DOM, and this component adds only what lies under and over them:
//   - the drawing layer (flux3-layer.ts) UNDER the cards: the ground, the links square to square, the electrons on the selected node's links,
//     a new link lighting once. It is hosted by the board's own frame (the wrap's parent), sized to the VISIBLE board, never to the whole canvas,
//     and fed the canvas's offset as its view, so a scroll moves the held frame and the real redraw waits until the writer settles;
//   - the footer readouts OVER the board's bottom edge: level, zoom, nodes, links, the last node (q9: derived and true). An overlay: it takes
//     no room, so neither the board's rect nor any card moves (the page-primacy law; flux3-page-rect.mjs and flux3-s1.mjs keep it).
// Nothing here is saved. The layer's motion follows the existing Ambiance dial (0 = the still frame) and reduced motion; its tone, the existing
// Page pref.
// S2: the Stack and the hologram (FluxStack.tsx) are rendered here too, on the same nodes; while the Stack is open the layer holds its still frame
// and the level readout names the Stack or the hologram.
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import type { Box } from '../types/board';
import { useTheme } from '../store/theme';
import { useThemePrefs } from '../store/themePrefs';
import { useAmbianceDial } from '../store/ambianceDial';
import { useDeskLexicon } from '../store/deskLexicon';
import { useLexicon } from '../store/themeLexicon';
import { FluxLayer, type FluxScene } from './flux3-layer';
import { useLastTouched } from './lastTouched';
import { nodeHex } from './FluxNodeRecord';
import { FluxStack } from './FluxStack';
import { useStackView } from './stackView';

interface Props {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  /** All the board's boxes (S2: the Stack reads the board's own order from them). */
  boxes: Box[];
  /** The cards on the canvas (the board's own render list). */
  nodes: Box[];
  /** The board's same-board links (its 'connection' boxes). */
  connections: Box[];
  selectedId: string | null;
  pageWidthPx: number;
  labelFor: (b: Box) => string;
}

export function FluxSchema(props: Props) {
  const theme = useTheme();
  return theme === 'flux' ? <Schema {...props} /> : null;
}

function Schema({ wrapRef, canvasRef, boxes, nodes, connections, selectedId, pageWidthPx, labelFor }: Props) {
  const layerRef = useRef<FluxLayer | null>(null);
  const { page } = useThemePrefs();
  const dial = useAmbianceDial();
  const last = useLastTouched();
  const stack = useStackView();
  const { t } = useDeskLexicon();
  const lex = useLexicon();

  // the layer lives as long as the Schema is shown; its host is the board's frame (the wrap's positioned parent)
  useEffect(() => {
    const wrap = wrapRef.current;
    const host = wrap?.parentElement;
    if (!wrap || !host) return;
    const layer = new FluxLayer(host);   // tone, motion and the scene arrive through the effects below, which run after this one
    layerRef.current = layer;
    const place = () => {
      const cv = canvasRef.current;
      if (!cv) return;
      const hr = host.getBoundingClientRect(), cr = cv.getBoundingClientRect();
      layer.setView({ tx: cr.left - hr.left, ty: cr.top - hr.top, s: 1 });
    };
    place();
    wrap.addEventListener('scroll', place, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    ro?.observe(wrap);
    return () => {
      wrap.removeEventListener('scroll', place);
      ro?.disconnect();
      layer.destroy();
      layerRef.current = null;
    };
  }, [wrapRef, canvasRef]);   // ref objects: stable, so the layer is made once per board frame

  // S2: under the Stack the circuit stays faint and STILL behind the nodes (the layer's still frame; it dims in flux-v3.css)
  useEffect(() => { layerRef.current?.setOptions({ tone: page, motion: dial > 0 && !stack.on }); }, [page, dial, stack.on]);

  // the scene in board pixels (a card's x, y, w and h are fractions of the page width on both axes); handed over only when it changed,
  // so a render that moved nothing never makes the layer lay its routes out again
  const scene: FluxScene = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    return {
      nodes: nodes.map((n) => ({ id: n.id, x: n.x * pageWidthPx, y: n.y * pageWidthPx, w: n.w * pageWidthPx, h: n.h * pageWidthPx })),
      links: connections.filter((c) => c.connA && c.connB && ids.has(c.connA) && ids.has(c.connB)).map((c) => ({ a: c.connA as string, b: c.connB as string })),
      selected: selectedId,
    };
  }, [nodes, connections, selectedId, pageWidthPx]);
  const sceneKey = useMemo(() => JSON.stringify(scene), [scene]);
  useEffect(() => { layerRef.current?.setScene(JSON.parse(sceneKey) as FluxScene); }, [sceneKey]);

  // a link made while the Schema is open lights once (the first render's links are the board as it was, not new)
  const seenLinks = useRef<Set<string> | null>(null);
  useEffect(() => {
    const now = new Set(connections.map((c) => c.id));
    const seen = seenLinks.current;
    if (seen) for (const c of connections) if (!seen.has(c.id) && c.connA && c.connB) layerRef.current?.lightLink(c.connA, c.connB);
    seenLinks.current = now;
  }, [connections]);

  const lastBox = last ? nodes.find((n) => n.id === last) ?? null : null;
  // above every card (each card is its own stacking context at its stored z), as a card brought to the front already stands above the rest
  const topZ = nodes.reduce((m, n) => Math.max(m, n.z), 0) + 1;
  const level = stack.holo ? t('flux3ViewHologram') : stack.on ? t('flux3ViewStack') : lex.t('board');
  return (
    <>
    <FluxStack wrapRef={wrapRef} canvasRef={canvasRef} boxes={boxes} nodes={nodes} startId={last ?? selectedId} zBase={topZ} />
    {/* above the Stack's nodes too (they stand at topZ + 1 .. topZ + 101) */}
    <div className="flux3-tele" aria-hidden="true" style={{ zIndex: stack.on ? topZ + 102 : topZ }}>
      <span>{t('flux3ReadLevel')} <span className="flux3-tele-lvl">{level}</span></span>
      <span>{t('flux3ReadZoom')} <b>1.00×10<sup>0</sup></b></span>
      <span>{lex.tMany('box')} <b>{nodes.length}</b></span>
      <span>{t('flux3LinkMany')} <b>{scene.links.length}</b></span>
      <span>{t('flux3ReadLast')} <span className="flux3-tele-you">{lastBox ? `${labelFor(lastBox)} 0x${nodeHex(lastBox.id)}` : '—'}</span></span>
    </div>
    </>
  );
}
