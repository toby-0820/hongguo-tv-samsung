param(
    [Parameter(Mandatory=$true)][string]$TvIP,
    [Parameter(Mandatory=$true)][string]$InstallerPath,
    [Parameter(Mandatory=$true)][string]$ProfileDir
)
$ErrorActionPreference = 'Stop'
$repoPath = Split-Path $PSScriptRoot -Parent
$packagePath = Join-Path $repoPath 'dist/HongguoStandalone-0.3.20-unsigned.wgt'
if (!(Test-Path -LiteralPath $InstallerPath -PathType Leaf)) { throw 'InstallerPath must point to your Apps2Samsung CLI executable.' }
if (!(Test-Path -LiteralPath $ProfileDir -PathType Container)) { throw 'ProfileDir must point to your own Samsung signing profile directory.' }
if (!(Test-Path -LiteralPath $packagePath)) { & (Join-Path $PSScriptRoot 'Package.ps1') }
& $InstallerPath install $packagePath --tv $TvIP --data-dir $ProfileDir --no-browser
if ($LASTEXITCODE -ne 0) { throw 'TV installation failed.' }
Write-Host 'Installed using your own signing profile.'
