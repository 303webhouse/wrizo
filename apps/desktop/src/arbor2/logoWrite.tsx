// ARBOR v2 MOCKUP r16 - THE LOGO WRITTEN OUT ON THE SPLASH (Nick, Nov 2, 4:34 pm, via Fable): "Animate the logo being written out on the
// splash: stroke paths that follow Nick's drawing in a natural writing order, revealing his drawing through a mask; the brass 'o' and the
// i's dot LAST. ~2 s, transform/opacity/mask only, <= 3 flashes/s; reduced motion = the finished logo, still; once per splash."
// Nick's drawing is never redrawn: two layers of his own picture (scripts/arbor2-logo-r16.mjs - the letters in Arbor's cream, the o and the
// dot in brass; together they are exactly the night copy) are each shown through an SVG mask whose white strokes are drawn on in writing
// order (stroke-dashoffset inside the mask, nothing else moves). The strokes were traced on the logo's own 900 x 400 grid and measured
// offline: they reveal 99.8% of the letters' ink and 100% of the brass. At 2.0 s the masked layers give way to the still logo (the same
// element, class and picture as the corner mark under it), so the last frame IS the still logo, pixel for pixel; the last few edge pixels
// the strokes miss arrive there. Nothing flashes (no frame changes the luminance of the whole mark). The splash mounts once per load.
// The box is the corner mark's own rect (.brand-mark: bottom-right, 88 px, at .7), so nothing moves when the splash fades into the page.
type Stroke = { id: string; layer: 'letters' | 'brass'; width: number; at: number; dur: number; d: string };

const poly = (pts: number[][]) => 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ');
const ellipse = (cx: number, cy: number, rx: number, ry: number, a0: number, sweep: number) =>
  poly(Array.from({ length: 97 }, (_, i) => { const a = a0 + (i / 96) * sweep; return [Math.round((cx + rx * Math.cos(a)) * 10) / 10, Math.round((cy + ry * Math.sin(a)) * 10) / 10]; }));

// writing order and timing (seconds): w, r, i, z, the loop and its tail, then the brass o (two passes) and the dot
export const LOGO_STROKES: Stroke[] = [
  { id: 'w', layer: 'letters', width: 50, at: 0.0, dur: 0.55, d: poly([[60, 62], [45, 95], [28, 130], [14, 160], [12, 178], [30, 192], [62, 201], [95, 192], [112, 160], [118, 120], [122, 84], [127, 118], [136, 152], [168, 166], [205, 171], [238, 163], [222, 118], [200, 66], [236, 100], [226, 124], [248, 150], [272, 112], [294, 80]]) },
  { id: 'r', layer: 'letters', width: 46, at: 0.55, dur: 0.23, d: poly([[294, 80], [302, 74], [310, 104], [344, 122], [372, 104], [394, 72], [372, 112], [345, 150], [322, 176], [312, 188]]) },
  { id: 'i', layer: 'letters', width: 46, at: 0.78, dur: 0.14, d: poly([[384, 104], [420, 82], [460, 58], [443, 100], [427, 126], [412, 148]]) },
  { id: 'z', layer: 'letters', width: 46, at: 0.92, dur: 0.2, d: poly([[428, 112], [470, 88], [505, 70], [538, 62], [522, 90], [498, 120], [470, 164], [500, 142], [540, 130], [565, 128]]) },
  { id: 'loop', layer: 'letters', width: 48, at: 1.12, dur: 0.43, d: poly([[565, 128], [600, 135], [630, 155], [652, 190], [652, 235], [636, 280], [605, 320], [568, 350], [525, 375], [482, 392], [458, 388], [458, 345], [470, 330], [492, 300], [515, 272], [480, 290], [510, 252], [548, 222], [590, 196], [630, 174], [670, 160], [712, 148], [760, 138], [810, 128], [860, 116], [893, 100]]) },
  { id: 'o', layer: 'brass', width: 46, at: 1.55, dur: 0.25, d: ellipse(795, 146, 84, 58, 3.0, 6.6) },
  { id: 'o2', layer: 'brass', width: 40, at: 1.7, dur: 0.15, d: ellipse(800, 141, 66, 40, 3.3, 6.4) },
  { id: 'dot', layer: 'brass', width: 48, at: 1.85, dur: 0.15, d: poly([[440, 16], [452, 10], [462, 18], [452, 26], [442, 20]]) },
];
export const LOGO_WRITE_S = 2.0;

export function ArborSplashLogo({ reduced }: { reduced: boolean }) {
  return (
    <div className="brand-mark arbor2-logo-corner arbor2-splash-logo" data-writing={reduced ? 'still' : 'true'} aria-hidden="true">
      {!reduced && (
        <svg className="arbor2-splash-logo-svg" viewBox="0 0 900 400" preserveAspectRatio="xMidYMid meet">
          <defs>
            {(['letters', 'brass'] as const).map((layer) => (
              <mask key={layer} id={`arbor2-logo-mask-${layer}`} maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="400">
                {LOGO_STROKES.filter((s) => s.layer === layer).map((s) => (
                  <path key={s.id} className="arbor2-logo-stroke" data-stroke={s.id} d={s.d} pathLength={1} fill="none" stroke="#fff" strokeWidth={s.width}
                    strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: `${s.at}s`, animationDuration: `${s.dur}s` }} />
                ))}
              </mask>
            ))}
          </defs>
          <image href="/brand/arbor2/wrizo-logo-night-letters.png" x="0" y="0" width="900" height="400" mask="url(#arbor2-logo-mask-letters)" />
          <image href="/brand/arbor2/wrizo-logo-night-brass.png" x="0" y="0" width="900" height="400" mask="url(#arbor2-logo-mask-brass)" />
        </svg>
      )}
    </div>
  );
}
