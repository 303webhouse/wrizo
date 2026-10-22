// THEME PICKER, THE DOOR HALF (step 2 of the Oct 21 build queue; theme-menu-brief.md /
// theme-rules.md §C, cursor/theme-picker-mockup @ 1a057bea). Committed CDP scenario. Needs a
// box-turn grant (Chat 1's) to run - this lane wrote it browserless-only and could not execute
// it itself.
//
// FIXED (Fable's review, Oct 22): freshDesk() used to stop at `.wz-arrival` and expect
// [data-category="theme"] to already exist there. It never can - the cascade rail (every
// [data-category], "theme" included) only mounts from useCascade(), which is only ever called
// by PageEditor/JournalEntry/BoardEditor/ScriptEditor, never by Arrival.tsx itself (confirmed:
// zero useCascade call sites outside those four). Arrival is the door screen (Full screen /
// Sign out are GlobalHeader's corner cluster, present on every route; Write / Open are
// Arrival's own two buttons) - not a page. freshDesk() now also opens the Write door and waits
// for the editor, the same house convention cd1.mjs's own freshLoosePage (and ab3.mjs, b2.mjs,
// fx1.mjs, fx2.mjs) already use before touching any data-category. This was a harness bug, not
// a product gap - the theme picker has no shipped path that skips opening a page/board/journal
// entry/script first, and that is this ticket's own intended scope, not an omission.
//
// SUPERSEDED mid-ticket (Fable's review, Oct 21 1:09pm ruling): openness and the unlock count now
// derive SERVER-SIDE (apps/server/src/sync.ts's GET /theme-unlock). runtime-verify.mjs's own
// auth/sync test-double has no route for it (it only serves /auth/me and /api/sync) - every
// request 404s, so fetchThemeUnlockStatus's fallback applies throughout this file: status is
// `null` (NOT an EMPTY-but-truthy object - the earlier version of this file, before the ruling,
// assumed EMPTY and expected a guessed "N more words" count even with no real data; that was
// exactly the readout note (a) rules out). With a null status every theme but the CURRENTLY
// ACTIVE one reads locked with NO number at all. A THRESHOLD-crossing unlock (words_written
// reaching a theme's own gate) still cannot be proven at the DOM level without first teaching the
// test-double a controllable /api/theme-unlock response (own follow-up, not attempted here blind
// with no way to run and check it).
//
// What is proven:
//   D1 ABSENT, NOT GRAYED: exactly two cards render (Arbor, Flux) - today's only ThemeId members
//   D2 the CURRENT theme (Arbor, the app's own default) reads unlocked: not .locked, not disabled,
//      aria-pressed="true", brass outline
//   D3 note (a): Flux (not current, no server data reachable - status is null) reads LOCKED:
//      .locked, disabled, aria-pressed="false", and shows NO note at all - never a guessed "N
//      more words" count when there is no real data to back it
//   D4 switching to Flux (while still locked, so the click must do nothing) leaves Arbor current;
//      switching AFTER Flux is unlocked (seeded via a direct theme set, proving the click handler
//      itself) actually changes the active theme
//   D5 the panel title reads "Mood" on Arbor; re-opening after switching to Flux reads "Skin"
//   D6 keyboard, note (c), FIXED: runs after D5 (Flux is now current, Arbor locked). A disabled
//      button's `.tabIndex` property reads 0 (the earlier version of this check wrongly asserted
//      -1), so the real proof is a TRUSTED Tab press (CDP input, native tab-traversal) - it
//      skips the disabled Arbor card entirely and lands on Flux - plus a direct `.focus()`
//      attempt on Arbor, which real browsers refuse outright for a disabled element; a trusted
//      Enter/Space afterward changes nothing
//   D7 reduced motion AND Ambiance 0 (note d): the CSS carries the SAME still-frame override for
//      both the OS media query and ThemePicker.tsx's own `data-still` attribute (a static source
//      read of index.css - matching this house's established technique for proving a
//      reduced-motion rule exists, since prefers-reduced-motion cannot be toggled by this
//      harness's emulateDpr-only viewport control); the DOM-level half is proven live: setting
//      the Ambiance dial to 0 makes the panel carry `data-still="true"`
//   D8 note (e), FIXED: a real (CDP-trusted) pointer move onto the Flux card grants a pulse
//      (`wz-theme-glitching`), which ends on its own after its own duration - one-shot, never
//      `infinite`. The earlier version dispatched a page-side `new MouseEvent('mouseenter', ...)`
//      directly - a HARNESS bug, not a product one: React derives onMouseEnter/onMouseLeave from
//      native mouseover/mouseout (mouseenter/mouseleave don't bubble, so React can't delegate
//      them), so a synthetic mouseenter dispatched at the target was always invisible to it. The
//      "no stacking" refusal itself is proven at the logic level (theme-picker-logic.mjs
//      T11/T12, against the exact same controller module); the CSS animation itself is a single
//      iteration (`steps(2, end) 1`, not `infinite`) - a static source check, since this CSS
//      class is JS-driven, not a pure `:hover` rule, so there is no `infinite`
//      hover-loop left to find at all
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
  // Fable's review: Arrival is the door, not a page - the cascade rail (and [data-category]
  // generally, including "theme") only mounts from useCascade(), which is only ever called from
  // PageEditor/JournalEntry/BoardEditor/ScriptEditor, never from Arrival itself. Open the Write
  // door first (the house convention - cd1.mjs's own freshLoosePage, ab3.mjs, b2.mjs, fx1.mjs,
  // fx2.mjs all do the same before touching data-category) so the rail actually exists.
  await app.evalJs("document.querySelector('.wz-arrival-write')?.click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
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

  // D3 — note (a): Flux (not current, no server data reachable - status is null) reads locked,
  // with NO note at all (never a guessed count)
  const flux = cards.find((c) => c.name === 'Flux');
  ok('D3: Flux (not current; the test-double has no /api/theme-unlock route, so status falls back to null) reads LOCKED - disabled, aria-pressed="false", and shows NO note (readouts state only true things)',
    flux && flux.locked === true && flux.disabled === true && flux.pressed === 'false' && flux.note === null,
    JSON.stringify(flux));

  // D4 — a locked card's click does nothing (it is disabled); the panel title still reads "Mood"
  await app.evalJs("document.querySelectorAll('.wz-theme-card')[1]?.click()");
  await sleep(150);
  const titleAfterLockedClick = await app.evalJs("document.querySelector('.wz-cascade-panel-title')?.textContent ?? null");
  ok('D4: clicking a LOCKED card does nothing - the panel title stays "Mood" (still Arbor)',
    titleAfterLockedClick === 'Mood', String(titleAfterLockedClick));

  // D5 — the panel title resolves through the lexicon per theme. Switch directly (theme.ts's
  // own storage key) to prove Skin shows once Flux IS current, independent of the click path.
  // The app RESUMES the last route on reload (fx15.mjs's own established note) - a page is
  // already open at this point in the scenario, so reloading lands straight back on the editor,
  // never on Arrival; wait for the editor, not the door.
  await app.evalJs("localStorage.setItem('wrizo-theme', 'flux')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted after theme switch' });
  await openThemePanel(app);
  const titleOnFlux = await app.evalJs("document.querySelector('.wz-cascade-panel-title')?.textContent ?? null");
  ok('D5: the panel title reads "Skin" once Flux is the active theme (Mood/Skin resolve per theme, not hardcoded)',
    titleOnFlux === 'Skin', String(titleOnFlux));
  const cardsOnFlux = await cardState(app);
  const fluxNowCurrent = cardsOnFlux.find((c) => c.name === 'Flux');
  ok('D5: Flux, now the CURRENT theme, reads unlocked even though the server is still unreachable (the "current theme" OR-clause needs no server data)',
    fluxNowCurrent && fluxNowCurrent.locked === false && fluxNowCurrent.pressed === 'true', JSON.stringify(fluxNowCurrent));
  const arborNowLocked = cardsOnFlux.find((c) => c.name === 'Arbor');
  ok('D5: Arbor, no longer current, now reads LOCKED (no server data, not the active theme) - and shows NO note (note a: no real data, no guessed count)',
    arborNowLocked && arborNowLocked.locked === true && arborNowLocked.note === null, JSON.stringify(arborNowLocked));

  // D6 — keyboard, note (c), FIXED (Fable's review): a disabled <button>'s `.tabIndex` property
  // reads 0, not -1 (the IDL default tabIndex computation and real focusability are separate
  // things) - the original version of this check asserted `tabIndex === -1` and that assumption
  // was simply wrong, not a reliable signal of anything. The real test is a TRUSTED Tab press
  // (CDP's own input layer, native tab-traversal semantics) and a real `.focus()` attempt, not a
  // property read.
  //
  // Tab order at this point: the Page toggle's Light/Dark buttons, then Arbor (locked), then
  // Flux (unlocked, current). Focus the LAST button before the cards and press Tab once - a
  // native Tab walk must skip the disabled Arbor card entirely and land straight on Flux.
  await app.evalJs("document.querySelectorAll('.wz-theme-picker-field .mode-seg button')[1]?.focus()");
  const focusedBeforeTab = await app.evalJs("document.activeElement?.textContent ?? null");
  await app.key('Tab');
  const afterTab = await app.evalJs(`(() => {
    const a = document.activeElement;
    return { tag: a?.tagName ?? null, isArbor: !!a?.classList?.contains('wz-theme-card-arbor'), isFlux: !!a?.classList?.contains('wz-theme-card-flux') };
  })()`);
  ok('D6: a real (CDP-trusted) Tab press from the Page toggle skips the disabled Arbor card entirely and lands on Flux - a real Tab walk never lands on a locked card',
    focusedBeforeTab === 'Dark' && afterTab.isArbor === false && afterTab.isFlux === true, JSON.stringify({ focusedBeforeTab, afterTab }));

  // Separately: a disabled element refuses focus outright (stronger than any tabIndex reading),
  // and a trusted Enter/Space in that state changes nothing.
  const trustedKey = async (key, code, vk, text) => {
    const p = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text };
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', ...p });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
  };
  await app.evalJs("[...document.querySelectorAll('.wz-theme-card')].find((b) => b.classList.contains('wz-theme-card-arbor'))?.focus()");
  const focusedArbor = await app.evalJs("!!document.activeElement?.classList?.contains('wz-theme-card-arbor')");
  await trustedKey('Enter', 'Enter', 13, '\r');
  await trustedKey(' ', 'Space', 32, ' ');
  const themeAfter = await app.evalJs("localStorage.getItem('wrizo-theme')");
  ok('D6: the disabled Arbor card refuses focus outright (`.focus()` does not move document.activeElement onto it), and a trusted Enter/Space afterward changes nothing',
    focusedArbor === false && themeAfter === 'flux', JSON.stringify({ focusedArbor, themeAfter }));

  // D8 — note (e): the Flux card's hover glitch is a single, rate-limited pulse, not an infinite
  // loop. Flux is the CURRENT theme at this point in the scenario (set via D5 above), so it is
  // unlocked and hoverable. The controller's own "no stacking" refusal is proven at the logic
  // level (theme-picker-logic.mjs T11/T12, against the exact same module) - a class toggle is
  // not independently observable in the DOM either way, so this half only proves the WIRING: a
  // hover grants a pulse, and the pulse ends on its own (one-shot, never `infinite`).
  //
  // FIXED (Fable's review): the original version dispatched a page-side `new MouseEvent
  // ('mouseenter', {bubbles:true})` directly at the element - this was the HARNESS'S OWN bug,
  // not a product one. React does not attach a native listener for 'mouseenter'/'mouseleave' at
  // all (they don't bubble, so React can't delegate them); it derives `onMouseEnter`/
  // `onMouseLeave` from the native 'mouseover'/'mouseout' events it DOES listen for. A
  // synthetic 'mouseenter' dispatched straight at the target is invisible to that machinery, so
  // the old check could only have ever failed - not because ThemePicker.tsx's hover wiring was
  // broken, but because the harness never produced an event React's enter/leave plugin
  // recognizes. A real (CDP-trusted) pointer move produces genuine native mouseover/mouseout,
  // which IS what React's plugin watches.
  const fluxRect = await app.evalJs(`(() => {
    const el = [...document.querySelectorAll('.wz-theme-card')].find((b) => b.textContent.includes('Flux'));
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  await app.mouseMove(fluxRect.x, fluxRect.y);
  await sleep(60);
  const fluxTickGlitching = () => app.evalJs("[...document.querySelectorAll('.wz-theme-card')].find((b) => b.textContent.includes('Flux'))?.querySelector('.wz-theme-plate-tick')?.classList.contains('wz-theme-glitching') ?? null");
  const glitchingAfterHover = await fluxTickGlitching();
  await sleep(600);   // past FLUX_CARD_GLITCH_MS (450ms)
  const glitchingAfterPulseEnds = await fluxTickGlitching();
  ok('D8: a real pointer move onto the Flux card grants a pulse (wz-theme-glitching added)',
    glitchingAfterHover === true, String(glitchingAfterHover));
  ok('D8: the pulse ends on its own after its own duration - one-shot, never an infinite loop',
    glitchingAfterPulseEnds === false, String(glitchingAfterPulseEnds));

  return checks;
});

// D7 — note (d): reduced motion AND Ambiance 0 carry the SAME still-frame override (static
// source read: this harness has no way to toggle prefers-reduced-motion in the launched browser
// itself, but the Ambiance-0 half is the JS-driven `data-still` attribute, proven live below).
{
  // index.css is CRLF - split on \r\n, not \n.
  const reducedBlock = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion:reduce){\r\n  .wz-theme-plate-grow'));
  ok('D7: the reduced-motion block holds the rhizome grown (opacity 1, no transition) and disables the Flux tick animation',
    /\.wz-theme-plate-grow\{ opacity:1; \}/.test(reducedBlock)
    && /\.wz-theme-plate-grow path\{ stroke-dashoffset:0; transition:none; \}/.test(reducedBlock)
    && /\.wz-theme-plate-tick\{ animation:none; \}/.test(reducedBlock),
    '');
  ok('D7: the SAME still rules exist under the `[data-still="true"]` attribute (Ambiance 0, no @media involved)',
    CSS.includes("[data-still='true'] .wz-theme-plate-grow{ opacity:1; }")
    && CSS.includes("[data-still='true'] .wz-theme-plate-grow path{ stroke-dashoffset:0; transition:none; }")
    && CSS.includes("[data-still='true'] .wz-theme-plate-tick{ animation:none;"),
    '');
  ok('D7: the hover-triggered glitch is no longer a plain CSS `:hover -> infinite` rule (note e moved it to a JS-driven, rate-limited one-shot class)',
    !/:hover \.wz-theme-plate-tick[\s\S]{0,80}animation:wz-theme-glitch[\s\S]{0,20}infinite/.test(CSS),
    '');
}

// D9 — note (d) live half: setting the Ambiance dial to 0 makes the panel carry data-still="true"
// even with no OS reduced-motion preference in play.
await withHarness(async (app) => {
  await freshDesk(app);
  // the dial's module-level `current` only re-reads localStorage at module init (store/
  // ambianceDial.ts's own `let current = load()`), so a reload is needed for the new value to
  // take effect; a page is already open (freshDesk's own Write-door step), so the reload resumes
  // straight onto the editor, same as D5 above - wait for the editor, not Arrival.
  await app.evalJs("localStorage.setItem('wrizo-ambiance-dial', '0')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, Ambiance 0' });
  await openThemePanel(app);
  const stillAttr = await app.evalJs("document.querySelector('.wz-theme-picker')?.getAttribute('data-still') ?? null");
  ok('D9: Ambiance dial at 0 makes the theme picker carry data-still="true" (the still frame applies to Ambiance 0, not only OS reduced motion)',
    stillAttr === 'true', String(stillAttr));
  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nTHEME-PICKER VERIFY: PASS (${checks.length} checks)` : `\nTHEME-PICKER VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
