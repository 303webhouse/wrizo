// Rhizome goal-fill — the Plateau roots follow the writer's own goal.
// A lap of 100 words and a lap of 1000 words both fill the ground at the
// goal. Crossing the goal flashes the network brass, then one segment
// remains and the next lap grows only from it. Every new segment starts
// on the network already drawn.
// Run from apps/desktop, dist-web built: node scripts/harness/rhizome-goal.mjs
import { spawnSync } from 'node:child_process';
import { withHarness } from '../runtime-verify.mjs';

const core = spawnSync(process.execPath, [new URL('./rhizome-goal-core.mjs', import.meta.url).pathname], { stdio: 'inherit' });
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
  let paperHit = 0, keepHit = 0, shares = true;
  const segs = [];
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
      }
      if (i > 0 && !segs.slice(0, i).some(earlier => touch(s, earlier))) shares = false;
    }
  }
  const thinW = seg ? Number.parseFloat(getComputedStyle(seg).strokeWidth) : null;
  const thickW = thick ? Number.parseFloat(getComputedStyle(thick).strokeWidth) : null;
  return {
    mounted: !!svg,
    editor: !!ed,
    segments: svg ? Number(svg.dataset.segments) : -1,
    frac: svg ? svg.dataset.goalFrac : null,
    flash: svg ? svg.dataset.flash : null,
    onPage: !!onPage,
    paperHit, keepHit, shares,
    thinW, thickW,
    pointer: svg ? getComputedStyle(svg).pointerEvents : null,
    stroke: seg ? getComputedStyle(seg).stroke : null,
    rect: pr ? { t: Math.round(pr.top), l: Math.round(pr.left), w: Math.round(pr.width), h: Math.round(pr.height) } : null,
  };
})()`);

await withHarness(async (app) => {
  await freshDesk(app);

  const pure = await app.evalJs(`(() => {
    const E = window.__wrizoRhizomeEngine;
    if (!E || !E.goalFillTarget) return { missing: true };
    const full = E.goalFillTarget(1);
    const half = E.goalFillTarget(0.5);
    const tenth = E.goalFillTarget(0.1);
    const zero = E.goalFillTarget(0);
    return { full, half, tenth, zero, cap: E.FILL_SEGMENTS, halfOf: full / 2, tenthOf: full / 10 };
  })()`);
  ok('Engine: goalFillTarget is on the seam', !pure.missing, JSON.stringify(pure));
  ok('Engine: fraction 0 grows nothing and fraction 1 is the fill cap', pure.zero === 0 && pure.full === pure.cap && pure.cap === 800, JSON.stringify(pure));
  ok('Engine: a 100-word goal at 100 words is a full ground, and the same 100 words of a 1000-word goal is a tenth',
    pure.half === pure.full / 2 && pure.tenth === pure.full / 10, JSON.stringify(pure));

  const pageId = await openRhizomePage(app);
  const empty = await field(app);
  ok('Live: an empty page mounts the field with zero segments, editor still mounted, pointer-events none',
    empty.mounted && empty.editor && empty.segments === 0 && empty.pointer === 'none', JSON.stringify(empty));

  const paperBefore = empty.rect;
  await seedAndReopen(app, pageId, 99, { n: 1000, unit: 'words' });
  const slow = await field(app);
  ok('Live: 99 of a 1000-word goal is a sparse ground (about a tenth of the fill)',
    slow.editor && slow.segments > 0 && slow.segments < pure.full * 0.25, JSON.stringify(slow));
  ok('Live: the page rect is unchanged by the roots',
    paperBefore && slow.rect && paperBefore.w === slow.rect.w && paperBefore.h === slow.rect.h && paperBefore.l === slow.rect.l,
    JSON.stringify({ paperBefore, after: slow.rect }));

  await app.evalJs("window.wrizoSetWritingGoal({ n: 100, unit: 'words' })");
  await sleep(500);
  const fast = await field(app);
  ok('Live: the same 99 words fill the ground when the goal is 100 (much denser than the 1000-word goal)',
    fast.segments > slow.segments * 4 && fast.segments >= pure.full * 0.9, JSON.stringify({ slow: slow.segments, fast: fast.segments, full: pure.full }));
  ok('Live: roots stay off the page — no on-page layer, no endpoint inside the sheet, editor still mounted',
    !fast.onPage && fast.paperHit === 0 && fast.editor && fast.pointer === 'none', JSON.stringify(fast));
  ok('Live: every segment after the first shares an endpoint, and none sit in a keep-out',
    fast.shares === true && fast.keepHit === 0 && fast.segments > 1, JSON.stringify({ shares: fast.shares, keepHit: fast.keepHit, segments: fast.segments }));
  ok('Live: most roots are a fine hairline and a few are thicker',
    fast.thinW != null && fast.thinW < 0.35 && fast.thickW != null && fast.thickW > 0.5 && fast.thickW < 0.9, JSON.stringify(fast));
  ok('Live: at rest the stroke is olive, not brass',
    fast.flash === 'false' && fast.stroke && fast.stroke !== 'rgb(255, 152, 0)', JSON.stringify({ stroke: fast.stroke, flash: fast.flash }));

  const rectAtFull = fast.rect;

  await seedAndReopen(app, pageId, 7, { n: 8, unit: 'words' });
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(' tail');
  await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'brass flash on goal', timeout: 4000 });
  await sleep(180);
  const flashing = await field(app);
  const brass = flashing.stroke === 'rgb(255, 152, 0)';
  ok('Live: hitting the goal flashes the network and the ground is full',
    flashing.flash === 'true' && flashing.segments >= pure.full * 0.9 && flashing.editor, JSON.stringify(flashing));
  ok('Live: the flash paints brass', brass, JSON.stringify({ stroke: flashing.stroke }));
  await sleep(1400);
  const reset = await field(app);
  ok('Live: after the flash exactly one segment survives',
    reset.flash === 'false' && reset.segments === 1 && reset.keepHit === 0 && reset.editor, JSON.stringify(reset));
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(' more');
  await sleep(400);
  const lap2 = await field(app);
  ok('Live: the next lap grows from the survivor — its first new segment touches it, and the network stays connected and out of the keep-outs',
    lap2.segments > 1 && lap2.shares === true && lap2.keepHit === 0 && lap2.flash === 'false', JSON.stringify(lap2));
  ok('Live: the page rect survives the flash and the reset',
    rectAtFull && reset.rect && rectAtFull.w === reset.rect.w && rectAtFull.h === reset.rect.h,
    JSON.stringify({ rectAtFull, reset: reset.rect }));

  return checks;
});

console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nRHIZOME-GOAL VERIFY: PASS (${checks.length} checks)` : `\nRHIZOME-GOAL VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
