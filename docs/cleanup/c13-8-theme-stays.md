# #13 step 8: the theme rules that stay where they are

Each rule below is scoped to one theme and sits among the component rules, but a later rule of EQUAL specificity sets a
property it also sets, on what may be the same box. There, source order alone decides which wins, so moving the theme rule
into `src/styles/themes/` (imported last) would flip it. Raising a rule's specificity to move it anyway is a ruling, rule by rule.

| Theme | Rule (file:line) | Its rival (file:line) | Shared properties |
|---|---|---|---|
| flux | `[data-theme='flux'] .mode-settings h4` (12-studio-chrome.css:297) | `.wz-sliver-instruments .mode-settings h4` (14-ink-options.css:115) | color |
| machina | `[data-theme='machina'] .deck-wizard-dialog .btn-quiet` (18-desk-rail.css:258) | `.sprint-nav .page-plan-door:hover` (18-desk-rail.css:518) | color |
| machina | `[data-theme='machina'] .deck-wizard-dialog .btn-brass` (18-desk-rail.css:269) | `.help-diagnostic .help-br.a` (21-help-me-choose.css:66) | border~border-width |
| machina | `[data-theme='machina'] .forms-intake` (18-desk-rail.css:277) | `.wz-help-door:hover, .wz-help-door:focus-visible` (21-help-me-choose.css:192) | color |
| flux | `[data-theme='flux'] .walk-mark` (18-desk-rail.css:441) | `.walk-mark[data-lit='true']` (21-help-me-choose.css:230) | color, opacity |
| flux | `[data-theme='flux'] .walk-mark` (18-desk-rail.css:441) | `.walk-mark[data-sub='true']` (21-help-me-choose.css:286) | width, height |
| machina | `[data-theme='machina'] .walk-card` (21-help-me-choose.css:151) | `.walk-card[data-sub='true']` (21-help-me-choose.css:280) | border~border-left |
| machina | `[data-theme='machina'] .walk-nav svg` (21-help-me-choose.css:158) | `.walk-mark[data-sub='true'] svg` (21-help-me-choose.css:287) | width, height |
| machina | `[data-theme='machina'] .walk-mark` (21-help-me-choose.css:167) | `.walk-mark[data-lit='true']` (21-help-me-choose.css:230) | color, opacity |
| machina | `[data-theme='machina'] .walk-mark` (21-help-me-choose.css:167) | `.walk-mark[data-sub='true']` (21-help-me-choose.css:286) | width, height |
| machina | `[data-theme='machina'] .walk-mark::after` (21-help-me-choose.css:172) | `.walk-mark[data-fx='kindle']::after` (21-help-me-choose.css:224) | content, position, top, left |
| flux | `[data-theme='flux'] [data-fx='kindle'] > .kindle-mark` (21-help-me-choose.css:219) | `[data-fx='kindle'] > .kindle-mark .kindle-root path, .walk-mark[data-fx='kindle'] svg, .walk-trk[data-fx='kindle'], .ret` (21-help-me-choose.css:253) | animation |

## Kept with their feature (Fable, ruling (b), Nov 2)

111 more theme rules have no rival but stay where they are: `18-desk-rail.css` and `21-help-me-choose.css` keep each feature's
theme dress inside its named zones (the guided paths, Scenes, W5, the Machina deck wizard and forms), which their harnesses read whole.

- `18-desk-rail.css`: 58 rules
- `21-help-me-choose.css`: 53 rules
