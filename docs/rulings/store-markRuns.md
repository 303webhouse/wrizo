# Rulings: `apps/desktop/src/store/markRuns.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[markRuns §n]` points here.

## markRuns §1

From `apps/desktop/src/store/markRuns.ts`, line 22 at `e2898deb` (the comment that stays: "a font or size on highlighted words is a run too, `[the words]{.font-<slug> .size-N}`; its two marks differ, so every reader of a closing mark reads closeMark(r); marks hold no whitespace, so no word counter counts one").

```ts
// FONT-SPAN (Nick's ruling, Oct 13; docs/font-span-plan.md): a font on HIGHLIGHTED words is a run too - `[the words]{.font-<slug>}`,
// the bracketed span Pandoc reads, the slug being the roster face's name lower-cased with hyphens for spaces. Its two marks DIFFER
// (`[` opens, `]{.font-<slug>}` closes), so a run carries its closing mark when it is not its opening one; every reader that measures
// a closing mark reads `closeMark(r)`, never `r.mark`. The marks hold no whitespace, so no word counter ever counts one.
// POLISH #10 item 4 (Nick ruled A, Oct 25): a SIZE on highlighted words is the same kind of span - `[the words]{.size-N}` (N in points, whole or
// half: `10.5`) - and where a face and a size meet on the same words they are ONE span with both classes, `[the words]{.font-<slug> .size-N}`, so
// two spans never cross. It stays kind 'font' (a STYLE span): every reader that already handles a font span - hiding, the caret, Backspace and Enter,
// the strippers, the word counts, the clipboard - handles a size span the same way. A run carries `face` and/or `points`.
```

## markRuns §2

From `apps/desktop/src/store/markRuns.ts`, line 43 at `e2898deb` (the comment that stays: "a span's size in points (a size span, or a face+size span)").

```ts
  /** POLISH #10 item 4: a span's size in points (a size span, or a face+size span) */
```

## markRuns §3

From `apps/desktop/src/store/markRuns.ts`, line 52 at `e2898deb` (the comment that stays: "a style span's closing marker: the face's class first, the size's second").

```ts
/** POLISH #10 item 4: a style span's closing marker - the face's class first, the size's second (`]{.font-lora .size-14}`, `]{.size-10.5}`). */
```

## markRuns §4

From `apps/desktop/src/store/markRuns.ts`, line 88 at `e2898deb` (the comment that stays: "a face and/or a size").

```ts
// POLISH #10 item 4: a face and/or a size
```

## markRuns §5

From `apps/desktop/src/store/markRuns.ts`, line 104 at `e2898deb` (the comment that stays: "a typed formatting character is stored with Markdown's escape (a backslash before it), so it never becomes markup and a .md export shows it literally; the backslash is a hidden mark; older text holds no escapes").

```ts
// ---- TYPED-LITERAL (Nick's ruling, Oct 16; docs/typed-literal-plan.md): a formatting character the writer TYPES (or pastes) has no
// formatting meaning. It is stored with Markdown's own escape - a backslash before it - so it never becomes markup, and a .md export
// shows the literal character in any Markdown reader. An ESCAPE is a backslash followed by one of these; the backslash is the escape's
// hidden mark (the page shows the character alone), and the character is plain text. `\\` is an escaped backslash, so in `\\*` the star
// is real markup again (Markdown's own rule). Saved text from before the ruling holds no escapes and reads exactly as it did.
```

## markRuns §6

From `apps/desktop/src/store/markRuns.ts`, line 227 at `e2898deb` (the comment that stays: "six heading levels, `#` to `######` and a space, one-to-one with h1-h6; seven or more hashes are text").

```ts
      // HEADINGS, six levels (Nick, 2026-10-06: "whatever the standard is for WordPress or other web-based apps"): `#` to `######` and
      // a space, one-to-one with HTML h1-h6. Seven or more hashes are text, as in Markdown.
```

## markRuns §7

From `apps/desktop/src/store/markRuns.ts`, line 273 at `e2898deb` (the comment that stays: "the text with every style span's two marks taken out and everything else kept exactly: what prompts and readers of the words are given").

```ts
/** FONT-SPAN (Fable's addition 1, Oct 15): the text with every font span's two marks taken out and EVERYTHING else kept exactly - the
 *  emphasis, the structure tokens, the words. What the Tutor's prompts, Consistency and any reader of the words are given. */
```

## markRuns §8

From `apps/desktop/src/store/markRuns.ts`, line 276 at `e2898deb` (the comment that stays: "a size span is a style span too").

```ts
// POLISH #10 item 4: a size span is a style span too
```
