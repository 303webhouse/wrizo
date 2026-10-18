// THE AUTISM ECONOMY SEED - the pure half: read the seed folder, check it, and lay the sources board out. No browser, no app: the seed script
// (autism-economy.mjs) and its browserless check (autism-economy-check.mjs) both import this, so the check proves the very layout the script
// saves. The plan's coordinates are BOARD PIXELS (seed-plan.json "units"); a Wrizo box stores fractions of the canvas WIDTH (x, y, w and h alike
// - types/index.ts Box), so the board's own canvas is set to CANVAS_W pixels wide (its board-meta canvasW, the writer's canvas resize) and every
// pixel is divided by it: the plan lands one-to-one.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const CANVAS_W = 1880;          // the plan's right-most column ends at 1830 px
export const ESSAY_FILE = 'the-autism-economy.md';
export const PLAN_FILE = 'seed-plan.json';

/** The seed folder (the unzipped autism-economy-seed/): the essay's text and the plan. */
export function readSeed(dir) {
  const essay = readFileSync(join(dir, ESSAY_FILE), 'utf8').replace(/\r\n/g, '\n');
  const plan = JSON.parse(readFileSync(join(dir, PLAN_FILE), 'utf8'));
  return { essay, plan };
}

/** The essay as the brief describes it (README: about 5,600 words, 8 section headings plus Sources). Counted the house way, on the words. */
export function essayStats(text) {
  const lines = text.split('\n');
  const words = text.replace(/[#*_>`]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return {
    title: (lines.find((l) => /^# /.test(l)) || '').replace(/^# /, ''),
    sections: lines.filter((l) => /^## /.test(l) && !/^## Sources\s*$/.test(l)).length,
    sourcesHeading: lines.some((l) => /^## Sources\s*$/.test(l)),
    sourceLines: (() => { const i = lines.findIndex((l) => /^## Sources\s*$/.test(l)); return i < 0 ? 0 : lines.slice(i + 1).filter((l) => /^- /.test(l)).length; })(),
    words,
  };
}

/** The plan's own shape: 6 columns, 52 source cards, every header linked to the Draft pin and every card to its header. */
export function planStats(plan) {
  const cols = plan.board.columns;
  return {
    columns: cols.length,
    cards: cols.reduce((n, c) => n + c.cards.length, 0),
    headersToPin: cols.filter((c) => c.header.linkTo === 'draftPin').length,
    cardsToHeader: cols.reduce((n, c) => n + c.cards.filter((k) => k.linkTo === 'header').length, 0),
  };
}

/**
 * The finished board: the boxes it holds after `pinPageToBoard` made the Draft's pin (`pinned` - the board-meta and the pin, as the app stored
 * them) - the pin moved and sized to the plan, the canvas set to CANVAS_W, then six header cards, 52 source cards and 58 connectors (the
 * connector-a shape BoardEditor writes: { kind: 'connection', connA, connB }, all else zero). `newId` is the caller's id source.
 */
export function buildBoard({ plan, pinned, pageId, newId }) {
  const f = (px) => px / CANVAS_W;
  const meta0 = pinned.find((b) => b.kind === 'board-meta');
  const pin0 = pinned.find((b) => b.kind === 'page-pin' && b.entryId === pageId);
  if (!pin0) throw new Error('the Draft page is not pinned on the board');
  const P = plan.board.draftPin;
  const allBottoms = [P.y + P.h, ...plan.board.columns.flatMap((c) => [c.header.y + c.header.h, ...c.cards.map((k) => k.y + k.h)])];
  const canvasH = Math.max(...allBottoms) + 80;
  const meta = meta0
    ? { ...meta0, canvasW: CANVAS_W, canvasH }
    : { id: newId(), kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasW: CANVAS_W, canvasH };
  let z = Math.max(0, ...pinned.map((b) => b.z || 0));
  const pin = { ...pin0, x: f(P.x), y: f(P.y), w: f(P.w), h: f(P.h), onCanvas: true };
  const out = [meta, pin];
  const text = (t, at) => ({ id: newId(), kind: 'text', x: f(at.x), y: f(at.y), w: f(at.w), h: f(at.h), z: ++z, text: t });
  const link = (a, b) => ({ id: newId(), kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: ++z, connA: a, connB: b });
  for (const col of plan.board.columns) {
    const header = text(col.header.text, col.header);
    out.push(header, link(header.id, pin.id));
    for (const card of col.cards) {
      const c = text(card.text, card);
      out.push(c, link(c.id, header.id));
    }
  }
  return out;
}

/** What a finished board holds, read the way the app reads a board (live boxes by kind) - the assertion's half. */
export function boardShape(boxes, pageId) {
  const live = boxes.filter((b) => !b.deletedAt && !b.purgedAt);
  const pins = live.filter((b) => b.kind === 'page-pin');
  const texts = live.filter((b) => b.kind === 'text');
  const conns = live.filter((b) => b.kind === 'connection');
  const pin = pins.find((b) => b.entryId === pageId);
  const headerIds = new Set(conns.filter((c) => pin && (c.connB === pin.id || c.connA === pin.id)).map((c) => (c.connA === pin.id ? c.connB : c.connA)));
  const toHeader = conns.filter((c) => headerIds.has(c.connB) && !headerIds.has(c.connA)).length;
  const meta = live.find((b) => b.kind === 'board-meta');
  return {
    pins: pins.length, draftPin: !!pin, pinOnCanvas: !!pin && pin.onCanvas === true,
    headers: headerIds.size, sourceCards: texts.length - headerIds.size, links: conns.length, cardsLinkedToHeaders: toHeader,
    canvasW: meta ? meta.canvasW : null,
    inCanvas: live.every((b) => b.kind === 'connection' || b.kind === 'board-meta' || (b.x >= 0 && b.x + b.w <= 1 + 1e-9 && b.y >= 0)),
  };
}
