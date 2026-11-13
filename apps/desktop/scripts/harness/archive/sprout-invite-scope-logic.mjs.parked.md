# Parked records archived from sprout-invite-scope-logic.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/sprout-invite-scope-logic.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from sprout-invite-scope-logic.mjs lines 96-295 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
// ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the first-line invite is deleted, everywhere, forever, and with it the
// scoping and migration logic this file proved (useFirstLineInvite.tsx no longer exists, so there is nothing to bundle). Its stored
// pref keys stay as data that no code reads, moves or removes. The scenario below is kept VERBATIM and no longer run; each of its
// checks has a record on the parked leg, re-asserted against the new truth; the live successor is the two source checks after it,
// and the browser half is c13-12f-sprout-invite.mjs.
// const tmps = [];
// try {
//   // ── the REAL bundle ──────────────────────────────────────────────────────────────────────
//   const real = await loadFresh();
//   tmps.push(real.tmp);
//   const { invite, currentUser } = real.mod;
//
//   const freshStorage = () => { globalThis.localStorage = memoryStorage(); };
//
//   // S1 — signed out: bare key behaves exactly as before this ticket
//   freshStorage();
//   currentUser.setCurrentUser(null);
//   localStorage.setItem(invite.PREF_KEY_BASE, 'on');
//   localStorage.setItem(invite.MIGRATED_KEY, '1'); // FX16 already migrated on this device
//   ok('S1: signed out, bare key "on" reads "on" unchanged (no scoping applies with no account)',
//     invite.readPref() === 'on', JSON.stringify({ bare: localStorage.getItem(invite.PREF_KEY_BASE) }));
//
//   // S2 — the FIRST account to sign in inherits the bare key's value; the bare key is consumed
//   freshStorage();
//   localStorage.setItem(invite.MIGRATED_KEY, '1');
//   localStorage.setItem(invite.PREF_KEY_BASE, 'on');
//   currentUser.setCurrentUser({ id: 'user-A', email: 'a@example.com' });
//   const afterA = invite.readPref();
//   ok('S2: the first account (A) to sign in inherits the bare key\'s "on"',
//     afterA === 'on', JSON.stringify({ afterA }));
//   ok('S2: the bare key is CONSUMED by the move (removed), not just copied',
//     localStorage.getItem(invite.PREF_KEY_BASE) === null, JSON.stringify({ bare: localStorage.getItem(invite.PREF_KEY_BASE) }));
//   ok('S2: A\'s own scoped key now holds the moved value',
//     localStorage.getItem(invite.prefKeyFor('user-A')) === 'on', JSON.stringify({ scopedA: localStorage.getItem(invite.prefKeyFor('user-A')) }));
//
//   // S3 — OWNERSHIP: a SECOND, different account reads its OWN key, never A's — the bare key is
//   // already empty (S2 consumed it), so there is nothing left to leak
//   currentUser.setCurrentUser({ id: 'user-B', email: 'b@example.com' });
//   const bRead = invite.readPref();
//   ok('S3 (the whole ticket): a second account (B) signing in afterward gets "off", never A\'s "on" — the leak this ticket exists to close',
//     bRead === 'off', JSON.stringify({ bRead }));
//
//   // S4 — independence in both directions: B opts in, A's own value is untouched
//   localStorage.setItem(invite.prefKeyFor('user-B'), 'on');
//   currentUser.setCurrentUser({ id: 'user-A', email: 'a@example.com' });
//   ok('S4: A\'s own pref is untouched by B\'s later opt-in',
//     invite.readPref() === 'on', JSON.stringify({ a: invite.readPref(), scopedB: localStorage.getItem(invite.prefKeyFor('user-B')) }));
//   currentUser.setCurrentUser({ id: 'user-B', email: 'b@example.com' });
//   ok('S4: B\'s own pref is independent of A\'s',
//     invite.readPref() === 'on', JSON.stringify({ b: invite.readPref() }));
//
//   // S5 — a signed-out write AFTER an account has migrated starts its OWN fresh bare-key history
//   // (does not resurrect into any account's scoped key, since migrateToScopedKey only ever runs
//   // for a SIGNED-IN read)
//   currentUser.setCurrentUser(null);
//   localStorage.setItem(invite.PREF_KEY_BASE, 'never');
//   ok('S5: a fresh signed-out write to the (now-empty) bare key reads back as its own value',
//     invite.readPref() === 'never', JSON.stringify({ bare: localStorage.getItem(invite.PREF_KEY_BASE) }));
//   currentUser.setCurrentUser({ id: 'user-A', email: 'a@example.com' });
//   ok('S5: it does NOT resurrect into account A\'s already-settled "on" — A\'s scoped key already existed, so the move never ran',
//     invite.readPref() === 'on', JSON.stringify({ a: invite.readPref() }));
//
//   // S6 — a DELIBERATE value on an account's OWN key survives a later bare-key leftover: a fresh
//   // account C has explicitly set 'never' on its own key; the bare key (left over from some other
//   // flow) holds 'on'. The migration must NOT clobber C's own explicit choice.
//   freshStorage();
//   localStorage.setItem(invite.MIGRATED_KEY, '1');
//   localStorage.setItem(invite.prefKeyFor('user-C'), 'never');
//   localStorage.setItem(invite.PREF_KEY_BASE, 'on');
//   currentUser.setCurrentUser({ id: 'user-C', email: 'c@example.com' });
//   ok('S6: an account\'s OWN already-set pref ("never") is never overwritten by a bare-key leftover',
//     invite.readPref() === 'never', JSON.stringify({ c: invite.readPref(), bareStillThere: localStorage.getItem(invite.PREF_KEY_BASE) }));
//
//   // S7 — FX16 regression: a stale pre-FX15 bare 'on' (no marker) is still retired first, whether
//   // or not an account signs in afterward
//   freshStorage();
//   localStorage.removeItem(invite.MIGRATED_KEY);
//   localStorage.setItem(invite.PREF_KEY_BASE, 'on');
//   currentUser.setCurrentUser(null);
//   ok('S7: FX16 unchanged — a stale pre-FX15 "on" with no marker is retired to "off" for a signed-out read',
//     invite.readPref() === 'off', JSON.stringify({ bare: localStorage.getItem(invite.PREF_KEY_BASE), marker: localStorage.getItem(invite.MIGRATED_KEY) }));
//
//   // S8 — THE RACE (Fable's review, ledger 124): a read taken BEFORE sign-in resolves, then a
//   // sign-in, then a SECOND read (what the hook's own currentUser subscription now performs) -
//   // the second read must land on the SAME key a write made after it would use.
//   freshStorage();
//   localStorage.setItem(invite.MIGRATED_KEY, '1');
//   localStorage.setItem(invite.PREF_KEY_BASE, 'on');
//   currentUser.setCurrentUser(null);                      // the hook's own mount: auth not resolved yet
//   const earlyRead = invite.readPref();
//   currentUser.setCurrentUser({ id: 'user-D', email: 'd@example.com' });  // auth resolves moments later
//   const lateRead = invite.readPref();                     // the subscription's own re-read
//   const writeKey = invite.prefKeyFor(currentUser.getCurrentUser()?.id ?? null);  // what a click (optIn) would target NOW
//   ok('S8: a read taken before sign-in and a read taken after sign-in are consistent once re-run - the later read correctly reflects the signed-in user\'s own (now-migrated) key, matching where a write would land',
//     earlyRead === 'on' && lateRead === 'on' && writeKey === invite.prefKeyFor('user-D') && localStorage.getItem(invite.prefKeyFor('user-D')) === 'on',
//     JSON.stringify({ earlyRead, lateRead, writeKey, scopedD: localStorage.getItem(invite.prefKeyFor('user-D')), bare: localStorage.getItem(invite.PREF_KEY_BASE) }));
//
//   // ── mutants (string-splice the REAL bundle's own output, one edit each) ──────────────────
//   // Each mutant edits ONE function's body in isolation (sliced out by name, so a replace that
//   // would also match text in an unrelated function never lands in the wrong place) and re-runs
//   // both the S3 and S6 scenarios against the mutated bundle.
//   function spliceFunction(src, fnName, find, replace) {
//     const fnStart = src.indexOf(`function ${fnName}(`);
//     if (fnStart < 0) return null;
//     const fnEnd = src.indexOf('\n}', fnStart) + 2;
//     const fnText = src.slice(fnStart, fnEnd);
//     const mutatedFn = fnText.split(find).join(replace);
//     if (mutatedFn === fnText) return null;
//     return src.slice(0, fnStart) + mutatedFn + src.slice(fnEnd);
//   }
//
//   const mutantRuns = [
//     {
//       name: 'migrateToScopedKey never removes the bare key (the leak this ticket exists to fix)',
//       fn: 'migrateToScopedKey',
//       find: 'localStorage.removeItem(PREF_KEY_BASE);',
//       replace: '/* removed by mutant */;',
//       expectRed: ['S3'],
//     },
//     {
//       name: 'the "scoped key already set" guard dropped (always overwrites)',
//       fn: 'migrateToScopedKey',
//       find: 'localStorage.getItem(scopedKey) == null',
//       replace: 'true',
//       expectRed: ['S6'],
//     },
//     {
//       name: 'prefKeyFor never suffixes by user id (always the bare key)',
//       fn: 'prefKeyFor',
//       find: 'return userId ? `${PREF_KEY_BASE}:${userId}` : PREF_KEY_BASE;',
//       replace: 'return PREF_KEY_BASE;',
//       expectRed: ['S3'],
//     },
//     // Fable's review (ledger 124): sprout-invite-scope.mjs's own PARKED checks now accept a
//     // null bare key as "nothing to migrate" (a signed-in session can legitimately find it
//     // already consumed by an earlier readPref() call). This mutant proves that loosening did
//     // NOT also make the mechanism blind to a bare value that genuinely never migrates at all -
//     // seed the bare key, break the migration completely (not just its own cleanup step, which
//     // the first mutant above already covers), confirm red: with the move disabled outright, the
//     // FIRST account to sign in never inherits the bare key's value at all (S2 fails), which is
//     // what the PARKED check's own leniency relies on NEVER happening undetected - the successor
//     // (reading the real resolved value, not the bare key) is what actually catches this, and
//     // this mutant is the proof that it does.
//     {
//       name: 'migrateToScopedKey is a complete no-op (seed the bare key, break the migration entirely)',
//       fn: 'migrateToScopedKey',
//       find: 'bare != null && localStorage.getItem(scopedKey) == null',
//       replace: 'false',
//       expectRed: ['S2'],
//     },
//   ];
//
//   for (const m of mutantRuns) {
//     const src = readFileSync(real.out, 'utf8');
//     const mutatedSrc = spliceFunction(src, m.fn, m.find, m.replace);
//     if (!mutatedSrc) { ok(`MUTANT "${m.name}": the edit landed`, false, `no match for "${m.find}" inside ${m.fn}`); continue; }
//     const mutPath = real.out.replace(/\.mjs$/, `.mut-${Math.random().toString(36).slice(2)}.mjs`);
//     writeFileSync(mutPath, mutatedSrc);
//     tmps.push(mutPath);
//     let red = [];
//     try {
//       const mutMod = await import(pathToFileURL(mutPath).href + `?t=${Date.now()}-${Math.random()}`);
//       const { invite: mInvite, currentUser: mCurrentUser } = mutMod;
//
//       // S2's own scenario, against the mutant - "seed the bare key, break the migration -> red"
//       globalThis.localStorage = memoryStorage();
//       localStorage.setItem(mInvite.MIGRATED_KEY, '1');
//       localStorage.setItem(mInvite.PREF_KEY_BASE, 'on');
//       mCurrentUser.setCurrentUser({ id: 'user-A', email: 'a@example.com' });
//       if (mInvite.readPref() !== 'on') red.push('S2'); // the first account must still inherit the bare key's value
//
//       // S3's own scenario, against the mutant
//       globalThis.localStorage = memoryStorage();
//       localStorage.setItem(mInvite.MIGRATED_KEY, '1');
//       localStorage.setItem(mInvite.PREF_KEY_BASE, 'on');
//       mCurrentUser.setCurrentUser({ id: 'user-A', email: 'a@example.com' });
//       mInvite.readPref();
//       mCurrentUser.setCurrentUser({ id: 'user-B', email: 'b@example.com' });
//       if (mInvite.readPref() === 'on') red.push('S3'); // B must never read A's leaked value
//
//       // S6's own scenario, against the mutant
//       globalThis.localStorage = memoryStorage();
//       localStorage.setItem(mInvite.MIGRATED_KEY, '1');
//       localStorage.setItem(mInvite.prefKeyFor('user-C'), 'never');
//       localStorage.setItem(mInvite.PREF_KEY_BASE, 'on');
//       mCurrentUser.setCurrentUser({ id: 'user-C', email: 'c@example.com' });
//       if (mInvite.readPref() !== 'never') red.push('S6');
//     } catch (e) { red = ['THREW: ' + String(e).slice(0, 160)]; }
//     ok(`MUTANT "${m.name}": the edit landed and turns ${m.expectRed.join(' + ')} RED`,
//       m.expectRed.every((x) => red.includes(x)), JSON.stringify({ red }));
//   }
// } catch (e) {
//   // A red-on-main run (the exports genuinely missing) throws past whichever check first called
//   // a function that doesn't exist yet - this still counts as red (caught here, not swallowed)
//   // rather than crashing node mid-suite.
//   ok('UNEXPECTED THROW (see detail)', false, String(e).slice(0, 300));
// } finally {
//   for (const t of tmps) rmSync(t, { recursive: true, force: true });
// }
// ------------------------------------------------------------------
```
