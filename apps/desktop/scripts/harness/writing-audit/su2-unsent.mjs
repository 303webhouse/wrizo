// MEASURE (#81, Fable's case): window B types and its words are SAVED ON THIS DEVICE but NOT PUSHED to the account (the sync is made to refuse every push); window A signs out. What happens to B's words?
//   - does A's sign-out notice them and refuse ("unsaved" sheet), or does it go through and wipe them?
//   - after it: are they in this device's store, did the account ever receive them (the harness server records every pushed page id)?
// Then, when the door allows it, she signs in again and the page is looked for. It prints UNSENT lines and never fails.
// Run: node scripts/harness/writing-audit/su2-unsent.mjs (on Actions via writing-audit.yml, script=su2-unsent.mjs)
import { runTabs } from './lib/tabs-common.mjs';

const j = JSON.stringify;

await runTabs({
  title: 'UNSENT-81',
  cases: async (h) => {
    const { run, sleep, ev } = h;
    const B = "document.getElementById('wa-tab-b')";
    await run('SU2', '#81 case: B types (saved here, not pushed); A signs out', async (fails, notes) => {
      const pid = `wa-su2-${Date.now().toString(36)}`;
      const WORDS = ' UNSENT WORDS from window B.';
      await h.mkPage(pid, 'Base. '); await h.openA(pid); await h.tabB();
      // the account refuses every push from here on: what B types can only be on this device
      await ev(`fetch('/api/_sync_mode', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fail: true }) }).then((r) => r.status)`);
      await h.typeIn('B', WORDS);
      await sleep(4500);   // B's autosave (2 s) and the store write (0.3 s), with margin; the push is refused
      const stored = () => ev(`(() => { try { const r = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === ${j(pid)}); return r ? r.text : null; } catch (e) { return 'ERR'; } })()`);
      const dirtyB = await ev(`(() => { try { const w = ${B}.contentWindow; return JSON.stringify(w.wrizoDirty ? w.wrizoDirty.ids().journalEntries : 'no seam'); } catch (e) { return 'ERR ' + e.message; } })()`);
      const dirtyA = await ev(`JSON.stringify(window.wrizoDirty ? window.wrizoDirty.ids().journalEntries : 'no seam')`);
      const before = await stored();
      const line0 = `before the sign-out: the store holds ${j(before)}; B's dirty list ${dirtyB}; A's dirty list ${dirtyA}`;
      console.log(`UNSENT ${line0}`); notes.push(line0);
      // A signs out through the real button
      await ev(`window.focus(); (() => { const m = document.querySelector('[aria-label="Desk menu"]'); if (m && !document.querySelector('.gh-corner-menu')) m.click(); return !!m; })()`);
      await sleep(500);
      await ev(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /^sign out$/i.test(x.textContent.trim())); if (b) b.click(); return !!b; })()`);
      const t0 = Date.now(); let outcome = 'nothing happened in 14 s', sheet = null;
      while (Date.now() - t0 < 14000) {
        const flagged = (await ev("localStorage.getItem('wz.signedOutHere')")) === '1';
        sheet = await ev(`(() => { const s = document.querySelector('.wz-logout-sheet'); return s ? s.textContent.trim().slice(0, 300) : null; })()`);
        if (sheet) { outcome = 'A REFUSED the sign-out and showed the unsaved sheet'; break; }
        if (flagged) { outcome = 'A SIGNED OUT with no warning'; break; }
        await sleep(300);
      }
      const line1 = `${outcome}${sheet ? `: ${j(sheet)}` : ''}`;
      console.log(`UNSENT ${line1}`); notes.push(line1);
      await sleep(3000);
      const afterStore = await stored();
      const state = await ev(`fetch('/api/_state').then((r) => r.json()).then((s) => JSON.stringify({ pushed: s.pushedJournalIds, syncs: s.syncCount }))`);
      const bNow = await ev(`(() => { try { const w = ${B}.contentWindow; return JSON.stringify({ hash: w.location.hash, shows: (w.__wa && w.__wa.read) ? w.__wa.read().text : null }); } catch (e) { return 'ERR ' + e.message; } })()`);
      const line2 = `after: the store holds ${j(afterStore)}; the account received (pushed page ids) ${state}; window B is ${bNow}; the page ${state.includes(pid) ? 'WAS' : 'was NOT'} pushed`;
      console.log(`UNSENT ${line2}`); notes.push(line2);
      const words = String(before || '').includes('UNSENT WORDS');
      console.log(`UNSENT RESULT: B's words ${words ? 'were on this device' : 'were never saved on this device (harness problem)'}; ${outcome}; after it the store holds ${afterStore === null ? 'nothing of the page' : j(afterStore)}; the account ${state.includes(pid) ? 'has' : 'does NOT have'} the page`);
    });
  },
});
