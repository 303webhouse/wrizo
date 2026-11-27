// #117 - A CARET THE APP PLACES. ForwardOnlyEditor (Free Write) keeps the caret at the end after every render unless the writer moved it (a press, a navigation key). The way-back restore (components/useWayBack.ts -> PageEditor applyCaret) puts the
// caret where she left it - not a press, not a key - so the end-anchor saw nothing to leave alone, and any render after the restore's last re-assert (rAF, 80, 200, 350 ms) put the caret back at the end (the selection on the host itself, offset 2).
// The app announces a caret it places with this event on the host; the editor treats it as the writer's move until the next insert.
export const CARET_PLACED = 'wz-caret-placed';

// HER PLACE, ASKED FOR (the Guide walk, on leaving): something that covered the page asks the page editor to take her back to where she left her words. PageEditor answers on window with preventDefault(); a surface
// with no answer leaves the asker to do it itself.
export const CARET_HOME = 'wz-caret-home';
