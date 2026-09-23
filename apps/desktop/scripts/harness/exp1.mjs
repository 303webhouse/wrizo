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
// THIS FILE IS BUILT PARTIAL, ON PURPOSE, NOT SILENTLY: only §7 check 1
// (switch OFF = v1) is buildable today. Checks 2-7 depend on machinery this
// lane does not own and that does not exist on this branch yet —
// `store/anchors.ts` (PW writes it; §8's own hazard note: "if B needs a
// write, it asks A for a function rather than reaching past the seam" —
// reading past an absent one is the same hazard, so this file does not
// import or mock it), the right-click menu, and the left strip's three
// acts (all PW's side). Extending this file to cover them is PW's own
// commit or a later one once `store/anchors.ts` lands — recorded here so a
// reader of a thin exp1.mjs knows it is incomplete BY DESIGN, not by
// oversight (this project's own park-count law: state what's missing,
// never let a short file read as a finished one).
import { withHarness } from '../runtime-verify.mjs';

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
