#!/bin/bash
# ============================================================================
# Start MCP Server Script (Cross-platform)
# ============================================================================

set -e

PORT=3002

echo "============================================================================"
echo "  Starting MCP Server (Port $PORT)"
echo "============================================================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# Create logs directory
mkdir -p logs

# ----------------------------------------------------------------------------
# Function: check if port is in use (cross-platform)
# ----------------------------------------------------------------------------
is_port_in_use() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1
        return $?
    else
        # Windows fallback using netstat
        netstat -ano | grep ":$PORT" | grep LISTENING >/dev/null 2>&1
        return $?
    fi
}

# ----------------------------------------------------------------------------
# Function: kill process on port (cross-platform)
# ----------------------------------------------------------------------------
kill_port() {
    echo "⚠ Port $PORT is already in use"

    if command -v lsof >/dev/null 2>&1; then
        PID=$(lsof -ti :$PORT)
        if [ -n "$PID" ]; then
            echo "▶ Killing process $PID..."
            kill -9 $PID
        fi
    else
        PID=$(netstat -ano | grep ":$PORT" | grep LISTENING | awk '{print $NF}')
        if [ -n "$PID" ]; then
            echo "▶ Killing process $PID (Windows)..."
            cmd.exe /c "taskkill /PID $PID /F" >/dev/null 2>&1
        fi
    fi

    sleep 2
}

# ----------------------------------------------------------------------------
# Check if port is already in use
# ----------------------------------------------------------------------------
if is_port_in_use; then
    kill_port
fi

# Navigate to mcp-server directory
cd mcp-server

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "▶ Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Start the server
echo "▶ Starting MCP API server on port $PORT..."
nohup node ai-status-api.js > "$PROJECT_ROOT/logs/mcp-server.log" 2>&1 &
MCP_PID=$!
echo $MCP_PID > "$PROJECT_ROOT/logs/mcp-server.pid"

# Wait for server to start
sleep 3

# Verify it started
if is_port_in_use; then
    echo "✓ MCP Server started successfully"
    echo ""
    echo "  PID:      $MCP_PID"
    echo "  Port:     $PORT"
    echo "  Logs:     logs/mcp-server.log"
    echo "  PID File: logs/mcp-server.pid"
    echo ""

    # Test the server
    echo "▶ Testing server..."
    if curl -s http://localhost:$PORT/status > /dev/null 2>&1; then
        echo "✓ Server is responding"
        echo ""
        echo "Status preview:"
        curl -s http://localhost:$PORT/status | head -n 10
    else
        echo "⚠ Server started but not responding yet"
        echo "  Check logs: tail -f logs/mcp-server.log"
    fi

    echo ""
    echo "============================================================================"
    echo "  MCP Server Running"
    echo "============================================================================"
    echo ""
else
    echo "✗ Failed to start MCP Server"
    echo ""
    echo "Check logs:"
    echo "  tail -f logs/mcp-server.log"
    echo ""
    exit 1
fi