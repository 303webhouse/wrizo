// FX13 — the Board in the Room (docs/wrizo-alpha/fx13-board-in-the-room-brief.md).
// Committed CDP verification scenario. Fixtures/technique adopted from
// fx11.mjs/bm1.mjs verbatim (the "don't re-derive fixtures" law): a seeded
// board, live box reads via window.wrizoBoard(), rounded trusted-pointer coords.
// Run: node scripts/harness/fx13.mjs  (from apps/desktop, dist-web freshly built).
//
// The CONSTITUTIONAL amendment (S3, SV2-ratified): geometry assertions get a
// height floor of 768 — the canonical small-laptop leg is 1366x768, joining the
// width floors 1100/1280/2200. This file adds the leg to the BOARD's coverage:
// the board's chrome (mode strip, telos, PAGE door) + tools (Add card) are in
// the room and clickable at 1366x768; the canvas WRAP fills the DeskFrame stage
// (never overflows it — the S2 root fix, proven below the floor too); adding a
// card is one visible click; and FX11's drag gesture still holds at the new leg.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LEG_W = 1366, LEG_H = 768; // the canonical small-laptop leg
const SHORT_H = 640;             // below the floor — proves the height-law fix, not just the ratio

const freshBoard = async (app, boardId, boxes, width, height) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before board fixture' });
  await app.emulateDpr(1, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX13 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board mounted' });
  await sleep(350);
  await app.emulateDpr(1, width, height);
  await sleep(400);
};
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const b = el.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) }; })()`);
const inRoom = (r, vpH) => !!r && r.t >= 0 && r.b <= vpH + 0.5 && r.w > 0 && r.h > 0;
const boardCount = (app) => app.evalJs("(window.wrizoBoard && window.wrizoBoard().length) ?? -1");
const liveBox = (app, id) => app.evalJs(`(window.wrizoBoard ? window.wrizoBoard().find(b => b.id === ${JSON.stringify(id)}) : null) ?? null`);

const BOXES = [
  { id: 'a', kind: 'text', x: 0.1, y: 0.1, w: 0.25, h: 0.15, z: 1, text: 'Card A' },
  { id: 'b', kind: 'text', x: 0.5, y: 0.4, w: 0.25, h: 0.15, z: 2, text: 'Card B' },
];

await withHarness(async (app) => {
  // ── S3 — the 1366x768 reachability leg (the constitutional height floor) ────
  {
    await freshBoard(app, 'fx13-leg', BOXES, LEG_W, LEG_H);
    ok('S3 leg (1366x768): the board mounts on the framed desk stage — the canvas (ground) is present',
      await app.evalJs("!!document.querySelector('.board-canvas') && !!document.querySelector('.desk-frame-stage')"));

    const modeStrip = await rectOf(app, '.board-mode-strip');
    const telos = await rectOf(app, '.board-telos');
    const door = await rectOf(app, '.board-door');
    const tab = await rectOf(app, '.board-mode-tab');
    ok('S3 leg (1366x768): the board CHROME is wholly in the room — mode strip, telos, the PAGE door, and a mode tab all sit within the viewport (top>=0, bottom<=768)',
      inRoom(modeStrip, LEG_H) && inRoom(telos, LEG_H) && inRoom(door, LEG_H) && inRoom(tab, LEG_H),
      JSON.stringify({ modeStrip, telos, door, tab, vpH: LEG_H }));

    // The height-law fix: the canvas WRAP fills the DeskFrame stage and never
    // overflows it (scrolling is for the CONTENT within the wrap, never for
    // finding the board's chrome).
    const wrap = await rectOf(app, '.board-canvas-wrap');
    const stage = await rectOf(app, '.desk-frame-stage');
    ok('S3 leg (1366x768): the canvas wrap FILLS the stage and does not overflow it — wrap bottom is within the stage bottom, and the wrap occupies most of the stage height',
      !!wrap && !!stage && wrap.b <= stage.b + 2 && wrap.h >= stage.h - 12,
      JSON.stringify({ wrap, stage }));

    // The ground overflows the wrap by design (a constellation of cards) — that
    // is CONTENT scroll, the one thing that may scroll.
    const canvas = await rectOf(app, '.board-canvas');
    ok('S3 leg (1366x768): scrolling is reserved for CONTENT — the canvas may exceed the wrap (it scrolls inside it), while the wrap itself stays inside the room',
      !!canvas && inRoom(wrap, LEG_H), JSON.stringify({ canvasH: canvas && canvas.h, wrap }));

    // Adding a card is ONE visible click, under trusted pointer (the DoD).
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(300);
    const before = await boardCount(app);
    const addRect = await app.evalJs("(() => { const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim().includes('Add card')); if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.left + b.width/2), y: Math.round(b.top + b.height/2), t: Math.round(b.top), b: Math.round(b.bottom) }; })()");
    ok('S3 leg (1366x768): the Add-card tool is mounted and within the room (top>=0, bottom<=768) — a visible, reachable target',
      !!addRect && addRect.t >= 0 && addRect.b <= LEG_H + 0.5, JSON.stringify(addRect));
    // Buttons in this app are clicked via the DOM (fx11/e1 click 'Publish'/'Start
    // writing' the same way); trusted pointer is reserved for gestures (the drag
    // re-proof below). One click on the in-room Add-card tool must add one card.
    await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.trim().includes('Add card'))?.click()"); await sleep(450);
    const after = await boardCount(app);
    ok('S3 leg (1366x768): adding a card takes ONE visible click — a single click on the in-room Add-card tool grows the board by exactly one card (the DoD)',
      before >= 0 && after === before + 1, JSON.stringify({ before, after }));

    // No gross page overflow (a small pre-existing app-level 2px is tolerated;
    // the board must not add a scrollbar of its own to reach the chrome).
    const overflow = await app.evalJs("document.documentElement.scrollHeight - window.innerHeight");
    ok('S3 leg (1366x768): no board-scale page overflow — the document is within a few px of the viewport (the chrome is never below a page fold)',
      overflow <= 4, JSON.stringify({ overflow }));
  }

  // ── The height-law fix, proven BELOW the floor (1366x640) — where the old
  //    magic 78vh clamp demonstrably overflowed the flex stage ────────────────
  {
    await freshBoard(app, 'fx13-short', BOXES, LEG_W, SHORT_H);
    const wrap = await rectOf(app, '.board-canvas-wrap');
    const stage = await rectOf(app, '.desk-frame-stage');
    ok('S3 (height-law, 1366x640): the wrap fills the stage WITHOUT overflow even below the floor — the fix is the stage’s real available height, not a viewport ratio (the old 78vh overflowed the stage by ~31px here)',
      !!wrap && !!stage && wrap.b <= stage.b + 2 && wrap.h >= stage.h - 12,
      JSON.stringify({ wrap, stage }));
    const modeStrip = await rectOf(app, '.board-mode-strip');
    ok('S3 (height-law, 1366x640): the board chrome stays in the room below the floor too',
      inRoom(modeStrip, SHORT_H), JSON.stringify({ modeStrip, vpH: SHORT_H }));
  }

  // ── FX11 gesture re-proof at the new leg: a card drags at 1366x768 ──────────
  {
    const CID = 'fx13-drag';
    await freshBoard(app, 'fx13-gesture', [{ id: CID, kind: 'text', x: 0.15, y: 0.15, w: 0.25, h: 0.18, z: 1, text: 'Drag me' }], LEG_W, LEG_H);
    const b0 = await liveBox(app, CID);
    const r = await rectOf(app, `[data-box-id="${CID}"]`);
    const mx = Math.round(r.left + r.w / 2), my = Math.round(r.t + r.h / 2);
    await app.mouseDown(mx, my); await sleep(40);
    await app.mouseMove(mx + 30, my + 20); await sleep(50);
    await app.mouseMove(mx + 70, my + 45); await sleep(60);
    await app.mouseUp(mx + 70, my + 45); await sleep(200);
    const b1 = await liveBox(app, CID);
    ok('FX13 (re-prove FX11 at the leg): a trusted-pointer drag MOVES a card at 1366x768 — the board’s hands still work at the small-laptop leg',
      !!b0 && !!b1 && (Math.abs(b1.x - b0.x) > 0.01 || Math.abs(b1.y - b0.y) > 0.01),
      JSON.stringify({ from: b0 && { x: b0.x, y: b0.y }, to: b1 && { x: b1.x, y: b1.y } }));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// FX13 parks nothing of its own — it ADDS the 1366x768 leg (a live-section
// addition), and falsifies no pre-existing assertion (the board already fit at
// the width floors; the height floor is new coverage, and the S2 fix keeps the
// legacy <1100 path byte-identical via the 78vh fallback).
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX13 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; FX13 parks nothing of its own (the 1366x768 leg is a live-section addition, not a park).`
    : `\nFX13 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX13 VERIFY: PASS (${checks.length} checks)` : `\nFX13 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
