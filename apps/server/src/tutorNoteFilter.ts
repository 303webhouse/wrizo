// THE NOTE FILTER (TUTOR build-list item 7, Memory step 1; runner-kit.md v0.3 section 4, check M8). The word lists are the kit's, copied word for word; the matcher below is the kit's own rule.
// What it guards: rules-of-the-road section 8 and red line R13 - nothing is kept that guesses at her health, her identity or her state of mind. It runs on the server on every note the AI
// PROPOSES, before she is shown the proposal (and again where a proposed note is saved, tutorNotes.ts, so a mislabelled client cannot walk one past). It never touches a note she types herself
// or her own answers to the voluntary interview: those are her words, and she may say what she likes about herself (Fable, Nov 24: "applies only to notes the AI proposes").
// When a note is stopped it is simply not proposed. Her answer still arrives and she sees no message about the note.
// Tuning the lists after the first real notes, and adding the standard lists of nationalities, ethnic groups and religions, is FIX's later work (kit section 5); her job and where she lives are
// not on these lists (section 8 names health, identity and state of mind; whether those belong is Nick's call).

export interface NoteWordGroup { group: string; words: string[] }

/** List A: always stops the note. */
export const LIST_A: NoteWordGroup[] = [
  { group: 'Guessing', words: ['seem', 'seems', 'seemed', 'appear to', 'appears to', 'apparently', 'probably', 'likely', 'possibly', 'perhaps', 'maybe', 'might', 'may be', 'could be', 'suggests', 'suggesting', 'suspect*', 'indicates', 'indicating', 'sign of', 'signs of', 'typical of', 'consistent with'] },
  { group: 'Naming her as a person', words: ['she', 'her', 'hers', 'herself', 'he', 'him', 'his', 'himself', 'you are a', 'you are an', 'you\'re a', 'you\'re an', 'you were a', 'you were an', 'you identify', 'identif*', 'personality', 'temperament', 'kind of person', 'type of person'] },
  { group: 'Health: general', words: ['health', 'healthy', 'unhealthy', 'medical', 'mental', 'diagnos*', 'disorder*', 'syndrome', 'condition', 'conditions', 'illness*', 'ill', 'sick', 'sickness', 'disease*', 'chronic', 'disab*', 'impair*', 'symptom*'] },
  { group: 'Health: named', words: ['ADHD', 'ADD', 'attention deficit', 'autis*', 'Asperger*', 'neurodiver*', 'neurotypical', 'dyslex*', 'dysgraph*', 'dyspraxi*', 'dyscalcul*', 'OCD', 'PTSD', 'trauma*', 'bipolar', 'schizo*', 'depress*', 'anxiety', 'panic', 'phobi*', 'insomnia', 'migraine*', 'epilep*', 'seizure*', 'concussion', 'injur*', 'fatigue', 'cancer', 'diabet*', 'asthma', 'pregnan*', 'menopaus*', 'dementia'] },
  { group: 'Health: care', words: ['medicat*', 'meds', 'prescri*', 'therap*', 'counsel*', 'psychiatr*', 'psycholog*', 'hospital', 'hospitals', 'hospitali*', 'surgery', 'rehab', 'clinic', 'antidepress*', 'stimulant*', 'dose', 'dosage'] },
  { group: 'Health: body and senses', words: ['blind', 'deaf', 'hearing', 'eyesight', 'wheelchair', 'stutter*', 'tremor*', 'pain', 'painful', 'headache*', 'sleep', 'sleeps', 'sleepless', 'tired', 'exhaust*', 'burnout', 'burnt out', 'burned out'] },
  { group: 'Health: substances and harm', words: ['addict*', 'alcohol*', 'drunk', 'drinking', 'sober', 'sobriety', 'drug', 'drugs', 'overdos*', 'eating disorder', 'anorex*', 'bulimi*', 'self-harm', 'suicid*', 'relapse*', 'recovery'] },
  { group: 'Health: learning support', words: ['learning difference', 'learning difficulty', 'learning disability', 'special needs', 'IEP', 'accommodation*', 'extra time', 'remedial'] },
  { group: 'State of mind', words: ['sad', 'sadness', 'unhappy', 'miserable', 'lonely', 'loneliness', 'afraid', 'scared', 'frightened', 'worried', 'worry', 'worries', 'nervous', 'overwhelm*', 'ashamed', 'shame', 'guilt', 'guilty', 'embarrass*', 'insecure', 'insecurity', 'self-esteem', 'self-doubt', 'unconfident', 'frustrat*', 'discourag*', 'hopeless*', 'unmotivated', 'lazy', 'procrastinat*', 'perfectionis*', 'impostor', 'imposter', 'obsess*', 'avoidant', 'avoidance', 'defensive', 'fragile', 'grief', 'grieving', 'heartbroken', 'homesick'] },
  { group: 'Hard events in her life', words: ['died', 'death', 'dead', 'funeral', 'bereav*', 'divorc*', 'breakup', 'broke up', 'laid off', 'fired', 'evicted', 'arrested', 'abuse*', 'assault*', 'violence', 'victim*'] },
  { group: 'Identity: gender and sexuality', words: ['gender*', 'sex', 'sexual*', 'gay', 'lesbian', 'bisexual', 'queer', 'LGBT*', 'trans', 'transgender', 'nonbinary', 'non-binary', 'asexual', 'heterosexual', 'homosexual', 'cisgender', 'cis', 'they/them', 'she/her', 'he/him', 'preferred pronouns'] },
  { group: 'Identity: race, origin and language', words: ['race', 'racial', 'ethnic*', 'nationality', 'heritage', 'minority', 'person of color', 'people of color', 'POC', 'BIPOC', 'Asian', 'Latina', 'Latino', 'Latinx', 'Hispanic', 'Indigenous', 'Native American', 'African American', 'Arab', 'biracial', 'mixed-race', 'immigra*', 'refugee*', 'undocumented', 'asylum', 'citizen*', 'foreign*', 'ESL', 'EFL', 'second language', 'first language', 'mother tongue', 'native speaker', 'non-native', 'accent'] },
  { group: 'Identity: religion and belief', words: ['religio*', 'faith', 'spiritual*', 'Christian*', 'Catholic*', 'Protestant*', 'Mormon*', 'Muslim*', 'Islam*', 'Jewish', 'Judaism', 'Hindu*', 'Buddhis*', 'Sikh*', 'atheis*', 'agnostic*', 'church', 'mosque', 'synagogue', 'temple', 'pray*', 'God'] },
  { group: 'Identity: politics', words: ['Democrat*', 'Republican*', 'left-wing', 'right-wing', 'socialist', 'communist', 'libertarian', 'MAGA', 'activist', 'voter', 'voted'] },
  { group: 'Identity: age and stage of life', words: ['years old', 'year-old', 'aged', 'teen', 'teens', 'teenage*', 'underage', 'elderly', 'retired', 'retiree', 'middle-aged', 'freshman', 'grader', 'high schooler', 'middle schooler'] },
  { group: 'Identity: money and home', words: ['wealthy', 'low-income', 'working-class', 'middle-class', 'upper-class', 'homeless', 'unemployed', 'welfare', 'food stamps'] },
  { group: 'Identity: family', words: ['married', 'unmarried', 'widow*', 'single mother', 'single father', 'single parent', 'adoptee', 'foster child'] },
];

/** List B: stops the note unless it is plainly about the writing (a List C word in the same note clears it). */
export const LIST_B: NoteWordGroup[] = [
  { group: 'Gender and age', words: ['woman', 'women', 'man', 'men', 'girl*', 'boy*', 'female', 'male', 'lady', 'ladies', 'guy', 'guys', 'feminine', 'masculine', 'young', 'younger', 'old', 'older', 'adult*', 'child', 'children', 'kid', 'kids', 'baby', 'minor', 'junior', 'senior', 'sophomore', 'student*', 'college', 'school'] },
  { group: 'Family', words: ['mother', 'father', 'mom', 'dad', 'parent', 'parents', 'parental', 'parenting', 'wife', 'husband', 'partner', 'boyfriend', 'girlfriend', 'son', 'daughter', 'sister', 'brother', 'family'] },
  { group: 'Words with two meanings', words: ['Black', 'white', 'straight', 'native', 'class', 'poor', 'rich', 'liberal', 'conservative', 'progressive', 'political', 'politics', 'patient', 'clinical', 'treatment', 'doctor'] },
  { group: 'Feelings and attention', words: ['feel', 'feels', 'felt', 'feeling*', 'mood*', 'stress', 'stressed', 'stressful', 'motivation', 'fear*', 'anger', 'angry', 'anxious', 'emotion*', 'emotional', 'confident', 'confidence', 'sensitive', 'doubt*', 'focus*', 'attention', 'memory', 'energy'] },
];
export const LIST_B_WORDS: readonly string[] = LIST_B.flatMap((g) => g.words);

/** List C: writing words. They clear List B only, never List A. */
export const LIST_C_WORDS: readonly string[] = ['character', 'characters', 'characterisation', 'characterization', 'narrator*', 'protagonist*', 'hero', 'heroine', 'villain*', 'cast', 'dialogue', 'scene', 'scenes', 'chapter*', 'story', 'stories', 'novel', 'novels', 'novella*', 'poem*', 'poetry', 'stanza*', 'line', 'lines', 'essay*', 'memoir*', 'script', 'scripts', 'screenplay*', 'play', 'fiction', 'nonfiction', 'fantasy', 'romance', 'thriller*', 'mystery', 'genre*', 'reader*', 'audience', 'voice', 'tone', 'point of view', 'POV', 'tense', 'plot', 'plots', 'plotting', 'subplot*', 'ending', 'endings', 'opening', 'openings', 'draft*', 'sentence*', 'paragraph*', 'verb', 'verbs', 'noun', 'nouns', 'comma', 'commas', 'theme', 'themes', 'topic', 'topics', 'subject', 'subjects', 'argument', 'arguments', 'thesis', 'claim', 'claims', 'evidence', 'source', 'sources', 'citation*', 'image', 'images', 'imagery', 'metaphor*', 'description*', 'detail', 'details', 'pacing', 'structure', 'outline*', 'heading*', 'title', 'titles', 'report', 'reports', 'memo', 'memos', 'memorandum', 'memoranda', 'proposal*', 'pitch', 'pitches', 'article', 'articles', 'part', 'parts', 'page', 'pages'];

// ---- the matcher ----
// Matching (the kit): whole words, any letter case. A star means any ending ("diagnos*" matches "diagnosis" and "diagnosed"). One entry is capitals only, because the small word is ordinary:
// ADD. A phrase must appear as written (its spaces may be any run of spaces or line breaks; its apostrophes straight or curly).
// A "whole word" here is one no letter or digit touches. An apostrophe does NOT join a word to its neighbour: "she's" holds "she", "Maria's" holds "Maria". This filter is wide on purpose.
const CAPITALS_ONLY = new Set(['ADD']);
const L = '(?<![\\p{L}\\p{N}_])';
const R = '(?![\\p{L}\\p{N}_])';
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

function entryRe(entry: string): RegExp {
  const star = entry.endsWith('*');
  const stem = star ? entry.slice(0, -1) : entry;
  const body = esc(stem).replace(/\\?'/g, "['’]").replace(/ +/g, '\\s+');
  return new RegExp(`${L}${body}${star ? '\\p{L}*' : ''}${R}`, CAPITALS_ONLY.has(entry) ? 'u' : 'iu');
}
/** Whether one list entry (a word, a phrase, "stem*" or ADD) matches a text, by the filter's own rule. Used by the check on the lists themselves (no List C entry may match an A or B entry, nor the reverse). */
export const entryMatches = (entry: string, text: string): boolean => entryRe(entry).test(text.normalize('NFC'));
type Compiled = Array<{ entry: string; re: RegExp }>;
const compile = (words: readonly string[]): Compiled => words.map((entry) => ({ entry, re: entryRe(entry) }));
const hits = (text: string, list: Compiled): string[] => list.filter(({ re }) => re.test(text)).map(({ entry }) => entry);

export const LIST_A_WORDS: readonly string[] = LIST_A.flatMap((g) => g.words);
const A_RES = compile(LIST_A_WORDS);
const B_RES = compile(LIST_B_WORDS);
const C_RES = compile(LIST_C_WORDS);

export interface NoteVerdict {
  /** true = the note may be proposed to her */
  pass: boolean;
  /** which step stopped it: 1 (a List A hit), 2 (a List B hit and no List C word), or 0 (nothing to propose) */
  step: 0 | 1 | 2 | null;
  /** the entries that matched (for the check's own message; never shown to her) */
  hits: string[];
}

/**
 * Check M8, the note filter (runner-kit.md v0.3 section 4). Rules section 8 and red line R13: nothing is kept that guesses at her health, her identity or her state of mind.
 * It runs on every note the AI PROPOSES, on the server, before she is shown the proposal. A note she types herself, and her own interview answers, never come here.
 *   Step 1  any List A word or phrase: stop it. Nothing clears a List A hit.
 *   Step 2  a List B word and no List C word: stop it.
 *   Step 3  otherwise let it through. (M1, never "I", and M3, 15 words at most, still apply to a proposal; they belong to the reply guard and the prompt, not to this word search.)
 * The lists are wide on purpose: a stopped note costs her nothing (she can add any note herself); a note that slips through is the harm.
 */
export function noteFilter(text: unknown): NoteVerdict {
  if (typeof text !== 'string' || text.trim() === '') return { pass: false, step: 0, hits: [] };
  const t = text.normalize('NFC');
  const a = hits(t, A_RES);
  if (a.length > 0) return { pass: false, step: 1, hits: a };
  const b = hits(t, B_RES);
  if (b.length > 0 && hits(t, C_RES).length === 0) return { pass: false, step: 2, hits: b };
  return { pass: true, step: null, hits: [] };
}
