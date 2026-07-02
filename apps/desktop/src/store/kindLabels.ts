import type { BinderKind, Project } from '../types';

// F4 — the ONE shared kind vocabulary. Storage value → display label + uppercased
// tag + its domain + the picker's one-line description. Consumed by BOTH the
// create picker ("What are you writing?") and the mirror card's `resumeVocab`, so
// the two can never drift: the card speaks a binder's language from birth.
//
// `story` is reused under the "Short fiction" label (no redundant storage value).
// `other` has an empty tag on purpose — the mirror card falls through to the
// drawer name / PROJECT for an untyped/other binder (never a form label).

export type Domain = Project['type']; // 'creative' | 'academic' | 'professional'

export interface KindMeta {
  label: string;   // picker card + prose ("Short fiction")
  tag: string;     // mirror-card FORM tag ("SHORT FICTION"); '' for other
  domain: Domain;
  desc: string;    // picker one-line description
}

export const KIND_META: Record<BinderKind, KindMeta> = {
  book:       { label: 'Book',          tag: 'BOOK',          domain: 'creative',     desc: 'Chapters of prose — a novel or nonfiction' },
  story:      { label: 'Short fiction', tag: 'SHORT FICTION', domain: 'creative',     desc: 'Scenes toward one arc' },
  screenplay: { label: 'Screenplay',    tag: 'SCREENPLAY',    domain: 'creative',     desc: 'Script form (conventions coming)' },
  essay:      { label: 'Essay',         tag: 'ESSAY',         domain: 'academic',     desc: 'An argument, built and defended' },
  thesis:     { label: 'Thesis',        tag: 'THESIS',        domain: 'academic',     desc: 'Long-form research, chaptered' },
  paper:      { label: 'Paper',         tag: 'PAPER',         domain: 'academic',     desc: 'A study written for submission' },
  article:    { label: 'Article',       tag: 'ARTICLE',       domain: 'professional', desc: 'Reported or op-ed, for publication' },
  report:     { label: 'Report',        tag: 'REPORT',        domain: 'professional', desc: 'Findings for a reader who decides' },
  proposal:   { label: 'Proposal',      tag: 'PROPOSAL',      domain: 'professional', desc: 'A case for a yes' },
  other:      { label: 'Something else', tag: '',             domain: 'creative',     desc: 'Start blank and shape it as you go' },
};

// The mirror-card FORM tag for a binder's kind ('' → the card uses drawer/PROJECT).
export function kindTag(kind: BinderKind | undefined): string {
  return kind ? KIND_META[kind].tag : '';
}

// The human label for a binder's kind (used wherever a form needs naming).
export function kindLabel(kind: BinderKind | undefined): string {
  return kind ? KIND_META[kind].label : '';
}

// The picker's static group order (Creative / Academic / Professional). The
// first-run SORT HINT that reorders these is deferred to the HOME-verification
// pass, where first-run flow lives.
export const PICKER_GROUPS: { domain: Domain; name: string; kinds: BinderKind[] }[] = [
  { domain: 'creative',     name: 'CREATIVE',     kinds: ['book', 'story', 'screenplay'] },
  { domain: 'academic',     name: 'ACADEMIC',     kinds: ['essay', 'thesis', 'paper'] },
  { domain: 'professional', name: 'PROFESSIONAL', kinds: ['article', 'report', 'proposal'] },
];

// The domain label for ProjectHome's eyebrow.
export function domainLabel(domain: Domain): string {
  return domain === 'creative' ? 'Creative project'
    : domain === 'academic' ? 'Academic project'
    : 'Professional project';
}
