@echo off
setlocal

set "EDGE_PATH="
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if "%EDGE_PATH%"=="" (
    echo [ERROR] Microsoft Edge tidak ditemukan di direktori Program Files standar.
    pause
    exit /b 1
)

set "DEBUG_PORT=9222"
set "USER_DATA_DIR=%TEMP%\edge-agent-debug"

echo ========================================================
echo Membuka Microsoft Edge untuk Live Testing AI Agent
echo Port: %DEBUG_PORT%
echo Profile: %USER_DATA_DIR%
echo Executable: %EDGE_PATH%
echo ========================================================

start "" "%EDGE_PATH%" --remote-debugging-port=%DEBUG_PORT% --user-data-dir="%USER_DATA_DIR%" "http://localhost:8000"

echo Edge berhasil dibuka. AI Agent dapat terhubung via CDP port %DEBUG_PORT%.
