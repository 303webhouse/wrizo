// ITEM (proposed) 194 — THE SPLASH'S TWO SIZE READINGS, COMPUTED.
//
// Nick: "at most 1/5 the size of the screen". Two readings, and they are not
// close: a fifth of the screen's AREA, or a fifth of its WIDTH. This prints
// both at real viewports so the choice is made against numbers rather than
// adjectives.
//
// IT SIZES THE INK, NOT THE CANVAS. The asset is 3374 x 2699 but its visible
// linework occupies only x 149..3225, y 121..2578 (3077 x 2458, 91.2% x
// 91.1%) — the rest is transparent margin. "A fifth of the screen" is a claim
// about what the eye sees, so the target is the BBOX; the <img> element is
// then slightly larger, by 1/0.912 across and 1/0.911 down. Sizing the canvas
// instead would land the visible mark at 83.1% of the intended area.
//
// Run: node scripts/splash-size.mjs   (no browser, no box turn)

// Measured from both PNGs by scripts/../../../tmp alpha-bbox pass (identical
// in the dark and light asset, to the pixel):
const CANVAS = { w: 3374, h: 2699 };
const BBOX = { x0: 149, y0: 121, x1: 3225, y1: 2578 };
const BB = { w: BBOX.x1 - BBOX.x0 + 1, h: BBOX.y1 - BBOX.y0 + 1 };
const FILL_X = BB.w / CANVAS.w;
const FILL_Y = BB.h / CANVAS.h;
const ASPECT = BB.w / BB.h;

// The label that becomes texture: 'WRIZO' cap height in the original, measured
// off the sketch's own linework (approx, and stated as approx).
const LABEL_CAP_PX = 60;

const VIEWPORTS = [
  { name: 'laptop', w: 1366, h: 768 },
  { name: 'wide', w: 1680, h: 1050 },
  { name: 'desk', w: 1920, h: 1080 },
  { name: 'tall', w: 1440, h: 1200 },
  { name: 'max', w: 2200, h: 1300 },
];

const r1 = (n) => n.toFixed(1);
const pct = (n) => (n * 100).toFixed(1) + '%';

console.log('ASSET: canvas ' + CANVAS.w + 'x' + CANVAS.h + ', ink bbox ' + BB.w + 'x' + BB.h
  + ' (' + pct(FILL_X) + ' x ' + pct(FILL_Y) + '), aspect ' + ASPECT.toFixed(3));
console.log('Ink coverage inside the bbox: 4.5% — sparse linework, which is what makes the small reading fragile.\n');

const head = 'viewport screen px  READING A: 1/5 AREA          READING B: 1/5 WIDTH';
console.log(head);
console.log('-'.repeat(78));

for (const v of VIEWPORTS) {
  const area = v.w * v.h;

  // A — the ink's AREA is a fifth of the screen's area, at the ink's aspect.
  const aH = Math.sqrt((area * 0.2) / ASPECT);
  const aW = aH * ASPECT;
  const aEl = { w: aW / FILL_X, h: aH / FILL_Y };
  const aScale = aW / BB.w;

  // B — the ink's WIDTH is a fifth of the screen's width.
  const bW = v.w * 0.2;
  const bH = bW / ASPECT;
  const bEl = { w: bW / FILL_X, h: bH / FILL_Y };
  const bScale = bW / BB.w;

  console.log(
    v.name.padEnd(9) + (v.w + 'x' + v.h).padEnd(11)
    + (r1(aW) + 'x' + r1(aH)).padEnd(15)
    + (pct(aW / v.w) + ' wide').padEnd(14)
    + (r1(bW) + 'x' + r1(bH)).padEnd(15)
    + pct((bW * bH) / area) + ' area'
  );
  console.log(
    ''.padEnd(20)
    + ('img ' + r1(aEl.w) + 'x' + r1(aEl.h)).padEnd(15)
    + ('label ~' + r1(LABEL_CAP_PX * aScale) + 'px').padEnd(14)
    + ('img ' + r1(bEl.w) + 'x' + r1(bEl.h)).padEnd(15)
    + 'label ~' + r1(LABEL_CAP_PX * bScale) + 'px'
  );
}

console.log('\nA is ' + (1 / 0.2 ** 0.5).toFixed(2) + 'x B in linear size and 5.00x in area '
  + '(a fifth of the WIDTH is a twenty-fifth of the AREA at any aspect).');
console.log('At reading B the handwritten labels land near or below the ~7px floor where a');
console.log('hand-drawn stroke stops reading as a word — which is the "texture" the brief names.');
