// VISUAL 1a.2 - RICHER STROKES, BROWSERLESS ([DATA] D1, ruled yes Nov 23: any size, any colour, see-through ink). They ride INSIDE today's `strokes` (jsonb): three optional fields, no migration, and the
// read boundary (store/ink.ts) is the validation - a value it does not understand paints as the default, so an old or a newer client can never mis-paint. The real ink.ts is transpiled and run
// against a recording canvas.
//   OLD     a stroke with none of the new fields paints exactly as before: width by tip and nib, the named ink, the tip's alpha
//   SIZE    `size` is the line's width in px, any size; out of range or not a number falls back to the nib
//   HEX     `hex` (#RRGGBB) is the line's colour; anything else falls back to the named ink, then the default
//   ALPHA   `alpha` thins the tip's own alpha (0.05 to 1); anything else is 1. The pencil's grain pass thins with it. An erase ignores all three
//   DARK    on a dark sheet (her text is light) the default ink - walnut, or none - paints in the page's text colour; her own colour and the other desk inks are untouched; light sheets are as before
//   THUMB   a thumbnail's floor is in screen px, so her relative weights show instead of every line becoming a blob
//   HIT     a wide stroke is grabbed from as far away as it looks (hit-testing uses the same width)
// Each law has a mutant (a text rewrite of ink.ts) that must land and turn its own check red.
// Run: node scripts/harness/visual-ink-strokes-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const SRC = lf(fs.readFileSync(new URL('../../src/store/ink.ts', import.meta.url), 'utf8'));
const J = (v) => JSON.stringify(v);

function load(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}

// a canvas that records the paint state at every stroke()/fill()
function recorder() {
  const passes = [];
  const state = { lineWidth: 1, strokeStyle: '', fillStyle: '', globalAlpha: 1, globalCompositeOperation: 'source-over' };
  const stack = [];
  const ctx = {
    save() { stack.push({ ...ctx.__s() }); }, restore() { Object.assign(ctx, stack.pop()); },
    __s() { return Object.fromEntries(Object.keys(state).map((k) => [k, ctx[k]])); },
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, arc() {}, setLineDash() {},
    stroke() { passes.push(ctx.__s()); }, fill() { passes.push(ctx.__s()); },
    ...state,
  };
  return { ctx, passes };
}
const LINE = [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }];
const paint = (I, extra) => { const r = recorder(); I.renderStroke(r.ctx, { points: LINE, ...extra }, 1000, '#111111'); return r.passes; };
const one = (I, extra) => { const p = paint(I, extra)[0]; return { w: p.lineWidth, c: p.strokeStyle, a: Math.round(p.globalAlpha * 1000) / 1000, op: p.globalCompositeOperation }; };

function suite(src) {
  const R = {};
  let I;
  try { I = load(src); } catch (e) { return { LOAD: { pass: false, detail: String(e) } }; }
  {
    const got = [one(I, {}), one(I, { tip: 'pencil', nib: 'broad' }), one(I, { tip: 'marker', nib: 'fine', ink: 'sea' })];
    R.OLD = { pass: got[0].w === 1.4 && got[0].c === '#111111' && got[0].a === 1 && got[1].w === 2 && got[1].a === 0.62 && got[2].w === 3.2 && got[2].a === 0.4 && got[2].c === '#1A1206' && got[2].op === 'multiply', detail: J(got) };
  }
  {
    const got = [one(I, { size: 17 }).w, one(I, { tip: 'marker', nib: 'broad', size: 0.5 }).w, one(I, { nib: 'broad', size: 'wide' }).w, one(I, { nib: 'broad', size: -3 }).w, one(I, { nib: 'fine', size: 9000 }).w, one(I, { size: NaN }).w];
    R.SIZE = { pass: J(got) === J([17, 0.5, 2.4, 2.4, 0.9, 1.4]), detail: J(got) };
  }
  {
    const got = [one(I, { hex: '#2F7D4F' }).c, one(I, { hex: '#2f7d4f', ink: 'sea' }).c, one(I, { hex: 'red', ink: 'sea' }).c, one(I, { hex: '#FFF' }).c, one(I, { hex: 12 }).c];
    R.HEX = { pass: J(got) === J(['#2F7D4F', '#2f7d4f', '#1A1206', '#111111', '#111111']), detail: J(got) };
  }
  {
    const got = [one(I, { alpha: 0.4 }).a, one(I, { tip: 'marker', alpha: 0.5 }).a, one(I, { alpha: 0 }).a, one(I, { alpha: 7 }).a, one(I, { alpha: 'thin' }).a];
    const pencil = paint(I, { tip: 'pencil', alpha: 0.5 }).map((p) => Math.round(p.globalAlpha * 1000) / 1000);
    const erase = paint(I, { eraser: true, size: 40, hex: '#FF0000', alpha: 0.2 })[0];
    R.ALPHA = { pass: J(got) === J([0.4, 0.2, 1, 1, 1]) && J(pencil) === J([0.31, 0.171]) && erase.lineWidth === I.ERASER_WIDTH && erase.globalAlpha === 1 && erase.strokeStyle === '#111111' && erase.globalCompositeOperation === 'destination-out', detail: J({ got, pencil, erase }) };
  }
  {
    const wide = [{ points: LINE, size: 30 }], thin = [{ points: LINE }];
    const at = { x: 0.3, y: 0.12 };   // 20px below the line on a 1000px sheet
    const got = [I.strokeAt(wide, at.x, at.y, 1000), I.strokeAt(thin, at.x, at.y, 1000)];
    R.HIT = { pass: got[0] === 0 && got[1] === null, detail: J(got) };
  }
  {
    const sheet = (v) => { globalThis.getComputedStyle = () => ({ getPropertyValue: (n) => (n === '--ink-on-paper' ? v : '') }); const got = I.darkSheetInk ? I.darkSheetInk({}) : 'missing'; delete globalThis.getComputedStyle; return got; };
    const reads = [sheet('#E8E8E5'), sheet(' #2B2014 '), sheet('rgb(232, 246, 250)'), sheet(''), I.darkSheetInk ? I.darkSheetInk(null) : 'missing'];
    const on = (extra) => { const r = recorder(); I.renderStroke(r.ctx, { points: LINE, ...extra }, 1000, '#111111', undefined, '#E8E8E5'); return r.passes[0].strokeStyle; };
    const got = [on({}), on({ ink: 'walnut' }), on({ ink: 'sea' }), on({ hex: '#2F7D4F' }), on({ ink: 'walnut', nib: 'broad' })];
    R.DARK = { pass: J(reads) === J(['#E8E8E5', null, 'rgb(232, 246, 250)', null, null]) && J(got) === J(['#E8E8E5', '#E8E8E5', '#1A1206', '#2F7D4F', '#E8E8E5']), detail: J({ reads, got }) };
  }
  {
    const widths = [];
    let scale = 1;
    const base = recorder();
    const ctx = { ...base.ctx, setTransform() {}, clearRect() {}, translate() {}, save() {}, restore() {}, scale(x) { scale = x; }, stroke() { widths.push(this.lineWidth * scale); } };
    globalThis.window = { devicePixelRatio: 1 };
    I.renderThumbnail({ getContext: () => ctx }, [{ points: LINE, size: 2.8 }, { points: LINE.map((p) => ({ x: p.x, y: p.y + 0.2 })), size: 14 }], 100, '#111111');
    delete globalThis.window;
    const px = widths.map((w) => Math.round(w * 100) / 100);
    R.THUMB = { pass: px.length === 2 && Math.abs(px[0] - 2.6) < 0.05 && Math.abs(px[1] - 13) < 0.05, detail: J(px) };
  }
  return R;
}

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const real = suite(SRC);
for (const [k, v] of Object.entries(real)) ok(k, v.pass, v.detail);

const MUTANTS = [
  ['SIZE', 'return sizeOf(stroke) ?? NIB_WIDTHS', 'return NIB_WIDTHS'],
  ['HEX', 'const hex = hexOf(stroke);', 'const hex: string | null = null;'],
  ['DARK', 'if (darkInk && ', 'if (false && '],
  ['THUMB', '0.4 / scale', '0.4'],
  ['ALPHA', 'ctx.globalAlpha = TIP_ALPHA[tip] * alphaOf(stroke);', 'ctx.globalAlpha = TIP_ALPHA[tip];'],
];
for (const [key, from, to] of MUTANTS) {
  const landed = SRC.includes(from);
  const red = landed && suite(SRC.replace(from, to))[key]?.pass === false;
  ok(`mutant ${key}`, landed && red, landed ? `red: ${red}` : 'did not land');
}

const pass = checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 300)}`);
console.log(pass ? `\nVISUAL INK STROKES UNIT: PASS (${checks.length})` : `\nVISUAL INK STROKES UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
