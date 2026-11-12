// Bug #84: pw1 with a diagnostic copy (pw1-diag.mjs prints PW1-DIAG-84 when S5 Q6 is red), PARKED armed.
process.env.HARNESS_PARKED = '1';
await import('../pw1-diag.mjs');
