$ErrorActionPreference = 'Continue'
$wt = 'C:\Users\nickh\writer-studio\.claude\worktrees\b18'
$ev = "$wt\docs\evidence\train9-b18-b4a72770"
$tok = [IO.File]::ReadAllText("$env:TEMP\ws-t9b18-token.txt").Trim()
$env:WS_BOX_TURN = $tok
$only = [IO.File]::ReadAllText("$ev\b18-only.txt").Trim()
$status = "$ev\b18-status.txt"
"START $([DateTime]::UtcNow.ToString('HH:mm:ss'))Z" | Out-File $status -Encoding ascii
Set-Location "$wt\apps\desktop"
try {
  node scripts/run-suite.mjs --only $only *> "$ev\b18-default.out"
  "default done exit=$LASTEXITCODE $([DateTime]::UtcNow.ToString('HH:mm:ss'))Z" | Out-File $status -Append -Encoding ascii
  node scripts/run-suite.mjs --parked --only $only *> "$ev\b18-parked.out"
  "parked done exit=$LASTEXITCODE $([DateTime]::UtcNow.ToString('HH:mm:ss'))Z" | Out-File $status -Append -Encoding ascii
} finally {
  Set-Location $wt
  node apps/desktop/scripts/box-take.mjs release $tok *>> $status
  Remove-Item "$env:TEMP\ws-t9b18-token.txt" -ErrorAction SilentlyContinue
  "b18 COMPLETE $([DateTime]::UtcNow.ToString('HH:mm:ss'))Z" | Out-File $status -Append -Encoding ascii
}
