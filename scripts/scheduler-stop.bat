@echo off
taskkill /fi "WINDOWTITLE eq Trend MCP Scheduler*" /f >nul 2>&1
if exist "c:\work\trend-mcp\config\scheduler.pid" del "c:\work\trend-mcp\config\scheduler.pid"
echo Scheduler stopped.
