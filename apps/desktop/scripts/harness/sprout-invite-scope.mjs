// SPROUT-INVITE-SCOPE, THE DOOR HALF (page-readiness survey item 1, Oct 21). Committed CDP
// scenario, modeled on fx16.mjs's own seeding/reload technique. Needs a box-turn grant (Chat
// 1's) to run — this lane wrote it browserless-only and could not execute it itself.
//
// THE REDUNDANCY THIS CLOSES: `beginningsVisible` (PageEditor.tsx) never consulted the invite's
// own pref — once a writer had ever opted in (Sprout clicked once), EVERY later blank Journal
// page showed BOTH the live first-line-invite prompt AND the Sprout door at once, offering to
// "turn on" something already on. The fix: the Sprout door now reads `invite.canOffer`
// (true only while the pref is still 'off') and stops rendering once there is nothing left to
// decide — not a new completion flag on BG1's row (which stays exactly as stateless as Nick's
// Oct 8 ruling made it; an empty doors array already renders nothing, BeginningsRow.tsx:126).
//
// What is proven, on a signed-out (local-first) page — the invite's own pref is already
// device-scoped in that mode before and after this ticket, so no account machinery is needed to
// see the door behavior:
//   E1 pref 'off' (the default): the Sprout door IS present; the live invite prompt is NOT
//      (nothing decided yet — Sprout is the only offer)
//   E2 pref 'on' (opted in): the Sprout door is ABSENT; the live invite prompt IS showing — the
//      exact redundancy this ticket closes (before this fix, BOTH would show)
//   E3 pref 'never' (declined): the Sprout door is ABSENT; the live invite prompt is NOT
//      (withdrawn means nothing shows, not "offer it again")
//   E4 (regression, the real user path): a fresh blank page shows Sprout; clicking it shows the
//      live prompt immediately AND persists 'on'; a SECOND fresh blank page (reload) then shows
//      no Sprout door, only the live prompt — the door never reappears once decided
// Run: node apps/desktop/scripts/harness/sprout-invite-scope.mjs  (from apps/desktop, dist-web built).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PREF_KEY = 'wrizo-first-line-invite';
const MIGRATED_KEY = 'wrizo-first-line-invite-migrated';

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// Seed an empty loose page + a specific invite pref (signed out, so the pref's own key is the
// bare device-wide one both before and after this ticket), from the Desk (the seeding law).
// `pref` is the value to FORCE ('off'/'on'/'never'), or `undefined` to leave whatever the device
// already holds untouched (E4's second page — proving the door's decision survives a fresh page
// without anything re-seeding it). `clear` skips the storage wipe for that same reason.
const openWithPref = async (app, id, pref, { clear = true } = {}) => {
  await (clear ? freshDesk(app, 1400, 900) : app.goto('/'));
  if (clear) { /* freshDesk already reloaded to the Desk */ } else {
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk (no wipe)' });
  }
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: '', projectId: null, origin: 'loose', createdAt: now });
    localStorage.setItem(${JSON.stringify(MIGRATED_KEY)}, '1');
    ${pref !== undefined ? `localStorage.setItem(${JSON.stringify(PREF_KEY)}, ${JSON.stringify(pref)});` : ''}
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after invite-state seed' });
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(id)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `THE Page mounted (${id})` });
  await sleep(300);
};

const doorState = (app) => app.evalJs(`(() => ({
  sproutDoor: !!document.querySelector('[data-beginning="sprout"]'),
  invitePrompt: !!document.querySelector('.fl-prompt'),
  pref: localStorage.getItem(${JSON.stringify(PREF_KEY)}),
}))()`);

await withHarness(async (app) => {
  // ── E1 — 'off' (default): Sprout shows, the live prompt does not ───────────────────────
  {
    await openWithPref(app, 'sprout-off', 'off');
    const s = await doorState(app);
    ok('E1: pref "off" — the Sprout door IS present (nothing decided yet)', s.sproutDoor === true, JSON.stringify(s));
    ok('E1: pref "off" — the live invite prompt is NOT showing', s.invitePrompt === false, JSON.stringify(s));
  }

  // ── E2 — 'on' (opted in): Sprout is gone, the live prompt shows — THE BUG THIS CLOSES ──
  {
    await openWithPref(app, 'sprout-on', 'on');
    const s = await doorState(app);
    ok('E2 (the whole ticket): pref "on" — the Sprout door is ABSENT (stops offering what is already on)', s.sproutDoor === false, JSON.stringify(s));
    ok('E2: pref "on" — the live invite prompt IS showing (the invite itself is unaffected by this fix)', s.invitePrompt === true, JSON.stringify(s));
  }

  // ── E3 — 'never' (declined): Sprout is gone, nothing shows ──────────────────────────────
  {
    await openWithPref(app, 'sprout-never', 'never');
    const s = await doorState(app);
    ok('E3: pref "never" — the Sprout door is ABSENT (withdrawn, not re-offered)', s.sproutDoor === false, JSON.stringify(s));
    ok('E3: pref "never" — the live invite prompt is NOT showing', s.invitePrompt === false, JSON.stringify(s));
  }

  // ── E4 — the real user path: click Sprout, then a second fresh page never offers it again ─
  {
    await openWithPref(app, 'sprout-click', 'off');
    const before = await doorState(app);
    ok('E4: starts with Sprout present, pref "off"', before.sproutDoor === true && before.pref === 'off', JSON.stringify(before));
    await app.evalJs(`document.querySelector('[data-beginning="sprout"]').click()`);
    await sleep(200);
    const afterClick = await doorState(app);
    ok('E4: clicking Sprout shows the live prompt immediately and persists "on"',
      afterClick.invitePrompt === true && afterClick.pref === 'on', JSON.stringify(afterClick));

    await openWithPref(app, 'sprout-click-2', undefined, { clear: false }); // a SECOND blank page, SAME device, no wipe — pref left exactly as E4's click set it
    const second = await doorState(app);
    ok('E4: a second fresh blank page after the click shows NO Sprout door (decided) and the live prompt instead',
      second.sproutDoor === false && second.invitePrompt === true && second.pref === 'on', JSON.stringify(second));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nSPROUT-INVITE-SCOPE VERIFY: PASS (${checks.length} checks)` : `\nSPROUT-INVITE-SCOPE VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
