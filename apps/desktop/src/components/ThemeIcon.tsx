import type { ReactNode } from 'react';
import { useTheme } from '../store/theme';
import { pixelRects, themeIcon } from '../store/themeIcons';

// THE ICON SEAM'S RENDERER. A theme's own icon for `id` (store/themeIcons.ts), or - when the active theme has no set for it - the caller's `fallback` (the icon the surface always drew, so
// Arbor is untouched). A pixel map is one crisp-edged 16 x 16 svg of rectangles (no anti-aliasing, so it stays a pixel at any size); an svg set draws its paths in the text colour.
// Decorative: the label next to it is the name.
export function ThemeIcon({ id, fallback, size = 16 }: { id: string; fallback: ReactNode; size?: number }) {
  const theme = useTheme();
  const spec = themeIcon(theme, id);
  if (!spec) return <>{fallback}</>;
  if (spec.kind === 'pixels') {
    return (
      <svg className="theme-icon theme-icon-pixels" data-theme-icon={id} width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false">
        {pixelRects(spec.rows).map((r) => <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />)}
      </svg>
    );
  }
  return (
    <svg className="theme-icon theme-icon-paths" data-theme-icon={id} width={size} height={size} viewBox={spec.viewBox} fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
      {spec.paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
