@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║          🎹 microKORG Custom Patch Library Uploader                    ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

REM Check if Bun is installed
bun --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Bun not found! Install from https://bun.sh
    exit /b 1
)

REM Check if files exist
if not exist "cli\upload-with-erriez.cjs" (
    echo ❌ Uploader not found: cli\upload-with-erriez.cjs
    exit /b 1
)

REM Find latest library file
setlocal enabledelayedexpansion
set "latestfile="
for /f "delims=" %%F in ('dir /b "patches\custom-library-*.syx" 2^>nul ^| sort /r') do (
    set "latestfile=%%F"
    goto :found_file
)
:found_file
if "!latestfile!"=="" (
    echo ❌ No library file found in patches\
    echo    Run: bun run cli/create-custom-library-from-factory.cjs
    exit /b 1
)

REM Show file info
echo 📦 Library File:
echo    File: !latestfile!
for %%A in ("patches\!latestfile!") do echo    Size: %%~zA bytes
echo.

REM Run the uploader
bun run cli\upload-with-erriez.cjs

endlocal
