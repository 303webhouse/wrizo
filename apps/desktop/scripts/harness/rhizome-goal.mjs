// Rhizome goal-fill — the Plateau roots follow the writer's own goal.
// A lap of 100 words and a lap of 1000 words both fill the ground at the
// goal. Crossing the goal flashes the network brass, then one thick stem
// remains and the next lap grows only from it. Growth tunnels under the
// sheet (the paint clip hides that stretch) and comes out on both margins.
// Run from apps/desktop, dist-web built: node scripts/harness/rhizome-goal.mjs
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const core = spawnSync(process.execPath, [fileURLToPath(new URL('./rhizome-goal-core.mjs', import.meta.url))], { stdio: 'inherit' });
if (core.status !== 0) process.exit(core.status ?? 1);

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const freshDesk = async (app) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
    + " localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');",
  );
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, 1400, 900);
};

const openRhizomePage = async (app) => {
  await freshDesk(app);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'rhizome page reopened' });
  await sleep(300);
  return pageId;
};

const seedAndReopen = async (app, pageId, words, goal) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
  await app.evalJs(`(() => {
    window.wrizoSetWritingGoal(${JSON.stringify(goal)});
    window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: ${words} }, (_, i) => 'word' + i).join(' ') });
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.wz-rhizome-field')", { label: 'rhizome field after seed' });
  await sleep(800);
};

const field = (app) => app.evalJs(`(() => {
  const svg = document.querySelector('.wz-rhizome-field');
  const page = document.querySelector('.mode-page');
  const ed = document.querySelector('.forward-only-editor');
  const onPage = document.querySelector('.mode-page .wz-rhizome-onpage');
  const pr = page ? page.getBoundingClientRect() : null;
  const sr = svg ? svg.getBoundingClientRect() : null;
  const seg = svg && svg.querySelector('.wz-rhizome-seg:not([data-thick="true"])');
  const thick = svg && svg.querySelector('.wz-rhizome-seg[data-thick="true"]');
  const sheet = pr && sr ? {
    left: pr.left - sr.left, top: pr.top - sr.top, right: pr.right - sr.left, bottom: pr.bottom - sr.top,
  } : null;
  const PAGE_CLEAR = 56; // RhizomeField.tsx PAGE_CLEAR — the band around the sheet
  const inside = (x, y, r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  const shown = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const b = el.getBoundingClientRect();
    return b.width >= 8 && b.height >= 8;
  };
  const holes = [];
  if (sheet && sr) {
    holes.push({ left: sheet.left - PAGE_CLEAR, top: sheet.top - PAGE_CLEAR, right: sheet.right + PAGE_CLEAR, bottom: sheet.bottom + PAGE_CLEAR });
    for (const sel of ['.desk-rail', '.desk-frame-strip', '.sprint-nav', '.gh-corner-menu', '.wz-cascade-panel', '.mode-settings', '.wz-ink-menu']) {
      for (const el of document.querySelectorAll(sel)) {
        if (!shown(el)) continue;
        const b = el.getBoundingClientRect();
        holes.push({ left: b.left - sr.left, top: b.top - sr.top, right: b.right - sr.left, bottom: b.bottom - sr.top });
      }
    }
  }
  let paperHit = 0, keepHit = 0, shares = true, leftOut = 0, rightOut = 0;
  const segs = [];
  const bandL = sheet ? sheet.left - PAGE_CLEAR : 0;
  const bandR = sheet ? sheet.right + PAGE_CLEAR : 0;
  if (svg) {
    for (const el of svg.querySelectorAll('.wz-rhizome-seg')) {
      segs.push({ x1: +el.getAttribute('x1'), y1: +el.getAttribute('y1'), x2: +el.getAttribute('x2'), y2: +el.getAttribute('y2') });
    }
    const eq = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by) < 0.05;
    const touch = (a, b) => eq(a.x1, a.y1, b.x1, b.y1) || eq(a.x1, a.y1, b.x2, b.y2) || eq(a.x2, a.y2, b.x1, b.y1) || eq(a.x2, a.y2, b.x2, b.y2);
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      for (const [x, y] of [[s.x1, s.y1], [s.x2, s.y2]]) {
        if (sheet && x > sheet.left + 0.5 && x < sheet.right - 0.5 && y > sheet.top + 0.5 && y < sheet.bottom - 0.5) paperHit++;
        if (holes.some(r => inside(x, y, r))) keepHit++;
        if (x < bandL - 0.5) leftOut++;
        if (x > bandR + 0.5) rightOut++;
      }
      if (i > 0 && !segs.slice(0, i).some(earlier => touch(s, earlier))) shares = false;
    }
  }
  const thinW = seg ? Number.parseFloat(getComputedStyle(seg).strokeWidth) : null;
  const thickW = thick ? Number.parseFloat(getComputedStyle(thick).strokeWidth) : null;
  const sample = svg && svg.querySelector('.wz-rhizome-seg');
  const cs = sample ? getComputedStyle(sample) : null;
  const dur = cs ? cs.animationDuration : '';
  const drawMs = dur ? (dur.endsWith('ms') ? parseFloat(dur) : parseFloat(dur) * 1000) : null;
  const clip = svg ? (svg.style.clipPath || (cs && getComputedStyle(svg).clipPath) || '') : '';
  return {
    mounted: !!svg,
    editor: !!ed,
    segments: svg ? Number(svg.dataset.segments) : -1,
    frac: svg ? svg.dataset.goalFrac : null,
    flash: svg ? svg.dataset.flash : null,
    onPage: !!onPage,
    paperHit, keepHit, shares, leftOut, rightOut,
    thinW, thickW,
    thickCount: svg ? svg.querySelectorAll('.wz-rhizome-seg[data-thick="true"]').length : 0,
    painted: segs.filter(s => {
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const x = s.x1 + (s.x2 - s.x1) * t;
        const y = s.y1 + (s.y2 - s.y1) * t;
        if (!holes.some(r => inside(x, y, r))) return true;
      }
      return false;
    }).length,
    clip: String(clip).slice(0, 48),
    drawName: cs ? cs.animationName : null,
    drawMs, pathLength: sample ? sample.getAttribute('pathLength') : null,
    pointer: svg ? getComputedStyle(svg).pointerEvents : null,
    stroke: seg ? getComputedStyle(seg).stroke : null,
    rect: pr ? { t: Math.round(pr.top), l: Math.round(pr.left), w: Math.round(pr.width), h: Math.round(pr.height) } : null,
  };
})()`);

const armFlashLog = (app) => app.evalJs(`(() => {
  window.__flashLog = [];
  let last = null;
  const read = () => { const f = document.querySelector('.wz-rhizome-field'); const v = f ? f.dataset.flash : null;
    if (v !== last) { last = v; window.__flashLog.push([Math.round(performance.now()), v]); } };
  read();
  if (window.__flashObs) window.__flashObs.disconnect();
  window.__flashObs = new MutationObserver(read);
  window.__flashObs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-flash'] });
  return true;
})()`);
const flashPhases = (log) => {
  const at = (v) => { const e = log.find((x) => x[1] === v); return e ? e[0] : null; };
  const tTrue = at('true'), tFading = at('fading');
  const tFalse = (() => { const i = log.findIndex((x) => x[1] === 'true'); const e = i >= 0 ? log.slice(i).find((x) => x[1] === 'false') : null; return e ? e[0] : null; })();
  return { tTrue, tFading, tFalse, hold: tTrue != null && tFading != null ? tFading - tTrue : null, fade: tFading != null && tFalse != null ? tFalse - tFading : null,
    holdNoFade: tTrue != null && tFalse != null && tFading == null ? tFalse - tTrue : null, seq: log.map((x) => x[1]).join('>') };
};
const segLook = (app) => app.evalJs(`(() => {
  const f = document.querySelector('.wz-rhizome-field'); if (!f) return null;
  const thin = f.querySelector('.wz-rhizome-seg:not([data-thick="true"])'), thick = f.querySelector('.wz-rhizome-seg[data-thick="true"]');
  const look = (el) => { if (!el) return null; const cs = getComputedStyle(el); return { stroke: cs.stroke, opacity: Number(cs.opacity), width: cs.strokeWidth }; };
  return { flash: f.dataset.flash, thin: look(thin), thick: look(thick) };
})()`);

await withHarness(async (app) => {
  await freshDesk(app);

  // ARCHIVED PARK (#13 step 14): archive/rhizome-goal.mjs.parked.md record 1

  const pageId = await openRhizomePage(app);
  const empty = await field(app);
  // ARCHIVED PARK (#13 step 14): archive/rhizome-goal.mjs.parked.md record 2

  const paperBefore = empty.rect;
  await seedAndReopen(app, pageId, 99, { n: 1000, unit: 'words' });
  const slow = await field(app);
  // ARCHIVED PARK (#13 step 14): archive/rhizome-goal.mjs.parked.md record 3
  ok('Live: the page rect is unchanged by the roots',
    paperBefore && slow.rect && paperBefore.w === slow.rect.w && paperBefore.h === slow.rect.h && paperBefore.l === slow.rect.l,
    JSON.stringify({ paperBefore, after: slow.rect }));

  await app.evalJs("window.wrizoSetWritingGoal({ n: 100, unit: 'words' })");
  await sleep(500);
  const fast = await field(app);
  // ARCHIVED PARK (#13 step 14): archive/rhizome-goal.mjs.parked.md record 4
  ok('Live: no rhizome layer sits on the page, the editor stays mounted, and the field does not take clicks',
    !fast.onPage && fast.editor && fast.pointer === 'none', JSON.stringify({ onPage: fast.onPage, editor: fast.editor, pointer: fast.pointer }));
  // ARCHIVED PARK (#13 step 14): archive/rhizome-goal.mjs.parked.md record 5
  ok('Live: at rest the stroke is olive, not brass',
    fast.flash === 'false' && fast.stroke && fast.stroke !== 'rgb(255, 152, 0)', JSON.stringify({ stroke: fast.stroke, flash: fast.flash }));

  const rectAtFull = fast.rect;

  await seedAndReopen(app, pageId, 7, { n: 8, unit: 'words' });
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await armFlashLog(app);
  await app.typeKeys(' tail');
  await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'brass flash on goal', timeout: 4000 });
  await sleep(180);
  const flashing = await field(app);
  // The hold's own 160ms ease-in can be read mid-way (chat 1's card-port pair: rgb(253, 152, 1)), so "brass" is brass within 8 per
  // channel - still nowhere near the olive at rest (rgb(150, 160, 90)), so a flash that never turned brass still fails.
  const nearBrass = (rgb) => { const n = (String(rgb).match(/[\d.]+/g) || []).map(Number); return n.length >= 3 && Math.abs(n[0] - 255) <= 8 && Math.abs(n[1] - 152) <= 8 && n[2] <= 8; };
  const brass = nearBrass(flashing.stroke);
  // ARCHIVED PARK (#13 step 14): archive/rhizome-goal.mjs.parked.md record 6
  ok('Live: the flash paints brass', brass, JSON.stringify({ stroke: flashing.stroke }));
  // THE FLASH FADE (Nick, 2026-10-10: "a bit brighter and fade back out slower").
  const bright = await segLook(app);
  // Tolerances cover the hold's own 160ms ease-in (stroke, opacity and stroke-width all transition): the chat 1 pair read opacity
  // 0.9988 at onset. Each band stays far from the at-rest values (opacity .45, 0.4px/0.8px, the olive ink), so a flash that did
  // NOT brighten still fails. (nearBrass is defined above, at "the flash paints brass".)
  const px = (w) => parseFloat(w);
  ok('Live [flash fade]: the flash is BRIGHTER while it holds - full opacity and a heavier stroke (thin 1.35px, thick 2.1px), brass',
    !!bright && bright.flash === 'true' && !!bright.thin && bright.thin.opacity >= 0.95 && px(bright.thin.width) >= 1.15 && px(bright.thin.width) <= 1.4
      && nearBrass(bright.thin.stroke) && (!bright.thick || (px(bright.thick.width) >= 1.8 && px(bright.thick.width) <= 2.15)), JSON.stringify(bright));
  let fadingSeen = true;
  try { await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'fading'", { label: 'the fade begins', timeout: 2500 }); } catch { fadingSeen = false; }
  await sleep(600);   // inside the 2200ms fade
  const midFade = await segLook(app);
  ok('Live [flash fade]: after the hold the brass FADES out, not a cut - mid-fade a segment is still brass and partly transparent',
    fadingSeen && !!midFade && midFade.flash === 'fading' && !!midFade.thin && midFade.thin.stroke === 'rgb(255, 152, 0)' && midFade.thin.opacity > 0.05 && midFade.thin.opacity < 0.95,
    JSON.stringify({ fadingSeen, midFade }));
  try { await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false'", { label: 'the fade ends', timeout: 3000 }); } catch { /* reported below */ }
  const phases = flashPhases(await app.evalJs('window.__flashLog'));
  ok('Live [flash fade]: the hold is ~1.2s and the fade ~2.2s - data-flash goes true -> fading -> false',
    phases.hold != null && phases.hold >= 1100 && phases.hold <= 1500 && phases.fade != null && phases.fade >= 2000 && phases.fade <= 2700 && /true>fading>false/.test(phases.seq),
    JSON.stringify(phases));
  const reset = await field(app);
  // ARCHIVED PARK (#13 step 14): archive/rhizome-goal.mjs.parked.md record 7
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(' more');
  await sleep(400);
  const lap2 = await field(app);
  // ARCHIVED PARK (#13 step 14): archive/rhizome-goal.mjs.parked.md record 8
  ok('Live: the page rect survives the flash and the reset',
    rectAtFull && reset.rect && rectAtFull.w === reset.rect.w && rectAtFull.h === reset.rect.h,
    JSON.stringify({ rectAtFull, reset: reset.rect }));

  // ==========================================================================
  // THE FLASH UNDER REDUCED MOTION (Nick, 2026-10-10): no fade animation - the hold stays, and the lap clears at its end.
  // ==========================================================================
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await seedAndReopen(app, pageId, 7, { n: 8, unit: 'words' });
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await armFlashLog(app);
  await app.typeKeys(' tail');
  try { await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'reduced-motion flash', timeout: 4000 }); } catch { /* reported below */ }
  try {
    await app.waitFor("(window.__flashLog || []).some((x, i, a) => x[1] === 'false' && a.slice(0, i).some((y) => y[1] === 'true'))", { label: 'reduced-motion clear', timeout: 4000 });
  } catch { /* reported below */ }
  const rm = flashPhases(await app.evalJs('window.__flashLog'));
  ok('Live [flash fade, reduced motion]: NO fade - data-flash goes true -> false (never "fading"), and the ~1.2s hold stays',
    rm.tTrue != null && rm.tFading == null && rm.holdNoFade != null && rm.holdNoFade >= 1100 && rm.holdNoFade <= 1500, JSON.stringify(rm));
  await app.emulateMedia([]);

  // ==========================================================================
  // THE RHIZOME IS PLATEAU'S ONLY (Nick's ruling, via Fable 2026-10-09): every other theme replaces it with its own (Flux's comes
  // later), so under Flux this field draws NOTHING - no field, no segments, and crossing the goal flashes nothing. The same page,
  // goal and keystroke as the Plateau crossing above; only the theme differs. Mutant: scripts/rhizome-theme-mutant.mjs drops the
  // gate and this check must go RED.
  // ==========================================================================
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before the Flux seed' });
  await app.evalJs(`(() => {
    localStorage.setItem('wrizo-theme', 'flux');
    window.wrizoSetWritingGoal({ n: 8, unit: 'words' });
    window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') });
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page under Flux' });
  await sleep(800);
  const fluxBefore = await app.evalJs("({ theme: document.documentElement.getAttribute('data-theme'), field: !!document.querySelector('.wz-rhizome-field'), segs: document.querySelectorAll('.wz-rhizome-seg').length })");
  await app.evalJs(`(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); return true; })()`);
  await app.evalJs("window.__fluxFlash = false; window.__fluxFlashObs = new MutationObserver(() => { const f = document.querySelector('.wz-rhizome-field'); if (f && f.dataset.flash === 'true') window.__fluxFlash = true; }); window.__fluxFlashObs.observe(document.body, { subtree: true, childList: true, attributes: true }); true");
  await app.typeKeys(' tail');
  // a settled read: the editor reaches storage through two debounces, so wait on the STORED text, then give a flash its window
  try {
    await app.waitFor(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find(x => x.id === ${JSON.stringify(pageId)}) || {}).text?.includes('tail')`,
      { label: 'the crossing word stored', timeout: 5000 });
  } catch { /* the check reports the stored count */ }
  await sleep(1500);
  const crossed = await app.evalJs(`(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find(x => x.id === ${JSON.stringify(pageId)});
    return e ? e.text.split(' ').filter(Boolean).length : null; })()`);
  // (No regex here on purpose: this runs inside a template literal, where `\\s` cooks to a plain `s` - the b5b15d0 window counted
  //  the stored "word0 ... tail" as ONE word because split(/s+/) found no letter s. The seeded text is single-space separated.)
  const fluxAfter = await app.evalJs("({ theme: document.documentElement.getAttribute('data-theme'), field: !!document.querySelector('.wz-rhizome-field'), segs: document.querySelectorAll('.wz-rhizome-seg').length, flash: window.__fluxFlash })");
  ok('Theme: under Flux the rhizome field renders NOTHING - no field, no segments - and crossing the goal flashes nothing (the rhizome is Plateau\'s only)',
    fluxBefore.theme === 'flux' && !fluxBefore.field && fluxBefore.segs === 0 && fluxAfter.theme === 'flux' && !fluxAfter.field && fluxAfter.segs === 0 && fluxAfter.flash === false && crossed === 8,
    JSON.stringify({ fluxBefore, fluxAfter, wordsStored: crossed }));

  return checks;
});

console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nRHIZOME-GOAL VERIFY: PASS (${checks.length} checks)` : `\nRHIZOME-GOAL VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
