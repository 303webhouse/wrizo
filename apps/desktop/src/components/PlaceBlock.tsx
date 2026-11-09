import type { ReactNode } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { getDrawer } from '../store/persistence';
import { UNSORTED, isDefaultRoot } from '../store/place';
import { usePlace } from '../store/usePlace';
import { ThemeIcon } from './ThemeIcon';
import { useTheme } from '../store/theme';
import { rackReadout } from '../store/fluxReadouts';
import { FLUX3 } from '../flux3/flag';

// BIG PROJECTS 1a - THE PLACE BLOCK. The top of the rail: an icon and the name of the Drawer or Journal the writer is in, on a brass edge.
// Pressing it opens the switcher (the `drawers` category panel, same id, so every data-category selector still finds it). It lives INSIDE the
// strip, which is a fixed DeskFrame track already wearing chrome-fade and desk-dissolve - so it recedes with the rest of the rail while typing, and
// never moves, resizes or unmounts the page (PAGE IS PRIMARY: it is a tool that orbits).
export function PlaceBlock({ active, onToggle, drawerIcon, journalIcon, reading }: { active: boolean; onToggle: () => void; drawerIcon: ReactNode; journalIcon: ReactNode; reading?: { count: string; hint: string } | null }) {
  const { t } = useDeskLexicon();
  const theme = useTheme();
  const place = usePlace();
  const isJournal = place.kind === 'journal';
  // FLUX V2: the top drawer, while it still carries its born-with name, is shown by the theme's word for it (Flux: Root; Arbor: the same name). Render-time only - the stored name is never touched.
  const drawer = isJournal || place.id === UNSORTED ? null : getDrawer(place.id);
  const name = isJournal ? t('drawerPlaceJournal') : place.id === UNSORTED ? t('switcherUnsorted') : drawer ? (isDefaultRoot(drawer) ? t('placeRootName') : drawer.name) || t('drawerPlaceDrawers') : t('drawerPlaceDrawers');
  // a real rack's full path reads "RACK ▸ <name>"; the narrow rail shows only the place name on one line (ellipsis), the full path in the title and the breadcrumb [PlaceBlock §1]
  const fullPath = theme === 'flux' && drawer ? rackReadout(name) : name;
  return (
    <div className="wz-strip-section wz-place-section">
      <button type="button" data-category="drawers" data-place-kind={place.kind}
        className={`wz-strip-item wz-place-block${active ? ' active' : ''}`} aria-pressed={active} aria-label={`${t('switcherHeading')}: ${name}`} title={reading ? `${fullPath}: ${reading.hint}` : fullPath} onClick={onToggle}>
        <span className="wz-strip-glyph wz-place-icon" aria-hidden="true"><ThemeIcon id={isJournal && !(FLUX3 && theme === 'flux') ? 'log' : 'rack'} fallback={isJournal && !(FLUX3 && theme === 'flux') ? journalIcon : drawerIcon} /></span>
        {/* S4b L2 (flag, Flux): in the Journal this door wears the SWITCHER's glyph (the rack) instead of the Log icon, so the Journal pin below is the only Log - the door and the pin no longer draw the same picture twice */}
        {/* bug #4 (ruled Nov 7): in the Journal the Journal pin below names the place, so this door is its icon alone - still the switcher's only door (aria-label and title keep the name) */}
        {/* S4b L2 (flag, Flux; the Wrizors, Nov 9: an empty box looked broken): the door is never blank. In the Journal it reads UNFILED, in a Drawer the Drawer's own name (two lines at most), and one true count under it */}
        {isJournal && !reading ? null : <span className="wz-strip-label wz-place-name">{isJournal ? t('pageHomeLoose') : name}</span>}
        {reading ? <span className="wz-strip-readout" aria-hidden="true">{reading.count}</span> : null}
      </button>
    </div>
  );
}
