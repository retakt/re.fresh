#!/bin/bash
# System Health Check Script
# Monitors services, system resources, and network connectivity

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}================================================================${NC}"
echo -e "${BOLD}${CYAN}  SYSTEM HEALTH CHECK - $(hostname)${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "${GRAY}Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')${NC}"
echo -e "${GRAY}Uptime: $(uptime -p 2>/dev/null || echo 'N/A')${NC}"
echo ""
echo -e "${CYAN}----------------------------------------------------------------${NC}"
echo -e "${BOLD}  SERVICE HEALTH STATUS${NC}"
echo -e "${CYAN}----------------------------------------------------------------${NC}"

# Function to check service with detailed timing
check_service() {
    local name="$1"
    local url="$2"
    local timeout="$3"
    
    start_time=$(date +%s%3N)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null)
    curl_exit=$?
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    if [ $curl_exit -eq 0 ] && [ "$http_code" = "200" ]; then
        if [ "$response_time" -lt 100 ]; then
            printf "  ● %-25s READY   %5dms  HTTP %s\n" "$name" "$response_time" "$http_code"
        elif [ "$response_time" -lt 500 ]; then
            printf "  ● %-25s READY   %5dms  HTTP %s\n" "$name" "$response_time" "$http_code"
        elif [ "$response_time" -lt 1000 ]; then
            printf "  ● %-25s SLOW    %5dms  HTTP %s\n" "$name" "$response_time" "$http_code"
        elif [ "$response_time" -lt 2000 ]; then
            printf "  ● %-25s SLOW    %5dms  HTTP %s\n" "$name" "$response_time" "$http_code"
        else
            printf "  ● %-25s SLOW    %5dms  HTTP %s\n" "$name" "$response_time" "$http_code"
        fi
    elif [ $curl_exit -eq 0 ] && [ "$http_code" != "000" ]; then
        printf "  ● %-25s WARN    %5dms  HTTP %s\n" "$name" "$response_time" "$http_code"
    else
        printf "  ● %-25s DOWN    timeout  Connection Failed\n" "$name"
    fi
}

echo ""
echo "[AI & ML Services]"
check_service "AI Model (Ollama)" "https://chat-api.retakt.cc/api/tags" 5
check_service "Web Search (SearXNG)" "https://search-api.retakt.cc/search?q=test&format=json" 5

echo ""
echo "[External APIs]"
check_service "Weather API" "https://wttr.in/test?format=j1" 6
check_service "Exchange Rate API" "https://open.er-api.com/v6/latest/USD" 6

echo ""
echo "[Application Services]"
check_service "YouTube Backend" "https://yt.retakt.cc/api/health" 5
check_service "Open Terminal" "https://tmux.retakt.cc/api/config" 3

echo ""
echo "----------------------------------------------------------------"
echo "  SYSTEM RESOURCES"
echo "----------------------------------------------------------------"

# Memory info
if command -v free >/dev/null 2>&1; then
    mem_used=$(free -m | awk 'NR==2{print $3}')
    mem_total=$(free -m | awk 'NR==2{print $2}')
    mem_percent=$(awk "BEGIN {printf \"%.1f\", ($mem_used/$mem_total)*100}")
    printf "  Memory: %sMB / %sMB (%s%% used)\n" "$mem_used" "$mem_total" "$mem_percent"
fi

# Disk info
if command -v df >/dev/null 2>&1; then
    df -h / | awk 'NR==2{printf "  Disk: %s / %s (%s used)\n", $3, $2, $5}'
fi

# Load average
if [ -f /proc/loadavg ]; then
    cat /proc/loadavg | awk '{printf "  Load Average: %.2f, %.2f, %.2f (1m, 5m, 15m)\n", $1, $2, $3}'
fi

# Process count
if command -v ps >/dev/null 2>&1; then
    proc_count=$(ps aux | wc -l)
    printf "  Processes: %s running\n" "$proc_count"
fi

echo ""
echo "----------------------------------------------------------------"
echo "  NETWORK DIAGNOSTICS"
echo "----------------------------------------------------------------"

# DNS check
dns_start=$(date +%s%3N)
if nslookup google.com >/dev/null 2>&1; then
    dns_end=$(date +%s%3N)
    dns_time=$((dns_end - dns_start))
    printf "  DNS Resolution: OK (%sms)\n" "$dns_time"
else
    echo "  DNS Resolution: FAILED"
fi

# Internet connectivity
ping_start=$(date +%s%3N)
if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
    ping_end=$(date +%s%3N)
    ping_time=$((ping_end - ping_start))
    printf "  Internet: Connected (ping: %sms)\n" "$ping_time"
else
    echo "  Internet: No connectivity"
fi

echo ""
echo "================================================================"
echo "  Check completed at $(date '+%H:%M:%S')"
echo "================================================================"
