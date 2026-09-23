// EXPERIMENT 1 — "Connect from the page" (docs/menus/b-exp1-connect-from-the-page.md, §7/§8).
// Run: node apps/desktop/scripts/harness/exp1.mjs   (from the repo root, with
// dist-web freshly built via `pnpm run build:web`).
//
// §8's two-builder split: PW owns the text side (span capture, storage,
// re-finding, the menu, the left strip's acts, the painted mark);
// TOOLS (this lane) owns the rail side (item 190's Experiments switch and
// everything it hides, zone 5 and the width budget, the Linked list, open,
// remove/unlink) — reading `store/anchors.ts`, never writing through it.
//
// GROWS WITH THE LINKED LIST (Fable, 2026-09-24): §7 check 1 (switch OFF =
// v1) plus a PARTIAL §7 check 5 — the resting list's own sort/group/remove,
// now that `store/anchors.ts` is real (merged from PW's `exp1-connect-text`
// @ 78d4529). STILL NOT HERE, because the machinery for them does not exist
// on this branch: §7 check 2 (capture), check 3 (re-finding), check 4 (the
// menu's Remove), the SELECTED-state half of check 5 ("click a linked span
// -> only its source(s)" — detecting the click is PW's painted-mark
// mechanism, §6c, blocked on the `CSS.highlights` measurement), and the
// "double-click opens the right popup" half of check 5's OPEN clause (a
// card target navigates to its board here, not a card popup — see
// LinkedRail.tsx's own header for why). Extending this file further is
// PW's own commit (checks 2-4) or a later one once §6c's painted mark and
// BoardCardPopup's own export land — recorded here so a reader of a
// still-partial exp1.mjs knows it by design, not by oversight (park-count
// law: state what's missing, never let a partial file read as finished).
import { withHarness } from '../runtime-verify.mjs';
import { trustedDispatch } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
    + " localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');",
  );
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(400); // store/persistence.ts's own FLUSH_DELAY (300ms) — tu1.mjs's own comment
};

const openTutor = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
  await sleep(300);
};

const setExperimentFlag = (app, on) =>
  app.evalJs(`localStorage.setItem('wrizo-experiments', JSON.stringify({ connectFromThePage: ${on ? 'true' : 'false'} }))`);

const panelOuterHTML = (app) =>
  app.evalJs("document.querySelector('.wz-tutor-panel')?.outerHTML ?? null");

// §7 check 5's own fixture: one prose page with FOUR links, one of each
// RailKind (store/linkedRail.ts) — a plain page (tagged), a board (tagged),
// a card on that board (no tags — Box has none), and a bare note (no
// target, no tags). Seeded through `wrizoCreateJournalPage`'s own
// `pageLinks` field, this ticket's own additive widening of that seam
// (persistence.ts, JournalPageSeed) — never a raw localStorage write, the
// standing law. `updatedAt` values are spaced a full second apart so
// recency order is unambiguous rather than relying on wall-clock ordering
// of near-simultaneous seeds.
const seedLinkedFixture = async (app) => {
  await freshDesk(app, 1280, 900);
  await app.evalJs(`(() => {
    const t = (n) => new Date(Date.UTC(2026, 8, 24, 12, 0, n)).toISOString();
    window.wrizoCreateJournalPage({
      id: 'exp1-target-page', text: 'A Source Page\\nsome body text', tags: ['research', 'characters'], createdAt: t(0), origin: null,
    });
    window.wrizoCreateJournalPage({
      id: 'exp1-target-board', text: 'A Linked Board', pageType: 'board', tags: ['plot'], createdAt: t(0), origin: null,
      boxes: [{ id: 'exp1-card-1', kind: 'text', text: 'A Card', x: 0, y: 0, w: 100, h: 60, z: 1 }],
    });
    window.wrizoCreateJournalPage({
      id: 'exp1-page', text: 'The main page.\\n\\nSecond paragraph.', createdAt: t(0), origin: null,
      pageLinks: {
        anchors: [
          { id: 'a1', paraIndex: 0, quote: 'main', prefix: 'The ', suffix: ' page.', startHint: 4, createdAt: t(0), updatedAt: t(0) },
          { id: 'a2', paraIndex: 1, quote: 'Second', prefix: '', suffix: ' paragraph.', startHint: 0, createdAt: t(0), updatedAt: t(0) },
        ],
        links: [
          { id: 'link-source', anchorId: 'a1', kind: 'source', targetEntryId: 'exp1-target-page', createdAt: t(0), updatedAt: t(1) },
          { id: 'link-board', anchorId: 'a2', kind: 'source', targetEntryId: 'exp1-target-board', createdAt: t(0), updatedAt: t(2) },
          { id: 'link-card', anchorId: 'a1', kind: 'card', targetEntryId: 'exp1-target-board', targetBoxId: 'exp1-card-1', createdAt: t(0), updatedAt: t(3) },
          { id: 'link-note', anchorId: 'a2', kind: 'note', body: 'A bare note', createdAt: t(0), updatedAt: t(4) },
        ],
      },
    });
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/exp1-page'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'exp1 page framed' });
  await sleep(300);
  await setExperimentFlag(app, true);
  await app.reload();
  await app.evalJs("location.hash = '#/page/exp1-page'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'exp1 page re-framed, switch on' });
  await sleep(300);
};

const openLinkedTab = async (app) => {
  await openTutor(app);
  await app.evalJs("document.querySelector('#wz-tutor-tab-linked').click()");
  await sleep(200);
};

const railRows = (app) => app.evalJs(`Array.from(document.querySelectorAll('.wz-linked-rail-item')).map(row => ({
  kind: row.querySelector('.wz-linked-rail-item-kind')?.textContent ?? null,
  label: row.querySelector('.wz-linked-rail-item-label')?.textContent ?? null,
}))`);

await withHarness(async (app) => {
  // ==========================================================================
  // §7 check 1 — SWITCH OFF = v1: no mark, no act, DOM byte-identical to the
  // pre-change build. Two proofs, matching this project's own dual-proof
  // style for an additive-only change:
  //
  // (a) STRUCTURAL ABSENCE — none of this ticket's own new class names
  //     (`wz-tutor-tabs`, `wz-tutor-tab`, `wz-linked-rail`) appear ANYWHERE
  //     in the panel's outerHTML string. Every one of them is written by
  //     JSX gated on `experimentsOn` (Tutor.tsx) — their total absence
  //     from the rendered string is the direct, literal content of "no
  //     trace of this ticket's markup was ever inserted", the substantive
  //     claim "byte-identical to the pre-change build" is making (this
  //     lane cannot diff against a SEPARATE pre-change bundle from inside
  //     a single running build; asserting the new bytes never appear is
  //     the buildable form of the same claim).
  // (b) ROUND-TRIP IS A NO-OP — flip the switch on, open the Linked tab
  //     (mounting `.wz-linked-rail` and its own subtree), flip it back
  //     off, remount fresh: the panel's outerHTML is IDENTICAL to a page
  //     that never touched the switch at all. Proves "OFF" really means
  //     off, not "off until you've ever turned it on once."
  // ==========================================================================
  await freshProsePage(app, 1280, 900);
  await openTutor(app);
  const offHTML = await panelOuterHTML(app);
  const NEW_MARKERS = ['wz-tutor-tabs', 'wz-tutor-tab', 'wz-linked-rail'];
  for (const marker of NEW_MARKERS) {
    ok(`§7.1 (a): switch OFF (default) — "${marker}" never appears in the Tutor panel's DOM`,
      typeof offHTML === 'string' && !offHTML.includes(marker), JSON.stringify({ marker, found: offHTML?.includes(marker) }));
  }
  ok('§7.1 (a): switch OFF (default) — the panel rendered something real (not a stalled/empty read)',
    typeof offHTML === 'string' && offHTML.length > 200, String(offHTML?.length ?? 'null'));

  // (b) the round trip.
  await setExperimentFlag(app, true);
  await freshProsePage(app, 1280, 900); // remount picks up the flag from localStorage
  await openTutor(app);
  const onHTML = await panelOuterHTML(app);
  ok('§7.1 (b) sanity: switch ON — the tab bar DOES mount (so the OFF absence above is a real gate, not a dead prop)',
    typeof onHTML === 'string' && onHTML.includes('wz-tutor-tabs') && onHTML.includes('wz-linked-rail'), String(onHTML?.length ?? 'null'));

  await setExperimentFlag(app, false);
  await freshProsePage(app, 1280, 900);
  await openTutor(app);
  const offAgainHTML = await panelOuterHTML(app);
  ok('§7.1 (b): switch OFF again, after having been ON once this session — byte-identical to the first OFF read (a-round-trip-is-a-no-op)',
    offAgainHTML === offHTML, JSON.stringify({ same: offAgainHTML === offHTML, offLen: offHTML?.length, offAgainLen: offAgainHTML?.length }));

  // ==========================================================================
  // §7 check 5 (PARTIAL) — the resting list: sort, group-by-tag, remove/
  // unlink. NOT covered here (see this file's own header): the SELECTED
  // state and the popup half of OPEN.
  // ==========================================================================
  await seedLinkedFixture(app);
  await openLinkedTab(app);

  // (a) default sort is recency, most-recently-connected first.
  const recencyRows = await railRows(app);
  const wantRecency = [
    { kind: 'Note', label: 'A bare note' },
    { kind: 'Card', label: 'A Card' },
    { kind: 'Board', label: 'A Linked Board' },
    { kind: 'Page', label: 'A Source Page' },
  ];
  ok('§7.5 (a): the resting list, default sort (recency) — 4 rows, most-recently-connected first',
    JSON.stringify(recencyRows) === JSON.stringify(wantRecency), JSON.stringify(recencyRows));

  // (b) kind sort — real hit-tested press, item 151's own instrument (not
  // `.click()`, which cannot see whether a control is genuinely reachable).
  const pressedKind = await trustedDispatch(app, "document.querySelector('#wz-linked-sort-kind')", 'Linked rail: Kind sort tab', { report: ok });
  if (pressedKind) {
    await sleep(150);
    const kindRows = await railRows(app);
    ok("§7.5 (b): kind sort — Page, Board, Card, Note (store/linkedRail.ts's own KIND_ORDER)",
      JSON.stringify(kindRows.map(r => r.kind)) === JSON.stringify(['Page', 'Board', 'Card', 'Note']), JSON.stringify(kindRows));
  }

  // (c) THE GROUPING LAW, a third time: by tag GROUPS, an item with N tags
  // appears under N groups; an item with none (the card, the note) appears
  // in none.
  const pressedTag = await trustedDispatch(app, "document.querySelector('#wz-linked-sort-tag')", 'Linked rail: Tag sort tab', { report: ok });
  if (pressedTag) {
    await sleep(150);
    const tagGroups = await app.evalJs(`Array.from(document.querySelectorAll('.wz-linked-rail .wz-tutor-section')).map(sec => ({
      tag: sec.querySelector('.wz-tutor-h')?.textContent ?? null,
      labels: Array.from(sec.querySelectorAll('.wz-linked-rail-item-label')).map(el => el.textContent),
    }))`);
    const wantGroups = [
      { tag: 'characters', labels: ['A Source Page'] },
      { tag: 'plot', labels: ['A Linked Board'] },
      { tag: 'research', labels: ['A Source Page'] },
    ];
    ok('§7.5 (c): the grouping law — three tag groups, alphabetical, the card and the note in NEITHER (Box carries no tags; a bare note has none)',
      JSON.stringify(tagGroups) === JSON.stringify(wantGroups), JSON.stringify(tagGroups));
  }

  // (d) remove = unlink (§5's own wording law: the control says which of
  // the two it does), and it's a REAL write — survives a reload, not an
  // optimistic-only UI removal.
  await trustedDispatch(app, "document.querySelector('#wz-linked-sort-recency')", 'Linked rail: back to recency sort', { report: ok });
  await sleep(150);
  const removePressed = await trustedDispatch(app, "document.querySelector('[aria-label=\"Remove this link — A bare note\"]')", 'Linked rail: remove the note link', { report: ok });
  if (removePressed) {
    await sleep(150);
    const afterRemove = await railRows(app);
    ok('§7.5 (d): remove — the row is gone immediately, 3 remain',
      afterRemove.length === 3 && !afterRemove.some(r => r.label === 'A bare note'), JSON.stringify(afterRemove));

    await app.reload();
    await app.evalJs("location.hash = '#/page/exp1-page'");
    await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'exp1 page re-framed after unlink' });
    await sleep(300);
    await openLinkedTab(app);
    const afterReload = await railRows(app);
    ok('§7.5 (d): remove is a real write — the row stays gone after a reload, not an optimistic-only removal',
      afterReload.length === 3 && !afterReload.some(r => r.label === 'A bare note'), JSON.stringify(afterReload));

    // The anchor and the target both survive unlink — Nick's word ("Remove
    // unlinks and never deletes"). The anchor still lives in pageLinks.anchors
    // (soft-deleted links only ever touch `links`, never `anchors`), and the
    // target page is untouched (still readable, unaffected).
    const survivors = await app.evalJs(`(() => {
      const raw = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      const page = raw.find(e => e.id === 'exp1-page');
      const target = raw.find(e => e.id === 'exp1-target-page');
      return {
        anchorA2Present: !!page?.pageLinks?.anchors?.some(a => a.id === 'a2' && !a.deletedAt),
        linkNoteSoftDeleted: !!page?.pageLinks?.links?.find(l => l.id === 'link-note')?.deletedAt,
        targetUntouched: !!target && target.text === 'A Source Page\\nsome body text',
      };
    })()`);
    ok("§7.5 (d): unlink is soft — the link is marked deletedAt, its anchor survives, and the target's own row is untouched",
      survivors.anchorA2Present && survivors.linkNoteSoftDeleted && survivors.targetUntouched, JSON.stringify(survivors));
  }

  // (e) the honest empty state — a page with no links at all shows the
  // waiting text, not an empty list that looks finished.
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'exp1-empty-page', text: 'Nothing linked here.', createdAt: now, origin: null });
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/exp1-empty-page'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'exp1 empty page framed' });
  await sleep(300);
  await openLinkedTab(app);
  const emptyText = await app.evalJs("document.querySelector('.wz-linked-rail .wz-tutor-empty')?.textContent ?? null");
  ok("§7.5 (e): a page with no links shows the honest waiting state ('Nothing linked yet.'), not a fabricated empty list",
    emptyText === 'Nothing linked yet.', String(emptyText));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// None. This file is new; it falsifies no prior assertion. Emitted anyway
// per this lane's own standing law: park COUNT, not green.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nEXP1 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, nothing parked in this file`);
}

const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nEXP1 VERIFY: PASS (${allChecks.length} checks) — PARTIAL FILE, §7 check 1 only (see header)` : `\nEXP1 VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
