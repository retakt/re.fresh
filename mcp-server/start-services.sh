#!/bin/bash

# Start AI Services
# This starts both the MCP server and HTTP API for AI tools status

echo "Starting AI Services..."
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting services:"
echo "  - MCP Server (stdio) for Kiro integration"
echo "  - HTTP API Server (port 3001) for chat model"
echo ""

# Start both services using concurrently
if command -v npx &> /dev/null; then
    npx concurrently \
        --names "MCP,API" \
        --prefix-colors "blue,green" \
        "node ai-mcp-server.js" \
        "node ai-status-api.js"
else
    echo "Warning: npx not found, starting API server only..."
    echo "To use MCP server, install npm and run: npx concurrently \"node ai-mcp-server.js\" \"node ai-status-api.js\""
    node ai-status-api.js
fi