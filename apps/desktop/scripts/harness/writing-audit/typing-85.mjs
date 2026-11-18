// BUG #85 (per-key cost growing with page length: 2 ms at 500 words, 52 ms at 50,000, Fable's list): typing-93.mjs over 500, 5,000, 20,000 and 50,000 words (WA_KEYS 20), Draft and Free Write. A measurement.
process.env.WA_WORDS = process.env.WA_WORDS || '500,5000,20000,50000';
process.env.WA_KEYS = process.env.WA_KEYS || '20';
await import('./typing-93.mjs');
