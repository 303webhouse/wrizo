// PROBE ONLY (arbor/swap-w9d-probe, never merged): runs arbor2-swap.mjs on Actions, which has no input for the launcher's WS_URL_SEARCH.
// The env must be set before runtime-verify is imported, so this file sets it and then imports the harness.
process.env.WS_URL_SEARCH = '?arbor2=1&arbor2room=day';
await import('./arbor2-swap.mjs');
