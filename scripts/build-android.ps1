param(
  [ValidateSet('Debug', 'E2e', 'Release')][string]$Variant = 'E2e',
  [string]$Architectures = 'arm64-v8a'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $env:JAVA_HOME) { $env:JAVA_HOME = 'C:\Program Files\Java\jdk-17' }
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) { throw 'Set JAVA_HOME to JDK 17.' }
if (-not (Test-Path -LiteralPath $env:ANDROID_HOME)) { throw 'Set ANDROID_HOME to the installed SDK.' }
Push-Location (Join-Path $projectRoot 'android')
try {
  & .\gradlew.bat "assemble$Variant" "-PreactNativeArchitectures=$Architectures" --max-workers=2 --console=plain
  if ($LASTEXITCODE -ne 0) { throw "Android build failed: $LASTEXITCODE" }
} finally { Pop-Location }
