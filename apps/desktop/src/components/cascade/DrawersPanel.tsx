import { PlaceSwitcher } from '../PlaceSwitcher';
import type { CascadeContext } from './shared';

// the `drawers` category is the place switcher (PlaceSwitcher.tsx); boards are listed by the Boards pop-out, and every row carries data-link-entry for the connector [CascadePanels §16]
export function DrawersPanel({ closeCascade }: CascadeContext) {
  return <PlaceSwitcher onChosen={closeCascade} />;
}

