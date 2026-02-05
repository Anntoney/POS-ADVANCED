# PowerShell script to clear Expo cache

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Clearing Expo Cache (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Deleting .expo folder..." -ForegroundColor Yellow
if (Test-Path .expo) {
    Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
    Write-Host "  ✓ .expo deleted" -ForegroundColor Green
} else {
    Write-Host "  - .expo folder not found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Deleting node_modules\.cache folder..." -ForegroundColor Yellow
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
    Write-Host "  ✓ node_modules\.cache deleted" -ForegroundColor Green
} else {
    Write-Host "  - node_modules\.cache folder not found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Cache cleared successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now starting Expo with --clear flag..." -ForegroundColor Yellow
Write-Host ""

npx expo start --clear
