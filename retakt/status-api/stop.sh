#!/bin/bash
# Stop AI Status API Server

cd "$(dirname "$0")"

echo "Stopping AI Status API Server..."

if [ ! -f "../logs/status-api.pid" ]; then
  echo "Status API is not running (no PID file)"
  exit 0
fi

PID=$(cat ../logs/status-api.pid)

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  rm -f ../logs/status-api.pid
  echo "Status API stopped (PID: $PID)"
else
  rm -f ../logs/status-api.pid
  echo "Status API was not running (cleaned up PID file)"
fi
