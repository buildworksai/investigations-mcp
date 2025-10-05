#!/bin/bash

# Stress Test Runner for Investigations MCP
# This script runs the stress test with proper environment setup

set -e

echo "🚀 Starting Investigations MCP Stress Test"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Set environment variables for stress testing
export NODE_ENV=test
export INVESTIGATIONS_STORAGE_PATH="./.investigations-mcp-stress-test"
export INVESTIGATIONS_MAX_COUNT=100
export INVESTIGATIONS_LOG_LEVEL=info
export INVESTIGATIONS_ENABLE_VALIDATION=true
export INVESTIGATIONS_ENABLE_SECURITY=true
export INVESTIGATIONS_ENABLE_AUDIT=true

# Create stress test storage directory
echo "📁 Setting up stress test environment..."
mkdir -p ./.investigations-mcp-stress-test

# Run the stress test
echo "🧪 Running stress test..."
echo "This will create 60-70 heavy investigations with extensive data"
echo "Press Ctrl+C to stop the test early"
echo ""

# Run with increased memory limit for heavy operations
node --max-old-space-size=4096 --expose-gc dist/scripts/stress-test.js

echo ""
echo "✅ Stress test completed!"
echo "📊 Check stress-test-report.json for detailed results"
