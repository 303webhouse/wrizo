// ITEM 138 — PAGE-PINS ARE TALL, ON THE BOX. Auto-discovered by run-suite.mjs;
// no registration. Run with an ABSOLUTE worktree path.
//
// ⚠ A WORKTREE ISOLATES FILES, NOT THE BOX. One machine, one browser pool: a run
// from ANY tree is a run on the box. The turn comes by announcement, never
// inferred from quiet.
//
// WHY THIS FILE EXISTS, AND WHY IT IS NOT PART OF THE EXPERIMENT 1 RUN. Item 138's
// browserless proof (item138-silhouette-proof.mjs, seven claims) states its own
// bound plainly: it proves the CONSTANTS and the WIRING and cannot prove a
// rendered pixel or a real drag. Three things were therefore owed to a box run,
// and they were owed inside Experiment 1's scenario — which cannot merge until
// `visibleText` is re-derived from FIX's markRuns.ts. Fable's ruling (2026-09-25):
// pull them out so they ride Batch Eight with 138's own branch. The three, named
// in 138's own commit message and asserted below:
//   · a real resize of a NESTED BOARD's card leaves it WIDER THAN TALL    → C2
//   · a real resize of a PAGE card takes the vertical silhouette          → C1
//   · an UNTOUCHED existing card opens with its stored geometry unchanged → C3
//
// ── SUPERSEDED IN PLACE, LIVE IN THE DEFAULT RUN ──────────────────────────────
// 1 instance / 1 name, recorded here and at its own site in ab4.mjs:
//   ab4.mjs  "S4: dragging the corner resizes a page-pin card freeform on BOTH
//             axes (no aspect lock, unlike ink)"
// Item 138 gives a page-pin an aspect lock on resize, so the parenthetical is
// false. ⚠ AND THE CHECK DID NOT GO RED — it compared `afterDrag.h > before.h`,
// which the lock satisfies just as well as freeform does (h becomes w × 1.375,
// larger either way). It was GREEN ABOUT SOMETHING ELSE: a name asserting the
// absence of a lock, over a condition that cannot see one. That is the whole
// reason C4 below exists — it is the discriminating check ab4's could never be,
// because it drags with dy = 0 and the height moves anyway.
//
// THE STANDING HARNESS LAWS, carried from pw1/pw2 and load-bearing here: drivers
// never assume existence (a bare .click() on a missing node aborts the FILE and
// reports nothing downstream); probes drive REAL pointer events through CDP Input,
// never a page-side synthetic dispatch; seed through the seams
// (window.wrizoCreateJournalPage / wrizoPinPageToBoard), never raw localStorage —
// the cache is the hazard, not the surface; and origin/source are carried
// EXPLICITLY, because the absence of a key is a value.
//
// ⚠ WHY A REAL CDP DRAG, WHERE AB4 USED A SYNTHETIC `__pointerSeq`. A page-side
// `new PointerEvent('pointerdown')` is not recognised as an active pointer by
// `Element.setPointerCapture`, and BoardEditor's capture calls are wrapped in
// `try { … } catch {}` — so under a synthetic drag the capture SILENTLY never
// takes and the gesture only works because the listeners sit on the canvas. That
// is precisely the shape that hid a real defect once before (item 126 C8). These
// drags are trusted CDP presses, so the capture genuinely takes.
//
// MEASURED, NOT ASSUMED: `app.mouseMove` dispatches with `buttons: 0`, which
// would be wrong for a drag if the product read it — BoardEditor's `onMove` gates
// on its own `phase`, never on `e.buttons` (BoardEditor.tsx, the `onMove` body),
// so the moves land. Stated because a reader should not have to take it on faith.
import { withHarness } from '../runtime-verify.mjs';
import { hittablePoint } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The two silhouettes, read from the SOURCE so this file cannot drift from the
// constants it is checking. The browserless proof reads them the same way and for
// the same reason: a harness that hardcodes 1.375 stops testing the product the
// day someone edits persistence.ts.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PERSISTENCE = join(HERE, '..', '..', 'src', 'store', 'persistence.ts');
const constOf = (name) => {
  const src = readFileSync(PERSISTENCE, 'utf8');
  const m = src.match(new RegExp(`^const ${name} = ([0-9.]+);`, 'm'));
  if (!m) throw new Error(`item138: could not read ${name} out of persistence.ts`);
  return Number(m[1]);
};
const PAGE_ASPECT = constOf('BOARD_PIN_H') / constOf('BOARD_PIN_W');   // 1.375
const BOARD_ASPECT = constOf('BOARD_CARD_H') / constOf('BOARD_CARD_W'); // 0.3125
const TOL = 0.03;

const settle = async (app, expr, ms = 4000, step = 100) => {
  const deadline = Date.now() + ms;
  let v = await app.evalJs(expr);
  while (v !== true && Date.now() < deadline) { await sleep(step); v = await app.evalJs(expr); }
  return v;
};

// DRIVERS NEVER ASSUME EXISTENCE. Probe; if absent, record a FAILED check that
// names the selector and return false so the caller can skip the act without
// throwing. The file keeps reporting either way.
const must = async (app, sel, what) => {
  const there = await app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`);
  if (!there) ok(`DRIVER: ${what} — the target (${sel}) is present to act on`, false, 'absent');
  return there;
};

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

// SEEDED THROUGH THE SEAM. `origin` and `source` are passed EXPLICITLY on every
// row: createJournalPage defaults `origin:'journal'` and hardcodes
// `source:'page'`, so a row that omits either is a DIFFERENT row. The wait is on
// the STORED ids, because the seam's write is debounced and the reload hydrates
// the cache from storage.
const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
  for (const r of rows) {
    const row = { ...r, origin: 'origin' in r ? r.origin : null, source: 'source' in r ? r.source : null };
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  }
  const ids = rows.map((r) => r.id);
  await settle(app, `(() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').map(e => e.id); return ${JSON.stringify(ids)}.every(id => es.includes(id)); })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed hydrate' });
};

const openBoard = async (app, boardId, label) => {
  await app.evalJs(`location.hash = '#/page/${boardId}'`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label });
  await sleep(300);
};

const boxOf = async (app, boxId) =>
  (await app.evalJs('window.wrizoBoard()') || []).find((b) => b.id === boxId);

// Select a card with a real trusted press at a point that genuinely hit-tests to
// it — an occluded card would otherwise look like a product that ignored the
// press.
const selectCard = async (app, boxId, what) => {
  const sel = `[data-box-id="${boxId}"]`;
  if (!(await must(app, sel, what))) return false;
  const p = await hittablePoint(app, sel);
  if (!p || !p.found) {
    ok(`DRIVER: ${what} — a point inside the card is reachable by a real pointer (not occluded)`, false, JSON.stringify(p));
    return false;
  }
  await app.mouseDown(p.x, p.y);
  await app.mouseUp(p.x, p.y);
  await sleep(150);
  return true;
};

// A real corner drag: trusted press on the brass handle, stepped moves, release
// where the hand actually ends up — OUTSIDE the handle, which is where a writer
// releases and where a capture that never took shows itself.
const dragHandle = async (app, boxId, dx, dy, what) => {
  const sel = `[data-box-id="${boxId}"] .board-handle`;
  if (!(await must(app, sel, what))) return false;
  const p = await hittablePoint(app, sel);
  if (!p || !p.found) {
    ok(`DRIVER: ${what} — a point inside the resize handle is reachable by a real pointer`, false, JSON.stringify(p));
    return false;
  }
  await app.mouseDown(p.x, p.y);
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    await app.mouseMove(p.x + (dx * i) / steps, p.y + (dy * i) / steps);
    await sleep(20);
  }
  await app.mouseUp(p.x + dx, p.y + dy);
  await sleep(250);
  return true;
};

await withHarness(async (app) => {
  // ==========================================================================
  // THE FIXTURE — one board carrying two cards of the SAME BOX KIND: one
  // pinning a PAGE, one pinning a BOARD. That sameness is 138's whole risk, so
  // C0 asserts it rather than trusting it.
  // ==========================================================================
  await freshDesk(app, 1400, 900);
  await seedEntries(app, [
    { id: 'i138-wall', text: 'Item 138 Wall', origin: 'loose', projectId: null, pageType: 'board', boxes: [] },
    { id: 'i138-page', text: 'Item 138 Page', origin: 'loose', projectId: null, pageType: 'manuscript' },
    { id: 'i138-nested', text: 'Item 138 Nested Board', origin: 'loose', projectId: null, pageType: 'board', boxes: [] },
  ]);

  const pinnedPage = await app.evalJs("!!window.wrizoPinPageToBoard('i138-page', 'i138-wall')");
  const pinnedBoard = await app.evalJs("!!window.wrizoPinPageToBoard('i138-nested', 'i138-wall')");
  ok('FIXTURE: both memberships were made through the product\'s own seam (a page and a nested board on one wall)',
    pinnedPage === true && pinnedBoard === true, JSON.stringify({ pinnedPage, pinnedBoard }));
  await app.evalJs('window.wrizoFlushNow()');
  await openBoard(app, 'i138-wall', 'the 138 wall, framed');

  const boxes = await app.evalJs('window.wrizoBoard()') || [];
  const pageBox = boxes.find((b) => b.entryId === 'i138-page');
  const boardBox = boxes.find((b) => b.entryId === 'i138-nested');
  if (!pageBox || !boardBox) {
    ok('FIXTURE: both cards are on the wall', false, JSON.stringify(boxes.map((b) => ({ id: b.id, kind: b.kind, entryId: b.entryId }))));
  } else {
    // ========================================================================
    // C0 — THE PREMISE OF THE EXCLUSION CLAUSE. Both cards must be the SAME box
    // kind, or C2 passes for the wrong reason: a lock keyed on `box.kind` would
    // be indistinguishable from one keyed on the entry if the kinds differed.
    // ========================================================================
    ok('C0: the page card and the nested board\'s card are the SAME box kind (page-pin) — so a box-kind-keyed lock could not tell them apart',
      pageBox.kind === 'page-pin' && boardBox.kind === 'page-pin',
      JSON.stringify({ page: pageBox.kind, board: boardBox.kind }));

    ok('C0b: a NEW page card is BORN tall (h > w) — the birth half, on the box rather than in the constants',
      pageBox.h > pageBox.w, JSON.stringify({ w: pageBox.w, h: pageBox.h }));
    ok('C0c: a NEW nested-board card is BORN wide (w > h) — Nick\'s wide-board ruling, unbroken at birth',
      boardBox.w > boardBox.h, JSON.stringify({ w: boardBox.w, h: boardBox.h }));

    // ========================================================================
    // C1 — OWED CHECK 2: a real resize of a PAGE card takes the vertical
    // silhouette. Grown, not shrunk, so the MIN_PIN_H floor is nowhere near.
    // ========================================================================
    if (await selectCard(app, pageBox.id, 'the page card, to reveal its handle')) {
      const before = await boxOf(app, pageBox.id);
      if (await dragHandle(app, pageBox.id, 140, 20, 'the page card\'s resize handle')) {
        const after = await boxOf(app, pageBox.id);
        ok('C1: a REAL corner drag on a PAGE card leaves it TALLER THAN WIDE — the vertical silhouette, on the box',
          after.h > after.w, JSON.stringify({ before, after }));
        ok(`C1b: and at the PAGE aspect read from persistence.ts (h/w ≈ ${PAGE_ASPECT.toFixed(3)}) — the kind's canonical shape, not whatever the card happened to be`,
          Math.abs(after.h / after.w - PAGE_ASPECT) < TOL,
          JSON.stringify({ aspect: after.h / after.w, want: PAGE_ASPECT }));
        ok('C1c: the card GREW (the drag was a real resize, not a no-op the aspect check could pass over)',
          after.w > before.w, JSON.stringify({ beforeW: before.w, afterW: after.w }));

        // RELEASE WHERE THE WRITER RELEASES, then prove the gesture ENDED. A
        // capture that never took, or a phase left dangling, shows up as a card
        // that keeps resizing after the hand has gone.
        const settled = await boxOf(app, pageBox.id);
        await app.mouseMove(200, 200);
        await app.mouseMove(360, 420);
        await sleep(200);
        const afterStray = await boxOf(app, pageBox.id);
        ok('C1d: after release, a stray pointer move does NOT keep resizing the card — the gesture ended where the hand left',
          Math.abs(afterStray.w - settled.w) < 0.0001 && Math.abs(afterStray.h - settled.h) < 0.0001,
          JSON.stringify({ settled, afterStray }));

        // ======================================================================
        // C5 — THE RENDERED PIXEL, which the browserless proof named as a gap in
        // so many words. Fractions can be right while the element is not.
        // ======================================================================
        const rect = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="${pageBox.id}"]').getBoundingClientRect(); return { w: r.width, h: r.height }; })()`);
        ok('C5: and the card RENDERS taller than wide — measured in pixels, the half no constant can prove',
          rect.h > rect.w, JSON.stringify(rect));
      }
    }

    // ========================================================================
    // C2 — OWED CHECK 1, AND THE WHOLE RISK. The same box kind, resized the
    // same way, must stay WIDE. This is the check that catches a lock keyed on
    // `box.kind` instead of on the pinned entry.
    // ========================================================================
    if (await selectCard(app, boardBox.id, 'the nested board\'s card, to reveal its handle')) {
      const before = await boxOf(app, boardBox.id);
      if (await dragHandle(app, boardBox.id, 140, 20, 'the nested board card\'s resize handle')) {
        const after = await boxOf(app, boardBox.id);
        ok('C2: a REAL corner drag on a NESTED BOARD\'s card leaves it WIDER THAN TALL — the exclusion clause holds where it matters',
          after.w > after.h, JSON.stringify({ before, after }));
        ok(`C2b: and at the BOARD aspect (h/w ≈ ${BOARD_ASPECT.toFixed(3)}), not the page's — so the lock reads the PINNED ENTRY, never the box`,
          Math.abs(after.h / after.w - BOARD_ASPECT) < TOL,
          JSON.stringify({ aspect: after.h / after.w, want: BOARD_ASPECT }));
        ok('C2c: the nested card GREW (a real resize)', after.w > before.w,
          JSON.stringify({ beforeW: before.w, afterW: after.w }));
      }
    }
  }

  // ==========================================================================
  // C3 — OWED CHECK 3: CONSTRAIN FORWARD, NEVER SNAP. An existing card, seeded
  // deliberately WIDE (the pre-138 default, 0.28 × 0.12) over a PAGE entry,
  // opens with its stored geometry unchanged and KEEPS it — including across a
  // reload and across a MOVE, because Nick ruled a move is not a touch.
  // ==========================================================================
  await freshDesk(app, 1400, 900);
  await seedEntries(app, [
    { id: 'i138-old-page', text: 'Item 138 Grandfathered Page', origin: 'loose', projectId: null, pageType: 'manuscript' },
    { id: 'i138-old-wall', text: 'Item 138 Old Wall', origin: 'loose', projectId: null, pageType: 'board',
      boxes: [{ id: 'i138-old-pin', kind: 'page-pin', x: 0.1, y: 0.1, w: 0.28, h: 0.12, z: 1, entryId: 'i138-old-page' }] },
  ]);
  await openBoard(app, 'i138-old-wall', 'the grandfathered wall, framed');
  {
    const opened = await boxOf(app, 'i138-old-pin');
    if (!opened) {
      ok('C3: the grandfathered card is on the wall to check', false, 'absent');
    } else {
      ok('C3: an UNTOUCHED existing card opens with its stored geometry EXACTLY as left — wide, unsnapped, 138 nowhere near the load path',
        Math.abs(opened.w - 0.28) < 0.0001 && Math.abs(opened.h - 0.12) < 0.0001,
        JSON.stringify(opened));

      // A MOVE IS NOT A TOUCH — the distinction the whole "constrain forward"
      // ruling rests on, and the one a lock applied one layer too high would
      // break. Selected first (a move needs the card under the pointer), then
      // dragged by the CARD, not the handle.
      if (await must(app, '[data-box-id="i138-old-pin"]', 'the grandfathered card, to move it')) {
        const p = await hittablePoint(app, '[data-box-id="i138-old-pin"]');
        if (!p || !p.found) {
          ok('DRIVER: a point inside the grandfathered card is reachable by a real pointer', false, JSON.stringify(p));
        } else {
          await app.mouseDown(p.x, p.y);
          for (let i = 1; i <= 6; i++) { await app.mouseMove(p.x + (90 * i) / 6, p.y + (70 * i) / 6); await sleep(20); }
          await app.mouseUp(p.x + 90, p.y + 70);
          await sleep(300);
          const moved = await boxOf(app, 'i138-old-pin');
          ok('C3b: the card MOVED (so C3c is measured on a card that genuinely travelled, not on one that ignored the drag)',
            Math.abs(moved.x - 0.1) > 0.001 || Math.abs(moved.y - 0.1) > 0.001, JSON.stringify(moved));
          ok('C3c: and a MOVE left its SHAPE untouched — still 0.28 × 0.12, because a move is not a touch (Nick\'s ruling, on the box)',
            Math.abs(moved.w - 0.28) < 0.0001 && Math.abs(moved.h - 0.12) < 0.0001, JSON.stringify(moved));
        }
      }

      await sleep(2200); // clear the autosave debounce before reloading
      await app.reload();
      await openBoard(app, 'i138-old-wall', 'the grandfathered wall, reloaded');
      const reloaded = await boxOf(app, 'i138-old-pin');
      ok('C3d: and it is STILL wide after a reload — the silhouette is never applied on load',
        reloaded && Math.abs(reloaded.w - 0.28) < 0.0001 && Math.abs(reloaded.h - 0.12) < 0.0001,
        JSON.stringify(reloaded));

      // ======================================================================
      // C4 — THE DISCRIMINATING CHECK, and the successor to ab4's superseded
      // clause. ab4's S4 asserted "freeform on BOTH axes (no aspect lock)" with
      // the condition `afterDrag.h > before.h` — which a lock satisfies too, so
      // it could not tell freeform from locked and stayed green through 138.
      //
      // This drags with dy = 0. Freeform would leave the height ALONE; the lock
      // derives it from the new width. The two predictions differ, which is the
      // only reason this check is worth running.
      // ======================================================================
      if (await selectCard(app, 'i138-old-pin', 'the grandfathered card, to resize it')) {
        const before = await boxOf(app, 'i138-old-pin');
        if (await dragHandle(app, 'i138-old-pin', 120, 0, 'the grandfathered card\'s resize handle')) {
          const after = await boxOf(app, 'i138-old-pin');
          ok('C4: dragging the handle with dy = 0 CHANGES THE HEIGHT anyway — the height is DERIVED from the width, so the resize is no longer freeform (ab4 S4\'s superseded clause, asserted the one way that can see it)',
            Math.abs(after.h - before.h) > 0.01, JSON.stringify({ before, after }));
          ok('C4b: and the touched card has taken the PAGE silhouette — constrain FORWARD: it was grandfathered until the writer changed its shape, and now it is tall',
            after.h > after.w && Math.abs(after.h / after.w - PAGE_ASPECT) < TOL,
            JSON.stringify({ aspect: after.h / after.w, want: PAGE_ASPECT, after }));
        }
      }
    }
  }
});

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ============
// EMIT THE ARRAY, EVEN EMPTY. Item 138's one retirement is a SUPERSEDED-IN-PLACE
// instance living at its own site in ab4.mjs (quoted verbatim there, with a live
// successor beside it), so this file's own array is genuinely always []. It is
// printed anyway: an empty array that is never emitted reads the same to the
// counter as one that silently lost a record. Auditable absence, not silent
// absence — the park COUNT is the check, not the colour of the run.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
}

const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
for (const c of allChecks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? '  ok  ' : '  FAIL'} ${c.name}${c.detail ? `  ${c.detail}` : ''}`);
}
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM138 VERIFY: PASS (${allChecks.length} checks)` : `\nITEM138 VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
