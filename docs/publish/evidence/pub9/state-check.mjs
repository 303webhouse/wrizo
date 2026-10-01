// A8: does WordPress keep Wrizo's own one-time "state" value on success_url, so the return page can prove the trip began in Wrizo?
import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const dir = path.dirname(new URL(import.meta.url).pathname);
const pw = fs.readFileSync(path.join(dir, '..', '.adminpw'), 'utf8').trim();
const b = await chromium.launch({ args: ['--host-resolver-rules=MAP *.test 127.0.0.1', '--ignore-certificate-errors', '--no-proxy-server'] });
const p = await (await b.newContext()).newPage();
const state = 'st-4b1f9c2e7a';
const success = `https://wrizo.test:5443/wp-return.html?state=${state}`;
await p.goto(`https://wp.test:8443/wp-login.php`); await p.fill('#user_login', 'probe-admin'); await p.fill('#user_pass', pw);
await Promise.all([p.waitForLoadState('load'), p.click('#wp-submit')]);
const out = {};
for (const [label, extra] of [['approve', ''], ['reject', '']]) {
  await p.goto(`https://wp.test:8443/wp-admin/authorize-application.php?app_name=Wrizo&app_id=6f1c2a7e-0b8d-4c55-9a51-3f2d7e9b1c40&success_url=${encodeURIComponent(success)}${extra}`);
  await p.waitForSelector('#approve');
  await Promise.all([p.waitForURL(/wrizo\.test/), p.click(label === 'approve' ? '#approve' : '#reject')]);
  await p.waitForFunction(() => window.__wp9After !== undefined);
  const before = await p.evaluate(() => window.__wp9Before);
  out[label] = { addressBarOnArrival: before, stateKept: new URL(before).searchParams.get('state') === state };
  if (label === 'approve') fs.appendFileSync(path.join(dir, '..', '.minted'), '\n' + (await p.evaluate(() => window.__wp9Captured.password)));
}
fs.writeFileSync(path.join(dir, 'out', 'state-check.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await b.close();
