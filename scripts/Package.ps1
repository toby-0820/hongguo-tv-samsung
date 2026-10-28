$ErrorActionPreference = 'Stop'
$repoPath = Split-Path $PSScriptRoot -Parent
$sourcePath = Join-Path $repoPath 'build/hongguo-standalone'
if (!(Test-Path -LiteralPath (Join-Path $sourcePath 'config.xml'))) { throw 'Run npm run build first.' }
$distPath = Join-Path $repoPath 'dist'
New-Item -ItemType Directory -Path $distPath -Force | Out-Null
$archivePath = Join-Path $distPath 'HongguoStandalone-0.3.20-unsigned.zip'
$packagePath = Join-Path $distPath 'HongguoStandalone-0.3.20-unsigned.wgt'
Compress-Archive -Path (Join-Path $sourcePath '*') -DestinationPath $archivePath -Force
Copy-Item -LiteralPath $archivePath -Destination $packagePath -Force
Write-Host "Local unsigned package: $packagePath"
Write-Host 'Sign using your own Samsung developer/device profile before installation.'
