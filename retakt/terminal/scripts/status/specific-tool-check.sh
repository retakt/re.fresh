#!/bin/bash
# Check Specific AI Tool
# Usage: specific-tool-check.sh <tool-name>

if [ -z "$1" ]; then
  echo "Usage: specific-tool-check.sh <tool-name>"
  echo "Example: specific-tool-check.sh ollama"
  exit 1
fi

TOOL_NAME="$1"

# URL encode the tool name
ENCODED_TOOL=$(echo "$TOOL_NAME" | sed 's/ /%20/g')

# Try to fetch from the status API
response=$(curl -s -w "\n%{http_code}" --max-time 5 "http://localhost:3002/status/$ENCODED_TOOL" 2>/dev/null)
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  # Parse JSON and format output
  if command -v jq >/dev/null 2>&1; then
    name=$(echo "$body" | jq -r '.name')
    status=$(echo "$body" | jq -r '.status')
    response_time=$(echo "$body" | jq -r '.responseTime // "N/A"')
    healthy=$(echo "$body" | jq -r '.healthy')
    
    echo "$name: $status"
    if [ "$response_time" != "N/A" ]; then
      echo "Response Time: ${response_time}ms"
    fi
    
    if [ "$healthy" = "true" ]; then
      echo "Status: ✅ Operational"
    else
      echo "Status: 🔴 Down"
    fi
  else
    # Fallback: just show the raw JSON
    echo "$body"
  fi
elif [ "$http_code" = "404" ]; then
  echo "Tool \"$TOOL_NAME\" not found."
  
  # Try to get available tools
  if command -v jq >/dev/null 2>&1; then
    available=$(echo "$body" | jq -r '.available[]' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
    if [ -n "$available" ]; then
      echo "Available tools: $available"
    fi
  fi
else
  echo "AI Status API is not available."
  echo "Make sure the server is running on port 3002."
  echo ""
  echo "HTTP Status: $http_code"
  exit 1
fi
