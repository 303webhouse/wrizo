// Runs scripts/harness/item85c.mjs with its PARKED block armed, so Actions can verify the S2 change (successor, mutant, parked record). Not a new check: it imports the file.
process.env.HARNESS_PARKED = '1';
await import('../item85c.mjs');
