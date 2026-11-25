import { PRESETS, presetParts, type DocStyle } from './docKinds';
import { PLAN_PRESETS } from './backMenu/planPresets';
import type { DeskTermId } from '../store/lexicon/terms';

/** A Guide word: a lexicon key that begins `guide`. */
export type GuideTermId = Extract<DeskTermId, `guide${string}`>;

// THE GUIDE, ITS PURE HALF (PRESETS-B, Nov 25; Fable's build brief guide-brief-nov24.md, PRESETS' finding-presets.md section 4). Three questions at most, each answered with one press; it ends on ONE preset, one alternative and "or just start Blank".
// No AI, nothing saved, nothing sent: the answers are a FIXED TABLE (below), and this module has no React, no storage, no fetch and no document access (a check reads this very file for that). It is the pattern of decks/helpMeChoose.ts.
//
// IT LANDS ONLY ON WHAT IS IN THE APP (the brief's rule 2). The table below is PRESETS' whole design, wishes included; `guideTree(live)` prunes it against the live preset and structure lists:
//   - a row whose landing is not in the app takes its alternative as the landing (with no alternative);
//   - a row with neither is left out of its question; a question left with ONE answer is skipped; a question left with none leaves out the answer that led to it;
//   - so an answer that leads nowhere is never shown. As presets and structures ship, the pruned tree grows back by itself: nothing here is edited.
// A wished id (one the app does not have yet: 'stage-play', 'mystery') is only a promise of the id it will have when it ships.

/** What is in the app: the ids of the presets (PARTS) and the structures (PLAN). */
export interface GuideLive { presets: ReadonlySet<string>; structures: ReadonlySet<string> }
/** The app today: docKinds.ts's PRESETS and planPresets.ts's PLAN_PRESETS. */
export const LIVE: GuideLive = { presets: new Set(PRESETS.map((p) => p.id)), structures: new Set(PLAN_PRESETS.map((p) => p.id)) };

/** A style the Guide may set: the three a writer is asked about. */
export type GuideStyle = 'mla' | 'apa' | 'chicago';

/** What Start does: the preset's Parts (null: Blank), at most one Plan structure, at most one style guide. */
export interface GuidePick { preset: string | null; structure: string | null; style: GuideStyle | null }
export interface GuideLanding {
  pick: GuidePick;
  /** the one alternative, or null */
  alt: GuidePick | null;
  /** Blank is the landing itself (she was not sure): the one line under it */
  blank: boolean;
}
export interface GuideAnswer { id: string; word: GuideTermId; next: GuideNode }
export interface GuideQuestion {
  kind: 'question';
  id: string;
  word: GuideTermId;
  /** the answers shown at first */
  answers: readonly GuideAnswer[];
  /** the first question only: the answers "Something else" opens in place (the same question, not a fourth) */
  more: readonly GuideAnswer[];
}
export type GuideNode = GuideQuestion | { kind: 'landing'; landing: GuideLanding };

export const BLANK: GuidePick = { preset: null, structure: null, style: null };

// ---------------------------------------------------------------- the table (PRESETS' finding-presets.md section 4, as the brief copies it)

interface Row { id: string; word: GuideTermId; preset: string; alt?: string }
const row = (id: string, word: GuideTermId, preset: string, alt?: string): Row => ({ id, word, preset, ...(alt ? { alt } : {}) });

const SCRIPT: readonly Row[] = [
  row('film', 'guideAnsFilm', 'screenplay-feature', 'treatment'),
  row('tv-half', 'guideAnsTvHalf', 'tv-half-hour', 'treatment'),
  row('tv-hour', 'guideAnsTvHour', 'tv-hour', 'treatment'),
  row('short', 'guideAnsShort', 'short-film', 'treatment'),
  row('stage', 'guideAnsStage', 'stage-play', 'treatment'),
  row('audio', 'guideAnsAudio', 'podcast-episode', 'treatment'),
];
const POEM: readonly Row[] = [row('one', 'guideAnsPoemOne', 'poem', 'sequence'), row('group', 'guideAnsPoemGroup', 'poetry-collection', 'sequence')];
const ESSAY_BOOK = row('book', 'guideAnsEssayBook', 'memoir', 'memoir-in-essays');
const ESSAY_ONE = row('one-thread', 'guideAnsThreadOne', 'personal-essay', 'memoir-in-essays');
const ESSAY_SEVERAL = row('several-threads', 'guideAnsThreadSeveral', 'braided-essay', 'memoir-in-essays');
const PAPER: readonly Row[] = [
  row('argument', 'guideAnsPaperArgument', 'argumentative-essay', 'class-essay'),
  row('analysis', 'guideAnsPaperAnalysis', 'close-reading', 'class-essay'),
  row('comparison', 'guideAnsPaperComparison', 'compare-and-contrast', 'class-essay'),
  row('lab', 'guideAnsPaperLab', 'lab-report', 'class-essay'),
  row('not-sure', 'guideAnsNotSure', 'class-essay'),
];
const RESEARCH: readonly Row[] = [
  row('proposal', 'guideAnsResProposal', 'research-proposal', 'journal-article'),
  row('paper', 'guideAnsResPaper', 'academic-research', 'journal-article'),
  row('review', 'guideAnsResReview', 'literature-review', 'journal-article'),
  row('thesis', 'guideAnsResThesis', 'thesis-or-dissertation', 'journal-article'),
];
const WORK: readonly Row[] = [
  row('decide', 'guideAnsWorkDecide', 'decision-memo', 'memo'),
  row('know', 'guideAnsWorkKnow', 'report', 'memo'),
  row('approve', 'guideAnsWorkApprove', 'proposal', 'memo'),
  row('do', 'guideAnsWorkDo', 'how-to-guide', 'memo'),
];
const GRANT: readonly Row[] = [
  row('foundation', 'guideAnsGrantFoundation', 'grant-application', 'letter-of-inquiry'),
  row('funder', 'guideAnsGrantFunder', 'research-grant', 'letter-of-inquiry'),
  row('fellowship', 'guideAnsGrantFellowship', 'fellowship-application', 'letter-of-inquiry'),
  row('job', 'guideAnsGrantJob', 'cover-letter', 'letter-of-inquiry'),
];
const ARTICLE: readonly Row[] = [
  row('news', 'guideAnsArtNews', 'news-story', 'explainer'),
  row('feature', 'guideAnsArtFeature', 'feature', 'explainer'),
  row('opinion', 'guideAnsArtOpinion', 'op-ed', 'explainer'),
  row('blog', 'guideAnsArtBlog', 'blog-post', 'explainer'),
  row('newsletter', 'guideAnsArtNewsletter', 'newsletter', 'explainer'),
];
const GAME: readonly Row[] = [
  row('idea', 'guideAnsGameIdea', 'game-pitch', 'game-design-document'),
  row('design', 'guideAnsGameDesign', 'game-design-document'),
  row('world', 'guideAnsGameWorld', 'narrative-bible', 'game-design-document'),
  row('quest', 'guideAnsGameQuest', 'quest-or-mission', 'game-design-document'),
  row('branching', 'guideAnsGameBranching', 'branching-story', 'game-design-document'),
];

// A story's LENGTH picks the preset (Fable's reading, as the table leaves it open): a page or two takes the shortest story preset in the app, a few thousand words Short Story, a book Novel.
const STORY_LENGTH: readonly { id: string; word: GuideTermId; presets: readonly string[] }[] = [
  { id: 'page', word: 'guideAnsStoryPage', presets: ['flash-fiction', 'short-story'] },
  { id: 'few', word: 'guideAnsStoryFew', presets: ['short-story'] },
  { id: 'book', word: 'guideAnsStoryBook', presets: ['novel'] },
];
// What she has so far picks the STRUCTURE, not the preset: [the Plan it suggests, the alternative]; null is "no Plan" (the Plan tick comes off).
const STORY_SO_FAR: readonly { id: string; word: GuideTermId; plan: string | null; alt: string | null }[] = [
  { id: 'person', word: 'guideAnsSoFarPerson', plan: 'three', alt: 'hero' },
  { id: 'puzzle', word: 'guideAnsSoFarPuzzle', plan: 'mystery', alt: 'seven' },
  { id: 'two', word: 'guideAnsSoFarTwo', plan: 'romance', alt: 'three' },
  { id: 'image', word: 'guideAnsSoFarImage', plan: 'kishotenketsu', alt: 'jo-ha-kyu' },
  { id: 'pieces', word: 'guideAnsSoFarPieces', plan: 'braid', alt: 'ring' },
  { id: 'nothing', word: 'guideAnsSoFarNothing', plan: null, alt: 'circle' },
];
const STYLE_SCHOOL: readonly { id: string; word: GuideTermId; style: GuideStyle | null }[] = [
  { id: 'mla', word: 'guideAnsStyleMla', style: 'mla' }, { id: 'apa', word: 'guideAnsStyleApa', style: 'apa' }, { id: 'chicago', word: 'guideAnsStyleChicago', style: 'chicago' },
  { id: 'no', word: 'guideAnsStyleNo', style: null }, { id: 'not-sure', word: 'guideAnsNotSure', style: null },
];
const STYLE_RESEARCH: readonly { id: string; word: GuideTermId; style: GuideStyle | null }[] = [
  { id: 'mla', word: 'guideAnsStyleMla', style: 'mla' }, { id: 'apa', word: 'guideAnsStyleApa', style: 'apa' }, { id: 'chicago', word: 'guideAnsStyleChicago', style: 'chicago' },
  { id: 'not-sure', word: 'guideAnsNotSure', style: null },
];

// ---------------------------------------------------------------- pruning

/** A row's landing against the app: itself; else its alternative as the landing (with no alternative); else nothing. */
export function resolveRow(r: { preset: string; alt?: string }, live: GuideLive): { preset: string; alt: string | null } | null {
  if (live.presets.has(r.preset)) return { preset: r.preset, alt: r.alt && r.alt !== r.preset && live.presets.has(r.alt) ? r.alt : null };
  if (r.alt && live.presets.has(r.alt)) return { preset: r.alt, alt: null };
  return null;
}
/** A structure against the app, the same way (null is "no Plan", always fine). */
function resolvePlan(plan: string | null, alt: string | null, live: GuideLive): { ok: boolean; structure: string | null; alt: string | null } {
  const has = (id: string | null): id is string => !!id && live.structures.has(id);
  if (plan === null) return { ok: true, structure: null, alt: has(alt) ? alt : null };
  if (has(plan)) return { ok: true, structure: plan, alt: has(alt) && alt !== plan ? alt : null };
  if (has(alt)) return { ok: true, structure: alt, alt: null };
  return { ok: false, structure: null, alt: null };
}

const pick = (preset: string | null, structure: string | null = null, style: GuideStyle | null = null): GuidePick => ({ preset, structure, style });
const landing = (p: GuidePick, alt: GuidePick | null, blank = false): GuideNode => ({ kind: 'landing', landing: { pick: p, alt, blank } });
const ans = (id: string, word: GuideTermId, next: GuideNode): GuideAnswer => ({ id, word, next });
const question = (id: string, word: GuideTermId, answers: readonly GuideAnswer[], more: readonly GuideAnswer[] = []): GuideQuestion => ({ kind: 'question', id, word, answers, more });

/** A question's node once pruned: no answers, no node (null); one answer, that answer's own node (the question is skipped); else the question. */
function settle(q: GuideQuestion): GuideNode | null {
  if (q.more.length) return q;   // the first question keeps its "Something else" even when thin
  if (q.answers.length === 0) return null;
  if (q.answers.length === 1) return q.answers[0].next;
  return q;
}
const withStyle = (node: GuideNode, style: GuideStyle | null): GuideNode => node.kind === 'landing'
  ? { kind: 'landing', landing: { ...node.landing, pick: { ...node.landing.pick, style }, alt: node.landing.alt ? { ...node.landing.alt, style } : null } }
  : node;

/** A flat list of rows as answers that each land at once (an answer with no landing in the app is left out). */
function rowAnswers(rows: readonly Row[], live: GuideLive, over: (r: Row, got: { preset: string; alt: string | null }) => GuideNode = (_r, got) => landing(pick(got.preset), got.alt ? pick(got.alt) : null)): GuideAnswer[] {
  return rows.flatMap((r) => { const got = resolveRow(r, live); return got ? [ans(r.id, r.word, over(r, got))] : []; });
}
/** A kind's rows, then (when it has a style question) each landing asks which style. */
function styled(rows: readonly Row[], styles: typeof STYLE_SCHOOL, qid: string, qword: GuideTermId, live: GuideLive): GuideAnswer[] {
  return rowAnswers(rows, live, (_r, got) => {
    const base = landing(pick(got.preset), got.alt ? pick(got.alt) : null);
    return settle(question(qid, qword, styles.map((s) => ans(s.id, s.word, withStyle(base, s.style)))))!;
  });
}

/** The whole Guide, pruned against `live`. The first question always shows (its "Not sure yet" and "Close" are the panel's own). */
export function guideTree(live: GuideLive = LIVE): GuideQuestion {
  // story: length -> what she has so far
  const storyLength = STORY_LENGTH.flatMap((len) => {
    const preset = len.presets.find((id) => live.presets.has(id));
    if (!preset) return [];
    const soFar = STORY_SO_FAR.flatMap((s) => {
      const plan = resolvePlan(s.plan, s.alt, live);
      return plan.ok ? [ans(s.id, s.word, landing(pick(preset, plan.structure), plan.alt ? pick(preset, plan.alt) : null))] : [];
    });
    const node = settle(question('story-so-far', 'guideQSoFar', soFar));
    return node ? [ans(len.id, len.word, node)] : [];
  });
  const story = settle(question('story-length', 'guideQLength', storyLength));

  const script = settle(question('script-for', 'guideQScript', rowAnswers(SCRIPT, live)));
  const poem = settle(question('poem-count', 'guideQPoem', rowAnswers(POEM, live)));

  // essay or memoir: an essay asks one thread or several; a book is a memoir
  const thread = settle(question('essay-thread', 'guideQThread', [ESSAY_ONE, ESSAY_SEVERAL].flatMap((r) => {
    const got = resolveRow(r, live);
    return got ? [ans(r.id, r.word, landing(pick(got.preset), got.alt ? pick(got.alt) : null))] : [];
  })));
  const book = resolveRow(ESSAY_BOOK, live);
  const essay = settle(question('essay-length', 'guideQLength', [
    ...(thread ? [ans('essay', 'guideAnsEssayEssay', thread)] : []),
    ...(book ? [ans('book', 'guideAnsEssayBook', landing(pick(book.preset), book.alt ? pick(book.alt) : null))] : []),
  ]));

  const paper = settle(question('paper-kind', 'guideQPaper', styled(PAPER, STYLE_SCHOOL, 'paper-style', 'guideQStyleSchool', live)));
  const research = settle(question('research-stage', 'guideQResearch', styled(RESEARCH, STYLE_RESEARCH, 'research-style', 'guideQStyleResearch', live)));
  const work = settle(question('work-after', 'guideQWork', rowAnswers(WORK, live)));
  const grant = settle(question('grant-who', 'guideQGrant', rowAnswers(GRANT, live)));
  const article = settle(question('article-kind', 'guideQArticle', rowAnswers(ARTICLE, live)));
  const game = settle(question('game-need', 'guideQGame', rowAnswers(GAME, live)));

  const first = (id: string, word: GuideTermId, node: GuideNode | null): GuideAnswer[] => (node ? [ans(id, word, node)] : []);
  return question('what', 'guideQWhat',
    [
      ...first('story', 'guideAnsStory', story),
      ...first('script', 'guideAnsScript', script),
      ...first('poem', 'guideAnsPoem', poem),
      ...first('essay', 'guideAnsEssay', essay),
      ...first('paper', 'guideAnsPaper', paper),
      ...first('work', 'guideAnsWork', work),
    ],
    [
      ...first('research', 'guideAnsResearch', research),
      ...first('grant', 'guideAnsGrant', grant),
      ...first('article', 'guideAnsArticle', article),
      ...first('game', 'guideAnsGame', game),
    ]);
}

/** "Not sure yet": Blank, with its one line (the panel draws guideBlankLine). */
export const NOT_SURE: GuideLanding = { pick: BLANK, alt: null, blank: true };

// ---------------------------------------------------------------- walking it

export type GuideStep = { kind: 'question'; question: GuideQuestion; asked: number; of: number } | { kind: 'landing'; landing: GuideLanding; said: readonly GuideTermId[] };

/** Where a path of answer ids leads: the question to ask next (`asked` of `of`, the longest path under it), or the landing. A path that leaves the tree stops at the last place it was. */
export function walk(path: readonly string[], live: GuideLive = LIVE, tree: GuideQuestion = guideTree(live)): GuideStep {
  let node: GuideNode = tree;
  let asked = 0;
  const said: GuideTermId[] = [];
  for (const id of path) {
    if (node.kind !== 'question') break;
    const a = [...node.answers, ...node.more].find((x) => x.id === id);
    if (!a) break;
    said.push(a.word);
    node = a.next;
    asked += 1;
  }
  if (node.kind === 'landing') return { kind: 'landing', landing: node.landing, said };
  return { kind: 'question', question: node, asked: asked + 1, of: depth(node) + asked };
}
function depth(node: GuideNode): number {
  if (node.kind === 'landing') return 0;
  return 1 + Math.max(0, ...[...node.answers, ...node.more].map((a) => depth(a.next)));
}

/** Every path from the first question to a landing, as the answer ids pressed (the check walks them all). */
export function allPaths(live: GuideLive = LIVE, tree: GuideQuestion = guideTree(live)): { path: string[]; landing: GuideLanding }[] {
  const out: { path: string[]; landing: GuideLanding }[] = [];
  const go = (node: GuideNode, path: string[]) => {
    if (node.kind === 'landing') { out.push({ path, landing: node.landing }); return; }
    for (const a of [...node.answers, ...node.more]) go(a.next, [...path, a.id]);
  };
  go(tree, []);
  return out;
}

// ---------------------------------------------------------------- what a pick is, for the landing card

export interface PickFacts {
  /** the preset's own label (docKinds.ts, as the PARTS menu shows it), or null for Blank */
  presetLabel: string | null;
  /** the structure's name, a lexicon key, or null */
  structureName: DeskTermId | null;
  parts: number;
  planRows: number;
  /** the preset is a Screenplay Doc's (the host makes a Screenplay Doc for it), else a Standard Doc's */
  kind: 'standard' | 'screenplay';
}
export function factsOf(p: GuidePick): PickFacts {
  const preset = p.preset ? PRESETS.find((x) => x.id === p.preset) : undefined;
  const plan = p.structure ? PLAN_PRESETS.find((x) => x.id === p.structure) : undefined;
  const style: DocStyle = p.style ?? 'none';
  return {
    presetLabel: preset ? preset.label : null,
    structureName: plan ? plan.name : null,
    parts: preset ? presetParts(preset, style).length : 0,
    planRows: plan ? plan.rows.length : 0,
    kind: preset?.kind ?? 'standard',
  };
}
/** Which kind of Doc a pick needs (Start makes the Doc of this kind: a screenplay preset is refused by a Standard Doc and the other way round). */
export const kindOf = (p: GuidePick): 'standard' | 'screenplay' => factsOf(p).kind;
