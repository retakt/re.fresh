#!/bin/bash
# Start Background Monitor
# Launches the background monitoring script as a daemon process

cd /workspace/host/var/www/retakt
mkdir -p logs

# Check if monitor is already running
if [ -f logs/ai-monitor.pid ]; then
  PID=$(cat logs/ai-monitor.pid)
  if kill -0 "$PID" 2>/dev/null; then
    echo "Monitor already running (PID: $PID)"
    exit 0
  fi
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start the background monitor
nohup "$SCRIPT_DIR/background-monitor.sh" > /dev/null 2>&1 &

sleep 2

# Verify it started
if [ -f logs/ai-monitor.pid ]; then
  PID=$(cat logs/ai-monitor.pid)
  if kill -0 "$PID" 2>/dev/null; then
    echo "Monitor started successfully (PID: $PID)"
    echo "Checking services every 30 seconds"
    echo "Use 'show-monitor' to view logs"
  else
    echo "Failed to start monitor"
    exit 1
  fi
else
  echo "Failed to start monitor"
  exit 1
fi
