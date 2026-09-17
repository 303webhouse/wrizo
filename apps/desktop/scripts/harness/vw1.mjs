// VW1 — THE RAIL: GROUPED BY KIND, AND SELECTED BY NAME.
//
// Two things landed under this ticket, in two commits, and this file is the
// coverage for both:
//
//   commit 1  the DOM hook (`data-category`) + 39 index selectors retired,
//             with NO regroup — a pure refactor whose proof is that the suite
//             came back green and UNCHANGED while the old order still held.
//   commit 2  the regroup itself: arrays reordered, nothing else.
//
// WHY INDEX SELECTION HAD TO DIE FIRST. `key={item.id}` is React-internal and
// never reaches the DOM, so every harness reached these buttons by position.
// An index SURVIVES a reorder and silently selects a different category —
// nothing throws, some checks go red, and others PASS AGAINST THE WRONG PANEL.
// That is item 130's shape exactly: the instrument answered the question it
// was asked, and it was not the one that mattered. Check 7 is what stops it
// growing back.
//
// THE STANDING LAWS THIS FILE OBEYS, and why each one is here:
//   · REAL POINTER EVENTS, never `.click()`. Item 130 shipped a half-
//     unreachable strip precisely because `.click()` dispatches at a node it
//     already holds and never consults the hit-testing stack.
//   · DRIVERS NEVER ASSUME EXISTENCE. A bare click on a missing node aborts
//     the file and reports nothing; every press here probes first and fails a
//     NAMED check instead.
//   · The foot's GEOMETRY is item 137's, not this file's. Trash is asserted
//     LAST IN ORDER; its rendered `y` is deliberately not asserted here.
import { withHarness } from '../runtime-verify.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// The ruled order (S1): Page·Plan — Drawers — Journal·Shelf — foot.
const RULED = ['page', 'plan', 'drawers', 'journal', 'shelf', 'settings', 'theme', 'trash'];
// The desk's own vocabulary, which the WRITER must never read (S1's law).
const DESK_WORDS = ['surface', 'container', 'display'];

const freshProsePage = async (app, w = 1366, h = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, w, h);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(300);
};

// Find a point INSIDE the target that a real pointer would actually reach —
// item 130's lesson, kept as a driver rather than re-learned.
const hittablePoint = (app, sel) => app.evalJs(`(() => {
  const e = document.querySelector(${JSON.stringify(sel)});
  if (!e) return null;
  const b = e.getBoundingClientRect();
  if (b.width <= 0 || b.height <= 0) return { found: false, why: 'zero-size' };
  for (const fy of [0.5, 0.3, 0.7]) for (const fx of [0.5, 0.3, 0.7]) {
    const x = b.left + b.width * fx, y = b.top + b.height * fy;
    const top = document.elementFromPoint(x, y);
    if (top && (top === e || e.contains(top))) return { found: true, x, y };
  }
  const c = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  return { found: false, why: 'occluded', by: c ? String(c.className).slice(0, 40) : null };
})()`);

const pressCategory = async (app, cat) => {
  const sel = `.wz-strip-item[data-category=${cat}]`;
  const p = await hittablePoint(app, sel);
  if (!p) { ok(`VW1 DRIVER: the '${cat}' tab is present to act on`, false, 'absent — never pressed'); return false; }
  if (!p.found) { ok(`VW1 DRIVER: a point inside the '${cat}' tab is reachable by a real pointer`, false, JSON.stringify(p)); return false; }
  await app.mouseDown(p.x, p.y);
  await app.mouseUp(p.x, p.y);
  await sleep(260);
  return true;
};

// ---- CHECK 7 runs browserless, before any browser is launched -------------
// IT IS INVERTED, and that is the whole design. The first version enumerated
// SPELLINGS of index selection — `[...qsa(sel)][N]` — and was widened once to
// catch the direct form `qsa(sel)[N]`. It then certified ZERO while 38 live
// index selectors remained, because a third form existed that neither the
// check nor its author had imagined: an index passed as a FUNCTION ARGUMENT
// and interpolated inside a helper (`clickCategory(app, 1)` -> `items[idx]`).
// No grep looking beside the selector can see that, and a fourth form exists
// that nobody has imagined yet.
//
// So the rule is inverted: ANY reference to `.wz-strip-item` that is not a
// `[data-category=...]` selector is an OFFENDER until it is named and
// justified below. Admitting a lawful new shape means adding an exemption WITH
// ITS REASON — a decision someone makes deliberately — rather than a shape
// falling silently through a pattern that never contemplated it.
//
// Two law-lines this check exists to enforce, both paid for:
//   A STATIC CENSUS SEES SPELLINGS, NOT DEPENDENCIES — THE ONLY COMPLETE
//   CENSUS OF WHAT DEPENDS ON ORDER IS CHANGING THE ORDER.
//   AN INDEX PASSED AS AN ARGUMENT IS INVISIBLE TO EVERY INSTRUMENT LOOKING
//   BESIDE THE SELECTOR.
const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Each exemption carries its justification. These are lawful because none of
// them depends on WHERE a tab sits: they read the population, the whole set,
// or a property uniform across all eight.
const LAWFUL = [
  { why: 'population count — asserts how many tabs exist, never which is where',
    re: /querySelectorAll\(\s*['"]\.wz-strip-item['"]\s*\)\s*\.length/ },
  { why: 'whole-set collection — reads EVERY item; position is the answer, not the question',
    re: /\[\s*\.\.\.[^\]]*?\.wz-strip-item[^\]]*?\]\s*\.\s*(map|every|some|filter)\b/ },
  { why: 'the LAST item asserted AS last — item 137 pins the Trash to the foot',
    re: /\.wz-strip-item['"]\s*\)\s*\]\s*\.pop\(\)/ },
  { why: 'uniform style read of any one item — colour/radius is identical on all eight',
    re: /getComputedStyle\(\s*document\.querySelector\(\s*['"]\.wz-strip-item/ },
  { why: 'a selector CONSTANT, not a selection',
    re: /(CAT_SEL|_SEL)\s*=\s*['"`]/ },
  { why: "this instrument's own source — it must name the thing it forbids",
    re: /OFFENDER|LAWFUL|data-category=\$\{cat\}|getAttribute\('data-category'\)/ },
];

// A COLLECTION ASSIGNED TO A VARIABLE is the one exemption that cannot be
// decided by looking at its own line: `const items = [...qsa('.wz-strip-item')]`
// is lawful when the file goes on to read items.length or items.map(...), and
// is an OFFENDER the moment anything does items[2]. That is precisely the form
// that hid 38 index selectors from the first check 7 — so it is resolved by
// asking what the file DOES with the variable, not by matching the spelling.
const ASSIGN = /(?:const|let|var)\s+(\w+)\s*=\s*\[\s*\.\.\.[^\]]*?\.wz-strip-item[^\]]*?\]/;
// String.raw, and the reason is a bug this line already had: inside a plain
// template literal the TEMPLATE consumes the escapes before RegExp ever sees
// them — `\b` becomes a backspace BYTE, `\s` becomes a literal 's', `\[` an
// unmatched bracket — and the pattern threw "Unterminated character class" at
// runtime while passing every syntax check. Same species as the classifier
// that read zero files because two invisible backspace bytes broke its
// matcher: a guard can be perfectly well-formed and completely blind.
const indexesVar = (src, v) => new RegExp(String.raw`\b${v}\s*\[`).test(src);

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const full = path.join(dir, d.name);
  return d.isDirectory() ? walk(full) : (full.endsWith('.mjs') ? [full] : []);
});
const offenders = [];
for (const f of walk(SCRIPTS_DIR)) {
  const src = readFileSync(f, 'utf8');
  src.split('\n').forEach((line, i) => {
    // THE INSTRUMENT ITSELF is exempt as a FILE, named here rather than
    // pattern-matched: this file must quote the shapes it forbids in order
    // to forbid them, so its own exemption regexes and its scanning line
    // would otherwise be offenders. Its real SELECTIONS all go through
    // data-category, which is visible a few lines up in pressCategory.
    if (path.basename(f) === 'vw1.mjs') return;
    if (!line.includes('.wz-strip-item')) return;
    const s = line.trim();
    if (s.startsWith('//') || s.startsWith('*')) return;        // parked / commented
    if (line.includes('.wz-strip-item[data-category=')) return; // the handle itself
    if (LAWFUL.some((l) => l.re.test(line))) return;            // named + justified
    const asg = line.match(ASSIGN);
    if (asg && !indexesVar(src, asg[1])) return;                // collection, never indexed
    offenders.push(path.basename(f) + ':' + (i + 1));
  });
}
ok('VW1 check 7 (INVERTED): every live reference to .wz-strip-item is either a data-category selector or a NAMED, JUSTIFIED exemption. A grep that enumerates spellings sees only the spellings someone thought of — the first version certified ZERO while 38 index selectors lived, because the index was a function argument. Inverting it means a new shape must be ruled lawful deliberately instead of falling through',
  offenders.length === 0, JSON.stringify({ offenders, exemptions: LAWFUL.map((l) => l.why) }));

await withHarness(async (app) => {
  await freshProsePage(app);

  // ---- 1 · eight tabs, in the ruled order, BY NAME ------------------------
  const order = await app.evalJs(`[...document.querySelectorAll('.wz-strip-item')].map(b => b.getAttribute('data-category'))`);
  ok(`VW1 check 1: the rail carries exactly eight tabs in the ruled order — ${RULED.join(' · ')}`,
    Array.isArray(order) && JSON.stringify(order) === JSON.stringify(RULED),
    JSON.stringify({ got: order, want: RULED }));

  // ---- 6 · the hook is on all eight --------------------------------------
  // Asserted separately from check 1 on purpose: if the hook were missing from
  // one button, check 1's array would carry a null and the failure would read
  // as "wrong order" rather than "the hook is gone."
  ok('VW1 check 6: data-category is present on ALL eight tabs — the hook\'s own coverage, so a future reorder cannot silently drop it and send a harness back to counting',
    Array.isArray(order) && order.length === 8 && order.every((c) => typeof c === 'string' && c.length > 0),
    JSON.stringify(order));

  // ---- 2 · four separators, in the ruled places --------------------------
  // Measured as the flattened sequence of tabs and separators, so a separator
  // in the right COUNT but the wrong PLACE still fails.
  const seq = await app.evalJs(`(() => {
    const out = [];
    const walkNode = (n) => {
      for (const el of n.children) {
        if (el.classList.contains('wz-strip-item')) out.push(el.getAttribute('data-category'));
        else if (el.classList.contains('wz-strip-sep')) out.push('—');
        else walkNode(el);
      }
    };
    const strip = document.querySelector('.wz-strip');
    if (strip) walkNode(strip);
    return out;
  })()`);
  const WANT_SEQ = ['page', 'plan', '—', 'drawers', '—', 'journal', 'shelf', '—', 'settings', 'theme', '—', 'trash'];
  ok('VW1 check 2: four separators, in the ruled places — after plan, after drawers, after shelf, and above trash. The separators do the teaching silently, so their POSITION is the assertion, not their count',
    JSON.stringify(seq) === JSON.stringify(WANT_SEQ),
    JSON.stringify({ got: seq, want: WANT_SEQ }));

  // ---- 3 · shelf is NOT adjacent to drawers ------------------------------
  // Asserted as ABSENCE, because the blur is the thing the ticket exists to
  // end: a condition sitting beside the foundational container.
  const adjacent = Array.isArray(order) && order.some((c, i) =>
    (c === 'drawers' && order[i + 1] === 'shelf') || (c === 'shelf' && order[i + 1] === 'drawers'));
  ok('VW1 check 3: shelf is NOT adjacent to drawers — erratum 131(a)\'s category blur, asserted as an ABSENCE because ending it is the point of the ticket rather than a side effect',
    adjacent === false, JSON.stringify({ order }));

  // ---- 5 · the desk's vocabulary never reaches the writer -----------------
  const railText = await app.evalJs(`(() => {
    const strip = document.querySelector('.wz-strip');
    if (!strip) return null;
    const titles = [...strip.querySelectorAll('[title]')].map(e => e.getAttribute('title'));
    const labels = [...strip.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label'));
    return ((strip.textContent || '') + ' ' + titles.join(' ') + ' ' + labels.join(' ')).toLowerCase();
  })()`);
  const leaked = railText === null ? ['<no rail>'] : DESK_WORDS.filter((w) => railText.includes(w));
  ok('VW1 check 5: no group label, heading or tooltip names a KIND — the words "surface", "container" and "display" appear nowhere in the rail\'s rendered text, titles or aria-labels. That vocabulary is the desk\'s, never the product\'s',
    leaked.length === 0, JSON.stringify({ leaked, sample: (railText || '').slice(0, 120) }));

  // ---- 4 · every tab still opens its own panel ---------------------------
  // One press each, all eight, by name and by real pointer. This is the check
  // that would have caught a mis-mapped conversion: a wrong selector opens
  // SOME panel, so only asking "did the panel I NAMED open" separates a
  // correct conversion from a plausible one.
  for (const cat of RULED) {
    if (!(await pressCategory(app, cat))) continue;
    const opened = await app.evalJs(`(() => {
      const btn = document.querySelector('.wz-strip-item[data-category=${cat}]');
      const panel = document.querySelector('.wz-cascade-panel');
      return { pressed: btn ? btn.getAttribute('aria-pressed') : null, panelPresent: !!panel };
    })()`);
    ok(`VW1 check 4 (${cat}): pressing the '${cat}' tab opens ITS OWN panel — pressed by real pointer and selected by name, so a mis-mapped conversion cannot pass by opening some other panel`,
      opened.pressed === 'true' && opened.panelPresent === true, JSON.stringify(opened));
    await pressCategory(app, cat);   // close again, leaving the rail at rest
  }

  return checks;
}, { label: 'vw1' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // NOTHING IS PARKED, and the count is the claim. The 39 conversions changed
  // HOW every one of those checks reaches a tab, never WHAT it asserts — the
  // suite came back green and unchanged at commit 1 with the old order still
  // in place, which is exactly the evidence that no assertion was falsified.
  // The regroup then moved the furniture without touching a single harness,
  // which is what the hook was for.
  // eslint-disable-next-line no-console
  console.log('\nVW1 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; VW1 parks nothing. The conversions changed how checks REACH a tab, not what they assert (proven by commit 1 running green and unchanged against the old order), and the regroup moved no assertion.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nVW1 VERIFY: PASS (${checks.length} checks)`
  : `\nVW1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
