#!/bin/bash
# AI Tools Status
# Fetches status from the persistent AI status API (localhost:3002)

# Try to fetch from the status API
response=$(curl -s -w "\n%{http_code}" --max-time 5 "http://localhost:3002/status" 2>/dev/null)
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  # Parse JSON and format output
  echo "=== AI Tools Status ($(date '+%H:%M:%S')) ==="
  echo ""
  
  # Use jq if available, otherwise basic parsing
  if command -v jq >/dev/null 2>&1; then
    echo "$body" | jq -r '.services[] | "● \(.name | .[0:20])  \(.status | .[0:8])  \(if .responseTime then (.responseTime | tostring) + "ms" else "" end)"'
    echo ""
    healthy=$(echo "$body" | jq -r '.healthy')
    total=$(echo "$body" | jq -r '.total')
    echo "Health: $healthy/$total services operational"
  else
    # Fallback: just show the raw JSON
    echo "$body"
  fi
else
  echo "AI Status API is not available."
  echo "Make sure the server is running on port 3002."
  echo ""
  echo "HTTP Status: $http_code"
  exit 1
fi
