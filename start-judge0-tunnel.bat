@echo off
title Judge0 Ngrok Tunnel (intervu-ai)
echo ========================================================
echo   Starting Judge0 Tunnel with Static Domain
echo   Domain: https://marbled-fifty-unraveled.ngrok-free.dev
echo   Target: http://localhost:2358
echo ========================================================
echo.
npx ngrok http --domain=marbled-fifty-unraveled.ngrok-free.dev 2358
pause
