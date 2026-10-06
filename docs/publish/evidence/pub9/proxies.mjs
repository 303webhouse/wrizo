// Local-only TLS fronts for the probe (never exposed beyond 127.0.0.1).
//  :8443  https://wp.test:8443     -> php on 127.0.0.1:8080, adds X-Forwarded-Proto: https (a normal HTTPS host)
//  :8444  https://wp.test:8444     -> same, but DROPS the Authorization header (simulates hosts that strip it)
//  :5443  https://wrizo.test:5443  -> static "Wrizo-like" origin; logs every request line (path + query) it receives
import https from 'node:https'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const tls = { key: fs.readFileSync(path.join(dir, 'key.pem')), cert: fs.readFileSync(path.join(dir, 'cert.pem')) };
const flog = fs.createWriteStream(path.join(dir, 'wp-front.log'), { flags: 'a' });
const pick = (h, keys) => Object.fromEntries(keys.filter((k) => h[k] !== undefined).map((k) => [k, h[k]]));
const front = (strip) => (req, res) => {
  const headers = { ...req.headers, 'x-forwarded-proto': 'https' };
  if (strip) delete headers.authorization;
  const up = http.request({ host: '127.0.0.1', port: 8080, method: req.method, path: req.url, headers }, (r) => {
    // Evidence log: never the Authorization value, never a password in a query string.
    flog.write(JSON.stringify({ t: new Date().toISOString(), front: strip ? 'strips-authorization' : 'https', method: req.method,
      url: req.url.replace(/password=[^&#]*/g, 'password=‹redacted›'),
      request: { ...pick(req.headers, ['origin', 'access-control-request-method', 'access-control-request-headers', 'content-type']), authorization: req.headers.authorization ? 'Basic ‹redacted›' : undefined, authorizationForwarded: !strip && !!req.headers.authorization },
      status: r.statusCode,
      response: pick(r.headers, ['access-control-allow-origin', 'access-control-allow-credentials', 'access-control-allow-methods', 'access-control-allow-headers', 'access-control-expose-headers', 'vary', 'allow', 'content-type', 'location']) }) + '\n');
    res.writeHead(r.statusCode, r.headers); r.pipe(res); });
  up.on('error', (e) => { res.writeHead(502); res.end(String(e)); });
  req.pipe(up);
};
https.createServer(tls, front(false)).listen(8443, '127.0.0.1');
https.createServer(tls, front(true)).listen(8444, '127.0.0.1');
const log = fs.createWriteStream(path.join(dir, 'wrizo-origin-requests.log'), { flags: 'a' });
https.createServer(tls, (req, res) => {
  log.write(JSON.stringify({ t: new Date().toISOString(), method: req.method, url: req.url, referer: req.headers.referer || null }) + '\n');
  const p = new URL(req.url, 'https://x').pathname;
  const f = path.join(dir, 'site', p === '/' ? 'probe.html' : p.replace(/^\//, ''));
  if (!f.startsWith(path.join(dir, 'site')) || !fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(5443, '127.0.0.1');
console.log('proxies up');
