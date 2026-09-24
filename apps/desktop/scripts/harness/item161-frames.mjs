// ITEM 161 — TWO FRAMES FOR NICK (the founder look): the Tutor tab and panel on a Board, CLOSED and OPEN.
// Fable, 2026-09-24: "In your box turn, capture two frames (panel closed, panel open) for Nick."
//
// Rendered by THE SHIPPING BUILD, at 1366x768 — the laptop-class width where the panel overlays the board most
// (367px, see docs/menus/item161-162-s0.md) — so the frame shows the case Nick actually hit: the open panel
// over the board's edge, with its tab joined to the panel's edge rather than buried in it.
//
// A CAPTURE pass, not a verification pass: it asserts only what it must for the picture to be honest (the tutor
// really is closed in frame 1 and open in frame 2, the tab is on screen and reachable by a real pointer) and
// writes the PNGs. item161-162.mjs is where behaviour is proven.
//
// Run: node apps/desktop/scripts/harness/item161-frames.mjs   (from the repo root; needs a box turn)
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { withHarness } from '../runtime-verify.mjs';
import { hittablePointBy, trustedDispatch } from '../trusted-point.mjs';

const OUT_DIR = path.join(os.homedir(), 'Downloads');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEW = { w: 1366, h: 768 };
const notes = [];

// `app.screenshot()` returns CDP's BASE64 text, not bytes — decode before writing, and refuse to report a file
// that does not carry the PNG signature.
const save = async (app, name) => {
  const bytes = Buffer.from(await app.screenshot(), 'base64');
  if (bytes.length < 8 || bytes.readUInt32BE(0) !== 0x89504e47) throw new Error(`frame ${name}: the captured bytes are not a PNG`);
  const file = path.join(OUT_DIR, name);
  writeFileSync(file, bytes);
  return { file, kb: Math.round(bytes.length / 1024) };
};
const state = (app) => app.evalJs(`(() => {
  const g = document.querySelector('.wz-tutor-grip'), p = document.querySelector('.wz-tutor-panel'), w = document.querySelector('.board-canvas-wrap');
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top), bottom: Math.round(b.bottom) }; };
  return { open: g && g.getAttribute('data-open'), grip: r(g), panel: r(p), board: r(w), vw: innerWidth, vh: innerHeight };
})()`);

await withHarness(async (app) => {
  await app.emulateDpr(1, VIEW.w, VIEW.h);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.evalJs(`(() => { window.wrizoCreateJournalPage({ id: 'i161-frames', text: 'A board for Nick', pageType: 'board', createdAt: new Date().toISOString(), origin: null,
    boxes: [
      { id: 'c1', kind: 'text', x: 0.05, y: 0.06, w: 0.26, h: 0.12, z: 1, text: 'Opening image' },
      { id: 'c2', kind: 'text', x: 0.40, y: 0.06, w: 0.26, h: 0.12, z: 2, text: 'The turn' },
      { id: 'c3', kind: 'text', x: 0.72, y: 0.06, w: 0.24, h: 0.12, z: 3, text: 'Where it ends' },
      { id: 'c4', kind: 'text', x: 0.20, y: 0.30, w: 0.30, h: 0.12, z: 4, text: 'A quieter scene' },
      { id: 'c5', kind: 'text', x: 0.62, y: 0.30, w: 0.30, h: 0.12, z: 5, text: 'What she carries' }] }); })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/i161-frames'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await app.emulateDpr(1, VIEW.w, VIEW.h);
  await sleep(600);

  const closed = await state(app);
  if (closed.open !== 'false') throw new Error(`frame 1: the tutor is not closed (${closed.open})`);
  notes.push({ ...(await save(app, `wrizo-161-tutor-closed-${VIEW.w}x${VIEW.h}.png`)), state: closed });

  if (!(await trustedDispatch(app, "document.querySelector('.wz-tutor-grip')", 'the Tutor tab (closed -> open)'))) throw new Error('the tab could not be pressed by a real pointer');
  await sleep(600);
  const open = await state(app);
  if (open.open !== 'true' || !open.panel) throw new Error(`frame 2: the tutor did not open (${open.open})`);
  const reach = await hittablePointBy(app, "document.querySelector('.wz-tutor-grip')");
  if (!reach || !reach.found) throw new Error(`frame 2: the tab is not reachable while open (${JSON.stringify(reach)})`);
  notes.push({ ...(await save(app, `wrizo-161-tutor-open-${VIEW.w}x${VIEW.h}.png`)), state: open });
});

// eslint-disable-next-line no-console
console.log('ITEM 161 FRAMES — rendered by the shipping build\n');
for (const n of notes) {
  // eslint-disable-next-line no-console
  console.log(`  ${n.file}  (${n.kb}KB)`);
  // eslint-disable-next-line no-console
  console.log(`    ${JSON.stringify(n.state)}\n`);
}
