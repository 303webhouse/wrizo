// THEME PICKER, THE LOGIC HALF (step 2 of the Oct 21 build queue; theme-menu-brief.md /
// theme-rules.md §C, Fable's review notes on this ticket). Browserless (no grant needed),
// proven against the REAL source (esbuild-bundled fresh, same technique client-node.mjs's own
// loadClientStore uses).
//
// SUPERSEDED mid-ticket (Fable's review, Oct 21 1:09pm ruling, folded in before this ever
// shipped/reviewed as "done" - normal iteration, not a park): openness used to be computed
// HERE, client-side, from the raw wordsWritten/themesOpened/thresholds. It now derives
// SERVER-SIDE (apps/server/src/sync.ts's GET /theme-unlock returns a precomputed `open` map) -
// this file only adds the "current theme" clause the server cannot know. A failed/未-fetched
// status is now `null`, not an EMPTY-but-truthy object, so a caller can tell "no data" apart
// from "the server said nothing is open" (readouts state only true things, theme-rules.md §A.6
// - a locked card with no data shows no "N more words" number at all).
//
// What is proven, calling store/themeUnlock.ts's own exported `isThemeOpen` / `wordsToUnlock` /
// `fetchThemeUnlockStatus` directly (no React render, no DOM - the hook `useThemeUnlockStatus`
// is the only consumer that needs one, and isn't exercised here):
//   T1 the CURRENT theme is always open, regardless of the server's own `open` map
//   T2 a theme the server marked open (threshold met OR grandfathered - either way, the SERVER's
//      own job now) reads open
//   T3 a theme the server did NOT mark open, and is not current, is LOCKED
//   T4 a null status (no data at all) locks every theme except the current one - never a stale
//      "open" guess
//   T5 wordsToUnlock is threshold-minus-written, floored at 0 - never negative
//   T6 wordsToUnlock returns null (not 0, not a guess) when there is no threshold entry at all,
//      OR when status itself is null - the exact two "no real number" cases note (a) names
//   T7 fetchThemeUnlockStatus parses a real server response shape correctly, INCLUDING the new
//      server-derived `open` map
//   T8 fetchThemeUnlockStatus returns null (not an EMPTY object) on a non-ok response (signed
//      out, no session)
//   T9 fetchThemeUnlockStatus returns null on a network failure (offline)
//
// ...and store/fluxCardGlitch.ts's own exported `createFluxCardGlitchController` (note (e): the
// Flux card's hover Glitch is a FLASH, theme-rules.md §A.8's 3/sec-per-1,100ms budget applies):
//   T10 a fresh controller grants its first pulse
//   T11 a SECOND request while the first pulse is still playing (quick hover out/in before the
//       .45s animation finishes) is REFUSED - no stacking
//   T12 a request made AFTER the pulse's own duration has elapsed is granted again (a genuinely
//       new hover, not a stack)
//   T13 the controller still asks the SHARED global flash budget, not just its own debounce - if
//       3 other flashes already filled the 1,100ms window, a brand-new (post-duration) request
//       is refused too
//   MUTANTS (each is the bundle with ONE text edit, must turn its named case RED):
//       isThemeOpen drops its "current theme" clause (T1 red)
//       isThemeOpen ignores the server's own `open` map (always false) (T2 red)
//       wordsToUnlock drops its Math.max(0, ...) floor (T5 red - could go negative)
//       FluxCardGlitchController drops its mid-pulse "no stacking" guard (T11 red)
//
// Run (from the repo root, no server/grant needed):
//   node apps/desktop/scripts/harness/theme-picker-logic.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const ROOT = join(DESKTOP, '..', '..');
const SRC = join(DESKTOP, 'src').replace(/\\/g, '/');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };

function bundle() {
  const pnpmDir = join(ROOT, 'node_modules', '.pnpm');
  const esbuildPkg = existsSync(pnpmDir) ? readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)) : null;
  const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
  if (!esbuildBin || !existsSync(esbuildBin)) throw new Error('esbuild not found under node_modules/.pnpm');
  const tmp = mkdtempSync(join(tmpdir(), 'wz-themepicker-'));
  const entry = join(tmp, 'entry.ts');
  writeFileSync(entry, `export * as themeUnlock from '${SRC}/store/themeUnlock';\nexport * as fluxCardGlitch from '${SRC}/store/fluxCardGlitch';\nexport * as flashBudget from '${SRC}/store/flashBudget';`);
  const out = join(tmp, 'bundle.mjs');
  execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error',
    '--external:@fontsource/*', '--external:@fontsource-variable/*', '--define:import.meta.env.DEV=false', '--define:import.meta.env.PROD=true',
    '--define:import.meta.env.MODE="production"'], { stdio: 'pipe' });
  return { tmp, out };
}

const STATUS = { wordsWritten: 450, themesOpened: { plateau: true }, thresholds: { plateau: 100, machina: 100, flux: 1000, nomad: 5000, volant: 20000 }, open: { plateau: true, machina: true, flux: false, nomad: false, volant: false } };

const tmps = [];
try {
  const real = bundle();
  tmps.push(real.tmp);
  const mod = await import(pathToFileURL(real.out).href + `?t=${Date.now()}`);
  const { themeUnlock, fluxCardGlitch, flashBudget } = mod;

  // T1 — the current theme is always open, even if the server's own open map says otherwise
  ok('T1: the CURRENT theme is open regardless of the server\'s own open map (flux: server says false, but it is the theme in use)',
    themeUnlock.isThemeOpen('flux', STATUS, 'flux') === true, '');

  // T2 — a theme the server marked open reads open (the server's own job now, not re-derived here)
  ok('T2: a theme the server marked open (machina: threshold met OR grandfathered, the server\'s own computation) reads open',
    themeUnlock.isThemeOpen('machina', STATUS, 'plateau') === true, '');

  // T3 — locked: the server did not mark it open, and it is not current
  ok('T3: a theme the server did NOT mark open, and is not current, is LOCKED (flux, current theme is plateau)',
    themeUnlock.isThemeOpen('flux', STATUS, 'plateau') === false, '');

  // T4 — a null status (no data at all) locks every theme except the current one
  ok('T4: a null status (no data - fetch failed or hasn\'t resolved) locks a non-current theme',
    themeUnlock.isThemeOpen('flux', null, 'plateau') === false, '');
  ok('T4: ...but the CURRENT theme stays open even with a null status (pure client fact, no server data needed)',
    themeUnlock.isThemeOpen('plateau', null, 'plateau') === true, '');

  // T5 — wordsToUnlock: threshold - written, floored at 0
  ok('T5: wordsToUnlock is threshold-minus-written (flux: 1000 - 450 = 550)',
    themeUnlock.wordsToUnlock('flux', STATUS) === 550, String(themeUnlock.wordsToUnlock('flux', STATUS)));
  const overThreshold = { wordsWritten: 5000, themesOpened: {}, thresholds: { flux: 1000 }, open: { flux: true } };
  ok('T5: wordsToUnlock never goes negative once written exceeds the threshold',
    themeUnlock.wordsToUnlock('flux', overThreshold) === 0, String(themeUnlock.wordsToUnlock('flux', overThreshold)));

  // T6 — null (never a guessed number) when there is no real threshold, or no status at all
  const noThreshold = { wordsWritten: 999999, themesOpened: {}, thresholds: {}, open: {} };
  ok('T6: wordsToUnlock is null (never a guessed "0") when the theme has no threshold entry at all',
    themeUnlock.wordsToUnlock('volant', noThreshold) === null, String(themeUnlock.wordsToUnlock('volant', noThreshold)));
  ok('T6: wordsToUnlock is null when status itself is null (fetch failed/hasn\'t resolved) - never a guessed number',
    themeUnlock.wordsToUnlock('flux', null) === null, String(themeUnlock.wordsToUnlock('flux', null)));

  // T7 — a real server response shape parses correctly, including the new `open` map
  {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ wordsWritten: 1234, themesOpened: { plateau: true }, thresholds: { flux: 1000 }, open: { plateau: true, flux: false } }) });
    const parsed = await themeUnlock.fetchThemeUnlockStatus();
    globalThis.fetch = realFetch;
    ok('T7: fetchThemeUnlockStatus parses a real server response shape correctly, including the server-derived open map',
      parsed?.wordsWritten === 1234 && parsed?.themesOpened.plateau === true && parsed?.thresholds.flux === 1000 && parsed?.open.plateau === true && parsed?.open.flux === false,
      JSON.stringify(parsed));
  }

  // T8 — a non-ok response (signed out / no session) returns null, not an EMPTY object
  {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: false, json: async () => { throw new Error('should never be read'); } });
    const parsed = await themeUnlock.fetchThemeUnlockStatus();
    globalThis.fetch = realFetch;
    ok('T8: a non-ok response (signed out, no session) returns null - never reads the body, never an EMPTY-but-truthy object',
      parsed === null, JSON.stringify(parsed));
  }

  // T9 — a network failure returns null
  {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new TypeError('offline'); };
    const parsed = await themeUnlock.fetchThemeUnlockStatus();
    globalThis.fetch = realFetch;
    ok('T9: a network failure (offline) returns null, not a crash and not an EMPTY-but-truthy object',
      parsed === null, JSON.stringify(parsed));
  }

  // T10-T13 — the Flux card's own rate-limited hover glitch (note e)
  flashBudget.__resetFlashBudget();
  {
    const c = fluxCardGlitch.createFluxCardGlitchController(450);
    ok('T10: a fresh controller grants its first pulse', c.requestPulse(1000) === true, '');
    ok('T11: a second request mid-pulse (quick hover out/in before the .45s animation finishes) is REFUSED - no stacking',
      c.requestPulse(1200) === false, '');
    ok('T12: a request made AFTER the pulse\'s own duration has elapsed is granted again (a genuinely new hover)',
      c.requestPulse(1460) === true, '');
  }
  flashBudget.__resetFlashBudget();
  {
    const c = fluxCardGlitch.createFluxCardGlitchController(450);
    // fill the shared global budget with 3 OTHER flashes in the same 1,100ms window
    flashBudget.tryFlash('other-a', 0);
    flashBudget.tryFlash('other-b', 10);
    flashBudget.tryFlash('other-c', 20);
    ok('T13: the controller asks the SHARED global flash budget, not just its own debounce - 3 other flashes already filled the window, so even a brand-new request is refused',
      c.requestPulse(30) === false, '');
  }

  // ── mutants (string-splice the REAL bundle's own output, one edit each) ──────────────────
  function spliceFunction(src, fnName, find, replace) {
    const fnStart = src.indexOf(`function ${fnName}(`);
    if (fnStart < 0) return null;
    const fnEnd = src.indexOf('\n}', fnStart) + 2;
    const fnText = src.slice(fnStart, fnEnd);
    const mutatedFn = fnText.split(find).join(replace);
    if (mutatedFn === fnText) return null;
    return src.slice(0, fnStart) + mutatedFn + src.slice(fnEnd);
  }
  const mutantRuns = [
    { name: 'isThemeOpen drops its "current theme" clause', fn: 'isThemeOpen',
      find: "if (id === currentTheme) return true;\n", replace: '', expect: 'T1' },
    { name: 'isThemeOpen ignores the server\'s own open map (always false)', fn: 'isThemeOpen',
      find: 'return !!status?.open?.[id];', replace: 'return false;', expect: 'T2' },
    { name: 'wordsToUnlock drops its Math.max(0, ...) floor (could go negative)', fn: 'wordsToUnlock',
      find: 'return Math.max(0, threshold - (status?.wordsWritten ?? 0));', replace: 'return threshold - (status?.wordsWritten ?? 0);', expect: 'T5' },
    { name: 'FluxCardGlitchController drops its mid-pulse "no stacking" guard', fn: 'createFluxCardGlitchController',
      find: 'if (now < activeUntil) return false;\n', replace: '', expect: 'T11' },
  ];
  for (const m of mutantRuns) {
    const src = readFileSync(real.out, 'utf8');
    const mutatedSrc = spliceFunction(src, m.fn, m.find, m.replace);
    if (!mutatedSrc) { ok(`MUTANT "${m.name}": the edit landed`, false, `no match for the anchor inside ${m.fn}`); continue; }
    const mutPath = real.out.replace(/\.mjs$/, `.mut-${Math.random().toString(36).slice(2)}.mjs`);
    writeFileSync(mutPath, mutatedSrc);
    tmps.push(mutPath);
    let red = [];
    try {
      const mutMod = await import(pathToFileURL(mutPath).href + `?t=${Date.now()}-${Math.random()}`);
      const { themeUnlock: mUnlock, fluxCardGlitch: mGlitch, flashBudget: mBudget } = mutMod;
      if (m.expect === 'T1') {
        if (mUnlock.isThemeOpen('flux', STATUS, 'flux') !== true) red.push('T1');
      } else if (m.expect === 'T2') {
        if (mUnlock.isThemeOpen('machina', STATUS, 'plateau') !== true) red.push('T2');
      } else if (m.expect === 'T5') {
        if (mUnlock.wordsToUnlock('flux', overThreshold) !== 0) red.push('T5');
      } else if (m.expect === 'T11') {
        mBudget.__resetFlashBudget();
        const c = mGlitch.createFluxCardGlitchController(450);
        c.requestPulse(1000);
        if (c.requestPulse(1200) !== false) red.push('T11');
      }
    } catch (e) { red = ['THREW: ' + String(e).slice(0, 160)]; }
    ok(`MUTANT "${m.name}": the edit landed and turns ${m.expect} RED`, red.includes(m.expect), JSON.stringify({ red }));
  }
} catch (e) {
  ok('UNEXPECTED THROW (see detail)', false, String(e).slice(0, 300));
} finally {
  for (const t of tmps) rmSync(t, { recursive: true, force: true });
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nTHEME-PICKER-LOGIC VERIFY: PASS (${checks.length} checks)` : `\nTHEME-PICKER-LOGIC VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
