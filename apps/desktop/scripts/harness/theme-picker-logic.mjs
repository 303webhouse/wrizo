// THEME PICKER, THE LOGIC HALF (step 2 of the Oct 21 build queue; theme-menu-brief.md /
// theme-rules.md §C). Browserless (no grant needed), proven against the REAL source
// (esbuild-bundled fresh, same technique client-node.mjs's own loadClientStore uses).
//
// What is proven, calling store/themeUnlock.ts's own exported `isThemeOpen` / `wordsToUnlock` /
// `fetchThemeUnlockStatus` directly (no React render, no DOM - the hook `useThemeUnlockStatus`
// is the only consumer that needs one, and isn't exercised here):
//   T1 the CURRENT theme is always open, regardless of word count or thresholds
//   T2 a theme is open once wordsWritten reaches its own threshold
//   T3 a theme below its threshold, not in themesOpened, and not current is LOCKED
//   T4 a theme already in themesOpened is open regardless of word count (the grandfather set)
//   T5 wordsToUnlock is threshold-minus-written, floored at 0 - never negative
//   T6 wordsToUnlock is 0 once a theme is open via its threshold
//   T7 a theme with no threshold entry at all (not yet built/priced) is never "open by count"
//   T8 fetchThemeUnlockStatus parses a real server response shape correctly
//   T9 fetchThemeUnlockStatus falls back to EMPTY on a non-ok response (signed out, no session)
//   T10 fetchThemeUnlockStatus falls back to EMPTY on a network failure (offline)
//   MUTANTS (each is the bundle with ONE text edit, must turn its named case RED):
//       isThemeOpen drops its "themesOpened" clause (T4 red - the grandfather set stops working)
//       isThemeOpen drops its "current theme" clause (T1 red)
//       wordsToUnlock drops its Math.max(0, ...) floor (T5 red - could go negative)
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
  writeFileSync(entry, `export * as themeUnlock from '${SRC}/store/themeUnlock';`);
  const out = join(tmp, 'bundle.mjs');
  execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error',
    '--external:@fontsource/*', '--external:@fontsource-variable/*', '--define:import.meta.env.DEV=false', '--define:import.meta.env.PROD=true',
    '--define:import.meta.env.MODE="production"'], { stdio: 'pipe' });
  return { tmp, out };
}

const STATUS = { wordsWritten: 450, themesOpened: { plateau: true }, thresholds: { plateau: 100, machina: 100, flux: 1000, nomad: 5000, volant: 20000 } };

const tmps = [];
try {
  const real = bundle();
  tmps.push(real.tmp);
  const mod = await import(pathToFileURL(real.out).href + `?t=${Date.now()}`);
  const { themeUnlock } = mod;

  // T1 — the current theme is always open
  ok('T1: the CURRENT theme is open regardless of word count or thresholds (flux, below its own 1000-word threshold, but it is the theme in use)',
    themeUnlock.isThemeOpen('flux', STATUS, 'flux') === true, '');

  // T2 — open via threshold
  ok('T2: a theme is open once wordsWritten reaches its own threshold (plateau: 450 >= 100)',
    themeUnlock.isThemeOpen('plateau', STATUS, 'machina') === true, '');

  // T3 — locked: below threshold, not grandfathered, not current
  ok('T3: a theme below its threshold, not in themesOpened, and not current is LOCKED (flux: 450 < 1000, not grandfathered, current theme is plateau)',
    themeUnlock.isThemeOpen('flux', STATUS, 'plateau') === false, '');

  // T4 — the grandfather set, independent of word count
  const lowCount = { wordsWritten: 0, themesOpened: { flux: true }, thresholds: { flux: 1000 } };
  ok('T4: a theme already in themesOpened is open regardless of word count (flux: 0 words, but grandfathered)',
    themeUnlock.isThemeOpen('flux', lowCount, 'plateau') === true, '');

  // T5 — wordsToUnlock: threshold - written, floored at 0
  ok('T5: wordsToUnlock is threshold-minus-written (flux: 1000 - 450 = 550)',
    themeUnlock.wordsToUnlock('flux', STATUS) === 550, String(themeUnlock.wordsToUnlock('flux', STATUS)));
  const overThreshold = { wordsWritten: 5000, themesOpened: {}, thresholds: { flux: 1000 } };
  ok('T5: wordsToUnlock never goes negative once written exceeds the threshold',
    themeUnlock.wordsToUnlock('flux', overThreshold) === 0, String(themeUnlock.wordsToUnlock('flux', overThreshold)));

  // T6 — wordsToUnlock is 0 once open via threshold
  ok('T6: wordsToUnlock is 0 once a theme is open via its own threshold (plateau: 450 >= 100)',
    themeUnlock.wordsToUnlock('plateau', STATUS) === 0, '');

  // T7 — no threshold entry at all (a theme not yet priced/built)
  const noThreshold = { wordsWritten: 999999, themesOpened: {}, thresholds: {} };
  ok('T7: a theme with no threshold entry at all is never "open by count" (not current, not grandfathered)',
    themeUnlock.isThemeOpen('volant', noThreshold, 'plateau') === false, '');

  // T8 — a real server response shape parses correctly
  {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ wordsWritten: 1234, themesOpened: { plateau: true }, thresholds: { flux: 1000 } }) });
    const parsed = await themeUnlock.fetchThemeUnlockStatus();
    globalThis.fetch = realFetch;
    ok('T8: fetchThemeUnlockStatus parses a real server response shape correctly',
      parsed.wordsWritten === 1234 && parsed.themesOpened.plateau === true && parsed.thresholds.flux === 1000, JSON.stringify(parsed));
  }

  // T9 — a non-ok response (signed out / no session) falls back to EMPTY
  {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: false, json: async () => { throw new Error('should never be read'); } });
    const parsed = await themeUnlock.fetchThemeUnlockStatus();
    globalThis.fetch = realFetch;
    ok('T9: a non-ok response (signed out, no session) falls back to EMPTY, never reading the body',
      parsed.wordsWritten === 0 && Object.keys(parsed.themesOpened).length === 0 && Object.keys(parsed.thresholds).length === 0, JSON.stringify(parsed));
  }

  // T10 — a network failure falls back to EMPTY
  {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new TypeError('offline'); };
    const parsed = await themeUnlock.fetchThemeUnlockStatus();
    globalThis.fetch = realFetch;
    ok('T10: a network failure (offline) falls back to EMPTY, not a crash',
      parsed.wordsWritten === 0 && Object.keys(parsed.themesOpened).length === 0, JSON.stringify(parsed));
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
    { name: 'isThemeOpen drops its "themesOpened" clause (the grandfather set stops working)', fn: 'isThemeOpen',
      find: "if (status.themesOpened?.[id]) return true;\n", replace: '', expect: 'T4' },
    { name: 'isThemeOpen drops its "current theme" clause', fn: 'isThemeOpen',
      find: "if (id === currentTheme) return true;\n", replace: '', expect: 'T1' },
    { name: 'wordsToUnlock drops its Math.max(0, ...) floor (could go negative)', fn: 'wordsToUnlock',
      find: 'return Math.max(0, threshold - (status.wordsWritten ?? 0));', replace: 'return threshold - (status.wordsWritten ?? 0);', expect: 'T5' },
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
      const { themeUnlock: mUnlock } = mutMod;
      if (m.expect === 'T4') {
        if (mUnlock.isThemeOpen('flux', lowCount, 'plateau') !== true) red.push('T4');
      } else if (m.expect === 'T1') {
        if (mUnlock.isThemeOpen('flux', STATUS, 'flux') !== true) red.push('T1');
      } else if (m.expect === 'T5') {
        if (mUnlock.wordsToUnlock('flux', overThreshold) !== 0) red.push('T5');
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
