# PowerShell script to restart Expo with cleared cache
Write-Host "Stopping any running Metro bundlers..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
if (Test-Path .expo) {
    Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
}
if (Test-Path node_modules/.cache) {
    Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
}

Write-Host "Starting Expo with cleared cache..." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure you're in the mobileapp directory!" -ForegroundColor Cyan
Write-Host ""

npm start -- --reset-cache
