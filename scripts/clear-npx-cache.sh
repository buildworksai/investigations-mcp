#!/bin/bash

# Clear npx cache to resolve ENOTEMPTY errors
# This script helps resolve issues when npx can't update packages due to directory conflicts

echo "Clearing npm and npx cache..."

# Clear npm cache
npm cache clean --force

# Remove npx cache directory
if [ -d "$HOME/.npm/_npx" ]; then
    echo "Removing npx cache directory..."
    rm -rf "$HOME/.npm/_npx"
    echo "npx cache cleared successfully"
else
    echo "No npx cache directory found"
fi

echo "Cache clearing complete. You can now run:"
echo "  npx buildworks-ai-investigations-mcp --version"
