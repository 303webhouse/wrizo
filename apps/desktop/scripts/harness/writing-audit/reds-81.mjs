// RED-FIRST CHECK for #81 (CAN LOSE TEXT): a second window that was on a page when the first window SIGNED OUT. The sign-out sets a flag every window shares and wipes the store; the other window is never told, keeps the page
// open, accepts typing, and saves none of it (core.ts refuses every write while the flag is set). RULED (Fable, Nov 11): the other window hears the sign-out and LEAVES THE PAGE AT ONCE.
// SU1  window A signs out (the real Sign out button, then "Sign out anyway" when the window offers it). Window B, which was on the same page, must leave it: no writing editor on screen, so no typing is accepted into a page that
//      saves nothing. The case also types into B if its editor is still there and reports what was lost: the words B shows against what the store holds.
// RED on f28fd12e today (B stays on the page, takes the typing, the store holds nothing of it). GREEN when the other window hears the sign-out.
// Run: node scripts/harness/writing-audit/reds-81.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-81.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
import { runTabs } from './lib/tabs-common.mjs';

const j = JSON.stringify;

await runTabs({
  title: 'RED-81',
  cases: async (h) => {
    const { run, sleep, ev, d } = h;
    const B = "document.getElementById('wa-tab-b')";
    const bState = () => ev(`(() => { try { const w = ${B}.contentWindow, doc = w.document; return JSON.stringify({ hash: w.location.hash, editor: !!doc.querySelector('.forward-only-editor'), flag: w.localStorage.getItem('wz.signedOutHere') }); } catch (e) { return 'ERR ' + e.message; } })()`);
    await run('SU1', '#81: window A signs out; window B, on the same page, must leave it at once (it must not keep taking typing that saves nothing)', async (fails, notes) => {
      const pid = `wa-su1-${Date.now().toString(36)}`;
      await h.mkPage(pid, 'Base. '); await h.openA(pid); await h.tabB();
      const before = JSON.parse(await bState());
      notes.push(`B before: ${j(before)}`);
      if (!before.editor) { fails.push(`window B was not on the page before the sign-out: ${j(before)}`); return; }
      // A signs out through the real button; a blocked sign-out (unsaved words) is confirmed
      await ev(`window.focus(); (() => { const m = document.querySelector('[aria-label="Desk menu"]'); if (m && !document.querySelector('.gh-corner-menu')) m.click(); return !!m; })()`);   // framed pages keep Sign out in the Desk menu
      await sleep(500);
      const clicked = await ev(`(() => { const all = [...document.querySelectorAll('button')]; const b = all.find((x) => /^sign out$/i.test(x.textContent.trim())); if (b) b.click(); return JSON.stringify({ found: !!b, buttons: all.map((x) => (x.getAttribute('aria-label') || x.textContent || '').trim().slice(0, 24)).filter(Boolean).slice(0, 30) }); })()`);
      notes.push(`sign-out press: ${clicked}`);
      const t0 = Date.now();
      let flagged = false;
      while (!flagged && Date.now() - t0 < 12000) {
        flagged = (await ev("localStorage.getItem('wz.signedOutHere')")) === '1';
        if (!flagged) {
          const any = await ev(`(() => { const a = document.querySelector('.wz-logout-anyway'); if (a) { a.click(); return 'anyway'; } const c = document.querySelector('.wz-logout-confirm'); if (c) { c.click(); return 'confirm'; } return ''; })()`);
          if (any) notes.push(`A offered the blocked sheet: pressed ${any}`);
          await sleep(400);
        }
      }
      if (!flagged) { fails.push('harness: window A never signed out (no flag set after 12 s)'); return; }
      await sleep(2500);
      const aHash = await ev('location.hash');
      const after = JSON.parse(await bState());
      notes.push(`A at ${aHash}; B after the sign-out: ${j(after)}`);
      if (after.editor) fails.push(`window B still shows the writing page after window A signed out (B at ${after.hash}); a second window must leave the page at once`);
      if (after.editor) {
        await h.tabFocus('B'); await d.type(' typed after the sign-out');
        await sleep(3500);
        const shown = await h.shows('B');
        const stored = await ev(`(() => { try { const r = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === ${j(pid)}); return r ? r.text : null; } catch (e) { return 'ERR'; } })()`);
        const line = `B accepted the typing and shows ${j(shown)}; the store holds ${j(stored)}`;
        notes.push(line);
        console.log(`LOSS-81 ${line}`);
        if (!String(stored || '').includes('typed after the sign-out')) fails.push(`WORDS LOST: ${line}`);
      }
    });
  },
});
