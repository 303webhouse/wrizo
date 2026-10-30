// THROWAWAY probe (INK, Oct 29, never merged): how wide does Chrome lay out the same string in the same bundled face under different text-rendering
// settings, and is a line box's height fractional? Prints a table; always exits 0.
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(process.cwd(), '..', '..');
const pnpmDir = path.join(ROOT, 'node_modules', '.pnpm');
const findFont = (pkg, file) => {
  for (const d of readdirSync(pnpmDir)) if (d.startsWith('@fontsource+' + pkg + '@')) { const f = path.join(pnpmDir, d, 'node_modules', '@fontsource', pkg, 'files', file); if (existsSync(f)) return f; }
  return null;
};
const fonts = {
  tit: findFont('titillium-web', 'titillium-web-latin-400-normal.woff2'),
  cour: findFont('courier-prime', 'courier-prime-latin-400-normal.woff2'),
};
console.log('FONT FILES', JSON.stringify(fonts));
const bin = process.env.CLAUDE_VERIFY_BROWSER;
const dir = mkdtempSync(path.join(os.tmpdir(), 'tp-'));
const STR = 'All of it at once, the whole house, every light.';
const html = `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:Tit;src:url('file://${fonts.tit}')}
@font-face{font-family:Cour;src:url('file://${fonts.cour}')}
body{margin:0} span{white-space:nowrap;font-size:15px;line-height:24px}
</style><body>
<span id=a style="font-family:Tit">${STR}</span><br>
<span id=b style="font-family:Tit;text-rendering:geometricPrecision">${STR}</span><br>
<span id=c style="font-family:Tit;text-rendering:optimizeLegibility">${STR}</span><br>
<span id=d style="font-family:Cour;font-size:16px">${'M'.repeat(50)}</span><br>
<div id=e style="font-family:Cour;font-size:16px;line-height:normal">x</div>
<div id=f style="font-family:Cour;font-size:12pt;line-height:normal">x</div>
<pre id=out></pre>
<script>
document.fonts.load('15px Tit').then(() => document.fonts.load('16px Cour')).then(() => document.fonts.ready).then(() => {
  const w = (id) => document.getElementById(id).getBoundingClientRect().width;
  const h = (id) => document.getElementById(id).getBoundingClientRect().height;
  const c = document.createElement('canvas').getContext('2d'); c.font = '15px Tit';
  document.getElementById('out').textContent = 'RESULT ' + JSON.stringify({ dsf: devicePixelRatio, tit: w('a'), titGeo: w('b'), titLegible: w('c'), titCanvas: c.measureText(${JSON.stringify(STR)}).width, courMx50: w('d'), courLineH16: h('e'), courLineH12pt: h('f') }) + ' END';
});
</script>`;
const file = path.join(dir, 'p.html');
writeFileSync(file, html);

// fontconfig variants
const fc = (hint, hs, rgba) => { const p = path.join(dir, `fc-${hint}-${hs}.conf`); writeFileSync(p, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><match target="pattern"><edit name="hinting" mode="assign"><bool>${hint}</bool></edit><edit name="hintstyle" mode="assign"><const>${hs}</const></edit><edit name="rgba" mode="assign"><const>${rgba}</const></edit><edit name="antialias" mode="assign"><bool>true</bool></edit></match></fontconfig>`); return p; };
const variants = [
  { name: 'default', args: [], env: {} },
  { name: 'font-render-hinting=none', args: ['--font-render-hinting=none'], env: {} },
  { name: 'enable-font-subpixel-positioning', args: ['--enable-font-subpixel-positioning'], env: {} },
  { name: 'disable-font-subpixel-positioning', args: ['--disable-font-subpixel-positioning'], env: {} },
  { name: 'force-device-scale-factor=1', args: ['--force-device-scale-factor=1'], env: {} },
  { name: 'disable-lcd-text', args: ['--disable-lcd-text'], env: {} },
  { name: 'fontconfig hinting off', args: [], env: { FONTCONFIG_FILE: fc('false', 'hintnone', 'none') } },
  { name: 'fontconfig hintfull', args: [], env: { FONTCONFIG_FILE: fc('true', 'hintfull', 'none') } },
  { name: 'fontconfig hinting off + enable-font-subpixel-positioning', args: ['--enable-font-subpixel-positioning'], env: { FONTCONFIG_FILE: fc('false', 'hintnone', 'none') } },
  { name: 'force-device-scale-factor=2 (shape only)', args: ['--force-device-scale-factor=2'], env: {} },
];
for (const v of variants) {
  try {
    const udd = mkdtempSync(path.join(os.tmpdir(), 'tpu-'));
    const out = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--allow-file-access-from-files', `--user-data-dir=${udd}`, '--virtual-time-budget=4000', '--dump-dom', 'file://' + file, ...v.args], { env: { ...process.env, ...v.env }, encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = /RESULT (\{.*?\}) END/.exec(out);
    console.log('PROBE', v.name.padEnd(58), m ? m[1] : 'no result: ' + out.slice(0, 120).replace(/\s+/g, ' '));
  } catch (e) { console.log('PROBE', v.name, 'ERR', String(e.message).slice(0, 160)); }
}
console.log('\nZZ-TEXTPROBE VERIFY: PASS (' + variants.length + ' variants printed)');
process.exit(0);
