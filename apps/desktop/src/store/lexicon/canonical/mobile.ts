import type { DeskTermId } from '../terms';

// THE COMPANION'S WORDS (MOBILE slice 1, from MOBILE's kit, companion-mockups.md §3: "Words for slice 1", Machina's voice, Title Case). Every word a writer sees on the phone comes through here, never typed into a screen.
// The "+" has NO word (Nick, Nov 23); mobileAddName is its spoken name for a screen reader only. The word "Catch" is never used.
// Arbor's and Flux's own nouns for Unfiled, Boards, Cards, Assets, Docs and Projects are in overrides/arborReorg.ts and overrides/fluxReorg.ts (the words those themes already use for the same things); the rest of their companion words wait for the Wrizors.
export const CANONICAL_MOBILE = {
  mobileDesk: 'Desk',
  mobileLibrary: 'Library',
  mobileDocs: 'Docs',
  mobileProjects: 'Projects',
  mobileUnfiled: 'Unfiled',
  mobileFind: 'Find',
  mobilePinned: 'Pinned',
  mobileRecent: 'Recent',
  mobileRead: 'Read',
  mobilePlan: 'Plan',
  mobileAssets: 'Assets',
  mobileAll: 'All',
  mobileCards: 'Cards',
  mobileBoards: 'Boards',
  mobileSendTo: 'Send To',
  mobileChange: 'Change',
  mobileSend: 'Send',
  mobileNote: 'Note',
  mobileMobile: 'Mobile',
  mobileWaiting: 'Waiting',
  mobileShowAs: 'Show As',
  mobileWall: 'Wall',
  mobileList: 'List',
  mobileAddCard: 'Add Card',
  mobileNoPart: 'No Part yet',
  // the + 's spoken name (a screen reader only; the button carries no word)
  mobileAddName: 'Add a note, photo, sketch or recording',
  // plain lines the screens need that the kit's list does not name (working words in the same voice; the Wrizors own the final lexicon)
  mobileBack: 'Back',
  mobileNoteLabel: 'Your note',
  mobileNothingHere: 'Nothing here yet.',
  mobileNoResults: 'Nothing found.',
  mobileNoPlace: 'Choose a place first.',
  mobileSignIn: 'Sign In',
  // a Doc chosen as the place whose own connected Boards are none (Fable, Nov 24, in her words); and leaving the note unfiled
  mobileDocNoBoard: 'This Doc has no Board yet',
  mobileLeaveUnfiled: 'Leave It Unfiled',
} as const satisfies Partial<Record<DeskTermId, string>>;
