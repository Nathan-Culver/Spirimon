@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Spirimon needs Node.js 20 or newer. Install it from https://nodejs.org then run this file again.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4317"
node companion.mjs
pause
