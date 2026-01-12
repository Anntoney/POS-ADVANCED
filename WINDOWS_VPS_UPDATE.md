# Windows VPS Update Guide

## Quick Update Commands

### Step 1: Navigate to Project Directory
```powershell
cd D:\POS\POS-ADVANCED
```

### Step 2: Pull Latest Changes from GitHub
```powershell
git pull origin main
```

### Step 3: Install/Update Dependencies (if needed)
```powershell
npm install
```

### Step 4: Build the Application (for production)
```powershell
npm run build
```

### Step 5: Restart the Application

#### Option A: If using PM2 (Node.js Process Manager)
```powershell
# Stop the application
pm2 stop pos-advanced

# Start the application
pm2 start pos-advanced

# Or restart directly
pm2 restart pos-advanced

# Check status
pm2 status
```

#### Option B: If using Windows Service (NSSM)
```powershell
# Restart the service
net stop "POS-Advanced"
net start "POS-Advanced"

# Or using NSSM
nssm restart "POS-Advanced"
```

#### Option C: If running manually with npm
```powershell
# Stop: Press Ctrl+C in the terminal running the app
# Then start again:
npm run start
# Or for development:
npm run dev
```

#### Option D: If using IIS with Node.js
```powershell
# Restart IIS application pool
iisreset
# Or restart specific app pool:
Restart-WebAppPool -Name "POS-Advanced"
```

## Complete Update Script

Create a file `update.ps1` in your project root:

```powershell
# update.ps1 - Windows VPS Update Script

Write-Host "Starting update process..." -ForegroundColor Green

# Navigate to project directory
Set-Location "D:\POS\POS-ADVANCED"

# Pull latest changes
Write-Host "Pulling latest changes from GitHub..." -ForegroundColor Yellow
git pull origin main

# Check if package.json changed
$packageChanged = git diff HEAD@{1} HEAD --name-only | Select-String "package.json"
if ($packageChanged -or !(Test-Path "node_modules")) {
    Write-Host "Installing/updating dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run build

# Restart application (choose the method you're using)

# For PM2:
Write-Host "Restarting with PM2..." -ForegroundColor Yellow
pm2 restart pos-advanced

# OR for Windows Service:
# net stop "POS-Advanced"
# net start "POS-Advanced"

# OR for manual npm:
# Get-Process node | Where-Object {$_.Path -like "*POS-ADVANCED*"} | Stop-Process -Force
# Start-Process npm -ArgumentList "run", "start" -WorkingDirectory "D:\POS\POS-ADVANCED"

Write-Host "Update complete!" -ForegroundColor Green
```

## Usage

### Run the update script:
```powershell
.\update.ps1
```

### Or run commands manually:
```powershell
cd D:\POS\POS-ADVANCED
git pull origin main
npm install
npm run build
pm2 restart pos-advanced  # or your restart method
```

## Troubleshooting

### If git pull fails:
```powershell
# Check current branch
git branch

# If you have local changes, stash them first
git stash
git pull origin main
git stash pop
```

### If build fails:
```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Rebuild
npm run build
```

### If application won't start:
```powershell
# Check if port is already in use
netstat -ano | findstr :3000

# Kill process if needed (replace PID with actual process ID)
taskkill /PID <PID> /F

# Then restart
pm2 restart pos-advanced
```

## Check Application Status

```powershell
# For PM2
pm2 status
pm2 logs pos-advanced

# For Windows Service
Get-Service "POS-Advanced"

# Check if app is responding
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing
```
