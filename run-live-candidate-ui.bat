@echo off
title Qloax Candidate Assessment - Live Headed Browser
echo ================================================================================
echo   STARTING LIVE CANDIDATE ASSESSMENT UI (HEADED GOOGLE CHROME)
echo ================================================================================
echo Launching Google Chrome directly on your desktop...
echo NOTE: If Antigravity IDE is maximized full-screen, Google Chrome will pop up
echo       in front. You can also click the Chrome icon in your taskbar or press Alt+Tab.
echo.
echo You will see:
echo   1. Candidate registration and CBT section navigation
echo   2. Monaco Editor loading with Java solution
echo   3. 4 live debugging runs clicking "Run Code" on AWS Judge0
echo   4. Submit Solution and final exam submission
echo   5. Browser stays open for 90 seconds for your review
echo ================================================================================
echo.
node load-tests/candidate-ui-live-runner.js --headless false --runs 4 --hold 90
pause
