// BUG #101 - fw-101.mjs over 12,000 to 20,000 words (where Enter's paint falls from 400 ms and multi-second outliers to the letter's own 37 ms): find the page size at which it switches. Same output lines (FW101).
process.env.WA_WORDS = process.env.WA_WORDS || '12000,13000,14000,15000,16000,17000,18000,19000,20000';
process.env.WA_KEYS = process.env.WA_KEYS || '20';
await import('./fw-101.mjs');
