// Accessibility audit of Wrizo | Write, run against a throwaway local server + Postgres.
import crypto from 'node:crypto';
// Two themes (Plateau, Flux) x two viewports (1366x768, 390x844). Seeding goes through the app's own
// window.wrizo* seams (AGENTS.md). Nothing here touches production.
import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';

const dir = path.dirname(new URL(import.meta.url).pathname);
const BASE = process.env.BASE || 'http://127.0.0.1:3200';
const OUT = path.join(dir, 'run'); fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'aria'), { recursive: true });
const AXE = fs.readFileSync(path.join(dir, 'node_modules/axe-core/axe.min.js'), 'utf8');
const THEMES = (process.env.THEMES || 'plateau,flux').split(',');
const VPS = [{ id: 'desktop', width: 1366, height: 768 }, { id: 'phone', width: 390, height: 844 }].filter((v) => !process.env.VPS || process.env.VPS.split(',').includes(v.id));
const PASSWORD = crypto.randomUUID(); // a fresh throwaway per run, never stored
const results = [];
const settle = (p, ms = 700) => p.waitForTimeout(ms);

// ---------- in-page helpers (serialised into the page) ----------
const PAGE_HELPERS = `
window.__a11y = (() => {
  const INTERACTIVE = 'button, a[href], input:not([type=hidden]), textarea, select, summary, [role=button], [role=tab], [role=link], [role=menuitem], [role=checkbox], [role=switch], [role=option], [contenteditable=true], [tabindex]:not([tabindex="-1"])';
  const opacityChain = (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || '1'); return o; };
  const visibleInfo = (el) => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    const inView = r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
    const op = opacityChain(el);
    let hit = false;
    if (inView) { const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1); const t = document.elementFromPoint(cx, cy); hit = !!t && (t === el || el.contains(t) || t.contains(el)); }
    return { inView, opacity: Math.round(op * 100) / 100, hidden: cs.visibility === 'hidden' || cs.display === 'none', hit, rect: { x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 } };
  };
  const name = (el) => (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.textContent) || el.getAttribute('title') || el.textContent || el.getAttribute('placeholder') || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
  const cls = (el) => (typeof el.className === 'string' ? el.className : '').split(/\\s+/).filter(Boolean).slice(0, 3).join('.');
  const describe = (el) => el ? { tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), name: name(el), cls: cls(el) } : null;
  const targets = () => {
    const els = [...document.querySelectorAll(INTERACTIVE)].filter((e) => !e.disabled && !e.closest('[aria-hidden=true]'));
    const rows = els.map((e) => ({ e, ...describe(e), ...visibleInfo(e) })).filter((t) => t.inView && !t.hidden && t.opacity > 0.1 && t.rect.w > 0);
    const ctr = (t) => ({ x: t.rect.x + t.rect.w / 2, y: t.rect.y + t.rect.h / 2 });
    const distToRect = (p, r) => { const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w)); const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h)); return Math.hypot(dx, dy); };
    for (const t of rows) {
      t.min = Math.min(t.rect.w, t.rect.h);
      t.under24 = t.rect.w < 24 || t.rect.h < 24;
      t.under44 = t.rect.w < 44 || t.rect.h < 44;
      t.textInline = t.tag === 'a' && getComputedStyle(t.e).display === 'inline';
      if (t.under24) {
        const c = ctr(t);
        // WCAG 2.5.8 spacing exception: a 24px circle on this target's centre must not touch another target, nor another undersized target's circle.
        t.spacingOK = rows.every((o) => o === t || (o.under24 ? Math.hypot(ctr(o).x - c.x, ctr(o).y - c.y) >= 24 : distToRect(c, o.rect) >= 12));
      }
    }
    return rows.map(({ e, ...t }) => t);
  };
  const focusStyle = (el) => { const cs = getComputedStyle(el); return ['outline-style', 'outline-width', 'outline-color', 'box-shadow', 'border-top-color', 'border-bottom-color', 'background-color', 'color', 'text-decoration-line'].map((k) => cs.getPropertyValue(k)).join('|'); };
  // Colour
  const parse = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
  const effBg = (el) => { let bg = { r: 0, g: 0, b: 0, a: 0 }; let image = false; const stack = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.backgroundImage && cs.backgroundImage !== 'none') image = true; const c = parse(cs.backgroundColor); if (c && c.a > 0) stack.push(c); if (c && c.a >= 1) break; } let base = { r: 0, g: 0, b: 0, a: 1 }; const root = parse(getComputedStyle(document.body).backgroundColor); if (root && root.a >= 1) base = root; for (const c of stack.reverse()) base = over(c, base); return { bg: base, image }; };
  const contrastOf = (el, pseudo) => { const cs = getComputedStyle(el, pseudo || null); const fg0 = parse(cs.color); const { bg, image } = effBg(el); const fg = over(fg0, bg); const op = opacityChain(el); const fgEff = op < 1 ? over({ ...fg, a: op }, bg) : fg; return { fg: cs.color, bg: 'rgb(' + [bg.r, bg.g, bg.b].map(Math.round).join(',') + ')', ratio: ratio(fgEff, bg), opacity: Math.round(op * 100) / 100, fontSize: parseFloat(cs.fontSize), weight: cs.fontWeight, bgImage: image }; };
  const tokens = () => { const cs = getComputedStyle(document.documentElement); const v = (k) => cs.getPropertyValue(k).trim(); return Object.fromEntries(['--text-hi', '--text-mid', '--text-low', '--accent-rest', '--brass', '--desk-ground', '--chrome-surface', '--ink-900', '--ink-800', '--paper', '--paper-dim'].map((k) => [k, v(k)])); };
  return { targets, describe, visibleInfo, focusStyle, contrastOf, tokens, name };
})();
`;

async function prep(page) { await page.addScriptTag({ content: PAGE_HELPERS }); await page.addScriptTag({ content: AXE }); }
async function helpersReady(page) { const ok = await page.evaluate(() => !!window.__a11y && !!window.axe).catch(() => false); if (!ok) await prep(page); }

async function runAxe(page) {
  await helpersReady(page);
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete'] });
    const slim = (v) => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length, nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 160), summary: (n.failureSummary || '').split('\n').slice(0, 3).join(' / ').slice(0, 260), data: (n.any[0] && n.any[0].data && typeof n.any[0].data === 'object') ? n.any[0].data : null })) });
    return { violations: res.violations.map(slim), incomplete: res.incomplete.map((v) => ({ id: v.id, count: v.nodes.length })) };
  });
  return r;
}

async function tabWalk(page, max = 45) {
  await helpersReady(page);
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
  const stops = []; let same = 0; let prevKey = null; const seen = new Map();
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(90);
    const s = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return { body: true };
      const d = window.__a11y.describe(el); const v = window.__a11y.visibleInfo(el);
      const focused = window.__a11y.focusStyle(el);
      el.blur(); const rest = window.__a11y.focusStyle(el); el.focus();
      const key = d.tag + '|' + d.cls + '|' + d.name + '|' + Math.round(v.rect.x) + ',' + Math.round(v.rect.y);
      return { ...d, ...v, indicator: focused !== rest, key };
    });
    if (s.body) { stops.push({ i, body: true }); prevKey = null; continue; }
    if (s.key === prevKey) { same++; stops.push({ i, ...s, repeat: true }); if (same >= 2) { // try to leave: Escape, then Tab
        await page.keyboard.press('Escape'); await page.keyboard.press('Tab'); await page.waitForTimeout(90);
        const after = await page.evaluate(() => { const el = document.activeElement; return el && el !== document.body ? window.__a11y.describe(el) : { tag: 'body' }; });
        stops.push({ i, trapped: true, afterEscapeTab: after }); break; }
      continue; }
    same = 0; prevKey = s.key;
    if (seen.has(s.key)) { stops.push({ i, ...s, cycledTo: seen.get(s.key) }); break; }
    seen.set(s.key, i); stops.push({ i, ...s });
  }
  return stops;
}

async function contrastSamples(page) {
  await helpersReady(page);
  return page.evaluate(() => {
    const pick = [
      ['mode tab (inactive)', '.desk-mode-tab:not(.active):not(.deferred)'], ['mode tab (active)', '.desk-mode-tab.active'], ['mode tab (Workshop, deferred)', '.desk-mode-tab.deferred'],
      ['Plan door', '.page-plan-door'], ['breadcrumb (binder)', '.sprint-crumb a, .sprint-crumb span'], ['rail label (places)', '.wz-strip-section:not(.wz-strip-foot *) .wz-strip-label'], ['rail label (foot group)', '.wz-strip-foot .wz-strip-label'],
      ['page prose', '.forward-only-editor'], ['word count', '.wz-wordcount, .word-count, .mode-pcount'], ['Tutor input placeholder', '.wz-tutor-convo-input'], ['old desk rail label', '.desk-rail-label'],
      ['arrival tagline', '.wz-tagline'], ['arrival Open', '.wz-arrival-open'], ['sign-in link', '.wz-secondary .wz-link'], ['field placeholder', '.wz-field'],
    ];
    const out = [];
    for (const [label, sel] of pick) { const el = document.querySelector(sel); if (!el) continue; const r = el.getBoundingClientRect(); if (!r.width) continue; const c = window.__a11y.contrastOf(el); out.push({ label, sel, text: (el.textContent || '').trim().slice(0, 20), ...c });
      if (/placeholder/.test(label)) { const cp = window.__a11y.contrastOf(el, '::placeholder'); out.push({ label: label + ' (::placeholder)', sel, ...cp }); } }
    return { samples: out, tokens: window.__a11y.tokens() };
  });
}

async function audit(page, ctxInfo, screen, opts = {}) {
  const id = `${ctxInfo.theme}-${ctxInfo.vp}-${screen}`;
  const rec = { theme: ctxInfo.theme, vp: ctxInfo.vp, screen, url: page.url().replace(BASE, '') };
  try {
    await settle(page, opts.settle ?? 700);
    await helpersReady(page);
    await page.screenshot({ path: path.join(OUT, 'shots', id + '.png') });
    rec.axe = await runAxe(page);
    rec.targets = await page.evaluate(() => window.__a11y.targets());
    rec.hiddenFocusable = await page.evaluate(() => [...document.querySelectorAll('button, a[href], input:not([type=hidden]), textarea, select, [tabindex]:not([tabindex="-1"])')].filter((e) => !e.disabled && e.tabIndex >= 0).map((e) => ({ ...window.__a11y.describe(e), ...window.__a11y.visibleInfo(e) })).filter((t) => !t.hidden && t.rect.w > 0 && (!t.inView || t.opacity <= 0.1 || !t.hit)).slice(0, 40));
    if (opts.contrast) rec.contrast = await contrastSamples(page);
    if (opts.walk) rec.walk = await tabWalk(page, opts.walkMax || 45);
    if (opts.aria) { const snap = await page.locator('body').ariaSnapshot().catch((e) => 'ERR ' + e.message); fs.writeFileSync(path.join(OUT, 'aria', id + '.yml'), snap); }
  } catch (e) { rec.error = String(e).slice(0, 300); }
  results.push(rec); console.log(id, rec.error ? 'ERROR ' + rec.error.slice(0, 80) : `axe:${rec.axe?.violations.length} targets:${rec.targets?.length}`);
  return rec;
}

async function escTest(page, label, openFn, isOpenFn, returnSel) {
  const t = { label };
  try {
    await openFn(); await page.waitForTimeout(400);
    t.openedFocus = await page.evaluate(() => window.__a11y ? window.__a11y.describe(document.activeElement) : null);
    t.open = await isOpenFn();
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    t.closedByEsc = !(await isOpenFn());
    await helpersReady(page);
    t.focusAfter = await page.evaluate(() => window.__a11y.describe(document.activeElement));
    if (returnSel) t.focusReturned = await page.evaluate((s) => { const el = document.querySelector(s); return !!el && document.activeElement === el; }, returnSel);
    if (!t.closedByEsc) { await page.mouse.click(3, 3).catch(() => {}); await page.waitForTimeout(300); }
  } catch (e) { t.error = String(e).slice(0, 200); }
  return t;
}

const browser = await chromium.launch({ args: ['--no-proxy-server'] });
const escResults = [];
const hashTo = (p, h) => p.evaluate((x) => { location.hash = '#' + x; }, h); // in-app navigation: no reload, so no extra /auth/me against the 20/min limiter

for (const theme of THEMES) for (const vp of VPS) {
  const info = { theme, vp: vp.id };
  const mk = async () => { const c = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.id === 'phone' }); await c.addInitScript((t) => { try { localStorage.setItem('wrizo-theme', t); } catch {} }, theme); return c; };

  // ---- signed out: Arrival and sign-in
  { const c = await mk(); const p = await c.newPage(); await p.goto(BASE + '/'); await p.waitForSelector('.wz-arrival-open:not([disabled])', { timeout: 10000 }).catch(() => {});
    await audit(p, info, 'arrival-signed-out', { walk: true, contrast: true, aria: vp.id === 'desktop' });
    await p.click('.wz-arrival-open').catch(() => {}); await p.waitForSelector('.wz-field', { timeout: 5000 }).catch(() => {});
    await audit(p, info, 'sign-in', { walk: true, contrast: true, aria: vp.id === 'desktop', walkMax: 15 });
    await c.close(); }

  // ---- signed in: a fresh throwaway account per theme x viewport, seeded through the seams
  const c = await mk(); const p = await c.newPage();
  const email = `a11y-${theme}-${vp.id}-${Date.now()}@example.invalid`;
  await p.goto(BASE + '/');
  const reg = await c.request.post(BASE + '/auth/register', { data: { email, password: PASSWORD } });
  await p.reload(); await p.waitForSelector('.wz-arrival-open:not([disabled])', { timeout: 10000 }).catch(() => {}); await settle(p, 800);
  const seed = await p.evaluate(() => {
    const w = window; const binder = w.wrizoCreateBinder('The Long Winter', 'novel');
    const prose = (n) => `Chapter ${n}\n\nThe snow came early that year, and it did not leave. Mara kept the lamp trimmed and counted the logs twice each night.\n\nBy the third week the road was gone.`;
    const ch = [1, 2, 3].map((n) => w.wrizoCreateJournalPage({ text: prose(n), origin: null, source: 'page', projectId: binder.id, pageType: 'manuscript' }));
    const board = w.wrizoCreateJournalPage({ text: 'Chapter beats', origin: null, source: 'page', projectId: binder.id, pageType: 'board', boxes: [] });
    ch.forEach((x) => w.wrizoPinPageToBoard(x.id, board.id));
    const journal = w.wrizoCreateJournalPage({ text: 'Morning pages\n\nWoke before the light. The kettle, the window, the one good sentence.', origin: 'journal', source: 'page' });
    w.wrizoFlushNow(); return { binder: binder.id, ch: ch.map((x) => x.id), board: board.id, journal: journal.id };
  });
  console.log(theme, vp.id, 'register', reg.status(), 'seed', JSON.stringify(seed).slice(0, 60));
  await audit(p, info, 'arrival-signed-in', { contrast: true });

  await hashTo(p, `/page/${seed.ch[0]}`); await p.waitForSelector('.forward-only-editor', { timeout: 10000 }).catch(() => {});
  await audit(p, info, 'page-freewrite', { walk: true, contrast: true, aria: vp.id === 'desktop', walkMax: 50 });
  // Draft mode
  await p.locator('.desk-mode-tab', { hasText: /draft/i }).first().click({ timeout: 4000 }).catch(() => {});
  await audit(p, info, 'page-draft', { contrast: true, walk: vp.id === 'desktop', walkMax: 50 });
  // Publish dialog
  const pubTab = p.locator('.desk-mode-tab', { hasText: /publish|connect|relay/i }).first();
  await pubTab.click({ timeout: 4000 }).catch(() => {});
  await audit(p, info, 'publish-dialog', { walk: true, aria: vp.id === 'desktop', walkMax: 20 });
  if (await p.$('[role=dialog]')) { await p.mouse.click(3, 3).catch(() => {}); await p.waitForTimeout(300); }

  // Rail panels
  const railNames = await p.$$eval('.wz-strip-item', (els) => els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => (e.textContent || '').trim()));
  for (const nm of railNames) {
    const btn = p.locator('.wz-strip-item', { hasText: nm }).first();
    await btn.click({ timeout: 4000 }).catch(() => {});
    await audit(p, info, 'panel-' + nm.toLowerCase().replace(/\W+/g, '-'), { aria: vp.id === 'desktop' && theme === 'plateau', settle: 500 });
    if (await p.$('.wz-strip-item[aria-pressed=true]')) { await p.locator('.wz-strip-item[aria-pressed=true]').first().click().catch(() => {}); await p.waitForTimeout(250); }
  }

  // Tutor
  await hashTo(p, `/page/${seed.board}`); await settle(p, 400); await hashTo(p, `/page/${seed.ch[0]}`); await p.waitForSelector('.forward-only-editor', { timeout: 10000 }).catch(() => {}); await settle(p, 600);
  const grip = p.locator('.wz-tutor-grip').first();
  if (await grip.count()) { await grip.click({ timeout: 4000 }).catch(() => {}); await audit(p, info, 'tutor-open', { walk: vp.id === 'desktop', contrast: true, aria: vp.id === 'desktop', walkMax: 50 }); }

  // Keyboard doors: open each with the keyboard, see where focus lands, try Tab, then Escape, from where a keyboard user really is.
  await hashTo(p, `/page/${seed.board}`); await settle(p, 300); await hashTo(p, `/page/${seed.ch[0]}`); await p.waitForSelector('.forward-only-editor', { timeout: 10000 }).catch(() => {}); await settle(p, 600); await helpersReady(p);
  const where = () => p.evaluate(() => { const el = document.activeElement; const d = window.__a11y.describe(el); d.inDialog = !!el.closest('[role=dialog]'); d.inPanel = !!el.closest('.desk-frame-cascade-anchor'); d.inRail = !!el.closest('.wz-strip'); d.inTutor = !!el.closest('.wz-tutor-zone, .wz-tutor-panel'); return d; });
  { // Publish dialog
    const t = { ...info, door: 'Publish dialog' };
    const tab = p.locator('.desk-mode-tab', { hasText: /publish|connect|relay/i }).first();
    await tab.focus().catch(() => {}); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    t.opened = !!(await p.$('[role=dialog]')); t.focusOnOpen = await where();
    t.tabStops = []; for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(80); t.tabStops.push(await where()); }
    t.leftDialogOnTab = t.tabStops.filter((x) => !x.inDialog).length;
    await p.keyboard.press('Escape'); await p.waitForTimeout(400); t.closedByEsc = !(await p.$('[role=dialog]'));
    t.focusAfterEsc = await where();
    if (!t.closedByEsc) { await p.mouse.click(3, 3).catch(() => {}); await p.waitForTimeout(300); }
    t.stillOpenAfterBackdropClick = !!(await p.$('[role=dialog]'));
    escResults.push(t); }
  for (const nm of railNames) { // rail panels
    const t = { ...info, door: 'Rail: ' + nm };
    const btn = p.locator('.wz-strip-item', { hasText: nm }).first();
    await btn.focus().catch(() => {}); await p.keyboard.press('Enter'); await p.waitForTimeout(350);
    const isOpen = async () => !!(await p.$('.wz-strip-item[aria-pressed=true]'));
    t.opened = await isOpen(); t.focusOnOpen = await where();
    await p.keyboard.press('Escape'); await p.waitForTimeout(300); t.escFromRailButton = !(await isOpen());
    if (!t.escFromRailButton) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(120); t.tabGoesTo = await where();
      await p.keyboard.press('Escape'); await p.waitForTimeout(300); t.escAfterOneTab = !(await isOpen());
    }
    if (await isOpen()) { await p.evaluate(() => document.querySelector('.forward-only-editor')?.focus()); await p.keyboard.press('Escape'); await p.waitForTimeout(300); t.escFromPage = !(await isOpen()); }
    if (await isOpen()) { await btn.click().catch(() => {}); await p.waitForTimeout(250); }
    escResults.push(t); }
  { // Tutor
    const t = { ...info, door: 'Tutor' };
    const isOpen = () => p.evaluate(() => !!document.querySelector('.wz-tutor-panel[data-open=true]'));
    const g = p.locator('.wz-tutor-grip').first();
    if (await g.count()) {
      await g.focus().catch(() => {}); t.gripFocusable = (await where()).cls.includes('wz-tutor-grip');
      await p.keyboard.press('Enter'); await p.waitForTimeout(450); t.opened = await isOpen(); t.focusOnOpen = await where();
      if ((t.focusOnOpen.cls || '').includes('wz-tutor-disclosure-ack')) { // first run: the AI disclosure. Record it, acknowledge it, then test the Tutor itself.
        t.disclosure = { focusMovedIn: true }; await p.keyboard.press('Tab'); await p.waitForTimeout(100); t.disclosure.tabGoesTo = await where();
        await p.locator('.wz-tutor-disclosure-ack').first().focus().catch(() => {}); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
        t.opened = await isOpen(); t.focusOnOpen = await where(); }
      await p.keyboard.press('Escape'); await p.waitForTimeout(300); t.escWhereFocusWas = !(await isOpen());
      if (await isOpen()) { await p.keyboard.press('Tab'); await p.waitForTimeout(100); t.tabGoesTo = await where(); await p.keyboard.press('Escape'); await p.waitForTimeout(300); t.escAfterOneTab = !(await isOpen()); }
      if (await isOpen()) { await p.evaluate(() => document.querySelector('.forward-only-editor')?.focus()); await p.keyboard.press('Escape'); await p.waitForTimeout(300); t.escFromPage = !(await isOpen()); }
      t.focusAfter = await where();
    } else t.noGrip = true;
    escResults.push(t); }

  // Board, Journal, Shelf, Drawers, Trash
  await hashTo(p, `/page/${seed.board}`); await settle(p, 1200);
  await audit(p, info, 'board', { walk: vp.id === 'desktop', contrast: true, aria: vp.id === 'desktop', walkMax: 40 });
  for (const [scr, route] of [['journal', '/journal'], ['shelf', '/shelf'], ['drawers', '/drawers'], ['trash', '/trash']]) { await hashTo(p, route); await settle(p, 1000); await audit(p, info, scr, { aria: vp.id === 'desktop' && theme === 'plateau' }); }
  await c.close();
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ when: new Date().toISOString(), base: BASE, results, escResults }, null, 1));
await browser.close();
console.log('DONE', results.length, 'screens');
