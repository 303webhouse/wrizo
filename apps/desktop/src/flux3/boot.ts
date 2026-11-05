// FLUX3 - loaded only under ?flux3=1 (main.tsx imports this module dynamically behind the flag, so nothing here reaches a writer without it).
// It marks the root and loads flux-v3.css: every Flux 3 rule is scoped to :root[data-flux3][data-theme='flux'], so the other themes never
// see one, and without the flag the file is never fetched at all (POLISH's request, Nov 5: never an @import in index.css).
import './flux-v3.css';

document.documentElement.setAttribute('data-flux3', '');
