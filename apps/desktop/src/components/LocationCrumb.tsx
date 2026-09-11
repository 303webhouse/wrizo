import type { JournalEntry, Project } from '../types';
import { describePageHome } from '../store/pageHome';
import type { Drawer } from '../types';

// PW1 S6 (Nick, Q7: RIDES THIS ARC) — THE ADDRESS LINE, in the shape the Board
// already proved. REUSE, NEVER COPY: `BoardEditor.tsx`'s framed header row is
// `crumb (marginRight:auto) · strip · actions`, and its crumb is
// `drawer / project / here`. That row shape is the precedent; this component is
// the one implementation of its crumb, so Page and Screenplay cannot drift from
// each other the way their two hand-rolled copies already had.
//
// ON RECORD, so it is not re-litigated: CD1 S1 removed this DELIBERATELY
// (`PageEditor.tsx`, "the top-bar title retires (the crumb/breadcrumb it
// duplicated — the Page face already carries the same title + 'where it lives'
// chain via describePageHome, S3)"), re-homing "where it lives" into the Page
// face INSIDE A DRAWER. On the framed desk that made the question cost two
// presses and a drawer, and the writer had to already know which drawer. Nick's
// hardware falsified the trade; Q7 returns it. A RULED TRADE OVERTAKEN BY
// EVIDENCE, NOT A DEFECT.
//
// THE CHAIN NEVER RENDERS EMPTY. With no drawer and no project the old markup
// fell through to a bare title, which says nothing about location at all — and
// the one case where the writer is most likely to be lost is the case where the
// address must still say something true. `describePageHome` already produces
// that string ("Loose — belongs nowhere yet"), so the honest answer was in tree
// the whole time; it simply had no reader here.
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
      {/* PW1 ERRATUM 3 (Nick's live sitting, 2026-09-09) — NOT `crumb-item`.
          That class carries `max-width:160px` + `text-overflow:ellipsis`, which
          is right for a NAME that is merely long (a drawer, a project) and
          catastrophic for a PHRASE: "Loose — belongs nowhere yet" clipped to
          "Loose — belongs now…", which does not read as a truncation at all —
          it reads as a sentence, and as the OPPOSITE of the one it is. A name
          survives elision because the reader knows a name was shortened; a
          phrase does not, because the shortened form is still grammatical.
          THE LOCATION PHRASE NEVER ELIDES; truncation is the title's to take
          (see `.crumb-here` in index.css). */}
      {homeLabel && <><span className="wz-crumb-home">{homeLabel}</span><span className="crumb-sep">/</span></>}
      <span className="crumb-here">{title}</span>
      {trailing}
    </div>
  );
}
