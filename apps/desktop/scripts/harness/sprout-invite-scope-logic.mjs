// SPROUT-INVITE-SCOPE, THE LOGIC HALF (page-readiness survey item 1, Oct 21) — browserless,
// proven against the REAL source (esbuild-bundled fresh, same technique as client-node.mjs's
// own loadClientStore, extended here to reach into src/components/ as well as src/store/).
//
// THE BUG: useFirstLineInvite's opt-in pref persisted behind ONE bare, device-wide localStorage
// key with zero account scoping — on a shared device, one account's choice silently governed
// every other account's first blank page the moment they signed in.
//
// What is proven, calling the module's own exported `prefKeyFor` / `migrateStaleOn` /
// `migrateToScopedKey` / `readPref` directly (no React render, no DOM — these four never touch
// a hook or JSX):
//   S1 a signed-out device (no account) keeps today's bare-key behavior unchanged
//   S2 the FIRST account to sign in after this ships inherits whatever the bare key already
//      held (the one-time move), and the bare key is consumed (removed) by that move
//   S3 OWNERSHIP: a SECOND, different account signing in afterward reads its own key — 'off',
//      never account A's value (the bare key is already empty by the time B asks)
//   S4 account A's own pref (written after the move) and account B's own pref are independent
//      in BOTH directions
//   S5 a signed-out write AFTER an account has already migrated starts a fresh bare-key history
//      of its own (does not resurrect into anyone's scoped key)
//   S6 A DELIBERATE value already on an account's OWN scoped key is NEVER clobbered by a later
//      bare-key leftover (the migration's "scoped key is empty" guard)
//   S7 FX16 regression: a stale pre-FX15 bare 'on' (no migration marker) is still retired before
//      any scoping decision, migrating or not — unchanged by this ticket
//   S8 Fable's review (ledger 124), THE RACE: a read taken BEFORE a sign-in resolves (the
//      useFirstLineInvite hook's own mount-time readPref() call, which always runs before
//      App.tsx's async apiMe() can possibly have resolved) must not permanently strand a later
//      write on the wrong key. Re-running readPref() AFTER the user becomes known - what the
//      hook's own currentUser subscription (added in response to this review) does - correctly
//      migrates/resolves to the SAME key a subsequent write would land on.
//   MUTANTS (each is the bundle with ONE text edit, must turn its named case RED):
//       migrateToScopedKey not removing the bare key after the move (S3 red — the leak this
//       ticket exists to fix)
//       the "scoped key is empty" guard dropped, so the move always overwrites (S6 red)
//       prefKeyFor not suffixing by user id at all (S3 red)
//
// Run (from the repo root, no server/grant needed):
//   node apps/desktop/scripts/harness/sprout-invite-scope-logic.mjs
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

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(String(k)); },
    clear: () => { m.clear(); },
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

// Bundles components/useFirstLineInvite + store/currentUser TOGETHER (one esbuild entry, one
// module graph) so both modules share the SAME `current` singleton inside currentUser.ts —
// exactly like loadClientStore's own entry-file technique in client-node.mjs, extended to reach
// a component file (its JSX compiles fine via esbuild's react-jsx transform; the JSX itself is
// never REACHED because this harness never calls the hook function, only its four standalone
// exports, so no React render ever happens and no DOM is needed).
function bundle() {
  const pnpmDir = join(ROOT, 'node_modules', '.pnpm');
  const esbuildPkg = existsSync(pnpmDir) ? readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)) : null;
  const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
  if (!esbuildBin || !existsSync(esbuildBin)) throw new Error('esbuild not found under node_modules/.pnpm');
  const tmp = mkdtempSync(join(tmpdir(), 'wz-sprout-'));
  const entry = join(tmp, 'entry.ts');
  writeFileSync(entry, [
    `export * as invite from '${SRC}/components/useFirstLineInvite';`,
    `export * as currentUser from '${SRC}/store/currentUser';`,
  ].join('\n'));
  const out = join(tmp, 'bundle.mjs');
  execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error',
    '--external:@fontsource/*', '--external:@fontsource-variable/*', '--define:import.meta.env.DEV=false', '--define:import.meta.env.PROD=true',
    '--define:import.meta.env.MODE="production"'], { stdio: 'pipe' });
  return { tmp, out };
}

async function loadFresh() {
  const { tmp, out } = bundle();
  const mod = await import(pathToFileURL(out).href + `?t=${Date.now()}-${Math.random()}`);
  return { mod, tmp, out };
}

// ARCHIVED PARK (#13 step 14): archive/sprout-invite-scope-logic.mjs.parked.md record 1
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const srcFiles = walk(SRC).filter((p) => /\.(ts|tsx)$/.test(p));
const moduleGone = !existsSync(join(SRC, 'components', 'useFirstLineInvite.tsx'));
// code, not prose: an import of the module, and the key as a string literal (a comment that still names either is history)
const importers = srcFiles.filter((p) => /(from|import\()\s*['"][^'"]*useFirstLineInvite['"]/.test(readFileSync(p, 'utf8')));
const keyReaders = srcFiles.filter((p) => /['"`]wrizo-first-line-invite/.test(readFileSync(p, 'utf8')));
const newTruth = moduleGone && importers.length === 0 && keyReaders.length === 0;
ok('R1 [12f successor]: the first-line invite module is gone and nothing imports it', moduleGone && importers.length === 0, JSON.stringify({ moduleGone, importers }));
ok('R2 [12f successor]: no source file names the invite\'s stored keys (wrizo-first-line-invite*) - no code reads, migrates or deletes them; the data stays as stored', keyReaders.length === 0, JSON.stringify({ keyReaders }));
if (process.env.HARNESS_PARKED === '1') {
  const parked = [];
  const pok = (name, pass, detail = '') => { parked.push({ name, pass }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };
  pok('PARKED (was "S1: signed out, bare key \"on\" reads \"on\" unchanged (no scoping applies with no account)") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S2: the first account (A) to sign in inherits the bare key\'s \"on\"") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S2: the bare key is CONSUMED by the move (removed), not just copied") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S2: A\'s own scoped key now holds the moved value") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S3 (the whole ticket): a second account (B) signing in afterward gets \"off\", never A\'s \"on\" — the leak this ticket exists to close") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S4: A\'s own pref is untouched by B\'s later opt-in") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S4: B\'s own pref is independent of A\'s") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S5: a fresh signed-out write to the (now-empty) bare key reads back as its own value") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S5: it does NOT resurrect into account A\'s already-settled \"on\" — A\'s scoped key already existed, so the move never ran") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S6: an account\'s OWN already-set pref (\"never\") is never overwritten by a bare-key leftover") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S7: FX16 unchanged — a stale pre-FX15 \"on\" with no marker is retired to \"off\" for a signed-out read") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "S8: a read taken before sign-in and a read taken after sign-in are consistent once re-run - the later read correctly reflects the signed-in user\'s own (now-migrated) key, matching where a write would land") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "MUTANT \"migrateToScopedKey never removes the bare key (the leak this ticket exists to fix)\": the edit landed and turns S3 RED") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "MUTANT \"the \"scoped key already set\" guard dropped (always overwrites)\": the edit landed and turns S6 RED") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "MUTANT \"prefKeyFor never suffixes by user id (always the bare key)\": the edit landed and turns S3 RED") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "MUTANT \"migrateToScopedKey is a complete no-op (seed the bare key, break the migration entirely)\": the edit landed and turns S2 RED") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  pok('PARKED (was "UNEXPECTED THROW (see detail)") — #13 12f (Fable, Nov 1): the invite and its scoping logic are deleted; re-asserted against the new truth: no module, no reader of the keys', newTruth, JSON.stringify({ moduleGone, importers: importers.length, keyReaders: keyReaders.length }));
  const pbad = parked.filter((c) => !c.pass).length;
  console.log(pbad === 0 ? `\nSPROUT-INVITE-SCOPE-LOGIC PARKED: PASS (${parked.length} checks) — HARNESS_PARKED=1 armed; retired by #13 12f` : `\nSPROUT-INVITE-SCOPE-LOGIC PARKED: FAIL — ${pbad}/${parked.length} failed`);
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nSPROUT-INVITE-SCOPE-LOGIC VERIFY: PASS (${checks.length} checks)` : `\nSPROUT-INVITE-SCOPE-LOGIC VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
