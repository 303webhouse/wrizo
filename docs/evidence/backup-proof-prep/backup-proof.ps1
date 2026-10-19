# BACKUP PROOF, step 2 of 3 - Nick runs this himself, in his own PowerShell window.
# It asks for the production database address (typed hidden - nothing echoes), uses it only inside this window for the next few minutes, and never writes it anywhere.
# It does: (1) count every table's rows, (2) take the full backup with pg_dump, (3) count every table again, (4) forget the address.
# It prints only: times, the backup's size, and each table's name and row count. The backup file stays on this computer, in C:\Users\nickh\.claude\backup-proof\out\ - NOT in the repo.
# Run:  powershell -ExecutionPolicy Bypass -File C:\Users\nickh\.claude\backup-proof\backup-proof.ps1
$ErrorActionPreference = 'Stop'
$PgBin = 'C:\Users\nickh\tools\pgsql\bin'
$Here  = 'C:\Users\nickh\.claude\backup-proof'
$Out   = Join-Path $Here 'out'
if (-not (Test-Path (Join-Path $PgBin 'pg_dump.exe'))) { Write-Host "pg_dump.exe was not found in $PgBin - do step 1 first (see Claude's instructions)." -ForegroundColor Red; exit 2 }
New-Item -ItemType Directory -Force $Out | Out-Null
Write-Host ''
Write-Host 'Type or paste the production database address. You will see nothing as you type; press Enter when done.' -ForegroundColor Cyan
$secure = Read-Host -AsSecureString 'Database address'
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $addr = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  if ($addr -notmatch '^postgres(ql)?://') { Write-Host 'That does not look like a postgres:// address. Nothing was run.' -ForegroundColor Red; exit 3 }
  $u = [System.Uri]$addr
  $ui = $u.UserInfo.Split(':', 2)
  $env:PGHOST = $u.Host
  $env:PGPORT = if ($u.Port -gt 0) { "$($u.Port)" } else { '5432' }
  $env:PGUSER = [System.Uri]::UnescapeDataString($ui[0])
  $env:PGPASSWORD = if ($ui.Length -gt 1) { [System.Uri]::UnescapeDataString($ui[1]) } else { '' }
  $env:PGDATABASE = $u.AbsolutePath.TrimStart('/')
  $env:PGSSLMODE = 'require'
  $env:PGSSL = '1'
  $addr = $null
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $dump = Join-Path $Out "wrizo-production-$stamp.dump"
  $before = Join-Path $Out "counts-before-$stamp.json"
  $after  = Join-Path $Out "counts-after-$stamp.json"
  Write-Host ''
  Write-Host '1/3  Counting rows in every table (before the backup)...' -ForegroundColor Cyan
  $env:BP_OUT = $before
  & node (Join-Path $Here 'bp-counts.mjs')
  if ($LASTEXITCODE -ne 0) { Write-Host 'The count failed - stopping. Nothing else was run.' -ForegroundColor Red; exit 4 }
  Write-Host ''
  Write-Host '2/3  Taking the full backup (this reads the database; it changes nothing)...' -ForegroundColor Cyan
  $sw = [Diagnostics.Stopwatch]::StartNew()
  & (Join-Path $PgBin 'pg_dump.exe') -Fc -f $dump
  $dumpExit = $LASTEXITCODE
  $sw.Stop()
  if ($dumpExit -ne 0 -or -not (Test-Path $dump)) { Write-Host "pg_dump failed (exit $dumpExit) - stopping." -ForegroundColor Red; exit 5 }
  $mb = [Math]::Round((Get-Item $dump).Length / 1MB, 2)
  Write-Host ("BPDUMP seconds={0:N1} sizeMB={1} file={2}" -f $sw.Elapsed.TotalSeconds, $mb, $dump)
  Write-Host ''
  Write-Host '3/3  Counting rows again (after the backup)...' -ForegroundColor Cyan
  $env:BP_OUT = $after
  & node (Join-Path $Here 'bp-counts.mjs')
  Write-Host ''
  Write-Host 'Done. The address has been forgotten by this window. Tell Claude: "backup taken".' -ForegroundColor Green
  Write-Host "Backup:  $dump"
  Write-Host "Counts:  $before"
  Write-Host "         $after"
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  foreach ($k in 'PGHOST','PGPORT','PGUSER','PGPASSWORD','PGDATABASE','PGSSLMODE','PGSSL','BP_OUT','PGADDR') { Remove-Item "Env:$k" -ErrorAction SilentlyContinue }
}
