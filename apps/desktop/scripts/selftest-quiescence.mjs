// DF1.1 S2b — INSTRUMENT VALIDATION for j5's cell-list quiescence wait.
//
// WHY THIS EXISTS (Fable's ruling): thirteen j5 lens checks now depend on
// `waitCellsSettled` to synchronize before they read the cell list. That helper
// SWALLOWS its own timeout by design — so if its page-side predicate were ever
// vacuously true (returning satisfied on the first poll), the helper would
// silently become a no-op, the thirteen checks would go back to racing a
// re-render, and NOTHING would report it. A wait that cannot fail is not a wait.
// So the instrument is validated before the DoD's evidence is allowed to rest
// on it, the same standard chat 7 set for its aggregate scanner.
//
// It is deliberately NOT in scripts/harness/: the suite runner globs that
// directory, and a self-test is not a product assertion. Keeping it out means
// the 47-file suite composition — and therefore the DoD measurement — is
// unchanged by its existence.
//
// Run: node scripts/selftest-quiescence.mjs   (from apps/desktop)
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from './runtime-verify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Extract the predicate FROM j5.mjs rather than copying it here. A copied
// predicate would validate a duplicate and silently stop testing the real one
// the first time j5 changed; reading it means drift is structurally impossible.
const j5 = readFileSync(path.join(HERE, 'harness', 'j5.mjs'), 'utf8');
const m = j5.match(/await app\.waitFor\(`([\s\S]*?)`, \{ timeout: 3000, label: 'spread cell list settled' \}\)/);
if (!m) {
  console.error('SELFTEST FAIL: could not locate j5.mjs\'s quiescence predicate — it moved or was renamed.');
  console.error('That is itself a finding: this validator must be re-pointed, not deleted.');
  process.exit(1);
}
const PREDICATE = m[1];

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await withHarness(async (app) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });

  ok('the predicate under test was read from j5.mjs itself (no copy that could drift)',
    PREDICATE.includes('spread-cell') && PREDICATE.includes('__j5CellSnap'), PREDICATE.slice(0, 80).replace(/\s+/g, ' '));

  // Plant a controllable cell list. Real `.spread-cell` nodes are what the
  // predicate reads; where they come from is irrelevant to whether it can tell
  // "settled" from "still moving".
  const plant = (n) => app.evalJs(`(() => {
    document.querySelectorAll('.selftest-plant').forEach(e => e.remove());
    for (let i = 0; i < ${n}; i++) {
      const d = document.createElement('div');
      d.className = 'spread-cell selftest-plant';
      d.dataset.pageId = 'plant-' + i;
      document.body.appendChild(d);
    }
    return document.querySelectorAll('.spread-cell').length;
  })()`);

  // Poll the predicate exactly as app.waitFor does (100ms), and report how long
  // it took to go true — or that it never did.
  const pollPredicate = async (budgetMs) => {
    const t0 = Date.now();
    for (let i = 0; i < budgetMs / 100; i++) {
      if (await app.evalJs(`!!(${PREDICATE})`)) return { settled: true, ms: Date.now() - t0 };
      await sleep(100);
    }
    return { settled: false, ms: Date.now() - t0 };
  };

  // ── DIRECTION 1 — a STATIC list must settle, and quickly. Proves the
  //    predicate is not stuck-false (which would make every lens check wait the
  //    full 3s and then proceed anyway — slow, but not wrong).
  {
    await plant(3);
    await app.evalJs('window.__j5CellSnap = undefined');
    const r = await pollPredicate(3000);
    ok('DIRECTION 1 — a STATIC cell list settles: the predicate goes true (and does so fast, on the 2nd poll: one to record, one to match)',
      r.settled === true && r.ms <= 800, JSON.stringify(r));
  }

  // ── DIRECTION 2 — THE ONE THAT MATTERS. A list that never stops changing
  //    must NEVER satisfy the predicate. If it does, the helper is vacuous and
  //    the thirteen checks that lean on it are unsynchronized without saying so.
  {
    await plant(3);
    await app.evalJs(`(() => {
      let n = 0;
      window.__selftestChurn = setInterval(() => {
        const cells = document.querySelectorAll('.selftest-plant');
        if (cells[0]) cells[0].dataset.pageId = 'churn-' + (n++);
      }, 50); // faster than the 100ms poll, so no two consecutive samples can match
      return true;
    })()`);
    await app.evalJs('window.__j5CellSnap = undefined');
    const r = await pollPredicate(3000);
    ok('DIRECTION 2 — a NEVER-SETTLING cell list NEVER satisfies the predicate: the wait genuinely fails instead of returning satisfied (a wait that cannot fail is not a wait)',
      r.settled === false, JSON.stringify(r));
    await app.evalJs('clearInterval(window.__selftestChurn); document.querySelectorAll(".selftest-plant").forEach(e => e.remove());');
  }

  // ── DIRECTION 3 — and it RECOVERS: once the churn stops, it settles again.
  //    Proves direction 2's failure was the churn, not a latched dead state.
  {
    await plant(3);
    await app.evalJs('window.__j5CellSnap = undefined');
    const r = await pollPredicate(3000);
    ok('DIRECTION 3 — once the churn stops the predicate settles again: direction 2 failed because of the movement, not because the instrument latched',
      r.settled === true && r.ms <= 800, JSON.stringify(r));
    await app.evalJs('document.querySelectorAll(".selftest-plant").forEach(e => e.remove());');
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nQUIESCENCE SELFTEST: PASS (${checks.length} checks) — the helper discriminates settled from moving, in both directions`
  : `\nQUIESCENCE SELFTEST: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
