@echo off
title Akhil Enterprises Billing App
echo Starting Akhil Enterprises Tyre Shop Billing...

:: Check if backend is running on 8080, if not start it
powershell -Command "$c = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue; if (-not $c) { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo Starting Spring Boot Backend...
    start "Backend Service" /min cmd /c ".\mvnw.cmd spring-boot:run"
    timeout /t 4 /nobreak >nul
)

:: Check if frontend is running on 5173, if not start it
powershell -Command "$c = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue; if (-not $c) { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo Starting Frontend Server...
    start "Frontend UI" /min cmd /c "cd frontend && npm run dev"
    timeout /t 3 /nobreak >nul
)

:: Launch standalone desktop app window (starts maximized, restores to 1600x1000)
where msedge >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start msedge --app=http://localhost:5173 --start-maximized --window-size=1600,1000
) else (
    start chrome --app=http://localhost:5173 --start-maximized --window-size=1600,1000
)

exit
