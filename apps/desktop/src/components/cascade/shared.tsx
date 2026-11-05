import { useEffect, useRef, type ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { firstLine, plainLines } from '../../store/entryText';
import { useSectionFold } from '../../store/sectionFold';
import { getOrCreateSystemBoard } from '../../store/persistence';
import { type PageFaceSubject } from '../PageFace';
import type { JournalEntry, Project } from '../../types';

// CD2 S3 — the seven category panels (layer 2), one function each. All read
// the persistence store DIRECTLY at render time (the SAME "no cached
// snapshot" discipline PlaceFace.tsx/DrawersTree.tsx/ProjectHome.tsx already
// use) rather than being handed pre-fetched lists as props — so every panel
// (and, via `buildSurvey` below, every survey) reflects the LATEST store
// state on every render, including the render immediately after a delete
// (App.tsx's own persistence `subscribe(forceRender)` already re-renders
// this whole subtree on every write; nothing here needs its own refresh
// plumbing on top of that established house pattern).
// B1 S5 — 'trash' joins the roster: section C's own quiet foot entry.
// BIG PROJECTS 1a: 'shelf' leaves the roster (its pages are shown in the Journal); 'drawers' is now the PLACE BLOCK's switcher.
export type CategoryId = 'journal' | 'page' | 'plan' | 'drawers' | 'trash' | 'settings' | 'theme';

// B1 S5 — find-or-create + travel, straight to the Board (no intermediate
// hop through the '/journal' bridge route — App.tsx's own header comment
// on JournalBoardGate explains why that bridge exists for every OTHER old
// link; this is new code with nothing old to bridge from).
export function openJournalBoard(navigate: NavigateFunction): void {
  const board = getOrCreateSystemBoard('journal');
  navigate(`/page/${board.id}`);
}
export function openTrashBoard(navigate: NavigateFunction): void {
  const board = getOrCreateSystemBoard('trash');
  navigate(`/page/${board.id}`);
}
// B2 S1 — the Shelf Board's own find-or-create + travel door, the SAME
// shape as its journal/trash siblings.
function openShelfBoard(navigate: NavigateFunction): void {
  const board = getOrCreateSystemBoard('shelf');
  navigate(`/page/${board.id}`);
}

// A survey "kind" is a small description of WHAT to browse, not a snapshot
// of the items themselves — Cascade.tsx stores one of these as its own
// survey state, and `buildSurvey` (bottom of this file) recomputes the
// actual item list fresh every render. This is what makes a delete from
// inside the survey (Plan's own Delete verb) show up immediately without
// any manual re-fetch.
export type CascadeSurveyKind =
  | { category: 'journal' }
  // AB4 S1 — the CD2 erratum comes true: picking a board swaps this SAME
  // column one layer deeper, to that board's own cards. A nested kind rather
  // than a second piece of Cascade.tsx state — `survey` already generalizes
  // to "whatever the writer is currently browsing," and reusing it means
  // dock/undock/Escape/keystroke-dissolve all keep working with zero new
  // plumbing.
  //
  // PW1 S1/PW3 — THE `'plan'` VARIANT RETIRES WITH THE `Open…` LINK THAT WAS
  // ITS ONLY DOOR. It surveyed `getBinderPages(projectId)` — the boards that
  // merely LIVE IN THIS PAGE'S DRAWER — which is co-location, not connection,
  // and is the wrong subject this whole slice exists to correct. The board
  // list is now the PANEL itself (PW3: "the panel IS the list"), so a board
  // row is pressed one layer higher up and this kind is reached directly.
  // ORIGINAL, quoted so the retirement is legible rather than silent:
  //   | { category: 'plan'; projectId: string }
  // `projectId` retires from 'plan-board' with it — its ONLY reader was that
  // branch's `onBack`, which now walks back to the panel (the list) instead of
  // to a second survey. Dropping it is also what lets a LOOSE page open its
  // own connected board: there is no project to name, and there never needed
  // to be one.
  | { category: 'plan-board'; boardId: string; boardTitle: string };
// B2 S1/S3/S7 — 'shelf' and 'drawers' BOTH retire from this union: the
// Shelf category's own panel is now a single quiet door (ShelfPanel,
// mirroring Trash — no nested list to survey), and the Drawers panel (S7)
// is now a large-tile view whose tiles travel directly, never opening a
// nested survey column (the old Drawer-entity choose-a-drawer -> survey-
// its-filed-pages flow retires whole). Park sweep note beside buildSurvey,
// below — both branches quoted verbatim, A4.

export interface CascadeContext {
  subject: PageFaceSubject;
  project: Project | null;
  navigate: NavigateFunction;
  openSurvey: (kind: CascadeSurveyKind) => void;
  // PW1 S1/S5 — walk back from a survey to the PANEL, which is now the list
  // (PW3). The survey's `‹` used to open a second survey; with the board list
  // living one layer up there is nothing to open, only a layer to close.
  closeSurvey: () => void;
  // PW1 S4 — travel that KEEPS THE RAIL. Stages the cascade's current shape so
  // the destination mounts with the same category and survey open, then
  // navigates. Every travel originated from inside the cascade goes through
  // here; ordinary navigation elsewhere is untouched.
  travelFromCascade: (entry: JournalEntry) => void;
  // BIG PROJECTS 1a - close the whole cascade (the switcher closes after a choice).
  closeCascade: () => void;
}

export function itemTitle(entry: JournalEntry): string {
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  if (!entry.text.trim()) return hasInk ? 'A sketch' : 'Untitled';
  return firstLine(entry.text).slice(0, 60);
}
export function itemExcerpt(entry: JournalEntry): string | undefined {
  const lines = plainLines(entry.text);   // excerpts are plain text [CascadePanels §1]
  return lines.slice(1, 3).join(' ').slice(0, 140) || undefined;
}
export function byRecent(a: JournalEntry, b: JournalEntry): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

// FoldSection: one disclosure for every list-bearing section, keyed by a stable content-independent id; the collapsed body stays mounted (for the height transition) but inert and aria-hidden [CascadePanels §2]
export function FoldSection({
  sectionKey, title, itemCount, headerVariant, titleClassName, children,
}: {
  sectionKey: string;
  title: string;
  itemCount: number;
  headerVariant: 'drawers' | 'journal';
  titleClassName?: string;
  children: ReactNode;
}) {
  const [collapsed, toggle] = useSectionFold(sectionKey, itemCount);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (collapsed) el.setAttribute('inert', ''); else el.removeAttribute('inert');
  }, [collapsed]);
  return (
    // FX9 S4 harness note: `data-collapsed`/`data-open` are written as
    // explicit 'true'/'false' STRINGS (not passed-through booleans) — the
    // SAME defensive convention Cascade.tsx's own `data-visible` already
    // uses for a data-* attribute, rather than relying on React's own
    // boolean-to-data-attribute stringification. `aria-expanded`/
    // `aria-hidden` stay raw booleans, matching this file's/Sliver.tsx's/
    // CascadeSurvey.tsx's own existing `aria-expanded={open}` precedent.
    <div className="wz-fold" data-collapsed={collapsed ? 'true' : 'false'}>
      <button
        type="button"
        className={`wz-fold-header wz-fold-header--${headerVariant}`}
        aria-expanded={!collapsed}
        onClick={toggle}
      >
        <span className={titleClassName}>{title}</span>
        <span className="wz-fold-chevron" aria-hidden="true">▸</span>
      </button>
      <div className="wz-fold-body-wrap" data-open={collapsed ? 'false' : 'true'}>
        <div className="wz-fold-body-inner" ref={bodyRef} aria-hidden={collapsed}>
          {children}
        </div>
      </div>
    </div>
  );
}

