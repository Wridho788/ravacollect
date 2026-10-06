param(
  [string]$Device = 'RR8R20BRP4P',
  [string]$Flow = '.maestro',
  [string]$AppId = 'com.ravacollect.e2e'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
  $deviceState = & adb -s $Device get-state 2>&1
  if ($LASTEXITCODE -ne 0 -or "$deviceState".Trim() -ne 'device') { throw "Device $Device is not available. Connect and unlock the physical test device." }
  if (-not (Test-Path -LiteralPath $Flow)) { throw "Flow not found: $Flow" }
  $runDirectory = Join-Path $projectRoot ('artifacts\maestro-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Path $runDirectory | Out-Null
  & maestro --device $Device test $Flow -e "APP_ID=$AppId" --format JUNIT --output "$runDirectory\junit.xml" --debug-output "$runDirectory\debug" --test-output-dir "$runDirectory\screenshots" 2>&1 | Tee-Object -FilePath "$runDirectory\console.log"
  $testExit = $LASTEXITCODE
  Write-Output "Evidence: $runDirectory"
  if ($testExit -ne 0) { throw "Maestro failed with exit code $testExit" }
} finally { Pop-Location }
