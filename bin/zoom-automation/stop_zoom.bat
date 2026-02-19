@echo off
echo Shutting down Zoom Meeting...
taskkill /F /IM Zoom.exe /T
echo Zoom has been closed.
timeout /t 5
