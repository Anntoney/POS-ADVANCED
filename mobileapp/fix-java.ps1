# Quick Fix Script for Java Version Issue
# This script helps you use JDK 17 for the build

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Java Version Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current Java version
Write-Host "Current Java version:" -ForegroundColor Yellow
java -version 2>&1 | Select-Object -First 1
Write-Host ""

# Common JDK 17 installation paths
$possiblePaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot",
    "C:\Program Files\Eclipse Adoptium\jdk-17",
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\AdoptOpenJDK\jdk-17",
    "C:\Program Files\Microsoft\jdk-17"
)

$jdk17Path = $null

# Try to find JDK 17
Write-Host "Searching for JDK 17..." -ForegroundColor Yellow
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $jdk17Path = $path
        Write-Host "Found JDK 17 at: $path" -ForegroundColor Green
        break
    }
}

if (-not $jdk17Path) {
    Write-Host "JDK 17 not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install JDK 17:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://adoptium.net/temurin/releases/" -ForegroundColor White
    Write-Host "2. Select: Version 17 (LTS), Windows, x64, JDK" -ForegroundColor White
    Write-Host "3. Download and install" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Or manually set JAVA_HOME:" -ForegroundColor Yellow
    Write-Host '  $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"' -ForegroundColor White
    Write-Host '  $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"' -ForegroundColor White
    exit 1
}

# Set JAVA_HOME for this session
$env:JAVA_HOME = $jdk17Path
$env:PATH = "$jdk17Path\bin;$env:PATH"

Write-Host ""
Write-Host "Switched to JDK 17 for this session" -ForegroundColor Green
Write-Host ""
Write-Host "New Java version:" -ForegroundColor Yellow
java -version 2>&1 | Select-Object -First 1
Write-Host ""
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "You can now build your APK:" -ForegroundColor Green
Write-Host "  cd android" -ForegroundColor White
Write-Host "  .\gradlew clean" -ForegroundColor White
Write-Host "  .\gradlew assembleRelease" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
