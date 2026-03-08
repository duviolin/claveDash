param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$dashDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backDir = Join-Path $dashDir "..\claveBack"

if (-not (Test-Path (Join-Path $dashDir "package.json"))) {
  Write-Host "Erro: package.json do dashboard nao encontrado em $dashDir" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path (Join-Path $backDir "package.json"))) {
  Write-Host "Erro: package.json do backend nao encontrado em $backDir" -ForegroundColor Red
  exit 1
}

Write-Host "Dashboard: $dashDir"
Write-Host "Backend:   $backDir"

if ($DryRun) {
  Write-Host ""
  Write-Host "[DryRun] Comando que seria executado:"
  Write-Host "npm run dev:all"
  exit 0
}

Push-Location $dashDir
try {
  npm run dev:all
}
finally {
  Pop-Location
}
