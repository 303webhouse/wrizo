import type { ThemeId } from './theme';

// the icon seam: theme -> icon id -> a 1-bit pixel map or SVG paths; no entry = null and the caller draws its own; Flux's maps are used exactly as drawn (flux-v2.mjs holds them byte-equal) [themeIcons §1]

export type ThemeIconId = 'rack' | 'docs' | 'circuits' | 'log' | 'config' | 'skin' | 'trash' | 'cartridge' | 'input';
// A path is its `d` string, or an object when that one path must be FILLED (Machina's Theme swatch has two solid blocks, one at .45 opacity); every other path is a stroked outline.
export type SvgPath = string | { d: string; fill: 'currentColor'; fillOpacity?: number };
export type ThemeIconSpec =
  | { kind: 'pixels'; rows: readonly string[] }
  // strokeWidth / linecap / linejoin are the SET's own register (Machina: 1.25, square, miter - the square-cut technical-drawing line); left unset they are the renderer's SVG defaults.
  | { kind: 'svg'; viewBox: string; paths: readonly SvgPath[]; strokeWidth?: number; linecap?: 'butt' | 'round' | 'square'; linejoin?: 'miter' | 'round' | 'bevel' };

export const THEME_ICONS: Partial<Record<ThemeId, Partial<Record<ThemeIconId, ThemeIconSpec>>>> = {
  flux: {
    rack: { kind: 'pixels', rows: [
'................',
'.##############.',
'.#............#.',
'.#.######..##.#.',
'.#............#.',
'.##############.',
'.#............#.',
'.#.######..##.#.',
'.#............#.',
'.##############.',
'.#............#.',
'.#.######..##.#.',
'.#............#.',
'.##############.',
'..##........##..',
'................',
]},
    docs: { kind: 'pixels', rows: [
'................',
'.##############.',
'.##############.',
'.#............#.',
'.#.#..........#.',
'.#..#.........#.',
'.#.#..###.....#.',
'.#............#.',
'.#.#########..#.',
'.#............#.',
'.#.######.....#.',
'.#............#.',
'.#.########...#.',
'.#............#.',
'.##############.',
'................',
]},
    circuits: { kind: 'pixels', rows: [
'................',
'.####...........',
'.#..#######.....',
'.#..#.....#.....',
'.####.....#.....',
'..........#.....',
'.........####...',
'.........#..####',
'.........#..#...',
'.........####...',
'..........#.....',
'.####.....#.....',
'.#..#######.....',
'.#..#...........',
'.####...........',
'................',
]},
    log: { kind: 'pixels', rows: [
'................',
'................',
'.##.##########..',
'................',
'.##.#######.....',
'................',
'.##.###########.',
'................',
'.##.######......',
'................',
'.##.#########...',
'................',
'.##.##..........',
'.##.##..........',
'................',
'................',
]},
    config: { kind: 'pixels', rows: [
'................',
'....##..........',
'....##..........',
'.##############.',
'....##..........',
'....##..........',
'..........##....',
'..........##....',
'.##############.',
'..........##....',
'..........##....',
'.......##.......',
'.......##.......',
'.##############.',
'.......##.......',
'.......##.......',
]},
    skin: { kind: 'pixels', rows: [
'................',
'.##############.',
'.#............#.',
'.#.#####.#.#..#.',
'.#.#####..#.#.#.',
'.#.#####.#.#..#.',
'.#.#####..#.#.#.',
'.#.#####.#.#..#.',
'.#.#####..#.#.#.',
'.#............#.',
'.##############.',
'.......##.......',
'.......##.......',
'....########....',
'................',
'................',
]},
    trash: { kind: 'pixels', rows: [
'................',
'......####......',
'......#..#......',
'.##############.',
'................',
'..############..',
'..#..........#..',
'..#..#..#..#.#..',
'..#..#..#..#.#..',
'..#..#..#..#.#..',
'..#..#..#..#.#..',
'..#..#..#..#.#..',
'..#..........#..',
'..############..',
'................',
'................',
]},
    cartridge: { kind: 'pixels', rows: [
'................',
'.###########....',
'.#.........##...',
'.#..........##..',
'.#...######..#..',
'.#...#....#..#..',
'.#...#....#..#..',
'.#...######..#..',
'.#...........#..',
'.#...........#..',
'.#...........#..',
'.#############..',
'..#.#.#.#.#.#...',
'..#.#.#.#.#.#...',
'................',
'................',
]},
    input: { kind: 'pixels', rows: [
'................',
'................',
'..........#####.',
'.....#....#...#.',
'......#...#...#.',
'.......#..#.#.#.',
'.########.#.#.#.',
'.......#..#.#.#.',
'......#...#...#.',
'.....#....#...#.',
'..........#####.',
'................',
'................',
'................',
'................',
'................',
]},
  },
  // Machina's set, used exactly as drawn (rects written as the equivalent closed paths) [themeIcons §2]
  machina: {
    rack: { kind: 'svg', viewBox: '0 0 24 24', strokeWidth: 1.25, linecap: 'square', linejoin: 'miter', paths: ['M3 8h18v12H3z', 'M9 8V5.5h6V8', 'M3 13h18', 'M11 12h2v2.6h-2z'] },
    docs: { kind: 'svg', viewBox: '0 0 24 24', strokeWidth: 1.25, linecap: 'square', linejoin: 'miter', paths: ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9 11h6M9 14h6M9 17h3.5'] },
    circuits: { kind: 'svg', viewBox: '0 0 24 24', strokeWidth: 1.25, linecap: 'square', linejoin: 'miter', paths: ['M9 3h6v4H9z', 'M3 16h6v4H3z', 'M15 16h6v4h-6z', 'M12 7v4.5M6 16v-4.5h12V16'] },
    log: { kind: 'svg', viewBox: '0 0 24 24', strokeWidth: 1.25, linecap: 'square', linejoin: 'miter', paths: ['M5 5h14v16H5z', 'M8 3v4M11 3v4M14 3v4M17 3v4', 'M8 11h8M8 14h8M8 17h5'] },
    config: { kind: 'svg', viewBox: '0 0 24 24', strokeWidth: 1.25, linecap: 'square', linejoin: 'miter', paths: ['M5.2 17.2A7.5 7.5 0 1 1 18.8 17.2', 'M12 6v1.4M6.6 8.3l1 1M17.4 8.3l-1 1M4.5 13h1.4M18.1 13h1.4', 'M12 13l3.6-3.4', 'M11 12h2v2h-2z', 'M8 20h8'] },
    skin: { kind: 'svg', viewBox: '0 0 24 24', strokeWidth: 1.25, linecap: 'square', linejoin: 'miter', paths: ['M3 6h18v12H3z', { d: 'M5 8h4v8H5z', fill: 'currentColor' }, { d: 'M10 8h4v8h-4z', fill: 'currentColor', fillOpacity: 0.45 }, 'M15 8h4v8h-4z'] },
    trash: { kind: 'svg', viewBox: '0 0 24 24', strokeWidth: 1.25, linecap: 'square', linejoin: 'miter', paths: ['M4.5 7h15', 'M10 7V4.5h4V7', 'M6.5 7l1 14h9l1-14', 'M10 10.5v7M14 10.5v7'] },
    cartridge: { kind: 'svg', viewBox: '0 0 24 24', strokeWidth: 1.25, linecap: 'square', linejoin: 'miter', paths: ['M3 6h6l2 2h10v11H3z', 'M3 10.5h18'] },
    input: { kind: 'svg', viewBox: '0 0 24 24', strokeWidth: 1.25, linecap: 'square', linejoin: 'miter', paths: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M4 7.5l8 4.5 8-4.5M12 12v9'] },
  },
};

/** The set a theme draws this icon from, or null when the theme has no set (the caller falls back to its own). */
export function themeIcon(theme: ThemeId, id: string): ThemeIconSpec | null {
  return THEME_ICONS[theme]?.[id as ThemeIconId] ?? null;
}

/** A pixel map as the fewest rectangles: each run of '#' on a row is one rect (x, y, width 1 row high). */
export function pixelRects(rows: readonly string[]): { x: number; y: number; w: number }[] {
  const out: { x: number; y: number; w: number }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '#') { x += 1; continue; }
      let w = 1;
      while (x + w < row.length && row[x + w] === '#') w += 1;
      out.push({ x, y, w });
      x += w;
    }
  });
  return out;
}
