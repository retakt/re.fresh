#!/bin/bash
# ============================================================================
# Stop MCP Server Script
# Stops the AI tools status MCP server
# ============================================================================

echo "============================================================================"
echo "  Stopping MCP Server"
echo "============================================================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# Check if PID file exists
if [ ! -f "logs/mcp-server.pid" ]; then
    echo "⚠ No PID file found (logs/mcp-server.pid)"
    echo ""
    
    # Check if something is running on port 3002
    if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠ But something is running on port 3002"
        PID=$(lsof -Pi :3002 -sTCP:LISTEN -t)
        echo "  PID: $PID"
        echo ""
        read -p "Kill this process? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill $PID
            echo "✓ Process killed"
        else
            echo "Aborted"
        fi
    else
        echo "✓ No MCP server running"
    fi
    exit 0
fi

# Read PID from file
MCP_PID=$(cat logs/mcp-server.pid)

# Check if process is running
if ps -p $MCP_PID > /dev/null 2>&1; then
    echo "▶ Stopping MCP Server (PID: $MCP_PID)..."
    kill $MCP_PID
    
    # Wait for process to stop
    sleep 2
    
    # Verify it stopped
    if ps -p $MCP_PID > /dev/null 2>&1; then
        echo "⚠ Process still running, forcing kill..."
        kill -9 $MCP_PID
        sleep 1
    fi
    
    if ps -p $MCP_PID > /dev/null 2>&1; then
        echo "✗ Failed to stop process"
        exit 1
    else
        echo "✓ MCP Server stopped"
        rm logs/mcp-server.pid
    fi
else
    echo "⚠ Process $MCP_PID is not running"
    rm logs/mcp-server.pid
    echo "✓ Cleaned up PID file"
fi

echo ""
echo "============================================================================"
echo "  MCP Server Stopped"
echo "============================================================================"
echo ""
