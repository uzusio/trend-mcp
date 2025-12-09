@echo off
cd /d "%~dp0.."
start /b cmd /c "npm run post >nul 2>&1"
