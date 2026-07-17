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
//
// Independent-review addition (post-build verification pass, not in the
// original brief's S3 list): an S1 regression guard at DESKFRAME_MIN_WIDTH
// (1100px) — empirically the only width range where the anchor/Drawer
// overlap the fix actually clamps ever manifests; the brief's own two named
// widths (1280/2200) turn out to produce byte-identical geometry whether or
// not the width-clamp fix is present, so without this block a regression of
// the clamp mechanism would slip past this file silently. Also an S2 cross-
// PAGE (not just cross-mode-switch) explicit-toggle-persistence check, using
// a two-entries-seeded-before-boot fixture that sidesteps the raw-
// localStorage-after-reload cache-staleness limit the build's own report
// flagged for why it dropped this case.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom}; })()`;

// The brief's own S1 distinguishes "the paper's border and padding gutter"
// (the grip/anchor MAY ride there) from "the text column" (never) — but
// `.mode-pagecol`/`.mode-page` share one border box (confirmed: identical
// rects at every width measured), so `rectOf('.mode-pagecol')` above is the
// paper's OUTER edge, padding included, not the text column itself. That
// distinction is invisible at 1280px/2200px (the brief's own two named
// widths) because the anchor's padding-dip never engages there — margin is
// always >= the 200px cap, so grip.right lands exactly on the paper's
// outer edge with zero dip, making the two rects equivalent by
// coincidence. It stops being equivalent once the dip DOES engage
// (independent-review's own 1100px addition, below), so that check needs
// the real text column: the paper's own box inset by its OWN computed
// left padding (read live, not the hand-copied 38px constant CSS itself
// has to hand-sync — this harness shouldn't repeat that same hand-sync).
const textColumnOf = (sel) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); const r = el.getBoundingClientRect(); const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0; return {left:r.left + pad, top:r.top, width:r.width - pad, height:r.height, right:r.right, bottom:r.bottom}; })()`;

// Two rects "never intersect" — a small epsilon (0.5px) absorbs the
// sub-pixel calc()/ch-unit rounding noise this layout's own nested
// min()/calc() math produces (confirmed harmless, pre-existing, present
// before FX2 too — never a real, visible overlap), without masking a real
// multi-pixel breach.
const disjoint = (a, b, eps = 0.5) =>
  a.right <= b.left + eps || b.right <= a.left + eps || a.bottom <= b.top + eps || b.bottom <= a.top + eps;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
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
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
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
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after draft seed' });
  await app.evalJs("location.hash = '#/page/fx2-draft'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Draft page framed' });
  await sleep(250);
};

// Independent-review addition (not in the original brief's own S3 list,
// which named only 1280px/2200px): two draft pages seeded into the SAME
// pre-boot localStorage write, so BOTH exist in persistence.ts's in-memory
// `cache.journalEntries` from the app's first hydrate — the module-level
// cache is only populated at import time (`hydrate()` at module scope, see
// store/persistence.ts), so a SECOND raw localStorage write made after that
// first reload would silently miss the cache and 404 on navigation. Seeding
// both up front sidesteps that limitation entirely: no second reload is
// needed, so navigating between them via a bare `location.hash` change (the
// same SPA navigation `freshDraftPage` already uses) exercises a genuine
// cross-PAGE/cross-MOUNT case, not just the cross-MODE-switch-within-one-
// mount case the brief's own S3 line already covers.
const freshTwoDraftPages = async (app, textA, textB, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx2-draft-a', text: ${JSON.stringify(textA)}, createdAt: now, updatedAt: now });
    entries.push({ id: 'fx2-draft-b', text: ${JSON.stringify(textB)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after two-page draft seed' });
};

const gotoPage = async (app, id) => {
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `Page ${id} framed` });
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
  // S1 — independent-review addition: a regression guard at DESKFRAME_MIN_
  // WIDTH (1100px, DeskFrame.tsx), not one of the brief's own two named
  // widths (1280/2200). Empirical, independent verification (before-fix CSS
  // swapped in and re-measured) found the anchor/Drawer-track overlap this
  // ticket actually fixes ONLY exists at widths below ~1265px — at 1280px
  // the pre-fix and post-fix geometry are byte-identical (the clamp's
  // width/overflow math never engages there; --sliver-margin already
  // exceeds the 200px cap). That means the committed S1 loop above, run
  // only at the brief's two named widths, cannot actually catch a
  // regression of the width-clamp mechanism — it would pass identically
  // whether the clamp fix were present or reverted. This block closes that
  // gap without touching the brief's own two checkpoints.
  //
  // Uses `textColumnOf`, not `rectOf('.mode-pagecol')` — at 1100px the
  // anchor's own design LEGITIMATELY dips into the paper's left padding
  // gutter (the brief's own explicit allowance: "may ride the paper's
  // border and padding gutter... NEVER cross into the text column"), so
  // asserting disjointness against the padding-INCLUSIVE paper rect here
  // would fail on fully-compliant, by-design geometry, not a real bug
  // (confirmed by first writing it that way — it failed at exactly the
  // padding-gutter depth the fix's own `clamp()` allows, nothing more).
  // ==========================================================================
  await freshProsePage(app, 1100, 900);
  const gripFloor = await app.evalJs(rectOf('.wz-sliver-grip'));
  const textColFloor = await app.evalJs(textColumnOf('.mode-page'));
  ok('S1 @ 1100px (DESKFRAME_MIN_WIDTH floor, independent-review addition): the grip rect and the TRUE text column (paper inset by its own live padding) never intersect, sliver CLOSED',
    disjoint(gripFloor, textColFloor), JSON.stringify({ gripFloor, textColFloor }));
  const drawerFloor = await app.evalJs(rectOf('.wz-drawer'));
  const anchorFloor = await app.evalJs(rectOf('.desk-frame-sliver-anchor'));
  ok('S1 @ 1100px (independent-review addition): the sliver anchor never overlaps the Drawer track — the actual mechanism S1\'s fix clamps, unexercised by the brief\'s own 1280px/2200px checkpoints',
    anchorFloor.left >= drawerFloor.right - 0.5, JSON.stringify({ drawerFloor, anchorFloor }));
  await openSliver(app);
  await sleep(250);
  const anchorFloorOpen = await app.evalJs(rectOf('.desk-frame-sliver-anchor'));
  const gripFloorOpen = await app.evalJs(rectOf('.wz-sliver-grip'));
  const textColFloorOpen = await app.evalJs(textColumnOf('.mode-page'));
  ok('S1 @ 1100px (independent-review addition): the Drawer stays clear with the sliver OPEN too (the opaque panel is the visible half of the original complaint)',
    anchorFloorOpen.left >= drawerFloor.right - 0.5, JSON.stringify({ drawerFloor, anchorFloorOpen }));
  ok('S1 @ 1100px (independent-review addition): the true text-column disjointness law holds at the floor width with the sliver OPEN',
    disjoint(gripFloorOpen, textColFloorOpen), JSON.stringify({ gripFloorOpen, textColFloorOpen }));

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
  // S2 — independent-review addition: the explicit flag across a SECOND
  // PAGE, not just a mode switch within one mount. store/writingSettings.ts's
  // own comment on `explicitlySetThisSession` claims the flag "has to
  // survive across DIFFERENT pages/mounts within one session, not just one
  // component's lifetime" — that's the stated reason it's module-scoped
  // rather than a page-level ref, but nothing above actually exercises TWO
  // distinct pages in one session (freshDraftPage's raw-localStorage-after-
  // boot fixture can only address ONE page per session; see
  // freshTwoDraftPages above for how this sidesteps that). Page A: short
  // (natural seed = ON); explicitly flip it OFF. Page B: ALSO short (natural
  // seed would ALSO be ON) — chosen deliberately so a silent re-seed on
  // open would flip it back to ON and this check would catch it; if B's own
  // seed correctly no-ops (because the module-level flag armed on page A is
  // still true), it opens OFF instead.
  // ==========================================================================
  await freshTwoDraftPages(app, shortDraftText, shortDraftText);
  await gotoPage(app, 'fx2-draft-a');
  const pageAMode = await activeModeTab(app);
  const pageASeed = await typewriterDom(app);
  ok('S2 (cross-page, independent-review addition): page A (short) opens Draft with typewriter ON — fixture sanity',
    pageAMode === 'Draft' && pageASeed === 'true', JSON.stringify({ pageAMode, pageASeed }));

  await openSliver(app);
  await sleep(200);
  await app.evalJs("document.querySelector('.wz-sliver-typewriter .typewriter-toggle')?.click()");
  await sleep(150);
  const pageAExplicitOff = await typewriterDom(app);
  ok('S2 (cross-page, independent-review addition): explicit click on page A actually flips it OFF by hand',
    pageAExplicitOff === 'false', String(pageAExplicitOff));

  await gotoPage(app, 'fx2-draft-b');
  const pageBMode = await activeModeTab(app);
  const pageBDom = await typewriterDom(app);
  const pageBSetting = await typewriterSetting(app);
  ok('S2 (cross-page, independent-review addition): page B (a DIFFERENT page/mount, also short) is Draft, sanity',
    pageBMode === 'Draft', String(pageBMode));
  ok('S2 (cross-page, independent-review addition): page B does NOT get silently re-seeded ON — the explicit OFF from page A survives the page/mount boundary, matching writingSettings.ts\'s own "different pages/mounts" claim for the module-level flag',
    pageBDom === 'false', String(pageBDom));
  ok('S2 (cross-page, independent-review addition): ...and the stored setting itself is OFF, not reverted by page B\'s own seed',
    pageBSetting === false, String(pageBSetting));

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
