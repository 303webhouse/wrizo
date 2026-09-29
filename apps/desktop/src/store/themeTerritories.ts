import type { ThemeId } from './theme';

// HB1 R1 — territories are data, not a hardcoded pair. theme.ts's ThemeId
// union names only themes setTheme() can apply. The unlock ceremony reads
// OFFERED (armed, choosable) and FUTURE (shown, not choosable). Machina
// moved from FUTURE to OFFERED when its token pack landed.
export interface Territory {
  id: string;
  label: string;
  armed: boolean;
  themeId?: ThemeId;
}

// The choice offered at the 100-word unlock. Narrative order
// (theme-arc.md): Plateau, then Machina, then Flux. Plateau is the
// writer's starting theme; Machina and Flux are armed choices.
export const OFFERED_TERRITORIES: readonly Territory[] = [
  { id: 'plateau', label: 'Plateau', armed: true, themeId: 'plateau' },
  { id: 'machina', label: 'Machina', armed: true, themeId: 'machina' },
  { id: 'flux', label: 'Flux', armed: true, themeId: 'flux' },
];

// Shown grayed, in narrative order. Machina has moved to OFFERED.
export const FUTURE_TERRITORIES: readonly Territory[] = [
  { id: 'nomad', label: 'Nomad', armed: false },
  { id: 'volant', label: 'Volant', armed: false },
];
