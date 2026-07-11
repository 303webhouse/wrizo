import type { ScriptElType } from '../types';

// S1 — the frozen Tab/Enter element-cycle map (S-arc plan Appendix A, frozen
// 2026-07-11 on Nick's word — the S1 brief's pre-build verification step).
// Two cells were folklore-grade against FD13/Fade In; both are flagged
// AMENDABLE below — flip the value here (and re-run scripts/harness/s1.mjs)
// if a verdict lands before merge. Otherwise they stand exactly as shipped.

export const ENTER_MAP: Record<ScriptElType, ScriptElType> = {
  scene: 'action',
  action: 'action',
  character: 'dialogue',
  paren: 'dialogue',
  dialogue: 'action', // AMENDABLE (frozen 2026-07-11, Nick's word; flip here if a verdict lands pre-merge)
  transition: 'scene',
  shot: 'action',
  general: 'action',
};

export const TAB_MAP: Record<ScriptElType, ScriptElType> = {
  scene: 'action',
  action: 'character',
  character: 'transition', // AMENDABLE (frozen 2026-07-11, Nick's word; flip here if a verdict lands pre-merge)
  paren: 'dialogue',
  dialogue: 'paren',
  transition: 'scene',
  shot: 'character',
  general: 'action',
};

// Ctrl/Cmd+1..8 direct-set order; Shift+Tab cycles this list BACKWARD from
// the active element's current type (a plain positional walk — distinct from
// TAB_MAP, which is context-sensitive "what comes next").
export const TYPE_CYCLE: ScriptElType[] = ['scene', 'action', 'character', 'paren', 'dialogue', 'transition', 'shot', 'general'];

export function cycleBackward(t: ScriptElType): ScriptElType {
  const i = TYPE_CYCLE.indexOf(t);
  return TYPE_CYCLE[(i - 1 + TYPE_CYCLE.length) % TYPE_CYCLE.length];
}
