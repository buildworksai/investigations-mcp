#!/bin/bash

# Setup script for Investigations MCP Tools

echo "🔍 Setting up Investigations MCP Tools..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data reports

# Set permissions
chmod +x dist/index.js

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the MCP server:"
echo "   npm start"
echo ""
echo "🐳 To run in Docker:"
echo "   npm run docker:build"
echo "   npm run docker:run"
echo ""
echo "🔧 For development:"
echo "   npm run dev"
