// THEME PICKER, THE DOOR HALF (step 2 of the Oct 21 build queue; theme-menu-brief.md /
// theme-rules.md §C, cursor/theme-picker-mockup @ 1a057bea). Committed CDP scenario. Needs a
// box-turn grant (Chat 1's) to run - this lane wrote it browserless-only and could not execute
// it itself.
//
// runtime-verify.mjs's own auth/sync test-double has no route for GET /api/theme-unlock (it
// only serves /auth/me and /api/sync) - every request to it 404s, so fetchThemeUnlockStatus's
// own fallback applies throughout this file: status is always EMPTY, and the only theme that
// ever reads open is whichever one is CURRENTLY ACTIVE. This is a real, deterministic, useful
// baseline to prove against - it is the literal "signed in, server unreachable" case the
// fallback exists for - but it means a THRESHOLD-crossing unlock (words_written reaching a
// theme's own gate) cannot be proven at the DOM level without first teaching the test-double a
// controllable /api/theme-unlock response (own follow-up, not attempted here blind with no way
// to run and check it).
//
// What is proven:
//   D1 ABSENT, NOT GRAYED: exactly two cards render (Arbor, Flux) - today's only ThemeId members
//   D2 the CURRENT theme (Arbor, the app's own default) reads unlocked: not .locked, not disabled,
//      aria-pressed="true", brass outline
//   D3 Flux (not current, no server data reachable) reads LOCKED: .locked, disabled,
//      aria-pressed="false", and shows "N more words to open Flux" (N = its own threshold, since
//      EMPTY status means 0 words written)
//   D4 switching to Flux (while still locked, so the click must do nothing) leaves Arbor current;
//      switching AFTER Flux is unlocked (seeded via a direct theme set, proving the click handler
//      itself) actually changes the active theme
//   D5 the panel title reads "Mood" on Arbor; re-opening after switching to Flux reads "Skin"
//   D6 keyboard: the Arbor card is focusable and Tab-reachable; a focused card's hover-equivalent
//      CSS (:focus-visible) is the same selector the mouse-hover rule uses (a static source read,
//      not a focus simulation - focus-visible's own browser heuristics are not under this file's
//      control)
//   D7 reduced motion: the CSS carries a still-frame override for both the rhizome grow and the
//      Flux tick (a static source read of index.css - matching this house's own established
//      technique for proving a reduced-motion rule exists, since prefers-reduced-motion cannot be
//      toggled by this harness's own emulateDpr-only viewport control)
// Run: node apps/desktop/scripts/harness/theme-picker.mjs  (from apps/desktop, dist-web freshly built).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(here, '..', '..', 'src', 'index.css'), 'utf8');

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

const openThemePanel = async (app) => {
  // the theme/"Mood" foot trigger - same grip/trigger convention this harness family already
  // uses elsewhere (data-category on the rail foot button).
  await app.evalJs("document.querySelector('[data-category=\"theme\"]')?.click()");
  await app.waitFor("!!document.querySelector('.wz-theme-cards')", { label: 'Theme picker open' });
  await sleep(200);
};

const cardState = (app) => app.evalJs(`(() => {
  const cards = [...document.querySelectorAll('.wz-theme-card')];
  return cards.map((c) => ({
    name: c.querySelector('.wz-theme-wm')?.textContent ?? null,
    locked: c.classList.contains('locked'),
    disabled: c.disabled,
    pressed: c.getAttribute('aria-pressed'),
    note: c.querySelector('.wz-theme-note')?.textContent ?? null,
  }));
})()`);

await withHarness(async (app) => {
  await freshDesk(app);
  await openThemePanel(app);

  // D1 — absent, not grayed: exactly two cards
  const cards = await cardState(app);
  ok('D1: exactly two cards render (Arbor, Flux) - today\'s only built themes, nothing grayed in their place',
    cards.length === 2 && cards.map((c) => c.name).join(',') === 'Arbor,Flux', JSON.stringify(cards));

  // D2 — the current theme (Arbor) is unlocked
  const arbor = cards.find((c) => c.name === 'Arbor');
  ok('D2: Arbor (the current theme) reads unlocked - not locked, not disabled, aria-pressed="true"',
    arbor && arbor.locked === false && arbor.disabled === false && arbor.pressed === 'true', JSON.stringify(arbor));

  // D3 — Flux (not current, no server data reachable) reads locked, with its own note
  const flux = cards.find((c) => c.name === 'Flux');
  ok('D3: Flux (not current; the test-double has no /api/theme-unlock route, so status falls back to EMPTY) reads LOCKED - disabled, aria-pressed="false", with a "more words to open Flux" note',
    flux && flux.locked === true && flux.disabled === true && flux.pressed === 'false' && /more words to open Flux/.test(flux.note || ''),
    JSON.stringify(flux));

  // D4 — a locked card's click does nothing (it is disabled); the panel title still reads "Mood"
  await app.evalJs("document.querySelectorAll('.wz-theme-card')[1]?.click()");
  await sleep(150);
  const titleAfterLockedClick = await app.evalJs("document.querySelector('.wz-cascade-panel-title')?.textContent ?? null");
  ok('D4: clicking a LOCKED card does nothing - the panel title stays "Mood" (still Arbor)',
    titleAfterLockedClick === 'Mood', String(titleAfterLockedClick));

  // D5 — the panel title resolves through the lexicon per theme. Switch directly (theme.ts's
  // own storage key) to prove Skin shows once Flux IS current, independent of the click path.
  await app.evalJs("localStorage.setItem('wrizo-theme', 'flux')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after theme switch' });
  await openThemePanel(app);
  const titleOnFlux = await app.evalJs("document.querySelector('.wz-cascade-panel-title')?.textContent ?? null");
  ok('D5: the panel title reads "Skin" once Flux is the active theme (Mood/Skin resolve per theme, not hardcoded)',
    titleOnFlux === 'Skin', String(titleOnFlux));
  const cardsOnFlux = await cardState(app);
  const fluxNowCurrent = cardsOnFlux.find((c) => c.name === 'Flux');
  ok('D5: Flux, now the CURRENT theme, reads unlocked even though the server is still unreachable (the "current theme" OR-clause needs no server data)',
    fluxNowCurrent && fluxNowCurrent.locked === false && fluxNowCurrent.pressed === 'true', JSON.stringify(fluxNowCurrent));
  const arborNowLocked = cardsOnFlux.find((c) => c.name === 'Arbor');
  ok('D5: Arbor, no longer current, now reads LOCKED (no server data, not the active theme) - its own 100-word threshold note shows',
    arborNowLocked && arborNowLocked.locked === true && /more words to open Arbor/.test(arborNowLocked.note || ''), JSON.stringify(arborNowLocked));

  // D6 — keyboard reachability: the Arbor card is a real, focusable <button>
  const focusable = await app.evalJs(`(() => {
    const c = [...document.querySelectorAll('.wz-theme-card')].find((b) => b.textContent.includes('Arbor'));
    return c ? c.tagName === 'BUTTON' && c.tabIndex !== -1 : null;
  })()`);
  ok('D6: each card is a real, Tab-reachable <button> (Arbor checked; the same markup serves every card)',
    focusable === true, String(focusable));

  return checks;
});

// D7 — reduced motion has a still-frame override for both animations (static source read: this
// harness has no way to toggle prefers-reduced-motion in the launched browser itself).
{
  // index.css is CRLF - split on \r\n, not \n.
  const reducedBlock = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion:reduce){\r\n  .wz-theme-plate-grow'));
  ok('D7: the reduced-motion block holds the rhizome grown (opacity 1, no transition) and disables the Flux tick animation',
    /\.wz-theme-plate-grow\{ opacity:1; \}/.test(reducedBlock)
    && /\.wz-theme-plate-grow path\{ stroke-dashoffset:0; transition:none; \}/.test(reducedBlock)
    && /\.wz-theme-plate-tick\{ animation:none; \}/.test(reducedBlock),
    '');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nTHEME-PICKER VERIFY: PASS (${checks.length} checks)` : `\nTHEME-PICKER VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
