/**
 * ITEM 204 PART 2 — AMBIENT TYPES FOR `harper.js`, AND WHY THEY EXIST AT ALL.
 *
 * harper.js 2.10.0 ships its types behind an `exports` map ("." and "./slimBinary").
 * This package compiles with `moduleResolution: "node"` (tsconfig.json:12) — Node10
 * resolution, which predates `exports` maps and cannot read one. So tsc reports
 * "Cannot find module 'harper.js'" while pointing at the very `.d.ts` it declines to
 * use, and suggests `node16` / `nodenext` / `bundler`.
 *
 * ⛔ THE SETTING IS NOT CHANGED HERE, DELIBERATELY. `bundler` is the correct setting
 * for a Vite app and this is almost certainly worth doing — but it re-resolves EVERY
 * import in the package, and "keep changes minimal, no refactors outside ticket
 * scope" is a hard rule. A resolution change is its own ticket with its own build,
 * not a rider on a proofing engine. ⚠ PROPOSED TO FABLE, NOT SHIPPED.
 *
 * ⚠ AND AN AMBIENT DECLARATION IS A HAND-WRITTEN COPY OF SOMEONE ELSE'S API, which
 * is exactly the shape that rots without anyone noticing: it keeps compiling long
 * after the package it describes has moved. So it declares only the surface
 * `store/proofingEngine.ts` actually touches, and `item204-engine-proof.mjs` reads
 * the INSTALLED package and asserts these names and shapes against it. If harper
 * changes, the proof goes red rather than the types quietly lying.
 */

declare module 'harper.js' {
  /** Harper's own enum order, asserted against the package by the proof. */
  export enum Dialect {
    American = 0,
    British = 1,
    Australian = 2,
    Canadian = 3,
    Indian = 4,
  }

  export interface LintSpan { start: number; end: number }

  export interface Suggestion {
    get_replacement_text(): string;
    free?(): void;
  }

  export interface Lint {
    span(): LintSpan;
    lint_kind(): string;
    message(): string;
    suggestions(): Suggestion[];
    free?(): void;
  }

  export interface LintOptions {
    language?: 'plaintext' | 'markdown' | 'typst';
    dedup?: boolean;
  }

  export interface LinterInit {
    binary: unknown;
    dialect?: Dialect;
  }

  /** The surface this build uses. harper's real interface is much wider. */
  export interface Linter {
    setup(): Promise<void>;
    lint(text: string, options?: LintOptions): Promise<Lint[]>;
    setDialect(dialect: Dialect): Promise<void>;
    getDialect(): Promise<Dialect>;
    importWords(words: string[]): Promise<void>;
    clearWords(): Promise<void>;
    exportWords(): Promise<string[]>;
    importIgnoredLints(json: string): Promise<void>;
    exportIgnoredLints(): Promise<string>;
    clearIgnoredLints(): Promise<void>;
    dispose(): Promise<void>;
  }

  /**
   * ⚠ THE PRODUCT TAKES THIS ONE. harper's own types say `LocalLinter` is the Node
   * one and that `WorkerLinter` "will not work properly in Node" — so the product
   * takes WorkerLinter and the browserless proof takes LocalLinter. Measured reason,
   * not taste: median 435 ms to lint 60,000 characters, which on the main thread is
   * a visible freeze of the writing surface on every pass. PAGE IS PRIMARY.
   */
  export class WorkerLinter implements Linter {
    constructor(init: LinterInit);
    setup(): Promise<void>;
    lint(text: string, options?: LintOptions): Promise<Lint[]>;
    setDialect(dialect: Dialect): Promise<void>;
    getDialect(): Promise<Dialect>;
    importWords(words: string[]): Promise<void>;
    clearWords(): Promise<void>;
    exportWords(): Promise<string[]>;
    importIgnoredLints(json: string): Promise<void>;
    exportIgnoredLints(): Promise<string>;
    clearIgnoredLints(): Promise<void>;
    dispose(): Promise<void>;
  }

  export class LocalLinter implements Linter {
    constructor(init: LinterInit);
    setup(): Promise<void>;
    lint(text: string, options?: LintOptions): Promise<Lint[]>;
    setDialect(dialect: Dialect): Promise<void>;
    getDialect(): Promise<Dialect>;
    importWords(words: string[]): Promise<void>;
    clearWords(): Promise<void>;
    exportWords(): Promise<string[]>;
    importIgnoredLints(json: string): Promise<void>;
    exportIgnoredLints(): Promise<string>;
    clearIgnoredLints(): Promise<void>;
    dispose(): Promise<void>;
  }
}

declare module 'harper.js/slimBinary' {
  /**
   * SLIM, AND ONE BINARY ONLY. Measured (the S0): slim 15.20 MB raw / 7.69 MB gzip
   * against full's 15.42 / 7.78, and the two scored IDENTICALLY on the fixture — so
   * slim carries no measured accuracy penalty. The npm page's 71.71 MB is every
   * variant summed; the `*Inlined` modules base64 the wasm into JS and would roughly
   * triple the cost, so they are never imported.
   */
  export const slimBinary: unknown;
}
