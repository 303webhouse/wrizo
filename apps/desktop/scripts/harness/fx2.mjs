// FX2 — the Second Sitting (docs/wrizo-alpha/fx2-second-sitting-brief.md). A
// committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on cd1.mjs's own fixtures/patterns.
// Run: node apps/desktop/scripts/harness/fx2.mjs   (from the repo root, with
// dist-web freshly built via `pnpm run build:web`).
//
// S1 — the grip clearance law: the grip's rect and the text column's rect
// never intersect, at 1280px (laptop) AND 2200px (wide), sliver closed AND
// open — extends cd1.mjs's own paper-immutability law (open vs. closed rect
// byte-identical) to the 1280px width cd1.mjs never tested.
// S2 — the Draft-open typewriter default, the ten-line exception, the
// explicit-toggle-wins-for-the-session rule, and Free Write's own
// unaffected default.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom}; })()`;

// Two rects "never intersect" — a small epsilon (0.5px) absorbs the
// sub-pixel calc()/ch-unit rounding noise this layout's own nested
// min()/calc() math produces (confirmed harmless, pre-existing, present
// before FX2 too — never a real, visible overlap), without masking a real
// multi-pixel breach.
const disjoint = (a, b, eps = 0.5) =>
  a.right <= b.left + eps || b.right <= a.left + eps || a.bottom <= b.top + eps || b.bottom <= a.top + eps;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// A fresh, framed, project-origin (book chapter) prose page in Free Write —
// same fixture cd1.mjs uses, at a caller-chosen viewport.
const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

// The Desk's start-writing / home-base door: a loose page, opening in Free
// Write by default (CD1 S8/A7) — used here as the "fresh Free Write page"
// fixture for S2's own unaffected-default check.
const freshLoosePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs("document.querySelector('.wz-start-writing').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed (loose)' });
  await sleep(400);
};

// An untyped SUPPORT page (no pageType, no project, no loose origin) —
// PageEditor.tsx's own mode initializer defaults exactly this shape to
// 'drafting' (the "other untyped support pages open in Draft" branch). Text
// is seeded verbatim so the S2 line-count threshold can be exercised on
// both sides deterministically.
const freshDraftPage = async (app, text, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx2-draft', text: ${JSON.stringify(text)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after draft seed' });
  await app.evalJs("location.hash = '#/page/fx2-draft'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Draft page framed' });
  await sleep(250);
};

const openSliver = (app) => app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");

const typewriterDom = (app) => app.evalJs("document.querySelector('.mode-scroll')?.dataset.typewriter");
// Mirrors store/writingSettings.ts's own load() — DEFAULTS.typewriter=true
// spread under whatever's actually persisted, since the store never writes
// its defaults back to localStorage preemptively (only an explicit
// setWritingSettings call ever does). Reading the raw key alone would read
// `undefined` for "never touched," which is a true statement about
// localStorage but not about the EFFECTIVE setting every consumer
// (useWritingSettings) actually resolves to.
const typewriterSetting = (app) => app.evalJs(
  "(() => { try { const raw = localStorage.getItem('wrizo-writing-settings'); const parsed = raw ? JSON.parse(raw) : {}; return 'typewriter' in parsed ? parsed.typewriter : true; } catch { return null; } })()",
);
const activeModeTab = (app) => app.evalJs("document.querySelector('.desk-mode-tab.active')?.textContent");
const clickModeTab = (app, label) =>
  app.evalJs(`[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === ${JSON.stringify(label)})?.click()`);

// ~3 and ~15 line-equivalents respectively — short lines (well under the
// 60ch canonical measure) so each hard newline is exactly one line, making
// the fixture's own line count unambiguous (matches
// store/lineEquivalents.ts's countLineEquivalents exactly, no soft-wrap
// arithmetic needed to reason about the fixture).
const shortDraftText = Array.from({ length: 3 }, (_, i) => `short line ${i}`).join('\n');
const longDraftText = Array.from({ length: 15 }, (_, i) => `a longer line of draft prose, number ${i}`).join('\n');

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — grip clearance law: grip/text disjointness, grip persistence, the
  // open panel's opacity, and paper-rect invariance, at 1280px (laptop) AND
  // 2200px (wide), sliver closed AND open.
  // ==========================================================================
  for (const width of [1280, 2200]) {
    await freshProsePage(app, width, 900);

    const gripClosed = await app.evalJs(rectOf('.wz-sliver-grip'));
    const paperClosed = await app.evalJs(rectOf('.mode-pagecol'));
    ok(`S1 @ ${width}px: the grip rect and the text-column rect never intersect, sliver CLOSED`,
      disjoint(gripClosed, paperClosed), JSON.stringify({ gripClosed, paperClosed }));

    const gripVisClosed = await app.evalJs(`(() => { const cs = getComputedStyle(document.querySelector('.wz-sliver-grip')); return { opacity: cs.opacity, display: cs.display, visibility: cs.visibility }; })()`);
    ok(`S1 @ ${width}px: the grip persists VISIBLE while the sliver is closed (persistent chrome, never dissolves on its own)`,
      gripVisClosed.opacity !== '0' && gripVisClosed.display !== 'none' && gripVisClosed.visibility !== 'hidden',
      JSON.stringify(gripVisClosed));

    await openSliver(app);
    await sleep(250);

    const gripOpen = await app.evalJs(rectOf('.wz-sliver-grip'));
    const paperOpen = await app.evalJs(rectOf('.mode-pagecol'));
    ok(`S1 @ ${width}px: the grip rect and the text-column rect never intersect, sliver OPEN`,
      disjoint(gripOpen, paperOpen), JSON.stringify({ gripOpen, paperOpen }));

    const gripVisOpen = await app.evalJs(`(() => { const cs = getComputedStyle(document.querySelector('.wz-sliver-grip')); return { opacity: cs.opacity, display: cs.display, visibility: cs.visibility }; })()`);
    ok(`S1 @ ${width}px: the grip persists VISIBLE while the sliver is open too`,
      gripVisOpen.opacity !== '0' && gripVisOpen.display !== 'none' && gripVisOpen.visibility !== 'hidden',
      JSON.stringify(gripVisOpen));

    const panelBg = await app.evalJs(`(() => {
      const cs = getComputedStyle(document.querySelector('.wz-sliver-panel'));
      const m = cs.backgroundColor.match(/rgba?\\(([^)]+)\\)/);
      const parts = m ? m[1].split(',').map(s => parseFloat(s)) : [];
      return { backgroundColor: cs.backgroundColor, alpha: parts.length === 4 ? parts[3] : 1 };
    })()`);
    ok(`S1 @ ${width}px: the OPEN sliver panel's computed background is opaque (alpha=1), never see-through onto the paper`,
      panelBg.alpha === 1, JSON.stringify(panelBg));

    ok(`S1 @ ${width}px: the paper rect is byte-identical open vs. closed (extends cd1.mjs's own law to this width)`,
      JSON.stringify(paperClosed) === JSON.stringify(paperOpen), JSON.stringify({ paperClosed, paperOpen }));

    await openSliver(app); // close it back, hygiene for the next iteration
    await sleep(150);
  }

  // ==========================================================================
  // S2 — Draft threshold, both sides: seeding a page below the 10-line
  // threshold opens Draft with typewriter ON; at/above it, OFF.
  // ==========================================================================
  await freshDraftPage(app, shortDraftText);
  const shortMode = await activeModeTab(app);
  const shortDom = await typewriterDom(app);
  const shortSetting = await typewriterSetting(app);
  ok('S2: an untyped support page defaults to Draft on open (the fixture itself, sanity-checked)', shortMode === 'Draft', String(shortMode));
  ok('S2: a ~3-line page (below the 10-line threshold) opens Draft with typewriter ON — DOM (.mode-scroll[data-typewriter])',
    shortDom === 'true', String(shortDom));
  ok('S2: a ~3-line page opens Draft with typewriter ON — the stored setting itself',
    shortSetting === true, String(shortSetting));

  await freshDraftPage(app, longDraftText);
  const longMode = await activeModeTab(app);
  const longDom = await typewriterDom(app);
  const longSetting = await typewriterSetting(app);
  ok('S2: a ~15-line page also opens in Draft (the fixture itself, sanity-checked)', longMode === 'Draft', String(longMode));
  ok('S2: a ~15-line page (at/above the 10-line threshold) opens Draft with typewriter OFF — DOM',
    longDom === 'false', String(longDom));
  ok('S2: a ~15-line page opens Draft with typewriter OFF — the stored setting itself',
    longSetting === false, String(longSetting));

  // ==========================================================================
  // S2 — the explicit toggle wins for the rest of the session: still on the
  // ~15-line page (seeded OFF above), hand-click it ON via the sliver, then
  // round-trip Draft -> Free Write -> Draft WITHIN THE SAME MOUNT. A
  // mid-session mode switch must NOT re-run the seed (which would otherwise
  // want to turn it back OFF, since the page still has 15 lines).
  // ==========================================================================
  await openSliver(app);
  await sleep(200);
  await app.evalJs("document.querySelector('.wz-sliver-typewriter .typewriter-toggle')?.click()");
  await sleep(150);
  const afterExplicitClick = await typewriterDom(app);
  ok('S2: the sliver\'s typewriter toggle actually flips it ON by hand, overriding the ~15-line OFF seed',
    afterExplicitClick === 'true', String(afterExplicitClick));

  await clickModeTab(app, 'Free Write');
  await sleep(200);
  await clickModeTab(app, 'Draft');
  await sleep(200);
  const afterRoundTrip = await typewriterDom(app);
  ok('S2: Draft -> Free Write -> Draft within the SAME mount does not re-run the seed — the explicit ON survives the round trip',
    afterRoundTrip === 'true', String(afterRoundTrip));
  const afterRoundTripSetting = await typewriterSetting(app);
  ok('S2: ...and the stored setting itself reflects the same explicit ON, not a reverted OFF',
    afterRoundTripSetting === true, String(afterRoundTripSetting));

  // ==========================================================================
  // S2 — Free Write is unaffected: a genuinely fresh session's loose page
  // still opens with typewriter ON, unchanged from today (localStorage
  // cleared + reloaded by freshLoosePage -> freshDesk, so neither the
  // stored setting nor the session-explicit flag carries over from the
  // checks above).
  // ==========================================================================
  await freshLoosePage(app);
  const looseMode = await activeModeTab(app);
  const looseDom = await typewriterDom(app);
  const looseSetting = await typewriterSetting(app);
  ok('S2: a fresh loose page opens in Free Write (the fixture itself, sanity-checked)', looseMode === 'Free Write', String(looseMode));
  ok('S2: a fresh Free Write page opens with typewriter ON, unchanged from today — DOM',
    looseDom === 'true', String(looseDom));
  ok('S2: a fresh Free Write page opens with typewriter ON — the stored (default) setting itself',
    looseSetting === true, String(looseSetting));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// fx2.mjs is a brand-new file; it parks nothing of its own. S1's fix left
// every one of cd1.mjs's own existing checks byte-identical (verified
// empirically: at cd1.mjs's own tested widths — ~1400px default and its one
// 2200px excursion — the sliver anchor's clamp formula never actually
// engages; it only shrinks the anchor below DeskFrame's ~1265px breakpoint,
// a width cd1.mjs never visits), so nothing needed parking there either.
// This scaffold exists so a future ticket that supersedes any of THIS
// file's checks has a documented home, matching every other harness file's
// own pattern.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nFX2 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of fx2.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX2 VERIFY: PASS (${checks.length} checks)` : `\nFX2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
