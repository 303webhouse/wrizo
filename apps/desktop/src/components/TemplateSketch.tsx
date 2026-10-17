// PAGE TEMPLATES (approved mockup cursor/templates @ 0fc9afef) - the tiny page sketch that sits before each word in the Templates picker.
// The sketch is the template's own layout, drawn small: a page with a few lines at the positions the mockup gives
// ([left %, top %, width %] of the page). Decorative (aria-hidden): the row's word is its name. Drawn with the theme's own
// tokens, so it follows Arbor and Flux and the page tone.

export type TemplateKey = 'blank' | 'screenplay' | 'outline' | 'title' | 'bibliography';

/** The picker's rows, in the mockup's order. */
export const TEMPLATE_ORDER: readonly TemplateKey[] = ['blank', 'screenplay', 'outline', 'title', 'bibliography'];

const LINES: Record<TemplateKey, ReadonlyArray<readonly [number, number, number]>> = {
  blank: [[18, 18, 64], [18, 32, 64], [18, 46, 50], [18, 60, 64], [18, 74, 36]],
  screenplay: [[18, 16, 50], [18, 32, 64], [36, 48, 28], [26, 58, 46], [26, 68, 40]],
  outline: [[16, 16, 40], [28, 30, 50], [28, 44, 40], [16, 58, 46], [28, 72, 38]],
  title: [[14, 12, 34], [30, 46, 40], [40, 58, 20], [34, 68, 32]],
  bibliography: [[14, 16, 72], [26, 28, 58], [14, 46, 72], [26, 58, 58], [14, 76, 60]],
};

const W = 24;
const H = 32;

export function TemplateSketch({ kind }: { kind: TemplateKey }) {
  return (
    <svg className="wz-template-sketch" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <rect className="wz-template-sketch-page" x={0.5} y={0.5} width={W - 1} height={H - 1} />
      {LINES[kind].map(([x, y, w], i) => (
        <rect key={i} className="wz-template-sketch-line" x={(W * x) / 100} y={(H * y) / 100} width={(W * w) / 100} height={1} />
      ))}
    </svg>
  );
}
