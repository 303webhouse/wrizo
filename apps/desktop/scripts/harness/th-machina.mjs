// Machina theme pack. Token values, the identity lexicon, and CAST.
// Run from the repo root after `pnpm --filter @writer-studio/desktop build:web`:
//   node apps/desktop/scripts/harness/th-machina.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const slot = (name) => `getComputedStyle(document.documentElement).getPropertyValue('${name}').trim()`;

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'arrival' });

  const applied = await app.evalJs(`(() => {
    window.wrizoTheme.set('machina');
    return document.documentElement.getAttribute('data-theme');
  })()`);
  ok('machina is a registered theme and applies data-theme', applied === 'machina', String(applied));

  const cool = await app.evalJs(`(() => ({
    ground: ${slot('--ink-950')},
    active: ${slot('--line-active')},
    signal: ${slot('--signal-live')},
    brass: ${slot('--brass')},
    cast: document.documentElement.getAttribute('data-cast'),
    sans: ${slot('--font-contentLabel')},
    serif: ${slot('--font-proseSerif')},
    proseSans: ${slot('--font-proseSans')},
    mono: ${slot('--font-chromeLabel')},
  }))()`);
  ok('cool ground is #0A0B0E', cool.ground === '#0A0B0E', cool.ground);
  ok('cool line-active is steel #7FA0BC', cool.active === '#7FA0BC', cool.active);
  ok('cool signal-live is #9DA5B4', cool.signal === '#9DA5B4', cool.signal);
  ok('orange invariant stays #ff9800', cool.brass === '#ff9800', cool.brass);
  ok('CAST defaults to cool', cool.cast === 'cool', String(cool.cast));
  ok('content label is IBM Plex Sans', String(cool.sans).includes('IBM Plex Sans'), String(cool.sans));
  ok('prose serif is IBM Plex Serif', String(cool.serif).includes('IBM Plex Serif'), String(cool.serif));
  ok('prose sans is Atkinson Hyperlegible', String(cool.proseSans).includes('Atkinson Hyperlegible'), String(cool.proseSans));
  ok('chrome readout is IBM Plex Mono', String(cool.mono).includes('IBM Plex Mono'), String(cool.mono));

  const neutral = await app.evalJs(`(() => {
    window.wrizoThemePrefs.set({ cast: 'neutral' });
    return {
      active: ${slot('--line-active')},
      ground: ${slot('--ink-950')},
      cast: document.documentElement.getAttribute('data-cast'),
    };
  })()`);
  ok('neutral line-active is the orange', neutral.active === '#FF9800', neutral.active);
  ok('neutral ground is #0A0A0A', neutral.ground === '#0A0A0A', neutral.ground);
  ok('data-cast is neutral', neutral.cast === 'neutral', String(neutral.cast));

  const paper = await app.evalJs(`(() => {
    window.wrizoThemePrefs.set({ cast: 'cool', page: 'light' });
    const light = ${slot('--paper')};
    window.wrizoThemePrefs.set({ page: 'dark' });
    const dark = ${slot('--paper')};
    return { light, dark };
  })()`);
  ok('light paper is #F8F9FC', paper.light === '#F8F9FC', paper.light);
  ok('dark paper is #16181F and does not recolor the room', paper.dark === '#16181F', paper.dark);

  const words = await app.evalJs(`(() => {
    const lex = window.wrizoLexicon;
    const desk = window.wrizoDeskLexicon;
    return {
      journal: lex.t('journal', 'machina'),
      page: lex.t('page', 'machina'),
      plan: lex.t('plan', 'machina'),
      shelf: lex.t('shelf', 'machina'),
      drawer: desk.t('drawerPlaceJournal', 'machina'),
      fluxJournal: lex.t('journal', 'flux'),
    };
  })()`);
  ok('Machina lexicon keeps Journal', words.journal === 'Journal', words.journal);
  ok('Machina lexicon keeps Page', words.page === 'Page', words.page);
  ok('Machina lexicon keeps Plan', words.plan === 'Plan', words.plan);
  ok('Machina lexicon keeps Shelf', words.shelf === 'Shelf', words.shelf);
  ok('Machina desk string keeps Journal', words.drawer === 'Journal', words.drawer);
  ok('Flux still renames Journal to Log', words.fluxJournal === 'Log', words.fluxJournal);

  const restored = await app.evalJs(`(() => {
    window.wrizoTheme.set('plateau');
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      ground: ${slot('--ink-950')},
      brass: ${slot('--brass')},
    };
  })()`);
  ok('leaving Machina restores Plateau', restored.theme === 'plateau' && restored.ground === '#110600' && restored.brass === '#ff9800', JSON.stringify(restored));

  return checks;
});

console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nTH-MACHINA VERIFY: PASS (${checks.length} checks)` : `\nTH-MACHINA VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
