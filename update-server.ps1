# Windows VPS Update Script for POS-ADVANCED
# Run this script to update and restart the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  POS-ADVANCED Server Update Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to project directory
Write-Host "[1/5] Navigating to project directory..." -ForegroundColor Yellow
Set-Location "C:\Users\Administrator\Documents\pos\POS-ADVANCED"

# Step 2: Pull latest changes
Write-Host "[2/5] Pulling latest changes from GitHub..." -ForegroundColor Yellow
$pullResult = git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to pull changes from GitHub" -ForegroundColor Red
    exit 1
}
Write-Host "Pull result: $pullResult" -ForegroundColor Green

# Step 3: Check if package.json changed
Write-Host "[3/5] Checking for dependency changes..." -ForegroundColor Yellow
$packageChanged = git diff HEAD@{1} HEAD --name-only | Select-String "package.json"
if ($packageChanged -or !(Test-Path "node_modules")) {
    Write-Host "Installing/updating dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No dependency changes detected, skipping npm install" -ForegroundColor Green
}

# Step 4: Build the application
Write-Host "[4/5] Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Build completed successfully!" -ForegroundColor Green

# Step 5: Restart with PM2
Write-Host "[5/5] Restarting application with PM2..." -ForegroundColor Yellow
pm2 restart pos-advanced --update-env
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: PM2 restart failed, trying to start instead..." -ForegroundColor Yellow
    pm2 start pos-advanced --update-env
}

# Show status
Write-Host ""
Write-Host "Checking PM2 status..." -ForegroundColor Yellow
pm2 status

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs, run: pm2 logs pos-advanced" -ForegroundColor Cyan
Write-Host "To monitor, run: pm2 monit" -ForegroundColor Cyan
