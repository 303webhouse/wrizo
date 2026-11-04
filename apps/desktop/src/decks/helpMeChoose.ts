// "Help me choose" (the librarian / RUN DIAGNOSTIC / Intake / Scout), the logic only: three questions, the pick table, Q3's landing. Pure data and functions, no React, storage, randomness or model: the same answers give the same result in every theme (the questions are deck content, not chrome). Nothing is stored, and nothing here opens a panel (components/HelpMeChoose.tsx opens only on a press). The census harness (scripts/harness/help-choose-census.mjs) checks this module row by row against an independent transcription of the table and against the deck registry. A CHOICE is a deck plus the deck's own deal answers when the table names one; {} means the deck asks its own question when dealt. "Fifteen Beats (Feature, with the Pilot note)" is the deck's own pilot option. [helpMeChoose §1]

export interface HelpChoice { deck: string; answers: Record<string, string> }
export interface HelpResult { pick: HelpChoice; alt: HelpChoice | null; browse: true }

/** Q1 - What are you making? (the doc's order) */
export const Q1: readonly string[] = ['novel', 'short-story', 'screenplay', 'essay', 'research-paper', 'thesis', 'proposal', 'article', 'world-or-cast', 'poems'];
/** Q3 - How much do you want to know before you start? */
export const Q3: readonly string[] = ['little', 'shape', 'everything'];

const FICTION: readonly string[] = ['person-change', 'events-pressure', 'world-system', 'relationship-cast', 'image-voice'];
const Q2_BY_Q1: Record<string, readonly string[]> = {
  novel: FICTION,
  'short-story': FICTION,
  screenplay: ['feature', 'pilot'],
  essay: ['position', 'question'],
  'research-paper': ['question-method', 'argument-chapters'],
  thesis: ['question-method', 'argument-chapters'],
  proposal: ['problem-solution', 'funder-priorities'],
  article: ['person', 'trend', 'found'],
  'world-or-cast': ['world', 'people'],
  poems: [],   // no second question until the Verse and form Shapes ship with W8
};

/** Q2 - What carries it? Its answers depend on Q1; [] when there is no second question. */
export function q2Options(q1: string): readonly string[] {
  return Q2_BY_Q1[q1] ?? [];
}

const C = (deck: string, answers: Record<string, string> = {}): HelpChoice => ({ deck, answers });
const STORY_CIRCLE = C('story-circle');
const HERO = C('hero-journey');
const WORLD = C('worldbuilding');
const MY_PAGES = C('from-my-pages');
const SCENE_SEQUEL = C('scene-sequel');
const RESEARCH = C('research-paper');
const PROPOSAL = C('business-proposal');
const GRANT = C('grant');
const threeAct = (format?: string): HelpChoice => C('three-act', format ? { format } : {});
const beats = (form: string): HelpChoice => C('feature-screenplay', { form });
const cast = (count?: string): HelpChoice => C('character-study', count ? { count } : {});
const essay = (length: string): HelpChoice => C('argument-essay', { length });
const thesis = (field: string): HelpChoice => C('thesis', { field });
const story = (kind: string): HelpChoice => C('feature-story', { kind });

// THE PICK TABLE (doc §3), keyed 'q1/q2'. [pick, alternative]; a null alternative is the poems row, which has none until the Verse Shape ships (W8).
const TABLE: Record<string, readonly [HelpChoice, HelpChoice | null]> = {
  'novel/person-change': [STORY_CIRCLE, HERO],
  'novel/events-pressure': [threeAct(), beats('novel')],
  'novel/world-system': [WORLD, HERO],
  'novel/relationship-cast': [cast(), STORY_CIRCLE],
  'novel/image-voice': [MY_PAGES, threeAct()],
  'short-story/person-change': [STORY_CIRCLE, threeAct('short-story')],
  'short-story/events-pressure': [threeAct('short-story'), SCENE_SEQUEL],
  'short-story/world-system': [WORLD, threeAct('short-story')],
  'short-story/relationship-cast': [cast('two'), SCENE_SEQUEL],
  'short-story/image-voice': [MY_PAGES, SCENE_SEQUEL],
  'screenplay/feature': [beats('feature'), SCENE_SEQUEL],
  'screenplay/pilot': [beats('pilot'), SCENE_SEQUEL],
  'essay/position': [essay('full'), MY_PAGES],
  'essay/question': [MY_PAGES, essay('short')],
  'research-paper/question-method': [RESEARCH, thesis('sciences')],
  'research-paper/argument-chapters': [thesis('humanities'), RESEARCH],
  'thesis/question-method': [thesis('sciences'), RESEARCH],
  'thesis/argument-chapters': [thesis('humanities'), essay('full')],
  'proposal/problem-solution': [PROPOSAL, GRANT],
  'proposal/funder-priorities': [GRANT, PROPOSAL],
  'article/person': [story('profile'), MY_PAGES],
  'article/trend': [story('trend'), MY_PAGES],
  'article/found': [story('investigative'), MY_PAGES],
  'world-or-cast/world': [WORLD, cast()],
  'world-or-cast/people': [cast(), WORLD],
  'poems/': [MY_PAGES, null],
};

const clone = (c: HelpChoice): HelpChoice => ({ deck: c.deck, answers: { ...c.answers } });

/** The pick, one alternative, and "browse all" (always the third line). Unknown answers resolve to From my pages (the table's own fallback for "no shape yet") - never a throw, never a guess at a deck. */
export function pickFor(q1: string, q2: string | null): HelpResult {
  const row = TABLE[`${q1}/${q2 ?? ''}`];
  if (!row) return { pick: clone(MY_PAGES), alt: null, browse: true };
  return { pick: clone(row[0]), alt: row[1] ? clone(row[1]) : null, browse: true };
}

/** THE ONE SWITCH: true now that W1 (the Walk) is live (TOOLS #9). Were it false, every Q3 answer would open as Open (the table), because there would be no Walk to open in. One line, with a check. */
export const WALK_SHIPPED = true;

export interface HelpLanding { view: 'walk' | 'open'; helpOpen: boolean }

// Q3's landing. A little: the pick deals and opens in the Walk with the first step's "?" already open. The shape: the Walk, "?" closed. Everything: Open (the table), all cards at once, no Walk. With the Walk not shipped (the switch false), all three open as Open. Nothing is stored. [helpMeChoose §2]
export function q3Landing(q3: string, walkShipped: boolean = WALK_SHIPPED): HelpLanding {
  if (!walkShipped || q3 === 'everything') return { view: 'open', helpOpen: false };
  if (q3 === 'little') return { view: 'walk', helpOpen: true };
  return { view: 'walk', helpOpen: false };
}

/** The landing as an address-safe token (it rides `land=` on the unborn address like `deck` and `da`; nothing is stored) and back. An unknown or missing token is "no landing" - never a guess. */
export type LandingToken = 'open' | 'walk' | 'walk-help';
export function landingToken(l: HelpLanding): LandingToken { return l.view === 'open' ? 'open' : l.helpOpen ? 'walk-help' : 'walk'; }
export function landingFromToken(raw: string | null | undefined): HelpLanding | null {
  if (raw === 'open') return { view: 'open', helpOpen: false };
  if (raw === 'walk') return { view: 'walk', helpOpen: false };
  if (raw === 'walk-help') return { view: 'walk', helpOpen: true };
  return null;
}

const pascal = (s: string) => s.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

/** The lexicon key of a pick's "why" line: helpWhy + the deck + the deck's own answers (in question-id order). One key per distinct pick; the strings live in store/deskLexicon.ts. */
export function whyKeyFor(c: HelpChoice): string {
  const answers = Object.keys(c.answers).sort().map((q) => pascal(c.answers[q])).join('');
  return `helpWhy${pascal(c.deck)}${answers}`;
}
