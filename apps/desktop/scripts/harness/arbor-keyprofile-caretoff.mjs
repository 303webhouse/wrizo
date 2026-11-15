// ARBOR KEY PROFILE, arm "caretoff" (a measurement; see arbor-keyprofile.mjs). The arm and the flag are set before the harness module loads,
// because runtime-verify reads WS_URL_SEARCH when it is imported.
process.env.KP_ARM = 'caretoff';
process.env.WS_URL_SEARCH = '?arbor2=1&arbor2room=day&arbor2caret=off';
await import('./arbor-keyprofile.mjs');
