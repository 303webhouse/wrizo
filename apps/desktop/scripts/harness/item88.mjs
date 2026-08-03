// ITEM 88a + 88b — THE FILING TARGET IS VALIDATED, AND THE TOAST STOPS LYING.
// A committed CDP verification scenario, per AGENTS.md's "harness scenarios
// persist."
//
// THE TWO MECHANISMS THIS GUARDS, stated so a future reader inherits them.
//
// 88a — `setPageHome` (`persistence.ts`) used to assign ANY string that wasn't
// 'shelf'/'loose'/'journal' straight to `entry.projectId` as "a binder id", with
// no existence check. A page carrying a projectId that names no live binder is
// invisible to EVERY enumerator: not the Journal (`projectId == null` filter),
// not any binder's page list, not the Shelf (`belongsOnShelf` excludes filed
// pages), and not the "Everything" export. That is a code-level YES to "can a
// filing mutation render a row invisible to everything, including export."
//
// 88b — the same function returned `void`, so its `!entry` early exit was
// indistinguishable from success. `PlacesPanel.fileTo` therefore toasted
// `Filed to ${label}.` UNCONDITIONALLY. On an UNBORN page — which PB1
// deliberately keeps out of the store until its first word — `getJournalEntry`
// misses, nothing is written, and the panel congratulated the writer anyway.
// That is the incident's own condition: a new empty page.
//
// WHY 88a NEEDS A SEAM AND 88b DOES NOT. Every filing surface builds its list
// from `getProjects()`, so a bogus binder id is UNREACHABLE by clicking — which
// is exactly why the guard is worth having and exactly why the refusal cannot be
// driven through the UI. S2 therefore calls `window.wrizoSetPageHome` (the
// `window.wrizoPinPageToBoard` seam's own established pattern, added by this
// ticket). 88b, by contrast, is fully reachable as a writer: S1 opens a real
// unborn page and clicks a real radio, so the incident is reproduced rather than
// simulated.
//
// Fixtures (freshDesk / openPageCategory) copied verbatim from pb1.mjs and
// b2.mjs per the standing instruction not to re-derive fixtures. Seeding goes
// through `window.wrizoCreateJournalPage` per AGENTS.md's harness seeding law.
// Run: node scripts/harness/item88.mjs   (from apps/desktop, dist-web freshly built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROWS_KEY = 'writer-studio-journal-entries';
const LAPTOP_W = 1400;

const freshDesk = async (app, width = LAPTOP_W, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// b1.mjs/b2.mjs's own helper, copied verbatim: index 1 in the strip is Page.
const openPageCategory = async (app) => {
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted' });
  const alreadyOpen = await app.evalJs("!!document.querySelector('.wz-pageface-title')");
  if (alreadyOpen) return;
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open' });
};

const toastText = (app) => app.evalJs("(document.querySelector('.action-toast')||{}).textContent || ''");
const rowById = (app, id) => app.evalJs(
  `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').find(e => e.id === ${JSON.stringify(id)}) || null`);

const waitSoft = async (app, expr, opts) => {
  try { await app.waitFor(expr, opts); } catch { /* the assertion reports the truth */ }
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — 88b: THE UNBORN PAGE. The incident, reproduced as a writer.
  // A brand-new empty page, the Places panel, one click on a real binder.
  // Nothing is filed (there is no row to file), so nothing may claim it was.
  // ==========================================================================
  await freshDesk(app);
  // A live binder to aim at, so the row the writer clicks is a legitimate one.
  await app.evalJs("window.wrizoCreateJournalPage()"); // a real page, so a binder can be minted from a born surface
  await app.goto('/page/new?origin=journal');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn page surface' });

  // Settle past the ~300ms debounced flush before counting. The first run of
  // this file read the count at t=0 and got 0 while a seeded row was still in
  // the write window, so S1(c) measured the debounce rather than the fix.
  await sleep(700);
  const rowsBefore = await app.evalJs(`JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').length`);

  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places-home')", { label: 'Places Home zone (unborn page)' });

  // Mint a binder AND file in one act — the createAndFile path, which is the
  // one a writer on a fresh page actually reaches (there may be no binder yet).
  await app.evalJs("document.querySelector('.wz-places-newdrawer-btn').click()");
  await app.waitFor("!!document.querySelector('.wz-places-newdrawer-input')", { label: 'New Drawer input' });
  await app.evalJs("document.querySelector('.wz-places-newdrawer-input').focus()");
  await app.typeKeys('Item88 Drawer');
  await app.evalJs("document.querySelector('.wz-places-newdrawer-create').click()");
  await sleep(600);

  const unbornToast = await toastText(app);
  ok('S1 (a) — the toast does NOT claim a filing that never happened [88b, THE INCIDENT]',
    !/^Filed to /.test(unbornToast.trim()),
    `toast=${JSON.stringify(unbornToast)}`);
  ok('S1 (b) — and it says so honestly rather than falling silent',
    unbornToast.trim().length > 0 && /nothing moved|write a word/i.test(unbornToast),
    `toast=${JSON.stringify(unbornToast)}`);

  const rowsAfter = await app.evalJs(`JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').length`);
  ok('S1 (c) — the unborn page is STILL unborn: the refused filing wrote no row',
    rowsAfter === rowsBefore,
    `before=${rowsBefore} after=${rowsAfter}`);

  // ==========================================================================
  // S2 — 88a: A BOGUS BINDER ID IS REFUSED, AND NOTHING IS WRITTEN.
  // Driven through the store seam, because no UI can offer such a target.
  // ==========================================================================
  await freshDesk(app);
  const pageId = await app.evalJs('window.wrizoCreateJournalPage().id');
  const before = await rowById(app, pageId);

  const seamPresent = await app.evalJs("typeof window.wrizoSetPageHome === 'function'");
  ok('S2 seam — window.wrizoSetPageHome is exposed for the unreachable-target case',
    seamPresent === true, `seam=${seamPresent}`);

  const bogusResult = await app.evalJs(
    "String(window.wrizoSetPageHome ? window.wrizoSetPageHome('" + pageId + "', 'no-such-binder-item88') : 'NO_SEAM')");
  ok('S2 (a) — filing into an id that names no live binder is REFUSED',
    bogusResult === 'no-such-binder',
    `result=${bogusResult}`);

  await sleep(600); // past the ~300ms debounced flush, so a write would be visible
  const after = await rowById(app, pageId);
  ok('S2 (b) — and the refusal writes NOTHING: projectId is untouched',
    !!after && (after.projectId ?? null) === (before?.projectId ?? null),
    `before.projectId=${JSON.stringify(before?.projectId ?? null)} after.projectId=${JSON.stringify(after?.projectId ?? null)}`);

  // The whole point of 88a: a page that survived a bogus filing is still
  // reachable. Asserted on the enumerator that the defect would have emptied.
  const stillEnumerable = await app.evalJs(
    `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
    + `.filter(e => !e.deletedAt && e.projectId == null).map(e => e.id).includes(${JSON.stringify(pageId)})`);
  ok('S2 (c) — the page remains un-filed and therefore still enumerable (not orphaned)',
    stillEnumerable === true, `stillEnumerable=${stillEnumerable}`);

  // ==========================================================================
  // S3 — THE HONEST PATH STILL WORKS. A guard that refuses everything would
  // pass S1 and S2 and be a worse defect than the one being fixed.
  // ==========================================================================
  await freshDesk(app);
  const bornId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.goto(`/page/${bornId}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'born page' });
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Item88 born page.');
  await waitSoft(app,
    `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').some(e => e.id === ${JSON.stringify(bornId)} && (e.text||'').trim().length > 0)`,
    { label: 'page text persisted', timeout: 9000 });

  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places-home')", { label: 'Places Home zone (born page)' });
  await app.evalJs("document.querySelector('.wz-places-newdrawer-btn').click()");
  await app.waitFor("!!document.querySelector('.wz-places-newdrawer-input')", { label: 'New Drawer input (born)' });
  await app.evalJs("document.querySelector('.wz-places-newdrawer-input').focus()");
  await app.typeKeys('Item88 Real Drawer');
  await app.evalJs("document.querySelector('.wz-places-newdrawer-create').click()");
  await sleep(600);

  const bornToast = await toastText(app);
  ok('S3 (a) — a REAL filing still reports success',
    /^Filed to /.test(bornToast.trim()),
    `toast=${JSON.stringify(bornToast)}`);

  const bornRow = await rowById(app, bornId);
  ok('S3 (b) — and it really filed: projectId now names the new binder',
    !!bornRow && !!bornRow.projectId,
    `projectId=${JSON.stringify(bornRow?.projectId ?? null)}`);

  const binderLives = await app.evalJs(
    `JSON.parse(localStorage.getItem('writer-studio-projects') || '[]')`
    + `.some(p => !p.deletedAt && p.id === ${JSON.stringify(bornRow?.projectId ?? '')})`);
  ok('S3 (c) — the projectId it wrote names a LIVE binder (the 88a invariant, on the happy path)',
    binderLives === true, `binderLives=${binderLives}`);
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// ITEM 88 parks no assertion. b2.mjs's own Places checks (S4's Home zone,
// create-and-file) all run on BORN pages, so every one of them still holds
// verbatim — this ticket changes what happens on the unborn path and on a
// target no UI offers, neither of which any committed check asserted.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log('\nITEM88 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 88 parks nothing (b2.mjs\'s Places checks all run on born pages and are untouched).');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM88 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM88 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
