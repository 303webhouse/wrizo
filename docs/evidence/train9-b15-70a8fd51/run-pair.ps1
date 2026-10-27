$ErrorActionPreference = 'Continue'
$wt = 'C:\Users\nickh\writer-studio\.claude\worktrees\b15'
$ev = "$wt\docs\evidence\train9-b15-70a8fd51"
$tok = [IO.File]::ReadAllText("$env:TEMP\ws-t9-token.txt").Trim()
$env:WS_BOX_TURN = $tok
$status = "$ev\b15-status.txt"
"START $((Get-Date).ToUniversalTime().ToString('HH:mm:ss'))Z" | Out-File $status -Encoding ascii
Set-Location "$wt\apps\desktop"
try {
  node scripts/run-suite.mjs *> "$ev\b15-default.out"
  "default done exit=$LASTEXITCODE $((Get-Date).ToUniversalTime().ToString('HH:mm:ss'))Z" | Out-File $status -Append -Encoding ascii
  node scripts/run-suite.mjs --parked *> "$ev\b15-parked.out"
  "parked done exit=$LASTEXITCODE $((Get-Date).ToUniversalTime().ToString('HH:mm:ss'))Z" | Out-File $status -Append -Encoding ascii
} finally {
  Set-Location $wt
  node apps/desktop/scripts/box-take.mjs release $tok *>> $status
  Remove-Item "$env:TEMP\ws-t9-token.txt" -ErrorAction SilentlyContinue
  "b15 COMPLETE" | Out-File $status -Append -Encoding ascii
}
