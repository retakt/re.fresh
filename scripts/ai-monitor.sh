#!/bin/bash

# AI Tools 24/7 Monitor - Runs continuously and logs to file
LOG_FILE="logs/ai-monitor.log"
PID_FILE="logs/ai-monitor.pid"

# Save PID for stopping
echo $$ > "$PID_FILE"

# Function to check service with timing
check_service() {
    local name="$1"
    local url="$2"
    local timeout="$3"
    
    start_time=$(date +%s%3N)
    if curl -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
        end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        
        if [ "$response_time" -lt 200 ]; then
            status="READY"
        elif [ "$response_time" -lt 500 ]; then
            status="READY"
        elif [ "$response_time" -lt 2000 ]; then
            status="SLOW"
        else
            status="SLOW"
        fi
        echo "$(date '+%H:%M:%S') ● $name: $status (${response_time}ms)"
    else
        echo "$(date '+%H:%M:%S') ● $name: DOWN"
    fi
}

echo "AI Monitor started at $(date)" >> "$LOG_FILE"

# Main monitoring loop
while true; do
    {
        echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
        check_service "AI Model (Ollama)" "https://chat-api.retakt.cc/api/tags" 5
        check_service "Web Search (SearXNG)" "https://search-api.retakt.cc/search?q=test&format=json" 5
        check_service "Weather API" "https://wttr.in/test?format=j1" 8
        check_service "Exchange Rate API" "https://open.er-api.com/v6/latest/USD" 8
        check_service "YouTube Backend" "https://yt.retakt.cc/api/health" 5
        check_service "Local Open Terminal" "http://localhost:8001/api/config" 3
        echo ""
    } >> "$LOG_FILE"
    
    # Keep only last 1000 lines to prevent log from growing too large
    tail -n 1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
    
    sleep 30  # Check every 30 seconds
done