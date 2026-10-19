// HELP BUTTONS S2 / S1 DIAGNOSIS #2 (this desk): after the drivers' repair (real CDP presses) S2 "a second tap of the SAME ? closes it" and three S1 opens still fail. This drives the
// flow staged with REAL pointer events and prints the state after EACH half of each press: (1) press the Templates "?" -> mousedown, mouseup; (2) press it AGAIN -> mousedown, mouseup;
// (3) the Outline "?" the way S1 does it; (4) the same on the Recede depth "?" after opening the footer popout. WT names the worktree. Prints HPROBE2 lines; asserts nothing.
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const T = '.wz-sliver-templates .wz-sliver-h .wz-help';
const O = '.wz-sliver-templates .wz-help[aria-label="What is Outline?"]';
const st = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); const p = document.querySelector('.wz-help-pop'); const a = document.activeElement; return { btn: !!b, expanded: b ? b.getAttribute('aria-expanded') : null, popOpen: !!p, popText: p ? p.textContent.slice(0, 30) : null, focusIsBtn: !!(a && a === b), rect: b ? (() => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })() : null }; })()`);
const centre = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const pressStaged = async (app, sel, label) => {
  const c = await centre(app, sel); if (!c) { console.log('HPROBE2 ' + JSON.stringify({ step: label, error: 'no element' })); return; }
  await app.mouseMove(c.x, c.y); await sleep(80);
  await app.mouseDown(c.x, c.y); await sleep(120);
  console.log('HPROBE2 ' + JSON.stringify({ step: label + ' after mousedown', ...(await st(app, sel)) }));
  await app.mouseUp(c.x, c.y); await sleep(400);
  console.log('HPROBE2 ' + JSON.stringify({ step: label + ' after mouseup', ...(await st(app, sel)) }));
};
await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900); await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload(); await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'hp2', text: 'A page for the probe.', origin: 'loose', source: 'page', createdAt: new Date().toISOString() })})`);
  await app.evalJs("localStorage.setItem('wrizo-mode-page-hp2', 'drafting')");
  await sleep(500); await app.evalJs("location.hash = '#/page/hp2'");
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 9000 }); await sleep(900);
  if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); }
  await pressStaged(app, T, 'T1 first press on Templates ?');
  await pressStaged(app, T, 'T2 SECOND press on the same ?');
  await pressStaged(app, O, 'O1 press the Outline ? (Templates pop in whatever state T2 left it)');
  console.log('HPROBE2 ' + JSON.stringify({ step: 'O1b the Outline pop text now', pop: await app.evalJs("document.querySelector('.wz-help-pop')?.textContent ?? null") }));
  await pressStaged(app, O, 'O2 press the Outline ? again');
});
