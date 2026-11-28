// THE WALK'S ASK, ITS PURE HALF (PRESETS-B, Nov 27; guide-walk-spec.md section 3.8). THE FOUR QUESTIONS come from a template, never from the AI. From `export type WalkKind` to the end of walkQuestions this is a COPY of
// the server's (apps/server/src/tutorPrompts.ts, TUTOR-B's table of awkward step names included): change it there first; reorg-walk-ai-unit.mjs compares the two. Then the walk body, to TUTOR-B's contract. No store, no React.

export type WalkKind = 'stories' | 'essays' | 'arguments' | 'papers' | 'scripts';
export const WALK_KIND_LIST: readonly WalkKind[] = ['stories', 'essays', 'arguments', 'papers', 'scripts'];
// The word in the second question, by plan structure. The spec names stasis, toulmin and rogerian (arguments), school and research (papers) and screen structures (scripts); oration, answer and inverted are
// TUTOR-B's own pick until Fable says.
export const WALK_KINDS: Record<string, WalkKind> = {
  stasis: 'arguments', toulmin: 'arguments', rogerian: 'arguments', oration: 'arguments',
  hero: 'stories', three: 'stories', circle: 'stories', seven: 'stories', freytag: 'stories', scene: 'stories',
  beats: 'scripts', cars: 'papers', imrad: 'papers', answer: 'essays', inverted: 'essays',
};
// A step's name inside a sentence. A leading "The" is dropped so nothing says "a The Issue" or "the The Question", and so is a bracketed note after it ("Abstract (write me last)").
const bareStep = (name: string): string => name.trim().replace(/\s*\([^)]*\)$/, '').replace(/^the\s+/i, '');
// a name that is already plural ("Grounds", "Methods"); "Crisis", "Status" and "Process" are one each
const isPluralStep = (name: string): boolean => /s$/i.test(name) && !/(ss|is|us)$/i.test(name);
const pluralStep = (name: string): string => {
  if (/[^aeiou]y$/i.test(name)) return `${name.slice(0, -1)}ies`;
  if (/is$/i.test(name)) return `${name.slice(0, -2)}es`;
  if (/(ss|x|z|ch|sh)$/i.test(name)) return `${name}es`;
  return /s$/i.test(name) ? name : `${name}s`;
};
// 29 step names read badly under the rule ("Show me Road Backs", "Theme Stateds"), so they have their own wording (Fable, Nov 26 and 27: TUTOR-B's table; the Wrizors may change words later). Each: what "What does ___ do"
// takes, and what "Show me ___" takes. Keyed by the row's own name, lower case and without "The": a row she renames is not here and follows the rule. A Map, so no name of hers can reach an object's own word.
export const WALK_STEP_FORMS: ReadonlyMap<string, readonly [string, string]> = new Map<string, readonly [string, string]>([
  ['question at issue', ['the Question at Issue', 'questions at issue']],
  ['call to adventure', ['the Call to Adventure', 'Calls to Adventure']],
  ['refusal of the call', ['the Refusal of the Call', 'Refusals of the Call']],
  ['meeting the mentor', ['Meeting the Mentor', 'scenes of Meeting the Mentor']],
  ['crossing the threshold', ['Crossing the Threshold', 'scenes of Crossing the Threshold']],
  ['approach to the inmost cave', ['the Approach to the Inmost Cave', 'Approaches to the Inmost Cave']],
  ['road back', ['the Road Back', 'examples of the Road Back']],
  ['return with the elixir', ['the Return with the Elixir', 'Returns with the Elixir']],
  ['you', ['the "You" step', '"You" steps']],
  ['go', ['the "Go" step', '"Go" steps']],
  ['return or fall', ['the Return or Fall', 'examples of the Return or Fall']],
  ['catastrophe or resolution', ['the Catastrophe or Resolution', 'Catastrophes or Resolutions']],
  ['theme stated', ['the Theme Stated beat', 'Theme Stated beats']],
  ['break into two', ['the Break into Two', 'Breaks into Two']],
  ['break into three', ['the Break into Three', 'Breaks into Three']],
  ['bad guys close in', ['the "Bad Guys Close In" beat', '"Bad Guys Close In" beats']],
  ['all is lost', ['the All Is Lost moment', 'All Is Lost moments']],
  ['dark night of the soul', ['the Dark Night of the Soul', 'Dark Nights of the Soul']],
  ["where they're right", ['"Where They\'re Right"', '"Where They\'re Right" parts']],
  ['establish the territory', ['the "Establish the Territory" move', '"Establish the Territory" moves']],
  ['establish the niche', ['the "Establish the Niche" move', '"Establish the Niche" moves']],
  ['occupy the niche', ['the "Occupy the Niche" move', '"Occupy the Niche" moves']],
  ['most important', ['the "Most Important" part', '"Most Important" parts']],
  ['next', ['the "Next" part', '"Next" parts']],
  ['support 1', ['Support 1', 'supporting points']],
  ['support 2', ['Support 2', 'supporting points']],
  ['support 3', ['Support 3', 'supporting points']],
  ['their view', ['"Their View"', '"Their View" parts']],
  ['your view', ['"Your View"', '"Your View" parts']],
]);
const stepForm = (name: string): readonly [string, string] | undefined => WALK_STEP_FORMS.get(bareStep(name).toLowerCase().replace(/’/g, "'"));
export interface WalkQuestionInput { step: string; structure: string; kind: WalkKind; next?: string; previous?: string }
export function walkQuestions({ step, structure, kind, next, previous }: WalkQuestionInput): string[] {
  const name = bareStep(step);
  const form = stepForm(step);
  const many = !form && isPluralStep(name);
  const article = /^the\s+/i.test(step.trim()) ? 'the ' : many ? '' : /^[aeiou]/i.test(name) ? 'an ' : 'a ';
  const subject = form ? form[0] : `${article}${name}`;
  const other = next || previous;   // the last step is compared with the one before it
  const compared = other ? (stepForm(other)?.[0] ?? `the ${bareStep(other)}`) : '';
  return [
    `What ${many ? 'do' : 'does'} ${subject} do in ${structure}?`,
    `Show me ${form ? form[1] : pluralStep(name)} in well-known ${kind}`,
    ...(other ? [`How ${many ? 'are' : 'is'} ${subject} different from ${compared}?`] : []),
    `Ask me questions about my ${form ? form[0].replace(/^the /, '') : name}`,
  ];
}

/** The one extra key of a walk's ask. `structure`, `kind`, `step` and `note` always travel (the note may be empty); the rest only when they say something. Each is cut to the route's cap, past which it refuses the body. */
export interface WalkAskInput { preset?: string; structure: string; kind: WalkKind; step: string; note: string; question?: string; about?: string; before?: string; after?: string }
export type WalkBody = Record<string, string>;
export function walkBody(input: WalkAskInput): WalkBody {
  const body: WalkBody = { structure: input.structure.slice(0, 2000), kind: input.kind, step: input.step.slice(0, 2000), note: input.note.slice(0, 17000) };
  const optional = [['preset', 2000], ['question', 4000], ['about', 4000], ['before', 2000], ['after', 2000]] as const;
  for (const [key, cap] of optional) {
    const v = input[key]?.trim();
    if (v) body[key] = v.slice(0, cap);
  }
  return body;
}
