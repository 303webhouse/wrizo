import type { Scene, ScriptDoc, ScriptEl } from '../types';

// S1 — pure helpers for the Screenplay Room's flat-editing model. The block
// editor works on a FLAT array of elements (one styled block per element,
// only the active one live) — far simpler than juggling nested scene/body
// arrays mid-edit. A scene boundary is just "the next element with
// t==='scene'" (the smart int./ext. conversion promotes an action into one
// live, growing the doc by a scene with no separate "new scene" op). These
// functions convert between that flat view and the persisted Scene[] shape.
// A Scene's id is always its heading element's id — stable across saves with
// no separate id bookkeeping, since heading elements persist across edits.

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function flattenScenes(scenes: Scene[]): ScriptEl[] {
  return scenes.flatMap(s => [s.heading, ...s.body]);
}

// Regroup a flat element array back into scenes. `prevScenes` (the scenes
// this flat array was flattened FROM) is consulted so a scene's dormant
// fields (`number`/`omitted`/`beatId` — reserved-not-built, never written by
// S1's UI) travel forward when its heading id is unchanged, rather than
// being silently dropped by the regroup.
export function groupIntoScenes(elements: ScriptEl[], prevScenes: Scene[] = []): Scene[] {
  const prevById = new Map(prevScenes.map(s => [s.id, s]));
  const scenes: Scene[] = [];
  for (const el of elements) {
    if (el.t === 'scene') {
      const prev = prevById.get(el.id);
      scenes.push({
        id: el.id,
        heading: el,
        body: [],
        ...(prev?.number != null ? { number: prev.number } : null),
        ...(prev?.omitted != null ? { omitted: prev.omitted } : null),
        ...(prev?.beatId != null ? { beatId: prev.beatId } : null),
      });
      continue;
    }
    // An element before any scene heading — normally impossible (a doc always
    // starts with a scene-heading element), but Tab/Ctrl+N can retype that
    // very first element away from 'scene'. Synthesize an empty leading
    // heading rather than dropping the element (no data loss either way).
    if (scenes.length === 0) {
      const headingId = newId();
      scenes.push({ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] });
    }
    scenes[scenes.length - 1].body.push(el);
  }
  if (scenes.length === 0) {
    const headingId = newId();
    scenes.push({ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] });
  }
  return scenes;
}

// A fresh script page's starting document: one scene, one empty heading
// element — the caret's ghost home (DoD 1: no title demanded).
export function createEmptyScriptDoc(): ScriptDoc {
  const headingId = newId();
  return { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] }] };
}

export function newElement(t: ScriptEl['t'], text = ''): ScriptEl {
  return { id: newId(), t, text };
}
