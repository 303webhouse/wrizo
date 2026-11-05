import { WIDTH_CH, INDENT_CH, RIGHT_ALIGN_TYPES, UPPERCASE_TYPES, SPACE_BEFORE } from '../../store/scriptMetrics';
import type { ScriptElType } from '../../types';

export const GHOST_TEXT: Record<ScriptElType, string> = {
  scene: 'INT. LOCATION - DAY',
  action: 'Action.',
  character: 'CHARACTER',
  paren: '(beat)',
  dialogue: 'Dialogue.',
  transition: 'CUT TO:',
  shot: 'ANGLE ON',
  general: 'Note.',
};

// Chrome/Electron supports contentEditable="plaintext-only" (no nested HTML
// on paste/IME — exactly what a single-text-node element block wants); guard
// with a fallback to "true" for any environment that doesn't.
export const PLAINTEXT_MODE: 'plaintext-only' | true = (() => {
  if (typeof document === 'undefined') return true;
  try {
    const d = document.createElement('div');
    (d as unknown as { contentEditable: string }).contentEditable = 'plaintext-only';
    return (d as unknown as { contentEditable: string }).contentEditable === 'plaintext-only' ? 'plaintext-only' : true;
  } catch {
    return true;
  }
})();


// one frozen style object per element type (the precondition for StaticScriptElement's memo); vertical spacing in line units (calc(var(--script-line) * N)); the page-top rule stays in CSS, never a function of position [ScriptEditor §1]
function buildElementStyle(t: ScriptElType): React.CSSProperties {
  const rightAlign = RIGHT_ALIGN_TYPES.has(t);
  const space = SPACE_BEFORE[t];
  return {
    maxWidth: `${WIDTH_CH[t]}ch`,
    marginLeft: rightAlign ? 'auto' : `${INDENT_CH[t]}ch`,
    marginRight: rightAlign ? 0 : undefined,
    marginTop: space > 0 ? `calc(var(--script-line) * ${space})` : 0,
    textAlign: rightAlign ? 'right' : 'left',
    textTransform: UPPERCASE_TYPES.has(t) ? 'uppercase' : 'none',
  };
}

const EL_STYLE: Partial<Record<ScriptElType, React.CSSProperties>> = {};
const EL_STYLE_STATIC: Partial<Record<ScriptElType, React.CSSProperties>> = {};
for (const t of ['scene', 'action', 'character', 'paren', 'dialogue', 'transition', 'shot', 'general'] as ScriptElType[]) {
  EL_STYLE[t] = Object.freeze(buildElementStyle(t));
  EL_STYLE_STATIC[t] = Object.freeze({ ...buildElementStyle(t), cursor: 'text' });
}
// A doc may carry a type this build has no row for (scriptMetrics.ts names the
// mechanism and the live example). It gets `action`'s frame, computed once.
export const elementStyle = (t: ScriptElType): React.CSSProperties => EL_STYLE[t] ?? (EL_STYLE.action as React.CSSProperties);
export const elementStyleStatic = (t: ScriptElType): React.CSSProperties => EL_STYLE_STATIC[t] ?? (EL_STYLE_STATIC.action as React.CSSProperties);

