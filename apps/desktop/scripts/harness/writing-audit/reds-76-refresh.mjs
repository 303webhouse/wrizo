// RED-FIRST CHECK for #76 part 1 (REFRESH): TR1-TR3. A window with nothing unsaved shows what another window saved, at once, and keeps its caret and focus; its own next words are added to it, never written over it.
// RED on main today: the app has no `storage` listener, so the idle window keeps its old text and its next save overwrites the other window's words. GREEN when the store listens for the other window's writes.
// Run: node scripts/harness/writing-audit/reds-76-refresh.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-76-refresh.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'TR1,TR2,TR3';
const { main } = await import('./lib/tabs-refresh.mjs');
await main({ title: 'RED-76-REFRESH' });
