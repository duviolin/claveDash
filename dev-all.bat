@echo off
setlocal

set "DASH_DIR=%~dp0"
set "BACK_DIR=%DASH_DIR%..\claveBack"

if not exist "%DASH_DIR%package.json" (
  echo Erro: package.json do dashboard nao encontrado em "%DASH_DIR%"
  exit /b 1
)

if not exist "%BACK_DIR%\package.json" (
  echo Erro: package.json do backend nao encontrado em "%BACK_DIR%"
  exit /b 1
)

cd /d "%DASH_DIR%"
call npm run dev:all
