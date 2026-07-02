import type { BinderKind, JournalEntry } from '../types';
import { firstLine } from './entryText';
import { getDrawer } from './persistence';
import type { ResumeTarget } from './resume';

// F2 — the return card's vocabulary. A PURE function of the typed resume pointer
// (F1): it renders ONLY from `kind` + `pageType` + `home` + the resolved
// project/entry the pointer already carries. No personas, no guesses — the card
// is a mirror of the writer's own trail. Split into its own module so it stays
// trivially unit-checkable (direct import; `window.wrizoResume` feeds it live
// pointers in the harness).

export interface TargetVocab {
  tag: string;         // FORM · SURFACE, small-caps accent on the card
  crumb: string[];     // [drawer?, project?, page-firstLine] — pieces, joined on the card
  note?: string;       // a quiet, non-interactive aside (loose/shelf); links are built on the card
}

const KIND_LABEL: Record<BinderKind, string> = {
  book: 'BOOK', story: 'STORY', screenplay: 'SCREENPLAY', other: '',
};

const PAGETYPE_LABEL: Record<NonNullable<JournalEntry['pageType']>, string> = {
  manuscript: 'MANUSCRIPT', character: 'CHARACTER PAGE',
  worldbuilding: 'WORLDBUILDING', research: 'RESEARCH', note: 'NOTE',
};

const UNFILED_NOTE = 'file it later from the Shelf, or never';

// The project's FORM label: its kind, else its drawer name (uppercased), else a
// neutral PROJECT — never a persona, only what the binder itself declares.
function formLabel(t: ResumeTarget): string {
  const byKind = t.kind ? KIND_LABEL[t.kind] : '';
  if (byKind) return byKind;
  const drawerName = t.project?.drawerId ? getDrawer(t.project.drawerId)?.name : undefined;
  return drawerName ? drawerName.toUpperCase() : 'PROJECT';
}

export function describeTarget(t: ResumeTarget): TargetVocab {
  // Home overrides — a loose or shelf page announces its unfiled home, not a form.
  if (t.home === 'journal') {
    return { tag: 'JOURNAL · UNFILED', crumb: ['Journal', firstLine(t.entry?.text ?? '').slice(0, 40)], note: UNFILED_NOTE };
  }
  if (t.home === 'shelf') {
    return { tag: 'SHELF · UNFILED', crumb: ['Shelf', firstLine(t.entry?.text ?? '').slice(0, 40)], note: UNFILED_NOTE };
  }

  // Binder target.
  const form = formLabel(t);
  const drawerName = t.project?.drawerId ? getDrawer(t.project.drawerId)?.name : undefined;

  // Legacy project target (no page entry — a sprint/overview resume): the form
  // label alone, crumb down to the project.
  if (!t.entry) {
    return { tag: form, crumb: [drawerName, t.project?.title].filter(Boolean) as string[] };
  }

  const surface = t.pageType ? PAGETYPE_LABEL[t.pageType] : 'PAGE';
  const pageLabel = firstLine(t.entry.text).slice(0, 40);
  return {
    tag: `${form} · ${surface}`,
    crumb: [drawerName, t.project?.title, pageLabel].filter(Boolean) as string[],
  };
}

// Test/inspection seam — describe the live pointer's vocabulary on demand.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoVocab?: unknown }).wrizoVocab = describeTarget;
}
