// BUG #101 - fw-101.mjs with the sizes run in DESCENDING order (20,000 first): if the slow size follows the order, it is state left from the size before, not the size. Same output lines (FW101).
process.env.WA_WORDS = process.env.WA_WORDS || '20000,12000,8000,5000,3500,2000,500';
await import('./fw-101.mjs');
