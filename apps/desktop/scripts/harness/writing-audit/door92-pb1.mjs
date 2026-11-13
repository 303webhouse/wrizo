// #92 PROOF AID (not a check of the product): the harness's own server answers /auth/me at once, so the Desk's Write door is enabled almost immediately and the race is rare. This wrapper holds every /auth/me answer for 4 s
// (it wraps node:http's createServer before the driver loads), which keeps the door DISABLED (`disabled={!ready || landing}`, ready = authState !== 'loading') while the driver is already past the splash: the miss, on purpose.
// A driver that clicks the disabled door gets no editor and times out; a driver that waits for the door to be enabled passes.
import http from 'node:http';
const orig = http.createServer.bind(http);
const hold = (h) => async (req, res) => { if (String(req.url || '').split('?')[0] === '/auth/me') await new Promise((r) => setTimeout(r, 4000)); return h(req, res); };
http.createServer = (...a) => { const i = a.findIndex((x) => typeof x === 'function'); if (i >= 0) a[i] = hold(a[i]); return orig(...a); };
await import('../pb1.mjs');
