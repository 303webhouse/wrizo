// HB1 — the Threshold (docs/wrizo-alpha/hb1-threshold-brief.md). A committed
// CDP verification scenario (AGENTS.md "harness scenarios persist"), modeled
// on fx1.mjs/cd1.mjs.
// Run: node apps/desktop/scripts/harness/hb1.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 100 whitespace-delimited words (F1's instrument). Short, distinct tokens —
// nothing about their content matters, only the count.
const words = (n) => Array.from({ length: n }, (_, i) => `w${i + 1}`).join(' ');

const freshArrival = async (app, { anon = false } = {}) => {
  process.env.WS_ANON = anon ? '1' : '0';
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival before fixture' });
  await app.emulateDpr(1, 1400, 900);
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — cold boot renders Arrival with both doors in correct states.
  // ==========================================================================
  await freshArrival(app, { anon: true });
  const doors = await app.evalJs(`({
    hasMark: !!document.querySelector('.wz-arrival img.wz-logo'),
    write: !!document.querySelector('.wz-arrival-write'),
    open: !!document.querySelector('.wz-arrival-open'),
    writeDisabled: document.querySelector('.wz-arrival-write')?.disabled,
    openDisabled: document.querySelector('.wz-arrival-open')?.disabled,
    noDesk: !document.querySelector('.wz-desk'),
  })`);
  ok('S1: cold boot renders Arrival with the mark and both doors present',
    doors.hasMark && doors.write && doors.open, JSON.stringify(doors));
  ok('S1: once ready, neither door is disabled', doors.writeDisabled === false && doors.openDisabled === false, JSON.stringify(doors));
  ok('flow §6 (fixture check): the Desk room never renders at \'/\' — this file\'s own naming convention, not a live selector', doors.noDesk, JSON.stringify(doors));

  // ==========================================================================
  // F2 — Open, anon: routes to the existing sign-in (never a login wall on
  // Write; Open is the one door that can ask for credentials).
  // ==========================================================================
  await app.click('Open');
  await sleep(150);
  const signinShown = await app.evalJs("document.body.innerText.includes('Welcome back')");
  ok('F2: Open, anon (no local session) — reaches the existing sign-in, not a wall on the whole app', signinShown);
  await app.evalJs("[...document.querySelectorAll('.wz-link')].find(el => el.textContent.includes('back'))?.click()");
  await sleep(150);

  // ==========================================================================
  // S2/S3 — first-run Write: forced defaults + the veil mounts, inert.
  // ==========================================================================
  await app.click('Write');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed, first run' });
  await sleep(300);

  const forced = await app.evalJs(`({
    forwardLock: localStorage.getItem('wrizo-forward-lock'),
    typewriter: JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}').typewriter,
    typewriterLive: document.querySelector('.mode-scroll')?.dataset.typewriter,
    modeActive: document.querySelector('.desk-mode-tab.active')?.textContent,
    origin: (() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = es.find(x => !x.deletedAt); return e && e.origin; })(),
  })`);
  ok('S2: first-run Write forces forward-lock ON', forced.forwardLock === '1', JSON.stringify(forced));
  ok('S2: first-run Write forces typewriter ON (store + live data-typewriter)',
    forced.typewriter === true && forced.typewriterLive === 'true', JSON.stringify(forced));
  ok('S2: first-run Write forces Free Write mode', forced.modeActive === 'Free Write', JSON.stringify(forced));
  ok('flow §2: the created page is origin \'loose\' (the home-base door)', forced.origin === 'loose', JSON.stringify(forced));

  const veil = await app.evalJs(`(() => {
    const veils = [...document.querySelectorAll('.hb1-veil')];
    return {
      count: veils.length,
      allInert: veils.every(v => v.hasAttribute('inert')),
      allAriaHidden: veils.every(v => v.getAttribute('aria-hidden') === 'true'),
      allDataVeiled: veils.every(v => v.dataset.veiled === 'true'),
      bannerPresent: !!document.querySelector('.hb1-gate-banner'),
      instruction: document.querySelector('.hb1-gate-instruction')?.textContent,
    };
  })()`);
  ok('S3: the veil wraps the top chrome row, the Drawer, the Sliver, the reveal handle, and the settings gear — all inert',
    veil.count >= 5 && veil.allInert, JSON.stringify(veil));
  ok('S3: every veiled element is aria-hidden and carries data-veiled=true', veil.allAriaHidden && veil.allDataVeiled, JSON.stringify(veil));
  ok('S3: the gate’s one sanctioned instruction is visible, naming the 100-word threshold',
    veil.bannerPresent && /100 words/.test(veil.instruction || ''), JSON.stringify(veil));

  // Defense in depth (the review's own lesson — a veil-count assertion alone
  // missed ModeStage's own chrome the first time): walk every button/link/
  // role=button on the page and confirm each one is either inside an
  // [inert] ancestor or is the editor's own placeholder-less body — i.e.
  // "AT must perceive exactly one path" holds structurally, not just by
  // counting known wrapper nodes.
  const escapees = await app.evalJs(`(() => {
    const all = [...document.querySelectorAll('button, a, [role=button]')];
    return all.filter(el => !el.closest('[inert]')).map(el => el.className || el.tagName);
  })()`);
  ok('S3: no focusable control escapes the veil — every button/link outside the editor is inside an inert ancestor',
    escapees.length === 0, JSON.stringify(escapees));

  // The editor itself stays fully interactive under the veil (only chrome is
  // wrapped) — proven by actually typing into it below, not asserted here in
  // isolation.
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");

  // ==========================================================================
  // S3 — word 99: no ceremony yet. Word 100: the ceremony mounts.
  // ==========================================================================
  await app.typeKeys(words(99) + ' ');
  await sleep(200);
  const at99 = await app.evalJs(`({
    ceremony: !!document.querySelector('.hb1-ceremony'),
    fill: document.querySelector('.hb1-gate-trackfill')?.style.width,
  })`);
  ok('S3: at 99 words, no ceremony yet', at99.ceremony === false, JSON.stringify(at99));

  await app.typeKeys('w100');
  await sleep(300);
  const at100 = await app.evalJs(`({
    ceremony: !!document.querySelector('.hb1-ceremony'),
    offered: [...document.querySelectorAll('.hb1-territory-offered')].map(b => b.textContent),
    future: [...document.querySelectorAll('.hb1-territory-future')].map(b => b.textContent),
  })`);
  ok('S3→S4: crossing 100 words mounts the unlock ceremony', at100.ceremony === true, JSON.stringify(at100));
  ok('R1: the ceremony offers Plateau and Flux (Flux stands in for Machina, for now)',
    JSON.stringify(at100.offered) === JSON.stringify(['Plateau', 'Flux']), JSON.stringify(at100));
  ok('R1: Machina, Nomad, Volant are shown grayed as future territories, in that order',
    JSON.stringify(at100.future) === JSON.stringify(['Machina', 'Nomad', 'Volant']), JSON.stringify(at100));

  // ==========================================================================
  // S4 — choosing a territory applies the theme, then the veil lifts.
  // ==========================================================================
  await app.evalJs("[...document.querySelectorAll('.hb1-territory-offered')].find(b => b.textContent === 'Flux').click()");
  await app.waitFor("!document.querySelector('.hb1-ceremony')", { label: 'ceremony closes', timeout: 3000 });
  await sleep(200);
  const afterChoice = await app.evalJs(`({
    dataTheme: document.documentElement.getAttribute('data-theme'),
    storedTheme: localStorage.getItem('wrizo-theme'),
    firstRunComplete: localStorage.getItem('wrizo-first-run-complete'),
    veilCount: document.querySelectorAll(".hb1-veil[data-veiled='true']").length,
    bannerGone: !document.querySelector('.hb1-gate-banner'),
  })`);
  ok('S4/S5: choosing Flux applies the theme (data-theme + persisted)',
    afterChoice.dataTheme === 'flux' && afterChoice.storedTheme === 'flux', JSON.stringify(afterChoice));
  ok('S4: firstRunComplete is set once the veil lifts', afterChoice.firstRunComplete === '1', JSON.stringify(afterChoice));
  ok('S4: the veil actually lifts — no element is still data-veiled=true, the gate banner is gone',
    afterChoice.veilCount === 0 && afterChoice.bannerGone, JSON.stringify(afterChoice));

  const chromeLive = await app.evalJs("(() => { const btn = [...document.querySelectorAll('.sprint-actions button')].find(b => b.textContent === 'Done'); return !!btn && !btn.closest('[inert]'); })()");
  ok('S4: post-unlock chrome (Done) is reachable again — not still wrapped in an inert ancestor', chromeLive);

  // ==========================================================================
  // F3 — the rite runs once per device: a later boot shows Arrival (it is
  // the boot) with no veil and no gate, even on a fresh Write.
  // ==========================================================================
  // A genuine second boot: back to '/' first (reload() alone reloads the
  // CURRENT route, which would still be /page/:id here), then reload —
  // localStorage is NOT cleared, so firstRunComplete persists across it.
  await app.goto('/');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival on second boot' });
  const secondBootDoors = await app.evalJs("({ write: !!document.querySelector('.wz-arrival-write'), open: !!document.querySelector('.wz-arrival-open') })");
  ok('F3: a second boot still renders Arrival — both doors live, it is the boot', secondBootDoors.write && secondBootDoors.open, JSON.stringify(secondBootDoors));

  await app.click('Write');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, second write' });
  await sleep(300);
  const secondWriteGate = await app.evalJs("({ veil: document.querySelectorAll('.hb1-veil[data-veiled=\\'true\\']').length, banner: !!document.querySelector('.hb1-gate-banner') })");
  ok('F3: Write after first-run completion carries no veil and no gate', secondWriteGate.veil === 0 && secondWriteGate.banner === false, JSON.stringify(secondWriteGate));

  return checks;
});

// ==========================================================================
// F4 — sub-1100px: no rite. Legacy stays byte-identical; Write still forces
// the session defaults (width-independent), but no veil/gate/ceremony ever
// mounts there, even on a genuinely first-ever write.
// ==========================================================================
await withHarness(async (app) => {
  await freshArrival(app, { anon: false });
  await app.emulateDpr(1, 800, 900); // below DESKFRAME_MIN_WIDTH (1100)
  await sleep(200); // let useDeskFrameViewport's matchMedia listener settle before interacting
  await app.click('Write');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, legacy' });
  await sleep(300);
  const legacy = await app.evalJs(`({
    framedHost: !!document.querySelector('.desk-frame-host'),
    legacyPage: !!document.querySelector('.page'),
    veil: document.querySelectorAll('.hb1-veil').length,
    banner: !!document.querySelector('.hb1-gate-banner'),
    ceremony: !!document.querySelector('.hb1-ceremony'),
    forwardLock: localStorage.getItem('wrizo-forward-lock'),
  })`);
  ok('F4: below 1100px, the legacy (unframed) branch renders — no DeskFrame host',
    legacy.framedHost === false && legacy.legacyPage === true, JSON.stringify(legacy));
  ok('F4: no rite at all below the gate — no veil, no banner, no ceremony, even on an un-completed first run',
    legacy.veil === 0 && legacy.banner === false && legacy.ceremony === false, JSON.stringify(legacy));
  ok('S2: forced defaults are width-independent — forward lock is still ON here', legacy.forwardLock === '1', JSON.stringify(legacy));

  // F4/D2 — since no ceremony exists below the gate to ever complete the
  // rite, Arrival flips firstRunComplete itself on a sub-1100px Write (see
  // components/Arrival.tsx's handleWrite) so a SECOND write doesn't keep
  // re-forcing the writer's own later preference changes back on.
  const completeAfterFirst = await app.evalJs("localStorage.getItem('wrizo-first-run-complete')");
  ok('F4/D2: a sub-1100px Write completes the rite itself (no ceremony exists to do it)', completeAfterFirst === '1', completeAfterFirst);

  await app.evalJs("localStorage.setItem('wrizo-forward-lock', '0')"); // the writer turns it off, deliberately
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival, second sub-1100px write' });
  await app.click('Write');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, legacy, second write' });
  await sleep(300);
  const forwardLockAfterSecond = await app.evalJs("localStorage.getItem('wrizo-forward-lock')");
  ok('F4/D2: a second sub-1100px Write does NOT re-force forward lock back on — the writer\'s own change sticks',
    forwardLockAfterSecond === '0', forwardLockAfterSecond);

  return checks;
});

// ==========================================================================
// F2 — Open, authed with a resume target: lands on it directly (no sign-in,
// no Desk-shaped intermediate stop).
// ==========================================================================
await withHarness(async (app) => {
  await freshArrival(app, { anon: false });
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = [{ id: 'hb1-resume', text: 'Already underway.', projectId: null, origin: 'loose', createdAt: now, updatedAt: now }];
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival, seeded resume target' });
  await app.click('Open');
  // A seeded loose entry with no pageType resumes into JournalEntry.tsx,
  // same as the pre-existing resume-routing rule (getResumeTarget: pageType
  // != null -> /page/:id, else -> /journal/:id) — untouched by this ticket,
  // just exercised through Open now instead of the Desk's own ReturnCard.
  await app.waitFor("location.hash === '#/journal/hb1-resume'", { label: 'Open lands on the resume target' });
  await sleep(200);
  const landed = await app.evalJs("location.hash");
  ok('F2/S5: Open, authed with a resume target — lands directly on it (the Desk’s resume pointer, rehomed)',
    landed === '#/journal/hb1-resume', landed);
  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nHB1 VERIFY: PASS (${checks.length} checks)` : `\nHB1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
