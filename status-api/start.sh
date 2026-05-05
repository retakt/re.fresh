#!/bin/bash
# Start AI Status API Server

cd "$(dirname "$0")"

echo "================================================================"
echo "  Starting AI Status API Server"
echo "================================================================"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

# Check if already running
if [ -f "../logs/status-api.pid" ]; then
  PID=$(cat ../logs/status-api.pid)
  if kill -0 "$PID" 2>/dev/null; then
    echo "Status API is already running (PID: $PID)"
    exit 0
  fi
fi

# Start server in background
nohup node server.js > ../logs/status-api.log 2>&1 &
PID=$!
echo $PID > ../logs/status-api.pid

sleep 2

# Verify it started
if kill -0 "$PID" 2>/dev/null; then
  echo "Status API started successfully (PID: $PID)"
  echo "Port: 3002"
  echo "Logs: logs/status-api.log"
  echo ""
  echo "Test it:"
  echo "  curl http://localhost:3002/status"
else
  echo "Failed to start Status API"
  exit 1
fi
