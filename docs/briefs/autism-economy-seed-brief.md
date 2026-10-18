# Seed: The Autism Economy, on Nick's main account (Fable, Oct 17)

Nick's request: wipe every document on his main account (all test text), then add:
- his essay "The Autism Economy" as a Draft Page;
- a board laying out the essay's 52 sources, linked to the Draft;
- a drawer holding both.

## Files
- `the-autism-economy.md`: the essay. Headings use `#`/`##`, italics `*…*`, and the Sources list is one `- ` line each, with URLs in parentheses.
- `seed-plan.json`: the wipe rules, drawer, page and board layout. The board has a Draft page pin plus six columns, each a header card and its source cards, with positions, sizes and links.

## Build: one script, `apps/desktop/scripts/seed/autism-economy.mjs`
1. **Use the app's own code paths**, never raw SQL:
   - delete → Trash → Delete for good;
   - the import path for the essay;
   - board, card, pin, connector and drawer creation through the same store functions the UI uses.
2. **Sign in** from a local account file Nick writes himself (`~/.wrizo/seed-account.json`: email + password). Never print or log it. The target URL comes from `WS_TARGET_URL`.
3. **`--dry-run`** (the default) prints COUNTS ONLY (Pages, Journal and Shelf pages, boards, cards, drawers, Trash) of what would be deleted. `--apply` does it.
4. **Keep nothing** (Nick: a fresh start with only this essay's Page, board and drawer). Built-in places such as Journal, Shelf and Trash stay, but end up empty, Trash included.
5. **Links** use today's same-board connectors (connector-a): each header card links to the Draft pin, and each source card to its header. When connector-b ships, nothing more is needed.
6. **After `--apply`**, it re-reads and asserts:
   - 1 Draft page with about 5,600 words and 8 section headings plus Sources;
   - 1 board with 1 pin, 6 headers and 52 source cards;
   - 58 links;
   - 1 drawer holding both;
   - nothing else left at all, including Trash.

## Order
- Build and run it against a local server with a throwaway account, take frames and send them to Fable.
- Production only via Chat 1:
  1. the `pg_dump` + restore proof first (Nick types the database address);
  2. dry-run counts shown to Nick;
  3. Nick says go;
  4. `--apply`;
  5. live frames.
