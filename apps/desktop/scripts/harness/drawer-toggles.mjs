// PHASE 1, S4 - THE TWO MODE TOGGLES BESIDE THE DRAWER'S "..." (Nick, Oct 10, 1:29 pm). Browserless: it reads the code that cannot run here.
// The browser half (a real click flips a real colour, a real Tab/Enter/Space, both themes x light/dark) is a box turn.
//
// What Nick asked for, as claims:
//   - TYPEWRITER MODE and PROGRESS TRACKING are icon-only buttons right beside the "..." (ON = brass icon, no fill; OFF = quiet), each with a clear
//     name and an on/off state a screen reader reports (aria-pressed); each is a real button (keyboard-operable);
//   - the old Typewriter row and Progress "Show" row leave the "..." menu; the toggles flip the SAME stored values they did (storage untouched);
//   - when a mode is off its remaining rows are greyed AND unusable (Typewriter: Forward Lock, Line Fade, Page Scroll; Progress: Unit, Goal,
//     Progress, Progress style, Timer);
//   - while Typewriter is on the whole FORMAT group is greyed and unusable, and the formatting shortcuts (Ctrl/Cmd+B/I/U) are blocked with it.
//
// Run: node scripts/harness/drawer-toggles.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const read = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const sh = (cmd) => { try { return execSync(cmd, { cwd: DESKTOP, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };

const sliverSrc = read('components/Sliver.tsx');
const stageSrc = read('components/ModeStage.tsx');
const lexSrc = read('store/deskLexicon.ts');
const peSrc = read('pages/PageEditor.tsx');
const iconsSrc = read('components/DrawerIcons.tsx');
const css = read('index.css');

// A top-level function's text: from its signature to the first line that is exactly "}".
function fnText(src, signature) {
  const a = src.indexOf(signature);
  if (a < 0) return null;
  const b = src.indexOf('\n}\n', a);
  return b < 0 ? null : src.slice(a, b + 3);
}
const countOf = (text, re) => (text.match(re) || []).length;

// =============================================================================
// THE CLAIMS, as one function of the sources so a mutant can change any one of them.
// =============================================================================
function claims(s = { sliver: sliverSrc, stage: stageSrc, lex: lexSrc, pe: peSrc, icons: iconsSrc, css }) {
  const row = fnText(s.sliver, 'function SliverInstrumentRow(');
  const tw = fnText(s.sliver, 'function TypewriterFields()');
  const pr = fnText(s.sliver, 'function ProgressFields(');
  const tools = fnText(s.sliver, 'function SliverToolsBody(');
  const seg = fnText(s.stage, 'export function Seg(');
  const out = { found: { row: !!row, tw: !!tw, pr: !!pr, tools: !!tools, seg: !!seg } };
  if (!row || !tw || !pr || !tools || !seg) return out;

  // ---- T1/T2: the buttons ---------------------------------------------------------------------------------------------
  const head = row.slice(row.indexOf('wz-sliver-instruments-head'));
  const rowDiv = row.slice(row.indexOf('wz-sliver-instruments-row"'), row.indexOf('wz-sliver-instruments-modes'));
  const twBtn = /<button type="button" className="wz-sliver-mode-btn" data-mode-toggle="typewriter"\s+aria-label=\{t\('modeToggleTypewriter'\)\} title=\{t\('modeToggleTypewriter'\)\}\s+aria-pressed=\{settings\.typewriter\}\s+onClick=\{\(\) => setTypewriterExplicit\(!settings\.typewriter\)\}>\s*<TypewriterModeIcon \/>\s*<\/button>/.test(row);
  const prBtn = /<button type="button" className="wz-sliver-mode-btn" data-mode-toggle="progress"\s+aria-label=\{t\('modeToggleProgress'\)\} title=\{t\('modeToggleProgress'\)\}\s+aria-pressed=\{settings\.instrumentsOn\}\s+onClick=\{\(\) => setWritingSettings\(\{ instrumentsOn: !settings\.instrumentsOn \}\)\}>\s*<ProgressModeIcon \/>\s*<\/button>/.test(row);
  out.buttons = {
    twBtn, prBtn,
    inHead: head.includes('wz-sliver-instruments-row') && head.includes('wz-sliver-instruments-modes'),
    moreStillAlone: countOf(rowDiv, /<button/g) === 1 && /aria-label=\{t\('footSettings'\)\}/.test(rowDiv),
    twGatedOnAvailability: /\{typewriterAvailable && \(\s*<button type="button" className="wz-sliver-mode-btn" data-mode-toggle="typewriter"/.test(row),
    realButtons: !/role="button"|tabIndex=\{-1\}|<div[^>]*onClick/.test(row.slice(row.indexOf('wz-sliver-instruments-modes'))),
  };
  // ---- T3: the words ----------------------------------------------------------------------------------------------------
  const key = (k) => new RegExp("\\| '" + k + "'").test(s.lex) && new RegExp('^  ' + k + ": '[^']+',$", 'm').test(s.lex);
  out.words = { tw: key('modeToggleTypewriter'), pr: key('modeToggleProgress') };
  const val = (k) => (new RegExp('^  ' + k + ": '([^']+)',$", 'm').exec(s.lex) || [])[1];
  out.names = { tw: val('modeToggleTypewriter'), pr: val('modeToggleProgress') };
  // ---- T5: the old rows are gone ---------------------------------------------------------------------------------------
  out.rowsGone = { tw: !/footTypewriter/.test(tw), pr: !/sliverInstrumentsShow/.test(pr) };
  // ---- T6: everything that stays is disabled when its mode is off ------------------------------------------------------
  out.greyed = {
    twSegs: countOf(tw, /<Seg /g), twDisabled: countOf(tw, /<Seg [^>]*disabled=\{off\}/g), twOff: /const off = !settings\.typewriter;/.test(tw),
    prSegs: countOf(pr, /<Seg /g), prDisabled: countOf(pr, /<Seg [^>]*disabled=\{off\}/g), prOff: /const off = !settings\.instrumentsOn;/.test(pr),
    prInput: /<input type="number"[^>]*disabled=\{off\}/.test(pr) && /<label className="wz-tw-number" data-disabled=\{off \? 'true' : undefined\}>/.test(pr),
  };
  // ---- T7: Seg really disables -----------------------------------------------------------------------------------------
  out.seg = {
    attr: /<div className="mode-crow" data-disabled=\{disabled \? 'true' : undefined\}>/.test(seg),
    buttons: /className=\{value === v \? 'on' : ''\} disabled=\{disabled\} onClick/.test(seg),
  };
  // ---- T8: the Format group -----------------------------------------------------------------------------------------------
  const fOpen = tools.indexOf('<fieldset className="wz-sliver-fieldset"');
  const fClose = tools.indexOf('</fieldset>');
  const fBody = fOpen >= 0 && fClose > fOpen ? tools.slice(fOpen, fClose) : '';
  const early = tools.indexOf("if (content.kind === 'empty') return null;");
  const hook = tools.indexOf('const formatLocked = useWritingSettings().typewriter;');
  out.format = {
    disabledBound: /<fieldset className="wz-sliver-fieldset" disabled=\{formatLocked\}/.test(tools),
    hookBeforeReturn: hook > 0 && early > hook,
    wrapsFourRows: countOf(fBody, /className="wz-sliver-format/g) === 3 && /onFormat\('bold'\)/.test(fBody) && /onFormat\('align-right'\)/.test(fBody) && /<BulletControl/.test(fBody),
    sectionOnly: countOf(tools, /<fieldset /g) === 1,
    // the greyed group says why: a tooltip from the lexicon on the fieldset, a legend for assistive tech, and buttons that let the pointer through to it
    tooltip: /<fieldset [^>]*title=\{formatLocked \? t\('formatLockedByTypewriter'\) : undefined\}>/.test(tools)
      && /\{formatLocked && <legend className="wz-sr-only">\{t\('formatLockedByTypewriter'\)\}<\/legend>\}/.test(tools)
      && /^\.wz-sliver-fieldset:disabled button\{[^}]*pointer-events:none/m.test(s.css)
      && new RegExp("^  formatLockedByTypewriter: 'Typewriter Mode is on',$", 'm').test(s.lex),
  };
  // ---- T9: the shortcuts ---------------------------------------------------------------------------------------------------
  const arfStart = s.pe.indexOf('  const applyRailFormat = (action: FormatAction) => {');
  const arf = arfStart < 0 ? null : s.pe.slice(arfStart, s.pe.indexOf('\n  };\n', arfStart));
  out.shortcuts = {
    guardOrder: !!arf && arf.indexOf("if (mode !== 'drafting') return;") >= 0
      && arf.indexOf('if (getWritingSettings().typewriter) return;') > arf.indexOf("if (mode !== 'drafting') return;")
      && arf.indexOf('applyFormatAt(action);') > arf.indexOf('if (getWritingSettings().typewriter) return;'),
    keysUseIt: /onFormatKey=\{mode === 'drafting' \? applyRailFormat : undefined\}/.test(s.pe),
    railUsesIt: /onFormat: applyRailFormat,/.test(s.pe),
    imported: /^import \{ getWritingSettings \} from '\.\.\/store\/writingSettings';$/m.test(s.pe),
  };
  // ---- T10: the look ---------------------------------------------------------------------------------------------------------
  const rule = (sel) => { const m = new RegExp('^' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}', 'm').exec(s.css); return m ? m[1] : null; };
  const pressed = rule(".wz-sliver-mode-btn[aria-pressed='true']");
  const btn = rule('.wz-sliver-mode-btn');
  const grey = rule(".mode-crow[data-disabled='true'], .wz-tw-number[data-disabled='true']");
  const fgrey = rule('.wz-sliver-fieldset:disabled');
  const fres = rule('.wz-sliver-fieldset');
  out.look = {
    // Fable, Oct 11: ONLY the icon changes colour - the square's border is the same quiet line in both states, and there is no fill.
    onBrassNoFill: !!pressed && /color:var\(--brass\)/.test(pressed) && /background:none/.test(pressed) && !/border/.test(pressed) && !/color-mix|rgba?\(|#[0-9a-f]{3}/i.test(pressed),
    offQuiet: !!btn && /color:var\(--text-low\)/.test(btn) && /background:none/.test(btn),
    focusRing: /^\.wz-sliver-mode-btn:focus-visible\{[^}]*outline:2px solid var\(--brass\)/m.test(s.css),
    greyRows: !!grey && /opacity:\.4/.test(grey), greyFormat: !!fgrey && /opacity:\.4/.test(fgrey),
    fieldsetReset: !!fres && /border:0/.test(fres) && /min-width:0/.test(fres) && /padding:0/.test(fres),
    noLiteralColours: [pressed, btn, grey, fgrey].every((r) => !!r && !/#[0-9a-f]{3,8}\b|rgba?\(/i.test(r)),
  };
  out.icons = /export const TypewriterModeIcon/.test(s.icons) && /export const ProgressModeIcon/.test(s.icons) && /aria-hidden/.test(s.icons);
  return out;
}
function verdict(c) {
  const b = c.buttons || {}, g = c.greyed || {}, f = c.format || {}, sc = c.shortcuts || {}, l = c.look || {};
  return {
    buttons: b.twBtn && b.prBtn && b.inHead && b.moreStillAlone && b.twGatedOnAvailability && b.realButtons,
    words: c.words?.tw && c.words?.pr && !!c.names?.tw && !!c.names?.pr && c.names.tw !== c.names.pr,
    rowsGone: c.rowsGone?.tw && c.rowsGone?.pr,
    greyed: g.twSegs === 3 && g.twDisabled === 3 && g.twOff && g.prSegs === 4 && g.prDisabled === 4 && g.prOff && g.prInput,
    seg: c.seg?.attr && c.seg?.buttons,
    format: f.disabledBound && f.hookBeforeReturn && f.wrapsFourRows && f.sectionOnly && f.tooltip,
    shortcuts: sc.guardOrder && sc.keysUseIt && sc.railUsesIt && sc.imported,
    look: l.onBrassNoFill && l.offQuiet && l.focusRing && l.greyRows && l.greyFormat && l.fieldsetReset && l.noLiteralColours && c.icons,
  };
}
const base = claims();
const v = verdict(base);
ok('(T0) the sources this harness reads all exist (a missing function would make every other check vacuous)', Object.values(base.found).every(Boolean), JSON.stringify(base.found));
ok('(T1) TYPEWRITER MODE and PROGRESS TRACKING are two icon-only native buttons in the head beside the "..." (which stays alone in its own row); the typewriter one only where the surface offers a typewriter',
  v.buttons === true, JSON.stringify(base.buttons));
ok('(T2) each button reports on/off with aria-pressed from the stored value, and carries a lexicon name that does not change with the state; the two names differ',
  v.words === true, JSON.stringify({ words: base.words, names: base.names }));
ok('(T3) they flip the SAME values the old rows flipped - typewriter through setTypewriterExplicit (so the session "the writer chose" flag still arms), instrumentsOn through setWritingSettings - and the stores and the goal are byte-identical to main',
  v.buttons === true && (() => {
    const baseRef = sh('git merge-base origin/main HEAD')?.trim();
    const d = baseRef ? sh(`git diff --stat ${baseRef} -- src/store/writingSettings.ts src/store/forwardLock.ts src/store/writingGoal.ts`) : null;
    base.storeDiff = d;
    return d !== null && d.trim() === '';
  })(), JSON.stringify({ buttons: base.buttons, storeDiff: base.storeDiff }));
ok('(T4) the Typewriter on/off row and the Progress "Show" row are gone from the "..." menu', v.rowsGone === true, JSON.stringify(base.rowsGone));
ok('(T5) when a mode is off every row that stays is disabled: Typewriter -> Forward Lock, Line Fade, Page Scroll (3 of 3); Progress -> Unit, Progress, Progress style, Timer (4 of 4) and the Goal number',
  v.greyed === true, JSON.stringify(base.greyed));
ok('(T6) "disabled" is real: Seg marks the row (data-disabled) and disables its option buttons, so a greyed row cannot be focused or pressed', v.seg === true, JSON.stringify(base.seg));
ok('(T7) the whole FORMAT group sits inside ONE native disabled fieldset bound to Typewriter-on (so B/I/U/S/H, bullets, quote, indent, spacing and alignment all grey and lock together); the setting is read above the early return so the hook order holds',
  v.format === true, JSON.stringify(base.format));
ok('(T8) the formatting SHORTCUTS are blocked with it: applyRailFormat (which the Ctrl/Cmd+B/I/U key handler and the rail share) returns while Typewriter is on, after the Draft-only guard and before anything is applied',
  v.shortcuts === true, JSON.stringify(base.shortcuts));
ok('(T9) the look: ON = the ICON turns brass and nothing else (same quiet border as the "...", no fill); OFF = quiet; a focus ring; greyed = 40% opacity; the fieldset resets the browser border/padding/min-width; theme TOKENS only (no literal colours), so Arbor and Flux, light and dark, read their own brass',
  v.look === true, JSON.stringify(base.look));

// =============================================================================
// MUTATIONS - each asserts it LANDED before the red is believed.
// =============================================================================
const S0 = { sliver: sliverSrc, stage: stageSrc, lex: lexSrc, pe: peSrc, icons: iconsSrc, css };
function mutate(text, from, to) { if (!text.includes(from)) throw new Error('mutation anchor missing: ' + from.slice(0, 60)); return text.replace(from, () => to); }
function mutant(name, key, patchFn, which) {
  let res; let found = true;
  try { const c = claims({ ...S0, [key]: patchFn(S0[key]) }); found = Object.values(c.found).every(Boolean); res = verdict(c); } catch (e) {
    if (/mutation anchor missing/.test(String(e))) { ok(`(M) ${name}: THE MUTATION LANDED`, false, 'anchor missing'); return; }
    ok(`(M) ${name}: the proof goes RED`, false, 'CRASHED, which is not evidence: ' + String(e).slice(0, 120)); return;
  }
  ok(`(M) ${name}: the proof goes RED`, found && !res[which], found ? JSON.stringify(res).slice(0, 160) : 'a source function went missing, which is not evidence');
}
mutant('the typewriter button stops reporting its state', 'sliver', (t) => mutate(t, 'aria-pressed={settings.typewriter}', 'aria-pressed={false}'), 'buttons');
mutant('the progress button flips a different value', 'sliver', (t) => mutate(t, 'setWritingSettings({ instrumentsOn: !settings.instrumentsOn })', 'setWritingSettings({ timer: !settings.timer })'), 'buttons');
mutant('the typewriter button bypasses setTypewriterExplicit', 'sliver', (t) => mutate(t, 'onClick={() => setTypewriterExplicit(!settings.typewriter)}>', 'onClick={() => setWritingSettings({ typewriter: !settings.typewriter })}>'), 'buttons');
mutant('a button grows a visible text label (not icon-only)', 'sliver', (t) => mutate(t, '<ProgressModeIcon />', '<ProgressModeIcon /> Progress'), 'buttons');
mutant('the old Typewriter row comes back in the menu', 'sliver', (t) => mutate(t, "  const off = !settings.typewriter;\n  return (\n    <>\n", "  const off = !settings.typewriter;\n  return (\n    <>\n      <Seg label={t('footTypewriter')} value=\"on\" opts={[]} onPick={() => {}} />\n"), 'rowsGone');
mutant('Forward Lock stays usable while Typewriter is off', 'sliver', (t) => mutate(t, "<Seg label={t('twForwardLock')} value={forwardLock ? 'on' : 'off'} disabled={off}", "<Seg label={t('twForwardLock')} value={forwardLock ? 'on' : 'off'}"), 'greyed');
mutant('the Timer row stays usable while Progress Tracking is off', 'sliver', (t) => mutate(t, '<Seg label="Timer" value={settings.timer ? \'on\' : \'off\'} disabled={off}', '<Seg label="Timer" value={settings.timer ? \'on\' : \'off\'}'), 'greyed');
mutant('the Goal number stays editable while Progress Tracking is off', 'sliver', (t) => mutate(t, 'aria-label={t(\'goalLabel\')} disabled={off}', "aria-label={t('goalLabel')}"), 'greyed');
mutant('Seg ignores disabled', 'stage', (t) => mutate(t, "className={value === v ? 'on' : ''} disabled={disabled} onClick", "className={value === v ? 'on' : ''} onClick"), 'seg');
mutant('the Format fieldset is not disabled', 'sliver', (t) => mutate(t, '<fieldset className="wz-sliver-fieldset" disabled={formatLocked}', '<fieldset className="wz-sliver-fieldset"'), 'format');
mutant('the Format setting is read AFTER the early return (hook order breach)', 'sliver', (t) => mutate(mutate(t, '  const formatLocked = useWritingSettings().typewriter;\n', ''), "  if (content.kind === 'empty') return null;\n", "  if (content.kind === 'empty') return null;\n  const formatLocked = useWritingSettings().typewriter;\n"), 'format');
mutant('the shortcuts are no longer blocked', 'pe', (t) => mutate(t, '    if (getWritingSettings().typewriter) return;   // PHASE 1 (S4)', '    // PHASE 1 (S4)'), 'shortcuts');
const GUARD = '    if (getWritingSettings().typewriter) return;   // PHASE 1 (S4): Format is greyed while Typewriter is on, and its shortcuts (Ctrl/Cmd+B/I/U) are blocked with it';
mutant('the shortcut guard runs AFTER the format is applied', 'pe', (t) => mutate(t, GUARD + '\n    applyFormatAt(action);', '    applyFormatAt(action);\n' + GUARD), 'shortcuts');
mutant('the ON state gets a fill', 'css', (t) => mutate(t, ".wz-sliver-mode-btn[aria-pressed='true']{ color:var(--brass); background:none; }", ".wz-sliver-mode-btn[aria-pressed='true']{ color:var(--brass); background:color-mix(in srgb,var(--brass) 14%,transparent); }"), 'look');
mutant('the ON state gets a brass border (Fable: only the icon changes)', 'css', (t) => mutate(t, ".wz-sliver-mode-btn[aria-pressed='true']{ color:var(--brass); background:none; }", ".wz-sliver-mode-btn[aria-pressed='true']{ color:var(--brass); border-color:var(--brass); background:none; }"), 'look');
mutant('the greyed Format group loses its tooltip', 'sliver', (t) => mutate(t, " title={formatLocked ? t('formatLockedByTypewriter') : undefined}>", '>'), 'format');
mutant('the greyed Format buttons swallow the pointer (the group tooltip can never show)', 'css', (t) => mutate(t, '.wz-sliver-fieldset:disabled button{ cursor:default; pointer-events:none; }', '.wz-sliver-fieldset:disabled button{ cursor:default; }'), 'format');
mutant('the ON state is a hard-coded colour (would not follow the theme)', 'css', (t) => mutate(t, ".wz-sliver-mode-btn[aria-pressed='true']{ color:var(--brass); background:none; }", ".wz-sliver-mode-btn[aria-pressed='true']{ color:#c8a24a; background:none; }"), 'look');
mutant('the fieldset keeps the browser border and padding', 'css', (t) => mutate(t, '.wz-sliver-fieldset{ border:0; margin:0; padding:0; min-width:0;', '.wz-sliver-fieldset{ margin:0;'), 'look');

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' | ' + String(c.detail).slice(0, 300)));
}
console.log(failed === 0 ? `\nDRAWER-TOGGLES VERIFY: PASS (${checks.length} checks)` : `\nDRAWER-TOGGLES VERIFY: FAIL — ${failed}/${checks.length}`);
process.exit(failed === 0 ? 0 : 1);
