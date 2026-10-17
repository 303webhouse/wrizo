// resume-on-open E1 / E3 remaining reds (this desk's probe). WT names the worktree; WS_LANDING=1; the harness's own default viewport (NO emulateDpr) unless VIEW=1280x800.
//   (a) the blank Page at cold boot: which mode-tab elements exist and which are 'active', at the default viewport and at 1280x800
//   (b) E3's moment: the last place is a Page, hold 2500 ms - when the address reaches the page, what do dataset.splashHold and .wz-splash read, and is the front door ever painted
process.env.WS_LANDING = '1';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await withHarness(async (app) => {
  const flags = (hold) => app.evalJs(`(() => { localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','${hold}'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); })()`);
  const settled = async () => { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {}); await sleep(900); };
  const tabs = (label) => app.evalJs(`({ label: ${JSON.stringify(label)}, inner: [innerWidth, innerHeight], tabs: [...document.querySelectorAll('.desk-mode-tab')].map((t) => ({ text: t.textContent, cls: String(t.className).slice(0, 60), aria: t.getAttribute('aria-selected') })), hash: location.hash })`);
  await app.goto('/'); await settled();
  await app.evalJs("localStorage.removeItem('wz.lastPlace')");
  await flags(50); await app.reload(); await settled();
  console.log('ROPROBE ' + JSON.stringify(await tabs('(a) blank page, harness default viewport, read at +900 ms')));
  await sleep(1500);
  console.log('ROPROBE ' + JSON.stringify(await tabs('(a) ...and at +2.4 s')));
  await app.emulateDpr(1, 1280, 800); await sleep(800);
  console.log('ROPROBE ' + JSON.stringify(await tabs('(a) after emulateDpr 1280x800')));
  // (b)
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'rop-a', text: 'Words on rop-a', origin: 'loose', source: 'page', createdAt: new Date().toISOString() })})`);
  await app.evalJs('window.wrizoFlushNow()');
  await app.evalJs("window.wrizoRecordLastPlace('test-user', 'page', 'rop-a')");
  await app.evalJs("location.hash = '#/'"); await sleep(400);
  await flags(2500); await app.reload();
  const t0 = Date.now(); let seen = null;
  for (let i = 0; i < 60; i += 1) {
    const s = await app.evalJs(`({ hash: location.hash, splash: !!document.querySelector('.wz-splash'), holdAttr: document.documentElement.dataset.splashHold ?? null, doors: !!document.querySelector('.wz-arrival-doors'), arrival: !!document.querySelector('.wz-arrival') })`);
    if (/rop-a/.test(s.hash)) { seen = { ms: Date.now() - t0, ...s }; break; }
    await sleep(100);
  }
  console.log('ROPROBE ' + JSON.stringify({ label: '(b) the moment the address reaches the page (hold 2500)', seen }));
  const attrs = await app.evalJs(`({ htmlDataset: { ...document.documentElement.dataset }, splashAttrs: (() => { const s = document.querySelector('.wz-splash'); return s ? [...s.attributes].map((a) => a.name + '=' + a.value) : null; })() })`);
  console.log('ROPROBE ' + JSON.stringify({ label: '(b) html dataset and splash attributes then', ...attrs }));
});
