// Runs scripts/harness/pw1.mjs on Actions with its PARKED block armed (bug #84: pw1's S5 Q6 reds now and then, parked leg). Not a new check: it imports the file.
process.env.HARNESS_PARKED = '1';
await import('../pw1.mjs');
