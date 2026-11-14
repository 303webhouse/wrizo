// ARBOR KEY PROFILE, arm "rhizomeoff" (a measurement; see arbor-keyprofile.mjs). The arm and the flag are set before the harness module loads,
// because runtime-verify reads WS_URL_SEARCH when it is imported.
process.env.KP_ARM = 'rhizomeoff';
process.env.WS_URL_SEARCH = '?arbor2=1&arbor2room=day';
await import('./arbor-keyprofile.mjs');
