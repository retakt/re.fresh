#!/bin/bash

# Stop AI Monitor
PID_FILE="logs/ai-monitor.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "AI Monitor is not running (no PID file found)"
    exit 0
fi

PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping AI Monitor (PID: $PID)..."
    kill "$PID"
    sleep 2
    
    if kill -0 "$PID" 2>/dev/null; then
        echo "Force killing AI Monitor..."
        kill -9 "$PID"
    fi
    
    rm -f "$PID_FILE"
    echo "AI Monitor stopped"
else
    echo "AI Monitor is not running"
    rm -f "$PID_FILE"
fi