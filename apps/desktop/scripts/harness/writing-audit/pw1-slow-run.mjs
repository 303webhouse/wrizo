// Bug #84: pw1 with PARKED armed and the cascade's exit slowed (PW1_SLOW_EXIT=1), so the driver race that makes S5 (Q6) red one run in a dozen is hit every time.
process.env.HARNESS_PARKED = '1';
process.env.PW1_SLOW_EXIT = '1';
await import('../pw1.mjs');
