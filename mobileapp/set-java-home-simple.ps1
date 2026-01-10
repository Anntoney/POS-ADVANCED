# Simple script to set JAVA_HOME using setx command
# Run PowerShell as Administrator for this to work

$jdkPath = "C:\Program Files\Java\jdk-17"

Write-Host "Setting JAVA_HOME permanently using setx..." -ForegroundColor Cyan
Write-Host "Make sure you're running PowerShell as Administrator!" -ForegroundColor Yellow
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor White
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use the GUI method instead (see SET_JAVA_HOME.md)" -ForegroundColor Cyan
    exit 1
}

# Check if JDK exists
if (-not (Test-Path $jdkPath)) {
    Write-Host "JDK 17 not found at: $jdkPath" -ForegroundColor Red
    exit 1
}

# Set JAVA_HOME using setx (requires admin for system variables)
Write-Host "Setting JAVA_HOME..." -ForegroundColor Yellow
$result = cmd /c "setx JAVA_HOME `"$jdkPath`" /M" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "JAVA_HOME set successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to set JAVA_HOME: $result" -ForegroundColor Red
}

# Update PATH
Write-Host "Updating PATH..." -ForegroundColor Yellow
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
$jdkBinPath = "$jdkPath\bin"

if ($currentPath -notlike "*$jdkBinPath*") {
    # Add to beginning of PATH
    $newPath = "$jdkBinPath;$currentPath"
    $result = cmd /c "setx PATH `"$newPath`" /M" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PATH updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to update PATH: $result" -ForegroundColor Red
    }
} else {
    Write-Host "JDK bin already in PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "JAVA_HOME has been set permanently!" -ForegroundColor Green
Write-Host "JAVA_HOME = $jdkPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Close and reopen your terminal" -ForegroundColor Yellow
Write-Host "Then verify with: java -version" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
