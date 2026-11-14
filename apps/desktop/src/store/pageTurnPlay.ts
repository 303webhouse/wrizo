import type { ThemeId } from './theme';
import arborPageTurn from '../assets/sounds/arbor-page-turn.wav';
import fluxLineFeed from '../assets/sounds/flux-line-feed.wav';

// #63 - the page-turn sound itself (the switch and its rules are store/pageTurnSound.ts and ModeStage). The Wrizors' two files: Arbor's paper turn, which Machina
// uses too when the writer turns the sound on there (Machina ships off), and Flux's line feed, scaled to Arbor's level (peak 0.119) so the two read equally loud.
const FILE: Record<ThemeId, string> = { plateau: arborPageTurn, machina: arborPageTurn, flux: fluxLineFeed };

// Best-effort: a blocked or unsupported audio element is silence, never an error into the writer's key.
export function playPageTurn(theme: ThemeId): void {
  try {
    const a = new Audio(FILE[theme]);
    void a.play().catch(() => { /* autoplay blocked or no audio device: silent */ });
  } catch {
    // audio unsupported: silent
  }
}
