// Box display/viewport probe: what the harness's browser sees right now. Browser = CLAUDE_VERIFY_BROWSER or the harness default.
import { pathToFileURL } from 'node:url';
const { withHarness } = await import(pathToFileURL('C:/Users/nickh/train-12f/apps/desktop/scripts/runtime-verify.mjs').href);
await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await new Promise((r) => setTimeout(r, 1500));
  const r = await app.evalJs(`JSON.stringify({
    ua: navigator.userAgent.replace(/.*(Chrome\\/[\\d.]+|Edg\\/[\\d.]+).*/, '$1') + ' | ' + (navigator.userAgent.match(/Edg\\/[\\d.]+/)||['chrome'])[0],
    inner: [innerWidth, innerHeight], outer: [outerWidth, outerHeight], dpr: devicePixelRatio,
    screen: [screen.width, screen.height, screen.availWidth, screen.availHeight], orient: screen.orientation && screen.orientation.type,
    vv: visualViewport ? [visualViewport.width, visualViewport.height, visualViewport.scale] : null,
    docEl: [document.documentElement.clientWidth, document.documentElement.clientHeight],
    bodyZoom: getComputedStyle(document.documentElement).zoom, fontSize: getComputedStyle(document.documentElement).fontSize,
    lang: navigator.language, mq: [matchMedia('(min-resolution: 1.5dppx)').matches, matchMedia('(pointer: coarse)').matches, matchMedia('(hover: hover)').matches],
  })`);
  console.log('PROBE ' + r);
});
