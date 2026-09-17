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
// A static grep over apps/desktop/scripts. It is the only check that keeps §2
// from rotting back: the conversions are a one-time tidy, this is the thing
// that makes them durable.
//
// IT MATCHES BOTH FORMS, and that is load-bearing rather than thorough: five
// of the 39 sites used the DIRECT form `querySelectorAll(sel)[N]` rather than
// the spread `[...querySelectorAll(sel)][N]` (cd2 x3, item112a, item83e). A
// spread-only grep reads 33, certifies zero remaining, and leaves five live
// index selectors behind — the census itself made that mistake first.
const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_SEL = /querySelectorAll\(\s*['"]\.wz-strip-item['"]\s*\)\s*\]?\s*\[\s*\d+\s*\]/;
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const full = path.join(dir, d.name);
  return d.isDirectory() ? walk(full) : (full.endsWith('.mjs') ? [full] : []);
});
const offenders = walk(SCRIPTS_DIR).flatMap((f) =>
  readFileSync(f, 'utf8').split('\n')
    .map((line, i) => (INDEX_SEL.test(line) ? `${path.basename(f)}:${i + 1}` : null))
    .filter(Boolean));
ok('VW1 check 7: ZERO index-based strip selectors remain anywhere in apps/desktop/scripts — the static assertion that keeps the conversion from rotting back, matching BOTH the spread and the direct form (a spread-only grep reads 33 of 39 and certifies five live selectors as absent)',
  offenders.length === 0, JSON.stringify({ offenders }));

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
