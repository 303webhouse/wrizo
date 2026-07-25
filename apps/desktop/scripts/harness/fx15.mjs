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

const PREF_KEY = 'wrizo-first-line-invite';

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
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(id)}, text: '', projectId: null, origin: 'loose', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    ${pref ? `localStorage.setItem(${JSON.stringify(PREF_KEY)}, ${JSON.stringify(pref)});` : `localStorage.removeItem(${JSON.stringify(PREF_KEY)});`}
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

    const placeholder = await app.evalJs("document.querySelector('.fo-placeholder')?.textContent ?? null");
    ok('S1: the empty page shows the plain "Write…" placeholder and nothing else — the space belongs to the writer, not an unbidden prompt',
      placeholder === 'Write…', JSON.stringify({ placeholder }));

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
    }))()`);
    ok('S2: "don\'t offer again" withdraws the invitation at once — the prompt disappears and the pref becomes "never"',
      immediate.prompt === false && immediate.pref === 'never', JSON.stringify(immediate));

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
    }))()`);
    ok('S2: the withdrawal PERSISTS — after a reload the empty page still renders no invitation, and the pref is still "never"',
      afterReload.prompt === false && afterReload.invite === false && afterReload.pref === 'never', JSON.stringify(afterReload));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// FX15's harness parks nothing of its own — it ADDS the first-line invite's first
// live coverage (F6 shipped un-harnessed). The A4 parks for FX15 S3 (the retired
// "New Journal Entry" door + its dead string) live in b2.mjs / fx14.mjs, verified
// under HARNESS_PARKED=1 by those files' own runs.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX15 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; FX15 parks nothing of its own (its S3 parks live in b2.mjs / fx14.mjs).`
    : `\nFX15 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX15 VERIFY: PASS (${checks.length} checks)` : `\nFX15 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
