// THE FLUX LIVE JOIN, ONE SHOOT (Fable, Nov 23, 8:20 am: "frames from the join for the Wrizors' last pass (full address)"; the Wrizors' ship checklist A: one combined shoot).
// Every Flux piece's named screens, shot as the table now draws them: this file takes the preview door (&reorglift=...) and the old &flux3=1 out of each screen's address, so a piece that
// shows here is on by the table, not by the door. ?reorg=1 stays: the frames driver pins the reorg off for a page that does not ask. frames.json records each frame's full address.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<full sha> -f themes=flux -f screens_file=apps/desktop/scripts/frames/flux-live.mjs -f screens=<names>
// A frame is a LOOK (a PNG a person reads), never a verdict: it writes no assertion.
import back from './flux-reorg-back.mjs';
import front from './flux-reorg-front.mjs';
import rail from './flux-reorg-rail.mjs';
import top from './flux-reorg-top.mjs';
import split from './flux-reorg-split.mjs';
import mark from './flux-mark-splash.mjs';

const atTheAddress = (s) => (typeof s === 'string' && s.includes('replaceState')
  ? s.replace(/&reorglift=[a-z.,${}]+/g, '').replace(/\?flux3=1&/g, '?').replace(/&flux3=1/g, '')
  : s);

const onTheTable = (app) => new Proxy(app, {
  get(target, key) {
    if (key === 'evalJs') return (script, ...rest) => target.evalJs(atTheAddress(script), ...rest);
    const value = target[key];
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

const screens = {};
for (const set of [rail, top, front, back, split, mark]) {
  for (const [name, fn] of Object.entries(set)) screens[name] = (app, ctx) => fn(onTheTable(app), ctx);
}
export default screens;
