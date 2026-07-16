import type { ThemeId } from './theme';

// HB1 R1 — "Flux stands in for Machina at the unlock... build the pair as
// data, not hardcode." theme.ts's ThemeId union is deliberately narrow (only
// themes you can actually setTheme() into); the unlock ceremony needs a
// separate, display-only notion of "territory" that can name a theme not
// armed yet. Machina arms later by moving one entry from FUTURE_TERRITORIES
// to OFFERED_TERRITORIES (with armed:true and a themeId) — no component
// changes required.
export interface Territory {
  id: string;
  label: string;
  armed: boolean;
  themeId?: ThemeId;
}

// The choice offered at the 100-word unlock. Interim ruling ("for now") —
// Plateau is the writer's starting theme (never offered, already active);
// Flux stands in for the spec's Machina pairing until Machina arms.
export const OFFERED_TERRITORIES: readonly Territory[] = [
  { id: 'plateau', label: 'Plateau', armed: true, themeId: 'plateau' },
  { id: 'flux', label: 'Flux', armed: true, themeId: 'flux' },
];

// Shown grayed, in this order, per R1: Machina (designed, not armed),
// Nomad, Volant.
export const FUTURE_TERRITORIES: readonly Territory[] = [
  { id: 'machina', label: 'Machina', armed: false },
  { id: 'nomad', label: 'Nomad', armed: false },
  { id: 'volant', label: 'Volant', armed: false },
];
