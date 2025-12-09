Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\work\trend-mcp"
WshShell.Run "cmd /c npm run post", 0, False
