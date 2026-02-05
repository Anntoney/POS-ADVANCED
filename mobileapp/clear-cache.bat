@echo off
echo.
echo ========================================
echo   Clearing Expo Cache (Windows)
echo ========================================
echo.

echo Deleting .expo folder...
if exist .expo (
    rmdir /s /q .expo
    echo   ✓ .expo deleted
) else (
    echo   - .expo folder not found
)

echo.
echo Deleting node_modules\.cache folder...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo   ✓ node_modules\.cache deleted
) else (
    echo   - node_modules\.cache folder not found
)

echo.
echo ========================================
echo   Cache cleared successfully!
echo ========================================
echo.
echo Now starting Expo with --clear flag...
echo.

npx expo start --clear
