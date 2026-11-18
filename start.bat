@echo off
rem One-click launcher: starts a local web server and opens the tracker.
rem Keeps this window open while the server runs; close it to stop.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel%==0 (
  node "%~dp0tools\serve.mjs"
  goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:8123/
  python -m http.server 8123 --bind 127.0.0.1
  goto :end
)

echo.
echo   Node.js or Python is required to run the local server.
echo   Install Node.js from https://nodejs.org, then run this file again.
echo.
pause

:end
endlocal
