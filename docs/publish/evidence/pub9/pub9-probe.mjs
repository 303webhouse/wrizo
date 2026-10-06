// PUB9 probe: can a browser app create a WordPress DRAFT with an Application Password?
// Runs only against a disposable WordPress on this machine (php -S + SQLite), fronted by local TLS.
//   Wrizo-like origin : https://wrizo.test:5443   (a different site from WordPress)
//   WordPress (HTTPS) : https://wp.test:8443      (normal host)
//   WordPress (strip) : https://wp.test:8444      (a host that drops the Authorization header)
//   WordPress (HTTP)  : http://wp.test:8080       (no TLS)
// Every credential is a throwaway. Evidence written by this script is redacted at the source:
// no Authorization value and no application password is ever written to disk.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const dir = path.dirname(new URL(import.meta.url).pathname);
const secretsDir = path.resolve(dir, '..');
const read = (f) => fs.readFileSync(path.join(secretsDir, f), 'utf8').trim();
const ADMIN = { user: 'probe-admin', pass: read('.app-admin') };
const CONTRIB = { user: 'probe-contributor', pass: read('.app-contrib') };
const ADMIN_LOGIN_PW = read('.adminpw');
const WRONG = { user: 'probe-admin', pass: 'aaaa bbbb cccc dddd eeee ffff' };
const SECRETS = [ADMIN.pass, CONTRIB.pass, ADMIN_LOGIN_PW];

const WRIZO = 'https://wrizo.test:5443';
const WP = 'https://wp.test:8443';
const WP_STRIP = 'https://wp.test:8444';
const WP_HTTP = 'http://wp.test:8080';
const APP_ID = '6f1c2a7e-0b8d-4c55-9a51-3f2d7e9b1c40'; // a fixed, made-up UUID for the probe

const CONTENT = [
  '<!-- wp:heading --><h2 class="wp-block-heading">The crypt</h2><!-- /wp:heading -->',
  '<!-- wp:paragraph --><p>She lit the <em>last</em> candle &amp; waited — “listen.”</p><!-- /wp:paragraph -->',
  '<!-- wp:separator --><hr class="wp-block-separator has-alpha-channel-opacity"/><!-- /wp:separator -->',
  '<!-- wp:quote --><blockquote class="wp-block-quote"><!-- wp:paragraph --><p>Every word, in order.</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote -->',
].join('\n\n');

const redact = (v) => {
  let s = typeof v === 'string' ? v : JSON.stringify(v);
  for (const x of SECRETS.filter(Boolean)) s = s.split(x).join('‹redacted›');
  s = s.replace(/password=[^&#"]*/g, 'password=‹redacted›').replace(/Basic [A-Za-z0-9+/=]{8,}/g, 'Basic ‹redacted›');
  return typeof v === 'string' ? s : JSON.parse(s);
};
const results = [];
const record = (id, what, data) => { const r = redact({ id, what, ...data }); results.push(r); console.log(id, what, '→', r.status ?? r.result ?? ''); };
const trim = (j) => (j && typeof j === 'object' ? (j.code ? { code: j.code, message: j.message, data: j.data } : { id: j.id, status: j.status, link: j.link, type: j.type, title: j.title?.raw ?? j.title?.rendered }) : j);

const browser = await chromium.launch({
  args: ['--host-resolver-rules=MAP *.test 127.0.0.1', '--ignore-certificate-errors', '--no-proxy-server'],
});
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await ctx.newPage();
const consoleMsgs = [];
page.on('console', (m) => consoleMsgs.push(redact(`[${m.type()}] ${m.text()}`)));
await page.goto(`${WRIZO}/probe.html`);
const call = (url, opts) => page.evaluate(([u, o]) => window.wp9(u, o), [url, opts]);

// C1 discovery
let r = await call(`${WP}/wp-json/`);
record('C1', 'GET /wp-json/ discovery from another site (no auth)', { status: r.status, authentication: r.json?.authentication, name: r.json?.name, exposedHeaders: r.exposedHeaders });

// C2 admin draft
const body = { title: 'Ch. 7 — The crypt (probe)', content: CONTENT, status: 'draft' };
r = await call(`${WP}/wp-json/wp/v2/posts`, { method: 'POST', auth: ADMIN, body });
const adminDraftId = r.json?.id;
record('C2', 'POST draft, Administrator app password', { status: r.status, body: trim(r.json), exposedHeaders: r.exposedHeaders });
r = await call(`${WP}/wp-json/wp/v2/posts/${adminDraftId}?context=edit`, { auth: ADMIN });
record('C2b', 'Read it back (context=edit): still a draft? words identical?', { status: r.status, postStatus: r.json?.status, rawContentIdentical: r.json?.content?.raw === CONTENT, rawTitleIdentical: r.json?.title?.raw === body.title, link: r.json?.link });

// C3 contributor draft
r = await call(`${WP}/wp-json/wp/v2/posts`, { method: 'POST', auth: CONTRIB, body });
const contribDraftId = r.json?.id;
record('C3', 'POST draft, Contributor app password', { status: r.status, body: trim(r.json) });
r = await call(`${WP}/wp-json/wp/v2/posts/${contribDraftId}?context=edit`, { auth: CONTRIB });
record('C3b', 'Contributor read-back: words identical after WordPress filtering?', { status: r.status, postStatus: r.json?.status, rawContentIdentical: r.json?.content?.raw === CONTENT, rawContent: r.json?.content?.raw === CONTENT ? '(identical)' : r.json?.content?.raw });

// C4 / C5 publish attempts
r = await call(`${WP}/wp-json/wp/v2/posts`, { method: 'POST', auth: CONTRIB, body: { ...body, status: 'publish' } });
record('C4', "POST status:'publish', Contributor", { status: r.status, body: trim(r.json) });
r = await call(`${WP}/wp-json/wp/v2/posts`, { method: 'POST', auth: ADMIN, body: { ...body, title: 'Publish attempt (probe)', status: 'publish' } });
record('C5', "POST status:'publish', Administrator", { status: r.status, body: trim(r.json) });

// C6 wrong password, C7 no auth
r = await call(`${WP}/wp-json/wp/v2/posts`, { method: 'POST', auth: WRONG, body });
record('C6', 'POST with a wrong application password', { status: r.status, body: trim(r.json) });
r = await call(`${WP}/wp-json/wp/v2/posts`, { method: 'POST', body });
record('C7', 'POST with no Authorization header', { status: r.status, body: trim(r.json) });

// C8 host strips Authorization, plus the query fallbacks people try
r = await call(`${WP_STRIP}/wp-json/wp/v2/posts`, { method: 'POST', auth: ADMIN, body });
record('C8', 'POST through a host that strips Authorization', { status: r.status, body: trim(r.json) });
r = await call(`${WP_STRIP}/?rest_route=/wp/v2/posts`, { method: 'POST', auth: ADMIN, body });
record('C8b', 'Same, via ?rest_route= (no pretty permalinks)', { status: r.status, body: trim(r.json) });
r = await call(`${WP_STRIP}/wp-json/wp/v2/posts?_envelope=1`, { method: 'POST', auth: ADMIN, body });
record('C8c', 'Same, with ?_envelope=1', { status: r.status, envelopeStatus: r.json?.status, body: trim(r.json?.body) });
r = await call(`${WP_STRIP}/wp-json/wp/v2/users/me?context=edit`, { auth: ADMIN });
record('C8d', 'GET /users/me through the stripping host (a cheap pre-flight check Wrizo can run)', { status: r.status, body: trim(r.json) });

// C9 HTTPS app -> HTTP WordPress (mixed content)
r = await call(`${WP_HTTP}/wp-json/wp/v2/posts`, { method: 'POST', auth: ADMIN, body });
record('C9', 'POST from the HTTPS app to an http:// WordPress', { status: r.status, error: r.error });

// C10 WordPress over plain HTTP, production (server-to-server, to see WordPress's own answer)
{
  const res = await fetch(`http://127.0.0.1:8080/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: { Host: 'wp.test:8080', Origin: WRIZO, 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${ADMIN.user}:${ADMIN.pass}`).toString('base64') },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => null);
  const idx = await (await fetch('http://127.0.0.1:8080/wp-json/', { headers: { Host: 'wp.test:8080' } })).json();
  record('C10', 'Plain-HTTP WordPress, environment=production: valid app password', { status: res.status, body: trim(j), discoveryAuthentication: idx.authentication });
}

// ---- The "Authorize Application" flow ------------------------------------------------------
const auth = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const ap = await auth.newPage();
const authUrl = (success, extra = '') => `${WP}/wp-admin/authorize-application.php?app_name=Wrizo&app_id=${APP_ID}&success_url=${encodeURIComponent(success)}${extra}`;

// A0 not logged in -> login redirect
await ap.goto(authUrl(`${WRIZO}/wp-return.html`));
record('A0', 'Open the Authorize Application URL while signed out', { result: 'redirected to login', landedOn: new URL(ap.url()).pathname, keepsRedirectTo: ap.url().includes('redirect_to=') });
await ap.fill('#user_login', 'probe-admin');
await ap.fill('#user_pass', ADMIN_LOGIN_PW);
await Promise.all([ap.waitForLoadState('load'), ap.click('#wp-submit')]);
await ap.waitForSelector('#approve');
const screen = await ap.evaluate(() => ({
  heading: document.querySelector('h1')?.innerText,
  text: document.querySelector('.card')?.innerText?.replace(/\s+/g, ' ').trim(),
  appNameField: document.querySelector('#app_name')?.value,
  buttons: [...document.querySelectorAll('#approve, #reject')].map((b) => b.innerText || b.value),
}));
fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
await ap.screenshot({ path: path.join(dir, 'out', 'authorize-application-screen.png') });
record('A1', 'What the writer sees (signed in as an Administrator)', { result: 'approval screen', ...screen });

// A2 approve -> redirect to success_url with credentials in the QUERY STRING
await Promise.all([ap.waitForURL(/wrizo\.test/), ap.click('#approve')]);
await ap.waitForFunction(() => window.__wp9After !== undefined);
const back = await ap.evaluate(() => ({ before: window.__wp9Before, after: window.__wp9After, seen: window.__wp9Seen, referrer: document.referrer }));
const minted = await ap.evaluate(() => window.__wp9Captured.password);
SECRETS.push(minted);
const originLog = fs.readFileSync(path.join(dir, 'wrizo-origin-requests.log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((e) => e.url.startsWith('/wp-return.html'));
const lastHit = originLog[originLog.length - 1];
record('A2', 'Approve: the redirect back to Wrizo', {
  result: 'redirected',
  addressBarOnArrival: back.before,
  addressBarAfterReplaceState: back.after,
  passwordReachedWrizoServerInQuery: /password=/.test(lastHit.url) && !lastHit.url.includes('password=‹'),
  wrizoServerSawThisRequestLine: lastHit.url,
  paramsReceived: back.seen,
  passwordShape: { length: minted.length, groupsOfFour: /^[A-Za-z0-9]{4}( [A-Za-z0-9]{4}){5}$/.test(minted) },
});

// A3 rotate on arrival: can the minted password mint a fresh one and revoke itself?
const mintedAuth = { user: 'probe-admin', pass: minted };
await page.bringToFront();
r = await call(`${WP}/wp-json/wp/v2/users/me/application-passwords/introspect`, { auth: mintedAuth });
const mintedUuid = r.json?.uuid;
record('A3a', 'Introspect: which app password is this?', { status: r.status, name: r.json?.name, app_id: r.json?.app_id });
r = await call(`${WP}/wp-json/wp/v2/users/me/application-passwords`, { method: 'POST', auth: mintedAuth, body: { name: 'Wrizo', app_id: APP_ID } });
const rotated = r.json?.password;
if (rotated) SECRETS.push(rotated);
record('A3b', 'Using it, create a fresh app password (rotate on arrival)', { status: r.status, gotNewPassword: !!rotated, body: rotated ? { name: r.json?.name, app_id: r.json?.app_id } : trim(r.json) });
if (rotated) {
  r = await call(`${WP}/wp-json/wp/v2/users/me/application-passwords/${mintedUuid}`, { method: 'DELETE', auth: { user: 'probe-admin', pass: rotated } });
  record('A3c', 'With the fresh one, revoke the one that travelled in the URL', { status: r.status, deleted: r.json?.deleted });
  r = await call(`${WP}/wp-json/wp/v2/users/me`, { auth: mintedAuth });
  record('A3d', 'The travelled password afterwards', { status: r.status, body: trim(r.json) });
}

// A4 success_url with a #fragment: where do the credentials land?
await ap.goto(authUrl(`${WRIZO}/wp-return.html#connect`));
await ap.waitForSelector('#approve');
await Promise.all([ap.waitForURL(/wrizo\.test/), ap.click('#approve')]);
await ap.waitForFunction(() => window.__wp9After !== undefined);
const back2 = await ap.evaluate(() => ({ before: window.__wp9Before, after: window.__wp9After, seen: window.__wp9Seen }));
SECRETS.push(await ap.evaluate(() => window.__wp9Captured.password));
const originLog2 = fs.readFileSync(path.join(dir, 'wrizo-origin-requests.log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((e) => e.url.startsWith('/wp-return.html'));
record('A4', 'success_url ending in #fragment (JavaScript approval path)', {
  result: 'redirected', addressBarOnArrival: back2.before, wrizoServerSawThisRequestLine: originLog2[originLog2.length - 1].url, paramsReceived: back2.seen,
});

// A5 plain-http success_url on a production site
await ap.goto(authUrl('http://wrizo.test:5080/wp-return.html'));
record('A5', 'success_url on plain http (production site)', { result: 'refused', message: (await ap.locator('body').innerText()).replace(/\s+/g, ' ').trim().slice(0, 200) });

// A6 reject
await ap.goto(authUrl(`${WRIZO}/wp-return.html`));
await ap.waitForSelector('#reject');
await Promise.all([ap.waitForURL(/wrizo\.test/), ap.click('#reject')]);
await ap.waitForFunction(() => window.__wp9After !== undefined);
record('A6', 'Reject', { result: 'redirected', addressBarOnArrival: await ap.evaluate(() => window.__wp9Before) });

await browser.close();

// A7 (browser history) is in history-check.mjs: the headless shell used here keeps no History file,
// so that check runs in full Chromium instead.

fs.writeFileSync(path.join(dir, 'out', 'results.json'), JSON.stringify({ wordpress: '7.1.2', chromium: 'playwright chromium-1194', results, console: consoleMsgs }, null, 2));
fs.writeFileSync(path.join(secretsDir, '.minted'), SECRETS.slice(3).join('\n'), { mode: 0o600 });
console.log('done');
