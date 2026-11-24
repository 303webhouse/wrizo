// THE MOBILE BOARD (Nick, M4): the Board in Unfiled called "Mobile" that an unfiled phone note goes to. HELD: finding it again after she renames it needs a marker on the Board, which is saved data and Nick's call (rule 9, Fable Nov 24: "with Nick").
// Until he answers there is no home: a note with no place, or whose Board is gone, is HELD in the waiting queue (never lost, never blocking the notes behind it), and Desk shows no Mobile Board.
// When the marker is ruled, this is the one file that changes: find() reads the marker, make() mints the Board (via the app's own createBoardPage) with the marker and the lexicon's mobileMobile as its title.
import type { UnfiledHome } from './addNote';

export const UNFILED_HOME: UnfiledHome | null = null;
