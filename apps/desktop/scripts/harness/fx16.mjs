// FX16 — the Invite, Truly Silent (docs/wrizo-alpha/p2-wave.md §FX16; item 72).
// Committed CDP scenario. Closes the hole FX15 left: fx15.mjs proved the invite silent on
// a CLEAN profile; SV18 found it still rendered on EXISTING devices, where a value stored
// 'on' by the pre-FX15 build (a tap of F6's then-default-shown "invite a first line?"
// affordance, since retired by FX15) overrode FX15's new silent default. FX16's one-time,
// marker-guarded migration (useFirstLineInvite.migrateInvitePref) retires that stale 'on'.
// This harness proves the escaped case and the migration's guards:
//   1. THE ESCAPED CASE — a profile carrying the legacy 'on' (no migration marker) renders
//      NO invite after load; the migration clears the stale value and sets the marker.
//   2. A DELIBERATE opt-in SURVIVES — 'on' WITH the marker (a post-migration opt-in) still
//      shows the prompt; the migration is one-time, never a silent overwrite.
//   3. 'never' (an explicit withdrawal) is left alone.
//   4. A fresh profile stays silent — the migration is a no-op on it (FX15 for new users).
// Run: node apps/desktop/scripts/harness/fx16.mjs  (from apps/desktop, dist-web built).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - Case 2/3's own parks (below, next to
// their successors, reusing the same run's data rather than a second pass).
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

// Seed an empty loose page + a specific invite localStorage state (pref, optional marker),
// from the Desk (the seeding law), then reload so the hook migrates + reads at mount.
const openWithInviteState = async (app, id, { pref, marker }) => {
  await freshDesk(app, 1400, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: '', projectId: null, origin: 'loose', createdAt: now });
    ${pref != null ? `localStorage.setItem(${JSON.stringify(PREF_KEY)}, ${JSON.stringify(pref)});` : `localStorage.removeItem(${JSON.stringify(PREF_KEY)});`}
    ${marker ? `localStorage.setItem(${JSON.stringify(MIGRATED_KEY)}, '1');` : `localStorage.removeItem(${JSON.stringify(MIGRATED_KEY)});`}
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
// RUNS (useFirstLineInvite.tsx's currentUser subscription) can consume the bare key into -
// relevant only to Case 2/3 below, which seed a NON-null bare value; Case 1/4 seed null/cleared
// values that stay null either way, so they are untouched.
const inviteState = (app) => app.evalJs(`(() => ({
  prompt: !!document.querySelector('.fl-prompt'),
  invite: !!document.querySelector('.fl-invite'),
  placeholder: document.querySelector('.fo-placeholder')?.textContent ?? null,
  pref: localStorage.getItem(${JSON.stringify(PREF_KEY)}),
  prefAtKey: localStorage.getItem(window.wrizoFirstLineInvite.prefKey()),
  marker: localStorage.getItem(${JSON.stringify(MIGRATED_KEY)}),
}))()`);

await withHarness(async (app) => {
  // ── Case 1 — THE ESCAPED CASE: legacy 'on' (no marker) → migration → no invite ──
  {
    await openWithInviteState(app, 'fx16-legacy-on', { pref: 'on', marker: false });
    const s = await inviteState(app);
    ok('S3 (the escaped case, the whole ticket): a profile carrying the legacy invite value ("on", no migration marker) renders NO invite after load — the one-time migration retires the stale value so the new silent default governs',
      s.prompt === false && s.invite === false, JSON.stringify(s));
    ok('S2/S3: the migration retired the stale "on" (pref cleared → default off) AND set the marker so it runs exactly once',
      s.pref === null && s.marker === '1', JSON.stringify(s));
  }

  // ── Case 2 — a DELIBERATE opt-in survives: 'on' + marker → prompt shows ─────────
  {
    await openWithInviteState(app, 'fx16-optin', { pref: 'on', marker: true });
    const s = await inviteState(app);
    // SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - SUPERSEDED. ORIGINAL, quoted verbatim
    // (parked below, HARNESS_PARKED=1): `s.pref` reads the BARE key directly, which this
    // ticket's own migration fix can now legitimately consume (moving a non-null bare value to
    // a signed-in account's own scoped key - previously dormant, since readPref() only ever ran
    // once, always before auth could resolve; the currentUser subscription this review added
    // makes it run again once the real account is known). Successor reads prefAtKey instead.
    //
    //   ok('S2: a deliberate opt-in made under FX15/FX16 ("on" WITH the migration marker) SURVIVES — the migration is one-time and never a silent overwrite; the prompt still shows and the pref stays "on"',
    //     s.prompt === true && s.pref === 'on' && s.marker === '1', JSON.stringify(s));
    ok('S2 [successor]: a deliberate opt-in made under FX15/FX16 ("on" WITH the migration marker) SURVIVES — the migration is one-time and never a silent overwrite; the prompt still shows and the pref (at its currently-effective key) stays "on"',
      s.prompt === true && s.prefAtKey === 'on' && s.marker === '1', JSON.stringify(s));
    if (process.env.HARNESS_PARKED === '1') {
      pok('PARKED (was "S2: a deliberate opt-in... pref stays on" via the bare key) - the value ALWAYS survives correctly (prefAtKey is "on"); the bare key is either ALSO "on" (signed out) or consumed to null (signed in - the one-time move took it to that account\'s own scoped key)',
        s.prompt === true && s.prefAtKey === 'on' && s.marker === '1' && (s.pref === 'on' || s.pref === null), JSON.stringify(s));
    }
  }

  // ── Case 3 — 'never' (an explicit withdrawal) is left alone ─────────────────────
  {
    await openWithInviteState(app, 'fx16-never', { pref: 'never', marker: false });
    const s = await inviteState(app);
    // SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - SUPERSEDED, same reasoning as Case 2
    // above. ORIGINAL, quoted verbatim (parked below):
    //
    //   ok('S2: an explicit withdrawal ("never") survives the migration untouched — no invite, and the pref stays "never" (the migration marks itself run but never rewrites a deliberate withdrawal)',
    //     s.prompt === false && s.invite === false && s.pref === 'never' && s.marker === '1', JSON.stringify(s));
    ok('S2 [successor]: an explicit withdrawal ("never") survives the migration untouched — no invite, and the pref (at its currently-effective key) stays "never" (the migration marks itself run but never rewrites a deliberate withdrawal)',
      s.prompt === false && s.invite === false && s.prefAtKey === 'never' && s.marker === '1', JSON.stringify(s));
    if (process.env.HARNESS_PARKED === '1') {
      pok('PARKED (was "S2: an explicit withdrawal... pref stays never" via the bare key) - the value ALWAYS survives correctly (prefAtKey is "never"); the bare key is either ALSO "never" (signed out) or consumed to null (signed in - moved to that account\'s own scoped key)',
        s.prompt === false && s.invite === false && s.prefAtKey === 'never' && s.marker === '1' && (s.pref === 'never' || s.pref === null), JSON.stringify(s));
    }
  }

  // ── Case 4 — a fresh profile: migration is a no-op, page stays silent ───────────
  {
    await openWithInviteState(app, 'fx16-fresh', { pref: null, marker: false });
    const s = await inviteState(app);
    ok('S1 (regression): a fresh profile (no stored value) stays silent — the migration is a no-op on it (nothing to retire), only marking itself run; FX15 for new users is unchanged',
      s.prompt === false && s.invite === false && s.pref === null && s.marker === '1', JSON.stringify(s));
    ok('SV31: the empty page renders NO placeholder text at all — .fo-placeholder is absent (the "Write…" placeholder is removed; the caret + the beginnings row are sufficient)',
      s.placeholder === null, JSON.stringify(s));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// fx15.mjs's on-seed gains the migration marker (a FIXTURE re-point, disclosed in the FX16
// commit — the opt-in-rail ASSERTIONS there are unchanged), not an A4 park of an assertion.
// SPROUT-INVITE-SCOPE (Fable's review, ledger 124) added FX16's own FIRST real parks (Case 2/3,
// collected via pok() near the top of this file, run inline inside the withHarness scenario).
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX16 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; the bare-key reads retired by SPROUT-INVITE-SCOPE re-assert their new, opposite truth.`
    : `\nFX16 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX16 VERIFY: PASS (${checks.length} checks)` : `\nFX16 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
