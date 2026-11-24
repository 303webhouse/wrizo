// SEARCH WORDS (PRESETS-B item 5, Nov 23; the PRESETS load sheet v2, section 5, copied word for word - Fable: "the team's calls S1-S4 are accepted"). They let a writer find a preset, a structure or a deck by a word that is not its name ("dissertation" finds Thesis or Dissertation).
// They are never shown: they only match what she types (the search box itself is build item 8, More; this stores the words beside each item, ready). The sheet's rules: all lower case; a word or a short phrase; an item's own name is not repeated (it always matches);
// no product or brand name and no how-to book title (S2); a person's surname only where that item's "?" already credits them (S3); never a word that promises what the item does not do. Keyed by the item's own id: a preset's (reorg/docKinds.ts), a plan structure's
// (reorg/backMenu/planPresets.ts), a deck's (decks/library). 38 presets, 15 structures and 22 decks are built; the four GATED items keep their words ready and are attached to nothing the app builds (S1: 79 items in all, not the whole catalogue).
// Results should show the kind and the family beside the name, because names repeat (there are two presets named Feature; a preset, a structure and a deck can share one name): finding-presets.md section 5, build item 8's.

export type SearchKind = 'preset' | 'structure' | 'deck';

/** the presets the PARTS menu builds (reorg/docKinds.ts), by id */
export const PRESET_SEARCH: Readonly<Record<string, readonly string[]>> = {
  "short-story": ["story", "short fiction", "fiction", "tale"],
  novel: ["book", "fiction", "manuscript", "chapters"],
  "personal-essay": ["essay", "creative nonfiction", "personal narrative", "first person"],
  poem: ["poetry", "verse", "lyric"],
  memoir: ["life story", "autobiography", "my story", "family history"],
  "flash-fiction": ["microfiction", "very short story", "short short", "sudden fiction"],
  novella: ["short novel", "long story", "novelette"],
  "lyric-essay": ["poetic essay", "experimental essay", "creative nonfiction", "fragments"],
  "collage-essay": ["fragments", "segmented essay", "mosaic essay", "experimental essay"],
  treatment: ["film treatment", "story outline", "pitch document", "prose outline"],
  "how-to-guide": ["instructions", "tutorial", "manual", "step by step", "how to"],
  "academic-research": ["research paper", "imrad", "scientific paper", "study", "paper"],
  "argumentative-essay": ["argument", "persuasive essay", "position paper", "essay"],
  "literature-review": ["lit review", "review of the literature", "sources", "synthesis"],
  "class-essay": ["school essay", "five paragraph essay", "homework", "assignment", "essay"],
  "thesis-or-dissertation": ["phd", "doctorate", "masters", "capstone"],
  "lab-report": ["experiment", "science report", "lab write-up", "practical"],
  "research-proposal": ["prospectus", "research plan", "study plan", "proposal"],
  memo: ["memorandum", "internal note", "to from re"],
  report: ["business report", "findings", "executive summary", "recommendations"],
  proposal: ["business proposal", "bid", "quote", "statement of work"],
  "meeting-minutes": ["minutes", "meeting notes", "action items", "agenda"],
  "grant-application": ["grant", "funding", "grant proposal", "funder", "nonprofit"],
  "one-pager": ["one page", "summary", "brief", "fact sheet"],
  "decision-memo": ["decision", "options", "recommendation", "briefing note"],
  "product-spec": ["spec", "requirements", "prd", "product requirements", "feature spec"],
  "status-update": ["update", "progress report", "weekly update", "where things stand"],
  "blog-post": ["blog", "post", "article", "web article"],
  newsletter: ["email newsletter", "issue", "mailing list"],
  "news-story": ["news", "article", "news article", "reporting"],
  feature: ["feature story", "article", "longform", "magazine piece"],
  "op-ed": ["opinion", "opinion piece", "editorial", "commentary"],
  profile: ["portrait", "interview piece", "person"],
  explainer: ["explain", "how it works", "background", "questions and answers"],
  "screenplay-feature": ["screenplay", "film script", "movie", "script"],
  "tv-half-hour": ["sitcom", "comedy pilot", "tv script", "teleplay", "episode"],
  "tv-hour": ["drama pilot", "tv script", "teleplay", "episode"],
  "short-film": ["short", "short screenplay", "film script", "script"],
};

/** the structures the PLAN tab builds (reorg/backMenu/planPresets.ts), by id */
export const STRUCTURE_SEARCH: Readonly<Record<string, readonly string[]>> = {
  three: ["three act structure", "three acts", "beginning middle end", "plot"],
  hero: ["hero's journey", "monomyth", "quest", "call to adventure"],
  stasis: ["stasis", "rhetoric", "what is at issue", "finding the argument"],
  circle: ["circle", "eight steps", "character change", "harmon"],
  seven: ["seven point", "7 point", "plot points", "pinch points", "wells"],
  freytag: ["freytag", "pyramid", "five act", "tragedy", "rising action", "falling action"],
  beats: ["beat sheet", "beats", "15 beats", "screenplay beats"],
  scene: ["scene and sequel", "scene sequel", "pacing", "goal conflict disaster", "swain"],
  toulmin: ["claim", "grounds", "warrant", "argument model"],
  rogerian: ["common ground", "both sides", "compromise", "rogers"],
  oration: ["oration", "classical argument", "rhetoric", "speech", "six parts"],
  cars: ["cars", "research introduction", "introduction", "niche", "gap", "swales"],
  imrad: ["introduction methods results discussion", "scientific paper", "research paper"],
  answer: ["bottom line up front", "bluf", "pyramid", "executive summary", "minto"],
  inverted: ["news writing", "most important first", "lede"],
};

/** the decks the library builds (decks/library), by id; Fifteen Beats is the feature-screenplay deck, Research Paper (IMRaD) is research-paper */
export const DECK_SEARCH: Readonly<Record<string, readonly string[]>> = {
  "three-act": ["three act structure", "acts", "plot", "outline"],
  "hero-journey": ["monomyth", "quest", "journey"],
  "story-circle": ["circle", "eight steps", "character change"],
  "scene-sequel": ["scene and sequel", "pacing", "scenes"],
  "feature-screenplay": ["beat sheet", "beats", "screenplay beats"],
  "character-study": ["characters", "character sheet", "cast", "want and need", "backstory"],
  worldbuilding: ["world", "setting", "lore", "map", "fantasy", "science fiction"],
  "from-my-pages": ["reverse outline", "outline from draft", "what i have"],
  thesis: ["dissertation", "research question", "chapters"],
  "argument-essay": ["argument", "claim", "counterclaim", "evidence"],
  "research-paper": ["imrad", "scientific paper", "methods", "results"],
  "business-proposal": ["proposal", "pitch", "problem and solution", "budget"],
  grant: ["grant application", "funding", "need statement", "funder"],
  "feature-story": ["feature", "profile", "lede", "nut graf", "kicker"],
  "relationship-map": ["relationships", "character map", "cast", "who knows who", "family"],
  timeline: ["chronology", "dates", "events", "what happened when"],
  "literature-map": ["lit review", "themes", "sources", "synthesis"],
  "narrow-my-question": ["research question", "topic", "narrow down", "focus", "choosing a topic"],
  "pitch-story": ["pitch", "presentation", "elevator pitch", "investors"],
  "logic-model": ["theory of change", "inputs outputs outcomes", "programme plan", "evaluation"],
  "interview-notes": ["interviews", "sources", "quotes", "reporting"],
  "memory-map": ["memories", "memoir", "remembering", "life events"],
};

/** GATED (a real reader has not yet seen the item's origin note, or the game family's owner has not read it): the words are ready, and attached to nothing the app builds */
export const GATED_SEARCH: { readonly presets: Readonly<Record<string, readonly string[]>>; readonly structures: Readonly<Record<string, readonly string[]>> } = {
  presets: {
    "braided-essay": ["braid", "woven essay", "threads", "strands"],
    zuihitsu: ["following the brush", "pillow book", "miscellany", "lists", "fragments"],
    "game-design-document": ["gdd", "game design", "design doc", "game doc"],
  },
  structures: {
    kishotenketsu: ["kishotenketsu", "four part", "four-part turn", "ki sho ten ketsu", "no conflict"],
  },
};

const TABLE: Record<SearchKind, Readonly<Record<string, readonly string[]>>> = { preset: PRESET_SEARCH, structure: STRUCTURE_SEARCH, deck: DECK_SEARCH };
/** An item's search words; none for an item the app does not build (a gated one, or an id it does not know). */
export function searchWordsOf(kind: SearchKind, id: string): readonly string[] {
  return TABLE[kind][id] ?? [];
}
