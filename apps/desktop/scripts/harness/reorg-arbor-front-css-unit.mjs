// THE REORG'S FRONT MENU IN ARBOR, ITS STYLESHEET, BROWSERLESS (Fable, Nov 21, 6:54 pm; claude/wrizors/arbor-reorg-spec.md section 4: tabs FORMAT (olive), INK (madder), SECTIONS (cold blue); section 6: the Sections' numbered tags, "a light tint of its cloth behind the row", "the current section: Arbor's chosen-row rule: a 4 px brass mark at its left
// edge, roman 500; by night the words are brass (8.56:1), by day they stay olive", "the link badge is a small cloth-edged count"). No browser, no box: styles/25-reorg-arbor-front.css is read as text, against 23-reorg-top.css's Machina rules; each law is given a mutant (a text rewrite) that must LAND and turn its own check red.
//   SCOPED   every rule (and every part of a grouped selector) is under :root[data-arbor2][data-theme='plateau']: with the switch off or in any other theme nothing here matches
//   COVER    every Machina rule the Front menu draws (the SECTIONS list, kind menu, Structure, folds, Publish list, greyed tabs; not the page-side arrows and foot, which are the top bar's) has its Arbor twin, selector for selector; the tint and the brass-less here-bar are the two Arbor replaces
//   CLOTHS   FORMAT (id text) is olive #56632E, SECTIONS (id parts) is cold blue #7FA0BC with walnut words, each coming forward when open with its cloth as the drawer's 3 px border; INK is not redefined here (arbor-v2.css's madder stands)
//   TAGS     a Section's tag shows its slot's NUMBER (1 to 6) from the slot's token, not the letter, on the slot's cloth (the twin reads --reorg-tag-<slot>-fill / -ink / -edge)
//   TINT     every slot a-f washes the chosen row at 22% of its cloth, and the row's words hold 4.5:1 over it in both rooms (computed over the room's grounds, with the words the CSS gives)
//   HERE     the current Section: a 4 px brass mark at the left edge, roman 500, brass words by night, olive by day (the drawer's dark olive on a tinted row by day); brass is on the mark and the night words only
//   BADGE    the link badge is cloth-edged in GRAFTS' cold blue edge (the token), a count
//   PALETTE  every colour is Arbor's (the cloths, their edges, the two inks, the raised surfaces) or a token; no Machina grey, no brass on a tag or a tint
// Run: node scripts/harness/reorg-arbor-front-css-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalCssParts } from '../global-css.mjs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const CSS = rd('styles/25-reorg-arbor-front.css');
const TOP = rd('styles/23-reorg-top.css');
const AR = ":root[data-arbor2][data-theme='plateau']";
const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f'];
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const hex = (v) => '#' + v.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase();
const over = (fg, bg, a) => hex(rgb(fg).map((c, i) => c * a + rgb(bg)[i] * (1 - a)));
// a depth-aware reader: [{ at, sel, body }], at = the enclosing @-rule's prelude or ''
const read = (css) => {
  const t = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = []; const stack = []; let start = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '{') {
      const prelude = t.slice(start, i).trim().replace(/\s+/g, ' ');
      if (prelude.startsWith('@')) { stack.push(prelude); start = i + 1; continue; }
      const c = t.indexOf('}', i);
      out.push({ at: stack[stack.length - 1] || '', sel: prelude, body: t.slice(i + 1, c).trim().replace(/\s+/g, ' ') });
      i = c; start = c + 1;
    } else if (ch === '}') { stack.pop(); start = i + 1; }
  }
  return out;
};
const splitSel = (s) => { const parts = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; } parts.push(cur.trim()); return parts; };
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase());
const FRONT = /\.reorg-colour-|\.reorg-parts|\.reorg-part-(?!arrow|foot)|\.reorg-part\b|\.reorg-dockind|\.reorg-text-|\.reorg-pubparts|\.wz-drawer-tab\[data-disabled='true'\]/;
// Arbor replaces three Machina reorg rules with its own: the wash (data-tint), and the here-bar's grey and brass variants (Machina's colour-B brass bar is Default's only; Arbor's chosen row is the 4 px brass mark on every row)
const REPLACED = /data-tint=|\.reorg-parts-row\.is-here:not\(\[data-here-bar='brass'\]\)::before|\.reorg-parts-row\.is-here\[data-here-bar='brass'\]::before/;
// Machina's light room is Arbor's day room
const ROOMMAP = (s) => s.split("[data-theme='machina']").join(AR).split("[data-machina2-room='light']").join("[data-arbor2-room='day']");
// the rooms' own tokens (arbor-v2.css: day --text-hi #33401F on grounds #E8DFC8 / #F6F1E4 / #F1EAD8, olive --accent-rest #55612D; night --text-hi #EDE6DA on #2E2118 / #1B120C; brass #FF9800)
const ROOMS = { day: { grounds: ['#E8DFC8', '#F6F1E4', '#F1EAD8'], hi: '#33401F', olive: '#55612D' }, night: { grounds: ['#2E2118', '#1B120C', '#261A12'], hi: '#EDE6DA' } };
const BRASS = '#FF9800';
const CLOTH = { a: '#56632E', b: '#17454E', c: '#7FA0BC', d: '#A8392F', e: '#C9A46B', f: '#39414A' };

function suite(css) {
  const R = {};
  const rs = read(css);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  const find = (re, f = () => true) => rs.filter((r) => re.test(r.sel) && f(r));
  const bodyHas = (r, re) => re.test(r.body);
  t('SCOPED', () => {
    const bad = rs.flatMap((r) => splitSel(r.sel).filter((s) => !s.startsWith(AR) || /data-theme='machina'/.test(s)));
    return { pass: rs.length >= 90 && bad.length === 0, detail: J({ rules: rs.length, bad: bad.slice(0, 4) }) };
  });
  t('COVER', () => {
    const want = read(TOP).filter((r) => r.sel.includes("[data-theme='machina']") && FRONT.test(r.sel) && !REPLACED.test(r.sel));
    const have = new Set(rs.map((r) => r.at + '|' + r.sel));
    const miss = want.filter((r) => !have.has(r.at + '|' + ROOMMAP(r.sel))).map((r) => r.sel.slice(0, 90));
    return { pass: want.length >= 80 && miss.length === 0, detail: J({ want: want.length, miss: miss.slice(0, 5), n: miss.length }) };
  });
  t('CLOTHS', () => {
    const fmt = find(/#wz-sliver-tab-text\{?$/, (r) => !/:has|\.arbor2-c2/.test(r.sel)).filter((r) => /background:#56632E/i.test(r.body));
    const sec = find(/#wz-sliver-tab-parts$/, (r) => !/:has|\.arbor2-c2/.test(r.sel)).filter((r) => /background:#7FA0BC/i.test(r.body) && /color:#2B1D12/i.test(r.body));
    const chosen = ['text:#56632E', 'parts:#7FA0BC'].every((p) => { const [id, c] = p.split(':'); return rs.some((r) => r.sel.includes(`:has(#wz-sliver-tab-${id}[data-on='true'])`) && new RegExp(`--arbor2-chosen-l:${c}`, 'i').test(r.body)); });
    const fwd = rs.some((r) => /\.arbor2-c2 :is\(#wz-sliver-tab-text, #wz-sliver-tab-parts\)\[data-on='true'\]$/.test(r.sel) && /z-index:3/.test(r.body));
    const border = rs.some((r) => /:has\(:is\(#wz-sliver-tab-text, #wz-sliver-tab-parts\)\[data-on='true'\]\) \.wz-drawer-slide--left$/.test(r.sel) && /inset 0 3px 0 var\(--arbor2-chosen-l\)/.test(r.body));
    const ink = /wz-sliver-tab-ink/.test(css);
    return { pass: fmt.length === 1 && sec.length === 1 && chosen && fwd && border && !ink, detail: J({ fmt: fmt.length, sec: sec.length, chosen, fwd, border, inkRedefined: ink }) };
  });
  t('TAGS', () => {
    const bad = SLOTS.filter((s) => !rs.some((r) => r.sel === `${AR} .reorg-parts-tag[data-colour='${s}']::after` && new RegExp(`content:var\\(--reorg-tag-${s}-num\\)`).test(r.body)));
    const hide = rs.some((r) => r.sel === `${AR} .reorg-parts-tag[data-colour]` && /font-size:0/.test(r.body));
    const cloth = SLOTS.every((s) => rs.some((r) => r.sel.includes(`.reorg-parts-tag, .reorg-part-swatch)[data-colour='${s}']`) && new RegExp(`background:var\\(--reorg-tag-${s}-fill\\)`).test(r.body) && new RegExp(`border-color:var\\(--reorg-tag-${s}-edge\\)`).test(r.body)));
    // pass 3 (the Wrizors, Nov 22), REAL: by night every tag gets a 1 px #9C8A6E edge: Arbor's line by night, on the slot tags and on a custom colour's
    const nightEdge = rs.some((r) => /data-arbor2-room='night'\] \.reorg-parts-tag\[data-colour\]/.test(r.sel) && /data-arbor2-room='night'\] \.reorg-parts-tag\[data-colour-hex\]/.test(r.sel) && /border-color:var\(--arbor-line\)/.test(r.body));
    const nightLine = /data-arbor2-room='night'\]\{[^}]*--arbor-line:#9C8A6E/.test(rd('styles/arbor-v2.css').replace(/\s+/g, ' ')) || /--arbor-line:#9C8A6E/.test(rd('styles/arbor-v2.css'));
    return { pass: bad.length === 0 && hide && cloth && nightEdge && nightLine, detail: J({ bad, hide, cloth, nightEdge, nightLine }) };
  });
  t('TINT', () => {
    // Fable, Nov 21, 11:20 pm: the chosen row's wash runs the FULL row (under the link badge too): it is on the row's list item, not on the row's button alone
    const miss = SLOTS.filter((s) => !rs.some((r) => r.sel === `${AR} .reorg-parts-list > li:has(> .reorg-parts-row[data-tint='${s}'])` && new RegExp(`background:color-mix\\(in srgb, var\\(--reorg-tag-${s}-fill\\) 22%, transparent\\)`).test(r.body)));
    // the words over the wash, per slot, per room, over each ground: day = --text-hi, night = brass (the chosen row's own words)
    const low = [];
    for (const room of ['day', 'night']) for (const g of ROOMS[room].grounds) for (const s of SLOTS) {
      const bg = over(CLOTH[s], g, 0.22);
      // SUPERSEDED (pass 3, Nov 22: the current name takes the label colour in both rooms): const fg = room === 'day' ? ROOMS.day.hi : BRASS;
      const fg = ROOMS[room].hi;
      const r = ratio(fg, bg);
      if (r < 4.5) low.push({ room, g, s, r: +r.toFixed(2) });
    }
    return { pass: miss.length === 0 && low.length === 0, detail: J({ miss, low: low.slice(0, 5) }) };
  });
  t('HERE', () => {
    const mark = rs.some((r) => r.sel === `${AR} .reorg-parts-row.is-here::before` && /width:4px/.test(r.body) && /left:0/.test(r.body) && /background:var\(--brass\)/.test(r.body));
    const roman = rs.some((r) => r.sel === `${AR} .reorg-parts-row.is-here .reorg-parts-name` && /font-weight:500/.test(r.body) && /font-style:normal/.test(r.body));
    // SUPERSEDED (pass 3, Nov 22: "the current name in the label colour both rooms": the Section she is on keeps its 4 px brass mark and roman 500, and its words are the drawer's label colour, not brass by night or olive by day). The original, verbatim:
    // const night = rs.some((r) => r.sel === `${AR}[data-arbor2-room='night'] .reorg-parts-row.is-here .reorg-parts-name` && /color:var\(--brass\)/.test(r.body));
    // const day = rs.some((r) => r.sel === `${AR}[data-arbor2-room='day'] .reorg-parts-row.is-here .reorg-parts-name` && /color:var\(--accent-rest\)/.test(r.body));
    // const dayTint = rs.some((r) => r.sel === `${AR}[data-arbor2-room='day'] .reorg-parts-row.is-here[data-tint] .reorg-parts-name` && /color:var\(--text-hi\)/.test(r.body));
    // const dayOlive = ratio(ROOMS.day.olive, '#E8DFC8') >= 4.5;
    // SUCCESSOR: the name rule carries the label colour, and no rule makes the current name brass or olive
    const label = rs.some((r) => r.sel === `${AR} .reorg-parts-row.is-here .reorg-parts-name` && /color:var\(--text-hi\)/.test(r.body));
    const noTint = !rs.some((r) => /\.reorg-parts-row\.is-here[^,]*\.reorg-parts-name$/.test(r.sel) && /color:var\(--(brass|accent-rest)\)/.test(r.body));
    const labelRatio = ['day', 'night'].every((room) => ROOMS[room].grounds.every((g) => ratio(ROOMS[room].hi, g) >= 4.5));
    return { pass: mark && roman && label && noTint && labelRatio, detail: J({ mark, roman, label, noTint, labelRatio }) };
  });
  t('BADGE', () => {
    // the link badge: a small cloth-edged count. Its edge keeps 3:1 and its count 4.5:1 on the wash and on the plain drawer, in both rooms (computed over every slot's wash and every ground): by day the edge is a deeper cold blue (#4A6076), by night the cold blue cloth itself; the count is the drawer's own words
    const base = rs.some((r) => r.sel === `${AR} button.reorg-parts-assets` && /border:1px solid var\(--reorg-tag-c-edge\)/.test(r.body) && /color:var\(--text-hi\)/.test(r.body));
    const day = rs.some((r) => r.sel === `${AR}[data-arbor2-room='day'] button.reorg-parts-assets` && /border-color:#4A6076/i.test(r.body));
    const night = rs.some((r) => r.sel === `${AR}[data-arbor2-room='night'] button.reorg-parts-assets` && /border-color:var\(--reorg-tag-c-fill\)/.test(r.body));
    const low = [];
    for (const [room, edge, text] of [['day', '#4A6076', ROOMS.day.hi], ['night', CLOTH.c, '#EDE6DA']]) for (const g of ROOMS[room].grounds) {
      for (const bg of [g, ...SLOTS.map((s) => over(CLOTH[s], g, 0.22))]) { if (ratio(edge, bg) < 3) low.push({ room, what: 'edge', g, bg }); if (ratio(text, bg) < 4.5) low.push({ room, what: 'text', g, bg }); }
    }
    return { pass: base && day && night && low.length === 0, detail: J({ base, day, night, low: low.slice(0, 4) }) };
  });
  t('NAMED', () => {
    // pass 3 NIT: the bar under the list is the session's goal hairline; in the Front menu it is named (the drawer's own word, Goal), in the drawer's label dress
    const r = rs.filter((x) => x.sel === `${AR} .wz-sliver-goal-name`).filter((b) => /font-family:var\(--font-chromeLabel/.test(b.body) && /text-transform:uppercase/.test(b.body) && /color:var\(--text-mid\)/.test(b.body));
    return { pass: r.length === 1, detail: J({ n: r.length }) };
  });
  t('OPENER', () => {
    // the Wrizors' pass 1, NIT 1 (Nick, Oct 9: an opener is not a choice, so it never takes brass), the left opener's mirror of the Back menu's: with the Front menu on, the Tools drawer's opener keeps its olive when the drawer is open (arbor-v2.css turns an open opener brass)
    const r = rs.filter((x) => /\.desk-frame-sliver-anchor:has\(:is\(#wz-sliver-tab-text, #wz-sliver-tab-parts\)\) \.wz-sliver\[data-open='true'\] \.wz-sliver-grip$/.test(x.sel) && /background:\s*#6B7A3A/i.test(x.body) && /border-color:\s*#6B7A3A/i.test(x.body) && !/brass|#FF9800/i.test(x.body));
    return { pass: r.length === 1, detail: J({ n: r.length }) };
  });
  t('PALETTE', () => {
    const allowed = new Set(['#56632E', '#7FA0BC', '#2B1D12', '#F6F1E4', '#261A12', '#6B7A3A', '#EFE4CB', '#4A6076', ...Object.values(CLOTH)]);
    const all = hexes(css), bad = all.filter((h) => !allowed.has(h));
    const machina = ['#6A727B', '#D2D6DA', '#F4F5F6', '#E6E8EA', '#3F6183', '#3A4047', '#525A62'].filter((h) => all.includes(h));
    const brassUses = rs.filter((r) => /var\(--brass\)|#FF9800|--orange/i.test(r.body)).map((r) => r.sel);
    const brassOk = brassUses.length >= 2 && brassUses.every((s) => /\.reorg-parts-row\.is-here::before$|\.reorg-colour-(scheme|swatch)\[aria-checked='true'\]$/.test(s));   // brass is her act: the chosen row's mark and night words, and the chosen colour scheme and swatch (colour B)
    return { pass: all.length >= 8 && bad.length === 0 && machina.length === 0 && brassOk, detail: J({ n: all.length, bad, machina, brassUses }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
for (const k of ['SCOPED', 'COVER', 'CLOTHS', 'TAGS', 'TINT', 'HERE', 'BADGE', 'NAMED', 'OPENER', 'PALETTE']) ok(`${k} on the real 25-reorg-arbor-front.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '25-reorg-arbor-front.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
ok('WIRED the global stylesheet lists 25-reorg-arbor-front.css after the tags', PARTS.some((p) => /25-reorg-arbor-front\.css$/.test(p)) && PARTS.findIndex((p) => /25-reorg-arbor-tags\.css$/.test(p)) < PARTS.findIndex((p) => /25-reorg-arbor-front\.css$/.test(p)), J({ parts: PARTS.slice(-6) }));

const MUT = [
  ['a rule escapes the Arbor scope', 'SCOPED', (t) => t.replace(`${AR} .reorg-parts-list{`, () => '.reorg-parts-list{')],
  ['a Machina scope is left in', 'SCOPED', (t) => `${t}\n[data-theme='machina'] .reorg-parts-head{ color:#2B1D12; }\n`],
  ['a twin is dropped', 'COVER', (t) => t.replace(/\r?\n[^\n]*\.reorg-dockind-btn\[aria-expanded='true'\][^\n]*/, () => '')],
  ['FORMAT loses its olive', 'CLOTHS', (t) => t.replace('#wz-sliver-tab-text{ background:#56632E; }', () => '#wz-sliver-tab-text{ background:#6B7A3A; }')],
  ['SECTIONS loses its cold blue', 'CLOTHS', (t) => t.replace('#wz-sliver-tab-parts{ background:#7FA0BC; color:#2B1D12; }', () => '#wz-sliver-tab-parts{ background:#A8392F; color:#2B1D12; }')],
  ['the chosen SECTIONS cloth stops being the border', 'CLOTHS', (t) => t.replace("#wz-sliver-tab-parts[data-on='true']){ --arbor2-chosen-l:#7FA0BC; }", () => "#wz-sliver-tab-parts[data-on='true']){ --arbor2-chosen-l:#56632E; }")],
  ['INK is redefined here', 'CLOTHS', (t) => `${t}\n${AR} #wz-sliver-tab-ink{ background:#39414A; }\n`],
  ['a tag shows the letter again', 'TAGS', (t) => t.replace('content:var(--reorg-tag-d-num);', () => "content:'D';")],
  ['the letter is not hidden', 'TAGS', (t) => t.replace(`${AR} .reorg-parts-tag[data-colour]{ font-size:0;`, () => `${AR} .reorg-parts-tag[data-colour]{ font-size:9px;`)],
  ['a slot is not tinted', 'TINT', (t) => t.replace("[data-tint='e']){ background:color-mix(in srgb, var(--reorg-tag-e-fill) 22%, transparent); }", () => "[data-tint='e']){ background:transparent; }")],
  ['the wash goes back to the button alone', 'TINT', (t) => t.replace(".reorg-parts-list > li:has(> .reorg-parts-row[data-tint='d']){", () => ".reorg-parts-row[data-tint='d']{")],
  ['the wash is made too strong to read over', 'TINT', (t) => t.replace('var(--reorg-tag-b-fill) 22%', () => 'var(--reorg-tag-b-fill) 60%')],
  ['the mark is 3 px', 'HERE', (t) => t.replace('left:0; top:4px; bottom:4px; width:4px;', () => 'left:0; top:4px; bottom:4px; width:3px;')],
  ['the words go bold', 'HERE', (t) => t.replace('font-weight:500; font-style:normal;', () => 'font-weight:600; font-style:normal;')],
  // SUPERSEDED (pass 3): ['the night words lose their brass', 'HERE', (t) => t.replace("[data-arbor2-room='night'] .reorg-parts-row.is-here .reorg-parts-name{ color:var(--brass); }", () => "[data-arbor2-room='night'] .reorg-parts-row.is-here .reorg-parts-name{ color:var(--text-hi); }")],
  // SUPERSEDED (pass 3): ['the day words go brass', 'HERE', (t) => t.replace("[data-arbor2-room='day'] .reorg-parts-row.is-here .reorg-parts-name{ color:var(--accent-rest); }", () => "[data-arbor2-room='day'] .reorg-parts-row.is-here .reorg-parts-name{ color:var(--brass); }")],
  ['the current name goes brass again', 'HERE', (t) => t.replace('.reorg-parts-row.is-here .reorg-parts-name{ font-weight:500; font-style:normal; color:var(--text-hi); }', () => '.reorg-parts-row.is-here .reorg-parts-name{ font-weight:500; font-style:normal; color:var(--brass); }')],
  ['the current name goes olive by day', 'HERE', (t) => `${t}\n${AR}[data-arbor2-room='day'] .reorg-parts-row.is-here .reorg-parts-name{ color:var(--accent-rest); }\n`],
  ['a tag loses its night edge', 'TAGS', (t) => t.replace('border-color:var(--arbor-line); }', () => 'border-color:transparent; }')],
  ['the goal bar loses its name', 'NAMED', (t) => t.replace('.wz-sliver-goal-name{', () => '.wz-sliver-goal-nameless{')],
  ['the open Tools opener goes brass again', 'OPENER', (t) => t.replace(/(\.wz-sliver\[data-open='true'\] \.wz-sliver-grip\{ background:)#6B7A3A; border-color:#6B7A3A/, (m, a) => a + 'var(--brass); border-color:var(--brass)')],
  ['the open Tools opener rule is dropped', 'OPENER', (t) => t.replace(".wz-sliver[data-open='true'] .wz-sliver-grip{", () => ".wz-sliver[data-docked='true'] .wz-sliver-grip{")],
  ['the day badge edge goes back to the pale cloth edge', 'BADGE', (t) => t.replace('border-color:#4A6076', () => 'border-color:#5F788D')],
  ['the night badge edge loses its cloth', 'BADGE', (t) => t.replace("[data-arbor2-room='night'] button.reorg-parts-assets{ border-color:var(--reorg-tag-c-fill);", () => "[data-arbor2-room='night'] button.reorg-parts-assets{ border-color:var(--text-low);")],
  ['the badge loses its cloth edge', 'BADGE', (t) => t.replace('border:1px solid var(--reorg-tag-c-edge)', () => 'border:1px solid var(--text-low)')],
  ['a Machina grey creeps back', 'PALETTE', (t) => t.replace('#7FA0BC; color:#2B1D12;', () => '#7FA0BC; color:#2B1D12; outline-color:#6A727B;')],
  ['brass marks a tag', 'PALETTE', (t) => t.replace('content:var(--reorg-tag-a-num); font-size:10px;', () => 'content:var(--reorg-tag-a-num); font-size:10px; border-color:var(--brass);')],
];
for (const [name, key, fn] of MUT) {
  const after = CSS ? fn(CSS) : CSS;
  const landed = !!CSS && after !== CSS;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-ARBOR-FRONT-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-ARBOR-FRONT-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
