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
// SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - E4's own park (below, next to its
// successors, reusing the same run's data rather than a second pass).
const parkedChecks = [];
const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });

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

// SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - prefAtKey is the CURRENTLY-EFFECTIVE key,
// through the hook's own test seam: signed out it equals the bare "pref" field above; signed in
// it is that account's own scoped key, which the migration this ticket's own fix now actually
// RUNS (see useFirstLineInvite.tsx's currentUser subscription) can consume the bare key into -
// so "pref" alone can no longer be trusted once an account is signed in.
const doorState = (app) => app.evalJs(`(() => ({
  sproutDoor: !!document.querySelector('[data-beginning="sprout"]'),
  invitePrompt: !!document.querySelector('.fl-prompt'),
  pref: localStorage.getItem(${JSON.stringify(PREF_KEY)}),
  prefAtKey: localStorage.getItem(window.wrizoFirstLineInvite.prefKey()),
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
  //
  // SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - SUPERSEDED. All three checks below
  // originally read `.pref` (the bare key) directly; each is parked verbatim just beneath its
  // successor (HARNESS_PARKED=1), which reads `.prefAtKey` (the hook's own test seam) instead.
  // This ticket's OWN fix is what makes the bare key unreliable here: the currentUser
  // subscription (added this same review round, useFirstLineInvite.tsx) makes the one-time
  // bare-key -> scoped-key migration actually FIRE once a real account is signed in - where
  // before it could never fire at all (readPref() only ever ran once, always before auth could
  // resolve) - so a signed-in device's bare key can now be legitimately consumed mid-scenario.
  {
    await openWithPref(app, 'sprout-click', 'off');
    const before = await doorState(app);
    // ORIGINAL: ok('E4: starts with Sprout present, pref "off"', before.sproutDoor === true && before.pref === 'off', JSON.stringify(before));
    ok('E4 [successor]: starts with Sprout present, pref "off" (at its currently-effective key)', before.sproutDoor === true && before.prefAtKey === 'off', JSON.stringify(before));
    if (process.env.HARNESS_PARKED === '1') {
      pok('PARKED (was "E4: starts with Sprout present, pref off" via the bare key) - the bare key is either ALSO "off" (signed out) or absent/unmigrated yet (signed in, nothing has written there yet)',
        before.sproutDoor === true && (before.pref === 'off' || before.pref == null), JSON.stringify(before));
    }

    await app.evalJs(`document.querySelector('[data-beginning="sprout"]').click()`);
    await sleep(200);
    const afterClick = await doorState(app);
    // ORIGINAL: ok('E4: clicking Sprout shows the live prompt immediately and persists "on"', afterClick.invitePrompt === true && afterClick.pref === 'on', JSON.stringify(afterClick));
    ok('E4 [successor]: clicking Sprout shows the live prompt immediately and persists "on" (at its currently-effective key)',
      afterClick.invitePrompt === true && afterClick.prefAtKey === 'on', JSON.stringify(afterClick));
    if (process.env.HARNESS_PARKED === '1') {
      // Fable's review (ledger 124): "accept null as 'nothing to migrate'" - a signed-in
      // session can have the bare key already consumed by migrateToScopedKey (readPref()'s own
      // subscription-triggered re-run, SOMETIME before this read) BEFORE this click even fires,
      // same reasoning as pok #1 above. Still narrow: 'never'/anything else stays rejected, so a
      // genuinely stuck, unmigrated-but-present value cannot slip through (proven by a mutant,
      // not just asserted - see sprout-invite-scope-logic.mjs's own S9).
      pok('PARKED (was "E4: clicking Sprout... persists on" via the bare key) - the write ALWAYS lands correctly (prefAtKey is "on"); the bare key is either ALSO "on" (signed out), still its PRE-click "off" (signed in, not yet migrated), or already consumed to null (signed in, migrated already)',
        afterClick.invitePrompt === true && afterClick.prefAtKey === 'on' && (afterClick.pref === 'on' || afterClick.pref === 'off' || afterClick.pref == null), JSON.stringify(afterClick));
    }

    await openWithPref(app, 'sprout-click-2', undefined, { clear: false }); // a SECOND blank page, SAME device, no wipe — pref left exactly as E4's click set it
    const second = await doorState(app);
    // ORIGINAL: ok('E4: a second fresh blank page after the click shows NO Sprout door (decided) and the live prompt instead', second.sproutDoor === false && second.invitePrompt === true && second.pref === 'on', JSON.stringify(second));
    ok('E4 [successor]: a second fresh blank page after the click shows NO Sprout door (decided) and the live prompt instead (at its currently-effective key)',
      second.sproutDoor === false && second.invitePrompt === true && second.prefAtKey === 'on', JSON.stringify(second));
    if (process.env.HARNESS_PARKED === '1') {
      pok('PARKED (was "E4: a second fresh page... pref on" via the bare key) - the decision ALWAYS persists correctly (prefAtKey is "on") and the door/prompt state agree; the bare key itself no longer governs this once signed in, so it is not re-asserted here',
        second.sproutDoor === false && second.invitePrompt === true && second.prefAtKey === 'on', JSON.stringify(second));
    }
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - E4's own first parks (collected via pok(),
// declared near the top of this file, run inline inside the SAME withHarness scenario above).
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nSPROUT-INVITE-SCOPE PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; E4's bare-key reads retired by this same ticket's own migration fix re-assert their new, opposite truth.`
    : `\nSPROUT-INVITE-SCOPE PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nSPROUT-INVITE-SCOPE VERIFY: PASS (${checks.length} checks)` : `\nSPROUT-INVITE-SCOPE VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
