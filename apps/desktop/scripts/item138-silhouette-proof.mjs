// ITEM 138 — PAGE-PINS ARE TALL. Browserless proof of the parts that are decidable
// without a browser, with the parts that are NOT stated as the box run's.
//
// Ruled: NEW pins born TALL · EXISTING pins keep stored geometry UNTIL TOUCHED,
// then the lock applies · "touched" means RESIZED ONLY (a move is not a touch) ·
// CONSTRAIN FORWARD, NEVER SNAP · and 138 KEYS TO THE ENTRY KIND (`pageType` of
// the pinned entry), NEVER THE BOX KIND — "or a builder flips EVERY board card to
// tall and undoes Nick's wide-board ruling."
//
// ⚠ WHAT THIS INSTRUMENT IS. `persistence.ts` reaches `localStorage` at module
// init and pulls in the lexicon (which imports react), so importing it here would
// mean stubbing a chain of six modules — and a proof whose scaffolding is larger
// than its subject is a proof nobody will trust. So this READS THE REAL SOURCE and
// computes over the REAL constants: the numbers it checks are the numbers the app
// ships, not a copy kept in step by hand.
//
// ⚠ AND WHAT IT IS NOT. It proves the CONSTANTS and the WIRING. It cannot prove a
// rendered pixel or a real drag. "A nested board's card stays wider than tall
// after a resize" is a HARNESS check and belongs to the box run — named here so
// its absence is a stated gap rather than a silent one.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const read = (rel) => readFileSync(join(repo, rel), 'utf8').replace(/\r\n/g, '\n');

// ⚠ COMMENTS MUST BE BLANKED BEFORE ANY "is this code still here" CHECK, and this
// proof learned it the hard way on its first run: CLAIM 5 asserts the old per-axis
// ternaries are GONE, and it failed — because the comment explaining their removal
// QUOTES them. The instrument read prose as code.
//
// That is the THIRD time this exact class has bitten this arc (twice in the word
// guard: an apostrophe opening a fake string, then a regex literal containing a
// quote). Recorded here because the recurrence is the point: a matcher that cannot
// tell code from the prose describing it will keep finding the description.
// Byte positions are preserved so any line number stays true.
const blankComments = (s) => {
  let out = '';
  let mode = 'code';
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1];
    if (mode === 'code') {
      if (c === '/' && n === '/') { mode = 'line'; out += '  '; i++; continue; }
      if (c === '/' && n === '*') { mode = 'block'; out += '  '; i++; continue; }
      if (c === "'") mode = 'sq';
      else if (c === '"') mode = 'dq';
      else if (c === '`') mode = 'tpl';
      out += c; continue;
    }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += c; } else out += ' '; continue; }
    if (mode === 'block') {
      if (c === '*' && n === '/') { mode = 'code'; out += '  '; i++; continue; }
      out += c === '\n' ? c : ' '; continue;
    }
    out += c;
    if (c === '\\') { if (i + 1 < s.length) { out += s[i + 1]; i++; } continue; }
    if (mode === 'sq' && c === "'") mode = 'code';
    else if (mode === 'dq' && c === '"') mode = 'code';
    else if (mode === 'tpl' && c === '`') mode = 'code';
  }
  return out;
};

const PERS_RAW = read('apps/desktop/src/store/persistence.ts');
// Code-only view for the "is it still wired" checks; the raw text is kept for the
// one claim that is ABOUT a comment (claim 7).
const PERS = blankComments(PERS_RAW);
const BOARD_RAW = read('apps/desktop/src/components/BoardEditor.tsx');
const BOARD = blankComments(BOARD_RAW);
const CSS = read('apps/desktop/src/index.css');

let failures = 0;
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const ok = (m) => console.log('  ok   ' + m);

const num = (name, src = PERS) => {
  const m = src.match(new RegExp(`const ${name}\\s*=\\s*([0-9.]+)\\s*;`));
  if (!m) { fail(`could not read ${name} from source — the instrument, not the product`); return NaN; }
  return Number(m[1]);
};

const pinW = num('BOARD_PIN_W');
const pinH = num('BOARD_PIN_H');
const cardW = num('BOARD_CARD_W');
const cardH = num('BOARD_CARD_H');
console.log(`read from source: page ${pinW}×${pinH} (aspect ${(pinH / pinW).toFixed(3)}) | board ${cardW}×${cardH} (aspect ${(cardH / cardW).toFixed(3)})\n`);

console.log('CLAIM 1 — a PAGE card is born TALLER THAN WIDE');
{
  // Both w and h are fractions of the canvas WIDTH (BoardEditor renders
  // `box.w * pageWidthPx` and `box.h * pageWidthPx` — the same scalar twice), so
  // taller-than-wide is simply h > w, with no viewport arithmetic. That premise is
  // asserted below rather than assumed, because if it were false every number here
  // would mean something else.
  if (!(pinH > pinW)) fail(`the page card is still wide: ${pinW}×${pinH}`);
  else ok(`${pinW}×${pinH} — vertical, as Nick's thumbnail law requires`);
}

console.log('CLAIM 1b — the premise: both axes scale by the canvas WIDTH');
{
  const re = /width:\s*box\.w\s*\*\s*pageWidthPx,\s*height:\s*box\.h\s*\*\s*pageWidthPx/;
  if (!re.test(BOARD)) {
    fail('the renderer no longer scales BOTH axes by pageWidthPx — "taller than wide" would no longer mean h > w, and every constant above would need re-reading');
  } else ok('`box.w * pageWidthPx` and `box.h * pageWidthPx` — one scalar, so aspect is h/w');
}

console.log('CLAIM 2 — a BOARD card stays WIDER THAN TALL (the exclusion clause\'s product)');
{
  if (!(cardW > cardH)) fail(`the board card is no longer wide: ${cardW}×${cardH} — this is the ruling item 138 must not undo`);
  else ok(`${cardW}×${cardH} — horizontal, Nick's wide-board ruling intact`);
}

console.log('CLAIM 3 — the page card matches the RATIFIED rail thumbnail ratio');
{
  // index.css's PW2 S2 amendment: 22×30 for a page. The canvas card should be the
  // same shape, or "a page is a vertical rectangle" means two different things in
  // two places — which is the defect item 163 just finished removing elsewhere.
  const m = CSS.match(/\.wz-thumb-page::before\{\s*width:(\d+)px;\s*height:(\d+)px;/);
  if (!m) { fail('could not read the ratified page thumbnail from index.css'); }
  else {
    const railAspect = Number(m[2]) / Number(m[1]);
    const cardAspect = pinH / pinW;
    const drift = Math.abs(railAspect - cardAspect);
    if (drift > 0.1) fail(`the canvas card (${cardAspect.toFixed(3)}) and the rail thumbnail (${railAspect.toFixed(3)}) disagree by ${drift.toFixed(3)} — one shape, two meanings`);
    else ok(`rail ${railAspect.toFixed(3)} vs card ${cardAspect.toFixed(3)} — the same silhouette in both places`);
  }
}

console.log('CLAIM 4 — the reader KEYS ON THE ENTRY, and cannot be handed a Box');
{
  const before = failures;
  if (!/pinSilhouetteFor\(entry: Pick<JournalEntry, 'pageType'> \| null \| undefined\)/.test(PERS)) {
    fail("pinSilhouetteFor's parameter is no longer an entry-shaped Pick — a Box could be passed to it");
  }
  if (!/entry\?\.pageType === 'board'/.test(PERS)) {
    fail("the silhouette no longer keys on the ENTRY's pageType — 138's ratified exclusion clause");
  }
  // And the box kind must NOT be what decides the shape.
  if (/PIN_SILHOUETTE\[[^\]]*box\.kind/.test(PERS) || /pinSilhouetteFor\(\s*box\b/.test(PERS)) {
    fail('the silhouette is being chosen from a BOX — this is exactly the flip the exclusion clause forbids');
  }
  if (failures === before) ok('keyed on the pinned entry, and the signature refuses a Box');
}

console.log('CLAIM 5 — the birth site uses the one reader, with no loose ternaries left');
{
  const before = failures;
  if (!/w: silhouette\.w, h: silhouette\.h,/.test(PERS)) fail('the birth site no longer takes its shape from the reader');
  if (/nesting \? BOARD_CARD_W : BOARD_PIN_W/.test(PERS)) fail('the per-axis ternaries are back — the choice is spelled twice again');
  if (failures === before) ok('one call, one shape');
}

console.log('CLAIM 6 ⛔ CONSTRAIN FORWARD, NEVER SNAP — the lock is in the RESIZE path only');
{
  const before = failures;
  // The lock must live in the resizing branch...
  const resizing = BOARD.slice(BOARD.indexOf("if (phase === 'resizing'"));
  if (!/b\.kind === 'page-pin' && resizeStart!\.pinAspect != null/.test(resizing)) {
    fail('the page-pin lock is not in the resizing branch');
  }
  // ...and the MOVING branch must still change only x and y. This is the whole of
  // "never snap": if a move rewrote w/h, an existing card would be reshaped by
  // being dragged, which is migration of arrangement by another name.
  const movingLine = BOARD.match(/setBoxes\(startBoxes\.map\(b => \(ids\.has\(b\.id\) \? \{ \.\.\.b, ([^}]*)\} : b\)\)\);/);
  if (!movingLine) fail('could not find the move commit — the instrument cannot judge "never snap"');
  else if (/\bw:|\bh:/.test(movingLine[1])) fail(`the MOVE path writes geometry (${movingLine[1].trim()}) — a drag would reshape a card`);
  else ok(`the move path writes only ${movingLine[1].trim().replace(/\s+/g, ' ')} — a move is not a touch`);
  if (failures === before) ok('the lock applies where the writer changes shape, and nowhere else');
}

console.log('CLAIM 7 — the superseded comment is MARKED, not rewritten');
{
  // Park discipline, applied to prose: AB4 S4 said a page-pin has "no aspect
  // lock". That was true when written and is now half-false. The sentence stays,
  // with the change recorded beside it.
  const hasOriginal = /a page-pin card resizes freeform on both axes \(no aspect lock/.test(BOARD_RAW);
  const hasMark = /SUPERSEDED IN PART BY ITEM 138/.test(BOARD_RAW);
  if (!hasOriginal) fail('AB4 S4\'s original sentence was rewritten instead of marked');
  else if (!hasMark) fail('AB4 S4\'s sentence is now false and carries no supersession mark');
  else ok('AB4 S4 kept verbatim, with item 138 marked beside it');
}

console.log('\nSTATED GAP — owed to the box run, not provable here:');
console.log('  · a real resize of a nested board\'s card leaves it WIDER THAN TALL (the ratified harness check)');
console.log('  · a real resize of a page card takes the vertical silhouette');
console.log('  · an untouched existing card opens with its stored geometry unchanged');

console.log('\n' + (failures === 0
  ? 'ITEM 138 PROOF: CLEAN — constants and wiring hold'
  : `ITEM 138 PROOF: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
