@echo off
echo Launching Zoom Meeting as Host...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0auto_breakout.ps1"
if %errorlevel% neq 0 (
    echo SCRIPT FAILED. See errors above.
    pause
) else (
    echo Automation script finished successfully.
    timeout /t 5
)
