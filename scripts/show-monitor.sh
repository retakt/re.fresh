#!/bin/bash

# AI Monitor Log Display - Shows latest monitoring logs
LOG_FILE="logs/ai-monitor.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "Monitor log not found. Is the AI monitor running?"
    echo "Start it with: ./scripts/start-monitor.sh"
    exit 1
fi

echo "=== AI Tools Monitor - Latest Status ==="
echo ""

# Show last 50 lines of the log
tail -n 50 "$LOG_FILE"

echo ""
echo "=== Monitor Info ==="
echo "Log file: $LOG_FILE"
echo "Last updated: $(stat -c %y "$LOG_FILE" 2>/dev/null || stat -f %Sm "$LOG_FILE" 2>/dev/null || echo 'Unknown')"
echo "Log size: $(du -h "$LOG_FILE" 2>/dev/null | cut -f1 || echo 'Unknown')"

# Check if monitor is running
PID_FILE="logs/ai-monitor.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Monitor status: RUNNING (PID: $PID)"
    else
        echo "Monitor status: STOPPED"
    fi
else
    echo "Monitor status: NOT STARTED"
fi