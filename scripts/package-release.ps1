$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

npm.cmd run prepare:release

$Package = Get-Content -Raw -Path (Join-Path $Root 'package.json') | ConvertFrom-Json
$Version = [string]$Package.version
$ReleaseRoot = Join-Path $Root 'release'
$SourceDirectory = Join-Path $ReleaseRoot "ConnectBits-v$Version-unpacked"
$ZipPath = Join-Path $ReleaseRoot "ConnectBits-v$Version.zip"

if (-not (Test-Path $SourceDirectory)) {
  throw "Release directory was not created: $SourceDirectory"
}

if (Test-Path $ZipPath) {
  Remove-Item -Force $ZipPath
}

Compress-Archive -Path (Join-Path $SourceDirectory '*') -DestinationPath $ZipPath -CompressionLevel Optimal
$Hash = (Get-FileHash -Algorithm SHA256 -Path $ZipPath).Hash.ToLowerInvariant()
Set-Content -Path "$ZipPath.sha256.txt" -Value "$Hash  $(Split-Path -Leaf $ZipPath)" -Encoding utf8

Write-Host "Created: $ZipPath"
Write-Host "SHA-256: $Hash"
