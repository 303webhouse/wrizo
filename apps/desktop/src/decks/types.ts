import type { DeskTermId } from '../store/deskLexicon';

// B3 S1 — the deck engine's own shape. A "Card Deck" (Nick's coinage, the
// catalog's own item 36) is a preset: an optional wizard that narrows
// choices, then deals a pre-built set of cards onto a board. This file is
// the ENTIRE static-data contract every deck definition must satisfy — the
// engine (DeckWizard.tsx + engine.ts) is completely deck-agnostic: it
// renders whatever a definition declares and calls the definition's own
// `deal` function, nothing more.
//
// Zero schema (the catalog's own Law 4, this ticket's constitution): a
// DeckDefinition is a plain, static, in-memory TypeScript object — never
// persisted, never user data, shipped with the app like KIND_META/
// PICKER_GROUPS (store/kindLabels.ts) already are. Nothing in this file (or
// anything it produces) is a database row or a new Box field.
//
// Lexicon discipline (S2's own law) — every string a deck definition names
// is a DeskTermId (a lexicon KEY), never a raw string: deck names, wizard
// prompts/options, and every dealt card's title/body all resolve through
// deskTerm() at deal time (engine.ts), the SAME non-hook escape hatch
// persistence.ts's own SYSTEM_BOARD_TITLE_TERM and kindLabels.ts already
// use for exactly this "compose copy outside a component" situation.

export type DeckRoom = 'fiction' | 'speculative' | 'screen' | 'academy' | 'business' | 'newsroom';

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
  x: number;
  y: number;
  w: number;
  h: number;
  threadTo?: string[];
}

export interface DeckDefinition {
  id: string;
  room: DeckRoom;
  nameTerm: DeskTermId;
  questions: DeckQuestion[];
  deal: (answers: DeckAnswers) => DealtCardSpec[];
}
