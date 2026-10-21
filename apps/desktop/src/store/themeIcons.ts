import type { ThemeId } from './theme';

// THE ICON SEAM (Flux v2, Fable Oct 21: "make the icon seam GENERIC"). theme -> icon id -> a 1-bit pixel map OR a set of SVG paths. A theme with no entry gets null and the caller draws its own
// icon (Arbor's stay where they are, in components/Cascade.tsx); TOOLS adds the Arbor and Machina sets here later. Used through components/ThemeIcon.tsx by the rail, the place block
// and the pop-out.
//
// FLUX: Fable's eight pixel maps (flux-icons-v2) and the INPUT glyph (icons-v3: an arrow into a socket, which replaces the Link chain), used EXACTLY - never redrawn. 16 x 16, '#' = on,
// square ends. The maps are also kept under docs/theme-foundations/flux/ and scripts/harness/flux-v2.mjs holds this table byte-equal to them.

export type ThemeIconId = 'rack' | 'docs' | 'circuits' | 'log' | 'config' | 'skin' | 'trash' | 'cartridge' | 'input';
export type ThemeIconSpec =
  | { kind: 'pixels'; rows: readonly string[] }
  | { kind: 'svg'; viewBox: string; paths: readonly string[] };

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
