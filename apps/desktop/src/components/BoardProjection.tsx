import { useDeskLexicon } from '../store/deskLexicon';
import {
  boardStructure, flattenLane, withSeqOrder, withLane, withParent, withLanes,
  type OutlineNode, type StructureLane,
} from '../store/boardStructure';
import type { Box } from '../types';
import { generateId } from '../store/persistence';

// BM1 S6/S7 — the STORYBOARD and OUTLINE projections. Both are renderers of the
// ONE structure description (store/boardStructure.ts) derived from the board's
// own boxes; neither owns a copy, neither forks the deck. OPEN is unchanged and
// lives in BoardEditor. Reorder/lane/nest are GENUINE button clicks (not HTML5
// drag) so every structural edit travels under a real trusted pointer — the
// same discipline the flip and the doors are held to — while the ORDER they
// write (`seq`) is the board's cross-mode truth: reorder in STORYBOARD and
// OUTLINE shows the same order, because both read the same tree.
//
// Card text edited in OUTLINE writes the SAME box.text OPEN reads (onEditText →
// BoardEditor.commitText), so "the same words everywhere" is literally true.

type BoardMutator = (updater: (prev: Box[]) => Box[]) => void;

interface ProjectionProps {
  boxes: Box[];
  setBoxes: BoardMutator;
  labelFor: (b: Box) => string;   // reuses BoardEditor's own boxLabel (page-pin/ink read live)
  onEditText: (boxId: string, text: string) => void; // reuses commitText
  readOnly?: boolean;             // a system board never structures (defensive; not mounted there)
}

const byId = (boxes: Box[]) => new Map(boxes.map((b) => [b.id, b]));

// Siblings of a card = cards sharing its lane AND its parent, in cross-mode
// order. Used by every reorder/indent op so a move is always within one group.
function siblingIdsOf(boxes: Box[], laneId: string, cardId: string): string[] {
  const struct = boardStructure(boxes);
  const lane = struct.lanes.find((l) => l.id === laneId);
  if (!lane) return [];
  let found: OutlineNode[] | null = null;
  const search = (nodes: OutlineNode[], parent: OutlineNode | null) => {
    if (nodes.some((n) => n.boxId === cardId)) found = nodes;
    for (const n of nodes) search(n.children, n);
  };
  search(lane.items, null);
  return (found ?? []).map((n) => n.boxId);
}

function move(boxes: Box[], laneId: string, cardId: string, dir: -1 | 1): Box[] {
  const sibs = siblingIdsOf(boxes, laneId, cardId);
  const i = sibs.indexOf(cardId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sibs.length) return boxes;
  const next = sibs.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return withSeqOrder(boxes, next);
}

// --- STORYBOARD ------------------------------------------------------------

function LaneColumn({ lane, boxes, setBoxes, labelFor, laneOptions, readOnly }: {
  lane: StructureLane; boxes: Box[]; setBoxes: BoardMutator; labelFor: (b: Box) => string;
  laneOptions: { id: string; title: string }[]; readOnly?: boolean;
}) {
  const { t } = useDeskLexicon();
  const map = byId(boxes);
  const flat = flattenLane(lane); // one ordered column; nesting is OUTLINE's concern
  return (
    <div className="board-lane" data-lane-id={lane.id || '__default'}>
      <div className="board-lane-title">{lane.title || t('boardLaneDefault')}</div>
      {flat.map((boxId, idx) => {
        const b = map.get(boxId);
        if (!b) return null;
        return (
          <div key={boxId} className="board-sb-card" data-sb-card={boxId}>
            <span className="board-sb-card-label">{labelFor(b)}</span>
            {!readOnly && (
              <span className="board-sb-card-ctl">
                <button type="button" className="btn-quiet board-sb-up" aria-label="Move up" disabled={idx === 0}
                  onClick={() => setBoxes((prev) => move(prev, lane.id, boxId, -1))}>↑</button>
                <button type="button" className="btn-quiet board-sb-down" aria-label="Move down" disabled={idx === flat.length - 1}
                  onClick={() => setBoxes((prev) => move(prev, lane.id, boxId, 1))}>↓</button>
                {laneOptions.length > 0 && (
                  <select className="board-sb-lane" aria-label="Lane" value={lane.id}
                    onChange={(e) => setBoxes((prev) => withLane(prev, boxId, e.target.value || undefined))}>
                    <option value="">{t('boardLaneDefault')}</option>
                    {laneOptions.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                )}
              </span>
            )}
          </div>
        );
      })}
      {flat.length === 0 && <div className="board-lane-empty" />}
    </div>
  );
}

export function StoryboardProjection({ boxes, setBoxes, labelFor, readOnly }: ProjectionProps) {
  const { t } = useDeskLexicon();
  const struct = boardStructure(boxes);
  const hasCards = struct.lanes.some((l) => l.items.length > 0);
  const meta = boxes.find((b) => b.kind === 'board-meta');
  const laneOptions = (meta?.lanes ?? []);

  const addLane = () => {
    const next = [...laneOptions, { id: generateId(), title: `${t('boardLaneDefault')} ${laneOptions.length + 1}` }];
    setBoxes((prev) => withLanes(prev, next, generateId));
  };

  if (!hasCards) {
    return <div className="board-projection board-storyboard" data-board-projection="storyboard">
      <p className="board-projection-empty">{t('boardStoryboardEmpty')}</p>
    </div>;
  }
  return (
    <div className="board-projection board-storyboard" data-board-projection="storyboard">
      <div className="board-lanes">
        {struct.lanes.map((lane) => (
          <LaneColumn key={lane.id || '__default'} lane={lane} boxes={boxes} setBoxes={setBoxes}
            labelFor={labelFor} laneOptions={laneOptions} readOnly={readOnly} />
        ))}
      </div>
      {!readOnly && (
        <button type="button" className="btn-quiet board-add-lane" onClick={addLane}>+ {t('boardLaneDefault')}</button>
      )}
    </div>
  );
}

// --- OUTLINE (the nesting floor — render AND edit genuine nesting) ----------

function OutlineRow({ node, laneId, boxes, setBoxes, labelFor, onEditText, depth, siblings, index, readOnly }: {
  node: OutlineNode; laneId: string; boxes: Box[]; setBoxes: BoardMutator;
  labelFor: (b: Box) => string; onEditText: (boxId: string, text: string) => void;
  depth: number; siblings: string[]; index: number; readOnly?: boolean;
}) {
  const map = byId(boxes);
  const b = map.get(node.boxId);
  if (!b) return null;
  const editable = b.kind === 'text';

  // Indent: become a child of the immediately-preceding sibling (Tab in an
  // outliner). Outdent: become a sibling of the current parent.
  const indent = () => {
    if (index <= 0) return;
    setBoxes((prev) => withParent(prev, node.boxId, siblings[index - 1]));
  };
  const outdent = () => {
    const parent = b.parentId;
    if (!parent) return; // already top-level
    const parentBox = map.get(parent);
    setBoxes((prev) => withParent(prev, node.boxId, parentBox?.parentId));
  };

  return (
    <li className="board-outline-row" data-outline-row={node.boxId} style={{ marginLeft: depth * 20 }}>
      <span className="board-outline-bullet" aria-hidden="true">•</span>
      {editable ? (
        <input
          className="board-outline-text"
          data-outline-input={node.boxId}
          defaultValue={b.text ?? ''}
          readOnly={readOnly}
          onBlur={(e) => { if (!readOnly) onEditText(node.boxId, e.target.value); }}
        />
      ) : (
        <span className="board-outline-text board-outline-readonly">{labelFor(b)}</span>
      )}
      {!readOnly && (
        <span className="board-outline-ctl">
          <button type="button" className="btn-quiet board-ol-up" aria-label="Move up" disabled={index === 0}
            onClick={() => setBoxes((prev) => move(prev, laneId, node.boxId, -1))}>↑</button>
          <button type="button" className="btn-quiet board-ol-down" aria-label="Move down" disabled={index === siblings.length - 1}
            onClick={() => setBoxes((prev) => move(prev, laneId, node.boxId, 1))}>↓</button>
          <button type="button" className="btn-quiet board-ol-indent" aria-label="Indent" disabled={index === 0}
            onClick={indent}>→</button>
          <button type="button" className="btn-quiet board-ol-outdent" aria-label="Outdent" disabled={!b.parentId}
            onClick={outdent}>←</button>
        </span>
      )}
      {node.children.length > 0 && (
        <ul className="board-outline-children">
          {node.children.map((child, i) => (
            <OutlineRow key={child.boxId} node={child} laneId={laneId} boxes={boxes} setBoxes={setBoxes}
              labelFor={labelFor} onEditText={onEditText} depth={depth + 1}
              siblings={node.children.map((c) => c.boxId)} index={i} readOnly={readOnly} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OutlineProjection({ boxes, setBoxes, labelFor, onEditText, readOnly }: ProjectionProps) {
  const { t } = useDeskLexicon();
  const struct = boardStructure(boxes);
  const hasCards = struct.lanes.some((l) => l.items.length > 0);
  if (!hasCards) {
    return <div className="board-projection board-outline" data-board-projection="outline">
      <p className="board-projection-empty">{t('boardOutlineEmpty')}</p>
    </div>;
  }
  return (
    <div className="board-projection board-outline" data-board-projection="outline">
      {struct.lanes.map((lane) => (
        <section key={lane.id || '__default'} className="board-outline-section" data-outline-section={lane.id || '__default'}>
          {lane.title && <h3 className="board-outline-section-title">{lane.title}</h3>}
          <ul className="board-outline-list">
            {lane.items.map((node, i) => (
              <OutlineRow key={node.boxId} node={node} laneId={lane.id} boxes={boxes} setBoxes={setBoxes}
                labelFor={labelFor} onEditText={onEditText} depth={0}
                siblings={lane.items.map((n) => n.boxId)} index={i} readOnly={readOnly} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
