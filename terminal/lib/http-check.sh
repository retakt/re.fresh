#!/bin/bash
# HTTP Health Check Utilities
# Functions for checking HTTP endpoints with timing and status codes

# Check if a URL is reachable and return status
# Usage: http_check <name> <url> <timeout>
# Returns: 0 if OK (200), 1 if down
http_check() {
  local name="$1"
  local url="$2"
  local timeout="${3:-5}"
  
  local start_time=$(date +%s%3N)
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null)
  local curl_exit=$?
  local end_time=$(date +%s%3N)
  local response_time=$((end_time - start_time))
  
  # Export results for caller to use
  export HTTP_CHECK_CODE="$http_code"
  export HTTP_CHECK_TIME="$response_time"
  export HTTP_CHECK_EXIT="$curl_exit"
  
  if [ $curl_exit -eq 0 ] && [ "$http_code" = "200" ]; then
    return 0
  else
    return 1
  fi
}

# Check and print formatted result
# Usage: http_check_print <name> <url> <timeout>
http_check_print() {
  local name="$1"
  local url="$2"
  local timeout="${3:-5}"
  
  if http_check "$name" "$url" "$timeout"; then
    if [ "$HTTP_CHECK_TIME" -lt 100 ]; then
      printf "  ● %-25s \033[1;32mREADY\033[0m   %5dms  HTTP %s\\n" "$name" "$HTTP_CHECK_TIME" "$HTTP_CHECK_CODE"
    elif [ "$HTTP_CHECK_TIME" -lt 500 ]; then
      printf "  ● %-25s \033[1;32mREADY\033[0m   %5dms  HTTP %s\\n" "$name" "$HTTP_CHECK_TIME" "$HTTP_CHECK_CODE"
    elif [ "$HTTP_CHECK_TIME" -lt 1000 ]; then
      printf "  ● %-25s \033[1;33mSLOW\033[0m    %5dms  HTTP %s\\n" "$name" "$HTTP_CHECK_TIME" "$HTTP_CHECK_CODE"
    else
      printf "  ● %-25s \033[1;33mSLOW\033[0m    %5dms  HTTP %s\\n" "$name" "$HTTP_CHECK_TIME" "$HTTP_CHECK_CODE"
    fi
  else
    if [ "$HTTP_CHECK_CODE" != "000" ] && [ "$HTTP_CHECK_EXIT" -eq 0 ]; then
      printf "  ● %-25s \033[1;33mWARN\033[0m    %5dms  HTTP %s\\n" "$name" "$HTTP_CHECK_TIME" "$HTTP_CHECK_CODE"
    else
      printf "  ● %-25s \033[1;31mDOWN\033[0m    timeout  Connection Failed\\n" "$name"
    fi
  fi
}

# Batch check multiple services
# Usage: http_check_batch <service1_name> <service1_url> <service2_name> <service2_url> ...
http_check_batch() {
  local total=0
  local passed=0
  
  while [ $# -ge 2 ]; do
    local name="$1"
    local url="$2"
    shift 2
    
    total=$((total + 1))
    if http_check "$name" "$url" 5; then
      passed=$((passed + 1))
    fi
    http_check_print "$name" "$url" 5
  done
  
  echo ""
  echo "Summary: $passed/$total services operational"
  
  if [ $passed -eq $total ]; then
    return 0
  else
    return 1
  fi
}
