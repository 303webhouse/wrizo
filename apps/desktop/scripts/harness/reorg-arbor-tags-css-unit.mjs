// THE SECTION TAGS' TOKENS IN ARBOR, BROWSERLESS (Fable, Nov 21, 6:54 pm: Arbor's Front menu to INK; claude/wrizors/arbor-reorg-spec.md section 6: "colour slots a-f draw as Arbor's six numbered cloth tabs (Nick, Nov 11, 1:46 am): a olive #56632E, b sea #17454E, c cold blue #7FA0BC, d madder #A8392F, e honey #C9A46B, f iron #39414A; each has
// the rail tabs' 1 px darker edge; every label 4.5:1 or better; the tag carries a number (1-6), Arbor's form, as Machina's carries a letter"). INK owns the tokens (agreed with ARBOR, Nov 21): the top bar draws the current Section's tag before its name and the SECTIONS list draws every row's, both reading these, so they always match.
// No browser, no box: styles/25-reorg-arbor-tags.css is read as text; each law is given a mutant (a text rewrite) that must LAND and turn its own check red.
//   SCOPED   one rule block under :root[data-arbor2][data-theme='plateau'] (the live Arbor), nothing else
//   SLOTS    every slot a-f has a fill, an ink, an edge and a number token (--reorg-tag-<slot>-fill / -ink / -edge / -num), and the fills are exactly Arbor's six cloths in the spec's order
//   NUMBER   the tag carries a number: a is 1 ... f is 6 (a string token, for content:)
//   LABEL    each ink reads on its fill at 4.5:1 or better (computed), and is cream (#EFE4CB) or walnut (#2B1D12), Arbor's two inks
//   EDGE     each edge is the cloth's own, 1 px darker: darker than its fill (computed), and in Arbor's palette
//   PALETTE  every hex colour is Arbor's (the six cloths, their edges, the two inks), and no brass: brass is her act
// Run: node scripts/harness/reorg-arbor-tags-css-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalCssParts } from '../global-css.mjs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const CSS = rd('styles/25-reorg-arbor-tags.css');
const AR = ":root[data-arbor2][data-theme='plateau']";
const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f'];
const CLOTHS = { a: '#56632E', b: '#17454E', c: '#7FA0BC', d: '#A8392F', e: '#C9A46B', f: '#39414A' };
const EDGES = { a: '#3A4322', b: '#0F2F36', c: '#5F788D', d: '#7E2B23', e: '#977B50', f: '#2B3138' };
const INKS = new Set(['#EFE4CB', '#2B1D12']);
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rules = (css) => { const t = css.replace(/\/\*[\s\S]*?\*\//g, ''); const out = []; let i = 0; while (i < t.length) { const o = t.indexOf('{', i); if (o < 0) break; const c = t.indexOf('}', o); if (c < 0) break; out.push({ sel: t.slice(i, o).trim().replace(/\s+/g, ' '), body: t.slice(o + 1, c).trim() }); i = c + 1; } return out; };
const tokens = (css) => { const out = {}; for (const r of rules(css)) for (const m of r.body.matchAll(/(--reorg-tag-[a-f]-(?:fill|ink|edge|num))\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim(); return out; };
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase());

function suite(css) {
  const R = {};
  const rs = rules(css);
  const tk = tokens(css);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SCOPED', () => ({ pass: rs.length === 1 && rs[0].sel === AR, detail: J({ rules: rs.map((x) => x.sel) }) }));
  t('SLOTS', () => {
    const missing = SLOTS.flatMap((s) => ['fill', 'ink', 'edge', 'num'].map((k) => `--reorg-tag-${s}-${k}`)).filter((k) => !(k in tk));
    const wrong = SLOTS.filter((s) => (tk[`--reorg-tag-${s}-fill`] || '').toUpperCase() !== CLOTHS[s]);
    return { pass: missing.length === 0 && wrong.length === 0, detail: J({ missing, wrong }) };
  });
  t('NUMBER', () => { const bad = SLOTS.filter((s, i) => tk[`--reorg-tag-${s}-num`] !== `'${i + 1}'`); return { pass: bad.length === 0, detail: J({ bad, got: SLOTS.map((s) => tk[`--reorg-tag-${s}-num`]) }) }; });
  t('LABEL', () => {
    const bad = SLOTS.filter((s) => { const ink = (tk[`--reorg-tag-${s}-ink`] || '').toUpperCase(), fill = (tk[`--reorg-tag-${s}-fill`] || '').toUpperCase(); return !INKS.has(ink) || !/^#[0-9A-F]{6}$/.test(fill) || ratio(ink, fill) < 4.5; }).map((s) => ({ s, r: ratio((tk[`--reorg-tag-${s}-ink`] || '#000000').toUpperCase(), (tk[`--reorg-tag-${s}-fill`] || '#000000').toUpperCase()).toFixed(2) }));
    return { pass: bad.length === 0 && SLOTS.every((s) => tk[`--reorg-tag-${s}-ink`]), detail: J(bad) };
  });
  t('EDGE', () => {
    const bad = SLOTS.filter((s) => { const e = (tk[`--reorg-tag-${s}-edge`] || '').toUpperCase(), f = (tk[`--reorg-tag-${s}-fill`] || '').toUpperCase(); return e !== EDGES[s] || !/^#[0-9A-F]{6}$/.test(f) || !(lum(e) < lum(f)); });
    return { pass: bad.length === 0, detail: J(bad) };
  });
  t('PALETTE', () => {
    const allowed = new Set([...Object.values(CLOTHS), ...Object.values(EDGES), ...INKS]);
    const all = hexes(css), bad = all.filter((h) => !allowed.has(h));
    return { pass: all.length >= 18 && bad.length === 0 && !/var\(--brass\)|--orange/i.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), detail: J({ n: all.length, bad }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
for (const k of ['SCOPED', 'SLOTS', 'NUMBER', 'LABEL', 'EDGE', 'PALETTE']) ok(`${k} on the real 25-reorg-arbor-tags.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '25-reorg-arbor-tags.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
ok('WIRED the global stylesheet lists 25-reorg-arbor-tags.css', PARTS.some((p) => /25-reorg-arbor-tags\.css$/.test(p)), J({ parts: PARTS.slice(-6) }));

const MUT = [
  ['the tokens escape the Arbor scope', 'SCOPED', (t) => t.replace(`${AR}{`, () => ':root{')],
  ['a second rule is added', 'SCOPED', (t) => `${t}\n${AR} .x{ color:#EFE4CB; }\n`],
  ['a cloth drifts', 'SLOTS', (t) => t.replace('--reorg-tag-c-fill:#7FA0BC', () => '--reorg-tag-c-fill:#7FA1BC')],
  ['a token is missing', 'SLOTS', (t) => t.replace('--reorg-tag-f-edge:#2B3138;', () => '')],
  ['the numbers run backwards', 'NUMBER', (t) => t.replace("--reorg-tag-a-num:'1'", () => "--reorg-tag-a-num:'6'")],
  ['a label loses its contrast', 'LABEL', (t) => t.replace('--reorg-tag-c-ink:#2B1D12', () => '--reorg-tag-c-ink:#EFE4CB')],
  ['an edge is lighter than its cloth', 'EDGE', (t) => t.replace('--reorg-tag-a-edge:#3A4322', () => '--reorg-tag-a-edge:#8A9A5A')],
  ['a colour outside Arbor creeps in', 'PALETTE', (t) => t.replace('--reorg-tag-d-edge:#7E2B23', () => '--reorg-tag-d-edge:#7F2B23')],
  ['brass marks a tag', 'PALETTE', (t) => t.replace('--reorg-tag-e-edge:#977B50', () => '--reorg-tag-e-edge:var(--brass)')],
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
console.log(bad ? `\nREORG-ARBOR-TAGS-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-ARBOR-TAGS-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
