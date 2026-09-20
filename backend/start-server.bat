@echo off
title Smart QR Maintenance - Backend
cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies for the first time, please wait...
    npm install
)

echo.
echo Starting server... open http://localhost:4000 in your browser once it starts.
echo Keep this window open while using the site. Close it to stop the server.
echo.
npm start

pause
