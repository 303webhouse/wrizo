// ITEM 207 — the roster loads a face by a DYNAMIC import of its @fontsource CSS (load-on-choose). A static
// `import 'x.css'` is a side-effect import TypeScript never resolves; a dynamic one is, so the path needs a declaration.
declare module '*.css';
