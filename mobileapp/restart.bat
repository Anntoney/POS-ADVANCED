@echo off
echo Stopping any running Metro bundlers...
taskkill /F /IM node.exe /T >nul 2>&1

echo Clearing Expo cache...
if exist .expo (
    rmdir /s /q .expo
)
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
)

echo Starting Expo with cleared cache...
echo.
echo Make sure you're in the mobileapp directory!
echo.

call npm start -- --reset-cache
