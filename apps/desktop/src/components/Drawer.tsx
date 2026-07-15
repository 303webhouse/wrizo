import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { ToolRail, type ToolRailContent } from './ToolRail';
import { PageFace, type PageFaceSubject } from './PageFace';
import { PlaceFace, type PlaceKind } from './PlaceFace';
import { AddToSheet } from './AddToSheet';

// AB3 S1 — the Drawer. One component in DeskFrame's existing toolrail track:
// fixed geometry (the track's current width — a per-theme CSS constant,
// --drawer-width in index.css, currently the same 200px at every theme), a
// face registry (tools · page · place:<journal|shelf|drawers>), and the
// slide (a short translate/opacity flip on the FACE CONTENT only — the
// track's own rect never changes size, the ab2.1 lesson applied from day
// one; see ab3.mjs's geometry-floor checks). AB2's ToolRail becomes the
// `tools` face's content verbatim — composed here, not rebuilt; nothing
// ToolRail learned is thrown away. The whole drawer carries the vanishing
// law like every zone: it rides the SAME chrome-fade desk-dissolve class
// DeskFrame already puts on .desk-frame-toolrail — no second fade engine.
export type DrawerFaceId = 'tools' | 'page' | 'place:journal' | 'place:shelf' | 'place:drawers';

const PLACES: PlaceKind[] = ['journal', 'shelf', 'drawers'];

function placeTermId(place: PlaceKind): DeskTermId {
  return place === 'journal' ? 'drawerPlaceJournal' : place === 'shelf' ? 'drawerPlaceShelf' : 'drawerPlaceDrawers';
}

export interface DrawerProps {
  toolsContent: ToolRailContent;
  subject: PageFaceSubject;
}

export function Drawer({ toolsContent, subject }: DrawerProps) {
  const { t } = useDeskLexicon();
  const [face, setFace] = useState<DrawerFaceId>('tools');
  const [fileTarget, setFileTarget] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // S6 guardrail — "a keystroke dissolves the face with the room": resuming
  // typing anywhere collapses an open Page/Place face back to the default
  // Tools face, same instinct as the rest of the vanishing law (writing
  // recedes chrome). Ignore keydowns that originate inside the drawer
  // itself (a pull's own Enter/Space activation shouldn't immediately
  // dissolve the face it just opened).
  useEffect(() => {
    if (face === 'tools') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as Node | null;
      if (rootRef.current && target && rootRef.current.contains(target)) return;
      setFace('tools');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [face]);

  const toggle = (next: DrawerFaceId) => setFace(f => (f === next ? 'tools' : next));

  return (
    <div className="wz-drawer" ref={rootRef}>
      <div className="wz-drawer-nav">
        <button
          type="button"
          className={`wz-drawer-pull wz-drawer-pull-page${face === 'page' ? ' active' : ''}`}
          aria-pressed={face === 'page'}
          onClick={() => toggle('page')}
        >
          {t('drawerPage')}
        </button>
        <div className="wz-drawer-sep" role="separator" aria-orientation="horizontal" />
        <div className="wz-drawer-places">
          {PLACES.map(place => (
            <button
              key={place}
              type="button"
              className={`wz-drawer-pull wz-drawer-pull-place${face === `place:${place}` ? ' active' : ''}`}
              aria-pressed={face === `place:${place}`}
              data-place={place}
              onClick={() => toggle(`place:${place}` as DrawerFaceId)}
            >
              {t(placeTermId(place))}
            </button>
          ))}
        </div>
      </div>

      <div className="wz-drawer-face" data-face={face} key={face}>
        {face === 'tools' && <ToolRail content={toolsContent} />}
        {face === 'page' && <PageFace subject={subject} />}
        {face.startsWith('place:') && (
          <PlaceFace place={face.slice('place:'.length) as PlaceKind} onFileSend={id => setFileTarget(id)} />
        )}
      </div>

      {/* File/Send from a place face — the Add-to grammar inward, scoped to
          whichever OTHER item the writer picked from the list (not the
          subject page itself; that's the Page face's own Move/Copy verb). */}
      {fileTarget && (
        <AddToSheet
          sourceIds={[fileTarget]}
          onClose={() => setFileTarget(null)}
          onDone={() => setFileTarget(null)}
        />
      )}
    </div>
  );
}
