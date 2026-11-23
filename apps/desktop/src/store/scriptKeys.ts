import type { ScriptElType } from '../types';

// the frozen Tab/Enter element-cycle map; two cells are marked AMENDABLE (flip the value here and re-run scripts/harness/s1.mjs) [scriptKeys §1]

export const ENTER_MAP: Record<ScriptElType, ScriptElType> = {
  scene: 'action',
  action: 'action',
  character: 'dialogue',
  paren: 'dialogue',
  dialogue: 'action', // AMENDABLE [scriptKeys §2]
  transition: 'scene',
  shot: 'action',
  general: 'action',
};

export const TAB_MAP: Record<ScriptElType, ScriptElType> = {
  scene: 'action',
  action: 'character',
  character: 'transition', // AMENDABLE [scriptKeys §3]
  paren: 'dialogue',
  dialogue: 'paren',
  transition: 'scene',
  shot: 'character',
  general: 'action',
};

// SCRIPT #2: TAB_MAP is what a BLANK line becomes in place. Tab on a WRITTEN line never rewrites it: it adds this element below (Final Draft 13 User Guide 1.26.2; after a written cue, a parenthetical, 1.25.8).
export function tabAfterWritten(t: ScriptElType): ScriptElType {
  return t === 'character' ? 'paren' : TAB_MAP[t];
}

// Ctrl/Cmd+1..8 direct-set order; Shift+Tab cycles this list BACKWARD from
// the active element's current type (a plain positional walk — distinct from
// TAB_MAP, which is context-sensitive "what comes next").
export const TYPE_CYCLE: ScriptElType[] = ['scene', 'action', 'character', 'paren', 'dialogue', 'transition', 'shot', 'general'];

export function cycleBackward(t: ScriptElType): ScriptElType {
  const i = TYPE_CYCLE.indexOf(t);
  return TYPE_CYCLE[(i - 1 + TYPE_CYCLE.length) % TYPE_CYCLE.length];
}
