// SIGNED-IN LIVE LANDING WALK (this desk; Fable: "a signed-in live smoke lands on the last place, not the front door"). Run against PRODUCTION: WS_TARGET_URL + WS_BOX_TURN; WT names the worktree whose runtime-verify drives the browser.
// A throwaway profile signs in through the REAL form with the smoke account (~/.wrizo/smoke-account.json, outside the repo): the email and password are read here, typed, and NEVER printed or stored.
// It types nothing into any page (nothing is born, nothing is written to the account), records where the cold open lands, boots a second time, and ENDS THE SERVER SESSION at the end (POST /auth/logout).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const OUT = process.env.FRAMES_OUT; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const acct = JSON.parse(readFileSync(join(homedir(), '.wrizo', 'smoke-account.json'), 'utf8'));
const rows = [];
await withHarness(async (app) => {
  const flags = () => app.evalJs(`(() => { localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50');
    localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); })()`);
  const settled = async () => { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {}); await sleep(1500); };
  const facts = () => app.evalJs(`({ hash: location.hash, frontDoor: !!document.querySelector('.wz-arrival'), signInForm: !!document.querySelector('form.wz-form input[name=password]'),
    editor: !!document.querySelector('.forward-only-editor'), board: !!document.querySelector('.board-canvas'), crumb: (document.querySelector('.crumb-here') || {}).textContent || null,
    activeTab: (document.querySelector('.desk-mode-tab.active') || {}).textContent || null, pointer: (() => { try { const p = JSON.parse(localStorage.getItem('wz.lastPlace') || 'null'); return p ? { kind: p.kind, hasId: !!p.id } : null; } catch { return 'unreadable'; } })(),
    origin: location.origin, bundle: ([...document.scripts].map((s) => s.src).find((x) => x.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, '') })`);
  const shot = async (name) => { writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); const f = await facts(); rows.push({ frame: name, ...f }); console.log('LIVEWALK ' + JSON.stringify({ frame: name, ...f })); };
  await app.emulateDpr(1, 1280, 800);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear()");
  await flags(); await app.reload(); await settled();
  await shot('1-anonymous-front-door');
  await app.evalJs("document.querySelector('.wz-arrival-signin')?.click()"); await sleep(700);
  await app.evalJs("document.querySelector('form.wz-form input[name=email]')?.focus()"); await app.typeKeys(acct.email);
  await app.evalJs("document.querySelector('form.wz-form input[name=password]')?.focus()"); await app.typeKeys(acct.password);
  await app.evalJs("document.querySelector('form.wz-form button[type=submit]')?.click()");
  let landed = false;
  for (let i = 0; i < 80; i += 1) { await sleep(250); const h = await app.evalJs('location.hash'); if (h && h !== '#/' && h !== '') { landed = true; break; } }
  await sleep(2500);
  await shot('2-after-sign-in');
  console.log('LIVEWALK ' + JSON.stringify({ signedInMovedAwayFromFrontDoor: landed }));
  await flags(); await app.evalJs("location.hash = '#/'"); await sleep(500); await app.reload(); await settled();
  await shot('3-cold-boot-signed-in');
  // end the server session (no credential in the call: the cookie is the session)
  const out = await app.evalJs(`fetch('/auth/logout', { method: 'POST', credentials: 'include' }).then((r) => r.status).catch(() => -1)`);
  console.log('LIVEWALK ' + JSON.stringify({ logoutStatus: out }));
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`LIVEWALK FRAMES: ${rows.length} -> ${OUT}`);
