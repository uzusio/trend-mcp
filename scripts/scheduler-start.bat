@echo off
cd /d "%~dp0.."
start /min "Trend MCP Scheduler" node dist\scheduler.js
