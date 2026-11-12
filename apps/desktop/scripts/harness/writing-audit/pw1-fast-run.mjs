// Bug #84: pw1 with PARKED armed and every wait polling each millisecond (PW1_FAST_POLL=1), so the driver race that makes S5 (Q6) red one run in a dozen or two is hit nearly every time.
process.env.HARNESS_PARKED = '1';
process.env.PW1_FAST_POLL = '1';
await import('../pw1.mjs');
