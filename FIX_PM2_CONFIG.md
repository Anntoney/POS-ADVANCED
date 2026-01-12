# Fix PM2 Configuration for Windows VPS

## Problem
PM2 is trying to run `npm.cmd` as a Node.js script, which causes a syntax error.

## Solution

### Step 1: Stop and Delete Current PM2 Process
```powershell
cd C:\Users\Administrator\Documents\pos\POS-ADVANCED

# Stop the current process
pm2 stop pos-advanced

# Delete it
pm2 delete pos-advanced
```

### Step 2: Reconfigure PM2 with Correct Command

**Option A: Using ecosystem.config.js (Recommended)**
```powershell
# The ecosystem.config.js file has been created
# Just start PM2 with the config file:
pm2 start ecosystem.config.js
```

**Option B: Direct Command (Alternative)**
```powershell
# Start PM2 with npm run start
pm2 start npm --name "pos-advanced" -- run start
```

**Option C: Using npx (Alternative)**
```powershell
pm2 start "npx next start" --name "pos-advanced"
```

### Step 3: Save PM2 Configuration
```powershell
# Save the current PM2 process list
pm2 save

# Setup PM2 to start on system reboot (optional)
pm2 startup
```

### Step 4: Verify It's Running
```powershell
# Check status
pm2 status

# View logs
pm2 logs pos-advanced --lines 50

# Monitor in real-time
pm2 monit
```

## Complete Fix Script

Run this complete script to fix PM2:

```powershell
cd C:\Users\Administrator\Documents\pos\POS-ADVANCED

# Stop and delete old process
pm2 stop pos-advanced
pm2 delete pos-advanced

# Start with correct configuration
pm2 start npm --name "pos-advanced" -- run start

# Save configuration
pm2 save

# Check status
pm2 status
pm2 logs pos-advanced --lines 20
```

## After Fixing PM2 - Update Server

Once PM2 is fixed, run the update process:

```powershell
cd C:\Users\Administrator\Documents\pos\POS-ADVANCED

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Build the application
npm run build

# Restart PM2
pm2 restart pos-advanced
```

## Troubleshooting

### If PM2 still fails:
```powershell
# Check if Next.js is built
Test-Path .next

# If .next doesn't exist, build first:
npm run build

# Then start PM2
pm2 start npm --name "pos-advanced" -- run start
```

### If port 3000 is already in use:
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Then restart PM2
pm2 restart pos-advanced
```
