// MACHINA FORMS - THE DOM HALF (a box turn; Fable's brief Oct 24 §1; frames m7 / m8). The data (counts, groups, order) is machina-forms-logic.mjs's, browserless. This drives the real wizard's library step under Machina:
//   PANEL   P1  the panel is 600 wide at most and NEVER extends past the stage's bottom (the list scrolls inside it, with the thin bar)        P2  square, a 1px strong hairline, no shadow
//   ORDER   O1  INTAKE first (boxed in a hairline, its word in --text-accent), then the seven groups in order (those with decks), each deck once
//   ROWS    R1  name (Plex Sans) - cover line - the block count in mono, right-aligned; the counts are the mockup's        R2  hover / focus = a 2px left bar in --choice + the --ink-800 fill
//   CARRIER K1  no text is in the carrier colour at rest (the one named exception: the Intake word, --text-accent, per the mockup)
//   MOTION  M1  nothing in the panel transitions or animates (computed 0s)
//   FLOOR   C1  names >= 7:1, labels >= 4.5:1 - computed on every text, COOL + NEUTRAL, dark + light page (the chrome stays dark)
//   KEYS    Y1  ArrowDown / ArrowUp walk the rows; Enter on a row opens the deck's own question IN THE SAME PANEL, in this dress, and answering it DEALS (Three-Act -> short story: its 6 blocks)        Y2  Esc closes the panel
//   ARBOR   A1  Arbor's library step is unchanged (the cream card list, no Forms markup)
//
// Run (repo root; needs a box turn):  node apps/desktop/scripts/harness/machina-forms.mjs      MF_FRAMES=<dir> saves frames
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FRAMES = process.env.MF_FRAMES || null;
const frame = async (app, name) => { if (!FRAMES) return; mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
const COUNTS = { 'three-act': '6–9', 'hero-journey': '8–12', 'story-circle': '8', 'character-study': '2–4 ×', 'scene-sequel': '6–30', worldbuilding: '7', 'feature-screenplay': '15', thesis: '9', 'argument-essay': '5–7', 'research-paper': '5', grant: '6', 'business-proposal': '7' };
const KICKERS = ['Fiction', 'World', 'Screen', 'Academic', 'Business', 'Newsroom'];

const SCAN = `(() => { const d = document.querySelector('.deck-wizard-dialog'); if (!d) return null;
  const rgb = (c) => { const m = /rgba?\\(([^)]+)\\)/.exec(c || ''); if (!m) return null; const v = m[1].split(',').map((x) => parseFloat(x)); return { c: v.slice(0, 3), a: v.length > 3 ? v[3] : 1 }; };
  const lum = ([r, g, b]) => { const f = (x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const ground = (el) => { for (let n = el; n; n = n.parentElement) { const bg = rgb(getComputedStyle(n).backgroundColor); if (bg && bg.a > 0.5) return bg.c; } return [0, 0, 0]; };
  const probe = (v) => { const i = document.createElement('i'); i.style.color = 'var(' + v + ')'; document.body.appendChild(i); const c = rgb(getComputedStyle(i).color).c; i.remove(); return c; };
  const choice = probe('--choice');
  const NAMES = '.forms-name, .deck-wizard-question, .deck-wizard-option-btn, .deck-wizard-deck-row';
  const rows = [];
  for (const el of d.querySelectorAll('*')) { const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (!own) continue; const col = rgb(getComputedStyle(el).color); if (!col) continue;
    rows.push({ cls: String(el.className || el.tagName).slice(0, 36), kind: el.matches(NAMES) ? 'name' : 'label', ratio: Math.round(ratio(col.c, ground(el)) * 100) / 100, carrier: col.c.join() === choice.join(), intake: el.matches('.forms-intake-word') }); }
  const cs = getComputedStyle(d); const r = d.getBoundingClientRect();
  const motion = [...d.querySelectorAll('*'), d].map((el) => { const s = getComputedStyle(el); return Math.max(...s.transitionDuration.split(',').map((x) => parseFloat(x) || 0), ...s.animationDuration.split(',').map((x) => parseFloat(x) || 0)); });
  return { w: Math.round(r.width), bottom: Math.round(r.bottom), vh: innerHeight, radius: cs.borderRadius, shadow: cs.boxShadow, border: cs.borderTopWidth + ' ' + cs.borderLeftWidth,
    names: rows.filter((x) => x.kind === 'name'), labels: rows.filter((x) => x.kind === 'label'), carrierText: rows.filter((x) => x.carrier && !x.intake).length,
    minName: rows.filter((x) => x.kind === 'name').reduce((m, x) => Math.min(m, x.ratio), 99), minLabel: rows.filter((x) => x.kind === 'label').reduce((m, x) => Math.min(m, x.ratio), 99), maxMotion: Math.max(...motion), choice }; })()`;
const boot = async (app, { cast, page, theme = 'machina' }) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','${theme}'); localStorage.setItem('wrizo-machina-cast','${cast}');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('${theme}'); window.wrizoCast && window.wrizoCast.set('${cast}'); window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${page}' })`);
  await sleep(500);
  await app.evalJs("location.hash = '#/page/new?kind=board&deck=library'");
  await app.waitFor("!!document.querySelector('.deck-wizard-dialog')", { label: 'the deck wizard', timeout: 12000 }).catch(() => {});
  await sleep(1400);
};
const key = async (app, k) => { const code = k === 'Enter' ? 'Enter' : k; const extra = k === 'Enter' ? { text: '\r' } : {}; await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, ...(k === 'Enter' ? { windowsVirtualKeyCode: 13 } : k === 'Escape' ? { windowsVirtualKeyCode: 27 } : k === 'ArrowDown' ? { windowsVirtualKeyCode: 40 } : { windowsVirtualKeyCode: 38 }), ...extra }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code }); };

await withHarness(async (app) => {
  for (const cast of ['cool', 'neutral']) {
    for (const page of ['dark', 'light']) {
      const label = `${cast}/${page}`;
      await boot(app, { cast, page });
      const m = await app.evalJs(SCAN);
      const lay = await app.evalJs(`(() => { const d = document.querySelector('.deck-wizard-dialog'); const body = d.querySelector('.forms-body'); const intake = d.querySelector('.forms-intake'); const kick = [...d.querySelectorAll('.forms-kicker')].map((k) => k.textContent.trim()); const order = [...d.querySelectorAll('.forms-row')].map((r) => r.dataset.deckId);
        const first = body ? body.firstElementChild : null; const is = intake ? getComputedStyle(intake) : null;
        const rowCount = {}; for (const r of d.querySelectorAll('.forms-row')) rowCount[r.dataset.deckId] = r.querySelector('.forms-count').textContent.trim();
        const row = d.querySelector('.forms-row'); const cols = row ? getComputedStyle(row).gridTemplateColumns : null; const foot = (d.querySelector('.forms-foot') || {}).textContent;
        return { title: (d.querySelector('.deck-wizard-eyebrow') || {}).textContent, intakeFirst: first === intake, intakeBorder: is ? is.borderTopWidth + ' ' + is.borderTopStyle : null, intakeText: intake ? intake.innerText.replace(/\\s+/g, ' ') : null, kick, order, rowCount, cols, foot, scroll: body ? { sh: body.scrollHeight, ch: body.clientHeight } : null, rowFont: row ? getComputedStyle(row.querySelector('.forms-name')).fontFamily : null, countFont: row ? getComputedStyle(row.querySelector('.forms-count')).fontFamily : null }; })()`);
      ok(`P1 [${label}]: the panel is at most 600 wide (${m ? m.w : '?'}) and never extends past the window's bottom (${m ? m.bottom : '?'} <= ${m ? m.vh : '?'}); the list scrolls INSIDE it`, !!m && m.w <= 600 && m.bottom <= m.vh && !!lay.scroll && lay.scroll.sh >= lay.scroll.ch, JSON.stringify({ w: m && m.w, bottom: m && m.bottom, scroll: lay.scroll }));
      ok(`P2 [${label}]: square, a 1px hairline, no shadow`, !!m && parseFloat(m.radius) === 0 && m.shadow === 'none' && m.border === '1px 1px', JSON.stringify(m && { radius: m.radius, shadow: m.shadow, border: m.border }));
      ok(`O1 [${label}]: titled FORMS; INTAKE is the first row, boxed in a hairline, with "three fields, one recommendation"`, lay.title === 'Forms' && lay.intakeFirst && lay.intakeBorder === '1px solid' && /Intake\s+three fields, one recommendation/.test(lay.intakeText || ''), JSON.stringify({ title: lay.title, first: lay.intakeFirst, border: lay.intakeBorder, text: lay.intakeText }));
      ok(`O1 [${label}]: the groups run Fiction, World, Screen, Academic, Business, Newsroom (From my pages' "Your files" only when there are pages) - each deck once, in the mockup's order`,
        lay.kick.slice(0, 6).join('|') === KICKERS.join('|') && lay.order.join(',') === 'three-act,hero-journey,story-circle,character-study,scene-sequel,worldbuilding,feature-screenplay,thesis,argument-essay,research-paper,grant,business-proposal,feature-story', JSON.stringify({ kick: lay.kick, order: lay.order }));
      ok(`R1 [${label}]: each row is name - cover line - a mono count, and the counts are the mockup's (${Object.entries(COUNTS).length} checked)`, Object.entries(COUNTS).every(([id, c]) => lay.rowCount[id] === c) && /IBM Plex Sans/.test(lay.rowFont || '') && /IBM Plex Mono/.test(lay.countFont || ''), JSON.stringify({ rowCount: lay.rowCount, rowFont: lay.rowFont, countFont: lay.countFont }));
      ok(`K1 [${label}]: no text is in the carrier colour at rest (the Intake word, --text-accent, is the mockup's one named exception)`, !!m && m.carrierText === 0, JSON.stringify({ carrierText: m && m.carrierText, choice: m && m.choice }));
      ok(`M1 [${label}]: nothing in the panel transitions or animates (computed 0s)`, !!m && m.maxMotion === 0, String(m && m.maxMotion));
      ok(`C1 [${label}]: names >= 7:1 (min ${m ? m.minName : '?'}) and labels >= 4.5:1 (min ${m ? m.minLabel : '?'}) - ${m ? m.names.length : 0} names and ${m ? m.labels.length : 0} labels measured`, !!m && m.names.length >= 12 && m.labels.length >= 8 && m.minName >= 7 && m.minLabel >= 4.5, JSON.stringify(m && { worstName: m.names.slice().sort((a, b) => a.ratio - b.ratio)[0], worstLabel: m.labels.slice().sort((a, b) => a.ratio - b.ratio)[0] }));
      if (page === 'dark') await frame(app, `forms-${cast}`);
      // R2: a REAL pointer on a row
      const pt = await app.evalJs("(() => { const r = document.querySelector('.forms-row[data-deck-id=\"research-paper\"]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
      await app.mouseMove(pt.x, pt.y); await sleep(300);
      const hov = await app.evalJs(`(() => { const r = document.querySelector('.forms-row[data-deck-id="research-paper"]'); const probe = (v, prop) => { const i = document.createElement('i'); i.style[prop] = 'var(' + v + ')'; document.body.appendChild(i); const c = getComputedStyle(i)[prop]; i.remove(); return c; }; const cs = getComputedStyle(r); return { hovered: r.matches(':hover'), shadow: cs.boxShadow, bg: cs.backgroundColor, choice: probe('--choice', 'color'), fill: probe('--ink-800', 'backgroundColor') }; })()`);
      ok(`R2 [${label}]: a row under a real pointer gets a 2px left bar in --choice and the --ink-800 fill`, hov.hovered && hov.shadow.includes(hov.choice) && /inset/.test(hov.shadow) && hov.bg === hov.fill, JSON.stringify(hov));
      if (page === 'dark') await frame(app, `forms-${cast}-hover`);
      // Y1 (once per cast, dark): keys
      if (page === 'dark') {
        await app.evalJs("document.querySelector('.forms-row[data-deck-id=\"three-act\"]').focus()");
        await key(app, 'ArrowDown'); await sleep(150);
        const f1 = await app.evalJs("document.activeElement ? document.activeElement.dataset.deckId : null");
        await key(app, 'ArrowUp'); await sleep(150);
        const f2 = await app.evalJs("document.activeElement ? document.activeElement.dataset.deckId : null");
        ok(`Y1 [${label}]: ArrowDown / ArrowUp walk the rows (three-act -> ${f1} -> ${f2})`, f1 === 'hero-journey' && f2 === 'three-act', `${f1} ${f2}`);
        await key(app, 'Enter'); await sleep(600);
        const q = await app.evalJs("({ dialog: !!document.querySelector('.deck-wizard-dialog'), forms: !!document.querySelector('.forms-body'), opts: [...document.querySelectorAll('.deck-wizard-option-btn')].map((b) => b.dataset.optionId) })");
        const qm = await app.evalJs(SCAN);
        ok(`Y1 [${label}]: Enter on a row opens the deck's own question IN THE SAME PANEL, in this dress (novel / novella / short story; names >= 7:1, labels >= 4.5:1)`, q.dialog && !q.forms && q.opts.join(',') === 'novel,novella,short-story' && !!qm && qm.minName >= 7 && qm.minLabel >= 4.5 && qm.maxMotion === 0, JSON.stringify({ q, minName: qm && qm.minName, minLabel: qm && qm.minLabel }));
        await frame(app, `forms-${cast}-question`);
        await app.evalJs("document.querySelector('.deck-wizard-option-btn[data-option-id=\"short-story\"]').click()");
        await sleep(2200);
        await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()'); await sleep(500);
        const dealt = await app.evalJs(`(() => { let n = 0; for (const k of Object.keys(localStorage)) { let v; try { v = JSON.parse(localStorage.getItem(k)); } catch { continue; } if (!Array.isArray(v)) continue; for (const e of v) if (e && e.pageType === 'board' && Array.isArray(e.boxes)) { const c = e.boxes.filter((b) => b && b.deckStep && b.deckStep.deck === 'three-act').length; if (c > n) n = c; } } return n; })()`);
        ok(`Y1 [${label}]: answering the question DEALS - Three-Act's short form, 6 blocks`, dealt === 6, String(dealt));
      }
    }
  }
  // Y2: Esc closes
  await boot(app, { cast: 'cool', page: 'dark' });
  await key(app, 'Escape'); await sleep(500);
  const gone = await app.evalJs("!document.querySelector('.deck-wizard-dialog')");
  ok('Y2: Esc closes the Forms panel', gone, String(gone));
  // A1: Arbor's library step is unchanged
  await boot(app, { cast: 'cool', page: 'dark', theme: 'plateau' });
  const arbor = await app.evalJs("({ forms: !!document.querySelector('.forms-body'), rows: document.querySelectorAll('.deck-wizard-deck-row').length, bg: getComputedStyle(document.querySelector('.deck-wizard-dialog')).backgroundColor, title: (document.querySelector('.deck-wizard-eyebrow') || {}).textContent })");
  ok('A1 [Arbor]: the library step is unchanged - the plain list of decks (14 rows or the pages-gated 13), the cream card, "Choose a deck"', !arbor.forms && arbor.rows >= 13 && arbor.bg === 'rgb(251, 246, 234)' && arbor.title === 'Choose a deck', JSON.stringify(arbor));
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 420)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nMACHINA-FORMS VERIFY: PASS (${checks.length} checks)` : `\nMACHINA-FORMS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
