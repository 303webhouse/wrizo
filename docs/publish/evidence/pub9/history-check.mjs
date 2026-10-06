// A7: after the return page strips the password with history.replaceState, is it still in the browser's History database?
// Uses a canary value (not a real credential). Full Chromium ("new headless"), persistent profile.
import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const dir = path.dirname(new URL(import.meta.url).pathname);
const udd = path.join(dir, 'out', 'profile-full'); fs.rmSync(udd, { recursive: true, force: true });
const args = ['--host-resolver-rules=MAP *.test 127.0.0.1', '--ignore-certificate-errors', '--no-proxy-server'];
const ctx = await chromium.launchPersistentContext(udd, { channel: 'chromium', args });
const p = ctx.pages()[0] || (await ctx.newPage());
await p.goto('https://wrizo.test:5443/probe.html');
// Arrive the way WordPress sends the writer back: a top-level navigation carrying the credentials.
await p.evaluate(() => { location.href = '/wp-return.html?site_url=https%3A%2F%2Fwp.test%3A8443&user_login=probe-admin&password=HISTORYCANARY0000'; });
await p.waitForFunction(() => window.__wp9After !== undefined);
console.log('address bar after replaceState:', await p.evaluate(() => location.href));
await p.goto('https://wrizo.test:5443/probe.html');
await p.waitForTimeout(3000);
await ctx.close();
console.log('history file:', fs.existsSync(path.join(udd, 'Default', 'History')));
