import type { ReactNode } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { getDrawer } from '../store/persistence';
import { UNSORTED, isDefaultRoot } from '../store/place';
import { usePlace } from '../store/usePlace';
import { ThemeIcon } from './ThemeIcon';
import { useTheme } from '../store/theme';
import { rackReadout } from '../store/fluxReadouts';

// BIG PROJECTS 1a - THE PLACE BLOCK. The top of the rail: an icon and the name of the Drawer or Journal the writer is in, on a brass edge.
// Pressing it opens the switcher (the `drawers` category panel, same id, so every data-category selector still finds it). It lives INSIDE the
// strip, which is a fixed DeskFrame track already wearing chrome-fade and desk-dissolve - so it recedes with the rest of the rail while typing, and
// never moves, resizes or unmounts the page (PAGE IS PRIMARY: it is a tool that orbits).
export function PlaceBlock({ active, onToggle, drawerIcon, journalIcon }: { active: boolean; onToggle: () => void; drawerIcon: ReactNode; journalIcon: ReactNode }) {
  const { t } = useDeskLexicon();
  const theme = useTheme();
  const place = usePlace();
  const isJournal = place.kind === 'journal';
  // FLUX V2: the top drawer, while it still carries its born-with name, is shown by the theme's word for it (Flux: Root; Arbor: the same name). Render-time only - the stored name is never touched.
  const drawer = isJournal || place.id === UNSORTED ? null : getDrawer(place.id);
  const name = isJournal ? t('drawerPlaceJournal') : place.id === UNSORTED ? t('switcherUnsorted') : drawer ? (isDefaultRoot(drawer) ? t('placeRootName') : drawer.name) || t('drawerPlaceDrawers') : t('drawerPlaceDrawers');
  // FLUX V2: a real rack reads "RACK ▸ <name>" and wraps in the narrow rail (the readout the brief names); the aria-label keeps the plain name.
  const label = theme === 'flux' && drawer ? rackReadout(name) : name;
  return (
    <div className="wz-strip-section wz-place-section">
      <button type="button" data-category="drawers" data-place-kind={place.kind}
        className={`wz-strip-item wz-place-block${active ? ' active' : ''}`} aria-pressed={active} aria-label={`${t('switcherHeading')}: ${name}`} onClick={onToggle}>
        <span className="wz-strip-glyph wz-place-icon" aria-hidden="true"><ThemeIcon id={isJournal ? 'log' : 'rack'} fallback={isJournal ? journalIcon : drawerIcon} /></span>
        <span className="wz-strip-label wz-place-name">{label}</span>
      </button>
    </div>
  );
}
