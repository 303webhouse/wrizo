// #91 PROBE (a measurement aid, not a check of the product): reflow-open.mjs run with every FONT FILE (.woff2 / .woff) held for 1500 ms by the harness server (node:http's createServer is wrapped before the driver loads),
// while the page, its scripts and its CSS arrive at once: the face is late, nothing else is. reflow-open prints, for each open, the card heights it drew (the O lines: "grew on N/N opens: ro-1:h ro-2:h ro-3:h | ...") and its F check
// (late vs prompt). A card height that differs between opens (0.1434 against 0.1875) is the open measuring on the fallback face and keeping it.
import http from 'node:http';
const orig = http.createServer.bind(http);
const hold = (h) => async (req, res) => { if (/\.woff2?(\?|$)/.test(String(req.url || ''))) await new Promise((r) => setTimeout(r, 1500)); return h(req, res); };
http.createServer = (...a) => { const i = a.findIndex((x) => typeof x === 'function'); if (i >= 0) a[i] = hold(a[i]); return orig(...a); };
await import('../reflow-open.mjs');
