// THE STAGE STRIP CARRIES NO "?" (Nick's ruling, Nov 19 2:01 pm, via Fable). The "?" help button beside the stage names in the top
// strip (ModeStrip.tsx: Free Write's and Publish's) is removed in every theme. Every other "?" in the app stays, and the help words
// stay in the lexicon (help moves to right-click menus later).
//
//   N1  [theme x tone x surface] the stage strip has no "?": no .wz-help, no .desk-mode-tab-wrap, and no control in it that names a
//       stage's help ("What is ...?") or reads "?". LIVE in the same cell: the strip is mounted with its four stage keys, and the
//       document carries the theme and page tone asked for. Arbor, Flux and Machina x dark and light x a Page and a screenplay = 12.
//       A Page is read twice: as it opens (Free Write) and again in Draft. Flux draws its Free Write dark whatever the tone (jacked in:
//       data-flux3-jacked), so the tone is asserted on the Draft read; both reads must carry no "?". (Found on the first green run:
//       flux/light/page read tone "dark" on main and on the fix alike, with the "?" absent on the fix - the premise, not the product.)
//   MUT [same cells] a "?" planted into the live strip (the old DOM shape: a wrap holding a .wz-help) is SEEN by the same reader, so
//       the reader is not blind; the plant is removed before the next cell. The source mutant is the red-first run itself: origin/main,
//       where ModeStrip still mounts its HelpButton, must FAIL N1 in every cell.
//   K1  every other "?" stays: the Draft tools' Templates heading still carries its own "?" (Arbor), and it opens.
//   K2  the help words stay: helpFreeWrite and helpPublish are still in the canonical lexicon and Flux's overrides (source).
//
// Run: node scripts/harness/strip-no-help.mjs   (from apps/desktop, dist-web freshly built, box turn granted; or harness.yml)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

const THEMES = ['plateau', 'flux', 'machina'];
const TONES = ['dark', 'light'];
const KEYS = ['freewrite', 'draft', 'revise', 'publish'];

// The reader: everything in the strip that is (or holds) a "?".
const READ_STRIP = `(() => {
  const strip = document.querySelector('.desk-mode-strip');
  if (!strip) return null;
  const helps = [...strip.querySelectorAll('.wz-help')].length;
  const wraps = [...strip.querySelectorAll('.desk-mode-tab-wrap')].length;
  const named = [...strip.querySelectorAll('button, [role="button"]')].filter((b) => /^What is /.test(b.getAttribute('aria-label') || '') || (b.textContent || '').trim() === '?').length;
  const keys = [...strip.querySelectorAll('.desk-mode-tab[data-mode-key]')].map((b) => b.getAttribute('data-mode-key'));
  return { helps, wraps, named, keys, theme: document.documentElement.getAttribute('data-theme'), tone: document.documentElement.getAttribute('data-page'), jacked: document.documentElement.hasAttribute('data-flux3-jacked') };
})()`;
const PLANT = `(() => {
  const strip = document.querySelector('.desk-mode-strip');
  const wrap = document.createElement('span'); wrap.className = 'desk-mode-tab-wrap'; wrap.setAttribute('data-strip-no-help-plant', '');
  const b = document.createElement('button'); b.type = 'button'; b.className = 'wz-help'; b.setAttribute('aria-label', 'What is Free Write?'); b.textContent = '?';
  wrap.appendChild(b); strip.appendChild(wrap); return true;
})()`;
const UNPLANT = "document.querySelectorAll('[data-strip-no-help-plant]').forEach((n) => n.remove())";
const clean = (r) => !!r && r.helps === 0 && r.wraps === 0 && r.named === 0;

async function openSurface(app, theme, tone, surface) {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${JSON.stringify(tone)}, fade: 'on' }));`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk, for seeding', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash', timeout: 15000 }).catch(() => {});
  const id = `snh-${surface}-${theme}-${tone}`;
  const now = new Date().toISOString();
  const row = surface === 'script'
    ? { id, text: '', pageType: 'script', script: { v: 1, scenes: [{ id: `${id}-h`, heading: { id: `${id}-h`, t: 'scene', text: '' }, body: [] }] }, createdAt: now, source: null, origin: null }
    : { id, text: 'A page for the strip checks.', origin: 'loose', source: 'page', createdAt: now };
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const found = await app.waitFor("!!document.querySelector('.desk-mode-strip .desk-mode-tab[data-mode-key=\"publish\"]')", { label: `the strip (${surface})`, timeout: 15000 }).then(() => true, () => false);
  await sleep(500);
  return found;
}

await withHarness(async (app) => {
  for (const theme of THEMES) {
    for (const tone of TONES) {
      for (const surface of ['page', 'script']) {
        const cell = `${theme}/${tone}/${surface}`;
        const mounted = await openSurface(app, theme, tone, surface);
        const opened = mounted ? await app.evalJs(READ_STRIP) : null;
        let r = opened;
        if (mounted && surface === 'page') {
          // the same strip in Draft, where every theme draws the tone asked for
          await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click()");
          await app.waitFor(`document.documentElement.getAttribute('data-page') === ${JSON.stringify(tone)}`, { label: 'the tone, in Draft', timeout: 6000 }).catch(() => {});
          await sleep(300);
          r = await app.evalJs(READ_STRIP);
        }
        const live = !!r && KEYS.every((k) => r.keys.includes(k)) && r.theme === theme && r.tone === tone
          && !!opened && KEYS.every((k) => opened.keys.includes(k)) && opened.theme === theme;
        ok(`N1 [${cell}] the stage strip has no "?" (and it is live: the four stage keys, theme ${theme}, tone ${tone})`, live && clean(r) && clean(opened), JSON.stringify(surface === 'page' ? { opened, draft: r } : r));
        if (!mounted || !r) { ok(`MUT [${cell}] a planted "?" is seen by the reader`, false, 'no strip to plant into'); continue; }
        await app.evalJs(PLANT);
        const planted = await app.evalJs(READ_STRIP);
        await app.evalJs(UNPLANT);
        const after = await app.evalJs(READ_STRIP);
        ok(`MUT [${cell}] a "?" planted into the live strip turns the reader RED (it is seen), and the plant is gone after`,
          !!planted && !clean(planted) && planted.helps === r.helps + 1 && planted.wraps === r.wraps + 1 && planted.named === r.named + 1
            && JSON.stringify(after) === JSON.stringify(r), JSON.stringify({ planted, after }));
      }
    }
  }

  // K1: every other "?" stays. The Draft tools' Templates heading (Arbor) keeps its own, and it opens.
  await openSurface(app, 'plateau', 'dark', 'page');
  await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click()");
  await sleep(300);
  const open = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
  if (!open) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(400); }
  const SEL = '.wz-sliver-templates .wz-sliver-h .wz-help';
  const there = await app.evalJs(`!!document.querySelector(${JSON.stringify(SEL)})`);
  let opened = null;
  // a trusted press at the "?"'s own centre (the standing law: nothing uses page-side .click() on a "?")
  const press = async () => {
    const c = await app.evalJs(`(() => { const r = document.querySelector(${JSON.stringify(SEL)}).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    await app.mouseDown(c.x, c.y); await app.mouseUp(c.x, c.y);
  };
  if (there) {
    await press();
    await sleep(250);
    opened = await app.evalJs("document.querySelector('.wz-help-pop')?.textContent ?? null");
    await press();
  }
  ok('K1 every other "?" stays: the Templates heading in the Draft tools still carries its own "?", and it opens its sentence',
    there && opened === 'Ready-made page layouts.', JSON.stringify({ there, opened }));
});

// K2: the help words stay in the lexicon (source).
{
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'settings.ts'), 'utf8');
  const flux = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'overrides', 'flux.ts'), 'utf8');
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const has = (t, k) => new RegExp(`\\b${k}:\\s*'[^']+'`).test(t);
  const r = { canonFW: has(canon, 'helpFreeWrite'), canonPub: has(canon, 'helpPublish'), fluxFW: has(flux, 'helpFreeWrite'), fluxPub: has(flux, 'helpPublish'), terms: /'helpFreeWrite'/.test(terms) && /'helpPublish'/.test(terms) };
  ok('K2 the help words stay: helpFreeWrite and helpPublish are in the canonical lexicon, Flux\'s overrides and the term list', Object.values(r).every(Boolean), JSON.stringify(r));
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + c.detail}`);
const expected = THEMES.length * TONES.length * 2 * 2 + 2;
const pass = checks.length === expected && checks.every((c) => c.pass);
console.log(pass
  ? `\nSTRIP-NO-HELP VERIFY: PASS (${checks.length} checks)`
  : `\nSTRIP-NO-HELP VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === expected ? '' : ` (expected ${expected} checks)`}`);
process.exit(pass ? 0 : 1);
