param([string]$Worktree, [string]$File, [string]$OutFile)
# one short box turn for ONE harness file: take the grant (token captured, never printed), run, release with release <token>.
$ErrorActionPreference = 'Continue'
Set-Location $Worktree
$out = node apps/desktop/scripts/box-take.mjs take chat1 2>&1 | Out-String
$m = [regex]::Match($out, 'WS_BOX_TURN=(\S+)')
if (-not $m.Success) { ($out -replace '[0-9a-f]{32,}', '<hash>'); exit 3 }
$tok = $m.Groups[1].Value
"granted $([DateTime]::UtcNow.ToString('HH:mm:ss'))Z"
$env:WS_BOX_TURN = $tok
try {
  Set-Location "$Worktree\apps\desktop"
  node scripts/run-suite.mjs --only $File *> $OutFile
  "exit=$LASTEXITCODE"
} finally {
  Set-Location $Worktree
  node apps/desktop/scripts/box-take.mjs release $tok 2>&1 | ForEach-Object { $_ -replace [regex]::Escape($tok), '<token>' }
  Remove-Item Env:WS_BOX_TURN -ErrorAction SilentlyContinue
  "released $([DateTime]::UtcNow.ToString('HH:mm:ss'))Z"
}
