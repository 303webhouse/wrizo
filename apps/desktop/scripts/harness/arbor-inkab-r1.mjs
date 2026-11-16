// ARBOR: #101's INK LAYER A/B - runner copy 1 (a measurement branch only; see arbor-inkab.mjs). The day room under the flag; 12 rounds.
process.env.WS_URL_SEARCH = '?arbor2=1&arbor2room=day';
process.env.KSC_ROUNDS = process.env.KSC_ROUNDS || '12';
await import('./arbor-inkab.mjs');
