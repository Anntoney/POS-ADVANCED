# Script to set JAVA_HOME permanently
# Run this script as Administrator

Write-Host "Setting JAVA_HOME permanently..." -ForegroundColor Cyan

$jdkPath = "C:\Program Files\Java\jdk-17"

# Check if JDK exists
if (-not (Test-Path $jdkPath)) {
    Write-Host "JDK 17 not found at: $jdkPath" -ForegroundColor Red
    Write-Host "Please check your JDK installation path" -ForegroundColor Yellow
    exit 1
}

# Set JAVA_HOME system variable
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, [System.EnvironmentVariableTarget]::Machine)

# Update PATH to include JDK bin
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
$jdkBinPath = "$jdkPath\bin"

if ($currentPath -notlike "*$jdkBinPath*") {
    $newPath = "$jdkBinPath;$currentPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
    Write-Host "Added JDK bin to PATH" -ForegroundColor Green
} else {
    Write-Host "JDK bin already in PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "JAVA_HOME has been set permanently!" -ForegroundColor Green
Write-Host "JAVA_HOME = $jdkPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Close and reopen your terminal for changes to take effect" -ForegroundColor Yellow
Write-Host "Then verify with: java -version" -ForegroundColor Yellow
