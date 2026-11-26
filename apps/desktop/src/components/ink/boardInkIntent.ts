// VISUAL 1a.3 - "DRAW ON A BOARD": the page's door asks the Board it opens to start on its canvas with the INK tab out. One request, in memory only (nothing saved), taken by the Board it names.
let wanted: string | null = null;

export function requestBoardInk(boardId: string): void { wanted = boardId; }
export const boardInkWanted = (boardId: string): boolean => wanted === boardId;
export function clearBoardInk(boardId: string): void { if (wanted === boardId) wanted = null; }
