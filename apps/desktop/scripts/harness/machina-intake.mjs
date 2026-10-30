// MACHINA INTAKE - THE DOM HALF (a box turn; Fable's brief Oct 24 §2 via the TOOLS #9 handoff; frames m5 / m6). Machina's Help me choose is ONE form: DOCUMENT / CARRIED BY / BRIEFING on screen at once, the result in place.
// The logic (the table, the landing, nothing stored) is help-choose-census.mjs's, browserless - "no new logic" - so this file checks only what Intake adds: the dress, the form, the floors.
//   FORM    I1  all three fields are present at once on open; CARRIED BY waits for DOCUMENT (disabled), BRIEFING for both         I2  the result appears ONLY when all three are set (no button asks for it); it replaces the fields with a readout
//   RESULT  R1  the pick is the table's (research paper / a question and a method -> Research Paper (IMRaD)), its N BLOCKS, why, Create Agenda, "or <alternative> · <cover>", ALL FORMS →, BACK, ESC TO CLOSE      R2  header: "3 FIELDS · NOTHING STORED", then "n / 3"
//   DRESS   P1  square, a 1px strong hairline, no shadow, 520 wide at most      K1  no text in the carrier colour at rest      M1  nothing transitions or animates (computed 0s)      C1  names >= 7:1, labels >= 4.5:1 (COOL + NEUTRAL, dark + light page)
//   LAWS    L1  nothing is stored: localStorage byte-identical from open to the result      L2  Esc closes it and focus returns to the Intake row      Y1  ArrowDown / ArrowUp walk a list's answers
//   DEAL    B1  Create Agenda deals the pick (the wizard closes, the Agenda is born) and Q3's landing is honoured (the shape -> the Walk)
//
// Run (repo root; needs a box turn):  node apps/desktop/scripts/harness/machina-intake.mjs      MI_FRAMES=<dir> saves frames
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FRAMES = process.env.MI_FRAMES || null;
const frame = async (app, name) => { if (!FRAMES) return; mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };

const SCAN = `(() => { const d = document.querySelector('.help-intake'); if (!d) return null;
  const rgb = (c) => { const m = /rgba?\\(([^)]+)\\)/.exec(c || ''); if (!m) return null; const v = m[1].split(',').map((x) => parseFloat(x)); return { c: v.slice(0, 3), a: v.length > 3 ? v[3] : 1 }; };
  const lum = ([r, g, b]) => { const f = (x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const ground = (el) => { for (let n = el; n; n = n.parentElement) { const bg = rgb(getComputedStyle(n).backgroundColor); if (bg && bg.a > 0.5) return bg.c; } return [0, 0, 0]; };
  const probe = (v) => { const i = document.createElement('i'); i.style.color = 'var(' + v + ')'; document.body.appendChild(i); const c = rgb(getComputedStyle(i).color).c; i.remove(); return c; };
  const choice = probe('--choice');
  const NAMES = '.help-q, .help-select-val, .help-readout-v, .help-begin';
  const rows = [];
  for (const el of d.querySelectorAll('*')) { const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (!own) continue; const col = rgb(getComputedStyle(el).color); if (!col) continue;
    rows.push({ cls: String(el.className || el.tagName).slice(0, 36), kind: el.matches(NAMES) ? 'name' : 'label', ratio: Math.round(ratio(col.c, ground(el)) * 100) / 100, carrier: col.c.join() === choice.join() }); }
  const cs = getComputedStyle(d); const r = d.getBoundingClientRect();
  const motion = [...d.querySelectorAll('*'), d].map((el) => { const s = getComputedStyle(el); return Math.max(...s.transitionDuration.split(',').map((x) => parseFloat(x) || 0), ...s.animationDuration.split(',').map((x) => parseFloat(x) || 0)); });
  return { w: Math.round(r.width), radius: cs.borderRadius, shadow: cs.boxShadow, border: cs.borderTopWidth + ' ' + cs.borderLeftWidth,
    names: rows.filter((x) => x.kind === 'name'), labels: rows.filter((x) => x.kind === 'label'), carrierText: rows.filter((x) => x.carrier).length,
    minName: rows.filter((x) => x.kind === 'name').reduce((m, x) => Math.min(m, x.ratio), 99), minLabel: rows.filter((x) => x.kind === 'label').reduce((m, x) => Math.min(m, x.ratio), 99), maxMotion: Math.max(...motion), choice }; })()`;

const boot = async (app, { cast, page }) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina'); localStorage.setItem('wrizo-machina-cast','${cast}');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('machina'); window.wrizoCast && window.wrizoCast.set('${cast}'); window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${page}' })`);
  await sleep(500);
  await app.evalJs("location.hash = '#/page/new?kind=board&deck=library'");
  await app.waitFor("!!document.querySelector('.deck-wizard-dialog')", { label: 'the Forms panel', timeout: 12000 }).catch(() => {});
  await sleep(1200);
};
const press = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
const option = (app, id) => press(app, `.help-intake [data-help-option="${id}"]`);
const store = (app) => app.evalJs("JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]))");
const key = async (app, k) => { const vk = { Escape: 27, ArrowDown: 40, ArrowUp: 38 }[k]; await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: vk }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k }); };
const state = (app) => app.evalJs(`(() => { const p = document.querySelector('.help-intake'); if (!p) return null; return { fields: [...p.querySelectorAll('.help-field')].map((f) => ({ f: f.dataset.field, open: f.dataset.open, disabled: !!f.querySelector('button.help-select:disabled'), na: !!f.querySelector('.help-select-na'), val: (f.querySelector('.help-select-val') || {}).textContent || null })),
  readout: !!p.querySelector('.help-readout'), begin: !!p.querySelector('[data-help-begin]'), head: (p.querySelector('.help-fieldsnote') || {}).textContent || null, text: p.innerText.replace(/\\s+/g, ' '), foot: (p.querySelector('.help-foot-intake') || {}).innerText || '' }; })()`);

await withHarness(async (app) => {
  for (const cast of ['cool', 'neutral']) {
    for (const page of ['dark', 'light']) {
      const label = `${cast}/${page}`;
      await boot(app, { cast, page });
      const before = await store(app);
      const formsRect = await app.evalJs("(() => { const r = document.querySelector('.deck-wizard-dialog').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })()");
      await press(app, '.forms-intake'); await sleep(450);
      const s0 = await state(app);
      ok(`I1 [${label}]: all three fields are present at once (DOCUMENT, CARRIED BY, BRIEFING); the later two wait for the earlier (disabled), and the first list is open`, !!s0 && s0.fields.map((f) => f.f).join() === 'document,carried,briefing' && s0.fields[0].open === 'true' && s0.fields[1].disabled && s0.fields[2].disabled && !s0.readout && /3 FIELDS · NOTHING STORED/i.test(s0.head || ''), JSON.stringify(s0 && { fields: s0.fields, head: s0.head }));
      await option(app, 'research-paper'); await sleep(300);
      await option(app, 'question-method'); await sleep(300);
      const s2 = await state(app);
      if (page === 'dark') await frame(app, `intake-${cast}-fields`);
      ok(`I2 [${label}]: with two fields set there is NO result and no button asking for one; BRIEFING's list is open and the header reads 2 / 3`, !!s2 && !s2.readout && !s2.begin && s2.fields[2].open === 'true' && /^2 \/ 3$/.test((s2.head || '').trim()), JSON.stringify(s2 && { readout: s2.readout, begin: s2.begin, head: s2.head, open: s2.fields.map((f) => f.open) }));
      const mid = await app.evalJs(SCAN);
      await option(app, 'shape'); await sleep(450);
      const s3 = await state(app);
      if (page === 'dark') await frame(app, `intake-${cast}-result`);
      ok(`I2 [${label}]: the moment the third is set the result appears in place - a readout replaces the fields, and Create Agenda is under focus`, !!s3 && s3.readout && s3.begin && s3.fields.length === 0 && (await app.evalJs("!!document.activeElement && document.activeElement.hasAttribute('data-help-begin')")), JSON.stringify(s3 && { readout: s3.readout, begin: s3.begin, fields: s3.fields.length }));
      ok(`R1 [${label}]: the pick is the table's - Research Paper (IMRaD), "5 BLOCKS", Create Agenda, "or Thesis / Dissertation (Sciences)", and the foot reads ALL FORMS → · BACK · ESC TO CLOSE`,
        !!s3 && /Research Paper/.test(s3.text) && /5 blocks/i.test(s3.text) && /Create Agenda/.test(s3.text) && /or Thesis/.test(s3.text) && /RECOMMENDED FORM/i.test(s3.text) && /DOCUMENT\s+a research paper/i.test(s3.text) && /CARRIED BY\s+a question and a method/i.test(s3.text) && /BRIEFING\s+the shape/i.test(s3.text) && /all forms →\s*back\s*esc to close/i.test(s3.foot.replace(/\s+/g, ' ')), JSON.stringify(s3 && { text: s3.text.slice(0, 260), foot: s3.foot }));
      ok(`R2 [${label}]: the header reads 3 / 3 once begun`, !!s3 && /^3 \/ 3$/.test((s3.head || '').trim()), s3 && s3.head);
      const m = await app.evalJs(SCAN);
      // ---- PARKED VERBATIM - SUPERSEDED by Fable's ruling (Oct 28): Intake REPLACES the Forms content inside the Forms dialog, so it has no border of its own and is the dialog's width (<= 600), not 520. Successor follows; the original is not run.
      // ok(`P1 [${label}]: square, a 1px hairline, no shadow, 520 wide at most (${m ? m.w : '?'})`, !!m && parseFloat(m.radius) === 0 && m.shadow === 'none' && m.border === '1px 1px' && m.w <= 520, JSON.stringify(m && { radius: m.radius, shadow: m.shadow, border: m.border, w: m.w }));
      // ------------------------------------------------------------------
      ok(`P1 [${label}] [Oct 28 successor]: square, no shadow, NO border of its own (it fills the Forms dialog), at most the dialog's 600 wide (${m ? m.w : '?'})`, !!m && parseFloat(m.radius) === 0 && m.shadow === 'none' && m.border === '0px 0px' && m.w <= 600, JSON.stringify(m && { radius: m.radius, shadow: m.shadow, border: m.border, w: m.w }));
      // E1 (Oct 28): Intake REPLACES the Forms content - one dialog, no second layer, the Forms list gone while it is open, the dialog's rect unchanged
      const swap = await app.evalJs("(() => { const d = document.querySelector('.deck-wizard-dialog'); const r = d ? d.getBoundingClientRect() : null; return { dialogs: document.querySelectorAll('.deck-wizard-dialog').length, backdrops: document.querySelectorAll('.help-backdrop').length, inside: !!(d && d.querySelector('.help-intake')), formsList: !!document.querySelector('.forms-body'), formsRows: document.querySelectorAll('.forms-row').length, rect: r && [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }; })()");
      ok(`E1 [${label}]: Intake REPLACES the Forms content - it is INSIDE the one Forms dialog, no second layer (no help-backdrop), and the Forms list is gone while it shows`, swap.dialogs === 1 && swap.backdrops === 0 && swap.inside && !swap.formsList && swap.formsRows === 0, JSON.stringify(swap));
      if (cast === 'cool' && page === 'dark') ok(`E2 [${label}]: the dialog stays where it was and as wide (left / top / width) - Intake only changes its height, to fit its own content (Forms is 640 tall; Intake is a short form)`, !!swap.rect && !!formsRect && swap.rect.slice(0, 3).join() === formsRect.slice(0, 3).join(), JSON.stringify({ forms: formsRect, intake: swap.rect }));
      ok(`K1 [${label}]: no text is in the carrier colour at rest (fields state and result)`, !!m && !!mid && m.carrierText === 0 && mid.carrierText === 0, JSON.stringify({ result: m && m.carrierText, fields: mid && mid.carrierText, choice: m && m.choice }));
      ok(`M1 [${label}]: nothing transitions or animates (computed 0s)`, !!m && !!mid && m.maxMotion === 0 && mid.maxMotion === 0, JSON.stringify({ result: m && m.maxMotion, fields: mid && mid.maxMotion }));
      ok(`C1 [${label}]: names >= 7:1 (min ${m ? Math.min(m.minName, mid ? mid.minName : 99) : '?'}) and labels >= 4.5:1 (min ${m ? Math.min(m.minLabel, mid ? mid.minLabel : 99) : '?'}) - fields state + result, ${m ? m.names.length + m.labels.length : 0} + ${mid ? mid.names.length + mid.labels.length : 0} texts`,
        !!m && !!mid && m.names.length >= 3 && mid.labels.length >= 6 && Math.min(m.minName, mid.minName) >= 7 && Math.min(m.minLabel, mid.minLabel) >= 4.5, JSON.stringify({ worstName: [...m.names, ...mid.names].sort((a, b) => a.ratio - b.ratio)[0], worstLabel: [...m.labels, ...mid.labels].sort((a, b) => a.ratio - b.ratio)[0] }));
      const during = await store(app);
      ok(`L1 [${label}]: nothing is stored - localStorage is byte-identical from before the panel opened to the result`, before === during, before === during ? '' : 'differs');
      if (page === 'dark') {
        // Y1 - the keys walk a list: back to the fields (BACK re-opens BRIEFING), ArrowDown moves between its answers
        await press(app, '.help-intake .help-back'); await sleep(350);
        const f0 = await app.evalJs("document.activeElement ? document.activeElement.dataset.helpOption : null");
        await key(app, 'ArrowDown'); await sleep(150);
        const f1 = await app.evalJs("document.activeElement ? document.activeElement.dataset.helpOption : null");
        await key(app, 'ArrowUp'); await sleep(150);
        const f2 = await app.evalJs("document.activeElement ? document.activeElement.dataset.helpOption : null");
        ok(`Y1 [${label}]: BACK re-opens BRIEFING with its first answer under focus (the third was just cleared), and ArrowDown / ArrowUp walk its answers (${f0} -> ${f1} -> ${f2})`, f0 === 'little' && f1 === 'shape' && f2 === 'little', `${f0} ${f1} ${f2}`);
        await key(app, 'Escape'); await sleep(400);
        const esc = await app.evalJs("({ panel: !!document.querySelector('.help-panel'), forms: !!document.querySelector('.deck-wizard-dialog'), focus: document.activeElement ? (document.activeElement.dataset.preset || document.activeElement.className) : null })");
        ok(`L2 [${label}]: Esc closes Intake (the Forms panel stays) and focus returns to the Intake row`, !esc.panel && esc.forms && esc.focus === 'help-me-choose', JSON.stringify(esc));
        // E3 (Oct 28): Back / ALL FORMS return to Forms - the list returns, Intake is gone, focus is on the Intake row
        await press(app, '.forms-intake'); await sleep(450);
        await press(app, '.help-intake [data-help-to-forms]'); await sleep(400);
        const bk = await app.evalJs("({ intake: !!document.querySelector('.help-intake'), forms: !!document.querySelector('.forms-body'), rows: document.querySelectorAll('.forms-row').length, focus: document.activeElement ? document.activeElement.dataset.preset : null })");
        ok(`E3 [${label}]: BACK on Intake returns to Forms - the list is back, Intake is gone, focus is on the Intake row`, !bk.intake && bk.forms && bk.rows > 0 && bk.focus === 'help-me-choose', JSON.stringify(bk));
        await press(app, '.forms-intake'); await sleep(450);
        await press(app, '.help-intake [data-help-browse]'); await sleep(400);
        const all = await app.evalJs("({ intake: !!document.querySelector('.help-intake'), forms: !!document.querySelector('.forms-body') })");
        ok(`E4 [${label}]: ALL FORMS → returns to Forms the same way`, !all.intake && all.forms, JSON.stringify(all));
        if (cast === 'cool') {
          // B1 - Create Agenda deals the pick, and Q3's landing is honoured: the shape -> the Walk
          await press(app, '.forms-intake'); await sleep(450);
          await option(app, 'research-paper'); await sleep(250); await option(app, 'question-method'); await sleep(250); await option(app, 'shape'); await sleep(450);
          await press(app, '[data-help-begin]'); await sleep(2000);
          const dealt = await app.evalJs("({ wizard: !!document.querySelector('.deck-wizard-dialog'), panel: !!document.querySelector('.help-panel'), walk: !!document.querySelector('[data-walk]') })");
          ok(`B1 [${label}]: Create Agenda deals the pick - both panels close - and "the shape" lands in the Step (the Walk)`, !dealt.wizard && !dealt.panel && dealt.walk, JSON.stringify(dealt));
        }
      }
    }
  }
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 420)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nMACHINA-INTAKE VERIFY: PASS (${checks.length} checks)` : `\nMACHINA-INTAKE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
