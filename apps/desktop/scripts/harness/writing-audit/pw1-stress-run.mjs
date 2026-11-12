// Bug #84: pw1 with PARKED armed and no wait for the closed panel before S5's reopen (PW1_NO_WAIT_CLOSE=1): the reopen lands inside the panel's slide-out far more often, the race that makes S5 (Q6) red one run in a dozen or two.
process.env.HARNESS_PARKED = '1';
process.env.PW1_NO_WAIT_CLOSE = '1';
await import('../pw1.mjs');
