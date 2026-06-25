# Backlog / Build Log

Reverse-chronological log of shipped tickets (newest first). One line per ticket; link the brief where one exists.

## Brand paint — Ember → Wrizo (name, fonts, accent, ground)
**Branch:** `brand-paint` off `m1-creative-flow`. Brief: [brand-ticket-brief.md](brand-ticket-brief.md). Paint only — no structure.
- **Name:** Wordmark now renders the text **Wrizo** in Figtree, glyph removed (no `ember-hero.png`); tab `<title>` → Wrizo; PWA manifest `name`/`short_name` → Wrizo; testament line "tended Wrizo". Package names (`@writer-studio/*`) untouched, per scope.
- **Fonts:** Figtree (titles/UI via `--font-display`/`--font-ui`), Crimson Pro (body + writing surface via `--font-prose`, inherited by `.paper-page`/`ForwardOnlyEditor` — no logic touched). Installed `@fontsource-variable/crimson-pro`; wired `@fontsource-variable/figtree`. Removed Mulish/Newsreader/Courier Prime imports; `--font-mono` falls back to system mono.
- **Accent:** `--brass` → **#ff9800** (locked/invariant; token name kept to avoid a global rename). First application of the real orange (the `.btn-brass` action).
- **Ground:** `--ink-950` and `html`/`theme-color`/manifest bg → **#110600** deep espresso.
- **Verified:** tsc + build:web pass; build-log self-check inverts the font list (emits `figtree-*` + `crimson-pro-*`, no `mulish-*`/`newsreader-*`/`courier-prime-*`); harness selftest green; brand runtime check confirms title/wordmark = Wrizo, no "Ember" on screen, `--brass`=#ff9800, `--ink-950`=#110600, UI=Figtree, writing surface=Crimson Pro.
- **Note:** unused asset `public/brand/ember-hero.png` left in place (file removal is out of paint scope).
