#!/bin/bash

# Start AI Monitor in background
SCRIPT_DIR="scripts"
PID_FILE="logs/ai-monitor.pid"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "AI Monitor is already running (PID: $PID)"
        exit 0
    fi
fi

echo "Starting AI Monitor..."
nohup "$SCRIPT_DIR/ai-monitor.sh" > /dev/null 2>&1 &
sleep 2

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "AI Monitor started successfully (PID: $PID)"
    else
        echo "Failed to start AI Monitor"
        exit 1
    fi
else
    echo "Failed to start AI Monitor"
    exit 1
fi