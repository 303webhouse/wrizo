import type { JournalEntry, Project } from '../types';
import { describePageHome } from '../store/pageHome';
import type { Drawer } from '../types';

// the address line, the one implementation of the board header's crumb (drawer / project / here); it never renders empty - with no drawer or project it reads describePageHome's own words [LocationCrumb §1]
export function LocationCrumb({ entry, project, drawer, title, trailing }: {
  entry: JournalEntry;
  project: Project | null;
  drawer: Drawer | null;
  /** What the writer is standing on, already resolved by the host (page title / script title). */
  title: string;
  /** Host-specific extras that ride inside the crumb (PageEditor's "Imported" tag). */
  trailing?: React.ReactNode;
}) {
  const placed = !!drawer || !!project;
  // Only consulted when the chain would otherwise be bare — a placed page reads
  // its real chain, exactly as the Board's own crumb does.
  const homeLabel = placed ? null : describePageHome(entry, project).homeLabel;
  return (
    <div className="sprint-crumb" aria-label="Location">
      {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
      {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
      {/* not `crumb-item`: its ellipsis suits a long NAME but turns the location PHRASE into a different sentence; the phrase never elides, the title takes the truncation [LocationCrumb §2] */}
      {homeLabel && <><span className="wz-crumb-home">{homeLabel}</span><span className="crumb-sep">/</span></>}
      <span className="crumb-here">{title}</span>
      {trailing}
    </div>
  );
}
