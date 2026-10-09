guest-client-walk - the live walk of the guest client (Batch 11), 14/14 PASS.

What ran: apps/desktop/scripts/harness/guest-client-walk.mjs against a LIVE local server (never production):
  client   guest-client-r4 @ afe9bb2b (the web build of that tree)
  server   the guest-login server half (origin/guest-login @ de1f170) merged into a scratch tree; a throwaway local Postgres
  rig      two guests minted with the real mint script (one live, one inside the 14-day claim grace); both consumed/discarded with the database
When:     2026-10-09 02:49:02Z-02:49:09Z (the log's last write is 02:49:08.9Z). Grant: INK, token ink-guest-walk-20261008, written 02:48:06.915Z.
Redaction: one line of the log (W2's detail) printed the first ten characters of the live fixture's token. It is replaced by
  <redacted-token-prefix>; nothing else was altered. The token belonged to a database that no longer exists. No other token text is in this file.
The log carries no timestamps of its own; the times above are from the shell clock around the launch and the file's modification time.
