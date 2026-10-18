// THE AUTISM ECONOMY SEED - the layout, checked without a browser. Runs the same builder the seed script saves (autism-economy-plan.mjs) on the
// real seed folder, and checks what the brief asserts after --apply (README section 6): the essay has its 8 section headings plus Sources and
// about 5,600 words; the board holds 1 Draft pin, 6 headers and 52 source cards, all inside the canvas; 58 links - each header to the pin,
// each card to its own header.
// Run: node apps/desktop/scripts/seed/autism-economy-check.mjs --seed-dir <the unzipped autism-economy-seed folder>
import { boardShape, buildBoard, CANVAS_W, essayStats, planStats, readSeed } from './autism-economy-plan.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const dir = arg('--seed-dir');
if (!dir) { console.log('AUTISM-ECONOMY-CHECK VERIFY: FAIL - pass --seed-dir <the unzipped autism-economy-seed folder>'); process.exit(1); }
const { essay, plan } = readSeed(dir);

const es = essayStats(essay);
ok('ESSAY: titled "The Autism Economy", 8 section headings plus Sources, about 5,600 words (README section 6)',
  es.title === 'The Autism Economy' && es.sections === 8 && es.sourcesHeading && es.words > 5000 && es.words < 6400, JSON.stringify(es));
const ps = planStats(plan);
ok('PLAN: 6 columns, 52 source cards, every header linked to the Draft pin, every card to its header', ps.columns === 6 && ps.cards === 52 && ps.headersToPin === 6 && ps.cardsToHeader === 52, JSON.stringify(ps));
ok('PLAN: one source card per source line in the essay\'s Sources list', ps.cards === es.sourceLines, JSON.stringify({ cards: ps.cards, sourceLines: es.sourceLines }));

let n = 0;
const newId = () => `t${++n}`;
const pinned = [
  { id: 'meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0 },
  { id: 'pin', kind: 'page-pin', entryId: 'PAGE', x: 0.05, y: 0.05, w: 0.16, h: 0.22, z: 1, onCanvas: true },
];
const boxes = buildBoard({ plan, pinned, pageId: 'PAGE', newId });
const shape = boardShape(boxes, 'PAGE');
ok('BOARD: 1 Draft pin on the canvas, 6 headers, 52 source cards, 58 links (6 header-to-pin + 52 card-to-header)',
  shape.pins === 1 && shape.draftPin && shape.pinOnCanvas && shape.headers === 6 && shape.sourceCards === 52 && shape.links === 58 && shape.cardsLinkedToHeaders === 52, JSON.stringify(shape));
ok(`BOARD: the canvas is ${CANVAS_W} px wide and every card lies inside it (fractions of the width, the plan's pixels one-to-one)`,
  shape.canvasW === CANVAS_W && shape.inCanvas, JSON.stringify({ canvasW: shape.canvasW, inCanvas: shape.inCanvas }));
const firstCard = boxes.find((b) => b.kind === 'text' && b.text.startsWith('Knudsen'));
ok('BOARD: a card sits where the plan puts it (Knudsen 2021 at 300,130, 230 x 96 px)',
  !!firstCard && Math.abs(firstCard.x * CANVAS_W - 300) < 1e-6 && Math.abs(firstCard.y * CANVAS_W - 130) < 1e-6 && Math.abs(firstCard.w * CANVAS_W - 230) < 1e-6 && Math.abs(firstCard.h * CANVAS_W - 96) < 1e-6,
  JSON.stringify(firstCard && { x: firstCard.x * CANVAS_W, y: firstCard.y * CANVAS_W, w: firstCard.w * CANVAS_W, h: firstCard.h * CANVAS_W }));
ok('BOARD: ids are unique and the pin keeps the id the app gave it', new Set(boxes.map((b) => b.id)).size === boxes.length && boxes.some((b) => b.id === 'pin'), String(boxes.length));

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nAUTISM-ECONOMY-CHECK VERIFY: PASS (${checks.length} checks)` : `\nAUTISM-ECONOMY-CHECK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
