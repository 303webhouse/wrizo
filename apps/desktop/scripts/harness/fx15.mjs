// FX15 — the Quiet Page (docs/wrizo-alpha/p1-wave.md, the FX15 section).
// Committed CDP verification scenario. Fixtures/technique adopted verbatim from
// fx14.mjs (freshDesk / seedFromDesk) — the "don't re-derive fixtures" law.
// Run: node scripts/harness/fx15.mjs  (from apps/desktop, dist-web freshly built).
//
// Proves FX15's two verifiable claims:
//   S1 — the invite SLEEPS by default. A fresh page renders no first-line invite
//        at all (no prompt, and the retired "invite a first line?" affordance is
//        gone entirely); the page is immediately typeable, its space the writer's.
//   S2 — the opt-in path's RAILS. Simulating the on-request opt-in (the pref the
//        exposed optIn() persists — BG1's "Sprout" door is its on-request caller;
//        that end-to-end wiring is BG1's, re-run on the combined tree by whichever
//        of FX15/BG1 merges second): the prompt is DECK-DRAWN, never model-drawn
//        (a verbatim member of the local NUDGE_POOL — no send on load); it lives
//        OUTSIDE the editable surface and can never become the writer's text (no
//        accept, no tab-fill, no insertion — A13); it vanishes on the first
//        keystroke and so can never overlap typed text; and "don't offer again"
//        persists across a reload.
// (S3 — the retirement of the "New Journal Entry" door + its dead SV6 string — is
// proven by the A4 parks in b2.mjs / fx14.mjs, not here: this file adds the
// invite's first live coverage; F6 shipped un-harnessed.)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - declared here (not at the foot, where
// FX15 used to have nothing to park) so the two parks below can sit right next to the
// successors they park, inside the SAME withHarness run, reusing its own click/reload data
// rather than a second pass.
const parkedChecks = [];
const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });

const PREF_KEY = 'wrizo-first-line-invite';
// SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - the two checks below that read "the
// stored pref" AFTER a write ("don't offer again") now read it through
// `window.wrizoFirstLineInvite.prefKey()` (the hook's own test seam, evaluated IN the page)
// instead of the bare PREF_KEY: signed out it resolves to the bare key (unchanged); signed in
// it resolves to that account's own scoped key - the SAME key the write itself targets. The
// SEEDING above (and the rendering checks it feeds) is untouched: the seed and its own first
// read both land inside the same pre-auth-resolution window and so still agree on the bare
// key either way, whether or not the device is signed in.

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

// Open a fresh, EMPTY loose page (text:'') in THE Page, with the invite pref
// optionally pre-seeded ('on' simulates the state optIn() persists). Seeds from
// the Desk, then reloads so the hook reads the pref at mount.
const openFreshPage = async (app, id, pref) => {
  await freshDesk(app, 1400, 900);
  await seedFromDesk(app, `(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: '', projectId: null, origin: 'loose', createdAt: now });
    ${pref ? `localStorage.setItem(${JSON.stringify(PREF_KEY)}, ${JSON.stringify(pref)}); localStorage.setItem('wrizo-first-line-invite-migrated', '1'); /* FX16 fixture re-point: seed the migrated marker so this deliberate pref survives FX16's one-time migration (a post-migration opt-in); the opt-in-rail assertions below are unchanged */` : `localStorage.removeItem(${JSON.stringify(PREF_KEY)});`}
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after page seed' });
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(id)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `THE Page mounted (${id})` });
  await sleep(300);
};

const editorText = (app) => app.evalJs("document.querySelector('.forward-only-editor')?.textContent ?? ''");
const focusEditor = (app) => app.evalJs("document.querySelector('.forward-only-editor')?.focus()");

await withHarness(async (app) => {
  // ── S1 — the invite sleeps by default (no pref set → 'off') ─────────────────
  {
    await openFreshPage(app, 'fx15-default', null);
    const silent = await app.evalJs(`(() => ({
      invite: !!document.querySelector('.fl-invite'),
      prompt: !!document.querySelector('.fl-prompt'),
      affordance: !!document.querySelector('.fl-affordance'),
    }))()`);
    ok('S1: a fresh page renders NO first-line invite by default — no .fl-invite, no .fl-prompt, and the retired "invite a first line?" affordance (.fl-affordance) is gone entirely',
      silent.invite === false && silent.prompt === false && silent.affordance === false, JSON.stringify(silent));

    // S1 placeholder check [PARKED — FX16 SV31]: the "Write…" placeholder is REMOVED from
    // the empty page (a new page says nothing until the writer does — the caret + the
    // beginnings row suffice). FALSIFIED: the empty page now renders no placeholder text.
    // Successor: the re-pointed ok below + fx16.mjs's SV31 assertion. Original ok, verbatim:
    //   PARKED (was "S1: the empty page shows the plain \"Write…\" placeholder and nothing else — the space belongs to the writer, not an unbidden prompt")
    const placeholder = await app.evalJs("document.querySelector('.fo-placeholder')?.textContent ?? null");
    ok('S1 [FX16 SV31]: the empty page renders NO placeholder text at all — .fo-placeholder is absent (the caret + the beginnings row are sufficient)',
      placeholder === null, JSON.stringify({ placeholder }));

    // Typeable immediately: the first word lands with nothing intercepting it.
    await focusEditor(app);
    await app.typeKeys('Hello');
    await sleep(200);
    const typed = await editorText(app);
    ok('S1: the first word lands immediately on a default page — typing works with no invite to intercept or dismiss',
      typed.includes('Hello'), JSON.stringify({ typed }));
  }

  // ARCHIVED PARK (#13 step 14): archive/fx15.mjs.parked.md record 1
  {
    const J = (v) => JSON.stringify(v);
    await openFreshPage(app, 'fx15-optin', 'on');
    const look = () => app.evalJs(`(() => ({
      prompt: !!document.querySelector('.fl-prompt'), invite: !!document.querySelector('.fl-invite'), never: !!document.querySelector('.fl-never'),
      seam: typeof window.wrizoFirstLineInvite, pref: localStorage.getItem(${JSON.stringify(PREF_KEY)}),
    }))()`);
    const s0 = await look();
    ok('S2 [12f successor]: with the pref seeded "on" the empty page shows no invitation at all - no .fl-prompt, no .fl-invite, no "don\'t offer again" - and the invite seam is gone',
      !s0.prompt && !s0.invite && !s0.never && s0.seam === 'undefined', J(s0));
    await focusEditor(app);
    await app.key('Tab');
    await sleep(200);
    const afterTab = await editorText(app);
    ok('S2 [12f successor]: Tab fills nothing (there is no prompt to accept)', afterTab.replace(/\s/g, '') === '', J({ afterTab }));
    await app.typeKeys('x');
    await sleep(250);
    const typed = await editorText(app);
    ok('S2 [12f successor]: the first keystroke lands as itself and nothing else', typed.replace(/\s/g, '') === 'x', J({ typed }));
    await app.reload();
    await sleep(600);
    await app.evalJs("location.hash = '#/page/fx15-optin'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'THE Page after reload (12f)' });
    await sleep(300);
    const s = { ...(await look()), typed, afterTab, s0 };
    ok('S2 [12f successor]: after a reload still nothing shows, and the stored pref is still the seeded "on" (no code reads, writes or removes it)',
      !s.prompt && !s.invite && s.pref === 'on', J(s));
    if (process.env.HARNESS_PARKED === '1') {
      pok('PARKED (was "S2: once opted in (pref \"on\"), the invitation appears — a single quiet .fl-prompt on the empty page") — #13 12f (Fable, Nov 1): the first-line invite is deleted; re-asserted against the new truth: no prompt, even opted in', !s0.prompt, J(s));
      pok('PARKED (was "S2: the prompt is DECK-DRAWN, never model-drawn — the rendered line is a verbatim member of the local NUDGE_POOL deck (no send on page load)") — #13 12f (Fable, Nov 1): the first-line invite is deleted; there is no prompt and no deck seam to draw from', !s0.prompt && s0.seam === 'undefined', J(s));
      pok('PARKED (was "S2 (A13): the prompt is decoration OUTSIDE the editable surface — a <span>, aria-hidden, and NOT a descendant of .forward-only-editor — so it can never become the writer\'s text") — #13 12f (Fable, Nov 1): the first-line invite is deleted; there is no prompt to place anywhere', !s0.prompt, J(s));
      pok('PARKED (was "S2 (A13): pressing Tab does NOT fill the line — the editor takes no content and the prompt text is never inserted (no accept, no tab-fill)") — #13 12f (Fable, Nov 1): the first-line invite is deleted; Tab still fills nothing', afterTab.replace(/\s/g, '') === '', J(s));
      pok('PARKED (was "S2: precondition — the opted-in prompt is showing on the empty page before the keystroke") — #13 12f (Fable, Nov 1): the first-line invite is deleted; re-asserted against the new truth: no prompt before the keystroke', !s0.prompt, J(s));
      pok('PARKED (was "S2: the invitation VANISHES on the first keystroke — .fl-prompt / .fl-invite are gone the instant the writer types (and so can never overlap typed text)") — #13 12f (Fable, Nov 1): the first-line invite is deleted; there is nothing to vanish; nothing shows before or after', !s.prompt && !s.invite, J(s));
      pok('PARKED (was "S2: only the real keystroke lands — the editor holds the typed \"x\" and NEVER the prompt text (no insertion, no accept)") — #13 12f (Fable, Nov 1): the first-line invite is deleted; only the keystroke lands', typed.replace(/\s/g, '') === 'x', J(s));
      pok('PARKED (was "S2: while shown, the invitation is a pointer-events:none overlay above the paper — it can never intercept a click or block the caret (no collision with typing)") — #13 12f (Fable, Nov 1): the first-line invite is deleted; there is no overlay at all', !s0.invite, J(s));
      pok('PARKED (was "S2 [successor]: \"don\'t offer again\" withdraws the invitation at once — the prompt disappears and the pref (at its CURRENTLY-EFFECTIVE key) becomes \"never\"") — #13 12f (Fable, Nov 1): the first-line invite is deleted; there is nothing to withdraw; the pref stays as seeded', !s0.never && s.pref === 'on', J(s));
      pok('PARKED (was "S2 [successor]: the withdrawal PERSISTS — after a reload the empty page still renders no invitation, and the pref (at its CURRENTLY-EFFECTIVE key) is still \"never\"") — #13 12f (Fable, Nov 1): the first-line invite is deleted; after a reload nothing renders and the pref is still as seeded', !s.prompt && !s.invite && s.pref === 'on', J(s));
      pok('PARKED (was "S2: don\'t offer again withdraws... pref becomes never" via the bare key) - the write ALWAYS lands correctly (prefAtKey is "never"); the bare key itself is either ALSO "never" (signed out - the original claim literally still holds), UNCHANGED from its pre-click seed, "on" (signed in, not yet migrated), or already consumed to null (signed in, migrated already) - #13 12f (Fable, Nov 1): there is no write any more; the bare key is UNCHANGED from its seed, "on"',
        s.pref === 'on' && !s0.never, J(s));
      pok('PARKED (was "S2: the withdrawal PERSISTS... pref is still never" via the bare key) - the write ALWAYS persists correctly (prefAtKey is "never" after a reload too); the bare key itself is either ALSO "never" (signed out), still UNCHANGED "on" (signed in, not yet migrated), or already consumed to null (signed in, migrated already) - #13 12f (Fable, Nov 1): there is no write; the bare key is still UNCHANGED "on" after a reload',
        s.pref === 'on', J(s));
    }
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// FX15's own A4 parks (S3, the retired "New Journal Entry" door) live in b2.mjs / fx14.mjs,
// verified under HARNESS_PARKED=1 by those files' own runs. The two SPROUT-INVITE-SCOPE parks
// above (collected into parkedChecks via pok(), declared near the top of this file) are FX15's
// own first parks.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX15 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; the bare-key reads retired by SPROUT-INVITE-SCOPE re-assert their new, opposite truth; S3's own parks live in b2.mjs / fx14.mjs.`
    : `\nFX15 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX15 VERIFY: PASS (${checks.length} checks)` : `\nFX15 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
