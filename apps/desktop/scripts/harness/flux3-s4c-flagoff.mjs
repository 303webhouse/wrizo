// flux3-s4c WITHOUT the flag (Fable, Nov 12 6:50 pm: "flux3-s4c both ways"). The Corridor's 80-odd checks, every page opened at /#/page/<id> (no ?flux3=1): the same file, its FLAG switch off. A wrapper so the suite runner,
// which passes no environment, runs the flag-off way as a file of its own. flux3-s4c.mjs itself, unchanged in the way you call it, is the flag-on way.
process.env.FLUX3_S4C_FLAG = '0';
await import('./flux3-s4c.mjs');
