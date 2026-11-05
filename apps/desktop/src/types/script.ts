// The Screenplay Room's document (conformant per `docs/fragments-under-pages-canon.md` §3). One styled block per element; a Scene is the addressable unit (its heading and body elements are fragments OF the scene, but links and ports always point at the Scene, never an element). `dual`/`struck`/`number`/`omitted`/`beatId` are reserved, not built: present here, never written by the UI. [index §17]
export type ScriptElType = 'scene' | 'action' | 'character' | 'paren' | 'dialogue' | 'transition' | 'shot' | 'general';

export interface ScriptEl {
  id: string;
  t: ScriptElType;
  text: string;
  dual?: 'L' | 'R';   // reserved — S5 (dual dialogue)
  struck?: boolean;   // reserved — S4 (script Free-write)
}

export interface Scene {
  id: string;             // == heading.id (stable across saves; see scriptDoc.ts)
  heading: ScriptEl;
  body: ScriptEl[];
  number?: string;        // reserved — production suite
  omitted?: boolean;      // reserved — production suite
  beatId?: string;        // reserved — the structure spine's P3 (fragment-granular seam)
}

export interface TitlePageFields {
  title?: string;
  byline?: string;
  contact?: string;
}

export interface ScriptDoc {
  v: 1;
  title?: TitlePageFields; // dormant until S2
  scenes: Scene[];
}
