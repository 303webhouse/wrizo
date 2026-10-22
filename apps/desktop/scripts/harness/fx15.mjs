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

  // ── S2 — the opt-in path renders, and is deck-drawn ─────────────────────────
  {
    await openFreshPage(app, 'fx15-optin', 'on');
    const prompt = await app.evalJs("document.querySelector('.fl-prompt')?.textContent ?? null");
    ok('S2: once opted in (pref "on"), the invitation appears — a single quiet .fl-prompt on the empty page',
      typeof prompt === 'string' && prompt.trim().length > 0, JSON.stringify({ prompt }));

    // Deck-drawn, never model-drawn: the rendered line is a verbatim member of
    // the local NUDGE_POOL deck (exposed via the wrizoFirstLineInvite seam). A
    // model-generated line could not be a member; a synchronous local draw means
    // no send fired on load (the ratified disclosure sentence forbids one).
    const deckDrawn = await app.evalJs(`(() => {
      const pool = (window.wrizoFirstLineInvite && window.wrizoFirstLineInvite.POOL) || null;
      const text = document.querySelector('.fl-prompt')?.textContent ?? null;
      return { poolLen: Array.isArray(pool) ? pool.length : -1, member: !!pool && !!text && pool.includes(text) };
    })()`);
    ok('S2: the prompt is DECK-DRAWN, never model-drawn — the rendered line is a verbatim member of the local NUDGE_POOL deck (no send on page load)',
      deckDrawn.poolLen > 0 && deckDrawn.member === true, JSON.stringify(deckDrawn));

    // A13 (structural): the prompt lives OUTSIDE the editable surface and is
    // decorative — it is a <span>, aria-hidden, and not a descendant of the
    // contenteditable, so there is no mechanism by which it could become text.
    const a13 = await app.evalJs(`(() => {
      const p = document.querySelector('.fl-prompt');
      const editor = document.querySelector('.forward-only-editor');
      return {
        insideEditor: !!p && !!editor && editor.contains(p),
        tag: p ? p.tagName : null,
        ariaHidden: p ? p.getAttribute('aria-hidden') : null,
      };
    })()`);
    ok('S2 (A13): the prompt is decoration OUTSIDE the editable surface — a <span>, aria-hidden, and NOT a descendant of .forward-only-editor — so it can never become the writer\'s text',
      a13.insideEditor === false && a13.tag === 'SPAN' && a13.ariaHidden === 'true', JSON.stringify(a13));
  }

  // ── S2 (A13) — no tab-fill: pressing Tab never accepts the prompt ───────────
  {
    await openFreshPage(app, 'fx15-tab', 'on');
    const promptBefore = await app.evalJs("document.querySelector('.fl-prompt')?.textContent ?? ''");
    await focusEditor(app);
    await app.key('Tab');
    await sleep(200);
    const afterTab = await editorText(app);
    ok('S2 (A13): pressing Tab does NOT fill the line — the editor takes no content and the prompt text is never inserted (no accept, no tab-fill)',
      afterTab.replace(/\s/g, '') === '' && !(promptBefore && afterTab.includes(promptBefore)),
      JSON.stringify({ promptBefore, afterTab }));
  }

  // ── S2 — vanishes on the first keystroke; only the real char lands ──────────
  {
    await openFreshPage(app, 'fx15-vanish', 'on');
    const promptBefore = await app.evalJs("document.querySelector('.fl-prompt')?.textContent ?? ''");
    ok('S2: precondition — the opted-in prompt is showing on the empty page before the keystroke',
      typeof promptBefore === 'string' && promptBefore.length > 0, JSON.stringify({ promptBefore }));

    await focusEditor(app);
    await app.typeKeys('x');
    await sleep(250);
    const gone = await app.evalJs("!document.querySelector('.fl-prompt') && !document.querySelector('.fl-invite')");
    ok('S2: the invitation VANISHES on the first keystroke — .fl-prompt / .fl-invite are gone the instant the writer types (and so can never overlap typed text)',
      gone === true, String(gone));

    const after = await editorText(app);
    ok('S2: only the real keystroke lands — the editor holds the typed "x" and NEVER the prompt text (no insertion, no accept)',
      after.includes('x') && !(promptBefore && after.includes(promptBefore)), JSON.stringify({ after }));
  }

  // ── S2 — the invite never blocks the writer (pointer-events:none overlay) ───
  {
    await openFreshPage(app, 'fx15-overlay', 'on');
    const overlay = await app.evalJs(`(() => {
      const el = document.querySelector('.fl-invite');
      return el ? getComputedStyle(el).pointerEvents : null;
    })()`);
    ok('S2: while shown, the invitation is a pointer-events:none overlay above the paper — it can never intercept a click or block the caret (no collision with typing)',
      overlay === 'none', JSON.stringify({ overlay }));
  }

  // ── S2 — "don't offer again" persists across a reload ──────────────────────
  {
    await openFreshPage(app, 'fx15-never', 'on');
    await app.waitFor("!!document.querySelector('.fl-never')", { label: '"don\'t offer again" button present' });
    await app.evalJs("document.querySelector('.fl-never').click()");
    await sleep(200);
    const immediate = await app.evalJs(`(() => ({
      prompt: !!document.querySelector('.fl-prompt'),
      pref: localStorage.getItem(${JSON.stringify(PREF_KEY)}),
      prefAtKey: localStorage.getItem(window.wrizoFirstLineInvite.prefKey()),
    }))()`);
    // SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - SUPERSEDED. ORIGINAL, quoted verbatim
    // (now parked at the foot of this file, HARNESS_PARKED=1): `immediate.pref` read the BARE
    // key directly, which is only the EFFECTIVE key while signed out. A signed-in device's
    // "don't offer again" click correctly writes that account's own SCOPED key instead - a
    // real, intentional behavior change this ticket introduced, not a bug - so the bare key
    // alone is no longer a reliable read of "the pref". Successor below reads prefAtKey (the
    // hook's own test seam), the SAME key the write itself targets either way.
    //
    //   ok('S2: "don\'t offer again" withdraws the invitation at once — the prompt disappears and the pref becomes "never"',
    //     immediate.prompt === false && immediate.pref === 'never', JSON.stringify(immediate));
    ok('S2 [successor]: "don\'t offer again" withdraws the invitation at once — the prompt disappears and the pref (at its CURRENTLY-EFFECTIVE key) becomes "never"',
      immediate.prompt === false && immediate.prefAtKey === 'never', JSON.stringify(immediate));
    if (process.env.HARNESS_PARKED === '1') {
      // Fable's review (ledger 124): accept null as "nothing to migrate" - a signed-in session
      // can have the bare key already consumed by migrateToScopedKey() (readPref()'s own
      // subscription-triggered re-run, sometime before this click) before this read even fires.
      // Still narrow: anything other than 'never'/'on'/null stays rejected (matches fx16.mjs's
      // own Case 2/3 parks and sprout-invite-scope.mjs's own fixed E4 park); a genuinely stuck,
      // unmigrated value cannot slip through - proven by sprout-invite-scope-logic.mjs's own S2
      // mutant ("migrateToScopedKey is a complete no-op"), which exercises this exact code path.
      pok('PARKED (was "S2: don\'t offer again withdraws... pref becomes never" via the bare key) - the write ALWAYS lands correctly (prefAtKey is "never"); the bare key itself is either ALSO "never" (signed out - the original claim literally still holds), UNCHANGED from its pre-click seed, "on" (signed in, not yet migrated), or already consumed to null (signed in, migrated already)',
        immediate.prefAtKey === 'never' && (immediate.pref === 'never' || immediate.pref === 'on' || immediate.pref == null), JSON.stringify(immediate));
    }

    // Reload (NOT freshDesk — the pref must survive) and re-open the same empty
    // page: the withdrawal is permanent. The app RESUMES the last route on reload
    // (so it may land straight on the page, not the Desk); force the page hash
    // either way, then wait for the editor.
    await app.reload();
    await sleep(600);
    await app.evalJs("location.hash = '#/page/fx15-never'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'THE Page after never+reload' });
    await sleep(300);
    const afterReload = await app.evalJs(`(() => ({
      prompt: !!document.querySelector('.fl-prompt'),
      invite: !!document.querySelector('.fl-invite'),
      pref: localStorage.getItem(${JSON.stringify(PREF_KEY)}),
      prefAtKey: localStorage.getItem(window.wrizoFirstLineInvite.prefKey()),
    }))()`);
    // SPROUT-INVITE-SCOPE (Fable's review, ledger 124) - SUPERSEDED, same reasoning as above.
    // ORIGINAL, quoted verbatim (parked at the foot of this file):
    //
    //   ok('S2: the withdrawal PERSISTS — after a reload the empty page still renders no invitation, and the pref is still "never"',
    //     afterReload.prompt === false && afterReload.invite === false && afterReload.pref === 'never', JSON.stringify(afterReload));
    ok('S2 [successor]: the withdrawal PERSISTS — after a reload the empty page still renders no invitation, and the pref (at its CURRENTLY-EFFECTIVE key) is still "never"',
      afterReload.prompt === false && afterReload.invite === false && afterReload.prefAtKey === 'never', JSON.stringify(afterReload));
    if (process.env.HARNESS_PARKED === '1') {
      // Same null-acceptance reasoning as the pok() above.
      pok('PARKED (was "S2: the withdrawal PERSISTS... pref is still never" via the bare key) - the write ALWAYS persists correctly (prefAtKey is "never" after a reload too); the bare key itself is either ALSO "never" (signed out), still UNCHANGED "on" (signed in, not yet migrated), or already consumed to null (signed in, migrated already)',
        afterReload.prefAtKey === 'never' && (afterReload.pref === 'never' || afterReload.pref === 'on' || afterReload.pref == null), JSON.stringify(afterReload));
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
