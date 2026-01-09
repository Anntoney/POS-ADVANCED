#!/bin/bash
# Bash script to restart Expo with cleared cache

echo "Stopping any running Metro bundlers..."
pkill -f "expo start" || true
pkill -f "metro" || true

echo "Clearing Expo cache..."
rm -rf .expo
rm -rf node_modules/.cache

echo "Starting Expo with cleared cache..."
echo ""
echo "Make sure you're in the mobileapp directory!"
echo ""

npm start -- --reset-cache
