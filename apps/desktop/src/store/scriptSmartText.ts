import type { ScriptEl } from '../types';

// S1 — smart conversions that happen WHILE typing (live), distinct from the
// autocomplete popover. Pure/testable, no DOM.

// A leading int./ext./est./i/e (with or without a trailing period) promotes
// an action element to a scene heading, live — as soon as it's recognizable,
// not on commit.
const SLUGLINE_PROMOTE_RE = /^\s*(int|ext|est|i\/e)\.?(\s|\/|$)/i;

export function shouldPromoteToScene(text: string): boolean {
  return SLUGLINE_PROMOTE_RE.test(text);
}

// Auto (CONT'D): committing a character element whose name (sans extension)
// matches the most recent PRIOR character element, with at least one action
// element between them, gains " (CONT'D)" — unless it's already present.
export function applyAutoContd(elements: ScriptEl[], activeIndex: number, text: string): string {
  const el = elements[activeIndex];
  if (!el || el.t !== 'character') return text;
  if (/\(CONT'D\)\s*$/i.test(text)) return text;
  const currentName = text.split('(')[0].trim().toUpperCase();
  if (!currentName) return text;
  let sawAction = false;
  for (let i = activeIndex - 1; i >= 0; i--) {
    const other = elements[i];
    if (other.t === 'character') {
      const priorName = other.text.split('(')[0].trim().toUpperCase();
      return sawAction && priorName === currentName ? `${text} (CONT'D)` : text;
    }
    if (other.t === 'action') sawAction = true;
  }
  return text;
}
