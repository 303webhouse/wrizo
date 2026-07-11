import type { ScriptEl, ScriptElType } from '../types';

// S1 — the autocomplete popover's pure logic: computing what to offer (given
// the active element's type + text + the doc's derived vocabulary) and what
// accepting an option does to the text. Kept pure/testable and separate from
// ScriptEditor's DOM/caret plumbing.

export type AutocompleteKind = 'slugline' | 'location' | 'tod' | 'character' | 'extension' | 'transition';

export interface AutocompleteState {
  kind: AutocompleteKind;
  options: string[];
  query: string;
}

const SLUGLINE_PREFIXES = ['INT./EXT.', 'INT.', 'EXT.', 'EST.'];
const TOD_LIST = ['DAY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING', 'CONTINUOUS', 'LATER'];
const EXTENSIONS = ['V.O.', 'O.S.', "CONT'D", 'O.C.'];
const TRANSITIONS_LIST = ['CUT TO:', 'DISSOLVE TO:', 'SMASH CUT TO:', 'MATCH CUT TO:', 'FADE OUT.', 'FADE IN:'];

function uniqueUpper(values: string[]): string[] {
  return [...new Set(values.map(v => v.trim().toUpperCase()).filter(Boolean))];
}

export function knownCharacters(elements: ScriptEl[]): string[] {
  return uniqueUpper(elements.filter(e => e.t === 'character').map(e => e.text.split('(')[0]));
}

export function knownLocations(elements: ScriptEl[]): string[] {
  const locs = elements.filter(e => e.t === 'scene').map(e => {
    let rest = e.text.trim();
    const upper = rest.toUpperCase();
    const prefix = SLUGLINE_PREFIXES.find(p => upper.startsWith(p));
    if (prefix) rest = rest.slice(prefix.length).trim();
    return rest.split(/ - /i)[0];
  });
  return uniqueUpper(locs);
}

function sceneAutocomplete(text: string, elements: ScriptEl[]): AutocompleteState | null {
  const upper = text.toUpperCase();
  const dashIdx = upper.lastIndexOf(' - ');
  if (dashIdx >= 0) {
    const query = upper.slice(dashIdx + 3);
    const opts = TOD_LIST.filter(o => o.startsWith(query) && o !== query);
    return opts.length ? { kind: 'tod', options: opts, query } : null;
  }
  const firstSpace = text.indexOf(' ');
  const prefixCandidate = firstSpace === -1 ? upper : upper.slice(0, firstSpace);
  const matchedPrefix = SLUGLINE_PREFIXES.find(p => p === prefixCandidate);
  if (!matchedPrefix) {
    if (text.trim().length === 0) return null;
    const opts = SLUGLINE_PREFIXES.filter(p => p.startsWith(prefixCandidate));
    return opts.length ? { kind: 'slugline', options: opts, query: prefixCandidate } : null;
  }
  if (firstSpace >= 0) {
    const query = text.slice(firstSpace + 1).trim().toUpperCase();
    if (query.length >= 1) {
      const opts = knownLocations(elements).filter(l => l.startsWith(query) && l !== query);
      return opts.length ? { kind: 'location', options: opts, query } : null;
    }
  }
  return null;
}

function characterAutocomplete(text: string, elements: ScriptEl[]): AutocompleteState | null {
  const lastParen = text.lastIndexOf('(');
  if (lastParen >= 0) {
    const query = text.slice(lastParen + 1).replace(/\)$/, '').toUpperCase();
    const opts = EXTENSIONS.filter(o => o.startsWith(query) && o !== query);
    return opts.length ? { kind: 'extension', options: opts, query } : null;
  }
  const query = text.trim().toUpperCase();
  if (query.length < 2) return null; // two-letter threshold
  const opts = knownCharacters(elements).filter(n => n.startsWith(query) && n !== query);
  return opts.length ? { kind: 'character', options: opts, query } : null;
}

function transitionAutocomplete(text: string): AutocompleteState | null {
  const query = text.trim().toUpperCase();
  if (query.length === 0) return null;
  const opts = TRANSITIONS_LIST.filter(o => o.startsWith(query) && o !== query);
  return opts.length ? { kind: 'transition', options: opts, query } : null;
}

export function computeAutocomplete(activeType: ScriptElType, text: string, elements: ScriptEl[]): AutocompleteState | null {
  switch (activeType) {
    case 'scene': return sceneAutocomplete(text, elements);
    case 'character': return characterAutocomplete(text, elements);
    case 'transition': return transitionAutocomplete(text);
    default: return null;
  }
}

// Accepting an option rewrites the active element's text. `location` chains
// straight into the TOD list (appends " - " so the next render's
// computeAutocomplete finds the dash and offers time-of-day); every other
// kind just lands the completed text with the caret at its end.
export function applyAutocomplete(text: string, state: AutocompleteState, option: string): string {
  switch (state.kind) {
    case 'slugline':
      return `${option} `;
    case 'location': {
      const firstSpace = text.indexOf(' ');
      const head = firstSpace >= 0 ? text.slice(0, firstSpace + 1) : `${text} `;
      return `${head}${option} - `;
    }
    case 'tod': {
      const dashIdx = text.toUpperCase().lastIndexOf(' - ');
      const head = dashIdx >= 0 ? text.slice(0, dashIdx + 3) : text;
      return `${head}${option}`;
    }
    case 'character':
      return option;
    case 'extension': {
      const lastParen = text.lastIndexOf('(');
      const head = lastParen >= 0 ? text.slice(0, lastParen + 1) : `${text}(`;
      return `${head}${option})`;
    }
    case 'transition':
      return option;
  }
}
