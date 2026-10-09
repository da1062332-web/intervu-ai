@echo off
title Qloax 200-Candidate Coordinated Load Test with Live UI
echo ================================================================================
echo   STARTING 200-CANDIDATE LOAD TEST WITH LIVE CANDIDATE UI (HEADED CHROME)
echo ================================================================================
echo Launching:
echo   1. Interactive Google Chrome browser showing real candidate CBT exam
echo   2. Background Grafana k6 load test simulating 200 candidates on AWS Judge0
echo.
echo NOTE: Google Chrome will pop up in front on your desktop and stay visible
echo       the ENTIRE TIME k6 runs. You can also click Chrome on your Windows taskbar.
echo ================================================================================
echo.
node load-tests/run-coordinated-ui-loadtest.js --headless false --candidates 200 --vus 15
pause
