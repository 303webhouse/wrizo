// FX14 — One Page (docs/wrizo-alpha/fx14-one-page-brief.md). A committed CDP
// verification scenario (per AGENTS.md "Harness scenarios persist"). Proves the
// ticket's own three positive claims, the live successors the sweep points at:
//   S3 — /journal/:id redirects universally to /page/:id (routeForEntry returns
//        /page for EVERY entry; App.tsx's JournalIdRedirect bounces any
//        /journal/:id -> /page/:id) — for a loose, a journal-origin, and a typed
//        entry (the three shapes the old routeForEntry branched between).
//   S2 — a journal-origin entry AND a loose entry both open in THE Page
//        (.forward-only-editor), never the retired JournalEntry surface, and the
//        Places Home zone reads each one's correct home (Journal / Loose).
//   S1 — every creation door lands on THE Page: Catch (the DeskRail gesture), and
//        the Page pop-out's own "New Page" and "New Journal Entry" doors. Origin
//        is preserved (the Journal door still stamps origin:'journal') — only the
//        destination moved to THE Page.
// (The board page-card births and the Spread cell doors are proven landing on
// /page/:id in j6.mjs's own re-pointed Section B — routeForEntry is the single
// seam they all now share.)
// Fixtures (freshDesk / seedFromDesk / openPageCategory) copied verbatim from
// b2.mjs / j6.mjs, per this project's own "don't re-derive fixtures" rule.
// Run: node scripts/harness/fx14.mjs   (from apps/desktop, with dist-web freshly
// built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// AGENTS.md's harness-seeding law (the flushNow race): seed ONLY while on the
// Desk (no flush-on-unmount writing surface mounted), then reload to hydrate.
const seedFromDesk = async (app, mutate) => {
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'seedFromDesk precondition: on the Desk' });
  await app.evalJs(mutate);
};

// b2.mjs's own openPageCategory, copied verbatim: open the Page category of the
// cascade strip (index 1) and wait for the Page face.
const openPageCategory = async (app) => {
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (openPageCategory)' });
  const alreadyOpen = await app.evalJs("!!document.querySelector('.wz-pageface-title')");
  if (alreadyOpen) return;
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open (openPageCategory)' });
};

await withHarness(async (app) => {
  // ==========================================================================
  // S3 — /journal/:id redirects universally to /page/:id.
  // ==========================================================================
  await freshDesk(app, 1400, 900);
  await seedFromDesk(app, `(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx14-loose', text: 'A loose page', projectId: null, origin: 'loose', source: 'page', createdAt: now, updatedAt: now });
    entries.push({ id: 'fx14-journal', text: 'A journal-origin page', projectId: null, origin: 'journal', source: 'page', createdAt: now, updatedAt: now });
    entries.push({ id: 'fx14-typed', text: 'A typed note', projectId: null, origin: 'journal', pageType: 'note', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after redirect seed' });
  for (const [id, label] of [['fx14-loose', 'loose'], ['fx14-journal', 'journal-origin'], ['fx14-typed', 'typed (pageType:note)']]) {
    await app.evalJs(`location.hash = '#/journal/${id}'`);
    await sleep(350);
    const hash = await app.evalJs('location.hash');
    ok(`S3: /journal/:id redirects universally to /page/:id for a ${label} entry (App.tsx's JournalIdRedirect)`,
      hash === `#/page/${id}`, hash);
  }

  // ==========================================================================
  // S2 — journal-origin AND loose both open in THE Page, with the right home.
  // ==========================================================================
  for (const [id, homeLabel, desc] of [['fx14-journal', 'Journal', 'a journal-origin'], ['fx14-loose', 'Loose', 'a loose']]) {
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `THE Page mounted (${desc})` });
    await sleep(200);
    ok(`S2: ${desc} entry opens in THE Page interface (.forward-only-editor), not the retired Journal surface (.entry-edit)`,
      await app.evalJs("!!document.querySelector('.forward-only-editor') && !document.querySelector('.entry-edit')"), '');
    await openPageCategory(app);
    await app.waitFor("!!document.querySelector('.wz-places-home')", { label: `Places Home zone (${desc})` });
    const homeChecked = await app.evalJs(`[...document.querySelectorAll('.wz-places-home label')].find(l => l.textContent.trim() === ${JSON.stringify(homeLabel)})?.querySelector('input')?.checked`);
    ok(`S2: ${desc} entry reads its correct home in Places — "${homeLabel}" checked as current fact`,
      homeChecked === true, String(homeChecked));
  }

  // ==========================================================================
  // S1 — every creation door lands on THE Page.
  // ==========================================================================
  // Catch — the DeskRail button on a non-framed route (/drawers), a trusted
  // click (its onClick model is useCatch -> createJournalPage -> /page/:id).
  await freshDesk(app, 1400, 900);
  await app.goto('/drawers');
  await app.waitFor("!!document.querySelector('.desk-rail-catch')", { label: 'DeskRail Catch reachable' });
  await app.evalJs("document.querySelector('.desk-rail-catch').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Catch landed on THE Page' });
  const catchHash = await app.evalJs('location.hash');
  const catchNoJournalSurface = await app.evalJs("!document.querySelector('.entry-edit')");
  ok('S1: Catch (DeskRail) lands on THE Page (/page/:id), never the retired Journal surface',
    /^#\/page\/[^/]+$/.test(catchHash) && catchNoJournalSurface === true, catchHash);
  const catchId = catchHash.replace(/^#\/page\//, '');
  await sleep(500); // let createJournalPage's own persist flush land in localStorage before reading it
  const catchEntry = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(catchId)})`);
  ok('S1: Catch preserves origin semantics — still stamps origin:\'journal\', still untyped (only its destination is THE Page now)',
    catchEntry?.origin === 'journal' && catchEntry?.pageType == null, JSON.stringify(catchEntry));

  // The Page pop-out's own doors: "New Page" and "New Journal Entry". Reach the
  // pop-out from a stable page underfoot (the Catch section's freshDesk cleared the
  // S3/S2 seeds), then click each door.
  await freshDesk(app, 1400, 900);
  await seedFromDesk(app, `(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx14-door-probe', text: 'Door probe', projectId: null, origin: 'journal', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after door-probe seed' });
  for (const [doorLabel, expectOrigin] of [['New Page', null], ['New Journal Entry', 'journal']]) {
    await app.evalJs("location.hash = '#/page/fx14-door-probe'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `THE Page (before "${doorLabel}")` });
    await openPageCategory(app);
    await app.waitFor(`[...document.querySelectorAll('.wz-cascade-action')].some(b => b.textContent.trim() === ${JSON.stringify(doorLabel)})`, { label: `"${doorLabel}" door present` });
    await app.evalJs(`[...document.querySelectorAll('.wz-cascade-action')].find(b => b.textContent.trim() === ${JSON.stringify(doorLabel)}).click()`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `"${doorLabel}" landed on THE Page` });
    await sleep(250);
    const doorHash = await app.evalJs('location.hash');
    const doorNoJournalSurface = await app.evalJs("!document.querySelector('.entry-edit')");
    ok(`S1: the "${doorLabel}" door lands on a FRESH page in THE Page (/page/:id), never the retired Journal surface`,
      /^#\/page\/[^/]+$/.test(doorHash) && doorHash !== '#/page/fx14-door-probe' && doorNoJournalSurface === true, doorHash);
    if (expectOrigin) {
      const doorId = doorHash.replace(/^#\/page\//, '');
      const doorEntry = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(doorId)})`);
      ok(`S1: the "${doorLabel}" door preserves origin semantics (origin:'${expectOrigin}')`,
        doorEntry?.origin === expectOrigin, JSON.stringify(doorEntry));
    }
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX14 VERIFY: PASS (${checks.length} checks)` : `\nFX14 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
