@echo off
cd /d "%~dp0.."
taskkill /fi "WINDOWTITLE eq Trend MCP Scheduler*" /f >nul 2>&1
if exist "config\scheduler.pid" del "config\scheduler.pid"
echo Scheduler stopped.
