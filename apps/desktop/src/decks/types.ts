import type { DeskTermId } from '../store/deskLexicon';

// The deck engine's shape. A Card Deck is a preset: an optional wizard that narrows choices, then deals a pre-built set of cards onto a board. This file is the ENTIRE static-data contract a deck definition satisfies; the engine (DeckWizard.tsx + engine.ts) is deck-agnostic: it renders what a definition declares and calls its own `deal`. Zero schema: a DeckDefinition is a plain static in-memory object, never persisted, never user data, shipped with the app like KIND_META/PICKER_GROUPS (store/kindLabels.ts); nothing here is a database row or a new Box field. Lexicon discipline: every string a definition names is a DeskTermId (a lexicon KEY), never a raw string, resolved through deskTerm() at deal time (engine.ts), the non-hook escape hatch persistence.ts's SYSTEM_BOARD_TITLE_TERM and kindLabels.ts already use. [types §1]

export type DeckRoom = 'fiction' | 'speculative' | 'screen' | 'academy' | 'business' | 'newsroom' | 'every';   // 'every' (W3): From my pages, which belongs to no one room

// Every question names its own narrowing choices (catalog Law 5): few,
// concrete, clickable options. `noteTerm` is the ONE escape hatch R6 itself
// names ("text entry permitted... never required") — here specialized to
// Feature Screenplay's own "routes pilot-seekers onward in COPY ONLY" (S2):
// picking an option MAY surface a quiet inline note before advancing, but
// never blocks advancing and never changes what gets dealt on its own (a
// deck's own `deal` function decides that, same as any other answer).
export interface DeckQuestionOption {
  id: string;
  labelTerm: DeskTermId;
  noteTerm?: DeskTermId;
}

export interface DeckQuestion {
  id: string;
  promptTerm: DeskTermId;
  options: DeckQuestionOption[];
  // W3 - 'pages': not a choice among options but the writer's OWN PAGES, picked in order (From my pages). `options` is empty and the answer is the page ids joined by ','. Absent = a choice question.
  kind?: 'pages';
}

// questionId -> the chosen option's own id.
export type DeckAnswers = Record<string, string>;

// A card the deal function wants dealt. `key` is a LOCAL id (unique only
// within one `deal()` call) used to wire `threadTo` references before real
// Box ids exist — engine.ts's materializeDeck resolves both into real
// generateId()'d Box ids and real 'connection' boxes at deal time. x/y/w/h
// are normalized page-width fractions, the SAME coordinate system every
// other Box already uses (BoardEditor.tsx's own convention) — the deal
// function owns this geometry directly (decks/layout.ts's helpers are pure
// arithmetic reuse, not a hidden auto-layout engine; every deck's own file
// chooses which column/row each card lands in).
//
// `title`/`body` are plain, already-resolved strings — but every deck's own
// deal() function builds them ONLY by calling deskTerm() (store/
// deskLexicon.ts's established non-hook lexicon escape hatch, the SAME one
// persistence.ts's SYSTEM_BOARD_TITLE_TERM and pageHome.ts's own
// `${deskTerm('pageFacePinnedTo')} ${title}.` composition already use), so
// every literal English word still lives in exactly one place — deskLexicon
// .ts's own CANONICAL map — even for a composed title (Character Study's
// own "Character A: Want vs. Need", built from two lexicon terms + a
// generated letter, no raw hardcoded prose anywhere in a deck file).
export interface DealtCardSpec {
  key: string;
  title: string;
  body: string;
  // W3 - a Tier 1 step is dealt as a QUESTION, not text: `body` is '' and these two ride onto the box (types/index.ts Box.prompt / Box.deckStep). A spec without them (a deck that has
  // not been given guided content, or a hand-built one) deals exactly as it always did.
  prompt?: string;
  deckStep?: { deck: string; step: string };
  // W3 - From my pages: the page this card is grafted to. The engine only RECORDS it (MaterializedDeal.grafts); the caller makes the graft through the board (BoardEditor.onDeckDealt).
  graftTo?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  threadTo?: string[];
}

/** The word a deck's "Add ..." door and its child cards use ("Add scenes…", "Add beats…"). The words themselves live in the lexicon (kidDoor_<word> and its siblings); the deck only names which. A deck with none has no door. */
export type ChildWord = 'scene' | 'beat' | 'moment' | 'entry' | 'subsection' | 'section' | 'point' | 'part';

export interface DeckDefinition {
  id: string;
  room: DeckRoom;
  childWord?: ChildWord;
  nameTerm: DeskTermId;
  questions: DeckQuestion[];
  deal: (answers: DeckAnswers) => DealtCardSpec[];
}
