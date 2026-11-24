import type { StyleGuide } from '../types';

// THE DOC'S KIND MENU, ITS PURE HALF (Fable, Nov 20, 4:15 pm: "NICK APPROVED the Doc presets as drafted (claude/wrizors/kind-menu-presets-draft.md): Style Guide (None / MLA / APA / Chicago / AP: Page Setup and the sources Part's name),
// the presets (empty, named Parts; in a Doc with words they go after hers, nothing of hers moves), Special Parts in their right places, Page Setup moved in"). No store, no React: the words of the draft as data and the rules as functions,
// unit-checked in scripts/harness/reorg-kinds-unit.mjs. The acts that write them (applyStyleGuide, addSpecialPart, applyPreset) are reorg/docKindActs.ts, on the Parts layer and the Doc's own column.

/** The Doc's style guide: the four, or none (the key's absence in the Doc's record). */
export type DocStyle = 'none' | StyleGuide;
export const STYLES: readonly DocStyle[] = ['none', 'mla', 'apa', 'chicago', 'ap'];

// ---------------------------------------------------------------- what a style guide calls the sources Part

const SOURCES: Record<DocStyle, string | null> = { mla: 'Works Cited', apa: 'References', chicago: 'Bibliography', none: 'Sources', ap: null };
/** What the style guide calls the sources Part; null when it has none (AP attributes its sources in the text). */
export const sourcesName = (style: DocStyle): string | null => SOURCES[style];
const SOURCE_WORDS = Object.values(SOURCES).filter((w): w is string => !!w).map(w => w.toLowerCase());

/** A Part's name after a change of style guide: a Part that still wears one of the style guides' own sources words takes the new style's word; any other name is hers and stays. AP has no word, so the name stays. */
export function followStyle(name: string, style: DocStyle): string {
  const word = sourcesName(style);
  return word && SOURCE_WORDS.includes(name.trim().toLowerCase()) ? word : name;
}

// ---------------------------------------------------------------- the Page Setup a style guide sets (the draft's table)

export interface PageSetupPatch {
  margins: 'normal' | 'narrow' | 'wide';
  lineSpacing: number;
  size: number;
  pageNumbers: { on: boolean; placement: 'bottom-center' | 'bottom-right' | 'top-right' };
  headers: { on: boolean; text: string };
  footers: { on: boolean; text: string };
}
const OFF = { on: false, text: '' };
// MLA 9, APA 7 and Chicago 17: 1-inch margins (the app's 'normal'), double spaced, 12 pt, the page number at the top right. AP: news copy, single spaced, no page-number rule.
const SETUP: Record<StyleGuide, PageSetupPatch> = {
  mla: { margins: 'normal', lineSpacing: 2, size: 12, pageNumbers: { on: true, placement: 'top-right' }, headers: OFF, footers: OFF },
  apa: { margins: 'normal', lineSpacing: 2, size: 12, pageNumbers: { on: true, placement: 'top-right' }, headers: OFF, footers: OFF },
  chicago: { margins: 'normal', lineSpacing: 2, size: 12, pageNumbers: { on: true, placement: 'top-right' }, headers: OFF, footers: OFF },
  ap: { margins: 'normal', lineSpacing: 1, size: 12, pageNumbers: { on: false, placement: 'bottom-center' }, headers: OFF, footers: OFF },
};
/** The Page Setup a style guide sets, as a fresh copy; null for None (the Doc's own Page Setup, untouched). */
export function pageSetupFor(style: DocStyle): PageSetupPatch | null {
  return style === 'none' ? null : JSON.parse(JSON.stringify(SETUP[style])) as PageSetupPatch;
}

// ---------------------------------------------------------------- Special Parts, each in its right place

export type SpecialKind = 'title' | 'abstract' | 'toc' | 'ack' | 'sources' | 'appendix';
/** The order the Special Parts keep: the front four, the body between, then the sources, then the Appendix last. */
const RANK: Record<SpecialKind, number> = { title: 0, abstract: 1, toc: 2, ack: 3, sources: 100, appendix: 101 };
const NAMES: Record<Exclude<SpecialKind, 'sources'>, string> = { title: 'Title Page', abstract: 'Abstract', toc: 'Table of Contents', ack: 'Acknowledgements', appendix: 'Appendix' };
/** What a Special Part is called (the sources Part by the style guide; null where it has none). */
export const specialName = (kind: SpecialKind, style: DocStyle): string | null => (kind === 'sources' ? sourcesName(style) : NAMES[kind]);
/** Title Page and Bibliography are Machina's existing templates; the rest are empty named Parts. */
export const specialTemplate = (kind: SpecialKind): 'title' | 'bibliography' | null => (kind === 'title' ? 'title' : kind === 'sources' ? 'bibliography' : null);

export interface PlacePart { id: string; name: string; template: string | null }
/** Which Special Part a Part is: by its template, else by its name (no saved tag; a name she gave is her own word). */
export function specialOf(part: PlacePart): SpecialKind | null {
  if (part.template === 'title') return 'title';
  if (part.template === 'bibliography') return 'sources';
  const n = part.name.trim().toLowerCase();
  if (n === 'title page') return 'title';
  if (n === 'abstract') return 'abstract';
  if (n === 'table of contents') return 'toc';
  if (n === 'acknowledgements' || n === 'acknowledgments') return 'ack';
  if (n === 'appendix') return 'appendix';
  return SOURCE_WORDS.includes(n) ? 'sources' : null;
}

/** Where a Special Part goes among a Doc's Parts: `afterId` is the Part it follows (null: first), `existing` the Part that already is one (found, never made twice). */
export function placeSpecial(parts: readonly PlacePart[], kind: SpecialKind): { afterId: string | null; existing: string | null } {
  const there = parts.find(p => specialOf(p) === kind);
  if (there) return { afterId: null, existing: there.id };
  let afterId: string | null = null;
  if (RANK[kind] < 100) {
    // the front: after the leading run of front Special Parts that rank before it
    for (const p of parts) { const s = specialOf(p); if (s && RANK[s] < 100 && RANK[s] < RANK[kind]) afterId = p.id; else break; }
  } else if (kind === 'sources') {
    // near the end: after everything but an Appendix
    for (const p of parts) if (specialOf(p) !== 'appendix') afterId = p.id;
  } else if (parts.length) afterId = parts[parts.length - 1].id;
  return { afterId, existing: null };
}

// ---------------------------------------------------------------- the presets (the draft's list, as approved)

export type PresetGroup = 'academic' | 'business' | 'web' | 'creative' | 'screenplay';
export interface Preset {
  id: string;
  group: PresetGroup;
  label: string;
  /** a Standard Doc's, or a Screenplay Doc's */
  kind: 'standard' | 'screenplay';
  /** the Parts, in order; `{sources}` takes the style guide's word for the sources Part (and is left out where the style has none) */
  parts: readonly string[];
  /** the whole list under a style guide that changes it (MLA's Academic Research) */
  variants?: Partial<Record<DocStyle, readonly string[]>>;
}
const S = '{sources}';
const std = (id: string, group: PresetGroup, label: string, parts: readonly string[], variants?: Preset['variants']): Preset => ({ id, group, label, kind: 'standard', parts, ...(variants ? { variants } : {}) });
const scr = (id: string, label: string, parts: readonly string[]): Preset => ({ id, group: 'screenplay', label, kind: 'screenplay', parts });
export const LIVE_PRESETS: readonly Preset[] = [
  std('academic-research', 'academic', 'Academic Research', ['Title Page', 'Abstract', 'Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion', S, 'Appendix'],
    { mla: ['Heading Block', 'Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion', S, 'Appendix'] }),
  std('argumentative-essay', 'academic', 'Argumentative Essay', ['Introduction', 'Background', 'Claim and Evidence 1', 'Claim and Evidence 2', 'Claim and Evidence 3', 'Counterargument', 'Rebuttal', 'Conclusion', S]),
  std('literature-review', 'academic', 'Literature Review', ['Introduction', 'Theme 1', 'Theme 2', 'Theme 3', 'Gaps', 'Conclusion', S]),
  std('memo', 'business', 'Memo', ['Header', 'Purpose', 'Discussion', 'Action Needed']),
  std('report', 'business', 'Report', ['Executive Summary', 'Introduction', 'Findings', 'Recommendations', 'Appendix']),
  std('proposal', 'business', 'Proposal', ['Summary', 'The Problem', 'The Approach', 'Timeline', 'Budget', 'Team', 'Next Steps']),
  std('meeting-minutes', 'business', 'Meeting Minutes', ['Attendees', 'Agenda', 'Decisions', 'Action Items']),
  std('blog-post', 'web', 'Blog Post', ['Headline', 'Introduction', 'Section 1', 'Section 2', 'Section 3', 'Takeaway']),
  std('newsletter', 'web', 'Newsletter', ['Opening', 'Main Story', 'Quick Hits', 'Sign-Off']),
  std('news-story', 'web', 'News Story', ['Headline', 'Lede', 'Nut Graf', 'Body', 'Background']),
  std('feature', 'web', 'Feature', ['Headline', 'Opening Scene', 'Nut Graf', 'Body', 'Kicker']),
  std('short-story', 'creative', 'Short Story', ['Part 1', 'Part 2', 'Part 3']),
  std('novel', 'creative', 'Novel', ['Front Matter', 'Chapter 1', 'Chapter 2', 'Chapter 3']),
  std('personal-essay', 'creative', 'Personal Essay', ['Opening', 'Turn', 'Reflection']),
  scr('screenplay-feature', 'Feature', ['Act One', 'Act Two A', 'Act Two B', 'Act Three']),
  scr('tv-half-hour', 'TV Half-Hour', ['Cold Open', 'Act One', 'Act Two', 'Tag']),
  scr('tv-hour', 'TV Hour', ['Teaser', 'Act One', 'Act Two', 'Act Three', 'Act Four', 'Act Five']),
  scr('short-film', 'Short Film', ['Beginning', 'Middle', 'End']),
];

// THE FIRST SLICE (PRESETS-B, Nov 23: the PRESETS load sheet, section 3; Fable: "Copy from it only; invent nothing"). Twenty more presets, Parts only: no Plan, no Board, no Part questions (build items 11 and 12). Each is a Standard Doc with the app's ordinary Page Setup:
// a preset never sets a Page Setup or chooses a Style Guide (the Style Guide menu does, as today). Light sets only (Memoir, Thesis or Dissertation). In the menu a group lists its live presets first, then these. The italic Special Parts of the sheet
// are the live ones: Title Page and Abstract by name, and `S`, the sources Part wearing the style guide's word. Lyric Essay, Collage Essay and the How-To Guide stand in for Braided Essay, Zuihitsu and the Game Design Document until their gates are passed.
const FIRST_SLICE_PRESETS: readonly Preset[] = [
  // Academic
  std('class-essay', 'academic', 'Class Essay', ['Introduction', 'Body 1', 'Body 2', 'Body 3', 'Conclusion', S]),
  std('thesis-or-dissertation', 'academic', 'Thesis or Dissertation', ['Title Page', 'Abstract', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', S]),
  std('lab-report', 'academic', 'Lab Report', ['Title Page', 'Aim', 'Method', 'Results', 'Discussion', S]),
  std('research-proposal', 'academic', 'Research Proposal', ['Title Page', 'The Question', 'Background', 'Method', 'Timeline', 'What It Will Add', S]),
  // Business
  std('grant-application', 'business', 'Grant Application', ['Summary', 'Need', 'Goals and Outcomes', 'Activities', 'Evaluation', 'Budget Narrative', 'About the Organization']),
  std('one-pager', 'business', 'One-Pager', ['The Point', 'Why It Matters', 'The Evidence', 'The Ask']),
  std('decision-memo', 'business', 'Decision Memo', ['Decision Needed', 'Options', 'Trade-Offs', 'Recommendation', 'What Happens Next']),
  std('product-spec', 'business', 'Product Spec', ['The Problem', 'Who It\'s For', 'What We\'ll Build', 'What We Won\'t', 'How We\'ll Know It Worked', 'Open Questions']),
  std('status-update', 'business', 'Status Update', ['Done', 'Next', 'Blocked', 'Decisions Needed']),
  // Web and Journalism
  std('op-ed', 'web', 'Op-Ed', ['The Claim', 'Why Now', 'The Evidence', 'The Other Side', 'What Should Happen']),
  std('profile', 'web', 'Profile', ['The Scene', 'Who They Are', 'Why Now', 'The Complication', 'Where It Leaves Them']),
  std('explainer', 'web', 'Explainer', ['The Question', 'The Short Answer', 'How It Works', 'What\'s Disputed', 'What Happens Next']),
  // Creative
  std('poem', 'creative', 'Poem', ['Poem']),
  std('memoir', 'creative', 'Memoir', ['Chapter 1', 'Chapter 2', 'Chapter 3']),
  std('flash-fiction', 'creative', 'Flash Fiction', ['Story']),
  std('novella', 'creative', 'Novella', ['Part One', 'Part Two', 'Part Three']),
  std('lyric-essay', 'creative', 'Lyric Essay', ['Section 1', 'Section 2', 'Section 3', 'Section 4', 'Section 5']),
  std('collage-essay', 'creative', 'Collage Essay', ['Fragment 1', 'Fragment 2', 'Fragment 3', 'Fragment 4', 'Fragment 5', 'Fragment 6', 'Fragment 7']),
  std('treatment', 'creative', 'Treatment', ['Logline', 'The World', 'Characters', 'Act One', 'Act Two', 'Act Three', 'Tone']),
  std('how-to-guide', 'creative', 'How-To Guide', ['What You\'ll Be Able to Do', 'What You Need', 'Steps', 'If It Goes Wrong', 'What Next']),
];
export const PRESETS: readonly Preset[] = [...LIVE_PRESETS, ...FIRST_SLICE_PRESETS];

/** The names of a preset's Parts under a style guide: the sources Part wears the style's word, and AP (which has none) leaves it out. */
export function presetParts(preset: Preset, style: DocStyle): string[] {
  const list = preset.variants?.[style] ?? preset.parts;
  const word = sourcesName(style);
  return list.flatMap(n => (n === S ? (word ? [word] : []) : [n]));
}

export interface PlanPart { id: string; name: string; words: number; template: string | null }
export interface PresetPlan {
  /** an empty Doc: its one empty Part is the preset's first (renamed), not left blank beside it */
  reuse: string | null;
  /** the Parts to make, in order */
  add: string[];
  /** the name the reused Part takes */
  firstName: string | null;
  /** the Part the new ones follow (null: the front) */
  after: string | null;
}
/**
 * What choosing a preset does to a Doc (the draft: "in an empty Doc they become the Doc; in a Doc with words they go after hers, and nothing of hers moves"). A Doc is EMPTY when every Part is
 * unnamed, without words and not a template; then its first Part is the preset's first. Otherwise every Part is new and goes after the last one she has.
 */
export function planPreset(preset: Preset, style: DocStyle, parts: readonly PlanPart[]): PresetPlan {
  const names = presetParts(preset, style);
  const empty = parts.length > 0 && parts.every(p => p.words === 0 && !p.name.trim() && !p.template);
  if (empty && names.length) return { reuse: parts[0].id, add: names.slice(1), firstName: names[0], after: parts[0].id };
  return { reuse: null, add: names, firstName: null, after: parts.length ? parts[parts.length - 1].id : null };
}
