@echo off
echo Configuring Zoom Automation Tasks...

:: Update Launch Task to 7:45 AM Weekdays
schtasks /create /tn "ZoomAutoLaunch" /tr "C:\Users\DENNIS\zoom-automation\auto_launch_zoom.bat" /sc weekly /d MON,TUE,WED,THU,FRI /st 07:45 /f

:: Create Shutdown Task for 5:30 PM Weekdays
schtasks /create /tn "ZoomAutoShutdown" /tr "C:\Users\DENNIS\zoom-automation\stop_zoom.bat" /sc weekly /d MON,TUE,WED,THU,FRI /st 17:30 /f

echo.
echo Setup Complete!
echo [1] Zoom will now START at 7:45 AM (Mon-Fri)
echo [2] Zoom will now STOP at 5:30 PM (Mon-Fri)
echo.
pause
