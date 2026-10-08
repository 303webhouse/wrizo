// LOGOUT FLUSH — the live walk. Authored, NOT run: it needs a box turn from chat 1.
// Runs on runtime-verify's test double WITHOUT WS_ANON (the app boots signed in).
//
// The point is to prove the REGISTRY, not the blur flush. Clicking a button normally blurs the editor, and the
// editors flush on blur — so a plain click would save the typing by another route. The walk stops the Sign out
// click from taking focus (a capture-phase mousedown preventDefault), so the editor is still focused and its 2 s
// debounce is still pending when handleLogout runs. Only flushAll() can then put the typing in a record.
//
//   1. type in the sprint, press Sign out inside the 2 s debounce, sync failing: the sheet counts the typing.
//   2. "Sign out anyway" -> the device signs out; wait past the debounce AND the unmount: nothing was written
//      back into the wiped device (no dirty record, no draft).
//
// Run: WS_BOX_TURN=<token> node scripts/harness/logout-flush-walk.mjs   (from apps/desktop)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
// Printed as each check runs, so a failure part-way through still shows what came before it.
const ok = (name, pass, detail = '') => {
  checks.push({ name, pass, detail });
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : ' | ' + String(detail).slice(0, 200))); // eslint-disable-line no-console
};

await withHarness(async (app) => {
  await app.freshSprint();

  // The sync cannot reach the account, so whatever is typed stays unsaved.
  await app.evalJs(`
    const realFetch = window.fetch.bind(window);
    window.fetch = (u, o) => (String(u).includes('/api/sync') ? Promise.reject(new Error('offline (walk)')) : realFetch(u, o));
    // A press on a button must NOT take focus from the editor — that would trigger the blur flush and hide what is being tested.
    document.addEventListener('mousedown', (e) => { if (e.target instanceof Element && e.target.closest('button')) e.preventDefault(); }, true);
    const ed = document.querySelector('.forward-only-editor, textarea');
    ed.focus();
    window.__editor = ed;
    true;
  `);
  const dirtyCount = () => app.evalJs(`Object.values(window.wrizoDirty.ids()).reduce((n, ids) => n + ids.length, 0)`);
  ok('(L0) nothing is unsaved before the walk types', (await dirtyCount()) === 0, String(await dirtyCount()));

  // 1. Type, then press Sign out well inside the 2 s debounce.
  await app.typeKeys('words typed just before sign out');
  const typedAt = Date.now();
  const stillFocused = await app.evalJs('document.activeElement === window.__editor');
  ok('(L1) the editor still has focus (so no blur flush can save the typing)', stillFocused === true, '');
  ok('(L2) and nothing is in a record yet — the typing is only in the editor\'s memory', (await dirtyCount()) === 0, String(await dirtyCount()));
  await app.click('Sign out');
  const clickedAfter = Date.now() - typedAt;
  await app.waitFor(`!!document.querySelector('.wz-logout-sheet')`, { timeout: 12000, label: 'the sheet, counting the typing' });
  ok('(L3) the press came inside the 2 s debounce', clickedAfter < 1900, String(clickedAfter));
  const sheetText = await app.evalJs(`document.querySelector('.wz-logout-sheet-body')?.textContent || ''`);
  ok('(L4) THE REGISTRY: the sheet counts the typing as unsaved (it would have signed out silently without the flush)',
    /(\d+) changes? ha(ven|sn).t saved/.test(sheetText) || /1 change hasn.t saved/.test(sheetText), sheetText);
  ok('(L5) and the typing is now a dirty record', (await dirtyCount()) >= 1, String(await dirtyCount()));
  ok('(L6) the writer is still signed in (the sign-out was refused)',
    (await app.evalJs(`fetch('/auth/me', { credentials: 'include' }).then((r) => r.ok)`)) === true, '');

  // 2. Sign out anyway: nothing may be written back into the wiped device afterwards.
  await app.click('Sign out anyway');
  await app.click('Yes, sign out and lose');
  await app.waitFor(`!!document.querySelector('.wz-arrival input.wz-field')`, { timeout: 12000, label: 'signed out, on the sign-in screen' });
  await sleep(3500); // past the 2 s debounce, and past the editor's unmount flush, which runs AFTER the wipe
  const after = await dirtyCount();
  const draftsLeft = await app.evalJs(`window.wrizoDirty.records().drafts.length + window.wrizoDirty.records().journalEntries.length`);
  ok('(L7) THE BELT AND THE FLUSH: after the wipe and the unmount, no record was written back (nothing dirty)', after === 0, String(after));
  ok('(L8) and no draft or page was recreated in the wiped device', draftsLeft === 0, String(draftsLeft));
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nLOGOUT-FLUSH-WALK VERIFY: PASS (${checks.length} checks)`
  : `\nLOGOUT-FLUSH-WALK VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
